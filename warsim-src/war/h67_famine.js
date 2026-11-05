/* ===================== 飢荒：長期缺糧的聚落與部隊 =====================
   聚落：居民的飢餓度（g.hung）到 60 以上就進入飢荒；飢荒拖得越久，餓死的人越多（兩週後約為原本的三倍），
   五天後疫病（斑疹傷寒、痢疾）跟著來，飢民開始逃荒。飢餓的部隊（飢餓度 60 以上）駐在聚落裡會強徵居民的糧食，
   保護平民的方針強徵得少、高壓與報復的方針強徵得多，飢荒因此更快、更重。
   受飢荒影響的居民占全部居民的四分之一以上時記為一場大饑荒，降到一成以下時緩解。
   極端的飢荒（飢餓度 90 以上，持續十天；被圍困時六天）可能出現人相食的慘況：只記錄，不描寫；當地更加動盪，附近的官兵驚恐。
   部隊：飢餓度 60 以上開始宰殺馱馬與戰馬充飢（之後機動變慢）；90 以上超過三天開始有人餓死；
   被圍或斷補給超過三天、飢餓度 98 以上超過一週，也可能出現人相食。
   設定在 G.set.famine（預設開啟）與 G.set.canni（記錄人相食，預設開啟）；用自己的亂數（G.fms），不影響其他模擬的亂數。 */
var FMD=86400;
if(typeof CIVK!=='undefined')CIVK.famdis='飢荒後的疫病';
if(typeof KINDN!=='undefined')KINDN.hunger='飢餓';
if(typeof KIAF!=='undefined')KIAF.hunger=0.95;
if(typeof FRN!=='undefined')FRN.famine='飢荒慘況';
function famOn(){return !G||!G.set||G.set.famine!==false;}
function canOn(){return famOn()&&!!G&&G.set.canni!==false;}
function fmr(){var x=G.fms|0;if(!x)x=(hstr((G.set.seed||'')+'|famine')|0)||1;x^=x<<13;x^=x>>>17;x^=x<<5;G.fms=x;return (x>>>0)/4294967296;}
/* 飢荒的階段：0 沒有、1 剛開始（三天內）、2 持續、3 長期（十天以上） */
function famStage(g){if(!(g.hung>=60)&&!(g.famD>0))return 0;var d=(g.famD||0)/FMD;return !(g.hung>=60)?0:d<3?1:d<10?2:3;}
var FAMN=['','飢荒','飢荒持續','長期飢荒'];
/* ---------- 聚落 ---------- */
(function(){var b=civFood;civFood=function(g,dt,siege){if(famOn())famReq(g,dt);b.apply(this,arguments);if(!famOn())return;var p=civPresent(g);if(p<1){if(g.famD)g.famD=0;return;}var d=dt/FMD;
  if(g.hung>=60)g.famD=(g.famD||0)+dt;else if(g.famD)g.famD=Math.max(0,g.famD-dt*2);if(!(g.famD>0))return;
  var fd=g.famD/FMD,occ=g.occ>=0&&g.occ!==g.loy?g.occ:-1;
  /* 飢荒拖得越久，餓死的人越多（在原本的飢餓死亡之外） */if(g.hung>50){var k=p*0.002*(g.hung-50)/50*d*Math.min(2,fd/7);if(k>0)civCas(g,k/0.9,0.9,'hunger',occ);}
  /* 疫病跟著來 */if(fd>5&&g.hung>=60){var k2=p*0.0006*d*Math.min(2,(fd-5)/7+0.5);if(k2>0)civCas(g,k2/0.8,0.8,'famdis',-1);}
  /* 逃荒 */if(g.hung>=60)g.pend=(g.pend||0)+p*0.01*d;
  if(!g.famL||G.t-g.famL>3*FMD){if(g.hung>=60&&fd>=1){g.famL=G.t;logE(-1,'civ',g.n+'陷入'+FAMN[famStage(g)]+'：居民大批餓死，飢民開始逃荒',g.x,g.y);}}
  /* 人相食（大的城鎮通報較多；飢荒拖得越久越常見） */if(canOn()&&g.hung>=90&&fd>=(siege?6:10)&&(!g.canT||G.t-g.canT>2*FMD)&&fmr()<0.15*d*clamp(p/2000,0.25,3)*Math.min(2,fd/10))famCanni(g);};})();
function famCanni(g){g.canT=G.t;g.canN=(g.canN||0)+1;var C=G.civ;C.canni=(C.canni||0)+1;g.unrest=clamp((g.unrest||0)+15,0,100);var txt='據報'+g.n+'在長期飢荒中已出現人相食的慘況';
  if(typeof civEv==='function')civEv('famine',-1,txt,g.x,g.y,0,{v:1});else logE(-1,'civ',txt,g.x,g.y);if(typeof fearArea==='function')fearArea(g.x,g.y,g.r+1000,10,'famine');}
