/* ===================== 三方作戰介面：開始頁的三方對戰、兵力編成的第三方（加入、開場關係、移除）、視角選單、
   外交面板（宣戰、提議停火或結盟、回應對方的提議、紀錄；開戰前與上帝視角可直接設定各方關係）、
   地圖上的中立與同盟部隊（中立以方框兵牌顯示，點選可看概況）、退出戰局與名次 ===================== */
function triOn(){return !!(G&&G.sides&&G.sides.length>=3);}
var RELC={war:'#b3261e',neu:'#5f6670',ally:'#2e7d32'};
function relTag(r){return '<span class="lw-rel" style="color:'+(RELC[r]||'#444')+';border-color:'+(RELC[r]||'#999')+'">'+esc(relName(r))+'</span>';}
function sideTag(s){var S=G.sides[s];return S?'<span class="lw-sw" style="background:'+S.color+'"></span> '+esc(S.name):'';}
/* 這一方已退出戰局（G.out 記的是退出的時間，可能是 0） */
function triOut(i){return !!(G.out&&G.out[i]!==undefined&&G.out[i]!==null);}
function triMp(){return typeof mpActive==='function'&&mpActive();}
/* 某一方目前的頂層編制，整理成快速想定的部隊清單（給第三方仿照） */
function triListOf(s){var by={},L=[];G.units.forEach(function(u){if(u.side!==s||u.p>=0||u.st==='dead')return;var k=u.pk&&FPI[u.pk]?u.pk:isLeaf(u)&&u.mix&&u.mix[0]&&UT[u.mix[0][0]]?u.mix[0][0]:null;if(!k)return;if(!by[k]){by[k]=[k,0];L.push(by[k]);}by[k][1]++;});return L;}
/* ---------- 開始頁：快速想定加入第三方（三方對戰；對戰形式 3 對 3 時就是 3v3v3） ---------- */
var TRI0={on:false,rel:'neu',sz:'m',src:'A',me:0};
function triOpt(){return ST0.tri||(ST0.tri=Object.assign({},TRI0));}
(function(){var b=PAGES.start;PAGES.start=function(host){b(host);var sc=host.querySelector('.lw-scn');if(!sc)return;var T=triOpt(),d=document.createElement('div');d.className='lw-row lw-trirow';
  var sel=function(f,opts){return '<select data-c="tri0" data-f="'+f+'"'+(T.on?'':' disabled')+'>'+opts.map(function(q){return '<option value="'+q[0]+'"'+(String(T[f])===String(q[0])?' selected':'')+'>'+esc(q[1])+'</option>';}).join('')+'</select>';};
  d.innerHTML='<b>三方對戰</b><label title="加入第三個完整的陣營（綠軍），由玩家或 AI 指揮"><input type="checkbox" data-c="tri0" data-f="on"'+(T.on?' checked':'')+'>加入第三方</label>'+
    '<label>開場 '+sel('rel',Object.keys(TRIREL).map(function(k){return [k,TRIREL[k][2]];}))+'</label><label>兵力 '+sel('sz',Object.keys(TRISZ).map(function(k){return [k,TRISZ[k][1]];}))+'</label>'+
    '<label>編成仿照 '+sel('src',[['A','藍方'],['B','紅方']])+'</label><label>你扮演 '+sel('me',[[0,'藍方'],[2,'第三方']])+'</label>'+
    '<span class="lw-note">第三方從兩軍沒用到的地圖邊進入，預設與兩軍中立：互不開火、不算敵軍，但看得到彼此。之後由各方指揮官（玩家或 AI）宣戰、提議停火或結盟；對戰形式選 3 對 3 就是 3v3v3。</span>';
  var tm=host.querySelector('.lw-v11team');if(tm&&tm.parentNode)tm.parentNode.insertBefore(d,tm.nextSibling);else sc.parentNode.insertBefore(d,sc);};})();
