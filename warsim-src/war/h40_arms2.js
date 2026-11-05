/* ===================== 裝備整合：彈藥（LatoArmory 外彈道與終端彈道）、裝甲（動能與化學能分開計算）、支援裝備與造價 =====================
   作戰仍以「穿甲等級／裝甲等級（0～16）」結算；物理量（毫米 RHA）與等級的換算如下，內建武器與單位維持原本校準過的等級，
   自訂的武器、彈藥、裝甲與載具則由 LatoArmory 的物理模型算出毫米數再換成等級。
   支援裝備（頭盔、防彈衣、夜視、反應裝甲、主動防護、煙幕彈、雷射測距、衛星定位……）的效果都相對於該兵種在該時代的標準配備計算：
   標準配備的部隊與過去完全相同，多配或少配才會改變。 */

/* ---------- 一、物理量 ↔ 等級 ---------- */
function lvOfMm(mm){return mm>0?clamp(2.56*Math.log(mm)-5.4,0,16):0;}
function mmOfLv(L){return L>0?Math.exp((L+5.4)/2.56):0;}
/* 等效裝甲依受彈機率加權：正面 45%、側面 40%、後方與頂部 15% */
function armLvOfZones(f,s,r){return 0.45*lvOfMm(f)+0.4*lvOfMm(s)+0.15*lvOfMm(r);}

/* ---------- 二、武器的彈藥、化學能比例與價格（2020 年美元） ---------- */
var WAMMO={bolt:[['r54lps',1]],semi:[['r762m80',1]],asr1:[['r762msc',1]],asr:[['r762msc',1]],asr2:[['r556m855',1]],asr3:[['r556a1',1]],smg:[['p9fmj',1]],snp:[['r338',1]],
  mge:[['r762m80',1]],lmg:[['r762m80',1]],gpmg:[['r762m80',1]],hmg:[['h50m33',0.7],['h50ap',0.3]],acan:[['a30fs',0.4],['a30api',0.6]],gl:[['g40hedp',1]],gren:[['gm67',1]],
  atr2:[['rpg7v',0.7],['rpg7vr',0.3]],atgm:[['tow2a',1]],atgm2:[['tow2a',1]],atgm3:[['javelin',1]],tgun:[['t75m61',1]],tgunh:[['t88pzgr39',1]],atg:[['t75m61',1]],
  mbt1:[['t105m833',0.6],['t105heat',0.4]],mbt2:[['t120m829a1',0.6],['t120heat',0.4]],tgunm:[['t120m829a1',0.6],['t120heat',0.4]],mbt3:[['t120m829a3',0.6],['t120heat',0.4]],
  morh:[['mor120',1]],h155:[['art155m107',1]],h155p:[['art155m795',1]],ngm:[['n127he',1]]};
var WCE={atr:1,atr2:1,atgm1:1,atgm2:1,atgm3:1,atgm:1,gl:0.8,fpv:1,fpv2:1,loit:1,heli:0.8,uav:0.8,mbt1:0.3,mbt2:0.3,mbt3:0.3,tgunm:0.3,aca:0.4,ssm:1,magic:0.5};
var WUSD={pike:80,sword:250,match:1500,flint:1200,carb:1000,pist:600,rmus:1000,brl:900,bolt:700,semi:900,asr1:700,asr:700,asr2:1300,asr3:3500,smg:800,snp:8000,mge:15000,hmg:15000,lmg:5000,gpmg:8000,gl:2000,gren:0,demo:0,
  atr:3000,atr2:1500,atgm1:40000,atgm2:150000,atgm:150000,atgm3:180000,atg:120000,morl:15000,morm:60000,morh:150000,tmor:20000,canl:30000,canm:80000,howe:100000,rifg:150000,qf75:300000,h105:1200000,h150:2000000,h155:2500000,h155p:4000000,
  mrle:150000,mrlc:1500000,mrlm:3000000,aage:80000,aag:200000,aaam:2500000,sam:1500000,manpad:120000,tgun1:40000,tgun:150000,tgunh:250000,mbt1:600000,mbt2:1200000,mbt3:2000000,tgunm:1200000,acan:600000,
  ngs:30000,ngm:2000000,ngb:15000000,torp:3000000,ssm:2000000,acf:200000,acj:3000000,aca:3000000,acb:2000000,acr:500000,heli:4000000,thel:300000,uav:1000000,fpv:500,fpv2:2000,loit:60000,bomb:5000,breath:0,claw:0,magic:500000};
