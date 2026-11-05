/* ===================== 環境音、蓋格計數器與各時代的交火聲 =====================
   全部在瀏覽器裡即時合成，只影響聲音、不改變戰局；跟著「音效」開關與音量，環境音與蓋格計數器可在「設定 → 畫面效果與音效」分別關閉。
   環境音：雨聲（大雨有低沉的雨幕）、隨風速增強的風聲與陣風、強風的呼嘯、下雪的沙沙聲（雪會吸音，所有聲音都變悶）、雷雨的雷聲；暫停時淡出。
   蓋格計數器：選取的部隊（沒有選取時是畫面中央）在核爆落塵區或放射性污染（髒彈、核電廠事故）裡時劈啪作響，越強越密；風向儀下方顯示每秒計數。
   交火聲依年代：火繩槍參差的齊射；燧發槍線列幾乎同時齊射、偶爾零星補射、有時排槍輪射；拿破崙時代多了散兵的零星射擊；線膛槍多半各自射擊；黑火藥有低沉的轟聲。
   無煙火藥以後是清脆的栓動步槍；一次大戰起有機槍長連發、輕機槍與手榴彈；二次大戰有衝鋒槍與射速很高的機槍；冷戰以後是突擊步槍的連發與點放、通用機槍、重機槍與火箭筒；
   現代還有精準的單發與榴彈發射器。滑膛砲時代的砲彈多是實心彈，落地是悶響而不是爆炸。 */
