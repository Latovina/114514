/* ===================== 說明頁：「功能說明」與「更新日誌」分開 =====================
   功能說明：把各版本加入的說明依主題分類（地圖與天氣、部隊、指揮、戰鬥、後勤、裝備庫……），標題去掉版本號，可以搜尋、展開與收合。
   更新日誌：依日期列出每次更新的內容；更早的版本列出各版的主題。之後的更新在 CHLOG 最前面加一筆即可。 ===================== */
var HELPV={tab:'feat',q:''};
/* 更新日誌（新的在前）：d 日期、t 標題、i 項目 */
var CHLOG=[
 {d:'2026-11-05',t:'部隊點數依花費、排與組的戰術、雪地與高山、對抗措施',i:[
  '說明頁分成「功能說明」與「更新日誌」：功能依主題分類、可搜尋；更新日誌依日期整理。',
  '部隊點數改依花費計算：購置（裝備、載具、人員徵募與訓練）＋維持費（薪餉、糧秣、平時用油、維修，預設 30 天）＋後勤累積（身上與補給站的彈藥、燃料、糧秣），以 2020 年美元計、每點 10 萬美元；原本依火力與兵力的算法改稱「戰力」，並列顯示，也可在設定切回。',
  '排與組：組成為地圖上最小的元素，仍不能直接下令或拆出連；在連長聯絡得到的範圍內，依命令、訓練、經驗與指揮官的個性部署與移動（交替掩護前進或後撤、大規模衝鋒、口袋防禦、環形防禦、伏擊、縱隊、無組織後撤）。戰鬥的排在前、支援的排在後。',
  '積雪依緯度、海拔與天氣累積，融雪造成泥濘並直接畫進地圖；高處積雪的路段額外減速。',
  '高山症：非山地部隊到高海拔會逐漸適應，太快上山可能出現病患並後送。水土不服：可設定各方的原駐地氣候，部隊到差異大的氣候區頭幾週會出現病患。',
  '對抗措施：1968 年後的飛機遭紅外線飛彈攻擊時施放熱焰彈，1965 年後對雷達導引施放干擾絲，數量有限、回基地補充；戰車遭反戰車飛彈射擊或鎖定時，可能提前施放煙幕（有雷射預警或主動防護時較容易察覺）。',
  '火焰噴射器（背負式、車載）與火焰的畫面效果。',
  '原始碼改存於儲存庫，方便維護（不影響遊戲）。']},
 {d:'2026-10-28',t:'裝備不能超模、彈坑改變地形',i:[
  '裝備只能用詳細設計建立（口徑、裝藥、材料、重量……），數值依設計與年代的現實上限計算；匯入的裝備也會套用同樣的限制，被修正的項目會註明「現實限制」。',
  '彈坑與戰場動態直接改變地形（坑窪、爛泥、道路損毀），不再疊加圖案；大量砲擊時不再卡頓，最慢的一幀由約 4.4 秒降到 0.5 秒，尋路也快了約三成。']},
 {d:'2026-10-26',t:'三方作戰',i:[
  '三方作戰：單機的三方對戰與聯機 3v3v3；第三方在自己那一邊的中段部署。',
  '補給、裝備、武器與載具整合為同一套系統。']},
 {d:'2026-10-25',t:'兵牌、恐懼、飢荒、戰爭罪與交戰守則',i:[
  '飛機每次出擊依任務選擇掛載。',
  '交戰守則、誤判平民、授權命令與戰場裁量權；各地區的部隊台詞。',
  '彈坑、戰場墓地與預先規劃的戰壕。',
  '戰爭罪的證據、堤壩決堤造成的淹水、台詞風格與自訂台詞。',
  '行軍與久守前線造成的疲憊值、兵牌狀態條、新的哨音。',
  '單位裡的載具、列裝與即時計算的部隊點數。',
  '全螢幕地圖上的浮動視窗與可拖曳的面板。',
  '閃退復原、手機版面、夜色與更多畫面效果。',
  '飢荒與相關紀錄、部隊對話。',
  '恐懼值、死人衝鋒、處決戰俘的紀錄與異界的存在。',
  '排以兵牌樣式繪製，可設定顯示方式。',
  '兵牌隨朝向轉動、較細的線條與淡色填色；明代旗幟、二戰德軍符號與自行上傳的兵牌；北約與華約樣式、分隊顏色與隊徽。',
  '地圖上看得見的傳令兵、部隊回報，以及給敵方的訊息。']},
 {d:'2026-10-24',t:'設定、自動化與補充',i:[
  '設定集中在同一頁，命令統一成一張表，按鍵可以重新設定。',
  '地圖更流暢、卡頓更短、存檔更安全。',
  '待命、火力支援與部隊自動化（參考 Command Ops 的做法）。',
  '補充兵更快到位、傷兵康復後歸隊、車輛修理。']},
 {d:'2026-10-19',t:'就地籌措與戰役編輯器',i:[
  '戰場上的就地籌措與飲水。',
  '戰役編輯器：戰區地圖與腳本化的作戰；戰役的區域地圖更貼近戰區地圖。']},
 {d:'2026-10-18',t:'裝備庫、化生放核、測量與作戰計畫',i:[
  '裝備庫與編輯器頁、伺服器背景音樂、範本、8 人聯機房間、頭像。',
  '測量工具（距離、面積、角度、射程圈、剖面、通視）。',
  '指揮官頭像編輯器；自訂貨幣（以美元匯率換算）；戰報的戰爭花費。',
  '支援裝備的效果、醫療與 CBRN 物資、空軍與海軍設計、彈藥、飛彈航跡與航路規劃。',
  '化學、生物、核子與魔法武器的設計工具；LatoArmory（導引彈藥、化生放核魔設計器、貨幣）嵌入作戰模擬。',
  '地標、核電廠與立體建築（微 3D）。',
  '連由排組成。',
  '聯機：可調整時限、通信單位、情報與友軍迷霧；房間裡可調整所有模擬設定。',
  '風與天氣圖層、天氣音效、蓋格計數器、各時代的交火聲。',
  '選用的異變環境（喪屍與寄生蟲）。',
  '部隊會延續玩家的命令，路線更直。',
  '可調整的目標區範圍與遊戲模式；事先排好、部隊自行執行的作戰計畫；可編輯關係的第三方陣營。']},
 {d:'2026-10-17',t:'砲兵散布與指揮移交',i:[
  '聯機戰鬥也有音效與畫面效果。',
  '寫實的砲兵散布；飽和打擊錯開瞄準點，首輪齊射有奇襲效果。',
  '移交、接管與共享指揮；自訂盟軍顏色；部隊番號。']}
];
/* 功能說明的分類（依標題比對，先符合者優先） */
var HELPCAT=[
 ['mp','聯機',/聯機/],
 ['arm','裝備庫與設計',/裝備庫|裝備只能|武器與熟練|武器裝備|彈藥|LatoArmory|化生放核|列裝|載具|掛載|物資與裝備/],
 ['log','後勤、補給與醫療',/後勤|補給|油料|鐵路|物資|飲水|飢荒|醫療|戰俘營|承載|運輸|長期作戰|資源/],
 ['civ','平民、軍紀與戰爭的代價',/平民|難民|戰俘|戰爭罪|交戰守則|態度|花費|記者|代價|居民|紀律/],
 ['cbrn','化生放核與異變環境',/核|CBRN|化學|異變|喪屍/],
 ['map','地圖、地形與天氣',/工兵|橋|隧道|地圖|地形|道路|城鎮|城市|河|洪水|堤壩|地標|建築|彈坑|積雪|天氣|風|夜|視野|事件|戰場生成|雪/],
 ['cmd','指揮、命令與 AI',/迷霧|指揮|命令|計畫|授權|通訊|通信|傳令|自動化|AI|決策|手繪|戰線|多位/],
 ['unit','部隊與編制',/部隊|排|番號|兵牌|編制|增援|點數|頭像|男女|單位|陣營|三方|兵種|兵力/],
 ['fight','戰鬥與火力',/交戰|砲|航空|飛彈|轟炸|誤擊|士氣|恐懼|疲憊|對抗|殺傷|匿蹤|防空|海上|攻擊|戰鬥|火|高山/],
 ['ui','介面、模式與音效',/回放|操作|太平洋|效能|浮動|手機|測量|穩定|音樂|音效|畫面|模式|戰役|劇本|戰報|台詞|對話|命名|延續|目標區/],
 ['etc','其他',/./]];
