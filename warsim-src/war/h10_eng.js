/* ===================== 工兵與作戰行動：架橋（突擊橋、浮橋、便橋）、渡口（小艇、渡輪）、構築（陣地、半永久工事、堡壘、稜堡、補給站）、開闢通路；
   作戰命令：渡河作戰、強攻、突破、穿插 ===================== */
function isEng(u){var s=ST(u);return s.dom==='land'&&(clsOf(u)==='eng'||s.fl.indexOf('e')>=0||s.fl.indexOf('N')>=0);}
function isBridger(u){return ST(u).fl.indexOf('N')>=0;}
function needsFerry(u){var s=ST(u);return s.dom==='land'&&s.mobi>=2&&s.fl.indexOf('W')<0;}
/* ---------- 架橋 ---------- */
var BTN={auto:'自動選擇',assault:'突擊橋（渡橋）',pontoon:'浮橋',fixed:'工兵便橋'};
function bridgeType(u,o,site){var y=uEra(u).y,bt=(o.opt&&o.opt.bt)||o.bt||'auto',canA=y>=1940||isBridger(u);if(bt==='assault'&&(!canA||site.c>2))bt='auto';if(bt==='pontoon'&&y<1700)bt='fixed';
  if(bt==='auto')bt=canA&&site.c<=2?'assault':y>=1700?'pontoon':'fixed';return bt;}
function bridgeTime(u,o){var E=uEra(u),site=o.site,bt=site.bt||'pontoon',base=E.brg*60*([0,0.3,0.45,1,1.6][site.c]||1),f=bt==='assault'?Math.min(1,600/Math.max(1,base))*1:bt==='fixed'?1.6:0.85;
  return Math.max(bt==='assault'?300:900,base*f)*(isBridger(u)?0.5:1)/Math.max(0.35,strFrac(u));}
/* ---------- 渡口：小艇（人員）、渡輪或門橋（人員與車輛） ---------- */
var XSN={boat:'小艇渡口',ferry:'渡輪（門橋）',raft:'木筏渡口'};
function xingFor(side,x0,y0,x1,y1,kind){var best=null,bd=1500;(G.xings||[]).forEach(function(X){if(X.side!==side||(kind&&X.kind!==kind&&!(kind==='boat'&&X.kind==='ferry')))return;var q=segDist(X.x,X.y,x0,y0,x1,y1),d=q.d;if(d<bd){bd=d;best=X;}});return best;}
function xingStep(){if(!G.xings||!G.xings.length)return;G.xings=G.xings.filter(function(X){var en=0;gridNear(X.x,X.y,600,function(e){if(e.side!==X.side&&onMap(e)&&ST(e).dom==='land'&&dist(e.x,e.y,X.x,X.y)<600)en++;});if(en&&!friendNear(X.side,X.x,X.y,600)){logE(X.side,'eng','敵軍佔領了'+placeTxt(X.x,X.y)+'的'+XSN[X.kind],X.x,X.y);return false;}return true;});}
/* ---------- 構築 ---------- */
var BLD={pos:['野戰陣地',1.5],semi:['半永久工事',5],fort:['堡壘',10],bastion:['稜堡',14],depot:['補給站',3]};
function buildTime(u,kind){var E=uEra(u),h=BLD[kind]?BLD[kind][1]:2;if(kind==='bastion'&&E.y>=1880)h*=1.3;if(kind==='pos'&&E.y>=1940)h*=0.8;return h*3600*(hasQ(offOf(u),'sapper')?0.67:1);}
function buildApply(u,o){var MP=G.map,kind=o.bk||'pos',x=o.x,y=o.y,face=o.face!==undefined?o.face:(function(){var ec=enemyCentroid(u.side,x,y,20000);return ec?Math.atan2(ec[1]-y,ec[0]-x):homeDir(u.side)+PI;})(),ks=[],cs=MP.cs;
  function put(px,py,v){var k=cellAt(px,py);if(isWater(MP.lc[k])||MP.rd[k]>=3&&v!==1)return;if(MP.ft[k]===5&&v<5)return;if(v===1&&MP.ft[k]>=4)return;MP.ft[k]=v;ks.push(k);}
  var fx=Math.cos(face),fy=Math.sin(face),lx=-fy,ly=fx,t,a;
  if(kind==='pos'){for(t=-300;t<=300;t+=cs*0.6){put(x+lx*t,y+ly*t,1);put(x+lx*t+fx*120,y+ly*t+fy*120,2);}}
  else if(kind==='semi'){for(t=-200;t<=200;t+=cs*0.6){put(x+lx*t,y+ly*t,1);put(x+lx*t+fx*140,y+ly*t+fy*140,2);}for(t=-180;t<=180;t+=120)put(x+lx*t+fx*30,y+ly*t+fy*30,4);}
  else if(kind==='fort'){for(a=0;a<2*PI;a+=cs/260*0.8){put(x+Math.cos(a)*220,y+Math.sin(a)*220,4);put(x+Math.cos(a)*150,y+Math.sin(a)*150,1);put(x+Math.cos(a)*330,y+Math.sin(a)*330,2);}put(x,y,4);}
  else if(kind==='bastion'){var pts=[];for(var i=0;i<10;i++){var ang=face+i*PI/5,r=i%2?160:280;pts.push([x+Math.cos(ang)*r,y+Math.sin(ang)*r]);}for(i=0;i<10;i++){var p0=pts[i],p1=pts[(i+1)%10],n=Math.ceil(dist(p0[0],p0[1],p1[0],p1[1])/(cs*0.6));for(var j=0;j<=n;j++)put(p0[0]+(p1[0]-p0[0])*j/n,p0[1]+(p1[1]-p0[1])*j/n,5);}put(x,y,4);}
  else if(kind==='depot'){var N=addNode(u.side,'depot',x,y,{name:'前進補給站 '+((G.lgSeq||0)+1)});logE(u.side,'eng',uName(u)+'完成構築補給站「'+N.name+'」（'+placeTxt(x,y)+'）',x,y,u.id);u.ent=Math.max(u.ent,0.5);return;}
  if(ks.length)mapChanged(ks);u.ent=Math.max(u.ent,kind==='pos'?0.7:0.85);logE(u.side,'eng',uName(u)+'完成構築'+BLD[kind][0]+'（'+placeTxt(x,y)+'）',x,y,u.id);}