var SND2={amb:true,geig:true,gust:0.5,gTar:0.5,gT:0,thT:4,nTh:0,cps:0,lvl:0,nClk:0,last:null,wx:null,tick:null};
try{var _s2=JSON.parse(localStorage.getItem('lato-warsim-snd2')||'null');if(_s2){SND2.amb=_s2.amb!==false;SND2.geig=_s2.geig!==false;}}catch(e){}
function snd2Save(){try{localStorage.setItem('lato-warsim-snd2',JSON.stringify({amb:SND2.amb,geig:SND2.geig}));}catch(e){}}
/* ---------- 一、交火聲：先排出一次開火的「計畫」（每一發的時間與強度、音色），再合成成一個聲音 ---------- */
function sndPlan(i,w,h,R){R=R||wxRnd;h=h||1;var P={k:'',shots:[],f:2500,q:0.9,dec:0.055,thump:0,roar:0,x:null,xt:0,gain:0.5};
  function add(t,a){P.shots.push([Math.max(0,t),a===undefined?0.75+R()*0.35:a]);}
  function burst(t0,n,rate){for(var k=0;k<n;k++)add(t0+k/rate+R()*0.008);return t0+n/rate;}
  function scatter(t0,n,span){for(var k=0;k<n;k++)add(t0+R()*span,0.55+R()*0.5);}
  function volley(t0,n,spread){for(var k=0;k<n;k++){var u=(R()+R()+R())/3;add(t0+u*spread,0.5+R()*0.4);}}
  function single(t0,n,g0,g1){var t=t0;for(var k=0;k<n;k++){add(t);t+=g0+R()*(g1-g0);}}
  function mgB(rate,n0,n1){P.k='mgb';P.f=1900+R()*500;P.dec=Math.min(0.06,0.8/rate);P.gain=0.4;burst(0,n0+Math.floor(R()*(n1-n0+1)),rate);}
  function bolt(){P.k='bolt';scatter(0,2+Math.floor(R()*5),1+R()*1.6);}
  /* 黑火藥：低沉、拖長的槍聲 */
  if(w==='musket'||w==='cav'){P.f=(i>=3?980:760)+R()*260;P.dec=i>=3?0.15:0.21;P.q=0.75;P.gain=0.42;
    if(w==='cav'){P.k='pistol';scatter(0,2+Math.floor(R()*3),1.6);P.thump=0.3;}
    else if(i<=0){P.k='ragged';volley(0,6+Math.floor(R()*7),0.45+R()*0.35);P.thump=0.8;P.roar=0.6;if(R()<0.35)scatter(1,1+Math.floor(R()*3),1.6);}
    else if(i===3&&R()<0.72){P.k='atwill';scatter(0,4+Math.floor(R()*6),1.2+R()*1.4);P.thump=0.35;}
    else if(i===2&&R()<0.45){P.k='skirm';scatter(0,2+Math.floor(R()*4),1.5+R()*1.5);P.thump=0.3;}
    else if(R()<0.2){P.k='roll';var t=0,ns=3+Math.floor(R()*2);for(var s=0;s<ns;s++){volley(t,5+Math.floor(R()*4),0.13);t+=0.5+R()*0.4;}P.thump=1;P.roar=0.8;}
    else{P.k='volley';volley(0,10+Math.floor(R()*9),0.11+R()*0.1);P.thump=1;P.roar=1;if(R()<0.4)scatter(0.45,1+Math.floor(R()*4),1.7);}
    return P;}
  P.f=2300+R()*700;var lmg=i===6?[10,14,20][h%3]:i>=7?12+(h%3):9.5;
  /* 機槍部隊：一戰的水冷機槍長連發；二戰依部隊不同的射速（每秒 10、14 或 20 發）；冷戰以後的通用機槍 */
  if(w==='mg'){var rate=i<=5?8+R()*1.5:i===6?lmg:11+R()*2,n=i<=5?12+Math.floor(R()*18):6+Math.floor(R()*10);mgB(rate,n,n);P.k='mg';var t2=P.shots[P.shots.length-1][0];if(R()<0.4)burst(t2+0.45+R()*0.6,Math.max(3,Math.round(n*0.6)),rate);return P;}
  if(w!=='rifle')return null;var r=R();
  if(i<=4){if(r<0.85)bolt();else mgB(9.5,8,15);return P;}
  if(i===5){if(r<0.5){bolt();scatter(1.2,1+Math.floor(R()*3),1.5);}else if(r<0.75)mgB(8.5,10,25);else if(r<0.87){mgB(9.5,4,9);P.k='lmg';}else{bolt();P.k='gren';P.x='gren';P.xt=0.2+R()*0.6;}return P;}
  if(i===6){if(r<0.3){if(R()<0.5)bolt();else{P.k='semi';single(0,3+Math.floor(R()*5),0.22,0.5);}}else if(r<0.5){P.k='smg';P.f=1500+R()*400;P.dec=0.045;P.gain=0.42;burst(0,4+Math.floor(R()*9),12+R()*3);}
    else if(r<0.82){mgB(lmg,5,14);P.k='lmg';}else{bolt();P.k='gren';P.x='gren';P.xt=0.3+R()*0.6;}return P;}
  if(i===7){if(r<0.4){P.k='ar';P.f=2500+R()*500;if(R()<0.5)burst(0,4+Math.floor(R()*7),10+R()*1.5);else{var t3=0,nb=2+Math.floor(R()*2);for(var q=0;q<nb;q++)t3=burst(t3,3,11)+0.3+R()*0.4;}}
    else if(r<0.62)mgB(11+R()*2,6,14);else if(r<0.72){mgB(8,5,10);P.k='hmg';P.f=1100+R()*300;P.dec=0.08;P.gain=0.5;}else if(r<0.82){P.k='rpg';P.x='rpg';}else{P.k='semi';single(0,3+Math.floor(R()*3),0.3,0.7);}return P;}
  /* 資訊化與無人機時代 */
  if(r<0.45){P.k='pair';P.f=2700+R()*400;var t4=0,np=2+Math.floor(R()*3);for(var c2=0;c2<np;c2++)t4=burst(t4,2+Math.floor(R()*2),13)+0.35+R()*0.35;}
  else if(r<0.65){mgB(12+R()*2,5,10);P.k='lmg';}else if(r<0.73){mgB(8,5,9);P.k='hmg';P.f=1100+R()*300;P.dec=0.08;P.gain=0.5;}else if(r<0.83){P.k='gl';P.x='gl';}else{P.k='dmr';P.f=2900+R()*300;single(0,2+Math.floor(R()*3),0.6,1.2);}
  return P;}
/* 一連串槍聲的音量包絡（每發 1.5 毫秒起音、指數衰減，重疊的部分相加），用一條曲線控制，一次開火只用一個聲源 */
function sndCurve(S,g,dec,res){res=res||0.001;var end=S[S.length-1][0]+dec*1.7+0.02,n=Math.max(2,Math.ceil(end/res)+1),c=new Float32Array(n),k=6.9/dec,cap=g*1.5;
  for(var s=0;s<S.length;s++){var t0=S[s][0],a=g*S[s][1];for(var i=Math.floor(t0/res);i<n;i++){var tau=i*res-t0;if(tau<0)continue;var v=tau<0.0015?a*tau/0.0015:a*Math.exp(-(tau-0.0015)*k);if(tau>0.0015&&v<a*0.0006)break;c[i]+=v;}}
  for(var j=0;j<n;j++)if(c[j]>cap)c[j]=cap;c[0]=0;c[n-1]=0;return {c:c,dur:(n-1)*res};}
