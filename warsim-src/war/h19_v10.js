/* ===================== v10：殺傷效率、正面／側面／背面、陣型與自動轉向、交火對峙與戰場阻隔；AI 行為樹的後勤先行、主攻方向增兵、輪換休整、弱點處置、警戒前哨與側翼掩護 ===================== */

/* ---------- 一、殺傷效率（設定頁可調：整體與直射、砲兵與飛彈、空中、白刃） ---------- */
var LETHC={fire:'fire',melee:'melee',grapple:'melee',art:'art',msl:'art',air:'air',aa:'air',airstrike:'air',breath:'air',drop:'air',carpet:'air'};
function lethMul(kind){var L=G&&G.set&&G.set.leth;if(!L)return 1;var c=LETHC[kind];if(!c)return 1;return (L.all>0?L.all:1)*(L[c]>0?L[c]:1);}
(function(){var b=hit;hit=function(t,src,dm,dv,sup,kind){var m=lethMul(kind);if(m!==1){dm*=m;dv*=m;}if(t&&(kind==='art'||kind==='air'||kind==='airstrike'||kind==='carpet'||kind==='msl'))t.artT=G.t;return b(t,src,dm,dv,sup,kind);};})();
(function(){var b=civHit;civHit=function(x,y,R,lethal,cause,bySide,kf){var m=lethMul(cause);return b(x,y,R,m!==1?Math.min(lethal*m,0.5):lethal,cause,bySide,kf);};})();

/* ---------- 二、正面、側面、背面 ---------- */
var ARCN=['正面','側面','背面'];
function arcOf(t,x,y){var a=Math.abs(angDiff(t.hd||0,Math.atan2(y-t.y,x-t.x)));return a<PI/3?0:a<PI*2/3?1:2;}
/* 受攻擊方：依陣型的側背弱點（正面、側面、背面倍率） */
var FMX={line:[1,1.5,2],column:[1,1.3,1.6],skirmish:[1,1.2,1.5],wedge:[1,1.2,1.6],echelon:[1,1.25,1.9],allround:[1,1,1],dispersed:[1,1.15,1.35]};
/* 射擊方：目標不在正面時的火力（步兵要轉身、砲塔車輛轉砲塔、牽引火砲要轉移砲架；艦艇以側舷射擊） */
function arcOut(u,s,ar){if(ar===0)return 1;if(s.dom==='sea'||s.dom==='sub')return ar===1?1:0.6;if(fmOf(u)==='allround'||u.form==='square')return 0.85;var c=clsOf(u);
  if(s.mobi>=3&&s.hard>=0.5)return ar===1?0.85:0.7;if(c==='art'||c==='at')return ar===1?0.45:0.2;return ar===1?0.6:0.35;}
var V10A=0;
flankF=function(u,t){var ts=ST(t),s=ST(u),f=1;
  if(ts.dom!=='air'&&t.form==='deployed'&&optOf(t).post!=='strong'){var ar=arcOf(t,u.x,u.y),fm=fmOf(t),M=FMX[fm]||FMX.line;f=M[ar];
    if(fm==='echelon'&&ar===1&&(angDiff(t.hd||0,Math.atan2(u.y-t.y,u.x-t.x))>0?1:-1)===(t.fmS||1))f=1.05;/* 梯形退縮的一翼 */
    if(ts.dom!=='land')f=1+(f-1)*0.35;
    /* 野戰工事只保護正面：從側面、背面打進塹壕效果大增（碉堡、堡壘、城牆是全向的） */
    else if(ar>0&&t.ent>0.05&&!(G.map.ft[cellAt(t.x,t.y)]>=4)){var e=t.ent;f*=(1-0.65*e*(ar===1?0.75:0.5))/Math.max(0.2,1-0.65*e);}
    f=Math.min(f,3.2);}
  if(s.dom!=='air'&&isLeaf(u)){var ao=arcOut(u,s,arcOf(u,t.x,t.y));if(G.t-(u.turnT||-1e9)<DT*1.5)ao*=0.8;f*=ao;}
  if(V10A){var a=FME[fmOf(u)],d=FME[fmOf(t)];if(a)f*=a[4];if(d)f/=d[5];}
  return f;};
(function(){var b=assault;assault=function(u,s,en,es){V10A=1;try{b(u,s,en,es);}finally{V10A=0;}};})();

/* ---------- 三、自動轉向 ---------- */
function turnSec(u,s){if(s.dom==='sea'||s.dom==='sub')return 240;var c=clsOf(u),fm=fmOf(u);if(fm==='allround'||u.form==='square')return 1;
  /* 自走砲與戰車殲擊車轉動車體即可；牽引火砲要移動砲架 */var arm=s.hard>=0.5,t=c==='arm'||c==='mech'?60:c==='cav'||c==='rec'?75:c==='art'?(arm?120:600):c==='at'?(arm?60:240):c==='hq'||c==='sup'||c==='med'?240:150;
  if(uEra(u).y<1860&&(c==='inf'||c==='pike')&&fm==='line')t=420;else if(fm==='column')t*=0.7;else if(fm==='skirmish'||fm==='dispersed')t*=0.8;
  t*=1.3-0.006*(u.trn||60);if(u.sup>50)t*=1.4;return Math.max(15,t);}
/* 想面向哪裡：正在射擊我的敵人 → 最近的已知敵軍 → 指定的面向 → 命令的面向 */
function turnWant(u,s){var R=Math.max(rangeOf(s)*1.5,1500),a=u.ufBy?uById(u.ufBy):null;
  if(a&&onMap(a)&&G.t-(u.uf||-1e9)<=120){var as=ST(a),d=dist(a.x,a.y,u.x,u.y);if(as.dom!=='air'&&d<Math.max(R,(as.rM||0)*1.2)&&d<=Math.max(as.rM||0,400)*1.3)return Math.atan2(a.y-u.y,a.x-u.x);}
  var e=u._eid?uById(u._eid):null;if(e&&onMap(e)&&u._ed<R&&ST(e).dom!=='air')return Math.atan2(e.y-u.y,e.x-u.x);
  if(u.hdM!==undefined)return u.hdM;var o=u.ord;if(o&&o.face!==undefined&&(u.task==='hold'||u.task==='at'))return o.face;return null;}
function turnStep(){var auto=G.set.autoTurn!==false;G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||u.st==='air'||u.amph)return;var s=ST(u);if(s.dom==='air'||G.t-(u.movedAt||-1e9)<DT+1)return;
    var w=u.noTurn||!auto?(u.hdM!==undefined?u.hdM:null):turnWant(u,s);if(w===null||w===undefined)return;var d=angDiff(u.hd||0,w);if(Math.abs(d)<0.03)return;
    var st=PI/turnSec(u,s)*DT,a0=arcOf(u,u.x+Math.cos(w)*100,u.y+Math.sin(w)*100);u.hd=Math.abs(d)<=st?w:(u.hd||0)+(d>0?st:-st);u.hd=Math.atan2(Math.sin(u.hd),Math.cos(u.hd));u.turnT=G.t;
    if(a0>0&&G.t-(u.uf||-1e9)<=120&&!u.irr&&G.t-(u.turnLog||-1e9)>1800){u.turnLog=G.t;logE(u.side,'tac',uName(u)+'遭'+ARCN[a0]+'射擊，轉向應戰',u.x,u.y,u.id);}});}

