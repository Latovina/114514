/* ===================== 後勤道路：輪型後勤車輛以道路為最優先（離開道路大幅減速；嚴格模式下只能走道路），越野車、履帶車例外；
   沒有道路連接的補給站改由直升機、運輸機補給；工兵修路與造路；補給站可被摧毀；非地圖固有的建築被摧毀即從地圖移除 =====================
   嚴肅模擬：滿載的卡車與馬車離開道路就會陷進泥地、翻覆或拋錨，真實的補給線幾乎完全依賴道路網；
   道路被彈坑、瓦礫、路障切斷，或橋梁被炸，補給就斷了。全輪驅動的越野卡車與履帶運輸車可以越野，但更慢、載重更小。 */
FEAT.push(['xtruck','越野卡車',1935,'全輪驅動卡車可以離開道路行駛（越野較慢、載重較小）；之前的卡車與馬車只能走道路'],['tcarrier','履帶運輸車',1942,'履帶式運輸車可以越野，比卡車慢、載重更小']);FEATD.xtruck=1935;FEATD.tcarrier=1942;
/* 道路規則：prefer＝道路最優先、離開道路降速（預設）；strict＝只能走道路；off＝不限制（舊版） */
function lgRoadM(){var S=G&&G.set;if(!S||S.lgRoad===false)return 'off';return S.lgRoadM==='strict'?'strict':S.lgRoadM==='off'?'off':'prefer';}
function lgRoadOn(){return lgRoadM()!=='off';}
var RDSLOW=0.4,RDPM=5;/* 離開道路：速度約剩四成；尋路成本再加倍（道路最優先） */

/* ---------- 一、道路網：連通區塊、最近的道路、本方地圖邊緣的道路入口 ---------- */
function rdOK(k){var MP=G.map;if(!MP.rd[k]||MP.ft[k]===6)return false;var FL=G.evt&&G.evt.fl;return !(FL&&FL[k]);}
/* 連通標記：地圖改變後最多延遲 10 分鐘重算（全圖掃描一次） */
function rdNet(){var MP=G.map,GW=MP.GW,GH=MP.GH,N=GW*GH,C=G._rdn,v=G._mapv||0;if(C&&C.N===N&&(C.v===v||G.t-C.t<600&&G.t>=C.t))return C;
  var lab=C&&C.N===N?C.lab:new Int32Array(N),Q=C&&C.N===N&&C.Q?C.Q:new Int32Array(N),id=0,sz=[0];lab.fill(0);
  for(var k=0;k<N;k++){if(lab[k]||!rdOK(k))continue;id++;var h=0,t=0,n=0;Q[t++]=k;lab[k]=id;while(h<t){var c=Q[h++],x=c%GW,y=(c-x)/GW;n++;for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;var X=x+dx,Y=y+dy;if(X<0||Y<0||X>=GW||Y>=GH)continue;var q=Y*GW+X;if(!lab[q]&&rdOK(q)){lab[q]=id;Q[t++]=q;}}}sz.push(n);}
  C=G._rdn={N:N,v:v,t:G.t,lab:lab,Q:Q,sz:sz,edge:{}};return C;}
/* 最近的道路格（R 公尺內）：回傳 {k,d} 或 null */
function rdNear(x,y,R){var MP=G.map,GW=MP.GW,GH=MP.GH,cs=MP.cs,k0=cellAt(x,y),gx=k0%GW,gy=(k0-gx)/GW,Rc=Math.ceil(R/cs),best=-1,bd=1e18;if(rdOK(k0))return {k:k0,d:0};
  for(var r=1;r<=Rc;r++){if(best>=0&&r*r>bd)break;for(var j=-r;j<=r;j++){for(var s=0;s<4;s++){var X,Y;if(s===0){X=gx+j;Y=gy-r;}else if(s===1){X=gx+j;Y=gy+r;}else{if(j===-r||j===r)continue;X=s===2?gx-r:gx+r;Y=gy+j;}
        if(X<0||Y<0||X>=GW||Y>=GH)continue;var q=Y*GW+X;if(!rdOK(q))continue;var d2=(X-gx)*(X-gx)+(Y-gy)*(Y-gy);if(d2<bd){bd=d2;best=q;}}}}
  if(best<0)return null;var d=Math.sqrt(bd)*cs;return d<=R?{k:best,d:d}:null;}
/* 補給站與道路的距離（快取 10 分鐘） */
function rdDist(o){if(o._rdT!==undefined&&G.t-o._rdT<600&&o._rdV===(G._mapv||0)&&o._rdX===o.x)return o._rdD;var n=rdNear(o.x,o.y,8000);o._rdT=G.t;o._rdV=G._mapv||0;o._rdX=o.x;o._rdD=n?n.d:1e9;return o._rdD;}
/* 本方地圖邊緣上的道路入口（每條穿出邊緣的道路取中間一格） */
function rdEdges(side){var C=rdNet(),e=SD(side).edge||'W',L=C.edge[e];if(L)return L;var MP=G.map,GW=MP.GW,GH=MP.GH,n=(e==='W'||e==='E')?GH:GW,run=null;L=[];
  for(var i=0;i<n;i++){var hit=-1;for(var d=0;d<2&&hit<0;d++){var X=e==='W'?d:e==='E'?GW-1-d:i,Y=e==='N'?d:e==='S'?GH-1-d:i,q=Y*GW+X;if(rdOK(q))hit=q;}
    if(hit>=0){(run=run||[]).push(hit);}else if(run){L.push(run[run.length>>1]);run=null;}}if(run)L.push(run[run.length>>1]);C.edge[e]=L;return L;}
/* 通往 (x,y) 的道路入口：優先與目的地同一個道路網 */
function rdEdgeFor(side,x,y){var L=rdEdges(side);if(!L.length)return null;var C=rdNet(),nr=rdNear(x,y,2500),comp=nr?C.lab[nr.k]:0,b1=null,d1=1e18,b2=null,d2=1e18;
  L.forEach(function(q){var p=cellXY(q),d=dist(p[0],p[1],x,y);if(comp&&C.lab[q]===comp&&d<d1){d1=d;b1=p;}if(d<d2){d2=d;b2=p;}});return b1||b2;}

