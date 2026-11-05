/* ===================== 海軍指揮官：與陸軍指揮官分開的海軍 AI、艦隊的命令傳遞（旗號、燈號、通報艦、無線電、數據鏈）、水雷與掃雷 =====================
   每一方有艦艇時就有一位海軍指揮官，指揮艦艇、海軍航空隊（艦載機、水上偵察機、海上巡邏機、預警機）與海軍陸戰隊；陸軍指揮官不再指揮這些部隊。
   AI 方由海軍指揮官自己判斷；玩家方可以在設定裡交給海軍指揮官代管（玩家下的命令優先）。
   海軍指揮官有個性：決戰型、存在艦隊型、夜襲型、護航型、航空打擊型、飛彈齊射型；依時代採用不同戰術：
   - 帆船時代：搶佔上風位置，戰列線接戰；槳帆船衝撞與接舷。
   - 鐵甲艦到無畏艦：戰列線在遠距離砲戰，驅逐艦晝間護衛主力、夜間魚雷突擊。
   - 航艦時代：航艦遠離敵艦砲射程，以艦載機先發制人；水面艦護衛航艦；夜間水面戰以魚雷與雷達決勝。
   - 飛彈時代：在敵方射程外以最大射程的反艦飛彈先發制人。
   潛艦伏擊高價值目標；布雷艦在本方海岸的接近路線布雷；掃雷艇清除已知的敵方雷區；陸戰隊在取得局部制海權後登陸。
   命令由旗艦發出，依時代與距離用旗號（白天）、燈號（夜間）、通報艦（視距外、無線電以前）、無線電報、艦隊無線電話或數據鏈傳遞，各有延遲。 ===================== */
if(typeof GKEYS!=='undefined')GKEYS.push('mines');
Object.assign(ORDN,{minelay:'布雷',sweep:'掃雷'});
/* ---------- 誰歸海軍 ---------- */
function ncLeafNavy(u){if(!u||!isLeaf(u))return false;var s=ST(u);if(s.br==='mon')return false;if(s.dom==='sea'||s.dom==='sub')return true;var t=u.mix&&u.mix[0]?typeOf(u.mix[0][0]):null;return !!(t&&t.navy);}
function ncAllNavy(F){if(isLeaf(F))return ncLeafNavy(F);var L=leavesOf(F);return L.length>0&&L.every(ncLeafNavy);}
/* 海軍指揮官指揮的末端單位：本身屬海軍，且直屬的上級不是混編的陸軍編制 */
function ncCtlLeaf(u){if(!ncLeafNavy(u))return false;var p=u.p>=0?uById(u.p):null;return !p||ncAllNavy(p);}
function ncOn(side){if(!G||G.set.navCmd===false)return false;var S=SD(side);if(!S.ai&&!(G.set.navAuto&&G.set.navAuto[side]))return false;return G.units.some(function(u){return u.side===side&&alive(u)&&ncCtlLeaf(u);});}
/* 陸軍指揮官不再指揮海軍 */
(function(){var b=aiControls;aiControls=function(u){if(G&&G.set.navCmd!==false&&ncAllNavy(u)&&SD(u.side).ai)return false;return b(u);};})();
(function(){var b=aiNav;aiNav=function(X,main){if(G.set.navCmd!==false)return;return b(X,main);};})();
/* ---------- 海軍指揮官 ---------- */
var NCT={decis:['決戰型','主動尋求艦隊決戰，兵力相當也願意接戰',{agg:0.85,thr:0.8,night:0.5}],fleet:['存在艦隊型','保存艦隊、牽制敵軍，只在明顯優勢時接戰',{agg:0.3,thr:1.6,night:0.2}],
  raid:['夜襲型','以夜間魚雷突擊與打了就跑削弱敵軍，天亮前脫離',{agg:0.65,thr:0.6,night:1}],conv:['護航型','以保護運輸船團與登陸部隊為第一優先，重視反潛',{agg:0.45,thr:1.2,night:0.3,esc:1}],
  air:['航空打擊型','以艦載機在敵艦砲射程外先發制人，避免水面砲戰',{agg:0.7,thr:1,night:0.2,air:1}],msl:['飛彈齊射型','在敵方射程外以最大射程的飛彈齊射先發制人',{agg:0.7,thr:0.9,night:0.6,msl:1}]};