var RUSD={match:0.5,flint:0.5,carb:0.5,pist:0.5,rmus:0.6,brl:0.5,bolt:0.4,semi:0.45,asr1:0.3,asr:0.3,asr2:0.42,asr3:0.55,smg:0.25,snp:3,mge:0.4,hmg:3.4,lmg:0.4,gpmg:0.6,gl:45,gren:40,demo:50,atr:500,atr2:900,atgm1:25000,atgm2:93000,atgm:93000,atgm3:200000,
  atg:450,morl:300,morm:600,morh:900,tmor:300,canl:100,canm:150,howe:200,rifg:300,qf75:400,h105:700,h150:1200,h155:1600,h155p:70000,mrle:800,mrlc:3000,mrlm:160000,aage:200,aag:150,aaam:100,tgun1:100,tgun:450,tgunh:700,mbt1:2500,mbt2:3500,mbt3:9000,tgunm:3500,acan:140,
  ngs:50,ngm:1500,ngb:10000,acj:5000,aca:20000,acb:30000,heli:100000,uav:100000,bomb:2000,magic:5000};
var VUSD={horse:3000,wagon:4000,cart:5000,truck:120000,car:80000,ht:250000,apc:1500000,ifv:4000000,tk1:1000000,tkm:1500000,tkh:3000000,mbt:7000000,spg:3500000,recv:2000000,mrlv:1500000,ewv:5000000,gun:0,
  ship:400000000,sail:5000000,subm:800000000,plane:1500000,jet:50000000,helo:25000000,drone:5000000,airship:20000000,beast:0};
function wAmmo(w){return w&&(w.am||WAMMO[w.k])||[];}
function wCe(w){return !w?0:w.ce!==undefined&&w.ce!==''?clamp(+w.ce||0,0,1):WCE[w.k]||0;}
function wUsd(w){return !w?0:w.usd!==undefined&&w.usd!==''?+w.usd||0:WUSD[w.k]||0;}
function wRUsd(w){return !w?0:w.rusd!==undefined&&w.rusd!==''?+w.rusd||0:RUSD[w.k]||0;}

/* ---------- 三、支援裝備 ----------
   效果：pf 破片與爆炸殺傷減免、pb 槍彈殺傷減免（人員）、nv 夜視等級、kc 化學能裝甲＋、kk 動能裝甲＋（車輛）、smk 中彈時自動施放煙幕、
         art 砲兵系統誤差倍率、acc 直射命中倍率增量、jam 無人機攻擊倍率、hot 熱食、pur 淨水、med 傷重不治減少、sp 觀測距離增量、
         cs 通信傳遞時間倍率、cr 無線電距離倍率、rl 中繼（距離再乘）、cj 受干擾倍率、gm 防毒面具、gs 防護服、det 毒劑偵檢、atr 神經毒劑解毒、dk 除污、
         ev 救護後送、mq 醫療品質＋、mr 掃雷滾輪、dg 構工速度增量、cb 反砲兵雷達（效果的作用見 h44_eqfx.js）
   覆蓋：人員裝備依人數、車輛裝備依車輛數、單位裝備有一件就生效 */
