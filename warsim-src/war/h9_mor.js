/* ===================== 動態士氣、兵種行為與兵種相克 =====================
   士氣因素：近期傷亡、側翼與後方受敵、被包圍、壓制、恐懼、戰車恐慌、夜戰、飢餓、疲勞、指揮與司令部、友軍潰散的恐慌傳染、戰果鼓舞；
   士氣決策：士氣高昂時自行出擊、士氣低落時拒絕進攻、受壓時有序後撤、潰散、投降、脫離接觸後重新集結並歸建；
   兵種行為：後勤、指揮、砲兵、防空、工兵避開前線；偵察避免決戰；反裝甲遇步兵逼近後撤；騎兵與特種部隊伺機出擊；
   兵種相克：攻擊方與目標的兵種類別（含地形）決定火力與突擊的加成。 */
var UCLS={inf:'步兵',mech:'機械化步兵',arm:'裝甲',at:'反裝甲',art:'砲兵',ad:'防空',cav:'騎兵',pike:'長槍兵',rec:'偵察',eng:'工兵',sof:'特種部隊',hq:'指揮',sup:'後勤',heli:'直升機',air:'航空器',uav:'無人機',nav:'艦艇',sub:'潛艦',beast:'巨獸',gue:'游擊隊',sec:'治安部隊',mp:'憲兵',med:'醫療',rear:'後方非戰鬥單位'};
function clsOfS(s){var b=s.br,fl=s.fl||'';
  if(s.dom==='air')return b==='drg'?'beast':b==='uav'?'uav':(b==='heli'||fl.indexOf('A')>=0)?'heli':'air';
  if(s.dom==='sub')return 'sub';if(s.dom==='sea')return b==='mon'?'beast':'nav';
  if(fl.indexOf('h')>=0||b==='hq')return 'hq';if(fl.indexOf('l')>=0||b==='sup'||b==='ew')return 'sup';
  if(b==='med'||fl.indexOf('D')>=0)return 'med';if(fl.indexOf('G')>=0||b==='gue')return 'gue';if(b==='mp'||fl.indexOf('M')>=0)return 'mp';if(b==='sec'||fl.indexOf('I')>=0)return 'sec';if(b==='sge')return fl.indexOf('e')>=0?'eng':'art';if(fl.indexOf('u')>=0)return 'rear';
  if(b==='pike')return 'pike';if(b==='cav'||fl.indexOf('c')>=0)return 'cav';if(b==='arm')return 'arm';if(b==='mech')return 'mech';if(b==='at')return 'at';if(b==='ad')return 'ad';
  if(b==='art'||b==='mor'||b==='rkt')return 'art';if(b==='rec'||fl.indexOf('r')>=0)return 'rec';if(b==='eng'||fl.indexOf('e')>=0)return 'eng';if(b==='sof')return 'sof';if(b==='drg'||b==='mon')return 'beast';
  if(s.hard>=0.6&&s.arm>=3)return 'arm';if(s.ind>0&&s.shock<1.5)return 'art';return 'inf';}
function clsOf(u){var s=ST(u);if(s._cls===undefined)s._cls=clsOfS(s);return s._cls;}
function profIdxOf(u){var i=PROF.indexOf(profOf(u));return i<0?2:i;}

/* ---------- 兵種相克：攻擊方類別 → 目標類別的效果倍率（未列出者為 1） ---------- */
var CTR={arm:{inf:1.25,pike:1.4,cav:1.4,art:1.4,at:0.8,sup:1.4,hq:1.3,rec:1.15,eng:1.1,heli:0.8,gue:0.6,rear:1.3},
 gue:{sup:1.6,hq:1.4,art:1.3,rear:1.5,med:1.2,eng:1.2,inf:0.8,arm:0.4,mech:0.5,sec:0.7},
 sec:{gue:1.6,inf:0.85,arm:0.5,mech:0.6},mp:{gue:1.2,inf:0.8,arm:0.4},
 mech:{inf:1.15,cav:1.2,sup:1.2,art:1.15,arm:0.9},
 at:{arm:1.5,mech:1.35,inf:0.6,pike:0.6,cav:0.7,sup:0.9},
 inf:{arm:0.85,art:1.2,sup:1.2,hq:1.1,at:1.2},
 cav:{inf:1.2,art:1.6,sup:1.6,hq:1.4,rec:1.2,at:1.3,pike:0.4,arm:0.3,mech:0.4},
 pike:{cav:1.8,inf:0.85,arm:0.2,mech:0.3},
 art:{inf:1.15,sup:1.2,hq:1.15,arm:0.7,mech:0.85},
 ad:{heli:1.4,air:1.3,uav:1.5,beast:1.2,inf:0.8,arm:0.8},
 heli:{arm:1.4,mech:1.3,sup:1.3,inf:0.9,ad:0.6},
 air:{sup:1.4,art:1.2,hq:1.2,heli:1.3,ad:0.6},
 uav:{art:1.4,arm:1.25,mech:1.15,sup:1.3,hq:1.3,inf:0.9},
 rec:{inf:0.85,arm:0.6,sup:1.2},
 sof:{hq:1.6,art:1.5,sup:1.5,ad:1.4,rec:1.1,arm:0.7},
 beast:{inf:1.25,cav:1.5,pike:1.1,sup:1.3,arm:0.8,nav:1.2},
 sub:{nav:1.3}};
