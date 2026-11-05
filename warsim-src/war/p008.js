/* ===================== 作戰頁 v5：飽和打擊、地毯式轟炸、飛彈精確打擊、戰略核武目標選取、運輸船增援、航艦與船團狀態 ===================== */
ordReg('sat','飽和打擊','fire',{g:'✹',col:'#D84315'});ordReg('carpet','地毯式轟炸','fire',{g:'▤',col:'#4E342E'});ordReg('msl','飛彈打擊','fire',{g:'➶',col:'#283593'});

Object.assign(DCN,{sat:'飽和打擊：點選目標。火箭砲一次齊射全部彈藥；師、旅等編制則讓轄下所有在射程內的火砲在同一時刻彈著（TOT），第一輪在敵軍來不及掩蔽時落下，殺傷最大。打完需要長時間補充彈藥，城鎮與平民也會遭殃。',
  carpet:'地毯式轟炸：點選瞄準點。重型與中型轟炸機沿進場方向在帶狀區域密集投彈，戰鬥機在上空掩護。二戰時期高空投彈的誤差可達數百公尺到一公里，而且常落在瞄準點之前——也就是我軍這一側；請讓本方部隊遠離虛線標示的危險區。城鎮會被夷平、道路滿布彈坑、區內平民大量死傷。',
  msl:'區域外飛彈精確打擊：點選目標（自動鎖定 700 公尺內已知的敵軍單位；反艦飛彈鎖定附近艦艇）。在射程外發射，敵方防空與反飛彈系統可以攔截，同時來襲越多越容易突破。適合打擊司令部、砲兵、防空、橋梁與機場；固定導引的巡弋飛彈打不準正在移動的目標。'});
Object.assign(FLAGN,{v:'地毯式轟炸',w:'俯衝轟炸',o:'艦載機（可在航艦起降）',y:'區域外飛彈',z:'飽和打擊（一次齊射）',i:'運輸船（運兵）'});
ARRM.push(['ship','運輸船（海運卸載）']);
var ARRN={para:'在地圖上指定空降場；部隊由後方乘運輸機飛抵後傘降，會遭沿途防空火力射擊，落地後需要集結。',heli:'在地圖上指定降落區；部隊由直升機運抵，散布小、集結快。',sea:'在地圖上指定灘頭（陸地）；部隊從最近的外海出發，登陸前非常脆弱。',fly:'只適用航空器：由地圖外基地起飛，直接飛往指定地點巡邏或打擊。',
  ship:'在地圖上指定灘頭（陸地）。部隊搭乘運輸船由地圖邊緣的海面駛來，在灘頭外海以小艇或登陸艇分批卸載；船被擊沉時船上官兵隨船落海。可選「趁夜駛入」以避開敵機（夜間卸載較慢）。'};
var SHIPT=[['','依年代自動'],['trs1800','運輸帆船'],['trs1914','運輸船（徵用商船）'],['trs1940','運輸艦（二戰）'],['dxt1940','高速運輸驅逐艦（夜間運兵，無法載重裝備）'],['trs1970','戰車登陸艦（冷戰）'],['trs2000','船塢登陸艦（現代）']];
(function(){var base=canOrd;canOrd=function(u,k){if(u.cvy||u.st==='ship'){/* 自動配屬的運輸艦：船上部隊可接受命令（上岸後執行），運輸艦本身可移動或停止 */var A=typeof autoCvyOf==='function'?autoCvyOf(u):null;if(!A)return false;if(u.cvy)return k==='move'||k==='halt';if(k==='sat'||k==='carpet'||k==='msl')return false;return base(u,k);}if(k==='sat')return canSat(u);if(k==='carpet')return canCarpet(u);if(k==='msl')return canMsl(u);return base(u,k);};})();
function v5Leaves(us,f){var o=[];us.forEach(function(u){(isLeaf(u)?[u]:leavesOf(u)).forEach(function(l){if(alive(l)&&f(l)&&o.indexOf(l)<0)o.push(l);});});return o;}
/* 命令面板的選項 */
(function(){var b=v4Opts;v4Opts=function(k,O,us){var o=b(k,O,us);
  if(k==='msl'){var L=v5Leaves(us,function(l){return mslLeft(l)>0;}),tot=sum(L,mslLeft);o+='<span>每單位發射</span><select data-c="oo" data-f="msn">'+[1,2,4,8,16,32].filter(function(v){return v<=Math.max(1,tot);}).map(function(v){return '<option value="'+v+'"'+((O.msn||4)===v?' selected':'')+'>'+v+' 枚</option>';}).join('')+'</select><span>可用飛彈</span><span class="lw-note">'+(L.length?L.slice(0,6).map(function(l){var q=mslSpec(l);return esc(uName(l))+'：'+q.nm+' '+mslLeft(l)+' 枚（射程 '+kmTxt(q.r)+'）';}).join('<br>')+(L.length>6?'<br>…等 '+L.length+' 個單位':''):'無')+'</span>';}
  if(k==='sat'){var F=v5Leaves(us,function(l){return indOf(l,ST(l))>0&&ST(l).dom!=='air';}),Z=F.filter(function(l){return ST(l).fl.indexOf('z')>=0;});o+='<span>彈著時間</span><select data-c="oo" data-f="sprep">'+[10,15,20,30,45,60].map(function(v){return '<option value="'+v+'"'+((O.sprep||15)===v?' selected':'')+'>規劃完成後 '+v+' 分鐘</option>';}).join('')+'</select><span>參與</span><span class="lw-note">'+F.length+' 個火砲或火箭單位'+(Z.length?'（其中 '+Z.length+' 個齊射全部彈藥）':'')+'；射程外的單位會先移動，晚到的不會同時彈著</span>';}
  if(k==='carpet'){var B=v5Leaves(us,function(l){var s=ST(l);return s.dom==='air'&&s.fl.indexOf('v')>=0;}),ac=sum(B,function(l){return l.veh;});if(B.length){var X=cpSpec(B[0]),g=cpGeom(B[0],B[0].veh);o+='<span>轟炸機</span><span class="lw-note">'+B.length+' 個中隊、約 '+fmt(ac)+' 架，載彈約 '+fmt(sum(B,function(l){var x=cpSpec(l);return x?x.bt*l.veh:0;}))+' 公噸；每中隊投彈帶約 '+kmTxt(g.L)+' × '+kmTxt(g.W)+'；落彈誤差約 '+kmTxt(X.cep)+'（夜間、壞天氣更大）</span>';}}
  return o;};})();
