/* ===================== 動態物資介面：單位面板與環形選單的「呼叫物資」、呼叫對話框（範本、運送方式、逐單位預覽）、範本編輯器、
   後勤頁的軍種後勤、每日額度、固定補給線與呼叫紀錄；說明 ===================== */
if(typeof GKEYS!=='undefined')GKEYS.push('sup');
var SUPD={ids:[],tpl:'need',m:''},SUPBUSY=0;
/* 重繪對話框：沿用原本的框，避免移除有焦點的輸入框時又觸發 change 而重入 */
function supReDlg(key,html){var d=UI[key];if(d&&d.isConnected&&d.firstChild){d.firstChild.innerHTML=html;return d;}UI[key]=dlg(html,true);return UI[key];}
function supWn(k){var w=wpnOf(k);return w?w.n:k;}
function supNaTxt(q){var k=q[0];if(k==='refill')return q[1];if(k.indexOf('>')>0){var p=k.split('>');return supWn(p[0])+'→'+supWn(p[1])+'：'+q[1];}return supWn(k)+'：'+q[1];}
function supTplOpts(side,sel){return stplOf(side).map(function(t){return '<option value="'+esc(t.id)+'"'+(t.id===sel?' selected':'')+'>'+esc(t.n)+'</option>';}).join('');}
function supCanCall(u){var me=mySide();if(!u||!alive(u)||u.irr||me!==null&&u.side!==me)return false;return supLeaves(u.id).length>0;}
function supDst(){var L=SUPD.ids.map(uById).filter(supCanCall);return L.length>1?L.map(function(u){return u.id;}):L.length?L[0].id:0;}
function supDstName(dst){if(Array.isArray(dst))return '選取的 '+dst.length+' 個單位';var u=uById(dst);return u?uName(u):'—';}
/* 武器缺額（潰散時丟棄、被改裝或人為減少的部分） */
function supWShort(u){var L=u.lg;if(!L||!L.w0)return 0;var gs={},n=0;L.w0.forEach(function(x){if(wIssuable(x[0]))gs[wGrp(x[0])]=1;});Object.keys(gs).forEach(function(g){n+=Math.max(0,wCnt(L.w0,g)-wCnt(L.w,g));});return n;}
/* ---------- 預覽 ---------- */
function supPreview(side,dst,T,m){var P=supPlan(side,T,dst,{}),L=supLeaves(dst),cons=P.cons.food+P.cons.ammo+P.cons.fuel,road=lgRoadMode(),Q=supQ(side),AP=lgAirPool(side),o='';
  var nTr=0,nRail=0,nAir=0;if(m==='rail'){nRail=cons>0.05?Math.ceil(cons/lgPayS(side,'rail')):0;nTr=P.wt>0?Math.ceil(P.wt/lgPayS(side,road)):0;}else if(LGM[m]&&LGM[m].air)nAir=Math.ceil(P.tons/lgPayS(side,m));else nTr=Math.ceil(P.tons/lgPayS(side,road));
  var ok=P.tons>=0.05,short=nTr>Q.max-Q.used||nRail>Q.rmax-Q.rused||nAir>AP.left;
  o+='<div class="lw-kv">'+kv('目的地',esc(supDstName(dst))+'（'+L.length+' 個單位）')+kv('內容',ok?'糧 '+fmt(P.cons.food,1)+'、彈 '+fmt(P.cons.ammo,1)+'、油 '+fmt(P.cons.fuel,1)+' 噸'+(P.nW?'；武器 '+fmt(P.nW)+' 件（'+fmt(P.wt,2)+' 噸）':'')+'，共 <b>'+fmt(P.tons,1)+' 噸</b>':'<span style="color:#b3261e">沒有需要運送的物資</span>')+
    kv('載具',(nTr?nTr+' '+LGM[road].u+LGM[road].n+'（今日剩 '+(Q.max-Q.used)+'）':'')+(nRail?(nTr?'、':'')+nRail+' 列補給列車（今日剩 '+(Q.rmax-Q.rused)+'）':'')+(nAir?nAir+' 架次（今日剩 '+AP.left+'）':'')+(short?'　<span style="color:#b3261e">額度不足，只會送出一部分</span>':''))+'</div>';
  var rows=L.map(function(u){var N=supNeed(u),g={};['food','ammo','fuel'].forEach(function(c){g[c]=P.need[c]>0.001?Math.min(N[c],P.cons[c]*N[c]/P.need[c]):0;});
      var w=P.adds.filter(function(a){return a[0]===u.id;}).map(function(a){return '＋'+a[2]+' '+esc(supWn(a[1]));}).concat(P.swaps.filter(function(s){return s[0]===u.id;}).map(function(s){return s[3]+' '+esc(supWn(s[1]))+'→'+esc(supWn(s[2]));}));return {u:u,g:g,w:w,s:g.food+g.ammo+g.fuel+w.length};})
    .sort(function(a,b){return b.s-a.s;});
  o+='<div class="lw-sc" style="max-height:300px;overflow:auto"><table class="lw-tbl"><tr><th>單位</th><th class="n">彈藥</th><th class="n">燃料</th><th class="n">收到糧／彈／油（噸）</th><th>武器</th></tr>'+rows.slice(0,40).map(function(r){var u=r.u,Lg=u.lg||logInit(u);
      return '<tr><td>'+esc(uName(u))+'</td><td class="n">'+fmt(u.ammo)+'%</td><td class="n">'+(Lg.fuelCap>0?pct(Lg.fuel/Lg.fuelCap*100):'—')+'</td><td class="n">'+fmt(r.g.food,1)+'／'+fmt(r.g.ammo,1)+'／'+fmt(r.g.fuel,1)+'</td><td>'+(r.w.length?r.w.join('<br>'):'<span class="lw-note">—</span>')+'</td></tr>';}).join('')+
    (rows.length>40?'<tr><td colspan="5" class="lw-note">⋯另有 '+(rows.length-40)+' 個單位</td></tr>':'')+'</table></div>';
  if(P.na.length)o+='<div class="lw-note"><b>不配送：</b>'+P.na.map(function(q){return esc(supNaTxt(q));}).join('；')+'</div>';
  var lf=Object.keys(P.left);if(lf.length)o+='<div class="lw-note">'+lf.map(function(k){return fmt(P.left[k])+' 件'+esc(supWn(k));}).join('、')+'沒有部隊能用，留在後方不運。</div>';
  if(m==='rail')o+='<div class="lw-note">鐵路把糧彈油運到最近的本方車站入庫，再由補給站的車隊轉運；武器另以'+LGM[road].n+'直送部隊。</div>';
  if(m==='drop')o+='<div class="lw-note">空投約有三成落點偏差或摔壞（空中機動部隊約兩成）；落區 1 公里內有敵軍時損失一半。</div>';return {html:o,ok:ok};}
