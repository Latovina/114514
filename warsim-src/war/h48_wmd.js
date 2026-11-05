/* ===================== 化生放核魔武器的設計（模擬）=====================
   一、自訂毒劑（G.cba）：化學、生物（病原體）、放射性與魔法四類，併入原本的毒劑表（CBA）、疾病表（DZ）、人傳人（CBC）、疫苗（CBVX）與潛伏期（CBINC），
       施放、漂移、防護、感染、接種與除污都沿用原本的化生放系統。作用機制決定傷亡中的死亡比例（神經性與血液性高、失能性與催淚性極低）。
   二、自訂核彈頭（G.nwh）：分裂彈、增強分裂彈、熱核彈、強化輻射彈（中子彈）、鹽彈、乾淨彈；種類調整爆風、熱輻射、瞬發輻射與放射性落塵。
       戰術與戰略核打擊都可以指定彈頭；彈頭的重量要裝得進砲彈、火箭、飛彈或飛機。沒有指定時維持原本的計算。
   三、魔法武器（武器的 mag 欄位，設計器見 o51_wmd.js）：依系別附帶效果：燃燒、冰凍減速、雷擊麻痺、恐懼、神聖（對魔物加倍）、衝擊、地裂。 */
/* ---------- 一、自訂毒劑 ---------- */
/* 作用機制：[名稱, 傷亡種類（決定死亡比例）, 適用類別] */
var CBMECH={nerve:['神經性','nerve','c'],blis:['糜爛性','gas','c'],choke:['窒息性','gas','c'],blood:['血液性（氰化物）','cyan','c'],incap:['失能性','incap','c'],irr:['刺激性（催淚）','incap','c'],tox:['生物毒素','tox','c'],
  bact:['細菌','gas','b'],virus:['病毒','gas','b'],fung:['真菌','gas','b'],rad:['放射性粉塵','rad','r'],mias:['魔瘴','mias','m'],curse:['詛咒','mias','m']};
