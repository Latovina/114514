/* ===================== 編制裝備表（TO&E）：人員、武器（單兵與班組）、載具（依型號；武裝與車載裝備跟著型號）、支援裝備、馬匹、攜行物資 =====================
   類型的編制：自訂的（G.toe[類型鍵] 或自訂類型的 t.toe），否則由標準配備拆出來（車載武器與車用裝備歸到泛用型號、無人機戰鬥部歸到無人機）。
   單位的編制 u.toe（有改才存，否則用各類型的編制合計）。載具欄位 [型號鍵, 數量, 選項]：泛用型號是「欄位」，選項 m 指定換上的具體型號
   （'-' 表示刻意用標準的，不跟列裝表），ad 加掛、am 彈藥配比、L 砲管倍徑；具體型號直接放在載具欄位就是額外的車。
   作戰用的武器清單 u.lg.w、支援裝備 u.lg.eq、運具 u.lg.v、主要載具型號 u.vm 都由編制算出：沒有改動、沒有型號與列裝表時與標準配備完全相同。 */

/* ---------- 一、類型的編制 ---------- */
var TDC={v:-1,o:{}};
function toeDef(t){if(!t)return null;if(TDC.v!==(G&&G._tv||0))TDC={v:G&&G._tv||0,o:{}};var key=t.k+'|'+(t.load?JSON.stringify(t.load).length:0),c=TDC.o[key];if(c)return c;
  var A=tAttr(t),tk=A.take||{},o={w:[],v:[],e:[],h:A.h||0};
  A.W.forEach(function(x){var n=Math.round((x[1]-(tk[x[0]]||0))*1000)/1000;if(n>0)o.w.push([x[0],n]);});
  A.dr.forEach(function(x){if(x[1]>0)o.v.push(['g:dr:'+x[0],x[1]]);});
  A.V.forEach(function(x){if(!(x[1]>0))return;o.v.push([x[0]===A.P?'g:'+t.k+':'+x[0]:'g:'+x[0],x[1]]);});
  var ev={};A.eqv.forEach(function(x){ev[x[0]]=x[1];});A.E.forEach(function(x){var n=x[1]-(ev[x[0]]||0);if(n>0)o.e.push([x[0],n]);});
  TDC.o[key]=o;return o;}
/* 自訂的類型編制 */
function toeCus(t){if(!t)return null;var c=G&&G.toe&&G.toe[t.k];return c||t.toe||null;}
function typeToe(t){return toeCus(t)||toeDef(t);}
/* 單位的類型編制合計（依組成的數量） */
function toeMix(u){var o={w:[],v:[],e:[],h:0},ix={w:{},v:{},e:{}},add=function(f,k,n,op){if(!(n>0))return;var A=o[f];if(ix[f][k]!==undefined){A[ix[f][k]][1]+=n;return;}ix[f][k]=A.length;A.push(op?[k,n,clone(op)]:[k,n]);};
  typesOfU(u).forEach(function(m){var t=typeOf(m[0]);if(!t)return;var n=m[1]||1,T=typeToe(t);if(!T)return;(T.w||[]).forEach(function(x){add('w',x[0],x[1]*n);});(T.v||[]).forEach(function(x){add('v',x[0],x[1]*n,x[2]);});(T.e||[]).forEach(function(x){add('e',x[0],x[1]*n);});o.h+=(T.h||0)*n;});
  var M=typesOfU(u);if(M.length===1){var T1=typeToe(typeOf(M[0][0]));if(T1&&T1.s)o.s=clone(T1.s);}
  return o;}
function unitToe(u){return u&&u.toe||toeMix(u);}
/* 有沒有改過編制（單位或類型） */
function toeCustom(u){if(!u)return false;if(u.toe)return true;return typesOfU(u).some(function(m){return !!toeCus(typeOf(m[0]));});}

/* ---------- 二、每個載具欄位實際用的型號：單位指定 → 列裝表（依角色）→ 欄位本身 ---------- */
function vmFitsSlot(m,slot){if(!m||!slot)return false;if(m===slot)return true;if(m.lgx)return false;var g=vmGrp(slot);if(g!==vmGrp(m))return false;if(g==='land')return !!slot.r&&vmFits(m,slot.r);if(g==='uas')return !!slot.r&&(m.r===slot.r||vmFits(m,slot.r));return true;}
/* 主要載具欄位（與舊的 u.vm 對應）：主要類型的主要載具類別 */
function toePrinc(u){var t=vmTypeU(u),P=t&&vmPrinc(t);return P?{t:t,c:P[0],role:vmRoleT(t)}:null;}
function toeRes(u){var T=unitToe(u),F=fldOf(u.side),P=toePrinc(u),V=u.vm,o=[];
  (T.v||[]).forEach(function(x,i){var k=x[0],n=+x[1]||0,op=x[2]||{},slot=vmOf(k);if(!slot||!(n>0))return;var e={i:i,k:k,n:n,slot:slot.gen?slot:null,m:slot,o:op,src:''};
    if(slot.gen&&!slot.plat){var prin=!!(P&&slot.c===P.c&&slot.tk&&vmGrp(slot)==='land');e.p=prin;
      /* 主要載具：沒有改單位編制時，u.vm（單位指定）優先；u.vm 是列裝表或編制算出來的就跟著來源 */
      var useV=!!(!u.toe&&prin&&V&&V.m&&V.src!=='f'&&V.src!=='t'),pin=useV?V.m:op.m,pm=pin&&pin!=='-'?vmOf(pin):null;
      if(pm&&vmFitsSlot(pm,slot)){e.m=pm;e.src=useV?'u':'t';if(useV)e.o={ad:V.ad,am:V.am,L:V.L};}
      else if(pin!=='-'&&slot.r&&F&&F.v&&F.v[slot.r]){var fm=vmOf(F.v[slot.r]);if(fm&&vmFitsSlot(fm,slot)){e.m=fm;e.src='f';e.o=!u.toe&&prin&&V&&V.m===fm.k&&V.src==='f'?{ad:V.ad,am:V.am,L:V.L}:{};}}}
    o.push(e);});
  return o;}

