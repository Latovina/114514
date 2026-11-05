/* ===================== 支援裝備效果與醫療、CBRN 物資：單位後勤面板、狀態列、後勤頁卡片、說明 ===================== */
/* 單位的裝備效果：只列出與標準配備不同的項目 */
function eqFxList(u){var F=eqF2(u),o=[];if(!F)return o;var x=function(v){return '×'+fx(v,2);};
  if(F.mF!==1)o.push('槍彈殺傷 '+x(F.mF));if(F.mA!==1)o.push('破片殺傷 '+x(F.mA));if(F.kc)o.push('對聚能裝甲 '+(F.kc>0?'＋':'')+fx(F.kc,1));if(F.kk)o.push('對動能裝甲 '+(F.kk>0?'＋':'')+fx(F.kk,1));
  if(F.art!==1)o.push('砲兵系統誤差 '+x(F.art));if(F.acc!==1)o.push('直射命中 '+x(F.acc));if(F.jam!==1)o.push('受無人機攻擊 '+x(F.jam));
  var c=F.cq;if(c){if(!c.ok)o.push('沒有無線電：只能用有線電話與傳令');else{if(c.s!==1)o.push('通信時間 '+x(c.s));if(c.r!==1)o.push('無線電距離 '+x(c.r));if(c.j!==1)o.push('受干擾 '+x(c.j));}}
  if(F.spm!==1)o.push('觀測距離 '+x(F.spm));if(F.cb)o.push('反砲兵雷達：40 公里內定位敵砲兵的時間減為四成');
  if(F.du!==1)o.push('傷重不治 '+x(F.du));if(F.ev>0)o.push('救護車：後送範圍 ×1.3');if(F.mq)o.push('醫療品質 '+(F.mq>0?'＋':'－')+pct(Math.abs(F.mq)*100));
  if(F.hr)o.push(F.hr>0?'自備野戰廚房：有熱食':'沒有野戰廚房：只有冷食');if(F.pr)o.push(F.pr>0?'自備淨水設備：水媒疾病與飲水運量減半':'沒有淨水設備：水媒疾病增加');
  if(F.gmr!==1)o.push('防毒面具配發 '+x(F.gmr));if(F.gsr!==1)o.push('防護服配發 '+x(F.gsr));if(F.dt)o.push(F.dt>0?'毒劑偵檢器：提早警報':'沒有毒劑偵檢器：警報較慢');
  if(F.atA!==F.atB)o.push('解毒針配發 '+pct(F.atA*100));if(F.dk>0)o.push('除污車：可就地除污、範圍 ×1.5');
  if(F.mr)o.push('掃雷滾輪：行進時開闢雷區通路');if(F.dg!==1)o.push('構工、挖掘與修路 '+x(F.dg));return o;}
function supTxt(v,cap,s){return fmt(v)+'／'+fmt(cap)+' 公斤'+(s>=1?'（用罄）':s>0?'（不足）':'');}
function supRows(u){var L=supL(u);if(!L)return '';var o='',bad=' style="color:#b3261e"';if(L.medCap>0){var s=medShort(L);o+='<span>醫療物資</span><span'+(s>0?bad:'')+'>'+supTxt(L.med,L.medCap,s)+'</span>';}
  if(L.cbrCap>0){var c=cbrShort(L);o+='<span>CBRN 物資</span><span'+(c>0?bad:'')+'>'+supTxt(L.cbr,L.cbrCap,c)+'</span>';}return o?'<div class="lw-kv lw-supkv">'+o+'</div>':'';}
(function(){var b=lgUnitHtml;lgUnitHtml=function(u){var o=b(u);if(!o||!u||!u.lg)return o;var L=eqFxList(u);return o+supRows(u)+(L.length?'<div class="lw-note lw-eqfx">裝備效果（與標準配備相比）：'+esc(L.join('；'))+'</div>':'');};})();
/* 狀態列：本方單位物資不足時提醒 */
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);try{if(leaf&&u&&u.lg&&(seeAll()||u.side===UI.side)){var S=u.lg,m=medShort(S),c=S.cbrCap>0&&(u.cbg||(SD(u.side).mopp||0)>=2)?cbrShort(S):0;
  if(m>0||c>0)o+='<span>物資</span><span style="color:#b3261e">'+[m>0?'醫療物資'+(m>=1?'用罄':'不足'):'',c>0?'CBRN 物資'+(c>=1?'用罄':'不足'):''].filter(Boolean).join('、')+'</span>';}}catch(e){}return o;};})();
