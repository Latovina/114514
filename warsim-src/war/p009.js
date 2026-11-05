/* ===================== v6 介面：爆炸圖示的砲擊區、民用補給設施、防空雷達控制與射程圈、時間加速與作戰時限、自動配船的命令 ===================== */
/* ---------- 砲擊區：以小型爆炸圖示代替會蓋住地圖的實心圓；選取砲兵時才畫出影響範圍 ---------- */
function boomPath(c,x,y,r,n,rot){c.beginPath();for(var i=0;i<n*2;i++){var a=rot+i*PI/n,rr=i%2?r*0.48:r*(i%4===0?1:0.82);c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();}
drawMissions=function(c){var tt=Date.now()/1000;c.save();drawRings(c);G.units.forEach(function(u){if(!u.mis||!alive(u))return;if(UI.side>=0&&u.side!==UI.side&&!seeAll())return;var M=u.mis,p=w2s(M.x,M.y);if(p[0]<-40||p[1]<-40||p[0]>VW.cw+40||p[1]>VW.ch+40)return;
    var act=G.t>=M.start,reg=!!(M.rg&&!M.reg),firing=act&&G.t-(u.lastArt||-1e9)<DT*2,sel=UI.sel.indexOf(u.id)>=0,r=reg?7:M.kind==='sat'?13:10;if(firing&&!reg)r*=1+0.12*Math.sin(tt*9+u.id);
    if(sel){c.strokeStyle='rgba(230,81,0,.75)';c.lineWidth=1.2;c.setLineDash([4,4]);c.beginPath();c.arc(p[0],p[1],Math.max(4,M.r/mpp()),0,2*PI);c.stroke();c.setLineDash([]);}
    var Q=u._art;if(sel&&firing&&Q&&G.t-Q.t<DT*3){/* 選取時畫出目前的散布：橢圓約涵蓋九成彈著，中心十字是平均彈著點 */var pq=w2s(Q.x,Q.y),m0=mpp(),ea=Math.max(3,2.15*Q.sr/m0),eb=Math.max(3,2.15*Math.sqrt(Q.sd*Q.sd+Q.sw*Q.sw/3)/m0);c.save();c.translate(pq[0],pq[1]);c.rotate(Q.fa);c.strokeStyle='rgba(183,28,28,.85)';c.lineWidth=1.2;c.setLineDash([3,3]);c.beginPath();c.ellipse(0,0,ea,eb,0,0,2*PI);c.stroke();c.setLineDash([]);c.beginPath();c.moveTo(-5,0);c.lineTo(5,0);c.moveTo(0,-5);c.lineTo(0,5);c.stroke();c.restore();
      if(VW.s>0.4){var off=Math.round(dist(Q.x,Q.y,M.x,M.y));txtHalo(c,'平均彈著點'+(off>=30?' 偏 '+(off>=1000?kmTxt(off):off+' 公尺'):''),pq[0],pq[1]+eb+11,'10px sans-serif','#b71c1c');}}
    if(firing&&UI.lay.fx){var q=w2s(u.x,u.y);c.strokeStyle='rgba(230,81,0,.55)';c.lineWidth=1;c.setLineDash([2,6]);c.beginPath();c.moveTo(q[0],q[1]);c.lineTo(p[0],p[1]);c.stroke();c.setLineDash([]);}
    c.globalAlpha=act?(firing?1:0.8):0.45;boomPath(c,p[0],p[1],r,reg?6:8,(u.id%7)*0.37);c.fillStyle=reg?'#FFE082':M.kind==='sat'?'#F4511E':'#FB8C00';c.fill();c.lineWidth=1.4;c.strokeStyle=reg?'#8D6E00':'#6D2400';c.stroke();
    if(act&&!reg){c.beginPath();c.arc(p[0],p[1],r*0.3,0,2*PI);c.fillStyle='#FFF59D';c.fill();}c.globalAlpha=1;if(reg&&VW.s>0.4)txtHalo(c,'試射',p[0],p[1]-r-7,'10px sans-serif','#6D4C00');});c.restore();};
/* 選取的防空飛彈單位：實線為攔截射程、虛線為雷達偵測距離；岸置反艦飛彈：射程 */
function drawRings(c){if(!UI.sel.length)return;var m=mpp();UI.sel.map(uById).forEach(function(u){if(!u||!alive(u)||!onMap(u))return;var p=w2s(u.x,u.y),x=samOf(u),q=mslSpec(u);
  if(x){c.strokeStyle='rgba(198,40,40,.8)';c.lineWidth=1.5;c.beginPath();c.arc(p[0],p[1],x.rng/m,0,2*PI);c.stroke();c.setLineDash([6,5]);c.strokeStyle='rgba(198,40,40,.45)';c.beginPath();c.arc(p[0],p[1],x.rad/m,0,2*PI);c.stroke();c.setLineDash([]);txtHalo(c,'攔截 '+kmTxt(x.rng)+(u.emcon===0?'（雷達開機）':'（雷達關機）'),p[0],p[1]-x.rng/m-6,'10px sans-serif','#b71c1c');}
  else if(q&&q.ship){c.strokeStyle='rgba(21,101,192,.7)';c.lineWidth=1.4;c.setLineDash([8,5]);c.beginPath();c.arc(p[0],p[1],q.r/m,0,2*PI);c.stroke();c.setLineDash([]);txtHalo(c,q.nm+' '+kmTxt(q.r),p[0],p[1]-q.r/m-6,'10px sans-serif','#0d47a1');}});}

/* ---------- 民用補給設施：中立為灰色虛線框，已知由敵方控制為敵方顏色；本方控制的設施以補給節點顯示 ---------- */
/* 開戰前（部署階段）先依目前年代預覽設施位置；開戰時以相同規則正式產生 */
function facList(){if(G.fac)return G.fac;if(!G.map)return [];var k=(G.set.y||0)+'|'+(G._mapv||0);if(!G._facP||G._facPk!==k){G._facP=facGen(G.map,G.set.y);G._facPk=k;}return G._facP;}
function facView(F){var me=UI.side;if(me<0||seeAll())return F.own;if(F.own===me)return me;return F.kn?F.kn[me]:-1;}
function drawFac(c){var L=facList();if(!L.length)return;var me=UI.side;c.save();L.forEach(function(F){F._sx=undefined;var v=facView(F);if(v>=0&&(me<0||seeAll()||v===me)&&facNode(F))return;var p=w2s(F.x,F.y);if(p[0]<-20||p[1]<-20||p[0]>VW.cw+20||p[1]>VW.ch+20)return;var col=v>=0?sideCol(v):'#6E6E6E';
    c.fillStyle='rgba(255,255,255,.85)';c.strokeStyle=col;c.lineWidth=1.6;c.setLineDash(v>=0?[]:[3,2]);c.beginPath();c.rect(p[0]-9,p[1]-9,18,18);c.fill();c.stroke();c.setLineDash([]);c.font='12px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle=col;c.fillText(NODEI[F.k]||'■',p[0],p[1]+1);
    if(F.cand>=0&&F.cand!==F.own&&G.started&&(me<0||seeAll()||F.cand===me)){c.strokeStyle=sideCol(F.cand);c.lineWidth=2;c.beginPath();c.arc(p[0],p[1],13,-PI/2,-PI/2+2*PI*clamp((G.t-F.ct)/600,0,1));c.stroke();}
    if(VW.s>1.8)txtHalo(c,F.name,p[0],p[1]+17,'10px sans-serif','#555');F._sx=p[0];F._sy=p[1];});c.restore();}
(function(){var b=drawNodes;drawNodes=function(c){drawFac(c);b(c);};})();
var FACU={port:'佔領後成為港口節點：可由海上運補，並加快登陸部隊卸載',rail:'佔領後成為鐵路節點：鐵路必須通往本方的地圖邊緣才有運量',air:'佔領後成為機場節點：可空運補給，附近的飛機可以整補',depot:'佔領後成為倉庫節點：徵用城鎮的存糧與燃料，之後由上游節點運補'};
function hitFac(sx,sy){var o=null;facList().forEach(function(F){if(F._sx!==undefined&&dist(sx,sy,F._sx,F._sy)<11)o=F;});return o;}
function facTip(F){var me=UI.side,v=facView(F),st=F.st0||{},o='民用設施：'+FACN[F.k]+'「'+F.name+'」';
  o+='\n'+(v<0?'中立：尚未被任何一方佔領':(me<0||seeAll()||v===me)?G.sides[v].name+'控制':'敵方控制'+(F.knT&&F.knT[me]?'（'+durTxt(G.t-F.knT[me])+'前確認）':''));
  if(v<0){var S=LCLS.filter(function(c){return st[c]>0;});if(S.length)o+='\n民間存量：'+S.map(function(c){return LCN[c]+' '+fmt(st[c],1);}).join('、')+' 噸';}
  o+='\n'+FACU[F.k];if(F.cand>=0&&F.cand!==F.own&&G.started&&(me<0||seeAll()||F.cand===me))o+='\n'+G.sides[F.cand].name+'正在佔領，約 '+durTxt(Math.max(0,600-(G.t-F.ct)))+'後完成';return o;}
(function(){var b=cellTip;cellTip=function(x,y){var p=w2s(x,y),F=hitFac(p[0],p[1]);if(F)return facTip(F);return b(x,y);};})();
(function(){var b=nodeTip;nodeTip=function(N){var t=b(N);if(N.fac){var F=facById(N.fac);if(F)t+='\n民用'+FACN[F.k]+'：'+(F.tOwn?durTxt(Math.max(0,G.t-F.tOwn))+'前佔領':'開戰時即控制')+'；被敵軍佔領時約一半存量損毀';}return t;};})();

/* ---------- 單位面板：防空雷達模式、匿蹤、反輻射飛彈、空中預警、偵察、自動配屬的運輸艦 ---------- */
var RADM={auto:'自動（敵機接近才開機）',on:'常開（警戒最高，容易被反輻射飛彈鎖定）',off:'靜默（關機隱蔽，無法導引飛彈）'};
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);if(!leaf)return o;var s=ST(u),x=samOf(u),X=uxOf(u),rc=rcsOf(u);
  if(x){var dmg=!radarOK(u);o+='<span>防空雷達</span><span>'+(dmg?'<b style="color:#b3261e">損毀，約 '+durTxt(u.radDmg-G.t)+' 後修復</b>':u.emcon===0?'開機中':'關機')+'；攔截射程 '+kmTxt(x.rng)+'、雷達偵測 '+kmTxt(x.rad)+'（對一般飛機）</span>';
    if(mySide()===null||u.side===mySide())o+='<span>雷達模式</span><span><select data-c="radm" data-u="'+u.id+'">'+Object.keys(RADM).map(function(k){return '<option value="'+k+'"'+((u.radMode||'auto')===k?' selected':'')+'>'+RADM[k]+'</option>';}).join('')+'</select></span>';}
  else if(X.rng&&aaOf(u,s)>0)o+='<span>防空</span><span>火砲與紅外線飛彈，射程 '+kmTxt(X.rng)+'；匿蹤機要接近到 3 公里內才打得到</span>';
  if(s.dom==='air'&&rc<0.9)o+='<span>匿蹤</span><span>雷達截面約一般飛機的 '+Math.round(rc*100)+'%，敵方雷達要更接近才偵測得到</span>';
  if(X.arm)o+='<span>反輻射飛彈</span><span>'+(u.armN===undefined?X.arm.n*Math.max(1,Math.round(u.veh0||1)):u.armN)+' 枚（射程 '+kmTxt(X.arm.r)+'）；自動攻擊開機中的敵方防空雷達</span>';
  if(s.fl.indexOf('a')>=0)o+='<span>空中預警</span><span>雷達監視約 '+kmTxt(X.rad||300000)+'，以資料鏈引導本方戰機與防空</span>';
  if(isRcn(u))o+='<span>偵察</span><span>觀測距離'+(s.dom==='air'?'＋15%':'＋35%')+'、識別較準、回報快一倍；沒有開火時不易被發現</span>';
  var C=autoCvyOf(u);if(C&&u.cvy)o+='<span>運輸</span><span>自動配屬：載運 '+u.cvy.pax.map(uById).filter(function(z){return z&&z.st==='ship';}).length+' 個單位；對船上部隊或本艦下達以陸地為目標的命令，就會駛往最近的海岸卸載</span>';
  if(u.repl>0.5||u.vrep>0.05)o+='<span>補充</span><span>'+(u.repl>0.5?'補充兵 '+fmt(u.repl)+' 名':'')+(u.vrep>0.05?(u.repl>0.5?'、':'')+'修復裝備 '+fmt(u.vrep,1)+' '+(s.vn||'件'):'')+'</span>';return o;};})();
