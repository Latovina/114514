/* ===================== 地圖檢視：像素底圖（可縮放平移）、向量地名與說明、兵棋符號、命令線、接觸、戰鬥標記、補給節點、工具互動 ===================== */
var VW={s:1,ox:0,oy:0,cw:0,ch:0,dpr:1,img:null,imgKey:'',ptr:{},drag:null,hover:null,lastBase:0,box:null,fit:false};
function viewMount(host){host.innerHTML='<div class="lw-mapw"><canvas class="lw-cb"></canvas><canvas class="lw-ct"></canvas><div class="lw-ly"></div><div class="lw-zm"><button type="button" data-z="in" title="放大">＋</button><button type="button" data-z="out" title="縮小">－</button><button type="button" data-z="fit" title="全圖">全</button></div><div class="lw-tip" hidden></div><div class="lw-mode" hidden></div></div>';
  var B=host.querySelector('.lw-mapw');VW.wrap=B;VW.cb=B.querySelector('.lw-cb');VW.ct=B.querySelector('.lw-ct');VW.tip=B.querySelector('.lw-tip');VW.mode=B.querySelector('.lw-mode');VW.ly=B.querySelector('.lw-ly');
  B.addEventListener('pointerdown',vDown);B.addEventListener('pointermove',vMove);B.addEventListener('pointerup',vUp);B.addEventListener('pointercancel',vUp);B.addEventListener('pointerleave',function(){VW.tip.hidden=true;VW.hover=null;});
  B.addEventListener('wheel',function(e){e.preventDefault();var r=B.getBoundingClientRect();vZoom(Math.exp(-e.deltaY*0.0015),e.clientX-r.left,e.clientY-r.top);},{passive:false});
  B.addEventListener('contextmenu',function(e){e.preventDefault();});
  B.querySelector('.lw-zm').addEventListener('click',function(e){var b=e.target.closest('[data-z]');if(!b)return;var z=b.getAttribute('data-z');if(z==='fit')vFit();else vZoom(z==='in'?1.6:1/1.6,VW.cw/2,VW.ch/2);});
  lyRender();vResize(!VW.fit);if(typeof ResizeObserver!=='undefined'){if(VW.ro)VW.ro.disconnect();VW.ro=new ResizeObserver(function(){vResize(false);});VW.ro.observe(B);}}
function lyRender(){if(!VW.ly)return;var L=UI.lay,o='';[['lbl','地名'],['grid','方格'],['units','部隊'],['ord','命令'],['ct','敵情'],['bt','戰鬥'],['fr','戰線'],['sup','補給'],['fx','火力'],['civ','平民'],['evt','事件']].forEach(function(q){o+='<label><input type="checkbox" data-ly="'+q[0]+'"'+(L[q[0]]?' checked':'')+'>'+q[1]+'</label>';});
  o+='<select data-ly="lvl" title="顯示層級">'+[['auto','層級：自動'],['1','連'],['2','營'],['3','團'],['4','旅'],['5','師']].map(function(q){return '<option value="'+q[0]+'"'+(UI.lvl===q[0]?' selected':'')+'>'+q[1]+'</option>';}).join('')+'</select>';
  VW.ly.innerHTML=o;VW.ly.onchange=function(e){var t=e.target,k=t.getAttribute('data-ly');if(k==='lvl')UI.lvl=t.value;else UI.lay[k]=t.checked?1:0;vDraw(true);};}
function vResize(fit){if(!VW.wrap)return;var cw=VW.wrap.clientWidth,ch=VW.wrap.clientHeight;if(!cw||!ch)return;VW.cw=cw;VW.ch=ch;VW.dpr=Math.min(VW.dprMax||2,window.devicePixelRatio||1);[VW.cb,VW.ct].forEach(function(c){c.width=Math.round(cw*VW.dpr);c.height=Math.round(ch*VW.dpr);});if(fit)vFit();else vDraw(true);}
function vFit(){if(!G||!G.map)return;var MP=G.map,s=Math.min(VW.cw/MP.GW,VW.ch/MP.GH)*0.98;VW.s=s;VW.s0=s;VW.ox=(VW.cw-MP.GW*s)/2;VW.oy=(VW.ch-MP.GH*s)/2;VW.fit=true;vDraw(true);}
function vZoom(f,cx,cy){var s0=VW.s,s=clamp(s0*f,(VW.s0||0.2)*0.6,60);f=s/s0;VW.ox=cx-(cx-VW.ox)*f;VW.oy=cy-(cy-VW.oy)*f;VW.s=s;vDraw(true);}
function vCenter(x,y,minS){var cs=G.map.cs;if(minS&&VW.s<minS)VW.s=minS;VW.ox=VW.cw/2-x/cs*VW.s;VW.oy=VW.ch/2-y/cs*VW.s;vDraw(true);}
function w2s(x,y){var cs=G.map.cs;return [VW.ox+x/cs*VW.s,VW.oy+y/cs*VW.s];}
function s2w(sx,sy){var cs=G.map.cs;return [(sx-VW.ox)/VW.s*cs,(sy-VW.oy)/VW.s*cs];}
function mpp(){return G.map.cs/VW.s;}
/* ---------- 底圖影像（像素渲染結果的快取） ---------- */
function gfxFlat(){return typeof GFX!=='undefined'&&GFX.mode==='simple';}
/* 地圖影像的額外選項（戰場地面損壞等，由其他模組加上） */
function rmOpt(o){return o;}
function ensureImg(){var MP=G.map,mo=G.started?now().m:G.set.m,key=MP.seed+'|'+MP.GW+'|'+mo+'|'+(UI.contour?1:0)+'|'+(gfxFlat()?'f':'');if(VW.img&&VW.imgKey===key&&VW.imgMap===MP){if(G.dirty&&G.dirty.length){var x0=1e9,y0=1e9,x1=-1,y1=-1;G.dirty.forEach(function(ks){ks.forEach(function(k){var x=k%MP.GW,y=(k/MP.GW)|0;if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;});});G.dirty=[];if(x1>=0)renderMap(MP,rmOpt({S:VW.img.S||2,month:mo,contour:UI.contour&&!gfxFlat(),flat:gfxFlat()}),VW.img,[x0-1,y0-1,x1+2,y1+2]);}return VW.img;}
  VW.img=renderMap(MP,rmOpt({S:MP.GW*MP.GH>900000||gfxFlat()?1:2,month:mo,contour:UI.contour&&!gfxFlat(),flat:gfxFlat()}));VW.imgKey=key;VW.imgMap=MP;G.dirty=[];return VW.img;}
