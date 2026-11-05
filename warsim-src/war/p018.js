/* ===================== v8 介面：設施狀態、補給運輸與壅塞、平民與第三方的地圖圖示；點選面板與對平民的行動；新命令；設定（機制年份、核武當量）；後勤頁；畫面效果；說明 ===================== */
Object.assign(NODEI,{gas:'⛽',tank:'🛢',ammo:'💣',hosp:'✚',church:'⛪',camp:'🏕'});
function nodeIco(N){var k=N.sub&&NODEI[N.sub]?N.sub:N.only==='fuel'?'tank':N.only==='ammo'?'ammo':N.k;return NODEI[k]||'■';}
Object.assign(FACU,{gas:'佔領後成為燃料補給點（只供應燃料；存量用完不會再補）',tank:'佔領後成為燃料補給點，由車隊補充；中彈容易起火，被摧毀時油料爆炸、大火延燒數小時',ammo:'佔領後成為彈藥補給點；被摧毀時殉爆，危及附近的部隊與居民',
  hosp:'控制的一方用來收治傷兵；受戰爭法保護，攻擊醫院是戰爭罪行',church:'居民在此避難，教會團體提供庇護與飲食；受保護的宗教建築',camp:'收容難民；擁擠、缺糧時死亡率升高；受保護的平民設施'});
/* 開戰前預覽也包含 v8 的設施（與開戰時以相同規則產生） */
facList=function(){if(G.fac)return G.fac;if(!G.map)return [];var k=(G.set.y||0)+'|'+(G._mapv||0)+'|'+JSON.stringify(G.set.featY||{});if(!G._facP||G._facPk!==k){var L=facGen(G.map,G.set.y);try{facGen8(G.map,G.set.y||1943,L);}catch(e){}G._facP=L;G._facPk=k;}return G._facP;};
(function(){var b=facTip;facTip=function(F){var t=b(F),me=UI.side,mine=me<0||seeAll()||F.own===me;
  if(F.dead)t+='\n已被摧毀（'+durTxt(Math.max(0,G.t-F.dead))+'前）'+(F.lost&&lgSum(F.lost)>1?'，損失約 '+fmt(lgSum(F.lost))+' 噸物資':'')+(F.fire&&G.t<F.fire?'；大火仍在延燒':'');
  else{if(F.burn&&G.t<F.burn||F.fire&&G.t<F.fire)t+='\n起火燃燒中：存量逐漸燒毀，可能爆炸';if(mine&&F.hp!==undefined&&F.hp<99.5)t+='\n受損：完好度 '+fmt(F.hp)+'%';
    if(F.k==='hosp')t+='\n'+(F.beds?'病床約 '+fmt(F.beds)+'，':'')+'收治 '+fmt(F.occ||0)+' 人';
    if(F.k==='camp')t+='\n收容約 '+fmt(F.pop||0)+'／'+fmt(F.cap||5000)+' 人，存糧約 '+fx(F.food||0,1)+' 天'+(F.died>=1?'，已有約 '+fmt(F.died)+' 人死亡':'');
    var tn=G.started&&mine?facTNT(F):0;if(tn>200)t+='\n若被摧毀：約 '+(tn>=1000?fmt(tn/1000,1)+' 噸':fmt(tn)+' 公斤')+' TNT 當量的爆炸';}
  if(F.built)t+='\n'+(F.org?F.org+'設立':'工兵構築');return t;};})();

/* ---------- 地圖：設施狀態（起火、受損、已摧毀、收容人數），畫在補給節點之上 ---------- */
function drawFac8(c){if(!G.started||!G.fac)return;var me=UI.side,all=me<0||seeAll(),T=performance.now()/240;c.save();c.textAlign='center';c.textBaseline='alphabetic';
  G.fac.forEach(function(F){var p=w2s(F.x,F.y);if(p[0]<-30||p[1]<-30||p[0]>VW.cw+30||p[1]>VW.ch+30)return;
    if(F.burn&&G.t<F.burn||F.fire&&G.t<F.fire){var x=p[0]+11,y=p[1]-10,h=1+0.14*Math.sin(T+F.id);c.fillStyle='rgba(255,111,0,.92)';c.beginPath();c.moveTo(x,y-9*h);c.quadraticCurveTo(x+7,y-2,x,y+4);c.quadraticCurveTo(x-7,y-2,x,y-9*h);c.fill();c.fillStyle='rgba(255,213,79,.95)';c.beginPath();c.moveTo(x,y-4*h);c.quadraticCurveTo(x+3.5,y+0.5,x,y+3);c.quadraticCurveTo(x-3.5,y+0.5,x,y-4*h);c.fill();}
    if(F.dead){c.strokeStyle='rgba(33,33,33,.9)';c.lineWidth=2.5;c.beginPath();c.moveTo(p[0]-8,p[1]-8);c.lineTo(p[0]+8,p[1]+8);c.moveTo(p[0]+8,p[1]-8);c.lineTo(p[0]-8,p[1]+8);c.stroke();return;}
    if((all||F.own===me)&&F.hp!==undefined&&F.hp<99.5){var w=20,f=clamp(F.hp/100,0,1);c.fillStyle='rgba(0,0,0,.45)';c.fillRect(p[0]-w/2,p[1]+13,w,3);c.fillStyle=f>0.6?'#43A047':f>0.3?'#FB8C00':'#E53935';c.fillRect(p[0]-w/2,p[1]+13,w*f,3);}
    if(F.k==='camp'&&F.pop>=1&&VW.s>0.5)txtHalo(c,fmt(F.pop)+' 人'+((F.food||0)<1?'・缺糧':''),p[0],p[1]-15,'10px sans-serif',(F.food||0)<1?'#b3261e':'#5D4037');
    else if(F.k==='hosp'&&F.occ>=1&&VW.s>1&&(all||F.own===me))txtHalo(c,'收治 '+fmt(F.occ),p[0],p[1]-15,'10px sans-serif','#b3261e');});c.restore();}

/* ---------- 地圖：看得見的補給運輸、壅塞路段、選取的路線 ---------- */
function v8Seen(o,R){var me=UI.side;if(me<0||seeAll()||o.side===me)return true;if(!G._grid)return false;if(o._svT===G.t&&o._svR===R)return o._sv;var s=false;gridNear(o.x,o.y,R,function(u){if(!s&&u.side===me&&onMap(u)&&dist(u.x,u.y,o.x,o.y)<R)s=true;});o._svT=G.t;o._svR=R;o._sv=s;return s;}
function lgSeen(V){var D=LGM[V.m]||{};return v8Seen(V,D.dom==='sea'?15000:D.air?10000:3500);}
function lgIcon(c,V,x,y,col,f){var th=V.hd||0,m=V.m;c.save();c.translate(x,y);c.lineWidth=1;c.strokeStyle='rgba(15,15,20,.85)';c.fillStyle=col;
  if(m==='truck'||m==='wagon'){c.rotate(th);c.beginPath();c.rect(-6*f,-2.6*f,8.5*f,5.2*f);c.fill();c.stroke();c.fillStyle=m==='truck'?'#ECEFF1':'#8D6E63';c.beginPath();c.rect(2.5*f,-2.2*f,3*f,4.4*f);c.fill();c.stroke();}
  else if(m==='porter'){for(var i=-1;i<=1;i++){c.beginPath();c.arc(i*3.6*f,0,1.8*f,0,2*PI);c.fill();c.stroke();}}
  else if(m==='rail'){c.rotate(th);for(var j=0;j<4;j++){c.fillStyle=j===0?'#37474F':col;c.beginPath();c.rect((-j*6.5+0.5)*f,-2.3*f,5.8*f,4.6*f);c.fill();c.stroke();}}
  else if(m==='ship'){c.rotate(th);c.beginPath();c.moveTo(8*f,0);c.lineTo(4*f,-3*f);c.lineTo(-7*f,-3*f);c.lineTo(-7*f,3*f);c.lineTo(4*f,3*f);c.closePath();c.fill();c.stroke();c.fillStyle='#ECEFF1';c.fillRect(-4*f,-1.4*f,4*f,2.8*f);}
  else{planePath(c,m==='heli'?'heli':lgY()<1950?'bomber':'jbomb',0,0,th,(m==='heli'?15:18)*f);c.fill();c.stroke();}
  c.restore();
  if(V.ph==='hold'||V.ph==='wait'){c.fillStyle=V.ph==='hold'?'#C62828':'#E65100';c.font='bold 11px sans-serif';c.textAlign='center';c.textBaseline='alphabetic';c.fillText(V.ph==='hold'?'!':'…',x+8*f,y-6*f);}
  else if(V.ph==='load'||V.ph==='unl'){c.fillStyle='#8D6E63';c.strokeStyle='#fff';c.lineWidth=1;c.fillRect(x+5*f,y-8*f,4.5*f,4.5*f);c.strokeRect(x+5*f,y-8*f,4.5*f,4.5*f);}}
