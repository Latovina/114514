/* ===================== 聯機版：背景音樂（伺服器曲庫＋房間曲目）、回放清理、連線延遲 =====================
   曲目分為：平靜、激戰、藍軍勝利、紅軍勝利、藍軍戰敗、紅軍戰敗。管理員上傳到伺服器曲庫；房主可以為自己的房間上傳曲目，
   作戰結束十分鐘後（或房間關閉時）自動刪除。房間曲目優先於伺服器曲庫；兩者都沒有某一類時，沿用自己瀏覽器裡的勝利與戰敗曲目。
   播放依本方的戰況：平時播「平靜」，本方部隊大量交戰時換成「激戰」，結束時依勝負與陣營播放對應的勝利或戰敗曲目。 */
var BG={on:true,cats:{calm:'平靜',fight:'激戰',win0:'藍軍勝利',win1:'紅軍勝利',lose0:'藍軍戰敗',lose1:'紅軍戰敗'},lib:[],room:[],max:20,au:null,cur:null,st:'',tT:0,hot:0,end:false,last:{}};
(function(){try{var o=JSON.parse(localStorage.getItem('lato-mp-bgm')||'null');if(o&&o.on!==undefined)BG.on=!!o.on;}catch(e){}})();
function bgSave(){try{localStorage.setItem('lato-mp-bgm',JSON.stringify({on:BG.on}));}catch(e){}}
function bgLoad(){if(!MPS.tok)return;mpApi('/api/bgm'+(MPS.inRoom?'?room='+encodeURIComponent(MPS.inRoom):'')).then(function(r){BG.lib=r.lib||[];BG.room=r.room||[];if(r.cats)BG.cats=r.cats;BG.max=r.max||20;bgRefresh();}).catch(function(){});}
function bgUrl(t,room){return (room?'/bgm/r/'+encodeURIComponent(MPS.inRoom)+'/':'/bgm/')+t.id+'?token='+encodeURIComponent(MPS.tok);}
/* 某一類的候選曲目：房間曲目優先 */
function bgCand(cat){var R=BG.room.filter(function(t){return t.cat===cat;});if(R.length)return R.map(function(t){return {t:t,room:1};});return BG.lib.filter(function(t){return t.cat===cat;}).map(function(t){return {t:t,room:0};});}
function bgHas(cat){return bgCand(cat).length>0;}
function bgPlay(cat,loop){var C=bgCand(cat);if(!C.length)return false;var D=C.length>1?C.filter(function(q){return q.t.id!==BG.last[cat];}):C,q=D[Math.floor(Math.random()*D.length)];BG.last[cat]=q.t.id;
  try{if(typeof muStop==='function'&&typeof MU!=='undefined'&&MU.cur)muStop();if(!BG.au){BG.au=new Audio();BG.au.addEventListener('ended',function(){var c=BG.cur;BG.cur=null;if(c&&c.loop&&BG.on)bgPlay(c.cat,true);bgRefresh();});}var a=BG.au,vol=typeof MU!=='undefined'?MU.vol:0.6;
    a.pause();a.src=bgUrl(q.t,q.room);a.currentTime=0;a.volume=0;var p=a.play();if(p&&p.catch)p.catch(function(){});var t0=Date.now();clearInterval(BG.fade);BG.fade=setInterval(function(){var f=Math.min(1,(Date.now()-t0)/2000);a.volume=vol*f;if(f>=1)clearInterval(BG.fade);},80);
    BG.cur={cat:cat,name:q.t.name,id:q.t.id,loop:!!loop,room:q.room};bgRefresh();if(!loop)toast('♪ '+(BG.cats[cat]||cat)+'：'+q.t.name,3000);return true;}catch(e){return false;}}
