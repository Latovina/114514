/* ===================== v5：航空母艦作業、運輸船團、飽和打擊、地毯式轟炸、區域外飛彈、戰略核武、不投降教條 ===================== */
Object.assign(ORDN,{sat:'飽和打擊',carpet:'地毯式轟炸',msl:'飛彈精確打擊'});
Object.assign(CIVK,{carpet:'地毯式轟炸',msl:'飛彈打擊',snuke:'戰略核武',drown:'船艦沉沒',suicide:'在軍方宣傳與脅迫下集體自殺'});
Object.assign(KIAF,{drown:0.65,carpet:0.4,msl:0.45,snuke:0.65,fallout:0.5});
Object.assign(KINDN,{drown:'船艦沉沒',carpet:'地毯式轟炸',msl:'飛彈打擊',snuke:'戰略核武',fallout:'輻射落塵'});
function gss(){var a=Math.max(1e-9,rnd()),b=rnd();return Math.sqrt(-2*Math.log(a))*Math.cos(2*PI*b);}
function yTxt(Y){return Y>=1000?fmt(Y/1000,Y%1000?1:0)+' 百萬噸':fmt(Y,Y<1?2:0)+' 千噸';}
function dirTxt(a){return ['東','東南','南','西南','西','西北','北','東北'][((Math.round(a/(PI/4))%8)+8)%8];}
function topOf(u){var c=u;while(c&&c.p>=0){var p=uById(c.p);if(!p)break;c=p;}return c;}

/* ---------- 航空母艦：艦載機以母艦為基地；母艦沉沒或飛行甲板受損時改降他艦或陸上機場 ---------- */
function isCV(u){var s=ST(u);return isLeaf(u)&&s.dom==='sea'&&s.fl.indexOf('C')>=0;}
function isCVAir(u){var s=ST(u);return isLeaf(u)&&s.dom==='air'&&s.fl.indexOf('o')>=0;}
function cvDeck(c){return !!c&&alive(c)&&c.st!=='off'&&c.st!=='ship'&&c.veh>=(c.veh0||1)*0.5;}
function cvCap(c){var n=0;c.mix.forEach(function(m){n+=(utx(m[0]).cvA||0)*(m[1]||1);});return n*clamp(c.veh/Math.max(0.01,c.veh0||1),0,1);}
function landBase(side){var N=nodesOf(side).filter(function(q){return q.k==='air';})[0];return N?[N.x,N.y]:edgePoint(side,0.5);}
function cvStep(){var A=G.units.filter(function(a){return isCVAir(a)&&alive(a)&&a.st!=='off'&&a.st!=='ship';});if(!A.length)return;var load={};A.forEach(function(a){if(a.baseU)load[a.baseU]=(load[a.baseU]||0)+a.veh;});
  A.forEach(function(a){var c=a.baseU?uById(a.baseU):null;if(c&&cvDeck(c))return;
    if(c&&!alive(c)&&a.st==='base'){destroy(a,'dead',uName(a)+'停在甲板與機庫內的飛機隨母艦'+uName(c)+'沉沒');return;}
    if(!c&&a.cvChk&&G.t-a.cvChk<600)return;a.cvChk=G.t;if(c)load[c.id]=(load[c.id]||0)-a.veh;var T=topOf(a),best=null,bs=-1e18;
    G.units.forEach(function(q){if(q.side!==a.side||!isCV(q)||!cvDeck(q))return;var same=topOf(q)===T;if(!same&&!a.cvHad)return;if(cvCap(q)-(load[q.id]||0)<a.veh*0.8)return;var sc=-dist(q.x,q.y,a.x,a.y)/1000+(same?200:0);if(sc>bs){bs=sc;best=q;}});
    if(best){a.baseU=best.id;a.cvHad=1;load[best.id]=(load[best.id]||0)+a.veh;if(a.st==='base'){a.x=best.x;a.y=best.y;}if(c)logE(a.side,'air',uName(a)+'改以'+uName(best)+'為母艦（'+uName(c)+(alive(c)?'飛行甲板受損':'已沉沒')+'）',a.x,a.y,a.id);}
    else if(c){a.baseU=0;a.base=landBase(a.side);logE(a.side,'air',uName(a)+'失去母艦，改飛陸上機場',a.x,a.y,a.id);}});}
/* 燃油耗盡：找不到基地的飛機迫降 */
function ditchStep(){G.units.forEach(function(a){if(a.st!=='air'||!isLeaf(a)||!alive(a)||!(a.fuel<-1200))return;var sea=isWater(G.map.lc[cellAt(a.x,a.y)]);destroy(a,'dead',uName(a)+'燃油耗盡，'+(sea?'迫降海上':'迫降')+'（'+placeTxt(a.x,a.y)+'）');});}

/* ---------- 機場遭砲擊或轟炸：停放在地面的飛機受損，跑道彈坑延後出擊 ---------- */
function afHit(side,x,y,R,amt,src){if(!(amt>0))return;var n=0,C=G._afL;if(!C||C.s!==G.step)C=G._afL={s:G.step,l:G.units.filter(function(a){return a.st==='base'&&!a.baseU&&alive(a);})};if(!C.l.length)return 0;C.l.forEach(function(a){if(a.side===side||a.st!=='base'||!alive(a)||dist(a.x,a.y,x,y)>R)return;var dv=Math.min(a.veh,amt*(0.6+0.8*rnd()));if(dv<=0)return;hit(a,src||null,dv*a.men/Math.max(1,a.veh)*0.3,dv,0,src&&ST(src).dom==='air'?'airstrike':'art');a.readyT=Math.max(a.readyT||0,G.t+900);n++;
    if(!a.afLog||G.t-a.afLog>1800){a.afLog=G.t;logE(a.side,'air','機場遭到'+(src&&ST(src).dom==='air'?'轟炸':'砲擊')+'：'+uName(a)+'停在地面的飛機受損，跑道彈坑延誤出擊',a.x,a.y,a.id);}});return n;}
(function(){var b=artyFire;artyFire=function(u,s,M){b(u,s,M);if(G.step%2===0)afHit(u.side,M.x,M.y,(M.r||300)+300,saOf(u,s)*strFrac(u)*(M.mul||1)*0.004,u);};})();

/* ---------- 對艦攻擊：魚雷轟炸與俯衝轟炸命中率高，高空水平轟炸幾乎打不中移動中的艦艇 ---------- */
(function(){var b=ctrMul;ctrMul=function(a,t,kind,d){var m=b(a,t,kind,d);if(kind!=='air'||!a||a.st!=='air')return m;var sa=ST(a),td=ST(t).dom;
  if(td==='sea'||td==='sub'){if(sa.fl.indexOf('T')>=0)m*=3;else if(sa.fl.indexOf('w')>=0)m*=2.4;else if(sa.fl.indexOf('v')>=0&&sa.fl.indexOf('p')<0)m*=0.25;}else if(sa.fl.indexOf('w')>=0&&ST(t).hard>=0.5)m*=1.3;return m;};})();

