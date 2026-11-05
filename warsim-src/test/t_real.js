/* 裝備的現實限制：自訂的彈藥、材料、模組、飛彈、核彈頭、毒劑、武器、單位類型與型號都不能超模；內建資料不受影響 */
const M=require(process.env.BSRV||'./bsim.js');const E=M.E;
function ok(c,m){console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;}
const cl=o=>JSON.parse(JSON.stringify(o));
(async()=>{await E('mpQuick')('s1985','real-a');const G=M.getG();
 const N0=E('rlAll')(G);ok(N0.length===0,'a scenario with only built-in equipment passes untouched'+(N0.length?' ('+N0.slice(0,3).join('；')+')':''));
 const LAL=E('LAL'),LVL=E('LVL'),P0=E('LALP');
 /* 彈藥 */
 const r=cl(P0.r556m855);r.id='ca1';r.n='超級步槍彈';r.v0=3000;r.ref=0.001;r.rw=1;r.bc=5;G.ammo={ca1:r};let N=[];E('rlRound')(r,N);
 ok(r.v0<=1150&&r.v0>=900,'a 5.56 mm round cannot leave the muzzle at 3000 m/s (now '+Math.round(r.v0)+' m/s)');ok(r.ref===undefined&&E('pUsd')(r)>=E('pUsd')(P0.r556m855)*0.8,'its price comes from materials and manufacture ('+E('pUsd')(r).toFixed(2)+' vs '+E('pUsd')(P0.r556m855).toFixed(2)+' USD)');
 ok(r.bc<0.5,'its ballistic coefficient is no better than the best-shaped real bullet of that weight ('+r.bc.toFixed(3)+')');ok(r.prop>=P0.r556m855.prop*0.85,'enough propellant for its muzzle energy ('+r.prop+' g)');
 const r2=cl(P0.r556m855);r2.id='ca2';r2.v0=1150;r2.m=4.6;N=[];E('rlRound')(r2,N);const e=x=>0.5*x.m/1000*x.v0*x.v0;ok(e(r2)<=e(P0.r556m855)*1.6,'a heavier, faster 5.56 mm bullet is limited by chamber pressure ('+Math.round(e(r2))+' J vs '+Math.round(e(P0.r556m855))+' J built-in)');
 const lr=cl(P0.t120m829a1);lr.id='ca3';lr.core.L=3000;lr.v0=2500;N=[];E('rlRound')(lr,N);ok(lr.core.L/lr.core.d<=36&&lr.v0<=1810,'a long rod cannot be 3 m long or fly at 2500 m/s (L/D '+(lr.core.L/lr.core.d).toFixed(1)+', '+Math.round(lr.v0)+' m/s)');
 const cs=cl(P0.t120m829a1);cs.id='ca4';N=[];E('rlRound')(cs,N);ok(Math.abs(cs.v0-P0.t120m829a1.v0)<1&&Math.abs(cs.core.L-P0.t120m829a1.core.L)<1,'a straight copy of a real round keeps its numbers');
 /* 材料 */
 const ma=cl(LAL.MATS.find(m=>m.id==='rha'));ma.id='cmat1';ma.n='神鋼';ma.ys=90000;ma.uts=99000;ma.bhn=5000;ma.usd=0.01;ma.rho=1;N=[];E('rlMat')(ma,N);
 const spm=Math.max(...LAL.MATS.filter(m=>m.cat==='metal'&&m.ys>0).map(m=>m.ys/m.rho));ok(ma.ys/ma.rho<=spm*1.06&&ma.rho>=1.5&&ma.usd>=1,'a metal cannot be lighter than the lightest real metal, stronger per kilogram than the best one, or nearly free (rho '+ma.rho.toFixed(2)+', ys '+Math.round(ma.ys)+' MPa, '+ma.usd.toFixed(2)+' USD/kg)');
 /* 模組 */
 const en=cl(LVL.MODS.find(m=>m.sl==='eng'));en.id='cmod1';en.hp=100000;en.kg=10;en.dy=1;N=[];E('rlMod')(en,N);const ens=LVL.MODS.filter(m=>m.sl==='eng'),hpk=Math.max(...ens.map(m=>m.hp/m.kg));
 ok(en.hp<=Math.max(...ens.map(m=>m.hp))*1.1+1&&en.hp/en.kg<=hpk*1.06,'an engine cannot give 100 000 hp from 10 kg (now '+Math.round(en.hp)+' hp, '+Math.round(en.kg)+' kg)');
 /* 導引彈藥 */
 const mu=cl(LVL.MUN.find(m=>m.t==='aam'));mu.id='cm1';mu.rng=5000;mu.pk=1;mu.kg=10;mu.dy=1;N=[];E('rlMun')(mu,N);ok(mu.rng<=420&&mu.pk<1&&mu.kg>50,'an air-to-air missile cannot reach 5000 km, never miss and weigh 10 kg ('+mu.rng+' km, pk '+mu.pk+', '+mu.kg+' kg)');
 /* 核彈頭與毒劑 */
 const nw={n:'口袋核彈',k:'th',Y:1000,b:'air',kg:1,usd:1,y:1946};N=[];E('rlNuke')(nw,N);ok(nw.k==='fis'&&nw.kg>500,'a 1946 warhead cannot be thermonuclear or weigh 1 kg ('+nw.k+', '+nw.kg+' kg)');
 const ag={n:'超毒',c:'c',y:1920,k:50,l:1,p:999,life:999,mk:0,st:0};N=[];E('rlAgent')(ag,N);ok(ag.k<=2&&ag.mk>0.3,'a 1920 chemical agent is no more toxic than real ones and masks still help (toxicity '+ag.k+', mask '+ag.mk+')');
 /* 武器 */
 G.wpns={cw1:Object.assign(cl(E('WPNO').asr2),{k:'cw1',n:'神槍',pP:50,pA:50,pen:20,rE:9e4,usd:1,crew:0})};N=E('rlAll')(G);const w=G.wpns.cw1;
 ok(Math.abs(w.pP-E('WPNO').asr2.pP)<0.01&&w.pen<=2&&w.rE<1000&&w.dz&&w.dz.b==='asr2','typed-in numbers on a copied rifle are replaced by its design ('+w.pP+', pen '+w.pen+', '+w.rE+' m)');
 G.wpns={cw2:{k:'cw2',n:'重彈步槍',cat:'步槍',dz:{b:'asr2',rof:1,bl:1.2},am:[['ca2',1]]}};G.ammo={ca2:r2};E('rlAll')(G);const w2=G.wpns.cw2;
 ok(w2.pP>E('WPNO').asr2.pP&&w2.pP<E('WPNO').asr2.pP*2&&w2.usd>E('wUsd')(E('WPNO').asr2),'a rifle designed around a heavier bullet and a longer barrel hits a bit harder and costs more ('+w2.pP+' vs '+E('WPNO').asr2.pP+')');
 G.wpns={mbt2:Object.assign(cl(E('WPNO').mbt2),{pA:9})};N=E('rlAll')(G);ok(G.wpns.mbt2.pA===E('WPNO').mbt2.pA&&N.some(s=>/內建武器/.test(s)),'built-in weapons cannot be edited in place');
 /* 單位類型 */
 const base=E('UT').ri1985||Object.values(E('UT')).find(t=>t.br==='inf');G.types={c1:Object.assign(cl(base),{k:'c1',n:'超人步兵',cus:1,sa:500,arm:14,spot:99999,fl:base.fl+'tPx'})};N=E('rlAll')(G);const t=G.types.c1;
 ok(t.sa<=base.sa*2+0.1&&t.arm===base.arm&&t.spot===base.spot&&t.fl===base.fl&&t.n==='超人步兵','a custom type keeps its template\'s combat numbers and flags, but its own name ('+t.sa+', armour '+t.arm+')');
 /* 型號 */
 const vb=E('VMR').find(m=>m.c==='mbt'&&m.m);G.vms={cv1:Object.assign(cl(vb),{k:'cv1',n:'無敵戰車',cus:1,arm:20,vr:200,t:5,usd:1,from:vb.k})};N=E('rlAll')(G);const vm=G.vms.cv1;
 ok(vm.arm===vb.arm&&vm.vr===vb.vr&&vm.t===vb.t&&vm.usd>=vb.usd,'a custom vehicle model keeps its template\'s armour, speed, weight and price');
 /* 編制：武器多於人員 */
 G.wpns={};G.types={};G.vms={};const u=G.units.find(x=>E('isLeaf')(x)&&(x.men0||0)>20&&E('ST')(x).dom==='land');if(!u.lg)E('logInit')(u);E('logRecalc')(u);const p0=u.lg.wpnF.p;const k0=u.lg.w[0][0];u.lg.w=u.lg.w.map(x=>[x[0],x[1]*10]);E('logRecalc')(u);
 ok(u.lg.wpnF.man>0&&u.lg.wpnF.man<0.2,'ten times the weapons do not mean ten times the fire: only what the men can work counts (×'+(u.lg.wpnF.p/p0).toFixed(2)+')');
 /* 伺服器讀檔 */
 const S=require(process.env.BSRV||'./bsim.js');await S.E('mpQuick')('s1985','real-b');const g2=S.getG();g2.wpns={cw9:Object.assign(cl(S.E('WPNO').gpmg),{k:'cw9',n:'作弊機槍',pP:40})};g2.ammo={ca9:Object.assign(cl(P0.r762m80),{id:'ca9',v0:5000,ref:0})};
 const sv=JSON.parse(await S.E('saveText')());await S.E('mpLoad')(sv);const g3=S.getG();ok(g3.wpns.cw9.pP<1&&g3.ammo.ca9.v0<1100&&(g3.rlN||[]).length>0,'the server checks an uploaded save the same way ('+g3.wpns.cw9.pP+', '+Math.round(g3.ammo.ca9.v0)+' m/s)');
 /* 聯機收到型號：設計型號由伺服器重算，自訂型號沿用藍本 */
 await S.E('mpQuick')('s1985','real-c');const g4=S.getG();const F=S.E('MPFN').vmPut;const dl=S.E('LVL').DES.find(d=>d.br==='l');const good=S.E('vdModel')(dl.id);
 const fake=Object.assign(cl(good),{arm:19,vr:150});F[1]([fake,null,{d:cl(dl)}]);ok(g4.vms['lv:'+dl.id]&&g4.vms['lv:'+dl.id].arm===good.arm&&g4.vms['lv:'+dl.id].vr===good.vr,'a design model sent with false armour and speed is recomputed by the server ('+g4.vms['lv:'+dl.id].arm+')');
 const d2=Object.assign(cl(dl),{id:'u_test1',n:'玩家的設計'});const mods={};const bigEng=Object.assign(cl(S.E('LVL').MODS.find(m=>m.sl==='eng'&&m.br==='l')),{id:'eng.cheat',hp:99999,kg:5,dy:1});mods['eng.cheat']=bigEng;
 d2.sel=Object.assign({},d2.sel||{},{eng:'eng.cheat'});const ok2=F[1]([{k:'lv:u_test1',n:'x'},null,{d:d2,mods:mods}]);ok(ok2&&g4.vmods['eng.cheat']&&g4.vmods['eng.cheat'].hp<5000&&g4.vmods['eng.cheat'].kg>500,'a player\'s own design is accepted with its custom engine checked first ('+(g4.vmods['eng.cheat']&&Math.round(g4.vmods['eng.cheat'].hp))+' hp, '+(g4.vmods['eng.cheat']&&Math.round(g4.vmods['eng.cheat'].kg))+' kg)');
 const vb2=S.E('VMR').find(m=>m.c==='mbt'&&m.m);F[1]([Object.assign(cl(vb2),{k:'cv77',n:'作弊戰車',cus:1,arm:20,vr:300,from:vb2.k}),null]);ok(g4.vms.cv77&&g4.vms.cv77.arm===vb2.arm&&g4.vms.cv77.vr===vb2.vr,'a custom model sent with false numbers keeps its template\'s armour and speed');
})().catch(e=>{console.log('FAIL exception',e&&e.stack);process.exitCode=1;});
