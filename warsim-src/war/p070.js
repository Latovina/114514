/* ===================== 測量工具：測距（折線距離、方位角、地形剖面與通視）、面積、角度、範圍圈、公里方格；比例尺改為黑白分段 =====================
   地圖右上角的 📏 開關測量模式。點選地圖加入點，拖曳仍是平移；完成的測量留在地圖上直到清除（不存進存檔）。 */
var MS={k:'ruler',pts:[],list:[],g:null,eye:2,tgt:2,grid:false};
(function(){try{var o=JSON.parse(localStorage.getItem('lato-warsim-ms')||'{}');if(o.k)MS.k=o.k;MS.grid=!!o.grid;if(o.eye>=0)MS.eye=o.eye;if(o.tgt>=0)MS.tgt=o.tgt;}catch(e){}})();
function msSave(){try{localStorage.setItem('lato-warsim-ms',JSON.stringify({k:MS.k,grid:MS.grid,eye:MS.eye,tgt:MS.tgt}));}catch(e){}}
var MSK={ruler:['📏','測距','點選地圖加入折點，按「完成」或 Enter 結束；只有兩點時會畫地形剖面並判斷通視'],area:['⬠','面積','點選地圖圍出範圍（至少三點），按「完成」或 Enter 結束'],angle:['∠','角度','依序點選三點：第一臂端點、頂點、第二臂端點'],circle:['◎','範圍圈','先點圓心，再點半徑上的一點']};
function msChk(){if(MS.g!==G){MS.g=G;MS.pts=[];MS.list=[];}}
function msBrg(x0,y0,x1,y1){return (Math.atan2(x1-x0,-(y1-y0))*180/Math.PI+360)%360;}
function msBrgTxt(b){return Math.round(b)%360+'°（'+Math.round(b*6400/360)%6400+' 密位）';}
function msLen(P){var n=0;for(var i=2;i<P.length;i+=2)n+=dist(P[i-2],P[i-1],P[i],P[i+1]);return n;}
function msArea(P){var a=0,n=P.length/2;for(var i=0;i<n;i++){var j=(i+1)%n;a+=P[2*i]*P[2*j+1]-P[2*j]*P[2*i+1];}return Math.abs(a)/2;}
function msAreaTxt(a){return a>=1e6?fx(a/1e6,a>=1e8?0:2)+' 平方公里':fx(a/1e4,1)+' 公頃';}
function msAng(P){var ax=P[0]-P[2],ay=P[1]-P[3],bx=P[4]-P[2],by=P[5]-P[3],la=Math.hypot(ax,ay),lb=Math.hypot(bx,by);if(!la||!lb)return 0;return Math.acos(clamp((ax*bx+ay*by)/(la*lb),-1,1))*180/Math.PI;}
/* 沿折線取樣：地面高程與含地物（樹林、建築）的高度 */
function msProfile(P,n){var L=msLen(P),out=[],MP=G.map;n=n||120;if(!L)return out;for(var i=0;i<=n;i++){var d=L*i/n,acc=0;for(var j=2;j<P.length;j+=2){var s=dist(P[j-2],P[j-1],P[j],P[j+1]);if(acc+s>=d||j===P.length-2){var t=s?clamp((d-acc)/s,0,1):0,x=P[j-2]+(P[j]-P[j-2])*t,y=P[j-1]+(P[j+1]-P[j-1])*t,k=cellAt(x,y);out.push({d:d,x:x,y:y,e:Math.max(0,MP.el[k]),h:hAt(k)});break;}acc+=s;}}return out;}
/* 兩點通視：沿用模擬的通視判斷（含地球曲率、觀測者附近地物不遮蔽、軍事稜線前出），並找出第一個遮蔽點 */
function msLos(P){var A=[P[0],P[1]],B=[P[P.length-2],P[P.length-1]],ok=los(A[0],A[1],MS.eye,B[0],B[1],MS.tgt),pr=msProfile([A[0],A[1],B[0],B[1]],160),blk=null;
  if(!ok&&pr.length){var e0=pr[0].e+MS.eye,e1=pr[pr.length-1].e+MS.tgt,D=pr[pr.length-1].d,Rm=(G.map.R||6371)*1000*1.33,rl=losR();for(var i=1;i<pr.length-1;i++){var q=pr[i],t=q.d/D;if(q.d<rl)continue;var line=e0+(e1-e0)*t-q.d*(D-q.d)/(2*Rm);if(q.h>line){blk=q;break;}}}return {ok:ok,blk:blk,pr:pr};}
