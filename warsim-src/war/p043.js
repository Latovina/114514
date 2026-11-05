/* ===================== 點數介面：頂列的增援點數、科技點數與戰力；點數明細與帳目；科技解鎖；增援對話框的費用、解鎖檢查與自訂範本（編輯、匯出、匯入）；
   單位面板與兵力編成的部隊點數；增援點數模式下擴充補給設施要付費、作戰中不能直接改武器；設定頁；說明 ===================== */
function ptsSideTxt(s){return G.sides[s]?G.sides[s].name:'';}
/* 頂列只在開啟增援或科技點數時顯示（保持一行）；戰力比較放在提示與點數明細 */
function ptsHud(){var me=mySide(),o=[];if(me===null){if(rpOn())o.push('增援 '+fmt(Math.floor(rpS(0).v))+'／'+fmt(Math.floor(rpS(1).v)));if(techOn())o.push('科技 '+fmt(Math.floor(tpS(0).v))+'／'+fmt(Math.floor(tpS(1).v)));}
  else{if(rpOn())o.push('增援 '+fmt(Math.floor(rpS(me).v)));if(techOn())o.push('科技 '+fmt(Math.floor(tpS(me).v)));}return o.join('｜');}
function ptsTip(){var me=mySide();return '戰力（部隊點數）：'+(me===null?SIDES().map(function(s){return fmt(fpSide(s));}).join('：'):fmt(fpSide(me))+'：'+(seeAll()?SIDES().filter(function(s){return s!==me;}).map(function(s){return fmt(fpSide(s));}).join('：'):'約 '+fmt(fpEst(me))+'（估計）'))+'。按一下查看點數明細';}
(function(){var b=barRender;barRender=function(){b();if(!G||!G.started||G.replay||!UI.bar||!rpOn()&&!techOn())return;var sp=UI.bar.querySelector('.lw-sp');if(!sp||UI.bar.querySelector('[data-k="pts"]'))return;var e=document.createElement('button');e.type='button';e.className='lw-btn sm lw-pts';e.setAttribute('data-k','pts');e.setAttribute('data-a','ptsdlg');
  e.title='點數：增援點數、科技點數與雙方戰力（部隊點數）';e.style.cssText='min-height:24px;font-size:12px;white-space:nowrap';sp.parentNode.insertBefore(e,sp);e.textContent=ptsHud();e.title=ptsTip();};})();
