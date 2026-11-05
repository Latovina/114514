/* ===================== 排的介面：地圖上的排（依所選的兵牌樣式畫成小兵牌）、顯示方式、點排就是選連、排的說明、狀態面板的排、編制編輯器的「排的組成」、說明 ===================== */
/* 排的名稱與組成摘要：自訂組成的連在名稱後面列出各種排的數量 */
function pltSummary(u){var P=pltOf(u);if(!P)return '';var o={},L=[];P.forEach(function(p){var n=p.k==='wpn'?'火力排':pltKindName(p.t);if(!o[n]){o[n]=0;L.push(n);}o[n]++;});return L.map(function(n){return o[n]+' 個'+n;}).join('＋');}
(function(){var b=mixName;mixName=function(u){var s=b(u);if(u&&u.pltT&&u.pltT.length&&pltOK(u)){var t=typeOf(u.pltT[0]);return (t?t.n:s)+'（'+pltSummary(u)+'）';}return s;};})();
/* ---------- 地圖：連放大到一定程度時，依陣型展開畫出各排：每個排是一個小兵牌，樣式跟著兵牌設定（北約、華約、明式、德式或連上傳的整張兵牌），也跟著連的面向轉向 ---------- */
var PLTV={on:true},PLTS={v:-1,m:{}};
/* 顯示方式（各自的畫面設定）：all 放大時顯示、sel 只顯示選取的連、off 不顯示；圖層選單的「排」可以一鍵關閉 */
function pltMode(){var v=typeof UIP!=='undefined'&&UIP.pltV;return v==='sel'||v==='off'?v:'all';}
function pltVisible(u){var me=UI.side;return me<0||seeAll()||u.side===me;}
/* 排的類型的兵種符號與機動方式（依類型版本快取） */
function pltSymOf(p){var v=G?G._tv||0:0;if(PLTS.v!==v){PLTS.v=v;PLTS.m={};}var k=p.k==='wpn'?'@wpn|'+p.t:p.t,o=PLTS.m[k];if(o)return o;var t=typeOf(p.t),s=t?mixStats([[p.t,1]]):null;o={sym:p.k==='wpn'?'mg':(t&&t.sym)||'inf',mob:s&&s.mob||''};PLTS.m[k]=o;return o;}
function drawPlt(c){VW._plt=[];if(!PLTV.on||pltMode()==='off'||UI.lay.plt===0||!G||!G.units||typeof gfxSimple==='function'&&gfxSimple())return;var m=mpp();if(m>12)return;var seen={},selOnly=pltMode()==='sel',rotOn=typeof UIP!=='undefined'&&UIP.symRot!==0;
  (VW.items||[]).forEach(function(it){if(it.u&&!it.agg&&!it.grp)seen[it.u.id]=1;});
  c.save();
  G.units.forEach(function(u){if(!seen[u.id]||!isLeaf(u)||!pltVisible(u)||u.st==='off'||u.st==='dead'||u.st==='air'||u.st==='base'||u.st==='lift'||!pltOK(u))return;var sel=UI.sel&&UI.sel.indexOf(u.id)>=0;if(selOnly&&!sel)return;var W=Math.max(120,frontW(u)*0.8);if(W/m<60)return;
    var L=pltPos(u);if(L.length<2)return;var p0=w2s(u.x,u.y);if(p0[0]<-200||p0[1]<-200||p0[0]>VW.cw+200||p0[1]>VW.ch+200)return;var col=sideCol(u.side),cc=typeof cmColU==='function'?cmColU(u):undefined,tot=sum(L,function(o){return o[2].m0+o[2].v0*8;})||1;
    L.forEach(function(o){var p=o[2],q=w2s(o[0],o[1]),sh=(p.m0+p.v0*8)/tot,h=clamp(8+7*Math.sqrt(sh),8,13),f=clamp((p.m+p.v*8)/((p.m0+p.v0*8)||1),0,1),S=pltSymOf(p);
      c.globalAlpha=0.3;c.strokeStyle=cc||col;c.lineWidth=0.6;c.beginPath();c.moveTo(p0[0],p0[1]);c.lineTo(q[0],q[1]);c.stroke();c.globalAlpha=1;
      drawSym(c,{x:q[0],y:q[1],h:h,sym:S.sym,ech:0,dom:'land',side:u.side,col:cc,mob:typeof UIP!=='undefined'&&UIP.mobOn===0?'':S.mob,str:f<0.99?f:undefined,ms:u.ms,sel:sel,cimg:u.cimg||'',rot:rotOn?(u.hd||0):undefined,alpha:0.45+0.55*f});
      VW._plt.push({sx:q[0],sy:q[1],r:h*0.75,u:u,p:p});});});c.restore();}