KIAF.cyan=0.5;KIAF.incap=0.02;KIAF.tox=0.45;
var CBAX={k:[],g:null,v:-1};
function cbaOf(id){return G&&G.cba&&G.cba[id]||null;}
/* 設計 → 毒劑表的一列（與內建的欄位相同，另加作用機制的傷亡種類與自訂旗標） */
function cbaRow(id,d){var c=CBT[d.c]?d.c:'c',dz=c==='b'||c==='m'&&d.dz&&d.dz.n?id:'',M=CBMECH[d.mech];
  return [String(d.n||'自訂毒劑').slice(0,30),c,+d.y||0,clamp(+d.k||0,0,8),clamp(+d.l||0,0,1),clamp(+d.p||0,0,9000),clamp(+d.life||60,5,600),d.h?1:0,clamp(+d.mk||0,0,1),clamp(+d.st||0,0,1),dz,/^#[0-9a-f]{6}$/i.test(d.col||'')?d.col:'#8d6e63',M&&M[2]===c?M[1]:c==='r'?'rad':c==='m'?'mias':'gas',1];}
/* 自訂毒劑併入各表；內容沒變時不重做 */
function cbaSync(){if(typeof G==='undefined'||!G)return;var v=G.cbaV||0;if(CBAX.g===G&&CBAX.v===v)return;
  CBAX.k.forEach(function(k){delete CBA[k];delete DZ[k];delete CBC[k];delete CBVX[k];delete CBINC[k];});CBAX.k=[];CBAX.g=G;CBAX.v=v;
  var L=G.cba||{};Object.keys(L).forEach(function(id){var d=L[id];if(!d||typeof d!=='object'||CBA[id])return;var A=cbaRow(id,d);CBA[id]=A;CBAX.k.push(id);
    if(A[10]){var z=d.dz||{};DZ[id]=[String(z.n||A[0]+'感染').slice(0,20),0,clamp(+z.m||0,0,1),clamp(+z.mt||0,0,1),clamp(+z.d||7,1,90)];CBINC[id]=clamp(+z.inc||3,0.1,60);if(z.ct)CBC[id]=1;
      if(A[1]==='b'&&z.vx)CBVX[id]=[String(z.vx).slice(0,20),+z.vy||0,clamp(+z.vd||14,1,90)];}});}
/* 戰場上仍在使用（毒劑雲、地面污染、病患、潛伏感染、命令）的毒劑不能刪除 */
function cbaInUse(id){if(!G)return false;if((G.cbx||[]).some(function(C){return C.ag===id;}))return true;for(var k in (G.cbgr||{}))if(k.split('|')[2]===id)return true;
  return (G.units||[]).some(function(u){return u.dzk===id&&u.sick>0.01||u.cbg&&(u.cbg.inf||[]).some(function(q){return q.dz===id;})||u.ord&&u.ord.agent===id;});}
/* 可用的毒劑：自訂的魔法類只給奇幻陣營，其他類依年代 */
(function(){var b=cbAvail;cbAvail=function(side){cbaSync();var r=b(side);if(!CBAX.k.length)return r;var y=cbY(side),fan=cbFan(side);r=r.filter(function(k){return CBAX.k.indexOf(k)<0;});
  CBAX.k.forEach(function(k){var a=CBA[k];if(a&&(a[1]==='m'?fan:!fan&&y>=a[2]))r.push(k);});return r;};})();
(function(){var b=simStep;simStep=function(){cbaSync();return b.apply(this,arguments);};})();
/* 擴散預測（設計器用）：與 cbrnStep 相同的漂移、擴散與衰減，一次施放（約一個砲兵營的一輪齊射）在下風處留下的累積劑量
   回傳每 2 分鐘的雲（下風距離、半徑、質量）；dose(x,y) 是該點的累積劑量 */
function cbaPlume(A,ws,o){o=o||{};var dt=120,x=0,r=o.r0||300,m=o.m0||1,F=[],life=A[6]*(o.rain&&A[1]!=='r'?0.5:1)*(o.hot&&A[5]>0?0.7:1)*(ws>8?0.6:1),v=ws*(A[7]?0.7:1);
  for(var i=0;i<400&&m>0.02;i++){x+=v*dt;var r0=r;r=Math.min(6000,r+(0.25+ws*0.05)*dt);m*=Math.exp(-dt/60/Math.max(5,life))*Math.pow(r0/r,0.5);F.push([x,r,m]);}
  return {F:F,dose:function(px,py){var s=0;for(var j=0;j<F.length;j++){var q=F[j],d=Math.sqrt((px-q[0])*(px-q[0])+py*py);if(d>q[1]*1.6)continue;s+=q[2]/Math.max(0.05,(q[1]/400)*(q[1]/400))*Math.exp(-2*(d/q[1])*(d/q[1]))*dt/60;}return s;}};}
/* 劑量 → 傷亡（化學、放射、魔法）或感染（生物）比例；P 為防護係數 */
function cbaEffect(A,dose,P){var e=dose*(1-(P||0));return A[1]==='b'?1-Math.exp(-e*A[3]*0.15):1-Math.exp(-e*A[3]*0.06);}
/* ---------- 二、自訂核彈頭 ---------- */
/* 種類：[名稱, 爆風能量比例, 熱輻射比例, 瞬發輻射範圍倍數, 落塵倍數, 最早年代, 當量下限, 當量上限（千噸）] */
var NWKIND={fis:['分裂彈',1,1,1,1,1945,0.01,700],boost:['增強分裂彈',1,1,1,0.7,1951,0.1,1000],th:['熱核彈（氫彈）',1,1,0.9,0.5,1952,50,100000],
  er:['強化輻射彈（中子彈）',0.5,0.5,1.5,0.3,1963,0.1,10],salt:['鹽彈（加強落塵）',1,1,1,3,1957,100,100000],clean:['乾淨彈（低落塵）',1,1,0.9,0.1,1956,50,50000]};
var NWK=null;/* 正在引爆的彈頭設計 */
function nwhOf(id){return id&&G&&G.nwh&&G.nwh[id]||null;}
function nwK(W){return NWKIND[W&&W.k]||NWKIND.fis;}
/* 估計重量（公斤）：依年代的比威力；最高約 5.2 千噸／公斤（B41） */
function nwhKgEst(Y,y,k){var a=y<1948?1500:y<1953?600:y<1957?150:y<1962?63:y<1975?40:30;return Math.round(Math.max(k==='er'?40:23,a*Math.pow(Math.max(0.01,Y),0.4),Y/5.2));}
function nwhUsdEst(Y,k){return Math.round(2e6*Math.pow(Math.max(0.01,Y)/100,0.2)*(k==='er'?1.6:k==='salt'?1.3:k==='clean'?1.4:k==='th'?1.2:1));}
/* 指定彈頭時調整各範圍 */
(function(){var b=nukeR;nukeR=function(Y){var R=b(Y);if(!NWK)return R;var f=Math.cbrt(nwK(NWK)[1]);return R.map(function(r){return r*f;});};})();
(function(){var b=snkZones;snkZones=function(Y,burst){var Z=b(Y,burst);if(!NWK)return Z;var K=nwK(NWK),f=Math.cbrt(K[1]),t=Math.sqrt(K[2]);['fb','r12','r5','r2','r1','cr'].forEach(function(k){Z[k]*=f;});Z.th*=t;Z.rad*=K[3];return Z;};})();
/* 戰術核武的瞬發輻射範圍（中子彈穿透裝甲） */
function nwhRadR(Y,K){return 1200*Math.pow(Math.max(0.01,Y)/15,0.19)*K[3];}
/* 能不能由這個單位發射或投下 */
function nwhFit(u,W){if(!W)return '找不到這個核彈頭設計';var s=ST(u),cap=nukeCap(u),y=G.set.y||1943,K=nwK(W);if(!cap)return '不具核打擊能力或未獲授權';
  if(K[5]>y||(W.y||0)>y)return '這個年代還造不出「'+W.n+'」';if(W.Y>cap*1.0001)return '「'+W.n+'」的當量 '+yTxt(W.Y)+' 超過這個單位的上限 '+yTxt(cap);
  var lim=s.dom==='air'?30000:indOf(u,s)>=20000?1000:120;if((W.kg||0)>lim)return '「'+W.n+'」重 '+fmt(W.kg)+' 公斤，'+(s.dom==='air'?'飛機':indOf(u,s)>=20000?'火箭與飛彈':'砲彈')+'最多約 '+fmt(lim)+' 公斤';return '';}
var NWDEL={icbm:9000,slbm:2800,bomber:30000,cruise:500};
function nwhDelWhy(del,W){if(!W)return '找不到這個核彈頭設計';var y=typeof snkYr==='function'?snkYr():(G.set.y||1943),K=nwK(W);if(K[5]>y||(W.y||0)>y)return '這個年代還造不出「'+W.n+'」';
  var lim=NWDEL[del]||9000;if((W.kg||0)>lim)return '「'+W.n+'」重 '+fmt(W.kg)+' 公斤，超過'+(SNKD[del]?SNKD[del].n:'載具')+'的酬載上限 '+fmt(lim)+' 公斤';return '';}
function nwhNote(W,Y){var K=nwK(W);return W.k==='er'?'：爆風與熱輻射較小，但強烈的中子輻射穿透裝甲，約 '+kmTxt(nwhRadR(Y,K))+' 內的人員受到致命劑量':W.k==='salt'?'：放射性落塵約為一般核彈的 3 倍':W.k==='clean'?'：幾乎沒有放射性落塵':'';}
/* 戰術核武：第 6 個參數為彈頭 */
(function(){var b=nukeAt;nukeAt=function(side,x,y,Y,src,wk){var W=nwhOf(wk);if(!W)return b.apply(this,arguments);var o=NWK,n0=(G.rad||[]).length,K=nwK(W);NWK=W;
  try{var r=b(side,x,y,Y,src);
    /* 殘留輻射區依落塵倍數調整範圍與時間 */(G.rad||[]).slice(n0).forEach(function(z){z.r*=clamp(Math.sqrt(K[4]),0.3,2);z.t1=z.t0+(z.t1-z.t0)*clamp(K[4],0.1,4);});
    /* 中子彈：中子輻射穿透裝甲（戰車只擋下約一成），土方工事可擋下一半 */if(K[3]>1){var R=nukeR(Y),rr=nwhRadR(Y,K);G.units.forEach(function(t){if(!alive(t)||t.st==='off'||t.st==='lift'||ST(t).dom==='air'&&t.st==='air')return;var d=dist(t.x,t.y,x,y),ts=ST(t);if(d>=rr||d<R[0])return;var f=0.8*(1-0.1*(ts.hard||0))*(1-0.5*(ts.dom==='land'?t.ent||0:0))*(1-(d/rr)*(d/rr));if(f>0.01)hit(t,src||null,t.men*f,0,20,'rad');});}
    logE(-1,'nuke','☢ 彈頭：「'+W.n+'」（'+K[0]+'，'+yTxt(Y)+'）'+nwhNote(W,Y),x,y);return r;}finally{NWK=o;}};})();
/* 戰略核武：第 8 個參數為彈頭 */
(function(){var b=snukeAt;snukeAt=function(side,x,y,Y,burst,src,del,wk){var W=nwhOf(wk);if(!W)return b.apply(this,arguments);var o=NWK;NWK=W;
  try{var r=b(side,x,y,Y,burst,src,del);if(r)r.wk=wk;logE(-1,'nuke','☢ 彈頭：「'+W.n+'」（'+nwK(W)[0]+'，'+yTxt(Y)+'）'+nwhNote(W,Y),x,y);return r;}finally{NWK=o;}};})();
(function(){var b=snkFallout;snkFallout=function(side,x,y,Y,burst){var n0=(G.fo||[]).length,r=b.apply(this,arguments);if(!NWK)return r;var f=nwK(NWK)[4];if(f===1)return r;
  (G.fo||[]).slice(n0).forEach(function(z){z.I*=f;});if(r){if(G.civ)G.civ.foD=(G.civ.foD||0)+r.est*(f-1);r.est*=f;}return r;};})();
(function(){var b=snkLaunch;snkLaunch=function(side,del,Y,burst,x,y,auto,wk){if(!wk)return b.apply(this,arguments);var W=nwhOf(wk);if(nwhDelWhy(del,W))return null;
  var Q=b(side,del,W.Y,burst||W.b||'air',x,y,auto);if(Q){Q.wk=wk;logE(side,'nuke','☢ 彈頭：「'+W.n+'」（'+nwK(W)[0]+'，'+yTxt(W.Y)+'）',x,y);}return Q;};})();
/* ---------- 三、魔法武器 ---------- */
/* 系別：[名稱, 附帶效果, 對人, 對裝甲, 穿甲, 壓制, 防空（每級威力）] */
var MAGS={fire:['火系','burn',1.3,0.35,4,2.2,0],ice:['冰系','slow',0.9,0.25,3,2,0],ltn:['雷系','stun',1,0.5,6,2.6,0.1],dark:['暗系（精神）','terror',0.7,0.1,2,3.2,0],
  holy:['光系（神聖）','smite',0.9,0.4,5,1.8,0.05],wind:['風系（衝擊）','knock',0.8,0.3,3,2.4,0.05],earth:['土系','quake',1,0.6,6,2,0],arc:['奧術','',1.1,0.8,8,1.6,0.05]};
/* 範圍：[名稱, 對人倍數, 對裝甲倍數, 壓制倍數, 精度, 施法者] */
var MAGA={one:['單體',0.7,1.5,1,1.1,1],burst:['小範圍',1,1,1.15,1,1],wide:['大範圍',1.5,0.6,1.3,0.9,3],rit:['儀式（間接）',1.8,0.8,1.4,0.8,6]};
var MAGFX={burn:'燃燒',slow:'冰凍減速',stun:'雷擊麻痺',terror:'恐懼',smite:'神聖（對魔物加倍）',knock:'衝擊（打亂隊形）',quake:'地裂（破壞工事）'};
/* 由法術參數算出武器數值：威力 1～10、射程（公尺）、每次施法的魔力 1～10 */
function magApply(w){var m=w&&w.mag;if(!m)return w;var S=MAGS[m.sch]||MAGS.arc,A=MAGA[m.area]||MAGA.burst,P=clamp(+m.pow||3,1,10),R=clamp(+m.rng||400,50,20000),M=clamp(+m.mana||3,1,10),q=P/3;
  m.sch=MAGS[m.sch]?m.sch:'arc';m.area=MAGA[m.area]?m.area:'burst';m.pow=P;m.rng=R;m.mana=M;if(m.fx===undefined||m.fx!==''&&!MAGFX[m.fx])m.fx=S[1];
  w.cat='奇幻';w.pP=+(S[2]*q*A[1]).toFixed(3);w.pA=+(S[3]*q*A[2]).toFixed(3);w.pen=+Math.min(20,S[4]+P*0.8).toFixed(1);w.sup=+(S[5]*A[3]).toFixed(2);
  if(m.area==='rit'){w.ind=R;w.rE=0;w.rM=0;}else{w.ind=0;w.rE=R;w.rM=Math.round(R*2.5);}w.acc=A[4];w.crew=A[5]*(P>=8?2:1);w.aa=+Math.min(1.5,S[6]*P).toFixed(2);w.nv=m.sch==='holy'?2:1;w.gen=1;w.y=0;
  w.rpu=clamp(Math.round(300/(M*Math.sqrt(P))),3,200);w.kg=+(0.2*M).toFixed(2);w.usd=Math.round(60000*Math.pow(P,1.5)*(A[5]>1?1.5:1));w.rusd=Math.round(400*M);return w;}
/* 單位的魔法效果：各效果占火力的比例 */
(function(){var b=logRecalc;logRecalc=function(u){var r=b.apply(this,arguments),L=u&&u.lg;if(!L||!L.wpnF)return r;var T=0,F={},any=false;
  (L.w||[]).forEach(function(x){var d=wpnOf(x[0]),n=x[1]||0;if(!d||!(n>0))return;var p=n*((d.pP||0)+(d.pA||0))*(d.acc||1);T+=p;if(d.mag&&MAGFX[d.mag.fx]){F[d.mag.fx]=(F[d.mag.fx]||0)+p;any=true;}});
  if(any&&T>0){for(var k in F)F[k]=clamp(F[k]/T,0,1);L.wpnF.mfx=F;}return r;};})();
var MAGK={fire:1,art:1,melee:1,air:1,airstrike:1,breath:1,grapple:1};
(function(){var b=hit;hit=function(t,src,dm,dv,sup,kind){var F=src&&src.lg&&src.lg.wpnF&&src.lg.wpnF.mfx;if(!F||!t||!MAGK[kind])return b.apply(this,arguments);
  var men=Math.max(1,t.men),ts=ST(t),mon=ts.br==='mon'||ts.br==='drg'||ts.era==='efan';if(!(dm>=0))dm=0;if(!(dv>=0))dv=0;
  if(F.burn){dm*=1+0.3*F.burn;dv*=1+0.15*F.burn;}if(F.smite&&mon){dm*=1+F.smite;dv*=1+F.smite;}if(F.stun)sup+=12*F.stun*Math.min(1,dm/men*20+0.2);
  var r=b.call(this,t,src,dm,dv,sup,kind),fr=Math.min(1,(dm+dv*8)/men);
  if(F.slow)t.slowT=Math.max(t.slowT||0,G.t+Math.round(240*F.slow));if(F.terror)t.mor=clamp(t.mor-F.terror*Math.min(4,fr*150),0,100);if(F.knock)t.org=clamp((t.org||0)-F.knock*Math.min(4,fr*120),0,100);
  if(F.quake&&ts.dom==='land'&&(t.ent||0)>0)t.ent=Math.max(0,t.ent-0.03*F.quake);return r;};})();
/* 冰凍：移動速度降為六成 */
(function(){var b=speedAt;speedAt=function(u){var v=b.apply(this,arguments);return u&&u.slowT&&G.t<u.slowT?v*0.6:v;};})();
/* 聯機：設計傳給玩家（地圖上的毒劑名稱與顏色、命令面板的彈頭清單） */
if(typeof mpValList==='function'){(function(){var b=mpValList;mpValList=function(s){var V=b.apply(this,arguments);V.push(['cba',G.cba]);V.push(['cbaV',G.cbaV]);V.push(['nwh',G.nwh]);return V;};})();}
