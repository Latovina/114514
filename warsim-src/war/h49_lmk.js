/* ===================== 更多地標：核電站（管制區）、大學、中學、小學、警察局、消防局、商業大樓、市政廳、體育場、博物館；工業區與公園的名稱 =====================
   都是設施（G.fac）：依年代與聚落規模配置，開戰時中立，可以佔領、被砲擊與轟炸、被摧毀。
   核電站：1977 年起受日內瓦公約第一附加議定書保護（含危險力量的工程設施）；受損嚴重時爐心熔毀，放射性物質外洩，順風漂散並長期污染地面，附近平民撤離。
   學校、大學（海牙公約）與博物館（1954 年文化財產公約）：受保護的建築，平民在此避難，攻擊是戰爭罪行。
   警察局：存有輕武器彈藥，佔領後成為小型彈藥補給點；控制的一方在附近的部隊比較少發生搶劫與傷害平民的事件。
   消防局：附近的大火較快撲滅（消防隊不論誰控制都會出勤，被摧毀就沒有了）。
   商業大樓：高樓，佔據的部隊視野更遠（依樓高）。
   市政廳：佔領後當地居民的敵意較快平息。體育場：大型避難場所。 */
Object.assign(FACN,{npp:'核電站',univ:'大學',school:'中學',prim:'小學',police:'警察局',fire:'消防局',tower:'商業大樓',hall:'市政廳',stad:'體育場',museum:'博物館'});
Object.assign(FAC8,{npp:{R:900,v:0.25},univ:{R:350,v:0.9},school:{R:150,v:1},prim:{R:100,v:1},police:{only:'ammo',node:1,R:120,v:0.8},fire:{R:120,v:0.9},tower:{R:120,v:0.6},hall:{R:150,v:0.7},stad:{R:300,v:0.5},museum:{R:150,v:0.9}});
/* 受保護：依據的公約（功能年份） */
var LMKP={npp:'ap1977',univ:'hague',school:'hague',prim:'hague',museum:'hague1954'};
var LMK={npp:1,univ:1,school:1,prim:1,police:1,fire:1,tower:1,hall:1,stad:1,museum:1};
[['npp','核電站',1956,'城市附近的核能發電廠（受損嚴重時爐心熔毀）'],['ap1977','日內瓦公約第一附加議定書',1977,'保護核電站、水壩等含危險力量的設施'],['hague1954','海牙文化財產公約',1954,'保護博物館與古蹟']].forEach(function(q){if(!FEAT.some(function(f){return f[0]===q[0];})){FEAT.push(q);FEATD[q[0]]=q[2];}});
/* 配置：每種的上限；依年代與聚落規模。各種地標偏好離市中心不同的距離（市政廳在中心、商業大樓在商業區、學校在住宅區、體育場在外圍），彼此至少相隔 150 公尺 */
var LMKMAX={univ:6,school:20,prim:24,police:16,fire:16,tower:24,hall:16,stad:6,museum:6};
var LMKRHO={hall:0,tower:0.15,museum:0.25,police:0.4,fire:0.5,univ:0.55,school:0.6,prim:0.7,stad:0.85};
function facGen9(MP,y,out){var cs=MP.cs,GW=MP.GW,GH=MP.GH,lc=MP.lc,id=out.reduce(function(m,f){return Math.max(m,f.id);},0),r=mb32(hstr((MP.seed||'m')+'|lmk')),cnt={},LM=out.filter(function(f){return LMK[f.k];});
  function near(x,yy,R,pred,r0,rho){var cx=Math.floor(x/cs),cy=Math.floor(yy/cs),Rc=Math.max(1,Math.ceil(R/cs)),R0=Math.floor((r0||0)/cs),T=(rho||0)*Rc,J=Math.max(2,Rc*0.3),best=-1,bd=1e18;for(var b=-Rc;b<=Rc;b++)for(var a=-Rc;a<=Rc;a++){var X=cx+a,Y=cy+b;if(X<1||Y<1||X>=GW-1||Y>=GH-1)continue;var d=a*a+b*b;if(d>Rc*Rc||d<R0*R0)continue;var dd=Math.abs(Math.sqrt(d)-T)+r()*J;if(dd>=bd)continue;var k=Y*GW+X;if(pred(k)){bd=dd;best=k;}}return best;}
  function xy(k){return [(k%GW+0.5)*cs,(((k/GW)|0)+0.5)*cs];}
  function far(p,k,D,L){return !(L||out).some(function(f){return (!k||f.k===k)&&dist(f.x,f.y,p[0],p[1])<D;});}
  function add(k,p,name,s,ex){if((cnt[k]||0)>=(LMKMAX[k]||1))return null;cnt[k]=(cnt[k]||0)+1;var F=Object.assign({id:++id,k:k,x:p[0],y:p[1],name:name,set:s?s.name:'',own:-1,cand:-1,ct:0,kn:sAV(-1),st0:{food:0,ammo:0,fuel:0,fod:0},hp:100},ex||{});out.push(F);LM.push(F);return F;}
  var urb=function(k){var c=lc[k];return isUrban(c)&&c!==LCI.ind&&c!==LCI.rly&&c!==LCI.port&&c!==LCI.rubble;},core=function(k){var c=lc[k];return c===LCI.city||c===LCI.old||c===LCI.town;},land=function(k){return !isWater(lc[k]);};
  var place=function(k,s,R,pred,D,name,ex,r0){if((cnt[k]||0)>=(LMKMAX[k]||1))return null;var sx=s.x*cs,sy=s.y*cs,L=out.filter(function(f){return f.k===k;}),
      q=near(sx,sy,R,function(c){if(!pred(c))return false;var p=xy(c);return far(p,k,D,L)&&far(p,null,150,LM);},r0,LMKRHO[k]);if(q<0)return null;return add(k,xy(q),name,s,ex);};
  var SS=(MP.set||[]).slice().sort(function(a,b){return b.pop-a.pop;});
  SS.forEach(function(s){var R=Math.max(400,s.r||300),city=s.kind==='city'||s.pop>=40000,town=!city&&(s.kind==='town'||s.pop>=2500),i,n;
    if(city||town&&y>=1400)place('hall',s,R*0.5,function(k){return core(k)||urb(k);},800,s.name+(city?'市政廳':'鎮公所'),{cap:city?600:150});
    if(y>=1100&&(city&&s.pop>=50000||y>=1900&&s.pop>=30000)){n=clamp(Math.round(s.pop/250000),1,3);for(i=0;i<n;i++)place('univ',s,R*(i?1:0.8),urb,1500,s.name+(n>1?['','理工','師範'][i]:'')+'大學',{cap:clamp(Math.round(s.pop*0.02),300,4000)});}
    if(y>=1850&&city&&s.pop>=50000)place('museum',s,R*0.6,urb,2000,s.name+(y>=1950&&s.pop>=200000?'國立':'')+'博物館');
    if(y>=1896&&(city&&s.pop>=50000||y>=1950&&s.pop>=25000))place('stad',s,R*1.3,function(k){return land(k)&&(urb(k)||lc[k]===LCI.park||lc[k]===LCI.mead);},2500,s.name+'體育場',{cap:clamp(Math.round(s.pop*0.05),2000,40000)},R*0.3);
    if(y>=1890&&(city&&s.pop>=50000||y>=1960&&s.pop>=25000)){n=clamp(Math.round(s.pop/(y<1930?150000:y<1970?80000:40000)),1,6);for(i=0;i<n;i++){var h=Math.round((y<1930?40+r()*60:y<1970?60+r()*140:100+r()*Math.min(250,s.pop/4000))*(i?0.75:1));
      place('tower',s,R*0.45,function(k){return core(k)||urb(k);},400,s.name+(i===0?(y<1950?'百貨公司':'金融大廈'):['商業大樓','購物中心','辦公大樓','國際大廈','百貨公司'][i%5]),{h:h});}}
    if(y>=1830&&(city||town&&s.pop>=3000)){n=city?clamp(Math.round(s.pop/80000),1,3):1;for(i=0;i<n;i++)place('police',s,R*0.7,urb,900,s.name+(n>1?['中央','東區','西區'][i]:'')+'警察局',{st0:{food:0,ammo:+(y<1900?0.3:clamp(1+s.pop/80000,1,6)).toFixed(1),fuel:0,fod:0}});}
    if(y>=1870&&(city||town&&s.pop>=5000)){n=city?clamp(Math.round(s.pop/90000),1,3):1;for(i=0;i<n;i++)place('fire',s,R*0.8,urb,1200,s.name+(n>1?['第一','第二','第三'][i]:'')+'消防局');}
    if(y>=1870&&(city||town&&s.pop>=5000)){n=city?clamp(Math.round(s.pop/60000),1,4):1;for(i=0;i<n;i++)place('school',s,R*0.9,urb,900,s.name+(n>1?['第一','第二','第三','第四'][i]:'')+(y>=1950?'高級中學':'中學'),{cap:clamp(Math.round(s.pop*0.01),150,1200)});}
    if(y>=1880&&(city||town||s.pop>=1200)){n=city?clamp(Math.round(s.pop/50000),1,4):1;for(i=0;i<n;i++)place('prim',s,R*(city?0.9:0.6),function(k){return urb(k)||land(k)&&!city&&!town;},700,s.name+(n>1?['第一','第二','第三','第四'][i]:'')+(y>=1945?'國民小學':'小學'),{cap:clamp(Math.round(s.pop*0.008),60,700)});}});
  /* 核電站：最大的城市附近（8～25 公里）、臨海、湖或大河的空地；全圖最多一座 */
  if(featOn('npp',y)&&y>=1960&&SS[0]&&SS[0].pop>=15000&&r()<0.6){var S0=SS[0],DX=[1,0,-1,0],DY=[0,1,0,-1],wet=function(k){var x=k%GW,yy=(k/GW)|0;for(var d=0;d<4;d++){var X=x+DX[d]*2,Y=yy+DY[d]*2;if(X<0||Y<0||X>=GW||Y>=GH)continue;var q=Y*GW+X,c=lc[q];if(c===LCI.sea||c===LCI.shal||c===LCI.lake||c===LCI.riv&&MP.rv[q]>=3)return true;}return false;};
    var mg=Math.min(Math.round(2500/cs),Math.floor(Math.min(GW,GH)/6)),nk=near(S0.x*cs,S0.y*cs,25000,function(k){var c=lc[k],x=k%GW,yy=(k/GW)|0;return x>=mg&&yy>=mg&&x<GW-mg&&yy<GH-mg&&!isWater(c)&&!isUrban(c)&&c!==LCI.marsh&&!MP.rv[k]&&wet(k)&&far(xy(k),null,1500,LM);},Math.min(8000,0.22*Math.min(GW,GH)*cs));
    if(nk>=0){var np=xy(nk),F=add('npp',np,S0.name+'核能發電廠',S0,{zr:3000});if(F){F.mw=Math.round(y<1970?500:y<1985?1000+r()*1000:2000+r()*2000);
      /* 取水口的方向（畫冷卻塔時放在陸地那一側） */var gx=nk%GW,gy=(nk/GW)|0,sx=0,sy=0;for(var b2=-4;b2<=4;b2++)for(var a2=-4;a2<=4;a2++){var X2=gx+a2,Y2=gy+b2;if(X2<0||Y2<0||X2>=GW||Y2>=GH||!a2&&!b2)continue;var c2=lc[Y2*GW+X2];if(isWater(c2)||c2===LCI.riv&&MP.rv[Y2*GW+X2]>=3){var l2=Math.sqrt(a2*a2+b2*b2);sx+=a2/l2;sy+=b2/l2;}}F.wd=+Math.atan2(sy,sx).toFixed(2);}}}
  return out;}