function msInfo(M){var P=M.pts,k=M.k;if(k==='ruler'){var L=msLen(P);return L?'總長 '+kmTxt(L)+(P.length===4?'，方位 '+msBrgTxt(msBrg(P[0],P[1],P[2],P[3])):'，'+(P.length/2-1)+' 段'):'';}
  if(k==='area')return P.length>=6?'面積 '+msAreaTxt(msArea(P))+'，周長 '+kmTxt(msLen(P.concat([P[0],P[1]]))):'';
  if(k==='angle')return P.length>=6?'夾角 '+fx(msAng(P),1)+'°（兩臂 '+kmTxt(dist(P[0],P[1],P[2],P[3]))+'、'+kmTxt(dist(P[4],P[5],P[2],P[3]))+'）':'';
  if(k==='circle')return P.length>=4?(function(){var r=dist(P[0],P[1],P[2],P[3]);return '半徑 '+kmTxt(r)+'，面積 '+msAreaTxt(Math.PI*r*r);})():'';return '';}
/* ---------- 點選與完成 ---------- */
function msClick(x,y){msChk();var n0=MS.pts.length,t=w2s(x,y),near=function(i){var q=w2s(MS.pts[i],MS.pts[i+1]);return Math.hypot(q[0]-t[0],q[1]-t[1])<9;};
  /* 再點一次最後一點（或雙擊）完成；面積點回第一點時閉合 */
  if(n0>=2&&(MS.k==='ruler'||MS.k==='area')&&(near(n0-2)||MS.k==='area'&&n0>=6&&near(0))){msDone();return;}MS.pts.push(x,y);var n=MS.pts.length/2;if(MS.k==='angle'&&n>=3||MS.k==='circle'&&n>=2)msDone();else{modeBt();vDraw(false);msPanel();}}
function msDone(){msChk();var n=MS.pts.length/2,need={ruler:2,area:3,angle:3,circle:2}[MS.k];if(n>=need){MS.list.push({k:MS.k,pts:MS.pts.slice()});if(MS.list.length>40)MS.list.shift();}else if(n)toast(MSK[MS.k][1]+'至少要 '+need+' 點。');MS.pts=[];modeBt();vDraw(false);msPanel();}
ACT.msdone=function(){msDone();};
ACT.msundo=function(){msChk();if(MS.pts.length)MS.pts.splice(-2,2);else MS.list.pop();modeBt();vDraw(false);msPanel();};
ACT.msclr=function(){MS.pts=[];MS.list=[];modeBt();vDraw(false);msPanel();};
ACT.msk=function(b){if(MS.pts.length)msDone();MS.k=b.getAttribute('data-v');msSave();modeBt();};
ACT.msgrid=function(){MS.grid=!MS.grid;msSave();modeBt();vDraw(false);};
ACT.msoff=function(){MS.pts=[];setTool('sel');msPanel();};
CHG.mseye=function(t){MS[t.getAttribute('data-f')]=clamp(+t.value||0,0,500);msSave();msPanel();};
function msToggle(){if(!G||!G.map)return;msChk();if(UI.tool==='meas'){ACT.msoff();return;}setTool('meas');}
/* 地圖點選：測量模式時攔下（各分頁的 UI.onClick 照常設定） */
(function(){var cur=UI.onClick;function wrapped(x,y,sx,sy,e){if(UI.tool==='meas'&&G&&G.map){msClick(x,y);return;}if(cur)return cur.apply(this,arguments);}
  Object.defineProperty(UI,'onClick',{configurable:true,enumerable:true,get:function(){return wrapped;},set:function(f){cur=f===wrapped?cur:f;}});})();
