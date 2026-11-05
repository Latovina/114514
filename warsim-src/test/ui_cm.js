const { chromium } = require('playwright');
/* 特效：熱焰彈亮點與白煙、干擾絲雲、火焰噴射器的火舌（近距離才畫），沒有頁面錯誤 */
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 const W=(f,...a)=>p.evaluate(f,...a);const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
 await p.goto('file://'+__dirname+'/warsim_hook.html');await p.waitForTimeout(500);
 const idx=await W(()=>window.__W.E('SCN').findIndex(s=>s.k==='s1985'));await p.click('[data-a="scn"][data-v="'+idx+'"]');await p.waitForFunction(()=>window.__W.G&&window.__W.UI.tab==='deploy',null,{timeout:600000});
 await p.click('[data-a="begin"]');await p.waitForTimeout(500);
 const n=async f=>W(f);
 const r=await W(()=>{const E=window.__W.E,G=window.__W.G,FX=E('FX');FX.lvl=2;const cnt=()=>FX.P.length+FX.nb.length;const u=G.units.find(x=>E('isLeaf')(x)&&x.side===0&&E('ST')(x).dom==='land');
   const c0=cnt();E('FXS').flare({k:'flare',a:u,x1:u.x,y1:u.y,c:'ir'});const c1=cnt();E('FXS').flare({k:'flare',a:u,x1:u.x,y1:u.y,c:'rad'});const c2=cnt();
   const t=G.units.find(x=>E('isLeaf')(x)&&x.side===1&&E('ST')(x).dom==='land');if(!u.lg)E('logInit')(u);u.lg.w=u.lg.w.concat([['flm',4]]);
   const c3=cnt();E('FXS').fire({k:'fire',a:u,b:t,x0:u.x,y0:u.y,x1:u.x+120,y1:u.y,m:1});const c4=cnt();const fb=FX.nb.slice(c3-FX.P.length).filter(q=>q.c==='#FF8F00'||q.c==='#FFD54F').length;
   const c5=cnt();E('FXS').fire({k:'fire',a:u,b:t,x0:u.x,y0:u.y,x1:u.x+2000,y1:u.y,m:1});const far=FX.nb.slice(c5-FX.P.length).filter(q=>q.c==='#FF8F00'||q.c==='#FFD54F').length;
   return {flare:c1-c0,chaff:c2-c1,flame:c4-c3,fb,far};});
 ok(r.flare>=10,'flares draw a string of bright points with smoke ('+r.flare+' particles)');ok(r.chaff>=1&&r.chaff<r.flare,'chaff is a small grey cloud ('+r.chaff+')');
 ok(r.fb>=4,'a flamethrower at close range draws a jet of flame ('+r.fb+' flame streaks)');ok(r.far===0,'at 2 km there is no flame jet, only the other weapons');
 await p.click('[data-a="run"]');await p.waitForTimeout(1500);ok(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 await b.close();})();
