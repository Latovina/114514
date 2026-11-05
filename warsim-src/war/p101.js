/* ===================== 浮動視窗：全螢幕地圖上，後勤、戰報與說明開成可拖曳、摺疊、縮放、關閉的視窗，地圖照常操作；
   左右面板也能拖到任何位置、調整大小、摺疊或收起。分頁列與面板改用單色圖示，標題列改成深色（Command Ops 風格）。 ===================== */
(function(){var st=document.createElement('style');st.textContent='.lw-fw{position:absolute;z-index:12;display:flex;flex-direction:column;background:#f6f5f1;border:1px solid rgba(20,30,40,.35);border-radius:10px;box-shadow:0 12px 36px rgba(0,0,0,.42);overflow:hidden;min-width:240px;min-height:34px}'+
  '.lw-fwh{display:flex;align-items:center;gap:6px;padding:4px 6px 4px 10px;background:#1f2a36;color:#fff;font-size:13px;cursor:move;user-select:none;-webkit-user-select:none;flex:none;touch-action:none}.lw-fwh b{font-weight:600}'+
  '.lw-fwh button,.lw-fwp>.lw-ph .lw-fwbt{background:transparent;border:1px solid transparent;color:#cfd8e3;border-radius:5px;width:26px;height:24px;padding:0;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;flex:none}'+
  '.lw-fwh button:hover,.lw-fwp>.lw-ph .lw-fwbt:hover{background:#2e3e50;color:#fff;border-color:#4a5b6d}'+
  '.lw-fwb{flex:1;min-height:0;overflow:auto;position:relative}.lw-fwb>.lw-main{max-width:none;padding:10px}.lw-fwb>.lw-work{height:100%;min-height:0}'+
  '.lw-fw.fwc .lw-fwb,.lw-fw.fwc .lw-fwr{display:none}.lw-fw.fwc{height:auto!important;min-height:0}'+
  '.lw-fwr{position:absolute;right:0;bottom:0;width:16px;height:16px;cursor:nwse-resize;z-index:2;touch-action:none;background:linear-gradient(135deg,transparent 52%,rgba(31,42,54,.55) 52%,rgba(31,42,54,.55) 60%,transparent 60%,transparent 70%,rgba(31,42,54,.55) 70%,rgba(31,42,54,.55) 78%,transparent 78%)}'+
  '.lw-fwr.l{left:0;right:auto;cursor:nesw-resize;transform:scaleX(-1)}'+
  /* 面板：深色標題列，可拖曳 */
  '.lw-land .lw-fwp>.lw-ph{background:#1f2a36!important;color:#fff;cursor:move;touch-action:none;border-radius:10px 10px 0 0}.lw-land .lw-fwp>.lw-ph .lw-btn{background:transparent;color:#d6dee8;border-color:#4a5b6d}.lw-land .lw-fwp>.lw-ph .lw-btn.pri{background:#3d5a80;color:#fff;border-color:#5b7aa4}'+
  '.lw-land .lw-fwp>.lw-ph .lw-btn:hover{background:#2e3e50;color:#fff}.lw-land .lw-fwp>.lw-ph .lw-badge{background:#e53935;color:#fff}.lw-land .lw-fwp>.lw-ph b.lw-fwt{font-size:13px;margin-right:auto}'+
  '.lw-land .lw-body>.lw-work:has(>.lw-mh)>.lw-pane.fwc{bottom:auto!important;height:auto!important}.lw-fwp.fwc>.lw-pb,.lw-fwp.fwc>.lw-fwr{display:none}'+
  '.lw-land .lw-tabs button.win{box-shadow:inset -3px 0 0 #7cb6ff}.lw-land .lw-tabs button i svg{width:20px;height:20px}.lw-ph button .lw-ico{vertical-align:-2px;margin-right:3px}';document.head.appendChild(st);})();
