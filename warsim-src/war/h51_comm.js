/* ===================== 通訊：通信單位中繼命令與情報；前線的敵情要經指揮鏈送到最高司令部 =====================
   通信單位（傳令騎兵隊、電報隊、野戰電話連、無線電通信連、中繼與數位通信連）是後方單位，不參加戰鬥：
   - 無線電的年代：上下級之間超出無線電距離時，若有本方通信單位同時在兩邊的中繼距離內，改走無線電中繼（比傳令兵快很多，也不會被截）；
   - 電報與野戰電話的年代：通信單位停留半小時以上，就在附近 25 公里內拉線，上下級不必都停留一小時也能用有線電話；
   - 只有傳令兵的年代：傳令騎兵讓附近的傳令快約六成，被截的機會減半；
   - 通信單位 5 公里內的司令部，無線電傳遞快兩成、距離 ×1.5，受干擾的影響減半。
   情報：前線看到的敵情要經指揮鏈一層層送到最高司令部，本方的戰場情報圖（地圖上的敵情、AI 的判斷）才會更新：
   - 送達時間是各層傳遞時間的總和（經通信中繼較快）；走傳令兵的路段附近有敵軍時，回報常被截而要重送，時間加倍；
   - 指揮鏈上有司令部被摧毀、正在重建時，回報卡在那一層，重建後才送上去。 */
BR.com='通信';VIA.relay='無線電中繼';
var UTRC=[
 ['cm1600','傳令騎兵隊','e1600','com','com',40,0,'','horse',14,10, 0.2,0,20,40,0, 0,0,2,2,0,2500,0.9,0,65,60,0,'u',0,'騎馬傳令：附近的傳令更快、更不容易被截'],
 ['cm1700','傳令騎兵隊','e1700','com','com',40,0,'','horse',14,10, 0.2,0,20,40,0, 0,0,2,2,0,2500,0.9,0,65,60,0,'u',0,'騎馬傳令：附近的傳令更快、更不容易被截'],
 ['cm1800','傳令騎兵隊','e1800','com','com',50,0,'','horse',15,11, 0.3,0,25,50,0, 0,0,2,2,0,2500,0.9,0,66,62,0,'u',0,'騎馬傳令與旗號：附近的傳令更快、更不容易被截'],
 ['cm1860','電報隊','e1860','com','com',60,6,'輛電報車','drawn',6,5, 0.2,0,20,40,0, 0,0,1,1.5,0,2000,1,0,64,62,0,'u',0,'架設野戰電報線：停留後附近的上下級可用電報聯絡'],
 ['cm1900','電話電報連','e1900','com','com',90,8,'輛','drawn',6,5, 0.3,0,30,60,0, 0,0,1,1.5,0,2200,1,0,64,62,0,'u',0,'架設野戰電話與電報線'],
 ['cm1914','野戰電話連','e1914','com','com',110,10,'輛','drawn',6,5, 0.3,0,30,60,0, 0,0,1,1.5,0,2200,1,0,62,62,0,'u',0,'架設野戰電話線：停留後附近 25 公里內可用有線電話'],
 ['cm1940','無線電通信連','e1940','com','com',120,20,'輛通信車','wheel',40,15, 0.3,0,30,60,0, 0.05,0,0.5,1,0,2500,1.2,0,64,62,0,'u',0,'大功率無線電台：上下級超出無線電距離時中繼'],
 ['cm1970','通信連（無線電中繼）','e1970','com','com',130,24,'輛通信車','wheel',50,20, 0.3,0,30,60,0, 0.1,0,0.5,1,0,3000,1.2,1,64,64,0,'u',0,'無線電中繼站與多路通信：延伸各級的通訊距離'],
 ['cm2000','數位通信連','e2000','com','com',120,26,'輛通信車','wheel',60,20, 0.3,0,30,60,0, 0.1,0,0.5,1,0,3000,1.2,1,66,66,0,'u',0,'數位中繼與資料鏈：抗干擾、延伸通訊距離'],
 ['cm2020','衛星與網路通信連','e2020','com','com',110,24,'輛通信車','wheel',60,20, 0.3,0,30,60,0, 0.1,0,0.5,1,0,3000,1.1,2,66,68,0,'u',0,'衛星與網狀中繼：在干擾下仍能維持通訊']];
