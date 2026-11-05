/* ===================== 戰役的大地圖：一次產生（或匯入）整個戰區，先算好聚落（建築、有無人居住）、道路、鐵路與河流，再依此產生各場作戰的區域地圖 =====================
   大地圖用較粗的格子（預設 500 公尺），產生時記錄每條道路與鐵路的走向（genRegion 的 spec.keep）。
   區域地圖：從大地圖取樣地勢、湖泊與河流，固定放上大地圖的聚落（名稱、人口、範圍），沿大地圖的道路與鐵路走向細部鋪設；
   線條剛好裁切在區域邊界上，相鄰兩張區域地圖的道路、鐵路與河流在同一點相接。 ===================== */
var CMPBIG={cs:500},CMPHB={m:null,h:null};
/* ---------- 折線裁切到矩形（區域座標，0～W、0～H），交點落在邊界上 ---------- */
function cmpClipSeg(ax,ay,bx,by,W,H){var t0=0,t1=1,dx=bx-ax,dy=by-ay,p=[-dx,dx,-dy,dy],q=[ax,W-ax,ay,H-ay];
  for(var i=0;i<4;i++){if(p[i]===0){if(q[i]<0)return null;continue;}var t=q[i]/p[i];if(p[i]<0){if(t>t1)return null;if(t>t0)t0=t;}else{if(t<t0)return null;if(t<t1)t1=t;}}
  return [ax+t0*dx,ay+t0*dy,ax+t1*dx,ay+t1*dy,t0,t1];}
function cmpClip(P,x0,y0,W,H){var out=[],cur=null;for(var i=0;i+3<P.length;i+=2){var c=cmpClipSeg(P[i]-x0,P[i+1]-y0,P[i+2]-x0,P[i+3]-y0,W,H);if(!c){if(cur){out.push(cur);cur=null;}continue;}
    if(!cur||c[4]>0){if(cur)out.push(cur);cur=[c[0],c[1]];}cur.push(c[2],c[3]);if(c[5]<1){out.push(cur);cur=null;}}
  if(cur)out.push(cur);return out.filter(function(q){return q.length>=4&&plLen(q)>1;});}
/* ---------- 大地圖：產生（記錄道路與鐵路走向）或沿用匯入的地圖 ---------- */
async function cmpBigMake(B,pg){var cs=+B.cs||CMPBIG.cs,gw=Math.max(20,Math.round((+B.W||100)*1000/cs)),gh=Math.max(20,Math.round((+B.H||80)*1000/cs)),Wm=gw*cs,Hm=gh*cs,seed=String(B.seed||'cmp'),smp,src='proc',lat0=+B.lat||45,lon0=0,world=null;
  if(B.src==='world'&&typeof WR!=='undefined'&&WR&&B.lon0!==undefined){smp=worldSampler(WR,+B.lon0,+B.lat0,Wm,Hm);src='world';lat0=+B.lat0;lon0=+B.lon0;world={name:WR.name};}
  else smp=procSampler({seed:seed,ter:B.ter||'mixed',clim:B.clim||'temperate',Wm:Wm,Hm:Hm,lat:lat0});
  var MP=await genRegion({GW:gw,GH:gh,cs:cs,seed:seed,year:+B.y||1943,name:B.name||'戰區大地圖',lat0:lat0,lon0:lon0,src:src,world:world,dens:+B.dens||1,rail:B.rail!==false,dev:B.dev||'auto',hsr:B.hsr!==false,nst:B.nst||'zh',keep:1},smp,pg);
  MP.big=1;cmpHab(MP,smp);return MP;}
/* 記下大地圖的宜居程度（決定人口密度與聚落多寡），區域地圖沿用；格數太多時降低解析度 */
function cmpHab(MP,smp){var K=Math.max(1,Math.ceil(Math.sqrt(MP.GW*MP.GH/150000))),W=Math.ceil(MP.GW/K),H=Math.ceil(MP.GH/K),h=new Uint8Array(W*H),d=MP.cs*K;
  for(var j=0;j<H;j++)for(var i=0;i<W;i++)h[j*W+i]=Math.round(clamp(smp.hab((i+0.5)*d,(j+0.5)*d),0,1)*255);MP.hb=b64enc(h);MP.hbK=K;MP.hbW=W;MP.hbH=H;}