(function(){var b=facGen8;facGen8=function(MP,y,out){var r=b.apply(this,arguments);try{facGen9(MP,y,out);}catch(e){}return r;};})();
/* 舊存檔：補上地標 */
function lmkEnsure(){if(!G||!G.fac||!G.map||G._lmk)return;G._lmk=1;if(!G.fac.some(function(F){return LMK[F.k];}))facGen9(G.map,G.set.y||1943,G.fac);G.fac.forEach(function(F){if(F.hp===undefined)F.hp=100;});}
/* ---------- 工業區與公園：連成一片的區塊命名（只給地圖標示） ---------- */
function lmkZones(MP){if(MP._lmz&&MP._lmzv===(G&&G._mapv||0))return MP._lmz;var GW=MP.GW,GH=MP.GH,lc=MP.lc,seen=new Uint8Array(GW*GH),out=[],cs=MP.cs;
  [[LCI.ind,'工業區',12],[LCI.park,'公園',6]].forEach(function(z){for(var k0=0;k0<GW*GH;k0++){if(seen[k0]||lc[k0]!==z[0])continue;var st=[k0],n=0,sx=0,sy=0;seen[k0]=1;while(st.length){var k=st.pop(),x=k%GW,y=(k/GW)|0;n++;sx+=x;sy+=y;[k-1,k+1,k-GW,k+GW].forEach(function(q){if(q<0||q>=GW*GH||seen[q]||lc[q]!==z[0])return;if(Math.abs((q%GW)-x)>1)return;seen[q]=1;st.push(q);});}
      if(n<z[2])continue;var cx=(sx/n+0.5)*cs,cy=(sy/n+0.5)*cs,best=null,bd=1e18;(MP.set||[]).forEach(function(s){var d=dist(s.x*cs,s.y*cs,cx,cy);if(d<bd){bd=d;best=s;}});
      out.push({k:z[0]===LCI.ind?'ind':'park',n:(best&&bd<12000?best.name:'')+(z[0]===LCI.park&&n>=40?'中央':'')+z[1],x:cx,y:cy,a:n*cs*cs});}});
  out.sort(function(a,b){return b.a-a.a;});var used={};out.forEach(function(o){if(used[o.n]){used[o.n]++;o.n=o.n.replace(/(工業區|公園)$/,'第'+'一二三四五六七八九十'.charAt(Math.min(9,used[o.n]-1))+'$1');}else used[o.n]=1;});MP._lmz=out;MP._lmzv=G&&G._mapv||0;return out;}
