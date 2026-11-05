/* ===================== 聯機（伺服器權威）：各方視野的雙盲過濾、差異同步、客戶端套用、命令與設定修改的白名單 =====================
   伺服器執行完整模擬；每半秒替每一方整理「這一方知道的戰場」：本方部隊、設施、命令全部，敵方只有本方偵察到的接觸，
   看得到的車隊、戰俘縱隊、鐵公路破壞；地形變化（地圖每 32×32 格一塊）只有落在本方視野內的地塊才更新，其餘維持本方最後所知。
   每次只送出與上次不同的欄位，客戶端套用到自己的作戰狀態上，由原本的介面繪製；玩家的命令以白名單函式在伺服器上執行。 */
var MPX={};
var MPBS=32;
var MPLY=['el','lc','rv','rd','rl','ft','nat','dmg','tn','rdd','rld','fl','fire'];
function mpLyGet(k){if(!G)return null;if(k==='rdd')return G.rdd||null;if(k==='rld')return G.rld||null;if(k==='fl'||k==='fire')return G.evt&&G.evt[k]&&G.evt[k].length?G.evt[k]:null;var a=G.map&&G.map[k];return a&&a.length!==undefined&&a.buffer?a:null;}
function mpLySet(k,a){if(k==='rdd')G.rdd=a;else if(k==='rld')G.rld=a;else if(k==='fl'||k==='fire'){G.evt=G.evt||{};G.evt[k]=a;}else G.map[k]=a;}
function mpJ(v){return v===undefined?undefined:JSON.stringify(v);}
function mpPlain(o){return !!o&&typeof o==='object'&&!Array.isArray(o)&&!ArrayBuffer.isView(o);}
/* 結構差異：物件只送改變的子鍵（$o／$r），陣列只送改變的元素（$a）與新增在尾端的元素（$p）；其他直接整個送 */
function mpDD(p,v,d){if(p===v)return undefined;if(v===null||p===null||p===undefined||typeof v!=='object'||typeof p!=='object')return v;var va=Array.isArray(v);if(va!==Array.isArray(p))return v;
  if(d>6)return JSON.stringify(p)===JSON.stringify(v)?undefined:v;
  if(va){var n=v.length,m=p.length;if(n<m)return v;var o=null,c=0;for(var i=0;i<m;i++){var s=mpDD(p[i],v[i],d+1);if(s!==undefined){(o||(o={}))[i]=s;c++;}}if(c>4&&c>m*0.5)return v;if(!o&&n===m)return undefined;var R={};if(o)R.$a=o;if(n>m)R.$p=v.slice(m);return R;}
  var o2=null,r=null;for(var k in v){if(k.charCodeAt(0)===95)continue;var x=v[k];if(x===undefined||typeof x==='function')continue;var s2=mpDD(p[k],x,d+1);if(s2!==undefined)(o2||(o2={}))[k]=s2;}
  for(var k2 in p){var y=v[k2];if(y===undefined||typeof y==='function')(r||(r=[])).push(k2);}if(!o2&&!r)return undefined;var R2={$o:o2||{}};if(r)R2.$r=r;return R2;}
function mpPA(t,d){if(d===null||typeof d!=='object'||Array.isArray(d))return d;if(d.$o!==undefined||d.$r!==undefined){var o=mpPlain(t)?t:{};for(var k in d.$o)o[k]=mpPA(o[k],d.$o[k]);(d.$r||[]).forEach(function(q){delete o[q];});return o;}
  if(d.$a!==undefined||d.$p!==undefined){var a=Array.isArray(t)?t:[];if(d.$a)for(var i in d.$a)a[+i]=mpPA(a[+i],d.$a[i]);(d.$p||[]).forEach(function(x){a.push(x);});return a;}return d;}
/* 一個欄位與上次送出的值比較：數字有容許誤差（位置半公尺、士氣疲勞等 0.05，其餘小數 0.01；整數一律精確），物件比較 JSON 後送結構差異 */
var MPTOL={x:0.5,y:0.5,hd:0.01,fat:0.5,mor:0.3,morB:0.3,ent:0.02,org:0.3,sup:0.2,ammo:0.1,fuel:0.1,dis:0.3,sick:0.2,exp:0.05,trn:0.05,men:0.05,veh:0.02,wom:0.5,kid:0.5,eld:0.5,evac:0.5,fled:0.5,camp:0.5,n:0.05};
/* 變動頻繁但不急的內容：最多每隔幾秒（實際時間）送一次 */
var MPSLOW={mf:3000,ce:2000,'sides.0':2000,'sides.1':2000,'bt.byUnit':3000,'civ.dec':3000,'civ.cg':5000,aw:4000,lgLoad:1500};
var MPCLK=function(){return Date.now();};
function mpSlow(po,f,now){var w=MPSLOW[f];if(!w)return false;var k='\u0002'+f,t=po[k];if(t!==undefined&&now-t<w)return true;return false;}
function mpSlowMark(po,f,now){if(MPSLOW[f])po['\u0002'+f]=now;}
function mpFD(po,f,v){var t=typeof v,pv=po[f];if(v===null||t!=='object'){if(t==='number'&&typeof pv==='number'){if(v===pv)return null;if(isFinite(v)&&isFinite(pv)&&!(v===Math.floor(v)&&pv===Math.floor(pv))){var tol=MPTOL[f];if(tol===undefined)tol=0.01;if(Math.abs(v-pv)<=tol)return null;}}else if(pv===v)return null;po[f]=v;return [v];}
  var j='\u0001'+JSON.stringify(v);if(j===pv)return null;po[f]=j;if(typeof pv==='string'&&pv.charCodeAt(0)===1){var p;try{p=JSON.parse(pv.slice(1));}catch(e){return [v];}var dd=mpDD(p,v,0);return dd===undefined?null:[dd];}return [v];}
function mpClean(o){var c={};for(var k in o){if(k.charCodeAt(0)===95)continue;var v=o[k];if(typeof v==='function'||v===undefined)continue;c[k]=v;}return c;}
function mpOmit(o,ks){if(!o)return o;var c={};for(var k in o){if(ks.indexOf(k)>=0||k.charCodeAt(0)===95)continue;c[k]=o[k];}return c;}
function mpVals0(o){var a=[];for(var k in o)a.push(o[k]);return a;}

/* ---------- 一、視野格：本方部隊（含空中）目前看得到的範圍，用來過濾敵方車隊、戰俘縱隊、地形變化 ---------- */
function mpObs(side){var MP=G.map,B=Math.max(400,Math.ceil(Math.max(MP.Wm,MP.Hm)/220/100)*100),W=Math.ceil(MP.Wm/B),H=Math.ceil(MP.Hm/B),A=new Uint8Array(W*H);
  var mark=function(x,y,R){var i0=Math.max(0,Math.floor((x-R)/B)),i1=Math.min(W-1,Math.floor((x+R)/B)),j0=Math.max(0,Math.floor((y-R)/B)),j1=Math.min(H-1,Math.floor((y+R)/B)),RR=(R+B*0.7)*(R+B*0.7);
    for(var j=j0;j<=j1;j++){var dy=(j+0.5)*B-y;for(var i=i0;i<=i1;i++){var dx=(i+0.5)*B-x;if(dx*dx+dy*dy<=RR)A[j*W+i]=1;}}};
  if(side<0){A.fill(1);return {B:B,W:W,H:H,A:A};}
  G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||!onMap(u))return;var R=1500;try{var vi=visInfo(u);R=vi.R>0?vi.R:1200;}catch(e){}mark(u.x,u.y,clamp(R*1.1,800,40000));});
  (G.fac||[]).forEach(function(f){if(f.own===side&&f.hp>0)mark(f.x,f.y,1500);});
  return {B:B,W:W,H:H,A:A};}
function mpSeen(O,x,y){if(!O)return true;var i=Math.floor(x/O.B),j=Math.floor(y/O.B);if(i<0||j<0||i>=O.W||j>=O.H)return false;return O.A[j*O.W+i]===1;}
function mpSeenBox(O,x0,y0,x1,y1){if(!O)return true;var i0=Math.max(0,Math.floor(x0/O.B)),i1=Math.min(O.W-1,Math.floor(x1/O.B)),j0=Math.max(0,Math.floor(y0/O.B)),j1=Math.min(O.H-1,Math.floor(y1/O.B));for(var j=j0;j<=j1;j++)for(var i=i0;i<=i1;i++)if(O.A[j*O.W+i]===1)return true;return false;}

