/* ===================== 區塊地形編修（介面）：地圖編修頁新增「區塊編修」與「地形印章」。
   拖曳選取矩形、圓形或套索範圍（Shift 加選、Alt 減選），點一下用魔術棒選相連的同類地表；再整塊套用地表、地景範本、地勢、清除、複製貼上；Ctrl+Z 復原 ===================== */
EDT.push(['blk','區塊編修'],['stamp','地形印章']);
var BKU={sel:'rect',same:'grp',lc:LCI.dfor,pre:'forest',edge:1,eop:'raise',dz:100,amp:200,h:200,f:4,clr:{rd:1,rl:0,ft:1,rv:0},rot:0,flip:0,rel:1,paste:0,st:'hill',R:1500,drag:null,cv:null,cvV:-1,open:{lc:1,el:1,clr:0,cp:0}};
function bkTool(){return UI.tab==='map'&&(ED.tool==='blk'||ED.tool==='stamp');}
function bkKm2(n){return n*G.map.cs*G.map.cs/1e6;}
/* ---------- 工具面板 ---------- */
function bkPanel(){var MP=G.map,o='';if(ED.tool==='stamp'){o+='<div class="lw-note">點選地圖，在該處產生自然形狀的地形。</div><div class="lw-ob" style="grid-template-columns:repeat(3,1fr)">'+Object.keys(BKST).map(function(k){return '<button type="button" data-a="bkst" data-v="'+k+'" class="'+(BKU.st===k?'on':'')+'">'+BKST[k][0]+'</button>';}).join('')+'</div>'+
    '<div class="lw-row"><label>大小（半徑） <input type="range" min="300" max="8000" step="100" value="'+BKU.R+'" data-c="bkv" data-f="R"> <span>'+kmTxt(BKU.R)+'</span></label></div>'+(BKU.st==='hill'||BKU.st==='ridge'?'<div class="lw-row"><label>高度 <input type="number" min="20" max="4000" step="10" value="'+(BKU.st==='ridge'?Math.max(BKU.amp,600):BKU.amp)+'" data-c="bkv" data-f="amp" style="width:70px"> 公尺</label></div>':'')+bkUndoRow();return o;}
  o+='<div class="lw-row" style="flex-wrap:wrap"><b>選取</b>'+[['rect','矩形'],['circle','圓形'],['lasso','套索'],['wand','魔術棒']].map(function(q){return '<button type="button" class="lw-btn sm'+(BKU.sel===q[0]?' pri':'')+'" data-a="bksel" data-v="'+q[0]+'">'+q[1]+'</button>';}).join('')+'</div>'+
    '<div class="lw-note">拖曳框選；點一下以魔術棒選取相連的'+(BKU.same==='lc'?'同種':'同類')+'地表。Shift 加選、Alt 減選、Esc 取消選取。</div>'+
    '<div class="lw-row" style="flex-wrap:wrap"><label><input type="checkbox" data-c="bkv" data-f="same"'+(BKU.same==='lc'?' checked':'')+'>魔術棒只選同一種地表</label><button type="button" class="lw-btn sm" data-a="bkall">全選</button><button type="button" class="lw-btn sm" data-a="bkinv">反選</button><button type="button" class="lw-btn sm" data-a="bknone">取消選取</button></div>'+
    '<div class="lw-note" data-k="bkn">'+(BK.n?'已選 '+fmt(BK.n)+' 格（約 '+fmt(bkKm2(BK.n),bkKm2(BK.n)<10?2:1)+' 平方公里）':'尚未選取')+'</div>';
  var dis=BK.n?'':' disabled';
  o+='<details data-bko="lc"'+(BKU.open.lc?' open':'')+'><summary><b>地表</b></summary><div class="lw-row"><select data-c="bkv" data-f="lc">'+LC.map(function(c,i){return '<option value="'+i+'"'+(BKU.lc===i?' selected':'')+'>'+c[1]+'</option>';}).join('')+'</select><button type="button" class="lw-btn sm pri" data-a="bklc"'+dis+'>套用</button></div>'+
    '<div class="lw-row"><select data-c="bkv" data-f="pre">'+Object.keys(BKPRE).map(function(k){return '<option value="'+k+'"'+(BKU.pre===k?' selected':'')+'>'+BKPRE[k][0]+'</option>';}).join('')+'</select><button type="button" class="lw-btn sm pri" data-a="bkpre"'+dis+'>套用範本</button></div>'+
    '<label class="lw-note"><input type="checkbox" data-c="bkv" data-f="edge"'+(BKU.edge?' checked':'')+'> 自然邊緣（邊界約三格不規則）</label></details>';
  o+='<details data-bko="el"'+(BKU.open.el?' open':'')+'><summary><b>地勢</b></summary><div class="lw-row"><select data-c="bkv" data-f="eop">'+Object.keys(BKEL).map(function(k){return '<option value="'+k+'"'+(BKU.eop===k?' selected':'')+'>'+BKEL[k]+'</option>';}).join('')+'</select>'+
    (BKU.eop==='raise'||BKU.eop==='lower'?'<input type="number" min="1" max="5000" value="'+BKU.dz+'" data-c="bkv" data-f="dz" style="width:64px"> 公尺':BKU.eop==='set'?'<input type="number" min="-500" max="8800" value="'+BKU.h+'" data-c="bkv" data-f="h" style="width:64px"> 公尺':BKU.eop==='rough'||BKU.eop==='hill'||BKU.eop==='ridge'?'<input type="number" min="1" max="5000" value="'+BKU.amp+'" data-c="bkv" data-f="amp" style="width:64px"> 公尺':'')+
    '<button type="button" class="lw-btn sm pri" data-a="bkel"'+dis+'>套用</button></div><div class="lw-row"><label>邊緣漸變 <input type="range" min="1" max="20" value="'+BKU.f+'" data-c="bkv" data-f="f"> <span>'+kmTxt(BKU.f*MP.cs)+'</span></label></div></details>';
  o+='<details data-bko="clr"'+(BKU.open.clr?' open':'')+'><summary><b>清除</b></summary><div class="lw-row" style="flex-wrap:wrap">'+[['rd','道路'],['rl','鐵路'],['ft','工事'],['rv','溪流']].map(function(q){return '<label><input type="checkbox" data-c="bkclr" data-f="'+q[0]+'"'+(BKU.clr[q[0]]?' checked':'')+'>'+q[1]+'</label>';}).join('')+'<button type="button" class="lw-btn sm dng" data-a="bkclear"'+dis+'>清除</button></div></details>';
  o+='<details data-bko="cp"'+(BKU.open.cp||BK.clip?' open':'')+'><summary><b>複製貼上</b></summary><div class="lw-row" style="flex-wrap:wrap"><button type="button" class="lw-btn sm" data-a="bkcopy"'+dis+'>複製選取</button><button type="button" class="lw-btn sm'+(BKU.paste?' pri':'')+'" data-a="bkpaste"'+(BK.clip?'':' disabled')+'>'+(BKU.paste?'點選地圖貼上…':'貼上')+'</button>'+
    '<button type="button" class="lw-btn sm" data-a="bkrot" data-v="-1" title="逆時針轉 90°">⟲</button><button type="button" class="lw-btn sm" data-a="bkrot" data-v="1" title="順時針轉 90°">⟳</button><label><input type="checkbox" data-c="bkv" data-f="flip"'+(BKU.flip?' checked':'')+'>左右翻轉</label><label><input type="checkbox" data-c="bkv" data-f="rel"'+(BKU.rel?' checked':'')+'>高度相對（貼合地面）</label></div>'+
    (BK.clip?'<div class="lw-note">剪貼簿：'+fmt(BK.clip.n)+' 格（'+BK.clip.w+' × '+BK.clip.h+'），旋轉 '+(((BKU.rot%4)+4)%4*90)+'°</div>':'')+'</details>'+bkUndoRow();return o;}
