/* ===================== 裝備庫：武器、彈藥、裝甲、支援裝備、載具設計與造價（以 LatoArmory／LatoVehicle 運算庫計算） =====================
   武器可以連結彈藥：由外彈道與終端彈道算出有效射程上的穿深（毫米 RHA）、聚能裝藥的比例與每發價格，再換成作戰用的穿甲等級；
   裝甲設計以材料分層（含傾角、間隙、複合裝甲、反應裝甲）算出正面、側面、後方、頂部對動能與化學能的等效厚度，套用到單位類型；
   LatoArmory 的彈藥庫與 LatoVehicle 的載具設計檔可以直接匯入，載具設計可以生成單位類型（含依彈藥計算的主武器）。 */
/* ---------- 幣值：每位觀看者自己選（東銀圓／美元），1 東銀圓預設等於 2.5 美元 ---------- */
/* 幣種：內建東銀圓（預設 1 東銀圓＝2.5 美元，也是 LatoArmory 運算庫的計價單位）、美元，以及使用者自訂的原創幣種（各自掛勾美元）；
   想定本身的貨幣（平民財產用，G.set.cur）設定了美元匯率時也可以拿來顯示。所有造價內部以美元計算。 */
function dyTxt(d){d=+d||0;return d>=1e8?fx(d/1e8,d>=1e9?1:2)+' 億東銀圓':d>=1e4?fmt(Math.round(d/1e4))+' 萬東銀圓':fx(d,d<10?2:0)+' 東銀圓';}
function curAll(){var L=[{k:'dy',n:'東銀圓',sym:'',usd:CUR.rate>0?CUR.rate:2.5,b:1},{k:'usd',n:'美元',sym:'US$',usd:1,b:1}];CUR.list.forEach(function(c){L.push(c);});
  if(typeof G!=='undefined'&&G&&G.set&&G.set.cur&&G.set.cur.usd>0)L.push({k:'scn',n:G.set.cur.n||'元',sym:G.set.cur.sym||'',usd:G.set.cur.usd,scn:1});return L;}
function curOf(k){var L=curAll();return L.filter(function(c){return c.k===k;})[0]||L[0];}
function curFmt(v,c){v=+v||0;var a=Math.abs(v),U=a>=1e12?[1e12,'兆']:a>=1e8?[1e8,'億']:a>=1e4?[1e4,'萬']:[1,''],x=v/U[0],ax=Math.abs(x),num=U[0]>1?(ax>=1000?fmt(Math.round(x)):fx(x,ax>=100?0:ax>=10?1:2)):(ax<10?fx(x,2):fmt(Math.round(x)));
  return c.sym?c.sym+num+(U[1]?' '+U[1]:''):num+(U[1]?' '+U[1]:' ')+c.n;}
/* 美元金額 → 目前選的幣種（可附美元對照） */
function amoney(usd){usd=+usd||0;var c=curOf(CUR.sel),s=curFmt(usd/c.usd,c);if(CUR.show==='both'&&c.k!=='usd')s+='（'+usdTxt(usd)+'）';return s;}
function curName(){return curOf(CUR.sel).n;}
/* ---------- 材料與彈藥（內建＋自訂） ---------- */
function kindN(P){return LAL&&LAL.KINDN[P.k]||P.k;}
function grpN(g){return LAL&&LAL.GROUPS[g]?LAL.GROUPS[g][0]:g;}
/* ---------- 武器 ↔ 彈藥：有效射程上的最佳穿深、聚能比例、每發價格與重量 ---------- */

/* ---------- 裝備庫對話框 ---------- */
var AR={tab:'w',ag:'',aq:'',rg:1000,ang:0,vbr:'l',ed:null,xr:null,xp:'t120m829a1',xz:'f',xrg:1000};
var ARTABS=[['w','武器'],['a','彈藥'],['r','裝甲'],['e','支援裝備'],['v','載具設計'],['c','造價']];
function armoryDlg(tab){if(!G)return;if(tab)AR.tab=tab;var o='<h3 style="margin:0 0 6px">裝備庫 <span class="lw-note">（LatoArmory 物理模型'+(LAL?'':'：未載入')+'）</span></h3><div class="lw-row" style="flex-wrap:wrap;gap:4px">'+ARTABS.map(function(t){return '<button type="button" class="lw-btn sm'+(AR.tab===t[0]?' pri':'')+'" data-a="artab" data-v="'+t[0]+'">'+t[1]+'</button>';}).join('')+
    '<span style="flex:1"></span><label class="lw-btn sm" title="匯入 LatoArmory 的彈藥與材料庫（lato-armory-library.json）、LatoVehicle 載具設計（lato-vehicle-*.json）或本程式的武器裝備檔">⇧ 匯入 LatoArmory 檔<input type="file" accept=".json,application/json" data-c="arimp" hidden></label></div><div class="lw-arm" data-k="armbody">';
  o+=AR.tab==='a'?armAHtml():AR.tab==='r'?armRHtml():AR.tab==='e'?armEHtml():AR.tab==='v'?armVHtml():AR.tab==='c'?armCHtml():armWHtml();
  o+='</div><div class="lw-row" style="flex-wrap:wrap">'+(typeof armsBtns==='function'?armsBtns():'')+'<button type="button" class="lw-btn" data-a="x">關閉</button></div>';UI.wdlg&&UI.wdlg.remove();UI.wdlg=dlg(o,true);if(AR.tab==='a')armAFill();if(AR.tab==='r')armRFill();if(AR.tab==='v')armVFill();}
ACT.artab=function(b){armoryDlg(b.getAttribute('data-v'));};
ACT.wpnlib=function(){armoryDlg('w');};
wpnLibDlg=function(){armoryDlg('w');};
ACT.armory=function(b){armoryDlg(b&&b.getAttribute&&b.getAttribute('data-v')||undefined);};

/* ---------- 武器 ---------- */
function armWHtml(){var L=wpnList().filter(function(w){return (!WL.cat||w.cat===WL.cat)&&(!WL.q||w.n.indexOf(WL.q)>=0);}).sort(function(a,b){return a.cat<b.cat?-1:a.cat>b.cat?1:a.y-b.y;}),cu=G.wpns||{};
  var o='<div class="lw-note">武器的殺傷、穿甲、壓制、射程與精度依數量加總成單位火力（與時代標準配備相比）。連結彈藥後可由 LatoArmory 算出有效射程上的穿深（毫米 RHA）、聚能裝藥比例與每發價格；「穿甲等級」是作戰用的換算值。</div>'+
    '<div class="lw-row"><label>類別 <select data-c="wlcat"><option value="">全部</option>'+wpnCats().map(function(c){return '<option'+(WL.cat===c?' selected':'')+'>'+esc(c)+'</option>';}).join('')+'</select></label><label>搜尋 <input type="text" value="'+esc(WL.q)+'" data-c="wlq" style="width:9em"></label><button type="button" class="lw-btn sm pri" data-a="wlnew">＋新增自訂武器</button></div>'+
    '<div class="lw-sc" style="max-height:56vh;overflow:auto"><table class="lw-tbl"><tr><th>武器</th><th>類別</th><th class="n">年代</th><th class="n">對人</th><th class="n">對裝甲</th><th class="n">穿甲等級</th><th>彈藥與物理穿深</th><th class="n">聚能</th><th class="n">單價</th><th class="n">每發</th><th></th></tr>';
  L.forEach(function(w){var mod=!!cu[w.k],custom=!WPNO[w.k],am=wAmmo(w),ph=am.length&&LAL?wPhys(w):null;
    o+='<tr><td>'+esc(w.n)+(custom?' <span class="lw-pill">自訂</span>':mod?' <span class="lw-pill">已修改</span>':'')+'</td><td>'+esc(w.cat)+'</td><td class="n">'+w.y+'</td><td class="n">'+fx(w.pP,3)+'</td><td class="n">'+fx(w.pA,3)+'</td><td class="n">'+fx(w.pen,1)+'</td><td class="w">'+
      (ph?ph.rows.map(function(r){return esc(r.P.n.replace(/（.*?）/g,''))+(am.length>1?' ×'+fx(r.s,2):'');}).join('、')+'<br><span class="lw-note">'+(ph.mm?fmt(ph.mm)+' mm（'+(ph.R?kmTxt(ph.R):'直射')+'）≈ 等級 '+fx(ph.lv,1):'—')+'</span>':'<span class="lw-note">未連結</span>')+'</td><td class="n">'+pct(wCe(w)*100)+'</td><td class="n">'+amoney(wUsd(w))+'</td><td class="n">'+amoney(wRUsd(w))+'</td>'+
      '<td><button type="button" class="lw-btn sm" data-a="wled" data-v="'+w.k+'">'+(WPNO[w.k]?'檢視':'設計')+'</button><button type="button" class="lw-btn sm" data-a="wlcp" data-v="'+w.k+'">複製</button></td></tr>';});
  return o+'</table></div>';}
