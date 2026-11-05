/* ===================== 交戰守則（ROE）與誤判平民 =====================
   一、交戰守則（每一方）：開火原則（主動開火／辨識後開火／僅還擊）、間接火力與空中攻擊的目標（只打已辨識的／也打疑似的）、
       人口密集區（須確認敵軍據守／不限制／禁止砲擊）、化生放武器（禁止／僅限報復／授權）、核武（禁止／僅限報復／戰術核武／全面授權）。
       命令裡的交戰規則可以覆寫開火原則；預設「辨識後開火」：確認是敵軍才開火，遭到射擊時立即還擊。
   二、辨識：看得到不等於認得出。辨識距離依年代的光學器材、晝夜與夜視、天氣與偵察兵種而定；超過辨識距離的目標要觀察一段時間，
       或由友軍回報確認，或對方開火暴露了身分。
   三、誤判平民：前線附近的難民隊伍與村落裡的人影，在辨識距離外可能被當成敵軍，成為情報圖上的假接觸（看起來和真的敵軍一樣）。
       恐懼、疲憊、訓練不足、夜間與壞天氣、剛遭射擊、人群朝陣地走來、嚴酷的平民政策都提高誤判；主動開火的部隊對任何不明人影開火；
       辨識後開火的部隊在夜間先喊話、鳴槍示警。直射、砲擊或空襲落在平民身上，傷亡記為「誤擊平民」；部隊靠近或找到屍體後才知道真相：
       事件紀錄、士氣與羞愧、戰地報導；未經辨識就開火（主動開火）造成的誤擊記為無差別攻擊。 ===================== */
var ROEW=[['free','主動開火','發現疑似敵軍就開火：反應最快，但最容易誤擊平民與友軍'],['pid','辨識後開火','確認是敵軍才開火，遭到射擊時立即還擊；夜間先喊話、鳴槍示警（預設）'],['ret','僅還擊','只對向我方開火的目標射擊：最不容易誤擊，但會失去先機']];
var ROEI=[['obs','只攻擊觀測到的目標','砲兵與飛機只打部隊親眼看到的敵軍；只有居民通報、沒人看到的不打（預設）'],['sus','也攻擊情報與舊位置','居民通報的敵情、半小時內的舊位置也可以射擊：火力反應快，打錯的風險高']];
var ROEP=[['lim','須確認敵軍據守','聚落裡只有部隊親眼確認的敵軍才可以砲擊轟炸（預設）'],['any','不限制','照常射擊，平民傷亡依平民政策'],['no','禁止砲擊','任何情況都不對有居民的聚落實施砲擊']];
var ROENK=[['no','禁止','不得使用核武'],['retal','僅限報復','敵方先使用核武後才可以還擊'],['tac','授權戰術核武','可以先使用戰術核武；戰略核武僅限報復'],['all','全面授權','戰術與戰略核武都可以先使用']];
var ROECB=[['no','禁止','不得使用化學與生物武器'],['retal','僅限報復','敵方先使用後才可以還擊'],['yes','授權','可以使用']];
var ROEK={w:['開火原則',ROEW],ind:['間接火力與空中攻擊',ROEI],pop:['人口密集區',ROEP],cb:['化生放武器',ROECB],nk:['核武',ROENK]};
CIVK.misid='誤擊（誤判為敵軍）';CIVK.indisc='無差別攻擊';KINDN.roe='交戰守則';KINDN.misid='誤擊平民';if(typeof APDEF!=='undefined')APDEF.misid=true;
/* ---------- 一、交戰守則 ---------- */
function roeHarsh(side){var S=G.sides[side];if(!S||!S.pol)return 1;var v=+S.pol.civ;return v>=0?v:1;}
function nkAvail(){var N=G.set.nuke;return !!(N&&N.on)||(typeof snkOn==='function'&&snkOn());}
/* 沒有特別設定時：玩家可以使用本場配備的核武（和過去一樣），電腦依設定中「電腦會使用」的選項 */
function nkDef(side){if(!nkAvail())return 'no';var S=G.sides[side]||{};if(!S.ai)return 'all';var N=G.set.nuke||{},SN=G.set.snuke||{},so=typeof snkOn==='function'&&snkOn();return SN.ai>=2&&so?'all':N.ai&&N.on?'tac':SN.ai&&so?'retal':'no';}
/* 預設：玩家「辨識後開火、只打已辨識的目標、聚落須確認敵軍」；電腦依平民政策，報復性鎮壓以上主動開火 */
function roeDef(side,k){var S=G.sides[side];if(!S)return k==='w'?'pid':k==='ind'?'obs':k==='pop'?'lim':'no';var h=S.ai?roeHarsh(side):0;
  if(k==='w')return h>=4?'free':'pid';if(k==='ind')return h>=3?'sus':'obs';if(k==='pop')return h>=4?'any':'lim';if(k==='nk')return nkDef(side);if(k==='cb')return polSide(side).cbrn||'no';return '';}
