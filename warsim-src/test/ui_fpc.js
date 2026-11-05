const { chromium } = require('playwright');
/* 部隊點數（花費）的介面：點數視窗列出購置、維持費、後勤累積與戰力；單位明細有花費與戰力；設定可改算法、每點美元與天數；沒有頁面錯誤 */
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 const W=(f,...a)=>p.evaluate(f,...a);const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
 await p.goto('file://'+__dirname+'/warsim_hook.html');await p.waitForTimeout(500);
 const idx=await W(()=>window.__W.E('SCN').findIndex(s=>s.k==='s1985'));await p.click('[data-a="scn"][data-v="'+idx+'"]');await p.waitForFunction(()=>window.__W.G&&window.__W.UI.tab==='deploy',null,{timeout:600000});
 await p.click('[data-a="begin"]');await p.waitForTimeout(500);
 const d=await W(()=>{const E=window.__W.E;E('ptsDlg')();const t=E('UI').ptd.textContent;return {t,tip:E('ptsTip')()};});
 ok(/部隊點數依花費計算/.test(d.t)&&/購置/.test(d.t)&&/維持費（30 天）/.test(d.t)&&/後勤累積/.test(d.t),'the points window breaks unit points into purchase, upkeep and logistics');
 ok(/戰力/.test(d.t)&&/標準戰力/.test(d.t),'combat power and the standard table are still there');ok(/部隊點數（花費）：.*戰力：/.test(d.tip),'the toolbar tip shows both');
 const u=await W(()=>{const E=window.__W.E,G=window.__W.G,U=G.units.find(x=>x.side===0&&E('isLeaf')(x)&&x.veh>0);return {h:E('fpSecHtml')(U),pts:E('fpShow')(U),pw:E('fpPowShow')(U),st:E('v4Status')(U,true,U.lg)};});
 ok(/部隊點數（花費）/.test(u.h)&&/人員徵募與訓練/.test(u.h)&&/薪餉/.test(u.h)&&/彈藥/.test(u.h),'unit details list what the points are made of');ok(/<h4[^>]*>戰力<\/h4>/.test(u.h)&&u.pts!==u.pw,'and the combat power separately ('+u.pts+' points, '+u.pw+' combat power)');
 ok(/部隊點數<\/span><span>[0-9,]+（戰力 [0-9,]+）/.test(u.st),'the unit panel shows points with combat power');
 const s=await W(()=>{const E=window.__W.E,G=window.__W.G;const h=E('setSecHtml')(E('setSecQ')('pts'));const s0=E('fpSide')(0);E('CHG').setfpc({value:'1000000',getAttribute:()=>'fpUsd'});const s1=E('fpSide')(0);E('CHG').setfpc({value:'pow',getAttribute:()=>'fpm'});const s2=E('fpSide')(0),pw=E('fpPowSide')(0);E('CHG').setfpc({value:'cost',getAttribute:()=>'fpm'});return {h,s0,s1,s2,pw,m:G.set.fpm};});
 ok(/data-c="setfpc"/.test(s.h)&&/依花費/.test(s.h)&&/維持天數/.test(s.h),'settings offer the method, dollars per point and days');ok(Math.abs(s.s1-s.s0/10)<=SIDES0(s.s0),'a larger point value shrinks the totals ('+s.s0+' → '+s.s1+')');ok(s.s2===s.pw&&s.m==='cost','and points can be switched back to combat power');
 const tm=await W(()=>{const E=window.__W.E;E('UI').ptd.remove();const t0=performance.now();for(let i=0;i<5;i++){E('fpSide')(0);E('fpSide')(1);}return (performance.now()-t0)/5;});ok(tm<60,'totalling both sides is quick ('+tm.toFixed(1)+' ms, '+(await W(()=>window.__W.G.units.length))+' units)');
 await p.click('[data-a="run"]');await p.waitForTimeout(1500);ok(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));await b.close();})();
function SIDES0(v){return Math.max(2,v*0.01);}
