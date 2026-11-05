/* ===================== 通信：傳令兵、部隊回報、指揮官之間與對敵的訊息 =====================
   傳遞方式由 hopDelay 自動選最快的一種（數位網路、無線電、通信單位中繼、有線電報或電話、傳令）。
   走傳令的每一段路程都是地圖上的實體：依年代騎馬、徒步、騎機車或開聯絡車，依速度移動；經過敵軍附近可能被截，
   內容落入敵手（截獲方得知收件部隊的位置與命令內容），寄件的司令部等不到回音才重新派遣。
   部隊以無線電（沒有無線電的年代以傳令）回報接敵、傷亡、士氣、彈藥與燃料、毒氣、包圍、命令的收到與完成，
   送到司令部後出現在收件匣與兵牌上方的對話框。指揮官之間與對敵軍也能互傳訊息：無線電可切換密碼或明碼，
   明碼可能被附近的敵軍截收，密碼會被電子偵測單位測出發訊位置；對敵只能用明碼無線電，或派打白旗的軍使。 */
var CRK={horse:['騎馬傳令','騎'],runner:['傳令兵','步'],moto:['機車傳令','機'],car:['聯絡車','車'],flag:['軍使（白旗）','使']};
function crKind(E){return E.fan||E.y<1914?'horse':E.y<1939?'runner':E.y<1960?'moto':'car';}
/* 一段傳令路程：t0 出發、t1 送達，最後 f 秒在目的地附近尋找收件單位；r＝有傳令騎兵或通信單位帶路 */
function crLeg(a,b,t0,sec,E,h,k){var M=G.set.delayMul===undefined?1:G.set.delayMul,f=Math.min((E.find||10)*60*M,sec*0.5);return {a:a.id,b:b.id,t0:t0,t1:t0+sec,f:f,x0:Math.round(a.x),y0:Math.round(a.y),x1:Math.round(b.x),y1:Math.round(b.y),k:k||crKind(E),r:h&&h.rider?1:0};}
/* 單段訊息（請求、回覆、上級指令、指揮官之間）走傳令時掛上路程 */
function crLeg1(m,a,b,h){if(h&&h.via==='courier'&&h.sec>0&&a&&b)m.lg=[crLeg(a,b,G.t,h.sec,commEra(a,b),h)];return m;}
function crPos(L,t){var T=L.t1-L.f-L.t0,q=T>0?clamp((t-L.t0)/T,0,1):1;return [L.x0+(L.x1-L.x0)*q,L.y0+(L.y1-L.y0)*q,q];}
function crAct(m,t){if(!m.lg||m.lost||m.st==='lost'||m.st==='ok')return null;for(var i=0;i<m.lg.length;i++){var L=m.lg[i];if(t>=L.t0&&t<L.t1)return L;}return null;}
/* 所有帶傳令路程的訊息：命令、請求、回覆與上級指令（G.msgs）、指揮官之間（各方 tb.q）、回報與訊息（G.tx） */
function crEach(fn){(G.msgs||[]).forEach(function(m){if(m.lg)fn(m,'m',m.side);});SIDES().forEach(function(s){var S=G.sides&&G.sides[s];if(S&&S.tb&&S.tb.q)S.tb.q.forEach(function(m){if(m.lg)fn(m,'t',s);});});(G.tx||[]).forEach(function(m){if(m.lg)fn(m,'x',m.side);});}
function crKey(m,src,s){return src==='t'?'t'+s+'_'+m.id:src+m.id;}
function viaN(v,lg){if(v==='courier'){var k=lg&&lg.length?lg[0].k:null;return k&&CRK[k]?CRK[k][0]:'傳令';}if(v==='wire')return G&&G.set&&G.set.y<1905?'電報':'電話';if(v==='self')return '當面';return VIA[v]||v;}
/* 通信專用的亂數（不影響戰鬥的亂數序列） */
function rndT(){if(!G._rT)G._rT=mb32(hstr((G.set.seed||'')+'|tx|'+Math.floor(G.t)));return G._rT();}
/* 收件匣：截獲、測向、敵軍來訊等不需處置的項目也放這裡 */
function ibAdd(side,o){if(!(side>=0&&side<nSides()))return null;o.id=(G.mid=(G.mid||0)+1);o.t=G.t;o.side=side;var L=G.inbox=G.inbox||[];L.push(o);
  if(L.length>400){var n=L.length-300;G.inbox=L.filter(function(q){if(n>0&&(q.done||/^(icpt|det|enmsg)$/.test(q.k))){n--;return false;}return true;});}return o;}