(function(){var b=modeBt;modeBt=function(){b();if(!VW.mode)return;if(UI.tool==='snk'){VW.mode.hidden=false;VW.mode.innerHTML='☢ 戰略核打擊：移動滑鼠檢視破壞範圍與預估傷亡，點選目標後還需要再次確認<button type="button" data-a="ordx">取消</button>';return;}
  if(UI.tool==='ord'&&UI.ord&&/^(sat|carpet|msl)$/.test(UI.ord.k)){VW.mode.hidden=false;VW.mode.innerHTML='「'+ORDN[UI.ord.k]+'」：'+({sat:'點選飽和打擊的目標',carpet:'點選轟炸瞄準點（虛線為危險區）',msl:'點選要打擊的目標'})[UI.ord.k]+'<button type="button" data-a="ordx">取消</button>';}};})();
(function(){var b=ACT.ordx;ACT.ordx=function(e){if(UI.tool==='snk'){UI.tool='sel';SNK.hv=null;modeBt();vDraw(false);return;}return b(e);};})();
/* 船上與船團 */
(function(){var b=btOrd;btOrd=function(){var us=UI.sel.map(uById).filter(Boolean),el=btEl('bord');if(el&&us.length&&us.every(function(u){return (u.cvy||u.st==='ship')&&!(typeof autoCvyOf==='function'&&autoCvyOf(u));})){var u=us[0];el.innerHTML='<div class="lw-note">'+(u.cvy?'運輸船團依航行計畫自動駛往灘頭外海、卸載後返航，不接受其他命令。':'部隊正在運輸船上，上岸後才能接受命令（已收到的命令會在上岸後執行）。')+'</div>';return;}b();};})();
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);if(!leaf)return o;var s=ST(u);
  if(isCV(u)){var A=G.units.filter(function(a){return a.baseU===u.id&&alive(a);}),n=sum(A,function(a){return a.veh;});o+='<span>艦載機</span><span>'+A.length+' 個中隊、約 '+fmt(n)+' 架／容量 '+fmt(cvCap(u))+' 架；飛行甲板'+(cvDeck(u)?'可用':'<b style="color:#b3261e">受損，無法起降</b>')+'</span>';}
  if(u.baseU){var c=uById(u.baseU);if(c)o+='<span>母艦</span><span>'+esc(uName(c))+'</span>';}
  var q=mslSpec(u);if(q)o+='<span>飛彈</span><span>'+q.nm+' '+mslLeft(u)+' 枚（射程 '+kmTxt(q.r)+'）</span>';
  if(u.cvy){var Q=u.cvy,ab=Q.pax.map(uById).filter(function(z){return z&&z.st==='ship';});o+='<span>船團</span><span>'+({wait:'等待天黑',go:'航向灘頭',unl:'卸載中',ret:'返航',hold:'在海上待命，等待登陸命令',sail:'航行中'})[Q.ph]+'；船上 '+ab.length+' 個單位、約 '+fmt(sum(ab,function(z){return z.men;}))+' 人'+(Q.drown?'；已有約 '+fmt(Q.drown)+' 人隨船落海':'')+'</span>';}
  if(u.st==='ship'){var C=uById(u.cvyId);o+='<span>位置</span><span>乘船中'+(C?'（'+esc(uName(C))+'）':'')+'</span>';}
  if(SD(u.side).nosur&&s.dom==='land')o+='<span>教條</span><span class="lw-note">不投降'+(u.banzai?'；已發動自殺式衝鋒':'')+'</span>';return o;};})();
/* 下令：區域外飛彈的發射數、飽和打擊的彈著時間 */
(function(){var b=issueSel;issueSel=function(k,x,y,extra){if(k==='msl'||k==='sat'){extra=Object.assign({},extra||{});if(k==='msl')extra.n=UI.ordOpt.msn||4;else extra.opt={prep:UI.ordOpt.sprep||15};}return b(k,x,y,extra);};})();
(function(){var b=CHG.oo;CHG.oo=function(t){var f=t.getAttribute('data-f');if(f==='msn'||f==='sprep'){UI.ordOpt[f]=+t.value;btOrd();vDraw(false);return;}b(t);};})();

