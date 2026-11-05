/* ===================== 快捷鍵：所有鍵盤操作登錄在一張表，由同一個處理程序分派；設定頁「鍵盤快捷鍵」可以改鍵（存在這台電腦的瀏覽器）
   hkReg(代號, 名稱, 分組, 預設按鍵（字串或陣列）, 動作(e), 條件())。按鍵寫法：小寫字母、數字、Space、Escape、ArrowLeft、Home、+、?；組合鍵寫成 Shift+m、Ctrl+s。
   Esc（關閉視窗、取消工具）固定不能改。 ===================== */
var HKG=[['time','時間'],['map','地圖'],['page','頁面'],['ord','命令']];
var HKR=[],HKM={},HKCAP=null;
function hkReg(id,n,g,k,f,w){var o={id:id,n:n,g:g,k:[].concat(k||[]).filter(Boolean),f:f,w:w||null};if(HKM[id])HKR[HKR.indexOf(HKM[id])]=o;else HKR.push(o);HKM[id]=o;return o;}
function hkKeys(id){var o=UIP.hk&&UIP.hk[id];if(o!==undefined&&o!==null)return o===''?[]:[].concat(o);return HKM[id]?HKM[id].k:[];}
function hkShow(k){var N={Space:'空白鍵',Escape:'Esc',ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓'};return String(k).split('+').map(function(p,i,a){if(i<a.length-1)return p;return N[p]||(p.length===1?p.toUpperCase():p);}).join('+');}
function hkTxt(id){return hkKeys(id).map(hkShow).join('／');}
/* 鍵盤事件轉成按鍵字串；只有修飾鍵時傳回空字串 */
function hkOf(e){var k=e.key;if(!k||/^(Shift|Control|Alt|Meta|CapsLock|Dead|Unidentified)$/.test(k))return '';if(k===' ')k='Space';var one=k.length===1,isL=one&&/[a-z]/i.test(k);if(one)k=k.toLowerCase();
  return (e.ctrlKey||e.metaKey?'Ctrl+':'')+(e.altKey?'Alt+':'')+(e.shiftKey&&(isL||!one)?'Shift+':'')+k;}
function hkOnMap(){return !!(G&&MAPT[UI.tab]&&VW.cw);}
function hkPan(dx,dy){var P=Math.round(Math.min(VW.cw,VW.ch)*0.18);VW.ox+=dx*P;VW.oy+=dy*P;vDraw(true);}
function hkMid(){return [(VW.padL||0)+(VW.cw-(VW.padL||0)-(VW.padR||0))/2,VW.ch/2];}
/* ---------- 登錄 ---------- */
hkReg('run','開始／暫停','time','Space',function(){toggleRun();},function(){return !!(G&&G.started);});
SPEEDS.forEach(function(v,i){if(i>9)return;hkReg('sp'+i,'速度：'+(v>=60?'每秒 '+durTxt(v):v+' 倍'),'time',String((i+1)%10),function(){UI.speed=v;barRender();toast('速度：'+(v>=60?'每秒 '+durTxt(v):v+' 倍'));},function(){return !!(G&&G.started&&!G.replay);});});
hkReg('zin','放大','map',['+','='],function(){var m=hkMid();vZoom(1.4,m[0],m[1]);},hkOnMap);
hkReg('zout','縮小','map',['-','_'],function(){var m=hkMid();vZoom(1/1.4,m[0],m[1]);},hkOnMap);
hkReg('fit','全圖','map',['z','Home'],function(){vFit();},hkOnMap);
hkReg('panl','地圖往左','map',['ArrowLeft','a'],function(){hkPan(1,0);},hkOnMap);
hkReg('panr','地圖往右','map',['ArrowRight','d'],function(){hkPan(-1,0);},hkOnMap);
hkReg('panu','地圖往上','map',['ArrowUp','w'],function(){hkPan(0,1);},hkOnMap);
hkReg('pand','地圖往下','map',['ArrowDown','s'],function(){hkPan(0,-1);},hkOnMap);
hkReg('unm','部隊番號','map','n',function(){layToggle('unm');},hkOnMap);
hkReg('thz','防區圖層','map','t',function(){layToggle('thz');},hkOnMap);
hkReg('pl','收合左側面板','map','l',function(){panelToggle('l');},function(){return hkOnMap()&&!!UI.land;});
hkReg('pr','收合右側面板','map','r',function(){panelToggle('r');},function(){return hkOnMap()&&!!UI.land;});
hkReg('logi','後勤頁','page','g',function(){show('logi');},function(){return !!(G&&G.started);});
hkReg('battle','作戰地圖','page','b',function(){show('battle');},function(){return !!(G&&G.started);});
hkReg('set','設定','page','',function(){show('set');},function(){return !!G;});
hkReg('full','瀏覽器全螢幕','page','f',function(){ACT.fullscr();});
hkReg('help','鍵盤與滑鼠操作','page','?',function(){ACT.keyhelp();});
hkReg('radial','環形命令選單','ord','q',function(){if(RM.on)rmClose();else if(!rmOpen(null)&&UI.sel.length)toast('選取的部隊不在畫面上，或沒有可以下達的命令。');},function(){return !!(G&&G.started);});
/* 命令：有預設按鍵的先登錄；其他命令也可以在設定頁指定按鍵 */
function hkOrd(k){return function(){var us=UI.sel.map(uById).filter(function(u){return u&&alive(u)&&(mySide()===null||u.side===mySide());});if(!us.length){toast('請先選取本方部隊。');return;}
  if(!us.some(function(u){return canOrd(u,k);})){toast('選取的部隊不能執行「'+ORDR[k].n+'」。');return;}if(typeof rmClose==='function')rmClose();ACT.ob({getAttribute:function(a){return a==='data-v'?k:null;}});};}
function hkOrdOk(){return !!(G&&G.started&&!G.replay&&UI.tab==='battle');}
ORDB.forEach(function(q){var R=ORDR[q[0]];if(R)hkReg('o:'+q[0],'命令：'+R.n,'ord',R.key||'',hkOrd(q[0]),hkOrdOk);});
/* ---------- 分派 ---------- */
document.addEventListener('keydown',function(e){if(!root||!root.isConnected)return;var tg=e.target||{};
  if(HKCAP){var k0=hkOf(e);if(!k0)return;e.preventDefault();e.stopPropagation();var id=HKCAP;HKCAP=null;if(k0!=='Escape'){UIP.hk=UIP.hk||{};UIP.hk[id]=[k0];uipSave();toast('「'+HKM[id].n+'」改為 '+hkShow(k0));}setSecRe('keys');return;}
  if(kTyping(tg))return;var k=hkOf(e);if(!k||k==='Escape')return;if((k==='Space'||k==='Enter')&&/^(INPUT|BUTTON)$/.test(tg.tagName||''))return;
  var run=function(k){for(var i=0;i<HKR.length;i++){var o=HKR[i];if(hkKeys(o.id).indexOf(k)<0)continue;if(o.w&&!o.w())continue;e.preventDefault();try{o.f(e);}catch(x){if(window.console)console.warn('快捷鍵 '+o.id,x);}return true;}return false;};
  /* 沒有綁定的 Shift 組合當作沒按 Shift：按住 Shift 連續下令時，命令鍵照常可用 */if(!run(k)&&k.indexOf('Shift+')===0)run(k.slice(6));},false);
/* Esc：關閉視窗、回到地圖（固定） */
document.addEventListener('keydown',function(e){if(e.key!=='Escape'||!root||!root.isConnected||HKCAP||kTyping(e.target)||e.ctrlKey||e.metaKey||e.altKey)return;var D=root.querySelector('.lw-dlg');if(D){D.remove();return;}if(UI.sheetOn)show(UI.baseTab||'battle');});
/* ---------- 設定頁：檢視與改鍵 ---------- */
SETG.splice(SETG.map(function(g){return g[0];}).indexOf('data'),0,['keys','鍵盤快捷鍵','所有鍵盤操作與按鍵；可以改鍵（只影響自己）',1]);
setSec('keys','keys',{o:10,wide:1,note:'按「改鍵」後再按想要的按鍵（Esc 取消）；同一個按鍵指定給兩個操作時，以列在前面的為準。按鍵存在這台電腦的瀏覽器裡。',h:function(){var use={};
    HKR.forEach(function(o){hkKeys(o.id).forEach(function(k){(use[k]=use[k]||[]).push(o.id);});});
    return '<table class="lw-tbl lw-hkt">'+HKG.map(function(g){var L=HKR.filter(function(o){return o.g===g[0];});if(!L.length)return '';return '<tr><th colspan="3">'+g[1]+'</th></tr>'+L.map(function(o){var K=hkKeys(o.id),dup=K.filter(function(k){return use[k].length>1;}),ch=UIP.hk&&UIP.hk[o.id]!==undefined;
      return '<tr data-hk="'+o.id+'"><td>'+esc(o.n)+'</td><td>'+(HKCAP===o.id?'<b>請按新的按鍵…（Esc 取消）</b>':K.length?K.map(function(k){return '<kbd>'+esc(hkShow(k))+'</kbd>';}).join(' '):'<span class="lw-note">未指定</span>')+
        (dup.length?' <span class="lw-hkdup">與「'+esc(use[dup[0]].filter(function(x){return x!==o.id;}).map(function(x){return HKM[x].n;}).join('」「'))+'」相同</span>':'')+'</td>'+
        '<td class="n"><button type="button" class="lw-btn sm" data-a="hkset" data-v="'+o.id+'">改鍵</button>'+(K.length?' <button type="button" class="lw-btn sm" data-a="hkclr" data-v="'+o.id+'">清除</button>':'')+(ch?' <button type="button" class="lw-btn sm" data-a="hkdef" data-v="'+o.id+'">預設</button>':'')+'</td></tr>';}).join('');}).join('')+
      '</table><div class="lw-row"><button type="button" class="lw-btn sm" data-a="hkall">全部恢復預設</button></div>';}});
ACT.hkset=function(b){HKCAP=b.getAttribute('data-v');setSecRe('keys');};
ACT.hkclr=function(b){UIP.hk=UIP.hk||{};UIP.hk[b.getAttribute('data-v')]='';uipSave();setSecRe('keys');};
ACT.hkdef=function(b){if(UIP.hk)delete UIP.hk[b.getAttribute('data-v')];uipSave();setSecRe('keys');};
ACT.hkall=function(){delete UIP.hk;uipSave();setSecRe('keys');toast('快捷鍵已全部恢復預設。');};
/* 鍵盤說明：由登錄表產生，另列滑鼠操作 */
var MOUSEH=[['滑鼠拖曳','移動地圖'],['滾輪','放大縮小'],['左鍵','選取（Shift 或 Ctrl 加選，Shift 拖曳框選）'],['右鍵','選取的部隊移動到該處'],['Esc','取消工具、關閉視窗、回到地圖']];
ACT.keyhelp=function(){var o='<h3>鍵盤與滑鼠操作</h3><table class="lw-tbl">'+HKG.map(function(g){var L=HKR.filter(function(q){return q.g===g[0]&&hkKeys(q.id).length;});if(!L.length)return '';
    /* 速度鍵合併成一列 */var sp=L.filter(function(q){return /^sp\d$/.test(q.id);}),rest=L.filter(function(q){return !/^sp\d$/.test(q.id);});
    return '<tr><th colspan="2">'+g[1]+'</th></tr>'+(sp.length?'<tr><td>'+sp.map(function(q){return '<kbd>'+esc(hkTxt(q.id))+'</kbd>';}).join(' ')+'</td><td>速度（'+esc(sp[0].n.replace('速度：',''))+'～'+esc(sp[sp.length-1].n.replace('速度：',''))+'）</td></tr>':'')+
      rest.map(function(q){return '<tr><td>'+hkKeys(q.id).map(function(k){return '<kbd>'+esc(hkShow(k))+'</kbd>';}).join(' ')+'</td><td>'+esc(q.n)+'</td></tr>';}).join('');}).join('')+
    '<tr><th colspan="2">滑鼠</th></tr>'+MOUSEH.map(function(q){return '<tr><td><kbd>'+q[0]+'</kbd></td><td>'+q[1]+'</td></tr>';}).join('')+'</table><div class="lw-row"><button type="button" class="lw-btn" data-a="x">關閉</button><button type="button" class="lw-btn" data-a="hkgo">改鍵…</button></div>';dlg(o);};
ACT.hkgo=function(){var D=root.querySelector('.lw-dlg');if(D)D.remove();UI.setQ='';show('set');setTimeout(function(){var c=UI.body&&UI.body.querySelector('.lw-setgrp[data-g="keys"]');if(c)c.scrollIntoView({block:'start'});},0);};
