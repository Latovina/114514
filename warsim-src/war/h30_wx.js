/* ===================== 天氣系統與水文：雨帶、雷雨胞、霧、降雪以「天氣系統」持續數小時到數天，強度逐步增強、維持、再減弱（大雨→豪雨→特大豪雨、薄霧→濃霧、降雪→暴風雪）；
   降雨滲入土壤、形成逕流匯入河川：水位上漲時淺灘無法徒涉，溢堤後低窪地淹水，嚴重洪水沖毀橋梁、沖刷出新的河道與沙洲，退水後留下沼澤與受損的道路。
   水深：溪流、河流、淺灘與淹水各有水深，徒步、騎乘、畜力、輪型、履帶各有可徒涉的上限；太深就只能走橋梁、渡口或渡河作戰 ===================== */
WX.push(['torr','豪雨',0.3,3,0,0.05],['xrain','特大豪雨',0.18,3,0,0],['blz','暴風雪',0.12,0,2,0]);WX.forEach(function(w,i){WXI[w[0]]=i;});
var WSYN={rain:'雨帶',conv:'雷雨胞',fog:'霧',snow:'降雪'};
function wsOn(){return G.set.wxSys!==false&&G.set.wxMode!=='fixed';}
function hydOn(){return G.set.hyd!==false;}
/* ---------- 天氣系統 ---------- */
/* 強度 → 天氣類別（強度 0～1） */
function wsCatI(k,I){if(k==='fog')return I<0.4?WXI.mist:WXI.fog;if(k==='snow')return I<0.4?WXI.lsnow:I<0.78?WXI.hsnow:WXI.blz;
  if(k==='conv')return I<0.2?WXI.lrain:I<0.55?WXI.storm:I<0.8?WXI.torr:WXI.xrain;return I<0.2?WXI.lrain:I<0.45?WXI.hrain:I<0.72?WXI.torr:WXI.xrain;}
function wsCat(S){return wsCatI(S.k,S.I);}
/* 能見度隨強度連續變化 */
function wsVis(S){var I=S.I;return S.k==='fog'?0.6-0.55*I:S.k==='snow'?0.75-0.63*I:0.8-0.62*I;}
/* 雨量（公釐／時）：小雨約 2～5、大雨 10～20、豪雨 20～45、特大豪雨 45～75 */
function wsRain(S){return S&&(S.k==='rain'||S.k==='conv')?1+75*Math.pow(S.I,1.8):0;}
function wsStart(k,o){o=o||{};var h=3600,S={k:k,I:o.I0!==undefined?o.I0:0.04,pk:clamp(o.pk||0.4,0.05,1),t0:G.t,nz:0,adv:o.adv?1:0,src:o.src||''};S.I0=S.I;
  S.tg=Math.max(600,(o.tg||1.5)*h);S.th=Math.max(0,(o.th||4)*h);S.td=Math.max(900,(o.td||2)*h);S.tP=G.t+S.tg;S.tH=S.tP+S.th;S.t1=S.tH+S.td;S.ph='grow';S.cat=wsCat(S);S.pkI=S.I;S.max=S.I;S.racc=0;G.wsys=S;return S;}
