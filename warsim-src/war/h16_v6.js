/* ===================== v6：海上部隊自動配船、砲兵試射校正、偵察與情報來源、雷達與匿蹤、防空壓制、岸置反艦飛彈、長期作戰、民用補給設施 ===================== */
APDEF.fac=false;APDEF.sead=false;
function uxOf(u){return u&&u.mix&&u.mix.length?utx(u.mix[0][0]):{};}

/* ---------- 在海上的陸軍單位：配屬運輸艦；接到以陸地為目標的命令後，運輸艦駛往最近的海岸讓部隊登陸 ---------- */
function onWater(x,y){var MP=G.map,k=cellAt(x,y);return isWater(MP.lc[k])&&!MP.rd[k];}
function landNear(x,y,R){var MP=G.map,cs=MP.cs,GW=MP.GW,GH=MP.GH,cx=Math.floor(x/cs),cy=Math.floor(y/cs),Rc=Math.ceil((R||40000)/cs);
  for(var r=1;r<=Rc;r++){var best=null,bd=1e18;for(var i=-r;i<=r;i++){var P=[[cx+i,cy-r],[cx+i,cy+r],[cx-r,cy+i],[cx+r,cy+i]];for(var j=0;j<4;j++){var X=P[j][0],Y=P[j][1];if(X<0||Y<0||X>=GW||Y>=GH)continue;var k=Y*GW+X;if(isWater(MP.lc[k]))continue;var d=(X-cx)*(X-cx)+(Y-cy)*(Y-cy);if(d<bd){bd=d;best=[(X+0.5)*cs,(Y+0.5)*cs];}}}if(best)return best;}return null;}
/* 緊鄰海面的陸地格（灘頭候選），依地圖版本快取 */
function coastList(){var MP=G.map;if(MP._coast&&MP._coastV===(G._mapv||0))return MP._coast;var GW=MP.GW,GH=MP.GH,L=[],st=Math.max(1,Math.round(250/MP.cs)),DX=[1,1,0,-1,-1,-1,0,1],DY=[0,1,1,1,0,-1,-1,-1];
  for(var y=1;y<GH-1;y+=st)for(var x=1;x<GW-1;x+=st){var k=y*GW+x;if(isWater(MP.lc[k]))continue;for(var d=0;d<8;d++){if(seaWater(MP.lc[(y+DY[d])*GW+x+DX[d]])){L.push(k);break;}}}MP._coast=L;MP._coastV=G._mapv||0;return L;}
function beachFor(tx,ty){var L=coastList(),best=-1,bd=1e18;for(var i=0;i<L.length;i++){var p=cellXY(L[i]),d=(p[0]-tx)*(p[0]-tx)+(p[1]-ty)*(p[1]-ty);if(d<bd){bd=d;best=L[i];}}return best>=0?cellXY(best):null;}
/* 自動配屬、仍在海上待命或航行中的運輸艦（u 可以是運輸艦本身或船上的部隊） */
function autoCvyOf(u){var C=u.cvy?u:u.st==='ship'?uById(u.cvyId):null;return C&&C.cvy&&C.cvy.auto&&!C.cvy.done&&/^(hold|sail|go)$/.test(C.cvy.ph)?C:null;}
function autoTransport(L){if(!L.length)return null;var side=L[0].side,c=centroid(L),top=topOf(L[0]),tk=cvyType({}),t=UT[tk],X=utx(tk),men=sum(L,function(u){return u.men;}),veh=sum(L,function(u){return u.veh;}),
    ships=Math.max(1,Math.ceil(Math.max(men/(X.pax||1000),X.pv?veh/X.pv:0))),m=Math.max(1,Math.ceil(ships/Math.max(1,t.veh)));
  var C=addLeaf(side,tk,m,uName(top)+'運輸艦',-1,mb32(hstr('atr'+L[0].id+'|'+G.t))),p=validPos(ST(C),c[0],c[1]);C.x=p[0];C.y=p[1];C.hd=0;C.home=[p[0],p[1]];C.placed=1;C.form='march';C.ms='ok';C.task='hold';if(!C.lg)logInit(C);
  C.cvy={auto:1,ph:'hold',pax:L.map(function(u){return u.id;}),vp:C.veh,t0:G.t,nx:0,i:0,ex:p[0],ey:p[1]};C.cargoN=men;
  L.forEach(function(u){u.st='ship';u.cvyId=C.id;u.x=C.x;u.y=C.y;u.path=null;u.pq=0;u.goal=null;u.task=null;u.pend=[];u.mis=null;});
  /* 陸上兵力全部在船上的上級編制一起登船 */var seen={};L.forEach(function(u){ancestors(u).forEach(function(F){if(seen[F.id])return;seen[F.id]=1;var LL=leavesOf(F).filter(function(z){return alive(z)&&ST(z).dom==='land';});if(LL.length&&LL.every(function(z){return z.st==='ship';})){F.st='ship';F.cvyId=C.id;F.x=C.x;F.y=C.y;F.path=null;}});});
  reix();logE(side,'amph',uName(top)+'有 '+L.length+' 個單位位在海上，配屬 '+fmt(m*t.veh)+' 艘'+t.n.replace(/(分隊|船隊|隊)$/,'')+'：對船上部隊下達以陸地為目標的命令後，運輸艦會駛往最近的海岸讓部隊登陸',p[0],p[1],C.id);return C;}
function autoGo(C,tx,ty){var Q=C.cvy;if(!Q||!Q.auto||Q.done)return;if(onWater(tx,ty)){Q.ph='sail';Q.sx=tx;Q.sy=ty;Q.t0=G.t;cvyGo(C,tx,ty);return;}
  var b=beachFor(tx,ty),o=b?offshore(b[0],b[1]):null;if(!b||!o){if(!Q.noB||G.t-Q.noB>1800){Q.noB=G.t;logE(C.side,'amph',uName(C)+'找不到可以靠近的海岸',C.x,C.y,C.id);}return;}
  Q.bx=b[0];Q.by=b[1];Q.ox=o[0];Q.oy=o[1];Q.ph='go';Q.t0=G.t;Q.lx=C.x;Q.ly=C.y;Q.lt=G.t;cvyGo(C,o[0],o[1]);logE(C.side,'amph',uName(C)+'駛往'+placeTxt(b[0],b[1])+'外海，準備讓部隊登陸',C.x,C.y,C.id);}
