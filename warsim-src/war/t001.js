/* ===================== 介面骨架：頂列（時鐘、天氣、時間控制、視角）、分頁、通知、對話框、主迴圈 ===================== */
var UI={tab:'start',side:0,sel:[],selC:0,selB:0,tool:'sel',ord:null,lay:{lbl:1,grid:0,units:1,ord:1,ct:1,bt:1,fr:1,sup:1,fx:1,civ:1,evt:1},lvl:'auto',run:false,speed:60,contour:true,allOrd:false,showOld:false,logF:'all',brush:3,acc:0,realSp:0,hudT:0,drawT:0,
  ordOpt:{sync:true,tac:'frontal',post:'hasty',roe:'side',pace:'normal',fm:'line',prep:0,tol:35,road:false,r:600,dur:30,Y:10,sr:0,bk:'pos',xk:'boat',bt:'auto',rk:'auto',ck:'ladder',cn:10,jp:60,rq:'fires',rqTo:'up'}};
var TABS=[['start','開始'],['map','地圖編修'],['orbat','兵力編成'],['deploy','部署'],['battle','作戰'],['logi','後勤'],['rep','戰報'],['replay','回放'],['set','設定'],['help','說明']];
var SPEEDS=[1,10,30,60,120,300,600,1800,3600,10800];
function boot(){root.classList.add('lato-tool');root.innerHTML='<div class="lw-bar"></div><div class="lw-tabs"></div><div class="lw-body"></div>';UI.bar=root.querySelector('.lw-bar');UI.tabs=root.querySelector('.lw-tabs');UI.body=root.querySelector('.lw-body');
  root.addEventListener('click',onAct);root.addEventListener('change',onChg);root.addEventListener('input',onInp);UI.redraw=function(full){vDraw(full);};
  barRender();tabsRender();show('start');requestAnimationFrame(loop);document.addEventListener('keydown',onKey);try{autoLoadList();}catch(e){}}
function onKey(e){if(!G||!G.started||/INPUT|SELECT|TEXTAREA/.test((e.target.tagName||'')))return;if(e.key==='Escape'){setTool('sel');}}
/* ---------- 頂列 ---------- */
function barRender(){var o='<span class="lw-ttl">作戰模擬</span><span class="lw-scn">'+(G&&G.replay?'▶ 回放：':'')+esc(G&&G.map?G.map.name:'尚未建立作戰')+'</span>';
  if(G&&G.map){o+='<span class="lw-clock"><b data-k="clock"></b><span class="lw-wx" data-k="wx"></span></span><span class="lw-sp"></span>';
    var narrow=(root.clientWidth||window.innerWidth)<700;if(G.started&&narrow){o+='<span class="lw-tc"><button type="button" data-a="run">'+(UI.run?'⏸':'▶')+'</button><select data-c="spd">'+SPEEDS.map(function(s){return '<option value="'+s+'"'+(UI.speed===s?' selected':'')+'>'+(s>=3600?'每秒 '+(s/3600)+' 小時':s>=60?'每秒 '+(s/60)+' 分':s+' 倍')+'</option>';}).join('')+'</select><button type="button" data-a="step">+30秒</button><button type="button" data-a="appop" title="自動暫停的條件">⏸⚙</button><span class="lw-rt" data-k="rt"></span></span>';}
    else if(G.started){o+='<span class="lw-tc"><button type="button" data-a="run" title="開始／暫停（空白鍵）">'+(UI.run?'⏸':'▶')+'</button>'+SPEEDS.map(function(s){return '<button type="button" data-a="spd" data-v="'+s+'" class="'+(UI.speed===s?'on':'')+'" title="每秒 '+durTxt(s)+' 遊戲時間">'+(s>=3600?(s/3600)+'時':s>=60?(s/60)+'分':s+'×')+'</button>';}).join('')+'<button type="button" data-a="step" title="前進 30 秒">+30秒</button><button type="button" data-a="appop" title="自動暫停的條件">⏸ 自動暫停</button><span class="lw-rt" data-k="rt"></span></span>';}
    o+='<select data-c="view" title="以哪一方的視角觀看（戰場迷霧）">'+[[0,G.sides[0].name+'視角'],[1,G.sides[1].name+'視角'],[-1,'上帝視角']].map(function(q){return '<option value="'+q[0]+'"'+(UI.side===q[0]?' selected':'')+'>'+esc(q[1])+'</option>';}).join('')+'</select>'+
      '<button type="button" class="lw-btn sm" data-a="save" style="min-height:28px">存檔</button>';}
  UI.bar.innerHTML=o;hudTick(true);layoutVar();}
