/* ===================== 動態戰場地形（介面）：彈坑與戰壕的繪製、手繪「規劃戰壕」、戰場墓地、滑鼠提示、設定、說明、對話 ===================== */
setSec('combat','crt',{t:'彈坑與戰場墓地',o:26,h:function(){return setOpt(setRow('彈坑',setChk('setb','crt',G.set.crt!==false,'砲擊、轟炸、飛彈與核爆留下彈坑：越野的車輛與馬匹走得慢，落在道路上算路面損壞；步兵趴在彈坑裡多一點掩蔽。陣亡的官兵在戰事平息後被集體掩埋成戰場墓地')))+
  '<div class="lw-note">戰壕在手繪工具的「規劃戰壕」：選取部隊後在地圖上畫出路線，部隊會分段挖掘。</div>';}});
/* ---------- 手繪：規劃戰壕 ---------- */
DRK.trench=['規劃戰壕','line','#5D4037','trench'];
(function(){var b=canOrd;canOrd=function(u,k){if(k==='trench'){var L=isLeaf(u)?[u]:leavesOf(u).filter(alive);return L.some(function(q){return ST(q).dom==='land';});}return b(u,k);};})();
(function(){var b=drawOrderFor;drawOrderFor=function(kind,P,u,i,n){if(kind!=='trench')return b(kind,P,u,i,n);var side=u.side,tid=side*1e6+(G.dseq||0),f0=i/n,f1=(i+1)/n,m=plAt(P,(f0+f1)/2);
  return {k:'trench',o:{x:m.x,y:m.y,opt:{tid:tid,pts:P.map(function(v){return Math.round(v);}),f0:f0,f1:f1}}};};})();
/* ---------- 地圖：彈坑 ---------- */
function crtMap(){if(G.crt)return G.crt;var A=G._crtA;if(!A||!A.length)return null;if(G._crtM&&G._crtMn===A.length&&G._crtMv===G.crtV)return G._crtM;var M={};A.forEach(function(q){M[q.id]=q.v;});G._crtM=M;G._crtMn=A.length;G._crtMv=G.crtV;return M;}
/* 彈坑不另外畫圖案：直接改地圖影像裡那幾格的地表（翻起的土、坑洞，雨後變爛泥），只在彈坑或泥濘程度改變時重畫那幾格，畫面每幀沒有額外負擔 */
var CRTR={v:-1,snap:null,wet:-1,t:0};
(function(){var b=rmOpt;rmOpt=function(o){o=b(o);if(G&&G.started&&G.set.crt!==false){var C=crtMap();if(C){o.gd=function(k){return C[k]||0;};o.wet=crtWet();}}return o;};})();
function crtWet(){var m=G.env&&G.env.mud||0;return Math.round(clamp(m,0,1)*4)/4;}
/* 每 1.5 秒比對一次：彈坑或泥濘程度有變的格子，按 32×32 格的區塊局部重畫（每次最多 24 塊，其餘下次再畫） */
function crtSync(img){if(!img||!G||!G.started||G.set.crt===false||!G.map)return;var t=performance.now();if(t-CRTR.t<1500)return;CRTR.t=t;var C=crtMap();if(!C)return;var MP=G.map,N=MP.GW*MP.GH,w=crtWet();
  if(!CRTR.snap||CRTR.snap.length!==N||CRTR.img!==img){CRTR.snap=new Uint8Array(N);CRTR.img=img;CRTR.v=-1;CRTR.wet=w;}if(CRTR.v===G.crtV&&CRTR.wet===w&&!CRTR.more)return;
  var GW=MP.GW,all=CRTR.wet!==w,tiles={},nt=0,more=false;for(var key in C){var k=+key,v=C[key]|0;if(!all&&CRTR.snap[k]===v)continue;var x=k%GW,y=(k-x)/GW,tk=(y>>5)*4096+(x>>5);if(!tiles[tk]){if(nt>=24){more=true;continue;}tiles[tk]=1;nt++;}CRTR.snap[k]=v;}
  if(all){CRTR.wet=w;if(more){/* 泥濘改變：沒畫到的區塊下次再畫 */for(var key2 in C){var k2=+key2,x2=k2%GW,y2=(k2-x2)/GW;if(!tiles[(y2>>5)*4096+(x2>>5)])CRTR.snap[k2]=255-(C[key2]|0)||1;}}}
  CRTR.v=G.crtV;CRTR.more=more;if(!nt)return;var mo=now().m,op=rmOpt({S:img.S||2,month:mo,contour:UI.contour&&!gfxFlat(),flat:gfxFlat()});
  Object.keys(tiles).forEach(function(tk){tk=+tk;var tx=(tk%4096)<<5,ty=Math.floor(tk/4096)<<5;renderMap(MP,op,img,[tx-1,ty-1,Math.min(GW,tx+33),Math.min(MP.GH,ty+33)]);});}
