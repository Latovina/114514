/* ===================== 存檔與讀檔的介面：下載存檔、存到瀏覽器（IndexedDB）、執行中的自動存檔（打包與讀取的核心見「存檔核心」） ===================== */
function resetCaches(){simCaches();VW.img=null;}
async function loadGame(o){await gameLoad(o,resetCaches,wirePause);
  UI.sel=[];UI.run=false;VW.fit=false;UI.side=G.sides[0].ai&&!G.sides[1].ai?1:0;barRender();tabsRender();show(G.started?'battle':'orbat');toast('已讀取：'+(G.map.name||'作戰')+(G.started?'（'+clockTxt(now())+'）':''));}
function saveDlg(){if(G&&G.replay){toast('回放模式不能存檔；請切換到其他分頁回到原本的作戰。');return;}var d=dlg('<h3>存檔</h3><div class="lw-row"><button type="button" class="lw-btn pri" data-a="savefile">下載存檔檔案</button><button type="button" class="lw-btn" data-a="saveauto">存到瀏覽器</button><button type="button" class="lw-btn" data-a="savemap">只匯出地圖</button>'+(G&&G.started?'<button type="button" class="lw-btn" data-a="repexp">匯出回放</button>':'')+'<button type="button" class="lw-btn" data-a="x">關閉</button></div><div class="lw-note">存檔包含地圖、雙方編制、自訂單位類型與圖片、戰況、紀錄與戰報。「存到瀏覽器」會覆蓋上一次的瀏覽器存檔，可在「開始」頁繼續。</div>');UI.sdlg=d;}
ACT.savefile=async function(){try{var fn=(G.map.name||'作戰')+'_'+(G.started?durTxt(G.t).replace(/\s/g,''):'部署')+'.latowarsim.json';download(fn,await gameParts(await saveSnap()),'application/json');}catch(e){toast('存檔失敗：'+e.message);}UI.sdlg&&UI.sdlg.remove();};
ACT.saveauto=async function(){await autoSave(true);UI.sdlg&&UI.sdlg.remove();};
ACT.savemap=async function(){var m=await packMap(G.map);download((G.map.name||'作戰地圖')+'.latowarmap.json',JSON.stringify(m),'application/json');UI.sdlg&&UI.sdlg.remove();};
/* IndexedDB */
function idb(){return new Promise(function(res,rej){if(typeof indexedDB==='undefined'){rej(new Error('此瀏覽器不支援 IndexedDB'));return;}var r=indexedDB.open('lato-warsim',1);r.onupgradeneeded=function(){r.result.createObjectStore('saves');};r.onsuccess=function(){res(r.result);};r.onerror=function(){rej(r.error);};});}
async function idbPut(k,v){var db=await idb();return new Promise(function(res,rej){var tx=db.transaction('saves','readwrite');tx.objectStore('saves').put(v,k);tx.oncomplete=function(){res();};tx.onerror=function(){rej(tx.error);};});}
async function idbGet(k){var db=await idb();return new Promise(function(res,rej){var tx=db.transaction('saves','readonly'),q=tx.objectStore('saves').get(k);q.onsuccess=function(){res(q.result);};q.onerror=function(){rej(q.error);};});}
/* 拍快照的期間主迴圈不推進模擬（畫面照常），快照分段進行；之後的壓縮與寫入不影響作戰 */
async function saveSnap(){UI.snapping=true;try{return await gameSnap(true);}finally{UI.snapping=false;}}
/* 瀏覽器存檔以 Blob 寫入（不在主執行緒複製整份文字）；舊版或不支援 Blob 的瀏覽器存成文字 */
async function autoSave(loud){if(!G||!G.map||G.replay)return;try{var S=await saveSnap(),P=await gameParts(S);try{await idbPut('auto',new Blob(P,{type:'application/json'}));}catch(e){await idbPut('auto',P.join(''));}
  await idbPut('autoMeta',{name:S.name,t:S.t,started:S.started,saved:S.saved});if(loud)toast('已存到瀏覽器。');}catch(e){if(loud)toast('無法存到瀏覽器：'+e.message);}}
async function autoLoadList(){var el=UI.body&&UI.body.querySelector('[data-k="auto"]');if(!el)return;try{var m=await idbGet('autoMeta');if(!m){el.innerHTML='<div class="lw-note">瀏覽器中沒有存檔。</div>';return;}el.innerHTML='<div class="lw-row"><span>瀏覽器存檔：<b>'+esc(m.name||'')+'</b>'+(m.started?'（作戰第 '+durTxt(m.t)+'）':'（部署階段）')+'，'+esc((m.saved||'').replace('T',' ').slice(0,16))+'</span><button type="button" class="lw-btn sm" data-a="autoload">繼續</button></div>';}catch(e){el.innerHTML='';}}
ACT.autoload=async function(){try{var s=await idbGet('auto');if(!s)throw new Error('找不到存檔');if(typeof s!=='string')s=await s.text();await loadGame(JSON.parse(s));}catch(e){toast('讀取失敗：'+e.message);}};
/* 執行中每兩分鐘（實際時間）自動存到瀏覽器 */
setInterval(function(){if(G&&G.started&&UI.run&&!UI.saving){UI.saving=true;autoSave(false).then(function(){UI.saving=false;});}},120000);
