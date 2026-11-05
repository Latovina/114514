/* ===================== 單位行動：啟動命令、路徑、移動、隊形、司令部位置、空中任務、工兵作業、潰退、增援抵達 ===================== */
function alive(u){return u.st!=='dead'&&u.st!=='off';}
function onMap(u){return alive(u)&&u.st!=='base'&&u.st!=='lift'&&u.st!=='ship'&&!u.hqLost;}
/* 依旗標分類的本方在場單位（每一步只建立一次；補給、憲兵、醫療等的「最近的某種單位」搜尋不必每次掃描全部單位） */
function flUnits(side,f){var C=G._flC;if(!C||C.t!==G.t||C.n!==G.units.length||C.st!==G.step){C=G._flC={t:G.t,n:G.units.length,st:G.step};}var k=f+side,L=C[k];if(L)return L;L=C[k]=[];for(var i=0;i<G.units.length;i++){var q=G.units[i];if(q.side===side&&onMap(q)&&ST(q).fl.indexOf(f)>=0)L.push(q);}return L;}
function isAir(u){return ST(u).dom==='air';}
/* 指揮範圍：與上級司令部的距離在指揮半徑內 */
function inCmd(u){if(u.p<0)return true;var P=uById(u.p);if(!P||!alive(P))return false;var E=uEra(P),off=offOf(P),R=E.hqR*1000*(0.8+0.04*(off?off.cmd:5));return dist(u.x,u.y,P.x,P.y)<=R;}
/* 突擊距離與行軍安全距離（依時代） */
function aRng(u){var E=uEra(u);return E.bp?110:E.i<=5?150:200;}
function marchSafe(u){var E=uEra(u);return E.i<=3?2500:E.i<=5?4000:E.i<=7?8000:12000;}
/* ---------- 路徑請求（每步最多處理數條，避免卡頓） ---------- */
function wantPath(u,x,y){u.goal=[x,y];u.path=null;var s=ST(u),d=dist(u.x,u.y,x,y);if(s.dom==='air'||(d<(isLeaf(u)?1500:4000)&&lineOK(s,u.x,u.y,x,y))){u.path={pts:[u.x,u.y,x,y],i:2};u.pq=0;return;}
  /* 同一目標最近才找不到路（城牆、包圍圈、斷橋）：一段時間內不重算，避免反覆搜尋整張地圖 */var F=u.noPath;if(F&&G.t-F.t<(F.n>=3?3600:900)&&dist(F.x,F.y,x,y)<400&&dist(F.ux,F.uy,u.x,u.y)<300&&F.v===(G._mapv||0)){u.goal=null;u.pq=0;return;}if(!u.pq){u.pq=1;G.pq.push(u.id);}}
var PCH={},PCN=0;
/* 同一粗格出發、前往同一粗格的部隊（例如同一個營的各連）共用最近算出的路線，只重算頭尾兩段 */
function pathShare(u,s,av){var MP=G.map,GW=MP.GW,B=Math.max(6,Math.round(2500/MP.cs)),a=cellAt(u.x,u.y),b=cellAt(u.goal[0],u.goal[1]),pf=s.dom==='land'?pfFor(s.mobi):null,key=(pf?pf.key:s.dom+(s.dr||0))+'|'+s.vr+'|'+s.vx+'|'+u.side+'|'+(av?1:0)+'|'+(((a/GW)|0)/B|0)+','+((a%GW)/B|0)+'>'+(((b/GW)|0)/B|0)+','+((b%GW)/B|0);return key;}
function pathReuse(u,s,key){var C=PCH[key];if(!C||G.t-C.t>1200||C.rdi!==G.rdi||C.v!==(G._mapv||0))return null;var P=C.pts,n=P.length;if(n<4)return null;var mid=P.slice(2,n-2),gx=u.goal[0],gy=u.goal[1];
  if(!mid.length)return lineOK(s,u.x,u.y,gx,gy)?{pts:[u.x,u.y,gx,gy],sec:C.sec}:null;if(!lineOK(s,u.x,u.y,mid[0],mid[1])||!lineOK(s,mid[mid.length-2],mid[mid.length-1],gx,gy))return null;return {pts:[u.x,u.y].concat(mid,[gx,gy]),sec:C.sec};}
function pathStep(){var n=0,t0=Date.now(),bud=G._pfMs||20;while(G.pq.length&&n<12&&Date.now()-t0<bud){var u=uById(G.pq.shift());if(!u||!alive(u)||!u.pq)continue;u.pq=0;if(!u.goal)continue;n++;var s=ST(u),av=s.dom==='land'?roadAvoid(u):null,pk=pathShare(u,s,av),R=pathReuse(u,s,pk);if(R)n-=0.75;else{R=findPath(s,u.x,u.y,u.goal[0],u.goal[1],{w:1.15,max:G.map.GW*G.map.GH,avoid:av});if(R&&R.pts.length>=4){if(PCN>600){PCH={};PCN=0;}if(!PCH[pk])PCN++;PCH[pk]={pts:R.pts,sec:R.sec,t:G.t,rdi:G.rdi,v:G._mapv||0};}}
    if(R&&R.pts.length>=4){u.path={pts:R.pts,i:2};u.eta=G.t+R.sec;u.stuck=0;}else{var F0=u.noPath;u.noPath={x:u.goal[0],y:u.goal[1],ux:u.x,uy:u.y,t:G.t,v:G._mapv||0,n:F0&&dist(F0.x,F0.y,u.goal[0],u.goal[1])<400?F0.n+1:1};u.path=null;u.stuck=(u.stuck||0)+1;if(u.stuck===1)logE(u.side,'path',uName(u)+'找不到可行路線（'+placeTxt(u.goal[0],u.goal[1])+'），原地待命',u.x,u.y,u.id);u.goal=null;}}}
