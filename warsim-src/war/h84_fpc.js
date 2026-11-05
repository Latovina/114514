/* ===================== 部隊點數：依花費計算（購置、維持費、後勤累積） =====================
   部隊點數＝這支部隊花了多少錢（2020 年美元，與裝備庫的造價同一幣值），每點預設 10 萬美元，可在「設定 → 點數」調整：
   一、購置：現有的武器、載具、支援裝備、個人裝具、馬匹，加上人員的徵募與訓練（依年代、訓練程度與軍官、士官比例）。
   二、維持費：薪餉、糧秣與草料、平時用油、載具與武器的維修保養，乘上維持的天數（預設 30 天）。
   三、後勤累積：部隊身上現有的彈藥、燃料、糧秣與草料；整個陣營另加補給站裡的存量。
   兵力、載具、彈藥減少，點數就跟著減少。舊的算法（依火力、防護、訓練與兵力）改稱「戰力」，仍用來比較雙方戰力、與同級標準比較，
   也仍是增援點數的計價基準（增援點數另有自己的收支）；設定裡可以把部隊點數切回戰力算法。 ===================== */
function fpcOn(){return !G||!G.set||G.set.fpm!=='pow';}
function fpcUsd(){var v=G&&G.set&&+G.set.fpUsd;return v>0?v:100000;}
function fpcDays(){var v=G&&G.set&&G.set.fpDays;return v!==undefined&&v!==''&&isFinite(+v)?clamp(+v,0,3650):30;}
/* 每人的徵募與訓練費（2020 年美元；士兵、士官、軍官的倍數另計） */
function fpcTrainUsd(y){return y<1700?1500:y<1800?2500:y<1870?4000:y<1914?6000:y<1945?10000:y<1970?25000:y<1990?40000:60000;}
/* 每人每日的薪餉與津貼 */
function fpcPayUsd(y){return y<1800?8:y<1900?12:y<1945?25:y<1970?50:y<1990?90:150;}
var FPCRK=[[1,1],[2,1.8],[5,3.5]];
/* 原本的戰力算法（依火力、防護、訓練與兵力） */
var fpPowLeaf=fpU,fpPowEst=fpEst;
function fpPowU(u){if(!u||!alive(u))return 0;if(!isLeaf(u)){var n=u.hq&&u.men0>0?fpType(u.hq)*clamp(u.men/u.men0,0,1):0;leavesOf(u).forEach(function(q){n+=fpPowU(q);});return Math.round(n);}return fpPowLeaf(u);}
function fpPowSide(side){var n=0;G.units.forEach(function(u){if(u.side!==side||!alive(u)||u.st==='off'||u.irr)return;if(isLeaf(u))n+=fpPowLeaf(u);else if(u.hq&&u.men0>0)n+=fpType(u.hq)*clamp(u.men/u.men0,0,1);});return Math.round(n);}
/* 單一單位（末端）的花費明細：buy 購置、keep 維持費（設定的天數）、day 每日維持、stock 後勤累積、t 合計（美元） */
function fpcLeaf(u,full){var L=u.lg||logInit(u),c=unitUsd(u),y=uEra(u).y,P=costP(),fr=full?1:(u.men0>0?clamp(u.men/u.men0,0,1.2):1),t=ST(u),trn=u.trn!==undefined?u.trn:t.trn||60,rk=L.rk||[u.men0||0,0,0];
  var men=[0,1,2].map(function(i){return (rk[i]||0)*fr;}),tr=fpcTrainUsd(y)*(0.6+0.8*clamp(trn,0,100)/100),pay=fpcPayUsd(y);
  var hw=(c.w||0)+(c.e||0)+(c.p||0)+(c.h||0),veh=c.v||0;
  var buy={eq:hw,veh:veh,men:sum([0,1,2],function(i){return men[i]*tr*FPCRK[i][0];})};buy.t=buy.eq+buy.veh+buy.men;
  var fuelDay=0;try{fuelDay=dayNeed(u,0.3,20).fuel*1000;}catch(e){}
  var day={pay:sum([0,1,2],function(i){return men[i]*pay*FPCRK[i][1];}),food:(L.dayKg||0)*(full?1:1)*P.food+(L.fodDay||0)*P.fod,fuel:fuelDay*P.fuel*P.haul,mnt:veh*0.10/365+hw*0.04/365};day.t=day.pay+day.food+day.fuel+day.mnt;
  var am=full?1:clamp((u.ammo===undefined?100:u.ammo)/100,0,2);
  var stock={ammo:(c.a||0)*am,fuel:(full?L.fuelCap:L.fuel||0)*P.fuel*P.haul,food:(full?L.foodCap:L.food||0)*P.food+(full?L.fodCap:L.fod||0)*P.fod};stock.t=stock.ammo+stock.fuel+stock.food;
  var D=fpcDays();return {buy:buy,day:day,keep:day.t*D,days:D,stock:stock,t:buy.t+day.t*D+stock.t};}
function fpcAdd(a,b){a.buy+=b.buy.t;a.keep+=b.keep;a.stock+=b.stock.t;a.t+=b.t;a.n++;return a;}
function fpcZero(){return {buy:0,keep:0,stock:0,dep:0,t:0,n:0,days:fpcDays()};}
/* 司令部（非末端單位本身的指揮與參謀）：用司令部的單位類型估計，依目前兵力的比例 */
function fpcHq(u){if(!u.hq||!(u.men0>0))return null;var t=typeOf(u.hq);if(!t)return null;var f=clamp(u.men/u.men0,0,1),q={id:-1,side:u.side,mix:[[u.hq,1]],men0:t.men,veh0:t.veh,men:t.men,veh:t.veh,ammo:100,p:-1,kids:[],ech:1,st:'ok',trn:t.trn};
  try{logInit(q);var r=fpcLeaf(q,true);['buy','stock'].forEach(function(k){r[k].t*=f;});r.keep*=f;r.t*=f;return r;}catch(e){return null;}}
