/* ===================== 更多畫面效果與音效 =====================
   畫面：夜間地形變暗（部隊符號不變），照明彈、爆炸、火光與開火的槍口在黑暗中照出一圈亮光；
   照明彈（1880 年起）在夜間交火的地方升起、隨風緩緩飄落；探照燈（1915–1965 年）在夜間從防空部隊照向敵機；
   車輛在乾燥的地面上揚起塵土、下雪時揚起雪霧；艦艇拖出白色航跡；落在水面的砲彈與炸彈激起水柱而不是火球。
   聲音：步兵發起攻擊時的哨音（1900–1960 年）或軍號（1900 年以前），行軍縱隊的鼓聲（1870 年以前），
   毒氣警報（手搖響板；1946 年起為電動警報），空襲警報（1930 年起），無線電回報的雜音與提示音、電報的滴答聲，
   照明彈升空、砲彈落水，以及畫面中央附近戰車與車輛的引擎聲。
   只讀模擬狀態、只用 Math.random，開關不會改變戰局。 */
var FX2={fl:[],seen:{},trail:{},ord:{},gas:{},cv:null,cx:null,drawn:0,last:0,tick:0,lastTs:0,callT:0,drumT:0,alarmT:0,sirenT:0,radioT:0,bubT:0,veh:null,st:{fl:0,dust:0,spl:0,call:0,alarm:0,siren:0,radio:0}};
function fx2On(k){return UIP[k]!==0;}
function fx2Y(u){var E=u&&uEra(u)||{};return E.fan?1650:(E.y||1943);}
function fx2Water(x,y){var MP=G&&G.map;if(!MP||!MP.lc)return false;var k=cellAt(x,y);return isWater(MP.lc[k]);}
/* ---------- 夜色圖層：在地形與煙之上、部隊符號之下 ---------- */
function fx2Mount(){if(!VW.wrap||!VW.ct||(FX2.cv&&FX2.cv.isConnected))return;var cv=document.createElement('canvas');cv.className='lw-night';cv.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none';
  var ref=FX.cs&&FX.cs.isConnected?FX.cs:VW.ct;ref.insertAdjacentElement('beforebegin',cv);FX2.cv=cv;FX2.cx=cv.getContext('2d');fx2Size();}
function fx2Size(){if(!FX2.cv||!VW.cw)return;var d=VW.dpr||1;FX2.cv.width=Math.round(VW.cw*d);FX2.cv.height=Math.round(VW.ch*d);FX2.drawn=1;}
(function(){var b=viewMount;viewMount=function(host){b(host);fx2Mount();};})();
(function(){var b=vResize;vResize=function(fit){var r=b.apply(this,arguments);fx2Size();return r;};})();
/* 夜色的濃淡：黃昏開始變暗，深夜最暗；陰天與霧更暗一些 */
function fx2NightA(){if(!G||!G.env||!fx2On('night'))return 0;var L=G.env.light;if(!(L<0.75))return 0;var W=WX[G.env.wx]||WX[0];return clamp((0.75-L)/0.6,0,1)*0.5*(W[2]<0.6?1.12:1);}
/* ---------- 照明彈與探照燈 ---------- */
function fx2Flare(x,y,side){var cap=FX.lvl>=2?6:3;if(FX2.fl.length>=cap)return null;var W=G.env||{},wd=W.wd===undefined?0.6:W.wd,ws=clamp((W.ws||4)/10,0.3,2),f={x:x,y:y,side:side,t0:performance.now()/1000,d:6+Math.random()*3,vx:Math.cos(wd)*ws*18,vy:Math.sin(wd)*ws*18};FX2.fl.push(f);FX2.st.fl++;
  if(SND.on&&SND.ac&&SND.ac.state==='running'&&fx2On('sCall')!==false){var P=sndAt(x,y);if(P.g>0.03&&sndTok('pop')){var t=SND.ac.currentTime+0.02;sndNoise(t,'highpass',1400,0.7,P.g*0.35,0.002,0.05,P.pan);sndNoise(t+0.25,'bandpass',3200,1.2,P.g*0.06,0.3,2.6,P.pan);}}return f;}
function fx2FlPos(f,now){var a=now-f.t0;return [f.x+f.vx*a,f.y+f.vy*a,a/f.d];}
/* 夜間交火時偶爾升起照明彈：在交戰雙方之間、偏向敵方 */
function fx2FlareTick(now){if(!fx2On('flare')||FX.lvl<1||!UI.run||fx2NightA()<0.12)return;var C=[];
  G.units.forEach(function(u){if(C.length>=30||!isLeaf(u)||!onMap(u)||G.t-(u.fired||-1e9)>DT*2||!u._eid||fx2Y(u)<1880)return;var s=ST(u);if(s.dom!=='land')return;var e=uById(u._eid);if(!e)return;var p=w2s(u.x,u.y);if(p[0]<-100||p[1]<-100||p[0]>VW.cw+100||p[1]>VW.ch+100)return;C.push([u,e]);});
  if(!C.length||Math.random()>Math.min(0.5,C.length*0.06))return;var q=C[(Math.random()*C.length)|0],u=q[0],e=q[1],k=0.55+Math.random()*0.25;fx2Flare(u.x+(e.x-u.x)*k+(Math.random()-0.5)*300,u.y+(e.y-u.y)*k+(Math.random()-0.5)*300,u.side);}
