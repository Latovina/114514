/* ===================== 事件：氣候與天災、軍紀案件、疾病、游擊隊、缺糧缺彈與補給事故、勸降、後方休整與福利 =====================
   事件依地區氣候、季節、地形與時代決定是否可能發生；頻率可在「設定」調整。軍紀與暴行事件以平實的報告語氣記錄，並計入戰後總結。 */
var EVK={heat:'熱浪',cold:'寒潮',rain:'豪雨',flood:'河水暴漲',monsoon:'季風雨季',typhoon:'颱風',quake:'地震',slide:'山崩與土石流',fire:'野火',sand:'沙塵暴',blizzard:'暴風雪',fog:'持續濃霧',tsunami:'海嘯'};
function evtSet(){var E=G.set.evt;if(!E)E=G.set.evt={on:true,freq:1,clim:true,quake:'auto',disc:true,dis:true,gue:true,short:true,pers:true,wel:true};return E;}
function evtInit(){var MP=G.map,c=climMonth(G.set.m),N=MP.GW*MP.GH,sea=0,des=0,sl=slopeArr(),steep=0;for(var k=0;k<N;k+=7){var l=MP.lc[k];if(l===LCI.sea||l===LCI.shal)sea++;if(l===LCI.desert)des++;if(sl[k]>25)steep++;}var n=N/7;
  G.evt={A:[],H:[],seq:0,nx:G.t+1800,coast:sea/n>0.02,des:des/n>0.15,mtn:steep/n>0.06,fv:0,fl:null,fire:null,burn:0,mons:false};
  var lat=Math.abs(MP.lat0||35),C=MP.clim||{Pj:60,Pl:70},m=G.set.m,NH=(MP.lat0||35)>=0,summer=NH?m>=6&&m<=9:(m>=12||m<=3),wetS=NH?C.Pl:C.Pj,dryS=NH?C.Pj:C.Pl;
  if(evtSet().on&&evtSet().clim&&lat<35&&summer&&wetS>=150&&wetS>=2.5*Math.max(1,dryS)){G.evt.mons=true;evtStart('monsoon',{dur:G.set.dur*3600+86400,global:1});}}
function evtActive(k){return G.evt&&G.evt.A.some(function(e){return e.k===k;});}
function evtGet(k){return G.evt?G.evt.A.filter(function(e){return e.k===k;})[0]:null;}
/* 每小時：依氣候與地形擲骰 */
function evtRates(){var MP=G.map,o=now(),c=climMonth(o.m),T=c.T,P=c.P,lat=Math.abs(MP.lat0||35),NH=(MP.lat0||35)>=0,m=o.m,E=G.evt,S=evtSet(),q=S.quake==='auto'?(E.mtn?'low':'none'):S.quake,f=S.freq||1,R={};
  R.heat=0.22*sm(20,30,T);R.cold=0.2*sm(6,-12,T);R.rain=0.18*sm(50,180,P)*(E.mons?1.5:1);R.blizzard=T<-4?0.12*sm(-4,-15,T)*sm(20,60,P):0;R.fog=0.12*sm(40,100,P)*(o.h>=2&&o.h<=7?1.6:0.4);
  R.typhoon=E.coast&&lat>=8&&lat<=35&&T>=22&&(NH?(m>=6&&m<=11):(m>=12||m<=4))?0.05*(NH?(m===8||m===9?2:1):(m===1||m===2?2:1)):0;
  R.quake=q==='high'?0.025:q==='low'?0.005:0;R.fire=T>=24&&P<50?0.12*sm(50,10,P):0;R.sand=E.des?0.14*sm(15,35,T+5):0;R.slide=E.mtn&&(evtActive('rain')||evtActive('typhoon'))?0.4:0;
  for(var k in R)R[k]*=f;return R;}
function evtStep(){if(!G.evt)return;var E=G.evt,S=evtSet();if(!S.on)return;
  if(S.clim&&G.t>=E.nx){E.nx=G.t+3600;var R=evtRates();for(var k in R){if(evtActive(k)||R[k]<=0)continue;if(rnd()<R[k]/24)evtStart(k,{});}}
  E.A.forEach(function(e){evtTick(e);});E.A=E.A.filter(function(e){if(G.t>=e.t1){evtEnd(e);return false;}return true;});
  /* 各子系統每 10 分鐘一次，分散在不同的步數，避免同一步的卡頓 */var st20=G.step%20;if(st20===5&&S.disc)discStep();if(st20===18&&S.dis)disStep();if(st20===6&&S.gue)gueStep();if(st20===12&&S.short)shortStep();if(st20===16&&S.pers)persStep();if(st20===8&&S.wel)welStep();
  if(S.gue&&G.step%4===1)gueAct();}
function evtStart(k,o){var E=G.evt,MP=G.map,e={id:++E.seq,k:k,t0:G.t,sev:o.sev||(0.6+0.8*rnd()),x:o.x!==undefined?o.x:rnd()*MP.Wm,y:o.y!==undefined?o.y:rnd()*MP.Hm,R:o.R||1e9,ph:0};
  var hr={heat:[24,72],cold:[24,72],rain:[6,20],flood:[24,48],typhoon:[20,34],quake:[6,12],slide:[2,4],fire:[6,30],sand:[6,18],blizzard:[6,24],fog:[4,10],tsunami:[2,6],monsoon:[24,24]}[k]||[6,12];
  e.t1=G.t+(o.dur||(hr[0]+rnd()*(hr[1]-hr[0]))*3600);E.A.push(e);E.H.push({k:k,t0:e.t0,t1:e.t1,x:e.x,y:e.y,sev:e.sev,M:0,txt:''});var H=E.H[E.H.length-1];
  if(k==='typhoon'){var a=rnd()*2*PI;e.vx=Math.cos(a);e.vy=Math.sin(a);e.x=MP.Wm/2-e.vx*MP.Wm*1.2;e.y=MP.Hm/2-e.vy*MP.Hm*1.2;e.spd=(MP.Wm*2.4)/((e.t1-e.t0));e.R=Math.max(120000,MP.Wm);}
  if(k==='quake'){var M=o.M||Math.min(8.2,5+(-Math.log(Math.max(1e-6,rnd()))/2.1));e.M=M;H.M=M;quakeHit(e);}
  if(k==='fire'){fireIgnite(e.x,e.y,e);}
  if(k==='flood'){floodStart(e);}
  if(k==='slide'){slideHit(e);}
  if(k==='tsunami'){tsunamiHit(e);}
  var tx={heat:'熱浪來襲，氣溫升高；行軍與穿戴防護裝備的部隊容易中暑',cold:'寒潮來襲，氣溫驟降；缺乏禦寒裝備的部隊與難民恐有凍傷',rain:'豪雨來襲：道路泥濘、能見度與航空作業下降',flood:'河水暴漲：淺灘無法徒涉，浮橋與便橋可能被沖毀，低窪地淹水',monsoon:'正值季風雨季：降雨頻繁、道路泥濘，瘧疾與痢疾容易流行',typhoon:'颱風逼近：預計 '+durTxt(e.t1-e.t0)+' 內通過，期間航空作業停止、艦艇須避風',quake:'發生芮氏規模 '+fx(e.M,1)+' 地震（震央在'+placeTxt(e.x,e.y)+'）',slide:'山區豪雨引發山崩與土石流',fire:'野火在'+placeTxt(e.x,e.y)+'燃起，隨風蔓延',sand:'沙塵暴：能見度極低，航空作業停止，車輛濾清器阻塞',blizzard:'暴風雪：能見度與機動大幅下降，凍傷風險升高',fog:'持續濃霧籠罩戰場',tsunami:'海嘯沖上沿岸低地'}[k];
  H.txt=tx;if(k!=='monsoon'||G.t<60)logE(-1,'evt','⚠ '+EVK[k]+'：'+tx,k==='quake'||k==='fire'?e.x:undefined,k==='quake'||k==='fire'?e.y:undefined);if(G.onPause&&apOn('evt')&&/typhoon|quake|tsunami|flood|slide|fire/.test(k))G.onPause(EVK[k]);return e;}
function evtEnd(e){var E=G.evt;if(e.k==='flood'){E.fl=null;E.fv++;mapChangedSoft();}if(e.k==='rain'&&e.sev>1&&rnd()<0.5&&G.map.rivs&&G.map.rivs.length)evtStart('flood',{sev:e.sev});if(e.k==='typhoon'&&G.map.rivs&&G.map.rivs.length)evtStart('flood',{sev:1.2});
  if(e.k!=='monsoon')logE(-1,'evt',EVK[e.k]+'結束');}
