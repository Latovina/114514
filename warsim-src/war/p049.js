/* ===================== 聯機版網址：單機版「開始」頁提供前往聯機伺服器的連結；聯機版提示「聯機」分頁 ===================== */
var LATO_ONLINE_URL='https://warsim.encyclato.org/';
(function(){var b=PAGES.start;PAGES.start=function(host){b(host);var m=host.querySelector('.lw-main');if(!m)return;var d=document.createElement('div');d.className='lw-card';
  if(typeof MPON!=='undefined')d.innerHTML='<h3>🌐 聯機版</h3><div class="lw-note">這裡是單機（沙盒）作戰：可以先建立想定、編成兵力與部署，再到上方「🌐 聯機」分頁開房間時上傳使用。</div>';
  else d.innerHTML='<h3>🌐 聯機對戰<small>'+esc(LATO_ONLINE_URL.replace(/^https?:\/\//,'').replace(/\/$/,''))+'</small></h3><div class="lw-note">和其他玩家在線上對戰：雙方完全雙盲、可以 2 對 2 組隊或一起對抗電腦，作戰結束後自動保存回放。單機版的存檔（.latowarsim.json）與編制檔（.latoorbat.json）都可以直接上傳使用。</div><div class="lw-row"><a class="lw-btn pri" href="'+esc(LATO_ONLINE_URL)+'" target="_blank" rel="noopener">前往聯機版</a></div>';
  m.insertBefore(d,m.firstChild);
  var e=document.createElement('div');e.className='lw-card';var ed=typeof MPON!=='undefined'?'/editor':/^http/.test(location.protocol)?LATO_ONLINE_URL+'editor':'lato-warsim-editor.html';
  e.innerHTML='<h3>🛠 編制與裝備編輯器</h3><div class="lw-note">獨立的編輯頁面：設計單位類型、編制、武器、彈藥、裝甲、支援裝備與載具並計算造價，匯出成編制檔與武器裝備檔再回到這裡匯入。'+(typeof MPON==='undefined'?'單機使用時，把 lato-warsim-editor.html 放在同一個資料夾；也可以使用線上版。':'')+'</div><div class="lw-row"><a class="lw-btn" href="'+esc(ed)+'" target="_blank" rel="noopener">開啟編輯器</a>'+(typeof MPON==='undefined'?'<a class="lw-btn" href="'+esc(LATO_ONLINE_URL+'editor')+'" target="_blank" rel="noopener">線上版編輯器</a>':'')+'</div>';m.insertBefore(e,d.nextSibling);};})();
