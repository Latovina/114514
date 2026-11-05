/* ===================== 手繪作戰圖：在地圖上拖曳畫出進攻箭頭、移動路線、登陸線、前線、防禦線（線），以及遲滯區、包圍區、佔領區、空降區（封閉區域）
   畫完後轉換成選取部隊的命令（沿手繪路線前進、沿防線展開、在區域內部署），並保留在地圖上作為作戰圖示。 ===================== */
var DRK={atk:['進攻箭頭','line','#C62828','attack'],mov:['移動路線','line','#1565C0','move'],land:['登陸線','line','#0277BD','landing'],front:['前線','line','#6A1B9A','defend'],def:['防禦線','line','#212121','defend'],
  delay:['遲滯區','area','#8D6E63','delay'],enc:['包圍區','area','#B71C1C','siege'],occ:['佔領區','area','#2E7D32','attack'],abn:['空降區','area','#00695C','airdrop']};
var DR={k:'atk'};
/* 手繪路徑：平滑（移動平均）＋簡化 */
function drawSmooth(P,eps){var n=P.length/2;if(n<3)return P.slice();var o=[P[0],P[1]];for(var i=1;i<n-1;i++){var a=Math.max(0,i-2),b=Math.min(n-1,i+2),sx=0,sy=0,c=0;for(var j=a;j<=b;j++){sx+=P[j*2];sy+=P[j*2+1];c++;}o.push(sx/c,sy/c);}o.push(P[P.length-2],P[P.length-1]);return simplify(o,eps);}
function polyArea(P){var a=0,n=P.length/2;for(var i=0;i<n;i++){var j=(i+1)%n;a+=P[i*2]*P[j*2+1]-P[j*2]*P[i*2+1];}return Math.abs(a)/2;}
function polyCent(P){var n=P.length/2,x=0,y=0;for(var i=0;i<n;i++){x+=P[i*2];y+=P[i*2+1];}return [x/n,y/n];}
function inPoly(P,x,y){var c=false,n=P.length/2;for(var i=0,j=n-1;i<n;j=i++){var xi=P[i*2],yi=P[i*2+1],xj=P[j*2],yj=P[j*2+1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi+1e-9)+xi))c=!c;}return c;}
/* 區域內均勻取 n 個點（格點抽樣） */
function polyPts(P,n){var bb=[1e18,1e18,-1e18,-1e18];for(var i=0;i<P.length;i+=2){bb[0]=Math.min(bb[0],P[i]);bb[1]=Math.min(bb[1],P[i+1]);bb[2]=Math.max(bb[2],P[i]);bb[3]=Math.max(bb[3],P[i+1]);}var A=polyArea(P),step=Math.max(50,Math.sqrt(A/Math.max(1,n))*0.9),pts=[];
  for(var y=bb[1]+step/2;y<bb[3];y+=step)for(var x=bb[0]+step/2;x<bb[2];x+=step)if(inPoly(P,x,y))pts.push([x,y]);if(!pts.length)pts.push(polyCent(P));while(pts.length>n){pts.splice(Math.floor(pts.length/2),1);}return pts;}
/* 完成一筆手繪：轉換為命令 */
function drawDone(kind,P){var K=DRK[kind];if(!K||P.length<4)return;var side=mySide()===null?0:mySide(),closed=K[1]==='area';if(closed&&P.length<6){toast('區域太小，請畫出一個封閉的範圍。');return;}
  var eps=Math.max(G.map.cs*0.6,mpp()*2.5),pts=drawSmooth(P,eps);if(closed&&polyArea(pts)<G.map.cs*G.map.cs*20){toast('區域太小。');return;}
  var us=UI.sel.map(uById).filter(function(u){return u&&alive(u)&&(mySide()===null||u.side===mySide())&&canOrd(u,K[3]);}),D={id:(G.dseq=(G.dseq||0)+1),side:side,k:kind,pts:pts.map(function(v){return Math.round(v);}),closed:closed,t:G.t,units:us.map(function(u){return u.id;})};
  (G.draw=G.draw||[]).push(D);if(G.draw.length>120)G.draw.shift();if(!us.length){toast('已畫出「'+K[0]+'」（作為作戰圖示；選取部隊後再畫可直接下令）');vDraw(false);return;}
  var eta=[];D.oids=[];us.forEach(function(u,i){var p=drawOrderFor(kind,pts,u,i,us.length);if(!p)return;var r=issue(u,p.k,p.o);eta.push(r.sec);if(p.o&&p.o.oid)D.oids.push(p.o.oid);});
  var mx=eta.length?Math.max.apply(null,eta):0;toast('依手繪的「'+K[0]+'」下令給 '+us.length+' 個單位'+(mx>0?'，最慢約 '+durTxt(mx)+' 後送達':''));if(!UI.keepOrd){setTool('sel');}btLeft(true);vDraw(false);}