function denseAt(x,y){var c=G.map.lc[cellAt(x,y)];return isUrban(c)||c===LCI.dfor||c===LCI.cfor||c===LCI.jung;}
function woodsAt(x,y){var c=G.map.lc[cellAt(x,y)];return c===LCI.dfor||c===LCI.cfor||c===LCI.jung;}
function ctrBase(ca,ct){return (CTR[ca]&&CTR[ca][ct])||1;}
function ctrMul(a,t,kind,d){if(G.set.ctr===false)return 1;var ca=clsOf(a),ct=clsOf(t),m=ctrBase(ca,ct);
  if(kind==='melee'&&(ca==='cav'||ct==='cav'||ca==='pike'||ct==='pike'))m=1;/* 騎兵、長槍、方陣、散兵的突擊規則另行計算 */
  if(ST(t).dom==='land'){
    if((ct==='arm'||ct==='mech')&&(ca==='inf'||ca==='at'||ca==='eng'||ca==='sof')&&woodsAt(t.x,t.y)&&(d===undefined||d<600))m*=1.35;/* 林地近距離反裝甲伏擊（城鎮另有巷戰伏擊） */
    if(ca==='arm'&&/^(inf|at|eng|sof|pike)$/.test(ct)&&denseAt(t.x,t.y))m*=0.65;/* 裝甲在城鎮與森林失去優勢 */
    if(ca==='cav'&&(denseAt(t.x,t.y)||G.map.lc[cellAt(t.x,t.y)]===LCI.marsh))m*=0.6;}
  return m;}
function ctrTxt(u){var ca=clsOf(u),up=[],dn=[];Object.keys(UCLS).forEach(function(k){var a=ctrBase(ca,k),b=ctrBase(k,ca);if(a>=1.2)up.push(UCLS[k]);if(b>=1.2)dn.push(UCLS[k]);});
  var x={arm:'；在城鎮與森林中對步兵優勢下降',inf:'；在城鎮與森林中近距離反裝甲有利',at:'；在森林中伏擊裝甲更有效',cav:'；在森林、城鎮與沼澤中衝擊力下降'}[ca]||'';
  return UCLS[ca]+'：'+(up.length?'克制 '+up.join('、'):'無明顯優勢對象')+(dn.length?'；被 '+dn.join('、')+' 克制':'')+x;}

