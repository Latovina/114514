/* ===================== 手機：直向全螢幕地圖、底部分頁列、底部抽屜式面板、長按代替右鍵、觸控時放大點選範圍 =====================
   觸控裝置在直向時也用全螢幕地圖：分頁移到畫面底部，左右兩個浮動面板改成從底部拉起的抽屜（一次只開一個），
   地圖適配與拖曳範圍扣掉抽屜的高度。長按地圖等於滑鼠右鍵（快速移動），手指點兵牌的範圍放大。
   橫向的手機沿用原本的全螢幕版面。 */
var PHN={port:false,touch:false,lp:0,tip:false};
function mobPortWant(){var w=window.innerWidth,h=window.innerHeight;return !!UI.land&&h>w&&(SAFE.mob||w<=700);}
/* 觸控裝置：直向也開全螢幕地圖（使用者沒有自己選版面時） */
(function(){var b=landWant;landWant=function(){var m=UIP.land;if((m===undefined||m===null||m==='auto')&&SAFE.mob&&typeof EDONLY==='undefined')return true;return b();};})();
/* 直向時兩個面板改成底部抽屜，一次只開一個；預設只開右側（部隊資訊） */
(function(){var b=lpOpen;lpOpen=function(){return PHN.port?!!UI.pL:b();};})();
(function(){var b=landCls;landCls=function(){PHN.port=mobPortWant();root.classList.toggle('lw-port',PHN.port);root.classList.toggle('lw-touch',SAFE.mob);b();if(PHN.port){if(UI.pR===undefined)UI.pR=1;root.classList.toggle('lw-norp',!UI.pR);landPads();}};})();
(function(){var b=panelToggle;panelToggle=function(s){if(!PHN.port)return b(s);if(s==='l'){UI.pL=UI.pL?0:1;if(UI.pL)UI.pR=0;}else{UI.pR=UI.pR?0:1;if(UI.pR)UI.pL=0;}landCls();landHandleTxt();vDraw(true);};})();
(function(){var b=landHandleTxt;landHandleTxt=function(){b();if(!PHN.port)return;root.querySelectorAll('.lw-ptg').forEach(function(h){var s=h.getAttribute('data-v'),open=s==='l'?!!UI.pL:!!UI.pR;h.textContent=(open?'▾ ':'▴ ')+(s==='l'?'編制':'資訊');});};})();
/* 抽屜佔掉的高度：地圖置中、縮放按鈕與面板開關都在抽屜上方 */
(function(){var b=landPads;landPads=function(){if(!PHN.port){VW.padB=0;root.style.setProperty('--padb','0px');return b();}if(UI.land&&UI.sheetOn)return;var W=UI.baseEl?UI.baseEl.querySelector(':scope>.lw-work'):null,mh=W&&W.querySelector(':scope>.lw-mh'),h=0;
  if(mh)W.querySelectorAll(':scope>.lw-pane').forEach(function(P){if(P.offsetHeight&&getComputedStyle(P).display!=='none')h=Math.max(h,P.offsetHeight);
    /* 抽屜的內容換了（例如點選部隊），高度跟著變：重新量 */if(!P._mobRO&&typeof ResizeObserver!=='undefined'){P._mobRO=1;(PHN.ro||(PHN.ro=new ResizeObserver(function(){if(PHN.port)landPads();}))).observe(P);}});
  VW.padL=0;VW.padR=0;VW.padB=h;root.style.setProperty('--padl','0px');root.style.setProperty('--padr','0px');root.style.setProperty('--padb',h+'px');};})();
