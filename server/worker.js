/* LatoWarsim 聯機伺服器：房間的模擬執行緒。每個進行中的房間一條執行緒，執行完整模擬、整理各方看得到的戰場、執行玩家命令。 */
'use strict';
const {parentPort,workerData}=require('worker_threads');
const zlib=require('zlib');
const path=require('path');
const SIM=require(path.join(__dirname,'simcore.js'));
const E=SIM.E;
const F={};['mpFxOn','mpLoad','mpPack','mpQuick','mpTeams','mpBegin','mpDiff','mpFull','mpCmd','mpPatch','mpUnbase','mpDepOp','mpOrbIn','mpForcePts','simStep','replayPack','cmList'].forEach(function(k){F[k]=E(k);});
const DT=E('DT');
let dur0=0,set0=null,soPrev={},running=false,speed=60,acc=0,lastTick=Date.now(),snapMs=(workerData&&workerData.snapMs)||500,lastSnap=0,dirty=true,urgent=false,overSent=false,depth=0.4,realSp=0,spHist=[];
const subs=new Map();/* 連線編號 → {view:-1|0|1,cm,need:true} */
function G(){return SIM.getG();}
function post(m,tr){parentPort.postMessage(m,tr||[]);}
function pack(kind,obj){const buf=zlib.deflateRawSync(Buffer.from(JSON.stringify(obj)),{level:6});const out=Buffer.allocUnsafe(buf.length+1);out[0]=kind;buf.copy(out,1);return out;}
function sendBuf(conns,kind,obj){if(!conns.length)return;const b=pack(kind,obj);const ab=b.buffer.slice(b.byteOffset,b.byteOffset+b.length);post({op:'snap',conns:conns,kind:kind,buf:ab},[ab]);}
function info(){const g=G();if(!g||!g.map)return null;const S=g.sides;return {name:g.map.name,year:g.set.y,start:{y:g.set.y,m:g.set.m,d:g.set.d,h:g.set.h},dur:g.set.dur,dur0:dur0||g.set.dur,ffog:!!g.set.ffog,set:setPub(g.set),W:Math.round(g.map.Wm/100)/10,H:Math.round(g.map.Hm/100)/10,started:!!g.started,over:g.over||null,t:g.t,
  sides:[0,1].map(function(i){const L=F.cmList(i);return {name:S[i].name,color:S[i].color,edge:S[i].edge,pts:F.mpForcePts(i),units:g.units.filter(function(u){return u.side===i&&u.mix;}).length,cm:L.map(function(R){return {n:R.n,ai:!!R.ai,roots:R.roots.length};})};})};}
function sendInfo(){post({op:'info',info:info()});}
/* 送出各方的差異；新訂閱的連線先讓既有連線跟上，再送完整內容 */
function flush(force){const g=G();if(!g||!g.map)return;const views=new Map();subs.forEach(function(s,id){if(!views.has(s.view))views.set(s.view,{old:[],nw:[]});const v=views.get(s.view);if(s.need)v.nw.push([id,s]);else v.old.push(id);});
  views.forEach(function(v,view){try{if(v.old.length&&(dirty||force)){const d=F.mpDiff(view,false);if(d)sendBuf(v.old,2,d);}
    if(v.nw.length){v.nw.forEach(function(q){const s=q[1];const full=F.mpFull(view,s.cm,{view:view,cm:s.cm});sendBuf([q[0]],1,full);s.need=false;});}}catch(e){post({op:'log',msg:'snapshot error: '+(e&&e.stack||e)});}});dirty=false;lastSnap=Date.now();}
function checkOver(){const g=G();if(!g||!g.over||overSent)return;overSent=true;running=false;post({op:'over',over:g.over,info:info()});
  /* 揭曉：所有人改看完整戰場 */
  subs.forEach(function(s){s.view=-1;s.need=true;});flush(true);
  F.replayPack().then(function(P){post({op:'replay',data:JSON.stringify(P)});}).catch(function(e){post({op:'log',msg:'replay error: '+e.message});});}
/* 主迴圈：依速度推進模擬（每次最多 80 毫秒），定時送出差異 */
function tick(){const now=Date.now(),dt=Math.min(0.5,(now-lastTick)/1000);lastTick=now;const g=G();
  if(running&&g&&g.started&&!g.over){acc+=dt*speed;let n=Math.floor(acc/DT),done=0;const t0=Date.now();while(done<n&&Date.now()-t0<80){try{F.simStep();}catch(e){post({op:'log',msg:'simStep error: '+(e&&e.stack||e)});running=false;post({op:'stopped',why:String(e&&e.message||e)});break;}done++;if(g.over)break;}acc-=done*DT;if(acc>DT*4)acc=DT*4;if(done)dirty=true;
    spHist.push([now,done*DT]);spHist=spHist.filter(function(q){return now-q[0]<3000;});realSp=spHist.reduce(function(s,q){return s+q[1];},0)/3;checkOver();}
  let need=false;subs.forEach(function(s){if(s.need)need=true;});
  /* 玩家下令後盡快送出結果（最快 60 毫秒），不必等到下一次定時更新 */
  if(need||(dirty&&now-lastSnap>=snapMs)||(running&&now-lastSnap>=snapMs)||(urgent&&now-lastSnap>=60)){flush(false);urgent=false;}
  if(now-lastStat>1000){lastStat=now;if(g&&g.map)post({op:'tick',t:g.t,step:g.step,running:running,speed:speed,real:Math.round(realSp),over:!!g.over});}}
