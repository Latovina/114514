/* ===================== 戰爭花費：油料（每升單價）、彈藥、糧秣飲水、草料、醫療與 CBRN 物資的用量與金額，裝備損失與人員撫卹，合計整場戰爭的花費 =====================
   每一步抽樣各單位存量的減少（補給到貨時只更新基準），飛機依空中時間計油耗；醫療與 CBRN 物資在用掉的當下記帳（h44_eqfx.js）。單價依年代預設（以美元計，含前線運補），可在「設定」調整；
   G.cost[side] 累計：fuelL 公升、ammoKg 公斤、ammoUsd、foodKg、fodKg、medKg、cbrKg、vehUsd 載具、kitUsd 武器與個人裝具、vehN、manN。 */
function costPrice(y){y=y||1940;return {fuel:y<1930?0.35:y<1960?0.45:y<1990?0.6:y<2010?0.8:1.0,haul:1.5,food:y<1900?1.5:y<1950?3:y<2000?6:9,fod:0.3,med:y<1900?10:y<1950?25:y<2000?60:120,cbr:y<1950?15:y<2000?40:80,
  kia:y<1900?2000:y<1950?10000:y<2000?100000:500000,wia:y<1950?2000:y<2000?20000:50000,kiaR:y<1900?0.35:y<1950?0.25:y<2000?0.18:0.12};}
var COSTPN={fuel:['燃料','公升'],haul:['前線運補加成','倍'],food:['糧秣飲水','公斤'],fod:['草料','公斤'],med:['醫療物資','公斤'],cbr:['CBRN 物資','公斤'],kia:['陣亡撫卹','人'],wia:['傷患治療','人']};
function costP(){var y=G&&G.set?G.set.y:1940,d=costPrice(y),o=G&&G.set&&G.set.cprice||{};Object.keys(o).forEach(function(k){if(d[k]!==undefined&&o[k]>=0&&isFinite(+o[k]))d[k]=+o[k];});return d;}
function costS(s){if(!G.cost)G.cost=sAO();return G.cost[s]||(G.cost[s]={});}
function costAdd(s,k,v){if(!(v>0)||!isFinite(v)||(s!==0&&s!==1))return;var C=costS(s);C[k]=(C[k]||0)+v;}
/* 每架飛機每小時耗油（公升） */
function costLph(s){var y=(ERAI[s.era]||{}).y||1940,jet=y>=1950,fl=s.fl||'';if(s.br==='uav')return 50;if(s.br==='heli')return y>=1960?700:300;if(fl.indexOf('v')>=0)return fl.indexOf('y')>=0?(jet?12000:3000):(jet?5000:1200);return jet?3000:300;}
var CSM={},CSMG=null;
function costM(u){if(CSMG!==G){CSM={};CSMG=G;}return CSM[u.id];}
function costUnitVal(u,M){if(M.vt!==undefined&&G.t-M.vt<1800)return;var c=unitUsd(u);M.au=c.a||0;M.vu=u.veh>0?(c.v||0)/u.veh:0;M.pu=u.men>0?((c.w||0)+(c.p||0)+(c.e||0))/u.men:0;M.vt=G.t;}
/* 糧秣、草料與燃料：直接量測消耗函式前後的差（同一步補給到貨不會抵銷） */
(function(){var b=consume;consume=function(u,L){var f0=L.food,d0=L.fod,u0=L.fuel,r=b.apply(this,arguments);if(G&&G.started&&u.side>=0&&u.side<nSides()){costAdd(u.side,'foodKg',f0-L.food);costAdd(u.side,'fodKg',d0-L.fod);costAdd(u.side,'fuelL',u0-L.fuel);}return r;};})();
if(typeof fuelBurn==='function'){(function(){var b=fuelBurn;fuelBurn=function(u,L){var u0=L?L.fuel:0,r=b.apply(this,arguments);if(L&&G&&G.started&&u.side>=0&&u.side<nSides())costAdd(u.side,'fuelL',u0-L.fuel);return r;};})();}
/* 彈藥：每一步抽樣減少量；補給到貨時把基準一起加上，避免與同一步的射擊抵銷 */
(function(){var b=resupply;resupply=function(u){var a0=u.ammo,r=b.apply(this,arguments),M=costM(u);if(M&&u.ammo>a0)M.a+=u.ammo-a0;return r;};})();
function costTick(){if(!G||!G.started||!G.units)return;if(CSMG!==G){CSM={};CSMG=G;}var h=DT/3600;
  for(var i=0;i<G.units.length;i++){var u=G.units[i];if(!isLeaf(u)||u.side<0||u.side>=nSides()||u.irr)continue;var M=CSM[u.id],L=u.lg;if(!M){CSM[u.id]={a:u.ammo,m:u.men,v:u.veh};continue;}
    if(!alive(u)){M.m=u.men;M.v=u.veh;M.a=u.ammo;continue;}
    if(u.ammo<M.a-1e-9&&L){costUnitVal(u,M);var d=M.a-u.ammo;costAdd(u.side,'ammoUsd',d/100*M.au);costAdd(u.side,'ammoKg',d/100*(L.uof||0)*(L.basic||1));}M.a=u.ammo;
    var s=ST(u);if(s.dom==='air'&&onMap(u)&&u.st!=='base'&&u.veh>0)costAdd(u.side,'fuelL',u.veh*costLph(s)*h);
    if(u.veh<M.v||u.men<M.m){costUnitVal(u,M);if(u.veh<M.v){costAdd(u.side,'vehUsd',(M.v-u.veh)*M.vu);costAdd(u.side,'vehN',M.v-u.veh);}if(u.men<M.m){costAdd(u.side,'kitUsd',(M.m-u.men)*M.pu);costAdd(u.side,'manN',M.m-u.men);}}
    M.m=u.men;M.v=u.veh;}}
