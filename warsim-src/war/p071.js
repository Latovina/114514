/* ===================== 指揮官頭像：向量繪製、自動產生、編輯器 =====================
   簡潔的平面向量風格，不畫五官，只用陰影帶出鼻樑與臉側。軍官與指揮官沒有設定時，依姓名、性別、年代與軍階自動產生；
   顯示在單位面板、兵力編成的指揮官欄與指揮官卡。聯機時可以把設計好的頭像直接設為自己的玩家頭像。 */
var PTSK=['#f6dcc8','#f1c9a5','#e8b98f','#d7a47a','#c58c5c','#a9703f','#8a5631','#6b3f24','#4f2d1a','#bccbe0','#c8e0c2','#e7c8e8'];
var PTHC=['#161616','#2f2420','#4a3426','#6b4a33','#8a5a3b','#a34a2a','#c46a32','#d8b26a','#ecdcb4','#8f8f8f','#d9d9d9','#f2f2f2','#9db8de','#e58fb2','#7c5aa8','#4f8a5b','#3d5fa8','#b5162b'];
var PTUC=['#7a2b2b','#2c3e70','#2f3b66','#5f6046','#5c6142','#4b5a3c','#3f4a3a','#2d3138','#6b6f74','#556b8a','#8a7a5a','#e9e6dc'];
var PTBG=['#dfe6ee','#e9e2d6','#d9e4d5','#efd9d9','#e3dcef','#d6e7ea','#f1ead0','#cfd6dd','#2e3440','#4a3f35'];
var PTANIMAL=['cat','fox','wolf','rabbit','lop','dog','bear','mouse','horn'];
function ptHex(c){c=String(c||'').replace('#','');return [parseInt(c.slice(0,2),16)||0,parseInt(c.slice(2,4),16)||0,parseInt(c.slice(4,6),16)||0];}
function ptHexOf(a){return '#'+a.map(function(v){v=clamp(Math.round(v),0,255);return (v<16?'0':'')+v.toString(16);}).join('');}
function ptShade(c,f){return ptHexOf(ptHex(c).map(function(v){return f>=0?v*(1-f):v+(255-v)*(-f);}));}
function ptMix(a,b,t){var A=ptHex(a),B=ptHex(b);return ptHexOf(A.map(function(v,i){return v+(B[i]-v)*t;}));}
/* ---------- 自動產生 ---------- */
function ptAuto(seed,o){o=o||{};var r=mb32(hstr('pt|'+seed)),pick=function(A){return A[Math.floor(r()*A.length)];},w=function(L){var s=0,i;for(i=0;i<L.length;i++)s+=L[i][1];var x=r()*s;for(i=0;i<L.length;i++){x-=L[i][1];if(x<=0)return L[i][0];}return L[0][0];};
  var y=o.y||1940,e=o.ech||1,old=e>=5?0.45:e>=3?0.18:0.06,fem=!!o.fem;
  var sk=w([[PTSK[0],2],[PTSK[1],3],[PTSK[2],3],[PTSK[3],3],[PTSK[4],2],[PTSK[5],2],[PTSK[6],1.5],[PTSK[7],1],[PTSK[8],0.6]]);
  var hc=r()<old?pick([PTHC[9],PTHC[10],PTHC[11]]):w([[PTHC[0],5],[PTHC[1],4],[PTHC[2],3],[PTHC[3],2],[PTHC[4],1.2],[PTHC[5],0.6],[PTHC[6],0.5],[PTHC[7],1.2],[PTHC[8],0.4]]);
  var hs=fem?w([['bob',3],['long',2],['pony',2],['bun',3],['wavy',1.5],['hime',1],['braid',1],['short',1.5],['side',1],['twin',0.3]]):w([['short',4],['side',4],['slick',3],['buzz',3],['mid',1.2],['undercut',1.2],['curly',1],['spiky',0.5],['bald',r()<old?3:0.6],['afro',0.3]]);
  if(y<1800&&!fem&&r()<0.5)hs=pick(['pony','long','slick']);
  var gl=r()<0.2?w([['thin',3],['gold',y<1960?3:1],['square',y>=1950?2:0.3],['half',y>=1940&&y<1990?2:0.3],['mono',y>=1800&&y<1945?1.5:0.1],['sun',y>=1940?0.8:0],['patch',0.25]]):'none';
  var sc=r()<0.1?pick(['cheekL','cheekR','brow','cross','nose','chin','claw']):'none';
  var ht=r()<0.4?(y<1780?'tricorne':y<1830?pick(['bicorne','shako']):y<1900?pick(['shako','cap']):y<1950?pick(['cap','garrison','helmet']):pick(['beret','patrol','cap','helmet'])):'none';
  var uc=y<1700?'#7a2b2b':y<1800?'#2c3e70':y<1870?'#2f3b66':y<1918?'#5f6046':y<1950?'#5c6142':y<2000?'#4b5a3c':y<2100?'#535b44':'#3a4250';
  var ac=o.side!==undefined&&o.side>=0&&typeof sideCol==='function'&&G?sideCol(o.side):'#6b7d93';
  return {sk:sk,hc:hc,ec:hc,uc:uc,bg:ptMix(ac,'#ffffff',0.78),hs:hs,ea:'human',gl:gl,sc:sc,ht:ht,ac:ac};}