/* ---------- 繪製 ---------- */
function vDraw(full){if(!G||!G.map||!VW.cb||!VW.cw)return;if(full){vClamp();drawBase();}drawTop();}
/* 視窗不要漂離地圖：地圖比視窗大時邊緣最多內縮 24px，比視窗小時置中 */
function vClamp(){var MP=G.map,W=MP.GW*VW.s,H=MP.GH*VW.s,m=24;if(!(W>0&&H>0))return;if(W+2*m<=VW.cw)VW.ox=(VW.cw-W)/2;else VW.ox=clamp(VW.ox,VW.cw-W-m,m);if(H+2*m<=VW.ch)VW.oy=(VW.ch-H)/2;else VW.oy=clamp(VW.oy,VW.ch-H-m,m);}
function drawBase(){var c=VW.cb.getContext('2d'),d=VW.dpr,MP=G.map;c.setTransform(d,0,0,d,0,0);c.fillStyle='#2d3a46';c.fillRect(0,0,VW.cw,VW.ch);var im=ensureImg();c.imageSmoothingEnabled=VW.s<1.6;c.drawImage(im.cv,VW.ox,VW.oy,MP.GW*VW.s,MP.GH*VW.s);if(VW.s>=0.9&&MP.brg&&MP.brg.length)drawBridges(c);
  if(UI.lay.grid)drawGrid(c);if(UI.lay.lbl)drawLabels(c);VW.lastBase=Date.now();}
function drawGrid(c){var MP=G.map,km=mpp()<8?500:mpp()<25?1000:mpp()<80?5000:10000;c.save();c.strokeStyle='rgba(20,30,40,.28)';c.lineWidth=1;c.font='10px sans-serif';c.fillStyle='rgba(20,30,40,.75)';
  for(var x=0;x<=MP.Wm;x+=km){var p=w2s(x,0);c.beginPath();c.moveTo(p[0],Math.max(0,VW.oy));c.lineTo(p[0],Math.min(VW.ch,w2s(0,MP.Hm)[1]));c.stroke();if(x>0)c.fillText(fmt(x/1000,km<1000?1:0),p[0]+2,Math.max(10,VW.oy+10));}
  for(var y=0;y<=MP.Hm;y+=km){var q=w2s(0,y);c.beginPath();c.moveTo(Math.max(0,VW.ox),q[1]);c.lineTo(Math.min(VW.cw,w2s(MP.Wm,0)[0]),q[1]);c.stroke();if(y>0)c.fillText(fmt(y/1000,km<1000?1:0),Math.max(2,VW.ox+2),q[1]-2);}c.restore();}
function txtHalo(c,t,x,y,font,col,halo){c.font=font;c.lineWidth=3;c.strokeStyle=halo||'rgba(255,255,255,.88)';c.lineJoin='round';c.strokeText(t,x,y);c.fillStyle=col;c.fillText(t,x,y);}
function drawLabels(c){var MP=G.map,cs=MP.cs,S=VW.s,boxes=[],items=[];c.save();c.textAlign='center';c.textBaseline='middle';
  function free(x,y,w,h){for(var i=0;i<boxes.length;i++){var b=boxes[i];if(x<b[2]&&x+w>b[0]&&y<b[3]&&y+h>b[1])return false;}boxes.push([x,y,x+w,y+h]);return true;}
  (MP.set||[]).forEach(function(s){var pr=s.kind==='city'?0:s.kind==='town'?1:4,minS=s.kind==='city'?0:s.kind==='town'?0.35:1.1;if(S<minS)return;if(s.kind==='village'&&s.pop<250&&S<2.2)return;items.push({pr:pr,x:s.x,y:s.y,t:s.name,f:s.kind==='city'?'bold 15px sans-serif':s.kind==='town'?'bold 12.5px sans-serif':'11px sans-serif',col:'#1a1a1a',dy:s.kind==='village'?-9:-12});});
  (MP.lbl||[]).forEach(function(l){if(l.k==='river'&&S>=0.45)items.push({pr:3,x:l.x,y:l.y,t:l.t,f:'italic '+(l.s>=3?13:11)+'px serif',col:'#174E86',a:l.a});else if(l.k==='mtn')items.push({pr:2,x:l.x,y:l.y,t:'▲ '+(l.t?l.t+' ':'')+fmt(l.e),f:'11px sans-serif',col:'#5A3B1A'});
    else if(l.k==='hill'&&S>=0.9)items.push({pr:6,x:l.x,y:l.y,t:'▲'+fmt(l.e),f:'10px sans-serif',col:'#5A3B1A'});else if((l.k==='forest'||l.k==='lake')&&S>=0.4)items.push({pr:5,x:l.x,y:l.y,t:l.t,f:'italic 11.5px serif',col:l.k==='lake'?'#174E86':'#1E4620'});
    else if(l.k==='txt')items.push({pr:0,x:l.x,y:l.y,t:l.t,f:(l.b?'bold ':'')+(l.sz||13)+'px sans-serif',col:l.col||'#111'});
    else if(l.k==='dist'&&S>=1.3)items.push({pr:4,x:l.x,y:l.y,t:l.t,f:'italic 10.5px sans-serif',col:'#4A3A30'});});
  /* 簡易圖形模式：只標城市、鎮與自訂文字（放大後才加上河流） */if(gfxFlat())items=items.filter(function(it){return it.pr<=1||it.pr===3&&S>=1.5;});
  items.sort(function(a,b){return a.pr-b.pr;}).forEach(function(it){var p=[VW.ox+it.x*S,VW.oy+it.y*S+(it.dy||0)];if(p[0]<-80||p[1]<-30||p[0]>VW.cw+80||p[1]>VW.ch+30)return;c.font=it.f;var w=c.measureText(it.t).width+6,h=16;if(!free(p[0]-w/2,p[1]-h/2,w,h))return;
    if(it.a!==undefined){var a=it.a;if(a>PI/2)a-=PI;if(a<-PI/2)a+=PI;c.save();c.translate(p[0],p[1]);c.rotate(a);txtHalo(c,it.t,0,0,it.f,it.col);c.restore();}else txtHalo(c,it.t,p[0],p[1],it.f,it.col);});c.restore();}