/* ---------- 速度（公尺／秒） ---------- */
function speedAt(u,s,pf){var dom=s.dom,v;if(dom==='air')return s.vr/3.6;if(dom==='sea'||dom==='sub'){v=(u.ord&&/attack|withdraw/.test(u.ord.k)?s.vr:s.vx);return v/3.6*(1-u.sup/250)*(u.ms==='rout'?1.1:1);}
  var k=cellAt(u.x,u.y),road=pf.road[k]?s.vr*pf.road[k]*(G.rdi&&G.rdi[k]?1-G.rdi[k]*0.0036*(rdMP(u)?0.6:1):1)*trfMul(u,k):0,off=pf.off[k]*s.vx;if(u.form==='march')v=Math.max(road,off);else if(u.form==='square')v=off*0.25;else v=Math.max(off,road*0.45);
  if(v<=0.05)v=Math.max(0.3,s.vx*0.1);v*=(1-u.fat/250)*(1-u.sup/150)*(0.55+u.org/220)*lgSpeed(u)*paceOf(u)[2]*(optOf(u).tac==='infil'&&u.ord&&u.ord.k==='attack'?0.6:1)*(fmOf(u)==='column'&&u.form==='deployed'?1.15:1);if(s.mobi===0&&u.lg&&u.lg.ld)v*=clamp(1-(u.lg.ld-30)*0.006,0.8,1.08);if(road>0&&G.civ&&!G.rdi)v*=civCongest(u);if(G.evt)v*=evtSpeed(u,s);if(u.kit)v*=kitSpeed(u,s);var E=G.env;if(E.light<0.3&&!(s.nv>=1))v*=u.form==='march'&&road>0?0.7:0.5;if(u.ms==='rout')v*=1.15;return v/3.6;}
function moveAlong(u,d){var P=u.path;if(!P)return 0;var moved=0;while(d>0.01&&P.i<P.pts.length){var tx=P.pts[P.i],ty=P.pts[P.i+1],dx=tx-u.x,dy=ty-u.y,L=Math.sqrt(dx*dx+dy*dy);if(L>1)u.hd=Math.atan2(dy,dx);
    if(L<=d){u.x=tx;u.y=ty;d-=L;moved+=L;P.i+=2;}else{u.x+=dx/L*d;u.y+=dy/L*d;moved+=d;d=0;}}if(P.i>=P.pts.length){u.path=null;u.arrT=G.t;}return moved;}
/* 依時間預算移動：逐格重新計算速度（道路、越野、渡河） */
function moveStep(u,s,frac){if(!u.path||u.formTo)return 0;if(roadAhead(u,s))return 0;var pf=s.dom==='land'?pfFor(s.mobi):null,tb=DT*(frac===undefined?1:frac),tot=0,cs=G.map.cs,guard=0;
  while(tb>0.5&&u.path&&guard++<60){var v=Math.max(0.05,speedAt(u,s,pf)),st=Math.min(s.dom==='land'?cs:cs*6,v*tb),mv=moveAlong(u,st);tot+=mv;tb-=mv/v;if(mv<st*0.999)break;}
  if(tot>0){u.movedAt=G.t;u.ent=Math.min(u.ent,ftEnt(u));u.km=(u.km||0)+tot/1000;}return tot;}
/* 附近有本方憲兵疏導交通（10 分鐘快取） */
function rdMP(u){if(u._mpT!==undefined&&G.t-u._mpT<600)return u._mp;u._mpT=G.t;u._mp=G.units.some(function(q){return q.side===u.side&&onMap(q)&&ST(q).fl.indexOf('M')>=0&&dist(q.x,q.y,u.x,u.y)<4000;});return u._mp;}
function ftEnt(u){var f=G.map.ft[cellAt(u.x,u.y)];return f===5?0.95:f===4||f===6?0.9:f===1?0.6:0;}
/* ---------- 隊形：行軍縱隊、展開、方陣；火砲放列 ---------- */
function setForm(u,f){if(u.form===f&&!u.formTo)return;if(u.formTo===f)return;var E=uEra(u),s=ST(u),t=E.deploy*60*(1.3-0.006*(u.trn||60));if(f==='square')t=90*(1.3-0.006*(u.trn||60));
  if(s.fl.indexOf('g')>=0)t*=1.5;if(f==='march'&&u.form==='deployed')t*=0.6;if(s.dom!=='land')t=0;if(u.form===f){u.formTo=null;return;}u.formTo=f;u.formT=G.t+t;}