/* 各種手繪對應的命令 */
function drawOrderFor(kind,P,u,i,n){var K=DRK[kind],C=isLeaf(u)?[u.x,u.y]:cOf(u)||[u.x,u.y],L=P.length/2,opt=optsFor(K[3]);
  if(kind==='atk'||kind==='mov'){/* 起點附近的點略過，其餘當作途經點；多個單位時橫向錯開 */var end=[P[P.length-2],P[P.length-1]],via=[],off=n>1?(i-(n-1)/2)*Math.min(800,Math.max(250,frontW(u))):0,a=Math.atan2(end[1]-P[1],end[0]-P[0]),ox=-Math.sin(a)*off,oy=Math.cos(a)*off;
    for(var j=1;j<L-1;j++){var x=P[j*2]+ox,y=P[j*2+1]+oy;if(dist(x,y,C[0],C[1])>400)via.push([x,y]);}return {k:K[3],o:{x:end[0]+ox,y:end[1]+oy,via:via.length?via:undefined,opt:opt,drawn:1}};}
  if(kind==='land'){var q=plAt(P,(i+0.5)/n);return {k:'landing',o:{x:q.x,y:q.y}};}/* 上岸後建立灘頭陣地，向內陸的攻擊由玩家另外畫箭頭 */
  if(kind==='front'||kind==='def'){var f0=i/n,f1=(i+1)/n,seg=[];for(var s=0;s<=6;s++){var q2=plAt(P,f0+(f1-f0)*s/6);seg.push(q2.x,q2.y);}var mid=plAt(P,(f0+f1)/2),face=drawFace(mid,u.side);var o2={x:mid.x,y:mid.y,face:face,pts:seg,opt:Object.assign({},opt,{post:kind==='def'?'prepared':(opt.post||'hasty')})};if(!isLeaf(u))o2.pts=n>1?seg:P.slice();return {k:'defend',o:o2};}
  if(kind==='delay'){var c=polyCent(P),fc=drawFace({x:c[0],y:c[1]},u.side),pp=polyPts(P,n)[i]||c;return {k:'delay',o:{x:pp[0],y:pp[1],face:fc}};}
  if(kind==='enc'){var c2=polyCent(P),A=polyArea(P);return {k:'siege',o:{x:c2[0],y:c2[1],r:Math.max(800,Math.sqrt(A/PI))}};}
  if(kind==='occ'){var p3=polyPts(P,n)[i]||polyCent(P);return {k:'attack',o:{x:p3[0],y:p3[1],then:newOrder('defend',{x:p3[0],y:p3[1],face:drawFace({x:p3[0],y:p3[1]},u.side),opt:{post:'hasty'}}),opt:Object.assign({},opt,{tac:'frontal'})}};}
  if(kind==='abn'){var p4=polyPts(P,n)[i]||polyCent(P),heli=(isLeaf(u)?[u]:leavesOf(u)).some(canHeli)&&G.units.some(function(c3){return c3.side===u.side&&alive(c3)&&isCarrier(c3);});return {k:heli&&!(isLeaf(u)?[u]:leavesOf(u)).some(canPara)?'airlift':'airdrop',o:{x:p4[0],y:p4[1],then:newOrder('defend',{x:p4[0],y:p4[1],face:drawFace({x:p4[0],y:p4[1]},u.side),opt:{post:'hasty'}})}};}
  return null;}
