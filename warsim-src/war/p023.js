/* ===================== 後勤道路介面：修路、造路命令；越野車輛設定；補給車隊車種；補給站受損與道路連接；地圖上的造路規劃；說明 ===================== */
/* ---------- 新運具的圖示：越野卡車（多輪）、履帶運輸車（履帶） ---------- */
(function(){var b=lgIcon;lgIcon=function(c,V,x,y,col,f){if(V.m!=='xtruck'&&V.m!=='track')return b(c,V,x,y,col,f);var th=V.hd||0;c.save();c.translate(x,y);c.rotate(th);c.lineWidth=1;c.strokeStyle='rgba(15,15,20,.85)';c.fillStyle=col;c.beginPath();c.rect(-6*f,-2.8*f,8.5*f,5.6*f);c.fill();c.stroke();
  if(V.m==='track'){c.fillStyle='#424242';c.fillRect(-6.8*f,-3.9*f,13*f,1.4*f);c.fillRect(-6.8*f,2.5*f,13*f,1.4*f);c.fillStyle='#ECEFF1';c.beginPath();c.rect(2.5*f,-2.2*f,3*f,4.4*f);c.fill();c.stroke();}
  else{c.fillStyle='#ECEFF1';c.beginPath();c.rect(2.5*f,-2.4*f,3*f,4.8*f);c.fill();c.stroke();c.fillStyle='#212121';[-4.5,-1.5,1.5,4.2].forEach(function(px){c.beginPath();c.arc(px*f,3.4*f,1.05*f,0,2*PI);c.fill();c.beginPath();c.arc(px*f,-3.4*f,1.05*f,0,2*PI);c.fill();});}
  c.restore();if(V.ph==='hold'||V.ph==='wait'){c.fillStyle=V.ph==='hold'?'#C62828':'#E65100';c.font='bold 11px sans-serif';c.textAlign='center';c.textBaseline='alphabetic';c.fillText(V.ph==='hold'?'!':'…',x+8*f,y-6*f);}
  else if(V.ph==='load'||V.ph==='unl'){c.fillStyle='#8D6E63';c.strokeStyle='#fff';c.lineWidth=1;c.fillRect(x+5*f,y-8*f,4.5*f,4.5*f);c.strokeRect(x+5*f,y-8*f,4.5*f,4.5*f);}};})();

/* ---------- 命令：修路、造路 ---------- */
ordReg('roadfix','修路','eng',{g:'⛏',col:'#8D6E63'});ordReg('roadbuild','造路','eng',{g:'═',col:'#6D4C41'});

DCN.roadfix='修路：點選要修復的路段。工兵（或營建、勞工部隊）填平半徑內道路上的彈坑、清除瓦礫、拆除鐵絲網與路障、排除地雷，完成後這段路 48 小時內的泥濘車轍也會減少。被炸毀的橋梁要另外下令「架橋」。';
DCN.roadbuild='造路：點選道路終點（從工兵附近的道路開始），或按住拖曳畫出起點到終點。工兵沿車輛能通行的地形開出小路或鄉道，已經有路的路段會沿用；森林、沼澤、岩地、陡坡較慢，大河要先架橋。卡車與馬車只能走道路，補給站離道路太遠時要靠造路接通。';
(function(){var b=canOrd;canOrd=function(u,k){if(k==='roadfix'||k==='roadbuild'){var L=isLeaf(u)?[u]:leavesOf(u).filter(alive);return !!G.started&&L.some(canRoad);}return b(u,k);};})();
(function(){var b=v4Opts;v4Opts=function(k,O,us){var o=b(k,O,us);if(k==='roadfix')o+='<span>範圍</span><select data-c="oo" data-f="rr">'+[400,800,1500,2500].map(function(v){return '<option value="'+v+'"'+((+O.rr||800)===v?' selected':'')+'>半徑 '+kmTxt(v)+'</option>';}).join('')+'</select>';
  if(k==='roadbuild')o+='<span>道路等級</span><select data-c="oo" data-f="rc"><option value="1"'+((+O.rc||1)===1?' selected':'')+'>小路（單線，較快完成）</option><option value="2"'+((+O.rc||1)===2?' selected':'')+'>鄉道（雙線，約需兩倍時間）</option></select>';return o;};})();