function sndShots(t,P,pl){var ac=SND.ac,far=P.far,g=P.g*pl.gain,S=pl.shots.slice().sort(function(a,b){return a[0]-b[0];});
  if(S.length){var dec=far?pl.dec*1.7:pl.dec,C=sndCurve(S,g,dec),src=ac.createBufferSource();src.buffer=SND.noise;src.loop=true;var f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=far?pl.f*0.6:pl.f;f.Q.value=pl.q;var gg=ac.createGain();gg.gain.value=0;
    try{gg.gain.setValueCurveAtTime(C.c,t,C.dur);}catch(e){return;}
    var out=f;if(far){var lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2000;f.connect(lp);out=lp;}src.connect(f);out.connect(gg);sndPan(gg,P.pan);src.start(t,wxRnd()*1.5);src.stop(t+C.dur+0.05);sndVoice(src);
    var T0=t+S[0][0],nn=S.length;if(pl.thump>0)sndNoise(T0,'lowpass',far?150:230,0.7,g*0.6*pl.thump*Math.min(1.7,Math.sqrt(nn)/2.4),0.012,0.7+0.5*pl.thump,P.pan);
    if(pl.roar>0&&nn>4)sndNoise(T0,'bandpass',far?480:760,0.45,g*0.32*pl.roar*Math.min(1.6,Math.sqrt(nn)/3),0.02,0.5,P.pan,far?1300:0);}
  if(pl.x)sndExtra(t+pl.xt,P,pl.x);SND2.last={k:pl.k,n:S.length};}
/* 手榴彈、火箭筒、榴彈發射器 */
function sndExtra(t,P,x){if(x==='gren'){if(sndTok('expl'))SNDF.expl(t+0.4+wxRnd()*0.7,P.pan,P.g*0.4,0.1,P.far);}
  else if(x==='rpg'){if(sndTok('whoosh'))SNDF.whoosh(t,P.pan,P.g*0.5,0.6);if(sndTok('expl'))SNDF.expl(t+0.65,P.pan,P.g*0.55,0.22,P.far);}
  else if(x==='gl'){sndTone(t,'sine',150,55,0.07,P.g*0.45,0.002,0.1,P.pan);if(sndTok('expl'))SNDF.expl(t+1+wxRnd()*0.4,P.pan,P.g*0.4,0.14,P.far);}}
/* 實心砲彈落地的悶響、雷聲 */
SNDF.thud=function(t,pan,g,far){sndNoise(t,'lowpass',far?180:320,0.7,g,0.004,0.28,pan);sndTone(t,'sine',85,40,0.2,g*0.7,0.003,0.25,pan);};
SNDF.thunder=function(t,pan,g,near){var ac=SND.ac,src=ac.createBufferSource();src.buffer=SND.brown;src.loop=true;var f=ac.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(near?900:380,t);f.frequency.exponentialRampToValueAtTime(110,t+3);
  var gg=ac.createGain(),a=near?0.05:0.4+wxRnd()*0.6,dur=3+wxRnd()*3;gg.gain.setValueAtTime(0.0001,t);gg.gain.linearRampToValueAtTime(g,t+a);for(var k=1;k<4;k++)gg.gain.linearRampToValueAtTime(g*(0.45+wxRnd()*0.5),t+a+k*dur/5);gg.gain.exponentialRampToValueAtTime(0.0001,t+a+dur);
  src.connect(f);f.connect(gg);sndPan(gg,pan);src.start(t,wxRnd());src.stop(t+a+dur+0.1);sndVoice(src);if(near)sndNoise(t,'highpass',2000,0.7,g*0.6,0.002,0.25,pan);};
