/* ===================== 兵牌：北約 APP-6、華約式、明式與二戰德軍式 =====================
   北約式：外框依觀看者的立場（友軍長方形、敵軍菱形、中立方形、不明四葉形；空中只有上半、水下只有下半），內部圖示依兵種，
   上方梯隊記號、下方機動方式（輪型、履帶、牽引）與兵力條，左上角分隊顏色、右上角隊徽；部隊可以自訂圖片。
   華約式：友軍紅、敵軍藍，不畫外框，以車輛或武器圖形表示兵種、桿上橫線表示規模，司令部畫成依層級變化的旗幟。
   明式（旗號）：每個部隊是一面寫著兵種的旗，司令部是令旗或大纛，旒（飄帶）的數目表示規模；友軍的旗向右飄、敵軍向左飄。
   二戰德軍式（H.Dv. 272）：己方藍、敵方紅、盟軍綠；部隊是線條圖形，司令部是旗桿上的旗，旗形表示層級、旗桿腳的記號表示兵種。
   也可以上傳一張小圖片，整張取代兵牌。 */
var IMGC={};
function imgOf(src){if(!src)return null;var c=IMGC[src];if(c)return c.ok?c.im:null;c=IMGC[src]={im:new Image(),ok:false};c.im.onload=function(){c.ok=true;if(UI&&UI.redraw)UI.redraw(true);if(UI&&UI.tab==='orbat'&&typeof obTree==='function'){obTree();obDet();}};c.im.src=src;return null;}
function unitImg(u){if(u.img)return u.img;var mix=u.mix||[[u.hq,1]],t=typeOf(mix[0][0]);if(t&&t.img)return t.img;return '';}
function sideCol(side){return G&&G.sides[side]?G.sides[side].color:side===0?'#2B6CD4':'#D23B3B';}
function lighten(hex,t){return hexOf(mixC(rgbOf(hex),[255,255,255],t));}
/* 兵牌內部的填色：外框顏色的淺色（不是 #RRGGBB 的顏色退回半透明白） */
function lightS(col){return /^#[0-9a-fA-F]{6}$/.test(col)?lightC(col):'rgba(255,255,255,.88)';}
/* ---------- 立場與樣式 ---------- */
var AFFC={f:'#80E0FF',h:'#FF8080',n:'#AAFFAA',u:'#FFFF80'},AFFN={f:'友軍',h:'敵軍',n:'中立',u:'不明'};
function symStd(){var v=typeof UIP!=='undefined'&&UIP.symStd;return v==='wp'||v==='ming'||v==='de'?v:'nato';}
/* 旁觀（同時看兩方）：不分敵我的樣式改用陣營顏色區分兩方 */
function symSpect(){return !!G&&typeof mySide==='function'&&mySide()===null;}
/* 立場：o.aff 指定（第三方）；否則依觀看者——自己這一方是友軍、另一方是敵軍；旁觀時兩方都畫友軍外框（以陣營顏色區分）；看不清的敵情是不明 */
function symAffOf(o){if(o.aff)return o.aff;if(o.q===0)return 'u';var me=G&&typeof mySide==='function'?mySide():null;return me===null||o.side===me?'f':'h';}
/* 外框 */
function framePath(c,x,y,w,h,dom,aff){c.beginPath();var s=h*0.72;aff=aff||'f';
  if(dom==='air'){if(aff==='h'){c.moveTo(x-w*0.42,y+h/2);c.lineTo(x-w*0.42,y-h*0.05);c.lineTo(x,y-s);c.lineTo(x+w*0.42,y-h*0.05);c.lineTo(x+w*0.42,y+h/2);c.closePath();}
    else if(aff==='n')c.rect(x-h*0.55,y-h*0.6,h*1.1,h*1.1);else if(aff==='u')quatPath(c,x,y,h,1);
    else{c.moveTo(x-w/2,y+h/2);c.lineTo(x-w/2,y-h*0.1);c.bezierCurveTo(x-w/2,y-h*0.75,x+w/2,y-h*0.75,x+w/2,y-h*0.1);c.lineTo(x+w/2,y+h/2);c.closePath();}return;}
  if(dom==='sub'){if(aff==='h'){c.moveTo(x-w*0.42,y-h/2);c.lineTo(x+w*0.42,y-h/2);c.lineTo(x+w*0.42,y+h*0.05);c.lineTo(x,y+s);c.lineTo(x-w*0.42,y+h*0.05);c.closePath();}
    else if(aff==='n')c.rect(x-h*0.55,y-h*0.5,h*1.1,h*1.1);else if(aff==='u')quatPath(c,x,y,h,2);
    else{c.moveTo(x-w/2,y-h/2);c.lineTo(x+w/2,y-h/2);c.lineTo(x+w/2,y+h*0.1);c.bezierCurveTo(x+w/2,y+h*0.75,x-w/2,y+h*0.75,x-w/2,y+h*0.1);c.closePath();}return;}
  if(aff==='h'){c.moveTo(x,y-s);c.lineTo(x+s,y);c.lineTo(x,y+s);c.lineTo(x-s,y);c.closePath();return;}
  if(aff==='n'){c.rect(x-h*0.55,y-h*0.55,h*1.1,h*1.1);return;}if(aff==='u'){quatPath(c,x,y,h,0);return;}
  if(dom==='sea'){c.arc(x,y,h*0.62,0,2*PI);return;}c.rect(x-w/2,y-h/2,w,h);}
/* 四葉形（不明）：四個圓的外輪廓；part 1 只有上半（空中）、2 只有下半（水下） */
function quatPath(c,x,y,h,part){var r=h*0.36,d=h*0.3,C=[[0,-d],[d,0],[0,d],[-d,0]],P=[];
  for(var i=0;i<4;i++){var a=C[i],b=C[(i+1)%4],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1],l=Math.sqrt(dx*dx+dy*dy)/2,k=Math.sqrt(r*r-l*l),nx=-dy/(2*l),ny=dx/(2*l),p1=[mx+nx*k,my+ny*k],p2=[mx-nx*k,my-ny*k];P.push(p1[0]*p1[0]+p1[1]*p1[1]>p2[0]*p2[0]+p2[1]*p2[1]?p1:p2);}
  var ang=function(i,p){return Math.atan2(p[1]-C[i][1],p[0]-C[i][0]);},arc=function(i,a0,a1){c.arc(x+C[i][0],y+C[i][1],r,a0,a1,false);};
  if(part===1){arc(3,PI,ang(3,P[3]));arc(0,ang(0,P[3]),ang(0,P[0]));arc(1,ang(1,P[0]),0);c.closePath();return;}
  if(part===2){arc(1,0,ang(1,P[1]));arc(2,ang(2,P[1]),ang(2,P[2]));arc(3,ang(3,P[2]),PI);c.closePath();return;}
  for(var j=0;j<4;j++)arc(j,ang(j,P[(j+3)%4]),ang(j,P[j]));c.closePath();}
/* 外框的上緣、下緣、左緣與內部圖示可用的範圍（相對中心） */
function frameBox(w,h,dom,aff){if(aff==='h')return dom==='air'?{t:-h*0.72,b:h/2,l:-w*0.42,iw:w*0.6,ih:h*0.62,mid:0}:dom==='sub'?{t:-h/2,b:h*0.72,l:-w*0.42,iw:w*0.6,ih:h*0.62,mid:0}:{t:-h*0.72,b:h*0.72,l:-h*0.72,iw:h*0.95,ih:h*0.62,mid:1};
  if(aff==='n')return {t:dom==='air'?-h*0.6:-h*0.55,b:dom==='sub'?h*0.6:h*0.55,l:-h*0.55,iw:h,ih:h*0.95,mid:0};if(aff==='u')return {t:-h*0.66,b:h*0.66,l:-h*0.66,iw:h*0.9,ih:h*0.72,mid:1};
  if(dom==='sea')return {t:-h*0.62,b:h*0.62,l:-h*0.62,iw:h*0.9,ih:h*0.9,mid:1};return {t:dom==='air'?-h*0.6:-h/2,b:dom==='sub'?h*0.6:h/2,l:-w/2,iw:w,ih:h,mid:0};}
