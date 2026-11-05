/* ===================== 點數：
   一、部隊點數：只用來衡量雙方戰力（依火力、裝甲、訓練與現有兵力），不設限制；開戰後敵方只能依情報估計。
   二、增援點數（可開關）：所有增援與物資都要花——派遣增援、呼叫物資、從地圖外進入戰場的日常補給、休整時補充的兵員與裝備、
       工兵構築（陣地、工事、補給站、橋梁、渡口、道路與鐵路的修建）、擴充補給設施。每日固定配給一筆以維持日常補給；
       與敵人交戰的戰果、佔領與守住目標、把傷患與戰俘後送出地圖都會取得額外點數。
   三、科技點數（可開關）：開戰時本方已有與已經過時的武器不必解鎖；其他武器與裝備要用科技點數解鎖，才能配發、換裝或購買使用它們的單位。
   四、自訂增援範本：玩家自己組合的營、團、旅（單位類型與數量），可以匯出、匯入，戰中以增援派遣 ===================== */
function rpOn(){return !!(G&&G.set&&G.set.rp);}
function techOn(){return !!(G&&G.set&&G.set.tech);}
/* ---------- 一、部隊點數 ---------- */
function fpType(t){if(typeof t==='string')t=typeOf(t);if(!t)return 0;var base=(t.sa||0)+1.5*(t.ha||0)+0.8*(t.aa||0)+((t.ind||0)>0?0.4*(t.sa||0):0),prot=1+0.08*(t.arm||0)+0.3*(t.hard||0),q=0.6+0.4*clamp((t.trn||50)/70,0,1.3),m=t.dom==='air'?1.25:t.dom==='sea'||t.dom==='sub'?1.3:1;
  return Math.max(1,Math.round(10*base*prot*q*m+0.02*(t.men||0)+0.5*(t.veh||0)));}
function fpMix(mix){return (mix||[]).reduce(function(a,q){return a+fpType(q[0])*(q[1]||1);},0);}
function fpU(u){if(!u||!alive(u))return 0;if(!isLeaf(u)){var n=u.hq&&u.men0>0?fpType(u.hq)*clamp(u.men/u.men0,0,1):0;leavesOf(u).forEach(function(q){n+=fpU(q);});return Math.round(n);}
  var f=WF(u),wf=clamp(((f.p||1)+(f.a||1))/2,0.3,2);return Math.round(fpMix(u.mix)*wf*clamp(strFrac(u),0,1.2));}
