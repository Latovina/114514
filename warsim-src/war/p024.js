/* ===================== 圖形模式與效能：簡易圖形模式、畫面變慢時自動減少特效、依繪圖負擔調整重繪頻率 ===================== */
var GFX={mode:'full',auto:true,fxMul:1,ema:16,last:0,acc:0,slow:0,hint:false,drawMs:0,fxLvl0:null};
(function(){try{var o=JSON.parse(localStorage.getItem('lato-warsim-gfx')||'null');if(o){if(o.mode==='simple')GFX.mode='simple';if(o.auto===false)GFX.auto=false;}}catch(e){}if(GFX.mode==='simple'){GFX.fxLvl0=FX.lvl;FX.lvl=0;}})();
function gfxSave(){try{localStorage.setItem('lato-warsim-gfx',JSON.stringify({mode:GFX.mode,auto:GFX.auto}));}catch(e){}}
function gfxSimple(){return GFX.mode==='simple';}
/* 切換圖形模式：簡易模式＝平面地圖、簡單符號、關閉特效（記住原本的特效等級，回到完整模式時還原）、較少地名 */
function gfxSet(m){m=m==='simple'?'simple':'full';if(m===GFX.mode)return;GFX.mode=m;
  if(m==='simple'){GFX.fxLvl0=FX.lvl;FX.lvl=0;if(typeof fxReset==='function')fxReset();}else{if(GFX.fxLvl0!==null)FX.lvl=GFX.fxLvl0;GFX.fxLvl0=null;GFX.fxMul=1;}
  gfxSave();VW.img=null;SPC.m={};SPC.n=0;VW._viL=null;GFX.slow=0;
  if(typeof fxSync==='function')fxSync();else barRender();setSecRe('gfx');if(G&&G.map&&VW.cb&&VW.cw)vDraw(true);}
/* 簡易模式下改特效設定：仍以使用者的選擇為準，並存下真正的特效等級（不是暫時關閉的 0） */
(function(){var b=fxSave;fxSave=function(){if(gfxSimple()&&GFX.fxLvl0!==null&&FX.lvl===0){FX.lvl=GFX.fxLvl0;try{b();}finally{FX.lvl=0;}}else b();};})();
(function(){var b=CHG.fxlvl;CHG.fxlvl=function(t){if(gfxSimple())GFX.fxLvl0=+t.value;b(t);};})();
/* 重繪頻率：完整模式依地圖繪製的耗時放寬（最慢約每秒 8 次）；簡易模式沒有動畫，只在模擬前進後重繪 */
function gfxDrawIv(stepped){if(gfxSimple())return stepped?45:160;return clamp(GFX.drawMs*3,45,120);}
(function(){var b=drawTop;drawTop=function(){var t=performance.now();b.apply(this,arguments);var d=performance.now()-t;GFX.drawMs=GFX.drawMs?GFX.drawMs*0.85+d*0.15:d;};})();
/* 畫格監看：畫面變慢（每格超過約 40 毫秒）時逐步減少爆炸、煙霧、曳光等特效的數量上限，順暢後再慢慢恢復；長時間很慢時提示一次可改用簡易模式 */
function gfxMon(ts){requestAnimationFrame(gfxMon);var dt=GFX.last?ts-GFX.last:16;GFX.last=ts;gfxTick(dt);}
function gfxTick(dt){if(!(dt>0)||dt>1000)return;GFX.ema=GFX.ema*0.9+dt*0.1;
  if(!G||!G.started||!UI.run||UI.tab!=='battle')return;GFX.acc+=dt;if(GFX.acc<1000)return;GFX.acc=0;
  if(GFX.auto&&FX.lvl>0){if(GFX.ema>40)GFX.fxMul=Math.max(0.2,GFX.fxMul*0.8);else if(GFX.ema<24)GFX.fxMul=Math.min(1,GFX.fxMul*1.1);}else GFX.fxMul=1;
  if(!gfxSimple()&&GFX.ema>70){GFX.slow++;if(GFX.slow>=6&&!GFX.hint){GFX.hint=true;toast('畫面更新變慢：可按頂列「▣ 完整」切換成簡易圖形模式（平面地圖、簡單符號、關閉特效）',6500);}}else GFX.slow=0;}
if(typeof requestAnimationFrame==='function')requestAnimationFrame(gfxMon);
/* 頂列按鈕：一鍵切換完整／簡易 */
(function(){var b=barRender;barRender=function(){b();if(!UI.bar||!G||!G.map||UI.bar.querySelector('[data-a="gfx"]'))return;var bt=document.createElement('button');bt.type='button';bt.className='lw-btn sm lw-gfxb'+(gfxSimple()?' on':'');bt.setAttribute('data-a','gfx');
  bt.title=gfxSimple()?'目前：簡易圖形模式（平面地圖、簡單符號、關閉特效）。按一下回到完整圖形':'目前：完整圖形模式。單位或特效很多而卡頓時，按一下改用簡易圖形模式';bt.textContent=gfxSimple()?'▣ 簡易':'▣ 完整';
  var v=UI.bar.querySelector('select[data-c="view"]');if(v)UI.bar.insertBefore(bt,v);else UI.bar.appendChild(bt);layoutVar();};})();
ACT.gfx=function(){gfxSet(gfxSimple()?'full':'simple');toast(gfxSimple()?'簡易圖形模式：平面地圖、簡單符號、關閉特效與多數地名（只影響畫面，不改變戰局）':'完整圖形模式',2600);};
/* 設定頁 */
setSec('gfx','gfx',{t:'圖形模式與效能',o:10,cls:'lw-gfxcard',note:'簡易模式：地圖不畫陰影、紋理與等高線；部隊畫成實心方塊（陸）、圓（空）、菱形（海），外框顏色表示士氣（黃＝動搖、紅＝潰散），下方短條只在兵力低於七成時出現；只標城市與鎮。點選部隊時仍顯示名稱。也可以用頂列的「▣」按鈕隨時切換。設定存在這台電腦的瀏覽器裡。',
  h:function(){return setOpt(setRow('圖形模式',setSel('gfxmode','',[['full','完整：地形陰影與紋理、北約符號、戰場特效'],['simple','簡易：平面地圖、簡單符號、關閉特效、較少地名']],gfxSimple()?'simple':'full'))+
    setRow('自動減量',setChk('gfxauto','',GFX.auto,'畫面變慢時自動減少爆炸、煙霧、曳光的數量（順暢後恢復）')));}});
CHG.gfxmode=function(t){gfxSet(t.value);};
CHG.gfxauto=function(t){GFX.auto=!!t.checked;if(!GFX.auto)GFX.fxMul=1;gfxSave();};
