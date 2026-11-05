/* ===================== 回放頁：匯入回放檔或使用目前作戰的紀錄；時間軸拖曳、播放與變速、事件跳轉、戰鬥與戰線隨時間顯示 ===================== */
var RP={G:null,G0:null,t:0,play:false,spd:600,last:0,src:'',evF:'key',raf:0};
var RPSP=[60,300,600,1800,3600,7200];
var RPK=/dead|rout|obj|reinf|nuke|abn|amph|siege|hq|end|start|bt|assault|surr|twd|eager|panic|refuse/;
PAGES.replay=function(host){if(RP.G&&G!==RP.G){RP.G0=G;G=RP.G;replayEnter();}
  if(!RP.G||G!==RP.G){host.innerHTML='<div class="lw-main"><div class="lw-card"><h3>回放</h3><div class="lw-note">作戰進行時每兩分鐘記錄一次所有單位的位置、兵力與狀態，以及天氣、日夜、目標點與戰線。可以觀看目前作戰的回放，或匯入別人分享的回放檔（.latowarreplay.json）。</div><div class="lw-row">'+
    (G&&G.started&&!G.replay&&G.rec&&G.rec.fr.length?'<button type="button" class="lw-btn pri" data-a="rpcur">觀看目前作戰的回放（'+durTxt(G.rec.fr[G.rec.fr.length-1].t-G.rec.fr[0].t)+'）</button><button type="button" class="lw-btn" data-a="repexp">匯出回放檔</button>':'')+
    '<label class="lw-btn">匯入回放檔<input type="file" accept=".json,application/json" data-c="rpfile" hidden></label></div>'+(G&&G.started&&(!G.rec||!G.rec.fr.length)?'<div class="lw-note">目前的作戰還沒有紀錄（開戰後才開始記錄）。</div>':'')+'</div></div>';return;}
  host.innerHTML='<div class="lw-work"><div class="lw-pane lw-left"><div class="lw-ph"><b>事件</b><span class="lw-sp"></span><select data-c="rpev"><option value="key"'+(RP.evF==='key'?' selected':'')+'>重要事件</option><option value="all"'+(RP.evF==='all'?' selected':'')+'>全部</option><option value="bt"'+(RP.evF==='bt'?' selected':'')+'>戰鬥</option></select></div><div class="lw-pb" data-k="rpl"></div></div><div class="lw-mh"></div><div class="lw-pane"><div class="lw-pb" data-k="rpr"></div></div></div>';
  viewMount(host.querySelector('.lw-mh'));UI.onClick=rpClick;rpPanel(true);rpList(true);vDraw(true);
  UI.onLeave=function(){replayLeave();};};