/* 依氣候把一般的天氣變化換成天氣系統：濕潤、季風地區的雨帶更長，偶爾發展成豪雨 */
function wsFromPick(w,c){var T=c.T,wet=sm(60,250,c.P),mons=G.evt&&G.evt.mons;
  if(w===WXI.mist||w===WXI.fog){var adv=rnd()<0.12+0.25*wet&&T<14;return wsStart('fog',{pk:w===WXI.fog?0.55+0.4*rnd():0.22+0.25*rnd(),tg:0.5+rnd()*1.5,th:adv?8+rnd()*28:2+rnd()*6,td:1+rnd()*2,adv:adv});}
  if(w===WXI.lsnow||w===WXI.hsnow)return wsStart('snow',{pk:w===WXI.hsnow?0.45+0.4*rnd():0.15+0.25*rnd(),tg:1+rnd()*2,th:2+rnd()*16,td:1+rnd()*2});
  if(w===WXI.storm&&T>=16)return wsStart('conv',{pk:0.3+0.45*rnd()+(rnd()<0.15*wet?0.2:0),tg:0.3+rnd()*0.7,th:0.5+rnd()*1.5,td:0.5+rnd()});
  var pk=w===WXI.lrain?0.1+0.2*rnd():0.3+0.3*rnd();if(rnd()<0.1*wet+(mons?0.15:0))pk+=0.25+0.2*rnd();
  return wsStart('rain',{pk:pk,tg:1+rnd()*3,th:(2+rnd()*14)*(1+wet)*(mons?1.5:1),td:1+rnd()*3});}
function wsIsSys(w){return w===WXI.mist||w===WXI.fog||w===WXI.lrain||w===WXI.hrain||w===WXI.storm||w===WXI.lsnow||w===WXI.hsnow||w===WXI.torr||w===WXI.xrain||w===WXI.blz;}
(function(){var b=pickWx;pickWx=function(c,hour,cur){var S=G.wsys;if(S&&wsOn())return S.cat;var w=b(c,hour,cur);if(!wsOn()||!wsIsSys(w))return w;return wsCat(wsFromPick(w,c));};})();
function wsName(S){return WX[S.cat]?WX[S.cat][1]:WSYN[S.k];}
/* 每步：依階段調整強度；類別改變時（留 0.03 的緩衝，不會在門檻上來回跳）記錄增強或減弱 */
function wsTick(dt){var S=G.wsys,E=G.env;if(!S||!E)return;if(!wsOn()){G.wsys=null;return;}var t=G.t,h=dt/3600;
  if(S.k==='fog'&&!S.adv&&S.ph!=='decay'&&E.light>0.6&&(E.alt||0)>8){S.ph='decay';S.tH=t;S.td=Math.max(1800,S.td*0.7);S.t1=t+S.td;S.pkI=S.I;}
  S.nz=clamp(S.nz+(rnd()-0.5)*0.2*Math.sqrt(Math.max(h,1e-4)*6),-0.25,0.25);
  if(S.ph==='grow'){var f=clamp((t-S.t0)/S.tg,0,1),q=f*f*(3-2*f);S.I=S.I0+(S.pk-S.I0)*q;if(t>=S.tP)S.ph='hold';}
  else if(S.ph==='hold'){S.I=clamp(S.pk*(1+S.nz*0.6),0.03,1);if(t>=S.tH){S.ph='decay';S.pkI=S.I;}}
  else{var g=clamp((t-S.tH)/S.td,0,1);S.I=S.pkI*Math.pow(1-g,1.3);}
  S.max=Math.max(S.max,S.I);S.racc+=wsRain(S)*h;
  if(S.ph==='decay'&&(t>=S.t1||S.I<0.03)){wsEnd(S);return;}
  var c2=wsCat(S);if(c2!==S.cat&&wsCatI(S.k,S.I+0.03)===c2&&wsCatI(S.k,S.I-0.03)===c2){var up=S.I>(S.lastI||0);S.cat=c2;
    logE(-1,'wx',(S.k==='fog'?(up?'霧氣變濃：':'霧氣漸散：'):S.k==='snow'?(up?'降雪增強：':'降雪減弱：'):(up?'雨勢增強：':'雨勢減弱：'))+'轉為'+WX[c2][1]+(S.k==='rain'||S.k==='conv'?'（每小時約 '+fmt(wsRain(S))+' 公釐）':''));
    if(up&&(c2===WXI.xrain||c2===WXI.blz)&&G.onPause&&typeof apOn==='function'&&apOn('evt'))G.onPause(WX[c2][1]);}
  S.lastI=S.I;E.wx=S.cat;}