var PTT=0;(function(){var b=hudTick;hudTick=function(force){b(force);var n=Date.now();if(!force&&n-PTT<2000)return;PTT=n;var e=UI.bar&&UI.bar.querySelector('[data-k="pts"]');if(e&&G&&G.started){try{e.textContent=ptsHud();e.title=ptsTip();}catch(x){}}};})();
/* ---------- 點數明細 ---------- */
function ptsDlg(){var me=mySide(),sides=me===null?SIDES():[me],o='<h3>點數<small>部隊點數只用來比較戰力</small></h3>';
  o+='<div class="lw-kv">'+SIDES().map(function(s){return kv(esc(ptsSideTxt(s))+'戰力',me===null||s===me||seeAll()?fmt(fpSide(s))+' 點':'約 '+fmt(fpEst(me))+' 點（依目前的情報估計）');}).join('')+'</div>';
  sides.forEach(function(s){if(rpOn()){var R=rpS(s);o+='<h4 style="margin:10px 0 4px">'+esc(ptsSideTxt(s))+'：增援點數 '+fmt(Math.floor(R.v))+'</h4><div class="lw-note">每日配給約 '+fmt(rpDayAmt(s))+' 點；累計收入 '+fmt(R.earn)+'、支出 '+fmt(R.spend)+'。</div>'+
      '<table class="lw-tbl"><tr><th>項目</th><th class="n">累計</th></tr>'+Object.keys(R.by).filter(function(k){return Math.abs(R.by[k])>=0.5;}).sort(function(a,b){return R.by[b]-R.by[a];}).map(function(k){return '<tr><td>'+esc(RPWHY[k]||k)+'</td><td class="n" style="color:'+(R.by[k]<0?'#b3261e':'#2e7d32')+'">'+(R.by[k]>0?'+':'')+fmt(R.by[k])+'</td></tr>';}).join('')+'</table>'+
      '<details><summary class="lw-note" style="cursor:pointer">最近的帳目（'+R.log.length+'）</summary><table class="lw-tbl">'+R.log.slice(-25).reverse().map(function(e){return '<tr><td>'+tTxt(e.t)+'</td><td>'+esc(RPWHY[e.why]||e.why)+(e.txt?'：'+esc(e.txt):'')+'</td><td class="n" style="color:'+(e.v<0?'#b3261e':'#2e7d32')+'">'+(e.v>0?'+':'')+fmt(e.v,Math.abs(e.v)<10?1:0)+'</td></tr>';}).join('')+'</table></details>';}
    if(techOn()){var T=tpS(s);o+='<h4 style="margin:10px 0 4px">'+esc(ptsSideTxt(s))+'：科技點數 '+fmt(Math.floor(T.v))+'</h4><div class="lw-note">每日 '+fmt(tpDayAmt())+' 點，交戰與佔領目標另有收入；已解鎖 '+Object.keys(T.unl).length+' 項。</div><button type="button" class="lw-btn sm" data-a="techdlg" data-v="'+s+'">科技與解鎖…</button>';}});
  if(!rpOn()&&!techOn())o+='<div class="lw-note" style="margin-top:8px">增援點數與科技點數目前關閉，可以在「設定」開啟。</div>';
  o+='<div class="lw-row" style="margin-top:8px"><button type="button" class="lw-btn sm" data-a="rftdlg">自訂增援範本…</button><button type="button" class="lw-btn" data-a="x">關閉</button></div>';if(UI.ptd&&UI.ptd.isConnected)UI.ptd.remove();UI.ptd=dlg(o,true);}
ACT.ptsdlg=function(){ptsDlg();};
/* ---------- 科技 ---------- */
var TCH={side:0,c:'gen'};
function techDlg(side){if(side!==undefined)TCH.side=side;var s=TCH.side,T=tpS(s),y=G.set.y||1943,L=wpnList().filter(function(w){return (w.y||0)<=y+20&&wcls(w.k)!=='x';}),by={};L.forEach(function(w){var c=wcls(w.k);(by[c]=by[c]||[]).push(w);});
  var CN=Object.assign({},WCLN,{veh:'戰車砲、自走砲與車載武器',nav:'艦砲',air:'航空器'}),cats=Object.keys(CN).filter(function(c){return by[c];});if(cats.indexOf(TCH.c)<0)TCH.c=cats[0];
  var o='<h3>科技<small>'+esc(ptsSideTxt(s))+'：'+fmt(Math.floor(T.v))+' 點</small></h3><div class="lw-note">開戰時本方已有、或已經過時（早於 '+(y-25)+' 年）的武器不必解鎖。解鎖後才能用「呼叫物資」配發或換裝，也才能派遣使用它們的單位類型。較本時代更新的武器可以提前研發，代價較高。</div>'+
    '<div class="lw-row" style="flex-wrap:wrap">'+cats.map(function(c){return '<button type="button" class="lw-btn sm'+(c===TCH.c?' pri':'')+'" data-a="techc" data-v="'+c+'">'+esc(CN[c])+'</button>';}).join('')+'</div>'+
    '<div class="lw-sc" style="max-height:420px;overflow:auto"><table class="lw-tbl"><tr><th>武器、裝備</th><th class="n">年代</th><th>狀態</th><th></th></tr>'+(by[TCH.c]||[]).sort(function(a,b){return a.y-b.y;}).map(function(w){var ok=techOK(s,w.k),c=techCost(w.k),fut=(w.y||0)>y;
      return '<tr><td>'+esc(w.n)+'</td><td class="n">'+(w.y||'—')+'</td><td>'+(ok?(T.unl[w.k]?'<span style="color:#2e7d32">已解鎖</span>':'可用'):'<span style="color:#b3261e">鎖定</span>'+(fut?'（提前研發）':''))+'</td><td>'+(ok?'':'<button type="button" class="lw-btn sm'+(T.v>=c?' pri':'')+'" data-a="techun" data-v="'+esc(w.k)+'"'+(T.v>=c?'':' disabled')+'>解鎖（'+c+' 點）</button>')+'</td></tr>';}).join('')+'</table></div><div class="lw-row"><button type="button" class="lw-btn" data-a="x">關閉</button></div>';
  if(UI.tcd&&UI.tcd.isConnected&&UI.tcd.firstChild)UI.tcd.firstChild.innerHTML=o;else UI.tcd=dlg(o,true);}
