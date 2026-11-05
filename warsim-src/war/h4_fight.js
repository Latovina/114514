/* ===================== 戰鬥：直射、突擊與白刃、間接火力與反砲兵、防空、空戰、對地攻擊、海戰與魚雷、海怪纏鬥 ===================== */
var FIRE_K=0.12,ART_K=2,AIR_K=3,AAK=0.5,VK=0.35;/* 校準：直射約為理想射擊效果的一成，砲兵、空中、防空另行校準 */
var PENE=[1,1,1.5,2.5,2.5,3,5.5,8,10,7,11];/* 各時代的基準穿甲能力（對裝甲等級 0～10） */
function penT(t){var E=ERAI[t.era]||ERA[6],p=PENE[E.i];if(p===undefined)p=5;if(t.br==='at')p+=1;else if(t.br==='arm')p+=0.5;else if(/art|rkt|mor/.test(t.br))p-=1.5;if(t.br==='nav'&&t.ha>=4)p+=2.5;if(utHas(t,'p'))p+=2.5;if(t.br==='drg'||t.br==='mon')p+=1;return p;}
function penOf(s,u){if(s.pen===undefined){var mix=isLeaf(u)?u.mix:[[u.hq,1]],w=0,p=0;mix.forEach(function(m){var t=typeOf(m[0]);if(!t)return;var q=t.ha*(m[1]||1)+0.01;p+=penT(t)*q;w+=q;});s.pen=w?p/w:3;}return s.pen;}
function penF(pen,arm){return clamp(0.5+0.18*(pen-arm),0.02,1);}
function strFrac(u){var a=u.men0+u.veh0*8;return a>0?(u.men+u.veh*8)/a:0;}
function deathF(u){var s=ST(u);if(u.men0<=6&&u.veh0<=2)return 0.08;if(s.dom==='sea'||s.dom==='sub')return 0.25;if(s.dom==='air')return 0.2;if(s.hard>=0.6)return 0.25;return 0.18;}
/* ---------- 傷害累積（同一步內先累積、最後一起套用） ---------- */
function incOf(t){var I=G._inc[t.id];if(!I)I=G._inc[t.id]={m:0,v:0,sup:0,by:{},n:0};return I;}
function hit(t,src,dm,dv,sup,kind){if(!(dm>=0))dm=0;if(!(dv>=0))dv=0;var I=incOf(t);I.m+=dm;I.v+=dv;I.sup+=sup;I.n++;I.k=I.k||{};I.k[kind]=(I.k[kind]||0)+dm+dv*8+1e-6;if(src){I.by[src.id]=(I.by[src.id]||0)+dm+dv*8+0.001;touch(src,t,kind);t.uf=G.t;t.ufBy=src.id;if(src.irr)t.gueT=G.t;src.fired=G.t;if(G._fx&&G._fx.length<800&&kind!=='art')G._fx.push([src.x,src.y,t.x,t.y,kind,G.t]);}}
/* 射手修正 */
function firerMod(u,s){var f=(1-u.sup/130)*(0.6+0.4*u.mor/100)*(0.6+0.8*(u.trn||60)/100)*(1-u.fat/300)*(u.ammo>5?1:0.15)*(u.dudT&&G.t<u.dudT?0.85:1);
  if(u.form==='march')f*=0.25;else if(u.form==='square')f*=0.6;if(u.formTo)f*=0.3;var fmv=fmOf(u);if(u.form==='deployed'&&s.dom==='land')f*=fmv==='column'?0.4:fmv==='skirmish'?0.7:1;if(G.t-(u.movedAt||-1e9)<DT+1)f*=(s.fl.indexOf('m')>=0||s.br==='arm'||s.dom!=='land')?0.65:0.5;
  var off=offOf(u);f*=0.9+0.02*(off?off.tac:5);var vm=visMul(s.nv,false);if(vm<1){var pen=1-Math.sqrt(vm);if(hasQ(off,'night'))pen*=0.5;f*=1-pen;}
  var E=uEra(u),rain=WX[G.env.wx][3];if(E.bp&&rain)f*=E.bp===1?[1,0.6,0.25,0.15][rain]:E.bp===2?[1,0.75,0.45,0.3][rain]:[1,0.92,0.85,0.8][rain];if(u.regT&&G.t<u.regT)f*=0.5;if(u.amph)f*=0.2;return f;}
/* 目標修正：直射 */
function tgtModDirect(t,ts){var MP=G.map,k=cellAt(t.x,t.y),c=MP.lc[k],m=ts.dom==='land'?LC[c][4]:1;m*=1-0.65*t.ent;if(MP.ft[k]===4)m*=0.4;else if(MP.ft[k]===5||MP.ft[k]===6)m*=0.3;m*=mantletF(t);
  if(G.t-(t.movedAt||-1e9)<DT+1)m*=1.25;if(t.form==='march')m*=1.6;else if(t.form==='square')m*=1.8;if(t.sup>60)m*=0.75;if(t.formTo)m*=1.2;if(t.ms==='rout')m*=1.4;if(t.form==='deployed'&&ts.dom==='land'){var fm2=fmOf(t);m*=fm2==='column'?1.5:fm2==='skirmish'?0.5:1;}if(ts.dom==='land')m*=Math.sqrt(uEra(t).dens||1);if(t.amph)m*=t.amph.xs?1.2:1.5;if(t.regT&&G.t<t.regT)m*=1.2;return m;}
