/* ===================== v7：戰場視覺效果（曳光彈、部隊圓點、砲口煙塵、飛機剪影、爆炸）與即時合成音效 =====================
   特效只讀取模擬狀態、只用 Math.random（不動模擬的亂數），開關特效不會改變戰局。 */
var FX={lvl:2,smk:1,smA:1,smN:0,smNb:0,cs:null,sx:null,dots:true,planes:true,P:[],nb:[],Q:[],ev:[],sc:[],cap:false,ip:{},clk:0,last:0,cv:null,cx:null,wc:{},pt:{},burn:{},drawn:0,g:null,st:{ev:0,sp:0,ex:0,pl:0,dot:0,tr:0}};
var SND={on:true,vol:0.6,ac:null,out:null,noise:null,brown:null,n:0,tok:{},eng:[],amb:null,heat:0,load:1,cap:28,idle:0,st:{play:0,drop:0}};
(function(){try{var o=JSON.parse(localStorage.getItem('lato-warsim-fx')||'null');if(o){if(o.lvl!==undefined)FX.lvl=o.lvl;if(o.smk!==undefined)FX.smk=o.smk;FX.dots=o.dots!==false;FX.planes=o.planes!==false;SND.on=o.son!==false;if(o.vol!==undefined)SND.vol=o.vol;}}catch(e){}})();
function fxSave(){try{localStorage.setItem('lato-warsim-fx',JSON.stringify({lvl:FX.lvl,smk:FX.smk,dots:FX.dots,planes:FX.planes,son:SND.on,vol:SND.vol}));}catch(e){}}
/* 換了一場戰役（新局、讀檔）就清掉上一場留下的特效 */
function fxReset(){FX.g=G;FX.P=[];FX.nb=[];FX.Q=[];FX.sc=[];FX.ip={};FX.burn={};FX.hold=0;}
function fxWant(){return (FX.lvl>0||SND.on)&&!!G&&G.started&&!G.replay&&UI.tab==='battle';}
function fxLv(a,b){return FX.lvl>=2?b:a;}
function fxR(u){return clamp(55*Math.sqrt(Math.max(20,u&&u.men||100)/100),35,420);}
function fxJit(x,y,u){var r=fxR(u)*Math.sqrt(Math.random()),a=Math.random()*2*PI;return [x+Math.cos(a)*r,y+Math.sin(a)*r];}
/* 曳光彈顏色：取該方代表色的色相、提高飽和與亮度（灰黑色的一方用黃色） */
function fxTrC(side){var k='_trc'+side,sc=sideCol(side);if(FX[k]&&FX[k+'s']===sc)return FX[k];FX[k+'s']=sc;var q=rgbOf(sc),r=q[0]/255,g=q[1]/255,b=q[2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,h;if(d<0.08)return FX[k]='#FFE066';
  h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h=Math.round(h*60);if(h<0)h+=360;return FX[k]='hsl('+h+',100%,'+(h>40&&h<200?55:68)+'%)';}
/* 武器類別：依單位種類與年代（奇幻時代當作燧發槍時代） */
function fxGs(){var u=Math.max(1e-9,Math.random()),v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*PI*v);}
function fxEi(u){var E=uEra(u);return E.fan?1:E.i;}
function fxWpn(u){var k=u.mix&&u.mix.length?u.mix[0][0]:u.hq;if(FX.wc[k])return FX.wc[k];var s=ST(u),fan=!!uEra(u).fan,i=fxEi(u),br=s.br,w;
  if(fan&&br==='mon')w='claw';else if(fan&&br==='ash')w='bolt';else if(s.dom==='sea'||s.dom==='sub')w='naval';else if(s.dom==='air')w=s.fl.indexOf('Y')>=0?'breath':'airgun';
  else if(i<=3)w=br==='art'||s.fl.indexOf('g')>=0?'cannon0':br==='cav'?'cav':'musket';
  else if(br==='at'&&i>=7)w='atgm';else if(br==='arm'||br==='at'||br==='art'||br==='ad'||(s.hard>=0.5&&br!=='inf'))w='cannon';else if(br==='mg')w='mg';else if(br==='uav'&&s.fl.indexOf('d')>=0)w='fpv';else w='rifle';return FX.wc[k]=w;}
/* 部隊在畫面上的正面線（像素）：在符號外側、朝向交戰的敵人；圓點、方點與曳光彈的起訖點都在這條線上 */
function fxSymH(){return clamp(9+VW.s*2.2,12,24);}
function fxGeo(u,th,m){var h=fxSymH(),w=h*1.5,fx=Math.cos(th),fy=Math.sin(th);return {th:th,fx:fx,fy:fy,lx:-fy,ly:fx,half:clamp(frontW(u)/m/2,14,80),base:Math.abs(fx)*w/2+Math.abs(fy)*h/2+5+(fy>0?13*fy:0)};}
function fxFront(u,x,y,tx,ty){var m=mpp(),g=fxGeo(u,Math.atan2(ty-y,tx-x),m),lat=(Math.random()*2-1)*g.half,fwd=g.base+Math.random()*7;return [x+(g.lx*lat+g.fx*fwd)*m,y+(g.ly*lat+g.fy*fwd)*m];}
function fxTh(u,x,y){var me=UI.side,fog=me>=0&&G.set.fog&&!seeAll(),en=u._eid?uById(u._eid):null;if(en&&alive(en)){if(!fog||en.side===me)return Math.atan2(en.y-y,en.x-x);var kc=known(me,en.id,300);if(kc)return Math.atan2(kc.y-y,kc.x-x);}return u.hd||0;}