/* ---------- 地點：每個聚落的種類、人口、有無人居住（可由戰役設定覆寫）、經過的道路與鐵路、河流 ---------- */
function cmpPlaces(BM,ovr){var cs=BM.cs,GW=BM.GW,GH=BM.GH;return (BM.set||[]).map(function(s,i){var x=s.x*cs,y=s.y*cs,R=Math.ceil((Math.max(s.r||300,cs)+500)/cs),cx=Math.floor(s.x),cy=Math.floor(s.y),rd=0,rl=0,rv=0;
    for(var b=-R;b<=R;b++)for(var a=-R;a<=R;a++){var X=cx+a,Y=cy+b;if(X<0||Y<0||X>=GW||Y>=GH||a*a+b*b>R*R)continue;var k=Y*GW+X;if(BM.rd[k]>rd)rd=BM.rd[k];rl|=BM.rl[k]||0;if(BM.rv[k]>rv)rv=BM.rv[k];}
    var o=(ovr&&ovr[i])||{};return {i:i,name:o.name||s.name,kind:s.kind,pop:s.pop,inh:o.inh===undefined?1:+o.inh,x:x,y:y,r:s.r||300,rd:rd,rl:rl,rv:rv};});}
function cmpPlaceTxt(P){var a=[];if(P.rd)a.push(RD[P.rd][1]);if(P.rl&2)a.push(RLN[2]);else if(P.rl&1)a.push(RLN[1]);if(P.rv>=2)a.push(RVN[P.rv]);return a.length?a.join('、'):'沒有道路經過';}
var CMPKN={city:'城市',town:'市鎮',village:'村落'};
/* ---------- 區域地圖的取樣器：地勢（雙線性）、起伏（周圍的高低差）、湖泊、大河、氣候 ---------- */
function cmpBigSampler(BM,x0,y0,Wm,Hm){var cs=BM.cs,GW=BM.GW,GH=BM.GH,el=BM.el,C=BM.clim||{Tj:5,Tl:20,Pj:60,Pl:60};if(BM.hb&&CMPHB.m!==BM){CMPHB.m=BM;CMPHB.h=b64dec(BM.hb);}var H=BM.hb?CMPHB.h:null,hd=cs*(BM.hbK||1);
  /* 土地利用的偏向：大地圖是森林 → 偏向林地；農地、草地 → 偏向開闊地；市區 → 偏向開闊地 */var lcv=function(i,j){var c=BM.lc[clamp(j,0,GH-1)*GW+clamp(i,0,GW-1)];return c===LCI.dfor||c===LCI.cfor||c===LCI.jung?1:c===LCI.field||c===LCI.hedge||c===LCI.orch||c===LCI.mead?-0.6:isUrban(c)?-0.8:0;};
  /* 海：大地圖的海面格（雙線性，海岸線由區域地圖細部描繪） */var isS=function(i,j){var c=BM.lc[clamp(j,0,GH-1)*GW+clamp(i,0,GW-1)];return c===LCI.sea||c===LCI.shal?1:0;},sea=function(x,y){var fx=(x0+x)/cs-0.5,fy=(y0+y)/cs-0.5,i0=Math.floor(fx),j0=Math.floor(fy),tx=fx-i0,ty=fy-j0;return (isS(i0,j0)*(1-tx)+isS(i0+1,j0)*tx)*(1-ty)+(isS(i0,j0+1)*(1-tx)+isS(i0+1,j0+1)*tx)*ty;};
  var at=function(i,j){return el[clamp(j,0,GH-1)*GW+clamp(i,0,GW-1)];};
  var S={nations:BM.nations||[],elev:function(x,y){var fx=(x0+x)/cs-0.5,fy=(y0+y)/cs-0.5,i0=Math.floor(fx),j0=Math.floor(fy),tx=fx-i0,ty=fy-j0;return (at(i0,j0)*(1-tx)+at(i0+1,j0)*tx)*(1-ty)+(at(i0,j0+1)*(1-tx)+at(i0+1,j0+1)*tx)*ty;},
    relief:function(x,y){var i=Math.floor((x0+x)/cs),j=Math.floor((y0+y)/cs),mn=1e9,mx=-1e9;for(var b=-1;b<=1;b++)for(var a=-1;a<=1;a++){var e=at(i+a,j+b);if(e<mn)mn=e;if(e>mx)mx=e;}return clamp(20+(mx-mn)*0.8,10,1600);},
    clim:function(){return {Tj:C.Tj,Tl:C.Tl,Pj:C.Pj,Pl:C.Pl};},hab:function(x,y){if(!H)return 0.5;var fx=(x0+x)/hd-0.5,fy=(y0+y)/hd-0.5,i0=Math.floor(fx),j0=Math.floor(fy),tx=fx-i0,ty=fy-j0,at2=function(i,j){return H[clamp(j,0,BM.hbH-1)*BM.hbW+clamp(i,0,BM.hbW-1)]/255;};return (at2(i0,j0)*(1-tx)+at2(i0+1,j0)*tx)*(1-ty)+(at2(i0,j0+1)*(1-tx)+at2(i0+1,j0+1)*tx)*ty;},
    land:function(x,y){return sea(x,y)<0.5?1:0;},landF:function(x,y){return 1-sea(x,y);},
    lcB:function(x,y){var fx=(x0+x)/cs-0.5,fy=(y0+y)/cs-0.5,i0=Math.floor(fx),j0=Math.floor(fy),tx=fx-i0,ty=fy-j0;return (lcv(i0,j0)*(1-tx)+lcv(i0+1,j0)*tx)*(1-ty)+(lcv(i0,j0+1)*(1-tx)+lcv(i0+1,j0+1)*tx)*ty;},
    lake:function(x,y){var i=Math.floor((x0+x)/cs),j=Math.floor((y0+y)/cs);if(i<0||j<0||i>=GW||j>=GH)return 0;return BM.lc[j*GW+i]===LCI.lake?1:0;},
    rivers:[],lat:function(){return BM.lat0||35;}};
  (BM.rivs||[]).forEach(function(R){cmpClip(R.pts,x0,y0,Wm,Hm).forEach(function(P){S.rivers.push({pts:P,cls:R.cls,name:R.name||''});});});
  return S;}