CHG.tri0=function(t){var T=triOpt(),f=t.getAttribute('data-f');if(f==='on'){T.on=t.checked;var r=t.closest('.lw-trirow');if(r)r.querySelectorAll('select').forEach(function(s){s.disabled=!T.on;});return;}T[f]=f==='me'?+t.value:t.value;};
function triSetup(sc,T){var n=clamp(+(ST0.team||1),1,4),md=ST0.tmode==='dup'?'dup':'split',L=(T.src==='B'?sc.B:sc.A)||[];if(n>1&&md==='dup')L=dupList(L,n);
  var S=triAdd({rel:T.rel,ai:T.me!==2,edge:triEdge()});triForces(L,T.sz,sc.gran||'co');triObj();if(n>1)teamSetup(2,n,md);
  if(T.me===2){var S0=G.sides[0];S0.ai=true;S0.pu=0;(S0.cm||[]).forEach(function(R){R.ai=true;});S.ai=false;S.pu=0;if(S.cm&&S.cm[0])S.cm[0].ai=false;UI.side=2;OB.side=2;}
  cmBump();reix();dupNames();return S;}
(function(){var b=runScn;runScn=async function(sc,pg){await b(sc,pg);var T=ST0.tri;if(!T||!T.on||!G||triOn())return;var S=triSetup(sc,T);barRender();show('deploy');
  toast('已加入第三方「'+S.name+'」（'+TRIREL[T.rel][2]+'，兵力'+TRISZ[T.sz][1]+'，由'+({N:'北',S:'南',W:'西',E:'東'}[S.edge]||S.edge)+'側進入）。'+(T.me===2?'你扮演第三方，藍軍改由 AI 指揮。':'第三方由 AI 指揮。')+'在「外交」查看與改變各方關係。',8000);};})();
/* ---------- 兵力編成：加入第三方、開場關係、移除 ---------- */
(function(){var b=PAGES.orbat;PAGES.orbat=function(host){b(host);if(!G)return;var ph=host.querySelector('.lw-ph');if(!ph)return;var bt=document.createElement('button');bt.type='button';bt.className='lw-btn sm';
  if(triOn()){bt.setAttribute('data-a','dipdlg');bt.textContent='外交';bt.title='各方之間的關係：交戰、中立、同盟';}else{if(G.started||triMp())return;bt.setAttribute('data-a','triadd');bt.textContent='＋第三方';bt.title='加入第三個陣營（三方對戰），開場預設與兩軍中立';}
  ph.insertBefore(bt,ph.querySelector('.lw-sp'));};})();
function triRelPre(s){var o='<span>外交關係</span>',pre=!G.started&&!triMp();SIDES().forEach(function(q){if(q===s)return;var r=relOf(s,q);
    o+='<span class="lw-trip">'+sideTag(q)+' '+(pre?'<select data-c="trirel" data-v="'+q+'">'+Object.keys(DIPK).map(function(k){return '<option value="'+k+'"'+(r===k?' selected':'')+'>'+DIPK[k]+'</option>';}).join('')+'</select>':relTag(r))+'</span>';});
  if(pre&&s===2)o+='<button type="button" class="lw-btn sm" data-a="tridel" title="刪除第三方與它的全部部隊">移除第三方</button>';else if(G.started)o+='<button type="button" class="lw-btn sm" data-a="dipdlg">外交…</button>';return o;}
