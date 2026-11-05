/* ===================== 指揮（介面）：火力支援的指派與顯示、同步攻擊的 H 時與出發線、連續命令（Shift）、執行計畫的快捷鍵、部隊自動化的設定與說明 ===================== */
/* ---------- 火力支援：點選友軍部隊＝指定支援對象；點地圖空白處＝支援所屬上級 ---------- */
(function(){var b=btClick;btClick=function(x,y,sx,sy,e){if(UI.tool==='ord'&&UI.ord&&UI.ord.k==='support'&&sx!==undefined){var it=hitAt(sx,sy),me=mySide(),t=it&&it.u&&!it.c?it.u:null;
    if(t&&(me===null||t.side===me)&&UI.sel.indexOf(t.id)<0)issueSel('support',undefined,undefined,{sup:t.id});else issueSel('support');return;}return b.apply(this,arguments);};})();
(function(){var b=modeBt;modeBt=function(){b.apply(this,arguments);if(VW.mode&&UI.tool==='ord'&&UI.ord&&UI.ord.k==='support')VW.mode.innerHTML='「火力支援」：點選要支援的友軍部隊（點地圖空白處＝支援所屬上級）。指派在移動、砲擊之後仍然有效，「停止待命」解除。<button type="button" data-a="ordx">取消</button>';};})();
DCN.support='火力支援：點選要支援的友軍部隊（點地圖空白處＝支援所屬上級）。砲兵只為支援對象開火，指派在移動、砲擊之後仍然有效。';
DCN.halt='停止待命：停下目前的行動原地待命；砲兵同時解除支援指派，不再主動砲擊。';
/* ---------- 部隊狀態：砲兵的支援對象、攻擊的 H 時 ---------- */
function hTxt(t){return clockTxt(dateOf(G.set.y,G.set.m,G.set.d,t+G.set.h*3600+(G.set.mi||0)*60)).replace(/^\d+ 年 /,'');}
function artSupTxt(u){var sf=artSupFor(u),t=sf?uById(sf):null;if(!t)return '待命：不自動開火（用「火力支援」命令指派支援對象）';return uName(t)+(sf===u.supA?'（指派；「停止待命」解除）':'（自動支援上級）');}
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);if(!G||!G.started||G.replay)return o;var me=mySide();if(me!==null&&u.side!==me)return o;
  if(leaf&&isArty(u))o+='<span>火力支援</span><span>'+esc(artSupTxt(u))+'</span>';var od=u.ord;
  if(od&&od.k==='attack'&&od.hHour>G.t)o+='<span>H 時</span><span>'+esc(hTxt(od.hHour))+'（約 '+durTxt(od.hHour-G.t)+' 後）'+(leaf?(u.task==='wait'?'，在出發線等待':od.fupGo?'，前往出發線':''):'，各部隊先到出發線')+'</span>';return o;};})();
