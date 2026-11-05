/* ===================== 資源收集與打造器材：伐木、採石、拆解廢鐵；打造木筏、浮橋組件、雲梯、攻城槌、攻城塔、盾車、柴捆、鹿砦、木架便橋、投石機、沙包、石籠
   以及城牆（ft＝6）的攻防：攻城器具降低城牆與堡壘的防護、攻城砲與投石機可轟開缺口 ===================== */
var RESN={wood:'木材',stone:'石料',metal:'金屬'};
/* 器材：名稱、木、石、金屬（公噸）、工時（人時）、說明 */
var KIT={raft:['木筏',1.5,0,0,20,'每具可載約 10 人；三具以上即可在小河、河流設置木筏渡口'],
  pont:['浮橋組件',30,5,1,600,'每組可架約 40 公尺：小河一組、河流三組、大河八組；任何部隊都能據此架設浮橋'],
  trestle:['木架便橋',20,2,0.3,400,'在小溪或小河上架設固定木橋'],
  ladder:['雲梯',0.3,0,0,8,'攀登城牆與堡壘；每 20 人一具效果最佳'],
  ram:['攻城槌（附掩護棚）',5,0,0.5,120,'撞開城門，削弱城牆與堡壘防護'],
  tower:['攻城塔',30,0,2,800,'越過城牆的掩護塔，大幅削弱城牆防護'],
  mantlet:['盾車與大木盾',1,0,0,15,'接近敵陣時減少直射傷亡（只對 1900 年前的火器有效）'],
  fascine:['柴捆與土籃',2,0,0,20,'填平壕溝、越過障礙；開闢通路與強攻更快'],
  abatis:['鹿砦與路障',3,0,0,30,'在目標地點砍樹布設障礙（相當於鐵絲網）'],
  treb:['投石機',15,0,0.5,300,'拋射石彈轟擊城牆（火藥時代以前或奇幻戰場）'],
  sandbag:['沙包',0,0,0,10,'一批約百袋，構築陣地加快三成'],
  gabion:['石籠',0,10,0.2,40,'構築半永久工事與堡壘加快三成']};
/* 地表可收集的資源與倍率 */
function resAt(k){var c=G.map.lc[k],L=LCI,o={wood:0,stone:0,metal:0};if(c===L.dfor||c===L.cfor||c===L.jung)o.wood=1;else if(c===L.orch||c===L.hedge||c===L.scrub)o.wood=0.4;else if(c===L.vill||c===L.town)o.wood=0.2;
  if(c===L.rock)o.stone=1;else if(c===L.rubble){o.stone=1;o.metal=0.4;o.wood=0.15;}else if(c===L.city||c===L.town||c===L.vill)o.stone=0.4;else if(slopeArr()[k]>22)o.stone=0.6;if(c===L.ind)o.metal=0.4;if(G.map.rl[k]&1)o.metal=Math.max(o.metal,0.6);return o;}
