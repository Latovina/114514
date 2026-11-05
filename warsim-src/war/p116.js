/* ===================== 交戰守則（介面）：守則面板、作戰畫面與兵力編成的入口、核武下令前的授權檢查、霧中的難民、誤擊事件的戰報、設定、說明、對話 ===================== */
(function(){var st=document.createElement('style');st.textContent='.lw-roe .lw-roek{margin:8px 0;padding:6px 8px;border:1px solid rgba(0,0,0,.14);border-radius:8px}.lw-roe .lw-roek>b{display:block;margin-bottom:3px}'+
  '.lw-roe label.lw-roeo{display:flex;gap:6px;align-items:flex-start;margin:3px 0;cursor:pointer}.lw-roe label.lw-roeo small{display:block;color:#666;font-size:11px}.lw-roe .lw-roek.wmd{border-color:rgba(183,28,28,.4);background:rgba(183,28,28,.04)}'+
  '.lw-roe .lw-roea{font-size:12px;color:#444;margin:2px 0 4px}';document.head.appendChild(st);})();
var ROEU={side:0};
/* 本場配備的核武與化生放（單機時可以直接在這裡開啟；聯機由房主在設定中決定） */
function roeAvail(k,side){var mp=typeof mpActive==='function'&&mpActive(),y=G.set.y||1943;
  if(k==='cb'){if(G.set.cbrn===false)return '<div class="lw-roea">本場未啟用化生放作戰。'+(mp?'（由房主在設定中決定）':'<label><input type="checkbox" data-c="roecbo"> 啟用化生放作戰</label>')+'</div>';return '';}
  if(k!=='nk')return '';var N=G.set.nuke||{},ny=typeof featY==='function'?featY('nuke'):1945,tacY=y>=ny,strY=typeof featOn==='function'?featOn('snuke'):y>=1945,o=[];
  if(N.on)o.push('本場配備戰術核武：每方 '+fmt(N.n===undefined?2:N.n)+' 枚'+(G.started&&G.sides[side]?'（剩 '+fmt(nukeLeft(side))+' 枚）':''));
  if(typeof snkOn==='function'&&snkOn())o.push('戰略核武：每方 '+fmt((G.set.snuke||{}).n||2)+' 枚'+(G.started&&G.sides[side]?'（剩 '+fmt(snkLeft(side))+' 枚）':''));
  if(!mp){if(tacY)o.push('<label><input type="checkbox" data-c="roenka" data-f="tac"'+(N.on?' checked':'')+'> 本場配備戰術核武</label>');if(strY)o.push('<label><input type="checkbox" data-c="roenka" data-f="str"'+((G.set.snuke||{}).on?' checked':'')+'> 本場配備戰略核武</label>');}
  else if(!nkAvail())o.push('本場未配備核武（由房主在設定中決定）');
  if(!tacY&&!strY)o.push(y+' 年還沒有核武');return '<div class="lw-roea">'+o.join('　')+'</div>';}
/* 本方已知的誤擊平民事件 */
function roeMisHtml(side){var L=(G.mis||[]).filter(function(I){return I.side===side;});if(!L.length)return '<div class="lw-note">還沒有已知的誤擊平民事件。</div>';var d=0;L.forEach(function(I){d+=I.dead;});
  return '<div class="lw-note"><b>已知的誤擊平民事件 '+L.length+' 起</b>，約 '+fmt(d)+' 人死亡（最近五起）：</div>'+L.slice(-5).reverse().map(function(I){return '<div class="lw-note">・'+tTxt(I.t).slice(-11)+' '+esc(I.un)+'在'+esc(placeTxt(I.x,I.y))+'：'+esc(I.who)+'，'+fmt(I.dead)+' 死 '+fmt(I.wnd)+' 傷'+((I.why||[]).length?'（'+esc(I.why.join('、'))+'）':'')+(I.wc?' <b style="color:#b3261e">無差別攻擊</b>':'')+'</div>';}).join('');}
function roeDlgHtml(side){var S=G.sides[side],god=mySide()===null,o='<h3 style="margin:0 0 6px">⚖ 交戰守則'+(S?'：'+esc(S.name):'')+'</h3>';
  if(god)o+='<div class="lw-row">'+SIDES().map(function(s){return '<button type="button" class="lw-btn sm'+(s===side?' pri':'')+'" data-a="roeside" data-v="'+s+'">'+esc(G.sides[s].name)+'</button>';}).join('')+'</div>';
  o+='<div class="lw-note">全軍的常設命令：命令裡的「交戰規則」可以個別覆寫開火原則。開戰後的變更記入日誌與決策紀錄。看得到不等於認得出：在認不清的距離外，前線附近的難民與村民可能被誤認為敵軍。</div>';
  ['w','ind','pop','cb','nk'].forEach(function(k){var T=ROEK[k],v=roeGet(side,k);o+='<div class="lw-roek'+(k==='cb'||k==='nk'?' wmd':'')+'"><b>'+T[0]+'</b>'+roeAvail(k,side)+T[1].map(function(q){return '<label class="lw-roeo"><input type="radio" name="roe-'+k+'-'+side+'" data-c="roe" data-f="'+k+'" data-s="'+side+'" value="'+q[0]+'"'+(q[0]===v?' checked':'')+'><span>'+esc(q[1])+'<small>'+esc(q[2]||'')+'</small></span></label>';}).join('')+'</div>';});
  return o+roeMisHtml(side)+'<div class="lw-row" style="margin-top:8px"><button type="button" class="lw-btn sm" data-a="x">關閉</button></div>';}