/* 航行到海上目標後回到待命；駛不近灘頭（沒有航路）時就近以小艇送部隊上岸 */
function autoCvyStep(){G.units.forEach(function(C){var Q=C.cvy;if(!Q||!Q.auto||Q.done||C.st==='dead')return;var near=Math.max(900,G.map.cs*3);
  if(Q.ph==='sail'){if(dist(C.x,C.y,Q.sx,Q.sy)<near||(!C.path&&!C.pq&&G.t-Q.t0>600)){Q.ph='hold';C.task='hold';C.path=null;}return;}
  if(Q.ph==='go'){if(dist(C.x,C.y,Q.lx,Q.ly)>300){Q.lx=C.x;Q.ly=C.y;Q.lt=G.t;return;}if(G.t-Q.lt>1200&&dist(C.x,C.y,Q.ox,Q.oy)>=near){var p=landNear(C.x,C.y,60000);if(p){Q.bx=p[0];Q.by=p[1];}C.hd=Math.atan2(Q.by-C.y,Q.bx-C.x);Q.ph='unl';Q.nx=G.t;C.path=null;C.task='hold';logE(C.side,'amph',uName(C)+'無法駛近預定的灘頭，就近以小艇送部隊到'+placeTxt(Q.bx,Q.by)+'上岸',C.x,C.y,C.id);}}});}
/* 卸載完畢：自動配屬的運輸艦不附載補給，直接返航駛離 */
(function(){var b=cvyDone;cvyDone=function(C){var Q=C.cvy;if(!Q||!Q.auto){b(C);return;}var E=seaEntry(C.side,C.x,C.y);Q.ph='ret';Q.tr=G.t;logE(C.side,'amph',uName(C)+'卸載完畢，返航駛離戰區',C.x,C.y,C.id);if(E){Q.ex=E[0];Q.ey=E[1];cvyGo(C,E[0],E[1]);}else{C.st='off';C.gone=1;Q.done=1;}};})();
/* 編制在船上收到的命令：轄下部隊全部上岸後重新下達 */
(function(){var b=cvyLand;cvyLand=function(C,z,ax,ay){var A=ancestors(z);b(C,z,ax,ay);A.forEach(function(F){var o=F.ord;if(!o||!o.held||F.st==='ship'||!alive(F))return;if(leavesOf(F).some(function(l){return alive(l)&&l.st==='ship';}))return;o.held=0;activate(F,o);});};})();
(function(){var b=activate;activate=function(u,o){
  if(u.cvy&&u.cvy.auto&&!u.cvy.done&&o&&!o.cvySys){var Q=u.cvy;if(Q.ph==='unl'||Q.ph==='ret')return;if(o.x!==undefined&&!/^(halt|rest|reserve)$/.test(o.k)){u.ord=o;o.st='exec';o.t1=G.t;autoGo(u,o.x,o.y);return;}Q.ph='hold';b(u,o);return;}
  b(u,o);if(u.st==='ship'&&o){o.held=1;var C=autoCvyOf(u);if(C&&o.x!==undefined&&!/^(halt|rest|reserve)$/.test(o.k)&&(C.cvy.ph==='hold'||C.cvy.ph==='sail'))autoGo(C,o.x,o.y);}};})();
function embarkStuck(only){var MP=G.map,grp={};G.units.forEach(function(u){if(!alive(u)||u.st==='off'||u.st==='ship'||u.st==='lift'||u.amph||u.cvy||u.lift)return;if(only&&!only[u.id])return;var s=ST(u);if(s.dom!=='land'||!onWater(u.x,u.y))return;
    if(!isLeaf(u)){var LL=leavesOf(u).filter(function(z){return onMap(z)&&ST(z).dom==='land'&&!onWater(z.x,z.y);});if(LL.length){var cc=centroid(LL);u.x=cc[0];u.y=cc[1];u.path=null;}return;}
    /* 行進中（沿道路、橋梁）或正在規劃路線的部隊，只是位置暫時落在水面上 */if(u.path||u.pq)return;
    /* 緊鄰岸邊：直接移到陸上 */var nb=landNear(u.x,u.y,MP.cs*2);if(nb){var vp=validPos(s,nb[0],nb[1]);u.x=vp[0];u.y=vp[1];return;}
    /* 湖泊與河道：以舟船擺渡到最近的岸邊 */if(!seaWater(MP.lc[cellAt(u.x,u.y)])){var p=landNear(u.x,u.y,15000);if(p){u.x=p[0];u.y=p[1];u.path=null;u.goal=null;u.pq=0;logE(u.side,'amph',uName(u)+'以舟船擺渡到岸邊（'+placeTxt(u.x,u.y)+'）',u.x,u.y,u.id);}return;}
    var key=u.side+'|'+topOf(u).id;(grp[key]||(grp[key]=[])).push(u);});
  Object.keys(grp).forEach(function(k){var L=grp[k],C=autoTransport(L);if(!C)return;/* 已經有命令的部隊：直接出發 */var o=L.map(function(u){return u.ord;}).filter(function(q){return q&&q.x!==undefined&&q.st!=='done'&&!/^(halt|rest|reserve)$/.test(q.k);})[0];if(o){L.forEach(function(u){if(u.ord)u.ord.held=1;});autoGo(C,o.x,o.y);}});}
(function(){var b=arriveUnit;arriveUnit=function(F){b(F);var ids={};treeNodes(F).forEach(function(z){ids[z.id]=1;});embarkStuck(ids);};})();

