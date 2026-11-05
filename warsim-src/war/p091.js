/* ===================== 作戰計畫（介面）：計畫模式（命令先加入草稿）、步驟清單與開始條件、下達與修正、暗號、地圖上的計畫路線 ===================== */
UI.plMode=false;UI.plPick=null;
function plMine(u){return !!u&&alive(u)&&(mySide()===null||u.side===mySide());}
function plDraft(u){var D=u.pdr;if(!D||!Array.isArray(D.sq))D=u.pdr={v:Math.max(1,u.pln?u.pln.v:0),n:1,sq:[]};if(!(D.n>0))D.n=1+D.sq.reduce(function(m,q){return Math.max(m,q.id||0);},0);return D;}
function plTouch(u){var D=plDraft(u);D.v=Math.max(D.v||1,u.pln?u.pln.v:0)+1;}
function plDraftAdd(u,k,p){var D=plDraft(u),pp=JSON.parse(JSON.stringify(p||{}));delete pp.oid;delete pp.pl;D.sq.push({id:D.n++,k:k,p:pp,tr:{k:'prev',w:0}});if(D.sq.length>24)D.sq.shift();plTouch(u);}
/* 計畫模式：下達的命令改為加入選取部隊的計畫草稿 */
(function(){var b=issueSel;issueSel=function(k,x,y,extra){if(!UI.plMode||!G)return b.apply(this,arguments);var cap=[],bi=issue,bt=toast;
  issue=function(u,k2,p){cap.push([u,k2,p]);return {sec:0};};toast=function(m){if(!/^已下令/.test(String(m)))bt.apply(this,arguments);};try{b.apply(this,arguments);}finally{issue=bi;toast=bt;}
  if(!cap.length)return;cap.forEach(function(q){plDraftAdd(q[0],q[1],q[2]);});toast('已加入計畫：'+(ORDN[k]||k)+'（'+cap.length+' 個單位）。按「執行計畫」送出。',3500);btOrd();vDraw(false);};})();
if(typeof drawDone==='function')(function(){var b=drawDone;drawDone=function(){if(!UI.plMode)return b.apply(this,arguments);var cap=[],bi=issue;issue=function(u,k2,p){cap.push([u,k2,p]);return {sec:0};};try{b.apply(this,arguments);}finally{issue=bi;}cap.forEach(function(q){plDraftAdd(q[0],q[1],q[2]);});if(cap.length){toast('手繪的命令已加入 '+cap.length+' 個單位的計畫。');btOrd();}};})();
CHG.plmode=function(t){UI.plMode=!!t.checked;btOrd();vDraw(false);toast(UI.plMode?'計畫模式：之後下達的命令會依序加入選取部隊的計畫，按「執行計畫」才送出。':'已關閉計畫模式，命令會立即下達。',3500);};
/* ---------- 時間換算 ---------- */
function plAbs(t){return t+(G.set.h||0)*3600+(G.set.mi||0)*60;}
function plDayOf(t){return Math.floor(plAbs(t)/86400);}
function plHM(t){var a=plAbs(t)-plDayOf(t)*86400;return two(Math.floor(a/3600))+':'+two(Math.floor(a%3600/60));}
function plT(day,hm){var m=/^(\d+):(\d+)/.exec(hm||'')||[0,0,0];return Math.max(0,day*86400+(+m[1])*3600+(+m[2])*60-(G.set.h||0)*3600-(G.set.mi||0)*60);}
function plDayTxt(d){var o=dateOf(G.set.y,G.set.m,G.set.d,d*86400);return '第 '+(d+1)+' 天（'+o.m+'/'+o.d+'）';}
/* ---------- 步驟的狀態與條件說明 ---------- */
function plTrTxt(u,T,i){T=T||{k:'prev'};var w=+T.w>0?'，再等 '+T.w+' 分':'';if(T.k==='time')return plDayTxt(plDayOf(T.t||0))+' '+plHM(T.t||0);if(T.k==='code')return '收到暗號「'+T.c+'」'+w;
  if(T.k==='sync'){var A=uById(T.u);return (A?uName(A):'友軍')+'第 '+(A&&A.pdr?plIdxD(A,T.s)+1:'?')+' 步完成'+w;}if(T.k==='str')return '兵力低於 '+(T.pc||50)+'%';if(T.k==='cont')return '敵軍進入 '+kmTxt(T.d||2000)+' 或遭射擊';return (i?'前一步完成後':'收到計畫後')+(+T.w>0?' '+T.w+' 分':'');}
