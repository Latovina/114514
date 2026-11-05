/* ===================== 武器裝備檔（.latoarms.json）：匯出本局的自訂武器、修改過的內建武器與自訂單位類型（含圖片），
   匯入到另一局時與編制檔相同的規則合併：定義相同就共用，代號衝突或改過內建武器就另立新代號，不覆蓋現有的設定；編制檔裡的武器與類型也可以單獨匯入 ===================== */
var ARMFMT='LatoWarArms';
/* opt.w：要匯出的武器代號（預設：全部自訂與修改過的）；opt.t：要匯出的自訂單位類型（預設：全部）；類型用到的自訂武器一併帶上 */
function armsExport(opt){opt=opt||{};var imgs={},imgN=0,wpns={},types={},GW=G.wpns||{},GT=G.types||{};
  var imgKey=function(src){if(!src||typeof src!=='string'||src.indexOf('data:')!==0)return '';for(var k in imgs)if(imgs[k]===src)return '@'+k;var k2='i'+(++imgN);imgs[k2]=src;return '@'+k2;};
  var useW=function(k){if(GW[k]&&!wpns[k])wpns[k]=clone(GW[k]);};
  (opt.w||Object.keys(GW)).forEach(useW);
  (opt.t||Object.keys(GT)).forEach(function(k){if(!GT[k]||types[k])return;var t=clone(GT[k]);if(t.img)t.img=imgKey(t.img);if(!t.img)delete t.img;types[k]=t;((t.load&&t.load.w)||[]).forEach(function(x){useW(x[0]);});});
  return {format:ARMFMT,v:1,saved:new Date().toISOString(),name:opt.name||'',year:(G.set&&G.set.y)||0,wpns:wpns,types:types,imgs:imgs};}
function armsCheck(D){if(!D||typeof D!=='object')return '不是武器裝備檔。';if(D.format!==ARMFMT&&D.format!==ORBFMT)return D.format==='LatoWarSave'||D.format==='LatoWarReplay'?'這是存檔或回放檔，不是武器裝備檔。':'不是武器裝備檔（格式標記不符）。';
  var nw=Object.keys(D.wpns||{}).length,nt=Object.keys(D.types||{}).length;if(!nw&&!nt)return '檔案裡沒有自訂武器或裝備（單位類型）。';if(nw>5000||nt>5000)return '檔案裡的武器或類型太多。';return null;}
/* 匯入：回傳新增、共用的數目與警告 */
function armsImport(D){var err=armsCheck(D);if(err)throw new Error(err);var warn=[],nw0=Object.keys(D.wpns||{}).length,nt0=Object.keys(D.types||{}).length,M=armsMerge(D,warn);
  if(typeof wpnChanged==='function')wpnChanged();else{G._tv=(G._tv||1)+1;G.units.forEach(function(u){if(u.lg)logRecalc(u);});}
  var ren=[];Object.keys(M.wm).forEach(function(k){if(M.wm[k]!==k)ren.push(k+'→'+M.wm[k]);});Object.keys(M.tm).forEach(function(k){if(M.tm[k]!==k)ren.push(k+'→'+M.tm[k]);});
  return {w:M.nW,t:M.nT,wSame:nw0-M.nW-warn.filter(function(x){return /^武器/.test(x);}).length,tSame:nt0-M.nT-warn.filter(function(x){return /^單位類型/.test(x);}).length,wm:M.wm,tm:M.tm,ren:ren,warn:warn};}