function layoutVar(){if(!UI.bar||!UI.tabs)return;var h=(UI.bar.offsetHeight||40)+(UI.tabs.offsetHeight||36);root.style.setProperty('--lwtop',h+'px');UI.tabs.style.top=(UI.bar.offsetHeight||40)+'px';}
window.addEventListener('resize',function(){layoutVar();});
function hudTick(force){if(!G||!G.map||!UI.bar)return;var ck=UI.bar.querySelector('[data-k="clock"]'),wx=UI.bar.querySelector('[data-k="wx"]'),rt=UI.bar.querySelector('[data-k="rt"]');
  if(ck){var d=G.started?now():{y:G.set.y,m:G.set.m,d:G.set.d,h:G.set.h,mi:G.set.mi||0};ck.textContent=clockTxt(d);ck.title=G.started?'作戰第 '+durTxt(G.t):'';}
  if(wx&&G.env){var E=G.env;wx.textContent=WX[E.wx][1]+' '+fx(E.T,0)+'°C・'+({day:'白天',night:'夜間',dawn:'黎明',dusk:'黃昏'})[E.phase]+(E.mud>0.3?'・泥濘':'')+(E.snow>0.3?'・積雪':'');}
  if(rt)rt.textContent=UI.run?'×'+fmt(UI.realSp):'';}
function tabsRender(){UI.tabs.innerHTML=TABS.map(function(t){var dis=!G&&t[0]!=='start'&&t[0]!=='help'&&t[0]!=='replay'||(t[0]==='battle'||t[0]==='logi'||t[0]==='rep')&&!(G&&G.started);return '<button type="button" data-a="tab" data-v="'+t[0]+'" class="'+(UI.tab===t[0]?'on':'')+'"'+(dis?' disabled':'')+'>'+t[1]+'</button>';}).join('');
  layoutVar();}
function show(tab){/* 重畫同一頁時保留捲動位置 */var sc=UI.tab===tab&&UI.body&&UI.body.firstChild?scrollBox(UI.body):null,sy=sc?sc.scrollTop:0;if(UI.tab!==tab){if(UI.onLeave){UI.onLeave();UI.onLeave=null;}/* 換頁時關掉快速設定的小視窗 */document.querySelectorAll('.lw-appop').forEach(function(e){e.remove();});}if(!G&&tab!=='start'&&tab!=='help'&&tab!=='replay')tab='start';if(G&&!G.started&&/^(battle|logi|rep)$/.test(tab))tab='orbat';UI.tab=tab;UI.onClick=UI.onPlace=UI.onLine=UI.onPaint=UI.onPaintEnd=UI.onDragUnit=UI.onRight=UI.onSel=null;UI.canDrag=null;if(UI.tool!=='sel'&&tab!=='battle')UI.tool='sel';tabsRender();
  var f=PAGES[tab];UI.body.innerHTML='';if(f)f(UI.body);if(sc&&UI.tab===tab)sc.scrollTop=sy;}
