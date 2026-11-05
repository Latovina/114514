/* ===================== 鐵路介面：破壞鐵道、修鐵道命令；地圖上的斷軌；鐵道提示；後勤頁的列車損失；說明 ===================== */
ordReg('railcut','破壞鐵道','eng',{g:'✂',col:'#B71C1C'});ordReg('railfix','修鐵道','eng',{g:'⚒',col:'#5D4037'});

DCN.railcut='破壞鐵道：點選要破壞的鐵道。工兵、游擊隊、空降與偵察部隊到場安放炸藥（工兵約 20 分鐘），炸斷一段鐵軌。對方的列車若不知道斷軌就會出軌，連同整列物資全毀；知道的話只能停車等修。';
DCN.railfix='修鐵道：點選受損的鐵道。工兵或營建部隊搶修半徑內被炸斷、受損的鐵軌（一處斷軌約需二到三小時）。本方後方、附近沒有敵軍的斷軌，鐵路搶修隊也會在大約半天內慢慢修好。';
(function(){var b=canOrd;canOrd=function(u,k){if(k==='railcut'||k==='railfix'){var L=isLeaf(u)?[u]:leavesOf(u).filter(alive);return !!G.started&&L.some(function(l){return k==='railcut'?canRailCut(l):isEng(l)||ST(l).fl.indexOf('f')>=0;});}return b(u,k);};})();
(function(){var b=v4Opts;v4Opts=function(k,O,us){var o=b(k,O,us);if(k==='railfix')o+='<span>範圍</span><select data-c="oo" data-f="rlr">'+[800,1500,3000].map(function(v){return '<option value="'+v+'"'+((+O.rlr||1500)===v?' selected':'')+'>半徑 '+kmTxt(v)+'</option>';}).join('')+'</select>';return o;};})();
(function(){var b=CHG.oo;CHG.oo=function(t){var f=t.getAttribute('data-f');if(f==='rlr'){UI.ordOpt.rlr=+t.value;btOrd();return;}b(t);};})();
(function(){var b=issueSel;issueSel=function(k,x,y,extra){if(k==='railfix')extra=Object.assign({},extra||{},{rr:+UI.ordOpt.rlr||1500});return b(k,x,y,extra);};})();
(function(){var b=modeBt;modeBt=function(){b();if(VW.mode&&UI.tool==='ord'&&UI.ord&&(UI.ord.k==='railcut'||UI.ord.k==='railfix')){VW.mode.hidden=false;VW.mode.innerHTML='「'+ORDN[UI.ord.k]+'」：'+(UI.ord.k==='railcut'?'點選要炸斷的鐵道':'點選要搶修的鐵道（紅色叉號為斷軌）')+'<button type="button" data-a="ordx">取消</button>';}};})();
/* ---------- 地圖：本方已知的斷軌（紅叉）與受損路段 ---------- */
function drawRail(c){if(!G.started||!G.rld||!G.rlc||!G.rlc.length)return;var me=UI.side,all=me<0||seeAll();c.save();c.textAlign='center';c.textBaseline='alphabetic';
  G.rlc.forEach(function(q){if(!all&&!rlKnown(q.k,me))return;var p=w2s(q.x,q.y);if(p[0]<-30||p[1]<-30||p[0]>VW.cw+30||p[1]>VW.ch+30)return;var cut=rlCut(q.k),r=7;
    c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=5;c.beginPath();c.moveTo(p[0]-r,p[1]-r);c.lineTo(p[0]+r,p[1]+r);c.moveTo(p[0]+r,p[1]-r);c.lineTo(p[0]-r,p[1]+r);c.stroke();
    c.strokeStyle=cut?'#C62828':'#EF6C00';c.lineWidth=2.6;c.beginPath();c.moveTo(p[0]-r,p[1]-r);c.lineTo(p[0]+r,p[1]+r);c.moveTo(p[0]+r,p[1]-r);c.lineTo(p[0]-r,p[1]+r);c.stroke();
    if(VW.s>0.8)txtHalo(c,cut?'斷軌':'鐵道受損',p[0],p[1]-11,'bold 10px sans-serif',cut?'#B71C1C':'#E65100');});c.restore();}
(function(){var b=drawProj;drawProj=function(c){b(c);try{drawRail(c);}catch(e){if(window.console)console.warn('rail',e);}};})();
/* 鐵道提示 */
(function(){var b=cellTip;cellTip=function(x,y){var t=b(x,y);if(!G||!G.started||!G.rld)return t;var k=cellAt(x,y);if(!(G.map.rl[k]&1)||!(G.rld[k]>0))return t;var me=UI.side;if(me>=0&&!seeAll()&&!rlKnown(k,me))return t;
  return t+'\n鐵道'+(rlCut(k)?'被炸斷（列車無法通行，需要搶修）':'受損（列車慢行）');};})();
/* ---------- 後勤頁：列車損失 ---------- */
(function(){var b=PAGES.logi;PAGES.logi=function(host){b(host);if(!G||!G.started)return;var M=host.querySelector('.lw-main');if(!M)return;var S=lgStats(LG.side);if(!(S.trL||S.wreck||S.trT)&&!(G.rlc&&G.rlc.length))return;
  var cut=(G.rlc||[]).filter(function(q){return rlCut(q.k)&&rlKnown(q.k,LG.side);}).length,d=document.createElement('div');d.className='lw-grid';
  d.innerHTML='<div class="lw-card"><h3>鐵路<small>一列火車載運數百噸，損失也是整列</small></h3><div class="lw-kv">'+kv('列車損失',(S.trL?'<b style="color:#b3261e">'+S.trL+' 列</b>':'無')+(S.wreck?'（其中出軌 '+S.wreck+' 列）':''))+kv('物資損失','約 '+fmt(S.trT||0)+' 噸（空襲、砲擊、伏擊、出軌）')+kv('斷軌',cut?'<b style="color:#b3261e">已知 '+cut+' 處</b>：列車停駛，需要工兵「修鐵道」或等待鐵路搶修隊':'沒有已知的斷軌')+'</div></div>';M.insertBefore(d,M.children[3]||null);};})();
HELP14.push('<h4>鐵路運輸：運量大，損失也大</h4><ul>'+
  '<li>補給列車盡量滿載（二戰時期一列約 450 公噸，冷戰約 800 公噸，現代約 1,200 公噸），車站吞吐量大時一次發兩列，抵得上上百輛卡車。</li>'+
  '<li><b>鐵道會被破壞</b>：砲彈、炸彈直接落在鐵道上會炸斷鐵軌；工兵、游擊隊、空降與偵察部隊可以下令「破壞鐵道」；抵抗運動會趁沒有警衛時炸鐵路。破壞的一方立即知道，對方要等約 30 分鐘經由鐵路電報得知，或附近 2 公里內有本方部隊時立刻發現。</li>'+
  '<li><b>損失慘重</b>：列車撞上沒有發現的斷軌就出軌，整列連同物資全毀；遭敵方攻擊機、戰鬥機或轟炸機發現時會被掃射或炸毀（白天、沿線沒有防空時最危險）；砲火落在列車附近、被伏擊時也會損失大半或全部。已知的斷軌前列車會停車等修，在修好之前沒有列車能開到這個車站。</li>'+
  '<li><b>修復</b>：工兵或營建部隊「修鐵道」，一處斷軌約二到三小時；本方後方、附近沒有敵軍時，鐵路搶修隊約半天修好。地圖上紅色叉號為斷軌、橘色為受損路段；後勤頁有列車損失與斷軌的統計。</li></ul>');