function roeGet(side,k){var S=G.sides[side];if(!S)return roeDef(side,k);if(k==='cb')return polSide(side).cbrn||'no';var R=S.roe;return R&&R[k]?R[k]:roeDef(side,k);}
function roeRow(k,v){var T=ROEK[k];return T?T[1].filter(function(q){return q[0]===v;})[0]||null:null;}
function roeTxt(side,k){var r=roeRow(k,roeGet(side,k));return r?r[1]:'';}
/* 設定一項守則；開戰後的變更記入日誌與決策紀錄（戰後追究責任時查得到是誰授權的） */
function roeSet(side,k,v,who){var T=ROEK[k];if(!T||!G.sides[side])return {err:'參數錯誤'};var row=roeRow(k,v);if(!row)return {err:'參數錯誤'};var old=roeGet(side,k);
  if(k==='cb')polSide(side).cbrn=v;else{var S=SD(side);(S.roe||(S.roe={}))[k]=v;}if(old===v)return {ok:1};
  if(G.started){var txt='交戰守則：'+T[0]+'改為「'+row[1]+'」';logE(side,'roe',txt);if(G.civ)decLog(side,who||'指揮部',txt);
    if(k==='nk'&&v!=='no')logE(side,'roe','☢ '+(v==='retal'?'最高當局授權：遭到核攻擊後可以核武報復':'最高當局授權使用'+(v==='all'?'戰術與戰略':'戰術')+'核武'));
    if(k==='cb'&&v!=='no')logE(side,'roe','☣ '+(v==='retal'?'授權在敵方使用化生放武器後報復':'授權使用化學與生物武器'));}
  return {ok:1};}
if(typeof MPFN!=='undefined')MPFN.roeSet=[MPSIDE(0),function(a){return roeSet(a[0],String(a[1]),String(a[2]),'玩家');}];
/* 部隊實際採用的開火原則：命令裡的交戰規則優先；「依交戰守則」時採用本方的開火原則 */
roeOf=function(u,op){op=op||optOf(u);var r=op.roe;if(r&&r!=='side')return r;if(op.post==='hide')return 'hold';var w=u.side>=0&&G.sides[u.side]?roeGet(u.side,'w'):'free';return w==='ret'?'return':w;};
/* ---------- 二、辨識 ---------- */
/* 辨識距離：車輛的外形比步兵好認；年代的光學器材、夜視、天氣與偵察兵種 */
function roeIdR(u,s,ts){var y=uEra(u).y||1943,E=G.env,l=E.light,nv=s.nv||0,W=WX[E.wx],w=W?Math.max(0.25,W[2]):1,
    b=ts.dom==='air'?(y>=1950?30000:4000):(ts.dom==='sea'||ts.dom==='sub')?9000:ts.hard>=0.5?2200:900,opt=y<1900?0.6:y<1940?0.8:y<1980?1:1.3,lf=l>=0.6?1:l>=0.3?0.6:nv>=2?0.55:nv===1?0.35:0.15;
  return b*opt*lf*w*(s.fl.indexOf('r')>=0||s.br==='rec'?1.35:1);}
/* 辨識後開火：對方開火暴露身分、友軍已確認、近到認得出、或觀察夠久了 */
roeIdOk=function(u,t,ts,d){if(G.t-(t.fired||-1e9)<=180)return true;var C=G.ct[u.side],c=C&&C[t.id];if(c&&c.q>=1&&G.t-c.t<=600)return true;var s=ST(u),R=roeIdR(u,s,ts||ST(t));if(d<=R)return true;
  var m=u._idm||(u._idm={}),f=m[t.id];if(!f||G.t-f[1]>150){m[t.id]=[G.t,G.t];u._pidS=G.t;return false;}f[1]=G.t;if(G.t-f[0]>=clamp(45*(d/R)*(d/R)*70/Math.max(30,u.trn||60),30,900))return true;u._pidS=G.t;return false;};
/* 等待辨識的部隊（對話用）；清掉太舊的觀察紀錄 */
(function(){var b=fireStep;fireStep=function(){b.apply(this,arguments);fkFire();if(G.step%2)return;var pr=G.step%40===0;G.units.forEach(function(u){if(u._pidS===G.t&&u.fired!==G.t&&G.t-(u._pidT||-1e9)>900){u._pidT=G.t;u.pidC=(u.pidC||0)+1;}
    if(pr&&u._idm){for(var k in u._idm)if(G.t-u._idm[k][1]>600)delete u._idm[k];}});};})();
/* 主動開火的部隊誤擊友軍也多 */
(function(){var b=ffCrew;ffCrew=function(u){var r=roeOf(u);return b(u)*(r==='free'?1.6:r==='return'?0.6:r==='hold'?0.5:r==='close'?0.85:1);};})();
/* ---------- 間接火力與人口密集區 ---------- */
function roePop(x,y){if(!G.civ)return null;var g=civAt(x,y,0);return g&&civPresent(g)>=50?g:null;}
/* 依守則篩過的情報圖（砲兵自動選目標用）：只有居民通報、沒人親眼看到的敵情（觀測射擊時）不打；聚落裡要親眼確認或全部排除；
   也打舊位置時，半小時內的接觸當成剛回報的 */