function wsEnd(S){var E=G.env;G.wsys=null;E.wx=S.k==='fog'?WXI.cloud:rnd()<0.5?WXI.over:WXI.cloud;E.nextWx=G.t+3600*(1+rnd()*2);
  logE(-1,'wx',(S.k==='fog'?'霧散了':S.k==='snow'?'雪停了':'雨停了')+'，轉為'+WX[E.wx][1]+(S.k==='rain'||S.k==='conv'?'（這一場累積雨量約 '+fmt(S.racc)+' 公釐）':''));
  /* 夜間雨後容易起霧 */if((S.k==='rain'||S.k==='conv')&&E.light<0.3&&rnd()<0.35){var F=wsStart('fog',{pk:0.35+0.45*rnd(),tg:0.5+rnd(),th:2+rnd()*5,td:1+rnd()});E.wx=F.cat;logE(-1,'wx','雨後起霧');}}
/* ---------- 天災事件：豪雨、颱風、持續濃霧、暴風雪改由天氣系統表現強度變化 ---------- */
(function(){var b=evtStart;evtStart=function(k,o){var e=b(k,o);if(!e||!wsOn())return e;var dur=Math.max(1,(e.t1-e.t0)/3600),sev=e.sev||1,T=G.env?G.env.T:20,S=G.wsys,I0=S&&S.k!=='fog'?S.I:0.05;
  if(k==='rain')wsStart(T>=24&&rnd()<0.3?'conv':'rain',{I0:I0,pk:clamp(0.55+0.4*(sev-0.6)/0.8,0.5,1),tg:Math.min(3,dur*0.2),th:dur*0.65,td:Math.max(1,dur*0.15),src:'evt'});
  else if(k==='typhoon')wsStart('rain',{I0:I0,pk:clamp(0.7+0.2*sev,0.7,1),tg:dur*0.3,th:dur*0.4,td:dur*0.3,src:'evt'});
  else if(k==='blizzard')wsStart('snow',{I0:I0,pk:0.82+0.18*rnd(),tg:1,th:Math.max(1,dur-3),td:2,src:'evt'});
  else if(k==='fog'){var th=Math.max(dur,8+rnd()*28),F=wsStart('fog',{I0:0.2,pk:0.8+0.2*rnd(),tg:0.5,th:th,td:1+rnd()*2,adv:1,src:'evt'});e.t1=F.t1;var H=G.evt.H[G.evt.H.length-1];if(H&&H.k==='fog'&&H.t0===e.t0)H.t1=e.t1;}
  if(G.wsys&&G.env)G.env.wx=G.wsys.cat;return e;};})();
/* ---------- 每步套用到環境：天氣類別、能見度、雨量 ---------- */
(function(){var b=envStep;envStep=function(dt){b(dt);var E=G.env;if(!E)return;wsTick(dt);var S=G.wsys;
  if(S&&!evtActive('sand')){E.wx=S.cat;E.vis=wsVis(S);var h=dt/3600;if(S.k==='rain'||S.k==='conv'){var r=wsRain(S);if(r>25)E.mud=clamp(E.mud+0.002*(r-25)*h,0,1);if(S.cat===WXI.torr||S.cat===WXI.xrain)E.T-=2;}if(S.cat===WXI.blz)E.T-=3;}
  if(G.started)hydTick(dt);};})();
