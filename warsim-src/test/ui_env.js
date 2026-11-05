const { chromium } = require('playwright');
/* 積雪畫在地圖上、滑鼠提示、原駐地氣候的設定、沒有頁面錯誤 */
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 const W=(f,...a)=>p.evaluate(f,...a);const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
 await p.goto('file://'+__dirname+'/warsim_hook.html');await p.waitForTimeout(500);
 const idx=await W(()=>window.__W.E('SCN').findIndex(s=>s.k==='s1943'));await p.click('[data-a="scn"][data-v="'+idx+'"]');await p.waitForFunction(()=>window.__W.G&&window.__W.UI.tab==='deploy',null,{timeout:600000});
 await p.click('[data-a="begin"]');await p.waitForTimeout(500);
 const r=await W(()=>{const E=window.__W.E,G=window.__W.G,S=E('snGrid')();const img=E('ensureImg')();const MP=G.map,Sc=img.S||2,Wd=MP.GW*Sc;
   const px=(cx,cy)=>{const d=img.ctx.getImageData(cx*Sc,cy*Sc,1,1).data;return d[0]+d[1]+d[2];};let k=-1;for(let i=0;i<S.d.length;i++){const bx=(i%S.bw)*16+8,by=Math.floor(i/S.bw)*16+8;if(bx<MP.GW&&by<MP.GH&&!E('isWater')(MP.lc[by*MP.GW+bx])){k=i;break;}}
   const bx=(k%S.bw)*16+8,by=Math.floor(k/S.bw)*16+8,b0=px(bx,by);S.d[k]=80;S.v++;E('SNR').t=0;E('ensureImg')();const b1=px(bx,by);S.m[k]=0.9;S.d[k]=0;G.env.T=8;E('SNR').t=0;E('ensureImg')();const b2=px(bx,by);
   const tip=E('cellTip')((bx+0.5)*MP.cs,(by+0.5)*MP.cs);return {b0,b1,b2,tip};});
 ok(r.b1>r.b0+60,'snow is painted into the map itself (brightness '+r.b0+' → '+r.b1+')');ok(r.b2<r.b1-100,'and meltwater mud darkens it ('+r.b2+')');ok(/泥濘|爛泥/.test(r.tip),'the hover tip names the mud');
 await W(()=>window.__W.E('setSecRe')&&0);const h=await W(()=>window.__W.E('setSecHtml')(window.__W.E('setSecQ')('clm')));ok(/戰區氣候/.test(h)&&/寒帶/.test(h)&&/data-c="clmhome"/.test(h),'settings let each side choose its home climate');
 await W(()=>{const E=window.__W.E;E('CHG').clmhome({value:'cold',getAttribute:()=>'0'});});ok(await W(()=>window.__W.G.sides[0].home==='cold'),'choosing it is stored on the side');
 await p.click('[data-a="run"]');await p.waitForTimeout(1500);ok(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));await b.close();})();
