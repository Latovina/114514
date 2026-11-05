/* ===================== 目標區（介面）：設定頁的範圍倍率、佔領時間與守住時間；部署頁「目標點」工具在地圖上拖曳目標圈邊緣調整範圍、拖曳星號移動 ===================== */
var OBJRM=[[0.25,'× 0.25'],[0.5,'× 0.5'],[0.75,'× 0.75'],[1,'× 1（依想定與部署頁）'],[1.5,'× 1.5'],[2,'× 2'],[3,'× 3'],[5,'× 5']];
setSec('rules','obj',{t:'目標',o:30,h:function(){var m=objRm(),cap=objCapT()/60,hold=objHoldT()/3600;
  return setOpt(setRow('目標區範圍',setSel('setv','objRm',OBJRM,m,'所有目標點的範圍（半徑）倍率；每個目標的基本範圍可以在部署頁調整'))+
    setRow('佔領目標',setSel('setv','objCap',[[1,'1 分鐘'],[5,'5 分鐘'],[10,'10 分鐘'],[20,'20 分鐘'],[30,'30 分鐘'],[60,'1 小時'],[120,'2 小時']],cap,'範圍內只有一方的地面部隊持續這麼久，目標就易手'))+
    setRow('守住全部目標',setSel('setv','objHold',[[0.5,'30 分鐘'],[1,'1 小時'],[2,'2 小時'],[4,'4 小時'],[6,'6 小時'],[12,'12 小時'],[24,'1 天']],hold,'結束條件選「控制全部目標」時，一方要守住全部目標這麼久才算獲勝')));}});
/* ---------- 部署頁：拖曳目標圈邊緣調整範圍、拖曳星號移動目標（單機） ---------- */
function objEditOn(){return !!(G&&UI.tab==='deploy'&&typeof DP!=='undefined'&&DP.tool==='obj'&&!(typeof mpActive==='function'&&mpActive()));}
function objHitEdge(sx,sy){var best=null,bd=1e9;(G.obj||[]).forEach(function(o){if(o._sx===undefined)return;var d=dist(sx,sy,o._sx,o._sy),rs=obR(o)/mpp();if(d<13&&d<bd){bd=d;best={k:'objm',o:o};}else if(Math.abs(d-rs)<9&&Math.abs(d-rs)<bd){bd=Math.abs(d-rs);best={k:'objr',o:o};}});return best;}
(function(){var b=vDown;vDown=function(e){var r=b.apply(this,arguments);try{var D=VW.drag;if(D&&D.btn!==2&&objEditOn()){var p=vPt(e),H=objHitEdge(p[0],p[1]);if(H){D.kind=H.k;D.ob=H.o;D.r0=H.o.r||800;}}}catch(x){}return r;};})();
(function(){var b=vMove;vMove=function(e){var D=VW.drag;if(!D||(D.kind!=='objr'&&D.kind!=='objm'))return b.apply(this,arguments);var p=vPt(e),w=s2w(p[0],p[1]),o=D.ob;if(dist(p[0],p[1],D.sx0,D.sy0)>5)D.moved=true;if(!D.moved)return;
  if(D.kind==='objr'){obSetR(o,dist(w[0],w[1],o.x,o.y)/objRm());VW.mode&&(VW.mode.hidden=false,VW.mode.textContent='目標「'+o.name+'」半徑 '+kmTxt(obR(o)));}else{o.x=w[0];o.y=w[1];}vDraw(false);};})();
(function(){var b=vUp;vUp=function(e){var D=VW.drag;if(!D||(D.kind!=='objr'&&D.kind!=='objm')||!D.moved)return b.apply(this,arguments);VW.drag=null;delete VW.ptr[e.pointerId];var o=D.ob;
  if(D.kind==='objr')toast('目標「'+o.name+'」的範圍：半徑 '+kmTxt(obR(o)));else toast('已移動目標「'+o.name+'」到'+placeTxt(o.x,o.y));if(typeof modeTip==='function')modeTip();if(typeof dpPanel==='function')dpPanel();vDraw(false);};})();
HELP14.push('<h4>目標區範圍</h4><ul><li>每個目標點都有一個範圍（地圖上的虛線圈）：範圍內只有一方的地面部隊、持續一段時間（預設 10 分鐘），目標就易手；守住目標的增援點數、資源收集的安全距離也依範圍計算。</li>'+
  '<li>部署頁的「目標點」卡片可以設定每個目標的半徑、新目標的預設半徑，或一次套用到全部目標；選「目標點」工具後，在地圖上拖曳目標圈的邊緣調整範圍，拖曳星號移動目標。</li>'+
  '<li>設定頁「規則與勝負」的「目標區範圍」倍率一次放大或縮小所有目標（聯機房間由房主調整）；「佔領目標」設定易手需要的時間，「守住全部目標」設定結束條件「控制全部目標」要守住多久。</li></ul>');
