/* ===================== 勝利與戰敗音樂：兩組自選曲目（各最多五首，存在這個瀏覽器的 IndexedDB），戰況明顯傾向本方或敵方時、戰鬥結束時隨機播放一首；
   單人（對 AI）、沙盒（看 AI 對戰，可選以哪一方的角度）與多人連線都適用；進行中可以隨時加入、刪除曲目或調整音量 ===================== */
var MU={on:true,vol:0.6,persp:'me',L:{win:[],lose:[]},db:null,au:null,st:'even',cur:null,last:{win:'',lose:''},tT:0,ready:false,end:false};
var MUN={win:'勝利',lose:'戰敗'};
(function(){try{var o=JSON.parse(localStorage.getItem('lato-warsim-music')||'null');if(o){if(o.on!==undefined)MU.on=!!o.on;if(o.vol!==undefined)MU.vol=clamp(+o.vol||0,0,1);if(o.persp)MU.persp=o.persp;}}catch(e){}})();
function muSave(){try{localStorage.setItem('lato-warsim-music',JSON.stringify({on:MU.on,vol:MU.vol,persp:MU.persp}));}catch(e){}}
/* ---------- 曲目存放：IndexedDB（無法使用時只保留到關閉頁面） ---------- */
function muDB(cb){if(MU.db){cb(MU.db);return;}try{var rq=indexedDB.open('lato-warsim-music',1);rq.onupgradeneeded=function(){var d=rq.result;if(!d.objectStoreNames.contains('tracks'))d.createObjectStore('tracks',{keyPath:'id'});};
  rq.onsuccess=function(){MU.db=rq.result;cb(MU.db);};rq.onerror=function(){cb(null);};}catch(e){cb(null);}}
function muLoad(done){muDB(function(d){if(!d){MU.ready=true;if(done)done();return;}try{var tx=d.transaction('tracks','readonly'),rq=tx.objectStore('tracks').getAll();rq.onsuccess=function(){var A=rq.result||[];MU.L={win:[],lose:[]};A.sort(function(a,b){return a.t-b.t;}).forEach(function(r){if(MU.L[r.list]&&MU.L[r.list].length<5)MU.L[r.list].push({id:r.id,name:r.name,url:URL.createObjectURL(r.blob)});});MU.ready=true;muRefresh();if(done)done();};
  rq.onerror=function(){MU.ready=true;if(done)done();};}catch(e){MU.ready=true;if(done)done();}});}
