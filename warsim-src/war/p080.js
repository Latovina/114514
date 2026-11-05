/* ===================== 地標的介面：圖示與說明、放大後才顯示的小型地標、工業區與公園的名稱、核電站管制區、說明 ===================== */
Object.assign(NODEI,{npp:'☢',univ:'🎓',school:'🏫',prim:'✏',police:'🚓',fire:'🚒',tower:'🏢',hall:'🏛',stad:'🏟',museum:'🏺'});
Object.assign(FACU,{npp:'核能發電廠：1977 年起受日內瓦公約第一附加議定書保護；受損嚴重時爐心熔毀，放射性物質順風外洩、長期污染地面，周圍居民撤離',
  univ:'大學：受保護的教育建築（攻擊是戰爭罪行），居民可以在此避難',school:'中學：受保護的教育建築，居民可以在此避難',prim:'小學：受保護的教育建築，居民可以在此避難',
  police:'警察局：存有輕武器彈藥，佔領後成為小型彈藥補給點；控制的一方在附近的部隊比較少發生搶劫與傷害平民的事件',fire:'消防局：附近的大火較快撲滅（不論由誰控制，被摧毀就沒有了）',
  tower:'商業大樓：高樓，佔據的部隊視野更遠（依樓高）',hall:'市政廳：佔領後當地的行政恢復運作，動盪較快平息',stad:'體育場：大型避難與集結場所',museum:'博物館：受 1954 年文化財產公約保護，攻擊是戰爭罪行'});
/* 地標依縮放分級顯示，避免縮小時擠成一團：市政廳、大學、體育場、博物館與商業大樓在每像素 40 公尺以內顯示，警察局、消防局與學校在 20 公尺以內；
   每像素 12 公尺以上只畫小圖示，更近才標名稱。被摧毀、起火的標記也跟著隱藏。 */
var LMKMINOR={univ:40,hall:40,stad:40,museum:40,tower:40,police:20,fire:20,school:20,prim:20};
function lmkShow(F,m){var t=LMKMINOR[F.k];return !t||m<t;}
(function(){var b=drawFac;drawFac=function(c){var m=mpp();if(m<12)return b(c);var fl=facList,me=UI.side,L=fl();facList=function(){return fl().filter(function(F){return !LMKMINOR[F.k];});};try{b(c);}finally{facList=fl;}
  c.save();c.textAlign='center';c.textBaseline='middle';c.font='10px sans-serif';
  L.forEach(function(F){if(!LMKMINOR[F.k])return;F._sx=undefined;if(!lmkShow(F,m))return;var v=facView(F);if(v>=0&&(me<0||seeAll()||v===me)&&facNode(F))return;var p=w2s(F.x,F.y);if(p[0]<-20||p[1]<-20||p[0]>VW.cw+20||p[1]>VW.ch+20)return;var col=v>=0?sideCol(v):'#6E6E6E';
    c.fillStyle='rgba(255,255,255,.85)';c.strokeStyle=col;c.lineWidth=1.3;c.setLineDash(v>=0?[]:[3,2]);c.beginPath();c.rect(p[0]-7,p[1]-7,14,14);c.fill();c.stroke();c.setLineDash([]);c.fillStyle=col;c.fillText(NODEI[F.k]||'■',p[0],p[1]+1);
    if(F.cand>=0&&F.cand!==F.own&&G.started&&(me<0||seeAll()||F.cand===me)){c.strokeStyle=sideCol(F.cand);c.lineWidth=2;c.beginPath();c.arc(p[0],p[1],10,-PI/2,-PI/2+2*PI*clamp((G.t-F.ct)/600,0,1));c.stroke();}F._sx=p[0];F._sy=p[1];});c.restore();};})();
(function(){var b=drawFac8;drawFac8=function(c){var m=mpp();if(m<20||!G.fac)return b(c);var F0=G.fac;G.fac=F0.filter(function(F){return lmkShow(F,m);});try{return b(c);}finally{G.fac=F0;}};})();
(function(){var b=facTip;facTip=function(F){var t=b(F);if(F.k==='tower'&&F.h)t+='\n樓高約 '+fmt(F.h)+' 公尺：佔據的部隊視野 ×'+fx(1+Math.min(1.5,F.h/150),1);
  if(F.k==='npp')t+=(F.mw?'\n發電量約 '+fmt(F.mw)+' 百萬瓦':'')+(F.melt?'\n☢ 已經爐心熔毀（'+durTxt(Math.max(0,G.t-F.melt))+'前），周圍嚴重污染':'\n受損到三成五以下會爐心熔毀');
  if(LMKP[F.k])t+='\n'+(lmkProt(F)?'受保護的設施，攻擊是戰爭罪行':'（這個年代還沒有保護它的公約）');if(F.cap&&(F.k==='univ'||F.k==='school'||F.k==='prim'||F.k==='stad'||F.k==='hall'))t+='\n可容納避難約 '+fmt(F.cap)+' 人';return t;};})();
