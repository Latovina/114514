/* ===================== 戰場籌措：就地採集作物與草料、取水、打獵捕魚、向居民購買或徵用、劫掠、搜刮廢墟與戰場；飲水與口渴 =====================
   飲水：每人每天約 4 公升（炎熱、行軍與交戰時更多），馬匹每匹約 30 公升；部隊攜帶約兩天的水（水壺、水袋與水車）。
   在補給範圍內、或停留在河川、湖泊、溪流與村落水井附近時自動補水，下雨時也能接水；脫離補給又遠離水源時，水喝完就開始口渴：
   士氣、戰力與速度下降，嚴重時有人中暑或脫水倒下。就地取用未經處理的水可能帶來痢疾，淨水設備可以減少（h44_eqfx.js）。
   「籌措物資」命令（forage）：自動、採集作物與草料、取水、打獵捕魚、向居民購買、徵用（開收據）、劫掠、搜刮廢墟與戰場。
   作物屬於附近的居民：收割會減少他們的存糧與對本方的好感；購買要付錢，徵用開收據（守法的部隊日後賠償），劫掠是戰爭罪行，
   守法而軍紀良好的部隊會拒絕，附近的憲兵會制止。搜刮可能誤觸未爆彈與詭雷，屍體附近有疾病風險。
   脫離補給、存糧或飲水不足的閒置部隊可以自動就地籌措（設定；AI 部隊一律自動），完成後回到原任務或原位置。 ===================== */
if(typeof ORDN!=='undefined')ORDN.forage='籌措物資';
if(typeof KINDN!=='undefined')KINDN.uxo='未爆彈與詭雷';
if(typeof CIVK!=='undefined')CIVK.loot='劫掠時的暴力';
if(typeof PLDN!=='undefined'&&PLDN.source.indexOf('forage')<0)PLDN=new RegExp(PLDN.source.replace(')$','|forage)$'));
var FGK={auto:['自動','缺水先取水；其次依季節與地形採集作物、打獵捕魚或搜刮廢墟；附近有聚落時依平民政策購買或徵用（不會劫掠）'],
  crop:['採集作物與草料','收割農田、果園與菜園，在森林與灌叢採集野果，替馬匹割草；農作物屬於附近的居民，會減少他們的存糧'],
  water:['取水','到河川、湖泊、溪流或村落水井裝滿水壺與水車；未經處理的水可能帶來痢疾，淨水設備可以減少'],
  hunt:['打獵捕魚','在森林、灌叢、草原與沼澤打獵，在河湖捕魚；獵物有限，打完要換地方，槍聲會暴露位置'],
  buy:['向居民購買','付錢向聚落購買多餘的存糧、燃料與草料；敵視本方的聚落不願交易'],
  req:['徵用（開收據）','強制徵用聚落的存糧、燃料與草料並開立收據；居民存糧減少、對本方的好感下降'],
  loot:['劫掠','搶奪居民的糧食、燃料、草料與財物：戰爭罪行，居民強烈敵視、可能發生暴力，軍紀下降；守法的部隊可能拒絕，憲兵會制止'],
  scav:['搜刮廢墟與戰場','在廢墟、被毀的補給站與陣亡部隊的位置搜尋口糧、燃料與彈藥；可能誤觸未爆彈與詭雷，屍體附近有疾病風險']};
var FGKL=['auto','crop','water','hunt','buy','req','loot','scav'];
/* ---------- 狀態：已採收的作物與草料（每格）、獵物與漁獲（每平方公里）、搜過的廢墟、被毀補給站的殘骸、統計、亂數 ---------- */
function fgS(){var X=G.fg;if(!X)X=G.fg={};if(!X.H){X.H={};X.F={};X.Gm={};X.P={};X.V={};X.R=X.R||[];X.st=X.st||sAO();X.rs=X.rs||(hstr((G.set.seed||'')+'|fg')|0)||1;}return X;}
function fgr(){var X=fgS(),s=X.rs|0||1;s^=s<<13;s^=s>>>17;s^=s<<5;X.rs=s|0;return ((s>>>0)%1000003)/1000003;}
function fgStat(side,k,v){if(!(side>=0&&side<nSides())||!(v>0))return;var S0=fgS().st,s=S0[side]||(S0[side]={});s[k]=(s[k]||0)+v;}
function fgThirstOn(){return !G||!G.set||G.set.thirst!==false;}
function fgAutoOn(){return !G||!G.set||G.set.autoForage!==false;}
function fgSeason(){return seasonOf(now().m,G.map.lat0||35);}
function fgHa(){var cs=G.map.cs;return cs*cs/1e4;}
/* ---------- 飲水 ---------- */
function fgPerMan(u){var R=rationOf(u);return R&&R.water>0?R.water:4;}
function fgHeat(){var T=G.env&&isFinite(G.env.T)?G.env.T:15;return T>=38?2.2:T>=32?1.7:T>=26?1.3:T<=-10?1.1:1;}
function fgWNeed(u){var L=u.lg;return Math.max(0,u.men)*fgPerMan(u)+(L&&L.h>0?L.h*30:0);}
function fgWCap(u){return Math.max(1,fgWNeed(u)*2);}
function fgWUnit(u){return isLeaf(u)&&ST(u).dom==='land'&&u.men>=1;}
function fgWInit(u){var L=u.lg;if(!L)return null;if(!(L.wat>=0)){L.wat=fgWCap(u);L.thi=0;}return L;}
/* 水源格網（每 500 公尺）：河川、湖泊與大河 1，溪流 0.8（乾燥地區常乾涸，0.3），沼澤 0.5（水質差），雪原 0.3（要融雪），聚落的水井 0.9；海水不能喝 */
var FGW={m:null};
function fgWGrid(){var MP=G.map,ar=aridMap();if(FGW.m===MP&&FGW.ar===ar)return FGW;var B=500,W=Math.max(1,Math.ceil(MP.Wm/B)),H=Math.max(1,Math.ceil(MP.Hm/B)),q=new Float32Array(W*H),L=LCI,n=MP.lc.length;
  for(var k=0;k<n;k++){var c=MP.lc[k],rv=MP.rv?MP.rv[k]:0,v=0;if(c===L.lake||c===L.riv||rv>=2)v=1;else if(rv>=1)v=ar?0.3:0.8;else if(c===L.marsh)v=0.5;else if(c===L.snow)v=0.3;if(!v)continue;
    var X=Math.min(W-1,Math.floor((k%MP.GW+0.5)*MP.cs/B)),Y=Math.min(H-1,Math.floor(((k/MP.GW|0)+0.5)*MP.cs/B)),i=Y*W+X;if(v>q[i])q[i]=v;}
  (MP.set||[]).forEach(function(s){var X=Math.floor(s.x*MP.cs/B),Y=Math.floor(s.y*MP.cs/B);if(X<0||Y<0||X>=W||Y>=H)return;var i=Y*W+X;if(q[i]<0.9)q[i]=0.9;});
  FGW={m:MP,ar:ar,B:B,W:W,H:H,q:q};return FGW;}