function plIdxD(A,id){var L=(A.pdr&&A.pdr.sq)||(A.pln&&A.pln.sq)||[];for(var i=0;i<L.length;i++)if(L[i].id===id)return i;return -1;}
function plStepSt(u,S){var P=u.pln;if(!P)return ['✎','尚未下達','#8D6E63'];var j=plIdx(P,S.id);if(j<0||plSig(P.sq[j])!==plSig(S)||JSON.stringify(P.sq[j].tr)!==JSON.stringify(S.tr))return ['✎','修改未下達','#8D6E63'];
  if(P.done[S.id]!==undefined)return ['✓','完成','#2E7D32'];if(P.ph!=='run')return ['■',P.ph==='done'?'—':'已中止','#757575'];if(j===P.cur)return ['▶','執行中','#1565C0'];if(j===P.cur+1)return ['⏳','等待：'+plTrTxt(u,S.tr,j),'#6A1B9A'];return ['·','排定','#757575'];}
function plInFlight(u){return !!u.plS&&G.msgs.some(function(m){return m.to===u.id&&m.o&&m.o.k==='plan';});}
function plHead(u){var P=u.pln,D=u.pdr;if(plInFlight(u))return '傳送中，約 '+durTxt(Math.max(0,u.plS.eta-G.t))+'後送達';if(!P)return D&&D.sq.length?'草稿，尚未下達':'';
  var dirty=D&&D.v>P.v;if(P.ph==='run')return '執行中：第 '+Math.min(P.cur+1,P.sq.length)+'／'+P.sq.length+' 步'+(P.cur<0?'（等待開始）':'')+(dirty?'；有未下達的修改':'');return (P.ph==='done'?'已完成':'已中止')+(dirty?'；有未下達的修改':'');}
/* ---------- 開始條件的編輯欄位 ---------- */
function plTrHtml(u,S,i){var T=S.tr||{k:'prev'},o='<select data-c="pltr" data-v="'+i+'">'+Object.keys(PLTR).map(function(k){return '<option value="'+k+'"'+(T.k===k?' selected':'')+'>'+(k==='prev'&&!i?'收到計畫後':PLTR[k])+'</option>';}).join('')+'</select>',wi='<input type="number" min="0" max="1440" step="5" value="'+(+T.w||0)+'" data-c="plw" data-v="'+i+'" style="width:48px" title="條件成立後再等幾分鐘"> 分';
  if(T.k==='prev'||T.k==='code'||T.k==='sync')o+=' ';if(T.k==='prev')o+='再等 '+wi;
  if(T.k==='time'){var nd=Math.max(2,Math.ceil(((G.set.dur||24)*3600+plAbs(0))/86400)+1),d0=plDayOf(T.t||G.t);o+=' <select data-c="plday" data-v="'+i+'">';for(var d=0;d<Math.min(nd,62);d++)o+='<option value="'+d+'"'+(d===d0?' selected':'')+'>'+plDayTxt(d)+'</option>';o+='</select> <input type="time" data-c="pltm" data-v="'+i+'" value="'+plHM(T.t||G.t)+'">';}
  if(T.k==='code')o+='<select data-c="plc" data-v="'+i+'">'+PLC.map(function(c){return '<option'+(T.c===c?' selected':'')+'>'+c+'</option>';}).join('')+'</select> 再等 '+wi;
  if(T.k==='sync'){var others=G.units.filter(function(q){return q!==u&&plMine(q)&&((q.pdr&&q.pdr.sq.length)||q.pln);});o+='<select data-c="plsu" data-v="'+i+'"><option value="0">選擇友軍</option>'+others.map(function(q){return '<option value="'+q.id+'"'+(q.id===T.u?' selected':'')+'>'+esc(uName(q))+'</option>';}).join('')+'</select>';
    var A=uById(T.u),L=A?((A.pdr&&A.pdr.sq)||(A.pln&&A.pln.sq)||[]):[];o+='<select data-c="plss" data-v="'+i+'">'+L.map(function(q,j){return '<option value="'+q.id+'"'+(q.id===T.s?' selected':'')+'>第 '+(j+1)+' 步（'+(ORDN[q.k]||q.k)+'）</option>';}).join('')+'</select> 再等 '+wi;}
  if(T.k==='str')o+=' <select data-c="plpc" data-v="'+i+'">'+[90,80,70,60,50,40,30,20].map(function(v){return '<option value="'+v+'"'+(+T.pc===v||!T.pc&&v===50?' selected':'')+'>'+v+'%</option>';}).join('')+'</select>';
  if(T.k==='cont')o+=' <select data-c="pld" data-v="'+i+'">'+[500,1000,1500,2000,3000,5000,8000].map(function(v){return '<option value="'+v+'"'+(+T.d===v||!T.d&&v===2000?' selected':'')+'>'+kmTxt(v)+'</option>';}).join('')+'</select>';
  return o;}
