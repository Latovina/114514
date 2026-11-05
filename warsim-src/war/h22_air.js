/* ===================== 航空攻擊：轟炸機與攻擊機直線進入目標、一次投下全部炸彈、沿航向脫離後返航，不在目標上空盤旋；
   戰鬥機、偵察機、直升機、無人機、運輸與醫療機、飛艇與飛行生物維持原本的巡邏與盤旋。
   另有玩家劃定的「轟炸區」：帶狀、圓形或自訂範圍，大小可調 ===================== */
Object.assign(ORDN,{bombzone:'轟炸區'});
/* ---------- 航空單位的任務類型 ---------- */
function airRole(u){var s=ST(u);if(s.dom!=='air')return null;if(s._ar)return s._ar;var fl=s.fl,t=typeOf((u.mix||[[u.hq]])[0][0])||{},n=t.n||'',r;
  if(s.br==='uav')r='uav';else if(fl.indexOf('Z')>=0)r='airship';else if(fl.indexOf('Y')>=0)r='beast';
  else if(fl.indexOf('D')>=0||fl.indexOf('n')>=0||fl.indexOf('H')>=0||/運輸|空運|預警|加油/.test(n)||!(s.sa>0||s.ha>0))r=fl.indexOf('r')>=0?'recon':'support';else if(fl.indexOf('A')>=0)r='heli';
  else if(fl.indexOf('v')>=0)r='bomber';else if(fl.indexOf('w')>=0||fl.indexOf('T')>=0)r='attack';else if(/戰鬥/.test(n))r='fighter';else if(/攻擊機|對地|俯衝|魚雷/.test(n))r='attack';else if(/轟炸/.test(n))r='bomber';else r='fighter';
  s._ar=r;return r;}
function airRun(u){var r=airRole(u);return r==='bomber'||r==='attack';}
var AIRRUNK=/^(strike|bomb|attack|bombard|bombzone|carpet)$/;
var AIRRN={bomber:'轟炸機',attack:'攻擊機',fighter:'戰鬥機',recon:'偵察機',heli:'直升機',uav:'無人機',support:'運輸、預警或醫療機',airship:'飛艇',beast:'飛行生物'};
/* 架次：點目標的空中打擊、轟炸預設「持續出擊」（返航整補後再飛同一個目標，直到下達新命令）；轟炸區與地毯式轟炸預設只飛一趟 */
function airRep(o){var q=o&&o.opt&&o.opt.sor;return q?q==='rep':!(o.k==='bombzone'||o.k==='carpet');}

/* ---------- 目標區的幾何：帶狀（起點→終點、寬度）、圓形（中心、半徑）、自訂範圍（多邊形）；轟炸區與其他區域火力共用 ---------- */
var TZN={strip:'帶狀',circle:'圓形',poly:'自訂範圍'};
function tzApp(u,x,y){if(!u)return 0;var B=baseOf(u);return Math.atan2(y-B[1],x-B[0]);}
function tzGeom(o,u){var k=o.zs||'strip';
  if(k==='circle'){var r=clamp(o.zr||800,150,6000);return {k:k,cx:o.x,cy:o.y,r:r,area:PI*r*r,R:r,ang:tzApp(u,o.x,o.y)};}
  if(k==='poly'&&o.poly&&o.poly.length>=6){var P=o.poly,n=P.length>>1,A=0,sx=0,sy=0,i;for(i=0;i<n;i++){var j=(i+1)%n,c=P[2*i]*P[2*j+1]-P[2*j]*P[2*i+1];A+=c;sx+=(P[2*i]+P[2*j])*c;sy+=(P[2*i+1]+P[2*j+1])*c;}
    var cx=0,cy=0;if(Math.abs(A)>1){cx=sx/(3*A);cy=sy/(3*A);}else{for(i=0;i<n;i++){cx+=P[2*i]/n;cy+=P[2*i+1]/n;}}var R=0;for(i=0;i<n;i++)R=Math.max(R,dist(P[2*i],P[2*i+1],cx,cy));
    return {k:'poly',P:P,cx:cx,cy:cy,area:Math.max(1e4,Math.abs(A)/2),R:Math.max(R,60),ang:tzApp(u,cx,cy)};}
  var x0=o.x,y0=o.y,x1=o.x1,y1=o.y1;if(x1===undefined||x1===null){var a=tzApp(u,o.x,o.y),L=clamp(o.zl||2000,300,15000);x0=o.x-Math.cos(a)*L/2;y0=o.y-Math.sin(a)*L/2;x1=o.x+Math.cos(a)*L/2;y1=o.y+Math.sin(a)*L/2;}
  var L2=Math.max(200,dist(x0,y0,x1,y1)),W=clamp(o.w||800,150,6000);return {k:'strip',x0:x0,y0:y0,x1:x1,y1:y1,cx:(x0+x1)/2,cy:(y0+y1)/2,ang:Math.atan2(y1-y0,x1-x0),L:L2,W:W,area:L2*W,R:Math.sqrt(L2*L2+W*W)/2};}