(function(){var b=modeBt;modeBt=function(){if(VW.mode)VW.mode.classList.toggle('ms',UI.tool==='meas');if(UI.tool==='meas'&&VW.mode){msChk();var K=MSK[MS.k],cur={k:MS.k,pts:MS.pts},inf=msInfo(cur);VW.mode.hidden=false;
    VW.mode.innerHTML='<span style="white-space:nowrap">'+Object.keys(MSK).map(function(k){return '<button type="button" data-a="msk" data-v="'+k+'"'+(k===MS.k?' style="font-weight:700;outline:2px solid #1565c0"':'')+' title="'+MSK[k][2]+'">'+MSK[k][0]+' '+MSK[k][1]+'</button>';}).join('')+'</span> '+
      '<span>'+K[2]+(inf?'：<b>'+inf+'</b>':'')+'</span> '+(MS.pts.length?'<button type="button" data-a="msdone">完成</button>':'')+'<button type="button" data-a="msundo" title="Backspace">復原</button><button type="button" data-a="msclr">清除全部</button><button type="button" data-a="msgrid"'+(MS.grid?' style="font-weight:700"':'')+'>'+(MS.grid?'▦ 方格：開':'▦ 方格：關')+'</button><button type="button" data-a="msoff">關閉</button>';return;}return b();};})();
(function(){var b=setTool;setTool=function(t){var was=UI.tool;b(t);if(was==='meas'&&t!=='meas')msPanel();var e=VW.wrap&&VW.wrap.querySelector('.lw-msbt');if(e)e.classList.toggle('on',t==='meas');};})();
document.addEventListener('keydown',function(e){if(UI.tool!=='meas'||/INPUT|SELECT|TEXTAREA/.test((e.target&&e.target.tagName)||''))return;if(e.key==='Enter'){e.preventDefault();msDone();}else if(e.key==='Backspace'){e.preventDefault();ACT.msundo();}else if(e.key==='Escape'){e.preventDefault();if(MS.pts.length){MS.pts=[];modeBt();vDraw(false);msPanel();}else ACT.msoff();}});
/* ---------- 地圖按鈕與地形剖面面板 ---------- */
(function(){var b=viewMount;viewMount=function(host){b(host);var Z=VW.wrap&&VW.wrap.querySelector('.lw-zm');if(!Z)return;var bt=document.createElement('button');bt.type='button';bt.className='lw-msbt'+(UI.tool==='meas'?' on':'');bt.title='測量工具：距離、面積、角度、範圍圈、地形剖面與通視';bt.textContent='📏';bt.addEventListener('click',function(e){e.stopPropagation();msToggle();});Z.appendChild(bt);
  var P=document.createElement('div');P.className='lw-msp';P.hidden=true;VW.wrap.appendChild(P);P.addEventListener('pointerdown',function(e){e.stopPropagation();});VW.msp=P;};})();
