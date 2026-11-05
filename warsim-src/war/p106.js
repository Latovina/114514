/* ===================== 穩定性：錯誤紀錄、模擬出錯時暫停、閃退後從自動存檔復原、切到背景時暫停並存檔、省記憶體模式 =====================
   瀏覽器分頁閃退多半是記憶體不足（手機上尤其常見）或作業系統在背景把分頁關掉；這裡做幾件事：
   一、記錄執行中的錯誤（最近 15 筆，存在這台裝置），設定頁可以複製錯誤報告；
   二、模擬連續出錯時自動暫停並說明，而不是每一格都重複出錯、畫面卡住；
   三、作戰進行中記下「仍在作戰」的標記，正常關閉頁面時清除；下次開啟時若標記還在，代表上次是閃退，開始頁提示從自動存檔繼續；
   四、切換到其他程式或分頁時暫停作戰並立刻自動存檔（手機常在背景關掉分頁）；
   五、省記憶體模式（手機與記憶體 4 GB 以下的裝置自動開啟）：畫布解析度上限 1.5 倍、兵牌圖快取變小、特效數量減少。 */
var SAFE={E:[],sf:0,toastT:0,bgp:0,mob:false,low:false,liveT:0};
(function(){try{var c=window.matchMedia&&matchMedia('(pointer:coarse)').matches,s=Math.min(screen.width||9999,screen.height||9999);SAFE.mob=!!c&&s<=820;var dm=navigator.deviceMemory;SAFE.low=SAFE.mob||(dm>0&&dm<=4);}catch(e){}})();
function safeLow(){var m=UIP.lowMem||'auto';return m==='on'||(m==='auto'&&SAFE.low);}
function safeApply(){var low=safeLow();VW.dprMax=low?1.5:2;SPC.pxMax=low?3e6:12e6;if(typeof GFX!=='undefined')GFX.memMul=low?0.6:1;}
/* ---------- 錯誤紀錄 ---------- */
function errLoad(){try{var a=JSON.parse(localStorage.getItem('lato-warsim-err')||'[]');return Array.isArray(a)?a:[];}catch(e){return [];}}
function errRec(e,where,src){var msg=String(e&&e.message||e||'未知錯誤').slice(0,300),k=(e&&e.stack?String(e.stack):'').slice(0,900),now=Date.now(),L=errLoad();
  if(L.length&&L[0].m===msg&&now-(L[0].ts||0)<60000){L[0].n=(L[0].n||1)+1;}else L.unshift({ts:now,t:new Date(now).toISOString().replace('T',' ').slice(0,19),m:msg,w:where||'',s:src||'',k:k,tab:UI.tab||'',gt:G&&G.t||0,n:1});
  if(L.length>15)L.length=15;try{localStorage.setItem('lato-warsim-err',JSON.stringify(L));}catch(x){}SAFE.E=L;
  if(now-SAFE.toastT>60000&&typeof toast==='function'){SAFE.toastT=now;toast('發生錯誤，已記錄（設定 → 畫面 → 穩定性與錯誤紀錄可複製錯誤報告）',5000);}}
window.addEventListener('error',function(ev){var e=ev.error;if(e&&e._rec)return;errRec(e||ev.message,'頁面',(ev.filename||'')+':'+(ev.lineno||0)+':'+(ev.colno||0));});
window.addEventListener('unhandledrejection',function(ev){var e=ev.reason;if(e&&e._rec)return;errRec(e,'非同步');});
/* 已記錄的錯誤之後仍丟出去（不在這一格中斷，讓瀏覽器與測試照常看得到） */function errLater(e){try{if(e&&typeof e==='object')e._rec=1;}catch(x){}setTimeout(function(){throw e;},0);}
function errReport(){var L=errLoad(),o=['LatoWarsim 錯誤報告','版本：'+(typeof LWBUILD!=='undefined'?LWBUILD:'?')+'　時間：'+new Date().toISOString().replace('T',' ').slice(0,19),
  '瀏覽器：'+navigator.userAgent,'畫面：'+screen.width+'×'+screen.height+'，像素比 '+(window.devicePixelRatio||1)+'（使用 '+VW.dpr+'）'+(navigator.deviceMemory?'，記憶體約 '+navigator.deviceMemory+' GB':'')+'，'+(SAFE.mob?'觸控裝置':'桌面')+(safeLow()?'，省記憶體模式':''),
  G&&G.map?'作戰：'+(G.map.name||'')+'，'+(G.started?'第 '+durTxt(G.t):'部署中')+'，單位 '+G.units.length+' 個'+(G.over?'（已結束）':''):'作戰：無',''];
  if(!L.length)o.push('沒有錯誤紀錄。');L.forEach(function(q,i){o.push((i+1)+'. ['+q.t+'] '+q.w+'：'+q.m+(q.n>1?'（'+q.n+' 次）':'')+(q.s?'\n   位置 '+q.s:'')+'\n   分頁 '+q.tab+'，作戰時間 '+Math.round(q.gt)+' 秒'+(q.k?'\n   '+q.k.split('\n').slice(0,6).join('\n   '):''));});return o.join('\n');}
