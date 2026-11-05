/* ===================== 飛彈的飛行軌跡（只供畫面，不影響戰果） =====================
   空戰、地對空、空對地精確打擊交火時產生看得見的飛彈：發射的一方一定看得到；被攻擊的一方在 1965 年後（雷達與飛彈預警）或 5 公里內看得到。
   區域外飛彈齊射（G.msl）被偵測後，落地前一分多鐘由防空單位射出攔截飛彈（彈道飛彈是反彈道飛彈）；戰略核武的彈道飛彈在重返大氣層時也有反彈道飛彈。
   G.mv：{id,k 種類,side,sid 發射者,tid 目標單位,x0,y0 起點,tx,ty 目標點,t0,t1 抵達時間,n 枚數,v:[藍方看得到,紅方看得到]} */
var MVK={aam:['空對空飛彈',1000],sam:['防空飛彈',1000],agm:['空對地飛彈',300],int:['攔截飛彈',1200],abm:['反彈道飛彈',2500]};
function mvAdd(k,side,sid,x0,y0,tx,ty,tid,tf,n,seeE){var L=G.mv||(G.mv=[]);if(L.length>200)L.splice(0,L.length-150);var q={id:(G.mvSeq=(G.mvSeq||0)+1),k:k,side:side,sid:sid||0,tid:tid||0,x0:Math.round(x0),y0:Math.round(y0),tx:Math.round(tx),ty:Math.round(ty),t0:G.t,t1:G.t+Math.round(tf),n:n||1,v:[side===0||!!seeE,side===1||!!seeE]};L.push(q);return q;}
function mvSeeY(d){return (G.set.y||0)>=1965||d<5000;}
/* 交火：同一個發射者 45 秒內只畫一次 */
function mvShot(t,src,kind){if(src._mvT&&G.t-src._mvT<45)return;var s=ST(src),k=null;
  if(kind==='air'){if(!(s.aa>=6)||src.st!=='air')return;k='aam';}
  else if(kind==='aa'){if(!samOf(src)&&!(typeof wMud==='function'&&wMud(src,['sam','aam']))&&!(s.dom==='sea'&&s.aa>=9))return;k='sam';}
  else{if(s.fl.indexOf('p')<0&&!(typeof wMud==='function'&&wMud(src,['agm','arm'])))return;k='agm';}
  src._mvT=G.t;var d=dist(src.x,src.y,t.x,t.y),v=MVK[k][1];mvAdd(k,src.side,src.id,src.x,src.y,t.x,t.y,t.id,clamp(d/v,4,120),clamp(Math.round((src.veh||1)/(k==='agm'?4:3)),1,4),mvSeeY(d));}
(function(){var b=hit;hit=function(t,src,dm,dv,sup,kind){b.apply(this,arguments);if(src&&t&&(kind==='air'||kind==='aa'||kind==='airstrike')&&(G.set.y||0)>=1955&&hostile(src.side,t.side)){try{mvShot(t,src,kind);}catch(e){}}};})();
/* 攔截飛彈：被偵測的齊射在落地前 75 秒內，由範圍內的防空單位（最多 4 個）射向預計的攔截點 */
function mvIntStep(){(G.msl||[]).forEach(function(S){if(S.iv||!S.det||S.eta-G.t>75)return;S.iv=1;var en=enemyOf(S.side),bal=S.kind==='ballistic',need=bal?12:S.kind==='asm'?5:6,R=bal?60000:40000,ts=Math.max(G.t+4,S.eta-4),f=clamp((ts-S.t0)/Math.max(1,S.eta-S.t0),0,1),px=lerp(S.x0,S.x,f),py=lerp(S.y0,S.y,f),n=0;
    G.units.forEach(function(g){if(n>=4||(nSides()<3?g.side!==en:!hostile(S.side,g.side))||!onMap(g)||!alive(g)||g.ammo<=0)return;var AA=aaOf(g,ST(g)),nav=uxOf(g).adN;if(AA<need&&!nav)return;if(dist(g.x,g.y,S.x,S.y)>R)return;n++;mvAdd(bal?'abm':'int',g.side,g.id,g.x,g.y,px,py,0,Math.max(3,ts-G.t),clamp(Math.ceil(S.n/2),1,4),true);});});
  (G.snq||[]).forEach(function(Q){if(Q.iv||!Q.det||(Q.del!=='icbm'&&Q.del!=='slbm')||Q.eta-G.t>60||(G.set.y||0)<1972)return;Q.iv=1;var en=enemyOf(Q.side),n=0;G.units.forEach(function(g){if(n>=2||(nSides()<3?g.side!==en:!hostile(Q.side,g.side))||!onMap(g)||aaOf(g,ST(g))<12||dist(g.x,g.y,Q.x,Q.y)>=60000)return;n++;mvAdd('abm',g.side,g.id,g.x,g.y,Q.x,Q.y,0,Math.max(3,Q.eta-G.t-3),2,true);});});}
(function(){var b=simStep;simStep=function(){var r=b.apply(this,arguments);try{mvIntStep();if(G.mv&&G.step%4===1)G.mv=G.mv.filter(function(q){return G.t<=q.t1+5;});}catch(e){}return r;};})();
/* 聯機：每一方只收到自己看得到的 */
if(typeof mpValList==='function'){(function(){var b=mpValList;mpValList=function(s){var V=b.apply(this,arguments);V.push(['mv',(G.mv||[]).filter(function(q){return s<0||q.v[s];})]);return V;};})();}