function msPanel(){var P=VW.msp;if(!P)return;var M=MS.pts.length>=4&&MS.k==='ruler'?{k:'ruler',pts:MS.pts}:null;if(!M){for(var i=MS.list.length-1;i>=0;i--)if(MS.list[i].k==='ruler'){M=MS.list[i];break;}}
  if(UI.tool!=='meas'||!M||!G||!G.map){P.hidden=true;return;}var two=M.pts.length===4,pr=two?null:msProfile(M.pts,140),L=two?msLos(M.pts):null;if(L)pr=L.pr;if(!pr||pr.length<2){P.hidden=true;return;}
  var W=300,H=96,mn=Infinity,mx=-Infinity;pr.forEach(function(q){mn=Math.min(mn,q.e);mx=Math.max(mx,q.h,q.e);});if(L){mx=Math.max(mx,pr[0].e+MS.eye,pr[pr.length-1].e+MS.tgt);}var sp=Math.max(10,mx-mn),D=pr[pr.length-1].d,X=function(d){return 4+d/D*(W-8);},Y=function(h){return H-6-(h-mn)/sp*(H-16);};
  var gnd='M'+pr.map(function(q){return X(q.d).toFixed(1)+','+Y(q.e).toFixed(1);}).join('L')+'L'+X(D)+','+H+'L'+X(0)+','+H+'Z',cov='M'+pr.map(function(q){return X(q.d).toFixed(1)+','+Y(q.h).toFixed(1);}).join('L');
  var up=0,dn=0;for(var i=1;i<pr.length;i++){var dh=pr[i].e-pr[i-1].e;if(dh>0)up+=dh;else dn-=dh;}
  var svg='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" style="display:block;background:#f4f1ea;border-radius:4px"><path d="'+gnd+'" fill="#b9a27a" stroke="#7a6038" stroke-width="1"/><path d="'+cov+'" fill="none" stroke="#3d7a3a" stroke-width="1" stroke-dasharray="2 2"/>'+
    (L?'<line x1="'+X(0)+'" y1="'+Y(pr[0].e+MS.eye)+'" x2="'+X(D)+'" y2="'+Y(pr[pr.length-1].e+MS.tgt)+'" stroke="'+(L.ok?'#1b7f2a':'#c62828')+'" stroke-width="1.6"'+(L.ok?'':' stroke-dasharray="5 3"')+'/>'+(L.blk?'<circle cx="'+X(L.blk.d)+'" cy="'+Y(L.blk.h)+'" r="3.5" fill="#c62828"/>':''):'')+'</svg>';
  P.innerHTML='<div style="display:flex;justify-content:space-between;gap:8px"><b>地形剖面</b><span>'+kmTxt(D)+'，最高 '+fmt(mx)+' 公尺、最低 '+fmt(mn)+' 公尺</span></div>'+svg+'<div>累計爬升 '+fmt(up)+' 公尺、下降 '+fmt(dn)+' 公尺'+(two?'；起點 '+fmt(pr[0].e)+' 公尺 → 終點 '+fmt(pr[pr.length-1].e)+' 公尺':'')+'</div>'+
    (L?'<div style="margin-top:2px">通視：<b style="color:'+(L.ok?'#1b7f2a':'#c62828')+'">'+(L.ok?'看得到':'看不到')+'</b>'+(L.blk?'（距起點 '+kmTxt(L.blk.d)+' 處被'+(L.blk.h-L.blk.e>2?'地物':'地形')+'遮蔽）':'')+'　觀測高 <input type="number" min="0" max="500" value="'+MS.eye+'" data-c="mseye" data-f="eye" style="width:4em"> 公尺，目標高 <input type="number" min="0" max="500" value="'+MS.tgt+'" data-c="mseye" data-f="tgt" style="width:4em"> 公尺</div>':'');P.hidden=false;}
