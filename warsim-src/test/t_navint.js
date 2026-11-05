/* 海上偵察與誤認：各時代的感測、識別誤差（距離、夜間、訓練）、相似艦型的誤認與第一印象、近距離才看清、雷達只看到光點與假回波、電子偵察、衛星、把敵艦當友艦與盤問、AI 依識別判斷兵力 */
const M=require(process.env.BSIM||'./bsim.js');const E=M.E;
function ok(c,m){console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;}
async function mkGame(y,seed){const GW=240,GH=200,cs=100;const S=E("procSampler")({seed:seed,ter:'island',clim:'temperate',Wm:GW*cs,Hm:GH*cs,lat:30});
  const MP=await E("genRegion")({GW,GH,cs,seed:seed,year:y,name:'t',lat0:30,lon0:150,src:'proc',dens:0.1},S,()=>Promise.resolve());const G=E("newGame")(MP,{y:y,m:7,d:10,h:12,dur:48,seed:seed});M.setG(G);G.set.wxMode='fixed';G.units.length=0;E('reix')();return G;}
let seq=71;
function put(side,type,x,y){const u=E('addLeaf')(side,type,1,'測試艦',-1,E('mb32')(seq++));E('reix')();const p=E('validPos')(E('typeOf')(type),x,y);E('placeUnit')(u,p[0],p[1],0);u.st='ok';E('logInit')(u);return u;}
function seaPt(G,fx,fy){const MP=G.map;let best=null,bd=1e18;for(let Y=0;Y<MP.GH;Y+=2)for(let X=0;X<MP.GW;X+=2){if(MP.lc[Y*MP.GW+X]!==E('LCI').sea)continue;const d=Math.hypot(X-fx*MP.GW,Y-fy*MP.GH);if(d<bd){bd=d;best=[(X+0.5)*MP.cs,(Y+0.5)*MP.cs];}}return best;}
const logs=G=>JSON.stringify(G.log||[]);
(async()=>{let G=await mkGame(1942,'ni-a');const UT=E('UT'),cl=k=>E('nsCls')(UT[k]);
 ok(cl('bb1940')==='bb'&&cl('cru1940_1')==='ca'&&cl('cl1940')==='cl'&&cl('dd1940_1')==='dd'&&cl('cvl1940')==='cvl'&&cl('cv1940')==='cv'&&cl('sl1800_1')==='sl'&&cl('ss1940_1')==='ss','ships are sorted into silhouette classes');
 ok(/目視/.test(E('nsMeans')(1890))&&/雷達/.test(E('nsMeans')(1943))&&/衛星/.test(E('nsMeans')(1985)),'each era has its own means of reconnaissance');
 const p=seaPt(G,0.5,0.5);const bb=put(1,'bb1940',p[0],p[1]),o=put(0,'dd1940_1',p[0]-20000,p[1]),cvl=put(1,'cvl1940',p[0],p[1]+2000);E('prepareBattle')();G.started=true;
 /* 識別誤差 */
 const trial=(night,d,trn,n)=>{G.env.light=night?0.1:1;o.trn=trn;let w=0;const pts=[];for(let i=0;i<n;i++){E('nsDB')(0)[bb.id]=undefined;const r=E('nsIdent')(0,o,bb,d,'visual');if(!r.ok)w++;pts.push(r.pt);}return {w:w/n,pts};};
 const far=trial(true,18000,45,300),near=trial(false,3000,75,300);G.env.light=1;
 ok(far.w>0.4&&near.w<0.1,'far away at night with a green crew most identifications are wrong, close by day few are ('+far.w.toFixed(2)+' vs '+near.w.toFixed(2)+')');
 const wrong=far.pts.filter(k=>k!=='bb1940');ok(wrong.filter(k=>/cru1940|cl1940/.test(k)).length>wrong.length*0.8,'a battleship is mostly mistaken for a cruiser');
 let cv=0,wr=0;for(let i=0;i<300;i++){E('nsDB')(0)[cvl.id]=undefined;const r=E('nsIdent')(0,o,cvl,20000,'visual');if(!r.ok){wr++;if(r.pt==='cv1940')cv++;}}ok(wr>0&&cv>wr*0.6,'a light carrier is mostly mistaken for a fleet carrier ('+cv+' of '+wr+')');
 /* 第一印象與近距離確認 */
 E('nsDB')(0)[bb.id]={pt:'cru1940_1',ok:false,err:0.15,src:'visual',t:G.t};G.env.light=0.1;o.trn=45;E('nsIdent')(0,o,bb,18000,'visual');G.env.light=1;ok(E('nsDB')(0)[bb.id].pt==='cru1940_1','the first impression sticks while the view does not get better');
 G.ct[0][bb.id]={id:bb.id,x:bb.x,y:bb.y,t:G.t,q:0.5,side:1,dom:'sea',br:'nav',men:1800,veh:1,pt:'cru1940_1',pv:1};const pw=E('ncCPow')(G.ct[0][bb.id]);ok(pw<E('fpType')('bb1940')*0.8,'the naval commander weighs the enemy by what it thinks it saw ('+Math.round(pw)+' vs '+E('fpType')('bb1940')+')');
 o.x=bb.x-2500;o.y=bb.y;E('reix')();E('gridBuild')();E('nsClose')();ok(E('nsDB')(0)[bb.id].ok&&/近距離交戰時才發現，對手實際上是戰鬥艦/.test(logs(G)),'at close range the truth comes out: "it was a battleship after all"');
 /* 雷達：光點、無法分辨艦型；假回波 */
 G=await mkGame(1944,'ni-b');const q=seaPt(G,0.5,0.5);const r1=put(0,'bb1940',q[0],q[1]),t1=put(1,'dd1940_1',q[0]+12000,q[1]);E('prepareBattle')();G.started=true;r1.rdr=1;G.env.light=0.05;
 for(let i=0;i<6;i++){E('gridBuild')();E('nsSense')();G.t+=200;E('reportStep')();}const c=G.ct[0][t1.id];ok(c&&c.idSrc==='radar'&&/雷達接觸/.test(c.name),'at night radar finds the destroyer as a blip without telling its type ('+(c&&c.name)+')');
 let gh=0;E('gridBuild')();for(let i=0;i<400;i++){E('nsSense')();}for(const id in G.ct[0])if(+id>=9e8)gh++;ok(gh>=1,'early radar near land sometimes shows ghost contacts ('+gh+')');
 /* 電子偵察與衛星（冷戰） */
 G=await mkGame(1985,'ni-c');const s=seaPt(G,0.5,0.5);const a=put(0,'dd1970_1',s[0],s[1]),e=put(1,'dd1970_1',s[0]+60000>G.map.Wm?s[0]-60000:s[0]+60000,s[1]);E('prepareBattle')();G.started=true;a.rdr=1;e.rdr=1;E('gridBuild')();E('nsSense')();
 ok(G.rq[0].some(r=>r.id===e.id&&r.sens==='esm'),'electronic support measures pick up an enemy radar beyond radar range');ok(G.rq[0].some(r=>r.id===e.id&&r.sens==='sat'),'satellite passes report large surface ships');
 E('SD')(1).ncmd={t:'msl',post:'shadow',P:{},n:'x',log:{}};G.rq[0].length=0;E('SD')(0).satT=1e9;E('nsSense')();ok(!G.rq[0].some(r=>r.sens==='esm'),'a missile-salvo commander keeps radar silent until it engages');
 /* 把敵艦當友艦（青葉號）與盤問 */
 G=await mkGame(1942,'ni-d');E('prepareBattle')();const f=seaPt(G,0.5,0.5);let ff=0,ch=0,rev=0,hold=0;
 for(let k=0;k<60;k++){G.units.length=0;E('reix')();G.nid=null;G.rq=[[],[]];G.ct=[{},{}];const ob=put(0,'cru1940_1',f[0],f[1]),fr=put(0,'dd1940_1',f[0]+9000,f[1]),en=put(1,'cru1940_1',f[0]+4000,f[1]+500);ob.trn=40;G.started=true;G.env.light=0.1;
   G.rq[0].push({at:G.t,id:en.id,x:en.x,y:en.y,t:G.t,q:0.5,by:ob.id,sens:'visual'});E('reportStep')();const D=E('nsDB')(0)[en.id];
   if(D&&D.fft){ff++;if(!G.ct[0][en.id])rev+=G.rq[1].some(r=>r.id===ob.id)?1:0;if(E('ctrMul')(ob,en,'fire',4000)===0)hold++;}else if(D&&D.chalT)ch++;}
 ok(ff>=3&&rev===ff&&hold===ff,'at night with friends expected nearby, a crew sometimes takes the enemy for a friend, holds fire and flashes its recognition signal, revealing itself ('+ff+' of 60)');
 G.set.y=1985;let ff2=0;for(let k=0;k<60;k++){G.units.length=0;E('reix')();G.nid=null;G.rq=[[],[]];G.ct=[{},{}];const ob=put(0,'dd1970_1',f[0],f[1]),fr=put(0,'dd1970_1',f[0]+9000,f[1]),en=put(1,'dd1970_1',f[0]+4000,f[1]);ob.trn=40;G.env.light=0.1;
   G.rq[0].push({at:G.t,id:en.id,x:en.x,y:en.y,t:G.t,q:0.5,by:ob.id,sens:'visual'});E('reportStep')();const D=E('nsDB')(0)[en.id];if(D&&D.fft)ff2++;}
 ok(ff2<ff/2,'with IFF in the Cold War such mistakes are much rarer ('+ff2+' vs '+ff+')');
 G.set.y=1942;G.units.length=0;E('reix')();G.nid=null;G.rq=[[],[]];G.ct=[{},{}];const ob=put(0,'cru1940_1',f[0],f[1]),en=put(1,'cru1940_1',f[0]+4000,f[1]);E('nsDB')(0)[en.id]={pt:'cru1940_1',ok:true,err:0.3,src:'visual',t:G.t,ff:G.t+600,fft:1};
 E('hit')(ob,en,1,0.05,5,'fire');ok(!E('nsDB')(0)[en.id].ff&&/遭到「友艦」射擊/.test(logs(G)),'when the "friend" opens fire the mistake is discovered');
 /* 艦艇回報給旗艦依通訊方式 */
 G.set.y=1890;const fl2=put(0,'bb1914',f[0]+30000,f[1]);const rd=E('reportDelay')(ob);ok(rd>=600,'before radio, a ship\'s sighting report reaches the flagship slowly ('+Math.round(rd/60)+' min)');
})().catch(e=>{console.log('FAIL exception',e&&e.stack);process.exitCode=1;});
