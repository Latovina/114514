/* ===================== 裝備的現實限制：只允許詳細設計，不能超模 =====================
   自訂的彈藥、材料、載具模組、導引彈藥、核彈頭、毒劑、武器與單位類型，數值都由設計參數算出，或受「現實世界同類裝備」的上限約束：
   - 上限取自內建資料庫（真實裝備的數據）：同一類裡最好的數值再多一點點（多 5%～10%），而且「每公斤」「每塊錢」的效能也不能超過最好的同類；
   - 物理關係：初速受口徑與膛壓（單位截面積的砲口動能）限制，發射藥至少要提供砲口動能；彈芯、長桿彈、裝藥要裝得進彈體；
     彈道係數由截面密度決定；全彈重量與價格由彈體、彈殼、發射藥與材料算出，不能直接填；
   - 武器：以一種內建武器為藍本，換彈藥、改身管長、射速與夜視，殺傷、穿甲、射程、精度、價格、操作人數與每基數發數都依彈藥的物理量換算；
   - 單位類型：戰鬥數值鎖定在範本類型（或載具設計換算的結果），只能改名稱、符號、說明、圖片、軍官比例、規模與移除旗標；
   - 編制：武器多於人員能操作的部分當作備用，不增加火力。
   伺服器讀檔、收到上傳的資料時也跑同一套檢查，用戶端送來的數值不被採信。 */
var RLX=null;
function rlNote(N,s){if(N&&N.indexOf(s)<0)N.push(s);}
function rlN(v,d){v=+v;return isFinite(v)?v:d;}
function rlR(v,n){var p=Math.pow(10,n||0);return Math.round(v*p)/p;}
/* 把數值限制在範圍內，超出時記一筆說明 */
function rlCap(o,f,lo,hi,N,lbl){var v=rlN(o[f],null);if(v===null)return false;var w=clamp(v,lo,hi);if(Math.abs(w-v)>1e-9*Math.max(1,Math.abs(v))){o[f]=w;rlNote(N,(lbl||f)+' '+rlFmt(v)+' → '+rlFmt(w));return true;}return false;}
function rlFmt(v){var a=Math.abs(v);return a>=100?String(Math.round(v)):a>=1?String(Math.round(v*100)/100):String(Math.round(v*1000)/1000);}

/* ---------- 一、內建資料庫的上下限（真實裝備） ---------- */
function rlEnv(){if(RLX)return RLX;var X={g:{},k:{},mat:{},mod:{},mun:{}};if(!LAL)return RLX=X;
  LAL.PROJ.forEach(function(P){var gun=!(P.rocket||P.guided),g=X.g[P.g]||(X.g[P.g]={dMin:1e9,dMax:0,eMax:0,vMax:0}),k=X.k[P.k]||(X.k[P.k]={sdMin:1e9,sdMax:0,heF:0,bcS:0,vMax:0,ld:0});
    g.dMin=Math.min(g.dMin,P.d);g.dMax=Math.max(g.dMax,P.d);g.vMax=Math.max(g.vMax,P.v0);if(gun)g.eMax=Math.max(g.eMax,0.5*P.m/1000*P.v0*P.v0/(P.d*P.d));
    var sd=P.m/Math.pow(P.d,3);k.sdMin=Math.min(k.sdMin,sd);k.sdMax=Math.max(k.sdMax,sd);if(P.he&&P.he.g>0)k.heF=Math.max(k.heF,P.he.g/P.m);if(P.bc>0)k.bcS=Math.max(k.bcS,P.bc/(P.m/(P.d*P.d)));if(gun)k.vMax=Math.max(k.vMax,P.v0);
    if(P.core&&P.core.L>0&&P.core.d>0)k.ld=Math.max(k.ld,P.core.L/P.core.d);});
  LAL.MATS.forEach(function(M){var c=X.mat[M.cat]||(X.mat[M.cat]={n:0,max:{},sp:{},min:{}});c.n++;RLMUP.concat(RLMDN).forEach(function(f){var v=+M[f];if(!(v>0))return;c.max[f]=Math.max(c.max[f]||0,v);c.min[f]=Math.min(c.min[f]===undefined?1e18:c.min[f],v);if(M.rho>0)c.sp[f]=Math.max(c.sp[f]||0,v/M.rho);});
    if(Array.isArray(M.mh))M.mh.forEach(function(v,i){c.max['mh'+i]=Math.max(c.max['mh'+i]||0,+v||0);});});
  if(LVL){LVL.MODS.forEach(function(m){var key=m.br+'/'+m.sl,c=X.mod[key]||(X.mod[key]={n:0,max:{},min:{},pk:{},pd:{}});c.n++;Object.keys(m).forEach(function(f){var v=m[f];if(typeof v!=='number'||!isFinite(v))return;c.max[f]=Math.max(c.max[f]===undefined?-1e18:c.max[f],v);c.min[f]=Math.min(c.min[f]===undefined?1e18:c.min[f],v);});
      (RLPERF[m.sl]||[]).forEach(function(p){var v=+m[p];if(!(v>0))return;if(m.kg>0)c.pk[p]=Math.max(c.pk[p]||0,v/m.kg);if(m.dy>0)c.pd[p]=Math.max(c.pd[p]||0,v/m.dy);});});
    LVL.MUN.forEach(function(m){var c=X.mun[m.t]||(X.mun[m.t]={max:{},min:{},pk:{}});['rng','mach','wh','pk','kg','dy'].forEach(function(f){var v=+m[f];if(!(v>0))return;c.max[f]=Math.max(c.max[f]||0,v);c.min[f]=Math.min(c.min[f]===undefined?1e18:c.min[f],v);});
      if(m.kg>0){if(m.rng>0)c.pk.rng=Math.max(c.pk.rng||0,m.rng/m.kg);if(m.wh>0)c.pk.wh=Math.max(c.pk.wh||0,m.wh/m.kg);}});}
  return RLX=X;}
