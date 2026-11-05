/* ===================== 風與氣候的畫面：風場流線、雨雪、霧氣、雲影、日夜與冷熱色調、順風漂動的煙幕與火場濃煙、流動的毒氣雲、風向儀 =====================
   畫在地形之上、煙霧與部隊之下的獨立圖層，每一格動畫重畫；只讀取模擬狀態、只用自己的亂數，不影響戰局。可在圖形設定關閉，簡易圖形模式下不畫。 */
/* 畫面與聲音用自己的亂數，不動到 Math.random 的序列（快速想定等用 Math.random 的地方因此不受影響） */
var wxRnd=(function(){var s=(Date.now()^0x9e3779b9)>>>0||1;return function(){s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};})();
var WXV={on:true,cv:null,cx:null,P:[],R:[],last:0};try{var _wv=JSON.parse(localStorage.getItem('lato-warsim-wxv')||'null');if(_wv&&_wv.on===false)WXV.on=false;}catch(e){}
function wxvSave(){try{localStorage.setItem('lato-warsim-wxv',JSON.stringify({on:WXV.on}));}catch(e){}}
function wxvMount(){if(WXV.cv&&WXV.cv.isConnected)return;var ref=FX.cs&&FX.cs.isConnected?FX.cs:VW.ct;if(!ref)return;var cv=document.createElement('canvas');cv.className='lw-wxv';cv.style.pointerEvents='none';ref.insertAdjacentElement('beforebegin',cv);WXV.cv=cv;WXV.cx=cv.getContext('2d');wxvSize();}
function wxvSize(){if(!WXV.cv||!VW.cw)return;var d=VW.dpr||1;WXV.cv.width=Math.round(VW.cw*d);WXV.cv.height=Math.round(VW.ch*d);}
(function(){var b=fxSize;fxSize=function(){b.apply(this,arguments);wxvSize();};})();
(function(){var b=fxMount;fxMount=function(){b.apply(this,arguments);try{wxvMount();}catch(e){}};})();
function wxvOn(){return WXV.on&&G&&G.started&&!G.replay&&UI.tab==='battle'&&!(typeof gfxSimple==='function'&&gfxSimple());}
function wxvHash(i){var h=Math.sin(i*127.1+311.7)*43758.5453;return h-Math.floor(h);}
/* 風場流線：螢幕上的粒子順風移動 */
function wxvWind(c,dt,W,m,run){var ws=W.ws,n=Math.round(clamp(ws*20,30,240)*clamp(VW.cw*VW.ch/(1360*820),0.4,1.6)),v=clamp(ws*140/m,24,420)*(run?1:0.6),ux=Math.cos(W.wd),uy=Math.sin(W.wd),L=clamp(v*0.16,12,46),P=WXV.P;
  while(P.length<n)P.push({x:wxRnd()*VW.cw,y:wxRnd()*VW.ch,a:wxRnd()*2,l:1.2+wxRnd()*1.8});if(P.length>n)P.length=n;
  /* 依透明度分成 4 組，一組一條路徑：每幀 8 次描線，而不是每根風線 2 次 */
  var B=[[],[],[],[]];for(var i=0;i<P.length;i++){var p=P[i];p.a+=dt;p.x+=ux*v*dt;p.y+=uy*v*dt;if(p.a>p.l||p.x<-40||p.y<-40||p.x>VW.cw+40||p.y>VW.ch+40){p.x=wxRnd()*VW.cw;p.y=wxRnd()*VW.ch;p.a=0;p.l=1.2+wxRnd()*1.8;continue;}
    var f=Math.sin(Math.PI*p.a/p.l),q=Math.min(3,Math.floor(f*4));if(f>0.05)B[q].push(p);}
  c.lineCap='round';for(var j=0;j<4;j++){var L2=B[j];if(!L2.length)continue;var fa=(j+0.5)/4;c.beginPath();for(var i2=0;i2<L2.length;i2++){var q2=L2[i2];c.moveTo(q2.x,q2.y);c.lineTo(q2.x-ux*L,q2.y-uy*L);}
    c.lineWidth=3;c.strokeStyle='rgba(255,255,255,'+(0.38*fa).toFixed(3)+')';c.stroke();c.lineWidth=1.2;c.strokeStyle='rgba(30,50,85,'+(0.55*fa).toFixed(3)+')';c.stroke();}}
