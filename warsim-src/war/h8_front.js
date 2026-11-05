/* ===================== 戰線：雙方地面部隊的影響力場 → 控制區，兩方控制區的交界就是戰線；每小時存一次歷史（戰報圖表、推進比較、回放） ===================== */
function frontInit(){var MP=G.map,cs=Math.max(250,Math.ceil(Math.max(MP.Wm,MP.Hm)/110/50)*50),W=Math.ceil(MP.Wm/cs),H=Math.ceil(MP.Hm/cs),N=W*H,wet=new Uint8Array(N);
  for(var j=0;j<H;j++)for(var i=0;i<W;i++){var n=0,w=0;for(var b=0;b<3;b++)for(var a=0;a<3;a++){var x=(i+(a+0.5)/3)*cs,y=(j+(b+0.5)/3)*cs;if(x>=MP.Wm||y>=MP.Hm)continue;n++;if(isWater(MP.lc[cellAt(x,y)]))w++;}wet[j*W+i]=!n||w>n*0.6?1:0;}
  G.front={cs:cs,W:W,H:H,own:new Int8Array(N).fill(-1),wet:wet,hist:[],ver:1,nextH:0,init:0};return G.front;}
/* exp(-x) 查表（x 到 3.2 為止，每格 1/400）：前線影響力只需要概略值 */
var FEXS=400,FEXP=(function(){var t=new Float32Array(3.3*400|0);for(var i=0;i<t.length;i++)t[i]=Math.exp(-(i+0.5)/400);return t;})();
function frontStep(){var F=G.front;if(!F||!F.own||!F.wet)F=frontInit();var W=F.W,H=F.H,cs=F.cs,N=W*H,I=SIDES().map(function(){return new Float32Array(N);}),first=!F.init,any=sA0();
  G.units.forEach(function(u){if(!onMap(u)||!isLeaf(u)||u.ms==='rout'||u.amph)return;var s=ST(u);if(s.dom!=='land'||!I[u.side])return;any[u.side]=1;var w=Math.sqrt(u.men+u.veh*8+1),sg=clamp(rangeOf(s)*0.5+frontW(u)*0.5,500,3500),R=sg*2.5,k2=1/(2*sg*sg),A=I[u.side],
      i0=Math.max(0,Math.floor((u.x-R)/cs)),i1=Math.min(W-1,Math.floor((u.x+R)/cs)),j0=Math.max(0,Math.floor((u.y-R)/cs)),j1=Math.min(H-1,Math.floor((u.y+R)/cs));
    var RR=R*R,kq=k2*FEXS;for(var j=j0;j<=j1;j++){var dy=(j+0.5)*cs-u.y,dy2=dy*dy,row=j*W;for(var i=i0;i<=i1;i++){var dx=(i+0.5)*cs-u.x,d2=dx*dx+dy2;if(d2<=RR)A[row+i]+=w*FEXP[(d2*kq)|0];}}});
  if(first&&!any.some(function(v){return v;}))return;var ch=0,NI=I.length;
  if(NI<3){for(var k=0;k<N;k++){if(F.wet[k])continue;var a=I[0][k],b=I[1][k],o=F.own[k],n=o;if(first){if(a>0.2||b>0.2)n=a>=b?0:1;}else if(a>0.4&&a>b*2.2)n=0;else if(b>0.4&&b>a*2.2)n=1;if(n!==o){F.own[k]=n;ch++;}}}
  else for(k=0;k<N;k++){if(F.wet[k])continue;var t1=-1,v1=0,v2=0;for(var si=0;si<NI;si++){var v=I[si][k];if(v>v1){v2=v1;v1=v;t1=si;}else if(v>v2)v2=v;}var o3=F.own[k],n3=o3;if(first){if(v1>0.2)n3=t1;}else if(v1>0.4&&v1>v2*2.2)n3=t1;if(n3!==o3){F.own[k]=n3;ch++;}}
  if(first){F.init=1;frontFill(F);}if(ch||first)F.ver++;
  if(G.t>=(F.nextH||0)){F.nextH=G.t+1800;var c=sA0();for(k=0;k<N;k++){if(F.own[k]>=0)c[F.own[k]]++;}F.hist.push({t:G.t,o:rleEnc(F.own),a:c});if(F.hist.length>2000)F.hist.splice(1,1);}}
