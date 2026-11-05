/* ===================== 戰略決策介面：作戰頁的「決策」按鈕、放置對話框（方、種類、優先等級、範圍、期限）、地圖上的決策標示、決策清單與取消、單位面板；說明 ===================== */
if(typeof GKEYS!=='undefined')GKEYS.push('dirs','dirSeq');
var DIRP={side:0,k:'attack',sub:'depot',pri:2,r:1500,dur:0,prep:1};
function dirSides(){var me=mySide();return me===null?SIDES():[me];}
function dirCanUse(){if(!G||!G.started||G.replay)return false;var me=mySide();return me===null||SD(me).ai;}
(function(){var b=PAGES.battle;PAGES.battle=function(host){b(host);if(!dirCanUse())return;var ph=host.querySelector('.lw-left .lw-ph');if(!ph||ph.querySelector('[data-a="dirdlg"]'))return;var bt=document.createElement('button');bt.type='button';bt.className='lw-btn sm';bt.setAttribute('data-a','dirdlg');
  bt.title='戰略決策：在地圖上放置進攻、防禦、設防、建設等決策，由電腦指揮官執行';bt.textContent='📌 決策';var rf=ph.querySelector('[data-a="rfdlg"]');if(rf)rf.parentNode.insertBefore(bt,rf);else ph.appendChild(bt);};})();
function dirLine(D){var a=D.gs.concat(D.eng).map(uById).filter(Boolean).map(uName);return '<tr><td>'+DIRK[D.k][1]+' '+esc(dirNm(D))+'</td><td>'+esc(G.sides[D.side].name)+'</td><td>'+esc(placeTxt(D.x,D.y))+'</td><td class="n">'+D.pri+'</td><td>'+
  '<span style="color:'+(D.st==='done'?'#2e7d32':D.st==='fail'?'#b3261e':D.st==='cancel'?'#777':'#1565c0')+'">'+DIRST[D.st]+'</span>'+(D.msg?'<br><span class="lw-note">'+esc(D.msg)+'</span>':'')+(a.length?'<br><span class="lw-note">'+esc(a.slice(0,4).join('、'))+(a.length>4?'⋯':'')+'</span>':'')+'</td><td>'+tTxt(D.t0)+'</td><td>'+
  (dirActive(D)?'<button type="button" class="lw-btn sm dng" data-a="dirx" data-v="'+D.id+'">取消</button> ':'')+'<button type="button" class="lw-btn sm" data-a="dirgo" data-v="'+D.id+'" title="移到地圖上的位置">⌖</button></td></tr>';}
