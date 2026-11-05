/* ===================== 兵力投射：傘降、機降（運輸直升機）、兩棲登陸、空中增援；直接指令：圍攻、伏擊、遲滯、固守、追擊；核打擊 ===================== */
/* 運輸直升機：每架載運人數依年代 */
function liftPer(u){var y=uEra(u).y;return y>=1990?20:y>=1960?12:8;}
function liftCap(c){return Math.max(0,Math.round((c.veh||0)*liftPer(c)));}
function isCarrier(u){return isLeaf(u)&&ST(u).fl.indexOf('H')>=0&&ST(u).dom==='air';}
/* 可用直升機運送：徒步單位、空降部隊、只有輕型車輛的單位 */
function canHeli(u){var s=ST(u);return s.dom==='land'&&isLeaf(u)&&u.men>0&&(s.mobi===0||s.fl.indexOf('J')>=0||(s.mobi===3&&u.veh<=8&&s.arm<1));}
function canPara(u){var s=ST(u);return s.dom==='land'&&isLeaf(u)&&s.fl.indexOf('J')>=0;}
function canAmph(u){return ST(u).dom==='land';}
/* 飛行速度、散布半徑（公尺）、登陸艇速度 */
function liftSpd(u,m){var y=uEra(u).y;return (m==='heli'?Math.min(260,y>=1990?240:190):y<1950?260:y<1980?420:520)/3.6;}
function scatterR(u,m){var y=uEra(u).y,E=G.env,R=m==='heli'?120:(y<1950?1600:y<1980?900:500);if(E.light<0.3)R*=m==='heli'?1.6:2.2;var w=WX[E.wx][5];if(w<0.8)R*=1+(0.8-w)*1.5;return R*profOf(u)[6];}
function amphSpd(u){var y=uEra(u).y,s=ST(u);return (s.fl.indexOf('W')>=0?(y<1960?11:y<1990?13:22):(y<1940?6:9))/3.6;}
var LIFTN={para:'傘降',heli:'機降',sea:'登陸',fly:'空中進場',edge:'陸路'};

/* ---------- 抽象空運（傘降、或增援的機降）：由起點飛往降落區 ---------- */
function startLift(u,x,y,m,fx,fy,then){u.st='lift';u.path=null;u.goal=null;u.pq=0;u.task='lift';u.pend=[];u.waitT=0;u.lift={m:m,x1:x,y1:y,v:liftSpd(u,m),then:then||null,t0:G.t};u.x=fx;u.y=fy;u.hd=Math.atan2(y-fy,x-fx);u.form='march';u.formTo=null;u.ent=0;}
function liftStep(){G.units.forEach(function(u){if(u.st!=='lift'||!u.lift||u.lift.c)return;var L=u.lift,d=dist(u.x,u.y,L.x1,L.y1),st=L.v*DT;liftAA(u,L);if(u.st==='dead')return;
    if(d<=st){u.x=L.x1;u.y=L.y1;landUnit(u);}else{u.x+=(L.x1-u.x)/d*st;u.y+=(L.y1-u.y)/d*st;}});}
/* 航線上的防空火力與敵方戰鬥機：損失運輸機與機上人員 */
function liftAA(u,L){var dm=DT/60,tot=0,by=null;G.units.forEach(function(g){if(g.side===u.side||!alive(g)||g.st==='lift'||g.st==='base'||g.hqLost||g.ms==='rout')return;var s=ST(g),air=g.st==='air',AA=air?(s.aa||0):aaOf(g,s);if(!(AA>0)||g.ammo<=0)return;
    var R=air?6000:aaRange(AA),d=dist(g.x,g.y,u.x,u.y);if(d>R)return;var vis=G.env.light<0.3&&s.nv<1?0.3:1,F=AA*0.03*dm*strFrac(g)*vis*(1-g.sup/150)*AAK*(0.7+0.6*rnd())*(air?1.5:1);tot+=F;by=g;if(!air)g.ammo=Math.max(0,g.ammo-0.1);});
  if(tot<=0)return;var planes=Math.max(1,u.men/(L.m==='heli'?15:25)),f=Math.min(0.5,tot/planes);hit(u,by,u.men*f,u.veh*f,10,'drop');
  if(!L.aaLog){L.aaLog=1;logE(u.side,'air',uName(u)+'的'+(L.m==='heli'?'直升機群':'運輸機群')+'在'+placeTxt(u.x,u.y)+'遭到'+(by?uName(by):'防空火力')+'射擊',u.x,u.y,u.id);}}
