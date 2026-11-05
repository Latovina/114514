/* ===================== 化學、生物、放射性（CBRN）作戰：
   毒劑雲隨風漂移、擴散、被雨沖淡，重於空氣的毒劑沉入低地與壕溝；持久性毒劑（芥子氣、VX、炭疽孢子、放射性落塵、魔瘴）污染地面，經過或停留的部隊持續暴露並沾染裝備。
   防護：防毒面具（聞到或警報後戴上，有延遲）、防護服與防護等級（MOPP 0～4，越高越安全但越累、戰鬥力越低）、密閉載具、疫苗（天花、鼠疫、炭疽；異世界的祝福）。
   應對：工兵與醫療單位除污、醫療單位接種疫苗、隔離傳染病患。古代可以拋射疫屍，異世界有魔瘴。使用化學與生物武器依年代記為違反國際法（1899 海牙宣言、1925 日內瓦議定書）。
   風：G.env.wd（風吹向的方向）、G.env.ws（公尺／秒），隨天氣緩慢變化 ===================== */
/* 毒劑：[名稱, 類別 c化學 b生物 r放射 m魔法, 年代, 殺傷 k（每單位劑量）, 致死比例, 地面持久（小時）, 雲存續（分鐘）, 重於空氣, 面具防護, 防護服防護, 疾病, 顏色] */
var CBA={chl:['氯氣','c',1915,0.9,0.1,0,50,1,0.85,0.2,'','#c8d24a'],phos:['光氣','c',1916,1.2,0.22,0,50,1,0.9,0.2,'','#d9e8b0'],must:['芥子氣','c',1917,0.5,0.03,72,90,1,0.45,0.9,'','#b0893a'],
  sarin:['沙林（神經毒劑）','c',1950,2.2,0.55,3,35,0,0.75,0.6,'','#9b7fd1'],vx:['VX（持久性神經毒劑）','c',1960,2.6,0.6,240,45,0,0.4,0.92,'','#7a4fb5'],
  anth:['炭疽孢子','b',1940,0.6,0,700,90,0,0.95,0.6,'anth','#8a6e4b'],plag:['鼠疫菌','b',1940,0.5,0,0,60,0,0.85,0.4,'plag','#6e5a3a'],pox:['天花病毒','b',1940,0.4,0,0,60,0,0.75,0.3,'pox','#a0522d'],
  corpse:['疫屍（拋射）','b',0,0.3,0,24,25,0,0.3,0.1,'plag','#5b4636'],dirty:['放射性髒彈','r',1950,0.25,0.3,4000,120,0,0.5,0.3,'','#d81b60'],mias:['魔瘴','m',0,0.7,0.2,48,150,1,0.5,0.4,'mias','#6a1b9a']};
var CBT={c:'化學',b:'生物',r:'放射性',m:'魔法'};
KIAF.gas=0.08;KIAF.nerve=0.6;KIAF.mias=0.3;
if(typeof DZ!=='undefined'){DZ.anth=['炭疽',0,0.45,0.12,7];DZ.mias=['魔瘴熱',0,0.3,0.06,6];}
var CBVX={pox:['天花疫苗',1798,7],plag:['鼠疫疫苗',1897,10],anth:['炭疽疫苗',1954,14],mias:['淨化祝福',0,1]};
var CBC={pox:1,plag:1,mias:1};/* 會人傳人 */
var CBINC={};/* 自訂疾病的潛伏期（天） */
function cbOn(){return !G||!G.set||G.set.cbrn!==false;}
function cbFan(side){var hq=sideCmd(side);return !!(hq&&uEra(hq).fan);}
function cbY(side){var hq=sideCmd(side);return hq?uEra(hq).y:(G.set.y||1943);}
/* 這一方此時能用的毒劑 */
function cbAvail(side){var y=cbY(side),fan=cbFan(side);return Object.keys(CBA).filter(function(k){var a=CBA[k];if(k==='mias')return fan;if(k==='corpse')return !fan&&y<1900;return !fan&&y>=a[2];});}
/* 依年代的國際法 */
function cbLaw(ag){var y=G.set.y||1943,t=CBA[ag][1];if(t==='m')return '';if(t==='b'&&ag==='corpse')return '';if(y>=1925)return t==='r'?'1949 年日內瓦公約禁止不分青紅皂白攻擊平民（放射性污染無法區分軍民）':'1925 年日內瓦議定書禁止在戰爭中使用化學與生物武器'+(y>=1993&&t==='c'?'（1993 年化學武器公約全面禁止）':y>=1972&&t==='b'?'（1972 年生物武器公約全面禁止）':'');
  if(y>=1899&&t==='c')return '1899 年海牙宣言禁止使用以散布窒息性或有毒氣體為唯一目的的砲彈';return '';}