var SEQR=[
 ['helm1','鋼盔','頭盔',1915,60,1.3,'m',{pf:0.08}],['helm2','克維拉頭盔','頭盔',1983,350,1.5,'m',{pf:0.12,pb:0.03}],['helm3','高防護頭盔（ACH／ECH 類）','頭盔',2003,700,1.4,'m',{pf:0.15,pb:0.05}],
 ['flak','防破片背心','防彈衣',1952,250,3.6,'m',{pf:0.12}],['vest2','軟式防彈衣（NIJ IIIA）','防彈衣',1975,600,2.5,'m',{pf:0.15,pb:0.04}],['plate3','插板防彈衣（NIJ III）','防彈衣',1995,1500,7,'m',{pf:0.18,pb:0.12}],['plate4','插板防彈衣（NIJ IV）','防彈衣',2005,2800,11,'m',{pf:0.2,pb:0.18}],
 ['gasmask','防毒面具','防護',1916,150,1,'m',{gm:1}],['cbsuit','防護服（MOPP 套裝）','防護',1960,250,2.7,'m',{gs:1}],['atro','神經毒劑解毒針','防護',1955,40,0.15,'m',{atr:1}],
 ['cbdet','化學偵檢器','防護',1960,20000,15,'u',{det:1}],['decon','除污車','防護',1960,400000,9000,'u',{dk:1}],
 ['medkit','單兵急救包與止血帶','醫療',1940,80,0.4,'m',{med:0.25}],['amb','救護車','醫療',1915,150000,3000,'u',{ev:1}],['surg','野戰手術組','醫療',1940,500000,2500,'u',{mq:0.15}],
 ['nvg1','第一代夜視鏡','夜視',1965,3000,1,'m',{nv:1}],['nvg3','第三代夜視鏡','夜視',1990,6000,0.6,'m',{nv:1}],['therm','熱像瞄具','夜視',1985,20000,2,'v',{nv:2}],
 ['radio1','背負式無線電','通信',1938,3000,15,'u',{cs:0.9,cr:1.3}],['radio2','數位跳頻無線電','通信',1990,20000,6,'u',{cs:0.8,cr:1.5,cj:0.5}],['bms','戰場管理系統（數位指管）','通信',2005,60000,20,'u',{sp:0.1,cs:0.7,cr:1.5,cj:0.6}],
 ['satcom','衛星通訊終端','通信',2000,80000,30,'u',{cs:0.85,cr:3,cj:0.7}],['relay','無線電中繼站','通信',1945,40000,400,'u',{rl:1.5}],
 ['laser','雷射測距儀','火控',1975,10000,2,'v',{acc:0.08}],['fcs','數位火控系統','火控',2000,300000,60,'v',{acc:0.15}],['gps','衛星定位接收器','火控',1993,2000,0.5,'u',{art:0.55}],['met','砲兵氣象站','火控',1960,250000,800,'u',{art:0.7}],
 ['smk','煙幕彈發射器','煙幕',1940,5000,40,'v',{smk:1}],['slat','柵欄裝甲','附加裝甲',1960,20000,300,'v',{kc:1.2}],['era1','爆炸反應裝甲（第一代）','附加裝甲',1982,150000,1200,'v',{kc:2.2}],
 ['era2','重型爆炸反應裝甲（接觸-5 類）','附加裝甲',1986,250000,2500,'v',{kc:2.5,kk:0.6}],['aps0','軟殺主動防護（干擾與煙幕）','主動防護',1990,200000,150,'v',{kc:1.2}],['aps1','硬殺主動防護（攔截彈）','主動防護',2010,1000000,800,'v',{kc:3}],
 ['roller','掃雷滾輪','工兵',1943,150000,8000,'v',{mr:1}],['plough','推土鏟','工兵',1943,60000,2500,'v',{dg:0.3}],['jammer','反無人機干擾器','電子戰',2015,300000,200,'u',{jam:0.6}],['sdrone','小型偵察無人機','觀測',2010,15000,3,'u',{sp:0.2}],
 ['gsr','地面監視雷達','觀測',1965,400000,300,'u',{sp:0.25}],['cbradar','反砲兵雷達','觀測',1975,15000000,8000,'u',{cb:1}],
 ['kitchen','野戰廚房','後勤',1900,40000,3000,'u',{hot:1}],['purif','淨水設備','後勤',1960,15000,400,'u',{pur:1}]];