CHG.wlcat=function(t){WL.cat=t.value;armoryDlg('w');};
CHG.wlq=function(t){WL.q=t.value.trim();armoryDlg('w');};
/* 武器設計：接上「彈藥」區（只列與藍本同類、口徑相近的彈藥；穿甲、聚能比例、每發價格與重量由彈藥自動換算） */
(function(){var b=wpnEdDlg;wpnEdDlg=function(){b();var E=WL.edit,w=E.w,d=UI.wdlg&&UI.wdlg.firstChild;if(!d||E.ro)return;
  var rows=d.querySelectorAll('.lw-row'),last=rows[rows.length-1],s=document.createElement('div');s.innerHTML=armWAmmoHtml(w);if(last)d.insertBefore(s,last);else d.appendChild(s);};})();
function armWAmmoHtml(w){if(!LAL)return '<div class="lw-note">（未載入 LatoArmory 運算庫，無法連結彈藥）</div>';var am=w.am||wAmmo(w.dz&&WPNO[w.dz.b]||w)||[],ph=wPhys(Object.assign({},w,{am:am})),fit=rlAmFit(w);
  var o='<h4 style="margin:8px 0 4px">彈藥（LatoArmory）</h4><table class="lw-tbl"><tr><th>彈藥</th><th>種類</th><th class="n">比例</th><th class="n">穿深 mm</th><th class="n">每發</th><th class="n">重量</th><th></th></tr>';
  ph.rows.forEach(function(r,i){o+='<tr><td>'+esc(r.P.n)+'</td><td>'+esc(kindN(r.P))+'</td><td class="n"><input type="number" step="0.05" min="0" max="1" value="'+r.s+'" data-c="wamsh" data-v="'+i+'" style="width:60px"></td><td class="n">'+(r.mm?fmt(r.mm):'—')+'</td><td class="n">'+amoney(r.usd)+'</td><td class="n">'+fx(r.kg,2)+' kg</td><td><button type="button" class="lw-btn sm dng" data-a="wamdel" data-v="'+i+'">移除</button></td></tr>';});
  var gs={};projList().forEach(function(P){if(fit(P))(gs[P.g]=gs[P.g]||[]).push(P);});
  o+='</table><div class="lw-row"><select data-k="wamadd">'+Object.keys(gs).map(function(g){return '<optgroup label="'+esc(grpN(g))+'">'+gs[g].map(function(P){return '<option value="'+esc(P.id)+'">'+esc(P.n)+'</option>';}).join('')+'</optgroup>';}).join('')+'</select><button type="button" class="lw-btn sm" data-a="wamadd">加入彈藥</button>'+
    ''+(ph.rows.length?'<div class="lw-note">有效射程 '+(ph.R?kmTxt(ph.R):'（間接或導引）')+'：最佳穿深 '+fmt(ph.mm)+' mm RHA ≈ 穿甲等級 '+fx(ph.lv,1)+'；聚能比例 '+pct(ph.ce*100)+'；平均每發 '+amoney(ph.usd)+'、'+fx(ph.kg,2)+' 公斤（含包裝）。</div>':'');return o;}
function wamEdit(f){var E=WL.edit;if(!E)return;var w=E.w;if(!w.am)w.am=clone(wAmmo(w.dz&&WPNO[w.dz.b]||w));f(w.am);wpnEdDlg();}
CHG.wamsh=function(t){var i=+t.getAttribute('data-v'),v=clamp(+t.value||0,0,1);wamEdit(function(A){if(A[i])A[i][1]=v;});};
ACT.wamdel=function(b){var i=+b.getAttribute('data-v');wamEdit(function(A){A.splice(i,1);});};
ACT.wamadd=function(b){var d=UI.wdlg&&UI.wdlg.querySelector('[data-k="wamadd"]');if(!d)return;var id=d.value;wamEdit(function(A){if(!A.some(function(x){return x[0]===id;}))A.push([id,A.length?0.3:1]);});};

/* ---------- 彈藥 ---------- */
function armAHtml(){var L=armAList();var gs={};projList().forEach(function(P){gs[P.g]=1;});
  var o='<div class="lw-note">LatoArmory 的彈藥庫（內建已校準到公開的穿深與合約價量級）。穿深是對均質軋延裝甲鋼（RHA）、垂直入射的極限厚度；聚能裝藥與高爆彈與距離無關。點「詳細」看對各種材料、各傾角的穿深、飛行速度與成本分解。</div>'+
    '<div class="lw-row"><label>類別 <select data-c="arag"><option value="">全部</option>'+Object.keys(gs).map(function(g){return '<option value="'+g+'"'+(AR.ag===g?' selected':'')+'>'+esc(grpN(g))+'</option>';}).join('')+'</select></label><label>搜尋 <input type="text" value="'+esc(AR.aq)+'" data-c="araq" style="width:9em"></label><button type="button" class="lw-btn sm pri" data-a="aranew">＋新增自訂彈藥</button></div>'+
    '<div class="lw-sc" style="max-height:56vh;overflow:auto"><table class="lw-tbl"><tr><th>彈藥</th><th>種類</th><th class="n">口徑</th><th class="n">初速</th><th class="n">0 m</th><th class="n">500 m</th><th class="n">1 km</th><th class="n">2 km</th><th class="n">每發</th><th class="n">全彈重</th><th></th></tr>';
  L.forEach(function(P,i){o+='<tr><td>'+esc(P.n)+(G.ammo&&G.ammo[P.id]?' <span class="lw-pill">自訂</span>':'')+'</td><td>'+esc(kindN(P))+'</td><td class="n">'+fx(P.d,1)+' mm</td><td class="n">'+fmt(P.v0)+' m/s</td>'+[0,500,1000,2000].map(function(R,j){var k=P.id+'|'+(P._v||0)+'|'+R+'|rha|0';return '<td class="n" data-k="apc" data-i="'+i+'" data-r="'+j+'">'+(PCA[k]!==undefined?(PCA[k]?fmt(PCA[k]):'—'):'…')+'</td>';}).join('')+
    '<td class="n">'+amoney(pUsd(P))+'</td><td class="n">'+fx(pKg(P),2)+' kg</td><td><button type="button" class="lw-btn sm" data-a="aradet" data-v="'+esc(P.id)+'">詳細</button></td></tr>';});
  return o+'</table></div>';}
function armAList(){return projList().filter(function(P){return (!AR.ag||P.g===AR.ag)&&(!AR.aq||P.n.indexOf(AR.aq)>=0);});}
/* 逐列補算穿深，不讓畫面卡住 */
function armAFill(){var L=armAList(),cells=UI.wdlg?Array.prototype.slice.call(UI.wdlg.querySelectorAll('td[data-k="apc"]')):[],i=0;var step=function(){var t0=Date.now();while(i<cells.length&&Date.now()-t0<30){var c=cells[i++];if(c.textContent!=='…')continue;var P=L[+c.getAttribute('data-i')],R=[0,500,1000,2000][+c.getAttribute('data-r')],v=penAt(P,R);c.textContent=v?fmt(v):'—';}if(i<cells.length&&UI.wdlg&&document.body.contains(UI.wdlg))setTimeout(step,0);};setTimeout(step,0);}
CHG.arag=function(t){AR.ag=t.value;armoryDlg('a');};CHG.araq=function(t){AR.aq=t.value.trim();armoryDlg('a');};
var ARMATS=['rha','hha','cast','al5083','al7039','ti64','al2o3','sic','b4c','chob','dumesh','conc','rconc','brick','sand','soil','oak','glass'];
ACT.aradet=function(b){armADet(b.getAttribute('data-v'));};
function armADet(id){var P=projOf(id);if(!P||!LAL)return;var o='<h3 style="margin:0 0 4px">'+esc(P.n)+'</h3><div class="lw-note">'+esc(grpN(P.g))+'・'+esc(kindN(P))+'・口徑 '+fx(P.d,1)+' mm・彈頭 '+fx(P.m,1)+' g・初速 '+fmt(P.v0)+' m/s</div>';
  o+='<div class="lw-row"><label>距離 <select data-c="arrg">'+[0,250,500,1000,1500,2000,3000].map(function(R){return '<option value="'+R+'"'+(AR.rg===R?' selected':'')+'>'+(R?kmTxt(R):'砲口')+'</option>';}).join('')+'</select></label><label>傾角 <select data-c="arang">'+[0,30,45,60,70].map(function(a){return '<option value="'+a+'"'+(AR.ang===a?' selected':'')+'>'+a+'°</option>';}).join('')+'</select></label></div>';
  o+='<table class="lw-tbl"><tr><th>材料</th><th class="n">可擊穿厚度</th><th class="n">等於 RHA</th></tr>';var rha=penAt(P,AR.rg,'rha',AR.ang)||0;
  ARMATS.forEach(function(mid){var M=matOf(mid);if(!M)return;var v=penAt(P,AR.rg,mid,AR.ang);o+='<tr><td>'+esc(M.n)+'</td><td class="n">'+(v?fmt(v)+' mm':'—')+'</td><td class="n">'+(v&&rha?fx(rha/v,2)+' ×':'—')+'</td></tr>';});o+='</table>';
  if(P.k!=='sc'&&!P.guided&&P.v0>100){o+='<h4 style="margin:8px 0 4px">飛行</h4><div class="lw-note">';try{o+=[0,500,1000,2000,3000].map(function(R){return (R?kmTxt(R):'砲口')+' '+fmt(LAL.velAt(P,R))+' m/s';}).join('、');}catch(e){}o+='</div>';}
  try{var c=LAL.costOf(P,lalO());o+='<h4 style="margin:8px 0 4px">成本分解（每發 '+amoney(c.usd)+'）</h4><div class="lw-note">'+c.raw.parts.map(function(q){return esc(q[0])+' '+amoney(q[1]*c.cx*c.learn*c.mk);}).join('、')+'；製造複雜度 ×'+fx(c.cx,2)+'</div>';}catch(e){}
  o+='<div class="lw-row"><button type="button" class="lw-btn sm" data-a="aracp" data-v="'+esc(id)+'">複製為自訂彈藥</button>'+(G.ammo&&G.ammo[id]?'<button type="button" class="lw-btn sm" data-a="araed" data-v="'+esc(id)+'">編輯</button><button type="button" class="lw-btn sm dng" data-a="aradel" data-v="'+esc(id)+'">刪除</button>':'')+'<button type="button" class="lw-btn sm" data-a="artab" data-v="a">返回</button></div>';
  AR.cur=id;UI.wdlg&&UI.wdlg.remove();UI.wdlg=dlg(o,true);}