/* 自訂值蓋過自動值；改了髮色但沒改獸耳色時，獸耳跟著髮色 */
function ptFull(p,base){var c=ptClean(p)||{},o=Object.assign({},base);Object.keys(c).forEach(function(k){o[k]=c[k];});if(!c.ec&&c.hc)o.ec=c.hc;return o;}
function ptOwnU(u){var c=u;while(c){if(c.off)return c;c=c.p>=0?uById(c.p):null;}return null;}
function ptOffP(off,u){var y=G&&G.set?G.set.y:1940;try{if(u)y=uEra(u).y;}catch(e){}return ptFull(off&&off.pt,ptAuto((off&&off.name||'')+'|'+(off&&off.f?'f':'m'),{fem:off&&off.f,y:y,ech:u?u.ech:1,side:u?u.side:-1}));}
function ptCmBase(s,i){var R=G.sides[s].cm&&G.sides[s].cm[i],T=typeof cmTop==='function'?cmTop(s,i):null;return T&&T.off?ptOffP(T.off,T):ptAuto((R&&R.n||'')+'|'+s,{y:G.set.y,ech:6,side:s});}
function ptCmP(s,i){var R=G.sides[s].cm&&G.sides[s].cm[i];return ptFull(R&&R.pt,ptCmBase(s,i));}
/* ---------- 繪製（viewBox 0 0 100 100） ---------- */
var PTN=0,PTCACHE={},PTCN=0;
function ptMir(s){return s+'<g transform="translate(100 0) scale(-1 1)">'+s+'</g>';}
function ptSeg(x1,y1,x2,y2,col,n){var o='<path d="M'+x1+','+y1+' L'+x2+','+y2+'" stroke="'+col+'" stroke-width="1.3" stroke-linecap="round"/>',dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy)||1,nx=-dy/L*1.3,ny=dx/L*1.3;
  for(var i=1;i<=(n||0);i++){var t=i/(n+1),x=x1+dx*t,y=y1+dy*t;o+='<path d="M'+(x-nx).toFixed(2)+','+(y-ny).toFixed(2)+' L'+(x+nx).toFixed(2)+','+(y+ny).toFixed(2)+'" stroke="'+col+'" stroke-width=".7" stroke-linecap="round"/>';}return o;}
function ptScar(sc,sk){if(!sc||sc==='none')return '';var c=ptMix(sk,'#b4505c',0.45),c2=ptMix(sk,'#b4505c',0.3);
  switch(sc){case 'cheekL':return ptSeg(37,47.5,42.2,57.5,c,3);case 'cheekR':return ptSeg(63,47.5,57.8,57.5,c,3);case 'brow':return '<g opacity=".85">'+ptSeg(55.6,33.5,61.8,47.5,c2,0)+'</g>';
    case 'cross':return ptSeg(36.2,49,42.8,56.2,c,0)+ptSeg(42.8,49,36.2,56.2,c,0);case 'nose':return ptSeg(44,45.6,56.5,44.2,c,2);case 'chin':return '<path d="M46,62.3 Q50,64.6 54,62.3" fill="none" stroke="'+c+'" stroke-width="1.3" stroke-linecap="round"/>';
    case 'claw':return '<g opacity=".9">'+ptSeg(56.2,46.5,61.2,57,c,0)+ptSeg(59.2,45.4,64.2,55.9,c,0)+ptSeg(53.2,47.6,58.2,58.1,c,0)+'</g>';}return '';}
function ptHairBack(hs,hc){var d={bob:'M26.5,58.5 C24.5,40 27,22 50,15.8 C73,22 75.5,40 73.5,58.5 C69,61.5 64,61.5 60.5,59 L39.5,59 C36,61.5 31,61.5 26.5,58.5 Z',
    hime:'M26.5,84 C24.5,60 24.5,35 31,24 C36,17.5 44,15.5 50,15.5 C56,15.5 64,17.5 69,24 C75.5,35 75.5,60 73.5,84 Z',
    long:'M27,86 C23.5,66 24,36 31,24 C36,17 44,15.2 50,15.2 C56,15.2 64,17 69,24 C76,36 76.5,66 73,86 Z',
    wavy:'M31,24 C36,17 44,15.2 50,15.2 C56,15.2 64,17 69,24 C74,30 77,38 74.5,46 C72.5,52 77.5,58 75.5,65 C73.8,71 78,77 74,86 L26,86 C22,77 26.2,71 24.5,65 C22.5,58 27.5,52 25.5,46 C23,38 26,30 31,24 Z',
    pony:'M63,27 C77,29 82,44 78.5,60 C76.5,69 72,76 67,80 C69.5,70 70.5,60 69,50 C68,43 66,37 61.5,32 Z'}[hs];
  if(hs==='twin')return ptMir('<path d="M33,27 C21,30 15.5,44 16.5,60 C17.5,69 21,76 25.5,80 C23,70 22.8,61 25.5,52 C27.5,45 30,39 34,34 Z" fill="'+hc+'"/>');
  if(hs==='afro')return '<circle cx="50" cy="37" r="27" fill="'+hc+'"/>';
  if(hs==='bun')return '<circle cx="50" cy="15" r="8.6" fill="'+hc+'"/><path d="M45,11.5 C47.5,9.6 51.5,9.4 54,11" fill="none" stroke="'+ptShade(hc,-0.25)+'" stroke-width="1" opacity=".7"/>';
  return d?'<path d="'+d+'" fill="'+hc+'"/>':'';}