/* ---------- 事件擷取：包住傷害、砲擊、飛彈、地毯式轟炸與核爆（只記錄，不改變結果） ---------- */
(function(){var b=hit;hit=function(t,src,dm,dv,sup,kind){b(t,src,dm,dv,sup,kind);if(FX.cap&&src&&t&&kind!=='art'&&FX.ev.length<5000)FX.ev.push({k:kind,a:src,b:t,x0:src.x,y0:src.y,x1:t.x,y1:t.y,m:dm+dv*8,dv:dv});};})();
(function(){var b=artyFire;artyFire=function(u,s,M){b(u,s,M);if(FX.cap&&u.lastArt===G.t&&FX.ev.length<5000){var L=ARTL&&ARTL.id===u.id&&ARTL.t===G.t?ARTL:null;FX.ev.push({k:'art',a:u,x0:u.x,y0:u.y,x1:L?L.x:M.x,y1:L?L.y:M.y,r:M.r||300,m:M.mul||1,reg:!!(M.rg&&!M.reg),sat:M.kind==='sat',fa:L?L.fa:Math.atan2(M.y-u.y,M.x-u.x),sr:L?Math.round(L.sr):0,sd:L?Math.round(L.sd):0,sw:L?Math.round(L.sw):0});}};})();
(function(){var b=mslLaunch;mslLaunch=function(u,o){var r=b(u,o);if(r&&FX.cap)FX.ev.push({k:'mlaunch',a:u,x0:u.x,y0:u.y,x1:o.x,y1:o.y,m:o.n||2});return r;};})();
(function(){var b=carpetHit;carpetHit=function(side,src,cx,cy,ang,L,W,tons,o){var r=b.apply(null,arguments);if(FX.cap)FX.ev.push({k:'carpet',a:src,x1:cx,y1:cy,ang:ang,L:L,W:W,m:tons});return r;};})();
(function(){var b=nukeAt;nukeAt=function(side,x,y,Y){var r=b.apply(null,arguments);if(G&&G.started&&!G.replay)FX.ev.push({k:'nuke',x1:x,y1:y,m:Y});return r;};})();
(function(){var b=snukeAt;snukeAt=function(side,x,y,Y){var r=b.apply(null,arguments);if(G&&G.started&&!G.replay)FX.ev.push({k:'nuke',x1:x,y1:y,m:Y});return r;};})();
(function(){var b=simStep;simStep=function(){FX.cap=fxWant();b();if(FX.cap){try{fxIngest();}catch(e){if(!FX.err){FX.err=1;if(window.console)console.warn('fx',e);}}}FX.ev.length=0;};})();
/* 戰場迷霧：看不到的射手不畫砲口與彈道起點；兩邊都看不到就不畫 */
function fxVis(e){var me=UI.side;if(me<0||!G.set.fog||seeAll())return 1;var a=e.a,b=e.b;if(!a&&!b)return 1;var sa=!!a&&(a.side===me||!!known(me,a.id,180)),sb=!!b&&(b.side===me||!!known(me,b.id,180));return sa?1:sb?2:0;}
/* 一步（30 秒）裡發生的事件分散在到下一步之前的真實時間播放；數量超過預算時抽樣 */
function fxIngest(){var E=FX.ev,now=performance.now()/1000,Wr=UI.run?DT/Math.max(1,UI.speed):0.6,W=clamp(Wr,0.05,DT),nf=0,na=0;FX.st.ev+=E.length;
  /* 暫停時按「單步」：特效時鐘短暫走動，播完這一步的交火 */if(!UI.run)FX.hold=Math.max(FX.hold||0,W+1.2);
  E.forEach(function(e){if(e.k==='fire'||e.k==='melee'||e.k==='storm'||e.k==='grapple')nf++;else if(e.k==='art')na++;});
  var lv=FX.lvl,ff=Math.min(1,(lv>=2?40:lv===1?14:8)*Wr/Math.max(1,nf)),fa=Math.min(1,(lv>=2?10:lv===1?4:3)*Wr/Math.max(1,na));
  E.forEach(function(e){var v=fxVis(e);if(!v)return;e.hid=v===2;var k=e.k,keep=k==='fire'||k==='melee'||k==='storm'||k==='grapple'?Math.random()<ff:k==='art'?Math.random()<fa:true;if(!keep)return;FX.Q.push({at:FX.clk+(k==='nuke'||k==='carpet'||k==='mlaunch'?0:Math.random()*W),e:e});});
  if(FX.Q.length>4000)FX.Q.splice(0,FX.Q.length-4000);fxPlanesStep(now,W);
  (G._mslv||[]).forEach(function(q){if(q._fx)return;q._fx=1;if(G.t-q.t>DT*2)return;FX.Q.push({at:FX.clk,e:{k:'mhit',x1:q.x,y1:q.y,m:q.n,h:q.h,s:q.s}});});}
/* 飛機位置內插：在兩個模擬步之間平滑移動 */
function fxIpPos(ip,now){var f=clamp((now-ip.t0)/ip.d,0,1);return [ip.x0+(ip.x1-ip.x0)*f,ip.y0+(ip.y1-ip.y0)*f];}
function fxPlanesStep(now,W){var seen={};G.units.forEach(function(u){if(u.st!=='air'||!alive(u))return;seen[u.id]=1;var ip=FX.ip[u.id];if(!ip){FX.ip[u.id]={x0:u.x,y0:u.y,x1:u.x,y1:u.y,t0:now,d:W,hd:u.hd||0,tr:[],tt:0};return;}var c=fxIpPos(ip,now);ip.x0=c[0];ip.y0=c[1];if(Math.abs(u.x-ip.x1)+Math.abs(u.y-ip.y1)>1)ip.hd=Math.atan2(u.y-c[1],u.x-c[0]);ip.x1=u.x;ip.y1=u.y;ip.t0=now;ip.d=W;});for(var id in FX.ip)if(!seen[id])delete FX.ip[id];}
function fxPlanePos(u){var ip=u&&FX.ip[u.id];return ip?fxIpPos(ip,performance.now()/1000):[u.x,u.y];}

/* ---------- 粒子 ---------- */
function fxCap(){return Math.round((FX.lvl>=2?2600:900)*(typeof GFX!=='undefined'?GFX.fxMul*(GFX.memMul||1):1));}
/* 煙：依「煙霧」設定縮短、變淡、縮小，並限制畫面上同時存在的數量，避免煙把戰場蓋住；校正試射的白色標定煙不受影響 */
var SMK=[null,{d:0.55,a:0.55,r:0.75,cap:160},{d:0.85,a:0.85,r:0.95,cap:360}];
function fxSmoke(o){if(o.mk)return true;var S=SMK[FX.smk];if(!S)return false;if(FX.smN+FX.smNb>=S.cap*(FX.lvl>=2?1:0.6)*(typeof GFX!=='undefined'?GFX.fxMul:1))return false;FX.smNb++;o.d*=S.d;o.a*=S.a;o.r1=o.r0+(o.r1-o.r0)*S.r;if(o.p1!==undefined){o.p0*=S.r;o.p1*=S.r;}return true;}
function fxP(o){if(o.k==='sm'&&!fxSmoke(o))return;if(FX.P.length+FX.nb.length<fxCap()||o.k==='nk'){FX.nb.push(o);if(o.k==='tr')FX.st.tr++;}}
/* 爆炸：閃光、火球、衝擊環、碎屑、煙塵與留在地上的焦痕。大小以公尺計，但在畫面上有最小像素，拉遠時仍看得到 */
function fxEx(x,y,sz,t0){t0=t0===undefined?FX.clk:t0;var m=mpp(),big=sz>=25;fxP({k:'fl',x:x,y:y,t0:t0,d:0.13,r:Math.max(sz*1.3/m,big?9:6),c:'#FFFDE7'});fxP({k:'fb',x:x,y:y,t0:t0,d:big?0.7:0.5,sz:sz});
  if(sz>=12)fxP({k:'rg',x:x,y:y,t0:t0,d:big?0.5:0.36,r0:Math.max(sz*0.5/m,3),r1:Math.max(sz*3/m,big?32:19)});
  if(FX.lvl>=2)for(var i=0;i<(big?7:4);i++){var a=Math.random()*2*PI,L=Math.max(sz*2.2,(big?16:10)*m)*(0.5+Math.random()*0.7),d=0.45+Math.random()*0.4;fxP({k:'db',x:x,y:y,vx:Math.cos(a)*L/d,vy:Math.sin(a)*L/d,t0:t0,d:d});}
  for(var j=0;j<fxLv(1,big?3:2);j++)fxP({k:'sm',x:x+(Math.random()-0.5)*sz,y:y+(Math.random()-0.5)*sz,t0:t0+0.08+j*0.12,d:4+Math.random()*2.5,r0:sz*0.6,r1:sz*(2.2+Math.random()*1.2),p0:3,p1:big?20:13,a:0.5,c:j===0?'58,52,46':'122,112,98'});
  fxScorch(x,y,sz,t0);FX.st.ex++;}