/* ---------- 二、各方的知覺戰線：本方部隊的影響力對上本方掌握的敵情接觸（不用敵軍真實位置） ---------- */
function mpFrontStep(side,X){var F=X.F;if(!F||!F.own){var g=G.front;G.front=null;F=frontInit();G.front=g;X.F=F;}
  var W=F.W,H=F.H,cs=F.cs,N=W*H,I=SIDES().map(function(){return new Float32Array(N);}),first=!F.init,any=sA0();
  var add=function(sd,x,y,w,sg){if(!I[sd])return;any[sd]=1;var R=sg*2.5,k2=1/(2*sg*sg),A=I[sd],i0=Math.max(0,Math.floor((x-R)/cs)),i1=Math.min(W-1,Math.floor((x+R)/cs)),j0=Math.max(0,Math.floor((y-R)/cs)),j1=Math.min(H-1,Math.floor((y+R)/cs)),RR=R*R,kq=k2*FEXS;
    for(var j=j0;j<=j1;j++){var dy=(j+0.5)*cs-y,dy2=dy*dy,row=j*W;for(var i=i0;i<=i1;i++){var dx=(i+0.5)*cs-x,d2=dx*dx+dy2;if(d2<=RR)A[row+i]+=w*FEXP[(d2*kq)|0];}}};
  G.units.forEach(function(u){if(u.side!==side||!onMap(u)||!isLeaf(u)||u.ms==='rout'||u.amph)return;var s=ST(u);if(s.dom!=='land')return;add(side,u.x,u.y,Math.sqrt(u.men+u.veh*8+1),clamp(rangeOf(s)*0.5+frontW(u)*0.5,500,3500));});
  var C=G.ct[side]||{};for(var id in C){var c=C[id];if(c.dead||c.dom!=='land'||G.t-c.t>3*3600)continue;add(nSides()<3?1-side:(c.side>=0&&c.side!==side?c.side:enemyOf(side)),c.x,c.y,Math.sqrt((c.men||100)+(c.veh||0)*8+1)*(G.t-c.t>3600?0.7:1),1400);}
  if(first&&!any.some(function(v){return v;}))return;var ch=0,NI=I.length;
  if(NI<3){for(var k=0;k<N;k++){if(F.wet[k])continue;var a=I[0][k],b=I[1][k],o=F.own[k],n=o;if(first){if(a>0.2||b>0.2)n=a>=b?0:1;}else if(a>0.4&&a>b*2.2)n=0;else if(b>0.4&&b>a*2.2)n=1;if(n!==o){F.own[k]=n;ch++;}}}
  else for(k=0;k<N;k++){if(F.wet[k])continue;var t1=-1,v1=0,v2=0;for(var si=0;si<NI;si++){var v=I[si][k];if(v>v1){v2=v1;v1=v;t1=si;}else if(v>v2)v2=v;}var o3=F.own[k],n3=o3;if(first){if(v1>0.2)n3=t1;}else if(v1>0.4&&v1>v2*2.2)n3=t1;if(n3!==o3){F.own[k]=n3;ch++;}}
  if(first){F.init=1;frontFill(F);}if(ch||first)F.ver++;
  if(G.t>=(F.nextH||0)){F.nextH=G.t+1800;var cn=sA0();for(k=0;k<N;k++){if(F.own[k]>=0)cn[F.own[k]]++;}F.hist.push({t:G.t,o:rleEnc(F.own),a:cn});if(F.hist.length>2000)F.hist.splice(1,1);}}

/* ---------- 三、各方看得到的集合與數值 ---------- */
function mpKnownIds(side){var C=G.ct[side]||{},o={};for(var id in C)o[id]=1;return o;}
function mpPubSide(S,i){var o=newSide(i);['name','color','edge','flag','ai','nm','nk'].forEach(function(k){if(S[k]!==undefined)o[k]=S[k];});o.cm=(S.cm||[]).map(function(R){return {n:R.n,ai:!!R.ai,roots:[]};});o.depots=[];o.nodes=[];return o;}
function mpBt(b,side,K){if(side<0)return b;var c=mpClean(b);if(Array.isArray(b.u)){c.u=b.u.map(function(m,sd){if(sd===side||!m)return m;var o={};for(var id in m)if(K[id])o[id]=m[id];return o;});}return c;}
function mpMeet(M,side,K){if(side<0)return M;var c=mpClean(M);if(Array.isArray(M.u))c.u=M.u.map(function(L,sd){return sd===side?L:(L||[]).filter(function(id){return K[id];});});if(Array.isArray(M.dec))c.dec=M.dec.map(function(d,sd){return sd===side?d:null;});if(Array.isArray(M.pl))c.pl=M.pl.map(function(L,sd){return sd===side?L:[];});return c;}
/* 集合：名稱、主鍵、伺服器端取得（已依視野過濾） */
var MPCOL=[
  ['u','id',function(s){return s<0?G.units:G.units.filter(function(u){return u.side===s;});}],
  ['ct','id',function(s){return s<0?[]:mpVals0(G.ct[s]||{});}],
  ['ctN','id',function(s){return s<0||!G.ctN?[]:mpVals0(G.ctN[s]||{});}],
  ['msg','id',function(s){return (G.msgs||[]).filter(function(m){return s<0||m.side===s;});}],
  ['lgv','id',function(s,O){return (G.lgv||[]).filter(function(V){return s<0||V.side===s||mpSeen(O,V.x,V.y);});}],
  ['fac','id',function(s){return (G.fac||[]).filter(function(f){return s<0||f.own===s||f.kn&&f.kn[s];});}],
  ['tp','id',function(){return G.tp||[];}],
  ['meet','id',function(s,O,K){return (G.meets||[]).filter(function(M){return s<0||M.u&&M.u[s]&&M.u[s].length;}).map(function(M){return mpMeet(M,s,K);});}],
  ['cS','i',function(){return G.civ&&G.civ.S||[];}],
  ['cR','id',function(){return G.civ&&G.civ.R||[];}],
  ['cP','id',function(s,O){return (G.civ&&G.civ.P||[]).filter(function(P){return s<0||P.side===s||mpSeen(O,P.x,P.y);});}],
  ['pR','id',function(s,O){return (G.press&&G.press.R||[]).filter(function(R){return s<0||R.host===s||R.side===s||mpSeen(O,R.x,R.y);});}],
  ['bt','id',function(s,O,K){return (G.bt&&G.bt.list||[]).map(function(b){return mpBt(b,s,K);});}],
  ['ib','id',function(s){return (G.inbox||[]).filter(function(m){return s<0||m.side===s;});}],
  ['dr','id',function(s){return (G.draw||[]).filter(function(D){return s<0||D.side===s;});}]];
var MPSEQ=['t','step','started','over','overR','tEnd','firstContact','tseq','wseq','dseq'];
function mpOwn(arr,s,f){f=f||'side';return (arr||[]).filter(function(q){return s<0||q[f]===s;});}
function mpPair(a,s,empty){if(!a)return a;if(s<0)return a;var n=Math.max(2,a.length||0,nSides()),o=[];for(var i=0;i<n;i++)o.push(i===s?a[i]:empty());return o;}
/* 數值：路徑、伺服器端取得（整個比較，物件只送改變的子鍵） */
function mpValList(s,O,K,X){var V=[],add=function(p,v){V.push([p,v]);},e=1-s;
  add('set',s<0?G.set:mpOmit(G.set,['seed']));MPSEQ.forEach(function(k){add(k,G[k]);});add('mapv',G._mapv||0);
  ['types','imgs','wpns','obj','env','wsys','hyd','fac8v','nukes','rad','fo','snS','cbUse'].forEach(function(k){add(k,G[k]);});
  add('stats',mpPair(G.stats,s,function(){return {};}));add('sieges',mpOwn(G.sieges,s));add('xings',mpOwn(G.xings,s));add('snq',mpOwn(G.snq,s));
  add('msl',(G.msl||[]).filter(function(S){return s<0||S.side===s||S.det;}));add('smk',(G.smk||[]).filter(function(q){return s<0||q.side===s||mpSeen(O,q.x,q.y);}));
  add('lgLoad',(function(){var L=G._lgLoad;if(!L)return undefined;if(s<0)return L;var o={};for(var k in L){var q=L[k];if(!q)continue;if(q[1+s]>0){o[k]=q;continue;}var pp=k.split('|');if(mpSeen(O,(+pp[0]+0.5)*500,(+pp[1]+0.5)*500))o[k]=q;}return o;})());
  add('sup',G.sup?{seq:G.sup.seq,calls:mpOwn(G.sup.calls,s),routes:mpOwn(G.sup.routes,s)}:undefined);
  add('aw',G.aw?Object.assign(mpOmit(G.aw,['s']),{s:mpPair(G.aw.s,s,function(){return {};})}):undefined);
  add('rlc',(G.rlc||[]).filter(function(q){return s<0||typeof rlKnown!=='function'||rlKnown(q.k,s);}));
  add('evt',G.evt?mpOmit(G.evt,['fl','fire']):undefined);add('lyOn',{fl:!!mpLyGet('fl'),fire:!!mpLyGet('fire'),rdd:!!G.rdd,rld:!!G.rld});
  add('cbx',(G.cbx||[]).filter(function(c){return s<0||c.side===s||mpSeen(O,c.x,c.y);}));
  add('cbgr',(function(){if(s<0||!G.cbgr)return G.cbgr;var o={},Bm=G.map.cs*8;for(var k in G.cbgr){var p=k.split('|');if(mpSeen(O,(+p[0]+0.5)*Bm,(+p[1]+0.5)*Bm))o[k]=G.cbgr[k];}return o;})());
  if(G.civ){var C=G.civ;for(var ck in C){if(ck==='S'||ck==='R'||ck==='P'||ck.charCodeAt(0)===95)continue;var cv=C[ck];
    if(s>=0){if(ck==='cs')cv=mpPair(cv,s,function(){return {};});else if(ck==='ev'||ck==='dec')cv=(cv||[]).filter(function(q){return q.s===s||q.s<0;});else if(ck==='wc')cv=(cv||[]).filter(function(q){return q.side===s||q.known;});
      else if(ck==='intel'&&cv&&typeof cv==='object'){var io={};for(var ik in cv)io[ik]=Array.isArray(cv[ik])?mpPair(cv[ik],s,function(){return 0;}):cv[ik];cv=io;}}
    add('civ.'+ck,cv);}}
  if(G.press){add('press.A',G.press.A);add('press.home',G.press.home);add('press.digT',G.press.digT);add('press.seq',G.press.seq);}
  if(G.bt){add('bt.seq',G.bt.seq);var bu=G.bt.byUnit||{};if(s>=0){var o2={};for(var bk in bu){var bx=uById(+bk);if(bx&&bx.side===s||K[bk])o2[bk]=bu[bk];}bu=o2;}add('bt.byUnit',bu);}
  SIDES().forEach(function(i){var S=G.sides[i];add('sides.'+i,s<0||i===s?mpClean(S):mpPubSide(S,i));});
  if(s>=0&&X&&X.F&&X.F.init)add('front',{cs:X.F.cs,W:X.F.W,H:X.F.H,own:rleEnc(X.F.own),nextH:X.F.nextH||0,init:1});else if(s<0&&G.front&&G.front.init)add('front',{cs:G.front.cs,W:G.front.W,H:G.front.H,own:rleEnc(G.front.own),nextH:G.front.nextH||0,init:1});
  if(s>=0){var tl=0;try{var a=sideStr(s).f,b=sideStr(enemyOf(s)).f,Ob=G.obj||[],tot=0,mine=0;Ob.forEach(function(o){var pp=o.pts||10;tot+=pp;if(o.own===s)mine+=pp;else if(o.own<0)mine+=pp/2;});tl=(a-b)+(tot?(mine/tot-0.5)*0.6:0);}catch(e){}add('tilt',Math.round(tl*10)/10);}
  add('ri',(function(){var L=G.rdiL,I=G.rdi;if(!L||!I||!L.length)return null;var o=[],MP=G.map;for(var i=0;i<L.length&&o.length<6000;i++){var k=L[i],x=(k%MP.GW+0.5)*MP.cs,y=((k/MP.GW|0)+0.5)*MP.cs;if(s<0||mpSeen(O,x,y))o.push(k,I[k]);}return o;})());
  void e;return V;}

