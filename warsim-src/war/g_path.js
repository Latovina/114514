/* ===================== 路徑與通視：機動成本（地表、坡度、道路、渡河、泥濘積雪、工事）、A*、通視 ===================== */
var PF={},PFB={},PFE=0;/* 快取：PFB＝各機動類型與天候無關的越野、道路係數底稿（只在地圖整張改變時重建）；PF＝套上泥濘、積雪後的係數（只需一次乘法） */
function cellAt(x,y){var MP=G.map,cx=clamp(Math.floor(x/MP.cs),0,MP.GW-1),cy=clamp(Math.floor(y/MP.cs),0,MP.GH-1);return cy*MP.GW+cx;}
function cellXY(k){var MP=G.map,x=k%MP.GW;return [(x+0.5)*MP.cs,((k-x)/MP.GW+0.5)*MP.cs];}
function invalidatePF(){PF={};PFB={};CG={};CAC.m={};CAC.n=0;CAC.rdi=null;PFE++;G._slope=null;}
/* 快取屬於哪一張地圖：換了作戰（新的地圖物件）就整組重建，免得沿用上一場的地形 */
var PFM=null;function pfGuard(){if(PFM!==G.map){PFM=G.map;invalidatePF();if(typeof PCH!=='undefined'){PCH={};PCN=0;}}}
function slopeArr(){return G._slope||(G._slope=mapSlope(G.map));}
/* 地面狀況：泥濘、積雪會降低越野與土路速度 */
function groundMul(mobi){var E=G.env||{},mud=E.mud||0,snow=E.snow||0,frz=E.frozen?1:0;var Mm=[0.25,0.3,0.6,0.6,0.3][mobi]||0,Sm=[0.4,0.5,0.6,0.6,0.4][mobi]||0;return (1-Mm*mud*(1-0.7*frz))*(1-Sm*snow);}
var PFK=[0.03,0.04,0.07,0.06,0.045];
/* 單格底稿：越野係數（未計泥濘、積雪）、道路係數（未計泥濘）與「土路會受泥濘影響」標記 */
function pfCellB(B,k,sl,FL){var MP=G.map,mobi=B.mobi,c=MP.lc[k],rd=MP.rd[k],rl=MP.rl[k],ft0=MP.ft[k],rf=0,um=0;
  if(rd||(rl&1)){rf=rd?RD[rd][2]:0.5;if(rd&&rd<=2&&B.unp)um=1;
    /* 路面上的瓦礫、鐵絲網與鹿砦、雷區、碉堡與城牆、洪水會截斷道路 */if(c===LCI.rubble)rf*=0.3;if(ft0===2)rf*=mobi===0?0.35:0.12;else if(ft0===3)rf*=0.25;else if(ft0===4||ft0===5)rf*=0.5;else if(ft0===6)rf=0;if(FL&&FL[k])rf*=FL[k]>=3?0:0.5;}
  B.road0[k]=rf;B.um[k]=um;if(isWater(c)){B.off0[k]=0;return;}var f=LC[c][3][mobi]/(1+sl[k]*B.K);if(sl[k]>(mobi>=2?55:120))f=0;
  if(MP.rv[k])f*=fordMul(mobi,k);if(ft0===2)f*=mobi===0?0.4:0.6;else if(ft0===3)f*=0.5;else if(ft0===5)f*=mobi>=2?0.25:0.5;else if(ft0===6)f*=mobi>=2?0:0.12;else if(ft0===1&&mobi>=2)f*=0.6;if(FL&&FL[k])f*=floodMul(mobi,FL[k]);B.off0[k]=f;}
function pfBase(mobi){var fv=G.evt?G.evt.fv:0,unp=(G.set&&G.set.y||1943)<1920,key=mobi+'|'+fv+'|'+(unp?1:0),B=PFB[key];if(B)return B;
  for(var q in PFB)if(PFB[q].mobi===mobi){var B0=PFB[q];delete PFB[q];for(var pk in PF)if(PF[pk].B===B0)delete PF[pk];}
  var MP=G.map,N=MP.GW*MP.GH,sl=slopeArr(),FL=G.evt&&G.evt.fl;B={mobi:mobi,unp:unp,K:PFK[mobi],off0:new Float32Array(N),road0:new Float32Array(N),um:new Uint8Array(N),key:key+'|'+PFE,lab:null};
  for(var k=0;k<N;k++)pfCellB(B,k,sl,FL);PFB[key]=B;return B;}
