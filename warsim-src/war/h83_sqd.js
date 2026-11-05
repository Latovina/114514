/* ===================== 排與組：在連的指揮下依戰術自由部署 =====================
   排之下分成組（步兵班、火力組、戰車分排），組是地圖上最小的元素；組和排都不能直接下令，也不能從連裡拆出來單獨作戰，
   但會在連的活動範圍內（連長能聯絡得到的距離：1900 年前口令與號音約 200 公尺、1900～1935 年傳令與哨音約 400 公尺、之後有無線電約 800 公尺）依戰術移動：
   - 依兵種部署：戰鬥的排（步兵、機步、戰車、騎兵、偵察）在前，支援的排（火力、反戰車、防空、砲、指揮、醫療、運輸、工兵）在後；
     偵察排最前；空曠地形進攻時戰車在前，城鎮與森林裡步兵在前。
   - 依命令、訓練、經驗與指揮官的個性選擇動作：
     進攻：訓練好、1915 年以後 → 交替掩護前進（一半前進、一半原地掩護，輪流）；訓練差、1918 年以前或指揮官魯莽 → 大規模衝鋒；其餘 → 橫隊推進。
     防禦：訓練好、1915 年以後 → 口袋防禦（兩翼在前、中央稍後，火力排在中央後方）；被包圍 → 環形防禦；其餘 → 橫隊。
     伏擊 → 沿側翼一線埋伏。撤退：訓練好、士氣還在 → 交替掩護後撤；士氣崩潰或潰散 → 無組織後撤（四散往後跑）。
     行軍 → 縱隊。
   這些位置也決定傷亡落在哪些排（面向敵人、衝在前面的排損失較多）。 ===================== */
var SQK={inf:3,mech:3,pike:3,gue:3,sof:3,cav:3,wpn:3,arm:2,rec:2,eng:2,at:2,ad:2,art:2,mp:2,sec:2,med:1,sup:2,hq:1,rear:1};
var SQSUP={wpn:1,at:1,ad:1,art:1,hq:1,med:1,sup:1,rear:1,eng:1,mp:1,sec:1};
var SQTN={line:'橫隊推進',bound:'交替掩護前進',charge:'大規模衝鋒',pocket:'口袋防禦',allround:'環形防禦',ambush:'沿側翼埋伏',wbound:'交替掩護後撤',rout:'無組織後撤',column:'縱隊',hold:'橫隊'};
function sqOn(){return !!G&&G.set.sqd!==false;}
function sqYear(u){return typeof utYear==='function'?utYear(u)||G.set.y||1943:G.set.y||1943;}
/* 連長能聯絡得到的距離（組的活動範圍） */
function sqComm(u){var y=sqYear(u);return y<1900?200:y<1935?400:800;}
function sqTrn(u){var s=ST(u);return (u.trn!==undefined?u.trn:s.trn||60)+Math.min(30,u.exp||0);}
function sqAgg(u){var T=typeof sideCmd==='function'?sideCmd(u.side):null,p=T&&T.pers;return p&&p.agg!==undefined?p.agg:0.5;}
/* 戰術：依命令、士氣、訓練、經驗、年代與指揮官的個性 */
function sqTac(u){var o=u.ord,k=o?(o.dk||o.k||''):'',op=o&&o.opt||{},tr=sqTrn(u),y=sqYear(u),agg=sqAgg(u),h=(hstr('sq|'+u.id)%100)/100;
  if(u.ms==='rout')return 'rout';
  if(/withdraw|retreat/.test(k)||u.task==='retreat')return u.ms==='shaken'&&(u.mor||50)<35?'rout':tr>=55?'wbound':'line';
  if(u.form==='march'&&(u._ed||1e9)>3000)return 'column';
  if(op.post==='ambush'||k==='ambush')return 'ambush';
  if(/attack|assault|storm|joint|raid|counter/.test(k)){if(y<1918&&tr<70||tr<35||agg>0.75&&h<agg-0.4)return 'charge';return tr>=60&&y>=1915?'bound':'line';}
  if(/defend|hold|fortify|dig|reserve/.test(k)||u.task==='hold'){if(u.enc||u.cut)return 'allround';return tr>=55&&y>=1915?'pocket':'line';}
  return u.form==='march'?'column':'line';}