/* 點到目標區邊界的有號距離（負值＝在區內） */
function tzSd(g,x,y){if(g.k==='circle')return dist(x,y,g.cx,g.cy)-g.r;
  if(g.k==='strip'){var fx=Math.cos(g.ang),fy=Math.sin(g.ang),dx=x-g.cx,dy=y-g.cy,a=Math.abs(dx*fx+dy*fy)-g.L/2,b=Math.abs(-dx*fy+dy*fx)-g.W/2;return a>0||b>0?Math.sqrt(Math.max(a,0)*Math.max(a,0)+Math.max(b,0)*Math.max(b,0)):Math.max(a,b);}
  var P=g.P,n=P.length>>1,ins=false,md=1e18;for(var i=0,j=n-1;i<n;j=i++){var xi=P[2*i],yi=P[2*i+1],xj=P[2*j],yj=P[2*j+1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))ins=!ins;
    var ex=xj-xi,ey=yj-yi,l2=ex*ex+ey*ey,t=l2>0?clamp(((x-xi)*ex+(y-yi)*ey)/l2,0,1):0,qx=xi+ex*t-x,qy=yi+ey*t-y,d=qx*qx+qy*qy;if(d<md)md=d;}
  md=Math.sqrt(md);return ins?-md:md;}
function tzShift(g,dx,dy){var h=Object.assign({},g);h.cx+=dx;h.cy+=dy;if(g.k==='strip'){h.x0+=dx;h.y0+=dy;h.x1+=dx;h.y1+=dy;}if(g.k==='poly')h.P=g.P.map(function(v,i){return v+(i%2?dy:dx);});return h;}
/* 外框（畫圖用）：帶狀四角、圓形 32 邊形、自訂範圍原樣 */
function tzPoly(g){if(g.k==='poly')return g.P.slice();var o=[],i;if(g.k==='circle'){for(i=0;i<32;i++){var a=i/32*2*PI;o.push(g.cx+Math.cos(a)*g.r,g.cy+Math.sin(a)*g.r);}return o;}
  var fx=Math.cos(g.ang),fy=Math.sin(g.ang);[[-1,-1],[1,-1],[1,1],[-1,1]].forEach(function(s){o.push(g.cx+fx*s[0]*g.L/2-fy*s[1]*g.W/2,g.cy+fy*s[0]*g.L/2+fx*s[1]*g.W/2);});return o;}
function tzAreaTxt(a){return a>=1e6?fmt(a/1e6,a>=1e7?0:1)+' 平方公里':fmt(a/1e4,a>=1e5?0:1)+' 公頃';}
function tzDesc(g){return g.k==='circle'?'半徑 '+kmTxt(g.r)+' 的圓形區':g.k==='poly'?'自訂範圍':'長 '+kmTxt(g.L)+'、寬 '+kmTxt(g.W)+' 的帶狀區';}
/* 命令裡描述目標區的欄位 */
function tzCopy(o){var q={x:o.x,y:o.y,x1:o.x1,y1:o.y1,w:o.w,zs:o.zs,zr:o.zr,zl:o.zl,opt:o.opt};if(o.poly)q.poly=o.poly.slice();return q;}