(function(){var b=issueSel;issueSel=function(k,x,y,extra){if(k==='roadfix')extra=Object.assign({},extra||{},{rr:+UI.ordOpt.rr||800});if(k==='roadbuild')extra=Object.assign({},extra||{},{rc:+UI.ordOpt.rc||1});return b(k,x,y,extra);};})();
/* 造路：按住拖曳畫出起點到終點 */
LINEORD.roadbuild=1;
(function(){var b=btLine;btLine=function(x0,y0,x1,y1){if(UI.tool==='ord'&&UI.ord&&UI.ord.k==='roadbuild'){issueSel('roadbuild',x1,y1,{from:[x0,y0]});return;}return b(x0,y0,x1,y1);};})();
(function(){var b=modeBt;modeBt=function(){b();if(VW.mode&&UI.tool==='ord'&&UI.ord&&(UI.ord.k==='roadfix'||UI.ord.k==='roadbuild'))VW.mode.innerHTML='「'+ORDN[UI.ord.k]+'」：'+(UI.ord.k==='roadfix'?'點選要修復的路段（清除半徑內道路上的彈坑、瓦礫與路障）':'點選道路終點，或按住拖曳畫出起點到終點')+'<button type="button" data-a="ordx">取消</button>';};})();
/* 爆破：點選處附近沒有設施、但有補給站時，改為爆破補給站 */
(function(){var b=btClick;btClick=function(x,y,sx,sy,e){if(UI.tool==='ord'&&UI.ord&&UI.ord.k==='facdemo'&&G.started){var N=ndNearAt(x,y,2500),F=facPick(x,y,'facdemo');if(N&&(!F||dist(N.x,N.y,x,y)<dist(F.x,F.y,x,y))){issueSel('facdemo',N.x,N.y,{node:N.id});return;}}return b(x,y,sx,sy,e);};})();

/* ---------- 單位面板：只能走道路／越野車輛；修路、造路進度 ---------- */
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);if(!leaf)return o;var me=mySide(),mine=me===null||u.side===me;
  if(rdElig(u)&&lgRoadOn()){var s=ST(u),canX=s.mobi===3&&featOn('xtruck');o+='<span>車輛</span><span>'+(rdBound(u)?(lgRoadM()==='strict'?'<b style="color:#6D4C41">只能走道路</b>（'+(s.mobi===2?'馬車':'輪型卡車')+'；離開道路最多約 '+kmTxt(rdLm(u))+'）':'<b style="color:#6D4C41">道路優先</b>（'+(s.mobi===2?'馬車':'輪型卡車')+'離開道路時速度約剩四成）'):'越野車輛：可以離開道路（越野較慢）')+
      (mine&&canX?'<br><select data-c="rdxc" data-v="'+u.id+'"><option value="0"'+(!u.xc?' selected':'')+'>依全軍設定（'+(SD(u.side).lgXc?'越野車輛':'一般車輛')+'）</option><option value="-1"'+(u.xc===-1?' selected':'')+'>一般車輛：只走道路</option><option value="1"'+(u.xc===1?' selected':'')+'>越野車輛（全輪驅動）</option></select>':'')+'</span>';}
  var q=u.ord;if(q&&q.k==='roadbuild'&&q.n0){var dn=q.done||0;o+='<span>造路</span><span>'+(q.ph==='done'?'已完成':q.ph==='go'?'前往施工地點':'施工中')+'：'+fmt(dn*G.map.cs/1000,1)+'／'+fmt(q.n0*G.map.cs/1000,1)+' 公里（'+(q.rc>=2?'鄉道':'小路')+'）'+(q.ph==='work'&&dn>0&&q.t0?'，預計還要 '+durTxt((G.t-q.t0)/dn*(q.q?q.q.length:0)):'')+'</span>';}
  if(q&&q.k==='roadfix'&&q.ph==='work'&&q.st0){var left=rfLeft(q),f=q.st0.pt>0?clamp(1-left/q.st0.pt,0,1):1;o+='<span>修路</span><span>'+pct(f*100)+'（半徑 '+kmTxt(q.rr||800)+'，剩 '+(q.L?q.L.length:0)+' 處受損路段）</span>';}
  return o;};})();