/* 材料：越大越好的性質、越小越好的性質 */
var RLMUP=['bhn','ys','uts','E','el','hv','rt','ce','fs','fe','fE','ss','yp','hard'],RLMDN=['rho','usd','fab'];
/* 各種模組的主要效能（每公斤、每塊錢都不能超過最好的內建模組） */
var RLPERF={eng:['hp'],tr:['eff'],gun:['rof','rng'],al:['rof','car'],fcs:['rt','th'],rad:['rr','tr'],sen:['th','rt'],aps:['pK','pM','pR'],ew:['jam','esm'],c4i:['sa'],kit:['zs'],fuel:['L'],
  aeng:['dry','wet','kw'],irst:['rr'],eo:['rr'],pw:['mw','mwh'],son:['sr'],vls:['cells'],lnch:['cells'],ciws:['pk','r'],av:['hang'],atc:['rr'],dec:['dec']};
/* 越小越好的模組欄位：不能低於最好的內建模組 */
var RLLOW=['kg','dy','pw','crew','sfc','sfcD','sfcW','cd0','cr','co','cda','rcs'];

/* ---------- 二、彈藥（砲彈、子彈、火箭彈） ---------- */
function rlProjBase(P){var B=P.base&&LALP[P.base]||LALP[P.id];if(B&&B!==P)return B;var best=null,bs=1e9;LAL.PROJ.forEach(function(Q){var s=Math.abs(Math.log(Math.max(0.1,Q.d)/Math.max(0.1,+P.d||Q.d)))+(Q.k===P.k?0:3)+(Q.g===P.g?0:2);if(s<bs){bs=s;best=Q;}});return best;}
function rlMatRho(id){var M=matOf(id);return M&&M.rho>0?M.rho:7.85;}
function rlRound(P,N){if(!LAL||!P||typeof P!=='object')return P;var B=rlProjBase(P);if(!B)return P;var X=rlEnv(),s0=JSON.stringify(P);P.base=B.id;
  if(!LAL.KINDN[P.k]){P.k=B.k;rlNote(N,'種類改回 '+LAL.KINDN[B.k]);}if(!LAL.GROUPS[P.g])P.g=B.g;
  var g=X.g[P.g]||X.g[B.g],k=X.k[P.k]||X.k[B.k],gun=!(P.rocket||P.guided);
  ['d','m','v0'].forEach(function(f){if(!(rlN(P[f],0)>0))P[f]=B[f];});
  rlCap(P,'d',g.dMin*0.8,g.dMax*1.25,N,'口徑（mm）');
  var d3=Math.pow(P.d,3);rlCap(P,'m',k.sdMin*0.8*d3,k.sdMax*1.2*d3,N,'彈頭質量（g）');
  /* 彈芯與長桿：裝得進彈體，長細比不超過現實 */
  if(P.core&&typeof P.core==='object'){var C=P.core,rho=rlMatRho(C.mat);if(!matOf(C.mat))C.mat=(B.core&&B.core.mat)||'hsteel';rlCap(C,'d',0.5,P.d,N,'彈芯直徑（mm）');
    if(P.k==='lr'){rlCap(C,'L',C.d,C.d*Math.max(12,k.ld*1.1),N,'長桿長度（mm）');var mL=rho*Math.PI/4*C.d*C.d*(+C.L||0)/1000;if(mL>P.m*1.05){var L2=P.m*1.05*1000/(rho*Math.PI/4*C.d*C.d);rlNote(N,'長桿裝不進彈頭質量：長度 '+rlFmt(C.L)+' → '+rlFmt(L2)+' mm');C.L=L2;}}
    else{rlCap(C,'m',0,P.m*0.92,N,'彈芯質量（g）');var mx=rho*Math.PI/4*C.d*C.d*(rlN(P.L,P.d*4)*0.85)/1000;if(+C.m>mx)rlCap(C,'m',0,mx,N,'彈芯質量（g，彈體裝得下的）');}}
  if(P.he&&typeof P.he==='object'){if(!LAL.EXPL[P.he.x])P.he.x='tnt';rlCap(P.he,'g',0,P.m*Math.min(0.75,(k.heF||0.3)*1.15),N,'炸藥（g）');}
  if(P.sc&&typeof P.sc==='object'){rlCap(P.sc,'cd',1,P.d*0.95,N,'藥型罩直徑（mm）');rlCap(P.sc,'so',0,8,N,'炸高（倍徑）');}
  /* 初速：管射彈受單位截面積的砲口動能（膛壓 × 身管長）限制；火箭與導引彈受同類上限 */
  if(gun){var vE=Math.sqrt(2*g.eMax*1.08*P.d*P.d/(P.m/1000));rlCap(P,'v0',1,Math.min(k.vMax*1.05||vE,vE),N,'初速（m/s）');}else rlCap(P,'v0',1,g.vMax*1.1,N,'初速（m/s）');
  /* 彈道係數由截面密度決定 */
  if(P.bc>0&&k.bcS>0)rlCap(P,'bc',0.01,k.bcS*1.1*P.m/(P.d*P.d),N,'彈道係數');
  /* 發射藥至少要提供砲口動能（化學能約 4 kJ/g，效率最多 42%） */
  var E=0.5*P.m/1000*P.v0*P.v0,EB=0.5*B.m/1000*B.v0*B.v0;if(gun&&(P.prop>0||B.prop>0)){var pm=Math.max(E/(0.42*4000),B.prop>0?B.prop*E/EB*0.9:0);if(!(P.prop>=pm-1e-9)){if(P.prop>0)rlNote(N,'發射藥 '+rlFmt(P.prop)+' → '+rlFmt(pm)+' g');P.prop=rlR(pm,2);}}
  /* 全彈重量：不能比彈頭、彈殼與發射藥加起來輕 */
  if(P.rw>0||B.rw>0){var rwMin=B.rw>0?B.rw*(0.5*P.m/B.m+0.5*E/Math.max(1,EB))*0.95:P.m*1.2;if(!(P.rw>=rwMin)){if(P.rw>0)rlNote(N,'全彈重量 '+rlFmt(P.rw)+' → '+rlFmt(rwMin)+' g');P.rw=Math.round(rwMin);}}
  /* 材料清單要對得上質量（價格由材料算） */
  var bom=Array.isArray(P.bom)?P.bom.filter(function(x){return Array.isArray(x)&&matOf(x[0])&&+x[1]>=0;}).map(function(x){return [x[0],+x[1]];}):[];if(!bom.length)bom=(B.bom||[]).map(function(x){return [x[0],x[1]*P.m/B.m];});
  if(P.core&&P.core.mat){var cm=P.k==='lr'?rlMatRho(P.core.mat)*Math.PI/4*P.core.d*P.core.d*(+P.core.L||0)/1000:+P.core.m||0,hit=bom.filter(function(x){return x[0]===P.core.mat;})[0];if(!hit)bom.push(hit=[P.core.mat,0]);if(hit[1]<cm*0.98)hit[1]=rlR(cm,2);}
  var sum=bom.reduce(function(a,x){return a+x[1];},0);if(sum<P.m*0.9&&sum>0){var f=P.m*0.95/sum;bom.forEach(function(x){x[1]=rlR(x[1]*f,2);});}else if(!sum)bom=[['msteel',P.m]];P.bom=bom;
  /* 價格：沿用藍本的製造複雜度，不能直接填 */
  if(P.ref!==undefined&&P.ref!==B.ref)rlNote(N,'每發價格改由材料與製造算出');delete P.ref;if(!B.cx)try{LAL.calibrateCost(B);}catch(e){}P.cx=Math.max(B.cx||1.3,0.3);
  if(JSON.stringify(P)!==s0)P._v=(P._v||0)+1;return P;}

