/* ===================== 天氣與水文介面：頂列的天氣趨勢與河川水位、事件面板的「天氣與水文」、地圖上依水深分色的淹水與淺灘、滑鼠提示的水深與能否涉水、設定與說明 ===================== */
if(typeof GKEYS!=='undefined')GKEYS.push('wsys','hyd');
var HSTC=['#2e7d32','#f9a825','#ef6c00','#c62828','#6a1b9a'];
function wsTrend(S){return S.ph==='grow'?'↑':S.ph==='decay'?'↓':'';}
function wsPhaseTxt(S){var t=G.t;if(S.ph==='grow')return '增強中，約 '+durTxt(Math.max(0,S.tP-t))+'後最強';if(S.ph==='hold')return S.k==='fog'&&!S.adv?'持續，日出後漸散':'持續，約 '+durTxt(Math.max(0,S.tH-t))+'後開始減弱';return '減弱中，約 '+durTxt(Math.max(0,S.t1-t))+'後結束';}
function wxTitle(){var E=G.env,S=G.wsys,H=G.hyd,a=[WX[E.wx][1]+'，能見度 '+pct(E.vis*100)];if(S)a.push(WSYN[S.k]+'：'+wsPhaseTxt(S));if(H&&hydOn()){a.push('雨量每小時 '+fx(H.rate,1)+' 公釐，近 24 小時約 '+fmt(H.r24)+' 公釐');a.push('河川水位：'+HSTG[H.stg][1]+'（平常的 '+fx(H.lv,2)+' 倍）');}return a.join('\n');}
(function(){var b=hudTick;hudTick=function(force){b(force);try{if(!G||!G.env||!UI.bar||!G.started)return;var wx=UI.bar.querySelector('[data-k="wx"]');if(!wx)return;var E=G.env,S=G.wsys,H=G.hyd,nm=WX[E.wx][1],tx=wx.textContent;
  if(S&&tx.indexOf(nm)===0)tx=nm+wsTrend(S)+tx.slice(nm.length);if(H&&hydOn()&&H.stg>=1)tx+='・河川'+HSTG[H.stg][1];wx.textContent=tx;wx.title=wxTitle();}catch(e){}};})();
/* ---------- 事件面板：天氣與水文 ---------- */
function wxBar(I,col){return '<span style="display:inline-block;vertical-align:middle;width:64px;height:7px;border-radius:4px;background:rgba(127,127,127,.25);overflow:hidden"><span style="display:block;height:100%;width:'+Math.round(clamp(I,0,1)*100)+'%;background:'+col+'"></span></span>';}
function wxCardHtml(){if(!G||!G.env||!G.started)return '';var E=G.env,S=G.wsys,H=G.hyd,o='<div class="lw-kv">';
  o+='<span>天氣</span><span><b>'+WX[E.wx][1]+'</b>，能見度 '+pct(E.vis*100)+(S?'<br><span class="lw-note">'+WSYN[S.k]+' '+wxBar(S.I,S.k==='fog'?'#90a4ae':S.k==='snow'?'#90caf9':'#1e88e5')+' '+wsPhaseTxt(S)+'</span>':'')+'</span>';
  if(H&&hydOn()){o+='<span>雨量</span><span>每小時 '+fx(H.rate,H.rate<10?1:0)+' 公釐，近 24 小時約 '+fmt(H.r24)+' 公釐；土壤含水 '+pct(H.sat*100)+'</span>';
    o+='<span>河川水位</span><span><b style="color:'+HSTC[H.stg]+'">'+HSTG[H.stg][1]+'</b>（平常的 '+fx(H.lv,2)+' 倍'+(H.riseQ>0?'，水深增加約 '+fx(H.riseQ,1)+' 公尺':'')+'）'+(H.riseQ>=0.3?'<br><span class="lw-note">淺灘已無法徒涉，部隊只能走橋梁或渡口</span>':'')+'</span>';
    if(H.flOn)o+='<span>淹水</span><span>約 '+fx(H.flA,1)+' 平方公里（地圖上的藍色區域，越深顏色越深）</span>';
    if(H.scN||H.dep)o+='<span>地貌改變</span><span>'+(H.scN?'河岸沖刷成新河道或沙洲約 '+fx(H.scN*G.map.cs*G.map.cs/1e6,2)+' 平方公里':'')+(H.scN&&H.dep?'；':'')+(H.dep?'退水後成為沼澤約 '+fx(H.dep*G.map.cs*G.map.cs/1e6,2)+' 平方公里':'')+'</span>';}
  return o+'</div>';}