/* ---------- 命令面板：計畫模式開關、步驟清單、執行計畫、暗號 ---------- */
/* 有尚未下達（新的或修改過）的計畫草稿的本方部隊 */
function plPend(){if(!G||!G.units)return [];return G.units.filter(function(u){var D=u.pdr;if(!D||!D.sq||!D.sq.length||!plMine(u))return false;var v=D.v||1;return !(u.plS&&u.plS.v>=v)&&!(u.pln&&u.pln.v>=v);});}
function plPanel(us){var np=plPend().length,ex=np?'<button type="button" class="lw-btn pri sm" data-a="plexec" title="把所有尚未下達的計畫一次送出（'+esc(hkTxt('plexec')||'')+'）">▶ 執行計畫'+(np>1?'（'+np+' 個單位）':'')+'</button>':'';
  if(us.length===1){var u=us[0],D=u.pdr,L=D&&D.sq||[],P=u.pln;if(!L.length&&!P&&!UI.plMode)return ex?'<div class="lw-row lw-plx">'+ex+'</div>':'';
    var o='<div class="lw-card lw-plan"><h3>作戰計畫<small>'+esc(plHead(u))+'</small></h3>';
    if(!L.length)o+='<div class="lw-note">'+(UI.plMode?'計畫模式：點選命令再點地圖，命令依序排進這個單位的計畫，按「執行計畫」送出。':'沒有計畫草稿。')+'</div>';
    else o+='<ol class="lw-pls">'+L.map(function(S,i){var s=plStepSt(u,S),ed=UI.plEd===u.id+':'+i,pt=S.p&&S.p.x!==undefined;
      return '<li><span class="lw-plsi" style="color:'+s[2]+'" title="'+esc(s[1])+'">'+s[0]+'</span><b>'+esc(ORDN[S.k]||S.k)+'</b>'+(pt?'<small>'+esc(placeTxt(S.p.x,S.p.y))+'</small>':'')+
        '<button type="button" class="lw-pltr'+(ed?' on':'')+'" data-a="pled" data-v="'+i+'" title="開始條件：按一下修改">'+esc(plTrTxt(u,S.tr,i))+'</button>'+
        '<span class="lw-plb"><button type="button" class="lw-btn sm" data-a="plup" data-v="'+i+'" title="往前移"'+(i?'':' disabled')+'>↑</button><button type="button" class="lw-btn sm" data-a="pldn" data-v="'+i+'" title="往後移"'+(i<L.length-1?'':' disabled')+'>↓</button>'+(pt?'<button type="button" class="lw-btn sm" data-a="plpt" data-v="'+i+'" title="在地圖上重新指定位置">📍</button>':'')+'<button type="button" class="lw-btn sm dng" data-a="pldel" data-v="'+i+'" title="刪除這一步">✕</button></span>'+
        (ed?'<div class="lw-pltre">'+plTrHtml(u,S,i)+'</div>':'')+'</li>';}).join('')+'</ol>';
    o+='<div class="lw-row">'+ex+(P&&P.ph==='run'?'<button type="button" class="lw-btn sm" data-a="plstop">取消計畫</button>':'')+(L.length?'<button type="button" class="lw-btn sm" data-a="plclr">清空草稿</button>':'')+'</div>';
    if(L.length)o+='<div class="lw-note">'+(G.started&&G.step?'計畫經指揮鏈傳遞（約 '+durTxt(orderDelayEst(u).sec)+'）；部隊事先收到計畫，每一步的準備與規劃只要平常的三成左右。':'開戰前下達的計畫視為作戰前簡報，部隊立即收到。')+'</div>';
    return o+'</div>';}
  var W=us.filter(function(q){return q.pdr&&q.pdr.sq.length;});if(!W.length&&!UI.plMode)return ex?'<div class="lw-row lw-plx">'+ex+'</div>':'';
  return '<div class="lw-card lw-plan"><h3>作戰計畫</h3><div class="lw-note">'+(W.length?'選取的部隊中有 '+W.length+' 個單位有計畫草稿（單選一個單位可以編輯步驟）。':'計畫模式：下達的命令會排進每個選取單位的計畫。')+'</div>'+(ex?'<div class="lw-row">'+ex+'</div>':'')+'</div>';}
