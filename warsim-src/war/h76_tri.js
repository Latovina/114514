/* ===================== 三方作戰：第三個由玩家或 AI 指揮的完整陣營（三方對戰，例如 3 對 3 對 3），開場與兩軍中立 =====================
   有第三方（G.sides[2]）時啟用；沒有第三方時一切照舊。各方之間的關係（G.dip）：交戰、中立、同盟，預設藍軍與紅軍交戰、第三方與兩軍中立。
   只有交戰的對象算敵軍：觀測回報、情報圖（G.ct）、射擊與突擊、防空與空戰、砲兵與航空支援、AI 都只看交戰對象；
   中立與同盟的部隊另記在 G.ctN（看得到就知道，不必經指揮鏈回報），地圖上以各方的顏色與中立的方框顯示。
   砲擊、轟炸、核武波及非交戰方的部隊會留下積怨（G.dipG）並通知雙方。AI 指揮的一方積怨夠深、本土被侵入太久，
   或看見趁火打劫的機會（交戰中的一方兵力大減、自己相對強大）就會宣戰；戰況不利時提議停火；與共同的敵人交戰時提議結盟。
   玩家在「外交」面板宣戰、提議停火或結盟、回應對方的提議（聯機時由該方的指揮官）。同盟之間共享情報；背棄同盟會失去國際聲望，官兵也會動搖。
   一方兵力崩潰就退出戰局，最後只剩一方或時間到時依分數排名。 */
var DIPK={war:'交戰',neu:'中立',ally:'同盟'};
if(typeof KINDN!=='undefined')KINDN.dip='外交';
if(typeof APDEF!=='undefined')APDEF.dip=true;
/* 第三方的開場關係：與藍軍、與紅軍 */
var TRIREL={neu:['neu','neu','與兩軍中立'],war:['war','war','與兩軍交戰（三方混戰）'],a0:['ally','war','與藍軍同盟'],a1:['war','ally','與紅軍同盟']};
function triRelInit(k){var R=TRIREL[k]||TRIREL.neu,D=[[null,'war',R[0]],['war',null,R[1]],[R[0],R[1],null]];return D;}
/* ---------- 加入第三方：補齊各方的陣列（情報圖、回報、統計、民心……），之後由兵力編成或快速想定加入部隊 ---------- */
function triPadArr(a,mk){if(!Array.isArray(a))return;while(a.length<nSides())a.push(mk());}
/* 各方的陣列（情報圖、回報、統計、民心……）：P(陣列, 建立空項目的函式) 補齊或截短 */
function triArrs(P){var z=function(){return 0;},o=function(){return {};},l=function(){return [];};
  if(!G.ct)G.ct=[];P(G.ct,o);if(!G.rq)G.rq=[];P(G.rq,l);if(!G.ctN)G.ctN=[];P(G.ctN,o);P(G.stats,stat0);
  if(G.civ){var C=G.civ;P(C.cs,civStat0);if(Array.isArray(C.rep))P(C.rep,function(){return 60;});if(C.prop)P(C.prop.mil,z);P(C.occ,z);if(C.intel){P(C.intel.n,z);P(C.intel.lie,z);}
    (C.S||[]).forEach(function(g){if(Array.isArray(g.att))P(g.att,z);});}
  ['tpSusp','cbUse','reg','cost'].forEach(function(k){if(Array.isArray(G[k]))P(G[k],k==='reg'?l:k==='cost'?o:z);});
  if(G.aw){P(G.aw.s,o);P(G.aw.cnt,o);P(G.aw.zn,l);P(G.aw.lg,o);}
  if(G.fg&&G.fg.st)P(G.fg.st,o);if(G.gm){var X=G.gm;['pc','m0','lw','tix','home','hq'].forEach(function(k){if(Array.isArray(X[k]))P(X[k],k==='pc'?function(){return {cas:0,vl:0,ck:0};}:k==='hq'?function(){return -1;}:z);});}
  if(G.zed&&G.zed.st){var Z=G.zed.st;['k','lost','turn','nk'].forEach(function(k){P(Z[k],z);});}
  if(G.tf&&G.tf.st){P(G.tf.st.k,z);P(G.tf.st.lost,z);}
  if(G.bt)(G.bt.list||[]).forEach(function(R){P(R.u,o);['men','veh','init','later','reinf'].forEach(function(k){P(R[k],z);});});
  (G.fac||[]).forEach(function(F){if(Array.isArray(F.kn))P(F.kn,function(){return -1;});if(Array.isArray(F.knT))P(F.knT,z);});
  if(G.press&&Array.isArray(G.press.home))P(G.press.home,function(){return 60;});}
