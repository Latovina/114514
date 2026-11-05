/* ===================== 海上偵察、識別與誤認 =====================
   各時代的偵察方式不同：
   - 二戰以前幾乎只靠目視（桅頂瞭望、望遠鏡），夜間與壞天氣看不遠，也看不清艦型。
   - 二戰：目視、偵察機與水上偵察機（飛行員常常報錯艦型）、早期雷達（距離有限，時好時壞，近岸常有假回波；只看得到光點，分不出艦型）。
   - 冷戰以後：搜索雷達、電子偵察（截收對方雷達訊號，只知方位）、衛星、預警機與數據鏈，識別可靠得多。
   識別會出錯：距離越遠、夜間、天候差、觀測者訓練差，越容易把艦型認錯（戰艦認成大型巡洋艦、輕型航艦認成正規航艦、驅逐艦認成巡洋艦……），
   第一印象會持續，直到近距離交戰或看得更清楚才更正（「近距離交戰時才發現實際上是戰艦」）。
   夜間預期附近有友艦時，可能把敵艦當成友艦：不開火，還打出識別燈號，反而暴露自己（薩沃島附近的埃斯佩蘭斯角海戰，青葉號的例子）。
   謹慎的艦長會先以燈號（或敵我識別器）盤問，盤問期間不開火；1950 年以後的敵我識別器讓這種錯誤少得多。
   海軍指揮官依「識別到的」艦型判斷敵我兵力。 ===================== */
if(typeof GKEYS!=='undefined')GKEYS.push('nid');
/* ---------- 艦型類別與相似的外形 ---------- */
function nsCls(t){if(!t)return '';var k=(t.k||'').replace(/_1$/,'');if(t.dom==='sub')return 'ss';if(t.dom!=='sea'||t.br==='mon')return '';var fl=t.fl||'';if(fl.indexOf('C')>=0)return t.men<=1500?'cvl':'cv';if(fl.indexOf('i')>=0)return 'tr';
  if(/^(ml|msw|mcm)/.test(k))return 'mw';if(/^(pt|pb|gb)/.test(k))return 'pt';if(/^gal/.test(k))return 'gal';var y=(ERAI[t.era]||{}).y||1940;if(y<1860)return /^fg/.test(k)?'fg':/^gl/.test(k)?'gl':'sl';
  if(t.hard>=1&&t.men>=1000&&/戰鬥艦|戰列艦|無畏|鐵甲/.test(t.n))return 'bb';if(/重巡/.test(t.n))return 'ca';if(/輕巡/.test(t.n))return 'cl';if(/^(dd|ff|dg|dxt)/.test(k)||/驅逐|巡防/.test(t.n))return 'dd';return t.men>=1000?'ca':'dd';}
var NSCN={bb:'戰艦',ca:'重巡洋艦',cl:'輕巡洋艦',dd:'驅逐艦',cv:'航空母艦',cvl:'輕型航空母艦',tr:'運輸艦',ss:'潛艦',pt:'小艇',mw:'掃雷或布雷艦',sl:'戰列艦',fg:'巡航艦',gl:'蓋倫帆船',gal:'槳帆船'};
/* 容易認錯成什麼（權重） */
var NSCF={bb:[['ca',3],['cl',1]],ca:[['bb',2],['cl',2]],cl:[['dd',2],['ca',2]],dd:[['cl',2],['pt',0.6],['tr',0.4]],cv:[['cvl',1.5],['tr',0.3]],cvl:[['cv',3],['tr',0.5]],tr:[['cl',0.6],['dd',0.6],['cv',0.4]],
  sl:[['fg',1]],fg:[['sl',1]],gl:[['sl',0.5]],pt:[['dd',0.4]],mw:[['dd',0.8],['pt',0.6]]};