/* 開戰時：尚未有人控制的陸地，歸給最近的一方（兩軍之間的中線就是初始戰線） */
function frontFill(F){var W=F.W,H=F.H,q=[],h=0;for(var k=0;k<W*H;k++)if(F.own[k]>=0)q.push(k);while(h<q.length){var c=q[h++],x=c%W,y=(c/W)|0;for(var d=0;d<4;d++){var X=x+(d===0?1:d===1?-1:0),Y=y+(d===2?1:d===3?-1:0);if(X<0||Y<0||X>=W||Y>=H)continue;var n=Y*W+X;if(F.own[n]>=0||F.wet[n])continue;F.own[n]=F.own[c];q.push(n);}}}
function rleEnc(A){var o=[],v=A[0],n=0;for(var i=0;i<A.length;i++){if(A[i]===v)n++;else{o.push(v,n);v=A[i];n=1;}}o.push(v,n);return o;}
function rleDec(R,N){var A=new Int8Array(N).fill(-1),p=0;for(var i=0;i<R.length;i+=2){var v=R[i],n=R[i+1];for(var j=0;j<n&&p<N;j++)A[p++]=v;}return A;}
/* 等值線（marching squares）：只在雙方控制區相接處畫線 */
/* 三方：任兩方交界各畫一次 */
function frontSegsAll(own,W,H,cs){if(nSides()<3)return frontSegs(own,W,H,cs);var o=[];for(var a=0;a<nSides();a++)for(var b2=a+1;b2<nSides();b2++)o=o.concat(frontSegs(own,W,H,cs,a,b2));return o;}
function frontSegs(own,W,H,cs,sa,sb){if(sa===undefined){sa=0;sb=1;}var N=W*H,v=new Float32Array(N),b=new Float32Array(N),segs=[];for(var k=0;k<N;k++)v[k]=own[k]===sa?1:own[k]===sb?-1:0;
  for(var j=0;j<H;j++)for(var i=0;i<W;i++){var s=0,n=0;for(var dj=-1;dj<=1;dj++)for(var di=-1;di<=1;di++){var X=i+di,Y=j+dj;if(X<0||Y<0||X>=W||Y>=H)continue;s+=v[Y*W+X];n++;}b[j*W+i]=s/n;}
  function L(p,q,vp,vq){var t=vp/((vp-vq)||1e-9);t=clamp(t,0,1);return [p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];}
  for(j=0;j<H-1;j++)for(i=0;i<W-1;i++){var k0=j*W+i,a=b[k0],bq=b[k0+1],c=b[k0+W],d=b[k0+W+1],idx=(a>0?8:0)|(bq>0?4:0)|(d>0?2:0)|(c>0?1:0);if(idx===0||idx===15)continue;
    var h0=0,h1=0;for(var dj2=-1;dj2<=2&&!(h0&&h1);dj2++)for(var di2=-1;di2<=2;di2++){var X2=i+di2,Y2=j+dj2;if(X2<0||Y2<0||X2>=W||Y2>=H)continue;var o=own[Y2*W+X2];if(o===sa)h0=1;else if(o===sb)h1=1;}if(!h0||!h1)continue;
    var x0=(i+0.5)*cs,y0=(j+0.5)*cs,x1=x0+cs,y1=y0+cs,TL=[x0,y0],TR=[x1,y0],BR=[x1,y1],BL=[x0,y1],top=L(TL,TR,a,bq),right=L(TR,BR,bq,d),bot=L(BL,BR,c,d),left=L(TL,BL,a,c);
    switch(idx){case 1:case 14:segs.push(left,bot);break;case 2:case 13:segs.push(bot,right);break;case 3:case 12:segs.push(left,right);break;case 4:case 11:segs.push(top,right);break;case 5:segs.push(left,top,bot,right);break;case 6:case 9:segs.push(top,bot);break;case 7:case 8:segs.push(left,top);break;case 10:segs.push(left,bot,top,right);break;}}
  return segs;}