/* ---------- 截獲：傳令經過敵軍附近（800 公尺，抵達後找人時 300 公尺），每分鐘依距離、敵軍兵種、晝夜與交通工具判定 ---------- */
function crStep(){if(G.set.crCap===false)return;var t=G.t,night=G.env&&G.env.light<0.3;
  crEach(function(m,src,side){var L=crAct(m,t);if(!L||L.k==='flag'||!(side>=0&&side<nSides()))return;var p=crPos(L,t),R=p[2]>=1?300:800,e=null,bd=R,own=R;
    hostSides(side).forEach(function(es){gridNearS(p[0],p[1],R,es,function(q){if(q.side===side||!onMap(q)||q.ms==='rout'||uDom(q)!=='land'||ST(q).fl.indexOf('u')>=0)return;var d=dist(q.x,q.y,p[0],p[1]);if(d<bd){bd=d;e=q;}});});if(!e)return;
    /* 在本方部隊之間穿行：比敵軍更近就不容易被截 */gridNearS(p[0],p[1],bd,side,function(q){if(q.side!==side||!onMap(q)||uDom(q)!=='land')return;var d=dist(q.x,q.y,p[0],p[1]);if(d<own)own=d;});
    var s=ST(e),fl=s.fl,x=1-bd/R,pc=0.25*x*x*(fl.indexOf('c')>=0||fl.indexOf('r')>=0||fl.indexOf('G')>=0||s.br==='rec'?1.6:1)*(night?0.7:1)*(L.k==='moto'||L.k==='car'?0.6:L.k==='runner'?1.2:1)*(L.r?0.5:1)*(own<bd?0.3:1);
    if(rndT()<pc)crCapture(m,src,side,L,p,e);});}
function crCapture(m,src,side,L,p,e){m.lost=1;m.capt={s:e.side,t:G.t,by:e.id,x:Math.round(p[0]),y:Math.round(p[1])};if(src==='m'&&m.k==='order')m.retry=Math.max(m.ta,G.t)+900;
  var I=crInfo(m,src,side),txt=uName(e)+'截獲'+G.sides[side].name+'的'+CRK[L.k][0]+'：'+I.txt;logE(e.side,'intel',txt,p[0],p[1],e.id);
  ibAdd(e.side,{k:'icpt',txt:txt,x:I.x!==undefined?I.x:Math.round(p[0]),y:I.y!==undefined?I.y:Math.round(p[1]),by:e.id});
  /* 公文上寫著收件部隊：位置送進截獲方的情報圖 */var tu=uById(L.b);if(tu&&alive(tu)&&G.rq&&G.rq[e.side])G.rq[e.side].push({at:G.t+reportDelay(e),id:tu.id,x:tu.x,y:tu.y,t:G.t,q:0.5,by:e.id});
  if(G.onPause&&apOn('intel'))G.onPause('截獲敵軍傳令');}