function drawLg(c){if(!G.started||!G.lgv||!G.lgv.length)return;var me=UI.side,all=me<0||seeAll(),S=VW.s,MP=G.map,L=G.lgv,sel=UI.selX&&UI.selX.k==='lgv'?UI.selX.id:0;c.save();
  /* 壅塞路段改由道路承載模組（drawTrf）統一畫出：車隊、行軍部隊與難民一起計算 */
  var f=clamp(0.8+S*0.07,0.85,1.3);
  L.forEach(function(V){if(V.ph==='dead'||V.ph==='gone')return;if(!all&&V.side!==me&&!lgSeen(V))return;var p=w2s(V.x,V.y),on=p[0]>-30&&p[1]>-30&&p[0]<VW.cw+30&&p[1]<VW.ch+30;
    if(V.id===sel&&V.pts&&(all||V.side===me)){c.strokeStyle=sideCol(V.side);c.globalAlpha=0.65;c.lineWidth=2;c.setLineDash([6,5]);c.beginPath();c.moveTo(p[0],p[1]);for(var i=V.pi;i<V.pts.length;i+=2){var q2=w2s(V.pts[i],V.pts[i+1]);c.lineTo(q2[0],q2[1]);}c.stroke();c.setLineDash([]);c.globalAlpha=1;}
    if(!on)return;lgIcon(c,V,p[0],p[1],sideCol(V.side),f);if(S>2.2&&V.n>1)txtHalo(c,'×'+V.n,p[0],p[1]+11*f,'9px sans-serif','#37474F');V._sx=p[0];V._sy=p[1];});c.restore();}
(function(){var b=drawNodes;drawNodes=function(c){b(c);try{drawFac8(c);drawLg(c);}catch(e){if(window.console)console.warn('v8',e);}};})();

/* ---------- 地圖：平民（聚落居民、難民、被拘留者）、援助團體、教會團體、戰地記者 ---------- */
function civCol(a){return a>=25?'#2E7D32':a<=-25?'#C62828':'#757575';}
function attTxt(a){return a>=60?'熱烈支持':a>=25?'友善':a>-25?'觀望':a>-60?'不滿':'敵視';}
function civGlyph(c,x,y,r,col){c.fillStyle=col;c.strokeStyle='rgba(255,255,255,.95)';c.lineWidth=1;[[0,-0.14],[-0.55,0.16],[0.55,0.16]].forEach(function(q){var cx=x+q[0]*r,cy=y+q[1]*r;c.beginPath();c.arc(cx,cy-r*0.36,r*0.3,0,2*PI);c.fill();c.stroke();c.beginPath();c.moveTo(cx-r*0.46,cy+r*0.42);c.arc(cx,cy+r*0.42,r*0.46,PI,2*PI);c.closePath();c.fill();c.stroke();});}
/* 人形圖示預先畫成小圖（依顏色、大小、螢幕解析度快取），每一畫格只貼圖 */var CIVSPR={};
function civSpr(col,r){var d=VW.dpr||1,k=col+'|'+r+'|'+d,c=CIVSPR[k];if(c)return c;var sz=Math.ceil(r*2.4+4);c=document.createElement('canvas');c.width=Math.ceil(sz*d);c.height=Math.ceil(sz*d);var x=c.getContext('2d');x.scale(d,d);civGlyph(x,sz/2,sz/2,r,col);c._s=sz;CIVSPR[k]=c;return c;}
function drawCiv8(c){var C=G.civ;if(!C||!G.started)return;var me=UI.side,S=VW.s,ms=me>=0?me:0;c.save();c.textAlign='center';c.textBaseline='middle';
  if(S>=0.6)C.S.forEach(function(g){var pres=civPresent(g);if(pres<(S<1.2?300:30))return;var p=w2s(g.x,g.y),x=p[0]-14,y=p[1]+13;if(x<-30||y<-30||x>VW.cw+30||y>VW.ch+30)return;var a=g.att?g.att[ms]:0,r=clamp(Math.sqrt(pres)/6,6,11);
    var sp=civSpr(me<0?'#616161':civCol(a),Math.round(r));c.drawImage(sp,x-sp._s/2,y-sp._s/2,sp._s,sp._s);if(S>=1.4)txtHalo(c,fmt(pres),x,y+r+8,'9px sans-serif','#37474F');g._sx=x;g._sy=y;});
  C.R.forEach(function(Q){if(Q.st!=='go'&&Q.st!=='stop'&&Q.st!=='trap')return;if(!v8Seen(Q,3000))return;var p=w2s(Q.x,Q.y);if(p[0]<-20||p[1]<-20||p[0]>VW.cw+20||p[1]>VW.ch+20)return;
    if(Q.st==='trap'){var r=clamp(Math.sqrt(Q.n)/6,3,9);c.fillStyle='rgba(183,28,28,.88)';c.strokeStyle='#fff';c.lineWidth=1.2;c.beginPath();c.arc(p[0],p[1],r+1,0,2*PI);c.fill();c.stroke();c.fillStyle='#fff';c.font='bold '+Math.round(r*1.2+4)+'px sans-serif';c.fillText('困',p[0],p[1]+0.5);}Q._sx=p[0];Q._sy=p[1];});
  (C.D||[]).forEach(function(D){if(D.st!=='held'&&D.st!=='move'||D.n<1)return;if(!v8Seen(D,4000))return;var p=w2s(D.x,D.y);if(p[0]<-20||p[1]<-20||p[0]>VW.cw+20||p[1]>VW.ch+20)return;
    c.fillStyle=D.kind==='intern'?'rgba(97,97,97,.94)':'rgba(158,158,158,.94)';c.strokeStyle=sideCol(D.side);c.lineWidth=2;c.fillRect(p[0]-8,p[1]-7,16,14);c.strokeRect(p[0]-8,p[1]-7,16,14);c.fillStyle='#fff';c.font='bold 10px sans-serif';c.fillText('拘',p[0],p[1]+0.5);if(S>=1.2)txtHalo(c,fmt(D.n),p[0],p[1]+15,'9px sans-serif','#424242');D._sx=p[0];D._sy=p[1];});
  (G.tp||[]).forEach(function(A){if(A.st==='dead'||A.st==='gone')return;var p=w2s(A.x,A.y);if(p[0]<-20||p[1]<-20||p[0]>VW.cw+20||p[1]>VW.ch+20)return;c.lineWidth=1.5;
    if(A.k==='aid'){c.fillStyle='#fff';c.strokeStyle='#1565C0';c.beginPath();c.arc(p[0],p[1],7,0,2*PI);c.fill();c.stroke();c.fillStyle='#D32F2F';c.fillRect(p[0]-1.4,p[1]-4.5,2.8,9);c.fillRect(p[0]-4.5,p[1]-1.4,9,2.8);}
    else{c.fillStyle='#6A1B9A';c.strokeStyle='#fff';c.beginPath();c.arc(p[0],p[1],6.5,0,2*PI);c.fill();c.stroke();c.fillStyle='#fff';c.fillRect(p[0]-0.9,p[1]-4,1.8,8);c.fillRect(p[0]-3,p[1]-2,6,1.6);}
    if(A.st==='wait'){c.fillStyle='#E65100';c.font='bold 10px sans-serif';c.fillText('…',p[0]+10,p[1]-6);}A._sx=p[0];A._sy=p[1];});
  /* 戰地記者：跟在隨行的部隊旁邊（只看得到隨行本方的記者） */if(G.press&&S>=0.5)G.press.R.forEach(function(R,i){if(R.st!=='ok'&&R.st!=='wia')return;if(me>=0&&!seeAll()&&R.host!==me)return;var p=w2s(R.x,R.y),x=p[0]+17+(i%3)*4,y=p[1]-17-(i%2)*5;if(x<-20||y<-20||x>VW.cw+20||y>VW.ch+20)return;
    c.fillStyle=R.st==='wia'?'#9E9E9E':'#37474F';c.strokeStyle='#fff';c.lineWidth=1;c.fillRect(x-5,y-3.5,10,7);c.strokeRect(x-5,y-3.5,10,7);c.fillStyle='#B0BEC5';c.beginPath();c.arc(x,y,2.2,0,2*PI);c.fill();c.fillStyle=R.side<0?'#FFC107':sideCol(R.side);c.fillRect(x-5,y-5.6,3.5,2);R._sx=x;R._sy=y;});
  c.restore();}
