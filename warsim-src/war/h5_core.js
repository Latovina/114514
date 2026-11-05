/* ===================== 模擬主迴圈：士氣、疲勞、補給、目標點、勝負、增援、司令部重建；新局與狀態 ===================== */
function newSide(i){return i===0?{name:'藍軍',color:'#2B6CD4',edge:'W',ai:false,depots:[]}:i===2?{name:'綠軍',color:'#2E9D57',edge:'N',ai:true,depots:[]}:{name:'紅軍',color:'#D23B3B',edge:'E',ai:true,depots:[]};}
/* 自動暫停：所有觸發條件與預設值（設定頁與作戰頁的工具列共用） */
var APDEF={contact:true,meet:true,rout:false,hq:true,obj:true,reinf:false,end:true,nuke:true,snuke:true,strike:false,evt:true,crime:false,att:false,convoy:true,req:true};
function apOn(k){var A=G.set.autoPause||{};return A[k]!==undefined?!!A[k]:!!APDEF[k];}
function newGame(MP,set){var g={v:1,format:'LatoWarsim',map:MP,units:[],types:{},imgs:{},sides:[newSide(0),newSide(1)],
    set:Object.assign({y:MP.year||1943,m:6,d:6,h:5,mi:0,dur:24,wxMode:'auto',wx:'clear',delayMul:1,fog:true,seed:MP.seed+'|g',ini:true,aiLvl:1,end:'time',tiers:[2000,20000,200000],
      autoPause:Object.assign({},APDEF),nuke:{on:false,n:2,y:10,ai:false},autoArt:false,rec:true,dynMor:true,beh:true,ctr:true,
      civ:true,evac:'part',wealth:'mid',loy:'home',mob:'mid',cur:{n:'元',per:60000},evt:{on:true,freq:1,clim:true,quake:'auto',disc:true,dis:true,gue:true,short:true,pers:true,wel:true},press:true},set||{}),
    t:0,step:0,log:[],msgs:[],pq:[],ct:[{},{}],rq:[[],[]],cbq:[],_fx:[],obj:[],reinfLog:[],bt:{list:[],byUnit:{},seq:0},stats:[stat0(),stat0()],nid:0,oid:0,mid:0,_tv:1,_mapv:0,_inc:{},started:false,over:null};
  return g;}
function stat0(){return {cas:0,vl:0,capt:0,sorties:0};}
/* 開戰準備：初始化每個單位的戰鬥狀態 */
function prepareBattle(){G._r=mb32(hstr(G.set.seed+'|sim'));reix();G._tv++;G.units.forEach(function(u){var s=ST(u);if(u.men0===undefined)initStrength(u);if(u.prof!==undefined&&PROF[u.prof])u.trn=PROF[u.prof][2];u.ms=u.ms||'ok';u.form=u.form||'deployed';u.task=u.task||'hold';u.sup=u.sup||0;u.fat=u.fat||0;u.org=u.org===undefined?100:u.org;u.ammo=u.ammo===undefined?100:u.ammo;
    if(!u.lg)logInit(u);else logRecalc(u);if(u.st!=='off'&&u.st!=='dead'){if(s.dom==='air'&&isLeaf(u)){u.st='base';u.base=u.base||[u.x,u.y];u.fuel=endOf(s);}else u.st='ok';u.ent=Math.max(u.ent||0,ftEnt(u));}if(!u.home)u.home=[u.x,u.y];});
  dupNames();SIDES().forEach(function(i){var S=G.sides[i];if(!S.ration){var hq=sideCmd(i);S.ration=defRation(hq?uEra(hq).y:G.set.y);}if(!S.nodes||!S.nodes.length){S.nodes=[];defaultNodes(i);}});G.units.forEach(function(u){if(u.lg)logRecalc(u);});envInit();if(G.set.civ!==false)civInit();evtInit();G.units.forEach(function(u){if(isLeaf(u)&&ST(u).dom==='land')disInit(u);});if(typeof v4Init==='function')v4Init();G.started=true;logE(-1,'start','作戰開始：'+clockTxt(now())+'，'+WX[G.env.wx][1]+'，氣溫 '+fx(G.env.T,0)+' °C，'+(G.env.phase==='day'?'白天':G.env.phase==='night'?'夜間':G.env.phase==='dawn'?'黎明':'黃昏'));}