/* 被截的內容摘要 */
function crInfo(m,src,side){var nm=function(id){var u=uById(id);return u?uName(u):'不明部隊';};
  if(src==='m'){var f=nm(m.from),t=nm(m.to);if(m.k==='order'){var o=m.o||{};return {txt:f+'給'+t+'的命令「'+ordN(o)+'」'+(o.x!==undefined?'，目標在'+placeTxt(o.x,o.y):''),x:o.x,y:o.y};}
    if(m.k==='req')return {txt:f+'向'+t+'請求'+(REQN[m.rk]||'支援')+(m.x!==undefined?'（'+placeTxt(m.x,m.y)+'）':''),x:m.x,y:m.y};
    if(m.k==='dir')return {txt:f+'給'+t+'的指令「'+(ORDN[m.dk]||m.dk)+'」'+(m.x!==undefined?'，目標在'+placeTxt(m.x,m.y):''),x:m.x,y:m.y};return {txt:f+'給'+t+'的回覆：'+(m.txt||'')};}
  if(src==='t'){var Lc=cmList(side),d=m.d||{};return {txt:(Lc[m.from]?Lc[m.from].n:'')+'給'+(Lc[m.to]?Lc[m.to].n:'')+'的訊息：'+(m.txt||''),x:d.x,y:d.y};}
  return {txt:(m.k==='rep'?nm(m.fu)+'的回報：':txFromN(m)+'給'+txToN(m)+'的訊息：')+m.txt,x:m.x,y:m.y};}

/* ---------- 部隊回報：狀態改變時報給自己的司令部（玩家指揮的部隊才回報） ---------- */
var RPC={con:'接敵',cas:'傷亡',mor:'士氣',sup:'補給',ord:'命令',gas:'毒氣',enc:'包圍',ff:'誤擊',mov:'機動'};
function repTop(u){var S=SD(u.side);if(S.ai&&S.pu>0){var P=uById(S.pu);if(P&&alive(P)&&inTree(u,S.pu))return P;}if(tmOn(u.side)){var c=cmTop(u.side,cmOf(u));if(c)return c;}return sideCmd(u.side);}
/* 沿一串單位（寄件者 → 收件者）推算送達時間與各段傳令路程；回報與敵情回報一樣快（各段約八成時間）；不動用亂數，回報不影響戰鬥 */
function txRoute(ch,t0){var M=G.set.delayMul===undefined?1:G.set.delayMul,t=t0,lg=[],via=[];for(var i=1;i<ch.length;i++){var a=ch[i-1],b=ch[i],h=hopDelay(a,b,true),sec=h.sec*0.8;if(h.via==='courier'&&sec>0)lg.push(crLeg(a,b,t,sec,commEra(a,b),h));
    t+=sec+(i<ch.length-1?uEra(b).relay*60*M*0.8:0);via.push(h.via);if(b.hqLost&&b.hqRe>t)t=b.hqRe;}return {t:t,lg:lg,via:via};}
function txId(){return (G.txid=(G.txid||0)+1);}
function repSend(u,txt,pri,cat){var top=repTop(u);if(!top)return null;var ch=top.id===u.id?[u]:chainTo(top,u).reverse(),R=txRoute(ch,G.t);
  var m={id:txId(),k:'rep',side:u.side,rs:u.side,tc:tmOn(u.side)?cmOf(u):-1,fu:u.id,tu:top.id,txt:txt,pri:pri,cat:cat,t0:G.t,ta:R.t,via:R.via.length?R.via:['self'],st:'go',x:Math.round(u.x),y:Math.round(u.y)};if(R.lg.length)m.lg=R.lg;
  (G.tx=G.tx||[]).push(m);if(u._rs)u._rs.lt=G.t;return m;}
