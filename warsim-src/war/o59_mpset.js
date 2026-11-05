/* ===================== 聯機版：在房間裡調整所有模擬設定 =====================
   房主可以在房間頁的「模擬設定」（開戰前不論有沒有載入想定都可以）或作戰中的「設定」分頁調整所有模擬設定；
   改動以「設定路徑 → 值」送到伺服器，所有人一起套用。載入想定前調整的設定，也會套用到之後載入的想定或存檔；「恢復想定的設定」可以撤銷。
   作戰時限、友軍迷霧、點數規則與增援名單改動時走原本的房間設定。聯機作戰固定雙盲（戰場迷霧不能關）；自動暫停會暫停整個房間（聯機預設全部關閉）。
   圖形、畫面效果、音效、音樂與戰爭花費單價只影響自己的畫面，各自設定。其他玩家看得到設定，但不能修改。
   （本檔最後載入，好讓其他檔案加到設定頁的選項一併處理。） */
var MPSET={open:false,stub:null,snap:null,rr:false,last:''};
var MPSCFG={ffog:1,rp:1,tech:1,rp0:1,rpDay:1,tp0:1,tpDay:1,rfL:1},MPSLOC={cprice:1,fog:1,seed:1,rfX:1,rfH:1};
/* 只影響自己畫面的選項、房間頁不重複列出的選項（房間設定已經有點數規則與增援名單）：由設定登錄表標記 */
function mpSetLocal(el){return !!(el&&el.closest&&el.closest('[data-local]'));}
function mpSetDup(el){return !!(el&&el.closest&&el.closest('[data-dup]'));}
/* 兩份設定的差異：[路徑, 新值]（刪除的鍵為 null），最多三層 */
function mpSetDiff(a,b,p,out){out=out||[];var ks={};Object.keys(a||{}).forEach(function(k){ks[k]=1;});Object.keys(b||{}).forEach(function(k){ks[k]=1;});
  Object.keys(ks).forEach(function(k){var x=a?a[k]:undefined,y=b?b[k]:undefined,q=p?p+'.'+k:k;if(JSON.stringify(x)===JSON.stringify(y))return;
    var ox=function(v){return v&&typeof v==='object'&&!Array.isArray(v);};/* 新增的設定群組也逐項送出，不整個覆蓋 */
    if(ox(y)&&(ox(x)||x===undefined||x===null)&&q.split('.').length<3)mpSetDiff(x||{},y,q,out);else out.push([q,y===undefined?null:JSON.parse(JSON.stringify(y))]);});return out;}
function mpSoSet(o,p,v){var k=p.split('.'),x=o;for(var i=0;i<k.length-1;i++){if(x[k[i]]===null||typeof x[k[i]]!=='object')x[k[i]]=/^\d+$/.test(k[i+1])?[]:{};x=x[k[i]];}var l=k[k.length-1];if(v===null||v===undefined)delete x[l];else x[l]=JSON.parse(JSON.stringify(v));}
/* 送出：作戰時限另外確認；房間設定管理的項目送房間設定；其他送模擬設定 */
function mpSetSend(ch,src){var cf={},so=[],dur=null,n=0;ch.forEach(function(q){var p=q[0],top=p.split('.')[0];if(MPSLOC[top])return;if(top==='dur'){dur=src.dur;return;}if(MPSCFG[top]){if(src[top]!==undefined)cf[top]=JSON.parse(JSON.stringify(src[top]));return;}so.push(q);});
  if(dur>0&&mpDurSend(dur))n++;if(Object.keys(cf).length&&mpSend({t:'rcfg',cfg:cf}))n++;if(so.length&&mpSend({t:'rset',ch:so}))n+=so.length;
  if(n)toast('已送出設定，伺服器套用後所有人一起生效。',2500);return n;}
