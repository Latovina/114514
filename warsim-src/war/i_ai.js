/* ===================== AI 指揮官（同樣受指揮鏈延遲與戰場迷霧限制）與下級指揮官的主動性 ===================== */
function busyF(F){if(F.pend&&F.pend.length)return true;if(G.msgs.some(function(m){return m.to===F.id;}))return true;var o=F.ord;if(!o||o.st==='done')return false;var age=G.t-(o.t1||o.ti);return age<(o.k==='attack'?3:o.k==='defend'?6:1.5)*3600;}
function aiGroups(side){var top=sideCmd(side);if(!top)return [];var other=tops(side).filter(function(t){return t!==top&&alive(t)&&t.st!=='off'&&!t.irr;});if(isLeaf(top))return [top].concat(other);var kids=kidsOf(top).filter(alive);while(kids.length===1&&!isLeaf(kids[0])){top=kids[0];kids=kidsOf(top).filter(alive);}return kids.filter(function(k){return k.st!=='off';}).concat(other);}
function enemyPic(side,age){var C=G.ct[side],o=[];for(var id in C){var c=C[id];if(c.dead||G.t-c.t>(age||3600))continue;o.push(c);}return o;}
function cOf(F){var L=isLeaf(F)?[F]:leavesOf(F).filter(onMap);return L.length?centroid(L):null;}
function aiTarget(side,C,en,objs){if(objs.length){var o=objs.slice().sort(function(a,b){return dist(C[0],C[1],a.x,a.y)/(a.pts||10)-dist(C[0],C[1],b.x,b.y)/(b.pts||10);})[0];return [o.x,o.y];}
  var land=en.filter(function(c){return c.dom==='land';});if(!land.length)return null;var best=null,bv=1e18;land.forEach(function(c){var near=sum(land,function(q){return dist(q.x,q.y,c.x,c.y)<2500?(q.men||0)+(q.veh||0)*8:0;}),v=dist(C[0],C[1],c.x,c.y)*(1+near/3000);if(v<bv){bv=v;best=c;}});return best?[best.x,best.y]:null;}
