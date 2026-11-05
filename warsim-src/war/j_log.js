/* ===================== 後勤：武器與彈藥基數、官士兵編成與一日三餐、飲水、草料、燃料；
   補給鏈：地圖外友方基地 → 港口／機場／鐵路站 → 補給站（前進基地）→ 補給部隊 → 前線單位（每日吞吐量、運具載荷、往返趟次） ===================== */
/* 武器參數：鍵、名稱、類別、每發重量（公斤，含包裝）、每基數發數、對人殺傷、對裝甲殺傷（每件每分鐘，有效射程內對暴露目標）、
   世代、穿甲（裝甲等級 0～14）、壓制係數、有效射程、最大射程、間接射程（公尺）、精度、操作人數、問世年代、防空、夜視（0 無、1 微光、2 熱像） */
var WK=['k','n','cat','kg','rpu','pP','pA','gen','pen','sup','rE','rM','ind','acc','crew','y','aa','nv'];
var WPNR=[
 ['pike','長槍','近戰',0,0,0,0,1,0,0.3,3,3,0,1,1,1500,0,0],['sword','刀劍','近戰',0,0,0,0,1,0,0.3,2,2,0,1,1,1500,0,0],
 ['match','火繩槍','步槍',0.045,24,0.018,0,1,0,0.8,80,200,0,0.8,1,1520,0,0],['flint','燧發槍','步槍',0.04,60,0.029,0,2,0,0.8,100,220,0,0.9,1,1690,0,0],['carb','卡賓槍（馬槍）','步槍',0.03,40,0.02,0,2,0,0.7,120,250,0,0.9,1,1700,0,0],['pist','手槍','步槍',0.02,24,0.01,0,1,0,0.5,25,50,0,0.8,1,1550,0,0],
 ['rmus','線膛前裝槍','步槍',0.04,60,0.036,0,3,0,0.9,250,500,0,1.1,1,1850,0,0],['brl','後膛步槍','步槍',0.035,80,0.047,0,4,0,1,350,900,0,1.1,1,1866,0,0],['bolt','栓動步槍','步槍',0.025,120,0.035,0.001,5,1,1,400,1200,0,1.1,1,1886,0,0],['semi','半自動步槍','步槍',0.025,180,0.045,0.001,6,1,1.1,400,1200,0,1.1,1,1940,0,0],
 ['asr1','突擊步槍（第一代）','步槍',0.016,210,0.045,0.002,1,1,1.2,300,800,0,1,1,1949,0,0],['asr2','突擊步槍（第二代・光學瞄具）','步槍',0.016,210,0.052,0.002,2,1,1.2,400,900,0,1.15,1,1985,0,1],['asr3','突擊步槍（第三代・熱像火控）','步槍',0.016,210,0.06,0.003,3,1.5,1.2,500,1000,0,1.3,1,2015,0,2],
 ['smg','衝鋒槍','步槍',0.015,300,0.04,0,1,0,1.2,150,250,0,0.9,1,1918,0,0],['snp','狙擊步槍','步槍',0.03,60,0.03,0.002,1,2,2,800,1500,0,1.6,1,1900,0,1],
 ['mge','早期機槍','機槍',0.025,5000,1.45,0.005,1,1,2,800,2000,0,0.9,4,1884,0,0],['hmg','重機槍','機槍',0.03,3000,1.3,0.03,2,2,2.2,1000,2500,0,1,3,1910,0,0],['lmg','輕機槍','機槍',0.025,1500,0.16,0.002,2,1,1.8,600,1200,0,1,2,1915,0,0],['gpmg','通用機槍','機槍',0.025,1500,0.22,0.003,3,1,2,800,1500,0,1.1,2,1960,0,1],
 ['gl','榴彈發射器','步兵支援',0.25,40,0.08,0.01,1,1,1.4,150,400,0,1,1,1960,0,0],['gren','手榴彈','步兵支援',0.6,4,0.004,0,1,0,1.5,30,40,0,1,1,1915,0,0],['demo','爆破炸藥','步兵支援',1,10,0.003,0.004,1,3,1,10,20,0,1,1,1860,0,0],
 ['atr','反戰車火箭筒（二戰）','反裝甲',3.5,6,0.05,0.05,1,5,1.2,100,300,0,0.8,2,1942,0,0],['atr2','反戰車火箭筒（現代）','反裝甲',4.5,6,0.06,0.07,2,8,1.3,300,500,0,0.9,2,1961,0,0],
 ['atgm1','反戰車飛彈（第一代・線導）','反裝甲',25,4,0.03,0.28,1,8,1.2,2000,3000,0,0.7,3,1963,0,0],['atgm2','反戰車飛彈（第二代・半自動導引）','反裝甲',25,4,0.04,0.4,2,10,1.3,3000,4000,0,0.95,2,1975,0,1],['atgm3','反戰車飛彈（第三代・射後不理）','反裝甲',22,4,0.05,0.55,3,12,1.4,2500,4000,0,1.2,2,1996,0,2],
 ['atg','反戰車砲','反裝甲',10,80,0.25,0.33,1,6,1.3,1000,1800,0,1,6,1937,0,0],
 ['morl','輕迫擊砲','迫擊砲',1.5,60,0.3,0.01,1,1,1.6,0,0,1500,1,3,1917,0,0],['morm','中迫擊砲','迫擊砲',4.5,100,0.75,0.02,1,1,1.8,0,0,3000,1,5,1917,0,0],['morh','重迫擊砲','迫擊砲',16,80,1.5,0.05,2,2,2.2,0,0,7000,1,7,1940,0,0],['tmor','塹壕迫擊砲','迫擊砲',6,60,1,0.03,1,1,1.8,0,0,1500,0.8,5,1915,0,0],
 ['canl','輕型火砲（鷹砲）','火砲',3,50,0.75,0.01,1,1,1.5,300,1200,0,0.8,8,1550,0,0],['canm','野戰砲（滑膛）','火砲',5,100,1,0.013,2,1,1.6,400,1400,0,0.9,12,1700,0,0],['howe','榴彈砲（滑膛）','火砲',8,60,0.8,0.02,2,1,1.8,500,1200,1600,0.8,12,1760,0,0],['rifg','線膛野砲','火砲',5,100,1.2,0.02,3,1.5,1.6,800,2500,0,1.1,10,1855,0,0],
 ['qf75','速射野砲','火砲',8,200,3,0.04,4,2,2,2000,6000,8000,1.1,6,1897,0,0],['h105','一〇五公釐榴彈砲','火砲',22,100,3.2,0.04,5,3,2.2,0,0,11000,1,8,1935,0,0],['h150','一五〇公釐重砲','火砲',45,60,4.5,0.075,5,3.5,2.5,0,0,15000,1,10,1914,0,0],
 ['h155','一五五公釐自走砲','火砲',50,80,3.6,0.1,6,3.5,2.5,0,0,24000,1.1,5,1965,0,1],['h155p','一五五公釐自走砲（精準導引彈）','火砲',50,80,4,0.25,7,6,2.5,0,0,40000,1.6,5,2005,0,2],
 ['mrle','火箭砲（二戰）','火砲',35,24,7.5,0.025,1,2,2.6,0,0,8000,0.8,5,1941,0,0],['mrlc','多管火箭（冷戰）','火砲',70,40,6.6,0.05,2,2,2.7,0,0,20000,0.9,4,1963,0,0],['mrlm','多管火箭（導引）','火砲',300,6,7.5,0.33,3,5,2.8,0,0,70000,1.4,3,2004,0,2],
 ['aage','高射砲（一戰）','防空',6,200,0.5,0.01,1,1,1,1500,3000,0,0.6,6,1915,0.5,0],['aag','高射砲（四十公釐）','防空',2.5,400,0.37,0.04,2,2,1.4,1500,3000,0,0.9,6,1935,0.5,0],['aaam','防空機砲（現代）','防空',1,1000,0.5,0.05,3,2,1.5,2500,4000,0,1.1,3,1965,1,1],
 ['sam','防空飛彈','防空',90,8,0,0,3,0,0,0,0,0,1.2,3,1960,1.5,2],['manpad','單兵防空飛彈','防空',15,3,0,0,2,0,0,3000,5000,0,1,2,1968,0.5,1],
 ['tgun1','戰車砲（一戰）','戰車砲',3,100,0.4,0.025,1,2.5,1.5,300,900,0,0.7,8,1916,0,0],['tgun','戰車砲（七十五公釐）','戰車砲',10,80,0.4,0.16,2,5.5,1.5,1000,2200,0,1,5,1938,0,0],['tgunh','戰車砲（八十八公釐）','戰車砲',15,70,0.55,0.34,3,8,1.6,1500,2600,0,1.1,5,1942,0,0],
 ['mbt1','主戰車砲（第二代・一〇五公釐）','戰車砲',20,50,0.54,0.32,4,8.5,1.6,1800,3000,0,1,4,1960,0,1],['mbt2','主戰車砲（第三代・一二〇公釐）','戰車砲',25,40,0.57,0.43,5,10.5,1.7,2500,4000,0,1.2,4,1980,0,2],['mbt3','主戰車砲（第三代半・數位火控）','戰車砲',25,40,0.6,0.54,6,11.5,1.7,2500,5000,0,1.3,4,2005,0,2],
 ['acan','機砲（步兵戰車）','戰車砲',0.5,500,0.3,0.06,1,3,1.6,1500,3000,0,1,3,1965,0,1],
 ['ngs','艦砲（帆船）','艦砲',10,50,0.037,0.011,1,1,1,300,1000,0,0.7,8,1500,0,0],['ngm','中口徑艦砲','艦砲',30,150,1,0.4,2,4,1.8,4000,15000,15000,1,10,1880,0,0],['ngb','戰艦主砲','艦砲',1000,100,2,0.4,3,10,2.5,15000,30000,30000,1,60,1906,0,0],
 ['torp','魚雷','艦砲',1500,8,0,0.18,2,12,1,3000,8000,0,0.8,4,1880,0,0],['ssm','反艦飛彈','艦砲',700,4,0,0.5,3,11,1,60000,150000,0,1.2,2,1967,0,2],
 ['acf','戰鬥機（螺旋槳）','航空器',200,1,0.25,0.02,2,2,1.2,500,1500,0,1,1,1915,0.5,0],['acj','噴射戰機','航空器',800,1,0.33,0.08,4,5,1.5,8000,25000,0,1.2,1,1955,0.85,2],['aca','攻擊機','航空器',600,1,0.8,0.2,3,4,2,800,2000,0,1,1,1937,0,0],
 ['acb','轟炸機','航空器',2000,1,2,0.07,3,3,2.5,0,500,0,0.7,5,1915,0,0],['acr','偵察機','航空器',0,1,0,0,2,0,0,0,0,0,1,2,1914,0,0],['heli','攻擊直升機','航空器',800,1,1.33,0.7,2,9,1.8,3000,4000,0,1.1,2,1967,0,1],['thel','運輸直升機','航空器',0,1,0.03,0,2,0,0.5,300,800,0,1,3,1955,0,1],
 ['uav','無人機（偵察打擊）','無人機',300,1,0.75,0.75,2,9,1.4,8000,15000,0,1.3,2,1995,0,2],['fpv','FPV 自殺無人機','無人機',1.5,1,0.1,0.067,1,7,2.5,6000,12000,0,1.1,1,2018,0,1],['fpv2','FPV 無人機（自主終端導引）','無人機',1.8,1,0.12,0.09,2,8,2.5,8000,15000,0,1.4,1,2024,0,2],['loit','巡飛彈','無人機',15,1,0.125,0.21,2,9,2,20000,40000,0,1.3,1,2010,0,2],
 ['bomb','航空炸彈（飛艇）','航空器',50,20,5,0.1,1,2,2,0,300,0,0.6,2,1912,0,0],
 ['breath','龍息','奇幻',0,0,12,2,1,7,3,100,300,0,1,1,0,0,2],['claw','爪牙觸手','奇幻',0,0,6,3,1,6,2.5,50,200,0,1,1,0,0,2],['magic','魔導砲','奇幻',5,50,1,0.19,1,5,2,400,1200,0,1,6,0,0,1],
 /* 舊版鍵（相容舊存檔，不出現在清單） */
 ['asr','突擊步槍','步槍',0.016,210,0.045,0.002,1,1,1.2,300,800,0,1,1,1949,0,0,1],['atgm','反戰車飛彈','反裝甲',25,4,0.04,0.4,2,10,1.3,3000,4000,0,0.95,2,1975,0,1,1],['tgunm','主戰車砲','戰車砲',25,40,0.57,0.43,5,10.5,1.7,2500,4000,0,1.2,4,1980,0,2,1]];
