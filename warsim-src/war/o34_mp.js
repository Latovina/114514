/* ===================== 聯機版客戶端：登入、大廳、房間、部署、作戰同步、命令轉送、地圖標示、聊天與情報分享、管理員 =====================
   只在聯機版（由聯機伺服器提供的網頁）載入。進入房間並取得席位後，本頁的作戰狀態改由伺服器送來的快照組成（只有本方看得到的戰場），
   部隊的命令與設定修改送回伺服器執行；離開房間後回到原本的單機作戰。 */
var MPS={tok:'',user:null,srv:null,info:null,ws:null,wsOK:false,retry:0,noRetry:false,lobby:null,inRoom:null,room:null,me:null,view:null,cm:-1,rseq:0,rq:{},chat:[],lchat:[],marks:{0:[],1:[]},localG:null,localSide:0,
  gt:0,running:false,real:0,ivl:500,lastSnap:0,chain:Promise.resolve(),mir:null,ipL:[],mkK:'atk',chOpen:true,chCh:'side',chTab:'chat',replays:null,firstTab:true,unread:0};
var MPMK={atk:['⚔','攻擊這裡','#C62828'],def:['⛨','防禦這裡','#1565C0'],sup:['✚','需要支援','#EF6C00'],obs:['👁','注意這裡','#6A1B9A'],txt:['✎','','#37474F']};
function mpActive(){return !!(G&&G.mp&&MPS.view!==null&&MPS.view!==undefined);}
function mpHost(){return !!(MPS.me&&MPS.me.host);}
function mpEsc(s){return esc(String(s===undefined||s===null?'':s));}
(function(){var st=document.createElement('style');st.textContent=
  '.lw-mpchat{position:fixed;left:8px;bottom:8px;width:310px;max-width:calc(100vw - 16px);background:rgba(255,255,255,.97);border:1px solid #c9c5bb;border-radius:10px;box-shadow:0 4px 18px rgba(0,0,0,.18);z-index:60;font-size:12.5px;display:flex;flex-direction:column;}'+
  '.lw-mpchat.min{width:auto;}.lw-mpchat .hd{display:flex;align-items:center;gap:4px;padding:4px 6px;border-bottom:1px solid #e3e0d8;cursor:default;}.lw-mpchat .hd b{flex:1;font-size:12.5px;}'+
  '.lw-mpchat .ls{max-height:190px;overflow:auto;padding:4px 8px;}.lw-mpchat .ls div{margin:2px 0;overflow-wrap:anywhere;}.lw-mpchat .ls .sys{color:#777;}.lw-mpchat .ls .sd{color:#1b5e20;}'+
  '.lw-mpchat .in{display:flex;gap:4px;padding:5px 6px;border-top:1px solid #eee;}.lw-mpchat .in input{flex:1;min-width:0;}.lw-mpchat .mk{display:flex;flex-wrap:wrap;gap:3px;padding:4px 6px;border-top:1px solid #eee;}'+
  '.lw-mpchat button{font-size:12px;padding:2px 6px;border:1px solid #aaa;border-radius:5px;background:#fff;cursor:pointer;}.lw-mpchat button.on{background:#1f2a36;color:#fff;border-color:#1f2a36;}'+
  '.lw-mpdot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px;vertical-align:middle;}.lw-mpbar{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;margin-left:6px;}'+
  '.lw-mpsl td{vertical-align:middle;}.lw-mpbig{font-size:15px;font-weight:600;}.lw-mpch{max-height:260px;overflow:auto;border:1px solid #eee;border-radius:6px;padding:4px 8px;margin:6px 0;font-size:12.5px;background:#fcfcfa;}'+
  '.lw-mpch div{margin:2px 0;overflow-wrap:anywhere;}.lw-mplink{color:#1565C0;cursor:pointer;text-decoration:underline;}';document.head.appendChild(st);})();
/* ---------- 一、連線 ---------- */
function mpTokSave(t){MPS.tok=t||'';try{if(t)localStorage.setItem('lato-mp-token',t);else localStorage.removeItem('lato-mp-token');}catch(e){}}
/* 玩家頭像：有上傳就顯示圖片，否則顯示名字第一個字的彩色圓形 */
function mpAvHtml(uid,av,name,px){px=px||20;var st='width:'+px+'px;height:'+px+'px;border-radius:50%;vertical-align:middle;display:inline-block;flex:none;';
  if(uid&&av)return '<img class="lw-av" src="/avatar/'+(+uid)+'?v='+(+av)+'" alt="" loading="lazy" style="'+st+'object-fit:cover;background:#ddd">';
  var n=String(name||'?'),h=0;for(var i=0;i<n.length;i++)h=(h*31+n.charCodeAt(i))>>>0;return '<span class="lw-av" style="'+st+'background:hsl('+(h%360)+',42%,50%);color:#fff;font-size:'+Math.round(px*0.55)+'px;line-height:'+px+'px;text-align:center;font-weight:600">'+mpEsc(n.charAt(0))+'</span>';}
/* 把圖片置中裁成正方形、縮成 px×px 的 PNG */
function mpAvSquare(src,px){return new Promise(function(ok,no){var img=new Image(),url=typeof src==='string'?src:URL.createObjectURL(src);img.onload=function(){var w=img.naturalWidth||px,h=img.naturalHeight||px,s=Math.min(w,h),c=document.createElement('canvas');c.width=c.height=px;var g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(img,(w-s)/2,(h-s)/2,s,s,0,0,px,px);if(typeof src!=='string')URL.revokeObjectURL(url);c.toBlob(function(b){b?ok(b):no(new Error('無法處理圖片'));},'image/png');};
  img.onerror=function(){if(typeof src!=='string')URL.revokeObjectURL(url);no(new Error('無法讀取圖片'));};img.src=url;});}
function mpAvUpload(blob){return fetch('/api/avatar',{method:'POST',headers:{'Content-Type':blob.type||'image/png',Authorization:'Bearer '+MPS.tok},body:blob}).then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok)throw new Error(j.err||'HTTP '+r.status);if(MPS.user)MPS.user.av=j.av;mpRefresh();return j;});});}
CHG.mpavf=function(t){var f=t.files&&t.files[0];t.value='';if(!f)return;if(!/^image\/(png|jpeg|gif|webp)$/.test(f.type)){toast('請選擇 PNG、JPEG、GIF 或 WebP 圖片。',4000);return;}mpAvSquare(f,128).then(mpAvUpload).then(function(){toast('頭像已更新。');}).catch(function(e){toast('無法更換頭像：'+e.message,4500);});};
ACT.mpavdel=function(){if(!confirm('移除頭像？'))return;mpApi('/api/avatar/del',{}).then(function(){if(MPS.user)MPS.user.av=0;toast('已移除頭像。');mpRefresh();}).catch(function(e){toast(e.message,4500);});};
function mpApi(path,body){return fetch(path,{method:body?'POST':'GET',headers:Object.assign({'Content-Type':'application/json'},MPS.tok?{Authorization:'Bearer '+MPS.tok}:{}),body:body?JSON.stringify(body):undefined}).then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok)throw new Error(j&&j.err||('HTTP '+r.status));return j;});});}
function mpConnect(){if(!MPS.tok)return;MPS.noRetry=false;try{if(MPS.ws){MPS.ws.onclose=null;MPS.ws.close();}}catch(e){}
  var ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws?token='+encodeURIComponent(MPS.tok));ws.binaryType='arraybuffer';MPS.ws=ws;
  ws.onopen=function(){MPS.wsOK=true;MPS.retry=0;mpBarSync();};
  ws.onclose=function(){MPS.wsOK=false;mpBarSync();if(MPS.tok&&!MPS.noRetry){MPS.retry=Math.min(MPS.retry+1,7);setTimeout(function(){if(!MPS.wsOK&&MPS.tok&&!MPS.noRetry)mpConnect();},700*Math.pow(1.6,MPS.retry));}};
  ws.onmessage=function(ev){if(typeof ev.data==='string'){var o;try{o=JSON.parse(ev.data);}catch(e){return;}try{mpOn(o);}catch(e){console.error('聯機訊息',o&&o.t,e);}return;}
    var u8=new Uint8Array(ev.data),kind=u8[0],body=u8.subarray(1);MPS.chain=MPS.chain.then(function(){return mpInflate(body);}).then(function(t){return mpSnap(kind,JSON.parse(t));}).catch(function(e){console.error('聯機快照',e);if(kind===2)mpSend({t:'resync'});});};}
function mpSend(o){if(MPS.ws&&MPS.ws.readyState===1){MPS.ws.send(JSON.stringify(o));return true;}toast('尚未連上伺服器。');return false;}
async function mpSendBig(o){var s=JSON.stringify(o);if(s.length<300000||typeof CompressionStream==='undefined')return mpSend(o);if(!(MPS.ws&&MPS.ws.readyState===1)){toast('尚未連上伺服器。');return false;}
  var cs=new CompressionStream('gzip'),w=cs.writable.getWriter();w.write(new TextEncoder().encode(s));w.close();var buf=new Uint8Array(await new Response(cs.readable).arrayBuffer()),out=new Uint8Array(buf.length+1);out[0]=1;out.set(buf,1);MPS.ws.send(out);return true;}
function mpInflate(u8){var ds=new DecompressionStream('deflate-raw'),w=ds.writable.getWriter();w.write(u8);w.close();return new Response(ds.readable).text();}
function mpReq(t,o){var id=++MPS.rseq;o=Object.assign({t:t,id:id},o||{});return new Promise(function(ok){MPS.rq[id]=ok;var sent=t==='orb'?mpSendBig(o):mpSend(o);Promise.resolve(sent).then(function(s){if(!s){delete MPS.rq[id];ok({err:'未連線'});}});setTimeout(function(){if(MPS.rq[id]){delete MPS.rq[id];ok({err:'伺服器沒有回應'});}},60000);});}
function mpRes(r){if(!r)return;if(r.err){toast(r.err,4500);return;}var v=r.val;if(v&&v.err)toast(v.err,4500);else if(v&&v.msg)toast(v.msg,3500);else if(r.msg)toast(r.msg,3500);}
/* ---------- 二、伺服器訊息 ---------- */
function mpOn(o){switch(o.t){
  case 'me':if(o.user){MPS.user=o.user;mpRefresh();}break;
  case 'hello':MPS.user=o.user;MPS.srv=o.srv;if(MPS.inRoom)mpSend({t:'join',id:MPS.inRoom,pass:MPS.rpass||''});else if(MPS.joinHash){var jh=MPS.joinHash;MPS.joinHash='';try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}mpSend({t:'join',id:jh,pass:''});}mpRefresh();break;
  case 'auth':if(o.err){toast(o.err,5000);MPS.noRetry=true;mpTokSave('');MPS.user=null;mpRefresh();}break;
  case 'lobby':MPS.lobby=o;if(!MPS.inRoom)mpRefresh();break;
  case 'joined':MPS.inRoom=o.id;MPS.chat=o.chat||[];MPS.marks={0:[],1:[]};if(UI.tab!=='online')show('online');else mpRefresh();break;
  case 'room':{var old=MPS.room;MPS.room=o.room;MPS.me=o.me;if(o.room&&o.room.cfg)UI.speed=o.room.cfg.speed;MPS.running=!!(o.room.run&&o.room.run.on);if(mpActive()&&UI.run!==MPS.running){UI.run=MPS.running;barRender();}
    if(old&&old.phase!==o.room.phase&&o.room.phase==='run'&&mpActive()){toast(old.phase==='over'?'作戰時限已延長，作戰繼續（暫停中）。':'作戰開始！',old.phase==='over'?5000:3000);if(UI.tab==='deploy'||UI.tab==='online')show('battle');}
    if(o.room.phase==='setup'&&mpActive()){mpExit(true);}mpBarSync();if(UI.tab==='online')mpRefresh();else if(UI.tab==='deploy'&&mpActive())mpDepCard();mpChatRender();break;}
  case 'view':if(o.view===null&&mpActive())mpExit(false);break;
  case 'chat':{var x={ch:o.ch,from:o.from,uid:o.uid,av:o.av,txt:o.txt,time:o.time,att:o.att,side:o.side};if(o.ch==='lobby'){MPS.lchat.push(x);if(MPS.lchat.length>200)MPS.lchat.shift();}else{MPS.chat.push(x);if(MPS.chat.length>300)MPS.chat.shift();if(!MPS.chOpen)MPS.unread++;}mpChatRender();if(UI.tab==='online')mpChatList();break;}
  case 'marks':MPS.marks[o.side]=o.list||[];if(mpActive()){UI.dirty=true;}mpChatRender();break;
  case 'tick':MPS.gt=o.gt;MPS.running=!!o.running;MPS.real=o.real||0;if(mpActive()){UI.realSp=MPS.real;if(UI.run!==MPS.running){UI.run=MPS.running;barRender();}}var tk=root.querySelector('[data-k="mpgt"]');if(tk)tk.textContent=mpClock();mpDurTick();break;
  case 'res':{var f=MPS.rq[o.id];if(f){delete MPS.rq[o.id];f(o.r||{});}break;}
  case 'err':toast(o.msg,4500);if(o.need==='pass'&&o.id){var pw=prompt('這個房間需要密碼：');if(pw!==null){MPS.rpass=pw;mpSend({t:'join',id:o.id,pass:pw});}else if(MPS.inRoom===o.id){MPS.inRoom=null;mpRefresh();}}else if(/房間不存在/.test(o.msg)&&MPS.inRoom){MPS.inRoom=null;MPS.room=null;if(mpActive())mpExit(true);else mpRefresh();}break;
  case 'kicked':toast(o.msg||'你離開了房間。',4500);MPS.inRoom=null;MPS.room=null;MPS.me=null;if(mpActive())mpExit(true);else mpRefresh();break;
  case 'toast':toast(o.msg);break;}}
