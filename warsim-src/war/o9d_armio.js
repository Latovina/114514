/* ===================== 裝備的匯入匯出（裝備庫的「匯入匯出」分頁）與獨立的裝備編輯器（lato-warsim-armory.html；聯機伺服器的 /armory） =====================
   匯出：逐類勾選——武器、魔法武器、單位類型、彈藥（LatoArmory 彈丸）、飛彈魚雷與炸彈、材料、裝甲設計、支援裝備、載具設計、載具型號、化學與生物毒劑、核彈頭、糧食、編制裝備表、自訂幣種；
         存成武器裝備檔（.latoarms.json），或存成獨立版 LatoArmory 的程式庫（材料、彈藥、導引彈藥、毒劑、核彈頭、魔法武器）、LatoVehicle 的載具設計檔。
   匯入：讀武器裝備檔、編制檔、LatoArmory 程式庫或 LatoVehicle 設計檔，先列出檔案裡各類的數目，勾選要的再匯入；一律經過現實限制（不能超模）。
   獨立的裝備編輯器只有裝備庫：選年代建立工作區，設計後匯出，再到模擬器（單機或聯機）或 LatoArmory 匯入。 ===================== */
var AIO={sel:{},f:null,fsel:{},msg:''};
/* 類別：k 代號、n 名稱、d 說明 */
var AIOC=[['wpns','武器','自訂與修改過的武器'],['mag','魔法武器','奇幻的法術武器'],['types','單位類型','自訂的單位類型（連同用到的武器）'],['ammo','彈藥','LatoArmory 的彈丸與彈藥設計'],['muns','飛彈、魚雷與炸彈','導引彈藥與炸彈'],
  ['mats','材料','裝甲與彈芯的材料'],['armor','裝甲設計','多層裝甲'],['seq','支援裝備','頭盔、防彈衣、夜視、主動防護……'],['vdes','載具設計','LatoVehicle 設計與模組'],['vms','載具型號','具體的車輛、飛機、艦艇型號'],
  ['cba','化學與生物毒劑','自訂毒劑'],['nwh','核彈頭','自訂核彈頭'],['foods','糧食','自訂口糧'],['toe','編制裝備表','單位類型的編制裝備'],['cur','自訂幣種','幣種與匯率']];
function aioIsMag(w){return !!(w&&(w.mag||w.cat==='奇幻'));}
function aioObjN(o){return o&&typeof o==='object'?(Array.isArray(o)?o.length:Object.keys(o).length):0;}
/* 本局各類的數目 */
function aioHave(){var W=G&&G.wpns||{},o={};o.wpns=Object.keys(W).filter(function(k){return !aioIsMag(W[k]);}).length;o.mag=Object.keys(W).filter(function(k){return aioIsMag(W[k]);}).length;
  ['types','ammo','muns','mats','armor','seq','vdes','vms','cba','nwh','foods','toe'].forEach(function(k){o[k]=aioObjN(G&&G[k]);});o.cur=typeof CUR!=='undefined'&&CUR.list?CUR.list.length:0;return o;}
/* 檔案裡各類的數目與格式 */
function aioFmt(D){if(!D||typeof D!=='object')return '';if(D.format==='LatoArmory')return 'LatoArmory 程式庫';if(D.format==='LatoVehicle'||D.design||D.designs)return 'LatoVehicle 載具設計';if(D.format===ARMFMT)return '武器裝備檔';if(D.format===ORBFMT)return '編制檔（只取武器與裝備）';return '';}
function aioFileHave(D){var o={},W=D.wpns||{};if(D.format==='LatoArmory'){o.mats=aioObjN(D.mats);o.ammo=aioObjN(D.proj||D.ammo);o.muns=aioObjN(D.muns);o.cba=aioObjN(D.cba);o.nwh=aioObjN(D.nwh);o.mag=aioObjN(D.mag);return o;}
  if(D.format==='LatoVehicle'||D.design||D.designs){o.vdes=D.designs?D.designs.length:D.design?1:0;return o;}
  o.wpns=Object.keys(W).filter(function(k){return !aioIsMag(W[k]);}).length;o.mag=Object.keys(W).filter(function(k){return aioIsMag(W[k]);}).length;
  ['types','ammo','muns','mats','armor','seq','vdes','vms','cba','nwh','foods','toe'].forEach(function(k){o[k]=aioObjN(D[k]);});o.cur=Array.isArray(D.cur)?D.cur.length:0;return o;}