function drawFace(q,side){var ec=enemyCentroid(side,q.x,q.y);if(ec)return Math.atan2(ec[1]-q.y,ec[0]-q.x);return homeDir(side)+PI;}
/* ---------- 繪製 ---------- */
function drawDrawings(c){if(!G.draw||!G.draw.length)return;var sides=UI.side<0?SIDES():[UI.side];G.draw.forEach(function(D){if(sides.indexOf(D.side)<0&&G.set.fog)return;var K=DRK[D.k];if(!K)return;var age=(G.t-D.t)/3600,al=D.keep||!drTransient(D.k)||D.units.length?1:clamp(1.15-age/36,0.25,1);c.save();c.globalAlpha=al;drawShape(c,D.k,D.pts,K[2],D.closed,D.id===DR.hl);c.restore();});}
function drawShape(c,k,P,col,closed,hl){var S=P.map(function(v,i){return i%2===0?w2s(v,0)[0]:w2s(0,v)[1];});if(S.length<4)return;c.lineJoin='round';c.lineCap='round';
  function path(){c.beginPath();c.moveTo(S[0],S[1]);for(var i=2;i<S.length;i+=2){var mx=(S[i-2]+S[i])/2,my=(S[i-1]+S[i+1])/2;c.quadraticCurveTo(S[i-2],S[i-1],mx,my);}c.lineTo(S[S.length-2],S[S.length-1]);if(closed)c.closePath();}
  if(closed){path();c.fillStyle=col+'2E';c.fill();c.setLineDash(k==='delay'?[10,6]:k==='abn'?[3,5]:[]);c.lineWidth=hl?4:2.5;c.strokeStyle=col;c.stroke();c.setLineDash([]);var ce=polyCent(S);c.font='bold 12px sans-serif';c.textAlign='center';c.textBaseline='middle';txtHalo(c,DRK[k][0],ce[0],ce[1],'bold 12px sans-serif',col);
    if(k==='abn'){c.beginPath();c.arc(ce[0],ce[1]-16,8,PI,0);c.lineTo(ce[0],ce[1]-6);c.closePath();c.strokeStyle=col;c.lineWidth=1.5;c.stroke();}return;}
  var wd=k==='atk'?7:k==='mov'?3:k==='land'?4:3.5;c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=wd+3;path();c.stroke();c.strokeStyle=col;c.lineWidth=hl?wd+2:wd;c.setLineDash(k==='mov'?[12,7]:[]);path();c.stroke();c.setLineDash([]);
  var n=S.length,ax=S[n-2],ay=S[n-1],bx=S[Math.max(0,n-6)],by=S[Math.max(1,n-5)],a=Math.atan2(ay-by,ax-bx);
  if(k==='atk'||k==='mov'){var L=k==='atk'?20:13,W=k==='atk'?0.55:0.45;c.fillStyle=col;c.beginPath();c.moveTo(ax+Math.cos(a)*4,ay+Math.sin(a)*4);c.lineTo(ax-L*Math.cos(a-W),ay-L*Math.sin(a-W));c.lineTo(ax-L*Math.cos(a+W),ay-L*Math.sin(a+W));c.closePath();c.fill();}
  else if(k==='front'||k==='def'){/* 防線符號：沿線每隔一段畫半圓（陣地）或鋸齒（前線） */var tot=0;for(var i=2;i<n;i+=2)tot+=dist(S[i-2],S[i-1],S[i],S[i+1]);var step=k==='def'?22:16,acc=0;c.fillStyle=col;c.strokeStyle=col;c.lineWidth=2;
    for(var j=2;j<n;j+=2){var x0=S[j-2],y0=S[j-1],x1=S[j],y1=S[j+1],d=dist(x0,y0,x1,y1),aa=Math.atan2(y1-y0,x1-x0),nx=-Math.sin(aa),ny=Math.cos(aa);while(acc<d){var px=x0+Math.cos(aa)*acc,py=y0+Math.sin(aa)*acc;if(k==='def'){c.beginPath();c.arc(px,py,5,aa,aa+PI,true);c.stroke();}else{c.beginPath();c.moveTo(px,py);c.lineTo(px+nx*7+Math.cos(aa)*4,py+ny*7+Math.sin(aa)*4);c.lineTo(px+Math.cos(aa)*8,py+Math.sin(aa)*8);c.fill();}acc+=step;}acc-=d;}void tot;}
  else if(k==='land'){c.fillStyle=col;for(var q=0;q<n;q+=Math.max(2,Math.floor(n/8)*2)){c.beginPath();c.arc(S[q],S[q+1],4,0,2*PI);c.fill();}}}
