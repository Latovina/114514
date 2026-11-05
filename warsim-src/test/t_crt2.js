const M=require(process.env.BSIM||'./bsim.js');const E=M.E;
/* 彈坑改成地形：落彈先累計、每 10 步寫進地面；雨後的彈坑區是爛泥地，越野更慢；路面炸壞時路線快取每小時才整批重算 */
function ok(c,m){console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;}
async function mkGame(y,seed){const GW=400,GH=300,cs=50;const S=E("procSampler")({seed:seed,ter:'plain',clim:'temperate',Wm:GW*cs,Hm:GH*cs,lat:45});
  const MP=await E("genRegion")({GW,GH,cs,seed:seed,year:y,name:'t',lat0:45,lon0:2,src:'proc',dens:0.3},S,()=>Promise.resolve());const G=E("newGame")(MP,{y:y,m:7,d:10,h:8,dur:400,seed:seed});M.setG(G);G.set.wxMode='fixed';return G;}
(async()=>{const G=await mkGame(1943,'crt2-a');G.sides.forEach(s=>s.ai=false);E('prepareBattle')();G.onPause=()=>{};G._pfMs=1e9;G.started=true;G.env.wx=0;const MP=G.map;
 const land=E('validPos')({dom:'land'},MP.Wm/2,MP.Hm/2),k=E('cellAt')(land[0],land[1]);
 for(let i=0;i<30;i++)E('crtAdd')(land[0],land[1],300,5);ok(!G.crt||!G.crt[k],'shells are queued, not written cell by cell at once');
 ok(Object.keys(G._crtQ||{}).length===1,'thirty salvoes on one target merge into one entry');
 for(let i=0;i<10;i++)E('simStep')();ok(G.crt&&G.crt[k]>=100&&!G._crtQ,'within ten steps they are written into the ground ('+(G.crt&&G.crt[k])+')');
 /* 爛泥 */
 const T=Object.keys(E('UT')).find(t=>E('UT')[t].era==='e1940'&&E('UT')[t].mobi===3);const u=E('addLeaf')(0,T,1,'卡車隊',-1,E('mb32')(5));E('reix')();E('placeUnit')(u,land[0],land[1],0);u.st='ok';E('logInit')(u);
 const s=E('ST')(u),pf=E('pfFor')(s.mobi),rd=MP.rd[k];MP.rd[k]=0;G.env.mud=0;const v0=E('speedAt')(u,s,pf);G.env.mud=1;const v1=E('speedAt')(u,s,pf);MP.rd[k]=rd;G.env.mud=0;
 ok(v1<v0*0.85,'after rain the cratered ground is mud and trucks are slower still ('+(v1/v0).toFixed(2)+')');
 /* 路面：路線快取延後整批更新 */
 let rk=-1;for(let q=0;q<MP.rd.length;q++)if(MP.rd[q]&&!E('isWater')(MP.lc[q])){rk=q;break;}const mv0=G._mapv||0;
 if(rk>=0){E('crtAdd')((rk%MP.GW+0.5)*MP.cs,(Math.floor(rk/MP.GW)+0.5)*MP.cs,10,250);ok(G.rdd[rk]>=120&&(G._mapv||0)===mv0&&G._crtRd===1,'a road cut by shellfire marks the route caches stale without rebuilding them at once');
   for(let i=0;i<130;i++)E('simStep')();ok((G._mapv||0)>mv0&&!G._crtRd,'and they are rebuilt once within the hour');}else ok(true,'no road on this map');
 const pq=E('crtGet')(k);ok(pq>0,'the cell reads as cratered ('+pq+')');
})().catch(e=>{console.log('FAIL exception',e&&e.stack);process.exitCode=1;});