function fgWaterNear(x,y,R){var F=fgWGrid(),B=F.B,r=Math.ceil(R/B),bx=Math.floor(x/B),by=Math.floor(y/B),best=null;
  for(var j=-r;j<=r;j++)for(var i=-r;i<=r;i++){var X=bx+i,Y=by+j;if(X<0||Y<0||X>=F.W||Y>=F.H)continue;var v=F.q[Y*F.W+X];if(!v)continue;var cx=(X+0.5)*B,cy=(Y+0.5)*B,d=dist(x,y,cx,cy);if(d>R+B*0.7)continue;
    var sc=v-d/(R+B)*0.3;if(!best||sc>best.sc)best={q:v,x:cx,y:cy,d:d,sc:sc};}
  return best;}
/* 未經處理的水：每喝掉一天份，依年代與水質擲一次痢疾（淨水設備在 sickAdd 減半） */
function fgDzBase(u){var E=uEra(u),y=E.y;if(E.fan)return 0.2;return y<1880?0.25:y<1914?0.15:y<1945?0.08:y<1970?0.04:0.02;}
function fgDrink(u,L,got,q){L.wdr=(L.wdr||0)+got;var day=Math.max(1,u.men*fgPerMan(u));while(L.wdr>=day){L.wdr-=day;if(fgr()<fgDzBase(u)*(q<0.6?2:1)){var n=u.men*(0.005+0.015*fgr());sickAdd(u,n,'dys');logE(u.side,'supply',uName(u)+'飲用未經處理的水，約 '+fmt(Math.max(1,n))+' 人腹瀉（痢疾）',u.x,u.y,u.id);}}}
/* 每次後勤結算（10 分鐘）：喝水、就地補水、口渴的影響 */
function fgWater(u,L,dt){if(!fgThirstOn()||!L||!fgWUnit(u))return;fgWInit(u);var day=dt/86400,cap=fgWCap(u),th0=L.thi||0;if(L.wat>cap*1.2)L.wat=cap*1.2;
  if(!onMap(u)){L.wat=cap;L.thi=Math.max(0,th0-100*day);return;}
  var heat=fgHeat(),act=G.t-(u.movedAt||-1e9)<1200||G.t-(u.fired||-1e9)<1200?1.25:1;L.wat=Math.max(0,L.wat-fgWNeed(u)*heat*act*day);
  if(L.wat<cap&&!u.insup&&G.t-(u.fired||-1e9)>600){var W=fgWaterNear(u.x,u.y,1200);if(W){var got=Math.min(cap-L.wat,cap*0.5*W.q*dt/3600);if(got>0){L.wat+=got;fgDrink(u,L,got,W.q);}}}
  var wx=WX[G.env.wx]||WX[0];if(L.wat<cap&&wx[3]>0)L.wat=Math.min(cap,L.wat+u.men*0.4*wx[3]*dt/3600);
  var th=th0;if(L.wat<=0)th+=45*heat*act*day;else if(L.wat<cap*0.15)th+=6*day;else th-=100*day;th=clamp(th,0,100);L.thi=th;
  if(th>=20&&th0<20)logE(u.side,'supply',uName(u)+'的飲水喝完，開始口渴'+(u.insup?'':'（脫離補給，附近沒有水源）'),u.x,u.y,u.id);
  if(th>=60&&th0<60)logE(u.side,'supply',uName(u)+'嚴重缺水：士氣與戰力大幅下降，開始有人中暑或脫水倒下',u.x,u.y,u.id);
  if(th>30)u.mor=clamp(u.mor-(th-30)/70*10*day,0,100);if(th>70)sickAdd(u,u.men*0.04*(th-70)/30*day,'heat');}