/* ---------- 四、差異：與上次送給這一方的內容比較（每一方一份基準，同方玩家共用） ---------- */
function mpX(s){var k=String(s);return MPX[k]||(MPX[k]={B:{c:{},v:{}},lg:null,lgT:-1,fx:null,fxT:-1,fh:0,KM:null,KH:null,F:null});}
function mpReset(){MPX={};MPLH.t=-1e9;MPLH.H={};}
function mpTail(L,ref,lastT,tf){if(!L||!L.length)return [];if(ref){for(var i=L.length-1;i>=0;i--)if(L[i]===ref)return L.slice(i+1);}return L.filter(function(e){return tf(e)>lastT;});}
/* 地圖地塊的雜湊（所有方共用，最多每三秒算一次） */
var MPLH={t:-1e9,H:{}};
function mpHashBlk(a,k0,GW,x0,x1,y0,y1){var bpe=a.BYTES_PER_ELEMENT,u8=new Uint8Array(a.buffer,a.byteOffset,a.byteLength),h=2166136261;for(var y=y0;y<y1;y++){var o=(y*GW+x0)*bpe,e=(y*GW+x1)*bpe;for(var i=o;i<e;i++){h^=u8[i];h=Math.imul(h,16777619);}}return h>>>0;}
function mpBlkGeom(){var MP=G.map,BW=Math.ceil(MP.GW/MPBS),BH=Math.ceil(MP.GH/MPBS);return {BW:BW,BH:BH,n:BW*BH};}
function mpLyHash(force){var now=Date.now();if(!force&&now-MPLH.t<3000)return MPLH.H;MPLH.t=now;var MP=G.map,g=mpBlkGeom(),H={};
  MPLY.forEach(function(k){var a=mpLyGet(k);if(!a||a.length!==MP.GW*MP.GH)return;var h=new Uint32Array(g.n);for(var by=0;by<g.BH;by++)for(var bx=0;bx<g.BW;bx++){var x0=bx*MPBS,y0=by*MPBS;h[by*g.BW+bx]=mpHashBlk(a,0,MP.GW,x0,Math.min(MP.GW,x0+MPBS),y0,Math.min(MP.GH,y0+MPBS));}H[k]=h;});MPLH.H=H;return H;}
function taK(a){return typeof taKind==='function'?taKind(a):'u8';}
function mpBlkBytes(a,bx,by){var MP=G.map,bpe=a.BYTES_PER_ELEMENT,x0=bx*MPBS,y0=by*MPBS,x1=Math.min(MP.GW,x0+MPBS),y1=Math.min(MP.GH,y0+MPBS),w=(x1-x0)*bpe,out=new Uint8Array(w*(y1-y0)),u8=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);
  for(var y=y0;y<y1;y++)out.set(u8.subarray((y*MP.GW+x0)*bpe,(y*MP.GW+x1)*bpe),(y-y0)*w);return out;}
function mpBlkPut(a,bx,by,bytes){var MP=G.map,bpe=a.BYTES_PER_ELEMENT,x0=bx*MPBS,y0=by*MPBS,x1=Math.min(MP.GW,x0+MPBS),y1=Math.min(MP.GH,y0+MPBS),w=(x1-x0)*bpe,u8=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);
  for(var y=y0;y<y1;y++)u8.set(bytes.subarray((y-y0)*w,(y-y0+1)*w),(y*MP.GW+x0)*bpe);}
/* 本方所知的地圖：第一次建立時等於當時的地圖，之後只有看得到的地塊會更新 */
function mpKnownInit(X){var MP=G.map;X.KM={};X.KH={};var H=mpLyHash(true);MPLY.forEach(function(k){var a=mpLyGet(k);if(!a||a.length!==MP.GW*MP.GH)return;X.KM[k]=a.slice();X.KH[k]=H[k]?H[k].slice():null;});}
function mpLayers(s,X,O){var MP=G.map,g=mpBlkGeom(),H=mpLyHash(false),out=[];if(!X.KM)mpKnownInit(X);
  MPLY.forEach(function(k){var a=mpLyGet(k),h=H[k];if(!a||!h||a.length!==MP.GW*MP.GH)return;var km=X.KM[k],kh=X.KH[k];
    if(!km||km.constructor!==a.constructor||km.length!==a.length||!kh){km=X.KM[k]=new a.constructor(a.length);kh=X.KH[k]=new Uint32Array(g.n);for(var b0=0;b0<g.n;b0++){var zx=(b0%g.BW)*MPBS,zy=((b0/g.BW)|0)*MPBS;kh[b0]=mpHashBlk(km,0,MP.GW,zx,Math.min(MP.GW,zx+MPBS),zy,Math.min(MP.GH,zy+MPBS));}}
    for(var b=0;b<g.n;b++){if(h[b]===kh[b])continue;var bx=b%g.BW,by=(b/g.BW)|0;if(s>=0&&!mpSeenBox(O,bx*MPBS*MP.cs,by*MPBS*MP.cs,Math.min(MP.GW,(bx+1)*MPBS)*MP.cs,Math.min(MP.GH,(by+1)*MPBS)*MP.cs))continue;
      var bytes=mpBlkBytes(a,bx,by);mpBlkPut(km,bx,by,bytes);kh[b]=h[b];out.push([k,taK(a),b,b64enc(bytes)]);}});return out;}
var MPUX={km:1,kmX:1,movedAt:1,pat:1,formT:1,hqS:1,rcas:1};var MPUI={_ed:1,_eid:1};
function mpCollDiff(B,name,key,items){var P=B[name]||(B[name]={}),seen={},a=null,u=null,r=null,d=null,isU=name==='u',now=MPCLK();
  for(var i=0;i<items.length;i++){var o=items[i];if(!o)continue;var id=o[key];if(id===undefined||id===null)continue;if(seen[id])continue;seen[id]=1;var po=P[id],nw=!po,c=nw?{}:null,ch=null,rm=null;if(nw)po=P[id]={};
    for(var f in o){if(f.charCodeAt(0)===95&&!(isU&&MPUI[f]))continue;if(isU&&MPUX[f])continue;var v=o[f];if(typeof v==='function'||v===undefined)continue;if(isU&&f==='ce'&&Array.isArray(v)&&v.length>8)v=v.slice(-8);
      if(!nw&&mpSlow(po,f,now))continue;var q=mpFD(po,f,v);if(!q)continue;mpSlowMark(po,f,now);if(nw)c[f]=v;else (ch||(ch={}))[f]=q[0];}
    if(nw){(a||(a=[])).push(c);continue;}
    for(var f3 in po){if(f3.charCodeAt(0)===2)continue;var v3=o[f3];if(v3===undefined||typeof v3==='function'){delete po[f3];(rm||(rm=[])).push(f3);}}
    if(ch)(u||(u={}))[id]=ch;if(rm)(r||(r=[])).push([id,rm]);}
  for(var pid in P){if(!seen[pid]){delete P[pid];(d||(d=[])).push(isNaN(+pid)?pid:+pid);}}
  if(!a&&!u&&!r&&!d)return null;var D={};if(a)D.a=a;if(u)D.u=u;if(r)D.r=r;if(d)D.d=d;return D;}
