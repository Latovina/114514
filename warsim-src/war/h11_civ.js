/* ===================== 平民、難民、戰俘、傷患與財產損失 =====================
   聚落人口（成年男性、成年女性、兒童、長者）、提前撤離、警戒與避難、平民傷亡（砲擊、空襲、交叉火力、核武、災害、暴行）、
   難民隊伍（沿道路往信任的一方後方或收容所，可能被阻擋、驅逐或射擊）、難民營與戰俘營、戰俘（受降、押解、收容、勞役、處決與死亡）、
   傷兵後送與醫療（陣亡、負傷、傷重不治、歸隊）、佔領與民怨、糧食、財產損失（自訂幣值）。
   嚴肅模擬：所有數字都是推估，用來呈現戰爭的代價，不作為「得分」。 */
var EVACR={none:['不撤離',0],part:['部分撤離',0.35],most:['大部分撤離',0.7],full:['幾乎全部撤離',0.95]};
var WEALTH={poor:['貧窮',0.4,0.6],mid:['中等',1,1],rich:['富裕',2.4,1.4]};
var LOYN={home:'各自支持原控制方',s0:'全支持藍方（第一方）',s1:'全支持紅方（第二方）',split:'各地分歧',neutral:'中立（只想避禍）'};
var MOBN={low:['低（承平）',0.1],mid:['中（局部動員）',0.3],high:['高（全面動員）',0.5],total:['總體戰',0.7]};
var CIVK={art:'砲擊',air:'空襲',fire:'交叉火力',nuke:'核武',quake:'地震',flood:'洪水',storm:'風災',heat:'酷熱',cold:'嚴寒',fireS:'火災',mass:'屠殺與處決',exec:'處決',refshot:'向難民開火',hunger:'飢餓',disease:'疾病',exposure:'露宿與疲病',landslide:'山崩',mine:'地雷與未爆彈',rape:'性暴力',deport:'強制遷徙'};
function eraDev(y){return byYear([[1600,0.05],[1700,0.06],[1800,0.08],[1860,0.12],[1900,0.18],[1914,0.2],[1940,0.28],[1970,0.55],[2000,0.85],[2024,1]],y);}
function curN(){return (G.set.cur&&G.set.cur.n)||'元';}
function curPer(){return (G.set.cur&&G.set.cur.per)||60000;}
/* 想定貨幣金額；想定貨幣掛勾美元、而畫面選了別的顯示幣種時，附上換算 */
function money(v){var a=Math.abs(v||0),u=a>=1e12?[1e12,' 兆']:a>=1e8?[1e8,' 億']:a>=1e4?[1e4,' 萬']:[1,''],t=fmt((v||0)/u[0],u[0]>1&&a/u[0]<100?1:0)+u[1]+' '+curN(),c=G&&G.set&&G.set.cur;
  if(c&&c.usd>0&&typeof amoney==='function'&&typeof CUR!=='undefined'&&CUR.sel!=='scn')t+='（約 '+amoney((v||0)*c.usd)+'）';return t;}
/* 年代的兒童與長者比例 */
function ageMix(y){var k=byYear([[1600,0.4],[1850,0.38],[1914,0.33],[1940,0.3],[1980,0.24],[2024,0.18]],y),e=byYear([[1600,0.05],[1900,0.06],[1940,0.08],[1980,0.11],[2024,0.17]],y);return [k,e];}
/* ---------- 政策：師團（或任何編制）可覆寫陣營預設 ---------- */
function polSide(side){var S=SD(side);if(!S.pol)S.pol={pow:1,civ:1,doct:'mixed',press:'control',show:'occ',leave:'rot',sex:'ban',fem:'hist'};return S.pol;}
/* ---------- 時代與戰爭法：越古老的軍隊越沒有國際法與人道的概念 ----------
   1864 年日內瓦公約（戰場傷患）、1899／1907 年海牙公約（戰俘與佔領區平民）、1929 年日內瓦戰俘公約、1949 年日內瓦四公約。
   之前只有各地的習慣（饒命、交換俘虜、贖金），劫掠城鎮、就地徵糧被視為理所當然。
   欄位：起始年、說明、戰俘態度下限、平民態度下限、壓力倍率（越大越容易失控）、軍紀基準修正 */
var LAWERA=[[0,'沒有成文的戰爭法，劫掠與屠城常見',2,2,1.6,-14],[1600,'只有習慣與軍人榮譽，饒命與交換俘虜全看戰況',1,2,1.45,-10],[1790,'徵兵大軍就地徵糧，戰俘以交換與假釋為主',1,1,1.3,-7],[1864,'日內瓦公約保護戰場傷患，戰俘與平民仍只靠慣例',1,1,1.2,-4],[1899,'海牙公約規範戰俘待遇與佔領區平民',0,0,1.1,-2],[1949,'日內瓦四公約與附加議定書',0,0,1,0]];
/* 戰爭法各階段的年份可在設定頁修改（日內瓦公約、海牙公約、日內瓦四公約） */
function lawRowY(y0){if(typeof featY!=='function')return y0;return y0===1864?featY('gc1864'):y0===1899?featY('hague'):y0===1949?featY('gc1949'):y0;}
function lawEra(y){y=y===undefined?(G&&G.set?G.set.y:1943):y;var r=LAWERA[0];LAWERA.forEach(function(q){if(y>=lawRowY(q[0]))r=q;});return {y0:r[0],txt:r[1],minPow:r[2],minCiv:r[3],mul:r[4],dis:r[5]};}
function lawMin(k){var L=lawEra();return k==='pow'?L.minPow:L.minCiv;}
/* 開戰時設定的態度（基準）：沿指揮鏈往上找，沒有就用陣營政策；不低於該時代的下限 */
function polBase(u,k){var c=u,v;while(c){if(c.pol&&c.pol[k]!==undefined){v=c.pol[k];break;}c=c.p>=0?uById(c.p):null;}if(v===undefined)v=polSide(u.side)[k];return Math.max(v,lawMin(k));}
/* 承載動態態度的編制：最近設有態度的上級，沒有就是最上層 */
function polHolder(u){var c=u,last=u;while(c){if(c.pol&&(c.pol.pow!==undefined||c.pol.civ!==undefined))return c;last=c;c=c.p>=0?uById(c.p):null;}return last;}
/* 目前實際的態度：基準＋戰況造成的偏移；極端主義者不受戰況影響 */
function polOf(u,k){var b=polBase(u,k);if(b>=5)return b;var E=polHolder(u).polE;return E&&E.b&&E.b[k]===b&&E[k]!==undefined?E[k]:b;}
function polForm(u){var c=u;while(c){if(c.pol&&(c.pol.pow!==undefined||c.pol.civ!==undefined))return c;c=c.p>=0?uById(c.p):null;}return null;}
/* 替各團級以上編制產生態度：以陣營政策為中心，依方針決定分散程度，指揮官性格造成偏差；
   偏離陣營政策最多兩級（守法方針最多一級），所以「大致保護」的陣營不會憑空出現對難民開火的部隊 */
function polGen(side,force){var P=polSide(side),D=DOCT[P.doct]||DOCT.mixed,r=mb32(hstr(G.set.seed+'|pol|'+side)),sp=D[2]*0.55,up=D[1]<=0?1:2;
  G.units.forEach(function(F){if(F.side!==side||isLeaf(F)||(F.ech||0)<3)return;if(F.pol&&(!force||F.pol.man))return;/* 玩家手動設定的態度保留 */var par=F.p>=0?uById(F.p):null,pp=par&&par.pol?par.pol:null,o=F.off||{};
    function one(k){var c=clamp(Math.max(lawMin(k),Math.round(P[k]!==undefined?P[k]:D[1])),0,5),v=pp&&r()<0.65?pp[k]:c+gauss(r)*sp;v+=(o.agg>=8?0.4:0)+(hasQ(o,'reckless')?0.4:0)-(hasQ(o,'careful')?0.4:0)-(hasQ(o,'inspire')?0.3:0)+(r()<0.02?1.5:0);return clamp(Math.round(v),Math.max(lawMin(k),c-2),Math.min(5,c+up));}
    F.pol={pow:one('pow'),civ:one('civ')};});}
