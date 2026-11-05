/* ===================== v10 介面：陣型、姿態與面向的即時切換；地圖上的面向、射界與交火對峙；殺傷效率與戰鬥規則設定；AI 戰略的顯示 ===================== */
var DIR8=['東','東南','南','西南','西','西北','北','東北'];
function dirName(h){var a=((h||0)%(2*PI)+2*PI)%(2*PI);return DIR8[Math.round(a/(PI/4))%8];}
/* 可由玩家即時切換的單位：自己指揮、在地圖上的地面部隊 */
function v10Mine(u){return u&&alive(u)&&onMap(u)&&!u.irr&&(mySide()===null||u.side===mySide())&&cmPlMay(u);}
function v10Sel(){var L=[];UI.sel.map(uById).forEach(function(u){if(!v10Mine(u))return;(isLeaf(u)?[u]:leavesOf(u).filter(onMap)).forEach(function(l){if(ST(l).dom==='land'&&L.indexOf(l)<0)L.push(l);});});return L;}
/* 四周已知敵軍分在正面、側面、背面 */
function arcCount(u){var n=[0,0,0],C=G.ct[u.side]||{};for(var id in C){var c=C[id];if(c.dead||c.dom==='air'||G.t-c.t>900)continue;if(dist(c.x,c.y,u.x,u.y)>Math.max(2500,rangeOf(ST(u))*1.5))continue;n[arcOf(u,c.x,c.y)]++;}return n;}
function v10Block(){if(!G||!G.started||G.replay)return '';var L=v10Sel();if(!L.length)return '';var u=L[0],all=L.length>1,fmU=u.fmU&&u.fmU!=='auto'?u.fmU:'auto',cur=fmOf(u),av={};L.forEach(function(l){fmAvail(l).forEach(function(f){av[f]=1;});});
  var o='<h4 style="margin:10px 0 4px;font-size:13px">陣型、姿態與面向'+(all?'<small style="font-weight:400;color:#777">（'+L.length+' 個單位）</small>':'')+'</h4>';
  if(!all){var ac=arcCount(u),en=engNow(u)?uById(u.engW):null;o+='<div class="lw-kv">'+kv('陣型',(fmU==='auto'?'自動（目前：'+fmName(cur)+'）':fmName(cur))+(u.fmTo?'，<b>變換為'+fmName(u.fmTo)+'中</b>（約 '+durTxt(Math.max(0,u.fmTT-G.t))+'）':''))+
    kv('面向','朝'+dirName(u.hd)+(u.noTurn||G.set.autoTurn===false?'（固定）':'（自動轉向）')+(G.t-(u.turnT||-1e9)<DT*1.5?'，<b>轉向中</b>':''))+kv('四周敵軍','正面 '+ac[0]+'、側面 '+ac[1]+'、背面 '+ac[2]+(ac[1]+ac[2]>0?' <b style="color:#b3261e">側背受威脅</b>':''))+
    (en?kv('交火','<b style="color:#b3261e">與'+esc(uName(en))+'對峙中</b>：'+(u.ord&&/attack|storm|breakthrough|pursue/.test(u.ord.k)?'只能向對方推進突擊，或撤退':'只能撤退')):'')+'</div>';}
  o+='<div class="lw-ob">'+[['auto','自動','依任務、側翼與敵情自動選擇']].concat(FMV).map(function(q){var on=q[0]==='auto'?fmU==='auto':fmU===q[0],dis=q[0]!=='auto'&&!av[q[0]];return '<button type="button" data-a="v10fm" data-v="'+q[0]+'" class="'+(on?'on':'')+'"'+(dis?' disabled':'')+' title="'+esc(q[2])+'">'+q[1]+'</button>';}).join('')+'</div>';
  var k=u.ord?u.ord.k:'',atk=/attack/.test(k);if(atk){var tc=(u.ord.opt||{}).tac||'frontal';o+='<div class="lw-opt"><span>戰術</span><select data-c="v10tac">'+TAC.map(function(q){return '<option value="'+q[0]+'"'+(tc===q[0]?' selected':'')+' title="'+esc(q[2])+'">'+q[1]+'</option>';}).join('')+'</select></div>';}
  else{var ps=/defend|screen/.test(k)?(u.ord.opt||{}).post||'hasty':'';o+='<div class="lw-opt"><span>姿態</span><select data-c="v10post"><option value=""'+(ps?'':' selected')+'>'+(ps?'':'（目前沒有防禦姿態）')+'</option>'+POST.map(function(q){return '<option value="'+q[0]+'"'+(ps===q[0]?' selected':'')+' title="'+esc(q[2])+'">'+q[1]+'</option>';}).join('')+'</select></div>'+(ps?'':'<div class="lw-note">選擇姿態會讓部隊就地以該姿態防禦。</div>');}
  var fixed=L.every(function(l){return l.noTurn;});o+='<div class="lw-row"><button type="button" class="lw-btn sm" data-a="v10turn">'+(fixed?'↻ 恢復自動轉向':'⊘ 固定目前面向')+'</button><button type="button" class="lw-btn sm" data-a="v10face">➶ 指定面向…</button></div>';
  return o+'<div class="lw-note">側面受攻擊約 1.5 倍、背面約 2 倍的殺傷，塹壕只保護正面；部隊會自動轉向射擊自己的敵人，轉向中火力較弱。</div>';}
