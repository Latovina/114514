/* 部隊點數依花費：購置、維持費（天數）、後勤累積；兵力、彈藥減少點數跟著少；補給站存量計入陣營；每點美元可調；可切回戰力；戰力與標準表不受影響；增援點數關閉時增援費用也依花費 */
const M=require(process.env.BSIM||'./bsim.js');const E=M.E;
function ok(c,m){console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;}
async function mkGame(y,seed){const GW=200,GH=160,cs=50;const S=E("procSampler")({seed:seed,ter:'plain',clim:'temperate',Wm:GW*cs,Hm:GH*cs,lat:45});
  const MP=await E("genRegion")({GW,GH,cs,seed:seed,year:y,name:'t',lat0:45,lon0:2,src:'proc',dens:0.2},S,()=>Promise.resolve());const G=E("newGame")(MP,{y:y,m:7,d:10,h:12,dur:48,seed:seed});M.setG(G);G.set.wxMode='fixed';return G;}
let seq=31;
function put(side,type,x,y){const u=E('addLeaf')(side,type,1,'測試連',-1,E('mb32')(seq++));E('reix')();const p=E('validPos')(E('typeOf')(type),x,y);E('placeUnit')(u,p[0],p[1],0);u.st='ok';E('logInit')(u);return u;}
(async()=>{const G=await mkGame(1985,'fpc-a');G.units.length=0;E('reix')();
 const tk=put(0,'tk2000',3000,3000),ri=put(1,'ri1940',6000,3000);
 const a=E('fpcLeaf')(tk),b=E('fpcLeaf')(ri);
 ok(a.buy.t>0&&a.keep>0&&a.stock.t>0,'a unit costs something to buy, to keep and in supplies on hand');
 ok(Math.abs(a.t-(a.buy.t+a.keep+a.stock.t))<1,'points = purchase + upkeep + logistics');
 ok(a.buy.veh>50e6,'a modern tank company\'s tanks dominate its purchase cost (US$'+Math.round(a.buy.veh/1e6)+'M)');
 const pa=E('fpU')(tk),pb=E('fpU')(ri);ok(pa>20*pb,'a modern tank company is worth many WWII rifle companies ('+pa+' vs '+pb+' points)');
 ok(pa===Math.round(a.t/100000),'by default one point is US$100,000');
 G.set.fpDays=60;const a2=E('fpcLeaf')(tk);ok(Math.abs(a2.keep-2*a.keep)<1,'upkeep counts the set number of days');G.set.fpDays=30;
 const s0=E('fpcLeaf')(tk).stock.t;tk.ammo=30;const s1=E('fpcLeaf')(tk).stock.t;ok(s1<s0,'spent ammunition lowers the logistics part ('+Math.round(s0/1e3)+'k → '+Math.round(s1/1e3)+'k)');tk.ammo=100;
 const m0=E('fpcLeaf')(ri).buy.men;ri.men=Math.round(ri.men0/2);const m1=E('fpcLeaf')(ri).buy.men;ok(m1<m0*0.6,'losses lower the personnel cost');ri.men=ri.men0;
 const d0=E('fpcSide')(0);const N=(G.sides[0].nodes=G.sides[0].nodes||[]);N.push({k:'dep',name:'測試站',x:2000,y:2000,st:{food:50,ammo:100,fuel:80,fod:0},status:'ok'});const d1=E('fpcSide')(0);
 ok(d1.dep>0&&d1.t>d0.t,'supplies piled in depots add to the side\'s points (US$'+Math.round(d1.dep/1e6)+'M)');N.pop();
 G.set.fpUsd=1e6;ok(E('fpU')(tk)===Math.round(a.t/1e6),'the dollar value of a point can be changed');delete G.set.fpUsd;
 const pw=E('fpPowSide')(0);G.set.fpm='pow';ok(E('fpSide')(0)===pw&&E('fpU')(tk)===E('fpPowU')(tk),'switched back, unit points are the combat power again');delete G.set.fpm;
 ok(E('fpPowSide')(0)===pw&&pw<E('fpSide')(0),'combat power is still available alongside');
 const std=E('fpStd')('e7','mech',1);ok(!std||std.v<2000,'the standard table still compares combat power');
 G.set.rp=false;const rc=E('rpTypeCost')('tk2000',1,0);ok(Math.abs(rc-E('fpcType')('tk2000',0))<=1&&rc>pa*0.8,'with reinforcement points off, a reinforcement shows its cost in unit points ('+rc+')');
 G.set.rp=true;const rr=E('rpTypeCost')('tk2000',1,0);ok(rr<rc/3,'with reinforcement points on, reinforcements keep their own price ('+rr+')');G.set.rp=false;
 G.ct=G.ct||{};G.ct[1]={};G.ct[1][tk.id]={men:tk.men,veh:tk.veh,t:G.t,dead:false};const est=E('fpEst')(1),act=E('fpU')(tk);ok(est>act*0.3&&est<act*3,'the enemy estimate from intelligence is in the right range ('+est+' vs '+act+')');
})().catch(e=>{console.log('FAIL exception',e&&e.stack);process.exitCode=1;});
