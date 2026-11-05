/* ===================== v9：部隊自動構工與修復、後勤設施的開設與遷移、相持越久工事越完整、自然形成的戰區體系；對第三方團體與記者的行動 =====================
   停在原地、沒有其他工作的部隊會自己做該做的事：步兵挖壕、架鐵絲網、築碉堡，砲兵整備陣地，指揮部構築掩體，後勤部隊開設補給站，衛生部隊開設野戰醫院，
   工兵修復設施與橋梁、整修道路、在補給站旁設彈藥庫與油庫、闢建機場與補給道路。前線推進或補給站受威脅時，後勤設施會遷移，來不及運走的物資就地焚毀。
   以 2.5 公里為一個防區記錄相持時間：同一地區守得越久，工事與後勤體系越完整（倉促陣地 → 塹壕 → 鐵絲網與碉堡 → 雷區與交通壕 → 縱深防禦）。 */
var AWS=2500,AWH=[0,1,6,24,72,168],AWN=['未設防','倉促陣地','塹壕陣地','鐵絲網與碉堡','雷區與交通壕','縱深防禦體系'];
function awInit(){return G.aw||(G.aw={s:sAO(),cnt:sAO(),blown:[],seq:0,zn:sAL(),lg:sAO()});}
/* 設定：all＝雙方都自動，ai＝只有電腦指揮的部隊，off＝關閉 */
/* 後勤經營風格對自動構工的倍率（第十一版依指揮官的風格覆寫） */
function awStyle(u,k){return 1;}
function awMode(){var m=G.set.autoWorks;return m==='ai'||m==='off'?m:'all';}
function awOn(u){var m=awMode();if(m==='off')return false;if(m==='ai')return !!SD(u.side).ai&&aiControls(u);return true;}
function awSideOn(side){var m=awMode();return m==='all'||m==='ai'&&!!SD(side).ai;}
function awSec(side,x,y){var A=awInit(),gx=Math.floor(x/AWS),gy=Math.floor(y/AWS),k=gx+'|'+gy,S=A.s[side][k];if(!S)S=A.s[side][k]={k:k,x:(gx+0.5)*AWS,y:(gy+0.5)*AWS,t0:G.t,seen:-1e9,fT:-1e9,work:0,eng:0,eng1:0,n:0,lv:0};return S;}
function awCnt(side,k,n){var C=awInit().cnt[side];C[k]=(C[k]||0)+n;}
function awStill(u){return u.task!=='go'&&!u.path&&!u.pq&&G.t-(u.movedAt||-1e9)>1200;}
function awIdle(u){var o=u.ord;if(busyF(u))return false;if(!o||o.st==='done'||o.k==='halt'||o.k==='rest')return true;/* 電腦指揮的工兵：守備命令下達一小時以上、停在原地，就當作有空 */return !!(SD(u.side).ai&&aiControls(u)&&(o.k==='defend'||o.k==='reserve')&&G.t-(o.t1||o.ti||0)>3600);}
function awFace(u){var o=u.ord;if(o&&o.face!==undefined&&(o.k==='defend'||o.k==='fortify'))return o.face;var ec=enemyCentroid(u.side,u.x,u.y,15000);return ec?Math.atan2(ec[1]-u.y,ec[0]-u.x):homeDir(u.side)+PI;}
/* 寫入地圖工事（1 塹壕、2 鐵絲網、3 雷區、4 碉堡）：不蓋過水域、城牆與既有工事；大路上不架鐵絲網、不埋雷、不築碉堡 */
function awPut(side,ks,x,y,v){var MP=G.map;if(x<0||y<0||x>=MP.Wm||y>=MP.Hm)return;var k=cellAt(x,y),c=MP.lc[k],f=MP.ft[k];if(isWater(c))return;if(f!==0&&!(v===4&&f===1))return;if(v!==1&&MP.rd[k]>=3)return;if(v===3&&isUrban(c))return;MP.ft[k]=v;ks.push(k);awCnt(side,'t'+v,1);}
function awLine(u,ks,face,off,v,W,gap){var cs=G.map.cs,fx=Math.cos(face),fy=Math.sin(face),i=0;for(var t=-W/2;t<=W/2;t+=cs*0.6,i++){if(gap&&i%gap===gap-1)continue;awPut(u.side,ks,u.x-fy*t+fx*off,u.y+fx*t+fy*off,v);}}
function awPt(u,ks,face,off,lat,v){var fx=Math.cos(face),fy=Math.sin(face);awPut(u.side,ks,u.x-fy*lat+fx*off,u.y+fx*lat+fy*off,v);}
/* 一個部隊在自己的位置上依相持時間逐級構工（有效時數＝實際時數 ×（1＋防區內工兵的加成）） */
function awUnit(u,ks,eh,front){var s=ST(u),y=lgY(),fl=s.fl,W=Math.min(frontW(u)*0.8,1600),r=roleOf(u),say=null,face;
  if(fl.indexOf('h')>=0){if(eh>=6&&u.aw.lv<2){u.aw.lv=2;u.ent=Math.max(u.ent,0.9);say='構築指揮所掩體';}return say;}
  if(fl.indexOf('g')>=0||r==='fire'){if(eh>=2&&u.aw.lv<2){u.aw.lv=2;u.ent=Math.max(u.ent,0.8);say='整備砲兵陣地（砲位掩體與彈藥坑）';}return say;}
  if(r!=='man'&&r!=='rec'||!front)return null;face=awFace(u);
  if(eh>=AWH[2]&&u.aw.lv<2){awLine(u,ks,face,60,1,W);u.aw.lv=2;u.ent=Math.max(u.ent,0.65);say='挖掘塹壕';}
  if(eh>=AWH[3]&&u.aw.lv===2){awLine(u,ks,face,-450,1,W*0.9);if(y>=1890)awLine(u,ks,face,230,2,W,5);if(y>=1914)[-1,0,1].forEach(function(q){awPt(u,ks,face,60,q*W/3,4);});else if(y>=1700)awPt(u,ks,face,40,0,4);u.aw.lv=3;u.ent=Math.max(u.ent,0.8);say=y>=1890?'架設鐵絲網、構築碉堡與第二道塹壕':'構築角堡與第二道壕溝';}
  if(eh>=AWH[4]&&u.aw.lv===3){var cs=G.map.cs,fx=Math.cos(face),fy=Math.sin(face);if(y>=1935)[-0.33,0,0.33].forEach(function(q){for(var j=-2;j<=2;j++)awPt(u,ks,face,330+(j%2)*40,q*W+j*cs*0.8,3);});for(var d=-450;d<=60;d+=cs*0.6)awPut(u.side,ks,u.x+fx*d,u.y+fy*d,1);u.aw.lv=4;say=y>=1935?'布設雷區、挖掘交通壕':'挖掘交通壕';}
  if(eh>=AWH[5]&&u.aw.lv===4){awLine(u,ks,face,-1200,1,W);if(y>=1914){awPt(u,ks,face,-450,-W/4,4);awPt(u,ks,face,-450,W/4,4);}u.aw.lv=5;u.ent=Math.max(u.ent,0.9);say='構築第三道防線，形成縱深防禦';}
  return say;}
