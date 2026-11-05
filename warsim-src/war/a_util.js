/* ===================== LatoWarsim 作戰模擬：共用工具（數學、亂數、雜訊、幾何、時間、名稱、編碼） ===================== */
var PI=Math.PI,D2R=PI/180,R2D=180/PI;
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function sm(a,b,x){var t=(x-a)/(b-a);t=t<0?0:t>1?1:t;return t*t*(3-2*t);}
function lerp(a,b,t){return a+(b-a)*t;}
function has(v){return v!==undefined&&v!==null&&String(v).trim()!=='';}
function num(v,d){if(typeof v==='number')return isFinite(v)?v:(d===undefined?NaN:d);if(!has(v))return d===undefined?NaN:d;var x=+String(v).replace(/[,，\s]/g,'').replace(/[%％]$/,'');return isFinite(x)?x:(d===undefined?NaN:d);}
function sum(a,f){var s=0;for(var i=0;i<a.length;i++)s+=f?f(a[i],i):(a[i]||0);return s;}
function esc(s){return String(s===undefined||s===null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function clone(o){return o===undefined?undefined:JSON.parse(JSON.stringify(o));}
function byKey(list,k){for(var i=0;i<list.length;i++)if(list[i][0]===k)return list[i];return null;}
function pick(r,a){return a[Math.floor(r()*a.length)%a.length];}
function wpick(r,items,wf){var tot=0,i;for(i=0;i<items.length;i++)tot+=Math.max(0,wf(items[i]));if(tot<=0)return items[0];var x=r()*tot;for(i=0;i<items.length;i++){x-=Math.max(0,wf(items[i]));if(x<=0)return items[i];}return items[items.length-1];}
/* ---------- 亂數 ---------- */
function mb32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function hstr(s){s=String(s);var h=1779033703^s.length;for(var i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19;}h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return (h^h>>>16)>>>0;}
function ih(x,y,s){var h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1442695041))|0;h=Math.imul(h^(h>>>13),1274126177);return (h^(h>>>16))>>>0;}
function gauss(r){var u=Math.max(1e-9,r()),v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*PI*v);}
function poisson(r,l){if(l<=0)return 0;if(l>30)return Math.max(0,Math.round(l+Math.sqrt(l)*gauss(r)));var L=Math.exp(-l),k=0,p=1;do{k++;p*=r();}while(p>L);return k-1;}
/* ---------- 雜訊：可設定種子的梯度雜訊、分形、脊狀 ---------- */
function Noise(seed){var r=mb32(hstr('n|'+seed)),p=new Uint16Array(512),g=new Float32Array(512),i;for(i=0;i<256;i++)p[i]=i;
  for(i=255;i>0;i--){var j=Math.floor(r()*(i+1)),t=p[i];p[i]=p[j];p[j]=t;}for(i=0;i<256;i++){p[i+256]=p[i];var a=r()*2*PI;g[i*2]=Math.cos(a);g[i*2+1]=Math.sin(a);}this.p=p;this.g=g;}
Noise.prototype.n=function(x,y){var p=this.p,g=this.g,X=Math.floor(x),Y=Math.floor(y),fx=x-X,fy=y-Y;X&=255;Y&=255;
  var a=p[p[X]+Y]&255,b=p[p[X+1]+Y]&255,c=p[p[X]+Y+1]&255,d=p[p[X+1]+Y+1]&255;
  var ga=g[a*2]*fx+g[a*2+1]*fy,gb=g[b*2]*(fx-1)+g[b*2+1]*fy,gc=g[c*2]*fx+g[c*2+1]*(fy-1),gd=g[d*2]*(fx-1)+g[d*2+1]*(fy-1);
  var u=fx*fx*fx*(fx*(fx*6-15)+10),v=fy*fy*fy*(fy*(fy*6-15)+10);return (ga+(gb-ga)*u+(gc-ga+(ga-gb-gc+gd)*u)*v)*1.4;};
