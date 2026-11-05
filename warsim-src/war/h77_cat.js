/* ===================== 物資與裝備目錄：武器分成「單兵與班組武器」與「載具武裝」；載具型號一份清單（泛用、內建、LatoVehicle 設計、自訂；無人機也是載具）；自訂糧食 =====================
   單位的武器清單只放單兵與班組武器；戰車砲、機砲、自走砲、多管火箭、艦砲、航空武裝與無人機戰鬥部只裝在載具型號上。
   泛用型號是每個兵種的標準載具（例如 2000 年代戰車連的主戰車）：武裝就是兵種標準火力裡屬於這種車的部分，裝甲與速度就是兵種的數值，
   所以沒有指定型號的部隊與過去完全相同；具體型號（內建、設計或自訂）取代泛用型號時，作戰改用型號的武裝、裝甲、速度、油耗與造價。 */
if(typeof GKEYS!=='undefined')GKEYS.push('vms','vmseq','toe','foods','fseq');

/* ---------- 一、武器放在哪裡 ---------- */
var WMTC={'戰車砲':1,'艦砲':1,'航空器':1,'無人機':1,'奇幻':1},WMTK={h155:1,h155p:1,mrlc:1,mrlm:1,'2a31':1,'2a64':1,m185:1,m284:1,pzh155:1};
var WCATN={'航空器':'航空武裝','無人機':'無人機戰鬥部','奇幻':'生物與魔導'};
/* 只能裝在載具上（自訂武器可以用 mt 指定） */
function wMt(w){if(typeof w==='string')w=wpnOf(w);if(!w)return false;if(w.mt!==undefined&&w.mt!=='')return !!+w.mt;return !!(WMTC[w.cat]||WMTK[w.k]||w.base&&WMTK[w.base]);}
function wCatN(c){return WCATN[c]||c;}
function wpnListP(){return wpnList().filter(function(w){return !wMt(w);});}
function wpnListM(all){var o=[],seen={};for(var k in WPNO){var w=wpnOf(k);if(w&&wMt(w)&&(all||!WPNO[k].hid)){o.push(w);seen[k]=1;}}if(G&&G.wpns)for(var k2 in G.wpns)if(!seen[k2]&&!WPNO[k2]&&wMt(G.wpns[k2]))o.push(G.wpns[k2]);return o;}
/* 無人機的武器改稱戰鬥部（無人機本身是載具） */
[['uav','偵察打擊無人機的掛載武器'],['fpv','FPV 無人機戰鬥部'],['fpv2','FPV 無人機戰鬥部（自主終端導引）'],['loit','巡飛彈戰鬥部']].forEach(function(q){if(WPNO[q[0]])WPNO[q[0]].n=q[1];});
function wDrone(k){var w=typeof k==='string'?wpnOf(k):k;return !!(w&&w.cat==='無人機');}

/* ---------- 二、合併清單 ---------- */
function wMerge(L){var o=[],ix={};(L||[]).forEach(function(x){if(!Array.isArray(x)||!x[0])return;var n=+x[1]||0;if(ix[x[0]]!==undefined){o[ix[x[0]]][1]+=n;return;}ix[x[0]]=o.length;o.push([x[0],n]);});return o;}
function wGet(L,k){for(var i=0;i<(L||[]).length;i++)if(L[i][0]===k)return L[i][1];return 0;}

/* ---------- 三、類型的標準配備裡屬於載具的部分（整個類型的總數）
   地面部隊：主要載具帶 vmStdW 的武器（裝甲部隊連機槍也是車上的），其他只能裝在車上的武器也放到主要載具；無人機戰鬥部各自是一架無人機；
   空中與海上部隊：全部武器都在載台上；車輛用的支援裝備（覆蓋到每輛車的）放到主要載具 ---------- */
var TATC={};
function tPrinc(t,V){var dom=t.dom;if(dom!=='land'||t.br==='drg'||t.br==='mon'||t.br==='ash'){var b=null;V.forEach(function(x){if(x[1]>0&&(!b||x[1]>b[1]))b=x;});return b;}
  var P=vmPrinc(t);if(P)return P;var b2=null;V.forEach(function(x){var v=VEHI[x[0]];if(!v||!(x[1]>0)||'甲車'.indexOf(v[2])<0)return;if(!b2||x[1]>b2[1])b2=x;});return b2;}