(function(){var b=consume;consume=function(u,L,dt){var r=b.apply(this,arguments);try{fgWater(u,L,dt);}catch(e){}return r;};})();
(function(){var b=resupply;resupply=function(u,L,src,dt){var r=b.apply(this,arguments);try{if(fgThirstOn()&&L&&fgWUnit(u)){fgWInit(u);var cap=fgWCap(u),busy=G.t-(u.fired||-1e9)<300;L.wat=Math.min(cap,L.wat+cap*(busy?0.3:1)*dt/3600*2);}}catch(e){}return r;};})();
(function(){var b=lgFire;lgFire=function(u){var f=b(u),L=u.lg;if(L&&L.thi>30)f*=1-(L.thi-30)/70*0.45;return f;};})();
(function(){var b=lgSpeed;lgSpeed=function(u){var f=b(u),L=u.lg;if(L&&L.thi>40)f*=L.thi>60?0.7:0.85;return f;};})();
/* ---------- 地表可取得的食物、草料與獵物 ---------- */
function fgIsCrop(c){var L=LCI;return c===L.field||c===L.hedge||c===L.orch||c===L.vill||c===L.sub;}
/* 每公頃可採收的作物（公斤）：秋收最多，冬季幾乎沒有 */
function fgCropKg(c,se){var L=LCI,S={sp:0.15,su:0.7,au:1,wi:0.05}[se]||0.5;if(c===L.field)return 1200*S;if(c===L.hedge)return 900*S;if(c===L.orch)return 900*(se==='au'?1:se==='su'?0.8:0.05);if(c===L.vill||c===L.sub)return 300*(se==='wi'?0.2:S+0.2);return 0;}
/* 每公頃的野果、堅果、菇類與野菜 */
function fgWildKg(c,se){var L=LCI,S={sp:0.5,su:1,au:1.4,wi:0.2}[se]||1;if(c===L.dfor)return 25*S;if(c===L.cfor)return 15*S;if(c===L.jung)return 30;if(c===L.scrub)return 10*S;if(c===L.tund)return 6*S;if(c===L.marsh)return 8*S;if(c===L.mead||c===L.park)return 5*S;return 0;}
/* 每公頃可割的草料 */
function fgFodKg(c,se){var L=LCI,S={sp:0.6,su:1,au:0.8,wi:0.1}[se]||0.6;if(c===L.mead)return 3000*S;if(c===L.field||c===L.hedge)return 1500*S;if(c===L.park)return 800*S;if(c===L.scrub||c===L.tund)return 600*S;return 0;}
/* 獵物密度（森林 1） */
function fgGameD(c){var L=LCI;return c===L.dfor?1:c===L.cfor||c===L.jung?0.8:c===L.scrub||c===L.tund||c===L.marsh?0.6:c===L.mead?0.4:c===L.field||c===L.hedge||c===L.orch?0.25:c===L.rock?0.15:c===L.desert||c===L.snow?0.05:0;}
function fgCellFood(k,se){var c=G.map.lc[k];return Math.max(0,(fgCropKg(c,se)+fgWildKg(c,se))*fgHa()-(fgS().H[k]||0));}
function fgCellFod(k,se){var c=G.map.lc[k];return Math.max(0,fgFodKg(c,se)*fgHa()-(fgS().F[k]||0));}
var FGB=1000;
function fgBK(x,y){return Math.floor(x/FGB)+'|'+Math.floor(y/FGB);}
/* 每平方公里約 120 公斤可獵取的肉（依地表密度），河湖約 150 公斤漁獲 */
function fgBlockGame(bk){var p=bk.split('|'),bx=+p[0],by=+p[1],MP=G.map,s=0,n=0;for(var j=0;j<3;j++)for(var i=0;i<3;i++){var x=(bx+(i+0.5)/3)*FGB,y=(by+(j+0.5)/3)*FGB;if(x<0||y<0||x>=MP.Wm||y>=MP.Hm)continue;s+=fgGameD(MP.lc[cellAt(x,y)]);n++;}return n?120*s/n:0;}
function fgBlockFish(bk){var p=bk.split('|'),W=fgWaterNear((+p[0]+0.5)*FGB,(+p[1]+0.5)*FGB,FGB*0.6);return W&&W.q>=0.8?150*W.q:0;}
function fgGameLeft(bk){return Math.max(0,fgBlockGame(bk)-(fgS().Gm[bk]||0));}
function fgFishLeft(bk){return Math.max(0,fgBlockFish(bk)-(fgS().P[bk]||0));}
/* ---------- 聚落：存糧（折合居民的天數）、燃料與草料 ---------- */
function fgSetNear(x,y,R){if(!G.civ)return null;var b=null,bd=1e18;G.civ.S.forEach(function(g){var d=dist(g.x,g.y,x,y)-g.r;if(d<R&&d<bd){bd=d;b=g;}});return b;}
function fgSetP(g){return Math.max(civPresent(g),(g.pop0||0)*0.3,1);}
function fgSetKg(g,keep){return Math.max(0,(g.food||0)-(keep||0))*fgSetP(g)*0.6;}
function fgSetTake(g,kg){var d=kg/(fgSetP(g)*0.6);g.food=Math.max(0,(g.food||0)-d);return d;}
function fgSetFuel(g){if(g.fgFu===undefined){var y=G.set.y||1943;g.fgFu=y<1920?0:(g.pop0||0)*(y<1950?5:y<1980?15:30)*(g.kind==='city'?1.5:1);g.fgFu0=g.fgFu;}return Math.max(0,g.fgFu);}
function fgSetFod(g){if(g.fgFo===undefined){var y=G.set.y||1943;g.fgFo=(g.pop0||0)*(y<1950?25:8)*(g.kind==='village'?2:g.kind==='city'?0.3:1);g.fgFo0=g.fgFo;}return Math.max(0,g.fgFo);}
/* 就地採購的單價（美元／公斤）：軍糧的一半 */
function fgPrice(){return costP().food*0.5;}
/* ---------- 廢墟、被毀的補給站與戰場 ---------- */
function fgRuin(c){return c===LCI.rubble||c===LCI.burnt;}
function fgRuinLeft(k){return Math.max(0,1-(fgS().V[k]||0));}
/* 陣亡或被殲滅部隊留在原地的物資（公斤）：口糧一半、燃料三成、彈藥一半 */
function fgDeadPool(du){var L=du.lg;if(!L)return {food:0,fuel:0,ammo:0};var f=Math.max(0,1-(du.fgS||0));return {food:(L.food||0)*0.5*f,fuel:(L.fuel||0)*0.3*f,ammo:(du.ammo||0)/100*(L.uof||0)*(L.basic||1)*0.5*f};}
function fgRemTot(Q){return (Q.food||0)+(Q.fuel||0)+(Q.ammo||0)+(Q.fod||0);}
function fgScavSrc(u,x,y,R){var MP=G.map,X=fgS(),best=null,bd=1e18;
  G.units.forEach(function(du){if(du.st!=='dead'||!du.lg||!isLeaf(du)||(du.fgS||0)>=0.95||G.t-(du.deadT||0)>30*86400)return;var d=dist(du.x,du.y,x,y);if(d>R||d>=bd)return;var P=fgDeadPool(du);if(P.food+P.fuel+P.ammo<20)return;bd=d;best={x:du.x,y:du.y,du:du.id};});
  X.R.forEach(function(Q,i){if(fgRemTot(Q)<0.02)return;var d=dist(Q.x,Q.y,x,y);if(d>R||d>=bd)return;bd=d;best={x:Q.x,y:Q.y,ri:i};});
  if(best)return best;var bk=-1,bv=0;brushCells(MP,x/MP.cs,y/MP.cs,Math.ceil(R/MP.cs),function(k){if(!fgRuin(MP.lc[k]))return;var v=fgRuinLeft(k);if(v<=0.05)return;var p=cellXY(k),d=dist(p[0],p[1],x,y);if(d>R)return;v-=d/R*0.3;if(v>bv){bv=v;bk=k;}});
  if(bk<0)return null;var p=cellXY(bk);return {x:p[0],y:p[1],k:bk};}
/* 補給站被摧毀時，殘骸裡還留下一部分物資（大火燒毀的幾乎不剩） */
(function(){if(typeof nodeDestroy!=='function')return;var b=nodeDestroy;nodeDestroy=function(N,side,cause,src){var st=N&&!N.dead&&N.st?{food:N.st.food||0,fuel:N.st.fuel||0,ammo:N.st.ammo||0,fod:N.st.fod||0}:null,r=b.apply(this,arguments);
  try{if(st&&G.started&&fgRemTot(st)>0.5){var f=cause==='fire'?0.05:0.15;fgS().R.push({x:N.x,y:N.y,food:st.food*f,fuel:st.fuel*f*0.7,ammo:st.ammo*f,fod:st.fod*f,side:N.side,t:G.t,n:N.name||''});}}catch(e){}return r;};})();