/* ---------- 四、陣型：橫隊、縱隊、散兵線、楔形、梯形、環形、疏開；可手動固定或交給自動選擇 ---------- */
var FMV=[['line','橫隊','火力最強的標準隊形；側面與背面脆弱'],['column','縱隊','移動快、衝擊力強，但容易被火力殺傷'],['skirmish','散兵線','疏散的散兵：不易被殺傷，火力與衝擊力較弱'],['wedge','楔形','裝甲與騎兵的突擊隊形：側翼較不脆弱、突擊力強，火力略減'],
  ['echelon','梯形','向暴露的一側退縮，掩護側翼；火力略減'],['allround','環形（全向）','全向防禦：沒有側背弱點、白刃防禦較強，但火力分散、移動很慢'],['dispersed','疏開','分散隱蔽：大幅減少砲擊與空襲的殺傷；火力、突擊與指揮較弱']];
function fmName(f){var q=FMV.filter(function(x){return x[0]===f;})[0];return q?q[1]:'橫隊';}
/* 火力、受直射、受砲擊與空襲、展開時速度、突擊、白刃防禦 */
var FME={wedge:[0.9,1,1,1,1.2,1],echelon:[0.92,1,1,0.95,1,1],allround:[0.75,1.1,1.2,0.5,0.7,1.25],dispersed:[0.8,0.82,0.55,0.9,0.75,0.85]};
function fmAvail(u){var s=ST(u),c=clsOf(u),y=uEra(u).y,L=['line','column'];if(s.dom!=='land')return [];if(y<1914&&/^(inf|rec|sof|pike|gue|eng|mp|sec)$/.test(c))L.push('skirmish');if(/^(arm|mech|cav|rec)$/.test(c))L.push('wedge');L.push('echelon','allround');if(y>=1900)L.push('dispersed');return L;}
/* 實際陣型：手動固定 → 命令指定的縱隊或散兵線 → 自動選擇 */
fmOf=function(u){var p=u.fmU&&u.fmU!=='auto';var o=(u.ord&&u.ord.opt||{}).fm;if(!p&&(o==='column'||o==='skirmish'))return o;return u.fmC||'line';};
function fmSet(u,f){if(!f||(u.fmC||'line')===f&&!u.fmTo||u.fmTo===f)return;var s=ST(u);if(s.dom!=='land'){u.fmC=f;u.fmTo=null;return;}var t=uEra(u).deploy*60*0.6*(1.3-0.006*(u.trn||60))*(f==='allround'||u.fmC==='allround'?1.4:1);u.fmTo=f;u.fmTT=G.t+t;}
function fmStep(u){if(u.fmTo&&G.t>=(u.fmTT||0)){u.fmC=u.fmTo;u.fmTo=null;}}
/* 側翼是否暴露：2.5 公里內只有一側有友軍 → 回傳暴露的一側（+1 右、-1 左） */
function flankOpen(u){var h=u.hd||0,L=0,R=0;gridNear(u.x,u.y,2500,function(f){if(f===u||f.side!==u.side||!isLeaf(f)||!onMap(f)||ST(f).dom!=='land')return;var d=dist(f.x,f.y,u.x,u.y);if(d>2500)return;var a=angDiff(h,Math.atan2(f.y-u.y,f.x-u.x));if(a>PI/6&&a<PI*5/6)R++;else if(a<-PI/6&&a>-PI*5/6)L++;});return L&&!R?1:R&&!L?-1:0;}
function fmAuto(u){var c=clsOf(u),o=u.ord,k=o?o.k:'halt',av=fmAvail(u),has=function(f){return av.indexOf(f)>=0;};if(!av.length)return null;
  if(u.form==='march')return null;/* 行軍縱隊另有處理，展開後沿用原陣型 */
  if((G.t-(u.encT||-1e9)<600||u.besieged&&G.t-u.besieged<1200)&&has('allround'))return 'allround';
  if(has('dispersed')&&G.t-(u.artT||-1e9)<600&&!(G.t-(u.engT||-1e9)<300)&&!/attack|storm|breakthrough|pursue/.test(k))return 'dispersed';
  if(/attack|storm|breakthrough|pursue|penetrate/.test(k)){if(has('wedge')&&/^(arm|mech|cav)$/.test(c))return 'wedge';if(uEra(u).y<1860&&(u._ed||1e9)<700)return 'column';return 'line';}
  if(/screen|recon/.test(k))return has('dispersed')?'dispersed':has('skirmish')?'skirmish':'line';
  if(!o||/defend|halt|fortify|reserve|rest|support/.test(k)){var ex=flankOpen(u);if(ex&&has('echelon')&&(u._ed||1e9)<8000){u.fmS=ex;return 'echelon';}return 'line';}
  return 'line';}
(function(){var b=firerMod;firerMod=function(u,s){var f=b(u,s),e=FME[fmOf(u)];if(e&&s.dom==='land')f*=e[0];if(u.fmTo)f*=0.6;return f;};})();
(function(){var b=tgtModDirect;tgtModDirect=function(t,ts){var m=b(t,ts),e=FME[fmOf(t)];if(e&&ts.dom==='land'&&t.form==='deployed')m*=e[1];if(t.fmTo)m*=1.1;return m;};})();
(function(){var b=covInd;covInd=function(t){var m=b(t),e=FME[fmOf(t)];if(e&&t.form==='deployed'&&ST(t).dom==='land')m*=e[2];return m;};})();
(function(){var b=speedAt;speedAt=function(u,s,pf){var v=b(u,s,pf),e=FME[fmOf(u)];if(e&&s.dom==='land'&&u.form==='deployed')v*=e[3];if(u.fmTo&&s.dom==='land')v*=0.6;return v;};})();
function fmStepAll(){G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u))return;fmStep(u);if(ST(u).dom!=='land'||(G.step+u.id)%10)return;if(u.fmU&&u.fmU!=='auto'){fmSet(u,u.fmU);return;}var f=fmAuto(u);if(f)fmSet(u,f);});}
/* 姿態與戰術的即時切換（不經指揮鏈：部隊自己的戰鬥姿態） */
function postSwitch(u,p){if(!isLeaf(u)){leavesOf(u).filter(onMap).forEach(function(l){postSwitch(l,p);});return;}if(ST(u).dom!=='land'||!onMap(u))return;var o=u.ord,ex={post:p};if(p==='ambush')ex.roe='close';if(p==='hide')ex.roe='hold';if(p==='delay')ex.maxb=4;
  if(o&&/defend|screen/.test(o.k)){o.opt=Object.assign({},o.opt||{},ex);if(p!=='hide'&&o.opt.roe==='hold')o.opt.roe='side';if(p==='delay')o.dk='delay';else if(o.dk==='delay')delete o.dk;}else activate(u,newOrder('defend',{x:u.x,y:u.y,face:u.hd,opt:ex,dk:p==='delay'?'delay':undefined}));}
