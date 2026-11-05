/* ===================== 環形命令選單：選取或框選本方部隊時，在部隊位置出現一圈分類（機動、攻擊、防禦、火力、工兵、後勤、空降登陸、隊形），
   點分類再點細項下令；需要目標的命令接著點地圖（與命令列相同），不需要目標的立即執行。中央 ✕ 或 Esc 關閉，Q 鍵開關；圖層列「環形選單」可關閉自動顯示，命令列照常保留 ===================== */
/* 分類與命令都取自命令登錄表（ORDCAT、ORDR），另加隊形 */
function rmC(){return ORDCAT.map(function(c){return [c[0],c[1],c[2],ordCat(c[0])];}).concat([['fm','隊形','fm',null]]);}
var FMI={line:'═',column:'║',skirmish:'⋯',wedge:'▲',echelon:'⟋',allround:'◯',dispersed:'⁘'};
var RM={on:false,cat:null,key:'',el:null,R:128};
if(UIP.rm===undefined)UIP.rm=1;
/* 只有玩家能指揮的部隊：本方（上帝視角時任一方）、不是交給 AI 指揮的部隊 */
function rmUnits(){var me=mySide();return UI.sel.map(uById).filter(function(u){return u&&alive(u)&&(me===null||u.side===me)&&u.st!=='off'&&!u.irr&&cmPlMay(u);});}
function rmOrdName(k){var q=ORDB.filter(function(r){return r[0]===k;})[0];return q?q[1]:(ORDN[k]||k);}
function rmCatName(c){var q=rmC().filter(function(r){return r[0]===c;})[0];return q?q[1]:'';}
/* 每一項：[代號, 名稱, 圖示, 可用, 說明] */
function rmItems(cat){var us=rmUnits();if(cat==='fm'){var L=v10Sel(),out=[['auto','自動','⟳',L.length>0,'依任務、側翼與敵情自動選擇陣型']];
    FMV.forEach(function(q){out.push([q[0],q[1],FMI[q[0]]||'◇',L.some(function(u){return fmAvail(u).indexOf(q[0])>=0;}),q[2]]);});out.push(['face','轉向','➶',L.length>0,'點選地圖，部隊轉向面對該處']);return out;}
  var C=rmC().filter(function(c){return c[0]===cat;})[0];if(!C)return [];
  return C[3].map(function(k){return [k,rmOrdName(k),ICO[k]?k:OICO[k]||'•',us.some(function(u){return canOrd(u,k);}),DCN[k]||''];});}
function rmCats(){return rmC().map(function(c){var it=rmItems(c[0]),ok=it.filter(function(q){return q[3];});return [c[0],c[1],c[2],ok.length>0,ok.length?ok.map(function(q){return q[1];}).join('、'):'選取的部隊沒有這類命令'];});}
function rmCtr(){var x=0,y=0,n=0;rmUnits().forEach(function(u){if(!onMap(u))return;x+=u.x;y+=u.y;n++;});return n?[x/n,y/n]:null;}
function rmWedge(cx,cy,r1,r2,a0,a1){var la=a1-a0>PI?1:0,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1),f=function(v){return v.toFixed(1);};
  return 'M'+f(cx+r2*c0)+' '+f(cy+r2*s0)+'A'+r2+' '+r2+' 0 '+la+' 1 '+f(cx+r2*c1)+' '+f(cy+r2*s1)+'L'+f(cx+r1*c1)+' '+f(cy+r1*s1)+'A'+r1+' '+r1+' 0 '+la+' 0 '+f(cx+r1*c0)+' '+f(cy+r1*s0)+'Z';}
