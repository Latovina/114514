/* ===================== 物資與裝備（介面一）：一個對話框整合所有物資、裝備與武器 =====================
   分頁：編制裝備（單位與類型）、載具型號（陸、空、海、無人機；內建、設計與自訂同一份清單）、武器（單兵與班組）、載具武裝、彈藥、支援裝備、
   糧水與物資、制式裝備（列裝表）、裝甲材料、化生放核魔、LatoArmory 工具、幣值與造價。原本的裝備庫、武器庫、列裝表、載具與彈藥、單位武器都開到這裡。 */
(function(){var keep=ARTABS.filter(function(t){return t[0]==='x'||t[0]==='lat';});ARTABS.length=0;
  [['toe','編制裝備'],['vm','載具型號'],['w','武器'],['mw','載具武裝'],['a','彈藥'],['e','支援裝備'],['f','糧水與物資'],['fld','制式裝備'],['r','裝甲材料']].concat(keep).concat([['c','幣值與造價']]).forEach(function(t){ARTABS.push(t);});})();
/* 新分頁的內容：h() 產生 HTML，f(el) 畫好之後再填（例如非同步計算） */
var CATF={};
(function(){var b=armoryDlg;armoryDlg=function(tab){if(tab)AR.tab=tab;if(AR.tab==='v'||AR.tab==='vmc')AR.tab='vm';var want=AR.tab,F=CATF[want];
  b.call(this,F?'c':want);AR.tab=want;var d=UI.wdlg;if(!d)return;try{var h=d.querySelector('h3');if(h)h.innerHTML='物資與裝備 <span class="lw-note">（糧水、支援裝備、武器、載具型號與編制'+(LAL?'；物理模型：LatoArmory':'')+'）</span>';
    d.querySelectorAll('[data-a="artab"]').forEach(function(x){x.classList.toggle('pri',x.getAttribute('data-v')===want);});
    if(F){var el=d.querySelector('[data-k="armbody"]');if(el){el.innerHTML=F.h();if(F.f)F.f(el);}}}catch(e){if(window.console)console.warn('物資與裝備',e);}};})();
wpnLibDlg=function(){armoryDlg(AR.tab==='mw'?'mw':'w');};
function catRe(){if(UI.wdlg&&UI.wdlg.isConnected){var sc=UI.wdlg.querySelector('[data-k="armbody"]'),st=sc?sc.scrollTop:0,s2=UI.wdlg.querySelector('.lw-sc'),t2=s2?s2.scrollTop:0;armoryDlg();var n=UI.wdlg.querySelector('[data-k="armbody"]');if(n&&st)n.scrollTop=st;var n2=UI.wdlg.querySelector('.lw-sc');if(n2&&t2)n2.scrollTop=t2;}}
function catYear(){return (G&&G.set&&G.set.y)||2000;}
function catPill(t){return ' <span class="lw-pill">'+t+'</span>';}