/* ---------- 受保護的地標：直接攻擊（落點在設施範圍內）或重創是戰爭罪行；城裡的砲擊只是擦到不算 ---------- */
function lmkProt(F){var p=LMKP[F.k];return p&&featOn(p);}
(function(){var b=facHit;facHit=function(x,y,R,pow,side,cause,src){var P=null;if(G.fac&&pow>0){P=[];G.fac.forEach(function(F){if(LMK[F.k]&&!F.dead&&dist(F.x,F.y,x,y)<=R+facR(F))P.push([F,F.hp===undefined?100:F.hp]);});if(!P.length)P=null;}
  var r=b.apply(this,arguments);if(!P)return r;
  P.forEach(function(q){var F=q[0],dmg=q[1]-(F.hp||0);if(dmg<=0)return;
    if(src&&src.side>=0&&G.civ&&dmg>3&&(dist(F.x,F.y,x,y)<=facR(F)+100||dmg>20)&&lmkProt(F)&&F.own!==src.side&&(F.wcT===undefined||G.t-F.wcT>3600)){F.wcT=G.t;var e=warCrime(src,F.k==='museum'?'cult':'prot',0,uName(src)+'的火力擊中'+FACN[F.k]+'「'+F.name+'」'+(F.k==='npp'?'（受第一附加議定書保護的核設施）':F.k==='museum'?'（受保護的文化財產）':'（受保護的教育建築）'),false);e.x=F.x;e.y=F.y;}
    if(F.k==='npp'&&!F.melt&&(F.hp||0)<35)nppMelt(F,side,src);});return r;};})();