CHG.arrg=function(t){AR.rg=+t.value;armADet(AR.cur);};CHG.arang=function(t){AR.ang=+t.value;armADet(AR.cur);};
ACT.aracp=function(b){var P=projOf(b.getAttribute('data-v'));if(!P)return;G.aseq=(G.aseq||0)+1;var q=clone(P);q.id='ca'+G.aseq;while(LALP[q.id]||G.ammo&&G.ammo[q.id]){G.aseq++;q.id='ca'+G.aseq;}q.n=P.n+'（改）';q.base=LALP[P.id]?P.id:(P.base||'');delete q.cx;delete q.ref;q._v=1;rlRound(q,[]);G.ammo=G.ammo||{};G.ammo[q.id]=q;AR.rlN=[];armAEd(q.id);};
ACT.aranew=function(){var base=LALP.r556m855||projList()[0];if(!base)return;ACT.aracp({getAttribute:function(){return base.id;}});};
ACT.araed=function(b){armAEd(b.getAttribute('data-v'));};
ACT.aradel=function(b){var id=b.getAttribute('data-v');if(G.ammo)delete G.ammo[id];armoryDlg('a');};
/* 自訂彈藥：依種類開放主要參數 */
/* 只開放設計參數；彈道係數、發射藥、全彈重量與價格由設計算出，並受現實上限約束（h80_real.js） */
var AFD=[['n','名稱','t'],['d','口徑（mm）','n'],['m','彈頭質量（g）','n'],['v0','初速（m/s）','n']];
function armAEd(id){var P=G.ammo&&G.ammo[id];if(!P)return;var o='<h3 style="margin:0 0 6px">自訂彈藥</h3><div class="lw-grid" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:4px 10px">';
  var inp=function(path,label,v,type){return '<label style="font-size:12px;display:block">'+label+'<br><input type="'+(type==='t'?'text':'number')+'" step="any" value="'+esc(v===undefined?'':v)+'" data-c="araf" data-f="'+path+'" style="width:100%"></label>';};
  AFD.forEach(function(f){o+=inp(f[0],f[1],P[f[0]],f[2]);});
  o+='<label style="font-size:12px;display:block">種類<br><select data-c="araf" data-f="k" style="width:100%">'+Object.keys(LAL.KINDN).map(function(k){return '<option value="'+k+'"'+(P.k===k?' selected':'')+'>'+esc(LAL.KINDN[k])+'</option>';}).join('')+'</select></label>';
  o+='<label style="font-size:12px;display:block">類別<br><select data-c="araf" data-f="g" style="width:100%">'+Object.keys(LAL.GROUPS).map(function(g){return '<option value="'+g+'"'+(P.g===g?' selected':'')+'>'+esc(LAL.GROUPS[g][0])+'</option>';}).join('')+'</select></label>';
  if(P.k==='core'||P.k==='lr'){var C=P.core||(P.core={mat:'hsteel',m:P.m*0.5,d:P.d*0.7});o+='<label style="font-size:12px;display:block">彈芯材料<br><select data-c="araf" data-f="core.mat" style="width:100%">'+matList().filter(function(M){return M.yp||M.cat==='metal'||M.cat==='ceramic';}).map(function(M){return '<option value="'+M.id+'"'+(C.mat===M.id?' selected':'')+'>'+esc(M.n)+'</option>';}).join('')+'</select></label>'+
    inp('core.d','彈芯直徑（mm）',C.d)+(P.k==='lr'?inp('core.L','長桿長度（mm）',C.L):inp('core.m','彈芯質量（g）',C.m));}
  if(P.k==='sc'){var S=P.sc||(P.sc={cd:P.d*0.8,k:6,pr:4,so:3});o+=inp('sc.cd','藥型罩直徑（mm）',S.cd)+inp('sc.so','炸高（倍藥型罩直徑）',S.so)+'<label style="font-size:12px;display:block">串聯彈頭<br><select data-c="araf" data-f="sc.tan" style="width:100%"><option value="0"'+(S.tan?'':' selected')+'>否</option><option value="1"'+(S.tan?' selected':'')+'>是（可突破反應裝甲）</option></select></label>';}
  if(P.k==='he'||P.k==='hesh'||P.k==='sc'){var H=P.he||(P.he={x:'compb',g:P.m*0.15,tw:3});o+=inp('he.g','炸藥（g）',H.g)+'<label style="font-size:12px;display:block">炸藥種類<br><select data-c="araf" data-f="he.x" style="width:100%">'+Object.keys(LAL.EXPL).map(function(x){return '<option value="'+x+'"'+(H.x===x?' selected':'')+'>'+esc(LAL.EXPL[x][0])+'</option>';}).join('')+'</select></label>';}
  var B0=P.base&&LALP[P.base];o+='</div><div class="lw-note">藍本：'+(B0?esc(B0.n):'—')+'；彈道係數 '+fx(P.bc||0,3)+'、發射藥 '+fx(P.prop||0,2)+' g、全彈 '+fx(pKg(P),3)+' kg（由設計算出）。'+(AR.rlN&&AR.rlN.length?'<br>已依現實限制調整：'+esc(AR.rlN.join('；')):'')+'</div><div class="lw-note">預覽：'+[0,1000,2000].map(function(R){var v=penAt(P,R);return (R?kmTxt(R):'砲口')+' '+(v?fmt(v)+' mm':'—');}).join('、')+'；每發 '+amoney(pUsd(P))+'</div><div class="lw-row"><button type="button" class="lw-btn pri" data-a="aradet" data-v="'+esc(id)+'">完成</button></div>';
  AR.cur=id;UI.wdlg&&UI.wdlg.remove();UI.wdlg=dlg(o,true);}
CHG.araf=function(t){var P=G.ammo&&G.ammo[AR.cur];if(!P)return;var f=t.getAttribute('data-f').split('.'),v=t.type==='number'?(+t.value||0):t.value;if(f[1]==='tan')v=+v;var o=P;for(var i=0;i<f.length-1;i++)o=o[f[i]]||(o[f[i]]={});o[f[f.length-1]]=v;P._v=(P._v||0)+1;var N=[];rlRound(P,N);AR.rlN=N;PCA={};armAEd(AR.cur);};

/* ---------- 裝甲設計 ---------- */
var ARZ=[['f','正面'],['s','側面'],['r','後方'],['t','頂部']];
var ARPRE=[{id:'ar_m4',n:'二戰中型戰車（雪曼類）',z:{f:[['rha',51,56]],s:[['rha',38,0]],r:[['rha',38,0]],t:[['rha',19,0]]}},{id:'ar_t34',n:'二戰中型戰車（傾斜裝甲，T-34 類）',z:{f:[['rha',45,60]],s:[['rha',45,40]],r:[['rha',40,45]],t:[['rha',20,0]]}},
  {id:'ar_tiger',n:'二戰重型戰車（虎式類）',z:{f:[['rha',100,10]],s:[['rha',80,0]],r:[['rha',80,0]],t:[['rha',25,0]]}},{id:'ar_m113',n:'鋁合金裝甲運兵車（M113 類）',z:{f:[['al5083',38,45]],s:[['al5083',44,0]],r:[['al5083',38,0]],t:[['al5083',38,0]]}},
  {id:'ar_bmp',n:'輕裝甲步兵戰車（BMP 類）',z:{f:[['rha',19,57]],s:[['rha',16,0]],r:[['rha',16,0]],t:[['rha',6,0]]}},{id:'ar_m2',n:'間隙裝甲步兵戰車（布萊德雷類）',z:{f:[['hha',6,60,25],['al5083',25,60]],s:[['hha',6,0,100],['al5083',25,0]],r:[['al5083',25,0]],t:[['al5083',25,0]]}},
  {id:'ar_t72b',n:'複合裝甲＋重型反應裝甲（T-72B 類）',z:{f:[['k5',15,68],['rha',60,68],['chob',100,68],['rha',50,68]],s:[['rha',70,0]],r:[['rha',40,0]],t:[['rha',30,0]]}},{id:'ar_m1',n:'貧鈾網複合裝甲（M1A2 類）',z:{f:[['rha',60,0],['dumesh',520,0],['rha',40,0]],s:[['hha',6,0,450],['chob',100,0],['rha',40,0]],r:[['rha',40,0]],t:[['rha',30,0]]}},
  {id:'ar_mrap',n:'防地雷反伏擊車（MRAP 類）',z:{f:[['hha',12,30]],s:[['hha',12,0]],r:[['hha',10,0]],t:[['hha',8,0]]}}];
