/* ===================== 區塊地形編修（邏輯）：以區塊而不是筆刷改變地形。
   選取：矩形、圓形、套索（任意多邊形）、魔術棒（相連的同類或同種地表），可以加選、減選、反選；
   操作：整塊換成某種地表（不規則的自然邊緣）、地景範本（森林、農田、草原、沼澤、沙漠、雪原、焦土、廢墟、湖泊、市鎮與城市含街道與聚落）、
   地勢（抬升、降低、整平、設定高度、平滑、起伏、山丘、山嶺，邊緣漸變）、清除道路鐵路工事溪流、複製貼上（旋轉、翻轉，高度相對或絕對）、地形印章；
   每次操作都可以復原 ===================== */
var BK={m:null,n:0,bb:null,v:0,clip:null,undo:[]};
function bkMask(MP){var N=MP.GW*MP.GH;if(!BK.m||BK.m.length!==N){BK.m=new Uint8Array(N);BK.n=0;BK.bb=null;BK.undo=[];}return BK.m;}
function bkReset(MP){bkMask(MP).fill(0);BK.n=0;BK.bb=null;BK.v++;}
function bkSync(MP){var m=bkMask(MP),GW=MP.GW,n=0,x0=1e9,y0=1e9,x1=-1,y1=-1;for(var k=0;k<m.length;k++)if(m[k]){n++;var x=k%GW,y=(k/GW)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}BK.n=n;BK.bb=n?[x0,y0,x1,y1]:null;BK.v++;return n;}
/* mode：0 取代、1 加選、-1 減選 */
function bkBegin(MP,mode){if(!mode)bkReset(MP);return bkMask(MP);}
function bkRect(MP,ax,ay,bx,by,mode){var m=bkBegin(MP,mode),cs=MP.cs,GW=MP.GW,x0=clamp(Math.floor(Math.min(ax,bx)/cs),0,GW-1),x1=clamp(Math.floor(Math.max(ax,bx)/cs),0,GW-1),y0=clamp(Math.floor(Math.min(ay,by)/cs),0,MP.GH-1),y1=clamp(Math.floor(Math.max(ay,by)/cs),0,MP.GH-1);
  for(var y=y0;y<=y1;y++)for(var x=x0;x<=x1;x++)m[y*GW+x]=mode<0?0:1;return bkSync(MP);}
function bkCircle(MP,cx,cy,r,mode){var m=bkBegin(MP,mode),cs=MP.cs,GW=MP.GW,R=r/cs,X=cx/cs,Y=cy/cs,x0=clamp(Math.floor(X-R),0,GW-1),x1=clamp(Math.ceil(X+R),0,GW-1),y0=clamp(Math.floor(Y-R),0,MP.GH-1),y1=clamp(Math.ceil(Y+R),0,MP.GH-1);
  for(var y=y0;y<=y1;y++)for(var x=x0;x<=x1;x++){var dx=x+0.5-X,dy=y+0.5-Y;if(dx*dx+dy*dy<=R*R)m[y*GW+x]=mode<0?0:1;}return bkSync(MP);}
/* 套索：世界座標的多邊形 [x0,y0,x1,y1,…]，逐列掃描填滿（以格心判斷） */
function bkPoly(MP,P,mode){var m=bkBegin(MP,mode),cs=MP.cs,GW=MP.GW,n=P.length>>1;if(n<3)return bkSync(MP);var minY=1e18,maxY=-1e18,i,j;for(i=0;i<n;i++){minY=Math.min(minY,P[2*i+1]);maxY=Math.max(maxY,P[2*i+1]);}
  var y0=clamp(Math.floor(minY/cs),0,MP.GH-1),y1=clamp(Math.floor(maxY/cs),0,MP.GH-1);for(var y=y0;y<=y1;y++){var wy=(y+0.5)*cs,xs=[];for(i=0,j=n-1;i<n;j=i++){var yi=P[2*i+1],yj=P[2*j+1];if((yi>wy)!==(yj>wy))xs.push(P[2*i]+(wy-yi)/(yj-yi)*(P[2*j]-P[2*i]));}
    xs.sort(function(a,b){return a-b;});for(var q=0;q+1<xs.length;q+=2){var xa=clamp(Math.ceil(xs[q]/cs-0.5),0,GW-1),xb=clamp(Math.floor(xs[q+1]/cs-0.5),0,GW-1);for(var x=xa;x<=xb;x++)m[y*GW+x]=mode<0?0:1;}}return bkSync(MP);}