function mapChangedSoft(){G._mapv=(G._mapv||0)+1;PF={};}
/* 天氣與氣溫覆寫（由 envStep 呼叫） */
function evtEnv(E){if(!G.evt)return;var A=G.evt.A,forceWx=-1,dT=0,vis=1;A.forEach(function(e){var k=e.k;if(k==='heat')dT+=5+3*e.sev;else if(k==='cold')dT-=8+5*e.sev;else if(k==='rain')forceWx=e.sev>1.1?WXI.storm:WXI.hrain;else if(k==='typhoon'){var d=dist(e.x,e.y,G.map.Wm/2,G.map.Hm/2);forceWx=d<e.R*0.6?WXI.storm:WXI.hrain;}
    else if(k==='sand'){forceWx=WXI.fog;}else if(k==='blizzard'){forceWx=WXI.hsnow;dT-=4;}else if(k==='fog'){forceWx=WXI.fog;}else if(k==='monsoon'){if(E.wx<WXI.lrain&&rnd()<0.004)forceWx=rnd()<0.6?WXI.lrain:WXI.hrain;}});
  if(forceWx>=0&&E.wx!==forceWx){E.wx=forceWx;E.vis=WX[forceWx][2];}E.T+=dT;E.vis*=vis;if(G.evt.fire&&G.evt.burnA>0)E.smoke=1;else E.smoke=0;}
/* 移動係數（由 speedAt 呼叫） */
function evtSpeed(u,s){var f=1,A=G.evt?G.evt.A:[];for(var i=0;i<A.length;i++){var k=A[i].k;if(k==='typhoon'){var d=dist(A[i].x,A[i].y,u.x,u.y);if(d<60000)f*=0.6;}else if(k==='sand')f*=s.mobi>=3?0.5:0.7;else if(k==='blizzard')f*=0.6;}
  var E=G.evt;if(E&&E.fl&&E.fl[cellAt(u.x,u.y)])f*=0.35;if(E&&E.fire&&E.fire[cellAt(u.x,u.y)]===1)f*=0.5;return f;}
/* 每步效應 */
function evtTick(e){var k=e.k,MP=G.map,h=DT/3600;
  if(k==='typhoon'){e.x+=e.vx*e.spd*DT;e.y+=e.vy*e.spd*DT;if(G.step%20===0){var d0=dist(e.x,e.y,MP.Wm/2,MP.Hm/2);G.units.forEach(function(u){if(!onMap(u))return;var s=ST(u);if((s.dom==='sea'||s.dom==='sub')&&!(G.sides[u.side].nodes||[]).some(function(N){return N.k==='port'&&dist(N.x,N.y,u.x,u.y)<8000;})){var l=s.dom==='sub'?0.002:0.012*(s.dr<=1?2:1);hit(u,null,u.men*l,u.veh*l*0.5,10,'storm');}
      if(s.dom==='land'&&d0<e.R*0.7){u.mor=clamp(u.mor-0.5,0,100);u.fat=clamp(u.fat+1,0,100);}});if(G.civ&&d0<e.R*0.6){G.civ.S.forEach(function(g){var v=g.val0*0.0015*e.sev;g.loss+=v;G.civ.prop.other+=v;if(rnd()<0.08)civHit(g.x,g.y,g.r,0.0006*e.sev,'storm',-1,0.3);});}}}
  if(k==='heat'&&G.step%20===0){var T=G.env.T;if(T>31)G.units.forEach(function(u){if(!onMap(u)||ST(u).dom!=='land'||!isLeaf(u))return;var act=G.t-(u.movedAt||-1e9)<600||G.t-(u.fired||-1e9)<600;if(!act)return;var ba=infDef(typeOf((u.mix||[[u.hq]])[0][0])||{}),r=u.men*0.0007*(T-31)/5*clamp((ba.ld||30)/30,0.8,1.6)*(ba.ba>=2?1.4:1)*(paceOf(u)[0]==='rush'?1.6:1)*(10/60);sickAdd(u,r,'heat');u.fat=clamp(u.fat+2,0,100);});}
  if((k==='cold'||k==='blizzard')&&G.step%20===0){var T2=G.env.T;if(T2<-8)G.units.forEach(function(u){if(!onMap(u)||ST(u).dom!=='land'||!isLeaf(u))return;var c=MP.lc[cellAt(u.x,u.y)],shel=isUrban(c)?0.25:(c===LCI.dfor||c===LCI.cfor)?0.6:1,r=u.men*0.0005*(-8-T2)/10*shel*(k==='blizzard'?2:1)*(u.lg&&u.lg.hun>50?1.5:1)*(10/60);sickAdd(u,r,'frost');});}
  if(k==='fire'&&G.step%20===0)fireSpread(e);
  if(k==='flood'&&G.step%40===0&&G.civ){G.civ.S.forEach(function(g){if(!E2fl(g))return;var v=g.val0*0.002*e.sev;g.loss+=v;G.civ.prop.flood+=v;g.alarm=Math.max(g.alarm,0.5);});}
  if(k==='quake'&&G.step%60===0&&rnd()<0.25){var M2=Math.max(4.5,(e.M||6)-1.2-rnd());quakeHit({x:e.x+(rnd()-0.5)*8000,y:e.y+(rnd()-0.5)*8000,M:M2,after:1});}}
function E2fl(g){var F=G.evt.fl;return F&&F[cellAt(g.x,g.y)];}
/* 地震：依震度造成城鎮倒塌、平民與部隊傷亡、橋梁與隧道損毀、山崩 */
function quakeHit(e){var MP=G.map,cs=MP.cs,W=G.set.wealth||'mid',vul=(W==='poor'?1.5:W==='rich'?0.7:1)*(G.set.y<1950?1.3:G.set.y>=1990?0.6:1),ks=[],D=dmgArr(),sl=slopeArr(),rubN=0,night=G.env.light<0.3?1.5:1;
  function I(d){return 1.5*e.M-3.5*Math.log(d/1000+10)/Math.LN10+3.2;}var Rmax=Math.min(Math.max(MP.Wm,MP.Hm),Math.pow(10,(1.5*e.M+3.2-6)/3.5)*1000);
  brushCells(MP,e.x/cs,e.y/cs,Rmax/cs,function(k){var c=MP.lc[k],x=(k%MP.GW+0.5)*cs,y=(((k/MP.GW)|0)+0.5)*cs,i=I(dist(x,y,e.x,e.y));if(i<6)return;
    if(isUrban(c)&&c!==LCI.rubble){var p=clamp((i-6.5)*0.18*vul,0,0.9);if(rnd()<p){MP.lc[k]=LCI.rubble;D[k]=255;ks.push(k);rubN++;if(G.civ)civProp(k,1,'quake',-1);}else if(G.civ)civProp(k,p*0.3,'quake',-1);}
    else if(i>=7&&sl[k]>30&&rnd()<0.02*(i-6)){if(MP.rd[k]){MP.rd[k]=0;ks.push(k);}MP.lc[k]=LCI.rock;ks.push(k);}
    if(MP.rd[k]&&i>=7&&G.set.roadDyn!==false){/* 路面龜裂、落石與倒塌物 */if(!G.rdd||G.rdd.length!==MP.GW*MP.GH)G.rdd=new Uint8Array(MP.GW*MP.GH);G.rdd[k]=Math.min(255,G.rdd[k]+Math.round((i-6.5)*90*vul));}});
  var lostB=MP.brg.filter(function(q){var i=I(dist((q.x+0.5)*cs,(q.y+0.5)*cs,e.x,e.y));return i>=8&&rnd()<0.25*(i-7.5);});if(lostB.length){lostB.forEach(function(q){var k=q.y*MP.GW+q.x;MP.rd[k]=0;MP.rl[k]=0;ks.push(k);if(G.civ)propInf('bridge',q.c,-1,1);});MP.brg=MP.brg.filter(function(q){return lostB.indexOf(q)<0;});}
  if(ks.length)mapChanged(ks);var hurt=0;G.units.forEach(function(u){if(!onMap(u)||ST(u).dom!=='land')return;var i=I(dist(u.x,u.y,e.x,e.y));if(i<6.5)return;var c=MP.lc[cellAt(u.x,u.y)],f=(isUrban(c)||c===LCI.rubble?0.02:0.002)*(i-6.5)*vul;if(f>0){hit(u,null,u.men*f,u.veh*f*0.3,15,'quake');hurt++;}u.mor=clamp(u.mor-(i-6)*3,0,100);});
  var civ=0;if(G.civ)G.civ.S.forEach(function(g){var i=I(dist(g.x,g.y,e.x,e.y));if(i<6.5)return;var p=civPresent(g),c=p*clamp((i-6.5)*0.012*vul*night,0,0.25);if(c>0.5){civCas(g,c,0.35,'quake',-1);civ+=c;g.alarm=1;}});
  var t=(e.after?'餘震（規模 '+fx(e.M,1)+'）':'地震（規模 '+fx(e.M,1)+'）')+'：'+rubN+' 處街區倒塌'+(lostB.length?'、'+lostB.length+' 座橋梁損毀':'')+(hurt?'、'+hurt+' 個單位受創':'')+(civ>1?'，平民傷亡約 '+fmt(civ)+' 人':'');logE(-1,'evt',t,e.x,e.y);
  if(!e.after&&e.M>=7.4&&G.evt.coast&&MP.lc[cellAt(e.x,e.y)]<=LCI.shal)evtStart('tsunami',{x:e.x,y:e.y,sev:e.M-6.5});}