/* 每個年代、每個類別的代表類型 */
var NSCK=null;function nsKey(cls,era){if(!NSCK){NSCK={};Object.keys(UT).forEach(function(k){var t=UT[k];if(t.old)return;var c=nsCls(t);if(!c)return;var e=t.era;NSCK[e]=NSCK[e]||{};if(!NSCK[e][c]||(t.veh===1&&UT[NSCK[e][c]].veh!==1))NSCK[e][c]=k;});}
  if(NSCK[era]&&NSCK[era][cls])return NSCK[era][cls];var y=(ERAI[era]||{}).y||1940,best=null,bd=1e9;Object.keys(NSCK).forEach(function(e){if(!NSCK[e][cls])return;var d=Math.abs(((ERAI[e]||{}).y||0)-y);if(d<bd){bd=d;best=NSCK[e][cls];}});return best;}
function nsTKey(t){return t&&t.mix&&t.mix[0]?t.mix[0][0]:'';}
/* ---------- 各時代的感測 ---------- */
function nsYear(){return G.set.y||1943;}
/* 艦上雷達：1940 年起逐漸普及（依艦決定一次） */
function nsRadar(u){var y=nsYear(),s=ST(u);if(y<1940||s.dom!=='sea')return 0;if(u.rdr===undefined){var p=y<1942?0.3:y<1943?0.6:y<1946?0.9:1;u.rdr=(hstr('rdr|'+u.id+'|'+(G.set.seed||''))%100)/100<p?1:0;}if(!u.rdr)return 0;
  var big=s.men>=600?1.15:1;return (y<1943?14000:y<1946?22000:y<1970?35000:45000)*big;}
function nsRadarMiss(){var y=nsYear();return y<1943?0.35:y<1946?0.15:y<1970?0.06:0.02;}
function nsSnap(){var W=WX[G.env.wx]||WX[0];return {night:G.env.light<0.3,bad:(W[5]===undefined?1:W[5])<0.6};}
/* ---------- 識別 ---------- */
function nsErr(o,t,d,sens){var y=nsYear(),S=nsSnap(),os=o?ST(o):null,R=os?Math.max(4000,os.spot||15000):15000,e;
  if(sens==='radar')return 1;if(sens==='esm')return 0.5;if(sens==='sat')return y>=1990?0.08:0.2;
  e=0.06+0.45*Math.pow(clamp(d/R,0,1.5),2)+(S.night?0.25:0)+(S.bad?0.15:0)-((o&&o.trn!==undefined?o.trn:60)-60)/400+(os&&os.dom==='air'?0.15:0);
  if(y>=1960)e-=0.15;if(y>=1980)e-=0.1;return clamp(e,0.02,0.75);}
function nsWrong(cls){var L=NSCF[cls];if(!L)return cls;var tot=sum(L,function(q){return q[1];}),r=rnd()*tot;for(var i=0;i<L.length;i++){r-=L[i][1];if(r<=0)return L[i][0];}return L[0][0];}
function nsDB(side){if(!Array.isArray(G.nid))G.nid=[];while(G.nid.length<nSides())G.nid.push({});return G.nid[side];}
/* 對一份回報做識別；回傳識別結果 */
function nsIdent(side,o,t,d,sens){var D=nsDB(side),T=typeOf(nsTKey(t)),cls=nsCls(T);if(!cls)return null;var era=T.era,cur=D[t.id],err=nsErr(o,t,d,sens);
  if(sens==='radar'){if(cur&&cur.src!=='radar')return cur;var big=(ST(t).men||0)>=900;D[t.id]={pt:nsKey(big?'ca':'dd',era)||nsTKey(t),ok:false,err:1,src:'radar',t:G.t,blip:big?'大型':'小型'};return D[t.id];}
  if(cur&&!(err<cur.err*0.7)&&cur.src!=='radar'){cur.t=G.t;return cur;}
  var wrong=rnd()<err,pc=wrong?nsWrong(cls):cls,pt=pc===cls?nsTKey(t):(nsKey(pc,era)||nsTKey(t));
  var rec={pt:pt,ok:pt===nsTKey(t)||pc===cls,err:err,src:sens,t:G.t,by:o?o.id:0,prev:cur&&cur.pt&&!cur.ok&&cur.src!=='radar'?cur.pt:''};
  if(cur&&cur.src!=='radar'&&!cur.ok&&rec.ok){logE(side,'navy',(o?uName(o):'本方')+'看清楚了：先前識別為'+(UT[cur.pt]?UT[cur.pt].n:'？')+'的敵艦，實際上是'+T.n,t.x,t.y,o?o.id:0);}
  rec.ff=cur&&cur.ff;rec.chal=cur&&cur.chal;D[t.id]=rec;return rec;}