/* ---------- 地圖預覽：地毯式轟炸危險區、飽和打擊範圍、飛彈射程 ---------- */
function v5Prev(c,hv){var k=UI.ord.k,us=UI.sel.map(uById).filter(function(u){return u&&alive(u);});
  if(k==='carpet'){var B=v5Leaves(us,function(l){var s=ST(l);return s.dom==='air'&&s.fl.indexOf('v')>=0;});if(!B.length)return;var ff={};
    B.forEach(function(l){var Bs=baseOf(l),a=Math.atan2(hv.wy-Bs[1],hv.wx-Bs[0]),g=cpGeom(l,l.veh),X=g.X,m=X.cep*1.4,fx=Math.cos(a),fy=Math.sin(a),pts=function(L2,W2,sh){var o=[];[[-1,-1],[1,-1],[1,1],[-1,1]].forEach(function(q){var s1=q[0]*L2/2+(sh||0),s2=q[1]*W2/2;o.push(w2s(hv.wx+fx*s1-fy*s2,hv.wy+fy*s1+fx*s2));});return o;};
      var P=pts(g.L,g.W),D=pts(g.L+m*2,g.W+m,-m*0.3);c.fillStyle='rgba(78,52,46,.22)';c.strokeStyle='rgba(78,52,46,.9)';c.lineWidth=1.5;c.beginPath();P.forEach(function(p,i){if(i)c.lineTo(p[0],p[1]);else c.moveTo(p[0],p[1]);});c.closePath();c.fill();c.stroke();
      c.strokeStyle='rgba(198,40,40,.9)';c.setLineDash([6,4]);c.beginPath();D.forEach(function(p,i){if(i)c.lineTo(p[0],p[1]);else c.moveTo(p[0],p[1]);});c.closePath();c.stroke();c.setLineDash([]);
      G.units.forEach(function(t){if(t.side!==l.side||!onMap(t)||ST(t).dom==='air'||!isLeaf(t))return;var dx=t.x-hv.wx,dy=t.y-hv.wy,a1=dx*fx+dy*fy,b1=Math.abs(-dx*fy+dy*fx);if(a1>-(g.L/2+m*1.3)&&a1<g.L/2+m*0.7&&b1<g.W/2+m/2)ff[t.id]=t;});});
    var FF=Object.keys(ff).map(function(id){return ff[id];});FF.forEach(function(t){var p=w2s(t.x,t.y);c.strokeStyle='#C62828';c.lineWidth=2.5;c.beginPath();c.arc(p[0],p[1],14,0,2*PI);c.stroke();});
    txtHalo(c,FF.length?'⚠ 危險區內有我軍 '+FF.length+' 個單位':'地毯式轟炸：'+B.length+' 個中隊',hv.sx+14,hv.sy-14,'bold 12px sans-serif',FF.length?'#B71C1C':'#4E342E');}
  if(k==='sat'){var Z=v5Leaves(us,function(l){return ST(l).fl.indexOf('z')>=0;}).length,R=Z&&us.every(isLeaf)?520:400;c.strokeStyle='rgba(216,67,21,.9)';c.fillStyle='rgba(216,67,21,.12)';c.lineWidth=2;c.beginPath();c.arc(hv.sx,hv.sy,Math.max(4,R/mpp()),0,2*PI);c.fill();c.stroke();
    v5Leaves(us,function(l){return indOf(l,ST(l))>0&&ST(l).dom!=='air';}).slice(0,40).forEach(function(l){var p=w2s(l.x,l.y),inR=dist(l.x,l.y,hv.wx,hv.wy)<=indOf(l,ST(l));c.strokeStyle=inR?'rgba(216,67,21,.55)':'rgba(120,120,120,.5)';c.setLineDash(inR?[]:[3,4]);c.lineWidth=1;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(hv.sx,hv.sy);c.stroke();});c.setLineDash([]);}
  if(k==='msl'){var L=v5Leaves(us,function(l){return mslLeft(l)>0;});L.slice(0,12).forEach(function(l){var q=mslSpec(l),p=w2s(l.x,l.y),R=q.r/mpp();if(R<4000){c.strokeStyle='rgba(40,53,147,.5)';c.setLineDash([3,6]);c.beginPath();c.arc(p[0],p[1],R,0,2*PI);c.stroke();c.setLineDash([]);}});
    var q0=L.length?mslSpec(L[0]):null,tg=q0?mslTarget(L[0].side,hv.wx,hv.wy,q0):null;if(tg){var pt=w2s(tg.x,tg.y);c.strokeStyle='#283593';c.lineWidth=2;c.beginPath();c.arc(pt[0],pt[1],11,0,2*PI);c.moveTo(pt[0]-16,pt[1]);c.lineTo(pt[0]+16,pt[1]);c.moveTo(pt[0],pt[1]-16);c.lineTo(pt[0],pt[1]+16);c.stroke();txtHalo(c,'鎖定目標',pt[0],pt[1]-20,'bold 11px sans-serif','#283593');}}}
(function(){var b=drawTool;drawTool=function(c){b(c);var hv=VW.hover;if(!hv||!G)return;c.save();if(UI.tool==='ord'&&UI.ord&&UI.sel.length&&/^(sat|carpet|msl)$/.test(UI.ord.k))v5Prev(c,hv);if(UI.tool==='snk')snkPrev(c,hv);c.restore();};})();