/* 匯出：只留勾選的類別 */
function aioExport(sel){var W=G.wpns||{},wk=Object.keys(W).filter(function(k){return sel.wpns&&!aioIsMag(W[k])||sel.mag&&aioIsMag(W[k]);});
  var D=armsExport({w:wk,t:sel.types?Object.keys(G.types||{}):[],name:'裝備'});if(!sel.wpns&&!sel.mag&&!sel.types)D.wpns={};
  ['ammo','mats','armor','seq','vms','cba','nwh','foods','toe'].forEach(function(k){if(!sel[k])delete D[k];});if(!sel.vdes){delete D.vdes;delete D.vmods;}if(!sel.cur)delete D.cur;
  if(sel.muns&&G.muns&&Object.keys(G.muns).length)D.muns=clone(G.muns);else delete D.muns;
  if(!sel.types){D.types={};D.imgs={};}return D;}
/* 匯出成獨立版 LatoArmory 的程式庫（第 2 版） */
function aioLatExport(sel){var vals=function(o){return o?Object.keys(o).map(function(k){var x=clone(o[k]);x._u=1;return x;}):[];},mag={};
  if(sel.mag)Object.keys(G.wpns||{}).forEach(function(k){var w=G.wpns[k];if(w&&w.mag)mag[k]=Object.assign({id:k,n:w.n},w.mag);});
  return {format:'LatoArmory',v:2,set:Object.assign({},G.laSet||{},{rate:typeof CUR!=='undefined'&&CUR.rate>0?CUR.rate:2.5}),mats:sel.mats?vals(G.mats):[],proj:sel.ammo?vals(G.ammo):[],muns:sel.muns?clone(G.muns||{}):{},cba:sel.cba?clone(G.cba||{}):{},nwh:sel.nwh?clone(G.nwh||{}):{},mag:mag};}
function aioVehExport(){var L=Object.keys(G.vdes||{}).map(function(k){return clone(G.vdes[k]);});return {format:'LatoVehicle',v:1,designs:L,mods:Object.keys(G.vmods||{}).map(function(k){return clone(G.vmods[k]);})};}
/* 匯入：只取勾選的類別 */
function aioFilter(D,sel){var J=clone(D);if(J.format==='LatoArmory'){if(!sel.mats)J.mats=[];if(!sel.ammo){J.proj=[];delete J.ammo;}['muns','cba','nwh','mag'].forEach(function(k){if(!sel[k])delete J[k];});return J;}
  if(J.format==='LatoVehicle'||J.design||J.designs){if(!sel.vdes){J.designs=[];delete J.design;}return J;}
  var W=J.wpns||{};Object.keys(W).forEach(function(k){if(aioIsMag(W[k])?!sel.mag:!sel.wpns)delete W[k];});
  if(!sel.types)J.types={};if(!sel.vdes){delete J.vdes;delete J.vmods;}if(!sel.cur)delete J.cur;['ammo','muns','mats','armor','seq','vms','cba','nwh','foods','toe'].forEach(function(k){if(!sel[k])delete J[k];});return J;}
function aioImport(D,sel){var J=aioFilter(D,sel),H=aioFileHave(J),any=Object.keys(H).some(function(k){return H[k]>0;});if(!any)throw new Error('沒有勾選任何類別');
  if(J.format===ARMFMT||J.format===ORBFMT){J.format=ARMFMT;if(!J.wpns)J.wpns={};if(!J.types)J.types={};}
  var h0=aioHave(),msg=String(armImport(J)||''),h1=aioHave(),add=[],same=[];AIOC.forEach(function(c){var k=c[0];if(!(H[k]>0))return;var d=(h1[k]||0)-(h0[k]||0);if(d>0)add.push(c[1]+' '+d);else if(k!=='vdes'&&k!=='muns')same.push(c[1]);});
  var rl=/（依現實限制[^）]*）/.exec(msg);return (add.length?'已匯入：'+add.join('、'):'沒有新增的設計')+(same.length?'；'+same.join('、')+'與本局現有的相同或已更新，沒有重複加入':'')+'。'+(rl?rl[0]:'');}