/* 機動方式（外框下方）：輪型兩個小圓、履帶長橢圓、畜力或車輛牽引一條線兩端小圓 */
function mobInd(c,mob,x,y,h,col){var r=h*0.085;c.save();c.strokeStyle=col;c.fillStyle=lightS(col);c.lineWidth=Math.max(0.8,h/16);c.beginPath();
  if(mob==='wheel'){c.arc(x-h*0.3,y+r+2,r,0,2*PI);c.moveTo(x+h*0.3+r,y+r+2);c.arc(x+h*0.3,y+r+2,r,0,2*PI);c.fill();c.stroke();}
  else if(mob==='track'){var w=h*0.85,q=h*0.11,t=y+2;c.moveTo(x-w/2+q,t);c.lineTo(x+w/2-q,t);c.arc(x+w/2-q,t+q,q,-PI/2,PI/2);c.lineTo(x-w/2+q,t+2*q);c.arc(x-w/2+q,t+q,q,PI/2,PI*1.5);c.closePath();c.fill();c.stroke();}
  else if(mob==='drawn'){c.moveTo(x-h*0.42,y+r+2);c.lineTo(x+h*0.42,y+r+2);c.stroke();c.beginPath();c.arc(x-h*0.42-r,y+r+2,r,0,2*PI);c.moveTo(x+h*0.42+2*r,y+r+2);c.arc(x+h*0.42+r,y+r+2,r,0,2*PI);c.fill();c.stroke();}
  c.restore();}
function mobH(mob,h){return mob==='wheel'||mob==='track'||mob==='drawn'?h*0.26+3:0;}
/* 分隊顏色：外框左上角的三角（菱形與四葉形畫在左上外側） */
function fcCorner(c,x,y,w,h,B,fc){var k=h*0.46;c.save();c.fillStyle=fc;c.strokeStyle='rgba(20,20,20,.75)';c.lineWidth=1;c.beginPath();
  if(B.mid){var lx=x+B.l,ty=y+B.t;c.moveTo(lx,ty);c.lineTo(lx+k*0.8,ty);c.lineTo(lx,ty+k*0.8);}else{var L=x+B.l,T=y+B.t;c.moveTo(L,T);c.lineTo(L+k,T);c.lineTo(L,T+k);}c.closePath();c.fill();c.stroke();c.restore();}
function symIcon(c,sym,x,y,w,h,col){var L=x-w/2,R=x+w/2,T=y-h/2,B=y+h/2;c.strokeStyle=col;c.fillStyle=col;c.lineWidth=Math.max(0.8,h/15);c.beginPath();
  var X=function(){c.moveTo(L,T);c.lineTo(R,B);c.moveTo(L,B);c.lineTo(R,T);},oval=function(){var rw=w*0.32,rh=h*0.26;c.moveTo(x-rw+rh,y-rh);c.lineTo(x+rw-rh,y-rh);c.arc(x+rw-rh,y,rh,-PI/2,PI/2);c.lineTo(x-rw+rh,y+rh);c.arc(x-rw+rh,y,rh,PI/2,PI*1.5);},dot=function(r){c.moveTo(x+r,y);c.arc(x,y,r,0,2*PI);};
  switch(sym){case 'inf':X();break;case 'mg':X();c.stroke();c.beginPath();c.font='bold '+Math.round(h*0.34)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('MG',x,y+h*0.02);return;
    case 'cav':case 'rec':c.moveTo(L,B);c.lineTo(R,T);break;case 'arm':oval();break;case 'mech':X();oval();break;case 'mot':X();c.moveTo(x,y);c.lineTo(x,B);break;
    case 'art':c.stroke();c.beginPath();dot(h*0.16);c.fill();return;case 'mor':c.stroke();c.beginPath();dot(h*0.1);c.fill();c.beginPath();c.moveTo(x,y);c.lineTo(x,T+h*0.12);c.moveTo(x-h*0.1,T+h*0.25);c.lineTo(x,T+h*0.12);c.lineTo(x+h*0.1,T+h*0.25);break;
    case 'rkt':c.stroke();c.beginPath();dot(h*0.12);c.fill();c.beginPath();c.moveTo(x-h*0.18,y-h*0.12);c.lineTo(x,y-h*0.3);c.lineTo(x+h*0.18,y-h*0.12);break;
    case 'at':c.moveTo(L,B);c.lineTo(x,T);c.lineTo(R,B);break;case 'ad':c.arc(x,B,h*0.42,PI,0);break;
    case 'eng':c.moveTo(x-w*0.25,y+h*0.15);c.lineTo(x-w*0.25,y-h*0.12);c.lineTo(x+w*0.25,y-h*0.12);c.lineTo(x+w*0.25,y+h*0.15);c.moveTo(x,y-h*0.12);c.lineTo(x,y+h*0.15);break;
    case 'hq':c.font='bold '+Math.round(h*0.42)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('HQ',x,y+h*0.03);return;
    case 'sup':c.moveTo(L,y+h*0.2);c.lineTo(R,y+h*0.2);break;
    case 'heli':c.moveTo(x-w*0.3,y-h*0.22);c.lineTo(x+w*0.3,y+h*0.22);c.lineTo(x+w*0.3,y-h*0.22);c.lineTo(x-w*0.3,y+h*0.22);c.closePath();break;
    case 'uav':c.moveTo(x-w*0.32,y-h*0.15);c.lineTo(x,y+h*0.18);c.lineTo(x+w*0.32,y-h*0.15);break;
    case 'ew':c.moveTo(x-w*0.22,y-h*0.25);c.lineTo(x+w*0.05,y-h*0.02);c.lineTo(x-w*0.05,y+h*0.02);c.lineTo(x+w*0.22,y+h*0.27);break;
    case 'sof':c.font='bold '+Math.round(h*0.4)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('SF',x,y+h*0.03);return;
    case 'pike':c.moveTo(x,B-h*0.08);c.lineTo(x,T+h*0.25);c.moveTo(x-h*0.1,T+h*0.3);c.lineTo(x,T+h*0.08);c.lineTo(x+h*0.1,T+h*0.3);c.moveTo(x-w*0.22,y+h*0.12);c.lineTo(x+w*0.22,y+h*0.12);break;
    case 'nav':c.moveTo(x-h*0.38,y);c.lineTo(x+h*0.38,y);c.lineTo(x+h*0.26,y+h*0.2);c.lineTo(x-h*0.26,y+h*0.2);c.closePath();c.moveTo(x,y);c.lineTo(x,y-h*0.32);c.moveTo(x-h*0.14,y-h*0.18);c.lineTo(x+h*0.14,y-h*0.18);break;
    case 'sub':c.moveTo(x+w*0.3,y);c.ellipse(x,y,w*0.3,h*0.12,0,0,2*PI);c.moveTo(x-h*0.06,y-h*0.1);c.lineTo(x-h*0.06,y-h*0.25);c.lineTo(x+h*0.08,y-h*0.25);c.lineTo(x+h*0.08,y-h*0.1);break;
    case 'air':c.moveTo(x,y-h*0.32);c.lineTo(x,y+h*0.3);c.moveTo(x-w*0.3,y-h*0.02);c.lineTo(x+w*0.3,y-h*0.02);c.moveTo(x-w*0.12,y+h*0.26);c.lineTo(x+w*0.12,y+h*0.26);break;
    case 'ash':c.moveTo(x+w*0.32,y-h*0.08);c.ellipse(x,y-h*0.08,w*0.32,h*0.18,0,0,2*PI);c.moveTo(x-h*0.1,y+h*0.12);c.lineTo(x+h*0.1,y+h*0.12);c.lineTo(x+h*0.07,y+h*0.24);c.lineTo(x-h*0.07,y+h*0.24);c.closePath();break;
    case 'mon':for(var i=-1;i<=1;i++){c.moveTo(x+i*w*0.18,y-h*0.25);c.bezierCurveTo(x+i*w*0.18+h*0.15,y-h*0.05,x+i*w*0.18-h*0.15,y+h*0.1,x+i*w*0.18,y+h*0.3);}break;
    case 'drg':c.moveTo(x-w*0.34,y-h*0.1);c.lineTo(x-w*0.12,y-h*0.28);c.lineTo(x-w*0.06,y-h*0.06);c.lineTo(x+w*0.06,y-h*0.06);c.lineTo(x+w*0.12,y-h*0.28);c.lineTo(x+w*0.34,y-h*0.1);c.moveTo(x-w*0.06,y-h*0.06);c.lineTo(x,y+h*0.3);c.lineTo(x+w*0.06,y-h*0.06);break;
    case 'mp':case 'pow':case 'ref':case 'ca':case 'sec':case 'psy':case 'lab':var TX={mp:'MP',pow:'PW',ref:'DP',ca:'CA',sec:'SEC',psy:'PSY',lab:'LB'}[sym];c.font='bold '+Math.round(h*(TX.length>2?0.32:0.42))+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(TX,x,y+h*0.03);if(sym==='sec'){c.beginPath();c.moveTo(L,B-h*0.08);c.lineTo(R,B-h*0.08);c.stroke();}return;
    case 'med':c.lineWidth=Math.max(1.2,h/8);c.moveTo(x,y-h*0.3);c.lineTo(x,y+h*0.3);c.moveTo(x-h*0.3,y);c.lineTo(x+h*0.3,y);break;
    case 'ent':c.font='bold '+Math.round(h*0.5)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('\u266a',x,y+h*0.03);return;
    case 'gue':X();c.stroke();c.beginPath();c.font='bold '+Math.round(h*0.34)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#fff';c.fillRect(x-h*0.17,y-h*0.17,h*0.34,h*0.34);c.fillStyle=col;c.fillText('G',x,y+h*0.02);return;
    case 'sge':c.moveTo(x-w*0.3,y+h*0.25);c.lineTo(x-w*0.3,y-h*0.1);for(var q=0;q<4;q++){var bx=x-w*0.3+q*w*0.15;c.lineTo(bx,y-h*0.25);c.lineTo(bx+w*0.075,y-h*0.25);c.lineTo(bx+w*0.075,y-h*0.1);c.lineTo(bx+w*0.15,y-h*0.1);}c.lineTo(x+w*0.3,y+h*0.25);c.closePath();break;
    default:c.font='bold '+Math.round(h*0.45)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('?',x,y+h*0.03);return;}
  c.stroke();}