ACT.techdlg=function(b){techDlg(+b.getAttribute('data-v'));};
ACT.techc=function(b){TCH.c=b.getAttribute('data-v');techDlg();};
ACT.techun=function(b){var r=techUnlock(TCH.side,b.getAttribute('data-v'));if(r.err)toast(r.err,4000);else toast('已解鎖'+wpnOf(b.getAttribute('data-v')).n+'（'+r.c+' 點）');techDlg();};
/* ---------- 增援對話框：費用、解鎖檢查、自訂範本 ---------- */
if(typeof RF!=='undefined'&&RF.rft===undefined)RF.rft='';
function rfCostTxt(){var s=RF.side,cost=0,lock=[],why='';try{var T=null;if(RF.src==='rft'){T=rftFind(s,RF.rft);if(!T)return '先建立或選擇自訂範本。';cost=rftCost(T,s);lock=rftLock(s,T);}else if(RF.src==='preset'){cost=rpPresetCost(RF.pk,s);lock=techPresetLock(s,RF.pk);}else{cost=rpTypeCost(RF.tk,Math.max(1,RF.n||1),s);lock=techTypeLock(s,RF.tk);}why=rflWhy(s,RF.src,{pk:RF.pk,tk:RF.tk,T:T});}catch(e){return '';}
  return (why?'<span style="color:#b3261e">'+esc(why)+'</span>　':'')+(rpOn()?'需要 <b>'+fmt(cost)+'</b> 增援點數（現有 '+fmt(Math.floor(rpS(s).v))+'）':'部隊點數 '+fmt(cost))+(lock.length?'　<span style="color:#b3261e">需要先解鎖：'+lock.map(function(k){return esc(wpnOf(k)?wpnOf(k).n:k);}).join('、')+'</span>':'');}
