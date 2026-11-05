/* ===================== 砲兵：直接支援（DS）與全般支援（GS）、不擔任第一線防務、煙幕彈；
   AI 的進攻程序：偵察 → 發現 → 火力（砲兵、轟炸機）覆蓋已知的敵軍陣地 → 突擊；沒有發現敵軍就先偵察，不對空地盲目砲擊 ===================== */
Object.assign(ORDN,{smoke:'煙幕'});
function isArty(u){var s=ST(u);return isLeaf(u)&&s.dom==='land'&&indOf(u,s)>0&&roleOf(u)==='fire';}
/* ---------- 支援方式 ---------- */
/* 明確指定的優先；否則：師以上直屬的砲兵＝全般支援，團、旅、營的砲兵＝直接支援所屬部隊 */
var ARTN={DS:'直接支援',GS:'全般支援'};
function artMode(u,o){if(u.artRole==='DS'||u.artRole==='GS')return u.artRole;if(o&&o.sup&&o.sup!==u.p)return 'DS';var P=u.p>=0?uById(u.p):null;return P&&(P.ech||0)>=5?'GS':'DS';}
function nearFriend(side,x,y,R){var near=1e9;gridNearS(x,y,R+100,side,function(q){if(!onMap(q)||!isLeaf(q)||ST(q).dom==='air')return;var d=dist(q.x,q.y,x,y);if(d<near)near=d;});return near;}
/* 全般支援的目標：敵砲兵（反砲兵）、司令部、行軍或集結中的部隊、正與友軍交戰的敵軍；離友軍太近的不打 */
function gsTarget(u,s,IR){var C=G.ct[u.side],best=null,bv=0,safe=s.fl.indexOf('p')>=0?150:400;for(var id in C){var c=C[id];if(c.dead||c.dom==='air'||c.dom==='sea'||c.dom==='sub'||G.t-c.t>(c.cb?900:300))continue;var d=dist(u.x,u.y,c.x,c.y);if(d>IR*0.98)continue;
    var near=nearFriend(u.side,c.x,c.y,3000);if(near<safe)continue;var br=c.br||'',v=(c.cb?2.2:0)+(/art|rkt|mor|sge/.test(br)?1.5:0)+(c.ech>=2&&/hq/.test(br)?1.4:0)+((c.men||100)+(c.veh||0)*15)/1500+(near<3000?1.2/(1+near/800):0)+(c.ms==='rout'?-0.5:0);if(v>bv){bv=v;best=c;}}return bv>0.35?best:null;}
(function(){var b=supportTarget;supportTarget=function(u,s,o,IR){if(artMode(u,o)!=='GS')return b(u,s,o,IR);return gsTarget(u,s,IR||indOf(u,s))||b(u,s,o,IR);};})();
/* ---------- AI 不把砲兵當步兵填防線：給砲兵的防禦、攻擊等第一線命令改為在後方陣地支援 ---------- */
(function(){var b=activate;activate=function(u,o){if(o&&isLeaf(u)&&aiControls(u)&&!o.sat&&!o.smoke&&isArty(u)){
    if(/^(defend|attack|storm|holdfast|screen|delay|breakthrough|penetrate|siege)$/.test(o.k)&&!(u.ms==='rout')){var so=newOrder('support',{sup:u.p>=0?u.p:undefined});so.artFix=o.k;
      if(!u.lineLog||G.t-u.lineLog>6*3600){u.lineLog=G.t;logE(u.side,'arty',uName(u)+'是砲兵，不擔任第一線的「'+(ORDN[o.dk||o.k]||o.k)+'」，改在後方陣地為'+(u.p>=0&&uById(u.p)?uName(uById(u.p)):'友軍')+'提供火力支援',u.x,u.y,u.id);}return b(u,so);}
    if(o.k==='support'&&o.x!==undefined&&!o.artPos){var n=o.x,m=o.y;delete o.x;delete o.y;o._px=[n,m];}}
  return b(u,o);};})();