/* 畫一個單位符號：o={x,y,h,sym,ech,dom,side,str,ms,sel,img,q,hq,alpha,lbl,col} */
/* 符號點陣快取：外框、底色、兵種圖形、部隊圖片與編制記號先畫在小畫布上，之後每一格只貼一張圖（上千個符號時省下大量路徑與文字繪製） */
/* ---------- 華約式（蘇式）戰術記號：不畫外框；兵種以車輛或武器圖形、規模以桿上的橫線表示；司令部是旗幟 ---------- */
var WPC={f:'#C62828',h:'#1565C0',n:'#2E7D32',u:'#424242'};
/* 司令部旗幟：營三角旗、團長方旗、旅斜邊旗、師燕尾旗、軍兩條直線、集團軍兩條橫線、方面軍飄揚的大旗 */
function wpFlag(c,x,y,h,ech,col){var pole=h*1.05,fw=h*0.95,fh=h*0.55,px=x-fw*0.45,top=y-pole*0.6;c.beginPath();c.moveTo(px,y+pole*0.4);c.lineTo(px,top);c.stroke();c.beginPath();
  if(ech<=2){c.moveTo(px,top);c.lineTo(px+fw,top+fh/2);c.lineTo(px,top+fh);}
  else if(ech===4){c.moveTo(px,top);c.lineTo(px+fw,top);c.lineTo(px+fw*0.8,top+fh);c.lineTo(px,top+fh);}
  else if(ech===5){c.moveTo(px,top);c.lineTo(px+fw,top);c.lineTo(px+fw*0.72,top+fh/2);c.lineTo(px+fw,top+fh);c.lineTo(px,top+fh);}
  else if(ech>=8){c.moveTo(px,top);c.bezierCurveTo(px+fw*0.4,top-fh*0.35,px+fw*0.7,top+fh*0.35,px+fw*1.15,top);c.lineTo(px+fw*1.15,top+fh);c.bezierCurveTo(px+fw*0.7,top+fh*1.35,px+fw*0.4,top+fh*0.65,px,top+fh);}
  else{c.rect(px,top,fw,fh);}c.closePath();c.fillStyle=lightS(col);c.fill();c.stroke();c.beginPath();
  if(ech===6){c.moveTo(px+fw*0.2,top);c.lineTo(px+fw*0.2,top+fh);c.moveTo(px+fw*0.8,top);c.lineTo(px+fw*0.8,top+fh);}else if(ech===7){c.moveTo(px,top+fh*0.33);c.lineTo(px+fw,top+fh*0.33);c.moveTo(px,top+fh*0.66);c.lineTo(px+fw,top+fh*0.66);}c.stroke();return {x:px+fw/2,y:top+fh/2,w:fw,h:fh};}
/* 兵種圖形（中心 x,y、大小 h），回傳圖形後端（畫規模橫線的桿子起點） */
function wpShape(c,sym,mob,x,y,h){var w=h*1.25,L=x-w/2,R=x+w/2,T=y-h*0.32,B=y+h*0.32;c.beginPath();
  switch(sym){case 'arm':c.moveTo(L,y);c.lineTo(x,T-h*0.08);c.lineTo(R,y);c.lineTo(x,B+h*0.08);c.closePath();break;
    case 'mech':case 'mot':c.moveTo(L,T);c.lineTo(R-h*0.3,T);c.lineTo(R,y);c.lineTo(R-h*0.3,B);c.lineTo(L,B);c.closePath();if(sym==='mech'){c.moveTo(L,B+h*0.1);c.lineTo(R-h*0.3,B+h*0.1);}break;
    case 'rec':case 'cav':c.moveTo(L,T);c.lineTo(R-h*0.35,T);c.quadraticCurveTo(R+h*0.05,y,R-h*0.35,B);c.lineTo(L,B);c.closePath();break;
    case 'art':c.moveTo(L,y);c.lineTo(R,y);c.moveTo(x-h*0.12,y);c.lineTo(x-h*0.32,B+h*0.06);c.moveTo(x-h*0.12,y);c.lineTo(x-h*0.32,T-h*0.06);c.moveTo(x+h*0.18,T);c.lineTo(x+h*0.18,B);break;
    case 'mor':c.arc(x,y,h*0.24,0,2*PI);c.moveTo(x-h*0.24,y-h*0.3);c.lineTo(x+h*0.24,y-h*0.3);c.moveTo(x-h*0.24,y+h*0.3);c.lineTo(x+h*0.24,y+h*0.3);break;
    case 'rkt':c.arc(x,y,h*0.36,0,2*PI);c.rect(x-h*0.2,y-h*0.2,h*0.4,h*0.4);c.moveTo(x-h*0.2,y+h*0.2);c.lineTo(x+h*0.2,y-h*0.2);break;
    case 'at':c.moveTo(x,T-h*0.05);c.lineTo(x,B);c.moveTo(x-h*0.22,B-h*0.2);c.lineTo(x,B+h*0.02);c.lineTo(x+h*0.22,B-h*0.2);c.moveTo(L+h*0.2,y);c.lineTo(R-h*0.2,y);break;
    case 'ad':c.moveTo(x,B);c.lineTo(x,T-h*0.08);c.moveTo(x-h*0.22,T+h*0.12);c.lineTo(x,T-h*0.1);c.lineTo(x+h*0.22,T+h*0.12);c.moveTo(x-h*0.32,B);c.arc(x,B,h*0.32,PI,0);break;
    case 'eng':c.moveTo(L,T);c.lineTo(R-h*0.2,T);c.lineTo(R-h*0.2,B);c.lineTo(L,B);c.closePath();c.moveTo(R,T-h*0.08);c.lineTo(R,B+h*0.08);c.moveTo(R-h*0.2,y);c.lineTo(R,y);break;
    case 'heli':c.arc(x,y,h*0.22,0,2*PI);c.moveTo(L,y-h*0.32);c.lineTo(R,y-h*0.32);c.moveTo(x,y-h*0.32);c.lineTo(x,y-h*0.22);break;
    case 'uav':c.moveTo(L+h*0.1,T);c.lineTo(R-h*0.1,T);c.lineTo(x,B);c.closePath();break;
    case 'air':c.moveTo(x,T-h*0.1);c.lineTo(x,B+h*0.1);c.moveTo(L,y-h*0.05);c.lineTo(R,y-h*0.05);c.moveTo(x-h*0.25,B);c.lineTo(x+h*0.25,B);break;
    case 'nav':case 'sub':case 'ash':case 'mon':case 'drg':c.moveTo(L,T+h*0.1);c.lineTo(R,T+h*0.1);c.lineTo(R-h*0.25,B);c.lineTo(L+h*0.25,B);c.closePath();break;
    case 'sup':case 'med':case 'mp':case 'pow':case 'ref':case 'ca':case 'sec':case 'psy':case 'lab':case 'ent':case 'ew':case 'com':
      var q=h*0.14;c.moveTo(L+q,T);c.lineTo(R-q,T);c.quadraticCurveTo(R,T,R,T+q);c.lineTo(R,B-q);c.quadraticCurveTo(R,B,R-q,B);c.lineTo(L+q,B);c.quadraticCurveTo(L,B,L,B-q);c.lineTo(L,T+q);c.quadraticCurveTo(L,T,L+q,T);break;
    default:/* 徒步部隊：圓形 */c.arc(x,y,h*0.34,0,2*PI);if(sym==='mg'){c.moveTo(x-h*0.2,y);c.lineTo(x+h*0.2,y);}}
  c.fillStyle=lightS(c.strokeStyle);c.fill();c.stroke();var lab={sup:'補',med:'醫',mp:'憲',pow:'俘',ref:'難',ca:'民',sec:'警',psy:'宣',lab:'工',ent:'娛',ew:'電',com:'通',gue:'游',sof:'特'}[sym];
  if(lab){c.save();c.font='bold '+Math.round(h*0.4)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle=c.strokeStyle;c.fillText(lab,x,y+h*0.02);c.restore();}
  return sym==='art'||sym==='at'||sym==='ad'||sym==='mor'?[x-h*0.05,B+h*0.12]:[L,y];}