function plCodes(side){var c={};G.units.forEach(function(u){var P=u.pln;if(u.side!==side||!alive(u)||!P||P.ph!=='run')return;if(typeof mpActive==='function'&&mpActive()&&typeof mpCanCmd==='function'&&MPS.cm>=0&&!mpCanCmd(u,side,MPS.cm))return;
  var seen={};P.sq.forEach(function(q,i){if(i>P.cur&&q.tr&&q.tr.k==='code'&&P.codes[q.tr.c]===undefined&&!seen[q.tr.c]){seen[q.tr.c]=1;c[q.tr.c]=(c[q.tr.c]||0)+1;}});});return c;}
function plCodeHtml(){var s=mySide();if(s===null||!G.started)return '';var c=plCodes(s),ks=PLC.filter(function(k){return c[k];});if(!ks.length)return '';
  return '<div class="lw-row lw-plcodes" title="暗號經指揮鏈送到所有等待它的部隊，收到後立即開始對應的步驟"><span class="lw-note">暗號</span>'+ks.map(function(k){return '<button type="button" class="lw-btn sm" data-a="plcode" data-v="'+k+'">發出「'+k+'」（'+c[k]+' 個單位等待）</button>';}).join('')+'</div>';}
(function(){var b=btOrd;btOrd=function(){b.apply(this,arguments);try{var el=btEl('bord');if(!el||!G)return;var ob=el.querySelector('.lw-ob');if(!ob)return;var us=UI.sel.map(uById).filter(plMine);if(!us.length)return;
  ob.insertAdjacentHTML('beforebegin','<label class="lw-plmode" title="開啟後，下達的命令不會立即送出，而是依序排進選取部隊的作戰計畫，按「執行計畫」一次送出。不開啟時按住 Shift 下令也會依序排進命令序列，放開 Shift 就送出。"><input type="checkbox" data-c="plmode"'+(UI.plMode?' checked':'')+'> 計畫模式：命令先排進計畫，再「執行計畫」<small>（或按住 Shift 連續下令）</small></label>');
  var x=plPanel(us)+plCodeHtml();if(x){var opt=el.querySelector('.lw-opt');(opt||ob).insertAdjacentHTML('afterend',x);}}catch(e){}};})();
