/* ===================== 平滑移動：模擬每一步是 30 秒遊戲時間，畫面在兩步之間依經過的時間內插部隊、車隊與飛機的位置，看起來是連續移動
   只影響畫面：模擬照常使用真正的位置，繪圖（含點選判定與提示）時暫時換成內插的位置，畫完立刻換回。暫停時顯示真正的位置。
   聯機時由聯機模組自己內插；回放不內插。設定頁「畫面」可以關閉（存在這台電腦的瀏覽器）。 ===================== */
var SM={act:false};
if(UIP.smooth===undefined)UIP.smooth=1;
function smOn(){return !!UIP.smooth&&!!G&&!!G.started&&!G.replay&&!G.over&&!(typeof mpActive==='function'&&mpActive());}
/* 每一步開始前記下位置 */
(function(){var b=simStep;simStep=function(){if(G&&G.started){var L=G.units,i;for(i=0;i<L.length;i++){L[i]._ix=L[i].x;L[i]._iy=L[i].y;}var V=G.lgv;if(V)for(i=0;i<V.length;i++){V[i]._ix=V[i].x;V[i]._iy=V[i].y;}}return b.apply(this,arguments);};})();
/* 換成內插位置；傳回要還原的清單。跳得太遠（空降、抵達、撤出）的不內插 */
function smSwap(){var a=UI.run?clamp(UI.acc/DT,0,1):1;if(a>=1)return null;var out=[],put=function(o){if(o._ix===undefined||o.x===undefined)return;var dx=o.x-o._ix,dy=o.y-o._iy;if(!dx&&!dy)return;if(dx*dx+dy*dy>16e6)return;out.push(o,o.x,o.y);o.x=o._ix+dx*a;o.y=o._iy+dy*a;};
  G.units.forEach(put);(G.lgv||[]).forEach(put);return out;}
function smBack(L){if(!L)return;for(var i=0;i<L.length;i+=3){L[i].x=L[i+1];L[i].y=L[i+2];}}
(function(){var b=vDraw;vDraw=function(){if(!smOn())return b.apply(this,arguments);var L=smSwap();SM.act=!!L;try{return b.apply(this,arguments);}finally{smBack(L);SM.act=false;}};})();
/* 地圖上的項目（單位、彙總符號）依這一幀的位置更新；每一步只算一次的快取照用 */
(function(){var b=visItems;visItems=function(){var L=b.apply(this,arguments);if(SM.act)L.forEach(function(it){if(it.c)return;if(it.L){var c=centroid(it.L);it.x=c[0];it.y=c[1];}else if(it.u){it.x=it.u.x;it.y=it.u.y;}});return L;};})();
/* 內插時重畫得更頻繁（依地圖繪製的耗時，最快每秒約 60 次；主迴圈在沒有新的一步時也照這個間隔重畫） */
(function(){var b=gfxDrawIv;gfxDrawIv=function(stepped){if(UI.run&&smOn()&&!gfxSimple())return clamp((GFX.drawMs||8)*2.5,16,60);return b.apply(this,arguments);};})();
setSec('gfx','smooth',{o:13,h:function(){return setOpt(setRow('平滑移動',setChk('setsm','',UIP.smooth,'在兩個模擬步驟之間內插部隊、車隊與飛機的位置，移動看起來連續（只影響畫面）')));}});
CHG.setsm=function(t){UIP.smooth=t.checked?1:0;uipSave();if(G&&G.map&&VW.cb&&VW.cw)vDraw(false);};
/* 暫停時立刻重畫一次，回到真正的位置 */
(function(){var b=toggleRun;toggleRun=function(){var r=b.apply(this,arguments);if(!UI.run&&G&&G.map&&VW.cw&&MAPT[UI.tab])vDraw(false);return r;};})();
