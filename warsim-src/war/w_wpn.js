/* ===================== 武器庫：檢視與修改內建武器參數、新增自訂武器；修改後依各單位的武器配備重算火力 ===================== */
var WL={cat:'',q:'',edit:null};
/* 武器只能用設計建立：以一種內建武器為藍本，換彈藥、改身管長、射速、夜視與年份，殺傷、射程、價格等都由設計換算（見 h80_real.js）；不能直接填數值 */
var WFD=[];
ACT.wpnlib=function(){wpnLibDlg();};
function wpnCats(){var c={};wpnList().forEach(function(w){c[w.cat]=1;});return Object.keys(c);}
function wpnLibDlg(){var L=wpnList().filter(function(w){return (!WL.cat||w.cat===WL.cat)&&(!WL.q||w.n.indexOf(WL.q)>=0);}).sort(function(a,b){return a.cat<b.cat?-1:a.cat>b.cat?1:a.y-b.y;}),cu=G.wpns||{};
  var o='<h3>武器庫</h3><div class="lw-note">每種武器的殺傷、穿甲、壓制、射程與精度會依數量加總成單位火力：與該兵種的時代預設配備相比，較好（或較新世代）的武器會提高火力，較舊的會降低。內建武器的數值來自真實裝備，不能直接修改；要改請複製成設計（以它為藍本換彈藥、改身管長、射速與夜視，數值由設計換算），再到單位或自訂類型的「武器」清單中配發。</div>'+
    '<div class="lw-row"><label>類別 <select data-c="wlcat"><option value="">全部</option>'+wpnCats().map(function(c){return '<option'+(WL.cat===c?' selected':'')+'>'+esc(c)+'</option>';}).join('')+'</select></label><label>搜尋 <input type="text" value="'+esc(WL.q)+'" data-c="wlq" style="width:9em"></label><button type="button" class="lw-btn sm pri" data-a="wlnew">＋新武器設計</button></div>'+
    '<div class="lw-sc" style="max-height:60vh;overflow:auto"><table class="lw-tbl"><tr><th>武器</th><th>類別</th><th class="n">年代</th><th class="n">世代</th><th class="n">對人</th><th class="n">對裝甲</th><th class="n">穿甲</th><th class="n">壓制</th><th class="n">射程</th><th class="n">精度</th><th class="n">防空</th><th></th></tr>'+
    L.map(function(w){var mod=!!cu[w.k],custom=!WPNO[w.k];return '<tr><td>'+esc(w.n)+(custom?' <span class="lw-pill">自訂</span>':mod?' <span class="lw-pill">已修改</span>':'')+'</td><td>'+esc(w.cat)+'</td><td class="n">'+w.y+'</td><td class="n">'+(w.gen||'—')+'</td><td class="n">'+fx(w.pP,3)+'</td><td class="n">'+fx(w.pA,3)+'</td><td class="n">'+fx(w.pen,1)+'</td><td class="n">'+fx(w.sup,2)+'</td><td class="n">'+(w.ind?kmTxt(w.ind)+'（間接）':kmTxt(w.rE||0))+'</td><td class="n">'+fx(w.acc,2)+'</td><td class="n">'+fx(w.aa||0,1)+'</td><td><button type="button" class="lw-btn sm" data-a="wled" data-v="'+w.k+'">'+(WPNO[w.k]?'檢視':'設計')+'</button><button type="button" class="lw-btn sm" data-a="wlcp" data-v="'+w.k+'">複製</button></td></tr>';}).join('')+'</table></div><div class="lw-row"><button type="button" class="lw-btn" data-a="x">關閉</button></div>';
  UI.wdlg&&UI.wdlg.remove();UI.wdlg=dlg(o,true);}