CHG.radm=function(t){var u=uById(+t.getAttribute('data-u')),v=t.value;if(!u)return;var us=UI.sel.map(uById).filter(function(z){return z&&samOf(z)&&z.side===u.side;});if(us.indexOf(u)<0)us.push(u);us.forEach(function(z){z.radMode=v;});logE(u.side,'aa',uName(u)+(us.length>1?'等 '+us.length+' 個防空單位':'')+'的雷達改為'+RADM[v].replace(/（.*$/,''),u.x,u.y,u.id);btStatus();vDraw(false);};

/* ---------- 時間：時限快速設定與天數顯示、長期作戰設定 ---------- */
var DURP=[[24,'1 天'],[72,'3 天'],[168,'1 週'],[336,'2 週'],[720,'1 個月'],[1440,'2 個月'],[2160,'3 個月']];
function durH(h){h=+h||0;return fmt(h)+' 小時'+(h>=48?'（約 '+(h%24===0?fmt(h/24):fx(h/24,1))+' 天）':'');}
function durpHtml(){return '<select data-c="durp" title="快速設定作戰時限"><option value="0">快速設定…</option>'+DURP.map(function(q){return '<option value="'+q[0]+'">'+q[1]+'</option>';}).join('')+'</select>';}
CHG.durp=function(t){var v=+t.value;if(!v)return;G.set.dur=v;var inp=document.querySelector('input[data-c="setv"][data-f="dur"]');if(inp)inp.value=v;t.value='0';if(G.over&&G.t<v*3600){G.over=null;toast('已延長作戰時限，可繼續作戰。');}else toast('作戰時限設為 '+durH(v)+'。');barRender();};
CHG.setsus=function(t){G.set.sustain=t.checked;};