/* 房間的模擬設定：有想定時是伺服器上目前的設定；還沒有想定時是預設值加上房間調整過的項目 */
function mpSetBase(R){var C=R.cfg||{},S;if(R.scn&&R.scn.set)S=JSON.parse(JSON.stringify(R.scn.set));
  else{S=newGame({year:1943,seed:'room'},{}).set;delete S.seed;var A=S.autoPause||(S.autoPause={});Object.keys(APDEF).forEach(function(k){A[k]=false;});var so=C.so||{};Object.keys(so).forEach(function(p){mpSoSet(S,p,so[p]);});
    if(C.dur>0)S.dur=C.dur;S.ffog=!!C.ffog;['rp','tech','rp0','rpDay','tp0','tpDay'].forEach(function(k){if(C[k]!==undefined)S[k]=C[k];});if(C.rfL)S.rfL=C.rfL;}
  S.fog=true;return S;}
function mpSetStub(R){var g=newGame({year:(R.scn&&R.scn.year)||1943,seed:'room'},{});g.set=mpSetBase(R);g.started=false;if(R.scn&&R.scn.sides)R.scn.sides.forEach(function(s,i){if(!s||i>2)return;if(!g.sides[i])g.sides[i]=newSide(i);g.sides[i].name=s.name;g.sides[i].color=s.color;});return g;}
/* 在暫時的作戰（只有設定）上執行單機版設定頁的程式：畫面、切換分頁與頂列都不動 */
function mpSetStubRun(fn){var S=MPSET.stub;if(!S)return;var g0=G,sh=show,br=barRender,vd=vDraw,before=JSON.parse(JSON.stringify(S.set));MPSET.rr=false;G=S;show=function(){MPSET.rr=true;};barRender=function(){};vDraw=function(){};
  try{fn();}catch(e){if(window.console)console.warn('mpset',e);}finally{G=g0;show=sh;barRender=br;vDraw=vd;}
  var ch=mpSetDiff(before,S.set,'');if(ch.length)mpSetSend(ch,S.set);if(MPSET.rr)mpRefresh();}
/* 房間頁的模擬設定編輯器：用單機版的設定頁畫出模擬相關的卡片 */
function mpSetEditorHtml(R,H){var g=mpSetStub(R),g0=G,sh=show,br=barRender,d=document.createElement('div');MPSET.stub=g;G=g;show=function(){};barRender=function(){};
  try{PAGES.set(d);}catch(e){if(window.console)console.warn('mpset render',e);}finally{G=g0;show=sh;barRender=br;}
  var grid=d.querySelector('.lw-grid');if(!grid)return '<div class="lw-note">無法顯示模擬設定。</div>';
  grid.querySelectorAll('.lw-sec').forEach(function(sec){if(mpSetLocal(sec)||mpSetDup(sec)){sec.remove();return;}
    sec.querySelectorAll('input,select,textarea,button').forEach(function(el){var k=el.getAttribute('data-c'),f=el.getAttribute('data-f'),a=el.getAttribute('data-a');
      if(k==='setb'&&f==='fog'){el.disabled=true;el.checked=true;el.title='聯機作戰固定雙盲';return;}if(a==='evgo'&&R.phase!=='run'){el.disabled=true;el.title='作戰開始後才能觸發';return;}if(!H){el.disabled=true;el.title='只有房主可以修改';}});});
  grid.querySelectorAll('.lw-setgrp').forEach(function(c){if(!c.querySelector('.lw-sec'))c.remove();});
  /* 開戰後不能改開戰時間 */if(R.phase==='run'||R.phase==='over'){var st=grid.querySelector('.lw-sec[data-s="start"]');if(st)st.remove();grid.querySelectorAll('.lw-setgrp').forEach(function(c){if(!c.querySelector('.lw-sec'))c.remove();});}
  return grid.outerHTML;}