var SEQ={};SEQR.forEach(function(r){SEQ[r[0]]={k:r[0],n:r[1],cat:r[2],y:r[3],usd:r[4],kg:r[5],cov:r[6],fx:r[7]};});
function seqOf(k){return (G&&G.seq&&G.seq[k])||SEQ[k]||null;}
function seqList(){var o=[];for(var k in SEQ)o.push(seqOf(k));if(G&&G.seq)for(var k2 in G.seq)if(!SEQ[k2])o.push(G.seq[k2]);return o;}
/* 標準配備：依兵種與年代 */
function defEq(t){var E=ERAI[t.era]||ERA[6],y=E.y,m=t.men||0,v=t.veh||0,br=t.br,o=[],A=function(k,n){n=Math.round(n);if(n>0)o.push([k,n]);};if(E.fan||br==='drg'||br==='mon'||t.dom==='air'||t.dom==='sea'||t.dom==='sub')return o;
  var foot=/inf|abn|sof|mot|mech|eng|rec|hq|mg|at|ad|mor|art|rkt|sup|ew|uav|cav|pike/.test(br);
  if(foot&&y>=1915)A(y>=2003?'helm3':y>=1983?'helm2':'helm1',m);
  if(/inf|abn|sof|mot|mech|eng|rec/.test(br)){if(y>=2005)A('plate4',m*0.9);else if(y>=1995)A('plate3',m*0.9);else if(y>=1975)A('vest2',m*0.9);else if(y>=1952)A('flak',m*0.8);
    if(y>=1990)A('nvg3',m*0.35);else if(y>=1965)A('nvg1',m*0.05);if(y>=1940)A('medkit',m);}
  if(y>=1916&&y<1950&&foot)A('gasmask',m);if(y>=1950&&foot)A('gasmask',m);if(y>=1960&&foot){A('cbsuit',m);A('atro',m);}if(y>=1960&&/hq|eng|rec/.test(br))A('cbdet',1);
  if(y>=1938)A(y>=1990?'radio2':'radio1',Math.max(1,m/30));if(y>=2005&&/hq|arm|mech/.test(br))A('bms',Math.max(1,v/4));if(y>=1993&&foot)A('gps',Math.max(1,m/10));
  if(/arm|mech|at|rec/.test(br)&&v>0){if(y>=1960)A('smk',v);if(y>=1975&&/arm|at/.test(br))A('laser',v);if(y>=1985)A('therm',v);if(y>=2000&&br==='arm')A('fcs',v);if(utHas(t,'P'))A('aps1',v);}
  if(/art|rkt/.test(br)){if(y>=1960)A('met',1);if(y>=1993)A('gps',Math.max(1,v));}
  if(br==='eng'&&y>=1943&&v>0)A('plough',Math.max(1,v/3));if(y>=1900&&/hq|sup/.test(br))A('kitchen',1);if(y>=1960&&/hq|sup|eng/.test(br))A('purif',1);
  if(y>=2015&&/hq|mech|ad/.test(br))A('jammer',1);if(y>=2010&&/inf|mech|rec/.test(br))A('sdrone',Math.max(1,m/60));return o;}