/* 設定：排的顯示方式 */
setSec('gfx','plt',{t:'排',o:9,local:true,h:function(){return setOpt(setRow('地圖上的排',setSel('pltv','',[['all','放大時顯示'],['sel','只顯示選取的連'],['off','不顯示']],pltMode(),'連放大到一定程度時，依陣型展開畫出各排；排的圖案跟著兵牌樣式')));}});
CHG.pltv=function(t){UIP.pltV=t.value;uipSave();if(t.value!=='off'&&UI.lay.plt===0)UI.lay.plt=1;if(G&&G.map&&VW.ct)vDraw(false);};
/* 圖層選單：排 */
(function(){var b=lyRender;lyRender=function(){b.apply(this,arguments);try{if(!VW.ly||VW.ly.querySelector('[data-ly="plt"]'))return;var s=VW.ly.querySelector('select[data-ly="lvl"]'),l=document.createElement('label');l.innerHTML='<input type="checkbox" data-ly="plt"'+(UI.lay.plt!==0&&pltMode()!=='off'?' checked':'')+'>排';if(s)VW.ly.insertBefore(l,s);else VW.ly.appendChild(l);}catch(e){}};})();
(function(){var b=drawProj;drawProj=function(c){b(c);try{drawPlt(c);}catch(e){if(window.console)console.warn('plt',e);}};})();
/* ---------- 點排就是選連；滑過排顯示排的狀態 ---------- */
function pltHitAt(sx,sy){var P=VW._plt;if(!P||!P.length)return null;var best=null,bd=1e9;P.forEach(function(q){var d=dist(sx,sy,q.sx,q.sy);if(d<=q.r+3&&d<bd){bd=d;best=q;}});return best;}
var hitAt0=hitAt;
(function(){var b=hitAt;hitAt=function(sx,sy){var it=b(sx,sy);if(it)return it;var q=pltHitAt(sx,sy);if(!q)return null;var u=q.u,c=(VW.items||[]).filter(function(x){return x.u===u&&!x.agg&&!x.grp;})[0];return c||{u:u,s:ST(u),sx:q.sx,sy:q.sy,h:14};};})();
function pltTip(u,p){var f=clamp((p.m+p.v*8)/((p.m0+p.v0*8)||1),0,1),t=typeOf(p.t);return uName(u)+'・'+p.n+'\n'+(p.k==='wpn'?'火力排（機槍、迫擊砲與反戰車武器）':pltKindName(p.t))+(t?'，屬「'+t.n+'」':'')+'\n人員 '+fmt(p.m)+'／'+fmt(p.m0)+(p.v0>0.05?'，裝備 '+fx(p.v,1)+'／'+fx(p.v0,1):'')+'（'+pct(f*100)+'）\n排不能單獨下令，點選就是選取所屬的連';}
(function(){var b=tipAt;tipAt=function(sx,sy,w){b(sx,sy,w);if(hitAt0(sx,sy))return;var q=pltHitAt(sx,sy);if(!q||!VW.tip)return;VW.tip.textContent=pltTip(q.u,q.p);VW.tip.hidden=false;};})();
/* ---------- 狀態面板：選取的連列出各排 ---------- */
function pltBlock(u){var P=pltOf(u);if(!P)return '';var rows=P.map(function(p){var f=clamp((p.m+p.v*8)/((p.m0+p.v0*8)||1),0,1);return '<tr><td>'+esc(p.n)+'</td><td>'+(p.k==='wpn'?'火力排':esc(pltKindName(p.t)))+'</td><td class="n">'+fmt(p.m)+'</td><td class="n">'+(p.v0>0.05?fx(p.v,1):'—')+'</td><td>'+(p.x?'<span style="color:#b3261e">已打散，殘部併入他排</span>':pct(f*100))+'</td></tr>';}).join('');
  return '<div class="lw-pltb"><h4 style="margin:8px 0 4px;font-size:13px">排的編組<small style="font-weight:normal;color:#666">（'+esc(fmName(u.form==='march'?'column':u.fmC||'line'))+(u.form==='march'?'・行軍':'')+'；排跟著連行動，不能單獨下令）</small></h4><div class="lw-sc"><table class="lw-tbl"><tr><th>排</th><th>種類</th><th class="n">人員</th><th class="n">裝備</th><th>兵力</th></tr>'+rows+'</table></div></div>';}