function sideStr(side){var m=0,m0=0;G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||u.st==='off'||u.irr)return;var fl=ST(u).fl;if(fl.indexOf('u')>=0||fl.indexOf('G')>=0)return;m+=u.st==='dead'?0:u.men+u.veh*8;m0+=u.men0+u.veh0*8;});return {m:m,m0:m0,f:m0?m/m0:0};}
/* ---------- 一步（30 秒） ---------- */
function simStep(){if(G.over)return;G.t+=DT;G.step++;envStep(DT);
  G.units.forEach(function(u){if(u.st==='off'&&u.arr&&reinfDue(u)&&(u.p<0||uById(u.p).st!=='off'))arriveUnit(u);});
  hqRebuild();msgStep();pendStep();pathStep();if(G.step%2===1||G.step<3)spotStep();else gridBuild();reportStep();
  G.units.forEach(function(u){if(!alive(u))return;if(isLeaf(u))leafStep(u);else if(!u.hqLost)hqStep(u);else{var L=leavesOf(u).filter(onMap);if(L.length){var c=centroid(L);u.x=c[0];u.y=c[1];}}});
  fireStep();assaultStep();artyStep();if(typeof v6Pre==='function')v6Pre();airFight();projStep();if(typeof v5Step==='function')v5Step();if(typeof v6Step==='function')v6Step();applyDamage();moraleStep();fatigueStep();cbStep();if(G.civ)civStep();if(G.evt)evtStep();if(G.step%20===15){trebStep();sgStep();}if(G.step%20===7)polDyn();if(G.step%20===13)roadStep();if(G.step%20===17&&typeof drawSweep==='function')drawSweep();if(G.meets&&G.step%10===3)meetStep();if(G.press&&G.step%20===10)pressStep();
  if(G.step%20===0)logStep();if(G.step%4===0)objStep();if(G.set.ini&&G.step%20===10)initiativeStep();
  G.sides.forEach(function(S,i){if(S.ai&&G.step%40===(i*20+5)%40){if(G.set.ai2===false)aiStep(i);else cmdrStep(i);}});btStep();if(G.step%20===0)frontStep();recStep();checkEnd();}
/* ---------- 士氣：傷亡、壓制、恐懼光環、孤立、失去司令部；脫離接觸後回復 ---------- */
function moraleStep(){var fearSrc=G.units.filter(function(u){return onMap(u)&&ST(u).fl.indexOf('F')>=0;}),dyn=G.set.dynMor!==false,chk=G.step%4===2;
  fearSrc._B=new Map();fearSrc.forEach(function(f,i){var k=(Math.floor(f.x/1500)+5000)*20000+Math.floor(f.y/1500)+5000,L=fearSrc._B.get(k);if(!L)fearSrc._B.set(k,L=[]);L.push(i);});
  G.units.forEach(function(u){if(!onMap(u))return;var s=ST(u),off=offOf(u),uf=G.t-(u.uf||-1e9)<120,PF=profOf(u);if(u.mf)for(var mk in u.mf){u.mf[mk]*=0.95;if(Math.abs(u.mf[mk])<0.05)delete u.mf[mk];}if(u.rcas)u.rcas=u.rcas>1e-4?u.rcas*0.96:0;
    if(dyn&&chk&&isLeaf(u)&&s.dom==='land'&&uf&&surrounded(u))u.encT=G.t;
    u.mor=clamp(u.mor+morDelta(u,s,off,PF,uf,fearSrc),0,100);var stub=hasQ(off,'stubborn')&&u.ord&&/defend|halt/.test(u.ord.k),hf=optOf(u).post==='holdfast',rt=PF[7]*(stub?0.6:1)*(hf?0.6:1)*(typeof ironRt==='function'?ironRt(u):1),shT=Math.min(rt+20,s.mor*0.85);
    if(u.ms==='ok'&&u.mor<shT){u.ms='shaken';logE(u.side,'morale',uName(u)+'士氣動搖'+(dyn&&morTxt(u)?'（'+morTxt(u)+'）':''),u.x,u.y,u.id);}
    else if(u.ms!=='rout'&&u.mor<rt&&s.dom!=='air'){goRout(u,s);}
    else if(u.ms==='shaken'&&u.mor>=shT+10)u.ms='ok';
    if(dyn){if(chk&&alive(u))morDecide(u,s,off,PF,uf,rt,shT);}
    else if(u.ms==='rout'&&s.dom!=='air'&&u._ed<300){var fr=strFrac(u),enc=surrounded(u),pc=(fr<0.5?0.008:0.0015)*(enc?4:1)*(u.besieged&&G.t-u.besieged<1200?3:1)*(s.mobi>=3&&lgSpeed(u)>0.5?0.3:1)*(s.dom!=='land'?0.2:1);if(rnd()<pc)destroy(u,'capt');}
    if(!alive(u))return;if(u.sup>0)u.sup=Math.max(0,u.sup-(uf?0.5:1.5));if(G.t-(u.uf||-1e9)>600&&u.org<100)u.org=Math.min(100,u.org+0.1);});}