/* 子彈打在地上的塵土 */
function fxKick(pt,t0,n,big){for(var j=0;j<n;j++){var x=pt[0]+(Math.random()-0.5)*90,y=pt[1]+(Math.random()-0.5)*90;fxP({k:'sm',x:x,y:y,t0:t0+Math.random()*0.4,d:1.5,r0:3,r1:big?22:12,p0:1.5,p1:big?8:5,a:0.4,c:'150,128,96'});}}
/* 車輛被擊毀：起火、黑煙慢慢升起 */
function fxWreck(x,y,t0){var n=fxLv(2,4);for(var j=0;j<n;j++){var t=t0+0.3+j*2.4;fxP({k:'fl',x:x,y:y,t0:t,d:0.5,r:2.6,c:j%2?'#FF8F00':'#FFB74D'});fxP({k:'sm',x:x,y:y,t0:t,d:6,r0:6,r1:36,p0:2.5,p1:11,a:0.5,c:'34,32,30'});}}
/* 地上的焦痕：畫在部隊符號底下，約兩分鐘（特效時鐘）後淡去 */
function fxScorch(x,y,sz,t0){if(FX.lvl<2&&sz<20)return;FX.sc.push({x:x,y:y,r:sz*0.55,t0:t0,a:Math.min(0.22,0.1+sz/260)});if(FX.sc.length>500)FX.sc.splice(0,FX.sc.length-500);}
function fxScorchDraw(c,m){if(!FX.sc.length)return;var T=FX.clk,keep=[];c.save();c.fillStyle='#2a2119';for(var i=0;i<FX.sc.length;i++){var q=FX.sc[i],age=T-q.t0;if(age>110)continue;keep.push(q);if(age<0)continue;var s=w2s(q.x,q.y),r=Math.max(q.r/m,2.2);if(s[0]<-r||s[1]<-r||s[0]>VW.cw+r||s[1]>VW.ch+r)continue;c.globalAlpha=q.a*(age>70?(110-age)/40:1);c.beginPath();c.arc(s[0],s[1],r,0,2*PI);c.fill();}FX.sc=keep;c.restore();}
var FXS={
 fire:function(e){var a=e.a,b=e.b,w=fxWpn(a),T=FX.clk,m=mpp(),i=fxEi(a),la=ST(a).dom==='land',lb=!!b&&ST(b).dom==='land',x0=e.x0,y0=e.y0,x1=e.x1,y1=e.y1;
   var q0=function(){return la?fxFront(a,x0,y0,x1,y1):fxJit(x0,y0,a);},q1=function(){return lb?fxFront(b,x1,y1,x0,y0):fxJit(x1,y1,b);};
   if(e.hid){/* 看不到的射手：只在目標附近畫出飛來的子彈 */var dd=Math.hypot(x1-x0,y1-y0),f=Math.min(1,Math.max(350,40*m)/Math.max(1,dd));x0=x1+(x0-x1)*f;y0=y1+(y0-y1)*f;q0=function(){return fxJit(x0,y0,null);};}
   var d=Math.hypot(x1-x0,y1-y0);
   if(w==='musket'||w==='cav'||w==='cannon0'){/* 火藥時代：齊射的閃光與大片白煙，鉛彈以淡色細線表示 */var cn=w==='cannon0',n=cn?fxLv(1,2):fxLv(3,6);
     for(var j=0;j<n;j++){var p0=q0(),p1=q1(),t0=T+j*0.05+Math.random()*0.15;if(!e.hid){fxP({k:'fl',x:p0[0],y:p0[1],t0:t0,d:0.12,r:cn?5:3,c:'#FFF3C4'});fxP({k:'sm',x:p0[0],y:p0[1],t0:t0,d:5+Math.random()*3,r0:6,r1:(cn?55:32)+Math.random()*18,p0:3,p1:cn?18:11,a:0.55,c:'236,236,230'});}
       fxP({k:'tr',x0:p0[0],y0:p0[1],x1:p1[0],y1:p1[1],t0:t0,d:clamp(d/(cn?1200:1600),0.12,0.7),c:cn?'#5D5A55':'#D7D2C4',w:cn?1.6:1,len:0.3,g:0,then:cn?{k:'ex',sz:12}:null});}
     if(!cn)fxKick(q1(),T+0.2,fxLv(1,2),false);return;}
   if(w==='atgm'||w==='fpv'){var a0=q0(),a1=q1();fxP({k:'rk',x0:a0[0],y0:a0[1],x1:a1[0],y1:a1[1],t0:T,d:clamp(d/(w==='fpv'?900:1500),0.4,2.2),c:'#FFE0B2',w:1.4,then:{k:'ex',sz:w==='fpv'?9:16}});if(!e.hid&&w==='atgm')fxP({k:'sm',x:a0[0],y:a0[1],t0:T,d:3,r0:4,r1:18,p0:2,p1:9,a:0.45,c:'225,222,215'});return;}
   if(w==='claw'){var c1=q1();fxP({k:'rg',x:c1[0],y:c1[1],t0:T,d:0.6,r0:3,r1:18,c:'#E3F2FD'});fxP({k:'sm',x:c1[0],y:c1[1],t0:T,d:2.5,r0:8,r1:40,p0:3,p1:12,a:0.5,c:'235,242,248'});return;}
   if(w==='cannon'||w==='naval'||w==='airgun'||w==='bolt'){var b0=q0(),b1=q1(),nv=w==='naval';if(!e.hid&&w!=='airgun'){fxP({k:'fl',x:b0[0],y:b0[1],t0:T,d:0.1,r:nv?6:4.5,c:w==='bolt'?'#F3E5F5':'#FFF8E1'});if(w!=='bolt')fxP({k:'sm',x:b0[0],y:b0[1],t0:T,d:3,r0:5,r1:nv?36:20,p0:2.5,p1:nv?14:9,a:0.38,c:'205,200,190'});}
     fxP({k:'tr',x0:b0[0],y0:b0[1],x1:b1[0],y1:b1[1],t0:T,d:clamp(d/(w==='bolt'?1500:3500),0.1,0.6),c:w==='bolt'?'#CE93D8':'#FFF59D',w:w==='bolt'?2.6:2.4,len:0.4,then:{k:'ex',sz:nv?34:w==='airgun'?8:15}});return;}
   /* 輕兵器與機槍：第一次大戰的機槍與第二次大戰以後才畫曳光彈；更早的子彈以淡色細線表示 */
   var yy=G.set.y||1943,tr=typeof featOn==='function'?featOn('tracer',yy)&&(w==='mg'||yy>=featY('tracer')+25):i>=6||(i===5&&w==='mg'),col=tr?fxTrC(a.side):'#D7D2C4';if(m>40){var z=q1();fxP({k:'fl',x:z[0],y:z[1],t0:T+Math.random()*0.4,d:0.1,r:1.8,c:'#FFF8D0'});return;}
   if(w==='mg'){var g0=q0(),aim=q1(),n2=fxLv(5,9);for(var k=0;k<n2;k++){var t1=T+k*0.06,a2=[aim[0]+(Math.random()-0.5)*70,aim[1]+(Math.random()-0.5)*70];fxP({k:'tr',x0:g0[0],y0:g0[1],x1:a2[0],y1:a2[1],t0:t1,d:clamp(d/2200,0.14,0.6),c:col,w:tr?2.1:1.2,len:0.3,g:tr?1:0});if(!e.hid&&k%2===0)fxP({k:'fl',x:g0[0],y:g0[1],t0:t1,d:0.06,r:3,c:'#FFF8D0'});}fxKick(aim,T+0.25,1,false);return;}
   var n3=fxLv(2,6);for(var k2=0;k2<n3;k2++){var r0=q0(),r1=q1(),t2=T+Math.random()*0.6;fxP({k:'tr',x0:r0[0],y0:r0[1],x1:r1[0],y1:r1[1],t0:t2,d:clamp(d/2200,0.14,0.55),c:col,w:tr?1.9:1.1,len:0.28,g:tr?1:0});if(!e.hid)fxP({k:'fl',x:r0[0],y:r0[1],t0:t2,d:0.07,r:2.6,c:'#FFF8D0'});}},
 melee:function(e){var mx=(e.x0+e.x1)/2,my=(e.y0+e.y1)/2,T=FX.clk,i=fxEi(e.a),m=mpp(),sp=Math.max(180,30*m);for(var j=0;j<fxLv(3,6);j++){var x=mx+(Math.random()-0.5)*sp,y=my+(Math.random()-0.5)*sp,t0=T+Math.random()*0.8;
   if(i<=3){fxP({k:'fl',x:x,y:y,t0:t0,d:0.08,r:2.2,c:'#ECEFF1'});fxP({k:'sm',x:x,y:y,t0:t0,d:3,r0:4,r1:14,p0:2,p1:7,a:0.3,c:'165,150,120'});}else if(Math.random()<0.25)fxEx(x,y,7,t0);else fxP({k:'tr',x0:x,y0:y,x1:x+(Math.random()-0.5)*sp*0.8,y1:y+(Math.random()-0.5)*sp*0.8,t0:t0,d:0.12,c:fxTrC(e.a.side),w:1.2,len:0.45,g:1});}},
 art:function(e){var a=e.a,s=ST(a),i=fxEi(a),T=FX.clk,m=mpp(),rk=s.br==='rkt'||s.fl.indexOf('z')>=0,sea=s.dom==='sea',bp=i<=3,d=Math.hypot(e.x1-e.x0,e.y1-e.y0);
   if(!e.hid){var ng=rk?fxLv(2,4):fxLv(2,3);for(var j=0;j<ng;j++){var p=s.dom==='land'?fxFront(a,e.x0,e.y0,e.x1,e.y1):fxJit(e.x0,e.y0,a),t0=T+j*(rk?0.1:0.18);
     fxP({k:'fl',x:p[0],y:p[1],t0:t0,d:0.14,r:rk?4:sea?7:5.5,c:'#FFE9B0'});fxP({k:'sm',x:p[0],y:p[1],t0:t0,d:bp?7:rk?5:4,r0:6,r1:bp?60:rk?50:32,p0:3,p1:bp?20:rk?16:12,a:bp?0.6:0.45,c:bp?'240,240,234':rk?'218,215,208':'176,166,150'});
     if(!bp&&!sea&&FX.lvl>=2)fxP({k:'rg',x:p[0],y:p[1],t0:t0,d:0.45,r0:2,r1:Math.max(10,30/m),c:'#C8B89A'});}}
   var nS=e.reg?1:clamp(Math.round((e.sat?3:1.4)*Math.sqrt(e.m||1)*fxLv(2,4)),1,10),fl=clamp(d/4500,0.6,2.2);
   var fa=e.fa!==undefined?e.fa:Math.atan2(e.y1-e.y0,e.x1-e.x0),cu=Math.cos(fa),su=Math.sin(fa),sr=e.sr||(e.r||300)*0.3,sd=e.sd||(e.r||300)*0.12,sw=e.sw!==undefined?e.sw:(e.r||300)*0.25,vt=T+Math.random()*0.3;
   /* 彈著依散布：沿射向前後較散、左右較集中；各砲並排，一齊射的砲彈排成一條橫向的彈幕 */
   for(var k=0;k<nS;k++){var ga=fxGs()*sr,gb=fxGs()*sd+(nS>1?(-1+2*(k+0.5)/nS)*sw:0),tx=e.x1+cu*ga-su*gb,ty=e.y1+su*ga+cu*gb,t1=rk?T+k*0.08:vt+Math.random()*0.25,then={k:e.reg?'wp':'ex',sz:bp?14:sea?32:22};
     if(rk&&!e.hid)fxP({k:'rk',x0:e.x0,y0:e.y0,x1:tx,y1:ty,t0:t1,d:fl*0.8,c:'#FFCC80',w:1.4,then:then});else fxP({k:'sh',x0:e.hid?tx:e.x0,y0:e.hid?ty:e.y0,x1:tx,y1:ty,t0:t1,d:e.hid?0.02:fl,then:then});}},
 airstrike:function(e){var a=e.a,s=ST(a),y=fxEi(a),pp=fxPlanePos(a),T=FX.clk,heli=s.br==='heli',rocket=heli||(y>=7)||(s.fl.indexOf('v')<0&&s.fl.indexOf('w')<0&&y>=6&&Math.random()<0.4);
   for(var j=0;j<fxLv(1,3);j++){var q=fxJit(e.x1,e.y1,e.b),t0=T+j*0.18;if(rocket)fxP({k:'rk',x0:pp[0],y0:pp[1],x1:q[0],y1:q[1],t0:t0,d:0.75,c:'#FFE0B2',w:1.3,then:{k:'ex',sz:20}});else fxP({k:'bm',x0:pp[0],y0:pp[1],x1:q[0],y1:q[1],t0:t0,d:1.1+Math.random()*0.4,then:{k:'ex',sz:s.fl.indexOf('v')>=0?45:30}});}},
 breath:function(e){var pp=fxPlanePos(e.a),T=FX.clk;for(var j=0;j<fxLv(4,9);j++){var f=Math.random(),x=pp[0]+(e.x1-pp[0])*f+(Math.random()-0.5)*90,y=pp[1]+(e.y1-pp[1])*f+(Math.random()-0.5)*90;fxP({k:'fl',x:x,y:y,t0:T+f*0.4,d:0.35,r:2+f*4,c:f<0.5?'#FFE082':'#FF7043'});}fxP({k:'sm',x:e.x1,y:e.y1,t0:T+0.4,d:5,r0:15,r1:60,a:0.35,c:'60,50,40'});},
 aa:function(e){var g=e.a,a=e.b,T=FX.clk,pp=fxPlanePos(a),sam=typeof samOf==='function'&&samOf(g),y=fxEi(g);if(e.m>0.3)FX.burn[a.id]=T+4;
   if(sam){fxP({k:'rk',x0:e.x0,y0:e.y0,x1:pp[0]+(Math.random()-0.5)*300,y1:pp[1]+(Math.random()-0.5)*300,t0:T,d:clamp(Math.hypot(pp[0]-e.x0,pp[1]-e.y0)/2500,0.5,3),c:'#FFF3E0',w:1.6,then:{k:'fk',sz:30}});return;}
   for(var j=0;j<fxLv(2,5);j++){var t0=T+Math.random()*0.8;if(y>=5&&Math.random()<0.6)fxP({k:'tr',x0:e.x0+(Math.random()-0.5)*120,y0:e.y0+(Math.random()-0.5)*120,x1:pp[0]+(Math.random()-0.5)*500,y1:pp[1]+(Math.random()-0.5)*500,t0:t0,d:0.5,c:fxTrC(g.side),w:1,len:0.2});fxP({k:'fk',x:pp[0]+(Math.random()-0.5)*700,y:pp[1]+(Math.random()-0.5)*700,t0:t0+0.35,d:2.8,sz:22});}},
 air:function(e){var p0=fxPlanePos(e.a),p1=fxPlanePos(e.b),d=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]),T=FX.clk;if(e.m>0.3)FX.burn[e.b.id]=T+4;
   if(fxEi(e.a)>=7&&d>3000){fxP({k:'rk',x0:p0[0],y0:p0[1],x1:p1[0],y1:p1[1],t0:T,d:clamp(d/3000,0.5,3),c:'#FFFFFF',w:1.2,then:{k:'fk',sz:25}});return;}
   for(var j=0;j<fxLv(3,6);j++)fxP({k:'tr',x0:p0[0],y0:p0[1],x1:p1[0]+(Math.random()-0.5)*200,y1:p1[1]+(Math.random()-0.5)*200,t0:T+j*0.06,d:0.25,c:fxTrC(e.a.side),w:1,len:0.25});},
 mlaunch:function(e){var T=FX.clk;fxP({k:'fl',x:e.x0,y:e.y0,t0:T,d:0.25,r:5,c:'#FFF3E0'});for(var j=0;j<fxLv(2,4);j++)fxP({k:'sm',x:e.x0+(Math.random()-0.5)*80,y:e.y0+(Math.random()-0.5)*80,t0:T+j*0.1,d:7,r0:12,r1:70,a:0.4,c:'225,222,215'});},
 mhit:function(e){var T=FX.clk,lk=Math.max(0,(e.m||1)-(e.s||0));for(var j=0;j<Math.min(4,Math.max(1,lk));j++)fxEx(e.x1+(Math.random()-0.5)*120,e.y1+(Math.random()-0.5)*120,j<(e.h||0)?32:22,T+j*0.12);for(var k=0;k<Math.min(4,e.s||0);k++)fxP({k:'fk',x:e.x1+(Math.random()-0.5)*1500,y:e.y1+(Math.random()-0.5)*1500,t0:T+Math.random()*0.5,d:2.5,sz:26});},
 carpet:function(e){var T=FX.clk,fx=Math.cos(e.ang),fy=Math.sin(e.ang),n=clamp(Math.round(e.L/(FX.lvl>=2?110:220)),5,30);for(var j=0;j<n;j++){var f=j/(n-1)-0.5,l=(Math.random()-0.5)*e.W,x=e.x1+fx*f*e.L-fy*l,y=e.y1+fy*f*e.L+fx*l;fxP({k:'bm',x0:x-fx*600,y0:y-fy*600,x1:x,y1:y,t0:T+j*0.09,d:1.0,then:{k:'ex',sz:38}});}},
 nuke:function(e){var c=Math.cbrt(Math.max(0.01,e.m||15)/1000);fxP({k:'nk',x:e.x1,y:e.y1,t0:FX.clk,d:40,fb:Math.max(60,900*c),r5:Math.max(400,6900*c)});}};
