/* ===================== 地面積雪與融雪泥濘（介面）：直接畫在地圖上、滑鼠提示；部隊原駐地氣候的設定；說明 ===================== */
/* 積雪覆蓋與泥濘分成幾個等級，只有等級改變的塊才局部重畫 */
var SNR={snap:null,img:null,t:0,v:-1};
function snLv(S,i){var T=(G.env&&G.env.T||0)-SNLAPSE*(S.el[i]-snE0());return [Math.min(4,Math.round(clamp(S.d[i]/25,0,1)*4)),T<-3?0:Math.min(4,Math.round(clamp(S.m[i],0,1)*4))];}
(function(){var b=rmOpt;rmOpt=function(o){o=b(o);var S=G&&G.started&&G.sn;if(S){var GW=G.map.GW;o.sw=function(k){var x=k%GW,y=(k-x)/GW,i=Math.floor(y/SNB)*S.bw+Math.floor(x/SNB),q=snLv(S,i);return q[0]||q[1]?[q[0]/4,q[1]/4]:null;};}return o;};})();
function snSync(img){var S=G&&G.started&&G.sn;if(!img||!S)return;var t=performance.now();if(t-SNR.t<1500)return;SNR.t=t;var n=S.d.length;
  if(!SNR.snap||SNR.snap.length!==n||SNR.img!==img){SNR.snap=new Int16Array(n);SNR.img=img;for(var j=0;j<n;j++){var q0=snLv(S,j);SNR.snap[j]=q0[0]*8+q0[1];}return;}
  var MP=G.map,todo=[];for(var i=0;i<n;i++){var q=snLv(S,i),c=q[0]*8+q[1];if(c!==SNR.snap[i]){if(todo.length>=24)break;SNR.snap[i]=c;todo.push(i);}}if(!todo.length)return;
  var op=rmOpt({S:img.S||2,month:now().m,contour:UI.contour&&!gfxFlat(),flat:gfxFlat()});todo.forEach(function(i){var bx=(i%S.bw)*SNB,by=Math.floor(i/S.bw)*SNB;renderMap(MP,op,img,[bx,by,Math.min(MP.GW,bx+SNB),Math.min(MP.GH,by+SNB)]);});}
(function(){var b=ensureImg;ensureImg=function(){var img=b.apply(this,arguments);try{snSync(img);}catch(e){}return img;};})();
/* 滑鼠提示：積雪深度、泥濘、海拔對人的影響 */
(function(){var b=cellTip;cellTip=function(x,y){var t=b(x,y);try{if(!G||!G.started||!G.sn)return t;var q=snAt(x,y),a=[];if(!q)return t;
  if(q.d>=3)a.push('積雪約 '+fmt(Math.round(q.d))+' 公分'+(q.d>=40?'：越野非常難走':q.d>=15?'：越野變慢':''));if(q.m>=0.15&&q.T>-3)a.push((q.m>=0.5?'融雪後一片爛泥':'融雪後地面泥濘')+'：越野的車輛與馬匹走得慢');
  var el=G.map.el[cellAt(x,y)]||0;if(el>2500)a.push('海拔 '+fmt(Math.round(el/100)*100)+' 公尺：非山地部隊待久了會出現高山症');if(a.length)t+='\n'+a.join('\n');}catch(e){}return t;};})();
/* 設定：各方部隊原駐地的氣候 */
setSec('combat','clm',{t:'高山症與水土不服',o:27,h:function(){var z=zoneOf(G.map);return setOpt('<span>戰區氣候：'+esc(CLMN[z]||z)+'</span>'+SIDES().map(function(s){var h=G.sides[s].home||'auto';return setRow(esc(G.sides[s].name)+'部隊來自','<select data-c="clmhome" data-v="'+s+'">'+Object.keys(CLMN).map(function(k){return '<option value="'+k+'"'+(h===k?' selected':'')+'>'+esc(CLMN[k])+'</option>';}).join('')+'</select>');}).join(''))+
  '<div class="lw-note">與戰區氣候不同的部隊頭三週病號較多、效率較差，之後逐漸適應。海拔 2500 公尺以上，非山地部隊待久了會出現高山症（3500 公尺以上有人後送），在 2000 公尺以上待約 5 天大致適應。</div>';}});
CHG.clmhome=function(t){var s=+t.getAttribute('data-v');if(G.sides[s])G.sides[s].home=t.value==='auto'?undefined:t.value;if(G.sides[s]&&!G.sides[s].home)delete G.sides[s].home;};
HELP14.push('<h4>積雪、融雪泥濘、高山症與水土不服</h4><ul><li>地面積雪依各地的海拔與緯度計算：越高越冷（每升高 1000 公尺約降 6.5 度），下雪時積雪、氣溫回升時融化；高山上可能終年積雪。地圖上直接畫成雪地。</li>'+
  '<li>融雪讓地面變成爛泥，之後慢慢變乾；結凍時泥地是硬的。積雪深、泥濘重的地方越野更慢（輪型車輛與馬匹最慢，履帶較好）；道路不受影響。</li>'+
  '<li>高山症：海拔 2500 公尺以上，非山地部隊待上幾小時後交火與行軍效率下降，3500 公尺以上開始有人後送；在 2000 公尺以上待約 5 天大致適應。山地部隊不受影響。</li>'+
  '<li>水土不服：在「設定 → 戰鬥 → 高山症與水土不服」設定各方部隊的原駐地氣候；與戰區不同時，頭三週病號較多（熱帶的瘧疾與痢疾、寒帶的凍傷、乾燥地區的中暑），效率也較差。預設「同戰區」不受影響。</li></ul>');