function pfFor(mobi){pfGuard();var E=G.env||{},mud=E.mud||0,key=mobi+'|'+Math.round(mud*10)+'|'+Math.round((E.snow||0)*10)+'|'+(E.frozen&&mud>=0.05?'f':'')+'|'+(G.evt?G.evt.fv:0)+'|'+PFE;if(PF[key])return PF[key];
  var B=pfBase(mobi),N=B.off0.length,gm=groundMul(mobi),mf=B.unp?1-0.4*mud:1,off=B.off0,road=B.road0,k;
  if(gm!==1){off=new Float32Array(N);var o0=B.off0;for(k=0;k<N;k++)off[k]=o0[k]*gm;}
  if(mf!==1){road=new Float32Array(B.road0);var um=B.um;for(k=0;k<N;k++)if(um[k])road[k]*=mf;}
  /* 同一機動類型只留最近兩種天候的結果 */var old=[];for(var pk in PF)if(PF[pk].mobi===mobi)old.push(pk);old.sort(function(a,b){return PF[a].t0-PF[b].t0;});while(old.length>1)delete PF[old.shift()];
  PF[key]={off:off,road:road,key:key,mobi:mobi,B:B,gm:gm,mf:mf,t0:G.t};return PF[key];}
function pfLive(pf){return !!pf&&PF[pf.key]===pf;}
/* 每格通行時間陣列（依機動類型與速度快取；路況、泥濘或地圖改變時重建），供 A* 使用 */
var CAC={rdi:null,m:{},n:0};
function costArr(s,pf){if(!pf||!pf.off||s.dom!=='land')return null;if(!CAC.n)CAC.rdi=G.rdi;else if(CAC.rdi!==G.rdi)caPatch();var key=pf.key+'|'+s.vr+'|'+s.vx,A=CAC.m[key];if(A)return A;if(CAC.n>=24){for(var q in CAC.m)if(!pfLive(CAC.m[q]._pf)){delete CAC.m[q];CAC.n--;}if(CAC.n>=32){CAC.m={};CAC.n=0;CAC.rdi=G.rdi;}}
  var MP=G.map,N=MP.GW*MP.GH,cs=MP.cs,R=G.rdi,off=pf.off,road=pf.road,vr=s.vr,vx=s.vx;A=new Float32Array(N);for(var k=0;k<N;k++){var sp=road[k]?vr*road[k]*(R?1-R[k]*0.0036:1):0,so=off[k]*vx;if(so>sp)sp=so;A[k]=sp<=0.05?0:cs/(sp/3.6);}A._pf=pf;A._vr=vr;A._vx=vx;CAC.m[key]=A;CAC.n++;return A;}
/* 道路阻塞每 10 分鐘更新：只重算阻塞程度有變動的格子，不必把每一種部隊的成本陣列整張重建 */
function caPatch(){var O=CAC.rdi,R=G.rdi,MP=G.map,N=MP.GW*MP.GH,cs=MP.cs,ch=[];CAC.rdi=R;if(!O||!R||O.length!==N||R.length!==N){CAC.m={};CAC.n=0;return;}for(var k=0;k<N;k++)if(O[k]!==R[k])ch.push(k);if(!ch.length)return;if(ch.length>N/4){CAC.m={};CAC.n=0;return;}
  for(var key in CAC.m){var A=CAC.m[key],pf=A._pf,vr=A._vr,vx=A._vx;if(!pf){delete CAC.m[key];CAC.n--;continue;}for(var i=0;i<ch.length;i++){var q=ch[i],sp=pf.road[q]?vr*pf.road[q]*(1-R[q]*0.0036):0,so=pf.off[q]*vx;if(so>sp)sp=so;A[q]=sp<=0.05?0:cs/(sp/3.6);}}if(ch.length<4000)cgPatch(ch);}
/* 每格通行時間（秒／格）；0＝不可通行 */
function stepCost(s,pf,k){var MP=G.map,cs=MP.cs;if(s.dom==='sea'||s.dom==='sub'){if(!navOK(s.dr||2,k))return 0;if(s.dom==='sub'&&MP.lc[k]!==LCI.sea)return 0;return cs/(s.vx/3.6);}
  var sp=Math.max(pf.road[k]?s.vr*pf.road[k]*(G.rdi?1-Math.max(G.rdi[k],G.rdj?G.rdj[k]:0)*0.0036:1):0,pf.off[k]*s.vx);if(sp<=0.05)return 0;return cs/(sp/3.6);}
