/* ===================== 喪屍與寄生蟲作戰環境（可選）：屍群與寄生蟲群、巢穴與感染源、咬傷與屍變、死者復生、平民受害 =====================
   屍群是雙方以外的第三方：追逐附近的部隊（剛開過火的部隊，兩倍距離外的屍群也聽得到），沒有部隊時襲擊平民與難民，再沒有就四處遊蕩。
   雙方部隊自動向射程內看得到的屍群射擊；砲兵的火力支援（含直屬砲兵的自動支援）會打看得到的屍群與巢穴；地毯式轟炸、核武、野火也會殺傷屍群。
   被咬傷的官兵經過潛伏期會屍變（在部隊裡出現新的屍群）；醫療補給可以救治一部分。戰死的官兵與死去的平民可能復生。
   不可名狀之物（G.set.zed.k='eldritch' 或 'all'）：無名之物（極少、極耐打，輕兵器幾乎無效，會破壞車輛，三公里外就令人驚恐）、
   低語者（三百公尺內才看得到，看不見也聽得到它們的低語，附近的官兵精神崩潰）、蠕影（成群、夜裡活躍，白天潛伏）；從裂隙湧出，不會感染、死者也不會復生。
   設定在 G.set.zed（預設關閉）。關閉時完全不執行、不耗用模擬亂數；開啟後屍群用自己的亂數（存在 G.zed），存檔後繼續的結果一致。 */
var ZK={
 z:{n:'行屍',sp:0.35,hp:1,atk:0.004,veh:0,inf:0.5,det:1500,sa:1,fire:1.5,c:'#7CB342',fear:1.5},
 r:{n:'奔跑者',sp:2.2,hp:1,atk:0.012,veh:0,inf:0.5,det:2500,sa:0.8,fire:1.5,c:'#C0CA33',fear:2},
 b:{n:'巨型變異體',sp:0.9,hp:12,atk:0.06,veh:0.004,inf:0.2,det:2000,sa:0.25,fire:1,arm:2,c:'#8D6E63',fear:2.5,fr:2000},
 h:{n:'寄生宿主',sp:0.7,hp:1.5,atk:0.006,veh:0,inf:0.7,det:2000,sa:0.8,fire:2,c:'#BA68C8',fear:1.6},
 s:{n:'寄生蟲群',sp:1.6,hp:0.3,atk:0.002,veh:0,inf:0.8,det:1200,sa:0.35,fire:3,c:'#EC407A',fear:1.4},
 p:{n:'孢子體',sp:0.25,hp:2,atk:0.002,veh:0,inf:0.3,det:1000,sa:1,fire:2,burst:0.4,c:'#FFB300',fear:1.2},
 w:{n:'無名之物',sp:0.5,hp:8,atk:0.06,veh:0.01,inf:0,det:3000,sa:0.08,fire:0.5,arm:3,c:'#2A0A3D',dem:1,fear:3,fr:3000},
 q:{n:'低語者',sp:1.1,hp:2,atk:0.008,veh:0,inf:0,det:2000,sa:0.6,fire:1,c:'#7E57C2',dem:1,fear:1.6,fr:1500,psy:1,hide:300},
 v:{n:'蠕影',sp:2.4,hp:0.6,atk:0.012,veh:0,inf:0,det:1800,sa:0.9,fire:2,c:'#1A237E',dem:1,fear:1,fr:1200,noc:1}};
/* 種類的單位：不可名狀之物以「個」計，不稱「群」 */
function zedNm(h){var K=ZK[h.k]||ZK.z;return K.n+(K.dem?'':'群');}
function zedQ(h){return (ZK[h.k]||ZK.z).dem?' 個':' 隻';}
var ZMODE={zombie:'喪屍',parasite:'寄生蟲',mixed:'喪屍與寄生蟲',eldritch:'不可名狀之物',all:'喪屍、寄生蟲與不可名狀之物'};
var ZLV=[null,{n:'零星',pop:0.04,nest:1,iv:4,wave:250,towns:0.25},{n:'爆發',pop:0.12,nest:2,iv:2.5,wave:600,towns:0.5},{n:'末日',pop:0.3,nest:4,iv:1.5,wave:1400,towns:1}];
var ZSRC={town:'市鎮爆發',nest:'巢穴與感染源',edge:'從地圖邊緣湧入',all:'以上全部',pick:'只在手動指定的地點'};
var ZDEF={on:false,k:'zombie',lv:2,src:'town',rise:true,civ:true,t0:0};
var ZFK=18,ZAK=300;/* 校準：步槍連對開闊地上的行屍每分鐘約擊倒 25 隻；一個砲兵連對千隻的屍群每次齊射約殺傷 70 隻 */
if(typeof KIAF!=='undefined'){KIAF.zed=0.55;KIAF.zturn=1;KIAF.zamp=0;}
if(typeof KINDN!=='undefined'){KINDN.zed='喪屍與寄生蟲';KINDN.zturn='屍變';KINDN.zamp='截肢（防止屍變）';}
if(typeof APDEF!=='undefined')APDEF.zed=true;
function zedOn(){var z=G&&G.set&&G.set.zed;return !!(z&&typeof z==='object'&&z.on);}
function zedCfg(){var z=G&&G.set&&G.set.zed,o={};for(var k in ZDEF)o[k]=z&&z[k]!==undefined&&z[k]!==null?z[k]:ZDEF[k];o.lv=clamp(Math.round(+o.lv||2),1,3);if(!ZMODE[o.k])o.k='zombie';if(!ZSRC[o.src])o.src='town';o.t0=Math.max(0,+o.t0||0);return o;}
/* 自己的亂數（xorshift32，狀態存在 G.zed.rs） */
function zr(){var Z=G.zed,x=Z.rs|0;if(!x)x=1;x^=x<<13;x^=x>>>17;x^=x<<5;Z.rs=x;return (x>>>0)/4294967296;}
function zedPar(k){return k==='h'||k==='s'||k==='p';}
function zedDem(k){return !!(ZK[k]&&ZK[k].dem);}
function zedDemMix(lv){return lv>=3?[['v',0.5],['q',0.3],['w',0.2]]:lv>=2?[['v',0.6],['q',0.3],['w',0.1]]:[['v',0.75],['q',0.25]];}
function zedR(h){return 25+3.2*Math.sqrt(Math.max(1,h.n))*(h.k==='w'?6:h.k==='b'?3:h.k==='s'||h.k==='v'?0.5:1);}
function zedPass(x,y){var MP=G.map;if(!(x>=0&&y>=0&&x<MP.Wm&&y<MP.Hm))return false;var k=cellAt(x,y);return !isWater(MP.lc[k])||MP.rd[k]>0||!!(MP.rl&&(MP.rl[k]&1));}
function zedLand(x,y,R){for(var i=0;i<24;i++){var a=zr()*2*PI,d=i===0?0:R*Math.sqrt(zr()),px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;if(zedPass(px,py)&&!isWater(G.map.lc[cellAt(px,py)]))return [px,py];}return null;}
/* 依模式與嚴重程度挑選種類；各種類的數量換算（巨型變異體很少、寄生蟲群數量多） */
function zedMix(C){if(C.k==='parasite')return [['h',0.55],['s',0.3],['p',0.15]];if(C.k==='eldritch')return zedDemMix(C.lv);var z=C.lv>=3?[['z',0.72],['r',0.2],['b',0.08]]:C.lv>=2?[['z',0.82],['r',0.18]]:[['z',1]];
  if(C.k==='mixed')return z.map(function(q){return [q[0],q[1]*0.55];}).concat([['h',0.25],['s',0.12],['p',0.08]]);
  if(C.k==='all')return z.map(function(q){return [q[0],q[1]*0.45];}).concat([['h',0.15],['s',0.08],['p',0.05]]).concat(zedDemMix(C.lv).map(function(q){return [q[0],q[1]*0.27];}));return z;}