var WPNO={};WPNR.forEach(function(r){var o={};WK.forEach(function(k,i){o[k]=r[i];});o.hid=r[18]?1:0;WPNO[o.k]=o;});
/* 飛機、直升機與無人機是載具：由「裝備庫 → 載具設計」建立，不列在武器清單（內建類型仍沿用） */
['acf','acj','aca','acb','acr','heli','thel','uav'].forEach(function(k){if(WPNO[k])WPNO[k].hid=1;});
/* 取得武器（自訂武器優先） */
function wpnOf(k){return (G&&G.wpns&&G.wpns[k])||WPNO[k]||null;}
function wpnList(){var o=[];for(var k in WPNO)if(!WPNO[k].hid)o.push(wpnOf(k));if(G&&G.wpns)for(var k2 in G.wpns)if(!WPNO[k2])o.push(G.wpns[k2]);return o;}
/* 運具與載具：鍵、名稱、類別、油耗（陸：公升／百公里；艦、機：公升／小時）、油箱（公升）、載重（噸）、拖曳馬匹 */
var VEHC=[['horse','馬匹','畜',0,0,0.1,0],['wagon','馬車','車',0,0,0.75,4],['cart','輜重車','車',0,0,1,4],['truck','卡車','車',35,250,3,0],['car','偵察車','車',20,120,0.3,0],['ht','半履帶車','甲',60,300,1,0],['apc','裝甲運兵車','甲',50,350,1,0],['ifv','步兵戰車','甲',90,650,1,0],
 ['tk1','戰車（一戰）','甲',400,250,0,0],['tkm','中型戰車','甲',300,550,0,0],['tkh','重型戰車','甲',500,550,0,0],['mbt','主戰車','甲',450,1500,0,0],['spg','自走砲','甲',250,500,0,0],['recv','輪型偵察車','甲',40,350,0,0],['mrlv','火箭發射車','車',60,350,0,0],['ewv','電子戰車','車',50,300,0,0],
 ['gun','火砲（牽引）','砲',0,0,0,6],['ship','艦艇','艦',3500,800000,0,0],['sail','帆船','艦',0,0,0,0],['subm','潛艦','艦',800,200000,0,0],['plane','飛機','機',600,2400,0,0],['jet','噴射機','機',3500,9000,0,0],['helo','直升機','機',800,2000,0,0],['drone','無人機','機',40,400,0,0],['airship','飛艇','機',300,20000,0,0],['beast','奇幻生物','獸',0,0,0,0]];
