/* ===================== v11：多位指揮官（1v1、2v2、3v3）、依個性的防禦準則與攻擊方式、弱點研判與偵察、後勤經營風格、盟軍通信與聯合攻防 =====================
   每一方可以有一到八位指揮官，各自指揮分配給他的頂層編制，有自己的個性、防禦準則、攻擊方式、偵察習慣與後勤經營風格。
   同一方的指揮官共享情報圖，但彼此的通信要經過傳令、電話或無線電（有延遲）；通信越順暢、合作越久，「協同等級」越高，
   逐步從互相通報、協防接合部，升級到互相支援火力與預備隊，最後能以同一個發起時刻（H 時）實施聯合攻勢與聯合反擊。 */

/* ---------- 一、指揮官與指揮範圍 ---------- */
var CMN=['第一','第二','第三','第四','第五','第六','第七','第八'];var CMMAX=8;
function cmNew(i,player){return {n:CMN[i]+'指揮官',ai:!player,roots:[],ms:'auto',dd:'auto',oa:'auto',rs:'auto',mem:{}};}
/* 每一方的指揮官名冊（沒有就建立一位，指揮全部部隊） */
function cmList(side){var S=G.sides[side];if(!S.cm||!S.cm.length){S.cm=[cmNew(0,!S.ai)];S.cm[0].roots=G.units.filter(function(u){return u.side===side&&u.p<0;}).map(function(u){return u.id;});}else if(S.cm.length===1){S.cm[0].ai=!!S.ai;}return S.cm;}
function tmOn(side){var S=G&&G.sides&&G.sides[side];return !!(S&&S.cm&&S.cm.length>1);}
function rootOf(u){var c=u,n=0;while(c&&c.p>=0&&n<24){var p=uById(c.p);if(!p)break;c=p;n++;}return c;}
var CMM={k:'',m:{}};
/* 單位屬於哪一位指揮官（依所在的頂層編制） */
/* 名冊裡可以有頂層編制，也可以有被移交（作戰管制）的下級編制；由單位往上找，最近的一筆決定歸屬 */
function cmOf(u){if(!u||!tmOn(u.side))return 0;var k=G.step+'|'+G.units.length+'|'+(G._cmv||0);if(CMM.k!==k){CMM.k=k;CMM.m={};CMM.o=sAO();SIDES().forEach(function(sd){var Q=G.sides[sd]&&G.sides[sd].cm;if(Q)Q.forEach(function(R,j){R.roots.forEach(function(id){if(CMM.o[sd][id]===undefined)CMM.o[sd][id]=j;});});});}
  var v=CMM.m[u.id];if(v!==undefined)return v;var O=CMM.o[u.side]||{},c=u,n=0,i=0;while(c&&n<24){if(O[c.id]!==undefined){i=O[c.id];break;}if(c.p<0)break;c=uById(c.p);n++;}CMM.m[u.id]=i;return i;}
function cmRec(u){return u&&tmOn(u.side)?G.sides[u.side].cm[cmOf(u)]:null;}
function cmBump(){G._cmv=(G._cmv||0)+1;}
/* 指揮官的最高編制（個性取自它） */
function cmTop(side,i){var R=cmList(side)[i];if(!R)return null;var T=R.roots.map(uById).filter(function(u){return u&&u.st!=='dead';}),f=T.filter(function(u){return !isLeaf(u)&&!u.irr;}).sort(function(a,b){return (b.ech||0)-(a.ech||0);});return f[0]||T[0]||null;}
function cmAlive(side,i){var R=cmList(side)[i];return !!R&&R.roots.some(function(id){var u=uById(id);return u&&u.st!=='dead'&&leavesOf(u).some(function(l){return alive(l)&&cmOf(l)===i;});});}
function cmName(side,i){var R=cmList(side)[i],T=cmTop(side,i),o=T&&T.off;return R?R.n+(o?'（'+o.rank+o.name+'）':''):'';}
/* 指揮官的顏色：同一方以色相微調區分 */
function cmCol(side,i){var c=sideCol(side);if(!i)return c;var q=rgbOf(c),r=q[0]/255,g=q[1]/255,b=q[2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),h=0,l=(mx+mn)/2,d=mx-mn,s=d?d/(1-Math.abs(2*l-1)):0;
  if(d){h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;}var HOF=[0,30,-30,60,-60,15,-45,45];h=(h+HOF[i%8]+360)%360;l=clamp(l*[1,0.86,1.08,0.9,1.04,0.7,0.8,1.16][i%8],0.25,0.64);/* 色相只在本方色系 ±60° 內變化，避免第七、第八位指揮官的顏色接近敵方 */var C=(1-Math.abs(2*l-1))*s,X=C*(1-Math.abs((h/60)%2-1)),m=l-C/2,rr=0,gg=0,bb=0;
  if(h<60){rr=C;gg=X;}else if(h<120){rr=X;gg=C;}else if(h<180){gg=C;bb=X;}else if(h<240){gg=X;bb=C;}else if(h<300){rr=X;bb=C;}else{rr=C;bb=X;}return hexOf([Math.round((rr+m)*255),Math.round((gg+m)*255),Math.round((bb+m)*255)]);}
function cmColU(u){return u&&tmOn(u.side)?cmCol(u.side,cmOf(u)):undefined;}
/* 名冊與實際編制同步：移除消失的編制；新出現的頂層編制（增援或戰場上新建）交給玩家指揮官，否則給兵力最少的 AI 指揮官 */
function cmSync(side){var S=G.sides[side],L=cmList(side);if(L.length<2)return;var ids={},ch=false;
  L.forEach(function(R){var n0=R.roots.length;R.roots=R.roots.filter(function(id){var u=uById(id);if(!u||u.side!==side||ids[id]||u.p>=0&&u.st==='dead')return false;ids[id]=1;return true;});if(R.roots.length!==n0)ch=true;});
  cmShClean(side);G.units.forEach(function(u){if(u.side!==side||u.p>=0||ids[u.id])return;var pl=L.filter(function(R){return !R.ai;})[0],tg=pl||L.slice().sort(function(a,b){return cmM(side,L.indexOf(a))-cmM(side,L.indexOf(b));})[0];tg.roots.push(u.id);ids[u.id]=1;ch=true;});
  if(ch)cmBump();var ai=L.some(function(R){return R.ai;});if(S.ai!==ai)S.ai=ai;}
function cmM(side,i){var R=cmList(side)[i];if(!R)return 0;if(!tmOn(side))return sum(R.roots.map(uById).filter(Boolean),function(u){var s=strengthOf(u);return s.men+s.veh*8;});var m=0;G.units.forEach(function(u){if(u.side===side&&isLeaf(u)&&u.st!=='dead'&&cmOf(u)===i)m+=u.men+u.veh*8;});return m;}
function cmStr(side,i){var m=0,m0=0;G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||u.st==='off'||u.irr)return;var fl=ST(u).fl;if(fl.indexOf('u')>=0||fl.indexOf('G')>=0)return;if(cmOf(u)!==i)return;m+=u.st==='dead'?0:u.men+u.veh*8;m0+=u.men0+u.veh0*8;});return {m:m,m0:m0,f:m0?m/m0:0};}
function cmUnits(side,i,f){var tm=tmOn(side);return G.units.filter(function(u){return u.side===side&&isLeaf(u)&&onMap(u)&&ST(u).dom==='land'&&!u.irr&&u.st!=='lift'&&!u.amph&&(!tm||cmOf(u)===i)&&(!f||f(u));});}

/* ---------- 二、指揮範圍的隔離：AI 指揮官只指揮自己的部隊，個別的 AI 狀態不互相覆蓋 ---------- */
/* 執行某位指揮官的 AI 或下達某位指揮官部隊的命令時，G._cc＝{side,i,ai}；此時「本方頂層編制」「本方最高司令部」「本方兵力」都只算這位指揮官的 */
var PERCM={v10:1,_post:1,persT:1,thr:1,mslT:1};
function cmPx(side,i){var S=G.sides[side],R=S.cm&&S.cm[i];if(!R)return S;R.mem=R.mem||{};if(R._px&&R._pxS===S&&R._pxM===R.mem)return R._px;var M=R.mem.sd||(R.mem.sd={}),px=new Proxy(S,{get:function(t,k){return PERCM[k]?M[k]:t[k];},set:function(t,k,v){if(PERCM[k])M[k]=v;else t[k]=v;return true;}});
  ['_px','_pxS','_pxM'].forEach(function(k,j){Object.defineProperty(R,k,{value:[px,S,R.mem][j],enumerable:false,configurable:true,writable:true});});return px;}
(function(){var b=SD;SD=function(i){var C=G&&G._cc;if(C&&C.side===i&&tmOn(i))return cmPx(i,C.i);return b(i);};})();
(function(){var b=tops;tops=function(side){var L=b(side),C=G._cc;if(C&&C.side===side&&tmOn(side)){var R=G.sides[side].cm[C.i];if(R){var o=L.filter(function(u){return R.roots.indexOf(u.id)>=0;});R.roots.forEach(function(id){var u=uById(id);if(u&&u.p>=0&&u.side===side&&alive(u)&&o.indexOf(u)<0)o.push(u);});return o;}}return L;};})();
(function(){var b=sideStr;sideStr=function(side){var C=G&&G._cc;if(C&&C.side===side&&tmOn(side))return cmStr(side,C.i);return b(side);};})();
(function(){var b=aiControls;aiControls=function(u){if(u&&tmOn(u.side)){var i=cmOf(u),R=G.sides[u.side].cm[i];if(R&&!R.ai)return false;var C=G._cc;if(C&&C.ai&&C.side===u.side&&i!==C.i)return false;}return b(u);};})();
(function(){var b=playerOwns;playerOwns=function(side,u){if(tmOn(side)){var R=G.sides[side].cm[cmOf(u)];if(R&&!R.ai)return true;}return b(side,u);};})();
/* 命令由該部隊所屬指揮官的司令部發出；AI 指揮官不能直接命令友軍指揮官的部隊（只能請求） */
(function(){var b=issue;issue=function(u,k,p){if(!u||!tmOn(u.side))return b(u,k,p);var i=cmOf(u),C=G._cc;if(C&&C.ai&&C.side===u.side&&C.i!==i)return {sec:0};var prev=G._cc,R=G.sides[u.side].cm[i];G._cc={side:u.side,i:i,ai:!!(C&&C.ai&&C.side===u.side)};
  try{var r=b(u,k,p);if(R&&!R.ai&&!G._cc.ai&&G.started)decLog(u.side,'玩家（'+R.n+'）','命令'+uName(u)+'：'+(ORDN[k]||k)+(p&&p.x!==undefined?'（'+placeTxt(p.x,p.y)+'）':''));return r;}finally{G._cc=prev;}};})();
/* 每位 AI 指揮官各自評估、各自執行行為樹 */
(function(){var b=cmdrStep;cmdrStep=function(side){if(!tmOn(side))return b(side);cmSync(side);tmStep(side);var L=G.sides[side].cm;for(var i=0;i<L.length;i++){if(!L[i].ai||!cmAlive(side,i))continue;var prev=G._cc;G._cc={side:side,i:i,ai:true};try{b(side);}finally{G._cc=prev;}}};})();
(function(){var b=aiStep;aiStep=function(side){if(!tmOn(side))return b(side);cmSync(side);var L=G.sides[side].cm;for(var i=0;i<L.length;i++){if(!L[i].ai||!cmAlive(side,i))continue;var prev=G._cc;G._cc={side:side,i:i,ai:true};try{b(side);}finally{G._cc=prev;}}};})();
/* 評估時只看自己的防區（自己部隊周圍），兵力比用自己的兵力 */
(function(){var b=aiAssess;aiAssess=function(side,F,groups,aoi){var C=G._cc,tm=!!(C&&C.side===side&&tmOn(side));if(tm&&aoi===undefined&&F===sideCmd(side)){var L=cmUnits(side,C.i),c=L.length?centroid(L):[F.x,F.y],r=0;L.forEach(function(u){r=Math.max(r,dist(u.x,u.y,c[0],c[1]));});aoi=clamp(r+9000,9000,45000);}
  var X=b(side,F,groups,aoi);X.cmi=tm?C.i:0;X.cm=cmList(side)[X.cmi]||cmList(side)[0];X.tm=tm;X.cfg=cmCfg(side,X.cmi);return X;};})();

/* ---------- 三、組隊：1v1、2v2、3v3 ---------- */
/* 拆分編制：下級依兵力平均分成幾份，第一份留在原司令部，其餘各自成立新的戰鬥群司令部（成為頂層編制） */
function cmSplitForm(side,F,parts){var K=kidsOf(F).filter(function(k){return k.st!=='dead';});if(K.length<2||parts<2)return [];parts=Math.min(parts,K.length);
  var man=K.filter(function(k){return /man|rec/.test(roleOf(k));}).sort(function(a,b){var x=strengthOf(a),y=strengthOf(b);return (y.men+y.veh*8)-(x.men+x.veh*8);}),rest=K.filter(function(k){return man.indexOf(k)<0;}),bins=[],w=[];for(var j=0;j<parts;j++){bins.push([]);w.push(0);}
  function put(k){var j=0;for(var q=1;q<parts;q++)if(w[q]<w[j])j=q;bins[j].push(k);var s=strengthOf(k);w[j]+=s.men+s.veh*8+1;}man.forEach(put);
  /* 支援單位（砲兵、工兵、後勤）也依序分配，但每份至少留一個機動單位 */rest.forEach(function(k,ix){bins[ix%parts].push(k);});
  if(bins.some(function(B){return !B.some(function(k){return /man|rec/.test(roleOf(k));});}))return [];
  var out=[],r=mb32(hstr((G.set.seed||'')+'|split|'+F.id));NMS.side=side;NMS.fem=offFem(side,ST(F).era);
  for(var p=1;p<parts;p++){var H=newUnit(side,{name:(F.name||'')+'第'+['一','二','三','四'][p]+'戰鬥群',ech:Math.max(2,(F.ech||3)-1),hq:F.hq||hqTypeFor(ST(F).era),off:newOfficer(r,Math.max(2,(F.ech||3)-1))});initStrength(H);H.hd=F.hd||0;H.st=F.st==='off'?'off':'ok';if(F.arr)H.arr=JSON.parse(JSON.stringify(F.arr));
    bins[p].forEach(function(k){F.kids=F.kids.filter(function(id){return id!==k.id;});k.p=H.id;H.kids.push(k.id);G._pv=(G._pv||0)+1;});var Lf=leavesOf(H).filter(function(u){return u.st!=='off';});if(Lf.length){var c=centroid(Lf);H.x=c[0];H.y=c[1];}else{H.x=F.x;H.y=F.y;}H.home=[H.x,H.y];out.push(H);}
  reix();G._tv++;var Lr=leavesOf(F).filter(function(u){return u.st!=='off';});if(Lr.length){var c2=centroid(Lr);F.x=c2[0];F.y=c2[1];}dupNames();return out;}
/* 設定一方的指揮官人數並分配兵力：md＝'split' 平分原有兵力（地圖上的地面編制不夠分時拆分最大的編制）；'dup'（每位指揮官一份完整兵力）時同一種編制輪流分配 */
function teamSetup(side,n,md){var S=G.sides[side];n=clamp(n|0,1,CMMAX);var old=S.cm||[],L=[];for(var i=0;i<n;i++){var o=old[i];L.push(o?Object.assign(cmNew(i,!o.ai),{n:o.n,ai:o.ai,ms:o.ms,dd:o.dd,oa:o.oa,rs:o.rs}):cmNew(i,false));}
  if(!old.length){L.forEach(function(R,j){R.ai=!!S.ai||j>0;});}S.cm=L;cmBump();
  var T=function(){return G.units.filter(function(u){return u.side===side&&u.p<0&&u.st!=='dead';});},land=function(){return T().filter(function(t){return !isAirForm(t)&&!isNavForm(t);});},onL=function(){return land().filter(function(t){return t.st!=='off';});};
  if(n===1){L[0].roots=T().map(function(u){return u.id;});S.ai=L[0].ai;cmBump();return L;}
  if(md!=='dup'){var guard=0;while(onL().length<n&&guard++<4){var big=onL().filter(function(t){return !isLeaf(t);}).sort(function(a,b){return cmW(b)-cmW(a);})[0];if(!big)break;if(!cmSplitForm(side,big,Math.min(n-onL().length+1,3)).length)break;}}
  var w=L.map(function(){return 0;}),put=function(t){var q=0;for(var j=1;j<n;j++)if(w[j]<w[q])q=j;L[q].roots.push(t.id);w[q]+=cmW(t);},rr=function(list){var by={},ks=[];list.forEach(function(t){var k=t.pk||t.name||String(t.id);if(!by[k]){by[k]=[];ks.push(k);}by[k].push(t);});ks.forEach(function(k){by[k].forEach(function(t,j){L[j%n].roots.push(t.id);w[j%n]+=cmW(t);});});};
  var LD=land().sort(function(a,b){return cmW(b)-cmW(a);});if(md==='dup')rr(land());else{LD.filter(function(t){return t.st!=='off';}).forEach(put);LD.filter(function(t){return t.st==='off';}).forEach(put);}
  rr(T().filter(function(t){return isAirForm(t)||isNavForm(t);}));S.ai=L.some(function(R){return R.ai;});cmBump();dupNames();return L;}
function cmW(u){var s=strengthOf(u);return s.men+s.veh*8;}
/* 把某個頂層編制改交給另一位指揮官 */
function cmAssign(side,rootId,i){var L=cmList(side);if(!L[i])return;L.forEach(function(R){R.roots=R.roots.filter(function(id){return id!==rootId;});});L[i].roots.push(rootId);cmBump();}
/* ---------- 指揮權的移交、接管與共用 ----------
   移交：把自己的一個編制（或單一部隊）交給隊友指揮，等於作戰管制權轉移，編制與補給關係不變。
   接管：把隊友的編制收歸自己指揮；對方是 AI（或玩家斷線、暫由 AI 代理）時立即生效，對方是玩家時送出請求，由對方同意。
   共用：編制仍歸原指揮官，但指定的隊友也可以直接下令；玩家對 AI 指揮官的共用部隊下令後，AI 在 4 小時內不會改動那支部隊的命令。 */
var CMHOLD=4*3600;
function cmSubIds(u){var o={},w=function(x){if(!x||o[x.id])return;o[x.id]=1;(x.kids||[]).forEach(function(k){w(uById(k));});};w(u);return o;}
function cmUp(u,f){var c=u,n=0;while(c&&n<24){if(f(c))return c;if(c.p<0)break;c=uById(c.p);n++;}return null;}
/* 這支部隊共用給哪些指揮官（-1＝全部隊友） */
function cmShOf(u){var S=G.sides[u.side],M=S&&S.cmSh,r=[];if(!M)return r;cmUp(u,function(c){var a=M[c.id];if(a)a.forEach(function(j){if(r.indexOf(j)<0)r.push(j);});return false;});return r;}
function cmMay(u,j){if(!u||!tmOn(u.side))return true;if(cmOf(u)===j)return true;var a=cmShOf(u);return a.indexOf(j)>=0||a.indexOf(-1)>=0;}
function cmMe(side){var L=cmList(side),r=[];L.forEach(function(R,i){if(!R.ai)r.push(i);});return r;}
function cmShHum(u){var o=cmOf(u);return cmMe(u.side).some(function(j){return j!==o&&cmMay(u,j);});}
function cmHold(u){return !!cmUp(u,function(c){return typeof c.hcT==='number'&&G.t-c.hcT<CMHOLD;});}
/* 玩家能不能對這支部隊下令（自己的，或隊友共用給自己的） */
function cmPlMay(u){return !aiControls(u)||(tmOn(u.side)&&cmShHum(u));}
function cmShClean(side){var S=G.sides[side],M=S.cmSh;if(M)Object.keys(M).forEach(function(id){var u=uById(+id);if(!u||u.side!==side||u.st==='dead'||!M[id].length)delete M[id];});
  if(S.cmRq)S.cmRq=S.cmRq.filter(function(q){var u=uById(q.u);return u&&u.st!=='dead'&&G.t-q.t<2*3600;});}
function cmLog(side,u,txt){logE(side,'cmd',txt,u?u.x:undefined,u?u.y:undefined,u?u.id:undefined);if(typeof decLog==='function')decLog(side,'指揮權',txt);}
/* 實際轉移指揮權 */
function cmXfer(side,uid,to,verb){var L=cmList(side),u=uById(uid);if(!tmOn(side)||!u||u.side!==side||!L[to])return {err:'找不到這個單位或指揮官。'};var from=cmOf(u);if(from===to)return {err:'這支部隊已經由「'+L[to].n+'」指揮。'};
  var sub=cmSubIds(u);L.forEach(function(R,j){R.roots=R.roots.filter(function(id){return id!==uid&&!(j===to&&sub[id]);});});cmBump();if(cmOf(u)!==to){L[to].roots.push(uid);cmBump();}
  Object.keys(sub).forEach(function(id){var q=uById(+id);if(q)delete q.hcT;});var M=G.sides[side].cmSh;if(M&&M[uid]){M[uid]=M[uid].filter(function(j){return j!==to;});if(!M[uid].length)delete M[uid];}
  cmLog(side,u,verb==='take'?'「'+L[to].n+'」接管'+uName(u)+'（原屬「'+L[from].n+'」）':uName(u)+'由「'+L[from].n+'」移交給「'+L[to].n+'」指揮');return {ok:1,from:from,to:to};}