/* ---------- 士氣因素 ---------- */
var MFN={cas:'近期傷亡',sup:'猛烈壓制',fear:'恐懼光環',hq:'司令部失聯',oos:'補給中斷',flank:'側翼或後方受敵',enc:'被包圍',hun:'飢餓',fat:'疲勞',night:'夜戰恐懼',tank:'戰車恐慌',cmd:'超出指揮範圍',rest:'休整回復',panic:'友軍潰散',win:'戰果鼓舞',air:'遭受空襲',lead:'指揮官在旁',surr:'友軍投降'};
function mfAdd(u,k,v){if(!v)return;var M=u.mf||(u.mf={});M[k]=(M[k]||0)+v;}
function morTxt(u){var M=u.mf;if(!M)return '';var L=Object.keys(M).filter(function(k){return Math.abs(M[k])>=0.5;}).sort(function(a,b){return Math.abs(M[b])-Math.abs(M[a]);}).slice(0,4);return L.map(function(k){return MFN[k]+' '+sg(M[k],0);}).join('、');}
/* 士氣基準：部隊在未受攻擊時回復的上限，會隨損失、潰散次數、補給與飢餓下降 */
function morBase(u,s,off,PF){var b=s.mor+(u.exp||0)+(hasQ(off,'inspire')?10:0)+(u.prof!==undefined?(PF[3]-65)*0.5:0);if(G.set.dynMor!==false){b-=(1-strFrac(u))*30+(u.routN||0)*5+((u.oos||0)>6*3600?8:0)+(u.lg&&u.lg.hun>40?8:0);if(u.ent>0.5)b+=3;}return clamp(b,10,100);}
/* 戰車恐慌：沒有反裝甲能力的軟目標，在開闊地遭敵方裝甲逼近 */
function tankFright(u,s){var c=clsOf(u);if(!/^(inf|pike|cav|sup|eng|art|hq|rec)$/.test(c)||haOf(u,s)>=0.3)return false;var e=u._eid?uById(u._eid):null;if(!e||!onMap(e)||(u._ed||1e9)>900)return false;var ce=clsOf(e);if((ce!=='arm'&&ce!=='mech')||ST(e).hard<0.5)return false;return !denseAt(u.x,u.y);}
function hqNear(u){if(u.p<0)return false;var P=uById(u.p);return !!(P&&alive(P)&&!P.hqLost&&dist(P.x,P.y,u.x,u.y)<2500);}
/* 每步的士氣變化（由 moraleStep 呼叫）；回傳變化量 */
function morDelta(u,s,off,PF,uf,fearSrc){var d=0,dyn=G.set.dynMor!==false,land=s.dom==='land',add=function(k,v){d+=v;mfAdd(u,k,v);};
  if(uf&&u.sup>70)add('sup',-0.3);
  var fearF=function(f){if(f.side===u.side)return;var R=ST(f).dom==='air'?1500:1000;if(dist(f.x,f.y,u.x,u.y)<R)add('fear',-0.5*(hasQ(off,'stubborn')?0.5:1)*(u.ms==='rout'?0:1));};
  /* 恐懼來源按 1.5 公里方格分桶：只看周圍九格，並依原清單順序累加（結果與逐一比對相同） */if(fearSrc._B){var FB=fearSrc._B,gx=Math.floor(u.x/1500),gy=Math.floor(u.y/1500),hit=[];for(var ax=-1;ax<=1;ax++)for(var ay=-1;ay<=1;ay++){var Lb=FB.get((gx+ax+5000)*20000+gy+ay+5000);if(Lb)for(var bi=0;bi<Lb.length;bi++)hit.push(Lb[bi]);}if(hit.length>1)hit.sort(function(a,b){return a-b;});for(var hi=0;hi<hit.length;hi++)fearF(fearSrc[hit[hi]]);}else fearSrc.forEach(fearF);
  if(u.p>=0){var P=uById(u.p);if(P&&P.hqLost)add('hq',-0.08);}if((u.oos||0)>6*3600)add('oos',-0.03);
  if(dyn&&land&&u.ms!=='rout'){var pi=profIdxOf(u);
    if((u.rcas||0)>0.03)add('cas',-Math.min(1.2,(u.rcas-0.03)*8)*(1-0.12*pi));
    if(G.t-(u.flankT||-1e9)<300)add('flank',-0.12);
    if(G.t-(u.encT||-1e9)<300)add('enc',-0.18*(hasQ(off,'stubborn')?0.6:1));
    if(u.lg&&u.lg.hun>30)add('hun',-0.02*Math.min(3,u.lg.hun/30));if(u.fat>60)add('fat',-0.02*(u.fat-60)/20);
    if(G.env.light<0.3&&uf&&pi<=1&&!hasQ(off,'night'))add('night',-0.05);
    if(uf&&tankFright(u,s))add('tank',-0.12*(1-0.2*pi));
    if(u.p>=0&&G.step%4===1&&!inCmd(u))u.ocT=G.t;if(G.t-(u.ocT||-1e9)<150)add('cmd',-0.02);}
  var base=morBase(u,s,off,PF);u.morB=base;
  if(!uf&&G.t-(u._hitT||-1e9)>300){if(u.mor<base){var hn=dyn&&hqNear(u);add('rest',0.25*(off?0.6+0.08*off.cmd:0.7)*(hasQ(off,'inspire')?1.3:1)*((u.oos||0)>6*3600?0.5:1)*PF[5]*(hn?1.25:1));}else if(dyn&&u.mor>base+4)d-=0.04;}
  return d;}