/* ---------- 冷戰以前的砲兵：先試射校正（前進觀測、空中觀測或砲兵自己看得到），完成後才轉入效力射；預先標定的射擊點可直接效力射 ---------- */
function regNeed(u,s){var E=uEra(u);return E.i<=6&&!E.fan&&s.dom!=='air';}
function regTime(u,obs){var i=uEra(u).i,t=i<=3?240:i===4?900:i===5?1200:420;if(!obs)t*=2.5;if(hasQ(offOf(u),'arty'))t*=0.7;return t*clamp(1.25-0.005*(u.trn===undefined?60:u.trn),0.75,1.25);}
function regKnown(side,x,y){var R=G.reg&&G.reg[side];if(!R)return false;for(var i=R.length-1;i>=0;i--){var q=R[i];if(G.t-q.t<24*3600&&dist(q.x,q.y,x,y)<450)return true;}return false;}
function regAdd(side,x,y){G.reg=G.reg||sAL();var R=G.reg[side]||(G.reg[side]=[]);R.push({x:Math.round(x),y:Math.round(y),t:G.t});if(R.length>400)R.splice(0,R.length-400);}
/* 開戰前已標定的防禦射擊點：各部隊陣地前方 */
function regSeed(){G.reg=sAL();G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||ST(u).dom!=='land'||roleOf(u)!=='man')return;var h=u.hd||0;regAdd(u.side,u.x+Math.cos(h)*900,u.y+Math.sin(h)*900);});}
/* 觀測者看的是彈著的煙柱（離地約 10 公尺）；火藥時代砲兵要直接瞄準，必須看得到目標本身 */
function regObs(u,M){var i=uEra(u).i,R=i<=3?1200:2200,best=null;if(dist(u.x,u.y,M.x,M.y)<(i<=3?2500:5000)&&los(u.x,u.y,hgtOf(u)+2,M.x,M.y,i<=3?3:10))return u;
  if(!G._grid)gridBuild();gridNear(M.x,M.y,6000,function(o){if(best||o.side!==u.side||!onMap(o)||o===u)return;var s=ST(o),d=dist(o.x,o.y,M.x,M.y);if(s.dom==='air'){if(o.st==='air'&&s.fl.indexOf('r')>=0&&d<6000)best=o;return;}if(s.dom!=='land'||d>=R)return;if(los(o.x,o.y,hgtOf(o)+2,M.x,M.y,10))best=o;});return best;}
(function(){var b=artyFire;artyFire=function(u,s,M){if(M.reg||!regNeed(u,s)||(M.kind==='cb'&&uEra(u).i>=6)){b(u,s,M);return;}
    if(!M.rg){if(regKnown(u.side,M.x,M.y)){M.reg=1;b(u,s,M);return;}var ob=regObs(u,M);
      if(!ob&&uEra(u).i<=3){if(!u.noObsLog||G.t-u.noObsLog>1800){u.noObsLog=G.t;logE(u.side,'arty',uName(u)+'看不到目標，沒有觀測無法射擊（'+placeTxt(M.x,M.y)+'）',u.x,u.y,u.id);}return;}
      var need=regTime(u,ob);M.rg={t0:G.t,need:need,obs:ob?ob.id:0};M.until+=need;
      if(!u.rgLog||G.t-u.rgLog>900){u.rgLog=G.t;logE(u.side,'arty',uName(u)+'開始試射校正'+(ob?(ob===u?'（直接觀測）':'（由'+uName(ob)+'觀測修正）'):'（沒有前進觀測，只能依地圖概略修正）')+'，約 '+durTxt(need)+' 後轉入效力射',u.x,u.y,u.id);}}
    if(G.t-M.rg.t0<M.rg.need){/* 試射：零星的校正彈，殺傷很小，但會讓目標警覺、也會暴露砲兵陣地 */if(G.step%3===0)b(u,s,Object.assign({},M,{mul:(M.mul||1)*0.15,kind:M.kind==='sat'?'bombard':M.kind}));return;}
    M.reg=1;regAdd(u.side,M.x,M.y);logE(u.side,'arty',uName(u)+'校正完成，轉入效力射（'+placeTxt(M.x,M.y)+'）',u.x,u.y,u.id);b(u,s,M);};})();

/* ---------- 偵察：偵察單位更隱蔽、看得更遠、識別更準、回報更快；另有電子偵測、民眾通報與雷達監視網等情報來源 ---------- */
function isRcn(u){var s=ST(u);return s.fl.indexOf('r')>=0||s.br==='rec';}
(function(){var b=spotOf;spotOf=function(u,s){var r=b(u,s);if(r>0&&(s.fl.indexOf('r')>=0||s.br==='rec'))r*=s.dom==='air'?1.15:1.35;return r;};
  var b2=sigOf;sigOf=function(t,ts,air){var f=b2(t,ts,air);if((ts.fl.indexOf('r')>=0||ts.br==='rec')&&G.t-(t.fired||-1e9)>=70)f*=0.55;return f;};
  var b3=reportDelay;reportDelay=function(o){var d=b3(o);return isRcn(o)?d*0.5:d;};})();
/* 電子偵測：電子戰與無線電偵聽單位以測向找出敵方司令部的通信，以及開機中的防空雷達（雷達可精確識別） */
function sigintStep(){var y=G.set.y||0;if(y<1915)return;SIDES().forEach(function(side){var E=G.units.filter(function(u){return u.side===side&&onMap(u)&&isLeaf(u)&&(ST(u).fl.indexOf('E')>=0||uxOf(u).sigint);});if(!E.length)return;var R=y>=1970?60000:30000,Q=G.rq[side];
  G.units.forEach(function(t){if(t.side===side||!onMap(t)||!hostile(side,t.side))return;var rad=!!samOf(t)&&radarOK(t)&&t.emcon===0,hq=isLeaf(t)?ST(t).fl.indexOf('h')>=0:true;if(!rad&&!hq)return;var e=null;for(var i=0;i<E.length;i++)if(dist(E[i].x,E[i].y,t.x,t.y)<R){e=E[i];break;}if(!e||rnd()>(rad?0.8:0.35))return;
    var err=rad?400:1500;Q.push({at:G.t+(rad?60:600),id:t.id,x:t.x+(rnd()-0.5)*err,y:t.y+(rnd()-0.5)*err,t:G.t,q:rad?1:0.5,by:e.id});});});}