function tAttr(t){if(!t)return null;var key=t.k+'|'+(G&&G._tv||0)+'|'+(t.load?JSON.stringify(t.load.w||0).length:0),c=TATC[key];if(c)return c;
  var D=t.load&&t.load.w?t.load:defLoad(t),W=wMerge(D.w),V=wMerge(D.v),E=wMerge((t.load&&t.load.eq)||defEq(t)),P=tPrinc(t,V),o={P:P?P[0]:null,nv:P?P[1]:0,arm:[],eqv:[],dr:[],W:W,V:V,E:E,h:D.h||0},air=t.dom!=='land'||t.br==='drg'||t.br==='mon'||t.br==='ash';
  var take={},add=function(k,n){n=Math.round(n*1000)/1000;if(!(n>0))return;var have=wGet(W,k)-(take[k]||0);n=Math.min(n,have);if(!(n>0))return;take[k]=(take[k]||0)+n;var A=o.arm;for(var i=0;i<A.length;i++)if(A[i][0]===k){A[i][1]+=n;return;}A.push([k,n]);};
  if(air){if(o.P)W.forEach(function(x){add(x[0],x[1]);});}
  else{W.forEach(function(x){if(!wDrone(x[0])||!(x[1]>0))return;o.dr.push([x[0],x[1]]);take[x[0]]=(take[x[0]]||0)+x[1];});
    if(o.P){if(!t.load)vmStdW(t).forEach(function(x){add(x[0],Math.round(x[1]*o.nv));});
      W.forEach(function(x){var w=wpnOf(x[0]);if(!w||wDrone(w))return;if(wMt(w)||t.br==='arm'&&w.cat==='機槍')add(x[0],x[1]);});
      if(VRCLS[o.P])E.forEach(function(x){var e=seqOf(x[0]);if(e&&e.cov==='v'&&x[1]>0)o.eqv.push([x[0],x[1]]);});}}
  o.take=take;TATC[key]=o;return o;}