var VEHI={};VEHC.forEach(function(v){VEHI[v[0]]=v;});
/* 食物：鍵、名稱、每份熱量（大卡）、每份重量（公斤）、士氣、需野戰廚房（熱食）、最早年代 */
var FOOD=[['bread','麵包',1300,0.5,0,0,0],['bisc','硬餅乾',1000,0.25,-0.5,0,0],['rice','米飯',1100,0.32,0,1,0],['salt','鹹肉',600,0.25,0,0,0],['chee','起司',400,0.1,0.2,0,0],['bean','豆類',500,0.15,0,1,0],['veg','蔬菜',100,0.3,0.3,0,0],['fruit','水果',100,0.2,0.4,0,0],
 ['can','罐頭肉',600,0.34,0.1,0,1860],['stew','野戰廚房熱食',1100,0.8,1.5,1,1700],['kr','K 口糧',900,0.32,0,0,1941],['cr','C 口糧',1000,0.5,0.2,0,1940],['mre','單兵口糧包（MRE）',1250,0.6,0.3,0,1980],['choc','巧克力',500,0.1,0.5,0,1900],['sugar','糖',200,0.05,0.1,0,0],
 ['tea','咖啡／茶',0,0.03,0.6,0,0],['rum','蘭姆酒配給',160,0.07,1,0,1650],['wine','葡萄酒',200,0.25,0.8,0,0],['cig','香菸',0,0.02,0.8,0,1880]];
var FOODI={};FOOD.forEach(function(f){FOODI[f[0]]=f;});
var RKN=['士兵','士官','軍官'],MEALN=['早餐','午餐','晚餐'];
/* ---------- 預設：官士兵比例 ---------- */
function rankMix(t){if(t.rk)return [1-(t.rk[0]+t.rk[1])/100,t.rk[1]/100,t.rk[0]/100];var y=(ERAI[t.era]||ERA[6]).y,o=y<1900?0.03:y<1960?0.04:0.06,n=y<1800?0.08:y<1900?0.1:y<1960?0.14:0.2;
  if(t.br==='hq'){o=0.2;n=0.3;}else if(t.dom==='air'&&t.br!=='uav'){o=0.55;n=0.35;}else if(t.dom==='sea'||t.dom==='sub'){o=0.07;n=0.25;}else if(t.br==='drg'||t.br==='mon'){return [1,0,0];}return [1-o-n,n,o];}