/* ---------- 補給頁：民用設施一覽 ---------- */
(function(){var b=PAGES.logi;PAGES.logi=function(host){b(host);var main=host.querySelector('.lw-main');if(!main)return;var L=facList();if(!L.length)return;var d=document.createElement('div');d.className='lw-card';d.innerHTML=facCard(L);main.appendChild(d);};})();
function facCard(L){var me=UI.side>=0?UI.side:LG.side,n={own:0,en:0,neu:0},kk={port:0,rail:0,air:0,depot:0};
  var rows=L.slice().sort(function(a,b){return ['port','rail','air','depot'].indexOf(a.k)-['port','rail','air','depot'].indexOf(b.k);}).map(function(F){var v=UI.side<0||seeAll()?F.own:F.own===me?me:F.kn?F.kn[me]:-1;kk[F.k]++;if(v===me)n.own++;else if(v>=0)n.en++;else n.neu++;
    var N=F.own===me?facNode(F):null,stt=v<0?'中立':v===me?'本方':'敵方'+(F.knT&&F.knT[me]?'（'+durTxt(G.t-F.knT[me])+'前）':'');
    return '<tr><td>'+NODEI[F.k]+' '+esc(F.name)+'</td><td>'+FACN[F.k]+'</td><td>'+esc(placeTxt(F.x,F.y))+'</td><td>'+stt+'</td><td class="n">'+(N?LCLS.map(function(c){return fmt(N.st[c]||0);}).join('／'):v<0?LCLS.map(function(c){return fmt((F.st0||{})[c]||0);}).join('／'):'—')+'</td></tr>';}).join('');
  return '<h3>民用補給設施<small>港口 '+kk.port+'、鐵路車站 '+kk.rail+'、機場 '+kk.air+'、倉庫 '+kk.depot+'；本方 '+n.own+'、敵方 '+n.en+'、中立 '+n.neu+'</small></h3><div class="lw-note">依地形與聚落配置在戰場上：港口在港區碼頭或臨海市鎮，鐵路車站在鐵路經過的聚落，機場在較大市鎮外平坦開闊的地方，倉庫在城鎮裡。開戰時都是中立的；地面部隊在設施附近停留十分鐘、而且附近沒有敵軍，就能佔領並啟用為補給節點（第一次佔領會徵用民間存糧，居民的糧食減少、不滿升高）。被敵軍奪走時約一半存量損毀。</div>'+
    '<div class="lw-sc"><table class="lw-tbl"><tr><th>名稱</th><th>種類</th><th>位置</th><th>控制</th><th class="n">存量（糧／彈／油／草，噸）</th></tr>'+rows+'</table></div>';}