/* ---------- 三、材料 ---------- */
function rlMat(M,N){if(!LAL||!M||typeof M!=='object')return M;var X=rlEnv(),c=X.mat[M.cat];if(!c){var B0=LAL.MATS.filter(function(q){return q.id===M.id;})[0];M.cat=B0?B0.cat:'metal';c=X.mat[M.cat];rlNote(N,'類別改回現實存在的類別');}
  if(!(M.rho>0))M.rho=c.min.rho||1;rlCap(M,'rho',c.min.rho*0.95,1e9,N,'密度');
  RLMUP.forEach(function(f){if(!(M[f]>0)||!(c.max[f]>0))return;var hi=c.max[f]*1.05;if(c.sp[f]>0&&f!=='el')hi=Math.min(hi,c.sp[f]*1.05*M.rho);rlCap(M,f,0,hi,N,f);});
  if(Array.isArray(M.mh))M.mh=M.mh.map(function(v,i){var hi=(c.max['mh'+i]||1)*1.05;v=+v||0;if(v>hi){rlNote(N,'防護效率 '+rlFmt(v)+' → '+rlFmt(hi));v=hi;}return v;});
  /* 價格：至少同類最便宜的，而且性能比同類越好就越貴 */
  var pr=0,pn=0;RLMUP.forEach(function(f){if(M[f]>0&&c.max[f]>0&&f!=='el'){pr+=M[f]/c.max[f];pn++;}});pr=pn?pr/pn:0;
  var uMin=Math.max((c.min.usd||0.1)*0.9,(c.max.usd||1)*Math.pow(pr,2)*0.6);rlCap(M,'usd',uMin,1e9,N,'每公斤價格（美元）');if(M.fab!==undefined)rlCap(M,'fab',(c.min.fab||1)*0.95,1e3,N,'加工係數');
  return M;}

/* ---------- 四、載具模組 ---------- */
function rlMod(m,N){if(!LVL||!m||typeof m!=='object')return m;var X=rlEnv(),c=X.mod[m.br+'/'+m.sl];if(!c){rlNote(N,'沒有這種模組欄位');return null;}
  Object.keys(c.max).forEach(function(f){if(typeof m[f]!=='number')return;var lo=c.min[f],hi=c.max[f],low=RLLOW.indexOf(f)>=0;rlCap(m,f,low?lo*0.95:(lo>=0?lo*0.85:lo*1.15),low?Math.max(hi*1.5,lo):(hi>=0?hi*1.1:hi*0.85),N,f);});
  (RLPERF[m.sl]||[]).forEach(function(p){var v=+m[p];if(!(v>0))return;if(c.pk[p]>0&&m.kg>=0){var kg=v/(c.pk[p]*1.05);if(!(m.kg>=kg)){rlNote(N,'重量 '+rlFmt(m.kg||0)+' → '+rlFmt(kg)+' kg（'+p+' 每公斤不能超過現實）');m.kg=rlR(kg,1);}}
    if(c.pd[p]>0){var dy=v/(c.pd[p]*1.05);if(!(m.dy>=dy)){rlNote(N,'價格 '+rlFmt(m.dy||0)+' → '+rlFmt(dy)+'（'+p+' 每塊錢不能超過現實）');m.dy=Math.round(dy);}}});
  return m;}

/* ---------- 五、導引彈藥（飛彈、魚雷、炸彈、火箭） ---------- */
/* 真實世界同類彈藥的最高紀錄（運算庫裡沒有的超音速反艦飛彈、長程防空飛彈等）：射程（km）、速度（馬赫）、彈頭（kg） */
var RLMUNR={aam:{rng:400,mach:6,wh:60},sam:{rng:400,mach:14,wh:180},agm:{rng:300,mach:10,wh:500},arm:{rng:300,mach:4.5,wh:90},ashm:{rng:1000,mach:9,wh:1000},cm:{rng:5500,mach:4.6,wh:1000},
  rkt:{rng:12,mach:3,wh:20},bomb:{rng:12,mach:0,wh:9800},gbomb:{rng:130,mach:0,wh:2400},cbu:{rng:130,mach:0,wh:500},torp:{rng:100,mach:0.3,wh:300}};