/* ---------- 四、載具型號 ---------- */
/* 載具類別的領域：陸、空、海、潛；小型無人機（隨地面部隊行動）另成一類 */
function vcDom(c){if(c==='uas')return 'uas';if(c==='subm')return 'sub';var v=VEHI[c],k=v?v[2]:'';return k==='艦'?'sea':k==='機'?(c==='drone'?'uas':'air'):'land';}
function vmDom(m){return m?m.dom||(m.gen?vcDom(m.c):m.c==='uas'?'uas':'land'):'land';}
var VMDOMN={land:'陸上載具',air:'飛機與直升機',sea:'艦艇',sub:'潛艦',uas:'無人機'};
/* 角色：地面載具沿用列裝表的角色（戰車、步兵戰車……）；空中與海上依類別分群（換裝只在同一群裡） */
function vmGrp(m){var d=vmDom(m),c=m&&m.c;return d==='air'?(c==='helo'?'rot':'fix'):d==='sea'?'sea':d==='sub'?'sub':d==='uas'?'uas':'land';}
/* 泛用型號的角色（與 vmRoleT 相同的特例） */
function vmGenRole(t,c){if(!t||t.dom!=='land')return null;var r=VRCLS[c];if(!r)return null;if(t.br==='at')r=c==='car'||c==='recv'?'atgmv':c==='truck'?'truck':'td';else if(c==='spg'&&t.br==='ad')r='spaa';else if((c==='car'||c==='recv')&&t.br!=='rec')r=null;return r;}
var VGC={v:-1,o:{}};
function vmGen(k){if(VGC.v!==(G&&G._tv||0)){VGC={v:G&&G._tv||0,o:{}};}var c=VGC.o[k];if(c!==undefined)return c;var m=null;try{m=vmGenMk(k);}catch(e){m=null;}VGC.o[k]=m;return m;}
function vmGenMk(k){var p=k.split(':');if(p[0]!=='g')return null;
  if(p[1]==='dr'){var w=wpnOf(p[2]);if(!w)return null;var exp=p[2]!=='uav';return {k:k,n:(exp?(p[2]==='loit'?'巡飛彈':'FPV 自殺無人機'):'偵察打擊無人機')+'（泛用）',y:w.y||2000,c:'uas',dom:'uas',r:exp?(p[2]==='loit'?'loit':'fpv'):'suas',cr:0,px:0,t:p[2]==='loit'?0.02:0.001,arm:0,armC:0,m:[p[2],1],s:[],e:[],ad:[],op:[],exp:exp?1:0,lc:'',usd:wUsd(w),gen:1,d:'標準編制裡的無人機：戰鬥部就是'+w.n+'。'};}
  if(p.length===2){var V=VEHI[p[1]];if(!V)return null;var cl=p[1];return {k:k,n:V[1]+'（泛用）',y:0,c:cl,dom:vcDom(cl),r:VRCLS[cl]||'',cr:0,px:0,t:0,m:null,s:[],e:[],ad:[],op:[],lc:cl,usd:VUSD[cl]||0,gen:1,d:'沒有指定型號的'+V[1]+'。'};}
  var t=typeOf(p[1]),cls=p[2],Vc=VEHI[cls];if(!t||!Vc)return null;var A=tAttr(t),pr=A&&A.P===cls,nT=pr?A.nv:0,y=(ERAI[t.era]||ERA[6]).y,air=t.dom!=='land'||t.br==='drg'||t.br==='mon'||t.br==='ash';
  var per=function(L){return (L||[]).map(function(x){return [x[0],nT?Math.round(x[1]/nT*1000)/1000:0];}).filter(function(x){return x[1]>0;});};
  var arm=pr?per(A.arm):[],eqv=pr?per(A.eqv):[],main=null,sec=[];arm.forEach(function(x){var w=wpnOf(x[0]);if(!main&&w&&(wMt(w)||x[0]==='atgm1'||x[0]==='atgm2'||x[0]==='atgm3'))main=x;else sec.push(x);});if(!main&&sec.length)main=sec.shift();
  var nm=(t.vn?t.vn.replace(/^[輛架艘門頭枚匹具]/,''):'')||Vc[1];if(!nm||nm.length<2)nm=Vc[1];
  return {k:k,n:nm+'（'+t.n+'・標準）',y:y,c:cls,dom:air?vcDom(cls):vcDom(cls)==='uas'?'uas':'land',r:vmGenRole(t,cls)||'',cr:0,px:0,t:0,arm:pr?t.arm||0:0,armC:pr?(t.armC!==undefined?t.armC:t.arm||0):0,vr:pr?t.vr:0,vx:pr?t.vx:0,
    fu:Vc[4],lk:Vc[3],m:main,s:sec,e:eqv,ad:[],op:[],lc:cls,usd:t.vusd>0&&pr?t.vusd:VUSD[cls]||0,gen:1,tk:t.k,aT:pr?A.arm:[],eT:pr?A.eqv:[],nT:nT,plat:air?1:0,d:'沒有指定型號時'+t.n+'的'+Vc[1]+'：武裝與數值就是這個兵種的標準。'};}
/* 取得型號：內建 → 自訂 → 泛用 */
vmOf=function(k){if(!k||typeof k!=='string')return null;return VM[k]||G&&G.vms&&G.vms[k]||(k.charCodeAt(0)===103&&k.charAt(1)===':'?vmGen(k):null);};
/* 全部的具體型號（不含泛用）：內建、自訂與設計 */
function vmAll(){var o=VMR.slice();if(G&&G.vms)for(var k in G.vms)if(!VM[k])o.push(G.vms[k]);return o;}
/* 一輛車的武裝（不含加掛）：[[武器, 數量]] */
function vmArm(m,V){if(!m)return [];var o=[];if(m.m&&m.m[0])o.push([m.m[0],m.m[1]===undefined?1:m.m[1]]);(m.s||[]).forEach(function(x){o.push([x[0],x[1]===undefined?1:x[1]]);});if(V!==false)vmAdList(m,V||{}).forEach(function(a){a.w.forEach(function(x){o.push([x[0],x[1]||1]);});});return o.filter(function(x){return wpnOf(x[0])&&x[1]>0;});}
/* 後勤用的類別（油耗、油箱、載重）：'' 表示不耗油（例如電池的小型無人機） */
function vmLc(m){return !m?'':m.lc!==undefined?m.lc:VEHI[m.c]?m.c:'';}