(function(){var b=btStatus;btStatus=function(){var el0=btEl('bst'),a=document.activeElement;/* 正在操作陣型、姿態的下拉選單時不要重畫面板 */if(el0&&a&&el0.contains(a)&&a.tagName==='SELECT'&&/^v10/.test(a.getAttribute('data-c')||''))return;b();if(UI.selX||UI.selC||UI.selB)return;var el=btEl('bst');if(!el)return;var h=v10Block();if(!h)return;var d=document.createElement('div');d.className='lw-v10';d.innerHTML=h;var kvEl=el.querySelector(':scope>.lw-kv');if(kvEl&&kvEl.nextSibling)el.insertBefore(d,kvEl.nextSibling);else el.appendChild(d);};})();
ACT.v10fm=function(b){var v=b.getAttribute('data-v'),L=v10Sel(),n=0;L.forEach(function(u){if(v==='auto'){u.fmU='auto';n++;return;}if(fmAvail(u).indexOf(v)<0)return;u.fmU=v;fmSet(u,v);n++;});if(!n){toast('選取的部隊不能使用這個陣型。');return;}
  var u=L[0];toast(v==='auto'?'陣型交給部隊依情況自動選擇。':'陣型改為'+fmName(v)+(u.fmTo?'（約 '+durTxt(Math.max(0,u.fmTT-G.t))+'完成變換）':''));btStatus();vDraw(false);};