/* 開闢通路：清除目標附近的鐵絲網與雷區，削弱碉堡 */
function breachApply(u,o){var MP=G.map,ks=[],R=Math.ceil(350/MP.cs);brushCells(MP,o.x/MP.cs,o.y/MP.cs,R,function(k){var f=MP.ft[k];if(f===2||f===3){MP.ft[k]=0;ks.push(k);}else if((f===4||f===5)&&rnd()<0.35){MP.ft[k]=1;ks.push(k);}});if(ks.length)mapChanged(ks);logE(u.side,'eng',uName(u)+'在'+placeTxt(o.x,o.y)+'開闢通路，清除 '+ks.length+' 處障礙',o.x,o.y,u.id);}

/* ---------- 葉單位：工兵命令與作戰命令的啟動（由 activate 呼叫；回傳 true 表示已處理） ---------- */
function engAct(u,o){var s=ST(u),k=o.k;
  if(k==='build'||k==='xsite'||k==='breach'){if(!isEng(u)&&!(k==='xsite'&&canRaft(u))){if(k==='build'){activate(u,newOrder('fortify',{x:o.x!==undefined?o.x:u.x,y:o.y!==undefined?o.y:u.y,face:o.face}));logE(u.side,'eng',uName(u)+'不是工兵，改為就地構工',u.x,u.y,u.id);return true;}logE(u.side,'eng',uName(u)+'不是工兵，無法執行'+ORDN[k],u.x,u.y,u.id);u.task='hold';return true;}
    if(o.x===undefined){o.x=u.x;o.y=u.y;}if(k==='xsite'){var q=riverNear(o.x,o.y,1500);if(!q){logE(u.side,'eng',uName(u)+'：目標附近找不到可設置渡口的河道',u.x,u.y,u.id);u.task='hold';return true;}o.site=q;o.wx=q.bx;o.wy=q.by;}else{o.wx=o.x;o.wy=o.y;}
    o.ph='go';var p=validPos(s,o.wx,o.wy);if(dist(u.x,u.y,p[0],p[1])<300)u.task='at';else{u.task='go';wantPath(u,p[0],p[1]);}return true;}
  if(k==='storm'){var no=newOrder('attack',{x:o.x,y:o.y,x0:u.x,y0:u.y,opt:Object.assign({},o.opt||{},{tac:'frontal',tol:80,storm:1,pace:(o.opt&&o.opt.pace)||'normal'}),dk:'storm',hHour:o.hHour,via:o.via});u.mor=clamp(u.mor+8,0,100);mfAdd(u,'win',8);activate(u,no);return true;}
  if(k==='penetrate'){if(s.dom!=='land')return false;var via=gapRoute(u,o.x,o.y),no2=newOrder('attack',{x:o.x,y:o.y,via:via,opt:Object.assign({tac:'infil',roe:'return',tol:45},o.opt||{},{pen:1}),dk:'penetrate',then:{k:'defend',x:o.x,y:o.y,opt:{post:'hasty'}}});activate(u,no2);
    if(via.length)logE(u.side,'tac',uName(u)+'規劃穿插路線（'+via.length+' 個中繼點），避開已知敵軍',u.x,u.y,u.id);return true;}
  if(k==='crossing'){if(s.dom!=='land')return false;if(needsFerry(u)){var P=landingPlan(u,o);if(!P){activate(u,newOrder('attack',{x:o.x,y:o.y,opt:o.opt}));return true;}var X=xingFor(u.side,P.emb[0],P.emb[1],P.land[0],P.land[1],'ferry');
      if(X){activate(u,newOrder('landing',{x:o.x,y:o.y,opt:o.opt}));return true;}var a=Math.atan2(u.y-P.emb[1],u.x-P.emb[0]),wp=validPos(s,P.emb[0]+Math.cos(a)*1500,P.emb[1]+Math.sin(a)*1500);
      activate(u,newOrder('waitx',{x:wp[0],y:wp[1],cx:P.emb[0],cy:P.emb[1],then:{k:'attack',x:o.x,y:o.y,opt:o.opt}}));logE(u.side,'eng',uName(u)+'的車輛需要橋梁或渡輪，在渡河點後方集結等待',u.x,u.y,u.id);return true;}
    activate(u,newOrder('landing',{x:o.x,y:o.y,opt:o.opt,dk:'crossing'}));return true;}
  if(k==='waitx'){o.ph='go';var p2=validPos(s,o.x,o.y);u.task='go';wantPath(u,p2[0],p2[1]);return true;}
  if(k==='breakthrough'){if(s.dom!=='land'||o.x===undefined)return false;var a=Math.atan2(o.y-u.y,o.x-u.x),dp=validPos(s,o.x+Math.cos(a)*5000,o.y+Math.sin(a)*5000);activate(u,newOrder('attack',{x:o.x,y:o.y,x0:u.x,y0:u.y,opt:{tac:'frontal',pace:'rush',tol:60},dk:'breakthrough',then:{k:'attack',x:dp[0],y:dp[1],opt:{tac:'frontal',pace:'rush',tol:50}}}));return true;}
  return false;}