/* 規模：排一條、連兩條、營三條（畫在圖形後方的桿子上） */
function wpSize(c,p,h,ech){var n=ech<=0?1:ech===1?2:3,len=h*0.55;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(p[0]-len,p[1]);for(var i=0;i<n;i++){var xx=p[0]-len*0.35-i*h*0.13;c.moveTo(xx,p[1]-h*0.12);c.lineTo(xx,p[1]+h*0.12);}c.stroke();}
function wpSym(c,o,x,y,h,aff){var col=aff==='f'&&symSpect()?o.col||sideCol(o.side):o.col&&aff==='f'&&typeof UIP!=='undefined'&&UIP.symCol==='side'?o.col:WPC[aff],a=o.alpha===undefined?1:o.alpha;c.save();c.globalAlpha=a;c.lineJoin='round';
  if(o.sel){c.beginPath();c.arc(x,y,h*1.05,0,2*PI);c.fillStyle='rgba(255,235,59,.45)';c.fill();}
  c.strokeStyle=o.ms==='rout'?'#6D4C41':col;c.lineWidth=Math.max(1,h/13);var ech=o.ech!==undefined?o.ech:-1,box;
  if(o.q===0){c.font='bold '+Math.round(h*0.8)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle=col;c.fillText('?',x,y);c.restore();return {b:h*0.4};}
  if(o.hq||o.sym==='hq'||ech>=3){box=wpFlag(c,x,y,h,Math.max(ech,2),c.strokeStyle);if(o.sym&&o.sym!=='hq'&&o.agg){c.save();c.lineWidth=Math.max(0.8,h/16);wpShape(c,o.sym,o.mob,box.x,box.y,h*0.42);c.restore();}}
  else{var p=wpShape(c,o.sym,o.mob,x,y,h);if(ech>=0)wpSize(c,p,h,ech);}
  if(o.ms==='shaken'||o.ms==='rout'){c.beginPath();c.moveTo(x-h*0.7,y+h*0.55);c.lineTo(x+h*0.7,y-h*0.55);c.setLineDash([3,2]);c.stroke();c.setLineDash([]);}
  c.restore();return {b:h*0.62};}
/* ---------- 明式（旗號）：旗上寫兵種；營、團司令部是三角令旗，師以上是帶火焰牙邊與旒的大纛 ---------- */
var MSCH={inf:'步',mg:'銃',pike:'槍',cav:'騎',rec:'哨',arm:'甲',mech:'車',mot:'車',art:'砲',mor:'砲',rkt:'火',at:'銃',ad:'防',eng:'工',sup:'輜',heli:'飛',uav:'鳶',ew:'聽',sof:'銳',nav:'舟',sub:'潛',air:'飛',ash:'艇',mon:'怪',drg:'龍',mp:'糾',pow:'俘',ref:'民',ca:'撫',sec:'衛',psy:'諭',lab:'役',med:'醫',ent:'樂',gue:'義',sge:'攻'};
var MSFONT='"Songti TC","Noto Serif CJK TC","Noto Serif TC","PMingLiU","MingLiU",serif';
function msSym(c,o,x,y,h,aff){var col=aff==='u'?'#8D8D8D':aff==='n'&&!o.col?'#C9A227':o.col||sideCol(o.side),dir=aff==='h'?-1:1,ech=o.ech!==undefined?o.ech:-1,hq=o.hq||o.sym==='hq',big=hq&&ech>=5,tri=hq&&!big,fw=h*(big?1.3:tri?1.05:0.95),fh=h*(big?1.0:0.78),px=x-dir*fw*0.5,top=y-h*0.62,a=o.alpha===undefined?1:o.alpha,dk=hexOf(mixC(rgbOf(col),[0,0,0],0.45));
  c.save();c.globalAlpha=a;c.lineJoin='round';if(o.sel){c.beginPath();c.arc(x,y-h*0.1,h*1.05,0,2*PI);c.fillStyle='rgba(255,235,59,.45)';c.fill();}
  /* 動搖時旗子傾斜，潰散時旗倒 */if(o.ms==='shaken'||o.ms==='rout'){var py=y+h*0.62;c.translate(px,py);c.rotate(dir*(o.ms==='rout'?1.0:0.28));c.translate(-px,-py);}
  /* 旗桿與槍頭 */c.strokeStyle='#4E342E';c.lineWidth=Math.max(1.1,h/13);c.beginPath();c.moveTo(px,y+h*0.62);c.lineTo(px,top-h*0.1);c.stroke();c.fillStyle='#6D4C41';c.beginPath();c.moveTo(px,top-h*0.32);c.lineTo(px-h*0.07,top-h*0.1);c.lineTo(px+h*0.07,top-h*0.1);c.closePath();c.fill();
  var ex=px+dir*fw,path=function(){c.beginPath();if(tri){c.moveTo(px,top);c.lineTo(ex,top+fh*0.5);c.lineTo(px,top+fh);}else{c.moveTo(px,top);c.lineTo(ex,top);c.lineTo(ex,top+fh);c.lineTo(px,top+fh);}c.closePath();};
  /* 火焰牙邊：大纛與令旗的外緣一圈小三角 */if(big||tri){c.fillStyle='#F2C14E';c.strokeStyle=dk;c.lineWidth=0.6;var n=big?7:5;for(var i=0;i<n;i++){var t0=i/n,t1=(i+0.5)/n,t2=(i+1)/n,P=function(t){return tri?[px+dir*fw*t,top+fh*0.5*t]:[px+dir*fw*t,top];},Q=function(t){return tri?[px+dir*fw*t,top+fh-fh*0.5*t]:[px+dir*fw*t,top+fh];};
      [[P,-1],[Q,1]].forEach(function(q){var A=q[0](t0),Bp=q[0](t2),M=q[0](t1),s=q[1]*h*0.13;c.beginPath();c.moveTo(A[0],A[1]);c.lineTo(M[0],M[1]+s);c.lineTo(Bp[0],Bp[1]);c.closePath();c.fill();c.stroke();});}}
  path();c.fillStyle=col;c.fill();c.lineWidth=Math.max(0.9,h/17);c.strokeStyle=o.ms==='rout'?'#C62828':o.ms==='shaken'?'#E0A100':dk;c.stroke();
  /* 旒：旗面下緣垂下的飄帶，數目表示規模（排一條……師以上五條） */var nr=ech<0?0:Math.min(5,ech+1);if(!tri&&nr>0){c.strokeStyle=col;c.lineWidth=Math.max(0.9,h/15);for(var k=0;k<nr;k++){var sx=px+dir*fw*(0.18+0.64*(nr===1?0.5:k/(nr-1)));c.beginPath();c.moveTo(sx,top+fh);c.quadraticCurveTo(sx+dir*h*0.08,top+fh+h*0.16,sx-dir*h*0.02,top+fh+h*0.3);c.stroke();}}
  var ch=aff==='u'?'？':big?'帥':tri?'令':MSCH[o.sym]||'兵';c.font='bold '+Math.round(fh*(tri?0.48:0.66))+'px '+MSFONT;c.textAlign='center';c.textBaseline='middle';c.fillStyle='#FFF6D8';c.strokeStyle=dk;c.lineWidth=2;var tx=px+dir*fw*(tri?0.36:0.5),ty=top+fh*0.54;c.strokeText(ch,tx,ty);c.fillText(ch,tx,ty);
  c.restore();return {t:-(h*0.62+h*0.32),b:h*0.62};}
