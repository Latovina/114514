/* LatoWarsim 聯機伺服器：房間的模擬執行緒。每個進行中的房間一條執行緒，執行完整模擬、整理各方看得到的戰場、執行玩家命令。 */
'use strict';
const {parentPort,workerData}=require('worker_threads');
const zlib=require('zlib');
const path=require('path');
const SIM=require(path.join(__dirname,'simcore.js'));
const E=SIM.E;
const F={};['mpLoad','mpPack','mpQuick','mpTeams','mpBegin','mpDiff','mpFull','mpCmd','mpPatch','mpUnbase','mpDepOp','mpOrbIn','mpForcePts','simStep','replayPack','cmList'].forEach(function(k){F[k]=E(k);});
const DT=E('DT');
let running=false,speed=60,acc=0,lastTick=Date.now(),snapMs=(workerData&&workerData.snapMs)||500,lastSnap=0,dirty=true,overSent=false,depth=0.4,realSp=0,spHist=[];
const subs=new Map();/* 連線編號 → {view:-1|0|1,cm,need:true} */
function G(){return SIM.getG();}
function post(m,tr){parentPort.postMessage(m,tr||[]);}
function pack(kind,obj){const buf=zlib.deflateRawSync(Buffer.from(JSON.stringify(obj)),{level:6});const out=Buffer.allocUnsafe(buf.length+1);out[0]=kind;buf.copy(out,1);return out;}
function sendBuf(conns,kind,obj){if(!conns.length)return;const b=pack(kind,obj);const ab=b.buffer.slice(b.byteOffset,b.byteOffset+b.length);post({op:'snap',conns:conns,kind:kind,buf:ab},[ab]);}
function info(){const g=G();if(!g||!g.map)return null;const S=g.sides;return {name:g.map.name,year:g.set.y,start:{y:g.set.y,m:g.set.m,d:g.set.d,h:g.set.h},dur:g.set.dur,W:Math.round(g.map.Wm/100)/10,H:Math.round(g.map.Hm/100)/10,started:!!g.started,over:g.over||null,t:g.t,
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
  if(need||(dirty&&now-lastSnap>=snapMs)||(running&&now-lastSnap>=snapMs))flush(false);
  if(now-lastStat>1000){lastStat=now;if(g&&g.map)post({op:'tick',t:g.t,step:g.step,running:running,speed:speed,real:Math.round(realSp),over:!!g.over});}}
let lastStat=0;
setInterval(tick,50);
function res(m,r){post({op:'res',conn:m.conn,id:m.id,r:r});dirty=true;}
parentPort.on('message',async function(m){try{switch(m.op){
  case 'load':{await F.mpLoad(typeof m.save==='string'?JSON.parse(m.save):m.save);const g=G();g.set.fog=true;overSent=!!g.over;sendInfo();post({op:'loaded',info:info()});break;}
  case 'quick':{await F.mpQuick(m.k,m.seed);overSent=false;sendInfo();post({op:'loaded',info:info()});break;}
  case 'teams':{(m.teams||[]).forEach(function(T,i){F.mpTeams(i,T.n,T.human);});dirty=true;sendInfo();break;}
  case 'cfg':{const g=G();if(!g)break;const c=m.cfg||{};if(c.dur>0)g.set.dur=c.dur;['rp','tech','rp0','rpDay','tp0','tpDay','leth','cbrn','ff'].forEach(function(k){if(c[k]!==undefined)g.set[k]=c[k];});if(c.depth)depth=c.depth;if(c.snapMs)snapMs=c.snapMs;dirty=true;sendInfo();break;}
  case 'begin':{const r=F.mpBegin(depth);if(r.ok){running=false;acc=0;}post({op:'begun',r:r,info:info()});dirty=true;break;}
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
  case 'info':{sendInfo();break;}
}}catch(e){post({op:'log',msg:'worker error ('+m.op+'): '+(e&&e.stack||e)});if(m.conn!==undefined&&m.id!==undefined)post({op:'res',conn:m.conn,id:m.id,r:{err:'伺服器錯誤：'+(e&&e.message||e)}});if(m.op==='load'||m.op==='quick')post({op:'loaded',err:String(e&&e.message||e)});}});
post({op:'ready'});