/* ---------- 預設：各類武器數量與載具（依兵種與年代推定，可在編輯器中修改） ---------- */
function defLoad(t){var E=ERAI[t.era]||ERA[6],y=E.y,m=t.men,v=t.veh,br=t.br,w=[],vh=[],h=0,fl=t.fl||'',vn=t.vn||'',K=t.k||'';
  function A(k,n){n=Math.round(n);if(n>0)w.push([k,n]);}function V(k,n){n=Math.round(n);if(n>0)vh.push([k,n]);}
  var rif=y<1690?'match':y<1845?'flint':y<1866?'rmus':y<1886?'brl':y<1950?'bolt':y<1962?'semi':y<1985?'asr1':y<2012?'asr2':'asr3',atgm=y<1975?'atgm1':y<1996?'atgm2':'atgm3',mbt=y<1980?'mbt1':y<2008?'mbt2':'mbt3',truck=y<1914?'wagon':'truck',rk=function(f){A(rif,m*f);};
  if(br==='drg'||br==='mon'){A(br==='drg'?'breath':'claw',Math.max(1,v));V('beast',v);return {w:w,v:vh,h:0};}
  if(br==='ash'){A(K==='as0'?'magic':'bomb',v*(K==='as0'?8:1));V('airship',v);return {w:w,v:vh,h:0};}
  if(t.dom==='air'){var role=fl.indexOf('H')>=0?'thel':br==='heli'?'heli':br==='uav'?'uav':fl.indexOf('r')>=0?'acr':t.sa>=20?'acb':t.ha>=2.5?'aca':y>=1955?'acj':'acf';A(role,v);V(br==='heli'?'helo':br==='uav'?'drone':y>=1950?'jet':'plane',v);return {w:w,v:vh,h:0};}
  if(t.dom==='sea'||t.dom==='sub'){if(t.dom==='sub'){A('torp',v*16);V('subm',v);return {w:w,v:vh,h:0};}if(y<1850){A('ngs',v*(K==='gl1600'?36:K==='sl1800'?74:K==='fg1800'?36:4));V('sail',v);return {w:w,v:vh,h:0};}
    if(K.indexOf('bb')===0){A('ngb',v*9);A('ngm',v*12);A(y>=1930?'aag':'aage',v*40);}else if(K.indexOf('cv')===0){A('aag',v*40);A('ngm',v*8);}else if(y>=1990){A('ngm',v);A('ssm',v*8);A('sam',v*(K.indexOf('dg')===0?90:32));A('aaam',v*2);}else{A('ngm',v*(K.indexOf('ic')===0?10:4));if(fl.indexOf('T')>=0)A('torp',v*8);if(y>=1930)A('aag',v*8);}V('ship',v);return {w:w,v:vh,h:0};}
  switch(br){
   case 'pike':A('pike',m*0.85);A('sword',m*0.15);break;
   case 'inf':case 'abn':case 'sof':case 'mot':case 'mech':if(t.sym==='pike'&&y<1700){A('pike',m*0.45);A('match',m*0.45);break;}rk(y<1900?0.9:0.72);
     if(y>=1916&&y<1962){A('lmg',m/14);A('smg',m*(y>=1940?0.1:0.03));A('gren',m*0.5);}if(y>=1962){A('gpmg',m/10);A('gl',m/12);A('gren',m*0.5);}if(y>=1940&&y<1962)A('atr',m/60);if(y>=1962){A(y>=1975?atgm:'atr2',m/45);A('atr2',m/25);}if(y>=1940)A('morl',2);if(y>=1975&&fl.indexOf('m')<0)A('manpad',Math.max(1,m/60));
     if(br==='mot')V(y<1960?'truck':'apc',v);if(br==='mech'){V(y<1950?'ht':'ifv',v);if(y>=1960){A('acan',v);if(y>=1975)A(atgm,v*0.5);}}if(br==='sof')A('demo',m*0.5);break;
   case 'mg':A(y<1914?'mge':'hmg',v||m/15);rk(0.4);break;
   case 'cav':if(y<1700){A('pist',m*1.6);A('sword',m*0.9);}else{A('sword',m*0.9);A('carb',m*(fl.indexOf('r')>=0||vn?0.8:0.6));}if(fl.indexOf('L')>=0)A('pike',m*0.8);if(y>=1900)A('lmg',m/30);h=m*1.05;break;
   case 'rec':if(t.mob==='horse'){A('carb',m*0.8);A('sword',m*0.8);h=m*1.05;}else{rk(0.5);A(y>=1962?'gpmg':'lmg',Math.max(2,v));V(y<1960?'car':'recv',v);if(y>=1960)A(atgm,v/3);}break;
   case 'arm':V(y<1925?'tk1':y<1955?(K==='ht1940'?'tkh':'tkm'):'mbt',v);A(y<1925?'tgun1':y<1955?(K==='ht1940'?'tgunh':'tgun'):mbt,v);A(y<1925?'mge':y>=1962?'gpmg':'lmg',v*(y<1925?3:2));if(y>=1955)A('hmg',v);break;
   case 'art':var g=y<1700?'canl':y<1855?(K.indexOf('hw')===0?'howe':'canm'):y<1880?(K.indexOf('ra')===0?'rifg':'canm'):y<1914?'qf75':y<1960?(K.indexOf('hv')===0?'h150':(y<1930?'qf75':'h105')):fl.indexOf('p')>=0?'h155p':'h155';A(g,v);rk(0.3);if(t.mob==='drawn'){h=v*6+m*0.1;V('gun',v);V('wagon',v);}else if(t.mob==='track')V('spg',v);else V('truck',v);break;
   case 'mor':A(y<1930?'tmor':'morm',v);rk(0.5);if(t.mob==='wheel')V('truck',Math.ceil(v/2));break;
   case 'rkt':A(y<1960?'mrle':y<2000?'mrlc':'mrlm',v);rk(0.3);V(y<1960?'truck':'mrlv',v);break;
   case 'at':if(t.mob==='track'){V('tkm',v);A('tgun',v);}else{A(y<1960?'atg':atgm,v);V(y<1960?'truck':'recv',v);}rk(0.4);break;
   case 'ad':A(y<1930?'aage':y<1960?'aag':t.aa>=8?'sam':'aaam',v);if(y>=1968)A('manpad',Math.max(2,m/15));if(y>=1960&&t.aa>=8)A('aaam',v);rk(0.3);V(t.mob==='track'?'spg':'truck',v);break;
   case 'eng':rk(0.8);if(y>=1916)A(y>=1962?'gpmg':'lmg',m/25);A('demo',m*0.3);if(y>=1940&&y<1962)A('atr',m/60);if(v)V(y<1914?'cart':y<1960?'truck':'apc',v);break;
   case 'hq':A('pist',m*0.3);rk(0.5);if(y<1900)h=m*0.4;V(y<1900?'wagon':y<1960?'truck':'apc',v||Math.ceil(m/25));break;
   case 'sup':rk(0.25);V(truck,v);if(y<1914)h=v*4;break;
   case 'uav':rk(0.5);if(K.indexOf('fp')===0)A(y>=2024?'fpv2':'fpv',v);else if(K.indexOf('lm')===0)A('loit',v);else A('uav',v);V('truck',Math.ceil(m/10));break;
   case 'ew':rk(0.5);V('ewv',v);break;
   default:rk(0.8);if(v)V(truck,v);}
  return {w:w,v:vh,h:h};}
/* 一個基數的重量（公斤） */
function uofKg(W){return sum(W,function(x){var d=wpnOf(x[0]);return d?x[1]*d.kg*d.rpu:0;});}
/* 武器組合的總參數：對人／對裝甲殺傷（含精度）、平均穿甲、壓制、射程、間接射程、防空、夜視 */
function wAgg(W,base){var o={p:0,a:0,pen:0,sup:0,rng:0,ind:0,aa:0,nv:0},pw=0,aw=0;W.forEach(function(x){var d=base?WPNO[x[0]]:wpnOf(x[0]);if(!d)return;var n=x[1]||0,p=n*d.pP*d.acc,a=n*d.pA*d.acc;o.p+=p;o.a+=a;o.pen+=a*d.pen;aw+=a;o.sup+=p*d.sup;o.rng+=p*(d.rE||d.ind||0);pw+=p;if(d.ind>o.ind&&n>0)o.ind=d.ind;o.aa+=n*(d.aa||0);if(n>0&&d.nv>o.nv&&(d.pP>0||d.pA>0))o.nv=d.nv;});o.pen=aw?o.pen/aw:0;o.sup=pw?o.sup/pw:0;o.rng=pw?o.rng/pw:0;return o;}
function fpOf(W){var g=wAgg(W);return {p:g.p,a:g.a};}
/* ---------- 預設伙食（依年代）：每個軍階的早、午、晚餐 ---------- */
function defRation(y){var sol,nco,off;if(y<1800){sol=[[['bread',0.5],['salt',0.2]],[['bread',0.5],['bean',1]],[['bread',0.5],['salt',0.4],['wine',1]]];}
  else if(y<1900){sol=[[['bisc',1],['tea',1]],[['bread',0.6],['salt',0.6]],[['stew',1],['bread',0.4],['tea',1]]];}
  else if(y<1960){sol=[[['bread',0.5],['tea',1],['sugar',1]],[['cr',1],['choc',0.5]],[['stew',1],['bread',0.4],['tea',1],['cig',1]]];}
  else{sol=[[['mre',1],['tea',1]],[['mre',1]],[['stew',1],['veg',1],['fruit',1]]];}
  nco=clone(sol);off=clone(sol);off[2].push(['wine',1]);off[1].push(['fruit',1]);return {r:[sol,nco,off],water:4};}