/* ---------- 武器（單兵與班組）與載具武裝 ---------- */
WL.kind='p';
function catWHtml(kind){var mt=kind==='m',L=(mt?wpnListM(true):wpnListP()).filter(function(w){return (!WL.cat||w.cat===WL.cat)&&(!WL.q||w.n.indexOf(WL.q)>=0);}).sort(function(a,b){return a.cat<b.cat?-1:a.cat>b.cat?1:a.y-b.y;}),cu=G.wpns||{},cats={};
  (mt?wpnListM(true):wpnListP()).forEach(function(w){cats[w.cat]=1;});var used=mt?catMwUse():{};
  var o='<div class="lw-note">'+(mt?'只能裝在載具上的武器：戰車砲與機砲、自走砲與多管火箭、艦砲、魚雷與飛彈、航空武裝、無人機戰鬥部。它們不會出現在單位的武器清單裡，而是寫在「載具型號」的武裝；換了型號，武裝跟著換。機槍、反戰車飛彈與榴彈發射器既可以由步兵攜行，也可以裝在車上，放在「武器」分頁。':
      '單位武器清單用的單兵與班組武器（步槍、機槍、反裝甲、迫擊砲、牽引火砲、防空）。殺傷、穿甲、壓制、射程與精度依數量加總成單位火力（與時代標準配備相比）。車上的主砲、機砲與飛彈在「載具武裝」。')+'</div>'+
    '<div class="lw-row"><label>類別 <select data-c="wlcat"><option value="">全部</option>'+Object.keys(cats).sort().map(function(c){return '<option value="'+esc(c)+'"'+(WL.cat===c?' selected':'')+'>'+esc(wCatN(c))+'</option>';}).join('')+'</select></label><label>搜尋 <input type="text" value="'+esc(WL.q)+'" data-c="wlq" style="width:9em"></label><button type="button" class="lw-btn sm pri" data-a="wlnew">＋新增'+(mt?'載具武裝':'自訂武器')+'</button></div>'+
    '<div class="lw-sc" style="max-height:56vh;overflow:auto"><table class="lw-tbl"><tr><th>'+(mt?'武裝':'武器')+'</th><th>類別</th><th class="n">年代</th><th class="n">對人</th><th class="n">對裝甲</th><th class="n">穿甲等級</th><th>彈藥與物理穿深</th><th class="n">聚能</th><th class="n">射程</th><th class="n">單價</th><th class="n">每發</th>'+(mt?'<th class="n">型號</th>':'')+'<th></th></tr>';
  L.forEach(function(w){var mod=!!cu[w.k],custom=!WPNO[w.k],am=wAmmo(w),ph=am.length&&LAL?wPhys(w):null;o+='<tr title="'+esc(w.d||'')+'"><td>'+esc(w.n)+(custom?catPill('自訂'):mod?catPill('已修改'):'')+(w.hid?catPill('載台'):'')+'</td><td>'+esc(wCatN(w.cat))+'</td><td class="n">'+(w.y||'—')+'</td><td class="n">'+fx(w.pP,3)+'</td><td class="n">'+fx(w.pA,3)+'</td><td class="n">'+fx(w.pen,1)+'</td><td class="w">'+
    (ph?ph.rows.map(function(r){return esc(r.P.n.replace(/（.*?）/g,''))+(am.length>1?' ×'+fx(r.s,2):'');}).join('、')+'<br><span class="lw-note">'+(ph.mm?fmt(ph.mm)+' mm（'+(ph.R?kmTxt(ph.R):'直射')+'）≈ 等級 '+fx(ph.lv,1):'—')+'</span>':'<span class="lw-note">未連結</span>')+'</td><td class="n">'+pct(wCe(w)*100)+'</td><td class="n">'+(w.ind>0?kmTxt(w.ind):w.rE?kmTxt(w.rE):'—')+'</td><td class="n">'+amoney(wUsd(w))+'</td><td class="n">'+amoney(wRUsd(w))+'</td>'+
    (mt?'<td class="n">'+(used[w.k]||0)+'</td>':'')+'<td><button type="button" class="lw-btn sm" data-a="wled" data-v="'+w.k+'">'+(WPNO[w.k]?'檢視':'設計')+'</button><button type="button" class="lw-btn sm" data-a="wlcp" data-v="'+w.k+'">複製</button></td></tr>';});
  return o+'</table></div>';}
/* 每種載具武裝裝在幾種型號上 */
function catMwUse(){var o={};vmAll().forEach(function(m){vmArm(m,false).forEach(function(x){o[x[0]]=(o[x[0]]||0)+1;});});return o;}
CATF.w={h:function(){WL.kind='p';return catWHtml('p');}};CATF.mw={h:function(){WL.kind='m';return catWHtml('m');}};
CHG.wlcat=function(t){WL.cat=t.value;catRe();};CHG.wlq=function(t){WL.q=t.value.trim();catRe();};
/* 新武器：在載具武裝分頁新增的預設只能裝在車上 */
(function(){var b=ACT.wlnew;ACT.wlnew=function(x){b(x);if(AR.tab==='mw'&&WL.edit&&WPNO.mbt2){var w=WL.edit.w;w.mt=1;w.cat='戰車砲';w.dz={b:'mbt2',y:Math.max(WPNO.mbt2.y,G.set.y||0)};w.am=clone(wAmmo(WPNO.mbt2));w.n='自訂載具武裝 '+G.wseq;wpnEdDlg();}};})();
/* 切換類別時清掉另一頁的篩選 */
(function(){var b=ACT.artab;ACT.artab=function(x){var v=x.getAttribute('data-v');if((v==='w'||v==='mw')&&AR.tab!==v){WL.cat='';WL.q='';}b(x);};})();