function repStep(){if(G.set.txRep===false)return;var t=G.t,cb=!!((G.cbx&&G.cbx.length)||G.cbgr);G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||u.side<0||u.side>=nSides()||u.irr||aiControls(u))return;var s=ST(u);if(s.dom==='air')return;
    var sf=strFrac(u),sb=sf>=0.75?3:sf>=0.5?2:sf>=0.25?1:0,uf=t-(u.uf||-1e9)<90,fd=t-(u.fired||-1e9)<90,o=u.ord,fq=fuelDep(u)?fuelQ(u):1,
      N={c:uf||fd?2:u._eid&&u._ed<2500?1:0,ms:u.ms,sb:sb,ab:u.ammo<10?0:u.ammo<30?1:2,fb:fq<0.05?0:fq<0.25?1:2,gs:cb&&gasAt(u.x,u.y)>0.02?1:0,en:u.encT&&t-u.encT<600?1:0,oid:o?o.oid:0,dn:o&&o.st==='done'?1:0},P=u._rs;
    N.lt=P?P.lt:-1e9;N.lc=P?P.lc:-1e9;u._rs=N;if(!P)return;/* 第一次只記下狀態 */var R=[];
    if(N.ms==='rout'&&P.ms!=='rout')R.push(['部隊潰散！',1,'mor']);else if(N.ms==='shaken'&&P.ms==='ok')R.push(['士氣動搖',2,'mor']);else if(N.ms!=='rout'&&P.ms==='rout')R.push(['部隊已重新集結',2,'mor']);
    if(N.sb<P.sb)R.push([(sb>=2?'出現傷亡':sb===1?'傷亡慘重':'幾乎全軍覆沒')+'，兵力剩約 '+Math.max(1,Math.round(sf*10))+' 成',sb>=2?2:1,'cas']);
    if(N.c===2&&P.c<2&&t-P.lc>900){R.push([uf&&!fd?'遭到攻擊！':'與敵軍交火',1,'con']);N.lc=t;}else if(N.c===1&&P.c===0&&t-P.lc>900){R.push(['發現敵軍',2,'con']);N.lc=t;}
    if(N.ab<P.ab)R.push([N.ab===0?'彈藥即將耗盡！':'彈藥不足',N.ab===0?1:2,'sup']);if(N.fb<P.fb)R.push([N.fb===0?'燃料耗盡，無法機動！':'燃料不足',N.fb===0?1:2,'sup']);
    if(N.gs&&!P.gs)R.push(['毒氣！全員戴上防毒面具',1,'gas']);if(N.en&&!P.en)R.push(['我部已被包圍！',1,'enc']);
    if(N.oid&&N.oid!==P.oid&&o.st==='exec'&&!/^(twd|gas|rot|eager|refuse|waitx|rejoin)$/.test(o.dk||o.k))R.push(['收到命令：'+ordN(o),3,'ord']);
    else if(N.dn&&!P.dn&&N.oid===P.oid&&o)R.push([/^(move|withdraw|delay|reserve)$/.test(o.dk||o.k)?'已抵達指定位置':'任務完成：'+ordN(o),3,'ord']);
    if(!R.length)return;R.sort(function(a,b){return a[1]-b[1];});var pri=R[0][1];if(pri===2&&t-P.lt<180||pri===3&&t-P.lt<120)return;
    repSend(u,R.filter(function(r){return r[1]===pri;}).slice(0,2).map(function(r){return r[0];}).join('，'),pri,R[0][2]);});}
/* 自行後撤與友軍誤擊由紀錄轉成回報 */
(function(){var b=logE;logE=function(side,k,txt,x,y,uid){var e=b.apply(this,arguments);if((k==='twd'||k==='ff')&&uid&&G.started&&G.set.txRep!==false&&!(typeof mpActive==='function'&&mpActive())){var u=uById(uid);if(u&&isLeaf(u)&&onMap(u)&&u.side===side&&!aiControls(u))repSend(u,k==='ff'?'誤擊！停止射擊！':'壓力過大，後撤中',k==='ff'?1:2,k==='ff'?'ff':'mov');}return e;};})();