/* ---------- 二、道路優先的尋路：道路成本最低；嚴格模式下只有起點、終點附近（最後一段）可以離開道路 ---------- */
var RDOFF=1.6;/* 嚴格模式最後一段越野的成本倍數：能走道路就走道路 */
function rdStartR(x,y,lm){if(rdNear(x,y,lm))return lm;var f=rdNear(x,y,6000);return f?f.d+G.map.cs*2:lm;}
function roAvoid(base,x0,y0,x1,y1,ra,rb){var MP=G.map,GW=MP.GW,cs=MP.cs,rd=MP.rd,ft=MP.ft,FL=G.evt&&G.evt.fl,ka=cellAt(x0,y0),kb=cellAt(x1,y1),ax=ka%GW,ay=(ka-ax)/GW,bx=kb%GW,by=(kb-bx)/GW,a2=(ra/cs)*(ra/cs),b2=(rb/cs)*(rb/cs);
  var st=lgRoadM()==='strict',near=st?RDOFF:RDPM*0.5,far=st?Infinity:RDPM;
  var f=function(k){var m=base?base(k):1;if(rd[k]&&ft[k]!==6&&!(FL&&FL[k]))return m;var x=k%GW,y=(k-x)/GW,dx=x-ax,dy=y-ay;if(dx*dx+dy*dy<=a2)return m*near;dx=x-bx;dy=y-by;if(dx*dx+dy*dy<=b2)return m*near;return m*far;};f.ro=st?1:0;f.rp=1;f.lm=rb;f.tx=x1;f.ty=y1;return f;}
/* 嚴格模式不用粗網格走廊（走廊可能穿越沒有道路的野外），直接在道路網上搜尋 */
(function(){var b=findPath;findPath=function(s,x0,y0,x1,y1,opt){var av=opt&&opt.avoid;if(!av||!av.ro||s.dom!=='land')return b(s,x0,y0,x1,y1,opt);var R=b(s,x0,y0,x1,y1,Object.assign({},opt,{full:1}));
  if(R&&R.pts&&av.u){var n=R.pts.length,d=dist(R.pts[n-2],R.pts[n-1],av.tx,av.ty);if(d>av.lm+G.map.cs*3){var u=uById(av.u);/* 指定開設補給站的地點到不了：改在最接近的道路旁開設 */if(u&&u.v10dep&&dist(u.v10dep.x,u.v10dep.y,av.tx,av.ty)<300){u.v10dep.x=R.pts[n-2];u.v10dep.y=R.pts[n-1];}if(u&&!(u.roLog&&G.t-u.roLog<3600&&dist(u.roLx,u.roLy,av.tx,av.ty)<500)){u.roLog=G.t;u.roLx=av.tx;u.roLy=av.ty;logE(u.side,'path',uName(u)+'的車輛只能走道路：目標附近沒有道路，停在最接近的道路上（距目標約 '+kmTxt(d)+'）',u.x,u.y,u.id);}}}return R;};})();

/* ---------- 三、哪些部隊只能走道路：輪型或畜力牽引的後勤、衛生、戰俘、難民、民事、勞軍、營建、宣傳單位 ---------- */
function rdElig(u){if(!u||!u.mix||!isLeaf(u))return false;var s=ST(u);if(s.dom!=='land'||(s.mobi!==2&&s.mobi!==3))return false;
  for(var i=0;i<u.mix.length;i++){var t=typeOf(u.mix[i][0]);if(!t)continue;if(t.fl.indexOf('l')<0&&t.fl.indexOf('u')<0)return false;}return true;}
/* 越野車輛：部隊設定（1 越野、-1 只走道路）優先，否則依全軍設定；全輪驅動卡車出現之前都只能走道路 */
function rdXc(u){if(ST(u).mobi!==3||!featOn('xtruck'))return false;if(u.xc===1)return true;if(u.xc===-1)return false;return !!SD(u.side).lgXc;}
function rdBound(u){return lgRoadOn()&&rdElig(u)&&!rdXc(u);}
function rdLm(u){return ST(u).mobi===2?800:1200;}
(function(){var b=roadAvoid;roadAvoid=function(u){var av=b(u);if(!u.goal||!rdBound(u))return av;var lm=rdLm(u),f=roAvoid(av,u.x,u.y,u.goal[0],u.goal[1],rdStartR(u.x,u.y,lm),lm);f.u=u.id;return f;};})();
(function(){var b=pathShare;pathShare=function(u,s,av){return b(u,s,av)+(av&&av.rp?(av.ro?'|ro':'|rp'):'');};})();
/* 短距離直線移動：受道路規則限制的車輛超過最後一段的距離就不走直線（交給尋路比較道路與越野） */
(function(){var b=lineOK;lineOK=function(s,x0,y0,x1,y1){if(G._noLine)return false;return b(s,x0,y0,x1,y1);};})();
(function(){var b=wantPath;wantPath=function(u,x,y){if(isLeaf(u)&&rdBound(u)&&dist(u.x,u.y,x,y)>rdLm(u)){G._noLine=1;try{b(u,x,y);}finally{G._noLine=0;}return;}b(u,x,y);};})();

/* 離開道路：滿載的輪型車輛與馬車速度約剩四成 */
function rdBoundC(u){if(u._rbT!==G.step){u._rbT=G.step;u._rb=rdBound(u);}return u._rb;}
(function(){var b=speedAt;speedAt=function(u,s,pf){var v=b(u,s,pf);if(s.dom==='land'&&pf&&pf.road&&rdBoundC(u)&&!pf.road[cellAt(u.x,u.y)])v*=RDSLOW;return v;};})();