function dirDlg(){var S=dirSides();if(S.indexOf(DIRP.side)<0)DIRP.side=S[0];var ai=SD(DIRP.side).ai,L=(G.dirs||[]).filter(function(D){return S.indexOf(D.side)>=0&&D.st!=='cancel';}).slice(-30).reverse();
  var o='<h3>戰略決策<small>由電腦指揮官執行</small></h3>'+(S.length>1?'<div class="lw-row">'+S.map(function(s){return '<label><input type="radio" name="dirs" data-c="dirp" data-f="side" value="'+s+'"'+(DIRP.side===s?' checked':'')+'> '+esc(G.sides[s].name)+(SD(s).ai?'':'（玩家指揮）')+'</label>';}).join('')+'</div>':'')+
    (ai?'':'<div class="lw-note" style="color:#b3261e">這一方由玩家指揮：決策只會標示在地圖上，不會自動執行。</div>')+
    '<div class="lw-row" style="flex-wrap:wrap">'+Object.keys(DIRK).map(function(k){return '<button type="button" class="lw-btn sm'+(DIRP.k===k?' pri':'')+'" data-a="dirk" data-v="'+k+'">'+DIRK[k][1]+' '+DIRK[k][0]+'</button>';}).join('')+'</div>'+
    '<div class="lw-opt">'+(DIRP.k==='build'?'<span>建設</span><select data-c="dirp" data-f="sub">'+Object.keys(DIRSUB).map(function(k){return '<option value="'+k+'"'+(DIRP.sub===k?' selected':'')+'>'+DIRSUB[k]+'</option>';}).join('')+'</select>':'')+
    '<span>優先等級</span><span>'+[[1,'1：少量兵力'],[2,'2：中等'],[3,'3：傾全力']].map(function(q){return '<label><input type="radio" name="dirpri" data-c="dirp" data-f="pri" value="'+q[0]+'"'+(DIRP.pri===q[0]?' checked':'')+'> '+q[1]+'</label> ';}).join('')+'</span>'+
    '<span>範圍</span><select data-c="dirp" data-f="r">'+[800,1500,3000,5000].map(function(v){return '<option value="'+v+'"'+(DIRP.r===v?' selected':'')+'>半徑 '+kmTxt(v)+'</option>';}).join('')+'</select>'+
    '<span>期限</span><select data-c="dirp" data-f="dur">'+[[0,'直到完成或取消'],[3,'3 小時'],[6,'6 小時'],[12,'12 小時'],[24,'1 天'],[48,'2 天']].map(function(q){return '<option value="'+q[0]+'"'+(DIRP.dur===q[0]?' selected':'')+'>'+q[1]+'</option>';}).join('')+'</select>'+
    (DIRP.k==='attack'?'<span>火力準備</span><label><input type="checkbox" data-c="dirp" data-f="prep"'+(DIRP.prep?' checked':'')+'> 進攻前先砲擊（沒有發現敵軍時會先偵察）</label>':'')+'</div>'+
    '<div class="lw-note">'+({attack:'抽調機動部隊攻佔該地區；部隊進入核心區並站穩 15 分鐘、區內不再有已知敵軍時完成，轉入防禦。',defend:'抽調機動部隊在該地構築陣地防守，面向已知的敵軍。',hold:'抽調部隊死守該地，不得後退。',fortify:'派工兵構築工事（優先等級 1 野戰陣地、2 半永久工事、3 堡壘），並派部隊掩護。',build:'派工兵建設補給站、橋梁（需在河邊）、道路或堡壘工事。',recon:'派偵察部隊前往，抵達後回報發現的敵軍。',fire:'射程內的砲兵對該地區實施火力打擊，每小時一輪（預設 3 小時）。',rally:'抽調部隊在該地集結待命，作為預備隊。'})[DIRP.k]+'</div>'+
    '<div class="lw-row"><button type="button" class="lw-btn pri" data-a="dirplace">在地圖上放置</button><button type="button" class="lw-btn" data-a="x">關閉</button></div>'+
    (L.length?'<h4 style="margin:8px 0 4px">決策清單</h4><div class="lw-sc" style="max-height:260px;overflow:auto"><table class="lw-tbl"><tr><th>決策</th><th>方</th><th>地點</th><th class="n">優先</th><th>狀態</th><th>下達</th><th></th></tr>'+L.map(dirLine).join('')+'</table></div>':'');
  if(UI.drd&&UI.drd.isConnected&&UI.drd.firstChild)UI.drd.firstChild.innerHTML=o;else UI.drd=dlg(o,true);}
ACT.dirdlg=function(){dirDlg();};
ACT.dirk=function(b){DIRP.k=b.getAttribute('data-v');dirDlg();};
CHG.dirp=function(t){var f=t.getAttribute('data-f');DIRP[f]=f==='prep'?(t.checked?1:0):f==='sub'?t.value:+t.value;if(f==='side'||f==='sub')dirDlg();};
ACT.dirplace=function(){var d=UI.drd;UI.drd=null;if(d&&d.isConnected)d.remove();UI.tool='dirpt';modeBt();};
ACT.dirx=function(b){var D=dirById(+b.getAttribute('data-v'));if(D)dirCancel(D,'由上帝視角取消');dirDlg();vDraw(false);};
ACT.dirgo=function(b){var D=dirById(+b.getAttribute('data-v'));if(D)vCenter(D.x,D.y,Math.max(VW.s,1.5));};
(function(){var b=btClick;btClick=function(x,y,sx,sy,e){if(UI.tool==='dirpt'){UI.tool='sel';modeBt();var D=dirAdd(DIRP.side,{k:DIRP.k,sub:DIRP.sub,pri:DIRP.pri,r:DIRP.r,dur:DIRP.dur,prep:DIRP.prep,x:x,y:y,by:'user'});
  var said=G.log.slice(-4).filter(function(e){return e.k==='ai'&&e.s===D.side&&/戰略決策/.test(e.txt);}).pop();toast(said?said.txt.slice(0,90):'已放置決策：'+dirNm(D)+'（'+(SD(D.side).ai?DIRST[D.st]:'僅標示')+'）',5000);vDraw(false);return;}return b(x,y,sx,sy,e);};})();