(function(){var b=sndEv;sndEv=function(e){var ac=SND.ac;if(e&&e.a&&ac&&ac.state==='running'){
    if(e.k==='fire'){var a=e.a,w=fxWpn(a);if(w==='musket'||w==='cav'||w==='mg'||w==='rifle'){var P=sndAt(e.hid?e.x1:e.x0,e.hid?e.y1:e.y0,false);SND.heat+=P.g>0.02?1:0.2;if(P.g<0.03)return;
      var pl=sndPlan(fxEi(a),w,Math.abs(a.id|0)+1);if(!pl)return b.apply(this,arguments);var tk=/^(volley|roll|ragged)$/.test(pl.k)?'volley':/^(mg|mgb|lmg|smg|hmg|ar|pair)$/.test(pl.k)?'burst':'crack';if(!sndTok(tk))return;sndShots(ac.currentTime+0.02,P,pl);return;}}
    /* 滑膛砲時代的砲擊：發射是黑火藥的轟聲，落地多半是實心彈的悶響 */
    if(e.k==='art'&&fxEi(e.a)<=2&&!uEra(e.a).fan){var t=ac.currentTime+0.02,P0=sndAt(e.x0,e.y0,true),P1=sndAt(e.x1,e.y1,true),fl=clamp(Math.hypot(e.x1-e.x0,e.y1-e.y0)/4500,0.6,2.2);SND.heat+=2;
      if(!e.hid&&P0.g>0.03&&sndTok('cannon')){SNDF.cannon(t,P0.pan,P0.g*0.85,P0.far);sndNoise(t+0.05,'lowpass',160,0.7,P0.g*0.35,0.05,1.3,P0.pan);}
      if(P1.g>0.03){var dt=fl+wxRnd()*0.8;if(wxRnd()<0.6){if(sndTok('expl'))SNDF.thud(t+dt,P1.pan,P1.g*0.6,P1.far);}else if(sndTok('expl'))SNDF.expl(t+dt,P1.pan,P1.g*0.5,0.2,P1.far);}return;}}
  return b.apply(this,arguments);};})();
/* ---------- 二、環境音：雨、風、雪與雷聲 ---------- */
function sndWxInit(){var ac=SND.ac;if(!ac||SND2.wx||!SND.out||!SND.comp)return;
  /* 主輸出接一個低通濾波：下大雪時聲音變悶 */var muf=ac.createBiquadFilter();muf.type='lowpass';muf.frequency.value=20000;muf.Q.value=0.5;try{SND.out.disconnect();}catch(e){}SND.out.connect(muf);muf.connect(SND.comp);SND.muf=muf;
  var bus=ac.createGain();bus.gain.value=1;bus.connect(SND.out);
  function loop(buf,F){var s=ac.createBufferSource();s.buffer=buf;s.loop=true;var last=s,L=[];F.forEach(function(q){var f=ac.createBiquadFilter();f.type=q[0];f.frequency.value=q[1];f.Q.value=q[2];last.connect(f);last=f;L.push(f);});var g=ac.createGain();g.gain.value=0;last.connect(g);g.connect(bus);s.start(0,wxRnd()*1.8);return {s:s,g:g,f:L};}
  SND2.wx={rain:loop(SND.noise,[['highpass',1100,0.5],['lowpass',7500,0.5]]),body:loop(SND.brown,[['lowpass',900,0.5]]),wind:loop(SND.brown,[['bandpass',380,0.8]]),whis:loop(SND.noise,[['bandpass',1500,10]]),snow:loop(SND.noise,[['lowpass',420,0.6]])};
  /* 蓋格計數器的一聲「喀」 */var len=Math.round(ac.sampleRate*0.004),tb=ac.createBuffer(1,len,ac.sampleRate),d=tb.getChannelData(0);for(var i=0;i<len;i++){var tt=i/ac.sampleRate;d[i]=(i<2?0.9:0)+Math.sin(2*PI*3300*tt)*Math.exp(-tt*1500)*0.55;}SND2.tick=tb;}
(function(){var b=sndInit;sndInit=function(){b.apply(this,arguments);try{sndWxInit();}catch(e){if(window.console)console.warn('sndwx',e);}};})();
/* 依目前的天氣與風速決定各環境音的音量（0 到約 0.17），以及下雪、大雨時的悶音（低通頻率） */
function sndWxTarget(){var E=G&&G.env;if(!E)return null;var w=WX[E.wx]||WX[0],r=w[3]||0,s=w[4]||0,W=typeof windNow==='function'?windNow():{ws:E.ws||0,wd:E.wd||0},ws=W.ws||0;
  return {rain:[0,0.05,0.1,0.14][r]||0,body:[0,0.012,0.05,0.085][r]||0,wind:Math.pow(clamp((ws-1.2)/14,0,1),1.2)*0.17,whis:clamp((ws-9)/10,0,1)*0.035,snow:[0,0.035,0.065][s]||0,muf:s>=2?3000:s>=1?5500:r>=2?9000:20000,storm:w[0]==='storm',ws:ws};}