/* 近距離交戰時才發現 */
function nsReveal(side,o,t){var D=nsDB(side),c=D[t.id],T=typeOf(nsTKey(t));if(!c||c.ok)return;var was=UT[c.pt]?UT[c.pt].n:(c.blip?'雷達上的'+c.blip+'目標':'？');D[t.id]={pt:nsTKey(t),ok:true,err:0.02,src:'close',t:G.t};
  logE(side,'navy',uName(o)+'近距離交戰時才發現，對手實際上是'+T.n+'（先前以為是'+was+'）',t.x,t.y,o.id);}
/* ---------- 把敵艦當友艦、盤問與識別燈號 ---------- */
function nsSigName(y,night){return y<1860?(night?'信號燈籠':'私密旗號'):y<1950?(night?'識別燈號':'識別旗號'):'敵我識別器';}
function nsFriendNear(side,t){return G.units.some(function(q){return q.side===side&&isLeaf(q)&&onMap(q)&&ST(q).dom==='sea'&&dist(q.x,q.y,t.x,t.y)<30000&&dist(q.x,q.y,t.x,t.y)>3000;})||(G.lgv||[]).some(function(V){return V.side===side&&LGM[V.m]&&LGM[V.m].dom==='sea';});}
function nsFoF(side,o,t,d){var y=nsYear(),S=nsSnap(),D=nsDB(side),c=D[t.id];if(!o||ST(o).dom!=='sea'||c&&(c.fft||c.chalT))return;if(!(S.night||S.bad)||!nsFriendNear(side,t))return;
  var trn=o.trn!==undefined?o.trn:60,era=y<1945?1:y<1960?0.35:0.05,p=0.18*era*(1-(trn-50)/120)*(d>2000?1:0.5);c=c||(D[t.id]={pt:nsTKey(t),ok:true,err:0.3,src:'visual',t:G.t});
  if(rnd()<p){/* 誤認為友艦：不開火，打出識別燈號 */c.ff=G.t+300+rnd()*300;c.fft=1;c.ffBy=o.id;var sig=nsSigName(y,S.night);
    logE(side,'navy',uName(o)+'把'+placeTxt(t.x,t.y)+'的敵艦誤認為友艦，打出'+sig+'表明身分——反而暴露了自己',o.x,o.y,o.id);
    G.rq[t.side].push({at:G.t+20,id:o.id,x:o.x,y:o.y,t:G.t,q:1,by:t.id,sens:'visual'});o.ffExp=G.t+600;logE(t.side,'navy',uName(t)+'看到敵艦打出'+sig+'，確認了它的位置',o.x,o.y,t.id);return;}
  /* 謹慎的艦長：先盤問，盤問期間不開火 */
  if(trn>=55&&rnd()<0.6*era){var dl=y>=1950?10:y<1860?180:90;c.chal=G.t+dl;c.chalT=1;if(y<1950)G.rq[t.side].push({at:G.t+20,id:o.id,x:o.x,y:o.y,t:G.t,q:0.5,by:t.id,sens:'visual'});
    logE(side,'navy',uName(o)+'以'+nsSigName(y,S.night)+'盤問不明艦艇，約 '+durTxt(dl)+'後確認是敵艦'+(y<1950?'（燈光也讓對方看見了自己）':''),o.x,o.y,o.id);}}