function formStep(u){if(u.formTo&&G.t>=u.formT){u.form=u.formTo;u.formTo=null;}}
/* ---------- 啟動命令（葉單位） ---------- */
function activate(u,o){var s=ST(u);if(o.k==='support'&&o.sup)u.supA=o.sup;else if(o.k==='halt')u.supA=0;if(u.st==='lift'&&u.lift){u.lift.then=o;return;}if(u.amph){u.amph.then=o;return;}u.meetHold=0;u.ord=o;o.st='exec';o.t1=G.t;o.m0=strFrac(u);o.vi=0;u.task=null;u.tgtP=null;u.waitT=o.delay?G.t+o.delay:0;u.arrT=0;u.mis=null;u.ambT=0;
  if(!u.irr)logE(u.side,'act',uName(u)+'開始執行命令：'+ordN(o)+(o.x!==undefined?'（'+placeTxt(o.x,o.y)+'）':''),u.x,u.y,u.id);
  if(projAct(u,o))return;if(engAct(u,o))return;if(v4Act(u,o))return;
  if(s.dom==='air'){u.task=u.st==='air'?'go':'base';if(u.st==='air'&&o.x!==undefined){u.goal=[o.x,o.y];u.path={pts:[u.x,u.y,o.x,o.y],i:2};}return;}
  var k=o.k,goto=function(x,y){if(x===undefined)return;if(dist(u.x,u.y,x,y)<G.map.cs*1.5){u.task='at';return;}u.task='go';wantPath(u,x,y);};
  if(k==='halt'||k==='rest'){u.task='hold';u.path=null;u.goal=null;return;}
  if(k==='bombard'){if(sgDirect(s)&&o.x!==undefined){var wa=sgAim(u,o.x,o.y);o.x=wa[0];o.y=wa[1];}var R=s.ind||s.rM;if(o.x!==undefined&&dist(u.x,u.y,o.x,o.y)>R*0.92){var a=Math.atan2(u.y-o.y,u.x-o.x),fp=validPos(s,o.x+Math.cos(a)*R*0.6,o.y+Math.sin(a)*R*0.6);goto(fp[0],fp[1]);}else u.task='at';return;}
  /* 火力支援：有支援對象時一律在對象後方選射擊陣地（命令上的地點只是關注的地區，不是要開進去的位置） */
  if(k==='support'&&(o.x===undefined||o.sup)){var F=o.sup?uById(o.sup):null,L=F?leavesOf(F).filter(onMap):[],C=L.length?centroid(L):[u.x,u.y],ec=enemyCentroid(u.side,C[0],C[1]),b=ec?Math.atan2(C[1]-ec[1],C[0]-ec[0]):homeDir(u.side),back=clamp((s.ind||s.rM)*0.3,600,9000),pp=validPos(s,C[0]+Math.cos(b)*back,C[1]+Math.sin(b)*back);if(G.set.beh!==false){var aR=avoidR(u,s,clsOf(u))+300;for(var tries=0;tries<3;tries++){var nd=1e9,CC=G.ct[u.side];for(var cid in CC){var cc=CC[cid];if(G.t-cc.t>900||cc.dead||cc.dom==='air')continue;var dd2=dist(pp[0],pp[1],cc.x,cc.y);if(dd2<nd)nd=dd2;}if(nd>=aR)break;back+=1000;pp=validPos(s,C[0]+Math.cos(b)*back,C[1]+Math.sin(b)*back);}}
    if(dist(u.x,u.y,pp[0],pp[1])>Math.max(1500,back*0.6))goto(pp[0],pp[1]);else u.task='at';return;}
  if(k==='bridge'||k==='demolish'){var q=k==='bridge'?riverNear(o.x,o.y,1500):demoNear(o.x,o.y,1500);if(!q){logE(u.side,'eng',uName(u)+'：目標附近找不到'+(k==='bridge'?'河道':'橋梁或隧道'),u.x,u.y,u.id);u.task='hold';return;}if(k==='bridge')q.bt=bridgeType(u,o,q);
    if(k==='bridge'&&!isEng(u)){if(kitN(u,'pont')>=pontNeed(q.c)){q.bt='pontoon';o.kitB='pont';}else if(kitN(u,'trestle')>0&&q.c<=2){q.bt='fixed';o.kitB='trestle';}else{logE(u.side,'eng',uName(u)+'：浮橋組件不足（此處需要 '+pontNeed(q.c)+' 組）',u.x,u.y,u.id);u.task='hold';return;}}o.site=q;var sp=validPos(s,q.bx,q.by);goto(sp[0],sp[1]);return;}
  if(k==='attack'&&o.hHour&&o.hHour>G.t){if(o.fup&&dist(u.x,u.y,o.fup[0],o.fup[1])>300){o.fupGo=1;goto(o.fup[0],o.fup[1]);if(u.task==='go')return;o.fupGo=0;}u.task='wait';return;}
  if(o.via&&o.via.length){goto(o.via[0][0],o.via[0][1]);if(u.task==='at'){o.vi=1;u.task=null;goto(o.x,o.y);}if(!u.task)u.task='hold';return;}
  goto(o.x,o.y);if(!u.task)u.task='hold';}