function bkUndoRow(){var L=BK.undo,last=L[L.length-1];return '<div class="lw-row" style="margin-top:6px"><button type="button" class="lw-btn sm" data-a="bkundo"'+(L.length?'':' disabled')+'>↶ 復原'+(last?'「'+esc(last.label)+'」':'')+'</button><span class="lw-note">'+L.length+' 步（Ctrl+Z）</span></div>';}
(function(){var b=edTools;edTools=function(){if(ED.tool!=='blk'&&ED.tool!=='stamp')return b();b();var el=UI.body.querySelector('[data-k="edt"]');if(!el)return;var d=document.createElement('div');d.className='lw-bkp';d.innerHTML=bkPanel();el.appendChild(d);};})();
function bkRefresh(){var d=UI.body&&UI.body.querySelector('.lw-bkp');if(d)d.innerHTML=bkPanel();}
(function(){var b=edBind;edBind=function(){b();if(ED.tool!=='blk'&&ED.tool!=='stamp'){BKU.paste=0;return;}UI.tool='paint';UI.brush=0;UI.onPaint=bkPtr;UI.onPaintEnd=bkPtrEnd;UI.onClick=null;bkMode();vDraw(false);};})();
function bkMode(){if(!VW.mode)return;VW.mode.hidden=false;VW.mode.textContent=ED.tool==='stamp'?'點選地圖放置「'+BKST[BKU.st][0]+'」（半徑 '+kmTxt(BKU.R)+'）':BKU.paste?'點選地圖貼上剪貼簿（旋轉 '+(((BKU.rot%4)+4)%4*90)+'°）；Esc 取消':{rect:'拖曳框選矩形範圍',circle:'從中心拖曳出圓形範圍',lasso:'按住拖曳圈出任意形狀',wand:'點選地表，選取相連的同類地表'}[BKU.sel]+'（Shift 加選、Alt 減選）';}
/* ---------- 指標：拖曳選取、點選魔術棒、貼上、印章 ---------- */
function bkPtr(x,y,e){var D=BKU.drag;if(!D){BKU.drag={x0:x,y0:y,x:x,y:y,pts:[x,y],mode:e&&e.shiftKey?1:e&&e.altKey?-1:0,sx:VW.hover?VW.hover.sx:0,sy:VW.hover?VW.hover.sy:0};return;}D.x=x;D.y=y;if(BKU.sel==='lasso'){var L=D.pts;if(dist(x,y,L[L.length-2],L[L.length-1])>mpp()*4)L.push(x,y);}vDraw(false);}
function bkPtrEnd(){var D=BKU.drag;BKU.drag=null;if(!D)return;var MP=G.map,moved=dist(D.x,D.y,D.x0,D.y0)>mpp()*6,ks=null,lbl='';
  if(ED.tool==='stamp'){ks=bkStamp(MP,D.x,D.y,BKU.st,BKU.R,{amp:BKU.st==='ridge'?Math.max(BKU.amp,600):BKU.amp});lbl=BKST[BKU.st][0];bkDone(ks,lbl,BKU.st==='hill'||BKU.st==='ridge'||BKU.st==='lake');return;}
  if(BKU.paste){ks=bkPaste(MP,D.x,D.y,{rot:BKU.rot,flip:BKU.flip,rel:!!BKU.rel});bkDone(ks,'貼上',true);return;}
  if(!moved||BKU.sel==='wand')bkWand(MP,D.x,D.y,D.mode,BKU.same);else if(BKU.sel==='rect')bkRect(MP,D.x0,D.y0,D.x,D.y,D.mode);else if(BKU.sel==='circle')bkCircle(MP,D.x0,D.y0,dist(D.x0,D.y0,D.x,D.y),D.mode);else bkPoly(MP,D.pts.concat([D.x,D.y]),D.mode);
  bkRefresh();vDraw(false);}
