/* ===================== 動態物資：作戰中向後方呼叫物資。範本可以預先寫好糧、彈、油的比例與噸數，以及武器的配送（武器與彈藥的比例、一代與二代武器的換裝比例、依編制補足缺額）。
   配發完全依部隊的特性：步槍、衝鋒槍、機槍、手榴彈等通用輕兵器所有地面部隊都能領（醫療單位只配個人自衛武器，平民團體不配）；其他武器只配給原本就使用同類武器的部隊
   （反戰車砲只給反戰車砲連、火砲只給砲兵、迫擊砲只給配有迫擊砲的部隊……）。武器不會讓部隊憑空多出人手：先補足編制缺額（潰散時丟棄的武器），再汰換同系列的舊型。
   每天可呼叫的補給車輛與列車有上限（可調整）；空投、直升機與運輸機用當天的空運架次。也可以開設固定的高強度補給線（陸路、鐵路或空中補給航線），每兩小時定量發出一批。
   後勤依軍種組成而不同：空降與航空兵力為主的一方運輸機、直升機架次加倍、空投較準；陸軍為主的一方有大容量卡車、較多列車與較多可呼叫的車輛 ===================== */
var WCLS={'近戰':'gen','步槍':'gen','機槍':'gen','步兵支援':'gen','反裝甲':'at','迫擊砲':'mor','火砲':'art','防空':'aa','戰車砲':'veh','艦砲':'nav','航空器':'air','無人機':'uav','奇幻':'fan'};
/* 自走砲、多管火箭與車載防空飛彈連同載具一起補充，不能單獨配發 */
var WVEH={h155:1,h155p:1,mrle:1,mrlc:1,mrlm:1,sam:1};
var WCLN={gen:'通用輕兵器',at:'反裝甲武器',atg:'反戰車砲',mor:'迫擊砲',art:'牽引火砲',aa:'防空砲',manpad:'單兵防空飛彈',uav:'無人機',fan:'奇幻武器'};
var WCLR={gen:'所有地面部隊（醫療單位只配個人自衛武器）',at:'原本配有反裝甲武器的部隊',atg:'反戰車砲部隊',mor:'配有迫擊砲的部隊',art:'砲兵',aa:'防空部隊',manpad:'配有單兵防空飛彈的部隊',uav:'無人機部隊',fan:'同類部隊'};
/* 同一系列的武器：新型可以汰換舊型 */
var WLINE=[['match','flint','rmus','brl','bolt','semi','asr1','asr2','asr3','asr'],['carb'],['smg'],['pist'],['snp'],['lmg','gpmg'],['mge','hmg','gpmg'],['gl'],['gren'],['demo'],['atr','atr2'],['atgm1','atgm2','atgm3','atgm'],['morl'],['tmor','morm'],['morh'],
  ['canl','canm','howe','rifg','qf75','h105'],['h150'],['aage','aag','aaam'],['manpad'],['uav'],['fpv','fpv2','loit'],['pike','sword'],['magic']];
/* 每件武器連同配件與備品的重量（公噸） */
var WTON={match:0.007,flint:0.007,carb:0.005,pist:0.0015,rmus:0.007,brl:0.006,bolt:0.006,semi:0.006,asr1:0.006,asr2:0.006,asr3:0.007,asr:0.006,smg:0.006,snp:0.009,mge:0.06,hmg:0.05,lmg:0.013,gpmg:0.016,gl:0.004,gren:0.0007,demo:0.01,
  atr:0.01,atr2:0.009,atgm1:0.05,atgm2:0.035,atgm3:0.03,atgm:0.035,atg:1.2,morl:0.025,morm:0.07,morh:0.45,tmor:0.12,canl:0.6,canm:1.3,howe:1.6,rifg:1,qf75:1.2,h105:2,h150:5.5,aage:2.5,aag:2.2,aaam:1,manpad:0.02,uav:0.05,fpv:0.002,fpv2:0.002,loit:0.02,pike:0.004,sword:0.003,magic:0.8};
function wcls(k){if(WVEH[k])return 'veh';if(k==='atg')return 'atg';if(k==='manpad')return 'manpad';var w=wpnOf(k);if(!w)return 'x';if(w.cat==='奇幻')return WPNO[k]&&k!=='magic'?'x':'fan';return WCLS[w.cat]||'x';}
function wIssuable(k){var c=wcls(k);return c!=='veh'&&c!=='nav'&&c!=='air'&&c!=='x';}
/* 編制的比較單位：通用輕兵器按類別（步槍、機槍……），其他按種類 */
function wGrp(k){var c=wcls(k);return c==='gen'?'g'+(wpnOf(k)||{}).cat:c;}
function wTon(k){if(WTON[k])return WTON[k];var w=wpnOf(k)||{},c=wcls(k);return c==='gen'?(w.cat==='機槍'?0.015:0.006):c==='at'?0.02:c==='mor'?0.06:c==='art'||c==='atg'?1.5:c==='aa'?2:c==='manpad'?0.02:c==='uav'?0.02:0.01;}
function wq(k){var w=wpnOf(k)||{};return ((w.pP||0)+(w.pA||0)*2)*(w.acc||1)+(w.ind||0)/50000;}
function sameLine(a,b){if(a===b)return true;if(WPNO[a]&&WPNO[b])return WLINE.some(function(L){return L.indexOf(a)>=0&&L.indexOf(b)>=0;});var A=wpnOf(a),B=wpnOf(b);return !!(A&&B&&A.cat===B.cat&&(A.crew||1)===(B.crew||1));}
/* k 是否為 x 的新型（同系列、年代較新、性能不差） */
function wNewer(k,x){var a=wpnOf(k),b=wpnOf(x);if(!a||!b||k===x||!sameLine(k,x))return false;return (a.y>b.y||a.y===b.y&&(a.gen||0)>(b.gen||0))&&wq(k)>=wq(x)*0.95;}
/* 這個單位能不能使用這種武器 */
function wFits(u,k){if(!u||!isLeaf(u)||!alive(u)||!wIssuable(k))return false;var s=ST(u);if(s.dom!=='land'||!(u.men>0)||/[RO]/.test(s.fl))return false;var c=wcls(k),w=wpnOf(k);
  if(s.fl.indexOf('D')>=0)return c==='gen'&&w.cat==='步槍'&&(w.crew||1)<=1&&k!=='snp';if(c==='gen')return true;var L=u.lg||logInit(u);return (L.w||[]).concat(L.w0||[]).some(function(x){return x[1]>0&&wcls(x[0])===c;});}