/* 標題裡同時有好幾個主題的，直接指定 */
var HELPPIN=[[/^排與組|^排（/,'unit'],[/轟炸機、航艦|^殺傷效率|^海上部隊/,'fight'],[/^多位指揮官|^手繪作戰圖/,'cmd'],[/台詞|對話|命名|頭像|效能|環境音/,'ui']];
function helpCat(t){for(var j=0;j<HELPPIN.length;j++)if(HELPPIN[j][0].test(t))return HELPPIN[j][1];for(var i=0;i<HELPCAT.length;i++)if(HELPCAT[i][2].test(t))return HELPCAT[i][0];return 'etc';}
/* 從舊的說明頁取出各段：{t 標題（去掉版本號）, v 版本, h 內容} */
function helpSecs(card){var H=[].slice.call(card.querySelectorAll('h4')),S=[];
  H.forEach(function(h,i){var t=h.textContent.trim(),m=/^v(\d+)：\s*/.exec(t),v=m?+m[1]:i<HELPBASE?0:14,body='',n=h.nextSibling;
    while(n&&!(n.nodeType===1&&(n.tagName==='H4'||n.querySelector&&n.querySelector('h4')))){body+=n.nodeType===1?n.outerHTML:(n.nodeType===3?esc(n.textContent):'');n=n.nextSibling;}
    var hv=helpVOf(h.textContent.trim());if(!m&&hv)v=hv;S.push({t:m?t.slice(m[0].length):t,v:v,h:body,c:helpCat(t)});});return S;}
