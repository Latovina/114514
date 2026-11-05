/* ===================== 戰役（作戰中的劇本）：觸發條件與動作——對白、訊息、增援、部隊撤出、核彈、新增目標、結束作戰；作戰結束後記錄結果與存活兵力 =====================
   G.cmp：戰役名稱、這場作戰（區域在大地圖上的原點 x0、y0，公尺）、事件（觸發條件＋動作）、對白佇列、戰役進度（歷次結果與延續的兵力）。
   事件的地點用大地圖座標（公尺），執行時換算成這張區域地圖的座標。觸發條件：作戰開始、經過時間、目標被某方佔領、某方部隊進入範圍、
   部隊（依名稱）被殲滅或兵力低於比例、一方總兵力低於比例、另一個事件發生之後；都可以再延遲幾分鐘。 ===================== */
var CMPTR={start:'作戰開始',time:'經過時間',obj:'目標被佔領',area:'部隊進入範圍',lost:'部隊被殲滅或兵力低於',str:'一方總兵力低於',ev:'另一個事件之後'};
var CMPACT={dlg:'對白',msg:'訊息',reinf:'增援進場',exit:'部隊撤出',nuke:'核彈',obj:'新增目標',end:'結束作戰'};
if(typeof KINDN!=='undefined')KINDN.cmp='劇本事件';
function cmpOn(){return !!(G&&G.cmp&&G.cmp.ev);}
function cmpXY(x,y){var C=G.cmp;return [(+x||0)-(C.x0||0),(+y||0)-(C.y0||0)];}
function cmpR(){var C=G.cmp,s=C.rs|0||1;s^=s<<13;s^=s>>>17;s^=s<<5;C.rs=s|0;return ((s>>>0)%1000003)/1000003;}
function cmpChar(id){var C=G.cmp;return (C.chars||[]).filter(function(c){return c.id===id;})[0]||null;}
/* 依名稱找部隊：完全相同優先，否則包含該名稱的最上層編制 */
function cmpUnits(side,name){var L=G.units.filter(function(u){return u.side===side&&u.name===name;});if(!L.length)L=G.units.filter(function(u){return u.side===side&&u.name&&name&&u.name.indexOf(name)>=0&&(u.p<0||!(uById(u.p)||{}).name||uById(u.p).name.indexOf(name)<0);});return L;}
/* 增援：戰役的核心兵力（帶著上一場的狀態，已在戰場上的不再重複）或這場作戰另外的兵力 */
function cmpReinf(side,a,e){var C=G.cmp,P=C.prog||{};if(a.f){var fc=((C.forces||[])[side]||[]).filter(function(q){return q.id===a.f;})[0];if(!fc)return [];if(G.units.some(function(u){return u.side===side&&u.cf&&u.cf.split('.')[0]===String(a.f);}))return [];
    var T=cmpBuild(side,[fc],C.seed);return cmpApplyState(T,(P.st||[])[side]);}
  return cmpBuild(side,[{id:'r'+e.id,k:a.pk,n:clamp(+a.n||1,1,20),name:a.name||'',gran:a.gran||'co'}],(C.seed||'')+'|op|'+C.op);}
function cmpFName(side,f){var fc=(((G.cmp||{}).forces||[])[side]||[]).filter(function(q){return q.id===f;})[0];return fc?cmpFLabel(fc):'';}
function cmpFLabel(fc){var n=clamp(+fc.n||1,1,40),b=(FPI[fc.k]||UT[fc.k]||{}).n||fc.k;if(!fc.name)return b+(n>1?' × '+n:'');return fc.name.indexOf('{i}')>=0&&n>1?fc.name.replace('{i}','1～'+n):fmtName(fc.name,1);}
function cmpLeaves(L){var o=[];L.forEach(function(F){(isLeaf(F)?[F]:leavesOf(F)).forEach(function(u){if(o.indexOf(u)<0)o.push(u);});});return o;}
/* ---------- 觸發條件 ---------- */
function cmpCond(e){var T=e.tr||{},C=G.cmp,k=T.k||'start';
  if(k==='start')return true;
  if(k==='time')return G.t>=(+T.t||0)*60;
  if(k==='obj'){var ob=(G.obj||[]).filter(function(q){return q.name===T.obj||q.id===+T.obj;})[0];return !!ob&&ob.own===(+T.side||0);}
  if(k==='area'){var p=cmpXY(T.x,T.y),r=+T.r||1000,s=+T.side||0;return G.units.some(function(u){return u.side===s&&isLeaf(u)&&onMap(u)&&ST(u).dom!=='air'&&dist(u.x,u.y,p[0],p[1])<=r;});}
  if(k==='lost'){var U=cmpLeaves(cmpSel(+T.side||0,T.f,T.name||''));if(!U.length)return false;var m=0,m0=0;U.forEach(function(u){if(u.st!=='dead'){m+=u.men+u.veh*8;}m0+=u.men0+u.veh0*8;});return m0>0&&m/m0<=(+T.pct||0)/100+1e-9;}
  if(k==='str'){var st=sideStr(+T.side||0);return st.m0>0&&st.f<=(+T.pct||50)/100;}
  if(k==='ev'){var o=C.ev.filter(function(q){return q.id===T.ev;})[0];return !!o&&!!o.done;}
  return false;}