function zedPick(C){var L=zedMix(C),t=0,i;for(i=0;i<L.length;i++)t+=L[i][1];var r=zr()*t;for(i=0;i<L.length;i++){r-=L[i][1];if(r<=0)return L[i][0];}return L[0][0];}
function zedSize(k,n){return k==='w'?Math.max(1,Math.round(n*0.006)):k==='q'?Math.max(2,Math.round(n*0.04)):k==='v'?n*0.4:k==='b'?Math.max(2,Math.round(n*0.012)):k==='s'?n*2:k==='p'?Math.max(3,n*0.12):k==='r'?n*0.6:n;}
function zedKN(C){return C.k==='parasite'?'寄生體':C.k==='mixed'?'屍群與寄生體':C.k==='eldritch'?'不可名狀之物':C.k==='all'?'屍群與不可名狀之物':'屍群';}
/* ---------- 屍群：新增、就近併入 ---------- */
function zedAdd(k,n,x,y){var Z=G.zed;if(!(n>=1)||!ZK[k])return null;var h={id:++Z.seq,k:k,n:n,x:x,y:y,tx:x,ty:y,st:'wan',tid:0,sn:sAV(-1e9),t0:G.t,wt:0};Z.H.push(h);Z.st.born+=n;return h;}
function zedJoin(k,n,x,y){var Z=G.zed,b=null,bd=350;if(!(n>=1))return null;for(var i=0;i<Z.H.length;i++){var h=Z.H[i];if(h.k!==k||h.n<1)continue;var d=dist(h.x,h.y,x,y);if(d<bd){bd=d;b=h;}}
  if(b){var w=n/(b.n+n);b.x+=(x-b.x)*w;b.y+=(y-b.y)*w;b.n+=n;Z.st.born+=n;return b;}return zedAdd(k,n,x,y);}
/* 在 (x,y) 半徑 R 內放出約 n 隻（依模式分成幾群不同種類）；par：巢穴決定是寄生蟲（1）、喪屍（0）還是不可名狀之物（2） */
function zedSpawn(n,x,y,R,par){var C=zedCfg(),tot=0,parts=Math.min(6,Math.max(1,Math.round(n/600)));
  for(var i=0;i<parts;i++){var k=par===undefined?zedPick(C):zedPick({k:par===2?'eldritch':par?'parasite':'zombie',lv:C.lv}),m=zedSize(k,n/parts),p=zedLand(x,y,R);if(!p)continue;if(zedJoin(k,m,p[0],p[1]))tot+=m;}return tot;}
/* 死者復生：同一處、時間相近的併成一筆 */
function zedDead(x,y,n,k,dl,mil){var Z=G.zed;if(!Z||!(n>0))return;var t=G.t+dl,m=mil?1:0;for(var i=Z.D.length-1;i>=0&&i>=Z.D.length-40;i--){var d=Z.D[i];if(d.k===k&&(d.m||0)===m&&Math.abs(d.t-t)<900&&dist(d.x,d.y,x,y)<500){d.n+=n;return;}}
  Z.D.push({x:x,y:y,n:n,k:k,t:t,m:m});if(Z.D.length>600)Z.D.splice(0,Z.D.length-600);}
/* ---------- 巢穴與感染源 ---------- */
function zedNestN(N){return N.dem?'裂隙':N.par?'寄生蟲巢穴':'感染源';}
function zedNestP(N){return N.dem?2:N.par;}
function zedNest(x,y,C){var Z=G.zed,dem=C.k==='eldritch'||(C.k==='all'&&zr()<0.34),par=!dem&&(C.k==='parasite'||((C.k==='mixed'||C.k==='all')&&zr()<0.5)),hp=300+150*C.lv,N={id:++Z.seq,par:par?1:0,dem:dem?1:0,x:x,y:y,hp:hp,hp0:hp,nx:G.t+3600*ZLV[C.lv].iv*(0.3+0.4*zr()),sn:sA0(),nm:placeTxt(x,y)};Z.N.push(N);return N;}
function zedNestHit(N,d,side,by){if(N.hp<=0||!(d>0))return;N.hp-=d;if(N.hp>0)return;N.hp=0;N.dt=G.t;var Z=G.zed;if(side>=0&&side<nSides())Z.st.nk[side]=(Z.st.nk[side]||0)+1;logE(-1,'zed',(by?by+'摧毀了':'')+zedNestN(N)+'（'+N.nm+'）',N.x,N.y);}
/* 離部隊最遠的陸地（林地、廢墟、工業區、沼澤優先） */
function zedFar(minD){var MP=G.map,best=null,bs=-1,U=G.units.filter(function(u){return onMap(u)&&isLeaf(u);});
  for(var i=0;i<80;i++){var x=MP.Wm*(0.08+0.84*zr()),y=MP.Hm*(0.08+0.84*zr()),k=cellAt(x,y),c=MP.lc[k];if(isWater(c))continue;var d=1e9;for(var j=0;j<U.length;j++){var q=dist(U[j].x,U[j].y,x,y);if(q<d)d=q;}
    var w=(c===LCI.dfor||c===LCI.cfor||c===LCI.jung||c===LCI.rubble||c===LCI.ind||c===LCI.marsh)?1.5:1,sc=Math.min(d,minD*2)*w;if(sc>bs){bs=sc;best=[x,y];}}return best;}
