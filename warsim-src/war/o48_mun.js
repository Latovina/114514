/* ===================== 飛彈、魚雷、炸彈與火箭列入彈藥：LatoVehicle 的彈藥表＋自訂彈藥（可設計），武器可連結這些彈藥 =====================
   價格以東銀圓計（×匯率＝美元）。武器連結彈藥後，依彈頭（爆炸面積約與裝藥量的 2/3 次方成正比）、射程、命中率與速度，相對於該武器原本的彈藥換算作戰參數，
   並把彈藥的關鍵數據存在武器上（mud）：作戰中的區域外飛彈打擊、防空飛彈射程與艦隊防空都依此計算（見 h45_navair.js）。 */
function munInfo(m){var o=[],v=(m.mach||0)*340;if(m.rng>0&&v>0)o.push('最大射程飛行約 '+durTxt(m.rng*1000/v));if(m.wh>0&&LAL&&LAL.blastRadius){try{o.push('彈頭爆壓殺傷半徑約 '+fmt(LAL.blastRadius(m.wh,35))+' 公尺、玻璃破碎約 '+fmt(LAL.blastRadius(m.wh,7))+' 公尺');}catch(e){}}
  if(m.kg>0)o.push('每公斤 '+amoney(munUsd(m)/m.kg));return o.join('；');}
/* ---------- 彈藥頁：砲彈與火箭彈／飛彈、魚雷與炸彈 ---------- */
AR.am=AR.am||'p';AR.mt='';AR.mq='';
(function(){var b=armAHtml;armAHtml=function(){var tg='<div class="lw-row">'+[['p','砲彈與火箭彈（LatoArmory）'],['m','飛彈、魚雷與炸彈（LatoVehicle）']].map(function(t){return '<button type="button" class="lw-btn sm'+(AR.am===t[0]?' pri':'')+'" data-a="aram" data-v="'+t[0]+'">'+t[1]+'</button>';}).join('')+'</div>';return tg+(AR.am==='m'?munHtml():b());};})();
ACT.aram=function(b){AR.am=b.getAttribute('data-v');armoryDlg('a');};
function munHtml(){var L=munList().filter(function(m){return (!AR.mt||m.t===AR.mt)&&(!AR.mq||m.n.indexOf(AR.mq)>=0);}).sort(function(a,b){return a.t<b.t?-1:a.t>b.t?1:a.rng-b.rng;});
  var o='<div class="lw-note">導引飛彈、魚雷、炸彈與火箭也是彈藥：武器（反艦飛彈、魚雷、防空飛彈、炸彈、反戰車飛彈、巡飛彈……）可在「武器 → 編輯」連結其中一種，作戰參數與每發價格隨之換算；載具設計的掛載與發射單元也使用這張表。內建數據來自 LatoVehicle；可複製後修改，或新增自訂彈藥。</div>'+
    '<div class="lw-row"><label>種類 <select data-c="armt"><option value="">全部</option>'+Object.keys(MUNT).map(function(t){return '<option value="'+t+'"'+(AR.mt===t?' selected':'')+'>'+MUNT[t]+'</option>';}).join('')+'</select></label><label>搜尋 <input type="text" value="'+esc(AR.mq)+'" data-c="armq" style="width:9em"></label><button type="button" class="lw-btn sm pri" data-a="armnew">＋新增自訂彈藥</button></div>'+
    '<div class="lw-sc" style="max-height:56vh;overflow:auto"><table class="lw-tbl lw-muntbl"><tr><th>彈藥</th><th>種類</th><th>平台</th><th class="n">重量</th><th class="n">彈頭</th><th class="n">射程</th><th class="n">速度</th><th class="n">命中率</th><th class="n">每枚</th><th></th></tr>';
  L.forEach(function(m){var cu=G.muns&&G.muns[m.id],bi=munBuiltin(m.id);o+='<tr><td>'+esc(m.n)+(cu?' <span class="lw-pill">'+(bi?'已修改':'自訂')+'</span>':'')+(m.nuke?' <span class="lw-pill">核</span>':'')+'</td><td>'+esc(MUNT[m.t]||m.t)+'</td><td>'+esc(munPl(m))+'</td><td class="n">'+fmt(m.kg)+' kg</td><td class="n">'+(m.wh?fmt(m.wh)+' kg':'—')+'</td><td class="n">'+(m.rng?kmTxt(m.rng*1000):'—')+'</td><td class="n">'+(m.mach?'M '+fx(m.mach,1):'—')+'</td><td class="n">'+pct(munPk(m)*100)+'</td><td class="n">'+amoney(munUsd(m))+'</td>'+
    '<td><button type="button" class="lw-btn sm" data-a="armed" data-v="'+esc(m.id)+'">編輯</button><button type="button" class="lw-btn sm" data-a="armcp" data-v="'+esc(m.id)+'">複製</button></td></tr>';});
  return o+'</table></div>';}