function arList(){var o=ARPRE.slice();if(G.armor)for(var k in G.armor)o.push(G.armor[k]);return o;}
function arOf(id){if(G.armor&&G.armor[id])return G.armor[id];for(var i=0;i<ARPRE.length;i++)if(ARPRE[i].id===id)return ARPRE[i];return null;}
function layOf(a){return {mat:a[0],t:+a[1]||0,ang:+a[2]||0,gap:+a[3]||0};}
var ARCTX=null;
function arCtx(){if(!LVL)return null;if(!ARCTX||ARCTX._n!==matList().length){ARCTX=LVL.ctxOf({mats:matList()});ARCTX._n=matList().length;}return ARCTX;}
/* 一個區域的等效厚度（對參考長桿彈的動能、對聚能裝藥的化學能） */
function zoneEqv(L){var C=arCtx(),ref=LALP.t120m829a1;if(!C||!ref||!L.length)return {ke:0,ce:0,ad:0};var key=JSON.stringify(L);if(ARCA[key])return ARCA[key];var r={ke:0,ce:0,ad:0};
  try{var q=LVL.zoneEq(L.map(layOf),C,ref);r.ke=isFinite(q.ke)?q.ke:isFinite(q.keMin)?q.keMin:3000;r.ce=isFinite(q.ce)?q.ce:3000;if(q.slat)r.slat=q.slat;r.ad=LVL.adOf(L.map(layOf),C.mats);}catch(e){r.err=e.message;}ARCA[key]=r;return r;}
function arEval(A){var z={};ARZ.forEach(function(q){z[q[0]]=zoneEqv((A.z&&A.z[q[0]])||[]);});var t=Math.max(z.r.ke,z.t.ke)?(z.r.ke+z.t.ke)/2:0,tc=Math.max(z.r.ce,z.t.ce)?(z.r.ce+z.t.ce)/2:0;
  return {z:z,arm:armLvOfZones(z.f.ke,z.s.ke,t),armC:armLvOfZones(z.f.ce,z.s.ce,tc)};}
function armRHtml(){var o='<div class="lw-note">以材料分層設計各方向的裝甲（厚度、傾角、間隙；可用複合裝甲與反應裝甲），算出對動能穿甲彈（以 120 公釐長桿彈為參考）與對聚能裝藥的等效 RHA 厚度，再換成作戰用的裝甲等級（正面 45%、側面 40%、後方與頂部 15% 加權）。可套用到單位類型，或用「射擊試驗」看某種彈藥能不能擊穿。</div>'+
    '<div class="lw-row"><button type="button" class="lw-btn sm pri" data-a="arrnew">＋新增裝甲設計</button>'+(LVL?'<label>從載具設計取用 <select data-c="arrdes"><option value="">（選擇）</option>'+vdesList().filter(function(d){return d.br==='l';}).map(function(d){return '<option value="'+esc(d.id)+'">'+esc(d.n)+'</option>';}).join('')+'</select></label>':'')+'</div>'+
    '<div class="lw-sc" style="max-height:56vh;overflow:auto"><table class="lw-tbl"><tr><th>裝甲</th>'+ARZ.map(function(q){return '<th class="n">'+q[1]+'<br><span class="lw-note">動能／化學能</span></th>';}).join('')+'<th class="n">裝甲等級</th><th class="n">對聚能</th><th></th></tr>';
  arList().forEach(function(A,i){o+='<tr><td>'+esc(A.n)+(G.armor&&G.armor[A.id]?' <span class="lw-pill">自訂</span>':'')+'</td>'+ARZ.map(function(q){return '<td class="n" data-k="arc" data-i="'+i+'" data-z="'+q[0]+'">…</td>';}).join('')+'<td class="n" data-k="arl" data-i="'+i+'">…</td><td class="n" data-k="arlc" data-i="'+i+'">…</td><td><button type="button" class="lw-btn sm" data-a="arred" data-v="'+esc(A.id)+'">'+(G.armor&&G.armor[A.id]?'編輯':'檢視')+'</button><button type="button" class="lw-btn sm" data-a="arrcp" data-v="'+esc(A.id)+'">複製</button></td></tr>';});
  return o+'</table></div>';}
function armRFill(){var L=arList(),i=0;var step=function(){if(!UI.wdlg||!document.body.contains(UI.wdlg))return;var t0=Date.now();while(i<L.length&&Date.now()-t0<40){var A=L[i],R=arEval(A),k=i;ARZ.forEach(function(q){var c=UI.wdlg.querySelector('td[data-k="arc"][data-i="'+k+'"][data-z="'+q[0]+'"]');if(c)c.textContent=fmt(R.z[q[0]].ke)+'／'+(R.z[q[0]].ce>=3000?'∞':fmt(R.z[q[0]].ce));});
    var a=UI.wdlg.querySelector('td[data-k="arl"][data-i="'+k+'"]'),b=UI.wdlg.querySelector('td[data-k="arlc"][data-i="'+k+'"]');if(a)a.textContent=fx(R.arm,1);if(b)b.textContent=fx(R.armC,1);i++;}if(i<L.length)setTimeout(step,0);};setTimeout(step,0);}
ACT.arrnew=function(){G.arseq=(G.arseq||0)+1;var id='car'+G.arseq;G.armor=G.armor||{};G.armor[id]={id:id,n:'自訂裝甲 '+G.arseq,z:{f:[['rha',50,0]],s:[['rha',30,0]],r:[['rha',20,0]],t:[['rha',15,0]]}};armREd(id);};
ACT.arrcp=function(b){var A=arOf(b.getAttribute('data-v'));if(!A)return;G.arseq=(G.arseq||0)+1;var id='car'+G.arseq;G.armor=G.armor||{};G.armor[id]={id:id,n:A.n+'（改）',z:clone(A.z)};armREd(id);};
CHG.arrdes=function(t){var d=vdesOf(t.value);if(!d)return;var Z=d.zones||{};G.arseq=(G.arseq||0)+1;var id='car'+G.arseq;G.armor=G.armor||{};G.armor[id]={id:id,n:d.n+' 裝甲',z:{f:clone(Z.tf||Z.hf||[]),s:clone(Z.hs||Z.ts||[]),r:clone(Z.rr||[]),t:clone(Z.tp||[])}};armREd(id);};
ACT.arred=function(b){armREd(b.getAttribute('data-v'));};
function armREd(id){var A=arOf(id);if(!A)return;var own=!!(G.armor&&G.armor[id]),R=arEval(A),M=matList();AR.cur=id;
  var o='<h3 style="margin:0 0 6px">'+(own?'<input type="text" value="'+esc(A.n)+'" data-c="arrn" style="width:20em">':esc(A.n))+'</h3>';
  ARZ.forEach(function(q){var L=A.z[q[0]]||[],E=R.z[q[0]];o+='<div style="margin:6px 0"><b>'+q[1]+'</b> <span class="lw-note">動能 '+fmt(E.ke)+' mm、化學能 '+(E.ce>=3000?'無法擊穿':fmt(E.ce)+' mm')+'、面密度 '+fmt(E.ad)+' kg/m²'+(E.slat?'、柵欄攔截 '+pct(E.slat*100):'')+'</span><table class="lw-tbl"><tr><th>材料（外→內）</th><th class="n">厚度 mm</th><th class="n">傾角°</th><th class="n">前方間隙 mm</th><th></th></tr>'+
    L.map(function(l,j){return '<tr><td>'+(own?'<select data-c="arrl" data-z="'+q[0]+'" data-j="'+j+'" data-f="0">'+M.map(function(m){return '<option value="'+m.id+'"'+(m.id===l[0]?' selected':'')+'>'+esc(m.n)+'</option>';}).join('')+'</select>':esc((matOf(l[0])||{n:l[0]}).n))+'</td>'+[1,2,3].map(function(f){return '<td class="n">'+(own?'<input type="number" step="any" min="0" value="'+(l[f]||0)+'" data-c="arrl" data-z="'+q[0]+'" data-j="'+j+'" data-f="'+f+'" style="width:64px">':(l[f]||0))+'</td>';}).join('')+'<td>'+(own?'<button type="button" class="lw-btn sm dng" data-a="arrld" data-z="'+q[0]+'" data-j="'+j+'">✕</button>':'')+'</td></tr>';}).join('')+'</table>'+(own?'<button type="button" class="lw-btn sm" data-a="arrla" data-z="'+q[0]+'">＋加一層</button>':'')+'</div>';});
  o+='<div class="lw-kv"><span>裝甲等級</span><span>對動能 <b>'+fx(R.arm,1)+'</b>、對化學能 <b>'+fx(R.armC,1)+'</b>（作戰換算）</span></div>';
  o+='<h4 style="margin:8px 0 4px">射擊試驗</h4><div class="lw-row"><select data-k="arxp">'+projList().filter(function(P){return /tank|auto|hmg|rkt|art|gren|rifle/.test(P.g);}).map(function(P){return '<option value="'+esc(P.id)+'"'+(AR.xp===P.id?' selected':'')+'>'+esc(P.n)+'</option>';}).join('')+'</select><select data-k="arxz">'+ARZ.map(function(q){return '<option value="'+q[0]+'"'+(AR.xz===q[0]?' selected':'')+'>'+q[1]+'</option>';}).join('')+'</select><select data-k="arxr">'+[0,500,1000,2000,3000].map(function(r){return '<option value="'+r+'"'+(AR.xrg===r?' selected':'')+'>'+(r?kmTxt(r):'近距離')+'</option>';}).join('')+'</select><button type="button" class="lw-btn sm" data-a="arxfire">試射</button></div>'+(AR.xr?'<div class="lw-note">'+AR.xr+'</div>':'');
  o+='<h4 style="margin:8px 0 4px">套用</h4><div class="lw-row"><select data-k="arty">'+Object.keys(G.types||{}).map(function(k){return '<option value="'+k+'">（自訂）'+esc(G.types[k].n)+'</option>';}).join('')+Object.keys(UT).filter(function(k){return UT[k].veh>0&&UT[k].dom==='land';}).map(function(k){return '<option value="'+k+'">'+esc(UT[k].n)+'（'+esc((ERAI[UT[k].era]||{}).n||'')+'，另存為自訂類型）</option>';}).join('')+'</select><button type="button" class="lw-btn sm pri" data-a="arapply">套用到單位類型</button></div>';
  o+='<div class="lw-row">'+(own?'<button type="button" class="lw-btn sm dng" data-a="arrdel">刪除</button>':'')+'<button type="button" class="lw-btn sm" data-a="artab" data-v="r">返回</button></div>';UI.wdlg&&UI.wdlg.remove();UI.wdlg=dlg(o,true);}