function aiDefPos(side,C,objs,en){var ec=en.length?centroid(en):null,o=objs.filter(function(q){return dist(C[0],C[1],q.x,q.y)<9000;}).sort(function(a,b){return dist(C[0],C[1],a.x,a.y)-dist(C[0],C[1],b.x,b.y);})[0],P=o?[o.x,o.y]:C,face=ec?Math.atan2(ec[1]-P[1],ec[0]-P[0]):homeDir(side)+PI;return [P[0],P[1],face];}
function aiStep(side){var S=G.sides[side],lvl=G.set.aiLvl===undefined?1:G.set.aiLvl,groups=aiGroups(side);if(!groups.length)return;
  var en=enemyPic(side,3600).filter(function(c){return c.dom!=='air';}),enM=sum(en,function(c){return (c.men||0)+(c.veh||0)*8;}),me=sideStr(side),myM=me.m,ens=sideStr(enemyOf(side)),objs=G.obj||[],notMine=objs.filter(function(o){return objTgt(side,o);}),mine=objs.filter(function(o){return o.own===side||o.own<0;});
  var post=S.post||'auto';if(post==='auto'&&atPeace(side))post='defend';if(post==='auto'){post=lvl===0?'defend':(myM>enM*(lvl>=2?0.9:1.25)||(notMine.length&&(!en.length||myM>enM*0.8)&&G.t>1800))?'attack':'defend';if(post==='defend'&&lvl>=1&&me.f<0.35&&enM>myM*1.5)post='withdraw';}
  if(S._post!==post){if(S._post)logE(side,'ai',uName(sideCmd(side))+'調整作戰方針：'+({attack:'轉入攻勢',defend:'轉入守勢',withdraw:'全線後撤、遲滯敵軍'})[post]);S._post=post;}
  var engG=groups.filter(function(g){var L=leavesOf(g).filter(alive);return L.length&&L.filter(isEng).length>=L.length*0.6;}),man=groups.filter(function(g){var r=roleOf(g);return (r==='man'||r==='rec')&&engG.indexOf(g)<0;}),fire=groups.filter(function(g){return roleOf(g)==='fire';}),air=groups.filter(function(g){return roleOf(g)==='air';}),nav=groups.filter(function(g){return roleOf(g)==='nav';});
  var res=man.length>=3?man.slice().sort(function(a,b){var ca=cOf(a),cb=cOf(b),h=homeDir(side);return (ca?-(ca[0]*Math.cos(h)+ca[1]*Math.sin(h)):0)-(cb?-(cb[0]*Math.cos(h)+cb[1]*Math.sin(h)):0);})[0]:null;
  var threat=man.filter(function(g){var L=leavesOf(g).filter(onMap);if(!L.length)return false;var mor=sum(L,function(x){return x.mor;})/L.length,eng=L.filter(function(x){return G.t-(x.uf||-1e9)<600;}).length;return eng>=Math.max(1,L.length/3)&&mor<55;});
  /* 沒有敵情時先派偵察部隊前出 */
  if(!en.length&&G.t>900&&lvl>=1){var tg0=notMine[0]||objs[0];G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||!onMap(u)||clsOf(u)!=='rec'||busyF(u)||u._aiRec)return;var c0=tg0?[tg0.x,tg0.y]:enemyCentroid(side,u.x,u.y)||[G.map.Wm/2,G.map.Hm/2];u._aiRec=1;issue(u,'recon',{x:c0[0],y:c0[1]});});}
  var exploit=post==='attack'&&lvl>=1&&ens.f<0.55&&ens.m0>0;
  man.forEach(function(g){if(g===res||busyF(g))return;var C=cOf(g);if(!C)return;
    if(post==='withdraw'){var h=homeDir(side),wp=validPos({dom:'land'},C[0]+Math.cos(h)*4000,C[1]+Math.sin(h)*4000);if(!g.ord||g.ord.dk!=='delay')issue(g,'delay',{x:wp[0],y:wp[1],face:h+PI});return;}
    if(post==='attack'){var tg=aiTarget(side,C,en,notMine);if(tg){if(exploit&&aiMobile(g)&&G.t-(g._aiX||-1e9)>7200){g._aiX=G.t;var ec=enemyCentroid(side,C[0],C[1],15000)||tg;issue(g,'pursue',{x:ec[0],y:ec[1]});logE(side,'ai',uName(sideCmd(side))+'命令'+uName(g)+'追擊潰敗之敵、擴張戰果');return;}
        if(aiAttack(side,g,C,tg,en,fire.length,lvl))return;}}
    aiDefend(side,g,C,aiDefPos(side,C,mine,en),en,lvl);});
  if(res&&!busyF(res)){if(threat.length){var tc=cOf(threat[0]),ec2=tc&&enemyCentroid(side,tc[0],tc[1],4000);if(ec2){issue(res,'attack',{x:ec2[0],y:ec2[1],opt:{tac:'frontal',tol:40}});logE(side,'ai',uName(sideCmd(side))+'投入預備隊'+uName(res)+'反擊，支援'+uName(threat[0]));}}
    else if(!res.ord){var all=man.filter(function(g){return g!==res;}).map(cOf).filter(Boolean);if(all.length){var c=centroid(all.map(function(p){return {x:p[0],y:p[1]};})),h2=homeDir(side),p=validPos({dom:'land'},c[0]+Math.cos(h2)*2500,c[1]+Math.sin(h2)*2500);issue(res,'reserve',{x:p[0],y:p[1]});}}}
  fire.forEach(function(f){if(busyF(f))return;var main=man.filter(function(g){return g.ord&&/attack|storm|breakthrough|crossing/.test(g.ord.k);})[0]||threat[0]||man[0];issue(f,'support',{sup:main?main.id:undefined});});
  /* 航空：主攻方向的近接支援優先，其次打擊敵方砲兵、指揮與後勤 */
  air.forEach(function(a){if(busyF(a)||(isLeaf(a)&&isCarrier(a)))return;var land=en.filter(function(c){return c.dom==='land'&&G.t-c.t<900;}),main=man.filter(function(g){return g.ord&&g.ord.x!==undefined&&/attack|storm|breakthrough|crossing|pursue/.test(g.ord.k);})[0],mc=main?[main.ord.x,main.ord.y]:null,best=null,bv=-1;
    land.forEach(function(c){var v=(c.men||0)+(c.veh||0)*20,b=c.br||'';if(/art|rkt|mor|hq|sup/.test(b))v*=1.6;if(b==='ad')v*=lvl>=2?1.1:0.4;if(mc&&dist(c.x,c.y,mc[0],mc[1])<4000)v*=1.8;if(v>bv){bv=v;best=c;}});
    if(best&&lvl>=1)issue(a,'strike',{x:best.x,y:best.y,r:3000});else{var C2=centroid(G.units.filter(function(u){return u.side===side&&onMap(u)&&ST(u).dom==='land';}));if(C2)issue(a,'patrol',{x:C2[0],y:C2[1],r:5000});}});
  nav.forEach(function(n){if(busyF(n))return;var C=cOf(n);if(!C)return;var sea=en.filter(function(c){return c.dom==='sea'||c.dom==='sub';}).sort(function(p,q){return dist(C[0],C[1],p.x,p.y)-dist(C[0],C[1],q.x,q.y);});if(sea.length){issue(n,'attack',{x:sea[0].x,y:sea[0].y});return;}
    var s=ST(isLeaf(n)?n:leavesOf(n)[0]||n),land=en.filter(function(c){return c.dom==='land'&&dist(C[0],C[1],c.x,c.y)<(s.ind||s.rM)*0.9;});if(land.length)issue(n,'bombard',{x:land[0].x,y:land[0].y,r:400,dur:1800});});
  /* 獨立的工兵部隊：攻勢時在主攻軸線的河流上架橋、清除障礙；守勢時在主要防線構築陣地 */
  engG.forEach(function(e){if(busyF(e))return;var main=man.filter(function(g){return g.ord&&g.ord.x!==undefined;})[0];if(!main)return;var C=cOf(main);if(!C)return;var P=[main.ord.x,main.ord.y];
    if(/attack|storm|breakthrough|crossing|pursue|penetrate/.test(main.ord.k)){var rv=riverOnAxis(C,P);if(rv&&!bridgeNearPt(rv[0],rv[1],2500)){issue(e,'bridge',{x:rv[0],y:rv[1],bt:'auto',opt:{bt:'auto'}});logE(side,'ai',uName(sideCmd(side))+'命令'+uName(e)+'在'+placeTxt(rv[0],rv[1])+'架橋，支援主攻');return;}
      var fd=G.units.filter(function(u){return u.side!==side&&onMap(u)&&(u.ent>0.6||G.map.ft[cellAt(u.x,u.y)]>=2)&&known(side,u.id,1800)&&dist(u.x,u.y,P[0],P[1])<1500;})[0];if(fd){issue(e,'breach',{x:fd.x,y:fd.y});return;}
      issue(e,'move',{x:C[0]+(P[0]-C[0])*0.3,y:C[1]+(P[1]-C[1])*0.3});return;}
    if(/defend/.test(main.ord.k)&&!(e._bT&&G.t-e._bT<6*3600)){e._bT=G.t;issue(e,'build',{x:main.ord.x,y:main.ord.y,bk:'pos',face:main.ord.face});}});
  /* 延後下達的工兵構築（等待防禦部署完成） */
  man.forEach(function(g){var q=g._bQ;if(!q||G.t<q.at)return;g._bQ=null;var e=leavesOf(g).filter(function(u){return onMap(u)&&isEng(u)&&!busyF(u);})[0];if(e)issue(e,'build',{x:q.x,y:q.y,bk:q.bk,face:q.face});});
  aiNuke(side);}