/* ---------- 風 ---------- */
function windInit(){var E=G.env;if(E.wd!==undefined)return;var r=mb32(hstr((G.set.seed||'')+'|wind'));E.wd=r()*2*PI;E.ws=2+r()*3;E.wsT=E.ws;}
/* 風用自己的亂數（不影響其他系統的亂數序列） */function windStep(){var E=G.env;windInit();var r=mb32(hstr((G.set.seed||'')+'|wd|'+G.step)),w=WX[E.wx]||WX[0],nm=String(w[1]||''),tgt=/暴|颱|風/.test(nm)?11:/雨|雪/.test(nm)?5.5:/霧/.test(nm)?1:3.2;E.wsT+=(tgt-E.wsT)*0.2;E.ws=clamp(E.ws+(E.wsT-E.ws)*0.3+(r()-0.5)*0.8,0.3,20);E.wd+=(r()-0.5)*0.35;}
var DIR8N=['東','東南','南','西南','西','西北','北','東北'];
function windTxt(){var E=G.env;if(E.wd===undefined)return '';var from=E.wd+PI,a=((from%(2*PI))+2*PI)%(2*PI);return DIR8N[Math.round(a/(PI/4))%8]+'風 '+fx(E.ws,1)+' 公尺／秒';}
/* ---------- 部隊的防護 ---------- */
function cbGear(u){if(u.cbg)return u.cbg;var y=uEra(u).y,fan=!!uEra(u).fan;u.cbg={mask:fan?0.5:y>=1916?1:y>=1915?0.5:0,suit:fan?0:y>=1960?1:y>=1940?0.35:y>=1917?0.1:0,filt:100,vax:{},on:0,inf:[],dose:0,cont:0};
  var V=SD(u.side).vax0||{};Object.keys(V).forEach(function(k){if(V[k])u.cbg.vax[k]=-1e9;});return u.cbg;}
/* 本方設定的防護等級是下限；部隊依威脅自動提高的等級（u.mopp）在其上 */function cbMopp(u){var m=SD(u.side).mopp||0;return u.mopp!==undefined?Math.max(u.mopp,m):m;}
/* 防護係數：面具（已戴上）、防護服（依防護等級）、密閉載具、工事；重於空氣的毒劑沉入壕溝 */
function cbProt(u,ag){var g=cbGear(u),A=CBA[ag],s=ST(u),M=cbMopp(u),y=uEra(u).y,p=0,masked=g.on||M>=4;if(masked&&g.mask>0&&g.filt>0)p=A[8]*g.mask;var sp=g.suit*A[9]*(M>=4?1:M>=3?0.75:M>=2?0.5:0);p=1-(1-p)*(1-sp);
  if(s.arm>0&&u.veh>0){var veh=y>=1960?0.9:y>=1940?0.5:0.3;p=1-(1-p)*(1-veh*clamp(u.veh*8/(u.men+u.veh*8),0.3,1));}if(A[7]&&(u.ent||0)>0.5)p*=0.85;if(A[1]==='m'&&uEra(u).fan)p=Math.max(p,0.3);return clamp(p,0,0.98);}
