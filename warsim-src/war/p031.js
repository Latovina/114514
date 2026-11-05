/* ===================== 友軍誤擊介面：設定、自動暫停、戰報統計、說明 ===================== */
APK[0][1].push(['ff','友軍誤擊']);
var FFKN={art:'砲兵落點偏短',fire:'直射誤認',air:'空襲與轟炸波及'};
setSec('combat','ff',{t:'友軍誤擊',o:50,note:'砲彈散布會有一批落點偏短、落到自己這一側；夜間、霧、煙幕與城鎮近戰中，射手可能把目標旁或射線上的友軍誤認為敵人；炸彈會波及目標附近的友軍。訓練不足、疲勞、士氣動搖的部隊誤擊較多；越早的年代越多（沒有無線電與敵我識別），現代的導引武器與熱影像較少。誤擊的傷亡另外統計，不算敵方戰果。',
  h:function(){return setOpt(setRow('頻率',setSel('setff','',[['off','關閉'],['low','較少'],['normal','一般（依年代、能見度與部隊狀況）'],['high','較多']],G.set.ff||'normal')));}});
CHG.setff=function(t){G.set.ff=t.value;toast('友軍誤擊：'+t.options[t.selectedIndex].text);};
(function(){var b=PAGES.rep;PAGES.rep=function(host){b(host);var main=host.querySelector('.lw-main');if(!main||!G.started)return;var any=SIDES().some(function(s){return (G.stats[s].ffm||0)>0.5;});if(!any)return;var d=document.createElement('div');d.className='lw-card';
  d.innerHTML='<h3>友軍誤擊<small>自己的火力造成的傷亡（不算敵方戰果）</small></h3><div class="lw-kv">'+SIDES().map(function(s){var S=G.stats[s],K=S.ffk||{};return '<span style="color:'+G.sides[s].color+'">'+esc(G.sides[s].name)+'</span><span>約 '+fmt(S.ffm||0)+' 人傷亡'+(Object.keys(K).length?'（'+Object.keys(K).sort(function(a,c){return K[c]-K[a];}).map(function(k){return (FFKN[k]||k)+' '+fmt(K[k]);}).join('、')+'）':'')+'</span>';}).join('')+'</div>';
  main.insertBefore(d,main.children[2]||null);};})();
HELP14.push('<h4>友軍誤擊</h4><ul>'+
  '<li><b>曲射</b>：每一步有一定機率有一批砲彈偏離瞄準點，大多落點偏短（也就是落向本方這一側），一戰約數百公尺、二戰約兩百到七百公尺、現代約一百到三百公尺；精準導引彈藥很少偏離。沒有試射、夜間、砲班疲勞或士氣動搖時更常發生。原本落在射擊範圍內的友軍也會承受約一成的殺傷。</li>'+
  '<li><b>直射</b>：目標 150 公尺內有友軍，或友軍就在射線旁時，射手可能打錯對象。夜間約多 2.5 倍，霧、雨、煙幕與城鎮近戰更多；訓練不足、疲勞、士氣動搖的部隊更容易誤擊。</li>'+
  '<li><b>空襲</b>：炸彈與掃射會波及目標附近（二戰約 300 公尺、之後約 150 公尺）的友軍；轟炸區、地毯式轟炸範圍內的友軍照常受害。</li>'+
  '<li>誤擊會打擊受害部隊的士氣；傷亡另外統計在戰報的「友軍誤擊」卡片，原因分為砲兵落點偏短、直射誤認、空襲與轟炸波及。設定頁可以關閉或調整頻率，自動暫停也可以勾選「友軍誤擊」。</li></ul>');
