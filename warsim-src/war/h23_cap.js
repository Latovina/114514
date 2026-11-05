/* ===================== 道路承載：小路、鄉道、公路、高速公路的容量不同。行軍部隊、補給車隊與難民潮擠在同一路段（約 500 公尺）
   超過容量就壅塞減速；長時間壅塞的路段在尋路時成本提高，部隊與車隊會改走平行道路或野外繞行。憲兵的交通管制可提高通過量 ===================== */
/* 每 500 公尺路段在開始減速前容得下的交通量，以「車輛當量」計：一輛卡車或馬車＝1，徒步行軍約 50 人＝1，難民約 20 人＝1（扶老攜幼、推車與牲口，佔滿整個路面）。
   0＝越野：車輛可以散開，但地形也限制了能並行的數量 */
var RDCAP=[30,12,30,70,150];
var RDCAPN=['越野','單線土路，會車困難','雙線窄路','雙線主要道路','多線快速道路'];
function rdCapOf(rd){return RDCAP[rd]||RDCAP[0];}
function trfKey(x,y,rd){return Math.floor(x/500)+'|'+Math.floor(y/500)+'|'+(rd||0);}
/* 所在位置的道路等級：路徑轉角時隊伍可能稍微偏出路面，取半徑 r 格內最高等級的道路 */
function trfRd(x,y,r){var MP=G.map,k=cellAt(x,y),rd=MP.rd[k];if(rd||!r)return rd||0;var GW=MP.GW,cx=k%GW,cy=(k/GW)|0,best=0;for(var b=-r;b<=r;b++)for(var a=-r;a<=r;a++){var X=cx+a,Y=cy+b;if(X<0||Y<0||X>=GW||Y>=MP.GH)continue;var v=MP.rd[Y*GW+X];if(v>best)best=v;}return best;}
/* 最近的道路格（Rm 公尺內）：難民隊伍的位置是一大群人的中心，人潮走在附近的道路上 */
function trfSnap(x,y,Rm){var MP=G.map,k=cellAt(x,y);if(MP.rd[k])return {x:x,y:y,rd:MP.rd[k]};var GW=MP.GW,cs=MP.cs,cx=k%GW,cy=(k/GW)|0,R=Math.ceil(Rm/cs),best=null,bd=1e18;
  for(var b=-R;b<=R;b++)for(var a=-R;a<=R;a++){var X=cx+a,Y=cy+b;if(X<0||Y<0||X>=GW||Y>=MP.GH)continue;var v=MP.rd[Y*GW+X];if(!v)continue;var d=a*a+b*b;if(d<bd||d===bd&&best&&v>best.rd){bd=d;best={x:(X+0.5)*cs,y:(Y+0.5)*cs,rd:v};}}return best&&bd*cs*cs<=Rm*Rm?best:null;}
/* 加入交通量：由隊伍前端 (x,y) 沿行進方向的反方向延伸 len 公尺的縱隊，平均分到各個 500 公尺路段。
   每筆記錄 [總量, 甲方, 乙方, 部隊, 車隊, 難民]；道路等級取隊伍前端所在的道路 */
function trfAdd(L,x,y,hd,ve,len,side,cause,rd0){if(!(ve>0))return;var rd=rd0!==undefined?rd0:G.map.rd[cellAt(x,y)]||0,n=Math.max(1,Math.ceil(len/500)),c=Math.cos(hd||0),s=Math.sin(hd||0),per=ve/n;
  for(var i=0;i<n;i++){var k=trfKey(x-c*i*500,y-s*i*500,rd),q=L[k]||(L[k]=[0,0,0,0,0,0]);q[0]+=per;if(side===0||side===1)q[1+side]+=per;q[3+cause]+=per;}}