function wCnt(W,g){var n=0;(W||[]).forEach(function(x){if(wGrp(x[0])===g)n+=x[1];});return n;}
/* 編制數量；這一類原本沒有的通用輕兵器給少量自衛用（裝甲部隊的乘員只配少量長槍） */
function wAuth(u,k){var L=u.lg||logInit(u),g=wGrp(k),a=wCnt(L.w0,g);if(a>0||wcls(k)!=='gen')return a;var w=wpnOf(k)||{},s=ST(u),veh=s.mobi>=4||(s.arm||0)>=1,f={'步槍':veh?0.25:0.9,'機槍':0.03,'步兵支援':0.4,'近戰':0.9}[w.cat]||0.1;
  return Math.max(1,Math.round((u.men0||u.men)*f/Math.max(1,w.crew||1)));}
function wShort(u,k){var L=u.lg||logInit(u);return Math.max(0,wAuth(u,k)-wCnt(L.w,wGrp(k)));}
/* 可以汰換的同系列舊型（最舊的先換） */
function wOld(u,k){var L=u.lg||logInit(u),o=[];(L.w||[]).forEach(function(x){if(x[1]>0&&wNewer(k,x[0]))o.push([x[0],x[1]]);});o.sort(function(a,b){return (wpnOf(a[0]).y||0)-(wpnOf(b[0]).y||0);});return o;}
/* 本時代的制式步槍：前一代與最新一代 */
function eraRifles(){var y=G.set.y||1943;return ['match','flint','rmus','brl','bolt','semi','asr1','asr2','asr3'].filter(function(k){var w=wpnOf(k);return w&&w.y<=y;}).slice(-2);}
function eraBest(L){var y=G.set.y||1943,o=L.filter(function(k){var w=wpnOf(k);return w&&w.y<=y;});return o[o.length-1]||null;}
/* ---------- 範本 ---------- */
function stplDefault(){var R=eraRifles(),r1=R[0],r2=R[R.length-1],o=[
    {id:'need',n:'依缺額補足糧彈油',need:1,cons:0,f:{food:1,ammo:1,fuel:1},wt:0,add:[],swap:[]},
    {id:'std',n:'標準補給（糧 3：彈 5：油 2）',cons:30,f:{food:3,ammo:5,fuel:2},wt:0,add:[],swap:[]},
    {id:'ammo',n:'彈藥優先（糧 1：彈 8：油 1）',cons:30,f:{food:1,ammo:8,fuel:1},wt:0,add:[],swap:[]},
    {id:'fuel',n:'油料優先（糧 1：彈 2：油 7）',cons:30,f:{food:1,ammo:2,fuel:7},wt:0,add:[],swap:[]},
    {id:'refill',n:'補足缺額武器（依編制）與彈藥',cons:6,f:{food:0,ammo:1,fuel:0},wt:0,refill:1,add:[],swap:[]}];
  if(r2)o.push({id:'rifle',n:'新式步槍與彈藥（武器 1：彈藥 3）',cons:12,f:{food:0,ammo:1,fuel:0},wt:4,add:[[r2,1]],swap:[]});
  if(r1&&r2&&r1!==r2)o.push({id:'gen',n:'步槍換裝（'+wpnOf(r1).n.replace(/（.*）/,'')+'：'+wpnOf(r2).n.replace(/（.*）/,'')+'＝1：1）',cons:2,f:{food:0,ammo:1,fuel:0},wt:0,add:[],swap:[[r1,r2,0.5]]});
  var mg=eraBest(['mge','hmg','lmg','gpmg']),mo=eraBest(['tmor','morl']),at=eraBest(['atr','atr2','atgm2','atgm3']),yy=G.set.y||1943,atg=yy>=1937&&yy<1980?'atg':null,add=[];
  if(mg)add.push([mg,1]);if(mo)add.push([mo,1]);if(at)add.push([at,1]);if(atg)add.push([atg,3]);if(add.length>1)o.push({id:'sw',n:'支援武器（機槍、迫擊砲、反裝甲，各依部隊特性）',cons:8,f:{food:0,ammo:1,fuel:0},wt:6,add:add,swap:[]});return o;}
