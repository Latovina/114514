/* ===================== 視覺化編制編輯器（編制圖）：北約符號方塊與指揮線、拖曳改隸屬、雙擊改名、就地新增、複製、刪除；
   編制檔匯出（整方或單一編制，含自訂類型、武器與圖片）與匯入（任一方、重新編號） ===================== */
var OC={depth:2,open:{},z:1,pd:null,drag:null,just:0};
(function(){try{var o=JSON.parse(localStorage.getItem('lato-warsim-oc')||'null');if(o){if(o.view==='chart')OB.view='chart';if(o.z)OC.z=clamp(+o.z,0.5,1.6);if(o.depth!==undefined)OC.depth=clamp(+o.depth,1,9);}}catch(e){}})();
function ocSave(){try{localStorage.setItem('lato-warsim-oc',JSON.stringify({view:OB.view||'tree',z:OC.z,depth:OC.depth}));}catch(e){}}
/* 頁首：切換「樹狀清單／編制圖」，匯出、匯入 */
(function(){var b=PAGES.orbat;PAGES.orbat=function(host){b(host);var ph=host.querySelector('.lw-pane .lw-ph');if(!ph)return;var d=document.createElement('span');d.className='lw-obv';
  d.innerHTML='<button type="button" class="lw-btn sm'+(OB.view==='chart'?'':' pri')+'" data-a="obview" data-v="tree" title="樹狀清單">☰ 清單</button><button type="button" class="lw-btn sm'+(OB.view==='chart'?' pri':'')+'" data-a="obview" data-v="chart" title="視覺化編制圖：拖曳方塊改隸屬、雙擊名稱改名">▦ 編制圖</button>'+
    '<button type="button" class="lw-btn sm" data-a="orbexp" title="把整方或選取的編制存成編制檔">⇩ 匯出</button><label class="lw-btn sm" title="讀入編制檔，加入任一方">⇧ 匯入<input type="file" accept=".json,application/json" data-c="orbfile" hidden></label>';
  var sp=ph.querySelector('.lw-sp');ph.insertBefore(d,sp||null);ocLayout(host);};})();
function ocLayout(host){var W=(host||UI.body).querySelector('.lw-work');if(W)W.style.gridTemplateColumns=OB.view==='chart'?'minmax(0,1.9fr) minmax(300px,1fr)':'minmax(0,1fr) minmax(0,1.15fr)';}
ACT.obview=function(b){OB.view=b.getAttribute('data-v')==='chart'?'chart':'tree';ocSave();show('orbat');};
/* 編制圖：取代樹狀清單的位置（上方的陣營設定、增加單位按鈕照舊） */
(function(){var b=obTree;obTree=function(){b();if(OB.view!=='chart')return;var el=UI.body&&UI.body.querySelector('[data-k="obtree"]');if(!el||!G)return;var T=el.querySelector('.lw-tree');if(!T)return;
  var sc=el.querySelector('.lw-obc'),sx=sc?sc.scrollLeft:null,sy=sc?sc.scrollTop:null;var d=document.createElement('div');d.innerHTML=ocToolsHtml()+'<div class="lw-obc" data-k="obc"><div class="oc-z" style="zoom:'+OC.z+'">'+ocHtml(OB.side)+'</div></div>';T.parentNode.replaceChild(d,T);
  var C=d.querySelector('.lw-obc');if(sx!==null){C.scrollLeft=sx;C.scrollTop=sy;}else ocCenter(C);ocWire(C);};})();
function ocToolsHtml(){return '<div class="lw-row lw-obct"><span class="lw-note">展開到</span>'+[[1,'1 層'],[2,'2 層'],[3,'3 層'],[9,'全部']].map(function(q){return '<button type="button" class="lw-btn sm'+(OC.depth===q[0]?' pri':'')+'" data-a="ocdep" data-v="'+q[0]+'">'+q[1]+'</button>';}).join('')+
  '<span class="lw-sp"></span><button type="button" class="lw-btn sm" data-a="ocz" data-v="-1" title="縮小">－</button><span class="lw-note" style="min-width:3.2em;text-align:center">'+Math.round(OC.z*100)+'%</span><button type="button" class="lw-btn sm" data-a="ocz" data-v="1" title="放大">＋</button></div>'+
  '<div class="lw-note">拖曳方塊到另一個編制上即改隸屬；拖到上方虛線框成為最上層。雙擊名稱可改名；選取後可用方塊下方的按鈕新增、複製、刪除。</div>';}
