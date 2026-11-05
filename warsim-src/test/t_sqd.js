/* 排與組：依兵種部署（戰鬥在前、支援在後）、依命令與素質選擇戰術（交替掩護、衝鋒、口袋防禦、環形、伏擊、後撤、潰退、縱隊）、活動範圍、組的數量 */
const M=require(process.env.BSIM||'./bsim.js');const E=M.E;
function ok(c,m){console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;}
async function mkGame(y,seed){const GW=300,GH=240,cs=50;const S=E("procSampler")({seed:seed,ter:'plain',clim:'temperate',Wm:GW*cs,Hm:GH*cs,lat:45});
  const MP=await E("genRegion")({GW,GH,cs,seed:seed,year:y,name:'t',lat0:45,lon0:2,src:'proc',dens:0.2},S,()=>Promise.resolve());const G=E("newGame")(MP,{y:y,m:7,d:10,h:12,dur:400,seed:seed});M.setG(G);G.set.wxMode='fixed';return G;}
let seq=91;const UT=E('UT'),pick=f=>Object.keys(UT).find(k=>f(UT[k]));const EY=t=>(E('ERAI')[t.era]||{}).y||0;
function put(side,type,x,y){const u=E('addLeaf')(side,type,1,'測試連',-1,E('mb32')(seq++));E('reix')();const p=E('validPos')(E('typeOf')(type),x,y);E('placeUnit')(u,p[0],p[1],0);u.st='ok';u.hd=0;E('logInit')(u);return u;}
const fwd=(u,o)=>(o[0]-u.x)*Math.cos(u.hd)+(o[1]-u.y)*Math.sin(u.hd);
(async()=>{const G=await mkGame(1985,'sqd-a');G.sides.forEach(s=>s.ai=false);E('prepareBattle')();G.onPause=()=>{};G.started=true;
 const mi=pick(t=>t.br==='mech'&&EY(t)>=1980&&t.men>=80)||pick(t=>t.br==='inf'&&EY(t)>=1980&&t.men>=80);const u=put(0,mi,G.map.Wm/2,G.map.Hm/2);
 const P=E('pltLive')(u);ok(P.length>=4&&P.some(p=>p.k==='wpn'),'a modern infantry company has rifle platoons and a weapons platoon ('+P.map(p=>p.k).join(',')+')');
 u.trn=80;u.ord=E('newOrder')('attack',{x:u.x+3000,y:u.y});u.ms='ok';ok(E('sqTac')(u)==='bound','well-trained modern infantry attacks by bounding overwatch');
 let L=E('pltPos')(u),wi=L.findIndex(o=>o[2].k==='wpn'),ci=L.map((o,i)=>i).filter(i=>L[i][2].k!=='wpn');ok(ci.every(i=>fwd(u,L[i])>fwd(u,L[wi])),'combat platoons are ahead of the weapons platoon');
 const f0=ci.map(i=>Math.round(fwd(u,L[i])));G.t+=Math.max(60,240-E('sqTrn')(u));L=E('pltPos')(u);const f1=ci.map(i=>Math.round(fwd(u,L[i])));ok(f0.join()!==f1.join()&&Math.max(...f0)>Math.min(...f0),'half bounds forward while half covers, then they swap ('+f0.join('/')+' → '+f1.join('/')+')');
 const R=E('sqComm')(u);ok(L.every(o=>Math.hypot(o[0]-u.x,o[1]-u.y)<=R+1),'everyone stays within the company commander\'s reach ('+R+' m)');
 u.trn=25;ok(E('sqTac')(u)==='charge','poorly trained troops charge in a mass');L=E('pltPos')(u);ok(ci.every(i=>fwd(u,L[i])>0),'the whole company surges forward');
 u.trn=80;u.ord=E('newOrder')('defend',{x:u.x,y:u.y});ok(E('sqTac')(u)==='pocket','well-trained troops on the defensive form a pocket');L=E('pltPos')(u);const cs=ci.map(i=>({f:fwd(u,L[i]),l:Math.abs((L[i][1]-u.y)*Math.cos(u.hd)-(L[i][0]-u.x)*Math.sin(u.hd))}));
 if(cs.length>=3){const wide=cs.filter(q=>q.l>50),mid=cs.filter(q=>q.l<=50);ok(wide.length&&mid.length&&Math.min(...wide.map(q=>q.f))>Math.max(...mid.map(q=>q.f)),'the flanks are forward and the centre held back');}else ok(true,'(fewer than three combat platoons)');
 u.enc=1;ok(E('sqTac')(u)==='allround','surrounded, they form an all-round defence');u.enc=0;
 u.ord=E('newOrder')('withdraw',{x:u.x-3000,y:u.y});ok(E('sqTac')(u)==='wbound','a good unit withdraws by bounds');u.ms='shaken';u.mor=20;ok(E('sqTac')(u)==='rout','a broken one just runs');u.ms='rout';L=E('pltPos')(u);ok(L.every(o=>fwd(u,o)<0),'routing platoons scatter to the rear');
 u.ms='ok';u.mor=70;u.ord=null;u.form='march';u._ed=1e9;ok(E('sqTac')(u)==='column','on the march they move in column');
 const S=E('sqPos')(u),n=E('pltLive')(u).reduce((a,p)=>a+E('sqN')(p),0);ok(S.length===n&&n>=10,'each platoon is split into squads and teams ('+n+' on the map)');
 /* 1915 年以前、訓練普通：進攻就衝鋒 */
 const G2=await mkGame(1914,'sqd-b');G2.sides.forEach(s=>s.ai=false);E('prepareBattle')();G2.started=true;const old=pick(t=>t.br==='inf'&&EY(t)>=1900&&EY(t)<=1914&&t.men>=80);const v=put(0,old,G2.map.Wm/2,G2.map.Hm/2);v.trn=60;v.ord=E('newOrder')('attack',{x:v.x+3000,y:v.y});
 ok(E('sqTac')(v)==='charge','in 1914 an ordinary infantry company attacks by charging');ok(E('sqComm')(v)===400,'and its commander reaches about 400 m by runners and whistles');
 G2.set.sqd=false;ok(JSON.stringify(E('pltSlots')(v,E('pltLive')(v).length))!==JSON.stringify(E('sqSlots')(v,E('pltLive')(v),'charge')),'switched off, platoons fall back to the formation layout');
})().catch(e=>{console.log('FAIL exception',e&&e.stack);process.exitCode=1;});