/* 目標修正：間接火力與空中攻擊 */
function covInd(t){var MP=G.map,k=cellAt(t.x,t.y),c=MP.lc[k],ts=ST(t),m=ts.dom==='land'?0.5+0.5*LC[c][4]:1;m*=1-0.8*t.ent;if(MP.ft[k]===4||MP.ft[k]===6)m*=0.2;else if(MP.ft[k]===5)m*=0.15;if(t.form==='march')m*=1.4;else if(t.form==='square')m*=2;if(G.t-(t.movedAt||-1e9)<DT+1)m*=1.15;if(t.form==='deployed'&&ts.dom==='land'){var fm3=fmOf(t);m*=fm3==='column'?2:fm3==='skirmish'?0.5:1;}if(t.amph)m*=1.5;return m;}
function flankF(u,t){if(t.form!=='deployed'||optOf(t).post==='strong')return 1;var a=Math.abs(angDiff(t.hd,Math.atan2(u.y-t.y,u.x-t.x)));return a<PI/3?1:a<PI*2/3?1.4:1.8;}
function rangeF(d,rE,rM){if(d<=rE)return 1;if(d>=rM)return 0;return 1-0.85*(d-rE)/Math.max(1,rM-rE);}
/* 可否直射：依雙方領域 */
function canHit(s,ts,d){if(s.dom==='air')return false;if(ts.dom==='air')return d<=600&&/[YAZ]/.test(ts.fl)?0.3:false;if(s.dom==='sub')return ts.dom==='sea'?1:false;if(ts.dom==='sub')return (s.dom==='sea'||s.dom==='sub')&&d<=2500?(s.fl.indexOf('T')>=0?1:0.4):false;return 1;}
/* ---------- 直射 ---------- */
function fireStep(){G.units.forEach(function(u){if(!onMap(u)||u.ms==='rout'||u.st==='air')return;var s=ST(u),SA=saOf(u,s),HA=haOf(u,s);if(SA<=0&&HA<=0)return;if(u.ammo<=0)return;var o=u.ord,rE=s.rE*rngF(u),rM=s.rM*rngF(u);
    var op=optOf(u),roe=roeOf(u,op),uf2=G.t-(u.uf||-1e9)<=120;if(o&&o.k==='rest'&&!uf2)return;if(o&&o.k==='recon'&&!uf2)return;if(roe==='hold'||(roe==='return'&&!uf2))return;
    var disc=profOf(u)[8],maxR=op.post==='reverse'&&(o.k==='defend'||o.k==='screen')?700:roe==='close'?Math.max(150,rE*0.5)*disc:op.post==='ambush'&&!u.ambT&&!uf2?Math.min(Math.max(rE*0.5,120),300)*disc:1e9;if(u.mis&&G.t>=u.mis.start&&indOf(u,s)>0)return;/* 執行間接射擊任務時不直射 */
    var L=u._seen;if(!L||!L.length)return;var best=null,bv=0,bd=0,bm=0;for(var i=0;i<L.length;i++){var t=uById(L[i]);if(!t||!onMap(t))continue;var ts=ST(t),d=dist(u.x,u.y,t.x,t.y);if(d>rM||d>maxR)continue;var ch=canHit(s,ts,d);if(!ch)continue;if(roe==='pid'&&!uf2&&!roeIdOk(u,t,ts,d))continue;
      var v=rangeF(d,rE,rM)*(HA*ts.hard*penF(penE(u,s),armVs(t,ts,u))*3+SA*(1-0.8*ts.hard))*(o&&o.k==='attack'&&o.x!==undefined?1+1/(1+dist(t.x,t.y,o.x,o.y)/800):1)*(t.id===u.tgt?1.3:1)*ch*ctrMul(u,t,'fire',d);if(v>bv){bv=v;best=t;bd=d;bm=ch;}}
    if(!best)return;u.tgt=best.id;if(op.post==='ambush'&&!u.ambT){u.ambT=G.t;best.mor=clamp(best.mor-8,0,100);logE(u.side,'tac',uName(u)+'發動伏擊！（'+placeTxt(u.x,u.y)+'）',u.x,u.y,u.id);}directFire(u,s,best,bd,bm,SA,HA,rE,rM);});}
function directFire(u,s,t,d,ch,SA,HA,rE,rM){var ts=ST(t),dm=DT/60;if(SA===undefined){SA=saOf(u,s);HA=haOf(u,s);rE=s.rE*rngF(u);rM=s.rM*rngF(u);}var rf=rangeF(d,rE,rM);if(rf<=0)return;var fr=strFrac(u),fm=firerMod(u,s),tm=tgtModDirect(t,ts),fl=flankF(u,t),rr=0.7+0.6*rnd(),k=fr*rf*fm*tm*fl*dm*FIRE_K*rr*ch*ctrMul(u,t,'fire',d);
  if(u.lg&&u.lg.eqF)k*=u.lg.eqF.acc||1;var to=optOf(t),amb=u.ambT&&G.t-u.ambT<=DT*2?2.5:1;k*=amb*(to.post==='reverse'&&d>600&&t.ord&&/defend|screen/.test(t.ord.k)?0.5:1);
  var urbAT=ts.hard>=0.5&&s.hard<0.4&&d<400&&isUrban(G.map.lc[cellAt(t.x,t.y)])?1.8:1,ba=infDef(typeOf((t.mix||[[t.hq]])[0][0])||{}).ba||0;
  var pen=penE(u,s)+(s.fl.indexOf('T')>=0&&(ts.dom==='sea'||ts.dom==='sub')?6:0),Fm=SA*k*lgFire(u)*(1-0.15*ba),Fv=HA*k*VK*penF(pen,armVs(t,ts,u))*(s.fl.indexOf('T')>=0&&ts.dom==='sea'&&d<=rE?2:1)*lgFire(u)*urbAT;
  var dmn=Fm*(1-0.9*ts.hard)+Fv*ts.hard*(t.men/Math.max(1,t.veh))*0.35,dv=Fv*ts.hard+Fm*(1-ts.hard)*(t.veh/Math.max(1,t.men))*0.15;
  hit(t,u,dmn,dv,Math.min(30,4+600*(dmn+dv*4)/Math.max(10,t.men+t.veh*4))*WF(u).sup,'fire');if(urbAT>1&&!t.urbLog){t.urbLog=1;logE(u.side,'tac',uName(u)+'在'+placeTxt(t.x,t.y)+'的街巷中近距離伏擊'+uName(t),t.x,t.y,u.id);}u.ammo=Math.max(0,u.ammo-(s.fl.indexOf('x')>=0?12:s.dom==='sea'?0.1:0.25));}
/* ---------- 突擊與白刃：攻擊命令中的單位逼近到突擊距離 ---------- */
function assaultStep(){G.units.forEach(function(u){if(!onMap(u)||!isLeaf(u)||u.ms!=='ok'||u.sup>60||u.formTo||u.amph||(u.regT&&G.t<u.regT))return;var s=ST(u);if(s.dom==='air')return;var en=u._eid?uById(u._eid):null;if(!en||!onMap(en)||en.side===u.side)return;var es=ST(en);if(es.dom==='air')return;var d=dist(u.x,u.y,en.x,en.y);
    /* 海怪：纏住船艦 */
    if(s.fl.indexOf('K')>=0&&(es.dom==='sea'||es.dom==='sub')&&d<=300){var dm=DT/60,F=s.shock*0.015*dm*strFrac(u)*penF(penOf(s,u),es.arm)*(0.7+0.6*rnd());hit(en,u,F*en.men/Math.max(1,en.veh)*0.5,F,25,'grapple');return;}
    if(!u.ord||u.ord.k!=='attack'||optOf(u).tac==='feint'||d>aRng(u)||s.dom!=='land'&&es.dom!=='land'||en.ms==='rout')return;if(s.shock<=0.6)return;assault(u,s,en,es);});}
