/* ===================== 武器裝備的匯出與匯入：武器庫、自訂單位類型兩個對話框都有「⇩ 匯出武器裝備」「⇧ 匯入武器裝備」；
   匯出時勾選要帶走的自訂武器、修改過的內建武器與自訂單位類型（類型用到的自訂武器自動帶上）；匯入時列出新增、共用與重新編號的項目 ===================== */
function armsBtns(){return '<button type="button" class="lw-btn sm" data-a="armexp" title="把自訂武器、修改過的內建武器與自訂單位類型存成武器裝備檔（.latoarms.json）">⇩ 匯出武器裝備</button>'+
  '<label class="lw-btn sm" title="讀入武器裝備檔；編制檔裡的武器與類型也可以只匯入這部分">⇧ 匯入武器裝備<input type="file" accept=".json,application/json" data-c="armfile" hidden></label>';}
function armsInject(d){if(!d)return;var r=d.querySelectorAll('.lw-row');r=r[r.length-1];if(r&&!r.querySelector('[data-a="armexp"]'))r.insertAdjacentHTML('beforeend',armsBtns());}
(function(){var b=wpnLibDlg;wpnLibDlg=function(){b();try{armsInject(UI.wdlg);}catch(e){}};})();
(function(){var b=typesDlg;typesDlg=function(){b();try{armsInject(UI.tdlg);}catch(e){}};})();
var ARX={w:{},t:{}};
ACT.armexp=function(){if(!G)return;var W=G.wpns||{},T=G.types||{},kw=Object.keys(W),kt=Object.keys(T);if(!kw.length&&!kt.length){toast('這一局沒有自訂或修改過的武器，也沒有自訂單位類型可以匯出。');return;}
  ARX={w:{},t:{}};kw.forEach(function(k){ARX.w[k]=1;});kt.forEach(function(k){ARX.t[k]=1;});
  var o='<h3>匯出武器裝備</h3><div class="lw-note">勾選要存進武器裝備檔的項目。自訂單位類型用到的自訂武器會自動一起匯出；匯入到另一局時，與現有定義相同的會共用，代號衝突的會另立新代號，不會覆蓋對方的設定。</div>';
  if(kw.length)o+='<h4 style="margin:8px 0 4px">武器（'+kw.length+'）</h4><div class="lw-ob" style="flex-wrap:wrap">'+kw.map(function(k){var w=W[k];return '<label style="margin-right:10px"><input type="checkbox" data-c="arxw" data-v="'+esc(k)+'" checked> '+esc(w.n)+(WPNO[k]?' <span class="lw-pill">修改的內建武器</span>':' <span class="lw-pill">自訂</span>')+'</label>';}).join('')+'</div>';
  if(kt.length)o+='<h4 style="margin:8px 0 4px">自訂單位類型（'+kt.length+'）</h4><div class="lw-ob" style="flex-wrap:wrap">'+kt.map(function(k){var t=T[k];return '<label style="margin-right:10px"><input type="checkbox" data-c="arxt" data-v="'+esc(k)+'" checked> '+esc(t.n)+'</label>';}).join('')+'</div>';
  o+='<div class="lw-row"><label>檔名 <input type="text" data-k="arxname" value="'+esc(((G.map&&G.map.name)||'武器裝備')+'')+'" style="width:16em"></label><button type="button" class="lw-btn pri" data-a="armexpgo">⇩ 匯出</button><button type="button" class="lw-btn" data-a="x">取消</button></div>';
  UI.axd&&UI.axd.remove();UI.axd=dlg(o);};
CHG.arxw=function(t){ARX.w[t.getAttribute('data-v')]=t.checked?1:0;};
CHG.arxt=function(t){ARX.t[t.getAttribute('data-v')]=t.checked?1:0;};
ACT.armexpgo=function(){var w=Object.keys(ARX.w).filter(function(k){return ARX.w[k];}),t=Object.keys(ARX.t).filter(function(k){return ARX.t[k];});if(!w.length&&!t.length){toast('沒有勾選任何項目。');return;}
  var inp=UI.axd&&UI.axd.querySelector('[data-k="arxname"]'),nm=((inp&&inp.value)||'武器裝備').trim()||'武器裝備',D=armsExport({w:w,t:t,name:nm});
  download(nm.replace(/[\\\/:*?"<>|\s]+/g,'_').slice(0,40)+'.latoarms.json',JSON.stringify(D),'application/json');if(UI.axd){UI.axd.remove();UI.axd=null;}
  toast('已匯出 '+Object.keys(D.wpns).length+' 項武器、'+Object.keys(D.types).length+' 個單位類型。');};
CHG.armfile=function(t){var f=t.files&&t.files[0];t.value='';if(!f)return;if(f.size>60e6){toast('檔案太大。');return;}var rd=new FileReader();
  rd.onload=function(){var D=null;try{D=JSON.parse(rd.result);}catch(e){toast('讀不懂這個檔案（不是 JSON）。');return;}var err=armsCheck(D);if(err){toast(err,4000);return;}armsImpRun(D,f.name);};rd.readAsText(f);};
function armsImpRun(D,fname){var R;try{R=armsImport(D);}catch(e){toast(e.message||String(e),4000);return;}
  var o='<h3>匯入武器裝備</h3><div class="lw-kv"><span>檔案</span><span>'+esc(fname||'')+(D.format===ORBFMT?'（編制檔，只匯入其中的武器與類型）':'')+'</span>'+
    '<span>武器</span><span>新增 '+R.w+' 項'+(R.wSame>0?'，'+R.wSame+' 項與現有相同而共用':'')+'</span><span>單位類型</span><span>新增 '+R.t+' 個'+(R.tSame>0?'，'+R.tSame+' 個與現有相同而共用':'')+'</span>'+
    (R.ren.length?'<span>重新編號</span><span>'+esc(R.ren.slice(0,12).join('、'))+(R.ren.length>12?'⋯':'')+'（代號與本局衝突，另立新代號）</span>':'')+
    (R.warn.length?'<span>略過</span><span>'+esc(R.warn.slice(0,6).join('；'))+'</span>':'')+'</div><div class="lw-note">新的武器可以在單位或自訂類型的「武器」清單中配發；新的單位類型出現在「＋單位」清單的最上方。</div><div class="lw-row"><button type="button" class="lw-btn pri" data-a="x">好</button></div>';
  if(UI.wdlg&&UI.wdlg.isConnected)wpnLibDlg();if(UI.tdlg&&UI.tdlg.isConnected)typesDlg();dlg(o);}
HELP14.push('<h4>武器裝備的匯出與匯入</h4><ul>'+
  '<li>「武器庫」（後勤頁的武器統計、編制頁的單位武器清單）與「自訂單位類型」兩個對話框都有「⇩ 匯出武器裝備」「⇧ 匯入武器裝備」。匯出時勾選要帶走的自訂武器、修改過的內建武器與自訂單位類型（含圖片），類型用到的自訂武器會自動帶上，存成 .latoarms.json。</li>'+
  '<li>匯入時與編制檔相同的規則合併：與本局現有定義完全相同的就共用；代號衝突、或檔案裡改過內建武器的，另立新的自訂代號（名稱加註「匯入」），不會覆蓋本局的設定。編制檔（.latoorbat.json）也可以用這個按鈕只匯入其中的武器與類型，不加入部隊。</li></ul>');