function tacSwitch(u,t){if(!isLeaf(u)){leavesOf(u).filter(onMap).forEach(function(l){tacSwitch(l,t);});if(u.ord&&u.ord.k==='attack')u.ord.opt=Object.assign({},u.ord.opt||{},{tac:t});return;}var o=u.ord;if(o&&o.k==='attack')o.opt=Object.assign({},o.opt||{},{tac:t});}

/* ---------- 五、交火對峙：直射交火中的部隊只能撤退（進攻者可向交戰中的敵人逼近突擊），其他部隊不能穿越戰場 ---------- */
var EZ={s:null,z:null,list:[],sig:'',v:0};
function engOn(){return !!(G&&G.set&&G.set.engLock!==false);}
function engNow(u){return G.t-(u.engT||-1e9)<=150;}
function ezAt(x,y){if(!EZ.s||!EZ.list.length)return -1;var k=cellAt(x,y);return EZ.s[k]===EZ.stamp?EZ.z[k]:-1;}
function engStep(){var MP=G.map,N=MP.GW*MP.GH;if(!EZ.s||EZ.s.length!==N){EZ.s=new Int32Array(N);EZ.z=new Int32Array(N);}EZ.stamp=(EZ.stamp||0)+1;EZ.list=[];if(!engOn())return;var seen={},cs=MP.cs;
  G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||u.ms==='rout'||u.st==='air')return;var s=ST(u);if(s.dom!=='land')return;var t=u.tgt?uById(u.tgt):null;if(!t||!onMap(t)||t.side===u.side||ST(t).dom!=='land')return;if(G.t-(u.fired||-1e9)>DT*1.5)return;
    var d=dist(u.x,u.y,t.x,t.y);if(d>s.rM*rngF(u)*1.05+60)return;[u,t].forEach(function(q){if(!engNow(q)&&q.task==='go'&&!engRetreat(q)&&!q.irr&&G.t-(q.lockLog||-1e9)>1800){q.lockLog=G.t;var e=q===u?t:u;logE(q.side,'tac',uName(q)+'與'+uName(e)+'交火對峙'+(q.ord&&/attack|storm|breakthrough|pursue|penetrate|siege/.test(q.ord.k)?'：只能向對方推進突擊，或撤退':'，無法移動（只能撤退）'),q.x,q.y,q.id);}});u.engT=G.t;u.engW=t.id;t.engT=G.t;var w=t.engW?uById(t.engW):null;if(!w||!onMap(w)||dist(w.x,w.y,t.x,t.y)>d*1.5)t.engW=u.id;
    var key=Math.min(u.id,t.id)+'-'+Math.max(u.id,t.id);if(seen[key])return;seen[key]=1;var z={x:(u.x+t.x)/2,y:(u.y+t.y)/2,r:Math.max(300,d/2+250),a:u.id,b:t.id,sa:u.side},zi=EZ.list.length;EZ.list.push(z);
    var R=z.r/cs,cx=z.x/cs,cy=z.y/cs,x0=Math.max(0,Math.floor(cx-R)),x1=Math.min(MP.GW-1,Math.ceil(cx+R)),y0=Math.max(0,Math.floor(cy-R)),y1=Math.min(MP.GH-1,Math.ceil(cy+R));
    for(var gy=y0;gy<=y1;gy++)for(var gx=x0;gx<=x1;gx++){var dx=gx+0.5-cx,dy=gy+0.5-cy;if(dx*dx+dy*dy>R*R)continue;var k=gy*MP.GW+gx;EZ.s[k]=EZ.stamp;EZ.z[k]=zi;}});
  var sig=EZ.list.map(function(z){return Math.round(z.x/1500)+','+Math.round(z.y/1500);}).sort().join('|');if(sig!==EZ.sig){EZ.sig=sig;EZ.v++;}}
/* 自己在這個戰場裡（交戰中，或就在戰場範圍內要離開）、或要前往這個戰場（目的地在範圍內）的部隊可以進入 */
function ezOK(u,zi,gx,gy){var z=EZ.list[zi];if(!z)return true;if(engNow(u)&&dist(u.x,u.y,z.x,z.y)<z.r+1500)return true;if(dist(u.x,u.y,z.x,z.y)<z.r)return true;if(gx!==undefined&&dist(gx,gy,z.x,z.y)<z.r+300)return true;return false;}
function ezAvoid(u){if(!engOn()||!EZ.list.length)return null;var s=ST(u);if(s.dom!=='land')return null;var g=u.goal||[undefined,undefined],ok={};
  var f=function(k){if(EZ.s[k]!==EZ.stamp)return 1;var zi=EZ.z[k];if(ok[zi]===undefined)ok[zi]=ezOK(u,zi,g[0],g[1]);return ok[zi]?1:Infinity;};f._ez=1;return f;}
(function(){var b=roadAvoid;roadAvoid=function(u){var f=b(u),z=ezAvoid(u);if(!z)return f;if(!f)return z;var g=function(k){var a=z(k);return a===Infinity?a:a*f(k);};g._ez=1;return g;};})();
(function(){var b=pathShare;pathShare=function(u,s,av){var k=b(u,s,av);return av&&av._ez?k+'|ez'+EZ.v:k;};})();
/* 補給車隊也繞開正在交火的戰場（代價高但不完全封死，避免整條補給線中斷） */
(function(){var b=lgAvoid;lgAvoid=function(side){var f=b(side);if(!engOn()||!EZ.list.length)return f;return function(k){var a=EZ.s[k]===EZ.stamp?12:1;return f?a*f(k):a;};};})();
/* 行進中前方出現戰場：停下並改道 */
function ezAhead(u,s){if(!engOn()||!EZ.list.length||s.dom!=='land'||!u.path||engNow(u))return false;var P=u.path,d=0,px=u.x,py=u.y,g=u.goal||[undefined,undefined];
  for(var i=P.i;i<P.pts.length&&d<1200;i+=2){var x=P.pts[i],y=P.pts[i+1],L=dist(px,py,x,y),n=Math.max(1,Math.ceil(L/G.map.cs));for(var j=1;j<=n;j++){var zi=ezAt(px+(x-px)*j/n,py+(y-py)*j/n);if(zi>=0&&!ezOK(u,zi,g[0],g[1])){
          if(G.t-(u.ezRT||-1e9)>600&&u.goal){u.ezRT=G.t;if(!u.pq){u.pq=1;G.pq.push(u.id);}if(!u.irr&&G.t-(u.ezLog||-1e9)>1800){u.ezLog=G.t;var z=EZ.list[zi];logE(u.side,'path',uName(u)+'前方'+placeTxt(z.x,z.y)+'正在交火，無法穿越戰場，改道繞行',u.x,u.y,u.id);}}return true;}}d+=L;px=x;py=y;}return false;}