(function(){var b=drawCiv;drawCiv=function(c){b(c);try{drawCiv8(c);}catch(e){if(window.console)console.warn('v8',e);}};})();
/* 每一畫格先清除上一格的螢幕位置（沒有畫出來的東西不能被點到），最後畫出選取框 */
function v8Clear(){if(!G)return;var z=function(o){o._sx=undefined;};(G.lgv||[]).forEach(z);(G.tp||[]).forEach(z);if(G.press)G.press.R.forEach(z);if(G.civ){G.civ.S.forEach(z);G.civ.R.forEach(z);(G.civ.D||[]).forEach(z);}(G.fac||[]).forEach(z);if(G.sides)G.sides.forEach(function(S){(S.nodes||[]).forEach(z);});}
function v8Ring(){var X=UI.selX;if(!X||UI.tab!=='battle')return;var o=v8Get(X);if(!o||o._sx===undefined)return;var c=VW.ct.getContext('2d');c.save();c.strokeStyle='#FFC107';c.lineWidth=2.5;c.setLineDash([5,3]);c.beginPath();c.arc(o._sx,o._sy,14,0,2*PI);c.stroke();c.setLineDash([]);c.restore();}
(function(){var b=drawTop;drawTop=function(){v8Clear();b();try{v8Ring();}catch(e){}};})();

/* ---------- 點選：車隊、援助與教會團體、記者、被拘留者、難民、聚落居民、設施 ---------- */
function hitV8(sx,sy){var best=null,bd=1e9;function t(o,k,r){if(!o||o._sx===undefined)return;var d=dist(sx,sy,o._sx,o._sy);if(d<r&&d<bd){bd=d;best={k:k,o:o};}}
  (G.lgv||[]).forEach(function(V){t(V,'lgv',11);});(G.tp||[]).forEach(function(A){t(A,'tp',10);});if(G.press)G.press.R.forEach(function(R){t(R,'rep',8);});
  if(G.civ){(G.civ.D||[]).forEach(function(D){t(D,'D',11);});G.civ.R.forEach(function(Q){t(Q,'R',11);});G.civ.S.forEach(function(g){t(g,'S',11);});}
  facList().forEach(function(F){t(F,'fac',12);});
  /* 已佔領、改畫成補給節點的設施：點節點也打開設施面板 */if(!best||bd>6)SIDES().forEach(function(s){(G.sides[s].nodes||[]).forEach(function(N){if(!N.fac||N._sx===undefined)return;var d=dist(sx,sy,N._sx,N._sy);if(d<13&&d<bd){var F=facById(N.fac);if(F){bd=d;best={k:'fac',o:F};}}});});return best;}
function v8Id(k,o){return k==='S'?o.i:o.id;}
function v8Get(X){if(!X||!G)return null;var C=G.civ,k=X.k,id=X.id,f=function(L){return (L||[]).filter(function(o){return o.id===id;})[0]||null;};
  if(k==='S')return C&&C.S[id]||null;if(k==='R')return C?f(C.R):null;if(k==='D')return C?f(C.D):null;if(k==='tp')return f(G.tp);if(k==='rep')return G.press?f(G.press.R):null;if(k==='lgv')return lgById(id);if(k==='fac')return f(facList());return null;}
function facPick(x,y,k){var b=null,bd=2500;(G.fac||[]).forEach(function(F){if(k==='facdemo'?F.dead:!(F.dead||F.hp<99.5))return;var d=dist(F.x,F.y,x,y);if(d<bd){bd=d;b=F;}});return b;}
(function(){var b=btClick;btClick=function(x,y,sx,sy,e){
  if(UI.tool==='ord'&&UI.ord&&(UI.ord.k==='facdemo'||UI.ord.k==='repair')){var F=facPick(x,y,UI.ord.k);if(!F){toast(UI.ord.k==='facdemo'?'點選處附近沒有可以爆破的設施。':'點選處附近沒有需要修復的設施。');return;}issueSel(UI.ord.k,F.x,F.y,{fac:F.id});return;}
  if((UI.tool==='sel'||!UI.tool)&&G.started&&!hitAt(sx,sy)&&!hitBattle(sx,sy)){var h=hitV8(sx,sy);if(h){var me=mySide(),us=UI.sel.map(uById).filter(function(u){return u&&alive(u)&&(me===null||u.side===me);});if(us.length)UI.selPrev=us.map(function(u){return u.id;});
      UI.selX={k:h.k,id:v8Id(h.k,h.o)};UI.sel=[];UI.selC=0;UI.selB=0;btSel();btLeft(true);vDraw(false);return;}}
  UI.selX=null;return b(x,y,sx,sy,e);};})();
(function(){var b=cellTip;cellTip=function(x,y){if(G&&G.started&&VW.cw){var p=w2s(x,y),h=hitV8(p[0],p[1]);if(h&&h.k!=='fac')return v8Tip(h.k,h.o);}return b(x,y);};})();
var TPST={go:'前往救援地點',work:'救援中',wait:'因附近交戰暫停行動',out:'撤出戰區',dead:'已撤離',gone:'已撤離'};
function v8Tip(k,o){var me=UI.side;if(k==='S'){var a=o.att||[0,0];return o.n+'的居民：約 '+fmt(civPresent(o))+' 人'+(me>=0?'\n對本方：'+attTxt(a[me])+'（'+fmt(a[me])+'）':'\n民心：'+G.sides[0].name+' '+fmt(a[0])+'、'+G.sides[1].name+' '+fmt(a[1]))+(o.hung>=40?'\n飢餓 '+fmt(o.hung):'')+'\n點選可查看詳情、下令對平民的行動';}
  if(k==='R')return '難民隊伍：約 '+fmt(o.n)+' 人'+(o.fn?'（來自'+o.fn+'）':'')+'\n'+(({go:'移動中',stop:'受阻停下',trap:'受困'})[o.st]||'')+'\n點選可查看詳情、引導或救助';
  if(k==='D')return '被'+G.sides[o.side].name+'拘留的平民：約 '+fmt(o.n)+' 人'+(o.kind==='intern'?'（強制拘禁）':'')+(o.dead>=1?'\n已有約 '+fmt(o.dead)+' 人死亡':'');
  if(k==='lgv')return LGM[o.m].n+'（'+G.sides[o.side].name+'）'+(me<0||o.side===me||seeAll()?'：'+o.n+' '+LGM[o.m].u+'，'+(LGPH[o.ph]||'')+(lgCargo(o)>0.05?'，載運 '+fx(lgCargo(o),1)+' 噸':''):'');
  if(k==='tp')return (o.k==='aid'?o.org+'救援隊':o.org)+'\n'+(TPST[o.st]||'');if(k==='rep')return '戰地記者 '+o.nm+'（'+o.org+'）';return '';}

/* ---------- 右欄面板 ---------- */
function kv(a,b){return '<span>'+a+'</span><span>'+b+'</span>';}
function v8H(t){return '<h3 style="margin:0 0 6px;font-size:14px">'+t+'</h3>';}
function v8Panel(X){var o=v8Get(X);if(!o)return null;var k=X.k;return k==='S'?civPanelS(o):k==='R'?civPanelR(o):k==='D'?civPanelD(o):k==='fac'?facPanel8(o):k==='lgv'?lgPanel(o):k==='tp'?tpPanel(o):k==='rep'?repPanel(o):null;}
(function(){var b=btStatus;btStatus=function(){if(UI.sel.length||UI.selC||UI.selB)UI.selX=null;var el=btEl('bst');if(UI.selX&&el){var a=document.activeElement;if(a&&el.contains(a)&&/SELECT|INPUT/.test(a.tagName))return;var h=v8Panel(UI.selX);if(h!==null){if(el._v8h!==h){el.innerHTML=h;el._v8h=h;}return;}UI.selX=null;}if(el)el._v8h='';b();
  var u=UI.sel.length===1?uById(UI.sel[0]):null;if(el&&u&&u.refit&&u.st==='off')el.innerHTML=el.innerHTML.replace('增援（尚未抵達）','撤出地圖休整中（'+durTxt(G.t-u.refit.t0)+'）');};})();
function civPanelS(g){var p=civPresent(g),me=mySide(),a=g.att||[0,0],dd=g.dead?g.dead.m+g.dead.w+g.dead.k+g.dead.e:0,o=v8H('👥 '+esc(g.n)+'的居民')+'<div class="lw-kv">';
  o+=kv('在地人口',fmt(p)+' 人（成年男性 '+fmt(g.men)+'、女性 '+fmt(g.wom)+'、兒童 '+fmt(g.kid)+'、老人 '+fmt(g.eld)+'）');
  o+=kv('戰前',fmt(g.pop0)+' 人；開戰前撤離 '+fmt(g.evac)+(g.fled>=1?'、戰時逃離 '+fmt(g.fled):'')+(g.camp>=1?'、進入收容所 '+fmt(g.camp):''));
  if(dd>=1||g.wnd>=1)o+=kv('傷亡','<b style="color:#b3261e">死亡約 '+fmt(dd)+' 人</b>、受傷約 '+fmt(g.wnd||0)+' 人');
  o+=kv('處境','飢餓 '+fmt(g.hung)+'、不安 '+fmt(g.unrest)+'、存糧約 '+fx(g.food||0,1)+' 天'+(g.shel>0.05?'、避難 '+pct(g.shel*100):'')+(G.t-g.hitT<6*3600?'；<b style="color:#b3261e">'+durTxt(G.t-g.hitT)+'前遭砲火波及</b>':''));
  o+=kv('控制',g.occ>=0?esc(G.sides[g.occ].name)+'佔領':'未被佔領'+(g.loy>=0?'（居民原本傾向'+esc(G.sides[g.loy].name)+'）':''));
  o+=kv('民心',SIDES().filter(function(s){return me===null||s===me;}).map(function(s){return '<span style="color:'+G.sides[s].color+'">'+esc(G.sides[s].name)+'</span>：'+attTxt(a[s])+'（'+fmt(a[s])+'）';}).join('；'));
  var tp=(G.tp||[]).filter(function(A){return A.st!=='dead'&&A.st!=='gone'&&(A.k==='church'&&A.g===g.i||A.tg&&A.tg.k==='S'&&A.tg.id===g.i);});if(tp.length)o+=kv('救援',tp.map(function(A){return esc(A.org)+(A.k==='aid'?'救援隊':'');}).join('、'));
  o+='</div><div class="lw-note">支持某一方的居民會向它通報敵情；敵視的居民掩護游擊隊、襲擊補給車隊。傷亡、佔領、徵用與部隊的作為都會改變民心。</div>';
  return o+civActHtml(g,'S',['guide','aid','give','detain','intern','fire']);}
