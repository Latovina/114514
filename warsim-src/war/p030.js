/* ===================== 砲兵介面：煙幕命令（點或拖曳成煙幕牆）、支援方式（直接／全般）、地圖上的煙幕、AI 進攻程序設定、說明 ===================== */
ordReg('smoke','煙幕','fire',{g:'☁',col:'#78909C'});

DCN.smoke='煙幕：點選地點，或按住拖曳畫出一道煙幕牆。砲兵與迫擊砲發射煙幕彈，煙霧遮斷雙方視線、讓穿過煙幕的直射火力約剩三分之一，用來掩護突擊越過開闊地、撤退或渡河。風大、下雨時散得快；1915 年以前沒有煙幕砲彈。';
LINEORD.smoke=1;
(function(){var b=canOrd;canOrd=function(u,k){if(k==='smoke'){var L=isLeaf(u)?[u]:leavesOf(u).filter(alive);return !!G.started&&L.some(function(l){return alive(l)&&canSmoke(l);});}return b(u,k);};})();
(function(){var b=v4Opts;v4Opts=function(k,O,us){var o=b(k,O,us);if(k==='smoke')o+='<span>時間</span><select data-c="oo" data-f="smd">'+[5,10,20,30].map(function(v){return '<option value="'+v+'"'+((+O.smd||10)===v?' selected':'')+'>'+v+' 分鐘</option>';}).join('')+'</select><span>煙幕</span><span class="lw-note">目前天候下每次約可維持 '+durTxt(smokeDur())+'，射擊期間持續補充</span>';return o;};})();
(function(){var b=CHG.oo;CHG.oo=function(t){var f=t.getAttribute('data-f');if(f==='smd'){UI.ordOpt.smd=+t.value;btOrd();return;}b(t);};})();
(function(){var b=issueSel;issueSel=function(k,x,y,extra){if(k==='smoke')extra=Object.assign({},extra||{},{dur:+UI.ordOpt.smd||10});return b(k,x,y,extra);};})();
(function(){var b=btLine;btLine=function(x0,y0,x1,y1){if(UI.tool==='ord'&&UI.ord&&UI.ord.k==='smoke'){if(dist(x0,y0,x1,y1)<150)issueSel('smoke',x1,y1);else issueSel('smoke',x0,y0,{x1:x1,y1:y1});return;}return b(x0,y0,x1,y1);};})();
(function(){var b=modeBt;modeBt=function(){b();if(VW.mode&&UI.tool==='ord'&&UI.ord&&UI.ord.k==='smoke'){VW.mode.hidden=false;VW.mode.innerHTML='「煙幕」：點選施放地點，或按住拖曳畫出煙幕牆<button type="button" data-a="ordx">取消</button>';}};})();
/* ---------- 地圖：煙幕（雙方都看得到） ---------- */
function drawSmoke(c){var L=G.smk;if(!L||!L.length)return;var m=mpp(),now=G.t;c.save();L.forEach(function(q){if(q.t1<=now)return;var p=w2s(q.x,q.y),r=Math.max(6,q.r/m);if(p[0]<-r||p[1]<-r||p[0]>VW.cw+r||p[1]>VW.ch+r)return;var f=clamp((q.t1-now)/180,0.25,1),gr=c.createRadialGradient(p[0],p[1],r*0.2,p[0],p[1],r);
  gr.addColorStop(0,'rgba(236,239,241,'+(0.62*f).toFixed(3)+')');gr.addColorStop(0.7,'rgba(207,216,220,'+(0.45*f).toFixed(3)+')');gr.addColorStop(1,'rgba(207,216,220,0)');c.fillStyle=gr;c.beginPath();c.arc(p[0],p[1],r,0,2*PI);c.fill();});c.restore();}