function plSelU(){var u=uById(UI.sel[0]);return UI.sel.length===1&&plMine(u)?u:null;}
function plEdit(f){var u=plSelU();if(!u)return;var D=plDraft(u);f(D,u);plTouch(u);btOrd();vDraw(false);}
CHG.pltr=function(t){var i=+t.getAttribute('data-v');plEdit(function(D){var S=D.sq[i];if(!S)return;var k=t.value;S.tr={k:k,w:0};if(k==='time')S.tr.t=Math.ceil((G.t+3600)/600)*600;if(k==='code')S.tr.c=PLC[0];if(k==='str')S.tr.pc=50;if(k==='cont')S.tr.d=2000;if(k==='sync'){S.tr.u=0;S.tr.s=0;}});};
CHG.plw=function(t){var i=+t.getAttribute('data-v');plEdit(function(D){var S=D.sq[i];if(S)S.tr.w=clamp(Math.round(+t.value||0),0,1440);});};
CHG.plday=function(t){var i=+t.getAttribute('data-v');plEdit(function(D){var S=D.sq[i];if(S)S.tr.t=plT(+t.value,plHM(S.tr.t||G.t));});};
CHG.pltm=function(t){var i=+t.getAttribute('data-v');plEdit(function(D){var S=D.sq[i];if(S)S.tr.t=plT(plDayOf(S.tr.t||G.t),t.value);});};
CHG.plc=function(t){var i=+t.getAttribute('data-v');plEdit(function(D){var S=D.sq[i];if(S)S.tr.c=PLC.indexOf(t.value)>=0?t.value:PLC[0];});};
CHG.plsu=function(t){var i=+t.getAttribute('data-v');plEdit(function(D){var S=D.sq[i];if(!S)return;S.tr.u=+t.value;var A=uById(S.tr.u),L=A?((A.pdr&&A.pdr.sq)||(A.pln&&A.pln.sq)||[]):[];S.tr.s=L.length?L[0].id:0;});};
CHG.plss=function(t){var i=+t.getAttribute('data-v');plEdit(function(D){var S=D.sq[i];if(S)S.tr.s=+t.value;});};
CHG.plpc=function(t){var i=+t.getAttribute('data-v');plEdit(function(D){var S=D.sq[i];if(S)S.tr.pc=+t.value;});};
CHG.pld=function(t){var i=+t.getAttribute('data-v');plEdit(function(D){var S=D.sq[i];if(S)S.tr.d=+t.value;});};
ACT.plup=function(b){var i=+b.getAttribute('data-v');plEdit(function(D){if(i>0){var q=D.sq[i];D.sq[i]=D.sq[i-1];D.sq[i-1]=q;}});};
ACT.pldn=function(b){var i=+b.getAttribute('data-v');plEdit(function(D){if(i<D.sq.length-1){var q=D.sq[i];D.sq[i]=D.sq[i+1];D.sq[i+1]=q;}});};
ACT.pldel=function(b){var i=+b.getAttribute('data-v');plEdit(function(D){D.sq.splice(i,1);});};
ACT.plclr=function(){var u=plSelU();if(!u||!confirm('清空「'+uName(u)+'」的計畫草稿？（已下達給部隊的計畫不受影響）'))return;plEdit(function(D){D.sq=[];});};
ACT.plpt=function(b){var u=plSelU();if(!u)return;UI.plPick={u:u.id,i:+b.getAttribute('data-v')};modeBt();};
function plSendOne(u){var D=plDraft(u);if(!D.sq.length)return null;var v=Math.max(D.v||1,(u.pln?u.pln.v:0)+1);D.v=v;return planSend(u,D.sq,v);}
/* 執行計畫：所有尚未下達的計畫草稿一次送出 */
ACT.plexec=function(){var L=plPend();if(!L.length){toast('沒有尚未下達的計畫。');return;}var n=0,mx=0,er='';L.forEach(function(u){var r=plSendOne(u);if(r&&r.err)er=r.err;else if(r){n++;mx=Math.max(mx,r.sec||0);}});
  toast(n?'已執行計畫：'+n+' 個單位'+(mx>0?'，最慢約 '+durTxt(mx)+' 後送達':'（作戰前簡報，立即收到）'):er||'沒有送出任何計畫。',4000);btOrd();vDraw(false);};