/* ---------- 動態態度：戰況、士氣、補給決定部隊能否守住國際法 ----------
   每 10 分鐘依各編制所屬部隊的士氣、軍紀、飢餓、斷補給、近期傷亡、被圍、遭游擊隊襲擊、附近的敵軍暴行計算壓力；
   壓力把態度往嚴酷推（三小時內明顯惡化），條件改善後緩慢恢復（約十二小時）。戰況造成的惡化最多到「報復性」，
   「極端主義」只會來自開戰時的設定。 */
var POLWHY=[['m','士氣低落'],['d','軍紀渙散'],['h','斷糧挨餓'],['o','補給中斷'],['c','傷亡慘重'],['e','遭到包圍'],['g','遭游擊隊襲擊'],['r','敵軍暴行激起報復心理'],['f','疲憊不堪']];
function polDyn(){if(G.set.polDyn===false||!G.civ)return;var grp={},C=G.civ;G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||u.irr||ST(u).dom!=='land'||u.st==='lift')return;var H=polHolder(u);(grp[H.id]=grp[H.id]||{H:H,L:[]}).L.push(u);});
  Object.keys(grp).forEach(function(id){var H=grp[id].H,L=grp[id].L,n=L.length,men=0,a={m:0,d:0,h:0,o:0,c:0,e:0,g:0,f:0};L.forEach(function(u){var w=Math.max(1,u.men);men+=w;a.m+=u.mor*w;a.d+=(u.dis===undefined?70:u.dis)*w;a.h+=((u.lg&&u.lg.hun)||0)*w;a.o+=Math.min(48,(u.oos||0)/3600)*w;a.c+=(u.rcas||0)*w;a.e+=(G.t-(u.encT||-1e9)<1800||u.besieged&&G.t-u.besieged<1800?1:0)*w;a.g+=(G.t-(u.gueT||-1e9)<12*3600?1:0)*w;a.f+=(u.fat||0)*w;});
    for(var q in a)a[q]/=men;var c0=centroid(L),en=enemyOf(H.side),rv=0;C.wc.forEach(function(w){if((nSides()<3?w.side===en:hostile(H.side,w.side))&&G.t-w.t<12*3600&&w.x!==undefined&&dist(w.x,w.y,c0[0],c0[1])<20000)rv+=w.k==='exec'||w.k==='mass'?2:1;});
    var x={m:clamp((55-a.m)/35,0,1),d:clamp((50-a.d)/40,0,1),h:clamp(a.h/60,0,1),o:clamp(a.o/24,0,1),c:clamp(a.c/0.25,0,1),e:a.e,g:a.g,r:clamp(rv/3,0,1),f:clamp((a.f-60)/40,0,1)};
    var off=offOf(H)||{},mit=(H._pmT&&G.t-H._pmT<1800?H._pm:(H._pmT=G.t,H._pm=!!mpNear({side:H.side,x:c0[0],y:c0[1]},9000)))?0.35:0;mit+=(hasQ(off,'inspire')?0.3:0)+(hasQ(off,'careful')?0.2:0)-(hasQ(off,'reckless')?0.2:0)-((off.agg||0)>=8?0.15:0)+((polSide(H.side).press||'control')==='free'?0.1:0);
    var T={pow:0.8*x.m+0.5*x.d+0.6*x.h+0.4*x.o+1.0*x.c+0.4*x.e+0.3*x.g+0.9*x.r+0.2*x.f-mit,civ:0.8*x.m+0.6*x.d+0.8*x.h+0.5*x.o+0.5*x.c+0.3*x.e+1.2*x.g+0.5*x.r+0.3*x.f-mit};
    var why=POLWHY.filter(function(p){return x[p[0]]>=0.45;}).sort(function(p,q2){return x[q2[0]]-x[p[0]];}).slice(0,3).map(function(p){return p[1];}).join('、');
    var E=H.polE||(H.polE={b:{},d:{pow:0,civ:0},mx:{}});E.x=x;E.why=why;
    var LW=lawEra();['pow','civ'].forEach(function(k){var b=polBase(H,k);if(b>=5){E.b[k]=b;E[k]=b;return;}if(E.b[k]!==b){E.b[k]=b;E[k]=b;E.d[k]=0;}var t=clamp(T[k]*LW.mul,0,3),d=E.d[k];d+=(t-d)*(t>d?Math.min(0.12,0.054*LW.mul):0.014/LW.mul);E.d[k]=d;var cur=E[k],v=b+d,cap=Math.max(b,4),T2=k==='pow'?POWP:CIVP,nm=k==='pow'?'戰俘':'平民';
      if(v>=cur+0.6&&cur<cap){E[k]=cur+1;E.mx[k]=Math.max(E.mx[k]||0,E[k]);polLog(H,k,cur,E[k],why||'戰況惡化');}
      else if(v<=cur-0.6&&cur>b){E[k]=cur-1;polLog(H,k,cur,E[k],'情況好轉');}});});}
function polLog(H,k,a,b,why){var T2=k==='pow'?POWP:CIVP,worse=b>a,txt=uName(H)+'對'+(k==='pow'?'戰俘':'平民')+'的態度'+(worse?'惡化':'恢復')+'為「'+T2[b][1]+'」（'+why+'）';(G.civ.attH=G.civ.attH||[]).push({t:G.t,side:H.side,u:H.id,n:uName(H),k:k,a:a,b:b,why:why});
  var c=cOf(H)||[H.x,H.y];logE(H.side,'disc',txt,c[0],c[1],H.id);if(worse&&b>=3&&G.onPause&&apOn('att'))G.onPause('態度惡化：'+uName(H));}
/* ---------- 狀態 ---------- */
function civStat0(){return {civK:0,civW:0,civKF:0,civKC:0,refBlock:0,refShot:0,powHeld:0,powDied:0,powExec:0,powEsc:0,powLib:0,incid:0,crimes:0,loot:0,rapeV:0,slavV:0,deport:0,prop:0,mil:0,camps:0,shel:0};}
function civInit(){var MP=G.map,S=G.set,y=S.y,AM=ageMix(y),ev=(EVACR[S.evac||'part']||EVACR.part)[1],W=WEALTH[S.wealth||'mid']||WEALTH.mid,mob=(MOBN[S.mob||'mid']||MOBN.mid)[1],dev=eraDev(y),per=curPer(),r=mb32(hstr(S.seed+'|civ'));
  var C={S:[],R:[],P:[],cs:SIDES().map(function(){return civStat0();}),ev:[],wc:[],rep:sAV(60),prop:{set:0,inf:0,mil:sA0(),loot:0,fire:0,quake:0,flood:0,other:0},val0:0,seq:0,cg:{},dec:[]};G.civ=C;
  (MP.set||[]).forEach(function(s,i){var pop=s.pop||0,ad=pop*(1-AM[0]-AM[1]),men=ad*0.5*(1-mob),wom=ad*0.5,kid=pop*AM[0],eld=pop*AM[1],e=ev*(0.9+0.2*r());
    var g={i:i,n:s.name,x:s.x*MP.cs,y:s.y*MP.cs,r:Math.max(250,s.r||300),kind:s.kind,pop0:pop,men:men*(1-e*0.6),wom:wom*(1-e*1.1>0?1-e*1.1:0.02),kid:kid*Math.max(0.02,1-e*1.2),eld:eld*(1-e*0.7),evac:0,dead:{m:0,w:0,k:0,e:0},wnd:0,fled:0,camp:0,loy:-1,occ:-1,occT:0,cand:-1,candT:0,unrest:0,alarm:0,shel:0,hung:0,food:30*W[2],pend:0,sick:0,hitT:-1e9,val0:0,loss:0,looted:0,burnt:0,tot0:0};
    g.evac=pop-(g.men+g.wom+g.kid+g.eld);g.tot0=pop;g.val0=pop*W[1]*dev*per*(s.kind==='city'?1.4:s.kind==='town'?1:0.6);C.val0+=g.val0;C.S.push(g);});
  civLoyal(r);SIDES().forEach(function(sd){if(!polSide(sd).gen){polGen(sd);polSide(sd).gen=1;}});
  logE(-1,'civ','作戰地區約有 '+fmt(civPresent())+' 名平民'+(civEvacSum()>0?'，開戰前已撤離約 '+fmt(civEvacSum())+' 人':'')+'；房屋與設施估值約 '+money(C.val0));}