/* ---------- 運輸船團：增援部隊搭船駛來，在灘頭外海以小艇或登陸艇分批卸載；船艦被擊沉時船上官兵隨船罹難 ---------- */
function cvyType(A){if(A&&A.ship&&UT[A.ship])return A.ship;var y=G.set.y||1943;return y<1850?'trs1800':y<1939?'trs1914':y<1955?'trs1940':y<1990?'trs1970':'trs2000';}
function seaEntry(side,x,y){var MP=G.map,cs=MP.cs,e=SD(side).edge||'W',best=null,bs=1e18;for(var i=1;i<60;i++){var f=i/60;[['W',cs*2,MP.Hm*f],['E',MP.Wm-cs*2,MP.Hm*f],['N',MP.Wm*f,cs*2],['S',MP.Wm*f,MP.Hm-cs*2]].forEach(function(q){if(!seaWater(MP.lc[cellAt(q[1],q[2])]))return;var d=dist(q[1],q[2],x,y)*(q[0]===e?0.55:1);if(d<bs){bs=d;best=[q[1],q[2]];}});}return best;}
function arriveShip(F,A,x,y){var N=treeNodes(F),land=N.filter(function(z){return isLeaf(z)&&z.st!=='dead'&&ST(z).dom==='land';});if(!land.length)return;var O=offshore(x,y),E=O?seaEntry(F.side,O[0],O[1]):null;
  if(!O||!E){logE(F.side,'amph','找不到運輸船可以靠近的海岸，'+uName(F)+'改由陸路進入',x,y,F.id);var p=edgePoint(F.side,0.5);deployTree(F,p[0],p[1],Math.atan2(G.map.Hm/2-p[1],G.map.Wm/2-p[0]),0);return;}
  var tk=cvyType(A),t=UT[tk],X=utx(tk),men=sum(land,function(z){return z.men;}),veh=sum(land,function(z){return z.veh;}),ships=Math.max(1,Math.ceil(Math.max(men/(X.pax||1000),X.pv?veh/X.pv:0))),m=Math.max(1,Math.ceil(ships/Math.max(1,t.veh)));
  var C=addLeaf(F.side,tk,m,uName(F)+'運輸船團',-1,mb32(hstr('cvy'+F.id+'|'+G.t)));C.x=E[0];C.y=E[1];C.hd=Math.atan2(O[1]-E[1],O[0]-E[0]);C.home=[E[0],E[1]];C.placed=1;C.isReinf=1;C.form='march';if(!C.lg)logInit(C);
  C.cvy={f:F.id,bx:x,by:y,ox:O[0],oy:O[1],ex:E[0],ey:E[1],ph:A.night?'wait':'go',pax:land.map(function(z){return z.id;}),vp:C.veh,t0:G.t,nx:0,night:!!A.night,i:0};
  N.forEach(function(z){if(z.st==='dead'||(isLeaf(z)&&ST(z).dom!=='land'))return;z.st='ship';z.cvyId=C.id;z.x=C.x;z.y=C.y;z.path=null;z.pq=0;z.goal=null;z.task=null;z.pend=[];});C.cargoN=men;
  if(!C.cvy.night)cvyGo(C,O[0],O[1]);
  logE(F.side,'amph','增援 '+uName(F)+'（'+fmt(men)+' 人）搭乘 '+fmt(m*t.veh)+' 艘'+t.n.replace(/(分隊|船隊|隊)$/,'')+'由海上駛來'+(A.night?'，等待天黑後駛入':'')+'，預定在'+placeTxt(x,y)+'外海卸載',E[0],E[1],C.id);}
function cvyGo(C,x,y){var o=newOrder('move',{x:x,y:y});o.cvySys=1;C.cvy.ord=o;activate(C,o);}
function cvyStep(){G.units.forEach(function(C){if(C.cvy&&!C.cvy.done)cvyOne(C);});}
function cvyOne(C){var Q=C.cvy,X=utx(C.mix[0][0]),ships=C.st==='dead'?0:Math.max(0,C.veh),aboard=Q.pax.map(uById).filter(function(z){return z&&z.st==='ship';});
  /* 船艦損失：依沉沒比例，船上官兵落海 */
  if(ships<Q.vp-1e-6){var lf=Q.vp>0?(Q.vp-ships)/Q.vp:1;Q.vp=ships;var lost=0;aboard.forEach(function(z){var m=z.men*lf;lost+=m;hit(z,null,m,z.veh*lf,0,'drown');});
    if(lost>0.5){Q.drown=(Q.drown||0)+lost;logE(C.side,'amph','⚓ '+uName(C)+(ships<=0.01?'全數被擊沉':'有運輸船被擊沉')+'，船上約 '+fmt(lost)+' 名官兵落海',C.x,C.y,C.id);if(G.onPause&&apOn('convoy'))G.onPause('運輸船遭擊沉');}}
  C.cargoN=sum(aboard,function(z){return z.men;});aboard.forEach(function(z){z.x=C.x;z.y=C.y;});
  if(C.st==='dead'){Q.done=1;aboard.forEach(function(z){hit(z,null,z.men,z.veh,0,'drown');});return;}
  if(C.ord!==Q.ord&&Q.ord&&Q.ph!=='unl'){C.ord=Q.ord;}
  if(Q.ph==='wait'){if(G.env.light<0.3){Q.ph='go';cvyGo(C,Q.ox,Q.oy);logE(C.side,'amph',uName(C)+'趁夜駛入',C.x,C.y,C.id);}return;}
  if(Q.ph==='go'){var d=dist(C.x,C.y,Q.ox,Q.oy);if(d<Math.max(900,G.map.cs*3)||(G.t-Q.t0>1800&&!C.path&&!C.pq&&d<6000)){Q.ph='unl';Q.nx=G.t+300;C.path=null;C.task='hold';logE(C.side,'amph',uName(C)+'抵達'+placeTxt(Q.bx,Q.by)+'外海，開始卸載',C.x,C.y,C.id);}
    else if(G.t-Q.t0>6*3600){Q.ph='unl';Q.nx=G.t;}return;}
  if(Q.ph==='unl'){if(G.t<Q.nx)return;if(!aboard.length){cvyDone(C);return;}
    var night=G.env.light<0.3,port=nodesOf(C.side).some(function(n){return n.k==='port'&&dist(n.x,n.y,Q.bx,Q.by)<3000;}),capM=(X.rate||400)*Math.max(0.3,ships)*(port?2:1)*(night?0.7:1),capV=(X.vrate||1)*Math.max(0.3,ships)*(port?2.5:1),ax=Math.cos(C.hd+PI/2),ay=Math.sin(C.hd+PI/2),nl=0;
    aboard.sort(function(a,b){return a.veh/Math.max(1,a.men)-b.veh/Math.max(1,b.men);});
    for(var i=0;i<aboard.length;i++){var z=aboard[i];if(nl>0&&(z.men>capM||z.veh>capV*1.5))break;capM-=z.men;capV-=z.veh;cvyLand(C,z,ax,ay);nl++;if(capM<=0)break;}
    Q.nx=G.t+600;return;}
  if(Q.ph==='ret'){if(dist(C.x,C.y,Q.ex,Q.ey)<Math.max(1500,G.map.cs*4)||(!C.path&&!C.pq&&G.t-Q.tr>1800)){C.st='off';C.gone=1;Q.done=1;logE(C.side,'amph',uName(C)+'駛離戰區',C.x,C.y,C.id);}}}
function cvyLand(C,z,ax,ay){var Q=C.cvy,i=Q.i++,off=((i%7)-3)*220,p=validPos(ST(z),Q.bx+ax*off,Q.by+ay*off),th=z.ord&&z.ord.k&&z.ord.k!=='halt'?z.ord:null;
  z.st='ok';z.cvyId=0;startAmph(z,p[0],p[1],th,C.x,C.y);
  ancestors(z).forEach(function(F){if(F.st==='ship'){F.st='ok';F.x=p[0];F.y=p[1];F.cvyId=0;}});}
function cvyDone(C){var Q=C.cvy,X=utx(C.mix[0][0]),tons=(X.sup||0)*Math.max(0,C.veh);
  if(tons>0){var Nd=null,bd=8000;nodesOf(C.side).forEach(function(n){if(n.k==='off')return;var d=dist(n.x,n.y,Q.bx,Q.by);if(d<bd){bd=d;Nd=n;}});if(!Nd)Nd=addNode(C.side,'depot',Q.bx,Q.by,{name:'灘頭補給站',st:{food:0,ammo:0,fuel:0,fod:0}});split(Nd,tons,sideDemand(C.side));Q.sup=tons;}
  Q.ph='ret';Q.tr=G.t;cvyGo(C,Q.ex,Q.ey);logE(C.side,'amph',uName(C)+'卸載完畢'+(tons>0?'（另卸下約 '+fmt(tons)+' 公噸補給）':'')+'，返航',C.x,C.y,C.id);}
/* 部隊在船上時不在地圖上：不行動、不受陸上攻擊 */
(function(){var b=hqStep;hqStep=function(F){if(F.st==='ship'){var c=uById(F.cvyId);if(c){F.x=c.x;F.y=c.y;}return;}b(F);};})();