/* ---------- 疲勞 ---------- */
function fatigueStep(){var night=G.env.light<0.3;G.units.forEach(function(u){if(!onMap(u))return;var s=ST(u),mv=G.t-(u.movedAt||-1e9)<DT+1,cb=G.t-(u.fired||-1e9)<DT+1||G.t-(u.uf||-1e9)<DT+1,d=0;
    if(mv)d+=(s.mobi===0?0.12*(u.lg&&u.lg.ld?clamp(1+(u.lg.ld-30)/50,0.8,1.6):1):s.mobi===1?0.1:s.dom==='land'?0.05:0.02)*paceOf(u)[3];if(cb)d+=0.08;if(night&&(mv||cb))d+=0.05;if(!mv&&!cb)d-=u.ord&&u.ord.k==='rest'?0.25:0.06;u.fat=clamp(u.fat+d,0,100);});}
/* ---------- 目標點：單方地面部隊在範圍內 10 分鐘即取得控制 ---------- */
function objStep(){(G.obj||[]).forEach(function(ob){var n=sA0(),R=obR(ob);gridNear(ob.x,ob.y,R,function(u){if(!onMap(u)||u.ms==='rout'||ST(u).dom==='air'||u.st==='air')return;if(dist(u.x,u.y,ob.x,ob.y)<=R)n[u.side]+=u.men+u.veh*8;});
    var hold=-1,np=0;for(var hi=0;hi<n.length;hi++)if(n[hi]>0){np++;hold=hi;}if(np!==1)hold=-1;if(hold>=0&&ob.own!==hold){if(ob.cand!==hold){ob.cand=hold;ob.ct=G.t;}else if(G.t-ob.ct>=objCapT()){var prev=ob.own;ob.own=hold;ob.tOwn=G.t;logE(hold,'obj',G.sides[hold].name+'佔領目標「'+ob.name+'」'+(prev>=0?'（自'+G.sides[prev].name+'手中奪取）':''),ob.x,ob.y);if(G.onPause&&apOn('obj'))G.onPause('目標易手');}}else if(hold<0||ob.own===hold){ob.cand=-1;}});}