/* 落地：散布、跳傘傷亡、落水、集結時間；之後執行後續命令 */
function landUnit(u){var L=u.lift,s=ST(u),R=scatterR(u,L.m),a=rnd()*2*PI,r=Math.sqrt(rnd())*R*0.5,x=L.x1+Math.cos(a)*r,y=L.y1+Math.sin(a)*r,wet=isWater(G.map.lc[cellAt(x,y)]),p=validPos(s,x,y);
  u.x=p[0];u.y=p[1];u.st='ok';u.lift=null;u.form='deployed';u.formTo=null;u.task='hold';u.path=null;u.goal=null;u.movedAt=G.t;u.ord=null;
  var reg=(L.m==='heli'?600:1200+R*1.5)*profOf(u)[6];u.regT=G.t+reg;u.org=clamp(u.org-(L.m==='heli'?10:25),0,100);
  if(L.m==='para'){var lf=clamp(0.015*R/800*(G.env.light<0.3?1.5:1),0,0.12)+(wet?0.12:0);hit(u,null,u.men*lf,u.veh*Math.min(0.5,lf*3),0,'drop');}
  logE(u.side,'abn',uName(u)+(L.m==='heli'?'機降於':'傘降於')+placeTxt(u.x,u.y)+(L.m==='para'?'，散布約 '+kmTxt(R)+(wet?'，部分人員落水':'')+'，預計 '+durTxt(reg)+' 完成集結':'，預計 '+durTxt(reg)+' 完成展開'),u.x,u.y,u.id);
  afterLand(u,L.then);}
function afterLand(u,o){if(!isLeaf(u))return;if(o&&o.k){activate(u,o);return;}activate(u,newOrder('defend',{x:u.x,y:u.y,face:u.hd,opt:{post:'hasty'}}));}

/* ---------- 兩棲：由外海直線駛向灘頭，上岸後整頓 ---------- */
function seaWater(c){return c===LCI.sea||c===LCI.shal;}
function offshore(bx,by){var MP=G.map,best=null;for(var i=0;i<32;i++){var a=i/32*2*PI,ca=Math.cos(a),sa=Math.sin(a);for(var r=MP.cs;r<=15000;r+=MP.cs){var x=bx+ca*r,y=by+sa*r;if(x<0||y<0||x>=MP.Wm||y>=MP.Hm)break;if(seaWater(MP.lc[cellAt(x,y)])){if(!best||r<best.r)best={r:r,a:a};break;}}}
  if(!best)return null;var ca2=Math.cos(best.a),sa2=Math.sin(best.a),r2=best.r;for(var q=best.r;q<=best.r+4000;q+=MP.cs){var x2=bx+ca2*q,y2=by+sa2*q;if(x2<MP.cs||y2<MP.cs||x2>MP.Wm-MP.cs||y2>MP.Hm-MP.cs)break;if(!seaWater(MP.lc[cellAt(x2,y2)]))break;r2=q;}
  return [bx+ca2*r2,by+sa2*r2,best.a];}