/* 潰散：丟棄部分重裝備、恐慌傳染、敵軍士氣提升 */
function goRout(u,s){u.ms='rout';u.ord=null;u.mis=null;u.pend=[];u.routT=0;u.routN=(u.routN||0)+1;u.evade=null;if(u.lreq&&typeof liftCancel==='function')liftCancel(u);var dyn=G.set.dynMor!==false,lostV=0;
  if(dyn&&s.fl.indexOf('g')>=0&&u.veh>=1){lostV=u.veh*0.3;u.veh-=lostV;u.vlost=(u.vlost||0)+lostV;G.stats[u.side].vl+=lostV;}
  logE(u.side,'rout',uName(u)+'潰散！（'+placeTxt(u.x,u.y)+'）'+(lostV>=0.5?'，丟棄 '+fmt(lostV)+' '+(s.vn||'件裝備').replace(/^[^一-鿿]*/,''):''),u.x,u.y,u.id);
  if(dyn)panicSpread(u,7,'panic');if(G.onPause&&apOn('rout'))G.onPause('部隊潰散');}
/* 恐慌傳染與戰果鼓舞：附近友軍士氣下降、附近敵軍士氣上升 */
function panicSpread(u,amt,kind){var n=0,R=1500;gridNear(u.x,u.y,R,function(f){if(f===u||!onMap(f)||ST(f).dom!=='land')return;var d=dist(u.x,u.y,f.x,f.y);if(d>R)return;var k=1-d/R;
    if(f.side===u.side){var v=amt*k*[1.3,1.15,1,0.8,0.6][profIdxOf(f)]*(hasQ(offOf(f),'stubborn')?0.6:1)*(f.ent>0.5?0.7:1);f.mor=clamp(f.mor-v,0,100);mfAdd(f,kind,-v);if(v>3)n++;}
    else{var g=amt*0.45*k;f.mor=clamp(f.mor+g,0,100);mfAdd(f,'win',g);}});
  if(n>=2&&kind==='panic')logE(u.side,'panic',uName(u)+'的潰散在附近 '+n+' 個單位之間引起恐慌',u.x,u.y,u.id);}
/* 每 2 分鐘的士氣決策（葉單位、地面） */
function morDecide(u,s,off,PF,uf,rt,shT){if(G.set.dynMor===false||s.dom!=='land'||!isLeaf(u)||u.amph||u.st==='lift')return;
  if(u.ms==='rout'){surrCheck(u,s,off,PF,rt,true);return;}if(u.ms==='shaken'&&surrCheck(u,s,off,PF,rt,false))return;
  if(u.besieged&&G.t-u.besieged<1200&&surrCheck(u,s,off,PF,rt,false))return;
  var o=u.ord,k=o?o.k:'halt';
  /* 拒絕進攻：士氣低落、傷亡慘重時停止前進就地掩蔽 */
  if(k==='attack'&&!(o.opt&&(o.opt.eager||o.opt.storm))&&!o.refused&&(u.ms==='shaken'||u.mor<45)&&((u.rcas||0)>0.04||uf)){var p=0.18*(hasQ(off,'inspire')?0.5:1)*(hasQ(off,'reckless')?0.4:1)*[1.6,1.3,1,0.7,0.4][profIdxOf(u)];
    if(rnd()<p){o.refused=1;logE(u.side,'refuse',uName(u)+'士氣低落、傷亡慘重，停止進攻並就地掩蔽',u.x,u.y,u.id);activate(u,newOrder('defend',{x:u.x,y:u.y,face:u.hd,opt:{post:'hasty'},dk:'refuse'}));return;}}
  if(twdCheck(u,s,off,PF,uf,shT))return;eagerCheck(u,s,off,PF);}
