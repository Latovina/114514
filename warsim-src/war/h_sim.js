/* ===================== 模擬核心：環境（日夜、天氣）、指揮鏈與命令延遲、司令部規劃、單位行為、補給、士氣、勝負、紀錄 ===================== */
var DT=30;/* 每步 30 秒 */
function now(){return dateOf(G.set.y,G.set.m,G.set.d,G.t+G.set.h*3600+(G.set.mi||0)*60);}
function rnd(){return G._r?G._r():Math.random();}
function SD(i){return G.sides[i];}
/* ---------- 陣營：兩方或三方（第三方 G.sides[2]）；各方之間的關係（G.dip：war 交戰、neu 中立、ally 同盟）決定誰是敵軍 ---------- */
function nSides(){return G&&G.sides?G.sides.length:2;}
var SIDXC=[[],[0],[0,1],[0,1,2],[0,1,2,3]];
function SIDES(){return SIDXC[nSides()]||SIDXC[2];}
function relOf(a,b){if(a===b)return 'self';if(!(a>=0)||!(b>=0))return 'neu';var D=G.dip;if(!D||!D[a])return 'war';return D[a][b]||'war';}
function hostile(a,b){return a!==b&&a>=0&&b>=0&&relOf(a,b)==='war';}
/* 各方一份的陣列 */
function sA0(){var a=[];for(var i=0;i<nSides();i++)a.push(0);return a;}
function sAO(){var a=[];for(var i=0;i<nSides();i++)a.push({});return a;}
function sAL(){var a=[];for(var i=0;i<nSides();i++)a.push([]);return a;}
function sAV(v){var a=[];for(var i=0;i<nSides();i++)a.push(v);return a;}
/* 主要的敵方：兩方時就是另一方；三方時是交戰對象中兵力最多的一方（沒有交戰對象時取兵力最多的他方） */
var EOFC={g:null,k:'',v:[]};
function enemyOf(s){if(!G||!G.sides||G.sides.length<3||!(s>=0))return s===0?1:0;var k=G.step+'|'+(G.dipV||0);if(EOFC.g!==G||EOFC.k!==k){EOFC.g=G;EOFC.k=k;EOFC.v=[];}var v=EOFC.v[s];if(v!==undefined)return v;
  var b=-1,bm=-1,i,m;for(i=0;i<G.sides.length;i++){if(i===s||!hostile(s,i))continue;m=sideStr(i).m;if(m>bm){bm=m;b=i;}}if(b<0)for(i=0;i<G.sides.length;i++){if(i===s)continue;m=sideStr(i).m;if(m>bm){bm=m;b=i;}}EOFC.v[s]=b<0?(s===0?1:0):b;return EOFC.v[s];}
/* 觀測的對象：其他各方，以及是否交戰（交戰的才算敵軍） */
var SPSE=[],SPS2=[[[1,true]],[[0,true]]],SPSC={g:null,v:-1,L:[]};
function spotSides(s){if(!(s>=0))return SPSE;var n=nSides();if(n<3)return SPS2[s]||SPSE;var v=G.dipV||0;if(SPSC.g!==G||SPSC.v!==v){SPSC.g=G;SPSC.v=v;SPSC.L=[];}var L=SPSC.L[s];if(L)return L;L=[];for(var i=0;i<n;i++)if(i!==s)L.push([i,hostile(s,i)]);SPSC.L[s]=L;return L;}
/* 與某方交戰的各方（兩方時就是另一方） */
var HSC={g:null,v:-1,L:[]},HS2=[[1],[0]];
function hostSides(s){if(!(s>=0))return SPSE;var n=nSides();if(n<3)return HS2[s]||SPSE;var v=G.dipV||0;if(HSC.g!==G||HSC.v!==v){HSC.g=G;HSC.v=v;HSC.L=[];}var L=HSC.L[s];if(L)return L;L=[];for(var i=0;i<n;i++)if(i!==s&&hostile(s,i))L.push(i);HSC.L[s]=L;return L;}
/* 可以攻佔的目標：不是本方的，而且是無主或交戰對象的（兩方時就是不是本方的） */
function objTgt(side,o){return o.own!==side&&(o.own<0||nSides()<3||hostile(side,o.own));}
/* 沒有任何交戰對象（三方作戰中保持中立的一方） */
function atPeace(side){return nSides()>=3&&!hostSides(side).length;}
/* ---------- 環境：太陽高度、月相、天氣、地面狀況 ---------- */
function sunAlt(lat,doy,hour){var dec=23.44*Math.sin(2*PI*(284+doy)/365)*D2R,H=(hour-12)*15*D2R,phi=lat*D2R;return Math.asin(Math.sin(phi)*Math.sin(dec)+Math.cos(phi)*Math.cos(dec)*Math.cos(H))*R2D;}
function moonOf(o){var days=(Date.UTC(clamp(o.y,1900,2100),o.m-1,o.d)-Date.UTC(2000,0,6))/864e5+(o.y<1900||o.y>2100?(o.y-clamp(o.y,1900,2100))*365.2425:0),ph=((days%29.53)+29.53)%29.53/29.53;return 0.5-0.5*Math.cos(2*PI*ph);}
function climMonth(m){var C=G.map.clim||{Tj:5,Tl:20,Pj:60,Pl:70},s=G.map.lat0>=0?1:-1,f=0.5-0.5*Math.cos(2*PI*((m-1)/12))*s;return {T:C.Tj+(C.Tl-C.Tj)*f,P:C.Pj+(C.Pl-C.Pj)*f};}
function envInit(){var o=now(),c=climMonth(o.m);G.env={wx:G.set.wxMode==='fixed'?WXI[G.set.wx]||0:pickWx(c,o.h,-1),T:c.T,mud:G.set.mud0||0,snow:c.T<-2?0.3:0,frozen:c.T<-3,nextWx:G.t+3600};envStep(0);}
function pickWx(c,hour,cur){var r=rnd(),wet=clamp(c.P/140,0.05,0.65),cold=c.T<1,fogP=(hour>=4&&hour<=9?0.12:0.03)*(c.P>50?1:0.4);
  if(cur>=0&&rnd()<0.55)return cur;if(r<fogP)return r<fogP*0.5?WXI.fog:WXI.mist;r=rnd();if(r<wet){var h=rnd();if(cold)return h<0.7?WXI.lsnow:WXI.hsnow;return h<0.6?WXI.lrain:h<0.9?WXI.hrain:WXI.storm;}r=rnd();return r<0.4?WXI.clear:r<0.75?WXI.cloud:WXI.over;}