UTRC.forEach(function(r){UTR.push(r);UT[r[0]]=utFromRow(r);});
/* 師級以上的編制附一個通信連 */
var COMT={e1600:'cm1600',e1700:'cm1700',e1800:'cm1800',e1860:'cm1860',e1900:'cm1900',e1914:'cm1914',e1940:'cm1940',e1970:'cm1970',e2000:'cm2000',e2020:'cm2020'};
var COMNB={nav:1,sub:1,air:1,uav:1,heli:1,ash:1,mon:1,drg:1};
FP.forEach(function(p){var k=COMT[p.era];if(!k||(p.ech||0)<5||!p.kids||COMNB[p.br]||p.kids.some(function(q){return COMT[p.era]===q[0];}))return;p.kids.push([k,1,UT[k].n]);});
/* 排：通信單位分成通信排 */
if(typeof PLTK!=='undefined'){PLTK.com=['通信排','通'];(function(){var b=pltInfo;pltInfo=function(k){var o=b(k),t=typeOf(k);if(o.n&&t&&t.br==='com'&&o.c!=='com')o.c='com';return o;};})();}
/* ---------- 本方的通信單位（每一步整理一次） ---------- */
var COMC={g:null,s:-1,n:-1,t:-1,L:[]};
function comUnits(side){var C=COMC;if(C.g!==G||C.s!==G.step||C.n!==G.units.length||C.t!==G.t){C.g=G;C.s=G.step;C.n=G.units.length;C.t=G.t;C.L=sAL();G.units.forEach(function(u){if(!isLeaf(u)||u.st==='dead'||u.st==='off'||!onMap(u)||u.ms==='rout'||u.side<0||u.side>=nSides())return;var s=ST(u);if(s.br!=='com'||s.dom!=='land'||u.st==='lift'||u.st==='ship')return;C.L[u.side].push(u);});}return C.L[side]||[];}
function comNear(side,x,y,R){var b=null,bd=R;comUnits(side).forEach(function(c){var d=dist(c.x,c.y,x,y);if(d<=bd){bd=d;b=c;}});return b;}
/* 兩點都在某個通信單位的範圍內 */
function comBridge(side,a,b,R,still){var best=null,bs=1e18;comUnits(side).forEach(function(c){if(still&&stillFor(c)<still)return;var d1=dist(c.x,c.y,a.x,a.y),d2=dist(c.x,c.y,b.x,b.y);if(d1<=R&&d2<=R&&d1+d2<bs){bs=d1+d2;best=c;}});return best;}
/* ---------- 上下級之間的一段：通信單位中繼 ---------- */
(function(){var bh=hopDelay;hopDelay=function(a,b,dryRun){var o=bh(a,b,dryRun);if(!a||!b||!(o.sec>0)||a.side!==b.side||a.side<0||a.side>=nSides())return o;var E=commEra(a,b),M=G.set.delayMul===undefined?1:G.set.delayMul,km=dist(a.x,a.y,b.x,b.y)/1000;
  if(o.via==='courier'){/* 經通信單位中繼或架線：比傳令快才改用 */
    if(E.radio){var R=Math.max(15,(E.rr||6)*2)*1000,c=comBridge(a.side,a,b,R),rs=(E.radio*2+(E.relay||4))*60*M;if(c&&rs<o.sec){o.via='relay';o.sec=rs;o.risk=0;o.relay=c.id;return o;}}
    if(E.wire){var c2=comBridge(a.side,a,b,25000,1800);if(c2&&5*60*M<o.sec){o.via='wire';o.sec=5*60*M;o.risk=0;o.relay=c2.id;return o;}}
    var c3=comNear(a.side,a.x,a.y,12000)||comNear(a.side,b.x,b.y,12000);if(c3){o.sec*=0.62;o.rider=c3.id;}return o;}
  if(o.via==='radio'||o.via==='digital'){if(comNear(a.side,a.x,a.y,5000)||comNear(a.side,b.x,b.y,5000)){o.sec*=0.8;o.comBoost=1;}}return o;};})();
/* 通信單位 5 公里內：無線電距離 ×1.5、干擾影響減半 */
(function(){var b=commQ;commQ=function(a,b2,E){var o=b(a,b2,E);if(a&&a.side>=0&&a.side<nSides()&&(comNear(a.side,a.x,a.y,5000)||b2&&comNear(a.side,b2.x,b2.y,5000))){o=Object.assign({},o);o.r=(o.r||1)*1.5;o.j=(o.j===undefined?1:o.j)*0.5;}return o;};})();
/* 傳令騎兵帶路：傳令被截的機會減半（見「通信」的截獲判定） */
/* ---------- 情報回報：經指揮鏈送到最高司令部 ---------- */
/* 一段路附近有敵軍（傳令兵可能被截） */
function comThreat(a,b){var n=0;gridNear((a.x+b.x)/2,(a.y+b.y)/2,dist(a.x,a.y,b.x,b.y)/2+1500,function(e){if(n||e.side===a.side||e.side<0||e.st==='dead'||!onMap(e)||uDom(e)==='air')return;var q=segDist(e.x,e.y,a.x,a.y,b.x,b.y);if(q.d<1200&&q.t>0.05&&q.t<0.95)n++;});return n>0;}
/* 回報路線：觀察者 → 各級司令部 → 最高司令部 */
function repRoute(o){var top=sideCmd(o.side)||o;if(top.id===o.id)return {sec:0,hops:[],wait:0,hold:null,top:top};var ch=chainTo(top,o).reverse(),s=0,hops=[],wait=0,hold=null,M=G.set.delayMul===undefined?1:G.set.delayMul;
  for(var i=1;i<ch.length;i++){var lo=ch[i-1],hi=ch[i],h=hopDelay(hi,lo,true),sec=h.sec;if(h.via==='courier'&&comThreat(lo,hi))sec=sec*2+600;s+=sec+(i<ch.length-1?uEra(hi).relay*60*M:0);hops.push(h.via);
    if(hi.hqLost&&hi.hqRe>G.t&&hi.id!==o.id){var w=hi.hqRe-G.t;if(w>wait){wait=w;hold=hi;}}}
  return {sec:s,hops:hops,wait:wait,hold:hold,top:top};}
(function(){var b=reportDelay;reportDelay=function(o){if(!o||o.side<0||o.side>=nSides())return b(o);if(o._rcT&&G.t-o._rcT<300)return o._rc;var R=repRoute(o),d=R.sec*0.8+R.wait;o._rc=d;o._rcT=G.t;return d;};})();
/* 聯機：回報時間的快取不必同步 */
if(typeof MPUX!=='undefined'){MPUX._rc=1;MPUX._rcT=1;}
