/* ===================== 巡弋飛彈的航路與飛行高度：繞開防空雷達，低空與貼地飛行躲在雷達地平線下與地形後方 =====================
   命令可帶航路點（最多 8 個）與高度：高空（射程最遠、最容易被發現）、中空、低空（地形追隨）、貼地掠海（射程最短、最難被發現）。
   雷達能看到飛彈的距離取「雷達距離 × 飛彈的雷達截面積係數」與「雷達地平線 4.12 ×（√天線高 + √飛彈高度）公里」中較小者；
   低空與貼地飛行時，雷達與飛彈之間的山丘會擋住視線。空中預警機的天線在高空，貼地飛行也躲不過。
   沿航路每 3 公里檢查一次：第一次被看到的時間點起對方才知道（才會警報、才開始準備攔截）；被發現得越晚，攔截越少；全程沒被發現時只剩近迫防禦碰運氣。
   沒有規劃航路與高度的發射（例如電腦的發射）維持原本的計算。 */
var MSLALT={hi:['高空',10000,1.15,1],mid:['中空',3000,1,1],lo:['低空',100,0.85,0.97],sea:['貼地掠海',20,0.8,0.95]};
function mslAltDef(q){return q&&q.kind==='asm'?'sea':q&&q.kind==='ballistic'?'hi':'lo';}
function mslPath(x0,y0,wp,x,y){return [[x0,y0]].concat(wp||[]).concat([[x,y]]);}
function mslPathLen(P){var L=0;for(var i=1;i<P.length;i++)L+=dist(P[i-1][0],P[i-1][1],P[i][0],P[i][1]);return L;}
function radHor(ha,ht){return 4120*(Math.sqrt(Math.max(1,ha))+Math.sqrt(Math.max(1,ht)));}
/* 對方的雷達：[單位, 距離（公尺）, 天線高（公尺）] */
function mslRadars(side){var o=[];G.units.forEach(function(g){if(g.side!==side||!alive(g))return;var s=ST(g),x=uxOf(g),air=s.dom==='air';if(air?g.st!=='air':!onMap(g))return;if(!radarOK(g))return;
    var R=sensorR(g)||(x.sam?x.rad||0:0)||(s.dom==='sea'&&s.aa>=6&&(G.set.y||0)>=1940?s.spot:0)||(air&&s.aa>=8&&(G.set.y||0)>=1960?s.spot:0);if(R>0)o.push([g,R,air?(s.fl.indexOf('a')>=0?9000:6000):s.dom==='sea'?25:15]);});return o;}
/* 雷達到飛彈之間有沒有山擋住（低空時才檢查） */
function mslMasked(g,ha,x,y,ht){var MP=G.map,e0=MP.el[cellAt(g.x,g.y)]+ha,e1=MP.el[cellAt(x,y)]+ht,n=clamp(Math.ceil(dist(g.x,g.y,x,y)/Math.max(MP.cs,400)),2,120);for(var i=1;i<n;i++){var f=i/n,px=lerp(g.x,x,f),py=lerp(g.y,y,f);if(MP.el[cellAt(px,py)]>lerp(e0,e1,f)+5)return true;}return false;}
/* 沿航路找第一次被雷達看到的位置：回傳距起點的飛行距離與雷達單位；沒被看到回傳 null */
function mslDetect(side,P,alt,rcs,radars){var A=MSLALT[alt]||MSLALT.mid,ht=A[1],R=radars||(nSides()<3?mslRadars(1-side):[].concat.apply([],hostSides(side).map(function(h){return mslRadars(h);}))),rf=Math.pow(clamp(rcs||0.1,0.001,10),0.25),s0=0;if(!R.length)return null;
  for(var i=1;i<P.length;i++){var a=P[i-1],b=P[i],d=dist(a[0],a[1],b[0],b[1]),n=Math.max(1,Math.ceil(d/3000));for(var j=0;j<=n;j++){var f=j/n,x=lerp(a[0],b[0],f),y=lerp(a[1],b[1],f);
      for(var k=0;k<R.length;k++){var g=R[k][0],lim=Math.min(R[k][1]*rf,radHor(R[k][2],ht));if(dist(g.x,g.y,x,y)<=lim&&!(ht<=200&&R[k][2]<1000&&mslMasked(g,R[k][2],x,y,ht)))return {s:s0+d*f,by:g.id,x:x,y:y};}}s0+=d;}return null;}