function envStep(dt){var E=G.env;if(!WX[E.wx])E.wx=0;var o=now(),c=climMonth(o.m),lat=G.map.lat0||35,alt=sunAlt(lat,o.doy,o.h+o.mi/60),moon=moonOf(o);E.alt=alt;E.moon=moon;
  E.light=alt>6?1:alt>-6?0.25+0.75*(alt+6)/12:0.04+0.2*moon;E.phase=alt>6?'day':alt>-6?(o.h<12?'dawn':'dusk'):'night';
  E.T=c.T+5*Math.sin((o.h+o.mi/60-9)/24*2*PI)+(E.wx>=WXI.lrain&&E.wx<=WXI.storm?-2:0);
  if(G.set.wxMode!=='fixed'&&G.t>=E.nextWx){var old=E.wx;E.wx=pickWx(c,o.h,E.wx);E.nextWx=G.t+3600*(1+rnd()*2);if(old!==E.wx)logE(-1,'wx','天氣轉為'+WX[E.wx][1]+'，氣溫 '+fx(E.T,0)+' °C');}
  var w=WX[E.wx],h=dt/3600;if(w[3])E.mud=clamp(E.mud+[0,0.04,0.12,0.15][w[3]]*h,0,1);else E.mud=clamp(E.mud-(E.T>10?0.03:0.012)*h*(E.light>0.5?1.5:0.6),0,1);
  if(w[4])E.snow=clamp(E.snow+[0,0.05,0.15][w[4]]*h,0,1);else if(E.T>1)E.snow=clamp(E.snow-0.02*h*(E.T/5),0,1);E.frozen=E.T<-3;E.vis=w[2];if(G.evt)evtEnv(E);
  if(E._ph!==E.phase){if(E._ph)logE(-1,'light',E.phase==='night'?'入夜，月光 '+pct(moon*100)+'':E.phase==='day'?'天亮':E.phase==='dusk'?'黃昏':'黎明');E._ph=E.phase;}}
/* 觀測係數：光線 × 天氣，依夜視裝備 */
function visMul(nv,air){var E=G.env,l=E.light,lf=l>=0.99?1:nv>=2?Math.max(l,0.85):nv===1?Math.max(l,0.55):l<0.3?Math.max(l,0.12):l;var w=E.vis;if(nv>=2)w=Math.max(w,0.6*w+0.25);return lf*w*(air&&E.wx>=WXI.fog?0.6:1);}
/* ---------- 紀錄 ---------- */
function logE(side,k,txt,x,y,uid){var e={t:G.t,s:side,k:k,txt:txt,x:x,y:y,u:uid};G.log.push(e);if(G.log.length>6000)G.log.splice(0,G.log.length-6000);if(typeof btLog==='function')btLog(e);if(G.onLog)G.onLog(e);}
function placeTxt(x,y){var MP=G.map,best=null,bd=1e18;(MP.set||[]).forEach(function(s){var d=dist(x,y,s.x*MP.cs,s.y*MP.cs)/(s.kind==='city'?3:s.kind==='town'?1.8:1);if(d<bd){bd=d;best=s;}});if(!best)return '（'+fmt(x/1000,1)+', '+fmt(y/1000,1)+'）';
  var dx=x-best.x*MP.cs,dy=y-best.y*MP.cs,d=Math.sqrt(dx*dx+dy*dy);if(d<600)return best.name;var a=Math.atan2(-dy,dx)*R2D,dirs=['東','東北','北','西北','西','西南','南','東南'],di=dirs[((Math.round(a/45)%8)+8)%8];return best.name+di+'方 '+kmTxt(d);}
