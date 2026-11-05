/* ===================== 存檔核心（單機版與伺服器共用）：打包與讀取整場作戰
   打包分兩段：先在同一個瞬間拍下整個作戰狀態（各項資料與單位序列化成文字，地圖圖層與回放紀錄取快照），之後再分段壓縮，
   中間讓出執行緒給畫面與操作（單機版拍快照時暫停推進模擬，所以內容仍是同一個瞬間）。地圖圖層依內容、回放紀錄每 64 格一段快取壓縮結果，沒變的部分直接沿用，
   所以執行中的自動存檔通常只需要壓縮新增的紀錄。 ===================== */
var MAPTA=['el','lc','rv','rd','rl','ft','nat','dmg','tn'];
var GKEYS=['types','sides','set','t','step','log','msgs','ct','rq','cbq','obj','reinfLog','bt','stats','nid','oid','mid','lgSeq','tseq','started','over','env','firstContact','_mapv','imgs','wpns','wseq','nukes','rad','nq','sieges','lq','xings','xid','civ','press','draw','dseq','inbox','resH','meets','meetSeq','msl','mslSeq','snq','snSeq','fo','snS','snHit','fac','reg','arm','lgv','lgvSeq','tp','tpSeq','tpSusp','booms','boomQ','fac8v','aw'];
/* 地圖：一般欄位直接帶走（略過以 _ 開頭的快取與函式），圖層取快照 */
function mapSnap(MP){var m={};Object.keys(MP).forEach(function(k){if(MAPTA.indexOf(k)<0&&k!=='sd'&&k.charCodeAt(0)!==95&&typeof MP[k]!=='function')m[k]=MP[k];});m.format='LatoWarMap';
  return {m:m,L:MAPTA.filter(function(k){return MP[k];}).map(function(k){return [k,taSnap(MP[k])];})};}
async function mapFin(S){for(var i=0;i<S.L.length;i++){var q=S.L[i];if(q[1].s===undefined)await yld();S.m[q[0]]=await taFin(q[1]);}return S.m;}
async function packMap(MP){return mapFin(mapSnap(MP));}
async function unpackMap(m){if(!m||m.format!=='LatoWarMap')throw new Error('這不是作戰地圖檔。');var MP={};Object.keys(m).forEach(function(k){MP[k]=m[k];});for(var i=0;i<MAPTA.length;i++){var k=MAPTA[i];if(typeof m[k]==='string')MP[k]=await unpackTA(m[k]);}var N=MP.GW*MP.GH;if(!MP.ft)MP.ft=new Uint8Array(N);if(!MP.nat)MP.nat=new Uint8Array(N);MP.set=MP.set||[];MP.lbl=MP.lbl||[];MP.brg=MP.brg||[];return MP;}
/* 回放紀錄：每 64 格一段，各段的壓縮結果依（第一格、最後一格、格數）快取。紀錄只會在後面增加或整批抽稀，三者相同就代表內容相同 */
var RCH=64,RCC=typeof WeakMap!=='undefined'?new WeakMap():null;
function recSnap(R){if(!R||!R.fr||!R.fr.length)return null;var F=R.fr.slice(),idx=[],o=0,B=[];F.forEach(function(f){idx.push([f.t,o,f.d.length,f.wx,f.l,f.ob]);o+=f.d.length;});
  for(var i=0;i<F.length;i+=RCH){var n=Math.min(RCH,F.length-i),a=F[i],z=F[i+n-1],c=RCC&&RCC.get(a);B.push(c&&c.z===z&&c.n===n?{s:c.s}:{F:F.slice(i,i+n),a:a,z:z,n:n});}
  return {h:{v:1,dt:R.dt,q:R.q,next:R.next||0,idx:idx},B:B};}
async function recFin(S){if(!S)return null;var d=[];for(var i=0;i<S.B.length;i++){var b=S.B[i];if(b.s===undefined){await yld();var A=new Uint16Array(sum(b.F,function(f){return f.d.length;})),o=0;b.F.forEach(function(f){A.set(f.d,o);o+=f.d.length;});b.s=await packTA(A);if(RCC)RCC.set(b.a,{z:b.z,n:b.n,s:b.s});b.F=null;}d.push(b.s);}
  return Object.assign({},S.h,{d:d});}
async function packRec(R){return recFin(recSnap(R));}
/* d 是一段（舊存檔）或多段壓縮資料 */
async function unpackRec(P){if(!P||!P.d)return null;var L=[],n=0,D=Array.isArray(P.d)?P.d:[P.d];for(var i=0;i<D.length;i++){var a=await unpackTA(D[i]);L.push(a);n+=a.length;}var A=L.length===1?L[0]:new Uint16Array(n);if(L.length>1){n=0;L.forEach(function(a){A.set(a,n);n+=a.length;});}
  return {v:1,dt:P.dt,q:P.q,next:P.next||0,fr:P.idx.map(function(r){return {t:r[0],d:A.subarray(r[1],r[1]+r[2]),wx:r[3],l:r[4],ob:r[5]||[]};})};}
