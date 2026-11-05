/* ===================== 航空攻擊介面：轟炸區（帶狀、圓形、自訂範圍；大小可調）、架次選項、航空單位的機種與狀態、地圖上的轟炸區與落彈範圍 ===================== */
/* 這一版新增功能的說明，各模組依序加入，說明頁一起顯示 */
var HELP14=[];
ordReg('bombzone','轟炸區','fire',{g:'▦',col:'#6D4C41'});

DCN.bombzone='轟炸區：在地圖上劃出要轟炸的範圍，形狀與大小自訂。帶狀：按住拖曳畫出投彈航線（由起點飛向終點），寬度在選項調整；只點一下則以該點為中心、沿進場方向放一條選定長度的帶狀區。圓形：點選中心，或按住拖曳拉出半徑。自訂範圍：按住拖曳圈出任意形狀。'+
  '轟炸機與攻擊機飛抵後一次投下全部炸彈，沿航向脫離返航，不在上空盤旋；炸彈平均落在範圍內，範圍越大每平方公里的炸彈越少。整批落彈有瞄準誤差（二戰時期可達數百公尺到一公里，夜間與壞天氣更大），常偏向進場的一側；請讓本方部隊遠離。戰鬥機會在上空掩護。';
LINEORD.bombzone=1;
POLYORD.bombzone=function(){return bzShape()==='poly';};
function bzShape(){var z=UI.ordOpt.zs;return z==='circle'||z==='poly'?z:'strip';}
function bzLeaves(us){return v5Leaves(us,function(l){return airRun(l);});}
(function(){var b=canOrd;canOrd=function(u,k){if(k==='bombzone'){if(u.cvy||u.st==='ship')return false;var L=isLeaf(u)?[u]:leavesOf(u).filter(alive);return L.some(function(l){return alive(l)&&airRun(l);});}return b(u,k);};})();
/* ---------- 命令選項：形狀、大小、架次 ---------- */
var BZW=[200,400,600,800,1200,1600,2500,4000],BZL=[800,1500,2000,3000,5000,8000],BZR=[300,500,800,1200,1600,2000,3000];
function bzSel(f,arr,def,lab){var v=+UI.ordOpt[f]||def;return '<select data-c="oo" data-f="'+f+'">'+arr.map(function(x){return '<option value="'+x+'"'+(x===v?' selected':'')+'>'+lab(x)+'</option>';}).join('')+'</select>';}
function sorSel(){var v=UI.ordOpt.sor||'auto';return '<select data-c="oo" data-f="sor">'+[['auto','依任務：打擊目標持續出擊，轟炸區與地毯式轟炸單次'],['one','單次：投彈後返航，任務結束'],['rep','持續：返航整補後再出擊，直到下達新命令']].map(function(q){return '<option value="'+q[0]+'"'+(v===q[0]?' selected':'')+'>'+q[1]+'</option>';}).join('')+'</select>';}
function bzOptArea(){var zs=bzShape(),O=UI.ordOpt;return zs==='strip'?(+O.bw||800)*(+O.bl||2000):zs==='circle'?PI*Math.pow(+O.br||800,2):0;}
(function(){var b=v4Opts;v4Opts=function(k,O,us){var o=b(k,O,us);
  if(k==='bombzone'){var zs=bzShape(),B=bzLeaves(us),tons=sum(B,airTons),A=bzOptArea();
    o+='<span>形狀</span><select data-c="oo" data-f="zs">'+[['strip','帶狀：按住拖曳畫出投彈航線'],['circle','圓形：點選中心，或拖曳拉出半徑'],['poly','自訂範圍：按住拖曳圈出形狀']].map(function(q){return '<option value="'+q[0]+'"'+(zs===q[0]?' selected':'')+'>'+q[1]+'</option>';}).join('')+'</select>';
    if(zs==='strip')o+='<span>寬度</span>'+bzSel('bw',BZW,800,kmTxt)+'<span>長度</span>'+bzSel('bl',BZL,2000,function(x){return kmTxt(x)+'（只點一下時；拖曳時依畫出的長度）';});
    if(zs==='circle')o+='<span>半徑</span>'+bzSel('br',BZR,800,function(x){return kmTxt(x)+'（只點一下時；拖曳時依拉出的半徑）';});
    if(zs==='poly')o+='<span>範圍</span><span class="lw-note">按住滑鼠（或手指）在地圖上拖曳，圈出要轟炸的範圍，放開時自動封閉；大小就是圈出的範圍</span>';
    o+='<span>投彈</span><span class="lw-note">'+(B.length?B.length+' 個中隊、約 '+fmt(sum(B,function(l){return l.veh;}))+' 架，載彈約 '+fmt(tons,tons<10?1:0)+' 公噸'+(A?'；這個大小（約 '+tzAreaTxt(A)+'）平均每平方公里約 '+fmt(tons/(A/1e6),1)+' 公噸':'')+'。範圍越大炸彈越分散，殺傷越低':'選取的部隊沒有轟炸機或攻擊機')+'</span>';
    o+='<span>架次</span>'+sorSel();}
  else if((k==='strike'||k==='carpet')&&bzLeaves(us).length)o+='<span>架次</span>'+sorSel();
  return o;};})();