/* ---------- 呼叫對話框 ---------- */
function supDlg(ids){if(SUPBUSY)return;SUPBUSY=1;try{supDlg0(ids);}finally{SUPBUSY=0;}}
function supDlg0(ids){var side=mySide();if(ids)SUPD.ids=ids;var dst=supDst(),u0=uById(Array.isArray(dst)?dst[0]:dst);if(!dst||!u0){toast('選取本方的部隊或編組，才能呼叫物資。');return;}if(side===null)side=u0.side;
  var T=stplGet(side,SUPD.tpl)||stplOf(side)[0];SUPD.tpl=T.id;var MD=supModes(side,u0);if(!MD.some(function(q){return q[0]===SUPD.m&&q[2];}))SUPD.m=(MD.filter(function(q){return q[2];})[0]||MD[0])[0];
  var pv=supPreview(side,dst,T,SUPD.m),o='<h3>呼叫物資<small>依部隊特性配發</small></h3><div class="lw-opt"><span>範本</span><span><select data-c="supt">'+supTplOpts(side,T.id)+'</select> <button type="button" class="lw-btn sm" data-a="stpled">編輯範本…</button></span>'+
    '<span>運送方式</span><span>'+MD.map(function(q){return '<label style="display:block'+(q[2]?'':';opacity:.5')+'"><input type="radio" name="supm" data-c="supm" value="'+q[0]+'"'+(q[0]===SUPD.m?' checked':'')+(q[2]?'':' disabled')+'> '+esc(q[1])+' <span class="lw-note">'+esc(q[3])+'</span></label>';}).join('')+'</span></div>'+
    pv.html+'<div class="lw-row"><button type="button" class="lw-btn pri" data-a="supgo"'+(pv.ok?'':' disabled')+'>呼叫</button><button type="button" class="lw-btn" data-a="x">取消</button><span class="lw-note">軍種後勤：'+esc(DOCN[lgDoct(side)])+'</span></div>';
  supReDlg('supd',o);}