function ncYear(){return G.set.y||1943;}
function ncShips(side){return G.units.filter(function(u){return u.side===side&&alive(u)&&onMap(u)&&ncCtlLeaf(u);});}
function ncAuto(side,L){var y=ncYear(),r=mb32(hstr((G.set.seed||'')+'|nc|'+side)),cv=L.some(function(u){return ST(u).fl.indexOf('C')>=0;}),ms=L.some(function(u){var s=ST(u);return s.dom==='sea'&&s.fl.indexOf('y')>=0;}),tr=L.some(function(u){return ST(u).fl.indexOf('i')>=0;}),P=[];
  if(y<1860)P=['decis','decis','fleet'];else if(y<1905)P=['decis','fleet','raid'];else if(y<1940)P=['decis','fleet','raid','conv'];else if(y<1970)P=cv?['air','air','decis','conv','raid']:['decis','raid','conv','fleet'];else P=ms?['msl','msl','air','conv','fleet']:['conv','fleet','decis'];
  if(tr&&r()<0.35)return 'conv';return P[Math.floor(r()*P.length)];}
function ncOf(side){var S=SD(side);if(S.ncmd&&S.ncmd.t&&NCT[S.ncmd.t])return S.ncmd;var L=ncShips(side),y=ncYear(),t=S.ncmdT&&NCT[S.ncmdT]?S.ncmdT:ncAuto(side,L),r=mb32(hstr((G.set.seed||'')+'|ncn|'+side));
  S.ncmd={t:t,n:(y<1860?'艦隊司令':y<1945?'艦隊司令長官':'艦隊司令')+' '+personName(r,G.sides[side]&&G.sides[side].pst),P:Object.assign({},NCT[t][2]),post:'',log:{}};return S.ncmd;}
/* 旗艦：最大的艦（航艦、戰艦優先） */
function ncFlag(side,L){L=L||ncShips(side);var best=null,bv=-1;L.forEach(function(u){var s=ST(u);if(s.dom!=='sea')return;var v=(s.fl.indexOf('C')>=0?3:1)*(s.men||0)*(s.hard>=1?1.5:1);if(v>bv){bv=v;best=u;}});return best||L[0]||null;}
function ncSay(side,txt,x,y,id){logE(side,'navy',ncOf(side).n+'：'+txt,x,y,id);}
/* ---------- 命令傳遞：旗號、燈號、通報艦、無線電報、艦隊無線電話、數據鏈 ---------- */
var NCVIA={flag:'旗號',lamp:'燈號',boat:'通報艦',wt:'無線電報',tbs:'艦隊無線電話',link:'數據鏈',direct:'當面'};
function ncVis(){var W=WX[G.env.wx]||WX[0],night=G.env.light<0.3;return (night?6000:16000)*clamp(W[5]===undefined?1:W[5]+0.2,0.25,1);}
function ncSig(side,from,to){var y=ncYear(),d=from&&to?dist(from.x,from.y,to.x,to.y):0,night=G.env.light<0.3,vis=ncVis();if(!from||from===to||d<300)return {sec:30,via:'direct'};
  if(y>=1975)return {sec:60,via:'link'};
  if(y>=1942&&d<=40000)return {sec:90+d/1000*2,via:'tbs'};
  if(d<=vis)return {sec:(night?240:180)+(y<1860?240:0),via:night?'lamp':'flag'};
  /* 視距外：可經沿線的艦艇轉發旗號；無線電以後改用無線電報 */
  if(y>=1905)return {sec:900+(y<1925?600:0),via:'wt'};
  var seg=function(q){var dx=to.x-from.x,dy=to.y-from.y,t=clamp(((q.x-from.x)*dx+(q.y-from.y)*dy)/(d*d),0,1);return dist(q.x,q.y,from.x+dx*t,from.y+dy*t);},relay=ncShips(side).filter(function(q){return q!==from&&q!==to&&seg(q)<vis*0.4;}).length,hops=Math.ceil(d/vis);
  if(!night&&relay>=hops-1&&hops<=4)return {sec:hops*300+(y<1860?hops*240:0),via:'flag'};
  return {sec:d/6+600,via:'boat'};}
