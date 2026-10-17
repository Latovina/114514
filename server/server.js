/* LatoWarsim 聯機伺服器（Node.js 18 以上，不需要安裝任何套件）
   - 帳號註冊、登入（密碼以 scrypt 雜湊保存），第一位註冊的使用者是管理員
   - 大廳、房間（房主自訂設定、席位、密碼）、聊天（全房間／本方）、地圖標示
   - 每個房間一條模擬執行緒：伺服器權威、雙方完全雙盲（每一方只收到自己看得到的戰場）
   - 回放自動錄製與下載、存檔、自動備份與重啟後恢復
   啟動：node server.js（設定檔 data/config.json，第一次啟動會自動建立） */
'use strict';
const http=require('http'),crypto=require('crypto'),fs=require('fs'),path=require('path'),zlib=require('zlib');
const {Worker}=require('worker_threads');
const VERSION='1.0.0';
const ROOT=__dirname,DATA=path.resolve(process.env.LATO_DATA||path.join(ROOT,'data'));
const MAXMSG=96*1024*1024;
/* ---------- 設定與資料檔 ---------- */
function mkdirp(p){try{fs.mkdirSync(p,{recursive:true});}catch(e){}}
mkdirp(DATA);mkdirp(path.join(DATA,'rooms'));mkdirp(path.join(DATA,'replays'));
function readJ(f,d){try{return JSON.parse(fs.readFileSync(path.join(DATA,f),'utf8'));}catch(e){return d;}}
function writeJ(f,o){const p=path.join(DATA,f),tmp=p+'.tmp';fs.writeFileSync(tmp,JSON.stringify(o,null,1));fs.renameSync(tmp,p);}
const CFG0={port:8080,host:'0.0.0.0',trustProxy:false,serverName:'LatoWarsim 聯機伺服器',allowRegister:true,invite:'',maxRooms:20,maxRoomsPerUser:2,motd:'歡迎！建立房間或加入一場作戰。',snapMs:500,autosaveMin:5,replayKeep:200,aiGraceSec:90};
let CFG=Object.assign({},CFG0,readJ('config.json',{}));writeJ('config.json',CFG);
if(process.env.PORT)CFG.port=+process.env.PORT;if(process.env.HOST)CFG.host=process.env.HOST;
const argv=process.argv.slice(2);for(let i=0;i<argv.length;i++){if(argv[i]==='--port')CFG.port=+argv[++i];if(argv[i]==='--host')CFG.host=argv[++i];}
let USERS=readJ('users.json',{seq:0,list:[]});
let SESS=readJ('sessions.json',{});
let REPL=readJ('replays.json',{seq:0,list:[]});
let saveT={};function saveSoon(f,get){if(saveT[f])return;saveT[f]=setTimeout(function(){saveT[f]=null;try{writeJ(f,get());}catch(e){console.error('write',f,e.message);}},400);}
const saveUsers=()=>saveSoon('users.json',()=>USERS),saveSess=()=>saveSoon('sessions.json',()=>SESS),saveRepl=()=>saveSoon('replays.json',()=>REPL);
/* ---------- 帳號 ---------- */
function hashPw(pw,salt){salt=salt||crypto.randomBytes(16).toString('hex');return {salt:salt,hash:crypto.scryptSync(String(pw),salt,64).toString('hex')};}
function checkPw(u,pw){try{const h=crypto.scryptSync(String(pw),u.salt,64);return crypto.timingSafeEqual(h,Buffer.from(u.hash,'hex'));}catch(e){return false;}}
function userByName(n){n=String(n||'').trim().toLowerCase();return USERS.list.find(u=>u.name.toLowerCase()===n);}
function userById(id){return USERS.list.find(u=>u.id===id);}
function pubUser(u){return u?{id:u.id,name:u.name,admin:!!u.admin}:null;}
function validName(n){n=String(n||'').trim();return n.length>=2&&n.length<=20&&!/[\u0000-\u001f<>"'`\\]/.test(n)?n:null;}
function newToken(uid){const t=crypto.randomBytes(24).toString('hex');SESS[t]={uid:uid,exp:Date.now()+30*86400000};saveSess();return t;}
function auth(tok){const s=tok&&SESS[tok];if(!s)return null;if(s.exp<Date.now()){delete SESS[tok];saveSess();return null;}const u=userById(s.uid);if(!u||u.banned)return null;return u;}
const RL=new Map();function rateOK(key,n,ms){const now=Date.now(),a=(RL.get(key)||[]).filter(t=>now-t<ms);if(a.length>=n){RL.set(key,a);return false;}a.push(now);RL.set(key,a);return true;}
/* 命令列工具：node server.js --reset-password 名稱 ／ --make-admin 名稱 */
(function(){const i=argv.indexOf('--reset-password'),j=argv.indexOf('--make-admin');if(i<0&&j<0)return;const name=argv[(i>=0?i:j)+1],u=userByName(name);if(!u){console.log('找不到使用者：'+name);process.exit(1);}
  if(i>=0){const pw=crypto.randomBytes(5).toString('hex'),h=hashPw(pw);u.salt=h.salt;u.hash=h.hash;u.banned=false;for(const t in SESS)if(SESS[t].uid===u.id)delete SESS[t];writeJ('sessions.json',SESS);console.log(u.name+' 的新密碼：'+pw);}
  if(j>=0){u.admin=true;u.banned=false;console.log(u.name+' 已設為管理員。');}writeJ('users.json',USERS);process.exit(0);})();
/* ---------- 網頁與 API ---------- */
let PAGE=null,PAGEZ=null,PAGEM=0;
const PUB=path.resolve(process.env.LATO_PUBLIC||path.join(ROOT,'public'));
function page(){const f=path.join(PUB,'index.html');try{const st=fs.statSync(f);if(!PAGE||st.mtimeMs!==PAGEM){PAGE=fs.readFileSync(f);PAGEZ=zlib.gzipSync(PAGE,{level:9});PAGEM=st.mtimeMs;}}catch(e){PAGE=Buffer.from('<!DOCTYPE html><meta charset="utf-8"><p>找不到 public/index.html。</p>');PAGEZ=null;}return PAGE;}
function sendJ(res,code,o){const b=Buffer.from(JSON.stringify(o));res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Content-Length':b.length,'Cache-Control':'no-store'});res.end(b);}
function readBody(req,max){return new Promise(function(ok,no){let n=0,a=[];req.on('data',function(d){n+=d.length;if(n>max){no(new Error('too large'));req.destroy();return;}a.push(d);});req.on('end',function(){try{ok(a.length?JSON.parse(Buffer.concat(a).toString('utf8')):{});}catch(e){no(e);}});req.on('error',no);});}
function bearer(req,q){const h=req.headers.authorization||'';const m=/^Bearer\s+(\S+)/.exec(h);return m?m[1]:q.get('token');}
function ip(req){return (CFG.trustProxy&&(req.headers['x-forwarded-for']||'').split(',')[0].trim())||req.socket.remoteAddress||'';}
const server=http.createServer(async function(req,res){const U=new URL(req.url,'http://x'),p=U.pathname,q=U.searchParams;
  try{
    if(req.method==='GET'&&(p==='/'||p==='/index.html')){const pg=page(),gz=PAGEZ&&/\bgzip\b/.test(req.headers['accept-encoding']||'');res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','Content-Length':gz?PAGEZ.length:pg.length,...(gz?{'Content-Encoding':'gzip'}:{})});res.end(gz?PAGEZ:pg);return;}
    if(p==='/favicon.ico'){res.writeHead(204);res.end();return;}
    if(p==='/api/info'){sendJ(res,200,{name:CFG.serverName,version:VERSION,allowRegister:!!CFG.allowRegister,invite:!!CFG.invite,motd:CFG.motd,users:USERS.list.length});return;}
    if(p==='/api/register'&&req.method==='POST'){if(!rateOK('reg|'+ip(req),5,600000)){sendJ(res,429,{err:'嘗試太頻繁，請稍後再試。'});return;}const b=await readBody(req,8192),name=validName(b.name);
      if(!CFG.allowRegister&&USERS.list.length){sendJ(res,403,{err:'伺服器目前不開放註冊，請洽管理員。'});return;}if(CFG.invite&&USERS.list.length&&b.invite!==CFG.invite){sendJ(res,403,{err:'邀請碼不正確。'});return;}
      if(!name){sendJ(res,400,{err:'名稱需 2–20 個字，不可含特殊符號。'});return;}if(String(b.pass||'').length<6){sendJ(res,400,{err:'密碼至少 6 個字元。'});return;}if(userByName(name)){sendJ(res,409,{err:'這個名稱已經有人使用。'});return;}
      const h=hashPw(b.pass),u={id:++USERS.seq,name:name,salt:h.salt,hash:h.hash,admin:USERS.list.length===0,created:Date.now(),last:Date.now(),banned:false};USERS.list.push(u);saveUsers();sendJ(res,200,{token:newToken(u.id),user:pubUser(u)});return;}
    if(p==='/api/login'&&req.method==='POST'){if(!rateOK('login|'+ip(req),10,60000)){sendJ(res,429,{err:'嘗試太頻繁，請稍後再試。'});return;}const b=await readBody(req,8192),u=userByName(b.name);
      if(!u||!checkPw(u,b.pass)){sendJ(res,401,{err:'名稱或密碼不正確。'});return;}if(u.banned){sendJ(res,403,{err:'這個帳號已被停用。'});return;}u.last=Date.now();saveUsers();sendJ(res,200,{token:newToken(u.id),user:pubUser(u)});return;}
    if(p==='/api/logout'&&req.method==='POST'){const t=bearer(req,q);if(t&&SESS[t]){delete SESS[t];saveSess();}sendJ(res,200,{ok:1});return;}
    if(p==='/api/password'&&req.method==='POST'){const u=auth(bearer(req,q));if(!u){sendJ(res,401,{err:'請先登入。'});return;}const b=await readBody(req,8192);if(!checkPw(u,b.old)){sendJ(res,403,{err:'舊密碼不正確。'});return;}if(String(b.pass||'').length<6){sendJ(res,400,{err:'新密碼至少 6 個字元。'});return;}const h=hashPw(b.pass);u.salt=h.salt;u.hash=h.hash;saveUsers();sendJ(res,200,{ok:1});return;}
    if(p==='/api/me'){const u=auth(bearer(req,q));sendJ(res,u?200:401,u?{user:pubUser(u)}:{err:'未登入'});return;}
    if(p==='/api/replays'){const u=auth(bearer(req,q));if(!u){sendJ(res,401,{err:'請先登入。'});return;}sendJ(res,200,{list:REPL.list.slice().reverse().map(r=>({id:r.id,name:r.name,room:r.room,date:r.date,sides:r.sides,size:r.size,win:r.win,why:r.why}))});return;}
    let m;
    if((m=/^\/api\/replay\/(\d+)$/.exec(p))){const u=auth(bearer(req,q));if(!u){sendJ(res,401,{err:'請先登入。'});return;}const r=REPL.list.find(x=>x.id===+m[1]);if(!r){sendJ(res,404,{err:'找不到回放。'});return;}
      const f=path.join(DATA,'replays',r.id+'.json.gz');if(!fs.existsSync(f)){sendJ(res,404,{err:'回放檔不存在。'});return;}const gz=/\bgzip\b/.test(req.headers['accept-encoding']||'');const fn=encodeURIComponent((r.name||'作戰')+'.latowarreplay.json');
      res.writeHead(200,{'Content-Type':'application/json','Content-Disposition':"attachment; filename*=UTF-8''"+fn,...(gz?{'Content-Encoding':'gzip'}:{})});if(gz)fs.createReadStream(f).pipe(res);else fs.createReadStream(f).pipe(zlib.createGunzip()).pipe(res);return;}
    if((m=/^\/api\/save\/(\w+)$/.exec(p))){const u=auth(bearer(req,q));const R=ROOMS.get(m[1]);if(!u||!R){sendJ(res,404,{err:'找不到房間。'});return;}if(!(u.admin||R.host===u.id&&R.phase==='over')){sendJ(res,403,{err:'作戰結束後房主才能下載完整存檔。'});return;}
      if(!R.w){sendJ(res,409,{err:'房間目前沒有作戰。'});return;}const data=await wreq(R,{op:'pack'},'packed');const fn=encodeURIComponent((R.scn&&R.scn.name||'作戰')+'.latowarsim.json');res.writeHead(200,{'Content-Type':'application/json','Content-Disposition':"attachment; filename*=UTF-8''"+fn});res.end(data.data);return;}
    if(p==='/api/admin'){const u=auth(bearer(req,q));if(!u||!u.admin){sendJ(res,403,{err:'需要管理員權限。'});return;}
      if(req.method==='GET'){sendJ(res,200,{cfg:CFG,users:USERS.list.map(x=>({id:x.id,name:x.name,admin:!!x.admin,banned:!!x.banned,created:x.created,last:x.last})),rooms:[...ROOMS.values()].map(roomPub),replays:REPL.list.length,mem:Math.round(process.memoryUsage().rss/1048576),up:Math.round(process.uptime())});return;}
      const b=await readBody(req,65536);sendJ(res,200,adminOp(u,b));return;}
    res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');
  }catch(e){console.error('http',p,e);try{sendJ(res,500,{err:'伺服器錯誤：'+e.message});}catch(e2){}}});
function adminOp(me,b){const u=b.uid?userById(+b.uid):null;switch(b.op){
  case 'cfg':{const c=b.cfg||{};['serverName','motd','invite'].forEach(k=>{if(typeof c[k]==='string')CFG[k]=c[k].slice(0,400);});['allowRegister'].forEach(k=>{if(c[k]!==undefined)CFG[k]=!!c[k];});['maxRooms','maxRoomsPerUser','snapMs','autosaveMin','replayKeep','aiGraceSec'].forEach(k=>{if(c[k]>0)CFG[k]=Math.round(+c[k]);});writeJ('config.json',CFG);lobbyAll();return {ok:1,cfg:CFG};}
  case 'ban':case 'unban':{if(!u||u.id===me.id)return {err:'不能對自己操作。'};u.banned=b.op==='ban';if(u.banned){for(const t in SESS)if(SESS[t].uid===u.id)delete SESS[t];saveSess();CONNS.forEach(c=>{if(c.uid===u.id)c.close();});}saveUsers();return {ok:1};}
  case 'admin':case 'unadmin':{if(!u||u.id===me.id)return {err:'不能對自己操作。'};u.admin=b.op==='admin';saveUsers();return {ok:1};}
  case 'reset':{if(!u)return {err:'找不到使用者。'};const pw=crypto.randomBytes(5).toString('hex'),h=hashPw(pw);u.salt=h.salt;u.hash=h.hash;for(const t in SESS)if(SESS[t].uid===u.id)delete SESS[t];saveSess();saveUsers();return {ok:1,pass:pw};}
  case 'deluser':{if(!u||u.id===me.id)return {err:'不能刪除自己。'};USERS.list=USERS.list.filter(x=>x!==u);for(const t in SESS)if(SESS[t].uid===u.id)delete SESS[t];saveSess();saveUsers();CONNS.forEach(c=>{if(c.uid===u.id)c.close();});return {ok:1};}
  case 'closeroom':{const R=ROOMS.get(String(b.room));if(!R)return {err:'找不到房間。'};closeRoom(R,'管理員關閉了房間');return {ok:1};}
  case 'delreplay':{const r=REPL.list.find(x=>x.id===+b.id);if(!r)return {err:'找不到回放。'};REPL.list=REPL.list.filter(x=>x!==r);try{fs.unlinkSync(path.join(DATA,'replays',r.id+'.json.gz'));}catch(e){}saveRepl();return {ok:1};}
  default:return {err:'未知的操作'};}}
/* ---------- WebSocket（RFC 6455，最小實作） ---------- */
const CONNS=new Map();let CSEQ=0;
class Conn{constructor(sock,req){this.id=++CSEQ;this.sock=sock;this.ip=ip(req);this.chunks=[];this.blen=0;this.need=0;this.frag=null;this.fragOp=0;this.alive=true;this.closed=false;this.uid=0;this.room=null;this.sent=0;
    sock.on('data',d=>this.feed(d));sock.on('close',()=>this.onclose());sock.on('error',()=>{});sock.on('drain',()=>{if(this.lag){this.lag=false;if(this.room)resub(this);}});}
  feed(d){this.chunks.push(d);this.blen+=d.length;if(this.need&&this.blen<this.need)return;let buf=this.chunks.length===1?this.chunks[0]:Buffer.concat(this.chunks,this.blen);let o=0;
    for(;;){if(buf.length-o<2)break;const b0=buf[o],b1=buf[o+1],fin=!!(b0&0x80),op=b0&15,mk=!!(b1&0x80);let len=b1&127,h=2;
      if(len===126){if(buf.length-o<4)break;len=buf.readUInt16BE(o+2);h=4;}else if(len===127){if(buf.length-o<10)break;if(buf.readUInt32BE(o+2)>0){this.close(1009);return;}len=buf.readUInt32BE(o+6);h=10;}
      if(len>MAXMSG){this.close(1009);return;}if(!mk){this.close(1002);return;}if(buf.length-o<h+4+len){this.need=h+4+len;break;}
      const key=buf.subarray(o+h,o+h+4),data=Buffer.allocUnsafe(len);buf.copy(data,0,o+h+4,o+h+4+len);for(let i=0;i<len;i++)data[i]^=key[i&3];o+=h+4+len;this.need=0;this.frame(fin,op,data);if(this.closed)return;}
    const rest=buf.subarray(o);this.chunks=rest.length?[Buffer.from(rest)]:[];this.blen=rest.length;if(this.need&&this.need<=this.blen)this.need=0;}
  frame(fin,op,data){if(op===8){this.close(1000);return;}if(op===9){this.raw(10,data);return;}if(op===10){this.alive=true;return;}
    if(op===0){if(!this.frag)return;this.frag.push(data);if(this.frag.reduce((s,b)=>s+b.length,0)>MAXMSG){this.close(1009);return;}if(fin){const all=Buffer.concat(this.frag);const fo=this.fragOp;this.frag=null;this.msg(fo,all);}return;}
    if(op===1||op===2){if(!fin){this.frag=[data];this.fragOp=op;return;}this.msg(op,data);}}
  msg(op,data){this.alive=true;let o;try{if(op===2){if(data[0]===1)data=zlib.gunzipSync(data.subarray(1),{maxOutputLength:MAXMSG*2});else data=data.subarray(1);}o=JSON.parse(data.toString('utf8'));}catch(e){this.sendJ({t:'err',msg:'無法解讀的訊息。'});return;}try{onMsg(this,o);}catch(e){console.error('msg',o&&o.t,e);this.sendJ({t:'err',msg:'伺服器錯誤：'+e.message});}}
  raw(op,p){if(this.closed)return false;const n=p.length;let h;if(n<126)h=Buffer.from([0x80|op,n]);else if(n<65536){h=Buffer.alloc(4);h[0]=0x80|op;h[1]=126;h.writeUInt16BE(n,2);}else{h=Buffer.alloc(10);h[0]=0x80|op;h[1]=127;h.writeUInt32BE(Math.floor(n/4294967296),2);h.writeUInt32BE(n>>>0,6);}
    this.sock.write(h);const ok=this.sock.write(p);this.sent+=n;return ok;}
  sendJ(o){return this.raw(1,Buffer.from(JSON.stringify(o)));}
  sendB(b){if(this.sock.writableLength>8*1024*1024){this.lag=true;return false;}return this.raw(2,b);}
  close(code){if(this.closed)return;try{const b=Buffer.alloc(2);b.writeUInt16BE(code||1000,0);this.raw(8,b);}catch(e){}this.closed=true;try{this.sock.end();}catch(e){}setTimeout(()=>{try{this.sock.destroy();}catch(e){}},1500);this.onclose();}
  onclose(){if(this.gone)return;this.gone=true;this.closed=true;CONNS.delete(this.id);if(this.room){const R=ROOMS.get(this.room);if(R)leaveRoom(this,R,true);}}}
server.on('upgrade',function(req,sock,head){const U=new URL(req.url,'http://x');if(U.pathname!=='/ws'||String(req.headers.upgrade||'').toLowerCase()!=='websocket'){sock.destroy();return;}const key=req.headers['sec-websocket-key'];if(!key){sock.destroy();return;}
  const acc=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+acc+'\r\n\r\n');sock.setNoDelay(true);
  const c=new Conn(sock,req);CONNS.set(c.id,c);const u=auth(U.searchParams.get('token'));if(!u){c.sendJ({t:'auth',err:'登入已過期，請重新登入。'});c.close(4001);return;}c.uid=u.id;c.name=u.name;c.admin=!!u.admin;u.last=Date.now();saveUsers();
  c.sendJ({t:'hello',user:pubUser(u),srv:{name:CFG.serverName,motd:CFG.motd,version:VERSION}});if(head&&head.length)c.feed(head);sendLobby(c);});
setInterval(function(){CONNS.forEach(function(c){if(!c.alive){c.close(1001);return;}c.alive=false;c.raw(9,Buffer.alloc(0));});},30000);
/* ---------- 房間 ---------- */
const ROOMS=new Map();let RSEQ=readJ('rooms.json',{seq:0}).seq||0;
const SPEEDS=[1,10,30,60,120,300,600,1800,3600,10800];
function rid(){return (++RSEQ).toString(36)+crypto.randomBytes(2).toString('hex');}
function defCfg(){return {name:'',pass:'',speed:60,depth:0.4,teams:[1,1],aiFill:true,aiTake:true,pause:'host',spect:false,rp:false,tech:false,rp0:800,rpDay:'auto',tp0:30,tpDay:20,dur:0,maxSpec:8};}
function mkSlots(R){const T=R.cfg.teams;R.slots=[0,1].map(function(s){const old=R.slots&&R.slots[s]||[],L=[];for(let i=0;i<T[s];i++)L.push(old[i]||{kind:'open',uid:0,name:'',auto:false});return L;});}
function memberOf(R,uid){return R.mem.get(uid);}
function roomPub(R){const mem=[...R.mem.values()].map(m=>({uid:m.uid,name:m.name,side:m.side,cm:m.cm,spec:!!m.spec,ready:!!m.ready,on:m.conns.size>0}));
  return {id:R.id,name:R.cfg.name,host:R.host,hostName:(userById(R.host)||{}).name||'',phase:R.phase,locked:!!R.cfg.pass,cfg:Object.assign({},R.cfg,{pass:R.cfg.pass?'***':''}),slots:R.slots,mem:mem,scn:R.scn,run:{on:!!R.running,speed:R.cfg.speed,t:R.t||0,real:R.real||0},over:R.over||null,replay:R.replay||0,created:R.created};}
function roomBrief(R){return {id:R.id,name:R.cfg.name,hostName:(userById(R.host)||{}).name||'',phase:R.phase,locked:!!R.cfg.pass,players:[...R.mem.values()].filter(m=>m.side>=0).length,members:R.mem.size,open:R.slots.reduce((n,L)=>n+L.filter(s=>s.kind==='open'&&!s.uid).length,0),scn:R.scn?{name:R.scn.name,year:R.scn.year,sides:R.scn.sides.map(S=>S.name)}:null,t:R.t||0};}
function persistRooms(){saveSoon('rooms.json',function(){return {seq:RSEQ,list:[...ROOMS.values()].map(R=>({id:R.id,host:R.host,cfg:R.cfg,phase:R.phase,slots:R.slots,scn:R.scn,created:R.created,over:R.over||null,replay:R.replay||0,hasSave:!!R.hasSave,t:R.t||0}))};});}
function sendLobby(c){c.sendJ({t:'lobby',rooms:[...ROOMS.values()].map(roomBrief),srv:{name:CFG.serverName,motd:CFG.motd,maxRooms:CFG.maxRooms},online:[...new Set([...CONNS.values()].map(x=>x.name).filter(Boolean))].slice(0,200)});}
let lobbyT=null;function lobbyAll(){if(lobbyT)return;lobbyT=setTimeout(function(){lobbyT=null;CONNS.forEach(c=>{if(!c.room&&c.uid)sendLobby(c);});},300);}
function roomAll(R){const P=roomPub(R);R.mem.forEach(m=>m.conns.forEach(c=>c.sendJ({t:'room',room:P,me:{side:m.side,cm:m.cm,spec:!!m.spec,host:m.uid===R.host}})));lobbyAll();persistRooms();}
function roomSay(R,o,filter){R.mem.forEach(m=>{if(filter&&!filter(m))return;m.conns.forEach(c=>c.sendJ(o));});}
function sysChat(R,txt){const o={t:'chat',ch:'room',from:'系統',txt:txt,time:Date.now()};R.chat.push(o);if(R.chat.length>200)R.chat.shift();roomSay(R,o);}
function newRoom(host,cfg){const R={id:rid(),host:host.id,cfg:Object.assign(defCfg(),cfg||{}),phase:'setup',mem:new Map(),slots:null,scn:null,w:null,chat:[],marks:{0:[],1:[]},mseq:0,created:Date.now(),t:0};R.cfg.name=String(R.cfg.name||host.name+' 的房間').slice(0,40);if(R.cfg.pass)R.cfg.pass=String(R.cfg.pass).slice(0,40);mkSlots(R);ROOMS.set(R.id,R);persistRooms();return R;}
function closeRoom(R,why){roomSay(R,{t:'kicked',msg:why||'房間已關閉'});R.mem.forEach(m=>m.conns.forEach(c=>{c.room=null;sendLobby(c);}));R.mem.clear();if(R.w){try{R.w.terminate();}catch(e){}R.w=null;}ROOMS.delete(R.id);try{fs.unlinkSync(path.join(DATA,'rooms',R.id+'.save.json.gz'));}catch(e){}persistRooms();lobbyAll();}
function joinRoom(c,R){if(c.room&&c.room!==R.id){const O=ROOMS.get(c.room);if(O)leaveRoom(c,O,false);}c.room=R.id;let m=memberOf(R,c.uid);if(!m){m={uid:c.uid,name:c.name,side:-1,cm:-1,spec:false,ready:false,conns:new Set(),off:0};R.mem.set(c.uid,m);}m.conns.add(c);m.off=0;
  /* 原本坐在席位上的玩家回來 */
  R.slots.forEach((L,s)=>L.forEach((S,i)=>{if(S.uid===c.uid){m.side=s;m.cm=i;if(S.auto){S.auto=false;teamsToWorker(R);}}}));
  c.sendJ({t:'joined',id:R.id,chat:R.chat.slice(-80)});roomAll(R);if(R.w&&R.phase!=='setup')subConn(c,R);sendMarks(R,m);}
function leaveRoom(c,R,disconnect){const m=memberOf(R,c.uid);if(R.w)R.w.postMessage({op:'unsub',conn:c.id});if(m){m.conns.delete(c);if(!m.conns.size){if(!disconnect){freeSlot(R,m);R.mem.delete(c.uid);teamsToWorker(R);}else m.off=Date.now();}}
  if(!disconnect){c.room=null;sendLobby(c);}
  if(!R.mem.size&&R.phase==='setup'&&!R.keep){ROOMS.delete(R.id);persistRooms();lobbyAll();return;}
  if(R.host===c.uid&&!R.mem.has(c.uid)){const nh=[...R.mem.values()].find(x=>x.conns.size);if(nh){R.host=nh.uid;sysChat(R,nh.name+' 成為新的房主。');}}roomAll(R);}
function freeSlot(R,m){R.slots.forEach(L=>L.forEach(S=>{if(S.uid===m.uid){S.uid=0;S.name='';}}));m.side=-1;m.cm=-1;m.ready=false;}
/* 席位：玩家 → 由玩家指揮；AI 或空位（開戰後）→ 由 AI 指揮 */
function teamsToWorker(R){if(!R.w)return;const pre=R.phase==='deploy';R.w.postMessage({op:'teams',teams:R.slots.map(L=>({n:L.length,human:L.map(S=>S.kind==='open'&&!S.auto&&(S.uid>0||pre))}))});}
function viewOf(R,m){if(R.phase==='over')return -1;if(m.side>=0)return m.side;if(m.spec&&(R.cfg.spect||R.phase==='over'))return -1;return null;}
function subConn(c,R){const m=memberOf(R,c.uid);if(!m||!R.w)return;const v=viewOf(R,m);if(v===null){R.w.postMessage({op:'unsub',conn:c.id});c.sendJ({t:'view',view:null});return;}c.sendJ({t:'view',view:v,cm:m.cm});R.w.postMessage({op:'sub',conn:c.id,view:v,cm:v>=0?(R.slots[v].length>1?m.cm:-1):-1});}
function resub(c){const R=ROOMS.get(c.room);if(R)subConn(c,R);}
function resubAll(R){R.mem.forEach(m=>m.conns.forEach(c=>subConn(c,R)));}
function sendMarks(R,m){[0,1].forEach(s=>{if(m.side===s||viewOf(R,m)===-1)m.conns.forEach(c=>c.sendJ({t:'marks',side:s,list:R.marks[s]}));});}
/* ---------- 模擬執行緒 ---------- */
const WREQ=new Map();let WSEQ=0;
function wreq(R,msg,reply){return new Promise(function(ok,no){const id=++WSEQ;msg.req=id;WREQ.set(id,{ok:ok,no:no,reply:reply});R.w.postMessage(msg);setTimeout(function(){if(WREQ.has(id)){WREQ.delete(id);no(new Error('逾時'));}},120000);});}
function startWorker(R){if(R.w)return R.w;const w=new Worker(path.join(ROOT,'worker.js'),{workerData:{snapMs:CFG.snapMs},resourceLimits:{maxOldGenerationSizeMb:3072}});R.w=w;
  w.on('message',function(m){switch(m.op){
    case 'snap':{const b=Buffer.from(m.buf);m.conns.forEach(id=>{const c=CONNS.get(id);if(c&&c.room===R.id)c.sendB(b);/* 太慢的連線會被跳過，緩衝清空後重新送完整內容 */});break;}
    case 'res':{const c=CONNS.get(m.conn);if(c)c.sendJ({t:'res',id:m.id,r:m.r});break;}
    case 'info':{R.scn=m.info;roomAll(R);break;}
    case 'loaded':{if(m.err){sysChat(R,'載入失敗：'+m.err);R.phase='setup';R.scn=null;try{w.terminate();}catch(e){}R.w=null;roomAll(R);break;}R.scn=m.info;if(R.phase==='setup')R.phase=m.info.started?(m.info.over?'over':'run'):'deploy';if(R.phase==='run'){R.running=false;}
      /* 採用想定本身的指揮官人數（房主之後可以再改） */
      R.cfg.teams=[m.info.sides[0].cm.length||1,m.info.sides[1].cm.length||1];mkSlots(R);R.mem.forEach(mm=>{if(mm.side>=0&&mm.cm>=R.slots[mm.side].length)freeSlot(R,mm);});
      teamsToWorker(R);cfgToWorker(R);roomAll(R);resubAll(R);break;}
    case 'begun':{if(m.r&&m.r.ok){R.phase='run';R.running=false;sysChat(R,'作戰開始！房主按下「開始」後時間開始流動。');R.scn=m.info;roomAll(R);resubAll(R);}else sysChat(R,'無法開戰：'+(m.r&&m.r.err||'未知原因'));break;}
    case 'tick':{const ch=R.t!==m.t||R.real!==m.real;R.t=m.t;R.real=m.real;if(ch){const o={t:'tick',gt:m.t,running:!!R.running,speed:R.cfg.speed,real:m.real};R.mem.forEach(mm=>mm.conns.forEach(c=>c.sendJ(o)));}break;}
    case 'stopped':{R.running=false;sysChat(R,'模擬發生錯誤而暫停：'+(m.why||''));roomAll(R);break;}
    case 'over':{R.phase='over';R.running=false;R.over=m.over;R.scn=m.info;sysChat(R,'作戰結束：'+(m.over.why||'')+(m.over.win>=0&&R.scn?'，'+R.scn.sides[m.over.win].name+'獲勝':'，不分勝負')+'。戰場已全面揭曉，回放整理中。');roomAll(R);resubAll(R);autosave(R);break;}
    case 'replay':{if(m.req&&WREQ.has(m.req)){const q=WREQ.get(m.req);WREQ.delete(m.req);if(m.err)q.no(new Error(m.err));else q.ok(m);break;}if(m.data)storeReplay(R,m.data);break;}
    case 'packed':{if(m.req&&WREQ.has(m.req)){const q=WREQ.get(m.req);WREQ.delete(m.req);q.ok(m);}break;}
    case 'log':{console.error('['+R.id+'] '+m.msg);break;}
  }});
  w.on('error',function(e){console.error('worker error',R.id,e);sysChat(R,'模擬執行緒發生錯誤：'+e.message);});
  w.on('exit',function(code){if(R.w===w){R.w=null;if(code!==0)sysChat(R,'模擬執行緒結束（'+code+'）。');}});return w;}
function cfgToWorker(R){if(!R.w)return;const c=R.cfg;R.w.postMessage({op:'cfg',cfg:{depth:c.depth,rp:c.rp,tech:c.tech,rp0:c.rp0,rpDay:c.rpDay,tp0:c.tp0,tpDay:c.tpDay,dur:c.dur>0?c.dur:undefined,snapMs:CFG.snapMs}});R.w.postMessage({op:'run',on:!!R.running,speed:c.speed});}
function storeReplay(R,data){try{const id=++REPL.seq,gz=zlib.gzipSync(Buffer.from(data));fs.writeFileSync(path.join(DATA,'replays',id+'.json.gz'),gz);const sc=R.scn||{};
  REPL.list.push({id:id,name:(sc.name||R.cfg.name||'作戰')+' '+new Date().toISOString().slice(0,10),room:R.cfg.name,date:Date.now(),sides:(sc.sides||[]).map(S=>S.name),size:gz.length,win:R.over?R.over.win:-1,why:R.over?R.over.why:''});
  while(REPL.list.length>CFG.replayKeep){const o=REPL.list.shift();try{fs.unlinkSync(path.join(DATA,'replays',o.id+'.json.gz'));}catch(e){}}saveRepl();R.replay=id;sysChat(R,'回放已儲存，可在房間或大廳的「回放」下載。');roomAll(R);}catch(e){console.error('replay',e);}}
async function autosave(R){if(!R.w||R.phase==='setup')return;try{const P=await wreq(R,{op:'pack'},'packed');fs.writeFileSync(path.join(DATA,'rooms',R.id+'.save.json.gz'),zlib.gzipSync(Buffer.from(P.data)));R.hasSave=true;persistRooms();}catch(e){console.error('autosave',R.id,e.message);}}
setInterval(function(){ROOMS.forEach(R=>{if(R.w&&(R.phase==='run'||R.phase==='deploy'))autosave(R);});},Math.max(1,CFG.autosaveMin)*60000);
/* 斷線太久的玩家：由 AI 暫代 */
setInterval(function(){const now=Date.now();ROOMS.forEach(R=>{if(R.phase!=='run'||!R.cfg.aiTake)return;let ch=false;R.mem.forEach(m=>{if(m.conns.size||!m.off||m.side<0)return;if(now-m.off>CFG.aiGraceSec*1000){const S=R.slots[m.side]&&R.slots[m.side][m.cm];if(S&&!S.auto){S.auto=true;ch=true;sysChat(R,m.name+' 斷線超過 '+CFG.aiGraceSec+' 秒，暫由 AI 代為指揮。');}}});if(ch){teamsToWorker(R);roomAll(R);}
  /* 房間裡的人都離線：作戰自動暫停 */
  if(R.phase==='run'&&R.running&&R.w&&![...R.mem.values()].some(x=>x.conns.size)){R.running=false;R.w.postMessage({op:'run',on:false,speed:R.cfg.speed});sysChat(R,'房間裡的人都已離線，作戰自動暫停。');roomAll(R);}
  /* 沒有人在線上的房間：尚未載入想定的十分鐘後關閉；有作戰的保留一天（可重新進入） */
  const on=[...R.mem.values()].some(x=>x.conns.size);if(!on){if(!R.empty)R.empty=now;else if(now-R.empty>(R.phase==='setup'?600000:86400000))closeRoom(R,'閒置');}else R.empty=0;});},5000);
/* ---------- 訊息處理 ---------- */
function isHost(c,R){return R&&(R.host===c.uid||c.admin);}
function onMsg(c,o){if(!c.uid)return;const R=c.room?ROOMS.get(c.room):null,m=R?memberOf(R,c.uid):null;
  switch(o.t){
  case 'lobby':sendLobby(c);return;
  case 'mkroom':{if(ROOMS.size>=CFG.maxRooms){c.sendJ({t:'err',msg:'伺服器的房間數已達上限（'+CFG.maxRooms+'）。'});return;}const mine=[...ROOMS.values()].filter(x=>x.host===c.uid).length;if(mine>=CFG.maxRoomsPerUser&&!c.admin){c.sendJ({t:'err',msg:'你最多只能同時開 '+CFG.maxRoomsPerUser+' 個房間。'});return;}
    const NR=newRoom(userById(c.uid),{name:o.name,pass:o.pass});joinRoom(c,NR);return;}
  case 'join':{const J=ROOMS.get(String(o.id));if(!J){c.sendJ({t:'err',msg:'房間不存在。'});return;}if(J.cfg.pass&&J.cfg.pass!==String(o.pass||'')&&!J.mem.has(c.uid)&&!c.admin){c.sendJ({t:'err',msg:'房間密碼不正確。',need:'pass',id:J.id});return;}joinRoom(c,J);return;}
  case 'leave':{if(R)leaveRoom(c,R,false);return;}
  case 'chat':{const txt=String(o.txt||'').slice(0,500).trim();if(!txt)return;if(!rateOK('chat|'+c.uid,8,5000)){c.sendJ({t:'err',msg:'訊息太頻繁。'});return;}
    if(!R){const x={t:'chat',ch:'lobby',from:c.name,txt:txt,time:Date.now()};CONNS.forEach(k=>{if(!k.room&&k.uid)k.sendJ(x);});return;}
    const ch=o.ch==='side'&&m.side>=0?'side':'room',x={t:'chat',ch:ch,side:ch==='side'?m.side:undefined,from:c.name,txt:txt,time:Date.now(),att:o.att&&typeof o.att==='object'?o.att:undefined};
    if(ch==='room'){R.chat.push(x);if(R.chat.length>200)R.chat.shift();roomSay(R,x);}else roomSay(R,x,mm=>mm.side===m.side||viewOf(R,mm)===-1);return;}
  }
  if(!R||!m){c.sendJ({t:'err',msg:'你不在房間裡。'});return;}
  const host=isHost(c,R);
  switch(o.t){
  case 'rcfg':{if(!host)return;const c2=o.cfg||{},C=R.cfg;if(typeof c2.name==='string')C.name=c2.name.slice(0,40)||C.name;if(typeof c2.pass==='string')C.pass=c2.pass.slice(0,40);
    if(SPEEDS.indexOf(+c2.speed)>=0){C.speed=+c2.speed;if(R.w)R.w.postMessage({op:'run',on:!!R.running,speed:C.speed});}if(c2.depth>=0.15&&c2.depth<=0.6)C.depth=+c2.depth;['aiFill','aiTake','spect','rp','tech'].forEach(k=>{if(c2[k]!==undefined)C[k]=!!c2[k];});if(c2.pause==='host'||c2.pause==='all')C.pause=c2.pause;
    ['rp0','tp0','tpDay'].forEach(k=>{if(c2[k]!==undefined&&isFinite(+c2[k]))C[k]=Math.max(0,Math.round(+c2[k]));});if(c2.rpDay!==undefined)C.rpDay=c2.rpDay==='auto'?'auto':Math.max(0,Math.round(+c2.rpDay||0));if(c2.dur!==undefined)C.dur=Math.max(0,Math.min(24*60,+c2.dur||0));
    if(Array.isArray(c2.teams)&&R.phase!=='run'&&R.phase!=='over'){C.teams=c2.teams.map(n=>Math.max(1,Math.min(3,n|0)));mkSlots(R);R.mem.forEach(mm=>{if(mm.side>=0&&mm.cm>=R.slots[mm.side].length)freeSlot(R,mm);});teamsToWorker(R);}
    cfgToWorker(R);roomAll(R);return;}
  case 'slotkind':{if(!host)return;const S=R.slots[o.side]&&R.slots[o.side][o.cm];if(!S)return;S.kind=o.kind==='ai'?'ai':'open';if(S.kind==='ai'&&S.uid){const mm=memberOf(R,S.uid);if(mm){mm.side=-1;mm.cm=-1;mm.conns.forEach(k=>subConn(k,R));}S.uid=0;S.name='';}S.auto=false;teamsToWorker(R);roomAll(R);return;}
  case 'take':{const S=R.slots[o.side]&&R.slots[o.side][o.cm];if(!S||S.kind!=='open'||S.uid&&S.uid!==c.uid){c.sendJ({t:'err',msg:'這個席位不能選擇。'});return;}if(R.phase==='run'&&m.side>=0&&m.side!==o.side){c.sendJ({t:'err',msg:'作戰中不能換到另一方。'});return;}
    freeSlot(R,m);S.uid=c.uid;S.name=c.name;S.auto=false;m.side=o.side;m.cm=o.cm;m.spec=false;m.ready=false;teamsToWorker(R);roomAll(R);m.conns.forEach(k=>subConn(k,R));sendMarks(R,m);return;}
  case 'untake':{if(R.phase==='run'){c.sendJ({t:'err',msg:'作戰中離開席位請直接離開房間（可由 AI 代管）。'});return;}freeSlot(R,m);teamsToWorker(R);roomAll(R);m.conns.forEach(k=>subConn(k,R));return;}
  case 'spec':{if(!R.cfg.spect&&R.phase!=='over'&&!host){c.sendJ({t:'err',msg:'房主未開放觀戰。'});return;}if(R.phase==='run'&&m.side>=0){c.sendJ({t:'err',msg:'作戰中的玩家不能改為觀戰。'});return;}freeSlot(R,m);m.spec=!!o.on;teamsToWorker(R);roomAll(R);m.conns.forEach(k=>subConn(k,R));return;}
  case 'ready':{m.ready=!!o.v;roomAll(R);return;}
  case 'kick':{if(!host||o.uid===c.uid)return;const mm=memberOf(R,+o.uid);if(!mm)return;freeSlot(R,mm);mm.conns.forEach(k=>{k.sendJ({t:'kicked',msg:'你被請出房間。'});leaveRoom(k,R,false);});R.mem.delete(+o.uid);teamsToWorker(R);roomAll(R);return;}
  case 'scn':{if(!host)return;if(R.phase==='run'){c.sendJ({t:'err',msg:'作戰進行中不能更換想定；請先結束作戰。'});return;}if(!o.save||o.save.format!=='LatoWarsim'){c.sendJ({t:'err',msg:'這不是作戰模擬存檔（.latowarsim.json）。'});return;}
    resetGame(R);startWorker(R);sysChat(R,c.name+' 上傳了想定，載入中…');R.w.postMessage({op:'load',save:o.save});return;}
  case 'quick':{if(!host)return;if(R.phase==='run'){c.sendJ({t:'err',msg:'作戰進行中不能更換想定。'});return;}resetGame(R);startWorker(R);sysChat(R,c.name+' 選擇了快速想定，建立中…');R.w.postMessage({op:'quick',k:String(o.k||'s1943'),seed:o.seed});return;}
  case 'begin':{if(!host||R.phase!=='deploy'||!R.w)return;for(const L of R.slots)for(const S of L){if(S.kind==='open'&&!S.uid){if(R.cfg.aiFill)S.kind='ai';else{c.sendJ({t:'err',msg:'還有空的席位；請等玩家加入，或改由 AI 指揮。'});return;}}}
    R.phase='deploy';teamsToWorkerFinal(R);cfgToWorker(R);R.w.postMessage({op:'begin'});return;}
  case 'run':{if(R.phase!=='run'||!R.w)return;if(!(host||R.cfg.pause==='all'&&m.side>=0)){c.sendJ({t:'err',msg:'只有房主可以暫停或繼續。'});return;}R.running=!!o.on;R.w.postMessage({op:'run',on:R.running,speed:R.cfg.speed});sysChat(R,c.name+(R.running?' 繼續作戰。':' 暫停作戰。'));roomAll(R);return;}
  case 'end':{if(!host||R.phase!=='run'||!R.w)return;R.w.postMessage({op:'end',why:'房主結束作戰'});return;}
  case 'reset':{if(!host||R.phase!=='over')return;resetGame(R);roomAll(R);return;}
  case 'cmd':case 'patch':case 'dep':case 'orb':{if(!R.w||m.side<0){c.sendJ({t:'res',id:o.id,r:{err:'你沒有指揮的席位。'}});return;}
    if(o.t!=='cmd'&&o.t!=='patch'&&R.phase!=='deploy'){c.sendJ({t:'res',id:o.id,r:{err:'只能在部署階段操作。'}});return;}if((o.t==='cmd'||o.t==='patch')&&R.phase!=='run'&&!(o.t==='cmd'&&o.fn==='cmAssign')){if(R.phase!=='deploy'||o.t==='cmd'){c.sendJ({t:'res',id:o.id,r:{err:'作戰尚未開始。'}});return;}}
    const S=R.slots[m.side]&&R.slots[m.side][m.cm];if(!S||S.uid!==c.uid){c.sendJ({t:'res',id:o.id,r:{err:'你沒有指揮的席位。'}});return;}const cm=R.slots[m.side].length>1?m.cm:-1;
    if(o.t==='cmd')R.w.postMessage({op:'cmd',conn:c.id,id:o.id,side:m.side,cm:cm,fn:String(o.fn||''),a:o.a||[]});
    else if(o.t==='patch')R.w.postMessage({op:'patch',conn:c.id,id:o.id,side:m.side,cm:cm,p:o.p||{}});
    else if(o.t==='dep')R.w.postMessage({op:'dep',conn:c.id,id:o.id,side:m.side,cm:cm,dop:String(o.op||''),a:o.a||{}});
    else R.w.postMessage({op:'orb',conn:c.id,id:o.id,side:m.side,cm:cm,data:o.data,replace:!!o.replace});return;}
  case 'mark':{const s=m.side;if(s<0)return;const L=R.marks[s];if(o.op==='add'&&o.m){const k=['atk','def','sup','txt','obs'].indexOf(o.m.k)>=0?o.m.k:'txt';L.push({id:++R.mseq,k:k,x:+o.m.x||0,y:+o.m.y||0,txt:String(o.m.txt||'').slice(0,60),by:c.name,time:Date.now(),gt:R.t||0});if(L.length>80)L.shift();}
    else if(o.op==='del')R.marks[s]=L.filter(q=>q.id!==+o.id);else if(o.op==='clear'&&host)R.marks[s]=[];
    R.mem.forEach(mm=>{if(mm.side===s||viewOf(R,mm)===-1)mm.conns.forEach(k=>k.sendJ({t:'marks',side:s,list:R.marks[s]}));});return;}
  case 'resync':{subConn(c,R);return;}
  default:c.sendJ({t:'err',msg:'未知的指令：'+o.t});}}
function teamsToWorkerFinal(R){if(!R.w)return;R.w.postMessage({op:'teams',teams:R.slots.map(L=>({n:L.length,human:L.map(S=>S.kind==='open'&&S.uid>0)}))});}
function resetGame(R){if(R.w){try{R.w.terminate();}catch(e){}R.w=null;}R.phase='setup';R.scn=null;R.running=false;R.over=null;R.replay=0;R.t=0;R.marks={0:[],1:[]};R.slots.forEach(L=>L.forEach(S=>{S.auto=false;}));R.mem.forEach(m=>{m.ready=false;});try{fs.unlinkSync(path.join(DATA,'rooms',R.id+'.save.json.gz'));}catch(e){}R.hasSave=false;}
/* ---------- 啟動：恢復上次的房間 ---------- */
(function restore(){const D=readJ('rooms.json',{list:[]});(D.list||[]).forEach(function(o){if(o.phase==='setup')return;const f=path.join(DATA,'rooms',o.id+'.save.json.gz');if(!fs.existsSync(f))return;
  const R={id:o.id,host:o.host,cfg:Object.assign(defCfg(),o.cfg||{}),phase:'setup',mem:new Map(),slots:o.slots,scn:o.scn,w:null,chat:[],marks:{0:[],1:[]},mseq:0,created:o.created||Date.now(),t:o.t||0,over:o.over||null,replay:o.replay||0,hasSave:true,keep:true};
  if(!R.slots)mkSlots(R);ROOMS.set(R.id,R);try{const save=JSON.parse(zlib.gunzipSync(fs.readFileSync(f)).toString('utf8'));startWorker(R);R.w.postMessage({op:'load',save:save});console.log('恢復房間',R.id,R.cfg.name);}catch(e){console.error('restore',R.id,e.message);ROOMS.delete(R.id);}});persistRooms();})();
server.listen(CFG.port,CFG.host,function(){console.log(CFG.serverName+' '+VERSION+' 已啟動：http://'+(CFG.host==='0.0.0.0'?'localhost':CFG.host)+':'+CFG.port+'/  資料夾：'+DATA);});
function shutdown(){console.log('關閉中，儲存進行中的作戰…');const L=[...ROOMS.values()].filter(R=>R.w&&R.phase!=='setup');Promise.all(L.map(autosave)).then(function(){try{writeJ('users.json',USERS);writeJ('sessions.json',SESS);writeJ('replays.json',REPL);}catch(e){}process.exit(0);});setTimeout(function(){process.exit(0);},15000);}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