function awDepotNear(side,x,y,R){return nodesOf(side).filter(function(N){return N.k==='depot'&&!N.only&&dist(N.x,N.y,x,y)<R;}).sort(function(a,b){return dist(a.x,a.y,x,y)-dist(b.x,b.y,x,y);})[0]||null;}
function awFacNear(side,k,x,y,R){return (G.fac||[]).filter(function(F){return F.k===k&&!F.dead&&F.own===side&&dist(F.x,F.y,x,y)<R;})[0]||null;}
function awAirNear(side,x,y,R){return nodesOf(side).some(function(N){return N.k==='air'&&dist(N.x,N.y,x,y)<R;});}
function awNeedAir(side){return G.units.some(function(u){var s=ST(u);return u.side===side&&alive(u)&&s.dom==='air'&&(s.fl.indexOf('B')>=0||s.end>0)&&s.fl.indexOf('C')<0;});}
function awNeedFuel(side){return G.units.some(function(u){return u.side===side&&alive(u)&&onMap(u)&&fuelDep(u);});}
/* 後勤、衛生與工兵部隊的工作：開設補給站與野戰醫院、修復、油彈庫、機場、補給道路、整修路面 */
function awSupport(u,S,eh,front,ks){var s=ST(u),fl=s.fl,side=u.side,A=awInit(),safe=enemyNear(side,u.x,u.y,5000,'land')===0,y=lgY();
  if(fl.indexOf('l')>=0&&!front&&safe&&eh>=4&&!awDepotNear(side,u.x,u.y,10000)&&nodesOf(side).filter(function(N){return N.auto;}).length<8*awStyle(u,'depotN')){var N=addNode(side,'depot',u.x,u.y,{name:'野戰補給站 '+(++A.seq),auto:1,by:u.id,t0:G.t});
    var stk=u.lg&&u.lg.stk;if(stk)LCLS.forEach(function(c){var q=(stk[c]||0)*0.5;stk[c]-=q;N.st[c]=(N.st[c]||0)+q;});logE(side,'log',uName(u)+'在'+placeTxt(u.x,u.y)+'開設「'+N.name+'」',u.x,u.y,u.id);return 'dep';}
  /* 野戰醫院開在敵軍砲兵難以觸及的後方：8 公里內沒有敵軍 */if(fl.indexOf('D')>=0&&!front&&safe&&eh>=3/awStyle(u,'med')&&enemyNear(side,u.x,u.y,8000,'land')===0&&!awFacNear(side,'hosp',u.x,u.y,12000)){buildApply(u,{bk:'fhosp',x:u.x,y:u.y});var F=G.fac[G.fac.length-1];if(F&&F.k==='hosp'){F.auto=1;F.by=u.id;}return 'hosp';}
  if(!(isEng(u)||fl.indexOf('f')>=0))return null;
  /* 整修路面：工兵與勞工把附近被彈坑、車轍破壞的道路填平 */if(G.rdd&&safe){var D=G.rdd,MP=G.map,n=0;brushCells(MP,u.x/MP.cs,u.y/MP.cs,Math.max(1,2000/MP.cs),function(k){if(D[k]>0){D[k]=Math.max(0,D[k]-(isEng(u)?40:25));n++;}});if(n)awCnt(side,'rdfix',n);}
  /* 補給道路：防區相持兩天以上，從補給站到前線開出一條車輛能走的路 */var dep=awDepotNear(side,u.x,u.y,8000);if(dep&&dep.rdq&&dep.rdq.length&&dep.rdBy===u.id&&safe){var MP2=G.map,q=dep.rdq.splice(0,isEng(u)?60:35);q.forEach(function(k){if(MP2.rd[k]<2&&!isWater(MP2.lc[k])){MP2.rd[k]=MP2.rd[k]+1;ks.push(k);}});if(!dep.rdq.length){dep.road=1;awCnt(side,'road',dep.rdKm||0);logE(side,'eng',uName(u)+'完成從「'+dep.name+'」通往前線的補給道路（約 '+fmt(dep.rdKm||0,1)+' 公里）',u.x,u.y,u.id);}return 'road';}
  if(!awIdle(u)||u.awJob>G.t)return null;
  /* 修復受損或被摧毀的本方設施 */var F2=(G.fac||[]).filter(function(f){return f.own===side&&(f.dead||(f.hp||100)<70)&&dist(f.x,f.y,u.x,u.y)<15000&&enemyNear(side,f.x,f.y,4000,'land')===0&&!(f.rpT>G.t);}).sort(function(a,b){return dist(a.x,a.y,u.x,u.y)-dist(b.x,b.y,u.x,u.y);})[0];
  if(F2&&isEng(u)){F2.rpT=G.t+6*3600;u.awJob=G.t+2*3600;issue(u,'repair',{x:F2.x,y:F2.y,fac:F2.id});return 'repair';}
  /* 重建被炸毀的橋梁（在本方控制的地區） */var B=A.blown.filter(function(b){return !b.done&&!(b.job>G.t)&&dist(b.x,b.y,u.x,u.y)<15000&&enemyNear(side,b.x,b.y,5000,'land')===0&&friendNear(side,b.x,b.y,8000)>0;})[0];
  if(B&&isEng(u)){B.job=G.t+8*3600;u.awJob=G.t+2*3600;issue(u,'bridge',{x:B.x,y:B.y,bt:'auto',opt:{bt:'auto'}});return 'bridge';}
  if(front||!safe)return null;
  /* 補給站旁的彈藥庫與油庫（相持一天以上） */if(dep&&eh>=24/awStyle(u,'base')&&isEng(u)){var a=homeDir(side),p=validPos({dom:'land'},dep.x+Math.cos(a)*700,dep.y+Math.sin(a)*700);
    if(!awFacNear(side,'ammo',dep.x,dep.y,2500)){u.awJob=G.t+3*3600;issue(u,'build',{x:p[0],y:p[1],bk:'ammoD'});return 'ammoD';}
    if(y>=1914&&awNeedFuel(side)&&!awFacNear(side,'tank',dep.x,dep.y,2500)){u.awJob=G.t+3*3600;issue(u,'build',{x:p[0]+300,y:p[1]+300,bk:'fuel'});return 'fuel';}}
  /* 野戰機場：有需要機場的飛機、附近 35 公里沒有本方機場（相持三天以上） */if(eh>=72/awStyle(u,'air')&&isEng(u)&&featOn('airfield')&&!(SD(side).awAirT>G.t)&&awNeedAir(side)&&!awAirNear(side,u.x,u.y,35000)){SD(side).awAirT=G.t+12*3600;u.awJob=G.t+4*3600;issue(u,'build',{x:u.x,y:u.y,bk:'sair'});return 'sair';}
  /* 開始規劃補給道路（相持兩天以上） */if(dep&&eh>=48/awStyle(u,'road')&&!dep.road&&!dep.rdq){var fs=awFrontSec(side,dep.x,dep.y);if(fs){var P=findPath({dom:'land',mobi:3,vr:30,vx:8,fl:''},dep.x,dep.y,fs.x,fs.y,{max:40000});dep.road=P?0:1;if(P&&P.pts){var MP3=G.map,cells=[],seen={};for(var i=2;i<P.pts.length;i+=2){var x0=P.pts[i-2],y0=P.pts[i-1],x1=P.pts[i],y1=P.pts[i+1],n2=Math.max(1,Math.ceil(dist(x0,y0,x1,y1)/(MP3.cs*0.5)));for(var j=0;j<=n2;j++){var kk=cellAt(x0+(x1-x0)*j/n2,y0+(y1-y0)*j/n2);if(!seen[kk]&&MP3.rd[kk]<2&&!isWater(MP3.lc[kk])){seen[kk]=1;cells.push(kk);}}}
      if(cells.length){dep.rdq=cells;dep.rdBy=u.id;dep.rdKm=P.km||cells.length*MP3.cs/1000;logE(side,'eng',uName(u)+'開始整修從「'+dep.name+'」通往前線的補給道路（約 '+fmt(dep.rdKm,1)+' 公里）',u.x,u.y,u.id);return 'road';}dep.road=1;}}}
  return null;}
