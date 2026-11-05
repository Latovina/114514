/* ===================== 偵察與接觸：觀測距離（光線、天氣、夜視、目標特徵、地表隱蔽、移動、開火）、通視、回報延遲、戰場情報圖 ===================== */
var GCS=4000;/* 空間格網尺寸（公尺） */
/* 細格網（1 公里，計數排序後的連續陣列）：半徑 3 公里以內的查詢只看附近幾格，密集部署時候選單位少很多 */
var GF=1000,GFR=3000;
function gridBuild(){var g={},gs=sAO(),MP=G.map,FW=Math.max(1,Math.ceil(MP.Wm/GF)+2),FH=Math.max(1,Math.ceil(MP.Hm/GF)+2),n=FW*FH,cnt=new Int32Array(n+1),L=[],ci=[];
  G.units.forEach(function(u){if(!onMap(u))return;var key=Math.floor(u.x/GCS)+Math.floor(u.y/GCS)*4096;(g[key]||(g[key]=[])).push(u);var S=gs[u.side];if(S)(S[key]||(S[key]=[])).push(u);var fx=clamp(Math.floor(u.x/GF)+1,0,FW-1),fy=clamp(Math.floor(u.y/GF)+1,0,FH-1),c=fy*FW+fx;L.push(u);ci.push(c);cnt[c+1]++;});
  for(var i=0;i<n;i++)cnt[i+1]+=cnt[i];var pos=cnt.slice(0,n),it=new Array(L.length);for(var j=0;j<L.length;j++)it[pos[ci[j]]++]=L[j];G._grid=g;G._gs=gs;G._gf={W:FW,H:FH,st:cnt,it:it};}
/* 只查某一方的單位（觀測只需要看敵方） */
function gridNearS(x,y,R,side,fn){var g=G._gs&&G._gs[side];if(!g){gridNear(x,y,R,function(u){if(u.side===side)fn(u);});return;}var x0=Math.floor((x-R)/GCS),x1=Math.floor((x+R)/GCS),y0=Math.floor((y-R)/GCS),y1=Math.floor((y+R)/GCS);for(var gy=y0;gy<=y1;gy++)for(var gx=x0;gx<=x1;gx++){var L=g[gx+gy*4096];if(L)for(var i=0;i<L.length;i++)fn(L[i]);}}
function gridNear(x,y,R,fn){var F=G._gf;if(F&&R<=GFR){var W=F.W,H=F.H,st=F.st,it=F.it,ax=Math.max(0,Math.floor((x-R)/GF)+1),bx=Math.min(W-1,Math.floor((x+R)/GF)+1),ay=Math.max(0,Math.floor((y-R)/GF)+1),by=Math.min(H-1,Math.floor((y+R)/GF)+1);
    for(var fy=ay;fy<=by;fy++){var row=fy*W;for(var fx=ax;fx<=bx;fx++){var c=row+fx;for(var k=st[c],e=st[c+1];k<e;k++)fn(it[k]);}}return;}
  var g=G._grid,x0=Math.floor((x-R)/GCS),x1=Math.floor((x+R)/GCS),y0=Math.floor((y-R)/GCS),y1=Math.floor((y+R)/GCS);for(var gy=y0;gy<=y1;gy++)for(var gx=x0;gx<=x1;gx++){var Lg=g[gx+gy*4096];if(Lg)for(var i2=0;i2<Lg.length;i2++)fn(Lg[i2]);}}