function gatherRate(u,rk){var y=uEra(u).y,base={wood:y<1900?0.04:y<1950?0.06:0.12,stone:y<1900?0.02:y<1950?0.03:0.05,metal:y<1900?0.005:y<1950?0.01:0.02}[rk],s=ST(u),m=mixX(u,'gat')||(isEng(u)?1.5:s.fl.indexOf('f')>=0?1.4:0.7);return base*m*(s.veh>0&&s.mobi>=2?1.3:1);}
function resCap(u){var s=ST(u),y=uEra(u).y;return u.men*0.04+u.veh*(s.mobi>=3?4:1);}
function resTot(u){var r=u.res||{};return (r.wood||0)+(r.stone||0)+(r.metal||0);}
function kitN(u,k){return (u.kit&&u.kit[k])||0;}
function kitTxt(u){var o=[],r=u.res||{};['wood','stone','metal'].forEach(function(k){if(r[k]>0.05)o.push(RESN[k]+' '+fx(r[k],1)+' 噸');});var K=u.kit||{};for(var k in K)if(K[k]>0)o.push(KIT[k][0]+' ×'+fmt(K[k]));return o.join('、');}
/* ---------- 命令：收集、打造（由 v4Act 與 v4Leaf 呼叫） ---------- */
function resAct(u,o){var s=ST(u),k=o.k;if(k!=='gather'&&k!=='craft')return false;if(s.dom!=='land'){u.task='hold';return true;}if(o.x===undefined){o.x=u.x;o.y=u.y;}
  if(k==='gather'){/* 找附近有該資源的地點 */var rk=(o.opt&&o.opt.rk)||o.rk||'auto',best=null,bv=0,MP=G.map,R=Math.ceil(1500/MP.cs);brushCells(MP,o.x/MP.cs,o.y/MP.cs,R,function(q){var a=resAt(q),v=rk==='auto'?a.wood+a.stone*0.8+a.metal*0.5:a[rk];v*=1-((G.resH&&G.resH[q])||0)/60;if(v>bv+0.05*rnd()){bv=v;best=q;}});
    if(!best||bv<=0.05){logE(u.side,'res',uName(u)+'：目標附近沒有可收集的'+(rk==='auto'?'資源':RESN[rk]),u.x,u.y,u.id);u.task='hold';return true;}var p=cellXY(best);o.wx=p[0];o.wy=p[1];o.rk=rk;o.cell=best;}
  else{o.wx=o.x;o.wy=o.y;o.ck=(o.opt&&o.opt.ck)||o.ck||'ladder';o.n=Math.max(1,(o.opt&&o.opt.n)||o.n||1);}
  o.ph='go';var vp=validPos(s,o.wx,o.wy);if(dist(u.x,u.y,vp[0],vp[1])<250)u.task='at';else{u.task='go';wantPath(u,vp[0],vp[1]);}return true;}
function resLeaf(u,s){var o=u.ord;if(!o||(o.k!=='gather'&&o.k!=='craft')||!o.ph)return false;
  if(o.ph==='go'){if(u.task==='go'&&(u.path||u.pq))return false;o.ph='work';u.task='work2';u.path=null;o.done=0;if(o.k==='craft'){var K=KIT[o.ck];if(!K){u.task='hold';return true;}var ok=craftOK(u,o.ck,o.n);if(ok<1){logE(u.side,'res',uName(u)+'材料不足，無法打造'+K[0]+'（需要'+craftNeedTxt(o.ck,o.n)+'）',u.x,u.y,u.id);u.task='hold';o.ph='';return true;}o.n=ok;}
    logE(u.side,'res',uName(u)+(o.k==='gather'?'開始收集'+(o.rk==='auto'?'木石材料':RESN[o.rk]):'開始打造 '+o.n+' '+(KIT[o.ck]||['器材'])[0]),u.x,u.y,u.id);return true;}
  if(o.ph!=='work')return false;var uf=G.t-(u.uf||-1e9)<120,eff=DT/3600*u.men*(uf?0.2:1)*(u.fat>70?0.6:1)*(G.env.light<0.3?0.6:1)*(u.labT>G.t?1.3:1);u.fat=clamp(u.fat+0.03,0,100);
  if(o.k==='gather'){var a=resAt(o.cell),rk=o.rk==='auto'?(a.wood>=a.stone&&a.wood>=a.metal?'wood':a.stone>=a.metal?'stone':'metal'):o.rk,gain=eff*gatherRate(u,rk)*Math.max(0.05,a[rk]);u.res=u.res||{wood:0,stone:0,metal:0};var room=resCap(u)-resTot(u);gain=Math.min(gain,room);if(gain>0){u.res[rk]+=gain;G.resH=G.resH||{};G.resH[o.cell]=(G.resH[o.cell]||0)+gain;resDeplete(o.cell,u);}
    if(room<=0.01||G.resH[o.cell]>=60){var more=room>0.01;if(more){var MP=G.map,b=-1,bv=0;brushCells(MP,o.wx/MP.cs,o.wy/MP.cs,Math.ceil(800/MP.cs),function(q){var v=resAt(q)[rk]*(1-((G.resH[q]||0)/60));if(v>bv){bv=v;b=q;}});if(b>=0&&bv>0.05){o.cell=b;var p=cellXY(b);o.wx=p[0];o.wy=p[1];return true;}}
      o.ph='';o.st='done';u.task='hold';logE(u.side,'res',uName(u)+'收集完成：'+kitTxt(u),u.x,u.y,u.id);}return true;}
  /* 打造 */var K=KIT[o.ck];o.done+=eff;if(o.done>=K[4]*o.n){u.res=u.res||{wood:0,stone:0,metal:0};u.res.wood-=K[1]*o.n;u.res.stone-=K[2]*o.n;u.res.metal-=K[3]*o.n;['wood','stone','metal'].forEach(function(r){if(u.res[r]<0)u.res[r]=0;});u.kit=u.kit||{};
    if(o.ck==='abatis'){abatisPlace(u,o);}else if(o.ck==='trestle'){var q=riverNear(o.x,o.y,1200);if(q&&q.c<=2){q.bt='fixed';buildBridge(q,u);}else{u.kit.trestle=(u.kit.trestle||0)+o.n;}}else u.kit[o.ck]=(u.kit[o.ck]||0)+o.n;
    o.ph='';o.st='done';u.task='hold';logE(u.side,'res',uName(u)+'打造完成：'+K[0]+' ×'+o.n,u.x,u.y,u.id);}return true;}
