/* ===================== 堤壩與決堤（以水代兵） =====================
   沿大河的低窪地有防洪堤，1900 年以後河谷收窄處可能有水壩。工兵可以奉命爆破決堤（更早的年代靠人力掘開）：
   河水或水庫的水沖進低地，幾小時內淹沒道路、田野與村莊：部隊被沖散、車輛泡水，居民大量溺斃、流離失所，浮橋與便橋被沖走。
   堤防的決口會一直進水，直到工兵堵口；水庫放空後水才慢慢退去。退水後道路受損、低地成為沼澤。
   以水代兵是最具毀滅性的決策之一：1938 年花園口決堤遲滯了日軍，卻造成數十萬平民死亡、數百萬人流離失所；
   1977 年日內瓦公約第一附加議定書第 56 條禁止攻擊含有危險力量的工程與設施（堤壩、核電廠）。
   淹水範圍與既有的河川洪水合併在同一張淹水圖（G.evt.fl），尋路、涉水、部隊撤往高處、存檔與聯機都沿用。 */
function damOn(){return !!G&&G.set.dam!==false;}
function damL(){return G.dams||(G.dams=[]);}
function damById(id){var L=damL();for(var i=0;i<L.length;i++)if(L[i].id===id)return L[i];return null;}
var DAMK={levee:['堤防','沿河的防洪堤，保護後方的低地'],dam:['水壩','攔河的水壩，後面是水庫']};
/* 地點：大河邊低窪地最大的兩段堤防；1900 年後再找一處河谷收窄、兩側高起的地方築壩 */
function damGen(){var MP=G.map,GW=MP.GW,GH=MP.GH,cs=MP.cs,el=MP.el,rv=MP.rv,L=damL();if(L.length||!rv)return;var st=Math.max(1,Math.round(400/cs)),R=Math.round(3000/cs),C=[];
  for(var y=st;y<GH-st;y+=st)for(var x=st;x<GW-st;x+=st){var k=y*GW+x;if(!(rv[k]>=2||MP.lc[k]===LCI.riv))continue;var e0=el[k],low=0,hi=0;
    for(var dy=-R;dy<=R;dy+=4)for(var dx=-R;dx<=R;dx+=4){var X=x+dx,Y=y+dy;if(X<0||Y<0||X>=GW||Y>=GH)continue;var q=Y*GW+X;if(isWater(MP.lc[q]))continue;var de=el[q]-e0;if(de<3)low++;if(Math.abs(dx)<=Math.round(800/cs)&&Math.abs(dy)<=Math.round(800/cs)&&de>40)hi++;}
    C.push({k:k,x:(x+0.5)*cs,y:(y+0.5)*cs,low:low,hi:hi,el:e0});}
  if(!C.length)return;var pick=function(L2,n,minD){var out=[];L2.forEach(function(c){if(out.length<n&&out.every(function(o){return dist(o.x,o.y,c.x,c.y)>=minD;}))out.push(c);});return out;};
  var lev=pick(C.filter(function(c){return c.low>=40;}).sort(function(a,b){return b.low-a.low;}),2,6000);lev.forEach(function(c){damAdd('levee',c);});
  if((G.set.y||1943)>=1900){var dv=C.filter(function(c){return c.hi>=6&&c.low>=15;}).sort(function(a,b){return b.hi-a.hi||b.el-a.el;});var d0=dv.filter(function(c){return lev.every(function(o){return dist(o.x,o.y,c.x,c.y)>=5000;});})[0];if(d0)damAdd('dam',d0);}}
