/* ===================== 海空武器與感測器：連結彈藥的飛彈打擊與防空射程、艦隊防空、艦艇雷達、聲納 =====================
   武器連結了彈藥（mud，見 o48_mun.js）時：區域外飛彈打擊改用彈藥的射程、速度、彈頭與命中率；防空飛彈的射程取彈藥射程，但不超過雷達能引導的距離（主動尋標可到 1.5 倍）。
   由載具設計生成的艦艇帶有防空能力（ux.adN：面對次音速、超音速掠海反艦飛彈與反艦彈道飛彈各能擋下幾枚），來襲飛彈落點附近的這類艦艇依飽和程度攔截；
   對空搜索雷達（ux.rad）加入雷達監視網；聲納（ux.son）偵測附近的潛艦（越安靜越難、航行中較易被聽到）。內建類型沒有這些數據，行為不變。 */
/* 單位武器中射程最遠的反艦或巡弋飛彈、防空飛彈 */
function wMud(u,types){var L=u&&u.lg;if(!L||!L.w)return null;var best=null;L.w.forEach(function(x){var w=wpnOf(x[0]),d=w&&w.mud;if(!d||!(x[1]>0)||types.indexOf(d.t)<0)return;if(!best||d.rng>best.d.rng)best={d:d,n:x[1]};});return best;}
(function(){var b=mslSpec;mslSpec=function(u){var q=b(u),m=wMud(u,['cm','ashm']);if(!m)return q;var d=m.d;
  return {n:q?q.n:Math.max(1,m.n/Math.max(1,u.veh0||1)),v:Math.round(Math.max(200,(d.mach||0.8)*340)),r:Math.round(d.rng*1000),y0:0,kind:d.t==='cm'?'cruise':'asm',w:d.wh||200,pk:d.pk||0.85,nm:String(d.n||'飛彈').replace(/「(.+?)」.*/,'$1'),ship:d.t==='ashm'?1:0,mu:d.id};};})();
(function(){var b=aaRangeU;aaRangeU=function(g,AA){var r=b(g,AA),m=wMud(g,['sam','aam']);if(!m)return r;var d=m.d,x=uxOf(g),cap=(x.rad||Math.max(r,8000))*(d.act?1.5:1);return Math.round(Math.min(d.rng*1000,cap));};})();
/* 艦隊防空：來襲飛彈落點 30 公里內（彈道飛彈 150 公里）的設計艦艇，依「能擋下幾枚」合計攔截能力；超過就飽和突破 */
function navAD(S,en,n){if(!(n>0))return 0;var thr=S.kind==='ballistic'?'bal':S.v>=600?'sup':'sub',R=thr==='bal'?150000:30000,cap=0,sh=[];
  G.units.forEach(function(g){if((nSides()<3?g.side!==en:!hostile(S.side,g.side))||!onMap(g)||!alive(g))return;var a=uxOf(g).adN;if(!a||!(a[thr]>0)||dist(g.x,g.y,S.x,S.y)>R)return;var c=a[thr]*strFrac(g)*clamp((g.ammo||0)/60,0,1)*(radarOK(g)?1:0.3)*(typeof mslReact==='function'?mslReact(S):1);if(c>0){cap+=c;sh.push([g,c,a]);}});
  if(cap<=0)return 0;var p=Math.min(0.97,cap/n),k=0;for(var i=0;i<n;i++)if(rnd()<p)k++;
  if(k>0){sh.forEach(function(q){q[0].ammo=Math.max(0,q[0].ammo-k*q[1]/cap*60/Math.max(4,q[2].sub||4));});logE(en,'aa','艦隊防空攔截來襲的 '+k+' 枚'+S.nm+(n-k>0?'（'+(n-k)+' 枚突破）':'（全數攔截）'),S.x,S.y);}return k;}
/* 艦艇的對空搜索雷達加入雷達監視網 */
(function(){var b=sensorR;sensorR=function(g){var r=b(g),x=uxOf(g);if(x.rad&&!x.sam&&ST(g).dom==='sea'&&onMap(g)&&radarOK(g))return Math.max(r,x.rad);return r;};})();
/* 聲納：每 4 分鐘；聲納距離依目標的安靜程度調整，航行中的潛艦較易被聽到；空中的反潛機與直升機要在空中 */
function sonarStep(){SIDES().forEach(function(side){var O=G.units.filter(function(u){if(u.side!==side||!alive(u)||!(uxOf(u).son>0))return false;return ST(u).dom==='air'?u.st==='air':onMap(u);});if(!O.length||!G.rq)return;var Q=G.rq[side];
  G.units.forEach(function(t){if(t.side===side||!onMap(t)||!alive(t))return;var ts=ST(t);if(ts.dom!=='sub')return;var mv=G.t-(t.movedAt||-1e9)<180?1.3:1;
    for(var i=0;i<O.length;i++){var o=O[i],R=uxOf(o).son*clamp(ts.sig/0.15,0.3,3)*mv;if(dist(o.x,o.y,t.x,t.y)<=R){Q.push({at:G.t+60,id:t.id,x:t.x+(rnd()-0.5)*600,y:t.y+(rnd()-0.5)*600,t:G.t,q:0.6,by:o.id});break;}}});});}
(function(){var b=simStep;simStep=function(){var r=b.apply(this,arguments);if(G.started&&G.step%8===6){try{sonarStep();}catch(e){}}return r;};})();
