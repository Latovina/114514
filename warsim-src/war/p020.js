
/* ===================== 全螢幕橫版：整個畫面都是地圖，其他功能以浮動面板呈現 ===================== */
var MAPT={battle:1,deploy:1,map:1,replay:1},TABI={start:'🏁',map:'🗺',orbat:'🎖',deploy:'📍',battle:'⚔',logi:'🚚',rep:'📰',replay:'⏮',set:'⚙',help:'❔'};
function landWant(){var m=UIP.land;if(m==='on')return true;if(m==='off')return false;var w=window.innerWidth,h=window.innerHeight;return w>h&&(w>=900||h<=520);}
/* 浮動面板佔掉的寬度；功能面板開著時沿用原值，關上後地圖位置不會跳動 */
function landPads(){if(UI.land&&UI.sheetOn)return;var W=UI.land&&UI.baseEl?UI.baseEl.querySelector(':scope>.lw-work'):null,mh=W&&W.querySelector(':scope>.lw-mh'),L=mh&&W.querySelector(':scope>.lw-pane.lw-left'),R=mh&&W.querySelector(':scope>.lw-pane:not(.lw-left)');
  VW.padL=L&&L.offsetWidth?L.offsetLeft+L.offsetWidth:0;VW.padR=R&&R.offsetWidth?Math.max(0,W.clientWidth-R.offsetLeft):0;root.style.setProperty('--padl',VW.padL+'px');root.style.setProperty('--padr',VW.padR+'px');}
/* 左側面板與圖層列：沒有設定過時，窄螢幕預設收起 */
function lpOpen(){return UIP.lp===null||UIP.lp===undefined?window.innerWidth>=1100:!!UIP.lp;}
function lyOpen(){return UIP.ly===null||UIP.ly===undefined?window.innerWidth>=1100:!!UIP.ly;}
function landCls(){root.classList.toggle('lw-nolp',!lpOpen());root.classList.toggle('lw-lyc',!lyOpen());root.classList.toggle('lw-norp',!UIP.rp);root.classList.toggle('lw-sheeton',!!UI.sheetOn);landPads();}
function landApply(force){var on=landWant(),was=!!UI.land;if(!force&&UI.landInit&&on===was)return;UI.landInit=1;UI.land=on;root.classList.toggle('lw-land',on);
  if(on&&!UI.sheet){var s=document.createElement('div');s.className='lw-sheet';s.innerHTML='<div class="lw-sheet-h"><b data-k="sheett"></b><span class="lw-sp"></span><button type="button" class="lw-btn sm" data-a="sheetx" title="回到地圖（Esc）">✕ 回到地圖</button></div><div class="lw-sheet-b"></div>';root.appendChild(s);UI.sheet=s;UI.sheetB=s.querySelector('.lw-sheet-b');UI.baseEl=UI.body;}
  if(!on){if(UI.sheet){UI.sheet.remove();UI.sheet=null;}if(UI.baseEl)UI.body=UI.baseEl;UI.sheetOn=false;}landCls();barRender();var t=UI.tab;UI.baseTab=null;/* 版面換了，地圖可視範圍也變了：在面板打開之前重新全圖 */var refit=function(){if(was!==on&&G&&G.map&&VW.wrap&&VW.wrap.isConnected)vFit();};
  /* 切到全螢幕地圖時，非地圖頁開在地圖上方 */if(on&&G&&G.map&&!MAPT[t]&&t!=='start'&&!G.replay){show(G.started?'battle':'deploy');refit();if(UI.tab!==t)show(t);}else{show(t);refit();}}
(function(){var b=show;show=function(tab){if(!UI.land){if(UI.baseEl)UI.body=UI.baseEl;return b(tab);}var t=tab;if(!G&&t!=='start'&&t!=='help'&&t!=='replay')t='start';if(G&&!G.started&&/^(battle|logi|rep)$/.test(t))t='orbat';
  var mapNow=!!(UI.baseTab&&MAPT[UI.baseTab]&&G&&UI.baseEl&&UI.baseEl.querySelector('.lw-mh'));
  if(MAPT[t]||!mapNow){UI.body=UI.baseEl;UI.sheetOn=false;if(UI.sheet)UI.sheet.classList.remove('on');var f0=VW.fit;b(t);UI.baseTab=t;landCls();landHandles();/* 第一次全圖時還不知道浮動面板的寬度，量好之後再對一次 */if(!f0&&VW.fit&&(VW.padL||VW.padR))vFit();return;}
  UI.body=UI.sheetB;UI.sheetOn=true;UI.sheet.classList.add('on');var tt=UI.sheet.querySelector('[data-k="sheett"]');if(tt)tt.textContent=(TABS.filter(function(q){return q[0]===t;})[0]||['',''])[1];b(t);landCls();};})();