/* ---------- 三、換算：編制 → 作戰用的清單 ---------- */
function wIsMg(k){var w=wpnOf(k);return !!(w&&w.cat==='機槍'&&!w.vmx);}
/* 車上的機槍沿用兵種的標準火力（泛用資料裡車載機槍與步兵機槍的校準差異很大）：型號取代泛用型號時只換主砲、機砲、飛彈、榴彈發射器等，
   機槍留下泛用型號的；型號上的機槍列在卡片上供參考。額外加入的車（沒有對應的泛用欄位）整套武裝都算。 */
function vmArmFor(m,slot,V){var A=vmArm(m,V);return slot&&m!==slot?A.filter(function(x){return !wIsMg(x[0]);}):A;}
/* 欄位上 n 輛車的武裝與裝備總數（泛用型號用整個類型的總數換算，與標準配備一致）；mg：0 不含機槍、1 只要機槍、undefined 全部 */
function slotTot(m,n,f,mg){var tot=f==='e'?m.eT:m.aT,o;if(m.gen&&m.nT>0&&tot)o=tot.map(function(x){return [x[0],n===m.nT?x[1]:Math.round(x[1]*n/m.nT*1000)/1000];});
  else o=(f==='e'?(m.e||[]):vmArm(m,false)).map(function(x){return [x[0],Math.round((x[1]===undefined?1:x[1])*n*1000)/1000];});
  if(f!=='e'&&mg!==undefined)o=o.filter(function(x){return wIsMg(x[0])===!!mg;});return o;}
function vmEqAll(m,V){var o=(m.e||[]).map(function(x){return [x[0],x[1]===undefined?1:x[1]];});vmAdList(m,V||{}).forEach(function(a){a.e.forEach(function(x){o.push([x[0],x[1]||1]);});});return o.filter(function(x){return seqOf(x[0]);});}
/* 舊的標準清單（與 logInit／eqInit 相同的合計順序） */
function toeLegW(u){var W={};typesOfU(u).forEach(function(m){var t=typeOf(m[0]);if(!t)return;var n=m[1]||1,L=t.load||defLoad(t);L.w.forEach(function(x){W[x[0]]=(W[x[0]]||0)+x[1]*n;});});return Object.keys(W).map(function(k){return [k,W[k]];});}
function toeLegE(u){var E={};typesOfU(u).forEach(function(m){var t=typeOf(m[0]);if(!t)return;var n=m[1]||1;((t.load&&t.load.eq)||defEq(t)).forEach(function(x){E[x[0]]=(E[x[0]]||0)+x[1]*n;});});return Object.keys(E).map(function(k){return [k,E[k]];});}
function toeFlat(u){var cus=toeCustom(u),T=unitToe(u),R=toeRes(u),F=fldOf(u.side),W,E,V,H;
  if(!cus){W=toeLegW(u);E=toeLegE(u);V=null;H=null;
    R.forEach(function(e){if(!e.slot||e.m===e.slot)return;slotTot(e.slot,e.n,'w',0).forEach(function(x){wTake(W,x[0],x[1]);});vmArmFor(e.m,e.slot,e.o).forEach(function(x){wAdd(W,x[0],x[1]*e.n);});
      slotTot(e.slot,e.n,'e').forEach(function(x){wTake(E,x[0],x[1]);});vmEqAll(e.m,e.o).forEach(function(x){wAdd(E,x[0],x[1]*e.n);});});}
  else{W=wMerge(T.w);E=wMerge(T.e);V=[];H=Math.max(0,Math.round(+T.h||0));
    R.forEach(function(e){var ar=e.slot&&e.m===e.slot?slotTot(e.slot,e.n,'w'):(e.slot?slotTot(e.slot,e.n,'w',1):[]).concat(vmArmFor(e.m,e.slot,e.o).map(function(x){return [x[0],x[1]*e.n];}));ar.forEach(function(x){wAdd(W,x[0],x[1]);});
      var eq=e.slot&&e.m===e.slot?slotTot(e.slot,e.n,'e'):vmEqAll(e.m,e.o).map(function(x){return [x[0],x[1]*e.n];});eq.forEach(function(x){wAdd(E,x[0],x[1]);});
      var lc=e.slot?vmLc(e.slot):vmLc(e.m);if(lc){var hit=null;V.forEach(function(q){if(q[0]===lc)hit=q;});if(hit)hit[1]+=e.n;else V.push([lc,e.n]);}});}
  /* 列裝表：泛用武器換成具體型號、支援裝備依配發比例 */
  var fw=[];if(F&&F.w)Object.keys(F.w).forEach(function(g){var sk=F.w[g];if(!sk||sk===g||!wpnOf(sk))return;var r=wTake(W,g,wHave(W,g));if(r){wAdd(W,sk,r[1]);fw.push([g,sk]);}});
  if(F&&F.e)Object.keys(F.e).forEach(function(k){var e=seqOf(k),fr=clamp(+F.e[k]||0,0,1);if(!e||!fr||!fldEqFits(e,u))return;var n=e.cov==='m'?Math.round((u.men0||0)*fr):e.cov==='v'?Math.round((u.veh0||0)*fr):fr>=0.5?1:0;if(n>0)wAdd(E,k,n);});
  /* 主要載具（作戰中的裝甲與速度、彈藥配比、油耗）與其他換了型號的車（油耗與造價） */
  var P=toePrinc(u),pm=null,pn=0,px=[],dr=0,nj=0;R.forEach(function(e){if(e.p&&e.m!==e.slot){if(!pm||pm.k===e.m.k){pm=e.m;pn+=e.n;if(!P.o)P.o=e.o;P.src=e.src;}else px.push([e.slot.c,e.n,e.m.k]);}else if(e.m!==e.slot||!e.slot){var c=e.slot?e.slot.c:vmLc(e.m);if(c)px.push([c,e.n,e.m.k]);}
    if(vmDom(e.m)==='uas'){dr+=e.n;if(e.m.nj)nj+=e.n;}});
  return {w:W,e:E,v:V,h:H,rk:T.rk||null,s:T.s||null,pm:pm,pn:pn,pc:P?P.c:null,po:P&&P.o||null,psrc:P&&P.src||'',px:px,nj:dr?nj/dr:0,fw:fw};}