/* 魔術棒：與點選處相連、同種（lc）或同類（森林、農地、城鎮、水域……）的地表 */
function bkGrp(c){if(isWater(c))return 'w';if(c===LCI.dfor||c===LCI.cfor||c===LCI.jung)return 'f';if(isUrban(c)||c===LCI.park)return 'u';if(c===LCI.field||c===LCI.hedge||c===LCI.orch)return 'a';if(c===LCI.mead||c===LCI.scrub)return 'g';return 'c'+c;}
function bkWand(MP,x,y,mode,same){var m=bkBegin(MP,mode),GW=MP.GW,GH=MP.GH,k0=cellAt(x,y),c0=MP.lc[k0],g0=bkGrp(c0),seen=new Uint8Array(GW*GH),Q=new Int32Array(GW*GH),h=0,t=0,ok=function(q){return same==='lc'?MP.lc[q]===c0:bkGrp(MP.lc[q])===g0;};Q[t++]=k0;seen[k0]=1;
  while(h<t){var k=Q[h++];m[k]=mode<0?0:1;var kx=k%GW;if(kx>0&&!seen[k-1]&&ok(k-1)){seen[k-1]=1;Q[t++]=k-1;}if(kx<GW-1&&!seen[k+1]&&ok(k+1)){seen[k+1]=1;Q[t++]=k+1;}if(k>=GW&&!seen[k-GW]&&ok(k-GW)){seen[k-GW]=1;Q[t++]=k-GW;}if(k+GW<GW*GH&&!seen[k+GW]&&ok(k+GW)){seen[k+GW]=1;Q[t++]=k+GW;}}return bkSync(MP);}
function bkInvert(MP){var m=bkMask(MP);for(var k=0;k<m.length;k++)m[k]=m[k]?0:1;return bkSync(MP);}
function bkAll(MP){bkMask(MP).fill(1);return bkSync(MP);}
/* 不規則的自然形狀：以角度雜訊扭曲的圓（印章用） */
function bkBlob(MP,cx,cy,R,seed,mode){var m=bkBegin(MP,mode),cs=MP.cs,GW=MP.GW,Rc=R/cs,X=cx/cs,Y=cy/cs,M=Math.ceil(Rc*1.35),s=seed||1;
  for(var y=Math.max(0,Math.floor(Y-M));y<=Math.min(MP.GH-1,Math.ceil(Y+M));y++)for(var x=Math.max(0,Math.floor(X-M));x<=Math.min(GW-1,Math.ceil(X+M));x++){var dx=x+0.5-X,dy=y+0.5-Y,d=Math.sqrt(dx*dx+dy*dy),a=Math.atan2(dy,dx),
    rr=Rc*(0.76+0.46*bkFbm(Math.cos(a)*2.2+5,Math.sin(a)*2.2+5,1.1,s));if(d<=rr)m[y*GW+x]=mode<0?0:1;}return bkSync(MP);}