(function(){var b=evtHtml;evtHtml=function(){return wxCardHtml()+b();};})();
/* ---------- 地圖：淹水依水深分色（淺、深、很深），淺灘標示 ---------- */
function fordList(){var F=fordMap();if(FDC.L&&FDC.La===F)return FDC.L;var L=[];for(var k=0;k<F.length;k++)if(F[k])L.push(k);FDC.L=L;FDC.La=F;return L;}
function drawFords(c){if(!G.started||VW.s<3)return;var MP=G.map,L=fordList();if(!L.length)return;var s=VW.s;c.save();
  L.forEach(function(k){var x=k%MP.GW,y=(k-x)/MP.GW,px=VW.ox+(x+0.5)*s,py=VW.oy+(y+0.5)*s;if(px<-10||py<-10||px>VW.cw+10||py>VW.ch+10)return;var open=fordMul(0,k)>0,r=Math.min(7,s*0.4);
    c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=4;c.beginPath();c.moveTo(px-r,py-r*0.45);c.lineTo(px+r,py-r*0.45);c.moveTo(px-r,py+r*0.45);c.lineTo(px+r,py+r*0.45);c.stroke();
    c.strokeStyle=open?'#8d6e63':'#9e9e9e';c.lineWidth=2;c.setLineDash(open?[]:[2,2]);c.beginPath();c.moveTo(px-r,py-r*0.45);c.lineTo(px+r,py-r*0.45);c.moveTo(px-r,py+r*0.45);c.lineTo(px+r,py+r*0.45);c.stroke();c.setLineDash([]);
    if(s>=10&&(k%7===0)){c.textAlign='center';c.textBaseline='alphabetic';txtHalo(c,open?'淺灘':'淺灘（水深）',px,py-r-3,'10px sans-serif',open?'#5d4037':'#757575');}});c.restore();}
(function(){var b=drawEvt;drawEvt=function(c){b(c);try{drawFords(c);}catch(e){if(window.console)console.warn('fords',e);}};})();
/* ---------- 滑鼠提示：水深與能否涉水 ---------- */
function wadeTxt(k){var ok=[];[[0,'徒步'],[1,'騎乘'],[4,'履帶車輛'],[3,'輪型車輛'],[2,'畜力牽引']].forEach(function(q){if(fordMul(q[0],k)>0)ok.push(q[1]);});return ok.length?ok.join('、')+'可以涉水':'無法涉水，只能走橋梁或渡口';}
function floodTxt(v){var ok=[];[[0,'徒步'],[1,'騎乘'],[4,'履帶車輛'],[3,'輪型車輛']].forEach(function(q){if(floodMul(q[0],v)>0)ok.push(q[1]);});return ok.length?ok.join('、')+'可以涉水慢慢通過':'太深，無法通過';}
(function(){var b=cellTip;cellTip=function(x,y){var t=b(x,y);try{if(!G||!G.map||!G.started)return t;var MP=G.map,k=cellAt(x,y),rv=MP.rv[k],FL=G.evt&&G.evt.fl,a=[];
  if(rv&&!isWater(MP.lc[k])&&!MP.rd[k]){var f=rv===2&&fordAt(k);a.push((rv===1?'溪流':f?'淺灘':rv===2?'河流':'大河')+'：水深約 '+fx(rvDepth(k),1)+' 公尺，'+wadeTxt(k));}
  if(FL&&FL[k])a.push('淹水：水深約 '+fx(FL[k]/10,1)+' 公尺，'+floodTxt(FL[k]));if(a.length)t+='\n'+a.join('\n');}catch(e){}return t;};})();
