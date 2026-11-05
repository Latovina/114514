/* ===================== 飢荒（介面）：設定、地圖上的飢荒標記、聚落面板、部隊面板、說明 ===================== */
setSec('civ','famine',{t:'飢荒',o:15,h:function(){var S=G.set;return setOpt(setRow('飢荒',setChk('setb','famine',S.famine!==false,'缺糧的聚落與部隊會陷入飢荒：拖得越久餓死的人越多，接著是疫病與逃荒；飢餓的部隊會強徵居民的糧食；部隊會宰殺馱馬、有人餓死'))+
  setRow('人相食',setChk('setb','canni',S.canni!==false,'極端的飢荒中記錄人相食的慘況（只記錄，不描寫）')))+'<div class="lw-note">戰報的平民一節列出飢餓與飢荒後的疫病造成的死亡。</div>';}});
/* 地圖：陷入飢荒的聚落畫一圈褐色虛線，放大時註明天數 */
(function(){var b=drawCiv;drawCiv=function(c){b.apply(this,arguments);try{if(!G||!G.civ||!famOn()||UI.lay.civ===0)return;var m=mpp();c.save();c.textAlign='center';
  G.civ.S.forEach(function(g){var st=famStage(g);if(!st||civPresent(g)<1)return;var p=w2s(g.x,g.y),r=Math.max(6,g.r/m+3);if(p[0]<-r||p[1]<-r||p[0]>VW.cw+r||p[1]>VW.ch+r)return;
    c.globalAlpha=0.85;c.strokeStyle=st>=3?'#4E342E':'#8D6E63';c.lineWidth=st>=3?1.6:1;c.setLineDash([3,3]);c.beginPath();c.arc(p[0],p[1],r,0,2*PI);c.stroke();c.setLineDash([]);
    if(VW.s>1.5&&typeof txtHalo==='function'){c.globalAlpha=1;txtHalo(c,FAMN[st]+' '+Math.max(1,Math.round((g.famD||0)/FMD))+' 天',p[0],p[1]+r+10,'10px sans-serif','#4E342E');}});c.restore();}catch(e){}};})();
/* 聚落面板 */
(function(){var b=civPanelS;civPanelS=function(g){var o=b.apply(this,arguments);try{var st=famStage(g);if(!st&&!(g.canN>0))return o;var t=st?FAMN[st]+'（第 '+Math.max(1,Math.round((g.famD||0)/FMD))+' 天）：居民大批餓死'+(((g.famD||0)/FMD)>5?'，疫病蔓延':'')+'，飢民逃荒':'飢荒已緩解';
  if(g.canN>0)t+='；據報出現人相食的慘況 '+g.canN+' 次';o+='<div class="lw-note" style="border-left:3px solid #6D4C41;padding-left:6px;margin-top:4px">'+esc(t)+'</div>';}catch(e){}return o;};})();
/* 部隊面板：餓死的人數、宰殺的馬匹 */
(function(){var b=btStatus;btStatus=function(){b.apply(this,arguments);try{if(!G||!G.started||!famOn()||UI.selX||UI.selC||UI.selB||!UI.sel||UI.sel.length!==1)return;var u=uById(UI.sel[0]),el=btEl('bst');if(!u||!el||!isLeaf(u)||!u.lg)return;if(UI.side>=0&&u.side!==UI.side&&!seeAll())return;
  var L=u.lg,t=[];if((L.hunD||0)>0)t.push('嚴重飢餓已 '+durTxt(L.hunD));if(L.starv>=1)t.push('約 '+fmt(L.starv)+' 人餓死');if(L.eaten>=1)t.push('已宰殺 '+fmt(L.eaten)+' 匹馱馬與戰馬充飢');
  if(t.length)el.insertAdjacentHTML('beforeend','<div class="lw-note lw-famu" style="border-left:3px solid #6D4C41;padding-left:6px;margin-top:4px">'+t.map(esc).join('；')+'</div>');}catch(e){}};})();
if(typeof HELP14!=='undefined')HELP14.push('<h4>飢荒</h4><ul>'+
  '<li>聚落的存糧耗盡後，居民的飢餓度上升；到 60 以上就陷入飢荒。飢荒拖得越久，餓死的人越多（兩週後約為一開始的三倍），五天後疫病（斑疹傷寒、痢疾）跟著來，飢民開始逃荒。被圍困的聚落沒有新的糧食進來。</li>'+
  '<li>飢餓的部隊（飢餓度 60 以上）駐在聚落裡會強徵居民的糧食，每天拿走約四天份的口糧：保護平民的方針只拿四分之一，大致保護拿一半，高壓、報復與極端的方針拿一倍半。部隊缺糧，往往就是平民飢荒的開始。</li>'+
  '<li>受飢荒影響的居民占全部居民的四分之一以上時，記為一場大饑荒；降到一成以下時緩解。地圖上陷入飢荒的聚落畫一圈褐色虛線，放大時註明天數。</li>'+
  '<li>極端的飢荒（飢餓度 90 以上持續十天，被圍困時六天）可能出現人相食的慘況。模擬只記錄、不描寫；當地更加動盪，附近的官兵驚恐。可以在設定的「平民與事件 → 飢荒」關閉這項記錄。</li>'+
  '<li>部隊斷糧時，飢餓度 60 以上開始宰殺馱馬與戰馬充飢（之後機動變慢）；90 以上超過三天開始有人餓死；被圍或斷補給超過三天、飢餓到極點超過一週，也可能出現人相食。</li>'+
  '<li>救濟：部隊可以把自己的存糧分給居民，救援團體也會送糧；打通補給線、解除包圍才能真正止住飢荒。</li></ul>');
