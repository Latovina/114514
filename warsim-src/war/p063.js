/* ===================== 載具美術圖：平塗、黑色描邊、像素風格的側視圖（依「刑天」「響箭」原圖校正） =====================
   reference scale 105 px per metre, 633 px tall, ground line at 597.5 px; parts are written in reference-image pixels and
   placed with a small transform stack, so the same part scales with the chassis */
var AS=105,AHT=633,AGY=597.5,AMINW=831;
var AFONT='"Microsoft JhengHei","PingFang TC","Noto Sans TC","Noto Sans CJK TC","Heiti TC","WenQuanYi Micro Hei",sans-serif';
var AC={bg:'#ccf4ff',gnd:'#ff0000',low:'#ffffff',k:'#000000',k2:'#161912',trk:'#353535',trkL:'#cccccc',trkW:'#e2e2e2',box:'#575b53',boxD:'#343d2c',boxL:'#6b6f66',
  gry:'#898989',gryL:'#a5a5a5',gryD:'#686868',bel:'#5b5b5b',belD:'#333333',gl:'#93afad',glL:'#b6d8d5',wht:'#e2e2e2',red:'#d7000f',redD:'#9e5252',yel:'#f6dc71',
  ink:'#141414',plt:'#5b5e58',tube:'#161912',rub:'#2b2b2b',tyre:'#1e1e1e',tyreL:'#3a3a3a',lamp:'#b0101c',dome:'#d9d9d0'};
var ATONE={b:1,l1:1.11,l2:1.19,l3:1.32,l4:1.43,d1:0.85,d2:0.79,d3:0.62,d4:0.45,sm:0.63};
var AOD={b:'#536046',l1:'#5c6b4e',l2:'#637253',l3:'#6e7f5d',l4:'#778964',d1:'#46513b',d2:'#414c37',d3:'#323d27',d4:'#252d1d',sm:'#343d2c'};
var APAINT={od:{n:'橄欖綠',b:'#536046'},tan:{n:'沙漠黃',b:'#a8925f'},grey:{n:'城市灰',b:'#6c7378'},snow:{n:'冬季白',b:'#c4c8c1'},
  wood:{n:'林地三色迷彩',b:'#536046',camo:['#34402a','#6b5a3e','#1d2118'],pat:'blob'},desc:{n:'沙漠雙色迷彩',b:'#a8925f',camo:['#76603f','#cbb88c'],pat:'blob'},
  digi:{n:'數位迷彩',b:'#5a6749',camo:['#3b4630','#7d7c59','#262b20'],pat:'pix'},navy:{n:'海軍灰',b:'#7f8c95'},dark:{n:'深海灰',b:'#565e66'}};
function aRgb(h){h=String(h).replace('#','');return [parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)];}
function aHex(c){return '#'+c.map(function(v){v=Math.max(0,Math.min(255,Math.round(v)));return (v<16?'0':'')+v.toString(16);}).join('');}
function aShade(h,f){return aHex(aRgb(h).map(function(v){return v*f;}));}
function aTones(pk){var p=APAINT[pk]||APAINT.od,t={};Object.keys(ATONE).forEach(function(k){t[k]=p.b==='#536046'?AOD[k]:aShade(p.b,ATONE[k]);});return t;}
function aRng(seed){var s=(seed>>>0)||1;return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function aSeed(str){var h=2166136261;str=String(str);for(var i=0;i<str.length;i++)h=((h^str.charCodeAt(i))*16777619)>>>0;return h>>>0;}
/* camouflage blobs in vehicle metres, so the pattern runs on across parts */
function aCamo(pk,seed,box){var p=APAINT[pk];if(!p||!p.camo)return null;var R=aRng(seed),bl=[],x0=box[0],x1=box[1],y1=box[2];
  if(p.pat==='pix'){var g=0.075;p.camo.forEach(function(c){for(var n=0;n<(x1-x0)*y1*2.2;n++){var cx=Math.floor((x0+R()*(x1-x0))/g),cy=Math.floor(R()*y1/g),w=2+Math.floor(R()*5),h=1+Math.floor(R()*3);
      for(var i=0;i<w;i++)for(var j=0;j<h;j++)if(R()<0.78)bl.push({c:c,sq:[(cx+i)*g,(cy+j)*g,g]});}});}
  else p.camo.forEach(function(c){for(var n=0;n<(x1-x0)*y1*0.75;n++){var cx=x0+R()*(x1-x0),cy=R()*y1,rx=0.22+R()*0.55,ry=0.1+R()*0.24,a=(R()-0.5)*0.9,pts=[];
      for(var i=0;i<10;i++){var t=i/10*2*Math.PI,rr=0.7+R()*0.5,x=Math.cos(t)*rx*rr,y=Math.sin(t)*ry*rr;pts.push([cx+x*Math.cos(a)-y*Math.sin(a),cy+x*Math.sin(a)+y*Math.cos(a)]);}bl.push({c:c,p:pts});}});
  return bl;}
var ANOP=function(){};
var ADRY={translate:ANOP,scale:ANOP,setTransform:ANOP,beginPath:ANOP,moveTo:ANOP,lineTo:ANOP,closePath:ANOP,fill:ANOP,stroke:ANOP,arc:ANOP,save:ANOP,restore:ANOP,clip:ANOP,rect:ANOP,setLineDash:ANOP,fillText:ANOP,fillRect:ANOP,drawImage:ANOP,
  measureText:function(s){return {width:String(s).length*12};}};
/* ---------- pen: local transform [tx, ty, k, cos, sin] from part units to vehicle metres ---------- */
function APen(g,o){this.g=g||ADRY;this.dry=!g;this.S=o.S;this.ox=o.ox;this.gy=o.gy;this.u=o.S/AS;this.T=[0,0,1,1,0];this.st=[];this.cols=o.cols||{};this.tone=o.tone||AOD;this.camo=o.camo||null;
  this.tg=o.tg||null;this.anch={};this.bb=[1e9,1e9,-1e9,-1e9];this.top={};this.nobox=0;}
APen.prototype.push=function(){this.st.push(this.T.slice());return this;};
APen.prototype.pop=function(){this.T=this.st.pop();return this;};
APen.prototype.tr=function(x,y){var T=this.T;T[0]+=T[2]*(T[3]*x-T[4]*y);T[1]+=T[2]*(T[4]*x+T[3]*y);return this;};
APen.prototype.sc=function(k){this.T[2]*=k;return this;};
APen.prototype.rot=function(deg){var a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a),T=this.T,c0=T[3],s0=T[4];T[3]=c0*c-s0*s;T[4]=s0*c+c0*s;return this;};
APen.prototype.w=function(x,y){var T=this.T;return [T[0]+T[2]*(T[3]*x-T[4]*y),T[1]+T[2]*(T[4]*x+T[3]*y)];};
APen.prototype.p=function(x,y){var v=this.w(x,y),X=Math.round(this.ox+v[0]*this.S),Y=Math.round(this.gy-v[1]*this.S);this.mark(X,Y);return [X,Y];};
APen.prototype.mark=function(X,Y){if(this.nobox)return;var b=this.bb;if(X<b[0])b[0]=X;if(Y<b[1])b[1]=Y;if(X>b[2])b[2]=X;if(Y>b[3])b[3]=Y;var k=X>>3;if(this.top[k]===undefined||Y<this.top[k])this.top[k]=Y;};
APen.prototype.c=function(t){var v=t&&t.charAt(0)!=='#'?(this.tone[t]||AC[t]||t):t;this.cols[v]=1;return v;};
APen.prototype.lw=function(w){return Math.max(1,Math.round((w||1)*this.u));};
APen.prototype.path=function(pts,close,off){var g=this.g,o=off||0;g.beginPath();for(var i=0;i<pts.length;i++){var q=this.p(pts[i][0],pts[i][1]);if(i)g.lineTo(q[0]+o,q[1]+o);else g.moveTo(q[0]+o,q[1]+o);}if(close)g.closePath();};
APen.prototype.paintable=function(t){return this.camo&&ATONE[t]!==undefined&&t!=='d3'&&t!=='d4'&&t!=='sm';};
APen.prototype.poly=function(pts,fill,line,lw){var g=this.g;if(fill){this.path(pts,true);g.fillStyle=this.c(fill);g.fill();if(this.paintable(fill))this.camoIn(pts,fill);}
  if(line!==0)this.stroke(pts,true,line||'k',lw);return this;};
APen.prototype.stroke=function(pts,close,col,lw,dash){var g=this.g,w=this.lw(lw),u=this.u;g.lineWidth=w;g.strokeStyle=this.c(col||'k');g.lineJoin='miter';g.miterLimit=3;g.lineCap='butt';
  if(dash)g.setLineDash(dash.map(function(v){return Math.max(1,Math.round(v*u));}));this.path(pts,close,w%2?0.5:0);g.stroke();if(dash)g.setLineDash([]);return this;};
APen.prototype.ln=function(pts,col,lw,dash){return this.stroke(pts,false,col,lw,dash);};
APen.prototype.camoIn=function(pts,tone){var g=this.g,f=ATONE[tone],S=this.S,ox=this.ox,gy=this.gy,self=this;if(this.dry)return;g.save();this.nobox++;this.path(pts,true);this.nobox--;g.clip();
  this.camo.forEach(function(b){g.fillStyle=self.c(aShade(b.c,f));g.beginPath();if(b.sq){var X=Math.round(ox+b.sq[0]*S),Y=Math.round(gy-(b.sq[1]+b.sq[2])*S),s=Math.max(1,Math.round(b.sq[2]*S));g.rect(X,Y,s,s);}
    else b.p.forEach(function(p,i){var X=Math.round(ox+p[0]*S),Y=Math.round(gy-p[1]*S);if(i)g.lineTo(X,Y);else g.moveTo(X,Y);});g.fill();});g.restore();};
APen.prototype.circ=function(x,y,r,fill,line,lw){var g=this.g,q=this.p(x,y),R=Math.max(0.6,r*this.T[2]*this.S);this.mark(q[0]-R,q[1]-R);this.mark(q[0]+R,q[1]+R);
  if(fill){g.beginPath();g.arc(q[0],q[1],R,0,2*Math.PI);g.fillStyle=this.c(fill);g.fill();}
  if(line!==0){var w=this.lw(lw);g.lineWidth=w;g.strokeStyle=this.c(line||'k');g.beginPath();g.arc(q[0],q[1],Math.max(0.5,R-w/2),0,2*Math.PI);g.stroke();}return this;};
APen.prototype.rect=function(x0,y0,x1,y1,fill,line,lw){return this.poly([[x0,y0],[x1,y0],[x1,y1],[x0,y1]],fill,line,lw);};
APen.prototype.text=function(s,x,y,sz,col,al,bold){var g=this.g,q=this.p(x,y);g.font=(bold?'bold ':'')+Math.max(6,Math.round(sz*this.u))+'px '+AFONT;g.fillStyle=this.c(col);g.textAlign=al||'left';g.textBaseline='alphabetic';g.fillText(s,q[0],q[1]);};
/* reference-image helpers: arrays of x,y pixel pairs relative to an origin, y flipped to point up */
function aP(a,ox,oy){var o=[];for(var i=0;i<a.length;i+=2)o.push([a[i]-ox,oy-a[i+1]]);return o;}
function aR(x0,y0,x1,y1){return [x0,y0,x1,y0,x1,y1,x0,y1];}
function aArc(cx,cy,r,a0,a1,n){var o=[];n=n||12;for(var i=0;i<=n;i++){var a=(a0+(a1-a0)*i/n)*Math.PI/180;o.push(cx+Math.cos(a)*r,cy-Math.sin(a)*r);}return o;}
function aQB(x0,y0,x1,y1,x2,y2,n){var o=[];n=n||8;for(var i=0;i<=n;i++){var t=i/n,a=(1-t)*(1-t),b=2*t*(1-t),c=t*t;o.push(a*x0+b*x1+c*x2,a*y0+b*y1+c*y2);}return o;}
function aRR(x0,y0,x1,y1,r){return [].concat(aArc(x1-r,y0+r,r,90,0,4),aArc(x1-r,y1-r,r,0,-90,4),aArc(x0+r,y1-r,r,-90,-180,4),aArc(x0+r,y0+r,r,180,90,4));}
/* hull frame: hull rear / ground of the reference drawing; turret frame: turret-ring centre / deck */
function aH(a){return aP(a,10,AGY);}
function aT(a){return aP(a,438,399);}
/* tangent point on a circle (centre cx,cy radius r) seen from point px,py; side +1 / -1 picks the branch (image coordinates) */
function aTan(px,py,cx,cy,r,side){var dx=px-cx,dy=py-cy,d=Math.sqrt(dx*dx+dy*dy),a=Math.atan2(dy,dx),b=Math.acos(Math.min(1,r/d))*side;return [cx+Math.cos(a+b)*r,cy+Math.sin(a+b)*r,(a+b)*180/Math.PI];}

/* ---------- running gear (hull frame, reference px) ---------- */
function aWheel(P,x,y,r,sty){var c=aH([x,y])[0];
  if(sty==='disc'){P.circ(c[0],c[1],r,'d4','k');P.circ(c[0],c[1],r-3.5,'d3','k');P.circ(c[0],c[1],r*0.62,'d2','k');for(var i=0;i<8;i++){var a=i*Math.PI/4;P.circ(c[0]+Math.cos(a)*r*0.44,c[1]+Math.sin(a)*r*0.44,1.6,'l1',0);}
    P.circ(c[0],c[1],r*0.26,'b','k');P.circ(c[0],c[1],r*0.1,'d3',0);return;}
  if(sty==='tyre'){P.circ(c[0],c[1],r,'tyre','k');for(var j=0;j<20;j++){var b=j*Math.PI/10;P.ln([[c[0]+Math.cos(b)*(r-1),c[1]+Math.sin(b)*(r-1)],[c[0]+Math.cos(b)*(r-5),c[1]+Math.sin(b)*(r-5)]],'tyreL',2);}
    P.circ(c[0],c[1],r*0.58,'d3','k');P.circ(c[0],c[1],r*0.42,'d2','k');for(var m=0;m<8;m++){var e=m*Math.PI/4;P.circ(c[0]+Math.cos(e)*r*0.32,c[1]+Math.sin(e)*r*0.32,1.5,'l2',0);}P.circ(c[0],c[1],r*0.16,'b','k');return;}
  P.circ(c[0],c[1],r,'d4','k');P.circ(c[0],c[1],r-3.2,null,'k');P.circ(c[0],c[1],r-4.2,'d3',0);
  for(var s=0;s<8;s++){var t=s*Math.PI/4;P.ln([[c[0]+Math.cos(t)*12,c[1]+Math.sin(t)*12],[c[0]+Math.cos(t)*(r-4),c[1]+Math.sin(t)*(r-4)]],'k',s%2?1:2);}
  var hx=[];for(var h=0;h<6;h++){var u=h*Math.PI/3;hx.push([c[0]+Math.cos(u)*12.5,c[1]+Math.sin(u)*12.5]);}P.poly(hx,'d3');P.circ(c[0],c[1],7.5,'b','k');}
function aSprocket(P,x,y,r){var c=aH([x,y])[0];for(var i=0;i<8;i++){var a=(i*45+22.5)*Math.PI/180,b=10*Math.PI/180;
    P.poly([[c[0]+Math.cos(a-b)*r,c[1]+Math.sin(a-b)*r],[c[0]+Math.cos(a)*(r+10),c[1]+Math.sin(a)*(r+10)],[c[0]+Math.cos(a+b)*r,c[1]+Math.sin(a+b)*r]],'trkL');}
  P.circ(c[0],c[1],r,'d4','k');}
