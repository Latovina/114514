/* ===================== 支援裝備的作戰效果（二）與醫療、CBRN 物資 =====================
   通信：無線電、數位跳頻、戰場管理系統、衛星通訊與中繼站改變命令與情報的傳遞時間（0.6～1.5 倍）、無線電距離（0.5～2.5 倍）與受干擾程度；
         沒有無線電的單位只能靠有線電話與傳令；無線電年代以前，兩端都配了無線電也能通聯（較慢、距離較短）。
   觀測：偵察無人機、地面監視雷達、戰場管理系統增加觀測距離；反砲兵雷達縮短附近敵砲兵的定位時間。
   醫療：急救包與止血帶、救護車降低傷重不治，救護車擴大後送範圍；野戰手術組提高醫療單位的品質。
   CBRN：防毒面具與防護服的配發率決定防護；偵檢器提早警報；解毒針減少神經毒劑傷亡；除污車讓任何單位都能除污、範圍較大。
   工兵：推土鏟加快挖掘、構工與修路；掃雷滾輪在行進時開闢雷區通路。後勤：野戰廚房提供熱食，淨水設備減少水媒疾病與飲水運量。
   效果一律相對於標準配備（見 h40_arms2.js）：標準配備的部隊與過去相同。
   物資：醫療物資 L.med 與 CBRN 物資 L.cbr（公斤）。存量依人數與年代，與糧秣同一運補類別補充。
   醫療物資用於急救（每名傷患）、醫療單位手術（每名病患）、病患用藥與日常醫務；不足時傷重不治與病死增加、手術後歸隊減少。
   CBRN 物資用於更換濾毒罐、防護服（防護等級 2 以上會磨損，受污染時一天內須更換）、除污與解毒針；不足時防護變差、除污變慢。 */
function supY(u){return uEra(u).y;}
function medKgMan(y){return y<1900?0.3:y<1950?0.6:y<2000?1:1.5;}
function medKgFA(y){return y<1900?0.2:y<1950?0.4:y<2000?0.8:1.2;}
function medKgSurg(y){return y<1900?1:y<1950?3:y<2000?6:8;}
function medKgSick(y){return y<1900?0.05:y<1950?0.1:y<2000?0.2:0.3;}
function cbrKgMan(u){var E=uEra(u),y=E.y;if(typeof cbOn==='function'&&!cbOn())return 0;return E.fan?0.3:y<1915?0:y<1940?0.4:y<1960?0.6:y<1990?1.5:2;}
/* 存量上限：一般單位依人數；醫療單位另加兩天的手術用量 */
function supCaps(u,L){var y=supY(u),men=u.men0||u.men||0,s=ST(u);L.medCap=men*medKgMan(y)+(s.fl.indexOf('D')>=0?Math.max(20,mixX(u,'med'))*medKgSurg(y)*2:0);L.cbrCap=men*cbrKgMan(u);
  if(L.med===undefined||L.med>L.medCap)L.med=L.medCap;if(L.cbr===undefined||L.cbr>L.cbrCap)L.cbr=L.cbrCap;}
(function(){var b=logRecalc;logRecalc=function(u){b(u);var L=u.lg;if(!L)return;supCaps(u,L);var F=eqF2(u);if(F&&F.pr)L.water*=F.pr>0?0.5:1.3;};})();
function supL(u){var L=u&&u.lg;if(!L)return null;if(L.medCap===undefined)supCaps(u,L);return L;}
function medShort(L){return L&&L.medCap>0?clamp(1-L.med/(0.2*L.medCap),0,1):0;}
function cbrShort(L){return L&&L.cbrCap>0?clamp(1-L.cbr/(0.1*L.cbrCap),0,1):0;}
/* 用掉物資：回傳實際取得的公斤數，計入戰爭花費 */
function medUse(u,kg){var L=supL(u);if(!L||!(kg>0))return 0;var g=Math.min(L.med,kg);if(!(g>0))return 0;L.med-=g;if(typeof costAdd==='function')costAdd(u.side,'medKg',g);return g;}
function cbrUse(u,kg){var L=supL(u);if(!L||!(kg>0))return 0;var g=Math.min(L.cbr,kg);if(!(g>0))return 0;L.cbr-=g;if(typeof costAdd==='function')costAdd(u.side,'cbrKg',g);return g;}
/* 醫院設施收治：醫院自備物資，只計花費 */
function medHosp(side,n){if(n>0&&typeof costAdd==='function')costAdd(side,'medKg',n*medKgSurg(lgY()));}