/* 顯示層級 */
function dispLevel(){if(UI.lvl!=='auto')return +UI.lvl;var m=mpp();return m<14?1:m<38?2:m<95?3:m<220?4:5;}
function seeAll(){return UI.side<0||!G.set.fog;}
/* 要畫的部隊（本方或上帝視角）與敵情接觸 */
/* 執行中每一步只整理一次（部隊位置只在模擬步之間改變）；暫停時每次重算，拖曳、改編制都立即反映 */
function visItems(){var lvl=dispLevel(),K=G.started&&UI.run&&!G.replay?[G.step,G.t,UI.side,lvl,G.set.fog?1:0,G.units.length,G._pv||0].join('|'):null;if(K&&VW._viK===K&&VW._viG===G&&VW._viL)return VW._viL;var out=visItems0(lvl);VW._viK=K;VW._viG=G;VW._viL=K?out:null;return out;}
function visItems0(lvl){var out=[],sides=UI.side<0||!G.set.fog?SIDES():[UI.side];
  sides.forEach(function(s){tops(s).concat(G.units.filter(function(u){return u.side===s&&u.p>=0&&!uById(u.p);})).forEach(function walk(F){if(!F||F.st==='dead'||F.st==='off')return;if(isLeaf(F)){if(onMap(F)||F.st==='air')out.push({u:F,x:F.x,y:F.y,s:ST(F),ech:dispEch(F)});return;}
    var L=leavesOf(F).filter(function(x){return onMap(x)&&ST(x).dom!=='air';});if(dispEch(F)<=lvl&&L.length){var cc=centroid(L);out.push({u:F,agg:1,x:cc[0],y:cc[1],s:ST(L[0]),ech:F.ech,L:L});kidsOf(F).forEach(function(k){if(isLeaf(k)&&ST(k).dom==='air'&&k.st==='air')out.push({u:k,x:k.x,y:k.y,s:ST(k),ech:dispEch(k)});});return;}
    if(onMap(F))out.push({u:F,x:F.x,y:F.y,s:ST(F),ech:F.ech,hq:1});var kd=kidsOf(F),lk=kd.filter(function(k){return isLeaf(k)&&onMap(k)&&ST(k).dom!=='air';});
    if(lvl>=3&&lk.length>=2){var byB={};lk.forEach(function(k){var g=roleOf(k)==='fire'?'fire':'oth';(byB[g]=byB[g]||[]).push(k);});Object.keys(byB).forEach(function(g){var Lg=byB[g],cg=centroid(Lg);out.push({u:F,grp:Lg,agg:1,x:cg[0],y:cg[1],s:ST(Lg[0]),ech:Lg.length>=6?3:2,L:Lg,lbl:F.name+(g==='fire'?'直屬砲兵':'直屬部隊')});});kd.forEach(function(k){if(!isLeaf(k)||ST(k).dom==='air')walk(k);});}
    else kd.forEach(walk);});});
  if(!seeAll()){var C=G.ct[UI.side];for(var id in C){var c=C[id],age=G.t-c.t;if(age>3*3600)continue;out.push({c:c,x:c.x,y:c.y,ech:c.q>=1?c.ech:-1,age:age});}}return out;}
function drawTop(){var c=VW.ct.getContext('2d'),d=VW.dpr;c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,VW.cw,VW.ch);if(!G||!G.map)return;var S=VW.s,h=clamp(9+S*2.2,12,24);if(typeof drawUnder==='function')drawUnder(c);
  if(UI.lay.fr&&G.front)drawFront(c);if(UI.lay.evt!==0&&G.evt)drawEvt(c);if((UI.lay.evt!==0||UI.lay.sup)&&G.rdiL)drawRoads(c);if(UI.lay.sup&&!G.replay)drawNodes(c);drawObjs(c);if(UI.lay.civ!==0&&G.civ)drawCiv(c);if(UI.lay.ord)drawDrawings(c);if(UI.lay.bt&&G.bt)drawBattles(c);if(UI.lay.fx&&G._fx)drawFx(c);drawMissions(c);drawProj(c);
  var items=UI.lay.units?visItems():[];VW.items=items;
  if(UI.lay.ord)drawOrders(c,items);
  items.forEach(function(it){var p=w2s(it.x,it.y);if(p[0]<-40||p[1]<-40||p[0]>VW.cw+40||p[1]>VW.ch+40){it.sx=undefined;return;}it.sx=p[0];it.sy=p[1];
    if(it.c){if(!UI.lay.ct)return;var cc=it.c;drawSym(c,{x:p[0],y:p[1],h:h*0.9,sym:cc.q>=1?cc.sym:'?',dom:cc.dom,side:cc.side,ech:cc.q>=1?cc.ech:-1,q:cc.q>=1?1:0,alpha:cc.dead?0.3:clamp(1-it.age/(3*3600),0.25,1),ms:cc.ms,sel:UI.selC===cc.id,lbl:UI.lay.unm!==0&&S>2.5&&cc.name?cc.name:'',img:cc.q>=1&&uById(cc.id)?unitImg(uById(cc.id)):'',u:cc.q>=1&&cc.dom==='air'?uById(cc.id):null});it.h=h*0.9;return;}
    var u=it.u,sel=it.grp?it.grp.every(function(k){return UI.sel.indexOf(k.id)>=0;}):UI.sel.indexOf(u.id)>=0,str=it.grp?sum(it.grp,strFrac)/it.grp.length:it.agg?strengthOf(u).f:strFrac(u),hh=it.agg?h*1.12:it.hq?h*0.8:h;it.h=hh;
    drawSym(c,{x:p[0],y:p[1],h:hh,sym:it.hq?'hq':it.grp||it.agg?it.s.sym:symOfU(u),dom:it.s.dom,mob:it.hq?'':mobOfIt(it),br:it.hq?'':it.s.br,fc:fcolOf(u),ins:insOf(u),agg:it.agg?1:0,cimg:it.grp?'':u.cimg||'',fbr:(it.hq||it.agg)&&symStd()==='de'?fmBr(u,it.grp||(it.hq?null:it.L)):'',rot:!it.hq&&!it.agg&&!it.grp&&isLeaf(u)&&it.s.dom!=='air'&&UIP.symRot!==0?(u.hd||0):undefined,side:u.side,col:typeof cmColU==='function'?cmColU(u):undefined,ech:it.ech,str:str,bars:typeof uBars==='function'?uBars(it,u,sel):null,ms:it.agg?aggMs(it.L):u.ms,sel:sel,hq:it.hq,u:it.hq||it.grp||it.agg?null:u,img:it.hq||it.grp?'':unitImg(u),lbl:UI.lay.unm===0&&!sel?'':it.lbl&&S>0.8?it.lbl:(S>3||sel)&&!it.hq?shortName(u):(it.agg&&S>0.8?shortName(u):'')});
    if(sel&&isLeaf(u)&&u.ent>0.3&&!it.agg){c.strokeStyle='rgba(90,60,30,.8)';c.lineWidth=2;c.beginPath();c.arc(p[0],p[1],hh*1.05,PI*0.15,PI*0.85);c.stroke();}});
  drawTool(c);drawScale(c);}
function aggMs(L){var r=0,s=0;L.forEach(function(x){if(x.ms==='rout')r++;else if(x.ms==='shaken')s++;});return r>L.length/2?'rout':(r+s)>L.length/2?'shaken':'ok';}
function shortName(u){var n=u.name||'';return n.length>12?n.slice(0,12)+'…':n;}
function drawScale(c){var m=mpp(),km=[100,200,500,1000,2000,5000,10000,20000,50000].filter(function(v){return v/m<=140;}).pop()||100,w=km/m,x=VW.cw-w-14-(VW.padR||0),y=VW.ch-14;c.save();c.fillStyle='rgba(255,255,255,.85)';c.fillRect(x-6,y-16,w+12,22);c.strokeStyle='#111';c.lineWidth=2;c.beginPath();c.moveTo(x,y-4);c.lineTo(x,y);c.lineTo(x+w,y);c.lineTo(x+w,y-4);c.stroke();
  c.font='11px sans-serif';c.fillStyle='#111';c.textAlign='center';c.fillText(kmTxt(km),x+w/2,y-6);c.restore();}