function roeDlg(side){document.querySelectorAll('.lw-dlg.lw-roedlg').forEach(function(d){d.remove();});if(!(side>=0))side=mySide()!==null?mySide():ROEU.side||0;ROEU.side=side;var d=dlg('<div class="lw-roe" data-k="roebody">'+roeDlgHtml(side)+'</div>');d.classList.add('lw-roedlg');return d;}
function roeRefresh(){var b=document.querySelector('.lw-roedlg [data-k="roebody"]');if(b)b.innerHTML=roeDlgHtml(ROEU.side);}
ACT.roedlg=function(b){var v=b&&b.getAttribute?b.getAttribute('data-v'):null;roeDlg(v!==null&&v!==''?+v:undefined);};
ACT.roeside=function(b){ROEU.side=+b.getAttribute('data-v');roeRefresh();};
/* 授權核武與化生放武器要再確認一次 */
CHG.roe=function(t){var k=t.getAttribute('data-f'),side=+t.getAttribute('data-s'),v=t.value;if(!(side>=0)||!ROEK[k])return;
  if((k==='nk'||k==='cb')&&v!=='no'&&roeGet(side,k)!==v){var msg=k==='nk'?(v==='retal'?'授權在遭到核攻擊後以核武報復？':'授權使用'+(v==='all'?'戰術與戰略':'戰術')+'核武？\n\n核爆會在瞬間殺死範圍內的平民與部隊，留下廢墟與放射性落塵；使用會記入戰爭紀錄。')
      :'授權'+(v==='retal'?'在敵方使用後以':'使用')+'化學與生物武器？\n\n毒劑隨風漂移，平民與本方部隊都可能受害；依年代違反國際法。';if(!window.confirm(msg)){roeRefresh();return;}}
  if(typeof mpActive==='function'&&mpActive()){if(k==='cb')polSide(side).cbrn=v;else{var S=SD(side);(S.roe||(S.roe={}))[k]=v;}}
  var r=roeSet(side,k,v,'玩家');if(r&&r.err)toast(r.err);roeRefresh();if(UI.panelTick)UI.panelTick(true);};
CHG.roenka=function(t){if(typeof mpActive==='function'&&mpActive())return;if(t.getAttribute('data-f')==='tac'){var N=G.set.nuke||(G.set.nuke={on:false,n:2,y:10,ai:false});N.on=t.checked;}else{var SN=G.set.snuke||(G.set.snuke={on:false,n:2,ai:0});SN.on=t.checked;}roeRefresh();};
CHG.roecbo=function(t){if(typeof mpActive==='function'&&mpActive())return;G.set.cbrn=t.checked;roeRefresh();};
if(typeof mpWrapFn==='function')roeSet=mpWrapFn('roeSet',roeSet);
/* ---------- 入口：作戰畫面左側、兵力編成的陣營政策 ---------- */
(function(){var b=PAGES.battle;PAGES.battle=function(host){b(host);if(!G)return;var ph=host.querySelector('.lw-left .lw-ph');if(!ph||ph.querySelector('[data-a="roedlg"]'))return;var bt=document.createElement('button');bt.type='button';bt.className='lw-btn sm';bt.setAttribute('data-a','roedlg');
  bt.title='交戰守則：開火原則、間接火力、人口密集區、化生放與核武的授權';bt.textContent='⚖ 交戰守則';ph.appendChild(bt);};})();
(function(){var b=sideV4Html;sideV4Html=function(side){var o=b(side),h='<span>交戰守則</span><span>'+esc(roeTxt(side,'w'))+'・'+esc(roeTxt(side,'ind'))+'・核武'+esc(roeTxt(side,'nk'))+' <button type="button" class="lw-btn sm" data-a="roedlg" data-v="'+side+'">設定…</button></span>';
  var i=o.indexOf('<span>投降</span>');return i>=0?o.slice(0,i)+h+o.slice(i):o+h;};})();