/* ---------- 地圖：飛行中的飛彈與核武載具、轟炸帶、飛彈落點、放射性落塵、核爆地區 ---------- */
(function(){var b=drawProj;drawProj=function(c){b(c);var me=mySide(),see=function(side,det){return UI.side<0||!G.set.fog||side===me||det;};c.save();
  (G.fo||[]).forEach(function(z){if(!see(z.side,1))return;var p=w2s(z.x,z.y),r=Math.max(3,z.r/mpp()),arr=G.t>=z.ta;c.fillStyle='rgba(130,119,23,'+(arr?(0.08+0.22*z.I).toFixed(3):'0.04')+')';c.strokeStyle='rgba(130,119,23,.7)';c.lineWidth=1;c.setLineDash(arr?[]:[4,4]);c.beginPath();c.arc(p[0],p[1],r,0,2*PI);c.fill();c.stroke();c.setLineDash([]);});
  var fz=(G.fo||[]).filter(function(z){return z.I>0.5;})[0];if(fz){var pz=w2s(fz.x,fz.y);txtHalo(c,'☢ 放射性落塵'+(G.t<fz.ta?'（約 '+durTxt(fz.ta-G.t)+' 後落下）':''),pz[0],pz[1]-fz.r/mpp()-8,'bold 11px sans-serif','#6D6A12');}
  (G.nukes||[]).forEach(function(n){if(!n.str)return;var p=w2s(n.x,n.y),age=G.t-n.t;c.strokeStyle='rgba(183,28,28,.55)';c.lineWidth=1.2;c.setLineDash([2,4]);[n.R[1],n.th].forEach(function(r){if(r){c.beginPath();c.arc(p[0],p[1],Math.max(3,r/mpp()),0,2*PI);c.stroke();}});c.setLineDash([]);if(age>1500)txtHalo(c,'☢ 爆心（'+yTxt(n.Y)+'）',p[0],p[1],'bold 11px sans-serif','#7F0000');});
  /* 地毯式轟炸：細虛線框出落彈帶，沿帶狀區域畫爆炸圖示（不填滿，以免蓋住地圖） */
  (G._cpv||[]).forEach(function(q){var age=G.t-q.t;if(age>2400||!see(q.side,1))return;var k=1-age/2400,fx=Math.cos(q.a),fy=Math.sin(q.a),P=[[-1,-1],[1,-1],[1,1],[-1,1]].map(function(s){return w2s(q.x+fx*s[0]*q.L/2-fy*s[1]*q.W/2,q.y+fy*s[0]*q.L/2+fx*s[1]*q.W/2);});c.strokeStyle='rgba(109,36,0,'+(0.6*k).toFixed(3)+')';c.lineWidth=1;c.setLineDash([3,4]);c.beginPath();P.forEach(function(p,i){if(i)c.lineTo(p[0],p[1]);else c.moveTo(p[0],p[1]);});c.closePath();c.stroke();c.setLineDash([]);
    var Lp=q.L/mpp(),n=clamp(Math.round(Lp/28),1,9);c.globalAlpha=k;for(var i=0;i<n;i++){var f=n===1?0:i/(n-1)-0.5,e=w2s(q.x+fx*f*q.L*0.85,q.y+fy*f*q.L*0.85);if(typeof boomPath==='function'){boomPath(c,e[0],e[1],7,7,i*0.9);c.fillStyle='#E64A19';c.fill();c.lineWidth=1;c.strokeStyle='#4E1A00';c.stroke();}}c.globalAlpha=1;});
  /* 區域外飛彈齊射：已飛過的航跡（淡）、空心菱形與導引虛線（經過航路點到目標） */
  (G.msl||[]).forEach(function(S){if(!see(S.side,S.det))return;var M=mslPos(S,mslRT()),p=w2s(M.x,M.y),q=w2s(S.x,S.y),col=sideCol(S.side),k=S.kind==='ballistic'?'bal':S.kind;
    c.strokeStyle=col;c.globalAlpha=0.3;c.lineWidth=1;c.beginPath();M.P.slice(0,M.j+1).forEach(function(w,i){var e=w2s(w[0],w[1]);if(i)c.lineTo(e[0],e[1]);else c.moveTo(e[0],e[1]);});c.lineTo(p[0],p[1]);c.stroke();c.globalAlpha=1;
    var prev=p;M.P.slice(M.j+1).forEach(function(w){var e=w2s(w[0],w[1]);mslGuide(c,prev,e,col,0.75);prev=e;});mslGlyph(c,p[0],p[1],col,k,S.n,M.ang);mslLabel(c,p,k,S.n,col,S.alt&&MSLALT[S.alt]?'・'+MSLALT[S.alt][0]:'');});
  /* 飛彈落點：爆炸圖示，十分鐘內淡出；全數被攔截時畫成灰色 */
  (G._mslv||[]).forEach(function(q){var age=G.t-q.t;if(age>600)return;var p=w2s(q.x,q.y),k=1-age/600;c.globalAlpha=k;if(typeof boomPath==='function'){boomPath(c,p[0],p[1],8+3*(1-k),8,0.2);c.fillStyle=q.s>=q.n?'#9E9E9E':'#FF7043';c.fill();c.lineWidth=1.2;c.strokeStyle=q.s>=q.n?'#424242':'#5D1A00';c.stroke();}c.globalAlpha=1;});
  (G.snq||[]).forEach(function(Q){if(!see(Q.side,Q.det))return;var t=w2s(Q.x,Q.y),col='#B71C1C';c.strokeStyle=col;c.lineWidth=1.5;c.beginPath();c.arc(t[0],t[1],9,0,2*PI);c.moveTo(t[0]-14,t[1]);c.lineTo(t[0]+14,t[1]);c.moveTo(t[0],t[1]-14);c.lineTo(t[0],t[1]+14);c.stroke();
    if(Q.ex!==undefined&&G.t>=Q.ta){var p=w2s(Q.px,Q.py);c.setLineDash([4,4]);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(t[0],t[1]);c.stroke();c.setLineDash([]);if(Q.del!=='cruise'){c.fillStyle=col;c.beginPath();c.arc(p[0],p[1],4,0,2*PI);c.fill();}}
    txtHalo(c,'☢ '+(Q.side===me||UI.side<0?SNKD[Q.del].n+' '+yTxt(Q.Y)+'，':'')+(Q.ex!==undefined&&G.t>=Q.ta?'飛行中':'約 '+durTxt(Math.max(0,Q.eta-G.t))+' 後抵達'),t[0],t[1]-18,'bold 11px sans-serif',col);});
  c.restore();};})();