/* ---------- 模擬與繪圖出錯：記錄；模擬連續出錯就暫停 ---------- */
(function(){var b=simStep;simStep=function(){try{var r=b.apply(this,arguments);SAFE.sf=0;return r;}catch(e){SAFE.sf++;errRec(e,'模擬');if(SAFE.sf>=2&&UI.run)UI.pauseReq='模擬發生錯誤而暫停（已記錄；可在設定的「穩定性與錯誤紀錄」複製錯誤報告）';if(SAFE.sf<=3)errLater(e);else if(e&&typeof e==='object')e._rec=1;}};})();
(function(){var b=vDraw;vDraw=function(){try{return b.apply(this,arguments);}catch(e){errRec(e,'繪圖');var n=Date.now();if(!SAFE.dT||n-SAFE.dT>30000){SAFE.dT=n;errLater(e);}}};})();
/* ---------- 閃退後復原 ---------- */
function safeLiveSet(){try{if(G&&G.map&&G.started&&!G.over&&!G.replay&&!(typeof mpActive==='function'&&mpActive()))localStorage.setItem('lato-warsim-live',JSON.stringify({ts:Date.now(),n:G.map.name||'',gt:G.t}));else localStorage.removeItem('lato-warsim-live');}catch(e){}}
function safeLiveGet(){try{var o=JSON.parse(localStorage.getItem('lato-warsim-live')||'null');return o&&o.ts&&Date.now()-o.ts<3*86400000?o:null;}catch(e){return null;}}
function safeLiveClr(){try{localStorage.removeItem('lato-warsim-live');}catch(e){}}
setInterval(function(){if(G&&G.started)safeLiveSet();},20000);
/* 正常關閉或離開頁面：清掉標記（作業系統直接關掉分頁時不會觸發，下次開啟就知道是閃退） */window.addEventListener('pagehide',function(ev){if(!ev.persisted)safeLiveClr();});
/* 開始頁：上次是閃退就提示從自動存檔繼續 */
(function(){var b=PAGES.start;PAGES.start=function(host){var r=b.apply(this,arguments);try{var L=typeof EDONLY==='undefined'?safeLiveGet():null;if(L&&!(G&&G.started)){var m=host.querySelector('.lw-main');if(m){var d=document.createElement('div');d.className='lw-card lw-crash';d.style.cssText='border-left:4px solid #C62828';
    d.innerHTML='<h3 style="margin:0 0 4px">上次的作戰意外中斷</h3><div class="lw-note">「'+esc(L.n||'作戰')+'」在 '+esc(new Date(L.ts).toLocaleString())+'（作戰第 '+esc(durTxt(L.gt||0))+'）沒有正常結束，可能是瀏覽器閃退或分頁在背景被關閉。作戰進行中每兩分鐘、以及切換到其他程式時都會自動存到這個瀏覽器。</div><div class="lw-row" data-k="crashb"><span class="lw-note">正在尋找自動存檔……</span></div>';
    m.insertBefore(d,m.firstChild);idbGet('autoMeta').then(function(a){var e=d.querySelector('[data-k="crashb"]');if(!e)return;e.innerHTML=a?'<button type="button" class="lw-btn pri" data-a="crashgo">從自動存檔繼續（'+esc(a.name||'')+(a.started?'，作戰第 '+esc(durTxt(a.t)):'')+'）</button><button type="button" class="lw-btn" data-a="crashx">不用了</button>':'<span class="lw-note">找不到自動存檔。</span><button type="button" class="lw-btn" data-a="crashx">知道了</button>';}).catch(function(){});}}}catch(e){}return r;};})();
ACT.crashgo=function(){safeLiveClr();ACT.autoload();};ACT.crashx=function(){safeLiveClr();var d=root.querySelector('.lw-crash');if(d)d.remove();};
/* ---------- 切到背景：暫停並存檔 ---------- */
document.addEventListener('visibilitychange',function(){if(!G||!G.started||G.replay||G.over)return;var mp=typeof mpActive==='function'&&mpActive();
  if(document.hidden){if(mp)return;if(UI.run&&UIP.bgPause!==0){UI.run=false;SAFE.bgp=1;try{barRender();}catch(e){}}if(!UI.saving&&typeof autoSave==='function'){UI.saving=true;autoSave(false).then(function(){UI.saving=false;safeLiveSet();},function(){UI.saving=false;});}}
  else if(SAFE.bgp){SAFE.bgp=0;toast('切換到其他程式時已自動暫停並存檔，按 ▶ 繼續。',4500);}});