/* ---------- 煙幕 ---------- */
/* 煙幕持續時間：風大、下雨時短；夜間沒有遮蔽效果的必要但仍有效 */
function smokeDur(){var W=WX[G.env.wx]||WX[0],rain=W[3]>=2,wind=G.env.wind||3;return clamp(900/(1+wind/6)*(rain?0.6:1),240,900);}
function smokeAt(x,y,r,dur,side,src){var L=G.smk||(G.smk=[]),now=G.t;for(var i=L.length-1;i>=0;i--)if(L[i].t1<=now)L.splice(i,1);
  /* 同一處重複發射：延長而不是疊加 */for(var j=0;j<L.length;j++){var q=L[j];if(dist(q.x,q.y,x,y)<q.r*0.5){q.t1=Math.max(q.t1,now+dur);q.r=Math.max(q.r,r);return q;}}
  var z={x:x,y:y,r:r,t0:now,t1:now+dur,side:side,by:src?src.id:0};L.push(z);if(L.length>200)L.splice(0,L.length-200);if(typeof FX!=='undefined'&&FX.cap)FX.ev.push({k:'smoke',x1:x,y1:y,r:r,m:dur});return z;}
/* 視線穿過煙幕的程度：0＝無遮蔽，1＝完全遮蔽 */
function smokeBlock(x0,y0,x1,y1){var L=G.smk;if(!L||!L.length)return 0;var best=0,now=G.t,dx=x1-x0,dy=y1-y0,l2=dx*dx+dy*dy;for(var i=0;i<L.length;i++){var q=L[i];if(q.t1<=now)continue;var t=l2>0?clamp(((q.x-x0)*dx+(q.y-y0)*dy)/l2,0,1):0,px=x0+dx*t,py=y0+dy*t,d=dist(px,py,q.x,q.y),f=q.t1-now<120?(q.t1-now)/120:1;if(d<q.r)best=Math.max(best,f);else if(d<q.r*1.3)best=Math.max(best,0.5*f);}return best;}
(function(){var b=los;los=function(x0,y0,h0,x1,y1,h1){if(G.smk&&G.smk.length&&smokeBlock(x0,y0,x1,y1)>=0.99)return false;return b(x0,y0,h0,x1,y1,h1);};})();
(function(){var b=directFire;directFire=function(u,s,t,d,ch,SA,HA,rE,rM){if(G.smk&&G.smk.length){var k=smokeBlock(u.x,u.y,t.x,t.y);if(k>0){if(SA===undefined){SA=saOf(u,s);HA=haOf(u,s);rE=s.rE*rngF(u);rM=s.rM*rngF(u);}var m=1-0.65*k;return b(u,s,t,d,ch,SA*m,HA*m,rE,rM);}}return b(u,s,t,d,ch,SA,HA,rE,rM);};})();
/* 煙幕射擊：用砲擊任務發射；每一步在目標點（或沿線段）補充煙幕，耗彈約為破片彈的一半 */
function canSmoke(u){var s=ST(u);return s.dom!=='air'&&indOf(u,s)>0&&(G.set.y||1943)>=1915&&s.fl.indexOf('y')<0;}
(function(){var b=artyFire;artyFire=function(u,s,M){var o=u.ord;if(o&&o.smoke&&o.k==='bombard'&&M.kind==='bombard'){var r=clamp(missionR(s)*1.4,200,600),dur=smokeDur();
    if(o.x1!==undefined){var L=dist(o.x,o.y,o.x1,o.y1),n=Math.max(1,Math.round(L/(r*1.4)));for(var i=0;i<=n;i++){var f=n?i/n:0;smokeAt(o.x+(o.x1-o.x)*f,o.y+(o.y1-o.y)*f,r,dur,u.side,u);}}else smokeAt(M.x,M.y,r,dur,u.side,u);
    u.ammo=Math.max(0,u.ammo-0.5*(DT/60));u.lastArt=G.t;u.fired=G.t;if(!o.smLog){o.smLog=1;logE(u.side,'arty',uName(u)+'對'+placeTxt(M.x,M.y)+'發射煙幕彈'+(o.x1!==undefined?'，構成約 '+kmTxt(dist(o.x,o.y,o.x1,o.y1))+' 長的煙幕牆':''),M.x,M.y,u.id);}return;}
  return b(u,s,M);};})();