/* 雨與雪 */
function wxvPrecip(c,dt,W,run){var E=G.env,w=WX[E.wx]||WX[0],rain=w[3]||0,snow=w[4]||0;if(!rain&&!snow){WXV.R=[];return;}var n=Math.round((rain?[0,140,320,520][rain]:[0,160,380][snow])*clamp(VW.cw*VW.ch/(1360*820),0.4,1.6)),R=WXV.R,ux=Math.cos(W.wd),uy=Math.sin(W.wd),sp=run?1:0.25;
  while(R.length<n)R.push({x:wxRnd()*VW.cw,y:wxRnd()*VW.ch,a:wxRnd(),l:0.25+wxRnd()*0.5,s:wxRnd()});if(R.length>n)R.length=n;
  if(rain){c.strokeStyle='rgba(110,150,210,.55)';c.lineWidth=1;c.beginPath();R.forEach(function(p){p.a+=dt*sp;var vx=ux*W.ws*14+20,vy=uy*W.ws*14+220;p.x+=vx*dt*sp;p.y+=vy*dt*sp;if(p.a>p.l||p.y>VW.ch+20||p.x<-20||p.x>VW.cw+20){p.x=wxRnd()*VW.cw;p.y=wxRnd()*VW.ch*0.9-20;p.a=0;}var k=0.045;c.moveTo(p.x,p.y);c.lineTo(p.x-vx*k,p.y-vy*k);});c.stroke();
    if(rain>=3&&run&&wxRnd()<0.004){c.fillStyle='rgba(255,255,240,.18)';c.fillRect(0,0,VW.cw,VW.ch);}}
  else{c.fillStyle='rgba(255,255,255,.85)';R.forEach(function(p){p.a+=dt*sp*0.3;var vx=ux*W.ws*10+Math.sin(p.a*6+p.s*9)*12,vy=uy*W.ws*10+38;p.x+=vx*dt*sp;p.y+=vy*dt*sp;if(p.y>VW.ch+10||p.x<-10||p.x>VW.cw+10){p.x=wxRnd()*VW.cw;p.y=-5;}c.beginPath();c.arc(p.x,p.y,1+p.s*1.4,0,2*PI);c.fill();});}}
/* 雲影：陰天與降水時，大片柔和的影子隨高空風漂過（以模擬時間計算位置） */
function wxvClouds(c,W,m){var E=G.env,w=WX[E.wx]||WX[0],k=w[0],cov=k==='over'?0.9:k==='cloud'?0.45:(w[3]||w[4])?0.8:0;if(!cov)return;var MP=G.map,Wm=MP.Wm,Hm=MP.Hm,sp=W.ws*2*G.t,ox=Math.cos(W.wd)*sp,oy=Math.sin(W.wd)*sp,n=Math.round(10*cov);
  for(var i=0;i<n;i++){var R=2500+wxvHash(i+3)*4500,x=((wxvHash(i)*Wm+ox)%(Wm+2*R)+Wm+2*R)%(Wm+2*R)-R,y=((wxvHash(i+50)*Hm+oy)%(Hm+2*R)+Hm+2*R)%(Hm+2*R)-R,p=w2s(x,y),r=R/m;if(p[0]<-r||p[1]<-r||p[0]>VW.cw+r||p[1]>VW.ch+r)continue;
    var g=c.createRadialGradient(p[0],p[1],0,p[0],p[1],r);g.addColorStop(0,'rgba(30,40,55,'+(0.16*cov).toFixed(3)+')');g.addColorStop(1,'rgba(30,40,55,0)');c.fillStyle=g;c.beginPath();c.ellipse(p[0],p[1],r,r*0.65,W.wd,0,2*PI);c.fill();}}