CHG.v10post=function(t){if(!t.value)return;var L=v10Sel();L.forEach(function(u){postSwitch(u,t.value);});toast('姿態改為'+POST.filter(function(q){return q[0]===t.value;})[0][1]+'（'+L.length+' 個單位）');t.blur();btStatus();btLeft(true);vDraw(false);};
CHG.v10tac=function(t){var L=v10Sel();L.forEach(function(u){tacSwitch(u,t.value);});UI.sel.map(uById).forEach(function(g){if(g&&!isLeaf(g)&&g.ord&&g.ord.k==='attack')g.ord.opt=Object.assign({},g.ord.opt||{},{tac:t.value});});toast('戰術改為'+TAC.filter(function(q){return q[0]===t.value;})[0][1]);t.blur();btStatus();};
ACT.v10turn=function(){var L=v10Sel(),fixed=L.every(function(u){return u.noTurn;});L.forEach(function(u){if(fixed){u.noTurn=0;delete u.hdM;}else{u.noTurn=1;u.hdM=u.hd||0;}});toast(fixed?'恢復自動轉向。':'固定目前的面向（不再自動轉向）。');btStatus();};
ACT.v10face=function(){if(!v10Sel().length)return;UI.v10face=1;if(VW.mode){VW.mode.hidden=false;VW.mode.innerHTML='➶ 點選地圖，部隊轉向面對該處（Esc 取消）<button type="button" data-a="v10facex">取消</button>';}};
ACT.v10facex=function(){UI.v10face=0;if(VW.mode)VW.mode.hidden=true;modeBt();};
(function(){var b=btClick;btClick=function(x,y,sx,sy,e){if(UI.v10face){UI.v10face=0;var L=v10Sel();L.forEach(function(u){var a=Math.atan2(y-u.y,x-u.x);u.hdM=a;u.noTurn=1;if(u.ord&&/defend|screen|halt/.test(u.ord.k))u.ord.face=a;});if(VW.mode)VW.mode.hidden=true;modeBt();toast(L.length+' 個單位轉向朝'+dirName(Math.atan2(y-L[0].y,x-L[0].x))+'（固定面向）');btStatus();vDraw(false);return;}return b(x,y,sx,sy,e);};})();
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&UI.v10face){ACT.v10facex();}});
/* 對交火對峙中的部隊下令移動：提醒命令要等脫離交火才會執行（撤退除外） */
(function(){var b=issueSel;issueSel=function(k,x,y,extra){var r=b(k,x,y,extra);try{if(engOn()&&!/withdraw|delay|refit|twd/.test(k)){var L=v10Sel().filter(engNow);if(L.length)toast(L.length+' 個單位正在交火對峙：'+(/attack|storm|breakthrough|pursue/.test(k)?'只能向正在交戰的敵人推進突擊，':'')+'要等脫離交火才能'+(ORDN[k]||'行動')+'；只有撤退可以立即執行。',5200);}}catch(e){}return r;};})();
/* 滑鼠提示：陣型、面向、交火 */
(function(){var b=tipAt;tipAt=function(sx,sy,w){var r=b(sx,sy,w);try{if(VW.tip&&!VW.tip.hidden&&G&&G.started){var it=hitAt(sx,sy);if(it&&it.u&&isLeaf(it.u)&&!it.agg&&ST(it.u).dom==='land'&&(seeAll()||it.u.side===UI.side)){var u=it.u;VW.tip.textContent+='\n'+fmName(fmOf(u))+'・朝'+dirName(u.hd)+(engNow(u)?'・交火對峙中':'');}}}catch(x){}return r;};})();

/* ---------- 地圖：選取部隊的射界（正面、側面、背面）、交火中的戰場 ---------- */
(function(){var b=drawUnder;drawUnder=function(c){b(c);if(!G||!G.started||G.replay)return;try{var me=UI.side,all=seeAll();c.save();
  if(UI.lay.bt!==0&&EZ.list.length){var m=mpp();EZ.list.forEach(function(z){var A=uById(z.a),B=uById(z.b);if(!all&&!(A&&A.side===me)&&!(B&&B.side===me))return;var p=w2s(z.x,z.y),r=z.r/m;if(r<3||p[0]<-r||p[1]<-r||p[0]>VW.cw+r||p[1]>VW.ch+r)return;c.globalAlpha=0.09;c.fillStyle='#c62828';c.beginPath();c.arc(p[0],p[1],r,0,2*PI);c.fill();c.globalAlpha=0.55;c.strokeStyle='#c62828';c.lineWidth=0.8;c.setLineDash([4,4]);c.stroke();c.setLineDash([]);});}
  UI.sel.map(uById).forEach(function(u){if(!u||!isLeaf(u)||!onMap(u)||ST(u).dom!=='land'||!(all||u.side===me))return;var p=w2s(u.x,u.y),R=Math.max(34,Math.min(90,rangeOf(ST(u))/mpp())),h=u.hd||0,arcs=[[-PI/3,PI/3,'46,160,70',0.26],[PI/3,PI*2/3,'240,170,20',0.24],[-PI*2/3,-PI/3,'240,170,20',0.24],[PI*2/3,PI*4/3,'210,40,40',0.26]];
    var round=fmOf(u)==='allround'||u.form==='square'||optOf(u).post==='strong';arcs.forEach(function(q){c.globalAlpha=1;var col=round?'46,160,70':q[2];c.fillStyle='rgba('+col+','+q[3]+')';c.strokeStyle='rgba('+col+',0.85)';c.lineWidth=0.8;c.beginPath();c.moveTo(p[0],p[1]);c.arc(p[0],p[1],R,h+q[0],h+q[1]);c.closePath();c.fill();c.stroke();});
    c.globalAlpha=0.8;c.strokeStyle='rgba(46,120,60,.9)';c.lineWidth=1;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(p[0]+Math.cos(h)*R,p[1]+Math.sin(h)*R);c.stroke();});c.restore();}catch(e){}};})();