function mpSetRoomCard(){var R=MPS.room;if(!R)return '';var H=mpHost(),so=R.cfg&&R.cfg.so||{},n=Object.keys(so).length;
  var o='<div class="lw-card" data-k="mpsetcard"><h3>模擬設定'+(H?'<small>開戰前或作戰中都可以調整，所有人一起套用</small>':'<small>只有房主可以修改</small>')+'</h3><div class="lw-row"><button type="button" class="lw-btn'+(MPSET.open?'':' pri')+'" data-a="mpsetopen">'+(MPSET.open?'收起模擬設定':'展開模擬設定（所有選項）')+'</button>'+
    (H&&n?'<button type="button" class="lw-btn" data-a="mpsetreset">恢復想定的設定</button>':'')+(mpActive()?'<button type="button" class="lw-btn" data-a="tab" data-v="set">前往「設定」分頁</button>':'')+'</div>'+
    '<div class="lw-note">'+(n?'房間調整了 '+n+' 項設定，'+(R.scn?'已套用到目前的想定，之後換想定或存檔也會套用':'會套用到之後載入的想定或存檔')+'。':'目前是'+(R.scn?'想定原本':'預設')+'的設定'+(R.scn?'':'；先調整的設定會套用到之後載入的想定或存檔')+'。')+
    '聯機作戰固定雙盲；自動暫停會暫停整個房間（預設全部關閉）。作戰時限、友軍迷霧、點數規則與增援名單也可以在上面的房間設定調整；畫面、效果、音效與音樂是各自的設定，在「設定」分頁調整。</div>';
  if(MPSET.open)o+='<div class="lw-mpset" data-k="mpsetc">'+mpSetEditorHtml(R,H)+'</div>';return o+'</div>';}
(function(){var b=mpPgRoom;mpPgRoom=function(){var r=b.apply(this,arguments);try{r+=mpSetRoomCard();}catch(e){if(window.console)console.warn('mpset card',e);}return r;};})();
/* 編輯器的事件在自己的範圍處理，不交給頁面的一般處理 */
function mpSetBind(){var c=UI.body&&UI.body.querySelector('[data-k="mpsetc"]');if(!c||c._mb)return;c._mb=1;
  c.addEventListener('change',function(e){var t=e.target,k=t&&t.getAttribute&&t.getAttribute('data-c');if(!k)return;e.stopPropagation();if(!mpHost()){mpRefresh();return;}if(CHG[k])mpSetStubRun(function(){CHG[k](t,e);});},true);
  c.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-a]');if(!b||!c.contains(b))return;e.stopPropagation();e.preventDefault();if(!mpHost())return;var k=b.getAttribute('data-a');
    if(k==='evgo'){mpEvGo(b);return;}if(ACT[k])mpSetStubRun(function(){ACT[k](b,e);});},true);
  c.addEventListener('input',function(e){e.stopPropagation();},true);}
(function(){var b=mpRefresh;mpRefresh=function(){b.apply(this,arguments);try{mpSetBind();}catch(e){}};})();
ACT.mpsetopen=function(){MPSET.open=!MPSET.open;mpRefresh();};
ACT.mpsetreset=function(){if(confirm('把房間調整過的模擬設定全部恢復為想定原本的設定？（作戰時限、友軍迷霧、點數規則與增援名單不受影響）'))mpSend({t:'rset',reset:1});};
/* 事件：房主在作戰中觸發，由伺服器執行 */
function mpEvGo(b){var k=b.getAttribute('data-v'),R=MPS.room;if(!mpHost()){toast('只有房主可以觸發事件。');return;}if(!R||R.phase!=='run'){toast('作戰開始後才能觸發事件。');return;}var M=0;
  if(k==='quake'){var m=prompt('地震規模（芮氏，4.5～8.5，空白＝隨機）','');if(m===null)return;if(m&&isFinite(+m))M=clamp(+m,4.5,8.5);}if(mpSend({t:'revt',k:k,M:M}))toast('已送出：觸發「'+(EVK[k]||k)+'」。',3000);}