function cmBy(side,by){var L=cmList(side);return L[by]?by:-1;}
/* 移交：只有目前的指揮官可以把部隊交出去 */
function cmGive(side,uid,to,by){var u=uById(uid);if(!u||cmBy(side,by)<0)return {err:'找不到這個單位。'};if(cmOf(u)!==by)return {err:'只能移交自己指揮的部隊。'};return cmXfer(side,uid,to,'give');}
/* 接管：對方是 AI 時立即生效，對方是玩家時送出請求 */
function cmTake(side,uid,by){var u=uById(uid),L=cmList(side);if(!u||u.side!==side||cmBy(side,by)<0)return {err:'找不到這個單位。'};var o=cmOf(u);if(o===by)return {err:'這支部隊已經由你指揮。'};if(L[o].ai)return cmXfer(side,uid,by,'take');return cmAsk(side,'take',uid,by,o);}
/* 共用：指揮官把部隊共用給隊友（to＝-1 為全部隊友）；不是自己的部隊則向指揮官請求共用 */
function cmShare(side,uid,to,on,by){var u=uById(uid),L=cmList(side);if(!u||u.side!==side||cmBy(side,by)<0)return {err:'找不到這個單位。'};var o=cmOf(u);
  if(o!==by){if(!on)return {err:'只能取消自己部隊的共用。'};if(cmMay(u,by))return {err:'這支部隊已經共用給你。'};if(L[o].ai){cmShSet(side,uid,by,true);cmLog(side,u,'「'+L[o].n+'」同意與「'+L[by].n+'」共用'+uName(u)+'的指揮權');return {ok:1};}return cmAsk(side,'share',uid,by,o);}
  if(to!==-1&&(!L[to]||to===o))return {err:'找不到這位隊友。'};cmShSet(side,uid,to,on);cmLog(side,u,'「'+L[o].n+'」'+(on?'把'+uName(u)+'的指揮權共用給'+(to===-1?'全部隊友':'「'+L[to].n+'」'):'取消'+uName(u)+(to===-1?'的共用':'與「'+L[to].n+'」的共用')));return {ok:1};}
function cmShSet(side,uid,to,on){var S=G.sides[side],M=S.cmSh||(S.cmSh={}),a=M[uid]||[];if(on){if(a.indexOf(to)<0)a.push(to);M[uid]=a;}else{a=to===-1?[]:a.filter(function(j){return j!==to;});if(a.length)M[uid]=a;else delete M[uid];}cmBump();}
function cmAsk(side,k,uid,by,to){var S=G.sides[side],Q=S.cmRq||(S.cmRq=[]),u=uById(uid),L=cmList(side);if(Q.some(function(q){return q.k===k&&q.u===uid&&q.from===by;}))return {ok:1,pend:1,msg:'已經送出請求，等待「'+L[to].n+'」回覆。'};
  if(Q.length>=12)Q.shift();Q.push({id:S.cmRqN=(S.cmRqN||0)+1,k:k,u:uid,from:by,to:to,t:G.t});cmLog(side,u,'「'+L[by].n+'」請求'+(k==='take'?'接管':'共用')+uName(u)+'，等待「'+L[to].n+'」回覆');return {ok:1,pend:1,msg:'已向「'+L[to].n+'」送出請求。'};}
/* 回覆隊友的請求 */
function cmAns(side,rid,yes,by){var S=G.sides[side],Q=S.cmRq||[],q=null;for(var i=0;i<Q.length;i++)if(Q[i].id===rid){q=Q[i];break;}if(!q)return {err:'這個請求已經不存在。'};if(q.to!==by)return {err:'這個請求不是給你的。'};S.cmRq=Q.filter(function(x){return x!==q;});
  var u=uById(q.u),L=cmList(side);if(!u||u.st==='dead')return {err:'部隊已不存在。'};if(cmOf(u)!==by)return {err:'這支部隊已經不歸你指揮。'};
  if(!yes){cmLog(side,u,'「'+L[by].n+'」拒絕「'+L[q.from].n+'」'+(q.k==='take'?'接管':'共用')+uName(u)+'的請求');return {ok:1};}
  if(q.k==='take')return cmXfer(side,q.u,q.from,'take');cmShSet(side,q.u,q.from,true);cmLog(side,u,'「'+L[by].n+'」同意與「'+L[q.from].n+'」共用'+uName(u)+'的指揮權');return {ok:1};}
function cmRqFor(side,j){var S=G.sides[side];return (S.cmRq||[]).filter(function(q){return q.to===j&&G.t-q.t<2*3600;});}
/* AI 不改動玩家剛下令的共用部隊 */
(function(){var b=aiControls;aiControls=function(u){if(u&&tmOn(u.side)&&cmHold(u))return false;return b(u);};})();
(function(){var b=playerOwns;playerOwns=function(side,u){if(u&&tmOn(side)&&cmShHum(u))return true;return b(side,u);};})();
var CMSIM=0;(function(){var b=simStep;simStep=function(){CMSIM++;try{return b.apply(this,arguments);}finally{CMSIM--;}};})();
(function(){var b=issue;issue=function(u,k,p){if(u&&!CMSIM&&!G._cc&&tmOn(u.side)&&G.started){var R=G.sides[u.side].cm[cmOf(u)];if(R&&R.ai&&cmShHum(u))u.hcT=G.t;}return b(u,k,p);};})();
/* 複製模式的兵力表：每項乘上人數，番號依序改變 */
var CNUM='〇一二三四五六七八九';
function cnParse(s){var m=0,t=0,d=s.split('');if(!d.length)return NaN;for(var i=0;i<d.length;i++){var c=d[i];if(c==='十'){t=(m||1)*10;m=0;}else{var v=CNUM.indexOf(c);if(v<0)return NaN;m=v;}}return t+m;}
function cnFmt(n){if(n<10)return CNUM[n];if(n<20)return '十'+(n%10?CNUM[n%10]:'');return CNUM[Math.floor(n/10)]+'十'+(n%10?CNUM[n%10]:'');}
function dupName(nm,c){if(!c||!nm)return nm;var m=/^第([〇一二三四五六七八九十]+)(.*)$/.exec(nm);if(m){var v=cnParse(m[1]);if(v>0&&v+c*10<100)return '第'+cnFmt(v+c*10)+m[2];}return nm+'（'+['','乙','丙'][c]+'）';}
function dupList(L,n){var out=[];(L||[]).forEach(function(p){if(p[2]&&p[2].indexOf('{i}')>=0){var q=p.slice();q[1]=(q[1]||1)*n;out.push(q);return;}for(var c=0;c<n;c++){var q2=p.slice();if(c)q2[2]=dupName(q2[2]||'',c);out.push(q2);}});return out;}
/* 組隊時各指揮官的頂層司令部不再一律當作「指揮型」，而是依各自指揮官的性格推定個性 */
(function(){var b=aiOf;aiOf=function(F){var a=F&&F.aip;if(F&&tmOn(F.side)&&F.p<0&&!isLeaf(F)&&(!a||a.t==='auto')){a=F.aip||(F.aip={t:'auto',v:-1});a.t=aiAuto(F);try{return b(F);}finally{a.t='auto';}}return b(F);};})();

/* ---------- 四、個性決定的防禦準則、攻擊方式、偵察習慣與後勤經營風格 ---------- */
var DDN={elastic:['彈性防禦','前沿只留少數兵力遲滯，主力在後方主陣地；敵軍突入後以預備隊反擊、恢復前沿'],mobile:['機動防禦','步兵據守要點牽制；裝甲與機械化部隊集結在後方，敵軍突入時從側翼出擊殲滅'],depth:['縱深防禦','兵力分成前後兩道防線，逐線消耗敵軍'],
  forward:['前沿固守','全部兵力部署在第一線，寸土不讓'],hedgehog:['刺蝟據點','部隊集中在城鎮與要地構成環形據點，以火力覆蓋據點之間的空隙'],delay:['遲滯防禦','逐線後撤、以空間換取時間，保存兵力'],reverse:['反斜面防禦','主陣地設在稜線後方，避開敵軍遠距離觀測與火力，近距離殲敵']};
var OAN={assault:['總攻','選定敵軍薄弱處後，全部兵力在同一時刻發起攻擊'],break:['突破','集中兵力於狹窄正面突破，第二梯隊隨即穿插、擴張戰果'],flank:['側翼攻勢','以一部兵力在正面牽制，主力繞到敵軍防線的側翼，從側面進攻'],pincer:['鉗形攻勢','中央牽制，兩翼同時繞過敵軍兩側、在敵軍後方會合，企圖包圍殲滅'],turn:['迂迴','機動部隊大範圍繞過敵軍防線，直插後方的砲兵、指揮所、補給或退路，迫使敵軍放棄陣地'],raid:['襲擾','以小部隊與砲火反覆襲擊，消耗敵軍、迫使其分散兵力']};
var RSN={none:['直接進攻','不做偵察，看起來哪裡弱就打哪裡（沒看到的地方當作沒有敵人）'],rbf:['火力偵察','以砲火試射與試探攻擊反覆誘使敵軍開火暴露，確認後才主攻'],scout:['多派偵察','派出更多偵察兵與巡邏隊，先摸清各處敵情再選擇主攻方向']};
var MGN={depot:['補給站網','沿前線後方廣設補給站與補給點'],base:['後方基地','建立大型後方基地：補給站旁設彈藥庫、油庫與野戰醫院'],air:['航空後勤','闢建野戰機場，以空運與航空支援為後勤核心'],fort:['防禦工事','優先構築半永久工事、據點與第二道防線'],
  road:['交通與油料','整修道路、修建補給道路與橋梁，設置油庫，維持機動'],med:['醫療後送','廣設野戰醫院，縮短後送距離、降低傷重不治'],min:['以戰養戰','只維持最低限度的後勤，靠奪取敵方的補給設施補充']};
function cmHasAir(side,i){return G.units.some(function(u){return u.side===side&&alive(u)&&isLeaf(u)&&ST(u).dom==='air'&&ST(u).fl.indexOf('C')<0&&(!tmOn(side)||cmOf(u)===i);});}
function cmAuto(P,side,i){var t=P.t,v=(AIT[t]&&AIT[t][2][P.v]||['',''])[0],o={dd:'depth',oa:'break',rs:'scout',ms:'depot'};
  switch(t){case 'cmd':o={dd:'mobile',oa:v==='協同指揮'?'pincer':v==='分散授權'?'flank':'break',rs:'scout',ms:'base'};break;
    case 'bal':o={dd:v==='機會主義'?'elastic':'depth',oa:v==='機會主義'?'flank':'assault',rs:'scout',ms:v==='穩健派'?'med':'depot'};break;
    case 'smart':o={dd:'elastic',oa:v==='間接路線'?'turn':'flank',rs:'scout',ms:'road'};break;
    case 'reck':o={dd:'forward',oa:v==='裝甲狂飆'?'break':'assault',rs:'none',ms:'min'};break;
    case 'caut':o={dd:'depth',oa:'break',rs:v==='情報至上'?'scout':'rbf',ms:v==='步步為營'?'fort':v==='火力先行'?'base':'depot'};break;
    case 'cons':o={dd:v==='據壘死守'?'hedgehog':v==='不敢冒險'?'delay':'forward',oa:'raid',rs:'rbf',ms:'fort'};break;
    case 'gue':o={dd:'delay',oa:'raid',rs:'scout',ms:'min'};break;
    case 'logi':o={dd:'hedgehog',oa:'assault',rs:'scout',ms:v==='基地推進'?'base':'depot'};break;
    case 'fire':o={dd:'depth',oa:'assault',rs:'rbf',ms:'base'};break;
    case 'man':o={dd:'mobile',oa:v==='包圍殲滅'?'pincer':v==='縱深打擊'?'turn':'break',rs:'scout',ms:'road'};break;
    case 'def':o={dd:v==='反斜面'?'reverse':v==='逆襲'?'mobile':'elastic',oa:v==='逆襲'?'flank':'raid',rs:'rbf',ms:'fort'};break;}
  if((t==='cmd'||t==='smart'||t==='man')&&featOn('airfield')&&cmHasAir(side,i))o.ms='air';return o;}
function cmCfg(side,i){var L=cmList(side),R=L[i]||L[0],T=cmTop(side,i),P=T?aiOf(T):Object.assign({t:'bal',v:0},AIP0),A=cmAuto(P,side,i),pick=function(k,tab){var v=R[k];return v&&v!=='auto'&&tab[v]?v:A[k];};return {P:P,dd:pick('dd',DDN),oa:pick('oa',OAN),rs:pick('rs',RSN),ms:pick('ms',MGN),auto:A};}
function cmMem(X){var R=X.cm||cmList(X.side)[0];R.mem=R.mem||{};return R.mem;}

/* ---------- 五、攻擊：研判敵軍薄弱處（看得到的敵軍＋沒看到的地方依個性假設），偵察後選擇總攻、突破或襲擾 ---------- */
/* 指揮官的正面：中心、面向敵方的方向、橫向範圍 */
function cmFrame(side,i){var L=cmUnits(side,i,function(u){var r=roleOf(u);return r==='man'||r==='rec';});if(!L.length)L=cmUnits(side,i);if(!L.length)return null;var C=centroid(L),ec=enemyCentroid(side,C[0],C[1],25000),fd=ec?Math.atan2(ec[1]-C[1],ec[0]-C[0]):homeDir(side)+PI,fx=Math.cos(fd),fy=Math.sin(fd),lx=-fy,ly=fx,S=[],T=[];
  L.forEach(function(u){S.push((u.x-C[0])*lx+(u.y-C[1])*ly);T.push((u.x-C[0])*fx+(u.y-C[1])*fy);});S.sort(function(a,b){return a-b;});T.sort(function(a,b){return a-b;});var q=function(A,f){return A[clamp(Math.round((A.length-1)*f),0,A.length-1)];};
  return {C:C,fd:fd,fx:fx,fy:fy,lx:lx,ly:ly,s0:q(S,0.05),s1:q(S,0.95),t0:q(T,0.1),t1:q(T,0.75),W:Math.max(1500,q(S,0.95)-q(S,0.05)),L:L,ec:ec};}
function frPt(Fr,s,t){return [Fr.C[0]+Fr.lx*s+Fr.fx*t,Fr.C[1]+Fr.ly*s+Fr.fy*t];}
function frS(Fr,x,y){return (x-Fr.C[0])*Fr.lx+(y-Fr.C[1])*Fr.ly;}
function frT(Fr,x,y){return (x-Fr.C[0])*Fr.fx+(y-Fr.C[1])*Fr.fy;}
/* 守方地形加成：掩蔽（城鎮、森林）與既有工事 */
function defTer(x,y){var MP=G.map,s=0,n=0;for(var b=-1;b<=1;b++)for(var a=-1;a<=1;a++){var px=x+a*250,py=y+b*250;if(px<0||py<0||px>=MP.Wm||py>=MP.Hm)continue;var k=cellAt(px,py),c=MP.lc[k];if(isWater(c))continue;var f=1/Math.max(0.25,LC[c][4]),ft=MP.ft[k];if(ft===1)f+=0.4;else if(ft>=4)f+=0.9;else if(ft===2||ft===3)f+=0.3;s+=f;n++;}return n?1+(s/n-1)*0.5:1;}
/* 這個地點最近有沒有被本方看到（附近有新鮮的接觸報告，或本方單位就在觀測距離內） */
function wpSeen(side,x,y){if(enemyPic(side,1200).some(function(c){return c.dom==='land'&&dist(c.x,c.y,x,y)<1500;}))return true;var s=false;gridNear(x,y,6000,function(u){if(s||u.side!==side||!onMap(u))return;var st=ST(u),R=Math.min(spotOf(u,st)*0.7,st.dom==='air'?3500:4000);if(dist(u.x,u.y,x,y)<R)s=true;});return s;}
/* 沿本方正面切成約 2.5 公里寬的通道，在每條通道找出敵軍前沿，估計那裡的兵力與情報可信度 */
function wpCands(side,i,Fr,mem){var ens=enemyOf(side),F=G.front,B=2500,out=[],obs=mem.obs||(mem.obs={}),MP=G.map,tf=Fr.t1,en=enemyPic(side,3600).filter(function(c){if(c.dom!=='land'||c.dead)return false;var cs=frS(Fr,c.x,c.y),ct=frT(Fr,c.x,c.y);return ct>tf-2500&&ct<tf+16000&&cs>Fr.s0-8000&&cs<Fr.s1+8000;});
  /* 還沒有發現這個方向的敵軍：無從研判（交給偵察、試探或奪取目標的分支） */if(!en.length)return out;var TT=en.map(function(c){return frT(Fr,c.x,c.y);}).sort(function(a,b){return a-b;}),tEn=TT[Math.floor(TT.length/2)];
  var n=clamp(Math.round((Fr.W+5000)/B),3,9),mid=(Fr.s0+Fr.s1)/2;
  for(var j=0;j<n;j++){var s=mid+(j-(n-1)/2)*B,te=null;en.forEach(function(c){var cs=frS(Fr,c.x,c.y),ct=frT(Fr,c.x,c.y);if(Math.abs(cs-s)<B*0.75&&(te===null||ct<te))te=ct;});
    /* 這條通道沒有看到敵軍：以控制線推估敵軍前沿，否則用其他通道敵軍前沿的中位數 */if(te===null&&F&&F.own&&F.init){for(var t=Math.max(tf+500,tEn-3000);t<tEn+3000;t+=500){var p0=frPt(Fr,s,t);if(p0[0]<0||p0[1]<0||p0[0]>=MP.Wm||p0[1]>=MP.Hm)break;var k0=Math.floor(p0[1]/F.cs)*F.W+Math.floor(p0[0]/F.cs);if(F.own[k0]===ens||nSides()>=3&&hostile(side,F.own[k0])){te=t;break;}}}
    var unk=te===null;if(unk)te=tEn;
    var p=frPt(Fr,s,te+300);if(p[0]<300||p[1]<300||p[0]>MP.Wm-300||p[1]>MP.Hm-300)continue;var vp=validPos({dom:'land'},p[0],p[1]);if(dist(vp[0],vp[1],p[0],p[1])>1200)continue;p=vp;
    var E=0,E2=0,shk=0,soft=0;en.forEach(function(c){var d=dist(c.x,c.y,p[0],p[1]);if(d>4500)return;var age=G.t-c.t,w=age<1200?1:age<3600?0.6:0.3,m=((c.men||0)+(c.veh||0)*8)*w;if(d<2000){E+=m;if(c.ms&&c.ms!=='ok')shk++;}else E2+=m;if(/sup|hq|art|rkt/.test(c.br||'')&&d<3500)soft++;});
    var key=Math.round(p[0]/2500)+'|'+Math.round(p[1]/2500);if(wpSeen(side,p[0],p[1]))obs[key]=G.t;
    out.push({x:p[0],y:p[1],s:s,key:key,E:E+E2*0.4,shk:shk,soft:soft,unk:unk,U:clamp((G.t-(obs[key]===undefined?-1e9:obs[key]))/7200,0,1),ter:defTer(p[0],p[1])});}
  out.forEach(function(c,j){var a=out[j-1],b=out[j+1];c.jn=!!(a&&b&&c.U<0.5&&c.E<0.35*Math.min(a.E,b.E)&&Math.min(a.E,b.E)>300);});return out;}
/* 研判：看到的兵力＋沒看到的地方依個性假設的兵力（魯莽者假設很少、謹慎者假設很多），再乘上地形、距離、目標與河川 */
function wpEval(X){var side=X.side,i=X.cmi||0,Fr=cmFrame(side,i);if(!Fr)return null;var mem=cmMem(X),L=wpCands(side,i,Fr,mem);if(!L.length)return null;var P=X.P,kn=L.filter(function(c){return c.U<0.5&&c.E>0;}).map(function(c){return c.E;}).sort(function(a,b){return a-b;}),prior=kn.length?kn[Math.floor(kn.length/2)]:Math.max(600,(X.enM||1200)/Math.max(1,L.length));
  L.forEach(function(c){var assume=c.U*prior*(0.25+1.5*(P.intel||0)),d=dist(Fr.C[0],Fr.C[1],c.x,c.y),obj=(G.obj||[]).some(function(o){return objTgt(side,o)&&dist(o.x,o.y,c.x,c.y)<4500;})?(P.logi>0.7?0.9:0.45):0,k=c.ter*(1+d/20000)/(1+obj)/(1+c.shk*0.3);
    if(c.soft&&(P.deep||0)>0.6)k*=0.85;if(c.jn&&(P.flank||0)>0.7)k*=0.7;var rv=riverOnAxis(Fr.C,[c.x,c.y]);if(rv&&!bridgeNearPt(rv[0],rv[1],3000))k*=1.8;c.assume=assume;c.v=(c.E+assume+250)*k;c.opt=(c.E+250)*k;c.est=c.E+assume;});
  var S=L.slice().sort(function(a,b){return a.v-b.v;});return {Fr:Fr,L:L,S:S,best:S[0],prior:prior};}
