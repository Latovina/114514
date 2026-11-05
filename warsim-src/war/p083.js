/* ===================== 通訊的介面：通信兵符號、「通訊」圖層（本方的指揮通訊網）、狀態面板的情報回報時間、說明 ===================== */
/* 通信兵符號：框內一道斜貫的閃電 */
(function(){var b=symIcon;symIcon=function(c,sym,x,y,w,h,col){if(sym!=='com')return b.apply(this,arguments);c.strokeStyle=col;c.lineWidth=Math.max(1,h/11);c.beginPath();c.moveTo(x-w/2,y-h/2);c.lineTo(x-w*0.06,y+h*0.12);c.lineTo(x+w*0.06,y-h*0.12);c.lineTo(x+w/2,y+h/2);c.stroke();};})();
/* ---------- 「通訊」圖層：每個單位與上級之間的通訊方式；通信單位的中繼範圍 ---------- */
var COMV={k:'',L:[]},COMCOL={digital:'#6A1B9A',radio:'#1565C0',relay:'#00897B',wire:'#6D4C41',courier:'#757575'};
function comLinks(){var me=UI.side,all=me<0||seeAll(),k=[Math.floor(G.t/30),G.units.length,me,all?1:0].join('|');if(COMV.k===k)return COMV.L;var L=[];
  G.units.forEach(function(u){if(u.p<0||u.st==='dead'||u.st==='off'||!onMap(u)||u.side<0||u.side>=nSides())return;if(!all&&u.side!==me)return;var P=uById(u.p);if(!P||P.st==='dead'||!onMap(P))return;
    var h=hopDelay(P,u,true),thr=h.via==='courier'&&comThreat(P,u),R=h.relay?uById(h.relay):null;L.push({a:P,b:u,via:h.via,sec:h.sec,thr:thr,r:R,lost:!!(P.hqLost&&P.hqRe>G.t)});});COMV.k=k;COMV.L=L;return L;}
function drawComm(c){if(!UI.lay.com||!G||!G.units)return;var L=comLinks(),me=UI.side,all=me<0||seeAll(),m=mpp();c.save();
  /* 通信單位的中繼範圍 */SIDES().forEach(function(s){if(!all&&s!==me)return;comUnits(s).forEach(function(u){var E=uEra(u),R=(E.radio?Math.max(15,(E.rr||6)*2):E.wire?25:12)*1000,p=w2s(u.x,u.y),r=R/m;if(p[0]<-r||p[1]<-r||p[0]>VW.cw+r||p[1]>VW.ch+r)return;
    c.setLineDash([3,5]);c.strokeStyle='rgba(0,137,123,.55)';c.lineWidth=1.2;c.beginPath();c.arc(p[0],p[1],r,0,2*PI);c.stroke();c.setLineDash([]);if(r>40)txtHalo(c,uName(u)+'：'+(E.radio?'無線電中繼':E.wire?'電話線':'傳令騎兵')+' '+fmt(R/1000)+' 公里',p[0],p[1]-r-6,'10px sans-serif','#00695C');});});
  L.forEach(function(q){var a=w2s(q.a.x,q.a.y),b=w2s(q.b.x,q.b.y);if(Math.max(a[0],b[0])<-20||Math.min(a[0],b[0])>VW.cw+20||Math.max(a[1],b[1])<-20||Math.min(a[1],b[1])>VW.ch+20)return;
    var col=q.lost?'#B71C1C':q.thr?'#E53935':COMCOL[q.via]||'#757575';c.strokeStyle=col;c.globalAlpha=0.75;c.lineWidth=q.via==='courier'?1.4:1.8;c.setLineDash(q.via==='courier'?[5,4]:q.via==='wire'?[1,3]:[]);c.beginPath();
    if(q.r&&onMap(q.r)){var r=w2s(q.r.x,q.r.y);c.moveTo(a[0],a[1]);c.lineTo(r[0],r[1]);c.lineTo(b[0],b[1]);}else{c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);}c.stroke();c.setLineDash([]);c.globalAlpha=1;
    if(m<60&&(q.thr||q.lost||q.via==='courier')){var mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;txtHalo(c,(q.lost?'司令部重建中':q.thr?'傳令可能被截':'傳令')+' '+durTxt(q.sec),mx,my-4,'10px sans-serif',col);}});
  c.restore();}