function rlMun(m,N){if(!LVL||!m||typeof m!=='object')return m;var X=rlEnv(),c=X.mun[m.t];if(!c){m.t='agm';c=X.mun.agm;rlNote(N,'種類改為空對地飛彈');}if(!c)return m;var R=RLMUNR[m.t]||{};
  ['rng','mach','wh','pk'].forEach(function(f){if(m[f]>0&&(c.max[f]>0||R[f]>0))rlCap(m,f,0,f==='pk'?Math.min(0.99,c.max.pk*1.05):Math.max(c.max[f]||0,R[f]||0)*1.05,N,{rng:'射程（km）',mach:'速度（馬赫）',wh:'彈頭（kg）',pk:'命中率'}[f]);});
  /* 重量：射程與彈頭要裝得下燃料與炸藥；比同類最快的還快，需要更多推進劑 */
  if(!(m.kg>0))m.kg=c.min.kg||10;var mf=c.max.mach>0&&m.mach>c.max.mach?Math.sqrt(m.mach/c.max.mach):1,kg=Math.max(c.min.kg*0.8||1,(c.pk.rng>0&&m.rng>0?m.rng/(c.pk.rng*1.08):0)*mf,c.pk.wh>0&&m.wh>0?m.wh/(c.pk.wh*1.08):0);
  if(m.kg<kg){rlNote(N,'重量 '+rlFmt(m.kg)+' → '+rlFmt(kg)+' kg（射程、速度與彈頭要裝得下燃料與炸藥）');m.kg=rlR(kg,1);}
  var dy=munEstUsd(m)/(CUR.rate>0?CUR.rate:2.5)*0.7*(1+0.3*Math.max(0,(m.mach||0)-1));if(!(m.dy>=dy)){rlNote(N,'價格依種類、重量、射程與速度至少 '+rlFmt(dy*(CUR.rate||2.5))+' 美元');m.dy=Math.round(dy);}
  if(m.nuke&&!LVL.MUN.some(function(q){return q.t===m.t&&q.nuke;})&&['cm','ashm','sam','bomb','agm','torp'].indexOf(m.t)<0)delete m.nuke;return m;}

/* ---------- 六、核彈頭與毒劑 ---------- */
function rlNuke(W,N){if(!W||typeof W!=='object'||!LAL||!LAL.WMD)return W;var y=Math.round(rlN(W.y,1960));if(y<1945){W.y=y=1945;rlNote(N,'核武最早 1945 年');}if(W.k==='th'&&y<1952){W.k='fis';rlNote(N,'1952 年前沒有熱核彈頭');}
  rlCap(W,'Y',0.001,W.k==='th'?100000:W.k==='fis'?500:W.k==='er'?5:100000,N,'當量（kt）');var kg=LAL.WMD.nukeKg(W.Y,y,W.k);if(!(W.kg>=kg*0.95)){rlNote(N,'重量 '+rlFmt(W.kg||0)+' → '+rlFmt(kg)+' kg（當年的技術做不到更輕）');W.kg=kg;}
  if(LAL.WMD.nukeUsd){var u=LAL.WMD.nukeUsd(W.Y,W.k)*0.8;if(!(W.usd>=u)){W.usd=Math.round(u);rlNote(N,'價格依當量與種類');}}return W;}
function rlAgent(d,N){if(!d||typeof d!=='object'||typeof CBA==='undefined')return d;var c=d.c==='b'||d.c==='r'||d.c==='m'?d.c:'c';d.c=c;var L=Object.keys(CBA).map(function(k){return CBA[k];}).filter(function(A){return A[1]===c;});if(!L.length)return d;
  var y=Math.round(rlN(d.y,1960)),y0=Math.min.apply(null,L.map(function(A){return A[2]||0;}).filter(function(v){return v>0;}).concat([9999]));if(c!=='m'&&y<y0){d.y=y=y0;rlNote(N,'這類毒劑最早 '+y0+' 年');}
  var P=L.filter(function(A){return !A[2]||A[2]<=y+5;});if(!P.length)P=L;var mx=function(i){return Math.max.apply(null,P.map(function(A){return +A[i]||0;}));},mn=function(i){return Math.min.apply(null,P.map(function(A){return +A[i]||0;}));};
  rlCap(d,'k',0,mx(3)*1.1,N,'毒性');rlCap(d,'l',0,Math.min(1,mx(4)*1.1),N,'平民致死比例');rlCap(d,'p',0,mx(5)*1.1,N,'地面持久（小時）');rlCap(d,'life',1,mx(6)*1.1,N,'雲存續（分鐘）');
  rlCap(d,'mk',mn(8)*0.95,1,N,'面具防護');rlCap(d,'st',mn(9)*0.95,1,N,'防護服防護');return d;}

/* ---------- 七、武器：以內建武器為藍本，由彈藥與設計參數換算 ---------- */
/* 設計參數 w.dz：b 藍本（內建武器）、bl 身管長倍數（0.7～1.3）、rof 射速倍數（0.5～1.5）、nv 夜視（0 無、1 微光、2 熱像，受年代限制）、y 年份 */
var RLNVY=[0,1965,1978];
function rlWBase(w){var b=w.dz&&w.dz.b;if(b&&WPNO[b])return WPNO[b];if(w.lvd&&w.k&&w.k.indexOf('lvw')===0)return null;
  /* 舊的自訂武器沒有設計紀錄：先找同名的內建武器（複製時名稱後面加了「（改）」），再找類別、年代、每發重量與操作人數最接近的；不看殺傷數值（可能被改過） */
  var nm=String(w.n||'').replace(/（(改|匯入|複製|自訂)）/g,'').trim(),best=null,bs=1e9;for(var k in WPNO){var q=WPNO[k];if(q.n===nm)return q;if(q.hid&&!/^(acf|acj|aca|acb|acr|heli|thel|uav)$/.test(k))continue;
    var s=(q.cat===w.cat?0:5)+Math.abs((q.y||1950)-(+w.y||1950))/30+Math.abs(Math.log(Math.max(1e-4,q.kg||0.01)/Math.max(1e-4,+w.kg||0.01)))+Math.abs((q.crew||0)-(+w.crew||0))*0.3+((q.ind>0)!==(+w.ind>0)?3:0);if(s<bs){bs=s;best=q;}}return best;}
