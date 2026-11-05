/* 積雪與融雪泥濘（海拔、緯度）、高山症、水土不服 */
const M=require(process.env.BSIM||'./bsim.js');const E=M.E;
function ok(c,m){console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;}
async function mkGame(o){const GW=320,GH=320,cs=100;const S=E("procSampler")({seed:o.seed,ter:o.ter||'mount',clim:o.clim||'temperate',Wm:GW*cs,Hm:GH*cs,lat:o.lat||45});
  const MP=await E("genRegion")({GW,GH,cs,seed:o.seed,year:1985,name:'t',lat0:o.lat||45,lon0:2,src:'proc',dens:0.3},S,()=>Promise.resolve());const G=E("newGame")(MP,{y:1985,m:o.m||1,d:10,h:12,dur:400,seed:o.seed});M.setG(G);G.set.wxMode='fixed';return G;}
function start(G){G.sides.forEach(s=>s.ai=false);E('prepareBattle')();G.onPause=()=>{};G._pfMs=1e9;G.started=true;}
let seq=71;const UT=E('UT'),pick=f=>Object.keys(UT).find(k=>f(UT[k]));
function put(side,type,x,y){const u=E('addLeaf')(side,type,1,'測試',-1,E('mb32')(seq++));E('reix')();E('placeUnit')(u,x,y,0);u.st='ok';E('logInit')(u);return u;}
(async()=>{
 /* 一、積雪：高處比低處深 */
 const G=await mkGame({seed:'env-a',m:1});start(G);G.env.T=-4;G.sn=null;const S=E('snGrid')(),e0=E('snE0')();let hi=-1,lo=-1;S.el.forEach((e,i)=>{if(hi<0||e>S.el[hi])hi=i;if(lo<0||e<S.el[lo])lo=i;});
 ok(S.el[hi]-S.el[lo]>800,'the map has real relief ('+S.el[lo]+'–'+S.el[hi]+' m, reference '+Math.round(e0)+' m)');
 ok(S.d[hi]>S.d[lo],'snow lies deeper on the high ground ('+S.d[hi]+' cm vs '+S.d[lo]+' cm, '+Math.round(G.env.T)+' °C at the reference height)');
 /* 下雪、融雪 */
 const WX=E('WX'),snowI=WX.findIndex(w=>w[4]>=1),clearI=WX.findIndex(w=>!w[3]&&!w[4]);G.env.wx=snowI;G.env.T=-5;const d0=S.d.slice();for(let i=0;i<3;i++)E('snStep')();ok(S.d.every((d,i)=>d>=d0[i])&&S.d.some((d,i)=>d>d0[i]),'snowfall below freezing adds snow everywhere');
 G.env.wx=clearI;G.env.T=12;const dd=S.d.slice(),m0=S.m.slice();for(let i=0;i<10;i++)E('snStep')();const melted=S.d.reduce((a,d,i)=>a+(dd[i]-d),0);ok(melted>0,'a thaw melts it');
 ok(S.m.some((m,i)=>m>m0[i]+0.05),'and the meltwater turns the ground to mud ('+Math.max(...S.m).toFixed(2)+')');
 /* 速度 */
 const tr=pick(t=>t.mobi===3&&t.dom==='land');const u=put(0,tr,G.map.Wm/2,G.map.Hm/2);const s=E('ST')(u),q=E('snAt')(u.x,u.y);S.d[q.i]=60;S.m[q.i]=0;G.env.snow=0;G.env.mud=0;G.env.T=-8;
 const f1=E('snSlow')(u,s);ok(f1<0.6,'deep snow (60 cm) slows trucks a lot (×'+f1.toFixed(2)+')');S.d[q.i]=0;S.m[q.i]=0.8;G.env.T=5;const f2=E('snSlow')(u,s);ok(f2<0.8,'and so does thick mud (×'+f2.toFixed(2)+')');
 G.env.T=-10;ok(E('snSlow')(u,s)===1,'frozen mud is hard ground');G.env.mud=0.8;G.env.T=5;ok(E('snSlow')(u,s)===1,'nothing extra when the whole map is already muddy from the weather');S.m[q.i]=0;G.env.mud=0;
 /* 二、高山症 */
 const inf=pick(t=>t.br==='inf'&&t.dom==='land'&&(E('ERAI')[t.era]||{}).y>=1980&&!/山地|高山/.test(t.n));let hk=-1;for(let k=0;k<G.map.el.length;k++)if(G.map.el[k]>3600&&!E('isWater')(G.map.lc[k])){hk=k;break;}
 if(hk<0){G.map.el.fill(3800,0,G.map.GW*20);hk=G.map.GW*5+5;}const hx=(hk%G.map.GW+0.5)*G.map.cs,hy=(Math.floor(hk/G.map.GW)+0.5)*G.map.cs;const v=put(0,inf,hx,hy);v.x=hx;v.y=hy;
 const fire0=E('exhFire')(v),men0=v.men;for(let i=0;i<60;i++)E('envBodyStep')();ok(v.ams>0.15,'infantry high in the mountains gets altitude sickness ('+v.ams+' at '+Math.round(E('altOf')(v))+' m)');ok(E('exhFire')(v)<fire0*0.95,'and fights less well');
 for(let i=0;i<6*24;i++)E('envBodyStep')();ok((v.sick||0)>0||v.men<men0,'above 3500 m some are evacuated over the first day ('+(men0-v.men).toFixed(1)+')');for(let i=0;i<6*24*6;i++)E('envBodyStep')();ok(v.ams<0.15,'after about a week at altitude they acclimatise ('+v.ams+')');
 /* 三、水土不服 */
 const G2=await mkGame({seed:'env-b',ter:'plain',clim:'tropical',lat:5,m:7});start(G2);const z=E('zoneOf')(G2.map);ok(z==='trop','a battlefield at 5° latitude is tropical ('+z+')');
 const w=put(0,inf,G2.map.Wm/2,G2.map.Hm/2),w2=put(1,inf,G2.map.Wm/2+3000,G2.map.Hm/2);G2.sides[0].home='cold';for(let i=0;i<6*24;i++)E('envBodyStep')();
 ok(w.clm>0.5&&(w.sick||0)>0,'troops from a cold homeland suffer in the tropics (severity '+w.clm+', '+(w.sick||0).toFixed(1)+' sick)');ok(!w2.clm&&!(w2.sick>0),'the side left at "same as the theatre" is unaffected');
 for(let i=0;i<6*24*21;i++)E('envBodyStep')();ok(w.clm<0.05,'after three weeks they have adapted ('+w.clm+')');
})().catch(e=>{console.log('FAIL exception',e&&e.stack);process.exitCode=1;});