function civPanelR(Q){var C=G.civ,g=C.S[Q.from],F=Q.campF?facById(Q.campF):null,o=v8H('🚶 難民隊伍')+'<div class="lw-kv">';
  o+=kv('人數',fmt(Q.n)+' 人（成年男性 '+fmt(Q.m)+'、女性 '+fmt(Q.w)+'、兒童 '+fmt(Q.k)+'、老人 '+fmt(Q.e)+'）');o+=kv('來自',esc(Q.fn||(g?g.n:'')));
  o+=kv('狀態',(({go:'移動中',stop:'受阻停下',trap:'<b style="color:#b3261e">受困：無路可走</b>'})[Q.st]||Q.st)+(Q.side>=0?'，逃往'+esc(G.sides[Q.side].name)+'控制區':''));
  o+=kv('目的地',F?'「'+esc(F.name)+'」':Q.dest?esc(placeTxt(Q.dest[0],Q.dest[1])):'不明');o+=kv('存糧',Q.food>0?'約 '+fx(Q.food,1)+' 天':'<b style="color:#b3261e">已經斷糧</b>');
  if(Q.dead>=1||Q.wnd>=1)o+=kv('途中傷亡','死亡約 '+fmt(Q.dead||0)+'、受傷約 '+fmt(Q.wnd||0));
  o+='</div><div class="lw-note">難民走在道路上會阻礙部隊與補給車隊；被困在交戰區的難民最容易傷亡。引導可以把他們帶到收容所或後方。</div>';return o+civActHtml(Q,'R',['guide','aid','give','detain','intern','fire']);}
function civPanelD(D){var me=mySide(),o=v8H('⛓ 被拘留的平民')+'<div class="lw-kv">';o+=kv('拘留者',esc(G.sides[D.side].name)+(D.kind==='intern'?'（<b style="color:#b3261e">強制拘禁</b>）':'（拘留審查）'));
  o+=kv('人數',fmt(D.n)+' 人（成年男性 '+fmt(D.m)+'、女性 '+fmt(D.w)+'、兒童 '+fmt(D.k)+'、老人 '+fmt(D.e)+'）');o+=kv('來自',esc(D.fn||''));
  o+=kv('時間',durTxt(G.t-D.t0)+'前起'+(D.rel?'，預計 '+durTxt(Math.max(0,D.rel-G.t))+'後釋放':'，沒有釋放期限'));o+=kv('存糧','約 '+fx(D.food||0,1)+' 天');if(D.dead>=0.5)o+=kv('死亡','<b style="color:#b3261e">約 '+fmt(D.dead)+' 人</b>');
  o+='</div><div class="lw-note">被拘留者擠在臨時營地裡：缺糧、擁擠與疾病會造成死亡，嚴厲的政策下死亡更多。援助團體會來探視並記錄拘禁狀況。</div>';
  return o+((me===null||D.side===me)?civActHtml(D,'D',['release','give','aid','fire']):'');}
/* 執行單位：先選取部隊再點選平民，就由選取的部隊執行；否則列出附近的地面部隊 */
function civActors(T,t){var me=mySide(),need=t==='D'?T.side:null,ok=function(u){return u&&alive(u)&&isLeaf(u)&&onMap(u)&&!u.irr&&ST(u).dom==='land'&&(me===null||u.side===me)&&(need===null||u.side===need)&&u.st!=='ship';};
  var P=(UI.selPrev||[]).map(uById).reduce(function(a,u){if(!u)return a;(isLeaf(u)?[u]:leavesOf(u)).forEach(function(q){if(ok(q)&&a.indexOf(q)<0)a.push(q);});return a;},[]);
  if(P.length)return P.sort(function(a,b){return dist(a.x,a.y,T.x,T.y)-dist(b.x,b.y,T.x,T.y);}).slice(0,12);
  var L=[];G.units.forEach(function(u){if(!ok(u))return;var d=dist(u.x,u.y,T.x,T.y);if(d<20000)L.push([d,u]);});L.sort(function(a,b){return a[0]-b[0];});return L.slice(0,10).map(function(q){return q[1];});}
function civActHtml(T,t,acts){if(!G.started)return '';var A=civActors(T,t);if(!A.length)return '<div class="lw-note" style="margin-top:8px">附近 20 公里內沒有可以執行的'+(mySide()===null?'':'本方')+'地面部隊。也可以先選取部隊再點選平民，指定由哪個單位執行。</div>';
  var cur=A.filter(function(u){return u.id===UI.v8u;})[0]||A[0];UI.v8u=cur.id;
  var o='<h4 style="margin:10px 0 4px;font-size:13px">對平民的行動</h4><div class="lw-opt"><span>執行單位</span><select data-c="v8u">'+A.map(function(u){return '<option value="'+u.id+'"'+(u===cur?' selected':'')+'>'+esc(uName(u))+'（'+kmTxt(dist(u.x,u.y,T.x,T.y))+'）</option>';}).join('')+'</select></div><div class="lw-ob">';
  acts.forEach(function(a){var q=CIVA[a];o+='<button type="button" data-a="v8civ" data-v="'+a+'"'+(q[2]?' class="dng"':'')+' title="'+esc(q[3])+'">'+(q[2]?'⚠ ':'')+q[0]+'</button>';});
  return o+'</div><div class="lw-note">'+acts.map(function(a){return '<b>'+CIVA[a][0]+'</b>：'+esc(CIVA[a][3]);}).join('<br>')+'</div>';}
CHG.v8u=function(t){UI.v8u=+t.value;};
function civWarn(a,T,t,u){var n=t==='S'?civPresent(T):T.n,who=t==='S'?T.n+'的居民':t==='R'?'難民隊伍':'被拘留的平民';
  return (a==='fire'?'向'+who+'（約 '+fmt(n)+' 人）開火是屠殺平民，是最嚴重的戰爭罪行之一。':'把'+who+'（約 '+fmt(t==='S'?n*0.5:n*0.9)+' 人，包括婦女、兒童與老人）強制拘禁是集體懲罰與任意拘禁'+(featOn('hague')?'，違反戰爭法':'')+'；被拘禁者會因擁擠、缺糧與疾病死亡。')+
    '\n\n後果：平民死傷；居民與周邊地區轉為敵視、支持游擊隊；記者與援助團體會揭露；部隊士氣與軍紀下降；戰後總結會列出下令者與執行部隊。守法的部隊可能拒絕執行。\n\n確定要命令「'+uName(u)+'」執行嗎？';}
ACT.v8civ=function(b){var a=b.getAttribute('data-v'),X=UI.selX,T=v8Get(X);if(!T||!G.started||!CIVA[a]){toast('對象已經不在。');return;}var A=civActors(T,X.k),u=A.filter(function(q){return q.id===UI.v8u;})[0]||A[0];if(!u){toast('附近沒有可以執行的部隊。');return;}
  if(CIVA[a][2]&&typeof confirm==='function'&&!confirm(civWarn(a,T,X.k,u)))return;
  var r=issue(u,'civ',{x:T.x,y:T.y,opt:{tg:X.k,id:v8Id(X.k,T),act:a}});toast('已命令'+uName(u)+'：'+CIVA[a][0]+(r&&r.sec>0?'（約 '+durTxt(r.sec)+' 後送達）':''));vDraw(false);btLeft(true);};