(function(){var b=CHG.oo;CHG.oo=function(t){var f=t.getAttribute('data-f');if(f==='bw'||f==='bl'||f==='br'){UI.ordOpt[f]=+t.value;btOrd();vDraw(false);return;}b(t);};})();
(function(){var b=optsFor;optsFor=function(k){var o=b(k);if(/^(strike|carpet|bombzone)$/.test(k)&&UI.ordOpt.sor&&UI.ordOpt.sor!=='auto')o.sor=UI.ordOpt.sor;return o;};})();
/* ---------- 下令：點一下、拖曳、圈出範圍 ---------- */
function bzCep(u){var X=cpSpec(u),y=uEra(u).y||1943;return ((X&&X.cep)||(y<1950?350:y<1980?150:40))*(airRole(u)==='attack'?0.5:1);}
function bzFriendly(g,B){if(!B.length)return [];var side=B[0].side,m=bzCep(B[0])*1.2;return G.units.filter(function(t){return t.side===side&&isLeaf(t)&&onMap(t)&&ST(t).dom!=='air'&&tzSd(g,t.x,t.y)<m;});}
(function(){var b=issueSel;issueSel=function(k,x,y,extra){if(k!=='bombzone')return b(k,x,y,extra);extra=Object.assign({},extra||{});var zs=extra.zs||bzShape();
  if(zs==='poly'&&!extra.poly){toast('「自訂範圍」：請按住滑鼠（或手指）在地圖上拖曳，圈出要轟炸的範圍。');return;}
  extra.zs=zs;if(zs==='strip'){extra.w=+UI.ordOpt.bw||800;if(extra.x1===undefined)extra.zl=+UI.ordOpt.bl||2000;}if(zs==='circle'&&!extra.zr)extra.zr=+UI.ordOpt.br||800;
  var B=bzLeaves(UI.sel.map(uById).filter(Boolean)),g=tzGeom(Object.assign({x:x,y:y},extra),B[0]||null),ff=bzFriendly(g,B),r=b(k,x,y,extra);
  if(ff.length)toast('⚠ 轟炸區（含落彈誤差）內有本方 '+ff.length+' 個單位：'+ff.slice(0,3).map(uName).join('、')+(ff.length>3?'等':'')+'，可能被誤炸',5000);return r;};})();
(function(){var b=btLine;btLine=function(x0,y0,x1,y1){if(UI.tool==='ord'&&UI.ord&&UI.ord.k==='bombzone'){var zs=bzShape(),d=dist(x0,y0,x1,y1);
    if(zs==='circle'){if(d<100)issueSel('bombzone',x0,y0);else issueSel('bombzone',x0,y0,{zs:'circle',zr:clamp(d,150,6000)});return;}
    if(d<150){issueSel('bombzone',x1,y1);return;}issueSel('bombzone',x0,y0,{zs:'strip',x1:x1,y1:y1});return;}return b(x0,y0,x1,y1);};})();
/* 圈出的範圍：依最小間距抽稀（最多 64 個頂點），太小的不算 */
function bzSimplify(P){var n=P.length>>1,xs=[],ys=[],i;for(i=0;i<n;i++){xs.push(P[2*i]);ys.push(P[2*i+1]);}
  var w=Math.max.apply(null,xs)-Math.min.apply(null,xs),h=Math.max.apply(null,ys)-Math.min.apply(null,ys),md=Math.max(40,Math.max(w,h)/48),o=[xs[0],ys[0]];
  for(i=1;i<n;i++){if(dist(xs[i],ys[i],o[o.length-2],o[o.length-1])>=md)o.push(xs[i],ys[i]);}
  if(o.length>128){var st=Math.ceil((o.length/2)/64),q=[];for(i=0;i<o.length/2;i+=st)q.push(o[2*i],o[2*i+1]);o=q;}
  if(o.length>=8&&dist(o[0],o[1],o[o.length-2],o[o.length-1])<md)o.splice(o.length-2,2);return o.map(function(v){return Math.round(v);});}