/* 探照燈：夜間的防空部隊照向 9 公里內的敵機（1915–1965 年） */
function fx2Beams(){var out=[];if(!fx2On('flare')||fx2NightA()<0.15||FX.lvl<1)return out;var me=UI.side,fog=me>=0&&G.set.fog&&!seeAll(),A=G.units.filter(function(a){return a.st==='air'&&alive(a);});if(!A.length)return out;
  G.units.forEach(function(u){if(out.length>=6||!isLeaf(u)||!onMap(u))return;var s=ST(u);if(s.br!=='ad'||s.dom!=='land')return;var y=fx2Y(u);if(y<1915||y>1965)return;if(fog&&u.side!==me)return;var p=w2s(u.x,u.y);if(p[0]<-200||p[1]<-200||p[0]>VW.cw+200||p[1]>VW.ch+200)return;
    var best=null,bd=9000;A.forEach(function(a){if(a.side===u.side)return;var d=dist(u.x,u.y,a.x,a.y);if(d<bd){bd=d;best=a;}});if(best)out.push({u:u,a:best});});return out;}
/* ---------- 每一畫格：夜色、亮光、照明彈、探照燈、航跡 ---------- */
function fx2Lights(now,m){var L=[],cw=VW.cw,ch=VW.ch,vis=function(p,r){return p[0]>-r&&p[1]>-r&&p[0]<cw+r&&p[1]<ch+r;};
  FX2.fl.forEach(function(f){var q=fx2FlPos(f,now),p=w2s(q[0],q[1]),r=Math.max(520/m,70),k=q[2]<0.1?q[2]/0.1:q[2]>0.85?(1-q[2])/0.15:1;k*=0.92+Math.random()*0.08;if(vis(p,r))L.push([p[0],p[1],r,0.95*k,1]);});
  for(var i=0;i<FX.P.length&&L.length<80;i++){var P=FX.P[i];if(P.k!=='fb'&&P.k!=='fl'&&P.k!=='nk')continue;var f=(FX.clk-P.t0)/P.d;if(f<0||f>=1)continue;var p=w2s(P.x,P.y),r=P.k==='nk'?Math.max(6000/m,200):Math.max((P.sz||20)*8/m,P.k==='fl'?28:45);if(vis(p,r))L.push([p[0],p[1],r,(P.k==='fl'?0.6:0.85)*(1-f),2]);}
  if(UI.run||FX.hold>0)(FX2.fire||[]).forEach(function(q){var p=w2s(q[0],q[1]);if(vis(p,40))L.push([p[0],p[1],22+Math.random()*12,0.32+Math.random()*0.18,3]);});
  return L;}