function damAdd(k,c){var g=typeof evdNearSet==='function'?evdNearSet(c.x,c.y,9000):null,d={id:(G.damSeq=(G.damSeq||0)+1),k:k,x:c.x,y:c.y,c:c.k,el:c.el,n:(g?g.n:placeTxt(c.x,c.y))+(k==='dam'?'水壩':'段堤防'),st:'ok',dead:0,ref:0};damL().push(d);return d;}
/* ---------- 決堤 ---------- */
function damHmax(d){return d.k==='dam'?12:3.5;}
function damRmax(d){return d.k==='dam'?15000:12000;}
/* 從決口往外、比決口高不到 H 公尺的陸地（廣度優先，記住格數距離） */
/* 計算用的大陣列放在模組快取（不進存檔）：換了一場作戰就清掉 */
var DAMC={g:null,m:{}};function damC(d){if(DAMC.g!==G){DAMC.g=G;DAMC.m={};}return DAMC.m[d.id]||(DAMC.m[d.id]={});}
function damField(d){var Cc=damC(d);if(Cc.D)return Cc.D;var MP=G.map,GW=MP.GW,GH=MP.GH,N=GW*GH,el=MP.el,lim=d.el+damHmax(d)+0.5,Rc=Math.ceil(damRmax(d)/MP.cs),D=new Uint16Array(N).fill(65535),Q=new Int32Array(N),h=0,t=0;
  D[d.c]=0;Q[t++]=d.c;while(h<t){var k=Q[h++],x=k%GW,y=(k-x)/GW,dk=D[k];if(dk>=Rc)continue;for(var i=0;i<4;i++){var X=x+(i===0?1:i===1?-1:0),Y=y+(i===2?1:i===3?-1:0);if(X<0||Y<0||X>=GW||Y>=GH)continue;var q=Y*GW+X;if(D[q]!==65535||el[q]>lim)continue;D[q]=dk+1;Q[t++]=q;}}
  Cc.D=D;return D;}
/* 水位：堤防決口持續進水（堵口後一天內退去）；水壩一兩小時內沖到最高，之後隨水庫放空慢慢退 */
function damH(d){var t=(G.t-d.bt)/3600,H=damHmax(d);if(d.k==='dam')return H*Math.min(1,t/1)*Math.exp(-Math.max(0,t-2)/36);var r=H*Math.min(1,t/6);if(d.st==='fixed')r*=Math.exp(-(G.t-d.ft)/3600/18);return r;}
function damR(d){return Math.min(damRmax(d),(d.k==='dam'?6000:2500)*(G.t-d.bt)/3600+300);}
function damRefuse(u){var L=clamp(polOf(u,'civ'),0,5),p=[0.85,0.65,0.4,0.15,0.05,0][L]*((G.set.y||1943)>=1977?1:(G.set.y||1943)>=1899?0.8:0.6)*(u.dis===undefined?1:u.dis>60?1.15:u.dis<35?0.7:1);
  if(rnd()<p){logE(u.side,'eng',uName(u)+'拒絕執行決堤的命令（官兵不願淹死下游的百姓）',u.x,u.y,u.id);if(typeof decLog==='function')decLog(u.side,uName(u),'拒絕執行決堤的命令');return true;}return false;}
function damBreach(d,u){var side=u?u.side:-1;d.st='breach';d.bt=G.t;d.by=side;d.byn=u?uName(u):'';d.hitS={};d.hitU={};damC(d).pk=null;var txt=(u?uName(u)+'奉命':'')+'炸開'+d.n+'：'+(d.k==='dam'?'水庫的水奔騰而下':'河水從決口沖進低地')+'，下游一片汪洋';
  logE(side,'eng','⚠ '+txt,d.x,d.y,u?u.id:0);if(side>=0)logE(enemyOf(side),'evt','⚠ '+d.n+'決堤，洪水沖向下游的低地',d.x,d.y);
  if(u&&G.civ){var e=civEv('crime',side,txt,d.x,d.y,u.id,{dk:'dam',v:0,ord:true,wc:1});var w=warCrime(u,'dam',0,txt,true);d.wi=G.civ.wc.indexOf(w);if(G.press)pressOn(e,u);}
  if(typeof decLog==='function'&&u)decLog(side,uName(u),'爆破'+d.n+'，以水代兵',{crime:1});if(G.onPause&&apOn('crime'))G.onPause(d.n+'決堤');damStep(true);}