function awFrontSec(side,x,y){var A=awInit(),b=null,bd=1e18;for(var k in A.s[side]){var S=A.s[side][k];if(G.t-S.seen>2*3600||G.t-S.fT>2*3600)continue;var d=dist(S.x,S.y,x,y);if(d<bd){bd=d;b=S;}}return bd<30000?b:null;}
/* 每 10 分鐘：記錄每個防區的相持時間，靜止的部隊依時間構工；後勤、衛生與工兵做支援工作 */
function awStep(){if(awMode()==='off'&&!G.aw)return;var A=awInit(),h=600/3600,ks=[];
  SIDES().forEach(function(side){var S0=A.s[side]||(A.s[side]={});for(var k in S0){S0[k].eng1=S0[k].eng;S0[k].eng=0;S0[k].n=0;}
    G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||!alive(u)||!onMap(u)||u.st==='ship'||u.st==='lift'||u.amph||u.ms==='rout'||u.irr)return;var s=ST(u);if(s.dom!=='land'||s.fl.indexOf('G')>=0)return;if(!awStill(u)){u.aw=null;return;}
      var S=awSec(side,u.x,u.y);if(G.t-S.seen>3600)S.t0=G.t;S.seen=G.t;S.n++;var eng=isEng(u)||s.fl.indexOf('f')>=0;if(eng)S.eng++;S.work+=(u.men||0)*h*(eng?3:1);
      var near=enemyNear(side,u.x,u.y,6000,'land')>0;if(near)S.fT=G.t;var front=G.t-S.fT<2*3600;
      if(!u.aw||u.aw.k!==S.k)u.aw={k:S.k,lv:0,t0:G.t};if(!awOn(u))return;
      var eh=(G.t-u.aw.t0)/3600*(1+Math.min(1.5,(S.eng1||0)*0.5))*(G.env&&G.env.frozen?0.6:1),lv0=u.aw.lv,say=awUnit(u,ks,eh*awStyle(u,'fort'),front);
      if(say){S.lv=Math.max(S.lv,u.aw.lv);S.lg=S.lg||{};/* 同一防區同一種工作只記一次，避免紀錄洗版 */if(!S.lg[say]){S.lg[say]=1;logE(side,'eng',uName(u)+'在'+placeTxt(u.x,u.y)+say+'（相持 '+durTxt(G.t-u.aw.t0)+'）',u.x,u.y,u.id);}}
      if(s.fl.indexOf('l')>=0||s.fl.indexOf('D')>=0||eng)awSupport(u,S,eh,front,ks);});
    awTheater(side);});
  if(ks.length)mapChanged(ks);}