function zedEdge(){var MP=G.map,m=MP.cs*2;for(var i=0;i<40;i++){var e=Math.floor(zr()*4),f=0.05+0.9*zr(),x=e===0?m:e===1?MP.Wm-m:f*MP.Wm,y=e===2?m:e===3?MP.Hm-m:f*MP.Hm;if(zedPass(x,y)&&!isWater(MP.lc[cellAt(x,y)]))return [x,y];}return null;}
/* ---------- 誰看得到：某一方在 R 公尺內有部隊 ---------- */
function zedNear(side,x,y,R){var f=false;gridNearS(x,y,R,side,function(u){if(!f&&onMap(u)&&isLeaf(u)&&dist(u.x,u.y,x,y)<=R)f=true;});return f;}
function zedLog(x,y,txt,R){var a=zedNear(0,x,y,R||5000),b=zedNear(1,x,y,R||5000);if(a&&b)logE(-1,'zed',txt,x,y);else if(a)logE(0,'zed',txt,x,y);else if(b)logE(1,'zed',txt,x,y);}
function zedVR(u){if(u._zvT===undefined||G.t-u._zvT>=600||G.t<u._zvT){u._zvT=G.t;var R=1500;try{R=visInfo(u).R;}catch(e){}u._zvR=R>0?R:0;}return u._zvR;}
/* ---------- 爆發 ---------- */
/* ---------- 手動指定的爆發地點：G.set.zed.pts=[{x,y,n,k,nest}]（開戰後爆發時一起出現；爆發後點選的立即出現） ---------- */
function zedInit0(){if(!G.zed)G.zed={H:[],N:[],D:[],seq:0,rs:(hstr((G.set.seed||'')+'|zed')|0)||1,st:{k:sA0(),lost:sA0(),turn:sA0(),civ:0,kz:0,born:0,nk:sA0(),rise:0,cure:0},ts:G.t,go:0,nx:0};var Z=G.zed;if(!Z.H)Z.H=[];if(!Z.N)Z.N=[];if(!Z.D)Z.D=[];return Z;}
function zedPtOk(p){var MP=G.map;return !!p&&typeof p==='object'&&isFinite(p.x)&&isFinite(p.y)&&p.x>=0&&p.y>=0&&p.x<MP.Wm&&p.y<MP.Hm;}
function zedPtsOf(){var z=G.set&&G.set.zed;return z&&Array.isArray(z.pts)?z.pts.filter(zedPtOk).slice(0,80):[];}
function zedAt(p,C){var x=+p.x,y=+p.y,n=clamp(Math.round(+p.n||300),1,20000),Z=G.zed;
  if(C.civ!==false&&G.civ)G.civ.S.forEach(function(g){if(dist(g.x,g.y,x,y)>g.r+300)return;var c=Math.min(n*0.5,civPresent(g)*0.5);if(c>0.5){civCas(g,c,1,'zed',-1);g.alarm=1;Z.st.civ+=c;}});
  if(p.nest){var N=zedNest(x,y,C);if(p.k==='parasite'||p.k==='zombie'||p.k==='eldritch'){N.par=p.k==='parasite'?1:0;N.dem=p.k==='eldritch'?1:0;}N.nx=G.t+3600*ZLV[C.lv].iv*0.5;return zedSpawn(n,x,y,300,zedNestP(N));}
  if(ZK[p.k]){var q=zedLand(x,y,250),m=zedSize(p.k,n);return q&&zedJoin(p.k,m,q[0],q[1])?m:0;}return zedSpawn(n,x,y,250);}
/* 作戰中（已經爆發）在地圖上點選：立即在該處出現（單機直接執行；線上由房主送到伺服器） */
function zedSpawnAt(p){if(!G||!G.started||G.over||!zedOn()||!zedPtOk(p))return 0;var C=zedCfg(),Z=zedInit0();if(!Z.go)return 0;var m=zedAt(p,C);
  if(m>0)logE(-1,'zed',placeTxt(+p.x,+p.y)+(p.nest?'出現新的'+(p.k==='parasite'?'寄生蟲巢穴':p.k==='eldritch'?'裂隙':'感染源'):'突然爆發')+'，約 '+fmt(m)+(ZK[p.k]?(ZK[p.k].dem?' 個':' 隻')+ZK[p.k].n:' 隻'+zedKN(C)),+p.x,+p.y);return m;}
function zedOutbreak(C){var Z=G.zed,MP=G.map,L=ZLV[C.lv],tot=0,pl=[];Z.go=1;Z.tgo=G.t;
  zedPtsOf().forEach(function(p){var m=zedAt(p,C);if(m>0){tot+=m;pl.push(placeTxt(+p.x,+p.y));}});
  if(C.src==='town'||C.src==='all'){var T=[];if(G.civ&&G.civ.S&&G.civ.S.length)G.civ.S.forEach(function(g){T.push({x:g.x,y:g.y,r:g.r,p:civPresent(g),g:g,n:g.n});});else (MP.set||[]).forEach(function(s){T.push({x:s.x*MP.cs,y:s.y*MP.cs,r:Math.max(250,s.r||300),p:s.pop||0,n:s.name});});
    T.sort(function(a,b){return b.p-a.p;});var want=Math.max(1,Math.round(T.length*L.towns));
    T.slice(0,want).forEach(function(t,i){if(i>0&&zr()>0.75)return;var n=Math.max(12,t.p*L.pop*(0.6+0.8*zr()));if(t.g&&C.civ!==false){var c=Math.min(n,civPresent(t.g)*0.9);if(c>0)civCas(t.g,c,1,'zed',-1);t.g.alarm=1;Z.st.civ+=c;}var m=zedSpawn(n,t.x,t.y,t.r);if(m>0){tot+=m;pl.push(t.n);}});}
  if(C.src==='nest'||C.src==='all'||(C.src==='town'&&!tot)){for(var i=0;i<L.nest;i++){var p=zedFar(6000);if(!p)continue;var N=zedNest(p[0],p[1],C);tot+=zedSpawn(L.wave*(0.3+0.4*zr()),N.x,N.y,300,zedNestP(N));pl.push(N.nm+'的'+zedNestN(N));}}
  if(C.src==='edge'||C.src==='all'){var e=zedEdge();if(e){tot+=zedSpawn(L.wave*(0.6+0.8*zr()),e[0],e[1],400);pl.push(placeTxt(e[0],e[1])+'附近的地圖邊緣');}Z.nx=G.t+3600*L.iv*(0.6+0.8*zr());}
  if(C.src==='pick'&&!tot){logE(-1,'zed','喪屍與寄生蟲作戰環境已啟用，但沒有指定爆發地點：在「設定」的異變環境卡片按「在地圖上點選」，點選的地點會立即爆發');return;}
  logE(-1,'zed',(C.k==='parasite'?'寄生蟲感染爆發':C.k==='mixed'?'喪屍疫情與寄生蟲感染同時爆發':C.k==='eldritch'?'無法解釋的東西出現在戰場上':C.k==='all'?'喪屍、寄生蟲與無法解釋的東西同時出現':'喪屍疫情爆發')+'（'+L.n+'）：'+(pl.length?pl.slice(0,6).join('、')+(pl.length>6?'等 '+pl.length+' 處':''):'各地')+'出現'+zedKN(C)+'，約 '+fmt(tot)+' 隻');
  if(G.onPause&&apOn('zed'))G.onPause('喪屍與寄生蟲爆發');}
/* ---------- 每一步（兩個模擬步，60 秒）：計時、觀測、移動、近戰、射擊、巢穴、野火、屍變、整理 ---------- */
function zedStep(){var C=zedCfg(),Z=zedInit0();if(!Z.go){if(G.t<Z.ts+C.t0*3600)return;zedOutbreak(C);}
  zedTimers(C);zedSee();zedMove(C);zedMelee(C);zedFire();zedNests();zedBurn();zedTurn(C);zedTidy();}