var FWT={logi:['後勤','logi'],rep:['戰報','rep'],help:['說明','help']},FW={z:12,ctx:null,act:null,drag:0};
function fwOn(){return !!(UI.land&&UIP.fwOn!==0&&!(typeof PHN!=='undefined'&&PHN.port));}/* 手機直向用底部抽屜，不開浮動視窗 */
function fwSt(k){var M=UIP.fw||(UIP.fw={});return M[k]||(M[k]={});}
/* 視窗放在地圖頁的工作區（和左右面板同一層）；不在地圖頁時沒有 */
function fwHost(){var W=UI.baseEl&&UI.baseEl.querySelector(':scope>.lw-work');return W&&W.querySelector(':scope>.lw-mh')?W:null;}
function fwEl(t){var W=fwHost();return W?W.querySelector(':scope>.lw-fw[data-w="'+t+'"]'):null;}
/* 帶到最上層；視窗（不是左右面板）同時成為「使用中」：再按一次它的分頁或快捷鍵就關上 */
function fwFront(el){FW.z=FW.z>=40?12:FW.z+1;el.style.zIndex=FW.z+(el.classList.contains('lw-fwp')?-4:0);if(el.classList.contains('lw-fw'))FW.act=el.getAttribute('data-w');}
/* 位置：記下的位置（限制在工作區內）、放大、或預設在地圖中央偏左 */
function fwPlace(el,S,def){var W=el.parentElement,cw=W.clientWidth,ch=W.clientHeight,s=el.style;if(S.max){s.left='10px';s.top='10px';s.width=(cw-20)+'px';s.height=(ch-20)+'px';s.right=s.bottom='auto';return;}
  if(S.x===undefined){if(!def)return;S={x:def[0],y:def[1],w:def[2],h:def[3]};}var w=clamp(S.w||560,240,Math.max(240,cw-8)),h=clamp(S.h||420,120,Math.max(120,ch-8));
  s.width=w+'px';s.height=h+'px';s.left=clamp(S.x,0,Math.max(0,cw-60))+'px';s.top=clamp(S.y,0,Math.max(0,ch-30))+'px';s.right=s.bottom='auto';}
function fwSave(el,k){var S=fwSt(k);S.x=el.offsetLeft;S.y=el.offsetTop;S.w=el.offsetWidth;S.h=el.offsetHeight;S.max=0;uipSave();if(el.classList.contains('lw-fwp')){landPads();vDraw(false);}}
/* 拖曳標題列移動、拖曳角落縮放（右側面板的把手在左下角） */
function fwGrab(el,k,hd,left){var h=hd||el.querySelector('.lw-fwh'),r=el.querySelector(':scope>.lw-fwr');
  var drag=function(e,kind){var W=el.parentElement.getBoundingClientRect(),R=el.getBoundingClientRect(),x0=e.clientX,y0=e.clientY,tg=e.currentTarget;tg.setPointerCapture(e.pointerId);fwFront(el);FW.drag=1;
    var mv=function(ev){var dx=ev.clientX-x0,dy=ev.clientY-y0,s=el.style;s.right=s.bottom='auto';
      if(kind==='m'){s.left=clamp(R.left-W.left+dx,0,W.width-60)+'px';s.top=clamp(R.top-W.top+dy,0,W.height-30)+'px';}
      else{var hh=clamp(R.height+dy,120,W.bottom-R.top);s.top=(R.top-W.top)+'px';s.height=hh+'px';if(left){var ww=clamp(R.width-dx,240,R.right-W.left);s.left=(R.right-W.left-ww)+'px';s.width=ww+'px';}else{s.left=(R.left-W.left)+'px';s.width=clamp(R.width+dx,240,W.right-R.left)+'px';}}};
    var up=function(){FW.drag=0;tg.removeEventListener('pointermove',mv);tg.removeEventListener('pointerup',up);tg.removeEventListener('pointercancel',up);fwSave(el,k);};
    tg.addEventListener('pointermove',mv);tg.addEventListener('pointerup',up);tg.addEventListener('pointercancel',up);e.preventDefault();};
  h.addEventListener('pointerdown',function(e){if(e.button!==0||e.target.closest('button,select,input,a,label'))return;drag(e,'m');});
  if(r)r.addEventListener('pointerdown',function(e){if(e.button===0)drag(e,'r');});el.addEventListener('pointerdown',function(){fwFront(el);},true);}