ACT.ocdep=function(b){OC.depth=+b.getAttribute('data-v');OC.open={};ocSave();obTree();};
ACT.ocz=function(b){OC.z=clamp(Math.round((OC.z+(+b.getAttribute('data-v'))*0.15)*100)/100,0.5,1.6);ocSave();obTree();};
function ocIsOpen(u,dep){var o=OC.open[u.id];return o===undefined?dep<OC.depth:o;}
function ocRoots(side){return G.units.filter(function(u){return u.side===side&&(u.p<0||!uById(u.p));});}
function ocCard(u,dep,small){var sm=strengthOf(u),fr=sm.men0>0?sm.men/sm.men0:1,kids=kidsOf(u),leaf=isLeaf(u),open=ocIsOpen(u,dep),sel=OB.sel===u.id,e=ECH[clamp(dispEch(u),0,7)],cls='oc-c'+(leaf?' oc-l':'')+(sel?' sel':'')+(u.st==='dead'?' dead':'')+(u.st==='off'?' off':'')+(small?' sm':'');
  var tip=(u.name||'')+'\n'+(leaf?mixName(u):e[1]+'（'+sm.n+' 個單位）')+'\n'+fmt(sm.men)+'／'+fmt(sm.men0)+' 人'+(u.off&&u.off.name?'\n指揮官：'+(u.off.rank?u.off.rank:'')+u.off.name:'');
  var o='<div class="'+cls+'" data-oc="'+u.id+'" data-a="ocsel" title="'+esc(tip)+'" style="--oc:'+esc(sideCol(u.side))+'">'+(small?'':'<div class="oc-e">'+esc(e[2])+'</div>')+'<div class="oc-r">'+uIco(u)+'<span class="oc-nm" data-ocn="'+u.id+'">'+esc(u.name||'（未命名）')+'</span></div>'+
    '<div class="oc-s"><i style="width:'+Math.round(clamp(fr,0,1)*100)+'%;background:'+(fr>0.7?'#43A047':fr>0.4?'#F9A825':'#E53935')+'"></i></div><div class="oc-m">'+(u.st==='dead'?'✝ ':u.st==='off'?'⏳ ':'')+(leaf?'':e[1]+'・')+fmt(sm.men)+' 人</div>'+
    (kids.length?'<span class="oc-tg" data-a="octog" data-v="'+u.id+'" title="'+(open?'收合':'展開')+'">'+(open?'−':'＋'+kids.length)+'</span>':'');
  if(sel)o+='<div class="oc-act">'+(leaf?'':'<button type="button" data-a="ocadd" data-v="leaf" title="在這個編制之下加入單位">＋單位</button><button type="button" data-a="ocadd" data-v="form" title="在這個編制之下加入編制（司令部）">＋編制</button><button type="button" data-a="ocadd" data-v="preset" title="在這個編制之下加入範本">＋範本</button>')+'<button type="button" data-a="odup" title="複製（含下級）">複製</button><button type="button" data-a="ocren" title="改名">改名</button><button type="button" class="dng" data-a="odel" title="刪除（含下級）">刪除</button></div>';
  return o+'</div>';}