function mpClock(){var g=MPS.gt||0;return durTxt(g)+(MPS.running?'（進行中 ×'+fmt(MPS.real||0)+'）':'（暫停）');}
/* ---------- 三、快照：完整內容建立作戰狀態，差異套用到目前狀態 ---------- */
async function mpSnap(kind,D){if(kind===1){var first=!mpActive(),pv=MPS.view,ps=UI.sel.slice();if(first){MPS.localG=G;MPS.localSide=UI.side;}mpCheckLocal();await mpLoadFull(D);G.mp=1;G.onPause=function(){};G.onLog=function(){UI.logDirty=true;};
    MPS.overSeen=G.over?1:0;MPS.view=D.side;MPS.cm=D.cm===undefined?-1:D.cm;UI.side=D.side;UI.sel=[];UI.selC=0;UI.run=MPS.running;UI.tool='sel';UI.ord=null;resetCaches();VW.fit=false;VW.img=null;MPS.ipL=[];mpMirror();MPS.lastSnap=performance.now();
    /* 同一席位重新取得完整快照（例如開戰時）：保留選取的部隊 */if(!first&&pv===D.side&&ps.length)UI.sel=ps.filter(function(id){var u=uById(id);return u&&alive(u)&&(D.side<0||u.side===D.side);});
    barRender();tabsRender();var tab=UI.tab;if(first||!/^(battle|logi|rep|deploy|online|help|set|replay)$/.test(tab))tab=G.started?'battle':'deploy';if(tab==='online'&&first)tab=G.started?'battle':'deploy';if(!G.started&&/^(battle|logi|rep)$/.test(tab))tab='deploy';show(tab);mpChatRender();return;}
  if(!mpActive())return;mpCheckLocal();var P=mpPosSave(),R=mpApply(D,MPS.view<0?0:MPS.view);if(R.add){reix();G._pv=(G._pv||0)+1;}mpCliDerive();
  if(R.map){var MP=G.map,GW=MP.GW;R.ly.forEach(function(q){var x0=q[1]*MPBS,y0=q[2]*MPBS,x1=Math.min(GW,x0+MPBS)-1,y1=Math.min(MP.GH,y0+MPBS)-1;(G.dirty=G.dirty||[]).push([y0*GW+x0,y1*GW+x1]);});try{invalidatePF();}catch(e){}G._mapv=(G._mapv||0)+1;}
  if(D.fe&&typeof FX!=='undefined')mpFxFeed(D.fe);
  mpInterp(P);mpMirror();var now=performance.now();MPS.ivl=clamp(now-MPS.lastSnap,150,1500);MPS.lastSnap=now;UI.dirty=true;UI.stepped=1;if(D.c&&(D.c.ib||D.c.meet||D.c.tx)&&UI.tab==='battle'&&typeof btLeft==='function'&&BT.left==='inbox')btLeft(true);if(D.c&&(D.c.tx||D.c.ib))mpChatRender();
  if(G.over&&!MPS.overSeen){MPS.overSeen=1;barRender();}}
/* 伺服器送來的交戰事件交給特效與音效（敵方部隊用事件附帶的簡要資料代替） */
function mpFxU(br){if(!br)return undefined;var u=br.id?uById(br.id):null;if(u)return u;br._stub=1;return br;}
function mpFxFeed(L){var want=false;try{want=fxWant();}catch(e){}FX.cap=want;if(!want)return;L.forEach(function(e){e.a=mpFxU(e.a);e.b=mpFxU(e.b);if(e.a===undefined)delete e.a;if(e.b===undefined)delete e.b;FX.ev.push(e);});try{fxIngest();}catch(e){if(window.console)console.warn('fx',e);}FX.ev.length=0;}
/* 部隊與車隊位置在兩次快照之間平滑移動 */
function mpPosSave(){var m={};G.units.forEach(function(u){m['u'+u.id]=[u.x,u.y];});(G.lgv||[]).forEach(function(V){m['v'+V.id]=[V.x,V.y];});return m;}
function mpInterp(P){var now=performance.now(),L=[];var f=function(o,k){var p=P[k];if(!p||o.x===undefined)return;var dx=o.x-p[0],dy=o.y-p[1],d=dx*dx+dy*dy;if(d<1||d>25e6){delete o._ip;return;}o._ip=[p[0],p[1],o.x,o.y,now];o.x=p[0];o.y=p[1];L.push(o);};
  G.units.forEach(function(u){f(u,'u'+u.id);});(G.lgv||[]).forEach(function(V){f(V,'v'+V.id);});MPS.ipL=L;}
function mpInterpStep(t){var L=MPS.ipL;if(!L.length)return;var dur=MPS.ivl*1.05,keep=[];L.forEach(function(o){var q=o._ip;if(!q)return;var k=clamp((t-q[4])/dur,0,1);o.x=q[0]+(q[2]-q[0])*k;o.y=q[1]+(q[3]-q[1])*k;if(k>=1){delete o._ip;}else keep.push(o);});MPS.ipL=keep;}
/* 主迴圈：聯機時不推進模擬，只做平滑移動與重畫 */
(function(){var L0=loop;loop=function(ts){if(mpActive()){requestAnimationFrame(loop);var t=performance.now();var mv=MPS.ipL.length>0;mpInterpStep(t);var iv=typeof gfxDrawIv==='function'?gfxDrawIv(1):45;
    if(t-UI.drawT>iv&&(UI.dirty||mv||UI.run)){UI.drawT=t;UI.dirty=false;UI.after(false);}if(t-UI.hudT>300){UI.hudT=t;hudTick();}return;}return L0(ts);};})();
/* 離開聯機作戰：回到原本的單機作戰 */
function mpExit(toOnline){MPS.view=null;MPS.ipL=[];MPS.mir=null;G=MPS.localG||null;MPS.localG=null;UI.side=MPS.localSide||0;UI.sel=[];UI.selC=0;UI.run=false;UI.tool='sel';UI.ord=null;try{resetCaches();}catch(e){}VW.fit=false;VW.img=null;barRender();tabsRender();show('online');mpChatRender();}
/* ---------- 四、命令轉送：模擬函式改由伺服器執行 ---------- */
function mpRpc(n,a){mpReq('cmd',{fn:n,a:mpEnc(a)}).then(mpRes);}
function mpWrapFn(n,f,ret){return function(){if(!mpActive())return f.apply(this,arguments);var a=Array.prototype.slice.call(arguments);if(MPS.view<0){toast('觀戰中不能下達命令。');return ret?ret(a):{err:'觀戰中'};}mpRpc(n,a);return ret?ret(a):{ok:1,pending:1};};}
issue=mpWrapFn('issue',issue,function(a){var u=a[0];var s=0;try{s=u&&u.st!=='off'?orderDelayEst(u).sec:0;}catch(e){}return {sec:s,pending:1};});
tacSwitch=mpWrapFn('tacSwitch',tacSwitch);postSwitch=mpWrapFn('postSwitch',postSwitch);fmSet=mpWrapFn('fmSet',fmSet);femSet=mpWrapFn('femSet',femSet);
refitReturn=mpWrapFn('refitReturn',refitReturn,function(){return true;});arriveUnit=mpWrapFn('arriveUnit',arriveUnit);
cbDeconStart=mpWrapFn('cbDeconStart',cbDeconStart);cbVax=mpWrapFn('cbVax',cbVax,function(){return {n:'—',pending:1};});cbCylinder=mpWrapFn('cbCylinder',cbCylinder);cbCatapult=mpWrapFn('cbCatapult',cbCatapult);cbRelease=mpWrapFn('cbRelease',cbRelease);
powRaise=mpWrapFn('powRaise',powRaise);powEvac=mpWrapFn('powEvac',powEvac);reparent=mpWrapFn('reparent',reparent,function(){return true;});
reqSend=mpWrapFn('reqSend',reqSend);reqReply=mpWrapFn('reqReply',reqReply);reqDecide=mpWrapFn('reqDecide',reqDecide);tmSend=mpWrapFn('tmSend',tmSend);meetDecide=mpWrapFn('meetDecide',meetDecide);
snkLaunch=mpWrapFn('snkLaunch',snkLaunch);supRouteAdd=mpWrapFn('supRouteAdd',supRouteAdd);cmAssign=mpWrapFn('cmAssign',cmAssign);cmGive=mpWrapFn('cmGive',cmGive);cmTake=mpWrapFn('cmTake',cmTake);cmShare=mpWrapFn('cmShare',cmShare);cmAns=mpWrapFn('cmAns',cmAns);
techUnlock=mpWrapFn('techUnlock',techUnlock,function(a){var c='—';try{c=techCost(a[0],a[1]);}catch(e){}return {c:c,pending:1};});
supCall=mpWrapFn('supCall',supCall,function(){return {pending:1,C:{tons:0,nW:0,n:0,nr:0,na:0}};});
/* 呼叫補給：等伺服器回覆後才顯示結果 */
(function(){var b=ACT.supgo;ACT.supgo=function(){if(!mpActive())return b.apply(this,arguments);var dst=supDst(),u0=uById(Array.isArray(dst)?dst[0]:dst);if(!u0)return;var side=u0.side,T=stplGet(side,SUPD.tpl)||stplOf(side)[0];
  mpReq('cmd',{fn:'supCall',a:mpEnc([side,T,dst,SUPD.m])}).then(function(r){var v=r&&r.val;if(r.err||v&&v.err){toast('無法呼叫：'+(r.err||v.err),4500);return;}var d=UI.supd;UI.supd=null;if(d&&d.isConnected)d.remove();var C=v&&v.C||{};
    toast('已呼叫「'+T.n+'」：約 '+fmt(C.tons||0,(C.tons||0)<10?1:0)+' 噸'+(C.nW?'、武器 '+fmt(C.nW)+' 件':'')+'出發',4500);});};})();
ACT.suprtdel=(function(b){return function(btn){if(!mpActive())return b.apply(this,arguments);var id=+btn.getAttribute('data-v');mpReq('cmd',{fn:'mpSupRouteDel',a:[MPS.view,id]}).then(function(r){mpRes(r);});if(G.sup)G.sup.routes=G.sup.routes.filter(function(q){return q.id!==id;});show('logi');};})(ACT.suprtdel);
/* 增援派遣：整個流程在伺服器上執行 */
(function(){var b=ACT.rfgo;ACT.rfgo=function(btn){if(!mpActive())return b.apply(this,arguments);if(MPS.view<0)return;if(RF.mode!=='edge'&&RF.mode!=='fly'&&!RF.pt){toast('請先在地圖上指定'+(RF.mode==='sea'||RF.mode==='ship'?'灘頭':'降落區')+'。');return;}
  var o=Object.assign({},RF,{side:MPS.view,cm:MPS.cm});mpReq('cmd',{fn:'mpRf',a:[MPS.view,o]}).then(function(r){mpRes(r);});UI.rfd&&UI.rfd.remove();toast('增援請求已送出…');};})();
/* 補給節點設定、「我的指揮」、作戰中改武器 */
(function(){var b=CHG.nd;CHG.nd=function(t){if(!mpActive())return b(t);var i=+t.getAttribute('data-v'),f=t.getAttribute('data-f'),v=+t.value||0;mpReq('cmd',{fn:'mpNode',a:[MPS.view,i,f,v]}).then(function(r){if(r&&(r.err||r.val&&r.val.err))mpRes(r);});};
  var mc=CHG.mycmd;CHG.mycmd=function(t){if(!mpActive())return mc(t);if(MPS.view<0)return;var v=+t.value;mpReq('cmd',{fn:'mpMyCmd',a:[MPS.view,MPS.cm,v]}).then(function(r){mpRes(r);if(!(r.err||r.val&&r.val.err))toast(v===0?'由你指揮全軍。':v<0?'改由 AI 代為指揮（可隨時取回）。':'你現在只指揮「'+uName(uById(v))+'」，其餘由 AI 指揮。');});};
  ['uw','uwdel','uwplus','uwreset'].forEach(function(k){var H=k==='uw'?CHG:ACT,f=H[k];if(!f)return;H[k]=function(x){if(mpActive()){toast('聯機作戰中，部隊的武器請以「呼叫物資」補充或換裝。',4500);if(UI.panelTick)UI.panelTick(true);return;}return f(x);};});})();
