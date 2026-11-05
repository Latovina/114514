/* ===================== LatoArmory 完整工具整合到裝備庫（「LatoArmory 工具」分頁）=====================
   直接掛載 LatoArmory 的介面（穿甲模擬、載具設計、防彈衣與插板、凝膠與創傷、多發命中、爆炸與破片、彈藥設計與計價、材料庫、對照表、匯出匯入），
   資料不存在瀏覽器，而是讀寫本局：自訂材料 G.mats、彈藥 G.ammo、載具設計與模組 G.vdes、G.vmods、導引彈藥 G.muns、毒劑 G.cba、核彈頭 G.nwh；
   全域設定（市場、批量、環境、重力、魔能充能）存在 G.laSet，東銀圓匯率與本程式共用；金額依本程式選的幣種顯示。
   改了之後，武器的穿深與價格、裝甲、載具類型與連結彈藥的武器都重算。導引彈藥與化生放核魔在本程式有自己的分頁，這裡不重複顯示。 */
if(typeof GKEYS!=='undefined')GKEYS.push('laSet','laVs');
ARTABS.push(['lat','LatoArmory 工具']);
function latVals(o,u){var L=[];if(o)Object.keys(o).forEach(function(k){var x=o[k];if(x&&typeof x==='object'){if(u)x._u=1;L.push(x);}});return L;}
function latKeyed(L,prev){var o={};(L||[]).forEach(function(x){if(x&&x.id){var p=prev&&prev[x.id];if(p&&JSON.stringify(p)!==JSON.stringify(x))x._v=(p._v||0)+1;o[x.id]=x;}});return o;}
/* 宿主：把 LatoArmory 的三份資料對應到本局 */
var LAH={omit:['gm','wmd'],title:'',
  cur:function(){var c=curOf(CUR.sel);return {k:c.k,n:c.n,sym:c.sym||'',usd:c.usd};},showUsd:function(){return CUR.show==='both';},
  store:function(k,v){if(!G)return null;
    if(k==='latoArmory.v1'){if(v===undefined)return {set:Object.assign({},G.laSet||{},{rate:CUR.rate>0?CUR.rate:2.5}),mats:latVals(G.mats,1),proj:latVals(G.ammo,1)};
      var s=Object.assign({},v.set||{});if(s.rate>0&&s.rate!==CUR.rate){CUR.rate=s.rate;curSave();}delete s.rate;delete s.cur;delete s.curs;G.laSet=s;G.mats=latKeyed(v.mats,G.mats);G.ammo=latKeyed(v.proj,G.ammo);latChanged('lib');return null;}
    if(k==='latoArmory.veh.v1'){if(v===undefined)return {mods:latVals(G.vmods,1),des:latVals(G.vdes,1),vs:G.laVs||undefined};G.vmods=latKeyed(v.mods,G.vmods);G.vdes=latKeyed(v.des,G.vdes);G.laVs=v.vs;latChanged('veh');return null;}
    if(k==='latoArmory.x1'){if(v===undefined)return {muns:G.muns||{},cba:G.cba||{},nwh:G.nwh||{},mag:{}};G.muns=v.muns||{};var c0=JSON.stringify(G.cba||{});G.cba=v.cba||{};if(JSON.stringify(G.cba)!==c0)G.cbaV=(G.cbaV||0)+1;G.nwh=v.nwh||{};
      Object.keys(v.mag||{}).forEach(function(id){var m=v.mag[id];if(!m||!m.sch)return;var dup=Object.keys(G.wpns||{}).some(function(k2){var w=G.wpns[k2];return w.mag&&w.n===m.n;});if(!dup&&typeof magApply==='function'){G.wseq=(G.wseq||0)+1;var kk='cw'+G.wseq;while(WPNO[kk]||G.wpns&&G.wpns[kk]){G.wseq++;kk='cw'+G.wseq;}G.wpns=G.wpns||{};G.wpns[kk]=magApply({k:kk,n:String(m.n||'法術').slice(0,40),hid:0,mag:{sch:m.sch,area:m.area,pow:m.pow,rng:m.rng,mana:m.mana,fx:m.fx}});}});latChanged('x');return null;}
    return null;}};
