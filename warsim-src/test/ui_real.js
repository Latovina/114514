const { chromium } = require('playwright');
/* 只允許詳細設計：內建武器只能檢視與複製成設計；武器設計沒有可直接填的戰鬥數值；彈藥只填設計參數、超出物理會被調整；
   自訂類型的戰鬥數值鎖定在範本；LatoArmory 工具存回來的超模材料會被調整並提示；編制武器多於人員時火力不再增加 */
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1400,height:920}})).newPage();const errs=[];p.on('pageerror',e=>errs.push('pageerror: '+e.message));
 p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
 await p.addInitScript(()=>{try{localStorage.removeItem('lato-warsim-ui');localStorage.removeItem('lato-warsim-cur');}catch(e){}});
 const W=(f,...a)=>p.evaluate(f,...a);const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
 const dlg=()=>W(()=>{const d=[...document.querySelectorAll('.lw-dlg')].pop();return d?{t:d.textContent,h:d.innerHTML}:{t:'',h:''};});
 const chg=async(sel,v)=>{await W(([s,v])=>{const i=[...document.querySelectorAll('.lw-dlg')].pop().querySelector(s);i.value=v;i.dispatchEvent(new Event('change',{bubbles:true}));},[sel,v]);await p.waitForTimeout(150);};
 await p.goto('file://'+__dirname+'/warsim_hook.html');await p.waitForTimeout(500);
 const idx=await W(()=>window.__W.E('SCN').findIndex(s=>s.k==='s1985'));await p.click('[data-a="scn"][data-v="'+idx+'"]');await p.waitForFunction(()=>window.__W.G&&window.__W.UI.tab==='deploy',null,{timeout:600000});
 /* 一、內建武器：檢視，複製成設計 */
 await W(()=>window.__W.E('wpnLibDlg')());await p.waitForTimeout(200);
 await W(()=>{[...document.querySelectorAll('.lw-dlg [data-a="wled"]')].find(x=>x.getAttribute('data-v')==='asr2').click();});await p.waitForTimeout(200);let d=await dlg();
 ok(/不能直接修改/.test(d.t)&&!/data-c="wlf"/.test(d.h)&&/複製為設計/.test(d.t),'a built-in weapon opens read-only, with "copy as design"');
 await p.click('.lw-dlg [data-a="wlcp"][data-v="asr2"]');await p.waitForTimeout(250);d=await dlg();
 ok(/武器設計|新武器設計/.test(d.t)&&!/data-f="pP"/.test(d.h)&&/data-f="dz.bl"/.test(d.h)&&/換算結果/.test(d.t),'the copy is a design: barrel, rate of fire, night sight and year, no typed-in kill rates');
 const opts=await W(()=>[...document.querySelectorAll('.lw-dlg [data-k="wamadd"] option')].map(o=>o.value));const L=await W(()=>window.LatoArmoryLib.PROJ.reduce((a,P)=>{a[P.id]=P;return a;},{}));
 ok(opts.length>3&&opts.every(id=>!L[id]||L[id].g==='rifle')&&!opts.includes('t120m829a1'),'only rifle rounds of a similar calibre can be loaded into a rifle ('+opts.length+' choices)');
 await chg('[data-c="wlf"][data-f="dz.rof"]','1.5');await chg('[data-c="wlf"][data-f="dz.bl"]','1.3');
 await p.click('.lw-dlg [data-a="wlsave"]');await p.waitForTimeout(300);
 const w=await W(()=>{const G=window.__W.G,k=Object.keys(G.wpns||{}).find(k=>G.wpns[k].dz&&G.wpns[k].dz.b==='asr2');return k?JSON.parse(JSON.stringify(G.wpns[k])):null;}),B=await W(()=>JSON.parse(JSON.stringify(window.__W.E('WPNO').asr2)));
 ok(w&&w.pP>B.pP*1.2&&w.pP<B.pP*2.2,'faster fire and a longer barrel raise the derived kill rate ('+(w&&w.pP)+' vs '+B.pP+')');
 const usd=await W(k=>{const E=window.__W.E;return [E('wUsd')(E('wpnOf')(k)),E('wUsd')(E('WPNO').asr2)];},w.k);ok(usd[0]>usd[1]*1.2,'and the weapon costs more ('+Math.round(usd[0])+' vs '+Math.round(usd[1])+' USD)');
 /* 二、彈藥：沒有價格欄，超出物理會被調整 */
 await W(()=>{document.querySelectorAll('.lw-dlg').forEach(x=>x.remove());window.__W.E('armoryDlg')('a');});await p.waitForTimeout(600);
 await W(()=>{[...document.querySelectorAll('.lw-dlg [data-a="aradet"]')].find(x=>x.getAttribute('data-v')==='r762m80').click();});await p.waitForTimeout(300);
 await p.click('.lw-dlg [data-a="aracp"]');await p.waitForTimeout(300);d=await dlg();ok(!/data-f="ref"/.test(d.h)&&!/data-f="rw"/.test(d.h)&&!/data-f="bc"/.test(d.h)&&/由設計算出/.test(d.t),'the round editor has no price, weight or ballistic-coefficient fields');
 await chg('[data-c="araf"][data-f="v0"]','4000');d=await dlg();const P=await W(()=>{const G=window.__W.G,k=Object.keys(G.ammo||{}).pop();return JSON.parse(JSON.stringify(G.ammo[k]));});
 ok(P.v0<1200&&/已依現實限制調整/.test(d.t),'a 7.62 mm bullet at 4000 m/s is cut back to what a chamber can do ('+Math.round(P.v0)+' m/s) and the editor says so');
 /* 三、自訂類型：戰鬥數值沿用範本 */
 await W(()=>{document.querySelectorAll('.lw-dlg').forEach(x=>x.remove());window.__W.E('typesDlg')();});await p.waitForTimeout(200);
 await W(()=>{const s=document.querySelector('.lw-dlg [data-k="tybase"]');s.value=window.__W.E('UT').ri1985?'ri1985':s.options[0].value;});await p.click('.lw-dlg [data-a="tynew"]');await p.waitForTimeout(300);d=await dlg();
 ok(!/data-c="tyf" data-f="sa"/.test(d.h)&&!/data-c="tyf" data-f="arm"/.test(d.h)&&/沿用範本/.test(d.t),'the type editor has no inputs for firepower or armour');
 const ty=await W(()=>{const G=window.__W.G,k=Object.keys(G.types).pop(),t=G.types[k];t.sa=999;window.__W.E('rlType')(t,[]);return {sa:t.sa,base:window.__W.E('typeOf')(t.bt).sa};});ok(Math.abs(ty.sa-ty.base)<0.1,'firepower typed into the data is put back to the template ('+ty.sa+')');
 /* 四、LatoArmory 工具存回來的超模材料 */
 const mt=await W(()=>{const G=window.__W.G,E=window.__W.E,L=E('LAH');const v=L.store('latoArmory.v1');const m=JSON.parse(JSON.stringify(window.LatoArmoryLib.MATS.find(x=>x.id==='rha')));m.id='mx1';m.n='奇蹟鋼';m.ys=50000;m.usd=0.01;v.mats.push(m);L.store('latoArmory.v1',v);return JSON.parse(JSON.stringify(G.mats.mx1));});
 await p.waitForTimeout(300);const toast=await W(()=>[...document.querySelectorAll('.lw-toast,.lw-tst,[class*="toast"]')].map(x=>x.textContent).join('|'));
 const best=await W(()=>Math.max(...window.LatoArmoryLib.MATS.filter(m=>m.cat==='metal'&&m.ys>0).map(m=>m.ys)));ok(mt.ys<=best*1.06&&mt.usd>1,'a material saved from the LatoArmory tool is brought back within real limits ('+Math.round(mt.ys)+' MPa, '+mt.usd.toFixed(2)+' USD/kg)');ok(/現實限制/.test(toast),'and the player is told');
 /* 五、編制：武器多於人員 */
 const man=await W(()=>{const G=window.__W.G,E=window.__W.E;const u=G.units.find(x=>E('isLeaf')(x)&&x.side===0&&(x.men0||0)>20&&E('ST')(x).dom==='land');if(!u.lg)E('logInit')(u);E('logRecalc')(u);const p0=u.lg.wpnF.p;u.lg.w=u.lg.w.map(x=>[x[0],x[1]*8]);E('logRecalc')(u);return {r:u.lg.wpnF.p/p0,m:u.lg.wpnF.man};});
 ok(man.m>0&&man.r>=0.95&&man.r<1.6,'eight times the weapons barely add fire: the men can only work so many ('+man.r.toFixed(2)+'×)');
 ok(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 await b.close();})();