/* 一支部隊（含下級）的花費明細 */
function fpcOf(u){var o=fpcZero();if(!u||u.st==='dead')return o;if(isLeaf(u))return fpcAdd(o,fpcLeaf(u));var h=fpcHq(u);if(h)fpcAdd(o,h);leavesOf(u).forEach(function(q){if(q.st!=='dead'&&alive(q))fpcAdd(o,fpcLeaf(q));});return o;}
function fpcPts(usd){return Math.round(usd/fpcUsd());}
/* 補給站裡的存量（公噸）：彈藥每公斤的價格取本方部隊的平均 */
function fpcAmmoKg(side){var a=0,kg=0;G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||!alive(u)||!u.lg)return;var c=unitUsd(u),k=(u.lg.uof||0)*(u.lg.basic||1);if(k>0&&c.a>0){a+=c.a;kg+=k;}});return kg>0?a/kg:30;}
function fpcDepot(side){var P=costP(),ak=fpcAmmoKg(side),v=0;(typeof nodesOf==='function'?nodesOf(side):[]).forEach(function(N){if(N.k==='off'||!N.st)return;v+=(N.st.food||0)*1000*P.food+(N.st.fod||0)*1000*P.fod+(N.st.fuel||0)*1000*P.fuel*P.haul+(N.st.ammo||0)*1000*ak;});return v;}
function fpcSide(side){var o=fpcZero();G.units.forEach(function(u){if(u.side!==side||!alive(u)||u.st==='off'||u.irr)return;if(isLeaf(u))fpcAdd(o,fpcLeaf(u));else{var h=fpcHq(u);if(h)fpcAdd(o,h);}});o.dep=fpcDepot(side);o.stock+=o.dep;o.t+=o.dep;return o;}
/* 某單位類型滿編時的花費（增援對話框在增援點數關閉時顯示） */
var FPCT={};
function fpcType(tk,side){var t=typeOf(tk);if(!t)return 0;var key=tk+'|'+(side===undefined?'':side)+'|'+(G&&G._tv||0)+'|'+fpcDays()+'|'+fpcUsd();if(FPCT[key]!==undefined)return FPCT[key];var v=0;
  try{var q={id:-1,side:side===undefined||side===null?0:side,mix:[[tk,1]],men0:t.men,veh0:t.veh,men:t.men,veh:t.veh,ammo:100,p:-1,kids:[],ech:1,st:'ok',trn:t.trn};logInit(q);v=fpcLeaf(q,true).t/fpcUsd();}catch(e){v=0;}
  return (FPCT[key]=v);}
/* 部隊點數：花費制時取代原本的算法 */
fpU=function(u){if(!fpcOn())return fpPowU(u);if(!u||!alive(u))return 0;return fpcPts(fpcOf(u).t);};
fpSide=function(side){if(!fpcOn())return fpPowSide(side);return fpcPts(fpcSide(side).t);};
/* 開戰後只能依情報估計敵方：依看到的人數與車輛數、作戰年代的一般價格 */
fpEst=function(side){if(!fpcOn())return fpPowEst(side);var C=G.ct[side]||{},y=G.set.y||1943,man=fpcTrainUsd(y)*1.1+fpcPayUsd(y)*1.3*fpcDays()+(y<1900?300:y<1945?1500:y<1990?6000:12000),veh=y<1918?30000:y<1940?300000:y<1970?1500000:y<1990?4000000:6000000,n=0;
  for(var id in C){var c=C[id];if(c.dead||G.t-c.t>6*3600)continue;n+=(c.men||0)*man+(c.veh||0)*veh;}return fpcPts(n);};
/* 增援點數關閉時，增援對話框的「部隊點數」也依花費 */
(function(){var b=rpTypeCost;rpTypeCost=function(tk,n,side){if(rpOn()||!fpcOn()||side===undefined||side===null)return b.apply(this,arguments);return Math.max(1,Math.round(fpcType(tk,side)*(n||1)));};})();
(function(){var b=rpPresetCost;rpPresetCost=function(pk,side){if(rpOn()||!fpcOn()||!FPI[pk]||side===undefined||side===null)return b.apply(this,arguments);var v=0,hq=0;flatMix(pk,{}).forEach(function(q){v+=fpcType(q[0],side)*(q[1]||1);});
  (function c(k){var Q=FPI[k];hq++;Q.kids.forEach(function(kd){if(kd[0].charAt(0)==='@')for(var i=0;i<kd[1];i++)c(kd[0].slice(1));});})(pk);return Math.max(1,Math.round(v+hq*fpcType(hqTypeFor(FPI[pk].era),side)));};})();
(function(){var b=rftCost;rftCost=function(T,side){if(rpOn()||!fpcOn()||side===undefined||side===null)return b.apply(this,arguments);var v=0;(T&&T.items||[]).forEach(function(q){if(typeOf(q[0]))v+=fpcType(q[0],side)*Math.max(0,+q[1]||0);});if(T&&T.hq!==0)v+=fpcType(hqTypeFor(rftEra(T)),side);return Math.max(1,Math.round(v));};})();