function tsunamiHit(e){var MP=G.map,cs=MP.cs,ks=[];for(var k=0;k<MP.GW*MP.GH;k++){if(MP.el[k]>=0&&MP.el[k]<6&&!isWater(MP.lc[k])){var x=k%MP.GW,y=(k/MP.GW)|0,near=false;for(var dy=-6;dy<=6&&!near;dy+=3)for(var dx=-6;dx<=6&&!near;dx+=3){var X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<MP.GW&&Y<MP.GH&&MP.lc[Y*MP.GW+X]<=LCI.shal)near=true;}if(near){if(isUrban(MP.lc[k])){MP.lc[k]=LCI.rubble;if(G.civ)civProp(k,0.8,'flood',-1);}ks.push(k);}}}
  if(ks.length)mapChanged(ks);G.units.forEach(function(u){if(!onMap(u)||ST(u).dom!=='land')return;var k=cellAt(u.x,u.y);if(MP.el[k]<6&&ks.indexOf(k)>=0)hit(u,null,u.men*0.08*e.sev,u.veh*0.1,30,'storm');});if(G.civ)G.civ.S.forEach(function(g){var k=cellAt(g.x,g.y);if(MP.el[k]<8&&ks.length&&ks.indexOf(k)>=0)civCas(g,civPresent(g)*0.05*e.sev,0.5,'flood',-1);});}
/* 洪水：沿大河的低窪地淹水；浮橋與突擊橋可能被沖走 */
function floodStart(e){var MP=G.map,N=MP.GW*MP.GH,F=new Uint8Array(N),cs=MP.cs,R=Math.ceil(700/cs),n=0;for(var k=0;k<N;k++){if(!(MP.rv[k]>=2||MP.lc[k]===LCI.riv))continue;var x=k%MP.GW,y=(k/MP.GW)|0,e0=MP.el[k];for(var dy=-R;dy<=R;dy+=1)for(var dx=-R;dx<=R;dx+=1){var X=x+dx,Y=y+dy;if(X<0||Y<0||X>=MP.GW||Y>=MP.GH)continue;var q=Y*MP.GW+X;if(!F[q]&&!isWater(MP.lc[q])&&MP.el[q]-e0<2.5*e.sev){F[q]=1;n++;}}}
  G.evt.fl=F;G.evt.fv++;mapChangedSoft();var lost=MP.brg.filter(function(q){return (q.t==='f'||q.t==='a'||q.t==='e')&&rnd()<0.35*e.sev;});if(lost.length){lost.forEach(function(q){var k=q.y*MP.GW+q.x;MP.rd[k]=0;MP.rl[k]=0;});MP.brg=MP.brg.filter(function(q){return lost.indexOf(q)<0;});mapChanged(lost.map(function(q){return q.y*MP.GW+q.x;}));logE(-1,'evt','洪水沖毀 '+lost.length+' 處浮橋或便橋',undefined,undefined);}
  G.evt.flN=n;}
/* 山崩：陡坡上的道路被土石掩埋 */
function slideHit(e){var MP=G.map,sl=slopeArr(),c=0,ks=[];for(var t=0;t<4000&&c<6;t++){var k=Math.floor(rnd()*MP.GW*MP.GH);if(sl[k]>28&&MP.rd[k]&&!MP.tn[k]){var x=(k%MP.GW+0.5)*MP.cs,y=(((k/MP.GW)|0)+0.5)*MP.cs;brushCells(MP,k%MP.GW,(k/MP.GW)|0,2,function(q){if(!isWater(MP.lc[q])){MP.rd[q]=0;MP.lc[q]=LCI.rock;ks.push(q);}});G.units.forEach(function(u){if(onMap(u)&&dist(u.x,u.y,x,y)<300)hit(u,null,u.men*0.03,u.veh*0.05,20,'storm');});logE(-1,'evt','山崩掩埋'+placeTxt(x,y)+'的道路',x,y);c++;}}if(ks.length)mapChanged(ks);}
/* 野火：植被格逐步延燒（受風向與乾燥影響），雨停火熄 */
var FIREC=null;function burnable(c){if(!FIREC){FIREC={};['dfor','cfor','jung','scrub','mead','field','orch','hedge','tund'].forEach(function(k){FIREC[LCI[k]]=1;});}return !!FIREC[c];}
function fireIgnite(x,y,e){var MP=G.map,E=G.evt;if(!E.fire)E.fire=new Uint8Array(MP.GW*MP.GH);var k=cellAt(x,y),tries=0;while(!burnable(MP.lc[k])&&tries++<60){k=cellAt(x+(rnd()-0.5)*6000,y+(rnd()-0.5)*6000);}if(!burnable(MP.lc[k]))return;E.fire[k]=1;E.burnA=(E.burnA||0)+1;if(e){e.fx=k;}E.wind=E.wind===undefined?rnd()*2*PI:E.wind;}
function fireSpread(e){var MP=G.map,E=G.evt,F=E.fire;if(!F)return;var wet=WX[G.env.wx][3]>=1,ks=[],next=[],GW=MP.GW,wx=Math.cos(E.wind),wy=Math.sin(E.wind);if(wet){e.t1=Math.min(e.t1,G.t+1800);}
  for(var k=0;k<F.length;k++){if(F[k]!==1)continue;if(rnd()<0.35){F[k]=2;E.burnA--;MP.lc[k]=LCI.burnt;ks.push(k);if(G.civ)civProp(k,0.1,'fire',-1);}var x=k%GW,y=(k/GW)|0;if(wet||(E.burn||0)>6000)continue;
    for(var d=0;d<8;d++){var dx=[1,1,0,-1,-1,-1,0,1][d],dy=[0,1,1,1,0,-1,-1,-1][d],X=x+dx,Y=y+dy;if(X<0||Y<0||X>=GW||Y>=MP.GH)continue;var q=Y*GW+X;if(F[q]||!burnable(MP.lc[q]))continue;var c=MP.lc[q],fu=c===LCI.dfor||c===LCI.cfor||c===LCI.scrub?0.3:c===LCI.jung?0.08:0.18,al=(dx*wx+dy*wy)/Math.sqrt(dx*dx+dy*dy);if(rnd()<fu*(1+al)*0.6)next.push(q);}}
  next.forEach(function(q){if(!F[q]){F[q]=1;E.burnA=(E.burnA||0)+1;E.burn=(E.burn||0)+1;}});if(ks.length)mapChanged(ks);
  G.units.forEach(function(u){if(!onMap(u)||ST(u).dom!=='land')return;var k=cellAt(u.x,u.y);if(F[k]===1){hit(u,null,u.men*0.01,u.veh*0.01,25,'burn');u.mor=clamp(u.mor-3,0,100);}});if(!E.burnA)e.t1=Math.min(e.t1,G.t);}
/* 砲擊引燃乾燥植被（由 artyFire 機率呼叫） */
function fireChance(x,y){var E=G.evt;if(!E||!evtSet().on||!evtSet().clim)return;var c=climMonth(now().m);if(c.T<20||WX[G.env.wx][3]>=1||c.P>80)return;var MP=G.map;if(!burnable(MP.lc[cellAt(x,y)]))return;if(rnd()<0.0015*sm(80,10,c.P)){if(!evtActive('fire'))evtStart('fire',{x:x,y:y});else fireIgnite(x,y,null);}}
/* ---------- 疾病 ---------- */
var DZ={dys:['痢疾',2,0.03,0.003,5],chol:['霍亂',0.3,0.35,0.01,4],typh:['傷寒',0.4,0.15,0.01,14],tyfe:['斑疹傷寒',0.3,0.2,0.02,14],mal:['瘧疾',2.5,0.02,0.003,10],flu:['流行性感冒',2,0.005,0.001,6],pox:['天花',0.15,0.25,0.25,14],plag:['鼠疫',0.03,0.6,0.1,7],foot:['戰壕足',1.5,0,0,10],vd:['性病',0.3,0.002,0,20],heat:['中暑',0,0.05,0.02,1],frost:['凍傷',0,0.03,0.01,7]};
function dzRates(y,T,P,static_,crowd,hun){var R={};R.dys=sm(12,28,T)*1.5+0.3;R.chol=y>=1817&&y<1960?sm(20,30,T)*sm(60,200,P):0.05*sm(20,30,T);R.typh=y<1950?sm(10,25,T)+0.2:0.1;R.tyfe=y<1950?sm(10,-5,T)*crowd:0.05*crowd;R.mal=sm(20,27,T)*sm(80,200,P)*2;R.flu=sm(12,0,T)+(y>=1918&&y<=1919?3:0);R.pox=y<1900?1:0;R.plag=y<1750?1:0;R.foot=y>=1914&&y<=1945&&T<10&&P>60&&static_?1:0;
  for(var k in R)R[k]*=(1+hun);return R;}