function civPresent(g){if(g)return g.men+g.wom+g.kid+g.eld;var s=0;(G.civ?G.civ.S:[]).forEach(function(q){s+=q.men+q.wom+q.kid+q.eld;});return s;}
function civEvacSum(){var s=0;G.civ.S.forEach(function(q){s+=q.evac;});return s;}
/* 民心歸屬：開戰時由最近的己方地面部隊決定（原控制方），或依設定 */
function civLoyal(r){var L=G.set.loy||'home';G.civ.S.forEach(function(g){if(L==='s0'||L==='s1'){g.loy=L==='s0'?0:1;return;}if(L==='neutral'){g.loy=-1;return;}if(L==='split'){g.loy=nSides()<3?(r()<0.5?0:1):Math.min(nSides()-1,Math.floor(r()*nSides()));return;}
    var bd=sAV(1e18);G.units.forEach(function(u){if(!isLeaf(u)||u.st==='off'||ST(u).dom!=='land'||!(u.side>=0))return;var d=dist(u.x,u.y,g.x,g.y);if(d<bd[u.side])bd[u.side]=d;});if(bd.length<3)g.loy=bd[0]<bd[1]?0:1;else{g.loy=0;for(var bi=1;bi<bd.length;bi++)if(bd[bi]<bd[g.loy])g.loy=bi;}g.occ=g.loy;});}
/* ---------- 事件與決策紀錄（戰後總結用） ---------- */
function civEv(kind,side,txt,x,y,uid,d){var e=Object.assign({t:G.t,k:kind,s:side,txt:txt,x:x,y:y,u:uid},d||{});G.civ.ev.push(e);if(G.civ.ev.length>4000)G.civ.ev.shift();logE(side,kind,txt,x,y,uid);return e;}
function decLog(side,who,txt,d){if(!G.civ)return;var e=Object.assign({t:G.t,s:side,who:who,txt:txt},d||{});G.civ.dec.push(e);if(G.civ.dec.length>3000)G.civ.dec.shift();}
/* 戰爭罪行紀錄：known＝是否被目擊或報導 */
function warCrime(u,kind,victims,txt,ordered){var F=polForm(u)||u,e={t:G.t,side:u.side,u:u.id,un:uName(u),f:F.id,fn:uName(F),off:F.off?F.off.rank+F.off.name:'',k:kind,v:Math.round(victims),txt:txt,ord:!!ordered,x:u.x,y:u.y,known:false,pun:false};
  e.known=G.units.some(function(q){return q.side!==u.side&&onMap(q)&&dist(q.x,q.y,u.x,u.y)<3000;})||rnd()<0.15;G.civ.wc.push(e);G.civ.cs[u.side].crimes++;if(e.known)G.civ.rep[u.side]=clamp(G.civ.rep[u.side]-Math.min(25,3+victims/40),0,100);return e;}
/* ---------- 平民傷亡：在 (x,y) 半徑 R 內，lethal＝暴露者成為傷亡的機率 ---------- */
function civHit(x,y,R,lethal,cause,bySide,kf){if(!G.civ||lethal<=0)return 0;var tot=0;kf=kf||0.35;
  G.civ.S.forEach(function(g){var d=dist(g.x,g.y,x,y);if(d>g.r+R)return;var pres=civPresent(g);if(pres<1)return;var a=Math.min(1,(R*R)/(g.r*g.r))*(d<g.r?1:clamp(1-(d-g.r)/Math.max(1,R),0,1)),exp=clamp(0.3-0.27*g.shel,0.03,0.3),c=pres*a*exp*lethal;
    if(c<0.02){if(rnd()<c*20)c=0.05;else return;}c=Math.min(c,pres*0.95);civCas(g,c,kf,cause,bySide);g.hitT=G.t;g.alarm=Math.max(g.alarm,0.8);tot+=c;});
  G.civ.R.forEach(function(R2){if(R2.st==='out'||R2.st==='camp'||R2.n<1)return;var d=dist(R2.x,R2.y,x,y);if(d>R+150)return;var c=Math.min(R2.n*0.9,R2.n*lethal*0.8*(d<R?1:0.5));if(c<0.05)return;refCas(R2,c,kf,cause,bySide);tot+=c;});return tot;}
/* 傷亡依在場人口比例分配到各群體 */
function civCas(g,c,kf,cause,bySide){var p=civPresent(g);if(p<=0)return;var k=c*kf,w=c-k,f={m:g.men/p,w:g.wom/p,k:g.kid/p,e:g.eld/p};
  g.men=Math.max(0,g.men-c*f.m);g.wom=Math.max(0,g.wom-c*f.w);g.kid=Math.max(0,g.kid-c*f.k);g.eld=Math.max(0,g.eld-c*f.e);g.dead.m+=k*f.m;g.dead.w+=k*f.w;g.dead.k+=k*f.k;g.dead.e+=k*f.e;g.wnd+=w;
  /* 輕傷者大多留在原地（加回在場人口，但計入受傷） */g.men+=w*f.m*0.6;g.wom+=w*f.w*0.6;g.kid+=w*f.k*0.6;g.eld+=w*f.e*0.6;civStatAdd(bySide,k,w,k*f.w,k*f.k,cause);}
function civStatAdd(bySide,k,w,kf,kc,cause){var C=G.civ;C.kill=(C.kill||0)+k;C.wound=(C.wound||0)+w;C.byC=C.byC||{};C.byC[cause]=(C.byC[cause]||0)+k;if(bySide>=0){var s=C.cs[bySide];s.civK+=k;s.civW+=w;s.civKF+=kf;s.civKC+=kc;}}
function refCas(R2,c,kf,cause,bySide){var p=R2.n,k=c*kf,f={m:R2.m/p,w:R2.w/p,k:R2.k/p,e:R2.e/p},D=G.civ.rdead||(G.civ.rdead={m:0,w:0,k:0,e:0});D.m+=k*f.m;D.w+=k*f.w;D.k+=k*f.k;D.e+=k*f.e;R2.m=Math.max(0,R2.m-k*f.m);R2.w=Math.max(0,R2.w-k*f.w);R2.k=Math.max(0,R2.k-k*f.k);R2.e=Math.max(0,R2.e-k*f.e);R2.n=R2.m+R2.w+R2.k+R2.e;R2.dead+=k;R2.wnd=(R2.wnd||0)+c-k;civStatAdd(bySide,k,c-k,k*f.w,k*f.k,cause);}
/* 砲擊、空襲的平民傷亡（呼叫自 artyFire、空中攻擊）。砲擊係數依城市砲擊的歷史資料校準：居民進入掩蔽後，每發砲彈約造成 0.05～0.3 人死亡 */
function civArt(u,s,M,SA,fr,dm){if(!G.civ)return;var av=CIVP[polOf(u,'civ')][3];civHit(M.x,M.y,Math.max(150,M.r),clamp(SA*fr*dm*0.00008*(1-av*0.5)*(s.fl.indexOf('p')>=0?0.4:1),0,0.05),'art',u.side,0.34);}
function civHitAir(a,s,x,y,SA,fr,dm,area){if(!G.civ)return;civHit(x,y,area?500:250,clamp(SA*fr*dm*0.002*(area?1.6:0.6)*(s.fl.indexOf('p')>=0?0.35:1),0,0.08),'air',a.side,0.4);}
function civAt(x,y,R){var b=null,bd=1e18;G.civ.S.forEach(function(g){var d=dist(g.x,g.y,x,y)-g.r;if(d<(R||0)&&d<bd){bd=d;b=g;}});return b;}
/* 核武：依破壞圈直接造成傷亡 */
function civNuke(x,y,R,side){if(!G.civ)return 0;var t0=(G.civ.kill||0)+(G.civ.wound||0);G.civ.S.forEach(function(g){var d=dist(g.x,g.y,x,y);if(d>R[2]+g.r)return;var p=civPresent(g),f=d<R[0]?0.9:d<R[1]?0.55:d<R[2]?0.15:0.04;civCas(g,p*f,d<R[1]?0.7:0.35,'nuke',side);g.alarm=1;});
  G.civ.R.forEach(function(Q){var d=dist(Q.x,Q.y,x,y);if(d<R[2])refCas(Q,Q.n*(d<R[1]?0.8:0.3),0.6,'nuke',side);});return (G.civ.kill||0)+(G.civ.wound||0)-t0;}