function triPad(){triArrs(triPadArr);}
/* o：{name, color, edge, ai, rel}；回傳第三方 */
function triAdd(o){o=o||{};if(nSides()>=3)return G.sides[2];var S=newSide(2);if(o.name)S.name=String(o.name).slice(0,30);if(o.color)S.color=o.color;if(o.edge&&/^[NSWE]$/.test(o.edge))S.edge=o.edge;if(o.ai!==undefined)S.ai=!!o.ai;
  G.sides.push(S);G.dip=triRelInit(o.rel||'neu');G.dipV=(G.dipV||0)+1;triPad();if(typeof polGen==='function'&&G.civ&&!polSide(2).gen){polGen(2);polSide(2).gen=1;}
  logE(-1,'dip','第三方「'+S.name+'」加入戰局：'+(TRIREL[o.rel||'neu']||TRIREL.neu)[2]);return S;}
/* 第三方的兵力：依想定的部隊清單（通常取藍軍的清單、同一年代）按比例建立，部署在第三方的地圖邊 */
var TRISZ={s:[0.34,'約三分之一'],m:[0.5,'約一半'],e:[1,'與藍軍相當']};
function triForces(L,sz,gran){var k=TRISZ[sz]?sz:'m',f=TRISZ[k][0],r=mb32(hstr((G.set.seed||'')+'|tri|orbat')),F=[];
  (L||[]).forEach(function(p){var n=Math.max(1,p[1]||1);for(var i=1;i<=n;i++){var era=p[3]||null,nm=p[2]?fmtName(p[2],i):null,top=FPI[p[0]]?buildPreset(2,p[0],nm,-1,r,p[4]||gran||'co',era):UT[p[0]]?addLeaf(2,p[0],1,nm,-1,r):null;if(top){top.ix=i;F.push(top);}}});
  reix();F=triTrim(F,f);if(F.length)triDeploy(F);if(typeof renameSide==='function'){var S=G.sides[2];S.nm=Object.assign({},S.nm||{},{num:'rand'});try{renameSide(2);}catch(e){}}dupNames();return F;}
/* 第三方的地圖邊：兩軍沒用到的邊裡水面最少的一邊 */
function triEdge(){var MP=G.map,used=[G.sides[0].edge||'W',G.sides[1].edge||'E'],C=['N','S','W','E'].filter(function(e){return used.indexOf(e)<0;}),best=C[0]||'N',bw=2;
  C.forEach(function(e){var n=0,w=0;for(var i=0;i<24;i++)for(var j=0;j<6;j++){var a=(i+0.5)/24,d=(j+0.5)/6*0.2,x,y;if(e==='N'||e==='S'){x=a*MP.Wm;y=e==='N'?d*MP.Hm:MP.Hm*(1-d);}else{y=a*MP.Hm;x=e==='W'?d*MP.Wm:MP.Wm*(1-d);}n++;if(isWater(MP.lc[cellAt(x,y)]))w++;}if(w/n<bw-0.05){bw=w/n;best=e;}});return best;}
/* 第三方的部署：沿自己那一邊的中段、靠近地圖邊排開，不和另外兩方的部署帶重疊 */
function triDeploy(F){var b=landSpot;landSpot=function(e,dep,f){return b(e,Math.min(dep,0.12),0.36+(clamp(f,0.15,0.85)-0.15)/0.7*0.28);};try{autoDeploy2(2,F);}finally{landSpot=b;}}
/* 依比例縮編：從最大、但不超過剩餘差額的下級單位開始整個移除（整個編制有好幾個時也可以整個移除），每個編制至少留一個下級 */
function triTrim(F,f){if(!(f<0.99)||!F.length)return F;var wt=function(u){var s=strengthOf(u);return s.men+s.veh*8;},cur=0;F.forEach(function(u){cur+=wt(u);});var goal=cur*f,g=0;
  while(cur>goal*1.1&&g++<500){var need=cur-goal,best=null,bw=0;
    var look=function(list,drop){list.forEach(function(k){var w=wt(k);if(drop&&w<=need*1.2&&w>bw){best=k;bw=w;}if(!isLeaf(k)&&w>need*1.2)look(kidsOf(k),kidsOf(k).length>1);});};
    look(F,F.length>1);if(!best)break;var i=F.indexOf(best);if(i>=0)F.splice(i,1);delUnit(best);cur-=bw;}
  return F;}