function facPanel8(F){var me=mySide(),v=facView(F),mine=me===null||seeAll()||F.own===me,prot=F.k==='hosp'||F.k==='church'||F.k==='camp',o=v8H((NODEI[F.k]||'')+' '+FACN[F.k]+'「'+esc(F.name)+'」')+'<div class="lw-kv">';
  o+=kv('控制',v<0?'中立（尚未被佔領）':esc(G.sides[v].name)+(F.own===v||mine?'':'（最後確認）'))+kv('位置',esc(placeTxt(F.x,F.y)));
  if(F.dead)o+=kv('狀態','<b style="color:#b3261e">已摧毀</b>（'+durTxt(Math.max(0,G.t-F.dead))+'前）'+(F.lost&&lgSum(F.lost)>1?'，損失約 '+fmt(lgSum(F.lost))+' 噸物資':'')+(F.fire&&G.t<F.fire?'；大火延燒中':''));
  else o+=kv('狀態',(F.burn&&G.t<F.burn?'<b style="color:#E65100">起火燃燒</b>；':'')+'完好度 '+(mine?fmt(F.hp===undefined?100:F.hp)+'%':'不明'));
  if(mine&&!F.dead&&!prot){var st=G.started?facSt(F):F.st0||{},S2=LCLS.filter(function(c){return (st[c]||0)>=0.5;});if(S2.length)o+=kv('存量',S2.map(function(c){return LCN[c]+' '+fmt(st[c],1)+' 噸';}).join('、'));var tn=G.started?facTNT(F):0;if(tn>200)o+=kv('爆炸當量','被摧毀時約 '+(tn>=1000?fmt(tn/1000,1)+' 噸':fmt(tn)+' 公斤')+' TNT');}
  if(F.k==='hosp')o+=kv('醫療',(F.beds?'病床約 '+fmt(F.beds)+'，':'')+'收治 '+fmt(F.occ||0)+' 人'+(F.field?'（野戰醫院）':''));
  if(F.k==='camp')o+=kv('收容','約 '+fmt(F.pop||0)+'／'+fmt(F.cap||5000)+' 人，存糧約 '+fx(F.food||0,1)+' 天'+(F.died>=1?'；已有約 '+fmt(F.died)+' 人死亡':'')+(F.org?'（'+esc(F.org)+'）':''));
  if(prot)o+=kv('保護',featOn(F.k==='hosp'?'gc1864':'hague')?'受戰爭法保護：攻擊它是戰爭罪行':'這個年代還沒有國際公約明文保護');
  o+='</div><div class="lw-note">'+esc(FACU[F.k]||'')+'</div>';if(!G.started)return o;
  var acts=[];if(!F.dead&&!prot)acts.push(['facdemo','爆破（拒止敵軍使用）']);if((F.dead||F.hp<99.5)&&(F.own<0||me===null||F.own===me))acts.push(['repair','修復']);if(!acts.length)return o;
  var L=[];G.units.forEach(function(u){if(!isLeaf(u)||!alive(u)||!onMap(u)||u.irr||ST(u).dom!=='land'||(me!==null&&u.side!==me))return;var d=dist(u.x,u.y,F.x,F.y);if(d<30000)L.push([d+(isEng(u)?0:5000),u]);});L.sort(function(a,b){return a[0]-b[0];});L=L.slice(0,10).map(function(q){return q[1];});
  if(!L.length)return o+'<div class="lw-note">附近 30 公里內沒有可以執行的地面部隊。</div>';var cur=L.filter(function(u){return u.id===UI.v8u;})[0]||L[0];UI.v8u=cur.id;
  return o+'<h4 style="margin:10px 0 4px;font-size:13px">工兵作業</h4><div class="lw-opt"><span>執行單位</span><select data-c="v8u">'+L.map(function(u){return '<option value="'+u.id+'"'+(u===cur?' selected':'')+'>'+esc(uName(u))+(isEng(u)?'（工兵）':'')+'（'+kmTxt(dist(u.x,u.y,F.x,F.y))+'）</option>';}).join('')+'</select></div><div class="lw-row">'+acts.map(function(q){return '<button type="button" class="lw-btn sm'+(q[0]==='facdemo'?' dng':'')+'" data-a="v8fac" data-v="'+q[0]+'">'+q[1]+'</button>';}).join('')+'</div><div class="lw-note">爆破由工兵執行約半小時，其他部隊約一小時；修復只有工兵能做，被摧毀的設施需要數小時。</div>';}
ACT.v8fac=function(b){var k=b.getAttribute('data-v'),F=v8Get(UI.selX),u=uById(UI.v8u);if(!F||!u){toast('找不到設施或執行單位。');return;}if(k==='repair'&&!isEng(u)){toast('只有工兵能修復設施。');return;}
  if(k==='facdemo'&&typeof confirm==='function'){var tn=facTNT(F);if(!confirm('爆破'+FACN[F.k]+'「'+F.name+'」？設施與裡面的存量將全部損毀'+(tn>200?'，存放的彈藥或油料會引發爆炸（約 '+(tn>=1000?fmt(tn/1000,1)+' 噸':fmt(tn)+' 公斤')+' TNT 當量），附近的人員要先撤離':'')+'。'))return;}
  var r=issue(u,k,{x:F.x,y:F.y,fac:F.id});toast('已命令'+uName(u)+(k==='facdemo'?'爆破':'修復')+'「'+F.name+'」'+(r&&r.sec>0?'（約 '+durTxt(r.sec)+' 後送達）':''));vDraw(false);};
function lgEpName(e){if(!e)return '—';if(e.k==='node'){var N=lgNode(e.side,e.id);return N?esc(N.name):'（已失去的節點）';}if(e.k==='unit'){var u=uById(e.id);return u?esc(uName(u)):'（部隊）';}return '地圖外的後方';}
function lgEta(V){if(!V.pts||V.pi>=V.pts.length)return 0;var d=0,x=V.x,y=V.y;for(var i=V.pi;i<V.pts.length;i+=2){d+=dist(x,y,V.pts[i],V.pts[i+1]);x=V.pts[i];y=V.pts[i+1];}return d/(Math.max(1,V.v||lgSpd(V.m))/3.6);}
function lgPanel(V){var D=LGM[V.m],me=mySide(),mine=me===null||V.side===me||seeAll(),o=v8H(esc(D.n)+'<span class="lw-note">（'+esc(G.sides[V.side].name)+'）</span>')+'<div class="lw-kv">';
  if(!mine)return o+kv('規模','約 '+V.n+' '+D.u)+kv('位置',esc(placeTxt(V.x,V.y)))+'</div><div class="lw-note">敵方的補給運輸。在它的路線附近部署部隊、游擊隊、砲兵或空中打擊，可以伏擊、截斷敵軍的補給。</div>';
  o+=kv('規模',V.n+' '+D.u+(V.n0>V.n?'（出發時 '+V.n0+'，損失 '+(V.n0-V.n)+'）':'')+'，每'+D.u+'載重約 '+fx(V.pay,V.pay<1?2:1)+' 噸');
  o+=kv('載運',lgCargo(V)>0.05?LCLS.filter(function(c){return V.c[c]>0.05;}).map(function(c){return LCN[c]+' '+fx(V.c[c],1)+' 噸';}).join('、'):'空車');
  o+=kv('路線',lgEpName(V.src)+' → '+lgEpName(V.dst));
  o+=kv('狀態',(LGPH[V.ph]||V.ph)+(V.ph==='hold'?'：附近有敵軍，停車等待或改道':V.ph==='wait'?'：路線被阻斷，等待改道':'')+(V.jam>1?'；<b style="color:#E65100">道路壅塞（車流約為容量的 '+fx(V.jam,1)+' 倍）</b>':''));
  var e=lgEta(V);if(e>0)o+=kv('預計',durTxt(e)+'後抵達'+(V.ph==='in'?'目的地':V.ph==='out'?'裝貨地點':'出發地'));o+=kv('出發',durTxt(Math.max(0,G.t-V.t0))+'前');
  return o+'</div><div class="lw-note">'+(D.air?'運輸機與直升機會避開敵方防空；被擊落時連同物資損失。':D.dom==='sea'?'運輸船隊會避開敵方艦艇與岸防；遭攻擊時船艦與物資一起沉沒。':'車隊沿道路行駛：路況、壅塞、夜間與天候都會影響速度；附近出現敵軍時會停車、改道或折返，遭伏擊、砲擊或空襲會損失車輛與物資。')+'</div>';}
function tpTgtName(A){var T=A.k==='aid'?aidTgt(A):G.civ?G.civ.S[A.g]:null,k=A.k==='aid'&&A.tg?A.tg.k:'S';if(!T)return '';return k==='S'?esc(T.n)+'的居民':k==='R'?'難民隊伍（約 '+fmt(T.n)+' 人）':k==='F'?'「'+esc(T.name)+'」':'被拘留的平民（約 '+fmt(T.n)+' 人）';}
function tpPanel(A){var o=v8H(A.k==='aid'?'✚ '+esc(A.org)+'救援隊':'⛪ '+esc(A.org))+'<div class="lw-kv">';
  o+=kv('身分',A.k==='aid'?'中立的國際人道團體：救助所有平民與傷患，不分陣營':'在地教會：開放教堂庇護居民、供應難民飲食');o+=kv('人員',A.n+' 人'+(A.hurt?'（傷亡 '+A.hurt+' 人）':''));
  if(A.k==='aid')o+=kv('物資','糧食 '+fx(A.food,1)+' 噸、醫療用品 '+fx(A.med,1)+' 噸');o+=kv('狀態',TPST[A.st]||A.st);var tn=tpTgtName(A);if(tn)o+=kv('對象',tn);
  return o+'</div><div class="lw-note">'+(A.k==='aid'?'援助團體依需要決定去處：飢餓、受傷、受困的平民與被拘留者優先；附近交戰時會停下等待，人員被砲火波及時撤出。':'教會團體只在自己的教區活動；教堂被摧毀或居民離開後解散。')+'</div>';}