CHG.rdxc=function(t){var u=uById(+t.getAttribute('data-v'));if(!u)return;u.xc=+t.value||0;if(!u.xc)delete u.xc;toast(uName(u)+(rdBound(u)?(lgRoadM()==='strict'?'：只能走道路':'：道路優先，離開道路大幅減速'):'：可以越野'));if(u.goal&&!u.pq){u.pq=1;G.pq.push(u.id);}btStatus();};

/* ---------- 地圖：補給站受損、起火、沒有道路連接；造路規劃與修路範圍 ---------- */
function drawRd(c){if(!G.started)return;var me=UI.side,all=me<0||seeAll(),T=performance.now()/240;c.save();c.textAlign='center';c.textBaseline='alphabetic';
  SIDES().forEach(function(s){if(!all&&s!==me)return;(SD(s).nodes||[]).forEach(function(N){if(N.k==='off'||N.dead)return;var p=w2s(N.x,N.y);if(p[0]<-30||p[1]<-30||p[0]>VW.cw+30||p[1]>VW.ch+30)return;
    if(N.burn&&G.t<N.burn){var x=p[0]+13,y=p[1]-12,h=1+0.14*Math.sin(T+N.id);c.fillStyle='rgba(255,111,0,.92)';c.beginPath();c.moveTo(x,y-9*h);c.quadraticCurveTo(x+7,y-2,x,y+4);c.quadraticCurveTo(x-7,y-2,x,y-9*h);c.fill();}
    if(!N.fac&&N.hp!==undefined&&N.hp<99.5){var w=22,f=clamp(N.hp/100,0,1);c.fillStyle='rgba(0,0,0,.45)';c.fillRect(p[0]-w/2,p[1]+13,w,3);c.fillStyle=f>0.6?'#43A047':f>0.3?'#FB8C00':'#E53935';c.fillRect(p[0]-w/2,p[1]+13,w*f,3);}
    if(N.k==='depot'&&lgRoadOn()&&rdDist(N)>1500&&VW.s>0.4)txtHalo(c,'⛔ 無道路',p[0],p[1]-15,'bold 10px sans-serif','#b3261e');});});
  var sel={};UI.sel.forEach(function(id){sel[id]=1;});G.units.forEach(function(u){var o=u.ord;if(!o||!(o.k==='roadbuild'||o.k==='roadfix')||o.ph==='done'||!onMap(u))return;if(!all&&u.side!==me)return;if(!sel[u.id]&&VW.s<0.6)return;
    if(o.k==='roadfix'){var p=w2s(o.x,o.y);c.strokeStyle='rgba(141,110,99,.85)';c.lineWidth=2;c.setLineDash([6,4]);c.beginPath();c.arc(p[0],p[1],Math.max(4,(o.rr||800)/mpp()),0,2*PI);c.stroke();c.setLineDash([]);if(VW.s>0.6)txtHalo(c,'⛏ 修路',p[0],p[1]-6,'10px sans-serif','#5D4037');return;}
    var Q=o.q;if(!Q||!Q.length)return;c.strokeStyle='rgba(109,76,65,.9)';c.lineWidth=2.5;c.setLineDash([7,5]);c.beginPath();var a=w2s(u.x,u.y);c.moveTo(a[0],a[1]);var stp=Math.max(1,Math.floor(Q.length/300));for(var i=0;i<Q.length;i+=stp){var q2=w2s.apply(null,cellXY(Q[i]));c.lineTo(q2[0],q2[1]);}var e=w2s.apply(null,cellXY(Q[Q.length-1]));c.lineTo(e[0],e[1]);c.stroke();c.setLineDash([]);
    if(VW.s>0.5)txtHalo(c,'═ 造路 '+fmt(Q.length*G.map.cs/1000,1)+' 公里',e[0],e[1]-8,'10px sans-serif','#4E342E');});c.restore();}