/* 每四步檢查一次：條件成立後再等延遲（分鐘）才執行；每個事件只發生一次 */
function cmpStep(){if(!cmpOn()||!G.started||G.over)return;var C=G.cmp;
  C.ev.forEach(function(e){if(e.done)return;if(e.ok===undefined){if(!cmpCond(e))return;e.ok=G.t;}var dl=(+((e.tr||{}).dl)||0)*60;if(G.t-e.ok<dl)return;e.done=G.t;(e.act||[]).forEach(function(a){try{cmpDo(e,a);}catch(x){}});});
  /* 撤出中的部隊：抵達本方地圖邊緣就離開戰場 */G.units.forEach(function(u){if(!u.cmpExit||u.st==='off'||u.st==='dead')return;var MP=G.map,e=SD(u.side).edge||'W',d=e==='W'?u.x:e==='E'?MP.Wm-u.x:e==='N'?u.y:MP.Hm-u.y;if(d<MP.cs*8)cmpOut(u,'撤出戰場');});}
function cmpOut(u,why){u.st='off';u.cmpOut=1;u.cmpExit=0;u.path=null;u.ord=null;u.pend=[];u.task='hold';/* 不再當作待抵達的增援 */delete u.arr;logE(u.side,'cmp',uName(u)+why,u.x,u.y,u.id);}
/* ---------- 動作 ---------- */
function cmpDo(e,a){var C=G.cmp,k=a.k;
  if(k==='dlg'){var ch=cmpChar(a.who),s=a.side===undefined||a.side===''?-1:+a.side,D={t:G.t,who:a.who||'',n:ch?ch.name:(a.n||''),ti:ch?ch.title||'':'',cs:ch&&ch.side!==undefined?+ch.side:-1,side:s,txt:String(a.txt||''),ps:ch?String(ch.ps||ch.id):'',f:ch&&ch.f?1:0};C.dq.push(D);
    logE(s,'cmp',(D.n?D.n+(D.ti?'（'+D.ti+'）':'')+'：':'')+D.txt);if(G.onPause&&G.set.cmpPause!==false)G.onPause('劇情對白');return;}
  if(k==='msg'){logE(a.side===undefined||a.side===''?-1:+a.side,'cmp',String(a.txt||''));return;}
  if(k==='reinf'){var side=+a.side||0,p=a.x!==undefined&&a.x!==''?validPos({dom:'land'},cmpXY(a.x,a.y)[0],cmpXY(a.x,a.y)[1]):null,F=cmpReinf(side,a,e);
    F.forEach(function(top,j){(function w(z){z.st='off';kidsOf(z).forEach(w);})(top);var q=p?[p[0]+(j-(F.length-1)/2)*800,p[1]]:edgePoint(side,clamp(0.5+(j-(F.length-1)/2)*0.15,0.1,0.9));top.arr={k:'time',t:G.t,x:q[0],y:q[1]};top.cmpR=e.id;});if(F.length)logE(side,'cmp','增援進場：'+F.map(function(t){return uName(t);}).join('、'));
    dupNames();return;}
  if(k==='exit'){var s2=+a.side||0,L=a.f||a.name?cmpLeaves(cmpSel(s2,a.f,a.name)):[];if(a.x!==undefined&&a.x!==''){var q2=cmpXY(a.x,a.y),rr=+a.r||2000;L=L.concat(G.units.filter(function(u){return u.side===s2&&isLeaf(u)&&onMap(u)&&dist(u.x,u.y,q2[0],q2[1])<=rr&&L.indexOf(u)<0;}));}
    L=L.filter(function(u){return onMap(u);});if(!L.length)return;
    if(a.how==='now'){L.forEach(function(u){cmpOut(u,'奉命撤出戰場');});return;}
    L.forEach(function(u){var ep=edgePoint(u.side,clamp(u.y/G.map.Hm,0.05,0.95)),ed=SD(u.side).edge||'W';if(ed==='N'||ed==='S')ep=edgePoint(u.side,clamp(u.x/G.map.Wm,0.05,0.95));u.cmpExit=1;activate(u,newOrder('move',{x:ep[0],y:ep[1],opt:{road:true},cmp:1}));});
    logE(s2,'cmp',(a.name||cmpFName(s2,a.f)||'部隊')+'奉命撤出戰場（'+L.length+' 個單位）');return;}
  if(k==='nuke'){var q3=cmpXY(a.x,a.y),Y=clamp(+a.Y||10,0.01,50000),s3=+a.side||0;if(typeof nukeAt!=='function')return;nukeAt(s3,q3[0],q3[1],Y,null);logE(-1,'cmp',G.sides[s3].name+'在'+placeTxt(q3[0],q3[1])+'引爆 '+(Y>=1000?fx(Y/1000,1)+' 百萬噸':fx(Y,Y<1?2:0)+' 千噸')+'核彈',q3[0],q3[1]);return;}
  if(k==='obj'){var q4=cmpXY(a.x,a.y),id=(G.obj||[]).reduce(function(m,o){return Math.max(m,o.id);},0)+1;G.obj=G.obj||[];G.obj.push({id:id,name:a.name||('目標 '+id),x:q4[0],y:q4[1],pts:+a.pts||10,own:-1,r:+a.r||800});logE(-1,'cmp','新的作戰目標：'+(a.name||('目標 '+id)),q4[0],q4[1]);return;}
  if(k==='end'){C.endReq={win:a.win===undefined||a.win===''?-1:+a.win,why:a.why||'劇情結束'};return;}}