/* 命令線、規劃中、傳遞中 */
var ORDC={move:'#1565C0',attack:'#C62828',defend:'#212121',withdraw:'#6D4C41',recon:'#00838F',screen:'#455A64',bombard:'#EF6C00',support:'#EF6C00',halt:'#757575',rest:'#757575',reserve:'#5E35B1',fortify:'#5D4037',patrol:'#283593',strike:'#AD1457',bomb:'#AD1457',bridge:'#2E7D32',demolish:'#2E7D32',siege:'#B71C1C',pursue:'#D84315',airlift:'#00695C',airdrop:'#00695C',landing:'#0277BD',nuke:'#000000',crossing:'#0277BD',storm:'#B71C1C',breakthrough:'#C62828',penetrate:'#6A1B9A',build:'#5D4037',xsite:'#0277BD',breach:'#5D4037',waitx:'#607D8B'};
function arrow(c,x0,y0,x1,y1,col,dash,wd){c.save();c.strokeStyle=col;c.fillStyle=col;c.lineWidth=wd||2;if(dash)c.setLineDash(dash);c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.setLineDash([]);var a=Math.atan2(y1-y0,x1-x0),L=9;c.beginPath();c.moveTo(x1,y1);c.lineTo(x1-L*Math.cos(a-0.4),y1-L*Math.sin(a-0.4));c.lineTo(x1-L*Math.cos(a+0.4),y1-L*Math.sin(a+0.4));c.closePath();c.fill();c.restore();}
function drawOrders(c,items){var sides=UI.side<0?SIDES():[UI.side],selOnly=!UI.allOrd;c.save();
  G.units.forEach(function(u){if(sides.indexOf(u.side)<0||!alive(u)||u.st==='off')return;var sel=UI.sel.indexOf(u.id)>=0;if(selOnly&&!sel&&!(u.p>=0&&UI.sel.indexOf(u.p)>=0))return;var p=w2s(u.x,u.y);
    if(u.path&&sel&&isLeaf(u)){c.strokeStyle='rgba(21,101,192,.55)';c.lineWidth=2;c.setLineDash([4,4]);c.beginPath();c.moveTo(p[0],p[1]);for(var i=u.path.i;i<u.path.pts.length;i+=2){var q=w2s(u.path.pts[i],u.path.pts[i+1]);c.lineTo(q[0],q[1]);}c.stroke();c.setLineDash([]);}
    var o=u.ord;if(o&&o.x!==undefined&&o.st!=='done'&&(isLeaf(u)?sel:true)){var q2=w2s(o.x,o.y);if(o.pts&&o.pts.length>=4){c.strokeStyle=ORDC[o.k]||'#333';c.lineWidth=3;c.beginPath();for(var j=0;j<o.pts.length;j+=2){var r=w2s(o.pts[j],o.pts[j+1]);if(j)c.lineTo(r[0],r[1]);else c.moveTo(r[0],r[1]);}c.stroke();}
      else arrow(c,p[0],p[1],q2[0],q2[1],ORDC[o.k]||'#333',isLeaf(u)?[6,4]:null,isLeaf(u)?1.5:2.5);if(o.r&&/bombard|strike|patrol|bomb/.test(o.k)){c.strokeStyle=ORDC[o.k];c.setLineDash([3,3]);c.beginPath();c.arc(q2[0],q2[1],o.r/mpp(),0,2*PI);c.stroke();c.setLineDash([]);}}
    if(u.pend&&u.pend.length&&(sel||!isLeaf(u))){var pd=u.pend[0];txtHalo(c,(pd.st==='plan'?'⚙ 規劃 ':'⧗ 準備 ')+durTxt(pd.ready-G.t),p[0],p[1]-22,'11px sans-serif','#5D4037');}});
  G.msgs.forEach(function(m){if(sides.indexOf(m.side)<0)return;var u=uById(m.to);if(!u)return;var sel=UI.sel.indexOf(u.id)>=0||UI.sel.indexOf(m.from)>=0;if(selOnly&&!sel)return;var f=(G.t-m.t0)/Math.max(1,m.ta-m.t0),x=m.x0+(u.x-m.x0)*clamp(f,0,1),y=m.y0+(u.y-m.y0)*clamp(f,0,1),p=w2s(x,y),q=w2s(u.x,u.y);
    c.strokeStyle='rgba(120,80,20,.7)';c.setLineDash([2,4]);c.lineWidth=1.5;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke();c.setLineDash([]);c.fillStyle=m.lost?'#C62828':'#8D6E63';c.beginPath();c.arc(p[0],p[1],4,0,2*PI);c.fill();txtHalo(c,'✉ '+durTxt(m.ta-G.t),p[0],p[1]-9,'10.5px sans-serif','#4E342E');});c.restore();}
function drawMissions(c){c.save();G.units.forEach(function(u){if(!u.mis||!alive(u))return;if(UI.side>=0&&u.side!==UI.side&&!seeAll())return;var M=u.mis,p=w2s(M.x,M.y),r=M.r/mpp(),act=G.t>=M.start;c.strokeStyle=act?'rgba(239,108,0,.9)':'rgba(239,108,0,.45)';c.fillStyle=act?'rgba(255,152,0,.18)':'rgba(255,152,0,.06)';c.beginPath();c.arc(p[0],p[1],Math.max(4,r),0,2*PI);c.fill();c.stroke();
    if(act&&G.t-(u.lastArt||-1e9)<DT*2&&UI.lay.fx){var q=w2s(u.x,u.y);c.setLineDash([2,6]);c.beginPath();c.moveTo(q[0],q[1]);c.lineTo(p[0],p[1]);c.stroke();c.setLineDash([]);}});c.restore();}