/* 視窗內的操作當作在那一頁上做：頁面自己的「重畫這一頁」會重畫視窗，而不是切換分頁 */
function fwCtx(el,t){['click','change','input'].forEach(function(ev){el.addEventListener(ev,function(e){if(e.target.closest('.lw-fwh')||UI.tab===t)return;var prev=UI.tab;FW.ctx=t;UI.tab=t;setTimeout(function(){if(UI.tab===t)UI.tab=prev;FW.ctx=null;},0);},true);});}
/* 重畫視窗內容：保留捲動位置與展開的段落 */
function fwRender(t){var el=fwEl(t);if(!el)return;var b=el.querySelector('.lw-fwb'),sy=b.scrollTop,od=[].map.call(b.querySelectorAll('details'),function(d){return d.open;}),sc=[].map.call(b.querySelectorAll('.lw-sc'),function(d){return d.scrollTop;}),prev=UI.tab,pc=FW.ctx;FW.ctx=t;UI.tab=t;try{b.innerHTML='';PAGES[t](b);}finally{UI.tab=prev;FW.ctx=pc;}
  var D=b.querySelectorAll('details');if(D.length===od.length)od.forEach(function(o,i){if(o)D[i].open=true;});var C=b.querySelectorAll('.lw-sc');if(C.length===sc.length)sc.forEach(function(v,i){C[i].scrollTop=v;});b.scrollTop=sy;el._t=G?G.t:0;}
/* 開著的後勤與戰報視窗隨作戰進行更新；滑鼠停在視窗上、正在輸入或拖曳時先不更新 */
function fwTick(){if(!fwOn()||!G||!G.started||G.replay||FW.drag)return;var W=fwHost();if(!W)return;W.querySelectorAll(':scope>.lw-fw').forEach(function(el){var t=el.getAttribute('data-w');if(t==='help'||el.classList.contains('fwc')||el._t===G.t||el.matches(':hover')||el.contains(document.activeElement))return;fwRender(t);});}
setInterval(function(){try{fwTick();}catch(e){}},4000);
function fwOpen(t){var W=fwHost();if(!W)return false;var el=fwEl(t),S=fwSt(t);
  if(!el){el=document.createElement('div');el.className='lw-fw'+(S.c?' fwc':'');el.setAttribute('data-w',t);el.innerHTML='<div class="lw-fwh">'+ico(FWT[t][1],15)+'<b>'+FWT[t][0]+'</b><span class="lw-sp"></span><button type="button" data-a="fwcol" title="摺疊／展開">'+ico('minus',14)+'</button><button type="button" data-a="fwmax" title="放大／還原">'+ico('full',14)+'</button><button type="button" data-a="fwx" title="關閉">'+ico('close',14)+'</button></div><div class="lw-fwb"></div><div class="lw-fwr" title="拖曳調整大小"></div>';
    W.appendChild(el);var n=W.querySelectorAll(':scope>.lw-fw').length-1,cw=W.clientWidth,ch=W.clientHeight;fwPlace(el,S,[(VW.padL||0)+30+n*28,40+n*28,Math.min(760,cw-(VW.padL||0)-(VW.padR||0)-60),Math.min(560,ch-80)]);fwGrab(el,t);fwCtx(el,t);}
  S.open=1;uipSave();fwFront(el);fwRender(t);tabsRender();return true;}