/* 每一步：行軍中的部隊與移動中的難民（補給車隊在 lgvStep 加入） */
function trfBase(){var L={};if(G.set.roadDyn===false)return L;var MP=G.map;
  G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||u.form!=='march'||!u.path||u.st==='air'||u.st==='lift'||u.st==='ship')return;var s=ST(u),rd=s.dom==='land'?trfRd(u.x,u.y,1):0;if(!rd)return;
    var men=u.men||0,veh=u.veh||0,foot=s.mobi===0,ve=men/(foot?50:200)+veh,len=Math.max(150,veh*50+men*(foot?0.8:0.1));trfAdd(L,u.x,u.y,u.hd,ve,len,u.side,0,rd);});
  if(G.civ)G.civ.R.forEach(function(Q){if(Q.st!=='go'||Q.n<20)return;var sn=trfSnap(Q.x,Q.y,800);if(!sn)return;var P=Q.path,hd=P&&Q.pi<P.length?Math.atan2(P[Q.pi+1]-Q.y,P[Q.pi]-Q.x):0;trfAdd(L,sn.x,sn.y,hd,Q.n/20,clamp(Q.n*0.6,200,6000),-1,2,sn.rd);});
  return L;}
/* 道路容量造成的速度係數（只影響道路上的速度；越野不受影響）。附近有憲兵指揮交通時容量約多五成 */
function trfJam(x,y,rd){var L=G._lgLoad;if(!L||!rd)return 0;var q=L[trfKey(x,y,rd)];return q?q[0]/rdCapOf(rd):0;}
function trfMul(u,k){var L=G._lgLoad;if(!L)return 1;var rd=G.map.rd[k]||0;if(!rd)return 1;var q=L[trfKey(u.x,u.y,rd)];if(!q)return 1;var cap=rdCapOf(rd)*(rdMP(u)?1.5:1);if(q[0]<=cap)return 1;return clamp(Math.pow(cap/q[0],0.85),0.12,1);}
/* 每 10 分鐘：持續壅塞的路段（超過容量 1.25 倍）在尋路時成本提高、前方受阻時改道；不另外減速（減速已由每一步的車流計算） */
function trfJamMark(){var MP=G.map,N=MP.GW*MP.GH,L=G._lgLoad,cs=MP.cs;if(!G.rdj||G.rdj.length!==N){G.rdj=new Uint8Array(N);G.rdjr=new Uint8Array(N);}else{G.rdj.fill(0);}var n=0;
  if(!L||G.set.roadDyn===false){G.rdjN=0;return;}
  for(var key in L){var q=L[key],p=key.split('|'),rd=+p[2];if(!rd)continue;var r=q[0]/rdCapOf(rd);if(r<1.25)continue;var f=clamp(Math.pow(1/r,0.85),0.12,1),I=Math.min(230,Math.round((1-f)/0.0036)),why=q[3]>=q[4]&&q[3]>=q[5]?7:q[4]>=q[5]?8:1;
    var x0=Math.floor(+p[0]*500/cs),x1=Math.ceil((+p[0]+1)*500/cs),y0=Math.floor(+p[1]*500/cs),y1=Math.ceil((+p[1]+1)*500/cs);
    for(var y=Math.max(0,y0);y<Math.min(MP.GH,y1);y++)for(var x=Math.max(0,x0);x<Math.min(MP.GW,x1);x++){var k=y*MP.GW+x;if(MP.rd[k]!==rd)continue;if(I>G.rdj[k]){G.rdj[k]=I;G.rdjr[k]=why;}n++;}}
  G.rdjN=n;}
(function(){var b=roadStep;roadStep=function(){b();trfJamMark();};})();
/* 單位目前所在道路的壅塞情形（面板用） */
function trfOf(u){if(!onMap(u)||ST(u).dom!=='land')return null;var k=cellAt(u.x,u.y),rd=G.map.rd[k]||0;if(!rd)return null;var r=trfJam(u.x,u.y,rd);return {rd:rd,cap:rdCapOf(rd)*(rdMP(u)?1.5:1),r:r,f:trfMul(u,k)};}