/* 進入／離開回放：暫時把目前的作戰換成回放資料，離開時換回 */
function replayEnter(){UI.run=false;UI.sel=[];UI.selC=0;UI.selB=0;UI.sideKeep=UI.side;UI.side=-1;reix();dupNames();resetCaches();if(!G.front&&G._frontP)G.front=unpackFront(G._frontP);if(G.front)G.front._rk=undefined;VW.fit=false;replaySeek(RP.t||G.rec.fr[0].t);barRender();tabsRender();}
function replayLeave(){RP.play=false;if(RP.G0!==undefined&&G===RP.G){G=RP.G0;RP.G0=null;if(UI.sideKeep!==undefined)UI.side=UI.sideKeep;if(G){reix();resetCaches();}VW.fit=false;barRender();tabsRender();}}
ACT.rpcur=async function(){try{var P=await replayPack();RP.G=await replayBuild(P);RP.t=RP.G.rec.fr[0].t;RP.src='目前作戰';show('replay');}catch(e){toast('無法建立回放：'+e.message);}};
CHG.rpfile=function(t){var f=t.files[0];if(!f)return;f.text().then(function(s){return replayBuild(JSON.parse(s));}).then(function(g){RP.G=g;RP.t=g.rec.fr[0].t;RP.src=f.name;show('replay');toast('已匯入回放：'+(g.name||''));}).catch(function(e){toast('匯入失敗：'+e.message);});};
ACT.repexp=async function(){if(G&&G.replay){toast('這已經是回放。');return;}try{var P=await replayPack();download((G.map.name||'作戰')+'_回放.latowarreplay.json',JSON.stringify(P),'application/json');UI.sdlg&&UI.sdlg.remove();}catch(e){toast('匯出失敗：'+e.message);}};
ACT.rpclose=function(){RP.play=false;var g0=RP.G0;if(G===RP.G){G=g0;RP.G0=null;if(UI.sideKeep!==undefined)UI.side=UI.sideKeep;if(G){reix();resetCaches();}}RP.G=null;UI.onLeave=null;barRender();tabsRender();show(G?(G.started?'battle':'orbat'):'start');};
/* 右欄：時間軸、播放控制、雙方兵力、進行中的戰鬥、控制面積 */
function rpPanel(full){var el=UI.body.querySelector('[data-k="rpr"]');if(!el||!G||!G.replay)return;var F=G.rec.fr,t0=F[0].t,t1=F[F.length-1].t,str=SIDES().map(function(s){var m=0,m0=0;G.units.forEach(function(u){if(u.side!==s||!isLeaf(u)||u.st==='off')return;m0+=(u.men0||0)+(u.veh0||0)*8;if(u.st!=='dead')m+=(u.men||0)+(u.veh||0)*8;});return m0?m/m0:0;});
  if(full||!el.querySelector('[data-k="rpsl"]')){el.innerHTML='<h3 style="margin:0 0 4px;font-size:14px">'+esc(G.name||'回放')+'</h3><div class="lw-note">來源：'+esc(RP.src||'')+'</div>'+
    '<div class="lw-row"><button type="button" class="lw-btn sm pri" data-a="rpplay" data-k="rpbt">'+(RP.play?'⏸ 暫停':'▶ 播放')+'</button><select data-c="rpspd">'+RPSP.map(function(v){return '<option value="'+v+'"'+(RP.spd===v?' selected':'')+'>每秒 '+durTxt(v)+'</option>';}).join('')+'</select><button type="button" class="lw-btn sm" data-a="rpjump" data-v="-3600">−1 時</button><button type="button" class="lw-btn sm" data-a="rpjump" data-v="3600">+1 時</button></div>'+
    '<input type="range" min="'+t0+'" max="'+t1+'" step="'+(G.rec.dt||120)+'" value="'+RP.t+'" data-k="rpsl" data-c="rpsl" style="width:100%"><div class="lw-row" style="margin:2px 0"><b data-k="rpclk"></b><span class="lw-sp"></span><span class="lw-note" data-k="rpel"></span></div>'+
    '<div data-k="rpst"></div><div class="lw-note">地圖為作戰結束時的狀態（含廢墟、焦土與炸毀的橋梁）；紫色粗線為當時的戰線，虛線為三小時前的戰線。</div><div class="lw-row"><button type="button" class="lw-btn sm" data-a="rpclose">結束回放</button></div>';}
  var sl=el.querySelector('[data-k="rpsl"]');if(sl&&document.activeElement!==sl)sl.value=RP.t;var ck=el.querySelector('[data-k="rpclk"]');if(ck)ck.textContent=clockTxt(now())+'（第 '+durTxt(RP.t)+'）';var e2=el.querySelector('[data-k="rpel"]');if(e2)e2.textContent=WX[G.env.wx][1]+'・'+(G.env.light>=0.99?'白天':G.env.light<0.3?'夜間':'晨昏');
  var bt=el.querySelector('[data-k="rpbt"]');if(bt)bt.textContent=RP.play?'⏸ 暫停':'▶ 播放';
  var B=G.bt.list.filter(function(R){return R.active;}).sort(function(a,b){return b.tier-a.tier;}),o='<div class="lw-bars">'+SIDES().map(function(s){return bar('<span style="color:'+G.sides[s].color+'">'+esc(G.sides[s].name)+'</span>',str[s]*100,str[s]>0.7?'g':str[s]>0.4?'y':'r');}).join('')+'</div>';
  var Fr=G.front;if(Fr&&Fr.init){var c=[0,0],land=0;for(var k=0;k<Fr.W*Fr.H;k++){if(Fr.wet&&Fr.wet[k])continue;land++;if(Fr.own[k]>=0)c[Fr.own[k]]++;}o+='<div class="lw-note">控制面積：'+SIDES().map(function(s){return '<b style="color:'+G.sides[s].color+'">'+esc(G.sides[s].name)+'</b> '+pct(c[s]/Math.max(1,land)*100);}).join('、')+'</div>';}
  o+='<h4 style="margin:8px 0 4px;font-size:13px">進行中的戰鬥（'+B.length+'）</h4>'+(B.length?'<table class="lw-tbl">'+B.slice(0,30).map(function(R){return '<tr class="cl" data-a="rpbt" data-v="'+R.id+'"><td><span class="lw-tier" style="background:'+TIERC[R.tier]+'">'+TIERN[R.tier]+'</span></td><td>'+esc(R.name)+'</td></tr>';}).join('')+'</table>':'<div class="lw-note">此刻沒有戰鬥。</div>');
  var nk=(G.nukes||[]).filter(function(n){return n.t<=RP.t;});if(nk.length)o+='<div class="lw-note">☢ 已發生 '+nk.length+' 次核打擊</div>';
  if(G.overR&&RP.t>=G.tEnd)o+='<div class="lw-note"><b>'+esc(G.overR.why)+'：'+(G.overR.win>=0?esc(G.sides[G.overR.win].name)+'獲勝':'不分勝負')+'</b></div>';
  var st=el.querySelector('[data-k="rpst"]');if(st)st.innerHTML=o;}