function uName(u){if(!u)return '—';var n=u.name||'單位';if(G._dup&&G._dup[u.side+'|'+n]&&u.p>=0){var P=uById(u.p);if(P){var pn=P.name||'';if(G._dup[P.side+'|'+pn]&&P.p>=0){var PP=uById(P.p);if(PP)pn=PP.name+pn;}return pn+n;}}return n;}
function dupNames(){var c={};G.units.forEach(function(u){var k=u.side+'|'+(u.name||'');c[k]=(c[k]||0)+1;});G._dup={};for(var k in c)if(c[k]>1)G._dup[k]=1;}
/* ---------- 通訊：兩個單位之間的傳遞方式與延遲（秒） ---------- */
function commEra(a,b){var ea=uEra(a),eb=uEra(b);return ea.i<=eb.i?ea:eb;}
function stillFor(u){return G.t-(u.movedAt||-1e9);}
function ewNear(side,x,y){var C=G._ewC;if(!C||C.st!==G.step||C.t!==G.t||C.n!==G.units.length)C=G._ewC={st:G.step,t:G.t,n:G.units.length,L:G.units.filter(function(e){return e.st!=='dead'&&utHasU(e,'E');})};
  for(var i=0;i<C.L.length;i++){var e=C.L[i];if(e.side!==side&&e.st!=='dead'&&dist(e.x,e.y,x,y)<15000)return true;}return false;}
function utHasU(u,f){return ST(u).fl.indexOf(f)>=0;}
/* 通信裝備的修正（h44_eqfx.js 依兩端的支援裝備覆寫）：s 傳遞時間倍率、r 無線電距離倍率、j 受干擾倍率、ok 兩端都有無線電可用、E 改用的通信參數 */
function commQ(a,b,E){return {s:1,r:1,j:1,ok:true};}
function hopDelay(a,b,dryRun){var E=commEra(a,b),d=dist(a.x,a.y,b.x,b.y),km=d/1000,M=G.set.delayMul===undefined?1:G.set.delayMul,o={via:'courier',sec:0,risk:0};if(M<=0)return o;
  var Q=commQ(a,b,E);if(Q.E)E=Q.E;
  var ech=Math.max(a.ech||1,b.ech||1),rr=(E.rr||0)*Math.pow(2,clamp(ech-1,0,4))*Q.r,jam=!dryRun&&(E.radio||E.dig)&&ewNear(a.side,b.x,b.y),W=[];
  /* 自動選最快的方式：數位網路、無線電（受干擾時變慢、距離縮短）、有線電報或電話（兩端都停留一小時以上）、傳令 */
  if(E.dig&&Q.ok&&!jam)W.push(['digital',(E.radio||1.5)*60*Q.s]);if(E.radio&&Q.ok&&km<=rr*(jam?(Q.j===1?0.4:clamp(1-0.6*Q.j,0.1,0.9)):1))W.push(['radio',E.radio*60*(jam?(Q.j===1?3:1+2*Q.j):1)*Q.s]);
  if(E.wire&&km<=25&&stillFor(a)>3600&&stillFor(b)>3600)W.push(['wire',4*60]);W.push(['courier',E.find*60+km/(E.cour*0.75)*3600]);
  var w=W[0];for(var i=1;i<W.length;i++)if(W[i][1]<w[1])w=W[i];o.via=w[0];o.sec=w[1];o.risk=w[0]==='courier'?1:0;
  o.sec*=M*(0.85+0.3*(dryRun?0.5:rnd()));return o;}
/* 由司令部到目標單位的指揮鏈（含兩端） */
function chainTo(src,u){var up=[u],c=u;while(c.p>=0&&c.id!==src.id){c=uById(c.p);if(!c)break;up.push(c);if(c.id===src.id)break;}if(up[up.length-1].id!==src.id)up.push(src);return up.reverse();}
function orderDelayEst(u){var src=sideCmd(u.side)||u;if(src.id===u.id)return {sec:0,hops:[]};var ch=chainTo(src,u),s=0,hops=[];for(var i=1;i<ch.length;i++){var h=hopDelay(ch[i-1],ch[i],true);s+=h.sec+(i<ch.length-1?uEra(ch[i]).relay*60*(G.set.delayMul===undefined?1:G.set.delayMul):0);hops.push(h.via);}return {sec:s,hops:hops};}
/* ---------- 下達命令：玩家或司令部 → 經由指揮鏈送達 ---------- */
function newOrder(k,o){o=o||{};o.k=k;o.oid=(G.oid=(G.oid||0)+1);o.ti=G.t;if(typeof o.then==='string'&&k!=='bombard'){/* 後續命令一律轉為命令物件（砲擊的 then 為「轉為火力支援」旗標，維持字串） */o.then=newOrder(o.then,{x:o.x,y:o.y,face:o.face,opt:o.then==='defend'?{post:'hasty'}:o.opt});}return o;}
function sendOrder(from,to,o,viaChain){var src=from||sideCmd(to.side)||to;o.to=to.id;
  if(SD(to.side).ai&&src.id!==to.id&&!aiControls(to)&&aiControls(src)){/* 玩家指揮的部隊：AI 上級的命令改以「指令」送達收件匣，由玩家決定是否遵照 */o.st='dir';var S1=SD(to.side),R=S1.pu>0&&uById(S1.pu)&&inTree(to,S1.pu)?uById(S1.pu):to;return (/^(waitx|rejoin|refuse|twd|eager)$/.test(o.k)?null:dirFromOrder(src,R,o,R!==to))||{id:0,k:'dir',ta:G.t,via:[]};}var ch=viaChain&&src.id!==to.id?chainTo(src,to):[src,to],t=G.t,via=[],lg=[];
  /* 走傳令的每一段都是地圖上的傳令兵（見「通信」）：經過敵軍附近可能被截，寄件的司令部等不到回音才重新派遣 */
  if(src.id===to.id)ch=[to];for(var i=1;i<ch.length;i++){var h=hopDelay(ch[i-1],ch[i]);if(h.via==='courier'&&h.sec>0)lg.push(crLeg(ch[i-1],ch[i],t,h.sec,commEra(ch[i-1],ch[i]),h));t+=h.sec+(i<ch.length-1?uEra(ch[i]).relay*60*(G.set.delayMul===undefined?1:G.set.delayMul):0);via.push(h.via);}
  var m={id:(G.mid=(G.mid||0)+1),k:'order',side:to.side,to:to.id,from:src.id,o:o,t0:G.t,ta:t,via:via,lost:false,x0:src.x,y0:src.y};if(lg.length)m.lg=lg;
  G.msgs.push(m);o.st='send';o.eta=t;to.lastOid=o.oid;return m;}