FXS.storm=FXS.grapple=FXS.melee;
function fxSpawn(e){if(FX.lvl>0){var f=FXS[e.k];if(f){try{f(e);if(e.dv>=0.6&&FX.lvl>=2&&e.b&&ST(e.b).dom==='land'){var w=fxFront(e.b,e.x1,e.y1,e.x0,e.y0);fxWreck(w[0],w[1],FX.clk+0.4);}}catch(x){}}}if(SND.on&&SND.ac){try{sndEv(e);}catch(x){}}FX.st.sp++;}
function fxThen(p){var t=p.then,T=p.t0+p.d;if(t.k==='ex')fxEx(p.x1,p.y1,t.sz,T);else if(t.k==='wp'){fxP({k:'fl',x:p.x1,y:p.y1,t0:T,d:0.1,r:3,c:'#FFFFFF'});fxP({k:'sm',x:p.x1,y:p.y1,t0:T,d:7,r0:8,r1:45,a:0.6,c:'250,250,250',mk:1});}else if(t.k==='fk')fxP({k:'fk',x:p.x1,y:p.y1,t0:T,d:2.6,sz:t.sz||24});
  if(p.k==='rk')fxP({k:'ln',x0:p.x0,y0:p.y0,x1:p.x1,y1:p.y1,t0:T,d:3,w:p.w||1.2});}