/* 每 10 分鐘：重算淹水範圍、合併到淹水圖；新淹到的村莊與部隊 */
function damStep(force){var L=damL().filter(function(d){return d.st==='breach'||d.st==='fixed';});var MP=G.map,N=MP.GW*MP.GH;
  if(!L.length){if(G._flMerged&&G.evt&&G.evt.fl===G._flMerged){G.evt.fl=G._flBase||null;G._flMerged=null;G.evt.fv=(G.evt.fv||0)+1;mapChangedSoft();}return;}
  G.evt=G.evt||{};if(G.evt.fl!==G._flMerged)G._flBase=G.evt.fl||null;var B=new Uint8Array(N),base=G._flBase,el=MP.el,cs=MP.cs,any=0;
  L.forEach(function(d){var D=damField(d),H=damH(d),Rc=damR(d)/cs,Cc=damC(d),PK=Cc.pk||(Cc.pk=new Uint8Array(N)),cnt=0;if(H<0.1&&(d.st==='fixed'||d.k==='dam')&&G.t-d.bt>3*3600){damEnd(d);return;}
    for(var k=0;k<N;k++){var dk=D[k];if(dk===65535||dk>Rc)continue;var dp=H-(el[k]-d.el)-dk*cs/1000*0.25;if(dp<=0.05)continue;var v=Math.min(255,Math.round(dp*10));if(v>B[k])B[k]=v;if(v>PK[k])PK[k]=v;cnt++;}d.area=cnt*cs*cs/1e6;d.amax=Math.max(d.amax||0,d.area);any+=cnt;
    /* 村莊：第一次淹到時溺斃與逃難；事先有警報的少死很多 */if(G.civ)G.civ.S.forEach(function(g){if(d.hitS[g.i])return;var k=cellAt(g.x,g.y),v=B[k];if(v<4)return;d.hitS[g.i]=G.t;var pr=civPresent(g);if(pr<1)return;var dp=v/10,f=clamp(0.02+0.06*dp,0.02,0.4)*(g.alarm>0.5?0.35:1)*(d.k==='dam'?1.4:1),dd=pr*f;
      civCas(g,dd,0.85,'flood',d.by);d.dead+=dd;g.loss=(g.loss||0)+(g.val0||0)*0.5;g.food=0;g.unrest=100;g.alarm=1;if(d.by>=0)attAdd(g,d.by,-60);if(civPresent(g)>20)refSpawn(g,civPresent(g)*0.7);d.ref+=pr-dd;
      logE(-1,'evt','洪水淹沒'+g.n+'，約 '+fmt(dd)+' 人溺斃，倖存者攀上屋頂與高地',g.x,g.y);});
    /* 部隊：山洪突至，第一次被淹到的部隊有人被沖走（之後依水深撤往高處，由洪水撤離處理） */G.units.forEach(function(u){if(d.hitU[u.id]||!isLeaf(u)||!onMap(u)||ST(u).dom!=='land'||u.st==='lift')return;var v=B[cellAt(u.x,u.y)];if(v<8)return;d.hitU[u.id]=1;u.flC=(u.flC||0)+1;var dp=v/10;
      hit(u,null,u.men*Math.min(0.12,0.015*dp*(d.k==='dam'?2:1)),u.veh*Math.min(0.5,0.06*dp),25,'storm');u.mor=clamp(u.mor-6,0,100);if(typeof fearAdd==='function')fearAdd(u,10,'storm');});
    if(G.civ&&d.wi>=0){var W=G.civ.wc[d.wi];if(W)W.v=Math.round(d.dead);}});
  if(base)for(var k=0;k<N;k++)if(base[k]>B[k])B[k]=base[k];var prev=G._flMerged,ch=!prev||force;if(!ch){var dn=0;for(var i=0;i<N;i+=7)if((prev[i]>0)!==(B[i]>0))dn++;ch=dn>0;}
  G._flMerged=B;G.evt.fl=B;if(ch){G.evt.fv=(G.evt.fv||0)+1;mapChangedSoft();damBridges(B);}}
/* 被淹到的浮橋、便橋沖走；水壩潰決時連永久橋梁也可能沖毀 */
function damBridges(B){var MP=G.map,lost=MP.brg.filter(function(q){var k=q.y*MP.GW+q.x,v=B[k]||0;if(!v)return false;if(q.t==='f'||q.t==='a'||q.t==='e')return v>=10;return v>=60&&(hstr('brg|'+k)%3===0);});if(!lost.length)return;
  lost.forEach(function(q){var k=q.y*MP.GW+q.x;MP.rd[k]=0;MP.rl[k]=0;});MP.brg=MP.brg.filter(function(q){return lost.indexOf(q)<0;});mapChanged(lost.map(function(q){return q.y*MP.GW+q.x;}));logE(-1,'evt','決堤的洪水沖毀 '+lost.length+' 座橋梁');}