/* 不在本頁執行的動作 */
(function(){var as=autoSave;autoSave=function(loud){if(mpActive()){if(loud)toast('聯機作戰的存檔由伺服器保存。');return Promise.resolve();}return as(loud);};})();
/* 玩家只指揮自己席位的部隊；隊友與 AI 的部隊在介面上視為「不歸你指揮」 */
(function(){var b=aiControls;aiControls=function(u){if(u&&mpActive()){if(MPS.view<0)return true;if(u.side!==MPS.view)return true;var L=G.sides[u.side].cm||[];if(L.length>1&&MPS.cm>=0&&!cmMay(u,MPS.cm))return true;if(L.length>1&&MPS.cm>=0&&cmOf(u)!==MPS.cm)return false;}return b(u);};})();
(function(){var b=cmMe;cmMe=function(side){if(mpActive()&&MPS.view===side&&MPS.cm>=0)return [MPS.cm];return b(side);};})();
(function(){var b=aiName;aiName=function(F){if(F&&mpActive()&&F.side===MPS.view){var L=G.sides[F.side].cm||[];if(L.length>1&&MPS.cm>=0){var i=cmOf(F);if(i!==MPS.cm&&L[i]&&!L[i].ai)return '隊友指揮（'+L[i].n+'）';}}return b(F);};})();
/* 勝負傾斜（音樂）：伺服器依真實戰況計算，只送來粗略的數值 */
(function(){if(typeof muTilt!=='function')return;var b=muTilt;muTilt=function(s){if(mpActive()&&MPS.view>=0&&MPCLI.tilt!==null&&MPCLI.tilt!==undefined)return s===MPS.view?MPCLI.tilt:-MPCLI.tilt;return b(s);};})();
/* ---------- 五、設定修改：比較白名單欄位，有變動就送給伺服器 ---------- */
function mpScopeU(){var v=MPS.view;return G.units.filter(function(u){return u.side===v&&(!tmOn(v)||MPS.cm<0||cmMay(u,MPS.cm));});}
function mpMirror(){if(!mpActive()||MPS.view<0){MPS.mir=null;return;}var M={u:{},s:{},c:{},ib:{},dr:''},S=G.sides[MPS.view],f;mpScopeU().forEach(function(u){var o={};for(f in MPWU)o[f]=JSON.stringify(u[f]);M.u[u.id]=o;});
  for(f in MPWS)M.s[f]=JSON.stringify(S[f]);var R=(S.cm||[])[MPS.cm];if(R)for(f in MPWC)M.c[f]=JSON.stringify(R[f]);(G.inbox||[]).forEach(function(m){if(m.side===MPS.view)M.ib[m.id]=m.done||'';});
  M.dr=JSON.stringify((G.draw||[]).filter(function(D){return D.side===MPS.view;}));MPS.mir=M;}
function mpCheckLocal(){if(!mpActive()||MPS.view<0||!MPS.mir)return;var M=MPS.mir,P={},n=0,S=G.sides[MPS.view],f,j;
  mpScopeU().forEach(function(u){var o=M.u[u.id];if(!o)return;for(f in MPWU){j=JSON.stringify(u[f]);if(j!==o[f]){o[f]=j;P.u=P.u||{};P.u[u.id]=P.u[u.id]||{};P.u[u.id][f]=u[f]===undefined?null:u[f];n++;}}});
  for(f in MPWS){j=JSON.stringify(S[f]);if(j!==M.s[f]){M.s[f]=j;(P.s=P.s||{})[f]=S[f]===undefined?null:S[f];n++;}}
  var R=(S.cm||[])[MPS.cm];if(R)for(f in MPWC){j=JSON.stringify(R[f]);if(j!==M.c[f]){M.c[f]=j;(P.c=P.c||{})[f]=R[f];n++;}}
  (G.inbox||[]).forEach(function(m){if(m.side!==MPS.view||M.ib[m.id]===undefined)return;var d=m.done||'';if(d!==M.ib[m.id]){M.ib[m.id]=d;(P.ib=P.ib||{})[m.id]=d;n++;}});
  var dj=JSON.stringify((G.draw||[]).filter(function(D){return D.side===MPS.view;}));if(dj!==M.dr){M.dr=dj;P.dr=JSON.parse(dj);n++;}
  if(n)mpReq('patch',{p:P}).then(function(r){if(r&&r.err)toast(r.err);else if(r&&r.rej&&r.rej.length&&window.console)console.warn('聯機：伺服器未接受的修改',r.rej);});}
['click','change','input'].forEach(function(ev){root.addEventListener(ev,function(){if(mpActive())setTimeout(mpCheckLocal,0);});});
root.addEventListener('pointerup',function(){if(mpActive())setTimeout(mpCheckLocal,30);});
setInterval(function(){if(mpActive())mpCheckLocal();},1000);
/* ---------- 六、頂列、分頁、存檔按鈕 ---------- */
TABS.unshift(['online','聯機']);
(function(){var b=tabsRender;tabsRender=function(){b();var on=UI.tabs&&UI.tabs.querySelector('[data-v="online"]');if(on){on.disabled=false;on.innerHTML='🌐 聯機'+(MPS.unread&&!MPS.chOpen?' <b class="lw-badge">'+MPS.unread+'</b>':'');}
  if(mpActive()){['start','map','orbat'].forEach(function(k){var x=UI.tabs.querySelector('[data-v="'+k+'"]');if(x)x.style.display='none';});var d=UI.tabs.querySelector('[data-v="deploy"]');if(d&&G.started)d.style.display='none';}layoutVar();};})();
(function(){var S0=show;show=function(tab){if(tab==='online'){if(UI.tab!==tab&&UI.onLeave){UI.onLeave();UI.onLeave=null;}UI.tab=tab;UI.onClick=UI.onPlace=UI.onLine=UI.onPaint=UI.onPaintEnd=UI.onDragUnit=UI.onRight=UI.onSel=null;UI.canDrag=null;if(UI.tool!=='sel')UI.tool='sel';tabsRender();UI.body.innerHTML='';PAGES.online(UI.body);mpChatRender();return;}
  if(mpActive()){if(/^(start|map|orbat)$/.test(tab)){toast('聯機作戰中不能使用這個分頁；離開房間後回到單機作戰。');tab=G.started?'battle':'deploy';}if(!G.started&&/^(battle|logi|rep)$/.test(tab))tab='deploy';if(G.started&&tab==='deploy')tab='battle';}
  S0(tab);mpChatRender();};})();
(function(){var b=barRender;barRender=function(){b();if(!UI.bar)return;var mpOn=mpActive();if(mpOn){var v=UI.bar.querySelector('[data-c="view"]');if(v&&!(G.over||MPS.room&&MPS.room.phase==='over'))v.style.display='none';var st=UI.bar.querySelector('[data-a="step"]');if(st)st.style.display='none';var ap=UI.bar.querySelector('[data-a="appop"]');if(ap)ap.style.display='none';}
  var sp=document.createElement('span');sp.className='lw-mpbar';sp.setAttribute('data-k','mpbar');UI.bar.appendChild(sp);mpBarSync();layoutVar();};})();
function mpBarSync(){var el=UI.bar&&UI.bar.querySelector('[data-k="mpbar"]');if(!el)return;var col=MPS.wsOK?'#2e7d32':MPS.tok?'#c62828':'#9e9e9e',R=MPS.room;
  el.innerHTML='<span title="'+(MPS.wsOK?'已連線':'未連線')+'"><span class="lw-mpdot" style="background:'+col+'"></span>'+(MPS.user?mpEsc(MPS.user.name):'未登入')+'</span>'+(R?'<button type="button" class="lw-btn sm" data-a="mpgo" title="回到房間頁">🏠 '+mpEsc(R.name)+'</button>':'')+(R&&(R.scn||mpHost())?'<button type="button" class="lw-btn sm" data-a="mpdurdlg" data-k="mpdurb" title="'+mpDurTip()+'">'+mpDurBtn()+'</button>':'');}
ACT.mpgo=function(){show('online');};
/* 時間控制：聯機時改由房主（或房主允許的玩家）控制伺服器 */
(function(){var tr=toggleRun;toggleRun=function(){if(!mpActive())return tr();if(!G.started)return;var R=MPS.room;if(!R)return;if(!(mpHost()||R.cfg.pause==='all'&&MPS.view>=0)){toast('只有房主可以暫停或繼續。');return;}mpSend({t:'run',on:!MPS.running});};
  var sp=ACT.spd;ACT.spd=function(b){if(!mpActive())return sp(b);if(!mpHost()){toast('只有房主可以調整速度。');return;}mpSend({t:'rcfg',cfg:{speed:+b.getAttribute('data-v')}});};
  var cs=CHG.spd;CHG.spd=function(t){if(!mpActive())return cs(t);if(!mpHost()){toast('只有房主可以調整速度。');barRender();return;}mpSend({t:'rcfg',cfg:{speed:+t.value}});};
  var st=ACT.step;ACT.step=function(){if(!mpActive())return st();toast('聯機作戰由伺服器推進時間。');};
  var sv=ACT.save;ACT.save=function(){if(!mpActive())return sv();mpSaveDlg();};})();
function mpSaveDlg(){var R=MPS.room||{},o='<h3>聯機作戰的檔案</h3><div class="lw-note">作戰進行中由伺服器保存；結束後可下載回放（雙方完整的戰場）與完整存檔（房主）。</div><div class="lw-row">';
  if(R.replay)o+='<a class="lw-btn pri" href="/api/replay/'+R.replay+'?token='+encodeURIComponent(MPS.tok)+'">下載回放</a>';if(R.phase==='over'&&(mpHost()||MPS.user&&MPS.user.admin))o+='<a class="lw-btn" href="/api/save/'+R.id+'?token='+encodeURIComponent(MPS.tok)+'">下載完整存檔</a>';
  o+='<button type="button" class="lw-btn" data-a="x">關閉</button></div>';dlg(o);}
/* ---------- 七、部署分頁：拖曳與放置交給伺服器（限本方部署區） ---------- */
(function(){var pg=PAGES.deploy;PAGES.deploy=function(host){if(!mpActive())return pg(host);DP.side=MPS.view<0?0:MPS.view;if(DP.tool==='obj'||DP.tool==='node')DP.tool='drag';pg(host);
  var ph=host.querySelector('.lw-left .lw-ph');if(ph)ph.innerHTML='<b style="padding:2px 4px">'+mpEsc(G.sides[DP.side].name)+'</b><span class="lw-note" style="margin:0 6px">只看得到本方</span>';mpDepCard();};})();
function mpDepCard(){var el=UI.body&&UI.body.querySelector('[data-k="dpside"]');if(!el||!mpActive())return;el.querySelectorAll('[data-a="dptool"][data-v="obj"],[data-a="dptool"][data-v="node"]').forEach(function(b){b.style.display='none';});
  var cards=el.querySelectorAll('.lw-card');cards.forEach(function(c){var h=c.querySelector('h3');if(h&&(h.textContent==='目標點'||h.textContent==='開戰'))c.remove();});
  el.querySelectorAll('.lw-mpdep').forEach(function(c){c.remove();});var R=MPS.room||{},d=document.createElement('div');d.className='lw-card lw-mpdep';var Z=null;try{Z=mpZone(DP.side,R.cfg&&R.cfg.depth);}catch(e){}
  d.innerHTML='<h3>聯機部署</h3><div class="lw-note">只能部署在本方的部署區（地圖上的'+mpEsc(G.sides[DP.side].name)+'色框，'+(Z?Math.round(Z.f*100):40)+'% 縱深）；拖出界外會被拉回。對方看不到你的部署。</div>'+
    '<div class="lw-row"><button type="button" class="lw-btn" data-a="mporb">匯入我的編制檔</button><label><input type="checkbox" data-k="mporbr"> 取代我原有的部隊</label></div>'+
    '<div class="lw-row"><button type="button" class="lw-btn" data-a="mpdurdlg" title="'+mpDurTip()+'">⏱ 作戰時限：'+(mpDurCur()?durH(mpDurCur()):'依想定')+'</button>'+(mpHost()?'':'<span class="lw-note">由房主設定</span>')+'</div>'+(mpHost()?'<div class="lw-row"><button type="button" class="lw-btn pri" data-a="mpbegin">開始作戰</button></div><div class="lw-note">'+mpReadyTxt()+'</div>':'<div class="lw-row"><button type="button" class="lw-btn'+(MPS.me&&mpMeReady()?' pri':'')+'" data-a="mpready">'+(mpMeReady()?'✓ 已準備好':'準備完成')+'</button></div>');el.appendChild(d);}
