/* ===================== 指揮權的移交、接管、共用，與友軍標示顏色 ===================== */
/* ---------- 友軍標示顏色：每位觀看者自己設定，只存在這台電腦的瀏覽器 ---------- */
var CMCK='lato-warsim-cmcol',CMCP=(function(){try{return JSON.parse(localStorage.getItem(CMCK)||'{}')||{};}catch(e){return {};}})();
function cmcSave(){try{localStorage.setItem(CMCK,JSON.stringify(CMCP));}catch(e){}}
function cmcGet(side,i){var a=CMCP['s'+side];return a&&a[i]||null;}
function cmcHex(c){return /^#[0-9a-f]{6}$/i.test(c||'')?c:'#888888';}
function cmcMine(u){return !!(CMCP.me&&G&&u&&u.side===UI.side&&cmMe(u.side).indexOf(tmOn(u.side)?cmOf(u):0)>=0);}
(function(){var b=cmCol;cmCol=function(side,i){return cmcGet(side,i)||b(side,i);};})();
(function(){var b=cmColU;cmColU=function(u){if(!u)return b(u);if(cmcMine(u))return CMCP.me;var c=cmcGet(u.side,tmOn(u.side)?cmOf(u):0);return c||b(u);};})();
function cmcHtml(){var sides=UI.side>=0&&G.set.fog?[UI.side]:SIDES(),o='<h3 style="margin:0 0 8px">友軍標示顏色</h3><div class="lw-note">只改變你自己畫面上的顏色（存在這台電腦的瀏覽器），不影響其他玩家。</div><div class="lw-kv" style="margin-top:8px">';
  sides.forEach(function(s){var L=cmList(s);L.forEach(function(R,i){var cur=cmCol(s,i);o+='<span style="color:'+esc(cur)+'">'+esc(G.sides[s].name)+(L.length>1?'・'+esc(R.n):'')+'</span><span><input type="color" data-c="cmcol" data-v="'+s+','+i+'" value="'+cmcHex(cur)+'"> '+(cmcGet(s,i)?'<button type="button" class="lw-btn sm" data-a="cmcrst" data-v="'+s+','+i+'">還原</button>':'<span class="lw-note">預設</span>')+'</span>';});});
  o+='<span>我的部隊</span><span><label><input type="checkbox" data-c="cmcme"'+(CMCP.me?' checked':'')+'> 自己指揮的部隊一律用</label> <input type="color" data-c="cmcmec" value="'+cmcHex(CMCP.me||CMCP.me0||'#00bcd4')+'"></span></div>';
  return o+'<div class="lw-row" style="margin-top:10px"><button type="button" class="lw-btn sm" data-a="cmcrst" data-v="all">全部還原</button><button type="button" class="lw-btn pri" data-a="x">完成</button></div>';}
function cmcRefresh(){var d=document.querySelector('.lw-dlg .lw-cmc');if(d)d.innerHTML=cmcHtml();if(typeof tmRedraw==='function')tmRedraw();else if(typeof vDraw==='function')vDraw(false);}
ACT.cmcol=function(){if(!G)return;var d=dlg('<div class="lw-cmc">'+cmcHtml()+'</div>');return d;};
CHG.cmcol=function(t){var v=t.getAttribute('data-v').split(','),k='s'+v[0],a=CMCP[k]||(CMCP[k]=[]);a[+v[1]]=t.value;cmcSave();cmcRefresh();};
CHG.cmcme=function(t){if(t.checked)CMCP.me=CMCP.me0||'#00bcd4';else{if(CMCP.me)CMCP.me0=CMCP.me;delete CMCP.me;}cmcSave();cmcRefresh();};
CHG.cmcmec=function(t){CMCP.me0=t.value;if(CMCP.me)CMCP.me=t.value;cmcSave();cmcRefresh();};
ACT.cmcrst=function(b){var v=b.getAttribute('data-v');if(v==='all'){CMCP={};}else{var q=v.split(','),a=CMCP['s'+q[0]];if(a)a[+q[1]]=null;}cmcSave();cmcRefresh();};

/* ---------- 指揮權的操作 ---------- */
function cmxBy(side,u){var me=cmMe(side),o=cmOf(u);if(me.indexOf(o)>=0)return o;return me.length?me[0]:-1;}
function cmxRes(r,def){if(!r)return;if(r.pending)return;if(r.err)toast(r.err,4500);else toast(r.msg||def,3500);if(typeof btStatus==='function'&&UI.tab==='battle'){btStatus();btLeft(true);}if(typeof vDraw==='function')vDraw(false);}
function cmxBtn(op,id,txt,tip){return '<button type="button" class="lw-btn sm" data-a="cmx" data-v="'+op+'" data-id="'+id+'"'+(tip?' title="'+esc(tip)+'"':'')+'>'+txt+'</button>';}
function cmxRow(u){if(!G||!G.started||!u||u.irr||!tmOn(u.side)||mySide()!==u.side)return '';var me=cmMe(u.side);if(!me.length)return '';var L=cmList(u.side),o=cmOf(u),mine=me.indexOf(o)>=0,sh=cmShOf(u),h='<span>指揮權</span><span>';
  if(mine){h+=cmxBtn('give',u.id,'⇄ 移交','把這支部隊交給隊友指揮（作戰管制權轉移，編制與補給不變）')+' '+cmxBtn('share',u.id,sh.length?'⇆ 共用中：'+esc(sh.map(function(j){return j<0?'全部隊友':L[j]?L[j].n:'';}).join('、')):'⇆ 共用','讓隊友也能直接指揮這支部隊');}
  else{var by=me[0];h+=cmxBtn('take',u.id,L[o].ai?'⤓ 接管':'⤓ 請求接管',L[o].ai?'把這支部隊收歸你指揮（AI 隊友立即交出）':'請「'+L[o].n+'」把這支部隊交給你指揮')+' '+(cmMay(u,by)?'<span class="lw-note">已共用給你，可以直接下令'+(cmHold(u)?'（你的命令優先，AI 4 小時內不改動）':'')+'</span>':cmxBtn('ask',u.id,L[o].ai?'⇆ 共用':'⇆ 請求共用',L[o].ai?'AI 隊友同意後，你也可以直接下令（仍由他指揮）':'請「'+L[o].n+'」讓你也能指揮'));}
  return h+'</span>';}
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);try{o+=cmxRow(u);}catch(e){}return o;};})();
ACT.cmx=function(b){var op=b.getAttribute('data-v'),u=uById(+b.getAttribute('data-id'));if(!u)return;var s=u.side,L=cmList(s),o=cmOf(u),by=cmxBy(s,u);if(by<0)return;
  if(op==='take'){cmxRes(cmTake(s,u.id,by),'已接管'+uName(u)+'。');return;}
  if(op==='ask'){cmxRes(cmShare(s,u.id,by,true,by),uName(u)+'已共用給你。');return;}
  var btns='';if(op==='give'){L.forEach(function(R,j){if(j!==o)btns+='<button type="button" class="lw-btn" data-a="cmxdo" data-op="give" data-id="'+u.id+'" data-to="'+j+'"><b style="color:'+esc(cmCol(s,j))+'">■</b> 交給「'+esc(R.n)+'」（'+(R.ai?'AI':'玩家')+'）</button>';});}
  else{var sh=cmShOf(u);btns+='<button type="button" class="lw-btn" data-a="cmxdo" data-op="share" data-id="'+u.id+'" data-to="-1"'+(sh.indexOf(-1)>=0?' disabled':'')+'>共用給全部隊友</button>';L.forEach(function(R,j){if(j!==o)btns+='<button type="button" class="lw-btn" data-a="cmxdo" data-op="share" data-id="'+u.id+'" data-to="'+j+'"'+(sh.indexOf(j)>=0?' disabled':'')+'><b style="color:'+esc(cmCol(s,j))+'">■</b> 共用給「'+esc(R.n)+'」</button>';});
    if(sh.length)btns+='<button type="button" class="lw-btn" data-a="cmxdo" data-op="unshare" data-id="'+u.id+'" data-to="-1">取消全部共用</button>';}
  dlg('<h3 style="margin:0 0 6px">'+(op==='give'?'移交指揮':'共用指揮')+'：'+esc(uName(u))+'</h3><div class="lw-note">'+(op==='give'?'移交後由對方指揮（交給 AI 隊友時，他會把這支部隊納入自己的計畫）；你可以之後再請求接管回來。':'共用後部隊仍歸你指揮，但對方也可以直接下令；最新的命令為準。')+'</div><div class="lw-row" style="flex-wrap:wrap;gap:6px;margin-top:8px">'+btns+'</div><div class="lw-row" style="margin-top:8px"><button type="button" class="lw-btn sm" data-a="x">取消</button></div>');};
