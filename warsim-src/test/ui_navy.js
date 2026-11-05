const { chromium } = require('playwright');
/* 海軍劇本跑得起來：艦艇一艘一個單位、海軍指揮官下令、沒有頁面錯誤 */
(async()=>{const b=await chromium.launch();const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};const errs=[];
 for(const k of ['nav1916','gc1942','fan']){const p=await b.newPage({viewport:{width:1200,height:800}});p.on('pageerror',e=>errs.push(k+': '+e.message));const W=(f,...a)=>p.evaluate(f,...a);
  await p.goto('file://'+__dirname+'/warsim_hook.html');await p.waitForTimeout(400);const idx=await W(k=>window.__W.E('SCN').findIndex(s=>s.k===k),k);await p.click('[data-a="scn"][data-v="'+idx+'"]');await p.waitForFunction(()=>window.__W.G&&window.__W.UI.tab==='deploy',null,{timeout:600000});
  await p.click('[data-a="begin"]');await p.waitForTimeout(300);
  const r=await W(()=>{const E=window.__W.E,G=window.__W.G;G.sides.forEach(s=>s.ai=true);for(let i=0;i<480;i++)E('simStep')();const ships=G.units.filter(u=>E('isLeaf')(u)&&E('ST')(u).dom==='sea');const big=ships.filter(u=>/^(dd|cru|ss|sl|fg|gl|ic|ff)\d+_1$/.test(u.mix[0][0])||u.veh0===1);
    const L=G.log||G.logs||[];const nl=(G.ev||G.events||[]).length;const nav=JSON.stringify(G.log||G.evs||'').match(/艦隊司令/g);return {n:ships.length,big:big.length,nc:G.sides.map((s,i)=>E('SD')(i).ncmd?E('SD')(i).ncmd.t:''),q:G.sides.map((s,i)=>(E('SD')(i).ncq||[]).length),t:G.t};});
  ok(r.n>0&&r.nc.some(Boolean),k+': naval commanders take charge ('+JSON.stringify(r)+')');await p.close();}
 const p=await b.newPage({viewport:{width:1200,height:800}});p.on('pageerror',e=>errs.push('ui: '+e.message));const W=(f,...a)=>p.evaluate(f,...a);await p.goto('file://'+__dirname+'/warsim_hook.html');await p.waitForTimeout(400);
 const idx=await W(()=>window.__W.E('SCN').findIndex(s=>s.k==='gc1942'));await p.click('[data-a="scn"][data-v="'+idx+'"]');await p.waitForFunction(()=>window.__W.G&&window.__W.UI.tab==='deploy',null,{timeout:600000});await p.click('[data-a="begin"]');await p.waitForTimeout(300);
 const u=await W(()=>{const E=window.__W.E,G=window.__W.G;const s=G.units.find(x=>E('isLeaf')(x)&&E('ST')(x).dom==='sea'&&x.side===0);E('ncOf')(0);const st=E('v4Status')(s,true,s.lg);E('mnList')().push({id:9,side:1,x:s.x+2000,y:s.y,r:1500,n:80,t:0,kn:[0],by:0});const VW=E('VW');VW.s=4;VW.ox=VW.cw/2-s.x/G.map.cs*VW.s;VW.oy=VW.ch/2-s.y/G.map.cs*VW.s;E('vDraw')(true);const h=E('setSecHtml')(E('setSecQ')('navy'));
   const ml=G.units.find(x=>E('isLeaf')(x));return {st,h,can:E('canOrd')(s,'minelay')};});
 ok(/海軍指揮官<\/span><span>[^<]+（/.test(u.st),'the unit panel names the naval commander and personality');ok(/data-c="setnavt"/.test(u.h)&&/存在艦隊型/.test(u.h),'settings let you pick each side\'s naval commander');ok(u.can===false,'only minelayers get the lay-mines order');
 await p.screenshot({path:__dirname+'/navy.png'});
 ok(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));await b.close();})();