/* 飢餓的部隊在聚落裡強徵糧食：每天拿走約四天份的口糧（保護平民的方針只拿四分之一，大致保護一半，高壓以上一倍半） */
var FAMQ=[0.25,0.5,1,1.5,1.5,1.5];
function famReq(g,dt){if(!(g.food>0))return;var d=dt/FMD,p=Math.max(1,civPresent(g)),log=null;gridNear(g.x,g.y,g.r+300,function(u){if(!(g.food>0)||!onMap(u)||!isLeaf(u)||!u.lg||ST(u).dom!=='land'||(u.lg.hun||0)<60||u.side<0||dist(u.x,u.y,g.x,g.y)>g.r+300)return;
    var L=u.lg,pv=typeof polOf==='function'?polOf(u,'civ'):2,f=FAMQ[clamp(pv|0,0,5)],take=Math.min(g.food,Math.max(0.5,u.men)/p*4*d*f);if(!(take>0))return;g.food-=take;L.food=Math.min(L.foodCap>0?L.foodCap*1.2:1e9,(L.food||0)+take*p*1.5);g.unrest=clamp((g.unrest||0)+2*d*f,0,100);if(!log)log=u;});
  if(log&&(!g.reqL||G.t-g.reqL>FMD/2)){g.reqL=G.t;logE(log.side,'civ','飢餓的'+uName(log)+'在'+g.n+'強徵居民的糧食',g.x,g.y,log.id);}}
/* 大饑荒：每六小時統計一次 */
function famRegion(){var C=G.civ;if(!C||!C.S)return;var tot=0,fam=0;C.S.forEach(function(g){var p=civPresent(g);tot+=p;if(g.hung>=60&&(g.famD||0)>=2*FMD)fam+=p;});if(tot<1)return;var sh=fam/tot,F=C.fam;
  if((!F||F.end)&&sh>=0.25){C.fam={t:G.t,n:Math.round(fam),peak:Math.round(fam),sh:sh};C.famN=(C.famN||0)+1;logE(-1,'civ','大饑荒：約 '+fmt(fam)+' 名居民（'+pct(sh*100)+'）陷入飢荒');}
  else if(F&&!F.end){F.peak=Math.max(F.peak||0,Math.round(fam));if(sh<0.1){F.end=G.t;logE(-1,'civ','飢荒緩解：仍在飢荒中的居民降到 '+pct(sh*100));}}}
(function(){var b=civStep;civStep=function(){b.apply(this,arguments);if(G&&G.civ&&famOn()&&G.set.civ!==false&&G.step%720===300)famRegion();};})();
/* ---------- 部隊 ---------- */
(function(){var b=consume;consume=function(u,L,dt){b.apply(this,arguments);if(!famOn()||!L||!alive(u))return;var day=dt/FMD,h=L.hun||0;
  if(h>=90)L.hunD=(L.hunD||0)+dt;else if(L.hunD)L.hunD=Math.max(0,L.hunD-dt*2);
  /* 宰殺馱馬與戰馬充飢 */if(h>=60&&L.h>=1){L.hEat=(L.hEat||0)+L.h*0.04*day;if(L.hEat>=1){var n=Math.min(L.h,Math.floor(L.hEat));L.hEat-=n;L.h-=n;L.food=(L.food||0)+n*200;L.eaten=(L.eaten||0)+n;
      if(!L.eatL||G.t-L.eatL>FMD){L.eatL=G.t;logE(u.side,'short',uName(u)+'斷糧，宰殺馱馬與戰馬充飢',u.x,u.y,u.id);}}}
  /* 餓死：逐步累積，滿 0.2 人結算一次；拖得越久死得越多 */if((L.hunD||0)>3*FMD){L.stvA=(L.stvA||0)+u.men*0.003*Math.min(3,1+(L.hunD/FMD-3)/7)*day;if(L.stvA>=0.2){var m=Math.min(u.men,L.stvA);L.stvA=0;hit(u,null,m,0,0,'hunger');L.starv=(L.starv||0)+m;if(!L.stvL||G.t-L.stvL>FMD){L.stvL=G.t;logE(u.side,'short',uName(u)+'有官兵餓死',u.x,u.y,u.id);}}}
  /* 人相食（被圍或斷補給、飢餓到了極點） */if(canOn()&&h>=98&&(L.hunD||0)>=7*FMD&&((u.besieged&&G.t-u.besieged<1200)||(u.oos||0)>3*FMD)&&(!L.canT||G.t-L.canT>3*FMD)&&fmr()<0.05*day){L.canT=G.t;var S=G.stats[u.side];if(S)S.canni=(S.canni||0)+1;u.mor=clamp(u.mor-10,0,100);
    logE(u.side,'disc','據報被圍斷糧的'+uName(u)+'中已出現人相食的慘況',u.x,u.y,u.id);if(typeof fearAdd==='function')fearAdd(u,15,'famine');}};})();