(function(){var b=obTree;obTree=function(){b();if(!triOn())return;var el=UI.body&&UI.body.querySelector('[data-k="obtree"]');if(!el)return;var r=el.querySelector('.lw-row');if(!r)return;var d=document.createElement('div');d.className='lw-row lw-trirel';d.innerHTML=triRelPre(OB.side);r.parentNode.insertBefore(d,r.nextSibling);};})();
CHG.trirel=function(t){var s=OB.side,q=+t.getAttribute('data-v'),r=t.value;if(G.started||triMp()||!G.dip||!DIPK[r])return;G.dip[s][q]=r;G.dip[q][s]=r;G.dipV=(G.dipV||0)+1;toast(G.sides[s].name+'與'+G.sides[q].name+'：開場'+DIPK[r]+'。');if(typeof vDraw==='function')vDraw(false);};
ACT.tridel=function(){if(!triOn()||G.started)return;var S=G.sides[2],n=G.units.filter(function(u){return u.side===2;}).length;if(!confirm('移除第三方「'+S.name+'」與它的 '+n+' 個單位？'))return;triDel();OB.side=0;OB.sel=0;if(UI.side===2)UI.side=0;UI.sel=[];barRender();show('orbat');toast('已移除第三方。');};
ACT.triadd=function(){if(triOn()||G.started)return;var e=triEdge(),o='<h3>加入第三方<small>三方對戰</small></h3><div class="lw-opt lw-triadd">'+
    '<span>名稱</span><input type="text" data-k="tname" value="綠軍" maxlength="30"><span>顏色</span><input type="color" data-k="tcol" value="#2E9D57">'+
    '<span>進入的地圖邊</span><select data-k="tedge">'+[['N','北'],['S','南'],['W','西'],['E','東']].map(function(q){return '<option value="'+q[0]+'"'+(q[0]===e?' selected':'')+'>'+q[1]+(q[0]===e?'（建議）':'')+'</option>';}).join('')+'</select>'+
    '<span>開場關係</span><select data-k="trel">'+Object.keys(TRIREL).map(function(k){return '<option value="'+k+'">'+esc(TRIREL[k][2])+'</option>';}).join('')+'</select>'+
    '<span>部隊</span><select data-k="tsrc"><option value="A">仿照'+esc(G.sides[0].name)+'的編制</option><option value="B">仿照'+esc(G.sides[1].name)+'的編制</option><option value="none">先不建立（之後在兵力編成加入）</option></select>'+
    '<span>規模</span><select data-k="tsz">'+Object.keys(TRISZ).map(function(k){return '<option value="'+k+'"'+(k==='m'?' selected':'')+'>'+esc(TRISZ[k][1])+'</option>';}).join('')+'</select>'+
    '<span>指揮</span><select data-k="tctl"><option value="ai">由 AI 指揮</option><option value="pl">由玩家指揮</option></select>'+
    '<span>本土目標</span><label><input type="checkbox" data-k="tobj" checked>在本土最大的聚落設一個目標</label></div>'+
    '<div class="lw-note">第三方是完整的陣營：有自己的補給、情報、民心與指揮官。中立的各方互不開火、不算敵軍；火力波及中立方會累積積怨，AI 積怨夠深或本土被侵入太久就會宣戰。</div>'+
    '<div class="lw-row"><span class="lw-sp"></span><button type="button" class="lw-btn" data-a="x">取消</button><button type="button" class="lw-btn pri" data-a="triaddok">加入</button></div>';
  dlg(o);};
ACT.triaddok=function(b){var d=b.closest('.lw-dlg');if(!d||triOn())return;var v=function(k){var e=d.querySelector('[data-k="'+k+'"]');return e?(e.type==='checkbox'?e.checked:e.value):null;};
  var S=triAdd({name:v('tname')||'綠軍',color:v('tcol'),edge:v('tedge'),rel:v('trel'),ai:v('tctl')!=='pl'}),src=v('tsrc'),n=0;
  if(src==='A'||src==='B')n=triForces(triListOf(src==='B'?1:0),v('tsz'),'co').length;if(v('tobj'))triObj();reix();dupNames();d.remove();OB.side=2;OB.sel=0;barRender();show('orbat');
  toast('已加入第三方「'+S.name+'」'+(n?'（'+n+' 個頂層編制，已自動部署）':'（還沒有部隊）')+'：'+TRIREL[v('trel')][2]+'。',6000);};