/* ---------- 四、換裝：保留作戰中的損失與補充（與上次配發的差額） ---------- */
function wDiff(A,B){var o=[],m={};(B||[]).forEach(function(x){m[x[0]]=(m[x[0]]||0)+(+x[1]||0);});(A||[]).forEach(function(x){var d=Math.round(((+x[1]||0)-(m[x[0]]||0))*1000)/1000;delete m[x[0]];if(d)o.push([x[0],d]);});for(var k in m){var d2=-Math.round(m[k]*1000)/1000;if(d2)o.push([k,d2]);}return o;}
function wApplyD(W,D){if(!D.length)return W;var o=clone(W);D.forEach(function(x){wAdd(o,x[0],x[1]);});return o.filter(function(x){return x[1]>0.0005;});}
eqSync=function(u){if(!u||!u.lg||!vmMix(u))return false;var L=u.lg,before=eqSig(u),R=toeFlat(u),D,De;
  if(L.wA){D=wDiff(L.w,L.wA);De=wDiff(L.eq,L.eA);}
  else{var W0=clone(L.w||[]),Q0=clone(L.eq||[]);eqRevert(W0,Q0,L);D=wDiff(W0,toeLegW(u));De=L.eq0?wDiff(Q0,L.eq0):[];}
  EQBK.forEach(function(k){if(k!=='vmN'&&k!=='vmC'&&k!=='amE')delete L[k];});
  L.w=wApplyD(R.w,D);L.eq=wApplyD(R.e,De);L.wA=clone(R.w);L.eA=clone(R.e);
  if(R.v){L.v=R.v;L.h=R.h;}else if(L.toeV){L.v=clone(L.v0||[]);L.h=L.h0;}if(R.v)L.toeV=1;else delete L.toeV;
  if(R.rk&&Array.isArray(R.rk)&&R.rk.length===3)L.rk=R.rk.map(function(x){return Math.max(0,Math.round(+x||0));});
  if(R.s){if(R.s.bl>0)L.basic=clamp(+R.s.bl,0.25,10);if(R.s.dl>=0)L.daily=clamp(+R.s.dl,0,10);}
  /* 主要載具型號：沒有改編制時由 u.vm 指定（列裝表指定的會跟著列裝表變），改了編制時由編制算出 */
  if(R.pm){var V=null;if(u.vm&&u.vm.m===R.pm.k&&(R.psrc==='u'||R.psrc==='f'&&u.vm.src==='f'&&!u.toe))V=u.vm;else{V={m:R.pm.k};if(R.psrc==='f'||R.psrc==='t')V.src=R.psrc;var po=R.po||{};if(Array.isArray(po.ad))V.ad=clone(po.ad);if(po.am)V.am=clone(po.am);if(po.L)V.L=po.L;}
    u.vm=V;L.vmN=R.pn;L.vmC=R.pc;}
  else{if(u.vm&&(u.toe||u.vm.src==='f'||u.vm.src==='t'||u.vm.m!=='-'))delete u.vm;delete L.vmN;delete L.vmC;delete L.amE;}
  if(R.px.length)L.vmX=R.px;else delete L.vmX;if(R.nj>0)L.njF=R.nj;else delete L.njF;
  var F=fldOf(u.side);u.fldV=F?F.ver||0:0;delete u.vmPend;u._s=null;u._sb=null;logRecalc(u);return before!==eqSig(u);};