/* ---------- 飽和打擊 ---------- */
function satCount(u){return (isLeaf(u)?[u]:leavesOf(u)).filter(function(l){return alive(l)&&indOf(l,ST(l))>0&&roleOf(l)!=='air';}).length;}
function canSat(u){var L=isLeaf(u)?[u]:leavesOf(u);if(L.some(function(l){return alive(l)&&ST(l).fl.indexOf('z')>=0&&indOf(l,ST(l))>0;}))return true;return !isLeaf(u)&&satCount(u)>=3;}
function satAct(u,o){var s=ST(u);if(!(indOf(u,s)>0)){logE(u.side,'arty',uName(u)+'沒有間接火力，無法參加飽和打擊',u.x,u.y,u.id);u.task='hold';return true;}var z=s.fl.indexOf('z')>=0;
  var no=newOrder('bombard',{x:o.x,y:o.y,r:o.r||(z?600:Math.max(500,missionR(s))),dur:z?DT*2:(o.dur||240),mul:z?6:3,sat:1,tot:o.tot||0,then:'support',sup:o.sup!==undefined?o.sup:(u.p>=0?u.p:undefined)});no.parent=o.parent;activate(u,no);return true;}

/* ---------- 地毯式轟炸：重型與中型轟炸機在帶狀區域內密集投彈；落彈誤差大、常有向進場方向「前伸不足」的誤炸 ---------- */
function cpSpec(u){var a=0,t=0,c=0,n=0;(u.mix||[]).forEach(function(m){var x=utx(m[0]);if(x.bt){var k=m[1]||1;n+=k;a+=x.ba*k;t+=x.bt*k;c=Math.max(c,x.cep);}});return n?{ba:a/n,bt:t/n,cep:c}:null;}
function canCarpet(u){return (isLeaf(u)?[u]:leavesOf(u)).some(function(l){var s=ST(l);return alive(l)&&s.dom==='air'&&s.fl.indexOf('v')>=0;});}
function cpGeom(u,ac){var X=cpSpec(u)||{ba:60000,bt:1.5,cep:500},A=X.ba*Math.max(1,ac),L=Math.sqrt(A*3),W=A/L;return {L:L,W:W,X:X};}
function carpetRun(u,o){var s=ST(u),ac=Math.max(0,u.veh);if(ac<0.3)return;var B=baseOf(u),ang=Math.atan2(o.y-B[1],o.x-B[0]),Gm=cpGeom(u,ac),X=Gm.X,tons=X.bt*ac*clamp(u.ammo/100,0.2,1);
  var cep=X.cep*(G.env.light<0.3&&uEra(u).y<1960?1.6:1)*(WX[G.env.wx][5]<0.8?1.4:1)*(u.ms==='shaken'?1.3:1)*(1+u.sup/200),ea=(gss()*0.8-0.25)*cep,el=gss()*0.5*cep,fx=Math.cos(ang),fy=Math.sin(ang),cx=o.x+fx*ea-fy*el,cy=o.y+fy*ea+fx*el;
  carpetHit(u.side,u,cx,cy,ang,Gm.L,Gm.W,tons,o);u.ammo=0;o.boom=1;o.st='done';o.off=Math.round(dist(cx,cy,o.x,o.y));}
function carpetHit(side,src,cx,cy,ang,L,W,tons,o){var fx=Math.cos(ang),fy=Math.sin(ang),rho=tons/Math.max(0.01,L*W/1e6),R=Math.sqrt(L*L+W*W)/2+400,ff=[],nh=0,cas=0;
  gridNear(cx,cy,R,function(t){if(!onMap(t))return;var ts=ST(t);if(ts.dom==='air')return;var dx=t.x-cx,dy=t.y-cy,a=Math.abs(dx*fx+dy*fy),b=Math.abs(-dx*fy+dy*fx),fp=Math.sqrt(frontW(t)*120/PI);if(a>L/2+fp||b>W/2+fp)return;
    var inside=a<=L/2&&b<=W/2?1:0.45,cov=covInd(t),sea=ts.dom==='sea'||ts.dom==='sub',fm=1-Math.exp(-rho*20000e-6*(1-0.6*ts.hard)*inside*cov),fv=1-Math.exp(-rho*(ts.hard>=0.5?450:2600)*1e-6*inside*(0.5+0.5*cov));if(sea){fm*=0.25;fv*=0.25;}
    var dm=t.men*fm,dv=t.veh*fv;hit(t,t.side===side?null:src,dm,dv,clamp(40+rho*0.6,40,100)*inside,'carpet');t.mor=clamp(t.mor-clamp(rho*0.25,4,30)*inside,0,100);t.org=clamp(t.org-clamp(rho*0.3,5,35)*inside,0,100);mfAdd(t,'air',-clamp(rho*0.2,3,20)*inside);
    nh++;cas+=dm;if(t.side===side&&dm+dv*8>2)ff.push(t);});
  for(var s1=-L/2;s1<=L/2+1;s1+=Math.max(W*0.6,150)){var px=cx+fx*s1,py=cy+fy*s1;urbanDamage(px,py,W/2,clamp(rho*1.2,4,80),side,'carpet');roadDmg(px,py,W/2,clamp(rho*1.2,15,255));if(G.civ)civHit(px,py,W/2,clamp((1-Math.exp(-rho*20000e-6))*0.7,0,0.9),'carpet',side,0.4);if(G.evt&&rnd()<Math.min(0.5,rho/80))fireChance(px+(rnd()-0.5)*W,py+(rnd()-0.5)*W);}
  afHit(side,cx,cy,Math.max(L,W)/2+200,clamp(rho*0.05,0.3,4),src);
  var st=G.stats[side];st.carpet=(st.carpet||0)+1;st.bombT=(st.bombT||0)+tons;
  logE(side,'air','✈ '+uName(src)+'實施地毯式轟炸：在'+placeTxt(cx,cy)+'約 '+kmTxt(L)+' × '+kmTxt(W)+' 的帶狀區域投下約 '+fmt(tons)+' 公噸炸彈'+(o&&o.x!==undefined&&dist(cx,cy,o.x,o.y)>300?'，落彈中心偏離瞄準點約 '+kmTxt(dist(cx,cy,o.x,o.y)):'')+'；波及 '+nh+' 個單位',cx,cy,src.id);
  if(ff.length){logE(side,'ff','誤炸！'+uName(src)+'的炸彈落在我軍'+ff.slice(0,3).map(uName).join('、')+(ff.length>3?'等 '+ff.length+' 個單位':'')+'的陣地上',ff[0].x,ff[0].y,ff[0].id);ff.forEach(function(t){mfAdd(t,'panic',-6);});}
  G._cpv=(G._cpv||[]).concat([{t:G.t,x:cx,y:cy,a:ang,L:L,W:W,side:side}]).slice(-20);if(G.onPause&&apOn('strike'))G.onPause('地毯式轟炸');}