function fwClose(t){var el=fwEl(t);if(el)el.remove();fwSt(t).open=0;if(FW.act===t)FW.act=null;uipSave();tabsRender();}
/* 點地圖或其他地方：視窗不再是「使用中」（分頁列除外，按分頁才能判斷要帶到最上層還是關上） */
document.addEventListener('pointerdown',function(e){if(!FW.act)return;var t=e.target;if(t&&t.closest&&t.closest('.lw-fw,.lw-tabs'))return;FW.act=null;},true);
/* Esc：沒有對話框時關上使用中的視窗 */
document.addEventListener('keydown',function(e){if(e.key!=='Escape'||!FW.act||!root||!root.isConnected||kTyping(e.target)||e.ctrlKey||e.metaKey||e.altKey)return;if(root.querySelector('.lw-dlg')||UI.sheetOn)return;if(fwEl(FW.act))fwClose(FW.act);else FW.act=null;},true);
function fwKey(b){var w=b.closest('.lw-fw');return w?w.getAttribute('data-w'):null;}
ACT.fwx=function(b){var t=fwKey(b);if(t)fwClose(t);};
ACT.fwcol=function(b){var w=b.closest('.lw-fw'),t=fwKey(b);if(!w)return;w.classList.toggle('fwc');fwSt(t).c=w.classList.contains('fwc')?1:0;uipSave();};
ACT.fwmax=function(b){var w=b.closest('.lw-fw'),t=fwKey(b);if(!w)return;var S=fwSt(t);S.max=S.max?0:1;w.classList.remove('fwc');S.c=0;uipSave();if(!S.max&&S.x===undefined){w.style.cssText='';fwPlace(w,S,[(VW.padL||0)+30,40,Math.min(760,w.parentElement.clientWidth-60),Math.min(560,w.parentElement.clientHeight-80)]);}else fwPlace(w,S);};
/* 回到地圖頁時把開著的視窗重新開起來 */
function fwRestore(){if(!fwOn()||!G||!G.started||G.replay)return;var a=FW.act;Object.keys(FWT).forEach(function(t){if(fwSt(t).open&&!fwEl(t))fwOpen(t);});FW.act=a;}/* 重新開起來的視窗不算「使用中」 */
(function(){var b=show;show=function(tab){
  /* 已經開著：使用中就關上；摺疊著就展開；被蓋住就帶到最上層並更新內容 */
  if(FWT[tab]&&fwOn()&&G&&G.started&&!G.replay&&(UI.tab==='battle'||FW.ctx===tab)&&fwHost()){var el=fwEl(tab),S=fwSt(tab);if(el&&FW.ctx!==tab&&UI.tab==='battle'){if(S.c){el.classList.remove('fwc');S.c=0;}else if(FW.act===tab){fwClose(tab);return;}}fwOpen(tab);return;}
  if(tab==='battle')FW.act=null;var r=b.apply(this,arguments);if(UI.tab==='battle'&&fwOn()){fwPanes();fwRestore();}return r;};})();
/* ---------- 左右面板：拖曳、縮放、摺疊；拖出去之後不再佔用地圖的邊緣 ---------- */
var FWPI={tree:'tree',log:'log',bt:'chart',evt:'evt',inbox:'inbox'};
function fwPanes(){var W=fwHost();if(!W)return;[['pL',W.querySelector(':scope>.lw-pane.lw-left')],['pR',W.querySelector(':scope>.lw-pane:not(.lw-left)')]].forEach(function(q){var k=q[0],P=q[1];if(!P||P._fw)return;P._fw=1;P.classList.add('lw-fwp');var R=k==='pR',ph=P.querySelector(':scope>.lw-ph');
    if(!ph){ph=document.createElement('div');ph.className='lw-ph';ph.innerHTML='<b class="lw-fwt">'+ico('users',14)+' 部隊與命令</b>';P.insertBefore(ph,P.firstChild);}
    ph.insertAdjacentHTML('beforeend','<button type="button" class="lw-fwbt" data-a="fwpcol" data-v="'+k+'" title="摺疊／展開">'+ico('minus',14)+'</button><button type="button" class="lw-fwbt" data-a="fwpdock" data-v="'+k+'" title="停靠回地圖邊緣（雙擊標題列也可以）">'+ico('pin',14)+'</button><button type="button" class="lw-fwbt" data-a="ptg" data-v="'+(R?'r':'l')+'" title="收起（鍵盤 '+(R?'R':'L')+'）">'+ico('close',14)+'</button>');
    var g=document.createElement('div');g.className='lw-fwr'+(R?' l':'');g.title='拖曳調整大小';P.appendChild(g);fwGrab(P,k,ph,R);ph.addEventListener('dblclick',function(e){if(!e.target.closest('button'))fwDock(k);});
    var S=fwSt(k);if(S.x!==undefined)fwPlace(P,S);if(S.c)P.classList.add('fwc');});fwIcons();landPads();}