/* 一發彈藥的物理量：砲口動能、炸藥（TNT 當量公斤）、對人與對裝甲的指標 */
function rlRi(P,R,bl){var gun=!(P.rocket||P.guided),f=gun?Math.pow(bl||1,0.25):1,v=P.v0*f,Q=f!==1?Object.assign({},P,{v0:v,id:P.id+'~'+rlR(f,3)}):P,E=0.5*P.m/1000*v*v,H=0;try{H=LAL.heEq(P)||0;}catch(e){}var mm=penAt(Q,R)||0;
  return {E:E,H:H,v:v,mm:mm,ap:Math.sqrt(E)+25*Math.pow(H*1000,2/3)+(P.k==='shot'?60:0),at:Math.sqrt(mm)+0.5*Math.pow(H*1000,1/3),kg:pKg(P),usd:pUsd(P)};}
function rlAm(L,R,bl){var o={E:0,H:0,v:0,ap:0,at:0,mm:0,kg:0,usd:0,s:0,cal:0};(L||[]).forEach(function(a){var P=projOf(a[0]),s=+a[1]||0;if(!P||!s)return;var r=rlRi(P,R,bl);o.s+=s;['E','H','v','ap','at','kg','usd'].forEach(function(f){o[f]+=s*r[f];});o.mm=Math.max(o.mm,r.mm);if(s>=0.3)o.cal=Math.max(o.cal,P.d);});
  if(o.s>0)['E','H','v','ap','at','kg','usd'].forEach(function(f){o[f]/=o.s;});return o;}
/* 武器能用的彈藥：與藍本原本的彈藥同一類（步槍彈、機砲彈、戰車砲彈……），口徑在藍本的 0.6～1.5 倍之間 */
function rlAmFit(w){var B=w.dz&&WPNO[w.dz.b]||WPNO[w.k]||w,am0=wAmmo(B),gs={},c0=0;am0.forEach(function(a){var P=projOf(a[0]);if(P){gs[P.g]=1;c0=Math.max(c0,P.d);}});
  return function(P){if(!am0.length)return true;return !!gs[P.g]&&(!c0||P.d>=c0*0.6&&P.d<=c0*1.5);};}
function rlWpn(w,N){if(!w||typeof w!=='object'||w.mag)return w;if(WPNO[w.k])return w;var B=rlWBase(w);if(!B)return w;var dz=w.dz&&typeof w.dz==='object'?w.dz:(w.dz={});dz.b=B.k;
  var keep={k:w.k,n:String(w.n||B.n).slice(0,60),cat:String(w.cat||B.cat).slice(0,20),hid:w.hid?1:0,am:w.am,mu:w.mu,mt:w.mt,lvd:w.lvd,dz:dz},o=clone(B);delete o.base;delete o.spec;delete o.am0;delete o.Lo;delete o.lal;delete o.vmx;
  dz.bl=rlR(clamp(rlN(dz.bl,1),0.7,1.3),2);dz.rof=rlR(clamp(rlN(dz.rof,1),0.5,1.5),2);dz.y=Math.round(clamp(rlN(dz.y,B.y||1950),B.y||1850,2060));var nvMax=dz.y>=RLNVY[2]?2:dz.y>=RLNVY[1]?1:0;dz.nv=Math.round(clamp(rlN(dz.nv,B.nv||0),0,Math.max(nvMax,B.nv||0)));
  var bl=dz.bl,rof=dz.rof,R=B.ind>0?0:(B.rE||1000);o.y=dz.y;o.nv=dz.nv;if(B.L)o.L=rlR(B.L*bl,1);
  var am0=wAmmo(B),fit=rlAmFit(o),am1=Array.isArray(keep.am)&&keep.am.length?keep.am.filter(function(a){var P=Array.isArray(a)&&projOf(a[0]);if(P&&!fit(P)){rlNote(N,'「'+P.n+'」裝不進這種武器（類別或口徑不合）');return false;}return !!P;}).slice(0,8):null;
  if(LAL&&am0.length&&am1&&am1.length){var a=rlAm(am0,R,1),b=rlAm(am1,R,bl),q=function(x,y,lo,hi){return y>0&&x>0?clamp(x/y,lo,hi):1;};
    var rp=q(b.ap,a.ap,0.2,5),ra=q(b.at,a.at,0.2,5),rv=q(b.v,a.v,0.4,2.5),rE=q(b.E,a.E,0.05,20);
    o.pP=rlR(B.pP*rp*rof,5);o.pA=rlR(B.pA*ra*rof,5);o.sup=rlR(B.sup*Math.pow(rp,0.4)*Math.pow(rof,0.3),3);
    if(B.ind>0)o.ind=Math.round(B.ind*clamp(Math.pow(rv,1.6),0.4,1.8));else{o.rE=Math.round(B.rE*clamp(Math.pow(rv,0.6),0.6,1.5));o.rM=Math.round(B.rM*clamp(Math.pow(rv,0.8),0.5,1.7));}
    o.aa=rlR((B.aa||0)*clamp(rv,0.7,1.3)*Math.sqrt(rof),3);if(B.crew>0)o.crew=Math.max(1,Math.min(B.crew*3,Math.round(B.crew*Math.pow(rE,0.3))));
    o.am=am1;var ph=wPhys(o);if(ph.mm>0)o.pen=rlR(lvOfMm(ph.mm*Math.pow(bl,0.25)),1);o.ce=rlR(ph.ce,2);o.rusd=rlR(ph.usd,2);if(ph.kg>0)o.kg=rlR(ph.kg,3);
    o.rpu=Math.max(1,Math.round(B.rpu*Math.pow((a.kg||1)/Math.max(1e-6,b.kg||a.kg||1),0.8)*Math.sqrt(rof)));if(b.cal>0)o.cal=rlR(b.cal,1);
    o.usd=Math.round(wUsd(B)*Math.pow(rE,0.45)*Math.sqrt(bl)*Math.pow(rof,0.6)*(1+0.35*Math.max(0,dz.nv-(B.nv||0))));}
  else{delete keep.am;o.pP=rlR(B.pP*rof,5);o.pA=rlR(B.pA*rof,5);o.sup=rlR(B.sup*Math.pow(rof,0.3),3);o.usd=Math.round(wUsd(B)*Math.pow(rof,0.6)*(1+0.35*Math.max(0,dz.nv-(B.nv||0))));o.rpu=Math.max(1,Math.round(B.rpu*Math.sqrt(rof)));}
  o.acc=rlR(B.acc*Math.pow(bl,0.15)/Math.pow(rof,0.15)*(1+0.05*(dz.nv-(B.nv||0))),3);
  Object.keys(keep).forEach(function(f){if(keep[f]!==undefined)o[f]=keep[f];else delete o[f];});
  /* 連結導引彈藥：以換算後的數值為基準 */
  if(o.mu&&munOf(o.mu)){delete o.mub;munApply(o);}else delete o.mu;
  Object.keys(w).forEach(function(f){delete w[f];});Object.assign(w,o);return w;}

