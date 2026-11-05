/* ===================== 恐懼值（介面）：設定、部隊面板的恐懼條與來源、死人衝鋒與背水一戰、編制頁的恐懼承受值與英勇、說明 ===================== */
setSec('combat','fear',{t:'恐懼',o:22,h:function(){return setOpt(setRow('恐懼值',setChk('setb','fear',G.set.fear!==false,'官兵面對屍群、不可名狀之物、毒氣、火焰、轟炸與慘重傷亡時會驚恐：射擊失準、拖累士氣、停止進攻、恐慌潰逃，長時間的恐懼造成精神崩潰；遭毒氣重創的守軍可能發起「死人衝鋒」')))+
  '<div class="lw-note">恐懼升得快、沒有刺激時也退得快；訓練、經驗、指揮官、軍紀、工事與司令部在旁會減輕恐懼。</div>';}});
/* 部隊面板：士氣下面加一條恐懼，來源、精神崩潰的人數與死人衝鋒 */
(function(){var b=btStatus;btStatus=function(){b.apply(this,arguments);try{if(!G||!G.started||!fearOn()||UI.selX||UI.selC||UI.selB||!UI.sel||UI.sel.length!==1)return;var u=uById(UI.sel[0]),el=btEl('bst');if(!u||!el)return;if(UI.side>=0&&u.side!==UI.side&&!seeAll())return;
  var L=isLeaf(u)?[u]:leavesOf(u).filter(function(q){return alive(q)&&ST(q).dom==='land';});if(!L.length||(isLeaf(u)&&ST(u).dom!=='land'))return;var f=sum(L,function(q){return q.fear||0;})/L.length,bars=el.querySelector('.lw-bars');if(!bars)return;
  var tmp=document.createElement('div');tmp.innerHTML=bar('恐懼',f,f>=65?'r':f>=40?'y':'',fmt(f)+'・'+fearLv(f));var ref=bars.children[6]||null;while(tmp.firstChild)bars.insertBefore(tmp.firstChild,ref);
  var src=isLeaf(u)?fearTxt(u):'',ps=sum(L,function(q){return q.psyN||0;}),t='';if(f>=15&&src)t+='恐懼來源：'+esc(src);if(ps>=1)t+=(t?'；':'')+'約 '+fmt(ps)+' 人精神崩潰、後送';
  if(t)el.insertAdjacentHTML('beforeend','<div class="lw-note lw-fearu" style="border-left:3px solid #6A1B9A;padding-left:6px;margin-top:4px">'+t+'</div>');
  if(isLeaf(u)&&u.dmc&&G.t<u.dmc.t1)el.insertAdjacentHTML('beforeend','<div class="lw-note lw-dmcu" style="border-left:3px solid #B71C1C;padding-left:6px;margin-top:4px"><b>死人衝鋒</b>：遭毒氣重創的官兵正衝出陣地反擊（還有約 '+durTxt(u.dmc.t1-G.t)+'）</div>');
  if(isLeaf(u)&&u.lst&&G.t<u.lst.t1)el.insertAdjacentHTML('beforeend','<div class="lw-note lw-lstu" style="border-left:3px solid #B71C1C;padding-left:6px;margin-top:4px"><b>背水一戰</b>：退無可退的官兵正在死戰，不會潰散或投降，傷亡加重（還有約 '+durTxt(u.lst.t1-G.t)+'）</div>');
  var x=[],nr=nsrOf(u),ft=fearTolOf(u),bv=braveOf(u);if(nr>0)x.push(u.atH?'聽聞投降的友軍遭處決：寧可死戰或撤退，也不投降':'處決降兵的消息已傳遍全軍：投降的意願大降');if(ft!==1)x.push('恐懼承受值 '+Math.round(ft*100)+'%');if(bv!==1)x.push('英勇 '+Math.round(bv*100)+'%');
  if(x.length)el.insertAdjacentHTML('beforeend','<div class="lw-note lw-nsru" style="border-left:3px solid #4A148C;padding-left:6px;margin-top:4px">'+x.map(esc).join('；')+'</div>');}catch(e){}};})();
