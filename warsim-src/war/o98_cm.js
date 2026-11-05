/* ===================== 特效：熱焰彈與干擾絲、火焰噴射器與噴火 =====================
   熱焰彈：飛機後下方灑出一串白熱的亮點，拖著白煙往下飄；干擾絲：一團淡灰色的雲。
   火焰噴射器（背負式、車載）與龍的噴火：近距離交火時，從部隊正面噴出一道橘紅色的火舌，落點起火、冒黑煙，留下焦痕；
   距離太遠（超過 300 公尺）時不畫火舌，照常畫其他武器的曳光彈。 */
FXS.flare=function(e){var a=e.a,T=FX.clk,m=mpp(),p=a&&typeof fxPlanePos==='function'?fxPlanePos(a):[e.x1,e.y1],hd=a&&FX.ip[a.id]?FX.ip[a.id].hd:0,bx=-Math.cos(hd),by=-Math.sin(hd);
  if(e.c==='rad'){fxP({k:'sm',x:p[0]+bx*8*m,y:p[1]+by*8*m,t0:T,d:2.6,r0:3,r1:22,p0:3,p1:14,a:0.35,c:'190,195,200'});return;}
  var n=fxLv(5,9);for(var i=0;i<n;i++){var s=(i%2?1:-1)*(0.35+Math.random()*0.5),L=(18+Math.random()*26)*m,ex=p[0]+(bx*Math.cos(s)-by*Math.sin(s))*L,ey=p[1]+(by*Math.cos(s)+bx*Math.sin(s))*L+12*m,t0=T+i*0.07;
    fxP({k:'tr',x0:p[0],y0:p[1],x1:ex,y1:ey,t0:t0,d:0.9,c:'#FFF6D5',w:2.2,len:0.35,g:1});fxP({k:'fl',x:ex,y:ey,t0:t0+0.85,d:0.5,r:3.2,c:'#FFFDE7'});
    if(FX.lvl>=1)fxP({k:'sm',x:ex,y:ey,t0:t0+0.3,d:2.4,r0:2,r1:9,p0:1.5,p1:5,a:0.35,c:'236,236,232'});}};
/* 攻擊方有沒有火焰武器（背負式、車載火焰噴射器；奇幻的龍息） */
function fxFlamer(u){var L=u&&u.lg;if(L&&L.w&&L.w.some(function(x){return x[1]>0&&/^(flm|flmv|breath)$/.test(x[0]);}))return true;return !!u&&typeof fxWpn==='function'&&fxWpn(u)==='breath';}
function fxFlame(e){var a=e.a,T=FX.clk,m=mpp(),d=Math.hypot(e.x1-e.x0,e.y1-e.y0),p0=typeof fxFront==='function'&&ST(a).dom==='land'?fxFront(a,e.x0,e.y0,e.x1,e.y1):[e.x0,e.y0],ang=Math.atan2(e.y1-e.y0,e.x1-e.x0),reach=Math.min(d,Math.max(60,30*m)),n=fxLv(4,8);
  for(var i=0;i<n;i++){var sp=(Math.random()-0.5)*0.22,r=reach*(0.75+Math.random()*0.25),x1=p0[0]+Math.cos(ang+sp)*r,y1=p0[1]+Math.sin(ang+sp)*r,t0=T+i*0.05;
    fxP({k:'tr',x0:p0[0],y0:p0[1],x1:x1,y1:y1,t0:t0,d:0.35,c:i%3?'#FF8F00':'#FFD54F',w:4.5,len:0.9,g:1});fxP({k:'fl',x:x1,y:y1,t0:t0+0.3,d:0.4,r:5,c:'#FF6F00'});}
  var x2=p0[0]+Math.cos(ang)*reach,y2=p0[1]+Math.sin(ang)*reach;fxP({k:'fb',x:x2,y:y2,t0:T+0.3,d:0.9,sz:9});fxP({k:'sm',x:x2,y:y2,t0:T+0.4,d:5,r0:6,r1:30,p0:3,p1:14,a:0.55,c:'45,40,38'});if(typeof fxScorch==='function')fxScorch(x2,y2,14,T+0.5);}
(function(){var b=FXS.fire;FXS.fire=function(e){if(e&&e.a&&fxFlamer(e.a)&&Math.hypot(e.x1-e.x0,e.y1-e.y0)<300){fxFlame(e);if(fxWpn(e.a)==='breath')return;}return b.apply(this,arguments);};})();
if(FXS.melee)(function(){var b=FXS.melee;FXS.melee=function(e){if(e&&e.a&&fxFlamer(e.a))fxFlame(e);return b.apply(this,arguments);};})();
HELP14.push('<h4>對抗措施：熱焰彈、干擾絲與預警煙幕</h4><ul><li>飛機與直升機 1968 年起掛熱焰彈，騙過肩射與近程防空飛彈、近距空戰飛彈的紅外線尋標器；1965 年起投放干擾絲，干擾雷達導引的飛彈。察覺來襲時投放，這一擊的殺傷減少（熱焰彈約三成到四成五，2000 年後的成像紅外線飛彈較不易受騙；干擾絲約兩成）。每架次的熱焰彈有限，落地或返航後補滿。地圖上看得到飛機後方灑出的亮點與白煙。</li>'+
  '<li>有煙幕彈發射器的戰車與裝甲車，在敵方以反戰車飛彈射擊時可能搶在命中前施放煙幕：有雷射預警或軟殺主動防護的車大多察覺得到，否則要靠車長看見發射的煙塵（夜間更難）。煙幕擋住線導、雷射駕束等需要一直瞄準的飛彈，射後不理的成像紅外線飛彈較難擋。同一輛車 20 分鐘內不會重複施放。</li>'+
  '<li>火焰噴射器（背負式 1915 年起、車載 1940 年起）是極近距離的武器：射程只有幾十到一百多公尺，對躲在工事、建築裡的步兵特別有效，壓制力很強。近距離交火時地圖上畫出火舌、起火與黑煙。</li></ul>');