function fx2Draw(now){var c=FX2.cx;if(!c||!FX2.cv||!FX2.cv.isConnected)return;var on=G&&G.started&&!G.replay&&UI.tab==='battle'&&UI.lay.fx!==0&&FX.lvl>0,a=on?fx2NightA():0,wk=on&&fx2On('dust')&&mpp()<40;
  if(!on||(a<=0.01&&!wk&&!FX2.fl.length)){if(FX2.drawn){var d0=VW.dpr||1;c.setTransform(d0,0,0,d0,0,0);c.clearRect(0,0,VW.cw,VW.ch);FX2.drawn=0;}return;}
  var d=VW.dpr||1,m=mpp();c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,VW.cw,VW.ch);FX2.drawn=1;
  if(wk)fx2Wakes(c,now);
  if(a>0.01){c.globalCompositeOperation='source-over';c.globalAlpha=1;c.fillStyle='rgba(8,14,34,'+a.toFixed(3)+')';c.fillRect(0,0,VW.cw,VW.ch);var L=fx2Lights(now,m);
    c.globalCompositeOperation='destination-out';L.forEach(function(l){var g=c.createRadialGradient(l[0],l[1],0,l[0],l[1],l[2]);g.addColorStop(0,'rgba(0,0,0,'+clamp(l[3],0,1).toFixed(3)+')');g.addColorStop(0.55,'rgba(0,0,0,'+clamp(l[3]*0.55,0,1).toFixed(3)+')');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.arc(l[0],l[1],l[2],0,2*PI);c.fill();});
    /* 火光帶一點暖色 */c.globalCompositeOperation='lighter';L.forEach(function(l){if(l[4]===1)return;var g=c.createRadialGradient(l[0],l[1],0,l[0],l[1],l[2]*0.6);g.addColorStop(0,'rgba(255,140,40,'+(0.16*l[3]).toFixed(3)+')');g.addColorStop(1,'rgba(255,140,40,0)');c.fillStyle=g;c.beginPath();c.arc(l[0],l[1],l[2]*0.6,0,2*PI);c.fill();});
    var B=FX2.beams||[];B.forEach(function(q){var p0=w2s(q.u.x,q.u.y),pa=typeof fxPlanePos==='function'?fxPlanePos(q.a):[q.a.x,q.a.y],p1=w2s(pa[0],pa[1]),dx=p1[0]-p0[0],dy=p1[1]-p0[1],len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,w=Math.max(10,len*0.08),g=c.createLinearGradient(p0[0],p0[1],p1[0],p1[1]);
      g.addColorStop(0,'rgba(235,240,255,0.30)');g.addColorStop(1,'rgba(235,240,255,0.06)');c.fillStyle=g;c.beginPath();c.moveTo(p0[0]+nx*2,p0[1]+ny*2);c.lineTo(p1[0]+nx*w,p1[1]+ny*w);c.lineTo(p1[0]-nx*w,p1[1]-ny*w);c.lineTo(p0[0]-nx*2,p0[1]-ny*2);c.closePath();c.fill();});
    c.globalCompositeOperation='source-over';}
  /* 照明彈本身：白中帶黃的亮點，後面拖著一縷煙 */
  FX2.fl=FX2.fl.filter(function(f){var q=fx2FlPos(f,now);if(q[2]>=1)return false;var p=w2s(q[0],q[1]),k=q[2]>0.85?(1-q[2])/0.15:1;c.globalCompositeOperation='lighter';var g=c.createRadialGradient(p[0],p[1],0,p[0],p[1],16);g.addColorStop(0,'rgba(255,250,220,'+(0.9*k).toFixed(3)+')');g.addColorStop(0.3,'rgba(255,235,160,'+(0.45*k).toFixed(3)+')');g.addColorStop(1,'rgba(255,235,160,0)');
    c.fillStyle=g;c.beginPath();c.arc(p[0],p[1],16,0,2*PI);c.fill();c.globalCompositeOperation='source-over';c.globalAlpha=0.35*k;c.strokeStyle='#cfd2d6';c.lineWidth=2;c.beginPath();c.moveTo(p[0],p[1]-3);c.lineTo(p[0]-f.vx*0.4/m,p[1]-14);c.stroke();c.globalAlpha=1;return true;});c.globalCompositeOperation='source-over';c.globalAlpha=1;}
/* 艦艇的航跡：最近幾秒的位置連成逐漸變寬變淡的白線 */
function fx2Wakes(c,now){var T=FX2.trail;for(var id in T){var R=T[id];if(R.pts.length<2)continue;var u=uById(+id);if(!u||!alive(u)){delete T[id];continue;}c.lineCap='round';
  for(var k=1;k<R.pts.length;k++){var a0=w2s(R.pts[k-1][0],R.pts[k-1][1]),a1=w2s(R.pts[k][0],R.pts[k][1]),age=(R.pts.length-k)/R.pts.length;c.globalAlpha=0.5*(1-age);c.strokeStyle='#F4F8FB';c.lineWidth=1.4+age*5;c.beginPath();c.moveTo(a0[0],a0[1]);c.lineTo(a1[0],a1[1]);c.stroke();}}c.globalAlpha=1;}
/* 夜間正在開火的部隊位置（槍口的亮光） */
function fx2FireTick(){var out=[],me=UI.side,fog=me>=0&&G.set.fog&&!seeAll();G.units.forEach(function(u){if(out.length>=60||!isLeaf(u)||!onMap(u)||G.t-(u.fired||-1e9)>DT*2)return;if(fog&&u.side!==me&&!known(me,u.id,120))return;var p=w2s(u.x,u.y);if(p[0]<-40||p[1]<-40||p[0]>VW.cw+40||p[1]>VW.ch+40)return;out.push([u.x,u.y]);});FX2.fire=out;}
/* ---------- 揚塵、雪霧、航跡的取樣（約每 0.3 秒） ---------- */
function fx2Move(now){if(!fx2On('dust')||FX.lvl<1)return;var W=WX[G.env.wx]||WX[0],rain=W[3]>0,snow=W[4]>0,m=mpp(),n=0,me=UI.side,fog=me>=0&&G.set.fog&&!seeAll();if(m>40)return;
  G.units.forEach(function(u){if(n>=40||!isLeaf(u)||!onMap(u)||u.st==='air'||u.st==='lift')return;var s=ST(u);if(fog&&u.side!==me&&!known(me,u.id,60))return;var p=w2s(u.x,u.y);if(p[0]<-60||p[1]<-60||p[0]>VW.cw+60||p[1]>VW.ch+60)return;
    var x=u.x,y=u.y,L=fx2Mv(u,now);
    if(s.dom==='sea'){var R=FX2.trail[u.id]||(FX2.trail[u.id]={pts:[]});if(L.mv){R.pts.push([x,y]);if(R.pts.length>9)R.pts.shift();}else if(R.pts.length&&now-L.mt>6)R.pts.shift();return;}
    if(s.dom!=='land'||now-L.mt>3||!L.dx&&!L.dy||rain&&!snow)return;var dx=L.dx,dy=L.dy,dd=Math.hypot(dx,dy)||1;var veh=(u.veh||0)>0&&(s.mob==='track'||s.mob==='wheel'||/^(arm|mech|mot|sup|rec)$/.test(s.br))&&fx2Y(u)>=1915;if(!veh)return;n++;
    var bx=x-dx/dd*60,by=y-dy/dd*60,col=snow?'240,244,248':'176,156,120';for(var j=0;j<2;j++){fxP({k:'sm',x:bx+(Math.random()-0.5)*80,y:by+(Math.random()-0.5)*80,t0:FX.clk+j*0.1,d:2.4,r0:4,r1:snow?14:20,p0:2,p1:6,a:snow?0.4:0.32,c:col});FX2.st.dust++;}});
  if(Math.random()<0.02){for(var id in FX2.seen)if(now-FX2.seen[id].ct>20)delete FX2.seen[id];}}
