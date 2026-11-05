const { chromium } = require('playwright');
/* 排與組的地圖顯示：中等放大畫排，再放大畫組；組平滑移到戰術位置；面板寫出目前的動作；沒有頁面錯誤 */
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 const W=(f,...a)=>p.evaluate(f,...a);const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
 await p.goto('file://'+__dirname+'/warsim_hook.html');await p.waitForTimeout(500);
 const idx=await W(()=>window.__W.E('SCN').findIndex(s=>s.k==='s1985'));await p.click('[data-a="scn"][data-v="'+idx+'"]');await p.waitForFunction(()=>window.__W.G&&window.__W.UI.tab==='deploy',null,{timeout:600000});
 await p.click('[data-a="begin"]');await p.waitForTimeout(500);
 const zoom=async(px)=>W(px=>{const E=window.__W.E,G=window.__W.G,VW=E('VW'),U=G.units.find(x=>x.side===0&&E('pltOK')(x)&&E('isLeaf')(x)&&E('ST')(x).dom==='land');const W=Math.max(120,E('frontW')(U)*0.8);
   VW.s=px/W*G.map.cs;VW.ox=VW.cw/2-U.x/G.map.cs*VW.s;VW.oy=VW.ch/2-U.y/G.map.cs*VW.s;window.__W.UI.sel=[U.id];E('vDraw')(true);E('vDraw')(true);return {id:U.id,n:(VW._plt||[]).filter(q=>q.u.id===U.id).length};},px);
 const a=await zoom(90),bq=await zoom(260);const np=await W(id=>window.__W.E('pltLive')(window.__W.E('uById')(id)).length,a.id),ns=await W(id=>window.__W.E('sqPos')(window.__W.E('uById')(id)).length,a.id);
 ok(a.n===np,'at medium zoom each platoon is drawn ('+a.n+')');ok(bq.n===ns&&ns>np,'zoomed in further each squad and team is drawn ('+bq.n+')');
 await p.screenshot({path:__dirname+'/sqd_zoom.png'});
 const mv=await W(id=>{const E=window.__W.E,G=window.__W.G,u=E('uById')(id);u.trn=90;u.ord=E('newOrder')('attack',{x:u.x+5000,y:u.y});const V=E('SQV')[id];const p0=V?V.P.map(q=>q.slice()):null;G.t+=Math.max(60,240-E('sqTrn')(u));for(let i=0;i<5;i++)E('vDraw')(true);const p1=E('SQV')[id].P;let d=0;if(p0)p0.forEach((q,i)=>{d=Math.max(d,Math.hypot(q[0]-p1[i][0],q[1]-p1[i][1]));});return d;},a.id);
 ok(mv>1,'the squads move towards their new places instead of jumping ('+mv.toFixed(1)+' m in a few frames)');
 const h=await W(id=>window.__W.E('pltBlock')(window.__W.E('uById')(id)),a.id);ok(/排與組目前的動作：交替掩護前進/.test(h),'the unit panel names the current drill');
 await p.click('[data-a="run"]');await p.waitForTimeout(1500);ok(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));await b.close();})();