/* 套用後：路徑搜尋、地圖影像（只重繪變動的範圍）、資訊 */
function bkDone(ks,lbl,elev){if(!ks||!ks.length){toast('沒有可以套用的範圍。');return;}var MP=G.map,GW=MP.GW,x0=1e9,y0=1e9,x1=-1,y1=-1;for(var i=0;i<ks.length;i++){var x=ks[i]%GW,y=(ks[i]/GW)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  if(elev){invalidatePF();delete G.map._ci;}var box=[y0*GW+x0,y1*GW+x1];if(ks.length>4000){invalidatePF();G._mapv=(G._mapv||0)+1;(G.dirty=G.dirty||[]).push(box);}else mapChanged(Array.from(ks));if(typeof fdcClear==='function')fdcClear();
  vDraw(true);edInfo();bkRefresh();toast('已套用「'+lbl+'」（'+fmt(ks.length)+' 格）'+(BK.lastSet&&lbl.indexOf('市')>=0||BK.lastSet&&lbl==='村莊'?'；新聚落「'+BK.lastSet.name+'」':''),3500);BK.lastSet=null;}
ACT.bksel=function(b){BKU.sel=b.getAttribute('data-v');BKU.paste=0;bkMode();bkRefresh();};
ACT.bkst=function(b){BKU.st=b.getAttribute('data-v');bkMode();edTools();};
ACT.bkall=function(){bkAll(G.map);bkRefresh();vDraw(false);};ACT.bkinv=function(){bkInvert(G.map);bkRefresh();vDraw(false);};ACT.bknone=function(){bkReset(G.map);BKU.paste=0;bkMode();bkRefresh();vDraw(false);};
CHG.bkv=function(t){var f=t.getAttribute('data-f');if(f==='same')BKU.same=t.checked?'lc':'grp';else if(f==='edge'||f==='flip'||f==='rel')BKU[f]=t.checked?1:0;else if(f==='pre'||f==='eop')BKU[f]=t.value;else BKU[f]=+t.value;if(f==='eop'||f==='R')(ED.tool==='stamp'?edTools:bkRefresh)();if(f==='R')bkMode();};
CHG.bkclr=function(t){BKU.clr[t.getAttribute('data-f')]=t.checked?1:0;};
ACT.bklc=function(){bkDone(bkFillLC(G.map,BKU.lc,{edge:!!BKU.edge}),LC[BKU.lc][1],false);};
ACT.bkpre=function(){var k=BKU.pre;bkDone(bkPreset(G.map,k,{edge:!!BKU.edge}),BKPRE[k][0].replace(/（.*）/,''),k==='lake');};
ACT.bkel=function(){var op=BKU.eop;bkDone(bkElev(G.map,op,{dz:BKU.dz,amp:BKU.amp,h:BKU.h,f:BKU.f}),BKEL[op],true);};
ACT.bkclear=function(){var L=Object.keys(BKU.clr).filter(function(k){return BKU.clr[k];});if(!L.length){toast('先勾選要清除的圖層。');return;}bkDone(bkClearLayers(G.map,L),'清除',false);};
ACT.bkcopy=function(){var C=bkCopy(G.map);if(C){BKU.rot=0;toast('已複製 '+fmt(C.n)+' 格。按「貼上」後點選地圖。');}bkRefresh();};
ACT.bkpaste=function(){if(!BK.clip)return;BKU.paste=BKU.paste?0:1;bkMode();bkRefresh();};
ACT.bkrot=function(b){BKU.rot=(BKU.rot+(+b.getAttribute('data-v'))+4)%4;bkMode();bkRefresh();vDraw(false);};
ACT.bkundo=function(){var o=bkUndo(G.map);if(!o){toast('沒有可以復原的步驟。');return;}var ks=o.ks;invalidatePF();var GW=G.map.GW,x0=1e9,y0=1e9,x1=-1,y1=-1;for(var i=0;i<ks.length;i++){var x=ks[i]%GW,y=(ks[i]/GW)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  G._mapv=(G._mapv||0)+1;(G.dirty=G.dirty||[]).push([y0*GW+x0,y1*GW+x1]);vDraw(true);edInfo();bkRefresh();toast('已復原「'+o.label+'」');};
/* 記住各段的展開狀態（面板重繪時保留） */document.addEventListener('toggle',function(e){var t=e.target;if(t&&t.getAttribute&&t.getAttribute('data-bko'))BKU.open[t.getAttribute('data-bko')]=t.open?1:0;},true);
document.addEventListener('keydown',function(e){if(!G||!G.map||!bkTool()||/INPUT|SELECT|TEXTAREA/.test((e.target&&e.target.tagName)||''))return;if((e.ctrlKey||e.metaKey)&&(e.key==='z'||e.key==='Z')){e.preventDefault();ACT.bkundo();}else if(e.key==='Escape'){BKU.paste=0;BKU.drag=null;bkReset(G.map);bkMode();bkRefresh();vDraw(false);}});
/* ---------- 地圖上的選取範圍、拖曳中的形狀、貼上與印章的預覽 ---------- */
function bkOverlay(c){if(!bkTool())return;var MP=G.map,GW=MP.GW,GH=MP.GH,s=VW.s;
  if(BK.n&&BK.m&&BK.m.length===GW*GH){if(!BKU.cv||BKU.cvV!==BK.v||BKU.cv.width!==GW){var cv=BKU.cv||document.createElement('canvas');cv.width=GW;cv.height=GH;var cx=cv.getContext('2d'),im=cx.createImageData(GW,GH),D=im.data,m=BK.m,bb=BK.bb;
      for(var y=bb[1];y<=bb[3];y++)for(var x=bb[0];x<=bb[2];x++){var k=y*GW+x;if(!m[k])continue;var edge=x===0||y===0||x===GW-1||y===GH-1||!m[k-1]||!m[k+1]||!m[k-GW]||!m[k+GW],p=k*4;D[p]=edge?10:40;D[p+1]=edge?90:150;D[p+2]=edge?220:255;D[p+3]=edge?235:70;}cx.putImageData(im,0,0);BKU.cv=cv;BKU.cvV=BK.v;}
    c.save();c.imageSmoothingEnabled=false;c.drawImage(BKU.cv,VW.ox,VW.oy,GW*s,GH*s);c.restore();}
  var Dr=BKU.drag;c.save();c.strokeStyle='#0a5ad8';c.lineWidth=1.5;c.setLineDash([6,4]);
  if(Dr&&ED.tool==='blk'&&!BKU.paste){var a=w2s(Dr.x0,Dr.y0),b=w2s(Dr.x,Dr.y);if(BKU.sel==='rect'){c.strokeRect(Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));}else if(BKU.sel==='circle'){c.beginPath();c.arc(a[0],a[1],dist(a[0],a[1],b[0],b[1]),0,2*PI);c.stroke();}
    else if(BKU.sel==='lasso'){c.beginPath();for(var i=0;i<Dr.pts.length;i+=2){var q=w2s(Dr.pts[i],Dr.pts[i+1]);if(i)c.lineTo(q[0],q[1]);else c.moveTo(q[0],q[1]);}c.lineTo(b[0],b[1]);c.stroke();}}
  var H=VW.hover;if(H&&ED.tool==='stamp'){var p=w2s(H.wx,H.wy);c.beginPath();c.arc(p[0],p[1],BKU.R/MP.cs*s,0,2*PI);c.stroke();}
  if(H&&BKU.paste&&BK.clip){var C=BK.clip,odd=((BKU.rot%4)+4)%4%2,w=(odd?C.h:C.w)*s,h=(odd?C.w:C.h)*s,p2=w2s(H.wx,H.wy);c.strokeStyle='#d86a0a';c.strokeRect(p2[0]-w/2,p2[1]-h/2,w,h);}c.restore();}
(function(){var b=drawTop;drawTop=function(){b();if(!bkTool())return;try{var c=VW.ct.getContext('2d');c.setTransform(VW.dpr,0,0,VW.dpr,0,0);bkOverlay(c);}catch(e){if(window.console)console.warn('bk',e);}};})();
HELP14.push('<h4>區塊地形編修與地形印章</h4><ul>'+
  '<li>地圖編修頁的「區塊編修」不必一格一格塗抹：拖曳選取<b>矩形、圓形或套索</b>（任意形狀）範圍，或點一下以<b>魔術棒</b>選取相連的同類地表（例如整片森林、整座湖）；Shift 加選、Alt 減選，也可以全選、反選。</li>'+
  '<li>對選取的整塊範圍套用：<b>地表</b>（任一種，邊界約三格自然不規則）；<b>地景範本</b>：森林（林間空地、灌叢）、針葉林、熱帶雨林、農田（樹籬、果園、零星村落）、草原、沼澤（水塘）、沙漠、雪原、焦土、廢墟、湖泊（低於周圍地面、移除道路）、市鎮與城市（自動產生街道與幹道、接上最近的公路並新增聚落與地名）；'+
    '<b>地勢</b>：抬升、降低、整平、設定高度、平滑、起伏化、山丘、山嶺（稜線露出岩地，極高處積雪），邊緣漸變可調；<b>清除</b>道路、鐵路、工事或溪流；<b>複製貼上</b>整塊地形（可旋轉 90°、左右翻轉，高度可以貼合地面）。</li>'+
  '<li>「地形印章」點一下就在該處產生自然形狀的山丘、山嶺、湖泊、森林、沼澤、農田、村莊、市鎮或彈坑區，大小與高度可調。每次操作都可以「復原」（Ctrl+Z），最多保留 30 步。</li></ul>');