/* 唯一的路線被戰場擋住：在戰場邊緣等待（路徑暫時指向目的地），戰鬥結束或十分鐘後重新規劃 */
function ezBetween(u){var g=u.goal;if(!g||!EZ.list.length)return false;var d=dist(u.x,u.y,g[0],g[1]),n=Math.max(1,Math.ceil(d/(G.map.cs*0.7)));for(var i=1;i<=n;i++){var zi=ezAt(u.x+(g[0]-u.x)*i/n,u.y+(g[1]-u.y)*i/n);if(zi>=0&&!ezOK(u,zi,g[0],g[1]))return true;}return false;}
(function(){var b=roadAhead;roadAhead=function(u,s){if(u.path&&u.path.ezHold){if(!ezBetween(u)||G.t-(u.ezRT||-1e9)>600){u.ezRT=G.t;if(!u.pq&&u.goal){u.pq=1;G.pq.push(u.id);}}return true;}if(ezAhead(u,s))return true;return b(u,s);};})();
/* 撤退類的移動不受對峙限制 */
function engRetreat(u){if(u.ms==='rout'||u.evade)return true;var o=u.ord;if(!o)return u.task==='go';var k=o.k,dk=o.dk||'';return k==='withdraw'||k==='refit'||dk==='refit'||dk==='twd'||dk==='delay'||(o.opt&&o.opt.post==='delay');}
function engLock(u,s){if(!engOn()||!isLeaf(u)||s.dom!=='land'||!engNow(u)||engRetreat(u))return false;var o=u.ord;
  if(o&&/attack|storm|breakthrough|pursue|penetrate|siege/.test(o.k)&&u.path){var t=uById(u.engW);if(t&&onMap(t)){var P=u.path,nx=P.pts[P.i],ny=P.pts[P.i+1];if(nx!==undefined&&Math.abs(angDiff(Math.atan2(ny-u.y,nx-u.x),Math.atan2(t.y-u.y,t.x-u.x)))<PI/3)return false;}}
  if(u.task==='go'&&!u.irr&&G.t-(u.lockLog||-1e9)>1800){u.lockLog=G.t;var e=uById(u.engW);logE(u.side,'tac',uName(u)+'與'+(e?uName(e):'敵軍')+'交火對峙，無法移動（只能撤退）',u.x,u.y,u.id);}return true;}
(function(){var b=moveStep;moveStep=function(u,s,frac){if(engLock(u,s))return 0;var r=b(u,s,frac);
  if(!u.path&&u.goal&&u.task==='go'&&s.dom==='land'&&isLeaf(u)&&EZ.list.length&&dist(u.x,u.y,u.goal[0],u.goal[1])>600&&ezBetween(u)){u.path={pts:[u.x,u.y,u.goal[0],u.goal[1]],i:2,ezHold:1};u.ezRT=G.t;
    if(!u.irr&&G.t-(u.ezLog||-1e9)>1800){u.ezLog=G.t;logE(u.side,'path',uName(u)+'的去路被交戰中的戰場擋住，在'+placeTxt(u.x,u.y)+'等待戰鬥結束或另覓路線',u.x,u.y,u.id);}}return r;};})();

/* ---------- 六、AI 的新戰略與戰術 ---------- */
function v10S(side){var S=SD(side);return S.v10||(S.v10={wk:[],scr:{},rot:0,axis:null,lg:null,lgW:0});}
function aiLand(side){return G.units.filter(function(u){return u.side===side&&isLeaf(u)&&onMap(u)&&aiControls(u)&&ST(u).dom==='land'&&!u.irr&&u.st!=='lift'&&!u.amph;});}
function backPt(side,x,y,d){var h=homeDir(side);return validPos({dom:'land'},x+Math.cos(h)*d,y+Math.sin(h)*d);}
function v10Say(X,key,cool,txt,d){var F=X.F,K=F.v10k||(F.v10k={});if(key&&K[key]&&G.t-K[key]<cool)return false;if(key)K[key]=G.t;aiSay(X,txt,d);return true;}
function knownEn(side,x,y,R){return sum(enemyPic(side,3600).filter(function(c){return c.dom==='land'&&!c.dead&&dist(c.x,c.y,x,y)<R;}),function(c){return (c.men||0)+(c.veh||0)*8;});}
function attackOn(X){return X.groups.some(function(g){var o=g.ord;return o&&/attack|storm|breakthrough|crossing|siege|penetrate|joint|pursue/.test(o.k)&&o.st!=='done'&&G.t-(o.t1||o.ti)<8*3600;});}
/* 6.1 後勤先行：後方基地 → 前進補給站（部隊 15 公里內）→ 補給點（6 公里內，或部隊本身補給正常） */
function lgReady(X){var side=X.side,L=leavesOf(X.F).filter(function(u){return onMap(u)&&ST(u).dom==='land'&&/man|rec|fire/.test(roleOf(u));});if(!L.length)return {r:1,n:0};var C=centroid(L),N=nodesOf(side);
  var base=N.some(function(n){return /off|port|rail|air/.test(n.k)&&n.status!=='captured';}),deps=N.filter(function(n){return n.k==='depot';}).map(function(n){return {n:n,d:dist(n.x,n.y,C[0],C[1])};}).sort(function(a,b){return a.d-b.d;}),dep=deps[0]||null,fwd=!!(dep&&dep.d<=15000),pt=!!(dep&&dep.d<=6000);
  var need=0;L.forEach(function(u){var q=dayNeed(u,1,30);need+=q.ammo+q.fuel;});var stock=fwd?lgSum(dep.n.st,'ammo')+lgSum(dep.n.st,'fuel'):0,ok=L.filter(function(u){return u.insup!==false&&u.ammo>=55&&(!fuelDep(u)||fuelQ(u)>=0.5);}).length/L.length;
  var r=(base?0.2:0)+(fwd?0.3:0)+(pt||ok>0.8?0.1:0)+0.25*ok+(fwd&&stock>=need*0.5?0.15:0);return {r:Math.min(1,r),base:base,fwd:fwd,pt:pt,dep:dep,ok:ok,C:C,need:need,stock:stock,n:L.length};}
function condLogiFirst(X){if(X.lvl<1||X.post!=='attack'||X.P.t==='reck'||X.P.t==='gue'||attackOn(X))return false;var S=v10S(X.side),D=G.set.dur?G.set.dur*3600-G.t:1e9;if(D<8*3600)return false;
  var R=lgReady(X);X.lgR=R;S.lg={t:G.t,r:R.r,fwd:R.fwd,pt:R.pt,ok:R.ok};var req=0.55+0.35*(X.P.logi||0.5);if(R.r>=req){S.lgW=0;return false;}if(!S.lgW)S.lgW=G.t;var wait=(2+8*(X.P.logi||0.5))*3600;
  if(G.t-S.lgW>wait){v10Say(X,'lgGo',6*3600,'補給線尚未完全建立（完備度 '+pct(R.r*100)+'），但已等待 '+durTxt(G.t-S.lgW)+'，仍發起攻勢');return false;}return true;}