/* 機動部隊（裝甲、機械化、騎兵）為主的編組 */
function aiMobile(g){var L=leavesOf(g).filter(onMap);if(!L.length)return false;var m=L.filter(function(u){var c=clsOf(u);return c==='arm'||c==='mech'||c==='cav';}).length;return m>=L.length*0.5;}
/* 進攻：依局部兵力比、工事、河流選擇戰術與命令 */
function aiAttack(side,g,C,tg,en,hasFire,lvl){var gs=strengthOf(g),own=gs.men+gs.veh*8,near=en.filter(function(c){return dist(c.x,c.y,tg[0],tg[1])<3500;}),es=sum(near,function(c){return (c.men||0)+(c.veh||0)*8;}),r=es>0?own/es:9,nMan=isLeaf(g)?1:kidsOf(g).filter(function(k){var ro=roleOf(k);return ro==='man'||ro==='rec';}).length;
  var fort=near.some(function(c){var e=uById(c.id);return e&&(e.ent>0.6||G.map.ft[cellAt(e.x,e.y)]>=4);}),prep=hasFire&&lvl>=1?(fort?30:15):0,L=leavesOf(g).filter(onMap),hasEng=L.some(isEng),rv=riverOnAxis(C,tg);
  var name=function(t){logE(side,'ai',uName(sideCmd(side))+'命令'+uName(g)+t+'（'+placeTxt(tg[0],tg[1])+'）');};
  if(rv&&hasEng&&!bridgeNearPt(rv[0],rv[1],3000)&&lvl>=1){issue(g,'crossing',{x:tg[0],y:tg[1],opt:{prep:prep}});name('強渡河川');return true;}
  if(!near.length){issue(g,'attack',{x:tg[0],y:tg[1],opt:{tac:'frontal',prep:0,tol:35,pace:'normal'}});return true;}
  if(lvl>=1&&fort&&r>=2.2){issue(g,'storm',{x:tg[0],y:tg[1],opt:{prep:Math.max(prep,30)}});name('強攻敵陣地');return true;}
  if(lvl>=1&&r>=2.5&&nMan>=3){issue(g,'attack',{x:tg[0],y:tg[1],opt:{tac:'pincer',prep:prep,tol:40}});name('實施鉗形包圍');return true;}
  if(lvl>=1&&r>=1.5&&nMan>=2){issue(g,'attack',{x:tg[0],y:tg[1],opt:{tac:'flank',prep:prep,tol:35}});name('實施側翼迂迴');return true;}
  if(lvl>=1&&r>=1&&nMan>=2){issue(g,'breakthrough',{x:tg[0],y:tg[1],opt:{prep:Math.max(prep,20)}});name('集中兵力實施突破');return true;}
  if(r>=0.7||lvl>=2){issue(g,'attack',{x:tg[0],y:tg[1],opt:{tac:r<1?'probe':'firemove',prep:prep,tol:30}});return true;}
  return false;}