var WPMINR={caut:2,fire:2,cons:3,def:2};
var WPSCN={smart:5,cmd:4,man:3,caut:3,gue:3,bal:2,logi:2,fire:2,def:2,cons:2,reck:0};
/* 可以投入攻擊的機動單位（主要編組兩個以上就用編組，否則用連級單位） */
function v11Busy(u){return !!(u.v10scr&&G.t-u.v10scr.t<12*3600||u.v10rest||u.v10rot&&G.t-u.v10rot<4*3600||u.v10wk&&G.t-u.v10wk<6*3600||u.v10dep||u.v11sc&&G.t-u.v11sc<2*3600||u.v11jc&&G.t-u.v11jc<8*3600||u.v11job&&G.t<u.v11job);}
/* 上級編制正在傳遞或執行攻擊命令：底下的連隊不算有空 */
function ancBusy(u){var c=u,n=0;while(c.p>=0&&n<12){var p=uById(c.p);if(!p||p.p<0)break;if(p.pend&&p.pend.length||G.msgs.some(function(m){return m.to===p.id&&m.k!=='req'&&m.k!=='rep';}))return true;var o=p.ord;if(o&&/attack|storm|breakthrough|crossing|penetrate|pursue|joint|landing/.test(o.k)&&o.st!=='done'&&G.t-(o.t1||o.ti||0)<6*3600)return true;c=p;n++;}return false;}
function freeOrd(u){if(u.pend&&u.pend.length)return false;if(G.msgs.some(function(m){return m.to===u.id&&m.k!=='req'&&m.k!=='rep';}))return false;var o=u.ord;return !o||o.st==='done'||/^(defend|reserve|halt|rest|screen|fortify|support)$/.test(o.k)&&!(o.dk==='siege');}
function pieceFree(u){if(!aiControls(u)||!alive(u)||u.irr)return false;if(isLeaf(u)&&ancBusy(u))return false;var L=isLeaf(u)?[u]:leavesOf(u).filter(onMap);if(!L.length)return false;if(L.some(function(q){return q.ms==='rout';}))return false;if(isLeaf(u)?v11Busy(u):L.filter(v11Busy).length>L.length/2)return false;return strengthOf(u).f>0.35&&freeOrd(u);}
/* 攻擊時不抽調安靜地段與據點的守軍（魯莽型除外）：整條前線仍要有兵力 */
function wpKeep(X){var dp=cmMem(X).dp;return function(g){if(!dp||!dp.roles)return true;var r=dpRole(dp,g);return r!=='quiet'&&r!=='hh';};}
/* 進攻之前也要先把整條前線分好：安靜地段留下守軍，其餘兵力才集中進攻 */
function wpFront(X){var M=cmMem(X);if(M.dp&&M.dp.sec&&G.t-M.dp.t<6*3600)return;var pcs=docPieces(X);if(pcs.length<3)return;var pk=docPick(X,pcs,null),dp=docPlan(X,pcs,pk.k,pk.why,true);if(dp)M.dp=dp;}
function wpPieces(X,f){var kp=wpKeep(X),G1=X.groups.filter(function(g){return /man|rec/.test(roleOf(g))&&!isLeaf(g)&&pieceFree(g)&&kp(g)&&(!f||f(g));});if(G1.length>=2)return G1.sort(function(a,b){return cmW(b)-cmW(a);});
  return cmUnits(X.side,X.cmi||0,function(u){return /man|rec/.test(roleOf(u))&&!isEng(u)&&pieceFree(u)&&kp(u)&&(!f||f(u));}).sort(function(a,b){return cmW(b)-cmW(a);});}
/* 佯攻（假戰）：智謀型、指揮型或偏好迂迴的指揮官，在主攻前 45 分鐘於另一個方向發起佯攻，吸引敵軍預備隊 */
function wpFeint(X,ap,ev,H){var side=X.side,P=X.P,tg=[ap.x,ap.y];if(!(P.t==='smart'||P.t==='cmd'||(P.flank||0)>=0.7)||ap.m==='raid')return '';var c=ev.L.filter(function(q){return dist(q.x,q.y,tg[0],tg[1])>=5000;}).sort(function(a,b){return (b.E>0?1:0)-(a.E>0?1:0)||dist(b.x,b.y,tg[0],tg[1])-dist(a.x,a.y,tg[0],tg[1]);})[0];if(!c)return '';
  var used=(ap.e1||[]).concat(ap.e2||[],ap.fx||[]),u=cmUnits(side,X.cmi||0,function(q){return /inf|mech|cav|rec|mot/.test(clsOf(q))&&!engNow(q)&&q.ms==='ok'&&strFrac(q)>0.5&&used.indexOf(q.id)<0&&!(q.p>=0&&used.indexOf(q.p)>=0)&&aiControls(q)&&!(q.pend&&q.pend.length)&&!ancBusy(q);}).sort(function(a,b){return dist(a.x,a.y,c.x,c.y)-dist(b.x,b.y,c.x,c.y);})[0];if(!u)return '';
  var t0=Math.max(G.t+300,H-2700);issue(u,'attack',{x:c.x,y:c.y,hHour:t0,opt:{tac:'feint',tol:20}});u.v11sc=G.t;var f=cmFire(X,function(q){return dist(q.x,q.y,c.x,c.y)<indOf(q,ST(q))*0.9;})[0];if(f&&H-G.t>2400)issue(f,'bombard',{x:c.x,y:c.y,r:600,dur:1200,then:'support'});else f=null;ap.feint={x:c.x,y:c.y,t:t0,u:u.id};
  return '；另以'+uName(u)+'於 '+tTxt(t0).slice(-5)+' 在'+placeTxt(c.x,c.y)+'先發起佯攻'+(f?'（'+uName(f)+'同時砲擊）':'')+'，吸引敵軍的預備隊';}
function isMob(u){var L=isLeaf(u)?[u]:leavesOf(u).filter(alive);if(!L.length)return false;return L.filter(function(q){var c=clsOf(q);return c==='arm'||c==='mech'||c==='cav';}).length>=L.length*0.5;}
function cmFire(X,f){return cmUnits(X.side,X.cmi||0,function(u){return roleOf(u)==='fire'&&indOf(u,ST(u))>0&&aiControls(u)&&!(u.pend&&u.pend.length)&&!(u.ord&&/bombard/.test(u.ord.k)&&u.ord.st!=='done'&&G.t-(u.ord.t1||u.ord.ti||0)<1800)&&(!f||f(u));});}
/* 依個性決定這次的攻擊方式：預設來自個性，再看局部兵力比調整 */
function wpMode(X,ev){var oa=X.cfg.oa,P=X.P,best=ev.best,pcs=wpPieces(X),own=sum(pcs,cmW),r=best.est>0?own/best.est:9,n=pcs.length,why='';
  /* 機動戰術要有可以繞過去的敵軍側翼，兵力也要夠分成牽制與機動兩部分 */if(/flank|pincer|turn/.test(oa)){var E=wpEnds(X,ev.Fr),op=E?[-1,1].filter(function(sg){return !!wpFlankPt(X,ev.Fr,E,sg,oa==='turn'?3500:2000,oa==='turn'?ev.Fr.t1:(ev.Fr.t1+E.te)/2);}):[];ev.open=op;
    if(oa==='pincer'&&(op.length<2||n<3||r<1.1)){oa=op.length&&n>=2?'flank':'break';why='兩翼不能同時迂迴';}
    if(oa==='turn'&&(!op.length||!pcs.some(isMob)&&P.t!=='smart')){oa=op.length&&n>=2?'flank':'break';why=op.length?'沒有機動部隊可以大範圍迂迴':'敵軍側翼沒有空隙';}
    if(oa==='flank'&&(!op.length||n<2)){oa='break';why=op.length?'兵力不足以分成牽制與迂迴兩部分':'敵軍側翼沒有空隙，改為正面突破';}
    if(/flank|turn/.test(oa)&&r<0.8){oa='raid';why='兵力不足';}}
  if(oa==='assault'&&P.t!=='reck'&&r<1.2)oa=r<0.7?'raid':'break';if(oa==='break'&&n<2)oa=r>=1.5?'assault':'raid';if(oa==='raid'&&r>=3&&P.agg>=0.45)oa='break';if(P.t==='reck'&&oa==='raid')oa='assault';return {m:oa,r:r,why:why};}
/* 敵軍防線在本方正面的範圍：兩端（左右翼）與前沿、縱深 */
function wpEnds(X,Fr){var side=X.side,tf=Fr.t1,en=enemyPic(side,3600).filter(function(c){if(c.dom!=='land'||c.dead)return false;var cs=frS(Fr,c.x,c.y),ct=frT(Fr,c.x,c.y);return ct>tf-2500&&ct<tf+16000&&cs>Fr.s0-12000&&cs<Fr.s1+12000;});if(!en.length)return null;
  var S=en.map(function(c){return frS(Fr,c.x,c.y);}).sort(function(a,b){return a-b;}),T=en.map(function(c){return frT(Fr,c.x,c.y);}).sort(function(a,b){return a-b;});return {s0:S[0],s1:S[S.length-1],te:T[Math.floor(T.length/2)],tb:T[T.length-1],en:en};}
/* 敵軍側翼外的迂迴點：在地圖內、是陸地、附近沒有已知的敵軍 */
function wpFlankPt(X,Fr,E,sg,off,tt){var s=sg<0?E.s0-off:E.s1+off,p=frPt(Fr,s,tt),MP=G.map;if(p[0]<500||p[1]<500||p[0]>MP.Wm-500||p[1]>MP.Hm-500)return null;var v=validPos({dom:'land'},p[0],p[1]);if(dist(v[0],v[1],p[0],p[1])>600)return null;if(knownEn(X.side,v[0],v[1],1500)>0)return null;var rv=riverOnAxis(Fr.C,v);if(rv&&!bridgeNearPt(rv[0],rv[1],3000))return null;return v;}
/* 行進時間：沿迂迴點的路程 ÷ 越野速度的六成 */
function wpEta(g,pts){var p=pcPos(g),L=isLeaf(g)?[g]:leavesOf(g).filter(onMap),v=Math.max(2,Math.min.apply(null,L.map(function(u){var s=ST(u);return s.vx||s.vr||4;}).concat([60])))*0.6,d=0,a=p;pts.forEach(function(q){d+=dist(a[0],a[1],q[0],q[1]);a=q;});return d/(v/3.6);}
/* 機動部隊的命令：連級單位直接走迂迴點；編制交給它的司令部以「側翼迂迴」戰術規劃 */
function wpManOrd(g,T,via,opt,turn){if(isLeaf(g)){issue(g,'attack',{x:T[0],y:T[1],via:via.map(function(q){return [q[0],q[1]];}),opt:opt});return;}if(turn){issue(g,'penetrate',{x:T[0],y:T[1],opt:{tol:opt.tol||45}});return;}
  var gp=pcPos(g),dir=Math.atan2(T[1]-gp[1],T[0]-gp[0]),V=via[via.length-1],sg=((V[0]-gp[0])*-Math.sin(dir)+(V[1]-gp[1])*Math.cos(dir))>=0?'R':'L';issue(g,'attack',{x:T[0],y:T[1],opt:Object.assign({},opt,{tac:'flank',side:sg})});}
/* 側翼攻勢、鉗形攻勢、迂迴 */
function wpManeuver(X,ap,ev,fire,prep){var P=X.P,side=X.side,Fr=ev.Fr,E=wpEnds(X,Fr);if(!E)return null;var m=ap.m,pcs=wpPieces(X),n=pcs.length;if(!n)return null;var tm=(Fr.t1+E.te)/2,off=m==='turn'?3500:2000,routes=[];
  var endStr=function(sg){var q=frPt(Fr,sg<0?E.s0:E.s1,E.te);return knownEn(side,q[0],q[1],2500);},sides=(ev.open||[-1,1]).filter(function(sg){return !!wpFlankPt(X,Fr,E,sg,off,m==='turn'?Fr.t1:tm);});if(!sides.length)return null;
  var mobC=pcs.filter(isMob).map(pcPos),mc=mobC.length?centroid(mobC.map(function(p){return {x:p[0],y:p[1]};})):Fr.C;sides.sort(function(a,b){var pa=wpFlankPt(X,Fr,E,a,off,tm)||Fr.C,pb=wpFlankPt(X,Fr,E,b,off,tm)||Fr.C;return endStr(a)*(1+dist(mc[0],mc[1],pa[0],pa[1])/10000)-endStr(b)*(1+dist(mc[0],mc[1],pb[0],pb[1])/10000);});
  var byMob=pcs.slice().sort(function(a,b){return (isMob(b)?1:0)-(isMob(a)?1:0)||cmW(b)-cmW(a);}),nm0=byMob.filter(isMob).length,nman=m==='turn'?Math.max(1,Math.min(nm0||1,Math.ceil(n*2/3))):nm0>=(m==='pincer'?2:1)?Math.min(nm0,n-1):Math.ceil(n*2/3),nfix=n>=2?Math.max(1,n-nman):0;/* 機動（迂迴）的任務優先交給裝甲、機械化與騎兵，步兵在正面牽制 */
  var fix=byMob.slice(n-nfix),man=byMob.slice(0,n-nfix),H=0,opt=Object.assign(aiOpts(man[0]||pcs[0],'attack',{}),{tac:'frontal',tol:Math.max(P.tol||35,40)}),txt='',sideN=function(sg){return sg*Math.sign(Fr.ly||1)<0?'北':'南';},wingN=function(sg){return sg<0?'左':'右';};
  var plan=[];if(m==='flank'){var sg=sides[0],V=wpFlankPt(X,Fr,E,sg,off,tm),T=validPos({dom:'land'},frPt(Fr,sg<0?E.s0+600:E.s1-600,E.te)[0],frPt(Fr,sg<0?E.s0+600:E.s1-600,E.te)[1]);man.forEach(function(g){plan.push([g,T,[V]]);});ap.x=T[0];ap.y=T[1];ap.fl=sg;
      txt='側翼攻勢：敵軍防線的'+wingN(sg)+'翼（'+placeTxt(T[0],T[1])+'）較弱、外側沒有敵軍，主力'+nmL(man)+'經'+placeTxt(V[0],V[1])+'繞到敵軍側翼，從側面進攻'+(fix.length?'；'+nmL(fix)+'在正面牽制':'');}
  else if(m==='pincer'){var L2=man.filter(function(g,j){return j%2===0;}),R2=man.filter(function(g,j){return j%2===1;}),Tb=validPos({dom:'land'},frPt(Fr,(E.s0+E.s1)/2,E.te+1500)[0],frPt(Fr,(E.s0+E.s1)/2,E.te+1500)[1]),VL=wpFlankPt(X,Fr,E,-1,off,tm),VR=wpFlankPt(X,Fr,E,1,off,tm);
      L2.forEach(function(g){plan.push([g,Tb,[VL]]);});R2.forEach(function(g){plan.push([g,Tb,[VR]]);});ap.x=Tb[0];ap.y=Tb[1];txt='鉗形攻勢：左翼'+nmL(L2)+'經'+placeTxt(VL[0],VL[1])+'、右翼'+nmL(R2)+'經'+placeTxt(VR[0],VR[1])+'繞過敵軍兩側，在'+placeTxt(Tb[0],Tb[1])+'會合、包圍敵軍'+(fix.length?'；'+nmL(fix)+'在中央牽制':'');}
  else{var sg3=sides[0],V1=wpFlankPt(X,Fr,E,sg3,off,Fr.t1),V2=validPos({dom:'land'},frPt(Fr,sg3<0?E.s0-off:E.s1+off,E.tb+2500)[0],frPt(Fr,sg3<0?E.s0-off:E.s1+off,E.tb+2500)[1]),soft=enemyPic(side,3600).filter(function(c){return c.dom==='land'&&/art|rkt|hq|sup/.test(c.br||'')&&frT(Fr,c.x,c.y)>E.te+800;}).sort(function(a,b){return dist(a.x,a.y,V2[0],V2[1])-dist(b.x,b.y,V2[0],V2[1]);})[0],
      D=soft?[soft.x,soft.y]:validPos({dom:'land'},frPt(Fr,sg3<0?E.s0+1000:E.s1-1000,E.tb+4000)[0],frPt(Fr,sg3<0?E.s0+1000:E.s1-1000,E.tb+4000)[1]);man.forEach(function(g){plan.push([g,D,[V1,V2]]);});ap.x=D[0];ap.y=D[1];ap.fl=sg3;
      txt='迂迴：機動部隊'+nmL(man)+'大範圍繞過敵軍'+wingN(sg3)+'翼（經'+placeTxt(V1[0],V1[1])+'、'+placeTxt(V2[0],V2[1])+'），直插敵後的'+(soft?(/hq/.test(soft.br)?'指揮所':/sup/.test(soft.br)?'補給單位':'砲兵陣地')+'（'+placeTxt(D[0],D[1])+'）':placeTxt(D[0],D[1])+'（敵軍退路）')+(fix.length?'；'+nmL(fix)+'在正面'+(P.agg>=0.5?'佯攻':'守備')+'牽制':'');}
  plan.forEach(function(q){H=Math.max(H,wpEta(q[0],q[2].concat([q[1]])));});H=G.t+clamp(H*1.05,prep*60+600,4*3600);
  plan.forEach(function(q){wpManOrd(q[0],q[1],q[2],opt,m==='turn');ap.e1.push(q[0].id);routes.push({k:'man',pts:[pcPos(q[0])].concat(q[2]).concat([q[1]])});});
  var Tf=m==='pincer'?validPos({dom:'land'},frPt(Fr,(E.s0+E.s1)/2,E.te)[0],frPt(Fr,(E.s0+E.s1)/2,E.te)[1]):[ev.best.x,ev.best.y];fix.forEach(function(g){var fopt={tac:m==='turn'&&P.agg<0.5?'probe':'feint',tol:25};issue(g,'attack',{x:Tf[0],y:Tf[1],hHour:Math.max(G.t+300,H-600),opt:fopt});ap.fx.push(g.id);routes.push({k:'fix',pts:[pcPos(g),Tf]});});
  fire.forEach(function(f,j){if(j>=4)return;issue(f,'bombard',{x:Tf[0],y:Tf[1],r:700,dur:Math.max(900,H-G.t),then:'support'});});ap.H=H;ap.routes=routes;ap.tf=Tf;return txt+'；預計 '+tTxt(H).slice(-5)+' 同時發起';}
/* 火力偵察：砲兵對研判可疑的地點試射，以小部隊試探攻擊誘敵開火；十五分鐘後檢查敵軍的反應 */
function wpRBF(X,ap,ev){var mem=cmMem(X),T=ev.S.slice(0,2).concat(ev.L.filter(function(c){return c.U>0.5&&c.opt<ev.best.v&&ev.S.slice(0,2).indexOf(c)<0;}).slice(0,1)),fired=[],probe=null,side=X.side;T.forEach(function(c,j){var f=cmFire(X,function(u){return dist(u.x,u.y,c.x,c.y)<indOf(u,ST(u))*0.9;})[0];if(!f)return;issue(f,'bombard',{x:c.x,y:c.y,r:450,dur:600,then:'support'});fired.push({u:f.id,x:c.x,y:c.y,key:c.key});});
  if(ap.rr>=1||!fired.length){var pr=cmUnits(side,X.cmi||0,function(u){return /inf|rec|mech|cav/.test(clsOf(u))&&pieceFree(u)&&dist(u.x,u.y,T[0].x,T[0].y)<9000;}).sort(function(a,b){return dist(a.x,a.y,T[0].x,T[0].y)-dist(b.x,b.y,T[0].x,T[0].y);})[0];
    if(pr){issue(pr,'attack',{x:T[0].x,y:T[0].y,opt:{tac:'probe',tol:10,pace:'careful'}});pr.v11sc=G.t;probe=pr;fired.push({u:pr.id,x:T[0].x,y:T[0].y,key:T[0].key});}}
  if(!fired.length)return false;(mem.rbfQ=mem.rbfQ||[]).push({at:G.t+900,side:side,L:fired});ap.rr++;ap.tR=G.t;
  v11Say(X,'rbf',600,'火力偵察（第 '+ap.rr+' 輪）：'+fired.filter(function(q){return !probe||q.u!==probe.id;}).map(function(q){return placeTxt(q.x,q.y);}).join('、')+(fired.length&&(!probe||fired.length>1)?' 試射':'')+(probe?'，'+uName(probe)+'對'+placeTxt(T[0].x,T[0].y)+'試探攻擊、誘使敵軍開火':'')+'，觀察敵軍的反應',{why:'rbf',r:ap.rr});return true;}
