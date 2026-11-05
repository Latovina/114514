/* ===================== 友軍迷霧的介面：設定選項、失聯部隊從地圖消失（留下「失聯」記號）、狀態面板的失聯說明、說明 ===================== */
setSec('intel','ffog',{o:20,h:function(){return setOpt(setRow('友軍迷霧','<label title="與最高司令部失去聯絡（司令部重建中、傳令路線被敵軍阻斷）的本方部隊從地圖上消失，自行判斷行動，恢復聯絡後再出現"><input type="checkbox" data-c="ffogset"'+(G.set.ffog?' checked':'')+'>失聯的本方部隊從地圖消失，自行行動</label>'));}});
CHG.ffogset=function(t){G.set.ffog=!!t.checked;if(!G.set.ffog)ffClear();else if(G.started)ffStep();VW._viK='';if(G&&G.map&&VW.cb&&VW.cw)vDraw(false);};
/* 失聯的本方部隊不顯示（上帝視角與沙盒照常顯示） */
function ffHide(u){return !!(u&&u.ffo&&ffOn()&&UI.side>=0&&!seeAll()&&u.side===UI.side);}
(function(){var b=visItems0;visItems0=function(lvl){var L=b.apply(this,arguments);if(!ffOn())return L;return L.filter(function(it){return !(it.u&&ffHide(it.u))&&!(it.grp&&it.grp.every(ffHide));});};})();
function drawFfog(c){if(!ffOn()||UI.side<0||seeAll())return;c.save();c.textAlign='center';c.textBaseline='middle';
  G.units.forEach(function(u){if(!ffHide(u)||u.ffx===undefined)return;var p=w2s(u.ffx,u.ffy);if(p[0]<-30||p[1]<-30||p[0]>VW.cw+30||p[1]>VW.ch+30)return;
    c.globalAlpha=0.6;c.setLineDash([3,3]);c.strokeStyle=sideCol(u.side);c.lineWidth=1.2;c.strokeRect(p[0]-11,p[1]-8,22,16);c.setLineDash([]);c.globalAlpha=1;c.fillStyle='#616161';c.font='bold 10px sans-serif';c.fillText('?',p[0],p[1]+1);
    if(VW.s>1.2)txtHalo(c,'失聯・'+(typeof shortName==='function'?shortName(u):uName(u)),p[0],p[1]+17,'10px sans-serif','#757575');});c.restore();}
(function(){var b=drawProj;drawProj=function(c){b(c);try{drawFfog(c);}catch(e){if(window.console)console.warn('ffog',e);}};})();
/* 狀態面板：選取（例如從編制樹）失聯的部隊時說明 */
(function(){var b=btStatus;btStatus=function(){b.apply(this,arguments);try{if(!ffOn()||UI.selX||UI.selC||UI.selB||!UI.sel||UI.sel.length!==1)return;var u=uById(UI.sel[0]),el=btEl('bst');if(!u||!el||!u.ffo)return;
  el.insertAdjacentHTML('afterbegin','<div class="lw-note" style="border-left:3px solid #b3261e;padding-left:6px;margin-bottom:6px"><b>失去聯絡</b>：'+(u.ffw==='hq'?'上級司令部重建中':'傳令路線被敵軍阻斷')+'，已 '+durTxt(G.t-u.ffo)+'。命令送不到，該部依最後的命令自行行動；地圖上只標出最後回報的位置。</div>');}catch(e){if(window.console)console.warn('ffog',e);}};})();
HELP14.push('<h4>友軍迷霧（選項）</h4><ul><li>在「設定 → 模擬」開啟。與最高司令部失去聯絡的本方部隊（指揮鏈上有司令部被摧毀、正在重建；或與上級之間只能靠傳令兵，而傳令路線附近有兩個以上的敵軍單位）會從地圖上消失，只在最後回報的位置留下淡淡的「失聯」記號。</li>'+
  '<li>失聯期間命令送不到，傳令會一再折返重送；部隊自行判斷：照最後的命令行動，受到攻擊而且兵力不到一半時向最近仍有聯絡的友軍撤退，沒有命令時就地防禦，失聯半小時以上、附近沒有敵軍時向友軍靠攏以恢復聯絡。</li>'+
  '<li>恢復聯絡後部隊重新出現，日誌記錄失聯多久。通信單位的中繼能避免傳令路線被阻斷。上帝視角與沙盒模式照常顯示所有部隊。</li></ul>');