function msgStep(){var L=G.msgs,keep=[];G.msgs=keep;/* 處理途中新送出的訊息（回覆、重新派遣、因請求而下的命令）直接進新的佇列 */L.forEach(function(m){var u=uById(m.to);if(!u||u.st==='dead')return;if(m.k==='req'||m.k==='rep'||m.k==='dir'){if(G.t<m.ta){keep.push(m);return;}if(m.lost){logE(m.side,'req','送給'+uName(u)+'的'+(m.k==='req'?'請求':m.k==='rep'?'回覆':'指令')+'沒有送達（傳令兵可能遭敵截獲）');return;}reqDeliver(m);return;}if(m.k!=='order'){keep.push(m);return;}
    if(m.lost){if(G.t>=m.retry){var src=uById(m.from)||sideCmd(m.side);logE(m.side,'order','傳令兵未能抵達'+uName(u)+'，重新派遣');if(src)sendOrder(src,u,m.o,true);return;}keep.push(m);return;}
    if(G.t<m.ta){keep.push(m);return;}if(u.lastOid&&m.o.oid<u.lastOid&&!m.o.sub){return;}receiveOrder(u,m.o);});}
/* 收到命令：編制單位進入規劃，葉單位進入準備 */
function receiveOrder(u,o){var E=uEra(u),M=G.set.delayMul===undefined?1:G.set.delayMul,off=offOf(u),cmdQ=off?off.cmd:5,cx={move:0.5,attack:1,defend:0.8,withdraw:0.6,recon:0.5,screen:0.6,bombard:0.3,support:0.3,halt:0.1,rest:0.3,reserve:0.4,fortify:0.5,patrol:0.4,strike:0.5,bomb:0.5,bridge:0.5,demolish:0.5,siege:1.1,pursue:0.5,airlift:0.9,airdrop:1.2,landing:1.3,nuke:0.6,crossing:1.4,storm:1.2,breakthrough:1.3,penetrate:1.1,build:0.6,xsite:0.5,breach:0.5,persuade:0.4,gather:0.4,craft:0.4,joint:1.8}[o.k]||0.5;
  if(o.opt&&o.opt.prep)cx*=1.4;var q=(off&&hasQ(off,'staff'))?0.7:(off&&hasQ(off,'slow'))?1.4:1;if(off&&hasQ(off,'careful'))q*=1.15;var oc=inCmd(u)?1:1.8;
  if(isLeaf(u)){var rt=E.react*60*M*(1.25-0.005*(u.trn||60))*oc*q*(o.k==='halt'||o.k==='withdraw'?0.5:1);if(uDom(u)==='air')rt*=0.5;o.st='prep';o.ready=G.t+rt;u.pend=[o];}
  else{var pt=PLANM[u.ech]*60*E.plan*(1.3-0.06*cmdQ)*cx*q*M*(1+u.fat/200)*oc;o.st='plan';o.ready=G.t+pt;u.pend=[o];logE(u.side,'plan',uName(u)+'收到命令（'+ordN(o)+'），參謀規劃約 '+durTxt(pt),u.x,u.y,u.id);}}
function pendStep(){G.units.forEach(function(u){if(u.st==='dead'||!u.pend||!u.pend.length)return;var o=u.pend[0];if(G.t<o.ready)return;u.pend.shift();
    if(isLeaf(u)){activate(u,o);}else{aiAdjust(u,o);u.ord=o;o.st='exec';planOrder(u,o).forEach(function(p){var so=p[1];if(isLeaf(p[0])&&kitBusy(p[0])&&!/withdraw|delay|twd|halt|rest|holdfast/.test(so.dk||so.k)&&!(so.opt&&so.opt.post==='delay'))return;/* 正在收集或打造器材的單位繼續工作 */so.sub=1;so.parent=o.oid;sendOrder(u,p[0],so,false);});if(!uById(u.id).kids.length)return;}});}
/* ---------- 命令名稱 ---------- */
var ORDN={move:'移動',attack:'攻擊',defend:'防禦',withdraw:'撤退',recon:'偵察',screen:'警戒掩護',bombard:'砲擊',support:'火力支援',halt:'停止待命',rest:'休整',reserve:'預備隊',fortify:'構築工事',patrol:'巡邏',strike:'空中打擊',bomb:'轟炸',bridge:'架橋',demolish:'爆破橋梁或隧道',
  siege:'圍攻',ambush:'伏擊',delay:'遲滯',holdfast:'固守',pursue:'追擊',airlift:'機降',airdrop:'空降',landing:'登陸',nuke:'核打擊',
  persuade:'勸降',gather:'收集資源',craft:'打造器材',joint:'聯合作戰',refuse:'就地掩蔽（停止進攻）',twd:'戰術後撤',gas:'撤出毒劑區',rot:'輪替整補',eager:'自行出擊',rejoin:'歸建',crossing:'渡河作戰',storm:'強攻',breakthrough:'突破',penetrate:'穿插',build:'構築',xsite:'設置渡口',breach:'開闢通路',waitx:'等待渡河'};
