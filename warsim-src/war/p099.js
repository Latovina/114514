/* ===================== 通信（介面）：收件匣分類、發訊、兵牌上方的回報對話框、地圖上的傳令兵與攔截 ===================== */
(function(){var st=document.createElement('style');st.textContent='.lw-ibc{display:flex;flex-wrap:wrap;gap:3px;margin:0 0 6px}.lw-ibc button{font-size:12px;padding:2px 8px;border:1px solid #bbb;border-radius:12px;background:#fff;cursor:pointer}.lw-ibc button.on{background:#1f2a36;color:#fff;border-color:#1f2a36}.lw-ibc b{font-size:10.5px;color:#b3261e;margin-left:3px}.lw-ibc button.on b{color:#ffcdd2}'+
  '.lw-txr{border-bottom:1px solid #eee;padding:3px 2px;font-size:12.5px;line-height:1.45}.lw-txr .t{color:#777;font-size:11px;margin-right:4px}.lw-txr .v{color:#888;font-size:11px;margin-left:4px}.lw-txr.p1 .x{color:#b3261e;font-weight:600}.lw-txr.p3 .x{color:#555}.lw-txr a{cursor:pointer;text-decoration:underline;margin-right:4px}'+
  '.lw-txc{border:1px solid #d6d2c8;border-radius:8px;padding:6px;margin:0 0 8px;background:#faf8f3;font-size:12.5px}.lw-txc textarea{width:100%;min-height:42px;box-sizing:border-box;font:inherit;font-size:13px;margin:4px 0}.lw-txc .lw-row{gap:4px;flex-wrap:wrap;align-items:center;margin:0}.lw-txc select{max-width:100%}'+
  '.lw-mpchat .lw-txc{border:0;border-top:1px solid #eee;border-radius:0;margin:0;background:none}.lw-mpchat .lw-txr{font-size:12px}.lw-ibh{font-size:11.5px;color:#666;margin:6px 0 2px;font-weight:600}';document.head.appendChild(st);})();
/* 我（這個畫面）指揮的指揮官席位 */
function myCms(side){if(typeof mpActive==='function'&&mpActive())return [MPS.cm>=0?MPS.cm:0];return cmMe(side);}
/* 多位指揮官時，回報只給收件的指揮官看 */
function txMine(m){var me=mySide();if(me!==null&&m.side!==me)return false;if(m.k==='rep'&&m.tc>=0&&tmOn(m.side))return myCms(m.side).indexOf(m.tc)>=0;return true;}
function hhmm(t){return tTxt(t).slice(-5);}
/* ---------- 收件匣 ---------- */
var IBC=[['all','全部'],['rep','報告'],['ord','命令'],['req','請求'],['msg','通信'],['en','敵方'],['pl','玩家']];
var IBS={cat:'all',seen:{}},TXS={to:'',via:'auto',enc:true,pt:null,rp:0,txt:''};
/* 各分類的項目：{t 時間, c 分類, h 內容} */
function ibItems(){var me=mySide(),out=[],ib=(G.inbox||[]).filter(function(m){return me===null||m.side===me;});
  ib.forEach(function(m){var c=/^(icpt|det|enmsg)$/.test(m.k)?'en':m.k==='dir'?'ord':m.tm&&cmHuman(m.side,m.tm.from)?'pl':'req';out.push({t:m.t,c:c,h:ibItemHtml(m),m:m});});
  (G.tx||[]).forEach(function(m){if(!txMine(m))return;if(m.k==='rep'){if(m.st==='ok')out.push({t:m.td,c:'rep',h:repHtml(m)});return;}out.push({t:m.st==='ok'?m.td:m.t0,c:m.k==='en'?'en':'msg',h:txItemHtml(m)});});
  return out.sort(function(a,b){return b.t-a.t;});}