function fpSide(side){var n=0;G.units.forEach(function(u){if(u.side!==side||!alive(u)||u.st==='off'||u.irr)return;if(isLeaf(u))n+=fpU(u);else if(u.hq&&u.men0>0)n+=fpType(u.hq)*clamp(u.men/u.men0,0,1);});return Math.round(n);}
/* 開戰後只能依情報估計敵方 */
function fpEst(side){var C=G.ct[side]||{},n=0;for(var id in C){var c=C[id];if(c.dead||G.t-c.t>6*3600)continue;n+=(c.men||0)*0.4+(c.veh||0)*9;}return Math.round(n);}
/* ---------- 二、增援點數 ---------- */
var RPWHY={start:'初始',day:'每日配給',fight:'交戰戰果',cap:'佔領目標',hold:'守住目標',evac:'後送傷患',pow:'後送戰俘',reinf:'增援',sup:'呼叫物資',flow:'日常補給（進入戰場）',build:'構築與建造',refit:'休整補充兵員裝備',node:'擴充補給設施',adj:'調整'};
function rpS(side){var S=SD(side);if(!S.rpx){var v0=G.set.rp0!==undefined&&G.set.rp0!==''&&isFinite(+G.set.rp0)?+G.set.rp0:800;S.rpx={v:v0,earn:0,spend:0,log:[{t:G.t||0,v:v0,why:'start',txt:''}],day:-1,by:{},ecas:-1,evl:-1,pow:-1,own:{}};}return S.rpx;}
function rpHave(side){return rpOn()?rpS(side).v:Infinity;}
function rpNote(R,amt,why,txt){var L=R.log,last=L[L.length-1];if(last&&last.why===why&&!txt&&!last.txt&&G.t-last.t<3600){last.v+=amt;return;}L.push({t:G.t,v:amt,why:why,txt:txt||''});if(L.length>80)L.splice(0,L.length-80);}
function rpAdd(side,amt,why,txt){if(!rpOn()||side<0||side>=nSides()||!(amt>0))return;var R=rpS(side);R.v+=amt;R.earn+=amt;R.by[why]=(R.by[why]||0)+amt;rpNote(R,amt,why,txt);}
/* 扣點：不足時回傳 false、不扣 */
function rpSpend(side,amt,why,txt){if(!rpOn()||!(amt>0))return true;var R=rpS(side);if(R.v+1e-6<amt)return false;R.v-=amt;R.spend+=amt;R.by[why]=(R.by[why]||0)-amt;rpNote(R,-amt,why,txt);return true;}
function rpDayAmt(side){var v=G.set.rpDay;if(v!==undefined&&v!==''&&v!=='auto'&&isFinite(+v))return Math.max(0,+v);var sm=logSummary(side),need=0;['food','ammo','fuel','fod'].forEach(function(c){need+=sm.need[c]||0;});return Math.round((need*0.6+250)/10)*10;}
function tpDayAmt(){var v=G.set.tpDay;return v!==undefined&&v!==''&&isFinite(+v)?Math.max(0,+v):20;}
function calDayL(){return Math.floor((G.t+(G.set.h||0)*3600+(G.set.mi||0)*60)/86400);}
/* 每 10 分鐘：每日配給、交戰戰果、目標、後送戰俘 */
var RPM={fightMan:0.12,fightVeh:2,cap:5,hold:0.25,evac:0.3,pow:0.5};
function rpStep(){if(!G.started||(!rpOn()&&!techOn()))return;var d=calDayL();
  SIDES().forEach(function(side){var R=rpS(side),T=tpS(side),e=enemyOf(side),ES=G.stats[e]||{},MS=G.stats[side]||{};
    if(R.day!==d){if(R.init){if(rpOn()){var a=rpDayAmt(side);rpAdd(side,a,'day');}if(techOn()){var ta=tpDayAmt();T.v+=ta;T.earn+=ta;}}R.day=d;R.init=1;}
    var cas=ES.cas||0,vl=ES.vl||0;if(R.ecas<0){R.ecas=cas;R.evl=vl;}var dc=cas-R.ecas,dv=vl-R.evl;R.ecas=cas;R.evl=vl;if(dc>0||dv>0){rpAdd(side,dc*RPM.fightMan+dv*RPM.fightVeh,'fight');if(techOn()){var tt=dc*0.01+dv*0.1;T.v+=tt;T.earn+=tt;}}
    var pe=MS.powEvac||0;if(R.pow<0)R.pow=pe;if(pe>R.pow){rpAdd(side,(pe-R.pow)*RPM.pow,'pow');R.pow=pe;}
    (G.obj||[]).forEach(function(ob){var was=R.own[ob.id],pts=ob.pts||10;if(ob.own===side&&was!==side&&was!==undefined){rpAdd(side,pts*RPM.cap,'cap','佔領「'+ob.name+'」');if(techOn()){T.v+=pts*0.5;T.earn+=pts*0.5;}}R.own[ob.id]=ob.own;
      if(ob.own===side){var threat=enemyNear(side,ob.x,ob.y,obR(ob)*2.5)>0;rpAdd(side,pts*RPM.hold/6*(threat?2:1),'hold');}});});}
/* 後送傷患：在醫療單位收治期滿、沒有歸隊的傷患後送出地圖 */
(function(){var b=medStep;medStep=function(){var snap=[];if(rpOn())G.units.forEach(function(m){if(m.pat&&m.pat.length)m.pat.forEach(function(p){snap.push([m.side,p,p.n]);});});b();
  snap.forEach(function(q){if(q[1].n===0&&q[2]>0.05)rpAdd(q[0],q[2]*0.65*RPM.evac,'evac');});};})();