/* 產生差異；full 時先清空基準（等於送出全部），並附上本方所知的地圖 */
function mpDiff(s,full){var X=mpX(s);if(full){X.B={c:{},v:{}};X.lg=null;X.lgT=-1;X.fx=null;X.fxT=-1;X.fh=0;}
  var O=mpObs(s),K=s<0?{}:mpKnownIds(s),D={t:G.t,st:G.step},any=false;
  if(s>=0&&G.started&&(!X.F||X.fStep===undefined||G.step-X.fStep>=10||full)){try{mpFrontStep(s,X);X.fStep=G.step;}catch(e){}}
  var C={};MPCOL.forEach(function(q){var d=mpCollDiff(X.B.c,q[0],q[1],q[2](s,O,K)||[]);if(d){C[q[0]]=d;any=true;}});if(any)D.c=C;
  var VB=X.B.v,VD=null,VR=null,now=MPCLK();mpValList(s,O,K,X).forEach(function(p){var k=p[0],v=p[1];if(v===undefined){if(k in VB){delete VB[k];(VR||(VR=[])).push(k);}return;}if(!full&&mpSlow(VB,k,now))return;var q=mpFD(VB,k,v);if(q){mpSlowMark(VB,k,now);(VD||(VD={}))[k]=q[0];}});
  if(VD){D.v=VD;any=true;}if(VR){D.vr=VR;any=true;}
  var lgf=function(e){return s<0||e.s===s||!(e.s>=0);},LG=G.log||[],nl;if(full){nl=LG.filter(lgf).slice(-1500);}else nl=mpTail(LG,X.lg,X.lgT,function(e){return e.t||0;}).filter(lgf);
  if(LG.length){X.lg=LG[LG.length-1];X.lgT=X.lg.t||0;}if(nl.length){D.lg=nl;any=true;}
  if(full)X.fen=MPFXN;else if(MPFXB.length){var fe=mpFxFor(s,O,K,X);if(fe.length){D.fe=fe;any=true;}}
  var FXL=G._fx||[];if(!full){var nf=mpTail(FXL,X.fx,X.fxT,function(f){return f[5]||0;}).filter(function(f){return s<0||mpSeen(O,f[0],f[1])||mpSeen(O,f[2],f[3]);});if(nf.length){D.fx=nf.slice(-400);any=true;}}if(FXL.length){X.fx=FXL[FXL.length-1];X.fxT=X.fx[5]||0;}
  var FH=s<0?G.front&&G.front.hist:X.F&&X.F.hist;if(FH&&FH.length!==X.fh){var nh=FH.length>X.fh?FH.slice(X.fh):FH.slice();D.fh=FH.length>X.fh?nh:{all:nh};X.fh=FH.length;any=true;}
  if(G.map&&(G.started||full)){if(full){if(!X.KM)mpKnownInit(X);}else{var ly=mpLayers(s,X,O);if(ly.length){D.ly=ly;any=true;}}}
  return any||full?D:null;}
/* 新加入的玩家：本方所知的地圖（打包）＋全部內容 */
function mpFull(s,cm,info){var X=mpX(s);if(!X.KM)mpKnownInit(X);var MP=G.map,m={};Object.keys(MP).forEach(function(k){if(MAPTA.indexOf(k)<0&&k!=='sd'&&k.charCodeAt(0)!==95&&typeof MP[k]!=='function')m[k]=MP[k];});m.format='LatoWarMap';
  var ly={};MPLY.forEach(function(k){var a=X.KM[k];if(a)ly[k]=taK(a)+':raw:'+b64enc(new Uint8Array(a.buffer,a.byteOffset,a.byteLength));});
  var D=mpDiff(s,true);D.full=1;D.side=s;D.cm=cm;D.map=m;D.lyF=ly;D.info=info||null;return D;}

/* ---------- 五、客戶端：套用完整內容與差異 ---------- */
var MPCC={u:function(){return G.units;},msg:function(){return G.msgs||(G.msgs=[]);},lgv:function(){return G.lgv||(G.lgv=[]);},fac:function(){return G.fac||(G.fac=[]);},tp:function(){return G.tp||(G.tp=[]);},meet:function(){return G.meets||(G.meets=[]);},
  cS:function(){G.civ=G.civ||{};return G.civ.S||(G.civ.S=[]);},cR:function(){G.civ=G.civ||{};return G.civ.R||(G.civ.R=[]);},cP:function(){G.civ=G.civ||{};return G.civ.P||(G.civ.P=[]);},pR:function(){G.press=G.press||{};return G.press.R||(G.press.R=[]);},
  bt:function(){G.bt=G.bt||{list:[],byUnit:{},seq:0};return G.bt.list||(G.bt.list=[]);},ib:function(){return G.inbox||(G.inbox=[]);},dr:function(){return G.draw||(G.draw=[]);}};
var MPKEY={u:'id',ct:'id',ctN:'id',msg:'id',lgv:'id',fac:'id',tp:'id',meet:'id',cS:'i',cR:'id',cP:'id',pR:'id',bt:'id',ib:'id',dr:'id'};
function mpPathSet(p,v){var ks=p.split('.'),o=G;for(var i=0;i<ks.length-1;i++){var k=ks[i];if(o[k]===undefined||o[k]===null||typeof o[k]!=='object')o[k]={};o=o[k];}var last=ks[ks.length-1];o[last]=mpPA(o[last],v);return o[last];}
function mpPathDel(p){var ks=p.split('.'),o=G;for(var i=0;i<ks.length-1;i++){o=o&&o[ks[i]];}if(o)delete o[ks[ks.length-1]];}
function mpCollApply(name,D,side,touched){var key=MPKEY[name],isMap=name==='ct'||name==='ctN',cont=isMap?((G[name]||(G[name]=[]))[side]||(G[name][side]={})):MPCC[name](),ix={};
  if(!isMap)for(var i=0;i<cont.length;i++){var o=cont[i];if(o)ix[o[key]]=o;}
  var get=function(id){return isMap?cont[id]:ix[id];};
  (D.a||[]).forEach(function(o){var id=o[key],old=get(id);if(old){for(var f in old)if(f.charCodeAt(0)!==95&&!(f in o))delete old[f];Object.assign(old,o);touched.push([name,old]);return;}if(isMap)cont[id]=o;else{cont.push(o);ix[id]=o;}touched.push([name,o,1]);});
  if(D.u)for(var id in D.u){var t=get(isNaN(+id)?id:+id);if(t===undefined)t=get(id);if(!t)continue;var ch=D.u[id];for(var f2 in ch)t[f2]=mpPA(t[f2],ch[f2]);touched.push([name,t,0,ch]);}
  (D.r||[]).forEach(function(q){var t2=get(q[0]);if(t2)q[1].forEach(function(f){delete t2[f];});});
  if(D.d&&D.d.length){var del={};D.d.forEach(function(id){del[id]=1;});if(isMap)D.d.forEach(function(id){delete cont[id];});else{var keep=cont.filter(function(o){return !o||!del[o[key]];});cont.length=0;keep.forEach(function(o){cont.push(o);});}touched.push([name,null,-1]);}}
/* 套用一份差異；回傳變動摘要（介面據此決定重畫、重建索引） */
function mpApply(D,side){var touched=[],R={units:false,add:false,map:false,ly:[]};
  if(D.v){var keys=Object.keys(D.v);keys.sort(function(a,b){return (a==='set'?-1:0)-(b==='set'?-1:0);});keys.forEach(function(k){var v=D.v[k];if(k==='mapv'){G._mapv=v;return;}if(k==='front'||k==='ri'||k==='lyOn'||k==='tilt'){MPCLI[k]=mpPA(MPCLI[k],v);return;}if(k==='lgLoad'){G._lgLoad=mpPA(G._lgLoad,v);return;}if(k.indexOf('sides.')===0){var i=+k.slice(6);G.sides[i]=mpPA(G.sides[i],v);return;}mpPathSet(k,v);});}
  (D.vr||[]).forEach(function(k){if(k==='front'||k==='ri'||k==='lyOn'){MPCLI[k]=null;return;}mpPathDel(k);});
  if(D.c)for(var n in D.c)mpCollApply(n,D.c[n],side,touched);
  if(D.lg){G.log=G.log||[];D.lg.forEach(function(e){G.log.push(e);});if(G.log.length>4000)G.log.splice(0,G.log.length-3000);if(G.onLog)G.onLog();}
  if(D.fx){G._fx=G._fx||[];D.fx.forEach(function(f){G._fx.push(f);});if(G._fx.length>2000)G._fx.splice(0,G._fx.length-1500);}
  if(D.fh){MPCLI.fh=MPCLI.fh||[];if(D.fh.all)MPCLI.fh=D.fh.all.slice();else D.fh.forEach(function(h){MPCLI.fh.push(h);});}
  if(D.ly&&D.ly.length){var MP=G.map,g=mpBlkGeom();D.ly.forEach(function(q){var k=q[0],kind=q[1],b=q[2],bytes=b64dec(q[3]),a=mpLyGet(k);if(!a||a.length!==MP.GW*MP.GH||taK(a)!==kind){a=new TA[kind](MP.GW*MP.GH);mpLySet(k,a);}var bx=b%g.BW,by=(b/g.BW)|0;mpBlkPut(a,bx,by,bytes);R.ly.push([k,bx,by]);});R.map=true;}
  touched.forEach(function(q){if(q[0]==='u'){R.units=true;if(q[2])R.add=true;if(q[2]===-1)R.add=true;var u=q[1];if(u&&q[3]&&(q[3].mix||q[3].hq||q[3].type)){delete u._s;delete u._sv;}}});
  if(D.t!==undefined)G.t=D.t;if(D.st!==undefined)G.step=D.st;if(D.v)mpEnsure();return R;}