/* ---------- 指揮官的訊息：本方指揮官之間、對敵軍 ---------- */
function txHQ(side,fc){var S=SD(side);if(tmOn(side))return cmTop(side,fc>=0?fc:0);if(S.ai&&S.pu>0){var P=uById(S.pu);if(P&&alive(P))return P;}return sideCmd(side);}
/* 加密要花時間：人工密碼本約 3 分鐘，自動加密機約 30 秒，數位網路不另計 */
function encT(E,v){return v==='digital'?0:E.y<1970?180:30;}
/* 兩個司令部之間可用的方式與時間（不動用亂數；供下令前預估） */
function txWays(A,T){var E=commEra(A,T),M=G.set.delayMul===undefined?1:G.set.delayMul,km=dist(A.x,A.y,T.x,T.y)/1000,Q=commQ(A,T,E),W=[],side=A.side,own=side>=0&&side<nSides()&&T.side===side;if(Q.E)E=Q.E;
  if(E.dig&&Q.ok)W.push({v:'digital',sec:(E.radio||1.5)*60*Q.s*M});
  if(E.radio&&Q.ok){var rr=(E.rr||0)*Math.pow(2,clamp(Math.max(A.ech||1,T.ech||1)-1,0,4))*Q.r;if(km<=rr)W.push({v:'radio',sec:E.radio*60*Q.s*M});else if(own&&comBridge(side,A,T,Math.max(15,(E.rr||6)*2)*1000))W.push({v:'relay',sec:(E.radio*2+(E.relay||4))*60*M});}
  if(E.wire&&(km<=25&&stillFor(A)>3600&&stillFor(T)>3600||own&&comBridge(side,A,T,25000,1800)))W.push({v:'wire',sec:5*60*M});
  var rider=own&&(comNear(side,A.x,A.y,12000)||comNear(side,T.x,T.y,12000));W.push({v:'courier',sec:(E.find*60+km/(E.cour*0.75)*3600)*M*(rider?0.62:1),kind:crKind(E),rider:rider?1:0});return W;}
function txPick(A,T,via,enc){var E=commEra(A,T),best=null;txWays(A,T).forEach(function(w){if(via&&via!=='auto'&&via!==w.v&&!(via==='radio'&&(w.v==='relay'||w.v==='digital')))return;var s=w.sec+(enc&&w.v!=='courier'&&w.v!=='wire'?encT(E,w.v):0);if(!best||s<best.sec)best={v:w.v,sec:s,kind:w.kind,rider:w.rider};});
  return best||{err:via==='radio'?'兩地之間無法以無線電聯絡（這個年代沒有無線電，或超出距離）':via==='wire'?'兩地之間沒有電報或電話線（兩個司令部都要停留一小時以上，或由通信單位架線）':'無法傳遞'};}
function txMake(k,side,rs,fc,tc,A,T,w,enc,txt,x,y,rp,lg){var m={id:txId(),k:k,side:side,rs:rs,fc:fc,tc:tc,fu:A.id,tu:T?T.id:0,via:[w.v],enc:enc?1:0,txt:txt,t0:G.t,ta:G.t+w.sec,st:'go'};if(x!==undefined&&y!==undefined){m.x=Math.round(x);m.y=Math.round(y);}if(rp)m.rp=rp;
  if(lg)m.lg=lg;else if(w.v==='courier'&&w.sec>0&&T)m.lg=[crLeg(A,T,G.t,w.sec,commEra(A,T),w,w.kind)];(G.tx=G.tx||[]).push(m);if(k!=='en'&&w.v!=='courier'&&w.v!=='wire')txListen(m,A,T);return m;}
/* 無線電截收：明碼被 15 公里內有無線電的敵軍或 40 公里內的電子偵測單位聽到；密碼只被電子偵測單位測出大約的發訊位置 */
function txListen(m,A,T){(nSides()<3?[1-m.side]:hostSides(m.side)).forEach(function(es){txListen1(m,A,T,es);});}
function txListen1(m,A,T,es){if(!(es>=0&&es<nSides()))return;var hit=null,ew=null;[A,T].forEach(function(P){if(!P||P.side!==m.side)return;gridNearS(P.x,P.y,40000,es,function(e){if(e.side!==es||!onMap(e))return;var d=dist(e.x,e.y,P.x,P.y);if(d>=40000)return;if(!ew&&(utHasU(e,'E')||ST(e).br==='ew'))ew=e;if(!hit&&!m.enc&&d<15000&&uEra(e).radio>0)hit=e;});});
  if(!m.enc&&(hit||ew)){var by=hit||ew;ibAdd(es,{k:'icpt',txt:uName(by)+'截收'+G.sides[m.side].name+'的明碼'+viaN(m.via[0])+'通訊：「'+m.txt+'」',x:m.x,y:m.y,by:by.id});m.heard=1;if(G.onPause&&apOn('intel'))G.onPause('截收敵軍明碼通訊');}
  else if(m.enc&&ew&&A.side===m.side){var r=mb32(hstr('df|'+m.id)),px=A.x+(r()-0.5)*3000,py=A.y+(r()-0.5)*3000;ibAdd(es,{k:'det',txt:uName(ew)+'測得'+G.sides[m.side].name+'一個司令部的加密無線電通訊，約在'+placeTxt(px,py),x:Math.round(px),y:Math.round(py),by:ew.id});
    if(G.rq&&G.rq[es])G.rq[es].push({at:G.t+reportDelay(ew),id:A.id,x:px,y:py,t:G.t,q:0.5,by:ew.id});}}
