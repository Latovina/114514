/* ===================== 戰役命名：依實際交戰的地點與地形命名——在村鎮裡以聚落為名；沿河、渡河的戰鬥以河名；在高地上以山名或標高（「321高地」）；
   在海灘稱「某某灘頭」、樹林以林名、沼澤、沙漠、雪原、平原以附近聚落加地形；升級為戰役時依整個戰場重新判定；同一地點再次發生依序稱「第二次……」 ===================== */
function bnZh(){var MP=G.map,L=(MP.set||[]).slice(0,8).map(function(s){return s.name||'';}).join('');return !L||/[㐀-鿿]/.test(L);}
function bnLbl(kind,x,y,R){var MP=G.map,best=null,bd=R;(MP.lbl||[]).forEach(function(l){if(l.k!==kind||!l.t)return;var d=dist(x,y,l.x*MP.cs,l.y*MP.cs);if(d<bd){bd=d;best=l;}});return best;}
function bnSet(x,y){var MP=G.map,best=null,bd=1e18;(MP.set||[]).forEach(function(s){if(!s.name)return;var d=dist(x,y,s.x*MP.cs,s.y*MP.cs);if(d<bd){bd=d;best=s;}});return best?{s:best,d:bd}:null;}
/* 戰場範圍內各種地形的格數 */
function bnStats(x,y,R){var MP=G.map,cs=MP.cs,c={n:0,fo:0,riv:0,sea:0,open:0,urb:0,des:0,snow:0,mar:0};
  brushCells(MP,x/cs,y/cs,Math.max(1,R/cs),function(k){var l=MP.lc[k],id=LC[l][0];c.n++;if(id==='dfor'||id==='cfor'||id==='jung')c.fo++;else if(id==='riv'||MP.rv[k]>=2)c.riv++;else if(id==='sea'||id==='shal')c.sea++;else if(isUrban(l))c.urb++;else if(id==='desert')c.des++;else if(id==='snow')c.snow++;else if(id==='marsh')c.mar++;else if(!isWater(l))c.open++;});return c;}
/* 戰場附近 700 公尺內最高、又比四周高出 30 公尺以上的點 */
function bnHill(x,y){var MP=G.map,cs=MP.cs,best=-1,be=-1e9;brushCells(MP,x/cs,y/cs,Math.max(1,700/cs),function(k){if(isWater(MP.lc[k]))return;if(MP.el[k]>be){be=MP.el[k];best=k;}});if(best<0)return null;var rel=vRel(best);if(rel<30)return null;var c=cellXY(best);return {k:best,e:be,rel:rel,x:c[0],y:c[1]};}
function btPlaceName(x,y,big){var R=big?2000:900,st=bnSet(x,y),zh=bnZh(),C=bnStats(x,y,R),sn=st?st.s.name:'',n=Math.max(1,C.n);
  /* 1. 在村鎮之內或緊鄰 */if(st){var rr=st.s.kind==='city'?1800:st.s.kind==='town'?1000:500;if(st.d<=rr)return sn;}
  /* 2. 沿河、渡河 */if(C.riv>=n*0.06){var rl=bnLbl('river',x,y,9000);if(rl)return rl.t;}
  /* 3. 高地 */var H=bnHill(x,y);if(H&&dist(H.x,H.y,x,y)<800){var ml=bnLbl('mtn',H.x,H.y,1500);if(ml)return ml.t;return zh?Math.round(H.e)+'高地':'Hill '+Math.round(H.e);}
  /* 4. 海灘 */if(C.sea>=n*0.1&&sn)return sn+(zh?'灘頭':' Beachhead');
  /* 5. 樹林 */if(C.fo>=n*0.45){var fl=bnLbl('forest',x,y,6000);if(fl)return fl.t;if(sn)return sn+(zh?'森林':' Woods');}
  /* 6. 沼澤、沙漠、雪原、平原 */if(sn){if(C.mar>=n*0.3)return sn+(zh?'沼澤':' Marshes');if(C.des>=n*0.4)return sn+(zh?'沙漠':' Desert');if(C.snow>=n*0.4)return sn+(zh?'雪原':' Snowfield');if(C.open>=n*0.55&&st.d>1500)return sn+(zh?'平原':' Plain');}
  return placeName(x,y);}
(function(){var b=btNew;btNew=function(x,y){var R=b(x,y);try{R.place=btPlaceName(x,y,false);R.name=btName(R);}catch(e){}return R;};})();
/* 升級為戰役時，依整個戰場（範圍中心、半徑 2 公里）重新判定一次 */
(function(){var b=btName;btName=function(R){if(R.tier>=2&&!R.pl2&&R.bb){R.pl2=1;try{R.place=btPlaceName((R.bb[0]+R.bb[2])/2,(R.bb[1]+R.bb[3])/2,true);}catch(e){}}return b(R);};})();