var MPCLI={front:null,ri:null,lyOn:null,fh:null};
/* 戰線與道路擁塞：由客戶端重建成介面使用的結構 */
function mpCliDerive(){var f=MPCLI.front;if(f&&f.own){var F=G.front;if(!F||F.W!==f.W||F.H!==f.H||!F.wet){var g0=G.front;G.front=null;F=frontInit();G.front=g0;}F.own=rleDec(f.own,f.W*f.H);F.init=1;F.nextH=f.nextH||0;F.hist=MPCLI.fh||[];F.ver=(F.ver||0)+1;G.front=F;}else if(!f)G.front=null;
  var ri=MPCLI.ri,MP=G.map;if(ri&&ri.length&&MP){var N=MP.GW*MP.GH;if(!G.rdi||G.rdi.length!==N)G.rdi=new Uint8Array(N);else G.rdi.fill(0);var L=[];for(var i=0;i+1<ri.length;i+=2){G.rdi[ri[i]]=ri[i+1];L.push(ri[i]);}G.rdiL=L;}else{G.rdiL=null;}
  var on=MPCLI.lyOn;if(on){if(!on.fl&&G.evt)G.evt.fl=null;if(!on.fire&&G.evt)G.evt.fire=null;}}
/* 介面預期存在的容器（伺服器上是空的就不會送來） */
function mpEnsure(){['msgs','lgv','fac','tp','meets','inbox','draw'].forEach(function(k){if(!Array.isArray(G[k]))G[k]=[];});if(G.civ){['S','R','P'].forEach(function(k){if(!Array.isArray(G.civ[k]))G.civ[k]=[];});}if(G.press&&!Array.isArray(G.press.R))G.press.R=[];if(G.press&&!Array.isArray(G.press.A))G.press.A=[];if(!G.bt)G.bt={list:[],byUnit:{},seq:0};if(!G.bt.list)G.bt.list=[];if(!G.bt.byUnit)G.bt.byUnit={};if(!G.ct)G.ct=sAO();}
/* 完整內容：建立客戶端的作戰狀態 */
async function mpLoadFull(F){var m=Object.assign({},F.map);MPLY.forEach(function(k){if(F.lyF&&F.lyF[k]&&MAPTA.indexOf(k)>=0)m[k]=F.lyF[k];});var MP=await unpackMap(m);var set=F.v&&F.v.set||{};G=newGame(MP,set);
  G.ct=[{},{}];G.units=[];G.msgs=[];G.log=[];G._fx=[];G.dirty=[];G.pq=[];G._inc={};MPCLI={front:null,ri:null,lyOn:null,fh:null};
  ['rdd','rld','fl','fire'].forEach(function(k){if(F.lyF&&F.lyF[k]){var mm=String(F.lyF[k]).match(/^(\w+):raw:(.*)$/);if(mm){var u8=b64dec(mm[2]),a=new TA[mm[1]](u8.buffer,0,u8.byteLength/TA[mm[1]].BYTES_PER_ELEMENT);if(k==='fl'||k==='fire'){G.evt=G.evt||{};}mpLySet(k,a);}}});
  var R=mpApply(F,F.side<0?0:F.side);G.set.fog=F.side>=0;mpEnsure();reix();G._tv=(G._tv||1)+1;G._pv=(G._pv||0)+1;
  if(G.evt&&MPCLI.lyOn){['fl','fire'].forEach(function(k){if(!MPCLI.lyOn[k])G.evt[k]=null;});}mpCliDerive();void R;return G;}

/* ---------- 六、伺服器：讀檔、存檔、快速想定 ---------- */
async function mpLoad(o){await gameLoad(o,simCaches,function(){G.onPause=function(){};G.onLog=function(){};});mpReset();return G;}
/* 快速想定（與單機版「開始」頁相同的內建想定），在伺服器上直接建立 */
async function mpQuick(key,seed){var sc=SCN.filter(function(q){return q.k===key;})[0]||SCN[4];var cs=sc.cs||50,GW=Math.round(sc.size[0]*1000/cs),GH=Math.round(sc.size[1]*1000/cs);seed=seed||(sc.k+'-'+Math.floor(Math.random()*1e6).toString(36));
  var smp=procSampler({seed:seed,ter:sc.ter,clim:sc.clim,Wm:GW*cs,Hm:GH*cs,lat:sc.lat||48,sea:sc.ter==='coast'?(sc.sea!==undefined?sc.sea:PI/2):undefined,isl:sc.isl,coff:sc.coff});
  var MP=await genRegion({GW:GW,GH:GH,cs:cs,seed:seed,year:sc.y,name:sc.n.replace(/^[0-9]+ 年：/,''),lat0:sc.lat||48,lon0:0,src:'proc',dens:sc.dens||1,rail:true,dev:sc.dev||'auto',hsr:true,bf:sc.bf&&sc.bf!=='beach'?sc.bf:'auto',cstyle:sc.cstyle||'auto',nst:'zh'},smp,function(){return Promise.resolve();});
  G=newGame(MP,Object.assign({y:sc.y,m:sc.m,d:sc.d,h:sc.h,dur:sc.dur||24,seed:seed},sc.set||{}));simCaches();reix();G.onPause=function(){};G.onLog=function(){};if(sc.pol)sc.pol.forEach(function(p,i){G.sides[i].pol=Object.assign({},p);});var r=mb32(hstr(seed+'|orbat'));
  [0,1].forEach(function(side){var L=side?sc.B:sc.A,S=G.sides[side];if(sc.names)S.name=sc.names[side];if(sc.edges)S.edge=sc.edges[side];S.ai=side===1;var F=[];L.forEach(function(p){for(var i=1;i<=(p[1]||1);i++){var era=p[3]||null,nm=p[2]?fmtName(p[2],i):null,top=FPI[p[0]]?buildPreset(side,p[0],nm,-1,r,p[4]||sc.gran||'co',era):UT[p[0]]?addLeaf(side,p[0],1,nm,-1,r):null;if(top){top.tpl=p[2]&&p[2].indexOf('{i}')>=0?p[2]:top.tpl;top.ix=i;F.push(top);}}});reix();autoDeploy2(side,F);});
  autoObjectives(sc.nobj||2);if(sc.post)sc.post();SIDES().forEach(function(s){if(nmOf(s).num!=='seq'||nmOf(s).fmt!=='arabic'||nmOf(s).ttl!=='none')renameSide(s);});dupNames();mpReset();return G;}

/* ---------- 七、伺服器：指揮官席位、部署區、部署操作、匯入編制 ---------- */
/* 每一方的指揮官人數與 AI／玩家；human[i] 為真表示第 i 位指揮官由玩家擔任 */
function mpTeams(side,n,human){var S=G.sides[side];n=clamp(n|0,1,8);var cur=cmList(side);if(cur.length!==n){if(!G.started)teamSetup(side,n,'split');else n=cur.length;}var L=cmList(side);
  L.forEach(function(R,i){R.ai=!human[i];});if(L.length===1){S.ai=!human[0];L[0].ai=S.ai;}else{S.ai=L.some(function(R){return R.ai;});cmSync(side);}S.pu=0;cmBump();return L.map(function(R){return {n:R.n,ai:R.ai,roots:R.roots.length};});}
function mpCanCmd(u,s,cm){if(!u||u.side!==s)return false;var S=G.sides[s],L=S.cm||[];if(L.length>1){var i=cmOf(u);if(cm>=0&&i!==cm)return cmMay(u,cm);return !(L[i]&&L[i].ai);}if(!S.ai)return true;return S.pu>0&&inTree(u,S.pu);}
function mpZone(side,dep){var MP=G.map,e=G.sides[side].edge||(side===2?'N':side?'E':'W'),f=clamp(dep||0.4,0.15,0.6);return {e:e,f:f,x0:e==='E'?MP.Wm*(1-f):0,x1:e==='W'?MP.Wm*f:MP.Wm,y0:e==='S'?MP.Hm*(1-f):0,y1:e==='N'?MP.Hm*f:MP.Hm};}
function mpInZone(Z,x,y){return x>=Z.x0&&x<=Z.x1&&y>=Z.y0&&y<=Z.y1;}
function mpClampZ(Z,x,y){return [clamp(x,Z.x0+G.map.cs,Z.x1-G.map.cs),clamp(y,Z.y0+G.map.cs,Z.y1-G.map.cs)];}
function mpDepFix(u,Z){var all=isLeaf(u)?[u]:leavesOf(u).concat([u]);all.forEach(function(z){var q=mpClampZ(Z,z.x,z.y),p=validPos(ST(z),q[0],q[1]);z.x=p[0];z.y=p[1];z.home=[z.x,z.y];z.placed=1;if(ST(z).dom==='air'&&isLeaf(z)){z.base=[z.x,z.y];z.st=z.st==='off'?'off':'base';}});}
function mpTopsOf(side,cm){var L=G.sides[side].cm||[];return G.units.filter(function(u){return u.side===side&&u.p<0&&u.st!=='dead'&&(L.length<2||cm<0||L[cm]&&L[cm].roots.indexOf(u.id)>=0);});}
function mpDepOp(side,cm,op,a,dep){if(G.started)return {err:'作戰已經開始，不能再調整部署。'};var Z=mpZone(side,dep),u=a&&a.id!==undefined?uById(a.id):null;
  if(op!=='auto'){if(!u||u.side!==side)return {err:'找不到這個單位。'};if(G.sides[side].cm&&G.sides[side].cm.length>1&&cm>=0&&!cmMay(u,cm))return {err:'這是隊友指揮的部隊。'};}
  if(op==='move'){var all=isLeaf(u)?[u]:leavesOf(u).concat([u]);all.forEach(function(z){var p=validPos(ST(z),z.x+(+a.dx||0),z.y+(+a.dy||0));z.x=p[0];z.y=p[1];});mpDepFix(u,Z);return {ok:1};}
  if(op==='rot'){var L=isLeaf(u)?[u]:leavesOf(u).concat([u]),c=centroid(isLeaf(u)?[u]:leavesOf(u)),ang=(+a.dir>0?1:-1)*PI/8;L.forEach(function(x){var dx=x.x-c[0],dy=x.y-c[1],p=validPos(ST(x),c[0]+dx*Math.cos(ang)-dy*Math.sin(ang),c[1]+dx*Math.sin(ang)+dy*Math.cos(ang));x.x=p[0];x.y=p[1];x.hd+=ang;});mpDepFix(u,Z);return {ok:1};}
  if(op==='place'){if(u.st==='off'){u.arr=u.arr||{k:'time',t:3600};u.arr.x=+a.x;u.arr.y=+a.y;return {ok:1,msg:'已設定增援進場點。'};}var q=mpClampZ(Z,+a.x,+a.y),e=G.sides[side].edge,h=a.hd!==null&&a.hd!==undefined&&isFinite(+a.hd)?+a.hd:(e==='W'?0:e==='E'?PI:e==='N'?PI/2:-PI/2);deployTree(u,q[0],q[1],h,0);mpDepFix(u,Z);return {ok:1};}
  if(op==='auto'){var T=mpTopsOf(side,cm).filter(function(t){return t.st!=='off';});autoDeploy(side,T);T.forEach(function(t){mpDepFix(t,Z);});return {ok:1,msg:'已自動部署 '+T.length+' 個編制。'};}
  return {err:'未知的部署操作'};}