/* ---------- 八、單位類型：戰鬥數值鎖定在範本 ---------- */
/* 可改：名稱、符號、說明、圖片、軍官比例、規模（範本的 0.5～2 倍，火力隨人數或裝備數等比例）、移除旗標；其餘沿用範本 */
var RLTFREE=['k','n','sym','d','img','rk','cus','bt','men','veh','fl','load','toe','tseq','vn'];
function rlTypeBase(t){if(t.bt&&UT[t.bt])return UT[t.bt];var nm=String(t.n||'').replace(/（自訂）$/,'');for(var k in UT)if(UT[k].n===nm)return UT[k];var best=null,bs=1e9;for(var k2 in UT){var q=UT[k2];if(q.br!==t.br)continue;var s=Math.abs(((ERAI[q.era]||{}).y||1950)-((ERAI[t.era]||{}).y||1950))+Math.abs((q.men||0)-(t.men||0))/50;if(s<bs){bs=s;best=q;}}return best;}
/* 由載具設計生成的類型：依設計重新換算（數量可改） */
function rlTypeVd(t,N){var d=typeof vdesOf==='function'&&vdesOf(t.vdes);if(!d)return t;var n=Math.max(1,Math.min(60,Math.round(rlN(t.veh,1)))),sv=G.types,ts=G.tseq,tv=G._tv,ws=G.wseq,wp=clone(G.wpns||null),T=null;G.types={};
  try{T=d.br==='l'?vdToType(d,n,t.n):d.br==='a'?vdToTypeAir(d,n,t.n):vdToTypeSea(d,n,t.n);}catch(e){T=null;}G.types=sv;G.tseq=ts;G._tv=tv;G.wseq=ws;if(wp)G.wpns=wp;else delete G.wpns;if(!T)return t;
  var ch=[];Object.keys(T).forEach(function(f){if(RLTFREE.indexOf(f)>=0||f==='k'||f==='fl')return;if(JSON.stringify(t[f])!==JSON.stringify(T[f])){if(['sa','ha','arm','armC','vr','vx','aa','spot','men'].indexOf(f)>=0&&t[f]!==undefined)ch.push(f);t[f]=clone(T[f]);}});
  var fl0=String(T.fl||'');t.fl=String(t.fl===undefined?fl0:t.fl).split('').filter(function(c){return fl0.indexOf(c)>=0;}).join('');t.veh=n;if(ch.length)rlNote(N,'依載具設計重新換算（'+ch.join('、')+'）');return t;}
function rlType(t,N){if(!t||typeof t!=='object'||!t.cus||t.vmk||/^pl/.test(t.k||''))return t;if(t.vdes)return rlTypeVd(t,N);var B=rlTypeBase(t);if(!B)return t;t.bt=B.k;
  var o=clone(B),sz=1,dim=B.veh>0&&B.men<=B.veh*6?'veh':'men';var nb=+B[dim]||1,nt=rlN(t[dim],nb);sz=clamp(nt/nb,0.5,2);if(Math.abs(nt-nb*sz)>0.5)rlNote(N,'規模限制在範本的 0.5～2 倍');
  o.men=Math.max(1,Math.round((B.men||0)*sz));o.veh=Math.round((B.veh||0)*sz);['sa','ha','aa'].forEach(function(f){if(B[f]>0)o[f]=rlR(B[f]*sz,2);});
  var fl0=String(B.fl||''),fl=String(t.fl||'').split('').filter(function(c){return fl0.indexOf(c)>=0;}).join('');if(fl.length<String(t.fl||'').length)rlNote(N,'只能移除範本已有的特性旗標');o.fl=fl;
  var ch=[];['sa','ha','arm','armC','rE','rM','ind','spot','sig','nv','mor','trn','shock','mdef','ac','dig','vr','vx','hard','ba','end','dr','mob','era','br','dom'].forEach(function(f){if(t[f]!==undefined&&o[f]!==undefined&&t[f]!==o[f]&&!((f==='sa'||f==='ha')&&Math.abs(t[f]-o[f])<0.05))ch.push(f);});if(ch.length)rlNote(N,'戰鬥數值改回範本（'+ch.slice(0,6).join('、')+(ch.length>6?'…':'')+'）');
  RLTFREE.forEach(function(f){if(f==='men'||f==='veh'||f==='fl')return;if(t[f]!==undefined)o[f]=t[f];});o.k=t.k;o.cus=1;o.bt=B.k;
  Object.keys(t).forEach(function(f){delete t[f];});Object.assign(t,o);return t;}