/* ---------- 視角選單與外交按鈕 ---------- */
(function(){var b=barRender;barRender=function(){b();if(!UI.bar||!triOn()||!G.map)return;var v=UI.bar.querySelector('select[data-c="view"]');
  if(v&&!v.querySelector('option[value="2"]')){var op=document.createElement('option');op.value='2';op.textContent=G.sides[2].name+'視角';if(UI.side===2)op.selected=true;v.insertBefore(op,v.querySelector('option[value="-1"]'));}
  if(UI.bar.querySelector('[data-a="dipdlg"]'))return;var bt=document.createElement('button');bt.type='button';bt.className='lw-btn sm lw-dipb';bt.setAttribute('data-a','dipdlg');bt.title='外交：各方之間的關係、宣戰、停火與結盟的提議';bt.innerHTML='外交<b class="lw-dipn" data-k="dipn"></b>';
  if(v)UI.bar.insertBefore(bt,v);else UI.bar.appendChild(bt);dipBadge();layoutVar();};})();
function dipPend(me){return (G.dipP||[]).filter(function(P){return P.st==='open'&&(me===null||me<0?sideHum(P.b):P.b===me);});}
function dipBadge(){var e=UI.bar&&UI.bar.querySelector('[data-k="dipn"]');if(!e)return;var n=G&&G.started?dipPend(mySide()).length:0;e.textContent=n?String(n):'';e.style.display=n?'':'none';}
/* 外交的變化：新的提議、宣戰或停火時提示；外交面板開著時更新內容 */
var DIP={d:null,k:'',np:-1,nh:-1,g:null};
(function(){var b=hudTick;hudTick=function(force){b(force);if(!triOn())return;if(DIP.g!==G){DIP.g=G;DIP.np=-1;DIP.nh=-1;}var me=mySide(),P=dipPend(me),nh=(G.dipH||[]).length;
  if(DIP.np>=0&&P.length>DIP.np&&G.started){var q=P[P.length-1];toast('📨 '+G.sides[q.a].name+'提議'+DIPPK[q.k]+'——在「外交」回應（兩小時內沒有回應就作罷）。',7000);}
  if(DIP.nh>=0&&nh>DIP.nh){var h=G.dipH[nh-1];if(h&&(me===null||h.a===me||h.b===me))toast((h.r==='war'?'⚔ '+G.sides[h.a].name+'向'+G.sides[h.b].name+'宣戰':h.r==='ally'?'🤝 '+G.sides[h.a].name+'與'+G.sides[h.b].name+'結盟':'🕊 '+G.sides[h.a].name+'與'+G.sides[h.b].name+'轉為中立')+(h.why?'：'+h.why:''),7000);}
  DIP.np=P.length;DIP.nh=nh;dipBadge();
  if(DIP.d){if(!DIP.d.isConnected){DIP.d=null;return;}var k=[G.dipV||0,(G.dipP||[]).map(function(q){return q.id+q.st;}).join(),nh,me,G.over?1:0,Object.keys(G.out||{}).length].join('|');if(k!==DIP.k)dipRender();}};})();
/* ---------- 外交面板 ---------- */
var GRVN=[[100,'輕微'],[350,'不滿'],[900,'強烈'],[1e12,'極度']];
function grvTxt(v){if(!(v>0))return '—';for(var i=0;i<GRVN.length;i++)if(v<GRVN[i][0])return GRVN[i][1];return GRVN[GRVN.length-1][1];}
/* 對另一方兵力的了解：上帝視角或沒有戰場迷霧時是實數；否則只算情報圖與中立接觸裡兩小時內看到的人數 */
function dipSeen(me,o){if(me===null||me<0||!G.set.fog)return '約 '+fmt(Math.round(sideStr(o).m/100)*100)+' 人';var n=0,seen={};[G.ct[me]||{},G.ctN&&G.ctN[me]||{}].forEach(function(C){for(var id in C){var c=C[id];if(c.side!==o||seen[id]||G.t-c.t>7200||c.dead)continue;seen[id]=1;n+=c.men||0;}});return n?'已知約 '+fmt(n)+' 人':'沒有情報';}
function dipActs(me,o){if(G.over||!G.started||triOut(me)||triOut(o))return '';var r=relOf(me,o),B=function(a,t,tip,cls){return '<button type="button" class="lw-btn sm'+(cls?' '+cls:'')+'" data-a="'+a+'" data-v="'+o+'"'+(tip?' title="'+esc(tip)+'"':'')+'>'+t+'</button>';};
  if(r==='neu')return B('dipwar','宣戰','中立的部隊立刻成為敵軍：開始互相射擊、砲擊與空襲','dng')+B('dipally','提議結盟','有共同的敵人時對方比較可能接受；同盟之間共享情報');
  if(r==='war')return B('dippeace','提議停火','停火後轉為中立，雙方停止交火');
  if(r==='ally')return B('dipend','解除同盟','轉為中立，不再共享情報')+B('dipwar','背棄同盟並宣戰','國際聲望大降，雙方官兵士氣動搖','dng');return '';}
