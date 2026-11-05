/* ===================== 戰役：編輯器（大地圖、地點、兵力與人物、作戰與劇情）與進行戰役 =====================
   大地圖一次產生（或匯入作戰地圖檔），先算好各聚落的建築、有無人居住、經過的道路與鐵路；每場作戰是大地圖上的一塊區域，開打時才依大地圖產生細部的區域地圖。
   戰役檔（.latocampaign.json）：大地圖的參數（匯入或由世界地圖產生的地圖整份附上）、地點的修改、雙方的核心兵力、人物、各場作戰（區域、日期、兵力、目標、劇情事件、簡報、講評與勝負分支）。
   進行中的戰役跟著作戰存檔（G.cmp.camp、G.cmp.prog），讀取存檔後可以繼續下一場。 ===================== */
if(typeof GKEYS!=='undefined')GKEYS.push('cmp');
var CMPE={c:null,BM:null,bk:'',img:null,tab:'big',sel:0,pick:null,busy:false,plq:'',plAll:false,hiPl:-1,prev:{},P:null,Pk:'',L:null,F:null,dirty:0};
var CMPU={k:null,shown:{},q:[],resShown:false,box:null};
var CMPTABS=[['big','戰役與大地圖'],['pl','地點'],['force','兵力與人物'],['ops','作戰與劇情'],['play','進行戰役']];
var CMPEDGE=[['W','西'],['E','東'],['N','北'],['S','南']];
var CMPGRAN=[['co','連'],['bn','營'],['rgt','團']];
function cmpClone(o){return JSON.parse(JSON.stringify(o));}
function cmpId(L,p){var n=1;while(L.some(function(q){return q.id===p+n;}))n++;return p+n;}
function cmpEl(k){return UI.body?UI.body.querySelector('[data-k="'+k+'"]'):null;}
function cmpTxt(t){return esc(String(t||'')).replace(/\n/g,'<br>');}
/* ---------- 新戰役：兵力依年代帶入最接近的快速想定 ---------- */
function cmpScnFor(y){var b=null;(typeof SCN!=='undefined'?SCN:[]).forEach(function(s){if(!/^s\d{4}$/.test(s.k)||!s.A||!s.B)return;if(!b||Math.abs(s.y-y)<Math.abs(b.y-y))b=s;});return b;}
function cmpForcesOf(sc,s){return ((s?sc.B:sc.A)||[]).filter(function(p){return FPI[p[0]]||UT[p[0]];}).map(function(p,j){return {id:'f'+(s?'b':'a')+(j+1),k:p[0],n:p[1]||1,name:p[2]||'',gran:p[4]||sc.gran||'co'};});}
function cmpNew(y){y=y||1944;var sc=cmpScnFor(y);return cmpNorm({format:'LatoCampaign',v:1,name:'新戰役',desc:'',seed:'c'+Math.floor(Math.random()*1e9).toString(36),y:y,m:6,d:6,h:5,nst:'zh',
  sides:[{name:'藍軍',color:'#2B6CD4',ai:false},{name:'紅軍',color:'#D23B3B',ai:true}],big:{src:'proc',ter:'mixed',clim:'temperate',lat:48,W:80,H:60,cs:500,dens:1,dev:'auto',rail:true,hsr:true,front:{dir:'WE',f:0.5}},
  places:{},chars:[],forces:sc?[cmpForcesOf(sc,0),cmpForcesOf(sc,1)]:[[],[]],ops:[],fin:{'0':'','1':'',d:''}});}
/* 補齊欄位（匯入舊版或手寫的戰役檔） */
function cmpNorm(C){var D={name:'戰役',desc:'',seed:'c1',y:1944,m:6,d:6,h:5,nst:'zh'};Object.keys(D).forEach(function(k){if(C[k]===undefined||C[k]===null)C[k]=D[k];});C.format='LatoCampaign';C.v=1;
  C.sides=C.sides||[];[0,1].forEach(function(s){var N=newSide(s);C.sides[s]=Object.assign({name:N.name,color:N.color,ai:N.ai},C.sides[s]||{});});
  C.big=Object.assign({src:'proc',ter:'mixed',clim:'temperate',lat:48,W:80,H:60,cs:500,dens:1,dev:'auto',rail:true,hsr:true},C.big||{});C.big.front=Object.assign({dir:'WE',f:0.5},C.big.front||{});
  C.places=C.places||{};C.chars=(C.chars||[]).filter(Boolean);C.forces=C.forces||[[],[]];[0,1].forEach(function(s){C.forces[s]=(C.forces[s]||[]).filter(function(f){return f&&f.k;});C.forces[s].forEach(function(f,j){if(!f.id)f.id='f'+(s?'b':'a')+(j+1);});});
  C.fin=Object.assign({'0':'','1':'',d:''},C.fin||{});C.ops=(C.ops||[]).filter(Boolean);C.ops.forEach(function(op,i){if(!op.id)op.id=cmpId(C.ops,'op');cmpOpNorm(C,op);});return C;}
function cmpOpNorm(C,op){var D={name:'作戰',x:0,y:0,w:20,h:15,cs:50,gap:1,dur:24,nobj:2,brief:''};Object.keys(D).forEach(function(k){if(op[k]===undefined||op[k]===null)op[k]=D[k];});
  op.edge=op.edge||cmpEdges(C);op.sides=op.sides||[{},{}];[0,1].forEach(function(s){var S=op.sides[s]=op.sides[s]||{};if(!S.use)S.use=C.forces[s].map(function(f){return f.id;});S.add=(S.add||[]).filter(function(f){return f&&f.k;});});
  op.obj=op.obj||[];op.ev=op.ev||[];op.ev.forEach(function(e){if(!e.id)e.id=cmpId(op.ev,'e');e.tr=e.tr||{k:'start'};e.act=e.act||[];});op.deb=Object.assign({'0':'','1':'',d:''},op.deb||{});op.next=Object.assign({'0':'','1':'',d:''},op.next||{});return op;}
function cmpEdges(C){var d=((C.big||{}).front||{}).dir||'WE';return d==='WE'?['W','E']:d==='EW'?['E','W']:d==='NS'?['N','S']:['S','N'];}
/* ---------- 草稿：自動存在瀏覽器（匯入的大地圖太大就不存） ---------- */
function cmpSave(){CMPE.dirty=1;clearTimeout(CMPE.st);CMPE.st=setTimeout(function(){try{var C=CMPE.c,s=JSON.stringify(C);if(s.length>3e6){var o=Object.assign({},C);delete o.BMp;s=JSON.stringify(o);}localStorage.setItem('lw-cmp-draft',s);}catch(e){}},600);}
function cmpEnsure(){if(CMPE.c)return;try{var s=localStorage.getItem('lw-cmp-draft');if(s){var C=JSON.parse(s);if(C&&C.format==='LatoCampaign'){CMPE.c=cmpNorm(C);return;}}}catch(e){}CMPE.c=cmpNew();}
/* ---------- 分頁：沒有作戰時也能開啟（獨立的編制編輯器不顯示） ---------- */
if(typeof EDONLY==='undefined'){TABS.splice(1,0,['cmp','戰役']);if(typeof TABI!=='undefined')TABI.cmp='📜';
  (function(){var b=tabsRender;tabsRender=function(){b.apply(this,arguments);var e=UI.tabs&&UI.tabs.querySelector('[data-a="tab"][data-v="cmp"]');if(e)e.disabled=false;};})();
  (function(){var b=show;show=function(tab){if(tab!=='cmp'||G)return b.apply(this,arguments);if(UI.tab!==tab&&UI.onLeave){UI.onLeave();UI.onLeave=null;}UI.tab='cmp';UI.onClick=UI.onPlace=UI.onLine=UI.onPaint=UI.onPaintEnd=UI.onDragUnit=UI.onRight=UI.onSel=null;UI.canDrag=null;UI.tool='sel';tabsRender();UI.body.innerHTML='';PAGES.cmp(UI.body);};})();}
/* ---------- 大地圖：產生、匯入、快取 ---------- */
function cmpBigKey(C){return C.seed+'|'+C.y+'|'+C.nst+'|'+JSON.stringify(Object.assign({},C.big,{front:0}))+'|'+(C.BMp?(C.BMp.seed||'')+'|'+C.BMp.GW+'x'+C.BMp.GH+'|'+(C.BMp.name||''):'');}
function cmpPg(){return async function(lbl,f){var el=cmpEl('cmpprog');if(el){el.hidden=false;el.firstChild.style.width=Math.round(clamp(f,0,1)*100)+'%';}var m=cmpEl('cmpmsg');if(m)m.textContent=lbl+'…';await new Promise(function(r){setTimeout(r,0);});};}
function cmpPgDone(msg){var el=cmpEl('cmpprog');if(el)el.hidden=true;var m=cmpEl('cmpmsg');if(m)m.textContent=msg||'';}
/* 大地圖格數上限：約每百萬格 100 MB 記憶體，太大會讓瀏覽器分頁崩潰 */
var CMPBIGMAX=4e6;function cmpBigCells(B){var cs=+B.cs||500;return Math.round(B.W*1000/cs)*Math.round(B.H*1000/cs);}
function cmpCellsTxt(B){return fmt(cmpBigCells(B))+' 格'+(cmpBigErr(B)?'<span class="lw-err">　格數過多（上限 '+fmt(CMPBIGMAX)+' 格）</span>':'');}
function cmpBigErr(B){var n=cmpBigCells(B);return n>CMPBIGMAX?'大地圖 '+fmt(n)+' 格，超過上限 '+fmt(CMPBIGMAX)+' 格；請縮小範圍或加大格子（約每百萬格需要 100 MB 記憶體）。':'';}
async function cmpBigGet(C,pg){var k=cmpBigKey(C);if(CMPE.BM&&CMPE.bk===k)return CMPE.BM;var BM;
  if(C.BMp)BM=await unpackMap(C.BMp);
  else{if(C.big.src!=='proc')throw new Error('請先匯入大地圖或改用程序產生。');if(cmpBigErr(C.big))throw new Error(cmpBigErr(C.big));BM=await cmpBigMake(Object.assign({},C.big,{seed:C.seed+'|big',y:C.y,nst:C.nst,name:(C.name||'戰役')+'・大地圖'}),pg||cmpPg());}
  cmpBigPrep(BM);CMPE.BM=BM;CMPE.bk=k;CMPE.img=null;CMPE.L=null;CMPE.F=null;CMPE.P=null;CMPE.prev={};return BM;}
function cmpBigStale(){var C=CMPE.c;return !CMPE.BM||CMPE.bk!==cmpBigKey(C);}
/* 地點（含改名、居住狀態）、地點之間的連結、建築 */
function cmpPL(){var C=CMPE.c,BM=CMPE.BM;if(!BM)return [];var k=CMPE.bk+'|'+JSON.stringify(C.places);if(!CMPE.P||CMPE.Pk!==k){CMPE.P=cmpPlaces(BM,C.places);CMPE.Pk=k;}return CMPE.P;}
function cmpLinksOf(){if(!CMPE.L&&CMPE.BM)CMPE.L=cmpLinks(CMPE.BM,cmpPL());return CMPE.L||[];}
function cmpFacsOf(){if(!CMPE.F&&CMPE.BM)CMPE.F=cmpFacs(CMPE.BM,CMPE.c.y,cmpPL());return CMPE.F||[];}
/* 地點由誰控制：戰役進度 → 地點設定 → 初始前線 */
function cmpOwnOf(C,BM,P,i,p){var a=P&&P.own?P.own[i]:undefined;if(a!==undefined)return a;var o=(C.places||{})[i];if(o&&o.own!==undefined&&o.own!=='')return +o.own;return cmpOwn0(C,BM,p);}
/* ---------- 繪製大地圖：地點（控制方的顏色）、初始前線、各場作戰的區域 ---------- */
function cmpBigImg(){var BM=CMPE.BM;if(!BM)return null;if(!CMPE.img){var S=clamp(Math.floor(860/Math.max(BM.GW,BM.GH*1.3)),1,6);CMPE.img=renderMap(BM,{S:S,month:CMPE.c.m||6,contour:false});}return CMPE.img;}
function cmpDrawBig(cv,C,P){var BM=CMPE.BM,img=cmpBigImg();if(!cv||!img)return;var W=img.cv.width,H=img.cv.height,k=img.S/BM.cs;cv.width=W;cv.height=H;var c=cv.getContext('2d');c.drawImage(img.cv,0,0);
  var F=C.big.front||{},f=F.f===undefined?0.5:+F.f;if(!P){c.save();c.setLineDash([8,6]);c.strokeStyle='rgba(120,20,20,.75)';c.lineWidth=2;c.beginPath();if(F.dir==='NS'||F.dir==='SN'){c.moveTo(0,H*f);c.lineTo(W,H*f);}else{c.moveTo(W*f,0);c.lineTo(W*f,H);}c.stroke();c.restore();}
  var PL=C===CMPE.c?cmpPL():cmpPlaces(BM,C.places),hist=P?P.hist||[]:[];
  /* 控制範圍：每塊地依最近的聚落（6 公里內）由誰控制淡淡著色，看得出前線（控制方沒變就沿用上次算好的圖層） */var own=PL.map(function(p,i){return cmpOwnOf(C,BM,P,i,p);}),tk=CMPE.bk+'|'+own.join('')+'|'+C.sides[0].color+C.sides[1].color+'|'+PL.length;
  if(!CMPE.tint||CMPE.tint.k!==tk||CMPE.tint.cv.width!==W){var tv=mkCanvas(W,H),tc=tv.getContext('2d'),st=Math.max(2,Math.ceil(BM.GW/120)),cs=BM.cs,S=img.S;
    for(var gy=0;gy<BM.GH;gy+=st)for(var gx=0;gx<BM.GW;gx+=st){var X=(gx+st/2)*cs,Y=(gy+st/2)*cs,b=-1,bd=36e6;for(var i=0;i<PL.length;i++){var dx=PL[i].x-X,dy=PL[i].y-Y,d=dx*dx+dy*dy;if(d<bd){bd=d;b=i;}}if(b<0||!C.sides[own[b]])continue;tc.fillStyle=C.sides[own[b]].color;tc.fillRect(gx*S,gy*S,st*S,st*S);}
    CMPE.tint={k:tk,cv:tv};}
  c.globalAlpha=0.15;c.drawImage(CMPE.tint.cv,0,0);c.globalAlpha=1;
  C.ops.forEach(function(op,i){var R=cmpOpRect(BM,op),h=hist.filter(function(q){return q.op===op.id;}).pop(),cur=P&&P.cur===op.id,sel=!P&&i===CMPE.sel;
    if(h&&h.win>=0){c.fillStyle=C.sides[h.win].color;c.globalAlpha=0.18;c.fillRect(R.x0*k,R.y0*k,R.Wm*k,R.Hm*k);c.globalAlpha=1;}
    c.save();c.lineWidth=sel||cur?3:1.5;c.strokeStyle=sel||cur?'#ffd23f':'rgba(255,255,255,.9)';if(!sel&&!cur)c.setLineDash([5,4]);c.strokeRect(R.x0*k,R.y0*k,R.Wm*k,R.Hm*k);c.restore();
    c.font='bold 12px sans-serif';c.lineWidth=3;c.strokeStyle='rgba(0,0,0,.75)';c.fillStyle='#fff';var t=(i+1)+'. '+(op.name||'');c.strokeText(t,R.x0*k+4,R.y0*k+14);c.fillText(t,R.x0*k+4,R.y0*k+14);});
  PL.forEach(function(p,i){var x=p.x*k,y=p.y*k,r=p.kind==='city'?5:p.kind==='town'?3.5:2,o=own[i],col=C.sides[o]?C.sides[o].color:'#888';
    c.beginPath();c.arc(x,y,r+(i===CMPE.hiPl?3:0),0,Math.PI*2);if(p.inh){c.fillStyle=col;c.fill();}c.lineWidth=p.inh?1.2:2;c.strokeStyle=p.inh?'#fff':col;c.stroke();
    if(p.kind!=='village'||i===CMPE.hiPl){c.font=(p.kind==='city'?'bold 12px':'11px')+' sans-serif';c.lineWidth=3;c.strokeStyle='rgba(255,255,255,.85)';c.fillStyle='#222';c.strokeText(p.name,x+r+2,y-r-1);c.fillText(p.name,x+r+2,y-r-1);}});}