/* ---------- 雜訊 ---------- */
function bkHash(x,y,s){var h=(x*374761393+y*668265263+(s|0)*1442695041)|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
function bkNoise(x,y,sc,s){var fx=x/sc,fy=y/sc,ix=Math.floor(fx),iy=Math.floor(fy),tx=fx-ix,ty=fy-iy,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty),a=bkHash(ix,iy,s),b=bkHash(ix+1,iy,s),c=bkHash(ix,iy+1,s),d=bkHash(ix+1,iy+1,s);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;}
function bkFbm(x,y,sc,s){return bkNoise(x,y,sc,s)*0.57+bkNoise(x,y,sc/2,s+7)*0.29+bkNoise(x,y,sc/4,s+13)*0.14;}
/* ---------- 選取的格子、離邊界的距離 ---------- */
function bkCells(MP){var m=bkMask(MP),bb=BK.bb,GW=MP.GW,o=[];if(!bb)return new Int32Array(0);for(var y=bb[1];y<=bb[3];y++)for(var x=bb[0];x<=bb[2];x++){var k=y*GW+x;if(m[k])o.push(k);}return Int32Array.from(o);}
function bkDist(MP,cap){var m=bkMask(MP),GW=MP.GW,GH=MP.GH,bb=BK.bb,d=new Uint8Array(m.length),Q=[],x,y,k;if(!bb)return d;cap=Math.min(cap||8,250);
  for(y=bb[1];y<=bb[3];y++)for(x=bb[0];x<=bb[2];x++){k=y*GW+x;if(!m[k])continue;if(x>0&&!m[k-1]||x<GW-1&&!m[k+1]||y>0&&!m[k-GW]||y<GH-1&&!m[k+GW]){d[k]=1;Q.push(k);}}
  for(var h=0;h<Q.length;h++){k=Q[h];var v=d[k];if(v>=cap)continue;x=k%GW;y=(k/GW)|0;if(x>0&&m[k-1]&&!d[k-1]){d[k-1]=v+1;Q.push(k-1);}if(x<GW-1&&m[k+1]&&!d[k+1]){d[k+1]=v+1;Q.push(k+1);}if(y>0&&m[k-GW]&&!d[k-GW]){d[k-GW]=v+1;Q.push(k-GW);}if(y<GH-1&&m[k+GW]&&!d[k+GW]){d[k+GW]=v+1;Q.push(k+GW);}}
  for(y=bb[1];y<=bb[3];y++)for(x=bb[0];x<=bb[2];x++){k=y*GW+x;if(m[k]&&!d[k])d[k]=cap;}return d;}
/* 自然邊緣：靠近邊界的格子依雜訊決定是否改變（約三格寬的不規則帶） */
function bkEdgeOK(d,k,GW,s,E){var x=k%GW,y=(k/GW)|0;return (d[k]-1)/(E||2.5)+(bkFbm(x,y,6,s)-0.5)*1.4>=0.15;}
/* ---------- 復原 ---------- */
var BKL=['lc','el','rd','rl','rv','ft','tn'];
function bkSnap(MP,ks,label){var o={ks:ks,label:label,a:{},set:JSON.stringify(MP.set||[]),lbl:JSON.stringify(MP.lbl||[]),brg:JSON.stringify(MP.brg||[])};BKL.forEach(function(f){var A=MP[f];if(!A)return;var C=new A.constructor(ks.length);for(var i=0;i<ks.length;i++)C[i]=A[ks[i]];o.a[f]=C;});
  BK.undo.push(o);var tot=0;for(var i=BK.undo.length-1;i>=0;i--){tot+=BK.undo[i].ks.length;if(tot>6e6||BK.undo.length-i>30){BK.undo.splice(0,i+1);break;}}return o;}