function drawFx(c){var keep=[];c.save();G._fx.forEach(function(f){var age=G.t-f[5];if(age>DT*2)return;keep.push(f);var p=w2s(f[0],f[1]),q=w2s(f[2],f[3]);c.strokeStyle=f[4]==='art'?'rgba(255,111,0,.5)':f[4]==='melee'?'rgba(183,28,28,.85)':f[4]==='aa'||f[4]==='air'?'rgba(41,98,255,.6)':f[4]==='breath'?'rgba(255,61,0,.9)':'rgba(255,214,0,.75)';c.lineWidth=f[4]==='melee'?3:1.2;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke();});G._fx=keep;c.restore();}
function drawBattles(c){c.save();G.bt.list.forEach(function(R){if(R.parent||(!R.active&&!UI.showOld))return;var x=(R.bb[0]+R.bb[2])/2,y=(R.bb[1]+R.bb[3])/2,p=w2s(x,y),col=TIERC[R.tier];if(UI.selB===R.id){var a=w2s(R.bb[0],R.bb[1]),b=w2s(R.bb[2],R.bb[3]);c.strokeStyle=col;c.setLineDash([5,4]);c.strokeRect(a[0]-8,a[1]-8,b[0]-a[0]+16,b[1]-a[1]+16);c.setLineDash([]);}
    c.globalAlpha=R.active?1:0.45;c.fillStyle=col;c.beginPath();c.arc(p[0],p[1],9,0,2*PI);c.fill();c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.moveTo(p[0]-5,p[1]-5);c.lineTo(p[0]+5,p[1]+5);c.moveTo(p[0]+5,p[1]-5);c.lineTo(p[0]-5,p[1]+5);c.stroke();
    if(VW.s>0.5)txtHalo(c,R.name,p[0],p[1]+17,'bold 11px sans-serif',col);c.globalAlpha=1;R._sx=p[0];R._sy=p[1];});c.restore();}
function drawObjs(c){c.save();(G.obj||[]).forEach(function(o){var p=w2s(o.x,o.y),col=o.own>=0?sideCol(o.own):'#555';c.strokeStyle=col;c.lineWidth=1.5;c.setLineDash([4,4]);c.beginPath();c.arc(p[0],p[1],obR(o)/mpp(),0,2*PI);c.stroke();c.setLineDash([]);
    c.fillStyle=col;c.beginPath();for(var i=0;i<10;i++){var a=-PI/2+i*PI/5,r=i%2?5:11;c.lineTo(p[0]+Math.cos(a)*r,p[1]+Math.sin(a)*r);}c.closePath();c.fill();c.strokeStyle='#fff';c.lineWidth=1.5;c.stroke();txtHalo(c,o.name+'（'+(o.pts||10)+'）',p[0],p[1]-16,'bold 12px sans-serif',col);o._sx=p[0];o._sy=p[1];});c.restore();}
var NODEI={off:'⛺',port:'⚓',air:'✈',rail:'🚉',depot:'▣'};
function drawNodes(c){c.save();SIDES().forEach(function(side){if(UI.side>=0&&side!==UI.side&&!seeAll())return;(G.sides[side].nodes||[]).forEach(function(N){var p=w2s(N.x,N.y),col=N.status==='captured'?'#9E9E9E':N.status==='contested'?'#E0A100':sideCol(side);
      if(N.k==='depot'){var U=upOf(N);if(U){var q=w2s(U.x,U.y);c.strokeStyle=col;c.globalAlpha=0.55;c.lineWidth=2;c.setLineDash([8,5]);c.beginPath();c.moveTo(q[0],q[1]);c.lineTo(p[0],p[1]);c.stroke();c.setLineDash([]);c.globalAlpha=1;}}
      c.fillStyle='#fff';c.strokeStyle=col;c.lineWidth=2;c.beginPath();c.rect(p[0]-11,p[1]-11,22,22);c.fill();c.stroke();c.font='14px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle=col;c.fillText(typeof nodeIco==='function'?nodeIco(N):NODEI[N.k]||'■',p[0],p[1]+1);N._sx=p[0];N._sy=p[1];
      if(VW.s>0.6)txtHalo(c,N.name,p[0],p[1]+20,'11px sans-serif','#222');});});c.restore();}
/* 工具預覽（命令箭頭、畫線、部署方向） */
function drawTool(c){var T=UI.tool,hv=VW.hover;drawInk(c);if(!hv)return;c.save();if(T==='ord'&&UI.ord&&UI.sel.length){var u=uById(UI.sel[0]);if(u){var p=w2s(u.x,u.y);if(VW.drag&&VW.drag.kind==='line'){var a=w2s(VW.drag.wx,VW.drag.wy);c.strokeStyle='#212121';c.lineWidth=3;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(hv.sx,hv.sy);c.stroke();}else arrow(c,p[0],p[1],hv.sx,hv.sy,ORDC[UI.ord.k]||'#333',[6,4],2);
      if(UI.ord.r&&/bombard|strike|patrol|bomb/.test(UI.ord.k)){c.strokeStyle=ORDC[UI.ord.k];c.beginPath();c.arc(hv.sx,hv.sy,UI.ord.r/mpp(),0,2*PI);c.stroke();}
      if(UI.ord.k==='nuke'){var IRn=Math.max.apply(null,(isLeaf(u)?[u]:leavesOf(u)).map(function(x){return nukeCap(x)>0&&ST(x).dom!=='air'?indOf(x,ST(x)):0;}).concat([0]));if(IRn>0){c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=1.2;c.setLineDash([2,6]);c.beginPath();c.arc(p[0],p[1],IRn/mpp(),0,2*PI);c.stroke();c.setLineDash([]);}var NR=(typeof nwhPrevR==='function'?nwhPrevR:nukeR)(typeof nkYEff==='function'?nkYEff([u]):UI.ordOpt.Y||10);['rgba(255,255,255,.9)','rgba(244,67,54,.9)','rgba(255,152,0,.85)','rgba(255,235,59,.8)'].forEach(function(col,i){c.strokeStyle=col;c.lineWidth=i?1.5:2.5;c.setLineDash(i?[5,4]:[]);c.beginPath();c.arc(hv.sx,hv.sy,Math.max(3,NR[i]/mpp()),0,2*PI);c.stroke();});c.setLineDash([]);}
      if(UI.ord.k==='siege'){var SR=UI.ordOpt.sr||2000;c.strokeStyle='rgba(183,28,28,.8)';c.setLineDash([8,6]);c.lineWidth=2;c.beginPath();c.arc(hv.sx,hv.sy,SR/mpp(),0,2*PI);c.stroke();c.setLineDash([]);}}}
  if(T==='place'&&VW.drag&&VW.drag.kind==='place'){var a2=w2s(VW.drag.wx,VW.drag.wy);arrow(c,a2[0],a2[1],hv.sx,hv.sy,'#1565C0',null,2);}
  if((T==='paint'||T==='elev'||T==='fort'||T==='river'||T==='erase')&&UI.brush){c.strokeStyle='rgba(0,0,0,.6)';c.lineWidth=1;c.beginPath();c.arc(hv.sx,hv.sy,UI.brush*VW.s,0,2*PI);c.stroke();}
  if((T==='road'||T==='rail'||T==='hsr'||T==='bridge'||T==='tunnel')&&UI.roadA){var a3=w2s(UI.roadA[0],UI.roadA[1]);c.strokeStyle=T==='rail'?'#333':T==='hsr'?'#2E54AA':'#D2482E';c.setLineDash([6,4]);c.lineWidth=2;c.beginPath();c.moveTo(a3[0],a3[1]);c.lineTo(hv.sx,hv.sy);c.stroke();}
  if(VW.drag&&VW.drag.kind==='box'){c.strokeStyle='#1565C0';c.fillStyle='rgba(21,101,192,.12)';var b=VW.drag;c.fillRect(Math.min(b.sx0,hv.sx),Math.min(b.sy0,hv.sy),Math.abs(hv.sx-b.sx0),Math.abs(hv.sy-b.sy0));c.strokeRect(Math.min(b.sx0,hv.sx),Math.min(b.sy0,hv.sy),Math.abs(hv.sx-b.sx0),Math.abs(hv.sy-b.sy0));}
  c.restore();}