function mpMeReady(){var R=MPS.room,u=MPS.user;if(!R||!u)return false;var m=R.mem.filter(function(x){return x.uid===u.id;})[0];return !!(m&&m.ready);}
function mpReadyTxt(){var R=MPS.room;if(!R)return '';var P=R.mem.filter(function(m){return m.side>=0;});return P.length?'玩家準備狀態：'+P.map(function(m){return mpEsc(m.name)+(m.ready?' ✓':' …');}).join('、'):'目前沒有玩家坐上席位。';}
ACT.mpready=function(){mpSend({t:'ready',v:!mpMeReady()});};ACT.mpbegin=function(){mpSend({t:'begin'});};
ACT.mporb=function(){var inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';inp.onchange=function(){var f=inp.files[0];if(!f)return;f.text().then(function(s){var D=JSON.parse(s),rp=!!(root.querySelector('[data-k="mporbr"]')||{}).checked;toast('上傳編制中…');return mpReq('orb',{data:D,replace:rp});}).then(function(r){mpRes(r);if(r&&r.warn&&r.warn.length)toast('注意：'+r.warn.slice(0,3).join('；'),6000);}).catch(function(e){toast('無法讀取：'+e.message);});};inp.click();};
(function(){var dd=dpDrag;dpDrag=function(it,x,y,end){if(!mpActive())return dd(it,x,y,end);if(!end)return dd(it,x,y,end);var u=it.u,dx=x-it.x,dy=y-it.y;dd(it,x,y,end);mpReq('dep',{op:'move',a:{id:u.id,dx:dx,dy:dy}}).then(function(r){if(r&&r.err)toast(r.err);});};
  var dp=dpPlace;dpPlace=function(x,y,hd){if(!mpActive())return dp(x,y,hd);var u=uById(DP.placeId);if(!u){toast('請先在左側選取要放置的編制。');return;}dp(x,y,hd);mpReq('dep',{op:'place',a:{id:u.id,x:x,y:y,hd:hd}}).then(function(r){mpRes(r);});};
  var dr=ACT.dprot;ACT.dprot=function(b){if(!mpActive())return dr(b);dr(b);mpReq('dep',{op:'rot',a:{id:DP.placeId,dir:+b.getAttribute('data-v')}}).then(function(r){if(r&&r.err)toast(r.err);});};
  var da=ACT.dpauto;ACT.dpauto=function(){if(!mpActive())return da();mpReq('dep',{op:'auto'}).then(function(r){mpRes(r);});};
  var bg=ACT.begin;ACT.begin=function(){if(!mpActive())return bg();if(mpHost())mpSend({t:'begin'});else ACT.mpready();};
  var dc=dpClick;dpClick=function(x,y,sx,sy){if(mpActive()&&(DP.tool==='obj'||DP.tool==='node')){toast('目標點與補給節點由想定決定。');return;}return dc(x,y,sx,sy);};})();
/* ---------- 八、地圖：部署區、玩家標示 ---------- */
(function(){var b=drawScale;drawScale=function(c){if(mpActive())try{mpDrawOverlay(c);}catch(e){}return b(c);};})();
function mpDrawOverlay(c){var R=MPS.room;if(!G.started&&MPS.view>=0&&R){var Z=mpZone(MPS.view,R.cfg.depth),p0=w2s(Z.x0,Z.y0),p1=w2s(Z.x1,Z.y1);c.save();c.strokeStyle=sideCol(MPS.view);c.lineWidth=3;c.setLineDash([10,6]);c.strokeRect(p0[0],p0[1],p1[0]-p0[0],p1[1]-p0[1]);c.fillStyle=sideCol(MPS.view);c.globalAlpha=0.07;c.fillRect(p0[0],p0[1],p1[0]-p0[0],p1[1]-p0[1]);c.restore();}
  var sides=MPS.view<0?SIDES():[MPS.view];c.save();sides.forEach(function(s){(MPS.marks[s]||[]).forEach(function(m){var p=w2s(m.x,m.y),K=MPMK[m.k]||MPMK.txt;if(p[0]<-60||p[1]<-60||p[0]>VW.cw+60||p[1]>VW.ch+60)return;
    c.beginPath();c.arc(p[0],p[1],13,0,PI*2);c.fillStyle='rgba(255,255,255,.92)';c.fill();c.lineWidth=3;c.strokeStyle=K[2];c.stroke();c.font='bold 14px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle=K[2];c.fillText(K[0],p[0],p[1]+1);
    c.textAlign='left';txtHalo(c,(m.txt||K[1])+'（'+m.by+'）',p[0]+17,p[1],'bold 12px sans-serif',K[2]);});});c.restore();}
(function(){var b=btClick;btClick=function(x,y,sx,sy,e){if(mpActive()&&UI.tool==='mpmk'){var txt='';if(MPS.mkK==='txt'){txt=prompt('標示文字（最多 60 字）','');if(!txt){setTool('sel');return;}}mpSend({t:'mark',op:'add',m:{k:MPS.mkK,x:x,y:y,txt:txt||''}});setTool('sel');return;}return b(x,y,sx,sy,e);};
  var mb=modeBt;modeBt=function(){if(mpActive()&&UI.tool==='mpmk'&&VW.mode){var K=MPMK[MPS.mkK];VW.mode.hidden=false;VW.mode.innerHTML='點地圖放置標示「'+K[0]+' '+(K[1]||'自訂文字')+'」（隊友都看得到）<button type="button" data-a="ordx">取消</button>';return;}return mb();};})();
ACT.mpmk=function(b){if(!mpActive()||MPS.view<0)return;if(UI.tab!=='battle'&&UI.tab!=='deploy'){show(G.started?'battle':'deploy');}MPS.mkK=b.getAttribute('data-v');setTool('mpmk');};
ACT.mpmkdel=function(b){mpSend({t:'mark',op:'del',id:+b.getAttribute('data-v')});};
ACT.mpmkgo=function(b){var q=b.getAttribute('data-v').split(',');if(mpActive())vCenter(+q[0],+q[1],Math.max(VW.s,1.5));};
/* ---------- 九、聊天與情報分享（地圖畫面左下角） ---------- */
function mpChatEl(){var el=root.querySelector('.lw-mpchat');if(!el){el=document.createElement('div');el.className='lw-mpchat';root.appendChild(el);el.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.matches('[data-k="mpcin"]')){e.preventDefault();ACT.mpcsend();}});}return el;}
function mpChatRender(){var show1=!!(MPS.inRoom&&UI.tab!=='online'&&UI.tab!=='help');var el=root.querySelector('.lw-mpchat');if(!show1){if(el)el.remove();return;}el=mpChatEl();
  var me=MPS.view,act=mpActive(),bat=act&&G&&G.started&&!G.over&&me!==null&&me>=0;/* 作戰中：聊天改為無線電、電報與傳令（見「通信」） */if(bat&&MPS.chTab==='chat')MPS.chTab='tx';if(!bat&&MPS.chTab==='tx')MPS.chTab='chat';
  var key=[MPS.chOpen?1:0,MPS.chTab,me!==null&&me>=0?1:0,act?1:0,bat?1:0,bat?[TXS.to,TXS.via,TXS.enc?1:0,TXS.pt?TXS.pt.join(','):'',TXS.rp,txRecips(me).map(function(r){return r[0];}).join(',')].join(';'):''].join('|');
  if(!MPS.chOpen){el.className='lw-mpchat min';el.innerHTML='<div class="hd"><button type="button" data-a="mpctog">'+(bat?'📻 通信':'💬 聊天')+(MPS.unread?'（'+MPS.unread+'）':'')+'</button></div>';el.setAttribute('data-shape',key);return;}MPS.unread=0;
  if(el.getAttribute('data-shape')!==key&&!txTyping(el)){el.className='lw-mpchat';var c0=bat?'tx':'chat',o='<div class="hd"><b>'+(MPS.chTab==='mk'?'標示':bat?'通信':'聊天')+'</b><button type="button" data-a="mpctab" data-v="'+c0+'" class="'+(MPS.chTab===c0?'on':'')+'">'+(bat?'通信':'聊天')+'</button><button type="button" data-a="mpctab" data-v="mk" class="'+(MPS.chTab==='mk'?'on':'')+'">標示</button><button type="button" data-a="mpctog" title="縮小">－</button></div>';
    if(MPS.chTab==='tx')o+='<div class="ls"></div>'+txComposeHtml('box');
    else if(MPS.chTab==='chat'){o+='<div class="ls"></div><div class="in"><select data-k="mpcch" data-c="mpcch">'+(me!==null&&me>=0?'<option value="side"'+(MPS.chCh==='side'?' selected':'')+'>本方</option>':'')+'<option value="room"'+(MPS.chCh==='room'||!(me>=0)?' selected':'')+'>全房間</option></select><input type="text" data-k="mpcin" maxlength="500" placeholder="訊息（Enter 送出）"><button type="button" data-a="mpcsend">送出</button></div>'+
      (me!==null&&me>=0&&act?'<div class="mk"><button type="button" data-a="mpshare" title="把選取的部隊、敵情或地圖中央分享到本方頻道">📍 分享位置</button></div>':'');}
    else o+='<div class="mk">'+Object.keys(MPMK).map(function(k){var K=MPMK[k];return '<button type="button" data-a="mpmk" data-v="'+k+'" style="color:'+K[2]+'" title="點地圖放置">'+K[0]+' '+(K[1]||'文字')+'</button>';}).join('')+'</div><div class="ls"></div>';
    el.innerHTML=o;el.setAttribute('data-shape',key);}
  var ls=el.querySelector('.ls');if(!ls)return;
  if(MPS.chTab==='tx'){var T=txBoxHtml();if(ls._h!==T){ls._h=T;ls.innerHTML=T;}}
  else if(MPS.chTab==='chat'){var L=MPS.chat.slice(-60);ls.innerHTML=L.length?L.map(mpChatLine).join(''):'<div class="sys">還沒有訊息。</div>';}
  else{var M=[];(me<0?SIDES():me>=0?[me]:[]).forEach(function(s){(MPS.marks[s]||[]).forEach(function(m){M.push(m);});});
    ls.innerHTML=M.length?M.slice(-40).reverse().map(function(m){var K=MPMK[m.k]||MPMK.txt;return '<div><span style="color:'+K[2]+'">'+K[0]+'</span> '+mpEsc(m.txt||K[1])+' <span class="sys">'+mpEsc(m.by)+'</span> <button type="button" data-a="mpmkgo" data-v="'+Math.round(m.x)+','+Math.round(m.y)+'">看</button> <button type="button" data-a="mpmkdel" data-v="'+m.id+'">刪除</button></div>';}).join(''):'<div class="sys">還沒有標示。選上面的種類再點地圖。</div>';}
  ls.scrollTop=ls.scrollHeight;}
CHG.mpcch=function(t){MPS.chCh=t.value;};
function mpChatLine(x){var t=new Date(x.time||Date.now()),hh=('0'+t.getHours()).slice(-2)+':'+('0'+t.getMinutes()).slice(-2),cl=x.from==='系統'?'sys':x.ch==='side'?'sd':'';var at='';
  if(x.att&&isFinite(x.att.x)&&isFinite(x.att.y))at=' <span class="lw-mplink" data-a="mpmkgo" data-v="'+Math.round(x.att.x)+','+Math.round(x.att.y)+'">📍'+mpEsc(x.att.n||'位置')+'</span>';
  return '<div class="'+cl+'">'+hh+' '+(x.uid?mpAvHtml(x.uid,x.av,x.from,16)+' ':'')+'<b>'+mpEsc(x.from)+'</b>'+(x.ch==='side'?'〔本方〕':'')+'：'+mpEsc(x.txt)+at+'</div>';}
ACT.mpctog=function(){MPS.chOpen=!MPS.chOpen;mpChatRender();tabsRender();};ACT.mpctab=function(b){MPS.chTab=b.getAttribute('data-v');mpChatRender();};
ACT.mpcsend=function(){var el=root.querySelector('[data-k="mpcin"]'),ch=root.querySelector('[data-k="mpcch"]');if(!el||!el.value.trim())return;MPS.chCh=ch?ch.value:'room';mpSend({t:'chat',ch:MPS.chCh,txt:el.value.trim()});el.value='';};
ACT.mpshare=function(){if(!mpActive())return;if(G.started&&!G.over){ACT.txpt();return;}var att=null,u=UI.sel.length?uById(UI.sel[0]):null,C=UI.selC&&G.ct[MPS.view]?G.ct[MPS.view][UI.selC]:null;
  if(C)att={k:'c',x:C.x,y:C.y,n:'敵情：'+(C.q>=1&&C.name?C.name:'不明部隊')+'（'+durTxt(G.t-C.t)+'前）'};else if(u)att={k:'u',x:u.x,y:u.y,n:uName(u)};else{var c=s2w(VW.cw/2,VW.ch/2);att={k:'pt',x:c[0],y:c[1],n:placeTxt(c[0],c[1])};}
  var el=root.querySelector('[data-k="mpcin"]'),txt=el&&el.value.trim()||(att.k==='c'?'發現敵情':'請注意這裡');if(el)el.value='';mpSend({t:'chat',ch:'side',txt:txt,att:att});};