function stplOf(side){var S=SD(side);if(!S.stpl)S.stpl=stplDefault();return S.stpl;}
function stplGet(side,id){return stplOf(side).filter(function(t){return t.id===id;})[0]||null;}
/* ---------- 軍種組成與後勤特長 ---------- */
function lgDoct(side){var S=SD(side);if(S.ldoc==='air'||S.ldoc==='land'||S.ldoc==='mixed')return S.ldoc;if(S._dcT!==undefined&&G.t-S._dcT<3600&&S._dc)return S._dc;var air=0,arm=0,tot=0;
  G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||!alive(u))return;var s=ST(u),w=u.men+u.veh*8;if(/[RQOu]/.test(s.fl))return;tot+=w;if(s.dom==='air'||s.fl.indexOf('J')>=0)air+=w;else if(s.dom==='land'&&/^(arm|mech|mot|art|rkt|at)$/.test(s.br))arm+=w;});
  S._dcT=G.t;S._dc=!tot?'mixed':air/tot>=0.25?'air':arm/tot>=0.35?'land':'mixed';return S._dc;}
var DOCN={air:'空中機動（空降、航空兵力為主）',land:'陸軍（裝甲、機械化與砲兵為主）',mixed:'均衡'};
var DOCD={air:'運輸機與直升機的每日架次加倍、空投較準（落點損失較少）；可呼叫的卡車較少',land:'大容量卡車（載重 1.5 倍）、列車運量 1.3 倍、每日可呼叫的車輛 1.5 倍與較多列車；空運架次較少',mixed:'一般的卡車、列車與空運'};
function lgPayS(side,m){var d=lgDoct(side);return lgPay(m)*(d==='land'?(m==='truck'?1.5:m==='rail'?1.3:1):1);}
(function(){var b=lgNew;lgNew=function(side,m,n,o){var V=b(side,m,n,o);if(lgDoct(side)==='land'){if(m==='truck')V.pay*=1.5;else if(m==='rail')V.pay*=1.3;}return V;};})();
(function(){var b=lgAirPool;lgAirPool=function(side){var A=b(side),d=lgDoct(side),dm=d==='air'?2:d==='land'?0.7:1;if(A.dm===undefined)A.dm=1;if(A.dm!==dm){A.base=A.base/A.dm*dm;A.left=Math.max(0,Math.round(A.left/A.dm*dm));A.dm=dm;}return A;};})();
/* ---------- 每日可呼叫的載具 ---------- */
function calDay(){return Math.floor(G.t/86400);}
function supQDef(side){var m=lgRoadMode(),d=lgDoct(side),b=m==='truck'?60:m==='wagon'?150:400;return Math.round(b*(d==='land'?1.5:d==='air'?0.8:1));}
function supRDef(side){if(!featOn('rail'))return 0;var d=lgDoct(side);return d==='land'?3:d==='air'?1:2;}
function supQ(side){var S=SD(side),d=calDay(),Q=S.callQ||(S.callQ={max:0,rmax:0,day:d,used:0,rused:0,set:0});if(!(Q.set&1))Q.max=supQDef(side);if(!(Q.set&2))Q.rmax=supRDef(side);if(Q.day!==d){Q.day=d;Q.used=0;Q.rused=0;}return Q;}
/* ---------- 規劃：依目的地的部隊特性計算要送什麼、給誰 ---------- */
function supLeaves(dst){if(Array.isArray(dst)){var o=[],seen={};dst.forEach(function(id){supLeaves(id).forEach(function(q){if(!seen[q.id]){seen[q.id]=1;o.push(q);}});});return o;}var u=uById(dst);if(!u||!alive(u))return [];return (isLeaf(u)?[u]:leavesOf(u)).filter(function(q){return alive(q)&&onMap(q)&&ST(q).dom==='land'&&!/[RO]/.test(ST(q).fl);});}
function supNeed(u){var L=u.lg||logInit(u);return {food:Math.max(0,L.foodCap*1.2-L.food)/1000,ammo:Math.max(0,100-u.ammo)/100*L.uof*L.basic/1000,fuel:Math.max(0,L.fuelCap-L.fuel)/1000};}
function supWt(wx){return (wx.adds||[]).reduce(function(a,q){return a+q[2]*wTon(q[1]);},0)+(wx.swaps||[]).reduce(function(a,q){return a+q[3]*wTon(q[2]);},0);}
function supPlan(side,tpl,dst,opt){opt=opt||{};var L=opt.node?[]:supLeaves(dst),P={ids:L.map(function(u){return u.id;}),cons:{food:0,ammo:0,fuel:0},need:{food:0,ammo:0,fuel:0},adds:[],swaps:[],wt:0,nW:0,na:[],left:{}};
  L.forEach(function(u){var N=supNeed(u);P.need.food+=N.food;P.need.ammo+=N.ammo;P.need.fuel+=N.fuel;});var f=tpl.f||{},fs=(f.food||0)+(f.ammo||0)+(f.fuel||0)||1;
  if(tpl.need&&!opt.node&&opt.tons===undefined)['food','ammo','fuel'].forEach(function(c){P.cons[c]=(f[c]===undefined||f[c]>0)?P.need[c]:0;});
  else{var T=opt.tons!==undefined?opt.tons:(tpl.cons||0);['food','ammo','fuel'].forEach(function(c){P.cons[c]=T*(f[c]||0)/fs;});}
  if(!opt.node&&!opt.consOnly){
    /* 依編制補足缺額：每一類補回目前最多的那一型 */
    if(tpl.refill){var RQ=[];L.forEach(function(u){var Lg=u.lg||logInit(u),gs={};(Lg.w0||[]).forEach(function(x){gs[wGrp(x[0])]=1;});Object.keys(gs).forEach(function(g){var s=wCnt(Lg.w0,g)-wCnt(Lg.w,g);if(s<1)return;
        var cur=Lg.w.filter(function(x){return x[1]>0&&wGrp(x[0])===g;}),pool=(cur.length?cur:Lg.w0.filter(function(x){return wGrp(x[0])===g;})).slice().sort(function(a,b){return b[1]-a[1];}),k=pool[0]&&pool[0][0];if(k&&wFits(u,k))RQ.push([u.id,k,s]);});});
      var tw=RQ.reduce(function(a,q){return a+q[2]*wTon(q[1]);},0),sc=tpl.wt>0&&tw>tpl.wt?tpl.wt/tw:1;RQ.forEach(function(q){var n=Math.floor(q[2]*sc+1e-9);if(n>0){P.adds.push([q[0],q[1],n]);P.wt+=n*wTon(q[1]);P.nW+=n;}});
      if(!RQ.length)P.na.push(['refill','各單位的武器都已滿編']);}
    /* 增配：先補足缺額，再汰換同系列的舊型；沒有人能用的不送 */
    var shs=(tpl.add||[]).reduce(function(a,z){return a+(+z[1]||0);},0)||1;
    (tpl.add||[]).forEach(function(q){var k=q[0];if(!wpnOf(k))return;var n=Math.floor((tpl.wt||0)*(+q[1]||0)/shs/wTon(k)+1e-9);if(n<1)return;if(!wIssuable(k)){P.na.push([k,'不能單獨配發（隨載具補充）']);return;}if(typeof techOK==='function'&&!techOK(side,k)){P.na.push([k,'尚未解鎖（需要科技點數）']);P.left[k]=(P.left[k]||0)+n;return;}
      var F=L.filter(function(u){return wFits(u,k);});if(!F.length){P.na.push([k,'沒有相符的部隊（限'+WCLR[wcls(k)]+'）']);P.left[k]=(P.left[k]||0)+n;return;}
      var rem=n,S=F.map(function(u){return wShort(u,k);}),sS=S.reduce(function(a,z){return a+z;},0);
      if(sS>0)F.forEach(function(u,i){if(!S[i]||rem<1)return;var g=Math.min(rem,sS<=n?S[i]:Math.floor(n*S[i]/sS));if(g>0){P.adds.push([u.id,k,g]);rem-=g;}});
      if(rem>0){var O=F.map(function(u){return wOld(u,k);}),oT=O.map(function(o){return o.reduce(function(b,z){return b+z[1];},0);}),oS=oT.reduce(function(a,z){return a+z;},0),r0=rem;
        if(oS>0)F.forEach(function(u,i){if(!oT[i]||rem<1)return;var g=Math.min(rem,oS<=r0?oT[i]:Math.floor(r0*oT[i]/oS));O[i].forEach(function(z){if(g<1)return;var t=Math.min(z[1],g);P.swaps.push([u.id,z[0],k,t]);g-=t;rem-=t;});});}
      var used=n-rem;P.wt+=used*wTon(k);P.nW+=used;if(rem>0)P.left[k]=(P.left[k]||0)+rem;if(!used)P.na.push([k,'相符的部隊都已滿編，也沒有可汰換的舊型']);});
    /* 換裝：同一類武器依比例把舊型換成新型 */
    (tpl.swap||[]).forEach(function(q){var a=q[0],b=q[1],r=clamp(+q[2]||0,0,1),hit=0;if(!wpnOf(a)||!wpnOf(b))return;if(!wIssuable(b)){P.na.push([a+'>'+b,wpnOf(b).n+'不能單獨配發']);return;}if(typeof techOK==='function'&&!techOK(side,b)){P.na.push([a+'>'+b,wpnOf(b).n+'尚未解鎖（需要科技點數）']);return;}
      if(wGrp(a)!==wGrp(b)&&!(wcls(a)===wcls(b)&&wcls(a)!=='gen')){P.na.push([a+'>'+b,'兩者不是同一類武器，不能一對一換裝']);return;}
      L.forEach(function(u){var Lg=u.lg||logInit(u),x=Lg.w.filter(function(z){return z[0]===a;})[0];if(!x||x[1]<1||!wFits(u,b))return;var m=Math.round(x[1]*r);if(m>0){P.swaps.push([u.id,a,b,m]);P.wt+=m*wTon(b);P.nW+=m;hit++;}});
      if(!hit)P.na.push([a+'>'+b,'沒有配備'+wpnOf(a).n+'、又能使用'+wpnOf(b).n+'的部隊']);});}
  P.tons=P.cons.food+P.cons.ammo+P.cons.fuel+P.wt;return P;}