/* 支援裝備的合計效果 */
function eqAgg(E,men,veh){var o={pf:0,pb:0,nv:0,kc:0,kk:0,smk:0,art:1,acc:0,jam:1,hot:0,pur:0,med:0,sp:0,cs:1,cr:1,rl:1,cj:1,cm:0,gm:0,gs:0,det:0,atr:0,dk:0,ev:0,mq:0,mr:0,dg:0,cb:0},cat={},val=function(e){var F=e.fx||{};return (F.pf||0)+(F.pb||0)+(F.kc||0)+(F.kk||0);};
  /* 同一類（例如頭盔、防彈衣、附加裝甲）以較好的先配發，覆蓋率最多到全員或全車 */
  (E||[]).filter(function(x){return seqOf(x[0]);}).sort(function(a,b){return val(seqOf(b[0]))-val(seqOf(a[0]));}).forEach(function(x){var e=seqOf(x[0]),n=x[1]||0;if(!e||n<=0)return;var F=e.fx||{},cov=e.cov==='m'?clamp(n/Math.max(1,men),0,1):e.cov==='v'?clamp(n/Math.max(1,veh),0,1):1;
    var c=cat[e.cat]||(cat[e.cat]={pf:0,pb:0,kc:0,kk:0,cv:0});var room=Math.max(0,1-c.cv),use=Math.min(room,cov);c.cv+=use;c.pf+=use*(F.pf||0);c.pb+=use*(F.pb||0);c.kc+=use*(F.kc||0);c.kk+=use*(F.kk||0);
    if(F.nv&&cov>=0.1)o.nv=Math.max(o.nv,F.nv);if(F.smk&&cov>=0.5)o.smk=1;if(F.art)o.art=Math.min(o.art,F.art);if(F.acc)o.acc+=cov*F.acc;if(F.jam)o.jam=Math.min(o.jam,F.jam);if(F.hot)o.hot=1;if(F.pur)o.pur=1;if(F.med)o.med=1-(1-o.med)*(1-clamp(cov*F.med,0,0.9));if(F.sp)o.sp+=F.sp;
    if(F.cs)o.cs=Math.min(o.cs,F.cs);if(F.cr){o.cr=Math.max(o.cr,F.cr);o.cm=1;}if(F.rl)o.rl=Math.max(o.rl,F.rl);if(F.cj)o.cj=Math.min(o.cj,F.cj);
    if(F.gm)o.gm=Math.max(o.gm,cov*F.gm);if(F.gs)o.gs=Math.max(o.gs,cov*F.gs);if(F.atr)o.atr=Math.max(o.atr,cov*F.atr);if(F.det)o.det=1;if(F.dk)o.dk=Math.max(o.dk,F.dk);
    if(F.ev)o.ev=Math.max(o.ev,F.ev);if(F.mq)o.mq=Math.max(o.mq,F.mq);if(F.mr&&cov>=0.2)o.mr=1;if(F.dg)o.dg+=cov*F.dg;if(F.cb)o.cb=1;});
  Object.keys(cat).forEach(function(k){var c=cat[k];o.pf+=c.pf;o.pb+=c.pb;o.kc+=c.kc;o.kk+=c.kk;});o.pf=Math.min(0.6,o.pf);o.pb=Math.min(0.5,o.pb);return o;}
/* 單位的支援裝備係數：相對於標準配備 */
function eqRecalc(u){var L=u.lg;if(!L)return;var men=u.men0||sum(typesOfU(u),function(m){var t=typeOf(m[0]);return t?t.men*(m[1]||1):0;}),veh=u.veh0||0;
  var a=eqAgg(L.eq,men,veh),b=eqAgg(L.eq0,men,veh);L.eqF={mF:(1-a.pb)/(1-b.pb),mA:(1-a.pf)/(1-b.pf),nv:a.nv,kc:a.kc-b.kc,kk:a.kk-b.kk,smk:a.smk,art:a.art/b.art,acc:(1+a.acc)/(1+b.acc),jam:a.jam/b.jam,hot:a.hot,pur:a.pur,med:a.med,sp:a.sp-b.sp,
    /* v2：以下都是倍率或差值，標準配備時為 1 或 0 */v:2,spm:clamp((1+a.sp)/(1+b.sp),0.7,1.6),cq:{s:clamp(a.cs/b.cs,0.6,1.5),r:clamp(a.cr*a.rl/(b.cr*b.rl),0.5,2.5),j:clamp(a.cj/b.cj,0.3,2),ok:!(b.cm&&!a.cm),has:a.cm>0},
    du:clamp((1-a.med)/(1-b.med)*(a.ev>b.ev?0.8:a.ev<b.ev?1.25:1),0.5,1.6),ev:a.ev-b.ev,mq:a.mq-b.mq,hr:a.hot-b.hot,pr:a.pur-b.pur,
    gmr:b.gm>0?a.gm/b.gm:1,gm1:a.gm,gsr:b.gs>0?a.gs/b.gs:1,gs1:a.gs,dt:a.det-b.det,atA:a.atr,atB:b.atr,dk:a.dk,mr:a.mr,dg:clamp((1+a.dg)/(1+b.dg),0.7,1.6),cb:a.cb};}