/* 「煙幕」命令：轉為帶煙幕旗標的砲擊任務 */
(function(){var b=v4Act;v4Act=function(u,o){if(o.k==='smoke'){if(!canSmoke(u)){logE(u.side,'arty',uName(u)+'沒有煙幕彈（'+((G.set.y||1943)<1915?'這個年代還沒有煙幕砲彈':'不是曲射火砲')+'）',u.x,u.y,u.id);u.task='hold';o.st='done';return true;}
  var so=newOrder('bombard',{x:o.x,y:o.y,x1:o.x1,y1:o.y1,r:o.r||300,dur:(o.dur||10)*60,smoke:1,then:'support',sup:u.p>=0?u.p:undefined});activate(u,so);return true;}return b(u,o);};})();
(function(){var b=planOrder;planOrder=function(F,o){if(o.k!=='smoke')return b(F,o);var out=[];leavesOf(F).filter(function(l){return alive(l)&&onMap(l)&&canSmoke(l)&&dist(l.x,l.y,o.x,o.y)<=indOf(l,ST(l))*0.98;}).slice(0,3).forEach(function(l){out.push([l,newOrder('smoke',{x:o.x,y:o.y,x1:o.x1,y1:o.y1,dur:o.dur})]);});
  if(!out.length)logE(F.side,'arty',uName(F)+'沒有射程內、能發射煙幕彈的火砲',o.x,o.y,F.id);return out;};})();
/* ---------- AI 的進攻程序：偵察 → 發現 → 火力 → 突擊 ---------- */
function knownNear(side,x,y,R){var C=G.ct[side],r={n:0,men:0,veh:0,dug:0,pts:[]};for(var id in C){var c=C[id];if(c.dead||c.dom!=='land'||G.t-c.t>3600||c.ms==='rout')continue;if(dist(c.x,c.y,x,y)>R)continue;r.n++;r.men+=c.men||0;r.veh+=c.veh||0;var t=uById(c.id);if(t&&t.ent>=0.5)r.dug++;r.pts.push([c.x,c.y,(c.men||100)+(c.veh||0)*10]);}r.pts.sort(function(a,b){return b[2]-a[2];});return r;}
function probeOrders(F,o){var kids=kidsOf(F).filter(alive),out=[],P=[o.x,o.y],own=leavesOf(F).filter(onMap),C=own.length?centroid(own):[F.x,F.y],d=dist(C[0],C[1],P[0],P[1]),dir=Math.atan2(P[1]-C[1],P[0]-C[0]),back=Math.min(2500,d*0.45),A=[P[0]-Math.cos(dir)*back,P[1]-Math.sin(dir)*back];
  var rec=kids.filter(function(u){return roleOf(u)==='rec';}),man=kids.filter(function(u){return roleOf(u)==='man';});
  if(!rec.length&&man.length){/* 沒有偵察部隊：最小的步兵單位擔任前衛 */var sm=man.slice().sort(function(a,b){return strengthOf(a).f-strengthOf(b).f;})[0];rec=[sm];man=man.filter(function(u){return u!==sm;});}
  rec.forEach(function(u,i){out.push([u,newOrder(roleOf(u)==='rec'?'recon':'move',{x:P[0]+(i-(rec.length-1)/2)*600*-Math.sin(dir),y:P[1]+(i-(rec.length-1)/2)*600*Math.cos(dir),opt:{pace:'careful'}})]);});
  man.forEach(function(u,i){var off=(i-(man.length-1)/2)*Math.max(400,frontW(u)),p=validPos({dom:'land'},A[0]-Math.sin(dir)*off,A[1]+Math.cos(dir)*off);out.push([u,newOrder('move',{x:p[0],y:p[1],face:dir,opt:{pace:'careful'}})]);});
  kids.forEach(function(u){var r=roleOf(u);if(r==='fire')out.push([u,newOrder('support',{sup:F.id})]);else if(r==='air'&&!(isLeaf(u)&&isCarrier(u)))out.push([u,newOrder('patrol',{x:P[0],y:P[1],r:3000})]);});return out;}