function startAmph(u,bx,by,then,sx,sy){var o=sx!==undefined?[sx,sy,Math.atan2(sy-by,sx-bx)]:offshore(bx,by);if(!o)return false;u.x=o[0];u.y=o[1];u.hd=o[2]+PI;u.amph={x1:bx,y1:by,v:amphSpd(u),then:then||null,t0:G.t};u.st='ok';u.form='march';u.formTo=null;u.task='amph';u.path=null;u.goal=null;u.pq=0;u.ent=0;u.pend=[];return true;}
function amphStep(u,s){var A=u.amph,MP=G.map,d=dist(u.x,u.y,A.x1,A.y1),st=A.v*DT;if(d>1){u.hd=Math.atan2(A.y1-u.y,A.x1-u.x);}if(d<=st){u.x=A.x1;u.y=A.y1;}else{u.x+=Math.cos(u.hd)*st;u.y+=Math.sin(u.hd)*st;}u.movedAt=G.t;
  var c=MP.lc[cellAt(u.x,u.y)];if(isWater(c)&&d>st)return;var p=validPos(s,u.x,u.y);u.x=p[0];u.y=p[1];u.amph=null;u.form='deployed';u.task='hold';u.regT=G.t+900*profOf(u)[6];u.org=clamp(u.org-15,0,100);
  logE(u.side,'amph',uName(u)+'在'+placeTxt(u.x,u.y)+'登陸上岸',u.x,u.y,u.id);afterLand(u,A.then);}
/* 登陸命令（地圖上的單位）：先到岸邊，再橫渡水域到對岸 */
function landingPlan(u,o){var MP=G.map,d=dist(u.x,u.y,o.x,o.y),n=Math.max(2,Math.ceil(d/(MP.cs*0.7))),emb=null,land2=null,inW=false;for(var i=0;i<=n;i++){var t=i/n,x=u.x+(o.x-u.x)*t,y=u.y+(o.y-u.y)*t,w=isWater(MP.lc[cellAt(x,y)]);if(!inW&&w){inW=true;var t0=Math.max(0,(i-1)/n);emb=[u.x+(o.x-u.x)*t0,u.y+(o.y-u.y)*t0];}else if(inW&&!w){var t1=Math.min(1,(i+1)/n);land2=[u.x+(o.x-u.x)*t1,u.y+(o.y-u.y)*t1];break;}}
  if(!emb||!land2)return null;return {emb:emb,land:land2};}

/* ---------- 機降：步兵提出需求，由最近的運輸直升機單位接運；運力不足時分批往返 ---------- */
function liftReq(u,o){if(u.lreq&&u.lreq.first){u.lreq.x=o.x;u.lreq.y=o.y;u.lreq.then=o.then||null;u.task='lwait';return true;}if(!canHeli(u)){logE(u.side,'air',uName(u)+'裝備過重，無法以直升機運送',u.x,u.y,u.id);return false;}
  u.lreq={x:o.x,y:o.y,then:o.then||null,left:0,lv:0,c:0,first:1,px:u.x,py:u.y,oid:o.oid};(G.lq=G.lq||[]).push(u.id);u.task='lwait';u.path=null;u.goal=null;
  logE(u.side,'air',uName(u)+'申請直升機運送，前往'+placeTxt(o.x,o.y),u.x,u.y,u.id);return true;}
function liftCancel(u){var R=u.lreq;if(!R)return;if(R.c){var c=uById(R.c);if(c&&c.lift&&c.lift.pax===u.id&&(c.lift.ph==='pick'||c.lift.ph==='load')){c.lift=null;c.task='rtb';}}u.lreq=null;}
function liftAssign(){if(!G.lq||!G.lq.length)return;G.lq=G.lq.filter(function(id){var u=uById(id);if(u&&u.lreq&&u.ms==='rout'&&u.st!=='lift'&&u.lreq.first){liftCancel(u);logE(u.side,'air',uName(u)+'潰散，取消直升機運送',u.x,u.y,u.id);}return u&&alive(u)&&u.lreq;});
  G.lq.forEach(function(id){var u=uById(id),R=u.lreq;if(R.c){var c0=uById(R.c);if(c0&&alive(c0)&&c0.lift&&c0.lift.pax===u.id)return;R.c=0;}var best=null,bd=1e18;
    G.units.forEach(function(c){if(c.side!==u.side||!alive(c)||c.lift||!isCarrier(c)||c.veh<1||c.ms==='rout')return;if(c.st==='base'&&c.readyT&&G.t<c.readyT)return;var d=dist(c.x,c.y,R.px,R.py);if(d<bd){bd=d;best=c;}});
    if(!best){if(!R.noLog){R.noLog=1;logE(u.side,'air',uName(u)+'：目前沒有可用的運輸直升機，原地等待',u.x,u.y,u.id);}return;}
    R.c=best.id;best.lift={pax:u.id,ph:'pick'};if(best.st==='base'){best.st='air';best.fuel=endOf(ST(best));best.sorties=(best.sorties||0)+1;}best.task='lift';best.path=null;best.ord=null;
    logE(u.side,'air',uName(best)+'起飛前往接運'+uName(u)+'（運力約 '+fmt(liftCap(best))+' 人）',best.x,best.y,best.id);});}