function lgSupUnit(X,x,y){return aiLand(X.side).filter(function(u){return ST(u).fl.indexOf('l')>=0&&!busyF(u)&&!u.v10dep&&!engNow(u);}).sort(function(a,b){return dist(a.x,a.y,x,y)-dist(b.x,b.y,x,y);})[0]||null;}
function roadNear(x,y,R){var MP=G.map,best=null,bd=1e18;brushCells(MP,x/MP.cs,y/MP.cs,Math.max(1,R/MP.cs),function(k){if(MP.rd[k]>=1&&!isWater(MP.lc[k])){var c=cellXY(k),d=dist(c[0],c[1],x,y);if(d<bd){bd=d;best=c;}}});return best||[x,y];}
function actLogiFirst(X){var R=X.lgR||lgReady(X),side=X.side,C=R.C,did=[];if(!C)return false;
  var want=function(lv,d){var p=backPt(side,C[0],C[1],d);p=roadNear(p[0],p[1],1500);p=validPos({dom:'land'},p[0],p[1]);if(knownEn(side,p[0],p[1],5000)>0)p=backPt(side,p[0],p[1],3000);
    var su=lgSupUnit(X,p[0],p[1]);if(su){su.v10dep={x:p[0],y:p[1],lv:lv,t:G.t};issue(su,'move',{x:p[0],y:p[1],opt:{pace:'normal',road:1}});did.push((lv===2?'前進補給站':'補給點')+'（'+uName(su)+'前往'+placeTxt(p[0],p[1])+'開設）');return true;}
    var e=aiLand(side).filter(function(u){return isEng(u)&&!busyF(u)&&!engNow(u);})[0];if(e&&!(X.F.aiDepT&&G.t-X.F.aiDepT<4*3600)){X.F.aiDepT=G.t;issue(e,'build',{x:p[0],y:p[1],bk:'depot'});did.push((lv===2?'前進補給站':'補給點')+'（工兵'+uName(e)+'在'+placeTxt(p[0],p[1])+'構築）');return true;}return false;};
  var S=v10S(side),pend=aiLand(side).some(function(u){return u.v10dep&&G.t-u.v10dep.t<4*3600;});
  if(!pend){if(!R.fwd)want(2,8000);else if(!R.pt&&R.ok<0.8&&R.dep&&R.dep.d>8000)want(3,4000);}
  actDefend(X);var lack=[];if(!R.fwd)lack.push('前進補給站');if(R.fwd&&R.stock<R.need*0.5)lack.push('前進補給站存量（'+fmt(R.stock)+'／需要 '+fmt(R.need*0.5)+' 噸）');if(R.ok<0.8)lack.push('部隊補給（彈藥、油料充足的只有 '+pct(R.ok*100)+'）');
  v10Say(X,'lgF',3*3600,'進攻前先建立多級補給線（後方基地 → 前進補給站 → 補給點）'+(lack.length?'；尚缺：'+lack.join('、'):'')+(did.length?'；已下令：'+did.join('、'):'')+'。部隊先就地防禦整補',{why:'logistics',r:Math.round(R.r*100)});return true;}
/* 補給部隊抵達指定地點後開設補給站（帶來一半的存量） */
function v10DepotStep(){G.units.forEach(function(u){var q=u.v10dep;if(!q)return;if(!alive(u)||G.t-q.t>8*3600){u.v10dep=null;return;}if(!onMap(u)||u.path||u.pq||dist(u.x,u.y,q.x,q.y)>800)return;
    var side=u.side,N=addNode(side,'depot',u.x,u.y,{name:(q.lv===2?'前進補給站 ':'補給點 ')+(++v10S(side).seq||1),auto:1,by:u.id,t0:G.t,lv:q.lv});var stk=u.lg&&u.lg.stk;N.st={food:0,ammo:0,fuel:0,fod:0};if(stk)LCLS.forEach(function(c){var x=(stk[c]||0)*0.6;stk[c]-=x;N.st[c]+=x;});
    /* 補給隊卸下車上的一批物資（約半數載重），之後由後方基地的車隊持續補充 */var pay=(u.lg&&u.lg.pay||0)*0.5;if(lgSum(N.st)<pay){N.st.ammo+=pay*0.4;N.st.fuel+=pay*0.3;N.st.food+=pay*0.3;}
    logE(side,'log',uName(u)+'在'+placeTxt(u.x,u.y)+'開設「'+N.name+'」（'+(q.lv===2?'第二級：前進補給站':'第三級：前線補給點')+'）',u.x,u.y,u.id);u.v10dep=null;});}
/* 6.2 主攻方向增兵：預備隊、新到的增援與未交戰地區多出的部隊，作為第二梯隊投入主攻方向 */
function mainAxis(X){var best=null,bv=0;X.groups.forEach(function(g){var o=g.ord;if(!o||o.x===undefined||!/attack|storm|breakthrough|crossing|penetrate|joint|pursue/.test(o.k)||o.st==='done')return;var sm=strengthOf(g),v=sm.men+sm.veh*8;if(v>bv){bv=v;best=g;}});
  if(!best)return null;var C=cOf(best)||[best.x,best.y];return {g:best,x:best.ord.x,y:best.ord.y,C:C};}
function condAxis(X){if(X.lvl<1||X.P.t==='cons'&&X.P.agg<0.3)return false;var A=mainAxis(X);X.axis=A;if(!A)return false;v10S(X.side).axis={x:A.x,y:A.y,t:G.t,g:A.g.id};return true;}
function actAxisReinf(X){var A=X.axis,side=X.side,n=0,eng=leavesOf(A.g).filter(onMap),hot=eng.filter(engNow).length,lost=1-strengthOf(A.g).f,asm=backPt(side,A.C[0],A.C[1],4000);
  var cand=X.groups.filter(function(g){if(g===A.g||!aiControls(g)||busyF(g)&&!(g.ord&&g.ord.k==='reserve')||g.v10ax&&G.t-g.v10ax<3*3600)return false;if(g===X.res&&X.P.res>0.35&&!(X.threat&&X.threat.length===0))return false;var r=roleOf(g);if(r!=='man')return false;var L=leavesOf(g).filter(onMap);if(!L.length||L.some(engNow)||L.some(function(u){return u.v10scr;}))return false;
    var C=cOf(g);if(!C)return false;var far=dist(C[0],C[1],A.C[0],A.C[1])>6000,quiet=knownEn(side,C[0],C[1],6000)===0,fresh=g.isReinf&&G.t-(g.arrived||-1e9)<4*3600,res=g.ord&&g.ord.k==='reserve';return far&&quiet&&(fresh||res||X.P.agg>=0.55||X.P.t==='cmd'||X.P.t==='man');});
  cand.slice(0,X.P.t==='cmd'||X.P.t==='man'?2:1).forEach(function(g){g.v10ax=G.t;var go=hot>=Math.max(1,eng.length/3)||lost>0.25;if(go)issue(g,'attack',{x:A.x,y:A.y,opt:aiOpts(g,'attack',{tac:'firemove'})});else issue(g,'reserve',{x:asm[0],y:asm[1]});n++;
    aiSay(X,'主攻方向在'+placeTxt(A.x,A.y)+'：調派'+uName(g)+(g.isReinf?'（新到的增援）':'')+(go?'作為第二梯隊投入攻擊（第一梯隊損失 '+pct(lost*100)+'）':'到主攻方向後方集結待命'),{why:'axis'});});return n>0;}