/* 認為是友艦或盤問中：不開火；對方先開火就醒悟 */
(function(){var b=ctrMul;ctrMul=function(a,t,kind,d){var m=b.apply(this,arguments);if(!G.nid||!G.nid[a.side])return m;var c=G.nid[a.side][t.id];if(!c)return m;if(c.ff&&G.t<c.ff||c.chal&&G.t<c.chal)return 0;return m;};})();
(function(){var b=hit;hit=function(t,src,dm,dv,sup,kind){b.apply(this,arguments);if(!src||!G.nid||!G.nid[t.side])return;var c=G.nid[t.side][src.id];if(c&&c.ff&&G.t<c.ff){c.ff=0;t.mor=clamp((t.mor||60)-6,0,100);logE(t.side,'navy',uName(t)+'遭到「友艦」射擊，這才發現對方是敵艦',t.x,t.y,t.id);}};})();
/* ---------- 回報進入敵情圖時：識別、誤認與友艦誤判 ---------- */
(function(){var b=reportStep;reportStep=function(){var due=[];for(var s=0;s<nSides();s++){var Q=G.rq[s];for(var i=0;i<Q.length;i++){var r=Q[i];if(r.at<=G.t&&!r.civ)due.push([s,r]);}}b();
  due.forEach(function(q){var s=q[0],r=q[1],t=uById(r.id);if(!t||!isLeaf(t))return;var ts=ST(t);if(ts.dom!=='sea'&&ts.dom!=='sub')return;var C=G.ct[s],c=C&&C[r.id];if(!c)return;var o=r.by?uById(r.by):null,sens=r.sens||(o&&ST(o).dom==='air'?'air':'visual'),d=o?dist(o.x,o.y,t.x,t.y):20000;
    if(ts.dom==='sea'&&o&&sens==='visual')nsFoF(s,o,t,d);var D=nsDB(s),ff=D[t.id]&&D[t.id].ff&&G.t<D[t.id].ff;if(ff){delete C[r.id];return;}
    var R=nsIdent(s,o,t,d,sens==='air'?'visual':sens);if(!R)return;c.pt=R.pt;c.pv=1;c.idSrc=R.src;var nT=UT[R.pt];c.idn=R.src==='radar'?'雷達接觸：'+R.blip+'水面目標':R.src==='esm'?'電子偵察：方位與雷達訊號':(nT?nT.n:'艦艇')+(R.err>0.25?'？':'');if(!(c.q>=1))c.name='敵'+c.idn;});};})();