(function(){var b=rfDlg;rfDlg=function(){rflFix();b();var d=UI.rfd;if(!d||!d.isConnected)return;var side=RF.side,r0=d.querySelector('[data-c="rf2"][data-f="src"]');
  if(r0)r0.closest('.lw-row').insertAdjacentHTML('beforeend','<label><input type="radio" name="rfsrc" data-c="rf2" data-f="src" value="rft"'+(RF.src==='rft'?' checked':'')+'>自訂範本</label>');
  if(RF.src==='rft'){var L=rftOf(side),X=rftShared(),A=L.concat(X);if(!A.some(function(q){return q.id===RF.rft;}))RF.rft=(A.filter(function(q){return rflTpl(side,q);})[0]||A[0]||{id:''}).id;var tk=d.querySelector('[data-c="rf2"][data-f="tk"]'),cur=rftFind(side,RF.rft);
    var op=function(T){var ok=rflTpl(side,T);return '<option value="'+esc(T.id)+'"'+(T.id===RF.rft?' selected':'')+(ok?'':' disabled')+'>'+esc(T.n)+'（'+fmt(rftCost(T,side))+' 點）'+(ok?'':'（名單不允許）')+'</option>';};
    var h='<div class="lw-row"><select data-c="rf2" data-f="rft">'+(!A.length?'<option value="">（尚無自訂範本）</option>':!X.length?L.map(op).join(''):(L.length?'<optgroup label="本方自訂">'+L.map(op).join('')+'</optgroup>':'')+[['s','伺服器範本'],['r','房間範本']].map(function(g){var Q=X.filter(function(T){return T.src===g[0];});return Q.length?'<optgroup label="'+g[1]+'">'+Q.map(op).join('')+'</optgroup>':'';}).join(''))+'</select><button type="button" class="lw-btn sm" data-a="rftdlg">編輯範本…</button>'+(cur&&cur.src?'<button type="button" class="lw-btn sm" data-a="rftcp" title="複製到本方的自訂範本，之後可以修改">複製為本方範本</button>':'')+'<button type="button" class="lw-btn sm" data-a="rftexp">匯出</button><label class="lw-btn sm">匯入<input type="file" accept=".json,application/json" data-c="rftimp" hidden></label></div>';
    if(tk)tk.closest('.lw-row').outerHTML=h;}
  if(techOn()){[].forEach.call(d.querySelectorAll('[data-c="rf2"][data-f="tk"] option'),function(op){if(techTypeLock(side,op.value).length){op.disabled=true;op.textContent+='（需解鎖）';}});[].forEach.call(d.querySelectorAll('[data-c="rf2"][data-f="pk"] option'),function(op){if(techPresetLock(side,op.value).length){op.disabled=true;op.textContent+='（需解鎖）';}});}
  if(rflOf(side)||(G.set.rfH||[]).length){[].forEach.call(d.querySelectorAll('[data-c="rf2"][data-f="tk"] option'),function(op){if(!rflType(side,op.value)){op.disabled=true;op.textContent+='（名單不允許）';}});[].forEach.call(d.querySelectorAll('[data-c="rf2"][data-f="pk"] option'),function(op){if(rflHid(op.value))op.remove();else if(!rflPreset(side,op.value)){op.disabled=true;op.textContent+='（名單不允許）';}});}
  var go=d.querySelector('[data-a="rfgo"]');if(go){var rl=document.createElement('div');rl.className='lw-row';rl.innerHTML='<span class="lw-note">增援名單：'+esc(rflTxt(side))+'</span>'+(rflCanEdit()?' <button type="button" class="lw-btn sm" data-a="rfledit">編輯名單…</button>':rflOf(side)?' <button type="button" class="lw-btn sm" data-a="rflview">檢視名單</button>':'');go.closest('.lw-row').parentNode.insertBefore(rl,go.closest('.lw-row'));var n=document.createElement('div');n.className='lw-note';n.setAttribute('data-k','rfcost');n.innerHTML=rfCostTxt();go.closest('.lw-row').parentNode.insertBefore(n,go.closest('.lw-row'));}};})();