/* 玩家匯入自己的編制（.latoorbat.json）：成為自己指揮的部隊並自動部署在本方部署區 */
function mpOrbIn(side,cm,D,replace,dep){if(G.started)return {err:'作戰開始後不能匯入編制。'};var L=G.sides[side].cm||[];
  if(replace){mpTopsOf(side,cm).forEach(function(t){delUnit(t);});reix();if(L.length>1&&L[cm])L[cm].roots=[];}
  var R;try{R=orbImport(D,side,-1,{});}catch(e){return {err:e.message};}if(L.length>1&&L[cm]){L.forEach(function(Q){Q.roots=Q.roots.filter(function(id){return R.roots.every(function(r){return r.id!==id;});});});R.roots.forEach(function(r){L[cm].roots.push(r.id);});cmBump();}
  else if(L.length===1){L[0].roots=G.units.filter(function(u){return u.side===side&&u.p<0;}).map(function(u){return u.id;});}
  autoDeploy2(side,R.roots);var Z=mpZone(side,dep);R.roots.forEach(function(t){mpDepFix(t,Z);});dupNames();return {ok:1,n:R.made.length,warn:R.warn,msg:'已匯入 '+R.made.length+' 個單位（'+R.roots.length+' 個頂層編制）並自動部署。'};}
/* 開戰：未部署的部隊自動部署，初始化戰鬥狀態 */
function mpBegin(dep){SIDES().forEach(function(s){var Z=mpZone(s,dep),tps=G.units.filter(function(u){return u.side===s&&u.p<0&&u.st!=='off'&&(isLeaf(u)?[u]:leavesOf(u)).some(function(x){return !x.placed&&x.st!=='off';});});if(tps.length){autoDeploy(s,tps);tps.forEach(function(t){mpDepFix(t,Z);});}});
  if(!G.units.some(function(u){return u.side===0&&isLeaf(u);})||!G.units.some(function(u){return u.side===1&&isLeaf(u);}))return {err:'雙方都必須至少有一個單位。'};
  prepareBattle();G.started=true;G.set.fog=true;G.onPause=function(){};return {ok:1};}
/* 兵力點數（衡量雙方戰力用，不限制） */
function mpForcePts(side){try{return typeof fpSide==='function'?Math.round(fpSide(side)):0;}catch(e){return 0;}}

/* ---------- 八、伺服器：玩家命令（白名單函式）與設定修改（白名單欄位） ---------- */
function mpEnc(v,d){d=d||0;if(v===null||v===undefined||typeof v!=='object')return typeof v==='function'?undefined:v;if(d>7)return null;if(ArrayBuffer.isView(v))return Array.from(v);
  if(G&&G._ix&&v.id!==undefined&&G._ix[v.id]===v)return {$u:v.id};if(G&&G.meets&&G.meets.indexOf(v)>=0)return {$m:v.id};if(G&&G.fac&&G.fac.indexOf(v)>=0)return {$f:v.id};
  if(Array.isArray(v))return v.map(function(x){return mpEnc(x,d+1);});var o={};for(var k in v){if(k.charCodeAt(0)===95)continue;var x=mpEnc(v[k],d+1);if(x!==undefined)o[k]=x;}return o;}
function mpDec(v,d){d=d||0;if(v===null||v===undefined||typeof v!=='object')return v;if(d>7)return null;if(Array.isArray(v))return v.map(function(x){return mpDec(x,d+1);});
  if(v.$u!==undefined)return uById(v.$u)||null;if(v.$m!==undefined)return (G.meets||[]).filter(function(M){return M.id===v.$m;})[0]||null;if(v.$f!==undefined)return (G.fac||[]).filter(function(f){return f.id===v.$f;})[0]||null;
  var o={};for(var k in v){if(k.charCodeAt(0)===95||k==='__proto__'||k==='constructor'||k==='prototype')continue;o[k]=mpDec(v[k],d+1);}
  if(typeof o.k==='string'&&o.oid!==undefined&&(o.x!==undefined||o.opt!==undefined))o.oid=(G.oid=(G.oid||0)+1);return o;}
/* 每個可遠端呼叫的函式：檢查（s 方、cm 指揮官、a 參數）回傳錯誤訊息或空字串，然後執行 */
var MPOWN=function(i){return function(s,cm,a){return mpCanCmd(a[i],s,cm)?'':'這不是你指揮的部隊（或目前由 AI 代管）。';};};
var MPSIDE=function(i){return function(s,cm,a){return a[i]===s?'':'只能操作本方。';};};
var MPFN={
  issue:[MPOWN(0),function(a){return issue(a[0],a[1],a[2]);}],
  tacSwitch:[MPOWN(0),function(a){return tacSwitch(a[0],a[1]);}],postSwitch:[MPOWN(0),function(a){return postSwitch(a[0],a[1]);}],
  fmSet:[MPOWN(0),function(a){return fmSet(a[0],a[1]);}],femSet:[MPOWN(0),function(a){return femSet(a[0],a[1]);}],
  refitReturn:[MPOWN(0),function(a){return refitReturn(a[0]);}],arriveUnit:[MPOWN(0),function(a){return a[0]&&a[0].st==='off'?arriveUnit(a[0]):null;}],
  cbDeconStart:[MPOWN(0),function(a){var r=cbDeconStart(a[0]);a[0].ord=null;a[0].task='hold';return r;}],cbVax:[MPOWN(0),function(a){return cbVax(a[0],a[1],Math.min(+a[2]||4000,8000));}],
  cbCylinder:[MPOWN(0),function(a){return cbCylinder(a[0],a[1],+a[2],+a[3]);}],cbCatapult:[MPOWN(0),function(a){return cbCatapult(a[0],+a[1],+a[2]);}],
  cbRelease:[function(s,cm,a){return a[0]===s&&mpCanCmd(a[6],s,cm)?'':'只能由本方部隊施放。';},function(a){return cbRelease(a[0],a[1],+a[2],+a[3],Math.min(+a[4]||1,3),Math.min(+a[5]||400,1500),a[6],a[7]);}],
  powRaise:[MPOWN(0),function(a){return powRaise(a[0],a[1],a[2]);}],powEvac:[MPOWN(0),function(a){return powEvac(a[0]);}],
  reparent:[function(s,cm,a){var p=uById(+a[1]);return mpCanCmd(a[0],s,cm)&&p&&p.side===s?'':'只能把本方部隊改隸本方的上級。';},function(a){return reparent(a[0],+a[1]);}],
  reqSend:[function(s,cm,a){return mpCanCmd(a[0],s,cm)&&a[1]&&a[1].side===s?'':'只能由自己的部隊向本方部隊提出請求。';},function(a){return reqSend(a[0],a[1],a[2],a[3]);}],
  reqReply:[function(s,cm,a){return a[0]&&a[0].side===s&&a[1]&&a[1].side===s?'':'只能回覆本方的請求。';},function(a){return reqReply(a[0],a[1],!!a[2],String(a[3]||'').slice(0,200));}],
  reqDecide:[MPOWN(0),function(a){return reqDecide(a[0],a[1],a[2]);}],
  tmSend:[function(s,cm,a){return a[0]===s&&(a[1]===cm||cm<0)?'':'只能以自己的名義發送。';},function(a){return tmSend(a[0],a[1],a[2],a[3],a[4],String(a[5]||'').slice(0,300),a[6]);}],
  meetDecide:[function(s,cm,a){return a[0]&&a[1]===s&&(a[4]||[]).every(function(id){return mpCanCmd(uById(id),s,cm);})?'':'只能決定自己的部隊。';},function(a){return meetDecide(a[0],a[1],a[2],'玩家',a[4]);}],
  snkLaunch:[MPSIDE(0),function(a){return snkLaunch(a[0],a[1],a[2],a[3],+a[4],+a[5],false,typeof a[7]==='string'?a[7].slice(0,24):undefined);}],
  supCall:[MPSIDE(0),function(a){return supCall(a[0],a[1],a[2],a[3],a[4]);}],supRouteAdd:[MPSIDE(0),function(a){return supRouteAdd(a[0],a[1]);}],
  techUnlock:[MPSIDE(0),function(a){return techUnlock(a[0],a[1]);}],
  cmAssign:[function(s,cm,a){return a[0]===s&&(cm<0||a[2]===cm||mpCanCmd(uById(a[1]),s,cm))?'':'只能把自己的編制交給隊友。';},function(a){return cmAssign(a[0],a[1],a[2]);}],
  cmGive:[function(s,cm,a){return a[0]===s&&cm>=0&&a[3]===cm?'':'只能以自己的名義移交。';},function(a){return cmGive(a[0],+a[1],+a[2],+a[3]);}],
  cmTake:[function(s,cm,a){return a[0]===s&&cm>=0&&a[2]===cm?'':'只能以自己的名義接管。';},function(a){return cmTake(a[0],+a[1],+a[2]);}],
  cmShare:[function(s,cm,a){return a[0]===s&&cm>=0&&a[4]===cm?'':'只能以自己的名義設定共用。';},function(a){return cmShare(a[0],+a[1],+a[2],!!a[3],+a[4]);}],
  cmAns:[function(s,cm,a){return a[0]===s&&cm>=0&&a[3]===cm?'':'只能回覆給你的請求。';},function(a){return cmAns(a[0],+a[1],!!a[2],+a[3]);}],
  mpRf:[MPSIDE(0),function(a){return mpRf(a[0],a[1]);}],
  mpSupRouteDel:[MPSIDE(0),function(a){if(!G.sup)return null;G.sup.routes=(G.sup.routes||[]).filter(function(q){return !(q.id===a[1]&&q.side===a[0]);});return {ok:1};}],
  mpDrawSet:[MPSIDE(0),function(a){return mpDrawSet(a[0],a[1]);}],
  mpNode:[MPSIDE(0),function(a){return mpNode(a[0],+a[1],String(a[2]),+a[3]);}],
  mpMyCmd:[function(s,cm,a){return a[0]===s&&(cm<0||a[1]===cm)?'':'只能設定自己的指揮。';},function(a){return mpMyCmd(a[0],a[1],+a[2]);}]};