/* 民眾通報：對本方友善的聚落回報附近的敵軍（半小時到一個半小時後才傳到） */
function humintStep(){if(!G.civ)return;G.civ.S.forEach(function(g){if(g.loy!==0&&g.loy!==1)return;if(civPresent(g)<50)return;var side=g.loy,Q=G.rq[side],R=g.r+2500;gridNear(g.x,g.y,R,function(t){if(t.side===side||!onMap(t)||!isLeaf(t))return;var ts=ST(t);if(ts.dom!=='land'||ts.fl.indexOf('G')>=0||dist(t.x,t.y,g.x,g.y)>R||rnd()>0.25)return;Q.push({at:G.t+1800+rnd()*3600,id:t.id,x:t.x+(rnd()-0.5)*1200,y:t.y+(rnd()-0.5)*1200,t:G.t,q:0.5,by:0});});});}

/* ---------- 空中監視網：防空飛彈雷達、空中預警機、艦艇與戰機雷達；匿蹤縮短被偵測的距離，電子干擾再打折 ---------- */
function rcsOf(a){var r=1;(a.mix||[]).forEach(function(m){var x=utx(m[0]);if(x.rcs!==undefined)r=Math.min(r,x.rcs);});if(ST(a).fl.indexOf('A')>=0)r*=0.6;if(!featU('stealth',a))r=Math.max(r,0.6);return r;}
/* 機制年份：依戰役年代與該單位裝備的年代中較晚者判定（刻意放進早期戰場的現代單位仍保有它的裝備） */
function utYear(u){var y=0;(u.mix&&u.mix.length?u.mix:[[u.hq]]).forEach(function(m){var r=/(1[5-9][0-9]{2}|20[0-9]{2})/.exec(m[0]||'');if(r)y=Math.max(y,+r[1]);});if(!y){var E=uEra(u);y=E&&E.y||0;}return y;}
function featU(k,u){if(typeof featOn!=='function')return true;return featOn(k,Math.max(G.set.y||0,u?utYear(u):0));}
function samOf(u){var x=uxOf(u);return x.sam&&featU('sam',u)?x:null;}
function radarOK(g){return !(g.radDmg&&G.t<g.radDmg);}
function aaRangeU(g,AA){var x=uxOf(g);return x.rng||aaRange(AA);}
function jamF(side,x,y){if(!G._jam)return 1;var L=hostSides(side);for(var k=0;k<L.length;k++){var J=G._jam[L[k]];if(!J||!J.length)continue;for(var i=0;i<J.length;i++)if(dist(J[i].x,J[i].y,x,y)<40000)return 0.6;}return 1;}
function sensorR(g){var s=ST(g),x=uxOf(g),y=G.set.y||1943;if(x.sam)return onMap(g)&&radarOK(g)&&g.emcon===0?x.rad:0;if(s.fl.indexOf('a')>=0)return g.st==='air'?(x.rad||300000):0;if(s.dom==='sea'&&s.aa>=9&&y>=1940&&onMap(g))return s.spot;if(s.dom==='air'&&g.st==='air'&&s.aa>=8&&y>=1960)return s.spot;return 0;}
function trkStep(){var A=G.units.filter(function(u){return u.st==='air'&&alive(u);});G._trk=sAO();G._jam=sAL();G._air=A;if(!A.length)return;A.forEach(function(a){if(ST(a).fl.indexOf('E')>=0&&G._jam[a.side])G._jam[a.side].push(a);});
  G.units.forEach(function(g){if(!alive(g)||g.st==='off'||g.st==='ship')return;var R=sensorR(g);if(!R)return;var tr=G._trk[g.side],jf=jamF(g.side,g.x,g.y);A.forEach(function(a){if(a.side===g.side||tr[a.id])return;if(dist(g.x,g.y,a.x,a.y)<=R*rcsOf(a)*jf)tr[a.id]=g.id;});});
  /* 雷達航跡回報到本方情報圖：1975 年後有資料鏈，幾乎即時 */
  if(G.step%4===0){var yr=G.set.y||0;SIDES().forEach(function(side){var tr=G._trk[side],Q=G.rq[side];for(var id in tr){var a=uById(+id);if(a)Q.push({at:G.t+(featOn('awacs',yr)?30:featOn('radar',yr)?120:300),id:a.id,x:a.x,y:a.y,t:G.t,q:yr>=1975?1:0.5,by:tr[id]});}});}}