function bkUndo(MP){var o=BK.undo.pop();if(!o)return null;var ks=o.ks;Object.keys(o.a).forEach(function(f){var A=MP[f],C=o.a[f];if(!A)return;for(var i=0;i<ks.length;i++)A[ks[i]]=C[i];});MP.set=JSON.parse(o.set);MP.lbl=JSON.parse(o.lbl);MP.brg=JSON.parse(o.brg);return o;}
function bkPutLC(MP,k,c){MP.lc[k]=c;if(isWater(c)&&c!==LCI.riv){MP.rd[k]=0;MP.rl[k]=0;if(MP.ft)MP.ft[k]=0;}if(c===LCI.sea||c===LCI.shal){if(MP.el[k]>=0)MP.el[k]=c===LCI.sea?-30:-5;}else if(!isWater(c)&&MP.el[k]<0)MP.el[k]=1;}
/* ---------- 地表 ---------- */
function bkFillLC(MP,c,o){o=o||{};var ks=bkCells(MP);if(!ks.length)return null;bkSnap(MP,ks,'地表：'+LC[c][1]);var d=o.edge===false?null:bkDist(MP,6),s=o.seed||BK.v+3,n=0;
  for(var i=0;i<ks.length;i++){var k=ks[i];if(d&&!bkEdgeOK(d,k,MP.GW,s))continue;bkPutLC(MP,k,c);n++;}BK.last=n;return ks;}
var BKPRE={forest:['森林（林間空地、灌叢）',function(n,n2){return n<0.2?LCI.mead:n<0.3?LCI.scrub:n2<0.55?LCI.dfor:LCI.cfor;}],conifer:['針葉林',function(n){return n<0.14?LCI.scrub:LCI.cfor;}],jungle:['熱帶雨林',function(n){return n<0.12?LCI.scrub:LCI.jung;}],
  farm:['農田（樹籬、果園、零星村落）',function(n,n2,t){return n>0.84&&t>0.35?LCI.vill:n2>0.78?LCI.orch:n<0.3?LCI.hedge:LCI.field;}],meadow:['草原',function(n){return n<0.16?LCI.scrub:LCI.mead;}],marsh:['沼澤（水塘）',function(n,n2,t){return n<0.24&&t>0.25?LCI.lake:n<0.82?LCI.marsh:LCI.mead;}],
  desert:['沙漠（岩地）',function(n){return n<0.2?LCI.rock:LCI.desert;}],snow:['雪原（苔原）',function(n){return n<0.22?LCI.tund:LCI.snow;}],burnt:['焦土',function(n){return n<0.3?LCI.mead:LCI.burnt;}],rubble:['廢墟（戰損）',function(n){return n<0.28?LCI.burnt:LCI.rubble;}],
  lake:['湖泊（含湖岸）',null],town:['市鎮（街道、聚落）',null],city:['城市（中心、住宅、工業、公園、幹道）',null]};
function bkPreset(MP,key,o){o=o||{};if(key==='lake')return bkLake(MP,o);if(key==='town'||key==='city')return bkTown(MP,key==='city',o);var P=BKPRE[key];if(!P||!P[1])return null;var ks=bkCells(MP);if(!ks.length)return null;bkSnap(MP,ks,'地景：'+P[0]);
  var d=bkDist(MP,40),dm=1,s=o.seed||BK.v+5,GW=MP.GW,i,k;for(i=0;i<ks.length;i++)dm=Math.max(dm,d[ks[i]]);for(i=0;i<ks.length;i++){k=ks[i];if(o.edge!==false&&!bkEdgeOK(d,k,GW,s))continue;var x=k%GW,y=(k/GW)|0;if(isWater(MP.lc[k])&&key!=='marsh')continue;
    bkPutLC(MP,k,P[1](bkFbm(x,y,7,s),bkFbm(x,y,13,s+31),(d[k]-1)/Math.max(1,dm-1)));}return ks;}
/* 湖泊：整平到選取範圍的最低處以下，越往中央越深；湖岸留下沙灘或濕地 */
function bkLake(MP,o){var ks=bkCells(MP);if(!ks.length)return null;bkSnap(MP,ks,'地景：湖泊');var d=bkDist(MP,30),s=o.seed||BK.v+9,GW=MP.GW,lo=1e9,i,k;for(i=0;i<ks.length;i++){k=ks[i];if(!isWater(MP.lc[k]))lo=Math.min(lo,MP.el[k]);}if(lo>1e8)lo=0;
  for(i=0;i<ks.length;i++){k=ks[i];if(o.edge!==false&&!bkEdgeOK(d,k,GW,s)){if(d[k]<=2&&!isWater(MP.lc[k])&&bkHash(k,7,s)<0.45)bkPutLC(MP,k,bkHash(k,9,s)<0.5?LCI.sand:LCI.marsh);continue;}MP.lc[k]=LCI.lake;MP.rd[k]=0;MP.rl[k]=0;if(MP.ft)MP.ft[k]=0;MP.el[k]=clamp(Math.round(lo-1-Math.min(12,d[k]*1.5)),-11000,9000);}return ks;}