CHG.armt=function(t){AR.mt=t.value;armoryDlg('a');};CHG.armq=function(t){AR.mq=t.value.trim();armoryDlg('a');};
function munNewId(){G.museq=(G.museq||0)+1;return 'cm'+G.museq;}
ACT.armnew=function(){var id=munNewId();G.muns=G.muns||{};G.muns[id]={id:id,n:'自訂飛彈 '+G.museq,t:'agm',kg:100,wh:20,rng:10,mach:1,pk:0.8,dy:Math.round(munEstUsd({t:'agm',kg:100,rng:10})/(CUR.rate||2.5)),pl:'a',cus:1};rlMun(G.muns[id],AR.mrl=[]);munEd(id);};
ACT.armcp=function(b){var src=munOf(b.getAttribute('data-v'));if(!src)return;var id=munNewId(),m=clone(src);m.id=id;m.n=src.n+'（複製）';m.cus=1;delete m.code;G.muns=G.muns||{};G.muns[id]=m;AR.mrl=[];munEd(id);};
ACT.armed=function(b){var id=b.getAttribute('data-v');if(!(G.muns&&G.muns[id])){var src=munOf(id);if(!src)return;G.muns=G.muns||{};G.muns[id]=clone(src);}munEd(id);};
var MUNF=[['n','名稱','t'],['kg','全重（公斤）','n'],['wh','彈頭（公斤）','n'],['rng','射程（公里）','n'],['mach','速度（馬赫）','n'],['pk','命中率（0～1）','n'],['rcs','雷達截面積（m²）','n']];
function munEd(id){var m=G.muns[id];AR.mcur=id;var bi=munBuiltin(id),o='<h3 style="margin:0 0 6px">彈藥設計：'+esc(m.n)+'</h3><div class="lw-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:4px 10px">'+
    '<label style="font-size:12px;display:block">種類<br><select data-c="armf" data-f="t" style="width:100%">'+Object.keys(MUNT).map(function(t){return '<option value="'+t+'"'+(m.t===t?' selected':'')+'>'+MUNT[t]+'</option>';}).join('')+'</select></label>'+
    MUNF.map(function(f){var v=m[f[0]];return '<label style="font-size:12px;display:block">'+f[1]+'<br><input type="'+(f[2]==='n'?'number':'text')+'" step="any" value="'+esc(v===undefined?'':v)+'" data-c="armf" data-f="'+f[0]+'" style="width:100%"></label>';}).join('')+
    '<label style="font-size:12px;display:block">單價（依種類、重量與射程算出）<br><b class="lw-munusd">'+amoney(munUsd(m))+'</b></label></div>'+
    '<div class="lw-row">'+[['act','主動尋標（射後不理）'],['abm','可攔截彈道飛彈'],['nuke','核彈頭']].map(function(f){return '<label><input type="checkbox" data-c="armb" data-f="'+f[0]+'"'+(m[f[0]]?' checked':'')+'> '+f[1]+'</label>';}).join('')+
    '<span>平台：</span>'+Object.keys(MUNPL).map(function(c){return '<label><input type="checkbox" data-c="armpl" data-f="'+c+'"'+(String(m.pl||'').indexOf(c)>=0?' checked':'')+'> '+MUNPL[c]+'</label>';}).join('')+'</div>'+
    '<div class="lw-note lw-muninfo">'+esc(munInfo(m))+'</div><div class="lw-note">連結的武器：'+(munUsers(id).map(function(w){return esc(w.n);}).join('、')||'（沒有）')+'</div>'+
    '<div class="lw-note lw-munrl">'+(AR.mrl&&AR.mrl.length?'已依現實限制調整：'+esc(AR.mrl.join('；')):'射程、彈頭與速度不能超過同類最好的真實彈藥，射程與彈頭越大越重、越貴。')+'</div><div class="lw-row">'+(bi?'<button type="button" class="lw-btn sm" data-a="armrst">恢復內建值</button>':'<button type="button" class="lw-btn sm dng" data-a="armdel">刪除</button>')+'<button type="button" class="lw-btn sm pri" data-a="armok">完成</button></div>';
  UI.wdlg&&UI.wdlg.remove();UI.wdlg=dlg(o,true);}
function munUsers(id){var o=[];if(G&&G.wpns)for(var k in G.wpns)if(G.wpns[k].mu===id)o.push(G.wpns[k]);return o;}
/* 彈藥改了：重新換算連結的武器，載具設計重算 */
function munChanged(id){VCA={};munUsers(id).forEach(function(w){munApply(w);});if(typeof wpnChanged==='function')try{wpnChanged();}catch(e){}}
CHG.armf=function(t){var m=G.muns[AR.mcur],f=t.getAttribute('data-f');if(!m)return;if(f==='usd')return;if(t.type==='number')m[f]=Math.max(0,+t.value||0);else m[f]=String(t.value).slice(0,60);var N=[];rlMun(m,N);AR.mrl=N;munChanged(AR.mcur);
  if(N.length||f==='t'){munEd(AR.mcur);return;}var i=UI.wdlg&&UI.wdlg.querySelector('.lw-muninfo');if(i)i.textContent=munInfo(m);var u=UI.wdlg&&UI.wdlg.querySelector('.lw-munusd');if(u)u.textContent=amoney(munUsd(m));var r=UI.wdlg&&UI.wdlg.querySelector('.lw-munrl');if(r)r.textContent='射程、彈頭與速度不能超過同類最好的真實彈藥，射程與彈頭越大越重、越貴。';};