/* ---------- 區域投彈：炸彈平均落在整個目標區（密度＝噸數／面積），殺傷公式與地毯式轟炸相同 ---------- */
function zoneHit(side,src,g,tons,o){var rho=tons/Math.max(0.01,g.area/1e6),ff=[],nh=0,cas=0;
  gridNear(g.cx,g.cy,g.R+400,function(t){if(!onMap(t))return;var ts=ST(t);if(ts.dom==='air')return;var fp=Math.sqrt(frontW(t)*120/PI),sd=tzSd(g,t.x,t.y);if(sd>fp)return;
    var inside=sd<=0?1:0.45,cov=covInd(t),sea=ts.dom==='sea'||ts.dom==='sub',fm=1-Math.exp(-rho*20000e-6*(1-0.6*ts.hard)*inside*cov),fv=1-Math.exp(-rho*(ts.hard>=0.5?450:2600)*1e-6*inside*(0.5+0.5*cov));if(sea){fm*=0.25;fv*=0.25;}
    var dm=t.men*fm,dv=t.veh*fv;hit(t,t.side===side?null:src,dm,dv,clamp(40+rho*0.6,40,100)*inside,'carpet');t.mor=clamp(t.mor-clamp(rho*0.25,4,30)*inside,0,100);t.org=clamp(t.org-clamp(rho*0.3,5,35)*inside,0,100);mfAdd(t,'air',-clamp(rho*0.2,3,20)*inside);
    nh++;cas+=dm;if(t.side===side){if(typeof ffStat==='function')ffStat(side,dm+dv*8,'air');if(dm+dv*8>2)ff.push(t);}});
  /* 城鎮、道路、平民、設施與補給站：在區內取樣（約 40 點） */
  var sp=clamp(Math.sqrt(g.area/40),120,1500),rr=sp*0.65,ns=0,pts=[];for(var yy=g.cy-g.R+sp/2;yy<g.cy+g.R;yy+=sp)for(var xx=g.cx-g.R+sp/2;xx<g.cx+g.R;xx+=sp)if(tzSd(g,xx,yy)<=0)pts.push(xx,yy);
  if(!pts.length)pts.push(g.cx,g.cy);
  for(var i=0;i<pts.length;i+=2){var px=pts[i],py=pts[i+1];ns++;urbanDamage(px,py,rr,clamp(rho*1.2,4,80),side,'carpet');roadDmg(px,py,rr,clamp(rho*1.2,15,255));if(G.civ)civHit(px,py,rr,clamp((1-Math.exp(-rho*20000e-6))*0.7,0,0.9),'carpet',side,0.4);
    if(G.evt&&rnd()<Math.min(0.5,rho/80))fireChance(px+(rnd()-0.5)*sp,py+(rnd()-0.5)*sp);if(G.fac)facHit(px,py,rr,clamp(rho*3,10,150),side,'carpet',src);if(typeof nodeHitAll==='function')nodeHitAll(px,py,rr,clamp(rho*3,10,150),side,'carpet',src);}
  afHit(side,g.cx,g.cy,Math.sqrt(g.area/PI)+200,clamp(rho*0.05,0.3,4),src);
  var st=G.stats[side];st.bzone=(st.bzone||0)+1;st.bombT=(st.bombT||0)+tons;
  logE(side,'air','✈ '+uName(src)+'對'+placeTxt(g.cx,g.cy)+'的轟炸區（'+tzDesc(g)+'，約 '+tzAreaTxt(g.area)+'）投下約 '+fmt(tons,tons<10?1:0)+' 公噸炸彈，平均每平方公里約 '+fmt(rho,rho<10?1:0)+' 公噸'+(o&&o.x!==undefined&&o._off>300?'；落彈中心偏離約 '+kmTxt(o._off):'')+'；波及 '+nh+' 個單位',g.cx,g.cy,src.id);
  if(ff.length){logE(side,'ff','誤炸！'+uName(src)+'的炸彈落在我軍'+ff.slice(0,3).map(uName).join('、')+(ff.length>3?'等 '+ff.length+' 個單位':'')+'的陣地上',ff[0].x,ff[0].y,ff[0].id);ff.forEach(function(t){mfAdd(t,'panic',-6);});}
  G._bzv=(G._bzv||[]).concat([{t:G.t,side:side,P:tzPoly(g)}]).slice(-20);
  if(typeof FX!=='undefined'&&FX.cap)FX.ev.push({k:'carpet',a:src,x1:g.cx,y1:g.cy,ang:g.ang,L:g.k==='strip'?g.L:2*g.R,W:g.k==='strip'?g.W:2*g.R,m:tons,tz:g});
  if(G.onPause&&apOn('strike'))G.onPause('轟炸區');return nh;}