/* 部隊最近的移動：位置一步才更新一次，所以記住最後移動的時間與方向 */
function fx2Mv(u,now){var L=FX2.seen[u.id];if(!L){L=FX2.seen[u.id]={x:u.x,y:u.y,mt:-1e9,dx:0,dy:0,ct:now,mv:false};return L;}L.ct=now;L.mv=false;var dx=u.x-L.x,dy=u.y-L.y;if(Math.abs(dx)+Math.abs(dy)>5){L.dx=dx;L.dy=dy;L.x=u.x;L.y=u.y;L.mt=now;L.mv=true;}return L;}
/* ---------- 落水：水柱與白沫，而不是火球與焦痕 ---------- */
(function(){var b=fxEx;fxEx=function(x,y,sz,t0){if(fx2On('dust')&&G&&G.map&&fx2Water(x,y)){fx2Splash(x,y,sz,t0===undefined?FX.clk:t0);return;}return b.apply(this,arguments);};})();
function fx2Splash(x,y,sz,t0){var m=mpp(),big=sz>=25;fxP({k:'fl',x:x,y:y,t0:t0,d:0.12,r:Math.max(sz*0.9/m,big?7:5),c:'#FFFFFF'});fxP({k:'rg',x:x,y:y,t0:t0,d:big?0.9:0.6,r0:Math.max(sz*0.4/m,3),r1:Math.max(sz*2.4/m,big?28:16),c:'#E3F2FD'});
  for(var j=0;j<(big?4:2);j++)fxP({k:'sm',x:x+(Math.random()-0.5)*sz,y:y+(Math.random()-0.5)*sz,t0:t0+j*0.08,d:2.2+Math.random(),r0:4,r1:big?30:18,p0:2,p1:big?10:7,a:0.55,c:'236,242,248',mk:1});FX2.st.spl++;
  if(SND.on&&SND.ac&&SND.ac.state==='running'){var P=sndAt(x,y,big);if(P.g>0.03&&sndTok('splash')){var t=SND.ac.currentTime+0.02+Math.max(0,t0-FX.clk);sndNoise(t,'lowpass',650,0.8,P.g*0.5,0.01,0.7,P.pan);sndTone(t,'sine',150,55,0.35,P.g*0.35,0.005,0.35,P.pan);}}}