/* ---------- 水文：土壤含水、逕流、河川水位 ---------- */
/* 水位 lv：平常為 1；1.15 漲水（淺灘無法徒涉）、1.35 溢堤（低窪地淹水）、2 嚴重氾濫、3 百年洪水 */
var HSTG=[[0,'正常'],[1.15,'漲水'],[1.35,'溢堤氾濫'],[2,'嚴重氾濫'],[3,'百年洪水']];
function hydInit(){var c=climMonth(now().m);G.hyd={lv:1,S:0,sat:clamp(c.P/220,0.1,0.75),rate:0,r24:0,racc:0,riseQ:0,stg:0,flLv:1,flOn:0,flA:0,pk:1,sc:0,t:G.t};return G.hyd;}
function hydStage(lv){var s=0;for(var i=1;i<HSTG.length;i++)if(lv>=HSTG[i][0])s=i;return s;}
function hydRain(){var E=G.env,S=G.wsys;if(S&&(S.k==='rain'||S.k==='conv'))return wsRain(S);var W=WX[E.wx]||WX[0];return [0,2.5,9,30][W[3]]||0;}
function hydTick(dt){var H=G.hyd||hydInit(),E=G.env,h=dt/3600;if(!hydOn())return;var r=hydRain(),melt=0;
  if(E.snow>0.05&&E.T>2)melt=Math.min(E.snow,0.02*(E.T/5))*100;
  H.rate=r;H.racc+=r*h;H.r24=H.r24*Math.exp(-h/24)+r*h;H.sat=clamp(H.sat+r*h/90-(r>0.2?0:0.008*h*(E.T>15?1.6:1)),0,1);
  var ro=(r+melt)*h*(0.12+0.78*Math.pow(H.sat,1.5));H.S+=ro;var q=H.S*(1-Math.exp(-h/7));H.S-=q;H.lv=1+(H.lv-1)*Math.exp(-h/20)+q/230;H.pk=Math.max(H.pk,H.lv);
  if(G.step%60===7)hydUpdate();if(G.step%20===14&&G.evt&&G.evt.fl)floodEvac();}
/* 依水位更新淺灘、淹水範圍（每 30 分鐘，水位有明顯變化時才重算尋路資料） */
function hydUpdate(){var H=G.hyd;if(!H)return;var rq=Math.round(Math.max(0,H.lv-1)*2.5/0.15)*0.15,s=hydStage(H.lv),ch=false;
  if(Math.abs(rq-(H.riseQ||0))>0.01){H.riseQ=rq;ch=true;}
  var hF=Math.max(0,(H.lv-1.35)*3.5);if(G.evt&&(hF>0.05&&Math.abs(H.lv-H.flLv)>0.04||hF<=0.05&&H.flOn)){floodCalc();ch=true;}
  if(s!==H.stg){var up=s>H.stg,old=H.stg;if(up||H.lv<HSTG[old][0]-0.05){H.stg=s;hydLog(s,up);}}
  if(H.lv>=1.8&&!H.bw){H.bw=1;floodBridges();}if(H.lv>=2.6&&!H.sc){H.sc=1;floodScour();}
  if(ch&&G.evt){G.evt.fv++;mapChangedSoft();}}
function hydLog(s,up){var H=G.hyd,t=up?['','河川水位上漲：淺灘水深超過一公尺，徒步與車輛都無法涉水，只能走橋梁或渡口','河水溢堤：河岸低窪地開始淹水','嚴重氾濫：淹水範圍擴大，浮橋與便橋可能被沖毀','百年洪水：河谷大片淹沒，河道可能改變'][s]:['河川水位回落：淺灘恢復可以徒涉','河水退回河道附近，淹水逐漸消退','洪水消退中','洪水仍然嚴重，但已開始消退',''][s];
  if(t)logE(-1,'evt',(up?'⚠ ':'')+t+'（水位 '+fx(H.lv,2)+'）');if(up&&s>=2&&G.onPause&&typeof apOn==='function'&&apOn('evt'))G.onPause(HSTG[s][1]);}