function frontAt(F,t){if(!F||!F.hist||!F.hist.length||t<F.hist[0].t)return null;var lo=0,hi=F.hist.length-1;while(lo<hi){var m=(lo+hi+1)>>1;if(F.hist[m].t<=t)lo=m;else hi=m-1;}return F.hist[lo];}
function frontOldSegs(F,t){var h=frontAt(F,t);if(!h)return null;if(!h._segs)h._segs=frontSegsAll(rleDec(h.o,F.W*F.H),F.W,F.H,F.cs);return h._segs;}
/* 繪製：控制區淡色、目前戰線（粗線）、三小時前的戰線（虛線，顯示推進） */
function drawFront(c){var F=G.front;if(!F||!F.own||!F.init)return;var p0=w2s(0,0),p1=w2s(F.W*F.cs,F.H*F.cs);
  if(F._cvV!==F.ver||!F._cv){F._cvV=F.ver;var cv=F._cv||(F._cv=mkCanvas(F.W,F.H)),x=cv.getContext('2d'),id=x.createImageData(F.W,F.H),D=id.data,cc=G.sides.map(function(S){return rgbOf(S.color);});
    for(var k=0;k<F.W*F.H;k++){var o=F.own[k];if(o<0||!cc[o])continue;D[k*4]=cc[o][0];D[k*4+1]=cc[o][1];D[k*4+2]=cc[o][2];D[k*4+3]=46;}x.putImageData(id,0,0);F._segs=frontSegsAll(F.own,F.W,F.H,F.cs);}
  c.save();c.imageSmoothingEnabled=true;c.drawImage(F._cv,p0[0],p0[1],p1[0]-p0[0],p1[1]-p0[1]);
  c.lineCap='round';c.lineJoin='round';var old=frontOldSegs(F,G.t-3*3600);if(old&&old.length){c.strokeStyle='rgba(94,30,120,.5)';c.lineWidth=1.6;c.setLineDash([6,5]);segDraw(c,old);c.setLineDash([]);}
  c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=6;segDraw(c,F._segs);c.strokeStyle='#5E1E78';c.lineWidth=3;segDraw(c,F._segs);c.restore();}
function segDraw(c,S){c.beginPath();for(var i=0;i+1<S.length;i+=2){var a=w2s(S[i][0],S[i][1]),b=w2s(S[i+1][0],S[i+1][1]);c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);}c.stroke();}
/* 控制面積（百分比）的時間序列 */
function frontSeries(){var F=G.front;if(!F||!F.hist)return [];var land=0;for(var k=0;k<F.W*F.H;k++)if(!F.wet||!F.wet[k])land++;land=land||1;return F.hist.map(function(h){return {t:h.t,a:h.a.map(function(v){return (v||0)/land*100;})};});}
function packFront(F){if(!F||!F.own)return null;return {cs:F.cs,W:F.W,H:F.H,own:rleEnc(F.own),hist:F.hist.map(function(h){return {t:h.t,o:h.o,a:h.a};}),nextH:F.nextH||0,init:F.init||0};}
function unpackFront(P){if(!P)return null;var F=frontInit();if(F.W!==P.W||F.H!==P.H)return F;F.own=rleDec(P.own,F.W*F.H);F.hist=P.hist||[];F.nextH=P.nextH||0;F.init=P.init||0;F.ver++;return F;}

