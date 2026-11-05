const { chromium } = require('playwright');
/* 獨立的裝備編輯器：建立工作區、只有裝備庫；「匯入匯出」逐類匯出（武器裝備檔、LatoArmory 程式庫）、匯入前列出內容並只匯入勾選的；飛彈也帶得走；超模的設計被限制；主程式也有這個分頁；沒有頁面錯誤 */
(async()=>{const b=await chromium.launch();const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};const errs=[];
 const ctx=await b.newContext({acceptDownloads:true,viewport:{width:1200,height:800}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));const W=(f,...a)=>p.evaluate(f,...a);
 await p.goto('file://'+__dirname+'/warsim_arm_hook.html');await p.waitForTimeout(500);
 ok(await W(()=>document.title==='LatoWarsim 裝備編輯器'&&!window.__W.E('TABS').some(t=>t[0]==='orbat'||t[0]==='play')),'the equipment editor has no order of battle or battle pages');
 await p.fill('input[data-c="aedy"]','1985');await p.dispatchEvent('input[data-c="aedy"]','change');await p.click('[data-a="aednew"]');await p.waitForFunction(()=>window.__W.G&&window.__W.G.set,null,{timeout:120000});await p.waitForTimeout(300);
 ok(await W(()=>window.__W.G.set.y===1985&&/1985 年/.test(document.body.textContent)),'a 1985 workspace is created');
 /* 設計：毒劑、核彈頭、飛彈 */
 await W(()=>{const E=window.__W.E;E('ACT').cbanew();E('ACT').nwhnew();E('ACT').armnew();E('UI').wdlg&&E('UI').wdlg.remove();});
 const h=await W(()=>{const E=window.__W.E;E('armoryDlg')('io');const t=E('UI').wdlg.textContent;return {t,H:E('aioHave')()};});
 ok(h.H.cba===1&&h.H.nwh===1&&h.H.muns===1,'the new designs are counted ('+JSON.stringify(h.H).slice(0,80)+'…)');ok(/化學與生物毒劑/.test(h.t)&&/核彈頭/.test(h.t)&&/匯出為 LatoArmory 程式庫/.test(h.t),'the import/export tab lists each category');
 /* 只匯出毒劑與核彈頭 */
 await W(()=>{const E=window.__W.E;E('AIOC').forEach(c=>E('AIO').sel[c[0]]=false);E('AIO').sel.cba=true;E('AIO').sel.nwh=true;});
 const [dl]=await Promise.all([p.waitForEvent('download'),W(()=>window.__W.E('ACT').aioexp())]);const fp=await dl.path();const D=JSON.parse(require('fs').readFileSync(fp,'utf8'));
 ok(D.format==='LatoWarArms'&&Object.keys(D.cba||{}).length===1&&Object.keys(D.nwh||{}).length===1&&!D.muns&&!Object.keys(D.wpns||{}).length,'only the ticked categories are exported');
 await W(()=>{const E=window.__W.E;E('AIO').sel.muns=true;});const [dl2]=await Promise.all([p.waitForEvent('download'),W(()=>window.__W.E('ACT').aiolat())]);const L=JSON.parse(require('fs').readFileSync(await dl2.path(),'utf8'));
 ok(L.format==='LatoArmory'&&L.v===2&&Object.keys(L.muns).length===1&&Object.keys(L.cba).length===1,'designs can be saved as a LatoArmory library');
 const [dl3]=await Promise.all([p.waitForEvent('download'),W(()=>{const E=window.__W.E;E('AIOC').forEach(c=>E('AIO').sel[c[0]]=true);E('ACT').aioexp();})]);const A=JSON.parse(require('fs').readFileSync(await dl3.path(),'utf8'));
 ok(Object.keys(A.muns||{}).length===1,'equipment files now carry missiles, torpedoes and bombs too');
 /* 新的工作區：匯入時先列出，只匯入勾選的 */
 await W(()=>{const E=window.__W.E;window.__W.E('UI').wdlg&&window.__W.E('UI').wdlg.remove();});await W(()=>{window.confirm=()=>true;});await p.click('[data-a="aedclose"]');await p.click('[data-a="aednew"]');await p.waitForFunction(()=>window.__W.G&&window.__W.G.set&&!(window.__W.G.cba&&Object.keys(window.__W.G.cba).length),null,{timeout:120000});
 const im=await W(D=>{const E=window.__W.E;E('armoryDlg')('io');E('AIO').f={D:D,name:'a.latoarms.json'};E('AIO').fsel={};E('armoryDlg')('io');const t=E('UI').wdlg.textContent;E('AIO').fsel.nwh=false;E('ACT').aioimp();const G=window.__W.G;return {t,cba:Object.keys(G.cba||{}).length,nwh:Object.keys(G.nwh||{}).length,mu:Object.keys(G.muns||{}).length,msg:E('AIO').msg};},A);
 ok(/檔案裡/.test(im.t)&&/核彈頭/.test(im.t)&&/武器裝備檔/.test(im.t),'before importing, the file\'s contents are listed by category');ok(im.cba===1&&im.mu===1&&im.nwh===0,'only the ticked categories are imported ('+im.msg+')');
 const lt=await W(L=>{const E=window.__W.E;E('AIO').f={D:L,name:'lato-armory-library.json'};E('AIO').fsel={};E('ACT').aioimp();const G=window.__W.G;return {nwh:Object.keys(G.nwh||{}).length,msg:E('AIO').msg};},L);ok(lt.nwh===1,'a LatoArmory library imports too ('+lt.msg+')');
 const rl=await W(()=>{const E=window.__W.E;const X={format:'LatoWarArms',v:1,wpns:{},types:{},muns:{zz1:{id:'zz1',n:'超級飛彈',t:'agm',kg:5,wh:4,rng:5000,mach:40,pk:1,pl:'a',cus:1,dy:1}}};E('AIO').f={D:X,name:'x.json'};E('AIO').fsel={};E('ACT').aioimp();const m=Object.values(window.__W.G.muns).find(q=>q.n==='超級飛彈');return {m,msg:E('AIO').msg};});
 ok(rl.m&&(rl.m.mach<40||rl.m.rng<5000||rl.m.kg>5),'an impossible missile is brought within real limits ('+(rl.m?'Mach '+rl.m.mach+'、'+rl.m.rng+' km、'+rl.m.kg+' kg':'missing')+')');
 await p.screenshot({path:__dirname+'/armio.png'});
 /* 主程式也有「匯入匯出」 */
 const p2=await ctx.newPage();p2.on('pageerror',e=>errs.push(e.message));await p2.goto('file://'+__dirname+'/warsim_hook.html');await p2.waitForTimeout(500);ok(await p2.evaluate(()=>window.__W.E('ARTABS').some(t=>t[0]==='io')),'the simulator\'s equipment library has the same tab');
 ok(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));await b.close();})();