/* ---------- 每一畫格：依特效時鐘產生排程中的事件、更新音效、繪製特效圖層 ---------- */
function fxFrame(ts){requestAnimationFrame(fxFrame);if(G&&FX.g!==G)fxReset();var now=ts/1000,dt=FX.last?Math.min(0.1,now-FX.last):0;FX.last=now;
  /* 畫面變慢時自動減少同時播放的聲音 */if(dt>0){FX.ema=FX.ema?FX.ema*0.96+dt*1000*0.04:dt*1000;SND.load=clamp((42-FX.ema)/20,0.35,1);SND.cap=Math.round(10+18*SND.load);}var run=!!(G&&G.started&&UI.run&&!G.over&&UI.tab==='battle');if(run)FX.clk+=dt;else if(FX.hold>0&&UI.tab==='battle'){FX.clk+=dt;FX.hold-=dt;}
  if(FX.Q.length){var keep=[];for(var i=0;i<FX.Q.length;i++){var q=FX.Q[i];if(q.at<=FX.clk)fxSpawn(q.e);else keep.push(q);}FX.Q=keep;}
  if(!run&&G&&G.started&&UI.tab!=='battle'&&FX.Q.length)FX.Q=[];
  try{sndFrame(dt,run);}catch(e){}try{fxDraw(now);}catch(e){if(!FX.err2){FX.err2=1;if(window.console)console.warn('fxdraw',e);}}}
function fxDraw(now){var cv=FX.cv,c=FX.cx;if(!cv||!c||!cv.isConnected)return;var on=G&&G.started&&!G.replay&&UI.tab==='battle'&&FX.lvl>0&&UI.lay.fx!==0,d=VW.dpr||1;c.setTransform(d,0,0,d,0,0);var c2=FX.sx&&FX.cs&&FX.cs.isConnected?FX.sx:null;if(c2)c2.setTransform(d,0,0,d,0,0);
  /* 暫停時煙霧在約一秒內淡到兩成，方便觀察戰局；繼續播放後恢復 */var dtR=FX.ld?Math.min(0.1,now-FX.ld):0;FX.ld=now;FX.smA+=((UI.run||FX.hold>0?1:0.2)-FX.smA)*Math.min(1,dtR*3.5);
  if(!on){if(FX.drawn){c.clearRect(0,0,VW.cw,VW.ch);if(c2)c2.clearRect(0,0,VW.cw,VW.ch);FX.drawn=0;FX.P=[];FX.nb=[];FX.smN=0;}FX.smNb=0;return;}
  if(FX.nb.length){FX.P=FX.P.concat(FX.nb);FX.nb=[];}FX.smNb=0;/* 沒有東西可畫、畫布也已經是空的：不要每一格都清除（會讓瀏覽器重新合成整個圖層） */if(!FX.P.length&&!FX.drawn&&!(G.msl&&G.msl.length)&&!Object.keys(FX.burn).length)return;c.clearRect(0,0,VW.cw,VW.ch);if(c2)c2.clearRect(0,0,VW.cw,VW.ch);c.lineCap='round';var m=mpp(),T=FX.clk,P=FX.P,keep=[],W=G.env||{},wd=W.wd===undefined?0.6:W.wd;
  /* 飛彈飛行軌跡上的煙、受損飛機冒煙 */if(FX.lvl>=2&&UI.run&&Math.random()<0.5){(G.msl||[]).forEach(function(S){if(UI.side>=0&&S.side!==UI.side&&!S.det&&G.set.fog)return;var f=clamp((G.t-S.t0)/Math.max(1,S.eta-S.t0),0,1);fxP({k:'sm',x:S.x0+(S.x-S.x0)*f,y:S.y0+(S.y-S.y0)*f,t0:T,d:2.5,r0:5,r1:22,a:0.35,c:'230,228,222'});});
    for(var id in FX.burn){if(FX.burn[id]<T){delete FX.burn[id];continue;}var u=uById(+id);if(u&&u.st==='air'){var pp=fxPlanePos(u);fxP({k:'sm',x:pp[0],y:pp[1],t0:T,d:2.2,r0:6,r1:24,a:0.5,c:'40,38,36'});}}}
  var nd=0,ns=0;for(var i=0;i<P.length;i++){var p=P[i],f=(T-p.t0)/p.d;if(f>=1){if(p.then)fxThen(p);continue;}keep.push(p);if(p.k==='sm')ns++;if(f<0)continue;fxDrawP(p.k==='sm'&&c2?c2:c,p,f,m,T,wd);nd++;}FX.P=keep;FX.smN=ns;FX.drawn=nd>0?1:0;c.globalAlpha=1;if(c2)c2.globalAlpha=1;}
