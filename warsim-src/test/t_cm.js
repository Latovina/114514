/* 對抗措施：飛機投放熱焰彈避開紅外線飛彈（年代、彈量、落地補滿）、干擾絲對雷達導引；戰車在反戰車飛彈來襲時提前施放煙幕；火焰噴射器 */
const M=require(process.env.BSIM||'./bsim.js');const E=M.E;
function ok(c,m){console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;}
async function mkGame(y,seed){const GW=300,GH=240,cs=50;const S=E("procSampler")({seed:seed,ter:'plain',clim:'temperate',Wm:GW*cs,Hm:GH*cs,lat:45});
  const MP=await E("genRegion")({GW,GH,cs,seed:seed,year:y,name:'t',lat0:45,lon0:2,src:'proc',dens:0.3},S,()=>Promise.resolve());const G=E("newGame")(MP,{y:y,m:7,d:10,h:12,dur:400,seed:seed});M.setG(G);G.set.wxMode='fixed';return G;}
let seq=31;
function put(side,type,x,y){const u=E('addLeaf')(side,type,1,'測試',-1,E('mb32')(seq++));E('reix')();const p=E('validPos')(E('typeOf')(type),x,y);E('placeUnit')(u,p[0],p[1],0);u.st='ok';E('logInit')(u);return u;}
const UT=E('UT'),pick=(f)=>Object.keys(UT).find(k=>f(UT[k]));
async function run(y){const G=await mkGame(y,'cm-'+y);G.sides.forEach(s=>s.ai=false);E('prepareBattle')();G.onPause=()=>{};G._pfMs=1e9;G.started=true;
  const ftr=pick(t=>t.dom==='air'&&t.br==='air'&&(ERAY(t)<=y)),man=pick(t=>t.br==='ad'&&t.dom==='land');return {G,ftr,man};}
let ERAY;
(async()=>{ERAY=t=>(E('ERAI')[t.era]||{}).y||0;
 /* 一、熱焰彈 */
 const {G}=await run(1985);const ftk=pick(t=>t.dom==='air'&&t.br==='air'&&ERAY(t)>=1970&&ERAY(t)<=1990);const sk=pick(t=>t.dom==='land'&&t.br==='ad');
 const a=put(0,ftk,7000,6000);a.st='air';const g=put(1,sk,9000,6000);const UX=E('UTX'),gk=g.mix[0][0],ux0=UX[gk];UX[gk]=Object.assign({},ux0||{},{sam:1,rng:5000});
 const n0=a.cmN;let red=0,tries=0;for(let i=0;i<40;i++){const f=E('cmAir')(a,g,'aa');tries++;if(f<1)red++;}
 ok(red>=8&&red<=12,'an aircraft under a short-range (infrared) SAM drops flares until its load is spent ('+red+' of '+tries+' attacks)');
 ok(a.cmN===0,'and its flare load runs out ('+a.cmN+')');ok(E('cmAir')(a,g,'aa')===1,'with no flares left there is no protection');
 a.st='ok';for(let i=0;i<10;i++)E('simStep')();ok(a.cmN===1,'after landing the flares are refilled');
 UX[gk].rng=40000;a.st='air';a.cmN=1;let fr=[];for(let i=0;i<20;i++)fr.push(E('cmAir')(a,g,'aa'));ok(fr.some(f=>f<1)&&fr.every(f=>f>=0.79),'against a long-range radar SAM it releases chaff, which helps less (×'+Math.min(...fr).toFixed(2)+')');
 ok(E('cmAir')(Object.assign({},a,{st:'ok'}),g,'aa')===1,'ground units do not drop flares');
 const {G:G2}=await run(1955);const a2=put(0,pick(t=>t.dom==='air'&&t.br==='air'&&ERAY(t)<=1955),7000,6000);a2.st='air';const g2=put(1,sk,9000,6000);UX[gk]=Object.assign({},ux0||{},{sam:1,rng:5000});G2.set.y=1955;
 let any=false;for(let i=0;i<20;i++)if(E('cmAir')(a2,g2,'aa')<1)any=true;ok(!any,'in 1955 there are no flares yet');
 if(ux0)UX[gk]=ux0;else delete UX[gk];
 /* 二、戰車的預警煙幕 */
 const {G:G3}=await run(2005);const tk=pick(t=>t.br==='arm'&&ERAY(t)>=1980&&t.veh>0),at=pick(t=>t.br==='at'&&ERAY(t)>=1980&&ERAY(t)<=2010);
 const T=put(0,tk,7000,6000),A=put(1,at,9000,6000);const F=E('eqF2')(T);ok(F&&F.smk,'a modern tank company carries smoke dischargers');
 const At=E('cmAtgmOf')(A);ok(At&&At.f>0.5,'an anti-tank unit\'s fire is mostly guided missiles ('+(At&&At.f.toFixed(2))+')');
 let popped=0,fsum=0;for(let i=0;i<60;i++){T.smkT=undefined;const f=E('cmSmoke')(T,A,'fire');if(f<1){popped++;fsum+=f;}}
 ok(popped>15&&popped<60,'the tank often sees the launch and fires smoke before the hit ('+popped+'/60)');ok(fsum/popped>0.3&&fsum/popped<0.9,'which takes much of the sting out of that salvo (×'+(fsum/popped).toFixed(2)+')');
 ok((G3.smk||[]).length>0,'the smoke screen is laid on the map');T.smkT=G3.t;ok(E('cmSmoke')(T,A,'fire')===1,'not again within 20 minutes');
 const rf=put(1,pick(t=>t.br==='inf'&&ERAY(t)>=1940&&ERAY(t)<=1950),9000,6500);T.smkT=undefined;ok(E('cmSmoke')(T,rf,'fire')===1,'rifle fire does not trigger the missile warning');
 /* 三、火焰噴射器 */
 const W=E('WPNO');ok(W.flm&&W.flm.rE<=50&&W.flm.y===1915&&W.flmv&&W.flmv.y===1940,'man-pack and vehicle flamethrowers exist (range '+W.flm.rE+' m and '+W.flmv.rE+' m)');
})().catch(e=>{console.log('FAIL exception',e&&e.stack);process.exitCode=1;});