/* ---------- 戰略核武：對話框、目標選取、確認 ---------- */
var SNK={side:0,del:'',Y:0,burst:'air',hv:null,est:null,ek:''};
(function(){var b=PAGES.battle;PAGES.battle=function(host){b(host);if(!G||!snkOn())return;var ph=host.querySelector('.lw-left .lw-ph');if(!ph)return;var bt=document.createElement('button');bt.type='button';bt.className='lw-btn sm';bt.setAttribute('data-a','snkdlg');bt.title='戰略核武（需在設定中啟用）';bt.textContent='☢ 戰略核武';ph.appendChild(bt);};})();
ACT.snkdlg=function(){if(!G.started||!snkOn())return;SNK.side=mySide()===null?SNK.side:mySide();snkDlg();};
function snkDlg(){var D=snkDel();if(!D.length){toast('這個年代還沒有戰略核武。');return;}if(D.indexOf(SNK.del)<0)SNK.del=D[0];var Ys=snkYields(SNK.del),Ymx=Math.max.apply(null,Ys);if(!(SNK.Y>0))SNK.Y=Ys[0];SNK.Y=clamp(SNK.Y,0.01,Ymx);var left=snkLeft(SNK.side);
  var o='<h3>☢ 戰略核打擊</h3><div class="lw-note">由你指定投放位置。戰略核武的當量是戰術核武的數十到數千倍：一枚數百千噸的彈頭可以讓一座城市在瞬間化為廢墟，倖存者面對燒傷、輻射病與沒有醫療的廢墟。使用核武會被列為戰爭罪行、重創國際聲望，對方若有核武也可能報復。</div>';
  if(UI.side<0)o+='<div class="lw-row">'+SIDES().map(function(s){return '<label><input type="radio" name="snks" data-c="snk" data-f="side" value="'+s+'"'+(SNK.side===s?' checked':'')+'>'+esc(G.sides[s].name)+'（剩 '+snkLeft(s)+' 枚）</label>';}).join('')+'</div>';
  o+='<div class="lw-opt"><span>剩餘彈頭</span><span><b>'+left+'</b> 枚</span><span>投射方式</span><select data-c="snk" data-f="del">'+D.map(function(k){return '<option value="'+k+'"'+(SNK.del===k?' selected':'')+'>'+SNKD[k].n+'</option>';}).join('')+'</select>'+
    '<span>當量</span><span><input type="number" min="0.01" max="'+Ymx+'" step="any" value="'+SNK.Y+'" data-c="snk" data-f="Y" style="width:84px"> 千噸 <select data-c="snk" data-f="Y"><option value="">此年代的彈頭…</option>'+Ys.map(function(v){return '<option value="'+v+'">'+yTxt(v)+'</option>';}).join('')+'</select><br><span class="lw-note">可自行輸入，上限 '+yTxt(Ymx)+'（此年代此載具的最大彈頭）</span></span><span>爆炸方式</span><select data-c="snk" data-f="burst"><option value="air"'+(SNK.burst==='air'?' selected':'')+'>空中爆炸</option><option value="surface"'+(SNK.burst==='surface'?' selected':'')+'>地面爆炸</option></select></div>';
  var Z=snkZones(SNK.Y,SNK.burst);o+='<div class="lw-note">'+({bomber:'轟炸機由本方後方邊緣進入，飛越戰區時可能被戰鬥機與高射砲擊落；沒有被擊落才會投彈。',icbm:'洲際彈道飛彈約 25～35 分鐘後落地；發射會被對方的預警系統偵測到，反彈道飛彈幾乎無法攔截。',slbm:'潛射彈道飛彈約 10～16 分鐘後落地，預警時間更短。',cruise:'核巡弋飛彈低空飛行、速度較慢，可能被防空飛彈與戰鬥機攔截。'})[SNK.del]+
    '<br>'+(SNK.burst==='air'?'空中爆炸：爆風與熱輻射範圍最大，局部放射性落塵很少。':'地面爆炸：爆風範圍較小，但會造成彈坑與大量放射性落塵，沿風向污染數十公里。')+
    '<br>重度破壞（5 psi）半徑 '+kmTxt(Z.r5)+'、輕度破壞（1 psi）半徑 '+kmTxt(Z.r1)+'、三度灼傷半徑 '+kmTxt(Z.th)+'。</div>';
  o+='<div class="lw-row"><button type="button" class="lw-btn pri" data-a="snkpick"'+(left>0?'':' disabled')+'>在地圖上選擇目標</button><button type="button" class="lw-btn" data-a="x">取消</button></div>';if(UI.snkd&&UI.snkd.isConnected)try{UI.snkd.remove();}catch(e){}UI.snkd=dlg(o);}