/* 第三方的本土目標：本土裡最大的聚落 */
function triObj(){var MP=G.map,Z=triHome(2),L=[];(MP.set||[]).forEach(function(q){var x=q.x*MP.cs,y=q.y*MP.cs;if(x<Z.x0||x>Z.x1||y<Z.y0||y>Z.y1)return;L.push({q:q,x:x,y:y});});L.sort(function(a,b){return (b.q.pop||0)-(a.q.pop||0);});
  var far=function(x,y){return !(G.obj||[]).some(function(o){return dist(o.x,o.y,x,y)<3000;});},best=L.filter(function(c){return far(c.x,c.y);})[0],x,y,nm='',r=800;
  if(best){x=best.x;y=best.y;nm=best.q.name||'';r=Math.max(600,(best.q.r||400)*1.3);}
  else{/* 本土沒有合適的聚落：本土中央附近的陸地 */x=(Z.x0+Z.x1)/2;y=(Z.y0+Z.y1)/2;var ok=!isWater(MP.lc[cellAt(x,y)])&&far(x,y);for(var i=0;i<60&&!ok;i++){var a=i*2.39996,d=400+i*300,x2=clamp(x+Math.cos(a)*d,Z.x0+200,Z.x1-200),y2=clamp(y+Math.sin(a)*d,Z.y0+200,Z.y1-200);if(!isWater(MP.lc[cellAt(x2,y2)])&&far(x2,y2)){x=x2;y=y2;ok=true;}}if(!ok)return null;}
  var o={id:(G.obj||[]).reduce(function(m,q){return Math.max(m,q.id||0);},0)+1,name:nm||placeTxt(x,y),x:x,y:y,own:2,pts:10,tri:1,r:r};(G.obj=G.obj||[]).push(o);return o;}
/* 移除第三方（開戰前）：部隊一併刪除 */
function triDel(){if(nSides()<3||G.started)return false;G.units=G.units.filter(function(u){return u.side!==2;});G.sides.length=2;triArrs(function(a){if(Array.isArray(a)&&a.length>2)a.length=2;});
  G.obj=(G.obj||[]).filter(function(o){return !o.tri;});G.obj.forEach(function(o){if(o.own>=2)o.own=-1;});G.dip=null;G.dipV=(G.dipV||0)+1;['dipW','dipH','dipP','dipG','dipL','dipI','dipPT','out'].forEach(function(k){delete G[k];});if(typeof reix==='function')reix();return true;}
/* ---------- 關係 ---------- */
function relName(r){return DIPK[r]||r;}
function ctNOf(s){if(!G.ctN)G.ctN=[];while(G.ctN.length<nSides())G.ctN.push({});return G.ctN[s]||(G.ctN[s]={});}
/* 依 a 對 b 的關係，把 a 情報圖裡 b 方的接觸放到對的地方（交戰：G.ct；其他：G.ctN） */
function dipMoveCt(a,b){var C=G.ct[a],N=ctNOf(a),h=hostile(a,b),id;if(!C)return;
  if(h){for(id in N){var c=N[id];if(c.side!==b)continue;delete N[id];if(!C[id]||C[id].t<c.t)C[id]=c;}}
  else{for(id in C){var c2=C[id];if(c2.side!==b||+id>=9e8)continue;delete C[id];if(!N[id]||N[id].t<c2.t)N[id]=c2;}
    if(G.rq&&G.rq[a])G.rq[a]=G.rq[a].filter(function(r){var t=uById(r.id);return !t||t.side!==b;});}}