function ptHairFront(hs,hc){var hd=ptShade(hc,0.25),hl=ptShade(hc,-0.28),f=function(d,x){return '<path d="'+d+'" fill="'+hc+'"'+(x||'')+'/>';},
    cap='M30.6,43 C29.2,27.5 38,18.6 50,18.6 C62,18.6 70.8,27.5 69.4,43 C68.2,36.8 66.6,33 64,30.8 C61.5,32.6 57.5,33.4 53.5,32.2 C51,33.8 47,34 43.5,32.6 C40,33.6 37,32.8 35.5,31.4 C33.4,34 31.8,38 30.6,43 Z',
    buzz='M31.2,40.5 C30.8,27 39,20.6 50,20.6 C61,20.6 69.2,27 68.8,40.5 C66.8,33 62,29 50,28.5 C38,29 33.2,33 31.2,40.5 Z',
    slick='M31,38.5 C30.5,25.5 39,18.8 50,18.8 C61,18.8 69.5,25.5 69,38.5 C67,31 63,27.6 50,27 C37,27.6 33,31 31,38.5 Z',
    bangs='M30.6,44 C29.2,27 38,18.6 50,18.6 C62,18.6 70.8,27 69.4,44 C68.6,38.5 68.1,35.5 67.4,33.6 L32.6,33.6 C31.9,35.5 31.4,38.5 30.6,44 Z',
    sweep='M30.6,46 C29,27 38.5,18.4 51,18.6 C63,18.8 71,27.5 69.4,46 C68.5,37 66,31 61,28.2 C55,31.2 45,34.6 37.5,36.2 C34,38.8 32,42 30.6,46 Z',
    streak='<path d="M37,23.5 C43,21 55,20.8 62.5,23.8" fill="none" stroke="'+hl+'" stroke-width="1.2" opacity=".6"/>';
  switch(hs){case 'bald':return '<path d="M39,25 C44,22.6 52,22.4 57,24" fill="none" stroke="#fff" stroke-width="1.4" opacity=".18"/>';
    case 'buzz':return f(buzz,' opacity=".92"');case 'short':return f(cap)+streak;
    case 'side':return f('M30.6,44 C29,27 38.5,18.4 51,18.6 C63,18.8 71,27.5 69.4,41 C68,34 66,30.5 62.5,28.6 C56.5,30.6 47.5,33.4 40,37.6 C36,39.8 33,41.8 30.6,44 Z')+'<path d="M57.5,19.4 C58.8,22.5 59.5,25.5 59.8,28.2" fill="none" stroke="'+hd+'" stroke-width="1"/>';
    case 'slick':case 'bun':return f(slick)+streak;
    case 'mid':return f('M30.4,48 C28.5,28 38,18.5 50,18.5 C62,18.5 71.5,28 69.6,48 C68.3,40 66.6,34.8 64.2,31.4 C59.5,29.8 54.8,26.8 50.6,23.4 L49.4,23.4 C45.2,26.8 40.5,29.8 35.8,31.4 C33.4,34.8 31.7,40 30.4,48 Z');
    case 'undercut':return f(buzz,' opacity=".38"')+f('M33.5,33 C32.5,22.5 40,16.2 50,16.2 C60,16.2 67.5,22.5 66.5,33 C63.5,29.2 57.5,27.6 50,28 C42.5,27.6 36.5,29.2 33.5,33 Z')+streak;
    case 'spiky':return f('M30.8,42 C30,33 31.5,27 34,24 L31.5,17.5 L38.5,20 L39,12.5 L45,17.5 L49,9.5 L53,16.5 L59.5,11.5 L60.5,19 L67.5,16.5 L66,23.5 C68.5,27 70,33 69.2,42 C67.5,35.5 64.5,31 60,29 C54,31.5 46,31.5 40,29 C35.5,31 32.5,35.5 30.8,42 Z');
    case 'curly':case 'afro':{var o=f(hs==='afro'?'M31,36 C31,24 39,19 50,19 C61,19 69,24 69,36 Z':buzz),n=hs==='afro'?9:11;for(var i=0;i<=n;i++){var a=Math.PI*(1.08+0.84*i/n),R=hs==='afro'?19:20.5;o+='<circle cx="'+(50+R*Math.cos(a)).toFixed(1)+'" cy="'+((hs==='afro'?40:37.5)+(hs==='afro'?14:18)*Math.sin(a)).toFixed(1)+'" r="'+(hs==='afro'?5.4:5)+'" fill="'+hc+'"/>';}return o;}
    case 'mohawk':return f(buzz,' opacity=".32"')+f('M45,30 C44,20 46,12 50,5.5 C54,12 56,20 55,30 C53,28.5 47,28.5 45,30 Z')+'<path d="M50,8 L50,27" stroke="'+hl+'" stroke-width=".8" opacity=".5"/>';
    case 'bob':case 'twin':return f(bangs)+(hs==='twin'?ptMir('<circle cx="32" cy="33.5" r="2.6" fill="#c0392b"/>'):'');
    case 'hime':return f(bangs)+ptMir('<path d="M30.7,38 L35.4,38 L35.8,63 L31.6,65.5 C30.3,57 30.2,47 30.7,38 Z" fill="'+hc+'"/>');
    case 'long':case 'wavy':return f(sweep)+ptMir('<path d="M31,40 C29.5,50 30,58 32.5,64 L34.4,63 C33,56 33,48 33.6,41 Z" fill="'+hc+'"/>');
    case 'pony':return f(slick)+streak+'<rect x="61.5" y="28.8" width="5" height="3.2" rx="1" transform="rotate(35 64 30.4)" fill="#c0392b"/>';
    case 'braid':{var b=f(sweep);for(var j=0;j<7;j++)b+='<ellipse cx="'+(66-0.6*j).toFixed(1)+'" cy="'+(48+5.4*j).toFixed(1)+'" rx="3.7" ry="3.2" fill="'+(j%2?hd:hc)+'"/>';return b+'<rect x="60.6" y="84" width="4.6" height="2.6" rx="1" fill="#c0392b"/>';}}
  return f(cap);}