CHG.snk=function(t){var f=t.getAttribute('data-f');SNK[f]=f==='Y'||f==='side'?+t.value:t.value;snkDlg();};
ACT.snkpick=function(){UI.snkd&&UI.snkd.remove();UI.ord=null;UI.tool='snk';SNK.ek='';modeBt();};
function snkEstAt(x,y){var key=Math.round(x/200)+'|'+Math.round(y/200)+'|'+SNK.Y+'|'+SNK.burst;if(SNK.ek!==key){SNK.ek=key;SNK.est=snkEst(x,y,SNK.Y,SNK.burst,SNK.side);}return SNK.est;}
function snkPrev(c,hv){var Z=snkZones(SNK.Y,SNK.burst),m=mpp(),R=[[Z.r1,'rgba(255,235,59,.95)','1 psi'],[Z.th,'rgba(255,111,0,.95)','三度灼傷'],[Z.r2,'rgba(255,152,0,.95)','2 psi'],[Z.r5,'rgba(229,57,53,.95)','5 psi'],[Z.r12,'rgba(127,0,0,.95)','12 psi'],[Z.fb,'rgba(255,255,255,.95)','火球']];
  R.forEach(function(q,i){var r=Math.max(2,q[0]/m);c.strokeStyle=q[1];c.lineWidth=i===1?1.5:2;c.setLineDash(i===1?[6,4]:[]);c.beginPath();c.arc(hv.sx,hv.sy,r,0,2*PI);c.stroke();if(r>26&&i!==5)txtHalo(c,q[2]+' '+kmTxt(q[0]),hv.sx,hv.sy-r-6,'10.5px sans-serif','#4a2b00');});c.setLineDash([]);
  var e=snkEstAt(hv.wx,hv.wy),ln=['預估立即死亡：平民約 '+fmt(e.ck)+' 人','受傷：平民約 '+fmt(e.cw)+' 人','軍人傷亡：'+G.sides[SNK.side].name+' 約 '+fmt(e.mk[SNK.side])+'、'+G.sides[1-SNK.side].name+' 約 '+fmt(e.mk[1-SNK.side])];if(e.own)ln.push('⚠ 我軍 '+e.own+' 個單位在 2 psi 範圍內');if(SNK.burst==='surface')ln.push('另有放射性落塵沿風向擴散');
  c.font='12px sans-serif';var w=Math.max.apply(null,ln.map(function(t){return c.measureText(t).width;}))+16,x0=Math.min(VW.cw-w-6,hv.sx+18),y0=Math.min(VW.ch-ln.length*17-12,hv.sy+18);c.fillStyle='rgba(30,10,10,.82)';c.fillRect(x0,y0,w,ln.length*17+10);ln.forEach(function(t,i){c.fillStyle=/⚠/.test(t)?'#FFAB91':'#fff';c.fillText(t,x0+8,y0+18+i*17);});}
(function(){var b=btClick;btClick=function(x,y,sx,sy,e){if(UI.tool==='snk'){snkConfirm(x,y);return;}return b(x,y,sx,sy,e);};})();
function snkConfirm(x,y){var e=snkEst(x,y,SNK.Y,SNK.burst,SNK.side),Z=e.Z;SNK.tx=x;SNK.ty=y;var o='<h3>確認戰略核打擊</h3><div class="lw-kv"><span>目標</span><span>'+esc(placeTxt(x,y))+'</span><span>武器</span><span>'+SNKD[SNK.del].n+'，'+yTxt(SNK.Y)+'，'+(SNK.burst==='surface'?'地面爆炸':'空中爆炸')+'</span>'+
  '<span>破壞範圍</span><span>重度破壞半徑 '+kmTxt(Z.r5)+'、三度灼傷半徑 '+kmTxt(Z.th)+'、輕度破壞半徑 '+kmTxt(Z.r1)+'</span><span>平民</span><span><b>預估立即死亡約 '+fmt(e.ck)+' 人、受傷約 '+fmt(e.cw)+' 人</b>'+(SNK.burst==='surface'?'；落塵還會在數日至數週內造成更多死亡':'')+'</span><span>軍人</span><span>'+G.sides[SNK.side].name+' 約 '+fmt(e.mk[SNK.side])+' 人、'+G.sides[1-SNK.side].name+' 約 '+fmt(e.mk[1-SNK.side])+' 人</span></div>'+
  (e.own?'<div class="lw-note" style="color:#b3261e">⚠ 我軍有 '+e.own+' 個單位位於 2 psi 範圍內，將與敵軍一同承受爆風、熱輻射與輻射。</div>':'')+'<div class="lw-note">這個決定無法撤回。核爆會被記錄為戰爭罪行，並寫入戰後總結。</div><div class="lw-row"><button type="button" class="lw-btn dng" data-a="snkgo">確認發射</button><button type="button" class="lw-btn" data-a="snkback">重新選擇</button><button type="button" class="lw-btn" data-a="x">放棄</button></div>';
  UI.snkd&&UI.snkd.remove();UI.snkd=dlg(o);}
ACT.snkback=function(){UI.snkd&&UI.snkd.remove();UI.tool='snk';modeBt();};
ACT.snkgo=function(){UI.snkd&&UI.snkd.remove();var e=snkEst(SNK.tx,SNK.ty,SNK.Y,SNK.burst,SNK.side),Q=snkLaunch(SNK.side,SNK.del,SNK.Y,SNK.burst,SNK.tx,SNK.ty);UI.tool='sel';modeBt();
  if(!Q){toast('無法發射（沒有剩餘彈頭或此年代不可用）。');return;}decLog(SNK.side,'最高統帥','下令以'+SNKD[SNK.del].n+'對'+placeTxt(SNK.tx,SNK.ty)+'實施'+yTxt(SNK.Y)+'戰略核打擊（預估平民立即死亡約 '+fmt(e.ck)+' 人）');toast('已下令戰略核打擊，預計 '+durTxt(Q.eta-G.t)+' 後抵達。',5000);vDraw(false);btLeft(true);};

/* ---------- 增援：運輸船 ---------- */
function rfShipHtml(A,cc){return '<div class="lw-row"><label>船型 <select data-c="'+cc+'" data-f="ship">'+SHIPT.map(function(q){return '<option value="'+q[0]+'"'+((A.ship||'')===q[0]?' selected':'')+'>'+q[1]+'</option>';}).join('')+'</select></label><label><input type="checkbox" data-c="'+cc+'" data-f="night"'+(A.night?' checked':'')+'>趁夜駛入（等到天黑）</label></div>';}