/* ---------- 動態路況 ----------
   每 10 分鐘重算：難民隊伍、泥濘中車輛輾出的車轍、彈坑與瓦礫（逐漸清除）、被淹的路段、部隊壅塞。
   受阻的路段速度最低降到原本的 8%，尋路時成本同步提高，部隊會改走野外繞行。 */
var RDWHY=['','難民潮','洪水','泥濘與車轍','彈坑與瓦礫','障礙與工事','山崩','部隊壅塞','車流超過道路容量'];
function roadStep(){var MP=G.map,N=MP.GW*MP.GH,cs=MP.cs;if(G.set.roadDyn===false){G.rdi=null;G.rdiL=null;return;}if(!G.rdd||G.rdd.length!==N)G.rdd=new Uint8Array(N);var I=new Uint8Array(N),R=new Uint8Array(N),D=G.rdd,L=[];
  function mark(x,y,r,v,why,ok){v=Math.min(255,Math.round(v));brushCells(MP,x/cs,y/cs,clamp(r/cs,1,40),function(k){if(!MP.rd[k]||ok&&!ok(k))return;if(v>I[k]){I[k]=v;R[k]=why;}});}
  for(var k=0;k<N;k++){if(D[k]){D[k]=Math.max(0,D[k]-5);if(MP.rd[k]&&D[k]>I[k]){I[k]=D[k];R[k]=4;}}}
  var FL=G.evt&&G.evt.fl;if(FL)for(k=0;k<N;k++)if(FL[k]&&MP.rd[k]){I[k]=255;R[k]=2;}
  /* 停下或受困的難民隊伍堵住道路（移動中的難民與行軍部隊算在道路承載的車流裡） */if(G.civ)G.civ.R.forEach(function(Q){if(!(Q.st==='stop'||Q.st==='trap')||Q.n<50)return;mark(Q.x,Q.y,clamp(Q.n/4,150,2500),Math.min(240,clamp(Q.n/15,40,220)*1.2),1);});
  var mud=(G.env||{}).mud||0,T={},J={};G.units.forEach(function(u){if(!onMap(u)||ST(u).dom!=='land'||u.form!=='march'||G.t-(u.movedAt||-1e9)>900)return;var key=Math.floor(u.x/500)+'|'+Math.floor(u.y/500);J[key]=(J[key]||0)+1;if(ST(u).mobi>=2)T[key]=(T[key]||0)+1+u.veh/20;});
  if(mud>0.25)for(var q in T){var p=q.split('|'),v=T[q]*mud*45;if(v>=40)mark((+p[0]+0.5)*500,(+p[1]+0.5)*500,350,Math.min(200,v),3,function(k2){return MP.rd[k2]<=2;});}
  for(k=0;k<N;k++)if(I[k]>=100&&L.length<20000)L.push(k);G.rdi=I;G.rdr=R;G.rdiL=L;roadEnemy();}