/* ---------- 毒劑雲與地面污染 ---------- */
function cbList(){return G.cbx||(G.cbx=[]);}
function cbRelease(side,ag,x,y,mass,r,src,why){var L=cbList(),A=CBA[ag];if(!A)return null;var C=null;L.forEach(function(q){if(!C&&q.ag===ag&&dist(q.x,q.y,x,y)<q.r*0.5){C=q;}});
  if(C){C.m+=mass;C.x=(C.x*2+x)/3;C.y=(C.y*2+y)/3;C.r=Math.max(C.r,r);return C;}C={id:(G.cbSeq=(G.cbSeq||0)+1),ag:ag,x:x,y:y,r:r,m:mass,t0:G.t,side:side,src:src?src.id:0,seen:[side===0?1:0,side===1?1:0]};L.push(C);
  if(!G.cbUse)G.cbUse=sA0();if(side>=0&&!G.cbUse[side]){G.cbUse[side]=G.t;}var law=cbLaw(ag);if(src&&law&&!src._cbLaw){src._cbLaw=1;if(typeof warCrime==='function')warCrime(src,'cbrn',0,'使用'+A[0]+'（'+placeTxt(x,y)+'）——'+law);}
  logE(side,'cbrn',(src?uName(src):G.sides[side]?G.sides[side].name:'')+(why||'施放')+A[0]+'（'+placeTxt(x,y)+'）',x,y,src?src.id:undefined);return C;}
function cbGK(x,y){var B=G.map.cs*8;return Math.floor(x/B)+'|'+Math.floor(y/B);}
function cbGround(){return G.cbgr||(G.cbgr={});}
/* 每 2 分鐘：雲漂移、擴散、衰減；持久性毒劑落地；部隊與平民暴露 */
function cbrnStep(){var L=G.cbx,GR=G.cbgr;if((!L||!L.length)&&(!GR||!Object.keys(GR).length)&&!cbAnyInf())return;windInit();var E=G.env,dt=120,w=WX[E.wx]||WX[0],rain=/雨|雪/.test(String(w[1]||'')),hot=E.T>25,MP=G.map;
  (L||[]).forEach(function(C){var A=CBA[C.ag],age=(G.t-C.t0)/60,ws=E.ws*(A[7]?0.7:1);C.x=clamp(C.x+Math.cos(E.wd)*ws*dt,0,MP.Wm);C.y=clamp(C.y+Math.sin(E.wd)*ws*dt,0,MP.Hm);
    if(A[7]){/* 重於空氣：往低處流 */var k=cellAt(C.x,C.y),gx=k%MP.GW,gy=(k/MP.GW)|0,best=MP.el[k],bx=0,by=0;for(var b=-2;b<=2;b++)for(var a=-2;a<=2;a++){var X=gx+a*2,Y=gy+b*2;if(X<0||Y<0||X>=MP.GW||Y>=MP.GH)continue;var e=MP.el[Y*MP.GW+X];if(e<best){best=e;bx=a;by=b;}}C.x+=bx*MP.cs*0.4;C.y+=by*MP.cs*0.4;}
    var r0=C.r;C.r=Math.min(6000,C.r+(0.25+E.ws*0.05)*dt);var life=A[6]*(rain&&A[1]!=='r'?0.5:1)*(hot&&A[5]>0?0.7:1)*(E.ws>8?0.6:1);C.m*=Math.exp(-dt/60/Math.max(5,life))*Math.pow(r0/C.r,0.5);
    if(A[5]>0){var G2=cbGround(),key=cbGK(C.x,C.y)+'|'+C.ag;G2[key]=(G2[key]||0)+C.m*0.04;}});
  if(L)G.cbx=L.filter(function(C){return C.m>0.02;});
  /* 地面污染衰減（半衰期約為持久時間的一半；雨水加速） */if(GR)Object.keys(GR).forEach(function(key){var ag=key.split('|')[2],A=CBA[ag];GR[key]*=Math.exp(-dt/3600/Math.max(0.5,A[5]*0.7)*(rain?1.5:1));if(GR[key]<0.01)delete GR[key];});
  cbExpose(dt);cbInfStep(dt);}