(function(){var b=ACT.evgo;ACT.evgo=function(btn){if(!mpActive())return b(btn);mpEvGo(btn);};})();
/* ---------- 作戰中的「設定」分頁：房主改的設定送到伺服器；其他玩家唯讀 ---------- */
function mpSetPage(host){var grid=host.querySelector('.lw-grid');if(!grid)return;var H=mpHost(),R=MPS.room||{},ov=R.phase==='over'?R.over||{}:null;
  grid.querySelectorAll('.lw-sec').forEach(function(sec){if(mpSetLocal(sec))return;sec.querySelectorAll('input,select,textarea,button').forEach(function(el){var k=el.getAttribute('data-c'),f=el.getAttribute('data-f');
      if(k==='setb'&&f==='fog'){el.disabled=true;el.checked=true;el.title='聯機作戰固定雙盲';return;}if(!H){el.disabled=true;el.title='只有房主可以修改';}});});
  var nb=host.querySelector('[data-a="newgame"]');if(nb)nb.style.display='none';
  var d=document.createElement('div');d.className='lw-card lw-mpsetnote';d.innerHTML='<h3>聯機作戰的設定</h3><div class="lw-note">模擬在伺服器上執行。'+
    (H?'你是房主：這一頁的<b>模擬設定</b>都會送到伺服器、所有人一起套用（也可以在「聯機」分頁的房間頁調整；作戰時限也可以按頂列的「⏱」）'+(ov&&ov.why==='時間到'?'；作戰已因時限結束，延長時限即可繼續作戰':''):'<b>模擬設定</b>由房主決定，你只能檢視')+
    '。聯機作戰固定雙盲；自動暫停會暫停整個房間。圖形、畫面效果、音效、音樂與戰爭花費單價只影響你自己的畫面。</div>';grid.insertBefore(d,grid.firstChild);MPSET.last=JSON.stringify(R.scn&&R.scn.set||null);}
(function(){var b=PAGES.set;PAGES.set=function(host){b.apply(this,arguments);if(mpActive())try{mpSetPage(host);}catch(e){if(window.console)console.warn('mpSetPage',e);}};})();
/* 房主在設定頁的改動：處理前記下設定，處理後比較差異送出 */
function mpSetCapture(e){if(!mpActive()||UI.tab!=='set'||!mpHost())return;var t=e.target;if(!t||!t.closest)return;var sec=t.closest('.lw-sec');if(!sec||mpSetLocal(sec))return;if(e.type==='click'&&!t.closest('[data-a]'))return;
  if(MPSET.snap===null){MPSET.snap=JSON.stringify(G.set);setTimeout(mpSetFlush,0);}}
function mpSetFlush(){var s=MPSET.snap;MPSET.snap=null;if(s===null||!mpActive()||!mpHost())return;var ch=mpSetDiff(JSON.parse(s),G.set,'');if(ch.length)mpSetSend(ch,G.set);}
root.addEventListener('change',mpSetCapture,true);root.addEventListener('click',mpSetCapture,true);
/* 作戰時限另外確認；友軍迷霧送房間設定；非房主不能改 */
(function(){var sv=CHG.setv;CHG.setv=function(t){if(!mpActive())return sv(t);var f=t.getAttribute('data-f');if(!mpHost()){t.value=G.set[f];toast('只有房主可以修改模擬設定。');return;}
    if(f!=='dur')return sv(t);var v=Math.round(+t.value||0);if(mpDurSend(v))toast('作戰時限改為 '+durH(v)+'，所有人一起套用。',3500);else t.value=G.set.dur;};
  var dp=CHG.durp;CHG.durp=function(t){if(!mpActive())return dp(t);var v=+t.value;t.value='0';if(!v)return;if(mpDurSend(v)){var inp=document.querySelector('input[data-c="setv"][data-f="dur"]');if(inp)inp.value=v;toast('作戰時限改為 '+durH(v)+'，所有人一起套用。',3500);}};
  var ff=CHG.ffogset;if(ff)CHG.ffogset=function(t){if(!mpActive())return ff(t);if(!mpHost()){t.checked=!!G.set.ffog;toast('只有房主可以切換友軍迷霧。');return;}mpSend({t:'rcfg',cfg:{ffog:!!t.checked}});};})();
/* 伺服器套用之後：設定頁的欄位跟著更新；其他玩家的設定頁重畫 */
(function(){var b=mpOn;mpOn=function(o){b(o);if(!o||o.t!=='room'||!o.room||UI.tab!=='set'||!mpActive())return;var R=o.room;
    if(!mpHost()){var js=JSON.stringify(R.scn&&R.scn.set||null);if(js!==MPSET.last){MPSET.last=js;show('set');}return;}
    var di=UI.body.querySelector('input[data-c="setv"][data-f="dur"]');if(di&&document.activeElement!==di&&R.scn&&R.scn.dur)di.value=R.scn.dur;var fg=UI.body.querySelector('input[data-c="ffogset"]');if(fg&&R.cfg)fg.checked=!!R.cfg.ffog;};})();