function roeCtView(side){var ind=roeGet(side,'ind'),pop=roeGet(side,'pop'),K=G._roeCt||(G._roeCt={}),key=G.step+'|'+G.t+'|'+ind+pop,c0=K[side];if(c0&&c0.k===key)return c0.v;
  var C=G.ct[side]||{},o={},n=0,m=0;for(var id in C){var c=C[id],tip=!!c.civ&&!(c.q>=1);n++;if(ind==='obs'&&tip)continue;if(pop!=='any'&&roePop(c.x,c.y)){if(pop==='no'||tip)continue;}
    if(ind==='sus'&&!c.cb&&G.t-c.t>150&&G.t-c.t<1800){c=Object.assign({},c,{t:G.t-150});}o[id]=c;m++;}var v=m===n&&ind==='obs'?null:o;K[side]={k:key,v:v};return v;}
(function(){var b=supportTarget;supportTarget=function(u,s,o,IR){var V=roeCtView(u.side);if(!V)return b.apply(this,arguments);var C0=G.ct[u.side];G.ct[u.side]=V;try{return b.apply(this,arguments);}finally{G.ct[u.side]=C0;}};})();
/* 禁止砲擊人口密集區：射擊任務的目標落在有居民的聚落裡就停火 */
(function(){var b=artyFire;artyFire=function(u,s,M){if(M&&roeGet(u.side,'pop')==='no'){var g=roePop(M.x,M.y);if(g){if(!u._popL||G.t-u._popL>3600){u._popL=G.t;logE(u.side,'roe',uName(u)+'：目標在'+g.n+'（有居民的聚落），交戰守則禁止砲擊，停止射擊',M.x,M.y,u.id);}return;}}return b.apply(this,arguments);};})();
/* ---------- 核武授權 ---------- */
function nkFirst(i){var S=G.sides[i],t=S&&S.snkU||0;(G.nukes||[]).forEach(function(n){if(n.side===i&&(!t||n.t<t))t=n.t;});return t;}
/* kind：tac 戰術、str 戰略。僅限報復：敵方用過核武後才可以（戰略核武要敵方先用戰略核武或本方遭到戰略核打擊） */
function roeNkOk(side,kind){var v=roeGet(side,'nk');if(v==='all')return true;if(v==='no')return false;if(kind==='tac'&&v==='tac')return true;
  var en=G.sides.some(function(S,i){return i!==side&&nkFirst(i)>0;});if(!en)return false;if(kind==='tac')return true;return G.sides.some(function(S,i){return i!==side&&S.snkU;})||!!(G.snHit&&G.snHit[side]);}
(function(){var b=nukeOrder;nukeOrder=function(u,s,o){if(!roeNkOk(u.side,'tac')){logE(u.side,'nuke',uName(u)+'：未獲核武授權（交戰守則：'+roeTxt(u.side,'nk')+'），核打擊取消',u.x,u.y,u.id);o.st='done';u.task='hold';return true;}return b.apply(this,arguments);};})();
(function(){var b=snkLaunch;snkLaunch=function(side){if(!roeNkOk(side,'str')){logE(side,'nuke','未獲戰略核武授權（交戰守則：'+roeTxt(side,'nk')+'），發射取消');return null;}var r=b.apply(this,arguments);if(r){var S=G.sides[side];if(S&&!S.snkU)S.snkU=G.t;}return r;};})();
/* 電腦：交戰守則決定可不可以用，設定中的選項只決定預設的守則 */
(function(){var b=aiNuke;aiNuke=function(side){var N=G.set.nuke;if(!N||!N.on||!roeNkOk(side,'tac'))return;var a0=N.ai;N.ai=true;try{return b.apply(this,arguments);}finally{N.ai=a0;}};})();
(function(){var b=snkAI;snkAI=function(side){var N=G.set.snuke;if(!N||!N.on)return;var v=roeGet(side,'nk');if(v==='no')return;var a0=N.ai;N.ai=v==='all'?2:1;try{return b.apply(this,arguments);}finally{N.ai=a0;}};})();
/* ---------- 三、誤判平民 ---------- */
var FKB=9e8,FKV=6,FKC={t:-1,R:{}},FKU=null;
function fkOn(){return G.set.misid!==false&&!!G.civ&&G.set.civ!==false;}
function fkL(){return G.fk||(G.fk=[]);}
function misL(){return G.mis||(G.mis=[]);}
/* 假接觸對應的難民隊伍或聚落 */
function fkSrc(P){var C=G.civ;if(!C)return null;if(P.k==='S')return C.S[P.sid]||null;if(FKC.t!==G.t){FKC.t=G.t;FKC.R={};C.R.forEach(function(Q){FKC.R[Q.id]=Q;});}return FKC.R[P.sid]||null;}
function fkFind(s,k,sid){var L=G.fk;if(!L)return null;for(var i=0;i<L.length;i++){var P=L[i];if(P.side===s&&P.k===k&&P.sid===sid&&!P.done)return P;}return null;}
function fkNear(s,x,y,R){var L=G.fk;if(!L)return null;for(var i=0;i<L.length;i++){var P=L[i];if(P.side===s&&!P.done&&dist(P.x,P.y,x,y)<=R)return P;}return null;}
/* 民眾的辨識距離：分辨是不是軍人比發現人影難得多；飛機上更難 */
function fkIdR(o,so){var y=uEra(o).y||1943,E=G.env,l=E.light,nv=so.nv||0,W=WX[E.wx],w=W?Math.max(0.25,W[2]):1,
    b=(y<1900?500:y<1940?650:y<1980?800:1100)*(so.fl.indexOf('r')>=0||so.br==='rec'?1.4:1),lf=l>=0.6?1:l>=0.3?0.65:nv>=2?0.45:nv===1?0.3:0.15;
  if(so.dom==='air')b*=so.br==='heli'?0.8:y>=2000?0.7:0.35;return b*lf*w;}