/* ---------- 自動配屬的運輸艦：命令面板說明 ---------- */
(function(){var b=btOrd;btOrd=function(){b();var us=UI.sel.map(uById).filter(Boolean),el=btEl('bord');if(!el||!us.length||!us.some(function(u){return autoCvyOf(u);}))return;var d=document.createElement('div');d.className='lw-note';d.textContent='部隊在自動配屬的運輸艦上：下達以陸地為目標的命令後，運輸艦會駛往離目標最近的海岸讓部隊登陸，上岸後執行命令；對運輸艦下達移動命令也會讓它駛往該處附近的海岸卸載。';el.insertBefore(d,el.firstChild);};})();

var V6HELP='<h4>v6：海上部隊、砲兵試射與偵察</h4><ul><li>部署或增援時落在海上的陸軍單位會自動配屬運輸艦（依年代為帆船、徵用商船、運輸艦或登陸艦）。對船上的部隊或運輸艦下達以陸地為目標的命令，運輸艦會駛往離目標最近的海岸，以小艇或登陸艇分批送部隊上岸，上岸後執行原本的命令；卸載完畢的運輸艦返航駛離。落在湖泊或河道上的部隊以舟船擺渡到最近的岸邊。</li>'+
 '<li>冷戰以前的砲兵要先試射校正才進入效力射：火藥時代約 4 分鐘且必須看得到目標；1900 年前後約 15 分鐘、一次大戰約 20 分鐘、二次大戰約 7 分鐘（有前進觀測員、空中觀測或砲兵自己看得到目標時）。沒有觀測只能依地圖概略修正，時間約 2.5 倍。試射彈殺傷很小，卻會讓敵人警覺、也會暴露砲兵陣地。</li><li>砲彈不是在圓圈裡隨機亂落：每次射擊任務有一個「平均彈著點」，和瞄準點之間有系統誤差（測地、氣象、裝藥、地圖），沒有觀測時會一直偏在同一邊（舊時代可達數百公尺），有前進觀測時每次修正都拉近；砲彈以平均彈著點為中心，沿射向前後散得較開、左右較集中，砲連各砲並排，一齊射的彈著排成一條橫向的彈幕；面積射擊時火力一排一排有系統地轉移。火箭散布最大，精準彈藥幾乎沒有偏差。選取正在射擊的砲兵，紅色虛線橢圓是目前的散布、十字是平均彈著點。開戰前已標定的陣地前方，以及已經校正過的地點（24 小時內），可以直接效力射。地圖上的砲擊區改用爆炸圖示：淡黃色是試射中、橘色是效力射、紅色是飽和打擊；選取砲兵才畫出影響範圍。地毯式轟炸的落彈帶只畫細虛線框與沿線的爆炸圖示，飛彈落點也以爆炸圖示表示（全數被攔截時為灰色），不再用實心色塊蓋住地圖。</li>'+
 '<li>偵察：偵察單位的觀測距離較遠（地面＋35%、空中＋15%），識別敵軍番號與兵種的距離較遠，回報快一倍，沒有開火時也比較不容易被發現。新增偵察機（一戰、冷戰戰術偵察、高空偵察）、空中預警機、空中地面監視機與偵察無人機，以「偵察」或「巡邏」命令在指定空域盤旋。其他情報來源：電子戰單位以測向找出敵方司令部與開機中的雷達；對本方友善的城鎮居民會通報附近的敵軍（延遲半小時以上）；雷達監視網的空中航跡會自動回報。</li></ul>'+
 '<h4>v6：匿蹤、防空與反艦飛彈</h4><ul><li>新增匿蹤攻擊機、匿蹤戰鬥機、匿蹤多用途戰機、匿蹤戰略轟炸機，防空壓制機（野鼬鼠）與電子攻擊機，地對空飛彈營與連（SA-2、SA-6、短程、愛國者／S-300、S-400 級、彈砲合一），以及岸置反艦飛彈連。新編制：偵察航空隊、防空壓制打擊群、匿蹤聯隊、防空飛彈旅、整合防空旅、岸防飛彈旅。</li>'+
 '<li>防空飛彈必須雷達開機、完成放列才能導引；雷達偵測距離乘上目標的雷達截面，匿蹤機要接近得多才會被發現，電子干擾機附近再打折扣。火砲與紅外線飛彈打不到 3 公里外的匿蹤機與小型無人機。雷達模式可選自動、常開或靜默，選取防空單位時地圖上畫出攔截射程與雷達偵測範圍。</li>'+
 '<li>空戰需要先發現對方：目視距離內，或靠自己的雷達、空中預警機與資料鏈（1975 年後）。對方看不到自己時命中率提高。防空壓制機在空中時會對開機中的敵方雷達發射反輻射飛彈；訓練好的防空部隊會關機規避，舊型飛彈因此失去目標，新型有座標記憶。雷達被擊毀後要數小時才能修復或換裝。</li>'+
 '<li>岸置反艦飛彈連自動攻擊射程內、情報圖上已知的敵艦（由電腦指揮的艦艇也會自動攻擊）；防空艦可以攔截。</li></ul>'+
 '<h4>v6：長期作戰與民用補給設施</h4><ul><li>作戰時限可設到 3 個月（設定頁有快速設定），時間加速增加每秒 1 小時與 3 小時。方面軍級的劇本改為以月計：聯合登陸、戰區聯合作戰、瓜達康納爾島、圍城、大城市攻防、佔領與游擊各約一個月，塞班島約 25 天。</li>'+
 '<li>長期作戰時，脫離戰鬥六小時以上、而且在補給線內的部隊會逐步補充兵員（補充兵訓練較差，會拉低平均訓練）並修復受損裝備；每方的補充兵來源有限，而且要有地圖外基地或控制港口、鐵路車站、機場才送得進來，孤立的守軍只能靠增援。回放紀錄在作戰拉長時自動降低密度，記憶體不會無限增加。</li>'+
 '<li>港口、鐵路車站、機場與城鎮倉庫依地形與聚落配置在戰場上，開戰時中立，部隊佔領後才能作為補給節點，被奪取時約一半存量損毀；補給頁列出所有設施。「補給節點」工具只能放置補給站與地圖外基地。</li></ul>';