function sickAdd(u,n,dk){if(n<=0)return;n=Math.min(n,u.men*0.5);u.men-=n;u.sick=(u.sick||0)+n;u.dzk=dk;medStat(u.side).sick+=n;}
function disStep(){var dt=600,d=dt/86400,o=now(),c=climMonth(o.m),T=G.env.T,P=c.P*(G.evt.mons?1.6:1);SIDES().forEach(function(side){var hq=sideCmd(side),y=hq?uEra(hq).y:G.set.y,mq=y<1850?0.1:y<1914?0.3:y<1945?0.55:y<1970?0.8:0.92,sex=polSide(side).sex||'ban';
    G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||!onMap(u)||ST(u).dom!=='land')return;var men=u.men;if(men<1&&!(u.sick>0))return;var lg=u.lg||{},crowd=1+(u.pw||u.ref?2:0),stat=u.ent>0.5&&G.t-(u.movedAt||-1e9)>12*3600,R=dzRates(y,T,P,stat,crowd,clamp(((lg.hun||0)-40)/60,0,1)),med=flUnits(side,'D').some(function(q){return onMap(q)&&dist(q.x,q.y,u.x,u.y)<6000;}),san=(1-mq*0.7)*(med?0.6:1);
      R.vd=({ban:0.4,tol:3,reg:1.5,coer:2.5})[sex]*(u.ord&&/rest|reserve|halt/.test(u.ord.k)?1.5:0.5);var newC=0,best=null,bv=0;for(var k in R){var v=men*DZ[k][1]/1000*R[k]*san*d;newC+=v;if(v>bv){bv=v;best=k;}}
      var near=0;gridNear(u.x,u.y,1500,function(q){if(q!==u&&q.sick>q.men*0.03)near++;});newC*=1+near*0.3;if(newC>0.001)sickAdd(u,newC,best);
      if(u.sick>0.01){var dk=DZ[u.dzk||'dys'],rec=u.sick/(dk[4]||7)*d*medFx(u,'rec',1),mort=u.sick*(med?dk[3]+(dk[2]-dk[3])*(1-mq):dk[2])/(dk[4]||7)*d*medFx(u,'dis',1);u.sick-=rec+mort;u.men=Math.min(u.men0,u.men+rec);medStat(side).dis+=mort;if(u.sick<0)u.sick=0;
        if(u.sick>u.men0*0.04&&(!u.dzLog||G.t-u.dzLog>12*3600)){u.dzLog=G.t;logE(side,'dis',uName(u)+'爆發'+(DZ[u.dzk]||DZ.dys)[0]+'，約 '+fmt(u.sick)+' 人無法作戰',u.x,u.y,u.id);}}});});
  /* 平民與收容所 */if(G.civ){var y2=G.set.y,mq2=y2<1900?0.2:y2<1950?0.45:0.8;G.civ.S.forEach(function(g){var p=civPresent(g);if(p<20)return;var R=dzRates(y2,T,P,false,1+(g.hung>40?1:0),g.hung/100),r=0;for(var k in R)if(k!=='foot'&&k!=='vd')r+=DZ[k][1]/1000*R[k];var nc=p*r*d*(1-mq2*0.6);g.sick=(g.sick||0)+nc;var dm=g.sick*0.012*d*(1-mq2*0.7);g.sick=Math.max(0,g.sick-g.sick*d/7-dm);if(dm>0.01)civCas(g,dm/0.95,0.95,'disease',-1);});
    G.units.forEach(function(u){if(!(u.ref>50)||!alive(u))return;var cap=Math.max(100,mixX(u,'cap')),cr=u.ref/cap,dm=u.ref*0.0004*(1+Math.max(0,cr-1)*4)*d*(u.campHun>50?2:1);u.ref-=dm;campDead(dm);G.civ.byC=G.civ.byC||{};G.civ.byC.disease=(G.civ.byC.disease||0)+dm;G.civ.kill=(G.civ.kill||0)+dm;
      if(cr>1.3&&(!u.dzLog||G.t-u.dzLog>24*3600)&&rnd()<0.3){u.dzLog=G.t;logE(u.side,'dis',uName(u)+'因過度擁擠爆發'+(T>20?'霍亂與痢疾':'斑疹傷寒'),u.x,u.y,u.id);}});}}
/* ---------- 軍紀 ---------- */
function disInit(u){if(u.dis!==undefined)return;var o=offOf(u)||{},L=Math.max(polOf(u,'civ'),polOf(u,'pow'));u.dis=clamp(32+(u.trn||60)*0.45+((o.cmd||5)-5)*3-L*5+(hasQ(o,'inspire')?5:0)-(hasQ(o,'reckless')?4:0)+lawEra().dis+rnd()*10,5,98);u.dis0=u.dis;}
var DISC={loot:'搶劫',req:'強徵物資',labor:'強迫勞役',arson:'縱火',rape:'性暴力',mass:'屠殺平民',host:'處決人質',deport:'強制遷徙',powab:'虐待戰俘',powex:'處決戰俘',brawl:'酗酒鬥毆',theft:'盜賣軍需',desert:'逃亡',insub:'抗命',frag:'襲擊長官',selfw:'自傷逃避',haze:'欺凌新兵',ffight:'友軍衝突',sleep:'哨兵睡崗',acc:'走火意外',awol:'擅離職守',steal:'偷竊友軍物資'};
var CRIMEK={loot:1,req:0,labor:1,arson:1,rape:1,mass:1,host:1,deport:1,powab:1,powex:1};
function mpNear(u,R){var b=null,bd=1e18;flUnits(u.side,'M').forEach(function(q){if(!onMap(q))return;var d=dist(q.x,q.y,u.x,u.y);if(d<R&&d<bd){bd=d;b=q;}});return b;}
function discStep(){var S=evtSet(),f=S.freq||1,h=600/3600;G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||ST(u).dom!=='land'||u.st==='lift')return;var fl=ST(u).fl;if(fl.indexOf('G')>=0)return;disInit(u);
    var lg=u.lg||{},Lc=polOf(u,'civ'),Lp=polOf(u,'pow'),mp=mpNear(u,uEra(u).y>=1914?9000:6000),tgt=u.dis0-((lg.hun>50?12:0)+(u.fat>70?6:0)+(u.rcas>0.15?10:0)+(u.oos>12*3600?6:0))*lawEra().mul+(mp?6:0)+(u.ord&&u.ord.k==='rest'?3:0);u.dis+=(tgt-u.dis)*0.05;u.dis=clamp(u.dis,0,100);
    var g=G.civ?civNearSet(u):null,ctx=(u.ord&&/rest|reserve|halt|defend/.test(u.ord.k)&&G.t-(u.uf||-1e9)>1800?1.5:1)*(lg.hun>50?1.5:1)*(u.rcas>0.15?1.6:1),p=0.004*Math.pow((100-u.dis)/50,2)*ctx*f*h+(g&&Lc>=3?0.01*(Lc-2)*f*h:0)+(Lp>=3&&powNear(u)?0.006*(Lp-2)*f*h:0);
    if(G.press&&G.press.R.some(function(R){return R.st==='ok'&&(polSide(R.side>=0?R.side:R.host).press||'control')==='free'&&R.host===u.side&&inTree(u,R.emb);}))p*=0.7;
    if(rnd()>p)return;var W=[],add=function(k,w){if(w>0)W.push([k,w]);},enemyLand=g&&g.loy>=0&&g.loy!==u.side,pres=g?civPresent(g):0;
    if(g&&pres>20){add('loot',(2+Lc)*(enemyLand?1.5:0.6));add('req',Lc>=2?2+Lc:0.5);add('labor',Lc>=2?1+Lc:0);add('arson',Lc>=3?(Lc-1)*(enemyLand?1:0.3):0.1);add('rape',(0.5+0.6*Lc)*(mp&&Lc<=2?0.3:1)*(u.dis<35?2:1));add('mass',Lc>=4&&enemyLand?1.5*(Lc-2)*(g.unrest>40||u.rcas>0.15?2:1):Lc>=3&&enemyLand&&u.rcas>0.2?0.4:0);add('host',Lc>=3&&enemyLand&&g.gueT&&G.t-g.gueT<6*3600?2*(Lc-2):0);add('deport',Lc>=5&&enemyLand?2:0);}
    var pn=powNear(u);if(pn){add('powab',Lp>=2?1+Lp:0.3);add('powex',Lp>=3?Lp-1:0);}
    add('brawl',2);add('theft',1.5);add('desert',(u.mor<45?3:1)*(lg.hun>50?2:1)*(uEra(u).y<1900?1.5:1));add('insub',u.mor<45?1.5:0.5);add('frag',u.rcas>0.25&&u.mor<40?0.25:0.03);add('selfw',u.mor<40?0.8:0.2);add('haze',0.6);add('sleep',G.env.light<0.3?1:0.2);add('acc',0.6);add('awol',g&&pres>20?0.8:0.3);add('steal',0.4);
    var ff=null;gridNear(u.x,u.y,600,function(q){if(!ff&&q!==u&&q.side===u.side&&onMap(q)&&isLeaf(q))ff=q;});if(ff)add('ffight',0.5);
    var k=wpick(rnd,W,function(q){return q[1];})[0];discDo(u,k,g,mp,ff,pn,Lc,Lp);});}