/* 點在大地圖畫布上的位置 → 大地圖公尺 */
function cmpCvXY(cv,e,Wm,Hm){var b=cv.getBoundingClientRect();return [clamp((e.clientX-b.left)/b.width,0,1)*Wm,clamp((e.clientY-b.top)/b.height,0,1)*Hm];}
(function(){var st=document.createElement('style');st.textContent='.lw-cmp .lw-cmpmap{overflow:auto;max-width:100%;margin-top:6px}.lw-cmp canvas{max-width:100%;height:auto;display:block;border-radius:6px;cursor:crosshair;image-rendering:pixelated}'+
  '.lw-cmp textarea{width:100%;box-sizing:border-box;font:inherit;font-size:13px}.lw-cmpev{border:1px solid #dcd8cf;border-radius:8px;padding:6px 8px;margin:6px 0;background:#fbfaf7}.lw-cmpact{margin-left:14px;align-items:flex-start}.lw-cmpact textarea{min-width:260px;flex:1}'+
  '.lw-cmp .lw-btn{white-space:nowrap}.lw-cmppl td:nth-child(-n+5){white-space:nowrap}.lw-cmppl td[data-a]{cursor:pointer}.lw-cmpops{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}@media(max-width:900px){.lw-cmpops{grid-template-columns:minmax(0,1fr)}}.lw-cmppick{outline:2px solid #ffd23f}'+
  '.lw-cmpdlg{position:fixed;left:50%;top:112px;transform:translateX(-50%);z-index:45;width:min(680px,calc(100vw - 24px));background:rgba(24,28,36,.94);color:#f3f1ea;border-radius:12px;padding:12px 14px;display:flex;gap:12px;align-items:flex-start;box-shadow:0 8px 30px rgba(0,0,0,.4)}'+
  '@media(max-height:620px){.lw-cmpdlg{top:auto;bottom:12px}}.lw-cmpdlg .tx{flex:1;min-width:0}.lw-cmpdlg b{font-size:15px}.lw-cmpdlg small{opacity:.75;margin-left:6px}.lw-cmpdlg p{margin:6px 0 0;line-height:1.55;font-size:14px}.lw-cmpdlg .lw-btn{align-self:flex-end}.lw-cmptxt{background:#f6f4ee;border-left:3px solid #b8a77a;padding:8px 10px;margin:8px 0;line-height:1.6;border-radius:4px}';document.head.appendChild(st);})();
/* ---------- 頁面 ---------- */
PAGES.cmp=function(host){cmpEnsure();var o='<div class="lw-main lw-cmp"><div class="lw-card"><h3>戰役<small>大地圖一次產生或匯入，先算好各地點的建築、居民、道路與鐵路；每場作戰再依大地圖產生細部的區域地圖。可以設計劇情、對白、增援、部隊進出場與核彈，串成整個戰區的推進。</small></h3>'+
    '<div class="lw-row">'+CMPTABS.map(function(t){return '<button type="button" class="lw-btn sm'+(CMPE.tab===t[0]?' pri':'')+'" data-a="cmptab" data-v="'+t[0]+'">'+t[1]+'</button>';}).join('')+'<span style="flex:1"></span>'+
    '<button type="button" class="lw-btn sm" data-a="cmpnew">新戰役</button><button type="button" class="lw-btn sm" data-a="cmpdemo">範例戰役</button><button type="button" class="lw-btn sm" data-a="cmpexp">匯出戰役檔</button><label class="lw-btn sm" style="cursor:pointer">匯入戰役檔<input type="file" accept=".json,application/json" data-c="cmpimp" hidden></label></div>'+
    '<div class="lw-prog" data-k="cmpprog" hidden><i></i></div><div class="lw-note" data-k="cmpmsg"></div></div><div data-k="cmpbody"></div></div>';
  host.innerHTML=o;cmpBody();if(!CMPE.BM&&!CMPE.busy&&(CMPE.c.big.src==='proc'||CMPE.c.BMp))cmpGenBig();};
function cmpBody(){var h=cmpEl('cmpbody');if(!h)return;var f={big:cmpPgBig,pl:cmpPgPl,force:cmpPgForce,ops:cmpPgOps,play:cmpPgPlay}[CMPE.tab]||cmpPgBig;h.innerHTML=f();cmpPaint();}
/* 頁面上的畫布 */
function cmpPaint(){var cv=cmpEl('cmpcv');if(cv&&CMPE.BM){var R=cmpRun();cmpDrawBig(cv,CMPE.tab==='play'&&R?R.C:CMPE.c,CMPE.tab==='play'&&R?R.P:null);}var ov=cmpEl('cmpocv');if(ov&&CMPE.BM){var op=CMPE.c.ops[CMPE.sel];if(op)cmpDrawOp(ov,op);}}
function cmpNoMap(){return '<div class="lw-card"><div class="lw-note">'+(CMPE.busy?'大地圖產生中…':'還沒有大地圖。請到「戰役與大地圖」產生或匯入。')+'</div></div>';}
async function cmpGenBig(){if(CMPE.busy)return;CMPE.busy=true;try{var BM=await cmpBigGet(CMPE.c);cmpPgDone('大地圖：'+(BM.GW*BM.cs/1000)+' × '+(BM.GH*BM.cs/1000)+' 公里、'+(BM.set||[]).length+' 個聚落、'+(BM.rdp||[]).length+' 段道路、'+(BM.rlp||[]).length+' 段鐵路');
    if(!CMPE.c.ops.length){if(CMPE.c._demo)cmpOpsDemo(CMPE.c,BM);else cmpOpsDefault(CMPE.c,BM);}delete CMPE.c._demo;}catch(e){cmpPgDone('大地圖產生失敗：'+e.message);console.error(e);}CMPE.busy=false;if(UI.tab==='cmp')cmpBody();}
ACT.cmptab=function(b){CMPE.tab=b.getAttribute('data-v');CMPE.pick=null;show('cmp');};
ACT.cmpnew=function(){if(CMPE.busy){toast('大地圖產生中，請稍候。');return;}if(CMPE.c&&CMPE.c.ops.length&&!confirm('開新戰役會取代目前編輯中的戰役（請先匯出存檔）。確定嗎？'))return;CMPE.c=cmpNew();CMPE.BM=null;CMPE.bk='';CMPE.sel=0;CMPE.tab='big';cmpSave();show('cmp');};
ACT.cmpexp=function(){var C=CMPE.c;download((C.name||'戰役')+'.latocampaign.json',JSON.stringify(C),'application/json');};
CHG.cmpimp=function(t){var f=t.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(){try{var C=JSON.parse(rd.result);if(!C||C.format!=='LatoCampaign')throw new Error('這不是戰役檔（.latocampaign.json）。');CMPE.c=cmpNorm(C);CMPE.BM=null;CMPE.bk='';CMPE.sel=0;cmpSave();show('cmp');toast('已匯入戰役「'+CMPE.c.name+'」');}catch(e){toast('讀取失敗：'+e.message);}};rd.readAsText(f);};
/* ---------- 一、戰役資料與大地圖 ---------- */
function cmpPlayerV(C){var a=C.sides[0].ai,b=C.sides[1].ai;return !a&&b?0:a&&!b?1:!a&&!b?2:3;}
function cmpSelH(attr,L,v){return '<select '+attr+'>'+L.map(function(q){return '<option value="'+esc(String(q[0]))+'"'+(String(v)===String(q[0])?' selected':'')+'>'+esc(q[1])+'</option>';}).join('')+'</select>';}
function cmpNum(attr,v,w,ex){return '<input type="number" '+attr+' value="'+esc(String(v===undefined||v===null?'':v))+'" style="width:'+(w||60)+'px"'+(ex||'')+'>';}
function cmpPgBig(){var C=CMPE.c,B=C.big,o='',F=B.front;
  o+='<div class="lw-card"><h3>戰役資料</h3><div class="lw-row"><label>名稱 <input type="text" data-i="cmpf" data-f="name" value="'+esc(C.name)+'" style="width:14em"></label><label>開始 '+cmpNum('data-i="cmpf" data-f="y" min="1500" max="2100"',C.y,72)+' 年 '+cmpNum('data-i="cmpf" data-f="m" min="1" max="12"',C.m,48)+' 月 '+cmpNum('data-i="cmpf" data-f="d" min="1" max="31"',C.d,48)+' 日 '+cmpNum('data-i="cmpf" data-f="h" min="0" max="23"',C.h,48)+' 時</label>'+
    '<label>地名風格 '+cmpSelH('data-c="cmpf" data-f="nst"',NSTY,C.nst)+'</label><label>種子 <input type="text" data-i="cmpf" data-f="seed" value="'+esc(C.seed)+'" style="width:8em"></label></div>'+
    '<div class="lw-row" style="display:block"><label>簡介<textarea data-i="cmpf" data-f="desc" rows="2">'+esc(C.desc)+'</textarea></label></div>'+
    '<div class="lw-row">'+[0,1].map(function(s){var S=C.sides[s];return '<label>'+(s?'乙方':'甲方')+' <input type="text" data-i="cmpside" data-s="'+s+'" data-f="name" value="'+esc(S.name)+'" style="width:8em"> <input type="color" data-c="cmpside" data-s="'+s+'" data-f="color" value="'+esc(S.color)+'"></label>';}).join('')+
    '<label>玩家指揮 '+cmpSelH('data-c="cmpplayer"',[[0,C.sides[0].name],[1,C.sides[1].name],[2,'雙方都由玩家'],[3,'都由電腦（觀戰）']],cmpPlayerV(C))+'</label></div></div>';
  o+='<div class="lw-card"><h3>大地圖<small>整個戰區：一格 '+B.cs+' 公尺；產生時記錄每條道路與鐵路的走向，各場作戰的區域地圖沿著這些走向細部鋪設</small></h3>'+
    '<div class="lw-row"><b>來源</b>'+[['proc','程序產生'],['world','世界地圖（「開始」頁載入並點選的位置）'],['file','匯入作戰地圖檔']].map(function(q){return '<label><input type="radio" name="lwcmpsrc" data-c="cmpbig" data-f="src" value="'+q[0]+'"'+(B.src===q[0]?' checked':'')+'>'+q[1]+'</label>';}).join('')+'</div>';
  if(B.src==='file')o+='<div class="lw-row"><input type="file" accept=".json,application/json" data-c="cmpbigfile"> <span class="lw-note">「地圖編修」或存檔對話框匯出的作戰地圖（.latowarmap.json）'+(C.BMp?'。已匯入「'+esc(C.BMp.name||'')+'」，'+(C.BMp.GW*C.BMp.cs/1000)+' × '+(C.BMp.GH*C.BMp.cs/1000)+' 公里':'')+'</span></div>';
  else{if(B.src==='world')o+='<div class="lw-row lw-note">'+(typeof WR!=='undefined'&&WR&&ST0.lon0!==null&&ST0.lon0!==undefined?'使用「'+esc(WR.name||'世界地圖')+'」經度 '+fx(ST0.lon0,2)+'°、緯度 '+fx(ST0.lat0,2)+'° 為中心。產生後整份地圖會附在戰役檔裡。':'請先在「開始」頁選「內建示範世界」或上傳地形工具的地圖參數檔，並在世界地圖上點選作戰地區。')+'</div>';
    else o+='<div class="lw-row"><label>地形 '+cmpSelH('data-c="cmpbig" data-f="ter"',Object.keys(PTER).map(function(k){return [k,PTER[k][0]];}),B.ter)+'</label><label>氣候 '+cmpSelH('data-c="cmpbig" data-f="clim"',Object.keys(PCLIM).map(function(k){return [k,PCLIM[k][0]];}),B.clim)+'</label><label>緯度 '+cmpNum('data-i="cmpbig" data-f="lat" min="-70" max="70"',B.lat,60)+'°</label></div>';
    o+='<div class="lw-row"><label>範圍 '+cmpNum('data-i="cmpbig" data-f="W" min="20" max="1000"',B.W,64)+' × '+cmpNum('data-i="cmpbig" data-f="H" min="20" max="1000"',B.H,64)+' 公里</label><label>一格 '+cmpSelH('data-c="cmpbig" data-f="cs"',[[250,'250 公尺'],[500,'500 公尺'],[1000,'1 公里'],[2000,'2 公里']],B.cs)+'</label>'+
      '<span class="lw-note" data-k="cmpcells">'+cmpCellsTxt(B)+'</span><label>人口密度 '+cmpNum('data-i="cmpbig" data-f="dens" min="0" max="5" step="0.1"',B.dens,56)+' 倍</label><label>地區開發 '+cmpSelH('data-c="cmpbig" data-f="dev"',[['auto','依人口密度'],['low','低'],['mid','中'],['high','高']],B.dev)+'</label><label><input type="checkbox" data-c="cmpbig" data-f="rail"'+(B.rail!==false?' checked':'')+'>鐵路</label><label><input type="checkbox" data-c="cmpbig" data-f="hsr"'+(B.hsr!==false?' checked':'')+'>高鐵</label></div>';}
  o+='<div class="lw-row"><label>初始前線 '+cmpSelH('data-c="cmpfront" data-f="dir"',[['WE',C.sides[0].name+'在西、'+C.sides[1].name+'在東'],['EW',C.sides[0].name+'在東、'+C.sides[1].name+'在西'],['NS',C.sides[0].name+'在北、'+C.sides[1].name+'在南'],['SN',C.sides[0].name+'在南、'+C.sides[1].name+'在北']],F.dir)+'</label><label>位置 <input type="range" min="5" max="95" data-i="cmpfront" data-f="f" value="'+Math.round((F.f===undefined?0.5:F.f)*100)+'"> <span data-k="cmpff">'+Math.round((F.f===undefined?0.5:F.f)*100)+'%</span></label></div>';
  var st=cmpBigStale();o+='<div class="lw-row"><button type="button" class="lw-btn pri" data-a="cmpbiggen"'+(B.src==='file'&&!C.BMp?' disabled':'')+'>'+(CMPE.BM?'重新產生大地圖':'產生大地圖')+'</button><span class="lw-note">'+(CMPE.BM?(st?'<span class="lw-err">參數已改變，按「重新產生大地圖」套用（地點的修改與作戰位置可能需要重新調整）。</span>':cmpBigInfo()):'')+'</span></div>';
  if(CMPE.BM)o+='<div class="lw-cmpmap"><canvas data-k="cmpcv" data-v="big" data-a="cmpcvclk"></canvas></div><div class="lw-note">圓點是聚落（顏色為控制方，空心為無人居住），虛線是初始前線，方框是各場作戰的區域；在「作戰與劇情」可以點地圖放置作戰區域。</div>';
  return o+'</div>';}