/* 後勤頁：補給設施表只列補給相關的（警察局是彈藥點，留著），地標另列一張表 */
(function(){var b=facCard;facCard=function(L){var S=L.filter(function(F){return !LMK[F.k]||F.k==='police';}),M=L.filter(function(F){return LMK[F.k]&&F.k!=='police';});var o=b(S);if(!M.length)return o;
  var me=UI.side>=0?UI.side:LG.side,kc={};M.forEach(function(F){kc[F.k]=(kc[F.k]||0)+1;});var ord=['npp','hall','univ','school','prim','fire','tower','stad','museum'];
  var rows=M.slice().sort(function(a,b){return ord.indexOf(a.k)-ord.indexOf(b.k);}).map(function(F){var v=UI.side<0||seeAll()?F.own:F.own===me?me:F.kn?F.kn[me]:-1,st=[];
    if(F.dead)st.push('已摧毀');else if(F.hp!==undefined&&F.hp<99.5)st.push('受損 '+Math.round(100-F.hp)+'%');if(F.k==='npp')st.push(F.melt?'☢ 爐心熔毀':fmt(F.mw||0)+' 百萬瓦');if(F.k==='tower'&&F.h)st.push('樓高 '+fmt(F.h)+' 公尺');if(LMKP[F.k]&&lmkProt(F))st.push('受保護');if(F.cap)st.push('避難 '+fmt(F.cap)+' 人');
    return '<tr><td>'+(NODEI[F.k]||'')+' '+esc(F.name)+'</td><td>'+FACN[F.k]+'</td><td>'+esc(placeTxt(F.x,F.y))+'</td><td>'+(v<0?'中立':v===me?'本方':'敵方')+'</td><td>'+st.join('・')+'</td></tr>';}).join('');
  return o+'<h3>地標<small>'+ord.filter(function(k){return kc[k];}).map(function(k){return FACN[k]+' '+kc[k];}).join('、')+'</small></h3><div class="lw-note">市政廳、學校、商業大樓、核電站等地標也是設施，可以佔領、被砲擊與摧毀：學校、大學與博物館受保護，核電站重創會爐心熔毀；說明見「說明 → 地標與區域」。</div>'+
    '<div class="lw-sc"><table class="lw-tbl"><tr><th>名稱</th><th>種類</th><th>位置</th><th>控制</th><th>狀態</th></tr>'+rows+'</table></div>';};})();
/* 核電站：管制區與事故後的污染管制區；工業區與公園的名稱 */
function drawLmk(c){if(!G||!G.map)return;var m=mpp(),L=typeof facList==='function'?facList():[];c.save();
  L.forEach(function(F){if(F.k!=='npp')return;var p=w2s(F.x,F.y),r=(F.zr||3000)/m,R2=F.melt?30000/m:0;if(p[0]<-R2-r||p[1]<-R2-r||p[0]>VW.cw+R2+r||p[1]>VW.ch+R2+r)return;
    c.setLineDash([6,4]);c.lineWidth=1.6;c.strokeStyle=F.melt?'rgba(198,40,40,.85)':'rgba(255,160,0,.85)';c.beginPath();c.arc(p[0],p[1],Math.max(6,r),0,2*PI);c.stroke();
    if(F.melt){c.strokeStyle='rgba(198,40,40,.6)';c.beginPath();c.arc(p[0],p[1],Math.max(10,R2),0,2*PI);c.stroke();if(R2>40)txtHalo(c,'☢ 撤離區（30 公里）',p[0],p[1]-R2-6,'bold 11px sans-serif','#b71c1c');}
    c.setLineDash([]);if(r>24)txtHalo(c,F.name+(F.melt?'（爐心熔毀）':'')+' 管制區',p[0],p[1]-r-6,'11px sans-serif',F.melt?'#b71c1c':'#E65100');});
  if(m<60&&typeof lmkZones==='function'){var Z=lmkZones(G.map);c.font='italic 11px sans-serif';Z.forEach(function(z){var p=w2s(z.x,z.y);if(p[0]<-60||p[1]<-20||p[0]>VW.cw+60||p[1]>VW.ch+20)return;var big=z.a/(m*m);if(big<900)return;txtHalo(c,z.n,p[0],p[1],'italic 11px sans-serif',z.k==='ind'?'#455A64':'#2E7D32');});}
  c.restore();}
(function(){var b=drawNodes;drawNodes=function(c){try{drawLmk(c);}catch(e){if(window.console)console.warn('lmk',e);}b(c);};})();
HELP14.push('<h4>地標與區域</h4><ul><li>地圖會依年代與聚落規模產生更多地標（都是可佔領、可被破壞的設施）：市政廳、大學、中學與小學、警察局、消防局、商業大樓、體育場、博物館，以及大城市附近可能有一座<b>核電站</b>（管制區以橘色虛線標示）。小型地標要放大到每像素 40 公尺以內才顯示；工業區與公園也會標出名稱。</li>'+
  '<li><b>核電站</b>：1977 年起受日內瓦公約第一附加議定書保護。受損到三成五以下會爐心熔毀：放射性物質順風外洩並長期污染地面（與放射性毒劑相同的暴露與防護規則），附近部隊受到輻射傷害，30 公里內的居民撤離。</li>'+
  '<li><b>學校、大學</b>（海牙公約）與<b>博物館</b>（1954 年文化財產公約）：受保護的建築，居民可以在此避難；擊中它們會記為戰爭罪行。</li>'+
  '<li><b>警察局</b>：存有輕武器彈藥，佔領後成為小型彈藥補給點；控制的一方在 3 公里內的部隊發生搶劫、傷害平民等事件時，有三成五的機會被員警制止。<b>消防局</b>：2.5 公里內的大火較快撲滅。<b>商業大樓</b>：佔據高樓的部隊視野更遠（樓高 150 公尺約 2 倍）。<b>市政廳</b>：佔領後當地的動盪較快平息。</li></ul>');