function civNearSet(u){var b=null,bd=1e18;G.civ.S.forEach(function(g){var d=dist(g.x,g.y,u.x,u.y)-g.r;if(d<600&&d<bd){bd=d;b=g;}});return b;}
function powNear(u){if(!G.civ)return null;return G.civ.P.filter(function(P){return P.side===u.side&&P.n>1&&P.st!=='gone'&&dist(P.x,P.y,u.x,u.y)<1500;})[0]||null;}
function discDo(u,k,g,mp,ff,pn,Lc,Lp){var C=G.civ,crime=!!CRIMEK[k],ordered=crime&&((k==='powab'||k==='powex')?Lp>=4:Lc>=4),pl=g?g.n:placeTxt(u.x,u.y),side=u.side;
  /* 憲兵：在政策極端時不制止針對平民或戰俘的行為 */if(mp&&!(crime&&ordered)&&rnd()<0.45*strFrac(mp)){u.dis=clamp(u.dis+4,0,100);if(rnd()<0.4)civEv('disc',side,uName(mp)+'制止'+uName(u)+'的'+DISC[k]+'，相關人員移送軍法',u.x,u.y,u.id,{dk:k,stop:1});if(C)C.cs[side].incid++;return;}
  var txt='',v=0;if(C)C.cs[side].incid++;
  switch(k){
    case 'loot':v=Math.min(g.val0*0.02,u.men*(1+2*rnd())*curPer()*eraDev(G.set.y)*0.15)*(Lc>=3?2:1);g.loss+=v;g.looted+=v;C.prop.loot+=v;C.cs[side].loot+=v;C.cs[side].prop+=v;g.unrest=clamp(g.unrest+6,0,100);u.dis-=3;u.mor=clamp(u.mor+1,0,100);txt=uName(u)+'在'+pl+'搶劫民宅與商店，損失約 '+money(v);break;
    case 'req':g.food=Math.max(0,g.food-2-3*rnd());g.unrest=clamp(g.unrest+4,0,100);if(u.lg)u.lg.food=Math.min(u.lg.foodCap||u.lg.food,u.lg.food+(u.lg.dayKg||0));txt=uName(u)+'在'+pl+'強徵糧食與牲畜'+(Lc<=1?'（付給收據）':'');break;
    case 'labor':v=Math.round(10+civPresent(g)*0.02*rnd());g.unrest=clamp(g.unrest+5,0,100);u.labT=G.t+6*3600;txt=uName(u)+'強迫'+pl+'約 '+fmt(v)+' 名居民挖掘工事與搬運';break;
    case 'arson':v=Math.min(g.val0*0.05,(5+20*rnd())*4*curPer()*eraDev(G.set.y));g.loss+=v;g.burnt+=v;C.prop.fire+=v;C.cs[side].prop+=v;g.unrest=clamp(g.unrest+10,0,100);g.alarm=1;refSpawn(g,civPresent(g)*0.15);txt=uName(u)+'在'+pl+'縱火焚燒房屋，損失約 '+money(v);break;
    case 'rape':v=Math.max(1,Math.round((Lc>=4?4+16*rnd():1+3*rnd())));g.rapeV=(g.rapeV||0)+v;C.cs[side].rapeV+=v;g.unrest=clamp(g.unrest+10+v,0,100);u.dis-=2;txt=uName(u)+'在'+pl+'發生性暴力案件，受害者約 '+v+' 人';break;
    case 'mass':var pr=civPresent(g);v=pr*(Lc>=5?0.05+0.25*rnd():0.005+0.04*rnd());civCas(g,v,1,'mass',side);g.unrest=clamp(g.unrest+25,0,100);g.alarm=1;refSpawn(g,civPresent(g)*0.4);txt=uName(u)+'在'+pl+'屠殺平民，約 '+fmt(v)+' 人遇害';break;
    case 'host':v=Math.round(5+30*rnd());civCas(g,v,1,'exec',side);g.unrest=clamp(g.unrest+15,0,100);txt=uName(u)+'在'+pl+'以報復游擊隊襲擊為由，處決約 '+v+' 名人質';break;
    case 'deport':v=civPresent(g)*(0.2+0.4*rnd());var keep=g.loy;refSpawn(g,v);C.R[C.R.length-1].side=enemyOf(side);refDest(C.R[C.R.length-1]);C.cs[side].deport+=v;g.unrest=clamp(g.unrest+20,0,100);void keep;txt=uName(u)+'將'+pl+'約 '+fmt(v)+' 名居民強制遷離';break;
    case 'powab':pn.lvl=Math.max(pn.lvl,Math.min(5,Lp+1));txt=uName(u)+'虐待看管中的戰俘（'+placeTxt(pn.x,pn.y)+'）';v=pn.n*0.01;break;
    case 'powex':v=Math.min(pn.n,pn.n*(0.05+0.3*rnd()));pn.n-=v;pn.exec+=v;C.cs[side].powExec+=v;G.stats[pn.from].exec=(G.stats[pn.from].exec||0)+v;txt=uName(u)+'處決約 '+fmt(v)+' 名戰俘（'+placeTxt(pn.x,pn.y)+'）';break;
    case 'brawl':v=Math.round(1+5*rnd());u.men-=Math.min(u.men*0.5,v*0.5);u.wia=(u.wia||0)+v*0.5;u.dis-=2;txt=uName(u)+'官兵酗酒鬥毆，'+v+' 人受傷';break;
    case 'theft':if(u.lg){u.ammo=Math.max(0,u.ammo-5-10*rnd());u.lg.fuel=Math.max(0,(u.lg.fuel||0)*0.85);}u.dis-=2;txt=uName(u)+'有人盜賣軍需（彈藥與燃料短少）';break;
    case 'desert':v=u.men*(0.005+0.025*rnd())*(u.mor<40?2:1);u.men-=v;medStat(side).desert+=v;if(mp&&rnd()<0.5){var back=v*0.5;u.men+=back;medStat(side).desert-=back;txt=uName(u)+'約 '+fmt(v)+' 人逃亡，'+uName(mp)+'收容其中約半數';}else txt=uName(u)+'約 '+fmt(v)+' 人逃亡';break;
    case 'insub':u.waitT=G.t+(1800+3600*rnd());u.mor=clamp(u.mor-2,0,100);txt=uName(u)+'部分官兵拒絕執行命令（'+(u.ord?ordN(u.ord):'待命')+'），部隊停滯';break;
    case 'frag':var F=u.p>=0?uById(u.p):null,off=F&&F.off?F.off:null;if(off){off.cmd=Math.max(1,off.cmd-1-Math.floor(rnd()*2));off.ini=Math.max(1,off.ini-1);}u.mor=clamp(u.mor-6,0,100);u.dis-=6;txt=uName(u)+'發生士兵襲擊軍官事件'+(off?'，'+off.rank+off.name+'負傷':'');break;
    case 'selfw':v=Math.max(1,u.men*0.004*rnd());u.men-=v;u.wia=(u.wia||0)+v;txt=uName(u)+'約 '+fmt(v)+' 人自傷以逃避作戰';break;
    case 'haze':u.mor=clamp(u.mor-2,0,100);u.dis-=1;txt=uName(u)+'發生老兵欺凌新兵事件';break;
    case 'ffight':u.mor=clamp(u.mor-1,0,100);if(ff)ff.mor=clamp(ff.mor-1,0,100);txt=uName(u)+'與'+uName(ff)+'因宿營與物資發生衝突';break;
    case 'sleep':u.slpT=G.t+3600;txt=uName(u)+'哨兵睡崗，警戒鬆懈';break;
    case 'acc':v=Math.round(1+3*rnd());u.men-=Math.min(u.men*0.3,v);u.wia=(u.wia||0)+v*0.7;medStat(side).kia+=v*0.3;txt=uName(u)+'發生走火意外，'+v+' 人傷亡';break;
    case 'awol':v=u.men*(0.01+0.02*rnd());u.men-=v;u.awolN=(u.awolN||0)+v;u.awolT=G.t+(6+6*rnd())*3600;txt=uName(u)+'約 '+fmt(v)+' 人擅離營地';break;
    case 'steal':if(ff&&ff.lg){ff.lg.food=Math.max(0,ff.lg.food*0.85);}txt=uName(u)+'偷竊友軍物資';break;}
  if(!txt)return;var e=civEv(crime?'crime':'disc',side,txt,u.x,u.y,u.id,{dk:k,v:v,ord:ordered});if(crime&&k!=='req'){var w=warCrime(u,k,k==='loot'||k==='arson'?0:v,txt,ordered);e.wc=1;
    /* 調查與懲處：守法的部隊會送軍法，極端政策下多半掩蓋 */if(mp&&!ordered&&rnd()<0.6){w.pun=true;u.dis=clamp(u.dis+6,0,100);logE(side,'disc',uName(mp)+'調查'+uName(u)+'的'+DISC[k]+'案，涉案人員移送軍法審判',u.x,u.y,u.id);}}
  if(G.press)pressOn(e,u);}