/* 「河水暴漲」事件：上游來水，水位迅速上升（淹水範圍依地形與水位計算，水退後自然消失） */
(function(){var b=floodStart;floodStart=function(e){if(!hydOn()){b(e);return;}var H=G.hyd||hydInit();H.S+=140*(e.sev||1);H.sat=Math.max(H.sat,0.8);H.lv=Math.max(H.lv,1.4+0.45*(e.sev||1));H.pk=Math.max(H.pk,H.lv);hydUpdate();};})();
(function(){var b=evtEnd;evtEnd=function(e){if(e.k==='flood'&&hydOn()){var keep=G.evt.fl;b(e);G.evt.fl=keep;return;}b(e);};})();
/* ---------- 河道與淺灘的水深 ---------- */
/* 可徒涉的水深上限（公尺）與涉水速度係數：徒步、騎乘、畜力牽引、輪型、履帶 */
var WADE=[1.0,1.25,0.5,0.6,1.1],WADEV=[0.6,0.7,0.8,0.55,0.7];
/* 淺灘：河流（中型河）上每隔約 3 公里一處河床較寬、水流較緩的地方（依地圖種子固定） */
var FDC={mp:null,a:null};
function fordMap(){var MP=G.map,N=MP.GW*MP.GH;if(FDC.mp===MP&&FDC.a&&FDC.a.length===N)return FDC.a;var F=new Uint8Array(N),GW=MP.GW,gap=Math.max(4,Math.round(3200/MP.cs)),seed=hstr(String(MP.seed||'w'))>>>0,sl=slopeArr();
  for(var k=0;k<N;k++){if(MP.rv[k]!==2||isWater(MP.lc[k]))continue;if((Math.imul(k^seed,2654435761)>>>0)%gap!==0||sl[k]>15)continue;var x=k%GW,near=false,dx,dy,q;
    for(dy=-1;dy<=1&&!near;dy++)for(dx=-1;dx<=1;dx++){q=k+dy*GW+dx;if(x+dx<0||x+dx>=GW||q<0||q>=N)continue;if(MP.lc[q]===LCI.riv||MP.rv[q]>=3){near=true;break;}}if(near)continue;
    F[k]=1;[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(o){var X=x+o[0],q2=k+o[1]*GW+o[0];if(X<0||X>=GW||q2<0||q2>=N)return;if(MP.rv[q2]===2&&!isWater(MP.lc[q2]))F[q2]=1;});}
  FDC.mp=MP;FDC.a=F;return F;}
function fordAt(k){return fordMap()[k]===1;}
function hydRise(){var H=G.hyd;return H&&hydOn()?H.riseQ||0:0;}
/* 溪流約 0.4 公尺、河流約 1.7 公尺（淺灘 0.7 公尺）、大河 2.6 公尺以上，加上漲水 */
function rvDepth(k){var rv=G.map.rv[k];if(!rv)return 0;return (rv===1?0.4:rv===2?(fordAt(k)?0.7:1.7):2.6)+hydRise();}
function fordMul(mobi,k){var lim=WADE[mobi];if(!lim)return 0;var d=rvDepth(k);if(d>=lim)return 0;var r=d/lim;return WADEV[mobi]*(1-r*r);}
/* 淹水：v 為水深（公寸） */
function floodMul(mobi,v){var lim=WADE[mobi]||0.6,d=v/10;if(d>=lim)return 0;var r=d/lim;return 0.6*(1-r*r);}
/* ---------- 氾濫平原：每一格到最近河道（含湖泊）的距離與相對高度（每張地圖算一次） ---------- */
function fpInit(){var MP=G.map;if(G._fp&&G._fp.mp===MP)return G._fp;var GW=MP.GW,N=GW*MP.GH,Rc=Math.ceil(3000/MP.cs),d=new Uint16Array(N).fill(65535),src=new Int32Array(N).fill(-1),Q=new Int32Array(N),h=0,t=0,k;
  for(k=0;k<N;k++){var c=MP.lc[k];if(c===LCI.riv||c===LCI.lake||MP.rv[k]>=2){d[k]=0;src[k]=k;Q[t++]=k;}}
  function push(q,n2){if(d[n2]!==65535)return;var c2=MP.lc[n2];if(isWater(c2)&&c2!==LCI.riv&&c2!==LCI.lake)return;d[n2]=d[q]+1;src[n2]=src[q];Q[t++]=n2;}
  while(h<t){var q=Q[h++],x=q%GW;if(d[q]>=Rc)continue;if(x>0)push(q,q-1);if(x<GW-1)push(q,q+1);if(q>=GW)push(q,q-GW);if(q<N-GW)push(q,q+GW);}
  var L=[];for(k=0;k<N;k++)if(d[k]>0&&d[k]!==65535&&!isWater(MP.lc[k]))L.push(k);G._fp={mp:MP,d:d,src:src,L:new Int32Array(L),Rc:Rc};return G._fp;}