/* ---------- 財產損失：房屋（每格依聚落價值密度）、基礎設施、軍事裝備 ---------- */
function cellVal(k){var MP=G.map,x=(k%MP.GW+0.5)*MP.cs,y=(((k/MP.GW)|0)+0.5)*MP.cs,g=civAt(x,y,0);if(!g){var c=MP.lc[k];return isUrban(c)?curPer()*eraDev(G.set.y)*20*(MP.cs*MP.cs/2500):0;}var A=PI*g.r*g.r;return g.val0/A*MP.cs*MP.cs;}
function civProp(k,frac,cause,bySide){if(!G.civ||frac<=0)return;var v=cellVal(k)*frac,P=G.civ.prop;if(!(v>0))return;var MP=G.map,x=(k%MP.GW+0.5)*MP.cs,y=(((k/MP.GW)|0)+0.5)*MP.cs,g=civAt(x,y,0);if(g){g.loss+=v;}
  P[cause==='quake'?'quake':cause==='flood'?'flood':cause==='fire'?'fire':cause==='loot'?'loot':'set']+=v;if(bySide>=0)G.civ.cs[bySide].prop+=v;}
function infVal(kind,c){var dev=eraDev(G.set.y),per=curPer();return kind==='bridge'?[0,0.3,1.2,6,25][clamp(c||2,0,4)]*1e6*dev*per/60000*10:kind==='tunnel'?40e6*dev*per/60000*5:kind==='rail'?2e5*dev*per/60000:0;}
function propInf(kind,c,bySide,n){if(!G.civ)return;var v=infVal(kind,c)*(n||1);G.civ.prop.inf+=v;if(bySide>=0)G.civ.cs[bySide].prop+=v;}
/* 軍事裝備單價（依時代與種類） */
function vehVal(s){var e=ERAI[s.era]||ERA[6],dev=eraDev(e.y),per=curPer()/60000,b=s.dom==='air'?30e6:s.dom==='sea'?300e6:s.dom==='sub'?400e6:s.hard>=0.5?4e6:0.4e6;return b*dev*dev*per*(s.dom==='sea'||s.dom==='sub'?1/Math.max(1,s.veh/2):1);}
function milLoss(t,v,men){if(!G.civ)return;var s=ST(t),c=v*vehVal(s)+men*20000*eraDev(uEra(t).y)*curPer()/60000;G.civ.prop.mil[t.side]+=c;}
/* ---------- 傷兵：陣亡與負傷比例、後送、醫療、傷重不治、歸隊 ---------- */
var KIAF={storm:0.45,quake:0.4,burn:0.5,fire:0.3,melee:0.33,art:0.32,air:0.38,aa:0.5,airstrike:0.35,breath:0.5,grapple:0.6,nuke:0.6,rad:0.3,drop:0.5};
function medStat(side){var S=G.stats[side];['kia','wia','dow','rtd','sick','dis','desert','kiaF','wiaF'].forEach(function(k){if(S[k]===undefined)S[k]=0;});return S;}
function woundSplit(t,m,K){if(m<=0)return;var S=medStat(t.side),kt=0,kk,kf=0;for(kk in K)kt+=K[kk];for(kk in K)kf+=(KIAF[kk]||0.32)*K[kk]/(kt||1);if(!kt)kf=0.32;var y=uEra(t).y;kf*=y<1850?0.8:1;var kia=m*kf,wia=m-kia,fem=typeof femOf==='function'?femOf(t):0;
  S.kia+=kia;S.wia+=wia;S.kiaF+=kia*fem;S.wiaF+=wia*fem;t.wia=(t.wia||0)+wia;t.kia=(t.kia||0)+kia;}
/* 醫療物資與裝備的修正（h44_eqfx.js 覆寫）：reach 後送距離倍率、dow 傷重不治倍率、mq 醫療品質、use 收治 v 名傷患時的物資缺口（0～1）、dis 病死倍率、rec 痊癒倍率 */
function medFx(u,k,v){return k==='use'?0:v;}
function medR(side){var hq=sideCmd(side),y=hq?uEra(hq).y:G.set.y;return y<1800?5000:y<1900?9000:y<1940?15000:y<1965?25000:40000;}
/* 每 10 分鐘：傷兵後送與治療 */
function medStep(){var dt=600,h=dt/3600;SIDES().forEach(function(side){var S=medStat(side),hq=sideCmd(side),y=hq?uEra(hq).y:G.set.y,R=medR(side),meds=G.units.filter(function(u){return u.side===side&&onMap(u)&&isLeaf(u)&&ST(u).fl.indexOf('D')>=0&&ST(u).dom!=='air';}),heli=G.units.some(function(u){return u.side===side&&alive(u)&&ST(u).fl.indexOf('n')>=0;});
    var dU=(y<1850?0.012:y<1914?0.009:y<1940?0.006:y<1970?0.004:0.0025)*h*(heli?0.6:1),baseT=(y<1850?0.006:y<1914?0.004:y<1940?0.0025:y<1970?0.0012:0.0006)*h;
    meds.forEach(function(m){m.medN=0;});
    G.units.forEach(function(u){if(u.side!==side||!(u.wia>0.05))return;var m=null,bd=1e18;if(u.st!=='dead'){var Rr=R*(heli?1.6:1)*medFx(u,'reach',1);meds.forEach(function(q){var d=dist(q.x,q.y,u.x,u.y);if(d<Rr&&d<bd){bd=d;m=q;}});}
      if(m){var cap=Math.max(20,mixX(m,'med')*strFrac(m))/144,take=Math.min(u.wia,cap-m.medN);if(take>0){m.medN+=take;u.wia-=take;m.pat=m.pat||[];if(m.pat.length>200)m.pat.splice(0,2);var sh=medFx(m,'use',take),lt=take*0.5;m.pat.push({u:u.id,n:lt,t:G.t,l:1});m.pat.push(sh>0?{u:u.id,n:take-lt,t:G.t,sh:sh}:{u:u.id,n:take-lt,t:G.t});}}
      var die=u.wia*dU*(u.st==='dead'?2:1)*medFx(u,'dow',1);if(die>0){u.wia-=die;S.dow+=die;u.dow=(u.dow||0)+die;}});
    meds.forEach(function(m){if(!m.pat||!m.pat.length)return;var mq=0,n=0;(m.mix||[]).forEach(function(q){var x=utx(q[0]);if(x.mq){mq+=x.mq*q[1];n+=q[1];}});mq=medFx(m,'mq',n?mq/n:0.5);var keep=[];
      m.pat.forEach(function(p){var d=p.n*baseT*(1-mq)*2*(p.sh?1+1.5*p.sh:1)*(p.l?0.2:1);p.n-=d;S.dow+=d;if(G.t-p.t>(p.l?(y<1940?24:12):(y<1914?96:48))*3600){var u=uById(p.u),rt=p.n*(p.l?0.9:0.35)*(p.sh?1-0.5*p.sh:1);if(u&&alive(u)&&u.st!=='off'){u.men=Math.min(u.men0,u.men+rt);S.rtd+=rt;u.rtd=(u.rtd||0)+rt;}p.n=0;}if(p.n>0.05)keep.push(p);});m.pat=keep;});});}