function everWar(a,b){var W=G.dipW;return !!(W&&W[Math.min(a,b)+'-'+Math.max(a,b)]);}
function relSet(a,b,r,why,who){if(!(a>=0&&b>=0)||a===b||a>=nSides()||b>=nSides()||!DIPK[r]||!G.dip)return false;var o=relOf(a,b);if(o===r)return false;
  G.dip[a][b]=r;G.dip[b][a]=r;G.dipV=(G.dipV||0)+1;if(r==='war'){G.dipW=G.dipW||{};G.dipW[Math.min(a,b)+'-'+Math.max(a,b)]=G.t;}
  dipMoveCt(a,b);dipMoveCt(b,a);(G.dipP||[]).forEach(function(P){if(P.st==='open'&&(P.a===a&&P.b===b||P.a===b&&P.b===a))P.st='void';});
  var A=G.sides[a].name,B=G.sides[b].name,txt=r==='war'?'⚔ '+A+'向'+B+'宣戰':r==='ally'?'🤝 '+A+'與'+B+'結盟':o==='war'?'🕊 '+A+'與'+B+'停火，轉為中立':'⚖ '+A+'與'+B+'的同盟結束，轉為中立';
  (G.dipH=G.dipH||[]).push({t:G.t,a:a,b:b,o:o,r:r,why:why||'',who:who||''});if(G.dipH.length>200)G.dipH.splice(0,G.dipH.length-200);
  logE(-1,'dip',txt+(why?'（'+why+'）':''));if(typeof decLog==='function')try{decLog(a,who||'指揮部',txt+(why?'（'+why+'）':''));}catch(e){}
  /* 背棄同盟：國際聲望下降，官兵動搖 */if(o==='ally'&&r==='war'){if(G.civ&&G.civ.rep)G.civ.rep[a]=clamp((G.civ.rep[a]===undefined?60:G.civ.rep[a])-15,0,100);G.units.forEach(function(u){if(u.side===a&&isLeaf(u)&&alive(u))u.mor=clamp(u.mor-4,0,100);if(u.side===b&&isLeaf(u)&&alive(u))u.mor=clamp(u.mor-6,0,100);});}
  if(r==='war'&&G.onPause&&apOn('dip'))G.onPause(txt);return true;}
/* 這一方有玩家指揮（整方、一部分或組隊裡的任一位指揮官）：外交由玩家決定，AI 不代為宣戰或回應提議 */
function sideHum(s){var S=SD(s);if(!S)return false;var L=S.cm||[];return !S.ai||S.pu>0||L.length>1&&L.some(function(R){return !R.ai;});}
/* ---------- 提議（停火、結盟）：AI 依局勢決定；玩家在外交面板回應，兩小時沒回應就作罷 ---------- */
var DIPPK={peace:'停火',ally:'結盟',end:'解除同盟'};
function dipPropose(a,b,k,who){if(!G.dip||a===b||!DIPPK[k]||!(a>=0&&b>=0&&a<nSides()&&b<nSides()))return null;var r=relOf(a,b);if(k==='peace'&&r!=='war'||k==='ally'&&r!=='neu'||k==='end'&&r!=='ally')return null;
  if(k==='end'){relSet(a,b,'neu','解除同盟',who);return {st:'ok'};}
  var L=G.dipP=G.dipP||[];if(L.some(function(P){return P.st==='open'&&P.a===a&&P.b===b&&P.k===k;}))return null;var P={id:(G.dipSeq=(G.dipSeq||0)+1),t:G.t,a:a,b:b,k:k,st:'open',who:who||''};L.push(P);if(L.length>60)L.splice(0,L.length-60);
  logE(a,'dip','向'+G.sides[b].name+'提議'+DIPPK[k]);logE(b,'dip','📨 '+G.sides[a].name+'提議'+DIPPK[k]+'（在外交面板回應）');if(!sideHum(b))dipAnswer(P,dipAiAccept(b,a,k),'AI');return P;}
function dipAnswer(P,yes,who){if(!P||P.st!=='open')return false;var r=relOf(P.a,P.b);if(P.k==='peace'&&r!=='war'||P.k==='ally'&&r!=='neu'){P.st='void';return false;}P.st=yes?'ok':'no';P.tA=G.t;
  if(yes)relSet(P.a,P.b,P.k==='peace'?'neu':'ally','雙方同意'+DIPPK[P.k],who);else{logE(P.a,'dip',G.sides[P.b].name+'拒絕'+DIPPK[P.k]);logE(P.b,'dip','拒絕'+G.sides[P.a].name+'的'+DIPPK[P.k]+'提議');}return true;}