(function(){var b=CHG.rf2;CHG.rf2=function(t){var r=b(t);var e=UI.rfd&&UI.rfd.querySelector('[data-k="rfcost"]');if(e)e.innerHTML=rfCostTxt();return r;};})();
(function(){var b=ACT.rfgo;ACT.rfgo=function(btn){var side=RF.side,src=RF.src,T=null,cost=0,lock=[];
  if(src==='rft'){T=rftFind(side,RF.rft);if(!T||!(T.items||[]).some(function(q){return typeOf(q[0])&&q[1]>0;})){toast('先建立或選擇自訂範本。');return;}cost=rftCost(T,side);lock=rftLock(side,T);}
  else if(src==='preset'){cost=rpPresetCost(RF.pk,side);lock=techPresetLock(side,RF.pk);}else{cost=rpTypeCost(RF.tk,Math.max(1,RF.n||1),side);lock=techTypeLock(side,RF.tk);}
  var why=rflWhy(side,src,{pk:RF.pk,tk:RF.tk,T:T});if(why){toast(why,5000);return;}
  if(lock.length){toast('需要先解鎖：'+lock.map(function(k){return wpnOf(k)?wpnOf(k).n:k;}).join('、'),5000);return;}
  if(rpOn()&&G.started&&rpS(side).v+1e-6<cost){toast('增援點數不足：需要 '+fmt(cost)+'，現有 '+fmt(Math.floor(rpS(side).v)),5000);return;}
  var n0=G.units.length;if(src==='rft'){var oa=addLeaf;RF.src='type';addLeaf=function(s,tk,n,nm,par,r){return rftBuild(s,T,nm,par,r);};try{b(btn);}finally{addLeaf=oa;RF.src='rft';}}else b(btn);
  if(G.units.length>n0&&rpOn()&&G.started)rpSpend(side,cost,'reinf',T?T.n:src==='preset'&&FPI[RF.pk]?FPI[RF.pk].n:(typeOf(RF.tk)||{}).n);};})();
ACT.rftexp=function(){var s=UI.rfd&&UI.rfd.isConnected?RF.side:RFE.side,L=rftOf(s);if(!L.length){toast('沒有自訂範本可以匯出。');return;}download('增援範本-'+G.sides[s].name+'.latoreinf.json',JSON.stringify(rftExport(L),null,1),'application/json');};
CHG.rftimp=function(t){var f=t.files&&t.files[0];t.value='';if(!f)return;var rd=new FileReader();rd.onload=function(){var s=UI.rfd&&UI.rfd.isConnected?RF.side:RFE.side,D=null;try{D=JSON.parse(rd.result);}catch(e){toast('檔案不是有效的 JSON。');return;}var r=rftImport(s,D);if(r.err){toast(r.err,4000);return;}
  toast('匯入 '+r.n+' 個增援範本'+(r.skip.length?'；略過不明的單位類型：'+r.skip.slice(0,4).join('、'):''),4500);if(UI.rfd&&UI.rfd.isConnected){RF.src='rft';var L=rftOf(s);RF.rft=L[L.length-1].id;rfDlg();}if(UI.rfe&&UI.rfe.isConnected)rftDlg();};rd.readAsText(f);};