/* ---------- 糧水與物資 ---------- */
var FDS={side:0,ed:null};
function catFHtml(){var y=catYear(),S=G.sides[FDS.side]||G.sides[0],R=S.ration||(S.ration=defRation(y)),cu=G.foods||{};
  var o='<div class="lw-note">糧食品項（內建與自訂）、各方的標準伙食與飲水；單位可以在「編制裝備」改用自己的伙食、攜行天數與彈藥基數。熱量不足會累積飢餓，降低士氣與戰力；熱食需要野戰廚房。</div>';
  o+='<h4 style="margin:8px 0 4px">糧食品項</h4><div class="lw-sc" style="max-height:30vh;overflow:auto"><table class="lw-tbl"><tr><th>品項</th><th class="n">每份熱量</th><th class="n">每份重量</th><th class="n">士氣</th><th>熱食</th><th class="n">年代</th><th></th></tr>'+
    foodList().map(function(f){var c=!!cu[f[0]]&&!FOODI[f[0]];return '<tr'+(f[6]>y?' class="lw-dim"':'')+'><td>'+esc(f[1])+(c?catPill('自訂'):'')+'</td><td class="n">'+fmt(f[2])+' 大卡</td><td class="n">'+fx(f[3],2)+' 公斤</td><td class="n">'+(f[4]?(f[4]>0?'+':'')+fx(f[4],1):'—')+'</td><td>'+(f[5]?'需要野戰廚房':'')+'</td><td class="n">'+(f[6]||'—')+'</td><td>'+(c?'<button type="button" class="lw-btn sm" data-a="fded" data-v="'+f[0]+'">編輯</button><button type="button" class="lw-btn sm dng" data-a="fddel" data-v="'+f[0]+'">刪除</button>':'')+'</td></tr>';}).join('')+'</table></div>';
  var E=FDS.ed;o+=E?'<div class="lw-card" style="margin:6px 0;padding:6px"><b>'+(cu[E.k]?'編輯':'新增')+'自訂糧食</b><div class="lw-row" style="flex-wrap:wrap"><label>名稱 <input type="text" value="'+esc(E.n)+'" data-c="fdf" data-f="n" style="width:10em"></label><label>熱量 <input type="number" min="0" max="5000" value="'+E.kc+'" data-c="fdf" data-f="kc" style="width:5em"> 大卡</label><label>重量 <input type="number" min="0.01" max="5" step="0.01" value="'+E.kg+'" data-c="fdf" data-f="kg" style="width:5em"> 公斤</label><label>士氣 <input type="number" min="-2" max="2" step="0.1" value="'+E.mo+'" data-c="fdf" data-f="mo" style="width:4em"></label><label><input type="checkbox" data-c="fdf" data-f="hot"'+(E.hot?' checked':'')+'>需要野戰廚房</label><label>年代 <input type="number" min="0" max="2100" value="'+E.y+'" data-c="fdf" data-f="y" style="width:5em"></label><button type="button" class="lw-btn sm pri" data-a="fdok">儲存</button><button type="button" class="lw-btn sm" data-a="fdx">取消</button></div></div>':
    '<div class="lw-row"><button type="button" class="lw-btn sm" data-a="fdnew">＋新增自訂糧食</button></div>';
  o+='<h4 style="margin:10px 0 4px">標準伙食與飲水</h4><div class="lw-row"><label>陣營 <select data-c="fdside">'+SIDES().map(function(s){return '<option value="'+s+'"'+(s===FDS.side?' selected':'')+'>'+esc(G.sides[s].name)+'</option>';}).join('')+'</select></label><button type="button" class="lw-btn sm" data-a="fddef">依年代恢復預設</button></div>'+rationEditor(R,'srx');
  var yy=y;o+='<h4 style="margin:10px 0 4px">醫療與防護物資</h4><div class="lw-kv"><span>醫療物資</span><span>每人 '+fx(medKgMan(yy),1)+' 公斤攜行；急救每名傷員 '+fx(medKgFA(yy),1)+' 公斤，手術 '+fx(medKgSurg(yy),1)+' 公斤；每日病患 '+fx(medKgSick(yy),2)+' 公斤（依年代）</span><span>CBRN 物資</span><span>每人約 '+fx(yy<1915?0:yy<1940?0.4:yy<1960?0.6:yy<1990?1.5:2,1)+' 公斤（濾毒罐、防護服、解毒針；依年代）</span><span>補給</span><span>醫療與 CBRN 物資和糧秣同一類別，由補給鏈運送；用量計入戰爭花費</span></div>';
  return o;}