(function(){var b=modeBt;modeBt=function(){b();if(VW.mode&&UI.tool==='dirpt'){VW.mode.hidden=false;VW.mode.innerHTML='點選地圖放置戰略決策：'+esc(G.sides[DIRP.side].name)+'「'+DIRK[DIRP.k][0]+(DIRP.k==='build'?'（'+DIRSUB[DIRP.sub]+'）':'')+'」，優先等級 '+DIRP.pri+'<button type="button" data-a="ordx">取消</button>';}};})();
/* ---------- 地圖標示 ---------- */
function drawDirs(c){if(!G.started||!G.dirs||!G.dirs.length)return;var S=dirSides(),cs=G.map.cs;c.save();
  G.dirs.forEach(function(D){if(S.indexOf(D.side)<0||D.st==='cancel'||!dirActive(D)&&G.t-(D.t1||D.t0)>1800)return;var p=w2s(D.x,D.y),R=D.r/cs*VW.s;if(p[0]<-R-40||p[1]<-R-40||p[0]>VW.cw+R+40||p[1]>VW.ch+R+40)return;var col=G.sides[D.side].color||'#333',live=dirActive(D);
    c.globalAlpha=live?0.9:0.45;c.strokeStyle=col;c.lineWidth=2;c.setLineDash(live?[8,5]:[3,5]);c.beginPath();c.arc(p[0],p[1],Math.max(10,R),0,2*PI);c.stroke();c.setLineDash([]);
    if(live&&R>14){c.globalAlpha=0.07;c.fillStyle=col;c.fill();c.globalAlpha=0.9;}
    if(live&&VW.s>0.15)D.gs.concat(D.eng).forEach(function(id){var u=uById(id);if(!u||!alive(u))return;var q=cOf(u)||[u.x,u.y],s=w2s(q[0],q[1]);c.strokeStyle=col;c.globalAlpha=0.35;c.lineWidth=1;c.setLineDash([2,4]);c.beginPath();c.moveTo(s[0],s[1]);c.lineTo(p[0],p[1]);c.stroke();c.setLineDash([]);c.globalAlpha=0.9;});
    var lab=DIRK[D.k][1]+' '+DIRK[D.k][0]+(D.sub?'・'+DIRSUB[D.sub]:'')+' '+'①②③'.charAt(D.pri-1)+(D.st==='done'?' ✓':D.st==='fail'?' ✗':D.st==='new'&&!SD(D.side).ai?'（標示）':'');
    c.font='bold 12px sans-serif';var w=c.measureText(lab).width+10;c.globalAlpha=live?0.92:0.6;c.fillStyle='rgba(255,255,255,.92)';c.fillRect(p[0]-w/2,p[1]-9,w,18);c.strokeStyle=D.st==='fail'?'#b3261e':D.st==='done'?'#2e7d32':col;c.lineWidth=1.5;c.strokeRect(p[0]-w/2,p[1]-9,w,18);
    c.fillStyle=D.st==='fail'?'#b3261e':'#222';c.textAlign='center';c.textBaseline='middle';c.fillText(lab,p[0],p[1]+0.5);});c.globalAlpha=1;c.restore();}
(function(){var b=drawProj;drawProj=function(c){b(c);try{drawDirs(c);}catch(e){if(window.console)console.warn('dirs',e);}};})();
/* ---------- 單位面板 ---------- */
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);if(!G.dirs||!G.dirs.length)return o;var D=dirLockOf(u),me=mySide();if(!D||me!==null&&u.side!==me)return o;return o+'<span>戰略決策</span><span>執行「'+esc(dirNm(D))+'」（'+esc(placeTxt(D.x,D.y))+'），暫不受其他 AI 計畫調動</span>';};})();
HELP14.push('<h4>戰略決策（沙盒與上帝視角）</h4><ul>'+
  '<li>看電腦對戰（沙盒）或使用上帝視角時，作戰頁左側面板的「📌 決策」可以在地圖上放置戰略決策：<b>進攻、防禦、死守、設防、建設</b>（補給站、橋梁、道路、堡壘工事）、<b>偵察、火力打擊、集結</b>。選擇哪一方、優先等級（1 少量兵力、2 中等、3 傾全力）、範圍與期限，再點選地圖上的位置。</li>'+
  '<li>電腦指揮官依優先等級抽調適合的部隊——機動部隊進攻、防守、死守或集結；工兵構築工事與建設；偵察部隊前出偵察；射程內的砲兵每小時一輪火力打擊——並回報派了誰、兵力是否足夠。命令經由指揮鏈傳達、參謀規劃，需要時間。執行中的部隊暫時不受其他 AI 計畫調動，被打斷時會補下命令。</li>'+
  '<li>完成條件：進攻在部隊進入核心區並站穩 15 分鐘、區內兩小時內沒有看到敵軍時完成並轉入防禦；設防與建設在工兵完成後結束；偵察抵達後回報；期限到或部隊失去戰鬥力時結束。決策清單可以查看狀態或取消；玩家仍可直接對任何部隊下令，覆蓋決策。由玩家指揮的一方，決策只作為地圖標示。</li></ul>');