/* 前線附近：本方已知敵軍（不含假接觸）在 R 之內 */
function fkFront(B,x,y,R){var kx=Math.floor(x/3000)+5000,ky=Math.floor(y/3000)+5000,n=Math.ceil(R/3000);for(var i=-n;i<=n;i++)for(var j=-n;j<=n;j++){var L=B.get((kx+i)*20000+ky+j);if(!L)continue;for(var q=0;q<L.length;q++){var c=L[q];if(c.id<FKB&&dist(c.x,c.y,x,y)<=R)return true;}}return false;}
/* 最近而且看得到的觀察者 */
function fkObs(s,x,y,n,k){var cand=[];gridNearS(x,y,7000,s,function(o){if(!onMap(o)||!isLeaf(o)||o.ms==='rout')return;var so=ST(o),air=so.dom==='air';if(air&&o.st!=='air'||so.dom==='sub')return;var R0=spotOf(o,so);if(!(R0>0))return;
    var Rd=R0*visMul(so.nv||0,air)*(k==='S'?1:clamp(0.3+n/1200,0.3,1.1))*(air?0.8:1),d=dist(o.x,o.y,x,y);if(d<=Rd)cand.push([d,o,so]);});
  if(!cand.length)return null;cand.sort(function(a,b){return a[0]-b[0];});for(var i=0;i<cand.length&&i<3;i++){var q=cand[i],o=q[1],so=q[2];if(so.dom!=='air'&&q[0]>G.map.cs*2&&!los(o.x,o.y,hgtOf(o),x,y,2))continue;return {o:o,so:so,d:q[0],R:fkIdR(o,so)*(k==='S'?1.2:1)};}return null;}
/* 誤判的原因（事件紀錄用） */
function fkWhy(o){var so=ST(o),E=G.env,W=WX[E.wx],r=[];if(E.light<0.3)r.push('夜間');else if(E.light<0.6)r.push('天色昏暗');if(W&&W[2]<0.5)r.push(W[1]);if(so.dom==='air')r.push('從空中難以分辨');if(G.t-(o.uf||-1e9)<1800)r.push('剛遭到射擊');
  if((o.fear||0)>=40)r.push('部隊驚恐');if((o.exh||0)>=60)r.push('極度疲憊');if((o.trn||60)<50)r.push('訓練不足');if(roeOf(o)==='free')r.push('主動開火的交戰守則');if(roeHarsh(o.side)>=4)r.push('嚴酷的平民政策');return r;}
/* 誤判的機率（每小時）：恐懼、疲憊、訓練、光線、天氣、剛遭射擊、交戰守則、平民政策、空中觀察、人群朝陣地走來、先前已經認出是難民 */
function fkHaz(s,o,Q,k){var so=ST(o),E=G.env,l=E.light,W=WX[E.wx],r=roeOf(o),h=roeHarsh(s),
    m=(k==='S'?0.012:0.04)*(r==='free'?2.5:r==='pid'?1:r==='close'?0.9:0.6)*(1+(o.fear||0)/50)*(1+Math.max(0,(o.exh||0)-30)/100)*clamp(1.7-(o.trn||60)/100,0.7,1.4)
      *(l>=0.6?1:l>=0.3?1.3:(so.nv||0)>=1?1.4:1.8)*(W&&W[2]<0.5?1.4:1)*(G.t-(o.uf||-1e9)<1800?2:1)*(h>=4?1.6:h<=0?0.8:1)*(so.dom==='air'?(so.br==='heli'?1.3:2):1);
  if(k==='R'){var P=Q.path;if(P&&Q.pi+1<P.length){var hd=Math.atan2(P[Q.pi+1]-Q.y,P[Q.pi]-Q.x),a=Math.atan2(o.y-Q.y,o.x-Q.x);if(Math.abs(angDiff(hd,a))<PI/6)m*=1.5;}if(Q.ids&&Q.ids[s]&&G.t-Q.ids[s]<3*3600)m*=0.2;}
  return m;}