/* 市鎮與城市：中心高密度、外圍郊區，夾雜公園與工業區；街道網格與幹道，並連接到最近的公路；新增一個聚落 */
function bkTown(MP,big,o){var ks0=bkCells(MP);if(!ks0.length)return null;var GW=MP.GW,cs=MP.cs,sx=0,sy=0,i,k;for(i=0;i<ks0.length;i++){sx+=ks0[i]%GW;sy+=(ks0[i]/GW)|0;}var cx=Math.round(sx/ks0.length),cy=Math.round(sy/ks0.length),c0=cy*GW+cx;
  /* 找最近的既有道路，好把新市鎮接上路網 */var near=-1,bd=1e18,R=Math.min(160,Math.max(MP.GW,MP.GH));for(var r=1;r<=R&&near<0;r++)ringCol(cx,cy,r,GW,MP.GH,function(X,Y,a,b){var q=Y*GW+X;if(MP.rd[q]>=2&&!BK.m[q]){var dd=a*a+b*b;if(dd<bd){bd=dd;near=q;}}return false;});
  var extra=[];if(near>=0){var nx=near%GW,ny=(near/GW)|0;for(var y=Math.max(0,Math.min(cy,ny)-6);y<=Math.min(MP.GH-1,Math.max(cy,ny)+6);y++)for(var x=Math.max(0,Math.min(cx,nx)-6);x<=Math.min(GW-1,Math.max(cx,nx)+6);x++){var q2=y*GW+x;if(!BK.m[q2])extra.push(q2);}}
  var ks=new Int32Array(ks0.length+extra.length);ks.set(ks0);ks.set(extra,ks0.length);bkSnap(MP,ks,big?'地景：城市':'地景：市鎮');var d=bkDist(MP,60),dm=1,s=o.seed||BK.v+11,sp=Math.max(2,Math.round(250/cs)),urb=0;for(i=0;i<ks0.length;i++)dm=Math.max(dm,d[ks0[i]]);
  for(i=0;i<ks0.length;i++){k=ks0[i];if(isWater(MP.lc[k]))continue;if(o.edge!==false&&!bkEdgeOK(d,k,GW,s))continue;var x3=k%GW,y3=(k/GW)|0,t=(d[k]-1)/Math.max(1,dm-1)+(bkFbm(x3,y3,8,s)-0.5)*0.25,n=bkFbm(x3,y3,5,s+3),c;
    c=big?(t>0.72?LCI.city:t>0.45?(n>0.8?LCI.ind:LCI.town):n<0.12?LCI.park:n>0.9?LCI.ind:LCI.sub):(t>0.55?LCI.town:n<0.1?LCI.park:LCI.sub);bkPutLC(MP,k,c);urb++;
    if(sp<=40&&(x3%sp===0||y3%sp===0))MP.rd[k]=Math.max(MP.rd[k],2);if(x3===cx||y3===cy)MP.rd[k]=Math.max(MP.rd[k],3);}
  if(near>=0&&typeof editRoad==='function')editRoad(MP,c0,near,3,'road');
  var area=urb*cs*cs/1e6,pop=Math.round(area*(big?6500:4500)*0.7/10)*10,kind=pop>=30000?'city':pop>=3000?'town':'village',NG=nameGen((MP.seed||'')+'|blk|'+BK.v+'|'+cx+'|'+cy,MP.nst||'zh'),nm=o.name||NG[kind]();
  MP.set=MP.set||[];MP.set.push({x:cx+0.5,y:cy+0.5,pop:Math.max(200,pop),kind:kind,r:Math.round(Math.sqrt(Math.max(1e4,urb*cs*cs)/PI)),name:nm,blk:1});BK.lastSet=MP.set[MP.set.length-1];return ks;}