/* ---------- 戰報：核武、飛彈、轟炸與船團 ---------- */
function v5Any(){return (G.snS||[]).length||(G.nukes||[]).length||G.stats.some(function(s){return s.msl||s.carpet;})||G.units.some(function(u){return u.cvy&&u.cvy.drown>0;});}
function v5RepHtml(){var n=function(v){return fmt(Math.round(v||0));},o='',S=G.snS||[];
  o+='<h4 style="margin:6px 0 4px;font-size:13px">核爆（'+((G.nukes||[]).length)+' 次）</h4>';if(!(G.nukes||[]).length)o+='<div class="lw-note">沒有使用核武。</div>';
  else o+='<table class="lw-tbl lw-tblc"><tr><th>時間</th><th>使用方</th><th>地點</th><th class="n">當量</th><th>方式</th><th class="n">平民死亡</th><th class="n">平民受傷</th><th class="n">落塵後續死亡（估）</th><th class="n">軍人傷亡</th></tr>'+(G.nukes||[]).map(function(N){var r=S.filter(function(q){return q.t===N.t&&q.x===N.x&&q.y===N.y;})[0];return '<tr><td>'+tTxt(N.t).slice(-11)+'</td><td><span style="color:'+G.sides[N.side].color+'">'+esc(G.sides[N.side].name)+'</span></td><td>'+esc(placeTxt(N.x,N.y))+'</td><td class="n">'+yTxt(N.Y)+'</td><td>'+(r?(SNKD[r.del]?SNKD[r.del].n:'戰略')+'・'+(r.burst==='surface'?'地面':'空中'):'戰術')+'</td><td class="n">'+(r?n(r.ck):'—')+'</td><td class="n">'+(r?n(r.cw):'—')+'</td><td class="n">'+(r?n(r.fo):'—')+'</td><td class="n">'+(r?n(r.mk[0]+r.mk[1]):'—')+'</td></tr>';}).join('')+'</table>';
  o+='<h4 style="margin:12px 0 4px;font-size:13px">飛彈、轟炸與船團</h4><div class="lw-kv">'+SIDES().map(function(s){var X=G.stats[s],dr=sum(G.units.filter(function(u){return u.side===s&&u.cvy;}),function(u){return u.cvy.drown||0;});return '<span style="color:'+G.sides[s].color+'">'+esc(G.sides[s].name)+'</span><span>發射飛彈 '+n(X.msl)+' 枚、地毯式轟炸 '+n(X.carpet)+' 次（約 '+n(X.bombT)+' 公噸）、戰略核彈 '+n(X.snuke)+' 枚、自殺式衝鋒 '+n(X.banzai)+' 次；運輸船沉沒落海約 '+n(dr)+' 人</span>';}).join('')+'</div>';
  if(G.civ){var bc=G.civ.byC||{};o+='<div class="lw-note" style="margin-top:6px">平民死因中：核武 '+n(bc.snuke+(bc.nuke||0))+'、地毯式轟炸 '+n(bc.carpet)+'、飛彈 '+n(bc.msl)+(bc.suicide?'、在軍方宣傳與脅迫下集體自殺 '+n(bc.suicide):'')+'。'+(G.civ.foD?'放射性落塵預估還會造成約 '+n(G.civ.foD)+' 名平民在戰後數日至數週內死亡，長期的癌症與畸形無法在此估計。':'')+'</div>';}return o;}
(function(){var b=warSummaryText;warSummaryText=function(){var t=b();if(!G||!v5Any())return t;var n=function(v){return fmt(Math.round(v||0));},L=['','十、核武、飛彈與重型轟炸'];
  (G.nukes||[]).forEach(function(N){var r=(G.snS||[]).filter(function(q){return q.t===N.t&&q.x===N.x&&q.y===N.y;})[0];L.push('　'+tTxt(N.t).slice(-11)+'　'+G.sides[N.side].name+'在'+placeTxt(N.x,N.y)+'引爆 '+yTxt(N.Y)+(r?'（'+(SNKD[r.del]?SNKD[r.del].n:'戰略')+'，'+(r.burst==='surface'?'地面爆炸':'空中爆炸')+'）：平民立即死亡約 '+n(r.ck)+' 人、受傷約 '+n(r.cw)+' 人，軍人傷亡約 '+n(r.mk[0]+r.mk[1])+' 人'+(r.fo?'；落塵預估另造成約 '+n(r.fo)+' 人死亡':''):'（戰術核武）'));});
  SIDES().forEach(function(s){var X=G.stats[s];if(X.msl||X.carpet||X.banzai)L.push('　'+G.sides[s].name+'：發射飛彈 '+n(X.msl)+' 枚、地毯式轟炸 '+n(X.carpet)+' 次（約 '+n(X.bombT)+' 公噸炸彈）'+(X.banzai?'、自殺式衝鋒 '+n(X.banzai)+' 次':''));});
  var dr=sum(G.units.filter(function(u){return u.cvy;}),function(u){return u.cvy.drown||0;});if(dr>0.5)L.push('　運輸船被擊沉，約 '+n(dr)+' 名官兵隨船落海。');if(G.civ&&G.civ.foD)L.push('　放射性落塵預估還會造成約 '+n(G.civ.foD)+' 名平民在戰後數日至數週內死亡；長期的癌症、畸形與土地污染無法在此估計。');return t+'\n'+L.join('\n');};})();
