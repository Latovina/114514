const { chromium } = require('playwright');
/* 八百里加急按鈕：1810 年的劇本有、按下後下一道命令以加急送出、快馬減少；設定；1943 年沒有；沒有頁面錯誤 */
(async()=>{const b=await chromium.launch();const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};const errs=[];
 const open=async(k)=>{const p=await b.newPage({viewport:{width:1300,height:800}});p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/warsim_hook.html');await p.waitForTimeout(400);
   const idx=await p.evaluate(k=>window.__W.E('SCN').findIndex(s=>s.k===k),k);await p.click('[data-a="scn"][data-v="'+idx+'"]');await p.waitForFunction(()=>window.__W.G&&window.__W.UI.tab==='deploy',null,{timeout:600000});await p.click('[data-a="begin"]');await p.waitForTimeout(400);return p;};
 const sc=await (async()=>{const p=await b.newPage();await p.goto('file://'+__dirname+'/warsim_hook.html');await p.waitForTimeout(300);const L=await p.evaluate(()=>window.__W.E('SCN').map(s=>[s.k,s.y||0,s.n]));await p.close();return L;})();
 const old=sc.find(s=>/18(0|1)\d/.test(s[2]))||sc.find(s=>/17\d\d/.test(s[2]));const p=await open(old[0]);
 await p.evaluate(()=>{const E=window.__W.E;E('UI').side=0;E('barRender')();});const btn=await p.$('[data-k="exp"]');ok(!!btn,'a '+old[2]+' battle shows the express-courier button');
 await p.click('[data-k="exp"]');const r=await p.evaluate(()=>{const E=window.__W.E,G=window.__W.G;const u=G.units.find(x=>x.side===0&&E('isLeaf')(x)&&E('alive')(x)&&E('sideCmd')(0)!==x);const n0=E('expLeft')(0);E('issue')(u,'move',{x:u.x+500,y:u.y});const m=G.msgs.find(q=>q.to===u.id);return {arm:E('UI').expArm,n0,n1:E('expLeft')(0),via:m&&m.via};});
 ok(r.arm===false&&r.n1===r.n0-1&&r.via&&r.via[0]==='express','pressing it sends the next order by express and uses up a relay ('+JSON.stringify(r)+')');
 const h=await p.evaluate(()=>{const E=window.__W.E;return E('setSecHtml')(E('setSecQ')('exp'))+E('setSecHtml')(E('setSecQ')('dfirst'));});ok(/八百里加急/.test(h)&&/優先展開隊形/.test(h),'both can be adjusted in settings');
 await p.close();const q=await open('s1943');await q.evaluate(()=>{const E=window.__W.E;E('UI').side=0;E('barRender')();});ok(!(await q.$('[data-k="exp"]')),'in 1943 there is no express-courier button');
 await q.click('[data-a="run"]');await q.waitForTimeout(1000);ok(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));await b.close();})();