/* ---------- 葉單位每步：工兵作業進度、等待渡河、攻擊後續命令 ---------- */
function engLeaf(u,s){var o=u.ord;if(!o)return false;var k=o.k;
  if((k==='build'||k==='xsite'||k==='breach')&&o.ph){if(o.ph==='go'){if(u.task==='go'&&(u.path||u.pq))return false;if(dist(u.x,u.y,o.wx,o.wy)>600&&u.task!=='at'&&u.path)return false;
      o.ph='work';o.prog=0;o.need=k==='build'?buildTime(u,o.bk||'pos')/kitBuildF(u,o.bk||'pos'):k==='xsite'?((o.xk||'boat')==='ferry'?2700:(o.xk==='raft'||!isEng(u))?700:1200)*(uEra(u).y<1900?1.6:1):900/(kitN(u,'fascine')>0?1.5:1);if(u.labT>G.t)o.need/=1.3;u.task='work2';u.path=null;
      logE(u.side,'eng',uName(u)+'開始'+(k==='build'?'構築'+BLD[o.bk||'pos'][0]:k==='xsite'?'設置'+XSN[o.xk||'boat']:'開闢通路')+'，預計 '+durTxt(o.need/Math.max(0.35,strFrac(u))),u.x,u.y,u.id);return true;}
    if(o.ph==='work'){var uf=G.t-(u.uf||-1e9)<120;o.prog+=DT*(uf?0.3:1)*Math.max(0.35,strFrac(u))*(u.fat>70?0.6:1)*eqM(u,'dg');u.fat=clamp(u.fat+0.04,0,100);
      if(o.prog>=o.need){o.ph='done';o.st='done';u.task='hold';if(k==='build')buildApply(u,o);else if(k==='breach')breachApply(u,o);else{var q=o.site,rf=!isEng(u)||o.xk==='raft',X={id:(G.xid=(G.xid||0)+1),side:u.side,kind:rf?'boat':o.xk||'boat',raft:rf?1:0,x:q.x,y:q.y,by:u.id,t0:G.t};if(rf&&u.kit)u.kit.raft=Math.max(0,(u.kit.raft||0)-3);(G.xings=G.xings||[]).push(X);logE(u.side,'eng',uName(u)+'完成設置'+(rf?XSN.raft:XSN[X.kind])+'（'+placeTxt(q.x,q.y)+'）',q.x,q.y,u.id);if(u._qb){u._qb=0;activate(u,newOrder('bridge',{x:q.x,y:q.y,bt:'pontoon',opt:{bt:'pontoon'}}));}}}return true;}
    return false;}
  if(k==='waitx'){if(o.ph==='go'){if(u.task==='go'&&(u.path||u.pq))return false;o.ph='wait';u.task='hold';}if(G.step%4===u.id%4&&crossReady(u.side,o.cx,o.cy)){var th=o.then;logE(u.side,'eng',uName(u)+'：渡河器材就緒，開始渡河',u.x,u.y,u.id);activate(u,newOrder(th.k,{x:th.x,y:th.y,opt:th.opt}));}return o.ph==='wait';}
  if(k==='attack'&&o.then&&o.reached){var t2=o.then;o.then=null;activate(u,newOrder(t2.k,{x:t2.x,y:t2.y,opt:t2.opt,face:t2.face,dk:t2.dk}));if(t2.k==='attack')logE(u.side,'tac',uName(u)+'突破後向縱深發展（'+placeTxt(t2.x,t2.y)+'）',u.x,u.y,u.id);return true;}
  return false;}