/* 擅離者歸隊 */
function awolStep(){G.units.forEach(function(u){if(u.awolN&&G.t>=u.awolT){if(alive(u))u.men=Math.min(u.men0,u.men+u.awolN*0.85);medStat(u.side).desert+=u.awolN*0.15;u.awolN=0;}});}
/* ---------- 游擊隊 ---------- */
function gueType(y){var L=[['gu1600',1600],['gu1700',1690],['gu1800',1790],['gu1860',1850],['gu1914',1880],['gu1940',1930],['gu1970',1950],['gu2000',1990],['gu2020',2015]],k='gu1940';L.forEach(function(q){if(y>=q[1])k=q[0];});return k;}
function gueStep(){if(!G.civ)return;var S=evtSet(),f=S.freq||1,h=600/3600,act=sA0();G.units.forEach(function(u){if(u.irr&&alive(u)&&u.side>=0)act[u.side]++;});
  G.civ.S.forEach(function(g){if(g.loy<0||g.occ<0||g.occ===g.loy||g.unrest<35)return;var p=civPresent(g);if(p<80||act[g.loy]>=14)return;var L=civPolNear(g),rate=(g.unrest-30)/70*0.05*f*Math.pow(p/2000,0.3)*CIVP[L][7]*h;if(rnd()>rate)return;
    var side=g.loy,tk=gueType(G.set.y),men=Math.round(clamp(20+p*0.01+g.unrest*0.6,20,160)),pos=validPos({dom:'land'},g.x+(rnd()-0.5)*g.r*2,g.y+(rnd()-0.5)*g.r*2),t=typeOf(tk),nm=gueName(g,side),r=mb32(hstr('gue|'+G.t+'|'+g.i));
    NMS.side=side;var u=newUnit(side,{name:nm,p:-1,ech:1,mix:[[tk,1]],off:newOfficer(r,1)});initStrength(u);var k0=men/Math.max(1,t.men);u.men0=u.men=men;u.veh=u.veh0=0;void k0;u.irr=1;u.x=pos[0];u.y=pos[1];u.hd=0;u.home=[g.x,g.y];u.gH=g.i;u.ms='ok';u.form='deployed';u.st='ok';u.task='hold';u.ammo=100;u.fat=0;u.org=100;u.mor=clamp(50+g.unrest*0.3,40,85);logInit(u);reix();dupNames();act[side]++;g.gueT=G.t;
    G.civ.gueN=(G.civ.gueN||0)+1;civEv('gue',side,g.n+'的居民組成'+nm+'（約 '+men+' 人），開始襲擾'+G.sides[g.occ].name+'的後方',g.x,g.y,u.id);});}
function gueName(g,side){var st=(SD(side).pst||'zh');if(st==='west')return g.n+' Partisans';var L=['游擊隊','抗敵自衛團','民眾武裝','地方義勇隊','游擊支隊'];return g.n+L[Math.floor(rnd()*L.length)];}
/* 游擊隊行動：伏擊、襲擊後勤與指揮、破壞橋梁，遭圍剿時化整為零 */
function gueAct(){G.units.forEach(function(u){if(!u.irr)return;if(u.st==='off'){if(u.gueHid&&G.t>=u.gueHid){var g=G.civ.S[u.gH];if(g&&g.occ!==u.side&&g.unrest>20){u.st='ok';var p=validPos({dom:'land'},g.x+(rnd()-0.5)*g.r*2,g.y+(rnd()-0.5)*g.r*2);u.x=p[0];u.y=p[1];u.gueHid=0;u.path=null;u.task='hold';logE(u.side,'gue',uName(u)+'重新出現在'+g.n+'附近',u.x,u.y,u.id);}else u.gueHid=G.t+3600;}return;}
    if(!alive(u))return;var s=ST(u),en=null,bv=0,thr=0;gridNear(u.x,u.y,8000,function(e){if(e.side===u.side||!onMap(e)||ST(e).dom!=='land')return;var d=dist(e.x,e.y,u.x,u.y),es=ST(e),soft=es.fl.indexOf('l')>=0||es.fl.indexOf('h')>=0||clsOf(e)==='art'||es.fl.indexOf('u')>=0,str=e.men+e.veh*8;if(d<1500&&str>u.men*3&&!soft)thr+=str;
      if(es.fl.indexOf('D')>=0&&polOf(u,'civ')<=1)return;var v=(soft?3:1)*(str<u.men*2?2:0.3)/(1+d/2000)*(e.form==='march'?1.5:1);if(v>bv){bv=v;en=e;}});
    var hurt=u.men<u.men0*0.6||G.t-(u.uf||-1e9)<300&&u.sup>40;if(thr>0&&hurt||u.men<12){if(rnd()<0.5){u.st='off';u.gueHid=G.t+(2+6*rnd())*3600;u.path=null;logE(u.side,'gue',uName(u)+'化整為零，隱入民間',u.x,u.y,u.id);return;}}
    if(u.pend&&u.pend.length)return;var o=u.ord;if(en&&bv>0.4&&(!o||o.k!=='attack'||G.t-(o.t1||0)>1800)){activate(u,newOrder('attack',{x:en.x,y:en.y,opt:{tac:'raid',roe:'free',tol:40,pace:'normal'}}));if(!u.gLog||G.t-u.gLog>3600){u.gLog=G.t;logE(u.side,'gue',uName(u)+'襲擊'+uName(en)+'（'+placeTxt(en.x,en.y)+'）',en.x,en.y,u.id);}return;}
    if(!o||(o.k!=='defend'&&o.k!=='attack')||(o.k==='attack'&&G.t-(o.t1||0)>2400)){/* 在道路旁或林中設伏 */var p=gueSpot(u);activate(u,newOrder('defend',{x:p[0],y:p[1],opt:{post:'ambush',roe:'close'},dk:'ambush'}));}
    if(rnd()<0.004&&G.set.y>=1860){var site=demoNear(u.x,u.y,3000);if(site&&enemyNear(u.side,site.x,site.y,1500)===0){blowBridge(site,u);if(G.civ)propInf('bridge',site.list&&site.list[0]?site.list[0].c:2,u.side,1);logE(u.side,'gue',uName(u)+'破壞'+placeTxt(site.x,site.y)+'的橋梁',site.x,site.y,u.id);}}});}
function gueSpot(u){var MP=G.map,best=[u.x,u.y],bv=-1;for(var i=0;i<14;i++){var a=rnd()*2*PI,r=500+rnd()*3000,x=u.x+Math.cos(a)*r,y=u.y+Math.sin(a)*r,k=cellAt(x,y),c=MP.lc[k];if(isWater(c))continue;var v=(LC[c][5]<0.6?2:0)+(MP.rd[cellAt(x+150,y)]||MP.rd[cellAt(x-150,y)]||MP.rd[cellAt(x,y+150)]?2:0)+rnd();if(v>bv){bv=v;best=[x,y];}}return best;}
/* 反游擊：治安部隊靠近隱匿的游擊隊時可能破獲；嚴酷政策下的掃蕩會牽連平民 */
function cinStep(){G.units.forEach(function(u){if(!u.irr||u.st!=='off'||!alive(u))return;var g=G.civ.S[u.gH];if(!g)return;var sec=null;gridNear(g.x,g.y,g.r+3000,function(q){if(!sec&&hostile(u.side,q.side)&&onMap(q)&&ST(q).fl.indexOf('I')>=0)sec=q;});if(!sec||rnd()>0.08)return;var L=polOf(sec,'civ'),v=u.men*(0.3+0.5*rnd());u.men-=v;G.stats[u.side].capt+=v;
    if(L>=3){var c=Math.round(5+v*(L-2)*0.5);civCas(g,c,0.8,'exec',sec.side);g.unrest=clamp(g.unrest+10,0,100);var e=warCrime(sec,'host',c,uName(sec)+'在'+g.n+'掃蕩游擊隊，株連處決平民約 '+c+' 人',L>=4);civEv('crime',sec.side,e.txt,g.x,g.y,sec.id,{wc:1});}else{g.unrest=clamp(g.unrest-5,0,100);logE(sec.side,'gue',uName(sec)+'在'+g.n+'破獲游擊隊據點，逮捕約 '+fmt(v)+' 人',g.x,g.y,sec.id);}
    if(u.men<8){u.st='dead';u.deadT=G.t;u.why='capt';}});}