/* 多派偵察：偵察部隊、無人機與偵察機，智謀、指揮與謹慎型還會派步兵巡邏隊 */
function wpScout(X,ap,ev){var side=X.side,P=X.P,n=WPSCN[P.t]||2,T=ev.L.filter(function(c){return c.U>0.4;}).sort(function(a,b){return a.opt-b.opt;}).concat(ev.S.filter(function(c){return c.U<=0.4;})).slice(0,4),used=0,who=[];
  var cand=cmUnits(side,X.cmi||0,function(u){var c=clsOf(u);return (c==='rec'||c==='uav')&&pieceFree(u);}).concat(G.units.filter(function(u){return u.side===side&&isLeaf(u)&&alive(u)&&ST(u).dom==='air'&&(ST(u).fl.indexOf('r')>=0||clsOf(u)==='uav')&&aiControls(u)&&(!tmOn(side)||cmOf(u)===(X.cmi||0))&&!(u.ord&&u.ord.k==='recon'&&u.ord.st!=='done');}));
  if(/smart|cmd|caut|man/.test(P.t))cand=cand.concat(cmUnits(side,X.cmi||0,function(u){return /inf|mech|cav/.test(clsOf(u))&&pieceFree(u)&&strFrac(u)>0.6&&!engNow(u);}).sort(function(a,b){return cmW(a)-cmW(b);}).slice(0,P.t==='smart'?3:2));
  T.forEach(function(c,j){if(used>=n)return;var u=cand.filter(function(q){return who.indexOf(q)<0;}).sort(function(a,b){return dist(a.x,a.y,c.x,c.y)-dist(b.x,b.y,c.x,c.y);})[0];if(!u)return;issue(u,'recon',{x:c.x+(rnd()-0.5)*800,y:c.y+(rnd()-0.5)*800});u.v11sc=G.t;who.push(u);used++;});
  if(!used)return false;ap.rr++;ap.tR=G.t;v11Say(X,'scout',600,'多派偵察（第 '+ap.rr+' 輪）：派'+who.map(uName).join('、')+'查明'+T.slice(0,used).map(function(c){return placeTxt(c.x,c.y);}).join('、')+'一帶的敵情（目前最可疑方向的情報可信度 '+pct((1-ev.best.U)*100)+'）',{why:'scout',n:used});return true;}
/* 火力偵察的結果：真的開過火才算；試射範圍內的敵軍有機會暴露（還擊、移動、被命中） */
function rbfStep(){SIDES().forEach(function(side){var S=G.sides[side];(S.cm||[]).forEach(function(R){var M=R.mem;if(!M||!M.rbfQ||!M.rbfQ.length)return;M.rbfQ=M.rbfQ.filter(function(q){if(G.t<q.at)return true;q.L.forEach(function(e){var u=uById(e.u);if(!u||u.fired===undefined||G.t-u.fired>1800)return;var n=0;gridNear(e.x,e.y,700,function(t){if(t.side===side||!hostile(side,t.side)||!onMap(t)||ST(t).dom!=='land'||dist(t.x,t.y,e.x,e.y)>650)return;var p=0.65*(t.ent>0.5?0.85:1)*(optOf(t).post==='hide'||optOf(t).post==='ambush'?0.75:1)*(G.t-(t.fired||-1e9)<1200?1.4:1);if(rnd()<p){G.rq[side].push({at:G.t+60,id:t.id,x:t.x,y:t.y,t:G.t,q:0.5,by:u.id});n++;}});
        (M.obs||(M.obs={}))[e.key]=G.t;if(n)logE(side,'ai','火力偵察：'+placeTxt(e.x,e.y)+'有 '+n+' 個敵軍單位暴露位置',e.x,e.y,u.id);});return false;});});});}
function v11Say(X,key,cool,txt,d){var M=cmMem(X),K=M.say||(M.say={});if(key&&K[key]&&G.t-K[key]<cool)return false;if(key)K[key]=G.t;aiSay(X,txt,d);var L=M.lg||(M.lg=[]);L.push({t:G.t,txt:txt});if(L.length>30)L.splice(0,L.length-30);return true;}
function pcPos(g){return isLeaf(g)?[g.x,g.y]:(cOf(g)||[g.x,g.y]);}
/* 偵察或火力偵察期間，其餘部隊守在原地（沒有命令的才補一道就地防禦） */
function holdPos(X){var M=cmMem(X);if(M.dp&&G.t-M.dp.t<6*3600)return;var Fr=cmFrame(X.side,X.cmi||0);docPieces(X).forEach(function(g){if(g.ord&&g.ord.st!=='done')return;var p=pcPos(g);issue(g,'defend',{x:p[0],y:p[1],face:Fr?Fr.fd:homeDir(X.side)+PI,opt:{post:'hasty'}});});}
function condWP(X){if(X.lvl<1||X.post!=='attack')return false;var ap=cmMem(X).ap;if(ap&&(ap.ph==='exec'||ap.ph==='expl')&&G.t-ap.tE<8*3600)return true;if(attackOn(X))return false;return wpPieces(X).length>0;}
function actWP(X){var M=cmMem(X),ap=M.ap,P=X.P;if(ap&&(ap.ph==='exec'||ap.ph==='expl')&&G.t-ap.tE<8*3600)return wpRun(X,ap);
  wpFront(X);
  if(!ap||ap.ph==='done'||ap.ph==='exec'||ap.ph==='expl'||G.t-ap.t0>6*3600)ap=M.ap={t0:G.t,ph:'eval',rr:0,rs:X.cfg.rs,minR:X.cfg.rs==='rbf'?(WPMINR[P.t]||1):0};
  var ev=wpEval(X);if(!ev||!ev.best){if(ap.ph==='eval'&&!ap.rr)M.ap=null;return false;}X.ev=ev;ap.cand=ev.S.slice(0,6).map(function(c){return {x:c.x,y:c.y,est:Math.round(c.est),E:Math.round(c.E),U:Math.round(c.U*100)/100,unk:c.unk};});
  /* 偵察：依個性決定要不要偵察、偵察幾輪（直接莽的不偵察；火力偵察至少要做幾輪；多派偵察要把最可疑的方向看清楚） */
  /* 還沒查明的通道如果「樂觀估計」比目前最佳的還弱，就值得先偵察 */var conf=1-Math.max(ev.S[0].U,(ev.S[1]||ev.S[0]).U),rs=ap.rs,unk=ev.L.some(function(c){return c.U>0.5&&c.opt<ev.best.v;}),need=rs==='scout'?(conf<0.6||unk)&&ap.rr<3:rs==='rbf'?(ap.rr<ap.minR||conf<0.5||unk)&&ap.rr<5:false;
  if(need){if(ap.tR&&G.t-ap.tR<(rs==='rbf'?1500:2700)){holdPos(X);return true;}ap.ph=rs;if(rs==='rbf'?wpRBF(X,ap,ev):wpScout(X,ap,ev)){holdPos(X);return true;}/* 沒有偵察兵可派：改以火力偵察或試探攻擊 */if(rs==='scout'&&ap.rr<2&&wpRBF(X,ap,ev)){holdPos(X);return true;}ap.noRec=1;}
  var b=ev.best,md=wpMode(X,ev);ap.x=b.x;ap.y=b.y;ap.m=md.m;ap.mwhy=md.why;ap.est=Math.round(b.est);ap.E=Math.round(b.E);ap.U=b.U;ap.r=md.r;ap.ph='go';
  if(X.tm&&ap.m!=='raid'){var H=tmPropose(X,ap);if(H)ap.H=H;}
  return wpExec(X,ap,ev);}
function wpWhy(ap){return '研判'+placeTxt(ap.x,ap.y)+'是敵軍的薄弱處（看到的兵力約 '+fmt(ap.E)+' 人'+(ap.est>ap.E?'，加上未查明部分估計約 '+fmt(ap.est)+' 人':'')+'，情報可信度 '+pct((1-ap.U)*100)+(ap.noRec&&ap.U>0.5?'；沒有可派的偵察兵，只能依現有情報':'')+'）';}
function nmL(L,n){n=n||4;var a=L.map(uName);return a.length>n?a.slice(0,n-1).join('、')+'等 '+a.length+' 個單位':a.join('、');}
function wpExec(X,ap,ev){var P=X.P,side=X.side,tg=[ap.x,ap.y],Fr=ev.Fr,pcs=wpPieces(X),prep=P.t==='reck'?0:Math.max(P.prep||0,ap.m==='break'?20:10),H=ap.H||G.t+prep*60+600,dir=Math.atan2(tg[1]-Fr.C[1],tg[0]-Fr.C[0]),lx=-Math.sin(dir),ly=Math.cos(dir),txt='';if(!pcs.length)return false;ap.H=H;ap.tE=G.t;ap.mine=1;ap.e1=[];ap.e2=[];ap.fx=[];
  var fire=cmFire(X,function(u){return dist(u.x,u.y,tg[0],tg[1])<indOf(u,ST(u))*0.95;});
  if(ap.m==='raid'){var R=cmUnits(side,X.cmi||0,function(u){return /rec|cav|inf|mech/.test(clsOf(u))&&pieceFree(u)&&strFrac(u)>0.6&&!engNow(u)&&dist(u.x,u.y,tg[0],tg[1])<15000;}).sort(function(a,b){return (clsOf(a)==='rec'||clsOf(a)==='cav'?0:1)-(clsOf(b)==='rec'||clsOf(b)==='cav'?0:1)||dist(a.x,a.y,tg[0],tg[1])-dist(b.x,b.y,tg[0],tg[1]);}).slice(0,P.t==='gue'?3:2),T2=ev.S.slice(0,2);
    if(!R.length)return false;R.forEach(function(u,j){var t=T2[j%T2.length];issue(u,'attack',{x:t.x,y:t.y,opt:{tac:'raid',tol:20,pace:'careful'}});ap.e1.push(u.id);});if(fire[0])issue(fire[0],'bombard',{x:tg[0],y:tg[1],r:600,dur:600,then:'support'});ap.raidN=(ap.raidN||0)+1;ap.tRaid=G.t;
    v11Say(X,'wpgo',1200,'襲擾：'+wpWhy(ap)+'；兵力比不足以決戰（約 '+fx(ap.r,1)+' 比 1）或依個性偏好消耗戰，派'+R.map(uName).join('、')+'輪番襲擊'+(fire[0]?'，'+uName(fire[0])+'實施擾亂射擊':'')+'，主力保持防禦',{why:'raid',x:tg[0],y:tg[1]});return true;}
  if(/flank|pincer|turn/.test(ap.m)){var mt=wpManeuver(X,ap,ev,fire,prep);if(!mt){ap.m='break';}else{aiAir(X,{x:ap.tf[0],y:ap.tf[1]});ap.ph='exec';mt+=wpFeint(X,ap,ev,ap.H);v11Say(X,'wpgo',1200,mt+(ap.jp?'（與友軍聯合攻勢）':''),{why:ap.m,x:ap.x,y:ap.y});return true;}}
  if(ap.m==='assault'){var keep=P.res>0.3&&pcs.length>=4&&P.t!=='reck'?1:0,A=pcs.slice(0,pcs.length-keep),W=Math.max(900,sum(A,frontW)*0.8);
    A.forEach(function(g,j){var off=(j-(A.length-1)/2)*W/Math.max(1,A.length),p=validPos({dom:'land'},tg[0]+lx*off,tg[1]+ly*off),o=aiOpts(g,'attack',{tac:P.t==='reck'?'frontal':'firemove'});o.prep=prep;issue(g,'attack',{x:p[0],y:p[1],hHour:H,opt:o});ap.e1.push(g.id);});
    txt='總攻：'+wpWhy(ap)+'；全部 '+A.length+' 個部隊'+(keep?'（留一個預備隊）':'')+'於 '+tTxt(H).slice(-5)+' 同時發起攻擊';}
  else{var mob=pcs.filter(isMob),fixed=pcs.filter(function(g){return !isMob(g);}),n1=Math.max(1,Math.ceil(pcs.length*0.4)),e1=(fixed.length?fixed:pcs).slice(0,n1),rest=pcs.filter(function(g){return e1.indexOf(g)<0;}),e2=rest.filter(isMob).slice(0,2);if(!e2.length&&rest.length)e2=rest.slice(0,1);var fix=rest.filter(function(g){return e2.indexOf(g)<0;}).slice(0,2),Wn=Math.max(500,sum(e1,frontW)*0.5);
    e1.forEach(function(g,j){var off=(j-(e1.length-1)/2)*Wn/Math.max(1,e1.length),p=validPos({dom:'land'},tg[0]+lx*off,tg[1]+ly*off),o=aiOpts(g,'attack',{});o.tac=isLeaf(g)?'frontal':'break';o.prep=prep;o.tol=Math.max(o.tol||40,50);issue(g,'attack',{x:p[0],y:p[1],hHour:H,opt:o});ap.e1.push(g.id);});
    var as=validPos({dom:'land'},tg[0]-Math.cos(dir)*2200,tg[1]-Math.sin(dir)*2200);e2.forEach(function(g,j){issue(g,'reserve',{x:as[0]+lx*(j-0.5)*600,y:as[1]+ly*(j-0.5)*600});ap.e2.push(g.id);});
    if(P.agg>=0.4)fix.forEach(function(g){var gp=pcPos(g),c=ev.S.filter(function(q){return dist(q.x,q.y,tg[0],tg[1])>2000;}).sort(function(a,b){return dist(a.x,a.y,gp[0],gp[1])-dist(b.x,b.y,gp[0],gp[1]);})[0];if(!c)return;issue(g,'attack',{x:c.x,y:c.y,hHour:H,opt:{tac:'feint',tol:20}});ap.fx.push(g.id);});
    txt='突破：'+wpWhy(ap)+'；第一梯隊'+nmL(e1)+'在約 '+kmTxt(Wn)+'的狹窄正面突擊'+(e2.length?'，第二梯隊'+nmL(e2)+'在後方待命、突破後穿插擴張':'')+(ap.fx.length?'，'+nmL(fix.slice(0,ap.fx.length))+'在其他方向佯攻牽制':'')+'；H 時 '+tTxt(H).slice(-5);}
  fire.forEach(function(f,j){if(j>=4)return;issue(f,prep>0?'bombard':'support',prep>0?{x:tg[0],y:tg[1],r:ap.m==='break'?450:800,dur:Math.max(600,H-G.t),then:'support'}:{});});aiAir(X,{x:tg[0],y:tg[1]});ap.ph='exec';txt+=wpFeint(X,ap,ev,H);
  v11Say(X,'wpgo',1200,txt+(ap.jp?'（與友軍聯合攻勢）':''),{why:ap.m,x:tg[0],y:tg[1]});return true;}
/* 攻擊進行中：突破成功就投入第二梯隊穿插；失敗或時間太久就停止；襲擾則輪番進行 */
function wpRun(X,ap){var side=X.side,tg=[ap.x,ap.y],ids=function(L){return (L||[]).map(uById).filter(function(u){return u&&alive(u);});};
  if(ap.m==='raid'){if((ap.raidN||0)>=5||G.t-ap.tE>6*3600){ap.ph='done';return false;}if(G.t-(ap.tRaid||0)<3000)return true;var ev=wpEval(X);if(!ev||!ev.best)return false;var b=ev.best;ap.x=b.x;ap.y=b.y;ap.E=Math.round(b.E);ap.est=Math.round(b.est);ap.U=b.U;ap.ph='go';return wpExec(X,ap,ev);}
  var e1=ids(ap.e1),e2=ids(ap.e2),L1=[];e1.forEach(function(g){L1=L1.concat(isLeaf(g)?[g]:leavesOf(g).filter(onMap));});
  var en=enemyPic(side,1200).filter(function(c){return c.dom==='land'&&!c.dead&&dist(c.x,c.y,tg[0],tg[1])<1200;}),enOk=en.filter(function(c){return !c.ms||c.ms==='ok';}),near=L1.some(function(u){return dist(u.x,u.y,tg[0],tg[1])<1500;}),f1=L1.length?sum(L1,strFrac)/L1.length:0;
  if(G.t>ap.H+1200&&near&&!enOk.length){if(ap.ph==='exec'){ap.ph='expl';ap.tX=G.t;wpRes(X,tg);if(ap.m==='break'&&e2.length){var deep=wpDeep(X,tg);e2.forEach(function(g){issue(g,'penetrate',{x:deep[0],y:deep[1],opt:{tol:45}});});
        v11Say(X,'wpx',3600,'突破成功：'+placeTxt(tg[0],tg[1])+'的敵軍已被擊潰或撤退，第二梯隊'+e2.map(uName).join('、')+'穿插向'+placeTxt(deep[0],deep[1])+'擴張戰果',{why:'exploit'});}
      else v11Say(X,'wpx',3600,{assault:'總攻得手：已控制',break:'突破得手：已控制',flank:'側翼攻勢得手：已從側面攻佔',pincer:'鉗形攻勢合圍：兩翼在',turn:'迂迴成功：機動部隊已抵達敵後的'}[ap.m]+placeTxt(tg[0],tg[1])+(ap.m==='pincer'?'會合，被圍的敵軍退路已斷':ap.m==='turn'?'，威脅敵軍的砲兵、補給與退路':''),{why:'win'});}
    if(G.t-(ap.tX||G.t)>3*3600){ap.ph='done';return false;}return true;}
  if(G.t>ap.H+4*3600&&ap.ph==='exec'||f1&&f1<0.45){ap.ph='done';e2.forEach(function(g){if(g.ord&&g.ord.k==='reserve')issue(g,'defend',{x:pcPos(g)[0],y:pcPos(g)[1],opt:{post:'hasty'}});});
    v11Say(X,'wpf',3600,(OAN[ap.m]?OAN[ap.m][0]:'攻擊')+'受挫：'+placeTxt(tg[0],tg[1])+'的敵軍仍在抵抗'+(f1?'，第一梯隊兵力剩約 '+pct(f1*100):'')+'，停止攻擊、重新研判',{why:'fail'});return false;}
  return true;}
/* 突破口打開後：預備隊投入擴大戰果（主力總攻） */
function wpRes(X,tg){var dp=cmMem(X).dp;if(!dp||!dp.roles||X.P.agg<0.35)return;var R=Object.keys(dp.roles).filter(function(id){return /^(res|strike)$/.test(dp.roles[id]);}).map(function(id){return uById(+id);}).filter(function(g){return g&&alive(g)&&aiControls(g)&&freeOrd(g);});if(!R.length)return;var deep=wpDeep(X,tg);R.forEach(function(g){issue(g,'penetrate',{x:deep[0],y:deep[1],opt:{tol:45}});});
  v11Say(X,'wpr',3600,'突破口已經打開：在後方待命的預備隊'+nmL(R)+'投入，向'+placeTxt(deep[0],deep[1])+'擴大戰果（主力總攻）',{why:'exploit'});}
/* 穿插的縱深目標：突破口後方的敵軍砲兵、指揮所、補給設施，或尚未奪取的目標 */
function wpDeep(X,tg){var side=X.side,Fr=cmFrame(side,X.cmi||0),fd=Fr?Fr.fd:homeDir(side)+PI,soft=enemyPic(side,3600).filter(function(c){return c.dom==='land'&&/art|rkt|hq|sup/.test(c.br||'')&&dist(c.x,c.y,tg[0],tg[1])<10000&&dist(c.x,c.y,tg[0],tg[1])>1500;}).sort(function(a,b){return dist(a.x,a.y,tg[0],tg[1])-dist(b.x,b.y,tg[0],tg[1]);})[0];if(soft)return [soft.x,soft.y];
  var ob=(G.obj||[]).filter(function(o){return objTgt(side,o)&&dist(o.x,o.y,tg[0],tg[1])<12000;}).sort(function(a,b){return dist(a.x,a.y,tg[0],tg[1])-dist(b.x,b.y,tg[0],tg[1]);})[0];if(ob)return [ob.x,ob.y];return validPos({dom:'land'},tg[0]+Math.cos(fd)*5000,tg[1]+Math.sin(fd)*5000);}

/* ---------- 六、防禦：依準則部署（彈性、機動、縱深、前沿、刺蝟、遲滯、反斜面），敵軍突入時依準則反應 ---------- */
function docFree(u){if(!aiControls(u)||!alive(u)||u.irr)return false;if(isLeaf(u)&&ancBusy(u))return false;var L=isLeaf(u)?[u]:leavesOf(u).filter(onMap);if(!L.length)return false;if(isLeaf(u)?v11Busy(u):L.filter(v11Busy).length>L.length/2)return false;if(u.pend&&u.pend.length)return false;var o=u.ord;
  if(o&&/attack|storm|breakthrough|crossing|penetrate|pursue|siege|joint|landing|airlift|airdrop|recon/.test(o.k)&&o.st!=='done'&&G.t-(o.t1||o.ti||0)<6*3600)return false;return true;}
function docPieces(X){var G1=X.groups.filter(function(g){return /man|rec/.test(roleOf(g))&&!isLeaf(g)&&docFree(g);});if(G1.length>=3)return G1;return cmUnits(X.side,X.cmi||0,function(u){return /man|rec/.test(roleOf(u))&&!isEng(u)&&docFree(u);});}
/* 防區內可做據點的地方：城鎮、目標點；不夠時沿防線每三公里取一點 */
function docStrongPts(X,A){var MP=G.map,fx=Math.cos(A.fd),fy=Math.sin(A.fd),lx=-fy,ly=fx,T=function(x,y){return (x-A.C[0])*fx+(y-A.C[1])*fy;},S=function(x,y){return (x-A.C[0])*lx+(y-A.C[1])*ly;},inB=function(x,y){var t=T(x,y),s=S(x,y);return t>-6000&&t<1200&&s>A.S0-3000&&s<A.S1+3000;},out=[];
  (MP.set||[]).filter(function(q){return inB(q.x*MP.cs,q.y*MP.cs);}).sort(function(a,b){return (b.pop||0)-(a.pop||0);}).forEach(function(q){out.push({x:q.x*MP.cs,y:q.y*MP.cs,n:q.name||''});});
  (G.obj||[]).filter(function(o){return inB(o.x,o.y);}).forEach(function(o){out.unshift({x:o.x,y:o.y,n:o.name||''});});
  var keep=[];out.forEach(function(q){if(keep.every(function(k){return dist(k.x,k.y,q.x,q.y)>2500;}))keep.push(q);});
  for(var s=A.S0;s<=A.S1+1;s+=3000){var p=validPos({dom:'land'},A.C[0]+lx*s-fx*500,A.C[1]+ly*s-fy*500);if(keep.every(function(k){return dist(k.x,k.y,p[0],p[1])>2500;}))keep.push({x:p[0],y:p[1],n:''});}return keep;}