/* 補給節點的吞吐量、容量、車隊（增援點數模式下擴充要付點數） */
var MPNDC={thr:0.5,cap:0.02,cvn:4};
function mpNode(side,i,f,v){var N=(G.sides[side].nodes||[])[i];if(!N)return {err:'找不到補給節點。'};if(['thr','cap','up','cvn','cvp'].indexOf(f)<0||!isFinite(v))return {err:'無效的設定'};
  if(rpOn()&&G.started&&MPNDC[f]){var old=f==='cvn'?(N.cv?N.cv.n:0):N[f]||0,nv=Math.max(0,v),cost=Math.max(0,(nv-old)*MPNDC[f]);if(cost>0&&!rpSpend(side,cost,'node',N.name))return {err:'增援點數不足：擴充需要 '+fmt(Math.ceil(cost))+' 點'};}
  if(f==='thr')N.thr=Math.max(0,v);else if(f==='cap')N.cap=Math.max(0,v);else if(f==='up')N.up=v;else if(f==='cvn'){N.cv=N.cv||{n:0,pay:3};N.cv.n=Math.max(0,Math.round(v));}else if(f==='cvp'){N.cv=N.cv||{n:0,pay:3};N.cv.pay=Math.max(0.1,v);}return {ok:1};}
/* 「我的指揮」：全軍、只指揮某一個編制（其餘交給 AI）、全部交給 AI；多位指揮官時只切換自己的席位 */
function mpMyCmd(s,cm,v){var S=G.sides[s],L=S.cm||[];if(L.length>1){var R=L[cm<0?0:cm];if(!R)return {err:'找不到指揮官。'};R.ai=v<0;S.ai=L.some(function(Q){return Q.ai;});cmBump();decLog(s,'玩家',R.ai?'把'+R.n+'的部隊交給 AI 指揮':'親自指揮'+R.n+'的部隊');return {ok:1};}
  if(v>0){var u=uById(v);if(!u||u.side!==s)return {err:'找不到這個編制。'};}S.ai=v!==0;S.pu=v>0?v:0;if(L[0])L[0].ai=S.ai;decLog(s,'玩家',v===0?'親自指揮全軍':v<0?'把全軍交給 AI 指揮':'只指揮'+uName(uById(v))+'，其餘由 AI 指揮');return {ok:1};}
/* 增援派遣（與單機版「增援」對話框相同的流程，在伺服器上執行） */
function mpRf(side,RF){RF=RF||{};var src=RF.src,T=null,cost=0,lock=[];if(!G.started)return {err:'作戰尚未開始。'};
  if(src==='rft'){T=rftFind(side,RF.rft);if(!T||!(T.items||[]).some(function(q){return typeOf(q[0])&&q[1]>0;}))return {err:'先建立或選擇自訂範本。'};cost=rftCost(T,side);lock=rftLock(side,T);}
  else if(src==='preset'){if(!FPI[RF.pk])return {err:'找不到這個編制範本。'};cost=rpPresetCost(RF.pk,side);lock=techPresetLock(side,RF.pk);}else{if(!typeOf(RF.tk))return {err:'找不到這個單位類型。'};cost=rpTypeCost(RF.tk,Math.max(1,RF.n||1),side);lock=techTypeLock(side,RF.tk);}
  var why=rflWhy(side,src,{pk:RF.pk,tk:RF.tk,T:T});if(why)return {err:why};
  if(lock.length)return {err:'需要先解鎖：'+lock.map(function(k){return wpnOf(k)?wpnOf(k).n:k;}).join('、')};
  if(rpOn()&&rpS(side).v+1e-6<cost)return {err:'增援點數不足：需要 '+fmt(cost)+'，現有 '+fmt(Math.floor(rpS(side).v))};
  var r=mb32(hstr('rf|'+G.t+'|'+side+'|'+(G.nid||0))),u,par=RF.par>=0&&uById(RF.par)&&uById(RF.par).side===side?RF.par:-1,nm=typeof RF.nm==='string'?RF.nm.slice(0,60):null;
  if(src==='rft')u=rftBuild(side,T,nm||null,par,r);else if(src==='preset')u=buildPreset(side,RF.pk,nm||null,par,r,RF.gr||'co',null);else u=addLeaf(side,RF.tk,clamp(Math.round(RF.n||1),1,12),nm||null,par,r);if(!u)return {err:'無法建立增援部隊。'};reix();
  (function w(z){logInit(z);z.ms='ok';z.form='deployed';z.task='hold';z.sup=0;z.fat=0;z.st='off';z.ammo=100;kidsOf(z).forEach(w);})(u);
  var mode=RF.mode||'edge',e=edgePoint(side,clamp(+RF.edge||50,0,100)/100),pt=Array.isArray(RF.pt)?[+RF.pt[0],+RF.pt[1]]:null,ob=(G.obj||[])[0],tx=ob?ob.x:G.map.Wm/2,ty=ob?ob.y:G.map.Hm/2;if(mode!=='edge'&&mode!=='fly'&&!pt)pt=e;if(!pt||mode==='fly')pt=mode==='fly'?e:pt||e;
  var dl=clamp(+RF.delay||0,0,24*60);u.arr={k:'time',t:G.t+dl*60,x:pt[0],y:pt[1],mode:mode,ship:mode==='ship'&&RF.ship?RF.ship:undefined,night:mode==='ship'&&RF.night?1:undefined,tx:mode==='fly'?(RF.pt||[tx,ty])[0]:undefined,ty:mode==='fly'?(RF.pt||[tx,ty])[1]:undefined,ord:RF.ord?{k:RF.ord,x:RF.ord==='reserve'?pt[0]+(tx-pt[0])*0.3:tx,y:RF.ord==='reserve'?pt[1]+(ty-pt[1])*0.3:ty}:null};dupNames();
  logE(side,'reinf','已派遣增援 '+uName(u)+'，預計 '+(dl?durTxt(dl*60)+'後':'立即')+'抵達'+placeTxt(pt[0],pt[1]),pt[0],pt[1],u.id);if(!dl)arriveUnit(u);if(rpOn())rpSpend(side,cost,'reinf',T?T.n:src==='preset'&&FPI[RF.pk]?FPI[RF.pk].n:(typeOf(RF.tk)||{}).n);
  var L=G.sides[side].cm;if(L&&L.length>1&&RF.cm>=0&&L[RF.cm]&&u.p<0){L.forEach(function(Q){Q.roots=Q.roots.filter(function(id){return id!==u.id;});});L[RF.cm].roots.push(u.id);cmBump();}
  return {ok:1,id:u.id,msg:'增援已派遣：'+uName(u)};}
/* 作戰圖示：本方的圖示由玩家整份送上（最多 120 個） */
function mpDrawSet(side,L){if(!Array.isArray(L))return {err:'格式錯誤'};var mine=(L||[]).filter(function(D){return D&&typeof D==='object'&&D.side===side;}).slice(-120);var J=JSON.stringify(mine);if(J.length>400000)return {err:'作戰圖示太多。'};
  G.draw=(G.draw||[]).filter(function(D){return D.side!==side;}).concat(JSON.parse(J));G.dseq=Math.max(G.dseq||0,mine.reduce(function(m,D){return Math.max(m,+D.id||0);},0));return {ok:1};}
/* 開戰前也能用的操作（分配指揮、頭像之類） */
var MPPRE={cmAssign:1};
function mpCmd(s,cm,name,args){var f=MPFN[name];if(!f)return {err:'聯機模式不支援這個操作（'+name+'）。'};if(!G||!G.started&&!MPPRE[name])return {err:'作戰尚未開始。'};var a=mpDec(args||[]);var why=f[0](s,cm,a);if(why)return {err:why};
  var r;try{r=f[1](a);}catch(e){return {err:'執行失敗：'+e.message};}G._tv=(G._tv||1)+1;return {ok:1,val:mpEnc(r)};}