/* ---------- 繪製 ---------- */
function msLabel(c,x,y,t,col){c.font='600 11.5px sans-serif';var w=c.measureText(t).width+8;c.fillStyle='rgba(255,255,255,.9)';c.fillRect(x-w/2,y-9,w,17);c.strokeStyle=col||'#333';c.lineWidth=1;c.strokeRect(x-w/2,y-9,w,17);c.fillStyle='#111';c.textAlign='center';c.textBaseline='middle';c.fillText(t,x,y);}
function msPath(c,S,close){c.beginPath();for(var i=0;i<S.length;i+=2){if(!i)c.moveTo(S[i],S[i+1]);else c.lineTo(S[i],S[i+1]);}if(close)c.closePath();}
function msDraw1(c,M,live){var P=M.pts.slice(),hv=live&&VW.hover;if(hv&&P.length&&!(M.k==='angle'&&P.length>=6)&&!(M.k==='circle'&&P.length>=4))P.push(hv.wx,hv.wy);if(P.length<2)return;var S=[];for(var i=0;i<P.length;i+=2){var s=w2s(P[i],P[i+1]);S.push(s[0],s[1]);}
  var col=M.k==='area'?'#e65100':M.k==='angle'?'#6a1b9a':M.k==='circle'?'#00695c':'#0d47a1';c.save();c.lineJoin='round';
  if(M.k==='circle'&&S.length>=4){var r=Math.hypot(S[2]-S[0],S[3]-S[1]),rw=dist(P[0],P[1],P[2],P[3]);c.beginPath();c.arc(S[0],S[1],r,0,Math.PI*2);c.fillStyle='rgba(0,105,92,.10)';c.fill();c.lineWidth=4;c.strokeStyle='rgba(255,255,255,.85)';c.stroke();c.lineWidth=2;c.strokeStyle=col;c.setLineDash([7,4]);c.stroke();c.setLineDash([]);
    c.beginPath();c.moveTo(S[0],S[1]);c.lineTo(S[2],S[3]);c.stroke();msLabel(c,(S[0]+S[2])/2,(S[1]+S[3])/2-12,'半徑 '+kmTxt(rw),col);}
  else{if(M.k==='area'&&S.length>=6){msPath(c,S,true);c.fillStyle='rgba(230,81,0,.14)';c.fill();}msPath(c,S,M.k==='area'&&S.length>=6);c.lineWidth=4;c.strokeStyle='rgba(255,255,255,.85)';c.stroke();c.lineWidth=2;c.strokeStyle=col;c.setLineDash(live?[6,4]:[]);c.stroke();c.setLineDash([]);}
  for(var j=0;j<S.length;j+=2){c.beginPath();c.arc(S[j],S[j+1],j===0?4.5:3.5,0,Math.PI*2);c.fillStyle='#fff';c.fill();c.lineWidth=2;c.strokeStyle=col;c.stroke();}
  if(M.k==='ruler'){var acc=0;for(var q=2;q<P.length;q+=2){var d=dist(P[q-2],P[q-1],P[q],P[q+1]);acc+=d;if(P.length>4||live)msLabel(c,(S[q-2]+S[q])/2,(S[q-1]+S[q+1])/2-12,kmTxt(d)+'・'+Math.round(msBrg(P[q-2],P[q-1],P[q],P[q+1]))+'°',col);}
    msLabel(c,S[S.length-2],S[S.length-1]+16,(P.length>4?'共 ':'')+kmTxt(acc)+(P.length===4?'・方位 '+Math.round(msBrg(P[0],P[1],P[2],P[3]))+'°':''),col);}
  if(M.k==='area'&&P.length>=6){var cx=0,cy=0;for(var a=0;a<S.length;a+=2){cx+=S[a];cy+=S[a+1];}cx/=S.length/2;cy/=S.length/2;msLabel(c,cx,cy,msAreaTxt(msArea(P)),col);}
  if(M.k==='angle'&&P.length>=6){var a1=Math.atan2(S[1]-S[3],S[0]-S[2]),a2=Math.atan2(S[5]-S[3],S[4]-S[2]),dA=a2-a1;while(dA>Math.PI)dA-=2*Math.PI;while(dA<-Math.PI)dA+=2*Math.PI;c.beginPath();c.arc(S[2],S[3],22,a1,a1+dA,dA<0);c.lineWidth=2;c.strokeStyle=col;c.stroke();
    msLabel(c,S[2]+Math.cos(a1+dA/2)*40,S[3]+Math.sin(a1+dA/2)*40,fx(msAng(P),1)+'°',col);}
  c.restore();}
/* 公里方格：依比例自動選 1／2／5／10 公里，左上角標示座標（公里） */
function msGrid(c){var m=mpp(),st=[1000,2000,5000,10000,20000,50000].filter(function(v){return v/m>=60;})[0]||50000,a=s2w(0,0),b=s2w(VW.cw,VW.ch);c.save();c.strokeStyle='rgba(20,20,20,.28)';c.lineWidth=1;c.font='10px sans-serif';c.fillStyle='rgba(20,20,20,.75)';c.textBaseline='top';
  for(var x=Math.ceil(Math.max(0,a[0])/st)*st;x<=Math.min(G.map.Wm,b[0]);x+=st){var s=w2s(x,0);c.beginPath();c.moveTo(s[0]+0.5,0);c.lineTo(s[0]+0.5,VW.ch);c.stroke();c.fillText(fx(x/1000,st<1000?1:0),s[0]+2,2);}
  for(var y=Math.ceil(Math.max(0,a[1])/st)*st;y<=Math.min(G.map.Hm,b[1]);y+=st){var t=w2s(0,y);c.beginPath();c.moveTo(0,t[1]+0.5);c.lineTo(VW.cw,t[1]+0.5);c.stroke();c.fillText(fx(y/1000,st<1000?1:0),2,t[1]+2);}c.restore();}