(function(){var b=v8Step;v8Step=function(){b.apply(this,arguments);if(!G||!G.started||G.over||!zedOn())return;if(G.step%2===0)zedStep();zedRq();};})();
function zedTimers(C){var Z=G.zed,L=ZLV[C.lv];
  /* 從地圖邊緣湧入的屍潮 */if((C.src==='edge'||C.src==='all')&&G.t>=(Z.nx||0)){var e=zedEdge();if(e){var n=zedSpawn(L.wave*(0.5+zr()),e[0],e[1],400);if(n>0)logE(-1,'zed','又一波'+zedKN(C)+'從'+placeTxt(e[0],e[1])+'附近的地圖邊緣湧入，約 '+fmt(n)+' 隻',e[0],e[1]);}Z.nx=G.t+3600*L.iv*(0.6+0.8*zr());}
  /* 巢穴與感染源不斷放出新的屍群，直到被摧毀 */Z.N.forEach(function(N){if(N.hp<=0||G.t<N.nx)return;var n=zedSpawn(L.wave*(0.25+0.35*zr()),N.x,N.y,250,zedNestP(N));N.nx=G.t+3600*L.iv*(0.7+0.6*zr());if(n>0)zedLog(N.x,N.y,zedNestN(N)+'（'+N.nm+'）又湧出約 '+fmt(n)+(N.dem?' 個不可名狀之物':' 隻'),6000);});
  /* 死者復生 */if(Z.D.length){var keep=[],up=0;Z.D.forEach(function(d){if(G.t<d.t){keep.push(d);return;}if(d.n>=1){var p=zedLand(d.x,d.y,150);if(p&&zedJoin(d.k,d.n,p[0],p[1])){Z.st.rise+=d.n;up+=d.n;if(d.m&&d.n>=5)zedLog(d.x,d.y,placeTxt(d.x,d.y)+'約 '+fmt(d.n)+' 名陣亡官兵的屍體復生',4000);if(typeof fearArea==='function'&&d.n>=3)fearArea(p[0],p[1],1500,Math.min(18,4+Math.sqrt(d.n)),'rise');}}});Z.D=keep;}}
/* 觀測：各方部隊依觀測距離（大群看得更遠）發現屍群；巢穴一經發現就一直標示 */
function zedSee(){var Z=G.zed,MR=sA0();G.units.forEach(function(u){if(u.side>=0&&u.side<nSides()&&onMap(u)&&isLeaf(u)){var R=zedVR(u);if(R>MR[u.side])MR[u.side]=R;}});
  SIDES().forEach(function(s){if(!(MR[s]>0))return;Z.H.forEach(function(h){if(h.n<1)return;if(h.sn[s]===undefined)h.sn[s]=-1e9;var sz=clamp(0.7+0.3*Math.log10(h.n+1),0.7,1.4),hr=zedR(h),f=false;
      var hide=ZK[h.k].hide;gridNearS(h.x,h.y,Math.min(12000,hide?hide+hr+50:MR[s]*sz+hr+50),s,function(u){if(f||!onMap(u)||!isLeaf(u))return;var R=zedVR(u)*sz;if(hide)R=Math.min(R,hide);if(R>0&&dist(u.x,u.y,h.x,h.y)<=R+hr)f=true;});
      if(f){if((h.n>=200||ZK[h.k].dem)&&G.t-h.sn[s]>3*3600){logE(s,'zed',ZK[h.k].dem?'官兵看見了無法形容的東西（'+ZK[h.k].n+'，約 '+fmt(h.n)+' 個），在'+placeTxt(h.x,h.y):'發現'+zedNm(h)+'：約 '+fmt(h.n)+' 隻，在'+placeTxt(h.x,h.y),h.x,h.y);if(G.onPause&&apOn('zed')&&zedNear(s,h.x,h.y,3000)&&G.t-(Z.apT||-1e9)>1800){Z.apT=G.t;G.onPause('屍群逼近');}}h.sn[s]=G.t;}});
    Z.N.forEach(function(N){if(N.sn[s]||N.hp<=0)return;var f=false;gridNearS(N.x,N.y,6000,s,function(u){if(!f&&onMap(u)&&isLeaf(u)&&dist(u.x,u.y,N.x,N.y)<=Math.min(zedVR(u),4000))f=true;});if(f){N.sn[s]=G.t;logE(s,'zed','發現'+zedNestN(N)+'：'+N.nm+'（摧毀它才能阻止新的屍群出現）',N.x,N.y);}});});}
/* 目標與移動：最近的部隊 → 平民與難民 → 往市鎮或隨機遊蕩；遇水繞行，只能走橋 */
function zedMove(C){var Z=G.zed,MP=G.map,E=G.env,night=E.phase==='night',cold=E.T<-5,civ=C.civ!==false&&G.civ;
  Z.H.forEach(function(h){if(h.n<1)return;var K=ZK[h.k],hr=zedR(h),R=K.det*(night&&h.k==='r'?1.2:1)*(K.noc&&!night?0.4:1),t=null,td=1e18,cur=h.tid?uById(h.tid):null;
    if(cur&&onMap(cur)&&ST(cur).dom==='land'&&dist(cur.x,cur.y,h.x,h.y)<R*2.5){t=cur;td=dist(cur.x,cur.y,h.x,h.y)*0.8;}
    gridNear(h.x,h.y,R*2,function(u){if(!onMap(u)||!isLeaf(u)||ST(u).dom!=='land')return;var d=dist(u.x,u.y,h.x,h.y),loud=u.fired!==undefined&&G.t-u.fired<=180;if(d>(loud?R*2:R))return;var v=d/(loud?1.6:1);if(v<td){td=v;t=u;}});
    var stop=30;if(t){h.tid=t.id;h.tx=t.x;h.ty=t.y;h.st=dist(t.x,t.y,h.x,h.y)<=hr+120?'fight':'hunt';stop=Math.max(20,hr*0.4);}
    else{h.tid=0;var g=null,gd=R*1.5;if(civ){G.civ.S.forEach(function(q){if(civPresent(q)<10)return;var d=dist(q.x,q.y,h.x,h.y);if(d<gd){gd=d;g=q;}});(G.civ.R||[]).forEach(function(q){if(q.st==='out'||q.st==='camp'||!(q.n>=10))return;var d=dist(q.x,q.y,h.x,h.y);if(d<gd){gd=d;g=q;}});}
      if(g){h.tx=g.x;h.ty=g.y;h.st='feed';stop=Math.max(20,(g.r||100)*0.5);}
      else{if(h.st!=='wan'||G.t>=h.wt||dist(h.x,h.y,h.tx,h.ty)<60){var p=null,T=MP.set||[];if(T.length&&zr()<0.35){var s0=T[Math.floor(zr()*T.length)],sx=s0.x*MP.cs,sy=s0.y*MP.cs;if(dist(sx,sy,h.x,h.y)<9000&&zedPass(sx,sy))p=[sx,sy];}
          for(var j=0;j<6&&!p;j++){var a2=zr()*2*PI,r2=1500+2500*zr(),px=clamp(h.x+Math.cos(a2)*r2,MP.cs,MP.Wm-MP.cs),py=clamp(h.y+Math.sin(a2)*r2,MP.cs,MP.Hm-MP.cs);if(zedPass(px,py))p=[px,py];}
          if(p){h.tx=p[0];h.ty=p[1];}h.wt=G.t+1800+3600*zr();}h.st='wan';}}
    var dx=h.tx-h.x,dy=h.ty-h.y,d=Math.hypot(dx,dy);if(d<=stop)return;var c=MP.lc[cellAt(h.x,h.y)],tf=isWater(c)?0.6:Math.max(0.2,LC[c][3][0]);
    var v=K.sp*tf*DT*2*(h.st==='wan'?0.45:1)*(cold&&(h.k==='z'||h.k==='h')?0.6:1)*(h.n>3000?0.8:1)*(K.noc&&!night?0.3:1);v=Math.min(v,d-stop);if(!(v>0))return;var a=Math.atan2(dy,dx),A=[0,0.6,-0.6,1.2,-1.2,1.9,-1.9],ok=false;
    for(var i=0;i<A.length;i++){var b=a+A[i],nx=h.x+Math.cos(b)*v,ny=h.y+Math.sin(b)*v;if(zedPass(nx,ny)){h.x=nx;h.y=ny;h.hd=Math.round(b*100)/100;ok=true;break;}}if(!ok){h.wt=0;if(h.st==='wan')h.tx=h.x;}});}