/* 運輸直升機的任務階段：接運 → 裝載 → 飛往降落區 → 卸載 →（還有人員就再回去）→ 返航 */
function carrierStep(c,s){var L=c.lift,u=uById(L.pax),R=u&&u.lreq,v=s.vr/3.6,B=baseOf(c);
  function fly(tx,ty){var d=dist(c.x,c.y,tx,ty),st=v*DT;if(d>1)c.hd=Math.atan2(ty-c.y,tx-c.x);if(d<=st){c.x=tx;c.y=ty;return true;}c.x+=Math.cos(c.hd)*st;c.y+=Math.sin(c.hd)*st;return false;}
  function done(){c.lift=null;c.task='rtb';c.path={pts:[c.x,c.y,B[0],B[1]],i:2};}
  if(!u||u.st==='dead'||!R){if(L.ph==='go'&&u&&u.st==='lift'){u.st='ok';u.lift=null;}done();return;}
  if(L.vh!==undefined&&c.veh<L.vh&&L.n>0){var lf=(L.vh-c.veh)/Math.max(1,L.vh),lm=L.n*lf;L.n-=lm;if(u.st==='lift')hit(u,null,lm,0,0,'drop');else if(L.nv)L.nv*=1-lf;if(!L.lossLog){L.lossLog=1;logE(u.side,'air',uName(c)+'有直升機被擊落，機上 '+uName(u)+' 人員傷亡',c.x,c.y,c.id);}}L.vh=c.veh;
  if(L.ph==='pick'){var px=R.first?u.x:R.px,py=R.first?u.y:R.py;if(R.first){R.px=u.x;R.py=u.y;}if(fly(px,py)){L.ph='load';L.t=G.t+300;}return;}
  if(L.ph==='load'){if(G.t<L.t)return;var cap=liftCap(c);if(R.first){var n=Math.min(cap,u.men),f=u.men>0?n/u.men:1;R.left=u.men-n;R.lv=u.veh*(1-f);u.men=n;u.veh-=R.lv;L.n=n;u.st='lift';u.lift={m:'heli',c:c.id,x1:R.x,y1:R.y,then:R.then};u.task='lift';u.path=null;u.pend=[];
      logE(u.side,'air',uName(u)+'登機完成，'+(R.left>0.5?'第一梯次 '+fmt(n)+' 人':'全員')+'飛往'+placeTxt(R.x,R.y),c.x,c.y,u.id);}
    else{var n2=Math.min(cap,R.left);L.n=n2;L.nv=R.lv*(R.left>0?n2/R.left:1);R.left-=n2;R.lv-=L.nv;}L.ph='go';return;}
  if(L.ph==='go'){var tx=R.first?R.x:u.x,ty=R.first?R.y:u.y;if(u.st==='lift'){u.x=c.x;u.y=c.y;u.hd=c.hd;}if(fly(tx,ty)){L.ph='unl';L.t=G.t+180;}else if(u.st==='lift'){u.x=c.x;u.y=c.y;}return;}
  if(L.ph==='unl'){if(G.t<L.t)return;if(R.first){R.first=0;var th=(u.lift&&u.lift.then)||R.then;u.lift={m:'heli',x1:R.x,y1:R.y,then:null};landUnit(u);if(th)activate(u,th);}
    else{u.men+=L.n;u.veh+=L.nv||0;u.men0=Math.max(u.men0,u.men);logE(u.side,'air',uName(c)+'將 '+fmt(L.n)+' 名後續人員送達'+uName(u),c.x,c.y,u.id);}
    L.n=0;if(R.left>0.5){L.ph='pick';return;}u.lreq=null;logE(u.side,'air',uName(u)+'機降作業完成，'+uName(c)+'返航',c.x,c.y,u.id);done();}}