(function(){var b=btPoly;btPoly=function(P){if(!(UI.tool==='ord'&&UI.ord&&UI.ord.k==='bombzone'))return b(P);var Q=bzSimplify(P);if(Q.length<6){toast('範圍太小，請圈出一個較大的範圍。');return;}
  var g=tzGeom({zs:'poly',x:0,y:0,poly:Q},null);if(g.area<2e4){toast('範圍太小（至少約 2 公頃）。');return;}issueSel('bombzone',Math.round(g.cx),Math.round(g.cy),{zs:'poly',poly:Q});};})();
(function(){var b=modeBt;modeBt=function(){b();if(VW.mode&&UI.tool==='ord'&&UI.ord&&UI.ord.k==='bombzone'){var zs=bzShape();VW.mode.hidden=false;
  VW.mode.innerHTML='「轟炸區」：'+(zs==='strip'?'按住拖曳畫出投彈航線（起點→終點），或點一下放置':zs==='circle'?'點選中心，或按住拖曳拉出半徑':'按住拖曳圈出要轟炸的範圍')+'（形狀與大小在命令選項調整）<button type="button" data-a="ordx">取消</button>';}};})();
(function(){var b=CHG.oo;CHG.oo=function(t){b(t);if(t.getAttribute('data-f')==='zs')modeBt();};})();
/* ---------- 地圖預覽：範圍、進場方向、危險區內的我軍 ---------- */
function bzPrevGeom(hv,u0){var zs=bzShape(),D=VW.drag,O=UI.ordOpt;
  if(D&&D.kind==='line'){if(zs==='circle'&&dist(D.wx,D.wy,hv.wx,hv.wy)>=100)return tzGeom({zs:'circle',x:D.wx,y:D.wy,zr:clamp(dist(D.wx,D.wy,hv.wx,hv.wy),150,6000)},u0);if(zs==='strip'&&dist(D.wx,D.wy,hv.wx,hv.wy)>=150)return tzGeom({x:D.wx,y:D.wy,x1:hv.wx,y1:hv.wy,w:+O.bw||800},u0);}
  if(zs==='circle')return tzGeom({zs:'circle',x:hv.wx,y:hv.wy,zr:+O.br||800},u0);if(zs==='strip')return tzGeom({x:hv.wx,y:hv.wy,zl:+O.bl||2000,w:+O.bw||800},u0);return null;}
/* 虛線外框加白色光暈，在深色地形上也看得清楚 */
function bzStroke(c,col,w,dash){c.setLineDash([]);c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=w+2.5;c.stroke();c.setLineDash(dash||[]);c.strokeStyle=col;c.lineWidth=w;c.stroke();c.setLineDash([]);}
function bzPathW(c,P){c.beginPath();for(var i=0;i<P.length;i+=2){var q=w2s(P[i],P[i+1]);if(i)c.lineTo(q[0],q[1]);else c.moveTo(q[0],q[1]);}c.closePath();}
function bzPrev(c,hv){var us=UI.sel.map(uById).filter(Boolean),B=bzLeaves(us);if(!B.length)return;var D=VW.drag,g=bzPrevGeom(hv,B[0]);
  if(!g){if(!(D&&D.kind==='draw'))txtHalo(c,'按住拖曳圈出轟炸範圍',hv.sx+14,hv.sy-14,'bold 12px sans-serif','#4E342E');else{var Q=D.pts.concat([hv.wx,hv.wy]);if(Q.length>=6){var g2=tzGeom({zs:'poly',x:0,y:0,poly:Q},null),t2=sum(B,airTons);txtHalo(c,'▦ '+tzAreaTxt(g2.area)+'・每平方公里約 '+fmt(t2/Math.max(0.01,g2.area/1e6),1)+' 公噸',hv.sx+14,hv.sy-14,'bold 12px sans-serif','#4E342E');}}return;}
  var P=tzPoly(g);bzPathW(c,P);c.fillStyle='rgba(109,76,65,.24)';c.fill();bzStroke(c,'rgba(78,52,46,.95)',2);
  var ext=g.k==='strip'?g.L/2:g.R,fx=Math.cos(g.ang),fy=Math.sin(g.ang),a=w2s(g.cx-fx*(ext+1600),g.cy-fy*(ext+1600)),e=w2s(g.cx-fx*ext,g.cy-fy*ext);arrow(c,a[0],a[1],e[0],e[1],'rgba(78,52,46,.85)',[4,4],1.5);
  var m=bzCep(B[0])*1.2;if(m/mpp()>3){c.strokeStyle='rgba(198,40,40,.75)';c.setLineDash([6,4]);c.lineWidth=1.2;if(g.k==='circle'){var pc=w2s(g.cx,g.cy);c.beginPath();c.arc(pc[0],pc[1],(g.r+m)/mpp(),0,2*PI);c.stroke();}else if(g.k==='strip'){bzPathW(c,tzPoly(tzGeom({x:g.x0-fx*m,y:g.y0-fy*m,x1:g.x1+fx*m,y1:g.y1+fy*m,w:g.W+2*m},null)));c.stroke();}c.setLineDash([]);}
  var ff=bzFriendly(g,B);ff.forEach(function(t){var p=w2s(t.x,t.y);c.strokeStyle='#C62828';c.lineWidth=2.5;c.beginPath();c.arc(p[0],p[1],14,0,2*PI);c.stroke();});
  var tons=sum(B,airTons),rho=tons/Math.max(0.01,g.area/1e6);txtHalo(c,'▦ '+tzAreaTxt(g.area)+'・約 '+fmt(tons,tons<10?1:0)+' 公噸・每平方公里 '+fmt(rho,1)+' 公噸'+(ff.length?'　⚠ 我軍 '+ff.length+' 個單位在危險區內':''),hv.sx+14,hv.sy-14,'bold 12px sans-serif',ff.length?'#B71C1C':'#4E342E');}