/* 戰術後撤：受壓而未崩潰的部隊，有序退到後方一至兩公里重新佈防 */
function twdCheck(u,s,off,PF,uf,shT){if(!uf||G.t-(u.twdT||-1e9)<1500||u.ms==='rout')return false;var o=u.ord,k=o?o.k:'halt',op=optOf(u);
  if(op.post==='holdfast'||op.post==='ambush'||k==='withdraw'||op.pursue||(k==='attack'&&u.ms!=='shaken'))return false;if(o&&o.dk==='siege'&&u.mor>shT)return false;
  var own=u.men+u.veh*8,C=G.ct[u.side],enS=0,sx=0,sy=0;for(var id in C){var c=C[id];if(G.t-c.t>600||c.dead||c.dom==='air')continue;var dd=dist(u.x,u.y,c.x,c.y);if(dd>1500)continue;var w=(c.men||0)+(c.veh||0)*8+1;enS+=w;sx+=c.x*w;sy+=c.y*w;}if(!enS)return false;
  var press=(u.rcas||0)/0.05+enS/Math.max(1,own*2.2)+(G.t-(u.flankT||-1e9)<300?0.5:0)+(G.t-(u.encT||-1e9)<300?0.6:0);if(press<1.3||u.mor>=shT+15)return false;
  var p=0.3*(hasQ(off,'careful')?2:1)*(hasQ(off,'reckless')?0.3:1)*(hasQ(off,'stubborn')?0.5:1)*(off?0.6+0.08*off.tac:1)*(clsOf(u)==='rec'?1.5:1)*(PF[0]==='mil'?0.6:1);if(rnd()>p)return false;
  var ex=sx/enS,ey=sy/enS,a=Math.atan2(u.y-ey,u.x-ex),h=homeDir(u.side),ax=Math.cos(a)*0.6+Math.cos(h)*0.4,ay=Math.sin(a)*0.6+Math.sin(h)*0.4,L=Math.sqrt(ax*ax+ay*ay)||1,D=1200+700*rnd(),q=validPos(s,u.x+ax/L*D,u.y+ay/L*D);
  if(!authGo(u,'wd',{x:q[0],y:q[1]})){u.twdT=G.t;return false;}  u.twdT=G.t;activate(u,newOrder('withdraw',{x:q[0],y:q[1],dk:'twd',face:Math.atan2(-ay,-ax)}));u.sup=Math.max(0,u.sup-10);u.mor=clamp(u.mor+3,0,100);
  logE(u.side,'twd',uName(u)+'在敵軍壓力下有序後撤至'+placeTxt(q[0],q[1])+'重新佈防',u.x,u.y,u.id);return true;}
/* 自行出擊：士氣高昂、指揮官積極的部隊，對附近動搖、潰散或較弱的敵軍發動未經命令的攻擊 */
function eagerCheck(u,s,off,PF){var o=u.ord,k=o?o.k:'halt';if(!authMay(u,'atk')&&!authMay(u,'pur'))return false;if(u.ms!=='ok'||u.mor<76||u.fat>55||u.ammo<40||u.org<60||u.lreq||(u.regT&&G.t<u.regT)||(u.pend&&u.pend.length)||G.t-(u.eagerT||-1e9)<3600)return false;
  if(!/^(halt|rest|defend|screen|reserve|move|recon)$/.test(k))return false;var op=optOf(u);if(op.post==='holdfast'||op.post==='hide'||op.post==='ambush'||/^(hold|return)$/.test(roeOf(u,op)))return false;
  var cls=clsOf(u);if(!/^(inf|mech|arm|cav|pike|sof|beast)$/.test(cls))return false;
  var R=cls==='cav'||cls==='beast'?2500:cls==='sof'?4000:1500,C=G.ct[u.side],best=null,bv=0,own=u.men+u.veh*8;
  for(var id in C){var c=C[id];if(G.t-c.t>600||c.dead||c.dom!=='land')continue;var dd=dist(u.x,u.y,c.x,c.y);if(dd>R)continue;var e=uById(+id);if(!e||!onMap(e))continue;var es=(c.men||0)+(c.veh||0)*8,ce=clsOf(e);
    var weak=e.ms==='rout'?3:e.ms==='shaken'?2:es<own*0.6?1.2:0,soft=/^(sup|hq|art|ad)$/.test(ce)&&/^(cav|arm|sof|beast)$/.test(cls)?1.5:0;if(cls==='sof'&&!soft)continue;var v=(weak+soft)*(1-dd/R)*ctrBase(cls,ce);if(v>bv){bv=v;best=c;}}
  if(!best)return false;var agg=off?off.agg:5,p=0.012*Math.max(0.2,(agg-2)/4)*(hasQ(off,'reckless')?2.5:1)*(hasQ(off,'careful')?0.3:1)*(profIdxOf(u)>=3?1.3:1)*(cls==='cav'||cls==='beast'?1.6:1)*bv*(u.mor-70)/10;if(rnd()>p)return false;var e0=uById(best.id);if(!authGo(u,e0&&e0.ms==='rout'?'pur':'atk',{x:best.x,y:best.y,tid:best.id,R:R})){u.eagerT=G.t;return false;}
  var prev=o&&o.st!=='done'?{k:o.k,x:o.x,y:o.y,face:o.face,opt:o.opt,dk:o.dk,pts:o.pts}:null,e2=uById(best.id);u.eagerT=G.t;
  activate(u,newOrder('attack',{x:best.x,y:best.y,x0:u.x,y0:u.y,opt:{tac:'raid',tol:25,pace:'rush',eager:1},dk:'eager',prev:prev}));
  logE(u.side,'eager',uName(u)+(cls==='cav'&&e2&&e2.ms==='rout'?'趁勢追擊潰逃的敵軍':'士氣高昂，未經命令自行出擊')+'（'+placeTxt(best.x,best.y)+(best.q>=1&&best.name?'，'+best.name:'')+'）',u.x,u.y,u.id);return true;}