/* ---------- 區域外飛彈精確打擊：射程外發射，飛行途中可能被防空與反飛彈系統攔截；同時來襲越多越容易突破（飽和） ---------- */
function mslSpec(u){var q=null;(u.mix||[]).forEach(function(m){var t=typeOf(m[0]),z=MSLT[m[0]]||(t&&t.msl);if(z&&(G.set.y||2000)>=(z.y0||0))q=z;});return q;}
function mslLeft(u){var q=mslSpec(u);if(!q)return 0;if(u.mslN===undefined)u.mslN=Math.round(q.n*Math.max(1,u.veh0||1));return Math.max(0,Math.min(u.mslN,Math.ceil(q.n*Math.max(0,u.veh))));}
function canMsl(u){return (isLeaf(u)?[u]:leavesOf(u)).some(function(l){return alive(l)&&mslLeft(l)>0;});}
function mslTarget(side,x,y,q){var C=G.ct[side],best=null,bd=q.ship?15000:700;for(var id in C){var c=C[id];if(c.dead||G.t-c.t>1800)continue;var t=uById(+id);if(!t||!alive(t))continue;var dm=ST(t).dom;if(dm==='air')continue;if(q.ship&&dm!=='sea'&&dm!=='sub')continue;var d=dist(c.x,c.y,x,y);if(d<bd){bd=d;best={id:t.id,x:c.x,y:c.y};}}return best;}
function mslLaunch(u,o){var q=mslSpec(u),n=Math.min(o.n||4,mslLeft(u));if(!q||n<=0){logE(u.side,'arty',uName(u)+'沒有可用的飛彈',u.x,u.y,u.id);return false;}var d=dist(u.x,u.y,o.x,o.y);if(d>q.r){logE(u.side,'arty',uName(u)+'：目標超出'+q.nm+'射程（'+kmTxt(q.r)+'）',u.x,u.y,u.id);return false;}
  var tg=mslTarget(u.side,o.x,o.y,q),ax=tg?tg.x:o.x,ay=tg?tg.y:o.y,S={id:(G.mslSeq=(G.mslSeq||0)+1),side:u.side,src:u.id,nm:q.nm,kind:q.kind,x0:u.x,y0:u.y,x:ax,y:ay,tid:tg?tg.id:0,n:n,v:q.v,w:q.w,pk:q.pk,ship:!!q.ship,sk:q.kind==='asm'?20000:(ST(u).fl.indexOf('p')>=0&&q.y0>=2000?400:250),t0:G.t,eta:G.t+Math.max(DT,dist(u.x,u.y,ax,ay)/q.v)};
  (G.msl=G.msl||[]).push(S);u.mslN-=n;u.fired=G.t;u.lastArt=G.t;var st=G.stats[u.side];st.msl=(st.msl||0)+n;
  logE(u.side,'arty','🚀 '+uName(u)+'發射 '+n+' 枚'+q.nm+'，目標'+placeTxt(ax,ay)+'，約 '+durTxt(S.eta-G.t)+' 後抵達',u.x,u.y,u.id);
  var en=enemyOf(u.side),ES=nSides()<3?[en]:SIDES().filter(function(s){return hostile(u.side,s);});ES.forEach(function(es){var rad=(G.set.y||0)>=1950&&G.units.some(function(g){return g.side===es&&onMap(g)&&(aaOf(g,ST(g))>=8||ST(g).spot>=40000)&&dist(g.x,g.y,ax,ay)<80000;});if(rad){S.det=1;logE(es,'arty','⚠ 偵測到來襲的'+(q.kind==='ballistic'?'彈道飛彈':'巡弋飛彈')+'（約 '+n+' 枚），目標'+placeTxt(ax,ay),ax,ay);}});
  if(G.onPause&&apOn('strike'))G.onPause('飛彈發射');return true;}
function mslStep(){if(!G.msl||!G.msl.length)return;var keep=[];G.msl.forEach(function(S){if(G.t<S.eta){keep.push(S);return;}mslImpact(S);});G.msl=keep;}
function mslImpact(S){var en=enemyOf(S.side),src=uById(S.src),t=S.tid?uById(S.tid):null;if(t&&(!alive(t)||!onMap(t)))t=null;
  var need=S.kind==='ballistic'?12:S.kind==='asm'?5:6,ch=0,pkS=0,R0;
  G.units.forEach(function(g){if(!hostile(S.side,g.side)||!onMap(g)||g.ms==='rout'||g.ammo<=0)return;var AA=aaOf(g,ST(g));if(AA<need)return;R0=S.kind==='ballistic'?Math.min(aaRange(AA),40000):aaRange(AA)*0.6;if(dist(g.x,g.y,S.x,S.y)>R0)return;var c=Math.max(1,Math.floor(AA/(S.kind==='ballistic'?6:3)))*(S.kind==='ballistic'?1:2);ch+=c;pkS+=c*clamp((AA-need+3)*0.06,0.08,S.kind==='ballistic'?0.5:0.65);});
  var tries=Math.min(S.n,ch),pk=(ch?pkS/ch:0)*(typeof mslReact==='function'?mslReact(S):1),shot=0;for(var i=0;i<tries;i++)if(rnd()<pk)shot++;if(typeof navAD==='function')shot+=navAD(S,en,S.n-shot);var leak=S.n-shot,jam=G.units.some(function(g){return hostile(S.side,g.side)&&onMap(g)&&ST(g).fl.indexOf('E')>=0&&dist(g.x,g.y,S.x,S.y)<30000;})?0.75:1,hits=0,dm=0,dv=0,txt='';
  if(t){var ts=ST(t),sea=ts.dom==='sea'||ts.dom==='sub',ok=dist(t.x,t.y,S.x,S.y)<=S.sk&&(!sea||S.ship||S.kind==='ballistic')&&ts.dom!=='sub',mv=G.t-(t.movedAt||-1e9)<180&&S.kind==='cruise'&&S.sk<=250?0.5:1;
    if(ok)for(var j=0;j<leak;j++)if(rnd()<S.pk*jam*mv)hits++;
    if(hits){if(sea){var mps=t.men0/Math.max(1,t.veh0),f=clamp((S.w/220)*250/(mps+150),0.03,1);dv=Math.min(t.veh,hits*f);dm=dv*mps*0.35;hit(t,src,dm,dv,60,'msl');}
      else if(!isLeaf(t)){for(var h=0;h<hits;h++)if(rnd()<0.45){destroy(t,'msl');break;}dm=Math.min(t.men,hits*4);}
      else{var hv=(ts.fl.indexOf('g')>=0||ts.fl.indexOf('h')>=0||ts.br==='ad'||ts.br==='rkt')?1.3:1;dm=Math.min(t.men,hits*(S.w/450)*12*(1-0.6*ts.hard)*(1-0.5*(t.ent||0)));dv=Math.min(t.veh,hits*(S.w/450)*(ts.hard>=0.5?1.1:1.6)*hv);hit(t,src,dm,dv,70,'msl');
        if(ts.fl.indexOf('h')>=0&&t.p>=0&&rnd()<0.3*hits){var P=uById(t.p);if(P&&alive(P))destroy(P,'msl');}}
      txt=uName(t)+'被 '+hits+' 枚命中';}}
  if(!hits&&leak>0){var site=demoNear(S.x,S.y,300);if(site&&rnd()<0.35+0.15*leak){blowBridge(site,src||{side:S.side,name:G.sides[S.side].name,id:0});txt='炸斷'+placeTxt(S.x,S.y)+'的'+(site.kind==='tunnel'?'隧道':'橋梁');hits=1;}}
  if(leak>0){afHit(S.side,S.x,S.y,700,leak*(S.w/450)*1.2,src);if(G.civ)civHit(S.x,S.y,90,clamp(0.004*(S.w/450)*(leak-hits*0.7),0,0.2),'msl',S.side,0.45);urbanDamage(S.x,S.y,120,clamp(leak*3,1,25),S.side,'msl');roadDmg(S.x,S.y,80,clamp(leak*10,5,60));}
  logE(S.side,'arty','🚀 '+S.n+' 枚'+S.nm+'抵達'+placeTxt(S.x,S.y)+'：'+(shot?shot+' 枚被攔截、':'')+(txt||(leak>0?leak+' 枚落在目標區但沒有命中有價值的目標':'全數被攔截')),S.x,S.y,S.src);
  if(shot>0)logE(en,'aa','防空系統攔截來襲的 '+shot+' 枚'+S.nm+'（'+placeTxt(S.x,S.y)+'）',S.x,S.y);
  G._mslv=(G._mslv||[]).concat([{t:G.t,x:S.x,y:S.y,x0:S.x0,y0:S.y0,side:S.side,n:S.n,h:hits,s:shot}]).slice(-30);}
function mslReload(){G.units.forEach(function(u){if(!isLeaf(u)||!alive(u)||u.st==='off'||u.mslN===undefined)return;var q=mslSpec(u);if(!q)return;var full=Math.round(q.n*Math.max(0,u.veh));if(u.mslN>=full)return;if(ST(u).dom==='air'){if(u.st==='base'&&(!u.readyT||G.t>=u.readyT))u.mslN=full;return;}if(u.insup)u.mslN=Math.min(full,u.mslN+Math.max(1,Math.round(full*0.1)));});}

/* ---------- 戰略核武：使用者自行指定目標；投射方式依年代 ---------- */
var SNKD={bomber:{n:'戰略轟炸機',y0:1945},icbm:{n:'洲際彈道飛彈',y0:1959},slbm:{n:'潛射彈道飛彈',y0:1960},cruise:{n:'核巡弋飛彈',y0:1982}};
var SNKY={bomber:[[1945,[15,21]],[1949,[21,50]],[1952,[21,50,500]],[1954,[100,500,1000,3800,10000]],[1961,[100,1000,9000,25000]],[1970,[70,350,1100,9000]],[1990,[50,170,350,1200]]],
  icbm:[[1959,[1400,3800]],[1962,[1200,3800,9000]],[1970,[170,335,550,1200,9000,20000]],[1990,[100,300,550,800]]],slbm:[[1960,[600]],[1964,[200,600]],[1971,[40,100,200]],[1990,[100,455]],[2019,[7,100,455]]],cruise:[[1982,[5,150,200]],[2010,[5,50,150]]]};
