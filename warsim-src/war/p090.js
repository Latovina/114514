/* ===================== 遊戲模式（介面）：開始頁與設定頁選擇模式、逐項調整勝負規則；戰況總覽顯示兵力票數、後方民心與斬首狀態 ===================== */
if(typeof GKEYS!=='undefined')GKEYS.push('gm');
var GMK=['std','leth','prest','opin','conq','annih','decap','blitz','attr','iron','nuke','zed','chaos'];
/* 開始頁：戰場卡片加上遊戲模式；建立作戰後套用 */
if(typeof ST0!=='undefined'&&ST0.gm===undefined)ST0.gm='std';
(function(){if(typeof bfCard!=='function')return;var b=bfCard;bfCard=function(){var h=b.apply(this,arguments),k=GMODE[ST0.gm]?ST0.gm:'std';
  var x='<div class="lw-row lw-gmrow"><label title="把現有的機制組合成不同玩法；建立作戰後仍可在設定頁逐項調整">遊戲模式 <select data-c="stgm">'+GMK.map(function(q){return '<option value="'+q+'"'+(q===k?' selected':'')+' title="'+esc(GMODE[q].d)+'">'+esc(GMODE[q].n)+'</option>';}).join('')+'</select></label><span class="lw-note lw-gmd">'+esc(GMODE[k].d)+'</span></div>';
  var i=h.lastIndexOf('</div>');return i>=0?h.slice(0,i)+x+h.slice(i):h+x;};})();
CHG.stgm=function(t){ST0.gm=GMODE[t.value]?t.value:'std';var d=t.closest('.lw-gmrow');d=d&&d.querySelector('.lw-gmd');if(d)d.textContent=GMODE[ST0.gm].d;};
(function(){if(typeof newScenario!=='function')return;var b=newScenario;newScenario=function(){var r=b.apply(this,arguments);try{if(G&&G.set&&ST0.gm&&ST0.gm!=='std')gmApplySet(G.set,ST0.gm);}catch(e){}return r;};})();
/* 設定頁：遊戲模式與勝負規則 */
function gmCard(){var S=G.set,k=gmKey(),M=GMODE[k],sel=function(f,L,v,lbl,tip){return '<span title="'+esc(tip)+'">'+lbl+'</span><select data-c="setv" data-f="'+f+'" title="'+esc(tip)+'">'+L.map(function(q){return '<option value="'+q[0]+'"'+(+q[0]===+v?' selected':'')+'>'+q[1]+'</option>';}).join('')+'</select>';},
    chk=function(f,lbl,txt,tip){return '<span title="'+esc(tip)+'">'+lbl+'</span><label title="'+esc(tip)+'"><input type="checkbox" data-c="setb" data-f="'+f+'"'+(S[f]?' checked':'')+'>'+txt+'</label>';};
  return '<div class="lw-opt"><span>遊戲模式</span><select data-c="gmsel">'+GMK.map(function(q){return '<option value="'+q+'"'+(q===k?' selected':'')+'>'+esc(GMODE[q].n)+'</option>';}).join('')+'</select></div>'+
    '<div class="lw-note lw-gmd">'+esc(M.d)+(G.started?' 作戰進行中換模式，新規則立刻生效。':'')+'</div><div class="lw-opt">'+
    sel('collapse',[[0.05,'5%'],[0.1,'10%'],[0.15,'15%（預設）'],[0.2,'20%'],[0.3,'30%'],[0.4,'40%'],[0.5,'50%']],gmCollapse(),'兵力崩潰','一方的戰力降到這個比例以下即戰敗')+
    sel('objW',[[0,'不計'],[0.5,'0.5 倍'],[1,'1 倍（預設）'],[2,'2 倍'],[3,'3 倍']],gmObjW(),'目標計分','時間到或雙方同時觸發勝負時，控制目標的分數權重')+
    sel('tix',[[0,'不啟用'],[200,'200 張'],[400,'400 張'],[600,'600 張'],[1000,'1000 張'],[2000,'2000 張']],+S.tix||0,'兵力票數','敵方控制的目標與本方的傷亡持續扣票，歸零即戰敗')+
    sel('supLose',[[0,'不啟用'],[10,'低於 10'],[20,'低於 20'],[25,'低於 25'],[30,'低於 30'],[40,'低於 40']],+S.supLose||0,'民心崩潰','後方民心跌破這個數值，政府接受停火、判定戰敗（需要戰地記者與後方民心）')+
    chk('opin','民心變化','傷亡、殺害平民、戰果與目標得失影響後方民心','除了戰地報導，戰況本身也會讓後方民心升降')+
    sel('rpGain',[[0.5,'0.5 倍'],[1,'1 倍（預設）'],[2,'2 倍'],[3,'3 倍'],[5,'5 倍']],gmRpGain(),'戰功點數','殺傷、後送、佔領與守住目標得到的增援點數倍率（需開啟增援點數）')+
    chk('rpRep','聲望配給','每日增援配給隨後方民心增減','民心 50 為原本的配給，100 為 1.5 倍、0 為一半')+
    chk('decap','斬首','開戰時的最高司令部被摧毀即戰敗','雙方的最高司令部一旦被摧毀，該方立即戰敗')+'</div>';}