/* ---------- 每步行為（葉單位） ---------- */
function leafStep(u){var s=ST(u);formStep(u);if(s.dom==='air'){airStep(u,s);return;}if(u.st==='lift')return;if(u.ms==='rout'&&!u.amph){routStep(u,s);return;}if(projLeaf(u,s))return;if(engLeaf(u,s))return;if(v4Leaf(u,s))return;if(behStep(u,s))return;if(u.waitT&&G.t<u.waitT)return;
  var o=u.ord,k=o?o.k:'halt',ed=u._ed===undefined?1e9:u._ed,g=s.fl.indexOf('g')>=0,mv=0,uf=G.t-(u.uf||-1e9)<90;
  /* 遭遇戰：行軍縱隊近距離遇敵 → 就地展開交戰，停下等待指示 */if(G.set.meet!==false&&meetCheck(u,s,ed,uf))return;if(u.meetHold&&G.t<u.meetHold){if(s.dom==='land'&&u.form!=='deployed'&&u.formTo!=='deployed')setForm(u,'deployed');return;}
  /* 隊形 */
  var wantMarch=(u.task==='go'&&(k==='move'||k==='reserve'||k==='withdraw'||k==='support'||k==='bombard'||k==='bridge'||k==='demolish'||(k==='attack'&&ed>marchSafe(u)*1.5)||k==='recon'&&ed>marchSafe(u))&&ed>marchSafe(u)*(k==='withdraw'?0.3:1));
  if(s.dom==='land'){if(u._cav&&s.fl.indexOf('q')>=0&&u.task!=='go'&&!(u.ord&&u.ord.k==='withdraw'))setForm(u,'square');else setForm(u,wantMarch?'march':'deployed');}
  if(u.task==='wait'){if(!o.hHour||G.t>=o.hHour){u.task='go';if(o.via&&o.vi<o.via.length)wantPath(u,o.via[o.vi][0],o.via[o.vi][1]);else wantPath(u,o.x,o.y);}return;}
  if(o&&tacStep(u,s,o,ed))return;
  if(u.task==='go'){if(u.pq)return;if(!u.path){u.task='at';u.arrT=G.t;}else{
      /* 遭到射擊或敵人逼近時：移動命令停下應戰（撤退除外）；攻擊命令邊打邊前進 */
      if(k==='attack'){if(u.sup>45||u.formTo)return;if(ed<rangeOf(s)*0.8&&u._eid&&G.t-(u.fired||-1e9)<60){mv=moveStep(u,s,0.4);}else mv=moveStep(u,s,1);}
      else if(k!=='withdraw'&&uf&&k!=='support'&&k!=='bombard'){u.halted=G.t;return;}
      else if(k==='recon'&&ed<1200){return;}
      else mv=moveStep(u,s,1);
      if(!u.path){if(o&&o.via&&o.vi<o.via.length){o.vi++;if(o.vi<o.via.length)wantPath(u,o.via[o.vi][0],o.via[o.vi][1]);else{logE(u.side,'tac',uName(u)+(o.dk==='penetrate'?'完成穿插，向目標發動攻擊':'抵達迂迴集結點，轉向攻擊'),u.x,u.y,u.id);wantPath(u,o.x,o.y);}return;}u.task='at';u.arrT=G.t;}}}
  if(k==='move'&&u.halted&&!uf&&G.t-u.halted>180&&u.goal&&!u.path&&u.task!=='go'){u.halted=0;u.task='go';wantPath(u,u.goal[0],u.goal[1]);}
  /* 抵達出發線：等到 H 時 */
  if(k==='attack'&&o.fupGo&&u.task==='at'){o.fupGo=0;if(o.via&&o.via.length&&!o.vi&&dist(o.fup[0],o.fup[1],o.via[0][0],o.via[0][1])<50)o.vi=1;if(o.hHour>G.t){u.task='wait';if(!o.fupLog){o.fupLog=1;logE(u.side,'arr',uName(u)+'抵達出發線，等待 H 時（'+clockTxt(dateOf(G.set.y,G.set.m,G.set.d,o.hHour+G.set.h*3600+(G.set.mi||0)*60))+'）',u.x,u.y,u.id);}return;}u.task='go';if(o.via&&o.vi<o.via.length)wantPath(u,o.via[o.vi][0],o.via[o.vi][1]);else wantPath(u,o.x,o.y);return;}
  /* 到達或原地 */
  if(u.task==='at'||u.task==='hold'){if(o&&o.face!==undefined&&u.task==='at')u.hd=o.face;
    if(k==='attack'){var en=u._eid?uById(u._eid):null;if(en&&ed<aRng(u)*1.6&&u.sup<55&&u.ms==='ok'){u.task='go';u.path={pts:[u.x,u.y,en.x,en.y],i:2};}
      else if(en&&ed<rangeOf(s)*1.2&&ed>aRng(u)*1.6&&u.sup<40&&u.ms==='ok'&&G.t-(u.arrT||0)>120){var a2=Math.atan2(en.y-u.y,en.x-u.x),st=Math.min(ed-aRng(u),400);u.task='go';u.path={pts:[u.x,u.y,u.x+Math.cos(a2)*st,u.y+Math.sin(a2)*st],i:2};}
      else if(!en&&u.task==='at'){if(dist(u.x,u.y,o.x,o.y)>400&&!o.reached){u.task='go';wantPath(u,o.x,o.y);}else{u.task='hold';o.st='done';if(!o.reached){o.reached=1;logE(u.side,'arr',uName(u)+'抵達攻擊目標（'+placeTxt(u.x,u.y)+'）',u.x,u.y,u.id);}}}}
    else if(u.task==='at'){u.task='hold';if(k==='move'||k==='reserve'||k==='defend'||k==='screen'||k==='withdraw'||k==='recon'||k==='fortify')logE(u.side,'arr',uName(u)+'抵達'+placeTxt(u.x,u.y),u.x,u.y,u.id);
      if(k==='bridge'||k==='demolish'){u.task='work';u.workT=G.t+(k==='bridge'?bridgeTime(u,o):o.site.kind==='tunnel'?2400:1200)*(hasQ(offOf(u),'sapper')?0.67:1);logE(u.side,'eng',uName(u)+'開始'+(k==='bridge'?'架設'+(BRT[{assault:'a',pontoon:'f',fixed:'e'}[o.site.bt]]||'橋梁'):o.site.kind==='tunnel'?'爆破隧道':'爆破橋梁')+'，預計 '+durTxt(u.workT-G.t),u.x,u.y,u.id);}}
    /* 掩護：遭到優勢敵軍逼近即後撤 */
    if(k==='screen'&&u._ep&&u._ep>strengthOf(u).men*2&&ed<1500){var b2=homeDir(u.side),bp=validPos(s,u.x+Math.cos(b2)*1500,u.y+Math.sin(b2)*1500);u.task='go';wantPath(u,bp[0],bp[1]);logE(u.side,'screen',uName(u)+'遭優勢敵軍逼近，依令後撤',u.x,u.y,u.id);}}
  if(u.task==='work'&&G.t>=u.workT){u.task='hold';if(k==='bridge'){buildBridge(o.site,u);if(o.kitB&&u.kit){u.kit[o.kitB]=Math.max(0,(u.kit[o.kitB]||0)-(o.kitB==='pont'?pontNeed(o.site.c):1));}}else{blowBridge(o.site,u);if(G.civ&&o.site&&o.site.list)propInf(o.site.kind==='tunnel'?'tunnel':'bridge',o.site.list[0]?o.site.list[0].c:2,u.side,1);}o.st='done';}
  /* 構工：靜止時增加工事 */
  if(mv<1&&u.task!=='go'&&s.dom==='land'&&u.form!=='march'){var dr=s.dig*0.06/120*(k==='fortify'?1.6:1)*(hasQ(offOf(u),'sapper')?1.5:1)*(G.env.frozen?0.5:1)*eqM(u,'dg');u.ent=clamp(u.ent+dr,ftEnt(u),1);if(k==='fortify'&&s.fl.indexOf('e')>=0&&u.ent>=0.95&&!u.fortDone){u.fortDone=1;digLine(u);}}
  /* 火砲：放列才可射擊 */
  if(g&&s.dom==='land'&&u.task!=='go')setForm(u,'deployed');}