function cmHuman(side,i){var R=cmList(side)[i];return !!(R&&!R.ai);}
function inboxHtml(){var me=mySide(),L=ibItems(),n={},cat=IBS.cat,o='';L.forEach(function(q){if(q.t>(IBS.seen[q.c]||-1)&&(!q.m||!q.m.done)){n[q.c]=(n[q.c]||0)+1;n.all=(n.all||0)+1;}});
  var pl=typeof cmxRqHtml==='function'?cmxRqHtml():'';if(pl)n.pl=(n.pl||0)+(pl.match(/lw-cmxrq/g)||[]).length;
  o+='<div class="lw-ibc">'+IBC.map(function(c){return '<button type="button" data-a="ibcat" data-v="'+c[0]+'" class="'+(cat===c[0]?'on':'')+'">'+c[1]+(n[c[0]]&&cat!==c[0]?'<b>'+n[c[0]]+'</b>':'')+'</button>';}).join('')+'</div>';
  if(cat==='msg'||cat==='en')o+=txComposeHtml(cat);
  if(cat==='ord'||cat==='all'){var tr=ordTransit();if(tr)o+='<div class="lw-ibh">傳遞中的命令</div>'+tr;}
  if(cat==='pl'||cat==='all'&&pl)o+=pl;
  var V=L.filter(function(q){return cat==='all'||q.c===cat;}).slice(0,cat==='all'?80:120);IBS.seen[cat]=G.t;if(cat==='all')IBC.forEach(function(c){IBS.seen[c[0]]=G.t;});
  /* 看過的截獲、測向與敵軍來訊算已讀 */if(cat==='en'||cat==='all')V.forEach(function(q){if(q.m&&/^(icpt|det|enmsg)$/.test(q.m.k)&&!q.m.done)q.m.done='已讀';});
  if(!V.length&&!(cat==='pl'&&pl))o+='<div class="lw-note">'+({all:'還沒有任何訊息。',rep:'還沒有部隊回報。玩家指揮的部隊遇到接敵、傷亡、士氣動搖、彈藥不足、毒氣、被包圍，以及收到和完成命令時，會以無線電或傳令回報。',ord:'沒有上級的指令。玩家只扮演某一梯隊時，上級 AI 的指令會出現在這裡。',req:'沒有待處理的請求。',msg:tmOn(me===null?0:me)?'還沒有和友軍指揮官的通信。':'本方只有一位指揮官；可以在「敵方」分頁向敵軍發訊。',en:'還沒有敵方的訊息，也還沒有截獲任何東西。',pl:'沒有隊友的請求。'})[cat]+'</div>';
  return o+V.map(function(q){return q.h;}).join('');}
ACT.ibcat=function(b){IBS.cat=b.getAttribute('data-v');btLeft(true);};
/* 收件匣中的請求、指令、遭遇戰、截獲與敵軍來訊 */
function ibItemHtml(m){var f=uById(m.from),done=m.done,lbl={dir:'<b>指令</b> ',req:'<b>請求</b> ',meet:'<b style="color:#b71c1c">遭遇戰</b> ',rep:'<b>回覆</b> ',icpt:'<b style="color:#6a1b9a">截獲</b> ',det:'<b style="color:#6a1b9a">測向</b> ',enmsg:'<b style="color:#b71c1c">敵軍來訊</b> '}[m.k]||'';
  var info=/^(icpt|det|enmsg)$/.test(m.k),o='<div class="lw-msg'+(done&&!info?' done':'')+'"><div><span class="t">'+hhmm(m.t)+'</span>'+lbl+(m.k==='enmsg'?'（'+esc(G.sides[m.fs]?G.sides[m.fs].name:'')+'，'+(m.fl?'軍使':'明碼無線電')+'）「'+esc(m.txt)+'」':esc(m.txt))+
    (f&&m.k==='dir'?'<span class="lw-note">（'+esc(uName(f))+(aiControls(f)?'，'+esc(aiName(f)):'')+'）</span>':f&&m.k==='req'&&aiControls(f)?'<span class="lw-note">（'+esc(aiName(f))+'）</span>':'')+'</div>';
  var map=m.x!==undefined?'<button type="button" class="lw-btn sm" data-a="ibmap" data-v="'+m.id+'">地圖</button>':'';
  if(info)return o+'<div class="lw-row">'+(m.k==='enmsg'?'<button type="button" class="lw-btn sm" data-a="txrp" data-v="en" data-r="'+(m.tm||0)+'">回覆</button>':'')+map+'</div></div>';
  if(done)return o+'<div class="lw-note">'+esc(done)+'</div></div>';
  if(m.k==='meet')return o+'<div class="lw-row"><button type="button" class="lw-btn sm pri" data-a="mtgo" data-k="attack" data-v="'+m.id+'">進攻</button><button type="button" class="lw-btn sm" data-a="mtgo" data-k="hold" data-v="'+m.id+'">駐紮</button>'+map+'</div></div>';
  if(m.k==='rep')return o+'<div class="lw-row"><button type="button" class="lw-btn sm" data-a="ibok" data-v="'+m.id+'">知道了</button></div></div>';
  return o+'<div class="lw-row"><button type="button" class="lw-btn sm pri" data-a="ibok" data-v="'+m.id+'">'+(m.k==='dir'?'遵照執行':'同意')+'</button><button type="button" class="lw-btn sm" data-a="ibno" data-v="'+m.id+'">拒絕</button>'+map+'</div></div>';}