function muAdd(list,files,done){var L=MU.L[list];if(!L)return;var F=[].slice.call(files||[]).filter(function(f){return f&&(/^audio\//.test(f.type)||/\.(mp3|ogg|oga|wav|m4a|aac|flac|webm|opus)$/i.test(f.name||''));}),room=5-L.length,skip=Math.max(0,F.length-room),n=0;F=F.slice(0,Math.max(0,room));
  if(!F.length){if(skip)toast('每一組最多五首。');if(done)done(0);return;}
  muDB(function(d){F.forEach(function(f,i){var r={id:'m'+Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36)+i,list:list,name:String(f.name||'曲目').slice(0,80),t:Date.now()+i,blob:f};L.push({id:r.id,name:r.name,url:URL.createObjectURL(f)});n++;
    if(d){try{d.transaction('tracks','readwrite').objectStore('tracks').put(r);}catch(e){}}});muRefresh();if(skip)toast('每一組最多五首，多出的 '+skip+' 首沒有加入。');if(done)done(n);});}
function muDel(list,id){var L=MU.L[list],i=L.findIndex(function(q){return q.id===id;});if(i<0)return;var q=L[i];if(MU.cur&&MU.cur.id===id)muStop();try{URL.revokeObjectURL(q.url);}catch(e){}L.splice(i,1);muDB(function(d){if(d){try{d.transaction('tracks','readwrite').objectStore('tracks').delete(id);}catch(e){}}});muRefresh();}
/* ---------- 播放：隨機挑一首（避免連續同一首），淡入 ---------- */
function muPlay(list,why){var L=MU.L[list];if(!MU.on||!L||!L.length)return false;var C=L.length>1?L.filter(function(q){return q.id!==MU.last[list];}):L,q=C[Math.floor(Math.random()*C.length)];MU.last[list]=q.id;
  try{if(!MU.au){MU.au=new Audio();MU.au.addEventListener('ended',function(){MU.cur=null;muRefresh();});}var a=MU.au;a.pause();a.src=q.url;a.currentTime=0;a.volume=0;var p=a.play();if(p&&p.catch)p.catch(function(){});var t0=Date.now();clearInterval(MU.fade);MU.fade=setInterval(function(){var f=Math.min(1,(Date.now()-t0)/1800);a.volume=MU.vol*f;if(f>=1)clearInterval(MU.fade);},80);
    MU.cur={id:q.id,name:q.name,list:list,why:why||''};muRefresh();if(typeof toast==='function')toast('♪ '+MUN[list]+'音樂：'+q.name+(why?'（'+why+'）':''),3000);return true;}catch(e){return false;}}
function muStop(){if(MU.au){try{MU.au.pause();}catch(e){}}clearInterval(MU.fade);MU.cur=null;muRefresh();}
function muSetVol(v){MU.vol=clamp(v,0,1);if(MU.au&&MU.cur)MU.au.volume=MU.vol;muSave();}
/* ---------- 戰況傾斜：以某一方的角度比較雙方剩餘兵力與目標控制 ---------- */
function muSide(){if(MU.persp==='0'||MU.persp==='1')return +MU.persp;var me=UI.side;return me>=0?me:0;}
function muTilt(s){var a=sideStr(s).f,b=sideStr(enemyOf(s)).f,O=G.obj||[],tot=0,mine=0;O.forEach(function(o){var p=o.pts||10;tot+=p;if(o.own===s)mine+=p;else if(o.own<0)mine+=p/2;});return (a-b)+(tot?(mine/tot-0.5)*0.6:0);}
function muTick(){if(!MU.on||!G||!G.started||G.replay)return;var s=muSide();
  if(G.over){if(!MU.end){MU.end=true;var w=G.over.win;if(w>=0)muPlay(w===s?'win':'lose',w===s?'戰鬥勝利':'戰鬥失利');}return;}MU.end=false;
  var t=muTilt(s),st=MU.st;if(st!=='win'&&t>=0.18)st='win';else if(st!=='lose'&&t<=-0.18)st='lose';else if(st==='win'&&t<0.12||st==='lose'&&t>-0.12)st='even';
  if(st!==MU.st){var old=MU.st;MU.st=st;if(st==='win'&&old!=='win')muPlay('win',G.sides[s].name+'取得優勢');else if(st==='lose'&&old!=='lose')muPlay('lose',G.sides[s].name+'陷入劣勢');}}
(function(){var b=hudTick;hudTick=function(force){b(force);var n=Date.now();if(n-MU.tT>2500){MU.tT=n;try{muTick();}catch(e){}}};})();
/* 新的一場：狀態歸零 */
(function(){var b=prepareBattle;prepareBattle=function(){var r=b.apply(this,arguments);MU.st='even';MU.end=false;return r;};})();
/* ---------- 介面：設定頁的曲目管理、音效面板的快速控制 ---------- */
function muListHtml(list){var L=MU.L[list];return '<div class="lw-mul" data-k="mul-'+list+'"><b>'+MUN[list]+'</b>（'+L.length+'／5）'+(L.length?'<ol style="margin:4px 0 4px 18px;padding:0">'+L.map(function(q){var on=MU.cur&&MU.cur.id===q.id;return '<li>'+(on?'<b>♪ ':'')+esc(q.name)+(on?'</b>':'')+' <button type="button" class="lw-btn sm" data-a="mutry" data-v="'+list+'|'+q.id+'" title="試聽">▶</button> <button type="button" class="lw-btn sm dng" data-a="mudel" data-v="'+list+'|'+q.id+'" title="移除">✕</button></li>';}).join('')+'</ol>':'<div class="lw-note">尚未加入曲目</div>')+
  (L.length<5?'<label class="lw-btn sm">＋ 加入曲目<input type="file" accept="audio/*" multiple data-c="muadd" data-f="'+list+'" hidden></label>':'')+'</div>';}
function muCardHtml(){return '<div class="lw-opt"><span>播放</span><label><input type="checkbox" data-c="muon"'+(MU.on?' checked':'')+'>戰況明顯傾向一方（剩餘兵力與目標控制）或戰鬥結束時，從對應的一組隨機播放一首</label>'+
  '<span>音量</span><input type="range" min="0" max="1" step="0.05" value="'+MU.vol+'" data-c="muvol" style="width:160px"><span>角度</span><select data-c="mupersp"><option value="me"'+(MU.persp==='me'?' selected':'')+'>本方（看 AI 對戰時為藍軍）</option><option value="0"'+(MU.persp==='0'?' selected':'')+'>固定藍軍</option><option value="1"'+(MU.persp==='1'?' selected':'')+'>固定紅軍</option></select></div>'+
  muListHtml('win')+muListHtml('lose')+'<div class="lw-row">'+(MU.cur?'<span class="lw-note">正在播放：'+esc(MU.cur.name)+'</span> <button type="button" class="lw-btn sm" data-a="mustop">■ 停止</button>':'<span class="lw-note">曲目只存在這個瀏覽器裡，不會上傳；連線對戰時每位玩家各自播放自己的曲目。</span>')+'</div>';}
function muRefresh(){setSecRe('music');}
setSec('snd','music',{t:'勝利與戰敗音樂',o:30,cls:'lw-mucard',h:function(){return muCardHtml();}});
CHG.muon=function(t){MU.on=t.checked;if(!MU.on)muStop();muSave();};
CHG.muvol=function(t){muSetVol(+t.value);};
CHG.mupersp=function(t){MU.persp=t.value;MU.st='even';muSave();};
CHG.muadd=function(t){var list=t.getAttribute('data-f'),F=t.files;muAdd(list,F,function(n){if(n)toast('加入 '+n+' 首'+MUN[list]+'音樂。');});t.value='';};
ACT.mudel=function(b){var v=b.getAttribute('data-v').split('|');muDel(v[0],v[1]);};
ACT.mutry=function(b){var v=b.getAttribute('data-v').split('|'),L=MU.L[v[0]],q=L.filter(function(x){return x.id===v[1];})[0];if(!q)return;var keep=MU.last[v[0]];MU.last[v[0]]='';var on=MU.on;MU.on=true;
  var A=L;MU.L[v[0]]=[q];muPlay(v[0],'試聽');MU.L[v[0]]=A;MU.on=on;MU.last[v[0]]=keep;};
ACT.mustop=function(){muStop();};
try{muLoad();}catch(e){}
HELP14.push('<h4>勝利與戰敗音樂</h4><ul>'+
  '<li>在「設定」（或工具列的音效面板）加入自己的曲目：勝利、戰敗各一組，每組最多五首（mp3、ogg、wav、m4a 等）。曲目只存在這個瀏覽器的資料庫裡，不會上傳；下次開啟仍在，進行中可以隨時加入、刪除、試聽或調整音量。</li>'+
  '<li>戰況明顯傾向本方（雙方剩餘兵力的差距加上目標控制）時，從勝利組隨機播放一首；明顯傾向敵方時播放戰敗組；戰鬥結束時依勝負再播一首。狀態要先回到均勢才會再次觸發，不會反覆播放。看 AI 對戰（沙盒）時可以選擇以藍軍或紅軍的角度；連線對戰時每位玩家依自己的陣營各自播放。</li></ul>');