/* track: belt path in image px (sprocket at the rear, idler at the front), ground run of links */
function aTrack(P,G,top){var sp=G.spr,id=G.idl,w=G.wx,r=G.wr,y0=AGY-3.5,gx0=w[0]-r*0.18,gx1=w[w.length-1]+r*0.28,rs=sp[2]+5,ri=id[2]+5;
  var tr=aTan(gx0,y0,sp[0],sp[1],rs,1),tf=aTan(gx1,y0,id[0],id[1],ri,-1),pts=[],i;
  /* rear: from the top of the sprocket round its back to the tangent, down to the ground */
  var a0=-90,a1=tr[2];if(a1<a0)a1+=360;for(i=0;i<=10;i++){var a=(a0-(360-(a1-a0))*i/10)*Math.PI/180;pts.push(sp[0]+Math.cos(a)*rs,sp[1]+Math.sin(a)*rs);}
  pts.push(gx0,y0,gx1,y0);
  var b0=tf[2],b1=-90;if(b1>b0)b1-=360;for(i=0;i<=10;i++){var b=(b0+(b1-b0)*i/10)*Math.PI/180;pts.push(id[0]+Math.cos(b)*ri,id[1]+Math.sin(b)*ri);}
  if(top)pts=pts.concat(top);
  var L=aH(pts);P.ln(L,'k',10);P.ln(L,'trk',7);P.ln(L,'trkL',3,[3,5]);P.ln(L,'trkW',1,[1,9]);
  /* ground run links */
  for(var x=gx0;x<gx1-4;x+=21){P.rect.apply(P,[].concat(aH([x,AGY-0.5])[0],aH([Math.min(x+21,gx1),AGY-6.5])[0],['trk',0]));
    P.poly(aH([x+3,AGY-6.5,x+4,AGY-9.5,x+9,AGY-9.5,x+10,AGY-6.5]),'trk','k');
    P.poly(aH(aR(x+13,AGY-3.5,x+25,AGY-0.5)),'trkL',0);P.rect.apply(P,[].concat(aH([x+18,AGY-2.5])[0],aH([x+20,AGY-0.5])[0],['k',0]));}
  P.ln(aH([gx0,AGY-6.5,gx1,AGY-6.5]),'k',1);}
function aHousing(P,x,y){var H=aH([].concat(aArc(x+36,y-17,18,90,-90,6),[x+10,y+1,x+10,y-35]));P.poly(H,'d4');P.poly(aH([].concat(aArc(x+36,y-17,13,90,-90,6),[x+14,y-4,x+14,y-30])),'d3',0);
  P.poly(aH([x+34,y-28,x+42,y-19,x+33,y-15]),'trkL','k');}
function aReturnRoller(P,x,y){var c=aH([x,y])[0];P.circ(c[0],c[1],9,'d4','k');P.circ(c[0],c[1],4,'b','k');}
function aRunGear(P,G,A){var sty=A.run||'sp',wst=sty==='sp'?'sp':'disc',open=sty==='open'||sty==='rub',top=null;
  aSprocket(P,G.spr[0],G.spr[1],G.spr[2]);var ic=aH([G.idl[0],G.idl[1]])[0];P.circ(ic[0],ic[1],G.idl[2],'d4','k');P.circ(ic[0],ic[1],G.idl[2]*0.4,'d3','k');
  if(open){var ty=G.spr[1]-G.spr[2]-5,rr=[],n=Math.max(2,G.wx.length-3);for(var i=0;i<n;i++)rr.push(G.wx[0]+(G.wx[G.wx.length-1]-G.wx[0])*(i+0.5)/n);
    top=[];var xs=[G.idl[0]].concat(rr.slice().reverse()).concat([G.spr[0]]);xs.forEach(function(x,j){top.push(x,ty+(j&&j<xs.length-1?-2:0));if(j<xs.length-1)top.push((x+xs[j+1])/2,ty+4);});}
  aTrack(P,G,top);if(open)rr.forEach(function(x){aReturnRoller(P,x,G.spr[1]-G.spr[2]+5);});
  if(sty==='sp')G.wx.forEach(function(x){aHousing(P,x,G.wy);});
  G.wx.forEach(function(x){aWheel(P,x,G.wy,G.wr,wst);});}

/* ---------- hulls (hull frame) ---------- */
function aSkirt(P,G,o){var t=G.skT,b=G.skB,x0=G.skX0,x1=G.skX1,dr=G.skDr,df=G.skDf,seams=G.seams;
  P.poly(aH([x0,t,x1,t,x1-df,b,x0+dr,b]),o&&o.rub?'rub':'b');if(o&&o.rub){seams.forEach(function(x){P.ln(aH([x,t+2,x,b-1]),'k',1);});return;}
  seams.forEach(function(x){P.ln(aH([x,t,x,b]),'k',1);});
  var ed=[x0].concat(seams).concat([x1]);for(var i=0;i<ed.length-1;i++){var a=ed[i]+4,c=ed[i+1]-4,y0=t+3,y1=b-3,first=i===0,last=i===ed.length-2,
      la=first?x0+dr*(y0-t)/(b-t)+4:a,lb=first?x0+dr*(y1-t)/(b-t)+4:a,ra=last?x1-df*(y0-t)/(b-t)-4:c,rb=last?x1-df*(y1-t)/(b-t)-4:c;
    P.stroke(aH([la,y0,ra,y0,rb,y1,lb,y1]),true,'sm',1,[3,2]);if(!first&&!last)P.ln(aH([(a+c)/2+3,y0,(a+c)/2+3,y1]),'sm',1,[3,2]);}
  (G.tabs||[]).forEach(function(x){P.poly(aH(aR(x,t-5,x+42,t+5)),'l3');P.ln(aH([x+4,t-2,x+38,t-2]),'l4',1);P.ln(aH([x+1,t+6,x+42,t+6]),'sm',1);});}
function aGrille(P,x0,y0,x1,y1,groups){P.poly(aH(aRR(x0,y0,x1,y1,8)),'d1');groups.forEach(function(gx){for(var s=0;s<3;s++){var x=gx+s*8;P.poly(aH(aR(x,y0+2,x+8,y1-2)),'l2',0);P.ln(aH([x+1,y0+2,x+1,y1-2]),'l4',1);P.ln(aH([x+7,y0+2,x+7,y1-2]),'k2',1);}});}
function aDoor(P,x0,y0,x1,y1){P.poly(aH(aR(x0,y0,x1,y1)),'b');P.ln(aH([x0,(y0+y1)/2,x1-3,(y0+y1)/2]),'k',1);P.poly(aH(aR(x0+2,(y0+y1)/2-7,x0+5,(y0+y1)/2+7)),'d3');
  [y0+6,y1-6].forEach(function(y){P.ln(aH([x1-6,y-3,x1-2,y-3,x1-2,y+3,x1-6,y+3]),'k',1);});}
function aPeri(P,pts){for(var i=0;i<pts.length;i+=2)P.poly(aH(aRR(pts[i],pts[i+1],pts[i]+10,pts[i+1]+4,1.5)),'gl');}
function aSlatH(P,x0,y0,x1,y1){for(var x=x0;x<=x1;x+=8)P.poly(aH(aR(x,y0,x+2,y1)),'b');P.poly(aH(aR(x0-2,y0,x1+4,y0+3)),'b');P.poly(aH(aR(x0-2,y1-3,x1+4,y1)),'b');}
function aEraRow(P,x0,x1,y0,y1,rows,w){var h=(y1-y0)/rows;for(var r=0;r<rows;r++)for(var x=x0+(r%2?w/2:0);x+w<=x1+0.1;x+=w){P.poly(aH(aR(x,y0+r*h,x+w-1,y0+(r+1)*h-1)),'l1');P.ln(aH([x+2,y0+r*h+3,x+w-4,y0+r*h+3]),'l3',1);P.circ(aH([x+4,y0+r*h+(h-1)/2])[0][0],aH([x+4,y0+r*h+(h-1)/2])[0][1],1.2,'d3',0);}}
var AHULL={
 xt:{n:'刑天式車體',kind:'tr',d:'長車體、平緩楔形前上裝甲、後段引擎散熱柵與艙門',
  lay:function(G){G.spr=[66,501,29];G.idl=[785,497,27];G.wy=552;G.wr=39.5;G.wx=aSpread(163,689,G.nw);G.skT=438;G.skB=507;G.skX0=12;G.skX1=820;G.skDr=68;G.skDf=40;G.seams=[145,341,538,735];
    G.tabs=[68,166,280,362,477,560,674,744];G.ring=[438,399];G.ringW=[322,556];G.rearX=10;G.frontX=820;G.plate=[182,445];G.emb=[750,472];G.deck=381;G.topAt=[[10,381],[195,381],[320,399],[600,399],[742,412],[820,438]];},
  draw:function(P,G,A,K){P.poly(aH([12,438,12,509,96,521,130,545,330,556,702,556,780,507,820,476,820,438]),'d2');P.poly(aH([820,438,820,476,780,507]),'b');
   aRunGear(P,G,A);
   if(A.run==='open'||A.run==='rub'){P.poly(aH([12,438,820,438,820,452,12,452]),'b');P.ln(aH([14,448,816,448]),'sm',1,[3,3]);if(A.run==='rub')aSkirt(P,{skT:452,skB:482,skX0:40,skX1:790,skDr:0,skDf:0,seams:[180,320,460,600,740]},{rub:1});}
   else aSkirt(P,G);
   if(K.slatH)aSlatH(P,-6,436,120,514);
   if(K.addH)[[350,446,520,502],[530,446,700,502]].forEach(function(r){P.poly(aH(aR(r[0],r[1],r[2],r[3])),'l1');for(var x=r[0]+8;x<r[2];x+=26){P.circ(aH([x,r[1]+6])[0][0],aH([x,r[1]+6])[0][1],1.4,'d3',0);P.circ(aH([x,r[3]-6])[0][0],aH([x,r[3]-6])[0][1],1.4,'d3',0);}});
   if(K.eraH)aEraRow(P,300,780,441,504,2,32);
   P.poly(aH([10,381,195,381,320,399,600,399,700,408,742,412,790,428,815,436,820,438,10,438]),'b');
   P.poly(aH([620,400,700,408,742,412,790,428,812,436,620,400]),'l1',0);P.ln(aH([620,399,810,437]),'k',1);P.ln(aH([640,404,700,411,742,415]),'sm',1,[3,2]);
   P.ln(aH([13,384,194,384,319,402,600,402]),'sm',1,[3,3]);P.ln(aH([13,435,812,435]),'sm',1,[3,3]);P.ln(aH([197,384,197,434]),'sm',1,[3,3]);
   aGrille(P,20,389,160,428,[27,75,122]);aDoor(P,163,388,195,432);
   P.poly(aH(aR(12,374,25,381)),'b');P.ln(aH([13,379,18,375]),'lamp',2);P.poly(aH(aR(5,414,9,437)),'trkL');
   aPeri(P,[708,407,722,409,736,411]);P.poly(aH([782,436,790,419,812,415,816,425,815,437]),'d2');P.poly(aH(aR(809,418,815,428)),'trkL');
   if(K.hsmk){P.stroke(aH(aR(212,405,275,432)),true,'trkW',1,[3,2]);P.poly(aH(aR(217,416,270,429)),'d2');[0,1].forEach(function(j){for(var i=0;i<3;i++){var x=222+j*25+i*6;P.poly(aH(aR(x,410,x+5,424)),'gry');P.ln(aH([x+1,411,x+1,423]),'gryL',1);}});}}},
 lt:{n:'輕型戰車車體',kind:'tr',d:'低矮車身、長斜前裝甲、前置引擎、後部艙門',
  lay:function(G){G.spr=[60,510,26];G.idl=[790,505,25];G.wy=556;G.wr=36;G.wx=aSpread(160,690,G.nw);G.skT=446;G.skB=510;G.skX0=12;G.skX1=812;G.skDr=60;G.skDf=34;G.seams=[170,370,570];
    G.tabs=[80,190,300,390,500,590,700];G.ring=[400,412];G.ringW=[300,500];G.rearX=10;G.frontX=815;G.plate=[200,452];G.emb=[745,474];G.deck=402;G.topAt=[[10,402],[300,412],[520,412],[815,446]];},
  draw:function(P,G,A,K){P.poly(aH([12,446,12,515,90,528,130,548,330,558,700,558,775,512,812,486,812,446]),'d2');aRunGear(P,G,A);
   if(A.run==='open'||A.run==='rub'){P.poly(aH([12,446,812,446,812,458,12,458]),'b');if(A.run==='rub')aSkirt(P,{skT:458,skB:486,skX0:40,skX1:790,skDr:0,skDf:0,seams:[200,360,520,680]},{rub:1});}else aSkirt(P,G);
   if(K.slatH)aSlatH(P,-6,444,110,516);if(K.eraH)aEraRow(P,280,770,449,506,2,30);
   P.poly(aH([10,402,280,402,300,412,520,412,815,446,10,446]),'b');P.poly(aH([520,414,812,447,806,450,520,419]),'l1',0);
   P.ln(aH([13,405,278,405,298,415,520,415]),'sm',1,[3,3]);P.ln(aH([13,443,808,443]),'sm',1,[3,3]);
   aGrille(P,560,421,700,436,[575,615,655]);P.poly(aH(aR(20,407,90,440)),'b');P.ln(aH([24,423,86,423]),'k',1);P.poly(aH(aR(14,398,24,402)),'b');P.ln(aH([15,401,20,399]),'lamp',2);
   aPeri(P,[730,428,744,430]);P.poly(aH([786,447,792,436,808,433,811,446]),'d2');}},
 ifv:{n:'步兵戰車車體',kind:'tr',d:'高車身、陡峭前裝甲、前置引擎、後部跳板門',
  lay:function(G){G.spr=[64,503,27];G.idl=[790,492,26];G.wy=554;G.wr=37;G.wx=aSpread(165,690,G.nw);G.skT=440;G.skB=510;G.skX0=12;G.skX1=815;G.skDr=60;G.skDf=30;G.seams=[160,340,520,700];
    G.tabs=[70,180,290,370,480,550,660,720];G.ring=[470,368];G.ringW=[380,560];G.rearX=10;G.frontX=822;G.plate=[190,447];G.emb=[752,470];G.deck=368;G.topAt=[[10,368],[640,368],[822,430]];},
  draw:function(P,G,A,K){P.poly(aH([12,440,12,510,90,522,130,546,330,556,700,556,782,505,820,470,820,440]),'d2');aRunGear(P,G,A);
   if(A.run==='open'||A.run==='rub'){P.poly(aH([12,440,820,440,820,452,12,452]),'b');if(A.run==='rub')aSkirt(P,{skT:452,skB:482,skX0:40,skX1:790,skDr:0,skDf:0,seams:[200,360,520,680]},{rub:1});}else aSkirt(P,G);
   if(K.slatH)aSlatH(P,-6,436,140,514);if(K.eraH)aEraRow(P,280,790,443,507,2,32);
   P.poly(aH([10,368,640,368,822,430,822,440,10,440]),'b');P.poly(aH([640,370,820,431,816,434,640,375]),'l1',0);
   P.ln(aH([13,371,638,371]),'sm',1,[3,3]);P.ln(aH([13,437,815,437]),'sm',1,[3,3]);P.ln(aH([150,371,150,437]),'sm',1,[3,3]);
   P.poly(aH(aR(14,376,120,434)),'d1');P.ln(aH([18,380,116,380]),'l2',1);P.ln(aH([67,378,67,432]),'k',1);P.poly(aH(aR(26,398,32,412)),'d3');
   [190,300].forEach(function(x){P.poly(aH(aR(x,385,x+22,396)),'gl');});P.poly(aH(aR(240,390,262,428)),'b');P.circ(aH([251,409])[0][0],aH([251,409])[0][1],3,'d3','k');
   aGrille(P,660,390,760,410,[668,700,732]);aPeri(P,[770,423]);P.poly(aH(aR(12,360,25,368)),'b');P.ln(aH([13,366,18,362]),'lamp',2);}},
 old:{n:'傳統低矮車體',kind:'tr',d:'低矮車身、長而平緩的前上裝甲、擋泥板與外露托帶輪、後部油桶',
  lay:function(G){G.spr=[56,512,25];G.idl=[792,508,24];G.wy=556;G.wr=40;G.wx=aSpread(160,700,G.nw);G.skT=452;G.skB=470;G.skX0=12;G.skX1=820;G.skDr=0;G.skDf=0;G.seams=[];G.tabs=[];
    G.ring=[430,418];G.ringW=[330,530];G.rearX=10;G.frontX=822;G.plate=[24,423];G.unitRight=1;G.emb=[560,437];G.deck=418;G.topAt=[[10,418],[600,418],[822,452]];G.noSkirt=1;},
  draw:function(P,G,A,K){P.poly(aH([12,452,12,515,80,528,130,548,330,558,710,558,790,520,822,480,822,452]),'d2');var run=A.run==='sp'||A.run==='disc'?'open':A.run;aRunGear(P,G,{run:run});
   if(K.slatH)aSlatH(P,-6,440,120,512);
   P.poly(aH([10,418,600,418,822,452,822,460,10,460]),'b');P.poly(aH([600,420,820,453,815,456,600,424]),'l1',0);P.ln(aH([13,421,598,421]),'sm',1,[3,3]);P.ln(aH([13,457,815,457]),'sm',1,[3,3]);
   [[250,446,330,458],[360,446,430,458],[470,446,540,458]].forEach(function(r){P.poly(aH(aR(r[0],r[1],r[2],r[3])),'l1');P.ln(aH([r[0]+3,r[1]+3,r[2]-3,r[1]+3]),'l3',1);});
   if(K.eraH)aEraRow(P,560,800,422,452,1,28);
   P.poly(aH(aR(330,430,370,446)),'gry');for(var i=0;i<5;i++)P.ln(aH([334+i*8,432,334+i*8,444]),'gryD',1);aPeri(P,[690,437]);
   if(K.drum){[[-30,400],[-30,432]].forEach(function(p){P.poly(aH(aRR(p[0],p[1],p[0]+38,p[1]+28,6)),'d1');P.ln(aH([p[0]+12,p[1],p[0]+12,p[1]+28]),'k',1);P.ln(aH([p[0]+26,p[1],p[0]+26,p[1]+28]),'k',1);});}}},
 spg:{n:'自走砲車體',kind:'tr',d:'前置引擎、長平車頂、後置大型砲塔座',
  lay:function(G){AHULL.ifv.lay(G);G.ring=[300,380];G.ringW=[150,470];G.plate=[330,450];G.deck=380;G.topAt=[[10,380],[600,380],[822,436]];},
  draw:function(P,G,A,K){P.poly(aH([12,440,12,510,90,522,130,546,330,556,700,556,782,505,820,470,820,440]),'d2');aRunGear(P,G,A);
   if(A.run==='open'||A.run==='rub')P.poly(aH([12,440,820,440,820,452,12,452]),'b');else aSkirt(P,G);if(K.eraH)aEraRow(P,500,790,443,507,2,32);
   P.poly(aH([10,380,600,380,822,436,822,440,10,440]),'b');P.poly(aH([600,382,820,437,815,440,600,387]),'l1',0);P.ln(aH([13,383,598,383]),'sm',1,[3,3]);P.ln(aH([13,437,815,437]),'sm',1,[3,3]);
   aGrille(P,610,395,740,418,[620,660,700]);aPeri(P,[760,425]);P.poly(aH(aR(14,388,70,434)),'d1');P.ln(aH([42,390,42,432]),'k',1);P.poly(aH(aR(12,372,25,380)),'b');P.ln(aH([13,378,18,374]),'lamp',2);}},
 wh:{n:'輪式裝甲車體',kind:'wh',d:'船形車首、高車身、輪拱、側門與觀察窗',
  lay:function(G){var n=Math.max(2,Math.round(G.nw/2)),r=Math.max(40,(G.wd||1.2)*AS/2);G.wr=r;G.wy=AGY-r;G.wx=n>=4?[150,265,560,675]:n===3?[150,330,620]:[175,640];G.ring=[430,360];G.ringW=[350,520];
    G.rearX=10;G.frontX=830;G.plate=[300,470];G.emb=[690,452];G.deck=360;G.topAt=[[10,360],[640,360],[830,440]];},
  draw:function(P,G,A,K){var r=G.wr,wy=G.wy,bot=wy-r*0.15;
   P.poly(aH([12,360,640,360,800,420,830,440,822,470,760,bot-6,700,bot,120,bot,40,bot-6,12,470]),'b');
   P.poly(aH([640,362,800,421,796,424,640,367]),'l1',0);P.ln(aH([14,363,638,363]),'sm',1,[3,3]);
   G.wx.forEach(function(x){P.poly(aH([].concat(aArc(x,wy,r+10,0,180,12),[x-r-10,bot+2,x+r+10,bot+2])),'d3',0);P.ln(aH(aArc(x,wy,r+10,0,180,12)),'k',1);});
   P.poly(aH([12,bot-6,800,bot-6,760,wy+4,60,wy+4]),'d2');G.wx.forEach(function(x){aWheel(P,x,wy,r,'tyre');});
   P.ln(aH([14,440,820,440]),'sm',1,[3,3]);P.poly(aH(aR(380,375,450,445)),'b');P.ln(aH([380,410,447,410]),'k',1);P.poly(aH(aR(384,400,389,420)),'d3');
   [470,520,180,230].forEach(function(x){P.poly(aH(aR(x,380,x+26,392)),'gl');});aGrille(P,560,375,640,395,[570,600]);aPeri(P,[760,418]);
   P.poly(aH(aR(4,380,12,420)),'d1');P.poly(aH(aR(12,352,25,360)),'b');P.ln(aH([13,358,18,354]),'lamp',2);
   if(K.slatH)aSlatH(P,-6,365,120,470);if(K.eraH)aEraRow(P,300,620,412,438,1,32);}},
 mrap:{n:'防地雷反伏擊車體',kind:'wh',d:'V 型車底、高車身、駕駛艙擋風玻璃、大型越野輪胎',
  lay:function(G){var r=Math.max(44,(G.wd||1.2)*AS/2);G.wr=r;G.wy=AGY-r;var n=Math.max(2,Math.round(G.nw/2));G.wx=n>=3?[170,330,660]:[180,640];G.ring=[330,318];G.ringW=[280,380];
    G.rearX=10;G.frontX=800;G.plate=[360,425];G.emb=[560,412];G.deck=318;G.topAt=[[10,318],[560,318],[700,378],[800,400]];},
  draw:function(P,G,A,K){var r=G.wr,wy=G.wy;
   P.poly(aH([60,wy-r*0.2,740,wy-r*0.2,690,wy+r*0.35,110,wy+r*0.35]),'d2');
   P.poly(aH([12,318,560,318,600,320,700,378,800,400,805,445,780,470,40,470,12,450]),'b');P.poly(aH([560,320,600,322,690,376,640,376,580,326]),'gl');P.ln(aH([600,322,640,376]),'k',1);
   P.ln(aH([14,321,558,321]),'sm',1,[3,3]);P.poly(aH(aR(400,330,470,440)),'b');P.ln(aH([400,385,467,385]),'k',1);P.poly(aH(aR(404,375,409,395)),'d3');
   [[200,335,270,370],[300,335,370,370]].forEach(function(w){P.poly(aH(aR(w[0],w[1],w[2],w[3])),'gl');P.ln(aH([w[0]+2,w[1]+3,w[2]-2,w[1]+3]),'glL',1);});
   G.wx.forEach(function(x){P.poly(aH([].concat(aArc(x,wy,r+12,0,180,12),[x-r-12,470,x+r+12,470])),'d3',0);P.ln(aH(aArc(x,wy,r+12,0,180,12)),'k',1);});
   G.wx.forEach(function(x){aWheel(P,x,wy,r,'tyre');});P.poly(aH(aR(790,440,815,470)),'d2');P.poly(aH(aR(14,330,30,360)),'lamp');
   P.circ(aH([-8,390])[0][0],aH([-8,390])[0][1],34,'tyre','k');P.circ(aH([-8,390])[0][0],aH([-8,390])[0][1],18,'d3','k');}}
};
function aSpread(a,b,n){var o=[];n=Math.max(2,n||6);for(var i=0;i<n;i++)o.push(a+(b-a)*i/(n-1));return o;}