eqSig=function(u){var L=u.lg||{};return JSON.stringify([u.vm||0,L.w||0,L.eq||0,L.v||0,u.toe?1:0]);};
/* 編制檔匯出時的武器清單：直接用編制（沒有改編制時用標準清單） */
eqCanonW=function(u){var L=u&&u.lg;if(!L)return [];if(L.wA){var D=wDiff(L.w,L.wA);return wApplyD(toeLegW(u),D);}var W=clone(L.w||[]);eqRevert(W,null,L);return W;};
/* 一開始就要換算的單位：有型號、有列裝表或改過編制 */
(function(){var b=logInit;logInit=function(u){var r=b(u);try{if(u&&u.lg&&!u.vm&&!fldOf(u.side)&&toeCustom(u)){eqSync(u);var L=u.lg;L.fuel=L.fuelCap;L.food=L.foodCap;L.fod=L.fodCap;}}catch(e){}return r;};})();

/* ---------- 五、其他換了型號的車：油耗、油箱與造價（主要載具由 vmFx 處理） ---------- */
(function(){var b=logRecalc;logRecalc=function(u){b(u);var L=u&&u.lg;if(!L)return;try{if(L.vmX)L.vmX.forEach(function(x){var m=vmOf(x[2]),vc=VEHI[x[0]];if(!m||!vc)return;var n=x[1];
    if(m.lk&&'車甲'.indexOf(vc[2])>=0)L.lPerKm=Math.max(0,L.lPerKm+n*(m.lk-vc[3])/100);if(m.fu)L.fuelCap=Math.max(0,L.fuelCap+n*(m.fu-vc[4]));});if(L.fuel>L.fuelCap)L.fuel=L.fuelCap;
  /* 攜行物資：糧食與草料天數 */var s=u.toe?u.toe.s:(toeCustom(u)?toeMix(u).s:null);if(s){if(s.fd>0){L.foodCap=Math.max(L.dayKg*clamp(+s.fd,0.5,30),1);if(L.food>L.foodCap)L.food=L.foodCap;}if(s.od>0){L.fodCap=Math.max(L.fodDay*clamp(+s.od,0.5,30),0);if(L.fod>L.fodCap)L.fod=L.fodCap;}}}catch(e){}};})();
(function(){var b=unitUsd;unitUsd=function(u){var c=b(u),L=u&&isLeaf(u)&&u.lg;if(!L||!L.vmX)return c;var o={};for(var k in c)o[k]=c[k];L.vmX.forEach(function(x){var m=vmOf(x[2]),vu=VUSD[x[0]]||0;if(m)o.v=(o.v||0)+x[1]*((m.usd||vu)-vu);});
  o.t=(o.w||0)+(o.a||0)+(o.v||0)+(o.e||0)+(o.p||0)+(o.h||0);return o;};})();
/* 光纖導控的無人機不受干擾 */
(function(){var b=hit;hit=function(t,src,dm,dv,sup,kind){var F=t&&t.lg&&t.lg.eqF,nj=src&&src.lg&&src.lg.njF;if(nj>0&&F&&F.jam<1&&F.jam>0&&kind==='fire'){var ss=ST(src);if(ss.br==='uav'||ss.fl.indexOf('d')>=0){var f=(F.jam+(1-F.jam)*nj)/F.jam;dm*=f;dv*=f;}}return b(t,src,dm,dv,sup,kind);};})();

/* ---------- 六、設定編制 ---------- */
var TOEMAX={w:60,v:30,e:60};
/* 檢查並整理一份編制（不合法的項目丟掉） */
function toeClean(T){if(!T||typeof T!=='object')return null;var o={w:[],v:[],e:[],h:0},seen={w:{},v:{},e:{}};
  (Array.isArray(T.w)?T.w:[]).forEach(function(x){if(!Array.isArray(x)||typeof x[0]!=='string'||seen.w[x[0]]||o.w.length>=TOEMAX.w)return;var w=wpnOf(x[0]),n=Math.round((+x[1]||0)*1000)/1000;if(!w||!(n>0)||n>100000)return;seen.w[x[0]]=1;o.w.push([x[0],n]);});
  (Array.isArray(T.v)?T.v:[]).forEach(function(x){if(!Array.isArray(x)||typeof x[0]!=='string'||o.v.length>=TOEMAX.v)return;var m=vmOf(x[0]),n=Math.round(+x[1]||0);if(!m||!(n>0)||n>5000)return;var op=x[2]&&typeof x[2]==='object'?x[2]:null,q={};
    if(op){if(op.m==='-'&&m.gen&&!m.plat)q.m='-';else if(typeof op.m==='string'){var pm=vmOf(op.m);if(pm&&m.gen&&!m.plat&&vmFitsSlot(pm,m))q.m=op.m;}var tm=q.m&&q.m!=='-'?vmOf(q.m):m;
      if(Array.isArray(op.ad))q.ad=op.ad.filter(function(k,i,A){return typeof k==='string'&&VAD[k]&&A.indexOf(k)===i;}).slice(0,12);var g=tm&&tm.m&&tm.m[0],gw=g&&wpnOf(g);if(op.am&&g){var A2=amClean(op.am,g);if(A2)q.am=A2;}if(op.L&&gw&&gw.Lo&&gw.Lo.indexOf(+op.L)>=0&&+op.L!==gw.L)q.L=+op.L;}
    var key=x[0]+'|'+(q.m||'');if(seen.v[key])return;seen.v[key]=1;o.v.push(Object.keys(q).length?[x[0],n,q]:[x[0],n]);});
  (Array.isArray(T.e)?T.e:[]).forEach(function(x){if(!Array.isArray(x)||typeof x[0]!=='string'||seen.e[x[0]]||o.e.length>=TOEMAX.e)return;var n=Math.round(+x[1]||0);if(!seqOf(x[0])||!(n>0)||n>100000)return;seen.e[x[0]]=1;o.e.push([x[0],n]);});
  o.h=clamp(Math.round(+T.h||0),0,100000);if(Array.isArray(T.rk)&&T.rk.length===3&&T.rk.every(function(x){return +x>=0;}))o.rk=T.rk.map(function(x){return Math.min(100000,Math.round(+x));});
  if(T.s&&typeof T.s==='object'){var s={};if(+T.s.fd>0)s.fd=clamp(+T.s.fd,0.5,30);if(+T.s.od>0)s.od=clamp(+T.s.od,0.5,30);if(+T.s.bl>0)s.bl=clamp(+T.s.bl,0.25,10);if(+T.s.dl>=0&&T.s.dl!==''&&T.s.dl!==undefined)s.dl=clamp(+T.s.dl,0,10);if(Object.keys(s).length)o.s=s;}
  return o;}