/* ---------- 自訂增援範本編輯器 ---------- */
var RFE={side:0,id:''},RFEB=0;
function rfeT(){var L=rftOf(RFE.side);return L.filter(function(q){return q.id===RFE.id;})[0]||L[0]||null;}
function rftDlg(side,id){if(RFEB)return;RFEB=1;try{rftDlg0(side,id);}finally{RFEB=0;}}
function rftDlg0(side,id){if(side!==undefined)RFE.side=side;if(id!==undefined)RFE.id=id;var L=rftOf(RFE.side),T=rfeT();if(T)RFE.id=T.id;
  var o='<h3>自訂增援範本<small>'+esc(ptsSideTxt(RFE.side))+'</small></h3><div class="lw-row"><select data-c="rfesel">'+(L.length?L.map(function(q){return '<option value="'+esc(q.id)+'"'+(T&&q.id===T.id?' selected':'')+'>'+esc(q.n)+'</option>';}).join(''):'<option value="">（尚無）</option>')+'</select><button type="button" class="lw-btn sm" data-a="rfenew">＋ 新範本</button>'+(T?'<button type="button" class="lw-btn sm" data-a="rfedup">複製</button><button type="button" class="lw-btn sm dng" data-a="rferm">刪除</button>':'')+'<button type="button" class="lw-btn sm" data-a="rftexp">匯出全部</button><label class="lw-btn sm">匯入<input type="file" accept=".json,application/json" data-c="rftimp" hidden></label></div>';
  if(T){var men=0,veh=0;(T.items||[]).forEach(function(q){var t=typeOf(q[0]);if(t){men+=t.men*(+q[1]||0);veh+=t.veh*(+q[1]||0);}});var lk=rftLock(RFE.side,T);
    o+='<div class="lw-opt"><span>名稱</span><input type="text" value="'+esc(T.n)+'" data-c="rfe" data-f="n" style="width:18em"><span>編制</span><select data-c="rfe" data-f="ech">'+[[2,'營'],[3,'團'],[4,'旅'],[5,'師']].map(function(q){return '<option value="'+q[0]+'"'+(+T.ech===q[0]?' selected':'')+'>'+q[1]+'（含司令部）</option>';}).join('')+'</select></div>'+
      '<table class="lw-tbl"><tr><th>單位類型</th><th class="n">數量</th><th class="n">部隊點數</th><th></th></tr>'+(T.items||[]).map(function(q,i){return '<tr><td><select data-c="rfei" data-f="k" data-v="'+i+'">'+typeOpts(q[0])+'</select></td><td class="n"><input type="number" min="0" max="60" value="'+(+q[1]||0)+'" data-c="rfei" data-f="n" data-v="'+i+'" style="width:56px"></td><td class="n">'+fmt(fpType(q[0])*(+q[1]||0))+'</td><td><button type="button" class="lw-btn sm dng" data-a="rfedel" data-v="'+i+'">✕</button></td></tr>';}).join('')+'</table><button type="button" class="lw-btn sm" data-a="rfeadd">＋ 單位</button>'+
      '<div class="lw-note" style="margin-top:6px">共 '+fmt(men)+' 人、'+fmt(veh)+' 件裝備；'+(rpOn()?'派遣需要 <b>'+fmt(rftCost(T,RFE.side))+'</b> 增援點數':'部隊點數 '+fmt(rftCost(T,RFE.side)))+'。'+(lk.length?'<span style="color:#b3261e">需要先解鎖：'+lk.map(function(k){return esc(wpnOf(k)?wpnOf(k).n:k);}).join('、')+'</span>':'')+'在「戰中增援」選擇「自訂範本」派遣；可以匯出給其他玩家或下一場使用。</div>';}
  o+='<div class="lw-row"><button type="button" class="lw-btn pri" data-a="rfedone">完成</button></div>';if(UI.rfe&&UI.rfe.isConnected&&UI.rfe.firstChild)UI.rfe.firstChild.innerHTML=o;else UI.rfe=dlg(o,true);}