ACT.sheetx=function(){show(UI.baseTab||'battle');};
/* 地圖頁上收合左右面板的把手 */
function landHandles(){if(!UI.land||!UI.baseEl)return;var W=UI.baseEl.querySelector('.lw-work');if(!W||!W.querySelector('.lw-mh'))return;['l','r'].forEach(function(s){var h=document.createElement('button');h.type='button';h.className='lw-ptg '+s;h.setAttribute('data-a','ptg');h.setAttribute('data-v',s);h.title=s==='l'?'收合或展開左側面板（鍵盤 L）':'收合或展開右側面板（鍵盤 R）';W.appendChild(h);});landHandleTxt();}
function landHandleTxt(){root.querySelectorAll('.lw-ptg').forEach(function(h){var s=h.getAttribute('data-v'),open=s==='l'?lpOpen():UIP.rp;h.textContent=s==='l'?(open?'◀':'▶'):(open?'▶':'◀');});}
function panelToggle(s){if(s==='l')UIP.lp=lpOpen()?0:1;else UIP.rp=UIP.rp?0:1;uipSave();landCls();landHandleTxt();vDraw(true);}
ACT.ptg=function(b){panelToggle(b.getAttribute('data-v'));};
/* 地圖適配與拖曳範圍：把左右浮動面板佔掉的寬度扣掉，讓地圖置中在看得到的區域，也能把地圖每個角落拖到面板之間 */
vClamp=function(){var MP=G.map,W=MP.GW*VW.s,H=MP.GH*VW.s,m=24,pl=VW.padL||0,pr=VW.padR||0,vw=VW.cw-pl-pr;if(!(W>0&&H>0))return;if(W+2*m<=vw)VW.ox=pl+(vw-W)/2;else VW.ox=clamp(VW.ox,VW.cw-pr-W-m,pl+m);if(H+2*m<=VW.ch)VW.oy=(VW.ch-H)/2;else VW.oy=clamp(VW.oy,VW.ch-H-m,m);};
vFit=function(){if(!G||!G.map)return;var MP=G.map,pl=VW.padL||0,pr=VW.padR||0,w=Math.max(120,VW.cw-pl-pr),s=Math.min(w/MP.GW,VW.ch/MP.GH)*0.98;VW.s=s;VW.s0=s;VW.ox=pl+(w-MP.GW*s)/2;VW.oy=(VW.ch-MP.GH*s)/2;VW.fit=true;vDraw(true);};
/* 側欄（分頁）改成左側的圖示列 */
(function(){var b=tabsRender;tabsRender=function(){b();if(!UI.land)return;UI.tabs.querySelectorAll('button[data-a="tab"]').forEach(function(btn){var v=btn.getAttribute('data-v'),t=btn.textContent;btn.title=t;btn.innerHTML='<i>'+(TABI[v]||'•')+'</i><span>'+t+'</span>';});};})();
/* 頂列：全螢幕、版面切換、鍵盤說明 */
(function(){var b=barRender;barRender=function(){b();if(!UI.bar)return;var s=document.createElement('span');s.className='lw-bx';s.innerHTML='<button type="button" data-a="keyhelp" title="鍵盤與滑鼠操作（?）">⌨</button><button type="button" data-a="landtg" title="切換版面：全螢幕地圖／分頁">'+(UI.land?'▤':'⛶')+'</button>'+(UI.land&&root.requestFullscreen?'<button type="button" data-a="fullscr" title="瀏覽器全螢幕（F）">⤢</button>':'');UI.bar.appendChild(s);if(UI.land)barFit();layoutVar();};})();
/* 橫版頂列只有一行：擠不下時依序把「自動暫停」縮成圖示、速度按鈕換成下拉選單、藏起想定名稱與天氣 */
function barFit(){var B=UI.bar,tc=B.querySelector('.lw-tc'),over=function(){return B.scrollWidth>B.clientWidth+1;};if(!tc)return;var ap=tc.querySelector('[data-a="appop"]');if(ap)ap.textContent='⏸⚙';var scn=B.querySelector('.lw-scn');if(scn&&over())scn.style.display='none';if(!over())return;
  var bs=tc.querySelectorAll('button[data-a="spd"]');if(bs.length){var sel=document.createElement('select');sel.setAttribute('data-c','spd');sel.title='速度（鍵盤 1～9、0）';sel.innerHTML=SPEEDS.map(function(v){return '<option value="'+v+'"'+(UI.speed===v?' selected':'')+'>'+(v>=3600?'每秒 '+(v/3600)+' 小時':v>=60?'每秒 '+(v/60)+' 分':v+' 倍')+'</option>';}).join('');tc.insertBefore(sel,bs[0]);bs.forEach(function(x){x.remove();});}
  [B.querySelector('.lw-wx'),tc.querySelector('.lw-rt')].forEach(function(e){if(e&&over())e.style.display='none';});}