/* 地面防空能否攻擊這架飛機：雷達導引飛彈要自己的雷達開機、放列完成並鎖定；艦艇有搜索雷達；火砲與光學、紅外線瞄準只看得到近處的匿蹤機 */
function aaSees(g,a,d){var x=samOf(g),rc=rcsOf(a);if(x){if(!radarOK(g)||g.emcon!==0||g.form==='march'||g.formTo)return false;return d<=Math.min(x.rng,x.rad*rc*jamF(g.side,g.x,g.y));}if(rc>=0.9)return true;var s=ST(g);if(s.dom==='sea'&&s.aa>=9&&(G.set.y||0)>=1960)return d<=Math.max(3000,s.spot*rc*jamF(g.side,g.x,g.y));return d<=3000;}
/* 空戰：目視距離內，或自己的雷達、預警機與資料鏈看得到，才能接戰 */
function airSees(f,e,d){var rc=rcsOf(e),s=ST(f),yr=G.set.y||1943,vis=(G.env.light>=0.3?5000:s.nv>=1?3000:1500)*clamp(rc*1.5,0.5,1);if(d<=vis)return true;if(yr>=1960&&s.aa>=8&&d<=s.spot*rc*jamF(f.side,f.x,f.y))return true;if(featOn('awacs',yr)&&G._trk&&G._trk[f.side]&&G._trk[f.side][e.id])return true;return false;}
/* 先看到、先開火：對方看不到自己時，命中率提高 */
function firstLook(f,e,d){return airSees(e,f,d)?1:1.6;}
/* 防空飛彈雷達（自動、常開、靜默）：自動模式在本方情報圖或雷達網發現敵機接近時才開機；偵測到反輻射飛彈時關機規避 */
function samStep(){var A=G._air||[];G.units.forEach(function(g){var x=samOf(g);if(!x||!alive(g)||g.st==='off')return;if(!radarOK(g)){g.emcon=1;return;}var mode=g.radMode||'auto',was=g.emcon;
    if(mode==='off'||g.form==='march'&&!g.formTo)g.emcon=1;else if(mode==='on')g.emcon=0;else if(g.emT&&G.t<g.emT)g.emcon=1;else{var R=x.rng*1.6,C=G.ct[g.side],thr=false,tr=G._trk&&G._trk[g.side];for(var id in C){var c=C[id];if(c.dom!=='air'||c.dead||G.t-c.t>150)continue;if(dist(c.x,c.y,g.x,g.y)<R){thr=true;break;}}
      if(!thr&&tr)for(var i=0;i<A.length;i++){var a=A[i];if(hostile(g.side,a.side)&&tr[a.id]&&dist(a.x,a.y,g.x,g.y)<R){thr=true;break;}}g.emcon=thr?0:1;}
    if(was!==0&&g.emcon===0&&(!g.emLog||G.t-g.emLog>1800)){g.emLog=G.t;logE(g.side,'aa',uName(g)+'雷達開機，追蹤來襲的敵機',g.x,g.y,g.id);}});}
/* 反輻射飛彈：防空壓制機以雷達告警與定位系統鎖定開機中的雷達；雷達關機會讓飛彈失去導引（新型有座標記憶） */
function armStep(){if(G.step%2===0)(G._air||[]).forEach(function(a){var x=uxOf(a);if(!x.arm||!featU('arm',a)||!alive(a)||a.ms==='rout'||a.task==='rtb')return;if(a.armN===undefined)a.armN=x.arm.n*Math.max(1,Math.round(a.veh0||1));if(a.armN<=0||G.t-(a.armT||-1e9)<300)return;
    var best=null,bd=x.arm.r;G.units.forEach(function(g){if(g.side===a.side||!onMap(g)||!samOf(g)||!radarOK(g)||g.emcon!==0)return;var d=dist(a.x,a.y,g.x,g.y);if(d<bd){bd=d;best=g;}});if(!best)return;
    var n=Math.min(a.armN,Math.max(2,Math.round(a.veh*0.5)));a.armN-=n;a.armT=G.t;(G.arm=G.arm||[]).push({side:a.side,src:a.id,tid:best.id,x:best.x,y:best.y,n:n,x0:a.x,y0:a.y,t0:G.t,eta:G.t+Math.max(DT,bd/x.arm.v),mem:x.arm.mem});var st=G.stats[a.side];st.arm=(st.arm||0)+n;
    logE(a.side,'air','⚡ '+uName(a)+'對'+uName(best)+'的雷達發射 '+n+' 枚反輻射飛彈',a.x,a.y,a.id);if(G.onPause&&apOn('sead'))G.onPause('反輻射飛彈發射');
    if(best.radMode!=='on'&&rnd()<clamp((best.trn||60)/100*0.85,0.2,0.85)){best.emT=G.t+600+rnd()*600;best.emcon=1;logE(best.side,'aa',uName(best)+'偵測到反輻射飛彈來襲，關閉雷達規避',best.x,best.y,best.id);}});
  if(!G.arm||!G.arm.length)return;var keep=[];G.arm.forEach(function(M){if(G.t<M.eta){keep.push(M);return;}var t=uById(M.tid);if(!t||!alive(t))return;var on=radarOK(t)&&t.emcon===0,moved=dist(t.x,t.y,M.x,M.y)>300,p=on?0.75:(M.mem&&!moved?0.45:0.06),h=0,src=uById(M.src);for(var i=0;i<M.n;i++)if(rnd()<p)h++;
    if(h){t.radDmg=G.t+(4+2*h)*3600;t.emcon=1;hit(t,src,Math.min(t.men,t.men*0.04*h),Math.min(t.veh,t.veh*0.15*h),40,'msl');logE(M.side,'air','⚡ 反輻射飛彈命中'+uName(t)+'的雷達（'+h+' 枚），防空網出現缺口',t.x,t.y,t.id);logE(t.side,'aa',uName(t)+'的雷達被反輻射飛彈擊毀，約 '+durTxt(t.radDmg-G.t)+' 後才能修復或換裝',t.x,t.y,t.id);if(G.onPause&&apOn('sead'))G.onPause('防空雷達被擊毀');}
    else logE(M.side,'air','反輻射飛彈沒有命中'+uName(t)+(on?'':'（雷達已關機）'),t.x,t.y,t.id);G._mslv=(G._mslv||[]).concat([{t:G.t,x:M.x,y:M.y,x0:M.x0,y0:M.y0,side:M.side,n:M.n,h:h,s:0}]).slice(-30);});G.arm=keep;}