ACT.pled=function(b){var u=plSelU();if(!u)return;var k=u.id+':'+b.getAttribute('data-v');UI.plEd=UI.plEd===k?null:k;btOrd();};
ACT.plstop=function(){var u=plSelU();if(!u||!confirm('取消「'+uName(u)+'」的作戰計畫？部隊會繼續目前的行動，之後的步驟不再執行。'))return;var r=planStop(u);toast(r&&r.pre?'計畫已取消。':'取消命令已送出'+(r&&r.sec>0?'，約 '+durTxt(r.sec)+'後送達':'')+'。');btOrd();};
ACT.plcode=function(b){var c=b.getAttribute('data-v'),s=mySide();if(s===null)return;var r=planCode(s,c,typeof MPS!=='undefined'&&typeof mpActive==='function'&&mpActive()?MPS.cm:undefined);if(r&&r.err){toast(r.err);return;}
  toast('已發出暗號「'+c+'」'+(r&&r.n!==undefined?'給 '+r.n+' 個單位'+(r.sec>0?'，最慢約 '+durTxt(r.sec)+'後送達':''):'')+'。',4000);btOrd();};
/* 在地圖上重新指定某一步的位置 */
(function(){var b=btClick;btClick=function(x,y,sx,sy,e){var K=UI.plPick;if(!K)return b.apply(this,arguments);UI.plPick=null;var u=uById(K.u);if(u){var D=plDraft(u),S=D.sq[K.i];if(S&&S.p){S.p.x=x;S.p.y=y;plTouch(u);toast('第 '+(K.i+1)+' 步改到'+placeTxt(x,y)+'；按「'+(u.pln&&u.pln.ph==='run'?'傳送修正':'下達計畫')+'」送出。');}}modeBt();btOrd();vDraw(false);};})();
(function(){var b=modeBt;modeBt=function(){b.apply(this,arguments);if(!VW.mode||!UI.plPick)return;VW.mode.hidden=false;VW.mode.innerHTML='點選地圖指定計畫第 '+(UI.plPick.i+1)+' 步的新位置<button type="button" data-a="plpickx">取消</button>';};})();
ACT.plpickx=function(){UI.plPick=null;modeBt();};
/* ---------- 部隊狀態：計畫進度 ---------- */
(function(){var b=btStatus;btStatus=function(){b.apply(this,arguments);try{if(!G||!G.started||UI.sel.length!==1)return;var u=uById(UI.sel[0]),el=btEl('bst');if(!u||!el||!u.pln||!plMine(u)&&!seeAll())return;var P=u.pln,S=P.sq[P.cur],N=P.sq[P.cur+1];
  el.insertAdjacentHTML('beforeend','<div class="lw-note lw-plst" style="border-left:3px solid #6A1B9A;padding-left:6px;margin-top:4px">作戰計畫：'+esc(plHead(u))+(S&&P.ph==='run'?'；目前「'+esc(ORDN[S.k]||S.k)+'」':'')+(N&&P.ph==='run'?'；下一步「'+esc(ORDN[N.k]||N.k)+'」：'+esc(plTrTxt(u,N.tr,P.cur+1)):'')+'</div>');}catch(e){}};})();