function dipFind(id){return (G.dipP||[]).filter(function(P){return P.id===id;})[0]||null;}
/* 兵力（人＋車）與比例 */
function dipStr(s){var X=sideStr(s);return X;}
/* AI 是否接受：停火——自己對對方不利或同時還有其他敵人；結盟——有共同的敵人而且敵人比自己強 */
function dipAiAccept(me,o,k){var M=dipStr(me),O=dipStr(o);if(k==='peace'){var others=SIDES().filter(function(x){return x!==me&&x!==o&&hostile(me,x);}).length;return M.f<0.55||O.m>M.m*1.2||others>0&&M.m<O.m*1.6;}
  if(k==='ally'){var E=SIDES().filter(function(x){return x!==me&&x!==o&&hostile(me,x)&&hostile(o,x);});return E.some(function(x){return dipStr(x).m>M.m*0.8;});}return false;}
/* ---------- 波及與積怨：火力打到非交戰方的部隊 ---------- */
var DIPHK={fire:'火力',art:'砲擊',air:'空襲',airstrike:'空襲',nuke:'核武',aa:'防空火力',melee:'突擊',cb:'化學武器'};
function dipHurt(t,src,dm,dv,kind){var a=t.side,b=src.side,v=(dm||0)+(dv||0)*8;if(!(v>0))return;var G2=G.dipG=G.dipG||{},k=a+'>'+b;G2[k]=(G2[k]||0)+v;
  var L=G.dipL=G.dipL||{};if(G.t-(L[k]||-1e9)<1800)return;L[k]=G.t;var w=DIPHK[kind]||'火力';
  logE(a,'dip','⚠ '+G.sides[b].name+'的'+w+'波及本方'+uName(t)+'（'+placeTxt(t.x,t.y)+'）',t.x,t.y,t.id);logE(b,'dip','⚠ 本方的'+w+'波及'+(relOf(a,b)==='ally'?'盟友':'中立的')+G.sides[a].name+'部隊（'+placeTxt(t.x,t.y)+'），對方可能因此翻臉',t.x,t.y,src.id);}
(function(){var b=hit;hit=function(t,src,dm,dv,sup,kind){if(t&&src&&src.side!==t.side&&src.side>=0&&t.side>=0&&nSides()>=3&&!hostile(src.side,t.side))try{dipHurt(t,src,dm,dv,kind);}catch(e){}return b.apply(this,arguments);};})();
/* ---------- 本土：各方部署邊的縱深（地圖的三成五） ---------- */
/* 第三方的本土只算邊的中段（兩端是另外兩方的部署帶） */
function triHome(s){var MP=G.map,e=SD(s).edge||(s===1?'E':s===2?'N':'W'),f=0.35,a=s>=2?0.25:0,b=s>=2?0.75:1;
  if(e==='N'||e==='S')return {x0:MP.Wm*a,x1:MP.Wm*b,y0:e==='S'?MP.Hm*(1-f):0,y1:e==='N'?MP.Hm*f:MP.Hm};return {x0:e==='E'?MP.Wm*(1-f):0,x1:e==='W'?MP.Wm*f:MP.Wm,y0:MP.Hm*a,y1:MP.Hm*b};}