function assault(u,s,en,es){var MP=G.map,k=cellAt(en.x,en.y),c=MP.lc[k],cav=s.fl.indexOf('c')>=0,charge=cav&&G.t-(u.movedAt||-1e9)<DT+1&&!u.charged;
  var A=(u.men+u.veh*8)*s.shock*(u.mor/100)*(1-u.sup/120)*(0.7+0.6*(u.trn||60)/100)*(1-u.fat/250)*(charge?1.6:1)*(hasQ(offOf(u),'reckless')?1.15:1)*(cav&&hasQ(offOf(u),'cavalier')?1.15:1)*flankF(u,en)*(fmOf(u)==='column'?1.4:fmOf(u)==='skirmish'?0.4:1)*(optOf(u).tac==='infil'&&!known(en.side,u.id,300)?1.4:1)*(optOf(u).storm?1.2:1)*lgFire(u);
  var D=(en.men+en.veh*8)*es.mdef*(en.mor/100)*(1-en.sup/150)*(0.7+0.6*(en.trn||60)/100)*(es.dom==='land'?2-LC[c][4]:1)*(1+0.8*en.ent)*ftAsl(k,u);if(MP.ft[k]>=4)siegeUse(u,k);
  if(cav){if(en.form==='square')D*=3*(1+es.ac*0.3)*(s.fl.indexOf('L')>=0?0.6:1);else if(es.hard>=0.5)D*=3;else D*=(es.ac>0?1+es.ac*0.5:0.55)*(fmOf(en)==='skirmish'?0.5:1);}
  A*=((1-es.hard)+es.hard*penF(penOf(s,u),es.arm))*ctrMul(u,en,'melee');D*=((1-s.hard)+s.hard*penF(penOf(es,en),s.arm))*ctrMul(en,u,'melee');if(en.formTo)D*=0.6;if(MP.el[k]>MP.el[cellAt(u.x,u.y)]+20)D*=1.2;if(MP.rv[cellAt(u.x,u.y)]>=2||MP.lc[cellAt(u.x,u.y)]===LCI.riv)A*=0.6;
  var urb=isUrban(c);if(urb){A*=0.8;if(!en.ssLog||G.t-en.ssLog>3600){en.ssLog=G.t;logE(u.side,'tac',uName(u)+'與'+uName(en)+'在'+placeTxt(en.x,en.y)+'展開巷戰',en.x,en.y,u.id);}}
  var p=A/(A+D+1e-6),rr=0.7+0.6*rnd(),la=0.02*(1-p)*rr*(hasQ(offOf(u),'careful')?0.8:1)*(urb?1.3:1),ld=0.025*p*rr*(charge?1.5:1);
  hit(u,en,u.men*la,u.veh*la*0.6,10,'melee');hit(en,u,en.men*ld,en.veh*ld*0.6,15,'melee');en.mor=clamp(en.mor-6*p,0,100);u.mor=clamp(u.mor-4*(1-p),0,100);u.org=clamp(u.org-2,0,100);en.org=clamp(en.org-3,0,100);if(charge)u.charged=1;
  if(en.mor<(urb?22:30)||(p>0.5&&rnd()<(p-0.5)*0.4*(urb?0.5:1)&&!(optOf(en).post==='holdfast'&&en.mor>15))){var b=Math.atan2(en.y-u.y,en.x-u.x),bp=validPos(es,en.x+Math.cos(b)*700,en.y+Math.sin(b)*700);en.ms=en.mor<20?'rout':'shaken';en.task='go';en.ord=null;en.ent=0;en.path=null;wantPath(en,bp[0],bp[1]);en.org=clamp(en.org-20,0,100);if(G.set.dynMor!==false){u.mor=clamp(u.mor+4,0,100);mfAdd(u,'win',4);if(en.ms==='rout'){en.routN=(en.routN||0)+1;panicSpread(en,6,'panic');}}
    if(optOf(u).tac==='raid')u.raidOK=1;logE(u.side,'assault',uName(u)+'突擊成功，'+uName(en)+(en.ms==='rout'?'潰退':'被迫後撤')+'（'+placeTxt(en.x,en.y)+'）',en.x,en.y,u.id);u.charged=0;u.path={pts:[u.x,u.y,en.x,en.y],i:2};u.task='go';u.tgt=0;}
  else if(u.mor<35||(p<0.35&&rnd()<0.2)){var b2=Math.atan2(u.y-en.y,u.x-en.x),bp2=validPos(s,u.x+Math.cos(b2)*400,u.y+Math.sin(b2)*400);u.ms='shaken';u.task='hold';u.path={pts:[u.x,u.y,bp2[0],bp2[1]],i:2};u.task='go';u.ord=null;u.charged=0;
    logE(u.side,'assault',uName(u)+'對'+uName(en)+'的突擊被擊退（'+placeTxt(en.x,en.y)+'）',en.x,en.y,u.id);}}
/* ---------- 間接火力：砲擊命令、火力支援請求、反砲兵 ---------- */
var CFD=[0,0,5,5,20,15,6,4,2,10,1];/* 呼叫火力延遲（分） */
function artyStep(){G.units.forEach(function(u){if(!onMap(u)||!isLeaf(u)||u.ms==='rout')return;var s=ST(u),IR=indOf(u,s);if(!(IR>0)||s.dom==='air')return;var o=u.ord,auto=false;
    /* 待命的砲兵：只為指派的支援對象開火（見 artSupFor）；電腦指揮的直屬砲兵自動支援所屬上級單位 */
    var sf=(!o||o.k==='halt'||o.k==='reserve'||(o.st==='done'&&o.k!=='support')||(o.k==='move'||o.k==='withdraw')&&u.task==='hold'&&!u.path&&!u.pq)&&u.task!=='go'&&u.task!=='wait'?artSupFor(u):0;if(sf){o={k:'support',sup:sf,auto:1};auto=true;if(u.form!=='deployed'&&s.dom==='land'&&!u.formTo)setForm(u,'deployed');}
    if(!o)return;
    if(o.k==='bombard'&&(u.task==='hold'||u.task==='at')&&!u.mis&&o.x!==undefined){var t0=Math.max(G.t,o.tot||0);u.mis={x:o.x,y:o.y,r:o.r||missionR(s),start:t0,until:t0+(o.dur||1800),kind:o.sat?'sat':'bombard',mul:o.mul||1};logE(u.side,'arty',uName(u)+(o.sat?(s.fl.indexOf('z')>=0?'以全部發射架齊射，對':'參加同時彈著射擊，對')+placeTxt(o.x,o.y)+'實施飽和打擊'+(t0>G.t+60?'（'+durTxt(t0-G.t)+' 後彈著）':''):'開始砲擊'+placeTxt(o.x,o.y)+'（'+durTxt(o.dur||1800)+'）'),o.x,o.y,u.id);}
    if(o.k==='support'&&(u.task==='hold'||u.task==='at'||auto)&&(!u.mis||G.t>u.mis.until)&&G.step%4===0){var tg=supportTarget(u,s,o,IR);if(tg){var E=uEra(u),cd=CFD[E.i]*60*(hasQ(offOf(u),'arty')?0.7:1)*(inCmd(u)?1:1.5)*(auto?0.6:1)*(G.set.delayMul===undefined?1:G.set.delayMul);u.mis={x:tg.x,y:tg.y,r:missionR(s),start:G.t+cd,until:G.t+cd+600,kind:tg.cb?'cb':'support',tid:tg.id,auto:auto};if(auto&&(!u.autoLog||G.t-u.autoLog>1800)){u.autoLog=G.t;logE(u.side,'arty',uName(u)+(sf===u.supA?'依指派':'自動')+'為'+uName(uById(sf))+'提供火力支援（'+placeTxt(tg.x,tg.y)+'）',tg.x,tg.y,u.id);}}}
    var M=u.mis;if(!M)return;if(G.t>M.until&&M.kind==='sat'&&!M.f1&&G.t-M.start<1800)M.until=G.t+(o.dur||120);if(G.t>M.until){u.mis=null;if(o.k==='bombard'&&!auto){o.st='done';if(o.then==='support'){activate(u,newOrder('support',{sup:o.sup}));}else u.task='hold';}return;}
    if(G.t<M.start||u.form!=='deployed'&&s.dom==='land'||u.formTo||u.ammo<=0)return;if(dist(u.x,u.y,M.x,M.y)>IR*1.02)return;artyFire(u,s,M);});}