/* ---------- 戰俘：受降、拒絕受降、押解、收容、勞役、處決、死亡、逃亡與解放 ---------- */
function powCapture(u,by){if(!G.civ)return;var men=u.captMen||u.men,H=enemyOf(u.side),T3=nSides()>=3,hs=function(e){return T3?hostile(u.side,e.side):e.side===H;};if(men<1)return;by=by||(u._eid?uById(u._eid):null);if(!by||!hs(by)){by=null;gridNear(u.x,u.y,4000,function(e){if(!by&&hs(e)&&onMap(e)&&ST(e).dom!=='air')by=e;});}if(T3&&by)H=by.side;
  var L=by?polOf(by,'pow'):polSide(H).pow,P=POWP[L],p=P[3]*((by&&by.rcas>0.1)?1.5:1)*(by&&by.dis!==undefined&&by.dis<40?1.4:1);if(uEra(u).y<1600)p*=1.2;
  if(by&&rnd()<p){var kill=men*(L>=5?0.85+0.15*rnd():0.25+0.6*rnd());G.civ.cs[H].powExec+=kill;G.stats[u.side].exec=(G.stats[u.side].exec||0)+kill;men-=kill;
    var e=warCrime(by,'exec',kill,uName(by)+'拒絕受降，處決約 '+fmt(kill)+' 名投降的'+G.sides[u.side].name+'官兵（'+placeTxt(u.x,u.y)+'）',L>=4);civEv('crime',H,e.txt,u.x,u.y,by.id,{v:kill,wc:1});}
  if(men<1){u.wia=0;return;}var wnd=Math.min(men*0.6,(u.wia||0)+men*0.12);u.wia=0;var M=null,bd=1e18;G.units.forEach(function(q){if(q.side===H&&onMap(q)&&ST(q).fl.indexOf('M')>=0){var d=dist(q.x,q.y,u.x,u.y);if(d<10000&&d<bd){bd=d;M=q;}}});
  var Pg={id:++G.civ.seq,side:H,from:u.side,n:men,wnd:wnd,x:u.x,y:u.y,st:'col',by:by?by.id:0,esc:M?M.id:0,t0:G.t,dead:0,exec:0,lvl:L,un:uName(u),path:null,pi:0};
  if(by&&!M){var g=Math.min(by.men*0.25,Math.max(5,men/12));by.men-=g;by.detM=(by.detM||0)+g;Pg.guard=g;}G.civ.P.push(Pg);G.civ.cs[H].powHeld+=men;powRoute(Pg);
  if(L>=3)civEv('pow',H,G.sides[H].name+'俘虜 '+fmt(men)+' 人，押解途中待遇惡劣（'+POWP[L][1]+'）',u.x,u.y,by?by.id:undefined);}
/* 押解路線：最近的己方戰俘營，否則後方邊緣 */
function powRoute(Pg){var camp=null,bd=1e18;G.units.forEach(function(q){if(q.side===Pg.side&&onMap(q)&&ST(q).fl.indexOf('Q')>=0){var d=dist(q.x,q.y,Pg.x,Pg.y);if(d<bd){bd=d;camp=q;}}});var dest=camp?[camp.x,camp.y]:edgeNear(Pg.side,Pg.x,Pg.y);Pg.camp=camp?camp.id:0;Pg.dest=dest;
  var P=findPath({dom:'land',mobi:0,vr:4,vx:2.5,fl:''},Pg.x,Pg.y,dest[0],dest[1],{max:60000});Pg.path=P?P.pts:[Pg.x,Pg.y,dest[0],dest[1]];Pg.pi=2;}
function edgeNear(side,x,y){var MP=G.map,e=SD(side).edge||'W',m=MP.cs*3;return e==='W'?[m,y]:e==='E'?[MP.Wm-m,y]:e==='N'?[x,m]:[x,MP.Hm-m];}
/* 沿折線前進 d 公尺；回傳是否到達 */
function walk(o,d){var P=o.path;while(d>0&&o.pi<P.length){var tx=P[o.pi],ty=P[o.pi+1],dd=dist(o.x,o.y,tx,ty);if(dd<=d){o.x=tx;o.y=ty;d-=dd;o.pi+=2;}else{o.x+=(tx-o.x)/dd*d;o.y+=(ty-o.y)/dd*d;d=0;}}return o.pi>=P.length;}
function powStep(dt){var h=dt/3600;G.civ.P.forEach(function(Pg){if(Pg.st==='gone'||Pg.n<0.5)return;var keep=Pg.st==='camp'&&Pg.camp?uById(Pg.camp):uById(Pg.by);if(keep&&alive(keep))Pg.lvl=polOf(keep,'pow');/* 待遇依看守部隊目前的態度 */var L=Pg.lvl,P=POWP[L],hold=G.civ.cs[Pg.side];
    var die=Pg.n*(P[4]/24*h+(Pg.st==='col'?(L>=3?0.004:0.0002)*h:0))+Pg.wnd*(L>=2?0.01:0.002)*h,ex=Pg.n*P[5]/24*h*(Pg.st==='camp'?1:0.5);if(G.env.T<-5||G.env.T>34)die*=1.6;
    var camp=Pg.camp?uById(Pg.camp):null;if(camp&&camp.campHun>50)die*=2;die=Math.min(die,Pg.n);Pg.n-=die;Pg.dead+=die;hold.powDied+=die;G.stats[Pg.from].powD=(G.stats[Pg.from].powD||0)+die;Pg.wnd=Math.max(0,Math.min(Pg.wnd,Pg.n));
    if(ex>0.02){ex=Math.min(ex,Pg.n);Pg.n-=ex;Pg.exec+=ex;hold.powExec+=ex;G.stats[Pg.from].exec=(G.stats[Pg.from].exec||0)+ex;if(!Pg.exLog||G.t-Pg.exLog>6*3600){Pg.exLog=G.t;var U=uById(Pg.by)||camp;if(U){var e=warCrime(U,'exec',ex*6,'收容的'+G.sides[Pg.from].name+'戰俘遭處決（'+placeTxt(Pg.x,Pg.y)+'）',L>=4);civEv('crime',Pg.side,e.txt,Pg.x,Pg.y,U.id,{wc:1});}}}
    /* 逃亡：看守薄弱、靠近己方 */if(Pg.st==='col'&&!Pg.esc&&L<=2){var fr=friendNear(Pg.from,Pg.x,Pg.y,3000);if(fr>0&&rnd()<0.02*h*6){var es=Pg.n*0.15;Pg.n-=es;hold.powEsc+=es;logE(Pg.from,'pow','約 '+fmt(es)+' 名被俘官兵趁押解薄弱逃回（'+placeTxt(Pg.x,Pg.y)+'）',Pg.x,Pg.y);}}
    /* 解放：原屬方部隊抵達、看守方不在場 */if(enemyNear(Pg.side,Pg.x,Pg.y,1200)>0&&friendNear(Pg.side,Pg.x,Pg.y,1500)===0){hold.powLib+=Pg.n;logE(Pg.from,'pow',G.sides[Pg.from].name+'解救 '+fmt(Pg.n)+' 名被俘官兵（'+placeTxt(Pg.x,Pg.y)+'）',Pg.x,Pg.y);G.stats[Pg.from].lib=(G.stats[Pg.from].lib||0)+Pg.n;Pg.n=0;Pg.st='gone';return;}
    if(Pg.st==='col'){if(walk(Pg,3.2/3.6*dt*(L>=3?1.2:1))){var c2=Pg.camp?uById(Pg.camp):null;if(c2&&alive(c2)){Pg.st='camp';c2.pw=(c2.pw||0)+Pg.n;Pg.x=c2.x;Pg.y=c2.y;}else{Pg.st='rear';}var g=uById(Pg.by);if(g&&Pg.guard){g.men=Math.min(g.men0,g.men+Pg.guard);g.detM=Math.max(0,(g.detM||0)-Pg.guard);Pg.guard=0;}}
      else if(Pg.guard&&G.t-Pg.t0>3*3600){var g2=uById(Pg.by);if(g2&&alive(g2)){g2.men=Math.min(g2.men0,g2.men+Pg.guard);g2.detM=Math.max(0,(g2.detM||0)-Pg.guard);}Pg.guard=0;}}
    else if(Pg.st==='camp'){var c3=uById(Pg.camp);if(!c3||!alive(c3)){Pg.st='col';powRoute(Pg);}else{Pg.x=c3.x;Pg.y=c3.y;}}});}