function armReload(){G.units.forEach(function(a){var x=uxOf(a);if(x.arm&&a.st==='base'&&alive(a)&&(!a.readyT||G.t>=a.readyT))a.armN=x.arm.n*Math.max(1,Math.round(a.veh||1));});}
/* 岸置反艦飛彈：自動攻擊射程內、情報圖上已知的敵艦（電腦指揮的艦艇也會自動攻擊） */
function asmAuto(){G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||u.ms==='rout')return;var q=mslSpec(u);if(!q||!q.ship||!mslLeft(u))return;var s=ST(u);if(s.dom!=='land'&&!SD(u.side).ai)return;if(G.t-(u.asmT||-1e9)<1800||(u.ord&&u.ord.k==='msl'&&u.ord.st!=='done'))return;
  var C=G.ct[u.side],best=null,bd=q.r;for(var id in C){var c=C[id];if(c.dead||c.dom!=='sea'||G.t-c.t>600)continue;var d=dist(u.x,u.y,c.x,c.y);if(d<bd){bd=d;best=c;}}if(!best)return;u.asmT=G.t;mslLaunch(u,{x:best.x,y:best.y,n:Math.min(s.dom==='land'?2:4,mslLeft(u))});});}

/* ---------- 回放紀錄自動降低密度（補充兵與裝備修復見「補員與車輛修復」） ---------- */
(function(){var b=recStep;recStep=function(){b();var R=G.rec;if(!R||!R.fr)return;var cap=clamp(Math.round(4e7/Math.max(1,G.units.length*12)),600,3000);if(R.fr.length>cap){var n=R.fr.length,keep=Math.floor(n*0.75);R.fr=R.fr.filter(function(f,i){return i>=keep||i%2===0;});R.dt=Math.min(1800,Math.round(R.dt*1.5));}};})();

/* ---------- 民用補給設施：港口、鐵路車站、機場、倉庫。依地形與聚落配置在戰場上，開戰時中立，部隊佔領後才可作為補給節點 ---------- */
var FACN={port:'港口',rail:'鐵路車站',air:'機場',depot:'倉庫'};
function facById(id){return (G.fac||[]).filter(function(F){return F.id===id;})[0]||null;}
/* 與地圖邊緣相連的最大一片海（外海）：港口必須臨外海，船隻才進得來；內陸的鹹水湖或封閉的海灣不算 */
var SEAMC={mp:null,m:null};
function seaMain(MP){if(SEAMC.mp===MP&&SEAMC.m&&SEAMC.m.length===MP.GW*MP.GH)return SEAMC.m;var GW=MP.GW,GH=MP.GH,N=GW*GH,lc=MP.lc,lab=new Int32Array(N),stk=new Int32Array(N),id=0,best=0,bn=0;
  var sw=function(q){return lc[q]===LCI.sea||lc[q]===LCI.shal;};
  var fill=function(s0){id++;var n=0,top=0;stk[top++]=s0;lab[s0]=id;while(top){var k=stk[--top],x=k%GW,yy=(k/GW)|0;n++;var nb=[x>0?k-1:-1,x<GW-1?k+1:-1,yy>0?k-GW:-1,yy<GH-1?k+GW:-1];for(var i=0;i<4;i++){var q=nb[i];if(q<0||lab[q]||!sw(q))continue;lab[q]=id;stk[top++]=q;}}return n;};
  var edge=[];for(var x=0;x<GW;x++){edge.push(x,(GH-1)*GW+x);}for(var y2=0;y2<GH;y2++){edge.push(y2*GW,y2*GW+GW-1);}
  edge.forEach(function(k){if(lab[k]||!sw(k))return;var n=fill(k);if(n>bn){bn=n;best=id;}});var M=new Uint8Array(N);if(best)for(var k=0;k<N;k++)if(lab[k]===best)M[k]=1;SEAMC.mp=MP;SEAMC.m=M;return M;}