function hgtOf(u){var s=ST(u);return s.dom==='air'?(s.fl.indexOf('A')>=0?150:s.fl.indexOf('Z')>=0?800:1200):s.dom==='sea'?15:s.dom==='sub'?0:3;}
/* 單位觀測距離（公尺）：依觀測者 */
function spotOf(u,s){var r=s.spot*(hasQ(offOf(u),'scout')?1.2:1)*paceOf(u)[4]*eqM(u,'spm');if(u.form==='march')r*=0.6;if(u.slpT&&G.t<u.slpT)r*=0.6;if(u.sup>50)r*=0.6;if(s.dom==='air'&&u.st!=='air')return 0;return r;}
/* 目標可見度係數 */
function sigOf(t,ts,air){var MP=G.map,k=cellAt(t.x,t.y),c=MP.lc[k],f=ts.sig;if(ts.dom==='land')f*=LC[c][5];var fired=G.t-(t.fired||-1e9)<70;
  if(ts.fl.indexOf('S')>=0&&!fired)f*=0.25;if(G.t-(t.movedAt||-1e9)<70)f*=1.4;if(fired)f*=G.env.light<0.3?4:2.5;if(t.ent>0.5&&!fired)f*=0.7;if(t.form==='march')f*=1.3;if(air&&ts.dom==='land')f*=0.8;var op=optOf(t);if(!fired&&t.ord){if(t.ord.k==='attack'&&op.tac==='infil')f*=0.45;if(op.post==='ambush'&&!t.ambT||op.post==='hide')f*=0.4;}return f;}
function spotStep(){gridBuild();var MP=G.map,best={},seen0=[{},{}],light=G.env.light;G.units.forEach(function(u){u._seen=null;u._ed=1e9;u._eid=0;u._ep=0;u._cav=0;});
  G.units.forEach(function(o){if(!onMap(o)||o.ms==='rout'&&ST(o).dom!=='air')return;var s=ST(o),R0=spotOf(o,s);if(R0<=0)return;var air=s.dom==='air',vm=visMul(s.nv,air),h0=hgtOf(o),Rmax=R0*vm*3.2,seen=[],qk=s.fl.indexOf('r')>=0||s.br==='rec'?0.85:0.5;
    var SS=spotSides(o.side),hs=true,sf=function(t){if(t.side===o.side||!onMap(t))return;var ts=ST(t),d=dist(o.x,o.y,t.x,t.y);if(d>Rmax)return;if(t._sgS!==G.step){t._sgS=G.step;t._sg=sigOf(t,ts,false);}var R=R0*vm*(air&&ts.dom==='land'?t._sg*0.8:t._sg);if(ts.dom==='air')R=Math.max(R,R0*Math.max(0.35,vm)*ts.sig*(air?1.2:0.9));
      if(ts.dom==='sub'&&!air&&s.dom!=='sea'&&s.dom!=='sub')return;if(d>500&&optOf(t).post==='reverse'&&t.ord&&/defend|screen/.test(t.ord.k))R*=0.5;if(d>R)return;var th=hgtOf(t);if(!(air||ts.dom==='air')&&d>MP.cs*2&&!los(o.x,o.y,h0,t.x,t.y,th))return;
      var q=d<R*qk?1:0.5;if(!hs){spotN(o,t,ts,q);return;}seen.push(t.id);var id=t.id,cur=best[o.side+':'+id];if(!cur||cur.q<q)best[o.side+':'+id]={side:o.side,t:t,q:q,obs:o};
      if(d<o._ed){o._ed=d;o._eid=t.id;}if(d<2000)o._ep+=t.men;if(d<700&&ts.fl.indexOf('c')>=0)o._cav=1;};for(var si=0;si<SS.length;si++){hs=SS[si][1];gridNearS(o.x,o.y,Math.min(Rmax,60000),SS[si][0],sf);}o._seen=seen;});
  /* 回報：觀測到的接觸依指揮鏈回報延遲送入本方情報圖（同一目標取最快者） */
  for(var key in best){var b=best[key],t=b.t,o=b.obs,rd=reportDelay(o);G.rq[b.side].push({at:G.t+rd,id:t.id,x:t.x+(b.q<1?(rnd()-0.5)*400:0),y:t.y+(b.q<1?(rnd()-0.5)*400:0),t:G.t,q:b.q,by:o.id});
    if(!G.firstContact){G.firstContact=G.t;logE(-1,'contact','首次接觸：'+uName(o)+'在'+placeTxt(o.x,o.y)+'發現敵軍',t.x,t.y,o.id);if(G.onPause&&apOn('contact'))G.onPause('首次接觸');}}
  /* 附近的已知敵軍（本方情報圖，10 分鐘內）作為單位行為依據 */
  var CB=SIDES().map(function(s){return ctBuckets(s);});G.units.forEach(function(u){if(!onMap(u)||u._eid)return;var C=G.ct[u.side];gridNearCt(u,C,CB[u.side]);});void seen0;void light;}