/* 投降：潰散或動搖且被切斷、被包圍，或長期被圍、斷糧時 */
function surrCheck(u,s,off,PF,rt,routing){if(clsOf(u)==='beast')return false;var ed=u._ed===undefined?1e9:u._ed,bes=u.besieged&&G.t-u.besieged<1200,enc=G.t-(u.encT||-1e9)<600||bes,fr=strFrac(u),hun=u.lg?(u.lg.hun||0):0,oos=u.oos||0,why='',p=0;
  if(ed<500&&(routing||u.mor<rt+5)){var cut=enc||friendNear(u.side,u.x,u.y,2500)-(u.men+u.veh*8)<=0;if(cut&&(fr<0.5||u.mor<15||oos>6*3600||hun>40)){p=0.04;why=enc?'遭到包圍':'退路被切斷';}}
  if(!p&&bes&&oos>12*3600&&(hun>50||u.ammo<10)&&u.mor<35){p=0.03;why='長期被圍、糧彈斷絕';}
  if(!p)return false;p*=[1.6,1.3,1,0.6,0.3][profIdxOf(u)]*(optOf(u).post==='holdfast'?0.5:1)*(hasQ(off,'stubborn')?0.5:1)*(u.mor<10?2:1)*(/^(sup|hq|eng|art)$/.test(clsOf(u))?1.5:1);if(rnd()>p)return false;
  surrender(u,u._eid?uById(u._eid):null,why);return true;}
function surrender(u,by,why){var men=Math.round(u.men);u.surr=1;u._capBy=by&&alive(by)?by.id:0;mfAdd(u,'surr',0);if(by&&alive(by)){by.mor=clamp(by.mor+5,0,100);mfAdd(by,'win',5);by.capts=(by.capts||0)+men;}
  gridNear(u.x,u.y,2000,function(f){if(f.side===u.side&&f!==u&&onMap(f)){f.mor=clamp(f.mor-4,0,100);mfAdd(f,'surr',-4);}});G.stats[u.side].surr=(G.stats[u.side].surr||0)+1;
  destroy(u,'capt',uName(u)+(why?'因'+why+'，':'')+'向'+(by&&alive(by)?uName(by):'敵軍')+'投降，'+fmt(men)+' 人被俘（'+placeTxt(u.x,u.y)+'）');}
/* 重新集結：潰散部隊脫離接觸、遠離敵軍後整頓；靠近上級司令部或有鼓舞型指揮官時更快 */
function rallyPoint(u,s){if(u.p>=0){var P=uById(u.p);if(P&&alive(P)&&!P.hqLost){var ec=enemyCentroid(u.side,u.x,u.y,6000);if(!ec||dist(P.x,P.y,ec[0],ec[1])>dist(u.x,u.y,ec[0],ec[1])+500)return validPos(s,P.x,P.y);}}return null;}
function rallyOK(u,s){var off=offOf(u),PF=profOf(u),t=900*PF[6]*(hqNear(u)?0.5:1)*(hasQ(off,'inspire')?0.7:1),rt=PF[7];return G.t-(u.uf||-1e9)>t&&(u._ed===undefined||u._ed>1500)&&u.mor>=rt+8;}
function rallyDone(u,s){u.ms='shaken';u.task='hold';u.path=null;u.ord=null;var PF=profOf(u);u.regT=G.t+600*PF[6];u.org=clamp(u.org,20,100);logE(u.side,'rally',uName(u)+'在'+placeTxt(u.x,u.y)+'重新集結',u.x,u.y,u.id);
  if(G.set.dynMor===false||u.p<0)return;if(u.pin&&typeof rsmOn==='function'&&rsmOn()&&!aiControls(u))return;/* 玩家下過命令的部隊：就地整頓，之後恢復玩家的命令（不歸建） */var P=uById(u.p);if(!P||!alive(P))return;var L=leavesOf(P).filter(function(x){return x!==u&&onMap(x);});if(!L.length)return;var c=centroid(L),ec=enemyCentroid(u.side,c[0],c[1],8000),b=ec?Math.atan2(c[1]-ec[1],c[0]-ec[0]):homeDir(u.side),q=validPos(s,c[0]+Math.cos(b)*1500,c[1]+Math.sin(b)*1500);
  if(dist(u.x,u.y,q[0],q[1])<800)return;u.ord=null;var no=newOrder('reserve',{x:q[0],y:q[1],dk:'rejoin'});no.delay=600*PF[6];activate(u,no);logE(u.side,'rejoin',uName(u)+'整頓後歸建'+uName(P)+'，擔任預備隊',u.x,u.y,u.id);}