/* ---------- 四、補給車隊：卡車、馬車以道路為優先（嚴格模式只走道路）；越野卡車、履帶運輸車可以越野 ---------- */
LGM.xtruck={n:'越野卡車隊',u:'輛',dom:'land',mobi:3,vx:12};LGM.track={n:'履帶運輸車隊',u:'輛',dom:'land',mobi:4,vx:10};
LGM.truck.ro=1;LGM.truck.lm=1500;LGM.wagon.ro=1;LGM.wagon.lm=1000;
var LGVEH=[['auto','自動（走卡車；路線大半沒有道路時改派越野車輛，到不了才改用挑夫）'],['road','只用一般卡車／馬車'],['xtruck','全部改用越野卡車（較慢、載重約八成）'],['track','全部改用履帶運輸車（更慢、載重約六成）']];
function lgVxSet(){var y=lgY();LGM.xtruck.vx=y<1950?10:y<1990?15:20;LGM.track.vx=y<1950?9:y<1990?13:16;}
(function(){var b=lgSpd;lgSpd=function(m){var y=lgY();if(m==='xtruck')return b('truck')*0.92;if(m==='track')return y<1950?15:y<1990?26:32;return b(m);};})();
(function(){var b=lgPay;lgPay=function(m){if(m==='xtruck')return b('truck')*0.8;if(m==='track')return b('truck')*0.6;return b(m);};})();
(function(){var b=lgSerial;lgSerial=function(m){return m==='xtruck'?24:m==='track'?16:b(m);};})();
lgSpread=function(V,load){var sp=V.m==='truck'||V.m==='xtruck'?50:V.m==='track'?60:V.m==='wagon'?30:4,pb=Math.max(1,Math.floor(500/sp)),left=V.n,c=Math.cos(V.hd||0),s=Math.sin(V.hd||0);for(var d=0;left>0&&d<=8000;d+=500){var q=Math.min(left,pb),k=Math.floor((V.x-c*d)/500)+'|'+Math.floor((V.y-s*d)/500);load[k]=(load[k]||0)+q;left-=q;}};
/* 道路優先的路線（嚴格模式只走道路，含最後一段）；找不到就回傳 null */
(function(){var b=lgPath;lgPath=function(m,x0,y0,x1,y1,side){var D=LGM[m];if(!D||!D.ro||!lgRoadOn())return b(m,x0,y0,x1,y1,side);
  var MP=G.map,ka=cellAt(x0,y0),kb=cellAt(x1,y1),key=lgRoadM()+'|'+m+'|'+(ka>>1)+'|'+(kb>>1)+'|'+side,C=G._lgpc||(G._lgpc={n:0,v:-1});if(C.v!==(G._mapv||0)){G._lgpc=C={n:0,v:G._mapv||0};}var c=C[key];if(lgCacheOK(c,side,true))return c.p?c.p.slice():null;lgWork(x0,y0,x1,y1);
  var lm=D.lm||1500,P=findPath(lgType(m),x0,y0,x1,y1,{avoid:roAvoid(lgAvoid(side),x0,y0,x1,y1,rdStartR(x0,y0,lm),lm),max:90000,partial:false});P=P&&P.pts;if(P){var n=P.length;if(n<4||dist(P[n-2],P[n-1],x1,y1)>Math.max(600,MP.cs*4))P=null;}
  if(C.n>500){G._lgpc=C={n:0,v:G._mapv||0};}C[key]={p:P,t:G.t,th:lgRouteRisk(P,side,true)};C.n++;return P?P.slice():null;};})();
/* 派車時選擇車種：依全軍設定；自動時，路線大半沒有道路就改派越野卡車（嚴格模式：道路不通才改派越野卡車、履帶車，或在卡車出現前改用挑夫） */
function lgOffFrac(P){if(!P||P.length<4)return 1;var MP=G.map,cs=MP.cs,tot=0,off=0;for(var i=2;i<P.length;i+=2){var L=dist(P[i-2],P[i-1],P[i],P[i+1]),n=Math.max(1,Math.ceil(L/cs));for(var j=0;j<n;j++){var k=cellAt(P[i-2]+(P[i]-P[i-2])*(j+0.5)/n,P[i-1]+(P[i+1]-P[i-1])*(j+0.5)/n);tot+=L/n;if(!MP.rd[k])off+=L/n;}}return tot>0?off/tot:1;}
function lgVeh(side){return SD(side).lgVeh||'auto';}
function lgFb(m){if(m==='truck')return featOn('xtruck')?'xtruck':featOn('tcarrier')?'track':'porter';if(m==='wagon')return 'porter';return null;}
function lgFbLog(side,m0,m,o,fr){var S=SD(side),h=o.home||{},key=h.k==='node'?'n'+h.id:h.k==='unit'?'u'+h.id:'x',L=S.lgFbL||(S.lgFbL={});if(L[key]&&G.t-L[key]<6*3600)return;L[key]=G.t;
  var who=h.k==='node'?(function(){var N=lgNode(side,h.id);return N?'「'+N.name+'」':'補給站';})():h.k==='unit'?(function(){var u=uById(h.id);return u?uName(u):'補給部隊';})():'補給站';
  logE(side,'log',who+(fr>=0?'到上游的路線約 '+pct(fr*100)+' 沒有道路：卡車離開道路寸步難行，改派'+LGM[m].n+'（越野較快、載重較小）':'與上游之間沒有道路相通：'+LGM[m0].n+'只能走道路，改派'+LGM[m].n+(m==='porter'?'（人力挑運，運量大減）':'（越野較慢、載重較小）')),o.x,o.y);}
(function(){var b=lgNew;lgNew=function(side,m,n,o){if(lgRoadOn()&&LGM[m]&&LGM[m].ro&&o&&o.x!==undefined){var pol=lgVeh(side),m0=m;
    if(m==='truck'&&pol==='xtruck'&&featOn('xtruck'))m='xtruck';else if(m==='truck'&&pol==='track'&&featOn('tcarrier'))m='track';
    else if(pol!=='road'){var t=o.ph==='in'?lgEnd(o.dst):lgEnd(o.src);if(t){var P0=lgPath(m,o.x,o.y,t[0],t[1],side),fr=P0?lgOffFrac(P0):1,fb=!P0?lgFb(m):fr>0.3&&m==='truck'&&featOn('xtruck')?'xtruck':null;if(fb){m=fb;var Ls=lgStats(side);Ls.fb=(Ls.fb||0)+1;lgFbLog(side,m0,m,o,P0?fr:-1);}}}
    if(m!==m0){var p0=lgPay(m0),p1=lgPay(m);if(m==='porter'){n=clamp(Math.ceil(n*(o.pay||p0)/p1),20,600);o=Object.assign({},o,{pay:p1});}else if(o.pay)o=Object.assign({},o,{pay:o.pay*p1/p0});}}
  return b(side,m,n,o);};})();