/* 渡河點附近是否已有本方的工兵橋梁或渡輪 */
function crossReady(side,x,y){var MP=G.map,R=3000/MP.cs,cx=x/MP.cs,cy=y/MP.cs;if(MP.brg.some(function(q){return (q.eng||q.t!=='p')&&Math.abs(q.x-cx)<R&&Math.abs(q.y-cy)<R;}))return true;return (G.xings||[]).some(function(X){return X.side===side&&X.kind==='ferry'&&dist(X.x,X.y,x,y)<3000;});}
/* ---------- 穿插路線：在粗網格上避開已知敵軍的 A* ---------- */
function gapRoute(u,tx,ty){var MP=G.map,B=500,W=Math.ceil(MP.Wm/B),H=Math.ceil(MP.Hm/B),N=W*H,pen=new Float32Array(N),C=G.ct[u.side];
  for(var id in C){var c=C[id];if(G.t-c.t>1800||c.dead||c.dom==='air')continue;var w=Math.sqrt((c.men||50)+(c.veh||0)*8),r=3,cx=Math.floor(c.x/B),cy=Math.floor(c.y/B);for(var b=-r;b<=r;b++)for(var a=-r;a<=r;a++){var X=cx+a,Y=cy+b;if(X<0||Y<0||X>=W||Y>=H)continue;var d=Math.sqrt(a*a+b*b)*B;if(d>1600)continue;pen[Y*W+X]+=w*(1-d/1600);}}
  var wet=new Uint8Array(N);for(var j=0;j<H;j++)for(var i=0;i<W;i++){var k=cellAt((i+0.5)*B,(j+0.5)*B);if(isWater(MP.lc[k])&&!MP.rd[k])wet[j*W+i]=1;}
  var s0=clamp(Math.floor(u.y/B),0,H-1)*W+clamp(Math.floor(u.x/B),0,W-1),s1=clamp(Math.floor(ty/B),0,H-1)*W+clamp(Math.floor(tx/B),0,W-1),g=new Float32Array(N).fill(Infinity),from=new Int32Array(N).fill(-1),cl=new Uint8Array(N),Hp=new Heap(),bx=s1%W,by=(s1/W)|0;g[s0]=0;Hp.push(s0,0);
  while(Hp.size()){var cur=Hp.pop();if(cur===s1)break;if(cl[cur])continue;cl[cur]=1;var x=cur%W,y=(cur/W)|0;for(var dd=0;dd<8;dd++){var X2=x+[1,1,0,-1,-1,-1,0,1][dd],Y2=y+[0,1,1,1,0,-1,-1,-1][dd];if(X2<0||Y2<0||X2>=W||Y2>=H)continue;var n=Y2*W+X2;if(cl[n]||(wet[n]&&n!==s1))continue;var ng=g[cur]+(dd%2?1.414:1)*(1+pen[n]*0.6);if(ng<g[n]){g[n]=ng;from[n]=cur;Hp.push(n,ng+Math.sqrt((X2-bx)*(X2-bx)+(Y2-by)*(Y2-by)));}}}
  if(from[s1]<0)return [];var P=[],c2=s1;while(c2>=0&&c2!==s0){P.push(c2);c2=from[c2];}P.reverse();var via=[];for(var q=3;q<P.length-1;q+=4){var vx=(P[q]%W+0.5)*B,vy=(((P[q]/W)|0)+0.5)*B,vp=validPos(ST(u),vx,vy);via.push([vp[0],vp[1]]);}return via;}