function repPanel(R){var u=uById(R.emb),o=v8H('📷 戰地記者 '+esc(R.nm))+'<div class="lw-kv">';o+=kv('媒體',esc(R.org)+(R.side<0?'（國際媒體）':'（'+esc(G.sides[R.side].name)+'媒體）'));o+=kv('隨行',u?esc(uName(u)):'—');
  o+=kv('狀態',({ok:'採訪中',wia:'負傷，後送治療',kia:'殉職',capt:'被俘',det:'遭拘押',expelled:'被驅逐'})[R.st]||R.st);o+=kv('報導',(R.n||0)+' 篇');
  return o+'</div><div class="lw-note">記者會報導看到的戰鬥、傷亡與對平民的作為；本國媒體受新聞政策管制，國際媒體較難控制。完整報導見「戰報」頁的新聞報導。</div>';}

/* ---------- 新命令：撤出休整、爆破設施、修復設施 ---------- */
ordReg('refit','撤出休整','mv',{nt:1,g:'⇤',col:'#6D4C41'});ordReg('facdemo','爆破設施','eng',{g:'✖',col:'#2E7D32'});ordReg('repair','修復設施','eng',{g:'⚒',col:'#2E7D32'});
Object.assign(OICO,{civ:'☺'});Object.assign(ORDC,{civ:'#6A1B9A'});
(function(){var b=canOrd;canOrd=function(u,k){var L=function(){return isLeaf(u)?[u]:leavesOf(u).filter(alive);};if(k==='refit')return u.st!=='off'&&L().some(function(x){return onMap(x)||x.st==='air'||x.st==='base';});
  if(k==='facdemo')return !!G.started&&L().some(function(x){return ST(x).dom==='land'&&onMap(x);});if(k==='repair')return !!G.started&&L().some(isEng);return b(u,k);};})();
(function(){var b=ACT.ob;ACT.ob=function(btn){if(btn.getAttribute('data-v')==='refit'&&typeof confirm==='function'&&!confirm('選取的部隊將前往本方地圖邊緣、撤出戰場休整：補充物資、恢復士氣與組織，需要時再重新投入。撤離途中被敵軍近距離接觸會投降或被殲滅。確定嗎？'))return;return b(btn);};})();
(function(){var b=modeBt;modeBt=function(){b();if(VW.mode&&UI.tool==='ord'&&UI.ord&&(UI.ord.k==='facdemo'||UI.ord.k==='repair'))VW.mode.innerHTML='「'+ORDN[UI.ord.k]+'」：'+(UI.ord.k==='facdemo'?'點選要爆破的設施（港口、車站、機場、倉庫、油庫、彈藥庫）':'點選受損或被摧毀的設施')+'<button type="button" data-a="ordx">取消</button>';};})();
/* 撤出休整中的部隊：命令面板改為休整狀態與「重新投入」 */
(function(){var b=btOrd;btOrd=function(){b();var el=btEl('bord'),me=mySide();if(!el)return;var us=UI.sel.map(uById).filter(function(u){return u&&(me===null||u.side===me);});if(us.length&&us.every(function(u){return u.st==='off'&&u.refit;}))el.innerHTML=refitHtml(us);};})();
function refitHtml(us){return '<h4 style="margin:10px 0 4px;font-size:13px">撤出休整</h4><div class="lw-note">部隊在地圖外的後方休整：補充彈藥、油料與口糧，恢復士氣與組織。重新投入時從本方地圖邊緣、靠近撤出地點的位置進場。</div><table class="lw-tbl">'+us.map(function(u){var sm=strengthOf(u);return '<tr><td>'+esc(uName(u))+(u.refit.why?'<br><span class="lw-note">'+esc(u.refit.why)+'</span>':'')+'</td><td class="n">'+durTxt(G.t-u.refit.t0)+'</td><td class="n">兵力 '+pct(sm.f*100)+'<br>士氣 '+fmt(u.mor)+'</td><td><button type="button" class="lw-btn sm" data-a="v8ret" data-v="'+u.id+'">重新投入</button></td></tr>';}).join('')+'</table>';}
ACT.v8ret=function(b){var u=uById(+b.getAttribute('data-v'));if(!u||!refitReturn(u)){toast('無法重新投入。');return;}toast(uName(u)+'從地圖邊緣重新投入戰場。');if(UI.tab==='logi'){show('logi');return;}UI.sel=[u.id];btSel();btLeft(true);vCenter(u.x,u.y);};
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);if(!leaf)return o;
  if(fuelDep(u)&&u.st!=='off'){var q=fuelQ(u);o+='<span>油料</span><span>'+(q<=0?'<b style="color:#b3261e">耗盡：無法移動，等待補給</b>':q<0.1?'<b style="color:#b3261e">'+pct(q*100)+'：只能以約三分之一的速度移動</b>':q<0.2?'<b style="color:#a36b00">'+pct(q*100)+'：移動速度減為約三分之二</b>':pct(q*100))+'</span>';}
  if(u.insup===false&&u.lgWhy)o+='<span>補給中斷</span><span class="lw-note">'+esc(u.lgWhy)+'</span>';
  if(u.ord&&u.ord.dk==='refit')o+='<span>撤出</span><span>前往地圖邊緣撤出休整'+(u.ord.why?'（'+esc(u.ord.why)+'）':'')+'；途中被敵軍近距離接觸會投降或被殲滅</span>';
  if(u.shut){var V=lgById(u.shut);if(V&&V.ph!=='dead'&&V.ph!=='gone')o+='<span>運補</span><span>'+esc(LGM[V.m].n)+' '+V.n+' '+LGM[V.m].u+'：'+(LGPH[V.ph]||'')+'</span>';}
  return o;};})();

/* ---------- 核武當量：可自行輸入（受年代與載具的上限限制） ---------- */
function nkCapOf(us){return Math.max.apply(null,(us||[]).map(function(x){return x?Math.max.apply(null,(isLeaf(x)?[x]:leavesOf(x)).map(nukeCap).concat([0])):0;}).concat([0]));}
function nkYEff(us){var cap=nkCapOf(us),Y=UI.ordOpt.Yu?UI.ordOpt.Y:((G.set.nuke||{}).y||UI.ordOpt.Y||10);return cap>0?clamp(Y,0.01,cap):Y;}
var NKPRE=[0.01,0.1,0.5,1,5,10,15,20,50,100,300,500,1000,10000];
function nkYHtml(us){var cap=nkCapOf(us),Y=nkYEff(us);return '<span>當量</span><span><input type="number" min="0.01" max="'+cap+'" step="any" value="'+(+Y.toFixed(3))+'" data-c="oo" data-f="Y" style="width:76px"> 千噸 <select data-c="oo" data-f="Y"><option value="">常用…</option>'+NKPRE.filter(function(v){return v<=cap;}).map(function(v){return '<option value="'+v+'">'+yTxt(v)+'</option>';}).join('')+'</select><br><span class="lw-note">上限 '+yTxt(cap)+'（依年代與載具）；0.01 千噸＝10 噸 TNT</span></span>';}
(function(){var b=CHG.oo;CHG.oo=function(t){var f=t.getAttribute('data-f');if(f==='Y'){var v=+t.value;if(t.value===''||!(v>0)||UI.ordOpt.Yu&&v===UI.ordOpt.Y)return;UI.ordOpt.Y=v;UI.ordOpt.Yu=1;btOrd();vDraw(false);return;}b(t);};})();
function snkYrange(del){var Ys=snkYields(del);return Ys.length?[Math.min.apply(null,Ys),Math.max.apply(null,Ys)]:[1,1];}
(function(){var b=CHG.snk;CHG.snk=function(t){var f=t.getAttribute('data-f');if(f==='Y'){var v=+t.value;if(t.value===''||!(v>0))return;var R=snkYrange(SNK.del),Y=clamp(v,0.01,R[1]);if(Y===SNK.Y)return;SNK.Y=Y;snkDlg();return;}b(t);};})();