/* ---------- 遷移：補給站與野戰醫院隨前線移動；受威脅時後撤，來不及運走的物資焚毀 ---------- */
function awMoveDepot(N,p,why){var side=N.side,S=SD(side),cg=lgSum(N.st),car=0,burn=0,M=null;
  if(p){M=addNode(side,'depot',p[0],p[1],{name:N.name,auto:1,cv:N.cv?Object.assign({},N.cv):undefined,cap:N.cap,t0:G.t});
    if(typeof lgOn==='function'&&lgOn()&&cg>1&&N.cv&&N.cv.n>0){var m=lgRoadMode(),pay=lgPay(m),cap=N.cv.n*pay,f=Math.min(1,cap/cg),V=lgNew(side,m,Math.max(1,Math.min(N.cv.n,Math.ceil(cg*f/pay))),{x:N.x,y:N.y,ph:'in',src:{k:'node',side:side,id:M.id},dst:{k:'node',side:side,id:M.id},home:{k:'node',side:side,id:M.id}});
      LCLS.forEach(function(c){V.c[c]=(N.st[c]||0)*f;});car=cg*f;burn=cg-car;if(!lgLeg(V,M.x,M.y)){V.pts=[N.x,N.y,M.x,M.y];V.pi=2;}}
    else if(typeof lgOn==='function'&&lgOn()){burn=cg;}else{LCLS.forEach(function(c){M.st[c]=N.st[c]||0;});car=cg;}}
  else burn=cg;
  S.nodes=S.nodes.filter(function(q){return q!==N;});awInit().lg[side].mv=(awInit().lg[side].mv||0)+1;
  logE(side,'log','「'+N.name+'」'+(why==='threat'?'受敵軍威脅，':'隨前線推進，')+(p?'遷移到'+placeTxt(p[0],p[1]):'撤離')+(car>0.5?'（車隊運走約 '+fmt(car,1)+' 噸物資）':'')+(burn>0.5?'；來不及運走的約 '+fmt(burn,1)+' 噸物資就地焚毀，以免資敵':''),N.x,N.y);return M;}