function rmRender(){if(!VW.wrap)return;var L=RM.cat?rmItems(RM.cat):rmCats(),n=Math.max(1,L.length),R=RM.cat&&n>8?146:RM.cat?134:124,r1=42,r2=R-8,cx=R,cy=R,gap=n>1?0.022:0,
    o='<svg width="'+(2*R)+'" height="'+(2*R)+'" viewBox="0 0 '+(2*R)+' '+(2*R)+'" role="menu" aria-label="'+(RM.cat?rmCatName(RM.cat):'命令類別')+'">';
  L.forEach(function(q,i){var a0=-PI/2+(i-0.5)*2*PI/n+gap,a1=a0+2*PI/n-2*gap,am=(a0+a1)/2,rm=r1+(r2-r1)*0.55,tx=cx+Math.cos(am)*rm,ty=cy+Math.sin(am)*rm,act=RM.cat?'rmo':'rmc';
    o+='<g class="lw-rmw'+(q[3]?'':' off')+'" data-a="'+act+'" data-v="'+q[0]+'" data-d="'+esc(q[4]||'')+'" role="menuitem" aria-disabled="'+(q[3]?'false':'true')+'" aria-label="'+esc(q[1])+'"><path d="'+(n>1?rmWedge(cx,cy,r1,r2,a0,a1):'')+'"/>'+
      (ICO[q[2]]?icoG(q[2],tx,ty-7,18):'<text x="'+tx.toFixed(1)+'" y="'+(ty-2).toFixed(1)+'" class="i">'+esc(q[2])+'</text>')+'<text x="'+tx.toFixed(1)+'" y="'+(ty+13).toFixed(1)+'" class="l">'+esc(q[1])+'</text></g>';});
  o+='<g class="lw-rmc" data-a="'+(RM.cat?'rmback':'rmx')+'" role="button" aria-label="'+(RM.cat?'返回':'關閉')+'"><circle cx="'+cx+'" cy="'+cy+'" r="'+(r1-5)+'"/>'+icoG(RM.cat?'back':'close',cx,cy-5,16)+'<text x="'+cx+'" y="'+(cy+15)+'" class="l">'+(RM.cat?'返回':rmUnits().length+' 單位')+'</text></g></svg>';
  if(!RM.el||!RM.el.isConnected){RM.el=document.createElement('div');RM.el.className='lw-rm';VW.wrap.appendChild(RM.el);
    RM.el.addEventListener('mouseover',function(e){var g=e.target.closest&&e.target.closest('.lw-rmw');var cap=RM.el.querySelector('.lw-rmcap');if(!cap)return;cap.textContent=g?(g.getAttribute('aria-label')+(g.getAttribute('data-d')?'：'+g.getAttribute('data-d'):'')):rmHint();});}
  RM.R=R;RM.el.style.width=RM.el.style.height=(2*R)+'px';RM.el.innerHTML=o+'<div class="lw-rmcap">'+esc(rmHint())+'</div>';}
function rmHint(){return RM.cat?rmCatName(RM.cat)+'：選擇命令，需要目標的接著點地圖':'選擇命令類別（Q 開關選單，Esc 關閉）';}
function rmOpen(cat){if(!G||!G.started||G.replay||UI.tab!=='battle'||!VW.wrap||!rmUnits().length){rmClose();return false;}RM.on=true;RM.cat=cat||null;rmRender();if(!rmPos())return false;return true;}
function rmClose(){RM.on=false;RM.cat=null;if(RM.el){RM.el.remove();RM.el=null;}}
/* 跟著地圖平移縮放；部隊在畫面外時關閉 */
function rmPos(){if(!RM.on)return false;if(!RM.el||!RM.el.isConnected||UI.tab!=='battle'){rmClose();return false;}var c=rmCtr();if(!c){rmClose();return false;}var p=w2s(c[0],c[1]),R=RM.R,W=VW.cw,H=VW.ch;
  if(p[0]<0||p[1]<0||p[0]>W||p[1]>H){rmClose();return false;}var x=clamp(p[0],R+4,Math.max(R+4,W-R-4)),y=clamp(p[1],R+4,Math.max(R+4,H-R-48));RM.el.style.left=Math.round(x-R)+'px';RM.el.style.top=Math.round(y-R)+'px';return true;}