/* 主陣地前方是否有稜線（可以改採反斜面陣地） */
function hillsBehind(A){var MP=G.map,fx=Math.cos(A.fd),fy=Math.sin(A.fd),e=function(t){var s=0,n=0;for(var l=-1;l<=1;l++){var x=A.C[0]+fx*t-fy*l*800,y=A.C[1]+fy*t+fx*l*800;if(x<0||y<0||x>=MP.Wm||y>=MP.Hm)continue;s+=MP.el[cellAt(x,y)];n++;}return n?s/n:0;};return e(-1200)>e(-2500)+15;}
function docPick(X,pcs,Fr){var dd=X.cfg.dd,P=X.P,R=X.cm,auto=!R||!R.dd||R.dd==='auto',dp0=cmMem(X).dp,mob=pcs.filter(isMob).length,why='',en=X.en||[],ev=sum(en,function(c){return (c.veh||0)*8;}),em=sum(en,function(c){return (c.men||0)+(c.veh||0)*8;});
  if(auto){if(dd==='mobile'&&(!mob||pcs.length<3)){dd=pcs.length>=3?'depth':'forward';why='缺少機動部隊';}
    if(dd==='elastic'&&pcs.length<3){dd='forward';why='兵力不足以分成前沿與主陣地';}
    if(X.ratio<0.45&&P.hold<0.7&&dd!=='delay'){dd='delay';why='敵我兵力懸殊';}
    else if(dd!=='hedgehog'&&!mob&&em>0&&ev/em>0.5&&P.hold>=0.4&&pcs.length>=2){dd='hedgehog';why='敵軍以裝甲為主、我方缺乏機動部隊';}
    if(dd==='depth'&&pcs.length<2)dd='forward';
    /* 已經依某個準則部署：除非兵力懸殊要改採遲滯，否則六小時內不換準則 */if(dp0&&dp0.k!==dd&&G.t-dp0.t<6*3600&&dd!=='delay'){dd=dp0.k;why=dp0.why;}}
  return {k:dd,why:why};}
/* ---------- 六之二、全線部署：分區、重要程度、兵種與精銳程度的分配、預備隊 ----------
   整條前線都要有兵力：每位指揮官負責一段防區（同一方的指揮官依兵力比例劃分），防區再切成約 3.5 公里寬的地段，
   依「重要程度」（交戰、敵軍兵力、目標、道路鐵路、地形是否利於裝甲）分出主戰場與安靜地段：
   主戰場由精銳、聯合兵種依防禦準則部署；安靜地段由步兵、警備或騎兵各自構工駐守（兵力不夠時一個單位守兩段）；
   多出來的兵力轉為預備隊，在大本營附近或交通便利的地方待命，只有在某處遭到攻擊（機動防禦）、敵軍迂迴（反包圍）或我方突破成功（擴大戰果）時才投入。 */
function sdFrame(side){var MP=G.map,fd=homeDir(side)+PI,fx=Math.cos(fd),fy=Math.sin(fd),lx=-fy,ly=fx,O=[MP.Wm/2,MP.Hm/2],C=[[0,0],[MP.Wm,0],[0,MP.Hm],[MP.Wm,MP.Hm]],S=C.map(function(p){return (p[0]-O[0])*lx+(p[1]-O[1])*ly;}),T=C.map(function(p){return (p[0]-O[0])*fx+(p[1]-O[1])*fy;});
  return {O:O,fd:fd,fx:fx,fy:fy,lx:lx,ly:ly,S0:Math.min.apply(null,S)+1200,S1:Math.max.apply(null,S)-1200,T0:Math.min.apply(null,T),T1:Math.max.apply(null,T)};}
function sdPt(D,s,t){return [D.O[0]+D.lx*s+D.fx*t,D.O[1]+D.ly*s+D.fy*t];}
function sdS(D,x,y){return (x-D.O[0])*D.lx+(y-D.O[1])*D.ly;}
function sdT(D,x,y){return (x-D.O[0])*D.fx+(y-D.O[1])*D.fy;}
/* 某個橫向位置的前線：控制圖上本方控制區的前緣；沒有控制圖時用附近本方部隊的前緣 */
function sdFront(side,D,s,own){var F=G.front,MP=G.map;if(F&&F.own&&F.init){var last=null;for(var t=D.T0;t<=D.T1;t+=400){var p=sdPt(D,s,t);if(p[0]<0||p[1]<0||p[0]>=MP.Wm||p[1]>=MP.Hm)continue;var k=Math.floor(p[1]/F.cs)*F.W+Math.floor(p[0]/F.cs);if(F.own[k]===side)last=t;else if(last!==null)break;}if(last!==null)return last-200;}
  var T=own.filter(function(u){return Math.abs(sdS(D,u.x,u.y)-s)<4000;}).map(function(u){return sdT(D,u.x,u.y);}).sort(function(a,b){return a-b;});if(!T.length)T=own.map(function(u){return sdT(D,u.x,u.y);}).sort(function(a,b){return a-b;});return T.length?T[Math.floor((T.length-1)*0.85)]:0;}
/* 防區：同一方的指揮官依兵力比例、由左到右劃分整條前線 */
function sdAOR(side,i){var L=cmList(side),D=sdFrame(side);if(L.length<2)return [D.S0,D.S1];var B=tmB(side);if(B.aor&&G.t-B.aor.t<3600&&B.aor.n===L.length&&B.aor.L[i])return B.aor.L[i];
  var R=L.map(function(R0,j){var U=cmUnits(side,j);return {j:j,s:U.length?sum(U,function(u){return sdS(D,u.x,u.y);})/U.length:0,w:cmAlive(side,j)?Math.max(1,cmM(side,j)):0};}).sort(function(a,b){return a.s-b.s;}),tot=sum(R,function(q){return q.w;})||1,acc=D.S0,out=[];
  R.forEach(function(q){var w=(D.S1-D.S0)*q.w/tot;out[q.j]=[acc,acc+w];acc+=w;});B.aor={t:G.t,n:L.length,L:out};return out[i];}
function sdRoads(x,y,R){var MP=G.map,best=0,rl=0;brushCells(MP,x/MP.cs,y/MP.cs,Math.max(1,R/MP.cs/2),function(k){var r=MP.rd[k]||0;if(r>best)best=r;if(MP.rl&&(MP.rl[k]&1))rl=1;});return Math.min(1.5,[0,0.2,0.6,1][Math.min(3,best)]+rl*0.4);}
/* 地形利不利於車輛：開闊 +1、困難 −1 */
function sdTerr(D,P,ws){var pf=pfFor(lgY()>=1916?4:1),MP=G.map,n=0,a=0;for(var l=-1;l<=1;l++)for(var t=0;t<=2;t++){var x=P[0]+D.lx*l*ws*0.3+D.fx*t*800,y=P[1]+D.ly*l*ws*0.3+D.fy*t*800;if(x<0||y<0||x>=MP.Wm||y>=MP.Hm)continue;var k=cellAt(x,y);n++;a+=isWater(MP.lc[k])?0:(pf.off[k]||0);}return n?clamp(a/n*2-1,-1,1):0;}
/* 地段與重要程度 */
function sdSectors(side,D,aor,own){var W=aor[1]-aor[0];if(W<500)return [];var n=clamp(Math.round(W/3500),1,10),ws=W/n,out=[],en=enemyPic(side,3600).filter(function(c){return c.dom==='land'&&!c.dead;}),obs=G.obj||[];
  for(var j=0;j<n;j++){var s=aor[0]+(j+0.5)*ws,tf=sdFront(side,D,s,own),p0=sdPt(D,s,tf),P=validPos({dom:'land'},p0[0],p0[1]),E=0,bat=0;
    en.forEach(function(c){var cs=sdS(D,c.x,c.y),ct=sdT(D,c.x,c.y);if(Math.abs(cs-s)<ws*0.75&&ct>tf-3000&&ct<tf+8000){E+=(c.men||0)+(c.veh||0)*8;if(G.t-c.t<1200&&ct<tf+3000)bat++;}});
    var fight=own.some(function(u){return Math.abs(sdS(D,u.x,u.y)-s)<ws*0.75&&(G.t-(u.uf||-1e9)<1800||engNow(u));}),ob=obs.filter(function(o){return Math.abs(sdS(D,o.x,o.y)-s)<ws*0.75+2000&&Math.abs(sdT(D,o.x,o.y)-tf)<7000;}),rd=sdRoads(P[0],P[1],1500),ter=sdTerr(D,P,ws);
    var I=1+(fight||bat>=2?2:bat?1:0)+1.5*Math.min(1,E/1500)+1.5*sum(ob,function(o){return (o.pts||10)/20;})+0.8*rd+0.5*ter;
    out.push({j:j,s:s,ws:ws,tf:tf,P:P,E:Math.round(E),fight:!!(fight||bat>=2),obj:ob.map(function(o){return o.name;}),rd:rd,ter:ter,I:Math.max(0.3,Math.round(I*100)/100)});}
  return out;}
/* 單位的精銳程度與兵種 */
function pcQual(g){var L=isLeaf(g)?[g]:leavesOf(g).filter(onMap);if(!L.length)return 0;var f=sum(L,strFrac)/L.length,tr=sum(L,function(u){return u.trn||ST(u).trn||50;})/L.length,mo=sum(L,function(u){return u.mor||50;})/L.length,ex=sum(L,function(u){return u.exp||0;})/L.length;return f*(0.5+tr/100)*(0.5+mo/100)*(1+ex*0.05);}
function pcKind(g){var L=isLeaf(g)?[g]:leavesOf(g).filter(onMap),c={};L.forEach(function(u){var k=clsOf(u);c[k]=(c[k]||0)+1;});var arm=(c.arm||0)+(c.mech||0),inf=(c.inf||0)+(c.mot||0)+(c.pike||0)+(c.sec||0)+(c.vg||0)+(c.gue||0),cav=(c.cav||0)+(c.rec||0);return {arm:arm,inf:inf,cav:cav,at:c.at||0,mix:arm>0&&inf>0,mob:isMob(g),n:L.length};}
/* 預備隊的位置：主戰場後方，交通便利（公路交會、鐵路）、隱蔽、靠近大本營的地方 */
function hubSite(X,D,q,back){var side=X.side,MP=G.map,T=cmTop(side,X.cmi||0),hq=T&&T.hqS?[T.hqS.x,T.hqS.y]:null,best=null,bs=-1e9;
  for(var l=-3000;l<=3000;l+=1000)for(var t=-1500;t<=1500;t+=750){var p=sdPt(D,q.s+l,q.tf-back+t);if(p[0]<600||p[1]<600||p[0]>MP.Wm-600||p[1]>MP.Hm-600)continue;var k=cellAt(p[0],p[1]),c=MP.lc[k];if(isWater(c))continue;var rd=sdRoads(p[0],p[1],600),sc=rd*2+(1-LC[c][5])*0.8-Math.abs(l)/3000*0.6+(hq&&dist(p[0],p[1],hq[0],hq[1])<3000?0.6:0)-(knownEn(side,p[0],p[1],3000)>0?5:0);if(sc>bs){bs=sc;best={x:p[0],y:p[1],rd:rd,c:c,hq:hq&&dist(p[0],p[1],hq[0],hq[1])<3000};}}
  if(!best){var p2=validPos({dom:'land'},sdPt(D,q.s,q.tf-back)[0],sdPt(D,q.s,q.tf-back)[1]);return {x:p2[0],y:p2[1],why:''};}var v=validPos({dom:'land'},best.x,best.y);return {x:v[0],y:v[1],why:best.rd>=1?'公路交會處':best.rd>=0.6?'公路旁':best.hq?'大本營附近':LC[best.c][5]<0.5?'隱蔽處':''};}
function dpRole(dp,u){if(!dp||!u)return '';var c=u,n=0;while(c&&n<10){if(dp.roles[c.id])return dp.roles[c.id];c=c.p>=0?uById(c.p):null;n++;}return '';}
function docOrd(g,k,p,face,post,w){g.v11d=G.t;var o={x:p[0],y:p[1]};if(k==='reserve'){issue(g,'reserve',o);return;}o.face=face;if(w&&!isLeaf(g))o.w=w;if(k==='delay'){issue(g,'delay',o);return;}if(k==='screen'){o.opt={post:'hasty'};issue(g,'screen',o);return;}o.opt={post:post||'prepared'};issue(g,'defend',o);}
function docPlan(X,pcs,k,why,qOnly){var P=X.P,side=X.side,i=X.cmi||0,D=sdFrame(side),own=cmUnits(side,i),aor=sdAOR(side,i),M=cmMem(X),old=M.dp,SEC=sdSectors(side,D,aor,own);if(!SEC.length||!pcs.length)return null;
  /* 前線位置沿用上次的（部隊後撤後，前線不跟著一再後退） */if(old&&old.sec)SEC.forEach(function(q){var o=old.sec.filter(function(z){return Math.abs(z.s-q.s)<q.ws*0.5;})[0];if(o&&Math.abs(o.tf-q.tf)<3000){q.tf=o.tf;q.P=o.P;}});
  var Imax=Math.max.apply(null,SEC.map(function(q){return q.I;})),main=SEC.filter(function(q){return q.I>=Math.max(2.4,Imax*0.7);}).sort(function(a,b){return b.I-a.I;}).slice(0,2);if(!main.length)main=[SEC.slice().sort(function(a,b){return b.I-a.I;})[0]];main.forEach(function(q){q.main=1;});
  var n=pcs.length,mob=pcs.filter(isMob),hold=P.hold>0.7,pp=k==='reverse'?'reverse':hold?'holdfast':'prepared',mainMin=main.length*({elastic:2,depth:2}[k]||1),rN={elastic:Math.max(1,Math.round(n/4)),mobile:Math.max(1,mob.length),hedgehog:mob.length,forward:n>=5&&P.res>0.25?1:0,reverse:n>=5&&P.res>0.25?1:0,depth:n>=6&&P.res>0.25?1:0,delay:0}[k]||0;
  if(k==='mobile'&&mob.length>n-mainMin)rN=Math.max(1,n-mainMin);if(n<=2)rN=0;
  /* 安靜地段：依連續的地段分組；兵力不夠時把相鄰的地段合併給一個單位 */var runs=[],cur=[];SEC.forEach(function(q){if(q.main){if(cur.length)runs.push(cur);cur=[];}else cur.push(q);});if(cur.length)runs.push(cur);
  var qTot=sum(runs,function(r){return r.length;}),qc=Math.min(qTot,Math.max(0,n-mainMin-rN));if(qc<Math.min(runs.length,n-1)){qc=Math.min(runs.length,n-1);rN=Math.max(0,Math.min(rN,n-mainMin-qc));}if(n<=2)qc=Math.min(qc,n-1);/* 攻勢中：只留約三分之一的兵力守安靜地段（以少數兵力守住其餘戰線），其餘集中進攻 */if(qOnly)qc=Math.min(qc,Math.max(1,Math.floor(n/3)));
  var ga=runs.map(function(){return 0;}),rem=qc;while(rem>0){var bj=-1,bv=-1;runs.forEach(function(r,j){if(ga[j]>=r.length)return;var v=r.length/(ga[j]+1);if(v>bv){bv=v;bj=j;}});if(bj<0)break;ga[bj]++;rem--;}
  var qG=[];runs.forEach(function(r,j){var g=ga[j];for(var c=0;c<g;c++)qG.push(r.slice(Math.floor(c*r.length/g),Math.floor((c+1)*r.length/g)));});
  var pool=pcs.slice(),take=function(L){L.forEach(function(g){var x=pool.indexOf(g);if(x>=0)pool.splice(x,1);});return L;},suit=function(g){var K=pcKind(g);return (K.arm>0?-3:0)+(K.mob?-1:0)+(K.inf>0?1:0)+(K.cav>0&&!K.arm?0.5:0)-pcQual(g)*1.5;};
  var qP=take(pool.slice().sort(function(a,b){return suit(b)-suit(a);}).slice(0,qG.length)),rP=take(pool.slice().sort(function(a,b){return ((isMob(b)?2:0)+pcQual(b))-((isMob(a)?2:0)+pcQual(a));}).slice(0,rN));
  /* 主戰場：精銳優先給最重要的主戰場；兵力已經夠的話，其餘轉為預備隊 */var need=function(q){return q.ws*({elastic:1.6,depth:1.8}[k]||1.05);},mA=main.map(function(){return [];});
  pool.slice().sort(function(a,b){return pcQual(b)-pcQual(a);}).forEach(function(g){var j=0,bv=1e9;main.forEach(function(q,jj){var r=sum(mA[jj],frontW)/need(q);if(r<bv){bv=r;j=jj;}});if(bv>=1&&mA.every(function(L){return L.length>=({elastic:2,depth:2}[k]||1);})){rP.push(g);return;}mA[j].push(g);});
  var dp={k:k,t:G.t,why:why||'',aor:aor,O:D.O,fd:D.fd,sec:SEC.map(function(q){return {s:q.s,ws:q.ws,tf:q.tf,P:q.P,I:q.I,E:q.E,fight:q.fight,obj:q.obj,main:!!q.main};}),roles:{},pos:{},lines:[],pts:[],T:{}},T=dp.T;
  var face=function(p){var ec=enemyCentroid(side,p[0],p[1],12000);return ec?Math.atan2(ec[1]-p[1],ec[0]-p[0]):D.fd;},put=function(g,role,p,ord,post,w){dp.roles[g.id]=role;dp.pos[g.id]=[p[0],p[1],ord,post||'',w||0];var f=face(p);if(!qOnly||role==='quiet')docOrd(g,ord,p,f,post,w);(T[role]=T[role]||[]).push(g);};
  function line(L,q,t,role,ord,post,tag){if(!L.length)return;var Wd=Math.max(q.ws*0.9,Math.min(q.ws*1.5,sum(L,frontW)*0.9)),s0=q.s-Wd/2;L.slice().sort(function(a,b){var pa=pcPos(a),pb=pcPos(b);return sdS(D,pa[0],pa[1])-sdS(D,pb[0],pb[1]);}).forEach(function(g,j){var p0=sdPt(D,s0+(j+0.5)*Wd/L.length,q.tf+t),p=validPos({dom:'land'},p0[0],p0[1]);put(g,role,p,ord,post,Wd/L.length);});dp.lines.push({a:sdPt(D,s0,q.tf+t),b:sdPt(D,s0+Wd,q.tf+t),k:tag||role});}
  main.forEach(function(q,jj){var L=mA[jj];if(!L.length)return;var byQ=L.slice().sort(function(a,b){return pcQual(a)-pcQual(b);});
    if(k==='forward'||k==='reverse'||k==='mobile')line(L,q,0,k==='mobile'?'fix':'line','defend',k==='mobile'?(hold?'holdfast':'prepared'):pp,'main');
    else if(k==='depth'){var n2=L.length>=2?Math.max(1,Math.round(L.length/3)):0,sec2=byQ.slice(0,n2);line(L.filter(function(g){return sec2.indexOf(g)<0;}),q,0,'line','defend','prepared','main');line(sec2,q,-2500,'second','defend','prepared','second');}
    else if(k==='elastic'){var no=L.length>=2?Math.max(1,Math.round(L.length/3)):0,out=L.slice().sort(function(a,b){var ra=pcKind(a).cav>0&&!pcKind(a).arm?0:isMob(a)?2:1,rb=pcKind(b).cav>0&&!pcKind(b).arm?0:isMob(b)?2:1;return ra-rb||pcQual(a)-pcQual(b);}).slice(0,no);line(out,q,0,'out','delay',null,'out');line(L.filter(function(g){return out.indexOf(g)<0;}),q,-2500,'main','defend',hillsBehind({C:q.P,fd:D.fd})?'reverse':'prepared','main');}
    else if(k==='hedgehog'){var SP=docStrongPts(X,{C:q.P,fd:D.fd,S0:-q.ws/2,S1:q.ws/2}).slice(0,L.length),left=L.slice();SP.forEach(function(sp){if(!left.length)return;left.sort(function(a,b){var pa=pcPos(a),pb=pcPos(b);return dist(pa[0],pa[1],sp.x,sp.y)-dist(pb[0],pb[1],sp.x,sp.y);});var g=left.shift();put(g,'hh',[sp.x,sp.y],'defend','strong');dp.pts.push({x:sp.x,y:sp.y,k:'hh',n:sp.n});});if(left.length)line(left,q,-1500,'line','defend','prepared','main');}
    else{line(L,q,0,'delay','delay',null,'delay');dp.lines.push({a:sdPt(D,q.s-q.ws/2,q.tf-3500),b:sdPt(D,q.s+q.ws/2,q.tf-3500),k:'next'});}});
  /* 安靜地段：步兵、警備自己構工駐守；騎兵與偵察部隊擔任警戒 */qG.forEach(function(G2,j){var g=qP[j];if(!g)return;var s=sum(G2,function(q){return q.s;})/G2.length,tf=sum(G2,function(q){return q.tf;})/G2.length,Wd=sum(G2,function(q){return q.ws;}),p0=sdPt(D,s,tf-300),p=validPos({dom:'land'},p0[0],p0[1]),K=pcKind(g),scr=K.cav>0&&!K.inf&&!K.arm;
    put(g,'quiet',p,scr?'screen':'defend',k==='delay'?'delay':'prepared',Wd*0.9);dp.lines.push({a:sdPt(D,s-Wd/2,tf-300),b:sdPt(D,s+Wd/2,tf-300),k:'quiet'});});
  /* 預備隊：交通便利或大本營附近 */if(rP.length){var q0=main[0],hub=hubSite(X,D,q0,k==='mobile'?5500:4500),rr=k==='mobile'?'strike':'res';dp.hub=hub;rP.forEach(function(g,j){var off=(j-(rP.length-1)/2)*700,p=validPos({dom:'land'},hub.x+D.lx*off,hub.y+D.ly*off);put(g,rr,p,'reserve');});dp.pts.push({x:hub.x,y:hub.y,k:rr,n:hub.why});}
  /* 防區的邊界（組隊時）與砲兵 */if(tmOn(side))[aor[0],aor[1]].forEach(function(s){var tf=sdFront(side,D,s,own);dp.lines.push({a:sdPt(D,s,tf+1500),b:sdPt(D,s,tf-6000),k:'aor'});});
  cmFire(X).forEach(function(f){if(f.ord&&f.ord.k==='support'&&f.ord.st!=='done')return;issue(f,'support',{});});docEng(X,dp);
  var mtxt=main.map(function(q){var r=[];if(q.fight)r.push('交戰中');if(q.obj.length)r.push('目標'+q.obj.join('、'));if(q.E>0)r.push('敵軍約 '+fmt(q.E)+' 人');if(q.rd>=0.6)r.push('交通要道');return placeTxt(q.P[0],q.P[1])+(r.length?'（'+r.join('、')+'）':'');}).join('、'),nm=function(r){return nmL(T[r]||[]);},mainU=(T.line||[]).concat(T.out||[],T.main||[],T.second||[],T.fix||[],T.hh||[],T.delay||[]);
  if(qOnly){dp.atk=1;v11Say(X,'docA',3*3600,'全線部署（攻勢中）：防區分成 '+SEC.length+' 段，'+(T.quiet&&T.quiet.length?'安靜地段由'+nm('quiet')+'各自構工駐守，':'')+'其餘兵力集中在主攻方向',{why:'doc',k:'atk'});return dp;}
  v11Say(X,'doc'+k,2*3600,'全線部署（'+DDN[k][0]+(dp.why?'，'+dp.why:'')+'）：防區分成 '+SEC.length+' 段，主戰場在'+mtxt+'，由'+nmL(mainU)+'依'+DDN[k][0]+'部署'+(T.quiet&&T.quiet.length?'；其餘 '+(SEC.length-main.length)+' 段安靜地段由'+nm('quiet')+'各自構工駐守':'')+((T.res||T.strike)?'；預備隊'+nm(k==='mobile'?'strike':'res')+'在'+placeTxt(dp.hub.x,dp.hub.y)+(dp.hub.why?'（'+dp.hub.why+'）':'')+'待命，有地段遭到攻擊或突破成功時才投入':''),{why:'doc',k:k});return dp;}