/* ---------- 選擇籌措地點 ---------- */
function fgRoom(u,od){var L=u.lg||logInit(u),fr=u.men0>0?u.men/u.men0:1,o={food:Math.max(0,L.foodCap*(od&&od.auto?1:1.5)*fr-L.food),fod:Math.max(0,(L.fodCap||0)-(L.fod||0)),fuel:Math.max(0,(L.fuelCap||0)*1.1-(L.fuel||0)),ammo:Math.max(0,100-(u.ammo||0)),wat:0};
  if(fgThirstOn()&&fgWUnit(u)){fgWInit(u);o.wat=Math.max(0,fgWCap(u)-L.wat);}return o;}
function fgPick(u,m,x,y){var MP=G.map,se=fgSeason(),R=m==='water'||m==='hunt'?3000:1500;
  if(m==='water'){var W=fgWaterNear(x,y,R);return W?{m:m,x:W.x,y:W.y,q:W.q}:null;}
  if(m==='crop'){var best=-1,bv=0,horse=!!(u.lg&&u.lg.fodDay>0&&u.lg.h>0);brushCells(MP,x/MP.cs,y/MP.cs,Math.ceil(R/MP.cs),function(k){var v=fgCellFood(k,se)+(horse?fgCellFod(k,se)*0.05:0);if(v<=bv)return;var p=cellXY(k);if(dist(p[0],p[1],x,y)>R)return;bv=v;best=k;});
    if(best<0||bv<20)return null;var p=cellXY(best);return {m:m,x:p[0],y:p[1],k:best};}
  if(m==='hunt'){var bb=null,bs=0;for(var j=-3;j<=3;j++)for(var i=-3;i<=3;i++){var cx=x+i*FGB,cy=y+j*FGB;if(cx<0||cy<0||cx>=MP.Wm||cy>=MP.Hm||dist(cx,cy,x,y)>R+FGB*0.5)continue;var bk=fgBK(cx,cy),v=fgGameLeft(bk)+fgFishLeft(bk);if(v>bs){bs=v;bb=bk;}}
    if(!bb||bs<10)return null;var q=bb.split('|');return {m:m,x:(+q[0]+0.5)*FGB,y:(+q[1]+0.5)*FGB,bk:bb};}
  if(m==='buy'||m==='req'||m==='loot'){var g=fgSetNear(x,y,R);if(!g)return null;if(m!=='loot'&&civPresent(g)<20)return null;return {m:m,x:g.x,y:g.y,g:g.i};}
  if(m==='scav'){var S=fgScavSrc(u,x,y,R);return S?Object.assign({m:m},S):null;}
  return null;}
/* 自動：缺水先取水；缺糧依季節採收、向居民購買或徵用（依平民政策，不會劫掠）、打獵捕魚；最後搜刮廢墟與戰場 */
function fgAutoPick(u,x,y,ex){var L=u.lg||logInit(u),R=fgRoom(u,{auto:1}),se=fgSeason(),list=[],harvest=se==='su'||se==='au';
  if(fgThirstOn()&&fgWUnit(u)&&R.wat>fgWCap(u)*0.4)list.push('water');
  if(R.food>(L.dayKg||1)*0.5||R.fod>(L.fodDay||0)*0.5){if(harvest)list.push('crop');var g=fgSetNear(x,y,1500),Lc=polOf(u,'civ');if(g&&civPresent(g)>=20){if(Lc<=1){if(civAttTo(g,u.side)>-30)list.push('buy');}else list.push('req');}list.push('hunt');if(!harvest)list.push('crop');}
  if(R.food>(L.dayKg||1)*0.5||R.fuel>(L.fuelCap||0)*0.3||R.ammo>30)list.push('scav');
  for(var i=0;i<list.length;i++){if(ex&&ex.indexOf(list[i])>=0)continue;var P=fgPick(u,list[i],x,y);if(P)return P;}return null;}
/* ---------- 命令 ---------- */
function fgAct(u,o){if(ST(u).dom!=='land'||!isLeaf(u)){u.task='hold';o.st='done';return true;}if(o.x===undefined){o.x=u.x;o.y=u.y;}
  var fk=(o.opt&&o.opt.fk)||o.fk||'auto';if(!FGK[fk])fk='auto';o.fk=fk;o.got=o.got||{};o.hrs=o.hrs||0;
  if(fk==='loot'&&!o.chk){o.chk=1;var why=fgLootBlock(u,o);if(why){fgEnd(u,o,why,true);return true;}}
  var P=fk==='auto'?fgAutoPick(u,o.x,o.y):fgPick(u,fk,o.x,o.y);if(!P){fgEnd(u,o,'附近找不到可以'+(fk==='auto'?'籌措物資':FGK[fk][0])+'的地方',true);return true;}
  fgGo(u,o,P);return true;}
function fgGo(u,o,P){o.m=P.m;o.src=P;o.wx=P.x;o.wy=P.y;o.ph='go';o.rp=0;var vp=validPos(ST(u),P.x,P.y);o.vx=vp[0];o.vy=vp[1];if(dist(u.x,u.y,vp[0],vp[1])<250){u.task='at';u.path=null;}else{u.task='go';wantPath(u,vp[0],vp[1]);}}
function fgVerb(o){var S=o.src||{},g=S.g!==undefined&&G.civ?G.civ.S[S.g]:null,m=o.m;
  return m==='crop'?'採集作物':m==='water'?'取水':m==='hunt'?'打獵捕魚':m==='buy'?'向'+(g?g.n:'')+'的居民購買糧食':m==='req'?'徵用'+(g?g.n:'')+'的存糧':m==='loot'?'劫掠'+(g?g.n:''):m==='scav'?(S.du?'搜刮戰場上的遺留物資':S.ri!==undefined?'搜刮被毀的補給站':'搜刮廢墟'):'籌措物資';}
function fgLeaf(u,s){var o=u.ord;if(!o||o.k!=='forage'||!o.ph)return false;
  if(o.ph==='go'){if(u.task==='go'&&(u.path||u.pq))return false;var d=dist(u.x,u.y,o.vx!==undefined?o.vx:o.wx,o.vy!==undefined?o.vy:o.wy);
    if(d>700){if((o.rp||0)<2){o.rp=(o.rp||0)+1;u.task='go';wantPath(u,o.vx,o.vy);return false;}fgEnd(u,o,'無法抵達籌措地點',true);return true;}
    o.ph='work';u.task='work2';u.path=null;o.w0=G.t;logE(u.side,'res',uName(u)+'開始'+fgVerb(o)+'（'+placeTxt(u.x,u.y)+'）',u.x,u.y,u.id);
    if(o.m==='loot')fgLootStart(u,o);else if(o.m==='req')fgReqStart(u,o);return true;}
  if(o.ph!=='work')return false;fgWork(u,o);return true;}