/* thr＝只檢查受威脅（每 10 分鐘，敵軍進入 6 公里、附近友軍不足就撤，免得被佔領而存量全失）；否則也檢查被拋在後方的設施（每 30 分鐘） */
function awRelocate(thr){if(awMode()==='off')return;SIDES().forEach(function(side){if(!awSideOn(side))return;var me=G.units.filter(function(u){return u.side===side&&isLeaf(u)&&alive(u)&&onMap(u)&&ST(u).dom==='land'&&roleOf(u)!=='sup'&&u.ms!=='rout';});if(!me.length)return;var C=centroid(me),home=homeDir(side);
  function nearest(x,y){var d=1e18;me.forEach(function(u){d=Math.min(d,dist(u.x,u.y,x,y));});return d;}
  function rearPt(x,y,d){return validPos({dom:'land'},x+Math.cos(home)*d,y+Math.sin(home)*d);}
  function fwdPt(){return validPos({dom:'land'},C[0]+Math.cos(home)*7000,C[1]+Math.sin(home)*7000);}
  nodesOf(side).slice().forEach(function(N){if(N.k!=='depot'||N.fac||N.only)return;var en=enemyNear(side,N.x,N.y,6000,'land'),fr=friendNear(side,N.x,N.y,4000);
    if(en>80&&fr<en*0.6||N.status==='contested'&&fr<en){var p=rearPt(N.x,N.y,12000);awMoveDepot(N,dist(p[0],p[1],N.x,N.y)>4000?p:null,'threat');return;}
    if(thr)return;/* 前線遠離：自動開設的補給站與電腦指揮的一方才跟著前移；玩家自己設的補給站只在受威脅時撤離 */if(nearest(N.x,N.y)>25000&&(N.auto||SD(side).ai)){var q=fwdPt();if(dist(q[0],q[1],N.x,N.y)>10000&&enemyNear(side,q[0],q[1],5000,'land')===0)awMoveDepot(N,q,'fwd');}});
  (G.fac||[]).forEach(function(F){if(F.k!=='hosp'||!F.field||F.dead||F.own!==side||F.busy>G.t)return;var en=enemyNear(side,F.x,F.y,6000,'land'),fr=friendNear(side,F.x,F.y,4000),p=null,why='';
    if(en>80&&fr<en*0.6){p=rearPt(F.x,F.y,12000);why='受敵軍威脅，帶著傷患後撤到';}else if(!thr&&nearest(F.x,F.y)>25000){p=fwdPt();why='隨前線推進，前移到';if(dist(p[0],p[1],F.x,F.y)<10000||enemyNear(side,p[0],p[1],5000,'land')>0)p=null;}
    if(!p)return;logE(side,'log','「'+F.name+'」'+why+placeTxt(p[0],p[1])+'（約兩小時無法收治新傷患）',F.x,F.y);F.x=p[0];F.y=p[1];F.busy=G.t+2*3600;awInit().lg[side].hmv=(awInit().lg[side].hmv||0)+1;});});}