/* 部隊回報一行 */
function repHtml(m){var u=uById(m.fu);return '<div class="lw-txr p'+(m.pri||2)+'"><span class="t">'+hhmm(m.td||m.ta)+'</span>'+(u?'<a class="cl" data-a="bsel" data-id="'+u.id+'">'+esc(uName(u))+'</a>':'')+'<span class="x">'+esc(m.txt)+'</span><span class="v">（'+txVia(m)+'）</span></div>';}
function txVia(m){var v=m.via||[],c=v.filter(function(x){return x==='courier';}).length,s=v.length&&v[0]==='self'?'當面':viaN(c?'courier':v[v.length-1],m.lg);return s+(m.td&&m.td>m.t0+90?'，費時 '+durTxt(m.td-m.t0):'');}
/* 指揮官之間與對敵的訊息 */
function txItemHtml(m){var me=mySide(),out=m.side===me||me===null&&true,mine=out&&(m.fc<0||myCms(m.side).indexOf(m.fc)>=0),st=m.st==='go'?'傳遞中，約 '+durTxt(Math.max(0,m.ta-G.t))+' 後送達':m.st==='lost'?(m.k==='en'&&m.fwd?'軍使沒有回來':'沒有送達'):'已送達';
  return '<div class="lw-msg"><div><span class="t">'+hhmm(m.t0)+'</span><b>'+esc(txFromN(m))+' → '+esc(m.k==='en'?G.sides[m.rs].name:txToN(m))+'</b>（'+viaN(m.via[0],m.lg)+(m.k==='en'||m.via[0]==='courier'||m.via[0]==='wire'?'':m.enc?'・密碼':'・明碼')+'）'+esc(m.txt)+
    (m.x!==undefined?' <a class="cl" data-a="txgo" data-v="'+m.x+','+m.y+'">📍'+esc(placeTxt(m.x,m.y))+'</a>':'')+'<div class="lw-note">'+(mine?st:'')+(m.heard?'；明碼可能已被敵軍截收':'')+'</div></div>'+
    (!mine&&m.k==='msg'&&m.fc>=0?'<div class="lw-row"><button type="button" class="lw-btn sm" data-a="txrp" data-v="'+m.fc+'" data-r="'+m.id+'">回覆</button></div>':'')+'</div>';}
/* 傳遞中的命令（本方最高司令部送出、還沒送到的） */
function ordTransit(){var me=mySide();return (G.msgs||[]).filter(function(m){return m.k==='order'&&(me===null||m.side===me)&&!(m.o&&m.o.sub)&&uById(m.to);}).slice(-12).map(function(m){var u=uById(m.to),L=m.lg&&crAct(m,G.t);
    return '<div class="lw-txr"><span class="t">'+hhmm(m.t0)+'</span>✉ 「'+esc(ordN(m.o))+'」→ <a class="cl" data-a="bsel" data-id="'+u.id+'">'+esc(uName(u))+'</a><span class="v">（'+m.via.map(function(v){return viaN(v,m.lg);}).join('→')+'，'+(m.lost&&G.t>=m.ta?'未獲回音，將重新派遣':m.ta>G.t?'約 '+durTxt(m.ta-G.t)+' 後送達':'即將送達')+(L?'，<a class="cl" data-a="crshow" data-v="'+crKey(m,'m',m.side)+'">看傳令兵</a>':'')+'）</span></div>';}).join('');}
ACT.txgo=function(b){var p=b.getAttribute('data-v').split(',');vCenter(+p[0],+p[1],1.5);};
/* ---------- 發訊 ---------- */
function txViaOpts(side,en){var E=uEra(sideCmd(side)||{side:side,era:'e1940'}),k=crKind(E);if(en)return [['auto','自動'],['radio','明碼無線電'],['courier','軍使（白旗）']];
  return [['auto','自動（最快）'],['radio','無線電'],['wire',G.set.y<1905?'電報':'電話'],['courier',CRK[k][0]]];}
function txRecips(side){var o=[];if(!tmOn(side))return o;var L=cmList(side),mine=myCms(side);L.forEach(function(R,j){if(mine.indexOf(j)<0&&cmAlive(side,j))o.push([String(j),R.n+(R.ai?'（AI）':'')]);});if(o.length>1)o.unshift(['all','全體友軍指揮官']);return o;}
/* 向其他陣營發訊的收件人：兩方時就是「敵軍」，三方時列出另外兩方 */
function txEnR(side){return nSides()<3?[['en','敵軍（明碼）']]:SIDES().filter(function(s){return s!==side;}).map(function(s){return ['en'+s,G.sides[s].name+'（明碼）'];});}
function txComposeHtml(mode){var side=mySide();if(side===null)return '<div class="lw-note">旁觀時不能發訊。</div>';var R=txRecips(side),en=mode==='en';
  if(mode==='box'){R=R.concat(txEnR(side));en=/^en/.test(TXS.to)||!R.length||R.length===1&&/^en/.test(R[0][0]);}else if(!en&&!R.length)return '';
  var to=en?(nSides()<3?'en':/^en[0-9]$/.test(TXS.to)&&+TXS.to.slice(2)!==side?TXS.to:'en'+enemyOf(side)):R.some(function(r){return r[0]===TXS.to;})?TXS.to:R[0][0],V=txViaOpts(side,en),via=V.some(function(q){return q[0]===TXS.via;})?TXS.via:'auto';
  return '<div class="lw-txc" data-m="'+mode+'"><div class="lw-row">'+(en&&mode!=='box'&&nSides()<3?'<b>致'+esc(G.sides[1-side].name)+'</b>':'<select data-k="txto" data-c="txto" title="收件人">'+(en&&mode!=='box'?txEnR(side):R).map(function(r){return '<option value="'+r[0]+'"'+(r[0]===to?' selected':'')+'>'+esc(r[1])+'</option>';}).join('')+'</select>')+
    '<select data-k="txvia" data-c="txvia" title="傳遞方式">'+V.map(function(q){return '<option value="'+q[0]+'"'+(q[0]===via?' selected':'')+'>'+q[1]+'</option>';}).join('')+'</select>'+
    (en?'':'<label title="加密要多花幾分鐘；明碼可能被附近的敵軍截收"><input type="checkbox" data-k="txenc" data-c="txenc"'+(TXS.enc?' checked':'')+'>加密</label>')+(TXS.rp?'<span class="lw-note">（回覆）</span>':'')+'</div>'+
    '<textarea data-k="txin" data-i="txin" maxlength="300" placeholder="'+(en?'給敵軍的訊息：例如要求投降、提議停火收容傷患':'訊息內容')+'">'+esc(TXS.txt)+'</textarea>'+
    '<div class="lw-row"><button type="button" class="lw-btn sm" data-a="txpt" title="附帶一個地圖位置：選取的部隊或敵情，否則點地圖">📍 '+(TXS.pt?esc(placeTxt(TXS.pt[0],TXS.pt[1])):'附加位置')+'</button>'+(TXS.pt?'<button type="button" class="lw-btn sm" data-a="txptx" title="取消位置">✕</button>':'')+'<span class="lw-note" data-k="txeta">'+esc(txEta(side,to,via,TXS.enc&&!en))+'</span><span class="lw-sp"></span><button type="button" class="lw-btn sm pri" data-a="txsend">送出</button></div></div>';}