function toeSame(a,b){return JSON.stringify(a)===JSON.stringify(b);}
/* 作戰中（不在後方休整）改編制要等下次休整 */
function toeLater(u){return !!(G&&G.started&&!(u.refit&&u.st==='off'));}
/* 設定單位的編制：T 為 null 表示恢復類型的編制。回傳 'now'（立即換裝）或 'later'（休整時換裝） */
function toeSet(u,T){if(!u||!isLeaf(u))return null;var o=T?toeClean(T):null;if(o&&toeSame(o,toeClean(toeMix(u))))o=null;
  if(toeLater(u)){u.toeNext=o||{x:1};return 'later';}if(o)u.toe=o;else delete u.toe;delete u.toeNext;if(!o&&u.vm&&u.vm.src!=='f')delete u.vm;toeApply(u);return 'now';}
function toeApply(u){if(!u.lg)logInit(u);else{eqSync(u);}var L=u.lg;if(!G||!G.started){L.fuel=L.fuelCap;L.food=L.foodCap;L.fod=L.fodCap;}}
/* 類型的編制：內建類型存在 G.toe，自訂類型存在 t.toe；開戰前所有這個類型的單位立即換裝，作戰中新的單位與休整中的單位使用 */
function typeToeSet(k,T){var t=typeOf(k);if(!t)return 0;var o=T?toeClean(T):null;if(o&&toeSame(o,toeClean(toeDef(t))))o=null;
  if(G.types&&G.types[k]){if(o)G.types[k].toe=o;else delete G.types[k].toe;}else{G.toe=G.toe||{};if(o)G.toe[k]=o;else delete G.toe[k];if(!Object.keys(G.toe).length)delete G.toe;}
  G._tv=(G._tv||1)+1;var n=0;G.units.forEach(function(u){if(!isLeaf(u)||!u.lg||!typesOfU(u).some(function(m){return m[0]===k;}))return;if(G.started&&alive(u)&&!(u.refit&&u.st==='off')){u.vmPend=1;return;}eqSync(u);n++;});return n;}
/* 休整時套用延後的編制 */
(function(){var b=refitStep;refitStep=function(){try{G.units.forEach(function(u){if(!u.toeNext||!u.refit||u.st!=='off'||!isLeaf(u))return;var o=u.toeNext.x?null:toeClean(u.toeNext);delete u.toeNext;if(o)u.toe=o;else delete u.toe;eqSync(u);
    logE(u.side,'refit',uName(u)+'在後方休整時依新的編制換裝',u.x,u.y,u.id);});}catch(e){}return b();};})();

/* ---------- 七、空中與海上的載台：換機型、換艦型就是換單位類型（數量與人員比例不變） ---------- */
function platOK(u,mk){var m=vmOf(mk),s=u&&ST(u);if(!m||!s||s.dom==='land')return false;var t=typeOf(typesOfU(u)[0][0]);if(!t)return false;var cur=vmOf(toeDef(t).v[0]&&toeDef(t).v[0][0]);return !!(cur&&vmGrp(cur)===vmGrp(m)&&(m.gen&&m.tk||m.tt));}
function platType(mk,n,base){var m=vmOf(mk);if(!m)return null;var src=m.gen&&m.tk?typeOf(m.tk):m.tt;if(!src)return null;n=Math.max(1,Math.round(n||src.veh||1));
  if(m.gen&&m.tk&&n===src.veh)return src;var key='pl'+String(mk).replace(/[^A-Za-z0-9]/g,'').slice(0,24)+'n'+n;if(G.types&&G.types[key])return G.types[key];
  var T=clone(src),per=(src.men||0)/Math.max(1,src.veh||1);T.k=key;T.cus=1;T.veh=n;T.men=Math.max(1,Math.round(per*n));T.vmk=mk;if(base)T.vmb=base;delete T.toe;
  if(!m.tt)T.ux=clone(utx(src.k));if(m.tt){var nm=String(m.n||T.n||'').replace(/（.*?）/g,'');T.n=/(中隊|分隊|艦隊|大隊)$/.test(nm)?nm:nm+(T.dom==='air'?'中隊':'分隊');}
  G.types=G.types||{};G.types[key]=T;G._tv=(G._tv||1)+1;return T;}
