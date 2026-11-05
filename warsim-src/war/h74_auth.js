/* ===================== 授權命令與戰場裁量權 =====================
   各級部隊遇到機會或危險時，要不要先向上級請示，依本方的「授權表」：五種行動（主動出擊、追擊、迂迴合圍、後撤、填補防線）×
   四個層級（連以下、營、團旅、師以上），每格「自行判斷」「須請示」或「不得自行」。
   自行判斷：當場行動，保持主動，但只看得到自己附近，可能追進敵人的圈套；
   須請示：請求沿指揮鏈送到第一個能作主的上級（電腦或玩家），上級依更完整的敵情決定，准許的回覆再送回來才行動——機會可能已經過去；
   不得自行：只照命令行動。沒有設定的格子沿用過去的規則（電腦與「下級主動性（玩家）」自行判斷，後撤一律自行判斷，迂迴合圍不做）。 ===================== */
var AUTHK=[['atk','主動出擊','對附近動搖或較弱的敵軍發動未經命令的攻擊；以預備隊反擊'],['pur','追擊','追擊潰散的敵軍'],['enc','迂迴合圍','派預備隊繞到交戰中敵軍的側後'],['wd','後撤','受到壓力時退到後方重新佈防'],['def','填補防線','派預備隊填補友軍動搖的地段']];
var AUTHL=[['連以下','排、連'],['營','營級部隊'],['團／旅','團、旅'],['師以上','師、軍、集團軍']];
var AUTHV=[['own','自行判斷'],['ask','須請示'],['no','不得自行']];
var AUTHP={mission:['任務式指揮','各級自行判斷，保持主動，但可能落入圈套'],std:['分層授權','連、營的出擊與追擊須請示，團以上自行判斷；迂迴合圍由團以上決定'],central:['集權指揮','所有主動行動都要請示上級，後撤也一樣：穩妥但常常錯失先機'],hold:['寸土不讓','不得自行後撤，其他照分層授權']};
Object.assign(REQN,{eager:'自行出擊',pursue:'追擊',encircle:'迂迴合圍',catk:'以預備隊反擊',fill:'以預備隊填補防線'});
var AUTHR={eager:'atk',pursue:'pur',encircle:'enc',catk:'atk',fill:'def',withdraw:'wd'};
/* 層級：0 連以下、1 營、2 團旅、3 師以上 */
function authLv(u){var e=typeof dispEch==='function'?dispEch(u):u.ech||1;return e<=1?0:e===2?1:e<=4?2:3;}
function authExp(side,k,l){var S=G.sides[side],A=S&&S.auth;return A&&A[k]&&A[k][l]||'';}
function authGet(side,k,l,u){var v=authExp(side,k,l);if(v)return v;if(k==='wd')return 'own';if(k==='enc')return 'no';return u&&(G.set.iniP===true||aiControls(u))?'own':'no';}
function authSet(side,k,l,v,who){if(!G.sides[side]||!AUTHK.some(function(q){return q[0]===k;})||!(l>=0&&l<=3)||!AUTHV.some(function(q){return q[0]===v;}))return {err:'參數錯誤'};var S=SD(side),A=S.auth||(S.auth={}),R=A[k]||(A[k]=[]);var old=authGet(side,k,l,null);R[l]=v;
  if(G.started&&old!==v&&G.civ){var txt='授權：'+AUTHL[l][0]+'的「'+AUTHK.filter(function(q){return q[0]===k;})[0][1]+'」改為「'+AUTHV.filter(function(q){return q[0]===v;})[0][1]+'」';logE(side,'auth',txt);decLog(side,who||'指揮部',txt);}return {ok:1};}
function authPreset(side,p,who){var T={mission:function(){return 'own';},std:function(k,l){return k==='wd'?'own':k==='enc'?(l>=2?'own':'ask'):k==='def'?'own':l<=1?'ask':'own';},central:function(k,l){return l>=3?'own':'ask';},hold:function(k,l){return k==='wd'?'no':k==='enc'?(l>=2?'own':'ask'):k==='def'?'own':l<=1?'ask':'own';}}[p];
  if(!T||!G.sides[side])return {err:'參數錯誤'};var S=SD(side);S.auth={};AUTHK.forEach(function(q){S.auth[q[0]]=[0,1,2,3].map(function(l){return T(q[0],l);});});if(G.started&&G.civ){var txt='授權：全軍改為「'+AUTHP[p][0]+'」';logE(side,'auth',txt);decLog(side,who||'指揮部',txt);}return {ok:1};}