ACT.landtg=function(){UIP.land=UI.land?'off':'on';uipSave();landApply(true);toast(UI.land?'全螢幕地圖：其他功能在左側圖示列，按 Esc 回到地圖。':'已改回分頁版面。');};
ACT.fullscr=function(){try{if(document.fullscreenElement)document.exitFullscreen();else root.requestFullscreen();}catch(e){}};
/* 正在輸入文字時不攔截按鍵；勾選框與按鈕上仍可用快捷鍵 */
function kTyping(t){if(!t||!t.tagName)return false;if(t.isContentEditable)return true;var n=t.tagName;if(n==='TEXTAREA'||n==='SELECT')return true;if(n==='INPUT')return !/^(checkbox|radio|button|submit|reset|range|color|file)$/i.test(t.type||'text');return false;}
/* 鍵盤操作改由快捷鍵登錄表處理（o69_keys.js） */
/* 面板開著時，地圖照常更新；開始或暫停不會把面板關掉 */
(function(){var b=toggleRun;toggleRun=function(){if(UI.land&&UI.sheetOn&&UI.baseTab==='battle'&&G&&G.started&&!G.over){UI.run=!UI.run;UI.lastTs=0;UI.acc=0;barRender();return;}return b();};})();
(function(){var b=UI.after;UI.after=function(force){if(UI.land&&UI.sheetOn&&UI.baseTab==='battle'&&G&&G.started&&VW.cw){vDraw(!!(G.dirty&&G.dirty.length)||force);hudTick();return;}return b(force);};})();
window.addEventListener('resize',function(){if(typeof root!=='undefined'&&root&&UI.landInit){landApply(false);if(UI.land)landPads();}});
(function(){var b=boot;boot=function(){b();landApply(true);};})();

/* ---------- 說明 ---------- */
var V9HELP='<h4>v9：自動構工、後勤設施的遷移、戰區體系、全螢幕地圖</h4><ul>'+
  '<li>停在原地的部隊會自己構工，不必一一下令：步兵挖壕、架鐵絲網、築碉堡（依年代），砲兵整備砲位，指揮部構築掩體。同一地區相持越久越完整：倉促陣地（1 小時）→ 塹壕（6 小時）→ 鐵絲網與碉堡（1 天）→ 雷區與交通壕（3 天）→ 第三道防線與縱深防禦（7 天）；有工兵在場時更快。</li>'+
  '<li>後勤部隊停下來會開設野戰補給站，衛生部隊在後方開設野戰醫院；工兵自行修復受損的設施、重建被炸毀的橋梁、整修被彈坑破壞的道路，相持一天以上在補給站旁設彈藥庫與油庫，兩天以上開出通往前線的補給道路，三天以上在需要時闢建野戰機場。</li>'+
  '<li>遷移：前線推進、補給站被拋在 25 公里後方時，自動開設的補給站與野戰醫院會跟著前移；敵軍接近而附近沒有足夠的友軍時，補給站用車隊運走物資後撤，來不及運走的就地焚毀，野戰醫院帶著傷患後撤。玩家自己設的補給站只在受威脅時撤離。</li>'+
  '<li>戰區體系：相鄰的前線格子會自然組成「防區」並編號，後方的補給站、醫院、油彈庫、機場與補給道路構成後方體系。地圖的「防區」圖層顯示各防區與工事等級，後勤頁與戰況總覽有完整度與明細。設定頁可以選擇自動構工的範圍：雙方、只有電腦指揮的部隊，或關閉。</li>'+
  '<li>援助團體、教會團體與戰地記者也可以點選後下達與平民相同的行動：護送、救護支援、贈與物資、拘留盤查、扣押為人質、開火、釋放。扣押與開火是戰爭罪行，援助團體會暫停在我方地區的工作。</li>'+
  '<li>地圖圖層列多了「番號」開關（選取的部隊一律顯示名稱）。</li>'+
  '<li>全螢幕地圖（橫向畫面時自動啟用，頂列 ⛶／▤ 切換）：整個畫面都是地圖，左側圖示列切換功能，編制與紀錄、單位面板以可收合的浮動面板呈現，後勤、戰報、設定、說明開在地圖上方的面板裡（Esc 回到地圖）。鍵盤：空白鍵開始或暫停、1～0 速度、方向鍵或 WASD 移動、＋／－ 縮放、Z 全圖、L／R 收合面板、N 番號、T 防區、G 後勤、B 作戰、F 全螢幕、? 說明。</li></ul>';