function scrollBox(el){for(var e=el;e&&e!==document.body&&e!==document.documentElement;e=e.parentElement){var o=getComputedStyle(e).overflowY;if((o==='auto'||o==='scroll')&&e.scrollHeight>e.clientHeight)return e;}return document.scrollingElement||document.documentElement;}
var PAGES={};
/* ---------- 事件 ---------- */
var ACT={},CHG={},INP={};
function onAct(e){var b=e.target.closest('[data-a]');if(!b||b.disabled)return;var f=ACT[b.getAttribute('data-a')];if(f){e.preventDefault();f(b,e);}}
function onChg(e){var t=e.target,k=t.getAttribute('data-c');if(k&&CHG[k])CHG[k](t,e);}
function onInp(e){var t=e.target,k=t.getAttribute('data-i');if(k&&INP[k])INP[k](t,e);}
ACT.tab=function(b){show(b.getAttribute('data-v'));};
ACT.run=function(){toggleRun();};
ACT.spd=function(b){UI.speed=+b.getAttribute('data-v');barRender();};
ACT.step=function(){if(!G||!G.started||G.over)return;simStep();UI.after();};
ACT.save=function(){saveDlg();};
CHG.spd=function(t){UI.speed=+t.value;};
CHG.view=function(t){UI.side=+t.value;UI.sel=[];UI.selC=0;barRender();if(UI.tab==='battle')show('battle');else vDraw(true);};
function toggleRun(){if(!G||!G.started)return;if(G.over){toast('作戰已結束（'+G.over.why+'）。可在「設定」延長作戰時間後繼續。');return;}UI.run=!UI.run;UI.lastTs=0;UI.acc=0;barRender();if(UI.run&&UI.tab!=='battle')show('battle');}
/* ---------- 通知與對話框 ---------- */
function toast(msg,ms){var box=root.querySelector('.lw-toasts');if(!box){box=document.createElement('div');box.className='lw-toasts';root.appendChild(box);}var t=document.createElement('div');t.className='lw-toast';t.textContent=msg;box.appendChild(t);while(box.children.length>4)box.firstChild.remove();setTimeout(function(){t.remove();},ms||3200);}
function dlg(html,wide){var d=document.createElement('div');d.className='lw-dlg';d.innerHTML='<div'+(wide?' style="max-width:980px"':'')+'>'+html+'</div>';root.appendChild(d);d.addEventListener('click',function(e){if(e.target===d||e.target.closest('[data-a="x"]'))d.remove();});return d;}
ACT.x=function(){};
/* ---------- 主迴圈：依速度推進模擬、重繪 ---------- */
function loop(ts){requestAnimationFrame(loop);if(!G||!G.started)return;var t=performance.now(),dt=UI.lastTs?Math.min(0.25,(t-UI.lastTs)/1000):0;UI.lastTs=t;
  var done=0;if(UI.run&&!G.over){G._pfMs=12;UI.acc+=dt*UI.speed;var n=UI.snapping?0:Math.floor(UI.acc/DT);if(n>0){var t0=performance.now(),bud=simBudget();while(done<n&&performance.now()-t0<bud){simStep();done++;if(UI.pauseReq||G.over||inputWaiting())break;}UI.acc-=done*DT;if(UI.acc>DT*3)UI.acc=DT*3;}
    UI.spHist=(UI.spHist||[]).concat([[t,done*DT]]).filter(function(q){return t-q[0]<2000;});UI.realSp=sum(UI.spHist,function(q){return q[1];})/2;
    if(UI.pauseReq||G.over){UI.run=false;var why=UI.pauseReq||('作戰結束：'+G.over.why);UI.pauseReq=null;barRender();toast(why,4500);UI.after(true);return;}}
  if(done)UI.stepped=1;var iv=typeof gfxDrawIv==='function'?gfxDrawIv(UI.stepped):45;if(UI.run&&t-UI.drawT>iv){UI.drawT=t;UI.stepped=0;UI.after(false);}else if(!UI.run&&UI.dirty){UI.dirty=false;UI.after(false);}
  if(t-UI.hudT>300){UI.hudT=t;hudTick();}}
/* 每一幀的模擬時間上限：拖曳地圖時縮短，畫面跟得上手；有滑鼠或鍵盤輸入等著處理時立刻讓出 */
function simBudget(){var b=UI.speed>=3600?40:30;return VW.drag?Math.min(b,12):b;}
function inputWaiting(){try{var S=navigator.scheduling;return !!(S&&S.isInputPending&&S.isInputPending());}catch(e){return false;}}
UI.after=function(force){if(!G)return;var mapTab=UI.tab==='battle'||UI.tab==='deploy'||UI.tab==='map';if(mapTab){vDraw(!!(G.dirty&&G.dirty.length)||force);}if(UI.tab==='battle'&&UI.panelTick)UI.panelTick(force);/* 作戰進行中由主迴圈每 300 毫秒更新頂列 */if(force||!UI.run)hudTick();};
function wirePause(){G.onPause=function(r){if(UI.run)UI.pauseReq='自動暫停：'+r;};G.onLog=function(){UI.logDirty=true;};}