/* 換載台：u.mix 換成新的類型；開戰前立即，作戰中等休整 */
function platSet(u,mk){if(!u||!isLeaf(u)||!platOK(u,mk))return null;if(toeLater(u)){u.platNext=mk;return 'later';}return platDo(u,mk);}
function platDo(u,mk){var t0=typeOf(typesOfU(u)[0][0]),n=Math.max(1,Math.round(u.veh0||u.veh||t0.veh||1)),T=platType(mk,n,t0.vmb||t0.k);if(!T)return null;
  var fr=u.men0>0?u.men/u.men0:1,fv=u.veh0>0?u.veh/u.veh0:1;u.mix=[[T.k,1]];u.men0=T.men;u.veh0=T.veh;u.men=Math.round(T.men*fr);u.veh=Math.round(T.veh*fv*1000)/1000;delete u.toe;delete u.vm;u.lg=null;u._s=null;u._sb=null;logInit(u);return 'now';}
(function(){var b=refitStep;refitStep=function(){try{G.units.forEach(function(u){if(!u.platNext||!u.refit||u.st!=='off'||!isLeaf(u))return;var mk=u.platNext;delete u.platNext;if(platDo(u,mk))logE(u.side,'refit',uName(u)+'在基地換裝為'+(vmOf(mk)||{}).n,u.x,u.y,u.id);});}catch(e){}return b();};})();

/* ---------- 八、編制檔與聯機 ---------- */
if(typeof ORBKEEP!=='undefined'){ORBKEEP.push('toe');}
(function(){if(typeof orbImport!=='function')return;var b=orbImport;orbImport=function(D,side){var r=b.apply(this,arguments);try{G.units.forEach(function(u){if(u.side===side&&isLeaf(u)&&u.toe){var o=toeClean(u.toe);if(o)u.toe=o;else delete u.toe;if(u.lg)eqSync(u);}});}catch(e){}return r;};})();
if(typeof MPWU!=='undefined'){MPWU.toe='o';MPWU.toeNext='o';MPWU.platNext='s';
  MPHOOK.toe=function(u){var o=u.toe?toeClean(u.toe):null;if(o)u.toe=o;else delete u.toe;if(u.lg)eqSync(u);};
  MPHOOK.toeNext=function(u){if(u.toeNext&&!u.toeNext.x){var o=toeClean(u.toeNext);if(o)u.toeNext=o;else delete u.toeNext;}};
  MPHOOK.platNext=function(u){if(u.platNext&&!platOK(u,u.platNext))delete u.platNext;};}
if(typeof mpPatch==='function')(function(){var b=mpPatch;mpPatch=function(s,cm,P){var rej=[];try{if(P&&P.u&&G&&G.started)for(var id in P.u){var ch=P.u[id],u=uById(+id);if(ch&&typeof ch==='object'&&ch.toe!==undefined&&u&&!(u.refit&&u.st==='off')){delete ch.toe;rej.push('u'+id+'.toe');}}}catch(e){}
  var r=b(s,cm,P);if(rej.length)r.rej=(r.rej||[]).concat(rej);return r;};})();
if(typeof mpValList==='function'){(function(){var b=mpValList;mpValList=function(s){var V=b.apply(this,arguments);V.push(['vms',G.vms]);V.push(['toe',G.toe]);V.push(['foods',G.foods]);return V;};})();}
/* 列裝表或編制算出來的主要載具型號在存讀檔與聯機時保留來源 */
(function(){var b=vmClean;vmClean=function(V){var o=b(V);if(o&&V&&V.src==='t')o.src='t';return o;};})();
if(typeof MPFN!=='undefined'){MPFN.platSet=[MPOWN(0),function(a){return platSet(a[0],String(a[1]||''));}];MPPRE.platSet=1;}

/* ---------- 九、介面存檔用：只換了主要載具型號時存成 u.vm（與列裝表、舊存檔相同的表示法），其他改動存成 u.toe ---------- */
function toeStore(u,T){if(!u||!isLeaf(u))return null;var o=T?toeClean(T):null;if(!o)return toeSet(u,null);
  var base=toeClean(toeMix(u)),P=toePrinc(u),pin=null,ok=!!base&&o.w.length===base.w.length&&o.e.length===base.e.length&&o.v.length===base.v.length&&toeSame(o.w,base.w)&&toeSame(o.e,base.e)&&o.h===base.h&&!o.rk&&!o.s;
  if(ok)o.v.forEach(function(x,i){var b=base.v[i],op=x[2]||{};if(!b||x[0]!==b[0]||x[1]!==b[1]){ok=false;return;}if(!Object.keys(op).length)return;var slot=vmOf(x[0]);if(!(P&&slot&&slot.gen&&slot.c===P.c&&slot.tk)){ok=false;return;}var key=JSON.stringify(op);if(pin&&pin!==key){ok=false;return;}pin=key;});
  if(!ok){if(toeLater(u)&&u.toe&&toeSame(toeNoAm(o),toeNoAm(toeClean(u.toe)))){u.toe=o;eqSync(u);return 'now';}return toeSet(u,o);}
  var op=pin?JSON.parse(pin):null,V=op&&op.m?{m:op.m}:null;if(V){if(op.ad)V.ad=op.ad;if(op.am)V.am=op.am;if(op.L)V.L=op.L;}
  if(toeLater(u)){var cv=u.vm||{};if(V&&!u.toe&&cv.m===V.m&&JSON.stringify(cv.ad||null)===JSON.stringify(V.ad||null)&&(cv.L||0)===(V.L||0)){u.vm=Object.assign({},cv,{am:V.am});if(!V.am)delete u.vm.am;delete u.vmNext;eqSync(u);return 'now';}if(u.toe)u.toeNext={x:1};u.vmNext=V||{m:''};return 'later';}
  delete u.toe;delete u.toeNext;if(V)u.vm=V;else if(u.vm&&u.vm.src!=='f')delete u.vm;toeApply(u);return 'now';}