CHG.armb=function(t){var m=G.muns[AR.mcur];if(!m)return;var f=t.getAttribute('data-f');if(t.checked)m[f]=1;else delete m[f];var N=[];rlMun(m,N);AR.mrl=N;munChanged(AR.mcur);if(N.length)munEd(AR.mcur);};
CHG.armpl=function(t){var m=G.muns[AR.mcur];if(!m)return;var c=t.getAttribute('data-f'),s=String(m.pl||'').split(c).join('');m.pl=t.checked?s+c:s;};
ACT.armest=function(){var m=G.muns[AR.mcur];if(!m)return;rlMun(m,AR.mrl=[]);munChanged(AR.mcur);munEd(AR.mcur);};
ACT.armrst=function(){if(G.muns)delete G.muns[AR.mcur];munChanged(AR.mcur);armoryDlg('a');};
ACT.armdel=function(){var id=AR.mcur;if(G.muns)delete G.muns[id];munUsers(id).forEach(function(w){delete w.mu;delete w.mud;});VCA={};armoryDlg('a');};
ACT.armok=function(){armoryDlg('a');};
function armWMunHtml(w){var T=wMunTypes(w);if(!T&&!w.mu)return '';var m=munOf(w.mu),L=munList().filter(function(q){return !T||T.indexOf(q.t)>=0;});
  return '<h4 style="margin:8px 0 4px">導引彈藥（飛彈、魚雷、炸彈）</h4><div class="lw-note">'+(m?'已連結「'+esc(m.n)+'」：'+esc(MUNT[m.t]||m.t)+'、射程 '+(m.rng?kmTxt(m.rng*1000):'—')+'、彈頭 '+(m.wh?fmt(m.wh)+' 公斤':'—')+'、命中率 '+pct(munPk(m)*100)+'、每枚 '+amoney(munUsd(m)):'未連結（沿用內建數值）')+'</div>'+
    '<div class="lw-row"><select data-k="wmuadd">'+L.map(function(q){return '<option value="'+esc(q.id)+'"'+(w.mu===q.id?' selected':'')+'>'+esc(MUNT[q.t]+'：'+q.n)+'</option>';}).join('')+'</select><button type="button" class="lw-btn sm pri" data-a="wmuset" title="依彈藥的彈頭、射程與命中率換算殺傷、射程、防空與每發價格">連結並換算</button>'+(w.mu?'<button type="button" class="lw-btn sm" data-a="wmudel">取消連結</button>':'')+'</div>';}
(function(){var b=wpnEdDlg;wpnEdDlg=function(){b();var E=WL.edit,d=UI.wdlg&&UI.wdlg.firstChild;if(!E||!d)return;var h=armWMunHtml(E.w);if(!h)return;var rows=d.querySelectorAll('.lw-row'),last=rows[rows.length-1],s=document.createElement('div');s.innerHTML=h;if(last)d.insertBefore(s,last);else d.appendChild(s);};})();
ACT.wmuset=function(){var E=WL.edit,s=UI.wdlg&&UI.wdlg.querySelector('[data-k="wmuadd"]');if(!E||!s)return;E.w.mu=s.value;if(!munApply(E.w)){toast('找不到這種彈藥。');return;}wpnEdDlg();toast('已連結並換算：對人 '+fx(E.w.pP,3)+'、對裝甲 '+fx(E.w.pA,3)+(E.w.rE?'、射程 '+kmTxt(E.w.rE):'')+(E.w.aa?'、防空 '+fx(E.w.aa,2):'')+'、每發 '+amoney(E.w.rusd)+'。按「儲存」套用。',5000);};
ACT.wmudel=function(){var E=WL.edit;if(!E)return;munUnlink(E.w);wpnEdDlg();};
/* 存檔與載具計算 */
HELP14.push('<h4>飛彈、魚雷與炸彈也是彈藥</h4><ul><li>「裝備庫 → 彈藥 → 飛彈、魚雷與炸彈」列出 LatoVehicle 的對空、防空、空對地、反輻射、反艦、巡弋飛彈、火箭、集束炸彈、炸彈、導引炸彈與魚雷：重量、彈頭、射程、速度、命中率、平台與每枚價格。可以複製修改或新增自訂彈藥（含主動尋標、反彈道、核彈頭），並估算價格、爆壓殺傷半徑。</li>'+
  '<li>武器可在「編輯」連結一種彈藥：反艦飛彈、魚雷、防空飛彈、單兵防空飛彈、炸彈、反戰車飛彈、巡飛彈……。依彈頭（爆炸面積約與裝藥量的 2/3 次方成正比）、射程、命中率換算殺傷、射程、防空值與每發價格；彈藥改了，連結的武器會跟著重算。</li>'+
  '<li>作戰中：艦艇與部隊的反艦或巡弋飛彈依連結彈藥的射程、速度、彈頭與命中率發射；防空飛彈的射程取彈藥射程（不超過雷達能引導的距離）；載具設計的掛載也從這張表取用。</li></ul>');