/* 防禦：依兵力比與敵軍裝甲選擇姿態，時間允許時由工兵構築陣地 */
/* 位於有城牆的城鎮內（守城部隊不會為了遲滯而棄城） */
function inWalls(x,y){var MP=G.map,cs=MP.cs;return MP.set.some(function(s){return s.wall&&dist(s.x*cs,s.y*cs,x,y)<Math.max(300,(s.r||0)*1.1);});}
function aiDefend(side,g,C,dp,en,lvl){var gs=strengthOf(g),own=gs.men+gs.veh*8,near=en.filter(function(c){return dist(c.x,c.y,dp[0],dp[1])<6000;}),es=sum(near,function(c){return (c.men||0)+(c.veh||0)*8;}),arm=near.filter(function(c){return (c.veh||0)*8>(c.men||0);}).length;
  var close=near.some(function(c){return dist(c.x,c.y,dp[0],dp[1])<2500;}),walled=inWalls(dp[0],dp[1]),post=lvl<1?'hasty':walled?(es>own*2.2?'holdfast':'prepared'):es>own*2.2?'delay':arm>near.length*0.5&&!denseAt(dp[0],dp[1])?'depth':close?'hasty':'prepared';
  if(!g.ord||!/defend/.test(g.ord.k)||dist(dp[0],dp[1],g.ord.x,g.ord.y)>1500||(g.ord.opt&&g.ord.opt.post!==post&&post==='delay')){issue(g,post==='delay'?'delay':post==='holdfast'?'holdfast':'defend',{x:dp[0],y:dp[1],face:dp[2],opt:{post:post}});
    if(lvl>=1&&!close&&!(g._bT&&G.t-g._bT<6*3600)&&leavesOf(g).some(isEng)){g._bT=G.t;g._bQ={at:G.t+2400,x:dp[0],y:dp[1],face:dp[2],bk:G.obj.some(function(o){return dist(o.x,o.y,dp[0],dp[1])<1500&&(o.pts||10)>=20;})?'semi':'pos'};}}}