/* 預估送達時間（單機版可完整估算；聯機時敵軍位置未知） */
function txEta(side,to,via,enc){try{var fc=myCms(side)[0],A=txHQ(side,fc===undefined?-1:fc);if(!A)return '找不到發訊的司令部';
  if(to==='en'){var E=uEra(A);if(via==='radio'||via==='auto'&&E.radio>0)return E.radio>0?'明碼無線電，約 '+durTxt((E.radio+1)*60)+' 送達':'這個年代沒有無線電，只能派軍使';return '軍使要走到敵軍陣地，再由對方轉呈，通常要一小時以上';}
  var T=to==='all'?cmTop(side,+txRecips(side).filter(function(r){return r[0]!=='all';})[0][0]):cmTop(side,+to);if(!T)return '';var w=txPick(A,T,via,enc);return w.err?w.err:'經'+viaN(w.v,w.kind?[{k:w.kind}]:null)+'，約 '+durTxt(w.sec)+' 送達';}catch(e){return '';}}
function txBoxRe(){var bx=document.querySelectorAll('.lw-txc');bx.forEach(function(b){var e=b.querySelector('[data-k="txeta"]'),to=b.querySelector('[data-k="txto"]'),via=b.querySelector('[data-k="txvia"]'),en=b.getAttribute('data-m')==='en'||to&&to.value==='en';if(e)e.textContent=txEta(mySide(),en?'en':to?to.value:'',via?via.value:'auto',TXS.enc&&!en);});}
CHG.txto=function(t){TXS.to=t.value;TXS.rp=0;txRefresh();};CHG.txvia=function(t){TXS.via=t.value;txBoxRe();};CHG.txenc=function(t){TXS.enc=t.checked;txBoxRe();};INP.txin=function(t){TXS.txt=t.value;};
function txRefresh(){if(UI.tab==='battle'&&BT.left==='inbox')btLeft(true);if(typeof mpChatRender==='function')try{mpChatRender(true);}catch(e){}}
ACT.txsend=function(b){var box=b.closest('.lw-txc');if(!box)return;var q=function(k){return box.querySelector('[data-k="'+k+'"]');},side=mySide();if(side===null){toast('旁觀時不能發訊。');return;}
  var en=box.getAttribute('data-m')==='en'||q('txto')&&q('txto').value==='en',to=en?'en':q('txto')?q('txto').value:'',via=q('txvia')?q('txvia').value:'auto',enc=!en&&!!(q('txenc')&&q('txenc').checked),txt=(q('txin')&&q('txin').value||'').trim();
  if(!txt){toast('請先輸入訊息內容。');return;}if(!to){toast('沒有收件人。');return;}var fc=myCms(side)[0];if(fc===undefined)fc=-1;var P=TXS.pt;
  if(typeof mpActive==='function'&&mpActive())mpRpc('txSend',[side,fc,to,via,enc,txt,P?P[0]:null,P?P[1]:null,TXS.rp||0]);
  else{var r=txSend(side,fc,to,via,enc,txt,P?P[0]:undefined,P?P[1]:undefined,TXS.rp||0);if(r.err){toast(r.err,4500);return;}toast(r.msg,3500);}
  TXS.txt='';TXS.pt=null;TXS.rp=0;var q2=q('txin');if(q2)q2.value='';if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();txRefresh();};