/* 標題屬於哪一版：v5～v13 的說明字串與後來各模組加入的說明 */
function helpVOf(t){var V={5:typeof V5HELP==='string'?V5HELP:'',6:typeof V6HELP==='string'?V6HELP:'',7:typeof V7HELP==='string'?V7HELP:'',8:typeof V8HELP==='string'?V8HELP:'',9:typeof V9HELP==='string'?V9HELP:'',10:typeof V10HELP==='string'?V10HELP:'',11:typeof V11HELP==='string'?V11HELP:'',12:typeof V12HELP==='string'?V12HELP:'',13:typeof V13HELP==='string'?V13HELP:''},k,div=document.createElement('div');
  for(k in V){if(!V[k])continue;div.innerHTML=V[k];if([].some.call(div.querySelectorAll('h4'),function(h){return h.textContent.trim()===t;}))return +k;}
  div.innerHTML=HELP14.join('');return [].some.call(div.querySelectorAll('h4'),function(h){return h.textContent.trim()===t;})?14:0;}
var HELPBASE=0;
function helpVer(v){return v===0?'基本':v>=14?'v14 起':'v'+v;}
function helpFeatHtml(S,intro){var q=HELPV.q||'',o='<div class="lw-row" style="flex-wrap:wrap;gap:4px;margin:6px 0">'+HELPCAT.filter(function(c){return S.some(function(s){return s.c===c[0];});}).map(function(c){return '<a class="lw-btn sm" href="#help-'+c[0]+'" data-a="helpcat" data-v="'+c[0]+'">'+esc(c[1])+'（'+S.filter(function(s){return s.c===c[0];}).length+'）</a>';}).join('')+'</div>'+
  '<input type="search" data-i="helpq" placeholder="搜尋說明，例如：油料、煙幕、高山症" value="'+esc(q)+'" aria-label="搜尋說明" style="width:100%;max-width:420px;margin:4px 0 8px">'+intro;
  HELPCAT.forEach(function(c){var L=S.filter(function(s){return s.c===c[0];});if(!L.length)return;o+='<h3 id="help-'+c[0]+'" class="lw-helpcat" style="margin:14px 0 4px">'+esc(c[1])+'</h3>'+L.map(function(s){return '<details class="lw-helpsec"><summary><b>'+esc(s.t)+'</b> <span class="lw-note" style="display:inline">'+helpVer(s.v)+'</span></summary>'+s.h+'</details>';}).join('');});
  return o;}
