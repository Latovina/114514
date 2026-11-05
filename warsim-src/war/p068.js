/* ===================== 編制與裝備編輯器（獨立頁面 lato-warsim-editor.html；聯機伺服器的 /editor）=====================
   只保留「兵力編成」與「裝備庫」：自訂單位類型、編制、武器、彈藥、裝甲、支援裝備、載具設計與造價，匯出成編制檔與武器裝備檔，
   再到模擬器（單機或聯機）匯入使用。工作區用一張很小的空白地圖，不需要地圖與作戰。 */
(function(){var b=ACT.armexp;if(!b)return;ACT.armexp=function(){if(G&&!Object.keys(G.wpns||{}).length&&!Object.keys(G.types||{}).length&&['ammo','mats','seq','armor','vdes'].some(function(k){return G[k]&&Object.keys(G[k]).length;})){download('lato-equipment.latoarms.json',JSON.stringify(armsExport({}),null,1),'application/json');toast('已匯出自訂彈藥、材料、支援裝備、裝甲與載具設計。');return;}return b.apply(this,arguments);};})();
if(typeof EDONLY!=='undefined'&&EDONLY){
  TABS=[['start','開始'],['orbat','兵力編成'],['arm','裝備庫'],['set','設定'],['help','說明']];if(typeof TABI!=='undefined')TABI.arm='🛡';
  var ED={y:1943,n0:'藍軍',n1:'紅軍'};
  /* 建立工作區：極小的空白平原地圖（只用來放置與檢視編制） */
  async function edNew(){var y=clamp(+ED.y||1943,1500,4100),GW=40,GH=30,cs=100,seed='ed'+Date.now();var S=procSampler({seed:seed,ter:'plain',clim:'temperate',Wm:GW*cs,Hm:GH*cs,lat:45});
    var MP=await genRegion({GW:GW,GH:GH,cs:cs,seed:seed,year:Math.min(y,2030),name:'編制工作區',lat0:45,lon0:2,src:'proc',dens:0},S,function(){return Promise.resolve();});newScenario(MP,{y:Math.min(y,2030),m:6,d:1,h:8,dur:400,seed:seed});
    G.sides[0].name=ED.n0||'藍軍';G.sides[1].name=ED.n1||'紅軍';G.edit=1;OB.side=0;show('orbat');toast('已建立 '+y+' 年的編制工作區。可以在「兵力編成」建立單位與編制，在「裝備庫」設計武器、彈藥、裝甲與載具。',5000);}
  PAGES.start=function(host){var o='<div class="lw-main"><div class="lw-card"><h3>LatoWarsim 編制與裝備編輯器</h3><div class="lw-note">在這裡設計單位類型、編制（班排到集團軍）、武器、彈藥、裝甲、支援裝備與載具，並計算造價；完成後匯出成<b>編制檔</b>（.latoorbat.json）與<b>武器裝備檔</b>（.latoarms.json），到模擬器的「兵力編成」匯入。也可以匯入 LatoArmory 的彈藥庫與 LatoVehicle 的載具設計。</div>';
    if(!G){o+='<div class="lw-opt" style="margin-top:8px"><span>年代</span><label><input type="number" min="1500" max="4100" value="'+ED.y+'" data-c="edy" style="width:90px"> 年（決定可用的兵種、武器與標準配備）</label><span>藍軍名稱</span><input type="text" value="'+esc(ED.n0)+'" data-c="edn" data-v="0" style="width:10em"><span>紅軍名稱</span><input type="text" value="'+esc(ED.n1)+'" data-c="edn" data-v="1" style="width:10em"></div><div class="lw-row"><button type="button" class="lw-btn pri" data-a="ednew">建立工作區</button></div>';}
    else{var n=SIDES().map(function(s){return G.units.filter(function(u){return u.side===s;}).length;});o+='<div class="lw-kv" style="margin-top:8px"><span>工作區</span><span>'+G.set.y+' 年；'+esc(G.sides[0].name)+' '+n[0]+' 個單位、'+esc(G.sides[1].name)+' '+n[1]+' 個單位；自訂類型 '+Object.keys(G.types||{}).length+'、自訂武器 '+Object.keys(G.wpns||{}).length+'、自訂彈藥 '+Object.keys(G.ammo||{}).length+'、裝甲設計 '+Object.keys(G.armor||{}).length+'</span></div>'+
      '<div class="lw-row" style="flex-wrap:wrap"><button type="button" class="lw-btn pri" data-a="tab" data-v="orbat">兵力編成</button><button type="button" class="lw-btn pri" data-a="tab" data-v="arm">裝備庫</button><button type="button" class="lw-btn" data-a="armexp">⇩ 匯出武器裝備檔</button><label class="lw-btn">⇧ 匯入武器裝備檔<input type="file" accept=".json,application/json" data-c="armfile" hidden></label><label class="lw-btn">⇧ 匯入 LatoArmory／LatoVehicle 檔<input type="file" accept=".json,application/json" data-c="arimp" hidden></label><button type="button" class="lw-btn" data-a="edsave">⇩ 儲存工作區</button><button type="button" class="lw-btn dng" data-a="edclose">關閉工作區</button></div>'+
      '<div class="lw-note">編制檔在「兵力編成」的「⇩ 匯出」「⇧ 匯入」；選取編制再匯出可以只匯出那一支部隊。</div>';}
    o+='<div class="lw-row" style="margin-top:8px"><label class="lw-btn">⇧ 開啟工作區或存檔<input type="file" accept=".json,application/json" data-c="loadfile" hidden></label><a class="lw-btn" href="'+(/^http/.test(location.protocol)?'/':'lato-warsim.html')+'" target="_blank" rel="noopener">開啟模擬器</a></div></div></div>';host.innerHTML=o;};
  CHG.edy=function(t){ED.y=+t.value||1943;};CHG.edn=function(t){ED['n'+t.getAttribute('data-v')]=t.value.slice(0,20);};
  ACT.ednew=function(){edNew().catch(function(e){toast('建立失敗：'+e.message,5000);});};
  ACT.edsave=function(){if(!G)return;var fn='lato-workspace-'+G.set.y+'.latowarsim.json';saveSnap().then(gameParts).then(function(t){download(fn,t,'application/json');});};
  ACT.edclose=function(){if(!confirm('關閉工作區？尚未匯出或儲存的內容會遺失。'))return;G=null;show('start');};
  PAGES.arm=function(host){host.innerHTML='<div class="lw-main"><div class="lw-card"><h3>裝備庫</h3><div class="lw-note">武器、彈藥、裝甲、支援裝備、載具設計與造價。</div><div class="lw-row" style="flex-wrap:wrap">'+ARTABS.map(function(t){return '<button type="button" class="lw-btn" data-a="armory" data-v="'+t[0]+'">'+t[1]+'</button>';}).join('')+'</div></div></div>';if(G)armoryDlg();};
  /* 載入存檔時直接進入兵力編成 */
  (function(){var b=loadGame;loadGame=async function(o){await b(o);if(G){G.edit=1;show('orbat');}};})();
  document.title='LatoWarsim 編制與裝備編輯器';
}