function fxDrawP(c,p,f,m,T,wd){var s,r,a;switch(p.k){
  case 'tr':{var hx=p.x0+(p.x1-p.x0)*f,hy=p.y0+(p.y1-p.y0)*f,g=Math.max(0,f-p.len),s0=w2s(p.x0+(p.x1-p.x0)*g,p.y0+(p.y1-p.y0)*g),s1=w2s(hx,hy);c.strokeStyle=p.c;if(p.g!==0){c.globalAlpha=0.3;c.lineWidth=p.w+2.8;c.beginPath();c.moveTo(s0[0],s0[1]);c.lineTo(s1[0],s1[1]);c.stroke();}c.globalAlpha=p.g===0?0.7:1;c.lineWidth=p.w;c.beginPath();c.moveTo(s0[0],s0[1]);c.lineTo(s1[0],s1[1]);c.stroke();return;}
  case 'fl':s=w2s(p.x,p.y);c.globalAlpha=1-f;c.fillStyle=p.c;c.beginPath();c.arc(s[0],s[1],p.r*(1+f*0.6),0,2*PI);c.fill();return;
  case 'sm':{var dr=(T-p.t0)*7;s=w2s(p.x+Math.cos(wd)*dr,p.y+Math.sin(wd)*dr);var sf=Math.sqrt(f);/* 拉遠時縮小最小尺寸、淡一些，免得一團團煙蓋住整個戰區 */r=clamp(Math.max((p.r0+(p.r1-p.r0)*sf)/m,p.p0===undefined?0:(p.p0+(p.p1-p.p0)*sf)*clamp(16/m,0.45,1)),1.5,90);a=p.a*(1-f)*(f<0.08?f/0.08:1)*(p.mk?Math.max(FX.smA,0.6):FX.smA)*(m>20?clamp(1-(m-20)/100,0.6,1):1);if(a<0.004)return;c.globalAlpha=1;c.fillStyle='rgba('+p.c+','+a.toFixed(3)+')';c.beginPath();c.arc(s[0],s[1],r,0,2*PI);c.fill();return;}
  case 'fb':{s=w2s(p.x,p.y);var R=Math.max(p.sz/m,p.sz>=25?10:6.5);r=clamp(R*(0.45+0.55*Math.min(1,f*3)),2,70);c.globalAlpha=(1-f)*0.95;c.fillStyle=f<0.3?'#FFB300':f<0.6?'#F4511E':'#6D2400';c.beginPath();c.arc(s[0],s[1],r,0,2*PI);c.fill();if(f<0.35){c.globalAlpha=1-f/0.35;c.fillStyle='#FFF59D';c.beginPath();c.arc(s[0],s[1],r*0.5,0,2*PI);c.fill();}return;}
  case 'rg':{s=w2s(p.x,p.y);r=p.r0+(p.r1-p.r0)*(1-Math.pow(1-f,2.2));c.globalAlpha=0.6*(1-f);c.strokeStyle=p.c||'#FFFFFF';c.lineWidth=1.6;c.beginPath();c.arc(s[0],s[1],r,0,2*PI);c.stroke();return;}
  case 'db':s=w2s(p.x+p.vx*f*p.d,p.y+p.vy*f*p.d);c.globalAlpha=1-f*f;c.fillStyle='#2b2520';c.fillRect(s[0]-1.1,s[1]-1.1,2.2,2.2);return;
  case 'sh':{if(m>40)return;s=w2s(p.x0+(p.x1-p.x0)*f,p.y0+(p.y1-p.y0)*f);var e0=w2s(p.x0,p.y0),e1=w2s(p.x1,p.y1),ux=e1[0]-e0[0],uy=e1[1]-e0[1],ul=Math.hypot(ux,uy)||1,tl=Math.min(9,ul*f);c.globalAlpha=0.45;c.strokeStyle='#3a3a3a';c.lineWidth=1.3;c.beginPath();c.moveTo(s[0]-ux/ul*tl,s[1]-uy/ul*tl);c.lineTo(s[0],s[1]);c.stroke();c.globalAlpha=0.9;c.fillStyle='#2a2a2a';c.beginPath();c.arc(s[0],s[1],1.6,0,2*PI);c.fill();return;}
  case 'bm':{s=w2s(p.x0+(p.x1-p.x0)*f,p.y0+(p.y1-p.y0)*f);c.globalAlpha=1;c.fillStyle='#222';c.beginPath();c.arc(s[0],s[1],1.4+1.2*(1-f),0,2*PI);c.fill();return;}
  case 'rk':{var hx2=p.x0+(p.x1-p.x0)*f,hy2=p.y0+(p.y1-p.y0)*f,b0=w2s(p.x0,p.y0),b1=w2s(hx2,hy2);c.globalAlpha=0.55;c.strokeStyle='#E8E6E0';c.lineWidth=(p.w||1.2)+0.8;c.beginPath();c.moveTo(b0[0],b0[1]);c.lineTo(b1[0],b1[1]);c.stroke();c.globalAlpha=1;c.fillStyle=p.c;c.beginPath();c.arc(b1[0],b1[1],1.9,0,2*PI);c.fill();return;}
  case 'ln':{var e0=w2s(p.x0,p.y0),e1=w2s(p.x1,p.y1);c.globalAlpha=0.45*(1-f);c.strokeStyle='#E8E6E0';c.lineWidth=(p.w||1.2)+0.8;c.beginPath();c.moveTo(e0[0],e0[1]);c.lineTo(e1[0],e1[1]);c.stroke();return;}
  case 'fk':s=w2s(p.x,p.y);r=clamp(Math.max(p.sz/m,5)*(0.5+0.5*Math.sqrt(f)),2,30);if(f<0.05){c.globalAlpha=1;c.fillStyle='#FFE082';c.beginPath();c.arc(s[0],s[1],r*0.6,0,2*PI);c.fill();}c.globalAlpha=0.7*(1-f);c.fillStyle='#2e2e2e';c.beginPath();c.arc(s[0],s[1],r,0,2*PI);c.fill();return;
  case 'nk':fxNukeDraw(c,p,f,m,T);return;}}