/* ---------- 增援的抵達方式 ---------- */
function treeNodes(F){var o=[];(function w(z){o.push(z);kidsOf(z).forEach(w);})(F);return o;}
function arriveMode(F,A,x,y){var m=A.mode||'edge';if(m==='edge')return;var N=treeNodes(F),e=edgePoint(F.side,0.5),nl=0;
  if(m==='para'||m==='heli'){N.forEach(function(z){if(ST(z).dom!=='land'||z.st==='dead')return;var fx=e[0]+(z.x-x)*0.15,fy=e[1]+(z.y-y)*0.15;startLift(z,z.x,z.y,m,fx,fy,null);nl++;});
    if(nl)logE(F.side,'abn','增援 '+uName(F)+'以'+LIFTN[m]+'方式進入，降落區：'+placeTxt(x,y),x,y,F.id);}
  else if(m==='sea'){var base=offshore(x,y);if(!base){logE(F.side,'amph','找不到可登陸的海岸，'+uName(F)+'改由陸路進入',x,y,F.id);var p=edgePoint(F.side,0.5);deployTree(F,p[0],p[1],Math.atan2(G.map.Hm/2-p[1],G.map.Wm/2-p[0]),0);return;}
    N.forEach(function(z){if(ST(z).dom!=='land'||z.st==='dead')return;startAmph(z,z.x,z.y,null,base[0]+(z.x-x),base[1]+(z.y-y));if(!isWater(G.map.lc[cellAt(z.x,z.y)])){var b2=offshore(z.amph.x1,z.amph.y1);if(b2){z.x=b2[0];z.y=b2[1];}}nl++;});
    if(nl)logE(F.side,'amph','增援 '+uName(F)+'由海上展開登陸，灘頭：'+placeTxt(x,y),x,y,F.id);}
  else if(m==='fly'){var tx=A.tx!==undefined?A.tx:x,ty=A.ty!==undefined?A.ty:y;N.forEach(function(z){var s=ST(z);if(s.dom!=='air'||!isLeaf(z))return;z.base=[e[0],e[1]];z.x=e[0]+(rnd()-0.5)*2000;z.y=e[1]+(rnd()-0.5)*2000;z.st='air';z.fuel=endOf(s);z.ammo=100;z.sorties=1;
      var k=s.fl.indexOf('H')>=0?'patrol':(s.sa>0||s.ha>0)?'strike':'patrol';activate(z,newOrder(k,{x:tx,y:ty,r:3000}));nl++;});
    if(nl)logE(F.side,'air','空中增援 '+uName(F)+'由地圖外基地起飛進入戰區',e[0],e[1],F.id);}}

/* ---------- 葉單位的投射行為；回傳 true 表示本步已處理 ---------- */
function projLeaf(u,s){if(u.st==='lift')return true;if(u.amph){amphStep(u,s);return true;}
  if(u.task==='board'){if(G.t>=u.boardT){var o=u.ord;startLift(u,o.x,o.y,'para',u.x,u.y,o.then||null);logE(u.side,'abn',uName(u)+'登機起飛，前往'+placeTxt(o.x,o.y)+'實施傘降',u.x,u.y,u.id);}return true;}
  if(u.task==='lwait')return true;if(u.regT&&G.t<u.regT)return true;
  var o2=u.ord;if(!o2)return false;
  if(o2.k==='landing'&&o2.ph==='shore'&&(u.task==='at'||u.task==='hold')){var P=landingPlan(u,o2);if(!P){logE(u.side,'amph',uName(u)+'：前方沒有需要橫渡的水域，改為攻擊前進',u.x,u.y,u.id);activate(u,newOrder('attack',{x:o2.x,y:o2.y,opt:o2.opt||{}}));return true;}
    o2.ph='cross';var th=dist(P.land[0],P.land[1],o2.x,o2.y)>400?newOrder('attack',{x:o2.x,y:o2.y,opt:o2.opt||{}}):null,XS=xingFor(u.side,u.x,u.y,P.land[0],P.land[1],needsFerry(u)?'ferry':'boat');startAmph(u,P.land[0],P.land[1],th,u.x,u.y);u.amph.v*=ST(u).fl.indexOf('W')>=0?1:XS?(XS.kind==='ferry'?1.3:1.6):0.8;if(XS)u.amph.xs=XS.id;logE(u.side,'amph',uName(u)+'開始'+(ST(u).fl.indexOf('W')>=0?'兩棲登陸':XS?'經'+XSN[XS.kind]+'渡河':'以臨時舟筏強渡')+'（'+placeTxt(P.land[0],P.land[1])+'）',u.x,u.y,u.id);return true;}
  if(o2.k==='nuke'&&o2.ph==='move'){if(u.task==='go'&&(u.path||u.pq)){setForm(u,'march');moveStep(u,s,1);return true;}if(u.task==='go')u.task='at';nukeOrder(u,s,o2);return true;}
  if(o2.opt&&o2.opt.pursue&&o2.k==='attack'&&G.step%4===0)pursueStep(u,s,o2);
  return false;}