function ptEars(ea,ec,sk){var pink='#f2b9c4',inner={cat:pink,rabbit:pink,lop:pink,mouse:pink,fox:'#fff4e6',wolf:ptShade(ec,-0.35),bear:ptShade(ec,0.28),dog:ptShade(ec,0.22),horn:'#000'}[ea],P=function(a,b){return '<path d="'+a+'" fill="'+ec+'"/>'+(b?'<path d="'+b+'" fill="'+inner+'"/>':'');};
  switch(ea){case 'cat':return ptMir(P('M34.5,31 C33,24 32,17.5 32.5,12.5 C37.5,15 42,18.5 45.5,23.5 Z','M36,27.5 C35.2,23 34.8,19.5 35,16.5 C38,18.5 40.5,20.5 42.5,23.2 Z'));
    case 'fox':return ptMir(P('M33,31 C30,22 28.5,13 29.5,6 C36.5,10 43,16 47,23 Z','M34.5,27.5 C32.8,21 32.2,15.5 32.6,11 C37,14 40.8,17.5 43.5,22 Z')+'<path d="M29.5,6 C31.5,7.4 33.4,8.8 35.2,10.4 L30.4,13.2 C29.8,10.6 29.5,8.3 29.5,6 Z" fill="'+ptShade(ec,0.55)+'"/>');
    case 'wolf':return ptMir(P('M34,31 C32,22 31,13 32.5,4.5 C38,11 43,17 46,24 Z','M35.5,27.5 C34.4,21.5 34,15 34.8,9.5 C38.5,14 41.2,18 43.2,23 Z'));
    case 'rabbit':return ptMir(P('M39,26.5 C34.5,19 32.5,8 35,1.5 C37.5,-1 41,0 42.5,4 C44.5,10 44.5,19 43.5,25.5 Z','M39.8,23 C37,16.5 36.2,9 37.6,4.5 C39,3.2 40.5,3.8 41.1,6 C42.2,11 42.2,17.5 41.6,22.5 Z'));
    case 'lop':return ptMir(P('M35,29 C27.5,28.5 22.5,36.5 21.5,47 C21,55 23.5,60.5 27,59.5 C30.5,58 31.5,49 33.8,39.5 Z','M32.5,33 C27.6,33.5 25,40 24.6,47.5 C24.4,53 25.6,56.4 27.3,55.8 C29.2,54.6 30,48 31.6,41 Z'));
    case 'dog':return ptMir(P('M34,29.5 C28,28.5 23.5,33 22.5,40 C21.8,46 24,50 27.5,49 C30.5,47.5 31.5,41 34,35 Z','M32.2,32 C28.4,31.8 25.8,35.4 25.2,40.2 C24.8,44 26,46.3 27.8,45.8 C29.6,45 30.5,40.8 32,36.4 Z'));
    case 'bear':return ptMir('<circle cx="33.5" cy="23.5" r="7" fill="'+ec+'"/><circle cx="33.8" cy="23.8" r="3.6" fill="'+inner+'"/>');
    case 'mouse':return ptMir('<circle cx="31.5" cy="24" r="10" fill="'+ec+'"/><circle cx="31.8" cy="24.3" r="6" fill="'+inner+'"/>');
    case 'horn':return ptMir('<path d="M38,25.5 C35.5,19.5 36,13 40,8.5 C39.6,14 40.6,19.2 43.2,24 Z" fill="#3a2f2a"/><path d="M38.6,21 C38.2,17.5 38.7,14 40,11.2" fill="none" stroke="#fff" stroke-width=".6" opacity=".35"/>');}return '';}
function ptGlasses(gl){var k='#2b2b2b';switch(gl){
    case 'thin':return '<g fill="rgba(255,255,255,.08)" stroke="'+k+'" stroke-width=".9"><circle cx="41.3" cy="44" r="6.2"/><circle cx="58.7" cy="44" r="6.2"/></g><path d="M47.5,43.6 Q50,42.2 52.5,43.6 M35.1,43.2 L31.2,42.2 M64.9,43.2 L68.8,42.2" stroke="'+k+'" stroke-width=".9" fill="none"/>';
    case 'gold':return '<g fill="rgba(255,250,220,.1)" stroke="#c9a227" stroke-width="1.1"><ellipse cx="41.3" cy="44" rx="6.5" ry="5.3"/><ellipse cx="58.7" cy="44" rx="6.5" ry="5.3"/></g><path d="M47.8,43.4 Q50,42 52.2,43.4 M34.8,43 L31.2,42 M65.2,43 L68.8,42" stroke="#c9a227" stroke-width="1" fill="none"/>';
    case 'square':return '<g fill="rgba(255,255,255,.06)" stroke="#1b1b1b" stroke-width="2.1"><rect x="34" y="39.2" width="13.4" height="9.6" rx="2.2"/><rect x="52.6" y="39.2" width="13.4" height="9.6" rx="2.2"/></g><path d="M47.4,43 L52.6,43 M34,42.4 L31,41.6 M66,42.4 L69,41.6" stroke="#1b1b1b" stroke-width="1.8"/>';
    case 'half':return ptMir('<path d="M34.6,43 C35,39.6 38,38.6 41.3,38.6 C44.6,38.6 47.6,39.6 48,43" fill="none" stroke="#222" stroke-width="2.4"/><path d="M34.6,43 C35.2,48.6 38.5,50.2 41.3,50.2 C44.1,50.2 47.4,48.6 48,43" fill="none" stroke="#b8bcc2" stroke-width=".7"/><path d="M34.6,42.2 L31,41.4" stroke="#222" stroke-width="1.4"/>')+'<path d="M48,42 Q50,41 52,42" stroke="#222" stroke-width="1.4" fill="none"/>';
    case 'sun':return ptMir('<path d="M34.2,40.6 C36,39 46,39 47.6,40.8 C48.4,45 46.2,50.6 41.2,50.6 C36.8,50.6 33.6,46 34.2,40.6 Z" fill="#1c232a" fill-opacity=".92" stroke="#9aa0a6" stroke-width=".6"/><path d="M36.5,42 C38,41.2 40,41 41.5,41.2" stroke="#fff" stroke-width=".8" opacity=".3" fill="none"/>')+'<path d="M47.6,41 Q50,40 52.4,41" stroke="#9aa0a6" stroke-width=".9" fill="none"/>';
    case 'mono':return '<circle cx="58.7" cy="44" r="6.3" fill="rgba(255,250,220,.12)" stroke="#c9a227" stroke-width="1.3"/><path d="M63.5,48.2 C66,55 66.5,62 64,70" fill="none" stroke="#c9a227" stroke-width=".7" stroke-dasharray="1.2 1"/>';
    case 'patch':return '<path d="M30.5,36.5 L47.6,42 M52.4,40.4 L69.4,34.6" stroke="#111" stroke-width="1.1"/><path d="M35,41.8 C35.8,38.6 39,37.8 41.6,38 C45,38.3 47.8,40.2 47.6,43.6 C47.3,47.6 44.3,50 41,50 C37.6,50 34.4,46.6 35,41.8 Z" fill="#151515"/>';}return '';}