vClamp=function(){var MP=G.map,W=MP.GW*VW.s,H=MP.GH*VW.s,m=24,pl=VW.padL||0,pr=VW.padR||0,pb=VW.padB||0,vw=VW.cw-pl-pr,vh=VW.ch-pb;if(!(W>0&&H>0))return;if(W+2*m<=vw)VW.ox=pl+(vw-W)/2;else VW.ox=clamp(VW.ox,VW.cw-pr-W-m,pl+m);if(H+2*m<=vh)VW.oy=(vh-H)/2;else VW.oy=clamp(VW.oy,vh-H-m,m);};
vFit=function(){if(!G||!G.map)return;var MP=G.map,pl=VW.padL||0,pr=VW.padR||0,pb=VW.padB||0,w=Math.max(120,VW.cw-pl-pr),h=Math.max(120,VW.ch-pb),s=Math.min(w/MP.GW,h/MP.GH)*0.98;VW.s=s;VW.s0=s;VW.ox=pl+(w-MP.GW*s)/2;VW.oy=(h-MP.GH*s)/2;VW.fit=true;vDraw(true);};
/* 轉向（直橫切換）時重新排版 */
window.addEventListener('resize',function(){if(!UI.landInit||!UI.land)return;var p=mobPortWant();if(p!==PHN.port){landCls();landHandleTxt();if(G&&G.map&&VW.wrap&&VW.wrap.isConnected)setTimeout(function(){landPads();vFit();},60);}});
/* 直向時點選新的部隊：自動拉起資訊抽屜 */
(function(){var b=btSel;btSel=function(){var r=b.apply(this,arguments);try{if(PHN.port&&UI.sel&&UI.sel.length&&UI.sel[0]!==PHN.selId&&!UI.pR&&!UI.pL){UI.pR=1;landCls();landHandleTxt();}PHN.selId=UI.sel&&UI.sel.length?UI.sel[0]:0;}catch(e){}return r;};})();
/* ---------- 觸控：長按等於右鍵、點選範圍放大 ---------- */
(function(){var bd=vDown,bm=vMove,bu=vUp;
  vDown=function(e){PHN.touch=e.pointerType!=='mouse';bd(e);clearTimeout(PHN.lp);PHN.lp=0;if(PHN.touch&&VW.drag&&VW.drag.kind==='pan'&&UI.onRight&&Object.keys(VW.ptr).length===1){var D=VW.drag;
    PHN.lp=setTimeout(function(){PHN.lp=0;if(VW.drag!==D||D.moved||VW.pinch)return;var w=s2w(D.sx0,D.sy0);VW.drag=null;try{if(navigator.vibrate)navigator.vibrate(12);}catch(x){}UI.onRight(w[0],w[1]);vDraw(false);
      if(!PHN.tip){PHN.tip=true;toast('長按地圖等於滑鼠右鍵：已選取部隊時快速下達移動命令。',3500);}},560);}};
  vMove=function(e){bm(e);if(PHN.lp&&(!VW.drag||VW.drag.moved||VW.pinch)){clearTimeout(PHN.lp);PHN.lp=0;}};
  vUp=function(e){clearTimeout(PHN.lp);PHN.lp=0;return bu(e);};})();
(function(){var b=hitAt;hitAt=function(sx,sy){var h=b(sx,sy);if(h||!PHN.touch)return h;var best=null,bd=1e9;(VW.items||[]).forEach(function(it){if(it.sx===undefined)return;var d=dist(sx,sy,it.sx,it.sy);if(d<Math.max(24,(it.h||14)*1.2)&&d<bd){bd=d;best=it;}});return best;};})();
if(typeof HELP14!=='undefined')HELP14.push('<h4>手機與觸控</h4><ul>'+
  '<li>手機直向也是全螢幕地圖：分頁在畫面底部；部隊資訊與編制樹是從底部拉起的抽屜，用地圖下方的「資訊」「編制」開關（一次開一個）。點選新的部隊時資訊抽屜會自動拉起。</li>'+
  '<li>兩指縮放、單指拖曳地圖；長按地圖等於滑鼠右鍵（已選取部隊時快速下達移動命令）；手指點兵牌時判定範圍較大。</li>'+
  '<li>手機會自動使用省記憶體模式，第一次使用時畫面效果預設為「簡化」；切換到其他程式時作戰自動暫停並存檔。</li></ul>');