setSec('rules','gm',{t:'遊戲模式與勝負規則',o:10,cls:'lw-gmcard',h:function(){return gmCard();}});
CHG.gmsel=function(t){var k=GMODE[t.value]?t.value:'std';gmApplySet(G.set,k);if(G.started&&typeof barRender==='function')barRender();toast('遊戲模式：'+GMODE[k].n+'。'+GMODE[k].d,6000);show('set');};
/* 戰況總覽：模式與勝負規則的狀態 */
function gmStatus(){if(!G||!G.started)return '';var S=G.set,X=G.gm||{},k=gmKey(),t=[],me=UI.side>=0?UI.side:-1;
  if(k!=='std')t.push('遊戲模式：<b>'+esc(GMODE[k].n)+'</b>');
  if(+S.tix>0&&X.tix)t.push('兵力票數 '+SIDES().map(function(s){return '<span style="color:'+G.sides[s].color+'">'+esc(G.sides[s].name)+' '+fmt(Math.max(0,X.tix[s]))+'</span>';}).join('／'));
  if((+S.supLose>0||S.opin)&&X.home)t.push('後方民心 '+SIDES().map(function(s){return '<span style="color:'+G.sides[s].color+'">'+esc(G.sides[s].name)+' '+fmt(X.home[s])+'</span>';}).join('／')+(+S.supLose>0?'（低於 '+S.supLose+' 戰敗）':''));
  if(S.decap&&X.hq){var mine=me>=0?[me]:SIDES();t.push('斬首：'+mine.map(function(s){var T=uById(X.hq[s]);return esc(G.sides[s].name)+'的最高司令部'+(!T?'不明':T.hqLost||!alive(T)?'已被摧毀':'完好（'+esc(uName(T))+'）');}).join('；'));}
  if(+S.rpGain>1&&rpOn())t.push('戰功點數 × '+S.rpGain);
  return t.length?'<div class="lw-note lw-gmst" style="border-left:3px solid #6A1B9A;padding-left:6px;margin:0 0 6px">'+t.join('<br>')+'</div>':'';}
(function(){var b=overview;overview=function(){var o=b();try{var x=gmStatus();if(x){var i=o.indexOf('</h3>');if(i>=0)o=o.slice(0,i+5)+x+o.slice(i+5);}}catch(e){}return o;};})();
HELP14.push('<h4>遊戲模式</h4><ul><li>開始頁的戰場卡片與設定頁的「遊戲模式與勝負規則」可以選擇模式；模式只是一組設定加上勝負規則，選定後仍可逐項調整（聯機房間由房主調整）。</li>'+
  GMK.filter(function(k){return k!=='std';}).map(function(k){return '<li><b>'+GMODE[k].n+'</b>：'+GMODE[k].d+'</li>';}).join('')+
  '<li>勝負規則：「兵力崩潰」設定戰力降到多少即戰敗；「目標計分」設定時間到時目標分數的權重；「兵力票數」讓敵方控制的目標與本方傷亡持續扣票；「民心崩潰」與「民心變化」讓後方民心決定勝負；「戰功點數」與「聲望配給」調整增援點數；「斬首」讓最高司令部被摧毀的一方立即戰敗。戰況總覽會顯示票數、民心與總部狀態。</li></ul>');