function mealSum(M){var kc=0,kg=0,mo=0,hot=0;M.forEach(function(meal){meal.forEach(function(it){var f=FOODI[it[0]];if(!f)return;var q=it[1]||0;kc+=f[2]*q;kg+=f[3]*q;mo+=f[4]*q;if(f[5])hot++;});});return {kc:kc,kg:kg,mo:mo,hot:hot};}
function rationOf(u){return u.ration||SD(u.side).ration||defRation(uEra(u).y);}
/* ---------- 單位後勤初始化 ---------- */
function typesOfU(u){return u.mix?u.mix:[[u.hq,1]];}
function logInit(u){var W={},W0={},Vh={},h=0,rk=[0,0,0],men=0;typesOfU(u).forEach(function(m){var t=typeOf(m[0]);if(!t)return;var n=m[1]||1,D=defLoad(t),L=t.load||D;L.w.forEach(function(x){W[x[0]]=(W[x[0]]||0)+x[1]*n;});D.w.forEach(function(x){W0[x[0]]=(W0[x[0]]||0)+x[1]*n;});L.v.forEach(function(x){Vh[x[0]]=(Vh[x[0]]||0)+x[1]*n;});h+=(L.h||0)*n;var R=rankMix(t);for(var i=0;i<3;i++)rk[i]+=R[i]*t.men*n;men+=t.men*n;});
  var w1=Object.keys(W).map(function(k){return [k,W[k]];}),w0=Object.keys(W0).map(function(k){return [k,W0[k]];}),v0=Object.keys(Vh).map(function(k){return [k,Vh[k]];});u.lg=u.lg||{};var L2=u.lg;L2.w0=w0;L2.v0=v0;L2.h0=Math.round(h);if(!L2.w)L2.w=clone(w1);if(!L2.v)L2.v=clone(v0);if(L2.h===undefined)L2.h=L2.h0;
  if(!L2.rk)L2.rk=rk.map(function(x){return Math.round(x);});if(!L2.basic)L2.basic=ST(u).fl.indexOf('x')>=0?1:ST(u).ind>0?1.5:ST(u).dom==='air'?1:2;if(!L2.daily)L2.daily=ST(u).ind>0?1.2:1;
  logRecalc(u);L2.food=L2.foodCap;L2.fod=L2.fodCap;L2.fuel=L2.fuelCap;L2.hun=0;return L2;}
function logRecalc(u){var L=u.lg,g0=wAgg(L.w0,true),g1=wAgg(L.w),ID=infDef(typeOf((u.mix||[[u.hq]])[0][0])||{});L.ld=ID.ld;L.ba=ID.ba;L.wpnF={p:g0.p>0?clamp(g1.p/g0.p,0,4):1,a:g0.a>0?clamp(g1.a/g0.a,0,4):1,pAdd:g0.p>0?0:g1.p,aAdd:g0.a>0?0:g1.a,penD:g0.a>0&&g1.a>0?g1.pen-g0.pen:0,penAbs:g0.a===0&&g1.a>0?g1.pen:0,
    sup:g0.sup>0&&g1.sup>0?clamp(g1.sup/g0.sup,0.3,3):1,rng:g0.rng>0&&g1.rng>0?clamp(g1.rng/g0.rng,0.4,3):1,ind:g0.ind>0&&g1.ind>0?clamp(g1.ind/g0.ind,0.3,4):1,indAbs:g0.ind===0?g1.ind:0,aaD:g1.aa-g0.aa,nv:g1.nv};L.uof=uofKg(L.w);
  var R=rationOf(u),day=[0,0,0].map(function(_,i){return mealSum(R.r[i]);}),fr=u.men0>0?u.men/u.men0:1;L.dayKg=sum([0,1,2],function(i){return L.rk[i]*fr*day[i].kg;});L.dayKc=L.rk[0]+L.rk[1]+L.rk[2]?sum([0,1,2],function(i){return L.rk[i]*day[i].kc;})/(L.rk[0]+L.rk[1]+L.rk[2]):0;
  L.mo=L.rk[0]+L.rk[1]+L.rk[2]?sum([0,1,2],function(i){return L.rk[i]*day[i].mo;})/(L.rk[0]+L.rk[1]+L.rk[2]):0;L.hot=day[0].hot>0;L.water=(R.water||4)*u.men;
  var fant=sum(typesOfU(u),function(m){var t=typeOf(m[0]);return t&&(t.br==='drg'||t.br==='mon')?(t.br==='drg'?(t.k==='dg0'?150:40):0)*t.veh*(m[1]||1):0;});L.fodDay=L.h*10+fant;L.foodCap=Math.max(L.dayKg*3,1);L.fodCap=Math.max(L.fodDay*2,0);
  L.fuelCap=sum(L.v,function(x){var d=VEHI[x[0]];return d?d[4]*x[1]:0;});L.lPerKm=sum(L.v,function(x){var d=VEHI[x[0]];return d&&'車甲'.indexOf(d[2])>=0?d[3]/100*x[1]:0;});L.lPerH=sum(L.v,function(x){var d=VEHI[x[0]];return d&&'艦機'.indexOf(d[2])>=0?d[3]*x[1]:0;});
  L.pay=sum(L.v,function(x){var d=VEHI[x[0]];return d?d[5]*x[1]:0;});if(L.food===undefined||L.food>L.foodCap)L.food=L.foodCap;if(L.fod===undefined||L.fod>L.fodCap)L.fod=L.fodCap;if(L.fuel===undefined||L.fuel>L.fuelCap)L.fuel=L.fuelCap;}