CHG.supt=function(t){SUPD.tpl=t.value;supDlg();};
CHG.supm=function(t){SUPD.m=t.value;supDlg();};
ACT.supdlg=function(b){supDlg([+b.getAttribute('data-v')]);};
ACT.supgo=function(){var dst=supDst(),u0=uById(Array.isArray(dst)?dst[0]:dst);if(!u0)return;var side=u0.side,T=stplGet(side,SUPD.tpl)||stplOf(side)[0],r=supCall(side,T,dst,SUPD.m);
  if(r.err){toast('無法呼叫：'+r.err,4500);return;}var d=UI.supd;UI.supd=null;if(d&&d.isConnected)d.remove();var C=r.C;
  toast('已呼叫「'+T.n+'」：約 '+fmt(C.tons,C.tons<10?1:0)+' 噸'+(C.nW?'、武器 '+fmt(C.nW)+' 件':'')+'，'+[C.n?C.n+' '+LGM[lgRoadMode()].u:'',C.nr?C.nr+' 列':'',C.na?C.na+' 架次':''].filter(function(z){return z;}).join('、')+'出發',4500);if(typeof btStatus==='function')btStatus();};
/* ---------- 範本編輯器 ---------- */
var STE={side:0,id:''};
function steT(){return stplGet(STE.side,STE.id)||stplOf(STE.side)[0];}
function steWOpts(sel,mode){var y=G.set.y||1943,L=wpnList().filter(function(w){return wIssuable(w.k)&&(w.y||0)<=y+0;}),by={};L.forEach(function(w){var c=wcls(w.k);(by[c]=by[c]||[]).push(w);});
  return Object.keys(WCLN).filter(function(c){return by[c];}).map(function(c){return '<optgroup label="'+esc(WCLN[c])+'（'+esc(WCLR[c])+'）">'+by[c].sort(function(a,b){return a.y-b.y;}).map(function(w){return '<option value="'+esc(w.k)+'"'+(w.k===sel?' selected':'')+'>'+esc(w.n)+'（'+w.y+'）</option>';}).join('')+'</optgroup>';}).join('');}
function steSum(T){var f=T.f||{},fs=(f.food||0)+(f.ammo||0)+(f.fuel||0)||1,cons=T.need?'依目的地各單位的缺額':fmt(T.cons||0,1)+' 噸（糧 '+fmt((f.food||0)/fs*100)+'%、彈 '+fmt((f.ammo||0)/fs*100)+'%、油 '+fmt((f.fuel||0)/fs*100)+'%）',am=T.need?0:(T.cons||0)*(f.ammo||0)/fs;
  return '糧彈油 '+cons+(T.wt>0?'；武器 '+fmt(T.wt,1)+' 噸'+(am>0?'（武器：彈藥＝1：'+fmt(am/T.wt,1)+'）':''):'')+(T.refill?'；補足各單位的武器缺額'+(T.wt>0?'（上限為武器噸數）':''):'')+((T.swap||[]).length?'；換裝 '+T.swap.map(function(q){return supWn(q[0])+'→'+supWn(q[1])+' '+fmt((q[2]||0)*100)+'%';}).join('、'):'');}