/* ---------- 地圖：選取砲兵的支援連線、司令部攻擊計畫的出發線 ---------- */
function drawCmd(c){if(!G||!G.started||!UI.sel.length)return;var me=mySide(),L=UI.sel.map(uById).filter(function(u){return u&&alive(u)&&(me===null||u.side===me);});if(!L.length)return;c.save();
  L.forEach(function(u){if(isLeaf(u)&&isArty(u)&&onMap(u)){var t=uById(artSupFor(u));if(t){var tp=isLeaf(t)?[t.x,t.y]:cOf(t);if(tp){var a=w2s(u.x,u.y),z=w2s(tp[0],tp[1]);c.strokeStyle='rgba(183,28,28,0.75)';c.lineWidth=1.5;c.setLineDash([2,4]);c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(z[0],z[1]);c.stroke();c.setLineDash([]);
      c.fillStyle='rgba(183,28,28,0.85)';c.beginPath();c.arc(z[0],z[1],4,0,2*PI);c.fill();}}}
    var od=u.ord;if(!od||od.k!=='attack'||!(od.hHour>G.t))return;var K=isLeaf(u)?[u]:leavesOf(u);K.forEach(function(q){var qo=q.ord;if(!qo||!qo.fup||!(qo.hHour>G.t)||!alive(q))return;var p=w2s(qo.fup[0],qo.fup[1]),g=w2s(qo.x,qo.y);
      c.strokeStyle=sideCol(u.side);c.lineWidth=1.5;c.setLineDash([5,4]);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(g[0],g[1]);c.stroke();c.setLineDash([]);
      /* 出發線：小三角旗 */c.fillStyle=sideCol(u.side);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(p[0],p[1]-12);c.lineTo(p[0]+8,p[1]-9);c.lineTo(p[0],p[1]-6);c.fill();c.strokeStyle='#fff';c.lineWidth=1;c.stroke();});
    var t0=K.filter(function(q){return q.ord&&q.ord.fup;})[0];if(t0){var pp=w2s(t0.ord.fup[0],t0.ord.fup[1]);c.font='bold 11px sans-serif';c.fillStyle='#000';c.textAlign='left';c.fillText('H '+hTxt(od.hHour).replace(/^.* (\d+:\d+)$/,'$1'),pp[0]+10,pp[1]-10);}});c.restore();}
(function(){var b=drawObjs;drawObjs=function(c){b.apply(this,arguments);try{drawCmd(c);}catch(e){}};})();
/* ---------- 連續命令：按住 Shift 下令，命令依序排進選取部隊的命令序列；放開 Shift 時一次送出 ---------- */
var SQ={on:false,u:{},n:0};
function sqFlush(){var ids=Object.keys(SQ.u);SQ.u={};SQ.n=0;if(!ids.length||!G)return;var n=0,mx=0;ids.forEach(function(id){var u=uById(+id);if(!u||!plMine(u))return;var r=plSendOne(u);if(r&&!r.err){n++;mx=Math.max(mx,r.sec||0);}});
  if(n)toast('連續命令已送出：'+n+' 個單位'+(mx>0?'，約 '+durTxt(mx)+' 後送達':''),3500);btOrd();vDraw(false);}
document.addEventListener('keydown',function(e){if(e.key==='Shift')SQ.on=true;},true);
document.addEventListener('keyup',function(e){if(e.key==='Shift'){SQ.on=false;sqFlush();}},true);
window.addEventListener('blur',function(){if(SQ.on){SQ.on=false;sqFlush();}});
(function(){var b=issueSel;issueSel=function(k,x,y,extra){if(!SQ.on||UI.plMode||!G||!G.started||G.replay||k==='nuke')return b.apply(this,arguments);var ids=UI.sel.slice(),bt=toast;UI.plMode=true;toast=function(m){if(!/^已加入計畫/.test(String(m)))bt.apply(this,arguments);};
  try{b.apply(this,arguments);}finally{UI.plMode=false;toast=bt;}var n=0;ids.forEach(function(id){var u=uById(id);if(u&&u.pdr&&u.pdr.sq.length){SQ.u[id]=1;n=Math.max(n,u.pdr.sq.length);}});
  if(n)toast('連續命令：第 '+n+' 步「'+(ORDN[k]||k)+'」（放開 Shift 送出）',2500);btOrd();vDraw(false);};})();