/* ---------- 編制頁：恐懼承受值與英勇（設在編制上會套用到底下所有部隊；空白＝沿用上級或預設 100%） ---------- */
function fearEdHtml(u){var own=function(k){return u[k]!==undefined&&u[k]!==null;},inh=function(fn,k){var p=u.p>=0?uById(u.p):null;return p?Math.round(fn(p)*100):100;};
  return '<h4 style="margin:10px 0 4px;font-size:13px">恐懼與勇氣</h4><div class="lw-row"><label title="恐懼升高的速度除以這個值：200% 時只升一半">恐懼承受值 <input type="number" data-c="ofrtol" min="25" max="300" step="5" style="width:5em" value="'+(own('frTol')?Math.round(+u.frTol):'')+'" placeholder="'+inh(fearTolOf)+'">%</label>'+(own('frTol')?'<button type="button" class="lw-btn sm" data-a="ofrtolx">沿用上級</button>':'')+'</div>'+
    '<div class="lw-row"><label title="退無可退時背水一戰、遭毒氣重創時發起死人衝鋒的機率乘上這個值；0% 表示從不">英勇反擊 <input type="number" data-c="obrave" min="0" max="500" step="10" style="width:5em" value="'+(own('brave')?Math.round(+u.brave):'')+'" placeholder="'+inh(braveOf)+'">%</label>'+(own('brave')?'<button type="button" class="lw-btn sm" data-a="obravex">沿用上級</button>':'')+'</div>'+
    '<div class="lw-note">'+(isLeaf(u)?'空白表示沿用上級編制的設定（預設 100%）。':'設在編制上，底下所有部隊都套用（部隊自己設定的除外）。')+'</div>';}
CHG.ofrtol=function(t){var u=uById(OB.sel);if(!u)return;if(t.value==='')delete u.frTol;else u.frTol=clamp(Math.round(+t.value||100),25,300);t.value=u.frTol===undefined?'':u.frTol;};
CHG.obrave=function(t){var u=uById(OB.sel);if(!u)return;if(t.value==='')delete u.brave;else u.brave=clamp(Math.round(isFinite(+t.value)?+t.value:100),0,500);t.value=u.brave===undefined?'':u.brave;};
ACT.ofrtolx=function(){var u=uById(OB.sel);if(!u)return;delete u.frTol;obDet();};ACT.obravex=function(){var u=uById(OB.sel);if(!u)return;delete u.brave;obDet();};
(function(){var b=obDet;obDet=function(){b.apply(this,arguments);try{var el=UI.body&&UI.body.querySelector('[data-k="obdet"]'),u=OB.sel?uById(OB.sel):null;if(!el||!u||el.querySelector('.lw-feard'))return;var d=document.createElement('div');d.className='lw-feard';d.innerHTML=fearEdHtml(u);el.appendChild(d);}catch(e){}};})();
if(typeof HELP14!=='undefined')HELP14.push('<h4>恐懼值與死人衝鋒</h4><ul>'+
  '<li>每個部隊除了士氣還有恐懼值（0～100）：看見屍群或不可名狀之物（數量越多、越近越怕，夜裡更怕，短兵相接時加倍）、同袍屍變、死者復生，或遭毒氣、火焰、核爆、轟炸、砲擊與白刃戰造成傷亡，恐懼會很快升高；友軍潰散、令人畏懼的敵軍（戰象、飛龍等）也會。沒有新的刺激時恐懼很快消退，司令部在旁、指揮官善於鼓舞或部隊在休整時退得更快。</li>'+
  '<li>訓練與經驗、頑強或善於鼓舞的指揮官、鐵的紀律、工事與司令部在旁會減輕恐懼；特種部隊更沉著。</li>'+
  '<li>恐懼拖累士氣、讓射擊失準；65 以上的部隊可能停止進攻、就地掩蔽；88 以上可能陷入恐慌而潰逃。長時間處在 70 以上，部分官兵精神崩潰（戰鬥壓力反應）而後送，戰報列為「精神崩潰」，不計陣亡。</li>'+
  '<li>死人衝鋒（取材自 1915 年奧索維茨要塞的守軍遭氯氣攻擊後的反擊）：近一小時內一成以上官兵因毒氣傷亡、仍未潰散的守軍，在敵軍逼近時可能用布巾蒙住口鼻、咳著血衝出陣地反擊。看見的敵軍極度驚恐，即使兵力占優也可能潰逃；衝鋒持續約二十分鐘，結束後中毒的官兵筋疲力竭。每個部隊最多一次。</li>'+
  '<li>背水一戰：恐懼到了極限、退無可退（潰散或極度驚恐，敵軍逼近到 600 公尺內，被包圍或退路被切斷）時，部隊有機會反而激發死戰的勇氣：停止潰逃、不再投降，固守或向逼近的敵軍反衝，射擊更猛烈、也不再找掩蔽，雙方的傷亡都會加重；約半小時後力竭。每個部隊最多兩次。</li>'+
  '<li>投降者遭處決的消息：敵軍拒絕受降或處決戰俘時，附近三公里內的友軍立刻得知，之後在部隊之間口耳相傳，兩小時後傳遍全軍。得知的部隊短期內更恐懼，但投降的機率大降；面臨投降與否時，寧可背水一戰，否則就撤退。</li>'+
  '<li>恐懼承受值與英勇反擊：在編制頁設定（百分比，預設 100%）。承受值越高，恐懼升得越慢；英勇反擊越高，越容易背水一戰或發起死人衝鋒（0% 表示從不）。設在編制上，底下所有部隊都套用。</li>'+
  '<li>部隊面板的「恐懼」條顯示目前的恐懼與主要來源；設定的「戰鬥 → 恐懼」可以關閉。</li></ul>');