/* 卡車、馬車離開道路：速度約剩四成 */
(function(){var b=lgSpeedAt;lgSpeedAt=function(V,load){var sp=b(V,load),D=LGM[V.m];if(D&&D.ro&&lgRoadOn()){var pf=pfFor(D.mobi);if(!pf.road[cellAt(V.x,V.y)])sp=Math.max(0.4,sp*RDSLOW);}return sp;};})();
/* 沒有道路連接的補給站：直升機（1950 年起）從最近的本方機場或地圖外運補；沒有直升機時，運輸機空投（每天的架次與被圍部隊的空中補給共用） */
function lgAirDepot(side){if(!lgRoadOn()||G.set.lgv===false)return;var heli=featOn('heli'),drop=featOn('airdrop');if(!heli&&!drop)return;var AP=lgAirPool(side);if(AP.left<=0)return;var L=nodesOf(side),dem=sideDemand(side);
  L.forEach(function(N){if(AP.left<=0||N.k!=='depot'||N.dead||N.status==='captured'||N.airT>G.t)return;if(rdDist(N)<=1500)return;if(lgSum(N.st)>(N.cap||3000)*0.6)return;if(enemyNear(side,N.x,N.y,1500,'land')>0)return;
    if((G.lgv||[]).some(function(V){return V.dst&&V.dst.k==='node'&&V.dst.id===N.id&&(V.m==='heli'||V.m==='drop')&&V.ph!=='dead'&&V.ph!=='gone';}))return;
    var A=null,bd=1e18;L.forEach(function(q){if(q.k!=='air'||q.status==='captured')return;var d=dist(q.x,q.y,N.x,N.y);if(d<bd){bd=d;A=q;}});var sp=A?[A.x,A.y]:lgEdge(side,N.x,N.y),d=dist(sp[0],sp[1],N.x,N.y),m=heli&&d<150000?'heli':drop?'drop':null;if(!m)return;
    var pay=lgPay(m),n=m==='heli'?clamp(Math.round(4+2*(lgY()>=1970)),1,6):3,V=lgNew(side,m,n,{home:A?{k:'node',side:side,id:A.id}:{k:'edge',x:sp[0],y:sp[1]},src:A?{k:'node',side:side,id:A.id}:{k:'edge',x:sp[0],y:sp[1]},dst:{k:'node',side:side,id:N.id},x:sp[0],y:sp[1],ph:'out',dem:dem});
    V.pts=null;AP.left--;N.airT=G.t+3*3600;var Ls=lgStats(side);Ls.airDep=(Ls.airDep||0)+1;
    logE(side,'log','「'+N.name+'」沒有道路連接（最近的道路約 '+(rdDist(N)>=1e8?'8 公里以上':kmTxt(rdDist(N)))+'），派'+(m==='heli'?'運輸直升機 ':'運輸機 ')+n+' 架從'+(A?'「'+A.name+'」':'後方基地')+(m==='heli'?'運補':'空投'),N.x,N.y);});}
/* 地圖外的補給從道路進入地圖：派車時把邊緣入口移到穿出本方邊緣的道路上 */
(function(){var b=lgEdge;lgEdge=function(side,x,y){var p=b(side,x,y);if(!G._lgRE||!lgRoadOn())return p;var e=rdEdgeFor(side,x,y);return e||p;};})();
(function(){var b=lgDispatch;lgDispatch=function(){G._lgRE=1;try{b.apply(this,arguments);}finally{G._lgRE=0;}};})();
/* 自動開設或遷移的補給站設在道路旁 */
function rdSnap(x,y,R){if(rdNear(x,y,400))return [x,y];var f=rdNear(x,y,R||3000);return f?cellXY(f.k):[x,y];}
(function(){var b=addNode;addNode=function(side,k,x,y,o){if(k==='depot'&&G.started&&G.map&&lgRoadOn()&&o&&(o.auto||o.snapRd)&&!o.fac){var p=rdSnap(x,y,3000);x=p[0];y=p[1];}return b(side,k,x,y,o);};})();
(function(){var b=buildApply;buildApply=function(u,o){if((o.bk||'pos')==='depot'&&lgRoadOn()){if(o.snapRd||SD(u.side).ai&&aiControls(u)){var p=rdSnap(o.x,o.y,3000);o.x=p[0];o.y=p[1];}var n0=(SD(u.side).nodes||[]).length;b(u,o);var N=(SD(u.side).nodes||[])[n0];
    if(N&&N.k==='depot'){var d=rdDist(N);if(d>1500)logE(u.side,'log','「'+N.name+'」離最近的道路約 '+kmTxt(d)+'：卡車與馬車只能走道路，需要工兵「造路」接通，否則只能靠越野車輛或挑夫運補',N.x,N.y,u.id);}return;}return b(u,o);};})();

/* ---------- 五、補給站與補給節點可被砲擊、轟炸、飛彈、爆炸摧毀（沒有對應設施的節點；有設施的由設施處理） ---------- */
function nodeR(N){return FACR[N.k]||200;}
function nodeTNT(N){var st=N.st||{},y=G.set.y||1943;return (st.ammo||0)*1000*(y<1880?0.4:0.12)+(st.fuel||0)*1000*0.02;}
function nodeHitAll(x,y,R,pow,side,cause,src){if(pow<=0||!G.started)return;SIDES().forEach(function(s){var L=SD(s).nodes;if(!L||!L.length)return;L.slice().forEach(function(N){if(N.k==='off'||N.fac||N.dead)return;var fr=nodeR(N),d=dist(N.x,N.y,x,y);if(d>R+fr)return;
    var f=d<R+fr*0.3?1:clamp(1-(d-R-fr*0.3)/(fr*0.7),0,1),v=FACV[N.k]||1,dmg=pow*f*v*(0.6+0.8*rnd8());if(dmg<0.05)return;var hp0=N.hp===undefined?100:N.hp;N.hp=Math.max(0,hp0-dmg);N.hitT=G.t;N.hitBy=side;
    var tnt=nodeTNT(N);if(N.hp>0&&tnt>200&&!N.burn&&rnd8()<dmg/120*1.4){N.burn=G.t+3600*(1+rnd8()*3);logE(N.side,'boom','「'+N.name+'」中彈起火，存放的物資開始燃燒',N.x,N.y);}
    if(N.hp<=0)nodeDestroy(N,side,cause,src);});});}
function nodeDestroy(N,side,cause,src){if(N.dead)return;N.dead=Math.max(1,G.t);N.hp=0;N.burn=0;var S=SD(N.side),st=N.st||{},tnt=nodeTNT(N),tot=lgSum(st);S.nodes=(S.nodes||[]).filter(function(q){return q!==N;});N.st={food:0,ammo:0,fuel:0,fod:0};
  var Ls=lgStats(N.side);Ls.depLost=(Ls.depLost||0)+1;Ls.depT=(Ls.depT||0)+tot;var nm=(LOGK[N.k]||['補給節點'])[0].replace(/（.*$/,'');
  logE(N.side,'boom',nm+'「'+N.name+'」被'+(cause==='demo'?'爆破':cause==='fire'?'大火燒毀':'摧毀')+(tot>1?'，損失約 '+fmt(tot)+' 噸物資':'')+'，從地圖上消失',N.x,N.y);if(side>=0&&side!==N.side)logE(side,'boom','摧毀'+G.sides[N.side].name+'的'+nm+'「'+N.name+'」'+(tot>1?'（約 '+fmt(tot)+' 噸物資）':''),N.x,N.y);
  if(tnt>40)boomAt(N.x,N.y,tnt,(st.ammo||0)>(st.fuel||0)*0.2?'ammo':'fuel',side,null,src);else if(tot>5&&G.evt)for(var i=0;i<3;i++)fireChance(N.x+(rnd8()-0.5)*200,N.y+(rnd8()-0.5)*200);
  if(G.onPause&&apOn('boom')&&tnt>2000)G.onPause('補給站爆炸');}