hkReg('plexec','執行計畫（送出所有未下達的計畫）','ord','Ctrl+Enter',function(){ACT.plexec();},function(){return !!(G&&G.started&&!G.replay);});
hkReg('plmode','計畫模式開關','ord','',function(){UI.plMode=!UI.plMode;btOrd();vDraw(false);toast(UI.plMode?'計畫模式：之後下達的命令排進計畫，按「執行計畫」送出。':'已關閉計畫模式，命令會立即下達。',3000);},function(){return !!(G&&G.started&&!G.replay);});
/* ---------- 設定：部隊自動化 ---------- */
setSec('cmd','auto',{t:'部隊自動化',o:15,h:function(){var S=G.set;return setOpt(
  setRow('自動輪替',setChk('setb','rot',S.rot!==false,'防線上傷亡過大或士氣動搖的部隊，由同一司令部的預備隊接替'))+setRow('輪替門檻',setSel('setv','rotTh',[[40,'兵力低於 40%'],[50,'兵力低於 50%'],[60,'兵力低於 60%']],S.rotTh||50))+
  setRow('自動撤退',setChk('setb','aret',S.aret!==false,'沒有攻擊任務的部隊兵力過低、又受優勢敵軍壓迫時，有秩序地後撤重新佈防（死守、伏擊、隱蔽的不撤）'))+setRow('撤退門檻',setSel('setv','aretTh',[[25,'兵力低於 25%'],[35,'兵力低於 35%'],[45,'兵力低於 45%']],S.aretTh||35))+
  setRow('毒氣撤離',setChk('setb','gasRet',S.gasRet!==false,'沒有攻擊任務的部隊沿側風撤出毒劑雲，散去後回到原位置恢復任務'))+
  setRow('自動防護等級',setChk('setb','moppAuto',S.moppAuto!==false,'依附近的毒劑雲、地面沾染與敵軍是否使用化生放武器調整（本方設定的等級為下限，威脅解除後逐級降低）'))+
  setRow('自動除污',setChk('setb','decon',S.decon!==false,'沾染的部隊由附近的工兵、醫療單位除污；附近沒有就在靜止時自行簡易除污')));}});
/* ---------- 說明 ---------- */
if(typeof HELP14!=='undefined')HELP14.push('<h4>指揮與部隊自動化</h4><ul>'+
  '<li><b>上級規劃</b>：命令下給司令部時，參謀依任務自動分配下轄部隊的位置與行動（攻擊梯隊、預備隊、砲兵支援），再經指揮鏈逐級下達。</li>'+
  '<li><b>同步攻擊</b>：司令部規劃的攻擊（命令選項「同步發起」，預設開啟）先讓各部隊到出發線集結，估計全部就位的時間定為 H 時，一起發起。選取司令部時地圖上畫出出發線與 H 時。</li>'+
  '<li><b>待命</b>：玩家的部隊執行完命令後原地待命，不會自行反擊或出擊（設定「下級主動性（玩家）」可以開啟）。遭到射擊時照常還擊。</li>'+
  '<li><b>砲兵的支援對象</b>：砲兵只為指派的部隊開火。「火力支援」命令點選友軍部隊即指派（點地圖空白處＝支援所屬上級），司令部規劃攻擊、防禦時也會指派；指派在移動、砲擊之後仍然有效，「停止待命」解除。選取砲兵時地圖上以紅色虛線連到支援對象。</li>'+
  '<li><b>自動輪替</b>：司令部的防禦計畫中，前線部隊兵力低於門檻或士氣動搖時，由同一司令部的預備隊接替，換下來的部隊到預備位置整補。</li>'+
  '<li><b>自動撤退</b>：沒有攻擊任務的部隊兵力低於門檻、又被優勢敵軍壓迫時，有秩序地後撤一至四公里重新佈防；死守、伏擊、隱蔽的部隊不撤。</li>'+
  '<li><b>毒氣</b>：沒有攻擊任務的部隊沿側風撤出毒劑雲，散去後回到原位置恢復任務；防護等級依威脅自動提高、威脅解除後逐級降低；沾染的部隊由附近的工兵、醫療單位除污。</li>'+
  '<li><b>連續命令</b>：按住 Shift 下令（包括右鍵移動），命令依序排成命令序列，放開 Shift 時一次送出。</li>'+
  '<li><b>計畫模式</b>：開啟後命令先排進計畫，可以設定每一步的開始條件（時間、暗號、配合友軍、兵力、接敵），再按「執行計畫」（'+hkTxt('plexec')+'）把所有尚未下達的計畫一次送出。</li></ul>');