function inHome(s,x,y){var Z=triHome(s);return x>=Z.x0&&x<=Z.x1&&y>=Z.y0&&y<=Z.y1;}
/* ---------- 每小時：AI 的外交判斷、侵入本土的累計、過期的提議 ---------- */
function dipStep(){if(nSides()<3||!G.dip||!G.started)return;var h=G.step%120===61;if(!h)return;var I=G.dipI=G.dipI||{};
  /* 侵入本土：其他方的地面部隊在本土裡（非交戰、非同盟）累計時數 */
  SIDES().forEach(function(s){SIDES().forEach(function(o){if(o===s||relOf(s,o)!=='neu')return;var n=0;G.units.forEach(function(u){if(u.side===o&&isLeaf(u)&&onMap(u)&&ST(u).dom==='land'&&inHome(s,u.x,u.y)&&!inHome(o,u.x,u.y))n+=u.men+u.veh*8;});var k=s+'>'+o;
    if(n>=150){I[k]=(I[k]||0)+1;if(I[k]===1)logE(o,'dip','⚠ '+G.sides[s].name+'抗議本方部隊進入其領土（'+fmt(n)+' 人車當量），要求撤出');if(I[k]===1)logE(s,'dip','⚠ '+G.sides[o].name+'的部隊進入本方領土');}else if(I[k])I[k]=Math.max(0,I[k]-1);});});
  (G.dipP||[]).forEach(function(P){if(P.st==='open'&&G.t-P.t>7200){P.st='exp';logE(P.a,'dip',G.sides[P.b].name+'沒有回應'+DIPPK[P.k]+'的提議');}});
  SIDES().forEach(function(s){if(sideHum(s)||G.out&&G.out[s])return;dipAI(s);});}
function dipPers(s){var T=sideCmd(s),p=T&&T.pers?T.pers:null,agg=0.5;try{if(typeof aiPers==='function'){var P=aiPers(s);if(P&&P.agg!==undefined)agg=P.agg;}}catch(e){}if(p&&p.agg!==undefined)agg=p.agg;return clamp(agg,0,1);}
function dipAI(s){var M=dipStr(s),agg=dipPers(s),G2=G.dipG||{},I=G.dipI||{},hours=G.t/3600-(G.t0h||0);
  SIDES().forEach(function(o){if(o===s||G.out&&G.out[o])return;var r=relOf(s,o),O=dipStr(o),gv=G2[s+'>'+o]||0;
    if(r==='neu'||r==='ally'){var thr=(r==='ally'?900:350)*(1.4-agg*0.8);
      if(gv>=thr){relSet(s,o,'war','報復'+G.sides[o].name+'火力造成的損失');return;}
      if(r==='neu'&&(I[s+'>'+o]||0)>=3){relSet(s,o,'war',G.sides[o].name+'的部隊侵入本土不肯撤出');return;}
      /* 趁火打劫：對方正與別人交戰、兵力大減，自己相對強大 */
      if(r==='neu'&&hours>=2&&O.f<0.6&&M.m>O.m*(1.25-agg*0.4)&&SIDES().some(function(x){return x!==s&&x!==o&&hostile(o,x);})&&rnd()<0.08+agg*0.25){relSet(s,o,'war','趁'+G.sides[o].name+'兵力大減出兵');return;}}
    if(r==='war'){/* 不利就提議停火（每六小時最多一次） */var L=G.dipPT=G.dipPT||{},k=s+'>'+o;if(G.t-(L[k]||-1e9)>6*3600&&(M.f<0.45&&O.m>M.m*1.3||SIDES().some(function(x){return x!==s&&x!==o&&hostile(s,x)&&dipStr(x).m>M.m;})&&O.m>M.m*0.7)){L[k]=G.t;dipPropose(s,o,'peace','AI');}}
    if(r==='neu'){/* 共同的敵人比自己強就提議結盟 */var L2=G.dipPT=G.dipPT||{},k2=s+'~'+o;if(G.t-(L2[k2]||-1e9)>6*3600&&SIDES().some(function(x){return x!==s&&x!==o&&hostile(s,x)&&hostile(o,x)&&dipStr(x).m>M.m;})){L2[k2]=G.t;dipPropose(s,o,'ally','AI');}}});}
/* ---------- 同盟共享情報：每四步把盟友情報圖裡較新的接觸抄過來 ---------- */
function dipShare(){if(nSides()<3||!G.dip||G.step%4!==1)return;SIDES().forEach(function(a){SIDES().forEach(function(b){if(a===b||relOf(a,b)!=='ally')return;var C=G.ct[a];if(!C)return;var D=G.ct[b],N=ctNOf(b);
    for(var id in C){if(+id>=9e8)continue;var c=C[id];if(c.side===b||G.t-c.t>900)continue;var H=hostile(b,c.side)?D:N,q=H[id];if(!q||q.t<c.t){var z=Object.assign({},c);z.by=0;z.sh=a;H[id]=z;}}});});}