/* ---------- turrets (turret frame: image pixels relative to the 刑天 turret-ring centre 438,399) ---------- */
function aSmoke(P,x,y,n,ang){/* cluster of grenade tubes on an olive base, rising to the front */P.push().tr(x-438,399-y).rot(ang||8);
  P.poly(aT([438,399,456,397,462,404,460,424,442,426,436,416]),'l1');P.ln(aT([441,402,441,422]),'l4',2);
  for(var i=0;i<(n||3);i++){var yy=393+i*10;P.poly(aT([454,yy,484,yy-3,486,yy+5,456,yy+8]),'gry');P.ln(aT([457,yy+1,483,yy-2]),'gryL',1);}P.pop();}
function aRoundel(P,x,y){var c=aT([x,y])[0];P.circ(c[0],c[1],15.5,'wht',0);P.circ(c[0],c[1],11.5,'b',0);P.poly(aT([].concat(aArc(x,y,9,35,325,14),aArc(x,y,5.5,325,35,14))),'wht',0);}
function aEraT(P,pts,x0,x1,y0,y1,w,h){P.clipTo(pts);for(var y=y0,r=0;y<y1;y+=h,r++)for(var x=x0+(r%2?w/2:0)-w;x<x1;x+=w){P.poly(aT(aR(x,y,x+w-1,y+h-1)),'l1');P.ln(aT([x+2,y+3,x+w-4,y+3]),'l3',1);}P.unclip();}
function aSlatT(P,x0,x1,y0,y1){for(var x=x0;x<=x1;x+=8)P.poly(aT(aR(x,y0,x+2,y1)),'b');P.poly(aT(aR(x0-2,y0,x1+4,y0+3)),'b');P.poly(aT(aR(x0-2,y1-3,x1+4,y1)),'b');}
function aApsT(P,o){(o.apsP||[]).forEach(function(p){P.poly(aT(aR(p[0],p[1],p[0]+16,p[1]+20)),'d2');P.poly(aT(aR(p[0]+3,p[1]+3,p[0]+13,p[1]+17)),'k2',0);P.ln(aT([p[0]+4,p[1]+5,p[0]+12,p[1]+5]),'l3',1);});
  (o.apsL||[]).forEach(function(p){P.poly(aT(aR(p[0],p[1],p[0]+30,p[1]+16)),'d1');[0,1].forEach(function(i){var c=aT([p[0]+30,p[1]+4+i*8])[0];P.circ(c[0],c[1],3,'tube','k');});});}