ACT.txrp=function(b){TXS.to=b.getAttribute('data-v');TXS.rp=+b.getAttribute('data-r')||0;IBS.cat=/^en/.test(TXS.to)?'en':'msg';if(UI.tab==='battle'){BT.left='inbox';btLeft(true);}txRefresh();var t=document.querySelector('.lw-txc textarea');if(t)t.focus();};
ACT.txpt=function(){var C=UI.selC&&mySide()!==null&&G.ct[mySide()]?G.ct[mySide()][UI.selC]:null,u=UI.sel.length?uById(UI.sel[0]):null;
  if(C){TXS.pt=[C.x,C.y];txRefresh();return;}if(u){var c=isLeaf(u)?[u.x,u.y]:cOf(u)||[u.x,u.y];TXS.pt=c;txRefresh();return;}UI.tool='txpt';modeBt();toast('點地圖選擇訊息附帶的位置。');};
ACT.txptx=function(){TXS.pt=null;txRefresh();};
(function(){var b=modeBt;modeBt=function(){if(UI.tool==='txpt'&&VW.mode){VW.mode.hidden=false;VW.mode.innerHTML='點選地圖指定訊息附帶的位置<button type="button" data-a="ordx">取消</button>';return;}return b.apply(this,arguments);};})();
(function(){var b=btClick;btClick=function(x,y,sx,sy,e){if(UI.tool==='txpt'){TXS.pt=[x,y];UI.tool='sel';modeBt();txRefresh();return;}
  /* 傳令兵常常騎到兵牌旁邊：點在信封上就選傳令兵 */if((UI.tool==='sel'||!UI.tool)&&G.started){var q=crHit(sx,sy,7);if(q){var me=mySide(),us=UI.sel.map(uById).filter(function(u){return u&&alive(u)&&(me===null||u.side===me);});if(us.length)UI.selPrev=us.map(function(u){return u.id;});
    UI.selX={k:'cr',id:q.id};UI.sel=[];UI.selC=0;UI.selB=0;btSel();btLeft(true);vDraw(false);return;}}return b.apply(this,arguments);};})();
function crHit(sx,sy,r){var best=null,bd=r;(VW.cr||[]).forEach(function(q){var d=dist(sx,sy,q.sx,q.sy);if(d<bd){bd=d;best=q;}});return best;}
/* 正在打字時不要重畫左欄 */
function txTyping(el){var a=document.activeElement;return !!(el&&a&&el.contains(a)&&a.closest('.lw-txc')&&/^(TEXTAREA|INPUT|SELECT)$/.test(a.tagName));}
(function(){var b=btLeft;btLeft=function(soft){if(BT.left==='inbox'&&txTyping(btEl('bl')))return;return b.apply(this,arguments);};})();
/* ---------- 兵牌上方的回報對話框 ---------- */
var BUB={L:[],seen:{},g:null,n:0};
function bubScan(){if(!G||!G.started||G.replay)return;var L=G.tx||[];if(BUB.g!==G){BUB.g=G;BUB.L=[];BUB.seen={};BUB.n=0;L.forEach(function(m){if(m.st!=='go')BUB.seen[m.id]=1;});return;}
  var mode=UIP.bub||'key',now=performance.now();for(var i=0;i<L.length;i++){var m=L[i];if(m.k!=='rep'||m.st!=='ok'||BUB.seen[m.id])continue;BUB.seen[m.id]=1;BUB.n++;if(!txMine(m)||mode==='off'||mode==='key'&&m.pri>2||G.t-(m.td||m.ta)>900)continue;BUB.L.push({u:m.fu,txt:m.txt,pri:m.pri||2,t0:now});}
  if(BUB.n>3000){BUB.seen={};L.forEach(function(m){BUB.seen[m.id]=1;});BUB.n=0;}var N=+UIP.bubN||4;if(BUB.L.length>N){BUB.L.sort(function(a,b){return a.pri-b.pri||b.t0-a.t0;});BUB.L=BUB.L.slice(0,N);}}
/* 對話框掛在畫面上代表該部隊的兵牌（部隊被併成上級兵牌時掛在上級兵牌上） */
function bubAt(id){var u=uById(id);if(!u)return null;var it=null;(VW.items||[]).forEach(function(q){if(it||q.sx===undefined||q.c)return;if(q.u&&q.u.id===id||q.grp&&q.grp.some(function(k){return k.id===id;})||q.agg&&q.L&&q.L.indexOf(u)>=0)it=q;});
  if(it)return [it.sx,it.sy,it.h||14];if(!onMap(u))return null;var p=w2s(u.x,u.y);return p[0]<-20||p[1]<-20||p[0]>VW.cw+20||p[1]>VW.ch+20?null:[p[0],p[1],14];}