/* 被炸毀的橋梁：記下位置，之後由本方工兵重建；重建完成後從清單移除 */
(function(){var b=blowBridge;blowBridge=function(site,u){b(site,u);if(site&&site.kind!=='tunnel')awInit().blown.push({x:site.x,y:site.y,t:G.t,by:u?u.side:-1});};})();
(function(){var b=buildBridge;buildBridge=function(site,u){b(site,u);var A=G.aw;if(A&&site){var hit=false;A.blown.forEach(function(q){if(!q.done&&dist(q.x,q.y,site.bx!==undefined?site.bx:site.x||0,site.by!==undefined?site.by:site.y||0)<2000){q.done=G.t;hit=true;}});if(hit&&u)awCnt(u.side,'brg',1);}};})();
/* ---------- 戰區體系：前沿防區（依連續的前線防區分組）、支援地帶、後方地域與其中的設施 ---------- */
function awTheater(side){var A=awInit(),S0=A.s[side],fr=[],sup=[],rear=[],k;for(k in S0){var S=S0[k];if(G.t-S.seen>2*3600)continue;(G.t-S.fT<2*3600?fr:rear).push(S);}
  rear=rear.filter(function(S){if(fr.some(function(F){return Math.abs(F.x-S.x)<=AWS*2.1&&Math.abs(F.y-S.y)<=AWS*2.1;})){sup.push(S);return false;}return true;});
  var zs=[],seen={};fr.forEach(function(S){if(seen[S.k])return;var Z=[],q=[S];seen[S.k]=1;while(q.length){var c=q.pop();Z.push(c);fr.forEach(function(o){if(!seen[o.k]&&Math.abs(o.x-c.x)<=AWS*1.01&&Math.abs(o.y-c.y)<=AWS*1.01){seen[o.k]=1;q.push(o);}});}zs.push(Z);});
  var hd=homeDir(side),ax=Math.abs(Math.cos(hd))>0.5?'y':'x';zs.sort(function(a,b){return centroid(a)[ax==='y'?1:0]-centroid(b)[ax==='y'?1:0];});
  var Z2=zs.map(function(Z,i){var c=centroid(Z);return {i:i+1,n:Z.length,lv:Math.max.apply(null,Z.map(function(s){return s.lv;})),held:Math.max.apply(null,Z.map(function(s){return G.t-s.t0;})),x:c[0],y:c[1],keys:Z.map(function(s){return s.k;})};});
  var dep=nodesOf(side).filter(function(N){return N.k==='depot'&&!N.only;}),own=function(kk){return (G.fac||[]).filter(function(F){return F.k===kk&&!F.dead&&F.own===side;});},air=nodesOf(side).filter(function(N){return N.k==='air';}),C=A.cnt[side];
  var lines=Z2.length?Math.max.apply(null,Z2.map(function(z){return z.lv;})):0,parts=[lines>=2,lines>=3,lines>=4,dep.length>0,own('hosp').length>0,own('ammo').length+own('tank').length>0,air.length>0,(C.road||0)>0];
  var T={t:G.t,zones:Z2,front:fr.length,sup:sup.length,rear:rear.length,supK:sup.map(function(s){return s.k;}),rearK:rear.map(function(s){return s.k;}),lv:lines,dep:dep.length,hosp:own('hosp').length,dump:own('ammo').length+own('tank').length,air:air.length,cnt:C,score:Math.round(parts.filter(Boolean).length/parts.length*100)};
  var D=SD(side);D.thz=T;
  if(Z2.length&&lines>=2&&((D.thzLv||0)<lines||!D.thzLogT||G.t-D.thzLogT>24*3600)){D.thzLv=Math.max(D.thzLv||0,lines);D.thzLogT=G.t;logE(side,'eng',G.sides[side].name+'沿前線形成 '+Z2.length+' 個防區（最完整的達到「'+AWN[lines]+'」），後方有補給站 '+dep.length+' 處、醫院 '+own('hosp').length+' 所'+(T.dump?'、油彈庫 '+T.dump+' 處':'')+(air.length?'、機場 '+air.length+' 座':''));}}