function rangeOf(s){return Math.max(s.rM,s.ind)||300;}
/* ---------- 潰退：朝本方後方逃離，脫離接觸後重新集結 ---------- */
function routStep(u,s){var dyn=G.set.dynMor!==false;if(!u.path&&!u.pq||G.t-(u.routT||0)>900){u.routT=G.t;var rp=dyn?rallyPoint(u,s):null;
    if(rp){if(dist(u.x,u.y,rp[0],rp[1])>600){u.task='go';wantPath(u,rp[0],rp[1]);}else{u.path=null;u.task='hold';}}
    else{var h=homeDir(u.side),en=u._eid?uById(u._eid):null,bx=Math.cos(h),by=Math.sin(h);if(en){var a=Math.atan2(u.y-en.y,u.x-en.x);bx=Math.cos(a)*0.6+bx*0.4;by=Math.sin(a)*0.6+by*0.4;}var L=Math.sqrt(bx*bx+by*by)||1,p=validPos(s,u.x+bx/L*3000,u.y+by/L*3000);u.task='go';wantPath(u,p[0],p[1]);}}
  u.form='march';u.formTo=null;if(u.path)moveStep(u,s,1);
  if(dyn?rallyOK(u,s):(G.t-(u.uf||-1e9)>900&&u.mor>=30)){if(dyn)rallyDone(u,s);else{u.ms='shaken';u.task='hold';u.path=null;u.ord=null;logE(u.side,'rally',uName(u)+'在'+placeTxt(u.x,u.y)+'重新集結',u.x,u.y,u.id);}}}
/* ---------- 司令部：位在所屬部隊後方，跟隨移動 ---------- */
var HQBACK=[0,150,500,1200,2000,3500,5500,8000,11000];
function hqStep(F){if(!alive(F)||F.st==='lift')return;var s=ST(F);if(s.dom==='air')return;if(F.amph){amphStep(F,s);return;}if(F.regT&&G.t<F.regT)return;var LL=leavesC(F).filter(onMap);if(LL.length&&LL.filter(function(x){var d=ST(x).dom;return d!=='land';}).length>=LL.length*0.6){var cc=centroid(LL);F.x=cc[0];F.y=cc[1];F.path=null;return;}var L=s.dom==='land'?LL:LL.filter(function(x){return ST(x).dom===s.dom;});if(!L.length){return;}
  if(F.hold&&G.t<F.hold)return;var C=centroid(L),ec=enemyCentroid(F.side,C[0],C[1],40000),b=ec?Math.atan2(C[1]-ec[1],C[0]-ec[0]):homeDir(F.side),bk=HQBACK[clamp(F.ech,0,7)];if(G.step%4===(F.id%4)){var th=hqThreat(F);if(th){if(G.t-(F.thrT||-1e9)>=600&&G.t-(F.hqPT||0)>180)F.hqPT=0;F.thrT=G.t;if(F.ech>=3&&(!F.evLog||G.t-F.evLog>7200)){F.evLog=G.t;logE(F.side,'evade',uName(F)+'的司令部因敵軍逼近（'+kmTxt(th)+'）而轉移',F.x,F.y,F.id);}}}if(G.t-(F.thrT||-1e9)<600)bk=Math.max(bk,hqThrR(F)+500);var tx=C[0]+Math.cos(b)*bk,ty=C[1]+Math.sin(b)*bk,d=dist(F.x,F.y,tx,ty);
  if(F.ms==='rout'){routStep(F,s);return;}
  if(d>Math.max(800,bk*0.6)&&!F.pq&&(!F.path||G.t-(F.hqPT||0)>900)){F.hqPT=G.t;var p=validPos(s,tx,ty);if(dist(F.x,F.y,p[0],p[1])>300)wantPath(F,p[0],p[1]);}
  if(F.path){F.form='march';moveStep(F,s,1);}else if(d<Math.max(800,bk*0.6))F.form='deployed';}