function fgGot(u,o,k,v,m){if(!(v>0))return;o.got[k]=(o.got[k]||0)+v;fgStat(u.side,m+'_'+k,v);if(k==='food')costAdd(u.side,'fgFood',v);}
function fgWork(u,o){if(o.auto&&(u._ed<1500||G.t-(u.uf||-1e9)<300)){fgEnd(u,o,'敵軍接近，停止籌措');return;}var h=DT/3600,uf=G.t-(u.uf||-1e9)<120,eff=Math.max(0,u.men)*0.6*h*(uf?0.2:1)*(u.fat>70?0.6:1)*(G.env.light<0.3?0.6:1),L=u.lg||logInit(u),R=fgRoom(u,o),fn=FGDO[o.m];
  u.fat=clamp((u.fat||0)+0.02,0,100);o.hrs+=h;var r=fn?fn(u,o,eff,L,R,h):'不明的籌措方式';
  if(r&&typeof r==='object'){fgGo(u,o,r);return;}
  /* 自動：這一種方式做完了，還缺什麼就換另一種（最多換四次） */if(r&&o.fk==='auto'&&(o.sw||0)<4&&o.hrs<12){o.ex=(o.ex||[]).concat([o.m]);var Q=fgAutoPick(u,o.x,o.y,o.ex);if(Q){o.sw=(o.sw||0)+1;logE(u.side,'res',uName(u)+(o.m==='water'?'取水完畢':FGK[o.m][0]+'結束（'+r+'）')+'，改為'+FGK[Q.m][0],u.x,u.y,u.id);fgGo(u,o,Q);return;}}
  if(r){fgEnd(u,o,r);return;}if(o.hrs>=(o.m==='loot'?4:12))fgEnd(u,o,o.m==='loot'?'劫掠了 4 小時':'工作滿 12 小時');}
function fgGotTxt(o){var A=o.got||{},a=[];if(A.food>0.5)a.push('糧食 +'+fmt(A.food)+' 公斤');if(A.fod>0.5)a.push('草料 +'+fmt(A.fod)+' 公斤');if(A.wat>0.5)a.push('飲水 +'+fmt(A.wat)+' 公升');if(A.fuel>0.5)a.push('燃料 +'+fmt(A.fuel)+' 公升');if(A.ammo>0.2)a.push('彈藥 +'+fx(A.ammo,1)+'%');
  if(o.paid>0)a.push('付款 '+usdTxt(o.paid));if(o.lv>0)a.push('搶走財物約 '+money(o.lv));if(o.vic>0.5)a.push('平民死傷約 '+fmt(o.vic)+' 人');if(o.uxo>0.5)a.push('誤觸未爆彈傷亡約 '+fmt(o.uxo)+' 人');return a.join('、');}
function fgEnd(u,o,why,early){o.ph='';o.st='done';u.task='hold';u.path=null;var t=fgGotTxt(o);u.fgN={t:G.t,m:o.m||o.fk,txt:t,why:why,hrs:o.hrs||0};
  logE(u.side,'res',uName(u)+(early?'無法籌措物資：'+why:'籌措結束（'+why+'）：'+(t||'沒有收穫')+(o.hrs>0.05?'，共 '+fx(o.hrs,1)+' 小時':'')),u.x,u.y,u.id);if(o.auto)fgBack(u);}
/* 自動籌措結束：回到原任務或原位置 */
function fgBack(u){var P=u.fgPrev,H=u.fgHome;u.fgPrev=null;u.fgHome=null;if(P&&P.k){P.st='exec';activate(u,newOrder(P.k,P));}else if(H&&dist(H[0],H[1],u.x,u.y)>400)activate(u,newOrder('move',{x:H[0],y:H[1]}));}
/* ---------- 各種籌措方式（每一步）：回傳空字串繼續、字串結束、地點物件換地方 ---------- */
var FGDO={};
FGDO.crop=function(u,o,eff,L,R){var se=fgSeason(),k=o.src.k,c=G.map.lc[k],X=fgS(),horse=L.fodDay>0&&L.h>0;
  var left=fgCellFood(k,se),rate=fgIsCrop(c)?(se==='au'?1.5:se==='su'?1:0.3):0.15,take=Math.min(left,eff*rate,R.food);
  if(take>0){X.H[k]=(X.H[k]||0)+take;L.food+=take;fgGot(u,o,'food',take,'crop');fgCivCrop(u,o,k,take);}
  var fl=horse?fgCellFod(k,se):0,ft=Math.min(fl,eff*8,R.fod);if(ft>0){X.F[k]=(X.F[k]||0)+ft;L.fod+=ft;fgGot(u,o,'fod',ft,'crop');}
  if(R.food-take<=1&&(!horse||R.fod-ft<=1))return '糧食'+(horse?'與草料':'')+'已經裝滿';
  if(left-take<5&&(!horse||fl-ft<20)){var P=fgPick(u,'crop',o.wx,o.wy);if(P&&P.k!==k&&dist(P.x,P.y,o.x,o.y)<2000)return P;return '附近的作物已經採完';}
  return '';};
/* 收割居民的作物：減少附近聚落的存糧，好感下降、民怨上升；保護平民的部隊照價付款 */
function fgCivCrop(u,o,k,kg){var p=cellXY(k),g=fgSetNear(p[0],p[1],1500);if(!g||civPresent(g)<5)return;var Lc=polOf(u,'civ'),d=fgSetTake(g,kg*0.5);
  attAdd(g,u.side,-d*(Lc===0?1:3));g.unrest=clamp((g.unrest||0)+d*(Lc===0?0.5:2),0,100);g.fgT=G.t;g.fgS=u.side;
  if(Lc===0){var usd=kg*fgPrice();costAdd(u.side,'buyUsd',usd);costAdd(u.side,'buyKg',kg);o.paid=(o.paid||0)+usd;}}