/* ---------- 區域地圖要固定的聚落、道路與鐵路（區域座標，公尺） ---------- */
function cmpRegionFix(BM,x0,y0,Wm,Hm,ovr){var cs=BM.cs,o={sets:[],roads:[],rails:[]};
  (BM.set||[]).forEach(function(s,i){var x=s.x*cs-x0,y=s.y*cs-y0;if(x<0||y<0||x>=Wm||y>=Hm)return;var q=(ovr&&ovr[i])||{};o.sets.push({x:x,y:y,pop:s.pop,kind:s.kind,name:q.name||s.name,r:s.r,inh:q.inh===undefined?1:+q.inh,bi:i});});
  (BM.rdp||[]).forEach(function(R){if(R.c<2)return;cmpClip(R.p,x0,y0,Wm,Hm).forEach(function(P){o.roads.push({c:R.c,p:P});});});
  (BM.rlp||[]).forEach(function(R){cmpClip(R.p,x0,y0,Wm,Hm).forEach(function(P){o.rails.push({h:R.h?1:0,p:P});});});
  return o;}
/* ---------- 產生一場作戰的區域地圖（同一場作戰每次都產生同樣的地圖） ---------- */
/* 作戰區域在大地圖上的範圍（公尺）：大小取整到區域地圖的格子，並放在大地圖之內 */
function cmpOpRect(BM,op){var cs=+op.cs||50,Wm=Math.min(Math.round((+op.w||20)*1000/cs)*cs,Math.floor(BM.Wm/cs)*cs),Hm=Math.min(Math.round((+op.h||15)*1000/cs)*cs,Math.floor(BM.Hm/cs)*cs);return {cs:cs,Wm:Wm,Hm:Hm,x0:clamp(+op.x||0,0,Math.max(0,BM.Wm-Wm)),y0:clamp(+op.y||0,0,Math.max(0,BM.Hm-Hm))};}
async function cmpRegionMake(CMP,BM,op,pg){var R=cmpOpRect(BM,op),cs=R.cs,Wm=R.Wm,Hm=R.Hm,x0=R.x0,y0=R.y0;
  var S=cmpBigSampler(BM,x0,y0,Wm,Hm),fix=cmpRegionFix(BM,x0,y0,Wm,Hm,CMP.places),seed=String(CMP.seed||'cmp')+'|op|'+op.id;
  var MP=await genRegion({GW:Wm/cs,GH:Hm/cs,cs:cs,seed:seed,year:+CMP.y||BM.year||1943,name:op.name||'作戰地區',lat0:BM.lat0,lon0:BM.lon0,src:BM.src,world:BM.world,dens:+CMP.big.dens||1,rail:true,dev:CMP.big.dev||'auto',hsr:true,nst:CMP.nst||BM.nst||'zh',fix:fix},S,pg);
  /* 無人居住的聚落：建築還在，居民為零 */(MP.set||[]).forEach(function(s){if(s.inh===0)s.pop=0;});
  MP.cmp={x0:x0,y0:y0,op:op.id};return MP;}