/* 近戰：與屍群接觸的部隊（依掩蔽、工事、裝甲減輕）傷亡、士氣下降，部分官兵被咬傷；沒有部隊時襲擊平民與難民 */
function zedMelee(C){var Z=G.zed;Z.H.forEach(function(h){if(h.n<1)return;var K=ZK[h.k],hr=zedR(h),eng=Math.min(h.n,120+h.n*0.3),L=[];
    gridNear(h.x,h.y,hr+150,function(u){if(onMap(u)&&isLeaf(u)&&ST(u).dom==='land'&&dist(u.x,u.y,h.x,h.y)<=hr+120)L.push(u);});
    if(L.length){var e=eng/L.length;L.forEach(function(u){zedBite(h,u,e);});h.st='fight';return;}
    if(C.civ===false||!G.civ)return;var vk=zedPar(h.k)?'h':'z';
    G.civ.S.forEach(function(g){if(dist(g.x,g.y,h.x,h.y)>g.r+hr)return;var p=civPresent(g);if(p<1)return;var c=Math.min(p*0.08,eng*K.atk*3*(1-0.6*(g.shel||0)));if(!(c>0))return;civCas(g,c,0.85,'zed',-1);g.alarm=1;g.hitT=G.t;Z.st.civ+=c;if(!K.dem)zedDead(g.x+(zr()-0.5)*g.r,g.y+(zr()-0.5)*g.r,c*0.85*0.6,vk,600+600*zr());
      if(c>=10&&(!g.zlT||G.t-g.zlT>3600)){g.zlT=G.t;zedLog(g.x,g.y,zedNm(h)+'闖入'+(g.n||placeTxt(g.x,g.y))+'，襲擊居民',6000);}});
    (G.civ.R||[]).forEach(function(R2){if(R2.st==='out'||R2.st==='camp'||!(R2.n>=1))return;if(dist(R2.x,R2.y,h.x,h.y)>hr+150)return;var c=Math.min(R2.n*0.1,eng*K.atk*4);if(!(c>0))return;if(typeof refCas==='function')refCas(R2,c,0.85,'zed',-1);else R2.n-=c;Z.st.civ+=c;if(!K.dem)zedDead(R2.x,R2.y,c*0.85*0.6,vk,600+600*zr());});});}
function zedBite(h,u,e){var K=ZK[h.k],s=ST(u),c=G.map.lc[cellAt(u.x,u.y)],cov=LC[c][4],ent=u.ent||0,Z=G.zed;
  var dm=e*K.atk*2*(0.45+0.55*cov)*(1-0.55*ent)*(1-0.85*s.hard)*(u.form==='square'?0.6:1)*(G.env.phase==='night'?1.15:1),dv=e*(K.veh||0)*2*(s.hard>=0.5?1:0.3);
  dm=Math.min(dm,u.men*0.25);dv=Math.min(dv,u.veh*0.25);if(!(dm>0)&&!(dv>0))return;hit(u,null,dm,dv,Math.min(40,6+400*dm/Math.max(10,u.men)),'zed');Z.st.lost[u.side]+=dm;
  var mopp=typeof cbMopp==='function'?cbMopp(u):0,bit=dm*K.inf*0.8*(1-0.6*ent)*(mopp>=3?0.6:1);if(bit>0){u.zi=Math.min(u.men*0.6,(u.zi||0)+bit);if(!u.ziT)u.ziT=G.t;u.zik=zedPar(h.k)?'p':'z';}
  u.mor=clamp(u.mor-Math.min(6,0.8+e/120)*(1-(u.trn||60)/250),0,100);u.zfT=G.t;u.uf=G.t;
  if(!u.zcT||G.t-u.zcT>1800){u.zcT=G.t;logE(u.side,'zed',uName(u)+'與'+zedNm(h)+'（約 '+fmt(h.n)+zedQ(h)+'）短兵相接',u.x,u.y,u.id);}
  if(typeof FX!=='undefined'&&FX.cap&&FX.ev.length<5000)FX.ev.push({k:'zbite',x0:h.x,y0:h.y,x1:u.x,y1:u.y,m:dm,zk:h.k,b:u});}
/* ---------- 射擊：部隊自動向射程內、看得到的屍群開火（依交戰規則；正在打敵軍的部隊分一半火力） ---------- */
function zedBk(){var B=new Map();G.zed.H.forEach(function(h){if(h.n<1)return;var k=Math.floor(h.x/4000)*65536+Math.floor(h.y/4000),L=B.get(k);if(!L)B.set(k,L=[]);L.push(h);});return B;}
function zedBkNear(B,x,y,R,fn){var x0=Math.floor((x-R)/4000),x1=Math.floor((x+R)/4000),y0=Math.floor((y-R)/4000),y1=Math.floor((y+R)/4000);for(var i=x0;i<=x1;i++)for(var j=y0;j<=y1;j++){var L=B.get(i*65536+j);if(L)for(var q=0;q<L.length;q++)fn(L[q]);}}
function zedFire(){var Z=G.zed;if(!Z.H.length)return;var B=zedBk();
  G.units.forEach(function(u){if(!onMap(u)||!isLeaf(u)||u.ms==='rout'||u.ammo<=0)return;var s=ST(u),heli=s.dom==='air'&&s.br==='heli'&&u.st==='air';if(s.dom!=='land'&&s.dom!=='sea'&&!heli)return;var SA=saOf(u,s),HA=haOf(u,s);if(SA<=0&&HA<=0)return;
    var op=optOf(u),roe=roeOf(u,op);if(roe==='hold')return;var rE=s.rE*rngF(u),rM=s.rM*rngF(u);if(heli){rE=Math.max(rE,800);rM=Math.max(rM,2500);}if(!(rM>0))return;if(u.mis&&G.t>=u.mis.start&&indOf(u,s)>0)return;
    var xp=s.fl.indexOf('x')>=0,vr=Math.min(zedVR(u)*1.2,rM+600),best=null,bv=0,bd=0;
    zedBkNear(B,u.x,u.y,Math.min(rM,vr)+600,function(h){if(h.n<1||(xp&&h.k!=='b'))return;var d=Math.max(0,dist(u.x,u.y,h.x,h.y)-zedR(h)*0.7);if(d>rM||d>vr)return;if(roe==='return'&&d>400&&!(u.zfT!==undefined&&G.t-u.zfT<=120))return;if(roe==='close'&&d>Math.max(150,rE*0.5))return;
      var v=rangeF(d,rE,rM)*(1+h.n/500)*(d<300?3:1)*(h.k==='b'&&HA>1?2:1);if(v>bv){bv=v;best=h;bd=d;}});
    if(best)zedShoot(u,s,best,bd,SA,HA,rE,rM);});}