/* 只差彈藥配比（作戰中也能改，下一次補給起生效） */
function toeNoAm(T){var o=clone(T);(o.v||[]).forEach(function(x){if(x[2]){delete x[2].am;if(!Object.keys(x[2]).length)x.length=2;}});return o;}
/* 介面用：單位目前的編制（含各欄位實際用的型號與來源） */
function toeView(u){var T=clone(unitToe(u)),R=toeRes(u);T.v=(T.v||[]).map(function(x,i){var e=R.filter(function(q){return q.i===i;})[0],op=clone(x[2]||{});if(e&&e.src==='u'&&!u.toe&&e.m!==e.slot){op.m=e.m.k;if(e.o){if(e.o.ad)op.ad=e.o.ad;if(e.o.am)op.am=e.o.am;if(e.o.L)op.L=e.o.L;}}
    if(e&&e.p&&!u.toe&&u.vm&&u.vm.m==='-')op.m='-';return {k:x[0],n:x[1],o:op,m:e?e.m.k:x[0],src:e?e.src:'',slot:!!(e&&e.slot),p:!!(e&&e.p)};});return T;}

/* ---------- 十、自訂型號與設計主砲的檢查（存讀檔、聯機收到的資料都先過這裡） ---------- */
function numIn(v,a,b,d){v=+v;return isFinite(v)?clamp(v,a,b):d;}
function strIn(v,n){return typeof v==='string'?v.slice(0,n):'';}
var TTNUM={men:[0,1e6],veh:[0,1e5],sa:[0,500],ha:[0,500],aa:[0,500],shock:[0,50],mdef:[0,50],rE:[0,2e6],rM:[0,5e6],ind:[0,2e6],hard:[0,1],arm:[0,20],armC:[0,20],ac:[0,50],spot:[0,2e6],sig:[0,10],nv:[0,3],mor:[0,100],trn:[0,100],dig:[0,10],vr:[0,4000],vx:[0,4000],mobi:[0,9],end:[0,200],dr:[0,3],vusd:[0,1e11],ba:[0,3],ld:[0,100]};
/* 載台範本：只收已知的欄位與合理的數值 */
function ttClean(T){if(!T||typeof T!=='object')return null;var o={};for(var k in TTNUM){if(T[k]!==undefined){var v=numIn(T[k],TTNUM[k][0],TTNUM[k][1],null);if(v!==null)o[k]=v;}}
  ['n','vn','fl','era','br','dom','mob','sym','d','vdes'].forEach(function(k){if(typeof T[k]==='string')o[k]=strIn(T[k],k==='d'?300:60);});if(!o.era||!ERAI[o.era]||!o.dom||!o.br)return null;if(!o.fl)o.fl='';
  if(T.ux&&typeof T.ux==='object'){o.ux={};for(var q in T.ux){var x=T.ux[q];if(typeof x==='number'&&isFinite(x))o.ux[q]=clamp(x,-1e7,1e7);else if(x&&typeof x==='object'&&q==='adN'){o.ux.adN={};['sub','sup','bal'].forEach(function(z){o.ux.adN[z]=numIn(x[z],0,1000,0);});}}}
  if(T.msl&&typeof T.msl==='object'){var M=T.msl;o.msl={n:Math.round(numIn(M.n,0,500,1)),v:numIn(M.v,0,5000,300),r:numIn(M.r,0,5e6,0),y0:0,kind:M.kind==='asm'?'asm':'cruise',w:numIn(M.w,0,5000,200),pk:numIn(M.pk,0,1,0.8),nm:strIn(M.nm,40),ship:M.ship?1:0};}
  return o.men>0&&o.veh>0?o:null;}
function wpnCleanX(w){if(!w||typeof w!=='object'||typeof w.k!=='string'||!/^(lvw|cw)[A-Za-z0-9]{1,24}$/.test(w.k))return null;var o={k:w.k,n:strIn(w.n,60)||w.k,cat:strIn(w.cat,20)||'戰車砲',hid:0};
  var B={kg:[0,5000],rpu:[0,10000],pP:[0,50],pA:[0,50],gen:[0,9],pen:[0,20],sup:[0,10],rE:[0,2e5],rM:[0,5e5],ind:[0,5e5],acc:[0,5],crew:[0,100],y:[0,2100],aa:[0,10],nv:[0,3],usd:[0,1e9],rusd:[0,1e7],ce:[0,1],cal:[0,1000],L:[0,200]};
  for(var k in B)if(w[k]!==undefined&&w[k]!==''){var v=numIn(w[k],B[k][0],B[k][1],null);if(v!==null)o[k]=v;}if(w.mt!==undefined&&w.mt!=='')o.mt=+w.mt?1:0;if(typeof w.lvd==='string')o.lvd=strIn(w.lvd,40);
  if(Array.isArray(w.am))o.am=w.am.filter(function(x){return Array.isArray(x)&&typeof x[0]==='string';}).slice(0,8).map(function(x){return [strIn(x[0],40),numIn(x[1],0,1,0)];});return o;}