/* 呼叫物資的費用：每噸糧彈油（陸路 1、鐵路 0.7、空運 3），武器每噸 20 */
var RPR={truck:1,wagon:1,porter:1,rail:0.7,ship:0.5,air:3,drop:3,heli:3},RPRF={truck:0.5,wagon:0.5,porter:0.5,rail:0.35,ship:0.25,air:1.5,drop:2,heli:2},RPW=20;
function supCost(legs){var c=0;legs.forEach(function(g){if(!g.n)return;var s=g.sc===undefined?1:g.sc;c+=(g.c.food+g.c.ammo+g.c.fuel)*s*(RPR[g.m]||1)+(g.wx?supWt(g.wx)*s*RPW:0);});return Math.ceil(c);}
function supPay(side,legs,m,opt){if(!rpOn())return '';var c=supCost(legs);if(!rpSpend(side,c,'sup',opt&&opt.route?'':null))return '增援點數不足（需要 '+fmt(c)+'，現有 '+fmt(Math.floor(rpHave(side)))+'）';opt._rp=c;return '';}
/* 日常補給：從地圖外進入戰場的物資送達時付費；點數不足時只收下付得起的部分 */
(function(){var b=lgUnloaded;lgUnloaded=function(V){if(!rpOn()||V.call||!V.src)return b(V);var srcOff=V.src.k==='edge'||V.src.k==='node'&&(lgNode(V.side,V.src.id)||{}).k==='off';if(!srcOff)return b(V);
  var side=V.side,rate=RPRF[V.m]||0.5,c0=lgCargo(V),aff=Math.max(0,rpS(side).v)/rate,cut=false;if(c0>0.01&&aff<c0){var f=aff/c0;LCLS.forEach(function(c){V.c[c]*=f;});cut=true;}
  var S=lgStats(side),t0=S.t,r=b(V),got=Math.max(0,S.t-t0);if(got>0){var R=rpS(side),amt=Math.min(R.v,got*rate);if(amt>0){R.v-=amt;R.spend+=amt;R.by.flow=(R.by.flow||0)-amt;rpNote(R,-amt,'flow');}}
  if(cut){var D=V.dst&&V.dst.k==='node'?lgNode(side,V.dst.id):null;if(D)D._lgWhy='增援點數不足，只收下部分物資';if(!R0cut[side]||G.t-R0cut[side]>6*3600){R0cut[side]=G.t;logE(side,'lgcut','增援點數不足：從地圖外進入的日常補給只收下約 '+pct(c0>0?aff/c0*100:0)+'，其餘退回後方');}}return r;};})();
var R0cut=[0,0];
/* 工兵構築與建造：開工時付費 */
var RPB={build:{pos:10,semi:30,fort:80,bastion:120,depot:60},bridge:60,xsite:{boat:10,raft:5,ferry:25},roadbuild:40,roadfix:8,railfix:15,repair:15};
function rpBuildCost(o){var c=RPB[o.k];if(c===undefined)return 0;if(typeof c==='object'){var key=o.k==='build'?(o.bk||(o.opt&&o.opt.bk)||'pos'):(o.xk||(o.opt&&o.opt.xk)||'boat');return c[key]||10;}return c;}
(function(){var b=activate;activate=function(u,o){if(rpOn()&&G.started&&o&&!o.rpPaid&&RPB[o.k]!==undefined&&u&&isLeaf(u)){var eng=typeof isEng!=='function'||isEng(u)||o.k==='xsite'||o.k==='roadfix';
    if(eng){var c=rpBuildCost(o);if(c>0){if(!rpSpend(u.side,c,'build',uName(u)+'：'+ordN(o))){if(!u._rpLowT||G.t-u._rpLowT>3600){u._rpLowT=G.t;logE(u.side,'cmd','增援點數不足（需要 '+c+'，現有 '+fmt(Math.floor(rpHave(u.side)))+'），'+uName(u)+'無法'+ordN(o),u.x,u.y,u.id);}return;}o.rpPaid=c;}}}
  return b(u,o);};})();
/* 休整：補充的兵員與裝備依部隊點數付費 */
(function(){var b=refitStep;refitStep=function(){if(!rpOn())return b();var snap=[];G.units.forEach(function(u){if(u.refit&&u.st==='off'&&isLeaf(u))snap.push([u,u.men,u.veh,u.trn,u.repl||0]);});var R0=SD(0).repl,R1=SD(1).repl;b();
  snap.forEach(function(q){var u=q[0],dm=Math.max(0,u.men-q[1]),dv=Math.max(0,u.veh-q[2]);if(dm<0.001&&dv<0.001)return;var w=(u.men0+u.veh0*8)||1,cost=fpMix(u.mix)*(dm+dv*8)/w*0.9;if(rpSpend(u.side,cost,'refit'))return;
    var R=rpS(u.side),aff=Math.max(0,R.v),f=cost>0?clamp(aff/cost,0,1):0;u.men=q[1]+dm*f;u.veh=q[2]+dv*f;u.trn=q[3];var back=dm*(1-f);if(back>0){SD(u.side).repl+=back;u.repl=q[4]+dm*f;}if(aff>0)rpSpend(u.side,aff,'refit');
    if(!u._rpLowR||G.t-u._rpLowR>6*3600){u._rpLowR=G.t;logE(u.side,'refit','增援點數不足，'+uName(u)+'的兵員與裝備補充暫停');}});void R0;void R1;};})();
