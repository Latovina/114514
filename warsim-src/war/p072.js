/* ===================== 戰爭花費：戰報頁的帳目、設定頁的單價 ===================== */
if(typeof GKEYS!=='undefined')GKEYS.push('cost');
function costQ(r){var q=r.q;return r.u==='公升'?fmt(Math.round(q))+' 公升':r.u==='噸'?fx(q,q>=100?0:q>=10?1:2)+' 噸':fmt(Math.round(q))+' '+r.u;}
/* 表格內只用顯示幣種，總計才附美元 */
function amoneyS(usd){var c=curOf(CUR.sel);return curFmt((+usd||0)/c.usd,c);}
function costPTxt(r){if(!(r.p>0))return '—';return amoneyS(r.p)+'／'+(r.u==='公升'?'公升':r.u==='噸'?'噸':r.u==='人'?'人':r.u==='人份'?'人份':'件');}
function costCardHtml(){if(!G||!G.started)return '';var days=Math.max(G.t/86400,1/24),sides=SIDES().filter(function(s){return UI.side<0||s===UI.side||G.over||!G.set.fog;});if(!sides.length)return '';var P=costP();
  var o='<div class="lw-card lw-costcard"><h3>戰爭花費<small>以'+esc(curName())+'計，燃料每升 '+amoney(P.fuel*P.haul)+'（基價 '+amoney(P.fuel)+'，含前線運補 ×'+fx(P.haul,2)+'）</small></h3><div class="lw-cg">';
  sides.forEach(function(s){var R=costRows(s),tot=R.reduce(function(a,r){return a+r.usd;},0);o+='<div><b style="color:'+G.sides[s].color+'">'+esc(G.sides[s].name)+'：'+amoney(tot)+'</b><div class="lw-note">平均每天 '+amoney(tot/days)+'</div><table class="lw-tbl"><tr><th>項目</th><th class="n">用量</th><th class="n">單價</th><th class="n">金額</th></tr>'+
    R.map(function(r){return '<tr><td>'+r.n+'</td><td class="n">'+costQ(r)+'</td><td class="n">'+costPTxt(r)+'</td><td class="n">'+amoneyS(r.usd)+'</td></tr>';}).join('')+'</table></div>';});
  var civ=G.civ&&G.civ.prop?G.civ.prop:null;return o+'</div><div class="lw-note">用量由各部隊的存量變化累計（補給到貨不算消耗），飛機依空中時間計油耗；醫療物資含傷患用量（每名傷患約 8 公斤）。單價可在「設定」的「戰爭花費單價」調整。'+(civ?'平民財產損失另計（見上方，以想定貨幣計）。':'')+'</div></div>';}
(function(){var b=PAGES.rep;PAGES.rep=function(host){b(host);try{var main=host.querySelector('.lw-main');if(!main||!G||!G.started)return;var d=document.createElement('div');d.innerHTML=costCardHtml();if(d.firstChild)main.appendChild(d.firstChild);}catch(e){}};})();
/* 設定：單價 */
function costSetHtml(){var y=G.set.y,D=costPrice(y),P=costP();return '<div class="lw-note">美元；預設依 '+y+' 年的物價。</div><div class="lw-opt">'+[['fuel','燃料基價（每公升）'],['haul','前線運補加成（倍）'],['food','糧秣飲水（每公斤）'],['fod','草料（每公斤）'],['med','醫療物資（每公斤）'],['cbr','CBRN 物資（每公斤）'],['kia','陣亡撫卹（每人）'],['wia','傷患治療（每人）'],['kiaR','傷亡中陣亡的比例']].map(function(q){
    return '<span>'+q[1]+'</span><span><input type="number" min="0" step="any" value="'+P[q[0]]+'" data-c="costp" data-f="'+q[0]+'" style="width:110px"> <span class="lw-note">預設 '+D[q[0]]+'</span></span>';}).join('')+'</div><div class="lw-row"><button type="button" class="lw-btn sm" data-a="costreset">恢復年代預設</button></div>';}
CHG.costp=function(t){var f=t.getAttribute('data-f'),v=+t.value;G.set.cprice=G.set.cprice||{};if(t.value===''||!(v>=0))delete G.set.cprice[f];else G.set.cprice[f]=f==='kiaR'?clamp(v,0,1):v;};
ACT.costreset=function(){delete G.set.cprice;setSecRe('cost');toast('已恢復年代預設單價。');};
setSec('rep','cost',{t:'戰爭花費單價',o:30,cls:'lw-costset',local:true,h:function(){return costSetHtml();}});
(function(){var st=document.createElement('style');st.textContent='.lw-costcard .lw-cg{display:grid;grid-template-columns:repeat(auto-fit,minmax(440px,1fr));gap:14px}.lw-costcard .lw-tbl{width:100%}.lw-costcard td,.lw-costcard th{white-space:nowrap}';document.head.appendChild(st);})();
HELP14.push('<h4>戰爭花費</h4><ul><li>「戰報」最下方的「戰爭花費」統計每一方用掉的燃料（公升與每升單價）、彈藥（噸與金額，依各武器的單發價格）、糧秣飲水、草料、醫療物資與 CBRN 物資，損失的載具、飛機、艦艇、武器與個人裝具，以及陣亡撫卹與傷患治療，合計整場戰爭的花費與每天平均。</li><li>用量由各部隊存量的變化累計，補給到貨不算消耗；飛機依空中時間計油耗。單價依年代預設（燃料含前線運補加成），可在「設定」的「戰爭花費單價」調整；金額依裝備庫選的幣種顯示。聯機時只看得到本方的帳目，作戰結束後雙方公開。</li></ul>');