function craftOK(u,ck,n){var K=KIT[ck],r=u.res||{},m=n;if(K[1]>0)m=Math.min(m,Math.floor((r.wood||0)/K[1]+1e-6));if(K[2]>0)m=Math.min(m,Math.floor((r.stone||0)/K[2]+1e-6));if(K[3]>0)m=Math.min(m,Math.floor((r.metal||0)/K[3]+1e-6));if(ck==='sandbag'&&uEra(u).y<1700)return 0;return m;}
function craftNeedTxt(ck,n){var K=KIT[ck],o=[];if(K[1])o.push('木材 '+fx(K[1]*n,1)+' 噸');if(K[2])o.push('石料 '+fx(K[2]*n,1)+' 噸');if(K[3])o.push('金屬 '+fx(K[3]*n,1)+' 噸');return o.join('、')||'人力';}
/* 森林被砍伐後變成灌叢；有人居住的城鎮被拆屋取材會造成財產損失 */
function resDeplete(k,u){var MP=G.map,h=G.resH[k],c=MP.lc[k];if(h>=45&&(c===LCI.dfor||c===LCI.cfor||c===LCI.jung)){MP.lc[k]=LCI.scrub;mapChanged([k]);}
  if(G.civ&&(c===LCI.vill||c===LCI.town||c===LCI.city)&&rnd()<0.02){civProp(k,0.02,'loot',u.side);var g=civNearSet(u);if(g&&g.loy!==u.side)g.unrest=clamp(g.unrest+1,0,100);}}
function abatisPlace(u,o){var MP=G.map,ks=[],face=o.face!==undefined?o.face:(function(){var ec=enemyCentroid(u.side,o.x,o.y,20000);return ec?Math.atan2(ec[1]-o.y,ec[0]-o.x):homeDir(u.side)+PI;})(),lx=-Math.sin(face),ly=Math.cos(face),W=120*o.n;
  for(var t=-W/2;t<=W/2;t+=MP.cs*0.6){var k=cellAt(o.x+lx*t,o.y+ly*t);if(!isWater(MP.lc[k])&&!MP.ft[k]){MP.ft[k]=2;ks.push(k);}}if(ks.length)mapChanged(ks);}