function snkOn(){var N=G.set.snuke;return !!(N&&N.on)&&(typeof featOn==='function'?featOn('snuke'):(G.set.y||0)>=1945);}
function snkYr(){var y=G.set.y||0;return typeof featOn==='function'&&featOn('snuke',y)?Math.max(y,1945):y;}
function snkDel(){var y=snkYr();return Object.keys(SNKD).filter(function(k){return y>=SNKD[k].y0;});}
function snkYields(del){var y=snkYr(),r=[];(SNKY[del]||[]).forEach(function(q){if(y>=q[0])r=q[1];});return r;}
function snkLeft(side){var S=G.sides[side],N=G.set.snuke||{};if(S.snk===undefined)S.snk=N.n===undefined?2:N.n;return S.snk;}
/* 破壞範圍（公尺）：依 OTA《核戰爭的影響》（1979）一百萬噸空爆換算：12 psi 4.3 公里、5 psi 6.9 公里、2 psi 11.9 公里、1 psi 16 公里，與當量的立方根成比例；
   三度灼傷約 0.75×當量^0.41 公里（千噸）；500 侖目瞬發輻射約 1.2×（當量÷15）^0.19 公里；地面爆炸的爆風範圍較小，但有彈坑與大量放射性落塵 */
function snkZones(Y,burst){var c=Math.cbrt(Y/1000),b=burst==='surface'?0.8:1;return {fb:900*c,r12:4300*c*b,r5:6900*c*b,r2:11900*c*b,r1:16000*c*b,th:750*Math.pow(Y,0.41)*b,rad:1200*Math.pow(Y/15,0.19),cr:burst==='surface'?250*c:0};}
function snkClear(){return clamp(WX[G.env.wx][5],0.2,1)*(G.env.light<0.3?0.4:1);}
/* 平民：12 psi 內約 98% 死亡；5～12 psi 50% 死亡、40% 受傷；2～5 psi 5% 死亡、45% 受傷；1～2 psi 25% 受傷；另加熱輻射灼傷 */
function snkCivF(d,Z,clear){var k=0,w=0;if(d<Z.r12){k=0.98;w=0.02;}else if(d<Z.r5){k=0.5;w=0.4;}else if(d<Z.r2){k=0.05;w=0.45;}else if(d<Z.r1){w=0.25;}
  if(d<Z.th&&d>=Z.r5){var e=clear*0.3;k+=e*0.5*(1-k);w+=e*0.5*Math.max(0,1-k-w);}if(d<Z.rad&&d>=Z.r12)k=Math.max(k,0.6);return [Math.min(k,1),Math.max(0,Math.min(w,1-k))];}
function snkMil(t,d,Z,clear){var ts=ST(t),hard=ts.hard||0,ent=ts.dom==='land'?(t.ent||0):0,mf=0,vf=0;
  if(ts.dom==='air'){if(t.st==='air'){if(d<Z.r2){mf=vf=1;}else if(d<Z.r1){mf=vf=0.3;}}else if(d<Z.r5){mf=vf=1;}else if(d<Z.r2){mf=vf=0.5;}return [mf,vf];}
  if(ts.dom==='sea'||ts.dom==='sub'){if(d<Z.r12){vf=0.9;mf=0.85;}else if(d<Z.r5){vf=0.35;mf=0.4;}else if(d<Z.r2){vf=0.05;mf=0.1;}return [mf,vf];}
  if(d<Math.max(Z.fb,Z.cr)){mf=1;vf=1;}else if(d<Z.r12){var f=(d-Z.fb)/Math.max(1,Z.r12-Z.fb);mf=lerp(0.97,0.75,f)*(1-0.3*ent)*(1-0.15*hard);vf=lerp(0.95,0.55,f)*(1-0.35*hard);}
  else if(d<Z.r5){mf=0.5*(1-0.6*ent)*(1-0.5*hard);vf=hard>=0.5?0.12:0.55;}else if(d<Z.r2){mf=0.06*(1-0.6*ent)*(1-0.6*hard);vf=hard>=0.5?0.01:0.15;}else if(d<Z.r1){mf=0.01*(1-ent);vf=0.02*(1-hard);}
  if(d<Z.th&&d>=Z.r5)mf+=0.25*(1-ent)*(1-hard)*clear*(1-mf);if(d<Z.rad&&d>=Z.r12)mf=Math.max(mf,0.6*(1-0.4*hard));return [clamp(mf,0,1),clamp(vf,0,1)];}
/* 預估（目標選定時顯示）：立即死亡與受傷人數 */
function snkEst(x,y,Y,burst,side){var Z=snkZones(Y,burst),cl=snkClear(),o={ck:0,cw:0,mk:sA0(),Z:Z,own:0};
  if(G.civ){G.civ.S.forEach(function(g){var d=dist(g.x,g.y,x,y);if(d>Z.r1+g.r)return;var p=civPresent(g);if(p<1)return;var f=snkCivPts(g,x,y,Z,cl);o.ck+=p*f[0];o.cw+=p*f[1];});G.civ.R.forEach(function(Q){if(Q.st==='out'||Q.st==='camp'||Q.n<1)return;var f=snkCivF(dist(Q.x,Q.y,x,y),Z,cl);o.ck+=Q.n*f[0];o.cw+=Q.n*f[1];});}
  G.units.forEach(function(t){if(!alive(t)||t.st==='off'||!isLeaf(t))return;var d=dist(t.x,t.y,x,y);if(d>Z.r1)return;var f=snkMil(t,d,Z,cl),c=t.men*f[0];if(t.side>=0)o.mk[t.side]+=c;if(t.side===side&&d<Z.r2)o.own++;});return o;}