/* ---------- 八之二、自訂載具型號：以內建型號為藍本，只能改名稱、國別、說明與在同類武器間換裝；性能要改請用設計細部計算 ---------- */
var RLVMN=['cr','px','t','arm','armC','vr','vx','fu','lk','dom','c','plat','tt','lc','exp','nj'];
/* 沒記錄藍本的舊型號：依類別、年份、重量、主武器與油箱找最接近的內建型號（不看裝甲、速度，可能被改過） */
function rlVmBase(m){var b=m.from&&vmOf(m.from);if(b&&!/^cv/.test(b.k))return b;var best=null,bs=1e9;VMR.forEach(function(q){if(vmDom(q)!==vmDom(m))return;var s=(q.c===m.c?0:4)+Math.abs((q.y||1950)-(+m.y||1950))/15+Math.abs(Math.log(Math.max(0.1,q.t||1)/Math.max(0.1,+m.t||q.t||1)))*3+(q.m&&m.m&&q.m[0]===m.m[0]?-2:0)+Math.abs((q.fu||0)-(+m.fu||0))/1000+(q.cr===+m.cr?0:0.5);if(s<bs){bs=s;best=q;}});return best;}
function rlVm(m,N){if(!m||typeof m!=='object')return false;var B=rlVmBase(m);if(!B)return false;m.from=B.k;var ch=[];m.y=Math.round(Math.max(rlN(m.y,B.y||0),B.y||0));
  RLVMN.forEach(function(f){if(JSON.stringify(m[f])!==JSON.stringify(B[f])){if(m[f]!==undefined&&B[f]!==undefined&&['arm','armC','vr','vx','t','cr','px'].indexOf(f)>=0)ch.push(f);if(B[f]===undefined)delete m[f];else m[f]=clone(B[f]);}});
  var r0=String(B.r||'').split('|');m.r=String(m.r||'').split('|').filter(function(r){return r0.indexOf(r)>=0;}).join('|')||B.r;
  /* 武器：主武器只能換成同類的，數量不超過藍本；副武器總數最多多兩件 */
  var bm=B.m,wm=m.m&&wpnOf(m.m[0]);if(bm){var b0=wpnOf(bm[0]);if(!wm||!b0||wm.cat!==b0.cat||(wm.y||0)>(+m.y||B.y||2000)+10){if(m.m&&m.m[0]!==bm[0])ch.push('主武器');m.m=clone(bm);}else m.m=[m.m[0],Math.min(+m.m[1]||1,bm[1]||1)];}else if(m.m){ch.push('主武器');m.m=null;}
  var sB=(B.s||[]).reduce(function(a,x){return a+(+x[1]||0);},0)+2,sN=0;m.s=(m.s||[]).filter(function(x){var w=wpnOf(x[0]);return w&&!(w.pA>=0.3&&w.pen>=8);}).map(function(x){var n=Math.max(0,Math.min(+x[1]||0,sB-sN));sN+=n;return [x[0],n];}).filter(function(x){return x[1]>0;});
  var eB=(B.e||[]).reduce(function(a,x){return a+(+x[1]||0);},0)+4,eN=0;m.e=(m.e||[]).map(function(x){var n=Math.max(0,Math.min(+x[1]||0,4,eB-eN));eN+=n;return [x[0],n];}).filter(function(x){return x[1]>0;});
  /* 造價：藍本加上換裝的差價 */
  var wu=function(L){return (L||[]).reduce(function(a,x){var w=wpnOf(x[0]);return a+(w?wUsd(w)*(+x[1]||0):0);},0);},dU=wu([m.m].concat(m.s||[]).filter(Boolean))-wu([B.m].concat(B.s||[]).filter(Boolean));
  var u=Math.round((B.usd||0)+Math.max(0,dU));if(+m.usd!==u){if(m.usd!==undefined&&Math.abs(+m.usd-u)>1)ch.push('造價');m.usd=u;}
  if(ch.length)rlNote(N,'性能沿用藍本「'+B.n+'」（'+ch.join('、')+'）；要改裝甲、速度或重量請用「設計細部計算」');return true;}
/* 聯機收到的載具設計：設計本身（模組選擇）與它用到的自訂模組、彈藥、材料、導引彈藥先檢查，再存進本局（不覆蓋已有的） */
function rlVdIn(X){var d=X.d;if(!d||typeof d!=='object'||typeof d.id!=='string'||!/^[A-Za-z0-9_.-]{1,40}$/.test(d.id)||['l','a','s'].indexOf(d.br)<0)return false;
  var put=function(key,obj,f){if(!obj||typeof obj!=='object')return;G[key]=G[key]||{};Object.keys(obj).slice(0,60).forEach(function(k){var x=obj[k];if(!x||typeof x!=='object'||G[key][k])return;x=clone(x);if(f(x,[])===null)return;G[key][k]=x;});};
  put('mats',X.mats,rlMat);put('ammo',X.ammo,rlRound);put('vmods',X.mods,rlMod);put('muns',X.muns,rlMun);var dd=clone(d);delete dd._u;G.vdes=G.vdes||{};G.vdes[dd.id]=dd;PCA={};VCA={};VDMC={};ARCA={};return true;}