/* 選取改變時自動打開（正在點地圖下令時不打開） */
function rmSync(){var key=UI.sel.slice().sort(function(a,b){return a-b;}).join(',');if(key===RM.key){if(RM.on)rmRender(),rmPos();return;}RM.key=key;if(!UI.sel.length){rmClose();return;}if(UIP.rm&&UI.tool==='sel')rmOpen(null);else rmClose();}
(function(){var b=btSel;btSel=function(){b();try{rmSync();}catch(e){if(window.console)console.warn('radial',e);}};})();
(function(){var b=vDraw;vDraw=function(full){b(full);if(RM.on)try{rmPos();}catch(e){}};})();
(function(){var b=vDown;vDown=function(e){if(e.target&&e.target.closest&&e.target.closest('.lw-rm'))return;return b(e);};})();
(function(){var b=vMove;vMove=function(e){if(e.target&&e.target.closest&&e.target.closest('.lw-rm')){if(VW.tip)VW.tip.hidden=true;return;}return b(e);};})();
/* 從命令列或快捷鍵進入下令、畫線等模式時關閉選單，免得擋住點選與拖曳 */
(function(){var b=modeBt;modeBt=function(){b();if(RM.on&&UI.tool!=='sel')rmClose();};})();
(function(){var b=setTool;setTool=function(t){var r=b.apply(this,arguments);if(RM.on&&UI.tool!=='sel')rmClose();return r;};})();
(function(){var b=ACT.v10face;ACT.v10face=function(){rmClose();return b.apply(this,arguments);};})();
ACT.rmc=function(b){var c=b.getAttribute('data-v');if(!rmItems(c).some(function(q){return q[3];})){toast('選取的部隊沒有「'+rmCatName(c)+'」類的命令。');return;}RM.cat=c;rmRender();rmPos();};
ACT.rmback=function(){RM.cat=null;rmRender();rmPos();};
ACT.rmx=function(){rmClose();};
ACT.rmo=function(b){var k=b.getAttribute('data-v'),cat=RM.cat,it=rmItems(cat).filter(function(q){return q[0]===k;})[0];if(!it||!it[3]){toast('選取的部隊不能執行「'+(it?it[1]:k)+'」。');return;}rmClose();
  var fake={getAttribute:function(a){return a==='data-v'?k:null;}};if(cat==='fm'){if(k==='face')ACT.v10face();else ACT.v10fm(fake);return;}ACT.ob(fake);};
document.addEventListener('keydown',function(e){if(!G||!G.started||/INPUT|SELECT|TEXTAREA/.test((e.target&&e.target.tagName)||''))return;
  if(e.key==='Escape'&&RM.on){if(RM.cat)ACT.rmback();else rmClose();e.stopPropagation();return;}},true);
/* 圖層列：環形選單開關（記在瀏覽器） */
(function(){var b=lyRender;lyRender=function(){b();if(!VW.ly)return;var sel=VW.ly.querySelector('select[data-ly="lvl"]'),l=document.createElement('label');l.title='選取部隊時自動顯示環形命令選單（Q 鍵可隨時開關）';
  l.innerHTML='<input type="checkbox" data-ly="rm"'+(UIP.rm?' checked':'')+'>環形選單';VW.ly.insertBefore(l,sel||null);};})();
(function(){var b=lyRender;lyRender=function(){b();if(!VW.ly||VW.ly._rmH)return;VW.ly._rmH=1;VW.ly.addEventListener('change',function(e){var t=e.target;if(t.getAttribute&&t.getAttribute('data-ly')==='rm'){UIP.rm=t.checked?1:0;uipSave();if(!UIP.rm)rmClose();}});};})();
HELP14.push('<h4>環形命令選單</h4><ul>'+
  '<li>點選或框選本方部隊時，部隊位置會出現一圈命令類別：機動、攻擊、防禦、火力、工兵、後勤、空降登陸、隊形。點類別後換成該類的命令，灰色的是選取的部隊不能執行的；滑鼠停在扇形上會顯示說明。</li>'+
  '<li>需要目標的命令（移動、攻擊、砲擊、轟炸區、煙幕……）點了之後接著點地圖或拖曳，與右側命令列完全相同；停止、休整、加油、固守等不需要目標的命令立即執行。隊形可以直接切換橫隊、縱隊、疏開等，或點「轉向」再點地圖。</li>'+
  '<li>中央的 ✕ 關閉、‹ 返回上一層；Esc 也可以。Q 鍵隨時開關選單；地圖左上的圖層列取消「環形選單」就不會在選取時自動出現（命令列照常保留）。</li></ul>');