/* ---------- 難民 ---------- */
function refDest(Q){var side=Q.side,camp=null,bd=1e18;G.units.forEach(function(u){if(!onMap(u)||ST(u).fl.indexOf('R')<0)return;if(side>=0&&u.side!==side&&polOf(u,'civ')>1)return;if(side<0&&polOf(u,'civ')>1)return;var d=dist(u.x,u.y,Q.x,Q.y);if(d<45000&&d<bd&&enemyNear(u.side,u.x,u.y,4000)===0){bd=d;camp=u;}});
  var dest;if(camp){dest=[camp.x,camp.y];Q.camp=camp.id;}else if(side>=0){dest=edgeNear(side,Q.x,Q.y);Q.camp=0;}else{var ec=civDanger(Q.x,Q.y),a=ec?Math.atan2(Q.y-ec[1],Q.x-ec[0]):rnd()*2*PI,MP=G.map;dest=[clamp(Q.x+Math.cos(a)*1e5,MP.cs*3,MP.Wm-MP.cs*3),clamp(Q.y+Math.sin(a)*1e5,MP.cs*3,MP.Hm-MP.cs*3)];Q.camp=0;}
  Q.dest=dest;Q.rdT=G.t;/* 同一地區逃往同一方向的難民共用路線（不受敵情影響，地形沒變就一直沿用，最長 12 小時） */var RS={dom:'land',mobi:0,vr:3.5,vx:2,fl:''},ck=Math.round(Q.x/2000)+','+Math.round(Q.y/2000)+'>'+Math.round(dest[0]/2000)+','+Math.round(dest[1]/2000),RC=G._rpc||(G._rpc={n:0}),rc=RC[ck],P=null;
  if(rc&&G.t-rc.t<12*3600&&rc.v===(G._mapv||0)&&rc.pts.length>=4&&lineOK(RS,Q.x,Q.y,rc.pts[2],rc.pts[3]))P={pts:[Q.x,Q.y].concat(rc.pts.slice(2))};else{P=findPath(RS,Q.x,Q.y,dest[0],dest[1],{max:60000});if(P){if(RC.n>400)G._rpc=RC={n:0};RC[ck]={pts:P.pts,t:G.t,v:G._mapv||0};RC.n++;}}if(!P){Q.path=[Q.x,Q.y];Q.pi=2;Q.reach=false;return;}Q.path=P.pts;Q.pi=2;var e=P.pts.length;Q.reach=dist(P.pts[e-2],P.pts[e-1],dest[0],dest[1])<1500;}
/* 無路可逃（城牆、包圍圈、河海阻隔）：靠近原居地者返回城內避難，其餘就地露宿，三小時後再試 */
function refTrap(Q){var C=G.civ,g=C.S[Q.from];if(g&&dist(Q.x,Q.y,g.x,g.y)<Math.max(2500,(g.r||0)*2)){g.men+=Q.m;g.wom+=Q.w;g.kid+=Q.k;g.eld+=Q.e;g.fled=Math.max(0,g.fled-Q.n);g.trap=(g.trap||0)+Q.n;C.trap=(C.trap||0)+Q.n;
    if(!g.trapLog||G.t-g.trapLog>6*3600){g.trapLog=G.t;logE(g.loy,'ref','約 '+fmt(Q.n)+' 名平民無法離開'+g.n+'（道路被切斷或城門封閉），只能返回城內避難',g.x,g.y);}Q.n=0;Q.m=Q.w=Q.k=Q.e=0;Q.st='back';return;}
  Q.st='trap';Q.trapT=G.t;if(!Q.trapLog){Q.trapLog=1;C.trap=(C.trap||0)+Q.n;logE(Q.side>=0?Q.side:0,'ref','約 '+fmt(Q.n)+' 名難民受困於'+placeTxt(Q.x,Q.y)+'，前方無路可走，只能露宿原地',Q.x,Q.y);}}
function civDanger(x,y){var n=0,sx=0,sy=0;G.units.forEach(function(u){if(!onMap(u)||G.t-(u.fired||-1e9)>1800||dist(u.x,u.y,x,y)>12000)return;sx+=u.x;sy+=u.y;n++;});return n?[sx/n,sy/n]:null;}
function refSpawn(g,n){var C=G.civ,p=civPresent(g);if(p<1||n<1)return;n=Math.min(n,p*0.92);var f={m:g.men/p,w:g.wom/p,k:g.kid/p,e:g.eld/p},mob=MOBN[G.set.mob||'mid'][1],wm=[mob>=0.7?0.5:0.85,1.15,1.2,0.55],tw=f.m*wm[0]+f.w*wm[1]+f.k*wm[2]+f.e*wm[3],q={m:n*f.m*wm[0]/tw,w:n*f.w*wm[1]/tw,k:n*f.k*wm[2]/tw,e:n*f.e*wm[3]/tw};
  q.m=Math.min(q.m,g.men);q.w=Math.min(q.w,g.wom);q.k=Math.min(q.k,g.kid);q.e=Math.min(q.e,g.eld);g.men-=q.m;g.wom-=q.w;g.kid-=q.k;g.eld-=q.e;var tot=q.m+q.w+q.k+q.e;g.fled+=tot;
  var veh=G.set.y>=1960&&(G.set.wealth||'mid')!=='poor'?0.35:G.set.y>=1920?0.1:0.03,Q={id:++C.seq,from:g.i,fn:g.n,side:g.loy,x:g.x+(rnd()-0.5)*g.r,y:g.y+(rnd()-0.5)*g.r,n:tot,m:q.m,w:q.w,k:q.k,e:q.e,dead:0,st:'go',t0:G.t,spd:(veh?2.6+veh*10:2.6)/3.6,food:2.5};
  refDest(Q);C.R.push(Q);if(C.R.length>220){C.R=C.R.filter(function(z){return z.st==='go'||z.st==='stop'||z.st==='trap';});}
  if(tot>=300&&(!g.refLog||G.t-g.refLog>3*3600)){g.refLog=G.t;logE(g.loy,'ref','約 '+fmt(tot)+' 名平民逃離'+g.n+'，'+(Q.camp?'前往難民營':g.loy>=0?'往'+G.sides[g.loy].name+'後方逃難':'四散逃難'),g.x,g.y);}}