/* 符號上的面向箭頭與交火標記（畫在符號之後） */
(function(){var b=drawTool;drawTool=function(c){try{if(G&&G.started&&!G.replay&&UI.lay.units){var me=UI.side,all=seeAll(),S=VW.s;c.save();(VW.items||[]).forEach(function(it){var u=it.u;if(!u||it.agg||it.grp||it.hq||it.c||it.sx===undefined||!isLeaf(u)||ST(u).dom!=='land')return;if(!(all||u.side===me))return;var sel=UI.sel.indexOf(u.id)>=0;
    var eng=engNow(u);if(S<1.2&&!sel&&!eng)return;var h=u.hd||0,r=(it.h||14)*(UIP.symRot!==0&&symStd()!=='ming'?1.05:0.72)+3,x=it.sx+Math.cos(h)*r,y=it.sy+Math.sin(h)*r,z=Math.max(3,Math.min(5,(it.h||14)*0.25));
    if(S>=1.2||sel){c.fillStyle=sideCol(u.side);c.strokeStyle='#fff';c.lineWidth=0.8;c.beginPath();c.moveTo(x+Math.cos(h)*z,y+Math.sin(h)*z);c.lineTo(x+Math.cos(h+2.4)*z,y+Math.sin(h+2.4)*z);c.lineTo(x+Math.cos(h-2.4)*z,y+Math.sin(h-2.4)*z);c.closePath();c.fill();c.stroke();}
    if(eng){c.strokeStyle='rgba(198,40,40,.9)';c.lineWidth=1.4;c.beginPath();c.arc(it.sx,it.sy,(it.h||14)*0.95,-PI*0.15,PI*0.15);c.stroke();c.beginPath();c.arc(it.sx,it.sy,(it.h||14)*0.95,PI*0.85,PI*1.15);c.stroke();}});
  /* AI 的戰略標記（上帝視角或本方 AI） */var sides=all?SIDES():me>=0&&SD(me).ai?[me]:[];if(S>=0.5)sides.forEach(function(sd){var V=SD(sd).v10;if(!V)return;(V.wk||[]).forEach(function(q){if(G.t-q.t>12*3600||q.k==='watch')return;var p=w2s(q.x,q.y);if(p[0]<-60||p[1]<-20||p[0]>VW.cw+60||p[1]>VW.ch+20)return;var t=q.k==='pocket'?'⊃⊂ 伏擊口袋':q.k==='depth'?'≡ 縱深防禦':'⊘ 地形難行，不加強';c.textAlign='center';txtHalo(c,t,p[0],p[1],'bold 11px sans-serif',q.k==='ignore'?'#6d6d6d':sideCol(sd));});
    if(V.axis&&G.t-V.axis.t<3*3600){var a=w2s(V.axis.x,V.axis.y);c.textAlign='center';txtHalo(c,'➤ 主攻方向',a[0],a[1]-16,'bold 11px sans-serif',sideCol(sd));}});c.restore();}}catch(e){}b(c);};})();

