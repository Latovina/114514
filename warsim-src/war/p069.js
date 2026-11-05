/* ===================== 增援名單（白名單／黑名單）編輯器、共用增援範本 =====================
   單機：在「設定」或增援對話框編輯 G.set.rfL。聯機：房主在房間頁編輯（送到伺服器的房間設定），並上傳房間範本；
   管理員在管理員面板上傳伺服器範本、停用內建編制範本。共用範本出現在增援對話框「自訂範本」，唯讀，可以複製為本方範本。 */
var RFLE={s:0,era:'',eraSet:false,q:'',L:null,cb:null,ro:false,same:false};
function rflOnline(){return typeof mpActive==='function'&&mpActive();}
function rflCanEdit(){return !rflOnline()||(typeof mpHost==='function'&&mpHost());}
function rflTxtL(L){L=rflClean(L);if(L.m==='off')return '不限制';return (L.m==='white'?'白名單：只允許 ':'黑名單：禁止 ')+(L.b.length+L.t.length+L.p.length)+' 項';}
function rflNm(s){if(G&&G.sides&&G.sides[s])return G.sides[s].name;var R=typeof MPS!=='undefined'&&MPS.room;return R&&R.scn?R.scn.sides[s].name:s?'紅方':'藍方';}
function rftSum(T){return (T.items||[]).map(function(q){var t=typeOf(q[0]);return (t?t.n:q[0]+'（不明類型）')+'×'+q[1];}).join('、');}
/* 名單不允許目前的選擇時，改選同年代第一個允許的編制範本或單位類型 */
function rflFix(){if(!G||typeof RF==='undefined')return;var s=RF.side;if(!rflOf(s)&&!(G.set.rfH||[]).length)return;var hq=sideCmd(s),era=hq?uEra(hq).k:null;
  if(RF.src==='preset'&&!rflPreset(s,RF.pk)){var P=FP.filter(function(p){return p.era===era&&rflPreset(s,p.k);})[0]||FP.filter(function(p){return rflPreset(s,p.k);})[0];if(P)RF.pk=P.k;}
  if(RF.src==='type'&&!rflType(s,RF.tk)){var A=Object.keys(UT).concat(Object.keys(G.types||{})),k=A.filter(function(k){var t=typeOf(k);return t&&t.era===era&&rflType(s,k);})[0]||A.filter(function(k){return rflType(s,k);})[0];if(k)RF.tk=k;}}
ACT.rftcp=function(){var s=RF.side,T=rftFind(s,RF.rft);if(!T||!T.src)return;var C={id:'r'+Date.now().toString(36),n:String(T.n||'範本').slice(0,52)+(T.src==='s'?'（伺服器）':'（房間）'),ech:T.ech||2,hq:T.hq===0?0:1,items:clone(T.items||[])};
  rftOf(s).push(C);RF.rft=C.id;toast('已複製為本方的自訂範本「'+C.n+'」，可以按「編輯範本…」修改。',4500);rfDlg();};
/* ---------- 名單編輯器 ---------- */
function rflBranches(){var o=[],add=function(t){if(t&&t.br&&o.indexOf(t.br)<0)o.push(t.br);};Object.keys(UT).forEach(function(k){add(UT[k]);});if(G&&G.types)Object.keys(G.types).forEach(function(k){add(G.types[k]);});
  return Object.keys(BR).filter(function(b){return o.indexOf(b)>=0;}).concat(o.filter(function(b){return !BR[b];}));}
function rflTypes(){var A=Object.keys(UT).map(function(k){return UT[k];});if(G&&G.types)A=A.concat(Object.keys(G.types).map(function(k){return G.types[k];}));return A.filter(function(t){return !RFLE.era||t.era===RFLE.era||t.cus;});}
function rflOpen(lists,cb,ro){RFLE.s=rflOnline()?(MPS.view>=0&&MPS.view<nSides()?MPS.view:0):(UI.side>=0&&UI.side<nSides()?UI.side:0);RFLE.L=SIDES().map(function(s){return rflClean(lists&&lists[s]);});RFLE.cb=cb||null;RFLE.ro=!!ro||!cb;RFLE.same=RFLE.L[0].m!=='off'&&JSON.stringify(RFLE.L[0])===JSON.stringify(RFLE.L[1]);if(RFLE.same)RFLE.L[1]=RFLE.L[0];
  if(!RFLE.eraSet){RFLE.era='';try{var hq=G&&(sideCmd(0)||G.units[0]);if(hq)RFLE.era=uEra(hq).k;}catch(e){}}rflDlg();}