if(typeof MPFN!=='undefined'){MPFN.authSet=[MPSIDE(0),function(a){return authSet(a[0],String(a[1]),+a[2],String(a[3]),'玩家');}];MPFN.authPreset=[MPSIDE(0),function(a){return authPreset(a[0],String(a[1]),'玩家');}];}
function authStat(side,k,w){var S=G.authS||(G.authS={}),T=S[side]||(S[side]={own:0,ask:0,ok:0,deny:0,miss:0});T[w]=(T[w]||0)+1;}
/* 能作主的上級：沿指揮鏈往上，第一個這一格不必請示的；都要請示就到最上層 */
function authDecider(u,k){var p=u.p>=0?uById(u.p):null,last=null;while(p&&alive(p)){last=p;if(authGet(p.side,k,authLv(p),p)!=='ask')return p;p=p.p>=0?uById(p.p):null;}return last;}
/* 能不能自行這樣做（決定要不要評估機會） */
authMay=function(u,k){return authGet(u.side,k,authLv(u),u)!=='no';};
/* 行動前：自行判斷就做；須請示就送出請求（等回覆時不重複送）；不得自行就不做 */
authGo=function(u,k,d){var v=authGet(u.side,k,authLv(u),u);if(v==='own'){authStat(u.side,k,'own');return true;}if(v==='no')return false;
  if(u.authQ&&G.t-u.authQ.t<1800)return false;var D=authDecider(u,k);if(!D){authStat(u.side,k,'own');return true;}
  var rk=k==='pur'?'pursue':k==='atk'?(isLeaf(u)?'eager':'catk'):k==='enc'?'encircle':k==='def'?'fill':'withdraw';u.authQ=Object.assign({k:k,rk:rk,t:G.t,to:D.id},d||{});u.authC=(u.authC||0)+1;
  reqSend(u,D,rk,{x:d&&d.x,y:d&&d.y,auto:1});authStat(u.side,k,'ask');return false;};
/* 已知敵軍兵力（上級的情報圖，含誤判的接觸） */
function authEnemy(side,x,y,R){var C=G.ct[side]||{},n=0;for(var id in C){var c=C[id];if(c.dead||G.t-c.t>1800||c.dom==='air')continue;if(dist(c.x,c.y,x,y)<=R)n+=(c.men||0)+(c.veh||0)*8;}return n;}
/* 上級決定：依自己看到的敵情。目標附近敵軍太強可能是圈套 */
function authDecide(F,R,m){var rk=m.rk,Q=R.authQ;if(!Q||Q.rk!==rk||G.t-Q.t>3600)return [false,'情況已經改變'];var off=F.off,k=Q.k;
  if(rk==='eager'||rk==='pursue'){var c=G.ct[F.side]&&G.ct[F.side][Q.tid];if(!c||c.dead||G.t-c.t>900){authStat(R.side,k,'miss');Q.no=1;return [false,'目標已經不見了，錯失先機'];}
    var en=authEnemy(F.side,c.x,c.y,3000)-((c.men||0)+(c.veh||0)*8),own=R.men+R.veh*8,lim=hasQ(off,'reckless')?3:hasQ(off,'careful')?0.8:1.5;if(en>own*lim){authStat(R.side,k,'deny');Q.no=1;return [false,'目標後面還有敵軍，可能是圈套'];}
    Q.ok=1;return [true,rk==='pursue'?'准許追擊':'准許出擊'];}
  if(rk==='catk'||rk==='fill'){var rs=uById(Q.rs);if(!rs||!alive(rs)||rs.ms!=='ok'){authStat(R.side,k,'miss');Q.no=1;return [false,'預備隊已經不能用了'];}Q.ok=1;return [true,rk==='fill'?'准許填補防線':'准許反擊'];}
  if(rk==='encircle'){var sp=uById(Q.sid);if(!sp||!alive(sp)||sp.ms!=='ok'){authStat(R.side,k,'miss');Q.no=1;return [false,'迂迴部隊已經不能用了'];}var e2=authEnemy(F.side,Q.x,Q.y,2500);if(e2>(sp.men+sp.veh*8)*1.2){authStat(R.side,k,'deny');Q.no=1;return [false,'迂迴路線上敵軍太多'];}Q.ok=1;return [true,'准許迂迴'];}
  return [false,'無法判斷'];}