/* ---------- 設定：後勤運輸、撤出休整、各機制出現的年份 ---------- */
APK[0][1].push(['lgcut','補給車隊遭伏擊或游擊隊襲擊']);APK[1][1].push(['boom','彈藥庫、油庫等設施爆炸']);APK[2][1].push(['civact','部隊拒絕執行對平民的違法命令']);
setSec('logi','lgv',{t:'運輸與休整',o:10,h:function(){var S=G.set;return setOpt(setRow('可見的後勤運輸',setChk('setb','lgv',S.lgv!==false,'以實際行駛的車隊、列車、船隊與運輸機運補（關閉則改用抽象的運量計算）'))+
  setRow('自動撤出休整',setChk('setb','autoRefit',S.autoRefit!==false,'潰散的部隊靠近本方地圖邊緣時自動撤出休整')));}});
setSec('era','featy',{o:10,wide:1,note:'改變年份可以推演「如果……會怎樣」：例如把雷達提前到 1930 年，或讓戰略核武晚十年出現。民用設施、記者在開戰時依年份產生；開戰後修改只影響之後的判定（例如雷達、防空飛彈、戰爭法、援助團體）。',h:function(){var S=G.set,FY=S.featY||{},y=S.y||1943;
  return '<div class="lw-note">目前戰役：'+y+' 年</div><div class="lw-sc" style="max-height:380px;overflow:auto"><table class="lw-tbl"><tr><th>機制</th><th class="n">年份</th><th>本戰役</th><th>說明</th></tr>'+
    FEAT.map(function(q){var v=featY(q[0]),ch=FY[q[0]]!==undefined&&FY[q[0]]!==''&&+FY[q[0]]!==q[2];return '<tr><td>'+esc(q[1])+'</td><td class="n"><input type="number" min="1000" max="2200" step="1" value="'+v+'" data-c="featy" data-f="'+q[0]+'" style="width:70px'+(ch?';font-weight:700':'')+'">'+(ch?'<br><span class="lw-note">預設 '+q[2]+'</span>':'')+'</td><td>'+(y>=v?'✔ 已出現':'—')+'</td><td class="lw-note">'+esc(q[3])+'</td></tr>';}).join('')+
    '</table></div><div class="lw-row"><button type="button" class="lw-btn sm" data-a="featrst">全部恢復預設</button></div>';}});
CHG.featy=function(t){var k=t.getAttribute('data-f'),F=G.set.featY||(G.set.featY={}),v=Math.round(+t.value);if(t.value===''||!isFinite(v))delete F[k];else{F[k]=clamp(v,1000,2200);if(F[k]===FEATD[k])delete F[k];}G._facP=null;show('set');};
ACT.featrst=function(){G.set.featY={};G._facP=null;show('set');toast('已恢復各機制的預設年份。');};

/* ---------- 後勤頁：運輸與補給線、設施、撤出休整、油料 ---------- */
(function(){var b=PAGES.logi;PAGES.logi=function(host){b(host);if(!G||!G.started)return;var M=host.querySelector('.lw-main');if(!M)return;var d=document.createElement('div');d.innerHTML=v8LogiHtml(LG.side);var ref=M.children[2]||null;while(d.firstChild)M.insertBefore(d.firstChild,ref);};})();
function v8LogiHtml(side){var S=lgStats(side),L=(G.lgv||[]).filter(function(V){return V.side===side&&V.ph!=='dead'&&V.ph!=='gone';}),o='<div class="lw-grid"><div class="lw-card"><h3>運輸與補給線<small>實際行駛的車隊、列車、船隊與運輸機</small></h3>';
  if(G.set.lgv===false)o+='<div class="lw-note">設定中已關閉「可見的後勤運輸」：補給以抽象的運量計算。</div>';
  else{o+='<div class="lw-kv">'+kv('累計','出發 '+S.sent+' 趟、抵達 '+S.arr+' 趟，運到 '+fmt(S.t,1)+' 噸')+kv('損失',(S.lostV?'<b style="color:#b3261e">'+fmt(S.lostV)+' 輛（列、艘、架），物資 '+fmt(S.lostT,1)+' 噸</b>':'無')+'；遭伏擊 '+S.amb+' 次、空襲 '+S.air+' 次、中斷或折返 '+S.blk+' 次');
    var by={};L.forEach(function(V){var q=by[V.m]||(by[V.m]={n:0,v:0,t:0,h:0});q.n++;q.v+=V.n;q.t+=lgCargo(V);if(V.ph==='hold'||V.ph==='wait'||V.jam>1)q.h++;});
    o+=kv('行駛中',L.length?Object.keys(by).map(function(m){var q=by[m];return LGM[m].n+' '+q.n+' 隊（'+q.v+' '+LGM[m].u+'，載運 '+fmt(q.t,1)+' 噸'+(q.h?'，<b style="color:#E65100">'+q.h+' 隊受阻</b>':'')+'）';}).join('；'):'無');
    var AP=SD(side).alp;if(AP&&AP.base)o+=kv('空運補給','今天還有 '+AP.left+'／'+AP.base+' 架次（直升機與運輸機對被圍或補給中斷的部隊運補）');o+='</div>';
    if(L.length)o+='<details><summary class="lw-note" style="cursor:pointer">運輸清單（'+L.length+'）</summary><div class="lw-sc" style="max-height:300px;overflow:auto"><table class="lw-tbl"><tr><th>種類</th><th class="n">數量</th><th>路線</th><th>載運（噸）</th><th>狀態</th><th class="n">預計</th></tr>'+L.slice(0,200).map(function(V){var e=lgEta(V);return '<tr class="cl" data-a="v8lgsel" data-v="'+V.id+'"><td>'+LGM[V.m].n+'</td><td class="n">'+V.n+'</td><td>'+lgEpName(V.src)+' → '+lgEpName(V.dst)+'</td><td>'+(lgCargo(V)>0.05?LCLS.filter(function(c){return V.c[c]>0.05;}).map(function(c){return LCN[c]+' '+fx(V.c[c],1);}).join('、'):'空車')+'</td><td>'+(LGPH[V.ph]||V.ph)+(V.jam>1?'・壅塞':'')+'</td><td class="n">'+(e>0?durTxt(e):'—')+'</td></tr>';}).join('')+'</table></div></details>';}
  o+='</div>';
  var me=UI.side,FL=(G.fac||[]).filter(function(F){return F.own===side||(F.k==='hosp'||F.k==='camp')&&(me<0||!G.set.fog||F.own<0);});
  o+='<div class="lw-card"><h3>設施<small>'+esc(G.sides[side].name)+'控制的設施、醫院與難民營</small></h3>'+(FL.length?'<div class="lw-sc" style="max-height:300px;overflow:auto"><table class="lw-tbl"><tr><th>設施</th><th>狀態</th><th>存量（噸）或收容</th></tr>'+FL.map(function(F){var st=F.dead?null:facSt(F),fire=F.burn&&G.t<F.burn||F.fire&&G.t<F.fire;
      return '<tr class="cl" data-a="v8facsel" data-v="'+F.id+'"><td>'+(NODEI[F.k]||'')+' '+FACN[F.k]+'「'+esc(F.name)+'」'+(F.own!==side?'<br><span class="lw-note">'+(F.own<0?'中立':esc(G.sides[F.own].name))+'</span>':'')+'</td><td>'+(F.dead?'<b style="color:#b3261e">已摧毀</b>':(fire?'<b style="color:#E65100">起火</b>・':'')+'完好 '+fmt(F.hp===undefined?100:F.hp)+'%')+'</td><td>'+(F.k==='camp'?fmt(F.pop||0)+'／'+fmt(F.cap||5000)+' 人，糧 '+fx(F.food||0,1)+' 天':F.k==='hosp'?'收治 '+fmt(F.occ||0)+' 人':F.k==='church'?'—':st?LCLS.filter(function(c){return (st[c]||0)>=0.5;}).map(function(c){return LCN[c]+' '+fmt(st[c],1);}).join('、')||'空':'—')+'</td></tr>';}).join('')+'</table></div>':'<div class="lw-note">目前沒有控制任何設施。</div>')+'</div></div>';
  var R=G.units.filter(function(u){return u.side===side&&u.refit&&u.st==='off'&&isLeaf(u);}),FU=G.units.filter(function(u){return u.side===side&&isLeaf(u)&&alive(u)&&onMap(u)&&fuelDep(u)&&fuelQ(u)<0.2;});
  if(R.length||FU.length){o+='<div class="lw-grid">';if(R.length)o+='<div class="lw-card"><h3>撤出休整中的部隊</h3>'+refitHtml(R).replace(/^<h4[^>]*>.*?<\/h4>/,'')+'</div>';
    if(FU.length)o+='<div class="lw-card"><h3>油料不足的部隊<small>低於 20%</small></h3><table class="lw-tbl"><tr><th>單位</th><th class="n">油料</th><th>影響</th></tr>'+FU.map(function(u){var q=fuelQ(u);return '<tr class="cl" data-a="lgunit" data-v="'+u.id+'"><td>'+esc(uName(u))+'</td><td class="n">'+pct(q*100)+'</td><td>'+(q<=0?'<b style="color:#b3261e">無法移動</b>':q<0.1?'約三分之一速度':'約三分之二速度')+'</td></tr>';}).join('')+'</table></div>';o+='</div>';}
  return o;}