/* 工兵依準則構築：據點的半永久工事、第二道防線或主陣地 */
function docEng(X,dp){var M=cmMem(X);if(G.t-(M.docEngT||-1e9)<4*3600)return;var e=cmUnits(X.side,X.cmi||0,function(u){return isEng(u)&&aiControls(u)&&freeOrd(u)&&!v11Busy(u);})[0];if(!e)return;var L=dp.lines.filter(function(l){return l.k==='second'||l.k==='main';}),p=null,bk='pos';
  if(dp.k==='hedgehog'){var h=dp.pts.filter(function(q){return q.k==='hh';})[0];if(h){p=[h.x,h.y];bk=lgY()>=1700?'semi':'pos';}}else if(L.length){var l=L[L.length-1];p=[(l.a[0]+l.b[0])/2,(l.a[1]+l.b[1])/2];bk=dp.k==='depth'||dp.k==='forward'?'semi':'pos';}if(!p||enemyNear(X.side,p[0],p[1],3000,'land')>0)return;M.docEngT=G.t;issue(e,'build',{x:p[0],y:p[1],bk:bk,face:dp.fd});}
function condDoc(X){return X.lvl>=1&&docPieces(X).length>0;}
/* 主戰場是否轉移：最近的交戰不在原本的主戰場 */
function docShift(X,dp){var D=sdFrame(X.side),c=enemyPic(X.side,1200).filter(function(q){if(q.dom!=='land'||q.dead)return false;var s=sdS(D,q.x,q.y);return s>dp.aor[0]-2000&&s<dp.aor[1]+2000;});if(c.length<2)return false;var sc=sum(c,function(q){return sdS(D,q.x,q.y);})/c.length;return !dp.sec.some(function(q){return q.main&&Math.abs(q.s-sc)<q.ws*1.2;});}
function actDoc(X){var M=cmMem(X),pcs=docPieces(X);if(!pcs.length)return false;var pk=docPick(X,pcs,null),k=pk.k,dp=M.dp;
  if(dp&&dp.sec&&dp.k===k&&G.t-dp.t<6*3600&&pcs.filter(function(g){return !dpRole(dp,g);}).length<2&&!(G.t-dp.t>3600&&docShift(X,dp))){docRefill(X,dp,pcs);return true;}var nd=docPlan(X,pcs,k,pk.why);if(!nd)return false;M.dp=nd;return true;}
/* 沒有任務的部隊回到部署的位置（前沿與安靜地段等敵軍離開後才重新前出） */
function docRefill(X,dp,pcs){pcs.forEach(function(g){var q=dp.pos[g.id];if(!q)return;if(g.ord&&g.ord.st!=='done'&&G.t-(g.v11d||-1e9)<6*3600)return;if((q[2]==='delay'||dp.roles[g.id]==='quiet')&&enemyNear(X.side,q[0],q[1],2500,'land')>0)return;var p=pcPos(g);if(dist(p[0],p[1],q[0],q[1])<500&&g.ord&&g.ord.st!=='done')return;var D=sdFrame(X.side),ec=enemyCentroid(X.side,q[0],q[1],12000);docOrd(g,q[2],[q[0],q[1]],ec?Math.atan2(ec[1]-q[1],ec[0]-q[0]):D.fd,q[3],q[4]);});}
/* ---------- 六之三、預備隊的投入：機動防禦、反擊、反包圍；可能被佯攻欺騙 ---------- */
var FREC={smart:0.65,cmd:0.55,caut:0.45,def:0.45,gue:0.4,fire:0.35,bal:0.35,logi:0.3,cons:0.3,man:0.25,reck:0.1};
/* 該處進攻的敵軍是不是佯攻（依敵軍實際的命令判斷；看穿與否取決於指揮官的個性） */
function feintAt(side,x,y){var n=0,f=0;gridNear(x,y,3500,function(e){if(e.side===side||!onMap(e)||ST(e).dom!=='land'||dist(e.x,e.y,x,y)>3500)return;var o=e.ord;if(!o||!/attack/.test(o.k))return;n++;if(o.opt&&o.opt.tac==='feint')f++;});return n>0&&f>=n*0.5;}
function condDocR(X){var dp=cmMem(X).dp;return X.lvl>=1&&!!dp&&!!dp.sec&&G.t-dp.t<12*3600;}
function actDocR(X){var M=cmMem(X),dp=M.dp,P=X.P,side=X.side,D=sdFrame(side),en=enemyPic(side,1200).filter(function(c){return c.dom==='land'&&!c.dead&&c.ms!=='rout';}),str=function(L){return sum(L,function(c){return (c.men||0)+(c.veh||0)*8;});};
  var role=function(r){return Object.keys(dp.roles).filter(function(id){return dp.roles[id]===r;}).map(function(id){return uById(+id);}).filter(function(g){return g&&alive(g)&&aiControls(g);});},resAll=role('res').concat(role('strike')),resF=resAll.filter(freeOrd);
  /* 反擊三小時後回到原位 */if(dp.caT&&G.t-dp.caT>3*3600){resAll.concat(role('second')).forEach(function(g){if(g.ord&&g.ord.k==='attack'&&g.ord.st!=='done'&&G.t-(g.ord.t1||g.ord.ti||0)<3*3600)return;var q=dp.pos[g.id];if(q)docOrd(g,q[2],[q[0],q[1]],D.fd,q[3],q[4]);});dp.caT=null;}
  if(dp.caT&&G.t-dp.caT<1800)return false;var secAt=function(x,y){var s=sdS(D,x,y),b=null,bd=1e18;dp.sec.forEach(function(q){var d=Math.abs(q.s-s);if(d<bd){bd=d;b=q;}});return b;};
  var commit=function(L,c,E,txt,tac){if(!L.length)return false;if(feintAt(side,c[0],c[1])){if(rnd()<(FREC[P.t]||0.3)){if(!(dp.fk&&G.t-dp.fk<3600)){dp.fk=G.t;v11Say(X,'feint',3600,'研判'+placeTxt(c[0],c[1])+'的敵軍只是佯攻（火力多、兵力少、不肯接近），預備隊按兵不動',{why:'feint'});}return false;}dp.fooled={x:c[0],y:c[1],t:G.t};}
    L.forEach(function(g,j){var gp=pcPos(g),sg=sdS(D,c[0],c[1])>sdS(D,gp[0],gp[1])?-1:1,via=validPos({dom:'land'},c[0]+D.lx*sg*(j%2?-1:1)*1800-D.fx*900,c[1]+D.ly*sg*(j%2?-1:1)*1800-D.fy*900);issue(g,'attack',{x:c[0],y:c[1],via:[[via[0],via[1]]],opt:Object.assign(aiOpts(g,'attack',{}),{tac:tac||'frontal',tol:Math.max(P.tol||35,40)})});});dp.caT=G.t;dp.ca={x:c[0],y:c[1]};v11Say(X,'docR',1500,txt,{why:'counter'});return true;};
  /* 1. 反包圍：敵軍迂迴到本方防線後方或防區外側 */var beh=en.filter(function(c){var s=sdS(D,c.x,c.y),t=sdT(D,c.x,c.y),q=secAt(c.x,c.y);return q&&s>dp.aor[0]-3000&&s<dp.aor[1]+3000&&t<q.tf-2500;});
  if(beh.length&&str(beh)>=150&&resF.length){var cb=centroid(beh);if(commit(resF.slice(0,2),cb,str(beh),'反包圍：敵軍約 '+fmt(str(beh))+' 人迂迴到我軍防線後方（'+placeTxt(cb[0],cb[1])+'），預備隊'+nmL(resF.slice(0,2))+'從外側包抄，切斷他們的退路'))return true;}
  /* 2. 主戰場依準則反應 */var main=dp.sec.filter(function(q){return q.main;});for(var mi=0;mi<main.length;mi++){var q=main[mi],band=function(t0,t1,m){return en.filter(function(c){var t=sdT(D,c.x,c.y)-q.tf,s=sdS(D,c.x,c.y);return t>=t0&&t<=t1&&Math.abs(s-q.s)<q.ws/2+(m||1500);});};
    if(dp.k==='elastic'){var pen=band(-3000,600);if(pen.length&&str(pen)>=80){var E=str(pen),c1=centroid(pen);if(sum(resF,cmW)<E*0.7&&!pen.some(function(c){return c.ms==='shaken';})){if(X.tm)tmHelp(X,c1,'catk',E);}else if(commit(resF,c1,E,'彈性防禦：敵軍約 '+fmt(E)+' 人突入前沿與主陣地之間（'+placeTxt(c1[0],c1[1])+'），預備隊'+nmL(resF)+'從側面反擊、恢復前沿'))return true;}}
    if(dp.k==='mobile'){var pen2=band(-12000,-400,2500);if(pen2.length&&(str(pen2)>=120)){var c2=centroid(pen2),E2=str(pen2);if(commit(resF,c2,E2,'機動防禦：敵軍約 '+fmt(E2)+' 人突入'+placeTxt(c2[0],c2[1])+'，打擊部隊'+nmL(resF)+(resF.length>1?'從兩翼':'從側翼')+'出擊，趁敵軍立足未穩時殲滅')){if(X.tm&&E2>sum(resF,cmW)*1.2)tmHelp(X,c2,'catk',E2);return true;}}}
    if(dp.k==='depth'&&P.agg>=0.45){var pen3=band(-2400,-500),R3=role('second').filter(function(g){return freeOrd(g)&&strengthOf(g).f>0.7;}).slice(0,1);if(pen3.length&&R3.length){var c3=centroid(pen3);issue(R3[0],'attack',{x:c3[0],y:c3[1],opt:{tac:'frontal',tol:P.tol}});dp.caT=G.t;dp.ca={x:c3[0],y:c3[1]};v11Say(X,'docR',1800,'縱深防禦：敵軍突破第一線（'+placeTxt(c3[0],c3[1])+'），第二線的'+uName(R3[0])+'實施局部反擊',{why:'counter'});return true;}}}
  if(dp.k==='hedgehog'){var enc=role('hh').filter(function(g){var L=isLeaf(g)?[g]:leavesOf(g).filter(onMap);return L.some(function(u){return u.encT!==undefined&&G.t-u.encT<1800||u.besieged!==undefined&&u.besieged!==false&&G.t-u.besieged<1800;});})[0];
    if(enc){var p4=pcPos(enc),R4=resF.concat(role('line').filter(freeOrd))[0];if(!R4||P.agg<0.3){v11Say(X,'hhw',3600,'刺蝟據點：'+uName(enc)+'在'+placeTxt(p4[0],p4[1])+'被包圍，固守待援'+(X.tm?'，向友軍請求解圍':''),{why:'hh'});if(X.tm)tmHelp(X,p4,'reinf',0);}else{issue(R4,'attack',{x:p4[0],y:p4[1],opt:{tac:'frontal',tol:P.tol}});dp.caT=G.t;dp.ca={x:p4[0],y:p4[1]};v11Say(X,'docR',1800,'刺蝟據點：'+uName(enc)+'被包圍，派'+uName(R4)+'解圍',{why:'relief'});return true;}}}
  /* 3. 安靜地段遭到攻擊：守軍抵擋不住時，預備隊機動增援（機動防禦） */var qs=role('quiet');for(var qi=0;qi<qs.length;qi++){var g=qs[qi],gp=pcPos(g),q2=dp.pos[g.id],Wd=q2&&q2[4]||3000,at=en.filter(function(c){return Math.abs(sdS(D,c.x,c.y)-sdS(D,gp[0],gp[1]))<Wd/2+1000&&dist(c.x,c.y,gp[0],gp[1])<4000;}),E3=str(at),L3=isLeaf(g)?[g]:leavesOf(g).filter(onMap),bad=L3.some(function(u){return u.ms==='rout'||u.encT!==undefined&&G.t-u.encT<1800;});
    if(!at.length||E3<Math.max(150,cmW(g)*1.5)&&!bad)continue;var c5=centroid(at);if(resF.length){if(commit(resF.slice(0,Math.max(1,Math.ceil(resF.length/2))),c5,E3,'機動防禦：安靜地段'+placeTxt(gp[0],gp[1])+'遭到約 '+fmt(E3)+' 人攻擊（守軍'+uName(g)+'抵擋不住），預備隊'+nmL(resF.slice(0,Math.max(1,Math.ceil(resF.length/2))))+'前往反擊'))return true;}else if(X.tm){tmHelp(X,c5,'reinf',E3);}}
  return false;}

/* ---------- 七、後勤經營風格：基本補給線之外，依偏好擴建後方體系 ---------- */
var MGP={depot:['depot','base','med'],base:['base','depot','med','air'],air:['air','depot','base'],fort:['fort','depot','med'],road:['road','depot','base'],med:['med','depot','base'],min:[]};
var MGK={depot:'增設補給站',base:'擴建後方基地',air:'闢建野戰機場',fort:'構築工事',road:'修建道路與橋梁',med:'開設野戰醫院'};
function mgEng(X,p){var side=X.side;return cmUnits(side,X.cmi||0,function(u){return isEng(u)&&aiControls(u)&&freeOrd(u)&&!v11Busy(u)&&!engNow(u)&&enemyNear(side,u.x,u.y,4000,'land')===0;}).sort(function(a,b){return p?dist(a.x,a.y,p[0],p[1])-dist(b.x,b.y,p[0],p[1]):0;})[0]||null;}
function mgSup(X,p){var side=X.side;return cmUnits(side,X.cmi||0,function(u){return ST(u).fl.indexOf('l')>=0&&aiControls(u)&&freeOrd(u)&&!u.v10dep&&!v11Busy(u)&&enemyNear(side,u.x,u.y,4000,'land')===0;}).sort(function(a,b){return dist(a.x,a.y,p[0],p[1])-dist(b.x,b.y,p[0],p[1]);})[0]||null;}
function mgSafe(side,p){return enemyNear(side,p[0],p[1],5000,'land')===0&&knownEn(side,p[0],p[1],5000)===0;}
function mgPt(Fr,s,back){var p=frPt(Fr,s,Fr.t1-back);p=roadNear(p[0],p[1],1200);return validPos({dom:'land'},p[0],p[1]);}
function mgInBand(Fr,x,y,b0,b1){var s=frS(Fr,x,y),t=frT(Fr,x,y);return s>Fr.s0-5000&&s<Fr.s1+5000&&t<Fr.t1-(b0||1500)&&t>Fr.t1-(b1||24000);}
function mgDepots(X,Fr){return nodesOf(X.side).filter(function(N){return N.k==='depot'&&!N.only&&mgInBand(Fr,N.x,N.y);});}
function mgFac(side,k,x,y,R){return (G.fac||[]).some(function(F){return F.k===k&&!F.dead&&F.own===side&&dist(F.x,F.y,x,y)<R;});}
function mgBuild(X,e,p,bk,why){e.v11job=G.t+3*3600;issue(e,'build',{x:p[0],y:p[1],bk:bk,face:cmFrame(X.side,X.cmi||0).fd});return why+'（工兵'+uName(e)+'在'+placeTxt(p[0],p[1])+'構築'+(BLD[bk]?BLD[bk][0]:bk)+'）';}
var MGDO={
 depot:function(X,Fr,st){var D=mgDepots(X,Fr),want=clamp(1+Math.round(Fr.W/6000),2,5)+(st==='depot'?1:0);if(D.length>=want)return null;var best=null,bs=-1;for(var s=Fr.s0;s<=Fr.s1+1;s+=1500){var p=mgPt(Fr,s,7000);if(!mgSafe(X.side,p))continue;var dmin=D.length?Math.min.apply(null,D.map(function(N){return dist(N.x,N.y,p[0],p[1]);})):1e5;if(dmin>bs){bs=dmin;best=p;}}if(!best||bs<4000)return null;
   var su=mgSup(X,best);if(su){su.v10dep={x:best[0],y:best[1],lv:2,t:G.t};issue(su,'move',{x:best[0],y:best[1],opt:{pace:'normal',road:1}});return '增設補給站（防區內 '+D.length+'／'+want+' 處；'+uName(su)+'前往'+placeTxt(best[0],best[1])+'開設）';}var e=mgEng(X,best);return e?mgBuild(X,e,best,'depot','增設補給站（防區內 '+D.length+'／'+want+' 處）'):null;},
 base:function(X,Fr){var D=mgDepots(X,Fr).sort(function(a,b){return frT(Fr,a.x,a.y)-frT(Fr,b.x,b.y);}),B=D[0];if(!B||frT(Fr,B.x,B.y)>Fr.t1-6000){var p=mgPt(Fr,(Fr.s0+Fr.s1)/2,11000);if(!mgSafe(X.side,p))return null;var su=mgSup(X,p);if(su){su.v10dep={x:p[0],y:p[1],lv:2,t:G.t};issue(su,'move',{x:p[0],y:p[1],opt:{road:1}});return '建立後方基地（'+uName(su)+'前往'+placeTxt(p[0],p[1])+'開設基地補給站）';}var e0=mgEng(X,p);return e0?mgBuild(X,e0,p,'depot','建立後方基地'):null;}
   var hd=homeDir(X.side),q=validPos({dom:'land'},B.x+Math.cos(hd)*700,B.y+Math.sin(hd)*700),e=mgEng(X,q);if(!e)return null;
   if(!mgFac(X.side,'ammo',B.x,B.y,2500))return mgBuild(X,e,q,'ammoD','後方基地「'+B.name+'」旁設置彈藥庫');if(lgY()>=1914&&awNeedFuel(X.side)&&!mgFac(X.side,'tank',B.x,B.y,2500))return mgBuild(X,e,[q[0]+300,q[1]+300],'fuel','後方基地「'+B.name+'」旁設置油庫');
   if(!mgFac(X.side,'hosp',B.x,B.y,6000))return mgBuild(X,e,[q[0]-300,q[1]+300],'fhosp','後方基地「'+B.name+'」旁開設野戰醫院');return null;},
 air:function(X,Fr,st){if(!featOn('airfield'))return null;var p=mgPt(Fr,(Fr.s0+Fr.s1)/2,12000),A=nodesOf(X.side).filter(function(N){return N.k==='air'&&dist(N.x,N.y,p[0],p[1])<35000;}),want=st==='air'?2:(awNeedAir(X.side)?1:0);if(A.length>=want)return null;var M=cmMem(X);if(G.t-(M.airT||-1e9)<8*3600)return null;
   if(A.length)p=mgPt(Fr,(Fr.s0+Fr.s1)/2+(A.length%2?-1:1)*5000,12000);if(!mgSafe(X.side,p))return null;var e=mgEng(X,p);if(!e)return null;M.airT=G.t;return mgBuild(X,e,p,'sair','闢建野戰機場（防區後方 '+A.length+'／'+want+' 座）');},
 fort:function(X,Fr){var M=cmMem(X),dp=M.dp,MP=G.map,pts=[];if((M.fortN||0)>=10)return null;if(dp){dp.pts.filter(function(q){return q.k==='hh';}).forEach(function(q){pts.push([q.x,q.y,'semi']);});dp.lines.forEach(function(l){if(l.k==='main'||l.k==='second'||l.k==='line')for(var f=0.2;f<0.9;f+=0.3)pts.push([l.a[0]+(l.b[0]-l.a[0])*f,l.a[1]+(l.b[1]-l.a[1])*f,l.k==='second'?'pos':'semi']);});}
   else for(var s=Fr.s0;s<=Fr.s1+1;s+=2000)pts.push(frPt(Fr,s,Fr.t1-300).concat(['pos']));
   var y=lgY(),cand=pts.filter(function(q){var k=cellAt(q[0],q[1]);return MP.ft[k]===0&&enemyNear(X.side,q[0],q[1],3000,'land')===0;})[0];if(!cand)return null;var e=mgEng(X,cand);if(!e)return null;M.fortN=(M.fortN||0)+1;return mgBuild(X,e,cand,y<1700&&cand[2]==='semi'?'pos':cand[2],'構築工事（第 '+M.fortN+' 處）');},
 road:function(X,Fr){var side=X.side,D=mgDepots(X,Fr).sort(function(a,b){return frT(Fr,b.x,b.y)-frT(Fr,a.x,a.y);})[0],M=cmMem(X);
   if(D&&!D.road&&!D.rdq&&mgSafe(side,[D.x,D.y])){var fp=frPt(Fr,frS(Fr,D.x,D.y),Fr.t1-1200),e=mgEng(X,[D.x,D.y]);if(e){var P=findPath({dom:'land',mobi:3,vr:30,vx:8,fl:''},D.x,D.y,fp[0],fp[1],{max:40000});if(P&&P.pts){var MP=G.map,cells=[],seen={};for(var i=2;i<P.pts.length;i+=2){var x0=P.pts[i-2],y0=P.pts[i-1],x1=P.pts[i],y1=P.pts[i+1],n2=Math.max(1,Math.ceil(dist(x0,y0,x1,y1)/(MP.cs*0.5)));for(var j=0;j<=n2;j++){var kk=cellAt(x0+(x1-x0)*j/n2,y0+(y1-y0)*j/n2);if(!seen[kk]&&MP.rd[kk]<2&&!isWater(MP.lc[kk])){seen[kk]=1;cells.push(kk);}}}
       if(cells.length){D.rdq=cells;D.rdBy=e.id;D.rdKm=P.km||cells.length*MP.cs/1000;e.v11job=G.t+6*3600;issue(e,'move',{x:D.x,y:D.y});return '修建從「'+D.name+'」通往前線的補給道路（約 '+fmt(D.rdKm,1)+' 公里，由'+uName(e)+'施工）';}}D.road=1;}}
   var ec=Fr.ec,rv=ec?riverOnAxis(Fr.C,ec):null;if(rv&&!bridgeNearPt(rv[0],rv[1],3000)&&G.t-(M.brT||-1e9)>8*3600){var e2=mgEng(X,rv);if(e2&&friendNear(side,rv[0],rv[1],3000)>0){M.brT=G.t;e2.v11job=G.t+4*3600;issue(e2,'bridge',{x:rv[0],y:rv[1],bt:'auto',opt:{bt:'auto'}});return '在主要方向的河川上架橋（'+uName(e2)+'，'+placeTxt(rv[0],rv[1])+'）';}}
   if(D&&lgY()>=1914&&awNeedFuel(side)&&!mgFac(side,'tank',D.x,D.y,2500)){var e3=mgEng(X,[D.x,D.y]);if(e3){var hd=homeDir(side);return mgBuild(X,e3,validPos({dom:'land'},D.x+Math.cos(hd)*600,D.y+Math.sin(hd)*600),'fuel','在「'+D.name+'」旁設置油庫');}}return null;},
 med:function(X,Fr,st){var side=X.side,want=st==='med'?2:1,H=(G.fac||[]).filter(function(F){return F.k==='hosp'&&!F.dead&&F.own===side&&mgInBand(Fr,F.x,F.y,2000,30000);});if(H.length>=want)return null;var p=mgPt(Fr,(Fr.s0+Fr.s1)/2+(H.length?(H.length%2?-1:1)*4000:0),9000);if(!mgSafe(side,p)||enemyNear(side,p[0],p[1],8000,'land')>0)return null;var e=mgEng(X,p);return e?mgBuild(X,e,p,'fhosp','開設野戰醫院（防區後方 '+H.length+'／'+want+' 所）'):null;}};