function helpLogHtml(S){var o='<p class="lw-note">每次更新的內容，新的在前。各功能的完整用法請看「功能說明」。</p>';
  CHLOG.forEach(function(e){o+='<h4>'+esc(e.d)+'：'+esc(e.t)+'</h4><ul>'+e.i.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>';});
  var V={};S.forEach(function(s){if(s.v>0&&s.v<14)(V[s.v]=V[s.v]||[]).push(s.t);});
  o+='<h4>更早的版本</h4><ul>';Object.keys(V).map(Number).sort(function(a,b){return b-a;}).forEach(function(v){o+='<li><b>v'+v+'</b>：'+V[v].map(esc).join('、')+'</li>';});
  var B=S.filter(function(s){return s.v===0;}).map(function(s){return esc(s.t);});if(B.length)o+='<li><b>最初的版本</b>：'+B.join('、')+'</li>';
  return o+'</ul>';}
function helpFilter(root,q){q=(q||'').trim().toLowerCase();var any={};root.querySelectorAll('.lw-helpsec').forEach(function(d){var hit=!q||d.textContent.toLowerCase().indexOf(q)>=0;d.style.display=hit?'':'none';d.open=!!q&&hit;var h=d.previousElementSibling;while(h&&!h.classList.contains('lw-helpcat'))h=h.previousElementSibling;if(h&&hit)any[h.id]=1;});
  root.querySelectorAll('.lw-helpcat').forEach(function(h){h.style.display=any[h.id]?'':'none';});}
(function(){var base=PAGES.help;PAGES.help=function(host){base(host);var card=host.querySelector('.lw-card');if(!card)return;
  /* 最初版本的段落數（第一段 v 版說明以前的都是） */
  var H=[].slice.call(card.querySelectorAll('h4'));HELPBASE=H.findIndex(function(h){return /^v\d+：/.test(h.textContent.trim());});if(HELPBASE<0)HELPBASE=H.length;
  var S=helpSecs(card),intro='';[].slice.call(card.children).some(function(n){if(n.tagName==='H4'||n.tagName==='DIV')return true;if(n.tagName!=='H3')intro+=n.outerHTML;return false;});
  var tabs='<div class="lw-row" style="gap:4px;margin:4px 0 8px">'+[['feat','功能說明'],['log','更新日誌']].map(function(q){return '<button type="button" class="lw-btn sm'+(HELPV.tab===q[0]?' pri':'')+'" data-a="helptab" data-v="'+q[0]+'">'+q[1]+'</button>';}).join('')+'</div>';
  card.innerHTML='<h3>作戰模擬工具說明</h3>'+tabs+(HELPV.tab==='log'?helpLogHtml(S):helpFeatHtml(S,intro));
  if(HELPV.tab!=='log'&&HELPV.q)helpFilter(card,HELPV.q);};})();
ACT.helptab=function(b){HELPV.tab=b.getAttribute('data-v');show('help');};
ACT.helpcat=function(b){var e=document.getElementById('help-'+b.getAttribute('data-v'));if(e&&e.scrollIntoView)e.scrollIntoView({block:'start'});};
INP.helpq=function(t){HELPV.q=t.value;helpFilter(t.closest('.lw-card'),t.value);};