/* ---------- 十、聯機分頁：登入、大廳、房間 ---------- */
PAGES.online=function(host){host.innerHTML='<div class="lw-main" style="max-width:1100px;margin:0 auto;padding:10px" data-k="mppg"></div>';mpRefresh();};
var MPDEF={force:false};
function mpRefresh(){mpBarSync();if(UI.tab!=='online')return;var el=UI.body.querySelector('[data-k="mppg"]');if(!el)return;var a=document.activeElement;
  /* 正在輸入數字或文字（聊天框除外）時先不重畫，等送出或離開欄位再更新，免得輸入到一半被打斷 */
  if(!MPDEF.force&&a&&el.contains(a)&&a.tagName==='INPUT'&&/^(number|text)$/.test(a.type)&&!/^mp[rl]in$/.test(a.getAttribute('data-k')||'')){if(!a._mpDef){a._mpDef=1;var go=function(){if(!a._mpDef)return;a._mpDef=0;MPDEF.force=true;try{mpRefresh();}finally{MPDEF.force=false;}};a.addEventListener('blur',function(){setTimeout(go,0);});a.addEventListener('change',function(){setTimeout(go,0);});}return;}
  var y=window.scrollY,keep=mpFocusSave(el);el.innerHTML=!MPS.user?mpPgLogin():MPS.inRoom&&MPS.room?mpPgRoom():mpPgLobby();mpFocusLoad(el,keep);window.scrollTo(0,y);mpChatList();}
/* 房間頁常常整頁重畫（成員、席位、想定資訊有變動時）：正在輸入的欄位保留輸入到一半的內容、游標與焦點，不會被清掉 */
function mpFocusKey(a){var k=a.getAttribute('data-k');if(k)return '[data-k="'+k+'"]';var c=a.getAttribute('data-c');if(!c)return null;var f=a.getAttribute('data-f'),v=a.getAttribute('data-v');return '[data-c="'+c+'"]'+(f?'[data-f="'+f+'"]':'')+(v?'[data-v="'+v+'"]':'');}
function mpFocusSave(el){var a=document.activeElement;if(!a||!el.contains(a)||!/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)||a.type==='checkbox'||a.type==='file')return null;var q=mpFocusKey(a);if(!q)return null;var o={q:q,v:a.value,ed:a.tagName!=='SELECT'&&a.value!==a.defaultValue};try{o.s=a.selectionStart;o.e=a.selectionEnd;}catch(e){}return o;}
function mpFocusLoad(el,o){if(!o)return;var n=el.querySelector(o.q);if(!n||n.disabled)return;if(o.ed)n.value=o.v;try{n.focus({preventScroll:true});}catch(e){n.focus();}if(n.tagName==='SELECT')return;if(o.s!==null&&o.s!==undefined){try{n.setSelectionRange(o.s,o.e);}catch(e){}}else{var v=n.value;n.value='';n.value=v;}
  /* 程式填回的內容瀏覽器不當成使用者的修改：按 Enter 或離開欄位時，若瀏覽器沒有送出 change，就替它送出，輸入到一半的值才不會遺失 */
  if(o.ed&&n.type!=='checkbox'&&n.tagName==='INPUT'){n._mpPend=1;var fire=function(){setTimeout(function(){if(n._mpPend&&n.isConnected&&n.value!==n.defaultValue){n._mpPend=0;n.dispatchEvent(new Event('change',{bubbles:true}));}},0);};
    n.addEventListener('change',function(){n._mpPend=0;});n.addEventListener('blur',fire);n.addEventListener('keydown',function(e){if(e.key==='Enter')fire();});}}
function mpPgLogin(){var I=MPS.info||{};return '<div class="lw-card" style="max-width:460px"><h3>登入 '+mpEsc(I.name||'聯機伺服器')+'</h3>'+(I.motd?'<div class="lw-note">'+mpEsc(I.motd)+'</div>':'')+
  '<div class="lw-row"><label>名稱 <input type="text" data-k="mpn" maxlength="20" autocomplete="username"></label></div><div class="lw-row"><label>密碼 <input type="password" data-k="mpp" autocomplete="current-password"></label></div><div class="lw-row"><label>確認密碼 <input type="password" data-k="mpp2" autocomplete="new-password" placeholder="註冊時再輸入一次"></label></div>'+
  (I.invite?'<div class="lw-row"><label>邀請碼（註冊用）<input type="text" data-k="mpi"></label></div>':'')+'<div class="lw-row"><button type="button" class="lw-btn pri" data-a="mplogin">登入</button>'+(I.allowRegister!==false?'<button type="button" class="lw-btn" data-a="mpreg">註冊新帳號</button>':'')+'</div>'+
  '<div class="lw-note">名稱 2–20 字，密碼至少 6 個字元；註冊時「確認密碼」要再輸入一次相同的密碼（登入不需要）。伺服器的第一位註冊者成為管理員。</div></div><div class="lw-card" style="max-width:460px"><h3>單機作戰</h3><div class="lw-note">不登入也可以使用「開始」分頁的完整單機版：自己建立想定、與電腦對戰或觀看電腦對戰。</div></div>';}
function mpPgLobby(){var L=MPS.lobby||{rooms:[],online:[]},u=MPS.user,o='<div class="lw-card"><h3>'+mpEsc(L.srv&&L.srv.name||'聯機大廳')+'<small>'+mpEsc(L.srv&&L.srv.motd||'')+'</small></h3><div class="lw-row">'+mpAvHtml(u.id,u.av,u.name,36)+'<span>你好，<b>'+mpEsc(u.name)+'</b>'+(u.admin?'（管理員）':'')+'</span>'+
  '<label class="lw-btn sm" title="PNG、JPEG、GIF 或 WebP；自動裁成正方形">更換頭像<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" data-c="mpavf" hidden></label>'+(u.av?'<button type="button" class="lw-btn sm" data-a="mpavdel">移除頭像</button>':'')+'<button type="button" class="lw-btn sm" data-a="mppw">修改密碼</button><button type="button" class="lw-btn sm" data-a="mplogout">登出</button>'+(u.admin?'<button type="button" class="lw-btn sm" data-a="mpadmin">管理員面板</button>':'')+'</div></div>';
  o+='<div class="lw-card"><h3>房間<small>'+L.rooms.length+' 個</small></h3>'+(L.rooms.length?'<table class="lw-tbl"><tr><th>房間</th><th>房主</th><th>想定</th><th>狀態</th><th class="n">玩家</th><th class="n">空位</th><th></th></tr>'+L.rooms.map(function(r){return '<tr><td>'+(r.locked?'🔒 ':'')+mpEsc(r.name)+'</td><td>'+mpEsc(r.hostName)+'</td><td>'+(r.scn?mpEsc(r.scn.name)+'<br><span class="lw-note">'+mpEsc(r.scn.sides.join(' 對 '))+'</span>':'—')+'</td><td>'+mpPhaseTxt(r.phase)+(r.t?'<br><span class="lw-note">'+durTxt(r.t)+'</span>':'')+'</td><td class="n">'+r.players+'</td><td class="n">'+r.open+'</td><td><button type="button" class="lw-btn sm pri" data-a="mpjoin" data-v="'+mpEsc(r.id)+'" data-l="'+(r.locked?1:0)+'">加入</button></td></tr>';}).join('')+'</table>':'<div class="lw-note">目前沒有房間。建立一個，邀請朋友加入。</div>')+
    '<div class="lw-row" style="margin-top:10px"><label>房間名稱 <input type="text" data-k="mprn" maxlength="40" placeholder="'+mpEsc(u.name)+' 的房間"></label><label>密碼（選填）<input type="text" data-k="mprp" maxlength="40" style="width:8em"></label><button type="button" class="lw-btn pri" data-a="mpmkroom">建立房間</button></div></div>';
  o+='<div class="lw-card"><h3>大廳聊天<small>線上：'+(L.onl?L.onl.map(function(x){return '<span style="white-space:nowrap">'+mpAvHtml(x.id,x.av,x.name,16)+' '+mpEsc(x.name)+'</span>';}):(L.online||[]).map(mpEsc)).join('、')+'</small></h3><div class="lw-mpch" data-k="mplch"></div><div class="lw-row"><input type="text" data-k="mplin" maxlength="500" style="flex:1" placeholder="訊息"><button type="button" class="lw-btn sm" data-a="mplsend">送出</button></div></div>';
  o+='<div class="lw-card"><h3>回放<small>作戰結束後由伺服器自動錄製</small></h3><div data-k="mprepl">'+mpReplHtml()+'</div><div class="lw-row"><button type="button" class="lw-btn sm" data-a="mprepl">重新整理</button></div></div>';return o;}
function mpPhaseTxt(p){return {setup:'等待想定',deploy:'部署中',run:'作戰中',over:'已結束'}[p]||p;}
function mpReplHtml(){var L=MPS.replays;if(!L)return '<div class="lw-note">按「重新整理」載入回放列表。</div>';if(!L.length)return '<div class="lw-note">還沒有回放。</div>';
  return '<table class="lw-tbl"><tr><th>作戰</th><th>雙方</th><th>結果</th><th class="n">大小</th><th></th></tr>'+L.slice(0,50).map(function(r){return '<tr><td>'+mpEsc(r.name)+'<br><span class="lw-note">'+mpEsc(r.room||'')+'・'+new Date(r.date).toLocaleString()+'</span></td><td>'+mpEsc((r.sides||[]).join(' 對 '))+'</td><td>'+(r.win>=0&&r.sides?mpEsc(r.sides[r.win])+'獲勝':'不分勝負')+'<br><span class="lw-note">'+mpEsc(r.why||'')+'</span></td><td class="n">'+Math.round(r.size/1024)+' KB</td><td><button type="button" class="lw-btn sm" data-a="mprepopen" data-v="'+r.id+'">開啟</button> <a class="lw-btn sm" href="/api/replay/'+r.id+'?token='+encodeURIComponent(MPS.tok)+'">下載</a></td></tr>';}).join('')+'</table>';}
function mpChatList(){var el=UI.body&&UI.body.querySelector('[data-k="mplch"]');if(el){el.innerHTML=MPS.lchat.slice(-80).map(mpChatLine).join('')||'<div class="lw-note">還沒有訊息。</div>';el.scrollTop=el.scrollHeight;}
  var e2=UI.body&&UI.body.querySelector('[data-k="mprch"]');if(e2){e2.innerHTML=MPS.chat.slice(-100).map(mpChatLine).join('')||'<div class="lw-note">還沒有訊息。</div>';e2.scrollTop=e2.scrollHeight;}}
/* 尚未選想定時各方的預設名稱與顏色 */
var MPSN=['藍方','紅方','第三方'],MPSC=['#2B6CD4','#D23B3B','#2E9D57'];
/* 房間設定：三方對戰（建立快速想定時加入第三方；開場關係、兵力、編成仿照哪一方） */
function mpTriHtml(C,dis){var T=typeof TRIREL!=='undefined'?TRIREL:{neu:[0,0,'與兩軍中立']},Z=typeof TRISZ!=='undefined'?TRISZ:{m:[0,'約一半']},sel=function(f,opts){return '<select data-c="mpcf" data-f="'+f+'"'+dis+'>'+opts.map(function(q){return '<option value="'+q[0]+'"'+(C[f]===q[0]?' selected':'')+'>'+mpEsc(q[1])+'</option>';}).join('')+'</select>';};
  return '<div class="lw-row"><label><input type="checkbox" data-c="mpcf" data-f="tri"'+(C.tri?' checked':'')+dis+'> 三方對戰（第三方由玩家或電腦扮演）</label>'+(C.tri?'<label>開場 '+sel('triRel',Object.keys(T).map(function(k){return [k,T[k][2]];}))+'</label><label>第三方兵力 '+sel('triSz',Object.keys(Z).map(function(k){return [k,Z[k][1]];}))+'</label><label>編成仿照 '+sel('triSrc',[['A','藍方'],['B','紅方']])+'</label>':'')+'</div>'+
    (C.tri?'<div class="lw-note">建立快速想定時加入第三方，開場預設與兩軍中立：互不開火，之後由各方指揮官在「外交」宣戰、停火或結盟。每一方的指揮官人數照上面設定（例如三方各 3 位就是 3 對 3 對 3）。上傳的存檔若已有三方，直接沿用。</div>':'');}