function sndWxFrame(t,dt,run){var W=SND2.wx;if(!W)return;/* 每秒更新五次就夠了 */SND2.wxAcc=(SND2.wxAcc||0)+dt;if(SND2.wxAcc<0.2)return;dt=SND2.wxAcc;SND2.wxAcc=0;var T=G&&G.started?sndWxTarget():null,on=!!(T&&SND.on&&SND2.amb&&run),z=VW.cw?clamp(1.25-Math.log(Math.max(1,mpp()))/Math.LN10/2.6,0.45,1):1;
  SND2.gT-=dt;if(SND2.gT<=0){SND2.gTar=0.15+wxRnd()*0.85;SND2.gT=1.2+wxRnd()*3.5;}SND2.gust+=(SND2.gTar-SND2.gust)*Math.min(1,dt*0.8);var gu=SND2.gust;
  function set(k,v){W[k].g.gain.setTargetAtTime(on?v*z:0,t,0.6);}
  set('rain',T?T.rain:0);set('body',T?T.body:0);set('wind',T?T.wind*(0.5+0.65*gu):0);set('whis',T?T.whis*(0.3+0.9*gu):0);set('snow',T?T.snow*(0.7+0.4*gu):0);
  if(T){W.wind.f[0].frequency.setTargetAtTime(240+560*gu*Math.min(1,T.ws/12),t,0.5);W.whis.f[0].frequency.setTargetAtTime(1250+800*gu,t,0.5);}
  if(SND.muf)SND.muf.frequency.setTargetAtTime(on?T.muf:20000,t,0.8);
  if(on&&T.storm){SND2.thT-=dt;if(SND2.thT<=0){SND2.thT=7+wxRnd()*20;var near=wxRnd()<0.25;SNDF.thunder(t+0.05,(wxRnd()*2-1)*0.7,(near?0.5:0.3)*(0.6+wxRnd()*0.5),near);SND2.nTh++;}}}
/* ---------- 三、蓋格計數器 ---------- */
/* 量測的位置：選取的本方（上帝視角時任何）部隊；沒有選取時，地圖放大到 40 公尺／像素以內的畫面中央 */
function geigPos(){if(!G||!G.map||!G.started||UI.tab!=='battle')return null;var u=UI.sel&&UI.sel.length?uById(UI.sel[0]):null;if(u&&onMap(u)&&(UI.side<0||u.side===UI.side))return {x:u.x,y:u.y,u:u};
  if(VW.cw&&mpp()<=40){var c=s2w(VW.cw/2,VW.ch/2);return {x:c[0],y:c[1],u:null};}return null;}
/* 輻射強度（大約 0–3）：核爆落塵區隨時間衰減、靠近中心越強；放射性毒劑雲與地面污染。用畫面中央量測時只算看得到的污染雲、不算地面 */
function geigLvl(x,y,probe){var v=0;(G.rad||[]).forEach(function(z){var d=dist(x,y,z.x,z.y);if(d>z.r*1.2)return;var dec=clamp(1-(G.t-z.t0)/Math.max(1,z.t1-z.t0),0,1);v+=dec*(d<=z.r?0.35+0.65*(1-d/z.r):0.12*(1-(d-z.r)/(0.2*z.r)));});
  (G.cbx||[]).forEach(function(C){if(C.ag!=='dirty')return;var d=dist(x,y,C.x,C.y);if(d>C.r*1.6)return;if(probe&&typeof cbVis==='function'&&!cbVis(C.x,C.y,C.r,C.side))return;v+=clamp(C.m/Math.max(0.05,(C.r/400)*(C.r/400))*Math.exp(-2*(d/C.r)*(d/C.r))*0.45,0,2.5);});
  if(!probe&&G.cbgr&&typeof cbGK==='function'){var gv=G.cbgr[cbGK(x,y)+'|dirty'];if(gv>0.001)v+=clamp(gv*0.3,0,2);}return v;}