/* ---------- 空中單位：起飛、前往、盤旋（巡邏／打擊／偵察）、返航、整補 ---------- */
function baseOf(u){if(u.baseU){var c=uById(u.baseU);if(c&&alive(c))return [c.x,c.y];}return u.base||[u.x,u.y];}
function endOf(s){return (s.end||(s.fl.indexOf('A')>=0?2.5:s.br==='uav'?12:3))*3600;}
function rearmOf(s){return s.fl.indexOf('Y')>=0?7200:s.fl.indexOf('A')>=0?2700:s.fl.indexOf('Z')>=0?3*3600:s.br==='uav'?3600:5400;}
function airStep(u,s){if(u.lift&&u.st==='air'){carrierStep(u,s);return;}if(u.lift&&u.st!=='air')u.lift=null;var o=u.ord,W=WX[G.env.wx][5],B=baseOf(u);
  if(u.st==='base'){u.x=B[0];u.y=B[1];if(u.readyT&&G.t<u.readyT)return;if(u.readyT){if(typeof airRearm==='function'&&!airRearm(u)){u.readyT=G.t+600;if(!u.noSupLog||G.t-u.noSupLog>3600){u.noSupLog=G.t;logE(u.side,'log',uName(u)+'：基地燃料或彈藥不足，延後出擊',u.x,u.y,u.id);}return;}u.readyT=0;u.ammo=100;u.fuel=endOf(s);}
    if(o&&o.st!=='done'&&o.x!==undefined&&o.k!=='halt'&&o.k!=='rest'){if(W<=0.05||(G.env.light<0.3&&s.nv<1&&s.fl.indexOf('Y')<0&&s.fl.indexOf('Z')<0&&o.k!=='patrol')){if(!u.gnd){u.gnd=1;logE(u.side,'air',uName(u)+'因'+(W<=0.05?WX[G.env.wx][1]:'夜間')+'無法出擊',u.x,u.y,u.id);}return;}
      u.gnd=0;u.st='air';u.fuel=u.fuel||endOf(s);u.task='go';u.path={pts:[u.x,u.y,o.x,o.y],i:2};u.sorties=(u.sorties||0)+1;ldPick(u,o);logE(u.side,'air',uName(u)+'起飛執行'+ORDN[o.k]+'（第 '+u.sorties+' 架次'+ldTxt(u)+'）',u.x,u.y,u.id);}return;}
  u.fuel-=DT;var v=s.vr/3.6,tHome=dist(u.x,u.y,B[0],B[1])/v;
  if(u.task!=='rtb'&&(u.fuel<tHome*1.15+300||u.ammo<8||W<=0.05||u.ms==='rout'||!o||o.k==='halt'||o.k==='rest')){u.task='rtb';u.path={pts:[u.x,u.y,B[0],B[1]],i:2};}
  if(u.task==='rtb'){u.path={pts:[u.x,u.y,B[0],B[1]],i:2};moveStep(u,s,1);if(!u.path){u.st='base';u.task='base';u.readyT=G.t+rearmOf(s)*(u.ms==='rout'?1.5:1);if(u.ms==='rout')u.ms='shaken';logE(u.side,'air',uName(u)+'返回基地整補',u.x,u.y,u.id);}return;}
  if(u.task==='go'){if(o&&o.x!==undefined)u.path={pts:[u.x,u.y,o.x,o.y],i:2};moveStep(u,s,1);if(!u.path){u.task='loiter';u.la=Math.atan2(u.y-(o?o.y:u.y),u.x-(o?o.x:u.x));if(o&&o.k==='nuke'&&o.nuke&&!o.boom){o.boom=1;o.st='done';logE(u.side,'nuke','☢ '+uName(u)+'投下核彈',u.x,u.y,u.id);nukeAt(u.side,o.x,o.y,o.nuke,u,o.wk);u.task='rtb';}}return;}
  if(u.task==='loiter'&&o){var r=Math.max(800,(o.r||3000)*0.5),cx=o.x,cy=o.y;u.la=(u.la||0)+v*DT/r*0.5;var tx=cx+Math.cos(u.la)*r,ty=cy+Math.sin(u.la)*r;u.hd=Math.atan2(ty-u.y,tx-u.x);var dd=dist(u.x,u.y,tx,ty),st=Math.min(dd,v*DT);u.x+=Math.cos(u.hd)*st;u.y+=Math.sin(u.hd)*st;
    if(o.k==='move'){u.task='rtb';}}}
/* ---------- 工兵：架橋、爆破、構築塹壕 ---------- */
function riverNear(x,y,R){var MP=G.map,cs=MP.cs,c0=cellAt(x,y),gx=c0%MP.GW,gy=(c0/MP.GW)|0,Rc=Math.ceil(R/cs),best=null,bd=1e18;
  for(var b=-Rc;b<=Rc;b++)for(var a=-Rc;a<=Rc;a++){var X=gx+a,Y=gy+b;if(X<0||Y<0||X>=MP.GW||Y>=MP.GH)continue;var k=Y*MP.GW+X,c=MP.lc[k],rv=MP.rv[k];if(!(c===LCI.riv||rv>=2))continue;if(MP.rd[k])continue;var d=a*a+b*b;if(d<bd){bd=d;best=k;}}
  if(best===null)return null;var bx=best%MP.GW,by=(best/MP.GW)|0,cls=Math.max(MP.rv[best],MP.lc[best]===LCI.riv?3:0);
  /* 找出垂直河道方向的跨越線：從兩岸各走到陸地 */
  var dirs=[[1,0],[0,1],[1,1],[1,-1]],bestL=null;dirs.forEach(function(dv){var cells=[best],ok=[false,false],ends=[null,null];for(var sgn=-1;sgn<=1;sgn+=2){for(var t=1;t<=14;t++){var X=bx+dv[0]*t*sgn,Y=by+dv[1]*t*sgn;if(X<0||Y<0||X>=MP.GW||Y>=MP.GH)break;var k=Y*MP.GW+X,w=MP.lc[k]===LCI.riv||MP.rv[k]>=2||isWater(MP.lc[k]);if(!w){ok[sgn<0?0:1]=true;ends[sgn<0?0:1]=k;break;}cells.push(k);}}
    if(ok[0]&&ok[1]&&(!bestL||cells.length<bestL.cells.length))bestL={cells:cells,ends:ends};});
  if(!bestL)return null;var e0=cellXY(bestL.ends[0]);return {k:best,c:cls,cells:bestL.cells,ends:bestL.ends,bx:e0[0],by:e0[1],x:(bx+0.5)*cs,y:(by+0.5)*cs};}