(function(){var b=drawNodes;drawNodes=function(c){b(c);try{drawRd(c);}catch(e){if(window.console)console.warn('rd',e);}};})();
(function(){var b=nodeTip;nodeTip=function(N){var t=b(N);if(N.k==='off'||!G.started)return t;if(!N.fac&&N.hp!==undefined&&N.hp<99.5)t+='\n受損：完好度 '+fmt(N.hp)+'%'+(N.burn&&G.t<N.burn?'，起火燃燒中':'');
  if(N.k==='depot'&&lgRoadOn()){var d=rdDist(N);t+='\n'+(d<=1500?'道路：最近的道路約 '+kmTxt(d):'沒有道路連接（最近的道路約 '+(d>=1e8?'8 公里以上':kmTxt(d))+'）：卡車與馬車到不了，需要工兵「造路」或改用越野車輛');}
  if(!N.fac){var tn=nodeTNT(N);if(tn>200)t+='\n若被摧毀：約 '+(tn>=1000?fmt(tn/1000,1)+' 噸':fmt(tn)+' 公斤')+' TNT 當量的爆炸';}return t;};})();

/* ---------- 後勤頁：道路與車輛 ---------- */
function rdLogiHtml(side){var S=SD(side),Ls=lgStats(side),y=lgY(),xOK=featOn('xtruck'),tOK=featOn('tcarrier'),pol=S.lgVeh||'auto',st=lgRoadM()==='strict',o='<div class="lw-card"><h3>道路與車輛<small>'+(st?'嚴格模式：輪型卡車與馬車只能走道路':'輪型卡車與馬車以道路為最優先，離開道路速度約剩四成')+'；越野卡車、履帶運輸車可以越野</small></h3>';
  if(!lgRoadOn())return o+'<div class="lw-note">設定中已關閉後勤車輛的道路規則。</div></div>';
  o+='<div class="lw-opt"><span>補給車隊車種</span><select data-c="rdveh">'+LGVEH.filter(function(q){return q[0]!=='xtruck'||xOK;}).filter(function(q){return q[0]!=='track'||tOK;}).map(function(q){return '<option value="'+q[0]+'"'+(pol===q[0]?' selected':'')+'>'+q[1]+'</option>';}).join('')+'</select>';
  o+='<span>後勤部隊車輛</span>'+(xOK?'<label><input type="checkbox" data-c="rdsxc"'+(S.lgXc?' checked':'')+'>全軍的補給、衛生等後勤部隊配備越野車輛（可個別在單位面板調整）</label>':'<span class="lw-note">'+featY('xtruck')+' 年以前沒有全輪驅動卡車：輪型後勤部隊只能走道路</span>')+'</div>';
  o+='<div class="lw-kv">'+kv('改派','路線沒有道路而改派越野車輛或挑夫 '+(Ls.fb||0)+' 次'+(Ls.airDep?'；直升機、運輸機運補沒有道路的補給站 '+Ls.airDep+' 次':''))+kv('損失',(Ls.depLost?'<b style="color:#b3261e">補給站被摧毀 '+Ls.depLost+' 處，物資約 '+fmt(Ls.depT||0,1)+' 噸</b>':'沒有補給站被摧毀'))+'</div>';
  var D=nodesOf(side).filter(function(N){return N.k==='depot';});if(D.length){o+='<table class="lw-tbl"><tr><th>補給站</th><th>道路</th><th>狀況</th><th></th></tr>'+D.map(function(N){var d=rdDist(N),bad=d>1500,F=N.fac?facById(N.fac):null,hp=F?F.hp:N.hp;
      return '<tr><td>'+esc(N.name)+'</td><td>'+(bad?'<b style="color:#b3261e">沒有道路連接</b>（'+(d>=1e8?'8 公里內沒有道路':'最近約 '+kmTxt(d))+'）':'最近 '+kmTxt(d))+'</td><td>'+(hp!==undefined&&hp<99.5?'完好度 '+fmt(hp)+'%':'完好')+(N.burn&&G.t<N.burn?'・<b style="color:#E65100">起火</b>':'')+'</td><td>'+(bad&&d<1e8&&(UI.side<0||UI.side===side)?'<button type="button" class="lw-btn sm" data-a="rdacc" data-v="'+N.id+'">派工兵造路</button>':'')+'</td></tr>';}).join('')+'</table>';}
  return o+'<div class="lw-note">'+(st?'補給站離道路超過約 1.5 公里，卡車與馬車就送不到；「自動」車種會改派越野卡車（'+featY('xtruck')+' 年起）或挑夫，運量大減。':'補給站離道路超過約 1.5 公里，卡車只能緩慢越野；路線大半沒有道路時「自動」車種改派越野卡車（'+featY('xtruck')+' 年起）。')+'沒有道路連接的補給站，在有直升機（'+featY('heli')+' 年起）或空投（'+featY('airdrop')+' 年起）的年代，會從最近的本方機場派直升機或運輸機運補（每天的架次有限）。補給站可被砲擊、轟炸、飛彈擊毀或被工兵爆破，存放的彈藥與油料會殉爆；工兵構築或自動開設的設施被摧毀後直接從地圖上消失，城鎮原有的設施則留下廢墟。</div></div>';}