function ordN(o){return o?ORDN[o.dk||o.k]||o.k||'':'';}
/* ---------- 戰術、姿態、交戰規則、行進節奏、隊形 ---------- */
var TAC=[['frontal','正面突擊','全部兵力在寬正面同時推進、突擊'],['flank','側翼迂迴','少數兵力正面牽制，主力經集結點繞到敵側翼攻擊'],['pincer','鉗形包圍','兩翼同時迂迴、中央牽制，企圖包圍'],['break','中央突破','集中於狹窄正面，兩個梯隊連續突擊'],['firemove','火力與運動','半數以火力壓制，半數躍進突擊'],
 ['infil','滲透','小群隱蔽接近，速度慢但不易被發現，突擊有奇襲效果'],['probe','試探攻擊','遇強烈抵抗或傷亡超過一成即撤回'],['feint','佯攻','只在射程內以火力牽制，不發起突擊，一小時後撤回'],['raid','襲擊','突擊得手或接敵半小時後撤回出發位置']];
var POST=[['hasty','急造防禦','就地展開，構工速度一般'],['prepared','陣地防禦','加強構工，工兵構築塹壕'],['depth','縱深防禦','半數兵力配置在後方第二線'],['delay','遲滯防禦','接敵即逐次後撤，以空間換取時間'],['reverse','反斜面陣地','配置在稜線後方，敵軍遠距離難以觀測與射擊'],
 ['ambush','伏擊','隱蔽待敵進入近距離才開火，首輪射擊威力倍增'],['hide','隱蔽','不開火，盡量避免被發現'],['strong','環形據點','全向防禦，沒有側翼弱點'],['mobile','機動防禦','半數兵力為預備隊，伺機反擊'],['holdfast','固守','死守陣地：不後撤、較晚潰散，但容易被包圍殲滅']];
var ROE=[['side','依交戰守則'],['free','主動開火'],['pid','辨識後開火'],['return','僅還擊'],['close','近距離才開火'],['hold','禁止射擊']];
/* 部隊採用的開火原則（交戰守則模組會改成依本方守則）與辨識判定 */
function roeOf(u,op){op=op||optOf(u);return op.roe&&op.roe!=='side'?op.roe:op.post==='hide'?'hold':'free';}
function roeIdOk(u,t,ts,d){return true;}
/* 部隊可不可以自行出擊等（授權模組會依本方的授權表），以及行動前的請示 */
function authMay(u,k){return G.set.iniP===true||aiControls(u);}
function authGo(u,k,d){return true;}
/* 飛機出擊的掛載（掛載模組會依命令或任務選定，並調整空戰能力） */
function ldPick(u,o){}
function ldTxt(u){return '';}
function ldAA(u,s){return s.aa||0;}
var PACE=[['rush','急行',1.3,1.6,0.8],['normal','標準',1,1,1],['careful','謹慎',0.7,0.8,1.2]];
var FMS=[['line','橫隊'],['column','縱隊（衝擊）'],['skirmish','散兵線']];
function optOf(u){return (u.ord&&u.ord.opt)||{};}
function paceOf(u){var p=optOf(u).pace;return p==='rush'?PACE[0]:p==='careful'?PACE[2]:PACE[1];}
function fmOf(u){var f=optOf(u).fm;return f==='column'||f==='skirmish'?f:'line';}
/* ---------- 司令部規劃：把命令分解給下級 ---------- */
function roleOf(u){var s=ST(u);if(isLeaf(u)&&(s.fl.indexOf('u')>=0||s.fl.indexOf('M')>=0||s.fl.indexOf('I')>=0||s.fl.indexOf('D')>=0))return 'sup';if(s.dom==='air')return 'air';if(s.dom==='sea'||s.dom==='sub')return 'nav';if(!isLeaf(u)){var L=leavesOf(u),n=L.length,cnt={};if(!n)return 'man';L.forEach(function(x){var q=roleOf(x);cnt[q]=(cnt[q]||0)+1;});/* 艦隊、航空聯隊等編制依多數成員歸類 */if((cnt.nav||0)>n/2)return 'nav';if((cnt.air||0)>n/2)return 'air';return (cnt.fire||0)>n/2?'fire':(cnt.sup||0)+(cnt.hq||0)>=n*0.6?'sup':'man';}
  if(s.fl.indexOf('l')>=0)return 'sup';if(s.fl.indexOf('h')>=0)return 'hq';if(s.ind>0&&s.shock<1.5)return 'fire';if(s.br==='art'||s.br==='rkt'||s.br==='mor'||s.br==='sge')return 'fire';if(s.br==='ad')return 'sup';if(s.fl.indexOf('r')>=0)return 'rec';return 'man';}