/* 淹水範圍：溢堤高度 hF（公尺）以下、離河道 D 以內的低地 */
function floodCalc(){var H=G.hyd,MP=G.map,N=MP.GW*MP.GH,hF=Math.max(0,(H.lv-1.35)*3.5);H.flLv=H.lv;
  if(hF<=0.05){if(H.flOn){H.flOn=0;H.flA=0;floodRecede();G.evt.fl=null;}return;}
  var F=fpInit(),D=Math.min(F.Rc,Math.ceil((200+(H.lv-1.35)*1600)/MP.cs)),NF=new Uint8Array(N),n=0,PK=G._flPk&&G._flPk.length===N?G._flPk:(G._flPk=new Uint8Array(N));
  for(var i=0;i<F.L.length;i++){var k=F.L[i];if(F.d[k]>D)continue;var dp=hF-(MP.el[k]-MP.el[F.src[k]]);if(dp>0.05){var v=Math.min(255,Math.round(dp*10));NF[k]=v;n++;if(v>PK[k])PK[k]=v;}}
  G.evt.fl=NF;H.flOn=1;H.flA=n*MP.cs*MP.cs/1e6;H.flMax=Math.max(H.flMax||0,H.flA);}
/* 退水：深水處的道路受損（數小時後修復）、低地積水成為沼澤 */
function floodRecede(){var MP=G.map,PK=G._flPk,H=G.hyd;if(!PK)return;var N=MP.GW*MP.GH,ks=[],soft={},nd=0;['field','mead','hedge','orch','scrub'].forEach(function(id){soft[LCI[id]]=1;});if(!G.rdd||G.rdd.length!==N)G.rdd=new Uint8Array(N);
  for(var k=0;k<N;k++){var v=PK[k];if(!v)continue;if(v>=10&&MP.rd[k]){G.rdd[k]=Math.max(G.rdd[k],180);nd++;}if(v>=15&&soft[MP.lc[k]]&&!MP.rd[k]&&!MP.rl[k]&&(Math.imul(k,2246822519)>>>0)%100<30){MP.lc[k]=LCI.marsh;ks.push(k);}}
  G._flPk=null;if(ks.length){mapChanged(ks);G._fp=null;}H.dep=(H.dep||0)+ks.length;logE(-1,'evt','洪水退去'+(nd?'：約 '+fmt(nd*MP.cs/1000,1)+' 公里道路泡水受損，需要數小時修復':'')+(ks.length?'；'+fmt(ks.length*MP.cs*MP.cs/1e6,2)+' 平方公里低地積水成為沼澤':''));}
/* 嚴重氾濫：工兵架設的浮橋、便橋可能被沖走；百年洪水時連永久橋梁也可能沖毀 */
function floodBridges(){var MP=G.map,H=G.hyd,lost=MP.brg.filter(function(q){if(q.t==='p')return H.lv>=2.6&&rnd()<0.08*(H.lv-2.4);return (q.t==='f'||q.t==='a'||q.t==='e')&&rnd()<0.3+0.15*(H.lv-1.8);});if(!lost.length)return;
  var ks=lost.map(function(q){return q.y*MP.GW+q.x;});ks.forEach(function(k){MP.rd[k]=0;MP.rl[k]=0;});MP.brg=MP.brg.filter(function(q){return lost.indexOf(q)<0;});mapChanged(ks);
  var c=cellXY(ks[0]);logE(-1,'evt','⚠ 洪水沖毀 '+lost.length+' 段橋梁（包括'+placeTxt(c[0],c[1])+'一帶）',c[0],c[1]);}
