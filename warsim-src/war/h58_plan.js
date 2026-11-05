/* ===================== 作戰計畫：事先排好一連串行動，部隊收到後自行依條件逐步執行，中途可以修正 =====================
   一、玩家在介面上排好每個單位的步驟（草稿 u.pdr，聯機時隨部隊同步給隊友），按「下達計畫」整份送出：只走一次指揮鏈（開戰前或部隊尚未進場時立即收到）。
   二、部隊收到後（u.pln）依每一步的開始條件自行執行：前一步完成（可再等幾分鐘）、指定時間、收到暗號、配合友軍的某一步完成（加上回報時間）、兵力低於某比例、接敵。
       事先簡報過的步驟，部隊準備與參謀規劃只要平常的三成左右。
   三、中途修正：改好草稿再送一次「計畫修正」（同樣經指揮鏈）；已完成的步驟保留，正在執行的步驟若內容改了就重新執行。
       暗號只是短訊，經指揮鏈送達後，等待這個暗號的步驟立即開始。
   四、計畫步驟是玩家的命令：被遭遇戰、後撤等打斷時由「恢復命令」接回；玩家另外直接下令則計畫中止（可再「繼續計畫」）。 */
var PLC=['甲','乙','丙','丁','戊','己'],PLTR={prev:'前一步完成後',time:'指定時間',code:'收到暗號',sync:'配合友軍',str:'兵力低於',cont:'接敵時'};
var PLNO=/^(plan|code|refuse|twd|eager|rejoin|waitx|civ|fuelrun)$/,PLDN=/^(bombard|smoke|sat|carpet|msl|strike|bomb|bombzone|build|xsite|breach|bridge|demolish|roadfix|roadbuild|railcut|railfix|gather|craft|nuke|facdemo|repair|refuel|refit)$/;
Object.assign(ORDN,{plan:'作戰計畫',code:'暗號'});
/* 計畫步驟的格式檢查（伺服器收到的計畫也經過這裡） */
function plSan(sq){if(!Array.isArray(sq))return null;var out=[],seen={};for(var i=0;i<sq.length&&out.length<24;i++){var S=sq[i];if(!S||typeof S!=='object')continue;var k=String(S.k||''),id=Math.round(+S.id);
    if(!(id>0)||seen[id]||PLNO.test(k)||ORDN[k]===undefined)continue;seen[id]=1;var p=S.p&&typeof S.p==='object'&&!Array.isArray(S.p)?S.p:{},j;try{j=JSON.stringify(p);}catch(e){continue;}if(j.length>20000)continue;p=JSON.parse(j);
    ['x','y','face','r','dur','Y','x1','y1'].forEach(function(f){if(p[f]!==undefined&&!isFinite(+p[f]))delete p[f];else if(p[f]!==undefined)p[f]=+p[f];});delete p.oid;delete p.pl;delete p.ps;delete p.pst;delete p.st;
    var T=S.tr&&typeof S.tr==='object'?S.tr:{},tk=PLTR[T.k]?T.k:'prev',tr={k:tk,w:clamp(+T.w||0,0,1440)};
    if(tk==='time')tr.t=Math.max(0,+T.t||0);if(tk==='code')tr.c=PLC.indexOf(T.c)>=0?T.c:PLC[0];if(tk==='sync'){tr.u=Math.round(+T.u)||0;tr.s=Math.round(+T.s)||0;}if(tk==='str')tr.pc=clamp(+T.pc||50,5,95);if(tk==='cont')tr.d=clamp(+T.d||2000,200,20000);
    out.push({id:id,k:k,p:p,tr:tr});}return out;}
function plIdx(P,id){for(var i=0;i<P.sq.length;i++)if(P.sq[i].id===id)return i;return -1;}
function plFirstOpen(P){for(var i=0;i<P.sq.length;i++)if(P.done[P.sq[i].id]===undefined)return i;return P.sq.length;}
function plSig(S){return JSON.stringify([S.k,S.p]);}
/* ---------- 玩家：下達、修正、取消（聯機時由伺服器執行） ---------- */
function planSend(u,sq,v){if(!u||!alive(u))return {err:'找不到這個部隊。'};var S=plSan(sq);if(!S)return {err:'計畫格式錯誤。'};v=Math.max(1,Math.round(+v||1));
  if(!G.started||!G.step||u.st==='off'){plInstall(u,{sq:S,v:v,stop:!S.length},true);return {sec:0,pre:1};}
  var r=issue(u,'plan',{sq:S,v:v,stop:S.length?undefined:1});u.plS={v:v,eta:G.t+(r&&r.sec||0),stop:S.length?0:1};return {sec:r&&r.sec||0};}