/* 彈坑：砲擊、空襲落在道路上（約數小時後被填平） */
function roadDmg(x,y,R,amt){if(G.set.roadDyn===false)return;var MP=G.map,N=MP.GW*MP.GH;if(!G.rdd||G.rdd.length!==N)G.rdd=new Uint8Array(N);var D=G.rdd;brushCells(MP,x/MP.cs,y/MP.cs,Math.max(1,R/MP.cs),function(k){if(MP.rd[k])D[k]=Math.min(255,D[k]+amt);});}
/* 封鎖：本方已知敵軍所在的路段（30 分鐘內的情報），非攻擊性的移動會繞開 */
function roadEnemy(){var MP=G.map,B=8,CW=Math.ceil(MP.GW/B),CH=Math.ceil(MP.GH/B);G.eav=SIDES().map(function(sd){var A=new Uint8Array(CW*CH),C=G.ct[sd]||{};for(var id in C){var c=C[id];if(G.t-c.t>1800||c.dom==='air'||c.dom==='sea'||c.dom==='sub')continue;var bx=Math.floor(c.x/MP.cs/B),by=Math.floor(c.y/MP.cs/B),r=Math.ceil(1200/MP.cs/B);for(var y=by-r;y<=by+r;y++)for(var x=bx-r;x<=bx+r;x++)if(x>=0&&y>=0&&x<CW&&y<CH)A[y*CW+x]=1;}return A;});G.eavW=CW;}
function roadAvoid(u){var E=G.eav&&G.eav[u.side];if(!E)return null;var o=u.ord;if(o&&/attack|storm|breakthrough|penetrate|pursue|siege|crossing|recon|persuade|landing|airdrop|airlift|joint/.test(o.k))return null;var GW=G.map.GW,CW=G.eavW;return function(k){var x=k%GW,y=(k/GW)|0;return E[(y>>3)*CW+(x>>3)]?4:1;};}
/* 前方 1.5 公里的路段嚴重受阻 → 改走野外繞行（每 15 分鐘最多重新規劃一次） */
function roadAhead(u,s){if(!G.rdi||!u.path||!u.goal||s.dom!=='land'||(G.step+u.id)%4)return false;if(G.t-(u.rrT||-1e9)<900)return false;var P=u.path,d=0,px=u.x,py=u.y,bad=0,why=0;for(var i=P.i;i<P.pts.length&&d<1500;i+=2){var x=P.pts[i],y=P.pts[i+1],L=dist(px,py,x,y),n=Math.max(1,Math.ceil(L/G.map.cs));for(var j=1;j<=n;j++){var k=cellAt(px+(x-px)*j/n,py+(y-py)*j/n),jv=G.rdj?G.rdj[k]:0;if(G.rdi[k]>=160||jv>=160){bad=k;why=G.rdi[k]>=jv?G.rdr[k]:G.rdjr[k];break;}}if(bad)break;d+=L;px=x;py=y;}
  if(!bad)return false;u.rrT=G.t;if(!u.rrLog||G.t-u.rrLog>1800){u.rrLog=G.t;var c=cellXY(bad);logE(u.side,'path',uName(u)+'前方道路因'+(RDWHY[why]||'阻塞')+'堵塞（'+placeTxt(c[0],c[1])+'），改走野外繞行',u.x,u.y,u.id);}/* 保留舊路徑直到新路徑算好（避免被誤判為已抵達） */if(!u.pq){u.pq=1;G.pq.push(u.id);}return true;}
/* A*：由 (x0,y0) 到 (x1,y1)；回傳公尺座標折線與預估秒數。
   兩層搜尋：先在 8×8 格的粗網格上找走廊（粗路線兩側各 6 塊；太窄會錯過走廊外較快的道路而繞遠路），再只在走廊內做細部 A*（找不到先放寬到 10 塊，再找不到才全圖搜尋） */
var AS={},CG={};
/* 粗網格（8×8 格一塊）：陸上部隊直接由成本陣列加總，不必逐格重算 */
function cgBlock(o,bx,by,A){var MP=G.map,GW=MP.GW,B=o.B,s=o.s,pf=o.pf,road=pf?pf.road:null,land=s.dom==='land',rv=MP.rv,lc=MP.lc,RIV=LCI.riv,sm0=0,n=0,rs=0,rn=0,tot=0,rb=0,br=0,y1=Math.min(MP.GH,by*B+B),x1=Math.min(GW,bx*B+B),P0=pf||{};
  for(var y=by*B;y<y1;y++)for(var x=bx*B;x<x1;x++){var k=y*GW+x,c=A?A[k]:stepCost(s,P0,k),isR=land&&(rv[k]||lc[k]===RIV);tot++;if(c){sm0+=c;n++;if(road&&road[k]){rs+=c;rn++;if(isR)br++;}}else if(isR)rb++;}
  var v=n>=tot*0.25?sm0/n:0;if(rb&&!br)v=0;/* 河道切過且無橋：粗網格視為不可通行 */if(rn>=B*0.5){var rv2=rs/rn*1.15;v=v?Math.min(v,rv2):rv2;}o.C[by*o.CW+bx]=v;}
function coarseGrid(s,pf){pfGuard();var MP=G.map,B=8,CW=Math.ceil(MP.GW/B),CH=Math.ceil(MP.GH/B),key=s.dom+'|'+(pf?pf.key:'e'+PFE+'|'+(G._mapv||0))+'|'+(s.dr||0)+'|'+s.vr+'|'+s.vx;if(CG[key])return CG[key];
  for(var q in CG)if(CG[q].pf&&!pfLive(CG[q].pf))delete CG[q];
  var o={B:B,CW:CW,CH:CH,C:new Float32Array(CW*CH),s:{dom:s.dom,dr:s.dr,vr:s.vr,vx:s.vx,mobi:s.mobi},pf:pf},A=pf?costArr(s,pf):null;cgFull(o,A);
  CG[key]=o;var ks=Object.keys(CG);if(ks.length>40)delete CG[ks[0]];return o;}