(function(){var b=reqDecide;reqDecide=function(F,R,m){if(AUTHR[m.rk]&&m.rk!=='withdraw'&&R&&R.authQ)return authDecide(F,R,m);return b.apply(this,arguments);};})();
/* 回覆送到：准許就照當時的情況行動（機會可能已經過去）；駁回就算了 */
function authExec(R,Q){var rk=Q.rk,k=Q.k;
  if(rk==='eager'||rk==='pursue'){var c=G.ct[R.side]&&G.ct[R.side][Q.tid],T=uById(Q.tid);if(!c||!T||!alive(T)||G.t-c.t>900||dist(R.x,R.y,c.x,c.y)>(Q.R||2500)*1.6||rk==='pursue'&&T.ms!=='rout'&&T.ms!=='shaken'){authStat(R.side,k,'miss');R.authM=(R.authM||0)+1;logE(R.side,'auth',uName(R)+'：等到准許，'+(rk==='pursue'?'敵軍已經跑遠了':'機會已經過去')+'（錯失先機）',R.x,R.y,R.id);return;}
    var o=R.ord,prev=o&&o.st!=='done'?{k:o.k,x:o.x,y:o.y,face:o.face,opt:o.opt,dk:o.dk,pts:o.pts}:null;R.eagerT=G.t;activate(R,newOrder('attack',{x:c.x,y:c.y,x0:R.x,y0:R.y,opt:{tac:'raid',tol:25,pace:'rush',eager:1},dk:'eager',prev:prev}));
    logE(R.side,'eager',uName(R)+'奉准'+(rk==='pursue'?'追擊潰逃的敵軍':'出擊')+'（'+placeTxt(c.x,c.y)+'）',R.x,R.y,R.id);authStat(R.side,k,'ok');return;}
  if(rk==='catk'||rk==='fill'){var rs=uById(Q.rs);if(!rs||!alive(rs)||rs.ms!=='ok'||rs.pend&&rs.pend.length){authStat(R.side,k,'miss');R.authM=(R.authM||0)+1;logE(R.side,'auth',uName(R)+'：等到准許，預備隊已經不能用了（錯失先機）',R.x,R.y,R.id);return;}
    sendOrder(R,rs,rk==='fill'?newOrder('defend',{x:Q.hx,y:Q.hy,sub:1}):newOrder('attack',{x:Q.x,y:Q.y,sub:1}),false);logE(R.side,'ini',uName(R)+'奉准派'+uName(rs)+(rk==='fill'?'填補防線':'反擊'),Q.x,Q.y,R.id);authStat(R.side,k,'ok');return;}
  if(rk==='encircle'){var sp=uById(Q.sid);if(!sp||!alive(sp)||sp.ms!=='ok'||sp.pend&&sp.pend.length){authStat(R.side,k,'miss');R.authM=(R.authM||0)+1;logE(R.side,'auth',uName(R)+'：等到准許，迂迴部隊已經不能用了（錯失先機）',R.x,R.y,R.id);return;}
    sendOrder(R,sp,newOrder('attack',{x:Q.x,y:Q.y,sub:1,opt:{tac:'flank',tol:35,pace:'normal'},dk:'encircle'}),false);logE(R.side,'ini',uName(R)+'奉准派'+uName(sp)+'迂迴到敵軍側後（'+placeTxt(Q.x,Q.y)+'）',Q.x,Q.y,R.id);authStat(R.side,k,'ok');}}
(function(){var b=reqDeliver;reqDeliver=function(m){if(m&&m.k==='rep'){var R=uById(m.to),Q=R&&R.authQ;if(Q&&Q.to===m.from){R.authQ=null;if(m.ok&&Q.rk!=='withdraw'&&alive(R))try{authExec(R,Q);}catch(e){}else if(!m.ok&&Q.rk!=='withdraw'){if(!Q.no)authStat(R.side,Q.k,'deny');}}}return b.apply(this,arguments);};})();
/* ---------- 迂迴合圍：團旅以上的指揮官派閒置的預備隊繞到交戰中敵軍的側後 ---------- */
function encStep(){G.units.forEach(function(F){if(isLeaf(F)||!alive(F)||F.hqLost||F.st==='off'||!G.sides[F.side])return;var v=authGet(F.side,'enc',authLv(F),F);if(v==='no')return;
  if(G.t-(F.encT||-1e9)<2*3600||F.authQ&&G.t-F.authQ.t<1800)return;var off=F.off;if(off&&rnd()>0.3+(off.ini||5)/20)return;
  var K=kidsOf(F).filter(function(x){return onMap(x)&&alive(x);}),eng=K.filter(function(x){return G.t-(x.uf||-1e9)<900&&x.ms!=='rout';});if(!eng.length||K.length<3)return;
  var sp=K.filter(function(x){return x.ms==='ok'&&x.mor>=60&&roleOf(x)==='man'&&!(G.t-(x.uf||-1e9)<1800)&&(!x.ord||/^(reserve|halt|defend)$/.test(x.ord.k))&&!(x.pend&&x.pend.length);})[0];if(!sp)return;
  var oc=centroid(eng),ec=enemyCentroid(F.side,oc[0],oc[1],3000);if(!ec)return;var a=Math.atan2(ec[1]-oc[1],ec[0]-oc[0]),sg=hstr('enc|'+F.id+'|'+Math.floor(G.t/3600))%2?1:-1,b=a+sg*PI/3,p=validPos(ST(sp),ec[0]+Math.cos(b)*1500,ec[1]+Math.sin(b)*1500);
  if(authEnemy(F.side,p[0],p[1],1500)>(sp.men+sp.veh*8)*1.2)return;F.encT=G.t;if(!authGo(F,'enc',{x:p[0],y:p[1],sid:sp.id}))return;
  sendOrder(F,sp,newOrder('attack',{x:p[0],y:p[1],sub:1,opt:{tac:'flank',tol:35,pace:'normal'},dk:'encircle'}),false);logE(F.side,'ini',uName(F)+(off?'（'+off.rank+off.name+'）':'')+'主動派'+uName(sp)+'迂迴到敵軍側後（'+placeTxt(p[0],p[1])+'）',p[0],p[1],F.id);});}
(function(){var b=v8Step;v8Step=function(){b.apply(this,arguments);if(!G||!G.started||G.over)return;if(G.step%20===11)encStep();};})();
if(typeof GKEYS!=='undefined')GKEYS.push('authS');