function snkCivPts(g,x,y,Z,cl){if(!(g.r>200))return snkCivF(dist(g.x,g.y,x,y),Z,cl);var k=0,w=0,P=[[0,0],[0.6,0],[-0.6,0],[0,0.6],[0,-0.6]];P.forEach(function(q){var f=snkCivF(dist(g.x+q[0]*g.r,g.y+q[1]*g.r,x,y),Z,cl);k+=f[0];w+=f[1];});return [k/5,w/5];}
function snkWind(){var E=G.env;if(E.wd===undefined){var lat=Math.abs(G.map.lat0||35);E.wd=(lat<28?PI:0)+(rnd()-0.5)*1.4;E.ws=(15+rnd()*25)/3.6;}return [E.wd,E.ws];}
function snukeAt(side,x,y,Y,burst,src,del){var MP=G.map,Z=snkZones(Y,burst),cl=snkClear(),en=enemyOf(side),k0=G.civ?(G.civ.kill||0):0,w0=G.civ?(G.civ.wound||0):0,mil=sA0(),hitN=0;
  G.nukes=G.nukes||[];G.nukes.push({t:G.t,x:x,y:y,Y:Y,side:side,R:[Z.r12,Z.r5,Z.r2,Z.r1],str:1,th:Z.th});
  G.units.forEach(function(t){if(!alive(t)||t.st==='off'||t.st==='ship'||t.st==='lift')return;var d=dist(t.x,t.y,x,y);if(d>Z.r1*2.5)return;if(d>Z.r1){t.mor=clamp(t.mor-10,0,100);return;}var f=snkMil(t,d,Z,cl);if(f[0]+f[1]>0)hitN++;if(t.side>=0)mil[t.side]+=t.men*f[0];
    hit(t,src||null,t.men*f[0],t.veh*f[1],d<Z.r2?100:50,'snuke');t.mor=clamp(t.mor-(d<Z.r5?70:d<Z.r2?45:25),0,100);t.org=clamp(t.org-(d<Z.r2?60:20),0,100);mfAdd(t,'fear',d<Z.r2?-25:-10);});
  /* 地表：城鎮夷平、植被燒毀、橋梁與道路損毀 */
  var ks=[],cs=MP.cs,D=dmgArr(),RR=Math.max(Z.r2,Z.th);brushCells(MP,x/cs,y/cs,RR/cs,function(k,f){var d=f*RR,c=MP.lc[k];if(isWater(c))return;
    if(isUrban(c)){if(d<Z.r5||(d<Z.r2&&rnd()<0.5*(1-(d-Z.r5)/Math.max(1,Z.r2-Z.r5)))){if(c!==LCI.rubble){MP.lc[k]=LCI.rubble;ks.push(k);}D[k]=255;if(G.civ)civProp(k,1,'snuke',side);}else if(d<Z.r2){D[k]=Math.min(255,D[k]+120);if(G.civ)civProp(k,0.45,'snuke',side);}}
    else if(d<Z.th&&c!==LCI.rock&&c!==LCI.snow&&c!==LCI.desert&&c!==LCI.sand&&c!==LCI.burnt&&(d<Z.r5||rnd()<0.5*cl)){MP.lc[k]=LCI.burnt;ks.push(k);}});
  var lostB=MP.brg.filter(function(q){return dist((q.x+0.5)*cs,(q.y+0.5)*cs,x,y)<Z.r5;});if(lostB.length){lostB.forEach(function(q){var k=q.y*MP.GW+q.x;MP.rd[k]=0;MP.rl[k]=0;ks.push(k);});MP.brg=MP.brg.filter(function(q){return lostB.indexOf(q)<0;});}
  if(ks.length)mapChanged(ks);roadDmg(x,y,Z.r5,255);roadDmg(x,y,Z.r2,90);
  /* 平民 */
  if(G.civ){G.civ.S.forEach(function(g){var d=dist(g.x,g.y,x,y);if(d>Z.r1+g.r)return;var p=civPresent(g);if(p<1)return;var f=snkCivPts(g,x,y,Z,cl),c=p*(f[0]+f[1]);if(c>0)civCas(g,c,f[0]/Math.max(1e-6,f[0]+f[1]),'snuke',side);g.alarm=1;});
    G.civ.R.forEach(function(Q){if(Q.st==='out'||Q.st==='camp'||Q.n<1)return;var f=snkCivF(dist(Q.x,Q.y,x,y),Z,cl);if(f[0]+f[1]>0)refCas(Q,Q.n*(f[0]+f[1]),f[0]/Math.max(1e-6,f[0]+f[1]),'snuke',side);});}
  var ck=G.civ?(G.civ.kill||0)-k0:0,cw=G.civ?(G.civ.wound||0)-w0:0,fo=burst==='surface'||Y<30?snkFallout(side,x,y,Y,burst):null;
  var rec={t:G.t,side:side,x:x,y:y,Y:Y,burst:burst,del:del||'',ck:ck,cw:cw,mk:mil,fo:fo?fo.est:0,wd:fo?fo.a:null};(G.snS=G.snS||[]).push(rec);
  if(nSides()<3)(G.snHit=G.snHit||{})[en]=G.t;else SIDES().forEach(function(s){if(s!==side&&mil[s]>0)(G.snHit=G.snHit||{})[s]=G.t;});var st=G.stats[side];st.snuke=(st.snuke||0)+1;
  logE(-1,'nuke','☢ '+G.sides[side].name+(del&&SNKD[del]?'以'+SNKD[del].n:'')+'在'+placeTxt(x,y)+'實施戰略核打擊（'+yTxt(Y)+'，'+(burst==='surface'?'地面爆炸':'空中爆炸')+'）：重度破壞半徑 '+kmTxt(Z.r5)+'、三度灼傷半徑 '+kmTxt(Z.th)+'；估計平民立即死亡約 '+fmt(ck)+' 人、受傷約 '+fmt(cw)+' 人，軍人傷亡約 '+fmt(mil.reduce(function(a,b){return a+b;},0))+' 人'+(fo?'；放射性落塵正向'+dirTxt(fo.a)+'方飄散，估計將再造成約 '+fmt(fo.est)+' 名平民在數日至數週內死亡':''),x,y,src?src.id:undefined);
  if(G.civ){var top=sideCmd(side);if(top&&ck>50)warCrime(top,'nuke',ck,G.sides[side].name+'在'+placeTxt(x,y)+'使用'+yTxt(Y)+'核武，造成約 '+fmt(ck)+' 名平民立即死亡',true);G.civ.rep[side]=clamp(G.civ.rep[side]-30,0,100);}
  G.units.forEach(function(u){if(u.side===side&&onMap(u))u.mor=clamp(u.mor-3,0,100);});
  if(G.onPause&&apOn('snuke'))G.onPause('戰略核爆');return rec;}
/* 放射性落塵：沿風向的長條污染帶，抵達時間依風速；地圖外的部分只計入平民後續死亡的估計 */
function snkFallout(side,x,y,Y,burst){var W=snkWind(),a=W[0],v=W[1],c=Math.cbrt(Y/1000),f=burst==='surface'?1:0.15,Lm=Math.min(400000,48000*Math.pow(Y/1000,0.45)*f*(v/6.7)),Wd=Math.max(1500,7000*Math.pow(Y/1000,0.35)),n=10,est=0,Zs=[];
  for(var i=0;i<n;i++){var dd=(i+0.5)/n*Lm,r=Wd*(0.35+0.65*(i+0.5)/n)/2+800*c,I=f*Math.exp(-2.2*(i+0.5)/n),z={x:x+Math.cos(a)*dd,y:y+Math.sin(a)*dd,r:r,I:I,ta:G.t+dd/v,t0:G.t,t1:G.t+72*3600,side:side,Y:Y};Zs.push(z);}
  G.fo=(G.fo||[]).concat(Zs);
  if(G.civ)G.civ.S.forEach(function(g){var p=civPresent(g);if(p<1)return;var I=0;Zs.forEach(function(z){if(dist(g.x,g.y,z.x,z.y)<z.r+g.r)I=Math.max(I,z.I);});if(I>0){var e=p*I*0.55*(1-0.5*(g.shel||0));est+=e;g.foI=Math.max(g.foI||0,I);}});
  if(G.civ){G.civ.foD=(G.civ.foD||0)+est;}return {a:a,est:est};}
function foStep(){var keep=[];G.fo.forEach(function(z){if(G.t>z.t1)return;keep.push(z);if(G.t<z.ta)return;var dec=Math.pow((G.t-z.t0)/3600+1,-1.2),rate=z.I*0.25*dec*(DT*4/3600);
    gridNear(z.x,z.y,z.r,function(u){if(!onMap(u)||ST(u).dom==='air'||dist(u.x,u.y,z.x,z.y)>z.r)return;var s=ST(u),ent=s.dom==='land'?(u.ent||0):0;hit(u,null,u.men*rate*(1-0.5*ent)*(1-0.4*s.hard),0,3,'fallout');u.mor=clamp(u.mor-rate*20,0,100);
      if(!u.foLog){u.foLog=1;logE(u.side,'nuke',uName(u)+'進入放射性落塵區，官兵出現急性輻射病症狀（'+placeTxt(u.x,u.y)+'）',u.x,u.y,u.id);}});});G.fo=keep;}
function snkLaunch(side,del,Y,burst,x,y,auto){if(!snkOn()||snkLeft(side)<=0||snkDel().indexOf(del)<0)return null;G.sides[side].snk--;var en=enemyOf(side),yr=G.set.y||0,Q={id:(G.snSeq=(G.snSeq||0)+1),side:side,del:del,Y:Y,burst:burst||'air',x:x,y:y,t0:G.t,auto:!!auto};
  if(del==='bomber'||del==='cruise'){var e=edgePoint(side,0.5),v=del==='cruise'?240:(yr<1955?160:250);Q.ex=e[0];Q.ey=e[1];Q.px=e[0];Q.py=e[1];Q.v=v;Q.ta=G.t+600;Q.eta=Q.ta+dist(e[0],e[1],x,y)/v;}else Q.eta=G.t+(del==='icbm'?(25+10*rnd()):(10+6*rnd()))*60;
  (G.snq=G.snq||[]).push(Q);logE(side,'nuke','☢ 已下令以'+SNKD[del].n+'對'+placeTxt(x,y)+'實施戰略核打擊（'+yTxt(Y)+'，'+(Q.burst==='surface'?'地面爆炸':'空中爆炸')+'），預計 '+durTxt(Q.eta-G.t)+' 後抵達；剩餘戰略核彈頭 '+G.sides[side].snk+' 枚',x,y);
  if((del==='icbm'||del==='slbm')&&yr>=1960){Q.det=1;(nSides()<3?[en]:SIDES().filter(function(s){return s!==side;})).forEach(function(es){logE(es,'nuke','⚠ 預警系統偵測到'+SNKD[del].n+'發射，預計 '+durTxt(Q.eta-G.t)+' 內落地',undefined,undefined);});if(G.onPause&&apOn('snuke'))G.onPause('偵測到彈道飛彈發射');}return Q;}