function rflDlg(){var s=RFLE.s,L=RFLE.L[s],dis=RFLE.ro?' disabled':'',ck=function(f,v){return L[f].indexOf(v)>=0?' checked':'';};
  var o='<h3>增援名單'+(RFLE.ro?'<small>唯讀</small>':'')+'</h3><div class="lw-note">白名單：戰中增援只能選勾選的兵種、單位類型與編制範本；黑名單：勾選的項目不能派遣。編制範本與自訂範本會檢查裡面的每一種單位，在白名單直接勾選的編制範本一律允許。只影響戰中增援（含 AI 購買），不影響開戰前的兵力。</div>';
  o+='<div class="lw-row" style="flex-wrap:wrap">'+SIDES().map(function(i){return '<button type="button" class="lw-btn sm'+(i===s?' pri':'')+'" data-a="rfls" data-v="'+i+'">'+esc(rflNm(i))+'：'+esc(rflTxtL(RFLE.L[i]))+'</button>';}).join('')+'<label><input type="checkbox" data-c="rflsame"'+(RFLE.same?' checked':'')+dis+'> 兩方使用相同名單</label></div>';
  o+='<div class="lw-row" style="flex-wrap:wrap"><span>模式</span>'+[['off','不限制'],['white','白名單（只允許勾選的項目）'],['black','黑名單（禁止勾選的項目）']].map(function(m){return '<label><input type="radio" name="rflm" data-c="rflm" value="'+m[0]+'"'+(L.m===m[0]?' checked':'')+dis+'> '+m[1]+'</label>';}).join('')+'</div>';
  o+='<h4>兵種</h4><div class="lw-rflbox" data-k="b">'+rflBranches().map(function(b){return '<label><input type="checkbox" data-c="rflx" data-f="b" value="'+esc(b)+'"'+ck('b',b)+dis+'> '+esc(BR[b]||b)+'</label>';}).join('')+'</div>';
  var T=rflTypes(),P=FP.filter(function(p){return (!RFLE.era||p.era===RFLE.era)&&!rflHid(p.k);}),bulk=function(f){return RFLE.ro?'':' <button type="button" class="lw-btn sm" data-a="rflbulk" data-v="'+f+',1">勾選顯示的</button><button type="button" class="lw-btn sm" data-a="rflbulk" data-v="'+f+',0">取消顯示的</button>';};
  o+='<div class="lw-row" style="flex-wrap:wrap"><label>年代 <select data-c="rflera"><option value="">全部年代</option>'+ERA.map(function(e){return '<option value="'+e.k+'"'+(RFLE.era===e.k?' selected':'')+'>'+esc(e.n)+'</option>';}).join('')+'</select></label><label>搜尋 <input type="text" data-i="rflq" value="'+esc(RFLE.q)+'" placeholder="名稱或兵種" style="width:10em"></label></div>';
  o+='<h4>單位類型<small>（'+T.length+'）</small>'+bulk('t')+'</h4><div class="lw-rflbox" data-k="t">'+T.map(function(t){return '<label><input type="checkbox" data-c="rflx" data-f="t" value="'+esc(t.k)+'"'+ck('t',t.k)+dis+'> '+esc(t.n)+' <span class="lw-note">'+esc(BR[t.br]||t.br||'')+(t.cus?'・自訂':'')+'</span></label>';}).join('')+'</div>';
  o+='<h4>編制範本<small>（'+P.length+'）</small>'+bulk('p')+'</h4><div class="lw-rflbox" data-k="p">'+P.map(function(p){return '<label><input type="checkbox" data-c="rflx" data-f="p" value="'+esc(p.k)+'"'+ck('p',p.k)+dis+'> '+esc(p.n)+' <span class="lw-note">'+(ECH[p.ech]?ECH[p.ech][1]:'')+'</span></label>';}).join('')+'</div>';
  o+='<div class="lw-note" data-k="rflsum">'+rflSumTxt()+'</div><div class="lw-row" style="flex-wrap:wrap">'+(RFLE.ro?'':'<button type="button" class="lw-btn pri" data-a="rflok">套用</button><button type="button" class="lw-btn" data-a="rflclr">清除'+esc(rflNm(s))+'的勾選</button>')+
    '<button type="button" class="lw-btn" data-a="rflexp">⇩ 匯出名單</button>'+(RFLE.ro?'':'<label class="lw-btn">⇧ 匯入名單<input type="file" accept=".json,application/json" data-c="rflimp" hidden></label>')+'<button type="button" class="lw-btn" data-a="x">'+(RFLE.ro?'關閉':'取消')+'</button></div>';
  UI.rfld&&UI.rfld.remove();UI.rfld=dlg(o,true);rflFilter();}