CATF.f={h:catFHtml};
CHG.fdside=function(t){FDS.side=+t.value;catRe();};
ACT.fddef=function(){var S=G.sides[FDS.side];S.ration=defRation(catYear());fdDone();};
function fdDone(){G.units.forEach(function(u){if(u.side===FDS.side&&u.lg&&!u.ration)logRecalc(u);});catRe();}
function fdTarget(){var S=G.sides[FDS.side];return S.ration||(S.ration=defRation(catYear()));}
CHG.srx=function(t){var R=fdTarget(),f=t.getAttribute('data-f');if(f==='water'){R.water=Math.max(0,+t.value||0);fdDone();return;}var it=R.r[+t.getAttribute('data-r')][+t.getAttribute('data-m')][+t.getAttribute('data-v')];if(f==='it')it[0]=t.value;else it[1]=Math.max(0,+t.value||0);fdDone();};
ACT.srxdel=function(b){fdTarget().r[+b.getAttribute('data-r')][+b.getAttribute('data-m')].splice(+b.getAttribute('data-v'),1);fdDone();};
ACT.srxadd=function(b){fdTarget().r[+b.getAttribute('data-r')][+b.getAttribute('data-m')].push(['bread',0.5]);fdDone();};
ACT.srxcopy=function(){var R=fdTarget();R.r[1]=clone(R.r[0]);R.r[2]=clone(R.r[0]);fdDone();};
ACT.fdnew=function(){G.fseq=(G.fseq||0)+1;var k='cf'+G.fseq;while(FOODI[k]||G.foods&&G.foods[k]){G.fseq++;k='cf'+G.fseq;}FDS.ed={k:k,n:'自訂糧食 '+G.fseq,kc:800,kg:0.4,mo:0,hot:0,y:catYear()};catRe();};
ACT.fded=function(b){var c=G.foods&&G.foods[b.getAttribute('data-v')];if(c){FDS.ed=clone(c);catRe();}};
ACT.fdx=function(){FDS.ed=null;catRe();};
CHG.fdf=function(t){var E=FDS.ed,f=t.getAttribute('data-f');if(!E)return;if(f==='n')E.n=String(t.value||'').slice(0,30);else if(f==='hot')E.hot=t.checked?1:0;else E[f]=+t.value||0;};
ACT.fdok=function(){var E=FDS.ed;if(!E)return;E.kc=clamp(+E.kc||0,0,5000);E.kg=clamp(+E.kg||0.01,0.01,5);E.mo=clamp(+E.mo||0,-2,2);E.y=clamp(Math.round(+E.y||0),0,2100);E.n=E.n||'自訂糧食';G.foods=G.foods||{};G.foods[E.k]=E;FDS.ed=null;G.units.forEach(function(u){if(u.lg)logRecalc(u);});catRe();};
ACT.fddel=function(b){var k=b.getAttribute('data-v');if(!G.foods||!G.foods[k])return;var used=[];G.sides.forEach(function(S){if(S.ration&&JSON.stringify(S.ration).indexOf('"'+k+'"')>=0)used.push(S.name);});G.units.forEach(function(u){if(u.ration&&JSON.stringify(u.ration).indexOf('"'+k+'"')>=0)used.push(uName(u));});
  if(used.length&&!confirm('「'+G.foods[k].n+'」還在 '+used.slice(0,3).join('、')+(used.length>3?'等':'')+' 的伙食裡，刪除後那一份不再計算。確定刪除？'))return;delete G.foods[k];if(!Object.keys(G.foods).length)delete G.foods;G.units.forEach(function(u){if(u.lg)logRecalc(u);});catRe();};