/* 百年洪水：河岸被沖刷成新的河道、沙洲 */
function floodScour(){var MP=G.map,F=fpInit(),ks=[],soft={};['field','mead','hedge','orch','scrub','marsh','sand'].forEach(function(id){soft[LCI[id]]=1;});
  for(var i=0;i<F.L.length;i++){var k=F.L[i];if(F.d[k]!==1||!soft[MP.lc[k]]||MP.rd[k]||MP.rl[k]||MP.el[k]-MP.el[F.src[k]]>2)continue;var r=(Math.imul(k^0x5bd1e995,2654435761)>>>0)%100;if(r<18){MP.lc[k]=LCI.riv;ks.push(k);}else if(r<28&&MP.lc[k]!==LCI.sand){MP.lc[k]=LCI.sand;ks.push(k);}}
  if(!ks.length)return;mapChanged(ks);G._fp=null;G.hyd.scN=(G.hyd.scN||0)+ks.length;var c=cellXY(ks[0]);logE(-1,'evt','⚠ 洪水沖刷河岸：約 '+fmt(ks.length*MP.cs*MP.cs/1e6,2)+' 平方公里的河岸被沖成新的河道或沙洲，地貌改變',c[0],c[1]);}
/* 被水淹到的部隊：撤往最近的高處；來不及的人員溺斃、車輛泡水損壞 */
function dryNear(k0,mobi,R){var MP=G.map,GW=MP.GW,GH=MP.GH,FL=G.evt&&G.evt.fl,x0=k0%GW,y0=(k0-x0)/GW,lim=(WADE[mobi]||0.6)*0.4;
  for(var r=1;r<=R;r++){var best=-1,bd=1e9;ringRow(x0,y0,r,GW,GH,function(X,Y,dx,dy){var q=Y*GW+X;
      if(isWater(MP.lc[q])||MP.rv[q]>=2||FL&&FL[q]/10>lim)return false;var d2=dx*dx+dy*dy;if(d2<bd){bd=d2;best=q;}return false;});if(best>=0)return cellXY(best);}return null;}
function floodEvac(){var FL=G.evt&&G.evt.fl,MP=G.map;if(!FL)return;G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||u.st==='lift'||u.amph||u.cvy)return;var s=ST(u);if(s.dom!=='land')return;var k=cellAt(u.x,u.y),v=FL[k];if(!v)return;
    var lim=WADE[s.mobi]||0.6,d=v/10;if(d<lim*0.8)return;var p=dryNear(k,s.mobi,Math.ceil(2500/MP.cs));if(!p)return;var dm=d>=1.2?u.men*0.004*Math.min(3,d):0,amph=s.fl.indexOf('W')>=0,dv=!amph&&u.veh>0?u.veh*Math.min(0.4,0.05+0.06*d):0;
    if(dm>0||dv>0)hit(u,null,dm,dv,15,'storm');u.mor=clamp(u.mor-3,0,100);u.x=p[0];u.y=p[1];u.path=null;u.pq=0;if(u.task==='go'&&u.goal)wantPath(u,u.goal[0],u.goal[1]);
    if(!u._fevT||G.t-u._fevT>3600){u._fevT=G.t;logE(u.side,'evt','洪水淹沒'+uName(u)+'的位置（水深約 '+fx(d,1)+' 公尺），部隊撤往'+placeTxt(p[0],p[1])+'的高處'+(dm>=1||dv>=0.5?'（'+(dm>=1?'溺斃約 '+fmt(dm)+' 人':'')+(dm>=1&&dv>=0.5?'，':'')+(dv>=0.5?'約 '+fmt(dv)+' 輛車泡水損壞':'')+'）':''),p[0],p[1],u.id);}});}