(function(){var b=facHit;facHit=function(x,y,R,pow,side,cause,src){b(x,y,R,pow,side,cause,src);if(cause!=='expl')nodeHitAll(x,y,R,pow,side,cause,src);};})();
/* 爆炸波及附近的補給站 */
(function(){var b=boomAt;boomAt=function(x,y,W,kind,side,F,src,sec){var R=b(x,y,W,kind,side,F,src,sec);if(!sec&&R)nodeHitAll(x,y,R[1],80,side,'expl',src);return R;};})();
/* 空中打擊：攻擊機在目標上空盤旋時，目標附近的敵方補給站受損 */
(function(){var b=airFacStep;airFacStep=function(){b();(G._air||G.units).forEach(function(a){if(a.st!=='air'||a.task!=='loiter'||!alive(a)||!a.ord||!/strike|bomb/.test(a.ord.k)||a.ammo<5||a.side<0||a.side>=nSides())return;var R=Math.max(600,(a.ord.r||1500)*0.6),N=null,bd=R;
    hostSides(a.side).forEach(function(es){(SD(es).nodes||[]).forEach(function(q){if(q.k==='off'||q.fac||q.dead)return;var d=dist(q.x,q.y,a.ord.x,a.ord.y);if(d<bd){bd=d;N=q;}});});if(!N)return;var s=ST(a),pow=(saOf(a,s)*0.3+haOf(a,s)*0.7+(s.fl.indexOf('B')>=0?8:0))*Math.max(1,a.veh||1)*0.25*strFrac(a);nodeHitAll(N.x,N.y,150,clamp(pow,2,80),a.side,'air',a);a.ammo=Math.max(0,a.ammo-2);});};})();
/* 起火的補給站：物資逐漸燒毀；無人威脅時由補給站人員（附近有工兵更快）慢慢修復 */
function nodeStep(){SIDES().forEach(function(s){(SD(s).nodes||[]).slice().forEach(function(N){if(N.k==='off'||N.fac||N.dead)return;
    if(N.burn){if(G.t>N.burn){N.burn=0;}else{var st=N.st;['fuel','ammo','food','fod'].forEach(function(c){if(st[c]>0)st[c]=Math.max(0,st[c]-st[c]*0.04-0.5);});N.hp=Math.max(0,(N.hp===undefined?100:N.hp)-1.2);if(N.hp<=0||rnd8()<0.01)nodeDestroy(N,N.hitBy===undefined?-1:N.hitBy,'fire');return;}}
    if(N.hp!==undefined&&N.hp<100&&G.step%20===6&&G.t-(N.hitT||0)>1800&&enemyNear(s,N.x,N.y,4000,'land')===0){var eng=G.units.some(function(u){return u.side===s&&isLeaf(u)&&onMap(u)&&isEng(u)&&dist(u.x,u.y,N.x,N.y)<2000;});N.hp=Math.min(100,N.hp+(eng?8:2));}});});}

/* ---------- 六、非地圖固有的建築（工兵構築、自動開設、援助團體設立）被摧毀時直接從地圖移除 ---------- */
function facFixed(F){return !(F.built||F.field||F.auto);}
(function(){var b=facDestroy;facDestroy=function(F,side,cause,src){var was=F.dead;b(F,side,cause,src);if(!was&&!facFixed(F)){F.gone=Math.max(1,G.t);G._facRm=1;}};})();
/* 在迴圈外移除，避免迭代中的陣列被改動 */
function facPurge(){if(!G._facRm||!G.fac)return;G._facRm=0;var keep=G.fac.filter(function(F){return !F.gone;});if(keep.length!==G.fac.length){G.fac.length=0;keep.forEach(function(F){G.fac.push(F);});}}

/* ---------- 七、工兵：修路（填平彈坑、清除瓦礫與路障）、造路（開出新的道路） ---------- */
Object.assign(ORDN,{roadfix:'修路',roadbuild:'造路'});
function canRoad(u){var s=ST(u);return s.dom==='land'&&(isEng(u)||s.fl.indexOf('f')>=0);}
/* 每天可開出的道路（公里，單一連級工兵）：機具出現前靠人力，二戰起有推土機與平路機 */
function rdKmDay(u){var y=uEra(u).y,v=y<1800?0.8:y<1880?1.2:y<1914?1.5:y<1940?2.5:y<1970?4:y<2000?5:6;return v*(isEng(u)?1:0.6)*(hasQ(offOf(u),'sapper')?1.5:1);}
/* 地形係數：開闊地最快；森林、雨林、沼澤（鋪木排路）、岩地、陡坡、跨越小溪最慢 */
function rdCellF(k){var MP=G.map,c=MP.lc[k],n=LC[c][0],f=/^(field|mead|desert|tund|sand|burnt)$/.test(n)?1:/^(scrub|orch|hedge|park)$/.test(n)?0.7:/^(dfor|cfor)$/.test(n)?0.4:n==='jung'?0.25:n==='marsh'?0.3:/^(rock|snow)$/.test(n)?0.5:isUrban(c)?0.8:0.6;var sl=slopeArr()[k]||0;f/=1+sl*0.03;if(MP.rv[k])f*=0.5;return Math.max(0.05,f);}
/* 規劃道路：從起點（指定、或工兵附近的道路）到終點，沿著車輛可以通行的地形；大河須先架橋 */
function rbPlan(u,o){var MP=G.map,cs=MP.cs,sx,sy;if(o.from){sx=o.from[0];sy=o.from[1];}else{var n=rdNear(u.x,u.y,3000);if(n){var p0=cellXY(n.k);sx=p0[0];sy=p0[1];}else{sx=u.x;sy=u.y;}}
  var P=findPath({dom:'land',mobi:3,vr:30,vx:8,fl:''},sx,sy,o.x,o.y,{max:120000});if(!P||!P.pts||P.pts.length<4)return null;var rc=clamp(Math.round(+o.rc||1),1,2),cells=[],seen={},gap=0;
  for(var i=2;i<P.pts.length;i+=2){var x0=P.pts[i-2],y0=P.pts[i-1],x1=P.pts[i],y1=P.pts[i+1],n2=Math.max(1,Math.ceil(dist(x0,y0,x1,y1)/(cs*0.5)));for(var j=0;j<=n2;j++){var k=cellAt(x0+(x1-x0)*j/n2,y0+(y1-y0)*j/n2);if(seen[k])continue;seen[k]=1;if(isWater(MP.lc[k])||MP.rv[k]>=2){if(!MP.rd[k])gap++;continue;}if(MP.rd[k]<rc)cells.push(k);}}
  var e=[P.pts[P.pts.length-2],P.pts[P.pts.length-1]];return {q:cells,km:cells.length*cs/1000,sx:sx,sy:sy,end:e,short:dist(e[0],e[1],o.x,o.y)>cs*4,gap:gap,rc:rc};}