function aMast(P,x,yTop,yBot,dome){P.poly(aT(aR(x-2,yTop,x+2,yBot)),'d2');if(dome){var c=aT([x,yTop-8])[0];P.circ(c[0],c[1],10,'dome','k');P.ln(aT([x-10,yTop-8,x+10,yTop-8]),'trkL',1);}}
var ATUR={
 xt:{n:'刑天式楔形砲塔',d:'長而低矮的楔形砲塔，尾艙置物箱、側面欄杆與置物格',
  draw:function(P,o,K,A){var e=o.al?-30:0,bx=function(a){var r=a.slice();for(var i=0;i<r.length;i+=2)if(r[i]<300)r[i]+=e;return r;};
   P.poly(aT(aR(322,388,556,399)),'d4');
   P.poly(aT(bx([122,328,134,318,196,316,196,377,130,372,122,362])),A.acc.box?'d1':'b');
   var body=aT(bx([194,315,227,310,267,308,293,306,320,302,480,302,517,308,567,315,630,322,643,323,670,333,693,344,693,387,643,392,550,391,430,390,320,389,273,388,233,384,207,381,194,378]));
   P.poly(body,'b');P.ln(aT(bx([200,320,320,306,480,306,567,319,640,326])),'sm',1,[3,3]);P.ln(aT([480,303,503,386]),'sm',1,[3,3]);
   if(K.addT){P.poly(aT([590,318,646,324,700,343,716,356,714,389,650,395,590,392]),'l1');P.stroke(aT([596,323,644,328,694,346,708,358,707,385,650,390,596,387]),true,'sm',1,[3,2]);
     [[610,330],[640,334],[680,350],[610,380],[650,384],[690,380]].forEach(function(b){var c=aT(b)[0];P.circ(c[0],c[1],1.5,'d3',0);});}
   else{P.ln(aT([].concat(aQB(643,323,610,340,614,365,6),aQB(614,365,618,386,643,392,6))),'k',1);P.ln(aT([600,318,600,386]),'k',1);P.ln(aT([603,318,603,386]),'k',1);
     var pc=aT([645,348])[0];P.circ(pc[0],pc[1],5,'l3',0);P.circ(pc[0]-1.5,pc[1]+1.5,2,'l4',0);}
   if(K.eraT)aEraT(P,body,560,700,318,388,22,14);
   if(A.mark.roundel)aRoundel(P,269+e,343);
   P.poly(aT(bx(aR(192,343,640,346))),'d2');[355,407,500,602].forEach(function(x){P.ln(aT([x,346,x,383]),'k',2);});
   P.ln(aT(bx([].concat(aQB(193,346,194,366,232,372,6),[283,377,330,382,500,384]))),'k',1);
   P.ln(aT([].concat([500,384],aQB(505,384,505,350,522,338,5),[560,333,598,336])),'k',1);P.ln(aT([505,376,600,376]),'sm',1,[3,2]);
   P.stroke(aT(aR(370,315,433,343)),true,'trkW',1,[3,2]);P.stroke(aT(aR(374,319,429,339)),true,'d3',1);P.ln(aT([386,328,386,332,417,332,417,328]),'k',2);
   if(A.acc.smk)aSmoke(P,527,334,3,6);
   P.poly(aT(aR(688,344,707,387)),'d2');
   if(A.acc.box){P.poly(aT(bx(aR(133,315,194,378))),'box');P.stroke(aT(bx(aR(136,318,191,375))),true,'boxD',1);P.ln(aT(bx([150,315,150,308,176,308,176,315])),'k',2);
     P.poly(aT(bx(aR(143,330,147,358))),'boxD');var sc=aT(bx([180,364]))[0];P.circ(sc[0],sc[1],7,null,'boxD',1);P.ln(aT(bx([175,359,185,369])),'boxD',1);}
   if(K.slatT)aSlatT(P,116+e,200+e,318,386);
   return {gun:[707,366.5],mh:21,sight:[400,302],rws:[300,306],ant:A.acc.ant?[[202+e,258,305],[212.7+e,40,305]]:[],roundel:null,apsP:[[620,300],[250+e,300]],apsL:[[520,350]],ew:[160+e,230,316],front:693,rear:122+e,roof:302};}},
 saa:{n:'響箭防空砲塔',d:'多面體砲塔、兩側飛彈發射箱、雙聯機砲、追蹤與搜索雷達',
  draw:function(P,o,K,A,R){var rad=R.rads&&R.rads.length,mis=R.msls&&R.msls.length;
   P.poly(aT(aR(322,388,556,399)),'d4');
   if(rad){P.poly(aT(aR(205,232,222,262)),'b');P.poly(aT([158,229,228,225,231,236,176,243,158,240]),'b');
     var h1=aT([210,232,214,205,215,180,210,166,199,160,186,162]),h2=aT([176,236,150,220,132,207,122,198,126,191,135,193]);[h1,h2].forEach(function(h){P.ln(h,'k',11);P.ln(h,'b',8);});}
   var body=aT([187,258,200,247,237,252,520,256,535,259,580,307,585,337,578,363,550,390,233,388]);P.poly(body,'b');
   P.poly(aT([233,388,245,325,312,388]),'d1');P.poly(aT([520,388,550,390,578,363,585,337,546,352]),'d1');P.poly(aT([520,256,535,259,580,307,585,337,548,326,528,264]),'l1');
   P.ln(aT([245,325,312,388]),'sm',1,[3,2]);P.ln(aT([528,264,548,326,546,352,520,388]),'sm',1,[3,2]);
   P.poly(aT([196,248,237,248,237,295,188,295,188,256]),'gry');P.stroke(aT([199,251,234,251,234,292,191,292,191,258]),true,'gryD',1);P.poly(aT(aR(228,255,236,259)),'k2',0);P.poly(aT(aR(228,287,236,291)),'k2',0);
   if(A.acc.smk!==0)aSmoke(P,238,247,3,-8);
   P.poly(aT([300,390,330,372,540,357,562,378,550,390]),'d1');
   if(mis){[[245,290,248,37,14,31,2],[307,322,209,60,14,36,3]].forEach(function(L){P.push().tr(L[0]-438,399-L[1]).rot(L[4]);var len=L[2],h=L[3],f=L[5],n=L[6];
       P.poly([[0,0],[len-f,0],[len-f,-h],[0,-h]],'b');P.stroke([[6,-5],[len-f-6,-5],[len-f-6,-h+5],[6,-h+5]],true,'l3',1);P.poly([[0,0],[9,0],[9,-h],[0,-h]],'k2');
       P.poly([[len-f,0],[len,2],[len,-h+2],[len-f,-h]],'l1');for(var r=0;r<n;r++)for(var cI=0;cI<2;cI++){var cy=-h*(r+0.5)/n,cx=len-f+f*(cI+0.5)/2;P.circ(cx,cy,Math.min(5,h/n*0.32),'tube',0);}
       P.pop();});
     P.push().tr(355-438,399-298).rot(14);P.poly([[0,0],[60,0],[60,-6],[0,-6]],'gryL');P.pop();}
   [[493,297,15],[503,331,15]].forEach(function(c){P.push().tr(c[0]-438,399-c[1]).rot(c[2]);P.poly([[0,6],[26,6],[26,-7],[0,-7]],'k2');P.poly([[26,2.5],[82,2.5],[82,-2.5],[26,-2.5]],'bel');P.pop();});
   if(rad){P.poly(aT([566,300,590,304,592,326,572,332]),'d1');P.push().tr(590-438,399-312).rot(-15);P.poly([[-8,38],[8,38],[8,-38],[-8,-38]],'b');P.poly([[-8,38],[8,38],[8,18],[-8,18]],'l4');P.poly([[-8,-20],[8,-20],[8,-38],[-8,-38]],'d1');P.pop();}
   P.poly(aT(aR(327,244,400,257)),'b');P.poly(aT(aR(330,246,342,256)),'gl');P.poly(aT(aR(350,246,395,256)),'gl');P.poly(aT(aR(351,247,394,249)),'glL',0);
   P.poly(aT(aR(370,232,387,243)),'b');P.poly(aT(aR(367,212,390,232)),'b');P.poly(aT(aR(382,215,389,230)),'gl');P.poly(aT([410,244,410,234,416,231,423,236,423,244]),'b');
   return {gun:null,sight:null,rws:[300,250],ant:A.acc.ant?[[268,212,250]]:[],roundel:null,apsP:[[540,262],[200,262]],apsL:[],ew:[200,180,248],front:585,rear:187,roof:256};}},
 box:{n:'箱型砲塔',d:'垂直正面與側面、平頂、尾艙懸出，第三代西方戰車常見外形',
  draw:function(P,o,K,A){var e=o.al?-25:0,bx=function(a){var r=a.slice();for(var i=0;i<r.length;i+=2)if(r[i]<300)r[i]+=e;return r;};
   P.poly(aT(aR(330,390,550,399)),'d4');var body=aT(bx([240,392,225,380,222,318,238,306,640,306,668,312,676,350,670,388,600,393,330,393]));P.poly(body,'b');
   P.poly(aT([640,306,668,312,676,350,650,350,636,312]),'l1');P.ln(aT(bx([228,312,640,310])),'sm',1,[3,3]);P.ln(aT([600,312,600,390]),'k',1);
   if(K.addT){P.poly(aT([610,310,680,316,692,352,686,392,610,394]),'l1');P.stroke(aT([616,315,676,320,686,352,681,387,616,389]),true,'sm',1,[3,2]);}
   if(K.eraT)aEraT(P,body,580,690,312,390,20,14);
   P.poly(aT(bx(aR(232,322,330,362))),'l1');P.ln(aT(bx([240,330,320,330])),'l3',1);P.ln(aT(bx([281,322,281,362])),'k',1);P.poly(aT(aR(400,330,470,356)),'l1');P.ln(aT([405,336,465,336]),'l3',1);
   if(A.acc.smk)aSmoke(P,540,318,4,4);P.poly(aT(aR(668,328,690,380)),'d2');P.poly(aT(aR(560,286,612,306)),'b');P.poly(aT(aR(604,290,611,300)),'gl');
   if(A.acc.box){P.poly(aT(bx(aR(198,318,226,382))),'box');P.stroke(aT(bx(aR(201,321,223,379))),true,'boxD',1);}
   if(K.slatT)aSlatT(P,190+e,240+e,316,388);
   return {gun:[690,354],mh:26,sight:[440,306],rws:[520,306],ant:A.acc.ant?[[255+e,120,306]]:[],roundel:[440,350],apsP:[[640,288],[260+e,288]],apsL:[[500,352]],ew:[260+e,230,306],front:676,rear:222+e,roof:306};}},
 cast:{n:'鑄造圓頂砲塔',d:'低矮的鑄造半球形砲塔、車長塔與防空機槍、紅外線探照燈',
  draw:function(P,o,K,A){P.poly(aT(aR(330,390,550,399)),'d4');var pts=[].concat(aQB(250,392,232,350,280,326,6),aQB(280,326,330,304,430,302,6),aQB(430,302,560,304,620,330,6),aQB(620,330,664,352,662,392,6));
   var body=aT(pts);P.poly(body,'b');P.ln(aT([].concat(aQB(262,388,250,354,290,332,6),aQB(290,332,340,312,430,308,6))),'l3',2);P.ln(aT([].concat(aQB(270,378,330,360,430,356,6),[600,356])),'sm',1,[3,3]);
   if(K.eraT)aEraT(P,body,520,670,320,392,22,15);if(K.addT)P.poly(aT([560,312,632,330,668,360,668,392,560,392]),'l1');
   P.poly(aT([].concat(aQB(250,360,240,348,262,342,4),[340,342,340,354,262,354])),'b');P.ln(aT([270,348,336,348]),'l3',1);
   P.poly(aT(aR(612,322,650,346)),'b');var lc=aT([644,334])[0];P.circ(lc[0],lc[1],6,'gl','k');
   if(A.acc.smk)aSmoke(P,560,330,4,6);var mc=aT([660,366])[0];P.circ(mc[0],mc[1],17,'d2','k');
   if(K.slatT)aSlatT(P,236,262,330,388);
   return {gun:[672,366],mh:17,sight:[420,303],rws:[520,306],ant:A.acc.ant?[[300,120,320]]:[],roundel:[400,345],apsP:[[600,312],[290,318]],apsL:[[480,350]],ew:[300,230,318],front:664,rear:236,roof:302};}},
 ifv:{n:'雙人機砲砲塔',d:'小型雙人砲塔、30 公釐級機砲、側掛反戰車飛彈發射器',
  draw:function(P,o,K,A,R){P.poly(aT(aR(360,390,520,399)),'d4');var body=aT([340,393,332,372,345,346,360,340,520,340,560,356,575,376,572,393]);P.poly(body,'b');
   P.poly(aT([520,340,560,356,575,376,548,376,534,344]),'l1');P.ln(aT([340,346,520,346]),'sm',1,[3,3]);if(K.eraT)aEraT(P,body,500,580,344,392,18,12);
   if(R.msls&&R.msls.length||A.acc.atgm){P.poly(aT([420,340,430,328,440,328,440,340]),'d2');P.poly(aT(aR(380,302,500,328)),'b');P.stroke(aT(aR(385,306,494,324)),true,'l3',1);P.poly(aT([500,302,510,304,510,330,500,328]),'l1');
     [[505,310],[505,321]].forEach(function(p){var c=aT(p)[0];P.circ(c[0],c[1],4,'tube',0);});}
   P.poly(aT(aR(520,322,555,340)),'b');P.poly(aT(aR(548,326,554,336)),'gl');if(A.acc.smk)aSmoke(P,500,352,3,4);P.poly(aT(aR(568,356,585,384)),'d2');
   if(K.slatT)aSlatT(P,326,350,344,392);
   return {gun:[585,370],mh:14,sight:[400,340],rws:[470,340],ant:A.acc.ant?[[350,180,340]]:[],roundel:[440,370],apsP:[[530,330],[350,330]],apsL:[],ew:[350,250,340],front:575,rear:332,roof:340};}},
 rws:{n:'無人遙控砲塔',d:'低矮無人砲塔、頂部光電瞄準具、側面彈藥箱',
  draw:function(P,o,K,A){P.poly(aT(aR(390,391,520,399)),'d4');P.poly(aT([380,393,376,372,390,362,520,362,540,376,540,393]),'b');P.poly(aT([520,362,540,376,526,376,516,366]),'l1');
   P.poly(aT(aR(390,368,420,388)),'d1');P.ln(aT([394,372,416,372]),'l2',1);P.poly(aT(aR(470,345,505,362)),'b');P.poly(aT(aR(498,349,504,358)),'gl');P.poly(aT(aR(536,368,548,388)),'d2');
   if(A.acc.smk)aSmoke(P,430,360,2,4);
   return {gun:[548,378],mh:10,sight:null,rws:null,ant:A.acc.ant?[[400,220,362]]:[],roundel:null,apsP:[],apsL:[],ew:[400,260,362],front:540,rear:376,roof:362};}},
 spg:{n:'自走砲砲塔',d:'大型箱型砲塔、後門與側艙門、通風柵，砲管較長並帶砲口制退器',
  draw:function(P,o,K,A){P.poly(aT(aR(300,390,560,399)),'d4');var body=aT([170,392,160,280,180,262,560,262,610,290,625,340,620,392]);P.poly(body,'b');
   P.poly(aT([560,262,610,290,625,340,596,340,580,270]),'l1');P.ln(aT([170,268,560,268]),'sm',1,[3,3]);P.ln(aT([166,386,618,386]),'sm',1,[3,3]);
   P.poly(aT(aR(175,290,215,380)),'b');P.ln(aT([175,335,212,335]),'k',1);P.poly(aT(aR(178,328,182,342)),'d3');P.poly(aT(aR(300,282,360,350)),'b');P.poly(aT(aR(304,312,308,326)),'d3');
   aGrilleT(P,400,300,520,322);if(A.acc.smk)aSmoke(P,560,284,4,4);if(K.eraT)aEraT(P,body,560,630,270,392,22,15);P.poly(aT(aR(615,298,640,346)),'d2');
   P.poly(aT(aR(240,250,280,262)),'b');P.poly(aT(aR(420,250,470,262)),'b');
   return {gun:[640,322],mh:24,sight:[500,262],rws:[260,262],ant:A.acc.ant?[[200,100,262]]:[],roundel:[460,350],apsP:[[590,268],[200,268]],apsL:[],ew:[200,180,262],front:625,rear:160,roof:262};}},
 none:{n:'無砲塔',d:'無砲塔（裝甲運兵車、防地雷車）；遙控武器站或觀瞄裝置直接裝在車頂',draw:function(){return null;}}
};
function aGrilleT(P,x0,y0,x1,y1){P.poly(aT(aRR(x0,y0,x1,y1,6)),'d1');for(var x=x0+5;x<x1-6;x+=8){P.poly(aT(aR(x,y0+2,x+6,y1-2)),'l2',0);P.ln(aT([x+1,y0+2,x+1,y1-2]),'l4',1);}}
/* ---------- barrels (barrel frame: origin at the mantlet face on the bore axis, reference px at true scale) ---------- */
var AGUN={
 xt:{n:'分段熱護套砲管',d:'防塵套＋四段熱護套，砲口校正鏡（刑天）',vis:0.75,
  draw:function(P,len,cal,coax){var t=Math.max(0.35,cal/120),h=[13.5,12.5,11.5,10].map(function(v){return v*t;}),bl=Math.min(56,len*0.12),cap=14*Math.min(1,t+0.1),sl=(len-bl-cap)/4,bh=14.5*t;
   for(var x=0;x<bl;x+=4)P.poly([[x,-bh],[Math.min(bl,x+4),-bh],[Math.min(bl,x+4),bh],[x,bh]],(x/4)%2?'belD':'bel',0);P.stroke([[0,-bh],[bl,-bh],[bl,bh],[0,bh]],true,'k',1);
   for(var i=0;i<4;i++){var x0=bl+i*sl;P.poly([[x0,-h[i]],[x0+sl,-h[i]],[x0+sl,h[i]],[x0,h[i]]],'b');}var x1=bl+4*sl;P.poly([[x1,-h[3]*0.6],[x1+cap,-h[3]*0.6],[x1+cap,h[3]*0.6],[x1,h[3]*0.6]],'gry');
   if(coax){P.poly([[-11,4.5],[69,4.5],[69,-3.5],[-11,-3.5]],'l1');P.poly([[69,2.5],[117,2.5],[117,-1.5],[69,-1.5]],'k2',0);for(var r=71;r<115;r+=3)P.ln([[r,2.5],[r,-1.5]],'bel',1);P.poly([[115,4.5],[119,4.5],[119,-5.5],[115,-5.5]],'k2');}}},
 fe:{n:'抽煙器砲管',d:'熱護套加中段抽煙器，砲口略寬',vis:0.8,
  draw:function(P,len,cal,coax){var t=Math.max(0.35,cal/120),h=12.5*t;P.poly([[0,-h*1.1],[len*0.42,-h*1.05],[len*0.42,h*1.05],[0,h*1.1]],'b');P.poly([[len*0.42,-h*0.9],[len,-h*0.8],[len,h*0.8],[len*0.42,h*0.9]],'b');
   P.poly([[len*0.3,-h*1.45],[len*0.44,-h*1.45],[len*0.47,-h*1.1],[len*0.47,h*1.1],[len*0.44,h*1.45],[len*0.3,h*1.45],[len*0.27,h*1.1],[len*0.27,-h*1.1]],'l1');P.ln([[len*0.3,h*1.15],[len*0.44,h*1.15]],'l4',1);
   P.poly([[len*0.97,-h*0.95],[len,-h*0.95],[len,h*0.95],[len*0.97,h*0.95]],'d1');[0.15,0.62,0.8].forEach(function(f){P.ln([[len*f,-h*(f<0.42?1.05:0.88)],[len*f,h*(f<0.42?1.05:0.88)]],'k',1);});
   if(coax)P.poly([[-6,3],[40,3],[40,-1],[-6,-1]],'k2');}},
 mb:{n:'砲口制退器砲管',d:'長砲管、抽煙器、雙室砲口制退器（自走砲、大口徑）',vis:0.85,
  draw:function(P,len,cal){var t=Math.max(0.35,cal/120),h=11*t;P.poly([[0,-h*1.15],[len*0.5,-h],[len*0.5,h],[0,h*1.15]],'b');P.poly([[len*0.5,-h*0.85],[len*0.9,-h*0.8],[len*0.9,h*0.8],[len*0.5,h*0.85]],'b');
   P.poly([[len*0.42,-h*1.4],[len*0.54,-h*1.4],[len*0.54,h*1.4],[len*0.42,h*1.4]],'l1');
   P.poly([[len*0.9,-h*1.5],[len,-h*1.5],[len,h*1.5],[len*0.9,h*1.5]],'b');[0.925,0.96].forEach(function(f){P.poly([[len*f,-h*1.5],[len*(f+0.022),-h*1.5],[len*(f+0.022),h*1.5],[len*f,h*1.5]],'d4');});}},
 plain:{n:'光面砲管',d:'無護套的細長砲管，兩段收窄',vis:0.8,
  draw:function(P,len,cal){var t=Math.max(0.35,cal/120),h=11.5*t;P.poly([[0,-h],[len*0.55,-h],[len*0.55,h],[0,h]],'b');P.poly([[len*0.55,-h*0.82],[len,-h*0.78],[len,h*0.78],[len*0.55,h*0.82]],'b');P.ln([[len*0.08,-h],[len*0.08,h]],'k',1);}},
 ac:{n:'機砲（散熱套）',d:'有孔散熱護套、細長砲管、消焰器',vis:0.8,
  draw:function(P,len,cal){var h=Math.max(2,cal/1000*AS*0.55),j=h*2.3;P.poly([[0,-j],[len*0.34,-j],[len*0.34,j],[0,j]],'d1');for(var x=6;x<len*0.32;x+=9){P.circ(x,0,Math.max(1,j*0.35),'k2',0);}
   P.poly([[len*0.34,-h],[len*0.93,-h],[len*0.93,h],[len*0.34,h]],'bel');P.poly([[len*0.93,-h*1.6],[len,-h*1.6],[len,h*1.6],[len*0.93,h*1.6]],'k2');}},
 none:{n:'不顯示',d:'',vis:0,draw:function(){}}
};
/* ---------- sights and weapon stations (image pixels around the anchor) ---------- */
function aS(a,o){return aP(a,o[0],o[1]);}
var ASIGHT={
 xt:{n:'刑天式觀瞄座',d:'寬平台、三面觀察窗、頂部周視鏡',draw:function(P){var o=[400,304],S=function(a){return aS(a,o);};
   P.poly(S(aR(341,288,458,304)),'b');P.poly(S(aR(341,288,458,291)),'d1');P.poly(S(aR(349,269,451,288)),'b');
   [[351,365],[371,400],[416,434],[441,450]].forEach(function(w){P.poly(S(aR(w[0],272,w[1],287)),'gl');P.poly(S(aR(w[0]+1,273,w[1]-1,277)),'glL',0);});
   P.poly(S(aR(390,257,410,269)),'b');P.poly(S(aR(388,237,412,257)),'b');P.poly(S(aR(404,239,411,256)),'glL');P.poly(S([431,269,431,258,438,256,445,262,445,269]),'b');}},
 pano:{n:'柱狀周視鏡',d:'獨立立柱式車長周視鏡與艙蓋',draw:function(P){var o=[400,304],S=function(a){return aS(a,o);};
   P.poly(S(aR(350,298,388,304)),'d1');P.poly(S(aR(418,276,428,304)),'b');P.poly(S(aR(408,256,440,276)),'b');P.poly(S(aR(431,260,439,272)),'gl');P.ln(S([410,259,429,259]),'l3',1);}},
 cup:{n:'車長塔＋機槍',d:'車長指揮塔、觀察鏡與 12.7 公釐機槍',draw:function(P){var o=[400,304],S=function(a){return aS(a,o);};
   P.poly(S(aR(368,290,432,304)),'b');[372,386,400,414].forEach(function(x){P.poly(S(aR(x,294,x+9,299)),'gl');});P.poly(S(aR(394,282,404,290)),'d2');
   P.poly(S(aR(382,272,418,283)),'d2');P.poly(S(aR(418,275,482,279)),'k2');P.poly(S(aR(476,273,484,281)),'k2');P.poly(S(aR(386,283,398,292)),'d1');}},
 none:{n:'無',d:'',draw:function(){}}
};
function aRWS(P){var S=function(a){return aP(a,300,306);};/* frame origin at the station's base */
  P.poly(S(aR(285,299,315,306)),'d1');P.poly(S(aR(282,283,320,299)),'b');P.poly(S(aR(290,268,312,283)),'b');P.poly(S(aR(306,271,311,279)),'gl');
  P.poly(S(aR(320,286,336,294)),'d2');P.poly(S(aR(336,288,398,291)),'k2');P.poly(S(aR(270,285,282,299)),'d2');}
