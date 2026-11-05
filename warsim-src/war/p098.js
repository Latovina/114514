/* ===================== 補員與醫療（介面）：設定頁的補員速度、後勤頁的「補員與醫療」卡片、部隊狀態的補充與傷患 ===================== */
setSec('logi','repl',{t:'補員',o:5,h:function(){var S=G.set;return setOpt(setRow('補員速度',setSel('setv','replSpd',[[0.5,'慢（0.5 倍）'],[1,'標準'],[2,'快（2 倍）'],[3,'很快（3 倍）']],S.replSpd===undefined?1:S.replSpd))+
  '<div class="lw-note">脫離接觸一小時以上、在補給線內的部隊自動補充兵員與修復車輛；預備隊、休整與輪替整補的部隊最快，離補給節點越遠越慢。醫療單位收治的輕傷約 12 小時後歸隊。需要「規則」的「長期作戰」開啟。</div>');}});
/* 部隊現在能不能補人；能的話每小時約補多少 */
function replNow(u){var S=SD(u.side);if(G.set.sustain===false)return ['未開啟長期作戰',0];if(!isLeaf(u)||u.men>=u.men0-0.5)return ['滿編',0];if(!u.insup)return ['脫離補給線，無法補充',0];
  var c=Math.min(G.t-(u.uf||-1e9),G.t-(u.fired||-1e9));if(c<3600)return ['接敵中，脫離接觸 '+durTxt(3600-c)+' 後開始補充',0];
  if(!replHub(u.side))return ['沒有通往後方的補給樞紐，兵員送不上來',0];if(!(S.repl>0.5))return ['補充兵員池已用完',0];return ['補充中',u.men0*replRate(u)*replNear(u)*replMul()];}
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);if(!leaf||!G||!G.started||G.replay)return o;var me=mySide();if(me!==null&&u.side!==me)return o;
  if(u.men<u.men0-0.5){var r=replNow(u);o+='<span>補員</span><span>'+esc(r[0])+(r[1]>0?'（每小時約 '+fmt(r[1],1)+' 名）':'')+'</span>';}
  if(u.wia>0.5||u.rtd>0.5)o+='<span>傷患</span><span>'+(u.wia>0.5?'待後送 '+fmt(u.wia)+' 名':'')+(u.rtd>0.5?(u.wia>0.5?'、':'')+'治癒歸隊 '+fmt(u.rtd)+' 名':'')+'</span>';return o;};})();
/* 後勤頁：補員與醫療 */
function replCard(side){var S=SD(side),M=medStat(side),wait=0,med=0,lt=0,hos=0,lo=[];G.units.forEach(function(u){if(u.side!==side||!isLeaf(u))return;if(u.wia>0)wait+=u.wia;(u.pat||[]).forEach(function(p){med+=p.n;if(p.l)lt+=p.n;});
    if(alive(u)&&u.st!=='off'&&!u.irr&&u.men0>0&&ST(u).dom==='land')lo.push(u);});(G.fac||[]).forEach(function(F){if(F.k==='hosp'&&F.own===side)(F.pat||[]).forEach(function(p){hos+=p.n;});});
  lo.sort(function(a,b){return strFrac(a)-strFrac(b);});lo=lo.slice(0,8).filter(function(u){return strFrac(u)<0.9;});var hub=replHub(side);
  return '<div class="lw-card lw-repl"><h3>補員與醫療<small>'+(G.set.sustain===false?'未開啟長期作戰':'補員速度 '+fx(replMul(),1)+' 倍')+'</small></h3>'+
    '<div class="lw-opt"><span>補充兵員池</span><span>'+(S.repl===undefined?'開戰後建立':fmt(S.repl)+' 名'+(hub?'（每日補進約 '+fmt((S.replIn||0)*24*replMul())+' 名）':'（<b style="color:#b3261e">沒有通往後方的補給樞紐</b>，無法補進）'))+'</span>'+
    '<span>本場已補充</span><span>補充兵 '+fmt(S.replT||0)+' 名、修復車輛 '+fmt(S.vrepT||0,1)+' 輛</span>'+
    '<span>傷患</span><span>待後送 '+fmt(wait)+' 名、醫療單位收治 '+fmt(med)+' 名（其中輕傷 '+fmt(lt)+' 名）、醫院 '+fmt(hos)+' 名</span>'+
    '<span>治癒歸隊</span><span>'+fmt(M.rtd||0)+' 名（傷重不治 '+fmt(M.dow||0)+' 名）</span></div>'+
    (lo.length?'<table class="lw-tbl"><tr><th>兵力最低的部隊</th><th class="n">兵力</th><th>補員</th></tr>'+lo.map(function(u){var r=replNow(u);return '<tr class="cl" data-a="lgunit" data-v="'+u.id+'"><td>'+esc(uName(u))+'</td><td class="n">'+pct(strFrac(u)*100)+'</td><td>'+esc(r[0])+(r[1]>0?'（每小時 '+fmt(r[1],1)+' 名）':'')+'</td></tr>';}).join('')+'</table>':'')+
    '<div class="lw-note">脫離接觸一小時以上、在補給線內的部隊自動補人與修車；下達「預備隊」或「休整」的部隊補得最快。</div></div>';}
(function(){var b=PAGES.logi;PAGES.logi=function(host){b.apply(this,arguments);try{if(!G||!G.started)return;var g=host.querySelector('.lw-grid');if(g)g.insertAdjacentHTML('beforeend',replCard(LG.side));}catch(e){if(window.console)console.warn('replCard',e);}};})();