function ptHat(ht,uc,ac,hc){var dk=ptShade(uc,0.3),gold='#d4af37';switch(ht){
    case 'beret':{var b=ptShade(ac,0.2);return '<path d="M27.5,32.5 C26.5,22 40,14.5 54,15.5 C66,16.5 74.5,22 72.5,28.5 C70.5,31.5 60,31.2 50,30.8 C40,30.8 31,31.8 27.5,32.5 Z" fill="'+b+'"/><path d="M28,32.3 C38,30.6 62,30.4 72,29.2" stroke="'+ptShade(b,0.35)+'" stroke-width="1.6" fill="none"/><circle cx="37.5" cy="25.5" r="2.6" fill="'+gold+'"/>';}
    case 'cap':return '<path d="M26.5,30.5 C25.5,21.5 36,13 50,13 C64,13 74.5,21.5 73.5,30.5 Z" fill="'+uc+'"/><path d="M33,17.5 C40,14.5 60,14.5 67,17.5" stroke="'+ptShade(uc,-0.25)+'" stroke-width="1" fill="none" opacity=".6"/><path d="M28.5,30 L71.5,30 L70.6,35.6 L29.4,35.6 Z" fill="'+ptShade(ac,0.25)+'"/><path d="M29.6,35.4 C38,40.6 62,40.6 70.4,35.4 L68.6,39.3 C60,43.4 40,43.4 31.4,39.3 Z" fill="#141414"/><circle cx="50" cy="26.5" r="2.8" fill="'+gold+'"/>';
    case 'garrison':return '<path d="M30.5,30.5 C32.5,22 42,17.8 50.5,17.4 C59,17.8 68,22 70,30.5 C61,27.6 40,27.6 30.5,30.5 Z" fill="'+uc+'"/><path d="M33,28.4 C42,25.8 59,25.8 67.6,28.4" stroke="'+dk+'" stroke-width="1" fill="none"/><circle cx="36.5" cy="25.6" r="1.8" fill="'+ac+'"/>';
    case 'patrol':return '<path d="M30,32.5 L32.2,17.5 C40,15.6 60,15.6 67.8,17.5 L70,32.5 Z" fill="'+uc+'"/><path d="M27.5,32.2 L72.5,32.2 L75,37 C62,35 38,35 25,37 Z" fill="'+ptShade(uc,0.25)+'"/>';
    case 'helmet':{var h=ptMix(uc,'#5a6342',0.5);return '<path d="M30.5,41 Q33,57 42.5,63.5 M69.5,41 Q67,57 57.5,63.5" stroke="#3b3a2c" stroke-width="1" fill="none"/><path d="M24.5,39 C24.5,20 36.5,10.5 50,10.5 C63.5,10.5 75.5,20 75.5,39 C75.5,41.2 72.4,42 70,41 C62,38.6 38,38.6 30,41 C27.6,42 24.5,41.2 24.5,39 Z" fill="'+h+'"/><path d="M33,17 C40,13 52,12.4 60,14.6" stroke="#fff" stroke-width="1.2" opacity=".18" fill="none"/>';}
    case 'ushanka':{var u='#5d4b3c';return ptMir('<path d="M26.8,31.5 C23.8,39.5 23.8,50 27.5,55.5 L33.2,52.6 L33.2,33.5 Z" fill="'+u+'"/>')+'<path d="M26.5,34 C25.5,20 37,11.5 50,11.5 C63,11.5 74.5,20 73.5,34 Z" fill="'+u+'"/><path d="M27.5,29 L72.5,29 L72.5,36.2 L27.5,36.2 Z" fill="'+ptShade(u,-0.25)+'"/><path d="M50,20.8 L51.2,23.6 L54.2,23.7 L51.8,25.5 L52.7,28.4 L50,26.7 L47.3,28.4 L48.2,25.5 L45.8,23.7 L48.8,23.6 Z" fill="#c62828"/>';}
    case 'shako':return '<path d="M33,31.5 L35.2,6.5 L64.8,6.5 L67,31.5 Z" fill="#1f2333"/><path d="M35,9.5 L65,9.5 L65.3,12.5 L34.7,12.5 Z" fill="'+gold+'"/><path d="M45.5,15 L54.5,15 L53.5,23 L50,25.5 L46.5,23 Z" fill="'+gold+'"/><path d="M31.5,31.5 C40,35.6 60,35.6 68.5,31.5 L68.5,34.3 C60,38.5 40,38.5 31.5,34.3 Z" fill="#111"/><ellipse cx="50" cy="4" rx="3" ry="4.5" fill="'+ac+'"/>';
    case 'bicorne':return '<path d="M13,31 C19,17 35,9.5 50,9.5 C65,9.5 81,17 87,31 C71,25.5 29,25.5 13,31 Z" fill="#151515"/><path d="M15,29.5 C21,17.5 35,11 50,11 C65,11 79,17.5 85,29.5" stroke="'+gold+'" stroke-width=".9" fill="none"/><circle cx="50" cy="16" r="3.4" fill="'+ac+'" stroke="#fff" stroke-width=".8"/>';
    case 'tricorne':return '<path d="M17.5,29.5 C21.5,18 34,11.5 50,11.5 C66,11.5 78.5,18 82.5,29.5 C76.5,27 70.5,28 66,30.5 C60,26.5 40,26.5 34,30.5 C29.5,28 23.5,27 17.5,29.5 Z" fill="#171717" stroke="'+gold+'" stroke-width=".9"/>';}return '';}