/* ---------- 城牆與攻城 ---------- */
/* 防禦方在工事格的突擊防禦倍率（含城牆），攻方器材可降低 */
function ftAsl(k,u){var f=G.map.ft[k],m=f===4?2:f===5?2.6:f===6?2.8:1;if(m>1&&u){var fac=siegeMul(u,f);m=1+(m-1)*fac;}return m;}
function siegeMul(u,f){if(!u.kit)return 1;var men=Math.max(1,u.men),m=1,K=u.kit;if(K.ladder>0)m*=1-0.35*Math.min(1,K.ladder*20/men);if(K.ram>0&&(f===6||f===4))m*=0.75;if(K.tower>0&&f>=5)m*=0.6;if(K.fascine>0)m*=0.9;return Math.max(0.35,m);}
/* 突擊時器材消耗（雲梯折損、攻城槌與攻城塔被焚毀） */
function siegeUse(u,k){if(!u.kit)return;var f=G.map.ft[k];if(f<4)return;var K=u.kit;if(K.ladder>0)K.ladder=Math.max(0,K.ladder-Math.max(1,K.ladder*0.05));if(K.ram>0&&rnd()<0.04)K.ram--;if(K.tower>0&&rnd()<0.03){K.tower--;logE(u.side,'res',uName(u)+'的攻城塔被敵軍焚毀',u.x,u.y,u.id);}if(K.fascine>0&&rnd()<0.1)K.fascine--;}
/* 攻城砲、重砲與投石機轟擊城牆與堡壘：累積損毀後打開缺口（變成廢墟、可通行） */
function wallHit(u,s,x,y,R){var MP=G.map,heavy=s.fl.indexOf('X')>=0?1:(s.ind>=8000||s.rM>=1500)&&s.sa>=8?0.35:0.08;if(heavy<0.1&&!(u.kit&&u.kit.treb>0))return;var D=dmgArr(),ks=[];
  for(var i=0;i<3;i++){var a=rnd()*2*PI,r=Math.sqrt(rnd())*R,k=cellAt(x+Math.cos(a)*r,y+Math.sin(a)*r),f=MP.ft[k];if(f<4)continue;var v=D[k]+heavy*(f===6?8:f===5?6:10)*(0.5+rnd());if(v>=200){MP.ft[k]=0;MP.lc[k]=isUrban(MP.lc[k])?LCI.rubble:MP.lc[k];D[k]=0;ks.push(k);}else D[k]=v;}
  if(ks.length){mapChanged(ks);if(!u.brLog||G.t-u.brLog>1800){u.brLog=G.t;logE(u.side,'eng',uName(u)+'在'+placeTxt(x,y)+'轟開城牆或堡壘缺口',x,y,u.id);}}}
/* 投石機：每 10 分鐘轟擊 400 公尺內的城牆 */
function trebStep(){G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||!(kitN(u,'treb')>0))return;var MP=G.map,best=-1,bd=1e9;brushCells(MP,u.x/MP.cs,u.y/MP.cs,Math.ceil(400/MP.cs),function(k){if(MP.ft[k]>=5){var p=cellXY(k),d=dist(p[0],p[1],u.x,u.y);if(d<bd){bd=d;best=k;}}});if(best<0)return;var p=cellXY(best);for(var i=0;i<kitN(u,'treb');i++)wallHit(u,{fl:'X',ind:0,rM:0,sa:0},p[0],p[1],60);});}
/* 攻城砲（直射、X 旗標）：架設後每 10 分鐘轟擊射程內敵方據守的城牆與堡壘，城內平民也會受波及 */
function sgDirect(s){return s.fl.indexOf('X')>=0&&!(s.ind>0)&&s.dom==='land';}
function sgStep(){var MP=G.map;G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||u.ms==='rout'||u.ammo<=0||u.men<5)return;var s=ST(u);if(!sgDirect(s)||u.task==='go'||u.path||u.formTo)return;
  var R=Math.min(s.rM||800,1600),o=u.ord,tx=o&&o.x!==undefined?o.x:null,ty=o&&o.y!==undefined?o.y:null,best=-1,bd=1e18;
  brushCells(MP,u.x/MP.cs,u.y/MP.cs,Math.ceil(R/MP.cs),function(k){if(MP.ft[k]<4)return;var p=cellXY(k),d=dist(p[0],p[1],u.x,u.y);if(d>R)return;var sc=d+(tx!==null?dist(p[0],p[1],tx,ty)*0.5:0);if(sc<bd){bd=sc;best=k;}});
  if(best<0)return;var p=cellXY(best),en=enemyOf(u.side);if(enemyNear(u.side,p[0],p[1],1500)===0&&!(G.obj||[]).some(function(q){return (nSides()<3?q.own===en:hostile(u.side,q.own))&&dist(q.x,q.y,p[0],p[1])<Math.max(2000,obR(q)*2.5);}))return;
  var n=Math.max(1,Math.round((u.veh||1)*strFrac(u)));for(var i=0;i<n;i++)wallHit(u,s,p[0],p[1],80);u.ammo=Math.max(0,u.ammo-1.5);u.fired=G.t;u.lastArt=G.t;
  if(!u.sgLog||G.t-u.sgLog>3600){u.sgLog=G.t;logE(u.side,'arty',uName(u)+'以攻城砲轟擊'+placeTxt(p[0],p[1])+'的城牆與工事',p[0],p[1],u.id);}
  if(G.civ&&rnd()<0.35)civHit(p[0]+(rnd()-0.5)*400,p[1]+(rnd()-0.5)*400,250,0.0003*n,'art',u.side);});}