/* 同一部隊阻擋或驅逐難民：每小時彙整一次紀錄 */
function refLogU(u,k,Q){var L=u.refL||(u.refL={});var e=L[k]||(L[k]={n:0,t:-1e9});e.n+=Q.n;if(G.t-e.t<3600)return;logE(u.side,'ref',uName(u)+(k==='expel'?'驅逐':'封鎖道路，攔下')+'約 '+fmt(e.n)+' 名難民'+(e.t>-1e9?'（過去一小時）':'')+'（'+placeTxt(Q.x,Q.y)+'）',Q.x,Q.y,u.id);e.n=0;e.t=G.t;}
/* 難民隊伍：移動、遭阻擋或驅逐、射擊、露宿與飢餓 */
function refStep(dt){var h=dt/3600,C=G.civ;C.R.forEach(function(Q){if(Q.st==='out'||Q.st==='camp'||Q.st==='back'||Q.n<1){if(Q.n<1&&Q.st!=='camp'&&Q.st!=='back')Q.st='out';return;}
    var wx=G.env,exD=(wx.T<0?0.0012:wx.T>33?0.0008:0)+(WX[wx.wx][3]>=2?0.0006:0)+(Q.food<=0?0.0015:0);if(exD>0){var d0=(Q.k+Q.e)*exD*h;if(d0>0.01)refCas(Q,d0/0.6,0.6,'exposure',-1);}Q.food=Math.max(0,Q.food-h/24);
    /* 檢查前方部隊（阻擋、驅逐、射擊）：同一部隊對同一支隊伍只在第一次接觸時處置，被趕走的隊伍有 45 分鐘離開 */var blk=null;if(!(Q.gr&&G.t<Q.gr))gridNear(Q.x,Q.y,1500,function(u){if(blk||!onMap(u)||!isLeaf(u)||ST(u).dom!=='land'||u.side===Q.side)return;var fl=ST(u).fl,ro=roleOf(u);if(!(ro==='man'||ro==='rec'||fl.indexOf('M')>=0||fl.indexOf('I')>=0)||isBridger(u))return;/* 只有步兵、偵察、憲兵與警衛部隊設檢查哨 */var L=polOf(u,'civ');if(CIVP[L][4]>=2&&dist(u.x,u.y,Q.x,Q.y)<1200)blk=u;});
    if(blk){var L2=polOf(blk,'civ'),act=CIVP[L2][4],st=C.cs[blk.side],seen=Q.by||(Q.by={}),first=!seen[blk.id],bc=Q.bc||(Q.bc={});seen[blk.id]=1;if(!bc[blk.side]){bc[blk.side]=1;st.refBlock+=Q.n;}/* 每支隊伍每一方只計一次 */
      if(act>=4&&first&&rnd()<(L2>=5?0.7:0.35)){/* 向接近陣地的人群開火：死傷集中在隊伍前段 */var v=Math.min(Q.n,3+Q.n*(0.006+0.018*rnd())*(L2>=5?2:1)),dd=v*0.55;refCas(Q,v,0.55,'refshot',blk.side);st.refShot+=dd;var old=G.civ.wc.filter(function(w){return w.u===blk.id&&w.k==='refshot'&&G.t-w.t<3*3600;})[0];if(old){old.v+=Math.round(dd);old.txt=uName(blk)+'多次向接近陣地的難民開火，累計約 '+fmt(old.v)+' 人死亡（'+placeTxt(Q.x,Q.y)+'一帶）';}else if(dd>=0.5){var e=warCrime(blk,'refshot',dd,uName(blk)+'向接近陣地的難民隊伍開火，造成約 '+fmt(Math.max(1,dd))+' 人死亡（'+placeTxt(Q.x,Q.y)+'）',L2>=5);civEv('crime',blk.side,e.txt,Q.x,Q.y,blk.id,{wc:1});}Q.side=enemyOf(blk.side);refDest(Q);Q.gr=G.t+2700;}
      else if(act>=3){if(first)refLogU(blk,'expel',Q);Q.side=enemyOf(blk.side);refDest(Q);Q.gr=G.t+2700;}
      else if(act>=2){if(first)refLogU(blk,'block',Q);if(Q.st!=='stop'){Q.st='stop';Q.stopT=G.t;}}}
    if(Q.st==='trap'){if(G.t-Q.trapT>3*3600){Q.st='go';refDest(Q);if(Q.reach===false)refTrap(Q);}return;}
    if(Q.st==='stop'){if(!blk||G.t-Q.stopT>2*3600){Q.st='go';refDest(Q);Q.gr=G.t+1800;}return;}
    var cg=C.cg[Math.floor(Q.x/1000)+'|'+Math.floor(Q.y/1000)]||0,sp=Q.spd*(cg>3000?0.5:1)*(G.env.light<0.3?0.6:1)*(WX[G.env.wx][3]>=2?0.7:1);
    if(walk(Q,sp*dt)){var cp=Q.camp?uById(Q.camp):null;if(cp&&alive(cp)&&cp.side!==undefined){cp.ref=(cp.ref||0)+Q.n;cp.refM=(cp.refM||0)+Q.m;cp.refW=(cp.refW||0)+Q.w;cp.refK=(cp.refK||0)+Q.k;cp.refE=(cp.refE||0)+Q.e;Q.st='camp';C.cs[cp.side].shel+=Q.n;C.S[Q.from].camp+=Q.n;}
      else{var MP=G.map,edge=Q.x<MP.cs*5||Q.y<MP.cs*5||Q.x>MP.Wm-MP.cs*5||Q.y>MP.Hm-MP.cs*5;if(edge){Q.st='out';C.out=(C.out||0)+Q.n;}else if(Q.reach===false||G.t-(Q.rdT||-1e9)<1800)refTrap(Q);else{refDest(Q);if(Q.reach===false&&Q.path.length<=2)refTrap(Q);}}}});}
/* 收容所：擁擠、飢餓與疾病造成的死亡 */
function campStep(dt){var h=dt/3600;G.units.forEach(function(u){if(!alive(u)||!isLeaf(u))return;var fl=ST(u).fl;if(fl.indexOf('R')<0&&fl.indexOf('Q')<0)return;var cap=Math.max(100,mixX(u,'cap')*strFrac(u)),n=(u.ref||0)+(u.pw||0);if(n<1)return;
    var L=fl.indexOf('Q')>=0?polOf(u,'pow'):polOf(u,'civ'),supplied=u.insup!==false&&!(u.oos>6*3600);u.campHun=clamp((u.campHun||0)+((supplied?-20:25)+(L>=3?10:0))*h/24,0,100);
    var crowd=n/cap,med=G.units.some(function(q){return q.side===u.side&&onMap(q)&&ST(q).fl.indexOf('D')>=0&&dist(q.x,q.y,u.x,u.y)<4000;}),d=(0.0003+(crowd>1?(crowd-1)*0.003:0)+(u.campHun>50?0.004*(u.campHun-50)/50:0))*h/24*(med?0.5:1);
    if(u.ref>0){var dr=u.ref*d;u.ref-=dr;G.civ.campD=(G.civ.campD||0)+dr;G.civ.kill=(G.civ.kill||0)+dr;campDead(dr);G.civ.byC=G.civ.byC||{};G.civ.byC.exposure=(G.civ.byC.exposure||0)+dr;}
    if(crowd>1.2&&(!u.crLog||G.t-u.crLog>6*3600)){u.crLog=G.t;logE(u.side,'ref',uName(u)+'嚴重超收（'+fmt(n)+'／'+fmt(cap)+' 人），衛生與配給惡化',u.x,u.y,u.id);}});}