/* 讀取效果（舊存檔沒有 v2 欄位時先重算）；eqM 取倍率，沒有時為 1 */
function eqF2(u){var L=u&&u.lg;if(!L)return null;var F=L.eqF;if(F&&F.v===2)return F;if(!L.eq0&&!L.eq)return null;if(L.eq0)eqRecalc(u);else eqInit(u);return L.eqF&&L.eqF.v===2?L.eqF:null;}
function eqM(u,k){var F=eqF2(u);return F&&F[k]!==undefined?F[k]:1;}
function eqInit(u){var L=u.lg;if(!L)return;if(!L.eq0){var E={};typesOfU(u).forEach(function(m){var t=typeOf(m[0]);if(!t)return;var n=m[1]||1;((t.load&&t.load.eq)||defEq(t)).forEach(function(x){E[x[0]]=(E[x[0]]||0)+x[1]*n;});});L.eq0=Object.keys(E).map(function(k){return [k,E[k]];});}
  if(!L.eq)L.eq=clone(L.eq0);eqRecalc(u);}
(function(){var b=logInit;logInit=function(u){var r=b(u);eqInit(u);return r;};})();
(function(){var b=logRecalc;logRecalc=function(u){b(u);var L=u.lg;if(!L)return;if(L.eq0)eqRecalc(u);else eqInit(u);var ce=0,aw=0;(L.w||[]).forEach(function(x){var w=wpnOf(x[0]);if(!w)return;var a=(x[1]||0)*(w.pA||0)*(w.acc||1);ce+=a*wCe(w);aw+=a;});if(L.wpnF)L.wpnF.ce=aw?ce/aw:0;};})();
(function(){var b=nvOf;nvOf=function(u,s){var v=b(u,s),F=u&&u.lg&&u.lg.eqF;return F&&F.nv>v?F.nv:v;};})();

/* ---------- 四、作戰中的裝甲：動能（穿甲彈）與化學能（聚能裝藥）分開；反應裝甲、柵欄、主動防護加在化學能裝甲上 ---------- */
(function(){var b=mixStats;mixStats=function(mix){var o=b(mix),w=0,s=0,any=false;mix.forEach(function(m){var t=typeOf(m[0]);if(!t)return;var n=m[1]||1,ww=t.men*n+t.veh*n*8+1;s+=(t.armC!==undefined?t.armC:t.arm)*ww;w+=ww;if(t.armC!==undefined)any=true;});o.armC=any&&w?s/w:o.arm;return o;};})();
function ceOf(u){var f=u&&u.lg&&u.lg.wpnF;return f&&f.ce!==undefined?f.ce:0;}
/* 對攻擊者 u 而言，目標 t 的有效裝甲等級 */
function armVs(t,ts,u){var F=t&&t.lg&&t.lg.eqF,ak=ts.arm+(F?F.kk:0),ce=ceOf(u);if(ce<=0&&!(F&&F.kk))return ts.arm;var ac=(ts.armC!==undefined?ts.armC:ts.arm)+(F?F.kc:0);return ak*(1-ce)+ac*ce;}