/* ---------- 二戰德軍（H.Dv. 272《陸軍戰術符號範式》1943 年版）：線條圖形，不畫外框 ----------
   司令部是旗桿上的旗，旗形表示層級：營實心三角旗、團實心方旗、旅空心三角旗加中線、師三道（深淺深）的三角旗、
   軍上下兩個三角的方旗、集團軍四格、方面軍九格的棋盤方旗；連長只有桿頂一小橫。旗桿上與桿腳的記號表示兵種與機動方式。
   團以上的部隊與司令部一樣畫成旗（當時的態勢圖以司令部旗代表整個部隊）。 */
var DEC={f:'#1F4E9E',h:'#C62828',n:'#2E7D32',u:'#616161'};
var DELT={sof:'Sd',heli:'Hs',uav:'Dr',air:'Fl',nav:'M',sub:'U',ash:'Ls',mon:'Ug',drg:'Dra',mp:'FG',pow:'Kgf',ref:'Zv',ca:'MV',sec:'Sich',psy:'Prop',lab:'Bau',ent:'Btr',gue:'Part'};
function deCol(o,aff){if(aff==='f'&&symSpect())return o.col||sideCol(o.side);return o.col&&aff==='f'&&typeof UIP!=='undefined'&&UIP.symCol==='side'?o.col:DEC[aff]||DEC.f;}
/* 司令部旗；fbr 是編制的兵種（後綴 .m 表示摩托化）；回傳上下緣（相對 y） */
function deStaff(c,x,y,h,ech,fbr,col){var px=x-h*0.34,top=y-h*0.7,fh=h*0.6,fw=h*0.95,sq=fh*1.1,bot=y+h*0.48,mot=/\.m$/.test(fbr||''),b=(fbr||'').replace(/\.m$/,''),ext=b==='eng'||b==='sup'||b==='med'||b==='ew'?h*0.26:0,ptop=top-ext,fb=0,lw=Math.max(1,h/14),W=lightS(col);
  c.lineWidth=lw;c.strokeStyle=col;c.fillStyle=col;c.lineJoin='miter';c.beginPath();c.moveTo(px,bot);c.lineTo(px,ptop);c.stroke();
  var tri=function(){c.beginPath();c.moveTo(px,top);c.lineTo(px+fw,top+fh/2);c.lineTo(px,top+fh);c.closePath();},sqp=function(){c.beginPath();c.rect(px,top,sq,fh);};
  if(ech<=1){c.beginPath();c.moveTo(px,top);c.lineTo(px+h*0.3,top);c.stroke();}
  else if(ech===2){tri();c.fill();c.stroke();}
  else if(ech===3){sqp();c.fill();c.stroke();}
  else if(ech===4){tri();c.fillStyle=W;c.fill();c.stroke();c.beginPath();c.moveTo(px,top+fh/2);c.lineTo(px+fw,top+fh/2);c.stroke();}
  else if(ech===5){tri();c.fillStyle=W;c.fill();c.save();tri();c.clip();c.fillStyle=col;c.fillRect(px,top,fw,fh*0.34);c.fillRect(px,top+fh*0.66,fw,fh*0.34);c.restore();tri();c.stroke();}
  else if(ech===6){sqp();c.fillStyle=W;c.fill();c.fillStyle=col;c.beginPath();c.moveTo(px,top);c.lineTo(px+sq,top);c.lineTo(px+sq/2,top+fh/2);c.closePath();c.moveTo(px,top+fh);c.lineTo(px+sq,top+fh);c.lineTo(px+sq/2,top+fh/2);c.closePath();c.fill();sqp();c.stroke();}
  else{var n=ech===7?2:3;sqp();c.fillStyle=W;c.fill();c.fillStyle=col;for(var i=0;i<n;i++)for(var j=0;j<n;j++)if((i+j)%2===0)c.fillRect(px+sq*i/n,top+fh*j/n,sq/n,fh/n);sqp();c.stroke();}
  c.lineWidth=Math.max(0.8,h/16);c.fillStyle=W;c.strokeStyle=col;
  if(mot){c.beginPath();c.arc(px,bot-h*0.14,h*0.075,0,2*PI);c.fill();c.stroke();}
  if(b==='arm'){/* 裝甲：桿腳的菱形（平行四邊形） */c.beginPath();c.moveTo(px-h*0.3,bot);c.lineTo(px,bot);c.lineTo(px-h*0.1,bot+h*0.17);c.lineTo(px-h*0.4,bot+h*0.17);c.closePath();c.fill();c.stroke();fb=h*0.17;}
  else if(b==='mech'){/* 裝甲擲彈兵（半履帶）：小車與履帶 */c.beginPath();c.rect(px,bot,h*0.34,h*0.12);c.fill();c.stroke();c.beginPath();c.moveTo(px+h*0.03,bot+h*0.19);c.lineTo(px+h*0.31,bot+h*0.19);c.stroke();fb=h*0.2;}
  else if(b==='cav'){/* 騎兵：斜線方塊 */c.beginPath();c.rect(px,bot,h*0.34,h*0.15);c.fill();c.stroke();c.beginPath();c.moveTo(px,bot+h*0.15);c.lineTo(px+h*0.34,bot);c.stroke();fb=h*0.15;}
  else if(b==='art'){/* 砲兵：桿上一段粗線 */c.fillStyle=col;c.fillRect(px-h*0.09,bot-h*0.4,h*0.18,h*0.17);}
  else if(b==='rkt'){/* 火箭（煙幕）部隊：桿腳分叉 */c.beginPath();c.moveTo(px-h*0.13,bot+h*0.13);c.lineTo(px,bot);c.lineTo(px+h*0.13,bot+h*0.13);c.stroke();fb=h*0.13;}
  else if(b==='at'){/* 反裝甲：桿上一道橫線 */c.beginPath();c.moveTo(px-h*0.11,bot-h*0.3);c.lineTo(px+h*0.11,bot-h*0.3);c.stroke();}
  else if(b==='ad'){/* 高射砲：桿腳小圓 */c.beginPath();c.arc(px,bot+h*0.07,h*0.07,0,2*PI);c.fill();c.stroke();fb=h*0.14;}
  else if(b==='eng'){/* 工兵：桿頂的鎬 */c.fillStyle=col;c.beginPath();c.moveTo(px,ptop-h*0.06);c.lineTo(px-h*0.09,ptop+h*0.08);c.lineTo(px+h*0.09,ptop+h*0.08);c.closePath();c.fill();c.beginPath();c.moveTo(px-h*0.1,ptop+h*0.15);c.lineTo(px+h*0.1,ptop+h*0.15);c.stroke();}
  else if(b==='sup'){/* 補給：桿頂兩道 */c.beginPath();c.moveTo(px-h*0.1,ptop);c.lineTo(px+h*0.1,ptop);c.moveTo(px-h*0.1,ptop+h*0.09);c.lineTo(px+h*0.1,ptop+h*0.09);c.stroke();}
  else if(b==='med'){/* 衛生：桿頂十字 */c.beginPath();c.moveTo(px-h*0.1,ptop+h*0.08);c.lineTo(px+h*0.1,ptop+h*0.08);c.stroke();}
  else if(b==='ew'){/* 通信：桿頂箭頭 */c.beginPath();c.moveTo(px-h*0.08,ptop+h*0.1);c.lineTo(px,ptop-h*0.02);c.lineTo(px+h*0.08,ptop+h*0.1);c.stroke();}
  else{var tl={abn:'Fsch',rec:'A',nav:'M',air:'Fl',ash:'Ls'}[b];if(tl){c.fillStyle=col;c.font='bold '+Math.max(7,Math.round(h*0.34))+'px sans-serif';c.textAlign='right';c.textBaseline='bottom';c.fillText(tl,px-h*0.06,bot+1);}}
  return {t:ptop-y-h*0.08,b:bot-y+fb};}