/* 艦艇回報給旗艦：依時代的通訊方式 */
(function(){var b=reportDelay;reportDelay=function(o){if(typeof ncCtlLeaf==='function'&&ncCtlLeaf(o)&&G.set.navCmd!==false){var F=ncFlag(o.side);return F&&F!==o?ncSig(o.side,o,F).sec:30;}return b(o);};})();
/* ---------- 雷達、電子偵察、衛星與近距離確認（約每 4 分鐘） ---------- */
function nsSense(){var y=nsYear();if(y<1940)return nsClose();var miss=nsRadarMiss();
  G.units.forEach(function(o){if(!isLeaf(o)||!onMap(o))return;var R=nsRadar(o);if(!R)return;gridNear(o.x,o.y,R,function(t){if(t.side===o.side||!onMap(t)||!isLeaf(t)||!hostile(o.side,t.side))return;var ts=ST(t);if(ts.dom!=='sea')return;var d=dist(o.x,o.y,t.x,t.y);if(d>R*(0.6+0.4*Math.min(1.5,ts.sig||1)))return;if(rnd()<miss)return;
      G.rq[o.side].push({at:G.t+(y>=1975?20:90),id:t.id,x:t.x+(rnd()-0.5)*300,y:t.y+(rnd()-0.5)*300,t:G.t,q:0.5,by:o.id,sens:'radar'});});
    /* 早期雷達近岸的假回波 */if(y<1956&&rnd()<0.012&&typeof mnCoast==='function'&&mnCoast(o.x,o.y,R*0.6)){var a=rnd()*2*PI,dd=R*(0.4+0.5*rnd()),C=G.ct[o.side];G.ghostSeq=(G.ghostSeq||0)+1;var gid=9e8+G.ghostSeq;
      C[gid]={id:gid,x:o.x+Math.cos(a)*dd,y:o.y+Math.sin(a)*dd,t:G.t,q:0.5,side:enemyOf(o.side),ech:1,dom:'sea',br:'nav',sym:'nav',men:0,veh:1,name:'敵雷達接觸：不明水面目標',idn:'雷達接觸：不明水面目標',ghost:G.t+1800,pt:nsKey('dd',uEra(o).k),pv:1};}});
  /* 清除過期的假回波 */SIDES().forEach(function(s){var C=G.ct[s];for(var id in C){if(+id>=9e8&&C[id].ghost&&G.t>C[id].ghost)delete C[id];}});
  /* 電子偵察：截收對方開著的雷達，只知方位與大概距離 */
  if(y>=1960)G.units.forEach(function(e){if(!isLeaf(e)||!onMap(e))return;var R=nsRadar(e);if(!R||nsEmcon(e))return;gridNear(e.x,e.y,R*1.6,function(o){if(o.side===e.side||!onMap(o)||!isLeaf(o)||!hostile(o.side,e.side)||ST(o).dom!=='sea'||!nsRadar(o))return;var d=dist(o.x,o.y,e.x,e.y),er=d*0.12;
      G.rq[o.side].push({at:G.t+60,id:e.id,x:e.x+(rnd()-0.5)*er,y:e.y+(rnd()-0.5)*er,t:G.t,q:0.3,by:o.id,sens:'esm'});});});
  /* 衛星：約每 90 分鐘過頂一次，回報大型水面艦（延遲半小時到一小時） */
  if(y>=1975)SIDES().forEach(function(s){var S=SD(s);if(G.t<(S.satT||0))return;S.satT=G.t+5400;G.units.forEach(function(t){if(!isLeaf(t)||!onMap(t)||!hostile(s,t.side)||ST(t).dom!=='sea'||ST(t).men<150)return;G.rq[s].push({at:G.t+1800+rnd()*1800,id:t.id,x:t.x+(rnd()-0.5)*1500,y:t.y+(rnd()-0.5)*1500,t:G.t,q:0.5,by:0,sens:'sat'});});});
  nsClose();}
/* 電磁靜默：飛彈齊射型或夜襲型的海軍指揮官在接敵前關閉雷達 */
function nsEmcon(u){var C=SD(u.side).ncmd;if(!C)return false;return (C.t==='msl'||C.t==='raid')&&C.post!=='engage';}
/* 近距離（白天 4 公里、夜間 2 公里）或交火時看清楚 */
function nsClose(){if(!G.nid)return;G.units.forEach(function(o){if(!isLeaf(o)||!onMap(o)||ST(o).dom!=='sea')return;var D=G.nid[o.side];if(!D)return;var R=nsSnap().night?2000:4000;gridNear(o.x,o.y,R,function(t){if(t.side===o.side||!isLeaf(t)||!D[t.id])return;var c=D[t.id];if(c.ok&&!c.ff)return;
    if(c.ff&&G.t<c.ff&&dist(o.x,o.y,t.x,t.y)>1200)return;if(c.ff){c.ff=0;logE(o.side,'navy',uName(o)+'接近後發現「友艦」其實是敵艦',t.x,t.y,o.id);}nsReveal(o.side,o,t);});});}
(function(){var b=v8Step;v8Step=function(){b();if(!G.started)return;try{if(G.step%8===3)nsSense();}catch(e){if(typeof console!=='undefined')console.warn('海上偵察',e);}};})();
/* 各時代的偵察手段（說明與面板用） */
function nsMeans(y){return y<1905?'目視（桅頂瞭望與望遠鏡）、派出巡航艦與通報艦搜索；夜間只能靠月光與燈光':y<1940?'目視與測距儀、巡洋艦與驅逐艦組成的偵察線、少量水上飛機；無線電測向':y<1946?'目視、偵察機與水上偵察機（艦型常報錯）、早期雷達（距離有限、時好時壞、近岸有假回波）':y<1970?'搜索雷達、偵察機與反潛巡邏機、聲納；敵我識別器':'搜索雷達、電子偵察（截收對方雷達）、衛星、預警機、數據鏈與敵我識別器';}