/* ---------- 脫離：沿投彈航向直飛一段，再轉向返航 ---------- */
function airEgressStart(u,ang,D){u.task='egress';u.egH=ang;u.egD=Math.max(500,D);u.hd=ang;u.path=null;}
function airEgress(u,s){var v=s.vr/3.6,st=Math.min(u.egD,v*DT),MP=G.map;u.x=clamp(u.x+Math.cos(u.egH)*st,0,MP.Wm);u.y=clamp(u.y+Math.sin(u.egH)*st,0,MP.Hm);u.egD-=st;u.fuel=(u.fuel||0)-DT;u.hd=u.egH;
  if(u.egD<=1||u.x<=0||u.y<=0||u.x>=MP.Wm||u.y>=MP.Hm){u.task='rtb';u.egH=undefined;var B=baseOf(u);u.path={pts:[u.x,u.y,B[0],B[1]],i:2};}}
/* 載彈量（公噸）：轟炸機依機型資料；其他機種每架約 0.15～2.5 公噸（依年代） */
function airTons(u){var ac=Math.max(0,u.veh),X=typeof cpSpec==='function'?cpSpec(u):null,fr=Math.max(0.2,clamp((u.ammo||0)/100,0,1));if(X&&X.bt)return X.bt*ac*fr;var y=uEra(u).y||1943;return (y<1930?0.15:y<1950?0.45:y<1980?1.5:2.5)*ac*fr;}
/* 目標附近的設施與補給站 */
function airFacTg(a,o){var R=Math.max(600,(o.r||1500)*0.6),F=typeof facNear==='function'?facNear(o.x,o.y,R,function(Q){return Q.own!==a.side&&(Q.own>=0||o.fac===Q.id||dist(Q.x,Q.y,o.x,o.y)<400);}):null,N=null,bd=R;
  if(a.side>=0&&a.side<nSides()&&typeof SD==='function')hostSides(a.side).forEach(function(es){(SD(es).nodes||[]).forEach(function(q){if(q.k==='off'||q.fac||q.dead)return;var d=dist(q.x,q.y,o.x,o.y);if(d<bd){bd=d;N=q;}});});return {F:F,N:N};}
/* 點目標攻擊：一次用完整個架次的彈藥。原本盤旋時每步攻擊一次、每次耗彈 14；這裡把同樣的總量分給最多三個已知目標（5：3：2），
   附近有敵方設施或補給站時約三成五的炸彈投向設施。回傳 1＝已投彈、0＝沒有目標（攜彈返航）、-1＝沒有對地武器 */