/* ---------- markings ---------- */
function aPlate(P,x,y,txt,unit,right){var t=String(txt||''),first=t.charAt(0),rest=t.slice(1);P.poly(aH(aR(x,y,x+108,y+20)),'wht','plt',2);
  var c0=aH([x+3,y+17])[0];P.textSq(first,c0[0],c0[1],18,'ink','left',0,1);P.ln(aH([x+24,y+3,x+24,y+18]),'redD',2,[1,1]);P.ln(aH([x+27,y+3,x+27,y+18]),'redD',1,[1,1]);
  var c1=aH([x+30,y+18])[0];P.textSq(rest,c1[0],c1[1],21,'ink','left',0,0.62,76);
  if(unit){var c2=aH(right?[x+116,y+17]:[x+54,y+42])[0];P.textSq(unit,c2[0],c2[1],18,'wht',right?'left':'center',0,1);}}
function aFlame(P,x,y){P.poly(aH([x-8,y+4,x-8,y-4,x-6,y-9,x-5,y-5,x-4,y-13,x-2,y-7,x,y-10,x+2,y-17,x+4,y-8,x+6,y-6,x+8,y-2,x+8,y+4,x+5,y+8,x,y+9,x-5,y+8]),'yel',0);
  var c=aH([x,y+2])[0];P.circ(c[0],c[1],5,'red',0);}
APen.prototype.clipTo=function(pts){if(this.dry)return;this.g.save();this.nobox++;this.path(pts,true);this.nobox--;this.g.clip();};
APen.prototype.unclip=function(){if(!this.dry)this.g.restore();};
APen.prototype.textSq=function(s,x,y,sz,col,al,bold,sx,maxW){var g=this.dry?this.g:(this.tg||this.g),q=this.p(x,y),u=this.u;if(this.dry)return;g.save();g.font=(bold?'bold ':'')+Math.max(6,Math.round(sz*u))+'px '+AFONT;g.fillStyle=this.c(col);g.textAlign=al||'left';g.textBaseline='alphabetic';
  var w=g.measureText(s).width*(sx||1);if(maxW&&w>maxW*u)sx=(sx||1)*maxW*u/w;g.translate(q[0],q[1]);g.scale(sx||1,1);g.fillText(s,0,0);g.restore();};

/* ---------- kits read from the design (packages, APS, weapon stations) ---------- */
function aKits(R,A){var Z=R.zones||{},has=function(z,name){return (Z[z]||[]).some(function(I){return I.k.some(function(k){return k.indexOf(name)>=0;});});},K={};
  if(A.kits!==0){K.eraH=has('hs','反應裝甲');K.eraT=has('tf','反應裝甲')||has('ts','反應裝甲');K.slatH=has('hs','柵欄')||has('rr','柵欄');K.slatT=K.slatH;
    K.addT=has('tf','額外複合');K.addH=has('hs','額外複合');K.aps=(R.aps||[]).length>0;K.ew=(R.ews||[]).some(function(e){var m=e.m||e;return m.esm||m.jam;});}
  K.rws=(R.secs||[]).some(function(s){return s.m.sl==='rws';});K.coax=(R.secs||[]).some(function(s){return /OScan|同軸/.test(s.m.n||'')||s.m.coax;});
  K.hsmk=!!A.acc.hsmk;K.drum=!!A.acc.drum;return K;}

/* ---------- land vehicle composition ---------- */
function aAnt(P,a){P.nobox++;if(a[1]>200){P.poly(aT(aR(a[0]-4,a[1],a[0]+4,a[2])),'d2');P.poly(aT(aR(a[0]-5,a[1]-7,a[0]+5,a[1])),'box');P.poly(aT(aR(a[0]-6,a[1]+21,a[0]+6,a[1]+25)),'d2');}
  else{P.ln(aT([a[0],a[1],a[0],a[2]-8]),'k',1);P.poly(aT(aR(a[0]-3,a[2]-9,a[0]+3,a[2])),'d2');}P.nobox--;}
function aLandVeh(P,d,R,A){var ch=R.ch||{},L=ch.L||7.7,k=L/7.714,K=aKits(R,A),hs=AHULL[A.hull]||AHULL.xt,G={nw:ch.nw||6,wd:ch.wd};hs.lay(G);
  P.push().sc(k/AS);hs.draw(P,G,A,K);P.anch.deck=P.w(0,AGY-G.deck)[1];P.anch.front=P.w(G.frontX-10,0)[0];P.anch.rear=P.w(G.rearX-10,0)[0];
  var ts=ATUR[A.tur],o=null;P.push().tr(G.ring[0]-10,AGY-G.ring[1]);P.anch.ring=P.w(0,0);
  if(ts&&A.tur!=='none'){o=ts.draw(P,{al:R.al},K,A,R);
    if(o){if(o.gun&&A.gun!=='none'&&R.gun){var gs=AGUN[A.gun]||AGUN.xt,cal=R.gun.cal||120,lc=R.gun.lc||50,len=cal/1000*lc*gs.vis*AS/k;
        P.push().tr(o.gun[0]-438,399-o.gun[1]).sc(1/k);gs.draw(P,len,cal,A.acc.coax&&K.coax?1:0);P.anch.gun=P.w(0,0);P.anch.muzzle=P.w(len,0);P.pop();}
      if(o.sight&&ASIGHT[A.sight]&&A.sight!=='none'){P.push().tr(o.sight[0]-438,399-o.sight[1]);ASIGHT[A.sight].draw(P);P.pop();}
      if(K.rws&&o.rws){P.push().tr(o.rws[0]-438,399-o.rws[1]);aRWS(P);P.pop();}
      if(K.aps)aApsT(P,o);if(K.ew&&o.ew)aMast(P,o.ew[0],o.ew[1],o.ew[2],1);(o.ant||[]).forEach(function(a){aAnt(P,a);});
      if(A.mark.roundel&&o.roundel)aRoundel(P,o.roundel[0],o.roundel[1]);}}
  else{var dk=399;if(K.rws){P.push().tr(0,0);aRWS(P);P.pop();}if(K.ew)aMast(P,380,250,dk,1);if(A.acc.ant)aAnt(P,[330,200,dk]);}
  P.pop();
  if(A.mark.plate&&G.plate)aPlate(P,G.plate[0],G.plate[1],A.mark.plate,A.mark.unit,G.unitRight);else if(A.mark.unit&&G.plate){var c2=aH([G.plate[0]+54,G.plate[1]+42])[0];P.textSq(A.mark.unit,c2[0],c2[1],17,'wht','center',1,1);}
  if(A.mark.emblem&&G.emb)aFlame(P,G.emb[0],G.emb[1]);
  P.pop();}

/* ---------- title block and the 祥雲 emblem ---------- */
var ACLOUD=[{c:[1086,44],s:25,f:'#d7000f',r:'#9a0216',sp:[1090,50]},{c:[1128,89],s:24,f:'#578abc',r:'#394f7c',sp:[1126,84]},{c:[1049,89],s:24,f:'#ea5414',r:'#f39800',sp:[1050,84]},{c:[1086,121],s:25,f:'#f8b62c',r:'#fcd26d',sp:[1082,122]}];
var ALOBE=[[0,0,1],[-0.78,0.22,0.66],[0.78,0.22,0.66],[-0.42,-0.55,0.62],[0.42,-0.55,0.62],[0,0.62,0.6]];
function aLogo(g,x0,y0,sc,cols){ACLOUD.forEach(function(cl){var cx=x0+(cl.c[0]-1010)*sc,cy=y0+(cl.c[1]-8)*sc,s=cl.s*sc;cols[cl.f]=1;cols[cl.r]=1;
    g.fillStyle=cl.r;ALOBE.forEach(function(b){g.beginPath();g.arc(cx+b[0]*s,cy+b[1]*s,b[2]*s+7*sc,0,2*Math.PI);g.fill();});
    g.fillStyle=cl.f;ALOBE.forEach(function(b){g.beginPath();g.arc(cx+b[0]*s,cy+b[1]*s,b[2]*s,0,2*Math.PI);g.fill();});
    var sx=x0+(cl.sp[0]-1010)*sc,sy=y0+(cl.sp[1]-8)*sc;g.strokeStyle=cl.r;g.lineWidth=6*sc;g.lineCap='round';g.beginPath();
    for(var i=0;i<=60;i++){var t=i/60,a=-Math.PI/2+t*Math.PI*3.1,r=(0.06+0.7*t)*s;if(i)g.lineTo(sx+Math.cos(a)*r,sy+Math.sin(a)*r);else g.moveTo(sx+Math.cos(a)*r,sy+Math.sin(a)*r);}g.stroke();g.lineCap='butt';});}
var ATSX=0.86;
function aTitleBox(g,o){g.font='bold 32px '+AFONT;var tw=o.title?g.measureText(o.title).width*ATSX:0;g.font='19px '+AFONT;var sw=0;(o.sub||[]).forEach(function(s){sw=Math.max(sw,g.measureText(s).width*ATSX);});
  return {tw:tw,sw:sw,sub:(o.sub||[]).length,w:Math.max(tw,sw+tw*0.28),h:(o.title?50:0)+(o.sub||[]).length*31};}

/* ---------- crisp pixel pass: every pixel that is not a palette colour takes the closest colour among its palette neighbours ---------- */
function aCrisp(g,w,h,cols){var im=g.getImageData(0,0,w,h),d=im.data,n=w*h,set={},pal=[];Object.keys(cols).forEach(function(c){if(c.charAt(0)!=='#'||c.length!==7)return;var v=aRgb(c);set[(v[0]<<16)|(v[1]<<8)|v[2]]=1;pal.push(v);});
  var ok=new Uint8Array(n),i;for(i=0;i<n;i++){var o=i*4;if(d[o+3]>250&&set[(d[o]<<16)|(d[o+1]<<8)|d[o+2]])ok[i]=1;}
  var out=new Uint8ClampedArray(d.length);out.set(d);var K=[0,0,0];
  /* an edge pixel is a blend of two colours: take the pair (its palette neighbours, plus black for outlines) that explains it best, then the dominant one */
  for(i=0;i<n;i++){if(ok[i])continue;var o2=i*4,x=i%w,y=(i-x)/w,dx,dy,cand=[K],seen={0:1};
    if(d[o2+3]<128){out[o2+3]=0;continue;}
    for(dy=-1;dy<=1;dy++)for(dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;var xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;var j=yy*w+xx;if(!ok[j])continue;var p=j*4,key=(d[p]<<16)|(d[p+1]<<8)|d[p+2];if(!seen[key]){seen[key]=1;cand.push([d[p],d[p+1],d[p+2]]);}}
    var r=d[o2],gg=d[o2+1],bb=d[o2+2],best=null,bd=1e12,a,b2,ci,cj;
    if(cand.length===1){pal.forEach(function(v){var e=(v[0]-r)*(v[0]-r)+(v[1]-gg)*(v[1]-gg)+(v[2]-bb)*(v[2]-bb);if(e<bd){bd=e;best=v;}});}
    else for(ci=0;ci<cand.length;ci++)for(cj=ci+1;cj<cand.length;cj++){a=cand[ci];b2=cand[cj];var ux=a[0]-b2[0],uy=a[1]-b2[1],uz=a[2]-b2[2],L2=ux*ux+uy*uy+uz*uz||1,
        t=((r-b2[0])*ux+(gg-b2[1])*uy+(bb-b2[2])*uz)/L2;t=t<0?0:t>1?1:t;var ex=r-(b2[0]+t*ux),ey=gg-(b2[1]+t*uy),ez=bb-(b2[2]+t*uz),e=ex*ex+ey*ey+ez*ez+(ci===0?40:0);
      if(e<bd){bd=e;best=t>=0.5?a:b2;}}
    if(best){out[o2]=best[0];out[o2+1]=best[1];out[o2+2]=best[2];out[o2+3]=255;}}
  im.data.set(out);g.putImageData(im,0,0);}