/* 把目的地的部隊依位置分成幾群（各派一支車隊），每群以最靠近中心的單位為卸貨點 */
function supClusters(L){var C=[];L.slice().sort(function(a,b){return b.men-a.men;}).forEach(function(u){var c=null,bd=3500;C.forEach(function(q){var d=dist(q.x,q.y,u.x,u.y);if(d<bd){bd=d;c=q;}});if(c){c.L.push(u);var n=c.L.length;c.x+=(u.x-c.x)/n;c.y+=(u.y-c.y)/n;}else C.push({L:[u],x:u.x,y:u.y});});
  while(C.length>6){C.sort(function(a,b){return a.L.length-b.L.length;});var s=C.shift(),t=null,bd=1e18;C.forEach(function(q){var d=dist(q.x,q.y,s.x,s.y);if(d<bd){bd=d;t=q;}});s.L.forEach(function(u){t.L.push(u);});}
  C.forEach(function(c){var b=null,bd=1e18;c.L.forEach(function(u){var d=dist(u.x,u.y,c.x,c.y);if(d<bd){bd=d;b=u;}});c.a=b;});return C;}
function supRailhead(side,x,y){var B=null,bd=1e18;nodesOf(side).forEach(function(N){if(N.k!=='rail'||!nodeOK(N))return;var d=dist(N.x,N.y,x,y);if(d<bd){bd=d;B=N;}});return B;}
function supStart(side,m,x,y){if(m==='rail')return railEdge(side,x,y);if(m==='heli'){var A=null,bd=150000;nodesOf(side).forEach(function(N){if(N.k!=='air')return;var d=dist(N.x,N.y,x,y);if(d<bd){bd=d;A=N;}});if(A)return [A.x,A.y];}return lgEdge(side,x,y);}
/* 可用的運送方式：[代號, 名稱, 可否, 說明] */
function supModes(side,dstU){var o=[],m=lgRoadMode(),AP=lgAirPool(side),Q=supQ(side),rh=dstU?supRailhead(side,dstU.x,dstU.y):null;o.push([m,LGM[m].n,Q.max-Q.used>0,'今日剩 '+(Q.max-Q.used)+'／'+Q.max+' '+LGM[m].u]);
  if(featOn('rail'))o.push(['rail','鐵路（送到最近的車站'+(rh?'「'+rh.name+'」':'')+'）',!!rh&&Q.rmax-Q.rused>0,rh?'今日剩 '+(Q.rmax-Q.rused)+'／'+Q.rmax+' 列；只運糧彈油，武器另以'+LGM[m].n+'直送':'沒有連通的本方鐵路車站']);
  if(featOn('airdrop'))o.push(['drop','空投（運輸機）',AP.left>0,'今日剩 '+AP.left+' 架次']);if(featOn('heli'))o.push(['heli','直升機運補',AP.left>0,'今日剩 '+AP.left+' 架次']);return o;}