ACT.v8lgsel=function(b){var V=lgById(+b.getAttribute('data-v'));if(!V)return;UI.sel=[];UI.selC=0;UI.selB=0;UI.selX={k:'lgv',id:V.id};show('battle');vCenter(V.x,V.y,1.5);};
ACT.v8facsel=function(b){var F=facById(+b.getAttribute('data-v'));if(!F)return;UI.sel=[];UI.selC=0;UI.selB=0;UI.selX={k:'fac',id:F.id};show('battle');vCenter(F.x,F.y,1.5);};

/* ---------- 畫面效果與音效：設施爆炸、車隊被擊中、燃燒的設施冒煙 ---------- */
(function(){var b=boomAt;boomAt=function(x,y,W,kind,side,F,src,sec){var R=b.apply(null,arguments);if(FX.cap&&FX.ev.length<5000)FX.ev.push({k:'fboom',x1:x,y1:y,m:W,kind:kind,sec:!!sec,R:R});return R;};})();
(function(){var b=lgLoss;lgLoss=function(V,frac,captor,why,by){var n0=V.n;b.apply(null,arguments);if(FX.cap&&V.n<n0&&FX.ev.length<5000&&lgSeen(V))FX.ev.push({k:'lghit',x1:V.x,y1:V.y,m:n0-V.n,air:!!(LGM[V.m]||{}).air});};})();
FXS.fboom=function(e){var T=FX.clk,R=e.R||boomR(e.m),r1=R[1],n=e.sec?2:clamp(Math.round(Math.cbrt(e.m/1000)*2)+2,3,9),fuel=e.kind==='fuel';
  for(var i=0;i<n;i++){var a=Math.random()*2*PI,d=Math.random()*r1*0.5;fxEx(e.x1+Math.cos(a)*d,e.y1+Math.sin(a)*d,clamp(r1*(i?0.35:0.6),25,600),T+i*0.09);}
  var rs=Math.min(r1,450);for(var j=0;j<fxLv(2,4);j++)fxP({k:'sm',x:e.x1+(Math.random()-0.5)*rs*0.4,y:e.y1+(Math.random()-0.5)*rs*0.4,t0:T+0.3+j*0.3,d:8+Math.random()*4,r0:rs*0.3,r1:rs*(1+Math.random()*0.5),p0:6,p1:24,a:fuel?0.5:0.4,c:fuel?'28,24,22':'70,64,58'});};
FXS.lghit=function(e){var T=FX.clk;for(var i=0;i<Math.min(3,e.m);i++){fxEx(e.x1+(Math.random()-0.5)*160,e.y1+(Math.random()-0.5)*160,20,T+i*0.15);if(!e.air&&FX.lvl>=2)fxWreck(e.x1+(Math.random()-0.5)*160,e.y1+(Math.random()-0.5)*160,T+0.3+i*0.2);}};
(function(){var b=sndEv;sndEv=function(e){if(e.k!=='fboom'&&e.k!=='lghit')return b(e);var ac=SND.ac;if(!ac||ac.state!=='running')return;var t=ac.currentTime+0.02,P=sndAt(e.x1,e.y1,true);SND.heat+=e.k==='fboom'?4:1;if(P.g<0.02)return;
  if(e.k==='lghit'){if(sndTok('expl'))SNDF.expl(t,P.pan,P.g*0.7,0.4,P.far);return;}var n=e.sec?1:3;for(var i=0;i<n;i++)if(sndTok('expl'))SNDF.expl(t+i*0.16,P.pan,Math.min(1,P.g*(e.sec?0.7:1.1)),e.sec?0.6:1,P.far);if(!e.sec&&sndTok('boom'))SNDF.boom(t,P.pan,Math.min(1,P.g),P.far);};})();
(function(){var b=fxIngest;fxIngest=function(){b();if(!G.fac||FX.lvl<1||UI.lay.fx===0)return;var T=FX.clk,W=UI.run?DT/Math.max(1,UI.speed):0.6;G.fac.forEach(function(F){var big=F.fire&&G.t<F.fire;if(!big&&!(F.burn&&G.t<F.burn))return;var p=w2s(F.x,F.y);if(p[0]<-200||p[1]<-200||p[0]>VW.cw+200||p[1]>VW.ch+200)return;
    /* 每座設施最多每 1～1.6 秒（特效時鐘）冒一團煙：高速播放時不會越積越厚 */if(F._smT!==undefined&&T-F._smT<(big?1:1.6)&&F._smT<=T)return;F._smT=T;var R=Math.min(facR(F),250);
    fxP({k:'sm',x:F.x+(Math.random()-0.5)*R,y:F.y+(Math.random()-0.5)*R,t0:T+Math.random()*W,d:8+Math.random()*4,r0:R*0.2,r1:R*(1.2+Math.random()*0.6),p0:4,p1:big?16:11,a:big?0.38:0.28,c:big?'30,26,24':'60,56,52'});
    fxP({k:'fl',x:F.x+(Math.random()-0.5)*R*0.6,y:F.y+(Math.random()-0.5)*R*0.6,t0:T+Math.random()*W,d:0.7,r:big?5:3,c:'#FF8F00'});});};})();

/* ---------- 說明 ---------- */
var V8HELP='<h4>v8：油料、看得見的補給運輸、民用設施與平民</h4><ul>'+
  '<li>新的民用設施（依年代出現）：加油站、儲油槽、彈藥庫、醫院、教堂、難民營。佔領油料或彈藥設施後成為只存放該類物資的補給點；醫院收治傷兵；醫院、教堂與難民營受戰爭法保護。</li>'+
  '<li>易爆設施被砲火、轟炸、飛彈或爆破摧毀時，依存放的彈藥與油料發生爆炸：致命、重創與輕傷的半徑隨爆炸當量的立方根增加。彈藥庫會在之後數十分鐘斷續殉爆，油料引發延燒數小時的大火。中彈的油庫也可能起火，慢慢燒掉存量。</li>'+
  '<li>補給運輸畫在地圖上：卡車（更早是馬車與挑夫）、火車、運輸船、運輸機、直升機與空投。車隊沿道路行駛；同一路段車輛太多就會壅塞（橘色、紅色的區塊）；附近出現敵軍時會停車、改道或折返；被伏擊、砲擊或空襲會損失車輛與物資。點選車隊可以看到路線、載貨與預計抵達時間；後勤頁有運輸統計與清單。</li>'+
  '<li>油料：車輛與艦艇的油料低於 20% 時移動速度減為約三分之二，低於 10% 只剩約三分之一，耗盡就無法移動，直到補給送來。飛機在油料用盡前返航或轉降友軍機場，基地失守時轉場；艦艇到友軍港口或地圖邊緣加油。</li>'+
  '<li>撤出休整：「撤出休整」命令讓部隊前往本方地圖邊緣離開戰場；潰散的部隊靠近邊緣時會自動撤出（可在設定關閉），電腦指揮的部隊在物資耗盡又無法補給時也會撤出。撤離途中被敵軍近距離接觸會投降或被殲滅。休整中的部隊可在單位面板或後勤頁「重新投入」。</li>'+
  '<li>工兵可以構築：簡易港口、簡易機場（需要平坦開闊的跑道）、補給站、野戰醫院、野戰油庫、野戰彈庫、難民收容營；也可以爆破設施（拒止敵軍使用）或修復受損的設施。</li>'+
  '<li>平民：每個聚落的居民以人形圖示表示，顏色是他們對本方的態度（綠：支持、灰：觀望、紅：敵視）；難民隊伍、被拘留者也畫在地圖上。點選後可以命令附近的部隊引導疏散、救護支援、贈與物資、拘留審查；也可能下達強制拘禁或無差別開火——這些是戰爭罪行：會被記錄、被記者揭露，民心崩潰、游擊活動升高，戰後總結會列出責任者，守法的部隊可能拒絕執行。</li>'+
  '<li>第三方：國際人道援助團體（紅十字會成立以後）進入戰區救助飢餓、受傷、受困的平民與被拘留者，難民多時設立難民營；附近交戰時會停下等待。教會團體在教堂附近庇護居民、供應難民飲食。戰地記者跟隨部隊採訪，以相機圖示標在部隊旁邊。</li>'+
  '<li>核武當量可以自行輸入（受該年代與載具的上限限制）。設定頁可以修改各種機制出現的年份：戰地記者、援助團體、戰爭法、鐵路、加油站、卡車、雷達、核武、直升機、防空飛彈、匿蹤飛機等。</li>'+
  '<li>電腦指揮官會估算每日的補給需求與運輸能力，優先奪取與目標相連的港口、車站、機場、倉庫與油料設施，並派兵截斷敵軍的補給線。</li></ul>';
