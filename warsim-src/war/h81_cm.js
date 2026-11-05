/* ===================== 對抗措施：飛機的熱焰彈與干擾絲、戰車在反戰車飛彈來襲時提前施放煙幕 =====================
   一、飛機與直升機：1968 年起掛熱焰彈（騙紅外線尋標：肩射防空飛彈、近程防空飛彈、近距空戰飛彈），1965 年起有干擾絲（騙雷達導引的防空與中長程空對空飛彈）。
       察覺來襲（約八成五）時投放，命中與殺傷減少：熱焰彈 1980 年前約三成、1980～1999 年約四成五（更好的熱焰彈與規避動作）、2000 年後約三成五（成像紅外線尋標器較不易受騙）；
       干擾絲約兩成。每架次的熱焰彈有限，用完就沒有；落地或返航後補滿。
   二、戰車與裝甲車：有煙幕彈發射器的車輛在敵方以反戰車飛彈射擊時，可能在飛彈命中前就施放煙幕：
       有雷射預警或軟殺主動防護的車約八成五察覺，否則靠車長看見發射煙塵（白天約三成、夜間約一成二）；1990 年後的車多了雷射預警，再加兩成。
       煙幕擋住線導、雷射駕束等需要一直瞄準的飛彈（這一擊的飛彈部分約剩四成），射後不理的成像紅外線飛彈較難擋（約剩七成五）。
       同一輛車 20 分鐘內不會重複施放；煙幕之後照常影響雙方的視線與射擊。 ===================== */
var CMY={flare:1968,chaff:1965,lwr:1990};
function cmYear(u){return Math.max(G.set.y||0,typeof utYear==='function'&&u?utYear(u)||0:0);}
/* 來襲的是紅外線導引還是雷達導引（只有飛彈才算；高射砲、機砲不受影響） */
function cmThreat(t,src,kind){if(!src||!t)return '';var y=G.set.y||0;
  if(kind==='aa'){var x=typeof samOf==='function'?samOf(src):null;if(!x)return '';var R=x.rng||(typeof aaRangeU==='function'?aaRangeU(src,aaOf(src,ST(src))):8000);return R<=8000?'ir':'rad';}
  if(kind==='air'){if(y<1958)return '';var d=dist(src.x,src.y,t.x,t.y);return d<15000?'ir':'rad';}
  return '';}
function cmAir(t,src,kind){if(!t||t.st!=='air')return 1;var th=cmThreat(t,src,kind);if(!th)return 1;var y=cmYear(t);
  if(th==='ir'&&y<CMY.flare||th==='rad'&&y<CMY.chaff)return 1;if(t.cmN===undefined)t.cmN=1;if(t.cmN<=0)return 1;if(rnd()>0.85)return 1;
  t.cmN=Math.max(0,t.cmN-(th==='ir'?0.1:0.06));var eff=th==='ir'?(y<1980?0.3:y<2000?0.45:0.35):0.2;
  if(typeof FX!=='undefined'&&FX.cap&&FX.ev.length<5000)FX.ev.push({k:'flare',a:t,x1:t.x,y1:t.y,c:th});
  if(!t.cmLog||G.t-t.cmLog>1800){t.cmLog=G.t;logE(t.side,'air',uName(t)+(th==='ir'?'投放熱焰彈，避開紅外線導引的飛彈':'投放干擾絲，干擾雷達導引的飛彈')+(t.cmN<=0?'（熱焰彈已用完）':''),t.x,t.y,t.id);}
  return 1-eff;}
/* 反戰車飛彈：攻擊方這一擊裡飛彈所占的比例，以及其中射後不理（成像紅外線）的比例 */
var CMATGM=/^(atgm|9m1|tow|kornet|javelin|spike|milan|sli|ram|hot|swat|bill)/;
function cmIsAtgm(w){return !!w&&(CMATGM.test(w.k)||!!(w.base&&/^atgm/.test(w.base))||!!(w.dz&&w.dz.b&&/^atgm/.test(w.dz.b))||!!(w.mud&&w.mud.t==='agm'));}
function cmFF(w){return (w.y||0)>=1996&&/^(atgm3|javelin|spike|tow2b)/.test(w.k||'')||!!(w.dz&&w.dz.b==='atgm3');}
function cmAtgmOf(src){var L=src&&src.lg;if(!L||!L.w)return null;var tot=0,m=0,ff=0;L.w.forEach(function(x){var w=wpnOf(x[0]),n=+x[1]||0;if(!w||!(n>0))return;var a=n*(w.pA||0)*(w.acc||1);tot+=a;if(cmIsAtgm(w)){m+=a;if(cmFF(w))ff+=a;}});return tot>0&&m>0?{f:m/tot,ff:ff/m}:null;}
function cmSmoke(t,src,kind){if(kind!=='fire'||!t||!src||!onMap(t)||typeof smokeAt!=='function')return 1;var ts=ST(t);if(ts.dom!=='land'||ts.hard<0.5)return 1;var F=typeof eqF2==='function'?eqF2(t):(t.lg&&t.lg.eqF);if(!F||!F.smk)return 1;
  if(t.smkT&&G.t-t.smkT<1200)return 1;var A=cmAtgmOf(src);if(!A)return 1;var y=cmYear(t),lwr=t.lg&&t.lg.eq&&t.lg.eq.some(function(x){return x[0]==='aps0'||x[0]==='aps1';}),p=lwr?0.85:(G.env&&G.env.light<0.3?0.12:0.3);if(y>=CMY.lwr&&!lwr)p+=0.2;
  if(rnd()>=p)return 1;t.smkT=G.t;smokeAt(t.x,t.y,90,180,t.side,t.id);if(!t.smkLog||G.t-t.smkLog>3600){t.smkLog=G.t;logE(t.side,'tac',uName(t)+(lwr?'的雷射預警響起，':'發現反戰車飛彈發射的煙塵，')+'搶在命中前施放煙幕',t.x,t.y,t.id);}
  return 1-A.f*((1-A.ff)*0.6+A.ff*0.25);}
(function(){var b=hit;hit=function(t,src,dm,dv,sup,kind){try{var f=cmAir(t,src,kind)*cmSmoke(t,src,kind);if(f<1){dm*=f;dv*=f;}}catch(e){}return b(t,src,dm,dv,sup,kind);};})();
/* 落地、返航後補滿熱焰彈 */
(function(){var b=v8Step;v8Step=function(){b();if(G.step%10===3)G.units.forEach(function(u){if(u.cmN!==undefined&&u.st!=='air'&&u.cmN<1)u.cmN=1;});};})();