function arEd(f){var A=G.armor&&G.armor[AR.cur];if(!A)return;f(A);AR.xr=null;armREd(AR.cur);}
CHG.arrn=function(t){var A=G.armor&&G.armor[AR.cur];if(A)A.n=t.value.slice(0,40)||A.n;};
CHG.arrl=function(t){var z=t.getAttribute('data-z'),j=+t.getAttribute('data-j'),f=+t.getAttribute('data-f');arEd(function(A){var l=A.z[z][j];if(!l)return;l[f]=f===0?t.value:Math.max(0,+t.value||0);});};
ACT.arrld=function(b){var z=b.getAttribute('data-z'),j=+b.getAttribute('data-j');arEd(function(A){A.z[z].splice(j,1);});};
ACT.arrla=function(b){var z=b.getAttribute('data-z');arEd(function(A){(A.z[z]=A.z[z]||[]).push(['rha',10,0,0]);});};
ACT.arrdel=function(){if(G.armor)delete G.armor[AR.cur];armoryDlg('r');};
ACT.arxfire=function(){var d=UI.wdlg;if(!d)return;var P=projOf(d.querySelector('[data-k="arxp"]').value),z=d.querySelector('[data-k="arxz"]').value,rg=+d.querySelector('[data-k="arxr"]').value,A=arOf(AR.cur);AR.xp=P&&P.id;AR.xz=z;AR.xrg=rg;if(!P||!A)return;
  var L=(A.z[z]||[]).map(layOf),txt='';try{var r=LAL.evaluate(P,L,{range:rg,lib:matList()}),E=zoneEqv(A.z[z]||[]),need=P.k==='sc'?E.ce:E.ke,cap=penAt(P,rg)||0;txt=esc(P.n)+'，'+(rg?kmTxt(rg):'近距離')+'射擊'+ARZ.filter(function(q){return q[0]===z;})[0][1]+'：'+(r.perf?'<b style="color:#b3261e">擊穿</b>':'<b style="color:#2e7d32">未擊穿</b>')+(r.ric?'（跳彈）':'')+'；彈藥穿深約 '+fmt(cap)+' mm，此處等效 '+(need>=3000?'無法擊穿':fmt(need)+' mm')+'。';}catch(e){txt='無法計算：'+esc(e.message);}
  AR.xr=txt;armREd(AR.cur);};
ACT.arapply=function(){var d=UI.wdlg,A=arOf(AR.cur);if(!d||!A)return;var k=d.querySelector('[data-k="arty"]').value,R=arEval(A),T;G.types=G.types||{};
  if(G.types[k])T=G.types[k];else{var B=UT[k];if(!B)return;G.tseq=(G.tseq||0)+1;var nk='c'+G.tseq;T=clone(B);T.k=nk;T.n=B.n+'（'+A.n+'）';T.cus=1;G.types[nk]=T;k=nk;}
  T.arm=Math.round(R.arm*10)/10;T.armC=Math.round(R.armC*10)/10;T.ad=A.id;G._tv=(G._tv||1)+1;if(typeof wpnChanged==='function')wpnChanged();toast('「'+T.n+'」的裝甲等級改為 '+fx(T.arm,1)+'（對聚能 '+fx(T.armC,1)+'）。');armREd(AR.cur);};

/* ---------- 支援裝備 ---------- */
var EFXN={pf:['破片殺傷減免','%'],pb:['槍彈殺傷減免','%'],nv:['夜視等級',''],kc:['對聚能裝甲＋',''],kk:['對動能裝甲＋',''],smk:['中彈施放煙幕',''],art:['砲兵系統誤差 ×',''],acc:['直射命中＋','%'],jam:['受無人機攻擊 ×',''],sp:['觀測＋','%'],hot:['熱食',''],pur:['淨水',''],med:['傷重不治減少','%'],
  cs:['通信時間 ×',''],cr:['無線電距離 ×',''],rl:['中繼：距離再 ×',''],cj:['受干擾 ×',''],gm:['防毒面具',''],gs:['防護服',''],det:['毒劑偵檢',''],atr:['神經毒劑解毒',''],dk:['除污',''],ev:['救護後送',''],mq:['醫療品質＋','%'],mr:['開闢雷區通路',''],dg:['構工與挖掘＋','%'],cb:['反砲兵定位','']};
var EFXB={smk:1,hot:1,pur:1,gm:1,gs:1,det:1,atr:1,dk:1,ev:1,mr:1,cb:1};
function efxTxt(F){return Object.keys(F||{}).map(function(k){var n=EFXN[k];if(!n)return '';var v=F[k];return n[0]+(n[1]==='%'?' '+pct(v*100):v===1&&EFXB[k]?'':' '+fx(v,2));}).filter(Boolean).join('、');}
var COVN={m:'每人',v:'每車',u:'單位'};
function armEHtml(){var o='<div class="lw-note">支援裝備依時代與兵種有標準配備（可在單位的「後勤 → 支援裝備」增減）。效果相對於標準配備計算：多配了防彈衣、反應裝甲、主動防護、雷射測距、衛星定位、更好的無線電……就比同類部隊強，少配就弱。通信裝備改變命令與情報的傳遞時間與距離（有上下限），防護裝備決定 CBRN 防護，醫療裝備減少傷重不治，工兵裝備加快構工或開闢雷區。</div><div class="lw-row"><button type="button" class="lw-btn sm pri" data-a="arenew">＋新增自訂支援裝備</button></div>'+
    '<div class="lw-sc" style="max-height:56vh;overflow:auto"><table class="lw-tbl"><tr><th>裝備</th><th>類別</th><th class="n">年代</th><th class="n">單價</th><th class="n">重量</th><th>配發</th><th>效果</th><th></th></tr>';
  seqList().sort(function(a,b){return a.cat<b.cat?-1:a.cat>b.cat?1:a.y-b.y;}).forEach(function(e){o+='<tr><td>'+esc(e.n)+(G.seq&&G.seq[e.k]?' <span class="lw-pill">'+(SEQ[e.k]?'已修改':'自訂')+'</span>':'')+'</td><td>'+esc(e.cat)+'</td><td class="n">'+e.y+'</td><td class="n">'+amoney(e.usd)+'</td><td class="n">'+fx(e.kg,1)+' kg</td><td>'+COVN[e.cov]+'</td><td>'+esc(efxTxt(e.fx))+'</td><td><button type="button" class="lw-btn sm" data-a="areed" data-v="'+e.k+'">編輯</button></td></tr>';});
  return o+'</table></div>';}
ACT.arenew=function(){G.eseq=(G.eseq||0)+1;var k='ce'+G.eseq;G.seq=G.seq||{};G.seq[k]={k:k,n:'自訂裝備 '+G.eseq,cat:'自訂',y:G.set.y,usd:1000,kg:1,cov:'m',fx:{}};armEEd(k);};
ACT.areed=function(b){var k=b.getAttribute('data-v');if(!(G.seq&&G.seq[k])){G.seq=G.seq||{};G.seq[k]=clone(SEQ[k]);}armEEd(k);};
function armEEd(k){var e=G.seq[k];AR.cur=k;var o='<h3 style="margin:0 0 6px">支援裝備</h3><div class="lw-grid" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:4px 10px">'+[['n','名稱','t'],['cat','類別','t'],['y','問世年代','n'],['usd','單價（美元）','n'],['kg','重量（公斤）','n']].map(function(f){return '<label style="font-size:12px;display:block">'+f[1]+'<br><input type="'+(f[2]==='n'?'number':'text')+'" step="any" value="'+esc(e[f[0]])+'" data-c="aref" data-f="'+f[0]+'" style="width:100%"></label>';}).join('')+
    '<label style="font-size:12px;display:block">配發方式<br><select data-c="aref" data-f="cov" style="width:100%">'+Object.keys(COVN).map(function(c){return '<option value="'+c+'"'+(e.cov===c?' selected':'')+'>'+COVN[c]+'</option>';}).join('')+'</select></label>'+
    Object.keys(EFXN).map(function(f){var v=(e.fx||{})[f];return '<label style="font-size:12px;display:block">'+EFXN[f][0]+(EFXN[f][1]==='%'?'（0～1）':'')+'<br><input type="number" step="any" value="'+(v===undefined?'':v)+'" data-c="arefx" data-f="'+f+'" style="width:100%"></label>';}).join('')+'</div>'+
    '<div class="lw-row">'+(SEQ[k]?'<button type="button" class="lw-btn sm" data-a="arerst">恢復內建值</button>':'<button type="button" class="lw-btn sm dng" data-a="aredel">刪除</button>')+'<button type="button" class="lw-btn sm pri" data-a="artab" data-v="e">完成</button></div>';UI.wdlg&&UI.wdlg.remove();UI.wdlg=dlg(o,true);}