(function(){var b=planOrder;planOrder=function(F,o){if(o.k!=='attack'||o.noProbe||!aiControls(F)||G.set.probe===false||(o.opt&&(o.opt.storm||o.opt.tac==='raid'||o.opt.tac==='feint'))||o.x===undefined)return b(F,o);
  var R=Math.max(1500,(o.w||2000)*0.6),kn=knownNear(F.side,o.x,o.y,R);
  if(!kn.n){if(!F.probe||F.probe.oid!==o.oid){F.probe={oid:o.oid,t:G.t};logE(F.side,'tac',uName(F)+'在'+placeTxt(o.x,o.y)+'一帶沒有發現敵軍：先派偵察前出，主力在後方集結，不對空地盲目砲擊',o.x,o.y,F.id);}return probeOrders(F,o);}
  /* 發現了敵軍：小股、沒有工事的敵人直接突擊；有工事或兵力較多才實施火力準備，並打已知的敵軍陣地 */
  var opt=Object.assign({},o.opt||{}),str=kn.men+kn.veh*10;if(str<400&&!kn.dug)opt.prep=0;else opt.prep=Math.max(opt.prep||0,kn.dug?30:15);var o2=Object.assign({},o,{opt:opt,noProbe:1});if(opt.prep>0&&!o2.hHour)o2.hHour=G.t+opt.prep*60;
  var out=b(F,o2),j=0;out.forEach(function(p){var so=p[1];if(so&&so.k==='bombard'&&kn.pts.length){var q=kn.pts[j%kn.pts.length];j++;so.x=q[0];so.y=q[1];so.r=Math.max(250,Math.min(so.r||400,500));}});
  /* 突擊時刻：一門能發射煙幕的火砲在敵軍陣地前沿施放煙幕 10 分鐘，掩護部隊越過開闊地（至少保留一個單位打破片彈） */
  var fb=out.filter(function(p){return p[1]&&p[1].k==='bombard'&&isLeaf(p[0])&&canSmoke(p[0]);});if(fb.length>=2&&o2.hHour&&kn.pts.length){var own=leavesOf(F).filter(onMap),C0=own.length?centroid(own):[F.x,F.y],ex=sum(kn.pts,function(q){return q[0];})/kn.pts.length,ey=sum(kn.pts,function(q){return q[1];})/kn.pts.length,dd=Math.max(1,dist(C0[0],C0[1],ex,ey)),sx=ex+(C0[0]-ex)/dd*250,sy=ey+(C0[1]-ey)/dd*250,sm=fb[fb.length-1];
    sm[1]=newOrder('bombard',{x:sx,y:sy,r:300,dur:600,tot:o2.hHour,smoke:1,then:'support',sup:F.id});}
  if(F.probe&&F.probe.oid===o.oid&&!F.probe.found){F.probe.found=true;F.probe.ft=G.t;}
  logE(F.side,'tac',uName(F)+'發現'+placeTxt(o.x,o.y)+'的敵軍（約 '+fmt(kn.men)+' 人'+(kn.veh?'、'+fmt(kn.veh)+' 輛車':'')+(kn.dug?'，有工事':'')+'）：'+(opt.prep>0?'先以砲火覆蓋已知陣地 '+opt.prep+' 分鐘，再發起突擊':'敵軍薄弱，直接突擊'),o.x,o.y,F.id);return out;};})();
/* 偵察中的進攻：發現敵軍（或三小時後仍無接觸）就重新下達突擊 */
function probeStep(){G.units.forEach(function(F){var P=F.probe;if(!P||isLeaf(F)||!alive(F))return;var o=F.ord;if(!o||o.oid!==P.oid||o.st==='done'||o.k!=='attack'){F.probe=null;return;}if(P.found)return;
  var kn=knownNear(F.side,o.x,o.y,Math.max(1500,(o.w||2000)*0.6)),late=G.t-P.t>3*3600;if(!kn.n&&!late)return;P.found=true;P.ft=G.t;var o2=Object.assign({},o);if(late&&!kn.n){o2.noProbe=1;o2.opt=Object.assign({},o.opt||{},{prep:0});logE(F.side,'tac',uName(F)+'偵察三小時沒有發現敵軍，主力前進佔領'+placeTxt(o.x,o.y),o.x,o.y,F.id);}
  planOrder(F,o2).forEach(function(p){var so=p[1];so.sub=1;so.parent=o.oid;sendOrder(F,p[0],so,false);});});}
(function(){var b=v8Step;v8Step=function(){b();if(G.step%4===2)probeStep();};})();