(function(){var b=PAGES.logi;PAGES.logi=function(host){b(host);if(!G||!G.started)return;var M=host.querySelector('.lw-main');if(!M)return;var d=document.createElement('div');d.className='lw-grid';d.innerHTML=rdLogiHtml(LG.side);M.insertBefore(d,M.children[3]||null);};})();
CHG.rdveh=function(t){SD(LG.side).lgVeh=t.value;toast('補給車隊車種：'+(LGVEH.filter(function(q){return q[0]===t.value;})[0]||['',''])[1]);};
CHG.rdsxc=function(t){SD(LG.side).lgXc=!!t.checked;toast(t.checked?'後勤部隊改用越野車輛':'後勤部隊使用一般車輛（只走道路）');};
ACT.rdacc=function(b){var N=lgNode(LG.side,+b.getAttribute('data-v'));if(!N){toast('找不到補給站。');return;}var far=rdNear(N.x,N.y,8000);if(!far){toast('8 公里內沒有道路。');return;}var e=null,bd=40000;G.units.forEach(function(u){if(u.side!==N.side||!isLeaf(u)||!onMap(u)||!canRoad(u)||u.ms==='rout')return;var d=dist(u.x,u.y,N.x,N.y)*(isEng(u)?1:1.5);if(d<bd){bd=d;e=u;}});
  if(!e){toast('40 公里內沒有可用的工兵或營建部隊。');return;}var p=cellXY(far.k),r=issue(e,'roadbuild',{x:N.x,y:N.y,from:p,rc:1});toast('已命令'+uName(e)+'從最近的道路開路到「'+N.name+'」'+(r.sec>0?'，約 '+durTxt(r.sec)+' 後送達':''));show('logi');};

/* ---------- 設定 ---------- */
var RDMN=[['prefer','道路最優先（預設）：離開道路速度約剩四成，沒有道路仍可緩慢越野'],['strict','嚴格：只能走道路（起訖點附近約 1–1.5 公里除外），到不了就改派越野車輛或挑夫'],['off','不限制（舊版：卡車可以直接越野）']];
setSec('logi','road',{t:'道路',o:30,note:'道路規則適用於補給車隊（卡車、馬車）與輪型的後勤、衛生、戰俘、難民、民事、勞軍、營建、宣傳部隊；越野卡車、履帶運輸車與履帶部隊不受限。沒有道路連接的補給站會改由直升機或運輸機運補。越野卡車與履帶運輸車出現的年份可在「年代」修改。',
  h:function(){return setOpt(setRow('道路規則',setSel('rdmode','',RDMN,lgRoadM())));}});