/* ---------- 缺糧、缺彈與補給事故 ---------- */
function shortStep(){var f=evtSet().freq||1;awolStep();if(G.civ)cinStep();G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u))return;var L=u.lg;if(!L)return;
    if(L.food<=0&&L.hun>40&&(!u.fdLog||G.t-u.fdLog>12*3600)){u.fdLog=G.t;logE(u.side,'short',uName(u)+'斷糧，官兵挨餓（飢餓程度 '+fmt(L.hun)+'）',u.x,u.y,u.id);reqAuto(u,'supply');}
    if(u.ammo<10&&G.t-(u.fired||-1e9)<1800&&(!u.amLog||G.t-u.amLog>12*3600)){u.amLog=G.t;logE(u.side,'short',uName(u)+'彈藥即將告罄（剩 '+fmt(u.ammo)+'%）',u.x,u.y,u.id);reqAuto(u,'ammo');}
    if(u.dudT&&G.t>u.dudT)u.dudT=0;});
  SIDES().forEach(function(side){if(rnd()>0.5*f/144)return;var N=nodesOf(side).filter(function(n){return n.k!=='off';}),U=G.units.filter(function(u){return u.side===side&&isLeaf(u)&&onMap(u)&&ST(u).dom==='land';});var W=[['depotfire',N.length?1:0],['spoil',U.length?1.2:0],['dud',U.length?1:0],['fuel',U.length&&G.set.y>=1914?0.8:0],['breakdown',N.length&&G.set.y>=1914?0.8:0]],k=wpick(rnd,W,function(q){return q[1];})[0];
    if(k==='depotfire'&&N.length){var n=N[Math.floor(rnd()*N.length)],lf=0.2+0.4*rnd();LCLS.forEach(function(c){n.st[c]*=1-lf;});logE(side,'short','補給站「'+n.name+'」發生火災，存量損失約 '+pct(lf*100),n.x,n.y);}
    else if(U.length){var u=U[Math.floor(rnd()*U.length)];if(k==='spoil'&&u.lg){u.lg.food*=0.5;sickAdd(u,u.men*0.01,'dys');logE(side,'short',uName(u)+'的口糧腐敗，半數報廢，並有人腹瀉',u.x,u.y,u.id);}else if(k==='dud'){u.dudT=G.t+12*3600;logE(side,'short',uName(u)+'領到一批瑕疵彈藥，火力下降',u.x,u.y,u.id);}else if(k==='fuel'&&u.lg){u.lg.fuel*=0.7;logE(side,'short',uName(u)+'的燃料遭汙染，部分車輛拋錨',u.x,u.y,u.id);}
      else if(k==='breakdown'&&N.length){var n2=N[Math.floor(rnd()*N.length)];n2.slowT=G.t+12*3600;logE(side,'short','往「'+n2.name+'」的運輸車隊大量故障，運量下降',n2.x,n2.y);}}});}
/* ---------- 勸降 ---------- */
function persStep(){G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||!u.ord||u.ord.k!=='persuade'||u.ms==='rout')return;var s=ST(u),psy=s.fl.indexOf('k')>=0?Math.max(1,mixX(u,'psy')):0.4,R=s.fl.indexOf('k')>=0?2500:1000,rep=G.civ?G.civ.rep[u.side]:60,n=0;
    gridNear(u.x,u.y,R,function(t){if(t.side===u.side||!onMap(t)||!isLeaf(t)||ST(t).dom!=='land'||t.irr||dist(t.x,t.y,u.x,u.y)>R)return;if(!known(u.side,t.id,1800))return;n++;var lg=t.lg||{},enc=t.besieged&&G.t-t.besieged<1200||G.t-(t.encT||-1e9)<1800,tp=polSide(t.side).pow,
        p=0.03*psy*Math.pow((100-t.mor)/100,2)*(enc?2.5:1)*((lg.hun||0)>50?1.5:1)*(t.ammo<15?1.5:1)*((t.oos||0)>6*3600?1.3:1)*(0.3+rep/80)*(tp>=4?0.5:1)*[1.5,1.2,1,0.7,0.4][profIdxOf(t)]*(optOf(t).post==='holdfast'?0.5:1)*(hasQ(offOf(t),'stubborn')?0.5:1);
      if(rep<25&&rnd()<0.1){t.mor=clamp(t.mor+4,0,100);if(!t.pfLog){t.pfLog=1;logE(t.side,'pers',uName(t)+'深知投降者可能遭處決，拒絕勸降、抵抗更加頑強',t.x,t.y,t.id);}return;}
      if(rnd()<p){surrender(t,u,'接受勸降');logE(u.side,'pers',uName(t)+'接受'+uName(u)+'的勸降',t.x,t.y,u.id);decLog(u.side,uName(u),'勸降成功：'+uName(t));}
      else if(rnd()<p*2){var d=t.men*(0.03+0.1*rnd());t.men-=d;if(G.civ){G.civ.cs[u.side].powHeld+=d;var P={id:++G.civ.seq,side:u.side,from:t.side,n:d,wnd:0,x:t.x,y:t.y,st:'col',by:u.id,esc:0,t0:G.t,dead:0,exec:0,lvl:polOf(u,'pow'),un:uName(t)};G.civ.P.push(P);powRoute(P);}G.stats[t.side].capt+=d;logE(u.side,'pers',uName(t)+'約 '+fmt(d)+' 人陣前投誠',t.x,t.y,u.id);}});
    if(!n&&(!u.pLog||G.t-u.pLog>3*3600)){u.pLog=G.t;if(aiControls(u)&&G.t-(u.ord.t1||0)>3600){u.ord=null;u.task='hold';}else logE(u.side,'pers',uName(u)+'：勸降範圍內沒有已知的敵軍',u.x,u.y,u.id);}});}
/* ---------- 後方休整與福利：勞軍、輪休、性服務政策 ---------- */
function welStep(){SIDES().forEach(function(side){var P=polSide(side),show=P.show||'occ',sex=P.sex||'ban',S=SD(side);
    if(show!=='none'){var per=show==='reg'?10:24;if(G.t-(S.showT||-1e9)>=per*3600){S.showT=G.t;var tr=G.units.filter(function(u){return u.side===side&&onMap(u)&&isLeaf(u)&&ST(u).fl.indexOf('O')>=0;}),n=0;
        G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||!onMap(u)||ST(u).dom!=='land'||G.t-(u.uf||-1e9)<3600)return;var near=tr.some(function(q){return dist(q.x,q.y,u.x,u.y)<6000;}),idle=!u.ord||/rest|reserve|halt/.test(u.ord.k);if(!(near&&idle)&&!(show==='reg'&&u.insup&&idle))return;var b=near?Math.max(3,mixX(tr[0],'ent'))*(tr.length?1:0.4):2;u.mor=clamp(u.mor+b,0,Math.max(u.morB||u.mor,(u.morB||60)+8));u.fat=clamp(u.fat-(near?10:3),0,100);if(u.dis!==undefined)u.dis=clamp(u.dis+2,0,100);n++;});
        if(n)logE(side,'wel',(tr.length?uName(tr[0])+'在'+placeTxt(tr[0].x,tr[0].y)+'慰問演出':'後方寄來慰問品與家書')+'，'+n+' 個單位士氣提振');}}
    if(P.leave==='rot')G.units.forEach(function(u){if(u.side===side&&isLeaf(u)&&onMap(u)&&u.ord&&u.ord.k==='rest'&&(u._ed===undefined||u._ed>8000)){u.fat=clamp(u.fat-3,0,100);u.mor=clamp(u.mor+0.5,0,u.morB||u.mor+0.5);}});
    if((sex==='tol'||sex==='reg')&&rnd()<(sex==='tol'?0.007:0.004)&&G.civ){var g=G.civ.S.filter(function(q){return civPresent(q)>200&&G.units.some(function(u){return u.side===side&&onMap(u)&&dist(u.x,u.y,q.x,q.y)<q.r+3000;});})[0];if(g){var v=Math.round(2+6*rnd());G.civ.cs[side].slavV+=sex==='tol'?v*0.3:v*0.2;logE(side,'wel','後方營區附近的色情場所出現人口販運與勒索案件（'+g.n+'，受害者約 '+v+' 人）',g.x,g.y);}}
    if(sex==='coer'&&G.civ&&G.t-(S.coerT||-1e9)>=24*3600){S.coerT=G.t;var occ=G.civ.S.filter(function(q){return q.occ===side&&q.loy>=0&&q.loy!==side&&q.wom>50;});if(occ.length){var tot=0;occ.slice(0,6).forEach(function(q){var v=Math.min(q.wom*0.01,40)*(0.5+rnd());q.wom-=v;tot+=v;q.unrest=clamp(q.unrest+15,0,100);});G.civ.cs[side].slavV+=tot;var top=sideCmd(side);if(top&&tot>=1){var e=warCrime(top,'slav',tot,G.sides[side].name+'在佔領區以誘騙或強迫方式擄掠約 '+fmt(tot)+' 名婦女，強迫在軍營從事性服務（性奴役，戰爭罪）',true);civEv('crime',side,e.txt,occ[0].x,occ[0].y,top.id,{wc:1});}}}});}
/* ---------- 自動請求（缺糧、缺彈時向上級請求補給；由指揮官模組處理） ---------- */
/* ---------- 遭遇戰 ----------
   行軍縱隊（道路上快速移動）在近距離發現敵軍或遭到射擊：雙方附近仍在行軍的部隊就地急速展開（平時一半的時間）、停下交戰。
   AI 依指揮官個性與兵力比立即決定進攻、駐紮或脫離；玩家收到「遭遇戰」通知（可自動暫停），選擇進攻或駐紮；
   15 分鐘內沒有指示時由現地指揮官依性格自行處置。 */
function meetCheck(u,s,ed,uf){if(s.dom!=='land'||u.ms==='rout'||u.irr||!(u.form==='march'||u.formTo==='march')||u.task!=='go')return false;var ro=roleOf(u);if(ro!=='man'&&ro!=='rec'&&ro!=='fire')return false;
  if(!(uf||ed<clamp(rangeOf(s)*2.5,1200,3000)))return false;if(u.meetT&&G.t-u.meetT<3600)return false;var M0=u.meet&&(G.meets||[]).filter(function(q){return q.id===u.meet;})[0];if(M0&&M0.st==='open')return false;var e=uById(u._eid);if(e&&ST(e).dom!=='land')e=null;if(!e&&!uf)return false;if(!e&&u.ufBy)e=uById(u.ufBy);return !!meetStart(u,e);}