function eqChanged(){G.units.forEach(function(u){if(u.lg&&u.lg.eq0)eqRecalc(u);});}
CHG.aref=function(t){var e=G.seq[AR.cur],f=t.getAttribute('data-f');e[f]=t.type==='number'?Math.max(0,+t.value||0):t.value.slice(0,40);eqChanged();};
CHG.arefx=function(t){var e=G.seq[AR.cur],f=t.getAttribute('data-f');e.fx=e.fx||{};if(t.value==='')delete e.fx[f];else e.fx[f]=+t.value;eqChanged();};
ACT.arerst=function(){if(G.seq)delete G.seq[AR.cur];eqChanged();armoryDlg('e');};
ACT.aredel=function(){if(G.seq)delete G.seq[AR.cur];G.units.forEach(function(u){if(u.lg&&u.lg.eq)u.lg.eq=u.lg.eq.filter(function(x){return x[0]!==AR.cur;});});eqChanged();armoryDlg('e');};

/* ---------- 載具設計（LatoVehicle） ---------- */
function armVHtml(){if(!LVL)return '<div class="lw-note">未載入 LatoVehicle 運算庫。</div>';var L=vdesList().filter(function(d){return d.br===AR.vbr;});
  var o='<div class="lw-note">LatoVehicle 的模組化載具設計：底盤、發動機、傳動、主武器、火控、主動防護與各區裝甲，算出重量、速度、航程與單價。陸、空、海軍設計都可以直接「建立單位類型」（空軍依雷達、飛彈、炸彈、機動性與航程，海軍依防空、艦砲、飛彈、魚雷與航速換算）。陸軍設計的主武器依其彈藥算出穿甲，裝甲依各區等效厚度換成等級。也可以匯入在 LatoArmory 匯出的 lato-vehicle-*.json。</div>'+
    '<div class="lw-row">'+[['l','陸軍'],['a','空軍'],['s','海軍']].map(function(b){return '<button type="button" class="lw-btn sm'+(AR.vbr===b[0]?' pri':'')+'" data-a="arvbr" data-v="'+b[0]+'">'+b[1]+'</button>';}).join('')+'</div>'+
    '<div class="lw-sc" style="max-height:56vh;overflow:auto"><table class="lw-tbl"><tr><th>設計</th><th>種類</th><th class="n">年份</th><th class="n">重量</th><th class="n">速度</th><th class="n">單價</th><th></th></tr>';
  L.forEach(function(d,i){var ty=(LVL.TYPES[d.br]||{})[d.ty]||d.ty||'';o+='<tr><td>'+esc(d.n)+(G.vdes&&G.vdes[d.id]?' <span class="lw-pill">匯入</span>':'')+'</td><td>'+esc(ty)+'</td><td class="n">'+(d.yr||'')+'</td><td class="n" data-k="avm" data-i="'+i+'">…</td><td class="n" data-k="avs" data-i="'+i+'">…</td><td class="n" data-k="avc" data-i="'+i+'">…</td><td><button type="button" class="lw-btn sm" data-a="arvdet" data-v="'+esc(d.id)+'">詳細</button></td></tr>';});
  return o+'</table></div>';}
ACT.arvbr=function(b){AR.vbr=b.getAttribute('data-v');armoryDlg('v');};
function armVFill(){var L=vdesList().filter(function(d){return d.br===AR.vbr;}),i=0;var step=function(){if(!UI.wdlg||!document.body.contains(UI.wdlg))return;var t0=Date.now();while(i<L.length&&Date.now()-t0<40){var R=vcalc(L[i]),k=i;var m=UI.wdlg.querySelector('td[data-k="avm"][data-i="'+k+'"]'),s=UI.wdlg.querySelector('td[data-k="avs"][data-i="'+k+'"]'),c=UI.wdlg.querySelector('td[data-k="avc"][data-i="'+k+'"]');
    if(R&&!R.err){if(m)m.textContent=fx((R.mass||R.mto||R.disp||0)/1000,1)+' 噸';if(s)s.textContent=R.vRoad?fmt(R.vRoad)+' km/h':R.vmax?fmt(R.vmax*(R.vmax<100?1:1))+(R.vmax<100?' 節':' km/h'):'—';if(c)c.textContent=amoney((R.unit||0)*(CUR.rate||2.5));}else{if(m)m.textContent='—';if(s)s.textContent='—';if(c)c.textContent=R&&R.err?'錯誤':'—';}i++;}if(i<L.length)setTimeout(step,0);};setTimeout(step,0);}
ACT.arvdet=function(b){armVDet(b.getAttribute('data-v'));};
function armVDet(id){var d=vdesOf(id);if(!d)return;var R=vcalc(d),rate=CUR.rate||2.5;AR.cur=id;var o='<h3 style="margin:0 0 4px">'+esc(d.n)+'</h3><div class="lw-note">'+esc(d.code||'')+(d.nat?'・'+esc(d.nat):'')+(d.mk?'・'+esc(d.mk):'')+(d.yr?'・'+d.yr+' 年':'')+'</div>';
  if(!R||R.err){o+='<div class="lw-note">無法計算：'+esc(R&&R.err||'')+'</div>';}
  else{o+='<div class="lw-kv"><span>全重</span><span>'+fx((R.mass||R.mto||R.disp||0)/1000,1)+' 噸</span>'+(R.crew?'<span>乘員</span><span>'+R.crew+' 人'+(R.pax?'＋載員 '+R.pax+' 人':'')+'</span>':'')+(R.vRoad?'<span>速度</span><span>公路 '+fmt(R.vRoad)+' km/h、越野 '+fmt(R.vOff)+' km/h、功重比 '+fx(R.ptw,1)+' hp/t</span><span>航程</span><span>公路 '+fmt(R.range)+' km、越野 '+fmt(R.rangeOff)+' km</span>':'')+
      (R.gun?'<span>主武器</span><span>'+esc(R.gun.n)+'</span>':'')+(R.thermal?'<span>熱像</span><span>有</span>':'')+(R.aps&&R.aps.length?'<span>主動防護</span><span>'+esc(R.aps.map(function(a){return a.n;}).join('、'))+'</span>':'')+
      '<span>單價</span><span>'+amoney((R.unit||0)*rate)+'</span>'+(R.ammoCost?'<span>彈藥基數</span><span>'+amoney(R.ammoCost*rate)+'</span>':'')+(R.costYear?'<span>年維持費</span><span>'+amoney(R.costYear*rate)+'</span>':'')+'</div>';
    if(d.br==='l'&&R.zones){o+='<h4 style="margin:8px 0 4px">各區裝甲（等效 RHA）</h4><table class="lw-tbl"><tr><th>區域</th><th class="n">動能</th><th class="n">化學能</th></tr>';var C=vctx(),ref=LALP.t120m829a1;
      Object.keys(R.zones).forEach(function(z){var I=R.zones[z][0];if(!I)return;var q=null;try{q=LVL.zoneEq(I.L,C,ref);}catch(e){}o+='<tr><td>'+esc(LVL.ZN[z]||z)+'</td><td class="n">'+(q?(isFinite(q.ke)?fmt(q.ke):'>'+fmt(q.keMin))+' mm':'—')+'</td><td class="n">'+(q?(isFinite(q.ce)?fmt(q.ce)+' mm':'無法擊穿'):'—')+'</td></tr>';});o+='</table>';}
    if(d.qty){try{var S=LVL.seriesCost((R.unit||0)*rate,d.qty,d.lc||0.9);o+='<div class="lw-note">量產 '+fmt(d.qty)+' 輛（學習曲線 '+pct((d.lc||0.9)*100)+'）：首輛 '+amoney(S.first)+'、平均 '+amoney(S.avg)+'、總計 '+amoney(S.total)+'</div>';}catch(e){}}}
  if(R&&!R.err)o+=vdMakeRow(d);
  o+='<div class="lw-row">'+(G.vdes&&G.vdes[id]?'<button type="button" class="lw-btn sm dng" data-a="arvdel">刪除匯入的設計</button>':'')+'<button type="button" class="lw-btn sm" data-a="artab" data-v="v">返回</button></div>';UI.wdlg&&UI.wdlg.remove();UI.wdlg=dlg(o,true);}