(function(){var b=ensureImg;ensureImg=function(){var img=b.apply(this,arguments);try{crtSync(img);}catch(e){}return img;};})();
/* ---------- 地圖：戰壕（之字形，挖好的是實線、挖到一半的半透明、規劃中的是虛線） ---------- */
var TRV={t:0,m:{}};
function trnSeen(T){var me=UI.side;if(me<0||seeAll()||T.side===me)return true;var now=performance.now();if(now-TRV.t>2000){TRV.t=now;TRV.m={};}if(TRV.m[T.id]!==undefined)return TRV.m[T.id];var ok=G.units.some(function(u){if(u.side!==me||!onMap(u))return false;return T.s.some(function(q){return q[5]>0.05&&dist(u.x,u.y,q[0],q[1])<2500;});});TRV.m[T.id]=ok;return ok;}
function trnDraw(c){if(!G||!G.started||!G.trn||!G.trn.length)return;c.save();c.lineJoin='round';G.trn.forEach(function(T){if(!trnSeen(T))return;var mine=UI.side<0||T.side===UI.side;
  T.s.forEach(function(q){if(!mine&&q[5]<0.05)return;var a=w2s(q[0],q[1]),b2=w2s(q[2],q[3]),dx=b2[0]-a[0],dy=b2[1]-a[1],L=Math.hypot(dx,dy);if(L<0.5)return;var ux=dx/L,uy=dy/L,nx=-uy,ny=ux,w=Math.max(2,Math.min(5,VW.s*0.35)),p=q[5];
    if(p<0.05){c.setLineDash([4,4]);c.strokeStyle='rgba(93,64,55,.55)';c.lineWidth=1.5;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b2[0],b2[1]);c.stroke();c.setLineDash([]);return;}
    c.strokeStyle=p>=1?'#4E342E':'rgba(109,76,65,'+(0.35+0.5*p)+')';c.lineWidth=p>=1?2:1.5;c.beginPath();var st=Math.max(6,w*2),n=Math.max(1,Math.floor(L/st));for(var i=0;i<=n;i++){var t=i/n*L,s2=(i%2?1:-1)*w;c[i?'lineTo':'moveTo'](a[0]+ux*t+nx*s2,a[1]+uy*t+ny*s2);}c.stroke();
    if(p<1){c.setLineDash([3,3]);c.strokeStyle='rgba(93,64,55,.45)';c.lineWidth=1;c.beginPath();c.moveTo(a[0]+ux*L*p,a[1]+uy*L*p);c.lineTo(b2[0],b2[1]);c.stroke();c.setLineDash([]);}});});c.restore();}
(function(){var b=drawUnder;drawUnder=function(c){try{trnDraw(c);}catch(e){}b.apply(this,arguments);};})();
/* ---------- 戰場墓地：灰色的墓坑與一排小墓標 ---------- */
(function(){var b=evdIcon;evdIcon=function(c,e,x,y,z,sel){if(e.k!=='bgrave')return b(c,e,x,y,z,sel);c.save();c.fillStyle='#78909C';c.strokeStyle='#ECEFF1';c.lineWidth=1;c.fillRect(x-z,y-z*0.45,z*2,z*0.9);c.strokeRect(x-z,y-z*0.45,z*2,z*0.9);c.strokeStyle='#263238';c.lineWidth=1.2;c.beginPath();
  for(var i=-1;i<=1;i++){c.moveTo(x+i*z*0.55,y-z*0.25);c.lineTo(x+i*z*0.55,y+z*0.25);c.moveTo(x+i*z*0.55-z*0.15,y-z*0.08);c.lineTo(x+i*z*0.55+z*0.15,y-z*0.08);}c.stroke();if(sel){c.strokeStyle='#FFC107';c.lineWidth=2;c.beginPath();c.arc(x,y,z*1.5,0,2*PI);c.stroke();}c.restore();};})();