function dipHtml(){var me=mySide(),god=me===null,o='<h3>外交<small>'+(god?'上帝視角：可直接設定各方關係':esc(G.sides[me].name)+'的外交')+'</small></h3>';
  if(!G.started||god){o+='<div class="lw-note">'+(G.started?'上帝視角可以直接改變任兩方的關係（記入外交紀錄）。':'開戰前設定各方的開場關係。')+'</div><table class="lw-tbl"><tr><th>雙方</th><th>關係</th></tr>';
    SIDES().forEach(function(a){SIDES().forEach(function(c){if(c<=a)return;var r=relOf(a,c);o+='<tr><td>'+sideTag(a)+' ↔ '+sideTag(c)+'</td><td>'+(triMp()?relTag(r):'<select data-c="dipset" data-v="'+a+'-'+c+'">'+Object.keys(DIPK).map(function(k){return '<option value="'+k+'"'+(r===k?' selected':'')+'>'+DIPK[k]+'</option>';}).join('')+'</select>')+'</td></tr>';});});o+='</table>';}
  if(!god){o+='<table class="lw-tbl lw-dipt"><tr><th>對象</th><th>關係</th><th>兵力</th><th title="對方的火力波及本方部隊累積的不滿">本方的積怨</th><th title="本方的火力波及對方部隊累積的不滿">對方的積怨</th><th></th></tr>';
    SIDES().forEach(function(q){if(q===me)return;var r=relOf(me,q),Gv=G.dipG||{},I=G.dipI||{},W=G.dipW&&G.dipW[Math.min(me,q)+'-'+Math.max(me,q)],inc=[];
      if((I[me+'>'+q]||0)>0)inc.push('對方部隊在本方領土 '+I[me+'>'+q]+' 小時');if((I[q+'>'+me]||0)>0)inc.push('本方部隊在對方領土 '+I[q+'>'+me]+' 小時（3 小時以上對方可能宣戰）');
      o+='<tr><td>'+sideTag(q)+(triOut(q)?'<br><small>已退出戰局</small>':'')+(SD(q).ai?'<br><small>AI 指揮</small>':'<br><small>玩家指揮</small>')+'</td><td>'+relTag(r)+(r==='war'&&W!==undefined?'<br><small>'+durTxt(Math.max(0,G.t-W))+'前開戰</small>':'')+'</td><td>'+esc(dipSeen(me,q))+'</td><td>'+grvTxt(Gv[me+'>'+q])+'</td><td>'+grvTxt(Gv[q+'>'+me])+'</td><td class="lw-dipa">'+dipActs(me,q)+'</td></tr>'+(inc.length?'<tr><td></td><td colspan="5" class="lw-note">⚠ '+esc(inc.join('；'))+'</td></tr>':'');});o+='</table>';}
  var P=(G.dipP||[]).filter(function(q){return q.st==='open'&&(god||q.b===me||q.a===me);});
  if(P.length){o+='<h4>提議</h4><table class="lw-tbl">'+P.map(function(q){var inb=god||q.b===me,left=Math.max(0,7200-(G.t-q.t));return '<tr><td>'+sideTag(q.a)+' → '+sideTag(q.b)+'：'+DIPPK[q.k]+'<br><small>'+durTxt(G.t-q.t)+'前提出，'+(left>0?'再 '+durTxt(left)+'沒有回應就作罷':'即將作罷')+'</small></td><td>'+(inb&&q.b!==undefined&&(god||q.b===me)?'<button type="button" class="lw-btn sm pri" data-a="dipans" data-v="'+q.id+'" data-k="1">接受</button><button type="button" class="lw-btn sm" data-a="dipans" data-v="'+q.id+'" data-k="0">拒絕</button>':'<span class="lw-note">等待對方回應</span>')+'</td></tr>';}).join('')+'</table>';}
  var H=(G.dipH||[]).slice(-15).reverse();o+='<h4>外交紀錄</h4>'+(H.length?'<table class="lw-tbl">'+H.map(function(h){return '<tr><td style="white-space:nowrap;width:1%">'+esc(tTxt(h.t).slice(-11))+'</td><td>'+sideTag(h.a)+(h.r==='war'?' 向 ':' 與 ')+sideTag(h.b)+'：'+(h.r==='war'?'宣戰':h.r==='ally'?'結盟':h.o==='war'?'停火':'解除同盟')+(h.why?'<br><small>'+esc(h.why)+'</small>':'')+'</td></tr>';}).join('')+'</table>':'<div class="lw-note">還沒有外交事件。</div>');
  if(G.out&&Object.keys(G.out).length)o+='<div class="lw-note">已退出戰局：'+Object.keys(G.out).map(function(k){return esc(G.sides[+k].name)+'（開戰後 '+durTxt(G.out[k])+'兵力崩潰）';}).join('、')+'</div>';
  o+='<div class="lw-note">中立的各方互不開火、不算敵軍，但看得到彼此（地圖上以方框兵牌表示）。火力波及中立或同盟的部隊會留下積怨；AI 積怨夠深、本土被侵入超過三小時，或看見對方兵力大減時可能宣戰；戰況不利時會提議停火，有共同的強敵時會提議結盟。背棄同盟會讓國際聲望下降、雙方官兵士氣動搖。</div>';
  return o+'<div class="lw-row"><span class="lw-sp"></span><button type="button" class="lw-btn" data-a="x">關閉</button></div>';}