/* ---------- 每步：警戒、交叉火力、逃難、佔領與民怨、糧食 ---------- */
function civStep(){if(!G.civ||G.set.civ===false)return;var C=G.civ;
  if(G.step%4===0){C.S.forEach(function(g){var p=civPresent(g);if(p<1)return;var eng=0,enemy=sA0(),EU=[];gridNear(g.x,g.y,g.r+2500,function(u){if(!onMap(u)||ST(u).dom==='air'||u.st==='lift')return;var d=dist(u.x,u.y,g.x,g.y);if(d<g.r+400&&(G.t-(u.fired||-1e9)<120||G.t-(u.uf||-1e9)<120)){eng++;if(EU.length<30)EU.push(u);}if(d<g.r+2500&&u.side>=0)enemy[u.side]++;});
      EU.forEach(function(u){civHit(u.x,u.y,300,0.0012,'fire',-1,0.3);});
      var hst=g.loy>=0?(nSides()<3?enemy[enemyOf(g.loy)]:SIDES().reduce(function(a,s){return a+(hostile(g.loy,s)?enemy[s]:0);},0)):0,tgt=eng>0?1:G.t-g.hitT<1800?1:hst>0?0.6:(enemy.some(function(v){return v>0;})?0.25:0);g.alarm=tgt>g.alarm?g.alarm+(tgt-g.alarm)*0.5:g.alarm*0.995;g.shel=clamp(g.shel+(g.alarm>0.5?0.06:-0.01),0,1);});}
  if(G.step%20===10){var dt=600;C.cg={};C.R.forEach(function(Q){if(Q.st==='go'||Q.st==='stop'){var k=Math.floor(Q.x/1000)+'|'+Math.floor(Q.y/1000);C.cg[k]=(C.cg[k]||0)+Q.n;}});
    C.S.forEach(function(g){var p=civPresent(g);if(p<1)return;var keep=g.tot0*0.1,siege=g.loy>=0&&civEncircled(g),rate=g.alarm>0.25?Math.pow(g.alarm,2)*0.22*(siege?0.15:1)*(G.set.y<1900?0.7:1):0;g.pend+=Math.max(0,Math.min(p-keep,p*rate*dt/3600));if(g.pend>=40||g.pend>=p*0.1&&g.pend>=5){refSpawn(g,g.pend);g.pend=0;}
      civOcc(g,dt);civFood(g,dt,siege);});
    refStep(dt);powStep(dt);campStep(dt);medStep();}}
function civEncircled(g){var q=[0,0,0,0],en=enemyOf(g.loy);gridNear(g.x,g.y,g.r+3000,function(e){if((nSides()<3?e.side!==en:!hostile(g.loy,e.side))||!onMap(e)||ST(e).dom==='air')return;var a=Math.atan2(e.y-g.y,e.x-g.x);q[(Math.floor((a+PI)/(PI/2))+4)%4]=1;});return q[0]+q[1]+q[2]+q[3]>=3;}
/* 佔領：只有一方地面部隊在場 30 分鐘；非原屬方佔領時民怨上升 */
function civOcc(g,dt){var n=sA0();gridNear(g.x,g.y,g.r+500,function(u){if(!onMap(u)||u.ms==='rout'||ST(u).dom!=='land'||u.st==='lift'||ST(u).fl.indexOf('u')>=0)return;if(dist(u.x,u.y,g.x,g.y)<=g.r+500)n[u.side]++;});
  var hold=-1,np=0;for(var hi=0;hi<n.length;hi++)if(n[hi]){np++;hold=hi;}if(np!==1)hold=-1;if(hold>=0&&hold!==g.occ){if(g.cand!==hold){g.cand=hold;g.candT=G.t;}else if(G.t-g.candT>=1800){var prev=g.occ;g.occ=hold;g.occT=G.t;if(g.loy>=0&&hold!==g.loy&&civPresent(g)>50)logE(hold,'civ',G.sides[hold].name+'佔領'+g.n+'（居民約 '+fmt(civPresent(g))+' 人）',g.x,g.y);void prev;}}else if(hold<0||hold===g.occ)g.cand=-1;
  var h=dt/3600;if(g.loy>=0&&g.occ>=0&&g.occ!==g.loy&&civPresent(g)>20){var L=civPolNear(g),d=(0.6+CIVP[L][6]*0.8)*h,sec=0,ca=0;gridNear(g.x,g.y,g.r+5000,function(u){if(u.side!==g.occ||!onMap(u))return;var f=ST(u).fl;if(f.indexOf('I')>=0&&dist(u.x,u.y,g.x,g.y)<g.r+3000)sec++;if(f.indexOf('V')>=0)ca++;});
    d-=sec*1.5*h+ca*1.2*h+(L<=1?0.4*h:0);if(g.hung>40)d+=1.5*h;g.unrest=clamp(g.unrest+d,0,100);}else g.unrest=clamp(g.unrest-0.5*h,0,100);}
/* 佔領當地的部隊政策（最近的佔領方編制） */
function civPolNear(g){var best=null,bd=1e18;gridNear(g.x,g.y,g.r+3000,function(u){if(u.side!==g.occ||!onMap(u))return;var d=dist(u.x,u.y,g.x,g.y);if(d<bd){bd=d;best=u;}});return best?polOf(best,'civ'):polSide(g.occ).civ;}
/* 平民糧食：被圍或遭徵用時消耗存糧，斷糧後出現飢餓死亡 */
function civFood(g,dt,siege){var d=dt/86400,p=civPresent(g);if(p<1)return;var req=g.occ>=0&&g.occ!==g.loy?[0,0,0.4,0.8,1.2,1.5][civPolNear(g)]:0;g.food+=(siege?0:0.85)*d-(1+req)*d;g.food=Math.min(g.food,40);
  if(g.food<=0){g.food=0;g.hung=clamp(g.hung+8*d*24/24,0,100);}else g.hung=clamp(g.hung-5*d,0,100);if(g.hung>50){var k=p*0.002*(g.hung-50)/50*d*24/24;civCas(g,k/0.9,0.9,'hunger',g.occ!==g.loy?g.occ:-1);if(!g.hgLog||G.t-g.hgLog>12*3600){g.hgLog=G.t;logE(-1,'civ',g.n+'糧食耗盡，居民開始因飢餓死亡',g.x,g.y);}}}
/* ---------- 交通壅塞：難民湧上道路時拖慢部隊（憲兵管制可減輕） ---------- */
function civCongest(u){if(!G.civ||!G.civ.R.length)return 1;var n=G.civ.cg[Math.floor(u.x/1000)+'|'+Math.floor(u.y/1000)]||0;if(n<300)return 1;return clamp(1-Math.min(0.55,n/8000)*(rdMP(u)?0.35:1),0.4,1);}/* 關閉動態路況時沿用的難民壅塞 */
/* ---------- 統計（報告用） ---------- */
function campDead(n){var C=G.civ,D=C.rdead||(C.rdead={m:0,w:0,k:0,e:0});D.m+=n*0.15;D.w+=n*0.35;D.k+=n*0.35;D.e+=n*0.15;C.kill=(C.kill||0)+0;}
function civSum(){var C=G.civ,o={pop0:0,pres:0,evac:0,dead:{m:0,w:0,k:0,e:0},wnd:0,fled:0,camp:0,out:C.out||0,kill:C.kill||0,wound:C.wound||0,occ:sA0(),unrest:0,val0:C.val0,loss:0,refRoad:0,refN:0};
  C.S.forEach(function(g){o.pop0+=g.tot0;o.pres+=civPresent(g);o.evac+=g.evac;o.dead.m+=g.dead.m;o.dead.w+=g.dead.w;o.dead.k+=g.dead.k;o.dead.e+=g.dead.e;o.wnd+=g.wnd;o.fled+=g.fled;o.camp+=g.camp;o.loss+=g.loss;if(g.occ>=0&&g.loy>=0&&g.occ!==g.loy)o.occ[g.occ]++;o.unrest=Math.max(o.unrest,g.unrest);});
  o.trap=C.trap||0;C.R.forEach(function(Q){if(Q.st==='go'||Q.st==='stop'||Q.st==='trap'){o.refRoad+=Q.n;o.refN++;}});var RD2=C.rdead;if(RD2){o.dead.m+=RD2.m;o.dead.w+=RD2.w;o.dead.k+=RD2.k;o.dead.e+=RD2.e;}var P=C.prop;o.propTot=P.set+P.inf+P.loot+P.fire+P.quake+P.flood+P.other;o.milTot=P.mil[0]+P.mil[1];return o;}