ACT.arvdel=function(){if(G.vdes)delete G.vdes[AR.cur];armoryDlg('v');};
ACT.arvmk=function(){var d=vdesOf(AR.cur),dl2=UI.wdlg;if(!d||!dl2)return;var n=clamp(+dl2.querySelector('[data-k="avn"]').value||14,1,60),nm=dl2.querySelector('[data-k="avnm"]').value||d.n;var T=vdMake(d,n,nm);if(!T){toast('無法由這個設計建立類型。');return;}
  toast(vdMadeTxt(T),6000);armVDet(AR.cur);};

/* ---------- 造價 ---------- */
function curHtml(){var L=curAll(),sc=G&&G.set?G.set.cur||{}:{};var o='<div class="lw-row" style="flex-wrap:wrap"><label>顯示幣種 <select data-c="arcursel">'+L.map(function(c){return '<option value="'+esc(c.k)+'"'+(CUR.sel===c.k?' selected':'')+'>'+esc(c.n)+(c.sym?'（'+esc(c.sym)+'）':'')+'</option>';}).join('')+'</select></label><label><input type="checkbox" data-c="arcurboth"'+(CUR.show==='both'?' checked':'')+'> 附美元對照</label></div>';
  o+='<table class="lw-tbl"><tr><th>幣種</th><th>符號</th><th class="n">1 單位＝美元</th><th class="n">1 美元＝</th><th></th></tr>';
  L.forEach(function(c){var ed=!c.b&&!c.scn;o+='<tr><td>'+(ed?'<input type="text" value="'+esc(c.n)+'" data-c="arcurf" data-k="'+esc(c.k)+'" data-f="n" maxlength="20" style="width:8em">':esc(c.n)+(c.scn?' <span class="lw-note">想定貨幣</span>':''))+'</td><td>'+(ed?'<input type="text" value="'+esc(c.sym||'')+'" data-c="arcurf" data-k="'+esc(c.k)+'" data-f="sym" maxlength="6" style="width:4em">':esc(c.sym||''))+'</td><td class="n">'+
    (c.k==='usd'?'1':'<input type="number" step="any" min="0.000001" value="'+c.usd+'" data-c="'+(c.k==='dy'?'arrate':c.scn?'arscn':'arcurf')+'" data-k="'+esc(c.k)+'" data-f="usd" style="width:7em">')+'</td><td class="n">'+fx(1/c.usd,1/c.usd>=100?0:2)+'</td><td>'+(ed?'<button type="button" class="lw-btn sm dng" data-a="arcurdel" data-v="'+esc(c.k)+'" title="刪除">✕</button>':'')+'</td></tr>';});
  o+='<tr><td><input type="text" data-k="ncn" placeholder="新幣種名稱" maxlength="20" style="width:8em"></td><td><input type="text" data-k="ncs" placeholder="符號" maxlength="6" style="width:4em"></td><td class="n"><input type="number" step="any" min="0.000001" data-k="ncu" placeholder="美元" style="width:7em"></td><td></td><td><button type="button" class="lw-btn sm" data-a="arcuradd">＋ 新增</button></td></tr></table>';
  o+='<div class="lw-row" style="flex-wrap:wrap"><label>想定貨幣（平民財產）<input type="text" value="'+esc(sc.n||'元')+'" data-c="arscn" data-f="n" maxlength="12" style="width:6em"></label><label>人均財產 <input type="number" min="1" value="'+(sc.per||60000)+'" data-c="arscn" data-f="per" style="width:8em"></label>'+(sc.usd>0?'':'<label>1 單位＝ <input type="number" step="any" min="0" value="" placeholder="未掛勾" data-c="arscn" data-f="usd" style="width:7em"> 美元</label>')+'</div>'+
    '<div class="lw-note">自訂的原創幣種存在這個瀏覽器，也會隨武器裝備檔匯出；造價內部一律以美元計算。想定貨幣用於平民財產損失，設定美元匯率後也能選為顯示幣種。</div>';return o;}
function armCHtml(){var o=curHtml();
  SIDES().forEach(function(s){if(UI.side>=0&&s!==UI.side&&G.set.fog&&G.started)return;var c=sideUsd(s);o+='<h4 style="margin:8px 0 4px;color:'+G.sides[s].color+'">'+esc(G.sides[s].name)+'：'+amoney(c.t)+'</h4><div class="lw-note">武器 '+amoney(c.w)+'、彈藥基數 '+amoney(c.a)+'、載具 '+amoney(c.v)+'、支援裝備 '+amoney(c.e)+'、人員裝具 '+amoney(c.p)+(c.h?'、馬匹 '+amoney(c.h):'')+'</div>';
    var L=G.units.filter(function(u){return u.side===s&&isLeaf(u)&&!u.irr;}).map(function(u){return [u,unitUsd(u).t];}).sort(function(a,b){return b[1]-a[1];}).slice(0,12);
    o+='<table class="lw-tbl">'+L.map(function(q){return '<tr><td>'+esc(uName(q[0]))+'</td><td class="n">'+amoney(q[1])+'</td></tr>';}).join('')+'</table>';});
  var per=+G.set.rpUsd||0;o+='<h4 style="margin:8px 0 4px">增援點數</h4><div class="lw-row"><label>依造價計點：每點 <input type="number" min="0" step="10000" value="'+per+'" data-c="arrpusd" style="width:110px"> 美元</label><span class="lw-note">0＝依戰力計點（預設）；設定後派遣增援的點數＝該類型的造價 ÷ 每點金額。</span></div>';return o;}
CHG.arcursel=function(t){CUR.sel=t.value;curSave();armoryDlg('c');};CHG.arcurboth=function(t){CUR.show=t.checked?'both':'one';curSave();armoryDlg('c');};
CHG.arrate=function(t){CUR.rate=Math.max(0.000001,+t.value||2.5);curSave();VCA={};armoryDlg('c');};
CHG.arcurf=function(t){var c=CUR.list.filter(function(q){return q.k===t.getAttribute('data-k');})[0],f=t.getAttribute('data-f');if(!c)return;if(f==='usd'){var v=+t.value;if(!(v>0)){toast('匯率要大於 0。');return;}c.usd=v;}else c[f]=String(t.value).slice(0,f==='sym'?6:20);if(!c.n)c.n='自訂幣';curSave();armoryDlg('c');};
CHG.arscn=function(t){if(!G)return;var c=G.set.cur=Object.assign({n:'元',per:60000},G.set.cur||{}),f=t.getAttribute('data-f');if(f==='n')c.n=String(t.value||'元').slice(0,12);else if(f==='per')c.per=Math.max(1,+t.value||60000);else{var v=+t.value;if(v>0)c.usd=v;else delete c.usd;if(!(c.usd>0)&&CUR.sel==='scn'){CUR.sel='dy';curSave();}}armoryDlg('c');};
ACT.arcuradd=function(){var d=UI.wdlg,n=(d.querySelector('[data-k="ncn"]').value||'').trim().slice(0,20),sy=(d.querySelector('[data-k="ncs"]').value||'').trim().slice(0,6),u=+d.querySelector('[data-k="ncu"]').value;if(!n){toast('請輸入幣種名稱。');return;}if(!(u>0)){toast('請輸入 1 單位等於多少美元（大於 0）。');return;}
  var k='c'+Date.now().toString(36);CUR.list.push({k:k,n:n,sym:sy,usd:u});CUR.sel=k;curSave();toast('已新增幣種「'+n+'」（1 '+n+'＝'+u+' 美元），並設為顯示幣種。');armoryDlg('c');};
ACT.arcurdel=function(b){var k=b.getAttribute('data-v');CUR.list=CUR.list.filter(function(c){return c.k!==k;});if(CUR.sel===k)CUR.sel='dy';curSave();armoryDlg('c');};
CHG.arrpusd=function(t){G.set.rpUsd=Math.max(0,+t.value||0);};

/* ---------- 匯入 LatoArmory 檔：彈藥與材料庫、載具設計；或本程式的武器裝備檔 ---------- */
CHG.arimp=function(t){var f=t.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(){try{var J=JSON.parse(rd.result),msg=armImport(J);toast(msg,5000);armoryDlg();}catch(e){toast('讀取失敗：'+e.message,5000);}};rd.readAsText(f);};
function armImport(J){if(!J||typeof J!=='object')throw new Error('不是 JSON 物件');
  if(J.format==='LatoArmory'){var nm=0,np=0;G.mats=G.mats||{};G.ammo=G.ammo||{};(J.mats||[]).forEach(function(m){if(m&&m.id&&m.n){G.mats[m.id]=m;nm++;}});(J.proj||[]).forEach(function(p){if(p&&p.id&&p.n&&p.k){var q=clone(p);if(LALP[q.id]){G.aseq=(G.aseq||0)+1;q.id='ca'+G.aseq;}q._v=1;G.ammo[q.id]=q;np++;}});PCA={};ARCA={};return '已匯入 LatoArmory 庫：'+nm+' 種材料、'+np+' 種彈藥。';}
  if(J.format==='LatoVehicle'||J.design||J.designs){var list=J.designs||(J.design?[J.design]:[]),n=0;G.vdes=G.vdes||{};G.vmods=G.vmods||{};(J.mods||[]).forEach(function(m){if(m&&m.id)G.vmods[m.id]=m;});list.forEach(function(d){if(!d||!d.id||!d.br)return;var q=clone(d);if(vdesOf(q.id)&&!(G.vdes[q.id])){G.vseq=(G.vseq||0)+1;q.id='uv'+G.vseq;}q._v=(q._v||0)+1;G.vdes[q.id]=q;n++;});VCA={};if(list[0])AR.vbr=list[0].br;AR.tab='v';return '已匯入 '+n+' 個 LatoVehicle 載具設計。';}
  if(J.format===ARMFMT||J.format===ORBFMT){var r=armsImport(J);return '已匯入武器 '+r.w+' 種、單位類型 '+r.t+' 種。';}
  throw new Error('不是 LatoArmory、LatoVehicle 或武器裝備檔');}