function bgStop(){if(BG.au){try{BG.au.pause();}catch(e){}}clearInterval(BG.fade);BG.cur=null;bgRefresh();}
/* 伺服器音樂是否接手（有對應曲目時，自己瀏覽器的勝利／戰敗曲目暫停使用） */
function bgOwns(){return BG.on&&mpActive()&&(BG.lib.length+BG.room.length)>0;}
function bgSide(){var v=MPS.view;return v===0||v===1?v:0;}
function bgTick(){if(!BG.on||!mpActive()||!G||!G.started){if(BG.cur&&BG.cur.loop)bgStop();BG.st='';BG.end=false;return;}var s=bgSide();
  if(G.over){if(!BG.end){BG.end=true;var w=G.over.win,cat=w<0?'calm':MPS.view===-1?'win'+w:(w===s?'win'+s:'lose'+s);if(bgHas(cat))bgPlay(cat,false);else if(BG.cur&&BG.cur.loop)bgStop();}return;}BG.end=false;
  /* 交戰強度：最近三分鐘（遊戲時間）內受到攻擊的本方單位 */
  var L=G.units.filter(function(u){return u.side===s&&isLeaf(u)&&onMap(u);}),hot=L.filter(function(u){return u.uf!==undefined&&G.t-u.uf<180;}).length,thr=Math.max(2,Math.round(L.length*0.06)),now=Date.now();
  if(hot>=thr)BG.hot=now;var want=BG.hot&&now-BG.hot<45000?'fight':'calm';if(!bgHas(want))want=bgHas('calm')?'calm':bgHas('fight')?'fight':'';
  if(!want){if(BG.cur&&BG.cur.loop)bgStop();BG.st='';return;}if(want!==BG.st||!BG.cur){BG.st=want;if(!BG.cur||BG.cur.cat!==want)bgPlay(want,true);}}
(function(){var b=hudTick;hudTick=function(force){b(force);var n=Date.now();if(n-BG.tT>2500){BG.tT=n;try{bgTick();}catch(e){}}};})();
/* 自己瀏覽器的勝利／戰敗曲目：伺服器音樂接手時不播放 */
(function(){if(typeof muTick!=='function')return;var b=muTick;muTick=function(){if(bgOwns()){var s=bgSide(),need=G&&G.over?['win'+s,'lose'+s,'win0','win1']:['calm','fight'];if(need.some(bgHas))return;}return b();};})();
/* ---------- 伺服器訊息與連線延遲 ---------- */
(function(){var b=mpOn;mpOn=function(o){if(o.t==='bgm'){bgLoad();return;}if(o.t==='pong'){if(o.c){MPS.rtt=Date.now()-o.c;mpBarSync();}return;}b(o);if(o.t==='hello'||o.t==='joined'||o.t==='kicked')bgLoad();if(o.t==='room'&&o.room&&o.room.phase==='setup'&&BG.end)BG.end=false;};})();
setInterval(function(){if(MPS.ws&&MPS.ws.readyState===1)try{MPS.ws.send(JSON.stringify({t:'ping',c:Date.now()}));}catch(e){}},5000);
(function(){var b=mpBarSync;mpBarSync=function(){b();var el=UI.bar&&UI.bar.querySelector('[data-k="mpbar"]');if(!el||!MPS.wsOK||!(MPS.rtt>=0))return;var r=MPS.rtt,c=r<120?'#2e7d32':r<300?'#f9a825':'#c62828';var s=document.createElement('span');s.className='lw-note';s.title='與伺服器之間的往返延遲';s.style.color=c;s.textContent=' '+r+' ms';el.firstChild&&el.firstChild.appendChild(s);};})();
/* ---------- 上傳與刪除 ---------- */
function bgUp(file,cat,room){if(!file)return;if(file.size>BG.max*1048576){toast('檔案太大（上限 '+BG.max+' MB）。');return;}toast('上傳中：'+file.name+'…',2500);
  fetch('/api/bgm/up?cat='+encodeURIComponent(cat)+'&name='+encodeURIComponent(file.name)+(room?'&room='+encodeURIComponent(MPS.inRoom):''),{method:'POST',headers:Object.assign({'Content-Type':file.type||'application/octet-stream'},MPS.tok?{Authorization:'Bearer '+MPS.tok}:{}),body:file})
    .then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.err||('HTTP '+r.status));return j;});}).then(function(){toast('已上傳「'+file.name+'」（'+(BG.cats[cat]||cat)+'）。');bgLoad();if(UI.admd&&UI.admd.isConnected&&!room)ACT.mpadmin();}).catch(function(e){toast('上傳失敗：'+e.message,5000);});}