function mpPgRoom(){var R=MPS.room,me=MPS.me||{},H=mpHost(),u=MPS.user,S=R.scn,o='';
  o+='<div class="lw-card"><h3>🏠 '+mpEsc(R.name)+'<small>'+mpPhaseTxt(R.phase)+'・房主 '+mpEsc(R.hostName)+(R.locked?'・🔒':'')+'</small></h3><div class="lw-row">'+(mpActive()?'<button type="button" class="lw-btn pri" data-a="tab" data-v="'+(G.started?'battle':'deploy')+'">前往'+(G.started?'作戰':'部署')+'畫面</button>':'')+
    '<button type="button" class="lw-btn" data-a="mpinv" title="把這個連結傳給朋友，登入後會直接進入這個房間">🔗 複製邀請連結</button><button type="button" class="lw-btn" data-a="mpleave">離開房間</button>'+(R.phase==='run'?'<span class="lw-mpbig" data-k="mpgt">'+mpClock()+'</span>':'')+'</div></div>';
  /* 想定 */
  o+='<div class="lw-card"><h3>想定</h3>'+(S?'<div class="lw-kv"><span>名稱</span><span>'+mpEsc(S.name)+'</span><span>年代</span><span>'+mpEsc(S.year)+' 年，開戰 '+(S.start?S.start.m+'/'+S.start.d+' '+S.start.h+' 時':'')+'</span><span>地圖</span><span>'+S.W+' × '+S.H+' 公里</span>'+(S.dur?'<span>作戰時限</span><span>'+S.dur+' 小時</span>':'')+
    S.sides.map(function(s){return '<span><span class="lw-sw" style="background:'+s.color+'"></span> '+mpEsc(s.name)+'</span><span>'+s.units+' 個單位，部隊點數 '+fmt(s.pts)+'（由'+({W:'西',E:'東',N:'北',S:'南'}[s.edge]||s.edge)+'側進入）</span>';}).join('')+'</div>':'<div class="lw-note">房主尚未選擇想定。</div>');
  if(H&&R.phase!=='run'){o+='<div class="lw-row" style="margin-top:8px"><button type="button" class="lw-btn" data-a="mpscnf">上傳存檔（.latowarsim.json）</button>'+(MPS.localG&&MPS.localG.map||!mpActive()&&G&&G.map&&!G.mp?'<button type="button" class="lw-btn" data-a="mpscnl">使用單機版目前的作戰</button>':'')+'</div>'+
    '<div class="lw-row"><label>快速想定 <select data-k="mpq">'+SCN.map(function(s){return '<option value="'+s.k+'">'+mpEsc(s.n)+'</option>';}).join('')+'</select></label><button type="button" class="lw-btn" data-a="mpquick">建立</button></div>'+
    '<div class="lw-note">建議在單機版的「開始」「地圖編修」「兵力編成」「部署」準備好雙方，再上傳或直接使用；玩家也可以在部署階段匯入自己的編制檔。上傳後雙方都只看得到自己的部隊。</div>';}
  o+='</div>';
  /* 席位 */
  if(R.slots){o+='<div class="lw-card"><h3>席位<small>每一方 1–8 位指揮官，全房間最多 12 位玩家（例如多人合作對抗電腦、4 對 4 或 3 對 3 對 3）</small></h3><table class="lw-tbl lw-mpsl"><tr><th>陣營</th><th>指揮官</th><th>由誰指揮</th><th></th></tr>';
    R.slots.forEach(function(L,s){var sn=S?S.sides[s]:null;L.forEach(function(sl,i){var cmN=sn&&sn.cm[i]?sn.cm[i].n:(i+1)+' 號指揮官',mine=sl.uid&&u&&sl.uid===u.id,who=sl.kind==='ai'?'🤖 電腦':sl.uid?mpAvHtml(sl.uid,(R.mem.filter(function(m){return m.uid===sl.uid;})[0]||{}).av,sl.name,20)+' '+mpEsc(sl.name)+(sl.auto?'（斷線，AI 暫代）':'')+(R.mem.some(function(m){return m.uid===sl.uid&&m.ready;})?' ✓':''):'（空位'+(R.cfg.aiFill?'，開戰時由電腦補上':'')+'）';
      o+='<tr><td>'+(i===0?'<span class="lw-sw" style="background:'+(sn?sn.color:MPSC[s]||'#888')+'"></span> '+mpEsc(sn?sn.name:(MPSN[s]||'第'+(s+1)+'方')):'')+'</td><td>'+mpEsc(cmN)+(sn&&sn.cm[i]?'<span class="lw-note">（'+sn.cm[i].roots+' 個編制）</span>':'')+'</td><td>'+who+'</td><td>'+
        (sl.kind==='open'&&!sl.uid?'<button type="button" class="lw-btn sm pri" data-a="mptake" data-v="'+s+','+i+'">坐這裡</button>':'')+(mine&&R.phase!=='run'?'<button type="button" class="lw-btn sm" data-a="mpuntake">離開席位</button>':'')+
        (H&&R.phase!=='over'?' <select data-c="mpslk" data-v="'+s+','+i+'"><option value="open"'+(sl.kind==='open'?' selected':'')+'>玩家</option><option value="ai"'+(sl.kind==='ai'?' selected':'')+'>電腦</option></select>':'')+'</td></tr>';});});
    o+='</table><div class="lw-row">'+(R.cfg.spect||R.phase==='over'?'<button type="button" class="lw-btn sm" data-a="mpspec">'+(me.spec?'停止觀戰':'觀戰（上帝視角）')+'</button>':'')+(me.side>=0&&R.phase==='deploy'?'<button type="button" class="lw-btn sm'+(mpMeReady()?' pri':'')+'" data-a="mpready">'+(mpMeReady()?'✓ 已準備好':'準備完成')+'</button>':'')+'</div>';
    if(R.phase==='deploy'&&me.side>=0)o+='<div class="lw-row"><button type="button" class="lw-btn" data-a="mporb">匯入我的編制檔</button><label><input type="checkbox" data-k="mporbr"> 取代我原有的部隊</label><button type="button" class="lw-btn" data-a="dpauto">自動部署我的部隊</button></div><div class="lw-note">編制檔由單機版「兵力編成」匯出（.latoorbat.json）。匯入的部隊歸你指揮，自動部署在本方部署區，再到「部署」分頁調整。</div>';
    if(H&&R.phase==='deploy')o+='<div class="lw-row"><button type="button" class="lw-btn pri" data-a="mpbegin">開始作戰</button><span class="lw-note">'+mpReadyTxt()+'</span></div>';o+='</div>';}
  /* 作戰控制、結果 */
  if(R.phase==='run'){o+='<div class="lw-card"><h3>作戰進行中</h3><div class="lw-row"><span>作戰時限 '+(mpDurCur()?durH(mpDurCur()):'依想定')+'</span><button type="button" class="lw-btn sm" data-a="mpdurdlg">'+(H?'⏱ 調整時限':'⏱ 時限')+'</button></div><div class="lw-row">'+(H||R.cfg.pause==='all'&&me.side>=0?'<button type="button" class="lw-btn pri" data-a="mprun">'+(R.run.on?'⏸ 暫停':'▶ 繼續')+'</button>':'<span>'+(R.run.on?'進行中':'暫停中')+'</span>')+
    (H?'<label>速度 <select data-c="mpspd">'+SPEEDS.map(function(v){return '<option value="'+v+'"'+(R.cfg.speed===v?' selected':'')+'>每秒 '+durTxt(v)+'</option>';}).join('')+'</select></label><button type="button" class="lw-btn dng" data-a="mpend">結束作戰</button>':'<span class="lw-note">速度：每秒 '+durTxt(R.cfg.speed)+'</span>')+'</div></div>';}
  if(R.phase==='over'){var ov=R.over||{};o+='<div class="lw-card"><h3>作戰結束</h3><div class="lw-mpbig">'+mpEsc(ov.why||'')+'：'+(ov.win>=0&&S?mpEsc(S.sides[ov.win].name)+'獲勝':'不分勝負')+'</div>'+(ov.rank&&S?'<div class="lw-note">名次：'+ov.rank.map(function(i,k){return (k+1)+'. '+mpEsc(S.sides[i]?S.sides[i].name:'')+(ov.score&&ov.score[i]!==undefined?'（'+ov.score[i]+' 分）':'');}).join('、')+'</div>':'')+'<div class="lw-note">戰場已全面揭曉：可在「作戰」「戰報」查看雙方完整的部署與損失。'+(ov.why==='時間到'?(H?'作戰是因時限結束的：按「延長時限」可以讓作戰繼續（戰場回到雙盲）。':'作戰是因時限結束的，房主可以延長時限讓作戰繼續。'):'')+'</div><div class="lw-row">'+(H&&ov.why==='時間到'?'<button type="button" class="lw-btn pri" data-a="mpdurx">延長時限，繼續作戰</button>':'')+
    (R.replay?'<a class="lw-btn pri" href="/api/replay/'+R.replay+'?token='+encodeURIComponent(MPS.tok)+'">下載回放</a><button type="button" class="lw-btn" data-a="mprepopen" data-v="'+R.replay+'">在回放分頁開啟</button>':'<span class="lw-note">回放整理中…</span>')+(H||u&&u.admin?'<a class="lw-btn" href="/api/save/'+R.id+'?token='+encodeURIComponent(MPS.tok)+'">下載完整存檔</a>':'')+(H?'<button type="button" class="lw-btn" data-a="mpreset">再來一局（重選想定）</button>':'')+'</div></div>';}
  /* 房間設定 */
  var C=R.cfg,dis=H?'':' disabled';o+='<div class="lw-card"><h3>房間設定'+(H?'':'<small>只有房主可以修改</small>')+'</h3><div class="lw-row"><label>房間名稱 <input type="text" data-c="mpcf" data-f="name" value="'+mpEsc(C.name)+'" maxlength="40"'+dis+'></label>'+(H?'<label>密碼 <input type="text" data-c="mpcf" data-f="pass" value="" placeholder="'+(R.locked?'（已設定，留空不變）':'（無）')+'" maxlength="40" style="width:9em"></label>':'')+'</div>'+
    '<div class="lw-row"><label>時間速度 <select data-c="mpcf" data-f="speed"'+dis+'>'+SPEEDS.map(function(v){return '<option value="'+v+'"'+(C.speed===v?' selected':'')+'>每秒 '+durTxt(v)+'</option>';}).join('')+'</select></label><label>暫停 <select data-c="mpcf" data-f="pause"'+dis+'><option value="host"'+(C.pause==='host'?' selected':'')+'>只有房主</option><option value="all"'+(C.pause==='all'?' selected':'')+'>所有玩家</option></select></label>'+
    '<label>部署區縱深 <select data-c="mpcf" data-f="depth"'+dis+'>'+[0.2,0.3,0.4,0.5].map(function(v){return '<option value="'+v+'"'+(Math.abs(C.depth-v)<0.01?' selected':'')+'>'+Math.round(v*100)+'%</option>';}).join('')+'</select></label></div>'+
    (R.phase!=='run'&&R.phase!=='over'?'<div class="lw-row">'+C.teams.map(function(n0,s){return '<label>'+mpEsc(S&&S.sides[s]?S.sides[s].name:MPSN[s]||'第'+(s+1)+'方')+'指揮官 <select data-c="mpcf" data-f="team'+s+'"'+dis+'>'+[1,2,3,4,5,6,7,8].map(function(n){return '<option value="'+n+'"'+(C.teams[s]===n?' selected':'')+'>'+n+' 位</option>';}).join('')+'</select></label>';}).join('')+'</div>'+mpTriHtml(C,dis):'')+
    '<div class="lw-row">'+[['aiFill','空位開戰時由電腦補上'],['aiTake','玩家斷線時由電腦暫代'],['spect','開放觀戰（觀戰者看得到雙方）'],['ffog','友軍迷霧（與司令部失聯的本方部隊從地圖上消失）'],['rp','增援點數'],['tech','科技點數']].map(function(q){return '<label><input type="checkbox" data-c="mpcf" data-f="'+q[0]+'"'+(C[q[0]]?' checked':'')+dis+'> '+q[1]+'</label>';}).join('')+'</div>'+
    (C.rp||C.tech?'<div class="lw-row">'+(C.rp?'<label>初始增援點數 <input type="number" data-c="mpcf" data-f="rp0" value="'+C.rp0+'" min="0" style="width:6em"'+dis+'></label><label>每日增援點數 <input type="text" data-c="mpcf" data-f="rpDay" value="'+mpEsc(C.rpDay)+'" style="width:5em"'+dis+'>（auto＝依補給需求）</label>':'')+(C.tech?'<label>初始科技點數 <input type="number" data-c="mpcf" data-f="tp0" value="'+C.tp0+'" min="0" style="width:5em"'+dis+'></label><label>每日科技點數 <input type="number" data-c="mpcf" data-f="tpDay" value="'+C.tpDay+'" min="0" style="width:5em"'+dis+'></label>':'')+'</div>':'')+
    '<div class="lw-row"><label>作戰時限 <input type="number" data-c="mpcf" data-f="dur" value="'+(C.dur||0)+'" min="0" max="2200" step="1" style="width:6em"'+dis+'> 小時</label>'+(H?'<button type="button" class="lw-btn sm" data-a="mpdurdlg">快速設定…</button>':'')+'<span class="lw-note" data-k="mpdurn">'+mpDurNote(R)+'</span></div><div class="lw-note">雙方完全雙盲：每位玩家只收到本方看得到的戰場（本方部隊、偵察到的敵情、視野內的地形變化）；地圖標示與「本方」聊天只有隊友看得到。</div></div>';
  /* 成員、聊天 */
  o+='<div class="lw-card"><h3>成員<small>'+R.mem.length+' 人</small></h3>'+R.mem.map(function(m){return '<span style="margin-right:12px;white-space:nowrap">'+(m.on?'🟢':'⚪')+' '+mpAvHtml(m.uid,m.av,m.name,20)+' '+mpEsc(m.name)+(m.uid===R.host?'（房主）':'')+(m.side>=0?'・'+mpEsc(S?S.sides[m.side].name:'')+(R.slots[m.side].length>1?(m.cm+1)+' 號':''):m.spec?'・觀戰':'')+(H&&m.uid!==R.host?' <button type="button" class="lw-btn sm" data-a="mpkick" data-v="'+m.uid+'">請出</button>':'')+'</span>';}).join('')+'</div>';
  o+='<div class="lw-card"><h3>房間聊天</h3><div class="lw-mpch" data-k="mprch"></div><div class="lw-row"><select data-k="mprcc">'+(me.side>=0?'<option value="side">本方</option>':'')+'<option value="room">全房間</option></select><input type="text" data-k="mprin" maxlength="500" style="flex:1" placeholder="訊息"><button type="button" class="lw-btn sm" data-a="mprsend">送出</button></div></div>';return o;}