function bridgeNear(x,y,R){var MP=G.map,best=null,bd=R/MP.cs;MP.brg.forEach(function(q,i){var d=dist(q.x+0.5,q.y+0.5,x/MP.cs,y/MP.cs);if(d<bd){bd=d;best=i;}});if(best===null)return null;var q=MP.brg[best],k=q.y*MP.GW+q.x,c=cellXY(k);
  var near=MP.brg.filter(function(z){return Math.abs(z.x-q.x)<=4&&Math.abs(z.y-q.y)<=4;});var p=validPos({dom:'land'},c[0]+MP.cs*3,c[1]);return {k:k,c:q.c,list:near,bx:p[0],by:p[1],x:c[0],y:c[1]};}
function buildBridge(site,u){var MP=G.map,bt=site.bt||'pontoon',t=bt==='assault'?'a':bt==='fixed'?'e':'f',rc=bt==='fixed'?3:2;site.cells.concat(site.ends).forEach(function(k){if(MP.rd[k]<rc)MP.rd[k]=rc;});site.cells.forEach(function(k){MP.brg.push({x:k%MP.GW,y:(k/MP.GW)|0,c:site.c,eng:1,t:t,side:u.side});});mapChanged(site.cells);
  logE(u.side,'eng',uName(u)+'完成架設'+(BRT[t]||'橋梁')+'（'+placeTxt(site.x,site.y)+'）',site.x,site.y,u.id);}
/* 爆破目標：最近的橋梁或隧道口 */
function demoNear(x,y,R){var b=bridgeNear(x,y,R),t=tunnelNear(x,y,R);if(b&&t)return dist(b.x,b.y,x,y)<=dist(t.x,t.y,x,y)?b:t;return b||t;}
function tunnelNear(x,y,R){var MP=G.map;if(!MP.tn)return null;var cs=MP.cs,GW=MP.GW,c0=cellAt(x,y),gx=c0%GW,gy=(c0/GW)|0,Rc=Math.ceil(R/cs),best=-1,bd=1e18;
  for(var b=-Rc;b<=Rc;b++)for(var a=-Rc;a<=Rc;a++){var X=gx+a,Y=gy+b;if(X<0||Y<0||X>=GW||Y>=MP.GH)continue;var k=Y*GW+X;if(!MP.tn[k]||!(MP.rd[k]||MP.rl[k]))continue;var d=a*a+b*b;if(d<bd){bd=d;best=k;}}if(best<0)return null;
  var list=[],seen={},st=[best];seen[best]=1;while(st.length&&list.length<4000){var k2=st.pop();list.push(k2);var x2=k2%GW,y2=(k2/GW)|0;for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){var n=(y2+dy)*GW+x2+dx;if(n<0||n>=GW*MP.GH||seen[n]||!MP.tn[n])continue;seen[n]=1;st.push(n);}}
  var c=cellXY(best),p=validPos({dom:'land'},c[0],c[1]);return {kind:'tunnel',k:best,list:list,bx:p[0],by:p[1],x:c[0],y:c[1]};}
function blowTunnel(site,u){var MP=G.map;site.list.forEach(function(k){MP.rd[k]=0;MP.rl[k]=0;MP.tn[k]=0;});mapChanged(site.list);logE(u.side,'eng',uName(u)+'炸毀了'+placeTxt(site.x,site.y)+'的隧道（'+kmTxt(site.list.length*MP.cs)+'）',site.x,site.y,u.id);}
function blowBridge(site,u){if(site.kind==='tunnel'){blowTunnel(site,u);return;}var MP=G.map,ks=site.list.map(function(q){return q.y*MP.GW+q.x;});ks.forEach(function(k){MP.rd[k]=0;MP.rl[k]=0;});MP.brg=MP.brg.filter(function(q){return site.list.indexOf(q)<0;});mapChanged(ks);
  logE(u.side,'eng',uName(u)+'炸毀了'+placeTxt(site.x,site.y)+'的橋梁',site.x,site.y,u.id);}
function digLine(u){var MP=G.map,W=frontW(u)*0.8,lx=-Math.sin(u.hd),ly=Math.cos(u.hd),ks=[];for(var t=-W/2;t<=W/2;t+=MP.cs*0.7){var k=cellAt(u.x+lx*t+Math.cos(u.hd)*60,u.y+ly*t+Math.sin(u.hd)*60);if(!isWater(MP.lc[k])&&!MP.ft[k]){MP.ft[k]=1;ks.push(k);}}if(ks.length){mapChanged(ks);logE(u.side,'eng',uName(u)+'完成塹壕構築',u.x,u.y,u.id);}}
function mapChanged(ks){G._mapv=(G._mapv||0)+1;var MP=G.map;if(ks&&ks.length&&MP&&ks.length<MP.GW*MP.GH/8)pfPatch(ks);else invalidatePF();(G.dirty=G.dirty||[]).push(ks);}
/* ---------- 增援：預定時間或條件觸發後，從進入點進場 ---------- */
function reinfDue(F){var A=F.arr;if(!A)return false;if(A.k==='time')return G.t>=A.t;if(A.k==='obj'){var ob=(G.obj||[]).filter(function(q){return q.id===A.obj;})[0];return ob&&ob.own>=0&&ob.own!==F.side;}
  if(A.k==='str'){var r=sideStr(F.side);return r.f<=A.v/100;}if(A.k==='contact')return G.firstContact&&G.t-G.firstContact>=(A.t||0);return false;}