function bubDraw(c){if(!BUB.L.length)return;var now=performance.now(),life=(+UIP.bubT||7)*1000;BUB.L=BUB.L.filter(function(b){return now-b.t0<life;});if(!BUB.L.length)return;c.save();c.font='12px sans-serif';c.textBaseline='middle';var boxes=[];
  BUB.L.forEach(function(b){var a=bubAt(b.u);if(!a)return;var t=b.txt.length>22?b.txt.slice(0,21)+'…':b.txt,w=c.measureText(t).width+14,h=20,x=clamp(a[0]-w/2,2,VW.cw-w-2),y=a[1]-a[2]/2-h-12;
    for(var k=0;k<5&&boxes.some(function(q){return x<q[2]&&x+w>q[0]&&y<q[3]&&y+h>q[1];});k++)y-=h+3;boxes.push([x,y,x+w,y+h]);var tx=clamp(a[0],x+8,x+w-8);
    c.globalAlpha=clamp((life-(now-b.t0))/700,0,1);c.beginPath();c.moveTo(x+6,y);c.lineTo(x+w-6,y);c.quadraticCurveTo(x+w,y,x+w,y+6);c.lineTo(x+w,y+h-6);c.quadraticCurveTo(x+w,y+h,x+w-6,y+h);c.lineTo(tx+5,y+h);c.lineTo(tx,y+h+7);c.lineTo(tx-5,y+h);c.lineTo(x+6,y+h);c.quadraticCurveTo(x,y+h,x,y+h-6);c.lineTo(x,y+6);c.quadraticCurveTo(x,y,x+6,y);c.closePath();
    c.fillStyle=b.pri===1?'#FFF3F1':'#FFFFFF';c.fill();c.lineWidth=b.pri===1?1.6:1;c.strokeStyle=b.pri===1?'#C62828':'#455A64';c.stroke();c.fillStyle=b.pri===1?'#8E1B1B':'#1B1B1B';c.fillText(t,x+7,y+h/2+0.5);});c.restore();}
/* ---------- 地圖上的傳令兵 ---------- */
function crSeen(x,y){var me=mySide(),s=false;if(me===null||seeAll())return true;gridNear(x,y,2500,function(u){if(!s&&u.side===me&&onMap(u)&&dist(u.x,u.y,x,y)<2500)s=true;});return s;}
/* 畫面上看得到的傳令兵：本方全部；敵方的只有本方部隊 2.5 公里內（聯機時由伺服器依視野送來） */
function crList(){var out=[],me=mySide(),t=G.t;crEach(function(m,src,side){var L=crAct(m,t);if(!L)return;var p=crPos(L,t);if(me!==null&&side!==me&&!crSeen(p[0],p[1]))return;out.push({id:crKey(m,src,side),m:m,src:src,side:side,L:L,x:p[0],y:p[1]});});
  (G.cv||[]).forEach(function(v){if(t<v.t0||t>=v.t1)return;var p=crPos(v,t);out.push({id:'v'+v.id,m:null,src:'v',side:v.side,L:v,x:p[0],y:p[1]});});return out;}
function crDraw(c){VW.cr=[];if(!G.started||UIP.crOn===0||!UI.lay.units)return;var L=crList();if(!L.length)return;var sel=UI.selX&&UI.selX.k==='cr'?UI.selX.id:null,f=clamp(0.75+VW.s*0.08,0.8,1.25);c.save();
  L.forEach(function(q){var p=w2s(q.x,q.y);if(p[0]<-20||p[1]<-20||p[0]>VW.cw+20||p[1]>VW.ch+20)return;q.sx=p[0];q.sy=p[1];VW.cr.push(q);var col=sideCol(q.side);
    if(q.id===sel&&q.m){var e=w2s(q.L.x1,q.L.y1);c.setLineDash([4,4]);c.strokeStyle=col;c.lineWidth=1.5;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(e[0],e[1]);c.stroke();c.setLineDash([]);}
    c.save();c.translate(p[0],p[1]);if(q.L.k==='flag'){c.strokeStyle='#263238';c.lineWidth=1.4;c.beginPath();c.moveTo(-3*f,6*f);c.lineTo(-3*f,-7*f);c.stroke();c.fillStyle='#FFFFFF';c.beginPath();c.moveTo(-3*f,-7*f);c.lineTo(6*f,-4.5*f);c.lineTo(-3*f,-2*f);c.closePath();c.fill();c.stroke();}
    else{c.fillStyle=col;c.strokeStyle='rgba(15,15,20,.9)';c.lineWidth=1;c.beginPath();c.rect(-6*f,-4*f,12*f,8*f);c.fill();c.stroke();c.strokeStyle='#FFFFFF';c.lineWidth=1.1;c.beginPath();c.moveTo(-5*f,-3*f);c.lineTo(0,1*f);c.lineTo(5*f,-3*f);c.stroke();}
    if(q.id===sel){c.strokeStyle='#FFC107';c.lineWidth=2;c.setLineDash([3,2]);c.beginPath();c.arc(0,0,11,0,2*PI);c.stroke();c.setLineDash([]);}c.restore();});c.restore();}