function planStop(u){var v=Math.max(u&&u.pln?u.pln.v+1:1,u&&u.pdr?u.pdr.v||1:1);return planSend(u,[],v);}
/* ---------- 部隊收到計畫 ---------- */
function plInstall(u,o,pre){var sq=plSan(o.sq)||[],old=u.pln,v=Math.max(1,+o.v||1);if(u.plS&&u.plS.v<=v)u.plS=null;
  if(old&&old.v>v)return;/* 比手上的更舊的版本晚到：不理會 */
  if(!sq.length||o.stop){if(old&&old.ph==='run'){old.ph='stop';old.v=v;logE(u.side,'opn',uName(u)+'收到命令：取消作戰計畫，繼續執行目前的行動',u.x,u.y,u.id);}return;}
  var N={v:v,sq:sq,cur:-1,ph:'run',ts:G.t,t0:G.t,done:{},codes:{},syd:{}},restart=-1;
  if(old&&old.sq){N.codes=old.codes||{};Object.keys(old.done||{}).forEach(function(id){if(plIdx(N,+id)>=0)N.done[id]=old.done[id];});
    var cs=old.cur>=0?old.sq[old.cur]:null;if(cs&&old.ph==='run'){var j=plIdx(N,cs.id);if(j>=0){N.cur=j;N.ts=old.ts;if(N.done[cs.id]===undefined&&plSig(N.sq[j])!==plSig(cs))restart=j;}else N.cur=plFirstOpen(N)-1;}
    else N.cur=plFirstOpen(N)-1;}
  u.pln=N;logE(u.side,'opn',uName(u)+(pre?'在作戰前收到作戰計畫':old?'收到作戰計畫的修正':'收到作戰計畫')+'（'+sq.length+' 個步驟'+(old&&N.cur>=0?'，從第 '+(Math.min(restart>=0?restart:N.cur+1,sq.length-1)+1)+' 步繼續':'')+'）',u.x,u.y,u.id);
  if(G.started&&G.step){if(restart>=0)plStart(u,N,restart,'修正後重新執行');else plTick(u);}}
/* ---------- 步驟開始：事先簡報過，部隊準備與參謀規劃只要平常的三成 ---------- */
function plOrd(u,S){var k=S.k,p=JSON.parse(JSON.stringify(S.p||{}));if(k==='ambush'||k==='delay'||k==='holdfast'){p.opt=Object.assign({},p.opt||{},{post:k});if(k==='ambush')p.opt.roe=p.opt.roe||'close';if(k==='delay')p.opt.maxb=p.opt.maxb||4;p.dk=k;k='defend';}
  if(k==='support'&&p.sup===undefined&&p.x===undefined)p.sup=u.p>=0?u.p:u.id;var o=newOrder(k,p);o.pl=1;o.ps=S.id;o.pst=u.id+':'+S.id;return o;}
function plStart(u,P,i,why){var S=P.sq[i];P.cur=i;P.ts=G.t;var o=plOrd(u,S);
  logE(u.side,'opn',uName(u)+(why?why+'計畫':'依計畫開始')+'第 '+(i+1)+' 步：'+ordN(o)+(o.x!==undefined?'（'+placeTxt(o.x,o.y)+'）':''),u.x,u.y,u.id);
  var M=G.set.delayMul;G.set.delayMul=(M===undefined?1:M)*(isLeaf(u)?0.3:0.35);try{receiveOrder(u,o);}finally{if(M===undefined)delete G.set.delayMul;else G.set.delayMul=M;}}
/* ---------- 步驟完成 ---------- */
function plOrdDone(u,o){if(o.st==='done')return true;var k=o.k;if(PLDN.test(k))return false;
  if(uDom(u)==='air')return G.t-(o.t1||G.t)>600&&(u.task==='base'||u.st==='base');
  if(RSMA.test(k))return !!o.reached;
  if(k==='halt'||k==='rest'||o.x===undefined)return G.t-(o.t1||G.t)>=60&&u.task!=='go';
  return o.st==='exec'&&(u.task==='hold'||u.task==='at')&&!u.path&&!u.pq&&(u.arrT>0&&u.arrT>=(o.t1||0)||dist(u.x,u.y,o.x,o.y)<Math.max(600,G.map.cs*2));}