CHG.wlcat=function(t){WL.cat=t.value;wpnLibDlg();};
CHG.wlq=function(t){WL.q=t.value.trim();wpnLibDlg();};
ACT.wled=function(b){var k=b.getAttribute('data-v'),w=wpnOf(k);if(!w)return;WL.edit={k:k,w:clone(w),isNew:false,ro:!!WPNO[k]};wpnEdDlg();};
ACT.wlcp=function(b){var w=wpnOf(b.getAttribute('data-v'));if(!w)return;G.wseq=(G.wseq||0)+1;var k='cw'+G.wseq;while(WPNO[k]||G.wpns&&G.wpns[k]){G.wseq++;k='cw'+G.wseq;}var c=clone(w);c.k=k;c.n=w.n+'（改）';c.hid=0;c.dz=WPNO[w.k]?{b:w.k,y:w.y}:clone(w.dz||{});if(!c.am&&wAmmo(w).length)c.am=clone(wAmmo(w));WL.edit={k:k,w:c,isNew:true};wpnEdDlg();};
ACT.wlnew=function(){G.wseq=(G.wseq||0)+1;var k='cw'+G.wseq;while(WPNO[k]||G.wpns&&G.wpns[k]){G.wseq++;k='cw'+G.wseq;}var b=WPNO.asr2?'asr2':Object.keys(WPNO)[0];WL.edit={k:k,w:{k:k,n:'自訂武器 '+G.wseq,cat:WPNO[b].cat,hid:0,dz:{b:b,y:Math.max(WPNO[b].y||0,G.set.y||0)},am:clone(wAmmo(WPNO[b]))},isNew:true};wpnEdDlg();};
/* 設計表單：藍本、身管長、射速、夜視、年份與彈藥（彈藥與導引彈藥的區塊由 o38、o48 接在後面）；右邊是換算出來的數值 */
function wpnBaseOpts(sel){var cats={};Object.keys(WPNO).forEach(function(k){var w=WPNO[k];if(w.hid&&k!==sel)return;(cats[w.cat]=cats[w.cat]||[]).push(w);});
  return Object.keys(cats).map(function(c){return '<optgroup label="'+esc(c)+'">'+cats[c].sort(function(a,b){return a.y-b.y;}).map(function(w){return '<option value="'+w.k+'"'+(w.k===sel?' selected':'')+'>'+esc(w.n)+'（'+w.y+'）</option>';}).join('')+'</optgroup>';}).join('');}
function wpnStatHtml(w,B){var row=function(l,v,b){return '<tr><td>'+l+'</td><td class="n">'+v+'</td>'+(B?'<td class="n lw-note">'+b+'</td>':'')+'</tr>';},rg=function(x){return x.ind?kmTxt(x.ind)+'（間接）':kmTxt(x.rE||0);};
  return '<table class="lw-tbl"><tr><th></th><th class="n">'+(B?'這個設計':'數值')+'</th>'+(B?'<th class="n">藍本</th>':'')+'</tr>'+row('對人殺傷',fx(w.pP,3),B&&fx(B.pP,3))+row('對裝甲殺傷',fx(w.pA,3),B&&fx(B.pA,3))+row('穿甲等級',fx(w.pen,1),B&&fx(B.pen,1))+row('壓制',fx(w.sup,2),B&&fx(B.sup,2))+
    row('射程',rg(w),B&&rg(B))+row('精度',fx(w.acc,2),B&&fx(B.acc,2))+row('防空',fx(w.aa||0,2),B&&fx(B.aa||0,2))+row('夜視',['無','微光','熱像'][w.nv||0],B&&['無','微光','熱像'][B.nv||0])+row('操作人數',w.crew,B&&B.crew)+
    row('每發重量',fx(w.kg,3)+' kg',B&&fx(B.kg,3)+' kg')+row('每基數',fmt(w.rpu)+' 發',B&&fmt(B.rpu)+' 發')+(typeof wUsd==='function'?row('單價',typeof amoney==='function'?amoney(wUsd(w)):fmt(wUsd(w)),B&&(typeof amoney==='function'?amoney(wUsd(B)):fmt(wUsd(B)))):'')+'</table>';}