function fkNew(s,k,sid,x,y,n,o){var P={id:FKB+(G.fkSeq=(G.fkSeq||0)+1),side:s,k:k,sid:sid,x:x,y:y,t0:G.t,t:G.t,by:o.id,st:'sus',n:Math.round(n),dead:0,wnd:0,sh:{}};fkL().push(P);return P;}
/* 假接觸放進情報圖：和真的敵軍接觸一樣（步兵、約略人數） */
function fkCt(P){var C=G.ct[P.side];if(!C)return;if(P.st!=='mis'){delete C[P.id];return;}var men=clamp(Math.round(P.n*0.5/10)*10,30,600);
  C[P.id]={id:P.id,x:P.x,y:P.y,t:P.t,q:1,side:enemyOf(P.side),ech:men>=300?2:men>=80?1:0,dom:'land',br:'inf',sym:'inf',men:men,veh:0,name:'',ms:'ok',by:P.by};}
function fkMis(P,o,src){P.st='mis';P.mT=G.t;P.why=fkWhy(o);P.by=o.id;fkCt(P);var men=G.ct[P.side][P.id].men;
  logE(P.side,'contact',uName(o)+'回報：'+(P.k==='S'?'敵軍據守'+(src&&src.n?src.n:placeTxt(P.x,P.y))+'（約 '+fmt(men)+' 人）':'在'+placeTxt(P.x,P.y)+'發現一支敵軍步兵縱隊（約 '+fmt(men)+' 人）'),P.x,P.y,o.id);}
/* 撤掉假接觸；有人傷亡的就是一起誤擊事件 */
function fkClear(P,o,how){if(P.done)return;P.done=1;var C=G.ct[P.side];if(C)delete C[P.id];if(P.dead>0&&!P.rz){fkRealize(P,o,how);return;}
  if(P.st==='mis'&&o)logE(P.side,'contact',uName(o)+(P.k==='S'?'進一步查看：'+(fkSrc(P)?fkSrc(P).n:placeTxt(P.x,P.y))+'裡只有居民，沒有敵軍':'靠近查看：'+placeTxt(P.x,P.y)+'的「敵軍」其實是逃難的平民'),P.x,P.y,o.id);}
/* 每 2 分鐘：各方觀察前線附近的難民隊伍與村落 */
function fkStep(){if(!fkOn()||!G.started)return;var C=G.civ;FKC.t=-1;
  SIDES().forEach(function(s){if(!G.sides[s])return;var B=ctGridH(s);
    C.R.forEach(function(Q){if(Q.n<8||!(Q.st==='go'||Q.st==='stop'||Q.st==='trap'))return;fkLookR(s,B,Q);});
    C.S.forEach(function(g,i){if(civPresent(g)<30)return;fkLookS(s,B,g,i);});});
  fkUpkeep();}
function fkSeen(Q,s){var I=Q.ids||(Q.ids={});I[s]=G.t;}
function fkLookR(s,B,Q){var P=fkFind(s,'R',Q.id),front=fkFront(B,Q.x,Q.y,5000);if(!front){fkSeen(Q,s);if(P&&!(P.dead>0))fkClear(P,null,'');return;}
  var ob=fkObs(s,Q.x,Q.y,Q.n,'R');if(!ob)return;var o=ob.o;
  if(ob.d<=ob.R){fkSeen(Q,s);if(P)fkClear(P,o,'近距離');return;}
  if(!P)P=fkNew(s,'R',Q.id,Q.x,Q.y,Q.n,o);P.x=Q.x;P.y=Q.y;P.t=G.t;P.n=Math.round(Q.n);
  /* 辨識後開火：夜裡人群走近陣地，先喊話、鳴槍示警；驚恐的部隊可能直接開火 */
  var r=roeOf(o);if(P.st!=='mis'&&r==='pid'&&ob.d<600&&G.env.light<0.6&&ST(o).dom==='land'){var pf=0.05+0.25*clamp(((o.fear||0)-30)/70,0,1)+(G.t-(o.uf||-1e9)<1800?0.1:0);
    if(rnd()<pf)fkMis(P,o,Q);else{o.wsC=(o.wsC||0)+1;fkSeen(Q,s);fkClear(P,o,'示警');if(Q.st==='go'){Q.st='stop';Q.stopT=G.t;}if(!o._wsL||G.t-o._wsL>3600){o._wsL=G.t;logE(s,'contact',uName(o)+'喊話並鳴槍示警，攔下一群接近陣地的人——是逃難的平民（'+placeTxt(Q.x,Q.y)+'）',Q.x,Q.y,o.id);}return;}}
  if(P.st!=='mis'&&rnd()<1-Math.exp(-fkHaz(s,o,Q,'R')*120/3600))fkMis(P,o,Q);else if(P.st==='mis')P.by=o.id;fkCt(P);}