/* 作戰時限：房間設定與作戰中「設定」分頁都由房主送到伺服器；因時限結束的作戰，延長後繼續（時間先暫停，戰場回到雙盲） */
function mpDurNote(R){var S=R.scn||{},C=R.cfg||{},a=[];if(!(C.dur>0))a.push('0＝依想定'+(S.dur0?'（'+durH(S.dur0)+'）':''));else if(!R.scn)a.push('之後載入的想定或存檔都採用這個時限');else if(S.dur0&&S.dur0!==C.dur)a.push('想定原為 '+durH(S.dur0));
  if(R.phase==='over'&&R.over&&R.over.why==='時間到')a.push(mpHost()?'作戰因時限結束：延長到 '+durH(mpDurMin())+' 以上即可繼續':'作戰因時限結束，房主可以延長時限繼續作戰');return a.join('；');}
function mpOverT(){var R=MPS.room,t=R&&R.over&&R.over.t||0;if(mpActive()&&G&&G.t>t)t=G.t;return t;}
function mpDurMin(){return Math.floor(mpOverT()/3600)+1;}
function mpDurCur(){var R=MPS.room;if(!R)return 0;var d=R.scn&&R.scn.dur||0;if(R.cfg&&R.cfg.dur>0&&!R.scn)d=R.cfg.dur;return d;}
function mpDurNow(){var R=MPS.room;if(!R||!R.scn)return 0;if(R.phase==='over')return mpOverT();if(R.phase!=='run')return 0;var t=Math.max(MPS.gt||0,R.run&&R.run.t||0);if(mpActive()&&G&&G.t>t)t=G.t;return t;}
function mpDurBtn(){var R=MPS.room,d=mpDurCur();if(!R||!d)return '⏱ 時限';if(R.phase==='run')return '⏱ 剩 '+durTxt(Math.max(0,d*3600-mpDurNow()));return '⏱ '+fmt(d)+' 小時';}
function mpDurTip(){var d=mpDurCur();return '作戰時限'+(d?' '+durH(d):'（依想定）')+(mpHost()?'；按一下調整':'；房主可以調整');}
function mpDurTick(){var b=UI.bar&&UI.bar.querySelector('[data-k="mpdurb"]');if(b)b.textContent=mpDurBtn();}
ACT.mpdurdlg=function(){var R=MPS.room;if(!R)return;var H=mpHost(),d=mpDurCur(),t=mpDurNow(),st=R.phase==='run'||R.phase==='over',ov=R.phase==='over'?R.over||{}:null,o='<h3>作戰時限</h3><div class="lw-note">'+(d?'目前 '+durH(d):'依想定')+
    (R.scn?'':'（還沒有想定：先設定好，之後載入的想定或存檔都會採用這個時限）')+(st&&d?'；已進行 '+durTxt(t)+(R.phase==='run'?'，剩 '+durTxt(Math.max(0,d*3600-t)):''):'')+'。'+
    (ov?(ov.why==='時間到'?'作戰因時限結束：延長到 '+durH(mpDurMin())+' 以上即可繼續（戰場回到雙盲、時間先暫停）。':'作戰已因「'+mpEsc(ov.why||'')+'」結束，不能延長。'):'')+(H?'開戰前或作戰中都可以調整，所有人一起套用。':'只有房主可以調整。')+'</div>';
  if(H&&!(ov&&ov.why!=='時間到')){var v0=Math.max(d||24,ov?mpDurMin():0);o+='<div class="lw-row"><label>新的時限 <input type="number" data-k="mpdurv" data-i="mpdurv" min="1" max="2200" step="1" value="'+v0+'" style="width:7em"> 小時</label><span class="lw-note" data-k="mpdurh">'+durH(v0)+'</span></div>'+
    '<div class="lw-row">'+[6,24,72,168].map(function(h){return '<button type="button" class="lw-btn sm" data-a="mpdurq" data-v="+'+h+'">＋'+(h<24?h+' 小時':h<168?h/24+' 天':'1 週')+'</button>';}).join('')+'</div>'+
    '<div class="lw-row">'+DURP.map(function(q){return '<button type="button" class="lw-btn sm" data-a="mpdurq" data-v="'+q[0]+'">'+q[1]+'</button>';}).join('')+(st?'':'<button type="button" class="lw-btn sm" data-a="mpdurq" data-v="0">依想定</button>')+'</div>'+
    '<div class="lw-row"><button type="button" class="lw-btn pri" data-a="mpdurok">套用</button><button type="button" class="lw-btn" data-a="x">取消</button></div>';}
  else o+='<div class="lw-row"><button type="button" class="lw-btn" data-a="x">關閉</button></div>';
  if(UI.durd&&UI.durd.isConnected)UI.durd.remove();UI.durd=dlg(o);UI.durd.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.matches('[data-k="mpdurv"]')){e.preventDefault();ACT.mpdurok();}});var q=UI.durd.querySelector('[data-k="mpdurv"]');if(q){q.focus();q.select();}};
ACT.mpdurq=function(b){var v=b.getAttribute('data-v'),D=UI.durd,inp=D&&D.querySelector('[data-k="mpdurv"]');if(!inp)return;if(v==='0'){D.remove();if(mpSend({t:'rcfg',cfg:{dur:0}}))toast('作戰時限改為依想定。');return;}var n=v.charAt(0)==='+'?(Math.round(+inp.value)||mpDurCur()||0)+(+v.slice(1)):+v;inp.value=Math.min(2200,Math.max(1,n));INP.mpdurv(inp);};
INP.mpdurv=function(t){var h=UI.durd&&UI.durd.querySelector('[data-k="mpdurh"]');if(h)h.textContent=+t.value>0?durH(Math.round(+t.value)):'';};
ACT.mpdurok=function(){var D=UI.durd,inp=D&&D.querySelector('[data-k="mpdurv"]');if(!inp)return;var v=Math.round(+inp.value||0);if(mpDurSend(v,true)){D.remove();toast('作戰時限改為 '+durH(v)+'。',3500);}};
/* 送出新的作戰時限；回傳是否送出 */
function mpDurSend(v,noAsk){v=Math.round(+v||0);var R=MPS.room;if(!R){toast('尚未進入房間。');return false;}if(!mpHost()){toast('只有房主可以調整作戰時限。',4000);return false;}if(!(v>=1&&v<=2200)){toast('作戰時限請輸入 1–2200 小時。',4000);return false;}
  var ov=R.phase==='over'?R.over||{}:null,t=mpOverT();
  if(ov){if(ov.why!=='時間到'){toast('作戰已因「'+(ov.why||'結束')+'」結束，不能延長時限。',4500);return false;}if(v*3600<=t){toast('作戰已進行 '+durTxt(t)+'，時限要延長到 '+durH(mpDurMin())+' 以上才能繼續。',5000);return false;}
    if(!noAsk&&!confirm('作戰已因時限結束並全面揭曉。延長到 '+durH(v)+' 後作戰會繼續：戰場回到雙盲、時間先暫停，但大家都已看過完整的戰場。確定延長？'))return false;}
  else if(R.phase==='run'&&t>0&&v*3600<=t&&!confirm('新的時限（'+durH(v)+'）沒有超過已進行的 '+durTxt(t)+'，作戰會立刻結束。確定？'))return false;
  return mpSend({t:'rcfg',cfg:{dur:v}});}