/* 每日需求（噸）：口糧、飲水（無在地水源時）、草料、彈藥（依戰鬥強度）、燃料（依行駛距離） */
function aridMap(){var C=G.map.clim||{Tj:5,Tl:20,Pj:60,Pl:60};return 6*(C.Pj+C.Pl)<350||(Math.max(C.Tj,C.Tl)>28&&6*(C.Pj+C.Pl)<700);}
function dayNeed(u,intens,km){var L=u.lg||logInit(u),fr=u.men0>0?u.men/u.men0:1;return {food:L.dayKg/1000+(aridMap()?L.water*fr/1000:0)+((u.ref||0)+(u.pw||0)*(u.pw?[1,0.9,0.75,0.5,0.35,0.2][polOf(u,'pow')]:0))*0.6/1000,water:aridMap()?L.water*fr/1000:0,fod:L.fodDay/1000,ammo:L.uof*(intens===undefined?0.5:intens)/1000,fuel:(L.lPerKm*(km===undefined?50:km)+L.lPerH*4)*0.8/1000};}
/* ---------- 補給節點 ---------- */
var LOGK={off:['地圖外友方基地','#5A6B7D'],port:['港口','#1F6FB2'],air:['機場','#7A4FB5'],rail:['鐵路站','#5C5C5C'],depot:['補給站（前進基地）','#B07A1F']};
var THR={port:[300,400,600,1500,2500,3000,5000,10000,20000,800,20000],air:[0,0,0,0,0,20,300,1500,3000,100,3000],rail:[0,0,0,1000,2500,3000,4000,6000,8000,0,8000]};
var PAYLOAD=[0.75,0.75,1,1,1.5,2,3,5,8,1,8];
function nodeDefaults(k,era){var i=era.i;return {thr:k==='off'?1e9:k==='depot'?0:(THR[k]||[])[i]||0,cap:k==='off'?1e12:k==='depot'?3000:20000,cv:{n:k==='depot'?(i<=2?120:i<=5?100:80):0,pay:PAYLOAD[i]||3}};}
function addNode(side,k,x,y,o){var S=SD(side),hq=sideCmd(side),E=hq?uEra(hq):ERA[6],d=nodeDefaults(k,E),N=Object.assign({id:(G.lgSeq=(G.lgSeq||0)+1),k:k,side:side,name:LOGK[k][0],x:x,y:y,thr:d.thr,cap:d.cap,cv:d.cv,up:0,st:{food:0,ammo:0,fuel:0,fod:0},status:'ok',hist:[]},o||{});
  if(k==='off'){N.st={food:1e9,ammo:1e9,fuel:1e9,fod:1e9};}else if(!o||!o.st){N.st={food:N.cap*0.2,ammo:N.cap*0.35,fuel:N.cap*0.3,fod:N.cap*0.05};}(S.nodes||(S.nodes=[])).push(N);return N;}
function defaultNodes(side){var p=edgePoint(side,0.5);addNode(side,'off',p[0],p[1],{name:'地圖外友方基地'});}
function nodesOf(side){return (SD(side).nodes||[]).filter(function(n){return n.status!=='captured';});}
/* 節點條件：港口須臨水域；鐵路站須在鐵路上且鐵路通往地圖邊緣；機場受天氣、夜間、敵方空優影響 */
function nodeOK(N){var MP=G.map,k=cellAt(N.x,N.y);if(N.k==='port'){var R=Math.ceil(600/MP.cs),gx=k%MP.GW,gy=(k/MP.GW)|0;for(var b=-R;b<=R;b++)for(var a=-R;a<=R;a++){var X=gx+a,Y=gy+b;if(X<0||Y<0||X>=MP.GW||Y>=MP.GH)continue;var c=MP.lc[Y*MP.GW+X];if(c===LCI.sea||c===LCI.shal||c===LCI.lake||c===LCI.riv)return true;}return false;}
  if(N.k==='rail'){if(N._railV===G._mapv)return N._railOK;N._railV=G._mapv;N._railOK=railToEdge(k,N.fac?SD(N.side).edge||'W':null);return N._railOK;}return true;}
/* edge：指定時鐵路必須通往該側的地圖邊緣（奪取的車站要連回本方後方才有運量） */
function railToEdge(k0,edge){var MP=G.map,GW=MP.GW,GH=MP.GH,R=Math.ceil(400/MP.cs),gx=k0%GW,gy=(k0/GW)|0,st=[],seen=new Uint8Array(GW*GH);for(var b=-R;b<=R;b++)for(var a=-R;a<=R;a++){var X=gx+a,Y=gy+b;if(X<0||Y<0||X>=GW||Y>=GH)continue;var q=Y*GW+X;if(MP.rl[q]&1){seen[q]=1;st.push(q);}}
  while(st.length){var c=st.pop(),x=c%GW,y=(c/GW)|0;if(edge?(edge==='W'&&x===0||edge==='E'&&x===GW-1||edge==='N'&&y===0||edge==='S'&&y===GH-1):(x===0||y===0||x===GW-1||y===GH-1))return true;for(var d=0;d<8;d++){var X2=x+[1,1,0,-1,-1,-1,0,1][d],Y2=y+[0,1,1,1,0,-1,-1,-1][d];if(X2<0||Y2<0||X2>=GW||Y2>=GH)continue;var q2=Y2*GW+X2;if(!seen[q2]&&(MP.rl[q2]&1)){seen[q2]=1;st.push(q2);}}}return false;}