/* ---------- 兵種行為 ---------- */
var BEH={sup:[3000,'後勤：遠離前線，敵軍逼近 3 公里內自動後撤'],hq:[2000,'指揮：保持在後方，敵軍逼近 2 公里內自動轉移'],ad:[1500,'防空：掩護後方，敵軍地面部隊逼近 1.5 公里內後撤'],eng:[1200,'工兵：作業與攻擊時不避戰，閒置時避開 1.2 公里內的敵軍'],
 art:[0,'砲兵：保持在前線後方，敵軍逼近時撤收轉移'],rec:[0,'偵察：避免決戰，遇優勢敵軍即後撤並保持接觸'],at:[0,'反裝甲：優先射擊車輛，遭步兵逼近又無友軍步兵掩護時後撤'],cav:[0,'騎兵：伺機追擊潰逃之敵、衝擊砲兵與後勤'],sof:[0,'特種部隊：伺機襲擊敵後方的指揮、砲兵、防空與後勤'],
 inf:[0,'步兵：堅守陣地；在城鎮與森林中對裝甲有利'],mp:[1500,'憲兵：在後方維持軍紀、管制交通、押解戰俘，避開前線'],med:[2500,'醫療：受國際法保護的非戰鬥單位，在後方收容與後送傷患'],rear:[3500,'後方非戰鬥單位：收容所、民事、勞軍與勞工，遠離戰鬥'],
 gue:[0,'游擊隊：隱蔽於民間，伏擊補給與後方，避免與正規軍決戰'],sec:[0,'治安部隊：守備後方要點、清剿游擊隊、護衛車隊'],mech:[0,'機械化步兵：伴隨裝甲作戰'],arm:[0,'裝甲：開闊地的突擊主力，避免單獨進入城鎮與森林'],pike:[0,'長槍兵：結陣抵禦騎兵'],beast:[0,'巨獸：恐懼光環，伺機撲擊']};
function avoidR(u,s,cls){if(cls==='art')return clamp((indOf(u,s)||s.rM||3000)*0.15,700,2000);var b=BEH[cls];return b?b[0]:0;}
function behTxt(u){var s=ST(u),cls=clsOf(u),b=BEH[cls];if(!b)return UCLS[cls]||'';return cls==='art'?'砲兵：保持在前線後方，敵軍逼近 '+kmTxt(avoidR(u,s,cls))+' 內時撤收轉移':b[1];}
function enemyStrNear(u,R){var C=G.ct[u.side],n=0;for(var id in C){var c=C[id];if(G.t-c.t>600||c.dead||c.dom==='air')continue;if(dist(u.x,u.y,c.x,c.y)<=R)n+=(c.men||0)+(c.veh||0)*8;}return n;}
function friendCls(u,R,rx){var ok=false;gridNear(u.x,u.y,R,function(f){if(ok||f===u||f.side!==u.side||!onMap(f))return;if(dist(u.x,u.y,f.x,f.y)<=R&&rx.test(clsOf(f)))ok=true;});return ok;}
function evade(u,s,R,txt){var ec=enemyCentroid(u.side,u.x,u.y,Math.max(R,1500)*1.6),e=u._eid?uById(u._eid):null;if(!ec&&e)ec=[e.x,e.y];var h=homeDir(u.side),a=ec?Math.atan2(u.y-ec[1],u.x-ec[0]):h,ax=Math.cos(a)*0.65+Math.cos(h)*0.35,ay=Math.sin(a)*0.65+Math.sin(h)*0.35,L=Math.sqrt(ax*ax+ay*ay)||1,D=Math.max(900,R-(u._ed||0)+900),q=validPos(s,u.x+ax/L*D,u.y+ay/L*D);
  u.evade={t0:G.t};u.evT=G.t;u.evN=(u.evN||0)+1;u.task='go';wantPath(u,q[0],q[1]);if(!u.evLog||G.t-u.evLog>1800){u.evLog=G.t;logE(u.side,'evade',uName(u)+txt+'，轉移至'+placeTxt(q[0],q[1]),u.x,u.y,u.id);}}