/* 部隊圖形：排細線、連左邊加粗、營四邊加粗；機動方式：框下兩輪（摩托化）或履帶（自走），砲與反裝甲的車輛牽引畫在上方（o—o）；畜力牽引不加記號 */
function deShape(c,o,x,y,h,col){var sym=o.sym,ech=o.ech!==undefined?o.ech:-1,mob=o.mob||'',w=h*1.3,bh=h*0.62,L=x-w/2,R=x+w/2,T=y-bh/2,B=y+bh/2,lw=Math.max(0.9,h/16),tk=Math.max(1.8,h/7.5),W=lightS(col),t=T,b=B,nb=false,sw=ech>=2?tk:ech===1?Math.max(1.4,h/10):Math.max(1.1,h/13);
  c.strokeStyle=col;c.fillStyle=col;c.lineWidth=lw;c.lineJoin='miter';
  var box=function(P){c.beginPath();if(P){c.moveTo(P[0][0],P[0][1]);for(var i=1;i<P.length;i++)c.lineTo(P[i][0],P[i][1]);c.closePath();}else c.rect(L,T,w,bh);c.fillStyle=W;c.fill();c.lineWidth=ech>=2?tk:lw;c.stroke();
      if(ech===1){var p0=P?P[0]:[L,T],p1=P?P[P.length-1]:[L,B];c.lineWidth=tk;c.beginPath();c.moveTo(p0[0],p0[1]);c.lineTo(p1[0],p1[1]);c.stroke();}c.lineWidth=lw;c.fillStyle=col;},
    txt=function(s){c.save();c.font='bold '+Math.max(7,Math.round(h*(s.length>2?0.3:0.38)))+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle=col;c.fillText(s,x,y+h*0.02);c.restore();},
    wheels=function(yy){var r=h*0.075;c.save();c.fillStyle=W;c.lineWidth=Math.max(0.8,h/17);c.beginPath();c.arc(L+w*0.22,yy+r+1,r,0,2*PI);c.moveTo(R-w*0.22+r,yy+r+1);c.arc(R-w*0.22,yy+r+1,r,0,2*PI);c.fill();c.stroke();c.restore();return yy+2*r+1;},
    track=function(yy,k){var q=h*0.07,l=x-w*(k||0.38),r=x+w*(k||0.38);c.save();c.fillStyle=W;c.lineWidth=Math.max(0.8,h/17);c.beginPath();c.moveTo(l+q,yy);c.lineTo(r-q,yy);c.arc(r-q,yy+q,q,-PI/2,PI/2);c.lineTo(l+q,yy+2*q);c.arc(l+q,yy+q,q,PI/2,PI*1.5);c.closePath();c.fill();c.stroke();c.restore();return yy+2*q;},
    motZ=function(yy){var r=h*0.06;c.save();c.fillStyle=W;c.lineWidth=Math.max(0.8,h/17);c.beginPath();c.moveTo(x-h*0.2,yy);c.lineTo(x+h*0.2,yy);c.stroke();c.beginPath();c.arc(x-h*0.2-r,yy,r,0,2*PI);c.moveTo(x+h*0.2+2*r,yy);c.arc(x+h*0.2+r,yy,r,0,2*PI);c.fill();c.stroke();c.restore();return yy-r;};
  switch(sym){
    case 'arm':/* 裝甲：平行四邊形 */var sk=h*0.26;box([[L,T],[R-sk,T],[R,B],[L+sk,B]]);break;
    case 'cav':/* 騎兵：框內斜線 */box();c.beginPath();c.moveTo(L,B);c.lineTo(R,T);c.stroke();break;
    case 'mg':/* 機槍：框內十字 */box();c.beginPath();c.moveTo(x,T+bh*0.18);c.lineTo(x,B-bh*0.18);c.moveTo(x-h*0.12,y);c.lineTo(x+h*0.12,y);c.stroke();break;
    case 'mor':/* 迫擊砲：框內角形 */box();c.beginPath();c.moveTo(x+h*0.22,T+bh*0.2);c.lineTo(x-h*0.2,B-bh*0.2);c.lineTo(x+h*0.24,B-bh*0.2);c.stroke();break;
    case 'mot':/* 摩托化步兵：框下兩輪 */box();b=wheels(B);mob='';break;
    case 'mech':/* 裝甲擲彈兵（裝甲運兵車）：框下履帶 */box();b=mob==='wheel'?wheels(B):track(B+2);mob='';break;
    case 'eng':/* 工兵：框上的鎬 */box();var ex=L+w*0.3;c.beginPath();c.moveTo(ex,T);c.lineTo(ex,T-h*0.22);c.stroke();c.beginPath();c.moveTo(ex,T-h*0.34);c.lineTo(ex-h*0.09,T-h*0.2);c.lineTo(ex+h*0.09,T-h*0.2);c.closePath();c.fill();t=T-h*0.34;break;
    case 'med':/* 衛生：框上十字 */box();c.beginPath();c.moveTo(x,T);c.lineTo(x,T-h*0.3);c.moveTo(x-h*0.1,T-h*0.2);c.lineTo(x+h*0.1,T-h*0.2);c.stroke();t=T-h*0.3;break;
    case 'sup':/* 補給（運輸）：框上短桿 */box();c.beginPath();c.moveTo(x,T);c.lineTo(x,T-h*0.2);c.moveTo(x-h*0.1,T-h*0.2);c.lineTo(x+h*0.1,T-h*0.2);c.stroke();t=T-h*0.2;break;
    case 'ew':case 'com':/* 通信：階梯形 */box([[L,T],[L+w*0.5,T],[L+w*0.5,T+bh*0.4],[R,T+bh*0.4],[R,B],[L+w*0.12,B]]);break;
    case 'rec':/* 偵察：裝甲車形（圓車頭）與小旗 */var rr=bh*0.5;c.beginPath();c.moveTo(L+rr,T);c.lineTo(R,T);c.lineTo(R,B);c.lineTo(L,B);c.lineTo(L,T+rr);c.quadraticCurveTo(L,T,L+rr,T);c.closePath();c.fillStyle=W;c.fill();c.lineWidth=ech>=2?tk:lw;c.stroke();c.lineWidth=lw;
      c.beginPath();c.moveTo(R-w*0.18,T);c.lineTo(R-w*0.18,T-h*0.26);c.lineTo(R-w*0.02,T-h*0.2);c.lineTo(R-w*0.18,T-h*0.14);c.stroke();t=T-h*0.26;break;
    case 'at':/* 反裝甲砲：Ｔ形 */nb=true;c.lineWidth=sw;c.beginPath();c.moveTo(x,B);c.lineTo(x,T);c.moveTo(x-h*0.3,T);c.lineTo(x+h*0.3,T);c.stroke();c.lineWidth=lw;break;
    case 'art':case 'sge':/* 榴彈砲：直桿與Ｈ */nb=true;c.lineWidth=sw;c.beginPath();c.moveTo(x,B);c.lineTo(x,T);c.moveTo(x-h*0.1,y);c.lineTo(x+h*0.24,y);c.moveTo(x+h*0.24,y-h*0.16);c.lineTo(x+h*0.24,y+h*0.16);c.stroke();c.lineWidth=lw;break;
    case 'ad':/* 高射砲：箭頭立在小圓上 */nb=true;c.lineWidth=sw;c.beginPath();c.moveTo(x,B-h*0.12);c.lineTo(x,T+h*0.04);c.stroke();c.lineWidth=lw;c.beginPath();c.moveTo(x,T-h*0.08);c.lineTo(x-h*0.1,T+h*0.1);c.lineTo(x+h*0.1,T+h*0.1);c.closePath();c.fill();c.save();c.fillStyle=W;c.beginPath();c.arc(x,B-h*0.04,h*0.08,0,2*PI);c.fill();c.stroke();c.restore();t=T-h*0.08;b=B+h*0.04;break;
    case 'rkt':/* 火箭（煙幕）發射器：倒Ｙ */nb=true;c.lineWidth=sw;c.beginPath();c.moveTo(x,T);c.lineTo(x,y+h*0.04);c.lineTo(x-h*0.2,B);c.moveTo(x,y+h*0.04);c.lineTo(x+h*0.2,B);c.stroke();c.lineWidth=lw;break;
    default:box();var lt=DELT[sym];if(lt)txt(lt);}
  if(nb){if(mob==='wheel')t=Math.min(t,motZ(T-h*0.1));else if(mob==='track')b=track(B+1,0.2);}
  else if(mob==='wheel')b=wheels(b);else if(mob==='track'&&sym!=='arm')b=track(b+2);
  return {t:t-y,b:b-y};}
function deSym(c,o,x,y,h,aff){var col=deCol(o,aff),a=o.alpha===undefined?1:o.alpha,ech=o.ech!==undefined?o.ech:-1,r;c.save();c.globalAlpha=a;c.lineCap='butt';
  if(o.sel){c.beginPath();c.arc(x,y,h*1.05,0,2*PI);c.fillStyle='rgba(255,235,59,.45)';c.fill();}
  if(o.q===0||aff==='u'){var w=h*1.3,bh=h*0.62;c.setLineDash([3,2]);c.strokeStyle=DEC.u;c.lineWidth=Math.max(0.9,h/16);c.strokeRect(x-w/2,y-bh/2,w,bh);c.setLineDash([]);c.fillStyle=DEC.u;c.font='bold '+Math.round(h*0.5)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('?',x,y+1);r={t:-bh/2,b:bh/2};}
  else if(o.hq||o.sym==='hq'||ech>=3)r=deStaff(c,x,y,h,ech===1?1:Math.max(ech,2),o.fbr||'',col);
  else r=deShape(c,o,x,y,h,col);
  if(o.ms==='shaken'||o.ms==='rout'){c.strokeStyle=o.ms==='rout'?'#6D4C41':'#E0A100';c.lineWidth=Math.max(1,h/13);c.beginPath();c.moveTo(x-h*0.75,y+h*0.5);c.lineTo(x+h*0.75,y-h*0.5);c.setLineDash([3,2]);c.stroke();c.setLineDash([]);}
  c.restore();return r;}