/* ---------- 呼叫 ---------- */
function supById(id){var G2=G.sup;if(!G2)return null;for(var i=G2.calls.length-1;i>=0;i--)if(G2.calls[i].id===id)return G2.calls[i];return null;}
function supCall(side,tpl,dst,m,opt){opt=opt||{};if(!G.sup)G.sup={seq:0,calls:[],routes:[]};var G2=G.sup,node=opt.node?lgNode(side,opt.node):null,multi=Array.isArray(dst),u=node?null:uById(multi?dst[0]:dst),dn=multi&&dst.length>1?'選取的 '+dst.length+' 個單位':u?uName(u):'';
  if(opt.node&&(!node||node.status==='captured'))return {err:'補給站已失'};if(!node&&(!u||!alive(u)||!onMap(u)))return {err:'目的地不在地圖上'};
  if(!LGM[m])return {err:'不明的運送方式'};var air=!!LGM[m].air;if(m==='drop'&&!featOn('airdrop')||m==='heli'&&!featOn('heli')||m==='air'&&!featOn('airlift'))return {err:'這個時代還沒有'+LGM[m].n};
  if(m==='air'&&(!node||node.k!=='air'))return {err:'運輸機只能降落在本方機場'};if((m==='drop'||m==='heli')&&node)return {err:'空投與直升機運補只能送給部隊'};if(node&&m==='rail'&&node.k!=='rail')return {err:'鐵路只能送到車站'};
  var P=supPlan(side,tpl,dst,{node:!!node,tons:opt.tons,consOnly:opt.consOnly}),cons=P.cons.food+P.cons.ammo+P.cons.fuel;
  if(P.tons<0.05)return {err:P.na.length&&cons<0.05?'沒有相符的部隊可以接收這些武器（'+P.na.map(function(q){return q[1];}).join('；')+'）':'目的地的部隊不缺這些物資',P:P};
  var Q=supQ(side),AP=air?lgAirPool(side):null,road=lgRoadMode(),legs=[];
  if(node)legs.push({m:m,dst:{k:'node',side:side,id:node.id},x:node.x,y:node.y,c:P.cons,wx:null,grp:null,t:cons});
  else{var Lv=supLeaves(dst).filter(function(q){return P.ids.indexOf(q.id)>=0;}),wm=m;
    if(m==='rail'){var RN=supRailhead(side,u.x,u.y);if(!RN)return {err:'附近沒有連通的本方鐵路車站',P:P};if(cons>0.05)legs.push({m:'rail',dst:{k:'node',side:side,id:RN.id},x:RN.x,y:RN.y,c:P.cons,wx:null,grp:null,t:cons,rh:RN.name});wm=road;}
    var CL=supClusters(Lv),NC=CL.map(function(c){var o={food:0,ammo:0,fuel:0,men:0};c.L.forEach(function(q){var N=supNeed(q);o.food+=N.food;o.ammo+=N.ammo;o.fuel+=N.fuel;o.men+=q.men;});return o;}),tm=NC.reduce(function(a,o){return a+o.men;},0)||1;
    CL.forEach(function(c,i){var ids=c.L.map(function(q){return q.id;}),cg={food:0,ammo:0,fuel:0};if(m!=='rail')['food','ammo','fuel'].forEach(function(k){var tn=NC.reduce(function(a,o){return a+o[k];},0);cg[k]=P.cons[k]*(tn>0.001?NC[i][k]/tn:NC[i].men/tm);});
      var wx={adds:P.adds.filter(function(a){return ids.indexOf(a[0])>=0;}),swaps:P.swaps.filter(function(s){return ids.indexOf(s[0])>=0;})},t=cg.food+cg.ammo+cg.fuel+supWt(wx);
      if(t>0.01)legs.push({m:wm,dst:{k:'unit',id:c.a.id},x:c.a.x,y:c.a.y,c:cg,wx:wx.adds.length||wx.swaps.length?wx:null,grp:ids,t:t});});}
  if(!legs.length)return {err:'沒有需要運送的物資',P:P};
  legs.forEach(function(g){g.n=Math.max(1,Math.ceil(g.t/Math.max(0.0005,lgPayS(side,g.m))-1e-9));});
  /* 每日額度不足時按比例縮減，每支車隊至少一輛 */
  var fit=function(arr,rem){var tot=arr.reduce(function(a,g){return a+g.n;},0);if(tot<=rem)return;var f=rem/tot,left=rem;arr.sort(function(a,b){return b.t-a.t;}).forEach(function(g){var nn=left>=1?Math.min(left,Math.max(1,Math.floor(g.n*f))):0;g.sc=nn>0?Math.min(1,nn*lgPayS(side,g.m)/g.t):0;g.n=nn;left-=nn;});};
  var LR=legs.filter(function(g){return g.m==='rail';}),LA=legs.filter(function(g){return LGM[g.m].air;}),LT=legs.filter(function(g){return g.m!=='rail'&&!LGM[g.m].air;});
  if(LR.length&&Q.rmax-Q.rused<1)return {err:'今天可呼叫的補給列車已經用完（'+Q.rused+'／'+Q.rmax+' 列）',P:P};if(LA.length&&AP.left<1)return {err:'今天的空運架次已經用完',P:P};
  if(LT.length&&Q.max-Q.used<1)return {err:'今天可呼叫的'+LGM[road].n+'已經用完（'+Q.used+'／'+Q.max+' '+LGM[road].u+'）',P:P};
  fit(LR,Q.rmax-Q.rused);if(LA.length)fit(LA,AP.left);fit(LT,Q.max-Q.used);
  /* 增援點數模式：先付費 */if(typeof supPay==='function'){var pe=supPay(side,legs,m,opt);if(pe)return {err:pe,P:P};}
  var C={id:++G2.seq,side:side,dst:node?0:multi&&dst.length>1?dst.slice():u.id,node:node?node.id:0,tpl:tpl.n,m:m,t0:G.t,st:'go',tons:0,got:0,wg:0,n:0,nr:0,na:0,cl:0,nW:0,route:opt.route||0,rp:opt._rp||0},part=false;
  legs.forEach(function(g){if(!g.n)return;var s=g.sc===undefined?1:g.sc,sp=supStart(side,g.m,g.x,g.y);if(!sp)return;if(s<0.999)part=true;
    var V=lgNew(side,g.m,g.n,{home:{k:'edge',x:sp[0],y:sp[1]},src:{k:'edge',x:sp[0],y:sp[1]},dst:g.dst,x:sp[0],y:sp[1],ph:'in'});V.c={food:g.c.food*s,ammo:g.c.ammo*s,fuel:g.c.fuel*s,fod:0};
    if(g.wx){V.wx={adds:g.wx.adds.map(function(a){return [a[0],a[1],Math.floor(a[2]*s+1e-9)];}).filter(function(a){return a[2]>0;}),swaps:g.wx.swaps.map(function(q){return [q[0],q[1],q[2],Math.floor(q[3]*s+1e-9)];}).filter(function(q){return q[3]>0;})};
      C.nW+=V.wx.adds.reduce(function(a,q){return a+q[2];},0)+V.wx.swaps.reduce(function(a,q){return a+q[3];},0);}
    V.grp=g.grp;V.call=C.id;if(opt.route)V.route=opt.route;C.tons+=lgCargo(V)+(V.wx?supWt(V.wx):0);C.cl++;if(g.m==='rail'){C.nr+=g.n;Q.rused+=g.n;}else if(LGM[g.m].air){C.na+=g.n;AP.left-=g.n;}else{C.n+=g.n;Q.used+=g.n;}
    if(!lgLeg(V,g.x,g.y)){V.ph='wait';V.ph0='in';V.tw=G.t;}});
  if(!C.cl)return {err:'找不到可用的出發點（本方地圖邊緣到不了目的地）',P:P};G2.calls.push(C);if(G2.calls.length>120)G2.calls.splice(0,G2.calls.length-120);
  if(!opt.quiet){var veh=[C.n?C.n+' '+LGM[road].u+LGM[road].n:'',C.nr?C.nr+' 列補給列車':'',C.na?C.na+' 架'+LGM[m].n:''].filter(function(z){return z;}).join('、'),rl=legs.filter(function(g){return g.rh;})[0];
    logE(side,'log','呼叫物資「'+tpl.n+'」：'+veh+'，約 '+fmt(C.tons,C.tons<10?1:0)+' 噸'+(C.nW?'（武器 '+fmt(C.nW)+' 件）':'')+'，送往'+(node?'「'+node.name+'」':dn)+(rl?'（鐵路運到「'+rl.rh+'」車站）':'')+(part?'；今日額度不足，只送出一部分':''),node?node.x:u.x,node?node.y:u.y,u?u.id:undefined);}
  return {C:C,P:P};}