/* 攻城砲的砲擊點：沿著射線找到第一段城牆或堡壘（不進入城內） */
function sgAim(u,x,y){var MP=G.map,d=dist(u.x,u.y,x,y),n=Math.max(2,Math.ceil(d/(MP.cs*0.8)));for(var i=1;i<=n;i++){var px=u.x+(x-u.x)*i/n,py=u.y+(y-u.y)*i/n;if(MP.ft[cellAt(px,py)]>=5)return [px,py];}return [x,y];}
/* 葉單位攜帶的器材對移動的影響：攻城塔很慢；越過城牆格需要雲梯或攻城塔 */
function kitSpeed(u,s){var f=1;if(kitN(u,'tower')>0)f*=0.35;else if(kitN(u,'ram')>0||kitN(u,'treb')>0)f*=0.6;if(G.map.ft[cellAt(u.x,u.y)]===6)f*=kitN(u,'tower')>0?4:kitN(u,'ladder')>0?3:1;return f;}
/* 盾車：接近敵陣時減少直射傷亡（1900 年前） */
function mantletF(t){if(!t.kit||!(t.kit.mantlet>0)||G.set.y>=1900)return 1;var o=t.ord;if(!o||!/attack|storm|breakthrough/.test(o.k))return 1;return 1-0.3*Math.min(1,t.kit.mantlet*30/Math.max(1,t.men));}
/* 浮橋組件：任何部隊都可架橋（需要的組數依河寬） */
function pontNeed(c){return [0,1,1,3,8][clamp(c||2,0,4)];}
function canKitBridge(u){return kitN(u,'pont')>0||kitN(u,'trestle')>0;}
/* 木筏渡口：三具以上 */
function canRaft(u){return kitN(u,'raft')>=3;}
/* ---------- v4 命令的分派（由 activate 與 leafStep 呼叫） ---------- */
function v4Act(u,o){var k=o.k;if(k==='gather'||k==='craft')return resAct(u,o);
  if(k==='persuade'){var s=ST(u),R=s.fl.indexOf('k')>=0?2500:1000;if(o.x===undefined){u.task='hold';return true;}var d=dist(u.x,u.y,o.x,o.y);if(d<=R*0.85){u.task='hold';u.path=null;return true;}var a=Math.atan2(u.y-o.y,u.x-o.x),p=validPos(s,o.x+Math.cos(a)*R*0.7,o.y+Math.sin(a)*R*0.7);u.task='go';wantPath(u,p[0],p[1]);return true;}
  return false;}
function v4Leaf(u,s){if(resLeaf(u,s))return true;var o=u.ord;if(o&&o.k==='persuade'&&u.task==='at'){u.task='hold';}return false;}
/* 沙包與石籠加快構築（並消耗） */
function kitBuildF(u,bk){if(!u.kit)return 1;if(bk==='pos'&&u.kit.sandbag>0){u.kit.sandbag--;return 1.3;}if((bk==='semi'||bk==='fort'||bk==='bastion')&&u.kit.gabion>0){u.kit.gabion--;return 1.3;}return 1;}