function missionR(s){return clamp(120+Math.sqrt(s.sa)*40,150,450);}
function supportTarget(u,s,o,IR){IR=IR||indOf(u,s);var F=o.sup?uById(o.sup):null,frs=F?leavesOf(F).filter(onMap):null,C=G.ct[u.side],best=null,bv=0,cx,cy,near;
  /* 未指定支援對象：只需要目標附近 2.5 公里內最近的友軍（更遠的不影響判斷），用空間格網查，不必逐一比對全軍 */var nf=function(x){if(!onMap(x)||!isLeaf(x))return;var dd=dist(x.x,x.y,cx,cy);if(dd<near)near=dd;};
  for(var id in C){var c=C[id];if(c.dead||c.dom==='air'||G.t-c.t>(c.cb?900:180))continue;var d=dist(u.x,u.y,c.x,c.y);if(d>IR*0.98)continue;near=1e9;if(frs){for(var i=0;i<frs.length;i++){var dd=dist(frs[i].x,frs[i].y,c.x,c.y);if(dd<near)near=dd;}}else{cx=c.x;cy=c.y;gridNearS(cx,cy,3100,u.side,nf);if(near>=2500)near=1e9;}
    if(near<(s.fl.indexOf('p')>=0?150:350))continue;/* 太近：避免誤擊 */var v=(near<2500?3/(1+near/600):0)+(c.cb?1.2:0)+(c.men||100)/2000;if(v>bv){bv=v;best=c;}}return bv>0.15?best:null;}
/* 砲兵散布：每次射擊任務有一個「平均彈著點」，和瞄準點的差距是系統誤差（測地、氣象、裝藥溫度、地圖），沒有觀測時會一直偏在同一邊；
   有人觀測時每一次修正都把它拉近。各發砲彈以平均彈著點為中心呈常態分布，沿射向（遠近）的散布大於左右；砲連各砲並排射擊，彈幕有寬度。
   面積射擊時，射擊指揮所把火力有系統地逐點轉移（一排一排來回），而不是在圓圈裡隨機亂落。 */
var ARTB=[60,55,45,40,320,260,170,90,45,120,30];/* 各時代未經觀測、未經標定的系統誤差（公尺，射程約 10 公里時） */
var ARTP=[0.02,0.018,0.014,0.008,0.006,0.005,0.0042,0.0036,0.003,0.01,0.0028];/* 各時代單發散布的距離公算偏差（占射程的比例） */
var ARTL=null;/* 最近一次射擊的散布，給畫面特效用 */
function artDisp(u,s,M,obs){var E=uEra(u),i=E.i,D=Math.max(300,dist(u.x,u.y,M.x,M.y)),ux=(M.x-u.x)/D,uy=(M.y-u.y)/D,rk=s.br==='rkt'||s.fl.indexOf('z')>=0,pg=s.fl.indexOf('p')>=0,pt=M.kind==='support'||M.kind==='cb';
  if(!(ux*ux+uy*uy>0.25)){ux=Math.cos(u.hd||0);uy=Math.sin(u.hd||0);}
  var pr=Math.max(12,ARTP[i]*D*(rk?2.6:1)*(s.dom==='sea'?1.4:1)*(pg?0.35:1)),pd=Math.max(8,pr*(rk?0.6:0.35)),sr=pr/0.6745,sd=pd/0.6745,
    tubes=clamp(Math.round(u.veh||u.men/20),1,72),sw=clamp(30*Math.sqrt(tubes),15,220)*(pt?0.6:1),
    key=Math.round(M.x)+','+Math.round(M.y)+','+Math.round(M.start||0),A=u._adj,fo=obs||!!(M.rg&&M.rg.obs);
  if(!A||A.k!==key){var reg=!!M.reg||!!(G.reg&&regKnown(u.side,M.x,M.y)),B=ARTB[i]*clamp(0.55+D/22000,0.6,1.5)*(pg?0.15:1)*(reg?0.35:1)*(hasQ(offOf(u),'arty')?0.8:1)*(u.lg&&u.lg.eqF&&u.lg.eqF.art||1),br,bd;
    if(A&&G.t-A.t<900&&dist(A.x,A.y,M.x,M.y)<1500){/* 從剛修正好的點轉移射擊：保留大部分修正，只多了轉移的誤差 */br=A.br*1.2+gauss(rnd)*B*0.25;bd=A.bd*1.2+gauss(rnd)*B*0.12;}
    else{br=gauss(rnd)*B*0.85;bd=gauss(rnd)*B*0.45;}
    A=u._adj={k:key,x:M.x,y:M.y,br:br,bd:bd,n:0,t:G.t,t0:G.t,ta:G.t};}
  if(G.t-A.ta>=(i>=8?DT:DT*2)){A.ta=G.t;if(fo){var f=i>=7?0.4:i>=4?0.55:0.6;A.br*=f;A.bd*=f;A.n++;}else if(M.rg&&!M.reg){A.br*=0.9;A.bd*=0.9;}else{A.br+=gauss(rnd)*pr*0.08;A.bd+=gauss(rnd)*pd*0.08;}}
  A.t=G.t;var ax=M.x,ay=M.y,R=M.r||300;
  if(M.kind==='sat'){/* 飽和打擊：火力計畫讓各砲分別瞄準目標區內不同的點，同一齊射就鋪滿整個區域 */sr=Math.sqrt(sr*sr+0.16*R*R);sw=Math.max(sw,0.6*R);}
  else if(M.kind==='bombard'&&R>sw*1.3){/* 面積射擊：把目標區分成幾排瞄準點，逐點、逐排來回轉移 */var dR=Math.max(2.2*sr,90,R*0.3),dD=Math.max(2*sw,90,R*0.3),L=[],nr=Math.floor(0.8*R/dR),nd=Math.floor(0.8*R/dD);
    for(var r0=-nr;r0<=nr;r0++){var row=[];for(var c0=-nd;c0<=nd;c0++){var aa=r0*dR,bb=c0*dD;if(aa*aa+bb*bb<=0.64*R*R)row.push([aa,bb]);}if((r0+nr)%2)row.reverse();L=L.concat(row);}
    if(L.length>1){var q=L[(Math.floor((G.t-A.t0)/DT+1e-6)+(u.id*7919)%L.length)%L.length];/* 各砲連分到不同的起始瞄準點，同時彈著時不會全落在同一處 */ax+=ux*q[0]-uy*q[1];ay+=uy*q[0]+ux*q[1];}}
  return {x:ax+ux*A.br-uy*A.bd,y:ay+uy*A.br+ux*A.bd,ax:ax,ay:ay,ux:ux,uy:uy,sr:sr,sd:sd,sw:sw};}