/* 空襲瞄準點附近的中立地標：只有直接瞄準（150 公尺內或指定這個設施）才會成為目標，攻擊城裡的敵軍時不會順手炸學校 */
(function(){var b=airFacTg;airFacTg=function(a,o){var r=b(a,o),F=r&&r.F;if(F&&LMK[F.k]&&F.own<0&&o.fac!==F.id&&dist(F.x,F.y,o.x,o.y)>150)r.F=null;return r;};})();
/* ---------- 核電站爐心熔毀：放射性物質外洩 ---------- */
function nppMelt(F,side,src){F.melt=Math.max(1,G.t);var cl=typeof cbList==='function'?cbList():(G.cbx=G.cbx||[]);G.cbSeq=(G.cbSeq||0)+1;cl.push({id:G.cbSeq,ag:'dirty',x:F.x,y:F.y,r:1500,m:40,t0:G.t,side:-1,src:0,seen:[1,1],npp:F.id});
  if(typeof cbGround==='function'&&typeof cbGK==='function'){var GR=cbGround(),B=G.map.cs*8;for(var dy=-3000;dy<=3000;dy+=B)for(var dx=-3000;dx<=3000;dx+=B){var d=Math.sqrt(dx*dx+dy*dy);if(d>3000)continue;var key=cbGK(F.x+dx,F.y+dy)+'|dirty';GR[key]=(GR[key]||0)+4*(1-d/3600);}}
  G.units.forEach(function(t){if(!alive(t)||!onMap(t)||ST(t).dom==='air')return;var d=dist(t.x,t.y,F.x,F.y);if(d>1500)return;hit(t,null,t.men*0.25*(1-d/1500)*(1-0.5*(ST(t).hard||0)),0,30,'rad');t.mor=clamp(t.mor-20,0,100);});
  if(G.civ)G.civ.S.forEach(function(g){var d=dist(g.x,g.y,F.x,F.y);if(d<30000){g.alarm=1;g.npp=G.t;}});
  logE(-1,'nuke','☢ '+F.name+'爐心熔毀，放射性物質外洩'+(src&&src.side>=0?'（遭'+G.sides[src.side].name+'的火力重創）':'')+'；周圍 30 公里內的居民緊急撤離，順風處將長期受到污染',F.x,F.y);
  if(G.onPause&&apOn('nuke'))G.onPause('核電站事故');}