/* 設定修改：部隊、本方、自己的指揮官，只接受白名單欄位 */
var MPWU={name:'s',nmLock:'b',ttl:'s',ttlAuto:'n',ration:'o',noTurn:'n',hdM:'n',fmU:'s',artRole:'s',quar:'n',comm:'n',xc:'n',pol:'o',radMode:'s',aip:'o',arr:'o',femR:'n',img:'i',sym:'s',fcol:'s',ins:'i',cimg:'i',note:'s'};
var MPWS={nm:'o',ration:'o',ldoc:'s',mopp:'n',moppSet:'n',nosur:'n',lgXc:'n',lgVeh:'o',stpl:'o',callQ:'o',vax0:'o',pol:'o',rft:'o',snk:'o',lgRk:'o',lgBad:'n',lgAm:'n'};
var MPWC={n:'s',ms:'s',dd:'s',oa:'s',rs:'s',ai:'b'};
function mpOkVal(t,v){if(v===null)return true;var j;try{j=JSON.stringify(v);}catch(e){return false;}if(j&&j.length>60000)return false;if(t==='s')return typeof v==='string'&&v.length<=400||v===undefined;if(t==='i')return v===undefined||v===''||typeof v==='string'&&v.length<=59000&&/^data:image\/(png|webp|jpeg|gif);base64,[A-Za-z0-9+\/=]+$/.test(v);if(t==='n')return v===undefined||typeof v==='number'&&isFinite(v)||typeof v==='boolean';if(t==='b')return v===undefined||typeof v==='boolean'||v===0||v===1;return v===undefined||typeof v==='object'||typeof v==='string'||typeof v==='number';}
var MPHOOK={quar:function(u,v){if(v){u.ord=null;u.task='hold';u.pend=[];}},ration:function(u){logRecalc(u);},noTurn:function(u,v){if(!v)delete u.hdM;},hdM:function(u,v){if(typeof v==='number'&&u.ord&&/defend|screen|halt/.test(u.ord.k))u.ord.face=v;}};
function mpSafe(v,d){d=d||0;if(v===null||typeof v!=='object')return v;if(d>8)return null;if(Array.isArray(v))return v.map(function(x){return mpSafe(x,d+1);});var o={};for(var k in v){if(k==='__proto__'||k==='constructor'||k==='prototype')continue;o[k]=mpSafe(v[k],d+1);}return o;}
function mpPatch(s,cm,P){var rej=[],n=0;if(!P||typeof P!=='object')return {rej:['格式錯誤'],n:0};P=mpSafe(P);
  if(P.u)for(var id in P.u){var u=uById(+id),ch=P.u[id];if(!u||u.side!==s){rej.push('u'+id);continue;}if(!mpCanCmd(u,s,cm)){rej.push('u'+id+':ctl');continue;}if(cm>=0&&tmOn(s)){var oi=cmOf(u),OL=G.sides[s].cm;if(oi!==cm&&OL[oi]&&OL[oi].ai)u.hcT=G.t;}
    for(var f in ch){var t=MPWU[f],v=ch[f];if(!t||!mpOkVal(t,v)||f==='arr'&&u.st!=='off'){rej.push('u'+id+'.'+f);continue;}if(v===null&&t!=='o'&&t!=='s')delete u[f];else if(v===undefined)delete u[f];else u[f]=v;n++;if(MPHOOK[f])try{MPHOOK[f](u,v);}catch(e){}}}
  if(P.s){var S=G.sides[s];for(var f2 in P.s){var t2=MPWS[f2],v2=P.s[f2];if(!t2||!mpOkVal(t2,v2)){rej.push('s.'+f2);continue;}if(v2===undefined)delete S[f2];else S[f2]=v2;n++;}}
  if(P.c&&cm>=0){var L=G.sides[s].cm||[],R=L[cm];if(R){for(var f3 in P.c){var t3=MPWC[f3],v3=P.c[f3];if(!t3||!mpOkVal(t3,v3)){rej.push('c.'+f3);continue;}R[f3]=t3==='b'?!!v3:v3;n++;}if(L.length===1&&P.c.ai!==undefined)G.sides[s].ai=!!R.ai;else if(L.length>1)G.sides[s].ai=L.some(function(Q){return Q.ai;});cmBump();}}
  if(P.ib)for(var mid in P.ib){var m=(G.inbox||[]).filter(function(q){return q.id===+mid&&q.side===s;})[0];if(!m){rej.push('ib'+mid);continue;}m.done=String(P.ib[mid]||'').slice(0,60)||m.done;n++;}
  if(P.dr!==undefined){var r=mpDrawSet(s,P.dr);if(r.err)rej.push('dr');else n++;}
  if(n)G._tv=(G._tv||1)+1;return {rej:rej,n:n};}
/* 被拒絕的欄位：從基準移除，下一次差異會把伺服器的值送回去 */
function mpUnbase(s,rej){var X=mpX(s);(rej||[]).forEach(function(k){var m=/^u(\d+)(?:\.(\w+))?/.exec(k);if(m){var P=X.B.c.u&&X.B.c.u[m[1]];if(P){if(m[2])delete P[m[2]];else for(var f in P)delete P[f];}}else if(/^s\./.test(k)){delete X.B.v['sides.'+s];}else if(/^c\./.test(k)){delete X.B.v['sides.'+s];}else if(/^dr/.test(k)){X.B.c.dr={};}});}

/* ---------- 九、戰鬥音效與畫面特效：伺服器記下每一步的交火、砲擊、飛彈、轟炸、核爆，依視野送給各方 ---------- */
var MPFXB=[],MPFXN=0,MPFXON=false;
function mpFxBrief(u){if(!u)return null;return {id:u.id,side:u.side,mix:u.mix,hq:u.hq,men:Math.round(u.men||0),veh:Math.round(u.veh||0),st:u.st,x:Math.round(u.x),y:Math.round(u.y),hd:u.hd};}
function mpFxOn(){if(MPFXON||typeof FX==='undefined')return;MPFXON=true;FX.cap=true;
  (function(){var b=hit;hit=function(t,src,dm,dv,sup,kind){b(t,src,dm,dv,sup,kind);if(src&&t&&kind!=='art'&&FX.ev.length<5000)FX.ev.push({k:kind,a:src,b:t,x0:src.x,y0:src.y,x1:t.x,y1:t.y,m:dm+dv*8,dv:dv});};})();
  (function(){var b=artyFire;artyFire=function(u,s,M){b(u,s,M);if(u.lastArt===G.t&&FX.ev.length<5000){var L=ARTL&&ARTL.id===u.id&&ARTL.t===G.t?ARTL:null;FX.ev.push({k:'art',a:u,x0:u.x,y0:u.y,x1:L?L.x:M.x,y1:L?L.y:M.y,r:M.r||300,m:M.mul||1,reg:!!(M.rg&&!M.reg),sat:M.kind==='sat',fa:L?L.fa:Math.atan2(M.y-u.y,M.x-u.x),sr:L?Math.round(L.sr):0,sd:L?Math.round(L.sd):0,sw:L?Math.round(L.sw):0});}};})();
  (function(){var b=mslLaunch;mslLaunch=function(u,o){var r=b(u,o);if(r)FX.ev.push({k:'mlaunch',a:u,x0:u.x,y0:u.y,x1:o.x,y1:o.y,m:o.n||2});return r;};})();
  (function(){var b=carpetHit;carpetHit=function(side,src,cx,cy,ang,L,W,tons,o){var r=b.apply(null,arguments);FX.ev.push({k:'carpet',a:src,x1:cx,y1:cy,ang:ang,L:L,W:W,m:tons});return r;};})();
  (function(){var b=nukeAt;nukeAt=function(side,x,y,Y){var r=b.apply(null,arguments);if(G&&G.started)FX.ev.push({k:'nuke',x1:x,y1:y,m:Y});return r;};})();
  (function(){var b=simStep;simStep=function(){FX.cap=true;b();mpFxDrain();};})();}
function mpFxDrain(){if(typeof FX==='undefined'||!FX.ev.length)return;FX.ev.forEach(function(e){var c={};for(var k in e){var v=e[k];if(k==='a'||k==='b')c[k]=mpFxBrief(v);else if(typeof v==='number'||typeof v==='string'||typeof v==='boolean')c[k]=v;}MPFXB.push({n:++MPFXN,e:c});});FX.ev.length=0;if(MPFXB.length>4000)MPFXB.splice(0,MPFXB.length-3000);}
/* 這一方看得到的事件；看不到的敵方射擊者只留下方向（位置改成落點） */
function mpFxFor(s,O,K,X){var out=[],from=X.fen||0;for(var i=MPFXB.length-1;i>=0&&MPFXB[i].n>from;i--){var e=MPFXB[i].e,a=e.a,b=e.b;
    if(s>=0&&e.k!=='nuke'&&!(a&&a.side===s)&&!(b&&b.side===s)&&!mpSeen(O,e.x1,e.y1)&&!(e.x0!==undefined&&mpSeen(O,e.x0,e.y0)))continue;
    if(s>=0&&a&&a.side!==s&&!K[a.id]){e=Object.assign({},e,{a:Object.assign({},a,{id:0,x:e.x1,y:e.y1}),x0:e.x1,y0:e.y1});}
    if(s>=0&&b&&b.side!==s&&!K[b.id])e=Object.assign({},e,{b:Object.assign({},b,{id:0})});
    out.push(e);if(out.length>=600)break;}X.fen=MPFXN;return out.reverse();}