function ptSvg(p,px){p=p||{};var key=px+'|'+JSON.stringify(p);if(PTCACHE[key])return PTCACHE[key];
  var c=ptClean(p)||{},sk=c.sk||'#e8b98f',hc=c.hc||'#2f2420',ec=c.ec||hc,uc=c.uc||'#5c6142',bg=c.bg||'#dfe6ee',ac=/^#[0-9a-f]{6}$/i.test(p.ac||'')?p.ac:'#6b7d93',hs=c.hs||'short',ea=c.ea||'human',ht=c.ht||'none',sh=ptShade(sk,0.16),sh2=ptShade(sk,0.32),id='lwpt'+(++PTN),o=[],animal=PTANIMAL.indexOf(ea)>=0;
  o.push(ptHairBack(hs,hc));
  o.push('<path d="M6,100 L6,93 C8,81 22,74.5 38,72.5 L50,79 L62,72.5 C78,74.5 92,81 94,93 L94,100 Z" fill="'+uc+'"/><path d="M62,72.5 C78,74.5 92,81 94,93 L94,100 L74,100 C74,89 70,80 62,72.5 Z" fill="'+ptShade(uc,0.18)+'"/><path d="M40.5,72.8 L50,86 L59.5,72.8 L50,79.5 Z" fill="#efece6"/>'+ptMir('<path d="M40.5,73.3 L46,80.2 L43.6,81.8 L38.3,75 Z" fill="'+ac+'"/>'));
  o.push('<path d="M42.5,57 L42.5,73 Q50,78.5 57.5,73 L57.5,57 Z" fill="'+sh+'"/>');
  if(ea==='human')o.push(ptMir('<ellipse cx="31.3" cy="45" rx="3.7" ry="5.6" fill="'+sk+'"/><path d="M30.6,42.2 C29.3,44 29.5,47.2 31,48.6" fill="none" stroke="'+sh+'" stroke-width="1.1" stroke-linecap="round"/>'));
  if(ea==='elf')o.push(ptMir('<path d="M33,40.5 C26,36.5 19.5,31 13.5,23.5 C16.5,33 23,42.5 31.6,50.5 Z" fill="'+sk+'"/><path d="M29.5,42 C25.5,39 21.5,35 18.2,30.2" fill="none" stroke="'+sh+'" stroke-width="1" stroke-linecap="round"/>'));
  o.push('<path d="M50,21.5 C61.5,21.5 69,30 69,42.5 C69,55.5 60.5,66 50,66 C39.5,66 31,55.5 31,42.5 C31,30 38.5,21.5 50,21.5 Z" fill="'+sk+'"/>');
  o.push('<path d="M57.5,24.5 C65.5,29 69,36.5 69,43 C69,55.5 60.5,66 50,66 C56.5,62.5 61.6,54.5 61.8,44.5 C62,35.5 60.5,29 57.5,24.5 Z" fill="'+sh+'" opacity=".55"/><path d="M51.2,41.5 C52.8,46.5 55,50.5 54.4,53.4 C53.5,54.8 51.5,55 49.6,54.3 C51.6,53.4 52.6,52.3 52.3,50.4 C52.2,47.8 51.8,44.6 51.2,41.5 Z" fill="'+sh2+'" opacity=".6"/>');
  o.push(ptScar(c.sc,sk));
  if(animal&&ht==='none')o.push(ptEars(ea,ec,sk));
  o.push(ptHairFront(hs,hc));o.push(ptGlasses(c.gl));
  if(ht!=='none')o.push(ptHat(ht,uc,ac,hc));if(animal&&ht!=='none')o.push(ptEars(ea,ec,sk));
  var s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="'+px+'" height="'+px+'" class="lw-ptsvg"><defs><clipPath id="'+id+'"><rect width="100" height="100" rx="16"/></clipPath></defs><rect width="100" height="100" rx="16" fill="'+bg+'"/><g clip-path="url(#'+id+')">'+o.join('')+'</g></svg>';
  if(++PTCN>400){PTCACHE={};PTCN=0;}PTCACHE[key]=s;return s;}
function ptBtn(p,px,v,title){return '<button type="button" class="lw-ptbt" data-a="ptedit" data-v="'+v+'" title="'+esc(title||'編輯頭像')+'">'+ptSvg(p,px)+'</button>';}
/* ---------- 編輯器 ---------- */
var PTE={tg:null,p:null,base:null,tab:'hs'};
var PTTAB=[['hs','髮型',PTHS],['ea','耳朵',PTEA],['gl','眼鏡',PTGL],['sc','疤痕',PTSC],['ht','帽子',PTHT],['col','顏色',null]];
function ptMeKey(){return 'lato-mp-pt';}
function ptCanEdit(tg){if(!G&&tg.k!=='me'&&tg.k!=='free')return false;if(tg.k==='off'){var u=uById(tg.id);if(!u||!u.off)return false;if(typeof mpActive==='function'&&mpActive())return typeof cmPlMay==='function'?cmPlMay(u):u.side===MPS.view;return true;}
  if(tg.k==='cm'){if(typeof mpActive==='function'&&mpActive())return tg.s===MPS.view&&tg.i===(MPS.cm<0?0:MPS.cm);return true;}return true;}
function ptOpen(tg){var base,cur,title='';
  if(tg.k==='off'){var u=uById(tg.id);if(!u||!u.off)return;base=ptOffP(Object.assign({},u.off,{pt:null}),u);cur=ptClean(u.off.pt)||{};title=(u.off.rank||'')+' '+u.off.name+'（'+uName(u)+'）';}
  else if(tg.k==='cm'){var R=G.sides[tg.s].cm[tg.i];base=ptCmBase(tg.s,tg.i);cur=ptClean(R&&R.pt)||{};title=(R?R.n:'指揮官')+'（'+G.sides[tg.s].name+'）';}
  else{var nm=tg.k==='me'&&typeof MPS!=='undefined'&&MPS.user?MPS.user.name:'指揮官';base=ptAuto(nm,{y:2000});try{cur=ptClean(JSON.parse(localStorage.getItem(ptMeKey())||'null'))||{};}catch(e){cur={};}title=tg.k==='me'?'我的玩家頭像':'頭像';}
  PTE.tg=tg;PTE.base=base;PTE.p=Object.assign({},base,cur);if(!cur.ec&&cur.hc)PTE.p.ec=cur.hc;PTE.title=title;PTE.ro=!ptCanEdit(tg);ptDlg();}
function ptDlg(){var o='<h3>指揮官頭像<small>'+esc(PTE.title)+(PTE.ro?'（唯讀）':'')+'</small></h3><div class="lw-ptbody">'+ptBody()+'</div><div class="lw-row" style="flex-wrap:wrap">'+(PTE.ro?'':'<button type="button" class="lw-btn pri" data-a="ptok">套用</button>')+
    (typeof mpActive==='function'&&typeof MPS!=='undefined'&&MPS.user?'<button type="button" class="lw-btn" data-a="ptme" title="把這個頭像轉成圖片，設為自己的聯機玩家頭像">設為我的玩家頭像</button>':'')+'<button type="button" class="lw-btn" data-a="x">'+(PTE.ro?'關閉':'取消')+'</button></div>';UI.ptd&&UI.ptd.remove();UI.ptd=dlg(o,true);}