function stplDlg(side,id){if(SUPBUSY)return;SUPBUSY=1;try{stplDlg0(side,id);}finally{SUPBUSY=0;}}
function stplDlg0(side,id){STE.side=side===undefined?STE.side:side;if(id!==undefined)STE.id=id;var T=steT();STE.id=T.id;var f=T.f||{};
  var o='<h3>物資範本<small>'+esc(G.sides[STE.side].name)+'</small></h3><div class="lw-row"><select data-c="stesel">'+supTplOpts(STE.side,T.id)+'</select><button type="button" class="lw-btn sm" data-a="stenew">＋ 新範本</button><button type="button" class="lw-btn sm" data-a="stedup">複製</button><button type="button" class="lw-btn sm dng" data-a="stedel">刪除</button><button type="button" class="lw-btn sm" data-a="stereset">恢復預設範本</button></div>'+
    '<div class="lw-opt"><span>名稱</span><input type="text" value="'+esc(T.n)+'" data-c="ste" data-f="n" style="width:22em">'+
    '<span>糧彈油</span><span><label><input type="checkbox" data-c="ste" data-f="need"'+(T.need?' checked':'')+'> 依缺額（各單位缺多少送多少）</label>'+(T.need?'':'　共 <input type="number" min="0" max="5000" step="1" value="'+(T.cons||0)+'" data-c="ste" data-f="cons" style="width:70px"> 噸')+'</span>'+
    '<span>比例</span><span>糧 <input type="number" min="0" max="100" step="0.5" value="'+(f.food||0)+'" data-c="ste" data-f="food" style="width:56px"> ：彈 <input type="number" min="0" max="100" step="0.5" value="'+(f.ammo||0)+'" data-c="ste" data-f="ammo" style="width:56px"> ：油 <input type="number" min="0" max="100" step="0.5" value="'+(f.fuel||0)+'" data-c="ste" data-f="fuel" style="width:56px">'+(T.need?' <span class="lw-note">（依缺額時，比例為 0 的類別不送）</span>':'')+'</span>'+
    '<span>武器</span><span>共 <input type="number" min="0" max="2000" step="0.5" value="'+(T.wt||0)+'" data-c="ste" data-f="wt" style="width:70px"> 噸　<label><input type="checkbox" data-c="ste" data-f="refill"'+(T.refill?' checked':'')+'> 先依編制補足各單位的武器缺額</label></span></div>'+
    '<h4 style="margin:8px 0 4px">增配（依比例分配武器噸數；先補足缺額，再汰換同系列的舊型）</h4><table class="lw-tbl"><tr><th>武器</th><th class="n">比例</th><th>配給對象</th><th></th></tr>'+(T.add||[]).map(function(q,i){return '<tr><td><select data-c="stea" data-f="k" data-v="'+i+'">'+steWOpts(q[0])+'</select></td><td class="n"><input type="number" min="0" max="100" step="0.5" value="'+(q[1]||0)+'" data-c="stea" data-f="s" data-v="'+i+'" style="width:56px"></td><td class="lw-note">'+esc(WCLR[wcls(q[0])]||'—')+'</td><td><button type="button" class="lw-btn sm dng" data-a="steadel" data-v="'+i+'">✕</button></td></tr>';}).join('')+'</table><button type="button" class="lw-btn sm" data-a="steaadd">＋ 增配武器</button>'+
    '<h4 style="margin:8px 0 4px">換裝（把部隊現有的舊型依比例換成新型；同一類武器）</h4><table class="lw-tbl"><tr><th>換下</th><th>換上</th><th class="n">比例</th><th></th></tr>'+(T.swap||[]).map(function(q,i){return '<tr><td><select data-c="stes" data-f="a" data-v="'+i+'">'+steWOpts(q[0])+'</select></td><td><select data-c="stes" data-f="b" data-v="'+i+'">'+steWOpts(q[1])+'</select></td><td class="n"><input type="number" min="0" max="100" step="5" value="'+Math.round((q[2]||0)*100)+'" data-c="stes" data-f="r" data-v="'+i+'" style="width:56px">%</td><td><button type="button" class="lw-btn sm dng" data-a="stesdel" data-v="'+i+'">✕</button></td></tr>';}).join('')+'</table><button type="button" class="lw-btn sm" data-a="stesadd">＋ 換裝</button>'+
    '<div class="lw-note" style="margin-top:8px">這個範本：'+esc(steSum(T))+'。實際配送依目的地部隊的特性：沒有部隊能用的武器不運，預覽會列出原因。</div><div class="lw-row"><button type="button" class="lw-btn pri" data-a="stedone">完成</button></div>';
  supReDlg('sted',o);}