CHG.bgup=function(t){var cat=t.getAttribute('data-f'),room=t.getAttribute('data-r')==='1';[].slice.call(t.files||[]).forEach(function(f){bgUp(f,cat,room);});t.value='';};
ACT.bgdel=function(b){var v=b.getAttribute('data-v').split('|');if(!confirm('刪除這首曲目？'))return;mpApi('/api/bgm/del',{id:v[0],room:v[1]==='1'?MPS.inRoom:undefined}).then(function(){bgLoad();if(UI.admd&&UI.admd.isConnected&&v[1]!=='1')ACT.mpadmin();}).catch(function(e){toast(e.message,4500);});};
ACT.bgtry=function(b){var v=b.getAttribute('data-v').split('|'),L=v[1]==='1'?BG.room:BG.lib,t=L.filter(function(x){return x.id===v[0];})[0];if(!t)return;var keepR=BG.room,keepL=BG.lib;BG.room=v[1]==='1'?[t]:[];BG.lib=v[1]==='1'?[]:[t];bgPlay(t.cat,false);BG.room=keepR;BG.lib=keepL;};
ACT.bgstop=function(){bgStop();};
function bgListHtml(L,room,canEdit){return Object.keys(BG.cats).map(function(cat){var T=L.filter(function(t){return t.cat===cat;});return '<div style="margin:4px 0"><b>'+mpEsc(BG.cats[cat])+'</b>（'+T.length+'）'+(T.length?'<ol style="margin:2px 0 2px 18px;padding:0">'+T.map(function(t){var on=BG.cur&&BG.cur.id===t.id;return '<li>'+(on?'<b>♪ ':'')+mpEsc(t.name)+(on?'</b>':'')+' <span class="lw-note">'+fx(t.size/1048576,1)+' MB</span> <button type="button" class="lw-btn sm" data-a="bgtry" data-v="'+t.id+'|'+(room?1:0)+'" title="試聽">▶</button>'+(canEdit?' <button type="button" class="lw-btn sm dng" data-a="bgdel" data-v="'+t.id+'|'+(room?1:0)+'" title="刪除">✕</button>':'')+'</li>';}).join('')+'</ol>':'')+
    (canEdit?' <label class="lw-btn sm">＋ 上傳<input type="file" accept="audio/*" multiple data-c="bgup" data-f="'+cat+'" data-r="'+(room?1:0)+'" hidden></label>':'')+'</div>';}).join('');}
/* 房間頁：房主上傳本房間的曲目 */
function bgRoomCard(){var R=MPS.room;if(!R)return '';var host=MPS.me&&MPS.me.host;return '<div class="lw-card lw-bgroom"><h3>房間背景音樂<small>'+(R.phase==='over'?'作戰已結束，十分鐘後自動刪除':'作戰結束後自動刪除')+'</small></h3><div class="lw-note">房主可以為這一場上傳平靜、激戰時，以及藍軍、紅軍各自勝利與戰敗時播放的曲目（每首最多 '+BG.max+' MB）。房間曲目優先於伺服器曲庫。</div>'+bgListHtml(BG.room,true,host&&R.phase!=='over')+'</div>';}
function bgRefresh(){var el=document.querySelector('.lw-bgroom');if(el){var d=document.createElement('div');d.innerHTML=bgRoomCard();if(d.firstChild)el.replaceWith(d.firstChild);}var C=document.querySelectorAll('.lw-bgset');for(var i=0;i<C.length;i++)C[i].innerHTML=bgSetHtml();}
(function(){var b=mpPgRoom;mpPgRoom=function(){var r=b.apply(this,arguments);try{r+=bgRoomCard();}catch(e){}return r;};})();
/* 設定：開關伺服器音樂 */
function bgSetHtml(){return '<div class="lw-opt"><span>伺服器音樂</span><label><input type="checkbox" data-c="bgon"'+(BG.on?' checked':'')+'>聯機時播放伺服器曲庫與房間的背景音樂（平靜、激戰、勝利、戰敗）</label></div>'+(BG.cur?'<div class="lw-row"><span class="lw-note">正在播放：'+mpEsc(BG.cur.name)+'（'+mpEsc(BG.cats[BG.cur.cat]||'')+'）</span> <button type="button" class="lw-btn sm" data-a="bgstop">■ 停止</button></div>':'');}
CHG.bgon=function(t){BG.on=t.checked;bgSave();if(!BG.on)bgStop();};
(function(){if(typeof muCardHtml!=='function')return;var b=muCardHtml;muCardHtml=function(){return b()+'<div class="lw-bgset">'+bgSetHtml()+'</div>';};})();
/* 管理員面板：伺服器曲庫與回放清理 */
(function(){var b=mpAdminDlg;mpAdminDlg=function(){b();var A=MPS.adm,d=UI.admd&&UI.admd.firstChild;if(!d)return;BG.lib=A.bgm||BG.lib;var rows=d.querySelectorAll('.lw-row'),last=rows[rows.length-1],box=document.createElement('div');
  var R=A.replayList||[];box.innerHTML='<div class="lw-card"><h3>伺服器曲庫<small>'+BG.lib.length+' 首</small></h3><div class="lw-note">所有房間共用；房主上傳的房間曲目優先。每首最多 '+(A.cfg.bgmMaxMB||20)+' MB。</div>'+bgListHtml(BG.lib,false,true)+'</div>'+
    '<div class="lw-card"><h3>回放<small>'+R.length+' 份、共 '+fx(R.reduce(function(s,r){return s+(r.size||0);},0)/1048576,1)+' MB</small></h3><div class="lw-row"><label>刪除 <input type="number" min="1" value="30" data-k="rpdays" style="width:5em"> 天以前的回放</label><button type="button" class="lw-btn sm dng" data-a="admrpurge" data-v="days">清理</button><label>只保留最近 <input type="number" min="0" value="50" data-k="rpkeep" style="width:5em"> 份</label><button type="button" class="lw-btn sm dng" data-a="admrpurge" data-v="keep">清理</button></div>'+
    (R.length?'<div style="max-height:30vh;overflow:auto"><table class="lw-tbl"><tr><th><input type="checkbox" data-c="admrall"></th><th>回放</th><th>日期</th><th class="n">大小</th></tr>'+R.map(function(r){return '<tr><td><input type="checkbox" data-k="rpsel" value="'+r.id+'"></td><td>'+mpEsc(r.name)+'</td><td>'+new Date(r.date).toLocaleString()+'</td><td class="n">'+fx((r.size||0)/1048576,2)+' MB</td></tr>';}).join('')+'</table></div><div class="lw-row"><button type="button" class="lw-btn sm dng" data-a="admrdel">刪除選取的回放</button></div>':'<div class="lw-note">沒有回放。</div>')+'</div>';
  while(box.firstChild)d.insertBefore(box.firstChild,last);};})();