function ncSend(side,u,k,p,why){var C=ncOf(side),F=ncFlag(side),q=ncSig(side,F,u),o=newOrder(k,p||{});o.nc=1;var Q=SD(side).ncq||(SD(side).ncq=[]);Q.push({to:u.id,o:o,ta:G.t+q.sec,via:q.via});
  u._nc={k:k,x:p&&p.x,y:p&&p.y,t:G.t};if(why&&!C.log[u.id+k]){C.log[u.id+k]=1;logE(side,'navy',C.n+'以'+NCVIA[q.via]+'命令'+uName(u)+'：'+ordN(o)+(p&&p.x!==undefined?'（'+placeTxt(p.x,p.y)+'）':'')+'——'+why+'，約 '+durTxt(q.sec)+' 後收到',u.x,u.y,u.id);}return q;}
function ncDeliver(side){var Q=SD(side).ncq;if(!Q||!Q.length)return;for(var i=Q.length-1;i>=0;i--){var m=Q[i];if(m.ta>G.t)continue;Q.splice(i,1);var u=uById(m.to);if(u&&alive(u)){if(u.ord&&!u.ord.nc&&u.ord.st!=='done'&&!SD(side).ai)continue;receiveOrder(u,m.o);}}}
/* 已經在執行相同的命令就不重發 */
function ncSame(u,k,x,y){var n=u._nc;if(!n||n.k!==k)return false;if(x!==undefined&&n.x!==undefined&&dist(n.x,n.y,x,y)>Math.max(1500,dist(u.x,u.y,x,y)*0.25))return false;return G.t-n.t<3600&&u.ord&&u.ord.k===k&&u.ord.st!=='done';}
function ncOrder(side,u,k,p,why){if(ncSame(u,k,p&&p.x,p&&p.y))return;var S=SD(side);if(!S.ai&&u.ord&&!u.ord.nc&&u.ord.st!=='done')return;/* 玩家下的命令優先 */ncSend(side,u,k,p,why);}
/* ---------- 戰力與敵情 ---------- */
function ncCPow(c){if(c.pt&&UT[c.pt])return fpType(c.pt)*(c.pv>0?c.pv:1);var u=uById(c.id);return u&&isLeaf(u)?fpPowLeaf(u):(c.men||0)*0.05+(c.veh||0)*20;}
function ncSea(side,age){var C=G.ct[side]||{},o=[];for(var id in C){var c=C[id];if(c.dead||G.t-c.t>(age||5400))continue;if(c.dom==='sea'||c.dom==='sub')o.push(c);}return o;}
function ncCls(u){var s=ST(u),k=u.mix&&u.mix[0]?u.mix[0][0]:'';if(s.dom==='air')return s.fl.indexOf('r')>=0?'scout':'nair';if(s.dom==='land')return 'mar';if(s.dom==='sub')return 'sub';if(s.fl.indexOf('C')>=0)return 'cv';if(s.fl.indexOf('i')>=0)return 'tr';if(/^ml/.test(k))return 'ml';if(/^(msw|mcm)/.test(k))return 'msw';
  if(s.veh>=3&&s.men/s.veh<80||/^(pt|pb|gb)/.test(k))return 'boat';if(/^(fg|cl|dd|ff)/.test(k)||s.men<=400&&s.fl.indexOf('T')>=0)return 'lite';return 'cap';}