function fkLookS(s,B,g,i){var P=fkFind(s,'S',i);if(!fkFront(B,g.x,g.y,4000)){return;}
  if(enemyNear(s,g.x,g.y,g.r+300)>0){if(P&&!(P.dead>0))fkClear(P,null,'');return;}/* 敵軍真的在裡面：情報沒錯 */
  var ob=fkObs(s,g.x,g.y,civPresent(g),'S');if(!ob)return;var o=ob.o;if(ob.d<=ob.R||ob.d<=g.r){if(P)fkClear(P,o,'進入');return;}
  if(P){P.t=G.t;fkCt(P);return;}if(rnd()<1-Math.exp(-fkHaz(s,o,g,'S')*120/3600)){var a=hstr('fk|'+i)%628/100,rr=(g.r||200)*0.4;P=fkNew(s,'S',i,g.x+Math.cos(a)*rr,g.y+Math.sin(a)*rr,civPresent(g)*0.3,o);fkMis(P,o,g);}}
/* 有人傷亡的假接觸：本方部隊靠近時發現真相；隊伍走散或太久沒人看到時留下屍體 */
function fkUpkeep(){var L=fkL(),keep=[];L.forEach(function(P){if(P.done)return;var src=fkSrc(P),gone=!src||(P.k==='R'?src.n<1||!(src.st==='go'||src.st==='stop'||src.st==='trap'):civPresent(src)<10);
    if(P.dead>0&&!P.rz){var o=fkNearOwn(P);if(o){fkClear(P,o,'近距離');return;}}
    if(gone||G.t-P.t>3*3600){P.done=1;var C=G.ct[P.side];if(C)delete C[P.id];if(P.dead>0&&!P.rz)fkEvid(P,false);return;}keep.push(P);});G.fk=keep;}
function fkNearOwn(P){var E=G.env,l=E.light,W=WX[E.wx],Rr=(l>=0.6?1200:l>=0.3?700:350)*(W?Math.max(0.4,W[2]):1),x=P.hx!==undefined?P.hx:P.x,y=P.hy!==undefined?P.hy:P.y,best=null;
  gridNearS(x,y,Rr,P.side,function(u){if(best||!onMap(u)||!isLeaf(u)||ST(u).dom==='air')return;if(dist(u.x,u.y,x,y)<=Rr)best=u;});return best&&rnd()<0.5?best:null;}
/* ---------- 開火：直射、砲擊、空襲 ---------- */
/* 直射：主動開火的部隊打不明人影，其他部隊打「認定是敵軍」的假接觸；自己得看得到，近到認得出就不打 */
function fkFire(){var L=G.fk;if(!L||!L.length||!fkOn())return;L.forEach(function(P){if(P.done||G.t-P.t>600)return;var src=fkSrc(P);if(!src)return;
  gridNearS(P.x,P.y,3500,P.side,function(u){if(u.fired===G.t||!onMap(u)||!isLeaf(u)||u.ms==='rout'||!(u.ammo>0))return;var s=ST(u);if(s.dom!=='land'&&!(s.dom==='air'&&s.br==='heli'&&u.st==='air'))return;
    var r=roeOf(u);if(r==='hold'||r==='return')return;if(P.st!=='mis'&&r!=='free')return;if(u.mis&&G.t>=u.mis.start&&indOf(u,s)>0)return;var SA=saOf(u,s);if(!(SA>0))return;
    var rE=s.rE*rngF(u),rM=s.rM*rngF(u),d=dist(u.x,u.y,P.x,P.y);if(d>rM)return;if(r==='close'&&d>Math.max(150,rE*0.5))return;
    var Rd=spotOf(u,s)*visMul(s.nv||0,s.dom==='air')*(P.k==='S'?1:clamp(0.3+P.n/1200,0.3,1.1));if(d>Rd||d<=fkIdR(u,s)*(P.k==='S'?1.2:1))return;if(s.dom!=='air'&&d>G.map.cs*2&&!los(u.x,u.y,hgtOf(u),P.x,P.y,2))return;
    fkShoot(u,s,P,src,d,SA,rE,rM);});});}