/* 追擊：持續鎖定最近（優先潰退中）的敵軍接觸，失去接觸 10 分鐘後轉為就地防禦 */
function pursueStep(u,s,o){var C=G.ct[u.side],best=null,bv=-1e18,R=8000;for(var id in C){var c=C[id];if(G.t-c.t>600)continue;var d=dist(u.x,u.y,c.x,c.y);if(d>R)continue;var e=uById(+id),v=-d+(e&&e.ms==='rout'?3000:e&&e.ms==='shaken'?1500:0);if(v>bv){bv=v;best=c;}}
  if(!best){if(o.tx!==undefined&&dist(u.x,u.y,o.tx,o.ty)>700){o.lost=0;if(dist(o.x,o.y,o.tx,o.ty)>300||(!u.path&&!u.pq)){o.x=o.tx;o.y=o.ty;o.reached=0;u.task='go';wantPath(u,o.tx,o.ty);}return;}o.lost=o.lost||G.t;if(G.t-o.lost>600){logE(u.side,'tac',uName(u)+'失去追擊目標，追擊結束',u.x,u.y,u.id);activate(u,newOrder('defend',{x:u.x,y:u.y,face:u.hd,opt:{post:'hasty'}}));}return;}o.lost=0;
  if(dist(o.x,o.y,best.x,best.y)>300){o.x=best.x;o.y=best.y;o.reached=0;if(u.task!=='go'||!u.path||G.t-(o.rp||0)>240){o.rp=G.t;u.task='go';wantPath(u,best.x,best.y);}}}