/* 發訊：to＝指揮官編號、'all'（本方其他指揮官）或 'en'（敵軍）；via＝auto（最快）、radio、wire、courier */
function txSend(side,fc,to,via,enc,txt,x,y,rp){if(!(side>=0&&side<nSides()))return {err:'只能以本方的名義發訊。'};txt=String(txt||'').replace(/\s+/g,' ').trim().slice(0,300);if(!txt)return {err:'訊息是空的。'};
  var A=txHQ(side,fc);if(!A||!alive(A))return {err:'找不到發訊的司令部。'};if(!(isFinite(x)&&isFinite(y)&&x!==null&&y!==null)){x=undefined;y=undefined;}else{x=+x;y=+y;}via=via||'auto';
  if(to==='en'||/^en[0-9]$/.test(String(to)))return txEnemy(side,fc,A,via,txt,x,y,rp,to==='en'?-1:+String(to).slice(2));var L=tmOn(side)?cmList(side):null,tg=[];
  if(to==='all'){if(L)L.forEach(function(R,j){if(j!==fc&&cmAlive(side,j))tg.push(j);});}else if(L&&L[+to]&&+to!==fc)tg.push(+to);if(!tg.length)return {err:L?'找不到收件的指揮官。':'本方只有一位指揮官，可以改向敵軍發訊。'};
  var out=[],err='';tg.forEach(function(j){var T=cmTop(side,j);if(!T)return;var w=txPick(A,T,via,enc);if(w.err){err=w.err;return;}out.push(txMake('msg',side,side,fc,j,A,T,w,enc,txt,x,y,rp));});
  if(!out.length)return {err:err||'無法送出。'};logE(side,'tx','（'+viaN(out[0].via[0],out[0].lg)+(enc?'・密':'・明')+'）'+txFromN(out[0])+' → '+(to==='all'?'全體友軍':txToN(out[0]))+'：'+txt+'（約 '+durTxt(out[0].ta-G.t)+' 後送達）',A.x,A.y,A.id);
  return {ok:1,id:out[0].id,sec:out[0].ta-G.t,via:out[0].via[0],msg:'訊息已送出：經'+viaN(out[0].via[0],out[0].lg)+'，約 '+durTxt(out[0].ta-G.t)+' 後送達'};}