CHG.admrall=function(t){[].slice.call(UI.admd.querySelectorAll('[data-k="rpsel"]')).forEach(function(c){c.checked=t.checked;});};
ACT.admrdel=function(){var ids=[].slice.call(UI.admd.querySelectorAll('[data-k="rpsel"]:checked')).map(function(c){return +c.value;});if(!ids.length){toast('請先勾選要刪除的回放。');return;}if(!confirm('刪除 '+ids.length+' 份回放？'))return;mpApi('/api/admin',{op:'delreplays',ids:ids}).then(function(r){toast('已刪除 '+(r.n||0)+' 份回放。');ACT.mpadmin();}).catch(function(e){toast(e.message);});};
ACT.admrpurge=function(b){var k=b.getAttribute('data-v'),q=function(x){return UI.admd.querySelector('[data-k="'+x+'"]');},body={op:'purgereplays'};if(k==='days')body.days=Math.max(1,+q('rpdays').value||30);else body.keep=Math.max(0,+q('rpkeep').value||0);
  if(!confirm(k==='days'?'刪除 '+body.days+' 天以前的所有回放？':'只保留最近 '+body.keep+' 份回放，其餘刪除？'))return;mpApi('/api/admin',body).then(function(r){toast('已清理 '+(r.n||0)+' 份回放。');ACT.mpadmin();}).catch(function(e){toast(e.message);});};
HELP14.push('<h4>聯機背景音樂、回放清理與延遲</h4><ul><li>管理員可以在「管理員面板」上傳伺服器曲庫：平靜、激戰、藍軍勝利、紅軍勝利、藍軍戰敗、紅軍戰敗六類。房主可以在房間頁為這一場上傳曲目，作戰結束十分鐘後（或房間關閉時）自動刪除；房間曲目優先於伺服器曲庫。</li><li>作戰中平時播放「平靜」，本方部隊大量交戰時換成「激戰」；結束時依勝負與本方陣營播放勝利或戰敗曲目（觀戰時播放勝方的勝利曲目）。可以在「設定」的音樂卡片關閉；某一類沒有伺服器曲目時沿用自己瀏覽器裡的勝利、戰敗曲目。</li><li>管理員面板可以勾選刪除回放，或一次清理幾天以前的回放、只保留最近幾份。</li><li>工具列的連線名稱旁顯示與伺服器的往返延遲（綠色 120 毫秒以下、黃色 300 毫秒以下）。下令後伺服器會立即送回結果，不必等下一次定時更新。</li></ul>');