function zedShoot(u,s,h,d,SA,HA,rE,rM){var K=ZK[h.k],rf=rangeF(d,rE,rM);if(!(rf>0))return;var dens=clamp(Math.sqrt(h.n/300),0.25,2.5),half=u.fired===G.t?0.5:1,mel=d<60?0.7:1;
  var k=strFrac(u)*rf*firerMod(u,s)*(DT/60*2)*FIRE_K*ZFK*half*mel*lgFire(u)*(0.75+0.5*zr())*(u.lg&&u.lg.eqF?(u.lg.eqF.acc||1):1),kill=(SA*K.sa+HA*(K.arm?penF(penE(u,s),K.arm)*3:0.15))*k*dens/K.hp;
  if(s.dom==='sea')kill*=0.5;kill=Math.min(kill,h.n);if(!(kill>0))return;zedKill(h,kill,u.side,u);u.ammo=Math.max(0,u.ammo-(s.fl.indexOf('x')>=0?12:s.dom==='sea'?0.1:0.5));u.fired=G.t;u.zfT=G.t;
  if(typeof FX!=='undefined'&&FX.cap&&FX.ev.length<5000){var a=zr()*2*PI,r=zedR(h)*0.6*Math.sqrt(zr());FX.ev.push({k:'fire',a:u,b:null,x0:u.x,y0:u.y,x1:h.x+Math.cos(a)*r,y1:h.y+Math.sin(a)*r,m:kill,zk:h.k});}}
function zedKill(h,n,side,src){var Z=G.zed;n=Math.min(n,h.n);if(!(n>0))return;h.n-=n;Z.st.kz+=n;if(side>=0&&side<nSides())Z.st.k[side]=(Z.st.k[side]||0)+n;if(src)src.zk=(src.zk||0)+n;if(ZK[h.k].burst)zedBurst(h,n);}
/* 孢子體被打死時爆開：附近的官兵（防護等級高的較少）被感染，附近的居民也會被感染、之後屍變 */
function zedBurst(h,n){var R=zedR(h)+250,f=ZK[h.k].burst;gridNear(h.x,h.y,R,function(u){if(!onMap(u)||!isLeaf(u)||ST(u).dom!=='land'||dist(u.x,u.y,h.x,h.y)>R)return;var mopp=typeof cbMopp==='function'?cbMopp(u):0,bit=Math.min(u.men*0.1,n*f*(mopp>=4?0.15:mopp>=2?0.5:1));if(bit>0.05){u.zi=Math.min(u.men*0.6,(u.zi||0)+bit);if(!u.ziT)u.ziT=G.t;u.zik='p';}});
  if(G.civ&&zedCfg().civ!==false)G.civ.S.forEach(function(g){if(dist(g.x,g.y,h.x,h.y)>g.r+R)return;var p=civPresent(g),c=Math.min(p*0.05,n*f*0.5);if(c>0.2){civCas(g,c,1,'zed',-1);G.zed.st.civ+=c;zedDead(g.x,g.y,c,'h',1200+1200*zr());}});
  if(typeof FX!=='undefined'&&FX.cap&&FX.ev.length<5000)FX.ev.push({k:'zspore',x1:h.x,y1:h.y,m:n,r:R});}
/* ---------- 砲兵：射擊落在屍群上（彈著散布與屍群的範圍重疊多少），也能摧毀巢穴 ---------- */
(function(){var b=artyFire;artyFire=function(u,s,M){b(u,s,M);if(!G.zed||!G.zed.go||u.lastArt!==G.t||!zedOn())return;zedArty(u,s,M);};})();
function zedArty(u,s,M){var L=typeof ARTL!=='undefined'&&ARTL&&ARTL.id===u.id&&ARTL.t===G.t?ARTL:null,x=L?L.x:M.x,y=L?L.y:M.y,Re=L?clamp(1.2*Math.sqrt(L.sr*L.sr+L.sd*L.sd+L.sw*L.sw/3),60,500):(M.r||300),SA=saOf(u,s),base=SA*strFrac(u)*firerMod(u,s)*DT/60*(M.mul||1);if(!(base>0))return;
  G.zed.H.forEach(function(h){if(h.n<1)return;var hr=zedR(h),d=dist(h.x,h.y,x,y);if(d>Re+hr+200)return;var A=Math.max(Re,hr),ov=Math.exp(-d*d/(Re*Re+hr*hr)),K=ZK[h.k],kill=base*ZAK*ov*h.n/(A*A)*(K.sa>0.5?1:0.6)/K.hp;kill=Math.min(kill,h.n*0.6);if(kill>0)zedKill(h,kill,u.side,u);});
  G.zed.N.forEach(function(N){if(N.hp<=0)return;var d=dist(N.x,N.y,x,y);if(d>Re+250)return;zedNestHit(N,base*1.6*Math.exp(-d*d/(2*Re*Re)),u.side,uName(u)+'的砲擊');});}
/* 火力支援找不到敵軍目標時，改打看得到、靠近友軍的屍群（太近的不打，避免誤擊）或已發現的巢穴 */
(function(){var b=supportTarget;supportTarget=function(u,s,o,IR){var t=b(u,s,o,IR);if(t||!G.zed||!G.zed.go||!zedOn())return t;return zedSupTgt(u,s,IR||indOf(u,s));};})();
function zedSupTgt(u,s,IR){var best=null,bv=0,side=u.side,tooNear=s.fl.indexOf('p')>=0?150:300;
  G.zed.H.forEach(function(h){if(h.n<40||G.t-h.sn[side]>240)return;if(dist(u.x,u.y,h.x,h.y)>IR*0.98)return;var hr=zedR(h),near=1e9;gridNearS(h.x,h.y,3100,side,function(q){if(!onMap(q)||!isLeaf(q))return;var dd=dist(q.x,q.y,h.x,h.y)-hr;if(dd<near)near=dd;});if(near<tooNear)return;
    var v=h.n/300*(near<3000?2/(1+near/800):0.3);if(v>bv){bv=v;best={x:h.x,y:h.y,id:0,zh:h.id,men:h.n};}});
  G.zed.N.forEach(function(N){if(N.hp<=0||!N.sn[side]||dist(u.x,u.y,N.x,N.y)>IR*0.98)return;if(bv<1.2){bv=1.2;best={x:N.x,y:N.y,id:0,zn:N.id,men:0};}});return bv>0.15?best:null;}