function cbAnyInf(){return G.units.some(function(u){return u.cbg&&u.cbg.inf&&u.cbg.inf.length||u.cbg&&u.cbg.cont>0.01||u.sick>0.5&&CBC[u.dzk];});}
function cbConc(x,y){var o={},any=false;(G.cbx||[]).forEach(function(C){var d=dist(x,y,C.x,C.y);if(d>C.r*1.6)return;var f=Math.exp(-2*(d/C.r)*(d/C.r)),c=C.m/Math.max(0.05,(C.r/400)*(C.r/400))*f;if(c>0.001){o[C.ag]=(o[C.ag]||0)+c;any=true;}});
  var G2=G.cbgr;if(G2){var k0=cbGK(x,y);Object.keys(CBA).forEach(function(ag){var v=G2[k0+'|'+ag];if(v>0.001){o[ag]=(o[ag]||0)+v*0.6;o['g_'+ag]=v;any=true;}});}return any?o:null;}
/* 警報與戴面具：第一次聞到後一段時間才戴上（年代越新越快；防護等級 4 時已戴） */
function cbMaskDelay(u){var y=uEra(u).y;return y>=1980?15:y>=1950?30:y>=1917?60:150;}
function cbExpose(dt){G.units.forEach(function(u){if(!onMap(u)||!isLeaf(u)||ST(u).dom!=='land'||u.men<1)return;var o=cbConc(u.x,u.y),g=u.cbg;if(!o){if(g&&g.on&&G.t-(g.onT||0)>1800&&cbMopp(u)<4)g.on=0;if(g&&g.cont>0)g.cont*=0.995;return;}g=cbGear(u);
    /* 警報：這一輪中戴上面具之前的那段時間沒有面具的保護 */var bare=1;if(!g.on&&g.mask>0){if(!g.alarm||G.t-g.alarm>3600){g.alarm=G.t;logE(u.side,'cbrn',uName(u)+'：「毒氣！」'+(cbMopp(u)>=4?'（已在防護狀態）':'——戴上防毒面具'),u.x,u.y,u.id);}bare=clamp(cbMaskDelay(u)/dt,0,1);g.on=1;g.onT=G.t;}else{bare=0;if(g.on)g.onT=G.t;}
    var sus=Math.max(0,u.men-(g.inf||[]).reduce(function(a,q){return a+q.n;},0)),hurt=0,bio=[];Object.keys(o).forEach(function(ag){if(ag.indexOf('g_')===0)return;var A=CBA[ag];if(!A)return;var P=cbProt(u,ag);if(bare>0){g.on=0;var P0=cbProt(u,ag);g.on=1;P=P0*bare+P*(1-bare);}var dose=o[ag]*dt/60*(1-P);if(dose<=0)return;g.dose+=dose;
      if(o['g_'+ag]&&A[5]>0)g.cont=Math.min(5,g.cont+o['g_'+ag]*0.02*(1-P));if(g.on&&g.filt>0)g.filt=Math.max(0,g.filt-dose*3);
      if(A[1]==='b'||A[1]==='m'&&A[10]){var vx=g.vax[A[10]],imm=vx!==undefined&&G.t-vx>=((CBVX[A[10]]||[0,0,7])[2]*86400);var inf=sus*(1-Math.exp(-dose*A[3]*0.15))*(imm?0.08:1);if(inf>0.05){bio.push([A[10],inf]);sus-=inf;}if(A[1]!=='m')return;}
      var cas=u.men*(1-Math.exp(-dose*A[3]*0.06));if(cas>0.01){var kind=ag==='sarin'||ag==='vx'?'nerve':A[12]?A[12]:A[1]==='r'?'rad':A[1]==='m'?'mias':'gas',src=(G.cbx||[]).filter(function(C){return C.ag===ag;})[0];hit(u,src&&src.src?uById(src.src):null,cas,0,6+cas/Math.max(1,u.men)*80,kind);hurt+=cas;}});
    bio.forEach(function(q){g.inf.push({dz:q[0],n:q[1],t:G.t+(CBINC[q[0]]||(q[0]==='anth'?2:q[0]==='mias'?1:q[0]==='plag'?3:10))*86400*(0.6+0.8*rnd8())});});
    if(hurt>0.5&&!g.hurtLog){g.hurtLog=1;logE(u.side,'cbrn',uName(u)+'遭'+Object.keys(o).filter(function(k){return k.indexOf('g_')<0&&CBA[k];}).map(function(k){return CBA[k][0];}).join('、')+'侵襲（'+placeTxt(u.x,u.y)+'），出現傷亡'+(g.on?'':'（來不及戴上面具）'),u.x,u.y,u.id);}
    u.mor=clamp(u.mor-(g.on?0.3:1.5)*dt/60,0,100);});
  /* 平民 */if(G.civ&&G.cbx)G.cbx.forEach(function(C){var A=CBA[C.ag];if(A[1]==='c'||A[1]==='r'||A[1]==='m'){var c=C.m/Math.max(0.05,(C.r/400)*(C.r/400));if(c>0.05)civHit(C.x,C.y,C.r,clamp(0.004*c*A[4]*dt/60,0,0.05),'cbrn',C.side,A[4]>0.3?0.6:0.2);}});}