/* 武器裝備檔也帶上飛彈、魚雷與炸彈 */
(function(){var b=armsExport;armsExport=function(opt){var D=b(opt);if(G.muns&&Object.keys(G.muns).length&&!D.muns)D.muns=clone(G.muns);return D;};})();
(function(){var b=armsCheck;armsCheck=function(D){var e=b(D);if(e&&D&&(D.format===ARMFMT||D.format===ORBFMT)&&(aioObjN(D.muns)||aioObjN(D.mag)))return null;return e;};})();
(function(){var b=armsImport;armsImport=function(D){var r=b(D),n=0;if(D&&D.muns&&typeof D.muns==='object'){G.muns=G.muns||{};Object.keys(D.muns).forEach(function(id){var m=D.muns[id];if(!m||typeof m!=='object'||!m.t)return;var s=JSON.stringify(m);if(G.muns[id]&&JSON.stringify(G.muns[id])===s)return;
    var nid=id;if(G.muns[id]||typeof munBuiltin==='function'&&munBuiltin(id)&&!m.cus){nid=typeof munNewId==='function'?munNewId():'um'+Date.now().toString(36)+n;}var q=clone(m);q.id=nid;G.muns[nid]=q;n++;});if(n){if(typeof munChanged==='function')Object.keys(G.muns).forEach(function(k){try{munChanged(k);}catch(e){}});}}
  if(r&&typeof r==='object')r.muns=n;return r;};})();
(function(){var b=armImport;armImport=function(J){var msg=b(J);if(J&&(J.format===ARMFMT||J.format===ORBFMT)){var H=aioFileHave(J),p=[];AIOC.forEach(function(c){if(c[0]!=='wpns'&&c[0]!=='types'&&H[c[0]])p.push(c[1]+' '+H[c[0]]);});if(p.length)msg=msg.replace(/。$/,'')+'；檔案另含 '+p.join('、')+'。';}return msg;};})();
/* ---------- 「匯入匯出」分頁 ---------- */
ARTABS.push(['io','匯入匯出']);
function aioHtml(){var H=aioHave(),o='<div class="lw-note">逐類勾選要匯出或匯入的設計。武器裝備檔可以到模擬器（單機或聯機）或這裡匯入；LatoArmory 程式庫與 LatoVehicle 設計檔可以在獨立版 LatoArmory（lato-armory.html）開啟。匯入的設計一律經過現實限制。</div>';
  o+='<h4 style="margin:8px 0 4px">匯出本局的設計</h4><table class="lw-tbl lw-aio"><tr><th></th><th>類別</th><th class="n">數量</th><th>內容</th></tr>'+AIOC.map(function(c){var n=H[c[0]]||0,on=AIO.sel[c[0]]!==undefined?AIO.sel[c[0]]:n>0;return '<tr'+(n?'':' style="opacity:.55"')+'><td><input type="checkbox" data-c="aiosel" data-v="'+c[0]+'"'+(on&&n?' checked':'')+(n?'':' disabled')+'></td><td>'+esc(c[1])+'</td><td class="n">'+n+'</td><td class="lw-note">'+esc(c[2])+'</td></tr>';}).join('')+'</table>'+
    '<div class="lw-row" style="flex-wrap:wrap;gap:4px"><button type="button" class="lw-btn sm pri" data-a="aioexp">⇩ 匯出所選（武器裝備檔）</button><button type="button" class="lw-btn sm" data-a="aiolat" title="材料、彈藥、飛彈、毒劑、核彈頭、魔法武器">⇩ 匯出為 LatoArmory 程式庫</button><button type="button" class="lw-btn sm" data-a="aioveh"'+(H.vdes?'':' disabled')+'>⇩ 匯出載具設計（LatoVehicle）</button><button type="button" class="lw-btn sm" data-a="aioall" data-v="1">全選</button><button type="button" class="lw-btn sm" data-a="aioall" data-v="0">全不選</button></div>';
  o+='<h4 style="margin:12px 0 4px">匯入</h4><div class="lw-row"><label class="lw-btn sm">⇧ 選擇檔案<input type="file" accept=".json,application/json" data-c="aiofile" hidden></label><span class="lw-note">武器裝備檔（.latoarms.json）、編制檔、LatoArmory 程式庫或 LatoVehicle 設計檔</span></div>';
  if(AIO.f){var F=aioFileHave(AIO.f.D);o+='<div class="lw-note" style="margin:4px 0">「'+esc(AIO.f.name)+'」：'+esc(aioFmt(AIO.f.D))+(AIO.f.D.year?'，'+AIO.f.D.year+' 年':'')+'</div><table class="lw-tbl lw-aio"><tr><th></th><th>類別</th><th class="n">檔案裡</th><th class="n">本局現有</th></tr>'+
    AIOC.filter(function(c){return F[c[0]]>0;}).map(function(c){var on=AIO.fsel[c[0]]!==false;return '<tr><td><input type="checkbox" data-c="aiofsel" data-v="'+c[0]+'"'+(on?' checked':'')+'></td><td>'+esc(c[1])+'</td><td class="n">'+F[c[0]]+'</td><td class="n">'+(H[c[0]]||0)+'</td></tr>';}).join('')+'</table>'+
    '<div class="lw-row"><button type="button" class="lw-btn sm pri" data-a="aioimp">⇧ 匯入所選</button><button type="button" class="lw-btn sm" data-a="aioclr">取消</button></div>';}
  if(AIO.msg)o+='<div class="lw-note" style="margin-top:6px" data-k="aiomsg">'+esc(AIO.msg)+'</div>';return o;}