function plDone(u,P,S){var o=u.ord&&u.ord.ps===S.id?u.ord:null;if(isLeaf(u))return !!o&&plOrdDone(u,o);
  if(!o||(u.pend||[]).some(function(q){return q.ps===S.id;}))return false;var tag=u.id+':'+S.id;
  if(G.msgs.some(function(m){return m.k==='order'&&m.o&&m.o.pst===tag;}))return false;
  if(G.units.some(function(f){return f!==u&&f.side===u.side&&!isLeaf(f)&&(f.pend||[]).some(function(q){return q.pst===tag;});}))return false;
  var n=0,d=0;leavesOf(u).forEach(function(q){if(!alive(q))return;if((q.pend||[]).some(function(x){return x.pst===tag;})){n++;return;}var oq=q.ord&&q.ord.pst===tag?q.ord:null;
    if(oq){n++;if(plOrdDone(q,oq)||!onMap(q)||q.ms==='rout')d++;return;}if(q.pin&&q.pin.o&&q.pin.o.pst===tag&&onMap(q)&&q.ms!=='rout')n++;});
  return n?d===n:G.t-P.ts>1800;}
/* ---------- 開始條件 ---------- */
function plContact(u,d){var L=isLeaf(u)?[u]:leavesOf(u).filter(function(q){return alive(q)&&onMap(q);});return L.some(function(q){return (q._ed!==undefined&&q._ed<d)||G.t-(q.uf||-1e9)<120;});}
function plTrig(u,P,S,N){var T=N.tr||{k:'prev'},w=(+T.w||0)*60;
  if(T.k==='time')return G.t>=(+T.t||0);
  if(T.k==='code'){var c=P.codes[T.c];return c!==undefined&&G.t-c>=w;}
  if(T.k==='sync'){var A=uById(T.u);if(!A||!A.pln)return false;var dt=A.pln.done[T.s];if(dt===undefined)return false;var dl=P.syd[N.id];if(dl===undefined)dl=P.syd[N.id]=A.id===u.id?0:Math.min(3600,hopDelay(A,u,true).sec);return G.t>=dt+dl+w;}
  if(T.k==='str')return (isLeaf(u)?strFrac(u):strengthOf(u).f)*100<(+T.pc||50);
  if(T.k==='cont')return plContact(u,+T.d||2000);
  if(!S)return G.t-P.ts>=w;var d=P.done[S.id];return d!==undefined&&G.t-d>=w;}
/* ---------- 每兩分鐘：檢查目前步驟是否完成、下一步的條件是否成立 ---------- */
function plMark(u,P,S){P.done[S.id]=G.t;if(u.pin&&u.pin.o&&u.pin.o.ps===S.id)u.pin=null;logE(u.side,'opn',uName(u)+'完成計畫第 '+(plIdx(P,S.id)+1)+' 步：'+(ORDN[S.k]||S.k),u.x,u.y,u.id);}
function plTick(u){var P=u.pln;if(!P||P.ph!=='run')return;if(!alive(u)){P.ph='stop';return;}if(u.st==='off'||u.st==='lift')return;var i=P.cur,S=i>=0?P.sq[i]:null;
  if(S&&P.done[S.id]===undefined){if(plDone(u,P,S))plMark(u,P,S);
    else if(isLeaf(u)&&uDom(u)!=='air'&&G.t-P.ts>300&&u.ms!=='rout'&&!(u.ord&&u.ord.ps===S.id)&&!(u.pend||[]).some(function(q){return q.ps===S.id;})&&!(u.pin&&u.pin.o&&u.pin.o.ps===S.id)){
      var nx=P.sq[i+1];if(!nx||(nx.tr||{}).k==='prev'){P.ph='stop';logE(u.side,'opn',uName(u)+'的計畫第 '+(i+1)+' 步一再被打斷、無法繼續，作戰計畫暫停；請修改後重新下達，或按「繼續計畫」',u.x,u.y,u.id);return;}}}
  var N=P.sq[i+1];if(!N){if(S&&P.done[S.id]!==undefined){P.ph='done';logE(u.side,'opn',uName(u)+'完成作戰計畫的全部 '+P.sq.length+' 個步驟',u.x,u.y,u.id);}return;}
  if(u.ms==='rout')return;if(plTrig(u,P,S,N))plStart(u,P,i+1);}