function fkShoot(u,s,P,src,d,SA,rE,rM){var rf=rangeF(d,rE,rM);if(!(rf>0))return;var c=SA*strFrac(u)*rf*firerMod(u,s)*(DT/60)*FIRE_K*(0.7+0.6*rnd())*FKV,tot=0;
  if(P.k==='R'){if(src.st==='stop')c*=0.5;/* 趴在地上的人群比較難打中 */c=Math.min(c,src.n*0.15);if(c<0.05)return;refCas(src,c,0.45,'misid',u.side);tot=c;if(src.st==='go'){src.st='stop';src.stopT=G.t;}if(src.side===u.side)src.side=-1;}
  else{tot=civHit(src.x,src.y,Math.max(100,(src.r||200)*0.4),clamp(c/Math.max(50,civPresent(src))*3,0,0.05),'misid',u.side,0.45);if(!(tot>0))return;src.hitT=G.t;}
  u.fired=G.t;u.ammo=Math.max(0,u.ammo-0.25);fkHit(P,tot,0.45,u);
  if(typeof FX!=='undefined'&&FX.cap&&FX.ev.length<5000)FX.ev.push({k:'fire',a:u,b:null,x0:u.x,y0:u.y,x1:P.x,y1:P.y,m:c});
  if(!(P.sh[u.id]>0)||G.t-P.sh[u.id]>1800){P.sh[u.id]=G.t;logE(u.side,'fire',uName(u)+'向'+placeTxt(P.x,P.y)+'的'+(P.st==='mis'?'敵軍':'不明人影')+'開火',P.x,P.y,u.id);}}
function fkHit(P,tot,kf,u){if(!(tot>0))return;P.dead+=tot*kf;P.wnd+=tot*(1-kf);if(!P.hit0){P.hit0=G.t;P.hx=P.x;P.hy=P.y;P.st0=P.st;P.roe0=u?roeOf(u):'';P.u0=u?u.id:0;if(!P.why)P.why=u?fkWhy(u):[];}P.hit=G.t;if(u&&!(P.sh[u.id]>0))P.sh[u.id]=G.t;}
/* 砲擊與空襲：落點附近有本方的假接觸，平民傷亡就是誤擊 */
(function(){var b=civArt;civArt=function(u){FKU=u;try{return b.apply(this,arguments);}finally{FKU=null;}};})();
(function(){var b=civHitAir;civHitAir=function(a){FKU=a;try{return b.apply(this,arguments);}finally{FKU=null;}};})();
(function(){var b=civHit;civHit=function(x,y,R,lethal,cause,bySide,kf){if(!(bySide>=0)||cause!=='art'&&cause!=='air'||!G.fk||!G.fk.length)return b.apply(this,arguments);var P=fkNear(bySide,x,y,R+400);if(!P)return b.apply(this,arguments);
  var tot=b(x,y,R,lethal,'misid',bySide,kf);fkHit(P,tot,kf||0.35,FKU);return tot;};})();
/* ---------- 真相：事件、士氣、報導、證據 ---------- */
function fkRealize(P,o,how,ev){if(P.rz)return;P.rz=G.t;var s=P.side,src=fkSrc(P),u0=uById(P.u0)||o,dead=Math.round(P.dead),wnd=Math.round(P.wnd),x=P.hx!==undefined?P.hx:P.x,y=P.hy!==undefined?P.hy:P.y;if(!u0)return;
  var who=P.k==='R'?'逃難的平民'+(src&&src.fn?'（來自'+src.fn+'）':''):(src&&src.n?src.n+'的居民':'村民'),why=P.why&&P.why.length?'。原因：'+P.why.join('、'):'',
    txt='誤擊平民！'+uName(u0)+'向'+placeTxt(x,y)+'的'+(P.st0==='mis'?'「敵軍」':'不明人影')+'開火，'+(o&&o!==u0?uName(o)+'靠近後':'事後')+'發現是'+who+'——約 '+fmt(Math.max(1,dead))+' 人死亡、'+fmt(wnd)+' 人受傷'+why;
  var I={id:(G.misSeq=(G.misSeq||0)+1),t:P.hit0||G.t,tr:G.t,side:s,u:u0.id,un:uName(u0),x:x,y:y,dead:dead,wnd:wnd,k:P.k,who:who,roe:P.roe0||'',st:P.st0||P.st,why:P.why||[],how:how||'',kn:{},wc:0};I.kn[s]=G.t;misL().push(I);
  var crime=P.st0!=='mis'&&P.roe0==='free'||roeHarsh(s)>=4;
  if(crime&&typeof warCrime==='function'){var w=warCrime(u0,'indisc',dead,uName(u0)+'未經辨識就向'+placeTxt(x,y)+'的人群開火，造成約 '+fmt(Math.max(1,dead))+' 名平民死亡（'+who+'）',false);I.wc=1;if(w&&w.known)I.pub=1;var ev=civEv('crime',s,txt,x,y,u0.id,{wc:1,v:dead,dk:'indisc'});if(typeof pressOn==='function')pressOn(ev,u0);}
  else{civEv('misid',s,txt,x,y,u0.id,{v:dead});misPress(I);}
  /* 開火的部隊：士氣與羞愧；附近的友軍也聽說了 */
  Object.keys(P.sh||{}).forEach(function(id){var u=uById(+id);if(!u||!alive(u))return;var v=-Math.min(10,3+dead/8);u.mor=clamp(u.mor+v,0,100);mfAdd(u,MFN.shame?'shame':'cas',v);if(typeof fearAdd==='function')fearAdd(u,6,'atro');u.misC=(u.misC||0)+1;});
  if(o&&!(P.sh&&P.sh[o.id]))o.misC=(o.misC||0)+1;gridNearS(x,y,3000,s,function(u){if(!onMap(u)||!isLeaf(u)||P.sh&&P.sh[u.id])return;u.mor=clamp(u.mor-1,0,100);});
  if(ev)ev.mi=I.id;else fkEvid(P,true,I);if(G.onPause&&typeof apOn==='function'&&apOn('misid')&&s>=0&&s<=1)G.onPause('誤擊平民');}