/* ---------- 設定：殺傷效率與戰鬥規則 ---------- */
var LETHO=[0.25,0.5,0.75,1,1.25,1.5,2,3];
setSec('combat','leth',{t:'殺傷效率與交戰規則',o:10,note:'殺傷效率影響兩軍與平民的傷亡；調高會讓戰鬥更快分出勝負、士氣崩潰更快，調低則接近長期對峙的消耗戰。',h:function(){var L=G.set.leth||{},sel=function(f,lbl,tip){var v=L[f]>0?L[f]:1;return setRow(lbl,'<select data-c="v10leth" data-f="'+f+'">'+LETHO.map(function(q){return '<option value="'+q+'"'+(Math.abs(q-v)<1e-6?' selected':'')+'>'+(q===1?'標準（1 倍）':q+' 倍')+'</option>';}).join('')+'</select>',tip);};
  return setOpt(sel('all','整體殺傷效率','所有傳統武器造成的傷亡倍率（核武與天災不受影響）')+sel('fire','直射火力','步槍、機槍、戰車砲等直射武器')+sel('art','砲兵與飛彈','火砲、迫擊砲、火箭與飛彈')+sel('air','空中火力','對地攻擊、轟炸與防空火力')+sel('melee','突擊與白刃','近戰突擊、刺刀與騎兵衝鋒')+
    setRow('交火對峙',setChk('v10lock','',G.set.engLock!==false,'交火中的部隊只能撤退，其他部隊不能穿越戰場'))+setRow('自動轉向',setChk('v10turnG','',G.set.autoTurn!==false,'部隊自動轉向射擊自己的敵人')));}});
CHG.v10leth=function(t){var f=t.getAttribute('data-f'),v=+t.value||1;G.set.leth=Object.assign({},G.set.leth||{});G.set.leth[f]=v;var L=G.set.leth,m=(L.all||1);toast('殺傷效率：'+({all:'整體',fire:'直射火力',art:'砲兵與飛彈',air:'空中火力',melee:'突擊與白刃'})[f]+' '+v+' 倍'+(f!=='all'&&m!==1?'（另乘整體 '+m+' 倍）':''));};
CHG.v10lock=function(t){G.set.engLock=t.checked;if(!t.checked)EZ.list=[];toast(t.checked?'交火對峙：交戰中的部隊只能撤退，其他部隊要繞過戰場。':'已關閉交火對峙。');};
CHG.v10turnG=function(t){G.set.autoTurn=t.checked;toast(t.checked?'部隊會自動轉向。':'已關閉自動轉向（部隊維持命令與指定的面向）。');};

/* ---------- 戰況總覽：AI 的戰略（上帝視角或本方由 AI 指揮時） ---------- */
(function(){var b=overview;overview=function(){var o=b();if(!G||!G.started)return o;var sides=seeAll()&&UI.side<0?SIDES():UI.side>=0&&SD(UI.side).ai?[UI.side]:[];var x='';
  sides.forEach(function(sd){var V=SD(sd).v10;if(!SD(sd).ai||!V)return;var wk={pocket:0,depth:0,ignore:0};(V.wk||[]).forEach(function(q){if(G.t-q.t<12*3600&&wk[q.k]!==undefined)wk[q.k]++;});var scr=G.units.filter(function(u){return u.side===sd&&alive(u)&&u.v10scr&&G.t-u.v10scr.t<12*3600;}).length;
    x+='<span style="color:'+G.sides[sd].color+'">'+esc(G.sides[sd].name)+' AI</span><span>'+(V.axis&&G.t-V.axis.t<3*3600?'主攻方向 '+esc(placeTxt(V.axis.x,V.axis.y))+'；':'')+(V.lg?'補給線完備度 '+pct(V.lg.r*100)+'；':'')+'輪換休整 '+(V.rot||0)+' 次；警戒前哨 '+scr+'；伏擊口袋 '+wk.pocket+'、縱深 '+wk.depth+'、因地形忽略 '+wk.ignore+'</span>';});
  var n=EZ.list.filter(function(z){var A=uById(z.a),B=uById(z.b);return seeAll()||A&&A.side===UI.side||B&&B.side===UI.side;}).length;if(n)x+='<span>交火對峙</span><span>'+n+' 處戰場正在交火（其他部隊無法穿越）</span>';
  return x?o+'<h4 style="margin:10px 0 4px;font-size:13px">戰略與對峙</h4><div class="lw-kv">'+x+'</div>':o;};})();