(function(){var b=drawTop;drawTop=function(){b.apply(this,arguments);if(!G||!G.map||!VW.ct)return;try{msChk();if(!MS.list.length&&!MS.pts.length&&!MS.grid)return;var c=VW.ct.getContext('2d');c.setTransform(VW.dpr,0,0,VW.dpr,0,0);if(MS.grid&&UI.tool==='meas')msGrid(c);MS.list.forEach(function(M){msDraw1(c,M,false);});if(UI.tool==='meas'&&MS.pts.length)msDraw1(c,{k:MS.k,pts:MS.pts},true);}catch(e){}};})();
/* 比例尺：黑白相間四段，標示 0、一半與全長 */
drawScale=function(c){var m=mpp(),km=[100,200,500,1000,2000,5000,10000,20000,50000,100000].filter(function(v){return v/m<=150;}).pop()||100,w=km/m,x=VW.cw-w-16-(VW.padR||0),y=VW.ch-12;c.save();c.fillStyle='rgba(255,255,255,.88)';c.fillRect(x-10,y-22,w+20,28);
  for(var i=0;i<4;i++){c.fillStyle=i%2?'#fff':'#111';c.fillRect(x+w*i/4,y-6,w/4,5);}c.strokeStyle='#111';c.lineWidth=1;c.strokeRect(x+0.5,y-6.5,w,6);c.font='10.5px sans-serif';c.fillStyle='#111';c.textAlign='center';c.textBaseline='alphabetic';c.fillText('0',x,y-9);c.fillText(kmTxt(km/2).replace(' 公里','').replace(' 公尺',''),x+w/2,y-9);c.fillText(kmTxt(km),x+w,y-9);c.restore();};
(function(){var st=document.createElement('style');st.textContent='.lw-zm .lw-msbt.on{background:#1565c0;color:#fff}.lw-mode.ms{white-space:normal;max-width:calc(100% - var(--padl,0px) - var(--padr,0px) - 24px);width:max-content;border-radius:10px;text-align:center;line-height:1.9}.lw-mode.ms button{margin:0 2px}.lw-msp{position:absolute;left:calc(var(--padl,0px) + 8px);bottom:78px;z-index:6;background:rgba(255,255,255,.96);border:1px solid #c9c5bb;border-radius:8px;padding:6px 8px;font-size:12px;box-shadow:0 2px 10px rgba(0,0,0,.15);max-width:calc(100% - 16px)}.lw-msp svg{max-width:100%}';document.head.appendChild(st);})();
HELP14.push('<h4>測量工具</h4><ul><li>地圖右上角的 📏 打開測量模式：<b>測距</b>（點選折點，顯示每段距離、方位角與總長；只有兩點時另外畫出地形剖面並判斷通視，可以調整觀測者與目標的高度）、<b>面積</b>（圍出範圍，顯示面積與周長）、<b>角度</b>（三點量夾角）、<b>範圍圈</b>（圓心與半徑，例如火砲射程或防空範圍）。</li><li>拖曳仍然是平移地圖；Enter 完成、Backspace 復原、Esc 取消。完成的測量會留在地圖上直到「清除全部」，不會存進存檔。「方格」顯示公里方格與座標；右下角的比例尺為黑白分段。</li><li>方位角以正北為 0°、順時針計算，並換算成密位（一圈 6400 密位）。通視判斷與模擬的偵察相同：考慮地形、樹林與建築的高度、地球曲率，觀測者附近的地物不算遮蔽。</li></ul>');