/* 伙食的選單也列出自訂糧食 */
foodOpts=function(sel){var y=G.set.y;return foodList().map(function(f){return '<option value="'+f[0]+'"'+(sel===f[0]?' selected':'')+(f[6]>y?' disabled':'')+'>'+esc(f[1])+'（'+f[2]+' 大卡、'+f[3]+' 公斤）</option>';}).join('');};

/* ---------- 制式裝備（列裝表）：放在同一個對話框 ---------- */
CATF.fld={h:function(){return fldBody(FLD.side);}};
(function(){var b=PAGES.orbat;PAGES.orbat=function(host){b(host);try{host.querySelectorAll('[data-a="wpnlib"]').forEach(function(x){x.textContent='物資與裝備';x.title='糧水、支援裝備、武器、載具型號、編制與制式裝備';x.setAttribute('data-a','armory');x.setAttribute('data-v','toe');});
  host.querySelectorAll('[data-a="flddlg"]').forEach(function(x){x.textContent='制式裝備…';});}catch(e){}};})();

/* ---------- 匯出入：武器裝備檔也帶自訂型號、自訂糧食與類型的編制 ---------- */
(function(){var b=armsExport;armsExport=function(opt){var D=b(opt);try{if(G.vms&&Object.keys(G.vms).length)D.vms=clone(G.vms);if(G.foods&&Object.keys(G.foods).length)D.foods=clone(G.foods);if(G.toe&&Object.keys(G.toe).length)D.toe=clone(G.toe);}catch(e){}return D;};})();
(function(){var b=armsCheck;armsCheck=function(D){var e=b(D);if(e&&D&&(D.format===ARMFMT||D.format===ORBFMT)&&['vms','foods','toe'].some(function(k){return D[k]&&typeof D[k]==='object'&&Object.keys(D[k]).length;}))return null;return e;};})();
(function(){var b=armsImport;armsImport=function(D){var r=b(D),n=0;try{if(D&&D.vms&&typeof D.vms==='object'){G.vms=G.vms||{};Object.keys(D.vms).forEach(function(k){var m=vmCleanM(D.vms[k]);if(m&&!G.vms[k]){G.vms[k]=m;n++;}});}
    if(D&&D.foods&&typeof D.foods==='object'){G.foods=G.foods||{};Object.keys(D.foods).forEach(function(k){var f=D.foods[k];if(f&&typeof f==='object'&&/^cf\d+$/.test(k)&&!G.foods[k])G.foods[k]={k:k,n:String(f.n||k).slice(0,30),kc:clamp(+f.kc||0,0,5000),kg:clamp(+f.kg||0.01,0.01,5),mo:clamp(+f.mo||0,-2,2),hot:f.hot?1:0,y:clamp(Math.round(+f.y||0),0,2100)};});}
    if(D&&D.toe&&typeof D.toe==='object'&&!(G&&G.started)){Object.keys(D.toe).forEach(function(k){if(UT[k]&&!(G.toe&&G.toe[k])){var o=toeClean(D.toe[k]);if(o){G.toe=G.toe||{};G.toe[k]=o;}}});}
    if(n||D&&(D.toe||D.foods))G._tv=(G._tv||1)+1;}catch(e){}return r;};})();