/* 增援的費用：依部隊點數（滿編） */
function rpPresetCost(pk){var P=FPI[pk];if(!P)return 0;var n=fpMix(flatMix(pk,{})),hq=0;(function c(k){var Q=FPI[k];hq++;Q.kids.forEach(function(kd){if(kd[0].charAt(0)==='@')for(var i=0;i<kd[1];i++)c(kd[0].slice(1));});})(pk);return Math.round(n+hq*fpType(hqTypeFor(P.era)));}
function rpTypeCost(tk,n){return Math.round(fpType(tk)*(n||1));}
/* ---------- 三、科技點數 ---------- */
function tpS(side){var S=SD(side);if(!S.tpx){var v0=G.set.tp0!==undefined&&G.set.tp0!==''&&isFinite(+G.set.tp0)?+G.set.tp0:30;S.tpx={v:v0,unl:{},earn:0,log:[]};}return S.tpx;}
/* 不必解鎖：本方部隊開戰時已有的武器，以及本時代已經過時（早於 25 年）的武器 */
function techBase0(side){var o={},y=G.set.y||1943;Object.keys(WPNO).forEach(function(k){if((WPNO[k].y||0)<=y-25)o[k]=1;});G.units.forEach(function(u){if(u.side!==side)return;if(u.lg)(u.lg.w0||[]).concat(u.lg.w||[]).forEach(function(x){o[x[0]]=1;});else typesOfU(u).forEach(function(m){var t=typeOf(m[0]);if(t)((t.load||defLoad(t)).w||[]).forEach(function(x){o[x[0]]=1;});});});return o;}
function techBase(side){var S=SD(side);if(S.tbase)return S.tbase;var o=techBase0(side);if(G.started)S.tbase=o;return o;}
function techOK(side,k){if(!techOn()||side<0)return true;return !!(tpS(side).unl[k]||techBase(side)[k]);}
function techCost(k){var w=wpnOf(k);if(!w)return 999;var y=G.set.y||1943,c=wcls(k),mx=0;wpnList().forEach(function(q){if(wcls(q.k)===c&&(q.y||0)<=y)mx=Math.max(mx,wq(q.k));});mx=mx||wq(k)||1;
  return Math.max(5,Math.round(10+30*Math.min(1.5,wq(k)/mx)+(w.gen||0)*3+((w.y||0)>y?((w.y||0)-y)*4:0)));}
function techUnlock(side,k){var T=tpS(side),w=wpnOf(k);if(!w)return {err:'沒有這種武器'};if(techOK(side,k))return {err:'已經可以使用'};var c=techCost(k);if(T.v+1e-6<c)return {err:'科技點數不足（需要 '+c+'，現有 '+fmt(Math.floor(T.v))+'）'};
  T.v-=c;T.unl[k]=1;T.log.push({t:G.t,k:k,c:c});if(T.log.length>60)T.log.shift();logE(side,'log','科技：解鎖'+w.n+'（'+c+' 點）');return {ok:1,c:c};}
/* 單位類型需要哪些尚未解鎖的武器與裝備 */
function techTypeLock(side,tk){if(!techOn())return [];var t=typeOf(tk);if(!t)return [];return ((t.load||defLoad(t)).w||[]).map(function(x){return x[0];}).filter(function(k,i,A){return A.indexOf(k)===i&&!techOK(side,k);});}
function techPresetLock(side,pk){if(!techOn()||!FPI[pk])return [];var o=[];flatMix(pk,{}).forEach(function(q){techTypeLock(side,q[0]).forEach(function(k){if(o.indexOf(k)<0)o.push(k);});});return o;}
/* ---------- 四、自訂增援範本 ---------- */
function rftOf(side){var S=SD(side);if(!S.rft)S.rft=[];return S.rft;}
function rftEra(T){var q=(T.items||[]).filter(function(z){return typeOf(z[0]);})[0],t=q?typeOf(q[0]):null;return t?t.era:'e1940';}
function rftCost(T){var n=0;(T.items||[]).forEach(function(q){if(typeOf(q[0]))n+=fpType(q[0])*Math.max(0,+q[1]||0);});if(T.hq!==0)n+=fpType(hqTypeFor(rftEra(T)));return Math.round(n);}
function rftLock(side,T){var o=[];(T.items||[]).forEach(function(q){techTypeLock(side,q[0]).forEach(function(k){if(o.indexOf(k)<0)o.push(k);});});return o;}
function rftBuild(side,T,name,parent,r){var era=rftEra(T),ech=clamp(+T.ech||2,1,6);NMS.side=side;NMS.fem=offFem(side,era);var F=newUnit(side,{name:name||T.n||'自訂部隊',p:parent,ech:ech,hq:hqTypeFor(era),off:newOfficer(r,ech)});initStrength(F);if(parent>=0&&uById(parent))uById(parent).kids.push(F.id);
  (T.items||[]).forEach(function(q){var t=typeOf(q[0]);if(!t)return;for(var i=1;i<=Math.min(60,Math.max(0,Math.round(+q[1]||0)));i++){var L=newUnit(side,{name:'第'+i+t.n,p:F.id,ech:1,mix:[[q[0],1]],off:null});initStrength(L);F.kids.push(L.id);}});return F;}