/* 水退：道路泡水受損，低地成為沼澤 */
function damEnd(d){d.st=d.st==='fixed'?'closed':'drained';d.et=G.t;var MP=G.map,Cc=damC(d),PK=Cc.pk,N=MP.GW*MP.GH,ks=[],nd=0;if(PK){if(!G.rdd||G.rdd.length!==N)G.rdd=new Uint8Array(N);var soft={};['field','mead','hedge','orch','scrub'].forEach(function(id){soft[LCI[id]]=1;});
    for(var k=0;k<N;k++){var v=PK[k];if(!v)continue;if(v>=10&&MP.rd[k]){G.rdd[k]=Math.max(G.rdd[k],200);nd++;}if(v>=20&&soft[MP.lc[k]]&&!MP.rd[k]&&!MP.rl[k]&&(Math.imul(k,2246822519)>>>0)%100<45){MP.lc[k]=LCI.marsh;ks.push(k);}}}
  Cc.pk=null;Cc.D=null;if(ks.length){mapChanged(ks);G._fp=null;}logE(-1,'evt',d.n+'的洪水退去：約 '+fmt(nd*MP.cs/1000,1)+' 公里道路泡水受損'+(ks.length?'，'+fmt(ks.length*MP.cs*MP.cs/1e6,1)+' 平方公里低地成為沼澤':'')+(d.dead>=1?'。洪水共奪走約 '+fmt(d.dead)+' 名平民的性命':''),d.x,d.y);}
/* 下游會淹到哪裡：估計面積與受威脅的村莊人口 */
function damRisk(d){var D=damField(d),MP=G.map,cs=MP.cs,H=damHmax(d),el=MP.el,R=damRmax(d)/cs,n=0,pop=0,vil=0;for(var k=0;k<D.length;k++){var dk=D[k];if(dk===65535||dk>R)continue;if(H-(el[k]-d.el)-dk*cs/1000*0.25>0.3)n++;}
  if(G.civ)G.civ.S.forEach(function(g){var dk=D[cellAt(g.x,g.y)];if(dk===65535||dk>R)return;if(H-(el[cellAt(g.x,g.y)]-d.el)-dk*cs/1000*0.25>0.3){vil++;pop+=civPresent(g);}});return {km2:n*cs*cs/1e6,vil:vil,pop:pop};}
/* ---------- 命令：爆破決堤、堵口 ---------- */
Object.assign(ORDN,{dam:'堤壩'});var DAMA={blow:['爆破決堤'],fix:['堵口']};
function damNeed(d,u,a){if(a==='fix')return 24*3600*(isEng(u)?1:2.5);var y=G.set.y||1943,base=d.k==='dam'?6*3600:2*3600;return base*(y<1850?4:1)*(isEng(u)?1:3);}
function damAct(u,o){var d=damById(o.opt&&o.opt.id),a=o.opt&&o.opt.act;if(!d||!DAMA[a]||!damOn()){u.ord=null;u.task='hold';return true;}
  if(a==='blow'&&d.st!=='ok'||a==='fix'&&!(d.st==='breach'&&d.k==='levee')){logE(u.side,'eng',uName(u)+'：'+d.n+(a==='blow'?'已經決堤':'不需要堵口'),u.x,u.y,u.id);u.ord=null;u.task='hold';return true;}
  if(d.k==='dam'&&!isEng(u)){logE(u.side,'eng',uName(u)+'不是工兵，無法爆破水壩',u.x,u.y,u.id);u.ord=null;u.task='hold';return true;}
  if(a==='blow'&&damRefuse(u)){u.ord=null;u.task='hold';return true;}
  o.ph='go';var p=validPos(ST(u),d.x,d.y);if(dist(u.x,u.y,p[0],p[1])<300){u.task='at';u.path=null;}else{u.task='go';wantPath(u,p[0],p[1]);}return true;}