/* 正在畫的筆跡 */
/* 命令範圍（例如自訂形狀的轟炸區）拖曳中的預覽：半透明填色的封閉範圍；其他模組可以改寫 */
function polyInk(c,P){var col=(UI.ord&&ORDC[UI.ord.k])||'#5D4037';c.save();c.beginPath();for(var i=0;i<P.length;i+=2){var q=w2s(P[i],P[i+1]);if(i)c.lineTo(q[0],q[1]);else c.moveTo(q[0],q[1]);}c.closePath();c.globalAlpha=0.18;c.fillStyle=col;c.fill();c.globalAlpha=1;c.strokeStyle=col;c.lineWidth=2;c.setLineDash([6,4]);c.stroke();c.setLineDash([]);c.restore();}
function drawInk(c){var D=VW.drag;if(!D||D.kind!=='draw'||!D.pts||D.pts.length<4)return;if(D.ord){polyInk(c,D.pts);return;}var K=DRK[DR.k];drawShape(c,DR.k,D.pts,K[2],K[1]==='area'&&D.pts.length>=6,false);}
/* 清單（作戰頁的「手繪」面板） */
function drawPanel(){var o='<div class="lw-draw"><div class="lw-ob">'+Object.keys(DRK).map(function(k){return '<button type="button" data-a="drk" data-v="'+k+'" class="'+(UI.tool==='draw'&&DR.k===k?'on':'')+'" style="border-left:4px solid '+DRK[k][2]+'">'+DRK[k][0]+'</button>';}).join('')+'</div>';
  o+='<div class="lw-note">先選取部隊，再按下工具並在地圖上按住拖曳手繪：線條會沿著你畫的路線下令，封閉區域會在範圍內部署。不選部隊時只留下作戰圖示。進攻、移動、登陸、包圍、佔領、空降等圖示在交戰結束後自動移除（可按「保留」）；前線、防禦線、遲滯區常駐。兩者都可手動刪除。</div>';var L=(G.draw||[]).filter(function(D){return UI.side<0||D.side===UI.side;}).slice(-12).reverse();
  if(L.length)o+='<table class="lw-tbl">'+L.map(function(D){return '<tr><td><span class="lw-sw" style="background:'+DRK[D.k][2]+'"></span> '+DRK[D.k][0]+'</td><td class="lw-note">'+tTxt(D.t).slice(-5)+(D.units.length?'・'+D.units.length+' 個單位':'・圖示')+'</td><td>'+(drTransient(D.k)?'<button type="button" class="lw-btn sm" data-a="drkeep" data-v="'+D.id+'" title="交戰結束後不自動移除">'+(D.keep?'取消保留':'保留')+'</button> ':'<span class="lw-note">常駐</span> ')+'<button type="button" class="lw-btn sm dng" data-a="drdel" data-v="'+D.id+'">刪除</button></td></tr>';}).join('')+'</table>';
  return o+'</div>';}
ACT.drk=function(b){var k=b.getAttribute('data-v');if(UI.tool==='draw'&&DR.k===k){setTool('sel');return;}DR.k=k;UI.ord=null;setTool('draw');};
/* 進攻類（暫時）與防禦類（常駐）圖示 */
function drTransient(k){return /^(atk|mov|land|enc|occ|abn)$/.test(k);}
/* 某單位是否仍在執行這張圖示下達的作戰，或仍在交戰 */
function drActive(u,D){if(!u||!alive(u))return false;var ids=D.oids||[],has=function(o){return o&&ids.indexOf(o.oid)>=0;};if((u.pend||[]).some(has))return true;if(G.msgs.some(function(m){return m.to===u.id&&has(m.o);}))return true;
  var L=isLeaf(u)?[u]:leavesOf(u).filter(alive),busy=function(q){return q.task==='go'||q.task==='wait'||q.pq||q.st==='lift'||!!q.amph||(q.pend&&q.pend.length);},fight=function(q){return G.t-(q.uf||-1e9)<900||G.t-(q.fired||-1e9)<900;};
  if(L.some(fight))return true;var o=u.ord;if(has(o)&&o.st!=='done'){if(o.k==='siege')return true;return L.some(busy);}return false;}
/* 每 10 分鐘：作戰與交戰都結束 10 分鐘後，自動移除進攻類圖示 */
function drawSweep(){if(!G.draw||!G.draw.length||G.set.drAuto===false)return;var rm=[];G.draw.forEach(function(D){if(!drTransient(D.k)||D.keep||!D.units.length||G.t-D.t<600)return;var act=D.units.some(function(id){return drActive(uById(id),D);});if(act){D.idle=0;return;}if(!D.idle){D.idle=G.t;return;}if(G.t-D.idle>=600)rm.push(D);});
  if(!rm.length)return;rm.forEach(function(D){var u=uById(D.units[0]);logE(D.side,'cmd','「'+DRK[D.k][0]+'」'+(u?'（'+uName(u)+(D.units.length>1?'等':'')+'）':'')+'的作戰與交戰已結束，圖示自動移除');});G.draw=G.draw.filter(function(D){return rm.indexOf(D)<0;});if(typeof vDraw==='function'&&VW.cb)vDraw(false);}