var SPC={m:{},n:0,on:true},LTC={};
function lightC(col){return LTC[col]||(LTC[col]=lighten(col,0.62));}
function symBody(c,o,x,y,w,h,col,fill,dom,im,stc,aff){aff=aff||'f';var B=frameBox(w,h,dom,aff);framePath(c,x,y,w,h,dom,aff);c.fillStyle=fill;c.fill();if(im){c.save();framePath(c,x,y,w,h,dom,aff);c.clip();var r=Math.max(B.iw/im.width,B.ih/im.height);c.drawImage(im,x-im.width*r/2,y-im.height*r/2,im.width*r,im.height*r);c.restore();}
  c.lineWidth=Math.max(0.9,h/14);c.strokeStyle=stc;framePath(c,x,y,w,h,dom,aff);c.stroke();
  if(!im){c.save();framePath(c,x,y,w,h,dom,aff);c.clip();symIcon(c,o.q===0?'?':o.sym,x,y,B.iw,B.ih,'#1a1a1a');c.restore();}
  if(o.br==='abn'&&!im){/* 空降：框內下方的翼形 */c.save();framePath(c,x,y,w,h,dom,aff);c.clip();c.strokeStyle='#1a1a1a';c.lineWidth=Math.max(0.8,h/15);c.beginPath();c.arc(x-h*0.2,y+B.ih*0.42,h*0.2,PI*1.15,PI*1.85);c.arc(x+h*0.2,y+B.ih*0.42,h*0.2,PI*1.15,PI*1.85);c.stroke();c.restore();}
  if(o.mob)mobInd(c,o.mob,x,y+B.b,h,stc);if(o.fc)fcCorner(c,x,y,w,h,B,o.fc);
  if(o.ech!==undefined&&o.ech>=0&&ECH[o.ech]){c.font='bold '+Math.max(8,Math.round(h*0.48))+'px sans-serif';c.textAlign='center';c.textBaseline='bottom';c.fillStyle='#111';c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=3;var em=ECH[o.ech][2],ey=y+B.t-h*0.05;c.strokeText(em,x,ey);c.fillText(em,x,ey);}
  if(o.hq){var sx=x+B.l,sy=B.mid?y:y+B.b;c.strokeStyle='#111';c.lineWidth=Math.max(0.8,h/14);c.beginPath();c.moveTo(sx,sy);c.lineTo(sx,y+B.b+h*0.65);c.stroke();}}
function symSprite(o,w,h,col,fill,dom,im,stc,aff){var d=(typeof VW!=='undefined'&&VW.dpr)||1,hq=Math.round(h*4)/4,ech=o.ech!==undefined&&o.ech>=0&&ECH[o.ech]?o.ech:-1,key=(o.q===0?'?':o.sym)+'|'+dom+'|'+aff+'|'+col+'|'+fill+'|'+stc+'|'+hq+'|'+ech+'|'+(o.hq?1:0)+'|'+(o.mob||'')+'|'+(o.fc||'')+'|'+(o.br==='abn'?'A':'')+'|'+(im?o.img:'')+'|'+d,sp=SPC.m[key];if(sp)return sp;
  if(SPC.n>=900){SPC.m={};SPC.n=0;}var pad=Math.ceil(3+h*0.15),top=Math.ceil(h*1.3)+pad,Wc=Math.ceil(Math.max(w,h*1.6)+2*pad),Hc=top+Math.ceil(h*1.45)+pad,cv=mkCanvas(Math.ceil(Wc*d),Math.ceil(Hc*d)),c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);
  symBody(c,{q:o.q,sym:o.sym,ech:ech,hq:o.hq,mob:o.mob,fc:o.fc,br:o.br},Wc/2,top,w,h,col,fill,dom,im,stc,aff);sp={cv:cv,ox:Wc/2,oy:top,w:Wc,h:Hc};SPC.m[key]=sp;SPC.n++;return sp;}
/* 簡易圖形模式的符號：實心方塊（陸）、圓（空）、菱形（海），外框顏色表示士氣，不畫兵種圖形與圖片 */
function symSimple(c,o){var h=(o.h||16)*0.72,w=h*1.25,x=o.x,y=o.y,col=o.col||sideCol(o.side),dom=o.dom||'land',a=o.alpha===undefined?1:o.alpha;c.globalAlpha=a;
  if(o.sel){c.fillStyle='rgba(255,235,59,.5)';c.fillRect(x-w/2-4,y-h/2-4,w+8,h+8);}
  c.fillStyle=o.q===0?'#9E9E9E':col;c.strokeStyle=o.ms==='rout'?'#C62828':o.ms==='shaken'?'#FFB300':'#1a1a1a';c.lineWidth=o.ms&&o.ms!=='ok'?2:1;
  if(dom==='air'){c.beginPath();c.arc(x,y,h*0.55,0,2*PI);c.fill();c.stroke();}else if(dom==='sea'||dom==='sub'){c.beginPath();c.moveTo(x,y-h*0.62);c.lineTo(x+w*0.55,y);c.lineTo(x,y+h*0.62);c.lineTo(x-w*0.55,y);c.closePath();c.fill();c.stroke();}
  else{c.fillRect(x-w/2,y-h/2,w,h);c.strokeRect(x-w/2,y-h/2,w,h);}
  if(o.hq){c.fillStyle='#111';c.fillRect(x-w/2,y+h/2,1.5,h*0.5);}if(o.ech!==undefined&&o.ech>=3){c.fillStyle='#111';c.fillRect(x-w*0.3,y-h/2-3,w*0.6,1.5);}
  if(o.str!==undefined&&o.str<0.7){c.fillStyle=o.str>0.4?'#F9A825':'#E53935';c.fillRect(x-w/2,y+h/2+1,w*clamp(o.str,0,1),2);}
  var ly=y+h/2+4;if(o.bars&&o.bars.length&&o.sel){o.bars.forEach(function(q){c.fillStyle='rgba(0,0,0,.55)';c.fillRect(x-w/2,ly,w,2);c.fillStyle=q[2]?'#FF1744':q[1];c.fillRect(x-w/2,ly,w*clamp(q[0],0,1),2);ly+=3;});ly+=1;}
  if(o.lbl&&o.sel){c.font='11px sans-serif';c.textAlign='center';c.textBaseline='top';c.lineWidth=3;c.strokeStyle='rgba(255,255,255,.9)';c.fillStyle='#111';c.strokeText(o.lbl,x,ly);c.fillText(o.lbl,x,ly);}
  c.globalAlpha=1;}
/* 隊徽：右上角的小圓章（上傳的圖片，或依編制自動產生的幾何圖形與字） */
function insDraw(c,ins,x,y,r){if(!ins)return;c.save();if(typeof ins==='string'){var im=imgOf(ins);if(im){c.beginPath();c.arc(x,y,r,0,2*PI);c.save();c.clip();var k=Math.max(2*r/im.width,2*r/im.height);c.drawImage(im,x-im.width*k/2,y-im.height*k/2,im.width*k,im.height*k);c.restore();c.lineWidth=1;c.strokeStyle='#222';c.stroke();}c.restore();return;}
  c.fillStyle=ins.c||'#555';c.strokeStyle='#fff';c.lineWidth=1.2;c.beginPath();var s=ins.s;
  if(s===1){for(var i=0;i<5;i++){var a=-PI/2+i*PI*0.8;c.lineTo(x+Math.cos(a)*r*1.1,y+Math.sin(a)*r*1.1);}c.closePath();}
  else if(s===2){c.moveTo(x-r,y-r*0.85);c.lineTo(x+r,y-r*0.85);c.lineTo(x+r,y);c.quadraticCurveTo(x+r,y+r*0.8,x,y+r*1.05);c.quadraticCurveTo(x-r,y+r*0.8,x-r,y);c.closePath();}
  else if(s===3){c.moveTo(x,y-r*1.1);c.lineTo(x+r*1.1,y);c.lineTo(x,y+r*1.1);c.lineTo(x-r*1.1,y);c.closePath();}
  else if(s===4){for(var j=0;j<6;j++){var b=PI/6+j*PI/3;c.lineTo(x+Math.cos(b)*r*1.05,y+Math.sin(b)*r*1.05);}c.closePath();}
  else c.arc(x,y,r,0,2*PI);c.fill();c.stroke();if(ins.t&&s!==1){c.fillStyle='#fff';c.font='bold '+Math.round(r*1.15)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(ins.t,x,y+r*0.06);}c.restore();}