/* ---------- 地勢 ---------- */
var BKEL={raise:'抬升',lower:'降低',flat:'整平（平均高度）',set:'設定高度',smooth:'平滑',rough:'起伏化',hill:'山丘',ridge:'山嶺'};
function bkElev(MP,op,o){o=o||{};var ks=bkCells(MP);if(!ks.length)return null;bkSnap(MP,ks,'地勢：'+BKEL[op]);var F=Math.max(1,o.f||4),d=bkDist(MP,Math.max(F+1,o.peak?60:F+1)),GW=MP.GW,s=o.seed||BK.v+17,el=MP.el,i,k,dm=1,mean=0,nl=0;
  for(i=0;i<ks.length;i++){k=ks[i];dm=Math.max(dm,d[k]);if(!isWater(MP.lc[k])){mean+=el[k];nl++;}}mean=nl?mean/nl:0;var w=function(k){var t=clamp((d[k]-1)/F,0,1);return t*t*(3-2*t);},land=function(k,v){return isWater(MP.lc[k])?v:Math.max(1,v);};
  if(op==='smooth'){var it=clamp(o.n||3,1,10);for(var r=0;r<it;r++){var nv=new Float32Array(ks.length);for(i=0;i<ks.length;i++){k=ks[i];var x=k%GW,y=(k/GW)|0,sm=0,c=0;for(var b=-1;b<=1;b++)for(var a=-1;a<=1;a++){var X=x+a,Y=y+b;if(X<0||Y<0||X>=GW||Y>=MP.GH)continue;sm+=el[Y*GW+X];c++;}nv[i]=sm/c;}
      for(i=0;i<ks.length;i++){k=ks[i];el[k]=clamp(Math.round(land(k,el[k]+(nv[i]-el[k])*w(k))),-11000,9000);}}return ks;}
  for(i=0;i<ks.length;i++){k=ks[i];var x2=k%GW,y2=(k/GW)|0,W=w(k),v=el[k],z=+o.dz||0,amp=+o.amp||0;
    if(op==='raise')v+=z*W;else if(op==='lower')v-=z*W;else if(op==='flat')v+=(mean-v)*W;else if(op==='set')v+=((+o.h||0)-v)*W;else if(op==='rough')v+=amp*(bkFbm(x2,y2,5,s)-0.5)*2*W;
    else if(op==='hill'){var t=(d[k]-1)/Math.max(1,dm-1),sh=t*t*(3-2*t);v+=amp*sh*(0.75+0.5*bkFbm(x2,y2,9,s));}
    else if(op==='ridge'){var t2=(d[k]-1)/Math.max(1,dm-1),sh2=Math.sqrt(clamp(t2,0,1)),rn=1-Math.abs(2*bkFbm(x2,y2,10,s)-1);v+=amp*sh2*(0.35+0.65*rn*rn);if(amp>=250&&rn>0.82&&sh2>0.6&&!isWater(MP.lc[k]))MP.lc[k]=amp>=1500&&rn>0.93?LCI.snow:LCI.rock;}
    el[k]=clamp(Math.round(land(k,v)),-11000,9000);}return ks;}