function wpnEdDlg(){var E=WL.edit,w=E.w,cats=wpnCats(),o;
  if(E.ro){o='<h3>'+esc(w.n)+'</h3><div class="lw-note">內建武器的數值來自真實裝備，不能直接修改。要改，請「複製為設計」：以它為藍本，換彈藥、改身管長、射速、夜視與年份，殺傷、射程、穿甲、價格都由設計換算。</div>'+wpnStatHtml(w,null)+
      '<div class="lw-row"><button type="button" class="lw-btn pri" data-a="wlcp" data-v="'+esc(E.k)+'">複製為設計</button>'+(G.wpns&&G.wpns[E.k]?'<button type="button" class="lw-btn" data-a="wlreset">恢復內建值</button>':'')+'<button type="button" class="lw-btn" data-a="wlback">返回</button></div>';
    UI.wdlg&&UI.wdlg.remove();UI.wdlg=dlg(o,true);return;}
  var N=[],P=rlWpn(clone(w),N),dz=P.dz||{},B=WPNO[dz.b],y=dz.y||0;w.dz=clone(dz);E.pb=dz.b;
  o='<h3>'+(E.isNew?'新武器設計':'武器設計')+'</h3><div class="lw-note">以一種內建武器為藍本：換彈藥（下面的「彈藥」區，彈藥也可以自己設計）、改身管長、射速、夜視與年份。殺傷依彈藥的砲口動能與炸藥量、穿甲依終端彈道、射程依初速換算；身管越長、射速越高、夜視越好就越貴，換更重的彈藥每基數的發數會變少、操作人數可能增加。數值不能直接填。</div>'+
    '<div class="lw-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:4px 10px">'+
    '<label style="font-size:12px;display:block">名稱<br><input type="text" value="'+esc(w.n||'')+'" data-c="wlf" data-f="n" style="width:100%"></label>'+
    '<label style="font-size:12px;display:block">類別（顯示用）<br><input type="text" list="lw-wcats" value="'+esc(w.cat||(B&&B.cat)||'')+'" data-c="wlf" data-f="cat" style="width:100%"><datalist id="lw-wcats">'+cats.map(function(c){return '<option value="'+esc(c)+'">';}).join('')+'</datalist></label>'+
    '<label style="font-size:12px;display:block">藍本<br><select data-c="wlf" data-f="dz.b" style="width:100%">'+wpnBaseOpts(dz.b)+'</select></label>'+
    '<label style="font-size:12px;display:block">年份（不早於藍本 '+(B?B.y:'')+'）<br><input type="number" step="1" value="'+y+'" data-c="wlf" data-f="dz.y" style="width:100%"></label>'+
    '<label style="font-size:12px;display:block">身管長（藍本的 0.7～1.3 倍）<br><input type="number" step="0.05" min="0.7" max="1.3" value="'+(dz.bl||1)+'" data-c="wlf" data-f="dz.bl" style="width:100%"></label>'+
    '<label style="font-size:12px;display:block">射速（藍本的 0.5～1.5 倍）<br><input type="number" step="0.05" min="0.5" max="1.5" value="'+(dz.rof||1)+'" data-c="wlf" data-f="dz.rof" style="width:100%"></label>'+
    '<label style="font-size:12px;display:block">夜視<br><select data-c="wlf" data-f="dz.nv" style="width:100%">'+[[0,'無',0],[1,'微光（1965 年起）',RLNVY[1]],[2,'熱像（1978 年起）',RLNVY[2]]].map(function(q){return '<option value="'+q[0]+'"'+((dz.nv||0)===q[0]?' selected':'')+(y<q[2]&&!(B&&B.nv>=q[0])?' disabled':'')+'>'+q[1]+'</option>';}).join('')+'</select></label></div>'+
    '<h4 style="margin:8px 0 4px">換算結果</h4>'+wpnStatHtml(P,B)+(N.length?'<div class="lw-note">已依現實限制調整：'+esc(N.join('；'))+'</div>':'')+
    '<div class="lw-row"><button type="button" class="lw-btn pri" data-a="wlsave">儲存</button>'+(!E.isNew&&G.wpns&&G.wpns[E.k]?'<button type="button" class="lw-btn dng" data-a="wldel">刪除</button>':'')+'<button type="button" class="lw-btn" data-a="wlback">返回</button></div>';
  UI.wdlg&&UI.wdlg.remove();UI.wdlg=dlg(o,true);}