/* ---------- 轟炸、核武、野火 ---------- */
(function(){var b=carpetHit;carpetHit=function(side,src,cx,cy,ang,L,W,tons,o){var r=b.apply(this,arguments);if(G.zed&&G.zed.go&&zedOn())zedCarpet(side,cx,cy,ang,L,W,tons);return r;};})();
function zedCarpet(side,cx,cy,ang,L,W,tons){var fx=Math.cos(ang),fy=Math.sin(ang),rho=tons/Math.max(0.01,L*W/1e6);
  G.zed.H.forEach(function(h){if(h.n<1)return;var dx=h.x-cx,dy=h.y-cy,a=Math.abs(dx*fx+dy*fy),b=Math.abs(-dx*fy+dy*fx),hr=zedR(h);if(a>L/2+hr||b>W/2+hr)return;var inside=a<=L/2&&b<=W/2?1:0.4,f=1-Math.exp(-rho*30000e-6*inside);zedKill(h,h.n*f/ZK[h.k].hp*(h.k==='b'?0.5:1),side,null);});
  G.zed.N.forEach(function(N){if(N.hp<=0)return;var dx=N.x-cx,dy=N.y-cy,a=Math.abs(dx*fx+dy*fy),b=Math.abs(-dx*fy+dy*fx);if(a>L/2+100||b>W/2+100)return;zedNestHit(N,rho*3,side,'轟炸');});}
(function(){var b=nukeAt;nukeAt=function(side,x,y,Y,src){var r=b.apply(this,arguments);if(G.zed&&G.zed.go&&zedOn())zedNuke(side,x,y,Y);return r;};})();
function zedNuke(side,x,y,Y){var R=nukeR(Y),tot=0;G.zed.H.forEach(function(h){if(h.n<1)return;var d=dist(h.x,h.y,x,y);if(d>R[2]+zedR(h))return;var f=d<R[0]?1:d<R[1]?lerp(0.98,0.85,(d-R[0])/(R[1]-R[0])):d<R[2]?lerp(0.8,0.2,(d-R[1])/(R[2]-R[1])):0.1,k=Math.min(h.n,h.n*f);tot+=k;zedKill(h,k,side,null);});
  G.zed.N.forEach(function(N){if(N.hp>0&&dist(N.x,N.y,x,y)<R[1])zedNestHit(N,1e9,side,'核爆');});if(tot>=1)logE(-1,'zed','核爆消滅了約 '+fmt(tot)+' 隻（個）'+zedKN(zedCfg()),x,y);}
function zedBurn(){var F=G.evt&&G.evt.fire;if(!F)return;G.zed.H.forEach(function(h){if(h.n<1||F[cellAt(h.x,h.y)]!==1)return;var K=ZK[h.k];zedKill(h,h.n*0.08*K.fire/Math.max(1,K.hp/2),-1,null);});}
/* ---------- 巢穴：部隊在 400 公尺內就會攻擊它 ---------- */
function zedNests(){G.zed.N.forEach(function(N){if(N.hp<=0)return;gridNear(N.x,N.y,450,function(u){if(N.hp<=0||!onMap(u)||!isLeaf(u)||u.ms==='rout'||u.ammo<=0)return;var s=ST(u);if(s.dom!=='land'||dist(u.x,u.y,N.x,N.y)>400)return;var SA=saOf(u,s);if(SA<=0)return;
    zedNestHit(N,SA*strFrac(u)*firerMod(u,s)*DT/60*2*0.8,u.side,uName(u));u.zfT=G.t;u.fired=G.t;});});}
/* ---------- 咬傷與屍變：潛伏期（喪屍病毒約兩小時、寄生蟲約一小時）過半後開始屍變；醫療補給可救治（寄生蟲大多能治好，喪屍病毒只能截肢） ---------- */
function zedTurn(C){var Z=G.zed;G.units.forEach(function(u){if(!(u.zi>0))return;if(!alive(u)||!(u.men>0)){u.zi=0;u.ziT=0;return;}var par=u.zik==='p',inc=par?3600:7200,age=G.t-(u.ziT||G.t);
    var want=u.zi*0.4*(DT*2/600),got=want>0.001&&typeof medUse==='function'?medUse(u,want):0;
    if(got>0){var cur=Math.min(u.zi,got/0.4*(par?0.85:0.35));u.zi-=cur;Z.st.cure+=cur;if(!par){var w=Math.min(u.men*0.5,cur*0.7);if(w>0)hit(u,null,w,0,0,'zamp');}}
    if(u.zi<0.05){u.zi=0;u.ziT=0;return;}if(age<inc*0.5)return;var tr=Math.min(u.zi,u.zi*DT*2/inc+0.2,u.men);if(!(tr>0))return;u.zi-=tr;if(u.zi<0.05){u.zi=0;u.ziT=0;}
    hit(u,null,tr,0,25,'zturn');Z.st.turn[u.side]+=tr;u.mor=clamp(u.mor-Math.min(20,4+200*tr/Math.max(10,u.men)),0,100);u.zta=(u.zta||0)+tr;if(u.zta>=1){var jt=zr()*2*PI,nt=Math.floor(u.zta);u.zta-=nt;zedJoin(par?'h':'z',nt,u.x+Math.cos(jt)*40,u.y+Math.sin(jt)*40);}
    u.ztN=(u.ztN||0)+tr;if(!u.ztL||G.t-u.ztL>1800){u.ztL=G.t;logE(u.side,'zed',uName(u)+'有約 '+fmt(Math.max(1,u.ztN))+' 名被'+(par?'寄生':'咬傷')+'的官兵屍變！',u.x,u.y,u.id);u.ztN=0;if(G.onPause&&apOn('zed')&&G.t-(Z.apT||-1e9)>1800){Z.apT=G.t;G.onPause('部隊屍變');}}});}
/* 戰死者復生：每一步套用傷害時記下陣亡的位置與人數（核爆、野火與屍變本身除外），二十到五十分鐘後復生 */
(function(){var b=applyDamage;applyDamage=function(){var rs=null;if(G.zed&&G.zed.go&&zedOn()&&zedCfg().rise!==false&&zedCfg().k!=='eldritch'){rs=[];for(var id in G._inc){var I=G._inc[id],t=uById(+id);if(!t||!alive(t)||!(I.m>0.3)||ST(t).dom!=='land'||t.st==='air')continue;var kk=I.k||{},tot=0,ex=0;for(var q in kk){tot+=kk[q];if(q==='nuke'||q==='burn'||q==='zturn'||q==='zamp')ex+=kk[q];}var f=tot>0?1-ex/tot:1;if(f>0)rs.push([t.x,t.y,Math.min(t.men,I.m)*f]);}}
  b();if(rs&&rs.length){var vk=zedCfg().k==='parasite'?'h':'z';rs.forEach(function(r){zedDead(r[0],r[1],r[2]*0.3*0.85,vk,1200+1800*zr(),1);});}};})();