/* ---------- 編制單位的規劃：渡河作戰、強攻、突破、穿插、工兵命令 ---------- */
function planEng(F,o,kids,man,fire,air,nav,oth,P,C,dir,add,fw,spreadLine){var k=o.k,fx=Math.cos(dir),fy=Math.sin(dir),lx=-fy,ly=fx,engs=leavesOf(F).filter(function(u){return alive(u)&&isEng(u);}),isE=function(u){return engs.indexOf(u)>=0;};
  if(k==='build'||k==='xsite'||k==='breach'){if(!engs.length){logE(F.side,'eng',uName(F)+'所屬部隊沒有工兵',F.x,F.y,F.id);return true;}engs.slice(0,k==='build'?2:1).forEach(function(u,i){add(u,newOrder(k,{x:o.x+lx*i*250,y:o.y+ly*i*250,bk:o.bk,xk:o.xk,face:o.face}));});return true;}
  if(k==='storm'){var opt=Object.assign({},o.opt||{},{tac:'frontal',tol:80,storm:1,prep:Math.max((o.opt&&o.opt.prep)||0,30)}),hh=G.t+opt.prep*60,W=o.w||Math.max(sum(man,fw)*0.9,400);
    spreadLine(man.filter(function(u){return !isE(u);}),P[0],P[1],lx,ly,W,function(u,x,y){return newOrder('storm',{x:x,y:y,hHour:hh,opt:opt});});
    engs.slice(0,2).forEach(function(u,i){add(u,newOrder('breach',{x:P[0]-fx*150+lx*(i-0.5)*300,y:P[1]-fy*150+ly*(i-0.5)*300}));});
    fire.forEach(function(u){add(u,newOrder('bombard',{x:P[0],y:P[1],r:Math.max(400,W/3),dur:opt.prep*60,then:'support',sup:F.id}));});air.forEach(function(u){if(!isCarrier(u))add(u,newOrder('strike',{x:P[0],y:P[1],r:2000}));});nav.forEach(function(u){add(u,newOrder('bombard',{x:P[0],y:P[1],r:500,dur:1800}));});return true;}
  if(k==='breakthrough'){var srt=man.filter(function(u){return !isE(u);}).sort(function(a,b){return strengthOf(b).f*((ST(b).hard||0)+0.2)-strengthOf(a).f*((ST(a).hard||0)+0.2);}),n1=Math.max(1,Math.ceil(srt.length*0.55)),e1=srt.slice(0,n1),e2=srt.slice(n1),Wn=Math.max(300,sum(e1,fw)*0.45),deep=[P[0]+fx*6000,P[1]+fy*6000],dp=validPos({dom:'land'},deep[0],deep[1]),bo=Object.assign({},o.opt||{},{tac:'frontal',tol:60,prep:Math.max((o.opt&&o.opt.prep)||0,20)}),hh2=G.t+bo.prep*60;
    spreadLine(e1,P[0],P[1],lx,ly,Wn,function(u,x,y){return newOrder('attack',{x:x,y:y,hHour:hh2,opt:bo,x0:u.x,y0:u.y,then:{k:'defend',x:x,y:y,opt:{post:'hasty'}},dk:'breakthrough'});});
    spreadLine(e2,P[0]-fx*500,P[1]-fy*500,lx,ly,Wn,function(u,x,y){return newOrder('attack',{x:x,y:y,hHour:hh2,delay:1500,opt:Object.assign({},bo,{pace:'rush'}),then:{k:'attack',x:dp[0]+(x-P[0])*0.5,y:dp[1]+(y-P[1])*0.5,opt:{tac:'frontal',pace:'rush',tol:50}},dk:'breakthrough'});});
    engs.slice(0,1).forEach(function(u){add(u,newOrder('breach',{x:P[0]-fx*120,y:P[1]-fy*120}));});fire.forEach(function(u){add(u,newOrder('bombard',{x:P[0],y:P[1],r:Math.max(300,Wn/2),dur:bo.prep*60,then:'support',sup:F.id}));});air.forEach(function(u){if(!isCarrier(u))add(u,newOrder('strike',{x:P[0]+fx*1500,y:P[1]+fy*1500,r:2500}));});return true;}
  if(k==='penetrate'){var mv=man.filter(function(u){return !isE(u);}),Wp=Math.max(400,sum(mv,fw)*0.8);spreadLine(mv,P[0],P[1],lx,ly,Wp,function(u,x,y){return newOrder('penetrate',{x:x,y:y,opt:o.opt});});
    fire.forEach(function(u){add(u,newOrder('support',{sup:F.id}));});oth.forEach(function(u){add(u,newOrder('halt',{}));});air.forEach(function(u){if(!isCarrier(u))add(u,newOrder('patrol',{x:P[0],y:P[1],r:3000}));});return true;}
  if(k==='crossing'){var PL=landingPlan({x:C[0],y:C[1]},{x:P[0],y:P[1]});if(!PL){kids.forEach(function(u){add(u,newOrder('attack',{x:P[0],y:P[1],opt:o.opt}));});logE(F.side,'tac',uName(F)+'：前方沒有河流，改為攻擊',F.x,F.y,F.id);return true;}
    var em=PL.emb,ld=PL.land,ca=Math.atan2(ld[1]-em[1],ld[0]-em[0]),clx=-Math.sin(ca),cly=Math.cos(ca),inf=[],veh=[];leavesOf(F).forEach(function(u){if(!alive(u)||isE(u)||ST(u).dom!=='land'||roleOf(u)==='fire'||roleOf(u)==='sup'||roleOf(u)==='hq')return;(needsFerry(u)?veh:inf).push(u);});
    var e0=engs[0],e1b=engs.filter(function(u){return isBridger(u);})[0]||engs[1]||null;if(e0)add(e0,newOrder('xsite',{x:em[0],y:em[1],xk:'boat'}));if(e1b&&e1b!==e0)add(e1b,newOrder('bridge',{x:(em[0]+ld[0])/2,y:(em[1]+ld[1])/2,bt:'pontoon',opt:{bt:'pontoon'}}));else if(e0)e0._qb=1;
    var Wc=Math.max(400,sum(inf,fw)*0.9);inf.forEach(function(u,i){var off=(i-(inf.length-1)/2)*Wc/Math.max(1,inf.length);add(u,newOrder('landing',{x:P[0]+clx*off,y:P[1]+cly*off,delay:900,opt:o.opt,dk:'crossing'}));});
    veh.forEach(function(u,i){var off=(i-(veh.length-1)/2)*400,a0=ca+PI,wp=validPos(ST(u),em[0]+Math.cos(a0)*1800+clx*off,em[1]+Math.sin(a0)*1800+cly*off);add(u,newOrder('waitx',{x:wp[0],y:wp[1],cx:em[0],cy:em[1],then:{k:'attack',x:P[0]+clx*off,y:P[1]+cly*off,opt:o.opt}}));});
    fire.forEach(function(u){add(u,newOrder('bombard',{x:ld[0]+Math.cos(ca)*400,y:ld[1]+Math.sin(ca)*400,r:600,dur:1500,then:'support',sup:F.id}));});air.forEach(function(u){if(!isCarrier(u))add(u,newOrder('patrol',{x:em[0],y:em[1],r:3000}));});nav.forEach(function(u){add(u,newOrder('move',{x:em[0],y:em[1],r:1500}));});
    logE(F.side,'tac',uName(F)+'規劃渡河：步兵以小艇搶渡，工兵在'+placeTxt(em[0],em[1])+'架設渡口與浮橋，車輛待橋梁完成後跟進',em[0],em[1],F.id);return true;}
  return false;}