/* 潛伏期滿發病（進入既有的疾病系統）；人傳人的疾病擴散到附近部隊，醫療單位的隔離與疫苗降低傳播 */
function cbInfStep(dt){G.units.forEach(function(u){var g=u.cbg;if(!g||!alive(u))return;if(g.inf&&g.inf.length){var keep=[];g.inf.forEach(function(q){if(G.t>=q.t){if(typeof sickAdd==='function')sickAdd(u,q.n,q.dz);if(!g.sickLog||G.t-g.sickLog>6*3600){g.sickLog=G.t;logE(u.side,'cbrn',uName(u)+'爆發'+(DZ[q.dz]?DZ[q.dz][0]:q.dz)+'（約 '+fmt(q.n)+' 人發病）',u.x,u.y,u.id);}}else keep.push(q);});g.inf=keep;}
    if(g.cont>0.01&&onMap(u)){var P=Math.max(cbProt(u,'must'),cbMopp(u)>=3?0.8:0);var cas=u.men*(1-Math.exp(-g.cont*0.004*dt/60*(1-P)));if(cas>0.01)hit(u,null,cas,0,0.5,'gas');g.cont*=0.998;}});
  G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||!(u.sick>0.5)||!CBC[u.dzk])return;var med=G.units.some(function(q){return q.side===u.side&&onMap(q)&&isLeaf(q)&&ST(q).fl.indexOf('D')>=0&&dist(q.x,q.y,u.x,u.y)<3000;}),beta=0.15*u.sick/Math.max(1,u.men+u.sick)*(u.quar?0.08:med?0.4:1)*dt/3600;
    cbNear(u.x,u.y,1500,function(t){if(t===u||!isLeaf(t)||!onMap(t)||ST(t).dom!=='land'||t.men<1)return;var g=cbGear(t),vx=g.vax[u.dzk],imm=vx!==undefined&&G.t-vx>=((CBVX[u.dzk]||[0,0,7])[2]*86400);var sus2=Math.max(0,t.men-g.inf.reduce(function(a,q){return a+q.n;},0)),n=sus2*beta*(imm?0.05:1)*(t.side===u.side?1:0.5);if(n>0.02)g.inf.push({dz:u.dzk,n:n,t:G.t+(4+4*rnd8())*86400});});
    if(G.civ&&!u.quar&&rnd8()<0.05){var gS=civAt?civAt(u.x,u.y,2000):null;if(gS)civHit(gS.x,gS.y,gS.r||800,0.0005,'dz',-1,0.3);}});}
/* ---------- 施放 ---------- */
/* 砲兵：命令帶毒劑時，每一輪射擊在彈著區產生毒劑雲（毒劑彈的炸藥較少，破片殺傷降為四分之一） */
(function(){var b=artyFire;artyFire=function(u,s,M){var o=u.ord,ag=o&&o.agent&&CBA[o.agent]?o.agent:null;if(!ag||M.kind!=='bombard')return b(u,s,M);var m0=M.mul;M.mul=(m0||1)*0.25;try{b(u,s,M);}finally{M.mul=m0;}
  var vol=Math.max(0.2,Math.sqrt(s.sa||1)*0.25*strFrac(u)),j=M.r*0.6;cbRelease(u.side,ag,M.x+(rnd8()-0.5)*j,M.y+(rnd8()-0.5)*j,vol,Math.max(150,M.r*0.8),u,o.cbLog?'持續施放':'以砲彈施放');o.cbLog=1;u.ammo=Math.max(0,u.ammo-0.4);};})();