function airStrikeRun(a,s,o){var SA=saOf(a,s),HA=haOf(a,s);if(SA<=0&&HA<=0)return -1;var M=clamp((a.ammo||0)/14,0.5,7),R=Math.max(1500,o.r||3000),L=[];
  gridNear(o.x,o.y,R,function(t){if(t.side===a.side||!onMap(t))return;var ts=ST(t);if(ts.dom==='air'||dist(t.x,t.y,o.x,o.y)>R)return;if(!known(a.side,t.id,600)&&!(a._seen&&a._seen.indexOf(t.id)>=0))return;
    L.push({t:t,v:(t.men+(t.cargoN||0)+t.veh*(HA>SA*0.3?20:8))/(1+dist(o.x,o.y,t.x,t.y)/3000)});});
  L.sort(function(p,q){return q.v-p.v;});L=L.slice(0,3);var FT=airFacTg(a,o),nf=(FT.F?1:0)+(FT.N?1:0);if(!L.length&&!nf&&o.k!=='bomb')return 0;
  var fShare=nf?(L.length?0.35:1):0,pow=(SA*0.3+HA*0.7+(s.fl.indexOf('B')>=0?8:0))*Math.max(1,a.veh||1)*0.25*strFrac(a);
  if(FT.F)facHit(FT.F.x,FT.F.y,150,clamp(pow*M*fShare/nf,2,300),a.side,'air',a);if(FT.N&&typeof nodeHitAll==='function')nodeHitAll(FT.N.x,FT.N.y,150,clamp(pow*M*fShare/nf,2,300),a.side,'air',a);
  var night=G.env.light<0.3?[0.15,0.5,0.9][clamp(s.nv,0,2)]:1,w=WX[G.env.wx][5],fr=strFrac(a),pen=penE(a,s),dm=DT/60,area=SA>=20&&HA<SA*0.2,Mt=M*(1-fShare),wts=[0.5,0.3,0.2].slice(0,L.length),ws=sum(wts,function(x){return x;})||1,n=0,ff=[];
  if(!L.length&&!nf){roadDmg(o.x,o.y,200,clamp(SA*0.2*M,2,60));if(G.civ){civHitAir(a,s,o.x,o.y,SA,fr,dm*M,true);urbanDamage(o.x,o.y,250,clamp(SA*0.2*M,2,40),a.side);}}
  L.forEach(function(p,i){var best=p.t,Mi=Mt*wts[i]/ws,cx=best.x,cy=best.y,tg=area?[]:[best];if(area)gridNear(cx,cy,350,function(t){if(onMap(t)&&ST(t).dom!=='air'&&dist(t.x,t.y,cx,cy)<=350)tg.push(t);});
    tg.forEach(function(t){var ts=ST(t),own=t.side===a.side,cov=covInd(t),f=(t===best?1:0.6)*(own?0.5:1)*fr*dm*FIRE_K*AIR_K*night*w*cov*(0.7+0.6*rnd())*ctrMul(a,t,'air')*Mi,F=SA*f,Fv=HA*f*penF(pen,armVs(t,ts,a));
      hit(t,own?null:a,F*(1-0.9*ts.hard),Fv*ts.hard+F*(1-ts.hard)*(t.veh/Math.max(1,t.men))*0.25,area?35:25,'airstrike');if(own){if(F+Fv*8>1)ff.push(t);}else n++;});
    roadDmg(cx,cy,area?300:150,clamp(SA*0.2*Mi,2,80));if(G.civ){civHitAir(a,s,cx,cy,SA,fr,dm*Mi,area);if(area)urbanDamage(cx,cy,300,clamp(SA*0.3*Mi,2,60),a.side);}});
  afHit(a.side,o.x,o.y,1500,SA*fr*0.004*M,a);a.ammo=0;
  var tx=L.length?'攻擊'+uName(L[0].t)+(n>1?'等 '+n+' 個目標':''):nf?'攻擊'+(FT.F?FACN[FT.F.k]+'「'+FT.F.name+'」':'補給站「'+FT.N.name+'」'):'對瞄準點投彈';
  logE(a.side,'air','✈ '+uName(a)+'直線進入，'+tx+'（'+placeTxt(o.x,o.y)+'），投下全部彈藥後脫離',o.x,o.y,a.id);
  if(ff.length)logE(a.side,'ff','誤炸！'+uName(a)+'的炸彈波及我軍'+ff.slice(0,3).map(uName).join('、')+(ff.length>3?'等 '+ff.length+' 個單位':''),ff[0].x,ff[0].y,ff[0].id);return 1;}