/* ---------- 地圖：選取部隊的計畫路線與步驟編號（草稿為虛線） ---------- */
function drawPlans(c){if(!G||!G.units)return;var me=mySide(),show=UI.sel.map(uById).filter(function(u){return u&&(u.pdr&&u.pdr.sq.length||u.pln)&&(me===null||u.side===me);});if(UI.plMode)G.units.forEach(function(u){if(show.indexOf(u)<0&&plMine(u)&&u.pdr&&u.pdr.sq.length)show.push(u);});if(!show.length)return;
  c.save();show.forEach(function(u){var D=u.pdr&&u.pdr.sq.length?u.pdr.sq:u.pln.sq,P=u.pln,pos=isLeaf(u)?[u.x,u.y]:(cOf(u)||[u.x,u.y]),prev=w2s(pos[0],pos[1]),col=sideCol(u.side);
    D.forEach(function(S,i){if(!S.p||S.p.x===undefined)return;var q=w2s(S.p.x,S.p.y),s=plStepSt(u,S),done=s[0]==='✓',curr=s[0]==='▶';c.strokeStyle=done?'rgba(120,120,120,0.7)':s[0]==='✎'?'#E65100':col;c.lineWidth=curr?2.6:1.6;c.setLineDash(done||curr?[]:[6,4]);c.beginPath();c.moveTo(prev[0],prev[1]);c.lineTo(q[0],q[1]);c.stroke();c.setLineDash([]);
      c.fillStyle='rgba(255,255,255,0.92)';c.beginPath();c.arc(q[0],q[1],8,0,2*PI);c.fill();c.stroke();c.fillStyle=c.strokeStyle;c.font='bold 10px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1),q[0],q[1]+0.5);
      if(S.tr&&S.tr.k!=='prev'){c.font='10px sans-serif';c.textAlign='left';c.fillText({time:'⏱',code:'「'+S.tr.c+'」',sync:'⇄',str:'↓%',cont:'⚔'}[S.tr.k]||'',q[0]+10,q[1]-8);}prev=q;});});c.restore();}
(function(){var b=drawObjs;drawObjs=function(c){b.apply(this,arguments);try{drawPlans(c);}catch(e){}};})();
/* ---------- 聯機：下達計畫與暗號由伺服器執行 ---------- */
if(typeof mpWrapFn==='function'){planSend=mpWrapFn('planSend',planSend,function(a){var s=0;try{s=a[0]&&a[0].st!=='off'&&G.started&&G.step?orderDelayEst(a[0]).sec:0;}catch(e){}return {sec:s,pending:1,pre:!(G.started&&G.step)};});
  planCode=mpWrapFn('planCode',planCode,function(){return {pending:1};});}
HELP14.push('<h4>作戰計畫：事先排好行動，中途可以修正</h4><ul><li>在命令面板勾選「📋 計畫模式」後，點命令再點地圖，命令不會立即送出，而是依序排進選取部隊的計畫；可以替多個單位同時排。命令面板下方的「作戰計畫」列出每一步，可以調整順序、刪除、用 📍 在地圖上改位置。</li>'+
  '<li>每一步都有開始條件：前一步完成後（可再等幾分鐘）、指定時間、收到暗號、配合友軍的某一步完成（加上回報時間）、兵力低於某個比例（例如撤退的應變步驟）、敵軍進入一定距離或遭射擊。移動、防禦等在抵達後算完成，攻擊在奪下目標後完成，砲擊、構築等在任務結束後完成。</li>'+
  '<li>按「下達計畫」把整份計畫送給部隊：開戰前（時間開始流動之前）視為作戰前簡報，部隊立即收到；開戰後只走一次指揮鏈。部隊事先知道計畫，每一步的準備與參謀規劃只要平常的三成左右，不必每一步都等命令一來一回。</li>'+
  '<li>中途修改後按「傳送修正」：同樣經指揮鏈送達，已完成的步驟保留，正在執行的步驟若改了位置或內容就重新執行。暗號是短訊，在命令面板按「發出暗號」，所有等待這個暗號的部隊收到後立即開始對應的步驟，適合同時發起攻擊。</li>'+
  '<li>計畫中的步驟也是玩家的命令：被遭遇戰、戰術後撤等打斷後會自動接回；你另外直接下令時計畫中止，之後可以「繼續計畫」。地圖上以編號標出選取部隊的計畫路線，虛線為還沒執行的步驟、橘色為還沒下達的修改。聯機時隊友也看得到你的計畫草稿。</li></ul>');
