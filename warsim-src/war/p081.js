/* ===================== 微 3D：建築與地標的立體高度 =====================
   放大到每像素 8 公尺以內時，城鎮格依地表類別的建築高度畫成朝右上方延伸的立體方塊（村落約 8 公尺、郊區 7、市鎮 12、舊城區 14、工業區 15、城市中心 22，廢墟只剩斷垣；
   1850 年以前的城鎮矮一些）；地標在每像素 25 公尺以內就依實際高度畫：商業大樓（玻璃帷幕高樓）、市政廳、大學、博物館、學校、警察局、消防局，體育場是橢圓形看台，核電站是反應爐圓頂與雙曲線冷卻塔。
   光源在左上方：屋頂最亮、南面次之、東面最暗；高度誇大兩倍以便看出差異。畫好的立體層會暫存，視野不變時直接貼上，不會每一格動畫都重畫。
   只影響畫面，簡易圖形模式與圖形設定可以關閉。 */
var B3D={on:true,ex:2,mb:8,ml:25};try{var _b3=JSON.parse(localStorage.getItem('lato-warsim-b3d')||'null');if(_b3&&_b3.on===false)B3D.on=false;}catch(e){}
function b3dSave(){try{localStorage.setItem('lato-warsim-b3d',JSON.stringify({on:B3D.on}));}catch(e){}}
/* 城鎮格的索引（地圖改變時重算） */
function b3dCells(){var MP=G.map,k0=G._mapv||0;if(MP._b3c&&MP._b3v===k0)return MP._b3c;var L=[];for(var k=0;k<MP.GW*MP.GH;k++){var c=MP.lc[k];if(isUrban(c))L.push(k);}MP._b3c=L;MP._b3v=k0;return L;}
function b3dHash(k){var h=(k*2654435761)>>>0;h^=h>>>15;h=(h*2246822519)>>>0;return (h>>>8)/16777216;}
function b3dShade(hex,f){var n=parseInt(String(hex).slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;if(f>=0){r+=(255-r)*f;g+=(255-g)*f;b+=(255-b)*f;}else{r*=1+f;g*=1+f;b*=1+f;}return 'rgb('+Math.round(r)+','+Math.round(g)+','+Math.round(b)+')';}
/* 一棟方塊：地面四角 (x0,y0)-(x1,y1)，高 h 像素；rf 是屋頂的明暗 */
var B3DX=0.3,B3DY=0.95;
function b3dBox(c,x0,y0,x1,y1,h,col,rf){var dx=h*B3DX,dy=h*B3DY;
  c.fillStyle=b3dShade(col,-0.42);c.beginPath();c.moveTo(x1,y0);c.lineTo(x1,y1);c.lineTo(x1+dx,y1-dy);c.lineTo(x1+dx,y0-dy);c.closePath();c.fill();
  c.fillStyle=b3dShade(col,-0.22);c.beginPath();c.moveTo(x0,y1);c.lineTo(x1,y1);c.lineTo(x1+dx,y1-dy);c.lineTo(x0+dx,y1-dy);c.closePath();c.fill();
  c.fillStyle=b3dShade(col,rf===undefined?0.18:rf);c.fillRect(x0+dx,y0-dy,x1-x0,y1-y0);if(x1-x0>5){c.strokeStyle='rgba(40,30,25,.3)';c.lineWidth=0.7;c.strokeRect(x0+dx+0.5,y0-dy+0.5,x1-x0-1,y1-y0-1);}}
/* 地標的外觀與高度（公尺）、色彩、占地寬（公尺）與深寬比 */
var B3DL={hall:[30,'#BCAAA4',90,0.55],univ:[20,'#D7CCC8',160,0.6],museum:[18,'#E0D6C8',80,0.55],school:[12,'#FFE0B2',70,0.45],prim:[8,'#FFECB3',60,0.4],police:[12,'#90A4AE',50,0.5],fire:[10,'#EF9A9A',50,0.5]};
function b3dLmk(c,F,m,k){var p=w2s(F.x,F.y),u=k/m,h,w;if(F.dead){w=Math.max(4,60/m);b3dBox(c,p[0]-w/2,p[1]-w/3,p[0]+w/2,p[1]+w/3,3*u,'#8A8178',0.05);return;}
  if(F.k==='tower'){h=(F.h||80)*u;w=Math.max(4,50/m);var x0=p[0]-w/2,y0=p[1]-w/2,x1=p[0]+w/2,y1=p[1]+w/2,dx=h*B3DX,dy=h*B3DY;b3dBox(c,x0,y0,x1,y1,h,'#546E7A',0.55);
    if(w>=6){c.strokeStyle='rgba(225,245,254,.5)';c.lineWidth=Math.max(0.6,Math.min(1.2,w/20));var n=Math.max(2,Math.min(40,Math.round(h/Math.max(4,w*0.35))));for(var i=1;i<n;i++){var f=i/n;c.beginPath();c.moveTo(x0+dx*f,y1-dy*f);c.lineTo(x1+dx*f,y1-dy*f);c.lineTo(x1+dx*f,y0-dy*f);c.stroke();}}return;}
  if(F.k==='stad'){var rx=Math.max(5,130/m),ry=Math.max(4,95/m),hh=28*u,ox=hh*B3DX,oy=hh*B3DY;c.fillStyle='#8D8D8D';c.beginPath();c.ellipse(p[0],p[1],rx,ry,0,0,2*PI);c.fill();c.fillRect(p[0]-rx,p[1]-oy,rx*2,oy);
    c.fillStyle='#9E9E9E';c.beginPath();c.ellipse(p[0]+ox,p[1]-oy,rx,ry,0,0,2*PI);c.fill();c.fillStyle='#D5D5D5';c.beginPath();c.ellipse(p[0]+ox,p[1]-oy,rx*0.88,ry*0.86,0,0,2*PI);c.fill();
    c.fillStyle='#66BB6A';c.beginPath();c.ellipse(p[0]+ox*0.8,p[1]-oy*0.8,rx*0.58,ry*0.52,0,0,2*PI);c.fill();c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=0.8;c.beginPath();c.ellipse(p[0]+ox*0.8,p[1]-oy*0.8,rx*0.44,ry*0.38,0,0,2*PI);c.stroke();return;}
  if(F.k==='npp'){/* 冷卻塔高約 170 公尺、底徑約 115 公尺：高度只誇大兩成、幾乎不傾斜，否則會變成斜斜的細柱；放在背向取水口的陸地那一側 */var d=Math.max(4,45/m),t=170*1.2/m,tw=Math.max(5,115/m),LX=0.1,wd=F.wd||0,ux=-Math.cos(wd),uy=-Math.sin(wd),T2=[[1.3,-0.65],[1.3,0.65]].map(function(o){return [p[0]+(ux*o[0]-uy*o[1])*tw,p[1]+(uy*o[0]+ux*o[1])*tw];}).sort(function(a,b){return a[1]-b[1];});
    T2.forEach(function(o){var x=o[0],y=o[1],P=[],N=10,f,hw,i;for(i=0;i<=N;i++){f=i/N;hw=tw*(f<=0.8?0.3+0.2*Math.pow(1-f/0.8,2):0.3+0.75*(f-0.8)*(f-0.8));P.push([x+t*f*LX,y-t*f,hw]);}
      /* 雙曲線外形：底部最寬、八成高處收腰、頂端略為張開；右側（東面）較暗 */
      c.fillStyle='#CFD8DC';c.beginPath();P.forEach(function(q,k){if(k)c.lineTo(q[0]-q[2],q[1]);else c.moveTo(q[0]-q[2],q[1]);});for(i=N;i>=0;i--)c.lineTo(P[i][0]+P[i][2],P[i][1]);c.closePath();c.fill();
      c.fillStyle='rgba(84,110,122,.38)';c.beginPath();P.forEach(function(q,k){if(k)c.lineTo(q[0]+q[2]*0.25,q[1]);else c.moveTo(q[0]+q[2]*0.25,q[1]);});for(i=N;i>=0;i--)c.lineTo(P[i][0]+P[i][2],P[i][1]);c.closePath();c.fill();
      c.strokeStyle='rgba(69,90,100,.55)';c.lineWidth=0.8;c.beginPath();P.forEach(function(q,k){if(k)c.lineTo(q[0]-q[2],q[1]);else c.moveTo(q[0]-q[2],q[1]);});for(i=N;i>=0;i--)c.lineTo(P[i][0]+P[i][2],P[i][1]);c.closePath();c.stroke();
      var tp=P[N],tx=tp[0],ty=tp[1];c.fillStyle='#78909C';c.beginPath();c.ellipse(tx,ty,tp[2],tp[2]*0.3,0,0,2*PI);c.fill();
      if(!F.melt){c.fillStyle='rgba(255,255,255,.72)';c.beginPath();c.arc(tx,ty-tw*0.3,tw*0.3,0,2*PI);c.arc(tx+tw*0.22,ty-tw*0.62,tw*0.26,0,2*PI);c.arc(tx+tw*0.5,ty-tw*0.9,tw*0.2,0,2*PI);c.fill();}});
    var rh=40*u;b3dBox(c,p[0]-d,p[1]-d*0.6,p[0]+d,p[1]+d*0.6,rh,'#B0BEC5',0.3);var cx=p[0]+rh*B3DX,cy=p[1]-rh*B3DY;
    c.fillStyle=F.melt?'#4E342E':'#ECEFF1';c.beginPath();c.arc(cx,cy,d*0.7,PI,0);c.closePath();c.fill();c.strokeStyle='rgba(55,71,79,.7)';c.lineWidth=1;c.stroke();
    if(F.melt){c.fillStyle='rgba(55,55,55,.55)';c.beginPath();c.arc(cx+d*0.3,cy-d*1.3,d*0.9,0,2*PI);c.arc(cx+d*0.9,cy-d*2.4,d*1.2,0,2*PI);c.arc(cx+d*1.6,cy-d*3.6,d*1.4,0,2*PI);c.fill();}return;}
  var D=B3DL[F.k];if(!D)return;h=D[0]*u;w=Math.max(4,D[2]/m);b3dBox(c,p[0]-w/2,p[1]-w*D[3],p[0]+w/2,p[1]+w*D[3],h,D[1],0.25);}
/* 實際作畫：先畫一般建築（由遠而近），再畫地標 */
function b3dDraw(c,m,FL){var MP=G.map,cs=MP.cs,px=cs/m,k=B3D.ex,y=G.set&&G.set.y||1943,era=y<1850?0.65:y<1920?0.8:1;
  if(m<=B3D.mb){var a=s2w(-40,-40),b=s2w(VW.cw+40,VW.ch+80),gx0=clamp(Math.floor(a[0]/cs),0,MP.GW-1),gy0=clamp(Math.floor(a[1]/cs),0,MP.GH-1),gx1=clamp(Math.ceil(b[0]/cs),0,MP.GW-1),gy1=clamp(Math.ceil(b[1]/cs),0,MP.GH-1);
    var L=b3dCells(),vis=[];for(var i=0;i<L.length;i++){var q=L[i],x=q%MP.GW,yy=(q/MP.GW)|0;if(x<gx0||x>gx1||yy<gy0||yy>gy1)continue;vis.push(q);}
    if(vis.length<=12000){/* 遠的先畫：由上而下、同一列由右而左 */vis.sort(function(p,q){var yp=(p/MP.GW)|0,yq=(q/MP.GW)|0;return yp-yq||(q%MP.GW)-(p%MP.GW);});
      vis.forEach(function(q){var cc=MP.lc[q],C=LC[cc],x=q%MP.GW,yy=(q/MP.GW)|0,r=b3dHash(q),rub=cc===LCI.rubble,hm=(rub?3:(C[6]||6)*era)*(0.6+0.8*r),fp=rub?0.5:cc===LCI.sub||cc===LCI.vill?0.5:cc===LCI.ind||cc===LCI.port?0.8:0.72,s0=w2s(x*cs,yy*cs),w=px*fp,ox=s0[0]+(px-w)*(0.2+0.6*b3dHash(q+7)),oy=s0[1]+(px-w)*(0.2+0.6*b3dHash(q+13));
        b3dBox(c,ox,oy,ox+w,oy+w,hm/m*k,rub?'#8A8178':C[2],0.1+0.16*b3dHash(q+29));});}}
  FL.forEach(function(F){if(!B3DL[F.k]&&F.k!=='tower'&&F.k!=='stad'&&F.k!=='npp')return;var p=w2s(F.x,F.y);if(p[0]<-120||p[1]<-60||p[0]>VW.cw+60||p[1]>VW.ch+400)return;b3dLmk(c,F,m,k);});}
/* 立體層暫存：視野、地圖與地標狀態不變時直接貼上 */
var B3DC={cv:null,key:''};
function draw3D(c){if(!B3D.on||!G||!G.map||typeof gfxSimple==='function'&&gfxSimple())return;var m=mpp();if(m>B3D.ml)return;
  var d=VW.dpr||1,FL=typeof facList==='function'?facList():[],sig=0;for(var i=0;i<FL.length;i++){var F=FL[i];if(F.dead)sig+=F.id*3+1;if(F.melt)sig+=F.id*7+2;}
  var key=[VW.s,VW.ox,VW.oy,VW.cw,VW.ch,d,G._mapv||0,FL.length,sig,B3D.ex].join('|');
  if(B3DC.key!==key||!B3DC.cv){var cv=B3DC.cv||(B3DC.cv=document.createElement('canvas')),W=Math.ceil(VW.cw*d),H=Math.ceil(VW.ch*d);if(cv.width!==W)cv.width=W;if(cv.height!==H)cv.height=H;var o=cv.getContext('2d');o.setTransform(d,0,0,d,0,0);o.clearRect(0,0,VW.cw,VW.ch);b3dDraw(o,m,FL);B3DC.key=key;}
  c.drawImage(B3DC.cv,0,0,VW.cw,VW.ch);}
(function(){var b=drawUnder;drawUnder=function(c){try{draw3D(c);}catch(e){if(window.console)console.warn('3d',e);}b(c);};})();
setSec('gfx','b3d',{o:11,h:function(){return setOpt(setRow('立體建築',setChk('b3d','',B3D.on,'放大時把城鎮建築與高樓、核電站等地標畫成立體（只影響畫面）')));}});
CHG.b3d=function(t){B3D.on=!!t.checked;b3dSave();B3DC.key='';if(G&&G.map&&VW.cb&&VW.cw)vDraw(false);};
HELP14.push('<h4>立體建築（微 3D）</h4><ul><li>放大到每像素 8 公尺以內時，城鎮會畫成立體的建築群：高度依地表類別（村落約 8 公尺、郊區 7、市鎮 12、舊城區 14、工業區 15、城市中心 22，廢墟只剩斷垣；1850 年以前的城鎮矮一些）。</li><li>地標在每像素 25 公尺以內就畫成立體：商業大樓依實際樓高，核電站有反應爐圓頂與冷卻塔（運轉中會冒蒸汽），體育場是橢圓看台，市政廳、大學、學校等依建築高度。高度誇大兩倍，光源在左上方。</li><li>只影響畫面；可在「設定 → 圖形模式與效能」關閉，簡易圖形模式下不畫。</li></ul>');