/* ---------- 醫療 ---------- */
medFx=function(u,k,v){var F=eqF2(u);
  if(k==='reach')return F&&F.ev>0?v*1.3:v;
  if(k==='dow'){var s=medShort(supL(u)),f=F?F.du:1;return v*f*(s>0?1+0.6*s:1);}
  if(k==='mq')return F&&F.mq?clamp(v+F.mq,0,0.95):v;
  if(k==='use'){var need=v*medKgSurg(supY(u));if(!(need>0))return 0;var got=medUse(u,need);return clamp(1-got/need,0,1);}
  if(k==='dis'){var s2=medShort(supL(u));return s2>0?v*(1+s2):v;}
  if(k==='rec'){var s3=medShort(supL(u));return s3>0?v*(1-0.4*s3):v;}
  return k==='use'?0:v;};
/* 受傷當下的急救 */
(function(){var b=woundSplit;woundSplit=function(t,m,K){var w0=t.wia||0;b(t,m,K);var w=(t.wia||0)-w0;if(w>0&&G.started)medUse(t,w*medKgFA(supY(t)));};})();
/* 淨水：水媒疾病（痢疾、霍亂、傷寒） */
(function(){var b=sickAdd;sickAdd=function(u,n,dk){if(n>0&&(dk==='dys'||dk==='chol'||dk==='typh')){var F=eqF2(u);if(F&&F.pr)n*=F.pr>0?0.5:1.4;}return b(u,n,dk);};})();
/* 野戰廚房：有就有熱食、拿掉就只有冷食 */
(function(){var b=consume;consume=function(u,L,dt){var F=eqF2(u);if(!F||!F.hr)return b.apply(this,arguments);var h0=L.hot;L.hot=F.hr>0;try{return b.apply(this,arguments);}finally{L.hot=h0;}};})();

/* ---------- 每 10 分鐘：日常醫務與病患用藥、濾毒罐更換、防護服磨損 ---------- */
function eqSupTick(dt){var day=dt/86400;G.units.forEach(function(u){if(!isLeaf(u)||!alive(u)||u.st==='off'||u.irr||u.side<0||u.side>=nSides())return;var L=supL(u);if(!L)return;var y=supY(u);
    if(L.medCap>0)medUse(u,(u.men*(y<1900?0.003:0.01)+(u.sick||0)*medKgSick(y))*day);
    var g=u.cbg;if(!g||!(L.cbrCap>0)||u.men<1)return;
    if(g.filt<60){var need=u.men*0.3*(1-g.filt/100),got=cbrUse(u,need);if(got>0)g.filt=Math.min(100,g.filt+(100-g.filt)*got/need);}
    var M=typeof cbMopp==='function'?cbMopp(u):0;if(M>=2){var F=eqF2(u),cov=F&&F.gs1>0?F.gs1:1;cbrUse(u,u.men*cov*(g.cont>0.05?2.7:y>=1960?0.08:0.03)*day);}});}
(function(){var b=simStep;simStep=function(){var r=b.apply(this,arguments);if(G.started&&G.step%20===19){try{eqSupTick(600);}catch(e){}}return r;};})();
/* 補給：與糧秣同一類別 */
function lgTake(src,c,kg){if(!(kg>0))return 0;var st=src.st;if(src.k==='off'||src.k==='self'||!st)return kg;var t=Math.min(kg/1000,st[c]||0);st[c]-=t;return t*1000;}
(function(){var b=resupply;resupply=function(u,L,src,dt){var r=b.apply(this,arguments);if(!L||!src)return r;supL(u);var rate=G.t-(u.fired||-1e9)<300?0.3:1;
  if(L.medCap>L.med)L.med+=lgTake(src,'food',Math.min(L.medCap-L.med,L.medCap*rate*dt/3600*0.5));if(L.cbrCap>L.cbr)L.cbr+=lgTake(src,'food',Math.min(L.cbrCap-L.cbr,L.cbrCap*rate*dt/3600*0.5));return r;};})();
/* 需求：補足缺額（兩天）加上日常醫務，計入糧秣 */
(function(){var b=sideDemand;sideDemand=function(side){var d=b(side);G.units.forEach(function(u){if(u.side!==side||!alive(u)||u.st==='off'||!u.lg||u.lg.medCap===undefined)return;var L=u.lg;d.food+=Math.max(0,L.medCap-L.med)/2000+u.men*0.01/1000+Math.max(0,L.cbrCap-L.cbr)/2000;});return d;};})();