/* 下級：四個以上全是末端單位時直排；編制與三個以上的直屬末端單位混合時，直屬單位排成一欄放在最前面（與一般編制表相同），圖不會太寬 */
function ocNode(u,dep){var kids=kidsOf(u),open=ocIsOpen(u,dep),o='<li>'+ocCard(u,dep,false);if(kids.length&&open){var lv=kids.filter(isLeaf),fm=kids.filter(function(k){return !isLeaf(k);}),col=function(L){return '<div class="oc-col">'+L.map(function(k){return ocCard(k,dep+1,true);}).join('')+'</div>';};
    if(!fm.length&&lv.length>=4)o+='<ul class="oc-v"><li>'+col(lv)+'</li></ul>';
    else if(fm.length&&lv.length>=3)o+='<ul><li class="oc-sl">'+col(lv)+'</li>'+fm.map(function(k){return ocNode(k,dep+1);}).join('')+'</ul>';
    else o+='<ul>'+kids.map(function(k){return ocNode(k,dep+1);}).join('')+'</ul>';}return o+'</li>';}
function ocHtml(side){var R=ocRoots(side);var o='<div class="oc-top" data-octop="1">拖到這裡：成為最上層</div>';if(!R.length)return o+'<div class="lw-note" style="padding:12px">尚無部隊。用上方按鈕加入範本或單位，或匯入編制檔。</div>';
  return o+'<div class="oc-w">'+R.map(function(u){return '<ul class="oc">'+ocNode(u,0)+'</ul>';}).join('')+'</div>';}
function ocCenter(C){var s=C.querySelector('.oc-c.sel')||C.querySelector('.oc-w>ul>li>.oc-c');if(s){var r=s.getBoundingClientRect(),c=C.getBoundingClientRect();C.scrollLeft+=r.left-c.left-c.width/2+r.width/2;C.scrollTop+=r.top-c.top-c.height/3;}else{C.scrollLeft=Math.max(0,(C.scrollWidth-C.clientWidth)/2);}}
ACT.ocsel=function(b){if(Date.now()-OC.just<300)return;var id=+b.getAttribute('data-oc');if(OB.sel===id)return;ocSelect(id);};
/* 選取只更新兩個方塊（不重畫整張圖），捲動位置不變，也讓雙擊改名能接著作用 */
function ocSelect(id){var C=UI.body.querySelector('.lw-obc'),u=uById(id);OB.sel=id;if(!C||!u){obTree();obDet();return;}C.querySelectorAll('.oc-c.sel').forEach(function(x){x.classList.remove('sel');var a=x.querySelector('.oc-act');if(a)a.remove();});
  var el=C.querySelector('[data-oc="'+id+'"]');if(el){var t=document.createElement('div');t.innerHTML=ocCard(u,ancestors(u).length,el.classList.contains('sm'));var nw=t.firstChild;el.parentNode.replaceChild(nw,el);}obDet();}
ACT.octog=function(b,e){if(e)e.stopPropagation();var id=+b.getAttribute('data-v'),u=uById(id);if(!u)return;var dep=ancestors(u).length;OC.open[id]=!ocIsOpen(u,dep);obTree();};
ACT.ocadd=function(b){var u=uById(OB.sel);if(!u||isLeaf(u))return;OB.addMode=b.getAttribute('data-v');obAddBox();var P=UI.body.querySelector('[data-k="apar"]');if(P)P.value=String(u.id);var bx=UI.body.querySelector('[data-k="obaddbox"]');if(bx&&bx.scrollIntoView)bx.scrollIntoView({block:'nearest'});};
ACT.ocren=function(){var u=uById(OB.sel);if(!u)return;var n=UI.body.querySelector('[data-ocn="'+u.id+'"]');if(n)ocRename(n,u);};
/* 就地改名：名稱換成輸入框，Enter 或離開即存檔，Esc 取消 */
function ocRename(n,u){if(n.querySelector('input'))return;var inp=document.createElement('input');inp.type='text';inp.value=u.name||'';inp.className='oc-in';n.textContent='';n.appendChild(inp);inp.focus();inp.select();var done=false;
  var fin=function(save){if(done)return;done=true;if(save){var v=inp.value.trim();if(v&&v!==u.name){u.name=v.slice(0,80);if(u.nmLock===undefined)u.nmLock=true;dupNames();}}obTree();obDet();};
  inp.addEventListener('keydown',function(e){e.stopPropagation();if(e.key==='Enter'){e.preventDefault();fin(true);}else if(e.key==='Escape'){e.preventDefault();fin(false);}});inp.addEventListener('blur',function(){fin(true);});inp.addEventListener('click',function(e){e.stopPropagation();});inp.addEventListener('pointerdown',function(e){e.stopPropagation();});}