function facGen(MP,y){var cs=MP.cs,GW=MP.GW,GH=MP.GH,lc=MP.lc,out=[],id=0,DX=[1,1,0,-1,-1,-1,0,1],DY=[0,1,1,1,0,-1,-1,-1];y=y||1943;
  function near(x,yy,R,pred){var cx=Math.floor(x/cs),cy=Math.floor(yy/cs),Rc=Math.max(1,Math.ceil(R/cs)),best=-1,bd=1e18;for(var b=-Rc;b<=Rc;b++)for(var a=-Rc;a<=Rc;a++){var X=cx+a,Y=cy+b;if(X<0||Y<0||X>=GW||Y>=GH)continue;var d=a*a+b*b;if(d>Rc*Rc||d>=bd)continue;var k=Y*GW+X;if(pred(k)){bd=d;best=k;}}return best;}
  /* 臨水：海面；大型（big）另含大河與湖泊 */function adjW(k,big){var x=k%GW,yy=(k/GW)|0;for(var d=0;d<8;d++){var X=x+DX[d],Y=yy+DY[d];if(X<0||Y<0||X>=GW||Y>=GH)continue;var q=Y*GW+X,c=lc[q];if(c===LCI.sea||c===LCI.shal)return true;if(big&&(c===LCI.lake||c===LCI.riv&&MP.rv[q]>=3))return true;}return false;}
  function xy(k){return [(k%GW+0.5)*cs,(((k/GW)|0)+0.5)*cs];}
  function add(k,p,name,s,ex){out.push(Object.assign({id:++id,k:k,x:p[0],y:p[1],name:name,set:s?s.name:'',own:-1,cand:-1,ct:0,kn:sAV(-1),st0:facStock(k,s,y)},ex||{}));}
  var SS=(MP.set||[]).slice().sort(function(a,b){return b.pop-a.pop;});
  SS.forEach(function(s){var sx=s.x*cs,sy=s.y*cs,R=Math.max(400,s.r||300),big=s.kind!=='village';
    /* 倉庫：城鎮的糧倉、市場倉儲與油庫 */if(big||s.pop>=1500){var wk=near(sx,sy,R,function(k){return isUrban(lc[k]);});if(wk<0)wk=near(sx,sy,R,function(k){return !isWater(lc[k]);});if(wk>=0)add('depot',xy(wk),s.name+(y<1850?'糧倉':'倉庫'),s);}
    /* 港口：港區碼頭；沒有碼頭的臨海（河港、雙子城另含大河與湖泊）市鎮在 1600 年後有小港 */var pk=near(sx,sy,R*1.3,function(k){return lc[k]===LCI.port&&adjW(k,true);});
    if(pk<0&&big&&y>=1600)pk=near(sx,sy,R*1.1,function(k){return !isWater(lc[k])&&adjW(k,s.sty==='river'||s.sty==='twin');});if(pk>=0)add('port',xy(pk),s.name+'港',s);
    /* 鐵路車站：鐵路經過的聚落（1830 年起），優先調車場 */if(typeof featOn==='function'?featOn('rail',y):y>=1830){var rk=near(sx,sy,R*1.2,function(k){return lc[k]===LCI.rly&&(MP.rl[k]&1);});if(rk<0&&(big||s.pop>=600))rk=near(sx,sy,R,function(k){return (MP.rl[k]&1)&&!isWater(lc[k]);});if(rk>=0)add('rail',xy(rk),s.name+'車站',s);}});
  /* 臨海地區至少有一個港口：沒有臨海市鎮時，在較大聚落附近、靠近道路的海岸設一個小港（村落為漁港） */
  if(y>=1600&&!out.some(function(f){return f.k==='port';})){var SM=seaMain(MP),hasSea=false;for(var q0=0;q0<GW*GH;q0+=3){if(SM[q0]){hasSea=true;break;}}
    var adjM=function(k){var x=k%GW,yy=(k/GW)|0;for(var d=0;d<8;d++){var X=x+DX[d],Y=yy+DY[d];if(X<0||Y<0||X>=GW||Y>=GH)continue;if(SM[Y*GW+X])return true;}return false;};
    if(hasSea){var bestP=null,bsP=1e18,Rr=Math.max(1,Math.round(600/cs));SS.slice(0,8).forEach(function(s){var Rc=Math.ceil(6000/cs),cx=Math.floor(s.x),cy=Math.floor(s.y);for(var b=-Rc;b<=Rc;b++)for(var a=-Rc;a<=Rc;a++){var X=cx+a,Y=cy+b;if(X<0||Y<0||X>=GW||Y>=GH)continue;var d=Math.sqrt(a*a+b*b)*cs;if(d>6000)continue;var k=Y*GW+X;if(isWater(lc[k])||!adjM(k))continue;
        var rdd=MP.rd[k]?0:1e4;if(rdd)for(var b2=-Rr;b2<=Rr;b2++)for(var a2=-Rr;a2<=Rr;a2++){var X2=X+a2,Y2=Y+b2;if(X2<0||Y2<0||X2>=GW||Y2>=GH)continue;if(MP.rd[Y2*GW+X2]){var d2=Math.sqrt(a2*a2+b2*b2)*cs;if(d2<rdd)rdd=d2;}}
        var sc=d*(s.kind==='village'?1.6:1)+Math.min(rdd,3000)*3;if(sc<bsP){bsP=sc;bestP={k:k,s:s};}}});
      if(bestP)add('port',xy(bestP.k),bestP.s.name+(bestP.s.kind==='village'?'漁港':'港'),bestP.s);}}
  /* 機場：1914 年起，在較大市鎮外找平坦開闊、長度足夠、沒有河流與道路穿越的跑道地；數量依地圖面積 */
  if(typeof featOn==='function'?featOn('airfield',y):y>=1914){var maxA=clamp(Math.round(MP.Wm*MP.Hm/1e6/700),1,6),nA=0,L=y<1930?500:y<1950?1400:2400;SS.filter(function(s){return s.kind!=='village'&&(y>=1930||s.kind==='city'||s.pop>=4000);}).forEach(function(s){if(nA>=maxA)return;var site=airSite(MP,s.x*cs,s.y*cs,L);if(site&&!out.some(function(f){return f.k==='air'&&dist(f.x,f.y,site[0],site[1])<8000;})){add('air',[site[0],site[1]],s.name+'機場',s,{ang:site[2],len:L});nA++;}});}
  return out;}
function facStock(k,s,y){var p=s?s.pop:1000,fuel=y>=1910;return k==='depot'?{food:p*0.015,ammo:0,fuel:fuel?p*0.006:0,fod:y<1950?p*0.01:0}:k==='port'?{food:p*0.01+20,ammo:0,fuel:fuel?p*0.008+10:0,fod:0}:k==='rail'?{food:15,ammo:0,fuel:fuel?10:0,fod:y<1950?10:0}:{food:5,ammo:0,fuel:30,fod:0};}
/* 跑道地：開闊地（農田、草地、灌叢、沙漠、苔原、樹籬農田）、坡度小、高差小；離市鎮 1.5～7 公里，以 3 公里左右為佳 */
function airSite(MP,x,y,L){var cs=MP.cs,GW=MP.GW,GH=MP.GH,OPEN={},best=null,bs=1e18,stp=Math.max(cs*0.7,60);['field','mead','scrub','desert','tund','hedge'].forEach(function(n){if(LCI[n]!==undefined)OPEN[LCI[n]]=1;});
  function ok(px,py,e0){var X=Math.floor(px/cs),Y=Math.floor(py/cs);if(X<1||Y<1||X>=GW-1||Y>=GH-1)return false;var k=Y*GW+X;if(!OPEN[MP.lc[k]]||MP.rv[k]||MP.ft[k]||MP.rd[k]||(MP.rl[k]&1))return false;var e=MP.el[k];return Math.abs(MP.el[k+1]-e)<cs*0.025&&Math.abs(MP.el[k+GW]-e)<cs*0.025&&Math.abs(e-e0)<12;}
  for(var r=1500;r<=7000&&!(best&&r>4000);r+=500)for(var a=0;a<16;a++){var ang=a/16*2*PI,cx=x+Math.cos(ang)*r,cy=y+Math.sin(ang)*r;if(cx<cs*3||cy<cs*3||cx>MP.Wm-cs*3||cy>MP.Hm-cs*3)continue;var e0=MP.el[Math.floor(cy/cs)*GW+Math.floor(cx/cs)];
    for(var o=0;o<4;o++){var t=o/4*PI,dx=Math.cos(t),dy=Math.sin(t),good=true;for(var s=-L/2;s<=L/2&&good;s+=stp)for(var w=-60;w<=60&&good;w+=60)if(!ok(cx+dx*s-dy*w,cy+dy*s+dx*w,e0))good=false;if(good){var sc=Math.abs(r-3000);if(sc<bs){bs=sc;best=[cx,cy,t];}}}}return best;}