ACT.stpled=function(){var me=mySide(),u=uById((SUPD.ids||[])[0]);stplDlg(me!==null?me:u?u.side:(typeof LG!=='undefined'?LG.side:0),SUPD.tpl);};
ACT.stedone=function(){var d=UI.sted;UI.sted=null;if(d&&d.isConnected)d.remove();if(UI.supd&&UI.supd.isConnected)supDlg();if(UI.tab==='logi')show('logi');};
CHG.stesel=function(t){stplDlg(undefined,t.value);};
CHG.ste=function(t){var T=steT(),f=t.getAttribute('data-f');T.f=T.f||{food:0,ammo:0,fuel:0};if(f==='n')T.n=String(t.value||'').slice(0,60)||'未命名範本';else if(f==='need')T.need=t.checked?1:0;else if(f==='refill')T.refill=t.checked?1:0;
  else if(f==='cons')T.cons=clamp(+t.value||0,0,5000);else if(f==='wt')T.wt=clamp(+t.value||0,0,2000);else T.f[f]=clamp(+t.value||0,0,100);stplDlg();};
CHG.stea=function(t){var T=steT(),q=T.add[+t.getAttribute('data-v')];if(!q)return;if(t.getAttribute('data-f')==='k')q[0]=t.value;else q[1]=clamp(+t.value||0,0,100);stplDlg();};
CHG.stes=function(t){var T=steT(),q=T.swap[+t.getAttribute('data-v')],f=t.getAttribute('data-f');if(!q)return;if(f==='a')q[0]=t.value;else if(f==='b')q[1]=t.value;else q[2]=clamp((+t.value||0)/100,0,1);stplDlg();};
ACT.steaadd=function(){var T=steT(),R=eraRifles();(T.add=T.add||[]).push([R[R.length-1]||'pike',1]);if(!(T.wt>0))T.wt=2;stplDlg();};
ACT.steadel=function(b){steT().add.splice(+b.getAttribute('data-v'),1);stplDlg();};
ACT.stesadd=function(){var T=steT(),R=eraRifles();(T.swap=T.swap||[]).push([R[0]||'pike',R[R.length-1]||'pike',0.5]);stplDlg();};
ACT.stesdel=function(b){steT().swap.splice(+b.getAttribute('data-v'),1);stplDlg();};
ACT.stenew=function(){var L=stplOf(STE.side),T={id:'c'+Date.now().toString(36),n:'新範本 '+(L.length+1),cons:20,f:{food:3,ammo:5,fuel:2},wt:0,add:[],swap:[]};L.push(T);stplDlg(undefined,T.id);};
ACT.stedup=function(){var L=stplOf(STE.side),T=clone(steT());T.id='c'+Date.now().toString(36);T.n=T.n+'（複本）';L.push(T);stplDlg(undefined,T.id);};
ACT.stedel=function(){var L=stplOf(STE.side);if(L.length<=1){toast('至少要保留一個範本。');return;}var i=L.indexOf(steT());L.splice(i,1);stplDlg(undefined,L[Math.max(0,i-1)].id);};
ACT.stereset=function(){if(typeof confirm==='function'&&!confirm('把所有範本恢復成預設？自訂的範本會被刪除。'))return;SD(STE.side).stpl=stplDefault();stplDlg(undefined,'need');};
/* ---------- 單位面板與環形選單 ---------- */
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);if(!G.started||G.replay)return o;var me=mySide();if(me!==null&&u.side!==me)return o;if(!supCanCall(u))return o;var ws=leaf?supWShort(u):0;
  return o+'<span>補給</span><span><button type="button" class="lw-btn sm" data-a="supdlg" data-v="'+u.id+'" title="向後方呼叫糧彈油或武器，依部隊特性配發">呼叫物資…</button>'+(ws?' <span class="lw-note">武器缺額 '+fmt(ws)+' 件（潰散時丟棄）</span>':'')+'</span>';};})();