function dipRender(){if(!DIP.d)return;var box=DIP.d.firstChild;if(!box)return;var sc=box.scrollTop;box.innerHTML=dipHtml();box.scrollTop=sc;var me=mySide();DIP.k=[G.dipV||0,(G.dipP||[]).map(function(q){return q.id+q.st;}).join(),(G.dipH||[]).length,me,G.over?1:0,Object.keys(G.out||{}).length].join('|');}
ACT.dipdlg=function(){if(!triOn())return;if(DIP.d&&DIP.d.isConnected)DIP.d.remove();DIP.d=dlg(dipHtml(),true);DIP.d.classList.add('lw-dipdlg');dipRender();};
/* 動作：單機直接執行；聯機時送到伺服器（只能以本方名義） */
function dipDo(fn,a,done){if(triMp()){mpRpc(fn,a);toast('已送出，等待伺服器處理。');return;}var r=fn==='dipWar'?dipWar(a[0],a[1],a[2]):fn==='dipPropose'?dipPropose(a[0],a[1],a[2],'玩家'):fn==='dipAnsId'?dipAnsId(a[0],a[1],a[2]):null;if(done)done(r);dipRender();barRender();if(UI.tab==='battle'){btLeft(true);btStatus();}if(typeof vDraw==='function')vDraw(true);}
ACT.dipwar=function(b){var me=mySide(),o=+b.getAttribute('data-v');if(me===null)return;var ally=relOf(me,o)==='ally';if(!confirm((ally?'背棄與':'向')+G.sides[o].name+(ally?'的同盟並宣戰':'宣戰')+'？\n'+G.sides[o].name+'的部隊會立刻成為敵軍，雙方開始交火。'+(ally?'\n背棄同盟會讓國際聲望大降、雙方官兵士氣動搖。':'')))return;
  dipDo('dipWar',[me,o,ally?'背棄同盟':'玩家下令'],function(r){toast(r?'已向'+G.sides[o].name+'宣戰。':'無法宣戰。');});};