function centroid(L){if(!L.length)return [0,0];return [sum(L,function(u){return u.x;})/L.length,sum(L,function(u){return u.y;})/L.length];}
function enemyCentroid(side,x,y,R){var C=G.ct[side]||{},n=0,sx=0,sy=0;for(var id in C){var c=C[id];if(G.t-c.t>3600)continue;if(R&&dist(c.x,c.y,x,y)>R)continue;sx+=c.x;sy+=c.y;n++;}return n?[sx/n,sy/n]:null;}
function homeDir(side){var e=SD(side).edge||'W';return e==='W'?PI:e==='E'?0:e==='N'?-PI/2:PI/2;}
function planOrder(F,o){var kids=kidsOf(F).filter(alive),out=[],own=leavesOf(F),C=centroid(own.length?own:[F]),P=o.x!==undefined?[o.x,o.y]:C,dir=Math.atan2(P[1]-C[1],P[0]-C[0]),k=o.k;
  if(dist(C[0],C[1],P[0],P[1])<200){var ec=enemyCentroid(F.side,P[0],P[1]);dir=ec?Math.atan2(ec[1]-P[1],ec[0]-P[0]):homeDir(F.side)+PI;}
  var fx=Math.cos(dir),fy=Math.sin(dir),lx=-fy,ly=fx,man=kids.filter(function(u){var r=roleOf(u);return r==='man'||r==='rec';}),fire=kids.filter(function(u){return roleOf(u)==='fire';}),air=kids.filter(function(u){return roleOf(u)==='air';}),nav=kids.filter(function(u){return roleOf(u)==='nav';}),oth=kids.filter(function(u){var r=roleOf(u);return r==='sup'||r==='hq';});
  var fw=function(u){return frontW(u);},add=function(u,so){out.push([u,so]);};
  function spreadLine(L,cx,cy,ax,ay,W,mk){var tot=sum(L,fw)||1,sc=W?W/tot:1,pos=-(W||tot)/2;L.forEach(function(u){var w=fw(u)*sc,c=pos+w/2;pos+=w;add(u,mk(u,cx+ax*c,cy+ay*c));});}
  function sendAir(u){if(isCarrier(u))return;add(u,newOrder(k==='defend'||k==='screen'?'patrol':k==='recon'?'recon':'strike',{x:P[0],y:P[1],r:3000}));}
  function sendNav(u){var s=ST(isLeaf(u)?u:leavesOf(u).filter(alive)[0]||u);add(u,newOrder(s.ind>0&&(k==='attack'||k==='bombard')?'bombard':'move',{x:P[0],y:P[1],r:1500}));}
  if(k==='attack'){var opt=o.opt||{},tac=opt.tac||'frontal',srt=man.slice().sort(function(a,b){return strengthOf(b).f-strengthOf(a).f;}),nr=srt.length>=3&&!opt.all&&tac!=='raid'?Math.max(1,Math.floor(srt.length/3)):0,asl=srt.slice(0,srt.length-nr),res=srt.slice(srt.length-nr),W=o.w||Math.max(sum(asl,fw)*1.1,400),hh=o.hHour||(opt.prep?G.t+opt.prep*60:0);
    var mk=function(u,x,y,ex){var T=o.then&&o.then.k?o.then:null,th=T?Object.assign({},T,T.k==='defend'?{x:x,y:y}:{x:(T.x!==undefined?T.x:P[0])+(x-P[0]),y:(T.y!==undefined?T.y:P[1])+(y-P[1])}):undefined;return newOrder('attack',Object.assign({x:x,y:y,hHour:hh,opt:opt,x0:u.x,y0:u.y,then:th},ex||{}));};
    if((tac==='flank'||tac==='pincer')&&asl.length>=2){/* 迂迴：牽制部隊正面佯攻，主力經側翼的集結點轉向攻擊 */
      var nfix=Math.max(1,Math.round(asl.length/3)),fix=asl.slice(asl.length-nfix),mv=asl.slice(0,asl.length-nfix),fopt=Object.assign({},opt,{tac:'feint'});
      spreadLine(fix,P[0]-fx*300,P[1]-fy*300,lx,ly,Math.max(400,W*0.6),function(u,x,y){return mk(u,x,y,{opt:fopt});});
      var sideSg=opt.side==='L'?-1:opt.side==='R'?1:(function(){var l=0,r=0,C2=G.ct[F.side];for(var id in C2){var c=C2[id];if(G.t-c.t>3600||dist(c.x,c.y,P[0],P[1])>W*1.5+3000)continue;((c.x-P[0])*lx+(c.y-P[1])*ly>0?r++:l++);}return r<=l?1:-1;})();
      var wings=tac==='pincer'&&mv.length>=2?[[mv.slice(0,Math.ceil(mv.length/2)),1],[mv.slice(Math.ceil(mv.length/2)),-1]]:[[mv,sideSg]];
      wings.forEach(function(wg){var L=wg[0],sg=wg[1],off=W*0.6+1500,wx=P[0]-fx*1800+lx*sg*off,wy=P[1]-fy*1800+ly*sg*off,ww=Math.max(300,sum(L,fw)*1.05);var p=validPos({dom:'land'},wx,wy);
        spreadLine(L,P[0]+lx*sg*Math.min(600,W*0.3),P[1]+ly*sg*Math.min(600,W*0.3),fx,fy,ww,function(u,x,y){return mk(u,x,y,{via:[[p[0],p[1]]]});});});}
    else if(tac==='break'&&asl.length>=2){/* 中央突破：狹窄正面、兩個梯隊 */var n1=Math.ceil(asl.length/2),e1=asl.slice(0,n1),e2=asl.slice(n1),Wn=Math.max(300,W*0.35);
      spreadLine(e1,P[0],P[1],lx,ly,Wn,function(u,x,y){return mk(u,x,y);});spreadLine(e2,P[0]+fx*400,P[1]+fy*400,lx,ly,Wn,function(u,x,y){return mk(u,x,y,{delay:1200});});}
    else if(tac==='firemove'&&asl.length>=2){/* 火力與運動：一半壓制、一半突擊 */var hb=Math.floor(asl.length/2),base=asl.slice(0,hb),man2=asl.slice(hb),bopt=Object.assign({},opt,{tac:'feint',base:1});
      spreadLine(asl,P[0],P[1],lx,ly,W,function(u,x,y){return base.indexOf(u)>=0?mk(u,x,y,{opt:bopt}):mk(u,x,y);});void man2;}
    else spreadLine(asl,P[0],P[1],lx,ly,W,function(u,x,y){return mk(u,x,y);});
    res.forEach(function(u,i){add(u,newOrder('reserve',{x:P[0]-fx*Math.max(1200,W*0.5)+lx*(i-(res.length-1)/2)*fw(u),y:P[1]-fy*Math.max(1200,W*0.5)+ly*(i-(res.length-1)/2)*fw(u)}));});
    fire.forEach(function(u){add(u,newOrder(hh?'bombard':'support',{x:P[0],y:P[1],r:Math.max(400,W/3),dur:hh?(opt.prep*60):0,then:'support',sup:F.id}));});
    air.forEach(sendAir);nav.forEach(sendNav);oth.forEach(function(u){add(u,newOrder('move',{x:C[0]+(P[0]-C[0])*0.5-fx*1500,y:C[1]+(P[1]-C[1])*0.5-fy*1500}));});}
  else if(k==='defend'||k==='screen'){var L=o.pts&&o.pts.length>=4?o.pts:null,ec2=enemyCentroid(F.side,P[0],P[1]),fd=o.face!==undefined?o.face:ec2?Math.atan2(ec2[1]-P[1],ec2[0]-P[0]):dir,dopt=o.opt||{},post=dopt.post||'hasty';
    var srt2=man.slice().sort(function(a,b){return strengthOf(b).f-strengthOf(a).f;}),rf=post==='depth'||post==='mobile'?0.5:post==='strong'?0.2:1/3,nr2=k==='defend'&&srt2.length>=3&&dopt.depth!==false&&post!=='ambush'?Math.max(1,Math.floor(srt2.length*rf)):0,front=srt2.slice(0,srt2.length-nr2),res2=srt2.slice(srt2.length-nr2);
    var bx=Math.cos(fd),by=Math.sin(fd),rv=post==='reverse'?300:0,eng=front.filter(function(u){return ST(u).fl.indexOf('e')>=0;});
    if(post==='strong'){/* 環形據點：沿圓周部署 */front.forEach(function(u,i){var a=fd+2*PI*i/Math.max(1,front.length),R=Math.max(250,sum(front,fw)/(2*PI));add(u,newOrder(k,{x:P[0]+Math.cos(a)*R,y:P[1]+Math.sin(a)*R,face:a,opt:dopt}));});}
    else if(L){var n=front.length;front.forEach(function(u,i){var q=plAt(L,(i+0.5)/n),a=q.a+PI/2,nx=Math.cos(a),ny=Math.sin(a);if(ec2&&((ec2[0]-q.x)*nx+(ec2[1]-q.y)*ny)<0){a+=PI;}add(u,newOrder(eng.indexOf(u)>=0&&post==='prepared'?'fortify':k,{x:q.x-Math.cos(a)*rv,y:q.y-Math.sin(a)*rv,face:a,opt:dopt}));});var q0=plAt(L,0.5);P=[q0.x,q0.y];}
    else{var W2=o.w||sum(front,fw)*1.05;spreadLine(front,P[0]-bx*rv,P[1]-by*rv,-by,bx,W2,function(u,x,y){return newOrder(eng.indexOf(u)>=0&&post==='prepared'?'fortify':k,{x:x,y:y,face:fd,opt:dopt});});}
    var dd=post==='depth'?2200:1500;res2.forEach(function(u,i){add(u,newOrder(post==='depth'?k:'reserve',{x:P[0]-bx*dd+(i-(res2.length-1)/2)*fw(u)*-by,y:P[1]-by*dd+(i-(res2.length-1)/2)*fw(u)*bx,face:fd,opt:post==='depth'?dopt:undefined}));});
    fire.forEach(function(u,i){var s=ST(u),back=clamp((s.ind||s.rM)*0.3,800,8000);add(u,newOrder('support',{x:P[0]-bx*back+(i-(fire.length-1)/2)*600*-by,y:P[1]-by*back+(i-(fire.length-1)/2)*600*bx,face:fd,sup:F.id}));});
    air.forEach(sendAir);nav.forEach(sendNav);oth.forEach(function(u){add(u,newOrder('move',{x:P[0]-bx*2500,y:P[1]-by*2500}));});}
  else if(k==='move'||k==='withdraw'||k==='reserve'||k==='recon'){var road=o.opt&&o.opt.road,all=man.concat(fire,oth);
    all.forEach(function(u,i){var ox=u.x-C[0],oy=u.y-C[1],dd=Math.sqrt(ox*ox+oy*oy),mx=3000;if(dd>mx){ox*=mx/dd;oy*=mx/dd;}if(road){ox=-fx*400*i;oy=-fy*400*i;}
      var kk=k==='recon'&&roleOf(u)!=='rec'?'move':k;add(u,newOrder(kk,{x:P[0]+ox,y:P[1]+oy,pts:o.pts?o.pts.slice():null,opt:o.opt,face:o.face,delay:k==='withdraw'&&roleOf(u)==='man'&&i===0?900:0}));});
    air.forEach(function(u){add(u,newOrder(k==='recon'?'recon':'patrol',{x:P[0],y:P[1],r:3000}));});nav.forEach(sendNav);}
  else if(k==='bombard'){fire.concat(nav.filter(function(u){return ST(u).ind>0;})).forEach(function(u){add(u,newOrder('bombard',{x:P[0],y:P[1],r:o.r||500,dur:o.dur||1800}));});air.forEach(function(u){add(u,newOrder('strike',{x:P[0],y:P[1],r:o.r||1500}));});}
  else if(k==='support'){fire.forEach(function(u){add(u,newOrder('support',{sup:F.id}));});}
  else if(k==='strike'||k==='patrol'||k==='bomb'){air.forEach(function(u){add(u,newOrder(k,{x:P[0],y:P[1],r:o.r||3000}));});kids.filter(function(u){return air.indexOf(u)<0;}).forEach(function(u){add(u,newOrder('halt',{}));});}
  else if(k==='siege'){/* 圍攻：沿包圍圈部署，面向圈內；火砲轟擊圈內 */var R=o.r||clamp(sum(man,fw)/(2*PI)*1.1,1200,6000),n=man.length,a0=Math.atan2(C[1]-P[1],C[0]-P[0]);siegeReg(F,P[0],P[1],R,o);
    man.forEach(function(u,i){var a=a0+2*PI*(i+0.5)/Math.max(1,n),x=P[0]+Math.cos(a)*R,y=P[1]+Math.sin(a)*R;add(u,newOrder('defend',{x:x,y:y,face:a+PI,w:2*PI*R/Math.max(1,n),opt:{post:'hasty',siege:1,depth:false},dk:'siege'}));});
    fire.forEach(function(u){add(u,newOrder('bombard',{x:P[0],y:P[1],r:Math.max(500,R*0.5),dur:3600,then:'support',sup:F.id}));});air.forEach(sendAir);nav.forEach(sendNav);oth.forEach(function(u){add(u,newOrder('move',{x:P[0]+Math.cos(a0)*(R+2500),y:P[1]+Math.sin(a0)*(R+2500)}));});}
  else if(k==='pursue'){man.forEach(function(u){add(u,newOrder('pursue',{x:P[0],y:P[1],opt:o.opt}));});fire.forEach(function(u){add(u,newOrder('support',{sup:F.id}));});air.forEach(sendAir);nav.forEach(sendNav);oth.forEach(function(u){add(u,newOrder('move',{x:C[0]+(P[0]-C[0])*0.5,y:C[1]+(P[1]-C[1])*0.5}));});}
  else if(k==='airlift'||k==='airdrop'||k==='landing'){var okF=function(u){if(!isLeaf(u))return true;return k==='airlift'?canHeli(u):k==='airdrop'?canPara(u):canAmph(u);},AL=man.concat(fire,oth),L1=AL.filter(okF),L2=AL.filter(function(u){return !okF(u);}),W3=o.w||Math.max(sum(L1,fw)*1.1,400);
    spreadLine(L1,P[0],P[1],lx,ly,W3,function(u,x,y){return newOrder(k,{x:x,y:y,opt:o.opt,then:o.then});});L2.forEach(function(u){add(u,roleOf(u)==='fire'?newOrder('support',{sup:F.id}):newOrder('halt',{}));});
    air.forEach(function(u){if(!isCarrier(u))add(u,newOrder('patrol',{x:P[0],y:P[1],r:3000}));});nav.forEach(sendNav);}
  else if(k==='nuke'){var cands=leavesOf(F).filter(function(u){return alive(u)&&nukeCap(u)>0;}),inR=cands.filter(function(u){return ST(u).dom==='air'||dist(u.x,u.y,P[0],P[1])<=indOf(u,ST(u))*0.98;}).sort(function(a,b){return dist(a.x,a.y,P[0],P[1])-dist(b.x,b.y,P[0],P[1]);}),nc=inR[0]||cands[0];
    if(nc)add(nc,newOrder('nuke',o.wk?{x:P[0],y:P[1],Y:o.Y,wk:o.wk}:{x:P[0],y:P[1],Y:o.Y}));else logE(F.side,'nuke',uName(F)+'所屬部隊沒有可實施核打擊的單位',F.x,F.y,F.id);}
  else if(planEng(F,o,kids,man,fire,air,nav,oth,P,C,dir,add,fw,spreadLine)){}
  else if(planV4(F,o,kids,man,fire,air,nav,oth,P,C,dir,add,fw,spreadLine)){}
  else{kids.forEach(function(u){add(u,newOrder(k,{x:o.x,y:o.y,opt:o.opt,face:o.face}));});}
  return out;}