/* text layer: keep pixels with enough ink fully opaque, drop the rest (crisp, slightly bold lettering like the reference) */
function aInk(g,w,h){var im=g.getImageData(0,0,w,h),d=im.data;for(var i=3;i<d.length;i+=4)d[i]=d[i]>=80?255:0;g.putImageData(im,0,0);}
/* ---------- art selections ---------- */
var AL_DEF={
 xt03:{hull:'xt',run:'sp',tur:'xt',gun:'xt',sight:'xt',acc:{box:1,ant:1,smk:1,coax:1},paint:'od',mark:{plate:'樞A-0001772',unit:'第一裝甲旅',roundel:1,emblem:1,title:1,logo:'cloud'}},
 saa06:{hull:'xt',run:'sp',tur:'saa',gun:'none',sight:'none',acc:{hsmk:1,smk:1},paint:'od',mark:{plate:'',unit:'',roundel:0,emblem:0,title:0,logo:''}},
 mbt125:{hull:'old',run:'open',tur:'cast',gun:'fe',sight:'cup',acc:{drum:1,smk:1,ant:1},paint:'tan',mark:{title:1}},
 ifv:{hull:'ifv',run:'sp',tur:'ifv',gun:'ac',sight:'pano',acc:{smk:1,ant:1},paint:'od',mark:{roundel:1,title:1}},
 lt:{hull:'lt',run:'disc',tur:'box',gun:'fe',sight:'pano',acc:{smk:1,ant:1,box:1},paint:'od',mark:{roundel:1,title:1}},
 spg:{hull:'spg',run:'disc',tur:'spg',gun:'mb',sight:'cup',acc:{smk:1,ant:1},paint:'od',mark:{title:1}},
 w8:{hull:'wh',run:'tyre',tur:'rws',gun:'ac',sight:'none',acc:{ant:1,smk:1},paint:'od',mark:{title:1}},
 mrap:{hull:'mrap',run:'tyre',tur:'none',gun:'none',sight:'none',acc:{ant:1},paint:'tan',mark:{title:1}}};
function artDef(d,R){var ch=R.ch||{},b=AL_DEF[d.id];if(!b){var wh=ch.kind==='wh',ty=d.ty;b=wh?(ch.vhull?AL_DEF.mrap:AL_DEF.w8):ty==='spg'?AL_DEF.spg:ty==='ifv'||ty==='apc'?AL_DEF.ifv:ty==='lt'?AL_DEF.lt:ty==='spaa'?AL_DEF.saa06:AL_DEF.xt03;
    b=A.cloneObj(b);b.mark={roundel:1,title:1};}
  return b;}
function artNum(n){var z='〇一二三四五六七八九十';return n<=10?z.charAt(n):String(n);}
function artTitle(d){var n=d.n||'',c=d.code&&d.code!=='—'&&n.indexOf(d.code)!==0?d.code:'';if(c&&n.charAt(0)!=='「')c+=' ';return (d.mk?d.mk+'－':'')+c+n;}
function artSub(d,R){if(d.protos&&d.protos.length)return ['其原型共有'+artNum(d.protos.length)+'版：'].concat(d.protos);var o=[];
  if(d.br==='l'){o.push('戰鬥全重 '+(R.mass/1000).toFixed(1)+' 噸｜'+Math.round((R.hp||0))+' 匹馬力｜乘員 '+(R.crew||'—')+' 人');if(R.gun)o.push('主砲：'+R.gun.n);}
  else if(d.br==='a'){o.push('最大起飛重量 '+((R.MTOW||R.W0||0)/1000).toFixed(1)+' 噸｜最大速度 '+(R.mClean?R.mClean.toFixed(2)+' 馬赫':'—'));}
  else{o.push('滿載排水量 '+Math.round(R.full||0).toLocaleString('en-US')+' 噸｜'+(R.vCalm?R.vCalm.toFixed(0)+' 節':'')+(R.crew?'｜乘員 '+R.crew+' 人':''));}
  return o;}
function artSel(d,R){var def=d.br==='l'?artDef(d,R):artDefX(d,R),a=d.art||{},o={};
  Object.keys(def).forEach(function(k){if(k!=='acc'&&k!=='mark')o[k]=a[k]!==undefined?a[k]:def[k];});
  o.acc={};Object.keys(def.acc||{}).forEach(function(k){o.acc[k]=def.acc[k];});Object.keys(a.acc||{}).forEach(function(k){o.acc[k]=a.acc[k];});
  o.mark={plate:'',unit:'',roundel:0,emblem:0,title:0,logo:''};Object.keys(def.mark||{}).forEach(function(k){o.mark[k]=def.mark[k];});Object.keys(a.mark||{}).forEach(function(k){o.mark[k]=a.mark[k];});
  o.kits=a.kits===0?0:1;o.bg=a.bg||'sky';o.title=a.title||artTitle(d);o.sub=a.sub!==undefined?a.sub:artSub(d,R);o.img=a.img||'';
  var ch=R.ch||{};if(d.br==='l'){var wh=ch.kind==='wh',hk=(AHULL[o.hull]||{}).kind;if(hk&&(hk==='wh')!==wh){o.hull=wh?(ch.vhull?'mrap':'wh'):'xt';}if(wh)o.run='tyre';else if(o.run==='tyre')o.run='sp';}
  return o;}
/* ---------- render: dry run for the extent, then paint, title, emblem and the crisp pass ---------- */
function artVeh(P,d,R,A){if(d.br==='l')aLandVeh(P,d,R,A);else if(d.br==='a'&&typeof aAirVeh==='function')aAirVeh(P,d,R,A);else if(typeof aSeaVeh==='function')aSeaVeh(P,d,R,A);}
function artScale(d,R){if(d.br==='a'){var af=R.af||{};return Math.max(18,Math.min(AS,1150/Math.max(af.l||15,af.D||0)));}if(d.br==='s')return Math.max(2,Math.min(AS,1650/((R.hull||{}).Loa||150)));return AS;}
function artBg(g,W,Hh,gy,br,A,cols){var sea=br==='s';if(A.bg!=='none'){g.fillStyle=A.bg==='white'?'#ffffff':AC.bg;g.fillRect(0,0,W,Hh);cols[g.fillStyle]=1;}
  if(sea){if(A.bg!=='none'){g.fillStyle='#8fcbe6';g.fillRect(0,Math.round(gy),W,Hh);cols['#8fcbe6']=1;}g.fillStyle='#2f6f99';g.fillRect(0,Math.round(gy),W,Math.max(1,Math.round(2*(W/1200))));cols['#2f6f99']=1;}
  else{g.fillStyle=AC.gnd;g.fillRect(0,Math.round(gy+0.5),W,Math.max(1,Math.round(3*Math.min(1,W/900))));cols[AC.gnd]=1;if(A.bg!=='none'){g.fillStyle=AC.low;g.fillRect(0,Math.round(gy+3.5),W,Hh);cols[AC.low]=1;}}}
function artRender(d,R,opt){opt=opt||{};var A=opt.sel||artSel(d,R),tone=aTones(A.paint),cols={},seed=aSeed(d.id||'x'),br=d.br,S=artScale(d,R),land=br==='l';
  var D=new APen(null,{S:S,ox:10,gy:land?AGY:0,tone:tone,cols:cols});artVeh(D,d,R,A);var bb=D.bb;
  var camo=aCamo(A.paint,seed,[-2,Math.max(16,(bb[2]-10)/S+2),Math.max(6,(land?AGY-bb[1]:-bb[1])/S+1)]);
  var tb=null,logo=opt.bare?'':A.mark.logo,meas=document.createElement('canvas').getContext('2d');if(A.mark.title&&!opt.bare)tb=aTitleBox(meas,{title:A.title,sub:A.sub});
  var ox=10+Math.max(0,6-bb[0]),W=Math.max(opt.minW||AMINW,Math.ceil(bb[2]+(ox-10)+10)),Hh,gy,dy=0;
  if(tb){var need=tb.w+40+(logo?200:0);if(need>W)W=Math.ceil(need);}
  var xr=W-(logo?205:16),tx0=xr-(tb?tb.w:0);
  if(land){dy=Math.max(0,10-bb[1]);var clash=function(x0,x1,yb){var m=0;Object.keys(D.top).forEach(function(kk){var X=kk*8+(ox-10);if(X+8>=x0&&X<=x1)m=Math.max(m,yb+8-(D.top[kk]+dy));});return m;};
    if(tb)dy+=Math.max(0,clash(tx0,tx0+tb.tw,110),(tb.sub?clash(tx0+tb.tw*0.28,xr,62+tb.h):0));if(logo)dy+=Math.max(0,clash(W-196,W-8,166));Hh=AHT+dy;gy=AGY+dy;}
  else{var topM=Math.max(tb?62+tb.h+14:24,logo?176:0);gy=topM-bb[1];Hh=Math.ceil(gy+Math.max(0,bb[3])+(br==='s'?28:40));}
  var cv=document.createElement('canvas');cv.width=W;cv.height=Hh;var g=cv.getContext('2d');artBg(g,W,Hh,gy,br,A,cols);
  var tl=document.createElement('canvas');tl.width=W;tl.height=Hh;var tg=tl.getContext('2d');
  var P=new APen(g,{S:S,ox:ox,gy:gy,tone:tone,cols:cols,camo:camo,tg:tg});artVeh(P,d,R,A);
  if(tb){tg.fillStyle='#000000';tg.textBaseline='alphabetic';tg.textAlign='left';var tx=tx0,put=function(s,x,y,f){tg.save();tg.font=f;tg.translate(x,y);tg.scale(ATSX,1);tg.fillText(s,0,0);tg.restore();};
    put(A.title,tx,104,'bold 32px '+AFONT);(A.sub||[]).forEach(function(s,i){put(s,tx+tb.tw*0.28,140+i*31,'19px '+AFONT);});}
  if(logo==='cloud')aLogo(g,W-192,8,1,cols);
  if(opt.crisp!==false){aCrisp(g,W,Hh,cols);aInk(tg,W,Hh);}
  g.drawImage(tl,0,0);
  if(logo==='img'&&A.img&&opt.img)g.drawImage(opt.img,W-192,8,180,155);
  return cv;}
/* thumbnail: the same drawing at a small scale, cropped to a view box in vehicle metres */
function artThumb(cv,d,R,A,view,tw,th){var r=window.devicePixelRatio||1;cv.width=tw*r;cv.height=th*r;cv.style.width=tw+'px';cv.style.height=th+'px';var g=cv.getContext('2d'),B=JSON.parse(JSON.stringify(A)),tone=aTones(B.paint),cols={};B.mark.title=0;B.mark.logo='';
  var vw=view[2]-view[0],vh=view[3]-view[1],S=Math.min(tw*r/vw,th*r/vh),ox=(tw*r-vw*S)/2-view[0]*S,gy=(th*r-vh*S)/2+view[3]*S;B.bg=B.bg==='none'?'sky':B.bg;
  artBg(g,cv.width,cv.height,gy,d.br,B,cols);var P=new APen(g,{S:S,ox:ox,gy:gy,tone:tone,cols:cols,camo:aCamo(B.paint,aSeed(d.id||'x'),[-2,40,8])});artVeh(P,d,R,B);}
/* fit the native image into a display canvas */
function artShow(cv,img){var w=Math.max(280,cv.clientWidth||cv.parentNode.clientWidth||600),r=window.devicePixelRatio||1,h=Math.round(w*img.height/img.width);
  cv.width=Math.round(w*r);cv.height=Math.round(h*r);cv.style.height=h+'px';var g=cv.getContext('2d');g.imageSmoothingEnabled=cv.width<img.width;g.drawImage(img,0,0,cv.width,cv.height);}

/* ---------- aircraft (metres; x from the tail end, y up from the ground, gear down) ---------- */
var AAIR={
 nose:{ogive:{n:'尖錐雷達罩',d:'細長尖錐形機鼻'},blunt:{n:'大型雷達罩',d:'較粗的機鼻，可容納大型主動陣列雷達'},probe:{n:'雷達罩＋加油管',d:'尖錐機鼻，座艙前方固定式空中加油探管'}},
 canopy:{bubble:{n:'氣泡式座艙罩',d:'一體成形的氣泡座艙罩'},framed:{n:'有框座艙罩',d:'擋風玻璃與座艙罩之間有框架'},tandem:{n:'雙座串列座艙',d:'前後雙座，加長的座艙罩'}},
 intake:{side:{n:'兩側進氣道',d:'座艙後方兩側的矩形進氣道'},chin:{n:'機腹進氣道',d:'座艙下方的機腹進氣口'},dsi:{n:'無附面層隔道進氣道',d:'匿蹤鼓包式進氣道'}},
 fin:{twin:{n:'雙垂直尾翼',d:'外傾雙垂直尾翼'},single:{n:'單垂直尾翼',d:'單一大型垂直尾翼'}},
 gear:{down:{n:'起落架放下',d:'停放或起降狀態'},up:{n:'起落架收起',d:'飛行狀態，機下加一條影子'}}};
function aF(L,yc,pts){return pts.map(function(p){return [p[0]*L,yc+p[1]*L];});}
function aStore(P,x,y,mu,L){var t=mu.t,kg=mu.kg||200,len=Math.max(1.6,Math.min(6,0.55*Math.pow(kg,0.36))),r=Math.max(0.09,Math.min(0.42,0.028*Math.pow(kg,0.36)));
  if(t==='tank'){r=Math.min(0.5,0.035*Math.pow(kg,0.38));len=Math.min(6,0.3*Math.pow(kg,0.42));P.poly([[x-len/2,y],[x-len*0.3,y+r],[x+len*0.25,y+r],[x+len/2,y],[x+len*0.25,y-r],[x-len*0.3,y-r]],'l1');return;}
  var col=t==='bomb'||t==='gbomb'||t==='cbu'?'d2':t==='pod'?'d1':t==='torp'?'gryL':'wht';
  P.poly([[x-len/2,y+r],[x+len*0.38,y+r],[x+len/2,y],[x+len*0.38,y-r],[x-len/2,y-r]],col);
  P.poly([[x-len/2,y+r],[x-len/2-0.25,y+r*2.4],[x-len/2+0.25,y+r]],col);P.poly([[x-len/2,y-r],[x-len/2-0.25,y-r*2.4],[x-len/2+0.25,y-r]],col);
  if(col==='wht'){P.ln([[x+len*0.2,y+r],[x+len*0.2,y-r]],'red',1);P.ln([[x-len*0.1,y+r],[x-len*0.1,y-r]],'yel',1);}}