/* ---------- 清除圖層 ---------- */
function bkClearLayers(MP,L){var ks=bkCells(MP);if(!ks.length||!L||!L.length)return null;bkSnap(MP,ks,'清除');L.forEach(function(f){var A=MP[f];if(!A)return;for(var i=0;i<ks.length;i++){var k=ks[i];if(f==='rv'&&MP.lc[k]===LCI.riv)continue;A[ks[i]]=0;}});if(L.indexOf('rd')>=0&&MP.tn)for(var i=0;i<ks.length;i++)MP.tn[ks[i]]&=2;return ks;}
/* ---------- 複製貼上 ---------- */
function bkCopy(MP){var ks=bkCells(MP);if(!ks.length)return null;var GW=MP.GW,bb=BK.bb,base=0,i;for(i=0;i<ks.length;i++)base+=MP.el[ks[i]];base/=ks.length;var C={w:bb[2]-bb[0]+1,h:bb[3]-bb[1]+1,n:ks.length,base:base,c:new Array(ks.length)};
  for(i=0;i<ks.length;i++){var k=ks[i];C.c[i]=[k%GW-bb[0],((k/GW)|0)-bb[1],MP.lc[k],MP.el[k]-base,MP.rd[k],MP.rl[k],MP.rv?MP.rv[k]:0,MP.ft?MP.ft[k]:0];}BK.clip=C;return C;}
function bkPlace(MP,C,cx,cy,rot,flip){var out=[],seen={};C.c.forEach(function(q){var x=q[0]-(C.w-1)/2,y=q[1]-(C.h-1)/2;if(flip)x=-x;for(var r=0;r<((rot||0)%4+4)%4;r++){var t=x;x=-y;y=t;}var X=Math.round(cx-0.5+x),Y=Math.round(cy-0.5+y);if(X<0||Y<0||X>=MP.GW||Y>=MP.GH)return;var k=Y*MP.GW+X;if(seen[k])return;seen[k]=1;out.push([k,q]);});return out;}
function bkPaste(MP,x,y,o){o=o||{};var C=BK.clip;if(!C)return null;var P=bkPlace(MP,C,x/MP.cs,y/MP.cs,o.rot,o.flip);if(!P.length)return null;var ks=Int32Array.from(P.map(function(p){return p[0];}));bkSnap(MP,ks,'貼上');var base=C.base,i;
  if(o.rel!==false){var sm=0;for(i=0;i<ks.length;i++)sm+=MP.el[ks[i]];base=sm/ks.length;}
  P.forEach(function(p){var k=p[0],q=p[1];MP.lc[k]=q[2];MP.el[k]=clamp(Math.round(base+q[3]),-11000,9000);MP.rd[k]=q[4];MP.rl[k]=q[5];if(MP.rv)MP.rv[k]=q[6];if(MP.ft)MP.ft[k]=q[7];if(!isWater(q[2])&&MP.el[k]<1)MP.el[k]=1;});
  /* 貼上的範圍成為新的選取，方便接著調整 */bkReset(MP);var m=bkMask(MP);for(i=0;i<ks.length;i++)m[ks[i]]=1;bkSync(MP);return ks;}
/* ---------- 地形印章：在點選處產生自然形狀的區塊並套用 ---------- */
var BKST={hill:['山丘','hill',150],ridge:['山嶺','ridge',900],lake:['湖泊','lake',0],forest:['森林','forest',0],marsh:['沼澤','marsh',0],farm:['農田','farm',0],village:['村莊','town',0],town:['市鎮','town',0],crater:['彈坑區','crater',0]};
function bkStamp(MP,x,y,key,R,o){o=o||{};var S=BKST[key];if(!S)return null;var seed=o.seed||BK.v+23;bkBlob(MP,x,y,key==='village'?Math.min(R,500):R,seed,0);if(!BK.n)return null;var k=S[1];
  if(k==='hill'||k==='ridge')return bkElev(MP,k,{amp:o.amp||S[2],seed:seed});if(k==='crater'){var ks=bkElev(MP,'rough',{amp:o.amp||6,seed:seed});BK.undo.pop();var ks2=bkCells(MP);bkSnap(MP,ks2,'印章：彈坑區');for(var i=0;i<ks2.length;i++){var q=ks2[i];if(!isWater(MP.lc[q])&&bkHash(q,3,seed)<0.55)bkPutLC(MP,q,bkHash(q,5,seed)<0.5?LCI.burnt:LCI.rubble);}return ks2||ks;}
  return bkPreset(MP,k,{seed:seed});}