/* 天亮前多久 */
function ncNight(){return G.env.light<0.3;}
function ncAirR(u){var s=ST(u);return Math.max(30000,(s.vr||300)*1000*Math.max(1,s.end||2)*0.3);}
/* ---------- 主邏輯（約每 20 分鐘） ---------- */
function ncStep(side){if(!ncOn(side))return;var C=ncOf(side),P=C.P,y=ncYear(),L=ncShips(side);if(!L.length)return;var by={};L.forEach(function(u){var k=ncCls(u);(by[k]=by[k]||[]).push(u);});
  var en=ncSea(side,5400),me=sum(L.filter(function(u){return ST(u).dom!=='land'&&ST(u).dom!=='air';}),fpPowLeaf),ep=sum(en.filter(function(c){return c.dom==='sea';}),ncCPow),night=ncNight(),home=homeDir(side),fl=ncFlag(side,L),FC=fl?[fl.x,fl.y]:centroid(L);
  var m0=SD(side).ncM0||(SD(side).ncM0=me),frac=m0>0?me/m0:1,ratio=ep>0?me/ep:9,nightOK=y>=1942||P.night>=0.8||y>=1905&&L.some(function(u){return ST(u).fl.indexOf('T')>=0;})&&P.night>=0.5;
  var post=frac<0.45?'retire':!en.length?'search':ratio>=P.thr&&(!night||nightOK||y<1860)?'engage':P.agg>=0.6?'shadow':'avoid';
  if(P.night>=0.8&&!night&&en.length&&post==='engage'&&y>=1905&&y<1970&&!by.cv)post='shadow';/* 夜襲型：白天保持距離，等天黑 */
  if(post!==C.post){C.post=post;ncSay(side,{retire:'艦隊損失過半，撤出戰場保存兵力',search:'尚未掌握敵艦隊位置，派出偵察兵力搜索',engage:'判斷兵力足以一戰（我 '+fmt(me)+'：敵 '+fmt(ep)+'，敵情'+(en.some(function(c){return c.pt;})?'依目前的識別':'')+'），下令接敵',shadow:'敵我兵力'+(ratio<P.thr?'不利':'相當')+'，保持接觸、等待時機'+(P.night>=0.8&&!night?'（等待入夜）':''),avoid:'敵艦隊佔優勢，避免決戰、退向本方海域'}[post],FC[0],FC[1]);}
  var tgt=function(F,pref){var best=null,bv=1e18;en.forEach(function(c){var v=dist(F[0],F[1],c.x,c.y)/(pref?pref(c):1);if(v<bv){bv=v;best=c;}});return best;};
  var hv=function(c){var t=c.pt&&UT[c.pt];return t?(t.fl.indexOf('C')>=0?4:t.fl.indexOf('i')>=0?3:t.hard>=1&&t.men>=1000?2.5:1):1;};
  var retirePt=function(u){var p=seaEdge(side,u.x,u.y);return p||[u.x+Math.cos(home)*15000,u.y+Math.sin(home)*15000];};
  var standOff=function(u,c,R){var a=Math.atan2(u.y-c.y,u.x-c.x),p=validPos(ST(u),c.x+Math.cos(a)*R,c.y+Math.sin(a)*R);return p;};
  /* 水面艦 */
  var surf=(by.cap||[]).concat(by.lite||[]),boats=by.boat||[];
  surf.concat(boats).forEach(function(u){var s=ST(u),cl=ncCls(u);if(post==='retire'||post==='avoid'&&dist(u.x,u.y,FC[0],FC[1])<60000){var p=retirePt(u);ncOrder(side,u,'move',{x:p[0],y:p[1]},post==='retire'?'撤出戰場':'避戰');return;}
    if(post==='search'){if(cl==='lite'&&(by.lite.indexOf(u)<2)){var a=home+PI+(by.lite.indexOf(u)?0.5:-0.5),p2=validPos(s,FC[0]+Math.cos(a)*25000,FC[1]+Math.sin(a)*25000);ncOrder(side,u,'recon',{x:p2[0],y:p2[1]},'前出搜索敵艦隊');}
      else if(fl&&u!==fl&&by.cv){ncOrder(side,u,'move',{x:fl.x+Math.cos(home+PI)*3000,y:fl.y+Math.sin(home+PI)*3000},'護衛航艦');}return;}
    var c=tgt([u.x,u.y],cl==='boat'||cl==='lite'?hv:null);if(!c)return;var d=dist(u.x,u.y,c.x,c.y);
    if(post==='shadow'){var R=Math.max(18000,(s.rM||10000)*1.3);if(d<R*0.8){var q=standOff(u,c,R);ncOrder(side,u,'move',{x:q[0],y:q[1]},'保持接觸、不接戰');}return;}
    /* 接敵：依時代 */
    if(by.cv&&y>=1940&&y<1970&&P.air&&cl!=='boat'&&!night){var cv=by.cv[0];ncOrder(side,u,'move',{x:cv.x+Math.cos(home+PI)*4000,y:cv.y+Math.sin(home+PI)*4000},'在航艦前方擔任防空與反潛警戒');return;}
    if(y<1860){var wd=G.env.wd||0,up=[c.x-Math.cos(wd)*1500,c.y-Math.sin(wd)*1500],dw=(u.x-c.x)*Math.cos(wd)+(u.y-c.y)*Math.sin(wd);
      if(dw>200&&s.fl.indexOf('K')<0){var q2=validPos(s,up[0],up[1]);ncOrder(side,u,'move',{x:q2[0],y:q2[1]},'搶佔上風位置');return;}ncOrder(side,u,'attack',{x:c.x,y:c.y},s.fl.indexOf('K')>=0?'划近衝撞、接舷':'佔上風後以戰列線接戰');return;}
    if(y>=1970&&s.fl.indexOf('y')>=0&&(s.rE||0)>20000){if(d>s.rE*0.9){var q3=standOff(u,c,s.rE*0.8);ncOrder(side,u,'attack',{x:q3[0],y:q3[1]},'進入飛彈射程、齊射');}else ncOrder(side,u,'attack',{x:c.x,y:c.y},'在敵方射程外飛彈齊射');return;}
    if((cl==='lite'||cl==='boat')&&s.fl.indexOf('T')>=0){if(night||post==='engage'&&P.agg>=0.6||cl==='boat'){ncOrder(side,u,'attack',{x:c.x,y:c.y},night?'夜間魚雷突擊':'魚雷突擊');return;}var cap=(by.cap||[])[0];if(cap){ncOrder(side,u,'move',{x:cap.x+Math.cos(home+PI)*2000,y:cap.y+Math.sin(home+PI)*2000},'晝間護衛主力艦');return;}}
    if(cl==='cap'&&y>=1860&&(s.rM||0)>8000&&!night){var q4=standOff(u,c,s.rM*0.85);ncOrder(side,u,'attack',{x:q4[0],y:q4[1]},'戰列線在遠距離砲戰');return;}
    ncOrder(side,u,'attack',{x:c.x,y:c.y},night?'夜戰':'接戰');});
  /* 航艦：遠離敵艦砲射程 */
  (by.cv||[]).forEach(function(u){var c=tgt([u.x,u.y],function(q){return q.dom==='sea'?1:0.01;});if(post==='retire'||c&&c.dom==='sea'&&dist(u.x,u.y,c.x,c.y)<45000){var p=c?standOff(u,c,90000):retirePt(u);ncOrder(side,u,'move',{x:p[0],y:p[1]},'航艦遠離敵艦砲射程');}});
  /* 海軍航空隊 */
  (by.nair||[]).forEach(function(u){if(u.st!=='air'&&u.st!=='ok'&&u.st!=='base')return;var c=tgt([u.x,u.y],hv),R=ncAirR(u);if(c&&c.dom==='sea'&&dist(u.x,u.y,c.x,c.y)<R&&post!=='retire'&&!night){ncOrder(side,u,'strike',{x:c.x,y:c.y,r:3000},'艦載機攻擊敵艦（'+(c.pt&&UT[c.pt]?UT[c.pt].n:'敵艦')+'）');return;}
    var cv=(by.cv||[])[0];if(cv)ncOrder(side,u,'patrol',{x:cv.x,y:cv.y,r:8000},'艦隊上空戰鬥巡邏');});
  (by.scout||[]).forEach(function(u,i){var a=home+PI+(i%3-1)*0.6,R=ncAirR(u)*0.8,p=[FC[0]+Math.cos(a)*R,FC[1]+Math.sin(a)*R];ncOrder(side,u,'recon',{x:clamp(p[0],500,G.map.Wm-500),y:clamp(p[1],500,G.map.Hm-500)},'扇形搜索敵艦隊');});
  /* 潛艦：伏擊高價值目標 */
  (by.sub||[]).forEach(function(u){var c=tgt([u.x,u.y],hv);if(c&&dist(u.x,u.y,c.x,c.y)<40000){ncOrder(side,u,'attack',{x:c.x,y:c.y},'潛航接近、攻擊'+(c.pt&&UT[c.pt]?UT[c.pt].n:'敵艦'));return;}var p=validPos(ST(u),FC[0]+Math.cos(home+PI)*30000,FC[1]+Math.sin(home+PI)*30000);ncOrder(side,u,'move',{x:p[0],y:p[1]},'前出到敵方接近路線上埋伏');});
  /* 運輸船團的護衛 */
  if(by.tr&&(P.esc||post!=='engage')){var esc=(by.lite||[]).concat(by.boat||[]).slice(0,Math.max(1,Math.ceil((by.lite||[]).length/2)));by.tr.forEach(function(t,i){var e=esc[i%Math.max(1,esc.length)];if(e&&(!P.esc&&post==='engage'?false:true))ncOrder(side,e,'move',{x:t.x,y:t.y},'護航運輸船團');});}
  /* 布雷與掃雷 */
  (by.ml||[]).forEach(function(u){if(u.mlDone||u.ord&&u.ord.k==='minelay'&&u.ord.st!=='done')return;var o=(G.obj||[]).filter(function(q){return q.own===side;}),base=o.length?o[0]:{x:FC[0],y:FC[1]},p=mnSpot(side,base.x,base.y);if(p)ncOrder(side,u,'minelay',{x:p[0],y:p[1],r:1500},'在本方海岸的接近路線上布雷');});
  (by.msw||[]).forEach(function(u){var f=mnKnown(side).filter(function(m){return m.side!==side&&m.n>=1;}).sort(function(a,b){return dist(u.x,u.y,a.x,a.y)-dist(u.x,u.y,b.x,b.y);})[0];if(f)ncOrder(side,u,'sweep',{x:f.x,y:f.y,r:f.r},'清除已知的敵方雷區');else if(fl)ncOrder(side,u,'move',{x:fl.x+Math.cos(home)*3000,y:fl.y+Math.sin(home)*3000},'隨主力行動，準備掃雷');});
  /* 陸戰隊：取得局部制海權後登陸 */
  if(by.mar&&post!=='retire'&&G.t>900){var obj=(G.obj||[]).filter(function(q){return objTgt(side,q)&&mnCoast(q.x,q.y,4000);}).sort(function(a,b){return dist(FC[0],FC[1],a.x,a.y)-dist(FC[0],FC[1],b.x,b.y);})[0];
    if(obj&&!en.some(function(c){return c.dom==='sea'&&dist(c.x,c.y,obj.x,obj.y)<25000&&ncCPow(c)>me*0.3;}))by.mar.forEach(function(u){if(u.amph||u.st==='lift')return;var ashore=!mnCoast(u.x,u.y,800);ncOrder(side,u,ashore&&dist(u.x,u.y,obj.x,obj.y)<6000?'attack':'landing',{x:obj.x,y:obj.y},'取得局部制海權，陸戰隊登陸'+(obj.n||'目標'));});}}