/* ---------- 送達：糧彈油依各單位的缺額分配，武器只配給相符的單位 ---------- */
function supRoom(q,c){var L=q.lg||logInit(q);if(ST(q).fl.indexOf('l')>=0)return 1e9;return c==='food'?Math.max(0,L.foodCap*1.2-L.food)/1000:c==='fuel'?Math.max(0,L.fuelCap-L.fuel)/1000:Math.max(0,100-q.ammo)/100*L.uof*L.basic/1000;}
function supPut(q,c,t){var L=q.lg||logInit(q);if(ST(q).fl.indexOf('l')>=0){L.stk=L.stk||{food:0,ammo:0,fuel:0,fod:0};L.stk[c]+=t;return;}if(c==='food')L.food+=t*1000;else if(c==='fuel')L.fuel=Math.min(L.fuelCap,L.fuel+t*1000);else{var uofT=L.uof*L.basic;if(uofT>0)q.ammo=Math.min(100,q.ammo+t*1000/uofT*100);}}
(function(){var b=lgUnloaded;lgUnloaded=function(V){if(!V.call)return b(V);var C=supById(V.call);
  if(!V.dst||V.dst.k!=='unit'){var c0=lgCargo(V),r=b(V);if(C)C.got+=Math.max(0,c0-lgCargo(V));return r;}
  var side=V.side,A=uById(V.dst.id),ids=V.grp||[V.dst.id],R=ids.map(uById).filter(function(q){return q&&alive(q)&&onMap(q)&&dist(q.x,q.y,V.x,V.y)<5000;});
  var eff=V.m==='drop'?(lgDoct(side)==='air'?0.8:0.72):1;if((V.m==='drop'||V.m==='heli')&&enemyNear(side,V.x,V.y,1000,'land')>0)eff=V.m==='heli'?0.55:0.5;var got=0;
  if(R.length)['food','ammo','fuel'].forEach(function(c){var av=V.c[c]*eff;if(av<=0)return;var rm=R.map(function(q){return supRoom(q,c);}),rs=rm.reduce(function(a,z){return a+z;},0);if(rs<=0)return;var k=Math.min(1,av/rs);
    R.forEach(function(q,i){var t=rm[i]*k;if(t>0){supPut(q,c,t);got+=t;}});V.c[c]=Math.max(0,av-rs*k)/eff;});
  var nW=0,txt=[];if(V.wx){var wf=V.m==='drop'?eff:1;
    (V.wx.adds||[]).forEach(function(a){var q=uById(a[0]),k=a[1],m=a[2];if(wf<1)m=Math.floor(m*wf+rnd8());if(!q||m<1||R.indexOf(q)<0||!wFits(q,k))return;var L=q.lg||logInit(q),x=L.w.filter(function(z){return z[0]===k;})[0];if(x)x[1]+=m;else L.w.push([k,m]);logRecalc(q);nW+=m;txt.push(uName(q)+' +'+m+' '+wpnOf(k).n);});
    (V.wx.swaps||[]).forEach(function(s){var q=uById(s[0]),a=s[1],k=s[2],m=s[3];if(wf<1)m=Math.floor(m*wf+rnd8());if(!q||m<1||R.indexOf(q)<0||!wFits(q,k))return;var L=q.lg||logInit(q),x=L.w.filter(function(z){return z[0]===a;})[0];if(!x||x[1]<1)return;m=Math.min(m,x[1]);x[1]-=m;
      L.w=L.w.filter(function(z){return z[1]>0;});var y=L.w.filter(function(z){return z[0]===k;})[0];if(y)y[1]+=m;else L.w.push([k,m]);logRecalc(q);nW+=m;txt.push(uName(q)+' '+m+' '+wpnOf(a).n+'→'+wpnOf(k).n);});}
  var S=lgStats(side);S.arr++;S.t+=got;if(V.m==='drop'||V.m==='heli')S.airT=(S.airT||0)+got;if(C){C.got+=got;C.wg+=nW;}var left=lgCargo(V);
  if(V.route){var RT=(G.sup.routes||[]).filter(function(q){return q.id===V.route;})[0];if(RT)RT.got=(RT.got||0)+got;}
  else logE(side,'log',(V.m==='drop'?'空投的':V.m==='heli'?'直升機運來的':'呼叫的')+'物資送達'+(A?uName(A)+(V.grp&&V.grp.length>1?'一帶':''):'')+'：約 '+fmt(got,got<10?1:0)+' 噸糧彈油'+(nW?'、武器 '+fmt(nW)+' 件':'')+
    (eff<0.7?'（部分落到敵方陣地或遺失）':'')+(left>0.3&&V.m!=='drop'?'；各單位已經補滿，約 '+fmt(left,1)+' 噸隨車隊返回':''),V.x,V.y,A?A.id:undefined);
  if(txt.length&&!V.route)logE(side,'log','武器配發：'+txt.slice(0,5).join('；')+(txt.length>5?'⋯等 '+txt.length+' 筆':''),V.x,V.y);
  if(V.m==='drop')LCLS.forEach(function(c){V.c[c]=0;});V.wx=null;var h=lgEnd(V.home);V.ph='ret';if(!h||!lgLeg(V,h[0],h[1]))V.ph='gone';};})();