function cmpBigInfo(){var BM=CMPE.BM;if(!BM)return '';var P=cmpPL(),pop=sum(P,function(p){return p.pop;});return (BM.GW*BM.cs/1000)+' × '+(BM.GH*BM.cs/1000)+' 公里，'+P.length+' 個聚落（人口約 '+fmt(Math.round(pop))+'），'+(BM.rdp||[]).length+' 段道路、'+(BM.rlp||[]).length+' 段鐵路';}
INP.cmpf=function(t){var C=CMPE.c,f=t.getAttribute('data-f');C[f]=t.type==='number'?num(t.value,C[f]):t.value;cmpSave();};
CHG.cmpf=function(t){CMPE.c[t.getAttribute('data-f')]=t.value;cmpSave();cmpBody();};
INP.cmpside=function(t){CMPE.c.sides[+t.getAttribute('data-s')][t.getAttribute('data-f')]=t.value;cmpSave();};
CHG.cmpside=function(t){CMPE.c.sides[+t.getAttribute('data-s')][t.getAttribute('data-f')]=t.value;cmpSave();cmpPaint();};
CHG.cmpplayer=function(t){var v=+t.value,C=CMPE.c;C.sides[0].ai=v===1||v===3;C.sides[1].ai=v===0||v===3;cmpSave();};
INP.cmpbig=function(t){var B=CMPE.c.big,f=t.getAttribute('data-f');B[f]=num(t.value,B[f]);cmpSave();var n=UI.body&&UI.body.querySelector('[data-k="cmpcells"]');if(n)n.innerHTML=cmpCellsTxt(B);};
CHG.cmpbig=function(t){var B=CMPE.c.big,f=t.getAttribute('data-f');if(t.type==='checkbox')B[f]=t.checked;else B[f]=f==='cs'?+t.value:t.value;/* 換了來源：附在戰役裡的地圖（匯入或由世界地圖產生）不再使用 */if(f==='src')delete CMPE.c.BMp;cmpSave();cmpBody();};
CHG.cmpfront=function(t){CMPE.c.big.front.dir=t.value;CMPE.c.ops.forEach(function(op){op.edge=cmpEdges(CMPE.c);});cmpSave();cmpPaint();};
INP.cmpfront=function(t){CMPE.c.big.front.f=clamp(+t.value/100,0.05,0.95);var e=cmpEl('cmpff');if(e)e.textContent=t.value+'%';cmpSave();cmpPaint();};
ACT.cmpbiggen=async function(){var C=CMPE.c;if(CMPE.busy)return;if(C.big.src!=='file'&&cmpBigErr(C.big)){toast(cmpBigErr(C.big),6000);return;}if(CMPE.BM&&(C.ops.length||Object.keys(C.places).length)&&cmpBigStale()&&!confirm('重新產生大地圖後，地點的修改與作戰區域的位置可能對不上新的地圖。確定嗎？'))return;
  if(C.big.src==='world'){if(typeof WR==='undefined'||!WR||ST0.lon0===null||ST0.lon0===undefined){toast('請先在「開始」頁載入世界地圖並點選作戰地區。');return;}CMPE.busy=true;try{var cs=+C.big.cs||500,gw=Math.round(C.big.W*1000/cs),gh=Math.round(C.big.H*1000/cs);
      var BM=await genRegion({GW:gw,GH:gh,cs:cs,seed:C.seed+'|big',year:C.y,name:(C.name||'戰役')+'・大地圖',lat0:ST0.lat0,lon0:ST0.lon0,src:'world',world:{name:WR.name},dens:+C.big.dens||1,rail:C.big.rail!==false,dev:C.big.dev||'auto',hsr:C.big.hsr!==false,nst:C.nst,keep:1},worldSampler(WR,ST0.lon0,ST0.lat0,gw*cs,gh*cs),cmpPg());
      BM.big=1;cmpHab(BM,worldSampler(WR,ST0.lon0,ST0.lat0,gw*cs,gh*cs));C.BMp=await packMap(BM);C.big.lon0=ST0.lon0;C.big.lat0=ST0.lat0;}catch(e){cmpPgDone('產生失敗：'+e.message);CMPE.busy=false;return;}CMPE.busy=false;}
  CMPE.BM=null;CMPE.bk='';cmpSave();cmpGenBig();};
CHG.cmpbigfile=function(t){var f=t.files[0];if(!f)return;var rd=new FileReader();rd.onload=async function(){try{var m=JSON.parse(rd.result);if(!m||m.format!=='LatoWarMap')throw new Error('這不是作戰地圖檔（.latowarmap.json）。');var C=CMPE.c;C.BMp=m;C.big.src='file';C.big.W=m.GW*m.cs/1000;C.big.H=m.GH*m.cs/1000;C.big.cs=m.cs;CMPE.BM=null;CMPE.bk='';cmpSave();await cmpGenBig();toast('已匯入大地圖「'+(m.name||'')+'」');}catch(e){toast('讀取失敗：'+e.message);}};rd.readAsText(f);};
/* ---------- 二、地點：建築、居民、經過的道路與鐵路 ---------- */
function cmpLinkTxt(A,P){return (A||[]).slice(0,6).map(function(E){var q=P[E.j];return esc(q?q.name:'?')+'（'+(E.rail?(E.h?'高鐵':'鐵路'):RD[E.c]?RD[E.c][1]:'道路')+' '+fx(E.km,E.km<10?1:0)+' 公里）';}).join('、');}
function cmpPgPl(){if(!CMPE.BM)return cmpNoMap();var C=CMPE.c,P=cmpPL(),L=cmpLinksOf(),F=cmpFacsOf(),q=CMPE.plq.trim(),list=P.slice().sort(function(a,b){return b.pop-a.pop;}).filter(function(p){return !q||p.name.indexOf(q)>=0;}),n=list.length;if(!CMPE.plAll)list=list.slice(0,60);
  var o='<div class="lw-card"><h3>地點<small>大地圖上的聚落：依同一套規則算出的設施與地標、估計的房屋數量、經過的道路與鐵路與通往的地點。可以改名、設為無人居住（建築還在，沒有居民）或指定初始由哪一方控制</small></h3>'+
    '<div class="lw-cmpmap"><canvas data-k="cmpcv" data-v="pl" data-a="cmpcvclk"></canvas></div>'+
    '<div class="lw-row"><label>搜尋 <input type="text" data-i="cmpplq" value="'+esc(CMPE.plq)+'" style="width:9em"></label><label><input type="checkbox" data-c="cmpplall"'+(CMPE.plAll?' checked':'')+'>顯示全部（'+n+'）</label>'+
    '<label>前線 '+cmpNum('data-k="cmpevkm" min="1" max="100"',5,52)+' 公里內的聚落 <button type="button" class="lw-btn sm" data-a="cmpevac">設為無人居住（已疏散）</button></label><button type="button" class="lw-btn sm" data-a="cmpinh">全部恢復有人居住</button></div>'+
    '<table class="lw-tbl lw-cmppl"><tr><th>名稱</th><th>種類</th><th class="n">人口</th><th>居住</th><th>初始控制</th><th>建築</th><th>道路與鐵路</th></tr>';
  list.forEach(function(p){var i=p.i,ov=C.places[i]||{},ownV=ov.own===undefined||ov.own===''?'':ov.own,o0=cmpOwn0(C,CMPE.BM,p);
    o+='<tr class="cl'+(i===CMPE.hiPl?' lw-cmppick':'')+'" data-k="cmppl'+i+'"><td><input type="text" data-i="cmppl" data-v="'+i+'" data-f="name" value="'+esc(p.name)+'" style="width:7em"></td><td data-a="cmpplhi" data-v="'+i+'" title="在地圖上標出">'+(CMPKN[p.kind]||p.kind)+'</td><td class="n" data-a="cmpplhi" data-v="'+i+'">'+fmt(Math.round(p.pop))+'</td>'+
      '<td><label><input type="checkbox" data-c="cmppl" data-v="'+i+'" data-f="inh"'+(p.inh?' checked':'')+'>'+(p.inh?'有人':'無人')+'</label></td>'+
      '<td>'+cmpSelH('data-c="cmppl" data-v="'+i+'" data-f="own"',[['','依前線（'+C.sides[o0].name+'）'],[0,C.sides[0].name],[1,C.sides[1].name]],ownV)+'</td>'+
      '<td>約 '+fmt(cmpBldN(p,C.y))+' 棟'+(F[i]&&F[i].length?'；'+esc(cmpFacTxt(F[i])):'')+'</td><td>'+esc(cmpPlaceTxt(p))+(L[i]&&L[i].length?'<br><span class="lw-note">通往 '+cmpLinkTxt(L[i],P)+'</span>':'')+'</td></tr>';});
  return o+'</table>'+(n>list.length?'<div class="lw-note">只列出人口最多的 '+list.length+' 個，勾選「顯示全部」可以看到其餘的聚落。</div>':'')+'</div>';}
INP.cmpplq=function(t){CMPE.plq=t.value;clearTimeout(CMPE.qt);CMPE.qt=setTimeout(function(){var a=document.activeElement===t;cmpBody();if(a){var e=UI.body.querySelector('[data-i="cmpplq"]');if(e){e.focus();e.setSelectionRange(e.value.length,e.value.length);}}},350);};
CHG.cmpplall=function(t){CMPE.plAll=t.checked;cmpBody();};
INP.cmppl=function(t){var i=t.getAttribute('data-v'),C=CMPE.c;C.places[i]=Object.assign({},C.places[i]||{},{name:t.value});CMPE.L=null;cmpSave();};
CHG.cmppl=function(t){var i=t.getAttribute('data-v'),f=t.getAttribute('data-f'),C=CMPE.c,o=C.places[i]=Object.assign({},C.places[i]||{});if(f==='inh')o.inh=t.checked?1:0;else if(f==='own'){if(t.value==='')delete o.own;else o.own=+t.value;}if(f!=='name'){cmpSave();cmpBody();}};
ACT.cmpplhi=function(b){cmpHiPl(+b.getAttribute('data-v'),false);};
function cmpHiPl(i,scroll){CMPE.hiPl=i;cmpPaint();UI.body.querySelectorAll('tr.lw-cmppick').forEach(function(r){r.classList.remove('lw-cmppick');});var tr=cmpEl('cmppl'+i);if(tr){tr.classList.add('lw-cmppick');if(scroll)tr.scrollIntoView({block:'center'});}}
ACT.cmpevac=function(){var C=CMPE.c,BM=CMPE.BM,km=num((cmpEl('cmpevkm')||{}).value,5),F=C.big.front,f=F.f===undefined?0.5:+F.f,n=0;cmpPL().forEach(function(p){var d=F.dir==='NS'||F.dir==='SN'?Math.abs(p.y-BM.Hm*f):Math.abs(p.x-BM.Wm*f);if(d<=km*1000){C.places[p.i]=Object.assign({},C.places[p.i]||{},{inh:0});n++;}});cmpSave();cmpBody();toast(n+' 個聚落設為無人居住');};
ACT.cmpinh=function(){var C=CMPE.c;Object.keys(C.places).forEach(function(k){delete C.places[k].inh;});cmpSave();cmpBody();};
/* ---------- 三、兵力與人物 ---------- */
function cmpPkOpts(v){var o='',G0={};Object.keys(FPI).forEach(function(k){var p=FPI[k];(G0[p.era]=G0[p.era]||[]).push(p);});ERA.forEach(function(E){var L=G0[E.k];if(!L)return;o+='<optgroup label="'+esc(E.n)+(E.fan?'':'（'+E.y0+'～'+E.y1+'）')+'">'+L.map(function(p){return '<option value="'+esc(p.k)+'"'+(p.k===v?' selected':'')+'>'+esc(p.n)+'</option>';}).join('')+'</optgroup>';});
  if(v&&!FPI[v])o+='<option value="'+esc(v)+'" selected>'+esc((UT[v]||{}).n||v)+'</option>';return o;}