FGDO.water=function(u,o,eff,L,R){if(!fgThirstOn()||!fgWUnit(u))return '不需要取水';var q=o.src.q||1,take=Math.min(R.wat,eff*25*q);if(take>0){L.wat+=take;fgGot(u,o,'wat',take,'water');fgDrink(u,L,take,q);}return R.wat-take<=1?'水壺與水車都已裝滿':'';};
FGDO.hunt=function(u,o,eff,L,R){var X=fgS(),bk=o.src.bk,se=fgSeason(),E=uEra(u),s=ST(u),sk=(s.fl.indexOf('r')>=0||s.br==='rec'||u.irr||s.mobi===1?1.5:1)*(E.y<1900?1.2:1),SF={sp:0.7,su:1,au:1.3,wi:0.9}[se]||1;
  var gl=fgGameLeft(bk),dens=fgBlockGame(bk)/120,gt=Math.min(gl,eff*0.07*Math.max(0.1,dens)*SF*sk*(G.env.light<0.3?0.5:1)),fl=fgFishLeft(bk),ft=Math.min(fl,eff*0.05),tot=Math.min(gt+ft,R.food);
  if(tot>0){var a=gt+ft>0?tot*gt/(gt+ft):0;X.Gm[bk]=(X.Gm[bk]||0)+a;X.P[bk]=(X.P[bk]||0)+tot-a;L.food+=tot;fgGot(u,o,'food',tot,'hunt');if(a>0&&E.y>=1650&&!E.fan)u.fgShot=G.t;}
  if(R.food-tot<=1)return '糧食已經裝滿';if(gl-gt<3&&fl-ft<3){var P=fgPick(u,'hunt',o.x,o.y);if(P&&P.bk!==bk)return P;return '附近的獵物已經打光';}return '';};
FGDO.buy=function(u,o,eff,L,R){var g=G.civ&&G.civ.S[o.src.g];if(!g||civPresent(g)<10)return '居民已經離開';if(civAttTo(g,u.side)<=-30)return g.n+'的居民拒絕和本方交易';
  var C=costP(),av=fgSetKg(g,14),take=Math.min(av,eff*3,R.food),usd=0,got=0,y=G.set.y||1943;if(take>0){var d=fgSetTake(g,take);L.food+=take;fgGot(u,o,'food',take,'buy');usd+=take*fgPrice();got+=take;attAdd(g,u.side,0.3*d);costAdd(u.side,'buyKg',take);}
  if(R.fuel>0&&y>=1920){var fu=Math.min(Math.max(0,fgSetFuel(g)-(g.fgFu0||0)*0.7),eff*20,R.fuel);if(fu>0){g.fgFu-=fu;L.fuel+=fu;fgGot(u,o,'fuel',fu,'buy');usd+=fu*C.fuel;got+=fu;}}
  if(R.fod>0){var fo=Math.min(Math.max(0,fgSetFod(g)-(g.fgFo0||0)*0.5),eff*10,R.fod);if(fo>0){g.fgFo-=fo;L.fod+=fo;fgGot(u,o,'fod',fo,'buy');usd+=fo*C.fod;got+=fo;}}
  if(usd>0){costAdd(u.side,'buyUsd',usd);o.paid=(o.paid||0)+usd;g.fgT=G.t;g.fgS=u.side;}
  if(R.food-take<=1&&R.fuel<=1&&R.fod<=1)return '已經買足';if(!(got>0))return g.n+'沒有多餘的物資可賣';return '';};
function fgReqStart(u,o){var g=G.civ&&G.civ.S[o.src.g];if(!g)return;var Lc=polOf(u,'civ');o.rcpt=Lc<=2||lawEra().y0>=1899;o.pay=Lc<=1;
  logE(u.side,'civ',uName(u)+'徵用'+g.n+'的存糧與物資'+(o.rcpt?'（開立收據'+(o.pay?'，日後照價賠償':'')+'）':'（沒有任何補償）'),g.x,g.y,u.id);}
FGDO.req=function(u,o,eff,L,R){var g=G.civ&&G.civ.S[o.src.g];if(!g||civPresent(g)<5)return '居民已經離開';var av=fgSetKg(g,5),take=Math.min(av,eff*4,R.food),got=take,y=G.set.y||1943;
  if(take>0){var d=fgSetTake(g,take);L.food+=take;fgGot(u,o,'food',take,'req');attAdd(g,u.side,-d*(o.pay?2:4));g.unrest=clamp((g.unrest||0)+d*(o.pay?1.5:3),0,100);if(o.pay){var usd=take*fgPrice();costAdd(u.side,'buyUsd',usd);costAdd(u.side,'buyKg',take);o.paid=(o.paid||0)+usd;}}
  if(R.fuel>0&&y>=1920){var fu=Math.min(fgSetFuel(g)*0.9,eff*30,R.fuel);if(fu>0){g.fgFu-=fu;L.fuel+=fu;fgGot(u,o,'fuel',fu,'req');got+=fu;}}
  if(R.fod>0){var fo=Math.min(fgSetFod(g)*0.9,eff*15,R.fod);if(fo>0){g.fgFo-=fo;L.fod+=fo;fgGot(u,o,'fod',fo,'req');got+=fo;}}
  g.fgT=G.t;g.fgS=u.side;if(R.food-take<=1&&R.fuel<=1&&R.fod<=1)return '已經徵足';if(!(got>0))return g.n+'已經沒有可徵用的存糧';return '';};
/* 劫掠：守法而軍紀良好的部隊拒絕；附近有憲兵、平民政策不是高壓以上時被制止 */
function fgLootBlock(u,o){if(typeof disInit==='function')disInit(u);var Lc=polOf(u,'civ'),dis=u.dis===undefined?50:u.dis;
  if(Lc===0&&dis>=55||Lc===1&&dis>=80){o.ref=1;logE(u.side,'disc',uName(u)+'拒絕執行劫掠平民的命令（部隊守法、軍紀良好）',u.x,u.y,u.id);return '部隊拒絕劫掠平民';}
  var mp=Lc<=2&&typeof mpNear==='function'?mpNear(u,3000):null;if(mp){u.dis=clamp(dis+3,0,100);logE(u.side,'disc',uName(mp)+'制止'+uName(u)+'劫掠平民，相關人員移送軍法',u.x,u.y,u.id);return '憲兵制止了劫掠';}
  return '';}