/* 中立與同盟接觸的清理：死亡或四小時沒看到就刪除 */
function ctNPrune(){if(!G.ctN)return;for(var s=0;s<G.ctN.length;s++){var N=G.ctN[s];for(var id in N){var c=N[id],u=uById(+id);if(!u||!alive(u)||G.t-c.t>4*3600)delete N[id];}}}
(function(){var b=reportStep;reportStep=function(){b();if(nSides()>=3){dipShare();if(G.step%20===9)ctNPrune();}};})();
/* ---------- 勝負：兵力崩潰的一方退出戰局；最後只剩一方或時間到時依分數排名 ---------- */
function triScore(side){var s=0,ow=typeof gmObjW==='function'?gmObjW():1;(G.obj||[]).forEach(function(o){if(o.own===side)s+=(o.pts||10)*ow;});if(G.gm&&G.gm.tix&&+G.set.tix>0)s+=Math.round(Math.max(0,G.gm.tix[side]||0)/5);s=Math.round(s);
  SIDES().forEach(function(o){if(o===side||!everWar(side,o)&&!hostile(side,o))return;var en=G.stats[o]||stat0(),n=SIDES().filter(function(x){return x!==o&&(everWar(x,o)||hostile(x,o));}).length||1;s+=Math.round((en.cas+en.vl*8+en.capt)/200/n);});
  var me=G.stats[side]||stat0();s-=Math.round((me.cas+me.vl*8+me.capt)/400);if(G.out&&G.out[side])s-=50;return s;}
(function(){var b=score;score=function(side){return nSides()>=3?triScore(side):b(side);};})();
function triRank(){return SIDES().slice().sort(function(a,b){var oa=G.out&&G.out[a]?1:0,ob=G.out&&G.out[b]?1:0;if(oa!==ob)return oa-ob;return score(b)-score(a);});}
(function(){var b=checkEnd;checkEnd=function(){if(nSides()<3)return b();var S=G.set,why=null,win=-1,cl=typeof gmCollapse==='function'?gmCollapse():0.15,O=G.out=G.out||{};
  SIDES().forEach(function(i){if(O[i])return;var st=sideStr(i);if(st.m0>0&&st.f<cl){O[i]=G.t;logE(-1,'end','💀 '+G.sides[i].name+'兵力崩潰，退出戰局');SIDES().forEach(function(o){if(o!==i&&relOf(i,o)!=='war')return;});}});
  var live=SIDES().filter(function(i){return !O[i];});if(live.length<=1){why=live.length?'其他各方兵力崩潰':'各方兵力崩潰';win=live.length?live[0]:-1;}
  if(S.dur&&G.t>=S.dur*3600&&!why)why='時間到';
  if(S.end==='obj'&&G.obj.length&&G.obj.every(function(o){return o.own===G.obj[0].own&&o.own>=0&&G.t-(o.tOwn||0)>=objHoldT();})){why='一方控制全部目標 '+durTxt(objHoldT());win=G.obj[0].own;}
  if(typeof gmEnd==='function'){var X=gmEnd();if(X){why=X.why;win=X.win;}}
  if(!why)return;var R=triRank();if(win<0){var a=score(R[0]),c=R.length>1?score(R[1]):-1e9;win=a>c?R[0]:-1;}
  G.over={why:why,win:win,t:G.t,score:SIDES().map(score),rank:R};btCloseAll();
  logE(-1,'end','作戰結束（'+why+'）：'+(win>=0?G.sides[win].name+'獲勝':'不分勝負')+'。名次：'+R.map(function(i,k){return (k+1)+'. '+G.sides[i].name+'（'+score(i)+' 分）';}).join('、'));if(G.onPause&&apOn('end'))G.onPause('作戰結束');};})();