/* 飛機：帶毒劑的打擊命令，飛臨目標上空時噴灑或投下毒劑彈（每架次一次） */
function cbAirStep(){G.units.forEach(function(u){var o=u.ord;if(!o||!o.agent||!CBA[o.agent]||o.cbDone||u.st!=='air'||ST(u).dom!=='air')return;if(o.x===undefined||dist(u.x,u.y,o.x,o.y)>1500)return;o.cbDone=1;var n=Math.max(1,u.veh);cbRelease(u.side,o.agent,o.x,o.y,0.6*n,700+n*40,u,'由空中噴灑');});}
/* 工兵：鋼瓶施放（第一次世界大戰的方式）：順風把毒氣雲吹向敵陣 */
function cbCylinder(u,ag,tx,ty){var E=G.env;windInit();var dirT=Math.atan2(ty-u.y,tx-u.x),dd=Math.abs(((dirT-E.wd+3*PI)%(2*PI))-PI);if(dd>PI/3)return {err:'風向不利（目前'+windTxt()+'），毒氣會吹回本方陣地'};if(E.ws<1)return {err:'風力太弱，毒氣會滯留在本方陣地'};
  var fw=frontW(u)||800,nx=-Math.sin(E.wd),ny=Math.cos(E.wd);for(var i=-2;i<=2;i++)cbRelease(u.side,ag,u.x+nx*fw*i/5+Math.cos(E.wd)*200,u.y+ny*fw*i/5+Math.sin(E.wd)*200,1.2,300,u,'以鋼瓶施放');u.fired=G.t;return {ok:1};}
/* 古代：投石機拋射疫屍到城內或敵營 */
function cbCatapult(u,tx,ty){if(dist(u.x,u.y,tx,ty)>(ST(u).ind||400)*1.05)return {err:'超出投射距離'};cbRelease(u.side,'corpse',tx,ty,0.8,200,u,'拋射疫屍');u.fired=G.t;return {ok:1};}
/* 半徑超過快速網格範圍時直接逐一檢查 */
function cbNear(x,y,R,fn){if(R<=GFR&&G._gf){gridNear(x,y,R,fn);return;}G.units.forEach(function(u){if(Math.abs(u.x-x)<=R&&Math.abs(u.y-y)<=R)fn(u);});}
/* ---------- 應對：除污、接種、隔離 ---------- */
function cbDecon(u,x,y,R){R=R||600;var G2=cbGround(),n=0,B=G.map.cs*8;Object.keys(G2).forEach(function(key){var p=key.split('|'),cx=(+p[0]+0.5)*B,cy=(+p[1]+0.5)*B;if(dist(cx,cy,x,y)<=R+B*0.7){G2[key]*=0.5;if(G2[key]<0.01)delete G2[key];n++;}});
  var m=0;cbNear(x,y,R,function(t){if(t.side!==u.side||!t.cbg||dist(t.x,t.y,x,y)>R)return;if(t.cbg.cont>0.01){t.cbg.cont*=0.3;m++;}t.cbg.filt=Math.min(100,t.cbg.filt+40);});return {ground:n,units:m};}
function cbVax(u,dz,R){R=R||4000;var V=CBVX[dz];if(!V)return {err:'沒有這種疫苗'};var y=uEra(u).y;if(dz==='mias'?!uEra(u).fan:y<V[1])return {err:'這個年代還沒有'+V[0]};var n=0;cbNear(u.x,u.y,R,function(t){if(t.side!==u.side||!isLeaf(t)||!alive(t)||dist(t.x,t.y,u.x,u.y)>R)return;var g=cbGear(t);if(g.vax[dz]===undefined){g.vax[dz]=G.t;n++;}});
  logE(u.side,'cbrn',uName(u)+'為附近 '+n+' 個單位接種'+V[0]+'（約 '+V[2]+' 天後產生免疫）',u.x,u.y,u.id);return {n:n};}