/* ---------- 通信 ---------- */
var CQ1={s:1,r:1,j:1,ok:true,has:false};
function eqCq(u){var F=eqF2(u);return F&&F.cq||CQ1;}
commQ=function(a,b,E){var A=eqCq(a),B=eqCq(b),o={s:Math.max(A.s,B.s),r:Math.min(A.r,B.r),j:Math.max(A.j,B.j),ok:A.ok&&B.ok};
  if(!E.radio&&!E.dig&&A.has&&B.has&&!uEra(a).fan)o.E=Object.assign({},E,{radio:6,rr:4});return o;};

/* ---------- 反砲兵雷達：40 公里內有本方雷達時，定位敵砲兵的時間減為四成 ---------- */
(function(){var b=cbNotice;cbNotice=function(u){var n=G.cbq?G.cbq.length:0;b(u);if(!G.cbq||G.cbq.length<=n)return;var q=G.cbq[G.cbq.length-1];if(q.id!==u.id)return;
  var rad=G.units.some(function(r){if(r.side!==q.side||!alive(r)||!onMap(r))return false;var F=eqF2(r);return F&&F.cb>0&&dist(r.x,r.y,u.x,u.y)<40000;});if(rad)q.at=G.t+(q.at-G.t)*0.4;};})();

/* ---------- 掃雷滾輪：行進經過的雷區格子被開闢 ---------- */
(function(){var b=moveStep;moveStep=function(u,s,frac){var x0=u.x,y0=u.y,r=b.apply(this,arguments);if(!(r>0)||s.dom!=='land')return r;var F=eqF2(u);if(!F||!F.mr)return r;
  var MP=G.map,ks=[],n=Math.max(1,Math.ceil(r/(MP.cs*0.5)));for(var i=0;i<=n;i++){var k=cellAt(x0+(u.x-x0)*i/n,y0+(u.y-y0)*i/n);if(MP.ft[k]===3){MP.ft[k]=0;ks.push(k);}}
  if(ks.length){mapChanged(ks);if(!u.mrLog||G.t-u.mrLog>3600){u.mrLog=G.t;logE(u.side,'eng',uName(u)+'以掃雷滾輪開闢雷區通路（'+placeTxt(u.x,u.y)+'）',u.x,u.y,u.id);}}return r;};})();

/* ---------- CBRN ---------- */
if(typeof cbProt==='function'){
/* 面具與防護服：依配發率（相對於標準配備）；沒有 CBRN 物資時防護服磨損漏氣 */
(function(){var b=cbProt;cbProt=function(u,ag){var F=eqF2(u);if((!F||F.gmr===1&&F.gsr===1)&&!(cbrShort(supL(u))>=1))return b(u,ag);var g=cbGear(u),m0=g.mask,s0=g.suit,e=cbEff(u);g.mask=e.mask;g.suit=e.suit;try{return b(u,ag);}finally{g.mask=m0;g.suit=s0;}};})();
/* 偵檢器：提早警報 */
(function(){var b=cbMaskDelay;cbMaskDelay=function(u){var F=eqF2(u);return F&&F.dt?b(u)*(F.dt>0?0.4:1.5):b(u);};})();
/* 解毒針：神經毒劑的傷亡；用掉 CBRN 物資 */
(function(){var b=hit;hit=function(t,src,dm,dv,sup,kind){if(kind==='nerve'&&dm>0&&t&&t.lg){var F=eqF2(t);if(F&&(F.atA>0||F.atB>0)){var L=supL(t),av=L&&L.cbr>0?1:0.3;dm*=(1-0.35*F.atA*av)/(1-0.35*F.atB);if(F.atA>0)cbrUse(t,dm*0.05);}}return b(t,src,dm,dv,sup,kind);};})();
/* 除污：每一輪用掉 CBRN 物資（除污車 150 公斤、其他 80 公斤）；物資不足時隔一輪才有效；除污車的範圍大一半 */
(function(){var b=cbDecon;cbDecon=function(u,x,y,R){var F=eqF2(u),L=supL(u),dk=F&&F.dk>0;if(L&&L.cbrCap>0){var need=dk?150:80,got=cbrUse(u,need);if(got<need*0.5){u._dcSk=!u._dcSk;if(u._dcSk)return {ground:-1,units:-1,short:1};}}return b(u,x,y,dk?(R||600)*1.5:R);};})();
}
/* 實際的面具與防護服防護（介面也用） */
function cbEff(u){var g=cbGear(u),F=eqF2(u),m=g.mask,s=g.suit;if(F&&(F.gmr!==1||F.gsr!==1)){m=m>0?m*Math.min(1,F.gmr):F.gm1*0.8;s=s>0?s*Math.min(1.2,F.gsr):F.gs1*0.8;}if(cbrShort(supL(u))>=1)s*=0.6;return {mask:m,suit:s};}
function eqHas(u,k){var F=eqF2(u);return !!(F&&F[k]>0);}