/* 後勤頁：醫療與 CBRN 物資卡片 */
function supCard(side){var t={m:0,mc:0,c:0,cc:0,ms:0,cs:0,wia:0,sick:0};G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||!alive(u)||u.st==='off'||!u.lg)return;var L=supL(u);t.m+=L.med;t.mc+=L.medCap;t.c+=L.cbr;t.cc+=L.cbrCap;if(medShort(L)>0)t.ms++;if(cbrShort(L)>0)t.cs++;t.wia+=u.wia||0;t.sick+=u.sick||0;});
  var C=G.cost&&G.cost[side]||{},row=function(n,v,cap,used,bad){return '<tr><td>'+n+'</td><td class="n">'+fx(v/1000,2)+'</td><td class="n">'+fx(cap/1000,2)+'</td><td class="n">'+fx(used/1000,2)+'</td><td class="n">'+(bad?'<span style="color:#b3261e">'+bad+'</span>':'0')+'</td></tr>';};
  return '<div class="lw-card lw-supcard"><h3>醫療與 CBRN 物資<small>與糧秣同一類別運補</small></h3><table class="lw-tbl"><tr><th>類別</th><th class="n">存量（噸）</th><th class="n">上限（噸）</th><th class="n">已用（噸）</th><th class="n">不足的單位</th></tr>'+
    row('醫療物資',t.m,t.mc,C.medKg||0,t.ms)+(t.cc>0||C.cbrKg>0?row('CBRN 物資',t.c,t.cc,C.cbrKg||0,t.cs):'')+'</table>'+
    '<div class="lw-note">候送傷患約 '+fmt(t.wia)+' 人、病患約 '+fmt(t.sick)+' 人。醫療物資用於急救、醫療單位手術、病患用藥與日常醫務，不足時傷重不治與病死增加、手術後歸隊減少；CBRN 物資用於更換濾毒罐、防護服、除污與解毒針，不足時防護變差、除污變慢。</div></div>';}
(function(){var b=PAGES.logi;PAGES.logi=function(host){b(host);try{var g=host.querySelector('.lw-grid');if(g)g.insertAdjacentHTML('beforeend',supCard(LG.side));}catch(e){}};})();
HELP14.push('<h4>支援裝備的效果、醫療與 CBRN 物資</h4><ul><li>每一件支援裝備都有作用，效果相對於該兵種在該年代的標準配備：標準配備的部隊與過去相同，多配或升級就更強，少配就更弱。單位的「後勤」會列出與標準配備不同的效果。</li>'+
  '<li><b>通信</b>：背負式無線電、數位跳頻無線電、戰場管理系統、衛星通訊終端與中繼站改變命令與情報的傳遞時間（最快 0.6 倍、最慢 1.5 倍）、無線電距離（0.5～2.5 倍）與受電子干擾的程度；一條通信線路以較差的一端為準。拿掉無線電的單位只能靠有線電話與傳令；無線電年代以前，兩端都配了無線電也能通聯。</li>'+
  '<li><b>觀測</b>：偵察無人機、地面監視雷達、戰場管理系統增加觀測距離（0.7～1.6 倍）；反砲兵雷達讓 40 公里內的敵砲兵更快被定位。</li>'+
  '<li><b>醫療</b>：急救包與止血帶、救護車降低傷重不治，救護車也擴大後送範圍；野戰手術組提高醫療單位的品質。<b>醫療物資</b>存在每個單位（依人數與年代），醫療單位另有手術用量：受傷當下急救、醫療單位收治、病患用藥與日常醫務都會消耗；不足時傷重不治與病死增加、痊癒與手術後歸隊減少。</li>'+
  '<li><b>CBRN</b>：防毒面具與防護服的配發率決定防護；化學偵檢器讓部隊更早戴上面具；神經毒劑解毒針減少神經毒劑傷亡；除污車讓任何單位都能就地除污，範圍大一半。<b>CBRN 物資</b>用於更換濾毒罐、防護服（防護等級 2 以上會磨損，受污染時一天內就得換新）、除污與解毒針；用罄時防護服漏氣、除污只有一半的效果。</li>'+
  '<li><b>工兵與後勤</b>：推土鏟加快挖掘、構工與修路；掃雷滾輪在行進時開闢經過的雷區；野戰廚房提供熱食（士氣較好）；淨水設備讓水媒疾病（痢疾、霍亂、傷寒）減半，乾燥地區的飲水運量也減半。</li>'+
  '<li>醫療與 CBRN 物資與糧秣同一個運補類別：補給節點與補給部隊的「糧秣」也包含這兩類，用量計入「戰報 → 戰爭花費」。後勤頁的「醫療與 CBRN 物資」卡片列出存量、已用量與不足的單位。</li></ul>');
(function(){var st=document.createElement('style');st.textContent='.lw-eqfx{margin-top:4px;line-height:1.5}.lw-supcard .lw-tbl td,.lw-supcard .lw-tbl th{white-space:nowrap}';document.head.appendChild(st);})();