/* 非交戰方（中立、同盟）的部隊：看得到就知道，直接記在 G.ctN（不進敵情圖，也不經指揮鏈回報） */
function spotN(o,t,ts,q){var N=G.ctN||(G.ctN=[]);while(N.length<nSides())N.push({});var C=N[o.side],c=C[t.id];if(c&&c.t===G.t&&c.q>=q)return;
  C[t.id]={id:t.id,x:t.x,y:t.y,t:G.t,q:Math.max(q,c&&G.t-c.t<1800?c.q:0),side:t.side,ech:dispEch(t),dom:ts.dom,br:ts.br,sym:ts.sym,men:Math.round(t.men/50)*50,veh:t.veh,name:q>=1||c&&c.name?uName(t):'',ms:t.ms};}
/* 10 分鐘內的已知敵軍按 3 公里方格分桶：每個單位只看周圍九格，不必逐一比對整張情報圖 */
function ctBuckets(side){var C=G.ct[side]||{},B=new Map();for(var id in C){var c=C[id];if(G.t-c.t>600)continue;var k=(Math.floor(c.x/3000)+5000)*20000+Math.floor(c.y/3000)+5000,L=B.get(k);if(!L)B.set(k,L=[]);L.push(+id);}return B;}
function gridNearCt(u,C,BK){var bd=3000,bi=0;if(!BK){for(var id in C){var c=C[id];if(G.t-c.t>600)continue;var d=dist(u.x,u.y,c.x,c.y);if(d<bd){bd=d;bi=+id;}}if(bi){u._ed=bd;u._eid=bi;}return;}
  var gx=Math.floor(u.x/3000)+5000,gy=Math.floor(u.y/3000)+5000;for(var ax=-1;ax<=1;ax++)for(var ay=-1;ay<=1;ay++){var L=BK.get((gx+ax)*20000+gy+ay);if(!L)continue;for(var i=0;i<L.length;i++){var q=L[i],c2=C[q],d2=dist(u.x,u.y,c2.x,c2.y);if(d2<bd||d2===bd&&bi&&q<bi){bd=d2;bi=q;}}}if(bi){u._ed=bd;u._eid=bi;}}
/* 回報延遲：由觀測單位經指揮鏈到最高司令部（每 5 分鐘重算一次） */
function reportDelay(o){if(o._rdT&&G.t-o._rdT<300)return o._rd;var e=orderDelayEst(o);o._rd=e.sec*0.8;o._rdT=G.t;return o._rd;}
function reportStep(){for(var s=0;s<nSides();s++){var Q=G.rq[s],keep=[],C=G.ct[s];for(var i=0;i<Q.length;i++){var r=Q[i];if(r.at>G.t){keep.push(r);continue;}var t=uById(r.id);if(!t)continue;if(nSides()>=3&&(t.side===s||!hostile(s,t.side))){if(t.side!==s&&t.side>=0)spotN({side:s},t,ST(t),r.q);continue;}var c=C[r.id];
      if(!c||r.t>=c.t){var ts=ST(t);C[r.id]={id:r.id,x:r.x,y:r.y,t:r.t,q:Math.max(r.q,c&&G.t-c.t<1800?c.q:0),side:t.side,ech:dispEch(t),dom:ts.dom,br:ts.br,sym:ts.sym,men:Math.round(t.men/50)*50,veh:t.veh,name:(c&&c.q>=1)||r.q>=1?uName(t):'',ms:t.ms,dead:!alive(t),by:r.by,cb:c&&c.cb};}}G.rq[s]=keep;
    for(var id in C){if(+id>=9e8)continue;var c2=C[id],tu=uById(+id);if(!tu||!alive(tu)){if(G.t-c2.t>600)delete C[id];else c2.dead=1;}else if(G.t-c2.t>4*3600)delete C[id];}}}
/* 目前可見（本方情報圖中，指定秒數內更新者） */
function known(side,id,age){var c=G.ct[side][id];return c&&G.t-c.t<=(age||90)?c:null;}