function aAirJet(P,d,R,A){var af=R.af,L=af.l||15;if(L>28||(af.mlim&&af.mlim<1))return aAirProp(P,d,R,A,L>28?'heavy':'pods');
  var clr=L*0.068,yc=(A.gear==='up'?L*0.15:clr)+L*0.068,F=function(p){return aF(L,yc,p);},nEng=Math.max(1,(R.engs||[]).reduce(function(s,e){return s+(e.n||1);},0)),bl=A.nose==='blunt'?1.25:1;
  var up=[[-0.005,0.03],[0.06,0.038],[0.2,0.05],[0.35,0.056],[0.5,0.06],[0.62,0.064],[0.7,0.058]],
      lo=[[-0.005,-0.03],[0.05,-0.036],[0.18,-0.05],[0.35,-0.064],[0.55,-0.068],[0.66,-0.066],[0.74,-0.058],[0.82,-0.046],[0.88,-0.036*bl]],
      nz=[[0.86,0.04],[0.9,0.033*bl],[0.94,0.022*bl],[0.97,0.013*bl],[0.993,0.004],[1,-0.002],[0.993,-0.009],[0.97,-0.017*bl],[0.94,-0.025*bl]];
  var fin=function(dx,tone){P.poly(F([[0.35+dx,0.056],[0.22+dx,0.165],[0.15+dx,0.165],[0.13+dx,0.052]]),tone);P.ln(F([[0.17+dx,0.155],[0.145+dx,0.06]]),'k',1);P.ln(F([[0.32+dx,0.075],[0.155+dx,0.075]]),'sm',1,[3,3]);};
  if(A.fin!=='single')fin(0.04,'d1');
  if(A.gear!=='up')P.poly(F([[0.47,-0.06],[0.48,-0.1],[0.49,-0.06]]),'d3');
  P.poly(F(up.concat(nz).concat(lo.slice().reverse())),'b');
  P.poly(F([[0.86,0.04],[0.8,0.03],[0.7,0.014],[0.6,0.006],[0.6,-0.004],[0.72,0.004],[0.84,0.02]]),'l1');P.ln(F([[0.85,0.022],[0.72,0.006],[0.6,-0.002]]),'k',1);
  P.ln(F([[0.04,0.0],[0.58,0.0]]),'sm',1,[4,3]);[0.28,0.45,0.58,0.8].forEach(function(s){P.ln(F([[s,0.054],[s,-0.062]]),'sm',1,[3,3]);});P.ln(F([[0.88,0.034*bl],[0.88,-0.034*bl]]),'k',1);
  /* wing (edge on) and tailplane */
  P.poly(F([[0.6,-0.004],[0.33,0.0],[0.31,-0.012],[0.6,-0.018]]),'d1');P.poly(F([[0.17,-0.006],[0.0,-0.002],[-0.03,-0.012],[0.17,-0.017]]),'d1');
  /* intake */
  if(A.intake==='chin'){P.poly(F([[0.8,-0.046],[0.64,-0.066],[0.64,-0.088],[0.76,-0.082]]),'b');P.poly(F([[0.8,-0.048],[0.77,-0.082],[0.755,-0.078],[0.785,-0.048]]),'k2');}
  else if(A.intake==='dsi'){P.poly(F([[0.76,0.0],[0.66,0.008],[0.62,-0.02],[0.66,-0.05],[0.76,-0.046]]),'l2');P.poly(F([[0.765,0.0],[0.752,-0.048],[0.74,-0.044],[0.752,-0.002]]),'k2');}
  else{P.poly(F([[0.74,-0.012],[0.6,-0.012],[0.58,-0.062],[0.72,-0.06]]),'d1');P.poly(F([[0.74,-0.014],[0.712,-0.058],[0.698,-0.058],[0.728,-0.014]]),'k2');P.ln(F([[0.748,-0.01],[0.748,-0.058]]),'l3',1);}
  /* canopy */
  var cp=A.canopy==='tandem'?[[0.86,0.04],[0.83,0.078],[0.78,0.094],[0.71,0.096],[0.64,0.084],[0.6,0.062]]:[[0.86,0.04],[0.83,0.08],[0.79,0.096],[0.74,0.092],[0.69,0.072],[0.66,0.06]];
  P.poly(F(cp),'gl');P.ln(F(A.canopy==='tandem'?[[0.84,0.058],[0.8,0.084],[0.72,0.088]]:[[0.845,0.058],[0.8,0.086],[0.75,0.085]]),'glL',2);
  if(A.canopy!=='bubble'){P.ln(F([[0.83,0.08],[0.845,0.042]]),'k',2);if(A.canopy==='tandem')P.ln(F([[0.725,0.096],[0.73,0.06]]),'k',2);}
  if(A.nose==='probe')P.poly(F([[0.85,0.05],[1.025,0.034],[1.025,0.029],[0.85,0.045]]),'gryD');
  fin(0,'b');
  for(var e=0;e<Math.min(2,nEng);e++){var dy=e?-0.014:0;P.poly(F([[0.025,0.024+dy],[-0.035,0.02+dy],[-0.035,-0.026+dy],[0.025,-0.03+dy]]),e?'k2':'gryD');[0.0,-0.018].forEach(function(x){P.ln(F([[x,0.021+dy],[x,-0.027+dy]]),'k',1);});}
  /* near-side stores: wing tip, wing pylons, fuselage */
  var st=(R.stores||[]).filter(function(s){return s.s!=='bay'&&s.s!=='hbay';}),nS=(R.stn||[]).length||st.length,half=(nS-1)/2,wi=0;
  st.filter(function(s){return s.i<=half;}).sort(function(a,b){return a.i-b.i;}).forEach(function(s){var t=s.s,sx,sy;
    if(t==='tip'){sx=0.355;sy=-0.006;}else if(t==='ctr'||t==='fus'||s.i===half){sx=0.63;sy=-0.1;}else{sx=0.39+0.055*wi;sy=-0.06-0.012*(wi%2);wi++;}
    var X=sx*L,Y=yc+sy*L;if(t!=='tip')P.poly([[X-0.35,yc+(t==='ctr'||t==='fus'?-0.066:-0.016)*L],[X+0.35,yc+(t==='ctr'||t==='fus'?-0.066:-0.016)*L],[X+0.2,Y+0.12],[X-0.25,Y+0.12]],'d1');aStore(P,X,Y,s.mu,L);});
  if(A.gear!=='up'){var g0=function(s,r,yb){var x=s*L;P.poly([[x-0.06,yc+yb*L],[x+0.06,yc+yb*L],[x+0.06,r],[x-0.06,r]],'gryD');P.poly([[x+0.06,yc+yb*L-0.05],[x+0.35,yc+yb*L-0.05],[x+0.3,r+0.2],[x+0.06,r+0.25]],'d2');P.circ(x,r,r,'tyre','k');P.circ(x,r,r*0.45,'gryL','k');};
    g0(0.84,0.0125*L,-0.042);g0(0.47,0.017*L,-0.066);if(af.car)P.ln([[0.1*L,yc-0.048*L],[0.02*L,yc-0.085*L]],'k2',2);}
  else P.poly([[0.1*L,-0.02],[0.95*L,-0.02],[0.95*L,0.0],[0.1*L,0.0]],'sm',0);
  if(A.mark.roundel!==0){var rc=F([[0.53,-0.028]])[0];P.circ(rc[0],rc[1],0.03*L,'wht',0);P.circ(rc[0],rc[1],0.022*L,'b',0);P.circ(rc[0],rc[1],0.014*L,'wht',0);}
  if(A.mark.plate){var pc=F([[0.935,-0.006]])[0];P.textSq(A.mark.plate,pc[0],pc[1],Math.max(12,0.026*L*AS),'k','center',1,0.85);}
  if(d.code&&d.code!=='—'){var tc=F([[0.22,0.11]])[0];P.textSq(d.code,tc[0],tc[1],Math.max(10,0.018*L*AS),'k','center',1,0.8);}
  if(A.mark.unit){var uc=F([[0.3,-0.035]])[0];P.textSq(A.mark.unit,uc[0],uc[1],Math.max(10,0.017*L*AS),'k','center',0,1);}
  P.anch.v_nose=[0.62*L,yc-0.11*L,1.04*L,yc+0.12*L];P.anch.v_tail=[-0.06*L,yc-0.09*L,0.45*L,yc+0.21*L];}
function aAirProp(P,d,R,A,mode){var af=R.af,L=af.l||18,heavy=mode==='heavy',pods=mode==='pods'||heavy,yc=L*(heavy?0.05:0.085)+L*0.06,F=function(p){return aF(L,yc,p);},aew=R.radar&&R.radar.aew,hi=!heavy&&A.wing!=='low';
  var body=heavy?[[0,0.03],[0.1,0.045],[0.3,0.05],[0.8,0.05],[0.9,0.045],[0.96,0.03],[1,0.0],[0.98,-0.025],[0.9,-0.045],[0.3,-0.05],[0.12,-0.03],[0.04,0.0]]:[[0,0.035],[0.1,0.05],[0.3,0.062],[0.82,0.062],[0.9,0.055],[0.96,0.035],[1,0.0],[0.98,-0.03],[0.9,-0.055],[0.3,-0.06],[0.15,-0.04],[0.05,0.0]];
  var finH=heavy?0.2:0.24;P.poly(F([[0.17,0.05],[0.05,finH],[0.005,finH],[0.0,0.03]]),'b');P.ln(F([[0.035,finH-0.02],[0.008,0.045]]),'k',1);
  P.poly(F(body),'b');P.ln(F([[0.08,0.0],[0.9,0.0]]),'sm',1,[4,3]);[0.25,0.45,0.65].forEach(function(s){P.ln(F([[s,0.05],[s,-0.05]]),'sm',1,[3,3]);});
  P.poly(F([[0.97,0.03],[0.92,0.046],[0.88,0.046],[0.9,0.022]]),'gl');var nW=heavy?0:6;if(heavy)P.stroke(F([[0.62,-0.045],[0.4,-0.045],[0.4,-0.025],[0.62,-0.025]]),true,'k',1);for(var i=0;i<nW;i++){var s0=0.78-i*(heavy?0.04:0.07);P.poly(F([[s0,0.018],[s0-0.016,0.018],[s0-0.016,0.03],[s0,0.03]]),'gl');}
  var wy=hi?0.058:-0.025;P.poly(F([[0.62,wy+0.012],[0.4,wy+0.008],[0.4,wy-0.006],[0.62,wy-0.008]]),'d1');
  (heavy?[0.6,0.48]:[0.6]).forEach(function(s,i){var y0=hi?wy-0.022:wy-0.035;if(pods){P.poly(F([[s+0.06,y0+0.016],[s-0.12,y0+0.016],[s-0.14,y0],[s-0.12,y0-0.016],[s+0.06,y0-0.016]]),i?'d1':'b');P.poly(F([[s+0.06,y0+0.014],[s+0.05,y0-0.014],[s+0.045,y0-0.014],[s+0.055,y0+0.014]]),'k2');P.poly(F([[s-0.04,wy-0.006],[s-0.02,y0+0.016],[s-0.06,y0+0.016]]),'d1');}
    else{P.poly(F([[s+0.02,y0+0.018],[s-0.17,y0+0.02],[s-0.17,y0-0.012],[s+0.02,y0-0.016]]),i?'d1':'b');var pc=F([[s+0.035,y0+0.002]])[0];P.circ(pc[0],pc[1],0.012*L,'gryD','k');P.ln([[pc[0],pc[1]-0.085*L],[pc[0],pc[1]+0.085*L]],'k2',3);}});
  P.poly(F([[0.17,-0.01+(hi?0.02:0)],[0.0,0.0+(hi?0.02:0)],[-0.02,-0.01+(hi?0.02:0)],[0.17,-0.018+(hi?0.02:0)]]),'d1');
  if(aew){var cx=0.42*L,cy=yc+0.17*L;P.poly([[cx-0.03*L,yc+0.06*L],[cx-0.015*L,cy-0.02*L],[cx+0.015*L,cy-0.02*L],[cx+0.03*L,yc+0.06*L]],'d1');P.poly([[cx-0.2*L,cy],[cx-0.17*L,cy+0.03*L],[cx+0.17*L,cy+0.03*L],[cx+0.2*L,cy],[cx+0.17*L,cy-0.025*L],[cx-0.17*L,cy-0.025*L]],'wht');P.ln([[cx-0.19*L,cy],[cx+0.19*L,cy]],'k2',1);}
  if(A.gear!=='up'){(heavy?[[0.88,0.009],[0.5,0.014],[0.44,0.014]]:[[0.86,0.012],[0.45,0.018]]).forEach(function(g){var x=g[0]*L,r=g[1]*L;P.poly([[x-0.06,yc-0.05*L],[x+0.06,yc-0.05*L],[x+0.06,r],[x-0.06,r]],'gryD');P.circ(x,r,r,'tyre','k');P.circ(x,r,r*0.45,'gryL','k');});}
  else P.poly([[0.1*L,-0.02],[0.95*L,-0.02],[0.95*L,0.0],[0.1*L,0.0]],'sm',0);
  if(A.mark.roundel!==0){var rc=F([[0.28,0.0]])[0];P.circ(rc[0],rc[1],0.028*L,'wht',0);P.circ(rc[0],rc[1],0.02*L,'b',0);P.circ(rc[0],rc[1],0.012*L,'wht',0);}
  if(d.code&&d.code!=='—'){var tc=F([[0.07,finH*0.6]])[0];P.textSq(d.code,tc[0],tc[1],Math.max(10,0.018*L*AS),'k','center',1,0.8);}
  if(A.mark.plate){var pc2=F([[0.84,-0.03]])[0];P.textSq(A.mark.plate,pc2[0],pc2[1],Math.max(12,0.026*L*AS),'k','center',1,0.85);}
  P.anch.v_nose=[0.6*L,yc-0.1*L,1.04*L,yc+0.12*L];}
function aAirRot(P,d,R,A){var af=R.af,L=af.l||18,D=af.D||L*0.85,yc=L*0.1,F=function(p){return aF(L,yc,p);},skid=A.gear==='skid'||(!af.car&&A.gear!=='wheel');
  var cab=[[0.42,0.07],[0.62,0.1],[0.85,0.1],[0.95,0.06],[1,0.0],[0.97,-0.05],[0.85,-0.07],[0.5,-0.07],[0.42,-0.02],[0.05,0.02],[0.0,0.05],[0.0,0.08],[0.08,0.06],[0.42,0.07]];
  P.poly(F([[0.06,0.06],[0.0,0.2],[-0.03,0.2],[0.0,0.05]]),'b');var tr=F([[0.02,0.12]])[0];P.circ(tr[0],tr[1],0.065*L,null,'k2',1);P.ln([[tr[0],tr[1]-0.065*L],[tr[0],tr[1]+0.065*L]],'k2',2);
  P.poly(F(cab),'b');P.poly(F([[0.55,0.1],[0.6,0.14],[0.78,0.14],[0.82,0.1]]),'d1');P.ln(F([[0.6,0.12],[0.78,0.12]]),'l3',1);
  P.poly(F([[0.97,0.05],[0.9,0.09],[0.86,0.09],[0.86,0.03],[0.99,0.0]]),'gl');P.ln(F([[0.86,0.09],[0.86,-0.04]]),'k',1);
  [[0.7,0.0],[0.63,0.0]].forEach(function(w){P.poly(F([[w[0],0.06],[w[0]-0.05,0.06],[w[0]-0.05,0.02],[w[0],0.02]]),'gl');});P.ln(F([[0.79,0.07],[0.79,-0.06],[0.56,-0.06],[0.56,0.07]]),'k',1);
  P.ln(F([[0.05,0.03],[0.85,0.03]]),'sm',1,[4,3]);
  var mx=0.7*L,my=yc+0.17*L;P.poly([[mx-0.12,yc+0.14*L],[mx+0.12,yc+0.14*L],[mx+0.12,my],[mx-0.12,my]],'gryD');P.poly([[mx-D/2,my+0.08],[mx+D/2,my+0.08],[mx+D/2,my-0.04],[mx-D/2,my-0.04]],'k2');P.circ(mx,my+0.02,0.25,'gryD','k');
  (R.stores||[]).forEach(function(s,i){var sx=(0.62-0.06*i)*L,sy=yc-0.02*L;P.poly([[sx-0.3,sy+0.03*L],[sx+0.3,sy+0.03*L],[sx+0.3,sy+0.05*L],[sx-0.3,sy+0.05*L]],'d1');aStore(P,sx,sy,s.mu,L);});
  if(skid){P.poly(F([[0.45,-0.07],[0.43,-0.09],[0.44,-0.09],[0.46,-0.07]]),'gryD');P.poly(F([[0.82,-0.07],[0.8,-0.09],[0.81,-0.09],[0.83,-0.07]]),'gryD');P.poly(F([[0.38,-0.088],[0.9,-0.088],[0.92,-0.08],[0.93,-0.09],[0.9,-0.096],[0.38,-0.096]]),'gryD');}
  else{[[0.9,0.022],[0.5,0.028]].forEach(function(g){var x=g[0]*L,r=g[1]*L;P.poly([[x-0.06,yc-0.065*L],[x+0.06,yc-0.065*L],[x+0.06,r],[x-0.06,r]],'gryD');P.circ(x,r,r,'tyre','k');P.circ(x,r,r*0.45,'gryL','k');});}
  if(A.mark.roundel!==0){var rc=F([[0.3,0.04]])[0];P.circ(rc[0],rc[1],0.025*L,'wht',0);P.circ(rc[0],rc[1],0.018*L,'b',0);P.circ(rc[0],rc[1],0.011*L,'wht',0);}
  if(A.mark.plate){var pc=F([[0.48,0.0]])[0];P.textSq(A.mark.plate,pc[0],pc[1],Math.max(12,0.028*L*AS*0.9),'k','center',1,0.9);}
  P.anch.v_nose=[0.45*L,yc-0.12*L,1.05*L,yc+0.18*L];}