/* 劇本要求結束作戰：經由遊戲模式的勝負判定點（h5_core checkEnd 呼叫 gmEnd） */
(function(){var b=typeof gmEnd==='function'?gmEnd:null;gmEnd=function(){var X=b?b.apply(this,arguments):null;if(X)return X;if(cmpOn()&&G.cmp.endReq)return {why:G.cmp.endReq.why,win:G.cmp.endReq.win};return null;};})();
/* ---------- 兵力：戰役的核心部隊每場作戰都以同樣的種子建立，每個單位帶著標記（兵力編號.序號.單位序號），作戰結束時記下各單位的狀態，下一場作戰套用 ---------- */
/* 一筆兵力：{id, k（編制範本或單位種類）, n（數量）, name（名稱，{i} 換成序號）, gran（最小單位）}；seed 決定番號、指揮官與裝備 */
function cmpBuild(side,list,seed){var tops=[];(list||[]).forEach(function(p,j){var n=clamp(+p.n||1,1,40),fid=p.id||('x'+j);for(var i=1;i<=n;i++){var r=mb32(hstr((seed||'')+'|F|'+side+'|'+fid+'|'+i)),nm=p.name?fmtName(p.name,i):null,top=FPI[p.k]?buildPreset(side,p.k,nm,-1,r,p.gran||'co'):UT[p.k]?addLeaf(side,p.k,1,nm,-1,r):null;if(!top)continue;
      top.ix=i;if(p.name&&p.name.indexOf('{i}')>=0)top.tpl=p.name;var q=0;(function w(z){z.cf=fid+'.'+i+'.'+(q++);kidsOf(z).forEach(w);})(top);tops.push(top);}});reix();return tops;}
/* 依兵力編號找部隊（最上層），或依名稱找 */
function cmpSel(side,f,name){if(f)return G.units.filter(function(u){return u.side===side&&u.cf&&/\.0$/.test(u.cf)&&u.cf.split('.')[0]===String(f);});return name?cmpUnits(side,name):[];}
/* 作戰結束時各單位的狀態：〔兵員比例, 裝備比例, 彈藥, 經驗, 名稱〕；被殲滅的記 0；撤出戰場的部隊算存活 */
function cmpState(side){var o={};G.units.forEach(function(u){if(u.side!==side||!u.cf)return;if(!isLeaf(u)){o[u.cf]=leavesOf(u).length||u.cmpOut?[1,1,100,u.exp||0,u.name]:0;return;}
    o[u.cf]=u.st==='dead'||u.men+u.veh<1?0:[u.men0>0?+(u.men/u.men0).toFixed(3):0,u.veh0>0?+(u.veh/u.veh0).toFixed(3):1,Math.round(u.ammo),+(u.exp||0).toFixed(2),u.name];});return o;}