function snkStep(){if(!G.snq||!G.snq.length)return;var keep=[];G.snq.forEach(function(Q){var en=enemyOf(Q.side);
    if(Q.ex!==undefined){if(G.t<Q.ta){keep.push(Q);return;}if(!Q.seen){Q.seen=1;if((typeof featOn==='function'?featOn('radar'):(G.set.y||0)>=1940)&&rnd()<(Q.del==='cruise'?0.45:0.85)){Q.det=1;(nSides()<3?[en]:SIDES().filter(function(s){return s!==Q.side;})).forEach(function(es){logE(es,'nuke','⚠ 雷達發現'+(Q.del==='cruise'?'低空飛行的巡弋飛彈':'高空單機或小編隊')+'進入戰區（'+placeTxt(Q.px,Q.py)+'）',Q.px,Q.py);});if(G.onPause&&apOn('snuke'))G.onPause('雷達發現可疑目標');}}
      var d=dist(Q.px,Q.py,Q.x,Q.y),st=Q.v*DT;if(d>st){var a=Math.atan2(Q.y-Q.py,Q.x-Q.px);Q.px+=Math.cos(a)*st;Q.py+=Math.sin(a)*st;if(snkIntercept(Q)){logE(-1,'nuke','☢ '+G.sides[Q.side].name+'的'+SNKD[Q.del].n+'在'+placeTxt(Q.px,Q.py)+'上空被擊落，核彈沒有引爆',Q.px,Q.py);return;}keep.push(Q);return;}}
    else if(G.t<Q.eta){keep.push(Q);return;}
    if((Q.del==='icbm'||Q.del==='slbm')&&snkABM(Q)){logE(-1,'nuke','☢ '+G.sides[Q.side].name+'的核彈頭在重返大氣層時被反彈道飛彈攔截',Q.x,Q.y);return;}
    snukeAt(Q.side,Q.x,Q.y,Q.Y,Q.burst,null,Q.del,Q.wk);});G.snq=keep;}
function snkIntercept(Q){var en=enemyOf(Q.side),p=0;G.units.forEach(function(g){if(!hostile(Q.side,g.side)||!alive(g)||g.st==='off'||g.st==='ship')return;var s=ST(g),d=dist(g.x,g.y,Q.px,Q.py);if(g.st==='air'){if((s.aa||0)>=3&&d<8000)p+=0.04*(s.aa/6)*strFrac(g)*(Q.del==='cruise'&&s.aa<9?0.4:1);return;}
    if(!onMap(g))return;var AA=aaOf(g,s);if(Q.del==='bomber'?AA<6:AA<5)return;if(d>aaRange(AA)*(Q.del==='cruise'?0.6:1))return;p+=Q.del==='cruise'?0.05*(AA-4)/6:0.03*Math.min(1,(AA-5)/5);});return rnd()<Math.min(0.6,p);}
function snkABM(Q){if((G.set.y||0)<1972)return false;var en=enemyOf(Q.side),n=0;G.units.forEach(function(g){if(hostile(Q.side,g.side)&&onMap(g)&&aaOf(g,ST(g))>=12&&dist(g.x,g.y,Q.x,Q.y)<60000)n++;});n=Math.min(2,n);for(var i=0;i<n;i++)if(rnd()<0.25)return true;return false;}
/* 電腦：只在設定允許時使用（1 僅報復、2 戰況危急時可先用） */
function snkTarget(side,Y){var C=G.ct[side],cell={},best=null,bv=0;for(var id in C){var c=C[id];if(c.dead||G.t-c.t>3600||c.dom==='air')continue;var k=Math.floor(c.x/4000)+'|'+Math.floor(c.y/4000),q=cell[k]||(cell[k]={n:0,x:0,y:0,w:0});var w=(c.men||100);q.n++;q.x+=c.x*w;q.y+=c.y*w;q.w+=w;}
  for(var k2 in cell){var q2=cell[k2];if(q2.w>bv){bv=q2.w;best={x:q2.x/q2.w,y:q2.y/q2.w,w:q2.w};}}return best;}
function snkAI(side){var N=G.set.snuke;if(!snkOn()||!N.ai||snkLeft(side)<=0)return;var S=G.sides[side],hitT=(G.snHit||{})[side],why='';
  if(hitT&&!(S.snRet>=hitT))why='報復';else if(N.ai>=2&&G.t-(S.snkT||-1e9)>6*3600){var me=sideStr(side),en=sideStr(enemyOf(side));if(me.f<0.3&&en.m>me.m*2)why='戰況危急下的';}if(!why)return;
  var tg=snkTarget(side);if(!tg)return;var D=snkDel(),del=D.indexOf('icbm')>=0?'icbm':D.indexOf('slbm')>=0?'slbm':D[0];if(!del)return;var Ys=snkYields(del).slice().sort(function(a,b){return b-a;}),own=G.units.filter(function(u){return u.side===side&&onMap(u);}),Y=0;
  for(var i=0;i<Ys.length;i++){var Z=snkZones(Ys[i],'air');if(!own.some(function(u){return dist(u.x,u.y,tg.x,tg.y)<Z.r2*1.2;})){Y=Ys[i];break;}}if(!Y)return;S.snRet=G.t;S.snkT=G.t;
  if(snkLaunch(side,del,Y,'air',tg.x,tg.y,1))logE(side,'ai','☢ '+uName(sideCmd(side))+'下令實施'+why+'戰略核打擊');}
(function(){var b=nukeAt;nukeAt=function(side,x,y,Y,src){var r=b(side,x,y,Y,src);if(nSides()<3)(G.snHit=G.snHit||{})[1-side]=G.t;else{var R0=nukeR(Y)[0]*1.5;SIDES().forEach(function(s){if(s!==side&&G.units.some(function(u){return u.side===s&&onMap(u)&&dist(u.x,u.y,x,y)<R0;}))(G.snHit=G.snHit||{})[s]=G.t;});}return r;};})();

/* ---------- 不投降教條：極少投降；陷入絕境時發動自殺式衝鋒，並以宣傳與脅迫使平民寧死不降 ---------- */
(function(){var b=surrCheck;surrCheck=function(u,s,off,PF,rt,routing){if(SD(u.side).nosur&&rnd()>0.1)return false;return b(u,s,off,PF,rt,routing);};})();
function nosurStep(){SIDES().forEach(function(side){var S=SD(side);if(!S||!S.nosur)return;G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||!onMap(u)||u.banzai||ST(u).dom!=='land'||roleOf(u)!=='man')return;
    if(!(u.ms==='rout'||(u.ms==='shaken'&&G.t-(u.encT||-1e9)<900)))return;if(strFrac(u)>0.6||!(u._ed<2500)||rnd()>0.12)return;var e=u._eid?uById(u._eid):null;if(!e||!alive(e))return;
    u.banzai=G.t;u.ms='ok';u.mor=Math.max(u.mor,55);u.sup=0;activate(u,newOrder('attack',{x:e.x,y:e.y,opt:{tac:'frontal',pace:'rush',tol:100}}));logE(side,'tac',uName(u)+'拒絕投降，在絕望中發動自殺式衝鋒',u.x,u.y,u.id);G.stats[side].banzai=(G.stats[side].banzai||0)+1;});
  if(!G.civ||((G.sides[side].pol||{}).civ||0)<2||G.t-(S.coT||-1e9)<6*3600||sideStr(side).f>0.4)return;var tot=0;
  G.civ.S.forEach(function(g){if(g.loy!==side)return;var p=civPresent(g);if(p<20||enemyNear(side,g.x,g.y,3000)<200)return;var f=(0.02+0.06*rnd())*(friendNear(side,g.x,g.y,3000)>0?1.4:1),c=p*f;civCas(g,c,0.92,'suicide',side);tot+=c*0.92;});
  if(tot>5){S.coT=G.t;var top=sideCmd(side);logE(side,'civ','在軍方「寧死不降」的宣傳與脅迫下，約 '+fmt(tot)+' 名平民在敵軍逼近時集體自殺',undefined,undefined);if(top)warCrime(top,'coerce',tot,G.sides[side].name+'以宣傳與脅迫導致約 '+fmt(tot)+' 名平民集體自殺',true);}});}