/* 核爆：閃光、火球、衝擊波與擴散的雲；以俯視角度表現 */
function fxNukeDraw(c,p,f,m,T){var t=T-p.t0,s=w2s(p.x,p.y);if(t<0.8){c.globalAlpha=0.85*(1-t/0.8);c.fillStyle='#FFFFFF';c.fillRect(0,0,VW.cw,VW.ch);}
  var fb=p.fb/m*Math.min(1,t/1.2);c.globalAlpha=Math.max(0,1-t/10);c.fillStyle=t<3?'#FFF3E0':t<6?'#FF8A65':'#8D3B2B';c.beginPath();c.arc(s[0],s[1],Math.max(3,fb),0,2*PI);c.fill();
  var sw=Math.min(p.r5,t*320)/m;if(t<14){c.globalAlpha=0.6*(1-t/14);c.strokeStyle='#ECEFF1';c.lineWidth=2;c.beginPath();c.arc(s[0],s[1],sw,0,2*PI);c.stroke();}
  var cl=p.fb*(1.2+Math.min(2.2,t/8))/m,dr=t*12/m;c.globalAlpha=Math.min(0.75,t/2)*(1-f);c.fillStyle='rgba(120,104,92,1)';c.beginPath();c.arc(s[0]+dr,s[1]-dr*0.3,Math.max(4,cl),0,2*PI);c.fill();c.globalAlpha=Math.min(0.6,t/2)*(1-f);c.fillStyle='rgba(205,185,165,1)';c.beginPath();c.arc(s[0]+dr,s[1]-dr*0.3,Math.max(3,cl*0.62),0,2*PI);c.fill();}

/* ---------- 部隊圓點：交戰時步兵畫成圓點、車輛畫成方點，沿正面展開；凝結尾 ---------- */
function fxHash(n){var x=Math.sin(n*12.9898+78.233)*43758.5453;return x-Math.floor(x);}
function fxUnder(c){if(!G||!G.started||G.replay||UI.lay.fx===0)return;if(FX.g!==G)fxReset();var now=performance.now()/1000,m=mpp(),me=UI.side,fog=me>=0&&G.set.fog&&!seeAll();fxScorchDraw(c,m);
  /* 噴射機的凝結尾 */if(FX.planes)for(var id in FX.ip){var ip=FX.ip[id],u=uById(+id);if(!u||u.st!=='air')continue;if(fog&&u.side!==me&&!known(me,u.id,120))continue;var ty=fxPType(u);if(ty!=='jet'&&ty!=='jbomb')continue;var pp=fxIpPos(ip,now);if(now-ip.tt>0.25){ip.tt=now;ip.tr.push([pp[0],pp[1]]);if(ip.tr.length>14)ip.tr.shift();}
    if(ip.tr.length>1){c.save();c.lineCap='round';for(var k=1;k<ip.tr.length;k++){var a0=w2s(ip.tr[k-1][0],ip.tr[k-1][1]),a1=w2s(ip.tr[k][0],ip.tr[k][1]);c.globalAlpha=0.32*k/ip.tr.length;c.strokeStyle='#FFFFFF';c.lineWidth=2.2;c.beginPath();c.moveTo(a0[0],a0[1]);c.lineTo(a1[0],a1[1]);c.stroke();}c.restore();}}
  /* 交戰中的部隊：步兵每個圓點約一個班、車輛每個方點約一輛，沿正面散開在符號前方；進攻時兩組交互躍進，潰散時往後散開 */
  if(!FX.dots||m>30)return;var cnt=0;c.save();c.lineWidth=0.9;c.strokeStyle='rgba(12,14,18,.9)';
  G.units.forEach(function(u){if(cnt>=160||!isLeaf(u)||!onMap(u))return;var s=ST(u),rl=roleOf(u);if(s.dom!=='land'||s.fl.indexOf('u')>=0||(rl!=='man'&&rl!=='rec'))return;var x=u.x,y=u.y;
    if(fog&&u.side!==me){var kc=known(me,u.id,120);if(!kc||kc.q<1)return;x=kc.x;y=kc.y;}
    var fired=G.t-(u.fired||-1e9)<DT*3,shot=G.t-(u.uf||-1e9)<DT*3,att=!!u.ord&&/attack|storm|breakthrough|penetrate|pursue|landing/.test(u.ord.k)&&(u._ed<3000||fired),rout=u.ms==='rout'&&G.t-(u.uf||-1e9)<900;if(!att&&!fired&&!shot&&!rout)return;
    var p=w2s(x,y);if(p[0]<-150||p[1]<-150||p[0]>VW.cw+150||p[1]>VW.ch+150)return;cnt++;
    var th=fxTh(u,x,y),g=fxGeo(u,th,m),col=sideCol(u.side),dk=hexOf(mixC(rgbOf(col),[0,0,0],0.3)),arm=s.br==='arm',veh=(s.mob==='track'||s.mob==='wheel'||arm||s.br==='mech')&&fxEi(u)>=5,
      nI=arm?0:clamp(Math.round(u.men/10),veh?2:3,22),nV=veh?clamp(Math.round(u.veh||0),1,12):0,flash=fired&&UI.run,ph=now*0.42+fxHash(u.id)*3,i,lat,fwd,sx,sy,k1;
    /* 車輛：戰車在最前，裝甲運兵車與卡車跟在步兵後面 */
    for(i=0;i<nV;i++){k1=fxHash(u.id*53+i);lat=((i+0.5)/nV-0.5)*2*g.half*0.9+(k1-0.5)*5;fwd=(arm?g.base+4:g.base+15)+(k1-0.5)*4;if(att&&!rout)fwd+=fxBound(ph,i)*7;if(rout)fwd=-g.base*0.6-((now*6+k1*30)%26);
      sx=p[0]+g.lx*lat+g.fx*fwd;sy=p[1]+g.ly*lat+g.fy*fwd;c.save();c.translate(sx,sy);c.rotate(rout?th+PI:th);c.globalAlpha=0.97;c.fillStyle=dk;c.fillRect(-4.2,-3.2,8.4,6.4);c.strokeRect(-4.2,-3.2,8.4,6.4);if(arm){c.beginPath();c.moveTo(0,0);c.lineTo(8.5,0);c.lineWidth=1.7;c.stroke();c.lineWidth=0.9;}c.restore();FX.st.dot++;
      if(flash&&!rout&&Math.random()<0.12){c.globalAlpha=1;c.fillStyle='#FFF59D';c.beginPath();c.arc(sx+g.fx*10.5,sy+g.fy*10.5,3,0,2*PI);c.fill();}}
    /* 步兵：兩列錯開 */
    for(i=0;i<nI;i++){k1=fxHash(u.id*37+i);var k2=fxHash(u.id*91+i*7);lat=((i+0.5)/nI-0.5)*2*g.half+(k1-0.5)*6;fwd=g.base+2+(i%2)*7+(k2-0.5)*5;if(att&&!rout)fwd+=fxBound(ph,i)*8;if(rout){fwd=-g.base*0.5-((now*10+k2*40)%38);lat*=1.5;}
      sx=p[0]+g.lx*lat+g.fx*fwd;sy=p[1]+g.ly*lat+g.fy*fwd;c.globalAlpha=0.97;c.fillStyle=col;c.beginPath();c.arc(sx,sy,2.9,0,2*PI);c.fill();c.stroke();FX.st.dot++;
      if(flash&&!rout&&Math.random()<0.12){c.globalAlpha=1;c.fillStyle='#FFF59D';c.beginPath();c.arc(sx+g.fx*4.6,sy+g.fy*4.6,2.3,0,2*PI);c.fill();}}});c.restore();}
/* 交互躍進：兩組圓點輪流向前衝一小段 */
function fxBound(ph,i){var f=(ph+((i>>1)&1)*0.5)%1;return f<0.5?Math.sin(f*PI):Math.cos((f-0.5)*PI);}
(function(){var b=drawMissions;drawMissions=function(c){if(FX.lvl>0){try{fxUnder(c);}catch(e){}}b(c);};})();
/* 舊的直線火力線：開啟特效時改由曳光彈表示 */
(function(){var b=drawFx;drawFx=function(c){if(FX.lvl>0){G._fx=(G._fx||[]).filter(function(f){return G.t-f[5]<=DT*2;});return;}b(c);};})();