/* 呼叫的狀態：所有車隊都卸完貨或被消滅後結案 */
function supTick(){var G2=G.sup;if(!G2)return;var act={};(G.lgv||[]).forEach(function(V){if(!V.call)return;var ph=V.ph==='hold'||V.ph==='wait'?V.ph0:V.ph;if(ph==='in'||ph==='unl'||ph==='load'||ph==='out')act[V.call]=1;});
  G2.calls.forEach(function(C){if(C.st!=='go'||act[C.id])return;C.st=C.got>0.01||C.wg>0?'done':'lost';C.t1=G.t;});}
/* ---------- 固定補給線：每兩小時發出一批（每日噸數的十二分之一） ---------- */
function supRouteAdd(side,o){if(!G.sup)G.sup={seq:0,calls:[],routes:[]};var R={id:++G.sup.seq,side:side,tpl:o.tpl||'std',dst:o.dst,m:o.m,per:Math.max(1,Math.round(+o.per||20)),last:-1e9,sent:0,got:0,n:0,skip:-1,ai:o.ai?1:0,t0:G.t};G.sup.routes.push(R);return R;}
function supRouteDst(R){if(R.dst.k==='node'){var N=lgNode(R.side,R.dst.id);return N&&N.status!=='captured'?N:null;}var u=uById(R.dst.id);return u&&alive(u)?u:null;}
function supRouteName(R){var D=supRouteDst(R);return (LGM[R.m]?LGM[R.m].n:R.m)+' → '+(D?(R.dst.k==='node'?D.name:uName(D)):'（已失）');}
function supRouteStep(){var G2=G.sup;if(!G2||!G2.routes||!G2.routes.length)return;
  G2.routes=G2.routes.filter(function(R){var D=supRouteDst(R);if(!D){logE(R.side,'lgcut','補給線「'+supRouteName(R)+'」終止：目的地已失');return false;}if(R.ai&&R.dst.k==='unit'&&G.t-R.t0>6*3600&&!supCut(D))return false;return true;});
  G2.routes.forEach(function(R){if(G.t-R.last<7200)return;R.last=G.t;var D=supRouteDst(R),T=stplGet(R.side,R.tpl)||stplOf(R.side)[1],t2={n:'補給線',f:T.need?{food:1,ammo:1,fuel:1}:T.f,cons:R.per/12,wt:0,add:[],swap:[]};
    var res=supCall(R.side,t2,R.dst.k==='unit'?R.dst.id:0,R.m,{node:R.dst.k==='node'?R.dst.id:0,tons:R.per/12,consOnly:1,quiet:1,route:R.id});
    if(res.C){R.sent+=res.C.tons;R.n++;}else if(R.skip!==calDay()){R.skip=calDay();logE(R.side,'lgcut','補給線「'+supRouteName(R)+'」本批暫停：'+res.err,D.x,D.y);}});}