/* 左欄：事件清單（目前時間以前） */
function rpList(force){var el=UI.body.querySelector('[data-k="rpl"]');if(!el||!G||!G.replay)return;var L=[],rx=RP.evF==='key'?RPK:RP.evF==='bt'?/bt|assault|dead|rout/:null;for(var i=G.log.length-1;i>=0&&L.length<300;i--){var e=G.log[i];if(e.t>RP.t)continue;if(rx&&!rx.test(e.k))continue;L.push(e);}
  var key=L.length+'|'+(L[0]?L[0].t:0);if(!force&&el._key===key)return;el._key=key;el.innerHTML='<div class="lw-log">'+L.map(function(e){return '<div class="k-'+e.k+'" data-a="rpat" data-t="'+e.t+'" data-x="'+(e.x||'')+'" data-y="'+(e.y||'')+'"><span class="t">'+tTxt(e.t).slice(-11)+'</span>'+esc(e.txt)+'</div>';}).join('')+'</div>';}
function rpSeek(t){if(!G||!G.replay)return;var F=G.rec.fr;RP.t=clamp(t,F[0].t,F[F.length-1].t);replaySeek(RP.t);vDraw(false);rpPanel(false);rpList(false);hudTick(true);}
CHG.rpsl=function(t){rpSeek(+t.value);};
INP.rpsl=function(t){rpSeek(+t.value);};
CHG.rpspd=function(t){RP.spd=+t.value;};
CHG.rpev=function(t){RP.evF=t.value;rpList(true);};
ACT.rpjump=function(b){rpSeek(RP.t+(+b.getAttribute('data-v')));};
ACT.rpat=function(b){var t=+b.getAttribute('data-t'),x=+b.getAttribute('data-x'),y=+b.getAttribute('data-y');rpSeek(t);if(x||y)vCenter(x,y,1.5);};
ACT.rpbt=function(b){var R=btGet(+b.getAttribute('data-v'));if(R){UI.selB=R.id;vCenter((R.bb[0]+R.bb[2])/2,(R.bb[1]+R.bb[3])/2,Math.max(VW.s,0.8));}};
ACT.rpplay=function(){if(!G||!G.replay)return;var F=G.rec.fr;if(!RP.play&&RP.t>=F[F.length-1].t)RP.t=F[0].t;RP.play=!RP.play;RP.last=0;rpPanel(false);if(RP.play)requestAnimationFrame(rpLoop);};
function rpLoop(ts){if(!RP.play||!G||!G.replay||UI.tab!=='replay'){RP.play=false;return;}var dt=RP.last?Math.min(0.25,(ts-RP.last)/1000):0;RP.last=ts;var F=G.rec.fr,t=RP.t+dt*RP.spd;if(t>=F[F.length-1].t){t=F[F.length-1].t;RP.play=false;}
  RP.t=t;replaySeek(t);vDraw(false);if(!RP.pt||ts-RP.pt>400){RP.pt=ts;rpPanel(false);rpList(false);hudTick(true);}if(RP.play)requestAnimationFrame(rpLoop);else rpPanel(false);}
/* 點選地圖：顯示單位資訊 */
function rpClick(x,y,sx,sy){var it=hitAt(sx,sy);if(!it||!it.u){var R=hitBattle(sx,sy);if(R){UI.selB=R.id;vDraw(false);}return;}var u=it.u,sm=strengthOf(u);toast(uName(u)+'：'+(isLeaf(u)?mixName(u):ECH[clamp(u.ech,0,8)][1])+'，兵力 '+pct(sm.f*100)+'、'+(MSN[u.ms]||''));}