/* ---------- 水雷 ---------- */
function mnList(){return G.mines||(G.mines=[]);}
function mnKnown(side){return mnList().filter(function(m){return m.side===side||m.kn&&m.kn.indexOf(side)>=0;});}
function mnCoast(x,y,R){var MP=G.map,cs=MP.cs,n=Math.ceil(R/cs);for(var dy=-n;dy<=n;dy+=Math.max(1,Math.floor(n/4)))for(var dx=-n;dx<=n;dx+=Math.max(1,Math.floor(n/4))){var X=Math.floor(x/cs)+dx,Y=Math.floor(y/cs)+dy;if(X<0||Y<0||X>=MP.GW||Y>=MP.GH)continue;if(seaWater(MP.lc[Y*MP.GW+X]))return true;}return false;}
/* 布雷地點：本方要地外海、朝敵方來向約 4～8 公里的水域 */
function mnSpot(side,x,y){var a=homeDir(side)+PI;for(var d=4000;d<=12000;d+=2000){var p=[x+Math.cos(a)*d,y+Math.sin(a)*d],c=cellAt(p[0],p[1]);if(c>=0&&seaWater(G.map.lc[c]))return p;}var p2=validPos({dom:'sea'},x+Math.cos(a)*6000,y+Math.sin(a)*6000);return p2&&seaWater(G.map.lc[cellAt(p2[0],p2[1])])?p2:null;}
function mnStock(u){if(u.mineN===undefined){var k=u.mix&&u.mix[0]?u.mix[0][0]:'';u.mineN=(MLCAP[k]||0)*Math.max(1,u.veh0||1);}return u.mineN;}
function mnWork(u){var o=u.ord,s=ST(u);if(!o||(o.k!=='minelay'&&o.k!=='sweep'))return;if(u.task!=='hold'&&u.task!=='at')return;if(dist(u.x,u.y,o.x,o.y)>Math.max(900,(o.r||1500)*0.8))return;var y=ncYear(),r=o.r||1500;
  if(o.k==='minelay'){if(mnStock(u)<=0){o.st='done';u.mlDone=1;return;}var f=o.fid?mnList().filter(function(m){return m.id===o.fid;})[0]:null;if(!f){G.mineSeq=(G.mineSeq||0)+1;f={id:G.mineSeq,side:u.side,x:o.x,y:o.y,r:r,n:0,t:G.t,kn:[],by:u.id,mag:y>=1939?1:0};mnList().push(f);o.fid=f.id;logE(u.side,'navy',uName(u)+'開始在'+placeTxt(o.x,o.y)+'布設水雷',o.x,o.y,u.id);}
    var n=Math.min(mnStock(u),30*Math.max(1,u.veh)*DT/600);f.n+=n;u.mineN-=n;if(u.mineN<=0.5){u.mineN=0;o.st='done';u.mlDone=1;logE(u.side,'navy',uName(u)+'完成布雷：約 '+fmt(Math.round(f.n))+' 枚水雷',o.x,o.y,u.id);}return;}
  /* 掃雷：已知或附近的敵方雷區 */
  var rate=(y<1930?2:y<1970?3:4)*Math.max(1,u.veh)*DT/600;mnList().forEach(function(m){if(m.side===u.side||m.n<=0||dist(m.x,m.y,u.x,u.y)>m.r+1500)return;if(m.kn.indexOf(u.side)<0){m.kn.push(u.side);logE(u.side,'navy',uName(u)+'在'+placeTxt(m.x,m.y)+'發現敵方雷區',m.x,m.y,u.id);}
    var cut=Math.min(m.n,rate*(m.mag&&y<1940?0.5:1));m.n-=cut;if(m.n<1){m.n=0;logE(u.side,'navy',uName(u)+'已清除'+placeTxt(m.x,m.y)+'的雷區',m.x,m.y,u.id);o.st='done';}});}