(function(){var b=btStatus;btStatus=function(){b.apply(this,arguments);try{if(UI.selX||UI.selC||UI.selB||!UI.sel||UI.sel.length!==1)return;var u=uById(UI.sel[0]),el=btEl('bst');if(!u||!el||!pltOK(u))return;var me=mySide();if(me!==null&&u.side!==me&&G.set.fog)return;
  var old=el.querySelector('.lw-pltb');if(old)old.remove();var bars=el.querySelector('.lw-bars');if(bars)bars.insertAdjacentHTML('afterend',pltBlock(u));else el.insertAdjacentHTML('beforeend',pltBlock(u));}catch(e){if(window.console)console.warn('plt',e);}};})();
/* ---------- 編制編輯器：連由哪些排組成 ---------- */
function pltTypeOpts(sel){var all=Object.keys(UT).concat(Object.keys(G.types||{})).filter(function(k,i,a){return a.indexOf(k)===i&&pltN(k)>0;}),g={};all.forEach(function(k){var t=typeOf(k),e=t.cus?'cus':t.era;(g[e]=g[e]||[]).push(k);});
  var op=function(k){var t=typeOf(k);return '<option value="'+k+'"'+(k===sel?' selected':'')+'>'+esc(pltKindName(k))+'（'+esc(t.n)+'）</option>';},o='';if(g.cus)o+='<optgroup label="自訂類型">'+g.cus.map(op).join('')+'</optgroup>';
  ERA.forEach(function(e){if(g[e.k])o+='<optgroup label="'+esc(e.n)+'">'+g[e.k].map(op).join('')+'</optgroup>';});return o;}
function pltEdHtml(u){var T=pltTypes(u),P=pltOf(u)||[],std=!(u.pltT&&u.pltT.length);
  return '<h4 style="margin:10px 0 4px;font-size:13px" data-k="plth">排的組成</h4><div class="lw-note">連由幾個排組成：每個排是該類連的幾分之一（人員、裝備與火力），可以混編不同類型的排，例如三個機步排加一個戰車排。'+(std?'目前是「'+esc((typeOf(u.mix[0][0])||{}).n||'')+'」的標準編組。':'目前是自訂的混編連。')+'</div>'+
    '<table class="lw-tbl"><tr><th>排</th><th>類型</th><th class="n">人員</th><th class="n">裝備</th><th></th></tr>'+T.map(function(k,i){var p=P[i]||{};return '<tr><td>'+esc(p.n||('第'+(i+1)+'排'))+'</td><td><select data-c="opltt" data-v="'+i+'">'+pltTypeOpts(k)+'</select></td><td class="n">'+fmt(p.m0||0)+'</td><td class="n">'+(p.v0>0.05?fx(p.v0,1):'—')+'</td><td>'+(T.length>1?'<button type="button" class="lw-btn sm dng" data-a="opltdel" data-v="'+i+'">移除</button>':'')+'</td></tr>';}).join('')+'</table>'+
    '<div class="lw-row"><select data-k="opltaddt">'+pltTypeOpts(T[0])+'</select><button type="button" class="lw-btn sm" data-a="opltadd"'+(T.length>=8?' disabled':'')+'>加一個排</button>'+(std?'':'<button type="button" class="lw-btn sm" data-a="opltreset">恢復標準編組</button>')+'</div>';}