function condMg(X){if(X.lvl<1||!G.started||G.t<1800)return false;var st=X.cfg.ms;if(st==='min'){if(!cmMem(X).minT){cmMem(X).minT=G.t;v11Say(X,'min',24*3600,'後勤經營（以戰養戰）：只維持最低限度的後勤，優先奪取敵軍的補給站、油庫與彈藥庫',{why:'mg'});}return false;}
  if(X.me&&X.me.f<0.3)return false;var M=cmMem(X);return G.t-(M.mgT||-1e9)>=(st==='depot'||st==='fort'?3600:5400);}
function actMg(X){var st=X.cfg.ms,M=cmMem(X),Fr=cmFrame(X.side,X.cmi||0);if(!Fr)return false;M.mgT=G.t;var L=MGP[st]||[];for(var i=0;i<L.length;i++){var r=MGDO[L[i]](X,Fr,st);if(r){(M.mgN=M.mgN||{})[L[i]]=(M.mgN[L[i]]||0)+1;v11Say(X,'',0,'後勤經營（'+MGN[st][0]+'）：'+r,{why:'mg',k:L[i]});return true;}}return false;}
/* 依經營風格調整部隊自動構工的速度與門檻（第九版的自動構工） */
var CMCF={k:'',m:{}};
function cmCfgC(side,i){var k=G.step+'|'+(G._cmv||0);if(CMCF.k!==k){CMCF.k=k;CMCF.m={};}var q=side+'|'+i;return CMCF.m[q]||(CMCF.m[q]=cmCfg(side,i));}
awStyle=function(u,k){if(!G||!u)return 1;var m=cmCfgC(u.side,cmOf(u)).ms;if(m==='min')return k==='fort'?1:0.6;var map={fort:'fort',depotN:'depot',med:'med',base:'base',air:'air',road:'road'};return map[k]===m?(k==='fort'?1.6:2.5):1;};

/* ---------- 八、盟軍：通信、協同等級、聯合攻勢與聯合防禦 ---------- */
var TMLV=['各自為戰','互相通報','協同作戰','聯合指揮'],TMLVD=['各自依自己的判斷作戰','交換態勢與企圖，協防彼此之間的接合部','互相請求並提供火力與預備隊支援','以同一個 H 時發起聯合攻勢、聯合反擊'];
function tmB(side){var S=G.sides[side];return S.tb||(S.tb={q:[],seq:0,jp:null,cq:G.set.tmCq0!==undefined?+G.set.tmCq0:0.3,lv:G.set.tmCq0>=0.45?2:1,log:[],jc:{}});}
function tmLv(side){return tmOn(side)?tmB(side).lv:0;}
function tmAllies(side,i){var L=cmList(side),o=[];for(var j=0;j<L.length;j++)if(j!==i&&cmAlive(side,j))o.push(j);return o;}
function tmLog(side,txt){var B=tmB(side);B.log.push({t:G.t,txt:txt});if(B.log.length>40)B.log.splice(0,B.log.length-40);}
/* 傳遞：依兩位指揮官司令部之間的通信方式與距離計算延遲；走傳令時是地圖上的傳令兵，經過敵軍附近可能被截 */
function tmSend(side,from,to,k,d,txt,quiet){var B=tmB(side),L=cmList(side),A=cmTop(side,from),T=cmTop(side,to);if(!A||!T)return null;var h=hopDelay(A,T),m={id:++B.seq,k:k,from:from,to:to,t0:G.t,ta:G.t+h.sec+60,via:h.via,d:d||{},txt:txt||''};
  crLeg1(m,A,T,h);B.q.push(m);if(!quiet)logE(side,'req','（指揮官通信・'+VIA[h.via]+'）'+L[from].n+' → '+L[to].n+'：'+txt+'（約 '+durTxt(m.ta-G.t)+' 後送達）',A.x,A.y,A.id);tmLog(side,L[from].n+' → '+L[to].n+'（'+VIA[h.via]+'）：'+txt);return m;}
function tmMsgStep(){SIDES().forEach(function(side){if(!tmOn(side))return;var B=tmB(side);if(!B.q.length)return;var due=B.q.filter(function(m){return G.t>=m.ta;});if(!due.length)return;B.q=B.q.filter(function(m){return G.t<m.ta;});
  due.forEach(function(m){var L=cmList(side);if(m.lost){logE(side,'req','傳令在途中失蹤：'+L[m.from].n+'給'+L[m.to].n+'的訊息沒有送達');tmLog(side,'⚠ 傳令失蹤：'+m.txt);B.cq=Math.max(0,B.cq-0.03);return;}try{tmRecv(side,m);}catch(e){console.error(e);}});});}
function tmRecv(side,m){var L=cmList(side),R=L[m.to],F=L[m.from],d=m.d,B=tmB(side);if(!R||!F)return;var T=cmTop(side,m.to),A=cmTop(side,m.from);if(!T||!A)return;
  if(m.k==='intent'){var M=R.mem||(R.mem={});(M.peers=M.peers||{})[m.from]=Object.assign({t:G.t},d);return;}
  if(m.k==='jrep'||m.k==='hrep'){if(m.k==='jrep'&&B.jp&&B.jp.id===d.pid){B.jp.parts[m.from]=Object.assign(B.jp.parts[m.from]||{},{role:d.role,ack:G.t});if(d.role!=='no')B.cq=Math.min(1,B.cq+0.04);}if(m.k==='hrep'&&d.ok)B.cq=Math.min(1,B.cq+0.03);logE(side,'req',R.n+'收到'+F.n+'的回覆：'+m.txt,T.x,T.y,T.id);return;}
  if(!R.ai){/* 玩家指揮官：以請求的形式送到收件匣，由玩家決定 */var rk=m.k==='jatk'?'attack':d.need==='fires'?'fires':d.need==='cover'?'hold':d.need==='catk'?'attack':'reinf';(G.inbox=G.inbox||[]).push({id:(G.mid=(G.mid||0)+1),t:G.t,side:side,k:'req',rk:rk,from:A.id,to:T.id,x:m.k==='jatk'?d.tx:d.x,y:m.k==='jatk'?d.ty:d.y,txt:F.n+'：'+m.txt,tm:{pid:d.pid,from:m.from,to:m.to,k:m.k}});if(G.onPause&&apOn('req'))G.onPause('友軍指揮官來訊');return;}
  var prev=G._cc;G._cc={side:side,i:m.to,ai:true};try{if(m.k==='jatk')tmDecideJ(side,m);else if(m.k==='help')tmDecideH(side,m);}finally{G._cc=prev;}}
/* 收到聯合攻勢提議：依個性與自己的處境決定參加的方式 */
function tmDecideJ(side,m){var i=m.to,d=m.d,B=tmB(side),L=cmList(side),C=cmCfg(side,i),P=C.P,me=cmStr(side,i),own=cmUnits(side,i),c=own.length?centroid(own):null,thr=c?knownEn(side,c[0],c[1],6000):0,mine=cmM(side,i),role=d.role,why='';
  if(!B.jp||B.jp.id!==d.pid){return;}if(me.f<0.4||!c){role='no';why='本身戰力只剩 '+pct(me.f*100);}
  else if(P.t==='cons'&&mine<thr*2){role='fires';why='兵力不足，只提供火力支援';}
  else if(P.t==='caut'&&mine<thr*1.2){role='fires';why='先以火力支援，部隊暫不出擊';}
  else if(P.t==='gue'){role='raid';why='以小部隊襲擾配合';}
  else if(thr>mine*1.3&&P.t!=='reck'){role='fires';why='自己的防區也受到威脅';}
  /* 擔任火力支援要有射程內的砲兵；沒有就改以小部隊牽制 */if(role==='fires'&&!cmUnits(side,i,function(u){return roleOf(u)==='fire'&&indOf(u,ST(u))>dist(u.x,u.y,d.x,d.y)*1.05;}).length){if(P.agg>=0.3&&me.f>=0.4){role='fix';why=(why?why+'；':'')+'沒有射程內的砲兵，改以小部隊牽制';}else{role='no';why='沒有射程內的砲兵';}}
  var part={role:role,H:d.H,x:d.tx,y:d.ty,mx:d.x,my:d.y,ack:G.t};if(P.t==='reck'&&role!=='no'&&rnd()<0.4){part.H=G.t;why='（性急，提前出擊）';}B.jp.parts[i]=part;
  var nm={fix:'在自己的正面同時發起牽制攻擊',follow:'派機動部隊跟進主攻、擴張戰果',fires:'以砲兵支援主攻',raid:'以小部隊襲擾敵軍後方',no:'無法參加'}[role];
  tmSend(side,i,m.from,'jrep',{pid:d.pid,role:role},(role==='no'?'拒絕聯合攻勢：':'同意聯合攻勢：')+nm+(why?'（'+why+'）':''));}
/* 收到支援請求：火力、增援、聯合反擊或協防 */
function tmDecideH(side,m){var i=m.to,d=m.d,C=cmCfg(side,i),P=C.P,own=cmUnits(side,i),c=own.length?centroid(own):null,ok=false,txt='';
  var reply=function(o,t){tmSend(side,i,m.from,'hrep',{ok:o},(o?'同意：':'拒絕：')+t);};if(!c){reply(false,'沒有部隊');return;}var me=cmStr(side,i),thr=knownEn(side,c[0],c[1],6000);
  if(me.f<0.4){reply(false,'本身戰力只剩 '+pct(me.f*100));return;}if(thr>cmM(side,i)*0.8&&P.t!=='cmd'){reply(false,'自己的防區也受到威脅');return;}if(P.t==='cons'&&d.need!=='fires'&&rnd()<0.6){reply(false,'不願分散兵力');return;}
  if(d.need==='fires'||d.need==='catk'){var F=cmUnits(side,i,function(u){return roleOf(u)==='fire'&&indOf(u,ST(u))>dist(u.x,u.y,d.x,d.y)&&aiControls(u)&&!(u.pend&&u.pend.length);}).slice(0,2);
    if(F.length){F.forEach(function(f){issue(f,'bombard',{x:d.x,y:d.y,r:600,dur:1800,then:'support'});});ok=true;txt=F.map(uName).join('、')+'對'+placeTxt(d.x,d.y)+'射擊';}if(d.need==='fires'){reply(ok,ok?txt:'沒有射程內的砲兵');return;}}
  if(d.need==='catk'&&P.agg<0.35&&!ok){reply(false,'不願離開陣地反擊');return;}
  var pc=cmUnits(side,i,function(u){return /man|rec/.test(roleOf(u))&&!isEng(u)&&aiControls(u)&&freeOrd(u)&&!v11Busy(u)&&!engNow(u)&&u.ms==='ok'&&strFrac(u)>0.6&&dist(u.x,u.y,d.x,d.y)<16000;}).sort(function(a,b){var ra=a.ord&&a.ord.k==='reserve'?0:1,rb=b.ord&&b.ord.k==='reserve'?0:1;return ra-rb||dist(a.x,a.y,d.x,d.y)-dist(b.x,b.y,d.x,d.y);}),n=d.need==='catk'&&P.agg>=0.55?2:1,G2=pc.slice(0,n);
  if(!G2.length){reply(ok,ok?txt:'沒有可抽調的部隊');return;}G2.forEach(function(u){if(d.need==='catk')issue(u,'attack',{x:d.x,y:d.y,opt:{tac:'frontal',tol:P.tol}});else issue(u,d.need==='cover'?'screen':'defend',{x:d.x,y:d.y,opt:{post:'hasty'}});u.v11jc=G.t;});
  reply(true,(txt?txt+'；':'')+'派'+G2.map(uName).join('、')+(d.need==='catk'?'參加聯合反擊':d.need==='cover'?'協防':'增援')+'（'+placeTxt(d.x,d.y)+'）');}
/* 請求友軍支援：最靠近的友軍指揮官 */
function tmHelp(X,p,need,E){var side=X.side;if(!X.tm||tmLv(side)<2||!p)return false;var M=cmMem(X);if(G.t-(M.helpT||-1e9)<2*3600)return false;var al=tmAllies(side,X.cmi);if(!al.length)return false;
  var j=al.slice().sort(function(a,b){var A=cmFrame(side,a),Bf=cmFrame(side,b);return (A?dist(A.C[0],A.C[1],p[0],p[1]):1e9)-(Bf?dist(Bf.C[0],Bf.C[1],p[0],p[1]):1e9);})[0];if(need==='catk'&&tmLv(side)<3)need='reinf';M.helpT=G.t;
  var nm={reinf:'增援',fires:'火力支援',catk:'聯合反擊',cover:'協防'}[need];tmSend(side,X.cmi,j,'help',{x:p[0],y:p[1],need:need,E:E||0},'請求'+nm+'（'+placeTxt(p[0],p[1])+(E?'，敵軍約 '+fmt(E)+' 人':'')+'）');v11Say(X,'help',3600,'向友軍'+cmList(side)[j].n+'請求'+nm+'（'+placeTxt(p[0],p[1])+'）',{why:'help'});return true;}
/* 提議聯合攻勢：主攻方向與 H 時；H 時要留給訊息往返與準備 */
function tmPropose(X,ap){var side=X.side,B=tmB(side),i=X.cmi;if(B.lv<3||G.set.tmJoint===false||X.P.agg<0.3)return 0;if(B.jp&&G.t<B.jp.H+4*3600)return 0;var al=tmAllies(side,i);if(!al.length)return 0;var A=cmTop(side,i);if(!A)return 0;
  var dmax=0;al.forEach(function(j){var T=cmTop(side,j);if(T)dmax=Math.max(dmax,hopDelay(A,T,true).sec);});var prep=X.P.t==='reck'?0:Math.max(X.P.prep||0,15),H=G.t+Math.max(prep*60+600,dmax*2+900);
  var jp=B.jp={id:++B.seq,from:i,H:H,x:ap.x,y:ap.y,m:ap.m,t0:G.t,parts:{}};jp.parts[i]={role:'main',H:H,x:ap.x,y:ap.y,ack:G.t};ap.jp=jp.id;
  al.forEach(function(j){var Fr=cmFrame(side,j);if(!Fr)return;var near=dist(Fr.C[0],Fr.C[1],ap.x,ap.y)<9000,mob=cmUnits(side,j,isMob).length>0,role=near&&mob?'follow':'fix',tp=role==='follow'?validPos({dom:'land'},ap.x-Math.cos(Fr.fd)*2500,ap.y-Math.sin(Fr.fd)*2500):validPos({dom:'land'},frPt(Fr,(Fr.s0+Fr.s1)/2,Fr.t1+2500)[0],frPt(Fr,(Fr.s0+Fr.s1)/2,Fr.t1+2500)[1]);
    jp.parts[j]={role:role,pend:1};tmSend(side,i,j,'jatk',{pid:jp.id,H:H,x:ap.x,y:ap.y,role:role,tx:tp[0],ty:tp[1]},'提議聯合攻勢：H 時 '+tTxt(H).slice(-5)+'，主攻'+placeTxt(ap.x,ap.y)+'；請貴部'+(role==='follow'?'派機動部隊跟進、擴張戰果':'同時在'+placeTxt(tp[0],tp[1])+'發起牽制攻擊'));});
  v11Say(X,'jp',3600,'向友軍提議聯合攻勢：H 時 '+tTxt(H).slice(-5)+'，主攻方向'+placeTxt(ap.x,ap.y)+'，由'+al.map(function(j){return cmList(side)[j].n;}).join('、')+'在其他方向同時牽制或跟進',{why:'joint'});return H;}