function rflSumTxt(){var L=RFLE.L[RFLE.s];return esc(rflNm(RFLE.s))+'已勾選：兵種 '+L.b.length+'、單位類型 '+L.t.length+'、編制範本 '+L.p.length+'（包含其他年代）'+(L.m==='off'?'；模式為「不限制」時勾選不會生效':'')+'。';}
function rflFilter(){var d=UI.rfld;if(!d)return;var q=RFLE.q.trim().toLowerCase();[].forEach.call(d.querySelectorAll('.lw-rflbox[data-k="t"] label,.lw-rflbox[data-k="p"] label'),function(l){l.style.display=!q||l.textContent.toLowerCase().indexOf(q)>=0?'':'none';});}
INP.rflq=function(t){RFLE.q=t.value;rflFilter();};
ACT.rfls=function(b){RFLE.s=+b.getAttribute('data-v');rflDlg();};
CHG.rflm=function(t){RFLE.L[RFLE.s].m=t.value;rflDlg();};
CHG.rflsame=function(t){var s=RFLE.s;RFLE.same=t.checked;SIDES().forEach(function(q){if(q!==s)RFLE.L[q]=t.checked?RFLE.L[s]:clone(RFLE.L[s]);});rflDlg();};
CHG.rflera=function(t){RFLE.era=t.value;RFLE.eraSet=true;rflDlg();};
CHG.rflx=function(t){var A=RFLE.L[RFLE.s][t.getAttribute('data-f')],i=A.indexOf(t.value);if(t.checked&&i<0)A.push(t.value);if(!t.checked&&i>=0)A.splice(i,1);var e=UI.rfld&&UI.rfld.querySelector('[data-k="rflsum"]');if(e)e.innerHTML=rflSumTxt();};
ACT.rflbulk=function(b){var v=b.getAttribute('data-v').split(','),on=v[1]==='1';[].forEach.call(UI.rfld.querySelectorAll('.lw-rflbox[data-k="'+v[0]+'"] label'),function(l){if(l.style.display==='none')return;var c=l.querySelector('input');if(c&&c.checked!==on){c.checked=on;CHG.rflx(c);}});};
ACT.rflclr=function(){var L=RFLE.L[RFLE.s];L.b=[];L.t=[];L.p=[];rflDlg();};
ACT.rflok=function(){var L=RFLE.L.map(rflClean),cb=RFLE.cb;UI.rfld&&UI.rfld.remove();UI.rfld=null;if(cb)cb(L);};
ACT.rflexp=function(){download('增援名單.latoreinflist.json',JSON.stringify(rflExport(RFLE.L),null,1),'application/json');};
CHG.rflimp=function(t){var f=t.files&&t.files[0];t.value='';if(!f)return;f.text().then(function(x){var r=rflImport(JSON.parse(x));if(r.err){toast(r.err,4500);return;}RFLE.L=r.lists;RFLE.same=RFLE.L[0].m!=='off'&&JSON.stringify(RFLE.L[0])===JSON.stringify(RFLE.L[1]);if(RFLE.same)RFLE.L[1]=RFLE.L[0];rflDlg();toast('已匯入名單，按「套用」後生效。');}).catch(function(e){toast('檔案不是有效的 JSON。');});};
/* 套用：單機直接寫入設定；聯機的房主送到伺服器（房間設定） */
function rflApply(lists){if(rflOnline()){mpSend({t:'rcfg',cfg:{rfL:lists}});toast('已送出增援名單，伺服器套用後生效。');return;}G.set.rfL=lists;toast('已套用增援名單：'+rflNm(0)+' '+rflTxt(0)+'；'+rflNm(1)+' '+rflTxt(1)+'。',4500);rflSetCard();if(UI.rfd&&UI.rfd.isConnected)rfDlg();}
ACT.rfledit=function(){if(!G)return;if(!rflCanEdit()){toast('聯機時只有房主可以修改增援名單。');return;}rflOpen(G.set.rfL,rflApply,false);};
ACT.rflview=function(){if(G)rflOpen(G.set.rfL,null,true);};
/* 設定頁 */
function rflSetHtml(){return '<div class="lw-kv">'+SIDES().map(function(s){return '<span>'+esc(rflNm(s))+'</span><span>'+esc(rflTxt(s))+'</span>';}).join('')+'</div><div class="lw-note">限制戰中增援可以選的兵種、單位類型與編制範本（含 AI 購買）；開戰前的兵力不受影響。</div><div class="lw-row">'+
  (rflCanEdit()?'<button type="button" class="lw-btn sm" data-a="rfledit">編輯增援名單…</button>':'<button type="button" class="lw-btn sm" data-a="rflview">檢視增援名單</button><span class="lw-note">聯機時由房主在房間頁設定。</span>')+'</div>';}