function pltApply(u,T){if(!u||!T.length)return;u.pltT=T.slice(0,8);u.mix=pltMix(u.pltT);reinitLeaf(u);u.plt=null;pltOf(u);obDet();obTree();}
CHG.opltt=function(t){var u=uById(OB.sel);if(!u)return;var T=pltTypes(u),i=+t.getAttribute('data-v');if(!T[i]||!typeOf(t.value))return;T[i]=t.value;pltApply(u,T);};
ACT.opltdel=function(b){var u=uById(OB.sel);if(!u)return;var T=pltTypes(u);if(T.length<2)return;T.splice(+b.getAttribute('data-v'),1);pltApply(u,T);};
ACT.opltadd=function(){var u=uById(OB.sel),s=UI.body&&UI.body.querySelector('[data-k="opltaddt"]');if(!u||!s||!typeOf(s.value))return;var T=pltTypes(u);if(T.length>=8)return;T.push(s.value);pltApply(u,T);};
ACT.opltreset=function(){var u=uById(OB.sel);if(!u||!u.pltT)return;var by={};u.pltT.forEach(function(k){by[k]=(by[k]||0)+1;});var k0=Object.keys(by).sort(function(a,b){return by[b]-by[a];})[0];delete u.pltT;u.mix=[[k0,1]];reinitLeaf(u);u.plt=null;obDet();obTree();};
(function(){var b=obDet;obDet=function(){b.apply(this,arguments);try{var el=UI.body&&UI.body.querySelector('[data-k="obdet"]'),u=OB.sel?uById(OB.sel):null;if(!el||!u||!isLeaf(u)||!pltOK(u))return;
  var h=[].slice.call(el.querySelectorAll('h4')).filter(function(x){return x.textContent==='組成';})[0];var d=document.createElement('div');d.className='lw-pltd';d.innerHTML=pltEdHtml(u);
  if(h){var t=h.nextElementSibling,r=t&&t.nextElementSibling;if(r&&r.querySelector&&r.querySelector('[data-k="omixt"]'))r.remove();if(t&&t.tagName==='TABLE')t.remove();h.replaceWith(d);}else el.appendChild(d);}catch(e){if(window.console)console.warn('plt',e);}};})();
HELP14.push('<h4>排（連的組成）</h4><ul><li>連是最小的可操控單位，由幾個排組成：步兵與機步連是三個步兵排加一個火力排（1900 年以前沒有火力排），戰車、偵察、工兵等連是三個排，砲兵與防空連是兩個排。合併到營或團的單位不分排；飛機、船艦也不分排。</li>'+
  '<li>地圖放大到一定程度時，連依陣型展開畫出各排：每個排是一個小兵牌，圖案跟著設定的兵牌樣式（北約、華約、明式、德式，或連上傳的整張兵牌），也跟著連的面向轉向；排的兵力減少時兵牌變淡，下方出現兵力條。設定的「畫面 → 排」可以改成只顯示選取的連或不顯示，圖層選單的「排」可以一鍵關閉。</li>'+
  '<li>放大到看得清楚連的正面時，連的周圍會以圓圈畫出各排：位置依陣型展開（橫隊並列、縱隊與行軍前後相接、楔形一排在前、梯隊斜列、環形四周、疏開拉大間距），圓圈內的字是排的種類（步、機、戰、砲、偵、工、火……），顏色越淡、紅色缺口越大表示損失越重。</li>'+
  '<li>排不能單獨下令：點選或拖曳排就是選取所屬的連；滑過排會顯示該排的人員與裝備。連的狀態面板列出各排的兵力。</li>'+
  '<li>傷亡依敵人來的方向分配，面向敵人的排損失較多；排剩不到兩成就失去戰鬥力，殘部併入其他排。補充兵員時先補齊各排，再重建打散的排。</li>'+
  '<li>在「兵力編成」選取一個連，可以在「排的組成」用不同類型的排組合，例如三個機步排加一個戰車排：每個排是該類連的幾分之一。混編的連失去某類排時，那一類的火力跟著減少（戰車排打光，反裝甲火力就大減）。</li></ul>');