/* 葉單位收到投射或直接指令時的啟動；回傳 true 表示已處理 */
function projAct(u,o){var s=ST(u),k=o.k;if(u.lreq&&u.lreq.first&&k!=='airlift')liftCancel(u);
  if(k==='airlift'){if(s.dom!=='land')return false;if(!o.x&&o.x!==0)return false;if(!liftReq(u,o)){activate(u,newOrder('move',{x:o.x,y:o.y}));}return true;}
  if(k==='airdrop'){if(!canPara(u)){logE(u.side,'abn',uName(u)+'不是空降部隊，無法傘降',u.x,u.y,u.id);u.task='hold';return true;}if(u.ms==='rout'||(u._ed||1e9)<3000){logE(u.side,'abn',uName(u)+'正與敵軍接觸，無法脫離登機',u.x,u.y,u.id);u.task='hold';return true;}u.task='board';u.boardT=G.t+1800*profOf(u)[6];logE(u.side,'abn',uName(u)+'前往機場登機，預計 '+durTxt(u.boardT-G.t)+' 後起飛',u.x,u.y,u.id);return true;}
  if(k==='landing'){if(!canAmph(u))return false;o.ph='shore';var P=landingPlan(u,o);if(!P){logE(u.side,'amph',uName(u)+'：前方沒有需要橫渡的水域，改為攻擊前進',u.x,u.y,u.id);activate(u,newOrder('attack',{x:o.x,y:o.y,opt:o.opt||{}}));return true;}
    if(needsFerry(u)&&!xingFor(u.side,P.emb[0],P.emb[1],P.land[0],P.land[1],'ferry')){logE(u.side,'amph',uName(u)+'的車輛無法以小艇渡河，改經橋梁前進',u.x,u.y,u.id);activate(u,newOrder('attack',{x:o.x,y:o.y,opt:o.opt||{}}));return true;}
    if(dist(u.x,u.y,P.emb[0],P.emb[1])<Math.max(300,G.map.cs*2)){u.task='at';return true;}var ep=validPos(s,P.emb[0],P.emb[1]);u.task='go';wantPath(u,ep[0],ep[1]);return true;}
  if(k==='siege'){var cx=o.cx!==undefined?o.cx:o.x,cy=o.cy!==undefined?o.cy:o.y,R=o.r||1500,px=o.cx!==undefined?o.x:cx+(u.x-cx)/Math.max(1,dist(u.x,u.y,cx,cy))*R,py=o.cx!==undefined?o.y:cy+(u.y-cy)/Math.max(1,dist(u.x,u.y,cx,cy))*R;
    if(o.cx===undefined)siegeReg(u,cx,cy,R,o);var p=validPos(s,px,py),no=newOrder('defend',{x:p[0],y:p[1],face:Math.atan2(cy-p[1],cx-p[0]),opt:{post:'hasty',siege:1,depth:false},dk:'siege'});activate(u,no);return true;}
  if(k==='pursue'){var no2=newOrder('attack',{x:o.x!==undefined?o.x:u.x,y:o.y!==undefined?o.y:u.y,tx:o.x,ty:o.y,opt:Object.assign({tac:'frontal',pace:'rush',tol:45},o.opt||{},{pursue:1}),dk:'pursue'});activate(u,no2);pursueStep(u,s,no2);return true;}
  if(k==='nuke')return nukeOrder(u,s,o);
  return false;}

/* ---------- 核打擊命令 ---------- */
function nukeLeft(side){var S=G.sides[side],N=G.set.nuke||{};if(S.nk===undefined)S.nk=N.n===undefined?2:N.n;return S.nk;}
function nukeOrder(u,s,o){var cap=nukeCap(u),N=G.set.nuke||{};if(!cap){logE(u.side,'nuke',uName(u)+'不具核打擊能力或未獲授權',u.x,u.y,u.id);u.task='hold';return true;}
  if(nukeLeft(u.side)<=0){logE(u.side,'nuke',G.sides[u.side].name+'的核彈頭已經用盡',u.x,u.y,u.id);u.task='hold';return true;}
  var W=o.wk&&typeof nwhOf==='function'?nwhOf(o.wk):null,why=o.wk?(W?nwhFit(u,W):'找不到指定的核彈頭設計'):'';if(why){logE(u.side,'nuke',uName(u)+'：'+why+'，核打擊取消',u.x,u.y,u.id);o.st='done';u.task='hold';return true;}var Y=W?W.Y:Math.min(o.Y||N.y||10,cap),wn=W?'「'+W.n+'」':'';
  if(s.dom==='air'){o.nuke=Y;G.sides[u.side].nk--;logE(u.side,'nuke','☢ '+uName(u)+'掛載'+wn+'核彈（'+fmt(Y,Y<1?2:0)+' 千噸）出擊，目標：'+placeTxt(o.x,o.y),u.x,u.y,u.id);return false;}
  var IR=indOf(u,s),d=dist(u.x,u.y,o.x,o.y);if(d>IR*0.98){if(o.ph==='move'&&o.tries>1){logE(u.side,'nuke',uName(u)+'：無法進入射程，核打擊取消',u.x,u.y,u.id);o.st='done';u.task='hold';return true;}var a=Math.atan2(u.y-o.y,u.x-o.x),fp=validPos(s,o.x+Math.cos(a)*IR*0.85,o.y+Math.sin(a)*IR*0.85);o.ph='move';o.tries=(o.tries||0)+1;u.task='go';wantPath(u,fp[0],fp[1]);logE(u.side,'nuke',uName(u)+'：目標超出射程（'+kmTxt(d)+'，射程 '+kmTxt(IR)+'），前進到發射陣地',u.x,u.y,u.id);return true;}o.ph='fire';
  G.sides[u.side].nk--;var rk=IR>=20000,fl=rk?60+d/1000*2.5:30+d/600,prep=(rk?600:300)*profOf(u)[6];G.nq=G.nq||[];G.nq.push({at:G.t+prep+fl,x:o.x,y:o.y,Y:Y,side:u.side,src:u.id,via:rk?'rkt':'art'});if(W)G.nq[G.nq.length-1].wk=o.wk;
  logE(u.side,'nuke','☢ '+uName(u)+'準備發射'+wn+'核'+(rk?'飛彈':'砲彈')+'（'+fmt(Y,Y<1?2:0)+' 千噸），目標：'+placeTxt(o.x,o.y)+'，約 '+durTxt(prep+fl)+' 後命中',u.x,u.y,u.id);u.task='hold';o.st='done';u.ammo=Math.max(0,u.ammo-20);u.fired=G.t;u.lastArt=G.t;return true;}