CHG.snos=function(t){SD(OB.side).nosur=t.checked;OB.v4open=1;};
/* ---------- 設定：戰略核武 ---------- */
function snkSetHtml(){var S=G.set,N=S.snuke||(S.snuke={on:false,n:2,ai:0}),y=S.y||0;if(y<1945)return '<span>戰略核武</span><span class="lw-note">'+y+' 年還沒有核武（1945 年起）</span>';
  return '<span>戰略核武</span><label><input type="checkbox" data-c="setsnk" data-f="on"'+(N.on?' checked':'')+'>允許使用（由你指定投放位置；'+snkDel().map(function(k){return SNKD[k].n;}).join('、')+'）</label>'+(N.on?'<span>每方彈頭</span><span><input type="number" min="0" max="20" value="'+N.n+'" data-c="setsnk" data-f="n" style="width:60px"> 枚'+(G.started?'（剩餘：'+G.sides.map(function(Sd,i){return esc(Sd.name)+' '+snkLeft(i);}).join('、')+'）':'')+'</span><span>電腦使用</span><select data-c="setsnk" data-f="ai">'+[[0,'不使用'],[1,'只在遭到核攻擊後報復'],[2,'戰況危急時可能率先使用']].map(function(q){return '<option value="'+q[0]+'"'+((N.ai||0)===q[0]?' selected':'')+'>'+q[1]+'</option>';}).join('')+'</select>':'');}
CHG.setsnk=function(t){var f=t.getAttribute('data-f'),N=G.set.snuke||(G.set.snuke={on:false,n:2,ai:0});if(f==='on')N.on=t.checked;else N[f]=Math.max(0,+t.value||0);if(f==='n'&&G.started)G.sides.forEach(function(S){S.snk=N.n;});if(f==='on')show('set');};
/* ---------- 說明 ---------- */
var V5HELP='<h4>v5：轟炸機、航艦與運輸船</h4><ul><li>新單位：重轟炸機、超重型轟炸機、俯衝轟炸機、魚雷轟炸機、艦載戰鬥機、重巡洋艦、運輸艦、高速運輸驅逐艦，冷戰與現代的戰略轟炸機、超級航艦、艦載機、戰車登陸艦、船塢登陸艦、陸基巡弋飛彈與短程彈道飛彈部隊。新編制：重型、中型、俯衝轟炸機聯隊，艦載機聯隊，航艦戰鬥群（打擊群），艦砲射擊群，運輸船團，高速運輸隊，飛彈旅。</li>'+
 '<li>航空母艦：艦載機以母艦為基地並跟著母艦移動；母艦沉沒時甲板與機庫裡的飛機一併損失，空中的飛機改降他艦或陸上機場；飛行甲板受損一半以上就無法起降。</li><li>對艦攻擊：魚雷轟炸與俯衝轟炸命中率高，高空水平轟炸幾乎打不中移動中的艦艇。機場遭砲擊或轟炸時，停在地面的飛機受損、跑道彈坑延誤出擊。</li>'+
 '<li>運輸船增援：增援的進場方式選「運輸船」並指定灘頭；部隊搭船由地圖邊緣的海面駛來，在外海以小艇或登陸艇分批卸載，卸完後船團返航，附載的補給卸到灘頭補給站。船被擊沉時船上官兵隨船落海。可選船型與「趁夜駛入」。</li></ul>'+
 '<h4>v5：飽和打擊、地毯式轟炸與飛彈精確打擊</h4><ul><li>飽和打擊：火箭砲一次齊射全部彈藥；師、旅等編制讓轄下射程內所有火砲在同一時刻彈著（TOT）。第一輪殺傷最大，打完要長時間補充彈藥。</li>'+
 '<li>地毯式轟炸：重型與中型轟炸機在帶狀區域密集投彈。二戰時期落彈誤差可達一公里，而且常落在瞄準點之前；預覽會畫出危險區並標出區內的我軍。區內城鎮被夷平、道路滿布彈坑、平民大量死傷。</li>'+
 '<li>區域外飛彈精確打擊：神盾艦、攻擊潛艦、戰略轟炸機、艦載機、陸基巡弋飛彈與彈道飛彈部隊可在射程外發射。防空與反飛彈系統可以攔截，同時來襲越多越容易突破，電子戰會干擾導引。適合打擊司令部、砲兵、防空、橋梁與機場。</li></ul>'+
 '<h4>v5：戰略核武</h4><ul><li>在「設定」啟用後，作戰頁出現「☢ 戰略核武」。依年代可用轟炸機（1945 年起）、洲際彈道飛彈（1959）、潛射彈道飛彈（1960）與核巡弋飛彈（1982），可選當量也依年代而定。</li>'+
 '<li>由你在地圖上指定投放位置：選取時即時顯示火球、12／5／2／1 psi 與三度灼傷的範圍，以及預估的平民與軍人傷亡，再次確認後才發射。對方的預警系統會偵測到彈道飛彈發射；轟炸機與巡弋飛彈可能在途中被擊落。</li>'+
 '<li>破壞範圍依美國國會技術評估局《核戰爭的影響》（1979）換算。地面爆炸會沿風向產生放射性落塵，並估計戰後數日至數週內的死亡。核爆會被記錄為戰爭罪行並寫入戰後總結；電腦可設定為不使用、只在遭到核攻擊後報復，或戰況危急時率先使用。</li></ul>'+
 '<h4>v5：太平洋戰爭與其他</h4><ul><li>新劇本「瓜達康納爾島（機場爭奪）」與「塞班島（島嶼登陸與平民）」，以及「島嶼」地形。</li><li>不投降教條（陣營政策）：部隊極少投降，絕境時發動自殺式衝鋒，並以宣傳與脅迫使平民寧死不降；這些平民的死亡會列入戰後總結。</li>'+
 '<li>越古老的軍隊越沒有國際法與人道的概念：時代下限限制可選的政策、軍紀更難維持，1850 年以前沒有戰地記者。</li><li>所有自動暫停條件整合在「設定」與工具列的「⏸ 自動暫停」。大型聯合作戰的尋路改為共用路線並分段計算，減少卡頓。</li></ul>';
(function(){var b=tipAt;tipAt=function(sx,sy,w){if(UI.tool==='snk')return '';return b(sx,sy,w);};})();