/* 依被發現時剩下的飛行時間決定攔截效果 */
function mslReact(S){if(!S||!S.plan)return 1;if(!S.det)return 0.15;return clamp(0.25+(S.eta-(S.detAt||S.t0))/240,0.25,1);}
function mslWpClean(wp){if(!Array.isArray(wp))return [];var MP=G.map;return wp.slice(0,8).filter(function(p){return Array.isArray(p)&&isFinite(+p[0])&&isFinite(+p[1]);}).map(function(p){return [clamp(Math.round(+p[0]),0,MP.Wm),clamp(Math.round(+p[1]),0,MP.Hm)];});}
/* 規劃過的發射：航路長度決定飛行時間，高度決定射程與被發現的時間 */
(function(){var b=mslLaunch;mslLaunch=function(u,o){if(!o||!(o.wp&&o.wp.length)&&!o.alt)return b(u,o);var q=mslSpec(u);if(!q||q.kind==='ballistic')return b(u,o);
  var n=Math.min(o.n||4,mslLeft(u)),alt=MSLALT[o.alt]?o.alt:mslAltDef(q),A=MSLALT[alt],wp=mslWpClean(o.wp);if(n<=0){logE(u.side,'arty',uName(u)+'沒有可用的飛彈',u.x,u.y,u.id);return false;}
  var tg=mslTarget(u.side,o.x,o.y,q),ax=tg?tg.x:o.x,ay=tg?tg.y:o.y,P=mslPath(u.x,u.y,wp,ax,ay),L=mslPathLen(P),R=q.r*A[2];
  if(L>R){logE(u.side,'arty',uName(u)+'：航路全長 '+kmTxt(L)+' 超出'+q.nm+'在'+A[0]+'飛行的射程（'+kmTxt(R)+'）',u.x,u.y,u.id);return false;}
  var v=q.v*A[3],S={id:(G.mslSeq=(G.mslSeq||0)+1),side:u.side,src:u.id,nm:q.nm,kind:q.kind,x0:u.x,y0:u.y,x:ax,y:ay,tid:tg?tg.id:0,n:n,v:v,w:q.w,pk:q.pk,ship:!!q.ship,sk:q.kind==='asm'?20000:(ST(u).fl.indexOf('p')>=0&&q.y0>=2000?400:250),t0:G.t,eta:G.t+Math.max(DT,L/v),wp:wp,alt:alt,plan:1};
  var D=mslDetect(u.side,P,alt,0.1);if(D){S.detAt=Math.round(G.t+D.s/v);S.detBy=D.by;S.detX=Math.round(D.x);S.detY=Math.round(D.y);}
  (G.msl=G.msl||[]).push(S);u.mslN-=n;u.fired=G.t;u.lastArt=G.t;var st=G.stats[u.side];st.msl=(st.msl||0)+n;
  logE(u.side,'arty','🚀 '+uName(u)+'發射 '+n+' 枚'+q.nm+'（'+A[0]+'飛行'+(wp.length?'、經 '+wp.length+' 個航路點':'')+'），目標'+placeTxt(ax,ay)+'，約 '+durTxt(S.eta-G.t)+' 後抵達',u.x,u.y,u.id);
  if(G.onPause&&apOn('strike'))G.onPause('飛彈發射');return true;};})();
/* 飛行中：到了被看到的時間點才警報 */
function mslDetStep(){(G.msl||[]).forEach(function(S){if(!S.plan||S.det||!S.detAt||G.t<S.detAt)return;S.det=1;var g=uById(S.detBy),en=nSides()<3?1-S.side:(g&&g.side>=0?g.side:enemyOf(S.side));logE(en,'arty','⚠ '+(g?uName(g):'雷達')+'發現低空來襲的'+(S.kind==='asm'?'反艦飛彈':'巡弋飛彈')+'（約 '+S.n+' 枚，'+placeTxt(S.detX,S.detY)+'），預計 '+durTxt(Math.max(0,S.eta-G.t))+' 後抵達',S.detX,S.detY);});}
(function(){var b=mslStep;mslStep=function(){mslDetStep();return b.apply(this,arguments);};})();
/* 估計（給命令面板）：以本方情報圖上已知的敵方雷達計算 */
function mslPlanEst(u,wp,x,y,alt){var q=mslSpec(u);if(!q)return null;alt=MSLALT[alt]?alt:mslAltDef(q);var A=MSLALT[alt],P=mslPath(u.x,u.y,mslWpClean(wp),x,y),L=mslPathLen(P),v=q.v*A[3],C=G.ct[u.side],R=[];
  var RA=nSides()<3?mslRadars(1-u.side):[].concat.apply([],hostSides(u.side).map(function(h){return mslRadars(h);})),byId={};RA.forEach(function(r){byId[r[0].id]=r;});for(var id in C){var c=C[id];if(c.dead||G.t-c.t>3600||!byId[id])continue;R.push([{x:c.x,y:c.y,id:+id},byId[id][1],byId[id][2]]);}
  var D=mslDetect(u.side,P,alt,0.1,R);return {alt:alt,L:L,R:q.r*A[2],t:L/v,det:D?{t:D.s/v,left:(L-D.s)/v}:null,radars:R.length};}