function dipProp(b,k){var me=mySide(),o=+b.getAttribute('data-v');if(me===null)return;dipDo('dipPropose',[me,o,k],function(P){if(!P){toast('無法提議（已有相同的提議，或雙方的關係不符）。');return;}if(k==='end'){toast('已解除與'+G.sides[o].name+'的同盟。');return;}
  toast(P.st==='ok'?G.sides[o].name+'接受'+DIPPK[k]+'。':P.st==='no'?G.sides[o].name+'拒絕'+DIPPK[k]+'。':'已向'+G.sides[o].name+'提議'+DIPPK[k]+'，等待回應。',6000);});}
ACT.dippeace=function(b){dipProp(b,'peace');};ACT.dipally=function(b){dipProp(b,'ally');};ACT.dipend=function(b){if(confirm('解除與'+G.sides[+b.getAttribute('data-v')].name+'的同盟（轉為中立）？'))dipProp(b,'end');};
ACT.dipans=function(b){var id=+b.getAttribute('data-v'),yes=b.getAttribute('data-k')==='1',P=dipFind(id),me=mySide();if(!P)return;
  if(me===null){if(triMp())return;dipAnswer(P,yes,'上帝視角');dipRender();barRender();return;}dipDo('dipAnsId',[me,id,yes],function(r){toast(r?(yes?'已接受':'已拒絕')+G.sides[P.a].name+'的'+DIPPK[P.k]+'提議。':'這個提議已經失效。');});};
CHG.dipset=function(t){var p=t.getAttribute('data-v').split('-'),a=+p[0],c=+p[1],r=t.value;if(triMp()||!DIPK[r]||!G.dip)return;if(!G.started){G.dip[a][c]=r;G.dip[c][a]=r;G.dipV=(G.dipV||0)+1;}else relSet(a,c,r,'上帝視角調整','上帝視角');dipRender();if(UI.tab==='orbat')obTree();if(typeof vDraw==='function')vDraw(true);};
/* ---------- 地圖：中立與同盟的部隊（不在敵情圖裡，記在 G.ctN） ---------- */
(function(){var b=visItems0;visItems0=function(lvl){var out=b.apply(this,arguments);if(!triOn()||seeAll()||UI.side<0||!G.ctN)return out;var N=G.ctN[UI.side],C=G.ct[UI.side]||{};if(!N)return out;
  for(var id in N){var c=N[id],age=G.t-c.t;if(age>2*3600||C[id]||triOut(c.side))continue;out.push({c:c,x:c.x,y:c.y,ech:c.q>=1?c.ech:-1,age:age,nt:1});}return out;};})();
/* 兵牌的身分：三方時依本方與對方的關係（交戰＝敵軍、同盟＝友軍、中立＝中立的方框） */
(function(){var b=symAffOf;symAffOf=function(o){if(!o.aff&&o.q!==0&&o.side>=0&&triOn()){var me=mySide();if(me!==null&&o.side!==me){var r=relOf(me,o.side);return r==='war'?'h':r==='ally'?'f':'n';}}return b(o);};})();
/* 點選中立或同盟的部隊：概況與外交 */
(function(){var b=btStatus;btStatus=function(){b.apply(this,arguments);if(!triOn()||!UI.selC||UI.side<0)return;if(G.ct[UI.side]&&G.ct[UI.side][UI.selC])return;var N=G.ctN&&G.ctN[UI.side],c=N&&N[UI.selC],el=btEl('bst');if(!c||!el)return;var r=relOf(UI.side,c.side);
  el.innerHTML='<h3 style="margin:0 0 6px;font-size:14px">'+esc(c.name||G.sides[c.side].name+'部隊')+'</h3><div class="lw-kv"><span>所屬</span><span>'+sideTag(c.side)+' '+relTag(r)+'</span><span>兵種</span><span>'+(c.q>=1?esc(BR[c.br]||''):'不明')+'</span><span>規模</span><span>'+(c.q>=1?ECH[clamp(c.ech,0,8)][1]+'級':'不明')+'，約 '+fmt(c.men)+' 人'+(c.veh?'、'+fmt(c.veh)+' 件裝備':'')+'</span><span>位置</span><span>'+esc(placeTxt(c.x,c.y))+'</span><span>看到</span><span>'+durTxt(G.t-c.t)+'前</span></div>'+
    '<div class="lw-note">'+(r==='ally'?'同盟的部隊：雙方共享情報、不會互相開火。':'中立的部隊：雙方互不開火，也不算敵軍。本方火力波及它會累積積怨；要攻擊必須先在「外交」宣戰。')+'</div><div class="lw-row"><button type="button" class="lw-btn sm" data-a="dipdlg">外交…</button></div>';};})();