/* 整張粗網格一次掃描（逐列累加到各塊），結果與逐塊計算相同 */
function cgFull(o,A){var MP=G.map,GW=MP.GW,GH=MP.GH,B=o.B,CW=o.CW,NB=CW*o.CH,pf=o.pf,road=pf?pf.road:null,land=o.s.dom==='land',rv=MP.rv,lc=MP.lc,RIV=LCI.riv,P0=pf||{},
  S=new Float64Array(NB),Nn=new Int32Array(NB),RS=new Float64Array(NB),RN=new Int32Array(NB),T=new Int32Array(NB),RB=new Int32Array(NB),BR=new Int32Array(NB),b,y,x;
  for(y=0;y<GH;y++){var rowb=((y/B)|0)*CW,off=y*GW;for(x=0;x<GW;x++){var k=off+x,c=A?A[k]:stepCost(o.s,P0,k),isR=land&&(rv[k]||lc[k]===RIV);b=rowb+((x/B)|0);T[b]++;if(c){S[b]+=c;Nn[b]++;if(road&&road[k]){RS[b]+=c;RN[b]++;if(isR)BR[b]++;}}else if(isR)RB[b]++;}}
  for(b=0;b<NB;b++){var v=Nn[b]>=T[b]*0.25?S[b]/Nn[b]:0;if(RB[b]&&!BR[b])v=0;if(RN[b]>=B*0.5){var rv2=RS[b]/RN[b]*1.15;v=v?Math.min(v,rv2):rv2;}o.C[b]=v;}}
/* 變動的格子所在的粗網格塊重算 */
function cgPatch(L){if(!L||!L.length)return;var GW=G.map.GW,seen={},bl=[];for(var i=0;i<L.length;i++){var k=L[i],b=(((k/GW)|0)>>3)*100000+((k%GW)>>3);if(!seen[b]){seen[b]=1;bl.push(b);}}
  for(var q in CG){var o=CG[q];if(o.s.dom!=='land')continue;for(i=0;i<bl.length;i++){var by=(bl[i]/100000)|0,bx=bl[i]%100000;if(bx<o.CW&&by<o.CH)cgBlock(o,bx,by,null);}}}
/* 戰鬥中的地形變動（工事、彈坑、斷橋、新路）：只重算變動的格子，不必把通行係數、成本陣列與粗網格整張重建 */
function pfPatch(ks){pfGuard();var MP=G.map,N=MP.GW*MP.GH,sl=slopeArr(),FL=G.evt&&G.evt.fl,L=[],i,k;for(i=0;i<ks.length;i++){k=ks[i];if(k>=0&&k<N)L.push(k);}if(!L.length)return;
  for(var bk in PFB){var B=PFB[bk];for(i=0;i<L.length;i++){k=L[i];var ok0=B.road0[k]>0||B.off0[k]>0;pfCellB(B,k,sl,FL);if(B.lab&&ok0!==(B.road0[k]>0||B.off0[k]>0))B.lab=null;}}
  for(var pk in PF){var P=PF[pk],B1=P.B;if(P.off!==B1.off0)for(i=0;i<L.length;i++){k=L[i];P.off[k]=B1.off0[k]*P.gm;}if(P.road!==B1.road0)for(i=0;i<L.length;i++){k=L[i];P.road[k]=B1.um[k]?B1.road0[k]*P.mf:B1.road0[k];}}
  var R=CAC.rdi,cs=MP.cs;for(var ck in CAC.m){var A=CAC.m[ck],pf=A._pf,vr=A._vr,vx=A._vx;for(i=0;i<L.length;i++){k=L[i];var sp=pf.road[k]?vr*pf.road[k]*(R?1-R[k]*0.0036:1):0,so=pf.off[k]*vx;if(so>sp)sp=so;A[k]=sp<=0.05?0:cs/(sp/3.6);}}
  cgPatch(L);}