/* 每步的兵種行為；回傳 true 表示本步已處理 */
function behStep(u,s){var o=u.ord,k=o?o.k:'halt';
  /* 自行出擊或襲擊結束後返回原陣地、恢復原任務 */
  if(o&&k==='withdraw'&&o.prev&&u.task==='hold'&&!u.path&&!u.pq){var pv=o.prev;activate(u,newOrder(pv.k,{x:pv.x,y:pv.y,face:pv.face,opt:pv.opt,dk:pv.dk,pts:pv.pts}));logE(u.side,'rejoin',uName(u)+'返回原陣地，恢復原任務',u.x,u.y,u.id);return true;}
  /* 戰術後撤完成：在新位置佈防 */
  if(o&&k==='withdraw'&&o.dk==='twd'&&u.task==='hold'&&!u.path&&!u.pq){activate(u,newOrder('defend',{x:u.x,y:u.y,face:o.face!==undefined?o.face:u.hd,opt:{post:'hasty'}}));return true;}
  if(G.set.beh===false)return false;var cls=clsOf(u);
  if(u.evade){if(u.task==='go'&&(u.path||u.pq)){setForm(u,'march');if(!u.pq)moveStep(u,s,1);return true;}u.evade=null;u.task='hold';return true;}
  if((G.step+u.id)%2||u.ms==='rout'||(u.regT&&G.t<u.regT))return false;var ed=u._ed===undefined?1e9:u._ed;
  var R=avoidR(u,s,cls),passive=!o||/^(halt|rest|support|reserve|defend|screen|fortify|patrol|recon)$/.test(k);if(R>0&&ed<R&&passive&&G.t-(u.evT||-1e9)>300&&!(cls==='eng'&&(/^(bridge|demolish|fortify)$/.test(k)||u.task==='work'))&&!(cls==='art'&&k==='bombard'&&u.mis&&G.t<u.mis.until&&ed>800)){
    evade(u,s,R,{sup:'（後勤）避開逼近的敵軍',hq:'（指揮所）避開逼近的敵軍',ad:'（防空）避開地面敵軍',eng:'（工兵）避開前線',art:'撤收火砲、避開逼近的敵軍'}[cls]||'避開逼近的敵軍');return true;}
  if(cls==='rec'&&k!=='attack'&&ed<1500&&G.t-(u.evT||-1e9)>900&&enemyStrNear(u,1500)>(u.men+u.veh*8)*1.5){evade(u,s,1800,'（偵察）避免與優勢敵軍決戰');return true;}
  if(cls==='at'&&k!=='attack'&&ed<450&&G.t-(u.evT||-1e9)>600){var e=u._eid?uById(u._eid):null;if(e&&onMap(e)&&/^(inf|cav|pike|sof)$/.test(clsOf(e))&&!friendCls(u,600,/^(inf|mech|arm|pike)$/)){evade(u,s,1000,'（反裝甲）遭步兵逼近且無步兵掩護');return true;}}
  return false;}
/* 司令部避開逼近的敵軍：回傳需要的後撤距離（0＝不需要） */
function hqThrR(F){return Math.max(800,HQBACK[clamp(F.ech,0,8)]*1.2+600);}
/* 司令部附近 15 分鐘內的地面敵情：每一步把接觸按 3 公里方格分桶一次，各司令部只查自己警戒半徑內的格子 */
function ctGridH(side){var K=G._ctgH;if(!K||K.st!==G.step||K.t!==G.t)K=G._ctgH={st:G.step,t:G.t};var B=K[side];if(B)return B;B=K[side]=new Map();var C=G.ct[side]||{};for(var id in C){var c=C[id];if(G.t-c.t>900||c.dead||c.dom==='air')continue;var k=(Math.floor(c.x/3000)+5000)*20000+Math.floor(c.y/3000)+5000,L=B.get(k);if(!L)B.set(k,L=[]);L.push(c);}return B;}
function hqThreat(F){if(G.set.beh===false)return 0;var R=hqThrR(F),B=ctGridH(F.side),ed=1e9,x0=Math.floor((F.x-R)/3000)+5000,x1=Math.floor((F.x+R)/3000)+5000,y0=Math.floor((F.y-R)/3000)+5000,y1=Math.floor((F.y+R)/3000)+5000;
  for(var gx=x0;gx<=x1;gx++)for(var gy=y0;gy<=y1;gy++){var L=B.get(gx*20000+gy);if(!L)continue;for(var i=0;i<L.length;i++){var c=L[i],d=dist(F.x,F.y,c.x,c.y);if(d<ed)ed=d;}}return ed<R?ed:0;}