(function(){var b=drawTool;drawTool=function(c){b(c);var hv=VW.hover;if(!hv||!G||!G.started)return;if(UI.tool==='ord'&&UI.ord&&UI.ord.k==='bombzone'&&UI.sel.length){c.save();try{bzPrev(c,hv);}catch(e){if(window.console)console.warn('bz',e);}c.restore();}};})();
/* ---------- 地圖：排定的轟炸區（本方）與剛投彈的範圍（雙方都看得到） ---------- */
function bzDraw(c){var me=mySide(),all=UI.side<0||seeAll(),sel={},Z={};UI.sel.forEach(function(id){sel[id]=1;});
  G.units.forEach(function(u){var o=u.ord;if(!o||o.k!=='bombzone'||o.st==='done'||!alive(u))return;if(!all&&u.side!==me)return;var key=[o.zs||'strip',Math.round(o.x),Math.round(o.y),o.x1===undefined?'':Math.round(o.x1),o.zr||'',o.poly?o.poly.length:0].join('|');
    if(!Z[key])Z[key]={o:o,u:u,n:0,sel:false};Z[key].n++;if(sel[u.id]||sel[u.p])Z[key].sel=true;});
  c.save();Object.keys(Z).forEach(function(k){var z=Z[k],g=tzGeom(z.o,z.u);bzPathW(c,tzPoly(g));c.fillStyle='rgba(109,76,65,'+(z.sel?0.2:0.1)+')';c.fill();bzStroke(c,z.sel?'rgba(78,52,46,.95)':'rgba(78,52,46,.7)',z.sel?2:1.4,[7,5]);
    var p=w2s(g.cx,g.cy);if(VW.s>0.25||z.sel)txtHalo(c,'▦ 轟炸區'+(z.n>1?'（'+z.n+' 個中隊）':''),p[0],p[1],'bold 11px sans-serif','#4E342E');});
  (G._bzv||[]).forEach(function(q){var age=G.t-q.t;if(age>2400||age<0)return;var k=1-age/2400;bzPathW(c,q.P);c.fillStyle='rgba(191,54,12,'+(0.2*k).toFixed(3)+')';c.fill();c.globalAlpha=0.3+0.7*k;bzStroke(c,'rgba(109,36,0,.85)',1.3,[3,4]);c.globalAlpha=1;});
  c.restore();}