/* ---------- 聲音 ---------- */
SNDR.pop=[2,2];SNDR.splash=[4,3];SNDR.call=[0.5,1];SNDR.drum=[0.4,1];SNDR.alarm=[0.1,1];SNDR.siren=[0.02,1];SNDR.radio=[1.5,2];
var SNDF2={
 /* 哨音：軍官的豌豆哨。哨腔裡的小球被氣流吹得亂轉，聲音是一個尖銳的音高加上不規則的顫動：音量忽大忽小、轉速忽快忽慢，
    不像電話鈴那樣在兩個音之間規律地切換、響兩下停一下。吹氣時音高先往上爬，收尾往下掉，還混著氣聲。
    一聲長哨，有時再補一聲短的；稍遠處另一位軍官也跟著吹 */
 whistle:function(t,pan,g){var ac=SND.ac,f=2950+Math.random()*350,d=1.0+Math.random()*0.45;
   function blast(t0,d,f,g,pan){var te=t0+d,o=ac.createOscillator(),o2=ac.createOscillator(),lfo=ac.createOscillator(),am=ac.createGain(),ad=ac.createGain(),fm=ac.createGain(),fm2=ac.createGain(),h2=ac.createGain(),env=ac.createGain(),n=ac.createBufferSource(),bp=ac.createBiquadFilter(),ng=ac.createGain();
     [[o,f],[o2,f*2]].forEach(function(q){var p=q[0].frequency;q[0].type='sine';p.setValueAtTime(q[1]*0.88,t0);p.exponentialRampToValueAtTime(q[1],t0+0.08);p.setValueAtTime(q[1],te-0.15);p.exponentialRampToValueAtTime(q[1]*0.93,te);});
     /* 小球：以調幅為主、帶一點調頻，轉速每隔幾十毫秒亂變一次 */
     lfo.type='triangle';for(var tt=t0;tt<te;tt+=0.025+Math.random()*0.03)lfo.frequency.setValueAtTime(30+Math.random()*34,tt);
     am.gain.value=0.62;ad.gain.value=0.36;fm.gain.value=f*0.018;fm2.gain.value=f*0.036;h2.gain.value=0.14;lfo.connect(ad);ad.connect(am.gain);lfo.connect(fm);fm.connect(o.frequency);lfo.connect(fm2);fm2.connect(o2.frequency);
     n.buffer=SND.noise;n.loop=true;bp.type='bandpass';bp.frequency.value=f;bp.Q.value=5;ng.gain.value=0.8;
     o.connect(am);o2.connect(h2);h2.connect(am);n.connect(bp);bp.connect(ng);ng.connect(am);am.connect(env);
     env.gain.setValueAtTime(0.0001,t0);env.gain.linearRampToValueAtTime(g,t0+0.05);env.gain.setValueAtTime(g,te-0.1);env.gain.exponentialRampToValueAtTime(0.0001,te);sndPan(env,pan);
     [o,o2,lfo].forEach(function(x){x.start(t0);x.stop(te+0.02);});n.start(t0,Math.random()*1.5);n.stop(te+0.02);sndVoice(o);
     sndNoise(t0,'highpass',5200,0.7,g*0.18,0.03,Math.min(0.5,d),pan);}
   blast(t,d,f,g,pan);if(Math.random()<0.55)blast(t+d+0.28,0.3+Math.random()*0.15,f,g*0.95,pan);
   blast(t+0.2+Math.random()*0.45,0.8+Math.random()*0.4,f*(Math.random()<0.5?0.84+Math.random()*0.08:1.08+Math.random()*0.08),g*0.4,clamp(pan+(Math.random()<0.5?-0.35:0.35),-1,1));},
 /* 軍號：衝鋒號（C 調軍號的泛音列） */
 bugle:function(t,pan,g,notes){var ac=SND.ac,tt=t;(notes||[[392,0.13],[523,0.13],[659,0.13],[784,0.32],[659,0.13],[784,0.55]]).forEach(function(q){var o=ac.createOscillator(),lp=ac.createBiquadFilter(),gg=ac.createGain(),v=ac.createOscillator(),vg=ac.createGain();o.type='sawtooth';o.frequency.value=q[0];v.frequency.value=5.5;vg.gain.value=q[0]*0.006;v.connect(vg);vg.connect(o.frequency);
   lp.type='lowpass';lp.frequency.value=1900;lp.Q.value=1.2;gg.gain.setValueAtTime(0.0001,tt);gg.gain.linearRampToValueAtTime(g,tt+0.025);gg.gain.setValueAtTime(g*0.85,tt+q[1]*0.8);gg.gain.exponentialRampToValueAtTime(0.0001,tt+q[1]);o.connect(lp);lp.connect(gg);sndPan(gg,pan);o.start(tt);v.start(tt);o.stop(tt+q[1]+0.02);v.stop(tt+q[1]+0.02);sndVoice(o);tt+=q[1]+0.03;});},
 /* 行軍鼓：一小節，重音帶一聲低音 */
 drum:function(t,pan,g){[0,0.12,0.24,0.3,0.36,0.48,0.6,0.72].forEach(function(o,i){var acc=i===0||i===4;sndNoise(t+o,'bandpass',1900,0.9,g*(acc?1:0.6),0.002,0.07,pan);if(acc)sndTone(t+o,'sine',130,70,0.12,g*0.7,0.003,0.12,pan);});},
 /* 毒氣警報：手搖響板（一連串喀噠聲）；1946 年起改用電動警報（兩音交替） */
 rattle:function(t,pan,g){for(var k=0;k<30;k++)sndNoise(t+k*0.055+Math.random()*0.01,'bandpass',2600,1.4,g*(0.7+Math.random()*0.3),0.001,0.03,pan);},
 klaxon:function(t,pan,g){var ac=SND.ac;for(var k=0;k<4;k++){var o=ac.createOscillator(),lp=ac.createBiquadFilter(),gg=ac.createGain(),t0=t+k*0.42;o.type='square';o.frequency.value=k%2?520:660;lp.type='lowpass';lp.frequency.value=2000;gg.gain.setValueAtTime(0.0001,t0);gg.gain.linearRampToValueAtTime(g,t0+0.02);gg.gain.setValueAtTime(g,t0+0.36);gg.gain.exponentialRampToValueAtTime(0.0001,t0+0.4);o.connect(lp);lp.connect(gg);sndPan(gg,pan);o.start(t0);o.stop(t0+0.42);sndVoice(o);}},
 /* 空襲警報：緩緩升高再降下的長鳴，兩次 */
 siren:function(t,pan,g){var ac=SND.ac;for(var r=0;r<2;r++){var t0=t+r*6.2,o=ac.createOscillator(),o2=ac.createOscillator(),gg=ac.createGain();o.type='sawtooth';o2.type='sine';[o,o2].forEach(function(x,i){var mul=i?1.5:1;x.frequency.setValueAtTime(180*mul,t0);x.frequency.linearRampToValueAtTime(620*mul,t0+2.6);x.frequency.setValueAtTime(620*mul,t0+3.6);x.frequency.linearRampToValueAtTime(200*mul,t0+6);});
   var lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1400;gg.gain.setValueAtTime(0.0001,t0);gg.gain.linearRampToValueAtTime(g,t0+1.2);gg.gain.setValueAtTime(g,t0+4.4);gg.gain.exponentialRampToValueAtTime(0.0001,t0+6);o.connect(lp);o2.connect(lp);lp.connect(gg);sndPan(gg,pan);o.start(t0);o2.start(t0);o.stop(t0+6.05);o2.stop(t0+6.05);sndVoice(o);}},
 /* 無線電：一小段雜訊加上提示音 */
 radio:function(t,pan,g){sndNoise(t,'bandpass',2300,0.8,g*0.5,0.005,0.14,pan);sndTone(t+0.16,'sine',1150,1150,0.07,g*0.4,0.004,0.06,pan);},
 /* 電報：有線電報的收報音響器，不是嗶聲，而是銜鐵吸下的「喀」和彈回的「噠」；點短、劃長 */
 telegraph:function(t,pan,g){var tt=t,c=['.-','-.','..','.-.','-..','--.'][Math.floor(Math.random()*6)]+' '+['-','.','..','.-'][Math.floor(Math.random()*4)];
   c.split('').forEach(function(x){if(x===' '){tt+=0.14;return;}var d=x==='-'?0.17:0.06;sndNoise(tt,'bandpass',2600,6,g*1.4,0.001,0.02,pan);sndNoise(tt+d,'bandpass',1650,5,g*0.8,0.001,0.018,pan);tt+=d+0.07;});}};