/* ---------- 省記憶體：兵牌圖快取用像素預算；淘汰時立刻釋放畫布 ---------- */
function spcFree(keep){var M=SPC.m;for(var k in M){var c=M[k]&&M[k].cv;if(c&&c!==keep){c.width=0;c.height=0;}}SPC.m={};SPC.n=0;SPC.px=0;}
/* 快取快滿（張數或像素）時先自己清掉並釋放，原本的「滿 900 張就丟掉」不會發生；剛畫好的這一張不釋放 */
(function(){var b=symSprite;symSprite=function(){if(SPC.n>=899)spcFree();var n0=SPC.n,sp=b.apply(this,arguments);if(SPC.n>n0&&sp&&sp.cv){SPC.px=(SPC.px||0)+sp.cv.width*sp.cv.height;if(SPC.px>(SPC.pxMax||12e6))spcFree(sp.cv);}return sp;};})();
(function(){var b=vResize;vResize=function(fit){safeApply();return b.apply(this,arguments);};})();
safeApply();
/* 第一次使用的手機：特效預設為「簡化」 */(function(){try{if(SAFE.mob&&!localStorage.getItem('lato-warsim-fx')&&FX.lvl>1){FX.lvl=1;FX.smk=1;}}catch(e){}})();
/* ---------- 設定 ---------- */
setSec('gfx','safe',{t:'穩定性與錯誤紀錄',o:40,local:true,h:function(){var L=errLoad();return setOpt(setRow('切到背景時',setChk('bgpause','',UIP.bgPause!==0,'切換到其他程式或分頁時暫停作戰（並立刻自動存檔）'))+
  setRow('省記憶體',setSel('lowmem','',[['auto','自動（預設；手機與記憶體較少的裝置開啟）'],['on','開啟'],['off','關閉']],UIP.lowMem||'auto','畫布解析度上限 1.5 倍、兵牌圖快取變小、特效數量減少；手機閃退時建議開啟')))+
  '<div class="lw-note">目前：'+(safeLow()?'省記憶體模式':'一般模式')+'，畫布像素比 '+VW.dpr+(navigator.deviceMemory?'，裝置記憶體約 '+navigator.deviceMemory+' GB':'')+'。作戰進行中每兩分鐘自動存到這個瀏覽器；分頁意外關閉後，開始頁會提示從自動存檔繼續。</div>'+
  '<div class="lw-sub"><b>錯誤紀錄</b>'+(L.length?'<div class="lw-ce lw-errl">'+L.slice(0,5).map(function(q){return '<div>'+esc(q.t.slice(5,16))+'　'+esc(q.w)+'：'+esc(q.m)+(q.n>1?'（'+q.n+' 次）':'')+'</div>';}).join('')+'</div>':'<div class="lw-note">沒有錯誤紀錄。</div>')+
  '<div class="lw-row"><button type="button" class="lw-btn sm" data-a="errcopy">複製錯誤報告</button><button type="button" class="lw-btn sm" data-a="errclr"'+(L.length?'':' disabled')+'>清除紀錄</button></div><div class="lw-note">遇到閃退或錯誤時，把錯誤報告貼給開發者，可以更快找到原因。報告只包含錯誤訊息、瀏覽器與畫面資訊，不含帳號或個人資料。</div></div>';}});
CHG.bgpause=function(t){UIP.bgPause=t.checked?1:0;uipSave();};CHG.lowmem=function(t){UIP.lowMem=t.value;uipSave();safeApply();spcFree();try{vResize(false);}catch(e){}setSecRe('safe');};
ACT.errclr=function(){try{localStorage.removeItem('lato-warsim-err');}catch(e){}SAFE.E=[];setSecRe('safe');};
ACT.errcopy=function(){var s=errReport(),done=function(){toast('錯誤報告已複製。',3000);},fb=function(){var d=dlg('<h3>錯誤報告</h3><div class="lw-note">全選後複製：</div><textarea style="width:100%;height:50vh;font:12px monospace" readonly>'+esc(s)+'</textarea><div class="lw-row"><button type="button" class="lw-btn" data-a="x">關閉</button></div>');var ta=d.querySelector('textarea');ta.focus();ta.select();};
  try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(s).then(done,fb);else fb();}catch(e){fb();}};
if(typeof HELP14!=='undefined')HELP14.push('<h4>穩定性：閃退與錯誤</h4><ul>'+
  '<li>作戰進行中每兩分鐘（實際時間）自動存到這個瀏覽器，切換到其他程式或分頁時也會立刻存一次並暫停作戰（可在設定的「畫面 → 穩定性與錯誤紀錄」關閉暫停）。如果分頁意外關閉，下次開啟時開始頁會提示「從自動存檔繼續」。</li>'+
  '<li>手機與記憶體較少的裝置會自動使用省記憶體模式：畫布解析度上限 1.5 倍、兵牌圖快取變小、特效數量減少。閃退時也可以手動開啟，或把畫面效果調成「簡化」或改用簡易圖形模式。</li>'+
  '<li>模擬連續出錯時會自動暫停並說明，不會一直重複出錯；所有錯誤都記在這台裝置，可在同一個設定區複製錯誤報告給開發者。</li></ul>');