(function(){var b=armoryDlg;armoryDlg=function(tab){b.apply(this,arguments);try{if(AR.tab!=='io'||!UI.wdlg)return;var el=UI.wdlg.querySelector('[data-k="armbody"]');if(el)el.innerHTML=aioHtml();}catch(e){if(window.console)console.warn('匯入匯出',e);}};})();
function aioSel(){var H=aioHave(),s={};AIOC.forEach(function(c){s[c[0]]=(H[c[0]]||0)>0&&(AIO.sel[c[0]]!==undefined?AIO.sel[c[0]]:true);});return s;}
function aioName(){return 'lato-equipment-'+((G&&G.set&&G.set.y)||'')+'.latoarms.json';}
CHG.aiosel=function(t){AIO.sel[t.getAttribute('data-v')]=t.checked;};
CHG.aiofsel=function(t){AIO.fsel[t.getAttribute('data-v')]=t.checked;};
ACT.aioall=function(b){var on=b.getAttribute('data-v')==='1';AIOC.forEach(function(c){AIO.sel[c[0]]=on;});armoryDlg('io');};
ACT.aioexp=function(){var s=aioSel();if(!Object.keys(s).some(function(k){return s[k];})){toast('沒有勾選任何有內容的類別。');return;}var D=aioExport(s);download(aioName(),JSON.stringify(D,null,1),'application/json');
  var H=aioFileHave(D);AIO.msg='已匯出：'+AIOC.filter(function(c){return H[c[0]]>0;}).map(function(c){return c[1]+' '+H[c[0]];}).join('、')+'。';armoryDlg('io');};
ACT.aiolat=function(){var s=aioSel(),D=aioLatExport(s),H=aioFileHave(D),p=AIOC.filter(function(c){return H[c[0]]>0;});if(!p.length){toast('勾選的類別裡沒有 LatoArmory 用得到的設計（材料、彈藥、飛彈、毒劑、核彈頭、魔法武器）。',4500);return;}
  download('lato-armory-library.json',JSON.stringify(D,null,1),'application/json');AIO.msg='已匯出 LatoArmory 程式庫：'+p.map(function(c){return c[1]+' '+H[c[0]];}).join('、')+'。';armoryDlg('io');};