function aAirVeh(P,d,R,A){var k=(R.af||{}).kind;if(k==='rot')aAirRot(P,d,R,A);else if(k==='prop')aAirProp(P,d,R,A);else aAirJet(P,d,R,A);}

/* ---------- ships (metres; x from the stern, y up from the waterline) ---------- */
var ASEA={
 bow:{clipper:{n:'飛剪型艦艏',d:'外飄的傾斜艦艏'},axe:{n:'垂直斧型艦艏',d:'接近垂直的艦艏'},tumble:{n:'穿浪內傾艦艏',d:'向前伸出的穿浪艦艏，乾舷內傾'}},
 sup:{stealth:{n:'匿蹤整合上層結構',d:'多面體上層結構，平面陣列雷達嵌在艦橋四面'},classic:{n:'傳統階梯式上層結構',d:'分層艦橋與窗列'}},
 mast:{integ:{n:'整合式桅杆',d:'封閉的錐形桅杆'},lattice:{n:'桁架桅杆',d:'桁架式桅杆與旋轉雷達'}},
 funnel:{stealth:{n:'匿蹤煙囪',d:'斜面封閉式煙囪'},round:{n:'傳統煙囪',d:'圓弧頂煙囪'},none:{n:'無煙囪',d:'核動力或柴電潛艦'}}};
function aSeaVeh(P,d,R,A){var h=R.hull||{},L=h.Loa||150,T=R.Tfull||h.T||6,Dp=h.D||T*2,f=Dp-T,em=R.em?R.em.list:[],has=function(sl){return em.filter(function(e){return e.m.sl===sl;});},cnt=function(sl){return has(sl).reduce(function(s,e){return s+e.n;},0);};
  if(h.sub){var r=(h.B||8)/2,cy=-r*0.85;P.poly([].concat([[0,cy]],[[0.04*L,cy+r*0.7],[0.2*L,cy+r],[0.85*L,cy+r],[0.95*L,cy+r*0.8],[L,cy],[0.95*L,cy-r*0.8],[0.85*L,cy-r],[0.2*L,cy-r],[0.04*L,cy-r*0.7]]),'b');
    P.poly([[0.58*L,cy+r],[0.6*L,cy+r+4.2],[0.7*L,cy+r+4.2],[0.72*L,cy+r]],'b');P.poly([[0.62*L,cy+r+2.6],[0.66*L,cy+r+2.6],[0.66*L,cy+r+2.2],[0.62*L,cy+r+2.2]],'d2');
    P.poly([[0,cy+r*0.9],[0.03*L,cy],[0,cy-r*0.9],[-0.012*L,cy]],'d2');P.ln([[0.06*L,cy],[0.92*L,cy]],'sm',1,[5,4]);
    if(A.mark.plate)P.textSq(A.mark.plate,0.65*L,cy+r+1.4,Math.max(14/P.u,2.2*AS),'wht','center',1,1);return;}
  var bf=f*1.35,deck=function(x){return x<0.6*L?f:f+(bf-f)*Math.pow((x-0.6*L)/(0.4*L),2);};
  var stem=A.bow==='axe'?[[L,bf],[L,-T*0.85],[0.95*L,-T]]:A.bow==='tumble'?[[0.965*L,bf],[L,-T*0.25],[0.97*L,-T*0.9],[0.93*L,-T]]:[[L,bf],[0.975*L,f*0.4],[0.96*L,-T*0.5],[0.92*L,-T]];
  var top=[];for(var i=0;i<=20;i++){var x=i/20*(A.bow==='tumble'?0.965:1)*L;top.push([x,deck(x)]);}
  var hull=top.concat(stem.slice(1)).concat([[0.08*L,-T],[0.02*L,-T*0.45],[0,0.25*f]]);
  /* boot topping and anti-fouling below the waterline, then the hull side */
  P.clipTo(hull);P.poly([[-5,0],[L+5,0],[L+5,-T-3],[-5,-T-3]],'#7c3b31',0);P.poly([[-5,0.5],[L+5,0.5],[L+5,-0.4],[-5,-0.4]],'k2',0);P.unclip();
  P.clipTo(hull);P.poly([[-5,0.5],[L+5,0.5],[L+5,bf+5],[-5,bf+5]],'b',0);P.unclip();P.stroke(hull,true,'k',1);
  P.poly([[0.03*L,-T*0.6],[0.06*L,-T*0.6],[0.06*L,-T*0.95],[0.03*L,-T*0.95]],'#b08d57');P.poly([[0.0,-T*0.3],[0.02*L,-T*0.3],[0.02*L,-T*0.9],[0.0,-T*0.9]],'d2');
  P.ln([[0.02*L,f-0.8],[0.9*L,deck(0.9*L)-0.8]],'sm',1,[5,4]);
  if(h.deck){aCarrier(P,d,R,A,L,f,bf,T);aSeaMarks(P,d,A,L,f,bf);return;}
  /* superstructure */
  var hs=Math.max(2.2,Math.min(f*0.9,L*0.045)),sup=A.sup||'stealth',fx0=0.47*L,fx1=0.64*L,ax0=0.14*L,ax1=0.36*L;
  if(sup==='classic'){P.poly([[fx0,f],[fx1,f],[fx1,f+hs*0.55],[fx1-0.02*L,f+hs*0.55],[fx1-0.02*L,f+hs*1.1],[fx0+0.04*L,f+hs*1.1],[fx0+0.04*L,f+hs*0.55],[fx0,f+hs*0.55]],'b');
    for(var w=fx0+0.05*L;w<fx1-0.03*L;w+=0.012*L)P.rect(w,f+hs*0.85,w+0.006*L,f+hs*0.95,'k2',0);P.poly([[ax0,f],[ax1,f],[ax1,f+hs*0.75],[ax0,f+hs*0.75]],'b');P.ln([[ax0+0.01*L,f+hs*0.4],[ax1-0.01*L,f+hs*0.4]],'sm',1,[4,3]);}
  else{P.poly([[fx0,f],[fx1+0.015*L,f],[fx1-0.01*L,f+hs*1.15],[fx0+0.03*L,f+hs*1.15],[fx0,f+hs*0.6]],'b');P.poly([[fx1-0.045*L,f+hs*0.35],[fx1-0.012*L,f+hs*0.35],[fx1-0.02*L,f+hs*1.0],[fx1-0.045*L,f+hs*1.0]],'d2');
    P.rect(fx1-0.04*L,f+hs*0.42,fx1-0.026*L,f+hs*0.92,'k2',0);for(var w2=fx0+0.06*L;w2<fx1-0.06*L;w2+=0.01*L)P.rect(w2,f+hs*1.0,w2+0.005*L,f+hs*1.07,'gl',0);
    P.poly([[ax0,f],[ax1,f],[ax1-0.01*L,f+hs*0.8],[ax0+0.01*L,f+hs*0.8]],'b');P.ln([[ax0+0.015*L,f+hs*0.4],[ax1-0.015*L,f+hs*0.4]],'sm',1,[4,3]);}
  /* funnel */
  if(A.funnel!=='none'){var u0=0.37*L,u1=0.44*L;if(A.funnel==='round')P.poly([[u0,f],[u1,f],[u1,f+hs*1.3],[u1-0.005*L,f+hs*1.45],[u0+0.005*L,f+hs*1.45],[u0,f+hs*1.3]],'b');else P.poly([[u0,f],[u1,f],[u1-0.012*L,f+hs*1.35],[u0+0.006*L,f+hs*1.35]],'b');P.rect(u0+0.008*L,f+hs*1.3,u1-0.014*L,f+hs*1.38,'k2',0);}
  /* mast */
  var mh=Math.max(f+hs*2,h.mast||f+hs*2.2),mx=(fx0+fx1)/2;
  if(A.mast==='lattice'){P.ln([[mx-0.015*L,f+hs*1.15],[mx,mh],[mx+0.015*L,f+hs*1.15]],'k',2);for(var yy=f+hs*1.3;yy<mh;yy+=hs*0.3)P.ln([[mx-0.012*L*(mh-yy)/(mh-f-hs),yy],[mx+0.012*L*(mh-yy)/(mh-f-hs),yy]],'k',1);P.rect(mx-0.025*L,mh-hs*0.5,mx+0.025*L,mh-hs*0.4,'k2',0);P.circ(mx+0.02*L,mh-hs*0.9,hs*0.18,'wht','k');}
  else{P.poly([[mx-0.03*L,f+hs*1.15],[mx+0.03*L,f+hs*1.15],[mx+0.008*L,mh],[mx-0.008*L,mh]],'b');P.rect(mx-0.012*L,f+hs*1.5,mx+0.012*L,f+hs*1.8,'d2');P.ln([[mx,mh],[mx,mh+hs*0.5]],'k',1);}
  /* weapons from the design */
  var vls=cnt('vls');if(vls){var fw=Math.min(0.12,0.0016*vls)*L;P.rect(0.68*L,deck(0.68*L),0.68*L+fw,deck(0.68*L)+0.8,'d1');P.rect(ax1+0.005*L,f,ax1+0.005*L+fw*0.6,f+0.8,'d1');}
  if(cnt('gun')){var gx=0.82*L,gy=deck(gx);P.poly([[gx-2.6,gy],[gx+2.4,gy],[gx+1.6,gy+2.2],[gx-2.2,gy+2.4]],'b');P.rect(gx+1.6,gy+1.2,gx+1.6+Math.max(5,L*0.04),gy+1.5,'k2',0);}
  if(cnt('ciws')){P.circ(fx1-0.005*L,f+hs*1.2,1.0,'wht','k');P.circ(ax0+0.03*L,f+hs*0.8+0.8,1.0,'wht','k');}
  if(cnt('lnch')){P.poly([[0.45*L,f+0.2],[0.47*L,f+0.2],[0.47*L,f+2],[0.45*L,f+1.5]],'d1');}
  if(vls){for(var c=0;c<6;c++){P.rect(0.685*L+c*0.012*fw/0.07/L*L,deck(0.68*L)+0.25,0.685*L+c*0.012*fw/0.07/L*L+fw*0.08,deck(0.68*L)+0.6,'gryL',0);}}
  if(has('av').length||R.wingN){P.stroke([[ax0+0.012*L,f],[ax0+0.012*L,f+hs*0.62],[ax0+0.07*L,f+hs*0.62],[ax0+0.07*L,f]],false,'k',1);P.ln([[ax0+0.012*L,f+hs*0.31],[ax0+0.07*L,f+hs*0.31]],'sm',1,[3,3]);}
  [0.41,0.45].forEach(function(s2){var bx=s2*L,by=f+hs*0.55;P.poly([[bx,by],[bx+0.03*L,by],[bx+0.027*L,by-hs*0.18],[bx+0.004*L,by-hs*0.18]],'wht');P.ln([[bx+0.006*L,by],[bx+0.006*L,by+hs*0.25]],'k',1);P.ln([[bx+0.024*L,by],[bx+0.024*L,by+hs*0.25]],'k',1);});
  if(has('av').length||R.wingN){P.ln([[0.005*L,f+0.1],[ax0-0.01*L,f+0.1]],'trkW',1,[6,4]);}
  P.anch.v_bow=[0.6*L,-T,1.02*L,bf+hs*0.8];P.anch.v_mid=[0.3*L,f-2,0.7*L,mh+3];
  aSeaMarks(P,d,A,L,f,bf);}
function aSeaMarks(P,d,A,L,f,bf){var no=A.mark.plate||(d.series&&d.series[0]?String(d.series[0][1]):'');if(no)P.textSq(no,0.9*L,f*0.62+(bf-f)*0.55,Math.max(14/P.u,f*0.42*AS),'wht','center',1,1);}
function aCarrier(P,d,R,A,L,f,bf,T){var fd=f+2.5;P.poly([[0.0,fd-2.5],[0.02*L,fd],[0.995*L,fd],[1.0*L,fd-2.5],[0.95*L,f]],'b');P.ln([[0.02*L,fd-1.2],[0.99*L,fd-1.2]],'sm',1,[6,4]);
  [0.25,0.55,0.8].forEach(function(s){P.rect(s*L,f+0.2,s*L+0.04*L,fd-2.2,'k2',0);});
  var ix=0.62*L,ih=14;P.poly([[ix,fd],[ix+0.08*L,fd],[ix+0.075*L,fd+ih],[ix+0.005*L,fd+ih]],'b');for(var w=ix+0.01*L;w<ix+0.07*L;w+=0.008*L)P.rect(w,fd+ih-3,w+0.004*L,fd+ih-1.8,'gl',0);
  P.rect(ix+0.02*L,fd+ih*0.45,ix+0.05*L,fd+ih*0.7,'k2',0);P.poly([[ix+0.03*L,fd+ih],[ix+0.05*L,fd+ih],[ix+0.043*L,fd+ih+9],[ix+0.037*L,fd+ih+9]],'b');P.ln([[ix+0.04*L,fd+ih+9],[ix+0.04*L,fd+ih+14]],'k',1);
  var n=Math.min(R.wingN||0,24);for(var i=0;i<n;i++){var x=0.05*L+i*(0.55*L/Math.max(1,n));if(x>ix-0.02*L&&x<ix+0.1*L)x+=0.12*L;if(x>0.97*L)break;P.poly([[x,fd],[x+12,fd],[x+14,fd+1.2],[x+3,fd+1.8],[x+1,fd+4.5],[x-0.5,fd+4.5],[x,fd+1]],'gryD');}
  P.anch.v_bow=[0.55*L,-T,1.02*L,fd+ih+10];P.anch.v_mid=[0.45*L,f-2,0.85*L,fd+ih+16];}
/* slot lists, defaults */
function artSlotsX(d,R){var S=[];if(d.br==='a'){var k=(R.af||{}).kind;
    if(k==='jet'){['nose','canopy','intake','fin','gear'].forEach(function(s){S.push({k:s,n:{nose:'機鼻',canopy:'座艙罩',intake:'進氣道',fin:'垂直尾翼',gear:'起落架'}[s],v:s==='fin'?'tail':s==='gear'?'full':'nose',opts:Object.keys(AAIR[s]).map(function(o){return artOpt(AAIR[s],o);})});});}
    else if(k==='prop'){S.push({k:'wing',n:'主翼位置',v:'full',opts:[{id:'high',n:'上單翼',d:''},{id:'low',n:'下單翼',d:''}]});S.push({k:'gear',n:'起落架',v:'full',opts:Object.keys(AAIR.gear).map(function(o){return artOpt(AAIR.gear,o);})});}
    else S.push({k:'gear',n:'起落裝置',v:'full',opts:[{id:'wheel',n:'機輪',d:''},{id:'skid',n:'滑橇',d:''}]});}
  else if(d.br==='s'&&!(R.hull||{}).sub){['bow','sup','mast','funnel'].forEach(function(s){if((R.hull||{}).deck&&s!=='bow')return;S.push({k:s,n:{bow:'艦艏',sup:'上層結構',mast:'桅杆',funnel:'煙囪'}[s],v:s==='bow'?'bow':'mid',opts:Object.keys(ASEA[s]).map(function(o){return artOpt(ASEA[s],o);})});});}
  return S;}
function artDefX(d,R){if(d.br==='a'){var k=(R.af||{}).kind,st5=/st5|匿蹤/.test(d.id+(R.af&&R.af.n||''));
    return {nose:d.id==='uf10e'?'blunt':'ogive',canopy:/trn|雙座/.test(d.id+(d.n||''))?'tandem':'bubble',intake:st5?'dsi':d.id==='lf'?'chin':'side',fin:d.id==='lf'?'single':'twin',gear:'down',wing:'high',paint:'navy',acc:{},mark:{roundel:1,title:1,plate:''}};}
  return {bow:d.id==='cm0'?'tumble':'clipper',sup:'stealth',mast:'integ',funnel:'stealth',paint:(R.hull||{}).sub?'dark':'navy',acc:{},mark:{title:1,plate:''}};}