(function(){var b=evdPanel;evdPanel=function(e){if(e.k!=='bgrave')return b(e);return v8H('⚰ 戰場墓地')+'<div class="lw-note">'+esc(EVDK.bgrave[1])+'</div><div class="lw-kv">'+kv('地點',esc(placeTxt(e.x,e.y)))+kv('埋葬','約 '+fmt(e.n)+' 名陣亡官兵')+kv('時間',tTxt(e.t).slice(-11))+'</div>';};})();
/* ---------- 滑鼠提示 ---------- */
(function(){var b=cellTip;cellTip=function(x,y){var t=b(x,y);try{if(!G||!G.started)return t;var C=crtMap(),k=cellAt(x,y),v=C?C[k]:0,a=[];if(v){var mw=G.env&&G.env.mud||0;a.push((v>=160?'彈坑密布、地面翻爛':v>=60?'到處是彈坑、凹凸不平':'地面有彈坑')+(mw>=0.3?'，雨後成了爛泥地':'')+'：越野的車輛與馬匹走得慢'+(mw>=0.3?'（泥濘更慢）':'')+'，步兵可以趴在坑裡掩蔽');}
  (G.trn||[]).forEach(function(T){if(!trnSeen(T))return;T.s.forEach(function(q){if(a.length<3&&q[5]>0.05&&trnSegD(x,y,q[0],q[1],q[2],q[3])<60)a.push('戰壕'+(q[5]>=1?'（已挖好）':'（挖了 '+pct(q[5]*100)+'）')+(UI.side<0||T.side===UI.side?'，全線完成 '+pct(trnDone(T)*100):''));});});
  if(a.length)t+='\n'+a.join('\n');}catch(e){}return t;};})();
if(typeof HELP14!=='undefined')HELP14.push('<h4>動態戰場地形</h4><ul>'+
  '<li><b>彈坑</b>：砲兵射擊的目標圈、地毯式轟炸的路線、飛彈與核爆的落點留下彈坑（直接改變地表：翻起的土與坑洞，下雨後變成爛泥地；不另外畫圖案）。越野的輪型車輛、畜力與馬匹走得很慢、履帶車輛也慢，徒步影響較小，下雨後彈坑區變成爛泥更難走；落在道路上的算路面損壞，可以派工兵修路。步兵趴在彈坑裡多一點掩蔽。</li>'+
  '<li><b>戰場墓地</b>：各處陣亡的官兵依地點累計，戰事平息後被集體掩埋（灰色墓坑與墓標）。它不是罪行，但經過的官兵會有些不安。屠殺與處決留下的亂葬坑見「戰爭罪的決策與證據」。</li>'+
  '<li><b>規劃戰壕</b>：手繪工具選「規劃戰壕」，先選取部隊再在地圖上畫出路線，路線依部隊數分段，各自前往挖掘；沒選部隊時只畫出規劃。每 100 公尺一段，一個百人的連約 4 小時挖好一段；工兵快八成，1940 年後的工兵有機具更快；凍土、下雨、遭射擊與疲勞都會變慢，挖掘也會累。</li>'+
  '<li>挖好的戰壕（之字形實線）給在裡面、沒在移動的部隊深厚的掩體，挖到一半也有部分效果；不分敵我，奪下的戰壕也能用。看得到自己的戰壕，敵人的戰壕要有部隊在附近才看得到。</li></ul>');
VOXN.ev_bgrave=['戰場墓地','經過集體掩埋陣亡官兵的墓坑'];VOXCAT.forEach(function(c){if(c[0]==='暴行現場')c[1].push('ev_bgrave');});
VOXD.ev_bgrave=['這裡埋了好多弟兄','一整排的墳','又是新翻的土','連名字都沒留下','記住這個地方','[~]願他們安息','[!]下一個會不會是我'];
VOXP.rough.ev_bgrave=['*的，一整片墳','這些傢伙比我還倒楣','別看了，走吧','總有一天輪到我們'];VOXP.pro.ev_bgrave=['經過戰場墓地','記錄墓地位置','向陣亡將士致敬','保持行進'];VOX.P=null;VOX.PS=null;
(function(){var b=voxDetect;voxDetect=function(u,P,N,s){var r=b(u,P,N,s);if(r&&r[0]==='ev_body'&&u.evK==='bgrave')return ['ev_bgrave',3];return r;};})();