/* 修路範圍內需要處理的路段：彈坑（路面損壞）、瓦礫、鐵絲網與鹿砦、地雷 */
function rfScan(o){var MP=G.map,D=G.rdd,L=[];brushCells(MP,o.x/MP.cs,o.y/MP.cs,Math.max(1,(o.rr||800)/MP.cs),function(k){if(!MP.rd[k])return;var w=(D?D[k]:0)+(MP.lc[k]===LCI.rubble?150:0)+(MP.ft[k]===2?40:MP.ft[k]===3?160:0);if(w>0)L.push(k);});return L;}
function rfLeft(o){var MP=G.map,D=G.rdd,n=0;(o.L||[]).forEach(function(k){n+=(D?D[k]:0)+(MP.lc[k]===LCI.rubble?150:0)+(MP.ft[k]===2?40:MP.ft[k]===3?160:0);});return n;}
/* 每小時可處理的損壞點數（1 點＝1 格路面損壞；瓦礫 150、鐵絲網 40、地雷 160） */
function rfRate(u){var y=uEra(u).y;return (isEng(u)?900:450)*(y>=1940?1.5:y<1860?0.6:1)*(hasQ(offOf(u),'sapper')?1.3:1)*eqM(u,'dg');}
(function(){var b=engAct;engAct=function(u,o){var k=o.k;if(k!=='roadfix'&&k!=='roadbuild')return b(u,o);var s=ST(u);
  if(!canRoad(u)){logE(u.side,'eng',uName(u)+'不是工兵或營建部隊，無法'+ORDN[k],u.x,u.y,u.id);u.task='hold';u.ord=null;return true;}
  if(o.x===undefined){o.x=u.x;o.y=u.y;}
  if(k==='roadfix'){o.rr=clamp(+o.rr||800,200,3000);o.ph='go';o.wx=o.x;o.wy=o.y;var p=validPos(s,o.x,o.y);if(dist(u.x,u.y,p[0],p[1])<Math.min(400,o.rr))u.task='at';else{u.task='go';wantPath(u,p[0],p[1]);}return true;}
  var Pl=rbPlan(u,o);if(!Pl){logE(u.side,'eng',uName(u)+'：找不到可以開路的路線（可能被大河、湖泊或城牆阻隔）',u.x,u.y,u.id);u.task='hold';u.ord=null;return true;}
  if(!Pl.q.length){logE(u.side,'eng',uName(u)+'：這條路線已經有'+(Pl.rc>=2?'鄉道以上的':'')+'道路可走，不需要造路'+(Pl.short?'（但終點被河流或水域阻隔，需要架橋）':''),u.x,u.y,u.id);u.task='hold';o.st='done';return true;}
  o.q=Pl.q;o.n0=Pl.q.length;o.km=Pl.km;o.rc=Pl.rc;o.done=0;o.prog=0;o.ph='go';var c0=cellXY(Pl.q[0]);o.wx=c0[0];o.wy=c0[1];u.v11job=G.t+Math.max(6,Pl.km/rdKmDay(u)*24*(Pl.rc>=2?2:1))*3600;
  logE(u.side,'eng',uName(u)+'規劃'+(Pl.rc>=2?'鄉道':'小路')+'：需新開約 '+fmt(Pl.km,1)+' 公里（'+placeTxt(Pl.sx,Pl.sy)+' → '+placeTxt(Pl.end[0],Pl.end[1])+'），預計 '+durTxt(Pl.km/rdKmDay(u)*86400*(Pl.rc>=2?2:1)/Math.max(0.35,strFrac(u)))+(Pl.short||Pl.gap?'；途中的河流或水域需要另行架橋':''),u.x,u.y,u.id);
  if(dist(u.x,u.y,c0[0],c0[1])<G.map.cs*2)u.task='at';else{u.task='go';wantPath(u,c0[0],c0[1]);}return true;};})();
/* 造路、修路的進度 */
function rbWork(u,o){var MP=G.map,cs=MP.cs;if(o.ph==='go'){if(u.task==='go'&&(u.path||u.pq))return false;if(dist(u.x,u.y,o.wx,o.wy)>cs*6){if(u.task!=='go'){o.tries=(o.tries||0)+1;if(o.tries>3||u.noPath&&G.t-u.noPath.t<120){logE(u.side,'eng',uName(u)+'：無法抵達造路地點，停止造路',u.x,u.y,u.id);if(o.ks&&o.ks.length)mapChanged(o.ks.slice());o.ks=[];u.ord=null;u.task='hold';u.v11job=0;return true;}u.task='go';wantPath(u,o.wx,o.wy);}return false;}o.ph='work';u.task='work2';u.path=null;if(!o.t0){o.t0=G.t;logE(u.side,'eng',uName(u)+'開始造路',u.x,u.y,u.id);}return true;}
  if(o.ph!=='work')return false;if(!o.q||!o.q.length){o.ph='done';o.st='done';u.task='hold';return true;}
  var uf=G.t-(u.uf||-1e9)<120,en=!uf&&enemyNear(u.side,u.x,u.y,1500,'land')>0,rate=rdKmDay(u)*1000/cs/86400*DT*Math.max(0.35,strFrac(u))*(uf?0.25:en?0.5:1)*(G.env&&G.env.light<0.3&&lgY()<1990?0.6:1)*(o.rc>=2?0.5:1)*(u.fat>70?0.6:1)*(G.env&&G.env.frozen?0.7:1)*eqM(u,'dg');
  o.prog+=rate*rdCellF(o.q[0]);u.fat=clamp(u.fat+0.03,0,100);var ks=o.ks||(o.ks=[]);
  while(o.prog>=1&&o.q.length){o.prog-=1;var k=o.q.shift();if(!isWater(MP.lc[k])&&MP.rd[k]<o.rc){MP.rd[k]=o.rc;ks.push(k);}var p=cellXY(k);if(dist(u.x,u.y,p[0],p[1])>1)u.hd=Math.atan2(p[1]-u.y,p[0]-u.x);u.x=p[0];u.y=p[1];u.movedAt=G.t;o.done++;
    if(o.q.length){var nx=cellXY(o.q[0]);if(dist(u.x,u.y,nx[0],nx[1])>cs*3){o.ph='go';o.wx=nx[0];o.wy=nx[1];u.task='go';wantPath(u,nx[0],nx[1]);break;}}}
  if(ks.length&&(ks.length>=40||!o.q.length||o.ph==='go'||G.t-(o.kT||o.t0||0)>1800)){mapChanged(ks.slice());o.ks=[];o.kT=G.t;var A=awInit();A.cnt[u.side].road=(A.cnt[u.side].road||0)+ks.length*cs/1000;}
  if(!o.q.length){o.ph='done';o.st='done';u.task='hold';u.v11job=0;logE(u.side,'eng',uName(u)+'完成造路：新開'+(o.rc>=2?'鄉道':'小路')+'約 '+fmt(o.done*cs/1000,1)+' 公里，費時 '+durTxt(G.t-(o.t0||G.t)),u.x,u.y,u.id);}return true;}