/* 遊戲模式（斬首、票數、民心）：三方時讓那一方退出戰局，不直接結束 */
(function(){if(typeof gmEnd!=='function')return;var b=gmEnd;gmEnd=function(){if(nSides()<3)return b.apply(this,arguments);if(!G.started)return null;var X=G.gm,S=G.set,O=G.out=G.out||{};if(!X)return null;
  var out=function(i,why){if(O[i])return;O[i]=G.t;logE(-1,'end','💀 '+G.sides[i].name+why+'，退出戰局');};
  SIDES().forEach(function(i){if(S.decap&&X.hq&&X.hq[i]>=0){var T=uById(X.hq[i]);if(!T||!alive(T)||T.hqLost)out(i,'的最高司令部被摧毀');}
    if(+S.tix>0&&X.tix&&X.tix[i]<=0)out(i,'的兵力票數耗盡');if(+S.supLose>0&&G.press&&G.press.home&&G.press.home[i]<+S.supLose)out(i,'的後方民心崩潰，政府接受停火');});return null;};})();
/* ---------- 接線 ---------- */
(function(){var b=simStep;simStep=function(){b();if(nSides()>=3&&!G.over)dipStep();};})();
if(typeof GKEYS!=='undefined')['dip','dipV','dipW','dipH','dipP','dipSeq','dipG','dipL','dipI','dipPT','ctN','out'].forEach(function(k){if(GKEYS.indexOf(k)<0)GKEYS.push(k);});
/* 玩家的外交動作（聯機時經伺服器，只能以本方名義） */
function dipWar(me,o,why){if(!(o>=0)||o===me||o>=nSides()||relOf(me,o)==='war')return false;return relSet(me,o,'war',why||'','玩家');}
function dipAnsId(me,id,yes){var P=dipFind(+id);if(!P||P.b!==me)return false;return dipAnswer(P,!!yes,'玩家');}
/* 聯機：外交狀態送給各方（關係、紀錄與退出戰局公開；提議、積怨與領土侵入只給相關的一方） */
if(typeof mpValList==='function'){(function(){var b=mpValList;mpValList=function(s){var V=b.apply(this,arguments);if(nSides()<3)return V;var flt=function(O){if(!O||s<0)return O;var o={};for(var k in O){var p=k.split(/[>~]/);if(+p[0]===s||+p[1]===s)o[k]=O[k];}return o;};
  V.push(['dip',G.dip]);V.push(['dipV',G.dipV||0]);V.push(['dipW',G.dipW]);V.push(['dipH',G.dipH]);V.push(['out',G.out]);V.push(['dipP',(G.dipP||[]).filter(function(P){return s<0||P.a===s||P.b===s;})]);V.push(['dipG',flt(G.dipG)]);V.push(['dipI',flt(G.dipI)]);return V;};})();}
/* 聯機：房間設定為三方對戰時，快速想定加入第三方（由 AI 指揮，席位交給玩家後改由玩家指揮） */
if(typeof mpQuick==='function'){(function(){var b=mpQuick;mpQuick=async function(key,seed,tri){var g=await b(key,seed);if(tri&&typeof tri==='object'&&nSides()<3){var sc=SCN.filter(function(q){return q.k===key;})[0]||SCN[4];
  triAdd({rel:TRIREL[tri.rel]?tri.rel:'neu',ai:true,edge:triEdge()});triForces(tri.src==='B'?sc.B:sc.A,TRISZ[tri.sz]?tri.sz:'m',sc.gran||'co');triObj();dupNames();mpReset();}return g;};})();}
if(typeof MPSLOW!=='undefined')MPSLOW['sides.2']=2000;
/* 聯機的部署區：第三方只用自己那一邊的中段（與本土相同），兩端留給另外兩方 */
if(typeof mpZone==='function'){(function(){var b=mpZone;mpZone=function(side,dep){var Z=b(side,dep);if(side>=2&&nSides()>=3&&G.map){var MP=G.map;if(Z.e==='N'||Z.e==='S'){Z.x0=MP.Wm*0.25;Z.x1=MP.Wm*0.75;}else{Z.y0=MP.Hm*0.25;Z.y1=MP.Hm*0.75;}}return Z;};})();}
if(typeof MPFN!=='undefined'){MPFN.dipWar=[MPSIDE(0),function(a){return dipWar(+a[0],+a[1],String(a[2]||'').slice(0,40));}];
  MPFN.dipPropose=[MPSIDE(0),function(a){return !!dipPropose(+a[0],+a[1],String(a[2]),'玩家');}];MPFN.dipAnsId=[MPSIDE(0),function(a){return dipAnsId(+a[0],+a[1],!!a[2]);}];}