/* ===================== 回放紀錄：每兩分鐘記錄每個單位的位置、兵力比例、狀態、方向 ===================== */
var RECDT=120;
function stCode(u){var st={ok:0,off:1,dead:2,base:3,air:4,lift:5}[u.st]||0,ms=u.ms==='rout'?2:u.ms==='shaken'?1:0;return st|(ms<<3)|(u.hqLost?32:0)|(u.amph?64:0)|(u.form==='march'?128:0)|(G.t-(u.fired||-1e9)<90?256:0)|(G.t-(u.uf||-1e9)<90?512:0)|(u.regT&&G.t<u.regT?1024:0);}
var STC=['ok','off','dead','base','air','lift','ok','ok'];
function recInit(){var MP=G.map;G.rec={v:1,dt:RECDT,q:Math.max(10,Math.ceil(Math.max(MP.Wm,MP.Hm)/65000)),fr:[],next:0};return G.rec;}
function recStep(){if(!G.started||G.set.rec===false)return;var R=G.rec||recInit();if(G.t<(R.next||0))return;R.next=G.t+R.dt;var U=G.units,A=new Uint16Array(U.length*6);
  U.forEach(function(u,i){var j=i*6,f0=(u.men0||0)+(u.veh0||0)*8,f=f0>0?((u.men||0)+(u.veh||0)*8)/f0:1;A[j]=u.id&65535;A[j+1]=clamp(Math.round(u.x/R.q),0,65535);A[j+2]=clamp(Math.round(u.y/R.q),0,65535);A[j+3]=clamp(Math.round(f*1000),0,65535);A[j+4]=stCode(u);A[j+5]=Math.round((((u.hd||0)%(2*PI))+2*PI)%(2*PI)/(2*PI)*255)&255;});
  R.fr.push({t:G.t,d:A,wx:G.env.wx,l:Math.round(G.env.light*100),ob:(G.obj||[]).map(function(o){return o.own;})});}

/* ===================== 回放檔：地圖、雙方、單位名冊（符號、隸屬）、逐格紀錄、事件、戰報、戰線、核爆 ===================== */
async function replayPack(){var MP=G.map;if(!G.rec||!G.rec.fr.length)throw new Error('目前的作戰還沒有回放紀錄（開戰後每兩分鐘記錄一次）。');
  return {format:'LatoWarReplay',v:1,saved:new Date().toISOString(),name:MP.name,map:await packMap(MP),set:G.set,sides:G.sides.map(function(S){return {name:S.name,color:S.color,edge:S.edge};}),types:G.types,imgs:G.imgs,wpns:G.wpns,
    units:G.units.map(function(u){return {id:u.id,side:u.side,name:u.name,p:u.p,ech:u.ech,mix:u.mix,hq:u.hq,kids:u.kids,img:u.img,men0:u.men0,veh0:u.veh0,isReinf:u.isReinf,arrived:u.arrived,deadT:u.deadT,why:u.why,kills:u.kills,cas:u.cas};}),
    rec:await packRec(G.rec),front:packFront(G.front),log:G.log,bt:{list:G.bt.list.map(function(R){var c={};for(var k in R)if(k.charAt(0)!=='_')c[k]=R[k];return c;}),seq:G.bt.seq},obj:(G.obj||[]).map(function(o){return {id:o.id,name:o.name,x:o.x,y:o.y,r:o.r,pts:o.pts,own:o.own};}),
    nukes:G.nukes||[],rad:G.rad||[],stats:G.stats,over:G.over,t:G.t};}