function fgLootStart(u,o){var g=G.civ&&G.civ.S[o.src.g];if(!g)return;var txt=uName(u)+'劫掠'+g.n+'：搶奪居民的糧食與財物';
  attAdd(g,u.side,-25);g.unrest=clamp((g.unrest||0)+15,0,100);g.alarm=Math.max(g.alarm||0,0.7);g.fgL=(g.fgL||0)+1;g.fgT=G.t;g.fgS=u.side;u.dis=clamp((u.dis===undefined?50:u.dis)-6,0,100);if(u.dis0!==undefined)u.dis0=Math.max(5,u.dis0-3);u.mor=clamp(u.mor+2,0,100);fgStat(u.side,'lootN',1);
  var e=civEv('crime',u.side,txt,g.x,g.y,u.id,{dk:'loot',ord:true});warCrime(u,'loot',0,txt,true);e.wc=1;if(G.press&&typeof pressOn==='function')pressOn(e,u);}
FGDO.loot=function(u,o,eff,L,R,h){var g=G.civ&&G.civ.S[o.src.g];if(!g)return '聚落已經不在';var Lc=polOf(u,'civ'),take=Math.min(fgSetKg(g,0)*0.9,eff*6,R.food),got=take;
  if(take>0){fgSetTake(g,take);L.food+=take;fgGot(u,o,'food',take,'loot');}
  if(R.fuel>0){var fu=Math.min(fgSetFuel(g),eff*40,R.fuel);if(fu>0){g.fgFu-=fu;L.fuel+=fu;fgGot(u,o,'fuel',fu,'loot');got+=fu;}}
  if(R.fod>0){var fo=Math.min(fgSetFod(g),eff*20,R.fod);if(fo>0){g.fgFo-=fo;L.fod+=fo;fgGot(u,o,'fod',fo,'loot');got+=fo;}}
  /* 財物：每小時約聚落財產的 1%（高壓以上的部隊加倍），一次劫掠最多一成 */var vmax=Math.max(0,(g.val0||0)*0.1-(g.fgLV||0)),v=Math.min(vmax,(g.val0||0)*0.01*h*(Lc>=3?2:1));
  if(v>0&&G.civ){g.fgLV=(g.fgLV||0)+v;g.loss+=v;g.looted=(g.looted||0)+v;G.civ.prop.loot+=v;G.civ.cs[u.side].loot+=v;G.civ.cs[u.side].prop+=v;o.lv=(o.lv||0)+v;fgStat(u.side,'lootV',v);got+=v;}
  attAdd(g,u.side,-3*h);g.unrest=clamp((g.unrest||0)+3*h,0,100);u.dis=clamp((u.dis===undefined?50:u.dis)-h,0,100);if(u.dis0!==undefined)u.dis0=Math.max(5,u.dis0-0.5*h);
  /* 暴力：軍紀越差越常發生 */if(civPresent(g)>=5&&fgr()<0.3*h*(100-(u.dis||0))/100*(Lc>=3?1.5:1)){var n=Math.min(civPresent(g)*0.2,1+4*fgr());civCas(g,n,0.5,'loot',u.side);o.vic=(o.vic||0)+n;fgStat(u.side,'lootCas',n);logE(u.side,'crime',uName(u)+'劫掠'+g.n+'時發生暴力，約 '+fmt(Math.max(1,n))+' 名平民死傷',g.x,g.y,u.id);}
  if(R.food-take<=1&&R.fuel<=1&&R.fod<=1)return '已經裝不下了';if(!(got>0))return g.n+'已經被搶光';return '';};
/* 搜刮：陣亡部隊的遺留物資、被毀補給站的殘骸、廢墟；誤觸未爆彈與詭雷、屍體附近的疾病 */
FGDO.scav=function(u,o,eff,L,R,h){var S=o.src,E=uEra(u),y=E.y,uof=(L.uof||0)*(L.basic||1),got=0,X=fgS(),uxo=0,dz=0,ok=true;
  var put=function(fd,fu,am,fo,same){fd=Math.min(fd||0,R.food);fu=Math.min(fu||0,R.fuel);fo=Math.min(fo||0,R.fod);var ap=uof>0?Math.min((am||0)*(same?0.9:y<1850?0.8:0.3)/uof*100,R.ammo):0;
    if(fd>0){L.food+=fd;fgGot(u,o,'food',fd,'scav');got+=fd;}if(fu>0){L.fuel+=fu;fgGot(u,o,'fuel',fu,'scav');got+=fu;}if(fo>0){L.fod+=fo;fgGot(u,o,'fod',fo,'scav');got+=fo;}if(ap>0){u.ammo=Math.min(100,(u.ammo||0)+ap);fgGot(u,o,'ammo',ap,'scav');got+=ap;}};
  if(S.du){var du=uById(S.du);if(!du||!du.lg){ok=false;}else{var P=fgDeadPool(du),f0=du.fgS||0,fr=Math.min(eff/Math.max(50,du.men0||100)*0.5,1-f0);if(fr<=0||P.food+P.fuel+P.ammo<1)ok=false;else{var sh=fr/Math.max(0.001,1-f0);du.fgS=f0+fr;put(P.food*sh,P.fuel*sh,P.ammo*sh,0,du.side===u.side);}
    uxo=y>=1900?0.05:0.01;if(G.t-(du.deadT||0)<5*86400)dz=0.04;}}
  else if(S.ri!==undefined){var Q=X.R[S.ri],T=Q?fgRemTot(Q):0;if(!Q||T<0.005)ok=false;else{var t=Math.min(T,eff*0.02),f=t/T;put(Q.food*f*1000,Q.fuel*f*1000/0.8,Q.ammo*f*1000,Q.fod*f*1000,Q.side===u.side);Q.food-=Q.food*f;Q.fuel-=Q.fuel*f;Q.ammo-=Q.ammo*f;Q.fod-=Q.fod*f;uxo=y>=1900?0.06:0.02;}}
  else{var k=S.k,lf=fgRuinLeft(k);if(lf<=0.01)ok=false;else{var ha=fgHa(),fr2=Math.min(lf,eff*0.003/ha);X.V[k]=(X.V[k]||0)+fr2;put(fr2*ha*(y>=1900?20:8),fr2*ha*(y>=1930?10:0),0,0,false);uxo=y>=1900?0.03:0;}}
  if(uxo>0&&fgr()<uxo*h){var n=Math.max(0.5,u.men*(0.002+0.006*fgr()));hit(u,null,n,0,8,'uxo');o.uxo=(o.uxo||0)+n;fgStat(u.side,'uxo',n);logE(u.side,'res',uName(u)+'搜刮時誤觸未爆彈或詭雷，傷亡約 '+fmt(Math.max(1,n))+' 人',u.x,u.y,u.id);}
  if(dz>0&&fgr()<dz*h){var m=u.men*0.004;if(m>0.2){sickAdd(u,m,'dys');logE(u.side,'res',uName(u)+'在屍體附近搜刮，衛生惡劣，有人染病',u.x,u.y,u.id);}}
  if(R.food<=1&&R.fuel<=1&&R.ammo<=1&&R.fod<=1)return '已經裝不下了';
  if(!ok||!(got>0)&&o.hrs>0.5){var P2=fgPick(u,'scav',o.x,o.y);if(P2&&(P2.du!==S.du||P2.ri!==S.ri||P2.k!==S.k))return P2;return '附近已經搜不到物資';}return '';};