/* 6.3 側翼掩護：主攻部隊的側翼沒有友軍、又有敵軍時，派出掩護部隊 */
function condFlankG(X){if(X.lvl<1||!X.axis)return false;var A=X.axis,g=A.g,C=A.C,d=Math.atan2(A.y-C[1],A.x-C[0]),side=X.side,open=[];[1,-1].forEach(function(sg){var p=[C[0]+Math.cos(d+sg*PI/2)*3000,C[1]+Math.sin(d+sg*PI/2)*3000];if(friendNear(side,p[0],p[1],2000)<50&&knownEn(side,p[0],p[1],6000)>0)open.push(p);});X.flankP=open[0]||null;return !!X.flankP&&!(g.v10fg&&G.t-g.v10fg<3*3600);}
function actFlankG(X){var p=X.flankP,side=X.side,u=aiLand(side).filter(function(q){return !busyF(q)&&!engNow(q)&&!q.v10scr&&/rec|cav|mech|arm|inf/.test(clsOf(q))&&dist(q.x,q.y,p[0],p[1])<15000;}).sort(function(a,b){return (clsOf(a)==='rec'?0:1)-(clsOf(b)==='rec'?0:1)||dist(a.x,a.y,p[0],p[1])-dist(b.x,b.y,p[0],p[1]);})[0];if(!u)return false;
  X.axis.g.v10fg=G.t;var ec=enemyCentroid(side,p[0],p[1],8000),face=ec?Math.atan2(ec[1]-p[1],ec[0]-p[0]):homeDir(side)+PI,q=validPos({dom:'land'},p[0],p[1]);issue(u,'screen',{x:q[0],y:q[1],face:face,opt:{post:'hasty'}});u.v10scr={k:'fg',t:G.t};aiSay(X,'主攻部隊的側翼暴露，派'+uName(u)+'在'+placeTxt(q[0],q[1])+'掩護側翼',{why:'flank'});return true;}
/* 6.4 輪換休整：瀕臨潰散、兵力過低、極度疲勞或彈盡的部隊撤到後方休整，由新銳部隊接替陣地 */
function rotNeed(u,P){if(u.v10rot&&G.t-u.v10rot<5*3600)return 0;var o=u.ord;if(o&&(o.k==='rest'||o.k==='refit'||o.k==='withdraw'||o.dk==='refit'))return 0;if(u.ms==='rout'||clsOf(u)==='hq'||roleOf(u)==='sup')return 0;
  var cut=P.t==='reck'?0.6:P.t==='cons'||P.t==='caut'?1.25:1,f=strFrac(u),v=0;if(f<0.45*cut)v+=(0.45*cut-f)*4;if(u.ms==='shaken'&&u.mor<35*cut)v+=1;if(u.fat>(P.t==='reck'?97:90))v+=0.6;if(u.ammo<10&&u.insup===false)v+=0.8;
  if(v>0&&optOf(u).post==='holdfast'&&P.hold>0.6)v*=0.3;return v>0.5&&(G.t-(u.uf||-1e9)<3600||(u._ed||1e9)<6000)?v:0;}
function condRotate(X){if(X.lvl<1)return false;var P=X.P,A=aiLand(X.side),resting=A.filter(function(u){return u.v10rot&&G.t-u.v10rot<4*3600;}).length,full=resting>=Math.max(2,A.length*0.25);
  /* 同時休整的部隊不超過四分之一，滿了只撤最危急的 */var L=A.map(function(u){return [u,rotNeed(u,P)];}).filter(function(q){return q[1]>0&&(!full||strFrac(q[0])<0.3||q[0].mor<25);}).sort(function(a,b){return b[1]-a[1];});X.rot=L.slice(0,2).map(function(q){return q[0];});return X.rot.length>0;}
/* 接替陣地的部隊：只替換守在第一線的步兵、機械化、裝甲、騎兵與反裝甲單位，由步兵或機械化部隊優先接替 */
var ROTL={inf:1,mech:1,arm:1,cav:1,pike:1,at:1,rec:1},ROTR={inf:0,mech:0,pike:0,cav:1,arm:2};
function rotRep(X,u){if(!ROTL[clsOf(u)])return null;return aiLand(X.side).filter(function(q){if(q===u||busyF(q)&&!(q.ord&&q.ord.k==='reserve')||engNow(q)||q.v10scr||q.v10rot&&G.t-q.v10rot<5*3600)return false;if(ROTR[clsOf(q)]===undefined||strFrac(q)<0.75||q.mor<60||q.ms!=='ok'||q.fat>60)return false;return dist(q.x,q.y,u.x,u.y)<10000&&(!q.ord||/reserve|halt|rest/.test(q.ord.k)||q.ord.st==='done');}).sort(function(a,b){return ROTR[clsOf(a)]-ROTR[clsOf(b)]||dist(a.x,a.y,u.x,u.y)-dist(b.x,b.y,u.x,u.y);})[0]||null;}
function actRotate(X){var n=0,side=X.side;X.rot.forEach(function(u){var f=strFrac(u),off=f<0.25&&G.set.autoRefit!==false,p=backPt(side,u.x,u.y,6000+rnd()*2000),rep=rotRep(X,u);if(!rep&&!off&&X.P.hold>0.75&&u.ms==='ok')return;
    u.v10rot=G.t;if(off)issue(u,'refit',{why:'兵力只剩 '+pct(f*100)});else{issue(u,'withdraw',{x:p[0],y:p[1]});u.v10rest={x:p[0],y:p[1],t:G.t};}
    if(rep){issue(rep,'defend',{x:u.x,y:u.y,face:u.hd,opt:{post:'hasty'}});rep.v10rot=0;}n++;var st=[];if(f<0.5)st.push('兵力剩 '+pct(f*100));if(u.ms==='shaken')st.push('士氣動搖（'+fmt(u.mor)+'）');if(u.fat>80)st.push('極度疲勞');if(u.ammo<15)st.push('彈藥將盡');
    aiSay(X,uName(u)+(st.length?'（'+st.join('、')+'）':'')+(off?'撤出戰場到後方整補':'撤到後方休整')+(rep?'，由'+uName(rep)+'接替陣地':''),{why:'rotate'});});v10S(side).rot+=n;return n>0;}