/* ---------- 飛機剪影：取代空中單位的框形符號（仍可點選），兩步之間平滑移動 ---------- */
function fxPType(u){var k=u.mix&&u.mix.length?u.mix[0][0]:u.hq;if(FX.pt[k])return FX.pt[k];var s=ST(u),i=fxEi(u),t;
  if(s.br==='heli'||s.sym==='heli')t='heli';else if(s.br==='uav')t='drone';else if(s.br==='ash'||s.fl.indexOf('Z')>=0)t='airship';else if(s.br==='drg'||s.fl.indexOf('Y')>=0)t='dragon';
  else{var big=s.fl.indexOf('v')>=0||s.men/Math.max(1,s.veh)>=4||/轟炸|運輸|預警|監視|加油/.test(s.n||'');t=big?(i>=7?'jbomb':'bomber'):(i>=7?'jet':'prop');}return FX.pt[k]=t;}
var FXSH={jet:[[0.55,0],[0.3,0.06],[0.06,0.1],[-0.16,0.48],[-0.28,0.48],[-0.22,0.1],[-0.38,0.09],[-0.5,0.26],[-0.56,0.26],[-0.52,0.04]],
  prop:[[0.5,0],[0.44,0.07],[0.14,0.07],[0.11,0.52],[-0.04,0.52],[-0.07,0.07],[-0.38,0.05],[-0.42,0.2],[-0.5,0.2],[-0.5,0.02]],
  bomber:[[0.5,0],[0.42,0.07],[0.16,0.07],[0.13,0.62],[-0.02,0.62],[-0.05,0.07],[-0.38,0.05],[-0.42,0.24],[-0.5,0.24],[-0.5,0.03]],
  jbomb:[[0.5,0],[0.38,0.06],[0.12,0.07],[-0.16,0.6],[-0.3,0.6],[-0.12,0.08],[-0.38,0.06],[-0.46,0.25],[-0.52,0.25],[-0.5,0.03]],
  drone:[[0.42,0],[0.32,0.04],[0.06,0.04],[0.03,0.56],[-0.06,0.56],[-0.07,0.04],[-0.36,0.03],[-0.46,0.16],[-0.5,0.13],[-0.44,0.02]],
  dragon:[[0.5,0],[0.32,0.06],[0.12,0.09],[0.02,0.56],[-0.1,0.3],[-0.2,0.5],[-0.26,0.12],[-0.58,0.04]]};
function planePath(c,ty,x,y,th,sz){c.save();c.translate(x,y);c.rotate(th);c.beginPath();if(ty==='heli'){c.ellipse(0.12*sz,0,0.22*sz,0.13*sz,0,0,2*PI);c.rect(-0.5*sz,-0.03*sz,0.45*sz,0.06*sz);c.rect(-0.52*sz,-0.12*sz,0.06*sz,0.24*sz);}
  else if(ty==='airship'){c.ellipse(0,0,0.5*sz,0.18*sz,0,0,2*PI);c.rect(-0.5*sz,-0.24*sz,0.12*sz,0.48*sz);}
  else{var S=FXSH[ty]||FXSH.prop;S.forEach(function(q,i){if(i)c.lineTo(q[0]*sz,q[1]*sz);else c.moveTo(q[0]*sz,q[1]*sz);});for(var i=S.length-1;i>=0;i--)c.lineTo(S[i][0]*sz,-S[i][1]*sz);c.closePath();}c.restore();}
function fxPlane(c,o){var u=o.u,s=ST(u),ty=fxPType(u),x=o.x,y=o.y,sz=clamp((o.h||16)*1.35,13,34)*(ty==='bomber'||ty==='jbomb'||ty==='airship'?1.2:ty==='drone'?0.8:1),ip=FX.ip[u.id],th=ip?ip.hd:(u.hd||0),col=sideCol(u.side),n=u.veh>=6?3:u.veh>=2?2:1,low=s.fl.indexOf('A')>=0||ty==='heli',sh=low?0.18:0.42;
  c.save();c.globalAlpha=o.alpha===undefined?1:o.alpha;if(o.sel){c.beginPath();c.arc(x,y,sz*0.9,0,2*PI);c.fillStyle='rgba(255,235,59,.4)';c.fill();c.lineWidth=2;c.strokeStyle='#FFC107';c.stroke();}
  for(var k=n-1;k>=0;k--){var ox=k?-0.6:0,oy=k===1?0.6:k===2?-0.6:0,sc=k?0.72:1,px=x+Math.cos(th)*ox*sz-Math.sin(th)*oy*sz,py=y+Math.sin(th)*ox*sz+Math.cos(th)*oy*sz;
    planePath(c,ty,px+sz*sh,py+sz*sh*1.2,th,sz*sc);c.fillStyle='rgba(0,0,0,.22)';c.fill();planePath(c,ty,px,py,th,sz*sc);c.fillStyle=k?lighten(col,0.3):col;c.fill();c.lineWidth=1.1;c.strokeStyle=o.ms==='rout'?'#C62828':'#101418';c.stroke();
    if(ty==='heli'){var ra=performance.now()/1000*24;c.save();c.translate(px+Math.cos(th)*0.12*sz*sc,py+Math.sin(th)*0.12*sz*sc);c.globalAlpha*=0.5;c.strokeStyle='#1b1b1b';c.lineWidth=1.2;c.beginPath();for(var b=0;b<2;b++){var aa=ra+b*PI/2;c.moveTo(Math.cos(aa)*0.48*sz*sc,Math.sin(aa)*0.48*sz*sc);c.lineTo(-Math.cos(aa)*0.48*sz*sc,-Math.sin(aa)*0.48*sz*sc);}c.stroke();c.restore();}}
  if(o.lbl)txtHalo(c,o.lbl,x,y+sz*0.9,'11px sans-serif','#111');c.restore();FX.st.pl++;}
(function(){var b=drawSym;drawSym=function(c,o){if(o&&o.u&&o.dom==='air'&&o.u.st==='air'&&FX.planes&&FX.lvl>0){fxPlane(c,o);return;}b(c,o);};})();
(function(){var b=visItems;visItems=function(){var L=b();if(FX.planes&&FX.lvl>0)L.forEach(function(it){if(it.u&&it.u.st==='air'&&FX.ip[it.u.id]){var p=fxPlanePos(it.u);it.x=p[0];it.y=p[1];}});return L;};})();

/* ---------- 特效圖層的畫布 ---------- */
function fxMount(){if(!VW.wrap||!VW.ct)return;/* 煙畫在部隊符號、標籤與命令底下的獨立圖層：遮住地形但不遮住部隊 */var cs=document.createElement('canvas');cs.className='lw-fxs';cs.style.pointerEvents='none';VW.ct.insertAdjacentElement('beforebegin',cs);FX.cs=cs;FX.sx=cs.getContext('2d');var cv=document.createElement('canvas');cv.className='lw-fx';cv.style.pointerEvents='none';VW.ct.insertAdjacentElement('afterend',cv);FX.cv=cv;FX.cx=cv.getContext('2d');fxSize();}
function fxSize(){if(!FX.cv||!VW.cw)return;var d=VW.dpr||1;[FX.cv,FX.cs].forEach(function(x){if(x){x.width=Math.round(VW.cw*d);x.height=Math.round(VW.ch*d);}});}
(function(){var b=viewMount;viewMount=function(host){b(host);fxMount();};})();
(function(){var b=vResize;vResize=function(fit){b(fit);fxSize();};})();
requestAnimationFrame(fxFrame);