/* ---------- 點選 ---------- */
function hitAt(sx,sy){var best=null,bd=1e9;(VW.items||[]).forEach(function(it){if(it.sx===undefined)return;var d=dist(sx,sy,it.sx,it.sy);if(d<Math.max(12,(it.h||14)*0.9)&&d<bd){bd=d;best=it;}});return best;}
function hitObj(sx,sy){var o=null;(G.obj||[]).forEach(function(q){if(q._sx!==undefined&&dist(sx,sy,q._sx,q._sy)<13)o=q;});return o;}
function hitNode(sx,sy){var o=null;SIDES().forEach(function(s){(G.sides[s].nodes||[]).forEach(function(N){if(N._sx!==undefined&&dist(sx,sy,N._sx,N._sy)<13)o=N;});});return o;}
function hitBattle(sx,sy){var o=null;if(!G.bt)return null;G.bt.list.forEach(function(R){if(R._sx!==undefined&&!R.parent&&(R.active||UI.showOld)&&dist(sx,sy,R._sx,R._sy)<11)o=R;});return o;}
/* ---------- 指標事件 ---------- */
/* 可以按住拖曳畫線下令的命令（防線、造路、轟炸區等）；其他模組會再加入 */
var LINEORD={defend:1};
/* 可以按住拖曳圈出範圍下令的命令：值為函式，回傳 true 時這次拖曳畫的是範圍（例如轟炸區選了「自訂範圍」） */
var POLYORD={};
function vPt(e){var r=VW.wrap.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];}
function vDown(e){if(e.target.closest('.lw-zm,.lw-ly,.lw-mode'))return;VW.wrap.setPointerCapture&&VW.wrap.setPointerCapture(e.pointerId);var p=vPt(e);VW.ptr[e.pointerId]=p;var ids=Object.keys(VW.ptr);
  if(ids.length===2){var a=VW.ptr[ids[0]],b=VW.ptr[ids[1]];VW.pinch={d:dist(a[0],a[1],b[0],b[1]),s:VW.s,ox:VW.ox,oy:VW.oy,cx:(a[0]+b[0])/2,cy:(a[1]+b[1])/2};VW.drag=null;return;}
  var w=s2w(p[0],p[1]);VW.drag={sx0:p[0],sy0:p[1],ox:VW.ox,oy:VW.oy,wx:w[0],wy:w[1],moved:false,kind:'pan',btn:e.button};var T=UI.tool;
  if(e.button===2)return;if(T==='draw'){VW.drag.kind='draw';VW.drag.pts=[w[0],w[1]];return;}if(T==='ord'&&UI.ord&&POLYORD[UI.ord.k]&&POLYORD[UI.ord.k]()){VW.drag.kind='draw';VW.drag.ord=1;VW.drag.pts=[w[0],w[1]];return;}if(T==='ord'&&UI.ord&&LINEORD[UI.ord.k])VW.drag.kind='line';else if(T==='place')VW.drag.kind='place';else if(T==='sel'&&e.shiftKey)VW.drag.kind='box';
  else if((T==='paint'||T==='elev'||T==='fort'||T==='river'||T==='erase')){VW.drag.kind='paint';if(UI.onPaint)UI.onPaint(w[0],w[1],e);}
  else if(T==='sel'&&UI.canDrag){var it=hitAt(p[0],p[1]);if(it&&it.u&&UI.canDrag(it.u)){VW.drag.kind='unit';VW.drag.it=it;}}}
function vMove(e){var p=vPt(e);if(VW.ptr[e.pointerId])VW.ptr[e.pointerId]=p;var w=s2w(p[0],p[1]);VW.hover={sx:p[0],sy:p[1],wx:w[0],wy:w[1]};
  if(VW.pinch){var ids=Object.keys(VW.ptr);if(ids.length>=2){var a=VW.ptr[ids[0]],b=VW.ptr[ids[1]],d=dist(a[0],a[1],b[0],b[1]),f=d/Math.max(1,VW.pinch.d),s=clamp(VW.pinch.s*f,(VW.s0||0.2)*0.6,60);VW.s=s;VW.ox=VW.pinch.cx-(VW.pinch.cx-VW.pinch.ox)*s/VW.pinch.s;VW.oy=VW.pinch.cy-(VW.pinch.cy-VW.pinch.oy)*s/VW.pinch.s;vDraw(true);}return;}
  var D=VW.drag;if(D){if(dist(p[0],p[1],D.sx0,D.sy0)>5)D.moved=true;if(D.kind==='draw'){var Lp=D.pts;if(dist(w[0],w[1],Lp[Lp.length-2],Lp[Lp.length-1])>mpp()*4)Lp.push(w[0],w[1]);vDraw(false);return;}if(D.kind==='pan'&&D.moved){VW.ox=D.ox+p[0]-D.sx0;VW.oy=D.oy+p[1]-D.sy0;vDraw(true);return;}
    if(D.kind==='paint'&&UI.onPaint){UI.onPaint(w[0],w[1],e);return;}if(D.kind==='unit'&&D.moved&&UI.onDragUnit){UI.onDragUnit(D.it,w[0],w[1],false);vDraw(false);return;}vDraw(false);return;}
  if(e.pointerType==='mouse'){tipAt(p[0],p[1],w);if(UI.tool!=='sel')vDraw(false);}}