ordReg('supcall','呼叫物資','log',{nt:1});DCN.supcall='向後方呼叫糧彈油或武器（依部隊特性配發）';
(function(){var b=canOrd;canOrd=function(u,k){if(k==='supcall')return !!(G&&G.started&&!G.replay)&&supCanCall(u);return b(u,k);};})();
(function(){var b=ACT.ob;ACT.ob=function(btn){if(btn.getAttribute('data-v')==='supcall'){supDlg(UI.sel.slice());return;}return b(btn);};})();
/* ---------- 後勤頁：軍種後勤、每日額度、範本、固定補給線、呼叫紀錄 ---------- */
function supRtModes(){var o=[[lgRoadMode(),LGM[lgRoadMode()].n]];if(featOn('rail'))o.push(['rail','鐵路（只能送到車站）']);if(featOn('airlift'))o.push(['air','運輸機（只能降落在機場）']);if(featOn('airdrop'))o.push(['drop','空投（只能給部隊）']);if(featOn('heli'))o.push(['heli','直升機（只能給部隊）']);return o;}
var SUPR={dst:'',m:'',per:30,tpl:'std'};
function supCardHtml(side){var S=SD(side),Q=supQ(side),AP=lgAirPool(side),d=lgDoct(side),road=lgRoadMode(),C=(G.sup&&G.sup.calls||[]).filter(function(c){return c.side===side&&!c.route;}).slice(-10).reverse();
  return '<h3>動態物資<small>呼叫額度與範本</small><button type="button" class="lw-btn sm" data-a="stpled" style="float:right">物資範本…</button></h3><div class="lw-opt"><span>軍種後勤</span><span><select data-c="supdoc"><option value=""'+(S.ldoc?'':' selected')+'>自動（依兵力組成）</option>'+['air','land','mixed'].map(function(k){return '<option value="'+k+'"'+(S.ldoc===k?' selected':'')+'>'+DOCN[k]+'</option>';}).join('')+'</select><br><span class="lw-note">目前：<b>'+DOCN[d]+'</b>——'+esc(DOCD[d])+'</span></span>'+
    '<span>每日可呼叫</span><span><input type="number" min="0" max="5000" value="'+Q.max+'" data-c="supq" data-f="max" style="width:70px"> '+LGM[road].u+LGM[road].n+'（今日已用 '+Q.used+'）'+(featOn('rail')?'　<input type="number" min="0" max="50" value="'+Q.rmax+'" data-c="supq" data-f="rmax" style="width:56px"> 列補給列車（已用 '+Q.rused+'）':'')+(Q.set?' <button type="button" class="lw-btn sm" data-a="supqdef">恢復預設</button>':'')+'</span>'+
    '<span>空運架次</span><span>'+(AP.base>0?'今日剩 '+AP.left+'／'+fmt(AP.base)+' 架次（空投、直升機與運輸機共用；被擊落的飛機會減少每日架次）':'這個時代還沒有空運')+'</span></div>'+
    '<div class="lw-note">選取部隊或編組後，在單位面板或環形選單的「後勤」按「呼叫物資」。範本：'+stplOf(side).map(function(t){return esc(t.n);}).join('、')+'。</div>'+
    (C.length?'<table class="lw-tbl" style="margin-top:6px"><tr><th>時間</th><th>範本</th><th>目的地</th><th class="n">噸</th><th>狀態</th></tr>'+C.map(function(c){var st=c.st==='go'?'途中':c.st==='done'?'送達 '+fmt(c.got,c.got<10?1:0)+' 噸'+(c.wg?'、武器 '+fmt(c.wg)+' 件':''):'<span style="color:#b3261e">未送達</span>';
      return '<tr><td>'+tTxt(c.t0)+'</td><td>'+esc(c.tpl)+'</td><td>'+esc(c.node?((lgNode(side,c.node)||{}).name||'補給站'):supDstName(c.dst))+'</td><td class="n">'+fmt(c.tons,c.tons<10?1:0)+'</td><td>'+st+'</td></tr>';}).join('')+'</table>':'');}