function fx2SndOk(){return SND.on&&SND.ac&&SND.ac.state==='running';}
/* 號令：步兵、騎兵開始進攻時（畫面上的部隊、離畫面中央近的才聽得到） */
function fx2Calls(now){if(!fx2On('sCall'))return;var cw=VW.cw,ch=VW.ch,R=Math.hypot(cw,ch)/2,best=null,bd=1e9,drum=null,dd=1e9,me=UI.side;
  G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u))return;var s=ST(u),o=u.ord,k=o?(o.dk||o.k):'';if(s.dom!=='land'||!/^(inf|cav|pike|mg|abn|mtn|mar|gue|vg)$/.test(s.br))return;if(me>=0&&u.side!==me&&!seeAll())return;var oid=o?o.oid:0,P=FX2.ord[u.id];FX2.ord[u.id]=oid;
    var p=w2s(u.x,u.y),r=Math.hypot(p[0]-cw/2,p[1]-ch/2)/R;if(r>1)return;if(P!==undefined&&oid&&oid!==P&&o.st==='exec'&&/^(attack|storm|breakthrough|penetrate|pursue|eager)$/.test(k)&&r<bd){bd=r;best=u;}
    if(u.form==='march'&&o&&o.st==='exec'&&fx2Y(u)<=1870&&r<dd){dd=r;drum=u;}});
  if(best&&now-FX2.callT>3){var y=fx2Y(best),P=sndAt(best.x,best.y);if(P.g>0.02&&sndTok('call')){FX2.callT=now;FX2.st.call++;var t=SND.ac.currentTime+0.05;if(y>=1900&&y<=1960)SNDF2.whistle(t,P.pan,P.g*0.12);else if(y<1900)SNDF2.bugle(t,P.pan,P.g*0.16);}}
  if(drum&&now-FX2.drumT>5&&UI.run){var P2=sndAt(drum.x,drum.y);if(P2.g>0.03&&sndTok('drum')){FX2.drumT=now;SNDF2.drum(SND.ac.currentTime+0.05,P2.pan,P2.g*0.22);}}}