/* ---------- 產生器的輔助：記錄的路徑（格子）→ 公尺折線；沿固定走向鋪設道路與鐵路 ---------- */
function cmpPaths(MP,L){var GW=MP.GW,cs=MP.cs;return (L||[]).map(function(q){var P=[];q[1].forEach(function(k){P.push((k%GW+0.5)*cs,(((k/GW)|0)+0.5)*cs);});return {c:q[0],h:q[0],p:simplify(P,cs*0.45).map(function(v){return Math.round(v);})};}).filter(function(R){return R.p.length>=4;});}
function cmpLine(MP,a,b){var GW=MP.GW,x0=a%GW,y0=(a/GW)|0,x1=b%GW,y1=(b/GW)|0,dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,e=dx-dy,o=[];
  for(var n=0;n<100000;n++){o.push(y0*GW+x0);if(x0===x1&&y0===y1)break;var e2=2*e;if(e2>-dy){e-=dy;x0+=sx;}if(e2<dx){e+=dx;y0+=sy;}}return o;}
function cmpFixRoute(MP,slope,P,kind,fn){var GW=MP.GW,GH=MP.GH,cs=MP.cs,Q=resample(P,Math.max(cs*8,400)),prev=-1;
  for(var i=0;i+1<Q.length;i+=2){var k=clamp(Math.floor(Q[i+1]/cs),0,GH-1)*GW+clamp(Math.floor(Q[i]/cs),0,GW-1);if(prev>=0&&k!==prev)fn(gridPath(MP,slope,prev,k,kind,80000)||cmpLine(MP,prev,k));prev=k;}}
function cmpLayFix(MP,slope,L,lay){(L||[]).forEach(function(R){cmpFixRoute(MP,slope,R.p,'road',function(P){lay(P,R.c);});});}
function cmpRailFix(MP,slope,L){var cs=MP.cs;(L||[]).forEach(function(R){if(R.h){for(var i=0;i+3<R.p.length;i+=2)hsrLine(MP,R.p[i]/cs,R.p[i+1]/cs,R.p[i+2]/cs,R.p[i+3]/cs);return;}cmpFixRoute(MP,slope,R.p,'rail',function(P){P.forEach(function(k){MP.rl[k]|=1;});});});}
/* ---------- 匯入的地圖沒有記錄道路與鐵路走向：從格子描出折線（同等級的格子連成一條，接到交會的格子） ---------- */
function cmpTrace(MP,cls){var GW=MP.GW,GH=MP.GH,cs=MP.cs,N=GW*GH,seen=new Uint8Array(N),out=[],DX=[1,0,-1,0,1,-1,-1,1],DY=[0,1,0,-1,1,1,-1,-1],L=[];
  for(var k=0;k<N;k++)if(cls(k))L.push(k);
  var nb=function(k,f){var x=k%GW,y=(k/GW)|0,o=[];for(var d=0;d<8;d++){var X=x+DX[d],Y=y+DY[d];if(X<0||Y<0||X>=GW||Y>=GH)continue;var q=Y*GW+X;if(f(q))o.push(q);}return o;};
  var deg=function(k){var c=cls(k);return nb(k,function(q){return cls(q)===c;}).length;};
  L.sort(function(a,b){return cls(b)-cls(a)||deg(a)-deg(b);});
  L.forEach(function(s){if(seen[s])return;var c=cls(s),P=[s];seen[s]=1;
    /* 起點旁邊已經描過的格子（交會處）：從那裡接出來 */var j0=nb(s,function(q){return seen[q]&&cls(q);})[0];if(j0!==undefined&&j0!==s)P.unshift(j0);
    var cur=s,px=0,py=0;for(var n=0;n<N;n++){var x=cur%GW,y=(cur/GW)|0,best=-1,bs=-9;
      nb(cur,function(q){return !seen[q]&&cls(q)===c;}).forEach(function(q){var dx=q%GW-x,dy=((q/GW)|0)-y,sc=(dx*px+dy*py)-(dx&&dy?0.3:0);if(sc>bs){bs=sc;best=q;}});
      if(best<0){var jn=nb(cur,function(q){return seen[q]&&cls(q)&&P.indexOf(q)<0;})[0];if(jn!==undefined)P.push(jn);break;}
      px=best%GW-x;py=((best/GW)|0)-y;seen[best]=1;P.push(best);cur=best;}
    if(P.length<2)return;var M=[];P.forEach(function(q){M.push((q%GW+0.5)*cs,(((q/GW)|0)+0.5)*cs);});out.push({c:c,p:simplify(M,cs*0.45).map(function(v){return Math.round(v);})});});
  return out.filter(function(R){return R.p.length>=4;});}