function ptBody(){var P=PTE.p,T=PTTAB.filter(function(t){return t[0]===PTE.tab;})[0]||PTTAB[0],o='<div class="lw-ptwrap"><div class="lw-ptprev">'+ptSvg(P,176)+
    '<div class="lw-row" style="flex-wrap:wrap;justify-content:center">'+(PTE.ro?'':'<button type="button" class="lw-btn sm" data-a="ptrnd">🎲 隨機</button><button type="button" class="lw-btn sm" data-a="ptauto">↺ 自動</button>')+'<button type="button" class="lw-btn sm" data-a="ptsvg">⇩ SVG</button><button type="button" class="lw-btn sm" data-a="ptpng">⇩ PNG</button></div></div><div class="lw-ptctl"><div class="lw-row" style="flex-wrap:wrap;gap:4px">'+
    PTTAB.map(function(t){return '<button type="button" class="lw-btn sm'+(t[0]===PTE.tab?' pri':'')+'" data-a="pttab" data-v="'+t[0]+'">'+t[1]+'</button>';}).join('')+'</div>';
  if(T[2])o+='<div class="lw-ptgrid">'+T[2].map(function(q){var Q=Object.assign({},P);Q[T[0]]=q[0];return '<button type="button" class="lw-ptopt'+(P[T[0]]===q[0]?' on':'')+'" data-a="ptset" data-v="'+T[0]+','+q[0]+'"'+(PTE.ro?' disabled':'')+'>'+ptSvg(Q,58)+'<div>'+esc(q[1])+'</div></button>';}).join('')+'</div>';
  else o+=[['sk','膚色',PTSK],['hc','髮色',PTHC],['ec','獸耳色',PTHC],['uc','服裝色',PTUC],['bg','背景色',PTBG]].map(function(r){if(r[0]==='ec'&&PTANIMAL.indexOf(P.ea)<0)return '';return '<div class="lw-ptcrow"><b>'+r[1]+'</b>'+r[2].map(function(c){return '<button type="button" class="lw-ptsw'+(P[r[0]]===c?' on':'')+'" style="background:'+c+'" data-a="ptset" data-v="'+r[0]+','+c+'" title="'+c+'"'+(PTE.ro?' disabled':'')+'></button>';}).join('')+
    '<input type="color" value="'+(P[r[0]]||'#888888')+'" data-c="ptcol" data-f="'+r[0]+'"'+(PTE.ro?' disabled':'')+' title="自訂顏色"></div>';}).join('')+'<div class="lw-note">膚色、髮色可以用色盤自由調整；獸耳預設跟著髮色。</div>';
  return o+'</div></div>';}