function facNode(F){if(!F||F.own<0)return null;return (SD(F.own).nodes||[]).filter(function(n){return n.fac===F.id;})[0]||null;}
function facTake(F,side,quiet){var prev=F.own,N=facNode(F),st=N?N.st:F.st0,keep=prev>=0?0.5:1;if(N)SD(prev).nodes=SD(prev).nodes.filter(function(q){return q!==N;});
  addNode(side,F.k,F.x,F.y,{name:F.name,fac:F.id,st:{food:(st.food||0)*keep,ammo:(st.ammo||0)*keep,fuel:(st.fuel||0)*keep,fod:(st.fod||0)*keep}});F.own=side;F.cand=-1;F.tOwn=G.t;F.kn=F.kn||sAV(-1);F.kn[side]=side;F.knT=F.knT||sA0();F.knT[side]=G.t;
  /* 第一次被軍隊佔領：徵用城鎮的民間存糧與燃料，居民的存糧減少、不滿升高 */
  if(prev<0&&G.civ&&F.set){var g=null,bd=1e18;G.civ.S.forEach(function(q){if(q.n!==F.set)return;var d=dist(q.x,q.y,F.x,F.y);if(d<bd){bd=d;g=q;}});if(g&&(F.k==='depot'||F.k==='port')){g.food=Math.max(0,(g.food||0)-(F.k==='depot'?6:2));g.unrest=clamp((g.unrest||0)+5,0,100);var v=(g.val0||0)*(F.k==='depot'?0.01:0.004);if(v>0){g.loss=(g.loss||0)+v;G.civ.prop.other+=v;G.civ.cs[side].prop+=v;}}}
  if(!quiet){logE(side,'log',(prev<0?'佔領':'奪取')+FACN[F.k]+'「'+F.name+'」'+(prev<0?(F.k==='depot'||F.k==='port'?'，徵用其中的民間物資':'')+'，啟用為補給節點':'（敵軍撤離前約一半物資損毀），改為本方補給節點'),F.x,F.y);if(prev>=0){logE(prev,'log',FACN[F.k]+'「'+F.name+'」落入敵手',F.x,F.y);if(G.onPause&&apOn('fac'))G.onPause('補給設施易手');}}}
/* 佔領判定：設施附近只有一方的地面部隊，持續 10 分鐘；4 公里內有部隊的一方會得知設施目前由誰控制 */
function facStep(){(G.fac||[]).forEach(function(F){var R=F.k==='air'?1800:F.k==='port'?1300:1000,n=sA0(),sn=sA0();gridNear(F.x,F.y,4000,function(u){if(!onMap(u)||!isLeaf(u))return;var s=ST(u);if(s.dom!=='land')return;var d=dist(u.x,u.y,F.x,F.y);if(d>4000||!(u.side>=0))return;sn[u.side]=1;if(d>R||u.ms==='rout'||s.fl.indexOf('u')>=0)return;n[u.side]+=u.men+u.veh*4;});
  F.kn=F.kn||sAV(-1);F.knT=F.knT||sA0();for(var i=0;i<sn.length;i++)if(sn[i]){F.kn[i]=F.own;F.knT[i]=G.t;}
  var hold=-1,np=0,nb=0;for(var hi=0;hi<n.length;hi++){if(n[hi]>0)np++;if(n[hi]>15)hold=hold<0?hi:-2;else if(n[hi]>=1)nb++;}if(hold<0||nb>0)hold=-1;F.cont=np>=2;if(hold>=0&&hold!==F.own){if(F.cand!==hold){F.cand=hold;F.ct=G.t;}else if(G.t-F.ct>=600)facTake(F,hold);}else F.cand=-1;});}
/* 想定指定某方一開始就控制的設施（附近沒有同類設施就在該處建立） */
function facClaim(side,k,x,y,name,st){G.fac=G.fac||facGen(G.map,G.set.y);var F=null,bd=3500;G.fac.forEach(function(f){if(f.k!==k)return;var d=dist(f.x,f.y,x,y);if(d<bd){bd=d;F=f;}});
  if(!F){F={id:G.fac.reduce(function(m,f){return Math.max(m,f.id);},0)+1,k:k,x:x,y:y,name:name||FACN[k],set:'',own:-1,cand:-1,ct:0,kn:sAV(-1),st0:facStock(k,null,G.set.y)};G.fac.push(F);}
  if(name)F.name=name;if(st)F.st0=st;if(F.own!==side)facTake(F,side,true);F.kn=[side,side];return F;}
(function(){var b=prepareBattle;prepareBattle=function(){b.apply(null,arguments);if(!G||!G.map)return;if(!G.fac)G.fac=facGen(G.map,G.set.y);if(G.set.sustain===undefined)G.set.sustain=true;embarkStuck();regSeed();};})();

function v6Pre(){trkStep();if(G.step%2===1)samStep();}
function v6Step(){/* v6 以前的存檔：補上民用設施 */if(!G.fac&&G.map)G.fac=facGen(G.map,G.set.y);autoCvyStep();armStep();if(G.step%10===6)asmAuto();if(G.step%4===2)facStep();if(G.step%10===8)sigintStep();if(G.step%20===12)humintStep();if(G.step%20===16)embarkStuck();if(G.step%120===9)armReload();}