/* 依散布抽一發砲彈的落點 */
function artPt(D){var a=gauss(rnd)*D.sr,b=gauss(rnd)*D.sd+(rnd()*2-1)*D.sw;return [D.x+D.ux*a-D.uy*b,D.y+D.uy*a+D.ux*b];}
function artyFire(u,s,M){var MM=(M.mul||1)*(M.kind==='sat'&&!M.f1?2:1),dm=DT/60*MM,fr=strFrac(u),fm=firerMod(u,s)/(u.form==='deployed'?1:1),obs=false;if(M.kind==='sat'&&!M.f1){M.f1=1;if(G.onPause&&apOn('strike')&&!G._satP){G._satP=G.t;G.onPause('飽和打擊');}}if(G._satP&&G.t-G._satP>600)G._satP=0;
  var C=G.ct[u.side];for(var id in C){var c=C[id];if(G.t-c.t<=180&&dist(c.x,c.y,M.x,M.y)<(M.r||300)+300){obs=true;break;}}
  var D=artDisp(u,s,M,obs),sP2=D.sd*D.sd+D.sw*D.sw/3,sR2=D.sr*D.sr,Re=clamp(1.2*Math.sqrt(sR2+sP2),50,450);
  var acc=(obs?1:0.6)*(s.fl.indexOf('p')>=0?1.6:1)*(0.75+0.25*G.env.light),pen=penE(u,s),SA=saOf(u,s),HA=haOf(u,s),SF=WF(u).sup;
  gridNear(D.x,D.y,3*Math.sqrt(Math.max(sR2,sP2))+600,function(t){if(!onMap(t))return;var ts=ST(t);if(ts.dom==='air')return;var fp2=frontW(t)*120/PI,dx=t.x-D.x,dy=t.y-D.y,a=dx*D.ux+dy*D.uy,b=dy*D.ux-dx*D.uy,R2=sR2+fp2/2,P2=sP2+fp2/2,q=a*a/R2+b*b/P2;if(q>16)return;
    /* 落在部隊所佔範圍內的砲彈比例：部隊視為圓形，與散布的常態分布疊合 */var shr=Math.min(1,fp2/(2*Math.sqrt(R2*P2))*Math.exp(-0.5*q))*ART_D,sup=18*Math.min(1,shr)+6*Math.exp(-q/8);if(shr<0.002&&sup<1)return;
    /* 奇襲：五分鐘內沒挨過砲的部隊還沒掩蔽，第一輪齊射（同一步內各砲連一起落下）殺傷加倍 */var sp=1;if(t.side!==u.side){if(t._sfT===G.t)sp=2;else if(!(G.t-(t.uf===undefined?-1e9:t.uf)<=300)){sp=2;t._sfT=G.t;}}
    var fren=t.side===u.side?0.1:1,cov=covInd(t),dens=uEra(t).dens||1,rr=(0.7+0.6*rnd())*sp;
    var ba=infDef(typeOf((t.mix||[[t.hq]])[0][0])||{}).ba||0,cm=t.side===u.side?1:ctrMul(u,t,'art'),F=SA*fr*fm*acc*dm*FIRE_K*ART_K*shr*cov*dens*fren*rr*lgFire(u)*(1-0.07*ba)*cm,Fv=HA*fr*fm*acc*dm*FIRE_K*ART_K*shr*cov*penF(pen,ts.arm)*fren*rr*(s.fl.indexOf('p')>=0?2:1)*cm;
    hit(t,t.side===u.side?null:u,F*(1-0.9*ts.hard),Fv*ts.hard+F*(1-ts.hard)*(t.veh/Math.max(1,t.men))*0.25,sup*fren*SF,'art');if(t.side===u.side&&F>0.01&&!t.ffLog){t.ffLog=1;logE(u.side,'ff','誤擊！'+uName(u)+'的砲火落在'+uName(t)+'附近',t.x,t.y,t.id);}});
  var amt=clamp(2+SA*0.4,2,30);for(var k=0;k<2;k++){var p=artPt(D);urbanDamage(p[0],p[1],Math.min(Re,80),amt*0.5,u.side);}roadDmg(D.x,D.y,Math.min(Re,250),clamp(SA*0.15,1,8));if(G.civ)civArt(u,s,Object.assign({},M,{x:D.x,y:D.y,r:Re}),SA,fr,dm);wallHit(u,s,D.x,D.y,Math.min(Re,300));if(G.evt&&rnd()<0.05){var pf=artPt(D);fireChance(pf[0],pf[1]);}
  u.ammo=Math.max(0,u.ammo-(s.fl.indexOf('x')>=0?30:0.8)*(M.mul||1));u.fired=G.t;u.lastArt=G.t;ARTL=u._art={id:u.id,t:G.t,x:D.x,y:D.y,fa:Math.atan2(D.uy,D.ux),sr:D.sr,sd:D.sd,sw:D.sw,n:u._adj.n};cbNotice(u);}