async function replayBuild(P){if(!P||P.format!=='LatoWarReplay')throw new Error('這不是作戰回放檔（.latowarreplay.json）。');var MP=await unpackMap(P.map),g=newGame(MP,P.set);
  g.replay=1;g.started=true;g.types=P.types||{};g.imgs=P.imgs||{};g.wpns=P.wpns||{};g.sides=(P.sides||[]).map(function(S,i){return Object.assign(newSide(i),S,{ai:false,depots:[]});});
  g.units=(P.units||[]).map(function(r){var u=Object.assign({x:0,y:0,hd:0,st:'off',ms:'ok',sup:0,fat:0,org:100,ammo:100,ent:0,form:'deployed',ord:null,pend:[],mor:60},r);u.men=u.men0||0;u.veh=u.veh0||0;if(!u.mix&&!u.kids)u.kids=[];return u;});
  g.log=P.log||[];g.bt={list:(P.bt&&P.bt.list)||[],byUnit:{},seq:(P.bt&&P.bt.seq)||0};g.obj=(P.obj||[]).map(function(o){return Object.assign({},o,{own0:o.own});});g.nukes=P.nukes||[];g.rad0=P.rad||[];g.rad=[];g.stats=P.stats||[stat0(),stat0()];
  g.over={why:'回放',win:P.over?P.over.win:-1,t:P.t||0,replay:1};g.overR=P.over||null;g.rec=await unpackRec(P.rec);if(!g.rec||!g.rec.fr.length)throw new Error('回放檔中沒有紀錄資料。');
  g._frontP=P.front;g.env={wx:0,T:15,light:1,phase:'day',mud:0,snow:0,vis:1,alt:30,moon:0.5,frozen:false};g.ct=[{},{}];g.msgs=[];g.t=g.rec.fr[0].t;g.tEnd=g.rec.fr[g.rec.fr.length-1].t;g.name=P.name||MP.name;return g;}
/* 設定回放時間：在兩格紀錄之間內插位置 */
function replaySeek(t){var R=G.rec,F=R.fr;if(!F.length)return;t=clamp(t,F[0].t,F[F.length-1].t);var lo=0,hi=F.length-1;while(lo<hi){var m=(lo+hi+1)>>1;if(F[m].t<=t)lo=m;else hi=m-1;}
  var a=F[lo],b=F[Math.min(F.length-1,lo+1)],f=b.t>a.t?(t-a.t)/(b.t-a.t):0,q=R.q,pb={};if(b!==a)for(var j=0;j<b.d.length;j+=6)pb[b.d[j]]=j;var seen={};
  for(var i=0;i<a.d.length;i+=6){var id=a.d[i],u=G._ix[id];if(!u)continue;seen[id]=1;var x=a.d[i+1]*q,y=a.d[i+2]*q,sc=a.d[i+4],st=STC[sc&7],jb=pb[id];
    if(jb!==undefined&&(b.d[jb+4]&7)===(sc&7)){x+=(b.d[jb+1]*q-x)*f;y+=(b.d[jb+2]*q-y)*f;}
    u.x=x;u.y=y;u.st=st;u.ms=(sc>>3&3)===2?'rout':(sc>>3&3)===1?'shaken':'ok';u.hqLost=sc&32?1:0;u.amph=sc&64?{}:null;u.form=sc&128?'march':'deployed';u.fired=sc&256?t:-1e9;u.uf=sc&512?t:-1e9;u.regT=sc&1024?t+1:0;
    var fr=a.d[i+3]/1000;u.men=(u.men0||0)*fr;u.veh=(u.veh0||0)*fr;u.hd=a.d[i+5]/255*2*PI;}
  G.units.forEach(function(u){if(!seen[u.id])u.st='off';});G.t=t;G.env.wx=a.wx||0;G.env.light=(a.l===undefined?100:a.l)/100;G.env.phase=G.env.light>=0.99?'day':G.env.light<0.3?'night':'dusk';G.env.vis=WX[G.env.wx][2];
  (G.obj||[]).forEach(function(o,i){o.own=a.ob&&a.ob[i]!==undefined?a.ob[i]:-1;});
  G.bt.list.forEach(function(B){B.active=!B.parent&&B.t0<=t&&(B.end||B.t1||1e18)+120>=t;});
  G.rad=(G.rad0||[]).filter(function(z){return z.t0<=t&&t<z.t1;});
  var Fr=G.front;if(Fr){var h=frontAt(Fr,t);var key=h?h.t:-1;if(Fr._rk!==key){Fr._rk=key;if(h){Fr.own=rleDec(h.o,Fr.W*Fr.H);Fr.init=1;}else Fr.init=0;Fr.ver++;}}}