/* 觸雷：艦艇在敵方雷區裡航行，依水雷密度與航行距離計算 */
function mnHit(){var M=mnList();if(!M.length)return;G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u))return;var s=ST(u);if(s.dom!=='sea'&&s.dom!=='sub')return;if(G.t-(u.movedAt||-1e9)>DT*2)return;
  M.forEach(function(m){if(m.n<1)return;var d=dist(u.x,u.y,m.x,m.y);if(d>m.r)return;var own=m.side===u.side,kn=own||m.kn.indexOf(u.side)>=0,sw=/^(msw|mcm)/.test(u.mix[0][0]),L=Math.max(5,(s.vr||20)/3.6*DT*0.5),W=s.dom==='sub'?20:(s.men>=1000?35:s.men>=200?25:15),lam=0.12*m.n*(W+20)*L/(PI*m.r*m.r)*(own?0.05:kn?0.35:1)*(sw?0.3:1);
    if(rnd()>=1-Math.exp(-lam))return;m.n=Math.max(0,m.n-1);var big=u.veh0<=1,dv=big?0.3+0.4*rnd():1,dm=big?u.men*(0.05+0.1*rnd()):u.men/Math.max(1,u.veh);hit(u,null,dm,dv,25,'mine');if(m.kn.indexOf(u.side)<0&&!own)m.kn.push(u.side);
    logE(u.side,'navy',uName(u)+'在'+placeTxt(u.x,u.y)+'觸雷'+(big?'受創':'，一艘沉沒'),u.x,u.y,u.id);logE(m.side,'navy','敵艦在本方雷區觸雷（'+placeTxt(u.x,u.y)+'）',u.x,u.y,u.id);});});}
/* ---------- 掛上模擬迴圈 ---------- */
(function(){var b=leafStep;leafStep=function(u){b(u);try{if(u.ord&&(u.ord.k==='minelay'||u.ord.k==='sweep'))mnWork(u);}catch(e){}};})();
(function(){var b=v8Step;v8Step=function(){b();if(!G.started)return;try{SIDES().forEach(function(s){ncDeliver(s);if(G.step%40===(s*13+17)%40)ncStep(s);});if(G.step%2===0)mnHit();}catch(e){if(typeof console!=='undefined')console.warn('海軍指揮官',e);}};})();