ACT.rftdlg=function(){var me=mySide();rftDlg(UI.rfd&&UI.rfd.isConnected?RF.side:me!==null?me:0,UI.rfd&&UI.rfd.isConnected?RF.rft:undefined);};
ACT.rfedone=function(){var d=UI.rfe;UI.rfe=null;if(d&&d.isConnected)d.remove();if(UI.rfd&&UI.rfd.isConnected){if(RF.src==='rft'&&RFE.id)RF.rft=RFE.id;rfDlg();}};
CHG.rfesel=function(t){rftDlg(undefined,t.value);};
CHG.rfe=function(t){var T=rfeT();if(!T)return;var f=t.getAttribute('data-f');if(f==='n')T.n=String(t.value||'').slice(0,60)||'自訂部隊';else T.ech=clamp(+t.value||2,1,6);rftDlg();};
CHG.rfei=function(t){var T=rfeT(),q=T&&T.items[+t.getAttribute('data-v')];if(!q)return;if(t.getAttribute('data-f')==='k')q[0]=t.value;else q[1]=clamp(Math.round(+t.value||0),0,60);rftDlg();};
ACT.rfeadd=function(){var T=rfeT();if(!T)return;var last=T.items[T.items.length-1];T.items.push([last?last[0]:(hqTypeFor('e1940')||'ri1940').replace(/^hq/,'ri'),1]);if(!typeOf(T.items[T.items.length-1][0]))T.items[T.items.length-1][0]=Object.keys(UT)[0];rftDlg();};
ACT.rfedel=function(b){var T=rfeT();if(!T)return;T.items.splice(+b.getAttribute('data-v'),1);rftDlg();};
ACT.rfenew=function(){var L=rftOf(RFE.side),hq=sideCmd(RFE.side),era=hq?uEra(hq).k:'e1940',inf=Object.keys(UT).filter(function(k){return UT[k].era===era&&UT[k].br==='inf';})[0]||Object.keys(UT).filter(function(k){return UT[k].br==='inf';})[0],T={id:'r'+Date.now().toString(36),n:'自訂營 '+(L.length+1),ech:2,items:[[inf,3]]};L.push(T);rftDlg(undefined,T.id);};
ACT.rfedup=function(){var T=rfeT();if(!T)return;var C=clone(T);C.id='r'+Date.now().toString(36);C.n=T.n+'（複本）';rftOf(RFE.side).push(C);rftDlg(undefined,C.id);};
ACT.rferm=function(){var L=rftOf(RFE.side),T=rfeT();if(!T)return;L.splice(L.indexOf(T),1);RFE.id=L[0]?L[0].id:'';rftDlg();};
/* ---------- 單位面板、兵力編成 ---------- */
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);var me=mySide();if(me!==null&&u.side!==me&&!seeAll())return o;return o+'<span>部隊點數</span><span>'+fmt(fpU(u))+'</span>';};})();
(function(){var b=PAGES.orbat;PAGES.orbat=function(host){b(host);if(!G)return;var ph=host.querySelector('.lw-pane .lw-ph');if(!ph)return;var me=mySide(),d=document.createElement('span');d.className='lw-note';d.style.cssText='margin-left:8px;white-space:nowrap';
  d.title='部隊點數只用來比較雙方戰力'+(rpOn()?'；增援點數：'+SIDES().filter(function(s){return me===null||s===me;}).map(function(s){return ptsSideTxt(s)+' '+fmt(Math.floor(rpS(s).v));}).join('、'):'');
  d.textContent='部隊點數：'+SIDES().map(function(s){return ptsSideTxt(s)+' '+(!G.started||me===null||s===me||seeAll()?fmt(fpSide(s)):'約 '+fmt(fpEst(me)));}).join('｜');ph.appendChild(d);};})();
/* ---------- 增援點數模式：擴充補給設施要付費；作戰中改武器要用呼叫物資 ---------- */
var NDC={thr:0.5,cap:0.02,cvn:4};
(function(){var b=CHG.nd;CHG.nd=function(t){var N=G.sides[LG.side].nodes[+t.getAttribute('data-v')],f=t.getAttribute('data-f');if(!N||!rpOn()||!G.started||!NDC[f])return b(t);var old=f==='cvn'?(N.cv?N.cv.n:0):N[f]||0,nv=Math.max(0,+t.value||0),cost=Math.max(0,(nv-old)*NDC[f]);
  if(cost>0&&!rpSpend(LG.side,cost,'node',N.name)){toast('增援點數不足：擴充需要 '+fmt(Math.ceil(cost))+' 點',4000);t.value=old;return;}return b(t);};})();