/* ---------- 五、支援裝備在作戰中的效果：防彈衣與頭盔減少人員殺傷、反無人機干擾、中彈施放煙幕 ---------- */
var EQSOFT={fire:'b',melee:'b',art:'f',air:'f',airstrike:'f',carpet:'f',expl:'f',msl:'f',drop:'f'};
(function(){var b=hit;hit=function(t,src,dm,dv,sup,kind){var F=t&&t.lg&&t.lg.eqF;if(F){var k=EQSOFT[kind];if(k&&dm>0)dm*=k==='b'?F.mF:F.mA;if(F.jam<1&&src&&kind==='fire'){var ss=ST(src);if(ss.br==='uav'||ss.fl.indexOf('d')>=0){dm*=F.jam;dv*=F.jam;}}}
  b(t,src,dm,dv,sup,kind);
  if(F&&F.smk&&kind==='fire'&&dv>0.02&&!(t.smkT&&G.t-t.smkT<1200)&&onMap(t)&&typeof smokeAt==='function'){var ts=ST(t);if(ts.hard>=0.5&&ts.dom==='land'){t.smkT=G.t;smokeAt(t.x,t.y,90,180,t.side,t.id);if(!t.smkLog||G.t-t.smkLog>3600){t.smkLog=G.t;logE(t.side,'tac',uName(t)+'中彈後施放煙幕掩護',t.x,t.y,t.id);}}}};})();

/* ---------- 六、造價（2020 年美元） ---------- */
function eraKit(y){return y<1800?300:y<1900?500:y<1940?800:y<1970?1500:y<2000?3000:6000;}
function loadUsd(W,V,E,men,h,y,basic,vusd){var c={w:0,a:0,v:0,e:0,p:0,h:0};(W||[]).forEach(function(x){var w=wpnOf(x[0]);if(!w)return;c.w+=x[1]*wUsd(w);c.a+=x[1]*(w.rpu||0)*(basic||1)*wRUsd(w);});
  if(vusd)c.v=vusd;else(V||[]).forEach(function(x){c.v+=x[1]*(VUSD[x[0]]||0);});(E||[]).forEach(function(x){var e=seqOf(x[0]);if(e)c.e+=x[1]*(e.usd||0);});c.p=(men||0)*eraKit(y);c.h=(h||0)*VUSD.horse;c.t=c.w+c.a+c.v+c.e+c.p+c.h;return c;}
function typeVusd(t){return t&&t.vusd>0?t.vusd*(t.veh||0):0;}
function typeUsd(t){if(typeof t==='string')t=typeOf(t);if(!t)return {t:0};var D=t.load||defLoad(t),y=(ERAI[t.era]||ERA[6]).y;return loadUsd(D.w,D.v,(t.load&&t.load.eq)||defEq(t),t.men,D.h,y,t.ind>0?1.5:2,typeVusd(t));}
function unitUsd(u){if(!u)return {t:0};if(!isLeaf(u)){var o={w:0,a:0,v:0,e:0,p:0,h:0,t:0};leavesOf(u).forEach(function(q){var c=unitUsd(q);for(var k in o)o[k]+=c[k]||0;});if(u.hq){var hq=typeUsd(u.hq);for(var k2 in o)o[k2]+=hq[k2]||0;}return o;}
  var L=u.lg||logInit(u),vu=0;typesOfU(u).forEach(function(m){var t=typeOf(m[0]);if(t&&t.vusd>0)vu+=typeVusd(t)*(m[1]||1);});return loadUsd(L.w,L.v,L.eq,L.rk?L.rk[0]+L.rk[1]+L.rk[2]:u.men0,L.h0,uEra(u).y,L.basic,vu);}
function sideUsd(side){var o={w:0,a:0,v:0,e:0,p:0,h:0,t:0};G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||u.irr)return;var c=unitUsd(u);for(var k in o)o[k]+=c[k]||0;});return o;}
function usdTxt(v){v=+v||0;return v>=1e8?'US$'+fx(v/1e8,v>=1e9?1:2)+' 億':v>=1e4?'US$'+fmt(Math.round(v/1e4))+' 萬':v<100?'US$'+fx(v,2):'US$'+fmt(Math.round(v));}
/* 增援點數可依造價計算（設定：每點多少美元） */
(function(){var b=rpTypeCost;rpTypeCost=function(tk,n){var per=+(G&&G.set&&G.set.rpUsd)||0;if(per>0)return Math.max(1,Math.round(typeUsd(tk).t*(n||1)/per));return b(tk,n);};})();