function v10RestStep(){G.units.forEach(function(u){var q=u.v10rest;if(!q)return;if(!alive(u)||G.t-q.t>8*3600){u.v10rest=null;return;}var o=u.ord;if(!onMap(u)||u.path||u.pq)return;if(o&&o.k==='withdraw'&&dist(u.x,u.y,q.x,q.y)<900){u.v10rest=null;activate(u,newOrder('rest',{x:u.x,y:u.y}));logE(u.side,'rest',uName(u)+'在'+placeTxt(u.x,u.y)+'休整',u.x,u.y,u.id);}});}
/* 6.5 弱點處置：防線的缺口或薄弱處 → 伏擊口袋、縱深防禦，或因地形難行而忽略 */
function frontUnits(X){var side=X.side,en=enemyPic(side,3600).filter(function(c){return c.dom==='land'&&!c.dead;});if(!en.length)return {L:[],en:en};var L=aiLand(side).filter(function(u){var r=roleOf(u);if(r!=='man'&&r!=='rec')return false;var o=u.ord;if(o&&/attack|storm|breakthrough|withdraw|refit|pursue|penetrate/.test(o.k))return false;return en.some(function(c){return dist(c.x,c.y,u.x,u.y)<7000;});});return {L:L,en:en};}
function terrHard(x,y,dir){var MP=G.map,y0=G.set.y||1943,pf0=pfFor(0),pfv=pfFor(y0>=1916?4:1),n=0,a=0,b=0,w=0;for(var t=-1500;t<=1500;t+=300)for(var l=-1200;l<=1200;l+=400){var px=x+Math.cos(dir)*t-Math.sin(dir)*l,py=y+Math.sin(dir)*t+Math.cos(dir)*l;if(px<0||py<0||px>=MP.Wm||py>=MP.Hm)continue;var k=cellAt(px,py);n++;if(isWater(MP.lc[k])&&!MP.rd[k]){w++;continue;}a+=pf0.off[k]||0;b+=Math.max(pfv.off[k]||0,MP.rd[k]?0.8:0);}
  if(!n)return null;if(w>n*0.5)return '大片水域，沒有橋梁或道路';a/=n;b/=n;return a<0.4&&b<0.18?'沼澤、叢林或險峻地形，步兵行動緩慢、'+(y0>=1916?'車輛':'騎兵與車馬')+'無法通行':null;}
function condWeak(X){if(X.lvl<1||G.t-(v10S(X.side).wkT||-1e9)<2*3600)return false;var F=frontUnits(X),L=F.L;if(L.length<2){X.weak=null;return false;}var side=X.side,h=homeDir(side)+PI,lx=-Math.sin(h),ly=Math.cos(h),S=v10S(side);
  var P=L.map(function(u){return {u:u,p:u.x*lx+u.y*ly};}).sort(function(a,b){return a.p-b.p;}),W=sum(L,frontW)/L.length,out=[];
  for(var i=1;i<P.length;i++){var A=P[i-1].u,B=P[i].u,gap=P[i].p-P[i-1].p;if(gap<Math.max(2500,W*3.5)||gap>14000)continue;var mx=(A.x+B.x)/2,my=(A.y+B.y)/2,thr=knownEn(side,mx,my,6000);if(thr<=0)continue;out.push({x:mx,y:my,a:A,b:B,gap:gap,thr:thr,dir:h});}
  L.forEach(function(u){var own=friendNear(side,u.x,u.y,1500),thr=knownEn(side,u.x,u.y,3500);if(thr>=300&&own<thr*0.4)out.push({x:u.x,y:u.y,w:u,thr:thr,dir:h,own:own});});
  out=out.filter(function(q){var key=Math.round(q.x/2000)+'|'+Math.round(q.y/2000);q.key=key;return !S.wk.some(function(z){return z.key===key&&G.t-z.t<6*3600;});}).sort(function(a,b){return b.thr-a.thr;});X.weak=out[0]||null;return !!X.weak;}
function actWeakSpot(X){var q=X.weak,side=X.side,P=X.P,S=v10S(side),rec={x:q.x,y:q.y,key:q.key,t:G.t},hard=terrHard(q.x,q.y,q.dir);S.wkT=G.t;if(S.wk.length>60)S.wk.splice(0,S.wk.length-60);
  if(hard&&(P.t!=='cons'||rnd()<0.5)){rec.k='ignore';rec.why=hard;S.wk.push(rec);v10Say(X,'wk'+q.key,6*3600,'防線在'+placeTxt(q.x,q.y)+(q.gap?'有 '+kmTxt(q.gap)+'的缺口':'較薄弱')+'，但那裡是'+hard+'，研判敵軍不會從這裡主攻，暫不加強（保持觀察）',{why:'weak-ignore'});return true;}
  var pocket=q.a&&q.b&&(/def|smart|gue/.test(P.t)||P.hold<0.5&&P.flank>=0.65)&&!(q.a.v10wk&&G.t-q.a.v10wk<6*3600);
  if(pocket){[q.a,q.b].forEach(function(u){var a=Math.atan2(q.y-u.y,q.x-u.x),face=Math.atan2(Math.sin(a)+Math.sin(q.dir)*0.6,Math.cos(a)+Math.cos(q.dir)*0.6);/* 面向口袋、略偏向敵方 */issue(u,'ambush',{x:u.x,y:u.y,face:face});u.v10wk=G.t;});
    var art=aiLand(side).filter(function(u){return roleOf(u)==='fire'&&!busyF(u)&&indOf(u,ST(u))>dist(u.x,u.y,q.x,q.y);})[0];if(art)issue(art,'support',{sup:q.a.p>=0?q.a.p:undefined});rec.k='pocket';S.wk.push(rec);
    aiSay(X,'把'+placeTxt(q.x,q.y)+'的缺口布置成伏擊口袋：'+uName(q.a)+'與'+uName(q.b)+'在兩側設伏、面向口袋'+(art?'，'+uName(art)+'準備火力支援':'')+'，引敵深入再從側面夾擊',{why:'pocket'});return true;}
  var dp=backPt(side,q.x,q.y,2500),d=aiLand(side).filter(function(u){return roleOf(u)==='man'&&!engNow(u)&&!u.v10scr&&(!u.ord||/reserve|halt|rest/.test(u.ord.k)||u.ord.st==='done')&&strFrac(u)>0.6&&dist(u.x,u.y,dp[0],dp[1])<15000;}).sort(function(a,b){return dist(a.x,a.y,dp[0],dp[1])-dist(b.x,b.y,dp[0],dp[1]);})[0];
  if(d){issue(d,'defend',{x:dp[0],y:dp[1],face:q.dir,opt:{post:'prepared'}});d.v10wk=G.t;if(q.w&&!q.w.v10wk){issue(q.w,'delay',{x:q.w.x,y:q.w.y,face:q.dir});q.w.v10wk=G.t;}rec.k='depth';S.wk.push(rec);aiSay(X,'防線在'+placeTxt(q.x,q.y)+'薄弱：派'+uName(d)+'在後方 '+kmTxt(2500)+' 構築第二道防線（縱深防禦）'+(q.w?'，'+uName(q.w)+'改為遲滯、退向第二線':''),{why:'depth'});return true;}
  rec.k='watch';S.wk.push(rec);return false;}