var RFTFMT='LatoWarReinf';
function rftExport(L){return {format:RFTFMT,v:1,saved:new Date().toISOString(),templates:(L||[]).map(function(T){return {n:T.n,ech:T.ech,hq:T.hq===0?0:1,items:(T.items||[]).map(function(q){return [q[0],Math.max(0,Math.round(+q[1]||0))];})};})};}
function rftImport(side,D){if(!D||D.format!==RFTFMT||!Array.isArray(D.templates))return {err:'這不是增援範本檔（'+RFTFMT+'）'};var L=rftOf(side),n=0,skip=[];
  D.templates.forEach(function(T){if(!T||!Array.isArray(T.items))return;var items=T.items.filter(function(q){if(Array.isArray(q)&&typeOf(q[0]))return true;if(Array.isArray(q))skip.push(String(q[0]));return false;}).map(function(q){return [q[0],clamp(Math.round(+q[1]||0),0,60)];}).filter(function(q){return q[1]>0;});
    if(!items.length)return;L.push({id:'r'+(Date.now().toString(36))+n,n:String(T.n||'匯入範本').slice(0,60),ech:clamp(+T.ech||2,1,6),hq:T.hq===0?0:1,items:items});n++;});return {n:n,skip:skip};}
/* ---------- 五、增援名單（白名單／黑名單）與共用範本 ----------
   G.set.rfL＝[藍方名單, 紅方名單]，名單 {m:'off'|'white'|'black', b:[兵種], t:[單位類型], p:[編制範本]}：白名單只允許勾選的項目，黑名單禁止它們。
   編制範本與自訂範本要看裡面的每一種單位；在白名單直接勾選的編制範本一律允許。只管戰中增援（含 AI 購買），不影響開戰前的兵力。
   G.set.rfX：聯機時伺服器送來的共用範本（src 's' 管理員的伺服器範本、'r' 房主的房間範本），唯讀；G.set.rfH：管理員停用的內建編制範本 */
var RFLFMT='LatoWarReinfList';
function rflOf(side){var L=G&&G.set&&G.set.rfL;L=L&&L[side];return L&&(L.m==='white'||L.m==='black')?L:null;}
function rflType(side,tk){var L=rflOf(side);if(!L)return true;var t=typeOf(tk);if(!t)return false;var hit=(L.t||[]).indexOf(tk)>=0||(L.b||[]).indexOf(t.br)>=0;return L.m==='white'?hit:!hit;}
function rflHid(pk){return ((G&&G.set&&G.set.rfH)||[]).indexOf(pk)>=0;}
function rflPreset(side,pk){if(!FPI[pk]||rflHid(pk))return false;var L=rflOf(side);if(!L)return true;if((L.p||[]).indexOf(pk)>=0)return L.m==='white';return flatMix(pk,{}).every(function(q){return rflType(side,q[0]);});}
function rflBad(side,T){return (T&&T.items||[]).filter(function(q){return typeOf(q[0])&&q[1]>0&&!rflType(side,q[0]);}).map(function(q){return q[0];});}
function rflTpl(side,T){return !rflBad(side,T).length;}
function rftShared(){var X=G&&G.set&&G.set.rfX;return Array.isArray(X)?X:[];}
function rftAll(side){return rftOf(side).concat(rftShared());}
function rftFind(side,id){if(!id)return null;return rftAll(side).filter(function(q){return q.id===id;})[0]||null;}
/* 派遣前的名單檢查：允許時回傳空字串，否則回傳原因 */
function rflWhy(side,src,o){o=o||{};if(src==='preset'){if(rflHid(o.pk))return '這個編制範本已被伺服器管理員停用。';return rflPreset(side,o.pk)?'':'增援名單不允許這個編制範本（'+((FPI[o.pk]||{}).n||o.pk)+'）。';}
  if(src==='rft'){var bad=rflBad(side,o.T);return bad.length?'增援名單不允許範本中的：'+bad.map(function(k){return typeOf(k).n;}).join('、'):'';}
  return rflType(side,o.tk)?'':'增援名單不允許「'+((typeOf(o.tk)||{}).n||o.tk)+'」。';}