function geigCps(v){return v>0.004?clamp(2.5+80*Math.sqrt(v),2.5,140):0;}
function geigPoisson(l){if(l<=0)return 0;if(l>30)return Math.max(0,Math.round(l+Math.sqrt(l)*(wxRnd()+wxRnd()+wxRnd()-1.5)*2));var L=Math.exp(-l),k=0,p=1;do{k++;p*=wxRnd();}while(p>L);return k-1;}
function sndGeig(t,dt,cps){var ac=SND.ac,n=Math.min(16,geigPoisson(cps*dt));for(var k=0;k<n;k++){var s=ac.createBufferSource();s.buffer=SND2.tick;var gg=ac.createGain();gg.gain.value=0.2*(0.8+wxRnd()*0.4);s.connect(gg);gg.connect(SND.out);s.start(t+wxRnd()*dt);SND2.nClk++;}}
/* 讀數顯示在風向儀下方 */
function geigHud(cps){var h=typeof WXV!=='undefined'&&WXV.hud;if(!h)return;var e=h.querySelector('[data-k="w3"]');if(!e){var w2=h.querySelector('[data-k="w2"]');if(!w2)return;e=document.createElement('div');e.setAttribute('data-k','w3');e.style.cssText='color:#b71c1c;font-weight:600;display:none';w2.parentNode.appendChild(e);}
  var s=cps>0?'☢ 蓋格計數器 '+Math.round(cps)+' 次／秒':'';if(e.textContent!==s){e.textContent=s;e.style.display=s?'':'none';}}
/* 每一畫格：先量輻射（暫停時也照常量，計數器作響時音效引擎不休息），再更新環境音與計數器的聲音 */
(function(){var b=sndFrame;sndFrame=function(dt,run){var ac=SND.ac,cps=0;
    if(SND2.geig){var gp=geigPos();if(gp){SND2.lvl=geigLvl(gp.x,gp.y,!gp.u);cps=geigCps(SND2.lvl);}else SND2.lvl=0;}else SND2.lvl=0;SND2.cps=cps;try{geigHud(cps);}catch(e){}
    var live=cps>0&&SND.on&&!!ac;if(live){SND.idle=0;if(ac.state==='suspended'&&!document.hidden)ac.resume();}
    b(dt,run);if(!ac||ac.state!=='running')return;var t=ac.currentTime;try{sndWxFrame(t,dt,run);}catch(e){}if(live&&SND2.tick&&dt>0)sndGeig(t,dt,cps);};})();
/* ---------- 四、設定與說明 ---------- */
setSec('snd','amb',{o:20,h:function(){return setOpt(setRow('環境音',setChk('sndamb','',SND2.amb,'雨聲、風聲與陣風、下雪時聲音變悶、雷雨的雷聲'))+setRow('蓋格計數器',setChk('sndgeig','',SND2.geig,'選取的部隊或畫面中央在輻射區時劈啪作響，風向儀下方顯示讀數')));}});
CHG.sndamb=function(t){SND2.amb=!!t.checked;snd2Save();};CHG.sndgeig=function(t){SND2.geig=!!t.checked;snd2Save();};
HELP14.push('<h4>環境音、蓋格計數器與各時代的交火聲</h4><ul><li><b>環境音</b>：下雨時有雨聲（大雨還有低沉的雨幕），風聲隨風速增強並有陣風起伏，強風時呼嘯；下雪時有輕微的沙沙聲，而且雪會吸音，戰場的聲音都變悶；雷雨時遠近不一的雷聲翻滾。暫停時淡出。</li>'+
  '<li><b>蓋格計數器</b>：選取的部隊（沒有選取時，地圖放大到 40 公尺／像素以內的畫面中央）位在核爆落塵區或放射性污染（髒彈、核電廠事故）裡時劈啪作響，輻射越強越密；風向儀下方顯示每秒計數。選取部隊時暫停中也會響。</li>'+
  '<li><b>交火聲依年代</b>：火繩槍是參差的齊射；燧發槍線列幾乎同時齊射，偶爾稀稀落落地補射，有時是排槍輪射；拿破崙時代多了散兵的零星射擊；線膛槍時代多半各自射擊；黑火藥都帶著低沉的轟聲，滑膛砲的實心彈落地是悶響。無煙火藥以後是清脆的栓動步槍；一次大戰起有機槍的長連發、輕機槍與手榴彈；二次大戰有衝鋒槍與射速很高的機槍（各部隊的機槍射速不同）；冷戰以後是突擊步槍的連發與點放、通用機槍、重機槍與火箭筒；現代還有精準的單發與榴彈發射器。</li>'+
  '<li>都在瀏覽器裡即時合成，跟著「音效」開關與音量；環境音與蓋格計數器可在「設定 → 畫面效果與音效」或工具列的音效面板分別關閉。</li></ul>');