(function(){var b=simStep;simStep=function(){var r=b.apply(this,arguments);try{costTick();}catch(e){}return r;};})();
/* 帳目：每一類的用量、單價與金額（美元） */
function costRows(s){var C=costS(s),P=costP(),st=G.stats&&G.stats[s]||{},cas=st.cas||0,kia=cas*P.kiaR,wia=cas-kia,med=C.medKg||0,fuelP=P.fuel*P.haul,R=[];
  R.push({k:'fuel',n:'燃料',q:C.fuelL||0,u:'公升',p:fuelP,usd:(C.fuelL||0)*fuelP});
  R.push({k:'ammo',n:'彈藥',q:(C.ammoKg||0)/1000,u:'噸',p:C.ammoKg>0?(C.ammoUsd||0)/(C.ammoKg/1000):0,usd:C.ammoUsd||0});
  R.push({k:'food',n:'糧秣飲水',q:(C.foodKg||0)/1000,u:'噸',p:P.food*1000,usd:(C.foodKg||0)*P.food});
  if(C.fodKg>0)R.push({k:'fod',n:'草料',q:C.fodKg/1000,u:'噸',p:P.fod*1000,usd:C.fodKg*P.fod});
  R.push({k:'med',n:'醫療物資',q:med/1000,u:'噸',p:P.med*1000,usd:med*P.med});
  if(C.cbrKg>0)R.push({k:'cbr',n:'CBRN 物資',q:C.cbrKg/1000,u:'噸',p:P.cbr*1000,usd:C.cbrKg*P.cbr});
  R.push({k:'veh',n:'載具與飛機損失',q:C.vehN||0,u:'輛／架／艘',p:C.vehN>0?(C.vehUsd||0)/C.vehN:0,usd:C.vehUsd||0});
  R.push({k:'kit',n:'武器與個人裝具損失',q:C.manN||0,u:'人份',p:C.manN>0?(C.kitUsd||0)/C.manN:0,usd:C.kitUsd||0});
  R.push({k:'comp',n:'陣亡撫卹與傷患治療',q:cas,u:'人',p:cas>0?(kia*P.kia+wia*P.wia)/cas:0,usd:kia*P.kia+wia*P.wia});
  return R;}
function costTotal(s){return costRows(s).reduce(function(a,r){return a+r.usd;},0);}
/* 聯機：每位玩家只收到本方的帳目 */
if(typeof mpValList==='function'){(function(){var b=mpValList;mpValList=function(s){var V=b.apply(this,arguments);if(G.cost)V.push(['cost',s<0?G.cost:mpPair(G.cost,s,function(){return {};})]);return V;};})();}