function rflClean(L){L=L||{};var f=function(A,n){return Array.isArray(A)?A.filter(function(x,i){return typeof x==='string'&&x.length<=60&&A.indexOf(x)===i;}).slice(0,n):[];};return {m:L.m==='white'||L.m==='black'?L.m:'off',b:f(L.b,80),t:f(L.t,800),p:f(L.p,800)};}
function rflExport(lists){return {format:RFLFMT,v:1,saved:new Date().toISOString(),lists:SIDES().map(function(s){return rflClean(lists&&lists[s]);})};}
function rflImport(D){if(!D||D.format!==RFLFMT||!Array.isArray(D.lists))return {err:'這不是增援名單檔（'+RFLFMT+'）'};var n=Math.max(2,Math.min(3,D.lists.length)),o=[];for(var i=0;i<n;i++)o.push(rflClean(D.lists[i]));return {lists:o};}
function rflTxt(side){var L=rflOf(side);if(!L)return '不限制';var n=(L.b||[]).length+(L.t||[]).length+(L.p||[]).length;return (L.m==='white'?'白名單：只允許 ':'黑名單：禁止 ')+n+' 項';}
/* 派遣增援（介面與 AI 共用）：扣點後建立部隊，指定時間從地圖邊緣或指定地點進場 */
function rpReinfCost(src,o){return src==='preset'?rpPresetCost(o.pk):src==='rft'?rftCost(o.T):rpTypeCost(o.tk,o.n);}
/* AI：兵力居於劣勢、點數足夠時購買一個營（或連）的增援 */
function rpAI(){if(!rpOn())return;SIDES().forEach(function(side){var S=SD(side);if(!S.ai)return;var R=rpS(side);if(R.v<300||G.t-(S._rpBuyT||-1e9)<3*3600)return;var hq=sideCmd(side),era=hq?uEra(hq).k:null;if(!era)return;
  var me=sideStr(side),en=sideStr(enemyOf(side));if(me.m>en.m*1.15&&R.v<1500)return;
  var L=FP.filter(function(p){return p.era===era&&p.ech>=1&&p.ech<=2;}).map(function(p){return [p,rpPresetCost(p.k,side)];}).filter(function(q){return q[1]>0&&q[1]<=R.v*0.7&&!techPresetLock(side,q[0].k).length&&rflPreset(side,q[0].k);}).sort(function(a,b){return b[1]-a[1];});if(!L.length)return;
  var pick=L[Math.floor(rnd8()*Math.min(3,L.length))],P=pick[0];if(!rpSpend(side,pick[1],'reinf',P.n))return;S._rpBuyT=G.t;var par=hq&&!isLeaf(hq)?hq.id:-1,u=buildPreset(side,P.k,null,par,mb32(hstr('rpai|'+side+'|'+G.t)),'co',null);reix();
  (function w(z){logInit(z);z.ms='ok';z.form='deployed';z.task='hold';z.sup=0;z.fat=0;z.st='off';z.ammo=100;kidsOf(z).forEach(w);})(u);var e=edgePoint(side,0.3+0.4*rnd8()),ob=(G.obj||[])[0],tx=ob?ob.x:G.map.Wm/2,ty=ob?ob.y:G.map.Hm/2;
  u.arr={k:'time',t:G.t+1800,x:e[0],y:e[1],mode:'edge',ord:{k:'reserve',x:e[0]+(tx-e[0])*0.3,y:e[1]+(ty-e[1])*0.3}};dupNames();logE(side,'reinf','以 '+fmt(pick[1])+' 增援點數派遣增援 '+uName(u)+'，約 30 分鐘後抵達',e[0],e[1],u.id);});}
(function(){var b=v8Step;v8Step=function(){b();if(G.step%20===19)rpStep();if(G.step%120===61)rpAI();};})();