/* 遭遇戰的另一方（三方作戰時遭遇戰仍是兩方之間） */
function meetOth(M,sd){return M.sB!==undefined?(sd===M.sA?M.sB:M.sA):1-sd;}
function meetStart(u,e){var sA=u.side,sB=e&&e.side>=0&&e.side!==sA?e.side:enemyOf(sA),R=2500,M={id:(G.meetSeq=(G.meetSeq||0)+1),t:G.t,x:e?(u.x+e.x)/2:u.x,y:e?(u.y+e.y)/2:u.y,u:sAL(),st:'open',dec:sAV(null),pl:sAL(),sA:sA,sB:sB};
  function join(q){if(!isLeaf(q)||!onMap(q)||ST(q).dom!=='land'||q.ms==='rout'||q.irr||q.st==='lift')return;var ro=roleOf(q);if(ro!=='man'&&ro!=='rec'&&ro!=='fire')return;if(q.meetT&&G.t-q.meetT<1800&&q!==u)return;var moving=q.task==='go'||q.form==='march'||q.formTo==='march';if(!moving&&q!==u&&q!==e)return;
    M.u[q.side].push(q.id);q.meet=M.id;q.meetT=G.t;if(q.form==='march'||q.formTo==='march'){var E2=uEra(q);q.formTo='deployed';q.formT=G.t+E2.deploy*60*(1.3-0.006*(q.trn||60))*0.5;}
    if(moving){q.path=null;q.goal=null;q.pq=0;q.task='hold';q.meetHold=G.t+1500;}}
  gridNear(u.x,u.y,R,function(q){if(q.side===sA&&dist(q.x,q.y,u.x,u.y)<=R)join(q);});if(u.meet!==M.id)join(u);if(e)gridNear(e.x,e.y,R,function(q){if(q.side===sB&&dist(q.x,q.y,e.x,e.y)<=R)join(q);});
  if(!M.u[sA].length)return null;(G.meets=G.meets||[]).push(M);if(G.meets.length>200)G.meets.shift();
  var men=function(L){return sum(L.map(uById).filter(Boolean),function(q){return q.men;});};logE(-1,'tac','遭遇戰：'+uName(u)+'在'+placeTxt(M.x,M.y)+'與'+(e?uName(e):'敵軍')+'遭遇，'+(M.u[sB].length?'雙方就地展開交戰（'+G.sides[sA].name+' '+M.u[sA].length+' 個單位約 '+fmt(men(M.u[sA]))+' 人；'+G.sides[sB].name+' '+M.u[sB].length+' 個單位約 '+fmt(men(M.u[sB]))+' 人）':'就地展開交戰（'+M.u[sA].length+' 個單位約 '+fmt(men(M.u[sA]))+' 人）'),M.x,M.y,u.id);
  [sA,sB].forEach(function(sd){var ai=[],pl=[];M.u[sd].forEach(function(id){var q=uById(id);if(!q)return;var moving=q.meetHold>G.t;if(!moving)return;(aiControls(q)?ai:pl).push(id);});M.pl[sd]=pl;if(ai.length)meetDecide(M,sd,meetAI(M,sd,ai),'AI',ai);
    if(pl.length){var q0=uById(pl[0]);(G.inbox=G.inbox||[]).push({id:(G.mid=(G.mid||0)+1),t:G.t,side:sd,k:'meet',mid:M.id,from:q0.id,to:q0.id,x:M.x,y:M.y,txt:uName(q0)+(pl.length>1?'等 '+pl.length+' 個單位':'')+'在'+placeTxt(M.x,M.y)+'與敵軍遭遇，已就地展開；敵軍約 '+fmt(meetEnemy(M,sd).men)+' 人'});if(G.onPause&&apOn('meet'))G.onPause('遭遇戰');}});
  return M;}
/* 本方情報圖中，遭遇點附近的敵軍 */
function meetEnemy(M,sd){var C=G.ct[sd]||{},n=0,sx=0,sy=0,men=0;for(var id in C){var c=C[id];if(G.t-c.t>900||c.dom==='air'||dist(c.x,c.y,M.x,M.y)>3500)continue;n++;sx+=c.x;sy+=c.y;men+=(c.men||0)+(c.veh||0)*4;}if(n)return {x:sx/n,y:sy/n,men:men,n:n};
  /* 情報還沒回報上來：以現場看得到、正在接觸的敵軍估計 */(M.u[meetOth(M,sd)]||[]).forEach(function(id){var q=uById(id);if(!q||!alive(q))return;n++;sx+=q.x;sy+=q.y;men+=q.men+q.veh*4;});return n?{x:sx/n,y:sy/n,men:men,n:n}:{x:M.x,y:M.y,men:0,n:0};}
function meetAI(M,sd,ids){var q=uById(ids[0]),F=q&&q.p>=0?uById(q.p):q,P=aiOf(F||q),own=sum(ids.map(uById).filter(Boolean),function(x){return x.men+x.veh*6;}),en=Math.max(1,meetEnemy(M,sd).men),ratio=own/en;
  if(ratio>=1.8||P.agg>=0.5&&ratio>=0.7)return 'attack';if(ratio<0.4&&P.hold<0.6)return 'withdraw';return 'hold';}
/* 執行決定：直接交給現場部隊（反應時間照算，不經過整條指揮鏈） */
function meetDecide(M,sd,k,who,ids){ids=ids||M.u[sd];var tg=meetEnemy(M,sd),n=0;ids.forEach(function(id){var q=uById(id);if(!q||!alive(q))return;q.meetHold=0;var f=Math.atan2(tg.y-q.y,tg.x-q.x),fire=roleOf(q)==='fire';
    if(k==='attack')receiveOrder(q,fire?newOrder('support',{sup:q.p>=0?q.p:undefined}):newOrder('attack',{x:tg.x+(q.x-M.x)*0.3,y:tg.y+(q.y-M.y)*0.3,opt:{tac:'frontal',tol:40,pace:'fast',roe:'free'}}));
    else if(k==='withdraw'){var h=homeDir(sd),p=validPos(ST(q),q.x+Math.cos(h)*2500,q.y+Math.sin(h)*2500);receiveOrder(q,newOrder('defend',{x:p[0],y:p[1],face:f,dk:'delay',opt:{post:'delay',maxb:3}}));}
    else receiveOrder(q,fire?newOrder('support',{sup:q.p>=0?q.p:undefined}):newOrder('defend',{x:q.x,y:q.y,face:f,opt:{post:'hasty'}}));n++;});
  if(!n)return;var KN={attack:'就地發起攻擊',hold:'就地駐紮、轉入防禦',withdraw:'脫離接觸、遲滯後撤'};M.dec[sd]=M.dec[sd]||{k:k,who:who,t:G.t};logE(sd,'tac','遭遇戰（'+placeTxt(M.x,M.y)+'）：'+(who==='AI'?'':who==='現地'?'現地指揮官自行決定':'依玩家指示')+KN[k],M.x,M.y,ids[0]);decLog(sd,who==='AI'?uName(uById(ids[0])||{name:'AI'}):who==='現地'?'現地指揮官':'玩家','遭遇戰（'+placeTxt(M.x,M.y)+'）：'+KN[k]);}
/* 逾時與結束：玩家 15 分鐘內沒有指示 → 現地指揮官依性格處置；參戰部隊 20 分鐘沒有交火 → 結束 */
function meetStep(){(G.meets||[]).forEach(function(M){if(M.st!=='open')return;(M.sB!==undefined?[M.sA,M.sB]:[0,1]).forEach(function(sd){var pl=(M.pl[sd]||[]).filter(function(id){var q=uById(id);return q&&alive(q)&&q.meet===M.id&&q.meetHold>0;});if(pl.length&&G.t-M.t>900){var q=uById(pl[0]),off=offOf(q)||{},k=G.set.iniP===true&&((off.agg||5)>=6||hasQ(off,'reckless'))?'attack':'hold';/* 玩家部隊預設不自行進攻（下級主動性開啟時依指揮官性格） */meetDecide(M,sd,k,'現地',pl);(G.inbox||[]).forEach(function(m){if(m.k==='meet'&&m.mid===M.id&&m.side===sd&&!m.done)m.done='逾時：現地指揮官決定'+(k==='attack'?'進攻':'駐紮');});}});
    var hot=[].concat.apply([],M.u).some(function(id){var q=uById(id);return q&&alive(q)&&G.t-(q.uf||-1e9)<1200;});if(!hot&&G.t-M.t>1200){M.st='done';M.t1=G.t;logE(-1,'tac','遭遇戰結束（'+placeTxt(M.x,M.y)+'）',M.x,M.y);}});}
function reqAuto(u,k){if(typeof reqSend==='function'&&u.p>=0){var P=uById(u.p);if(P)reqSend(u,P,k,{x:u.x,y:u.y,auto:1});}}
