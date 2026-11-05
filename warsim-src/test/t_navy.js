/* 海戰重做：主力艦一艘一個單位、範本改成單艦組成的隊；海軍陸戰隊與海軍航空隊；海軍指揮官與陸軍分開；各時代的命令傳遞；依兵力與個性接戰、避戰、撤退；帆船搶上風；水雷、觸雷與掃雷；陸戰隊登陸 */
const M=require(process.env.BSIM||'./bsim.js');const E=M.E;
function ok(c,m){console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;}
async function mkGame(y,seed,ter){const GW=240,GH=200,cs=100;const S=E("procSampler")({seed:seed,ter:ter||'island',clim:'temperate',Wm:GW*cs,Hm:GH*cs,lat:30});
  const MP=await E("genRegion")({GW,GH,cs,seed:seed,year:y,name:'t',lat0:30,lon0:150,src:'proc',dens:0.1},S,()=>Promise.resolve());const G=E("newGame")(MP,{y:y,m:7,d:10,h:12,dur:48,seed:seed});M.setG(G);G.set.wxMode='fixed';G.units.length=0;E('reix')();return G;}
let seq=51;
function put(side,type,x,y){const u=E('addLeaf')(side,type,1,'測試艦',-1,E('mb32')(seq++));E('reix')();const p=E('validPos')(E('typeOf')(type),x,y);E('placeUnit')(u,p[0],p[1],0);u.st='ok';E('logInit')(u);return u;}
function seaPt(G,fx,fy){const MP=G.map;let best=null,bd=1e18;for(let Y=0;Y<MP.GH;Y+=2)for(let X=0;X<MP.GW;X+=2){if(MP.lc[Y*MP.GW+X]!==E('LCI').sea)continue;const d=Math.hypot(X-fx*MP.GW,Y-fy*MP.GH);if(d<bd){bd=d;best=[(X+0.5)*MP.cs,(Y+0.5)*MP.cs];}}return best;}
function run(G,n){for(let i=0;i<n;i++)E('simStep')();}
(async()=>{let G=await mkGame(1943,'nv-a');const UT=E('UT');
 ok(UT.dd1940_1&&UT.dd1940_1.veh===1&&UT.dd1940_1.men===300&&UT.dd1940.old===1,'a destroyer is now one ship (the old four-ship type is kept for old saves)');
 const F=E('buildPreset')(0,'f1940','測試艦隊',-1,E('mb32')(3),'co');const L=E('leavesOf')(F);const dds=L.filter(u=>u.mix[0][0]==='dd1940_1');
 ok(dds.length===12&&L.every(u=>u.veh0<=1||/^(pt|pb|gb|gal|ml|msw|mcm|trs|dxt)/.test(u.mix[0][0])||E('ST')(u).dom==='air'),'templates keep the ship count but every major warship is its own unit ('+dds.length+' destroyers)');
 ok(['mar1940','sp1940','mpa1940','cvl1940','ml1940','msw1940','mcm2000','gal1600'].every(k=>UT[k]&&UT[k].navy),'marines, naval aviation, light carriers, minelayers and sweepers exist and belong to the navy');
 ok(UT.pt1940.veh===8&&UT.msw1940.veh===6,'torpedo boats and minesweepers stay as flotillas');
 /* 陸軍指揮官不指揮海軍 */
 G=await mkGame(1943,'nv-b');G.sides[1].ai=true;G.sides[0].ai=false;const a=seaPt(G,0.3,0.5),b=seaPt(G,0.7,0.5);
 const bb=put(1,'bb1940',b[0],b[1]),d1=put(1,'dd1940_1',b[0]+800,b[1]),d2=put(1,'dd1940_1',b[0]-800,b[1]),en=put(0,'dd1940_1',b[0]-15000,b[1]);E('prepareBattle')();G.started=true;
 ok(E('aiControls')(bb)===false&&E('ncCtlLeaf')(bb),'the army commander no longer commands ships; the naval commander does');
 const C=E('ncOf')(1);ok(!!E('NCT')[C.t]&&/艦隊司令/.test(C.n),'each side has a naval commander with a personality ('+C.n+'，'+E('NCT')[C.t][0]+')');
 /* 命令傳遞 */
 const sig=(y,d,night)=>{G.set.y=y;G.env.light=night?0.1:1;G.env.wx=0;const A={x:0,y:0},B={x:d,y:0};const r=E('ncSig')(1,A,B);return r.via+':'+Math.round(r.sec/60);};
 const s1=sig(1805,8000),s2=sig(1805,60000),s3=sig(1916,60000),s4=sig(1943,20000),s5=sig(1916,5000,true),s6=sig(1985,60000);G.set.y=1943;G.env.light=1;
 ok(/^flag/.test(s1)&&/^boat/.test(s2)&&/^wt/.test(s3)&&/^tbs/.test(s4)&&/^lamp/.test(s5)&&/^link/.test(s6),'orders travel by flags, lamps, dispatch vessels, wireless, voice radio or data link by era ('+[s1,s2,s3,s4,s5,s6].join(' ')+')');
 ok(parseInt(s2.split(':')[1])>parseInt(s1.split(':')[1])*3,'out of sight before radio, a dispatch vessel takes much longer');
 /* 優勢時接敵：命令有延遲 */
 G.ct[1][en.id]={id:en.id,x:en.x,y:en.y,t:G.t,q:1,side:0,dom:'sea',br:'nav',men:300,veh:1};E('SD')(1).ncmd.P.thr=0.8;E('SD')(1).ncmd.P.night=0.5;
 E('ncStep')(1);const Q=E('SD')(1).ncq||[];ok(E('SD')(1).ncmd.post==='engage'&&Q.length>=3&&Q.every(m=>m.ta>G.t),'with the stronger fleet it orders an attack, delivered after a signalling delay');
 const t0=Math.max(...Q.map(m=>m.ta));while(G.t<t0+1800&&!(bb.ord&&bb.ord.nc))E('simStep')();ok(['attack','move'].includes(bb.ord&&bb.ord.k)&&bb.ord.nc,'the ships carry out the naval commander\'s orders');
 /* 劣勢：避戰 */
 const big=[0,1,2,3].map(i=>put(0,'bb1940',b[0]-14000,b[1]+i*600));big.forEach(u=>G.ct[1][u.id]={id:u.id,x:u.x,y:u.y,t:G.t,q:1,side:0,dom:'sea',br:'nav',men:1800,veh:1});E('SD')(1).ncmd.P=Object.assign({},E('NCT').fleet[2]);E('ncStep')(1);
 ok(E('SD')(1).ncmd.post==='avoid','against a much stronger fleet a fleet-in-being commander avoids battle');
 /* 帆船：搶上風 */
 G=await mkGame(1805,'nv-c');G.sides[1].ai=true;const p=seaPt(G,0.5,0.5);const sl=put(1,'sl1800_1',p[0]+3000,p[1]),fe=put(0,'sl1800_1',p[0],p[1]);E('prepareBattle')();G.started=true;G.env.wd=0;
 G.ct[1][fe.id]={id:fe.id,x:fe.x,y:fe.y,t:G.t,q:1,side:0,dom:'sea',br:'nav',men:750,veh:1};E('SD')(1).ncmd=null;E('SD')(1).ncmdT='decis';E('ncOf')(1).P.thr=0.5;E('ncStep')(1);const q=(E('SD')(1).ncq||[]).find(m=>m.to===sl.id);
 ok(q&&q.o.k==='move'&&q.o.x<fe.x,'a ship of the line downwind first works up to windward of the enemy (weather gauge)');
 /* 水雷 */
 G=await mkGame(1943,'nv-d');const mp=seaPt(G,0.5,0.5);const ml=put(0,'ml1940',mp[0],mp[1]);E('prepareBattle')();G.started=true;E('activate')(ml,E('newOrder')('minelay',{x:ml.x,y:ml.y,r:1500}));run(G,80);
 const fld=E('mnList')()[0];ok(fld&&fld.n>100&&fld.side===0,'a minelayer flotilla lays a minefield ('+(fld?Math.round(fld.n):0)+' mines)');
 let hits=0;for(let k=0;k<12;k++){const v=put(1,'trs1940',mp[0]-1400,mp[1]+((k%5)-2)*200);v.movedAt=G.t;const vh=v.veh;for(let i=0;i<20;i++){v.x+=140;v.movedAt=G.t;E('mnHit')();}const I=E('incOf')(v);if(I.k&&I.k.mine>0)hits++;}
 ok(hits>=2&&hits<=11,'enemy ships crossing the field sometimes strike mines ('+hits+' of 12 transits)');ok(fld.kn.includes(1),'a mine strike reveals the field to the victim');
 const sw=put(1,'msw1940',fld.x,fld.y);const n0=fld.n;E('activate')(sw,E('newOrder')('sweep',{x:fld.x,y:fld.y,r:1500}));run(G,60);ok(fld.n<n0*0.9,'minesweepers clear the field ('+Math.round(n0)+' → '+Math.round(fld.n)+')');
 /* 陸戰隊登陸 */
 G=await mkGame(1943,'nv-e','coast');G.sides[1].ai=true;const cp=seaPt(G,0.5,0.5);const mar=put(1,'mar1940',cp[0],cp[1]);const ship=put(1,'cru1940_1',cp[0],cp[1]+500);
 let obj=null;const MP=G.map;for(let Y=0;Y<MP.GH&&!obj;Y+=3)for(let X=0;X<MP.GW&&!obj;X+=3){const x=(X+0.5)*MP.cs,y=(Y+0.5)*MP.cs;if(!E('isWater')(MP.lc[Y*MP.GW+X])&&E('mnCoast')(x,y,2000)&&!E('mnCoast')(x,y,600))obj={x,y};}
 G.obj=[{id:1,n:'灘頭',x:obj.x,y:obj.y,own:0,pts:10,r:500}];E('prepareBattle')();G.started=true;G.obj=[{id:1,n:'灘頭',x:obj.x,y:obj.y,own:0,pts:10,r:500}];G.t=1000;E('ncStep')(1);const lq=(E('SD')(1).ncq||[]).find(m=>m.to===mar.id);
 ok(lq&&/landing|attack/.test(lq.o.k),'with no enemy fleet nearby, the marines are sent to land on a coastal objective');
})().catch(e=>{console.log('FAIL exception',e&&e.stack);process.exitCode=1;});