/* 對敵：明碼無線電（雙方都有無線電的年代），或派打白旗的軍使走到最近的敵軍部隊，再由對方轉呈司令部 */
function txEnemy(side,fc,A,via,txt,x,y,rp,es){es=es>=0&&es!==side&&es<nSides()?es:enemyOf(side);var T=sideCmd(es);if(!T)return {err:'找不到敵軍。'};var E=commEra(A,T),M=G.set.delayMul===undefined?1:G.set.delayMul,radio=uEra(A).radio>0&&uEra(T).radio>0,m;
  if(via==='wire')return {err:'沒有通往敵軍的電報或電話線。'};if(via==='radio'&&!radio)return {err:'這個年代還沒有無線電，只能派軍使。'};
  if(radio&&via!=='courier')m=txMake('en',side,es,fc,-1,A,T,{v:'radio',sec:(E.radio+1)*60*M},0,txt,x,y,rp);
  else{var F=null,bd=1e18;G.units.forEach(function(u){if(u.side!==es||!isLeaf(u)||!onMap(u)||uDom(u)!=='land')return;var d=dist(u.x,u.y,A.x,A.y);if(d<bd){bd=d;F=u;}});if(!F)return {err:'找不到可以接收軍使的敵軍部隊。'};
    var sec=(E.find*60+bd/1000/(Math.min(E.cour,15)*0.75)*3600+1800)*M,leg=crLeg(A,F,G.t,sec,E,null,'flag');m=txMake('en',side,es,fc,-1,A,T,{v:'courier',sec:sec+reportDelay(F)},0,txt,x,y,rp,[leg]);m.fwd=F.id;}
  logE(side,'tx','（'+(m.lg?'軍使':'明碼無線電')+'）'+txFromN(m)+' → '+G.sides[es].name+'：'+txt+'（約 '+durTxt(m.ta-G.t)+' 後送達）',A.x,A.y,A.id);return {ok:1,id:m.id,sec:m.ta-G.t,via:m.via[0],msg:(m.lg?'軍使已出發':'訊息已以明碼無線電送出')+'，約 '+durTxt(m.ta-G.t)+' 後送到'+G.sides[es].name+'司令部'};}
function txFromN(m){if(tmOn(m.side)&&m.fc>=0){var R=cmList(m.side)[m.fc];if(R)return R.n;}var u=uById(m.fu);return u?uName(u):G.sides[m.side].name;}
function txToN(m){if(m.k==='en')return G.sides[m.rs].name;if(tmOn(m.side)&&m.tc>=0){var R=cmList(m.side)[m.tc];if(R)return R.n;}var u=uById(m.tu);return u?uName(u):'';}
/* 送達與 AI 的回覆 */
function txStep(){var L=G.tx,t=G.t;if(L&&L.length)for(var i=0;i<L.length;i++){var m=L[i];if(m.st!=='go'||t<m.ta)continue;
    if(m.lost){m.st='lost';if(m.k!=='rep')logE(m.side,'tx',m.k==='en'?(m.fwd?'派往敵軍的軍使沒有回來':'給敵軍的訊息沒有回應'):'給'+txToN(m)+'的訊息沒有送達（傳令兵可能遭敵截獲）');continue;}
    if(m.k==='en'&&m.fwd&&polSide(m.rs).pow>=4&&rndT()<0.25){m.st='lost';m.lost=1;logE(m.side,'tx','派往敵軍的軍使沒有回來');logE(m.rs,'crime','我軍部隊射殺了'+G.sides[m.side].name+'打白旗的軍使（違反戰爭法）');continue;}
    m.st='ok';m.td=t;txDeliver(m);}
  var Q=G.txq;if(Q&&Q.length){var due=Q.filter(function(q){return t>=q.t;});if(due.length){G.txq=Q.filter(function(q){return t<q.t;});due.forEach(function(q){txSend(q.side,q.fc,q.to,'auto',q.to!=='en',q.txt,undefined,undefined,q.rp);});}}
  if(G.step%20===5)txPrune();}
function txDeliver(m){if(m.k==='rep')return;var S=G.sides;
  if(m.k==='msg'){var R=cmList(m.side)[m.tc];logE(m.side,'tx',(R?R.n:'')+'收到'+txFromN(m)+'的訊息：'+m.txt);if(R&&R.ai)(G.txq=G.txq||[]).push({t:G.t+300+rndT()*600,side:m.side,fc:m.tc,to:m.fc,txt:txAiTxt(m.side,m,false),rp:m.id});return;}
  if(m.k==='en'){var es=m.rs;ibAdd(es,{k:'enmsg',txt:m.txt,fs:m.side,via:m.via[0],fl:m.fwd?1:0,tm:m.id,x:m.x,y:m.y});logE(es,'tx','收到'+S[m.side].name+(m.fwd?'軍使送來':'以明碼無線電發來')+'的訊息：「'+m.txt+'」');
    if(G.onPause&&apOn('enmsg'))G.onPause('收到敵軍的訊息');var T=sideCmd(es);if(T&&aiControls(T))(G.txq=G.txq||[]).push({t:G.t+600+rndT()*1200,side:es,fc:-1,to:'en',txt:txAiTxt(es,m,true),rp:m.id});}}