/* ---------- 圍攻：包圍圈完成時，圈內敵軍斷絕補給、士氣下降 ---------- */
function siegeReg(F,x,y,R,o){G.sieges=(G.sieges||[]).filter(function(q){return q.by!==F.id;});G.sieges.push({side:F.side,x:x,y:y,r:R,by:F.id,oid:o.oid,t0:G.t,done:0});}
function siegeStep(){if(!G.sieges||!G.sieges.length)return;G.sieges=G.sieges.filter(function(q){var F=uById(q.by);if(!F||!alive(F))return false;var o=F.ord||(F.pend&&F.pend[0]);if(!o)return isLeaf(F)?false:G.t-q.t0<1800;if(o.oid!==q.oid&&!(o.dk==='siege'||o.k==='siege'))return false;return true;});
  G.sieges.forEach(function(q){var NS=12,sec=[];for(var i=0;i<NS;i++)sec.push(0);G.units.forEach(function(u){if(u.side!==q.side||!onMap(u)||ST(u).dom!=='land'||u.ms==='rout'||!isLeaf(u))return;var d=dist(u.x,u.y,q.x,q.y);if(d<q.r*0.3||d>q.r*1.8)return;
      /* 每個單位依正面寬度與火力範圍涵蓋一段方位角 */var a=Math.atan2(u.y-q.y,u.x-q.x),hw=Math.atan((frontW(u)*0.5+Math.min(1500,rangeOf(ST(u))))/Math.max(1,d));for(var b=a-hw;b<=a+hw+1e-6;b+=PI/NS/2){sec[((Math.floor((b+PI)/(2*PI/NS))%NS)+NS)%NS]=1;}});
    var cov=sum(sec,function(v){return v;}),closed=cov>=NS-1;q.cov=cov/NS;if(closed&&!q.done){q.done=1;var F=uById(q.by);logE(q.side,'siege',uName(F)+'完成對'+placeTxt(q.x,q.y)+'的包圍',q.x,q.y,q.by);}else if(!closed&&q.done&&cov<=NS-3){q.done=0;logE(q.side,'siege','對'+placeTxt(q.x,q.y)+'的包圍圈出現缺口',q.x,q.y,q.by);}
    if(!q.done)return;gridNear(q.x,q.y,q.r,function(e){if(e.side===q.side||!onMap(e)||ST(e).dom==='air')return;if(dist(e.x,e.y,q.x,q.y)>q.r*0.85)return;if(!e.besieged||G.t-e.besieged>1200){if(!e.besieged)logE(e.side,'siege',uName(e)+'遭到包圍，補給斷絕',e.x,e.y,e.id);}e.besieged=G.t;e.mor=clamp(e.mor-0.15,0,100);});});}

/* ---------- 每步：投射、核打擊、輻射、圍攻、戰線、回放紀錄 ---------- */
function projStep(){liftStep();liftAssign();nukeStep();radStep();if(G.step%10===3)siegeStep();}