['uw','uwdel','uwplus','uwreset'].forEach(function(k){var H=k==='uw'?CHG:ACT,b=H[k];if(!b)return;H[k]=function(x){if(rpOn()&&G&&G.started&&UI.side>=0){toast('增援點數模式下，作戰中的武器請以「呼叫物資」補充或換裝。',4500);if(UI.panelTick)UI.panelTick(true);return;}return b(x);};});
/* ---------- 設定頁 ---------- */
setSec('pts','pts',{t:'點數',o:10,room:false,note:'部隊點數一律顯示，只用來比較雙方戰力（開戰後敵方只能依情報估計）。開戰後再改初始值不會影響已經發放的點數。',h:function(){var S=G.set;
  return setOpt(setRow('增援點數',setChk('setb','rp',S.rp,'所有增援、物資與建造都要花增援點數'))+
    setRow('初始','<input type="number" min="0" max="1000000" value="'+(S.rp0!==undefined&&S.rp0!==''?S.rp0:800)+'" data-c="setpt" data-f="rp0" style="width:90px">')+
    setRow('每日配給','<span><input type="text" value="'+(S.rpDay!==undefined&&S.rpDay!==''?S.rpDay:'auto')+'" data-c="setpt" data-f="rpDay" style="width:90px"> <span class="lw-note">「auto」依兵力的每日補給需求計算（約需求噸數的六成再加 250）</span></span>')+
    setRow('科技點數',setChk('setb','tech',S.tech,'開戰時沒有的武器與裝備要用科技點數解鎖'))+
    setRow('初始／每日','<span><input type="number" min="0" max="100000" value="'+(S.tp0!==undefined&&S.tp0!==''?S.tp0:30)+'" data-c="setpt" data-f="tp0" style="width:80px"> ／ <input type="number" min="0" max="10000" value="'+(S.tpDay!==undefined&&S.tpDay!==''?S.tpDay:20)+'" data-c="setpt" data-f="tpDay" style="width:70px"></span>'));}});
CHG.setpt=function(t){var f=t.getAttribute('data-f'),v=String(t.value||'').trim();G.set[f]=f==='rpDay'&&(v===''||/^auto$/i.test(v))?'auto':Math.max(0,+v||0);};
HELP14.push('<h4>點數：部隊點數、增援點數、科技點數與自訂增援範本</h4><ul>'+
  '<li><b>部隊點數</b>只用來衡量雙方戰力，不設限制：依各單位的火力（含武器配置）、裝甲、訓練與現有兵力計算，頂列與兵力編成頁顯示雙方總數。開戰後在戰場迷霧下，敵方的點數只能依目前掌握的情報估計。</li>'+
  '<li><b>增援點數</b>（設定頁開啟）：所有增援與物資都要花點數——派遣增援（依部隊點數）、呼叫物資（每噸陸路 1、鐵路 0.7、空運 3 點，武器每噸 20 點）、從地圖外進入戰場的日常補給（送達時每噸 0.25～2 點，依運輸方式）、休整時補充的兵員與裝備、工兵構築（野戰陣地 10、半永久工事 30、堡壘 80、稜堡 120、補給站 60、橋梁 60、渡口 5～25、造路 40、修路 8、修鐵道 15、修復設施 15 點）、擴充補給設施的吞吐量、儲量與車隊。點數不足時無法派遣或開工，日常補給只收下付得起的部分。</li>'+
  '<li>收入：每日固定配給（預設依兵力的補給需求計算）；交戰戰果（每殺傷一名敵軍 0.12 點、每擊毀一件裝備 2 點）；佔領目標（目標分數 ×5）與守住目標（每小時 1.5 點×分數/10，遭敵軍威脅時加倍）；把傷患後送出地圖（每人 0.3 點）、把戰俘後送出地圖（每人 0.5 點）。頂列的點數按鈕可以查看帳目。AI 兵力居於劣勢時會用點數購買增援。</li>'+
  '<li><b>科技點數</b>（設定頁開啟）：開戰時本方已有、或已經過時的武器不必解鎖；其他武器與裝備要用科技點數解鎖後，才能用「呼叫物資」配發或換裝，也才能派遣使用它們的單位類型。每日固定收入，交戰與佔領目標另有收入；較本時代更新的武器可以提前研發，代價較高。</li>'+
  '<li><b>自訂增援範本</b>：在「戰中增援」選「自訂範本」，或點數明細的「自訂增援範本」，自己組合營、團、旅（單位類型與數量，自動附司令部），顯示費用與需要解鎖的項目；可以臨時拼湊後匯出（.latoreinf.json）給其他玩家或下一場匯入使用。</li></ul>');