function unitSave(u){var c={};for(var k in u){if(k.charAt(0)==='_'||k==='path'&&!u.path)continue;c[k]=u[k];}return c;}
/* 同一瞬間拍下整場作戰：狀態序列化成文字，地圖與回放紀錄取快照（壓縮留給 gameParts）。
   slice 為真時每 8 毫秒讓出一次執行緒（呼叫的一方要在這段時間暫停推進模擬）；否則整段一次做完，期間沒有任何等待 */
async function gameSnap(slice){var P=['{"format":"LatoWarsim","v":1,"saved":'],saved=new Date().toISOString(),t0=Date.now(),put=function(k,v){if(v===undefined||typeof v==='function')return;P.push(',"'+k+'":'+JSON.stringify(v));};
  var nap=async function(){if(slice&&Date.now()-t0>8){await yld();t0=Date.now();}};P.push(JSON.stringify(saved));
  for(var i=0;i<GKEYS.length;i++){var k=GKEYS[i];put(k,k==='log'?G.log.slice(-3000):G[k]);await nap();}
  if(G.evt)put('evt',Object.assign({},G.evt,{fl:G.evt.fl?b64enc(G.evt.fl):null,fire:G.evt.fire?b64enc(G.evt.fire):null}));if(G.rdd)put('rdd',b64enc(G.rdd));put('front',packFront(G.front));
  var U=G.units.slice();P.push(',"units":[');for(i=0;i<U.length;i++){P.push((i?',':'')+JSON.stringify(unitSave(U[i])));if((i&31)===31)await nap();}P.push(']');
  var M=mapSnap(G.map),R=null;try{R=recSnap(G.rec);}catch(e){R=null;}return {saved:saved,t:G.t,started:G.started,name:G.map.name,js:P,mjs:JSON.stringify(M.m),map:M,rec:R};}
/* 壓縮並組成存檔文字（分段的字串陣列）；地圖圖層與紀錄是 base64（不需要跳脫），直接接上 */
async function gameParts(S){await mapFin(S.map);var L=S.map.L.map(function(q){return '"'+q[0]+'":"'+S.map.m[q[0]]+'"';}),rt='null';
  try{var P=await recFin(S.rec);if(P){var d=P.d;delete P.d;rt=JSON.stringify(P).slice(0,-1)+',"d":['+d.map(function(s){return '"'+s+'"';}).join(',')+']}';}}catch(e){rt='null';}
  return S.js.concat([',"map":',S.mjs.slice(0,-1)+(L.length?','+L.join(','):'')+'}',',"rec":',rt,'}']);}
async function gameText(S){return (await gameParts(S)).join('');}
async function saveText(){return gameText(await gameSnap(false));}
async function packGame(){return JSON.parse(await saveText());}
/* 模擬用的快取（路徑、地形代價、坡度） */
function simCaches(){try{PF={};PFB={};CG={};CAC.m={};CAC.n=0;CAC.rdi=null;PFE++;AS={};}catch(e){}if(G)G._slope=null;}
/* 讀取存檔：還原狀態、重建索引與快取、單位的後勤與路徑。caches 重建快取，wire 接上暫停與紀錄的處理 */
async function gameLoad(o,caches,wire){if(!o||o.format!=='LatoWarsim')throw new Error('這不是作戰模擬存檔（.latowarsim.json）。');var MP=await unpackMap(o.map);G=newGame(MP,o.set);GKEYS.forEach(function(k){if(o[k]!==undefined)G[k]=o[k];});G.units=o.units||[];G.pq=[];G._inc={};G._fx=[];G.dirty=[];
  if(!G.set.nuke)G.set.nuke={on:false,n:2,y:10,ai:false};if(G.set.autoPause&&G.set.autoPause.nuke===undefined)G.set.autoPause.nuke=true;G.rec=o.rec?await unpackRec(o.rec):null;
  if(o.evt){G.evt=o.evt;if(typeof G.evt.fl==='string')G.evt.fl=b64dec(G.evt.fl);if(typeof o.rdd==='string')G.rdd=b64dec(o.rdd);if(typeof G.evt.fire==='string')G.evt.fire=b64dec(G.evt.fire);}G.front=o.front?unpackFront(o.front):null;
  caches();reix();G._tv=(G._tv||1)+1;G._r=mb32(hstr(G.set.seed+'|sim|'+G.t));wire();
  G.units.forEach(function(u){if(!u.lg)logInit(u);else logRecalc(u);u.pq=0;if(u.goal&&!u.path&&u.task==='go')wantPath(u,u.goal[0],u.goal[1]);});dupNames();return G;}