/* 警報：畫面上的本方部隊陷入毒氣；敵方轟炸機接近畫面 */
function fx2Alarms(now){if(!fx2On('sAlarm'))return;var me=UI.side,cb=!!((G.cbx&&G.cbx.length)||G.cbgr),hit=null,cw=VW.cw,ch=VW.ch;
  if(cb&&typeof gasAt==='function'){G.units.forEach(function(u){if(hit||!isLeaf(u)||!onMap(u)||(me>=0&&u.side!==me))return;var p=w2s(u.x,u.y);if(p[0]<0||p[1]<0||p[0]>cw||p[1]>ch)return;var g=gasAt(u.x,u.y)>0.02,P=FX2.gas[u.id];FX2.gas[u.id]=g;if(g&&!P)hit=u;});}
  if(hit&&now-FX2.alarmT>20){var y=fx2Y(hit),P=sndAt(hit.x,hit.y,true);if(y>=1915&&sndTok('alarm')){FX2.alarmT=now;FX2.st.alarm++;var t=SND.ac.currentTime+0.05;if(y<1946)SNDF2.rattle(t,P.pan,Math.max(0.05,P.g*0.3));else SNDF2.klaxon(t,P.pan,Math.max(0.04,P.g*0.12));}}
  if(now-FX2.sirenT>120&&UI.run){var c=s2w(cw/2,ch/2),bomb=null;G.units.forEach(function(a){if(bomb||a.st!=='air'||!alive(a)||(me>=0&&a.side===me))return;if(me>=0&&G.set.fog&&!seeAll()&&!known(me,a.id,120))return;if(typeof airRole!=='function'||airRole(a)!=='bomber')return;if(dist(a.x,a.y,c[0],c[1])<12000)bomb=a;});
    if(bomb&&fx2Y(bomb)>=1930&&sndTok('siren')){FX2.sirenT=now;FX2.st.siren++;SNDF2.siren(SND.ac.currentTime+0.05,0,0.07);}}}
/* 無線電與電報：兵牌上冒出新的回報時 */
(function(){var b=bubScan;bubScan=function(){b.apply(this,arguments);try{var q=null;BUB.L.forEach(function(x){if(!q||x.t0>q.t0)q=x;});if(!q||q.t0<=FX2.radioT)return;FX2.radioT=q.t0;if(!fx2On('sRadio')||!fx2SndOk())return;var u=uById(q.u);if(!u)return;var y=fx2Y(u),P=sndAt(u.x,u.y,true);if(!sndTok('radio'))return;FX2.st.radio++;var t=SND.ac.currentTime+0.03,gg=Math.max(0.05,P.g*0.18);
  if(y>=1925)SNDF2.radio(t,P.pan,gg);else if(y>=1850)SNDF2.telegraph(t,P.pan,gg);}catch(e){}};})();
/* 引擎聲：畫面中央附近正在移動的戰車或車輛（一個聲音，依距離漸強漸弱） */
function fx2VehVoice(){var ac=SND.ac,g=ac.createGain();g.gain.value=0;var pn=ac.createStereoPanner?ac.createStereoPanner():null;if(pn){g.connect(pn);pn.connect(SND.out);}else g.connect(SND.out);var V={g:g,pn:pn,nodes:[]};
  var o=ac.createOscillator();o.type='sawtooth';o.frequency.value=46;var lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=190;o.connect(lp);lp.connect(g);o.start();V.nodes.push(o);V.f=o.frequency;
  var n=ac.createBufferSource();n.buffer=SND.noise;n.loop=true;var bp=ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=780;bp.Q.value=1.1;var am=ac.createGain();am.gain.value=0.25;var l=ac.createOscillator();l.frequency.value=11;var lg=ac.createGain();lg.gain.value=0.22;l.connect(lg);lg.connect(am.gain);n.connect(bp);bp.connect(am);am.connect(g);n.start(0,Math.random());l.start();V.nodes.push(n,l);V.lfo=l.frequency;
  V.stop=function(){V.nodes.forEach(function(x){try{x.stop();}catch(e){}});try{g.disconnect();}catch(e){}};return V;}
function fx2Veh(now){var ac=SND.ac;if(!ac)return;var want=null;if(fx2On('sVeh')&&fx2SndOk()&&UI.run&&mpp()<15){var cw=VW.cw,ch=VW.ch,R=Math.hypot(cw,ch)/2,bd=0.45,me=UI.side;
    G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||u.st==='air')return;var s=ST(u);if(s.dom!=='land'||!(s.br==='arm'||(s.hard>=0.5&&(u.veh||0)>0))||fx2Y(u)<1916)return;if(me>=0&&u.side!==me&&!known(me,u.id,60))return;if(now-fx2Mv(u,now).mt>4)return;
      var p=w2s(u.x,u.y),r=Math.hypot(p[0]-cw/2,p[1]-ch/2)/R;if(r<bd){bd=r;want={u:u,r:r,p:p};}});}
  var V=FX2.veh,t=ac.currentTime;if(!want){if(V){V.g.gain.setTargetAtTime(0,t,0.3);(function(VV){setTimeout(function(){VV.stop();},1500);})(V);FX2.veh=null;}return;}
  if(!V)V=FX2.veh=fx2VehVoice();var z=Math.pow(clamp(8/mpp(),0.15,1),0.5),g=clamp(1-want.r/0.45,0,1);V.g.gain.setTargetAtTime(0.09*g*z,t,0.25);if(V.pn)V.pn.pan.setTargetAtTime(clamp((want.p[0]-VW.cw/2)/(VW.cw/2),-1,1)*0.7,t,0.2);V.f.setTargetAtTime(40+Math.random()*12,t,0.5);}