function supRoutesHtml(side){var R=(G.sup&&G.sup.routes||[]).filter(function(r){return r.side===side;}),nodes=nodesOf(side).filter(function(N){return N.k!=='off';}),sel=(UI.sel||[]).map(uById).filter(function(u){return u&&u.side===side&&supCanCall(u);})[0],
    F=G.units.filter(function(g){return g.side===side&&!isLeaf(g)&&alive(g)&&g.ech>=3&&supCanCall(g);}).slice(0,30),M=supRtModes();if(!SUPR.m||!M.some(function(q){return q[0]===SUPR.m;}))SUPR.m=M[0][0];
  var opts=nodes.map(function(N){return '<option value="n'+N.id+'"'+(SUPR.dst==='n'+N.id?' selected':'')+'>補給節點：'+esc(N.name)+'（'+(LOGK[N.k]?LOGK[N.k][0]:N.k)+'）</option>';}).concat((sel?[sel]:[]).concat(F.filter(function(g){return g!==sel;})).map(function(u){return '<option value="u'+u.id+'"'+(SUPR.dst==='u'+u.id?' selected':'')+'>部隊：'+esc(uName(u))+'</option>';})).join('');
  return '<h3>固定補給線<small>每兩小時發出一批，送滿每日噸數</small></h3>'+(R.length?'<table class="lw-tbl"><tr><th>路線</th><th class="n">每日（噸）</th><th>範本</th><th class="n">已發出／送達</th><th></th></tr>'+R.map(function(r){return '<tr><td>'+esc(supRouteName(r))+(r.ai?' <span class="lw-pill">AI</span>':'')+'</td><td class="n"><input type="number" min="1" max="20000" value="'+r.per+'" data-c="suprt" data-f="per" data-v="'+r.id+'" style="width:70px"></td><td><select data-c="suprt" data-f="tpl" data-v="'+r.id+'">'+supTplOpts(side,r.tpl)+'</select></td><td class="n">'+fmt(r.sent)+'／'+fmt(r.got||0)+' 噸</td><td><button type="button" class="lw-btn sm dng" data-a="suprtdel" data-v="'+r.id+'">撤銷</button></td></tr>';}).join('')+'</table>':'<div class="lw-note">尚未開設補給線。</div>')+
    '<div class="lw-row" style="margin-top:6px;flex-wrap:wrap"><select data-c="suprn" data-f="dst">'+(opts||'<option value="">（沒有可用的目的地）</option>')+'</select><select data-c="suprn" data-f="m">'+M.map(function(q){return '<option value="'+q[0]+'"'+(q[0]===SUPR.m?' selected':'')+'>'+esc(q[1])+'</option>';}).join('')+'</select><label>每日 <input type="number" min="1" max="20000" value="'+SUPR.per+'" data-c="suprn" data-f="per" style="width:70px"> 噸</label><select data-c="suprn" data-f="tpl">'+supTplOpts(side,SUPR.tpl)+'</select><button type="button" class="lw-btn sm pri" data-a="suprtadd">開設補給線</button></div>'+
    '<div class="lw-note">高強度補給線（例如對被圍部隊的空中補給航線、對前進補給站的鐵路補給線）每批都占用當天的車輛、列車或空運額度；額度用完時該批暫停。路線沿途仍可能遭伏擊、空襲或防空火力攔截。</div>';}
(function(){var b=PAGES.logi;PAGES.logi=function(host){b(host);if(!G||!G.started)return;var M=host.querySelector('.lw-main');if(!M)return;var side=LG.side,d=document.createElement('div');d.className='lw-grid';
  d.innerHTML='<div class="lw-card">'+supCardHtml(side)+'</div><div class="lw-card">'+supRoutesHtml(side)+'</div>';M.insertBefore(d,M.children[2]||null);};})();
CHG.supdoc=function(t){var S=SD(LG.side);S.ldoc=t.value;S._dcT=undefined;show('logi');};
CHG.supq=function(t){var Q=supQ(LG.side),f=t.getAttribute('data-f'),v=Math.max(0,Math.round(+t.value||0));if(f==='max'){Q.max=v;Q.set|=1;}else{Q.rmax=v;Q.set|=2;}show('logi');};
ACT.supqdef=function(){var Q=supQ(LG.side);Q.set=0;supQ(LG.side);show('logi');};
CHG.suprn=function(t){var f=t.getAttribute('data-f');if(f==='per')SUPR.per=clamp(+t.value||0,1,20000);else SUPR[f]=t.value;};
CHG.suprt=function(t){var id=+t.getAttribute('data-v'),r=(G.sup&&G.sup.routes||[]).filter(function(q){return q.id===id;})[0];if(!r)return;if(t.getAttribute('data-f')==='per')r.per=clamp(Math.round(+t.value||0),1,20000);else r.tpl=t.value;};
ACT.suprtdel=function(b){var id=+b.getAttribute('data-v');if(G.sup)G.sup.routes=G.sup.routes.filter(function(q){return q.id!==id;});show('logi');};
ACT.suprtadd=function(){var side=LG.side,v=SUPR.dst||'',sel=document.querySelector('[data-c="suprn"][data-f="dst"]');if(!v&&sel)v=sel.value;if(!v){toast('先選擇目的地。');return;}var isN=v[0]==='n',id=+v.slice(1),m=SUPR.m||lgRoadMode(),N=isN?lgNode(side,id):null,err='';
  if(isN&&(m==='drop'||m==='heli'))err='空投與直升機只能送給部隊';else if(!isN&&(m==='rail'||m==='air'))err=m==='rail'?'鐵路只能送到車站':'運輸機只能降落在機場';else if(N&&m==='rail'&&N.k!=='rail')err='鐵路只能送到車站';else if(N&&m==='air'&&N.k!=='air')err='運輸機只能降落在機場';
  if(err){toast('無法開設：'+err+'。',4000);return;}var R=supRouteAdd(side,{tpl:SUPR.tpl,dst:{k:isN?'node':'unit',id:id},m:m,per:SUPR.per});logE(side,'log','開設補給線「'+supRouteName(R)+'」：每日約 '+fmt(R.per)+' 噸');show('logi');};