Noise.prototype.fbm=function(x,y,oct,lac,gain){var s=0,a=1,f=1,n=0;lac=lac||2;gain=gain||0.5;for(var i=0;i<oct;i++){s+=a*this.n(x*f+i*17.3,y*f-i*11.1);n+=a;a*=gain;f*=lac;}return s/n;};
Noise.prototype.ridge=function(x,y,oct){var s=0,a=1,f=1,n=0,w=1;for(var i=0;i<oct;i++){var v=1-Math.abs(this.n(x*f+i*31.7,y*f+i*7.9));v*=v;v*=w;w=clamp(v*1.6,0,1);s+=a*v;n+=a;a*=0.5;f*=2.03;}return s/n;};
/* ---------- 幾何 ---------- */
function dist(ax,ay,bx,by){var dx=bx-ax,dy=by-ay;return Math.sqrt(dx*dx+dy*dy);}
function angOf(dx,dy){return Math.atan2(dy,dx);}
function angDiff(a,b){var d=(b-a)%(2*PI);if(d>PI)d-=2*PI;if(d<-PI)d+=2*PI;return d;}
/* 點到線段距離與投影比例 */
function segDist(px,py,ax,ay,bx,by){var dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy,t=L?((px-ax)*dx+(py-ay)*dy)/L:0;t=clamp(t,0,1);var x=ax+t*dx,y=ay+t*dy;return {d:dist(px,py,x,y),t:t,x:x,y:y};}
function plLen(P){var s=0;for(var i=2;i<P.length;i+=2)s+=dist(P[i-2],P[i-1],P[i],P[i+1]);return s;}
/* 沿折線取點（0～1）與方向 */
function plAt(P,f){var L=plLen(P),tgt=clamp(f,0,1)*L,s=0;for(var i=2;i<P.length;i+=2){var d=dist(P[i-2],P[i-1],P[i],P[i+1]);if(s+d>=tgt||i===P.length-2){var t=d?(tgt-s)/d:0;t=clamp(t,0,1);return {x:P[i-2]+(P[i]-P[i-2])*t,y:P[i-1]+(P[i+1]-P[i-1])*t,a:Math.atan2(P[i+1]-P[i-1],P[i]-P[i-2])};}s+=d;}return {x:P[0],y:P[1],a:0};}
function plNear(P,px,py){var best={d:1e18,t:0,x:P[0],y:P[1],i:0},s=0,L=plLen(P)||1;for(var i=2;i<P.length;i+=2){var q=segDist(px,py,P[i-2],P[i-1],P[i],P[i+1]),d=dist(P[i-2],P[i-1],P[i],P[i+1]);if(q.d<best.d)best={d:q.d,f:(s+q.t*d)/L,x:q.x,y:q.y,i:i};s+=d;}return best;}
/* Douglas–Peucker 簡化 */
function simplify(P,eps){if(P.length<=4)return P.slice();var n=P.length/2,keep=new Uint8Array(n);keep[0]=keep[n-1]=1;var st=[[0,n-1]];
  while(st.length){var s=st.pop(),a=s[0],b=s[1],md=-1,mi=-1;for(var i=a+1;i<b;i++){var q=segDist(P[i*2],P[i*2+1],P[a*2],P[a*2+1],P[b*2],P[b*2+1]);if(q.d>md){md=q.d;mi=i;}}if(md>eps){keep[mi]=1;st.push([a,mi],[mi,b]);}}
  var o=[];for(var k=0;k<n;k++)if(keep[k])o.push(P[k*2],P[k*2+1]);return o;}