(function(){var b=v8Step;v8Step=function(){b.apply(this,arguments);if(!G||!G.started||G.over)return;G.units.forEach(function(u){if(u.pln&&u.pln.ph==='run'&&(G.step+u.id)%4===0)plTick(u);});};})();
/* ---------- 暗號：短訊經指揮鏈送到所有等待這個暗號的部隊 ---------- */
function planCode(side,c,cm){if(PLC.indexOf(c)<0)return {err:'無效的暗號。'};if(!G.started)return {err:'作戰尚未開始。'};var n=0,mx=0,src=sideCmd(side);
  G.units.forEach(function(u){var P=u.pln;if(u.side!==side||!alive(u)||!P||P.ph!=='run'||P.codes[c]!==undefined)return;if(cm!==undefined&&cm!==null&&cm>=0&&typeof mpCanCmd==='function'&&!mpCanCmd(u,side,cm))return;
    if(!P.sq.some(function(q,i){return i>P.cur&&q.tr&&q.tr.k==='code'&&q.tr.c===c;}))return;var o=newOrder('code',{c:c});o.sub=1;n++;
    if(!src||src.id===u.id||u.st==='off'){plCodeRecv(u,o);return;}var lo=u.lastOid,m=sendOrder(src,u,o,true);u.lastOid=lo;if(m&&m.ta)mx=Math.max(mx,m.ta-G.t);});
  logE(side,'opn','發出暗號「'+c+'」'+(n?'給 '+n+' 個單位'+(mx>0?'，最慢約 '+durTxt(mx)+'後送達':''):'：沒有等待這個暗號的部隊'));return {n:n,sec:mx};}
function plCodeRecv(u,o){var P=u.pln;if(!P||P.codes[o.c]!==undefined)return;P.codes[o.c]=G.t;logE(u.side,'opn',uName(u)+'收到暗號「'+o.c+'」',u.x,u.y,u.id);if(P.ph==='run')plTick(u);}
/* ---------- 命令的接收：計畫與暗號；玩家另外直接下令則計畫中止 ---------- */
(function(){var b=receiveOrder;receiveOrder=function(u,o){if(o&&o.k==='plan'){plInstall(u,o,false);return;}if(o&&o.k==='code'){plCodeRecv(u,o);return;}
  if(o&&o.sub&&o.parent!==undefined&&u.p>=0){var P0=uById(u.p);if(P0&&P0.ord&&P0.ord.oid===o.parent){if(!o.pl&&P0.ord.pl)o.pl=1;if(o.pst===undefined&&P0.ord.pst!==undefined)o.pst=P0.ord.pst;}}
  var P=u.pln;if(o&&P&&P.ph==='run'&&o.pl&&o.ps===undefined&&!(o.pst!==undefined&&String(o.pst).indexOf(u.id+':')===0)){P.ph='stop';logE(u.side,'opn',uName(u)+'收到新的命令「'+ordN(o)+'」，作戰計畫中止（可在計畫面板「繼續計畫」）',u.x,u.y,u.id);}
  return b.apply(this,arguments);};})();
/* 計畫步驟的命令：非機動類（砲擊、構築等）被打斷也要接回；步驟的命令完成後才被其他命令取代時，記為完成 */
(function(){var b=activate;activate=function(u,o){var P=u&&u.pln,cur=u&&u.ord;
  if(P&&P.ph==='run'&&cur&&cur!==o&&cur.ps!==undefined&&!(o&&o.ps===cur.ps)){var S=P.cur>=0?P.sq[P.cur]:null;if(S&&S.id===cur.ps&&P.done[S.id]===undefined&&isLeaf(u)&&plOrdDone(u,cur))plMark(u,P,S);}
  var pre=o&&o.pl&&o.ps!==undefined&&!o.rsm&&isLeaf(u)&&uDom(u)!=='air'&&!RSMK.test(o.k)&&typeof rsmSnap==='function'?rsmSnap(o):null;var r=b.apply(this,arguments);if(pre&&u.pin===null)u.pin=pre;return r;};})();
/* 聯機：草稿隨部隊同步給隊友；下達計畫與暗號由伺服器執行 */
if(typeof MPWU!=='undefined')MPWU.pdr='o';
if(typeof MPFN!=='undefined'){MPFN.planSend=[MPOWN(0),function(a){return planSend(a[0],a[1],a[2]);}];MPPRE.planSend=1;
  MPFN.planCode=[function(s,cm,a){return a[0]===s&&(cm<0||a[2]===cm||a[2]===undefined||a[2]===null)?'':'只能對自己指揮的部隊發出暗號。';},function(a){return planCode(a[0],String(a[1]||''),a[2]);}];}