function fwDock(k){var M=UIP.fw||{};M[k]={c:(M[k]||{}).c};uipSave();var W=fwHost(),P=W&&W.querySelector(k==='pL'?':scope>.lw-pane.lw-left':':scope>.lw-pane:not(.lw-left)');if(P){P.style.left=P.style.top=P.style.width=P.style.height=P.style.right=P.style.bottom='';}landPads();vDraw(false);}
ACT.fwpdock=function(b){fwDock(b.getAttribute('data-v'));};
ACT.fwpcol=function(b){var k=b.getAttribute('data-v'),P=b.closest('.lw-pane');if(!P)return;P.classList.toggle('fwc');fwSt(k).c=P.classList.contains('fwc')?1:0;uipSave();landPads();};
/* 拖出去的面板不再佔用地圖邊緣：地圖置中、圖層列與縮放鍵不必讓位 */
(function(){var b=landPads;landPads=function(){b.apply(this,arguments);if(!UI.land||UI.sheetOn)return;var ch=false;if(fwSt('pL').x!==undefined&&VW.padL){VW.padL=0;root.style.setProperty('--padl','0px');ch=true;}if(fwSt('pR').x!==undefined&&VW.padR){VW.padR=0;root.style.setProperty('--padr','0px');ch=true;}};})();
/* 面板分頁按鈕與分頁列：單色圖示 */
function fwIcons(){var W=fwHost();if(!W)return;W.querySelectorAll('.lw-pane.lw-left>.lw-ph button[data-a="btleft"]').forEach(function(b){var v=b.getAttribute('data-v');if(FWPI[v]&&!b.querySelector('.lw-ico'))b.insertAdjacentHTML('afterbegin',ico(FWPI[v],14));});}
(function(){var b=btLeft;btLeft=function(){var r=b.apply(this,arguments);if(UI.land)fwIcons();return r;};})();
(function(){var b=tabsRender;tabsRender=function(){b.apply(this,arguments);if(!UI.land||!UI.tabs)return;UI.tabs.querySelectorAll('button[data-a="tab"]').forEach(function(btn){var v=btn.getAttribute('data-v'),i=btn.querySelector('i');if(i&&ICO[v])i.innerHTML=ico(v,20);btn.classList.toggle('win',!!(FWT[v]&&fwEl(v)));});};})();
/* ---------- 設定與快捷鍵 ---------- */
setSec('gfx','fw',{t:'浮動視窗',o:31,local:true,h:function(){return setOpt(setRow('浮動視窗',setChk('fwon','',UIP.fwOn!==0,'全螢幕地圖時，後勤、戰報與說明開成地圖上的視窗，可以拖曳、摺疊、縮放；關閉則開成蓋住地圖的整頁')))+
  '<div class="lw-row"><button type="button" class="lw-btn sm" data-a="fwreset">重設所有視窗與面板的位置</button></div><div class="lw-note">左右面板拖曳標題列就能移到任何位置，拖右下角（右側面板是左下角）調整大小；雙擊標題列或按圖釘停靠回地圖邊緣。只影響這個畫面。</div>';}});
CHG.fwon=function(t){UIP.fwOn=t.checked?1:0;uipSave();};
ACT.fwreset=function(){UIP.fw={};uipSave();toast('視窗與面板的位置已重設。');var W=fwHost();if(W){W.querySelectorAll(':scope>.lw-fw').forEach(function(e){e.remove();});['pL','pR'].forEach(fwDock);}};
if(typeof hkReg==='function')hkReg('rep','戰報','page','v',function(){show('rep');},function(){return !!(G&&G.started);});
if(typeof HELP14!=='undefined')HELP14.push('<h4>浮動視窗與面板</h4><ul><li>全螢幕地圖時，後勤（鍵盤 G）、戰報（鍵盤 V）與說明開成地圖上的視窗：拖曳標題列移動，拖右下角調整大小，可以摺疊、放大或關閉。地圖照常可以操作。</li>'+
  '<li>正在使用的視窗（剛打開或剛點過）再按一次它的分頁或快捷鍵就關上，Esc 也可以；點過地圖或別的視窗之後再按，會把它帶到最上層並更新內容。開著的後勤與戰報視窗會隨作戰進行自動更新，滑鼠停在視窗上或正在輸入時暫停更新。</li>'+
  '<li>左側的編制、紀錄、戰鬥、事件、收件匣面板與右側的部隊面板也能拖到任何位置、調整大小與摺疊；雙擊標題列或按圖釘停靠回地圖邊緣，按 L、R 收起或展開。</li><li>位置會記在這台電腦上；設定的「畫面」可以重設所有位置，或改回整頁顯示。</li></ul>');
