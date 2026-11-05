/* ===================== 飛機的出擊掛載：每一架次起飛前選定（從基地起飛、飛到戰場上空算一次任務），回基地整補後下一趟可以換 =====================
   標準掛載就是過去的能力；空戰（機槍或空對空飛彈）、炸彈、機砲與火箭、空對地飛彈或精準導引武器、魚雷或反艦飛彈、反輻射飛彈、偵察相機或莢艙，
   各自改變這一趟的對空、對地、對艦能力與偵察範圍；精準武器誤傷平民較少，炸彈較多。沒有指定時依任務自動選（巡邏掛空戰、偵察掛相機、
   打船艦掛反艦武器、打防空陣地掛反輻射飛彈，其他用標準掛載）。能選什麼依機種與年代。 ===================== */
/* n：[早期名稱, 晚期名稱]，ny：改用晚期名稱的年份；y0：最早年份；role：可用的機種 */
var LDK={
 std:{n:['標準掛載'],y0:0,sa:1,ha:1,aa:1,sp:1,civ:1,ship:1,role:'*',d:'原廠的標準配置，攻守兼顧'},
 aa:{n:['機槍空戰','空對空飛彈'],ny:1955,y0:0,sa:0.35,ha:0.25,aa:1.25,sp:1,civ:1,ship:0.5,role:'fighter|attack|heli',d:'專打飛機：空戰較強，幾乎不能對地'},
 bomb:{n:['炸彈'],y0:1912,sa:1.3,ha:1.15,aa:0.6,sp:1,civ:1.3,ship:1,role:'fighter|attack|heli',d:'對地面集結的部隊與設施；掛彈後空戰較差，轟炸面積大、平民傷亡較多'},
 cas:{n:['機槍掃射','機砲與火箭'],ny:1940,y0:1915,sa:1.15,ha:0.9,aa:0.85,sp:1,civ:1,ship:0.6,role:'fighter|attack|heli',d:'低空近接支援地面部隊'},
 agm:{n:['空對地飛彈','精準導引武器'],ny:1990,y0:1965,sa:0.6,ha:1.6,aa:0.8,sp:1,civ:0.4,ship:1.2,role:'fighter|attack|bomber|heli|uav',d:'打戰車、碉堡與點目標，誤傷平民較少'},
 ashm:{n:['魚雷','反艦飛彈'],ny:1960,y0:1915,sa:0.4,ha:0.5,aa:0.7,sp:1,civ:1,ship:2.2,role:'attack|bomber|heli',d:'專打船艦，對陸地目標效果差'},
 sead:{n:['反輻射飛彈'],y0:1965,sa:0.5,ha:0.7,aa:0.85,sp:1,civ:0.6,ship:0.8,ad:2.2,role:'fighter|attack|uav',d:'壓制雷達與防空陣地'},
 recon:{n:['偵察相機','偵察莢艙'],ny:1975,y0:1914,sa:0.15,ha:0.1,aa:0.7,sp:1.6,civ:1,ship:0.3,role:'fighter|attack|uav|recon',d:'看得更遠更清楚，幾乎不能攻擊'}};
function ldY(){return G.set.y||1943;}
function ldName(k,y){var L=LDK[k];if(!L)return '';y=y||ldY();return L.n[L.ny&&y>=L.ny&&L.n[1]?1:0];}
function ldOk(u,k){var L=LDK[k];if(!L||ST(u).dom!=='air')return false;if(k==='std')return true;var r=airRole(u);if(ldY()<L.y0||!r||L.role.split('|').indexOf(r)<0)return false;var s=ST(u);return k==='recon'||k==='aa'?true:(s.sa>0||s.ha>0);}
function ldList(u){return Object.keys(LDK).filter(function(k){return ldOk(u,k);});}
/* 依任務自動選：巡邏掛空戰、偵察掛相機、目標附近有船掛反艦武器、有防空陣地掛反輻射飛彈，其他用標準掛載 */
function ldAuto(u,o){var k=o?o.k:'',L=function(q){return ldOk(u,q)?q:'';};if(/^(patrol|escort|cap)$/.test(k))return L('aa')||'std';if(k==='recon')return L('recon')||'std';
  if(o&&o.x!==undefined&&(AIRRUNK.test(k)||k==='strike')){var C=G.ct[u.side]||{},ship=0,sam=0,n=0;for(var id in C){var c=C[id];if(c.dead||G.t-c.t>3600||dist(c.x,c.y,o.x,o.y)>(o.r||3000)+1500)continue;n++;if(c.dom==='sea'||c.dom==='sub')ship++;else if(c.br==='ad')sam++;}
    if(ship&&ship>=n/2&&L('ashm'))return 'ashm';if(sam&&L('sead'))return 'sead';}return 'std';}
ldPick=function(u,o){var w=o&&o.opt&&o.opt.ld;u.ld=w&&w!=='auto'&&ldOk(u,w)?w:ldAuto(u,o);u.ldN=u.sorties||0;};
ldTxt=function(u){return u.ld&&u.ld!=='std'?'，掛載'+ldName(u.ld):'';};
function ldOf(u){return u&&u.st==='air'&&u.ld&&LDK[u.ld]?LDK[u.ld]:null;}
(function(){var b=saOf;saOf=function(u,s){var v=b(u,s),L=ldOf(u);return L?v*L.sa:v;};})();
(function(){var b=haOf;haOf=function(u,s){var v=b(u,s),L=ldOf(u);return L?v*L.ha:v;};})();
ldAA=function(u,s){var v=s.aa||0,L=ldOf(u);return L?v*L.aa:v;};
(function(){var b=spotOf;spotOf=function(u,s){var v=b(u,s),L=ldOf(u);return L&&L.sp!==1?v*L.sp:v;};})();
/* 對艦與壓制防空：命中時依目標調整 */
(function(){var b=hit;hit=function(t,src,dm,dv,sup,kind){var L=src&&ldOf(src);if(L&&t){var ts=ST(t),f=ts.dom==='sea'||ts.dom==='sub'?L.ship:L.ad&&ts.dom==='land'&&((ts.aa||0)>0||ts.br==='ad')?L.ad:1;if(f!==1){dm*=f;dv*=f;}}return b.call(this,t,src,dm,dv,sup,kind);};})();
/* 平民：精準武器誤傷較少，炸彈較多 */
(function(){var b=civHitAir;civHitAir=function(a,s,x,y,SA,fr,dm,area){var L=ldOf(a);return b.call(this,a,s,x,y,L?SA*L.civ:SA,fr,dm,area);};})();