CHG.wlf=function(t){var f=t.getAttribute('data-f'),w=WL.edit.w;if(f.indexOf('dz.')===0){w.dz=w.dz||{};var g=f.slice(3);w.dz[g]=g==='b'?t.value:(+t.value||0);if(g==='b'){var B=WPNO[t.value],pb=WPNO[WL.edit.pb||''];if(B){w.am=clone(wAmmo(B));delete w.mu;if(!w.cat||(pb&&w.cat===pb.cat))w.cat=B.cat;if((w.dz.y||0)<B.y)w.dz.y=B.y;}}wpnEdDlg();return;}w[f]=String(t.value).slice(0,f==='n'?40:20);};
ACT.wlsave=function(){var E=WL.edit,w=E.w,N=[];w.k=E.k;w.n=String(w.n||'武器').slice(0,40);w.hid=0;rlWpn(w,N);
  G.wpns=G.wpns||{};G.wpns[E.k]=w;wpnChanged();toast('已儲存「'+w.n+'」，各單位火力已重算。'+(N.length?'（依現實限制調整：'+N.slice(0,3).join('；')+'）':''),N.length?6000:3000);wpnLibDlg();};
ACT.wlreset=function(){if(G.wpns)delete G.wpns[WL.edit.k];wpnChanged();toast('已恢復內建值。');wpnLibDlg();};
ACT.wldel=function(){var k=WL.edit.k,used=G.units.some(function(u){return u.lg&&u.lg.w.some(function(x){return x[0]===k&&x[1]>0;});});if(used&&!confirm('仍有單位配備此武器，刪除後這些武器會失效。確定刪除？'))return;if(G.wpns)delete G.wpns[k];wpnChanged();wpnLibDlg();};
ACT.wlback=function(){wpnLibDlg();};
function wpnChanged(){G._tv=(G._tv||1)+1;G.units.forEach(function(u){if(u.lg)logRecalc(u);});if(UI.tab==='orbat'&&typeof obDet==='function')obDet();}
/* 單位火力係數（顯示用） */
function wfTxt(u){if(!u.lg||!u.lg.wpnF)return '';var f=u.lg.wpnF,p=[];if(Math.abs(f.p-1)>0.02)p.push('對人 ×'+fx(f.p,2));if(Math.abs(f.a-1)>0.02)p.push('對裝甲 ×'+fx(f.a,2));if(f.pAdd)p.push('對人 +'+fx(f.pAdd,2));if(f.aAdd)p.push('對裝甲 +'+fx(f.aAdd,2));if(Math.abs(f.penD)>0.05)p.push('穿甲 '+sg(f.penD,1));if(f.penAbs)p.push('穿甲 '+fx(f.penAbs,1));if(Math.abs(f.sup-1)>0.02)p.push('壓制 ×'+fx(f.sup,2));if(Math.abs(f.rng-1)>0.02)p.push('射程 ×'+fx(f.rng,2));if(Math.abs(f.ind-1)>0.02)p.push('間接射程 ×'+fx(f.ind,2));if(f.indAbs)p.push('間接射程 '+kmTxt(f.indAbs));if(f.aaD>0.05)p.push('防空 +'+fx(f.aaD,1));return p.length?p.join('、'):'與時代標準配備相同';}
