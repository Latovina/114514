/* 火槍與冷兵器時代：八百里加急（直送、較快、兩組快馬、冷卻、電報時代沒有、AI 撤退時使用）；優先展開隊形（依敵軍速度提早展開、展開時不前進、等友軍展開後一齊推進；近代部隊不受影響） */
const M=require(process.env.BSIM||'./bsim.js');const E=M.E;
function ok(c,m){console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;}
async function mkGame(y,seed){const GW=200,GH=160,cs=50;const S=E("procSampler")({seed:seed,ter:'plain',clim:'temperate',Wm:GW*cs,Hm:GH*cs,lat:45});
  const MP=await E("genRegion")({GW,GH,cs,seed:seed,year:y,name:'t',lat0:45,lon0:2,src:'proc',dens:0.1},S,()=>Promise.resolve());const G=E("newGame")(MP,{y:y,m:7,d:10,h:9,dur:48,seed:seed});M.setG(G);G.set.wxMode='fixed';G.units.length=0;E('reix')();return G;}
function placeTree(F,x,y){E('leavesOf')(F).forEach((u,i)=>{const p=E('validPos')(E('ST')(u),x+(i%5)*150,y+Math.floor(i/5)*150);E('placeUnit')(u,p[0],p[1],0);u.st='ok';E('logInit')(u);});E('kidsOf')(F);}
const logs=G=>JSON.stringify(G.log||[]);
(async()=>{let G=await mkGame(1810,'ea-a');const A=E('buildPreset')(0,'a1700','測試軍',-1,E('mb32')(5),'co');E('reix')();
 const L=E('leavesOf')(A);L.forEach((u,i)=>{const p=E('validPos')(E('ST')(u),1000+(i%8)*120,1000+Math.floor(i/8)*120);E('placeUnit')(u,p[0],p[1],0);u.st='ok';E('logInit')(u);});
 const far=L[L.length-1];far.x=G.map.Wm-1000;far.y=G.map.Hm-1000;A.x=900;A.y=900;E('prepareBattle')();G.started=true;
 const m1=E('sendOrder')(A,far,E('newOrder')('move',{x:far.x-500,y:far.y}),true),t1=m1.ta-G.t;
 const m2=E('sendOrder')(A,far,E('newOrder')('move',{x:far.x-500,y:far.y,exp:1}),true),t2=m2.ta-G.t;
 ok(m2.via.join()==='express'&&t2<t1*0.7,'an express courier goes straight to the unit, much faster ('+Math.round(t2/60)+' vs '+Math.round(t1/60)+' min)');
 ok(E('expLeft')(0)===1,'each side has two express relays; one is now resting');
 E('sendOrder')(A,far,E('newOrder')('move',{x:far.x,y:far.y,exp:1}),true);const m4=E('sendOrder')(A,far,E('newOrder')('move',{x:far.x,y:far.y,exp:1}),true);
 ok(m4.via[0]!=='express'&&/驛馬尚未備妥/.test(logs(G)),'with both relays used, orders go by ordinary courier until the horses are ready');
 G.t+=5500;ok(E('expLeft')(0)===2,'after the cooldown both relays are ready again');
 G.sides[1].ai=true;const B=E('buildPreset')(1,'b1700','敵營',-1,E('mb32')(9),'co');E('reix')();placeTree(B,6000,6000);const k=E('leavesOf')(B)[0];E('issue')(k,'withdraw',{x:k.x+2000,y:k.y});ok(E('expLeft')(1)===1,'the AI uses express riders for urgent orders such as a withdrawal');
 G.set.y=1900;ok(E('expReady')(0)<0,'once the telegraph is common, there is no express relay');G.set.y=1810;
 /* 優先展開 */
 G=await mkGame(1745,'ea-b');const Bn=E('buildPreset')(0,'b1700','第一營',-1,E('mb32')(3),'co');E('reix')();placeTree(Bn,2000,2000);const C=E('kidsOf')(Bn).filter(q=>E('isLeaf')(q));const u=C[0],v=C[1];E('prepareBattle')();G.started=true;
 G.ct[0]={};const di=E('dfDist')(u);G.ct[0][999]={id:999,x:u.x+3000,y:u.y,t:G.t,dom:'land',br:'cav',men:150,veh:0};const dc=E('dfDist')(u);delete G.ct[0][999];
 ok(dc>di+500,'cavalry nearby makes the infantry deploy much earlier ('+Math.round(di)+' m → '+Math.round(dc)+' m)');
 u.form='march';u.formTo=null;u.task='go';u.ord=E('newOrder')('move',{x:u.x+6000,y:u.y});E('wantPath')(u,u.x+6000,u.y);u._ed=di*0.8;u._eid=0;const x0=u.x;
 E('leafStep')(u);ok(u.formTo==='deployed'&&/優先展開隊形/.test(logs(G)),'a column that meets the enemy halts and deploys first');for(let i=0;i<4;i++){u._ed=di*0.8;E('leafStep')(u);}ok(Math.abs(u.x-x0)<1,'and does not move while deploying');
 /* 一齊推進 */
 [u,v].forEach(q=>{q.ord=E('newOrder')('attack',{x:q.x+3000,y:q.y});q.task='go';E('wantPath')(q,q.x+3000,q.y);q._ed=di*0.9;});u.form='deployed';u.formTo=null;v.form='march';v.formTo='deployed';v.formT=G.t+600;
 C.slice(2).forEach(q=>{q.ord=null;});E('leafStep')(u);const xa=u.x;u._ed=di*0.9;E('leafStep')(u);ok(Math.abs(u.x-xa)<1&&/等待友軍/.test(logs(G)),'a deployed company waits for the rest of the battalion before advancing');
 v.form='deployed';v.formTo=null;u._ed=di*0.9;u.path={pts:[u.x,u.y,u.x+3000,u.y],i:2};u.pq=0;E('leafStep')(u);u._ed=di*0.9;E('leafStep')(u);ok(u.x!==xa&&/全線展開完畢/.test(logs(G)),'once all are deployed they advance together');
 /* 近代不受影響 */
 G=await mkGame(1943,'ea-c');const R=E('buildPreset')(0,'b1940','營',-1,E('mb32')(4),'co');E('reix')();placeTree(R,2000,2000);const w=E('leavesOf')(R).find(q=>E('ST')(q).dom==='land');ok(!E('dfOn')(w)&&E('expReady')(0)<0,'twentieth-century units are not affected');
})().catch(e=>{console.log('FAIL exception',e&&e.stack);process.exitCode=1;});