(function(){var b=civCas;civCas=function(g,c,kf,cause,bySide){b.apply(this,arguments);if(cause!=='zed'&&cause!=='nuke'&&cause!=='burn'&&c>0.3&&G.zed&&G.zed.go&&zedOn()&&zedCfg().rise!==false&&zedCfg().k!=='eldritch')zedDead(g.x+(zr()-0.5)*g.r,g.y+(zr()-0.5)*g.r,c*(kf===undefined?0.35:kf)*0.85,zedCfg().k==='parasite'?'h':'z',1800+1800*zr());};})();
/* 平民逃離時避開附近的屍群（大群、越近越要避開） */
(function(){var b=civDanger;civDanger=function(x,y){var r=b(x,y);if(!G.zed||!G.zed.go||!zedOn())return r;var n=0,sx=0,sy=0;G.zed.H.forEach(function(h){if(h.n<5)return;var d=dist(h.x,h.y,x,y);if(d>6000)return;var w=h.n/(1+d/500);sx+=h.x*w;sy+=h.y*w;n+=w;});if(!n)return r;var z=[sx/n,sy/n];return r?[(r[0]+z[0]*2)/3,(r[1]+z[1]*2)/3]:z;};})();
var zedRq=function(){};
/* 大量難民同時改道（設立難民營、屍群逼近）時：每一步最多重新規劃 4 條路線，其餘先直線前往、之後幾步再補上真正的路線（依數量而非電腦快慢，結果固定） */
(function(){var b=refDest;refDest=function(Q){if(!G.zed||!G.zed.go||!zedOn())return b(Q);var Z=G.zed;if(Z._rdS!==G.step){Z._rdS=G.step;Z._rdN=0;}if(Z._rdN<4){Z._rdN++;return b(Q);}
  var fp=findPath,x0=Q.x,y0=Q.y,stub=false;findPath=function(s,ax,ay,bx,by){stub=true;return {pts:[ax,ay,bx,by]};};try{b(Q);}finally{findPath=fp;}if(!stub)return;
  var RC=G._rpc,d=Q.dest;if(RC&&d){var ck=Math.round(x0/2000)+','+Math.round(y0/2000)+'>'+Math.round(d[0]/2000)+','+Math.round(d[1]/2000);if(RC[ck]){delete RC[ck];RC.n=Math.max(0,(RC.n||1)-1);}}var L=Z.rq||(Z.rq=[]);if(L.indexOf(Q.id)<0)L.push(Q.id);};
  zedRq=function(){var Z=G.zed;if(!Z||!Z.rq||!Z.rq.length||!G.civ)return;if(Z._rdS!==G.step){Z._rdS=G.step;Z._rdN=0;}while(Z.rq.length&&Z._rdN<4){var id=Z.rq.shift(),Q=null;for(var i=0;i<G.civ.R.length;i++)if(G.civ.R[i].id===id){Q=G.civ.R[i];break;}if(!Q||Q.st!=='go'||!(Q.n>=1))continue;Z._rdN++;b(Q);}};})();
/* ---------- 整理：移除被消滅的屍群，相鄰的同類屍群合併（每五分鐘），總數過多時把最小的併入最近的 ---------- */
function zedTidy(){var Z=G.zed,H=Z.H.filter(function(h){return h.n>=1;});
  if(G.step%10===0&&H.length>1){H.sort(function(a,b){return b.n-a.n||a.id-b.id;});for(var i=0;i<H.length;i++){var a=H[i];if(a.n<1)continue;var ra=zedR(a);for(var j=i+1;j<H.length;j++){var c=H[j];if(c.n<1||c.k!==a.k)continue;if(dist(a.x,a.y,c.x,c.y)<(ra+zedR(c))*0.5){a.n+=c.n;c.n=0;a.sn=[Math.max(a.sn[0],c.sn[0]),Math.max(a.sn[1],c.sn[1])];ra=zedR(a);}}}
    if(H.filter(function(h){return h.n>=1;}).length>300){var S=H.filter(function(h){return h.n>=1;}).sort(function(a,b){return a.n-b.n||a.id-b.id;});for(var m=0;m<S.length-300;m++){var q=S[m],bb=null,bd=1e18;for(var n2=m+1;n2<S.length;n2++){var o=S[n2];if(o.n<1||o.k!==q.k)continue;var dd=dist(o.x,o.y,q.x,q.y);if(dd<bd){bd=dd;bb=o;}}if(bb){bb.n+=q.n;q.n=0;}}}
    H=H.filter(function(h){return h.n>=1;});H.sort(function(a,b){return a.id-b.id;});}
  Z.H=H;}
/* ---------- 給畫面與報告用 ---------- */
function zedSeen(h,side){if(side===undefined||side<0)return true;return G.t-((h.sn||[])[side]||-1e9)<=150;}
function zedTot(){var Z=G.zed,n=0;if(Z&&Z.H)Z.H.forEach(function(h){n+=h.n;});return n;}
/* ---------- 線上對戰：屍群與巢穴依各方看得到的送出 ---------- */
if(typeof MPCOL!=='undefined'){MPCOL.push(['zH','id',function(s){var Z=G.zed;if(!Z||!Z.H||!zedOn())return [];return Z.H.filter(function(h){return h.n>=1&&(s<0||G.t-h.sn[s]<=90);}).map(function(h){var o={id:h.id,k:h.k,n:Math.round(h.n),x:Math.round(h.x),y:Math.round(h.y),st:h.st,hd:h.hd===undefined?0:Math.round(h.hd*10)/10};if(s<0)o.sn=h.sn;return o;});}],
  ['zN','id',function(s){var Z=G.zed;if(!Z||!Z.N||!zedOn())return [];return Z.N.filter(function(N){return s<0||N.sn[s];}).map(function(N){return {id:N.id,par:N.par,dem:N.dem||0,x:Math.round(N.x),y:Math.round(N.y),hp:Math.round(N.hp),hp0:N.hp0,nm:N.nm};});}]);
  MPKEY.zH='id';MPKEY.zN='id';MPCC.zH=function(){if(!G.zed)G.zed={H:[],N:[],D:[]};return G.zed.H||(G.zed.H=[]);};MPCC.zN=function(){if(!G.zed)G.zed={H:[],N:[],D:[]};return G.zed.N||(G.zed.N=[]);};}
if(typeof mpValList==='function'){(function(){var b=mpValList;mpValList=function(s){var V=b.apply(this,arguments);if(G.zed&&G.zed.st){V.push(['zed.st',G.zed.st]);V.push(['zed.go',G.zed.go||0]);}return V;};})();}