/* ---------- 說明 ---------- */
var V10HELP='<h4>v10：殺傷效率、側背、陣型與轉向、交火對峙、AI 的新戰略與戰術</h4><ul>'+
  '<li>設定頁的「殺傷效率與戰鬥規則」可以調整整體、直射、砲兵與飛彈、空中、突擊與白刃的殺傷倍率（0.25～3 倍），影響兩軍與平民的傷亡；核武與天災不受影響。</li>'+
  '<li>部隊有正面、側面、背面：側面受攻擊約 1.5 倍、背面約 2 倍的殺傷（依陣型不同），野戰塹壕只保護正面（碉堡、堡壘與城牆是全向的），環形據點與環形陣型沒有側背弱點。射擊方的目標不在正面時火力也會打折：步兵最多、砲塔車輛較少、牽引火砲最嚴重。選取部隊時地圖會畫出它的正面（綠）、側面（黃）、背面（紅）。</li>'+
  '<li>自動轉向：部隊會轉身面對正在射擊自己的敵人或最近的敵軍，戰車約一分鐘、步兵兩三分鐘、牽引火砲要十分鐘，轉向中火力較弱。單位面板可以「固定目前面向」或「指定面向」（點選地圖）。</li>'+
  '<li>陣型：橫隊、縱隊、散兵線（1914 年以前的步兵）、楔形（裝甲與騎兵）、梯形（退縮暴露的一翼）、環形（全向防禦，移動很慢）、疏開（1900 年以後，大幅減少砲擊與空襲的殺傷）。預設「自動」：被包圍時結環形、遭砲擊時疏開、裝甲進攻時用楔形、只有一側有友軍時以梯形掩護另一翼。變換陣型需要時間。單位面板也能即時切換防禦姿態（例如改為伏擊、遲滯、反斜面）或進攻戰術。</li>'+
  '<li>交火對峙：直射交火中的部隊進入對峙，除了撤退之外不能移動；進攻中的部隊只能向正在交戰的敵人推進突擊。交火的範圍在地圖上以紅色虛線圈標示，其他部隊（雙方）不能從中穿越，會自動改道繞行，沒有其他路時在外面等待；補給車隊也會盡量繞開。可在設定關閉。</li>'+
  '<li>AI 的新戰略與戰術（行為樹）：<b>後勤先行</b>——準備進攻前，先建立後方基地 → 前進補給站 → 補給點的多級補給線、補足彈藥與油料才發起攻勢（等太久仍會進攻；魯莽型不等）；<b>主攻方向增兵</b>——把預備隊、新到的增援與未交戰地區多出的部隊作為第二梯隊投入主攻方向；<b>側翼掩護</b>——主攻部隊的側翼暴露時派兵掩護；<b>輪換休整</b>——瀕臨潰散、兵力過低、極度疲勞或彈盡的部隊撤到後方休整（兵力太低時撤出戰場整補），由新銳部隊接替陣地；<b>弱點處置</b>——防線的缺口依指揮官風格布置成伏擊口袋（兩側設伏、火力支援）或在後方構築第二道防線（縱深防禦），如果缺口位於沼澤、叢林或大片水域則判斷敵軍難以通行而暫不加強；<b>警戒前哨</b>——未交戰的前線也會派出警戒或少量防衛兵力，不讓任何方向完全空虛。上帝視角下地圖會標出 AI 的主攻方向、伏擊口袋與縱深防禦，戰況總覽列出各項統計。</li></ul>';
