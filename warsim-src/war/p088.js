/* ===================== 玩家命令的延續（介面）：設定選項、部隊狀態顯示被打斷的命令與恢復時機、說明 ===================== */
setSec('cmd','resume',{t:'玩家命令的延續',o:40,h:function(){return setOpt(setRow('恢復命令','<label title="遭遇戰、戰術後撤、潰散後重新集結、拒絕進攻、上級主動派遣等自主行動結束後，部隊脫離接觸時自動恢復玩家最後下的命令"><input type="checkbox" data-c="setb" data-f="resume"'+(G.set.resume!==false?' checked':'')+'>自主行動結束後，部隊恢復玩家最後下的命令</label>'));}});
/* 部隊狀態：玩家的命令被打斷時說明原因與恢復時機 */
(function(){var b=btStatus;btStatus=function(){b.apply(this,arguments);try{if(!G||!G.started||UI.selX||UI.selC||UI.selB||!UI.sel||UI.sel.length!==1)return;var u=uById(UI.sel[0]),el=btEl('bst');if(!u||!el||!isLeaf(u))return;if(UI.side>=0&&u.side!==UI.side&&!seeAll())return;
  var R=rsmState(u);if(!R)return;var o=R.o;el.insertAdjacentHTML('beforeend','<div class="lw-note lw-rsmu" style="border-left:3px solid #1565C0;padding-left:6px;margin-top:4px">玩家的命令「'+esc(ordN(o))+(o.x!==undefined?'（'+esc(placeTxt(o.x,o.y))+'）':'')+'」被「'+esc(R.by||'自主行動')+'」打斷，'+R.wait+'自動恢復'+(R.rn?'（已恢復 '+R.rn+' 次，第四次被打斷後不再恢復）':'')+'。重新下令即取代。</div>');}catch(e){}};})();
HELP14.push('<h4>玩家命令的延續</h4><ul><li>部隊執行玩家的命令時，可能被遭遇戰（就地展開、現地指揮官決定進攻或駐紮）、戰術後撤、潰散後重新集結、士氣低落拒絕進攻、上級主動派遣反擊或填補、兵種行為（後勤、砲兵避開前線等）打斷。這些行動結束、部隊脫離接觸並安靜約十分鐘後（攻擊命令還要等士氣恢復），部隊會<b>自動恢復玩家最後下的命令</b>，紀錄會說明恢復的原因。</li>'+
  '<li>選取部隊時，狀態面板會顯示被打斷的命令、打斷的原因與預計恢復的時機。玩家下過命令的部隊潰散後就地整頓，不會自行歸建到上級旁邊擔任預備隊。同一道命令恢復三次後又被打斷，就不再自動恢復，紀錄會請你重新下令；之後每一次恢復前要安靜得更久，避免來回拉鋸。</li>'+
  '<li>可以在「設定 → 士氣與行為 → 恢復命令」關閉。電腦指揮的部隊由電腦自己決定，不受影響。</li></ul>');