ACT.cmxdo=function(b){var op=b.getAttribute('data-op'),u=uById(+b.getAttribute('data-id')),to=+b.getAttribute('data-to'),d=b.closest('.lw-dlg');if(d)d.remove();if(!u)return;var s=u.side,by=cmxBy(s,u),L=cmList(s);
  if(op==='give')cmxRes(cmGive(s,u.id,to,by),uName(u)+'已移交給「'+(L[to]?L[to].n:'')+'」。');
  else if(op==='share')cmxRes(cmShare(s,u.id,to,true,by),uName(u)+'已共用給'+(to<0?'全部隊友':'「'+L[to].n+'」')+'。');
  else cmxRes(cmShare(s,u.id,-1,false,by),'已取消'+uName(u)+'的共用。');};
ACT.cmxans=function(b){var s=mySide();if(s===null)return;var id=+b.getAttribute('data-v'),y=b.getAttribute('data-y')==='1',by=+b.getAttribute('data-by');cmxRes(cmAns(s,id,y,by),y?'已同意。':'已拒絕。');};
/* 隊友的請求：顯示在戰況面板最上方，新的請求跳出提示 */
var CMXSEEN={};
function cmxRqHtml(){var s=mySide();if(s===null||!G||!G.started||!tmOn(s))return '';var L=cmList(s),o='';cmMe(s).forEach(function(j){cmRqFor(s,j).forEach(function(q){var u=uById(q.u);if(!u)return;
    if(!CMXSEEN[q.id]){CMXSEEN[q.id]=1;toast('「'+L[q.from].n+'」請求'+(q.k==='take'?'接管':'共用')+uName(u)+'，請在戰況面板回覆。',6000);}
    o+='<div class="lw-cmxrq"><b style="color:'+esc(cmCol(s,q.from))+'">'+esc(L[q.from].n)+'</b> 請求'+(q.k==='take'?'<b>接管</b>':'<b>共用</b>')+'你的 <a class="cl" data-a="bsel" data-id="'+u.id+'">'+esc(uName(u))+'</a> <button type="button" class="lw-btn sm pri" data-a="cmxans" data-v="'+q.id+'" data-y="1" data-by="'+j+'">同意</button><button type="button" class="lw-btn sm" data-a="cmxans" data-v="'+q.id+'" data-y="0" data-by="'+j+'">拒絕</button></div>';});});return o;}
(function(){var b=btStatus;btStatus=function(){b.apply(this,arguments);try{var el=btEl('bst'),h=cmxRqHtml();if(el&&h)el.insertAdjacentHTML('afterbegin',h);}catch(e){}};})();
/* 指揮官卡與作戰頁：顏色設定的入口 */
(function(){var b=tmCardHtml;tmCardHtml=function(side){var o=b(side);return o.replace('</summary>','</summary><div class="lw-row"><button type="button" class="lw-btn sm" data-a="cmcol">🎨 友軍標示顏色</button></div>');};})();
(function(){var b=myCmdHtml;myCmdHtml=function(){var o=b();if(!G||UI.side<0)return o;return o+' <button type="button" class="lw-btn sm" data-a="cmcol" title="自訂本方各指揮官部隊在地圖上的顏色">🎨</button>';};})();
(function(){var st=document.createElement('style');st.textContent='.lw-cmxrq{border:1px solid #f9a825;background:rgba(255,193,7,.12);border-radius:6px;padding:6px 8px;margin:0 0 6px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:12px}.lw-cmxrq a{cursor:pointer;text-decoration:underline}';document.head.appendChild(st);})();