CHG.rdmode=function(t){var v=t.value;G.set.lgRoadM=v;G.set.lgRoad=v!=='off';G._lgpc=null;G.units.forEach(function(u){u._rbT=-1;});toast('後勤車輛道路規則：'+(RDMN.filter(function(q){return q[0]===v;})[0]||['',''])[1].split('：')[0]);};

/* ---------- 說明 ---------- */
var V12HELP='<h4>後勤道路：補給車輛以道路為最優先、工兵修路與造路、補給站可被摧毀</h4><ul>'+
 '<li><b>道路最優先</b>（預設）：補給車隊（卡車、馬車）與輪型的後勤部隊（補給、衛生救護、戰俘營、難民營、民事、勞軍、營建、宣傳）會盡量走道路；離開道路時滿載的車輛速度約剩四成，所以沒有道路的地方仍到得了，只是很慢。設定頁可改為<b>嚴格模式</b>：只能沿道路行駛，只有起點、終點附近約 1–1.5 公里可以離開道路，目標附近沒有道路時停在最接近的道路上。</li>'+
 '<li><b>例外</b>：全輪驅動的<b>越野卡車</b>（預設 1935 年起）與<b>履帶運輸車</b>（預設 1942 年起）可以越野，但越野慢、載重較小（約八成、六成）；履帶部隊（如裝甲救護車）本來就能越野。單位面板可把個別後勤部隊設為越野車輛，後勤頁可設定全軍。</li>'+
 '<li><b>補給車隊車種</b>（後勤頁）：「自動」時走卡車，路線大半沒有道路才改派越野卡車（嚴格模式下道路不通才改派，卡車出現前改用挑夫，運量大減）；也可以全部改用越野卡車或履帶車，或堅持只用一般卡車。地圖外的補給從穿出本方邊緣的道路進入。</li>'+
 '<li><b>直升機與運輸機</b>：沒有道路連接的補給站，在有直升機（預設 1950 年起）的年代由最近的本方機場派運輸直升機運補，沒有直升機時以運輸機空投；每天的架次有限，與被圍部隊的空中補給共用。</li>'+
 '<li><b>地圖的道路網</b>：新產生的地圖道路網更完整（修正了長距離道路常常算不出來的問題），城鎮與村落由道路相連，每個陸地邊緣至少有一條通往地圖外的道路；沒有聚落的沙漠也有一條過境道路。已存檔的地圖不受影響。</li>'+
 '<li><b>修路</b>（工兵、營建與勞工部隊）：點選路段，填平半徑內道路上的彈坑、清除瓦礫、拆除鐵絲網與路障、排除地雷；完成後 48 小時內這段路的泥濘車轍減少。被炸毀的橋梁要另外下令「架橋」。</li>'+
 '<li><b>造路</b>：點選終點（從工兵附近的道路開始），或按住拖曳畫出起點到終點。工兵沿車輛能通行的地形開出小路或鄉道（約兩倍時間），沿用既有道路；速度依年代（人力到推土機）、地形（森林、沼澤、岩地、陡坡較慢）、夜間與敵火而定，大河要先架橋。地圖上以虛線顯示規劃路線。</li>'+
 '<li><b>補給站可被摧毀</b>：砲擊、轟炸、空中打擊、飛彈、核爆與附近的爆炸都會損壞補給站，存放的彈藥與油料可能起火、殉爆；工兵也可以「爆破設施」點選補給站（撤退時拒止敵軍）。受損的補給站在安全時由人員慢慢修復，附近有工兵較快。</li>'+
 '<li><b>非地圖固有的建築</b>：工兵構築的野戰醫院、油庫、彈庫、簡易機場與港口，自動開設的補給站與醫院，援助團體的難民營，被摧毀後直接從地圖上消失；城鎮原有的港口、車站、機場、醫院、教堂等留下廢墟，可以修復。</li>'+
 '<li><b>AI</b>：自動開設或遷移的補給站設在道路旁；補給站沒有道路連接時派工兵開聯絡道路，附近道路被瓦礫、彈坑或路障阻斷時派工兵修路。</li></ul>';
