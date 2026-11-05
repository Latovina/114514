/* ===================== 居民情報介面：地圖上來自居民的敵情加註「民」與可信度、滑鼠提示、設定、說明 ===================== */
function drawCivIntel(c){if(!G.started||G.replay||UI.lay.ct===0)return;var me=UI.side;if(me<0)return;var C=G.ct[me];if(!C)return;c.save();c.textAlign='left';c.textBaseline='middle';
  for(var id in C){var q=C[id];if(!q.civ||G.t-q.t>7200||q.dead)continue;var p=w2s(q.x,q.y);if(p[0]<-20||p[1]<-20||p[0]>VW.cw+20||p[1]>VW.ch+20)continue;var col=q.civ.cred==='高'?'#2e7d32':q.civ.cred==='低'?'#c62828':'#ef6c00';
    c.fillStyle='rgba(255,255,255,.92)';c.strokeStyle=col;c.lineWidth=1.4;c.beginPath();c.arc(p[0]+13,p[1]-12,7,0,2*PI);c.fill();c.stroke();c.fillStyle=col;c.font='bold 9px sans-serif';c.textAlign='center';c.fillText('民',p[0]+13,p[1]-11.5);}c.restore();}
(function(){var b=drawProj;drawProj=function(c){b(c);try{drawCivIntel(c);}catch(e){if(window.console)console.warn('civintel',e);}};})();
(function(){var b=tipAt;tipAt=function(sx,sy,w){var r=b(sx,sy,w);try{if(VW.tip&&!VW.tip.hidden&&G&&G.started){var it=hitAt(sx,sy);if(it&&it.c&&it.c.civ)VW.tip.textContent+='\n情報來源：'+it.c.civ.n+'的居民（可信度'+it.c.civ.cred+'，'+durTxt(G.t-it.c.t)+'前）';}}catch(x){}return r;};})();
setSec('intel','civi',{t:'居民情報',o:40,h:function(){return setOpt(setRow('居民情報',setChk('setb','civIntel',G.set.civIntel!==false,'附近有本方部隊的村鎮，居民會依態度報告看到的敵軍（可能不準確或故意誤導）')));}});
HELP14.push('<h4>居民情報</h4><ul>'+
  '<li>3 公里內有本方部隊的村鎮，居民會報告附近 5 公里內看到的敵軍。報告的頻率與真實程度取決於居民對本方的態度：本方聲望高、軍紀好、善待平民時，居民樂於提供情報，位置誤差約數百公尺、兵力大致正確；態度中立時誤差較大；敵視本方的居民很少主動報告，而且常常說謊——把兵力說多或說少、把敵軍說在錯的地方，甚至捏造附近有敵軍。</li>'+
  '<li>報告要由居民走到部隊、或經由電話與信差送達，約 20～80 分鐘後才出現在情報圖上，標示為未確認的敵情（地圖上加註「民」，綠＝可信度高、橘＝中、紅＝低），紀錄寫出來源村鎮。本方部隊親眼看到的較新情報優先，不會被居民的報告蓋掉。設定頁可以關閉。</li></ul>');