/* 匯入的 LatoArmory／LatoVehicle 資料也先過現實限制 */
(function(){var b=armImport;armImport=function(J){var r=b.apply(this,arguments);try{var N=rlLib(G);if(N.length)r=(r||'')+'（依現實限制調整了 '+N.length+' 項：'+N.slice(0,3).join('；')+(N.length>3?'…':'')+'）';}catch(e){}return r;};})();
/* 武器裝備檔一併帶上自訂彈藥、材料、支援裝備、裝甲設計與載具設計 */
(function(){var b=armsExport;armsExport=function(opt){var D=b(opt);['ammo','mats','seq','armor','vdes','vmods'].forEach(function(k){if(G[k]&&Object.keys(G[k]).length)D[k]=clone(G[k]);});if(CUR.list.length)D.cur=clone(CUR.list);return D;};})();
/* 匯入檔裡的自訂幣種：同名同匯率的不重複加入 */
function curMerge(L){var n=0;(Array.isArray(L)?L:[]).forEach(function(c){if(!c||typeof c.n!=='string'||!(c.usd>0))return;if(CUR.list.some(function(q){return q.n===c.n&&Math.abs(q.usd-c.usd)<1e-9;}))return;CUR.list.push({k:'c'+Date.now().toString(36)+(n++),n:String(c.n).slice(0,20),sym:String(c.sym||'').slice(0,6),usd:+c.usd});});if(n)curSave();return n;}
(function(){var b=armsImport;armsImport=function(D){var r=b(D);if(D&&D.cur)curMerge(D.cur);['ammo','mats','seq','armor','vdes','vmods'].forEach(function(k){if(D&&D[k]&&typeof D[k]==='object'){G[k]=G[k]||{};for(var q in D[k])if(!G[k][q])G[k][q]=clone(D[k][q]);}});PCA={};ARCA={};VCA={};eqChanged();return r;};})();
(function(){var b=armsCheck;armsCheck=function(D){var e=b(D);if(e&&D&&(D.format===ARMFMT||D.format===ORBFMT)&&(['ammo','mats','seq','armor','vdes'].some(function(k){return D[k]&&Object.keys(D[k]).length;})||Array.isArray(D.cur)&&D.cur.length))return null;return e;};})();

/* ---------- 單位：支援裝備編輯與造價 ---------- */
function eqEditor(E,key){var o='<table class="lw-tbl"><tr><th>裝備</th><th>類別</th><th class="n">數量</th><th class="n">單價</th><th></th></tr>';(E||[]).forEach(function(x,i){var e=seqOf(x[0])||{n:x[0],cat:'',usd:0};o+='<tr><td>'+esc(e.n)+'</td><td>'+esc(e.cat)+'</td><td class="n"><input type="number" min="0" max="100000" value="'+x[1]+'" data-c="'+key+'" data-v="'+i+'" style="width:70px"></td><td class="n">'+amoney(e.usd)+'</td><td><button type="button" class="lw-btn sm dng" data-a="'+key+'del" data-v="'+i+'">移除</button></td></tr>';});
  var y=G.set.y,cats={};seqList().forEach(function(e){(cats[e.cat]=cats[e.cat]||[]).push(e);});
  return o+'</table><div class="lw-row"><select data-k="'+key+'add">'+Object.keys(cats).map(function(c){return '<optgroup label="'+esc(c)+'">'+cats[c].map(function(e){return '<option value="'+e.k+'"'+(e.y>y?' disabled':'')+'>'+esc(e.n)+'（'+e.y+'）</option>';}).join('')+'</optgroup>';}).join('')+'</select><button type="button" class="lw-btn sm" data-a="'+key+'plus">加入</button><button type="button" class="lw-btn sm" data-a="'+key+'reset">恢復標準配備</button><button type="button" class="lw-btn sm" data-a="armory" data-v="e">裝備庫…</button></div>';}
CHG.ue=function(t){var u=lgU();u.lg.eq[+t.getAttribute('data-v')][1]=Math.max(0,Math.round(+t.value||0));logRecalc(u);lgRefresh();};
ACT.uedel=function(b){var u=lgU();u.lg.eq.splice(+b.getAttribute('data-v'),1);logRecalc(u);lgRefresh();};
ACT.ueplus=function(){var u=lgU(),k=UI.body.querySelector('[data-k="ueadd"]').value,men=u.men0||0,veh=u.veh0||0,e=seqOf(k),n=e?(e.cov==='m'?Math.max(1,Math.round(men)):e.cov==='v'?Math.max(1,veh):1):1,m=u.lg.eq.filter(function(x){return x[0]===k;})[0];if(m)m[1]+=n;else u.lg.eq.push([k,n]);logRecalc(u);lgRefresh();};
ACT.uereset=function(){var u=lgU();u.lg.eq=clone(u.lg.eq0||[]);logRecalc(u);lgRefresh();};
(function(){var b=lgUnitHtml;lgUnitHtml=function(u){var o=b(u);if(!o||!u||!u.lg)return o;if(!u.lg.eq0)eqInit(u);var c=unitUsd(u);
  return o+'<details><summary class="lw-note" style="cursor:pointer">支援裝備（'+(u.lg.eq||[]).length+' 種）</summary>'+eqEditor(u.lg.eq,'ue')+'</details><div class="lw-note">造價約 '+amoney(c.t)+'（武器 '+amoney(c.w)+'、彈藥 '+amoney(c.a)+'、載具 '+amoney(c.v)+'、支援裝備 '+amoney(c.e)+'、人員裝具 '+amoney(c.p)+'）</div>';};})();
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);try{if(u&&(u.side===0||u.side===1)&&!u.irr&&(seeAll()||u.side===UI.side)){o+='<span>造價</span><span>'+amoney(unitUsd(u).t)+'</span>';}}catch(e){}return o;};})();
(function(){var st=document.createElement('style');st.textContent='.lw-arm .lw-tbl td,.lw-arm .lw-tbl th{white-space:nowrap}.lw-arm .lw-tbl td:first-child{white-space:normal;min-width:10em}.lw-arm .lw-tbl td.w{white-space:normal;min-width:15em;max-width:24em}';document.head.appendChild(st);})();
HELP14.push('<h4>裝備庫：武器、彈藥、裝甲、支援裝備、載具設計與造價</h4><ul><li>「兵力編成 → 武器庫」開啟裝備庫，整合 LatoArmory 的材料、彈道與成本模型。</li><li><b>武器</b>可連結彈藥：依有效射程上的穿深（毫米 RHA）換算穿甲等級，並更新聚能裝藥比例、每發價格與重量。聚能裝藥（火箭彈、反戰車飛彈）對複合裝甲、反應裝甲與主動防護的效果較差，穿甲彈則不受反應裝甲太大影響。</li><li><b>彈藥</b>：看各距離的穿深、對各種材料與傾角的可擊穿厚度、飛行速度與成本分解；可複製成自訂彈藥並修改口徑、質量、初速、彈芯、藥型罩與炸藥。</li><li><b>裝甲</b>：以材料分層設計正面、側面、後方、頂部的裝甲，算出對動能與化學能的等效厚度與作戰用的裝甲等級，可以「射擊試驗」並套用到單位類型。</li><li><b>支援裝備</b>：頭盔、防彈衣、夜視、熱像、無線電、雷射測距、火控、衛星定位、氣象站、煙幕彈、柵欄、反應裝甲、主動防護、掃雷滾輪、推土鏟、反無人機干擾器、偵察無人機、野戰廚房、淨水設備……依時代與兵種有標準配備；效果相對於標準配備，多配就更強、少配就更弱（例如沒有防彈衣傷亡較重、砲兵有衛星定位時未經觀測的系統誤差較小、戰車中彈會自動施放煙幕）。</li><li><b>載具設計</b>：LatoVehicle 的陸、空、海軍設計（可匯入 lato-vehicle-*.json），陸軍設計可直接建立單位類型。</li><li><b>造價</b>：武器、彈藥基數、載具、支援裝備與人員裝具的總價，以選定的幣種顯示：內建東銀圓（預設 1 東銀圓＝2.5 美元）與美元，也可以新增原創幣種（名稱、符號、1 單位等於多少美元），想定貨幣（平民財產）設定美元匯率後也能用；自訂幣種會隨武器裝備檔匯出。增援點數可改為依造價計算。</li><li>LatoArmory 匯出的彈藥與材料庫、LatoVehicle 的載具設計檔都可以直接匯入；武器裝備檔會一併帶上自訂彈藥、材料、支援裝備、裝甲與載具設計。</li></ul>');