function coarsePath(cg,a,b){var CW=cg.CW,CH=cg.CH,N=CW*CH,C=cg.C,g=new Float32Array(N).fill(Infinity),from=new Int32Array(N).fill(-1),cl=new Uint8Array(N),H=new Heap(),bx=b%CW,by=(b/CW)|0,mc=1e9;for(var i=0;i<N;i++)if(C[i]&&C[i]<mc)mc=C[i];
  var D8X=[1,1,0,-1,-1,-1,0,1],D8Y=[0,1,1,1,0,-1,-1,-1],D8L=[1,1.4142,1,1.4142,1,1.4142,1,1.4142];g[a]=0;H.push(a,0);
  while(H.size()){var c=H.pop();if(c===b)break;if(cl[c])continue;cl[c]=1;var x=c%CW,y=(c/CW)|0,cc=C[c]||mc*4;for(var d=0;d<8;d++){var X=x+D8X[d],Y=y+D8Y[d];if(X<0||Y<0||X>=CW||Y>=CH)continue;var k=Y*CW+X;if(cl[k]||(!C[k]&&k!==b))continue;var ng=g[c]+(cc+(C[k]||cc))*0.5*cg.B*D8L[d];if(ng<g[k]){g[k]=ng;from[k]=c;H.push(k,ng+Math.sqrt((X-bx)*(X-bx)+(Y-by)*(Y-by))*mc*cg.B*1.2);}}}
  if(from[b]<0&&a!==b)return null;var P=[],cur=b;while(cur>=0){P.push(cur);if(cur===a)break;cur=from[cur];}return P;}
/* 可通行區：依機動類型與速度把地圖分成互相連通的區塊（4 鄰接：斜向移動也要兩側可通行，與 A* 的規則一致） */
function passComp(s,pf){var Bs=pf.B||pfBase(s.mobi);if(Bs.lab)return Bs.lab;
  var MP=G.map,GW=MP.GW,GH=MP.GH,N=GW*GH,off=Bs.off0,road=Bs.road0,ok=new Uint8Array(N);for(var k=0;k<N;k++)ok[k]=road[k]>0||off[k]>0?1:0;
  var lab=new Int32Array(N),Q=new Int32Array(N),id=0;for(var k0=0;k0<N;k0++){if(!ok[k0]||lab[k0])continue;id++;var h=0,t=0;Q[t++]=k0;lab[k0]=id;while(h<t){var c=Q[h++],x=c%GW;if(x>0&&ok[c-1]&&!lab[c-1]){lab[c-1]=id;Q[t++]=c-1;}if(x<GW-1&&ok[c+1]&&!lab[c+1]){lab[c+1]=id;Q[t++]=c+1;}if(c>=GW&&ok[c-GW]&&!lab[c-GW]){lab[c-GW]=id;Q[t++]=c-GW;}if(c<N-GW&&ok[c+GW]&&!lab[c+GW]){lab[c+GW]=id;Q[t++]=c+GW;}}}
  Bs.lab=lab;return lab;}
/* 同一區內離 k 最近的格子（逐圈往外找） */
function compNear(lab,id,k,R){var MP=G.map,GW=MP.GW,GH=MP.GH,x=k%GW,y=(k/GW)|0;for(var r=1;r<=R;r++){var best=-1,bd=1e18;for(var j=-r;j<=r;j++){for(var sd=0;sd<4;sd++){var X,Y;if(sd===0){X=x+j;Y=y-r;}else if(sd===1){X=x+j;Y=y+r;}else{if(j===-r||j===r)continue;X=sd===2?x-r:x+r;Y=y+j;}if(X<0||Y<0||X>=GW||Y>=GH)continue;var q=Y*GW+X;if(lab[q]!==id)continue;var d2=(X-x)*(X-x)+(Y-y)*(Y-y);if(d2<bd){bd=d2;best=q;}}}if(best>=0)return best;}return -1;}
function findPath(s,x0,y0,x1,y1,opt){var MP=G.map,GW=MP.GW,N=GW*MP.GH;if(s.dom==='air'){var d=dist(x0,y0,x1,y1);return {pts:[x0,y0,x1,y1],sec:d/(s.vr/3.6),km:d/1000};}
  var pf=s.dom==='land'?pfFor(s.mobi):null,a=cellAt(x0,y0),b=cellAt(x1,y1);if(!stepCost(s,pf||{},b)){var bb=nearestOK(s,pf,b,40);if(bb<0)return null;b=bb;}
  /* 目標與出發點不在同一個可通行區（大河無橋、湖泊、城牆內外）：改以同一區內最接近目標的格子為終點，
     免得走廊搜尋與全圖搜尋都白跑一趟（結果與「走到最接近處」相同，但快得多） */
  if(pf){var CP=passComp(s,pf),ca0=CP[a],cb0=CP[b];if(ca0>0&&cb0!==ca0){var nb=compNear(CP,ca0,b,Math.max(MP.GW,MP.GH));if(nb>=0){b=nb;var bc=cellXY(b);x1=bc[0];y1=bc[1];}}}
  if(!(opt&&opt.full)){var cg=coarseGrid(s,pf),B=cg.B,CW=cg.CW,ca=((a/GW|0)/B|0)*CW+((a%GW)/B|0),cb=((b/GW|0)/B|0)*CW+((b%GW)/B|0);if(ca!==cb){var cp=coarsePath(cg,ca,cb);if(cp){var mask=new Uint8Array(CW*cg.CH),cr=(opt&&opt.cr)||6;cp.forEach(function(q){var qx=q%CW,qy=(q/CW)|0;for(var dy=-cr;dy<=cr;dy++)for(var dx=-cr;dx<=cr;dx++){var X=qx+dx,Y=qy+dy;if(X>=0&&Y>=0&&X<CW&&Y<cg.CH)mask[Y*CW+X]=1;}});
        var R=fineAstar(s,pf,a,b,x0,y0,x1,y1,opt,{m:mask,B:B,CW:CW});if(R)return R;var m2=new Uint8Array(CW*cg.CH);cp.forEach(function(q){var qx=q%CW,qy=(q/CW)|0;for(var dy=-10;dy<=10;dy++)for(var dx=-10;dx<=10;dx++){var X=qx+dx,Y=qy+dy;if(X>=0&&Y>=0&&X<CW&&Y<cg.CH)m2[Y*CW+X]=1;}});R=fineAstar(s,pf,a,b,x0,y0,x1,y1,opt,{m:m2,B:B,CW:CW});if(R)return R;}}}
  /* 走廊外的全圖搜尋（目標可能無法抵達）：限制展開格數，回傳最接近目標的部分路線 */
  return fineAstar(s,pf,a,b,x0,y0,x1,y1,Object.assign({partial:true},opt||{},{max:Math.min((opt&&opt.max)||N,90000)}),null);}