/* 拖曳改隸屬（滑鼠與觸控都適用）：按住方塊移動超過 6 像素開始拖曳，放開時落在哪個編制上就改到它之下 */
function ocValid(u,tid){if(!u)return false;if(tid===-1)return u.p>=0;var t=uById(tid);if(!t||isLeaf(t)||t.id===u.id||t.id===u.p)return false;return !ancestors(t).some(function(a){return a.id===u.id;});}
function ocTarget(x,y){var el=document.elementFromPoint(x,y);if(!el)return null;if(el.closest('[data-octop]'))return -1;var c=el.closest('[data-oc]');return c?+c.getAttribute('data-oc'):null;}
function ocWire(C){C.addEventListener('dblclick',function(e){var n=e.target.closest('[data-ocn]');if(!n)return;var u=uById(+n.getAttribute('data-ocn'));if(u){OB.sel=u.id;ocRename(n,u);}});
  C.addEventListener('pointerdown',function(e){if(e.button!==0||e.target.closest('button,input,.oc-tg,.oc-act'))return;var c=e.target.closest('[data-oc]');if(!c)return;OC.pd={id:+c.getAttribute('data-oc'),x:e.clientX,y:e.clientY,pid:e.pointerId,el:c};});
  C.addEventListener('pointermove',function(e){var P=OC.pd;if(!P||e.pointerId!==P.pid)return;if(!OC.drag){if(Math.abs(e.clientX-P.x)+Math.abs(e.clientY-P.y)<7)return;var u=uById(P.id);if(!u){OC.pd=null;return;}
      var g=document.createElement('div');g.className='oc-ghost';g.textContent=(isLeaf(u)?'':ECH[clamp(u.ech,0,7)][2]+' ')+(u.name||'');root.appendChild(g);OC.drag={u:u,g:g,t:null};P.el.classList.add('oc-src');C.classList.add('oc-dragging');try{C.setPointerCapture(e.pointerId);}catch(x){}}
    var D=OC.drag;D.g.style.left=(e.clientX+12)+'px';D.g.style.top=(e.clientY+10)+'px';D.g.style.display='none';var t=ocTarget(e.clientX,e.clientY);D.g.style.display='';
    C.querySelectorAll('.oc-drop,.oc-nodrop').forEach(function(x){x.classList.remove('oc-drop','oc-nodrop');});D.t=null;if(t!==null&&t!==D.u.id){var ok=ocValid(D.u,t),el=t===-1?C.querySelector('[data-octop]'):C.querySelector('[data-oc="'+t+'"]');if(el)el.classList.add(ok?'oc-drop':'oc-nodrop');if(ok)D.t=t;}
    /* 拖到邊緣時自動捲動 */var r=C.getBoundingClientRect(),m=36;if(e.clientX<r.left+m)C.scrollLeft-=14;else if(e.clientX>r.right-m)C.scrollLeft+=14;if(e.clientY<r.top+m)C.scrollTop-=14;else if(e.clientY>r.bottom-m)C.scrollTop+=14;e.preventDefault();});
  var end=function(e){var P=OC.pd;OC.pd=null;var D=OC.drag;if(!D)return;OC.drag=null;OC.just=Date.now();D.g.remove();C.classList.remove('oc-dragging');try{C.releasePointerCapture(e.pointerId);}catch(x){}
    if(e.type==='pointerup'&&D.t!==null)ocMove(D.u,D.t);else obTree();void P;};
  C.addEventListener('pointerup',end);C.addEventListener('pointercancel',end);}