/* ---------- 主迴圈 ---------- */
function fx2Frame(ts){requestAnimationFrame(fx2Frame);try{if(!G||!G.started||G.replay||UI.tab!=='battle'){if(FX2.drawn&&FX2.cx){FX2.cx.setTransform(1,0,0,1,0,0);FX2.cx.clearRect(0,0,FX2.cv.width,FX2.cv.height);FX2.drawn=0;}if(FX2.veh)fx2Veh(0);return;}
  if(FX2.g!==G){FX2.g=G;FX2.fl=[];FX2.seen={};FX2.trail={};FX2.ord={};FX2.gas={};}var now=ts/1000;
  if(now-FX2.tick>0.3){FX2.tick=now;if(fx2NightA()>0.01){FX2.beams=fx2Beams();fx2FireTick();}else{FX2.beams=null;FX2.fire=null;}if(UI.run){fx2FlareTick(now);fx2Move(now);}if(fx2SndOk()){fx2Calls(now);fx2Alarms(now);}fx2Veh(now);}fx2Draw(now);}catch(e){if(!FX2.err){FX2.err=1;if(window.console)console.warn('fx2',e);}}}
requestAnimationFrame(fx2Frame);
/* ---------- 設定 ---------- */
setSec('gfx','fx2',{t:'夜色與環境效果',o:13.5,local:true,h:function(){return setOpt(setRow('夜色',setChk('fx2c','night',UIP.night!==0,'夜間地形變暗，火光、照明彈與開火的槍口照出亮光（部隊符號不會變暗）'))+
  setRow('照明彈與探照燈',setChk('fx2c','flare',UIP.flare!==0,'夜間交火時升起照明彈（1880 年起）；防空部隊的探照燈照向敵機（1915–1965 年）'))+setRow('揚塵與水面',setChk('fx2c','dust',UIP.dust!==0,'車輛揚起塵土或雪霧、艦艇的航跡、落水的水柱')))+'<div class="lw-note">需要開啟「畫面效果」；簡易圖形模式下不顯示。</div>';}});
setSec('gfx','sfx2',{t:'號令、警報與通訊聲',o:13.6,local:true,h:function(){return setOpt(setRow('號令',setChk('fx2c','sCall',UIP.sCall!==0,'步兵發起攻擊時的哨音（1900–1960 年）或軍號（1900 年以前）、行軍縱隊的鼓聲（1870 年以前）、照明彈升空'))+
  setRow('警報',setChk('fx2c','sAlarm',UIP.sAlarm!==0,'毒氣警報（響板；1946 年起為電動警報）、空襲警報（1930 年起，敵方轟炸機接近時）'))+setRow('無線電與電報',setChk('fx2c','sRadio',UIP.sRadio!==0,'部隊回報送達時的無線電雜音與提示音（1925 年起）或電報聲'))+
  setRow('車輛引擎',setChk('fx2c','sVeh',UIP.sVeh!==0,'放大地圖時，畫面中央附近行駛中的戰車與車輛')))+'<div class="lw-note">需要開啟「音效」。</div>';}});
CHG.fx2c=function(t){UIP[t.getAttribute('data-f')]=t.checked?1:0;uipSave();if(G&&G.map)vDraw(false);};
if(typeof HELP14!=='undefined')HELP14.push('<h4>夜色、照明與更多音效</h4><ul>'+
  '<li>夜間地形會變暗（部隊符號不變），爆炸、火光、照明彈與開火的槍口照出一圈亮光。1880 年起，夜間交火的地方會升起照明彈，隨風緩緩飄落；1915–1965 年的防空部隊在夜間以探照燈照向敵機。</li>'+
  '<li>車輛在乾燥的地面上揚起塵土，下雪時揚起雪霧；艦艇拖出航跡；砲彈與炸彈落在水面激起水柱。</li>'+
  '<li>聲音：步兵發起攻擊時的哨音（1900–1960 年）或軍號（1900 年以前），行軍縱隊的鼓聲（1870 年以前），毒氣警報（響板，1946 年起電動警報），敵方轟炸機接近時的空襲警報（1930 年起），部隊回報送達時的無線電聲（1925 年起）或電報聲，以及放大地圖時附近戰車的引擎聲。</li>'+
  '<li>可以在設定的「畫面 → 夜色與環境效果」「號令、警報與通訊聲」分別關閉。</li></ul>');