function rfWork(u,o){var MP=G.map,cs=MP.cs;if(o.ph==='go'){if(u.task==='go'&&(u.path||u.pq))return false;if(dist(u.x,u.y,o.x,o.y)>(o.rr||800)+600){o.tries=(o.tries||0)+1;if(o.tries>3||u.noPath&&G.t-u.noPath.t<120){logE(u.side,'eng',uName(u)+'：無法抵達要修的路段',u.x,u.y,u.id);u.ord=null;u.task='hold';return true;}var p=validPos(ST(u),o.x,o.y);u.task='go';wantPath(u,p[0],p[1]);return false;}o.ph='work';u.task='work2';u.path=null;o.t0=G.t;o.L=rfScan(o);o.st0={pt:rfLeft(o),n:o.L.length};o.cnt={cr:0,rub:0,wire:0,mine:0};
    var bl=awInit().blown.filter(function(q){return !q.done&&dist(q.x,q.y,o.x,o.y)<(o.rr||800)+500;}).length;
    logE(u.side,'eng',uName(u)+'開始修路（'+placeTxt(o.x,o.y)+'，半徑 '+kmTxt(o.rr||800)+'）：'+(o.L.length?'約 '+o.L.length+' 處路段受損，預計 '+durTxt(o.st0.pt/rfRate(u)*3600/Math.max(0.35,strFrac(u))):'路面大致完好，只做整修維護')+(bl?'；附近有 '+bl+' 座被炸毀的橋梁，需要另外下令「架橋」':''),u.x,u.y,u.id);return true;}
  if(o.ph!=='work')return false;var uf=G.t-(u.uf||-1e9)<120,bud=rfRate(u)*DT/3600*Math.max(0.35,strFrac(u))*(uf?0.3:1)*(u.fat>70?0.6:1),D=G.rdd,ks=o.ks||(o.ks=[]),R=G.rdi,RR=G.rdr;u.fat=clamp(u.fat+0.02,0,100);
  if(G.step%40===u.id%40)o.L=rfScan(o);
  for(var i=0;i<o.L.length&&bud>0.01;i++){var k=o.L[i];
    if(D&&D[k]>0){var a=Math.min(D[k],bud);D[k]-=a;bud-=a;if(D[k]<=0){D[k]=0;o.cnt.cr++;}if(R&&RR&&RR[k]===4)R[k]=Math.min(R[k],D[k]);}
    if(bud<=0)break;var w=o.w||(o.w={});
    if(MP.lc[k]===LCI.rubble){w[k]=(w[k]||0)+Math.min(bud,150-(w[k]||0));bud-=Math.min(bud,150);if(w[k]>=150){MP.lc[k]=LCI.burnt;ks.push(k);o.cnt.rub++;w[k]=0;}}
    else if(MP.ft[k]===2||MP.ft[k]===3){var need=MP.ft[k]===2?40:160;w[k]=(w[k]||0)+Math.min(bud,need-(w[k]||0));bud-=Math.min(bud,need);if(w[k]>=need){o.cnt[MP.ft[k]===2?'wire':'mine']++;MP.ft[k]=0;ks.push(k);w[k]=0;}}}
  o.L=o.L.filter(function(k){return (D&&D[k]>0)||MP.lc[k]===LCI.rubble||MP.ft[k]===2||MP.ft[k]===3;});
  if(ks.length&&(ks.length>=20||!o.L.length||G.t-(o.kT||o.t0||0)>1200)){mapChanged(ks.slice());o.ks=[];o.kT=G.t;}
  if(!o.L.length){var M=G.rdm||(G.rdm={}),until=G.t+48*3600,n=0;brushCells(MP,o.x/MP.cs,o.y/MP.cs,Math.max(1,(o.rr||800)/MP.cs),function(k){if(MP.rd[k]){M[k]=until;n++;}});
    var c=o.cnt,parts=[];if(c.cr)parts.push('填平彈坑 '+c.cr+' 格');if(c.rub)parts.push('清除瓦礫 '+c.rub+' 格');if(c.wire)parts.push('拆除鐵絲網與路障 '+c.wire+' 處');if(c.mine)parts.push('排除地雷 '+c.mine+' 處');
    var A=awInit();A.cnt[u.side].rdfix=(A.cnt[u.side].rdfix||0)+c.cr+c.rub+c.wire+c.mine;
    logE(u.side,'eng',uName(u)+'完成修路（'+placeTxt(o.x,o.y)+'）：'+(parts.length?parts.join('、'):'路面整修')+'；之後 48 小時內這段路的泥濘車轍減少，費時 '+durTxt(G.t-o.t0),u.x,u.y,u.id);o.ph='done';o.st='done';u.task='hold';}return true;}
(function(){var b=engLeaf;engLeaf=function(u,s){var o=u.ord;if(o&&o.ph&&o.k==='roadbuild')return rbWork(u,o);if(o&&o.ph&&o.k==='roadfix')return rfWork(u,o);if(o&&o.k==='facdemo'&&o.node&&o.ph)return ndDemoWork(u,o);return b(u,s);};})();
/* 整修過的路段：泥濘車轍與彈坑造成的阻礙減少七成（48 小時） */
(function(){var b=roadStep;roadStep=function(){b();var M=G.rdm;if(!M||!G.rdi)return;var I=G.rdi,R=G.rdr,ch=false;for(var q in M){if(M[q]<G.t){delete M[q];continue;}var k=+q;if(I[k]&&(R[k]===3||R[k]===4)){I[k]=Math.round(I[k]*0.3);ch=true;}}if(ch&&G.rdiL)G.rdiL=G.rdiL.filter(function(k){return I[k]>=100;});};})();
/* 編制層級：交給最近的工兵（沒有工兵時交給營建、勞工部隊） */
(function(){var b=planOrder;planOrder=function(F,o){var k=o.k;if(k!=='roadfix'&&k!=='roadbuild')return b(F,o);var L=leavesOf(F).filter(function(u){return alive(u)&&onMap(u)&&canRoad(u);}),tx=o.x!==undefined?o.x:(cOf(F)||[F.x,F.y])[0],ty=o.y!==undefined?o.y:(cOf(F)||[F.x,F.y])[1];
  L.sort(function(a,c){return (isEng(c)-isEng(a))||dist(a.x,a.y,tx,ty)-dist(c.x,c.y,tx,ty);});if(!L.length)return [];return [[L[0],newOrder(k,{x:o.x,y:o.y,from:o.from,rc:o.rc,rr:o.rr,why:o.why,sub:1})]];};})();