/* AI 的回覆依個性與處境（不牽動任何實際的停火或投降） */
function txAiTxt(s,m,en){var t=m.txt||'',F=sideCmd(s),P=F?aiOf(F):null,pt=P&&P.t||'',f=sideStr(s).f,pick=function(L){return L[Math.floor(rndT()*L.length)];};
  if(!en)return f<0.4?'收到。我部傷亡慘重，恐怕無力配合。':pick(['收到，照辦。','收到，會依計畫行動。','收到。']);
  if(/投降|繳械|放下武器|降服/.test(t))return f<0.3?'我方傷亡慘重，貴方的提議將轉呈上級考慮。':pt==='reck'?'我軍絕不投降，戰鬥到底。':'拒絕。我軍將堅守陣地。';
  if(/停火|休戰|傷患|傷兵|遺體|收屍/.test(t))return pt==='reck'?'拒絕。':'原則上同意雙方收容傷患，但不保證前線停止射擊。';
  if(/戰俘|俘虜|交換/.test(t))return '戰俘問題須由上級決定，我方會依戰爭法規處置被俘人員。';return pick(['已收到貴方的訊息。','訊息已轉呈司令部。','貴方的訊息已收到，暫無答覆。']);}
/* 只留：傳遞中的、三小時內的回報（每方最多 150 則）、最近的訊息（每方最多 120 則） */
function txPrune(){var L=G.tx;if(!L||L.length<120)return;var n={},keep=[];for(var i=L.length-1;i>=0;i--){var m=L[i];if(m.st==='go'){keep.push(m);continue;}var k=m.side+m.k,c=n[k]||0;
    if(m.k==='rep'?G.t-(m.td||m.t0)<3*3600&&c<150:c<120){n[k]=c+1;keep.push(m);}}G.tx=keep.reverse();}
(function(){var b=v8Step;v8Step=function(){b.apply(this,arguments);if(!G.started||G.replay)return;txStep();if(G.step%2===1){crStep();repStep();}};})();
if(typeof GKEYS!=='undefined')GKEYS.push('tx','txq','txid');
APDEF.intel=false;APDEF.enmsg=true;
/* ---------- 聯機：發訊、本方的通信紀錄、看得見的敵軍傳令（只有位置與種類） ---------- */
function crView(s,O){var out=[],t=G.t;crEach(function(m,src,side){if(side===s)return;var L=crAct(m,t);if(!L)return;var p=crPos(L,t);if(!mpSeen(O,p[0],p[1]))return;
  out.push({id:m.id*8+(src==='m'?1:src==='t'?2+side:5),side:side,k:L.k,x0:L.x0,y0:L.y0,x1:L.x1,y1:L.y1,t0:L.t0,t1:L.t1,f:L.f});});return out;}
if(typeof MPFN!=='undefined'){MPFN.txSend=[function(s,cm,a){return a[0]===s&&(cm<0||+a[1]===cm||!tmOn(s))?'':'只能以自己的名義發訊。';},function(a){return txSend(a[0],+a[1],a[2],String(a[3]||'auto'),!!a[4],String(a[5]||''),a[6],a[7],+a[8]||0);}];
  MPCOL.push(['tx','id',function(s){return (G.tx||[]).filter(function(m){return s<0||m.side===s;});}],['cv','id',function(s,O){return s<0?[]:crView(s,O);}]);
  MPCC.tx=function(){return G.tx||(G.tx=[]);};MPCC.cv=function(){return G.cv||(G.cv=[]);};MPKEY.tx='id';MPKEY.cv='id';}