function cmpFRow(f,j,attr){return '<tr><td><select '+attr+' data-j="'+j+'" data-f="k" style="max-width:15em">'+cmpPkOpts(f.k)+'</select></td><td class="n">'+cmpNum(attr.replace('data-c','data-i')+' data-j="'+j+'" data-f="n" min="1" max="40"',f.n||1,52)+'</td>'+
  '<td><input type="text" '+attr.replace('data-c','data-i')+' data-j="'+j+'" data-f="name" value="'+esc(f.name||'')+'" placeholder="自動命名" style="width:9em"></td><td>'+cmpSelH(attr+' data-j="'+j+'" data-f="gran"',CMPGRAN,f.gran||'co')+'</td><td><button type="button" class="lw-btn sm" data-a="'+(attr.indexOf('cmpfo')>=0?'cmpfodel':'cmpfdel')+'" '+attr.replace(/data-c="[^"]*"/,'')+' data-j="'+j+'">刪除</button></td></tr>';}
function cmpPgForce(){var C=CMPE.c,o='<div class="lw-cmpops">';
  [0,1].forEach(function(s){o+='<div class="lw-card"><h3><span class="lw-sw" style="background:'+esc(C.sides[s].color)+'"></span> '+esc(C.sides[s].name)+'的核心兵力<small>整場戰役延續的部隊：每場作戰結束時記下各單位的兵力、彈藥與經驗，被殲滅的單位之後不再出現</small></h3>'+
    '<div style="overflow-x:auto"><table class="lw-tbl"><tr><th>編制</th><th class="n">數量</th><th>名稱（{i} 換成序號）</th><th>最小單位</th><th></th></tr>'+C.forces[s].map(function(f,j){return cmpFRow(f,j,'data-c="cmpfc" data-s="'+s+'"');}).join('')+'</table></div>'+
    '<div class="lw-row"><button type="button" class="lw-btn sm" data-a="cmpfadd" data-s="'+s+'">＋ 加入兵力</button><button type="button" class="lw-btn sm" data-a="cmpfscn" data-s="'+s+'">依開始年代帶入快速想定的兵力</button></div></div>';});
  o+='</div><div class="lw-card"><h3>人物<small>對白的說話者：名字、職稱、陣營與頭像（依名字自動產生，可以換一張）</small></h3><table class="lw-tbl"><tr><th></th><th>名字</th><th>職稱</th><th>陣營</th><th>性別</th><th></th></tr>'+
    C.chars.map(function(ch,j){return '<tr><td>'+ptSvg(cmpCharPt(ch,C),40)+'</td><td><input type="text" data-i="cmpch" data-j="'+j+'" data-f="name" value="'+esc(ch.name||'')+'" style="width:8em"></td><td><input type="text" data-i="cmpch" data-j="'+j+'" data-f="title" value="'+esc(ch.title||'')+'" style="width:9em"></td>'+
      '<td>'+cmpSelH('data-c="cmpch" data-j="'+j+'" data-f="side"',[[-1,'中立'],[0,C.sides[0].name],[1,C.sides[1].name]],ch.side===undefined?-1:ch.side)+'</td><td>'+cmpSelH('data-c="cmpch" data-j="'+j+'" data-f="f"',[[0,'男'],[1,'女']],ch.f?1:0)+'</td>'+
      '<td><button type="button" class="lw-btn sm" data-a="cmpchpt" data-j="'+j+'">換頭像</button><button type="button" class="lw-btn sm" data-a="cmpchdel" data-j="'+j+'">刪除</button></td></tr>';}).join('')+'</table><div class="lw-row"><button type="button" class="lw-btn sm" data-a="cmpchadd">＋ 新增人物</button></div></div>';
  return o;}
function cmpCharPt(ch,C){var s=ch.side===undefined||ch.side<0?0:+ch.side;return ptAuto(String(ch.ps||ch.id)+'|'+(ch.name||''),{fem:!!ch.f,y:(C&&C.y)||1944,ech:6,side:s});}
function cmpFList(t){var s=+t.getAttribute('data-s');return CMPE.c.forces[s];}
CHG.cmpfc=function(t){var L=cmpFList(t),j=+t.getAttribute('data-j'),f=t.getAttribute('data-f');if(!L[j])return;L[j][f]=t.value;cmpSave();};
INP.cmpfc=function(t){var L=cmpFList(t),j=+t.getAttribute('data-j'),f=t.getAttribute('data-f');if(!L[j])return;L[j][f]=f==='n'?clamp(num(t.value,1),1,40):t.value;cmpSave();};
ACT.cmpfadd=function(b){var s=+b.getAttribute('data-s'),C=CMPE.c,L=C.forces[s],sc=cmpScnFor(C.y),k=sc&&(s?sc.B:sc.A)[0]?(s?sc.B:sc.A)[0][0]:Object.keys(FPI)[0];L.push({id:cmpId(C.forces[0].concat(C.forces[1]),'f'),k:k,n:1,name:'',gran:'co'});C.ops.forEach(function(op){var u=op.sides[s].use;if(u.indexOf(L[L.length-1].id)<0)u.push(L[L.length-1].id);});cmpSave();cmpBody();};
ACT.cmpfdel=function(b){var s=+b.getAttribute('data-s'),j=+b.getAttribute('data-j'),C=CMPE.c,f=C.forces[s][j];if(!f)return;C.forces[s].splice(j,1);C.ops.forEach(function(op){op.sides[s].use=op.sides[s].use.filter(function(id){return id!==f.id;});});cmpSave();cmpBody();};
ACT.cmpfscn=function(b){var s=+b.getAttribute('data-s'),C=CMPE.c,sc=cmpScnFor(C.y);if(!sc){toast('找不到合適的快速想定。');return;}var all=C.forces[0].concat(C.forces[1]);cmpForcesOf(sc,s).forEach(function(f){f.id=cmpId(all,'f');all.push(f);C.forces[s].push(f);C.ops.forEach(function(op){op.sides[s].use.push(f.id);});});cmpSave();cmpBody();toast('已帶入「'+sc.n+'」的兵力');};
INP.cmpch=function(t){var ch=CMPE.c.chars[+t.getAttribute('data-j')];if(!ch)return;ch[t.getAttribute('data-f')]=t.value;cmpSave();};
CHG.cmpch=function(t){var ch=CMPE.c.chars[+t.getAttribute('data-j')];if(!ch)return;ch[t.getAttribute('data-f')]=+t.value;cmpSave();cmpBody();};
ACT.cmpchadd=function(){var C=CMPE.c;C.chars.push({id:cmpId(C.chars,'c'),name:'新人物',title:'',side:0,f:0});cmpSave();cmpBody();};
ACT.cmpchdel=function(b){CMPE.c.chars.splice(+b.getAttribute('data-j'),1);cmpSave();cmpBody();};
ACT.cmpchpt=function(b){var ch=CMPE.c.chars[+b.getAttribute('data-j')];if(!ch)return;ch.ps=Math.floor(Math.random()*1e9).toString(36);cmpSave();cmpBody();};
/* ---------- 四、作戰與劇情 ---------- */
/* 第一次產生大地圖時建立兩場示範作戰：前線上的突破，接著向乙方縱深推進 */
function cmpOpsDefault(C,BM){var F=C.big.front,f=F.f===undefined?0.5:+F.f,ns=F.dir==='NS'||F.dir==='SN',sg=F.dir==='WE'||F.dir==='NS'?1:-1,w=Math.min(20,Math.floor(BM.Wm/1000*0.4)),h=Math.min(15,Math.floor(BM.Hm/1000*0.4));
  if(!C.chars.length){var r=mb32(hstr(C.seed+'|ch'));C.chars.push({id:'c1',name:personName(r,C.nst==='west'?'west':C.nst==='westzh'?'westzh':'zh',false),title:'參謀長',side:0,f:0});C.chars.push({id:'c2',name:personName(r,C.nst==='west'?'west':C.nst==='westzh'?'westzh':'zh',true),title:'情報官',side:0,f:1});}
  var mk=function(i,name,dx){var cx=ns?BM.Wm/2:BM.Wm*f+sg*dx,cy=ns?BM.Hm*f+sg*dx:BM.Hm/2;return cmpOpNorm(C,{id:'op'+i,name:name,x:Math.round(cx-w*500),y:Math.round(cy-h*500),w:w,h:h,cs:50});};
  var a=mk(1,'突破前線',0),b=mk(2,'向縱深推進',w*800);
  a.brief='敵軍沿前線構築了陣地。我軍要在今天突破當面之敵，奪取作戰目標，為後續的推進打開缺口。';b.brief='前線已經打開缺口。趁敵軍重整之前向縱深推進，奪取交通要點。';
  a.deb={'0':'我軍突破了敵軍陣地，前線向前推進。','1':'攻勢受挫，敵軍守住了陣地。','d':'雙方在前線形成對峙。'};b.deb={'0':'交通要點落入我軍手中，戰區的局勢已經改觀。','1':'敵軍的反擊把我軍逐回原來的陣地。','d':'推進停頓下來。'};
  a.ev=[{id:'e1',name:'開戰訓示',tr:{k:'start'},act:[{k:'dlg',who:'c1',side:0,txt:'各部隊注意：今天的任務是突破當面之敵、奪取作戰目標。砲兵準備完成後立刻發起攻擊。'}]},
    {id:'e2',name:'敵軍預備隊',tr:{k:'time',t:180},act:[{k:'dlg',who:'c2',side:0,txt:'偵察回報：敵軍預備隊正從後方向前線移動，預計兩小時內抵達。'}]}];
  b.ev=[{id:'e1',name:'推進命令',tr:{k:'start'},act:[{k:'dlg',who:'c1',side:0,txt:'前線已經打開，全軍向縱深推進！不要讓敵人有喘息的機會。'}]},
    {id:'e2',name:'敵軍崩潰',tr:{k:'str',side:1,pct:35},act:[{k:'msg',side:'',txt:'敵軍的抵抗瓦解了。'},{k:'end',win:0,why:'敵軍全線潰退'}]}];
  C.ops.push(a,b);cmpSave();}
function cmpPvKey(op){var C=CMPE.c;return CMPE.bk+'|'+JSON.stringify([op.x,op.y,op.w,op.h,op.cs,op.id,C.seed,C.y,C.nst,C.places]);}
function cmpKm(v){return fx((+v||0)/1000,1);}
function cmpPosBtn(op,path,o){var R=cmpOpRect(CMPE.BM,op),has=o&&o.x!==undefined&&o.x!=='';return '<button type="button" class="lw-btn sm'+(CMPE.pick===path?' pri':'')+'" data-a="cmppick" data-p="'+path+'" title="在作戰區域圖上點選">📍 '+(has?cmpKm(o.x-R.x0)+', '+cmpKm(o.y-R.y0)+' 公里':'點選位置')+'</button>';}
function cmpPgOps(){if(!CMPE.BM)return cmpNoMap();var C=CMPE.c,op=C.ops[CMPE.sel],o='<div class="lw-card"><h3>作戰<small>依序進行；每場作戰可以依勝負分支到不同的下一場。點大地圖可以選取作戰</small></h3><div class="lw-row">'+
    C.ops.map(function(q,i){return '<button type="button" class="lw-btn sm'+(i===CMPE.sel?' pri':'')+'" data-a="cmpopsel" data-v="'+i+'">'+(i+1)+'. '+esc(q.name)+'</button>';}).join('')+'<button type="button" class="lw-btn sm" data-a="cmpopadd">＋ 新增作戰</button></div>';
  if(!op)return o+'<div class="lw-note">還沒有作戰。按「＋ 新增作戰」，再在大地圖上點選作戰區域的中心。</div><div class="lw-cmpmap"><canvas data-k="cmpcv" data-v="ops" data-a="cmpcvclk"></canvas></div></div>';
  var R=cmpOpRect(CMPE.BM,op),first=C.ops.indexOf(op)===0,dt=op.date&&op.date.y?op.date.y+'-'+String(op.date.m).padStart(2,'0')+'-'+String(op.date.d).padStart(2,'0'):'';
  o+='<div class="lw-row"><label>名稱 <input type="text" data-i="cmpop" data-f="name" value="'+esc(op.name)+'" style="width:12em"></label><button type="button" class="lw-btn sm" data-a="cmpopmv" data-v="-1">上移</button><button type="button" class="lw-btn sm" data-a="cmpopmv" data-v="1">下移</button><button type="button" class="lw-btn sm" data-a="cmpopdup">複製</button><button type="button" class="lw-btn sm dng" data-a="cmpopdel">刪除</button></div></div>';
  o+='<div class="lw-cmpops"><div class="lw-card"><h3>區域與時間</h3><div class="lw-row"><label>左上角 '+cmpNum('data-i="cmpopkm" data-f="x" step="0.5"',fx(op.x/1000,1),64)+' , '+cmpNum('data-i="cmpopkm" data-f="y" step="0.5"',fx(op.y/1000,1),64)+' 公里</label><label>大小 '+cmpNum('data-i="cmpop" data-f="w" min="4" max="200"',op.w,52)+' × '+cmpNum('data-i="cmpop" data-f="h" min="4" max="200"',op.h,52)+' 公里</label>'+
      '<label>一格 '+cmpSelH('data-c="cmpop" data-f="cs"',[[25,'25 公尺'],[50,'50 公尺'],[100,'100 公尺'],[200,'200 公尺']],op.cs)+'</label><button type="button" class="lw-btn sm'+(CMPE.pick==='op'?' pri':'')+'" data-a="cmppick" data-p="op">在大地圖上點選中心</button></div>'+
    '<div class="lw-note">區域地圖 '+Math.round(R.Wm/R.cs)+' × '+Math.round(R.Hm/R.cs)+' 格（'+fmt(Math.round(R.Wm/R.cs*R.Hm/R.cs))+' 格）'+(R.Wm/R.cs*R.Hm/R.cs>1.4e6?'<span class="lw-err">　格數過多，請縮小範圍或加大格子</span>':'')+'</div>'+
    '<div class="lw-row"><label>'+(first?'戰役開始時（'+C.y+'／'+C.m+'／'+C.d+'）':'上一場結束後 '+cmpNum('data-i="cmpop" data-f="gap" min="0" max="365" step="0.5"',op.gap,52)+' 天')+'</label><label>或指定日期 <input type="date" data-c="cmpopdate" value="'+dt+'"></label><label>時刻 '+cmpNum('data-i="cmpop" data-f="hr" min="0" max="23" placeholder="—"',op.hr,48)+' 時</label><label>時限 '+cmpNum('data-i="cmpop" data-f="dur" min="1" max="2000"',op.dur,56)+' 小時</label></div>'+
    '<div class="lw-row">'+[0,1].map(function(s){return '<label>'+esc(C.sides[s].name)+'從 '+cmpSelH('data-c="cmpopedge" data-s="'+s+'"',CMPEDGE,(op.edge||[])[s])+' 側進場</label>';}).join('')+'</div>'+
    '<div class="lw-cmpmap"><canvas data-k="cmpcv" data-v="ops" data-a="cmpcvclk"></canvas></div></div>';
  var pv=CMPE.prev[cmpPvKey(op)];o+='<div class="lw-card"><h3>作戰區域<small>'+(pv?'區域地圖預覽':'大地圖放大')+'；按「📍」之後在這張圖上點選位置</small></h3><div class="lw-cmpmap"><canvas data-k="cmpocv" data-a="cmpocvclk"></canvas></div><div class="lw-row"><button type="button" class="lw-btn sm" data-a="cmppv"'+(CMPE.busy?' disabled':'')+'>產生區域地圖預覽</button><span class="lw-note">'+(pv?pv.info:'區域地圖依大地圖的地勢、河流、林地與農地、聚落、道路與鐵路產生；同一場作戰每次都一樣。')+'</span></div></div></div>';
  /* 兵力 */
  o+='<div class="lw-card"><h3>兵力<small>勾選參加這場作戰的核心兵力；也可以加入只在這場作戰出現的部隊（例如當地守備隊），不延續到之後的作戰</small></h3><div class="lw-cmpops">'+[0,1].map(function(s){var S=op.sides[s];return '<div><b>'+esc(C.sides[s].name)+'</b><div class="lw-row">'+
      C.forces[s].map(function(f){return '<label><input type="checkbox" data-c="cmpuse" data-s="'+s+'" data-v="'+esc(f.id)+'"'+(S.use.indexOf(f.id)>=0?' checked':'')+'>'+esc(cmpFLabel(f))+'</label>';}).join('')+(C.forces[s].length?'':'<span class="lw-note">（沒有核心兵力，請到「兵力與人物」加入）</span>')+'</div>'+
      (S.add.length?'<table class="lw-tbl" style="display:block;overflow-x:auto"><tr><th>只在這場作戰</th><th class="n">數量</th><th>名稱</th><th>最小單位</th><th></th></tr>'+S.add.map(function(f,j){return cmpFRow(f,j,'data-c="cmpfo" data-s="'+s+'"');}).join('')+'</table>':'')+
      '<div class="lw-row"><button type="button" class="lw-btn sm" data-a="cmpfoadd" data-s="'+s+'">＋ 只在這場作戰的部隊</button></div></div>';}).join('')+'</div></div>';
  /* 目標 */
  var inR=cmpPL().filter(function(p){return p.x>=R.x0&&p.y>=R.y0&&p.x<R.x0+R.Wm&&p.y<R.y0+R.Hm;}).sort(function(a,b){return b.pop-a.pop;});
  o+='<div class="lw-card"><h3>作戰目標<small>沒有逐一指定時，自動選幾個聚落當目標；也可以逐一指定名稱、分數、範圍與位置</small></h3><div class="lw-row"><label>自動選 '+cmpNum('data-i="cmpop" data-f="nobj" min="1" max="8"',op.nobj,48)+' 個</label>'+
    '<label>加入聚落 '+cmpSelH('data-c="cmpobjpl"',[['','—']].concat(inR.slice(0,40).map(function(p){return [p.i,p.name+'（'+(CMPKN[p.kind]||'')+'）'];})),'')+'</label><button type="button" class="lw-btn sm" data-a="cmpobjadd">＋ 指定位置的目標</button></div>'+
    (op.obj.length?'<table class="lw-tbl"><tr><th>名稱</th><th class="n">分數</th><th class="n">範圍（公尺）</th><th>位置</th><th></th></tr>'+op.obj.map(function(q,j){return '<tr><td><input type="text" data-i="cmpobj" data-j="'+j+'" data-f="name" value="'+esc(q.name||'')+'" style="width:9em"></td><td class="n">'+cmpNum('data-i="cmpobj" data-j="'+j+'" data-f="pts" min="1" max="100"',q.pts||10,52)+'</td><td class="n">'+cmpNum('data-i="cmpobj" data-j="'+j+'" data-f="r" min="100" max="5000" step="50"',q.r||800,64)+'</td><td>'+cmpPosBtn(op,'obj.'+j,q)+'</td><td><button type="button" class="lw-btn sm" data-a="cmpobjdel" data-j="'+j+'">刪除</button></td></tr>';}).join('')+'</table>':'')+'</div>';
  /* 簡報、講評、分支 */
  var nx=[['','依序下一場']].concat(C.ops.filter(function(q){return q!==op;}).map(function(q){return [q.id,'「'+q.name+'」'];})).concat([['end','戰役結束']]);
  o+='<div class="lw-card"><h3>簡報、講評與分支</h3><label>作戰前簡報<textarea data-i="cmpop" data-f="brief" rows="3">'+esc(op.brief||'')+'</textarea></label>'+
    ['0','1','d'].map(function(k){return '<div class="lw-row" style="align-items:flex-start"><label style="flex:1">'+(k==='d'?'不分勝負':esc(C.sides[+k].name)+'獲勝')+'的講評<textarea data-i="cmpopdeb" data-v="'+k+'" rows="2">'+esc(op.deb[k]||'')+'</textarea></label><label>之後 '+cmpSelH('data-c="cmpopnx" data-v="'+k+'"',nx,op.next[k]||'')+'</label></div>';}).join('')+'</div>';
  /* 劇情事件 */
  o+='<div class="lw-card"><h3>劇情事件<small>觸發條件成立（再經過延遲）後依序執行動作，每個事件只發生一次。對白會暫停作戰（可在「進行戰役」分頁關閉）</small></h3>'+op.ev.map(function(e,i){return cmpEvHtml(C,op,e,i);}).join('')+'<div class="lw-row"><button type="button" class="lw-btn sm" data-a="cmpevadd">＋ 新增事件</button></div></div>';
  return o;}
/* 一個事件：觸發條件與動作 */
function cmpEvHtml(C,op,e,i){var T=e.tr,a='data-e="'+i+'"',o='<div class="lw-cmpev"><div class="lw-row"><b>'+(i+1)+'</b><input type="text" data-i="cmpev" '+a+' data-f="name" value="'+esc(e.name||'')+'" placeholder="事件名稱" style="width:9em"><label>觸發 '+cmpSelH('data-c="cmpev" '+a+' data-f="tr.k"',Object.keys(CMPTR).map(function(k){return [k,CMPTR[k]];}),T.k)+'</label>'+cmpTrHtml(C,op,e,i)+
    '<label>再延遲 '+cmpNum('data-i="cmpev" '+a+' data-f="tr.dl" min="0"',T.dl||0,56)+' 分</label><span style="flex:1"></span><button type="button" class="lw-btn sm" data-a="cmpevdel" '+a+'>刪除事件</button></div>';
  e.act.forEach(function(x,j){o+='<div class="lw-row lw-cmpact"><span class="lw-pill">'+(CMPACT[x.k]||x.k)+'</span>'+cmpActHtml(C,op,e,i,x,j)+'<button type="button" class="lw-btn sm" data-a="cmpactdel" '+a+' data-j="'+j+'" title="刪除這個動作">✕</button></div>';});
  return o+'<div class="lw-row lw-cmpact"><label>加入動作 '+cmpSelH('data-c="cmpactadd" '+a,[['','—']].concat(Object.keys(CMPACT).map(function(k){return [k,CMPACT[k]];})),'')+'</label></div></div>';}
function cmpSideSel(C,a,f,v,all){return cmpSelH('data-c="cmpev" '+a+' data-f="'+f+'"',(all?[['','雙方']]:[]).concat([[0,C.sides[0].name],[1,C.sides[1].name]]),v===undefined?(all?'':0):v);}
function cmpForceOpts(C,op,s){var L=[['','（依名稱）']];(C.forces[s]||[]).forEach(function(f){L.push([f.id,cmpFLabel(f)]);});((op.sides[s]||{}).add||[]).forEach(function(f,j){L.push(['o'+op.id+'_'+j,cmpFLabel(f)+'（只在這場）']);});return L;}
function cmpTrHtml(C,op,e,i){var T=e.tr,a='data-e="'+i+'"',num=function(f,v,w,ex){return cmpNum('data-i="cmpev" '+a+' data-f="'+f+'"'+(ex||''),v,w);};
  if(T.k==='time')return '<label>開戰後 '+num('tr.t',T.t||0,64,' min="0"')+' 分鐘</label>';
  if(T.k==='obj'){var L=op.obj.map(function(q){return [q.name,q.name];});op.ev.forEach(function(x){x.act.forEach(function(y){if(y.k==='obj'&&y.name)L.push([y.name,y.name+'（事件新增）']);});});if(!op.obj.length)for(var n=1;n<=(+op.nobj||2);n++)L.push([String(n),'第 '+n+' 個目標（自動選擇）']);
    return '<label>目標 '+cmpSelH('data-c="cmpev" '+a+' data-f="tr.obj"',[['','—']].concat(L),T.obj||'')+'</label><label>被 '+cmpSideSel(C,a,'tr.side',T.side)+' 佔領</label>';}
  if(T.k==='area')return '<label>'+cmpSideSel(C,a,'tr.side',T.side)+' 的部隊進入</label>'+cmpPosBtn(op,'ev.'+i+'.tr',T)+'<label>半徑 '+num('tr.r',T.r||1000,64,' min="100" step="100"')+' 公尺</label>';
  if(T.k==='lost')return '<label>'+cmpSideSel(C,a,'tr.side',T.side)+' 的 '+cmpSelH('data-c="cmpev" '+a+' data-f="tr.f"',cmpForceOpts(C,op,+T.side||0),T.f||'')+'</label>'+(T.f?'':'<label>名稱 <input type="text" data-i="cmpev" '+a+' data-f="tr.name" value="'+esc(T.name||'')+'" style="width:8em"></label>')+'<label>兵力剩 '+num('tr.pct',T.pct||0,52,' min="0" max="100"')+'% 以下（0＝被殲滅）</label>';
  if(T.k==='str')return '<label>'+cmpSideSel(C,a,'tr.side',T.side)+' 總兵力低於 '+num('tr.pct',T.pct||50,52,' min="1" max="100"')+'%</label>';
  if(T.k==='ev')return '<label>'+cmpSelH('data-c="cmpev" '+a+' data-f="tr.ev"',[['','—']].concat(op.ev.filter(function(x){return x!==e;}).map(function(x){return [x.id,'#'+(op.ev.indexOf(x)+1)+' '+(x.name||'')];})),T.ev||'')+' 發生之後</label>';
  return '';}
function cmpActHtml(C,op,e,i,x,j){var a='data-e="'+i+'"',p='act.'+j+'.',num=function(f,v,w,ex){return cmpNum('data-i="cmpev" '+a+' data-f="'+p+f+'"'+(ex||''),v,w);},txt=function(f,v,w,ph){return '<input type="text" data-i="cmpev" '+a+' data-f="'+p+f+'" value="'+esc(v||'')+'" style="width:'+(w||12)+'em"'+(ph?' placeholder="'+esc(ph)+'"':'')+'>';},sd=function(f,v,all){return cmpSideSel(C,a,p+f,v,all);};
  if(x.k==='dlg')return '<label>'+cmpSelH('data-c="cmpev" '+a+' data-f="'+p+'who"',[['','旁白']].concat(C.chars.map(function(c){return [c.id,c.name+(c.title?'（'+c.title+'）':'')];})),x.who||'')+' 對 '+sd('side',x.side,true)+' 說</label><textarea data-i="cmpev" '+a+' data-f="'+p+'txt" rows="2">'+esc(x.txt||'')+'</textarea>';
  if(x.k==='msg')return '<label>給 '+sd('side',x.side,true)+'</label>'+txt('txt',x.txt,22,'訊息內容');
  if(x.k==='reinf'){var src=x.f?x.f:'';return '<label>'+sd('side',x.side)+'</label><label>'+cmpSelH('data-c="cmpev" '+a+' data-f="'+p+'f"',[['','另外編組的部隊']].concat((C.forces[+x.side||0]||[]).map(function(f){return [f.id,'核心兵力：'+cmpFLabel(f)];})),src)+'</label>'+
      (x.f?'':'<label><select data-c="cmpev" '+a+' data-f="'+p+'pk" style="max-width:13em">'+cmpPkOpts(x.pk)+'</select></label><label>× '+num('n',x.n||1,44,' min="1" max="20"')+'</label>'+txt('name',x.name,8,'名稱')+'<label>'+cmpSelH('data-c="cmpev" '+a+' data-f="'+p+'gran"',CMPGRAN,x.gran||'co')+'</label>')+
      cmpPosBtn(op,'ev.'+i+'.act.'+j,x)+(x.x!==undefined&&x.x!==''?'<button type="button" class="lw-btn sm" data-a="cmpposclr" data-p="ev.'+i+'.act.'+j+'" title="改為從部署邊進場">從部署邊</button>':'<span class="lw-note">不指定＝從部署邊進場</span>');}
  if(x.k==='exit')return '<label>'+sd('side',x.side)+' 的 '+cmpSelH('data-c="cmpev" '+a+' data-f="'+p+'f"',cmpForceOpts(C,op,+x.side||0),x.f||'')+'</label>'+(x.f?'':txt('name',x.name,8,'部隊名稱'))+'<span class="lw-note">或範圍內的部隊</span>'+cmpPosBtn(op,'ev.'+i+'.act.'+j,x)+'<label>半徑 '+num('r',x.r||2000,60,' min="100" step="100"')+'</label><label>'+cmpSelH('data-c="cmpev" '+a+' data-f="'+p+'how"',[['move','走到部署邊撤離'],['now','立即離開戰場']],x.how||'move')+'</label>';
  if(x.k==='nuke')return '<label>'+sd('side',x.side)+' 引爆 '+num('Y',x.Y||10,64,' min="0.01" step="0.5"')+' 千噸</label>'+cmpPosBtn(op,'ev.'+i+'.act.'+j,x);
  if(x.k==='obj')return txt('name',x.name,8,'目標名稱')+'<label>分數 '+num('pts',x.pts||10,48,' min="1"')+'</label><label>範圍 '+num('r',x.r||800,60,' min="100" step="50"')+' 公尺</label>'+cmpPosBtn(op,'ev.'+i+'.act.'+j,x);
  if(x.k==='end')return '<label>'+cmpSelH('data-c="cmpev" '+a+' data-f="'+p+'win"',[['','不分勝負'],[0,C.sides[0].name+'獲勝'],[1,C.sides[1].name+'獲勝']],x.win===undefined?'':x.win)+'</label>'+txt('why',x.why,14,'結束的原因');
  return '';}
/* ---------- 作戰與劇情：編輯 ---------- */
function cmpOp(){return CMPE.c.ops[CMPE.sel];}
function cmpPaintSoon(){clearTimeout(CMPE.pt);CMPE.pt=setTimeout(cmpPaint,180);}
function cmpSetPath(o,path,v){var s=path.split('.');for(var i=0;i<s.length-1;i++){o=o[s[i]];if(o===undefined||o===null)return;}o[s[s.length-1]]=v;}
function cmpPathObj(op,p){var s=String(p).split('.');if(s[0]==='obj')return op.obj[+s[1]]||null;if(s[0]==='ev'){var e=op.ev[+s[1]];if(!e)return null;return s[2]==='tr'?e.tr:e.act[+s[3]]||null;}return null;}
function cmpDefPk(C,s){var sc=cmpScnFor(C.y),L=sc?(s?sc.B:sc.A):null;return L&&L[0]&&FPI[L[0][0]]?L[0][0]:(C.forces[s][0]||{}).k||Object.keys(FPI)[0];}
ACT.cmpopsel=function(b){CMPE.sel=+b.getAttribute('data-v');CMPE.pick=null;cmpBody();};
ACT.cmpopadd=function(){var C=CMPE.c,BM=CMPE.BM;if(!BM)return;var last=C.ops[C.ops.length-1],w=Math.min(20,Math.floor(BM.Wm/1000*0.4)),h=Math.min(15,Math.floor(BM.Hm/1000*0.4));
  C.ops.push(cmpOpNorm(C,{id:cmpId(C.ops,'op'),name:'第 '+(C.ops.length+1)+' 場作戰',x:last?last.x:Math.round(BM.Wm/2-w*500),y:last?last.y:Math.round(BM.Hm/2-h*500),w:w,h:h,cs:50}));CMPE.sel=C.ops.length-1;CMPE.pick='op';cmpSave();cmpBody();toast('在大地圖上點選這場作戰區域的中心');};
ACT.cmpopdel=function(){var C=CMPE.c,op=cmpOp();if(!op||!confirm('刪除作戰「'+op.name+'」？'))return;C.ops.splice(CMPE.sel,1);C.ops.forEach(function(q){['0','1','d'].forEach(function(k){if(q.next[k]===op.id)q.next[k]='';});});CMPE.sel=Math.max(0,CMPE.sel-1);cmpSave();cmpBody();};
ACT.cmpopmv=function(b){var C=CMPE.c,i=CMPE.sel,j=i+(+b.getAttribute('data-v'));if(j<0||j>=C.ops.length)return;var t=C.ops[i];C.ops[i]=C.ops[j];C.ops[j]=t;CMPE.sel=j;cmpSave();cmpBody();};
ACT.cmpopdup=function(){var C=CMPE.c,op=cmpClone(cmpOp());op.id=cmpId(C.ops,'op');op.name+='（複本）';C.ops.splice(CMPE.sel+1,0,op);CMPE.sel++;cmpSave();cmpBody();};
INP.cmpop=function(t){var op=cmpOp(),f=t.getAttribute('data-f');if(!op)return;op[f]=t.type==='number'?(t.value===''&&f==='hr'?'':num(t.value,op[f])):t.value;cmpSave();if(f==='w'||f==='h'||f==='name')cmpPaintSoon();};
CHG.cmpop=function(t){var op=cmpOp(),f=t.getAttribute('data-f');if(!op)return;op[f]=f==='cs'?+t.value:t.value;cmpSave();cmpBody();};
INP.cmpopkm=function(t){var op=cmpOp();if(!op)return;op[t.getAttribute('data-f')]=Math.round(num(t.value,0)*1000);cmpSave();cmpPaintSoon();};
CHG.cmpopdate=function(t){var op=cmpOp(),m=/^(\d{3,4})-(\d{2})-(\d{2})$/.exec(t.value||'');if(!op)return;if(m)op.date={y:+m[1],m:+m[2],d:+m[3]};else delete op.date;cmpSave();};
CHG.cmpopedge=function(t){var op=cmpOp();if(!op)return;op.edge=op.edge||cmpEdges(CMPE.c);op.edge[+t.getAttribute('data-s')]=t.value;cmpSave();cmpPaint();};
CHG.cmpuse=function(t){var op=cmpOp(),s=+t.getAttribute('data-s'),id=t.getAttribute('data-v'),L=op.sides[s].use;if(t.checked){if(L.indexOf(id)<0)L.push(id);}else op.sides[s].use=L.filter(function(x){return x!==id;});cmpSave();};
function cmpFoList(t){var op=cmpOp();return op?op.sides[+t.getAttribute('data-s')].add:[];}
CHG.cmpfo=function(t){var L=cmpFoList(t),j=+t.getAttribute('data-j');if(!L[j])return;L[j][t.getAttribute('data-f')]=t.value;cmpSave();};
INP.cmpfo=function(t){var L=cmpFoList(t),j=+t.getAttribute('data-j'),f=t.getAttribute('data-f');if(!L[j])return;L[j][f]=f==='n'?clamp(num(t.value,1),1,40):t.value;cmpSave();};
ACT.cmpfoadd=function(b){var op=cmpOp(),s=+b.getAttribute('data-s');if(!op)return;op.sides[s].add.push({k:cmpDefPk(CMPE.c,s),n:1,name:'',gran:'co'});cmpSave();cmpBody();};
ACT.cmpfodel=function(b){var op=cmpOp(),s=+b.getAttribute('data-s');if(!op)return;op.sides[s].add.splice(+b.getAttribute('data-j'),1);cmpSave();cmpBody();};
CHG.cmpobjpl=function(t){var op=cmpOp(),p=cmpPL()[+t.value];if(!op||!p||t.value==='')return;op.obj.push({name:p.name,x:Math.round(p.x),y:Math.round(p.y),pts:p.kind==='city'?30:p.kind==='town'?15:8,r:Math.round(clamp((p.r||300)*1.2,400,3000)/50)*50});cmpSave();cmpBody();};
ACT.cmpobjadd=function(){var op=cmpOp();if(!op)return;op.obj.push({name:'目標 '+(op.obj.length+1),pts:10,r:800});CMPE.pick='obj.'+(op.obj.length-1);cmpSave();cmpBody();toast('在「作戰區域」圖上點選目標的位置');};
ACT.cmpobjdel=function(b){var op=cmpOp();if(!op)return;op.obj.splice(+b.getAttribute('data-j'),1);cmpSave();cmpBody();};
INP.cmpobj=function(t){var op=cmpOp(),q=op&&op.obj[+t.getAttribute('data-j')],f=t.getAttribute('data-f');if(!q)return;q[f]=t.type==='number'?num(t.value,q[f]):t.value;cmpSave();cmpPaintSoon();};
INP.cmpopdeb=function(t){var op=cmpOp();if(!op)return;op.deb[t.getAttribute('data-v')]=t.value;cmpSave();};
CHG.cmpopnx=function(t){var op=cmpOp();if(!op)return;op.next[t.getAttribute('data-v')]=t.value;cmpSave();};
ACT.cmpevadd=function(){var op=cmpOp();if(!op)return;op.ev.push({id:cmpId(op.ev,'e'),name:'',tr:{k:'time',t:60},act:[{k:'dlg',who:(CMPE.c.chars[0]||{}).id||'',side:'',txt:''}]});cmpSave();cmpBody();};
ACT.cmpevdel=function(b){var op=cmpOp(),i=+b.getAttribute('data-e'),e=op&&op.ev[i];if(!e)return;op.ev.splice(i,1);op.ev.forEach(function(x){if(x.tr.ev===e.id)x.tr.ev='';});CMPE.pick=null;cmpSave();cmpBody();};
INP.cmpev=function(t){var op=cmpOp(),e=op&&op.ev[+t.getAttribute('data-e')];if(!e)return;var f=t.getAttribute('data-f');cmpSetPath(e,f,t.type==='number'?(t.value===''?'':num(t.value,0)):t.value);cmpSave();if(/\.(r|name)$/.test(f))cmpPaintSoon();};
CHG.cmpev=function(t){var op=cmpOp(),e=op&&op.ev[+t.getAttribute('data-e')];if(!e)return;var f=t.getAttribute('data-f');cmpSetPath(e,f,t.value);
  var m=/^act\.(\d+)\.(f|side)$/.exec(f),x=m?e.act[+m[1]]:null;if(x&&x.k==='reinf'&&!x.f&&!x.pk)x.pk=cmpDefPk(CMPE.c,+x.side||0);if(x&&m[2]==='side'&&x.f&&!(CMPE.c.forces[+x.side||0]||[]).some(function(q){return q.id===x.f;}))x.f='';
  cmpSave();cmpBody();};
CHG.cmpactadd=function(t){var op=cmpOp(),e=op&&op.ev[+t.getAttribute('data-e')],k=t.value,C=CMPE.c;if(!e||!k)return;
  var D={dlg:{k:'dlg',who:(C.chars[0]||{}).id||'',side:'',txt:''},msg:{k:'msg',side:'',txt:''},reinf:{k:'reinf',side:0,f:(C.forces[0][0]||{}).id||'',pk:cmpDefPk(C,0),n:1,gran:'co'},exit:{k:'exit',side:1,f:'',how:'move',r:2000},nuke:{k:'nuke',side:1,Y:10},obj:{k:'obj',name:'新目標',pts:10,r:800},end:{k:'end',win:'',why:'劇情結束'}}[k];
  e.act.push(D);if(k==='nuke'||k==='obj')CMPE.pick='ev.'+op.ev.indexOf(e)+'.act.'+(e.act.length-1);cmpSave();cmpBody();if(CMPE.pick)toast('在「作戰區域」圖上點選位置');};
ACT.cmpactdel=function(b){var op=cmpOp(),e=op&&op.ev[+b.getAttribute('data-e')];if(!e)return;e.act.splice(+b.getAttribute('data-j'),1);CMPE.pick=null;cmpSave();cmpBody();};
ACT.cmppick=function(b){var p=b.getAttribute('data-p');CMPE.pick=CMPE.pick===p?null:p;cmpBody();if(CMPE.pick)toast(p==='op'?'在大地圖上點選作戰區域的中心':'在「作戰區域」圖上點選位置');};
ACT.cmpposclr=function(b){var op=cmpOp(),o=op&&cmpPathObj(op,b.getAttribute('data-p'));if(!o)return;delete o.x;delete o.y;cmpSave();cmpBody();};
/* 點大地圖：放置作戰區域、選取作戰或地點 */
ACT.cmpcvclk=function(b,e){var BM=CMPE.BM;if(!BM)return;var m=cmpCvXY(b,e,BM.Wm,BM.Hm),C=CMPE.c,op=cmpOp();
  if(CMPE.tab==='ops'&&CMPE.pick==='op'&&op){var R=cmpOpRect(BM,op);op.x=Math.round(clamp(m[0]-R.Wm/2,0,Math.max(0,BM.Wm-R.Wm)));op.y=Math.round(clamp(m[1]-R.Hm/2,0,Math.max(0,BM.Hm-R.Hm)));CMPE.pick=null;cmpSave();cmpBody();return;}
  if(CMPE.tab==='ops'){for(var i=C.ops.length-1;i>=0;i--){var Q=cmpOpRect(BM,C.ops[i]);if(m[0]>=Q.x0&&m[1]>=Q.y0&&m[0]<=Q.x0+Q.Wm&&m[1]<=Q.y0+Q.Hm){if(i!==CMPE.sel){CMPE.sel=i;cmpBody();}return;}}return;}
  var P=cmpPL(),bi=-1,bd=3000;P.forEach(function(p,i){var d=dist(p.x,p.y,m[0],m[1])-(p.r||0);if(d<bd){bd=d;bi=i;}});if(bi<0)return;
  if(CMPE.tab==='pl'){if(!CMPE.plAll&&!cmpEl('cmppl'+bi)){CMPE.plAll=true;CMPE.plq='';cmpBody();}cmpHiPl(bi,true);return;}
  var p=P[bi],F=cmpFacsOf()[bi];toast(p.name+'（'+(CMPKN[p.kind]||'')+'）人口 '+fmt(Math.round(p.pop))+(p.inh?'':'・無人居住')+'・'+cmpPlaceTxt(p)+(F&&F.length?'・'+cmpFacTxt(F):''),5000);};
ACT.cmpocvclk=function(b,e){var op=cmpOp(),BM=CMPE.BM;if(!op||!BM)return;var R=cmpOpRect(BM,op),m=cmpCvXY(b,e,R.Wm,R.Hm),X=Math.round(R.x0+m[0]),Y=Math.round(R.y0+m[1]);
  if(CMPE.pick&&CMPE.pick!=='op'){var o=cmpPathObj(op,CMPE.pick);if(o){o.x=X;o.y=Y;}CMPE.pick=null;cmpSave();cmpBody();return;}
  toast('位置：區域內 '+cmpKm(m[0])+', '+cmpKm(m[1])+' 公里');};
/* 作戰區域圖：大地圖放大或區域地圖預覽，加上部署邊、目標與事件的位置 */
function cmpDrawOp(cv,op){var C=CMPE.c,BM=CMPE.BM,R=cmpOpRect(BM,op),pv=CMPE.prev[cmpPvKey(op)],Wd=Math.round(clamp(R.Wm/R.Hm*400,320,640)),k=Wd/R.Wm,Hd=Math.round(R.Hm*k);cv.width=Wd;cv.height=Hd;var c=cv.getContext('2d');
  if(pv)c.drawImage(pv.img.cv,0,0,Wd,Hd);else{var img=cmpBigImg(),s=img.S/BM.cs;c.imageSmoothingEnabled=false;c.drawImage(img.cv,R.x0*s,R.y0*s,R.Wm*s,R.Hm*s,0,0,Wd,Hd);c.imageSmoothingEnabled=true;
    cmpPL().forEach(function(p){if(p.x<R.x0||p.y<R.y0||p.x>R.x0+R.Wm||p.y>R.y0+R.Hm)return;var x=(p.x-R.x0)*k,y=(p.y-R.y0)*k;c.beginPath();c.arc(x,y,Math.max(2,(p.r||300)*k*0.5),0,Math.PI*2);c.fillStyle=p.inh?'rgba(90,70,60,.55)':'rgba(140,140,140,.4)';c.fill();c.font='11px sans-serif';c.lineWidth=3;c.strokeStyle='rgba(255,255,255,.85)';c.fillStyle='#222';c.strokeText(p.name,x+4,y-4);c.fillText(p.name,x+4,y-4);});}
  [0,1].forEach(function(s){var e=(op.edge||[])[s],t=6;c.fillStyle=C.sides[s].color;if(e==='W')c.fillRect(0,0,t,Hd);else if(e==='E')c.fillRect(Wd-t,0,t,Hd);else if(e==='N')c.fillRect(0,0,Wd,t);else if(e==='S')c.fillRect(0,Hd-t,Wd,t);});
  var mark=function(x,y,ic,col,lbl,r){if(x===undefined||x==='')return;var px=(x-R.x0)*k,py=(y-R.y0)*k;if(r){c.save();c.setLineDash([5,4]);c.strokeStyle=col;c.lineWidth=1.5;c.beginPath();c.arc(px,py,r*k,0,Math.PI*2);c.stroke();c.restore();}
    c.font='bold 16px sans-serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle='rgba(255,255,255,.9)';c.strokeText(ic,px,py+6);c.fillStyle=col;c.fillText(ic,px,py+6);c.textAlign='left';if(lbl){c.font='11px sans-serif';c.strokeText(lbl,px+9,py-6);c.fillStyle='#222';c.fillText(lbl,px+9,py-6);}};
  op.obj.forEach(function(q){mark(q.x,q.y,'★','#c88a00',q.name,q.r);});
  op.ev.forEach(function(e,i){var T=e.tr,n=e.name||('#'+(i+1));if(T.k==='area')mark(T.x,T.y,'◎',C.sides[+T.side||0].color,n,T.r||1000);
    e.act.forEach(function(a){if(a.k==='reinf')mark(a.x,a.y,'➤',C.sides[+a.side||0].color,n);else if(a.k==='exit')mark(a.x,a.y,'⇤',C.sides[+a.side||0].color,n,a.r||2000);else if(a.k==='nuke')mark(a.x,a.y,'☢','#c62828',n+'（'+(a.Y||10)+' 千噸）');else if(a.k==='obj')mark(a.x,a.y,'★','#c88a00',a.name||n,a.r);});});}
ACT.cmppv=async function(){var op=cmpOp(),C=CMPE.c;if(!op||CMPE.busy)return;CMPE.busy=true;try{var BM=await cmpBigGet(C),t0=performance.now(),MP=await cmpRegionMake(C,BM,op,cmpPg()),img=renderMap(MP,{S:MP.GW*MP.GH>250000?1:2,month:C.m||6,contour:false});
    CMPE.prev[cmpPvKey(op)]={img:img,info:'區域地圖 '+MP.GW+' × '+MP.GH+' 格、'+(MP.set||[]).length+' 個聚落（'+(MP.set||[]).filter(function(s){return s.bi!==undefined;}).length+' 個來自大地圖），'+fx((performance.now()-t0)/1000,1)+' 秒'};cmpPgDone('');}catch(e){cmpPgDone('預覽失敗：'+e.message);console.error(e);}CMPE.busy=false;cmpBody();};
/* ---------- 五、進行戰役 ---------- */
function cmpRun(){return G&&G.cmp&&G.cmp.camp&&G.cmp.prog?{C:G.cmp.camp,P:G.cmp.prog}:null;}
function cmpOpById(C,id){return (C.ops||[]).filter(function(o){return o.id===id;})[0]||null;}
function cmpDateTxt(D){return D?D.y+' 年 '+D.m+' 月 '+D.d+' 日 '+(D.h!==undefined?D.h+' 時':''):'';}
function cmpAddSec(D,sec){var t=new Date(Date.UTC(D.y,D.m-1,D.d,D.h||0)+sec*1000);return {y:t.getUTCFullYear(),m:t.getUTCMonth()+1,d:t.getUTCDate(),h:t.getUTCHours()};}
/* 這場作戰的開始日期：指定的日期，或上一場結束後幾天 */
function cmpOpDate(C,P,op){var hr=op.hr!==undefined&&op.hr!==''?clamp(+op.hr,0,23):null,D;if(op.date&&op.date.y)D={y:op.date.y,m:op.date.m,d:op.date.d,h:hr!==null?hr:C.h};else if(!P.hist.length)D={y:C.y,m:C.m,d:C.d,h:C.h};else{D=cmpAddSec(P.date,(+op.gap||0)*86400);if(hr!==null)D.h=hr;}
  if(hr!==null&&!op.date&&P.hist.length){var t0=Date.UTC(P.date.y,P.date.m-1,P.date.d,P.date.h),t1=Date.UTC(D.y,D.m-1,D.d,D.h);if(t1<t0)D=cmpAddSec(D,86400);}return D;}
function cmpCheck(C){var e=[];if(C.big.src==='file'&&!C.BMp)e.push('還沒有匯入大地圖。');if(C.big.src==='world'&&!C.BMp)e.push('還沒有由世界地圖產生大地圖。');if(!C.ops.length)e.push('還沒有作戰。');
  C.ops.forEach(function(op){[0,1].forEach(function(s){var S=op.sides[s];if(!S.use.some(function(id){return C.forces[s].some(function(f){return f.id===id;});})&&!S.add.length&&!op.ev.some(function(x){return x.act.some(function(a){return a.k==='reinf'&&+a.side===s;});}))e.push('「'+op.name+'」裡'+C.sides[s].name+'沒有兵力。');});
    var cs=+op.cs||50;if(op.w*1000/cs*op.h*1000/cs>1.4e6)e.push('「'+op.name+'」的區域格數過多。');});return e;}
function cmpPgPlay(){var R=cmpRun(),o='';
  if(!R){var C=CMPE.c,er=cmpCheck(C),pv=cmpPlayerV(C);o='<div class="lw-card"><h3>進行戰役「'+esc(C.name)+'」<small>依序（或依勝負分支）進行各場作戰：開打前產生區域地圖、建立兵力與目標，結束後延續兵力與戰區的控制</small></h3>'+(C.desc?'<div class="lw-cmptxt">'+cmpTxt(C.desc)+'</div>':'')+
      '<div class="lw-note">共 '+C.ops.length+' 場作戰：'+C.ops.map(function(op){return '「'+esc(op.name)+'」';}).join('、')+'。'+(pv===2?'雙方都由玩家指揮。':pv===3?'雙方都由電腦指揮（觀戰）。':'玩家指揮'+esc(C.sides[pv].name)+'。')+'</div>'+
      (er.length?'<ul class="lw-err">'+er.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'')+
      '<div class="lw-row"><button type="button" class="lw-btn pri" data-a="cmpstart"'+(er.length||CMPE.busy?' disabled':'')+'>開始戰役</button></div></div>';
    if(CMPE.BM&&!cmpBigStale())o+='<div class="lw-card"><div class="lw-cmpmap"><canvas data-k="cmpcv" data-v="play" data-a="cmpcvclk"></canvas></div></div>';return o;}
  var C2=R.C,P=R.P,X=G.cmp,own=cmpOwnSum(C2,P);
  o='<div class="lw-card"><h3>戰役「'+esc(C2.name)+'」<small>'+(P.fin?'戰役已結束':'第 '+(P.hist.length+(X.res?0:1))+' 場作戰'+(X.res?'結束':'進行中'))+'</small></h3>'+
    '<table class="lw-tbl"><tr><th>場次</th><th>作戰</th><th>開始</th><th>結果</th><th class="n">'+esc(C2.sides[0].name)+'傷亡</th><th class="n">'+esc(C2.sides[1].name)+'傷亡</th></tr>'+
    P.hist.map(function(h,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(h.name)+'</td><td>'+cmpDateTxt(h.date)+'</td><td>'+(h.win>=0?esc(C2.sides[h.win].name)+'獲勝':'不分勝負')+'（'+esc(h.why||'')+'）</td><td class="n">'+fmt(h.cas[0]||0)+'</td><td class="n">'+fmt(h.cas[1]||0)+'</td></tr>';}).join('')+
    (!X.res?'<tr><td>'+(P.hist.length+1)+'</td><td>'+esc(X.oname)+'</td><td>'+cmpDateTxt(X.date)+'</td><td>進行中</td><td></td><td></td></tr>':'')+'</table>'+
    '<div class="lw-note">戰區控制：'+[0,1].map(function(s){return esc(C2.sides[s].name)+' '+own[s].n+' 個聚落（人口約 '+fmt(Math.round(own[s].pop))+'）';}).join('、')+'</div>';
  if(!X.res)o+='<div class="lw-row"><button type="button" class="lw-btn" data-a="cmpbrief">重看簡報</button><button type="button" class="lw-btn pri" data-a="tab" data-v="'+(G.started?'battle':'deploy')+'">回到作戰</button><label><input type="checkbox" data-c="cmppause"'+(G.set.cmpPause!==false?' checked':'')+'>對白出現時暫停作戰</label></div>';
  else if(!P.fin){var nop=cmpOpById(C2,P.cur);o+='<div class="lw-row"><button type="button" class="lw-btn pri" data-a="cmpnext"'+(CMPE.busy?' disabled':'')+'>開始下一場作戰：「'+esc(nop?nop.name:'')+'」</button><button type="button" class="lw-btn" data-a="cmpdeb">再看一次講評</button></div>';}
  else o+=(P.fin.txt?'<div class="lw-cmptxt">'+cmpTxt(P.fin.txt)+'</div>':'')+'<div class="lw-row"><button type="button" class="lw-btn" data-a="cmpdeb">再看一次講評</button></div>';
  o+='</div><div class="lw-card"><h3>戰區<small>聚落的顏色是控制方；作戰區域依勝方著色</small></h3>'+(CMPE.BM&&CMPE.bk===cmpBigKey(C2)?'<div class="lw-cmpmap"><canvas data-k="cmpcv" data-v="play"></canvas></div>':'<div class="lw-note">大地圖產生中…</div>')+'</div>';
  if(!(CMPE.BM&&CMPE.bk===cmpBigKey(C2))&&!CMPE.busy){CMPE.busy=true;cmpBigGet(C2).then(function(){CMPE.busy=false;cmpPgDone('');if(UI.tab==='cmp')cmpBody();},function(e){CMPE.busy=false;cmpPgDone('大地圖產生失敗：'+e.message);});}
  return o;}
function cmpOwnSum(C,P){var BM=CMPE.BM,o=[{n:0,pop:0},{n:0,pop:0}];if(!BM||CMPE.bk!==cmpBigKey(C))return o;cmpPlaces(BM,C.places).forEach(function(p,i){var s=cmpOwnOf(C,BM,P,i,p);if(o[s]){o[s].n++;o[s].pop+=p.inh?p.pop:0;}});return o;}
CHG.cmppause=function(t){if(G)G.set.cmpPause=t.checked;};
function cmpMpOn(){if(typeof mpActive==='function'&&mpActive()){toast('聯機作戰中不能開始戰役；請先離開房間。要在聯機房間進行戰役中的作戰，先在單機開始那場作戰，再到房間按「使用單機版目前的作戰」。',7000);return true;}return false;}
ACT.cmpstart=function(){var C=CMPE.c;if(CMPE.busy||cmpMpOn())return;if(G&&G.started&&!G.over&&!confirm('開始戰役會離開目前的作戰（請先存檔）。確定嗎？'))return;var C2=cmpClone(C),P={cur:C2.ops[0].id,hist:[],st:[{},{}],own:{},date:{y:C2.y,m:C2.m,d:C2.d,h:C2.h},fin:null};cmpStartOp(C2,P,C2.ops[0]);};
ACT.cmpnext=function(){var R=cmpRun();if(!R||!G.cmp.res||R.P.fin||cmpMpOn())return;root.querySelectorAll('.lw-dlg').forEach(function(d){d.remove();});var P=cmpClone(R.P),op=cmpOpById(R.C,P.cur);if(op)cmpStartOp(R.C,P,op);};
ACT.cmpbrief=function(){cmpBriefDlg();};
ACT.cmpdeb=function(){cmpDebrief();};
/* 建立一場作戰：區域地圖、日期、雙方兵力（延續上一場的狀態）、部署、目標、劇情事件 */
async function cmpStartOp(C,P,op){if(CMPE.busy)return;CMPE.busy=true;if(UI.tab!=='cmp'){CMPE.tab='play';show('cmp');}var pg=cmpPg();
  try{var BM=await cmpBigGet(C,pg),MP=await cmpRegionMake(C,BM,op,pg),D=cmpOpDate(C,P,op),R=cmpOpRect(BM,op);MP.name=op.name||MP.name;
    newScenario(MP,Object.assign({y:D.y,m:D.m,d:D.d,h:D.h,dur:+op.dur||24},stSet(ST0)));
    [0,1].forEach(function(s){var S=G.sides[s],CS=C.sides[s],OS=op.sides[s]||{},use=OS.use||[];S.name=CS.name;S.color=CS.color;S.ai=!!CS.ai;S.edge=(op.edge||cmpEdges(C))[s]||S.edge;
      var T=cmpApplyState(cmpBuild(s,C.forces[s].filter(function(f){return use.indexOf(f.id)>=0;}),C.seed),P.st[s]),A=cmpBuild(s,(OS.add||[]).map(function(f,j){return Object.assign({},f,{id:'o'+op.id+'_'+j});}),C.seed+'|op|'+op.id);
      autoDeploy2(s,T.concat(A));});
    if(op.obj.length){G.obj=op.obj.map(function(q,i){var x=q.x===undefined||q.x===''?R.Wm/2:q.x-R.x0,y=q.y===undefined||q.y===''?R.Hm/2:q.y-R.y0;return {id:i+1,name:q.name||('目標 '+(i+1)),x:clamp(x,MP.cs,MP.Wm-MP.cs),y:clamp(y,MP.cs,MP.Hm-MP.cs),pts:+q.pts||10,own:-1,r:+q.r||800};});}else autoObjectives(+op.nobj||2);
    /* 目標在聚落裡：由目前控制該聚落的一方開始持有 */var PL=cmpPlaces(BM,C.places);(G.obj||[]).forEach(function(ob){(MP.set||[]).forEach(function(s){if(s.bi===undefined)return;if(dist(ob.x,ob.y,s.x*MP.cs,s.y*MP.cs)<=Math.max(s.r||300,400))ob.own=cmpOwnOf(C,BM,P,s.bi,PL[s.bi]);});});
    G.cmp={cname:C.name,oname:op.name,op:op.id,x0:R.x0,y0:R.y0,seed:C.seed,ev:cmpClone(op.ev||[]),dq:[],chars:cmpClone(C.chars||[]),forces:cmpClone(C.forces),rs:(hstr(C.seed+'|'+op.id)|0)||1,date:D,camp:C,prog:P};
    G.set.cmpPause=true;dupNames();CMPU.k=null;CMPU.q=[];if(CMPU.box){CMPU.box.remove();CMPU.box=null;}cmpPgDone('');CMPE.busy=false;show('deploy');cmpBriefDlg();toast('「'+op.name+'」已建立並自動部署。可在「部署」調整位置，按 ▶ 開戰。',6000);}
  catch(e){CMPE.busy=false;cmpPgDone('建立作戰失敗：'+e.message);console.error(e);}}
function cmpBriefDlg(){if(!G||!G.cmp)return;var X=G.cmp,C=X.camp,op=C?cmpOpById(C,X.op):null,ed={W:'西',E:'東',N:'北',S:'南'};
  var o='<h3>'+esc(X.cname||'')+'：'+esc(X.oname||'')+'</h3><div class="lw-note">'+cmpDateTxt(X.date)+(op?'・作戰區域 '+op.w+' × '+op.h+' 公里・時限 '+(op.dur||24)+' 小時':'')+'</div>'+(op&&op.brief?'<div class="lw-cmptxt">'+cmpTxt(op.brief)+'</div>':'')+
    '<table class="lw-tbl"><tr><th></th><th>兵力</th><th>進場</th></tr>'+[0,1].map(function(s){var S=G.sides[s],T=G.units.filter(function(u){return u.side===s&&u.p<0&&u.st!=='off';});return '<tr><td><span class="lw-sw" style="background:'+esc(S.color)+'"></span> '+esc(S.name)+(S.ai?'（電腦）':'（玩家）')+'</td><td>'+(T.map(function(u){return esc(uName(u));}).join('、')||'—')+'</td><td>'+(ed[S.edge]||'')+'側</td></tr>';}).join('')+'</table>'+
    '<div class="lw-note">作戰目標：'+((G.obj||[]).map(function(q){return esc(q.name)+'（'+q.pts+' 分'+(q.own>=0?'，'+esc(G.sides[q.own].name)+'控制':'')+'）';}).join('、')||'—')+'</div>'+
    '<div class="lw-row"><button type="button" class="lw-btn pri" data-a="x">開始部署</button></div>';dlg(o,true);}
/* 作戰結束：記入戰役進度（兵力狀態、戰區控制、戰果），依勝負決定下一場 */
function cmpAdvance(){var X=G.cmp,C=X.camp,P=X.prog,res=X.res,op=C?cmpOpById(C,X.op):null;if(!C||!P||!res||X.adv)return;X.adv=1;
  [0,1].forEach(function(s){var st=(res.st||[])[s]||{};P.st[s]=P.st[s]||{};Object.keys(st).forEach(function(k){P.st[s][k]=st[k];});});
  /* 易手的聚落：和作戰前的控制方比較 */var chg=0,BM=CMPE.BM&&CMPE.bk===cmpBigKey(C)?CMPE.BM:null,PL=BM?cmpPlaces(BM,C.places):null;Object.keys(res.own||{}).forEach(function(k){var was=PL&&PL[k]?cmpOwnOf(C,BM,P,+k,PL[k]):P.own[k];if(was!==undefined&&was!==res.own[k])chg++;P.own[k]=res.own[k];});
  P.hist.push({op:X.op,name:X.oname,win:res.win,why:res.why,t:res.t,cas:res.cas||[0,0],date:X.date,chg:chg});P.date=cmpAddSec(X.date||P.date,res.t||0);
  var key=res.win<0?'d':String(res.win),nx=op?(op.next||{})[key]:'',nop=null;if(nx==='end')nop=null;else if(nx)nop=cmpOpById(C,nx);else if(op){var i=C.ops.indexOf(op);nop=C.ops[i+1]||null;}
  if(nop)P.cur=nop.id;else{P.cur=null;P.fin={win:res.win,txt:(C.fin||{})[key]||''};}}
function cmpDebrief(){if(!G||!G.cmp||!G.cmp.res)return;var X=G.cmp,res=X.res,C=X.camp,op=C?cmpOpById(C,X.op):null,key=res.win<0?'d':String(res.win),txt=op&&op.deb?op.deb[key]:'',P=X.prog;
  var o='<h3>作戰「'+esc(X.oname||'')+'」結束</h3><p><b>'+(res.win>=0?esc(G.sides[res.win].name)+'獲勝':'不分勝負')+'</b>（'+esc(res.why||'')+'）'+(res.t?'・歷時 '+durTxt(res.t):'')+'</p>'+
    (res.cas?'<table class="lw-tbl"><tr><th></th><th class="n">傷亡</th></tr>'+[0,1].map(function(s){return '<tr><td>'+esc(G.sides[s].name)+'</td><td class="n">'+fmt(res.cas[s]||0)+'</td></tr>';}).join('')+'</table>':'')+(txt?'<div class="lw-cmptxt">'+cmpTxt(txt)+'</div>':'');
  var hl=P&&P.hist?P.hist[P.hist.length-1]:null;if(hl&&hl.op===X.op&&hl.chg)o+='<div class="lw-note">這場作戰後有 '+hl.chg+' 個聚落易手。</div>';
  if(C&&P){if(P.fin){var own=cmpOwnSum(C,P);o+='<h4>戰役「'+esc(C.name)+'」結束</h4>'+(P.fin.txt?'<div class="lw-cmptxt">'+cmpTxt(P.fin.txt)+'</div>':'')+'<div class="lw-note">共 '+P.hist.length+' 場作戰：'+P.hist.map(function(h){return esc(h.name)+'（'+(h.win>=0?esc(C.sides[h.win].name)+'勝':'平')+'）';}).join('→')+'。'+(own[0].n+own[1].n?'戰區控制：'+[0,1].map(function(s){return esc(C.sides[s].name)+' '+own[s].n+' 個聚落';}).join('、')+'。':'')+'</div><div class="lw-row"><button type="button" class="lw-btn" data-a="x">關閉</button></div>';}
    else{var nop=cmpOpById(C,P.cur);o+='<div class="lw-row"><button type="button" class="lw-btn pri" data-a="cmpnext">開始下一場作戰：「'+esc(nop?nop.name:'')+'」</button><button type="button" class="lw-btn" data-a="x">留在戰場</button></div><div class="lw-note">要保留這場作戰的結果，可以先存檔；之後在「戰役」分頁也能開始下一場。</div>';}}
  else o+='<div class="lw-row"><button type="button" class="lw-btn" data-a="x">關閉</button></div>';
  dlg(o,true);}
/* ---------- 對白與講評：作戰進行時檢查新的對白（只顯示給觀看的一方）與作戰結果 ---------- */
function cmpDK(D){return D.t+'|'+(D.who||'')+'|'+D.side+'|'+D.txt;}
function cmpWatch(){if(!G||!G.cmp)return;var X=G.cmp,dq=X.dq||[],k=(X.cname||'')+'|'+(X.oname||'')+'|'+(X.op||'')+'|'+(G.map&&G.map.seed||'');
  /* 換了一場作戰（或讀取存檔、加入聯機）：之前的對白不再顯示；聯機時作戰結束會換成全面揭曉的畫面，仍是同一場作戰 */
  if(CMPU.k!==k){CMPU.k=k;CMPU.shown={};dq.forEach(function(D){CMPU.shown[cmpDK(D)]=1;});CMPU.q=[];CMPU.resShown=!!X.res;if(CMPU.box){CMPU.box.remove();CMPU.box=null;}/* 讀取的存檔裡作戰已結束、還沒記入戰役進度 */if(X.res&&X.camp&&!X.adv)cmpAdvance();}
  var me=UI.side,nw=0;dq.forEach(function(D){var dk=cmpDK(D);if(CMPU.shown[dk])return;CMPU.shown[dk]=1;if(G.over||X.res)return;if(D.side<0||me<0||D.side===me||D.side===undefined){CMPU.q.push(D);nw++;}});if(nw)cmpDlgNext();
  if(X.res&&!CMPU.resShown){CMPU.resShown=true;if(X.camp)cmpAdvance();cmpDebrief();if(UI.tab==='cmp')cmpBody();}}
function cmpDlgNext(){if(CMPU.box)return;var D=CMPU.q.shift();if(!D)return;var pt='';try{if(D.ps)pt=ptSvg(ptAuto(D.ps+'|'+D.n,{fem:!!D.f,y:(G.cmp.camp&&G.cmp.camp.y)||G.set.y,ech:6,side:D.cs>=0?D.cs:0}),64);}catch(e){}
  var d=document.createElement('div');d.className='lw-cmpdlg';d.innerHTML=(pt?'<div>'+pt+'</div>':'')+'<div class="tx">'+(D.n?'<b>'+esc(D.n)+'</b>'+(D.ti?'<small>'+esc(D.ti)+'</small>':''):'')+'<p'+(D.n?'':' style="font-style:italic"')+'>'+cmpTxt(D.txt)+'</p></div><button type="button" class="lw-btn sm" data-a="cmpdlgok">'+(CMPU.q.length?'下一則（'+CMPU.q.length+'）':'繼續')+'</button>';root.appendChild(d);CMPU.box=d;}
ACT.cmpdlgok=function(){if(CMPU.box){CMPU.box.remove();CMPU.box=null;}cmpDlgNext();};
setInterval(function(){try{cmpWatch();}catch(e){}},400);
/* ---------- 範例戰役：1985 年冬，北方平原（三場作戰：邊境突破、鐵路樞紐、最後的防線；增援、撤退、核彈與分支） ---------- */
ACT.cmpdemo=function(){if(CMPE.busy){toast('大地圖產生中，請稍候。');return;}if(CMPE.c&&CMPE.c.ops.length&&!confirm('載入範例戰役會取代目前編輯中的戰役（請先匯出存檔）。確定嗎？'))return;
  var C=cmpNew(1985);C.name='北方平原戰役（範例）';C.desc='1985 年冬，北方平原。聯合軍要在三場作戰裡突破北方軍的邊境防線、奪取鐵路樞紐，最後逼北方軍退出戰區。北方軍握有戰術核武，一旦戰況惡化就可能動用。';
  C.seed='demo1985';C.m=1;C.d=15;C.h=6;C.sides[0].name='聯合軍';C.sides[1].name='北方軍';Object.assign(C.big,{ter:'plain',clim:'continental',lat:52,W:90,H:60,cs:500,front:{dir:'WE',f:0.4}});
  C.forces=[[{id:'fa1',k:'d1970',n:1,name:'第三機械化師',gran:'co'},{id:'fa2',k:'tr1970',n:1,name:'第十一戰車團',gran:'co'}],[{id:'fb1',k:'d1970',n:1,name:'第八近衛師',gran:'co'},{id:'fb2',k:'tr1970',n:1,name:'第四近衛戰車團',gran:'co'}]];
  C.chars=[{id:'c1',name:'韓立衡',title:'聯合軍司令',side:0,f:0},{id:'c2',name:'沈若芸',title:'情報參謀',side:0,f:1},{id:'c3',name:'葉戈爾・沃羅寧',title:'北方軍司令',side:1,f:0}];
  C.fin={'0':'聯合軍收復了整個北方平原。勝利的代價是被戰火摧毀的城鎮，和數以千計的傷亡。','1':'北方軍守住了平原，聯合軍的攻勢以失敗告終。','d':'戰線在平原上凝固，雙方開始談判。'};
  C._demo=1;CMPE.c=C;CMPE.BM=null;CMPE.bk='';CMPE.sel=0;CMPE.tab='ops';cmpSave();show('cmp');};
function cmpOpsDemo(C,BM){var P=cmpPlaces(BM,C.places),W=BM.Wm,H=BM.Hm,w=Math.min(20,Math.floor(W/1000*0.3)),h=Math.min(15,Math.floor(H/1000*0.4));
  var at=function(cx,cy){return {x:Math.round(clamp(cx-w*500,0,W-w*1000)),y:Math.round(clamp(cy-h*500,0,H-h*1000))};};
  /* 鐵路樞紐：前線以東、有鐵路經過的最大聚落 */var hub=P.filter(function(p){return p.x>W*0.5&&p.x<W*0.72&&p.rl;}).sort(function(a,b){return b.pop-a.pop;})[0]||P.filter(function(p){return p.x>W*0.5&&p.x<W*0.72;}).sort(function(a,b){return b.pop-a.pop;})[0];
  var hx=hub?hub.x:W*0.6,hy=hub?hub.y:H*0.5,hn=hub?hub.name:'鐵路樞紐';
  var o1=cmpOpNorm(C,Object.assign({id:'op1',name:'邊境突破',w:w,h:h,cs:50,dur:24,nobj:2},at(W*0.4,H*0.5)));
  o1.sides=[{use:['fa1'],add:[]},{use:['fb1'],add:[]}];
  o1.brief='北方軍沿邊境構築了防線。第三機械化師要在今天突破當面之敵、奪取作戰目標；第十一戰車團從後方趕來，中午前抵達。';
  o1.deb={'0':'邊境防線被突破，北方軍向東撤退。聯合軍向'+hn+'推進。','1':'攻勢在邊境受挫，聯合軍無力再戰。','d':'雙方在邊境對峙。聯合軍決定繞過防線，直取'+hn+'。'};o1.next={'0':'','1':'end','d':''};
  o1.ev=[{id:'e1',name:'開戰訓示',tr:{k:'start'},act:[{k:'dlg',who:'c1',side:0,txt:'各部隊注意：北方軍沿邊境構築了防線。今天要突破當面之敵，奪取作戰目標。'},{k:'dlg',who:'c3',side:1,txt:'守住邊境！每一座村莊都要讓他們付出代價。'}]},
    {id:'e2',name:'戰車團抵達',tr:{k:'time',t:240},act:[{k:'reinf',side:0,f:'fa2'},{k:'dlg',who:'c2',side:0,txt:'第十一戰車團已經抵達西側集結地，隨時可以投入。'}]},
    {id:'e3',name:'邊境防線崩潰',tr:{k:'lost',side:1,f:'fb1',pct:55,dl:30},act:[{k:'dlg',who:'c3',side:1,txt:'前線部隊損失過半，全軍向第二道防線撤退！'},{k:'exit',side:1,f:'fb1',how:'move'},{k:'end',win:0,why:'北方軍退出邊境防線'}]}];
  var o2=cmpOpNorm(C,Object.assign({id:'op2',name:'鐵路樞紐',w:w,h:h,cs:50,dur:30,gap:1,hr:5},at(hx,hy)));
  o2.sides=[{use:['fa1','fa2'],add:[]},{use:['fb1'],add:[{k:'b1970',n:2,name:'鐵路守備第{i}營',gran:'co'}]}];
  o2.obj=[{name:hn,x:Math.round(hx),y:Math.round(hy),pts:40,r:Math.round(clamp((hub?hub.r:600)*1.2,500,2500)/50)*50}];
  var t2=P.filter(function(p){return p!==hub&&p.kind!=='village'&&p.x>o2.x&&p.y>o2.y&&p.x<o2.x+w*1000&&p.y<o2.y+h*1000;}).sort(function(a,b){return b.pop-a.pop;})[0];if(t2)o2.obj.push({name:t2.name,x:Math.round(t2.x),y:Math.round(t2.y),pts:15,r:800});
  o2.brief=hn+'是整個戰區的鐵路樞紐，北方軍的補給都要經過這裡。拿下它，前線的北方軍就斷了補給。';
  o2.deb={'0':hn+'落入聯合軍手中，北方軍退向最後的防線。','1':'北方軍的反擊把聯合軍逐出了'+hn+'。戰役失敗。','d':hn+'仍在爭奪之中，聯合軍決定直接進攻北方軍的最後防線。'};o2.next={'0':'','1':'end','d':''};
  o2.ev=[{id:'e1',name:'簡報',tr:{k:'start'},act:[{k:'dlg',who:'c2',side:0,txt:hn+'有鐵路經過，是北方軍補給的咽喉。守備隊不多，但近衛戰車團可能從東邊趕來。'}]},
    {id:'e2',name:'近衛戰車團反擊',tr:{k:'time',t:480},act:[{k:'reinf',side:1,f:'fb2'},{k:'dlg',who:'c3',side:1,txt:'第四近衛戰車團到了，立刻反擊，把他們趕出'+hn+'！'}]},
    {id:'e3',name:'樞紐易手',tr:{k:'obj',obj:hn,side:0,dl:60},act:[{k:'msg',side:'',txt:hn+'易手，鐵路交通中斷。'},{k:'end',win:0,why:'奪取鐵路樞紐'}]}];
  var o3=cmpOpNorm(C,Object.assign({id:'op3',name:'最後的防線',w:w,h:h,cs:50,dur:36,gap:2,nobj:2},at(W*0.78,H*0.5)));
  o3.sides=[{use:['fa1','fa2'],add:[]},{use:['fb1','fb2'],add:[]}];
  o3.brief='北方軍退到平原東緣的最後防線。突破這裡，整個戰區就在聯合軍手中。情報顯示北方軍的戰術核武部隊就在防線後方。';
  o3.deb={'0':'最後的防線崩潰，北方軍退出戰區。','1':'聯合軍在最後的防線前止步。','d':'戰線停在平原東緣。'};
  var nx=o3.x+w*1000*0.35,ny=o3.y+h*1000*0.5;
  o3.ev=[{id:'e1',name:'最後的命令',tr:{k:'start'},act:[{k:'dlg',who:'c3',side:1,txt:'這是最後的防線。統帥部已經授權：防線一旦崩潰，就動用戰術核武。'}]},
    {id:'e2',name:'核武部隊就位',tr:{k:'str',side:1,pct:45},act:[{k:'dlg',who:'c2',side:0,txt:'偵測到北方軍的核武部隊進入發射陣地！'}]},
    {id:'e3',name:'核爆',tr:{k:'ev',ev:'e2',dl:20},act:[{k:'nuke',side:1,Y:5,x:Math.round(nx),y:Math.round(ny)},{k:'dlg',who:'c1',side:0,txt:'核爆！各部隊立刻疏散、穿戴防護裝備，繼續進攻！'}]},
    {id:'e4',name:'北方軍放棄戰區',tr:{k:'str',side:1,pct:25},act:[{k:'end',win:0,why:'北方軍放棄戰區'}]}];
  C.ops=[o1,o2,o3];cmpSave();}
/* ---------- 說明 ---------- */
if(typeof HELP14!=='undefined')HELP14.push('<h4>戰役</h4><ul>'+
  '<li>「戰役」分頁不必先建立作戰就能開啟。先產生（或匯入）一張<b>大地圖</b>：整個戰區一次產生，記錄每個聚落、每條道路與鐵路的走向；也可以匯入「地圖編修」匯出的作戰地圖，或在「開始」頁載入世界地圖後由世界地圖產生。</li>'+
  '<li><b>地點</b>：每個聚落的種類、人口、依作戰地圖同一套規則算出的設施與地標（醫院、學校、車站、警察局、教堂……）、估計的房屋數量、經過的道路與鐵路與通往哪些地點。可以改名、設為無人居住（建築還在，沒有居民），或指定初始由哪一方控制；「前線幾公里內設為無人居住」一次疏散前線附近的聚落。</li>'+
  '<li><b>兵力與人物</b>：雙方的核心兵力整場戰役延續，每場作戰結束時記下每個單位的兵力、彈藥與經驗，被殲滅的單位之後不再出現；人物是對白的說話者，有名字、職稱、陣營與自動產生的頭像。</li>'+
  '<li><b>作戰</b>：每場作戰是大地圖上的一塊區域（在大地圖上點選中心），開打時依大地圖的地勢、河流、林地與農地、聚落、道路與鐵路產生細部的區域地圖，相鄰作戰的道路與河流在邊界相接。可以設定日期（或上一場結束後幾天）、時限、雙方進場的邊、參加的核心兵力與只在這場出現的部隊、作戰目標、作戰前簡報、依勝負的講評與下一場（分支或戰役結束）。</li>'+
  '<li><b>劇情事件</b>：觸發條件（作戰開始、經過時間、目標被佔領、部隊進入範圍、部隊兵力低於比例或被殲滅、一方總兵力低於比例、另一個事件之後，都可以再延遲幾分鐘）成立後依序執行動作：對白（暫停作戰並顯示說話者與頭像，可以只給一方看）、訊息、增援進場（核心兵力帶著上一場的狀態，或另外編組；從部署邊或指定位置進場）、部隊撤出（走到部署邊撤離或立即離開）、核彈、新增目標、結束作戰。</li>'+
  '<li><b>進行戰役</b>：依序（或依分支）產生各場作戰，自動部署後按 ▶ 開戰；作戰結束時顯示講評，記下雙方傷亡、兵力狀態與戰區控制（範圍內只剩一方部隊或作戰目標的歸屬），再開始下一場；大地圖依各地的控制方著色，看得出前線怎麼推進。進行中的戰役跟著作戰存檔，讀取存檔後可以繼續。戰役可以匯出成 .latocampaign.json 分享；「範例戰役」示範三場作戰的增援、撤退、分支與核彈。</li></ul>');