/* 空曠地形（戰車在前）還是封閉地形（步兵在前） */
function sqOpen(u){var c=G.map.lc[cellAt(u.x,u.y)];return !(typeof isUrban==='function'&&isUrban(c))&&!(c===LCI.dfor||c===LCI.cfor||c===LCI.jung);}
/* 各排在連座標系裡的位置 [前後, 左右]（公尺；前方是行進或面對的方向） */
function sqSlots(u,P,tac){var W=Math.min(Math.max(120,frontW(u)*0.8),sqComm(u)*1.6),n=P.length,L=[],C=[],S=[],R=[],open=sqOpen(u),t=G.t||0;
  P.forEach(function(p,i){if(p.k==='rec')R.push(i);else if(SQSUP[p.k])S.push(i);else C.push(i);});
  /* 戰鬥的排的順序：空曠地形戰車在中間前面，封閉地形步兵在前 */
  C.sort(function(a,b){var ka=P[a].k==='arm'?(open?-1:1):0,kb=P[b].k==='arm'?(open?-1:1):0;return ka-kb||a-b;});
  var put=function(i,fw,lt){L[i]=[fw,lt];},spread=function(arr,fw,width,f){arr.forEach(function(i,j){var a=arr.length>1?j/(arr.length-1)-0.5:0;put(i,typeof f==='function'?f(j,a):fw,a*width);});};
  if(tac==='column'){var all=R.concat(C,S);all.forEach(function(i,j){put(i,(all.length-1)/2*W*0.3-j*W*0.3,0);});}
  else if(tac==='allround'){var all2=C.concat(R);all2.forEach(function(i,j){var an=2*PI*j/Math.max(1,all2.length);put(i,Math.cos(an)*W*0.32,Math.sin(an)*W*0.32);});spread(S,0,W*0.2);}
  else if(tac==='charge'){spread(C,W*0.42,W*0.55,function(j,a){return W*(0.42-Math.abs(a)*0.25);});spread(R,W*0.55,W*0.3);spread(S,W*0.08,W*0.4);}
  else if(tac==='bound'||tac==='wbound'){var ph=Math.floor(t/Math.max(60,240-sqTrn(u)))%2,dir=tac==='bound'?1:-1;spread(C,0,W*0.9,function(j){var mv=(j%2)===ph;return dir>0?(mv?W*0.38:W*0.1):(mv?-W*0.3:W*0.08);});spread(R,dir>0?W*0.5:W*0.15,W*0.5);spread(S,dir>0?-W*0.2:-W*0.35,W*0.5);}
  else if(tac==='pocket'){spread(C,0,W*1.0,function(j,a){return C.length>=3?(Math.abs(a)>0.3?W*0.25:-W*0.08):W*0.12;});spread(R,W*0.45,W*0.6);spread(S,-W*0.3,W*0.4);}
  else if(tac==='ambush'){spread(C,W*0.05,W*1.3);spread(R,W*0.3,W*0.6);spread(S,-W*0.2,W*0.5);}
  else if(tac==='rout'){P.forEach(function(p,i){var hh=hstr('rt|'+u.id+'|'+i+'|'+Math.floor(t/90));put(i,-W*(0.2+((hh%100)/100)*0.6),(((hh>>8)%100)/100-0.5)*W*1.3);});}
  else{spread(C,W*0.15,W*0.9);spread(R,W*0.45,W*0.6);spread(S,-W*0.25,W*0.5);}
  /* 活動範圍：連長能聯絡得到的距離內 */
  var Rc=sqComm(u);for(var i=0;i<n;i++){if(!L[i])L[i]=[0,0];var d=Math.hypot(L[i][0],L[i][1]);if(d>Rc){L[i][0]*=Rc/d;L[i][1]*=Rc/d;}}
  return L;}
/* 排的位置：取代原本只依陣型的位置（傷亡分配也用這個） */
(function(){var b=pltSlots;pltSlots=function(u,n){if(!sqOn())return b.apply(this,arguments);var P=pltLive(u);if(P.length!==n)return b.apply(this,arguments);return sqSlots(u,P,sqTac(u));};})();
/* 組：每個排分成幾個組，位置在排的周圍，隊形跟著戰術 */
function sqN(p){return SQK[p.k]||2;}
function sqPos(u){var L=pltPos(u);if(!L.length)return [];var tac=sqTac(u),W=Math.max(120,frontW(u)*0.8),h=u.hd||0,c=Math.cos(h),s=Math.sin(h),out=[],t=G.t||0,gap=W*(tac==='charge'?0.04:tac==='rout'?0.12:0.07);
  L.forEach(function(o,pi){var p=o[2],n=sqN(p);for(var j=0;j<n;j++){var a=n>1?j/(n-1)-0.5:0,fw=0,lt=a*gap*n;
      if(tac==='column'){fw=-j*gap;lt=0;}else if(tac==='bound'||tac==='wbound'){fw=((j+pi)%2?1:-1)*gap*0.5;}else if(tac==='pocket'&&n>=3){fw=Math.abs(a)>0.3?gap*0.6:-gap*0.3;}else if(tac==='charge'){fw=-Math.abs(a)*gap;}
      else if(tac==='rout'){var hh=hstr('rs|'+u.id+'|'+pi+'|'+j+'|'+Math.floor(t/60));fw=((hh%100)/100-0.7)*gap*3;lt=(((hh>>8)%100)/100-0.5)*gap*4;}
      out.push({x:o[0]+fw*c-lt*s,y:o[1]+fw*s+lt*c,p:p,pi:pi,j:j,n:n,f:clamp((p.m+p.v*8)/((p.m0+p.v0*8)||1),0,1)});}});
  return out;}