/* ---------- 核武：下令前檢查授權 ---------- */
(function(){var b=issueSel;issueSel=function(k){if(k==='nuke'&&G.started){var us=UI.sel.map(uById).filter(Boolean),side=mySide()!==null?mySide():us[0]?us[0].side:0;if(!roeNkOk(side,'tac')){toast('交戰守則未授權使用核武（目前：'+roeTxt(side,'nk')+'）。',5000);roeDlg(side);return;}}return b.apply(this,arguments);};})();
(function(){var b=ACT.snkdlg;ACT.snkdlg=function(){var side=mySide()!==null?mySide():SNK.side||0;if(G.started&&!roeNkOk(side,'str')){toast('交戰守則未授權使用戰略核武（目前：'+roeTxt(side,'nk')+'）。',5000);roeDlg(side);return;}return b.apply(this,arguments);};})();
/* ---------- 霧中的難民：認得出是平民才畫成難民（認不出的人影只會以「敵軍」出現在情報圖上——如果被誤判的話） ---------- */
(function(){var b=civRSeen;civRSeen=function(Q,me){if(!G.started||G.set.misid===false||G.set.civ===false)return b(Q,me);var I=Q.ids;return !!(I&&I[me]!==undefined&&G.t-I[me]<1800);};})();
/* 上帝視角：標出被誤判為敵軍的難民隊伍與村落 */
function fkDraw(c){c.save();c.setLineDash([4,3]);c.lineWidth=1.5;c.font='bold 10px sans-serif';c.textAlign='center';G.fk.forEach(function(P){if(P.done||P.st!=='mis')return;var p=w2s(P.x,P.y);c.strokeStyle=sideCol(P.side);c.beginPath();c.arc(p[0],p[1],11,0,2*PI);c.stroke();c.fillStyle=sideCol(P.side);c.fillText('誤判',p[0],p[1]-15);});c.setLineDash([]);c.restore();}
(function(){var b=drawUnder;drawUnder=function(c){try{if(G&&G.started&&!G.replay&&G.fk&&G.fk.length&&seeAll())fkDraw(c);}catch(e){}b.apply(this,arguments);};})();
/* ---------- 戰報：誤擊平民事件 ---------- */
(function(){var b=v4RepHtml;v4RepHtml=function(){var o=b.apply(this,arguments);if(REP4.tab!=='crime')return o;var me=mySide(),L=(G.mis||[]).filter(function(I){return me===null||I.side===me||I.kn&&I.kn[me];});
  var h='<h4 style="margin:12px 0 4px;font-size:13px">誤擊平民（誤判為敵軍）</h4>'+(L.length?'<table class="lw-tbl lw-tblc"><tr><th>時間</th><th>部隊</th><th>地點</th><th>對象</th><th class="n">死亡</th><th class="n">受傷</th><th>原因</th><th>性質</th></tr>'+L.slice(-60).reverse().map(function(I){
    return '<tr><td>'+tTxt(I.t).slice(-11)+'</td><td><span style="color:'+G.sides[I.side].color+'">'+esc(I.un)+'</span></td><td>'+esc(placeTxt(I.x,I.y))+'</td><td>'+esc(I.who)+'</td><td class="n">'+fmt(I.dead)+'</td><td class="n">'+fmt(I.wnd)+'</td><td>'+esc((I.why||[]).join('、')||'—')+'</td><td>'+(I.wc?'無差別攻擊（戰爭罪）':'誤擊事件')+(I.pub?'・已見報':'')+'</td></tr>';}).join('')+'</table>':'<div class="lw-note">沒有已知的誤擊平民事件。</div>');
  var i=o.lastIndexOf('</div>');return i>=0?o.slice(0,i)+h+o.slice(i):o+h;};})();
/* ---------- 設定、自動暫停、說明 ---------- */
setSec('combat','misid',{t:'誤判平民',o:27,h:function(){return setOpt(setRow('誤判平民',setChk('setb','misid',G.set.misid!==false,'前線附近的難民隊伍與村民，在認不清的距離外可能被誤認為敵軍；開火、砲擊或空襲落在他們身上就是誤擊平民。關閉後部隊總是認得出平民')))+
  '<div class="lw-note">交戰守則（開火原則、間接火力、人口密集區、化生放與核武的授權）在作戰畫面左側的「⚖ 交戰守則」，開戰前在兵力編成的陣營政策。</div>';}});