(function(){var b=drawProj;drawProj=function(c){b(c);try{drawComm(c);}catch(e){if(window.console)console.warn('comm',e);}};})();
(function(){var b=lyRender;lyRender=function(){b();if(!VW.ly)return;var sel=VW.ly.querySelector('select[data-ly="lvl"]'),l=document.createElement('label');l.title='本方的指揮通訊網：紫＝數位網路、藍＝無線電、青綠＝經通信單位中繼、棕點線＝有線電話、灰虛線＝傳令兵（紅色表示附近有敵軍、可能被截）；虛線圓圈是通信單位的中繼範圍';
  l.innerHTML='<input type="checkbox" data-ly="com"'+(UI.lay.com?' checked':'')+'>通訊';if(sel)VW.ly.insertBefore(l,sel);else VW.ly.appendChild(l);};})();
/* ---------- 狀態面板：情報送到最高司令部要多久 ---------- */
function comRepHtml(u){if(!u||u.side<0||u.side>=nSides()||u.st==='off')return '';var R=repRoute(u);if(!R.hops.length)return '<span>情報回報</span><span>本身就是最高司令部</span>';
  var t=R.sec*0.8+R.wait;return '<span>情報回報</span><span>看到的敵情約 '+durTxt(t)+' 送到最高司令部（'+R.hops.map(function(v){return VIA[v]||v;}).join('→')+'）'+(R.hold?'<span style="color:#b3261e">，'+esc(uName(R.hold))+'重建中，回報要等 '+durTxt(R.wait)+'</span>':'')+'</span>';}
function comUnitHtml(u){var s=ST(u);if(s.br!=='com')return '';var E=uEra(u),R=E.radio?Math.max(15,(E.rr||6)*2):E.wire?25:12;return '<span>通信</span><span>'+(E.radio?'無線電中繼：上下級都在 '+R+' 公里內就能經本單位中繼':E.wire?'停留半小時以上，就在 25 公里內拉設電話線（目前'+(stillFor(u)>=1800?'已架設':'尚未架設')+'）':'傳令騎兵：12 公里內的傳令快約六成、被截的機會減半')+'；附近 5 公里內的司令部無線電距離 ×1.5、受干擾影響減半</span>';}
(function(){var b=btStatus;btStatus=function(){b.apply(this,arguments);try{if(UI.selX||UI.selC||UI.selB||!UI.sel||UI.sel.length!==1)return;var u=uById(UI.sel[0]),el=btEl('bst');if(!u||!el)return;var me=mySide();if(me!==null&&u.side!==me&&G.set.fog)return;
  var kv=[].slice.call(el.querySelectorAll('.lw-kv>span')).filter(function(s){return s.textContent==='指揮鏈';})[0];var h=comRepHtml(u)+comUnitHtml(u);if(!h)return;
  if(kv&&kv.nextElementSibling)kv.nextElementSibling.insertAdjacentHTML('afterend',h);else{var k2=el.querySelector('.lw-kv');if(k2)k2.insertAdjacentHTML('beforeend',h);}}catch(e){if(window.console)console.warn('comm',e);}};})();
HELP14.push('<h4>通訊與情報回報</h4><ul><li><b>通信單位</b>（傳令騎兵隊、電報隊、野戰電話連、無線電通信連、中繼與數位通信連）是後方單位，不參加戰鬥；師級以上的編制附有一個。</li>'+
  '<li>無線電的年代：上下級之間超出無線電距離時，若有本方通信單位同時在兩邊的中繼距離內（約為連級無線電距離的兩倍，至少 15 公里），命令與回報改走<b>無線電中繼</b>，比傳令兵快很多，也不會被截。電報與野戰電話的年代：通信單位停留半小時以上，就在 25 公里內拉線，上下級不必停下來也能用電話。只有傳令兵的年代：傳令騎兵讓附近的傳令快約六成、被截的機會減半。通信單位 5 公里內的司令部，無線電距離 ×1.5、受干擾的影響減半。</li>'+
  '<li><b>情報要送到最高司令部</b>：前線看到的敵情要經指揮鏈一層層送上去，本方的戰場情報圖（地圖上的敵情、AI 的判斷）才會更新。送達時間是各層傳遞時間的總和；走傳令兵的路段附近有敵軍時，回報常被截而要重送，時間加倍；指揮鏈上有司令部被摧毀、正在重建時，回報卡在那一層，重建後才送上去。選取部隊時，狀態面板的「情報回報」顯示要多久。</li>'+
  '<li>圖層「通訊」顯示本方的指揮通訊網：紫色是數位網路、藍色是無線電、青綠色是經通信單位中繼、棕色點線是有線電話、灰色虛線是傳令兵（紅色表示附近有敵軍、可能被截）；虛線圓圈是通信單位的中繼範圍。</li></ul>');