/* 直線可通行（短距離移動不必搜尋） */
function lineOK(s,x0,y0,x1,y1){if(s.dom==='air')return true;var MP=G.map,pf=s.dom==='land'?pfFor(s.mobi):{},d=dist(x0,y0,x1,y1),n=Math.ceil(d/(MP.cs*0.5));for(var i=1;i<=n;i++){var t=i/n,k=cellAt(x0+(x1-x0)*t,y0+(y1-y0)*t);if(!stepCost(s,pf,k))return false;}return true;}
function fineAstar(s,pf,a,b,x0,y0,x1,y1,opt,M){var MP=G.map,GW=MP.GW,GH=MP.GH,N=GW*GH;
  if(!AS.g||AS.g.length!==N){AS.g=new Float32Array(N).fill(Infinity);AS.f=new Int32Array(N).fill(-1);AS.cl=new Uint8Array(N);AS.touch=[];}
  var g=AS.g,from=AS.f,cl=AS.cl,touch=AS.touch,P0=pf||{},minC=MP.cs/(Math.max(s.vr,s.vx)/3.6),bx=b%GW,by=(b/GW)|0,H=AS.H||(AS.H=new THeap(8192)),cnt=0,maxN=(opt&&opt.max)||N,avoid=opt&&opt.avoid,wH=(opt&&opt.w)||0.98,mk=M?M.m:null,MB=M?M.B:1,MCW=M?M.CW:1;
  var D8X=[1,1,0,-1,-1,-1,0,1],D8Y=[0,1,1,1,0,-1,-1,-1],D8L=[1,1.4142,1,1.4142,1,1.4142,1,1.4142],CA=costArr(s,pf);
  for(var i=0;i<touch.length;i++){g[touch[i]]=Infinity;from[touch[i]]=-1;cl[touch[i]]=0;}touch.length=0;H.n=0;g[a]=0;touch.push(a);H.push(a,0);var found=false;
  var part=opt&&opt.partial,bestK=a,bestH=1e18;
  while(H.size()){var c=H.pop();if(c===b){found=true;break;}if(cl[c])continue;cl[c]=1;if(++cnt>maxN)break;var x=c%GW,y=(c/GW)|0,gc=g[c];if(part){var hh=(x-bx)*(x-bx)+(y-by)*(y-by);if(hh<bestH){bestH=hh;bestK=c;}}
    for(var d8=0;d8<8;d8++){var X=x+D8X[d8],Y=y+D8Y[d8];if(X<0||Y<0||X>=GW||Y>=GH)continue;if(mk&&!mk[(Y>>3)*MCW+(X>>3)])continue;var k=Y*GW+X;if(cl[k])continue;var sc=CA?CA[k]:stepCost(s,P0,k);if(!sc)continue;
      if(d8&1){var k1=y*GW+X,k2=Y*GW+x;if(CA?(!CA[k1]||!CA[k2]):(!stepCost(s,P0,k1)||!stepCost(s,P0,k2)))continue;}
      var ng=gc+sc*D8L[d8]*(avoid?avoid(k):1);if(ng<g[k]){if(g[k]===Infinity)touch.push(k);g[k]=ng;from[k]=c;var hx=X>bx?X-bx:bx-X,hy=Y>by?Y-by:by-Y,h=(hx+hy-0.5858*(hx<hy?hx:hy))*minC;H.push(k,ng+h*wH);}}}
  if(!found){if(!part||bestK===a)return null;b=bestK;x1=cellXY(b)[0];y1=cellXY(b)[1];}var cells=[],cur=b;while(cur>=0){cells.push(cur);if(cur===a)break;cur=from[cur];}cells.reverse();
  var pts=[x0,y0];for(i=1;i<cells.length-1;i++){var p=cellXY(cells[i]);pts.push(p[0],p[1]);}var pe=b===cellAt(x1,y1)?[x1,y1]:cellXY(b);pts.push(pe[0],pe[1]);
  pts=dropCollinear(pts);return {pts:pts,sec:g[b],km:plLen(pts)/1000};}