/* 工兵、醫療單位就地除污：每 10 分鐘一輪，最多約兩小時；移動時中止 */
function cbDeconStart(u){if(!u||!isLeaf(u)||!onMap(u))return false;u.cbDec={x:u.x,y:u.y,n:0};logE(u.side,'cbrn',uName(u)+'開始就地除污（'+placeTxt(u.x,u.y)+'）',u.x,u.y,u.id);return true;}
function cbOrdStep(){G.units.forEach(function(u){var D=u.cbDec;if(!D||!onMap(u))return;if(dist(u.x,u.y,D.x,D.y)>300){u.cbDec=null;logE(u.side,'cbrn',uName(u)+'離開，除污中止',u.x,u.y,u.id);return;}var r=cbDecon(u,D.x,D.y,700);D.n++;
  if(D.n>=12||r.ground===0&&r.units===0&&D.n>2){u.cbDec=null;logE(u.side,'cbrn',uName(u)+'完成除污',D.x,D.y,u.id);}});}
/* ---------- AI：依政策使用化學武器；受威脅時提高防護等級並除污 ---------- */
function cbPolicy(side){return polSide(side).cbrn||'no';}
function cbAI(){SIDES().forEach(function(side){var S=SD(side);if(!S.ai)return;var used=G.cbUse&&(nSides()<3?G.cbUse[1-side]:Math.max.apply(null,[0].concat(hostSides(side).map(function(h){return G.cbUse[h]||0;})))),pol=cbPolicy(side);
  if(used&&G.t-used<86400&&!S.moppSet&&(S.mopp||0)<2){S.mopp=2;logE(side,'cbrn','敵軍使用了化生放武器：全軍提高防護等級（MOPP 2）');}
  if(!(pol==='yes'||pol==='retal'&&used))return;if(G.t-(S._cbT||-1e9)<3*3600)return;var av=cbAvail(side).filter(function(k){return CBA[k][1]==='c';});if(!av.length)return;var ag=av[av.length-1];
  var C=G.ct[side],best=null,bv=0;for(var id in C){var c=C[id];if(c.dead||G.t-c.t>1800||c.dom!=='land')continue;var v=(c.men||0)*((uById(c.id)||{}).ent>0.5?1.6:1);if(v>bv&&(nSides()<3?enemyNear(1-side,c.x,c.y,2500,'land'):friendNear(side,c.x,c.y,2500))===0){bv=v;best=c;}}if(!best||bv<150)return;
  var A=G.units.filter(function(u){return u.side===side&&isLeaf(u)&&onMap(u)&&aiControls(u)&&(ST(u).ind||0)>0&&dist(u.x,u.y,best.x,best.y)<=(ST(u).ind||0)*0.95&&u.ammo>30;}).slice(0,2);if(!A.length)return;S._cbT=G.t;
  A.forEach(function(u){issue(u,'bombard',{x:best.x,y:best.y,agent:ag,dur:900});});logE(side,'cbrn','指揮部下令以'+CBA[ag][0]+'砲擊'+placeTxt(best.x,best.y)+'的敵軍');});}
(function(){var b=v8Step;v8Step=function(){b();if(!cbOn())return;if(G.step%60===5)windStep();if(G.step%4===2){cbrnStep();cbAirStep();}if(G.step%20===13)cbOrdStep();if(G.step%120===37)cbAI();};})();
/* 防護等級的代價：防護等級 3 以上更容易疲勞（炎熱時加倍），4 級戰鬥力降低 */
(function(){var b=firerMod;firerMod=function(u,s){var f=b(u,s);if(u.cbg&&(u.cbg.on||cbMopp(u)>=4))f*=cbMopp(u)>=4?0.75:0.88;return f;};})();
(function(){var b=v8Step;v8Step=function(){b();if(G.step%20!==3)return;G.units.forEach(function(u){if(!u.cbg||!onMap(u))return;var M=cbMopp(u);if(M>=3||u.cbg.on)u.fat=Math.min(100,u.fat+(M>=4?1.2:0.5)*(G.env.T>25?2:1));});};})();