function damLeaf(u,s,o){var d=damById(o.opt.id),a=o.opt.act;if(!d){u.ord=null;u.task='hold';return true;}
  if(o.ph==='go'){if(dist(u.x,u.y,d.x,d.y)>500){if((G.step+u.id)%6===0&&!u.path){var p=validPos(s,d.x,d.y);u.task='go';wantPath(u,p[0],p[1]);}return false;}o.ph='work';o.t1=G.t;u.task='work2';u.path=null;
    logE(u.side,'eng',uName(u)+(a==='blow'?'開始在'+d.n+'埋設炸藥、掘開堤身':'開始堵塞'+d.n+'的決口'),u.x,u.y,u.id);return true;}
  if(o.ph==='work'){if(a==='blow'&&d.st!=='ok'||a==='fix'&&d.st!=='breach'){u.ord=null;u.task='hold';return true;}if(G.t-o.t1<damNeed(d,u,a))return true;
    if(a==='blow')damBreach(d,u);else{d.st='fixed';d.ft=G.t;logE(u.side,'eng',uName(u)+'堵住了'+d.n+'的決口，洪水開始退去',d.x,d.y,u.id);}u.ord=null;u.task='hold';return true;}return false;}
(function(){var b=v4Act;v4Act=function(u,o){if(o.k==='dam')return damAct(u,o);return b(u,o);};})();
(function(){var b=v4Leaf;v4Leaf=function(u,s){var o=u.ord;if(o&&o.k==='dam'&&o.opt)return damLeaf(u,s,o);return b(u,s);};})();
/* ---------- AI：形勢危急、敵軍就在堤防保護的低地上，極端政策的一方可能決堤 ---------- */
function damAI(){if(!damOn())return;SIDES().forEach(function(side){var S=SD(side);if(!S||!S.ai||polSide(side).civ<3)return;var mine=0,theirs=0;G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u))return;if(u.side===side)mine+=u.men+u.veh*8;else if(nSides()<3?u.side===enemyOf(side):hostile(side,u.side))theirs+=u.men+u.veh*8;});if(!(theirs>mine*1.6))return;
  damL().forEach(function(d){if(d.st!=='ok')return;var D=damField(d),cs=G.map.cs,en=0,own=0;G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||ST(u).dom!=='land')return;var dk=D[cellAt(u.x,u.y)];if(dk===65535||dk*cs>damRmax(d)*0.8)return;if(u.side===side)own+=u.men;else if(nSides()<3?u.side===enemyOf(side):hostile(side,u.side))en+=u.men+u.veh*8;});
    if(en<600||own>en*0.3||(hstr('damai|'+d.id+'|'+Math.floor(G.t/7200))%100)>=30)return;var eng=null,bd=15000;G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||!onMap(u)||!isEng(u)||typeof busyF==='function'&&busyF(u))return;var r=dist(u.x,u.y,d.x,d.y);if(r<bd){bd=r;eng=u;}});
    if(eng&&!(eng.ord&&eng.ord.k==='dam')){activate(eng,newOrder('dam',{x:d.x,y:d.y,opt:{id:d.id,act:'blow'}}));logE(side,'eng',uName(eng)+'奉命前往'+d.n+'準備決堤，以水阻敵',eng.x,eng.y,eng.id);}});});}
(function(){var b=v8Step;v8Step=function(){b();if(!G.started)return;if(G.step===1||!G.dams)damGen();if(G.step%20===9)damStep();if(G.step%60===41)damAI();};})();
/* 河川洪水重算淹水圖之後，馬上把決堤的淹水併回去 */
(function(){var b=floodCalc;floodCalc=function(){b.apply(this,arguments);if(G.dams&&G.dams.some(function(d){return d.st==='breach'||d.st==='fixed';}))damStep(true);};})();
(function(){var b=floodStart;floodStart=function(e){b(e);if(G.dams&&G.dams.some(function(d){return d.st==='breach'||d.st==='fixed';}))damStep(true);};})();
/* 存檔與聯機 */
if(typeof GKEYS!=='undefined')GKEYS.push('dams','damSeq');
if(typeof MPCOL!=='undefined'){MPCOL.push(['dam','id',function(){return (G.dams||[]).map(function(d){var c=Object.assign({},d);delete c.hitS;delete c.hitU;return c;});}]);MPCC.dam=function(){return G.dams||(G.dams=[]);};MPKEY.dam='id';}