function arriveUnit(F){var A=F.arr,MP=G.map,x=A.x!==undefined?A.x:edgePoint(F.side,0.5)[0],y=A.y!==undefined?A.y:edgePoint(F.side,0.5)[1],hd=A.hd!==undefined?A.hd:Math.atan2(MP.Hm/2-y,MP.Wm/2-x);
  (function w(z){z.st='ok';kidsOf(z).forEach(w);})(F);deployTree(F,x,y,hd,0);(function w2(z){if(isLeaf(z)&&ST(z).dom==='air'){z.st='base';z.base=[z.x,z.y];}kidsOf(z).forEach(w2);})(F);
  dupNames();(function w4(z){if(!z.lg)logInit(z);kidsOf(z).forEach(w4);})(F);F.arrived=G.t;F.isReinf=1;(function w3(z){z.isReinf=1;kidsOf(z).forEach(w3);})(F);var sm=strengthOf(F);
  logE(F.side,'reinf','增援 '+uName(F)+'（'+fmt(sm.men)+' 人'+(sm.veh?'、'+fmt(sm.veh)+' 件裝備':'')+'）'+(A.mode&&A.mode!=='edge'?'以'+LIFTN[A.mode]+'方式投入，目標':'抵達')+placeTxt(x,y),x,y,F.id);G.reinfLog.push({t:G.t,side:F.side,id:F.id,name:uName(F),men:sm.men,veh:sm.veh});
  arriveMode(F,A,x,y);
  if(A.ord&&A.ord.k){var o=newOrder(A.ord.k,{x:A.ord.x,y:A.ord.y,face:A.ord.face,opt:A.ord.opt||{},Y:A.ord.Y});if(isLeaf(F))activate(F,o);else receiveOrder(F,o);}
  if(G.onArrive)G.onArrive(F);if(G.onPause&&apOn('reinf'))G.onPause('增援抵達：'+uName(F));}
function edgePoint(side,f){var MP=G.map,e=SD(side).edge||'W',m=MP.cs*4;return e==='W'?[m,MP.Hm*f]:e==='E'?[MP.Wm-m,MP.Hm*f]:e==='N'?[MP.Wm*f,m]:[MP.Wm*f,MP.Hm-m];}

/* ---------- 戰術與姿態行為：佯攻、試探、襲擊、傷亡容忍、遲滯後撤、火力基地轉為突擊 ---------- */
function backTo(u,o,txt){var x0=o.x0!==undefined?o.x0:u.x+Math.cos(homeDir(u.side))*1500,y0=o.y0!==undefined?o.y0:u.y+Math.sin(homeDir(u.side))*1500;logE(u.side,'tac',uName(u)+txt,u.x,u.y,u.id);activate(u,newOrder('withdraw',{x:x0,y:y0,prev:o.prev||null}));return true;}
function tacStep(u,s,o,ed){var opt=o.opt||{},loss=(o.m0||1)-strFrac(u),cont=u._eid&&ed<rangeOf(s)*1.1;if(cont&&!o.firstC)o.firstC=G.t;
  if(o.k==='attack'){var tac=opt.tac||'frontal',tol=(opt.tol||35)/100;
    if(loss>tol){logE(u.side,'tac',uName(u)+'傷亡超過 '+pct(tol*100)+'，停止攻擊、就地防禦',u.x,u.y,u.id);activate(u,newOrder('defend',{x:u.x,y:u.y,face:u.hd,opt:{post:'hasty'}}));return true;}
    if(tac==='feint'){if(cont&&ed<Math.max(s.rE,300)*1.05){u.path=null;if(u.task==='go')u.task='hold';}
      if(opt.base&&o.firstC&&G.t-o.firstC>2400){o.opt=Object.assign({},opt,{tac:'frontal',base:0});logE(u.side,'tac',uName(u)+'由火力壓制轉為躍進突擊',u.x,u.y,u.id);u.task='go';wantPath(u,o.x,o.y);return true;}
      if(!opt.base&&o.firstC&&(G.t-o.firstC>3600||loss>0.1))return backTo(u,o,'佯攻任務完成，撤回出發位置');}
    if(tac==='probe'&&o.firstC&&(loss>0.1||(u._ep||0)>1.5*(u.men+u.veh*8)))return backTo(u,o,'試探攻擊遭遇強烈抵抗，撤回');
    if(tac==='raid'&&(u.raidOK||(o.firstC&&G.t-o.firstC>1800))){u.raidOK=0;return backTo(u,o,'襲擊得手，撤回出發位置');}}
  if((o.k==='defend'||o.k==='screen')&&opt.post==='delay'&&u.task==='hold'&&(o.bounds||0)<(opt.maxb||4)){var near=ed<Math.max(700,aRng(u)*5);if(near||loss>0.12){var h=homeDir(u.side),p=validPos(s,u.x+Math.cos(h)*2000,u.y+Math.sin(h)*2000);
      logE(u.side,'tac',uName(u)+'遲滯防禦：逐次後撤至'+placeTxt(p[0],p[1]),u.x,u.y,u.id);var no=newOrder(o.k,{x:p[0],y:p[1],face:u.hd,opt:opt});no.bounds=(o.bounds||0)+1;activate(u,no);return true;}}
  return false;}
