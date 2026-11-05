

/* ===================== 匯出／匯入 ===================== */
RENDER.io={init:function(){var E=pane('io');E.innerHTML='<div class="row"><button type="button" data-k="iExp">匯出自訂彈藥與材料（JSON）</button><button type="button" data-k="iImp">匯入（JSON）</button><input type="file" data-k="iFile" accept=".json,application/json" style="display:none">'+
  '<button type="button" data-k="iCsv">匯出最近一次穿甲結果（CSV）</button><button type="button" data-k="iLib">匯出全部彈藥價格表（CSV）</button><button type="button" data-k="iReset">清除全部自訂</button></div><div class="lt-note" data-k="iMsg"></div>'+
  '<h4>模型與資料說明</h4><div class="lt-info lt-small">'+
  '・長桿穿甲彈：Lanz–Odermatt 貫穿方程（鎢、鋼、貧鈾含自銳係數），多層裝甲以校準後的 Tate–Alekseevskii 侵蝕模型逐層積分，傾角依 cos<sup>0.224</sup> 修正；穿過薄斜板會引起偏航。<br>'+
  '・硬芯彈與鉛心彈：Tate–Alekseevskii（剛體／侵蝕兩種狀態、背面弱化、尺寸效應），彈芯硬度不足或撞上更硬的靶材會碎裂；鈍頭穿薄板時帶走塞塊。<br>'+
  '・陶瓷複合板：Florence 模型（63° 陶瓷錐、背板的破斷應變與強度）；軟甲：Cunniff 量綱分析 V50＝U*<sup>1/3</sup>·f(面密度×投影面積／彈重)，含彈頭在織物上的變形。<br>'+
  '・聚能裝藥：穿深＝裝藥直徑×係數×炸高曲線×藥型罩，靶材依密度平方根與強度換算；反應裝甲依傾角削弱射流與長桿，串聯裝藥可先行引爆。碎甲彈依裝藥量估算背面剝落厚度。<br>'+
  '・背面變形：以 Roma Plastilina 黏土的落球校準值（1.04 kg、2 m → 25 mm）反推；NIJ 上限 44 mm。<br>'+
  '・凝膠：速度平方阻力加強度項、彈頭偏航至翻滾、擴張與碎裂；暫時腔直徑由單位長度能量釋放換算；失能機率僅為以永久腔體積估計的指標。<br>'+
  '・爆炸：Kinney–Graham 超壓公式；破片：Gurney 初速、Mott 質量分布、79 J 危險破片判準。<br>'+
  '・造價：原料價×加工倍率＋彈殼、發射藥、炸藥、引信與導引、裝配，乘以製造複雜度（內建彈藥已校準到公開合約價量級）、批量學習曲線（90%）與市場係數；1 東銀圓預設等於 2.5 美元。<br>'+
  '・校準資料：NIJ 0101.06／0101.07 測試彈、常見 III／IV 級插板、.30-06 M2、.50 M2、14.5 B-32 對均質鋼、DM53／M829／3BM42 的公開穿深、PG-7VL／標槍、FBI 凝膠測試等。結果為工程估算，同一彈種實際仍有約 ±10–20% 的離散。</div>';
  q('iExp').onclick=function(){dl('lato-armory-library.json',new Blob([JSON.stringify({format:'LatoArmory',v:2,set:S.set,mats:S.mats.filter(function(m){return m._u;}),proj:S.proj.filter(function(p){return p._u;}),muns:S.muns,cba:S.cba,nwh:S.nwh,mag:S.mag},null,1)],{type:'application/json'}));};
  q('iImp').onclick=function(){q('iFile').click();};
  q('iFile').onchange=function(){var f=this.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(){try{var d=JSON.parse(rd.result),dm=xarr(d.mats),dp=xarr(d.proj||d.ammo);dm.forEach(function(m){m._u=1;var i=idxOf(S.mats,m.id);if(i>=0)S.mats[i]=m;else S.mats.push(m);});
      dp.forEach(function(p){if(!p||!p.id)return;p._u=1;var i=idxOf(S.proj,p.id);if(i>=0)S.proj[i]=p;else S.proj.push(p);});var xs=ximport(d);libChanged();q('iMsg').textContent='已匯入 '+dm.length+' 種材料、'+dp.length+' 種彈藥'+(xs?'，以及 '+xs:'')+'。';}catch(e){err(e);}};rd.readAsText(f);};
  q('iCsv').onclick=function(){var x=S.last;if(!x){q('iMsg').textContent='請先在「穿甲模擬」計算一次。';return;}var rows=[['層','材料','厚度mm','傾角','視線厚mm','入射速度','侵徹深mm','結果']];
    x.r.layers.forEach(function(l){rows.push([l.i+1,l.mat.n,l.t,l.ang,fx(l.los,1),fx(l.vIn,0),l.dop!==undefined?fx(l.dop,1):'',l.res||'']);});rows.unshift(['彈藥',x.p.n,'撞擊速度',fx(x.v,0)]);
    dl('lato-armory-result.csv',new Blob(['﻿'+rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',');}).join('\n')],{type:'text/csv'}));};
  q('iLib').onclick=function(){var rows=[['彈藥','類別','彈頭g','全彈g','每30顆kg','單價東銀圓','每30顆東銀圓','初速m/s']];S.proj.forEach(function(p){var c=costP(p).usd/S.set.rate,rm=A.roundMass(p),sm=small(p);rows.push([p.n,(A.GROUPS[p.g]||[''])[0],p.m,fx(rm,1),sm?fx(rm*30/1000,3):'',fx(c,2),sm?fx(c*30,2):'',p.v0]);});
    dl('lato-armory-prices.csv',new Blob(['﻿'+rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',');}).join('\n')],{type:'text/csv'}));};
  q('iReset').onclick=function(){if(!confirm('清除所有自訂的彈藥、材料、導引彈藥、化生放核魔設計與設定？'))return;store(KEY,{});store('latoArmory.x1',{});loadLib();xload();VCACHE={};libChanged();q('iMsg').textContent='已還原為內建資料。';};},
 run:function(){}};