/* 執行聯合攻勢中分配到的角色 */
function condJRole(X){if(!X.tm)return false;var B=tmB(X.side),jp=B.jp;if(!jp||G.t>jp.H+3*3600)return false;var p=jp.parts[X.cmi];if(!p||p.role==='main'||p.role==='no'||p.pend)return false;if(p.done&&!(p.role==='follow'&&!p.done2))return false;var lead=p.role==='follow'?1800:p.role==='fires'?1200:900;return G.t>=(p.H||jp.H)-lead;}
function actJRole(X){var side=X.side,B=tmB(side),jp=B.jp,p=jp.parts[X.cmi],H=p.H||jp.H,L=cmList(side),main=L[jp.from],ok=false,txt='';
  if(p.role==='fires'){var F=cmFire(X,function(u){return dist(u.x,u.y,jp.x,jp.y)<indOf(u,ST(u))*0.95;});F.slice(0,3).forEach(function(f){issue(f,'bombard',{x:jp.x,y:jp.y,r:700,dur:Math.max(900,H-G.t+600),then:'support'});});ok=F.length>0;txt=ok?F.map(uName).join('、')+'對主攻方向'+placeTxt(jp.x,jp.y)+'實施火力準備':'沒有射程內的砲兵';p.done=G.t;}
  else if(p.role==='fix'){var pc=wpPieces(X).slice(0,2);pc.forEach(function(g){issue(g,'attack',{x:p.x,y:p.y,hHour:H,opt:{tac:'feint',tol:25}});});ok=pc.length>0;txt=ok?pc.map(uName).join('、')+'於 H 時（'+tTxt(H).slice(-5)+'）在'+placeTxt(p.x,p.y)+'發起牽制攻擊':'沒有可用的部隊';p.done=G.t;}
  else if(p.role==='raid'){var R=cmUnits(side,X.cmi,function(u){return /rec|cav|inf/.test(clsOf(u))&&pieceFree(u)&&strFrac(u)>0.6;}).slice(0,2);R.forEach(function(u){issue(u,'attack',{x:p.x,y:p.y,hHour:H,opt:{tac:'raid',tol:20,pace:'careful'}});});ok=R.length>0;txt=ok?R.map(uName).join('、')+'於 H 時襲擾'+placeTxt(p.x,p.y):'沒有可用的小部隊';p.done=G.t;}
  else if(p.role==='follow'){var map=main&&main.mem&&main.mem.ap;if(!p.done){var mv=wpPieces(X,isMob).slice(0,2);if(!mv.length)mv=wpPieces(X).slice(0,1);mv.forEach(function(g){issue(g,'reserve',{x:p.x,y:p.y});});p.ids=mv.map(function(g){return g.id;});ok=mv.length>0;txt=ok?mv.map(uName).join('、')+'前往'+placeTxt(p.x,p.y)+'，跟在主攻部隊後方待命':'沒有機動部隊可跟進';p.done=G.t;}
    else if(map&&map.ph==='expl'&&!p.done2){var deep=wpDeep(X,[jp.x,jp.y]),U=(p.ids||[]).map(uById).filter(function(g){return g&&alive(g);});U.forEach(function(g){issue(g,'penetrate',{x:deep[0],y:deep[1],opt:{tol:45}});});p.done2=G.t;ok=U.length>0;txt=ok?'主攻已突破，'+U.map(uName).join('、')+'穿插向'+placeTxt(deep[0],deep[1]):'';}
    else if(G.t>H+2.5*3600){p.done2=G.t;return false;}else return false;}
  if(txt)v11Say(X,'',0,'聯合攻勢（'+main.n+'主攻，H 時 '+tTxt(H).slice(-5)+'）：'+txt,{why:'joint'});if(ok)B.cq=Math.min(1,B.cq+0.02);return ok;}
/* 有友軍指揮官時：定期通報企圖、請求解危 */
function condTeam(X){return !!X.tm;}
function actTeam(X){var side=X.side,M=cmMem(X),al=tmAllies(side,X.cmi),did=false;if(!al.length)return false;
  if(G.t-(M.intT||-1e9)>2*3600){M.intT=G.t;var ap=M.ap,dp=M.dp,Fr=cmFrame(side,X.cmi),d={post:X.post,x:ap&&ap.x!==undefined&&/exec|expl|go/.test(ap.ph)?ap.x:Fr?Fr.C[0]:0,y:ap&&ap.y!==undefined&&/exec|expl|go/.test(ap.ph)?ap.y:Fr?Fr.C[1]:0,dd:dp?dp.k:'',f:X.me?X.me.f:1};
    al.forEach(function(j){if(cmList(side)[j].ai)tmSend(side,X.cmi,j,'intent',d,'通報態勢：'+(X.post==='attack'?'攻勢':'守勢')+(dp?'（'+DDN[dp.k][0]+'）':'')+(ap&&/exec|expl/.test(ap.ph)?'，正在'+OAN[ap.m][0]+placeTxt(ap.x,ap.y):''),true);});did=true;}
  if(X.threat&&X.threat.length&&!X.res){var tc=cOf(X.threat[0]);if(tc&&tmHelp(X,tc,'reinf',0))did=true;}return did;}
/* 每二十分鐘：協同等級、接合部協防、聯合攻勢的收尾 */
function tmCap(side){var L=cmList(side),al=[],w=0,n=0;for(var i=0;i<L.length;i++)if(cmAlive(side,i))al.push(cmTop(side,i));for(var a=0;a<al.length;a++)for(var b=a+1;b<al.length;b++){if(!al[a]||!al[b])continue;w=Math.max(w,hopDelay(al[a],al[b],true).sec);n++;}if(!n)return 0;return w<=900?3:w<=3600?2:1;}
function tmStep(side){var B=tmB(side),L=cmList(side),al=[];for(var i=0;i<L.length;i++)if(cmAlive(side,i))al.push(i);if(al.length<2)return;
  var gain=0,lost=0,np=0;for(var a=0;a<al.length;a++)for(var b=a+1;b<al.length;b++){var A=cmTop(side,al[a]),T=cmTop(side,al[b]);if(!A||!T)continue;np++;if(A.hqLost||T.hqLost){lost++;continue;}var h=hopDelay(A,T,true);gain+=h.via==='courier'?(dist(A.x,A.y,T.x,T.y)<8000?0.008:0.003):h.via==='wire'?0.014:0.02;}
  if(np)B.cq=clamp(B.cq+gain/np-lost*0.06/np-0.0005,0,1);var cap=tmCap(side),lv=Math.min(cap,B.cq>=0.75?3:B.cq>=0.45?2:B.cq>=0.15?1:0);
  if(lv!==B.lv){var up=lv>B.lv;B.lv=lv;logE(side,'ai',G.sides[side].name+'各指揮官之間的協同'+(up?'提升':'降低')+'為「'+TMLV[lv]+'」（等級 '+lv+'）：'+TMLVD[lv]);tmLog(side,(up?'▲ ':'▼ ')+'協同等級 '+lv+'：'+TMLV[lv]);}
  if(B.jp&&G.t>B.jp.H+4*3600){var jp=B.jp,P2=Object.keys(jp.parts).filter(function(k){return jp.parts[k].role&&jp.parts[k].role!=='no'&&jp.parts[k].role!=='main';}).length;tmLog(side,'聯合攻勢結束（'+placeTxt(jp.x,jp.y)+'，參與的友軍 '+P2+' 位）');if(P2)B.cq=Math.min(1,B.cq+0.06);(B.done=B.done||[]).push({x:jp.x,y:jp.y,H:jp.H,n:P2});if(B.done.length>10)B.done.shift();B.jp=null;}
  if(lv>=1)tmJunc(side,al);v10Merge(side);}
/* 第十版的 AI 狀態在組隊時分屬各指揮官：合併一份給地圖標記與戰況總覽顯示 */
function v10Merge(side){var S=G.sides[side],o=S.v10||(S.v10={wk:[],scr:{},rot:0,axis:null,lg:null,lgW:0}),wk=[],rot=0,axis=null,scr={},lg=null;(S.cm||[]).forEach(function(R){var V=R.mem&&R.mem.sd&&R.mem.sd.v10;if(!V)return;wk=wk.concat(V.wk||[]);rot+=V.rot||0;if(V.axis&&(!axis||V.axis.t>axis.t))axis=V.axis;Object.assign(scr,V.scr||{});if(V.lg&&(!lg||V.lg.t>lg.t))lg=V.lg;});o.wk=wk.slice(-60);o.rot=rot;o.axis=axis;o.scr=scr;o.lg=lg;}
/* 接合部：相鄰兩位指揮官的防區之間出現空隙、附近又有敵軍 → 由兵力較寬裕的一方派部隊協防 */
function tmJunc(side,al){var B=tmB(side),hd=homeDir(side)+PI,fx=Math.cos(hd),fy=Math.sin(hd),lx=-fy,ly=fx,R=[];al.forEach(function(i){var U=cmUnits(side,i,function(u){return /man|rec/.test(roleOf(u));});if(!U.length)return;var S=U.map(function(u){return u.x*lx+u.y*ly;}).sort(function(a,b){return a-b;}),T=sum(U,function(u){return u.x*fx+u.y*fy;})/U.length;R.push({i:i,a:S[Math.floor((S.length-1)*0.05)],b:S[Math.ceil((S.length-1)*0.95)],t:T,U:U});});
  R.sort(function(p,q){return (p.a+p.b)-(q.a+q.b);});for(var k=1;k<R.length;k++){var P=R[k-1],Q=R[k],gap=Q.a-P.b;if(gap<3000||gap>20000)continue;var key=P.i+'|'+Q.i;if(B.jc[key]&&G.t-B.jc[key]<4*3600)continue;var s=(P.b+Q.a)/2,t=(P.t+Q.t)/2,x=lx*s+fx*t,y=ly*s+fy*t;if(x<0||y<0||x>G.map.Wm||y>G.map.Hm)continue;var p=validPos({dom:'land'},x,y);
    if(friendNear(side,p[0],p[1],2500)>0||knownEn(side,p[0],p[1],8000)<=0)continue;B.jc[key]=G.t;var spare=function(r){return r.U.filter(function(u){return aiControls(u)&&freeOrd(u)&&!v11Busy(u)&&!engNow(u)&&u.ms==='ok';}).length;},cov=spare(P)>=spare(Q)?P:Q,oth=cov===P?Q:P,L=cmList(side);
    if(!L[cov.i].ai){tmSend(side,oth.i,cov.i,'help',{x:p[0],y:p[1],need:'cover'},'我們兩個防區之間有約 '+kmTxt(gap)+'的空隙（'+placeTxt(p[0],p[1])+'），請派部隊協防');continue;}
    var u=cov.U.filter(function(q){return aiControls(q)&&freeOrd(q)&&!v11Busy(q)&&!engNow(q)&&q.ms==='ok'&&!isEng(q);}).sort(function(a,b){return (clsOf(a)==='rec'?0:1)-(clsOf(b)==='rec'?0:1)||dist(a.x,a.y,p[0],p[1])-dist(b.x,b.y,p[0],p[1]);})[0];if(!u)continue;
    var ec=enemyCentroid(side,p[0],p[1],10000),face=ec?Math.atan2(ec[1]-p[1],ec[0]-p[0]):hd;issue(u,'screen',{x:p[0],y:p[1],face:face,opt:{post:'hasty'}});u.v11jc=G.t;B.cq=Math.min(1,B.cq+0.02);
    var txt='接合部協防：'+L[P.i].n+'與'+L[Q.i].n+'的防區之間有約 '+kmTxt(gap)+'的空隙（'+placeTxt(p[0],p[1])+'），由'+L[cov.i].n+'派'+uName(u)+'協防';logE(side,'ai',txt,p[0],p[1],u.id);tmLog(side,txt);tmSend(side,cov.i,oth.i,'intent',{post:'cover',x:p[0],y:p[1]},'已派'+uName(u)+'協防我們之間的接合部',true);}}


/* ---------- 十、司令部與大本營的選址 ----------
   電腦指揮的各級司令部不再一直跟著部隊的重心移動，而是在前線後方、依梯隊而定的距離帶裡挑選地點：
   營 0.4–1.2 公里、團 1.5–4、旅 3–6、師 6–12、軍 12–22、集團軍 20–35 公里（地圖較小時等比縮小），越高層級離戰場越遠。
   考量隱蔽（森林、城鎮）、防禦（城鎮、高地、工事）、交通（公路、鐵路）、位於所屬部隊正後方、附近沒有敵軍。
   魯莽、騎兵魂、鼓舞人心的指揮官習慣靠前指揮；謹慎的指揮官躲得更深、更重視隱蔽；後勤專家偏好交通樞紐；頑強與工兵出身的偏好易守的據點。 */
var HQBAND=[[0,0],[0.1,0.4],[0.4,1.2],[1.5,4],[3,6],[6,12],[12,22],[20,35],[30,50]];
function hqBand(F){var MP=G.map,o=offOf(F)||{},b=HQBAND[clamp(F.ech||3,1,8)],sc=clamp(Math.max(MP.Wm,MP.Hm)/60000,0.35,1),k=[b[0]*sc*1000,b[1]*sc*1000],tag='';
  if(hasQ(o,'reckless')||hasQ(o,'cavalier')||hasQ(o,'inspire')){k=[k[0]*0.25,k[1]*0.4];tag='指揮官習慣靠前指揮';}else if(hasQ(o,'careful')){k=[k[0]*1.2,k[1]*1.35];tag='指揮官謹慎、選在更深處';}return {a:k[0],b:Math.max(k[0]+300,k[1]),tag:tag,o:o};}
function hqSiteCalc(F,L){var MP=G.map,side=F.side,C=centroid(L),ec=enemyCentroid(side,C[0],C[1],40000),bd=ec?Math.atan2(C[1]-ec[1],C[0]-ec[0]):homeDir(side),fx=-Math.cos(bd),fy=-Math.sin(bd),lx=-fy,ly=fx,T=L.map(function(u){return (u.x-C[0])*fx+(u.y-C[1])*fy;}).sort(function(a,b){return a-b;}),tf=T[Math.floor((T.length-1)*0.9)],B=hqBand(F),o=B.o;
  var kc=hasQ(o,'careful')?2:1,kd=hasQ(o,'stubborn')||hasQ(o,'sapper')?2:1,kt=hasQ(o,'logist')?2:1,best=null,bs=-1e9,step=Math.max(250,(B.b-B.a)/4),lat=Math.max(1000,Math.min(3000,B.b*0.5));
  for(var d=B.a;d<=B.b+1;d+=step)for(var l=-lat;l<=lat+1;l+=lat/3){var x=C[0]+fx*(tf-d)+lx*l,y=C[1]+fy*(tf-d)+ly*l;if(x<700||y<700||x>MP.Wm-700||y>MP.Hm-700)continue;var k=cellAt(x,y),c=MP.lc[k];if(isWater(c))continue;
    var conc=1-LC[c][5],def=(isUrban(c)?0.6:0)+(MP.ft[k]>=4?0.5:MP.ft[k]?0.2:0),e0=MP.el[k],eA=0,nA=0;[[400,0],[-400,0],[0,400],[0,-400]].forEach(function(q){var x2=x+q[0],y2=y+q[1];if(x2<0||y2<0||x2>=MP.Wm||y2>=MP.Hm)return;eA+=MP.el[cellAt(x2,y2)];nA++;});if(nA&&e0>eA/nA+10)def+=0.3;
    var tr=sdRoads(x,y,500),thr=knownEn(side,x,y,3500)>0?6:0,sc=kc*conc*1.2+kd*def+kt*tr*1.3-Math.abs(l)/lat*0.6-thr;if(sc>bs){bs=sc;best={x:x,y:y,conc:conc,def:def,tr:tr,c:c,d:d};}}
  if(!best){var p=validPos(ST(F),C[0]+fx*(tf-B.a),C[1]+fy*(tf-B.a));return {x:p[0],y:p[1],t:G.t,C:C,why:B.tag};}
  var p2=validPos(ST(F),best.x,best.y),why=[];if(best.conc>0.45)why.push(LC[best.c][1]+'隱蔽');if(best.def>=0.5)why.push('易守');if(best.tr>=0.6)why.push(best.tr>=1?'交通樞紐':'臨公路');if(B.tag)why.push(B.tag);why.push('距前線約 '+kmTxt(best.d));return {x:p2[0],y:p2[1],t:G.t,C:C,why:why.join('、')};}
(function(){var b=hqStep;hqStep=function(F){if(!G.set||G.set.hqSite===false||!F||isLeaf(F)||!alive(F)||F.st==='lift'||F.st==='ship'||F.amph||F.ms==='rout'||(F.ech||0)<2||ST(F).dom!=='land'||!aiControls(F))return b(F);
  if(F.regT&&G.t<F.regT||F.hold&&G.t<F.hold)return b(F);var L=leavesOf(F).filter(onMap).filter(function(x){return ST(x).dom==='land';});if(!L.length)return b(F);
  /* 敵軍逼近：照原本的方式撤離，之後重新選址 */if(G.step%4===(F.id%4)&&hqThreat(F))F.thrT=G.t;if(G.t-(F.thrT||-1e9)<600){if(F.hqS)F.hqS.t=-1e9;return b(F);}
  var S=F.hqS,C=centroid(L);if(!S||G.t-S.t>3*3600||G.t-S.t>1800&&dist(S.C[0],S.C[1],C[0],C[1])>Math.max(2500,hqBand(F).b*0.5)){var N=hqSiteCalc(F,L);if(!S||dist(S.x,S.y,N.x,N.y)>1500){if((F.ech||0)>=4&&!(F.hqLogT&&G.t-F.hqLogT<3*3600)){F.hqLogT=G.t;logE(F.side,'cmd',uName(F)+(F.p<0?'的大本營':'的司令部')+'設在'+placeTxt(N.x,N.y)+(N.why?'（'+N.why+'）':''),N.x,N.y,F.id);}F.hqS=N;}else{S.t=G.t;S.C=N.C;}S=F.hqS;}
  var s=ST(F),d=dist(F.x,F.y,S.x,S.y);if(d>400&&!F.pq&&(!F.path||G.t-(F.hqPT||0)>900)){F.hqPT=G.t;wantPath(F,S.x,S.y);}if(F.path){F.form='march';moveStep(F,s,1);}else if(d<=400)F.form='deployed';};})();

/* ---------- 九、接上行為樹與每步流程 ---------- */
/* 防區：離某地點最近的本方地面部隊屬於哪位指揮官 */
function cmSecOwner(side,x,y){var best=-1,bd=1e18;G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||!onMap(u)||ST(u).dom!=='land'||u.irr)return;var d=(u.x-x)*(u.x-x)+(u.y-y)*(u.y-y);if(d<bd){bd=d;best=cmOf(u);}});return best;}
/* 組隊時：警戒前哨只派到自己的防區（不和友軍重複派兵） */
(function(){var b=condScreens;condScreens=function(X){var r=b(X);if(!r||!X.tm)return r;X.scrNeed=X.scrNeed.filter(function(q){return cmSecOwner(X.side,q.x,q.y)===X.cmi;});return X.scrNeed.length>0;};})();
/* 被派去偵察、協防接合部或擴建後勤的部隊，不會被上級一般的命令拉走 */
(function(){var b=planOrder;planOrder=function(F,o){var R=b(F,o);if(!Array.isArray(R)||!aiControls(F))return R;var k=o.dk||o.k;if(/withdraw|delay|twd|refit|halt/.test(k))return R;return R.filter(function(p){var u=p[0];if(!isLeaf(u))return true;return !(u.v11sc&&G.t-u.v11sc<2*3600&&u.ord&&u.ord.k==='recon'||u.v11jc&&G.t-u.v11jc<8*3600||u.v11job&&G.t<u.v11job);});};})();
(function(){var b=aiTree;aiTree=function(t){var T=b(t),M=T.t==='par'?T.c[0]:T,nm=function(){return M.c.map(function(c){return c.n;});};
  var jr=BQ('聯合攻勢：執行分配到的角色',BC('盟軍聯合攻勢中有我的任務',condJRole),BA('牽制、跟進擴張、火力支援或襲擾',actJRole));var k=nm().indexOf('危急：全線後撤');M.c.splice(k>=0?k+1:0,0,jr);
  var wpo=BQ('弱點攻勢：研判、偵察、選擇攻擊方式',BC('準備進攻',condWP),BA('依個性直接進攻、火力偵察或多派偵察兵，再發起總攻、突破或襲擾',actWP));var i=nm().indexOf('攻擊突破口');if(i<0)i=nm().indexOf('防禦與構工');M.c.splice(i>=0?i:M.c.length,0,wpo);
  var doc=BQ('防禦準則',BC('有可部署的部隊',condDoc),BA('依準則部署：彈性、機動、縱深、前沿、刺蝟、遲滯或反斜面',actDoc));var j=nm().indexOf('防禦與構工');M.c.splice(j>=0?j:M.c.length,0,doc);
  var side=BP('v11 持續處置',BQ('準則反應',BC('防禦準則需要處置',condDocR),BA('預備隊反擊、打擊部隊出擊或解圍',actDocR)),BQ('後勤經營',BC('依經營風格需要擴建',condMg),BA('增設補給站、基地、機場、工事、道路或醫院',actMg)),BQ('盟軍協同',BC('有友軍指揮官',condTeam),BA('通報企圖、請求支援',actTeam)));
  if(T.t==='par'){T.c.push(side);return T;}return BP(T.n,T,side);};})();
function v11Step(){if(G.step%4===1)tmMsgStep();if(G.step%20===11)rbfStep();}
(function(){var b=v8Step;v8Step=function(){b();v11Step();};})();
/* 快速想定：依開始頁的設定組成 1v1、2v2、3v3 */
if(typeof runScn==='function')(function(){var b=runScn;runScn=async function(sc,pg){var n=clamp(+(ST0.team||1),1,4),md=ST0.tmode==='dup'?'dup':'split';if(n>1&&md==='dup')sc=Object.assign({},sc,{A:dupList(sc.A,n),B:dupList(sc.B,n)});await b(sc,pg);if(n<2||!G)return;
  SIDES().forEach(function(s){teamSetup(s,n,md);});reix();dupNames();show('deploy');toast('「'+sc.n+'」：'+n+' 對 '+n+'，每方 '+n+' 位指揮官（'+(md==='dup'?'每位指揮官一份完整兵力':'平分原有兵力')+'）。在「兵力編成」可調整各指揮官的個性、準則與部隊。',7000);};})();