/* 資料改了：清掉快取，重算武器、裝甲、載具與連結彈藥的武器 */
var LATT=0;
function latChanged(kind){PCA={};ARCA={};VCA={};clearTimeout(LATT);LATT=setTimeout(function(){if(!G)return;try{if(kind==='x'&&G.muns)Object.keys(G.muns).forEach(function(id){if(typeof munChanged==='function')munChanged(id);});eqChanged();if(typeof wpnChanged==='function')wpnChanged();if(typeof cbaSync==='function')cbaSync();}catch(e){if(window.console)console.warn('lat',e);}},120);}
/* LatoArmory 工具存回來的設計先過現實限制（h80_real.js）：超出現實的數值會被調整，並告訴使用者 */
(function(){var b=latChanged;latChanged=function(kind){try{var N=rlLib(G);if(N.length)toast('已依現實限制調整 '+N.length+' 項：'+N.slice(0,3).join('；')+(N.length>3?'…':''),6000);}catch(e){}return b.apply(this,arguments);};})();
(function(){var b=armWHtml;armWHtml=function(){if(AR.tab!=='lat')return b.apply(this,arguments);return typeof window.LatoArmoryMount==='function'?'<div class="lw-note">LatoArmory 的完整工具，資料存在這一局（存檔、聯機與「⇩ 匯出武器裝備」都會帶上）。在這裡新增或修改的材料、彈藥與載具設計，在「武器」「彈藥」「裝甲」「載具設計」分頁可以直接使用；導引彈藥與化生放核魔請用本程式的分頁。</div><div class="lw-lat" data-k="latroot"></div>':'<div class="lw-note">未載入 LatoArmory 介面。</div>';};})();
(function(){var b=armoryDlg;armoryDlg=function(tab){b.apply(this,arguments);if(AR.tab!=='lat'||!UI.wdlg||typeof window.LatoArmoryMount!=='function')return;var el=UI.wdlg.querySelector('[data-k="latroot"]');if(!el)return;
  try{UI.latM=window.LatoArmoryMount(el,Object.assign({},LAH,{tab:AR.latT||'pen'}));el.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('[data-tab]');if(t)AR.latT=t.getAttribute('data-tab');});}catch(e){el.innerHTML='<div class="lw-note">LatoArmory 載入失敗：'+esc(e.message||String(e))+'</div>';}};})();
HELP14.push('<h4>LatoArmory 工具（裝備庫 →「LatoArmory 工具」）</h4><ul><li>LatoArmory 的完整介面直接嵌在裝備庫裡：穿甲模擬、陸海空載具設計、防彈衣與插板、凝膠與創傷、多發命中、爆炸與破片、彈藥設計與計價、材料庫（含魔能素）與對照表。</li>'+
  '<li>資料存在這一局，不另存在瀏覽器：在這裡新增或修改的材料、彈藥、載具設計與模組，就是「武器」「彈藥」「裝甲」「載具設計」分頁用的同一份資料，改了之後武器的穿深與價格、裝甲與載具都重算。全域設定（市場、批量、海拔、氣溫、側風、重力、魔能充能）存在這一局；東銀圓匯率與本程式共用，金額依本程式選的幣種顯示。</li>'+
  '<li>LatoArmory 的「匯出／匯入」也能讀本程式的武器裝備檔；獨立版的 LatoArmory（lato-armory.html）同樣有導引彈藥、化生放核魔設計與自訂幣種，設計可以互相匯入。</li></ul>');
/* 匯入獨立版 LatoArmory 的檔案（第 2 版起）：一併帶入導引彈藥、毒劑、核彈頭與魔法武器（成為本局的武器） */
(function(){var b=armImport;armImport=function(J){var msg=b(J);if(!J||J.format!=='LatoArmory')return msg;var n=[];
  if(J.muns&&typeof J.muns==='object'){G.muns=G.muns||{};var k=0;Object.keys(J.muns).forEach(function(id){var m=J.muns[id];if(m&&m.id&&m.t){G.muns[m.id]=clone(m);k++;}});if(k){VCA={};Object.keys(G.muns).forEach(function(id){if(typeof munChanged==='function')munChanged(id);});n.push(k+' 種導引彈藥');}}
  if(J.cba&&typeof J.cba==='object'){G.cba=G.cba||{};var c=0;Object.keys(J.cba).forEach(function(id){var d=J.cba[id];if(!d||typeof d!=='object')return;var s=JSON.stringify(d);if(Object.keys(G.cba).some(function(q){return JSON.stringify(G.cba[q])===s;}))return;G.cba[typeof cbaNewId==='function'?cbaNewId():id]=clone(d);c++;});if(c){G.cbaV=(G.cbaV||0)+1;if(typeof cbaSync==='function')cbaSync();n.push(c+' 種毒劑');}}
  if(J.nwh&&typeof J.nwh==='object'){G.nwh=G.nwh||{};var w=0;Object.keys(J.nwh).forEach(function(id){var X=J.nwh[id];if(!X||!(X.Y>0))return;var s=JSON.stringify(X);if(Object.keys(G.nwh).some(function(q){return JSON.stringify(G.nwh[q])===s;}))return;G.nwh[typeof nwhNewId==='function'?nwhNewId():id]=clone(X);w++;});if(w)n.push(w+' 個核彈頭');}
  if(J.mag&&typeof J.mag==='object'&&typeof magApply==='function'){var g=0;Object.keys(J.mag).forEach(function(id){var m=J.mag[id];if(!m||!m.sch)return;if(Object.keys(G.wpns||{}).some(function(q){var x=G.wpns[q];return x.mag&&x.n===m.n;}))return;G.wseq=(G.wseq||0)+1;var kk='cw'+G.wseq;while(WPNO[kk]||G.wpns&&G.wpns[kk]){G.wseq++;kk='cw'+G.wseq;}G.wpns=G.wpns||{};G.wpns[kk]=magApply({k:kk,n:String(m.n||'法術').slice(0,40),hid:0,mag:{sch:m.sch,area:m.area,pow:m.pow,rng:m.rng,mana:m.mana,fx:m.fx}});g++;});if(g){if(typeof wpnChanged==='function')wpnChanged();n.push(g+' 種魔法武器');}}
  return n.length?msg.replace(/。$/,'')+'；另有 '+n.join('、')+'。':msg;};})();