function ocMove(u,tid){var t=tid>=0?uById(tid):null;if(!reparent(u,tid)){toast('不能把單位移到它自己的下級。');obTree();return;}if(t)OC.open[t.id]=true;dupNames();OB.sel=u.id;obTree();obDet();
  toast('「'+(u.name||'')+'」改隸屬'+(t?'「'+(t.name||'')+'」':'最上層')+(G.started?'（命令會沿新的指揮鏈傳遞）':''),2600);}
/* ---------- 匯出 ---------- */
ACT.orbexp=function(){var S=G.sides[OB.side],u=OB.sel?uById(OB.sel):null,canSel=u&&u.side===OB.side,n=G.units.filter(function(x){return x.side===OB.side&&!(isLeaf(x)&&x.st==='dead');}).length;
  var o='<h3>匯出編制檔</h3><div class="lw-opt"><span>範圍</span><span><label><input type="radio" name="oxr" value="side" checked> 整個「'+esc(S.name)+'」（'+n+' 個單位）</label><br><label'+(canSel?'':' style="opacity:.5"')+'><input type="radio" name="oxr" value="sel"'+(canSel?'':' disabled')+'> 選取的「'+esc(canSel?u.name:'（未選取）')+'」及其下級'+(canSel?'（'+orbCollect(OB.side,[u.id]).length+' 個單位）':'')+'</label></span>'+
    '<span>狀態</span><label><input type="checkbox" data-k="oxst"'+(G.started?' checked':'')+'> 包含目前的兵力與士氣（作戰中的損耗）</label></div>'+
    '<div class="lw-note">編制檔包含：編制結構、單位組成、名稱與稱號、指揮官、AI 個性與態度、熟練度、經驗、單位武器，以及用到的自訂單位類型、自訂武器與圖片。位置、命令、補給存量與增援時程不會匯出。</div>'+
    '<div class="lw-row"><button type="button" class="lw-btn pri" data-a="orbexpgo">下載編制檔</button><button type="button" class="lw-btn" data-a="x">取消</button></div>';UI.oxd&&UI.oxd.remove();UI.oxd=dlg(o);};