function awZoneOf(side,x,y){var T=SD(side).thz;if(!T||!T.zones)return null;var k=Math.floor(x/AWS)+'|'+Math.floor(y/AWS);return T.zones.filter(function(z){return z.keys.indexOf(k)>=0;})[0]||null;}
/* 野戰醫院遷移途中不收治新傷患 */
(function(){var b=hospStep;hospStep=function(){var L=(G.fac||[]).filter(function(F){return F.k==='hosp'&&F.busy>G.t&&!F.dead;}),keep=L.map(function(F){var d=F.dead;F.dead=G.t;return d;});b();L.forEach(function(F,i){F.dead=keep[i];});};})();

/* ===================== 對第三方團體（援助團體、教會團體）與戰地記者的行動：與對平民相同的指令 ===================== */
(function(){var b=civTgt;civTgt=function(o){var p=o&&o.opt;if(p&&p.tg==='A')return (G.tp||[]).filter(function(A){return A.id===p.id;})[0]||null;if(p&&p.tg==='P')return G.press?G.press.R.filter(function(R){return R.id===p.id;})[0]||null:null;return b(o);};})();
(function(){var b=civLive;civLive=function(T,t){if(t==='A')return !!T&&T.st!=='dead'&&T.st!=='gone'&&T.n>=1;if(t==='P')return !!T&&(T.st==='ok'||T.st==='wia'||T.st==='det');return b(T,t);};})();
(function(){var b=civReach;civReach=function(T,t){return t==='A'||t==='P'?500:b(T,t);};})();
(function(){var b=civGuideStart;civGuideStart=function(u,o,T,t){if(t==='A'||t==='P')return;return b(u,o,T,t);};})();
(function(){var b=civApply;civApply=function(u,o,T,t){if(t==='A'||t==='P')return tpApply(u,o,T,t);return b(u,o,T,t);};})();
function tpName(T,t){return t==='A'?(T.k==='aid'?T.org+'的救援隊':T.org):'記者'+T.nm+'（'+T.org+'）';}
function tpApply(u,o,T,t){var a=o.opt.act,side=u.side,place=placeTxt(T.x,T.y),L=polOf(u,'civ'),nm=tpName(T,t),txt,e;G.tpSusp=G.tpSusp||sA0();
  if(a==='guide'){T.esc=G.t+6*3600;T.escBy=u.id;txt=uName(u)+'護送'+nm+'（'+place+'），沿途不必因附近交戰停下';logE(side,'civ',txt,u.x,u.y,u.id);civEv('civ',side,txt,T.x,T.y,u.id,{dk:'tpguide'});attNear(T.x,T.y,8000,side,2);return;}
  if(a==='aid'){if(t==='A'){var hh=Math.min(T.hurt||0,3);T.hurt=(T.hurt||0)-hh;T.n+=Math.round(hh*0.5);}else if(T.st==='wia')T.back=Math.min(T.back||G.t+24*3600,G.t+6*3600);txt=uName(u)+'為'+nm+'提供醫療與掩護';logE(side,'civ',txt,u.x,u.y,u.id);civEv('civ',side,txt,T.x,T.y,u.id,{dk:'tpaid'});return;}
  if(a==='give'){if(t==='A'){var Lg=u.lg||logInit(u),kg=Math.min((Lg.food||0)*0.4,3000);if(kg<1){logE(side,'civ',uName(u)+'自己的存糧不足，無法分給'+nm,u.x,u.y,u.id);return;}Lg.food-=kg;T.food=(T.food||0)+kg/1000;txt=uName(u)+'把約 '+fmt(kg/1000,1)+' 噸糧食交給'+nm+'，由他們分送平民';}else{T.fav=(T.fav||0)+1;txt=uName(u)+'招待'+nm+'，提供交通與補給';}logE(side,'civ',txt,u.x,u.y,u.id);civEv('civ',side,txt,T.x,T.y,u.id,{dk:'tpgive'});return;}
  if(a==='release'){if(T.st!=='det'||T.detBy!==side)return;T.st=t==='A'?(T.st0&&T.st0!=='det'?T.st0:'go'):'ok';T.detT=0;txt=uName(u)+'釋放被拘留的'+nm;logE(side,'civ',txt,u.x,u.y,u.id);civEv('civ',side,txt,T.x,T.y,u.id,{dk:'tprel'});return;}
  if(a==='detain'){if(T.st!=='det')T.st0=T.st;T.st='det';T.detBy=side;T.detT=G.t+(L>=3?48:8)*3600;if(t==='P')T.relT=T.detT;if(t==='A')G.tpSusp[side]=Math.max(G.tpSusp[side]||0,G.t+24*3600);
    txt=uName(u)+'在'+place+'拘留'+nm+'盤查'+(L>=3?'（不讓對方聯繫外界，可能長期扣押）':'');logE(side,'civ','⚠ '+txt,u.x,u.y,u.id);e=civEv('civ',side,txt,T.x,T.y,u.id,{dk:'tpdet'});if(G.civ)G.civ.rep[side]=clamp(G.civ.rep[side]-3,0,100);if(L>=3){e.wc=1;warCrime(u,t==='A'?'aidw':'press',0,txt,true);}if(G.press)pressOn(e,u);return;}
  if(a==='intern'){if(T.st!=='det')T.st0=T.st;T.st='det';T.detBy=side;T.detT=1e15;if(t==='P')T.relT=1e15;if(t==='A')G.tpSusp[side]=Math.max(G.tpSusp[side]||0,G.t+3*86400);
    txt=uName(u)+'把'+nm+'扣押為人質（'+place+'）';logE(side,'civ','⚠ '+txt,u.x,u.y,u.id);e=civEv('crime',side,txt,T.x,T.y,u.id,{dk:'tphost',ord:true,wc:1});warCrime(u,t==='A'?'aidw':'press',T.n||1,txt,true);attNear(T.x,T.y,15000,side,-15);u.mor=clamp(u.mor-3,0,100);if(G.press)pressOn(e,u);if(G.onPause&&apOn('crime'))G.onPause('對第三方人員的違法行動');return;}
  if(a==='fire'){var k=1;if(t==='A'){k=Math.min(T.n,Math.max(1,Math.round(T.n*(0.4+0.4*rnd8()))));T.n-=k;T.hurt=(T.hurt||0)+k;if(G.civ)G.civ.aidK=(G.civ.aidK||0)+k;if(T.n<=1){T.st='dead';T.tD=G.t;}else{T.st='out';T.path=null;}}else{T.st='kia';}
    G.tpSusp[side]=Math.max(G.tpSusp[side]||0,G.t+7*86400);txt=uName(u)+'奉命向'+nm+'開火（'+place+'），'+(t==='A'?k+' 名救援人員死傷':'記者遇害');logE(side,'civ','⚠ '+txt,u.x,u.y,u.id);e=civEv('crime',side,txt,T.x,T.y,u.id,{dk:'tpkill',v:k,ord:true,wc:1});warCrime(u,t==='A'?'aidw':'press',k,txt,true);
    attNear(T.x,T.y,20000,side,-30);u.mor=clamp(u.mor-6,0,100);if(u.dis!==undefined)u.dis=clamp(u.dis-6,0,100);if(G.press)pressOn(e,u);if(G.onPause&&apOn('crime'))G.onPause('對第三方人員的違法行動');return;}}