if(typeof APK!=='undefined')APK[2][1].push(['misid','誤擊平民（部隊發現開火的對象是平民）']);
if(typeof HELP14!=='undefined')HELP14.push('<h4>交戰守則與誤判平民</h4><ul>'+
  '<li><b>交戰守則</b>（作戰畫面左側「⚖ 交戰守則」，開戰前在兵力編成的陣營政策）是全軍的常設命令。<b>開火原則</b>：主動開火（發現疑似敵軍就打，反應最快，最容易誤擊平民與友軍）、<b>辨識後開火</b>（預設：確認是敵軍才開火，遭到射擊立即還擊）、僅還擊。命令裡的「交戰規則」可以個別覆寫，預設「依交戰守則」。</li>'+
  '<li><b>辨識</b>：看得到不等於認得出。車輛比步兵好認；夜間（有夜視器材好一些）、霧、雨會縮短辨識距離，偵察部隊看得較清楚。距離外的目標要觀察一段時間、或友軍已確認、或對方先開火，辨識後開火的部隊才會射擊。</li>'+
  '<li><b>間接火力與空中攻擊</b>：只攻擊已辨識的目標（預設），或也攻擊疑似目標。<b>人口密集區</b>：須確認敵軍據守才可砲擊（預設）、不限制、或完全禁止砲擊有居民的聚落（砲兵到了目標會停火）。</li>'+
  '<li><b>化生放武器與核武</b>的授權也在這裡：禁止、僅限報復（敵方先用之後）、授權（核武分戰術與全面）。沒授權時下令核打擊會被拒絕，電腦也照守則行事。單機時可以直接在面板開啟本場的核武與化生放作戰。授權的變更記入決策紀錄。</li>'+
  '<li><b>誤判平民</b>：前線附近的難民隊伍與村落裡的人影，在認不清的距離外可能被當成敵軍，出現在情報圖上的敵軍和真的一模一樣。恐懼、疲憊、訓練不足、夜間與壞天氣、剛遭射擊、人群朝陣地走來、嚴酷的平民政策、從飛機上看，都讓誤判更常發生；辨識後開火的部隊夜裡會先喊話、鳴槍示警。</li>'+
  '<li>開火、砲擊或空襲落在他們身上，就是<b>誤擊平民</b>：部隊靠近或找到屍體才知道真相，士氣下降、心生愧疚，事件記入戰報（軍紀與戰爭罪行）並可能見報；主動開火、未經辨識造成的誤擊記為無差別攻擊。霧中只有認得出是平民的難民隊伍才會畫成難民。</li></ul>');
/* ---------- 對話 ---------- */
VOXN.pidwait=['辨識目標','等待確認是不是敵軍'];VOXN.warnshot=['喊話示警','夜裡攔下接近陣地的人群'];VOXN.misid=['誤擊平民','發現開火的對象是平民'];VOXCAT.push(['交戰守則',['pidwait','warnshot','misid']]);
VOXD.pidwait=['看清楚再打','還不能確定是誰','等他們再近一點','是敵人還是老百姓？','望遠鏡給我','沒確認不准開火','[n]什麼都看不清','[!]要等到什麼時候？','手指離開扳機','先別動'];
VOXD.warnshot=['站住！口令！','再過來就開槍了','鳴槍示警！','舉起手來！','慢慢走過來','是老百姓，放他們過','[n]誰在那裡？','別緊張，別緊張','叫他們停下','手放在看得到的地方'];
VOXD.misid=['那些是……老百姓？','停火！是平民！','裡面有小孩……','我們打錯人了','誰先開的槍？','[!]我不是故意的','[!]我看不清楚啊','[~]把傷者抬過來','[n]黑成這樣怎麼分得清','叫醫護兵過來！','這要怎麼交代','他們只是在逃難'];
VOXP.rough.pidwait=['到底打不打啦','看不清楚啊*的','再靠近一點我就……','憋死我了','別手癢','等一下，等一下'];VOXP.pro.pidwait=['目標未確認，暫停射擊','持續觀察','請求確認身分','保持射界，等待命令','辨識中','未經確認不得開火'];
VOXP.rough.warnshot=['喂！站住！','再走一步試試看','嚇死人了，是老百姓','往天上開一槍','滾回去！','靠，差點就開槍了'];VOXP.pro.warnshot=['停止前進！','鳴槍示警','檢查身分','人員為平民，放行','保持距離','搜身後放行'];
VOXP.rough.misid=['*的，是老百姓！','完了完了，打到人了','誰叫他們亂跑的……','靠，我們幹了什麼','別看了，別看了','這下怎麼辦啦'];VOXP.pro.misid=['停火，目標為平民','回報：誤擊平民','請求醫療後送','標記地點，保留現場','向上級報告事件','清點傷亡'];VOX.P=null;VOX.PS=null;
(function(){var b=voxDetect;voxDetect=function(u,P,N,s){var r=b(u,P,N,s);N.misC=u.misC||0;N.wsC=u.wsC||0;N.pidC=u.pidC||0;if(r||P.misC===undefined)return r;
  if(N.misC>P.misC)return ['misid',3];if(N.wsC>P.wsC)return ['warnshot',2];if(N.pidC>P.pidC)return ['pidwait',1];return null;};})();