function rflSetCard(){if(G)setSecRe('rfl');}
setSec('pts','rfl',{t:'增援名單（白名單／黑名單）',o:20,cls:'lw-rflset',room:false,h:function(){return rflSetHtml();}});
(function(){var st=document.createElement('style');st.textContent='.lw-rflbox{max-height:26vh;overflow:auto;display:flex;flex-wrap:wrap;gap:2px 14px;border:1px solid rgba(128,128,128,.35);border-radius:6px;padding:6px 8px;margin:4px 0}.lw-rflbox label{white-space:nowrap;font-size:12.5px}';document.head.appendChild(st);})();
/* ---------- 聯機：房間頁（名單、房間範本）與管理員面板（伺服器範本、停用內建編制範本） ---------- */
if(typeof mpPgRoom==='function'){
  var RTPLMAX=30;
  function rflRoomCard(){var R=MPS.room;if(!R)return '';var H=mpHost(),C=R.cfg||{},L=C.rfL||[],T=R.tpls||[];
    var o='<div class="lw-card"><h3>增援名單與範本'+(H?'':'<small>只有房主可以修改</small>')+'</h3><div class="lw-kv">'+SIDES().map(function(s){return '<span>'+mpEsc(rflNm(s))+'</span><span>'+mpEsc(rflTxtL(L[s]))+'</span>';}).join('')+'</div>'+
      '<div class="lw-row"><button type="button" class="lw-btn sm" data-a="rflroom">'+(H&&R.phase!=='over'?'編輯增援名單…':'檢視增援名單')+'</button></div><h4>房間範本<small>（'+T.length+'／'+(R.tplMax||RTPLMAX)+'）</small></h4>'+
      (T.length?'<table class="lw-tbl"><tr><th>名稱</th><th>編成</th>'+(H?'<th></th>':'')+'</tr>'+T.map(function(t){return '<tr><td>'+mpEsc(t.n)+'</td><td>'+mpEsc(rftSum(t))+'</td>'+(H?'<td><button type="button" class="lw-btn sm dng" data-a="rtpldel" data-v="'+mpEsc(t.id)+'" title="刪除">✕</button></td>':'')+'</tr>';}).join('')+'</table>':'<div class="lw-note">沒有房間範本。</div>')+
      (H&&R.phase!=='over'?'<div class="lw-row"><label class="lw-btn sm">⇧ 上傳增援範本檔（.latoreinf.json）<input type="file" accept=".json,application/json" data-c="rtplup" hidden></label></div>':'')+
      '<div class="lw-note">房間範本與伺服器範本（目前 '+(R.stpl||0)+' 個，由管理員提供）出現在作戰中增援對話框的「自訂範本」，雙方都能使用（仍受增援名單限制），也可以複製為本方範本再修改。增援範本檔由增援對話框的「匯出」產生。</div></div>';return o;}
  (function(){var b=mpPgRoom;mpPgRoom=function(){var r=b.apply(this,arguments);try{r+=rflRoomCard();}catch(e){}return r;};})();
  ACT.rflroom=function(){var R=MPS.room;if(!R)return;var H=mpHost()&&R.phase!=='over';rflOpen((R.cfg||{}).rfL,H?function(lists){mpSend({t:'rcfg',cfg:{rfL:lists}});toast('已送出增援名單。');}:null,!H);};
  CHG.rtplup=function(t){var f=t.files&&t.files[0];t.value='';if(!f)return;if(f.size>60000){toast('檔案太大（上限約 60 KB）。',4500);return;}f.text().then(function(x){var D=JSON.parse(x);if(!D||D.format!==RFTFMT||!Array.isArray(D.templates))throw new Error('這不是增援範本檔（'+RFTFMT+'）。');mpSend({t:'rtpl',op:'add',data:D});toast('已上傳，伺服器處理中…');}).catch(function(e){toast('無法上傳：'+e.message,4500);});};
  ACT.rtpldel=function(b){if(confirm('刪除這個房間範本？'))mpSend({t:'rtpl',op:'del',id:b.getAttribute('data-v')});};
  (function(){var b=mpAdminDlg;mpAdminDlg=function(){b();var A=MPS.adm,d=UI.admd&&UI.admd.firstChild;if(!d)return;var rows=d.querySelectorAll('.lw-row'),last=rows[rows.length-1],box=document.createElement('div'),T=A.tpls||[],H=A.hideP||[];
    box.innerHTML='<div class="lw-card"><h3>增援範本<small>'+T.length+' 個伺服器範本</small></h3><div class="lw-note">伺服器範本出現在所有房間的增援對話框「自訂範本」（唯讀，玩家可以複製為本方範本）。上傳增援對話框匯出的增援範本檔（.latoreinf.json），一個檔案可以有多個範本。</div>'+
      (T.length?'<div style="max-height:30vh;overflow:auto"><table class="lw-tbl"><tr><th><input type="checkbox" data-c="admtall"></th><th>名稱</th><th>編成</th><th>上傳者</th></tr>'+T.map(function(t){return '<tr><td><input type="checkbox" data-k="tsel" value="'+mpEsc(t.id)+'"></td><td>'+mpEsc(t.n)+'</td><td>'+mpEsc(rftSum(t))+'</td><td>'+mpEsc(t.by||'')+'</td></tr>';}).join('')+'</table></div>':'<div class="lw-note">沒有伺服器範本。</div>')+
      '<div class="lw-row" style="flex-wrap:wrap"><label class="lw-btn sm">⇧ 上傳增援範本檔<input type="file" accept=".json,application/json" data-c="admtup" hidden></label>'+(T.length?'<button type="button" class="lw-btn sm dng" data-a="admtdel">刪除勾選的範本</button><button type="button" class="lw-btn sm" data-a="admtexp">⇩ 匯出全部</button>':'')+'<button type="button" class="lw-btn sm" data-a="admhide">停用內建編制範本…（目前 '+H.length+' 個）</button></div></div>';
    while(box.firstChild)d.insertBefore(box.firstChild,last);};})();
  CHG.admtall=function(t){[].slice.call(UI.admd.querySelectorAll('[data-k="tsel"]')).forEach(function(c){c.checked=t.checked;});};
  CHG.admtup=function(t){var f=t.files&&t.files[0];t.value='';if(!f)return;if(f.size>60000){toast('檔案太大（上限約 60 KB）；請分成幾個檔案上傳。',4500);return;}f.text().then(function(x){var D=JSON.parse(x);if(!D||D.format!==RFTFMT||!Array.isArray(D.templates))throw new Error('這不是增援範本檔（'+RFTFMT+'）。');return mpApi('/api/admin',{op:'tpladd',data:D});}).then(function(r){if(r.err)toast(r.err,4500);else{toast('已加入 '+r.n+' 個伺服器範本。');ACT.mpadmin();}}).catch(function(e){toast('無法上傳：'+e.message,4500);});};
  ACT.admtdel=function(){var ids=[].slice.call(UI.admd.querySelectorAll('[data-k="tsel"]:checked')).map(function(c){return c.value;});if(!ids.length){toast('請先勾選要刪除的範本。');return;}if(!confirm('刪除 '+ids.length+' 個伺服器範本？'))return;mpApi('/api/admin',{op:'tpldel',ids:ids}).then(function(r){if(r.err)toast(r.err,4500);else{toast('已刪除 '+(r.n||0)+' 個伺服器範本。');ACT.mpadmin();}}).catch(function(e){toast(e.message);});};
  ACT.admtexp=function(){var T=MPS.adm&&MPS.adm.tpls||[];download('伺服器增援範本.latoreinf.json',JSON.stringify(rftExport(T),null,1),'application/json');};
  ACT.admhide=function(){var H=(MPS.adm&&MPS.adm.hideP||[]),o='<h3>停用內建編制範本</h3><div class="lw-note">勾選的內建編制範本會在所有房間的增援對話框中隱藏、不能派遣，AI 也不會購買。</div><div style="max-height:55vh;overflow:auto">'+
      ERA.map(function(e){var L=FP.filter(function(p){return p.era===e.k;});return L.length?'<h4>'+esc(e.n)+'</h4><div class="lw-rflbox">'+L.map(function(p){return '<label><input type="checkbox" data-k="hidep" value="'+p.k+'"'+(H.indexOf(p.k)>=0?' checked':'')+'> '+esc(p.n)+' <span class="lw-note">'+(ECH[p.ech]?ECH[p.ech][1]:'')+'</span></label>';}).join('')+'</div>':'';}).join('')+
      '</div><div class="lw-row"><button type="button" class="lw-btn pri" data-a="admhideok">儲存</button><button type="button" class="lw-btn" data-a="x">取消</button></div>';UI.admh&&UI.admh.remove();UI.admh=dlg(o,true);};
  ACT.admhideok=function(){var pk=[].slice.call(UI.admh.querySelectorAll('[data-k="hidep"]:checked')).map(function(c){return c.value;});UI.admh.remove();mpApi('/api/admin',{op:'tplhide',pk:pk}).then(function(r){if(r.err)toast(r.err,4500);else{toast('已停用 '+pk.length+' 個內建編制範本。');ACT.mpadmin();}}).catch(function(e){toast(e.message);});};
}
HELP14.push('<h4>增援名單與共用範本</h4><ul><li>「設定」的「增援名單」（或增援對話框的「編輯名單…」）可以為每一方設定白名單或黑名單：勾選兵種、單位類型與編制範本。白名單只允許勾選的項目，黑名單禁止它們；編制範本與自訂範本會檢查裡面的每一種單位，在白名單直接勾選的編制範本一律允許。名單只限制戰中增援（包括 AI 用增援點數購買的部隊），可以匯出、匯入（.latoreinflist.json）。</li><li>聯機時由房主在房間頁設定名單，伺服器派遣增援前也會檢查。房主可以上傳房間範本，管理員可以在管理員面板上傳伺服器範本（所有房間共用）、刪除範本，或停用內建編制範本。共用範本出現在增援對話框「自訂範本」的「伺服器範本」「房間範本」分組，唯讀，按「複製為本方範本」可以複製後再修改。</li></ul>');