/* 被拘留的援助團體停止工作，到期釋放；被拘留的記者到期釋放 */
(function(){var b=aidOne;aidOne=function(A){if(A.st==='det'){if(G.t>=A.detT){A.st=A.st0&&A.st0!=='det'?A.st0:'go';logE(-1,'aid',A.org+'的救援隊獲釋，恢復工作',A.x,A.y);}return;}return b(A);};})();
(function(){var b=churchOne;churchOne=function(A){if(A.st==='det'){if(G.t>=A.detT){A.st='work';logE(-1,'aid',A.org+'的人員獲釋',A.x,A.y);}return;}return b(A);};})();
(function(){var b=pressStep;pressStep=function(){if(G.press)G.press.R.forEach(function(R){if(R.st==='det'&&R.relT&&G.t>=R.relT){R.st='ok';R.relT=0;logE(R.host,'press','記者'+R.nm+'（'+R.org+'）獲釋');}});return b();};})();

/* ---------- 接上模擬：每 10 分鐘構工、每 30 分鐘檢查遷移 ---------- */
function v9Step(){if(G.step%20===7)awStep();if(G.step%60===23)awRelocate(false);else if(G.step%20===3)awRelocate(true);}
(function(){var b=v8Step;v8Step=function(){b();v9Step();};})();