/* ---------- AI：缺彈、缺油或武器缺額的團、旅呼叫物資；被切斷時改用空運，被圍超過半天時開設空中補給線 ---------- */
function supCut(g){var L=supLeaves(g.id);if(!L.length)return false;return L.filter(function(u){return (u.oos||0)>3*3600||u.besieged&&G.t-u.besieged<1800;}).length>L.length/2;}
function supAI(){SIDES().forEach(function(side){if(!SD(side).ai)return;var Q=supQ(side);
  G.units.forEach(function(g){if(g.side!==side||isLeaf(g)||!alive(g)||g.ech<2||g.ech>4||!aiControls(g))return;var Pa=g.p>=0?uById(g.p):null;if(g.ech===2&&Pa&&Pa.ech>=3&&Pa.ech<=4)return;if(G.t-(g._supT||-1e9)<4*3600)return;
    var L=supLeaves(g.id);if(L.length<2)return;var am=L.reduce(function(a,u){return a+u.ammo;},0)/L.length,fu=L.reduce(function(a,u){return a+(u.lg&&u.lg.fuelCap>0?u.lg.fuel/u.lg.fuelCap:1);},0)/L.length,
      ws=L.reduce(function(a,u){var Lg=u.lg;return a+(Lg?Math.max(0,wCnt(Lg.w0,'g步槍')-wCnt(Lg.w,'g步槍')):0);},0),wa=L.reduce(function(a,u){return a+(u.lg?wCnt(u.lg.w0,'g步槍'):0);},0),cut=supCut(g);
    var tid=am<35?'ammo':fu<0.3?'fuel':wa>0&&ws/wa>0.1?'refill':null;if(!tid)return;g._supT=G.t;var m=lgRoadMode(),AP=lgAirPool(side);
    if(cut){if(AP.left<1||!featOn('airdrop')&&!featOn('heli'))return;m=featOn('heli')&&lgDoct(side)!=='land'?'heli':featOn('airdrop')?'drop':'heli';
      if(!g._cutT)g._cutT=G.t;if(G.t-g._cutT>12*3600&&!(G.sup&&G.sup.routes.some(function(R){return R.dst.k==='unit'&&R.dst.id===g.id;}))){var men=L.reduce(function(a,u){return a+u.men;},0),per=clamp(men/1000*12,10,80);supRouteAdd(side,{tpl:'std',dst:{k:'unit',id:g.id},m:m,per:per,ai:1});
        logE(side,'log','開設空中補給線：每日約 '+fmt(per)+' 噸，'+(m==='heli'?'直升機':'運輸機空投')+'給被圍的'+uName(g),g.x,g.y,g.id);}}else{g._cutT=0;if(Q.used>=Q.max*0.85)return;}
    supCall(side,stplGet(side,tid)||stplOf(side)[0],g.id,m);});});}
/* ---------- 潰散時丟棄武器：重武器與班組武器丟得多，個人武器較少 ---------- */
function supRoutLoss(u,s){if(G.set.dynMor===false||!u.lg||!isLeaf(u)||s.dom!=='land')return;var L=u.lg,n=0;
  L.w.forEach(function(x){var w=wpnOf(x[0]);if(!w||x[1]<1||!wIssuable(x[0]))return;var f=(w.crew||1)>=2?0.1+0.15*rnd8():0.03+0.07*rnd8(),d=Math.floor(x[1]*f+rnd8());if(d>0){x[1]-=d;n+=d;}});
  if(n>0){L.w=L.w.filter(function(z){return z[1]>0;});L.wlost=(L.wlost||0)+n;logRecalc(u);}}
(function(){var b=goRout;goRout=function(u,s){b(u,s);try{supRoutLoss(u,s||ST(u));}catch(e){}};})();
(function(){var b=v8Step;v8Step=function(){b();if(G.step%20===17){supTick();supRouteStep();}if(G.step%240===97)supAI();};})();