let lastStat=0;
/* ---------- 房間的模擬設定：房主在房間頁或「設定」分頁改的設定，以「路徑 → 值」覆寫想定原本的設定 ---------- */
const SOX=new Set(['seed','rfX','rfH','fog']);
function soOk(p){const k=String(p).split('.');if(!k.length||k.length>3||SOX.has(k[0]))return false;for(let i=0;i<k.length;i++){const q=k[i];if(i>0&&/^\d{1,3}$/.test(q))continue;if(!/^[A-Za-z][A-Za-z0-9]{0,31}$/.test(q)||q==='constructor'||q==='prototype')return false;}return true;}
function soGet(o,p){let x=o;for(const q of p.split('.')){if(x===null||typeof x!=='object'||!Object.prototype.hasOwnProperty.call(x,q))return undefined;x=x[q];}return x;}
function soSet(o,p,v){const k=p.split('.');let x=o;for(let i=0;i<k.length-1;i++){const q=k[i];if(x[q]===null||typeof x[q]!=='object')x[q]=/^\d+$/.test(k[i+1])?[]:{};x=x[q];}const l=k[k.length-1];if(v===null||v===undefined)delete x[l];else x[l]=JSON.parse(JSON.stringify(v));}
function setPub(s){const o={};for(const k in s){if(k!=='seed'&&k!=='rfX'&&k!=='rfH')o[k]=s[k];}return o;}
function setSnap(){const g=G();set0=g?JSON.parse(JSON.stringify(g.set)):null;soPrev={};}
/* 聯機時自動暫停會停下整個房間：預設全部關閉，由房主在設定裡開啟 */
function mpApOff(){const g=G();if(!g)return;const A=g.set.autoPause||(g.set.autoPause={});Object.keys(E('APDEF')).forEach(function(k){A[k]=false;});}
function hookPause(){const g=G();if(!g)return;g.onPause=function(why){if(!running)return;running=false;acc=0;post({op:'apause',why:String(why||'').slice(0,60)});};}
function applySo(so){const g=G();if(!g||!set0)return;const J=function(p){return JSON.stringify(soGet(g.set,p));},K=['wx','wxMode','nuke.n','snuke.n','engLock','tmCq0','lgRoadM','featY'],b={};K.forEach(function(p){b[p]=J(p);});
  Object.keys(soPrev).forEach(function(p){if(!Object.prototype.hasOwnProperty.call(so,p)&&soOk(p)){const v=soGet(set0,p);soSet(g.set,p,v===undefined?null:v);}});
  Object.keys(so).forEach(function(p){if(soOk(p))soSet(g.set,p,so[p]);});soPrev=Object.assign({},so);g.set.fog=true;
  /* 與單機版設定頁相同的附帶效果 */
  try{const ch=function(p){return b[p]!==J(p);};
    if((ch('wx')||ch('wxMode'))&&g.env&&g.set.wxMode==='fixed'){g.env.wx=E('WXI')[g.set.wx];E('envStep')(0);}
    if(ch('nuke.n')&&g.started&&g.set.nuke)g.sides.forEach(function(S){S.nk=g.set.nuke.n;});
    if(ch('snuke.n')&&g.started&&g.set.snuke)g.sides.forEach(function(S){S.snk=g.set.snuke.n;});
    if(ch('engLock')&&!g.set.engLock)E('EZ').list=[];
    if(ch('tmCq0'))[0,1].forEach(function(s){if(E('tmOn')(s)){const B=E('tmB')(s),v=+g.set.tmCq0||0;B.cq=v;B.lv=Math.min(E('tmCap')(s)||3,v>=0.75?3:v>=0.45?2:v>=0.15?1:0);}});
    if(ch('lgRoadM')){g.set.lgRoad=g.set.lgRoadM!=='off';g._lgpc=null;g.units.forEach(function(u){u._rbT=-1;});}
    if(ch('featY'))g._facP=null;}catch(e){post({op:'log',msg:'settings error: '+(e&&e.stack||e)});}
  dirty=true;}