ACT.aioveh=function(){var D=aioVehExport();if(!D.designs.length){toast('這一局沒有載具設計。');return;}download('lato-vehicle-designs.json',JSON.stringify(D,null,1),'application/json');AIO.msg='已匯出 '+D.designs.length+' 個載具設計。';armoryDlg('io');};
CHG.aiofile=function(t){var f=t.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(){try{var D=JSON.parse(rd.result);if(!aioFmt(D))throw new Error('不是武器裝備檔、編制檔、LatoArmory 或 LatoVehicle 檔');AIO.f={D:D,name:f.name};AIO.fsel={};AIO.msg='';}catch(e){AIO.f=null;AIO.msg='讀取失敗：'+e.message;}armoryDlg('io');};rd.readAsText(f);};
ACT.aioimp=function(){if(!AIO.f)return;var s={};AIOC.forEach(function(c){s[c[0]]=AIO.fsel[c[0]]!==false;});try{AIO.msg=aioImport(AIO.f.D,s);AIO.f=null;}catch(e){AIO.msg='匯入失敗：'+e.message;}armoryDlg('io');};
ACT.aioclr=function(){AIO.f=null;AIO.msg='';armoryDlg('io');};
/* ---------- 獨立的裝備編輯器 ---------- */
if(typeof ARMONLY!=='undefined'&&ARMONLY){
  TABS=[['start','開始'],['arm','裝備庫'],['set','設定'],['help','說明']];if(typeof TABI!=='undefined')TABI.arm='🛡';
  var AED={y:2000};
  var aedNew=async function(){var y=clamp(+AED.y||2000,1500,4100),GW=30,GH=24,cs=100,seed='arm'+Date.now();var S=procSampler({seed:seed,ter:'plain',clim:'temperate',Wm:GW*cs,Hm:GH*cs,lat:45});
    var MP=await genRegion({GW:GW,GH:GH,cs:cs,seed:seed,year:Math.min(y,2030),name:'裝備工作區',lat0:45,lon0:2,src:'proc',dens:0},S,function(){return Promise.resolve();});newScenario(MP,{y:Math.min(y,2030),m:6,d:1,h:8,dur:400,seed:seed});G.edit=1;show('start');toast('已建立 '+y+' 年的裝備工作區。',4000);};
  var aedCount=function(){var H=aioHave();return AIOC.filter(function(c){return H[c[0]]>0;}).map(function(c){return c[1]+' '+H[c[0]];}).join('、')||'還沒有自訂的設計';};
  PAGES.start=function(host){var o='<div class="lw-main"><div class="lw-card"><h3>LatoWarsim 裝備編輯器</h3><div class="lw-note">專門設計與交換裝備：武器、彈藥、飛彈魚雷與炸彈、材料與裝甲、支援裝備、載具、化學與生物毒劑、核彈頭與魔法武器（含完整的 LatoArmory 工具）。設計受現實限制，不能超模。完成後在「匯入匯出」逐類匯出，到模擬器（單機或聯機）或 LatoArmory 匯入；也可以匯入別人的檔案來修改。</div>';
    if(!G)o+='<div class="lw-opt" style="margin-top:8px"><span>年代</span><label><input type="number" min="1500" max="4100" value="'+AED.y+'" data-c="aedy" style="width:90px"> 年（決定可用的技術、材料與現實上限）</label></div><div class="lw-row" style="margin-top:6px"><button type="button" class="lw-btn pri" data-a="aednew">建立工作區</button></div>';
    else o+='<div class="lw-kv" style="margin-top:8px"><span>工作區</span><span>'+G.set.y+' 年；'+esc(aedCount())+'</span></div><div class="lw-row" style="flex-wrap:wrap;gap:4px;margin-top:6px">'+ARTABS.map(function(t){return '<button type="button" class="lw-btn'+(t[0]==='io'?' pri':'')+'" data-a="armory" data-v="'+t[0]+'">'+t[1]+'</button>';}).join('')+'</div>'+
      '<div class="lw-row" style="margin-top:6px"><button type="button" class="lw-btn" data-a="aedsave">⇩ 儲存工作區</button><button type="button" class="lw-btn dng" data-a="aedclose">關閉工作區</button></div>';
    o+='<div class="lw-row" style="margin-top:8px"><label class="lw-btn">⇧ 開啟工作區或存檔<input type="file" accept=".json,application/json" data-c="loadfile" hidden></label><a class="lw-btn" href="'+(/^http/.test(location.protocol)?'/':'lato-warsim.html')+'" target="_blank" rel="noopener">開啟模擬器</a><a class="lw-btn" href="'+(/^http/.test(location.protocol)?'/editor':'lato-warsim-editor.html')+'" target="_blank" rel="noopener">編制與裝備編輯器</a></div></div></div>';host.innerHTML=o;};
  CHG.aedy=function(t){AED.y=+t.value||2000;};
  ACT.aednew=function(){aedNew().catch(function(e){toast('建立失敗：'+e.message,5000);});};
  ACT.aedsave=function(){if(!G)return;saveSnap().then(gameParts).then(function(t){download('lato-armory-workspace-'+G.set.y+'.latowarsim.json',t,'application/json');});};
  ACT.aedclose=function(){if(!confirm('關閉工作區？尚未匯出或儲存的設計會遺失。'))return;G=null;show('start');};
  (function(){var b=loadGame;loadGame=async function(o){await b(o);if(G){G.edit=1;show('start');}};})();
  document.title='LatoWarsim 裝備編輯器';
}
HELP14.push('<h4>裝備的匯入匯出與獨立的裝備編輯器</h4><ul><li>裝備庫的「匯入匯出」分頁可以逐類勾選匯出：武器、魔法武器、單位類型、彈藥、飛彈魚雷與炸彈、材料、裝甲設計、支援裝備、載具設計、載具型號、化學與生物毒劑、核彈頭、糧食、編制裝備表與自訂幣種。存成武器裝備檔，或存成 LatoArmory 程式庫、LatoVehicle 設計檔，給獨立版 LatoArmory 開啟。</li>'+
  '<li>匯入時先列出檔案裡各類的數目，勾選要的再匯入；定義相同的設計不會重複，代號衝突時另立新代號；所有設計都經過現實限制。</li>'+
  '<li>獨立的裝備編輯器（lato-warsim-armory.html；聯機伺服器的 /armory）只有裝備庫：選年代建立工作區，設計裝甲、彈藥、化生武器、核彈頭等，匯出後到模擬器匯入。工作區可以存檔，下次再開。</li></ul>');