/* 套用上一場延續的狀態：被殲滅的單位不再出現，沒有參戰過的單位維持滿編 */
function cmpApplyState(tops,st){if(!st)return tops;var gone=[];tops.forEach(function(F){(function w(z){var q=st[z.cf];if(q===0){gone.push(z);return;}if(q){if(q[4])z.name=q[4];if(isLeaf(z)){z.men=Math.max(1,Math.round(z.men0*q[0]));z.veh=Math.round(z.veh0*clamp(q[1],0,1));z.ammo=clamp(+q[2],0,100);}if(q[3])z.exp=Math.max(z.exp||0,+q[3]);}kidsOf(z).forEach(w);})(F);});
  gone.forEach(cmpRemove);reix();
  /* 底下的單位都沒了的編制也一併移除 */var L=tops.filter(function(F){return gone.indexOf(F)<0&&G.units.indexOf(F)>=0;}),emp=L.filter(function(F){return !isLeaf(F)&&!leavesOf(F).length;});emp.forEach(cmpRemove);reix();return L.filter(function(F){return emp.indexOf(F)<0;});}
/* 從編制中移除整個單位（上一場已被殲滅） */
function cmpRemove(u){var ids={};(function w(z){ids[z.id]=1;kidsOf(z).forEach(w);})(u);if(u.p>=0){var P=uById(u.p);if(P&&P.kids)P.kids=P.kids.filter(function(id){return id!==u.id;});}G.units=G.units.filter(function(q){return !ids[q.id];});}
/* ---------- 作戰結束：記錄結果、傷亡與各單位的狀態（下一場作戰延續） ---------- */
function cmpFinish(){if(!cmpOn()||!G.over||G.cmp.res)return;var C=G.cmp;C.res={win:G.over.win,why:G.over.why,t:G.t,st:[cmpState(0),cmpState(1)],cas:[Math.round(G.stats[0].cas||0),Math.round(G.stats[1].cas||0)],own:cmpOwnEnd()};
  logE(-1,'cmp','戰役「'+(C.cname||'')+'」：作戰「'+(C.oname||'')+'」結束，'+(G.over.win>=0?G.sides[G.over.win].name+'獲勝':'不分勝負'));}
/* 作戰結束時聚落由誰控制：範圍內只有一方的部隊，或是作戰目標的歸屬（大地圖的聚落編號 → 0／1） */
function cmpOwnEnd(){var MP=G.map,cs=MP.cs,o={};(MP.set||[]).forEach(function(s){if(s.bi===undefined)return;var x=s.x*cs,y=s.y*cs,R=Math.max(s.r||300,400)+1000,n=[0,0];
    G.units.forEach(function(u){if(u.side>1||!isLeaf(u)||!onMap(u)||u.st==='dead'||ST(u).dom==='air')return;if(dist(u.x,u.y,x,y)<=R)n[u.side]+=u.men+u.veh*8;});
    var ob=(G.obj||[]).filter(function(q){return dist(q.x,q.y,x,y)<=Math.max(s.r||300,q.r||500);})[0];
    if(n[0]>0&&n[1]===0)o[s.bi]=0;else if(n[1]>0&&n[0]===0)o[s.bi]=1;else if(ob&&ob.own>=0)o[s.bi]=ob.own;});return o;}
(function(){var b=v8Step;v8Step=function(){b.apply(this,arguments);if(!cmpOn())return;if(G.started&&!G.over&&G.step%4===2)try{cmpStep();}catch(e){}if(G.over&&!G.cmp.res)try{cmpFinish();}catch(e){}};})();
/* 勝負一分出來就記下結果（之後模擬不再前進） */
(function(){var b=checkEnd;checkEnd=function(){var r=b.apply(this,arguments);if(G&&G.over&&cmpOn()&&!G.cmp.res)try{cmpFinish();}catch(e){}return r;};})();
/* ---------- 聯機：劇情對白與結果送給所有玩家（對白只送給指定的一方） ---------- */
if(typeof mpValList==='function'){(function(){var b=mpValList;mpValList=function(s){var V=b.apply(this,arguments);if(cmpOn())V.push(['cmp',{cname:G.cmp.cname,oname:G.cmp.oname,dq:G.cmp.dq.filter(function(D){return s<0||D.side<0||D.side===s;}),res:G.cmp.res?{win:G.cmp.res.win,why:G.cmp.res.why}:null}]);return V;};})();}