/* 自訂型號（cv…）與存進本局的設計型號（lv:…） */
function vmCleanM(m){if(!m||typeof m!=='object'||typeof m.k!=='string'||!/^(cv\d{1,6}|lv:[A-Za-z0-9_.-]{1,40})$/.test(m.k))return null;var o={k:m.k,n:strIn(m.n,60)||m.k,nat:strIn(m.nat,30),y:Math.round(numIn(m.y,0,2100,2000)),d:strIn(m.d,400)};
  var dom=['land','air','sea','sub','uas'].indexOf(m.dom)>=0?m.dom:'land';o.dom=dom;o.c=typeof m.c==='string'&&(VEHI[m.c]||m.c==='uas')?m.c:dom==='uas'?'uas':'truck';o.r=String(m.r||'').split('|').filter(function(r){return VROLE[r];}).join('|');
  [['cr',0,10000],['px',0,10000],['t',0,1e6],['arm',0,20],['armC',0,20],['vr',0,4000],['vx',0,4000],['fu',0,1e7],['lk',0,1e5],['usd',0,1e11]].forEach(function(q){if(m[q[0]]!==undefined)o[q[0]]=numIn(m[q[0]],q[1],q[2],0);});
  var WL2=function(L){return (Array.isArray(L)?L:[]).filter(function(x){return Array.isArray(x)&&typeof x[0]==='string'&&wpnOf(x[0]);}).slice(0,12).map(function(x){return [x[0],numIn(x[1],0,500,1)];});};
  var A=WL2(m.m?[m.m]:[]);o.m=A.length?A[0]:null;o.s=WL2(m.s);o.e=(Array.isArray(m.e)?m.e:[]).filter(function(x){return Array.isArray(x)&&seqOf(x[0]);}).slice(0,12).map(function(x){return [x[0],numIn(x[1],0,50,1)];});
  o.ad=(Array.isArray(m.ad)?m.ad:[]).filter(function(k){return VAD[k];}).slice(0,12);o.op=(Array.isArray(m.op)?m.op:[]).filter(function(k){return VAD[k];}).slice(0,12);o.px=o.px||0;
  if(m.am&&o.m){var am=amClean(m.am,o.m[0]);if(am)o.am=am;}if(m.exp)o.exp=1;if(m.nj)o.nj=1;if(m.lc==='')o.lc='';else if(typeof m.lc==='string'&&VEHI[m.lc])o.lc=m.lc;if(dom==='uas'&&o.c==='uas')o.lc='';
  if(typeof m.lv==='string')o.lv=strIn(m.lv,40);if(m.cus)o.cus=1;if(typeof m.from==='string')o.from=strIn(m.from,40);if(m.plat){var tt=ttClean(m.tt);if(!tt)return null;o.plat=1;o.tt=tt;}
  if(Array.isArray(m.arm2))o.arm2=m.arm2.filter(Array.isArray).slice(0,12).map(function(x){return [strIn(String(x[0]),40),numIn(x[1],0,1e4,1)];});return o;}
/* 讀檔：自訂型號重新檢查 */
(function(){var b=gameLoad;gameLoad=async function(o){var r=await b.apply(this,arguments);try{if(G&&G.vms){var V={};for(var k in G.vms){var m=vmCleanM(G.vms[k]);if(m)V[k]=m;}G.vms=Object.keys(V).length?V:undefined;if(!G.vms)delete G.vms;G._tv=(G._tv||1)+1;}}catch(e){}return r;};})();
/* 聯機收到型號：自訂型號套用藍本規則；設計型號由伺服器自己用設計重算（用戶端送來的數值不採信），設計與它用到的自訂模組、彈藥、材料、導引彈藥一起送來，也先檢查 */
if(typeof MPFN!=='undefined'){MPFN.vmPut=[function(s,cm,a){return G.started?'作戰中不能新增或修改載具型號。':'';},function(a){var m=vmCleanM(a[0]);if(!m)return false;
  if(/^lv:/.test(m.k)){var X=a[2]&&typeof a[2]==='object'?a[2]:{},d=X.d;if(d&&typeof d==='object'&&'lv:'+d.id===m.k&&typeof rlVdIn==='function'){if(!rlVdIn(X))return false;}if(typeof vdModel!=='function')return false;VDMC={};var c=vdModel(m.k.slice(3));if(!c)return false;
    G.vms=G.vms||{};G.vms[m.k]=clone(c);if(c.m&&VDW[c.m[0]]){G.wpns=G.wpns||{};G.wpns[c.m[0]]=clone(VDW[c.m[0]]);}G._tv=(G._tv||1)+1;return true;}
  if(typeof rlVm==='function'&&!rlVm(m,[]))return false;G.vms=G.vms||{};G.vms[m.k]=m;G._tv=(G._tv||1)+1;return true;}];MPPRE.vmPut=1;}