(function(){var b=drawProj;drawProj=function(c){b(c);if(!G||!G.started)return;try{bzDraw(c);}catch(e){if(window.console)console.warn('bz',e);}};})();
/* ---------- 特效：炸彈落在整個範圍裡 ---------- */
(function(){var b=FXS.carpet;FXS.carpet=function(e){if(!e.tz)return b(e);var g=e.tz,T=FX.clk,fx=Math.cos(g.ang),fy=Math.sin(g.ang),n=clamp(Math.round(Math.sqrt(g.area)/(FX.lvl>=2?90:180)),5,36),k=0,tries=0;
  while(k<n&&tries<n*40){tries++;var x=g.cx+(Math.random()*2-1)*g.R,y=g.cy+(Math.random()*2-1)*g.R;if(tzSd(g,x,y)>0)continue;fxP({k:'bm',x0:x-fx*600,y0:y-fy*600,x1:x,y1:y,t0:T+k*0.08,d:1.0,then:{k:'ex',sz:38}});k++;}};})();
/* ---------- 單位面板：機種、目前階段、架次、轟炸區 ---------- */
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);if(!leaf||ST(u).dom!=='air')return o;var r=airRole(u),q=u.ord,
    ph=u.st==='base'?(u.readyT&&G.t<u.readyT?'在基地整補（約 '+durTxt(u.readyT-G.t)+' 後可再出擊）':'在基地待命'):({go:'飛往目標',loiter:'在目標上空盤旋',egress:'投彈後沿航向脫離',rtb:'返航'})[u.task]||'';
  o+='<span>機種</span><span>'+(AIRRN[r]||'')+(airRun(u)?'：飛抵後一次投下全部炸彈並脫離，不盤旋':r==='fighter'?'：在目標上空巡邏、掃射':'')+'</span>';
  if(ph)o+='<span>航空</span><span>'+ph+(u.sorties?'；已出擊 '+u.sorties+' 架次':'')+'</span>';
  if(q&&q.st!=='done'&&AIRRUNK.test(q.k)&&airRun(u))o+='<span>架次</span><span>'+(airRep(q)?'持續出擊（返航整補後再飛，直到下達新命令）':'單次（投彈後任務結束）')+'</span>';
  if(q&&q.k==='bombzone'&&q.st!=='done'){var g=tzGeom(q,u);o+='<span>轟炸區</span><span>'+tzDesc(g)+'，約 '+tzAreaTxt(g.area)+'；載彈約 '+fmt(airTons(u),1)+' 公噸，平均每平方公里約 '+fmt(airTons(u)/Math.max(0.01,g.area/1e6),1)+' 公噸</span>';}return o;};})();
HELP14.push('<h4>航空攻擊：轟炸機直線投彈、自訂轟炸區</h4><ul>'+
  '<li><b>不再盤旋</b>：轟炸機、攻擊機、俯衝與魚雷轟炸機執行空中打擊、轟炸、地毯式轟炸時，沿進場方向直飛目標，一次投下全部炸彈，再沿原航向飛離約 3 公里後返航；在敵方防空火力下的時間大幅縮短。戰鬥機、攻擊直升機、無人機、飛艇與飛行生物仍在目標上空巡邏、掃射。</li>'+
  '<li><b>點目標打擊</b>：炸彈分給目標附近最多三個已知敵軍（5：3：2），附近有敵方設施或補給站時約三成五投向設施；找不到目標就攜彈返航。</li>'+
  '<li><b>轟炸區</b>（命令列「▦ 轟炸區」）：形狀與大小自訂。<b>帶狀</b>＝按住拖曳畫出投彈航線，寬度 200 公尺～4 公里，只點一下則沿進場方向放置選定長度；<b>圓形</b>＝點選中心或拖曳拉出半徑；<b>自訂範圍</b>＝按住拖曳圈出任意形狀（例如沿著敵軍陣地、避開我軍或村莊）。'+
  '炸彈平均落在範圍內：範圍越大，每平方公里的噸數越少、殺傷越分散；命令選項與滑鼠旁會顯示面積、總噸數與密度，危險區（加上落彈誤差）內的我軍會以紅圈標出。整批落彈有瞄準誤差，二戰時期可達數百公尺到一公里，常偏向進場一側。</li>'+
  '<li><b>架次</b>：「依任務」＝打擊目標持續出擊（返航整補後再飛），轟炸區與地毯式轟炸只飛一趟；也可指定「單次」或「持續」。對整個航空編制下令時，轟炸機與攻擊機分別投彈，戰鬥機在上空掩護。</li>'+
  '<li>地圖上以虛線框標出排定的轟炸區，剛投彈的範圍以淡紅色框標示約 40 分鐘。單位面板顯示機種、目前階段（飛往目標、投彈後脫離、返航、整補）與架次。</li></ul>');