HELP14.push('<h4>動態物資：呼叫物資、範本與補給線</h4><ul>'+
  '<li><b>呼叫物資</b>：選取本方部隊或編組（可框選多個），在單位面板或環形選單「後勤」按「呼叫物資」，選擇範本與運送方式。對話框逐單位列出會收到的糧彈油與武器，以及不配送的項目和原因。物資從本方地圖邊緣出發，依部隊的位置分成幾支車隊（最多六支）送到各群部隊，糧彈油依各單位的缺額分配，補滿後多的隨車隊返回。</li>'+
  '<li><b>依部隊特性配發</b>：步槍、衝鋒槍、機槍、手榴彈等通用輕兵器所有地面部隊都能領（醫療單位只配個人自衛武器，難民與平民團體不配）；反裝甲武器、反戰車砲、迫擊砲、牽引火砲、防空砲、無人機只配給原本就使用同類武器的部隊——反戰車砲只給反戰車砲連。戰車砲、自走砲、多管火箭與車載防空飛彈連同載具補充，不能單獨配發。武器不會讓部隊憑空多出人手：先補足編制缺額（潰散時會丟棄部分武器，重武器丟得多），再汰換同系列的舊型（例如栓動步槍換成半自動步槍）；沒有部隊能用的武器不運。</li>'+
  '<li><b>範本</b>：預設有「依缺額補足糧彈油」、標準補給（糧 3：彈 5：油 2）、彈藥優先、油料優先、補足缺額武器、新式步槍與彈藥（武器 1：彈藥 3）、步槍換裝（一代：二代＝1：1）、支援武器。可以在範本編輯器（後勤頁或呼叫對話框）新增或修改：糧彈油的噸數與比例、武器噸數與增配清單（各項比例）、換裝（換下、換上與比例）。</li>'+
  '<li><b>每日額度</b>：每天可以呼叫的補給車輛（卡車、馬車或挑夫）與補給列車有上限，可在後勤頁調整；空投、直升機與運輸機用當天的空運架次。額度不足時只送出一部分。鐵路把糧彈油運到離部隊最近的本方車站入庫，武器另以車隊直送。空投約有三成落點偏差或摔壞，落區附近有敵軍時損失一半。</li>'+
  '<li><b>固定補給線</b>：在後勤頁開設，每兩小時發出一批，送滿每日噸數：陸路或鐵路送到前進補給站、運輸機降落在機場的空中補給航線，或對被圍部隊的空投與直升機補給。每批都占用當天額度，沿途仍會遭伏擊、空襲或防空火力攔截；目的地失守時自動撤銷。AI 會為被圍超過半天的編組開設空中補給線。</li>'+
  '<li><b>軍種後勤</b>：依兵力組成自動判定（可在後勤頁指定）。空降與航空兵力為主：運輸機與直升機的每日架次加倍、空投較準，但可呼叫的卡車較少。陸軍（裝甲、機械化與砲兵）為主：大容量卡車（載重 1.5 倍）、列車運量 1.3 倍、每日可呼叫的車輛 1.5 倍與較多列車，但空運架次較少。</li></ul>');