/* ---------- 戰況總覽與戰報：外交關係、退出戰局與名次 ---------- */
function triRankTxt(){var O=G.over;if(!O||!O.rank)return '';return O.rank.map(function(i,k){return (k+1)+'. '+esc(G.sides[i].name)+'（'+score(i)+' 分'+(triOut(i)?'，已退出':'')+'）';}).join('、');}
(function(){var b=overview;overview=function(){var o=b();if(!triOn())return o;try{var me=mySide(),x='<div class="lw-kv lw-trikv">';
    if(me!==null)SIDES().forEach(function(q){if(q!==me)x+='<span>'+sideTag(q)+'</span><span>'+relTag(relOf(me,q))+(triOut(q)?'（已退出戰局）':'')+'</span>';});
    else SIDES().forEach(function(a){SIDES().forEach(function(c){if(c>a)x+='<span>'+sideTag(a)+' ↔ '+sideTag(c)+'</span><span>'+relTag(relOf(a,c))+'</span>';});});
    var n=G.started?dipPend(me).length:0;if(n)x+='<span>提議</span><span><button type="button" class="lw-btn sm" data-a="dipdlg">'+n+' 個提議等待回應</button></span>';if(G.over&&G.over.rank)x+='<span>名次</span><span>'+triRankTxt()+'</span>';x+='</div>';
    var i=o.indexOf('</h3>');if(i>=0)o=o.slice(0,i+5)+x+o.slice(i+5);}catch(e){}return o;};})();
(function(){var b=PAGES.rep;PAGES.rep=function(host){b(host);if(!triOn()||!G.over||!G.over.rank)return;var r=host.querySelector('.lw-card .lw-row');if(!r)return;var s=document.createElement('span');s.className='lw-note';s.innerHTML='名次：'+triRankTxt();r.appendChild(s);};})();
if(typeof HELP14!=='undefined')HELP14.push('<h4>三方作戰（三方對戰、3v3v3）</h4><ul>'+
  '<li>開始頁的「三方對戰」在快速想定加入第三方（綠軍）：開場關係（與兩軍中立、三方混戰、與其中一方同盟）、兵力規模、編成仿照哪一方、你扮演哪一方。對戰形式選 3 對 3 時三方各有三位指揮官。</li>'+
  '<li>任何作戰都可以在「兵力編成」按「＋第三方」加入，開戰前在第三方的頁面設定開場關係或移除第三方。</li>'+
  '<li>各方之間的關係是交戰、中立或同盟。只有交戰的對象算敵軍：中立的部隊互不開火，但看得到彼此（地圖上以方框兵牌表示，點選可看概況）；同盟之間共享情報。</li>'+
  '<li>「外交」面板（頂列或兵力編成）：宣戰、提議停火或結盟、解除同盟、回應對方的提議（兩小時內沒有回應就作罷），並列出積怨、領土侵入與外交紀錄。上帝視角可以直接改變任兩方的關係。</li>'+
  '<li>火力波及中立或同盟的部隊會留下積怨；AI 積怨夠深、本土被侵入三小時以上，或看見對方兵力大減時可能宣戰。背棄同盟會讓國際聲望下降、雙方官兵士氣動搖。</li>'+
  '<li>兵力崩潰的一方退出戰局，其餘各方繼續作戰；最後只剩一方或時間到時依分數排名。</li></ul>');
