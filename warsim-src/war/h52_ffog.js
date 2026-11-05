/* ===================== 友軍迷霧（選項）：與最高司令部失去聯絡的本方部隊從地圖上消失，部隊自行判斷行動，恢復聯絡後再出現 =====================
   失去聯絡：指揮鏈上有司令部被摧毀、正在重建；或與上級之間只能靠傳令兵，而傳令路線被敵軍阻斷（路線附近有兩個以上的敵軍單位）。
   開啟後（「設定 → 模擬 → 友軍迷霧」）：失聯的部隊不顯示在地圖上，只在最後回報的位置留下淡淡的「失聯」記號；命令送不到，傳令會一再折返重送。
   失聯的部隊自行判斷：照最後的命令行動；受到攻擊而且兵力不到一半時，向最近仍有聯絡的友軍撤退；沒有命令時就地防禦；
   失聯半小時以上、附近沒有敵軍時，向最近仍有聯絡的友軍靠攏以恢復聯絡。失去與恢復聯絡都記在日誌裡。關閉時一切照舊。 */
function ffOn(){return !!(G&&G.set&&G.set.ffog);}
/* 傳令路線附近的敵軍單位數 */
function ffThreatN(a,b){var n=0;gridNear((a.x+b.x)/2,(a.y+b.y)/2,dist(a.x,a.y,b.x,b.y)/2+1500,function(e){if(e.side===a.side||e.side<0||e.st==='dead'||!onMap(e)||uDom(e)==='air')return;var q=segDist(e.x,e.y,a.x,a.y,b.x,b.y);if(q.d<1200&&q.t>0.05&&q.t<0.95)n++;});return n;}
/* 失聯的原因：{k:'hq'|'cut',u:卡住的那一層} 或 null */
function ffCut(u){if(!u||u.side<0||u.side>=nSides()||u.st==='off'||u.st==='dead'||!onMap(u)||u.irr)return null;var top=sideCmd(u.side);if(!top||top.id===u.id)return null;var ch=chainTo(top,u);
  for(var i=1;i<ch.length;i++){var hi=ch[i-1],lo=ch[i];if(hi.id!==u.id&&hi.hqLost&&hi.hqRe>G.t)return {k:'hq',u:hi};if(!onMap(hi)||!onMap(lo))continue;var h=hopDelay(hi,lo,true);if(h.via==='courier'&&ffThreatN(lo,hi)>=2)return {k:'cut',u:lo};}return null;}
/* 最近仍有聯絡的友軍 */
function ffNearOk(u){var b=null,bd=1e18;G.units.forEach(function(q){if(q===u||q.side!==u.side||!isLeaf(q)||q.ffo||!alive(q)||!onMap(q)||ST(q).dom!=='land')return;var d=dist(q.x,q.y,u.x,u.y);if(d<bd){bd=d;b=q;}});return b;}
function ffStep(){if(!ffOn()||!G.started)return;if(!G._grid||!G._gf)gridBuild();G.units.forEach(function(u){if(u.side<0||u.side>=nSides()||!alive(u)||u.st==='off'||!onMap(u))return;var C=ffCut(u);
    if(C&&!u.ffo){u.ffo=Math.max(1e-3,G.t);u.ffx=u.x;u.ffy=u.y;u.ffw=C.k;logE(u.side,'cmd','與'+uName(u)+'失去聯絡（'+(C.k==='hq'?uName(C.u)+'的司令部重建中':'傳令路線被敵軍阻斷')+'），該部依最後的命令自行行動',u.x,u.y,u.id);}
    else if(!C&&u.ffo){logE(u.side,'cmd','與'+uName(u)+'恢復聯絡（失聯 '+durTxt(G.t-u.ffo)+'）',u.x,u.y,u.id);delete u.ffo;delete u.ffx;delete u.ffy;delete u.ffw;delete u.ffA;}
    else if(C&&u.ffo)u.ffw=C.k;
    if(u.ffo&&isLeaf(u))ffAct(u);});}
/* 失聯部隊自行判斷 */
function ffAct(u){if(u.ms==='rout'||ST(u).dom!=='land'||u.st==='lift'||u.st==='ship')return;if(u.ffA&&G.t-u.ffA<600)return;var hitR=u._hitT&&G.t-u._hitT<600,en=enemyNear(u.side,u.x,u.y,3000,'land'),cur=u.pend&&u.pend[0]||u.ord;
  if(hitR&&strFrac(u)<0.5){var F=ffNearOk(u);if(F&&(!cur||cur.k!=='withdraw')){u.ffA=Math.max(1e-3,G.t);receiveOrder(u,newOrder('withdraw',{x:F.x,y:F.y,ff:1}));logE(u.side,'cmd',uName(u)+'（失聯）傷亡慘重，自行向'+uName(F)+'撤退',u.x,u.y,u.id);}return;}
  if(!cur&&en>0){u.ffA=Math.max(1e-3,G.t);receiveOrder(u,newOrder('defend',{x:u.x,y:u.y,ff:1,opt:{post:'hasty'}}));return;}
  if(G.t-u.ffo>1800&&en===0&&(!cur||cur.ff||cur.k==='halt'||cur.k==='defend')){var F2=ffNearOk(u);if(F2&&dist(F2.x,F2.y,u.x,u.y)>1500){u.ffA=Math.max(1e-3,G.t);receiveOrder(u,newOrder('move',{x:F2.x+(u.x-F2.x)*0.15,y:F2.y+(u.y-F2.y)*0.15,ff:1}));logE(u.side,'cmd',uName(u)+'（失聯）向'+uName(F2)+'靠攏以恢復聯絡',u.x,u.y,u.id);}}}
(function(){var b=simStep;simStep=function(){var r=b.apply(this,arguments);if(ffOn()&&G.started&&G.step%6===3)try{ffStep();}catch(e){}return r;};})();
/* 命令送不到失聯的部隊：傳令一再折返重送 */
(function(){var b=sendOrder;sendOrder=function(from,to,o,viaChain){var m=b.apply(this,arguments);if(m&&ffOn()&&to&&to.ffo&&m.k==='order'&&!m.lost){m.lost=true;m.retry=G.t+Math.max(600,(m.ta-G.t)*2);}return m;};})();
/* 關閉友軍迷霧時清掉標記 */
function ffClear(){if(!G||!G.units)return;G.units.forEach(function(u){delete u.ffo;delete u.ffx;delete u.ffy;delete u.ffw;delete u.ffA;});}