/* ---------- 司令部重建 ---------- */
function hqRebuild(){G.units.forEach(function(F){if(!F.hqLost||!alive(F)||G.t<F.hqRe)return;var L=leavesOf(F).filter(onMap);if(!L.length)return;F.hqLost=0;F.men=F.men0*0.6;F.veh=F.veh0*0.6;var c=centroid(L);F.x=c[0];F.y=c[1];logE(F.side,'hq',uName(F)+'的司令部完成重建',F.x,F.y,F.id);});}
/* ---------- 勝負 ---------- */
function score(side){var s=0,ow=typeof gmObjW==='function'?gmObjW():1;(G.obj||[]).forEach(function(o){if(o.own===side)s+=(o.pts||10)*ow;});if(G.gm&&G.gm.tix&&+G.set.tix>0)s+=Math.round(Math.max(0,G.gm.tix[side])/5);s=Math.round(s);var en=G.stats[enemyOf(side)],me=G.stats[side];s+=Math.round((en.cas+en.vl*8+en.capt)/200)-Math.round((me.cas+me.vl*8+me.capt)/400);return s;}
function checkEnd(){var S=G.set,why=null,win=-1;if(S.dur&&G.t>=S.dur*3600)why='時間到';var cl=typeof gmCollapse==='function'?gmCollapse():0.15;[0,1].forEach(function(i){var st=sideStr(i);if(st.m0>0&&st.f<cl){why=G.sides[i].name+'兵力崩潰';win=enemyOf(i);}});
  if(S.end==='obj'&&G.obj.length&&G.obj.every(function(o){return o.own===G.obj[0].own&&o.own>=0&&G.t-(o.tOwn||0)>=objHoldT();})){why='一方控制全部目標 '+durTxt(objHoldT());win=G.obj[0].own;}
  if(typeof gmEnd==='function'){var X=gmEnd();if(X){why=X.why;win=X.win;}}
  if(!why)return;if(win<0){var a=score(0),b=score(1);win=a>b?0:b>a?1:-1;}G.over={why:why,win:win,t:G.t,score:[score(0),score(1)]};btCloseAll();logE(-1,'end','作戰結束（'+why+'）：'+(win>=0?G.sides[win].name+'獲勝':'雙方不分勝負')+'。');if(G.onPause&&apOn('end'))G.onPause('作戰結束');}
/* ---------- 玩家下令：命令由本方最高司令部經指揮鏈傳遞 ---------- */
function issue(u,k,p){p=p||{};if(k==='ambush'||k==='delay'||k==='holdfast'){p.opt=Object.assign({},p.opt||{},{post:k});if(k==='ambush')p.opt.roe=p.opt.roe||'close';if(k==='delay')p.opt.maxb=p.opt.maxb||4;p.dk=k;k='defend';}
  var o=newOrder(k,p),S0=SD(u.side),src=S0.ai&&S0.pu>0&&uById(S0.pu)&&inTree(u,S0.pu)?uById(S0.pu):sideCmd(u.side);if(!S0.ai||S0.pu>0&&inTree(u,S0.pu))decLog(u.side,'玩家','命令'+uName(u)+'：'+ordN(o)+(o.x!==undefined?'（'+placeTxt(o.x,o.y)+'）':''));if(u.st==='off'){u.arr=u.arr||{k:'time',t:0};u.arr.ord={k:k,x:o.x,y:o.y,face:o.face,opt:o.opt,Y:o.Y};logE(u.side,'cmd',uName(u)+'（增援）抵達後將執行：'+ordN(o));return {sec:0};}
  if(!src||src.id===u.id){receiveOrder(u,o);logE(u.side,'cmd','直接指揮'+uName(u)+'：'+ordN(o),u.x,u.y,u.id);return {sec:0};}
  var m=sendOrder(src,u,o,true);logE(u.side,'cmd','命令「'+ordN(o)+'」由'+uName(src)+'發給'+uName(u)+'，經'+m.via.map(function(v){return VIA[v];}).join('→')+'，預計 '+durTxt(m.ta-G.t)+' 後送達',src.x,src.y,u.id);return {sec:m.ta-G.t,m:m};}
var VIA={courier:'傳令',wire:'電話',radio:'無線電',digital:'數位網路'};

/* 被包圍：四周（至少三個方向）2 公里內都有敵軍 */
function surrounded(u){var q=[0,0,0,0];gridNear(u.x,u.y,2000,function(e){if(e.side===u.side||!onMap(e)||ST(e).dom==='air')return;var d=dist(u.x,u.y,e.x,e.y);if(d>2000||d<1)return;var a=Math.atan2(e.y-u.y,e.x-u.x);q[(Math.floor((a+PI)/(PI/2))+4)%4]=1;});return q[0]+q[1]+q[2]+q[3]>=3;}