ACT.drdel=function(b){var id=+b.getAttribute('data-v');G.draw=(G.draw||[]).filter(function(D){return D.id!==id;});btOrd();vDraw(false);};
ACT.drkeep=function(b){var id=+b.getAttribute('data-v'),D=(G.draw||[]).filter(function(q){return q.id===id;})[0];if(D)D.keep=!D.keep;btOrd();vDraw(false);};
/* ---------- 地圖圖層：平民（聚落狀態、難民隊伍、戰俘隊伍） ---------- */
/* 霧中看得到的難民隊伍（交戰守則模組改成「認得出是平民」才看得到） */
function civRSeen(Q,me){return Q.side===me||G.units.some(function(u){return u.side===me&&onMap(u)&&dist(u.x,u.y,Q.x,Q.y)<3000;});}
function drawCiv(c){var C=G.civ,S=VW.s,fog=G.set.fog&&UI.side>=0;c.save();
  if(S>=0.6)C.S.forEach(function(g){var p=w2s(g.x,g.y);if(p[0]<-30||p[1]<-30||p[0]>VW.cw+30||p[1]>VW.ch+30)return;var pres=civPresent(g),occ=g.occ>=0&&g.loy>=0&&g.occ!==g.loy,burn=G.t-g.hitT<1800;if(!occ&&!burn&&g.unrest<30&&g.hung<40)return;var x=p[0]+12,y=p[1]-14;
    if(burn){c.fillStyle='rgba(255,112,0,.85)';c.beginPath();c.moveTo(x,y-7);c.quadraticCurveTo(x+6,y-1,x,y+5);c.quadraticCurveTo(x-6,y-1,x,y-7);c.fill();x+=10;}
    if(occ){c.fillStyle=sideCol(g.occ);c.fillRect(x-4,y-4,8,8);c.strokeStyle='#fff';c.lineWidth=1;c.strokeRect(x-4,y-4,8,8);x+=10;}
    if(g.unrest>=40){c.fillStyle=g.unrest>=70?'#B71C1C':'#E65100';c.font='bold 11px sans-serif';c.textAlign='center';c.fillText('!',x,y+4);x+=8;}if(g.hung>=50){c.font='10px sans-serif';c.fillStyle='#5D4037';c.fillText('飢',x+2,y+4);}void pres;});
  C.R.forEach(function(Q){if(Q.st!=='go'&&Q.st!=='stop')return;if(fog&&!civRSeen(Q,UI.side))return;var p=w2s(Q.x,Q.y);if(p[0]<-20||p[1]<-20||p[0]>VW.cw+20||p[1]>VW.ch+20)return;var r=clamp(Math.sqrt(Q.n)/6,3,9);
    c.fillStyle=Q.st==='stop'?'rgba(198,40,40,.85)':'rgba(255,193,7,.9)';c.strokeStyle='#5D4037';c.lineWidth=1.2;c.beginPath();c.arc(p[0],p[1],r,0,2*PI);c.fill();c.stroke();c.fillStyle='#3E2723';c.font='bold '+Math.round(r*1.2+4)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('民',p[0],p[1]+0.5);
    if(S>=1.2){c.font='10px sans-serif';txtHalo(c,fmt(Q.n),p[0],p[1]+r+7,'10px sans-serif','#3E2723');}});
  C.P.forEach(function(P){if(P.st!=='col'||P.n<1)return;if(fog&&P.side!==UI.side)return;var p=w2s(P.x,P.y);c.fillStyle='rgba(120,120,120,.9)';c.strokeStyle=sideCol(P.side);c.lineWidth=1.5;c.fillRect(p[0]-6,p[1]-5,12,10);c.strokeRect(p[0]-6,p[1]-5,12,10);c.fillStyle='#fff';c.font='bold 8px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('PW',p[0],p[1]+0.5);});
  c.restore();}
/* ---------- 地圖圖層：天災與事件 ---------- */
function drawEvt(c){var E=G.evt,MP=G.map;c.save();
  if(E.fl&&VW.s>=0.3){var cs=MP.cs,s=VW.s,x0=Math.max(0,Math.floor(-VW.ox/s)),y0=Math.max(0,Math.floor(-VW.oy/s)),x1=Math.min(MP.GW,Math.ceil((VW.cw-VW.ox)/s)),y1=Math.min(MP.GH,Math.ceil((VW.ch-VW.oy)/s)),st=Math.max(1,Math.floor(2/s));
    /* 依水深分三層：淺（一公尺以下）、深（一公尺以上）、很深（2.5 公尺以上） */[[1,'rgba(30,110,200,.26)'],[10,'rgba(13,71,161,.3)'],[25,'rgba(10,40,120,.3)']].forEach(function(Ly){c.fillStyle=Ly[1];for(var y=y0;y<y1;y+=st)for(var x=x0;x<x1;x+=st)if(E.fl[y*MP.GW+x]>=Ly[0])c.fillRect(VW.ox+x*s,VW.oy+y*s,s*st+0.5,s*st+0.5);});void cs;}
  if(E.fire&&E.burnA>0){var s2=VW.s;for(var k=0;k<E.fire.length;k++){if(E.fire[k]!==1)continue;var x2=k%MP.GW,y2=(k/MP.GW)|0,px=VW.ox+x2*s2,py=VW.oy+y2*s2;if(px<-5||py<-5||px>VW.cw||py>VW.ch)continue;c.fillStyle=(k+G.step)%3?'rgba(255,87,34,.85)':'rgba(255,193,7,.9)';c.fillRect(px,py,Math.max(2,s2),Math.max(2,s2));}}
  E.A.forEach(function(e){if(e.k==='typhoon'){var p=w2s(e.x,e.y),R=Math.min(260,e.R/mpp()*0.25);c.strokeStyle='rgba(69,90,100,.55)';c.lineWidth=3;for(var i=0;i<3;i++){c.beginPath();for(var t=0;t<4*PI;t+=0.2){var rr=10+t*R/(4*PI),a=t+i*2*PI/3+G.t/3000;c.lineTo(p[0]+Math.cos(a)*rr,p[1]+Math.sin(a)*rr);}c.stroke();}}
    else if(e.k==='quake'&&G.t-e.t0<3*3600){var q=w2s(e.x,e.y),al=1-(G.t-e.t0)/(3*3600);c.strokeStyle='rgba(121,85,72,'+(0.7*al)+')';c.lineWidth=2;for(var j=1;j<=4;j++){c.beginPath();c.arc(q[0],q[1],j*Math.max(10,8000/mpp()/4),0,2*PI);c.stroke();}c.fillStyle='rgba(121,85,72,'+al+')';c.font='bold 12px sans-serif';c.textAlign='center';c.fillText('震央 M'+fx(e.M,1),q[0],q[1]-6);}});
  c.restore();}
/* 受阻路段：橘色＝壅塞、紅色＝幾乎無法通行 */
function drawRoads(c){var L=G.rdiL,I=G.rdi;if(!L||!L.length||!I)return;var MP=G.map,s=VW.s,w=Math.max(2,s*0.9);c.save();for(var i=0;i<L.length;i++){var k=L[i],v=I[k];if(v<100)continue;var px=VW.ox+(k%MP.GW)*s,py=VW.oy+((k/MP.GW)|0)*s;if(px<-4||py<-4||px>VW.cw||py>VW.ch)continue;c.fillStyle=v>=180?'rgba(198,40,40,.8)':'rgba(239,108,0,.7)';c.fillRect(px+(s-w)/2,py+(s-w)/2,w,w);}c.restore();}
/* 地圖上方的事件橫幅 */
function evtBanner(){if(!G.evt||!VW.wrap)return;var el=VW.wrap.querySelector('.lw-evb');if(!el){el=document.createElement('div');el.className='lw-evb';VW.wrap.appendChild(el);}var A=G.evt.A.filter(function(e){return e.k!=='monsoon'||true;});
  el.innerHTML=A.map(function(e){return '<span>⚠ '+EVK[e.k]+(e.k==='quake'?' M'+fx(e.M,1):'')+(e.t1<1e12&&e.k!=='monsoon'?'・剩 '+durTxt(e.t1-G.t):'')+'</span>';}).join('');el.hidden=!A.length;
  /* 放在圖層開關列的正下方（窄螢幕時開關列會換行，所以依實際高度定位） */if(A.length&&VW.ly)el.style.top=(VW.ly.offsetTop+VW.ly.offsetHeight+6)+'px';}