(function(){var b=drawTop;drawTop=function(){b.apply(this,arguments);try{if(!G||!G.map||!VW.ct)return;var c=VW.ct.getContext('2d'),d=VW.dpr;c.setTransform(d,0,0,d,0,0);crDraw(c);bubScan();if(UI.tab==='battle')bubDraw(c);}catch(e){if(window.console)console.warn('tx',e);}};})();
/* 點選傳令兵：右欄顯示內容；敵方的可以派選取的部隊攔截 */
(function(){var b=hitV8;hitV8=function(sx,sy){var h=b(sx,sy),q=crHit(sx,sy,h?6:11);return q?{k:'cr',o:q}:h;};})();
(function(){var b=v8Get;v8Get=function(X){if(X&&X.k==='cr'){if(!G)return null;var L=crList();for(var i=0;i<L.length;i++)if(L[i].id===X.id)return L[i];return null;}return b(X);};})();
(function(){var b=v8Panel;v8Panel=function(X){if(X&&X.k==='cr'){var o=v8Get(X);return o?crPanel(o):null;}return b(X);};})();
(function(){var b=v8Tip;v8Tip=function(k,o){if(k==='cr')return (CRK[o.L.k]||['傳令'])[0]+'（'+G.sides[o.side].name+'）\n點選可查看'+(o.side===mySide()||mySide()===null?'內容':'或派部隊攔截');return b(k,o);};})();
function crDir(L){var a=Math.atan2(L.y1-L.y0,L.x1-L.x0),i=Math.round(((a+PI*2.5)%(PI*2))/(PI/4))%8;return ['北','東北','東','東南','南','西南','西','西北'][i];}
function crPanel(q){var me=mySide(),own=me===null||q.side===me,L=q.L,K=CRK[L.k]||['傳令'],o=v8H('✉ '+K[0]+'（'+esc(G.sides[q.side].name)+'）')+'<div class="lw-kv">';
  if(own&&q.m){var I=crInfo(q.m,q.src,q.side),a=uById(L.a),b=uById(L.b),p=crPos(L,G.t);o+=kv('出發',a?esc(uName(a)):'—')+kv('前往',b?esc(uName(b)):'—')+kv('內容',esc(I.txt))+kv('進度',p[2]>=1?'抵達附近，正在尋找收件單位':pct(p[2]*100)+'，約 '+durTxt(Math.max(0,L.t1-G.t))+' 後送達')+(L.r?kv('帶路','附近的通信單位：被截的機會減半'):'');}
  else o+=kv('動向','往'+crDir(L)+'方向前進')+kv('位置',esc(placeTxt(q.x,q.y)));o+='</div>';
  if(own)return o+'<div class="lw-note">傳令兵經過敵軍附近可能被截，內容落入敵手；寄件的司令部要等到預定送達時間過後仍沒有回音，才會重新派遣。</div>';
  if(L.k==='flag')return o+'<div class="lw-note">打白旗的軍使正送來敵方的訊息，依戰爭法規不得攻擊。</div>';
  var us=(UI.selPrev||[]).map(uById).filter(function(u){return u&&alive(u)&&isLeaf(u)&&u.side===me;});
  return o+'<div class="lw-row"><button type="button" class="lw-btn sm pri" data-a="crint"'+(us.length?'':' disabled')+'>派'+(us.length?esc(uName(us[0]))+(us.length>1?'等 '+us.length+' 個單位':''):'選取的部隊')+'攔截</button></div><div class="lw-note">'+(us.length?'部隊會趕到傳令兵預計經過的地點埋伏；傳令兵騎得比步兵快，太遠就追不上。':'先選取要派出的部隊，再點這個傳令兵。')+'</div>';}
/* 攔截：沿傳令兵剩下的路線找部隊來得及先到的點，下令埋伏 */
ACT.crint=function(){var q=UI.selX&&UI.selX.k==='cr'?v8Get(UI.selX):null,me=mySide();if(!q){toast('這個傳令兵已經不見了。');return;}var us=(UI.selPrev||[]).map(uById).filter(function(u){return u&&alive(u)&&isLeaf(u)&&u.side===me;});if(!us.length){toast('請先選取要派出的部隊。');return;}
  var L=q.L,end=L.t1-L.f,best=null;for(var t=G.t+300;t<=end;t+=120){var p=crPos(L,t),ok=us.every(function(u){var s=ST(u),v=Math.max(1,s.vx||s.vr||4)/3.6;return dist(u.x,u.y,p[0],p[1])/v*1.3+600<t-G.t;});if(ok){best=p;break;}}
  if(!best){toast('部隊趕不上這個傳令兵。',4000);return;}UI.sel=us.map(function(u){return u.id;});UI.selX=null;issueSel('ambush',best[0],best[1]);toast('已命令'+uName(us[0])+(us.length>1?'等 '+us.length+' 個單位':'')+'在'+placeTxt(best[0],best[1])+'埋伏攔截。',4000);btSel();vDraw(false);};