/* ---------- AI：沒有淺灘或橋梁可走的河流、深水淹水區也算要強渡的水域 ---------- */
function fordOpenNear(x,y,R){var MP=G.map,F=fordMap(),cs=MP.cs,cx=Math.floor(x/cs),cy=Math.floor(y/cs),Rc=Math.ceil(R/cs);for(var Y=Math.max(0,cy-Rc);Y<=Math.min(MP.GH-1,cy+Rc);Y++)for(var X=Math.max(0,cx-Rc);X<=Math.min(MP.GW-1,cx+Rc);X++){var k=Y*MP.GW+X;if(F[k]&&fordMul(0,k)>0)return true;}return false;}
(function(){var b=riverOnAxis;riverOnAxis=function(C,tg){var r=b(C,tg);if(r)return r;var MP=G.map,FL=G.evt&&G.evt.fl,d=dist(C[0],C[1],tg[0],tg[1]),n=Math.ceil(d/(MP.cs*0.7));
  for(var i=1;i<n;i++){var t=i/n,x=C[0]+(tg[0]-C[0])*t,y=C[1]+(tg[1]-C[1])*t,k=cellAt(x,y);if(MP.rv[k]===2&&fordMul(0,k)===0&&!MP.rd[k]&&!fordOpenNear(x,y,2500))return [x,y];if(FL&&FL[k]>=10)return [x,y];}return null;};})();
/* 渡口：湖泊與深水淹水區也可以設置 */
function waterCross(x,y,R,isW){var MP=G.map,cs=MP.cs,c0=cellAt(x,y),gx=c0%MP.GW,gy=(c0/MP.GW)|0,Rc=Math.ceil(R/cs),best=null,bd=1e18;
  for(var b=-Rc;b<=Rc;b++)for(var a=-Rc;a<=Rc;a++){var X=gx+a,Y=gy+b;if(X<0||Y<0||X>=MP.GW||Y>=MP.GH)continue;var k=Y*MP.GW+X;if(!isW(k)||MP.rd[k])continue;var d=a*a+b*b;if(d<bd){bd=d;best=k;}}
  if(best===null)return null;var bx=best%MP.GW,by=(best/MP.GW)|0,dirs=[[1,0],[0,1],[1,1],[1,-1]],bestL=null;
  dirs.forEach(function(dv){var cells=[best],ok=[false,false],ends=[null,null];for(var sgn=-1;sgn<=1;sgn+=2){for(var t=1;t<=40;t++){var X=bx+dv[0]*t*sgn,Y=by+dv[1]*t*sgn;if(X<0||Y<0||X>=MP.GW||Y>=MP.GH)break;var k=Y*MP.GW+X;if(!isW(k)&&!isWater(MP.lc[k])&&!(MP.rv[k]>=2)){ok[sgn<0?0:1]=true;ends[sgn<0?0:1]=k;break;}cells.push(k);}}
    if(ok[0]&&ok[1]&&(!bestL||cells.length<bestL.cells.length))bestL={cells:cells,ends:ends};});
  if(!bestL)return null;var e0=cellXY(bestL.ends[0]);return {k:best,c:4,cells:bestL.cells,ends:bestL.ends,bx:e0[0],by:e0[1],x:(bx+0.5)*cs,y:(by+0.5)*cs};}
(function(){var b=riverNear;riverNear=function(x,y,R){var r=b(x,y,R);if(r)return r;var MP=G.map,FL=G.evt&&G.evt.fl;return waterCross(x,y,R,function(k){return MP.lc[k]===LCI.lake||!!(FL&&FL[k]>=10);});};})();
/* ---------- 開戰時：重算淺灘與氾濫平原、水文從平常水位開始 ---------- */
(function(){var b=prepareBattle;prepareBattle=function(){FDC.mp=null;G._fp=null;G._flPk=null;var r=b.apply(this,arguments);if(!G.hyd)hydInit();return r;};})();