ACT.orbexpgo=function(){var d=UI.oxd;if(!d)return;var r=d.querySelector('input[name="oxr"]:checked'),sel=r&&r.value==='sel'&&OB.sel?[OB.sel]:null,st=!!d.querySelector('[data-k="oxst"]').checked;
  var D=orbExport(OB.side,sel,{state:st}),nm=(D.name||'編制').replace(/[\\\/:*?"<>|\s]+/g,'_').slice(0,40);download(nm+'.latoorbat.json',JSON.stringify(D),'application/json');d.remove();UI.oxd=null;
  toast('已匯出 '+D.units.length+' 個單位'+(Object.keys(D.types).length?'、'+Object.keys(D.types).length+' 種自訂類型':'')+(Object.keys(D.wpns).length?'、'+Object.keys(D.wpns).length+' 種自訂武器':'')+(Object.keys(D.imgs).length?'、'+Object.keys(D.imgs).length+' 張圖片':''),3500);};
/* ---------- 匯入 ---------- */
CHG.orbfile=function(t){var f=t.files&&t.files[0];t.value='';if(!f)return;if(f.size>60e6){toast('檔案太大。');return;}var rd=new FileReader();rd.onload=function(){var D=null;try{D=JSON.parse(rd.result);}catch(e){toast('讀不懂這個檔案（不是 JSON）。');return;}var err=orbCheck(D);if(err){toast(err,4000);return;}orbImpDlg(D,f.name);};rd.readAsText(f);};
function orbImpDlg(D,fname){UI.oxD=D;var nT=Object.keys(D.types||{}).length,nW=Object.keys(D.wpns||{}).length,nI=Object.keys(D.imgs||{}).length,lv=D.units.filter(function(o){return o.mix;}).length,from=D.from||{};
  var tgt=OB.side,u=OB.sel?uById(OB.sel):null,canUnder=function(s){return u&&u.side===s&&!isLeaf(u);};
  var o='<h3>匯入編制檔</h3><div class="lw-kv"><span>檔案</span><span>'+esc(fname||'')+'</span><span>內容</span><span>「'+esc(D.name||'')+'」：'+D.units.length+' 個單位（'+lv+' 個末端單位）'+(nT?'、'+nT+' 種自訂類型':'')+(nW?'、'+nW+' 種自訂武器':'')+(nI?'、'+nI+' 張圖片':'')+(D.state?'；含作戰中的兵力狀態':'')+'</span>'+(from.side?'<span>來源</span><span>'+esc(from.map||'')+'・'+esc(from.side)+(D.year?'（'+D.year+' 年）':'')+'</span>':'')+'</div>'+
    '<div class="lw-opt"><span>加入</span><select data-k="oxs">'+SIDES().map(function(s){return '<option value="'+s+'"'+(s===tgt?' selected':'')+'>'+esc(G.sides[s].name)+'</option>';}).join('')+'</select>'+
    '<span>位置</span><span data-k="oxpos">'+orbPosHtml(tgt)+'</span></div>'+
    '<div class="lw-note">單位會重新編號；與現有相同的自訂類型、武器會共用，代號衝突時另立新代號，不會覆蓋這場作戰原有的設定。'+(G.started?'<b>作戰進行中：匯入的部隊會成為 10 分鐘後從本方後方進場的增援。</b>':'匯入後可在部署頁擺放位置。')+'</div>'+
    '<div class="lw-row"><button type="button" class="lw-btn pri" data-a="orbimpgo">匯入</button><button type="button" class="lw-btn" data-a="x">取消</button></div>';UI.oxd&&UI.oxd.remove();UI.oxd=dlg(o);
  var sel=UI.oxd.querySelector('[data-k="oxs"]');sel.addEventListener('change',function(){UI.oxd.querySelector('[data-k="oxpos"]').innerHTML=orbPosHtml(+sel.value);});void canUnder;}
function orbPosHtml(s){var u=OB.sel?uById(OB.sel):null,under=u&&u.side===s&&!isLeaf(u);return (under?'<label><input type="radio" name="oxp" value="under" checked> 選取的「'+esc(u.name)+'」之下</label><br>':'')+'<label><input type="radio" name="oxp" value="top"'+(under?'':' checked')+'> 最上層</label>'+(G.started?'':'<br><label><input type="radio" name="oxp" value="replace"> 取代「'+esc(G.sides[s].name)+'」現有的全部部隊</label>');}
ACT.orbimpgo=function(){var d=UI.oxd,D=UI.oxD;if(!d||!D)return;var s=+d.querySelector('[data-k="oxs"]').value,p=d.querySelector('input[name="oxp"]:checked'),pos=p?p.value:'top';
  if(pos==='replace'&&!confirm('刪除「'+G.sides[s].name+'」現有的全部部隊，改用檔案裡的編制？'))return;var R;
  try{R=orbImport(D,s,pos==='under'?OB.sel:-1,{replace:pos==='replace'});}catch(e){toast('匯入失敗：'+e.message,4500);return;}
  d.remove();UI.oxd=null;UI.oxD=null;ICOC={};if(typeof SPC!=='undefined'){SPC.m={};SPC.n=0;}OB.side=s;OB.sel=R.roots.length?R.roots[0].id:0;if(R.roots[0])OC.open[R.roots[0].id]=true;
  show('orbat');toast('已匯入 '+R.made.length+' 個單位'+(R.types?'、新增 '+R.types+' 種自訂類型':'')+(R.wpns?'、新增 '+R.wpns+' 種自訂武器':'')+(R.warn.length?'。注意：'+R.warn.slice(0,3).join('；'):''),R.warn.length?6000:3500);};
var V13HELP='<h4>效能、簡易圖形模式、視覺化編制編輯器與編制檔</h4><ul>'+
  '<li><b>減少卡頓</b>：尋路的通行係數分成「與天候無關的底稿」與「泥濘、積雪係數」，泥濘變化只需一次乘法；工事、彈坑、斷橋、新路等地形變動只重算變動的格子；粗網格直接由成本陣列加總。已知敵情、司令部警戒、恐懼來源、砲兵避免誤擊都改用空間分桶查詢；每一步只整理一次最上層單位、下屬清單與電子戰單位。大規模會戰（雙方各一個集團軍，共約 1,400 個單位、16 萬人）激戰階段每一步模擬的平均耗時約為原本的四成，最慢的幾步縮短到約四分之一。</li>'+
  '<li><b>畫面</b>：部隊符號先畫成小圖快取，之後每格只貼圖；畫面變慢時自動減少爆炸、煙霧、曳光的數量（設定頁可關閉）；依繪圖耗時放寬重繪頻率。</li>'+
  '<li><b>簡易圖形模式</b>：頂列「▣」按鈕或設定頁切換。平面地圖（不畫陰影、紋理、等高線）、部隊畫成實心方塊（陸）、圓（空）、菱形（海），外框顏色表示士氣，兵力低於七成時下方出現短條；關閉戰場特效、只標城市與鎮。只影響畫面，不改變戰局。</li>'+
  '<li><b>視覺化編制圖</b>：編制頁按「▦ 編制圖」。每個方塊有兵種符號、梯隊記號、名稱、兵力條與人數；按「＋／－」展開或收合，或用「展開到 1／2／3 層／全部」。<b>拖曳</b>方塊到另一個編制上就改隸屬（拖到上方虛線框成為最上層，不能拖到自己的下級）；<b>雙擊名稱</b>改名；選取後方塊下方有「＋單位、＋編制、＋範本、複製、改名、刪除」。四個以上的末端單位會直排以節省寬度。右側照常顯示詳細資料。</li>'+
  '<li><b>編制檔匯出</b>：編制頁「⇩ 匯出」，可選整方或選取的編制（含全部下級），可選是否包含作戰中的兵力與士氣。檔案（.latoorbat.json）包含編制結構、組成、名稱與稱號、指揮官、AI 個性與態度、熟練度、經驗、單位武器，以及用到的自訂類型、自訂武器與圖片（相同圖片只存一份）；位置、命令、補給存量與增援時程不匯出。</li>'+
  '<li><b>編制檔匯入</b>：「⇧ 匯入」選檔後，選擇加入哪一方、放在選取的編制之下或最上層；開戰前也可取代該方全部部隊。單位重新編號；相同的自訂類型與武器會共用，代號衝突時另立新代號，不會覆蓋原有設定；格式不符、循環的編制、不安全的圖片會被拒絕或略過。作戰中匯入的部隊成為 10 分鐘後從後方進場的增援。</li></ul>';
/* 編制圖模式：新增單位的表單平時收起（讓出空間給圖），按「＋範本／＋單位／＋編制」或方塊上的＋按鈕才展開，加入後自動收起 */
(function(){var b=obAddBox;obAddBox=function(){var el=UI.body&&UI.body.querySelector('[data-k="obaddbox"]');if(OB.view==='chart'&&!OB.addOpen){if(el)el.innerHTML='';return;}b();if(OB.view==='chart'&&el&&el.firstChild){var r=document.createElement('div');r.className='lw-row';r.style.margin='4px 0 0';r.innerHTML='<button type="button" class="lw-btn sm" data-a="obaddx">收起</button>';el.firstChild.appendChild(r);}};})();
(function(){var b=ACT.obadd;ACT.obadd=function(x,e){OB.addOpen=true;b(x,e);};})();
(function(){var b=ACT.obdoadd;ACT.obdoadd=function(x,e){if(OB.view==='chart')OB.addOpen=false;b(x,e);};})();
(function(){var b=ACT.ocadd;ACT.ocadd=function(x,e){OB.addOpen=true;b(x,e);};})();
ACT.obaddx=function(){OB.addOpen=false;obAddBox();};