/* 屍體留在原地：開火的一方知道（已發現真相時）或還不知道；被別人找到就成了證據 */
function fkEvid(P,known,I){if(typeof evdAdd!=='function')return;var n=Math.round(P.dead);if(n<1)return;var u0=uById(P.u0),e=evdAdd('bodies',P.hx!==undefined?P.hx:P.x,P.hy!==undefined?P.hy:P.y,{side:P.side,by:P.u0||0,byn:u0?uName(u0):'',vk:P.k==='R'?'ref':'civ',vs:-1,n:n,dk:'misid'});
  if(!e)return;if(I)e.mi=I.id;if(!known){delete e.found[P.side];e.mp={side:P.side,k:P.k,sid:P.sid,u0:P.u0,hit0:P.hit0,hx:P.hx,hy:P.hy,x:P.x,y:P.y,st0:P.st0,roe0:P.roe0,why:P.why,dead:P.dead,wnd:P.wnd,sh:P.sh};}}
(function(){var b=evdFound;evdFound=function(e,u){var r=b.apply(this,arguments);if(e&&u){if(e.mp&&u.side===e.mp.side&&!e.mp.rz)fkRealize(e.mp,u,'屍體',e);else if(e.mi)misL().forEach(function(I){if(I.id===e.mi&&!I.kn[u.side])I.kn[u.side]=G.t;});}return r;};})();
/* 報導：本方受管制的媒體可能淡化；中立與敵方的記者照實報導或渲染 */
function misPress(I){var P=G.press;if(!P||!P.R)return;P.R.forEach(function(R){if(R.st!=='ok'&&R.st!=='wia')return;if(dist(R.x,R.y,I.x,I.y)>(I.dead>=20?15000:6000)&&!(I.dead>=20&&rnd()<0.2))return;
    var own=R.side===I.side,pol=polSide(R.side>=0?R.side:R.host).press||'control',nm=G.sides[I.side]?G.sides[I.side].name:'';I.kn[R.side>=0?R.side:-1]=G.t;
    if(own&&pol!=='free'){if(rnd()<0.6)return;pressArt(R,'前線發生誤擊事件','軍方證實'+placeTxt(I.x,I.y)+'有平民在交戰中傷亡，表示將調查。','neutral',null,true);}
    else if(R.side>=0&&!own)pressArt(R,nm+'部隊屠殺逃難的平民','據報'+nm+'部隊在'+placeTxt(I.x,I.y)+'向'+I.who+'開火，至少 '+fmt(Math.max(1,I.dead))+' 人死亡。','pro',null,true);
    else pressArt(R,(own?'本國部隊':nm+'部隊')+'誤擊平民，'+fmt(Math.max(1,I.dead))+' 人死亡',I.who+'在'+placeTxt(I.x,I.y)+'被誤認為敵軍而遭到射擊。'+(I.why.length?'當時'+I.why.join('、')+'。':''),'critical',null,true);
    I.pub=1;});if(I.pub&&G.civ&&G.civ.rep)G.civ.rep[I.side]=clamp(G.civ.rep[I.side]-Math.min(10,2+I.dead/30),0,100);}
/* ---------- 每步、存檔、聯機、舊存檔 ---------- */
(function(){var b=v8Step;v8Step=function(){b.apply(this,arguments);if(!G||!G.started||G.over)return;if(G.step%4===3)fkStep();};})();
if(typeof GKEYS!=='undefined')GKEYS.push('fk','fkSeq','mis','misSeq','roeV');
if(typeof MPCOL!=='undefined'){MPCOL.push(['mis','id',function(s){return (G.mis||[]).filter(function(I){return s<0||I.side===s||I.kn&&I.kn[s];});}]);MPCC.mis=function(){return G.mis||(G.mis=[]);};MPKEY.mis='id';}
/* 交戰守則之前的存檔：命令裡的「自由射擊」是當時的預設值，改回依交戰守則 */
(function(){var b=gameLoad;gameLoad=async function(o){var r=await b.apply(this,arguments);try{if(o&&o.roeV===undefined&&G&&G.units){G.units.forEach(function(u){[u.ord].concat(u.pend||[]).forEach(function(q){if(q&&q.opt&&q.opt.roe==='free')q.opt.roe='side';});});}if(G)G.roeV=1;}catch(e){}return r;};})();
(function(){var b=newGame;newGame=function(){var g=b.apply(this,arguments);if(g)g.roeV=1;return g;};})();