function vUp(e){var p=vPt(e);delete VW.ptr[e.pointerId];if(VW.pinch){if(Object.keys(VW.ptr).length<2)VW.pinch=null;VW.drag=null;return;}var D=VW.drag;VW.drag=null;if(!D)return;var w=s2w(p[0],p[1]);
  if(D.btn===2){if(UI.onRight)UI.onRight(w[0],w[1]);return;}
  if(D.kind==='draw'&&D.ord){if(D.moved&&D.pts.length>=6&&UI.onPoly)UI.onPoly(D.pts.concat([w[0],w[1]]));else toast('請按住滑鼠（或手指）在地圖上拖曳，圈出範圍。');vDraw(false);return;}
  if(D.kind==='draw'){if(D.moved&&D.pts.length>=4)drawDone(DR.k,D.pts.concat([w[0],w[1]]));else toast('請按住滑鼠（或手指）在地圖上拖曳手繪。');vDraw(false);return;}
  if(D.kind==='pan'&&D.moved){vDraw(true);return;}
  if(D.kind==='box'){var x0=Math.min(D.sx0,p[0]),x1=Math.max(D.sx0,p[0]),y0=Math.min(D.sy0,p[1]),y1=Math.max(D.sy0,p[1]),sel=[];(VW.items||[]).forEach(function(it){if(it.u&&it.sx>=x0&&it.sx<=x1&&it.sy>=y0&&it.sy<=y1&&(UI.side<0||it.u.side===UI.side))sel.push(it.u.id);});UI.sel=sel;if(UI.onSel)UI.onSel();vDraw(false);return;}
  if(D.kind==='line'&&D.moved){if(UI.onLine)UI.onLine(D.wx,D.wy,w[0],w[1]);vDraw(false);return;}
  if(D.kind==='place'){if(UI.onPlace)UI.onPlace(D.wx,D.wy,D.moved?Math.atan2(w[1]-D.wy,w[0]-D.wx):null);vDraw(true);return;}
  if(D.kind==='unit'&&D.moved){if(UI.onDragUnit)UI.onDragUnit(D.it,w[0],w[1],true);vDraw(true);return;}
  if(D.kind==='paint'){if(UI.onPaintEnd)UI.onPaintEnd();return;}
  if(UI.onClick)UI.onClick(w[0],w[1],p[0],p[1],e);vDraw(false);}
function tipAt(sx,sy,w){var t='';var it=hitAt(sx,sy);if(it){if(it.c){var cc=it.c;t=(cc.q>=1&&cc.name?cc.name:'不明敵軍')+'（'+(BR[cc.br]||'')+'）\n估計 '+fmt(cc.men)+' 人'+(cc.veh?'、'+fmt(cc.veh)+' 件裝備':'')+'\n最後回報：'+durTxt(G.t-cc.t)+'前'+(cc.dead?'（已殲滅）':'');}
    else{var u=it.u,s=it.s,sm=strengthOf(u);t=uName(u)+(it.agg?'（'+ECH[u.ech][1]+'）':'')+'\n'+(isLeaf(u)?mixName(u)+'\n':'')+'兵力 '+fmt(sm.men)+'／'+fmt(sm.men0)+(sm.veh0?'，裝備 '+fmt(sm.veh)+'／'+fmt(sm.veh0):'')+'\n'+(u.ord?'命令：'+ORDN[u.ord.k]:'待命')+(isLeaf(u)?'，士氣 '+fmt(u.mor)+(u.ms!=='ok'?'（'+MSN[u.ms]+'）':''):'');void s;}}
  else{var o=hitObj(sx,sy);if(o)t='目標：'+o.name+'（'+(o.pts||10)+' 分）\n範圍：半徑 '+kmTxt(obR(o))+'\n控制：'+(o.own>=0?G.sides[o.own].name:'無');else{var N=hitNode(sx,sy);if(N)t=nodeTip(N);else{var R=hitBattle(sx,sy);if(R){var V=btView(R);t=V.name+'（'+V.tierN+'）\n雙方投入 '+fmt(V.men)+' 人\n'+V.res.txt;}else t=cellTip(w[0],w[1]);}}}
  if(t){VW.tip.textContent=t;VW.tip.hidden=false;var x=sx+14,y=sy+14;if(x>VW.cw-220)x=sx-230;if(y>VW.ch-90)y=sy-100;VW.tip.style.left=x+'px';VW.tip.style.top=y+'px';}else VW.tip.hidden=true;}
var MSN={ok:'正常',shaken:'動搖',rout:'潰散'};
function mixName(u){return (u.mix||[]).map(function(m){var t=typeOf(m[0]);return (t?t.n:m[0])+(m[1]>1?'×'+m[1]:'');}).join('＋');}
function cellTip(x,y){var MP=G.map;if(x<0||y<0||x>MP.Wm||y>MP.Hm)return '';var k=cellAt(x,y),o=LC[MP.lc[k]][1]+'，標高 '+fmt(MP.el[k])+' 公尺';if(MP.rd[k])o+='，'+RD[MP.rd[k]][1]+(typeof rdCapTip==='function'?rdCapTip(k,x,y):'');if(MP.rl[k]&1)o+='，鐵道';if(MP.rl[k]&2)o+='，高鐵（高架）';if(MP.tn&&MP.tn[k])o+='（隧道）';var bq=MP.brg.filter(function(q){return q.y*MP.GW+q.x===k;})[0];if(bq)o+='，'+(BRT[bq.t||'p']||'橋梁');if(MP.rv[k])o+='，'+RVN[MP.rv[k]];if(MP.ft[k])o+='，'+FTN[MP.ft[k]];o+='\n座標 '+fmt(x/1000,2)+', '+fmt(y/1000,2)+' 公里';return o;}
var FTN=['','塹壕','鐵絲網','雷區','碉堡','堡壘（稜堡）','城牆'];
function nodeTip(N){var o=G.sides[N.side].name+' '+LOGK[N.k][0]+'「'+N.name+'」';if(N.k==='off')return o+'\n無限存量';var day=sum(N.hist.slice(-144),function(v){return v;});o+='\n吞吐量 '+fmt(N.thr)+' 噸／日'+(N.k==='depot'?'（車隊 '+N.cv.n+' 輛 × '+fx(N.cv.pay,1)+' 噸）':'')+'\n近 24 小時進貨 '+fmt(day,1)+' 噸\n存量：'+LCLS.map(function(c){return LCN[c]+' '+fmt(N.st[c],1);}).join('、')+' 噸\n狀態：'+({ok:'正常',contested:'遭威脅',captured:'被佔領'})[N.status]+(N.why?'（'+N.why+'）':'');return o;}