(function(){var b=drawProj;drawProj=function(c){b(c);try{drawSmoke(c);}catch(e){if(window.console)console.warn('smoke',e);}};})();
if(typeof FXS==='object')FXS.smoke=function(e){var T=FX.clk;for(var j=0;j<fxLv(3,6);j++)fxP({k:'sm',x:e.x1+(Math.random()-0.5)*e.r,y:e.y1+(Math.random()-0.5)*e.r,t0:T+j*0.15,d:9,r0:20,r1:Math.max(60,e.r*0.8),a:0.45,c:'236,239,241'});};
/* ---------- 單位面板：支援方式 ---------- */
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);if(!leaf||!isArty(u))return o;var me=mySide(),mine=me===null||u.side===me,q=u.ord,md=artMode(u,q&&q.k==='support'?q:null),sup=q&&q.sup?uById(q.sup):u.p>=0?uById(u.p):null;
  o+='<span>支援方式</span><span>'+(mine?'<select data-c="artrole" data-v="'+u.id+'"><option value=""'+(!u.artRole?' selected':'')+'>自動（目前：'+ARTN[md]+'）</option><option value="DS"'+(u.artRole==='DS'?' selected':'')+'>直接支援：只打支援對象附近的敵軍</option><option value="GS"'+(u.artRole==='GS'?' selected':'')+'>全般支援：射程內最有價值的目標（敵砲兵、司令部、行軍部隊）</option></select>':ARTN[md])+(sup?'<br><span class="lw-note">支援對象：'+esc(uName(sup))+'</span>':'')+'</span>';
  if(q&&q.k==='bombard'&&q.smoke)o+='<span>任務</span><span>施放煙幕（'+placeTxt(q.x,q.y)+'）</span>';return o;};})();
CHG.artrole=function(t){var u=uById(+t.getAttribute('data-v'));if(!u)return;u.artRole=t.value||null;toast(uName(u)+'：'+(u.artRole?ARTN[u.artRole]:'依編制自動決定支援方式'));btStatus();};
/* ---------- 設定 ---------- */
setSec('cmd','probe',{t:'AI 的進攻程序與砲兵',o:30,note:'AI 的砲兵不擔任第一線防務：給砲兵的防禦、攻擊等第一線命令會改為在後方陣地支援。師以上直屬的砲兵預設全般支援，團、旅、營的砲兵預設直接支援所屬部隊；可在單位面板個別改。',
  h:function(){return setOpt(setRow('先偵察再火力',setChk('setb','probe',G.set.probe!==false,'AI 進攻時，目標一帶沒有發現敵軍就先派偵察、主力集結待命；發現敵軍後依敵情決定是否火力準備，砲火打已知的敵軍陣地，突擊時刻以煙幕掩護')));}});
HELP14.push('<h4>砲兵：支援方式、煙幕與進攻程序</h4><ul>'+
  '<li><b>直接支援（DS）</b>：只打支援對象（所屬團、旅、營或指定部隊）附近的敵軍，優先打壓迫友軍的敵人。<b>全般支援（GS）</b>：在射程內選最有價值的目標──敵砲兵（反砲兵）、司令部、行軍或集結中的部隊，也會遮斷正在接近的敵軍。師以上直屬的砲兵預設全般支援，其餘預設直接支援，可在單位面板個別改。距離友軍太近（約 400 公尺內，精準彈藥約 150 公尺）的目標不打。</li>'+
  '<li><b>不當填線部隊</b>：AI 給砲兵的防禦、攻擊、固守等第一線命令一律改為在後方陣地支援，紀錄會說明。</li>'+
  '<li><b>煙幕</b>：命令列「☁ 煙幕」，點一下施放一團煙幕，按住拖曳畫出煙幕牆；可選 5～30 分鐘。煙幕遮斷雙方視線（近距離仍看得到），穿過煙幕的直射火力約剩三分之一；風大、下雨時散得快。1915 年以前沒有煙幕砲彈。</li>'+
  '<li><b>進攻程序</b>（AI，設定可關閉）：目標一帶沒有發現敵軍時，偵察部隊（沒有就派最小的步兵單位當前衛）先前出，主力在約 2.5 公里外集結，砲兵就位但不對空地盲目砲擊；發現敵軍後才下達突擊：小股、沒有工事的敵人直接突擊，有工事或兵力較多時先以砲火覆蓋已知陣地 15～30 分鐘，突擊時刻另以煙幕掩護；偵察三小時仍無接觸就直接前進佔領。航空部隊在目標上空巡邏，也可另下空中打擊或轟炸區。</li></ul>');