/* 大地圖的準備：匯入的地圖補上道路與鐵路走向 */
function cmpBigPrep(BM){if(!BM.rdp)BM.rdp=cmpTrace(BM,function(k){return BM.rd[k]||0;});if(!BM.rlp){var R=cmpTrace(BM,function(k){var v=BM.rl[k]||0;return v&2?2:v&1?1:0;});BM.rlp=R.map(function(q){return {c:q.c,h:q.c===2?1:0,p:q.p};});}
  BM.Wm=BM.Wm||BM.GW*BM.cs;BM.Hm=BM.Hm||BM.GH*BM.cs;return BM;}
/* ---------- 地點之間的道路與鐵路：沿每條路線依序經過哪些聚落，相鄰兩個聚落之間就有一段 ---------- */
function cmpLinks(BM,P){var GW=BM.GW,GH=BM.GH,cs=BM.cs,own=new Int32Array(GW*GH).fill(-1),pr=new Float64Array(GW*GH),L={};
  P.forEach(function(p,i){var R=Math.max(p.r,cs*0.75)+cs*0.5,cx=Math.floor(p.x/cs),cy=Math.floor(p.y/cs),Rc=Math.ceil(R/cs);for(var b=-Rc;b<=Rc;b++)for(var a=-Rc;a<=Rc;a++){var X=cx+a,Y=cy+b;if(X<0||Y<0||X>=GW||Y>=GH)continue;var d=dist((X+0.5)*cs,(Y+0.5)*cs,p.x,p.y);if(d>R)continue;var k=Y*GW+X,w=p.pop/(1+d);if(own[k]<0||w>pr[k]){own[k]=i;pr[k]=w;}}});
  var walk=function(Rs,rail){Rs.forEach(function(R){var Q=resample(R.p,cs*0.5),last=-1,lastD=0,d=0;for(var i=0;i+1<Q.length;i+=2){if(i)d+=dist(Q[i-2],Q[i-1],Q[i],Q[i+1]);var X=clamp(Math.floor(Q[i]/cs),0,GW-1),Y=clamp(Math.floor(Q[i+1]/cs),0,GH-1),o=own[Y*GW+X];if(o<0||o===last)continue;
      if(last>=0){var a=Math.min(o,last),b=Math.max(o,last),key=a+'|'+b+'|'+(rail?1:0),km=(d-lastD)/1000,E=L[key];if(!E||km<E.km||(R.c||0)>E.c)L[key]={a:a,b:b,rail:rail?1:0,c:Math.max(R.c||0,E?E.c:0),h:R.h?1:(E?E.h:0),km:E?Math.min(E.km,km):km};}last=o;lastD=d;}});};
  walk(BM.rdp||[],false);walk(BM.rlp||[],true);
  var o=P.map(function(){return [];});Object.keys(L).forEach(function(k){var E=L[k];o[E.a].push({j:E.b,c:E.c,h:E.h,rail:E.rail,km:E.km});o[E.b].push({j:E.a,c:E.c,h:E.h,rail:E.rail,km:E.km});});
  o.forEach(function(A){A.sort(function(x,y){return x.rail-y.rail||y.c-x.c||x.km-y.km;});});return o;}
/* ---------- 地點的建築：用作戰地圖同一套規則在大地圖上配置設施與地標，歸到所在的聚落；另估計房屋數量 ---------- */
function cmpFacs(BM,y,P){var L=[];try{L=facGen(BM,y);facGen8(BM,y,L);}catch(e){}var o=P.map(function(){return [];});
  L.forEach(function(F){var bi=-1,bd=6000;P.forEach(function(p,i){var d=dist(F.x,F.y,p.x,p.y)-(F.set&&F.set===p.name?1e6:0);if(d<bd){bd=d;bi=i;}});if(bi>=0)o[bi].push(F);});return o;}
function cmpBldN(p,y){var per=p.kind==='city'?(y<1900?8:y<1960?12:22):p.kind==='town'?(y<1900?6:y<1960?7:9):(y<1900?5:4.5);return Math.max(3,Math.round(p.pop/per));}
function cmpFacTxt(L){var c={};(L||[]).forEach(function(F){var n=FACN[F.k]||F.k;c[n]=(c[n]||0)+1;});return Object.keys(c).map(function(n){return c[n]>1?n+' '+c[n]:n;}).join('、');}
/* ---------- 戰區的控制：初始依前線（西／東或北／南），之後由各場作戰的結果改變 ---------- */
function cmpOwn0(C,BM,p){var F=(C.big||{}).front||{dir:'WE',f:0.5},Wm=BM.Wm||1,Hm=BM.Hm||1,f=F.f===undefined?0.5:+F.f,d=F.dir||'WE';
  var t=d==='WE'||d==='EW'?p.x/Wm:p.y/Hm,s0=t<f?0:1;if(d==='EW'||d==='SN')s0=1-s0;return s0;}