/* ---------- 兵力投射與特殊效果：輻射區、核爆、包圍圈、空運中的部隊、登陸艇 ---------- */
function drawProj(c){var sides=UI.side<0||!G.set.fog?SIDES():[UI.side];c.save();
  (G.rad||[]).forEach(function(z){var p=w2s(z.x,z.y),r=z.r/mpp();c.fillStyle='rgba(205,220,57,.16)';c.strokeStyle='rgba(130,119,23,.85)';c.setLineDash([6,4]);c.lineWidth=1.5;c.beginPath();c.arc(p[0],p[1],Math.max(4,r),0,2*PI);c.fill();c.stroke();c.setLineDash([]);if(r>12)txtHalo(c,'☢ 輻射區',p[0],p[1]-r-8,'bold 11px sans-serif','#6D6A12');});
  (G.nukes||[]).forEach(function(n){var age=G.t-n.t;if(age<0||age>1500)return;var p=w2s(n.x,n.y),k=1-age/1500;[3,2,1,0].forEach(function(i){var r=n.R[i]/mpp();c.fillStyle=['rgba(255,235,59,','rgba(255,152,0,','rgba(244,67,54,','rgba(255,255,255,'][i]+((0.1+0.08*(3-i))*k).toFixed(3)+')';c.beginPath();c.arc(p[0],p[1],Math.max(3,r),0,2*PI);c.fill();});txtHalo(c,'☢ '+fmt(n.Y,n.Y<1?2:0)+' kt',p[0],p[1],'bold 13px sans-serif','#B71C1C');});
  (G.sieges||[]).forEach(function(q){if(sides.indexOf(q.side)<0)return;var p=w2s(q.x,q.y),r=q.r/mpp();c.strokeStyle=q.done?'rgba(183,28,28,.85)':'rgba(183,28,28,.45)';c.lineWidth=2;c.setLineDash(q.done?[]:[8,6]);c.beginPath();c.arc(p[0],p[1],r,0,2*PI);c.stroke();c.setLineDash([]);if(VW.s>0.3)txtHalo(c,q.done?'包圍圈':'圍攻中',p[0],p[1]-r-8,'bold 11px sans-serif','#B71C1C');});
  G.units.forEach(function(u){if(u.st!=='lift'||sides.indexOf(u.side)<0||!isLeaf(u))return;var L=u.lift;if(L&&L.c)return;var p=w2s(u.x,u.y),col=sideCol(u.side);
    if(L&&L.x1!==undefined){var q=w2s(L.x1,L.y1);c.strokeStyle=col;c.globalAlpha=0.55;c.setLineDash([4,5]);c.lineWidth=1.5;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke();c.setLineDash([]);c.beginPath();c.arc(q[0],q[1],7,0,2*PI);c.stroke();c.globalAlpha=1;}
    c.save();c.translate(p[0],p[1]);c.rotate(u.hd||0);c.fillStyle=col;c.strokeStyle='#fff';c.lineWidth=1.2;c.beginPath();c.moveTo(10,0);c.lineTo(-7,-8);c.lineTo(-3,0);c.lineTo(-7,8);c.closePath();c.fill();c.stroke();c.restore();
    if(VW.s>1)txtHalo(c,((L&&L.m==='heli')?'機降 ':'傘降 ')+shortName(u),p[0],p[1]-13,'10.5px sans-serif',col);});
  (G.xings||[]).forEach(function(X){if(sides.indexOf(X.side)<0)return;var p=w2s(X.x,X.y),col=sideCol(X.side);c.fillStyle='rgba(255,255,255,.9)';c.strokeStyle=col;c.lineWidth=1.6;c.beginPath();c.moveTo(p[0]-8,p[1]-2);c.lineTo(p[0]+8,p[1]-2);c.lineTo(p[0]+5,p[1]+4);c.lineTo(p[0]-5,p[1]+4);c.closePath();c.fill();c.stroke();if(X.kind==='ferry'){c.fillStyle=col;c.fillRect(p[0]-3,p[1]-7,6,5);}if(VW.s>1)txtHalo(c,XSN[X.kind],p[0],p[1]+14,'10.5px sans-serif',col);});
  G.units.forEach(function(u){if(!u.amph||!onMap(u)||sides.indexOf(u.side)<0)return;var p=w2s(u.x,u.y),h=u.hd||0;c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=1.5;for(var i=1;i<=2;i++){c.beginPath();c.arc(p[0]-Math.cos(h)*9*i,p[1]-Math.sin(h)*9*i,4+3*i,h+PI-0.7,h+PI+0.7);c.stroke();}});
  c.restore();}

/* ---------- 橋梁符號（放大時）：常設橋梁、工兵便橋、浮橋、突擊橋 ---------- */
function brgGroups(){var MP=G.map,key=(G._mapv||0)+'|'+MP.brg.length;if(MP._bgK===key&&MP._bg)return MP._bg;var cells={},GW=MP.GW,N=GW*MP.GH,seen={},out=[];MP.brg.forEach(function(q){cells[q.y*GW+q.x]=q;});
  MP.brg.forEach(function(q){var k0=q.y*GW+q.x;if(seen[k0])return;var st=[k0],L=[];seen[k0]=1;while(st.length){var k=st.pop();L.push(cells[k]);var x=k%GW,y=(k/GW)|0;for(var b=-1;b<=1;b++)for(var a=-1;a<=1;a++){var n=(y+b)*GW+x+a;if(n>=0&&n<N&&cells[n]&&!seen[n]){seen[n]=1;st.push(n);}}}
    var cx=0,cy=0;L.forEach(function(c){cx+=c.x;cy+=c.y;});cx/=L.length;cy/=L.length;var ang=0;
    if(L.length>=2){var sxx=0,syy=0,sxy=0;L.forEach(function(c){var dx=c.x-cx,dy=c.y-cy;sxx+=dx*dx;syy+=dy*dy;sxy+=dx*dy;});ang=0.5*Math.atan2(2*sxy,sxx-syy);}
    else{var rx=0,ry=0;for(var b2=-1;b2<=1;b2++)for(var a2=-1;a2<=1;a2++){if(!a2&&!b2)continue;var n2=(L[0].y+b2)*GW+L[0].x+a2;if(n2>=0&&n2<N&&(MP.rd[n2]||MP.rl[n2])&&!cells[n2]){rx+=a2;ry+=b2;}}ang=Math.atan2(ry,rx);}
    var half=0;L.forEach(function(c){var pj=Math.abs((c.x-cx)*Math.cos(ang)+(c.y-cy)*Math.sin(ang));if(pj>half)half=pj;});out.push({x:(cx+0.5)*MP.cs,y:(cy+0.5)*MP.cs,a:ang,h:(half+0.75)*MP.cs,t:L[0].t||'p'});});
  MP._bg=out;MP._bgK=key;return out;}
function drawBridges(c){var B=brgGroups(),m=mpp();c.save();c.lineCap='round';B.forEach(function(g){var p=w2s(g.x,g.y);if(p[0]<-60||p[1]<-60||p[0]>VW.cw+60||p[1]>VW.ch+60)return;var h=Math.max(4,g.h/m),w=Math.max(2.2,Math.min(5,25/m)),ca=Math.cos(g.a),sa=Math.sin(g.a),nx=-sa,ny=ca,f=2.6;
    c.strokeStyle=g.t==='f'?'#7A6A12':g.t==='a'?'#00695C':g.t==='e'?'#6D4C41':'#262626';c.lineWidth=1.6;if(g.t==='f')c.setLineDash([3,2]);
    [-1,1].forEach(function(sg){var ox=nx*w*sg,oy=ny*w*sg;c.beginPath();c.moveTo(p[0]-ca*(h+f)+ox+nx*sg*f,p[1]-sa*(h+f)+oy+ny*sg*f);c.lineTo(p[0]-ca*h+ox,p[1]-sa*h+oy);c.lineTo(p[0]+ca*h+ox,p[1]+sa*h+oy);c.lineTo(p[0]+ca*(h+f)+ox+nx*sg*f,p[1]+sa*(h+f)+oy+ny*sg*f);c.stroke();});c.setLineDash([]);});c.restore();}