/* 因時限結束的作戰：房主把時限延長到目前時間之後，作戰繼續（時間先暫停） */
function resumeIfLonger(){const g=G();if(!g||!g.over||g.over.why!=='時間到'||!(g.set.dur>0)||g.t>=g.set.dur*3600)return;g.over=null;overSent=false;running=false;acc=0;try{E('logE')(-1,'end','作戰時限延長到 '+g.set.dur+' 小時，作戰繼續。');}catch(e){}dirty=true;post({op:'resumed',info:info()});}
setInterval(tick,50);
function res(m,r){post({op:'res',conn:m.conn,id:m.id,r:r});dirty=true;urgent=true;}
parentPort.on('message',async function(m){try{switch(m.op){
  case 'load':{F.mpFxOn();F.simStep=E('simStep');await F.mpLoad(typeof m.save==='string'?JSON.parse(m.save):m.save);const g=G();g.set.fog=true;overSent=!!g.over;dur0=g.set.dur||0;mpApOff();setSnap();hookPause();sendInfo();post({op:'loaded',info:info()});break;}
  case 'quick':{F.mpFxOn();F.simStep=E('simStep');await F.mpQuick(m.k,m.seed);overSent=false;dur0=G().set.dur||0;mpApOff();setSnap();hookPause();sendInfo();post({op:'loaded',info:info()});break;}
  case 'tpls':{const g=G();if(!g)break;g.set.rfX=Array.isArray(m.list)?m.list:[];g.set.rfH=Array.isArray(m.hide)?m.hide:[];dirty=true;break;}
case 'teams':{(m.teams||[]).forEach(function(T,i){F.mpTeams(i,T.n,T.human);});dirty=true;sendInfo();break;}
  case 'cfg':{const g=G();if(!g)break;const c=m.cfg||{};if(c.dur>0)g.set.dur=c.dur;else if(c.dur===0&&dur0>0)g.set.dur=dur0;if(c.ffog!==undefined&&!!g.set.ffog!==!!c.ffog){g.set.ffog=!!c.ffog;if(!c.ffog)try{E('ffClear')();}catch(e){}}['rp','tech','rp0','rpDay','tp0','tpDay','leth','cbrn','ff','rfL'].forEach(function(k){if(c[k]!==undefined)g.set[k]=c[k];});if(c.so)applySo(c.so);if(c.depth)depth=c.depth;if(c.snapMs)snapMs=c.snapMs;dirty=true;sendInfo();resumeIfLonger();break;}
  case 'begin':{const r=F.mpBegin(depth);if(r.ok){running=false;acc=0;hookPause();}post({op:'begun',r:r,info:info()});dirty=true;break;}
  case 'run':{running=!!m.on;if(m.speed>0)speed=Math.min(86400,m.speed);lastTick=Date.now();acc=0;break;}
  case 'sub':{subs.set(m.conn,{view:m.view,cm:m.cm===undefined?-1:m.cm,need:true});break;}
  case 'unsub':{subs.delete(m.conn);break;}
  case 'cmd':{res(m,F.mpCmd(m.side,m.cm,m.fn,m.a));break;}
  case 'patch':{const r=F.mpPatch(m.side,m.cm,m.p);if(r.rej&&r.rej.length)F.mpUnbase(m.side,r.rej);res(m,r);break;}
  case 'dep':{res(m,F.mpDepOp(m.side,m.cm,m.dop,m.a,depth));sendInfo();break;}
  case 'orb':{res(m,F.mpOrbIn(m.side,m.cm,m.data,!!m.replace,depth));sendInfo();break;}
  case 'pack':{const P=await F.mpPack();post({op:'packed',req:m.req,data:JSON.stringify(P)});break;}
  case 'replay':{try{const P=await F.replayPack();post({op:'replay',req:m.req,data:JSON.stringify(P)});}catch(e){post({op:'replay',req:m.req,err:e.message});}break;}
  case 'end':{const g=G();if(g&&g.started&&!g.over){g.over={why:m.why||'房主結束作戰',win:-1,t:g.t,score:[0,0]};try{const sc=E('score');g.over.score=[sc(0),sc(1)];const w=g.over.score[0]>g.over.score[1]*1.15?0:g.over.score[1]>g.over.score[0]*1.15?1:-1;g.over.win=w;}catch(e){}}checkOver();break;}
  case 'zed':{const g=G();if(!g||!g.started||g.over)break;E('zedSpawnAt')({x:+m.x,y:+m.y,n:+m.n,k:String(m.k||''),nest:!!m.nest});dirty=true;break;}
  case 'evt':{const g=G();if(!g||!g.started||g.over)break;const K=E('EVK');if(!K[m.k])break;const o={};if(m.k==='quake'&&m.M>=4.5&&m.M<=8.5)o.M=+m.M;if(m.k==='fire'){o.x=g.map.Wm/2;o.y=g.map.Hm/2;}E('evtStart')(m.k,o);dirty=true;break;}
  case 'info':{sendInfo();break;}
}}catch(e){post({op:'log',msg:'worker error ('+m.op+'): '+(e&&e.stack||e)});if(m.conn!==undefined&&m.id!==undefined)post({op:'res',conn:m.conn,id:m.id,r:{err:'伺服器錯誤：'+(e&&e.message||e)}});if(m.op==='load'||m.op==='quick')post({op:'loaded',err:String(e&&e.message||e)});}});
post({op:'ready'});