/* ---------- 命令的分派（葉單位）與編制的規劃 ---------- */
(function(){var b=v4Act;v4Act=function(u,o){if(o&&o.k==='forage')return fgAct(u,o);return b(u,o);};})();
(function(){var b=v4Leaf;v4Leaf=function(u,s){if(u.ord&&u.ord.k==='forage')return fgLeaf(u,s);return b(u,s);};})();
(function(){var b=planV4;planV4=function(F,o,kids,man,fire,air,nav,oth,P,C,dir,add,fw,spreadLine){if(o.k!=='forage')return b.apply(this,arguments);
  var land=kids.filter(function(u){var L2=isLeaf(u)?[u]:leavesOf(u);return L2.some(function(q){return alive(q)&&ST(q).dom==='land';});}),n=land.length;
  kids.forEach(function(u){var i=land.indexOf(u);if(i<0){add(u,newOrder('halt',{}));return;}var a=i/Math.max(1,n)*2*PI,r=n>1?700:0;add(u,newOrder('forage',{x:P[0]+Math.cos(a)*r,y:P[1]+Math.sin(a)*r,opt:o.opt}));});return true;};})();
/* 籌措中的部隊在完成前（最多 12 小時）不被 AI 另派任務；自動籌措時上級重新規劃也不打斷（撤退、遲滯等緊急命令除外） */
(function(){var b=busyF;busyF=function(F){var o=F.ord;if(o&&o.k==='forage'&&o.st!=='done'&&G.t-(o.t1||o.ti||0)<12*3600)return true;return b(F);};})();
(function(){var b=issue;issue=function(u,k,p){var o=u&&u.ord;if(o&&o.k==='forage'&&o.auto&&o.st!=='done'&&isLeaf(u)&&aiControls(u)&&!/^(withdraw|twd|rest|halt)$/.test(k)&&!(u._ed<1500))return {sec:0};return b.apply(this,arguments);};})();
(function(){var b=kitBusy;kitBusy=function(u){var o=u.ord;if(o&&o.k==='forage'&&o.auto&&o.st!=='done')return true;return b(u);};})();
/* ---------- 打獵的槍聲與四散的採集隊比較容易被發現 ---------- */
(function(){var b=sigOf;sigOf=function(t,ts,air){var f=b(t,ts,air);if(t.fgShot&&G.t-t.fgShot<300)f*=air?1.2:1.8;else if(t.ord&&t.ord.k==='forage'&&t.ord.ph==='work')f*=1.15;return f;};})();
/* ---------- 自動就地籌措：脫離補給、存糧或飲水不足、附近沒有敵軍的閒置部隊（AI 部隊一律） ---------- */
function fgAutoStep(){if(!G.started)return;var auto=fgAutoOn();G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||u.ms==='rout'||u.irr||u.amph||!u.lg||u.men<5||ST(u).dom!=='land')return;var o=u.ord;
    if(o&&o.k==='forage'&&o.st!=='done')return;if(u.insup!==false||G.t-(u.fgTry||-1e9)<4*3600)return;if(u._ed<3000||G.t-(u.fired||-1e9)<1800||G.t-(u.uf||-1e9)<1800)return;
    var L=u.lg,fr=u.men0>0?u.men/u.men0:1,lowF=L.food<L.foodCap*fr*0.35,lowW=fgThirstOn()&&fgWUnit(u)&&L.wat>=0&&L.wat<fgWCap(u)*0.35,lowH=L.fodDay>0&&L.h>0&&L.fod<L.fodCap*0.3;if(!lowF&&!lowW&&!lowH)return;
    var ai=aiControls(u),idle=typeof fuelIdle==='function'?fuelIdle(u):!o||o.st==='done';if(!(ai||auto&&idle))return;if(ai&&!idle&&!(o&&/^(defend|hold|holdfast|fortify|screen|delay)$/.test(o.k)))return;
    u.fgTry=G.t;var P=fgAutoPick(u,u.x,u.y);if(!P)return;
    u.fgPrev=o&&o.st!=='done'&&o.k!=='halt'?{k:o.k,x:o.x,y:o.y,face:o.face,opt:o.opt,dk:o.dk,r:o.r,pts:o.pts,w:o.w}:null;u.fgHome=[u.x,u.y];
    logE(u.side,'supply',uName(u)+'脫離補給、'+(lowW?'飲水':lowF?'存糧':'草料')+'不足，就地籌措（'+FGK[P.m][0]+'）',u.x,u.y,u.id);activate(u,newOrder('forage',{x:u.x,y:u.y,opt:{fk:'auto'},auto:1}));});}
(function(){var b=v8Step;v8Step=function(){b.apply(this,arguments);if(G&&G.started&&!G.over&&G.step%40===17)try{fgAutoStep();}catch(e){}};})();
/* ---------- 戰爭花費：就地籌措的糧食不算補給線運來的軍糧；另列就地採購與徵用補償 ---------- */
(function(){if(typeof costRows!=='function')return;var b=costRows;costRows=function(s){var R=b.apply(this,arguments),C=costS(s),P=costP(),i=R.findIndex(function(r){return r.k==='food';});
  if(i>=0&&C.fgFood>0){var r=R[i],kg=Math.max(0,r.q*1000-C.fgFood);r.q=kg/1000;r.usd=kg*P.food;r.n='糧秣飲水（不含就地籌措的 '+fmt(C.fgFood/1000,1)+' 噸）';}
  if(C.buyUsd>0)R.splice(i>=0?i+1:R.length,0,{k:'local',n:'就地採購與徵用補償',q:(C.buyKg||0)/1000,u:'噸',p:C.buyKg>0?C.buyUsd/(C.buyKg/1000):0,usd:C.buyUsd});return R;};})();
/* ---------- 聯機：各方只收到本方的籌措統計 ---------- */
if(typeof mpValList==='function'){(function(){var b=mpValList;mpValList=function(s){var V=b.apply(this,arguments);if(G.fg&&G.fg.st)V.push(['fg.st',s<0?G.fg.st:mpPair(G.fg.st,s,function(){return {};})]);return V;};})();}