var ART_D=0.9;
/* 城鎮受砲擊累積損毀，達門檻變成廢墟（廢墟提供更好的掩護，但車輛難以通行） */
function dmgArr(){var MP=G.map,N=MP.GW*MP.GH;if(!MP.dmg||MP.dmg.length!==N)MP.dmg=new Uint8Array(N);return MP.dmg;}
function urbanDamage(x,y,R,amt,side,cause){var MP=G.map,D=dmgArr();for(var i=0;i<6;i++){var a=rnd()*2*PI,r=Math.sqrt(rnd())*R,k=cellAt(x+Math.cos(a)*r,y+Math.sin(a)*r),c=MP.lc[k];if(!isUrban(c)||c===LCI.rubble)continue;var d0=D[k],v=d0+amt*(0.5+rnd());if(v>=200){D[k]=255;MP.lc[k]=LCI.rubble;(G._rubK=G._rubK||[]).push(k);v=255;}else D[k]=v;if(G.civ)civProp(k,(v-d0)/255,cause||'set',side===undefined?-1:side);}}
function cbNotice(u){if(u.cbP)return;var L=nSides()<3?[enemyOf(u.side)]:SIDES().filter(function(s){return hostile(u.side,s);});L.forEach(function(en){var hq=sideCmd(en),E=hq?uEra(hq):ERA[6];if(!(E.cb>0))return;u.cbP=1;G.cbq.push({side:en,id:u.id,at:G.t+E.cb*60*(0.6+0.8*rnd()),x:u.x,y:u.y});});}
function cbStep(){var keep=[];G.cbq.forEach(function(q){if(G.t<q.at){keep.push(q);return;}var u=uById(q.id);if(!u)return;u.cbP=0;if(!alive(u)||dist(u.x,u.y,q.x,q.y)>300||G.t-(u.lastArt||-1e9)>1800||!hostile(q.side,u.side))return;var s=ST(u);
    G.ct[q.side][u.id]={id:u.id,x:u.x+(rnd()-0.5)*200,y:u.y+(rnd()-0.5)*200,t:G.t,q:0.7,side:u.side,ech:dispEch(u),dom:s.dom,br:s.br,sym:s.sym,men:Math.round(u.men/50)*50,veh:u.veh,name:'',ms:u.ms,cb:1};
    if(!u.cbLog||G.t-u.cbLog>1800){u.cbLog=G.t;logE(q.side,'cb','反砲兵偵測：在'+placeTxt(u.x,u.y)+'定位到敵砲兵陣地',u.x,u.y);}});G.cbq=keep;}
/* ---------- 空中：防空射擊、空戰、對地攻擊（含飛龍吐息） ---------- */
function aaRange(aa){return aa<3?2500:aa<6?4000:aa<9?8000:aa<12?15000:40000;}
function airFight(){var A=G.units.filter(function(u){return u.st==='air'&&alive(u);});if(!A.length)return;var dm=DT/60;
  /* 防空 */
  G.units.forEach(function(g){if(!onMap(g)||g.st==='air'||g.ms==='rout')return;var s=ST(g),AA=aaOf(g,s);if(!(AA>0)||g.ammo<=0)return;var R=aaRangeU(g,AA),sam=samOf(g),vis=!sam&&G.env.light<0.3&&s.nv<1&&uEra(g).i<6?0.3:1,best=null,bd=R;
    A.forEach(function(a){if(!hostile(g.side,a.side))return;var d=dist(g.x,g.y,a.x,a.y);if(d<bd&&aaSees(g,a,d)){bd=d;best=a;}});if(!best)return;var es=ST(best),F=AA*0.03*dm*strFrac(g)*vis*(1-g.sup/150)*clamp(es.sig,0.3,3)/(1+es.arm/3)*AAK*(0.7+0.6*rnd())*ctrMul(g,best,'aa')*(sam?clamp(1.5-bd/R,0.5,1):1);
    hit(best,g,F*best.men/Math.max(1,best.veh),F,6,'aa');g.ammo=Math.max(0,g.ammo-0.1);});
  /* 空戰 */
  A.forEach(function(f){var s=ST(f),fa=ldAA(f,s);if(!(fa>0)||f.ms==='rout'||f.task==='rtb'&&s.fl.indexOf('Y')<0)return;var R=Math.max(3000,Math.min(Math.max(s.rE,3000),s.spot*0.6)),best=null,bd=R;
    A.forEach(function(e){if(!hostile(f.side,e.side))return;var d=dist(f.x,f.y,e.x,e.y);if(d<bd&&airSees(f,e,d)){bd=d;best=e;}});if(!best)return;var es=ST(best),rel=clamp(1+0.12*(fa-ldAA(best,es)),0.3,2.5),F=fa*0.05*dm*strFrac(f)*rel*AAK/(1+es.arm/4)*(G.env.light<0.3&&s.nv<1?0.3:1)*(0.7+0.6*rnd())*ctrMul(f,best,'air')*firstLook(f,best,bd);
    hit(best,f,F*best.men/Math.max(1,best.veh),F,10,'air');});
  /* 對地攻擊 */
  A.forEach(function(a){var s=ST(a),o=a.ord,SA=saOf(a,s),HA=haOf(a,s);if(!o||a.task!=='loiter'||a.ammo<=0||a.ms==='rout')return;if(!/strike|bomb|attack|bombard/.test(o.k)&&!(o.k==='patrol'&&s.fl.indexOf('Y')>=0))return;if(SA<=0&&HA<=0)return;
    var R=Math.max(1500,o.r||3000),best=null,bv=0;gridNear(o.x,o.y,R,function(t){if(t.side===a.side||!onMap(t))return;var ts=ST(t);if(ts.dom==='air')return;if(!known(a.side,t.id,240)&&!(a._seen&&a._seen.indexOf(t.id)>=0))return;
      var v=(t.men+(t.cargoN||0)+t.veh*(HA>SA*0.3?20:8))/(1+dist(o.x,o.y,t.x,t.y)/3000);if(v>bv){bv=v;best=t;}});if(!best)return;
    var night=G.env.light<0.3?[0.15,0.5,0.9][clamp(s.nv,0,2)]:1,w=WX[G.env.wx][5],fr=strFrac(a),pen=penE(a,s),area=s.fl.indexOf('Y')>=0||(SA>=20&&HA<SA*0.2),cx=best.x,cy=best.y;
    var tgts=area?[]:[best];if(area)gridNear(cx,cy,300,function(t){if(t.side!==a.side&&onMap(t)&&ST(t).dom!=='air'&&dist(t.x,t.y,cx,cy)<=300)tgts.push(t);});
    tgts.forEach(function(t){var ts=ST(t),cov=covInd(t),f=(t===best?1:0.6)*fr*dm*FIRE_K*AIR_K*night*w*cov*(0.7+0.6*rnd())*ctrMul(a,t,'air'),F=SA*f,Fv=HA*f*penF(pen,armVs(t,ts,a));hit(t,a,F*(1-0.9*ts.hard),Fv*ts.hard+F*(1-ts.hard)*(t.veh/Math.max(1,t.men))*0.25,area?25:15,s.fl.indexOf('Y')>=0?'breath':'airstrike');});
    roadDmg(cx,cy,area?300:150,clamp(SA*0.2,2,20));if(G.civ){civHitAir(a,s,cx,cy,SA,fr,dm,area);if(area)urbanDamage(cx,cy,300,clamp(SA*0.3,2,25),a.side);}
    a.ammo=Math.max(0,a.ammo-(s.fl.indexOf('Z')>=0?6:s.fl.indexOf('Y')>=0?5:14));if(!a.atkLog||G.t-a.atkLog>1200){a.atkLog=G.t;logE(a.side,'air',uName(a)+(s.fl.indexOf('Y')>=0?'向':'攻擊')+uName(best)+(s.fl.indexOf('Y')>=0?'噴吐烈焰':'')+'（'+placeTxt(cx,cy)+'）',cx,cy,a.id);}});}