/* 旋轉後兵牌的上下緣：B 的四個角（右緣與左緣對稱，下緣用 bb）轉 rot 之後的最高、最低點 */
function rotB(B,bb,rot){var s=Math.sin(rot),co=Math.cos(rot),t=1e9,b=-1e9,X=[B.l,-B.l],Y=[B.t,bb];for(var i=0;i<2;i++)for(var j=0;j<2;j++){var v=X[i]*s+Y[j]*co;if(v<t)t=v;if(v>b)b=v;}return {t:t,b:b,l:B.l};}
/* o.rot：部隊的面向（弧度，東為 0）。一般部隊的兵牌整個轉向：北約、德式與上傳的兵牌以上緣為正面，華約式以圖形的右端為正面；司令部的旗、團以上畫成旗的部隊與明式的旗保持直立 */
function drawSym(c,o){if(typeof GFX!=='undefined'&&GFX.mode==='simple'&&!o.ico){symSimple(c,o);return;}var h=o.h||16,w=h*1.5,x=o.x,y=o.y,col=o.col||sideCol(o.side),aff=symAffOf(o),dom=o.dom||'land',a=o.alpha===undefined?1:o.alpha,B,sb=0;
  var ci=o.cimg?imgOf(o.cimg):null,st=symStd(),ech=o.ech!==undefined?o.ech:-1,flag=o.hq||o.sym==='hq'||((st==='de'||st==='wp')&&ech>=3),rot=o.rot!==undefined&&o.rot!==null&&!o.ico&&(ci||(st!=='ming'&&!flag))?o.rot+(st==='wp'&&!ci?0:PI/2):null;
  if(ci){/* 上傳的整張兵牌 */var ih=h*1.3,iw=Math.min(ih*ci.width/Math.max(1,ci.height),h*2.3);c.save();c.globalAlpha=a;if(o.sel){c.beginPath();c.arc(x,y,h*1.05,0,2*PI);c.fillStyle='rgba(255,235,59,.45)';c.fill();}c.save();c.translate(x,y);if(rot!==null)c.rotate(rot);c.drawImage(ci,-iw/2,-ih/2,iw,ih);
    if(o.ms==='shaken'||o.ms==='rout'){c.strokeStyle=o.ms==='rout'?'#C62828':'#E0A100';c.lineWidth=1.5;c.strokeRect(-iw/2-1,-ih/2-1,iw+2,ih+2);}c.restore();B={t:-ih/2,b:ih/2,l:-iw/2};if(rot!==null)B=rotB(B,B.b,rot);}
  else if(st==='ming'){var rm=msSym(c,o,x,y,h,aff);B={t:rm.t,b:rm.b,l:-w/2};c.save();c.globalAlpha=a;}
  else if(st==='de'){var rd;if(rot!==null){c.save();c.translate(x,y);c.rotate(rot);rd=deSym(c,o,0,0,h,aff);c.restore();B=rotB({t:rd.t,l:-h*0.65},rd.b,rot);}else{rd=deSym(c,o,x,y,h,aff);B={t:rd.t,b:rd.b,l:-w/2};}c.save();c.globalAlpha=a;}
  else if(st==='wp'){var r;if(rot!==null){c.save();c.translate(x,y);c.rotate(rot);r=wpSym(c,o,0,0,h,aff);c.restore();B=rotB({t:-h*0.4,l:-h*0.75},r.b,rot);}else{r=wpSym(c,o,x,y,h,aff);B={t:-h*0.6,b:r.b,l:-w/2};}c.save();c.globalAlpha=a;}
  else{var fill=o.q===0?AFFC.u:typeof UIP!=='undefined'&&UIP.symCol==='std'&&!(aff==='f'&&o.col)?AFFC[aff]:lightC(col);B=frameBox(w,h,dom,aff);c.save();c.globalAlpha=a;
    if(o.sel){c.beginPath();c.arc(x,y,h*1.05,0,2*PI);c.fillStyle='rgba(255,235,59,.45)';c.fill();c.lineWidth=1.5;c.strokeStyle='#FFC107';c.stroke();}
    var im=o.img?imgOf(o.img):null,stc=o.ms==='rout'?'#C62828':o.ms==='shaken'?'#E0A100':col;sb=mobH(o.mob,h);
    c.save();c.translate(x,y);if(rot!==null)c.rotate(rot);if(SPC.on&&!o.ico){var sp=symSprite(o,w,h,col,fill,dom,im,stc,aff);c.drawImage(sp.cv,-sp.ox,-sp.oy,sp.w,sp.h);}else symBody(c,o,0,0,w,h,col,fill,dom,im,stc,aff);
    if(o.ins&&h>=13)insDraw(c,o.ins,-B.l+h*0.08,B.t+h*0.12,h*0.27);if(o.ms==='rout'){c.strokeStyle='#C62828';c.lineWidth=1.6;c.beginPath();c.moveTo(-w/2-2,-h/2-2);c.lineTo(w/2+2,h/2+2);c.stroke();}c.restore();
    if(rot!==null){B=rotB(B,B.b+sb,rot);sb=0;}}
  var bY=0;if(o.str!==undefined){var bw=w,bh=Math.max(2,h*0.16),by=y+B.b+sb+2;c.fillStyle='rgba(0,0,0,.55)';c.fillRect(x-bw/2,by,bw,bh);c.fillStyle=o.str>0.7?'#43A047':o.str>0.4?'#F9A825':'#E53935';c.fillRect(x-bw/2,by,bw*clamp(o.str,0,1),bh);bY=bh+2;}
  /* 狀態條（士氣、恐懼、補給、疲勞）：[比例, 顏色, 危險, 疊在上面的第二個比例, 它的顏色]，危險的那條加紅框 */
  if(o.bars&&o.bars.length){var eh=Math.max(1.5,h*0.1),ey=y+B.b+sb+2+bY;o.bars.forEach(function(q){c.fillStyle='rgba(0,0,0,.55)';c.fillRect(x-w/2,ey,w,eh);c.fillStyle=q[1];c.fillRect(x-w/2,ey,w*clamp(q[0],0,1),eh);if(q[3]>0){c.fillStyle=q[4];c.fillRect(x-w/2,ey,w*clamp(q[3],0,1),eh);}if(q[2]){c.strokeStyle='#FF1744';c.lineWidth=1;c.strokeRect(x-w/2-0.5,ey-0.5,w+1,eh+1);}ey+=eh+1.5;});bY+=o.bars.length*(eh+1.5);}
  if(o.lbl){c.font=Math.max(9,Math.round(h*0.62))+'px sans-serif';c.textAlign='center';c.textBaseline='top';c.lineWidth=3;c.strokeStyle='rgba(255,255,255,.9)';c.fillStyle='#111';var ly=y+B.b+sb+(bY?bY+2:3);c.strokeText(o.lbl,x,ly);c.fillText(o.lbl,x,ly);}
  c.restore();}
/* 小圖示（DOM 用）：回傳 data URL，快取（依觀看者的立場與樣式） */
var ICOC={};
function symIco(sym,side,dom,ech,img,cimg){var aff=symAffOf({side:side}),key=sym+'|'+side+'|'+aff+'|'+symStd()+'|'+dom+'|'+ech+'|'+(img?img.length+img.slice(-24):'')+'|'+sideCol(side)+'|'+(cimg?cimg.length+cimg.slice(-24):'');if(ICOC[key])return ICOC[key];var ready=(!img||!!imgOf(img))&&(!cimg||!!imgOf(cimg)),cv=mkCanvas(44,30),c=cv.getContext('2d');drawSym(c,{x:22,y:symStd()==='ming'?17:16,h:symStd()==='nato'?18:cimg?17:14,sym:sym,dom:dom,side:side,img:img,cimg:cimg,ico:1,aff:aff});var url=cv.toDataURL();if(ready)ICOC[key]=url;return url;}
function uIco(u){var s=ST(u);return '<img class="lw-ico" alt="" src="'+symIco(u.sym||s.sym,u.side,s.dom,-1,unitImg(u),u.cimg||'')+'">';}