/* 爆破補給站（沒有對應設施的節點）：撤退時拒止敵軍使用，或突擊隊破壞敵方補給站 */
function ndById(id){var r=null;SIDES().forEach(function(s){(SD(s).nodes||[]).forEach(function(N){if(N.id===id)r=N;});});return r;}
function ndNearAt(x,y,R){var b=null,bd=R;SIDES().forEach(function(s){(SD(s).nodes||[]).forEach(function(N){if(N.k==='off'||N.fac||N.dead)return;var d=dist(N.x,N.y,x,y);if(d<bd){bd=d;b=N;}});});return b;}
(function(){var b=v4Act;v4Act=function(u,o){if(o.k==='facdemo'&&!o.fac){var x=o.x!==undefined?o.x:u.x,y=o.y!==undefined?o.y:u.y,N=o.node?ndById(o.node):null;if(!N&&!facNear(x,y,1500,function(Q){return !Q.dead;}))N=ndNearAt(x,y,1500);
    if(N){o.node=N.id;o.ph='go';var p=validPos(ST(u),N.x,N.y);if(dist(u.x,u.y,p[0],p[1])<nodeR(N)+200){u.task='at';u.path=null;}else{u.task='go';wantPath(u,p[0],p[1]);}return true;}}return b(u,o);};})();
(function(){var b=v8Leaf;v8Leaf=function(u,s){var o=u.ord;if(o&&o.k==='facdemo'&&o.node)return false;return b(u,s);};})();
function ndDemoWork(u,o){var N=ndById(o.node);if(!N||N.dead){logE(u.side,'eng',uName(u)+'：目標補給站已不存在',u.x,u.y,u.id);u.ord=null;u.task='hold';return true;}
  if(o.ph==='go'){if(dist(u.x,u.y,N.x,N.y)>nodeR(N)+250)return false;o.ph='work';o.need=(isEng(u)?1200:2400)*(hasQ(offOf(u),'sapper')?0.67:1);o.prog=0;u.task='work2';u.path=null;logE(u.side,'eng',uName(u)+'開始爆破「'+N.name+'」，預計 '+durTxt(o.need),u.x,u.y,u.id);return true;}
  var uf=G.t-(u.uf||-1e9)<120;o.prog+=DT*(uf?0.3:1)*Math.max(0.35,strFrac(u));if(o.prog<o.need)return true;
  if(N.side!==u.side&&friendNear(N.side,N.x,N.y,800)>0)logE(u.side,'eng',uName(u)+'：「'+N.name+'」仍有敵軍守備，爆破失敗',u.x,u.y,u.id);else{logE(u.side,'eng',uName(u)+'爆破「'+N.name+'」'+(N.side===u.side?'（拒止敵軍使用）':''),N.x,N.y,u.id);nodeDestroy(N,N.side===u.side?-1:u.side,'demo',u);}
  u.ord=null;u.task='hold';return true;}

/* ---------- 八、AI：沒有道路連接的補給站派工兵開路；補給站附近道路上的瓦礫與路障派工兵清除 ---------- */
function rdEngFor(side,x,y,R){var b=null,bd=R;G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||!onMap(u)||u.ms==='rout'||!isEng(u)||!aiControls(u)||!awIdle(u)||v11Busy(u))return;if(enemyNear(side,u.x,u.y,3000,'land')>0)return;var d=dist(u.x,u.y,x,y);if(d<bd){bd=d;b=u;}});return b;}
function rdAIStep(){if(!lgRoadOn()||awMode()==='off')return;SIDES().forEach(function(side){if(!SD(side).ai||!awSideOn(side))return;
  nodesOf(side).forEach(function(N){if(N.k!=='depot'||N.dead||N.only||N.rdJob>G.t)return;if(enemyNear(side,N.x,N.y,5000,'land')>0)return;
    if(rdDist(N)>1500){var far=rdNear(N.x,N.y,8000);if(!far)return;var e=rdEngFor(side,N.x,N.y,25000);if(!e)return;N.rdJob=G.t+12*3600;var p=cellXY(far.k);issue(e,'roadbuild',{x:N.x,y:N.y,from:p,rc:1});logE(side,'eng','補給站「'+N.name+'」離道路約 '+kmTxt(far.d)+'，派'+uName(e)+'開一條聯絡道路',N.x,N.y,e.id);return;}
    if(N.rfJob>G.t)return;var MP=G.map,D=G.rdd,best=-1,bw=0;brushCells(MP,N.x/MP.cs,N.y/MP.cs,Math.max(1,3000/MP.cs),function(k){if(!MP.rd[k])return;var w=(D&&D[k]>120?D[k]:0)+(MP.lc[k]===LCI.rubble?150:0)+(MP.ft[k]===2||MP.ft[k]===3?200:0);if(w>bw){bw=w;best=k;}});
    if(best<0||bw<150)return;var c=cellXY(best),e2=rdEngFor(side,c[0],c[1],20000);if(!e2)return;N.rfJob=G.t+6*3600;e2.v11job=G.t+4*3600;issue(e2,'roadfix',{x:c[0],y:c[1],rr:800});logE(side,'eng','「'+N.name+'」附近的道路被瓦礫、彈坑或路障阻斷，派'+uName(e2)+'修路',c[0],c[1],e2.id);});});}

/* ---------- 九、接線：初始化、每步流程 ---------- */
function rdStep(){if(G.step===1||!G._lgVx){G._lgVx=1;lgVxSet();}facPurge();if(G.step%4===2)nodeStep();if(G.step%60===37)rdAIStep();if(G.step%60===23)SIDES().forEach(lgAirDepot);}
(function(){var b=v8Step;v8Step=function(){b();rdStep();};})();