/* ---------- 設定 ---------- */
setSec('env','wxsys',{t:'天氣系統與水文',o:20,note:'可徒涉的水深：徒步約 1 公尺、騎乘 1.25 公尺、履帶車輛 1.1 公尺、輪型車輛 0.6 公尺、畜力牽引 0.5 公尺。溪流約 0.4 公尺，河流約 1.7 公尺（只有淺灘約 0.7 公尺可以涉水），大河、湖泊與深水只能走橋梁、渡口或渡河作戰。',
  h:function(){return setOpt(setRow('天氣系統',setChk('setb','wxSys',G.set.wxSys!==false,'雨、霧、雪以天氣系統持續數小時到數天，強度逐步增強、維持、再減弱（大雨→豪雨→特大豪雨、薄霧→濃霧、降雪→暴風雪）；關閉時每 1～3 小時隨機變換（天氣設為「固定」時不變）'))+
    setRow('河川與洪水',setChk('setb','hyd',G.set.hyd!==false,'降雨匯入河川：水位上漲時淺灘無法徒涉，溢堤後淹沒低地、沖毀浮橋，嚴重時沖刷出新的河道；關閉時河流維持平常水深，「河水暴漲」事件改回固定的淹水範圍')));}});
HELP14.push('<h4>天氣系統、河川水位與洪水</h4><ul>'+
  '<li><b>天氣系統</b>：雨、雷雨、霧、雪不再每小時隨機跳動，而是以「天氣系統」出現：先逐漸增強、維持數小時到數天、再減弱結束。雨帶由小雨、大雨發展到<b>豪雨</b>（每小時 20～45 公釐），強的會到<b>特大豪雨</b>（45～75 公釐）；霧從薄霧變成濃霧，夜間的輻射霧日出後漸散，平流霧（「持續濃霧」事件）可以整天不散；降雪強時成為<b>暴風雪</b>。濕潤與季風地區的雨帶比較長。能見度隨強度連續變化，紀錄會寫出每一次增強、減弱與這場雨的累積雨量；頂列天氣旁的箭頭表示正在增強（↑）或減弱（↓）。</li>'+
  '<li><b>河川水位</b>：雨水先滲入土壤，土壤飽和後大部分成為逕流，數小時後匯入河川。水位到平常的 1.15 倍時「漲水」，淺灘水深超過一公尺、無法徒涉；1.35 倍「溢堤」，河邊與湖邊的低窪地開始淹水；2 倍「嚴重氾濫」，工兵的浮橋與便橋可能被沖走；3 倍「百年洪水」，連永久橋梁也可能沖毀，河岸被沖刷成新的河道與沙洲。雨停後水位在一兩天內回落；退水後泡過水的道路要數小時修復，深水處的農田草地可能變成沼澤。</li>'+
  '<li><b>水深與涉水</b>：徒步可以涉過約 1 公尺、騎乘 1.25 公尺、履帶車輛 1.1 公尺、輪型車輛 0.6 公尺、畜力牽引 0.5 公尺的水。溪流約 0.4 公尺，大多可以涉水；河流約 1.7 公尺，只有淺灘（地圖上的雙線符號，約每 3 公里一處）約 0.7 公尺；大河、湖泊與深的淹水區無法涉水，必須走橋梁、由工兵設置渡口（湖泊與淹水區也可以）或下達渡河作戰。AI 遇到沒有淺灘或橋梁可走的河流、深水淹水區，會改用渡河作戰。</li>'+
  '<li><b>被水淹到的部隊</b>會撤往最近的高處；水深超過一公尺時可能有人溺斃、車輛泡水損壞。滑鼠停在河流或淹水處會顯示水深與哪些部隊可以涉水；事件面板的「天氣與水文」列出天氣系統的強度與趨勢、雨量、土壤含水、河川水位與淹水面積。</li></ul>');