/* ---------- 九、整局檢查（讀檔、匯入、聯機收到資料時） ---------- */
/* 設計資料庫（材料、彈藥、模組、導引彈藥、核彈頭、毒劑）：LatoArmory 工具存回來、讀檔與匯入時都先過這裡 */
function rlLib(g){g=g||G;var N=[];if(!g)return N;var each=function(o,f,lbl){if(!o)return;Object.keys(o).forEach(function(k){var x=o[k];if(!x||typeof x!=='object'){delete o[k];return;}var n=[];var r=f(x,n);if(r===null){delete o[k];n.push('已移除');}n.forEach(function(s){N.push(lbl+'「'+(x.n||k)+'」：'+s);});});};
  var sv=G;G=g;try{each(g.mats,rlMat,'材料');each(g.ammo,rlRound,'彈藥');each(g.vmods,rlMod,'載具模組');each(g.muns,rlMun,'導引彈藥');each(g.nwh,rlNuke,'核彈頭');each(g.cba,rlAgent,'毒劑');}finally{G=sv;}return N;}
function rlAll(g){g=g||G;if(!g)return [];var N=[],sv=G;G=g;try{RLX=RLX||null;
  rlLib(g).forEach(function(s){N.push(s);});
  if(g.wpns)Object.keys(g.wpns).forEach(function(k){var w=g.wpns[k];if(!w||typeof w!=='object'){delete g.wpns[k];return;}
    if(WPNO[k]){var h=w.hid?1:0;if(JSON.stringify(w)!==JSON.stringify(Object.assign({},WPNO[k],{hid:h}))){N.push('武器「'+(WPNO[k].n)+'」：內建武器不能直接改數值，已恢復內建值（要改請複製成設計）');g.wpns[k]=Object.assign(clone(WPNO[k]),{hid:h});}return;}
    if(/^lvw/.test(k)&&w.lvd&&typeof vdModel==='function'){VDMC={};var m=vdModel(w.lvd);if(m&&VDW[k]){g.wpns[k]=clone(VDW[k]);return;}}
    var s0=JSON.stringify(w);rlWpn(w);if(s0!==JSON.stringify(w)&&!/"dz"/.test(s0))N.push('武器「'+w.n+'」：改為依藍本「'+(WPNO[w.dz.b]||{}).n+'」與彈藥換算的設計');});
  if(g.types)Object.keys(g.types).forEach(function(k){var n=[];rlType(g.types[k],n);n.forEach(function(s){N.push('單位類型「'+g.types[k].n+'」：'+s);});});
  if(g.vms)Object.keys(g.vms).forEach(function(k){var m=g.vms[k];if(/^lv:/.test(k)&&typeof vdModel==='function'){VDMC={};var c=vdModel(k.slice(3));if(c){g.vms[k]=clone(c);if(c.m&&VDW[c.m[0]]){g.wpns=g.wpns||{};g.wpns[c.m[0]]=clone(VDW[c.m[0]]);}}else{delete g.vms[k];N.push('載具型號「'+(m&&m.n||k)+'」：找不到設計，已移除');}}
    else if(/^cv/.test(k)){var n=[];if(!rlVm(m,n)){delete g.vms[k];n.push('已移除');}n.forEach(function(s){N.push('載具型號「'+(m&&m.n||k)+'」：'+s);});}});
  PCA={};VCA={};VDMC={};if(typeof ARCA!=='undefined')ARCA={};g._tv=(g._tv||1)+1;}finally{G=sv;}return N;}
/* 讀檔：先檢查設計再重算各單位火力 */
(function(){var b=gameLoad;gameLoad=async function(){var r=await b.apply(this,arguments);try{var N=rlAll(G);if(N.length){G.rlN=N.slice(0,200);G.units.forEach(function(u){if(u.lg)logRecalc(u);});}}catch(e){}return r;};})();

/* ---------- 十、編制：武器多於人員能操作的部分當作備用 ---------- */
/* 能操作的人數：至少是範本編制所需的人數（內建編制都夠人用）；車載武器由車組操作，不另算 */
function rlNeed(W){var n=0;(W||[]).forEach(function(x){var d=wpnOf(x[0]);if(!d||(typeof wMt==='function'&&wMt(d)))return;n+=(+x[1]||0)*Math.max(1,d.crew||1);});return n;}
(function(){var b=logRecalc;logRecalc=function(u){var r=b.apply(this,arguments);try{var L=u.lg;if(L&&L.wpnF&&L.w&&L.w0){var cap=Math.max(u.men0||u.men||0,rlNeed(L.w0)),need=rlNeed(L.w);
  if(need>cap&&need>0){var f=cap/need,F=L.wpnF,g0=wAgg(L.w0,true),g1=wAgg(L.w);F.p=g0.p>0?clamp(g1.p*f/g0.p,0,4):1;F.a=g0.a>0?clamp(g1.a*f/g0.a,0,4):1;F.pAdd=g0.p>0?0:g1.p*f;F.aAdd=g0.a>0?0:g1.a*f;F.man=f;}else if(L.wpnF.man)delete L.wpnF.man;}}catch(e){}return r;};})();
/* 匯入編制或武器裝備檔：帶進來的自訂武器、類型與設計也先檢查，調整的項目列在匯入結果裡 */
(function(){var b=armsMerge;armsMerge=function(D,warn){var N=[];try{/* 先把本局與檔案裡的自訂武器、類型都換成設計，相同的設計才認得出來（共用而不重複） */N=rlAll(G);
    if(D&&D.wpns)Object.keys(D.wpns).forEach(function(k){var w=D.wpns[k];if(!w||typeof w!=='object')return;if(!WPNO[k])rlWpn(w);else if(JSON.stringify(w)!==JSON.stringify(Object.assign({},WPNO[k],{hid:w.hid?1:0}))){var kk=w.k;w.k='cw_tmp';rlWpn(w);w.k=kk;}});if(D&&D.types)Object.keys(D.types).forEach(function(k){var t=D.types[k];if(t&&typeof t==='object'&&t.cus!==0){t.cus=1;rlType(t,[]);}});}catch(e){}
  var r=b.apply(this,arguments);try{N=N.concat(rlAll(G));if(Array.isArray(warn))N.forEach(function(s){warn.push('現實限制：'+s);});}catch(e){}return r;};})();