/* 6.6 警戒前哨：未交戰的前線也要有警戒或少量防衛兵力，不讓任何方向完全空虛 */
function condScreens(X){if(X.lvl<1||(X.P.t==='reck'&&rnd()<0.7)||!G.firstContact&&G.t<3600)return false;var F=G.front;if(!F||!F.own||!F.init)return false;var side=X.side,en=enemyOf(side),HS=hostSides(side),W=F.W,H=F.H,cs=F.cs,B=Math.max(1,Math.round(4000/cs)),bins={},S=v10S(side);void en;
  for(var j=1;j<H-1;j++)for(var i=1;i<W-1;i++){var k=j*W+i;if(F.own[k]!==side)continue;if(HS.indexOf(F.own[k+1])<0&&HS.indexOf(F.own[k-1])<0&&HS.indexOf(F.own[k+W])<0&&HS.indexOf(F.own[k-W])<0)continue;var bk=Math.floor(i/B)+'|'+Math.floor(j/B),b=bins[bk]||(bins[bk]={x:0,y:0,n:0});b.x+=(i+0.5)*cs;b.y+=(j+0.5)*cs;b.n++;}
  var need=[];Object.keys(bins).forEach(function(bk){var b=bins[bk],x=b.x/b.n,y=b.y/b.n;if(friendNear(side,x,y,3500)>0)return;var sc=S.scr[bk];if(sc){var su=uById(sc.u);if(su&&onMap(su)&&su.v10scr&&G.t-sc.t<12*3600)return;}need.push({k:bk,x:x,y:y});});
  X.scrNeed=need;return need.length>0;}
function actScreens(X){var side=X.side,S=v10S(side),n=0,L=aiLand(side),cap=Math.max(2,Math.ceil(L.length*0.12)),cur=L.filter(function(u){return u.v10scr&&G.t-u.v10scr.t<12*3600;}).length,pri={rec:0,cav:1,inf:2,gue:2,sec:2,mech:3};
  X.scrNeed.slice(0,2).forEach(function(q){if(cur+n>=cap)return;var p=backPt(side,q.x,q.y,800),u=L.filter(function(c){if(busyF(c)&&!(c.ord&&/reserve|halt/.test(c.ord.k))||engNow(c)||c.v10scr||c.v10rot&&G.t-c.v10rot<5*3600||c.ms!=='ok')return false;var cl=clsOf(c);if(pri[cl]===undefined)return false;/* 戰車不拿來當警戒 */
      /* 不要抽走編制裡最後的戰鬥單位 */var par=c.p>=0?uById(c.p):null;if(par&&kidsOf(par).filter(function(k){return alive(k)&&roleOf(k)==='man';}).length<2&&cl!=='rec')return false;return dist(c.x,c.y,p[0],p[1])<20000;}).sort(function(a,b){return pri[clsOf(a)]-pri[clsOf(b)]||dist(a.x,a.y,p[0],p[1])-dist(b.x,b.y,p[0],p[1]);})[0];if(!u)return;
    var ec=enemyCentroid(side,q.x,q.y,15000),face=ec?Math.atan2(ec[1]-q.y,ec[0]-q.x):homeDir(side)+PI;issue(u,'screen',{x:p[0],y:p[1],face:face,opt:{post:'hasty'}});u.v10scr={k:q.k,t:G.t};S.scr[q.k]={u:u.id,t:G.t,x:p[0],y:p[1]};n++;
    aiSay(X,'未交戰的前線'+placeTxt(q.x,q.y)+'無人警戒：派'+uName(u)+'前出警戒，遇優勢敵軍即回報、後撤',{why:'screen'});});return n>0;}
/* 被賦予警戒、弱點與休整任務的部隊，不會被上級一般的命令拉走（撤退、遲滯除外） */
(function(){var b=planOrder;planOrder=function(F,o){var R=b(F,o);if(!Array.isArray(R)||!aiControls(F))return R;var k=o.dk||o.k;if(/withdraw|delay|twd|refit|halt/.test(k))return R;return R.filter(function(p){var u=p[0];if(!isLeaf(u))return true;var keep=u.v10scr&&G.t-u.v10scr.t<12*3600||u.v10rest||u.v10rot&&G.t-u.v10rot<4*3600&&u.ord&&/rest|withdraw|refit/.test(u.ord.dk||u.ord.k)||u.v10wk&&G.t-u.v10wk<6*3600||u.v10dep;return !keep;});};})();
/* 平行節點：同一回合裡依序執行每個子節點（不因前一個成功而停止） */
function BP(n){return {t:'par',n:n,c:[].slice.call(arguments,1)};}
(function(){var b=btRun;btRun=function(nd,X,tr){if(nd&&nd.t==='par'){var r='F';for(var i=0;i<nd.c.length;i++){if(btRun(nd.c[i],X,tr)==='S')r='S';}if(tr&&nd.n)tr.push([nd.n,r]);return r;}return b(nd,X,tr);};})();
(function(){var b=aiTree;aiTree=function(t){var T=b(t);if(t==='gue')return T;
  var lgf=BQ('後勤先行：建立多級補給線',BC('準備進攻但補給線未就緒',condLogiFirst),BA('建立前進補給站與補給點，部隊先就地防禦',actLogiFirst));
  var i=T.c.map(function(c){return c.n;}).indexOf('攻擊突破口');if(t!=='reck'&&i>=0)T.c.splice(i,0,lgf);
  var side=[BQ('輪換休整',BC('有瀕臨潰散、兵力過低或耗盡的部隊',condRotate),BA('撤到後方休整，由新銳部隊接替',actRotate))];
  if(t!=='cons')side.push(BQ('主攻方向增兵',BC('主攻進行中',condAxis),BA('調派預備隊與新到部隊作為第二梯隊',actAxisReinf)),BQ('側翼掩護',BC('主攻部隊側翼暴露',condFlankG),BA('派部隊掩護側翼',actFlankG)));
  if(t!=='reck')side.push(BQ('弱點處置',BC('防線有缺口或薄弱處',condWeak),BA('伏擊口袋、縱深防禦或依地形忽略',actWeakSpot)));
  side.push(BQ('警戒前哨',BC('有未交戰的前線無人警戒',condScreens),BA('派出警戒或少量防衛兵力',actScreens)));
  return BP(T.n,T,BP.apply(null,['持續處置'].concat(side)));};})();

/* ---------- 七、每步流程 ---------- */
function v10Step(){engStep();turnStep();fmStepAll();if(G.step%20===9){v10DepotStep();v10RestStep();}}
(function(){var b=v8Step;v8Step=function(){b();v10Step();};})();