function resample(P,step){var L=plLen(P),n=Math.max(1,Math.round(L/step)),o=[];for(var i=0;i<=n;i++){var q=plAt(P,i/n);o.push(q.x,q.y);}return o;}
/* ---------- 數字與時間格式 ---------- */
var NFC={};function fmt(n,d){if(!isFinite(n))return '—';d=d||0;var f=NFC[d]||(NFC[d]=new Intl.NumberFormat('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}));return f.format(+n);}
function fx(n,d){return isFinite(n)?(+n).toFixed(d===undefined?1:d):'—';}
function pct(n,d){return isFinite(n)?fmt(n,d===undefined?0:d)+'%':'—';}
function sg(n,d){return !isFinite(n)?'—':(n>0?'+':n<0?'−':'±')+fmt(Math.abs(n),d===undefined?1:d);}
function kmTxt(m){return !isFinite(m)?'—':m>=10000?fmt(m/1000,0)+' 公里':m>=1000?fmt(m/1000,1)+' 公里':fmt(m,0)+' 公尺';}
function durTxt(s){s=Math.max(0,Math.round(s));if(s<60)return s+' 秒';var m=Math.round(s/60);if(m<60)return m+' 分';var h=Math.floor(m/60),mm=m%60;if(h<48)return h+' 小時'+(mm?' '+mm+' 分':'');return Math.floor(h/24)+' 天 '+(h%24)+' 小時';}
/* 遊戲時間：以秒計，起點為想定開始日 0 時 */
var MDAYS=[31,28,31,30,31,30,31,31,30,31,30,31];
function leap(y){return (y%4===0&&y%100!==0)||y%400===0;}
function dateOf(y0,m0,d0,sec){var day=Math.floor(sec/86400),rem=sec-day*86400,y=y0,m=m0,d=d0+day;for(;;){var md=MDAYS[m-1]+(m===2&&leap(y)?1:0);if(d<=md)break;d-=md;m++;if(m>12){m=1;y++;}}
  return {y:y,m:m,d:d,h:Math.floor(rem/3600),mi:Math.floor(rem%3600/60),doy:doyOf(y,m,d)+rem/86400};}
function doyOf(y,m,d){var n=d;for(var i=0;i<m-1;i++)n+=MDAYS[i]+(i===1&&leap(y)?1:0);return n;}
function two(n){return (n<10?'0':'')+n;}
function clockTxt(o){return o.y+' 年 '+o.m+' 月 '+o.d+' 日 '+two(o.h)+':'+two(o.mi);}
/* ---------- 名稱 ---------- */
/* ---------- 編碼（存檔用）：型別陣列 ⇄ base64（gzip 壓縮） ---------- */
function b64enc(u8){var s='',CH=0x8000;for(var i=0;i<u8.length;i+=CH)s+=String.fromCharCode.apply(null,u8.subarray(i,i+CH));return btoa(s);}
function b64dec(s){var b=atob(s),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;}
async function gz(u8,mode){var CS=mode==='d'?(typeof DecompressionStream!=='undefined'?DecompressionStream:null):(typeof CompressionStream!=='undefined'?CompressionStream:null);if(!CS)return null;
  var s=new CS('gzip'),w=s.writable.getWriter(),p=new Response(s.readable).arrayBuffer();w.write(u8);w.close();return new Uint8Array(await p);}
var TA={u8:Uint8Array,i8:Int8Array,u16:Uint16Array,i16:Int16Array,i32:Int32Array,f32:Float32Array};
function taKind(a){for(var k in TA)if(a instanceof TA[k])return k;return 'u8';}
async function packTA(a){var k=taKind(a),u8=new Uint8Array(a.buffer,a.byteOffset,a.byteLength),z=null;try{z=await gz(u8,'c');}catch(e){z=null;}return z?k+':gz:'+b64enc(z):k+':raw:'+b64enc(u8);}
async function unpackTA(s){var m=String(s).match(/^(\w+):(gz|raw):(.*)$/);if(!m)throw new Error('無法解讀的陣列資料');var u8=b64dec(m[3]);if(m[2]==='gz'){var d=await gz(u8,'d');if(!d)throw new Error('此瀏覽器不支援解壓縮（DecompressionStream）');u8=d;}
  var C=TA[m[1]]||Uint8Array,buf=u8.buffer.slice(u8.byteOffset,u8.byteOffset+u8.byteLength);return new C(buf);}
/* 型別陣列的內容雜湊（FNV-1a，每次 4 個位元組） */
function taHash(a){var B=new Uint8Array(a.buffer,a.byteOffset,a.byteLength),n=a.byteOffset&3?0:a.byteLength>>2,W=n?new Int32Array(a.buffer,a.byteOffset,n):null,h=-2128831035^a.byteLength,i;for(i=0;i<n;i++)h=Math.imul(h^W[i],16777619);for(i=n<<2;i<B.length;i++)h=Math.imul(h^B[i],16777619);return h;}
/* 壓縮結果依內容快取：taSnap 在拍快照的瞬間檢查（內容沒變就沿用上次的結果，否則複製一份），taFin 之後再壓縮 */
var PKC=typeof WeakMap!=='undefined'?new WeakMap():null;
function taSnap(a){var h=taHash(a),c=PKC&&PKC.get(a);if(c&&c.h===h)return {s:c.s};return {a:a,h:h,c:a.slice()};}
async function taFin(J){if(J.s===undefined){J.s=await packTA(J.c);if(PKC)PKC.set(J.a,{h:J.h,s:J.s});J.c=null;}return J.s;}
/* ---------- 二元堆積（最小值） ---------- */
function Heap(){this.k=[];this.v=[];}
Heap.prototype.push=function(v,key){var K=this.k,V=this.v,i=K.length;K.push(key);V.push(v);while(i>0){var p=(i-1)>>1;if(K[p]<=key)break;K[i]=K[p];V[i]=V[p];i=p;}K[i]=key;V[i]=v;};
Heap.prototype.pop=function(){var K=this.k,V=this.v,top=V[0],lk=K.pop(),lv=V.pop(),n=K.length;if(n){var i=0;for(;;){var l=2*i+1;if(l>=n)break;var r=l+1,c=r<n&&K[r]<K[l]?r:l;if(K[c]>=lk)break;K[i]=K[c];V[i]=V[c];i=c;}K[i]=lk;V[i]=lv;}return top;};
Heap.prototype.size=function(){return this.k.length;};
/* 正方形第 r 圈的格子：只走外框，順序與「逐列（ringRow）或逐行（ringCol）掃過整個正方形、略過內部」完全相同；f 傳回 true 時停止並傳回 true */
function ringRow(cx,cy,r,GW,GH,f){for(var b=-r;b<=r;b++){var Y=cy+b;if(Y<0||Y>=GH)continue;if(b===-r||b===r){for(var a=-r;a<=r;a++){var X=cx+a;if(X>=0&&X<GW&&f(X,Y,a,b))return true;}}else{var X1=cx-r,X2=cx+r;if(X1>=0&&X1<GW&&f(X1,Y,-r,b))return true;if(X2>=0&&X2<GW&&f(X2,Y,r,b))return true;}}return false;}
function ringCol(cx,cy,r,GW,GH,f){for(var a=-r;a<=r;a++){var X=cx+a;if(X<0||X>=GW)continue;if(a===-r||a===r){for(var b=-r;b<=r;b++){var Y=cy+b;if(Y>=0&&Y<GH&&f(X,Y,a,b))return true;}}else{var Y1=cy-r,Y2=cy+r;if(Y1>=0&&Y1<GH&&f(X,Y1,a,-r))return true;if(Y2>=0&&Y2<GH&&f(X,Y2,a,r))return true;}}return false;}
/* 尋路用的最小堆：型別陣列、重複使用（不必每次重新配置），取出順序與 Heap 完全相同 */
function THeap(cap){cap=cap||4096;this.k=new Float64Array(cap);this.v=new Int32Array(cap);this.n=0;}
THeap.prototype.push=function(v,key){if(this.n>=this.k.length){var k2=new Float64Array(this.k.length*2),v2=new Int32Array(this.k.length*2);k2.set(this.k);v2.set(this.v);this.k=k2;this.v=v2;}
  var K=this.k,V=this.v,i=this.n++;while(i>0){var p=(i-1)>>1;if(K[p]<=key)break;K[i]=K[p];V[i]=V[p];i=p;}K[i]=key;V[i]=v;};
THeap.prototype.pop=function(){var K=this.k,V=this.v,top=V[0],n=--this.n,lk=K[n],lv=V[n];if(n){var i=0;for(;;){var l=2*i+1;if(l>=n)break;var r=l+1,c=r<n&&K[r]<K[l]?r:l;if(K[c]>=lk)break;K[i]=K[c];V[i]=V[c];i=c;}K[i]=lk;V[i]=lv;}return top;};
THeap.prototype.size=function(){return this.n;};
/* ---------- 顏色 ---------- */
function rgbOf(h){h=String(h||'#888').replace('#','');if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];var n=parseInt(h,16)||0;return [n>>16&255,n>>8&255,n&255];}
function hexOf(c){return '#'+c.map(function(v){v=clamp(Math.round(v),0,255);return (v<16?'0':'')+v.toString(16);}).join('').toUpperCase();}
function mixC(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
function ramp(R,v){if(v<=R[0][0])return R[0][1];for(var i=1;i<R.length;i++)if(v<R[i][0]){var a=R[i-1],b=R[i],t=(v-a[0])/(b[0]-a[0]);return mixC(a[1],b[1],clamp(t,0,1));}return R[R.length-1][1];}
function mkCanvas(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c;}