/* ---------- 電腦使用新打擊方式 ---------- */
function v5AI(){SIDES().forEach(function(side){var S=SD(side);if(!S||!S.ai)return;
  if(G.t-(S.mslT||-1e9)>=3*3600){var L=G.units.filter(function(u){return u.side===side&&isLeaf(u)&&alive(u)&&u.st!=='off'&&u.st!=='ship'&&aiControls(u)&&mslLeft(u)>0&&!(u.ord&&u.ord.k==='msl'&&u.ord.st!=='done');});
    if(L.length){var C=G.ct[side],best=null,bv=0;for(var id in C){var c=C[id];if(c.dead||G.t-c.t>600)continue;var t=uById(+id);if(!t||!alive(t))continue;var ts=ST(t),v=!isLeaf(t)?3:ts.fl.indexOf('h')>=0?2.5:/art|rkt/.test(ts.br)?2:ts.br==='ad'?1.8:ts.dom==='sea'?1.5:0;if(v>bv){bv=v;best=c;}}
      if(best&&bv>=1.5){var u=L.filter(function(x){return dist(x.x,x.y,best.x,best.y)<=mslSpec(x).r;})[0];if(u){S.mslT=G.t;issue(u,'msl',{x:best.x,y:best.y,n:Math.min(4,mslLeft(u))});logE(side,'ai',uName(sideCmd(side))+'下令'+uName(u)+'以飛彈打擊敵軍要害');}}}}
  snkAI(side);});}

/* ---------- 命令掛鉤 ---------- */
/* 船上的部隊：記下命令，上岸後才執行 */
(function(){var b=activate;activate=function(u,o){if(u.st==='ship'){u.ord=o;o.st='exec';o.t1=G.t;u.task=null;return;}b(u,o);};})();
function v5Act(u,o){var k=o.k,s=ST(u);
  if(u.cvy&&!o.cvySys){if(u.cvy.ord)u.ord=u.cvy.ord;return true;}
  if(k==='sat')return satAct(u,o);
  /* 只有飛彈、沒有一般砲兵火力的單位（巡弋飛彈連、彈道飛彈連）：砲擊命令改為原地待命，不開向目標 */
  if(k==='bombard'&&s.dom==='land'&&!(indOf(u,s)>0)&&mslSpec(u)){u.task='hold';o.st='done';return true;}
  if(k==='carpet'){if(s.dom!=='air'||s.fl.indexOf('v')<0){logE(u.side,'air',uName(u)+'不是轟炸機，改為空中巡邏',u.x,u.y,u.id);activate(u,newOrder(s.dom==='air'?'patrol':'halt',{x:o.x,y:o.y,r:3000}));return true;}return false;}
  if(k==='msl'){if(!mslLeft(u)){logE(u.side,'arty',uName(u)+'沒有可用的飛彈',u.x,u.y,u.id);u.task='hold';o.st='done';return true;}if(s.dom==='air')return false;u.task='msl';o.ready=G.t+(s.dom==='land'?300:120)*(G.set.delayMul===undefined?1:G.set.delayMul);u.path=null;return true;}
  return false;}
function v5Leaf(u,s){var o=u.ord;if(o&&o.k==='msl'&&u.task==='msl'){if(G.t>=o.ready){mslLaunch(u,o);o.st='done';u.task='hold';}return true;}return false;}
(function(){var b=v4Act;v4Act=function(u,o){if(v5Act(u,o))return true;return b(u,o);};var b2=v4Leaf;v4Leaf=function(u,s){if(v5Leaf(u,s))return true;return b2(u,s);};
  var b3=airStep;airStep=function(u,s){var o=u.ord;if(o&&o.k==='msl'&&o.st!=='done'&&u.st==='air'&&!o.fired){o.fired=1;mslLaunch(u,o);o.st='done';u.task='rtb';u.path=null;}
    b3(u,s);o=u.ord;if(!o||u.st!=='air'||u.task!=='loiter')return;if(o.k==='carpet'&&!o.boom){carpetRun(u,o);u.task='rtb';return;}if(/strike|bomb/.test(o.k)&&G.step%2===0&&(s.sa>0||s.ha>0))afHit(u.side,o.x,o.y,1500,saOf(u,s)*strFrac(u)*0.008,u);};
  var b4=leafStep;leafStep=function(u){if(u.st==='ship')return;b4(u);};})();
/* 編制層級：飽和打擊（同時彈著）、地毯式轟炸、飛彈齊射 */
function planV5(F,o,kids,man,fire,air,nav,oth,P,C,dir,add,fw,spreadLine){var k=o.k;
  if(k==='sat'){var H=o.tot||G.t+60*Math.max(10,(o.opt&&o.opt.prep)||15),FL=leavesOf(F).filter(function(u){return alive(u)&&u.st!=='off'&&indOf(u,ST(u))>0&&ST(u).dom!=='air'&&dist(u.x,u.y,P[0],P[1])<=indOf(u,ST(u))*1.6;}),n=0;
    FL.forEach(function(u){add(u,newOrder('sat',{x:P[0],y:P[1],r:o.r,tot:H,sup:u.p>=0?u.p:F.id}));n++;});if(n)logE(F.side,'arty',uName(F)+'下令 '+n+' 個砲兵與火箭單位同時彈著（預定 '+clock(H)+'），對'+placeTxt(P[0],P[1])+'實施飽和打擊',P[0],P[1],F.id);return true;}
  if(k==='carpet'){var nb=0;air.forEach(function(u){if(canCarpet(u)){add(u,newOrder('carpet',{x:P[0],y:P[1]}));nb++;}else add(u,newOrder('patrol',{x:P[0],y:P[1],r:3000}));});if(!nb)logE(F.side,'air',uName(F)+'沒有可實施地毯式轟炸的轟炸機',P[0],P[1],F.id);return true;}
  if(k==='msl'){var LL=leavesOf(F).filter(function(u){return alive(u)&&mslLeft(u)>0&&dist(u.x,u.y,P[0],P[1])<=mslSpec(u).r;}),want=o.n||4*LL.length;LL.forEach(function(u){if(want<=0)return;var m=Math.min(mslLeft(u),Math.ceil(want/Math.max(1,LL.length)));want-=m;add(u,newOrder('msl',{x:P[0],y:P[1],n:m,wp:o.wp,alt:o.alt}));});if(!LL.length)logE(F.side,'arty',uName(F)+'沒有射程內的飛彈單位',P[0],P[1],F.id);return true;}
  return false;}
(function(){var b=planV4;planV4=function(F,o,kids,man,fire,air,nav,oth,P,C,dir,add,fw,spreadLine){if(planV5(F,o,kids,man,fire,air,nav,oth,P,C,dir,add,fw,spreadLine))return true;return b(F,o,kids,man,fire,air,nav,oth,P,C,dir,add,fw,spreadLine);};})();
function clock(t){var c=dateOf(G.set.y,G.set.m,G.set.d,t+G.set.h*3600+(G.set.mi||0)*60);return two(c.h)+':'+two(c.mi);}
/* 增援的新進場方式：運輸船 */
LIFTN.ship='運輸船';
(function(){var b=arriveMode;arriveMode=function(F,A,x,y){if((A.mode||'edge')==='ship'){arriveShip(F,A,x,y);return;}b(F,A,x,y);};})();
function v5Step(){if(G.step%4===1)cvStep();cvyStep();mslStep();snkStep();if(G.fo&&G.fo.length&&G.step%4===2)foStep();if(G.step%10===4)nosurStep();if(G.step%40===25)v5AI();if(G.step%120===7)mslReload();if(G.step%4===3)ditchStep();}
