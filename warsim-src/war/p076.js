/* ===================== 地圖：被偵測到的飛彈畫成空心菱形，加上導引虛線 =====================
   區域外飛彈齊射、空對空、地對空、空對地、攔截飛彈、反彈道飛彈、彈道飛彈（菱形中加一點）與洲際彈道飛彈（雙層菱形）；
   位置以畫面時間內插（兩個模擬步之間也會平順移動），多枚時並排畫出（最多 4 個），縮放夠大時標示種類與枚數。 */
var MSLN={cruise:'巡弋飛彈',asm:'反艦飛彈',bal:'彈道飛彈',icbm:'洲際彈道飛彈',slbm:'潛射彈道飛彈',cm:'核巡弋飛彈',aam:'空對空飛彈',sam:'防空飛彈',agm:'空對地飛彈',int:'攔截飛彈',abm:'反彈道飛彈'};
/* 飛彈在航路上的位置：起點 → 航路點 → 目標，依飛行時間比例 */
function mslPos(S,rt){var P=[[S.x0,S.y0]].concat(S.wp&&S.wp.length?S.wp:[]).concat([[S.x,S.y]]),f=clamp((rt-S.t0)/Math.max(1,S.eta-S.t0),0,1),seg=[],tot=0,i;for(i=1;i<P.length;i++){var d=dist(P[i-1][0],P[i-1][1],P[i][0],P[i][1]);seg.push(d);tot+=d;}
  var want=f*tot;for(i=0;i<seg.length;i++){if(want<=seg[i]||i===seg.length-1){var g=seg[i]>0?clamp(want/seg[i],0,1):1,a=P[i],e=P[i+1];return {x:lerp(a[0],e[0],g),y:lerp(a[1],e[1],g),ang:Math.atan2(e[1]-a[1],e[0]-a[0]),P:P,j:i};}want-=seg[i];}return {x:S.x,y:S.y,ang:0,P:P,j:0};}
function mslRT(){return G.t+(UI.run&&!G.replay&&UI.acc>0?Math.min(UI.acc,DT):0);}
function mslGlyph(c,x,y,col,k,n,ang){var r=k==='icbm'||k==='slbm'?8:k==='int'||k==='abm'?4.5:k==='aam'||k==='sam'?5:6,m=clamp(Math.round(n||1),1,4),px=-Math.sin(ang||0),py=Math.cos(ang||0);c.save();
  for(var i=0;i<m;i++){var o=(i-(m-1)/2)*r*1.5,cx=x+px*o,cy=y+py*o;[[3.2,'rgba(255,255,255,.85)'],[1.6,col]].forEach(function(st){c.lineWidth=st[0];c.strokeStyle=st[1];c.beginPath();c.moveTo(cx,cy-r);c.lineTo(cx+r,cy);c.lineTo(cx,cy+r);c.lineTo(cx-r,cy);c.closePath();c.stroke();
      if(k==='icbm'||k==='slbm'){var R=r+3.5;c.beginPath();c.moveTo(cx,cy-R);c.lineTo(cx+R,cy);c.lineTo(cx,cy+R);c.lineTo(cx-R,cy);c.closePath();c.stroke();}});
    if(k==='bal'||k==='icbm'||k==='slbm'){c.fillStyle=col;c.beginPath();c.arc(cx,cy,1.8,0,2*PI);c.fill();}}c.restore();}
/* 導引虛線：從飛彈目前的位置到目標 */
function mslGuide(c,p,q,col,a){c.save();c.strokeStyle=col;c.globalAlpha=a||0.75;c.lineWidth=1.2;c.setLineDash([4,4]);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke();c.restore();}
function mslLabel(c,p,k,n,col,extra){if(VW.s>0.6)txtHalo(c,(MSLN[k]||'飛彈')+(n>1?' ×'+n:'')+(extra||''),p[0]+9,p[1]-9,'10.5px sans-serif',col);}
(function(){var b=drawProj;drawProj=function(c){b(c);if(!G)return;var me=mySide(),rt=mslRT();c.save();
  /* 交火中的飛彈與攔截飛彈 */(G.mv||[]).forEach(function(q){if(!(UI.side<0||!G.set.fog||q.side===me||me===null||q.v&&q.v[me]))return;var T=q.tid?uById(q.tid):null,tx=T&&onMap(T)?T.x:q.tx,ty=T&&onMap(T)?T.y:q.ty,col=sideCol(q.side),f=clamp((rt-q.t0)/Math.max(1,q.t1-q.t0),0,1.2);
    if(f>=1){var age=rt-q.t1;if(age>5)return;var e=w2s(tx,ty);c.globalAlpha=clamp(1-age/5,0,1);c.strokeStyle=col;c.lineWidth=1.5;c.beginPath();c.arc(e[0],e[1],5+age*1.5,0,2*PI);c.stroke();c.globalAlpha=1;return;}
    var L=dist(q.x0,q.y0,tx,ty),ang=Math.atan2(ty-q.y0,tx-q.x0),bend=Math.sin(f*PI)*0.08*L*(q.id%2?1:-1),x=lerp(q.x0,tx,f)-Math.sin(ang)*bend,y=lerp(q.y0,ty,f)+Math.cos(ang)*bend,p=w2s(x,y),tq=w2s(tx,ty);
    mslGuide(c,p,tq,col,0.6);mslGlyph(c,p[0],p[1],col,q.k,q.n,ang);mslLabel(c,p,q.k,q.n,col);});
  /* 戰略核武：彈道飛彈在地圖邊緣等候，最後 15％ 的飛行（重返大氣層）畫出彈道；核巡弋飛彈畫在目前位置 */
  (G.snq||[]).forEach(function(Q){if(!(UI.side<0||!G.set.fog||Q.side===me||Q.det))return;var col=sideCol(Q.side),t=w2s(Q.x,Q.y);
    if(Q.del==='icbm'||Q.del==='slbm'){var f=clamp((rt-Q.t0)/Math.max(1,Q.eta-Q.t0),0,1),e=typeof edgePoint==='function'?edgePoint(Q.side,0.5):[Q.x,Q.y],g=clamp((f-0.85)/0.15,0,1),x=lerp(e[0],Q.x,g),y=lerp(e[1],Q.y,g),p=w2s(x,y);
      mslGuide(c,p,t,col,0.8);mslGlyph(c,p[0],p[1],col,Q.del,1,Math.atan2(Q.y-e[1],Q.x-e[0]));mslLabel(c,p,Q.del,1,col,g>0?'（重返大氣層）':'');}
    else if(Q.del==='cruise'&&Q.ex!==undefined&&G.t>=Q.ta){var pc=w2s(Q.px,Q.py);mslGlyph(c,pc[0],pc[1],col,'cm',1,Math.atan2(Q.y-Q.py,Q.x-Q.px));}});
  c.restore();};})();