/* 轟炸區：依目標區形狀投下全部炸彈；整批落彈有瞄準誤差（年代、夜間、天候、士氣），常偏向進場的一側 */
function airZoneRun(u,o){var g=tzGeom(o,u),tons=airTons(u);if(tons<=0.05)return g;
  var X=typeof cpSpec==='function'?cpSpec(u):null,y=uEra(u).y||1943,cep=((X&&X.cep)||(y<1950?350:y<1980?150:40))*(airRole(u)==='attack'?0.5:1)*(G.env.light<0.3&&y<1960?1.6:1)*(WX[G.env.wx][5]<0.8?1.4:1)*(u.ms==='shaken'?1.3:1)*(1+(u.sup||0)/200),
    fx=Math.cos(g.ang),fy=Math.sin(g.ang),ea=(gss()*0.8-0.25)*cep,el=gss()*0.5*cep,dx=fx*ea-fy*el,dy=fy*ea+fx*el;o._off=Math.round(Math.sqrt(dx*dx+dy*dy));
  zoneHit(u.side,u,tzShift(g,dx,dy),tons,o);u.ammo=0;o.boom=1;return g;}
/* 抵達目標：依類型投彈、沿航向脫離；單次任務完成後命令結束 */
function airRelease(u,s,o){var role=airRole(u),ang=tzApp(u,o.x,o.y),egD=3000,r=1;
  if(o.k==='bombzone'){var g=airZoneRun(u,o);ang=g.ang;egD=(g.k==='strip'?(o.x1===undefined||o.x1===null?g.L/2:g.L):g.R)+2500;}
  else if(role==='bomber'&&o.k!=='strike'&&o.k!=='attack'){if(!o.boom)carpetRun(u,o);}else r=airStrikeRun(u,s,o);
  if(r===0)logE(u.side,'air',uName(u)+'飛抵'+placeTxt(o.x,o.y)+'，沒有發現目標，攜彈返航',o.x,o.y,u.id);
  o.rel=G.t;if(airRep(o)){o.st='exec';o.boom=0;}else o.st='done';airEgressStart(u,ang,egD);}
(function(){var b=airStep;airStep=function(u,s){
  if(u.st==='air'&&u.task==='egress'){airEgress(u,s);if(u.task==='egress')return;}
  var was=u.st;b(u,s);var o=u.ord;if(was==='base'&&u.st==='air'&&o){o.rel=0;if(airRep(o))o.boom=0;}
  if(u.st!=='air'||!o||!AIRRUNK.test(o.k)||!airRun(u))return;
  /* 地毯式轟炸（原本在抵達時投彈並直接轉回基地）：改為沿航向脫離 */
  if(o.k==='carpet'&&o.boom&&!o.rel&&u.task==='rtb'){o.rel=G.t;if(airRep(o)){o.st='exec';o.boom=0;}airEgressStart(u,tzApp(u,o.x,o.y),3000);return;}
  if(u.task==='loiter'&&!o.rel&&o.st!=='done'&&(u.ammo||0)>0)airRelease(u,s,o);};})();
/* ---------- 編制層級：轟炸區分派給所屬的轟炸機與攻擊機，戰鬥機在上空掩護；點目標任務的架次設定往下傳 ---------- */
(function(){var b=planOrder;planOrder=function(F,o){var k=o.k;
  if(k==='bombzone'){var out=[],n=0,g=tzGeom(o,null);kidsOf(F).filter(alive).forEach(function(u){if(roleOf(u)!=='air'){out.push([u,newOrder('halt',{})]);return;}if(isLeaf(u)&&isCarrier(u))return;var L=isLeaf(u)?[u]:leavesOf(u).filter(alive);
      if(L.some(airRun)){out.push([u,newOrder('bombzone',tzCopy(o))]);n++;}else out.push([u,newOrder('patrol',{x:g.cx,y:g.cy,r:Math.max(3000,g.R)})]);});
    if(!n)logE(F.side,'air',uName(F)+'沒有轟炸機或攻擊機可以執行轟炸區任務',o.x,o.y,F.id);return out;}
  var R=b(F,o);if(Array.isArray(R)&&o.opt&&o.opt.sor&&AIRRUNK.test(k))R.forEach(function(p){var so=p[1];if(so&&AIRRUNK.test(so.k))so.opt=Object.assign({},so.opt||{},{sor:o.opt.sor});});return R;};})();