function ptRedraw(){var b=UI.ptd&&UI.ptd.querySelector('.lw-ptbody');if(b){var g=b.querySelector('.lw-ptgrid'),st=g?g.scrollTop:0;b.innerHTML=ptBody();g=b.querySelector('.lw-ptgrid');if(g)g.scrollTop=st;}}
ACT.pttab=function(b){PTE.tab=b.getAttribute('data-v');ptRedraw();};
ACT.ptset=function(b){var v=b.getAttribute('data-v'),i=v.indexOf(','),k=v.slice(0,i),x=v.slice(i+1);if(k==='hc'&&PTE.p.ec===PTE.p.hc)PTE.p.ec=x;PTE.p[k]=x;ptRedraw();};
CHG.ptcol=function(t){var k=t.getAttribute('data-f');if(!/^#[0-9a-fA-F]{6}$/.test(t.value))return;if(k==='hc'&&PTE.p.ec===PTE.p.hc)PTE.p.ec=t.value.toLowerCase();PTE.p[k]=t.value.toLowerCase();ptRedraw();};
ACT.ptrnd=function(){var r=mb32(hstr('ptr|'+Date.now()+'|'+Math.random())),pk=function(L){return L[Math.floor(r()*L.length)][0];},q=function(A){return A[Math.floor(r()*A.length)];};var P=PTE.p;P.hs=pk(PTHS);P.ea=r()<0.6?'human':pk(PTEA);P.gl=r()<0.55?'none':pk(PTGL);P.sc=r()<0.7?'none':pk(PTSC);P.ht=r()<0.5?'none':pk(PTHT);P.sk=q(PTSK);P.hc=q(PTHC);P.ec=P.hc;P.bg=q(PTBG);ptRedraw();};
ACT.ptauto=function(){PTE.p=Object.assign({},PTE.base);ptRedraw();};
/* 只存與自動值不同的部分：沒改的（例如依陣營變化的背景色）繼續自動 */
function ptOut(){var o={},B=PTE.base||{};PTCOL.concat(Object.keys(PTKEYS)).forEach(function(k){if(PTE.p[k]!==undefined&&PTE.p[k]!==B[k])o[k]=PTE.p[k];});if(o.ec&&o.ec===PTE.p.hc)delete o.ec;if(!o.hc&&PTE.p.ec===PTE.p.hc&&B.ec!==PTE.p.ec)o.ec=PTE.p.ec;return ptClean(o);}
ACT.ptok=function(){var tg=PTE.tg,p=ptOut();if(tg.k==='off'){var u=uById(tg.id);if(u){var r=ptSetU(u,p);if(r&&r.err){toast(r.err,4000);return;}if(u.off){if(p)u.off.pt=p;else delete u.off.pt;}}}
  else if(tg.k==='cm'){var R=G.sides[tg.s].cm[tg.i];if(R)R.pt=p;if(typeof cmBump==='function')try{cmBump();}catch(e){}}
  else{try{localStorage.setItem(ptMeKey(),JSON.stringify(p));}catch(e){}if(tg.k==='me'){ACT.ptme();return;}}
  UI.ptd&&UI.ptd.remove();UI.ptd=null;toast('頭像已更新。');ptAfter();};
function ptAfter(){try{if(UI.tab==='battle'&&typeof btStatus==='function')btStatus();if(UI.tab==='orbat'&&typeof obDet==='function')obDet();if(typeof tmRedraw==='function')tmRedraw();}catch(e){}}
function ptImgSrc(){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(ptSvg(Object.assign({},PTE.p),256));}
ACT.ptsvg=function(){download('頭像.svg',ptSvg(Object.assign({},PTE.p),512),'image/svg+xml');};
ACT.ptpng=function(){var img=new Image();img.onload=function(){var c=document.createElement('canvas');c.width=c.height=512;c.getContext('2d').drawImage(img,0,0,512,512);c.toBlob(function(b){var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='頭像.png';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);},'image/png');};img.src=ptImgSrc();};
ACT.ptme=function(){if(typeof mpAvUpload!=='function'||typeof MPS==='undefined'||!MPS.user){toast('請先登入聯機伺服器。');return;}try{localStorage.setItem(ptMeKey(),JSON.stringify(ptOut()));}catch(e){}
  mpAvSquare(ptImgSrc(),128).then(mpAvUpload).then(function(){toast('已設為你的玩家頭像。');UI.ptd&&UI.ptd.remove();UI.ptd=null;}).catch(function(e){toast('無法設定頭像：'+e.message,4500);});};
ACT.ptedit=function(b){var v=b.getAttribute('data-v').split(',');if(v[0]==='off')ptOpen({k:'off',id:+v[1]});else if(v[0]==='cm')ptOpen({k:'cm',s:+v[1],i:+v[2]});else ptOpen({k:v[0]});};
if(typeof mpWrapFn==='function')ptSetU=mpWrapFn('ptSetU',ptSetU);
/* ---------- 顯示位置 ---------- */
/* 作戰：單位面板的指揮官欄 */
(function(){if(typeof btStatus!=='function')return;var b=btStatus;btStatus=function(){b.apply(this,arguments);try{var el=btEl('bst');if(!el||!UI.sel||!UI.sel.length)return;var u=uById(UI.sel[0]),w=u&&ptOwnU(u);if(!w)return;
  var sp=[].filter.call(el.querySelectorAll('.lw-kv>span'),function(s){return s.textContent==='指揮官';})[0];if(!sp||!sp.nextElementSibling)return;var d=document.createElement('span');d.className='lw-ptin';d.innerHTML=ptBtn(ptOffP(w.off,w),40,'off,'+w.id,'指揮官頭像（點選編輯）');sp.nextElementSibling.insertBefore(d.firstChild,sp.nextElementSibling.firstChild);}catch(e){}};})();
/* 兵力編成：指揮官欄 */
(function(){if(typeof offHtml!=='function')return;var b=offHtml;offHtml=function(u){var o=b(u);if(!u||!u.off)return o;var h='<div class="lw-row" style="align-items:center">'+ptBtn(ptOffP(u.off,u),56,'off,'+u.id)+'<button type="button" class="lw-btn sm" data-a="ptedit" data-v="off,'+u.id+'">編輯頭像…</button></div>';var i=o.indexOf('</h4>');return i>=0?o.slice(0,i+5)+h+o.slice(i+5):h+o;};})();
/* 指揮官卡 */
(function(){if(typeof tmCardHtml!=='function')return;var b=tmCardHtml;tmCardHtml=function(side){var o=b(side),i=0;return o.replace(/(<div class="lw-v11cm"[^>]*><div class="lw-row">)/g,function(m){var k=i++;try{return m+ptBtn(ptCmP(side,k),34,'cm,'+side+','+k,'指揮官頭像');}catch(e){return m;}});};})();
/* 聯機大廳：用編輯器製作玩家頭像 */
(function(){if(typeof mpPgLobby!=='function')return;var b=mpPgLobby;mpPgLobby=function(){var o=b.apply(this,arguments);return o.replace('data-c="mpavf" hidden></label>','data-c="mpavf" hidden></label><button type="button" class="lw-btn sm" data-a="ptedit" data-v="me" title="用指揮官頭像編輯器設計自己的頭像">🎨 頭像編輯器</button>');};})();
(function(){var st=document.createElement('style');st.textContent='.lw-ptbt{padding:0;border:0;background:none;cursor:pointer;vertical-align:middle;line-height:0;margin-right:6px;border-radius:10px}.lw-ptbt svg{border-radius:9px;box-shadow:0 1px 3px rgba(0,0,0,.25)}.lw-ptbt:hover svg{box-shadow:0 0 0 2px #1565c0}'+
  '.lw-ptwrap{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start}.lw-ptprev{display:flex;flex-direction:column;align-items:center;gap:6px}.lw-ptprev svg{border-radius:18px;box-shadow:0 2px 10px rgba(0,0,0,.2)}.lw-ptctl{flex:1;min-width:260px}'+
  '.lw-ptgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:6px;max-height:46vh;overflow:auto;margin-top:6px}.lw-ptopt{border:2px solid transparent;border-radius:12px;padding:3px;background:none;cursor:pointer;text-align:center;font-size:11px;color:inherit}.lw-ptopt svg{border-radius:10px}.lw-ptopt.on{border-color:#1565c0;background:rgba(21,101,192,.08)}'+
  '.lw-ptcrow{display:flex;flex-wrap:wrap;align-items:center;gap:5px;margin:8px 0}.lw-ptcrow b{width:4.5em;font-size:12.5px}.lw-ptsw{width:22px;height:22px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #999;cursor:pointer;padding:0}.lw-ptsw.on{box-shadow:0 0 0 2.5px #1565c0}.lw-ptcrow input[type=color]{width:32px;height:24px;padding:0;border:0;background:none}';document.head.appendChild(st);})();
HELP14.push('<h4>指揮官頭像</h4><ul><li>每位軍官與指揮官都有簡潔的向量頭像（不畫五官，只用陰影帶出鼻樑）。沒有設定時依姓名、性別、年代與軍階自動產生，例如老將多半白髮，十八世紀常見三角帽與束髮，二十世紀常見大簷帽與鋼盔。</li><li>點單位面板或「兵力編成」指揮官欄的頭像，或指揮官卡上的頭像，就能編輯：髮型（19 種）、耳朵（一般、精靈耳、貓、狐、狼、兔、垂耳兔、犬、熊、鼠耳、惡魔角）、眼鏡（細框、金絲、粗框、半框、墨鏡、單眼鏡片、眼罩）、疤痕、帽子（貝雷帽、大簷帽、船形帽、作戰帽、鋼盔、毛帽、筒帽、二角帽、三角帽），膚色、髮色、獸耳色、服裝色與背景色可以用色盤自由調整。可以下載 SVG 或 PNG。</li><li>聯機時只能編輯自己指揮的部隊與自己的指揮官；大廳的「🎨 頭像編輯器」或編輯器裡的「設為我的玩家頭像」可以把設計好的頭像直接當成玩家頭像。</li></ul>');