ACT.crshow=function(b){var id=b.getAttribute('data-v'),q=v8Get({k:'cr',id:id});if(!q){toast('傳令兵已經不在路上了。');return;}UI.selX={k:'cr',id:id};UI.sel=[];UI.selC=0;UI.selB=0;vCenter(q.x,q.y,1.5);btSel();};
/* ---------- 設定 ---------- */
setSec('gfx','bub',{t:'部隊回報與傳令兵',o:14,local:true,h:function(){return setOpt(setRow('回報對話框',setSel('bubm','',[['all','全部回報'],['key','只有重要的（預設）'],['off','關閉']],UIP.bub||'key','部隊的無線電回報送達司令部時，在兵牌上方冒出對話框'))+
  setRow('同時最多',setSel('bubn','',[[2,'2 個'],[4,'4 個'],[8,'8 個'],[12,'12 個']],+UIP.bubN||4))+setRow('停留',setSel('bubt','',[[4,'4 秒'],[7,'7 秒'],[12,'12 秒']],+UIP.bubT||7))+
  setRow('傳令兵',setChk('cron','',UIP.crOn!==0,'在地圖上畫出傳令兵與軍使')))+'<div class="lw-note">只影響這個畫面。回報的完整紀錄在戰況頁「收件匣」的「報告」分類。</div>';}});
CHG.bubm=function(t){UIP.bub=t.value;uipSave();};CHG.bubn=function(t){UIP.bubN=+t.value;uipSave();};CHG.bubt=function(t){UIP.bubT=+t.value;uipSave();};CHG.cron=function(t){UIP.crOn=t.checked?1:0;uipSave();if(G&&G.map&&VW.ct)vDraw(false);};
setSec('cmd','tx',{t:'通信',o:22,h:function(){var S=G.set;return setOpt(setRow('傳令兵',setChk('setb','crCap',S.crCap!==false,'經過敵軍附近可能被截（內容落入敵手）'))+setRow('部隊回報',setChk('setb','txRep',S.txRep!==false,'玩家指揮的部隊以無線電或傳令回報狀況')))+
  '<div class="lw-note">命令、請求與回報自動選最快的方式傳遞：數位網路、無線電、通信單位中繼、電報或電話（兩端都停留一小時以上），否則派傳令兵。對敵軍只能用明碼無線電或派打白旗的軍使。</div>';}});
if(typeof APK!=='undefined'){APK[0][1].push(['intel','截獲敵軍傳令或明碼通訊'],['enmsg','收到敵軍的訊息']);}
(function(){var b=PAGES.battle;PAGES.battle=function(){var r=b.apply(this,arguments);BUB.L=[];return r;};})();
if(typeof HELP14!=='undefined')HELP14.push('<h4>通信：傳令兵、回報與訊息</h4><ul>'+
  '<li>命令、請求與回報自動選最快的方式傳遞：數位網路、無線電、通信單位中繼、電報或電話（兩端都停留一小時以上），都不行時派傳令兵（依年代騎馬、徒步、騎機車或開聯絡車）。地圖上的信封圖示就是傳令兵，點它可以看內容與進度。</li>'+
  '<li>傳令兵經過敵軍附近可能被截，內容落入敵手：截獲方會得知命令內容與收件部隊的位置。寄件的司令部要等到預定送達時間過後仍沒有回音，才會重新派遣。看得到的敵軍傳令兵可以點選後派選取的部隊攔截。</li>'+
  '<li>玩家指揮的部隊會回報接敵、傷亡、士氣動搖、彈藥或燃料不足、毒氣、被包圍，以及收到和完成命令；回報送到司令部後出現在收件匣的「報告」，並在兵牌上方冒出對話框（設定的「畫面」可以關閉或限制數量）。</li>'+
  '<li>收件匣分成報告、命令、請求、通信、敵方與玩家。「通信」可以發訊給友軍指揮官：加密要多花幾分鐘，明碼可能被附近有無線電的敵軍截收，密碼則會被電子偵測單位測出大約位置。「敵方」可以用明碼無線電或派打白旗的軍使向敵軍發訊。</li>'+
  '<li>聯機作戰中，原本的聊天框改為這套通信；開戰前與作戰結束後仍可聊天。</li></ul>');
/* 聯機作戰中的通信框：最近的訊息、截獲、敵軍來訊與系統通知 */
function txBoxHtml(){var me=mySide(),L=[];(G.tx||[]).forEach(function(m){if(m.k!=='rep'&&txMine(m))L.push({t:m.st==='ok'?m.td:m.t0,h:txItemHtml(m)});});(G.inbox||[]).forEach(function(m){if((me===null||m.side===me)&&/^(icpt|det|enmsg)$/.test(m.k))L.push({t:m.t,h:ibItemHtml(m)});});
  L.sort(function(a,b){return a.t-b.t;});var sy=typeof MPS!=='undefined'?(MPS.chat||[]).filter(function(c){return c.from==='系統';}).slice(-3).map(mpChatLine).join(''):'';
  return (L.length?L.slice(-20).map(function(q){return q.h;}).join(''):'<div class="sys">還沒有通信。作戰中改以無線電、電報或傳令發訊，送達要花時間；給敵軍的訊息一律是明碼。</div>')+sy;}