function enemyNear(side,x,y,R,dom){var n=0;gridNear(x,y,R,function(u){if(hostile(side,u.side)&&onMap(u)&&u.ms!=='rout'&&(!dom||ST(u).dom===dom)&&dist(u.x,u.y,x,y)<=R)n+=u.men+u.veh*8;});return n;}
function friendNear(side,x,y,R){var n=0;gridNear(x,y,R,function(u){if(u.side===side&&onMap(u)&&ST(u).dom!=='air'&&dist(u.x,u.y,x,y)<=R)n+=u.men+u.veh*8;});return n;}
/* 上游節點：指定者或最近的非補給站節點 */
function upOf(N){var L=nodesOf(N.side);if(N.up){var u=L.filter(function(q){return q.id===N.up;})[0];if(u)return u;}if(N.k!=='depot')return null;var best=null,bd=1e18;L.forEach(function(q){if(q===N||q.k==='depot')return;var d=dist(q.x,q.y,N.x,N.y);if(d<bd){bd=d;best=q;}});return best;}
var LCLS=['food','ammo','fuel','fod'],LCN={food:'糧秣飲水',ammo:'彈藥',fuel:'燃料',fod:'草料'};
/* ---------- 補給循環（每 10 分鐘）：節點進貨 → 補給部隊裝載 → 單位領取 → 消耗與匱乏效應 ---------- */
function logStep(){var dt=600;SIDES().forEach(function(side){var S=SD(side),L=nodesOf(side),hq=sideCmd(side),E=hq?uEra(hq):ERA[6];if(!L.length)return;
    var dem=sideDemand(side);/* 本方每日需求，用來分配各類物資比例 */
    L.forEach(function(N){var en=enemyNear(side,N.x,N.y,2000,'land'),fr=friendNear(side,N.x,N.y,2000);/* 民用設施的易手由佔領判定處理（facStep） */N.status=N.k==='off'?'ok':en>0&&fr===0?(N.fac?'contested':'captured'):en>0?'contested':'ok';
      if(N.status==='captured'&&N.k!=='off'){logE(side,'log','補給節點「'+N.name+'」被敵軍佔領，存量損失',N.x,N.y);N.st={food:0,ammo:0,fuel:0,fod:0};return;}
      if(N.k==='off')return;var inflow=0,why='';
      var LV=typeof lgOn==='function'&&lgOn();/* v8：物資由看得見的車隊、船隊、列車與運輸機運到（lgDispatch），這裡只記錄實際到貨 */
      if(LV){inflow=N._lgIn||0;N._lgIn=0;why=N._lgWhy||'';}
      else if(N.k==='depot'){var U=upOf(N);if(!U){why='無上游節點';}else{var d=dist(U.x,U.y,N.x,N.y)/1000,spd=E.i<=4?4:E.i<=5?15:30,trip=2*d/spd+2,tr=24/Math.max(2,trip),cap=N.cv.n*N.cv.pay*tr*dt/86400;var cut=convoyCut(side,U,N);cap*=cut;inflow=cap;if(cut<1)why='運補路線遭敵威脅';N.trips=tr;N.dist=d;
          var space=N.cap-sum(LCLS,function(c){return N.st[c];});inflow=Math.min(inflow,Math.max(0,space));var got=pull(U,N,inflow,dem);inflow=got;}}
      else{var f=N.status==='contested'?0.3:1;if(!nodeOK(N)){f=0;why=N.k==='port'?'未臨水域':'鐵路未連通地圖邊緣';}if(N.k==='air'){var w=WX[G.env.wx][5];f*=w*(G.env.light<0.3?0.6:1);if(enemyNear(side,N.x,N.y,15000,'air')>0)f*=0.5;}
        if(N.k==='port'&&G.units.some(function(u){return u.side!==side&&onMap(u)&&(ST(u).dom==='sea'||ST(u).dom==='sub')&&dist(u.x,u.y,N.x,N.y)<15000;}))f*=0.2;
        var amt=N.thr*dt/86400*f,space2=N.cap-sum(LCLS,function(c){return N.st[c];});amt=Math.min(amt,Math.max(0,space2));split(N,amt,dem);inflow=amt;}
      N.hist.push(inflow);if(N.hist.length>144)N.hist.shift();N.why=why;});
    /* 補給部隊：向最近的節點裝載 */
    if(!(typeof lgOn==='function'&&lgOn()))G.units.forEach(function(u){if(u.side!==side||!onMap(u)||!isLeaf(u)||ST(u).fl.indexOf('l')<0||u.ms==='rout')return;var lg=u.lg||logInit(u);lg.stk=lg.stk||{food:0,ammo:0,fuel:0,fod:0};var cap=Math.max(1,lg.pay)*1,R=uEra(u).sup*3000,best=null,bd=1e18;L.forEach(function(N){var d=dist(N.x,N.y,u.x,u.y);if(d<R&&d<bd&&(N.k==='off'||sum(LCLS,function(c){return N.st[c];})>0)){bd=d;best=N;}});
      if(N0edge(side,u,R))best=best||L.filter(function(N){return N.k==='off';})[0];if(!best)return;var tr=24/Math.max(1,2*bd/1000/(uEra(u).i<=4?4:25)+1),room=cap-sum(LCLS,function(c){return lg.stk[c];}),amt=Math.min(room,cap*tr*dt/86400);if(amt>0)pull(best,{st:lg.stk},amt,dem);});
    /* 單位領取與消耗 */
    G.units.forEach(function(u){if(u.side!==side||!alive(u)||u.st==='off')return;var lg=u.lg||logInit(u);consume(u,lg,dt);if(!onMap(u)&&u.st!=='base')return;var src=u.besieged&&G.t-u.besieged<1200?null:supplierOf(u,L);u.insup=!!src;
      if(src){resupply(u,lg,src,dt);u.oos=0;}else{u.oos=(u.oos||0)+dt;if(u.oos===dt&&!ST(u).dom.match(/sea|sub/))logE(side,'supply',uName(u)+'脫離補給線',u.x,u.y,u.id);}});});}
function N0edge(side,u,R){var MP=G.map,e=SD(side).edge||'W',d=e==='W'?u.x:e==='E'?MP.Wm-u.x:e==='N'?u.y:MP.Hm-u.y;return d<=R;}
function convoyCut(side,A,B){var f=1;G.units.forEach(function(u){if(u.side===side||!onMap(u)||u.ms==='rout'||ST(u).dom==='air')return;var q=segDist(u.x,u.y,A.x,A.y,B.x,B.y);if(q.d<1500)f=Math.min(f,q.d<600?0.15:0.4);});return f;}
function sideDemand(side){var d={food:0,ammo:0,fuel:0,fod:0};G.units.forEach(function(u){if(u.side!==side||!alive(u)||u.st==='off')return;var n=dayNeed(u,G.t-(u.fired||-1e9)<3600?1:0.3,30);d.food+=n.food;d.ammo+=n.ammo;d.fuel+=n.fuel;d.fod+=n.fod;});return d;}
function split(N,amt,dem){var tot=sum(LCLS,function(c){return dem[c]+0.001;});LCLS.forEach(function(c){N.st[c]+=amt*(dem[c]+0.001)/tot;});}
function pull(U,D,amt,dem){var tot=sum(LCLS,function(c){return dem[c]+0.001;}),got=0;LCLS.forEach(function(c){var want=amt*(dem[c]+0.001)/tot,have=U.k==='off'?want:Math.min(want,U.st[c]);if(U.k!=='off'&&U.st)U.st[c]-=have;D.st[c]=(D.st[c]||0)+have;got+=have;});return got;}
/* 供應來源：範圍內的補給部隊、補給節點、或本方地圖邊緣（有地圖外基地時） */
function supplierOf(u,L){var R=uEra(u).sup*1000*(hasQ(offOf(u),'logist')?1.3:1),best=null,bd=1e18,s=ST(u);if(s.dom==='sea'||s.dom==='sub'){var p=L.filter(function(N){return N.k==='port'||N.k==='off';})[0];return p||{k:'self',st:null};}
  if(u.st==='base'){var a=L.filter(function(N){return (N.k==='air'||N.k==='off')&&dist(N.x,N.y,u.x,u.y)<5000;})[0];return a||L.filter(function(N){return N.k==='off';})[0]||null;}
  flUnits(u.side,'l').forEach(function(q){if(q===u||!isLeaf(q)||!onMap(q)||!q.lg||!q.lg.stk||q._ed<1500)return;var d=dist(q.x,q.y,u.x,u.y);if(d<R&&d<bd&&sum(LCLS,function(c){return q.lg.stk[c];})>0.05){bd=d;best={k:'unit',u:q,st:q.lg.stk};}});if(best)return best;
  L.forEach(function(N){if(N.k==='off'){if(N0edge(u.side,u,R)&&!best)best=N;return;}var d=dist(N.x,N.y,u.x,u.y);if(d<R&&d<bd&&N.status!=='captured'){bd=d;best=N;}});return best;}