/* 河流：攻擊軸線上的大河或水域（回傳渡河點） */
function riverOnAxis(C,tg){var MP=G.map,d=dist(C[0],C[1],tg[0],tg[1]),n=Math.ceil(d/(MP.cs*1.5));for(var i=1;i<n;i++){var t=i/n,x=C[0]+(tg[0]-C[0])*t,y=C[1]+(tg[1]-C[1])*t,k=cellAt(x,y);if(MP.lc[k]===LCI.riv||MP.rv[k]>=3||(MP.lc[k]===LCI.lake))return [x,y];}return null;}
function bridgeNearPt(x,y,R){var MP=G.map,cx=x/MP.cs,cy=y/MP.cs,r=R/MP.cs;return MP.brg.some(function(q){return Math.abs(q.x-cx)<r&&Math.abs(q.y-cy)<r;});}
/* 電腦動用戰術核武：允許時、戰況惡化、找得到敵軍密集處且本方部隊不在重創範圍內 */
function aiNuke(side){var N=G.set.nuke;if(!N||!N.on||!N.ai||nukeLeft(side)<=0)return;var S=G.sides[side];if(G.t-(S.nkT||-1e9)<4*3600)return;var me=sideStr(side),en=sideStr(enemyOf(side));if(!(me.f<0.55||en.m>me.m*1.6))return;
  var C=enemyPic(side,900).filter(function(c){return c.dom==='land';});if(!C.length)return;var best=null,bv=0;C.forEach(function(c){var v=sum(C,function(q){return dist(q.x,q.y,c.x,c.y)<2500?(q.men||0)+(q.veh||0)*8:0;});if(v>bv){bv=v;best=c;}});if(!best||bv<1500)return;
  var sh=G.units.filter(function(u){return u.side===side&&isLeaf(u)&&onMap(u)&&nukeCap(u)>0&&ST(u).dom!=='air'&&dist(u.x,u.y,best.x,best.y)<=indOf(u,ST(u))*0.95&&!(u.pend&&u.pend.length);});if(!sh.length)return;
  var u=sh.sort(function(a,b){return nukeCap(b)-nukeCap(a);})[0],Y=Math.min(nukeCap(u),N.y||10),R=nukeR(Y);if(G.units.some(function(f){return f.side===side&&onMap(f)&&ST(f).dom!=='air'&&dist(f.x,f.y,best.x,best.y)<R[1]*1.3;}))return;
  S.nkT=G.t;issue(u,'nuke',{x:best.x,y:best.y,Y:Y});logE(side,'ai',uName(sideCmd(side))+'下令'+uName(u)+'實施戰術核打擊');}
/* ---------- 下級主動性：指揮官依「主動性」屬性自行反應（雙方皆適用） ---------- */
function initiativeStep(){G.units.forEach(function(F){if(isLeaf(F)||!alive(F)||F.hqLost||F.st==='off')return;if(!authMay(F,'atk')&&!authMay(F,'def'))return;var off=F.off;if(!off||rnd()>off.ini/10*0.6)return;var L=kidsOf(F).filter(onMap);if(!L.length)return;
    var hurt=L.filter(function(x){return (x.ms==='rout'||x.ms==='shaken')&&G.t-(x.uf||-1e9)<900;})[0];
    if(hurt){var rs=L.filter(function(x){return x.ms==='ok'&&roleOf(x)==='man'&&(!x.ord||x.ord.k==='reserve'||x.ord.k==='halt')&&!(x._ed<1500)&&!(x.pend&&x.pend.length);})[0];
      if(rs){var e=hurt.ufBy?uById(hurt.ufBy):null,tx=e&&alive(e)?e.x:hurt.x,ty=e&&alive(e)?e.y:hurt.y;if(!authGo(F,hasQ(off,'careful')?'def':'atk',{x:tx,y:ty,rs:rs.id,hx:hurt.x,hy:hurt.y}))return;if(hasQ(off,'careful')){sendOrder(F,rs,newOrder('defend',{x:hurt.x,y:hurt.y,sub:1}),false);}else sendOrder(F,rs,newOrder('attack',{x:tx,y:ty,sub:1}),false);
        logE(F.side,'ini',uName(F)+'（'+off.rank+off.name+'）主動派'+uName(rs)+(hasQ(off,'careful')?'填補':'反擊')+'，支援'+uName(hurt),hurt.x,hurt.y,F.id);return;}}
    var inC=L.filter(function(x){return G.t-(x.uf||-1e9)<600;});if(inC.length){var art=L.filter(function(x){return roleOf(x)==='fire'&&(!x.ord||x.ord.k==='halt'||x.ord.k==='reserve')&&!(x.pend&&x.pend.length);})[0];
      if(art){sendOrder(F,art,newOrder('support',{sup:F.id,sub:1}),false);logE(F.side,'ini',uName(F)+'命令'+uName(art)+'提供火力支援',art.x,art.y,F.id);}}});}
