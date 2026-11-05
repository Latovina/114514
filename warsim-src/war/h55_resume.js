/* ===================== 玩家命令的延續：遭遇戰、戰術後撤、重新集結、拒絕進攻、上級主動派遣、兵種行為等自主行動結束後，部隊恢復玩家最後下的命令 =====================
   玩家下的命令（介面或線上指令在模擬步之外呼叫 issue；遭遇戰中玩家的處置）標記為玩家命令，編制收到玩家命令後規劃給下級的命令也一併標記。
   葉單位執行玩家的機動命令時記下這道命令（u.pin）；被其他命令取代後，等部隊脫離接觸、安靜一段時間（攻擊命令還要士氣允許）再重新執行。
   同一道命令恢復三次後又被打斷就放棄並回報，避免來回拉鋸。G.set.resume===false 時關閉。 */
var RSM={sim:0,pl:0};
var RSMK=/^(move|attack|defend|screen|reserve|recon|patrol|withdraw|fortify|storm|breakthrough|penetrate|pursue|siege|support)$/,RSMA=/^(attack|storm|breakthrough|penetrate|pursue|siege)$/;
var RSMX={st:1,ready:1,eta:1,t1:1,m0:1,vi:1,oid:1,to:1,ti:1,refused:1,sub:1,parent:1,rsm:1,delay:1,pl:1};
(function(){var b=simStep;simStep=function(){RSM.sim++;try{return b.apply(this,arguments);}finally{RSM.sim--;}};})();
(function(){var b=issue;issue=function(u,k,p){if(RSM.sim)return b.apply(this,arguments);RSM.pl++;try{return b.apply(this,arguments);}finally{RSM.pl--;}};})();
(function(){var b=meetDecide;meetDecide=function(M,sd,k,who){if(who!=='玩家'||RSM.sim)return b.apply(this,arguments);RSM.pl++;try{return b.apply(this,arguments);}finally{RSM.pl--;}};})();
/* 玩家直接切換戰鬥姿態（不經指揮鏈）：改為防禦時也是玩家的命令 */
(function(){var b=postSwitch;postSwitch=function(){if(RSM.sim)return b.apply(this,arguments);RSM.pl++;try{return b.apply(this,arguments);}finally{RSM.pl--;}};})();
(function(){var b=newOrder;newOrder=function(k,o){var r=b(k,o);if(RSM.pl>0&&r)r.pl=1;return r;};})();
/* 編制收到玩家命令後規劃給下級的命令：同樣是玩家的意圖 */
(function(){var b=receiveOrder;receiveOrder=function(u,o){if(o&&!o.pl&&o.sub&&o.parent!==undefined&&u.p>=0){var P=uById(u.p);if(P&&P.ord&&P.ord.oid===o.parent&&P.ord.pl)o.pl=1;}
  /* 正在執行玩家直接下的命令（預備隊、停止、休息除外）：兩小時內不接受上級自行規劃的新部署；遭遇戰、後撤、潰散等緊急處置不受影響（結束後恢復玩家命令） */
  if(o&&o.sub&&!o.pl&&isLeaf(u)&&rsmOn()&&!aiControls(u)){var cur=u.ord&&u.ord.pl&&u.ord.st!=='done'?u.ord:(u.pend||[]).filter(function(q){return q.pl;})[0];
    if(cur&&!/^(reserve|halt|rest)$/.test(cur.k)&&(!u.pin||G.t-u.pin.t<7200||cur!==u.ord)){if(!u.rsmBl||G.t-u.rsmBl>1800){u.rsmBl=G.t;logE(u.side,'resume',uName(u)+'正在執行玩家的命令（'+ordN(cur)+'），未接受上級另行規劃的「'+ordN(o)+'」',u.x,u.y,u.id);}return;}}
  return b.apply(this,arguments);};})();
function rsmOn(){return !!(G&&G.set&&G.set.resume!==false);}
function rsmSnap(o){var c={};for(var k in o){if(RSMX[k]||k.charCodeAt(0)===95||typeof o[k]==='function')continue;c[k]=o[k];}try{c=JSON.parse(JSON.stringify(c));}catch(e){}return {o:c,t:G.t,oid:o.oid,rn:0,ov:0,ep:0,by:''};}
function rsmWhy(u,o){var d=o.dk;if(d==='twd')return '戰術後撤';if(d==='rejoin')return '重新集結歸建';if(d==='refuse')return '拒絕進攻';if(u.meet&&u.meetT!==undefined&&G.t-u.meetT<1800)return '遭遇戰';if(o.sub)return '上級主動派遣';return (typeof ORDN!=='undefined'&&ORDN[o.k])||o.k;}
/* 葉單位啟動命令時：玩家的機動命令記下來；其他命令取代時記下被誰打斷。
   同一道玩家命令衍生的命令不算打斷：啟動時轉換成的命令（強攻、突破、穿插、渡河、圍攻、追擊、非工兵構築等，沿用原命令的記錄），
   以及戰術本身的後續（傷亡超過容忍度就地防禦、佯攻與襲擊撤回、遲滯逐次後撤、渡河器材就緒後進攻、攻擊得手後轉防禦，成為新的記錄） */