/* ---------- 警察局：控制的一方附近的部隊比較少犯罪（每次事件三成五的機會被制止） ---------- */
function lmkNear(k,side,x,y,R){var b=null,bd=R;(G.fac||[]).forEach(function(F){if(F.k!==k||F.dead||(side!==undefined&&side!==null&&F.own!==side))return;var d=dist(F.x,F.y,x,y);if(d<bd){bd=d;b=F;}});return b;}
(function(){var b=discDo;discDo=function(u,k,g,mp,ff,pn,Lc,Lp){if(CRIMEK[k]&&G.fac&&Lc<4){var P=lmkNear('police',u.side,u.x,u.y,3000);if(P&&rnd8()<0.35){u.dis=clamp(u.dis+2,0,100);if(G.civ)G.civ.cs[u.side].incid++;logE(u.side,'disc',P.name+'的員警制止'+uName(u)+'的'+DISC[k],u.x,u.y,u.id);return;}}return b.apply(this,arguments);};})();
/* ---------- 消防局：附近燃燒中的格子較快撲滅 ---------- */
(function(){var b=fireSpread;fireSpread=function(e){var E=G.evt,Fi=E&&E.fire,FS=(G.fac||[]).filter(function(F){return F.k==='fire'&&!F.dead;});if(Fi&&FS.length){var MP=G.map,GW=MP.GW,cs=MP.cs;FS.forEach(function(S){var R=Math.ceil(2500/cs),cx=Math.floor(S.x/cs),cy=Math.floor(S.y/cs);
      for(var y=Math.max(0,cy-R);y<=Math.min(MP.GH-1,cy+R);y++)for(var x=Math.max(0,cx-R);x<=Math.min(GW-1,cx+R);x++){var k=y*GW+x;if(Fi[k]===1&&(x-cx)*(x-cx)+(y-cy)*(y-cy)<=R*R&&rnd8()<0.25){Fi[k]=2;E.burnA=Math.max(0,(E.burnA||0)-1);}}});}return b.apply(this,arguments);};})();
/* ---------- 商業大樓：佔據的部隊視野更遠 ---------- */
/* 視野每一步會查很多次：大樓清單每一步只整理一次 */
var LMKTC={g:null,s:-1,n:-1,L:[]};
function lmkTowerAt(u){var C=LMKTC,FL=G.fac||[];if(C.g!==G||C.s!==G.step||C.n!==FL.length){C.g=G;C.s=G.step;C.n=FL.length;C.L=FL.filter(function(F){return F.k==='tower'&&!F.dead&&F.h>0;});}var b=null;for(var i=0;i<C.L.length;i++){var F=C.L[i];if(Math.abs(F.x-u.x)<160&&Math.abs(F.y-u.y)<160&&dist(F.x,F.y,u.x,u.y)<160&&(!b||F.h>b.h))b=F;}return b;}
(function(){var b=spotOf;spotOf=function(u,s){var r=b(u,s);if(r>0&&s.dom==='land'&&G.fac&&G._lmkT!==false){var T=lmkTowerAt(u);if(T)r*=1+Math.min(1.5,T.h/150)*(T.hp>50?1:0.5);}return r;};})();
/* ---------- 市政廳：佔領後當地的敵意與動盪較快平息 ---------- */
(function(){var b=facTake;facTake=function(F,side,quiet){var prev=F.own;b.apply(this,arguments);if(F.k==='hall'&&!F.dead&&prev!==side&&G.civ){var g=G.civ.S.filter(function(q){return q.n===F.set;})[0];if(g){g.hallBy=side;g.hallT=G.t;if(g.unrest>0)g.unrest=Math.max(0,g.unrest*0.7);if(!quiet)logE(side,'civ','接管'+F.name+'：當地的行政恢復運作，動盪較快平息',F.x,F.y);}}};})();
(function(){var b=v8Step;v8Step=function(){b.apply(this,arguments);if(G.step%60!==23)return;lmkEnsure();if(!G.civ)return;G.civ.S.forEach(function(g){if(g.hallBy===undefined||g.hallBy<0||!(g.unrest>0))return;var F=(G.fac||[]).filter(function(q){return q.k==='hall'&&q.set===g.n&&!q.dead&&q.own===g.hallBy;})[0];if(F)g.unrest=Math.max(0,g.unrest-0.5);});};})();