/* ---------- 套用傷害、陣亡與殲滅判定 ---------- */
function applyDamage(){for(var id in G._inc){var t=uById(+id),I=G._inc[id];if(!t||!alive(t))continue;var m=Math.min(t.men,I.m),v=Math.min(t.veh,I.v);t.men-=m;t.veh-=v;t.cas=(t.cas||0)+m;t.vlost=(t.vlost||0)+v;if(G.civ){woundSplit(t,m,I.k||{});milLoss(t,v,m);}t.sup=Math.min(100,t.sup+Math.min(45,I.sup)/profOf(t)[4]);
    var f0=t.men0+t.veh0*8||1,stub=hasQ(offOf(t),'stubborn')&&t.ord&&/defend|halt/.test(t.ord.k)?0.6:1,ml=(m+v*8)/f0*160*stub;if(m+v>0.05)t._hitT=G.t;
    if(G.set.dynMor!==false&&ST(t).dom==='land'){t.rcas=(t.rcas||0)+(m+v*8)/f0;var fs=0,tw=0,kb;if(t.form==='deployed'&&isLeaf(t))for(kb in I.by){var at=uById(+kb);if(!at)continue;var w=I.by[kb];tw+=w;var ad=Math.abs(angDiff(t.hd||0,Math.atan2(at.y-t.y,at.x-t.x)));if(ad>PI*0.45)fs+=w*(ad>PI*0.75?1.5:1);}
      var ff=tw>0?fs/tw:0;if(ff>0.4){t.flankT=G.t;ml*=1+0.4*Math.min(1.5,ff);}ml*=1-0.25*(t.ent||0);if(I.k&&(I.k.airstrike||I.k.air)&&profIdxOf(t)<=1)ml*=1.2;}
    t.mor=clamp(t.mor-ml,0,100);
    var tot=0,k;for(k in I.by)tot+=I.by[k];for(k in I.by){var a=uById(+k);if(a){var sh=I.by[k]/tot;a.kills=(a.kills||0)+m*sh;a.vkills=(a.vkills||0)+v*sh;}}
    G.stats[t.side].cas+=m;G.stats[t.side].vl+=v;var kt=0,kk;for(kk in I.k)kt+=I.k[kk];var R=btAct(t.id),byS=G.stats[t.side].byK||(G.stats[t.side].byK={});t.byK=t.byK||{};for(kk in I.k){var sh2=I.k[kk]/kt;t.byK[kk]=(t.byK[kk]||0)+m*sh2;byS[kk]=(byS[kk]||0)+m*sh2;if(R){R.cause=R.cause||sAO();if(!R.cause[t.side])R.cause[t.side]={};R.cause[t.side][kk]=(R.cause[t.side][kk]||0)+m*sh2;R.vc=R.vc||sAO();if(!R.vc[t.side])R.vc[t.side]={};R.vc[t.side][kk]=(R.vc[t.side][kk]||0)+v*sh2;}}
    if(m+v>0.05){var nm=Object.keys(I.by).map(function(id){var a=uById(+id);return a?uName(a):'';}).filter(Boolean);t.ce=t.ce||[];t.ce.push({t:G.t,k:Object.keys(I.k).sort(function(a,b){return I.k[b]-I.k[a];})[0],m:m,v:v,by:nm.slice(0,3),n:nm.length});if(t.ce.length>40)t.ce.shift();}
    if(strFrac(t)<deathF(t))destroy(t,'cas');}G._inc={};}
var KINDN={fire:'直射火力',melee:'突擊與白刃',art:'砲兵火力',air:'空戰',aa:'防空火力',airstrike:'空中攻擊',breath:'龍息',grapple:'海怪纏鬥',nuke:'戰術核武',rad:'輻射',drop:'空降時防空火力',storm:'天災（颱風、洪水、山崩）',quake:'地震',burn:'野火'};
function destroy(u,why,msg){if(!alive(u)||u.hqLost)return;var s=ST(u);if(!isLeaf(u)){u.hqLost=G.t;u.hqRe=G.t+3600*(1.6-0.06*((u.off||{}).cmd||5));u.men=0;u.veh=0;u.path=null;logE(u.side,'hq',uName(u)+'的司令部被摧毀！指揮中斷，預計 '+durTxt(u.hqRe-G.t)+' 後重建',u.x,u.y,u.id);if(G.onPause&&apOn('hq'))G.onPause('司令部被摧毀');return;}
  u.st='dead';u.deadT=G.t;u.why=why;if(why==='capt'){u.captMen=u.men;G.stats[u.side].capt+=u.men;if(G.civ)powCapture(u,u._capBy?uById(u._capBy):null);}else if(G.civ&&u.wia>0){/* 殲滅：留在原地的傷兵多數不治或被俘 */}u.path=null;u.mis=null;var verb=s.dom==='sea'||s.dom==='sub'?'被擊沉':s.dom==='air'?'被擊落':why==='capt'?'被俘':'被殲滅';
  logE(u.side,u.surr?'surr':'dead',msg||(uName(u)+verb+'（'+placeTxt(u.x,u.y)+'）'),u.x,u.y,u.id);if(G.set.dynMor!==false&&s.dom==='land'&&G._grid)gridNear(u.x,u.y,2000,function(f){if(hostile(f.side,u.side)&&onMap(f)&&dist(f.x,f.y,u.x,u.y)<2000){f.mor=clamp(f.mor+2.5,0,100);mfAdd(f,'win',2.5);}});(function up(p){if(p<0)return;var F=uById(p);if(!F)return;if(!leavesOf(F).some(function(x){return alive(x)||x.st==='off';})){F.st='dead';F.deadT=G.t;logE(F.side,'dead',uName(F)+'已無可用兵力',F.x,F.y,F.id);up(F.p);}})(u.p);}