/* ---------- 五、內建無人機型號（隨地面部隊行動的小型無人機；中大型無人機由空軍部隊與載具設計提供） ---------- */
VROLE.fpv='FPV 無人機';VROLE.loit='巡飛彈';VROLE.suas='小型偵察無人機';
var VMDR=[
 {k:'mavic',n:'商用四旋翼偵察無人機（Mavic 類）',nat:'',y:2016,c:'uas',dom:'uas',r:'suas',cr:0,t:0.001,arm:0,armC:0,vr:65,vx:65,fu:0,lk:0,m:null,s:[],e:[['sdrone',1]],lc:'',usd:2500,d:'市售空拍機改作偵察與砲兵觀測；容易被干擾，續航約半小時。'},
 {k:'orlan10',n:'Orlan-10 固定翼偵察無人機',nat:'俄羅斯',y:2010,c:'uas',dom:'uas',r:'suas',cr:0,t:0.018,arm:0,armC:0,vr:150,vx:150,fu:0,lk:0,m:null,s:[],e:[['sdrone',2]],lc:'',usd:90000,d:'續航十餘小時，用來替砲兵與火箭找目標。'},
 {k:'fpv7',n:'FPV 自殺無人機（RPG-7 戰鬥部）',nat:'',y:2022,c:'uas',dom:'uas',r:'fpv',cr:0,t:0.001,arm:0,armC:0,vr:100,vx:100,fu:0,lk:0,m:['fpv',1],s:[],e:[],lc:'',exp:1,usd:500,d:'競速無人機掛上反戰車火箭彈頭，由操作手戴頭戴顯示器飛到目標；受電子干擾時大多失效。'},
 {k:'fpvai',n:'FPV 無人機（自主終端導引）',nat:'',y:2024,c:'uas',dom:'uas',r:'fpv',cr:0,t:0.002,arm:0,armC:0,vr:110,vx:110,fu:0,lk:0,m:['fpv2',1],s:[],e:[],lc:'',exp:1,usd:1200,d:'最後一段由機上的影像辨識鎖定目標，干擾下仍有一部分能命中。'},
 {k:'fpvfo',n:'光纖導控 FPV 無人機',nat:'',y:2024,c:'uas',dom:'uas',r:'fpv',cr:0,t:0.003,arm:0,armC:0,vr:90,vx:90,fu:0,lk:0,m:['fpv2',1],s:[],e:[],lc:'',exp:1,nj:1,usd:2500,d:'以拖在後面的光纖傳輸控制與影像，無線電干擾對它無效；航程受光纖長度限制。'},
 {k:'lancet3',n:'Lancet-3 巡飛彈',nat:'俄羅斯',y:2020,c:'uas',dom:'uas',r:'loit',cr:0,t:0.012,arm:0,armC:0,vr:110,vx:110,fu:0,lk:0,m:['loit',1],s:[],e:[],lc:'',exp:1,usd:35000,d:'在目標區上空盤旋等待，由偵察無人機指示目標後俯衝攻擊。'},
 {k:'sw600',n:'彈簧刀 600 巡飛彈',nat:'美國',y:2021,c:'uas',dom:'uas',r:'loit',cr:0,t:0.023,arm:0,armC:0,vr:185,vx:185,fu:0,lk:0,m:['loit',1],s:[],e:[],lc:'',exp:1,usd:100000,d:'反裝甲戰鬥部（與標槍飛彈同級），由背包式發射管發射。'}];
VMDR.forEach(function(m){m.s=m.s||[];m.e=m.e||[];m.ad=m.ad||[];m.op=m.op||[];m.px=m.px||0;VMR.push(m);VM[m.k]=m;});

/* ---------- 六、自訂糧食 ---------- */
/* 糧食的欄位同 FOOD：[鍵, 名稱, 每份熱量, 每份重量, 士氣, 需野戰廚房, 最早年代]；自訂的存在 G.foods（{k,n,kc,kg,mo,hot,y}） */
function foodRow(k){var c=G&&G.foods&&G.foods[k];if(c)return [c.k,c.n,+c.kc||0,+c.kg||0,+c.mo||0,c.hot?1:0,+c.y||0];return FOODI[k]||null;}
function foodList(){var o=FOOD.map(function(f){return foodRow(f[0]);});if(G&&G.foods)for(var k in G.foods)if(!FOODI[k])o.push(foodRow(k));return o;}
mealSum=function(M){var kc=0,kg=0,mo=0,hot=0;M.forEach(function(meal){meal.forEach(function(it){var f=foodRow(it[0]);if(!f)return;var q=it[1]||0;kc+=f[2]*q;kg+=f[3]*q;mo+=f[4]*q;if(f[5])hot++;});});return {kc:kc,kg:kg,mo:mo,hot:hot};};