/* 日夜、霧氣與冷熱的色調 */
function wxvTint(c){var E=G.env,L=E.light===undefined?1:E.light,a=(1-L)*0.42;if(a>0.01){c.fillStyle='rgba(10,22,48,'+a.toFixed(3)+')';c.fillRect(0,0,VW.cw,VW.ch);}
  if(E.phase==='dawn'||E.phase==='dusk'){c.fillStyle='rgba(255,140,60,.07)';c.fillRect(0,0,VW.cw,VW.ch);}
  var vis=E.vis===undefined?1:E.vis;if(vis<0.95){c.fillStyle='rgba(226,229,233,'+clamp((1-vis)*0.42,0,0.38).toFixed(3)+')';c.fillRect(0,0,VW.cw,VW.ch);}
  var T=E.T;if(T>30){c.fillStyle='rgba(255,150,40,'+clamp((T-30)/70,0,0.12).toFixed(3)+')';c.fillRect(0,0,VW.cw,VW.ch);}else if(T<0){c.fillStyle='rgba(140,180,255,'+clamp(-T/90,0,0.12).toFixed(3)+')';c.fillRect(0,0,VW.cw,VW.ch);}}
/* 煙幕順風拉長、翻滾；火場與燃燒中的設施冒出順風的濃煙 */
function wxvSmoke(c,W,m,T){var ux=Math.cos(W.wd),uy=Math.sin(W.wd),dr=clamp(W.ws/6,0.3,1.6);
  (G.smk||[]).forEach(function(q,qi){if(q.t1<=G.t)return;var p=w2s(q.x,q.y),r=Math.max(6,q.r/m),life=clamp((q.t1-G.t)/600,0,1);if(p[0]<-3*r||p[1]<-3*r||p[0]>VW.cw+3*r||p[1]>VW.ch+3*r)return;
    for(var i=0;i<7;i++){var f=((T*0.08*dr+i/7+wxvHash(qi)*0.5)%1),d=(f*1.8-0.3)*r*dr,lat=Math.sin(T*0.6+i*1.7+qi)*r*0.28,x=p[0]+ux*d-uy*lat,y=p[1]+uy*d+ux*lat,rr=r*(0.42+0.35*f),a=0.22*life*(1-f*0.8);
      var g=c.createRadialGradient(x,y,0,x,y,rr);g.addColorStop(0,'rgba(236,236,232,'+a.toFixed(3)+')');g.addColorStop(1,'rgba(236,236,232,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,rr,0,2*PI);c.fill();}});
  var Fi=G.evt&&G.evt.fire,MP=G.map,pl=[];if(Fi&&m<120){var a0=s2w(0,0),a1=s2w(VW.cw,VW.ch),cs=MP.cs,x0=clamp(Math.floor(a0[0]/cs),0,MP.GW-1),x1=clamp(Math.ceil(a1[0]/cs),0,MP.GW-1),y0=clamp(Math.floor(a0[1]/cs),0,MP.GH-1),y1=clamp(Math.ceil(a1[1]/cs),0,MP.GH-1),st=Math.max(1,Math.round(8/Math.max(1,cs/m)));
    for(var y=y0;y<=y1&&pl.length<40;y+=st)for(var x=x0;x<=x1&&pl.length<40;x+=st)if(Fi[y*MP.GW+x]===1)pl.push([(x+0.5)*cs,(y+0.5)*cs,180]);}
  (G.fac||[]).forEach(function(F){if(F.burn&&G.t<F.burn&&pl.length<60)pl.push([F.x,F.y,260]);});
  pl.forEach(function(q,i){var p=w2s(q[0],q[1]),len=clamp(q[2]*(1.5+W.ws*0.6)/m,10,260),wd=clamp(q[2]*0.5/m,4,60);for(var k=0;k<4;k++){var f=((T*0.12+k/4+wxvHash(i)*0.3)%1),x=p[0]+ux*len*f,y=p[1]+uy*len*f,rr=wd*(0.6+f*1.6),a=0.32*(1-f);
      var g=c.createRadialGradient(x,y,0,x,y,rr);g.addColorStop(0,'rgba(55,50,48,'+a.toFixed(3)+')');g.addColorStop(1,'rgba(55,50,48,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,rr,0,2*PI);c.fill();}});}
/* 毒氣雲：順風流動的雲絮與下風拖尾 */
function wxvGas(c,W,m,T){if(typeof cbOn!=='function'||!cbOn()||!G.cbx)return;var ux=Math.cos(W.wd),uy=Math.sin(W.wd);
  G.cbx.forEach(function(C,ci){var A=CBA[C.ag];if(!A||!cbVis(C.x,C.y,C.r,C.side))return;var p=w2s(C.x,C.y),R=Math.max(5,C.r/m);if(p[0]<-3*R||p[1]<-3*R||p[0]>VW.cw+3*R||p[1]>VW.ch+3*R)return;
    var tl=R*(1+clamp(W.ws/4,0.2,2)),g0=c.createLinearGradient(p[0],p[1],p[0]+ux*tl*1.6,p[1]+uy*tl*1.6);g0.addColorStop(0,cbRGBA(A[11],0.22));g0.addColorStop(1,cbRGBA(A[11],0));c.fillStyle=g0;c.beginPath();c.ellipse(p[0]+ux*tl*0.6,p[1]+uy*tl*0.6,tl,R*0.8,W.wd,0,2*PI);c.fill();
    for(var i=0;i<9;i++){var f=((T*0.07*clamp(W.ws/3,0.3,2)+i/9+wxvHash(ci+1)*0.4)%1),d=(f*2-0.6)*R,lat=Math.sin(T*0.5+i*2.1+ci)*R*0.45,x=p[0]+ux*d-uy*lat,y=p[1]+uy*d+ux*lat,rr=R*(0.25+0.25*Math.sin(f*Math.PI)),a=0.3*Math.sin(f*Math.PI);
      var g=c.createRadialGradient(x,y,0,x,y,rr);g.addColorStop(0,cbRGBA(A[11],a));g.addColorStop(1,cbRGBA(A[11],0));c.fillStyle=g;c.beginPath();c.arc(x,y,rr,0,2*PI);c.fill();}});}
/* 風向儀：地圖左下角的小面板（在部隊之上、左側面板的右邊）；風、氣溫或天氣變了才重畫 */
function wxvHud(W,show){var h=WXV.hud;/* 換分頁後地圖容器會重建：把風向儀放回去 */if(h&&VW.wrap&&h.parentNode!==VW.wrap){VW.wrap.appendChild(h);h._k='';}if(!h){if(!VW.wrap)return;h=WXV.hud=document.createElement('div');h.className='lw-wxhud';h.style.cssText='position:absolute;bottom:52px;z-index:4;pointer-events:none;display:flex;align-items:center;gap:6px;padding:3px 8px 3px 4px;border-radius:8px;background:rgba(255,255,255,.88);box-shadow:0 1px 3px rgba(0,0,0,.25);font:11px sans-serif;color:#263238';
    h.innerHTML='<canvas width="48" height="48" style="position:static;display:block;flex:none;width:48px;height:48px"></canvas><div><b data-k="w1"></b><div data-k="w2" style="color:#455A64"></div></div>';VW.wrap.appendChild(h);}
  h.style.display=show?'flex':'none';if(!show)return;h.style.left=((VW.padL||0)+10)+'px';var E=G.env,from=W.wd+PI,a=((from%(2*PI))+2*PI)%(2*PI),nm=DIR8N[Math.round(a/(PI/4))%8],B=beaufort(W.ws),T=E.T,wn=(WX[E.wx]||WX[0])[1],key=[Math.round(W.wd*20),Math.round(W.ws*3.6),T===undefined?'':Math.round(T),wn].join('|');if(h._k===key)return;h._k=key;
  var c=h.querySelector('canvas').getContext('2d'),x=24,y=24;c.clearRect(0,0,48,48);c.strokeStyle='rgba(60,70,90,.45)';c.lineWidth=1;c.beginPath();c.arc(x,y,18,0,2*PI);c.stroke();c.beginPath();for(var k=0;k<8;k++){var aa=k*PI/4;c.moveTo(x+Math.cos(aa)*15,y+Math.sin(aa)*15);c.lineTo(x+Math.cos(aa)*18,y+Math.sin(aa)*18);}c.stroke();
  c.font='bold 8px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#37474F';c.fillText('北',x,5);var ux=Math.cos(W.wd),uy=Math.sin(W.wd);c.strokeStyle='#1565C0';c.fillStyle='#1565C0';c.lineWidth=2.4;c.beginPath();c.moveTo(x-ux*12,y-uy*12);c.lineTo(x+ux*9,y+uy*9);c.stroke();c.beginPath();c.moveTo(x+ux*14,y+uy*14);c.lineTo(x+ux*6-uy*5,y+uy*6+ux*5);c.lineTo(x+ux*6+uy*5,y+uy*6-ux*5);c.closePath();c.fill();
  h.querySelector('[data-k="w1"]').textContent=nm+'風 '+fmt(W.ws*3.6)+' 公里／時';h.querySelector('[data-k="w2"]').textContent=B[1]+'（'+B[0]+' 級）'+(T!==undefined?'・'+fx(T,0)+'°C':'')+'・'+wn;}
function wxvDraw(now){if(!WXV.cv||!WXV.cv.isConnected)wxvMount();var cv=WXV.cv,c=WXV.cx;if(!cv||!c)return;var d=VW.dpr||1;c.setTransform(d,0,0,d,0,0);
  if(!wxvOn()){if(WXV.drawn){c.clearRect(0,0,VW.cw,VW.ch);WXV.drawn=0;WXV.P=[];WXV.R=[];}if(WXV.hud)WXV.hud.style.display='none';WXV.last=now;return;}
  /* 天氣動畫不需要每一格都畫：作戰中每秒約 30 次、暫停時 10 次（畫面變慢時再減半），移動或縮放地圖時立刻重畫 */var key=[Math.round(VW.ox),Math.round(VW.oy),VW.s,VW.cw,VW.ch].join('|'),slow=FX.ema>28,iv=(UI.run?0.033:0.1)*(slow?2:1);if(key===WXV.key&&WXV.last&&now-WXV.last<iv)return;WXV.key=key;
  var dt=WXV.last?Math.min(0.1,now-WXV.last):0;WXV.last=now;c.clearRect(0,0,VW.cw,VW.ch);WXV.drawn=1;var W=windNow(),m=mpp(),run=!!UI.run,T=now;
  /* 只畫在地圖範圍內 */var q0=w2s(0,0),q1=w2s(G.map.Wm,G.map.Hm);c.save();c.beginPath();c.rect(q0[0],q0[1],q1[0]-q0[0],q1[1]-q0[1]);c.clip();
  try{wxvTint(c);wxvClouds(c,W,m);wxvSmoke(c,W,m,T);wxvGas(c,W,m,T);wxvWind(c,dt,W,m,run);wxvPrecip(c,dt,W,run);}catch(e){if(!WXV.err){WXV.err=1;if(window.console)console.warn('wxv',e);}}c.restore();try{wxvHud(W,true);}catch(e){}}
(function(){var b=fxDraw;fxDraw=function(now){b.apply(this,arguments);wxvDraw(now);};})();
setSec('gfx','wxv',{o:12,h:function(){return setOpt(setRow('風與天氣',setChk('wxv','',WXV.on,'地圖上畫出風場流線、雨雪、霧氣、雲影、日夜色調與順風漂動的煙與毒氣（只影響畫面）')));}});
CHG.wxv=function(t){WXV.on=!!t.checked;wxvSave();};
HELP14.push('<h4>風與天氣的畫面</h4><ul><li>作戰時地圖上會畫出：順風移動的<b>風場流線</b>（越密越快表示風越大）、雨絲與雪花（隨風斜飄）、霧氣（能見度越低越白）、陰天的雲影、夜晚與黃昏的色調、酷熱與嚴寒的冷暖色調；左下角的<b>風向儀</b>顯示風從哪裡吹來、風速（公里／時與風級）、氣溫與天氣。</li>'+
  '<li>煙幕會順風拉長、翻滾並<b>漂移</b>（模擬裡每 5 分鐘漂移約風速的四分之一，強風時散得較快）；火場與燃燒中的設施冒出順風的濃煙；化學與生物毒劑雲以流動的雲絮與下風拖尾表現。</li>'+
  '<li>風向風速在各年代的戰場都會隨天氣變化。這些畫面只影響顯示，可在「設定 → 圖形模式與效能」關閉，簡易圖形模式下不畫。</li></ul>');