ACT.mpdurx=function(){var R=MPS.room;if(!R)return;var cur=R.scn&&R.scn.dur||0,h=prompt('作戰已進行 '+durTxt(mpOverT())+'（原時限 '+durH(cur)+'）。要延長到幾小時？延長後作戰繼續：戰場回到雙盲、時間先暫停。',String(Math.max(mpDurMin(),cur+24)));if(h===null)return;var v=Math.round(+h||0);if(mpDurSend(v,true))toast('已送出：作戰時限延長到 '+durH(v)+'。',3500);};
/* ---------- 十一、聯機分頁的動作 ---------- */
ACT.mplogin=function(){var n=(root.querySelector('[data-k="mpn"]')||{}).value,p=(root.querySelector('[data-k="mpp"]')||{}).value;mpApi('/api/login',{name:n,pass:p}).then(function(j){mpTokSave(j.token);MPS.user=j.user;mpConnect();mpRefresh();}).catch(function(e){toast(e.message,4500);});};
ACT.mpreg=function(){var n=(root.querySelector('[data-k="mpn"]')||{}).value,p=(root.querySelector('[data-k="mpp"]')||{}).value,p2=(root.querySelector('[data-k="mpp2"]')||{}).value,i=(root.querySelector('[data-k="mpi"]')||{}).value;if(!p2){toast('註冊時請在「確認密碼」再輸入一次密碼。',4500);var e2=root.querySelector('[data-k="mpp2"]');if(e2)e2.focus();return;}if(p2!==p){toast('兩次輸入的密碼不一致。',4500);return;}mpApi('/api/register',{name:n,pass:p,pass2:p2,invite:i}).then(function(j){mpTokSave(j.token);MPS.user=j.user;toast('註冊成功'+(j.user.admin?'：你是這台伺服器的管理員。':'。'),4500);mpConnect();mpRefresh();}).catch(function(e){toast(e.message,4500);});};
ACT.mplogout=function(){mpApi('/api/logout',{}).catch(function(){});MPS.noRetry=true;try{MPS.ws&&MPS.ws.close();}catch(e){}mpTokSave('');MPS.user=null;MPS.inRoom=null;MPS.room=null;if(mpActive())mpExit(true);mpRefresh();};
ACT.mppw=function(){var o=prompt('目前的密碼');if(o===null)return;var n=prompt('新密碼（至少 6 個字元）');if(!n)return;var n2=prompt('再輸入一次新密碼');if(n2===null)return;if(n2!==n){toast('兩次輸入的新密碼不一致。',4500);return;}mpApi('/api/password',{old:o,pass:n,pass2:n2}).then(function(){toast('密碼已更新。');}).catch(function(e){toast(e.message,4500);});};
ACT.mpmkroom=function(){MPS.rpass=(root.querySelector('[data-k="mprp"]')||{}).value||'';mpSend({t:'mkroom',name:(root.querySelector('[data-k="mprn"]')||{}).value||'',pass:MPS.rpass});};
ACT.mpjoin=function(b){var id=b.getAttribute('data-v'),pw='';if(b.getAttribute('data-l')==='1'){pw=prompt('房間密碼');if(pw===null)return;}MPS.rpass=pw;mpSend({t:'join',id:id,pass:pw});};
ACT.mpinv=function(){var u=location.origin+location.pathname+'#join='+encodeURIComponent(MPS.room.id),t='邀請你加入「'+MPS.room.name+'」：'+u+(MPS.room.locked?'（房間密碼請另外告知）':'');var done=function(){toast('已複製邀請連結'+(MPS.room.locked?'；房間有密碼，請另外告訴對方。':'。'),4000);};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(done).catch(function(){prompt('複製這段邀請：',t);});else prompt('複製這段邀請：',t);};
ACT.mpleave=function(){if(MPS.room&&MPS.room.phase==='run'&&MPS.me&&MPS.me.side>=0&&!confirm('離開後你的部隊會交給電腦指揮（之後可以重新加入）。確定離開？'))return;mpSend({t:'leave'});MPS.inRoom=null;MPS.room=null;MPS.me=null;if(mpActive())mpExit(true);else mpRefresh();};
ACT.mplsend=function(){var el=root.querySelector('[data-k="mplin"]');if(!el||!el.value.trim())return;mpSend({t:'chat',ch:'lobby',txt:el.value.trim()});el.value='';};
ACT.mprsend=function(){var el=root.querySelector('[data-k="mprin"]'),ch=root.querySelector('[data-k="mprcc"]');if(!el||!el.value.trim())return;mpSend({t:'chat',ch:ch?ch.value:'room',txt:el.value.trim()});el.value='';};
ACT.mprepl=function(){mpApi('/api/replays').then(function(j){MPS.replays=j.list||[];var el=root.querySelector('[data-k="mprepl"]');if(el)el.innerHTML=mpReplHtml();}).catch(function(e){toast(e.message);});};
ACT.mprepopen=function(b){var id=b.getAttribute('data-v');toast('下載回放中…');fetch('/api/replay/'+id+'?token='+encodeURIComponent(MPS.tok)).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(function(P){return replayBuild(P);}).then(function(g){RP.G=g;RP.t=g.rec.fr[0].t;RP.src='伺服器回放 #'+id;show('replay');toast('已開啟回放：'+(g.name||''));}).catch(function(e){toast('無法開啟回放：'+e.message,4500);});};
ACT.mptake=function(b){var q=b.getAttribute('data-v').split(',');mpSend({t:'take',side:+q[0],cm:+q[1]});};ACT.mpuntake=function(){mpSend({t:'untake'});};ACT.mpspec=function(){mpSend({t:'spec',on:!(MPS.me&&MPS.me.spec)});};
ACT.mpkick=function(b){if(confirm('請這位成員離開房間？'))mpSend({t:'kick',uid:+b.getAttribute('data-v')});};
ACT.mprun=function(){mpSend({t:'run',on:!(MPS.room&&MPS.room.run.on)});};ACT.mpend=function(){if(confirm('結束作戰？雙方的戰場會全面揭曉，並整理回放。'))mpSend({t:'end'});};ACT.mpreset=function(){if(confirm('清除目前的作戰，重新選擇想定？'))mpSend({t:'reset'});};
CHG.mpspd=function(t){mpSend({t:'rcfg',cfg:{speed:+t.value}});};
CHG.mpslk=function(t){var q=t.getAttribute('data-v').split(',');mpSend({t:'slotkind',side:+q[0],cm:+q[1],kind:t.value});};
CHG.mpcf=function(t){var f=t.getAttribute('data-f'),v=t.type==='checkbox'?t.checked:t.value,c={};if(/^team[0-2]$/.test(f)){var T=(MPS.room.cfg.teams||[1,1]).slice();T[+f.slice(4)]=+v;c.teams=T;}else if(f==='pass'){if(!v&&!confirm('清除房間密碼？'))return;c.pass=v;}else if(f==='dur'){var dv=Math.round(+v||0);if(dv===0){c.dur=0;}else{if(!mpDurSend(dv)){t.value=MPS.room.cfg.dur||0;}else toast('作戰時限改為 '+durH(dv)+'。',3000);return;}}else if(f==='speed'||f==='depth'||f==='rp0'||f==='tp0'||f==='tpDay')c[f]=+v;else c[f]=v;mpSend({t:'rcfg',cfg:c});};
ACT.mpquick=function(){var k=(root.querySelector('[data-k="mpq"]')||{}).value;mpSend({t:'quick',k:k});toast('伺服器建立想定中，地圖生成需要一點時間…',4000);};
ACT.mpscnf=function(){var inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';inp.onchange=function(){var f=inp.files[0];if(!f)return;toast('讀取中…');f.text().then(function(s){var o=JSON.parse(s);if(o.format!=='LatoWarsim')throw new Error('這不是作戰模擬存檔（.latowarsim.json）。');toast('上傳中（'+Math.round(s.length/1048576*10)/10+' MB）…',4000);return mpSendBig({t:'scn',save:o});}).catch(function(e){toast('無法上傳：'+e.message,4500);});};inp.click();};
ACT.mpscnl=async function(){var g0=G,lg=MPS.localG&&MPS.localG.map?MPS.localG:G;if(!lg||!lg.map||lg.mp){toast('目前沒有單機作戰。先在「開始」建立或讀取一場作戰。');return;}try{G=lg;var S=gameSnap(false);G=g0;var o=JSON.parse(await gameText(await S));toast('上傳中…',3000);await mpSendBig({t:'scn',save:o});}catch(e){G=g0;toast('無法上傳：'+e.message,4500);}};
/* ---------- 十二、管理員面板 ---------- */
ACT.mpadmin=function(){mpApi('/api/admin').then(function(A){MPS.adm=A;mpAdminDlg();}).catch(function(e){toast(e.message);});};
function mpAdminDlg(){var A=MPS.adm,C=A.cfg,o='<h3>管理員面板<small>記憶體 '+A.mem+' MB・已運行 '+durTxt(A.up)+'</small></h3><div class="lw-card"><h3>伺服器設定</h3><div class="lw-row"><label>名稱 <input type="text" data-k="aname" value="'+mpEsc(C.serverName)+'"></label><label>公告 <input type="text" data-k="amotd" value="'+mpEsc(C.motd)+'" style="width:20em"></label></div>'+
  '<div class="lw-row"><label><input type="checkbox" data-k="areg"'+(C.allowRegister?' checked':'')+'> 開放註冊</label><label>邀請碼（留空＝不需要）<input type="text" data-k="ainv" value="'+mpEsc(C.invite)+'" style="width:9em"></label><label>房間上限 <input type="number" data-k="amax" value="'+C.maxRooms+'" style="width:5em"></label><label>每人房間數 <input type="number" data-k="amaxu" value="'+C.maxRoomsPerUser+'" style="width:4em"></label></div><div class="lw-row"><button type="button" class="lw-btn pri" data-a="admcfg">儲存設定</button></div></div>';
  o+='<div class="lw-card"><h3>使用者<small>'+A.users.length+' 位</small></h3><table class="lw-tbl"><tr><th>名稱</th><th>註冊</th><th>最後登入</th><th>狀態</th><th></th></tr>'+A.users.map(function(x){return '<tr><td>'+mpAvHtml(x.id,x.av,x.name,18)+' '+mpEsc(x.name)+(x.admin?'（管理員）':'')+(x.av?' <button type="button" class="lw-btn sm" data-a="admu" data-v="delavatar,'+x.id+'" title="移除這位玩家的頭像">移除頭像</button>':'')+'</td><td>'+new Date(x.created).toLocaleDateString()+'</td><td>'+new Date(x.last).toLocaleString()+'</td><td>'+(x.banned?'⛔ 停用':'正常')+'</td><td>'+
    (MPS.user&&x.id===MPS.user.id?'':'<button type="button" class="lw-btn sm" data-a="admu" data-v="'+(x.banned?'unban':'ban')+','+x.id+'">'+(x.banned?'恢復':'停用')+'</button> <button type="button" class="lw-btn sm" data-a="admu" data-v="'+(x.admin?'unadmin':'admin')+','+x.id+'">'+(x.admin?'取消管理員':'設為管理員')+'</button> <button type="button" class="lw-btn sm" data-a="admu" data-v="reset,'+x.id+'">重設密碼</button> <button type="button" class="lw-btn sm dng" data-a="admu" data-v="deluser,'+x.id+'">刪除</button>')+'</td></tr>';}).join('')+'</table></div>';
  o+='<div class="lw-card"><h3>房間<small>'+A.rooms.length+' 間</small></h3>'+(A.rooms.length?'<table class="lw-tbl"><tr><th>房間</th><th>狀態</th><th>成員</th><th></th></tr>'+A.rooms.map(function(r){return '<tr><td>'+mpEsc(r.name)+'</td><td>'+mpPhaseTxt(r.phase)+'</td><td>'+r.mem.map(function(m){return mpEsc(m.name);}).join('、')+'</td><td><button type="button" class="lw-btn sm dng" data-a="admroom" data-v="'+mpEsc(r.id)+'">關閉房間</button></td></tr>';}).join('')+'</table>':'<div class="lw-note">沒有房間。</div>')+'</div><div class="lw-note">回放共 '+A.replays+' 份（大廳的回放列表可下載）。</div><div class="lw-row"><button type="button" class="lw-btn" data-a="x">關閉</button></div>';
  if(UI.admd&&UI.admd.isConnected)UI.admd.remove();UI.admd=dlg(o,true);}
function mpAdm(b){return mpApi('/api/admin',b).then(function(r){if(r.err)toast(r.err,4500);else{if(r.pass)alert('新密碼：'+r.pass+'\n請轉交給使用者，登入後可自行修改。');ACT.mpadmin();}}).catch(function(e){toast(e.message);});}
ACT.admcfg=function(){var q=function(k){return UI.admd.querySelector('[data-k="'+k+'"]');};mpAdm({op:'cfg',cfg:{serverName:q('aname').value,motd:q('amotd').value,allowRegister:q('areg').checked,invite:q('ainv').value,maxRooms:+q('amax').value,maxRoomsPerUser:+q('amaxu').value}});};
ACT.admu=function(b){var q=b.getAttribute('data-v').split(','),op=q[0];if((op==='deluser'||op==='ban')&&!confirm(op==='deluser'?'刪除這個帳號？':'停用這個帳號？'))return;mpAdm({op:op,uid:+q[1]});};
ACT.admroom=function(b){if(confirm('關閉這個房間？進行中的作戰會被刪除。'))mpAdm({op:'closeroom',room:b.getAttribute('data-v')});};
/* ---------- 十三、說明、啟動 ---------- */
HELP14.push('<h4>聯機作戰（聯機版）</h4><ul>'+
  '<li><b>登入與大廳</b>：「聯機」分頁註冊或登入，第一位註冊的人是伺服器管理員（可設定是否開放註冊、邀請碼、停用帳號、重設密碼、關閉房間）。大廳可以建立房間（可設密碼）、加入房間、聊天、下載以前的回放。</li>'+
  '<li><b>帳號與頭像</b>：註冊時要在「確認密碼」再輸入一次密碼，修改密碼時新密碼也要輸入兩次。大廳可以「更換頭像」（PNG、JPEG、GIF 或 WebP，自動置中裁成正方形），頭像顯示在大廳的線上名單、房間成員、席位與聊天；管理員可以移除不當的頭像。</li>'+
  '<li><b>房間與想定</b>：房主上傳存檔（在單機版準備好地圖、雙方兵力與部署後下載的 .latowarsim.json）、直接使用單機版目前的作戰，或選擇快速想定。房主設定時間速度、誰可以暫停、部署區縱深、每一方的指揮官人數（1–8 位；全房間最多 12 位玩家，例如多人合作對抗電腦、4 對 4，或開啟「三方對戰」後 3 對 3 對 3：第三方開場與兩軍中立，各方在「外交」宣戰、停火或結盟）、點數規則與作戰時限。</li>'+
  '<li><b>作戰時限</b>：房主在開戰前（不論有沒有載入想定或存檔）或作戰中隨時可以調整：房間設定、部署分頁或頂列的「⏱」按鈕（可以加 6 小時、1 天、3 天、1 週，或直接選 1 天到 3 個月），或作戰中的「設定」分頁；送到伺服器後所有人一起套用。作戰因時限結束時，房主可以「延長時限，繼續作戰」：戰場回到雙盲、時間先暫停。房間設定也可以開啟<b>友軍迷霧</b>。</li>'+
  '<li><b>模擬設定</b>：房主可以在房間頁的「模擬設定」（開戰前不論有沒有載入想定或存檔都可以）或作戰中的「設定」分頁調整所有模擬設定，送到伺服器後所有人一起套用；載入想定前調整的設定會套用到之後載入的想定或存檔，「恢復想定的設定」可以撤銷。聯機作戰固定雙盲；自動暫停會暫停整個房間（預設全部關閉，由房主開啟）；房主可以在作戰中觸發事件。畫面、效果、音效、音樂與戰爭花費單價是各自的設定。其他玩家看得到設定，但不能修改。</li>'+
  '<li><b>席位</b>：每一方的每位指揮官是一個席位，可以設為「玩家」或「電腦」；空位開戰時可由電腦補上；玩家斷線太久由電腦暫代，重新加入後自動交還。單人對電腦（PVE）、玩家對玩家（PVP）、玩家與電腦組隊都可以。</li>'+
  '<li><b>部署</b>：坐上席位後只看得到本方。可匯入自己的編制檔（單機版「兵力編成」匯出），部隊會自動部署在本方部署區，再到「部署」分頁拖曳調整；拖出部署區會被拉回。玩家按「準備完成」，房主按「開始作戰」。</li>'+
  '<li><b>完全雙盲</b>：模擬在伺服器上執行，每位玩家只收到本方看得到的戰場：本方部隊與設施、偵察到的敵情、看得到的車隊與戰俘縱隊、視野內的地形變化（橋樑、工事、彈坑）；看不到的地方維持你最後所知的樣子。戰線也是依本方掌握的敵情畫出。</li>'+
  '<li><b>指揮</b>：與單機版相同的命令列、環形選單、補給呼叫、增援、科技、CBRN 等，命令送到伺服器執行；隊友的部隊不能指揮，但可以用請求、收件匣與隊友協同。</li>'+
  '<li><b>標示與情報分享</b>：地圖左下角的聊天框：「本方」頻道只有隊友看得到，「全房間」雙方都看得到；「📍 分享位置」把選取的部隊、敵情或畫面中央分享給隊友，點連結即可移到該處。「標示」分頁可以放置攻擊這裡、防禦這裡、需要支援、注意這裡與自訂文字的標示。</li>'+
  '<li><b>結束與回放</b>：時限到、一方潰敗或房主結束作戰後，戰場全面揭曉（雙方都看得到全部），伺服器自動錄製回放；在房間或大廳下載回放，或直接在「回放」分頁開啟。房主可下載完整存檔，回到單機版繼續研究。</li></ul>');
(function(){var B0=boot;boot=function(){B0();var jm=/[#&]join=([\w-]+)/.exec(location.hash||'');if(jm)MPS.joinHash=decodeURIComponent(jm[1]);MPS.tok=(function(){try{return localStorage.getItem('lato-mp-token')||'';}catch(e){return '';}})();
  mpApi('/api/info').then(function(j){MPS.info=j;if(UI.tab==='online')mpRefresh();}).catch(function(){MPS.info={name:'（無法連到伺服器）'};});
  if(MPS.tok)mpApi('/api/me').then(function(j){MPS.user=j.user;mpConnect();mpRefresh();}).catch(function(){mpTokSave('');mpRefresh();});show('online');};})();