/* ===================== 戰術核武：爆心全毀區、重創區、輕傷區、震撼區；地表焦土與廢墟、橋梁損毀、殘留輻射區 ===================== */
function nukeR(Y){var c=Math.cbrt(Math.max(0.01,Y));return [400*c,1100*c,2200*c,3500*c];}
function nukeAt(side,x,y,Y,src){var MP=G.map,R=nukeR(Y),civ=0,hitN=0;G.nukes=G.nukes||[];G.nukes.push({t:G.t,x:x,y:y,Y:Y,side:side,R:R});
  G.units.forEach(function(t){if(!alive(t)||t.st==='off'||t.st==='lift'||(src&&t===src&&t.st==='air'))return;var ts=ST(t),d=dist(t.x,t.y,x,y);if(d>R[3])return;if(t.st==='base'&&d>R[1])return;var ent=ts.dom==='land'?(t.ent||0):0,hard=ts.hard,mf=0,vf=0;
    if(d<R[0]){mf=0.97;vf=hard>=0.5?0.85:0.98;}else if(d<R[1]){var f=(d-R[0])/(R[1]-R[0]);mf=lerp(0.9,0.35,f)*(1-0.5*ent)*(1-0.4*hard);vf=lerp(0.6,0.15,f)*(1-0.5*hard)+0.08;}
    else if(d<R[2]){var f2=(d-R[1])/(R[2]-R[1]);mf=lerp(0.25,0.03,f2)*(1-0.6*ent)*(1-0.5*hard);vf=lerp(0.1,0.01,f2)*(1-0.7*hard);}
    if(ts.dom==='air'&&t.st==='air'&&d<R[2]){mf=Math.max(mf,0.6);vf=Math.max(vf,0.6);}if(mf+vf>0)hitN++;
    hit(t,src||null,t.men*mf,t.veh*vf,d<R[2]?100:60,'nuke');t.mor=clamp(t.mor-(d<R[1]?60:d<R[2]?35:15),0,100);t.org=clamp(t.org-(d<R[2]?50:15),0,100);});
  /* 地表：城鎮成為廢墟、植被與農田成為焦土、橋梁損毀 */
  var ks=[],cs=MP.cs,cx=x/cs,cy=y/cs,D=dmgArr();brushCells(MP,cx,cy,R[1]/cs,function(k,t){var c=MP.lc[k],dd=t*R[1];if(isWater(c))return;if(isUrban(c)&&(dd<R[0]||rnd()<0.6)){MP.lc[k]=LCI.rubble;D[k]=255;ks.push(k);}else if(!isUrban(c)&&c!==LCI.rock&&c!==LCI.snow&&c!==LCI.desert&&c!==LCI.sand&&(dd<R[0]||rnd()<0.45)){MP.lc[k]=LCI.burnt;ks.push(k);}});
  var lostB=MP.brg.filter(function(q){return dist((q.x+0.5)*cs,(q.y+0.5)*cs,x,y)<R[0]*1.2;});if(lostB.length){lostB.forEach(function(q){var k=q.y*MP.GW+q.x;MP.rd[k]=0;MP.rl[k]=0;ks.push(k);});MP.brg=MP.brg.filter(function(q){return lostB.indexOf(q)<0;});}
  if(ks.length)mapChanged(ks);
  if(G.civ){civ=civNuke(x,y,R,side);ks.forEach(function(k){civProp(k,1,'set',side);});}else (MP.set||[]).forEach(function(s){var d=dist(s.x*cs,s.y*cs,x,y);if(d<R[2])civ+=s.pop*(d<R[0]?0.85:d<R[1]?0.4:0.08);});
  G.rad=G.rad||[];G.rad.push({x:x,y:y,r:R[0]*1.3,t0:G.t,t1:G.t+12*3600,side:side,Y:Y});G.stats[side].nukes=(G.stats[side].nukes||0)+1;
  logE(-1,'nuke','☢ '+G.sides[side].name+'在'+placeTxt(x,y)+'實施戰術核打擊（'+fmt(Y,Y<1?2:0)+' 千噸），全毀半徑 '+kmTxt(R[0])+'、重創半徑 '+kmTxt(R[1])+'；波及 '+hitN+' 個單位'+(civ>1?'，平民傷亡估計約 '+fmt(civ)+' 人':''),x,y,src?src.id:undefined);
  if(G.onPause&&apOn('nuke'))G.onPause('戰術核打擊');}
/* 殘留輻射：區內地面部隊持續傷亡 */
function radStep(){if(!G.rad||!G.rad.length)return;var dm=DT*4/3600;G.rad=G.rad.filter(function(z){return G.t<z.t1;});G.rad.forEach(function(z){var dec=1-(G.t-z.t0)/(z.t1-z.t0);gridNear(z.x,z.y,z.r,function(u){if(!onMap(u)||ST(u).dom==='air'||dist(u.x,u.y,z.x,z.y)>z.r)return;var hard=ST(u).hard;hit(u,null,u.men*0.04*dm*dec*(1-0.6*hard),0,5,'rad');u.mor=clamp(u.mor-2*dm*dec,0,100);if(!u.radLog){u.radLog=1;logE(u.side,'nuke',uName(u)+'進入輻射污染區（'+placeTxt(u.x,u.y)+'）',u.x,u.y,u.id);}});});}
/* 核打擊排程：彈頭飛行時間後引爆；導引火箭可能被區域防空攔截 */
function nukeStep(){if(!G.nq||!G.nq.length)return;var keep=[];G.nq.forEach(function(q){if(G.t<q.at){keep.push(q);return;}var src=uById(q.src);
    if(q.via==='rkt'){var sams=0;G.units.forEach(function(e){if(hostile(q.side,e.side)&&onMap(e)&&aaOf(e,ST(e))>=8&&dist(e.x,e.y,q.x,q.y)<25000)sams++;});if(sams&&rnd()<Math.min(0.5,sams*0.1)){logE(-1,'nuke','☢ '+G.sides[q.side].name+'發射的核彈頭在空中被攔截',q.x,q.y);return;}}
    nukeAt(q.side,q.x,q.y,q.Y,src,q.wk);});G.nq=keep;}
/* 可實施核打擊的單位與一般的最大當量（千噸）；當量可自訂，超過一般上限時會提醒 */
function nukeCap(u){var s=ST(u),E=uEra(u),y=G.set.y||1943,ny=typeof featY==='function'?featY('nuke'):1945;if(!G.set.nuke||!G.set.nuke.on||E.fan||y<ny||!isLeaf(u))return 0;if(s.dom==='air'&&s.fl.indexOf('B')>=0&&(s.sa>0||s.ha>0))return y<ny+5?25:y<ny+10?500:10000;if(y<ny+8)return 0;if(indOf(u,s)>=20000)return y<1970?20:10;if(indOf(u,s)>=14000)return 1;return 0;}