/* 領取：補足口糧（3 日）、草料（2 日）、彈藥（至基數）、燃料（至滿油） */
function resupply(u,L,src,dt){var st=src.st,busy=G.t-(u.fired||-1e9)<300,rate=(busy?0.3:1)*(u.ammo<30||L.food<L.dayKg*0.5?1.5:1),fr=u.men0>0?u.men/u.men0:1;function take(c,kg){if(kg<=0)return 0;if(src.k==='off'||src.k==='self'||!st)return kg;var t=Math.min(kg/1000,st[c]);st[c]-=t;return t*1000;}
  L.food+=take('food',Math.min(L.foodCap*fr-L.food,L.dayKg*rate*dt/3600*4));L.fod+=take('fod',Math.min(L.fodCap-L.fod,L.fodDay*rate*dt/3600*4));
  var uofT=L.uof*L.basic,ammoKg=(100-u.ammo)/100*uofT,dl=L.uof*L.daily*dt/86400*6*rate,g=take('ammo',Math.min(ammoKg,dl));if(uofT>0)u.ammo=Math.min(100,u.ammo+g/uofT*100);
  var fuelL=L.fuelCap-L.fuel;L.fuel+=take('fuel',Math.min(fuelL,L.fuelCap*rate*dt/3600)*0.8)/0.8;}
/* 消耗與匱乏效應：飢餓降低士氣與戰力、缺草料使馬匹衰弱、缺油使車輛停擺 */
function consume(u,L,dt){var fr=u.men0>0?u.men/u.men0:1,day=dt/86400,s=ST(u);L.food=Math.max(0,L.food-L.dayKg*fr*day);var forage=L.fodDay>0?(seasonOf(now().m,G.map.lat0||35)==='su'||seasonOf(now().m,G.map.lat0||35)==='au'?0.5:0.15):0;L.fod=Math.max(0,L.fod-L.fodDay*(1-forage)*day);
  var km=(u.km||0)-(L.km0||0);L.km0=u.km||0;L.fuel=Math.max(0,L.fuel-L.lPerKm*km-(s.dom==='sea'||s.dom==='sub'?L.lPerH*dt/3600*0.5:0));
  var need=3000+(u.fat>50?500:0)+(G.env.T<0?700:0),kc=L.food>0?L.dayKc:0,ratio=kc/need;L.hun=clamp((L.hun||0)+(ratio<0.85?(1-ratio)*30*day:-20*day),0,100);
  if(L.food>0&&L.mo)u.mor=clamp(u.mor+L.mo*0.5*day*(L.hot&&!(u._ed<3000)?1:0.6),0,100);if(L.hun>50)u.mor=clamp(u.mor-(L.hun-50)/50*6*day*24/24,0,100);if(L.hun>80&&rnd()<day*0.5){var lost=u.men*0.01;u.men-=lost;G.stats[u.side].cas+=0;L.desert=(L.desert||0)+lost;}
  if(L.fodDay>0&&L.fod<=0&&L.h>0){L.h=Math.max(0,L.h-L.h*0.02*day*24);}}
/* 戰力修正：武器數量、飢餓、彈藥 */
function lgFire(u){var L=u.lg;if(!L)return 1;var f=1;if(L.hun>50)f*=1-(L.hun-50)/50*0.4;return f;}
/* 武器修正後的實際火力參數（內建類型以預設武器為基準，比例調整；新增的武器類別則直接加上） */
function WF(u){return (u.lg&&u.lg.wpnF)||WF0;}var WF0={p:1,a:1,pAdd:0,aAdd:0,penD:0,penAbs:0,sup:1,rng:1,ind:1,indAbs:0,aaD:0,nv:0};
function saOf(u,s){var f=WF(u);return s.sa*f.p+f.pAdd;}
function haOf(u,s){var f=WF(u);return s.ha*f.a+f.aAdd;}
function penE(u,s){var f=WF(u);return f.penAbs?f.penAbs:penOf(s,u)+f.penD;}
function indOf(u,s){var f=WF(u);return s.ind>0?s.ind*f.ind:f.indAbs||0;}
function rngF(u){return WF(u).rng;}
function aaOf(u,s){return Math.max(0,(s.aa||0)+WF(u).aaD);}
function nvOf(u,s){return Math.max(s.nv||0,WF(u).nv||0);}
function lgSpeed(u){var L=u.lg;if(!L)return 1;var s=ST(u),f=1;if(L.fuelCap>0&&L.fuel<=0&&(s.mobi===3||s.mobi===4))f*=0.05;if(L.h0>0&&L.fodDay>0&&L.fod<=0)f*=0.7;if(L.h0>0&&L.h<L.h0*0.6&&(s.mobi===1||s.mobi===2))f*=0.6;if(L.hun>60)f*=0.8;return f;}
/* 本方後勤總覽 */
function logSummary(side){var o={need:{food:0,water:0,ammo:0,fuel:0,fod:0},stock:{food:0,ammo:0,fuel:0,fod:0},nodes:nodesOf(side),units:0,oos:0,hungry:0,men:[0,0,0],w:{}};G.units.forEach(function(u){if(u.side!==side||!alive(u)||u.st==='off')return;var L=u.lg||logInit(u),n=dayNeed(u,0.5,40);for(var k in n)o.need[k]+=n[k];o.units++;if(u.insup===false)o.oos++;if(L.hun>40)o.hungry++;
    if(isLeaf(u)||u.hq){var fr=u.men0>0?u.men/u.men0:1;for(var i=0;i<3;i++)o.men[i]+=L.rk[i]*fr;L.w.forEach(function(x){o.w[x[0]]=(o.w[x[0]]||0)+x[1];});}});
  o.nodes.forEach(function(N){if(N.k==='off')return;LCLS.forEach(function(c){o.stock[c]+=N.st[c];});});return o;}

/* 空中單位整補：由所在機場（或地圖外基地）扣除一個架次的燃料與彈藥 */
function airRearm(u){var L=u.lg||logInit(u),s=ST(u),B=baseOf(u),nodes=nodesOf(u.side),N=null,bd=1e18;nodes.forEach(function(q){if(q.k!=='air'&&q.k!=='off'&&q.k!=='port')return;var d=q.k==='off'?(N0edge(u.side,{x:B[0],y:B[1]},8000)?0:1e9):dist(q.x,q.y,B[0],B[1]);if(d<6000&&d<bd){bd=d;N=q;}});
  if(!N||N.k==='off')return true;var fuel=L.lPerH*endOf(s)/3600*0.8/1000,ammo=L.uof*L.basic/1000;if(N.st.fuel<fuel*0.5||N.st.ammo<ammo*0.5)return false;N.st.fuel=Math.max(0,N.st.fuel-fuel);N.st.ammo=Math.max(0,N.st.ammo-ammo);return true;}