function nearestOK(s,pf,k,R){var MP=G.map,GW=MP.GW,x=k%GW,y=(k/GW)|0,P=pf||{},res=-1;for(var r=1;r<=R&&res<0;r++)ringRow(x,y,r,GW,MP.GH,function(X,Y){var q=Y*GW+X;if(!stepCost(s,P,q))return false;res=q;return true;});return res;}
function dropCollinear(P){if(P.length<=6)return P;var o=[P[0],P[1]];for(var i=2;i<P.length-2;i+=2){var ax=P[i]-o[o.length-2],ay=P[i+1]-o[o.length-1],bx=P[i+2]-P[i],by=P[i+3]-P[i+1];if(Math.abs(ax*by-ay*bx)>1e-6)o.push(P[i],P[i+1]);}o.push(P[P.length-2],P[P.length-1]);return o;}
/* ---------- 通視：沿線取樣，地形＋植被／建物高度遮蔽；地球曲率 ---------- */
/* 地物遮蔽高度：樹林、城市整片擋住視線；樹籬、果園、村落、郊區等零散地物只算一部分高度（之間有空隙，雜亂程度另由觀測者所在地形與目標隱蔽計算） */
var LCPOR={scrub:0.6,orch:0.5,hedge:0.4,vill:0.5,town:0.8,ind:0.8,rubble:0.7,sub:0.5,park:0.5,port:0.7,rly:0.3},LCH=null;
function hAt(k,self){var MP=G.map,c=MP.lc[k],e=Math.max(0,MP.el[k]);if(self)return e;if(!LCH)LCH=LC.map(function(r){return r[6]*(LCPOR[r[0]]||1);});return e+LCH[c];}
/* 觀測者附近（losR 以內）的地物不算遮蔽：部隊散布在陣地四周；看不到時，觀察員還可以朝目標方向前出 losF（約 250 公尺）到稜線前緣（軍事稜線）往下看 */
function losR(){return Math.max(G.map.cs*1.5,120);}
function losF(){return Math.max(G.map.cs*2,250);}
function los1(x0,y0,h0,x1,y1,h1,rl){var MP=G.map,d=dist(x0,y0,x1,y1);if(d<rl)return true;var ka=cellAt(x0,y0),kb=cellAt(x1,y1),e0=Math.max(0,MP.el[ka])+h0,e1=Math.max(0,MP.el[kb])+h1,n=Math.min(80,Math.ceil(d/(MP.cs*0.9))),Rm=(G.map.R||6371)*1000*1.33;
  for(var i=1;i<n;i++){var t=i/n,x=x0+(x1-x0)*t,y=y0+(y1-y0)*t,k=cellAt(x,y);if(k===ka||k===kb||t*d<rl)continue;var line=e0+(e1-e0)*t-(t*d)*((1-t)*d)/(2*Rm);if(hAt(k)>line)return false;}return true;}
function los(x0,y0,h0,x1,y1,h1){var d=dist(x0,y0,x1,y1),rl=losR();if(d<rl||los1(x0,y0,h0,x1,y1,h1,rl))return true;var f=losF();if(d<f*1.6)return false;var t=f/d;return los1(x0+(x1-x0)*t,y0+(y1-y0)*t,h0,x1,y1,h1,G.map.cs*1.5);}