var RSMC=null;
(function(){var b=activate;activate=function(u,o){if(o&&!o.pl&&RSMC&&RSMC.u===u){o.pl=1;var q=RSMC.o;if(q){if(q.ps!==undefined&&o.ps===undefined)o.ps=q.ps;if(q.pst!==undefined&&o.pst===undefined)o.pst=q.pst;}/* 作戰計畫的步驟標記也一併延續 */if(RSMC.cv)return b.apply(this,arguments);}
  if(o&&isLeaf(u)&&uDom(u)!=='air'){if(o.pl){if(o.rsm&&u.pin)u.pin.oid=o.oid;else u.pin=RSMK.test(o.k)?rsmSnap(o):null;}
    else if(u.pin){var P=u.pin;if(!P.ep){P.ep=1;P.ov=G.t;P.by=rsmWhy(u,o);}else if(!P.by)P.by=rsmWhy(u,o);}}
  var c=RSMC;RSMC=o&&o.pl?{u:u,cv:1,o:o}:null;try{return b.apply(this,arguments);}finally{RSMC=c;}};})();
function rsmCont(f){return function(u){var o=u&&u.ord;if(!o||!o.pl||RSMC)return f.apply(this,arguments);RSMC={u:u,cv:0,o:o};try{return f.apply(this,arguments);}finally{RSMC=null;}};}
tacStep=rsmCont(tacStep);engLeaf=rsmCont(engLeaf);
/* 每兩分鐘檢查：自主行動已經結束、脫離接觸、安靜一段時間 → 恢復玩家命令 */
function rsmStep(){if(!rsmOn())return;G.units.forEach(function(u){var P=u.pin;if(!P)return;if(!alive(u)){u.pin=null;return;}if(!isLeaf(u)||(G.step+u.id)%4)return;
    if(u.ord&&u.ord.pl){P.ep=0;P.wl=0;return;}/* 正在執行玩家命令 */if(!P.ep){P.ep=1;P.ov=G.t;}if(!P.by)P.by=u.ord?rsmWhy(u,u.ord):'潰散與重新集結';
    if(!onMap(u)||u.ms==='rout'||u.st==='lift'||u.amph||uDom(u)==='air'||aiControls(u)||u.ffo)return;
    if(u.pend&&u.pend.length||u.meetHold&&G.t<u.meetHold||u.waitT&&G.t<u.waitT||u.regT&&G.t<u.regT)return;if(u.task==='go'||u.pq)return;/* 自主行動還在進行 */
    var o=P.o,atk=RSMA.test(o.k),quiet=600*(1+(P.rn||0)),uf=u.uf===undefined?1e9:G.t-u.uf;if(uf<quiet)return;if(!atk&&(u._ed===undefined?1e9:u._ed)<1200)return;
    if(atk&&(u.ms!=='ok'||u.mor<50||strFrac(u)<0.45)){if(!P.wl){P.wl=1;logE(u.side,'resume',uName(u)+'暫時無法恢復原命令「'+ordN(o)+'」：等待士氣恢復',u.x,u.y,u.id);}return;}
    if((P.rn||0)>=3){u.pin=null;logE(u.side,'resume',uName(u)+'的原命令「'+ordN(o)+'」已第四次被打斷，不再自動恢復，請重新下令',u.x,u.y,u.id);return;}
    var c=JSON.parse(JSON.stringify(o));if(Array.isArray(c.via)&&c.x!==undefined){var d0=dist(u.x,u.y,c.x,c.y);c.via=c.via.filter(function(q){return dist(q[0],q[1],c.x,c.y)<d0;});if(!c.via.length)delete c.via;}
    var no=newOrder(c.k,c);no.pl=1;no.rsm=1;no.delay=60;P.rn=(P.rn||0)+1;P.ep=0;P.wl=0;var by=P.by;P.by='';
    logE(u.side,'resume',uName(u)+(by?'在「'+by+'」結束後':'')+'恢復執行原命令：'+ordN(no)+(no.x!==undefined?'（'+placeTxt(no.x,no.y)+'）':''),u.x,u.y,u.id);activate(u,no);});}
(function(){var b=v8Step;v8Step=function(){b.apply(this,arguments);if(G&&G.started&&!G.over)rsmStep();};})();
/* 給畫面：部隊目前是否在等待恢復玩家命令 */
function rsmState(u){var P=u&&u.pin;if(!P||!rsmOn()||u.ord&&u.ord.pl||!P.ep)return null;var o=P.o,atk=RSMA.test(o.k),quiet=600*(1+(P.rn||0)),uf=u.uf===undefined?1e9:G.t-u.uf;
  var wait=u.ms==='rout'?'潰散，重新集結後':uf<quiet?'脫離接觸約 '+durTxt(quiet-uf)+'後':u.task==='go'?'目前行動結束後':atk&&(u.ms!=='ok'||u.mor<50)?'士氣恢復後':'即將';return {o:o,by:P.by,wait:wait,rn:P.rn||0};}
