
/* ===== MediaWiki:Gadget-LatoArmory.js：貼上這段 ===== */
(function(){
"use strict";
/* 掛載：LatoArmoryMount(元素, 宿主)。宿主（可省略）可提供 store(鍵, 值)（取代瀏覽器儲存）、cur()（顯示用幣種 {n,sym,usd}）、showUsd()、onChange(種類)（資料改變時通知）、omit（不顯示的分頁）、tab（開啟時的分頁）、title */
function mount(root,H){
if(!root||!window.LatoArmoryLib)return null;H=H||{};
var A=window.LatoArmoryLib,PI=Math.PI,D2R=PI/180;
function q(k){return root.querySelector('[data-k="'+k+'"]');}
function esc(s){return String(s===undefined||s===null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function fx(n,d){if(n===null||n===undefined||!isFinite(n))return '—';var a=Math.abs(n);d=d===undefined?(a>=100?0:a>=10?1:2):d;return n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});}
function opts(list,sel){return list.map(function(o){return '<option value="'+esc(o[0])+'"'+(String(o[0])===String(sel)?' selected':'')+'>'+esc(o[1])+'</option>';}).join('');}
function dl(name,blob){var a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(u);a.remove();},2000);}
function store(k,v){if(H.store)return H.store(k,v);try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||'null');localStorage.setItem(k,JSON.stringify(v));}catch(e){return null;}}

/* ---------- library state: built-ins plus the user's own and edited entries ---------- */
var KEY='latoArmory.v1';
var S={mats:[],proj:[],set:{rate:2.5,market:'mil',lot:1,alt:0,T:15,g:9.80665,wind:0,charge:100,usd:true,cur:'dy',curs:[]},last:null};
var BASEM={},BASEP={};A.MATS.forEach(function(m){BASEM[m.id]=1;});A.PROJ.forEach(function(p){BASEP[p.id]=1;});
function loadLib(){var sv=store(KEY)||{};S.mats=A.MATS.map(A.cloneObj);S.proj=A.PROJ.map(A.cloneObj);
  S.proj.forEach(function(p){A.calibrateCost(p,S.mats);});
  (sv.mats||[]).forEach(function(m){var i=idxOf(S.mats,m.id);if(i>=0)S.mats[i]=m;else S.mats.push(m);});
  (sv.proj||[]).forEach(function(p){var i=idxOf(S.proj,p.id);if(i>=0)S.proj[i]=p;else S.proj.push(p);});
  if(sv.set)Object.keys(sv.set).forEach(function(k){S.set[k]=sv.set[k];});}
function saveLib(){var sv={set:S.set,mats:S.mats.filter(function(m){return m._u;}),proj:S.proj.filter(function(p){return p._u;})};store(KEY,sv);}
function idxOf(a,id){for(var i=0;i<a.length;i++)if(a[i].id===id)return i;return -1;}
function P(id){var i=idxOf(S.proj,id);return S.proj[i>=0?i:0];}
function M(id){return A.mat(id,S.mats);}
function env(){return {alt:S.set.alt,T:S.set.T,g:S.set.g,wind:S.set.wind};}
function eo(extra){var o={lib:S.mats,charge:S.set.charge/100,env:env()};if(extra)Object.keys(extra).forEach(function(k){o[k]=extra[k];});return o;}
loadLib();xload();

/* ---------- money and mass ---------- */
/* 幣種：東銀圓（1 東銀圓＝匯率設定的美元）、美元，以及自訂的原創幣種（各自掛勾美元）；所有金額內部以美元或東銀圓計，顯示時換算 */
function curList(){var L=[{k:'dy',n:'東銀圓',sym:'',usd:S.set.rate},{k:'usd',n:'美元',sym:'US$',usd:1}];(S.set.curs||[]).forEach(function(c){if(c&&c.k&&c.usd>0)L.push(c);});return L;}
function curC(){if(H.cur){var h=H.cur();if(h&&h.usd>0)return h;}var L=curList();for(var i=0;i<L.length;i++)if(L[i].k===S.set.cur)return L[i];return L[0];}
function curN(){return curC().n;}
function showUsd(){return H.cur?!!(H.showUsd&&H.showUsd()):!!S.set.usd;}
function money(usd){if(!isFinite(usd))return '—';var c=curC(),d=usd/c.usd;return (c.sym?esc(c.sym):'')+'<b>'+fx(d,d<0.1?3:d<10?2:d<1000?1:0)+'</b>'+(c.sym?'':' '+esc(c.n))+(showUsd()&&c.usd!==1?'<span class="lt-note">（US$ '+fx(usd,usd<10?2:usd<1000?1:0)+'）</span>':'');}
function moneyT(usd){var c=curC(),d=usd/c.usd;return (c.sym||'')+fx(d,d<0.1?4:d<10?2:d<1000?1:0)+(c.sym?'':' '+c.n);}
function mass(g){if(!isFinite(g))return '—';return g>=1000?fx(g/1000,g>=1e5?0:2)+' kg':fx(g,g<10?2:1)+' g';}
function costP(p){return A.costOf(p,{lib:S.mats,market:S.set.market,lot:(A.GROUPS[p.g]||A.GROUPS.rifle)[1]*S.set.lot});}
function small(p){return (p.d||0)<=20.5&&['pistol','rifle','hmg','auto','shot','frag','magic'].indexOf(p.g)>=0&&(p.m||0)<1000;}

/* ---------- armour presets ---------- */
var ARM=[
 ['b2a','body','NIJ IIA 芳綸軟甲',[['km2',2.2]]],['b2','body','NIJ II 芳綸軟甲',[['km2',2.9]]],['b3a','body','NIJ IIIA 芳綸軟甲',[['km2',3.7]]],['b3ape','body','NIJ IIIA 聚乙烯軟甲',[['peud',4.6]]],
 ['b3ar','body','III 級 AR500 鋼板（6.35 mm）',[['ar500',6.35]]],['b3ar6','body','III+ 級 AR600 鋼板（6.35 mm）',[['ar600',6.35]]],['b3pe','body','III 級獨立式聚乙烯板',[['pehb',20]]],
 ['b3c','body','III+ 級氧化鋁陶瓷板',[['al2o3',6.5],['pehb',6]]],['b4a','body','IV 級氧化鋁陶瓷板',[['al2o3',9.5],['pehb',6.5]]],['b4s','body','IV 級碳化矽陶瓷板',[['sic',8.5],['pehb',6]]],
 ['besapi','body','ESAPI 碳化硼陶瓷板',[['b4c',9],['pehb',6.5]]],['bicw','body','IV 級陶瓷板＋IIIA 軟甲（併用）',[['al2o3',9.5],['pehb',6.5],['km2',3.7]]],
 ['hm1','body','M1 鋼盔（1.0 mm 錳鋼）',[['hadf',1.0]]],['hpasgt','body','PASGT 芳綸頭盔',[['aramc',8]]],['hach','body','ACH 先進戰鬥頭盔',[['aramc',7.8]]],['bsilk','body','十九世紀絲綢防彈衣',[['silk',6]]],
 ['vhum','veh','悍馬車門（加裝 HHA）',[['hha',8,0]]],['vmrap','veh','MRAP 側面（12 mm HHA）',[['hha',12,0]]],['vm113','veh','M113 正面（38 mm 鋁 5083，45°）',[['al5083',38,45]]],
 ['vbrad','veh','布萊德雷側面（間隔鋼＋7039 鋁）',[['hha',6.35,0,100],['al7039',25.4,0]]],['vbmp','veh','BMP-1 車首上裝甲（19 mm，57°）',[['rha',19,57]]],
 ['vt34','veh','T-34 車首（45 mm，60°）',[['rha',45,60]]],['vsher','veh','雪曼 車首（51 mm，56°）',[['cast',51,56]]],['vtig','veh','虎式 車首（100 mm，9°）',[['rha',100,9]]],['vpan','veh','豹式 車首上裝甲（80 mm，55°）',[['rha',80,55]]],
 ['vt72','veh','T-72B 砲塔正面（接觸-5＋複合）',[['k5',80,60,20],['chob',520,30]]],['vm1','veh','M1A1HA 砲塔正面（貧鈾網複合）',[['dumesh',720,0]]],['vt90','veh','T-90 車首（遺物＋複合）',[['relikt',90,60,20],['chob',600,0]]],
 ['vslat','veh','柵欄＋布萊德雷側面',[['slat',10,0,400],['hha',6.35,0,100],['al7039',25.4,0]]],
 ['oconc','other','混凝土牆 30 cm',[['conc',300]]],['osand','other','雙層沙包 45 cm',[['sand',450]]],['obrick','other','紅磚牆 23 cm',[['brick',230]]],['odoor','other','汽車車門',[['mild',0.8,0,100],['mild',0.8]]],
 ['owood','other','實木門 4.5 cm',[['oak',45]]],['oglass','other','防彈玻璃 40 mm＋聚碳酸酯',[['glass',40],['pc',6]]],['oauto','other','汽車擋風玻璃（45°）',[['aglass',6,45]]],
 ['xmana','magic','【架空】魔能素胸甲',[['mana',4],['rune',3]]],['xdragon','magic','【架空】龍鱗甲',[['dragon',6],['rune',4]]],['xmith','magic','【架空】秘銀胸板',[['mithril',5]]],['xtank','magic','【架空】魔晶陶瓷戰車裝甲',[['manacer',60,50],['mana',40,50]]]];
var ARMG={body:'人員防護',veh:'車輛裝甲',other:'掩體與建材',magic:'架空裝甲'};
function armLayers(id){for(var i=0;i<ARM.length;i++)if(ARM[i][0]===id)return ARM[i][3].map(function(l){return {mat:l[0],t:l[1],ang:l[2]||0,gap:l[3]||0};});return [];}
function armOpts(sel,filter){var h='';Object.keys(ARMG).forEach(function(g){var it=ARM.filter(function(a){return a[1]===g&&(!filter||filter(a));});if(!it.length)return;h+='<optgroup label="'+ARMG[g]+'">'+it.map(function(a){return '<option value="'+a[0]+'"'+(a[0]===sel?' selected':'')+'>'+esc(a[2])+'</option>';}).join('')+'</optgroup>';});return '<option value="">（自訂疊層）</option>'+h;}
function projOpts(sel,filter){var h='';Object.keys(A.GROUPS).forEach(function(g){var it=S.proj.filter(function(p){return p.g===g&&(!filter||filter(p));});if(!it.length)return;h+='<optgroup label="'+A.GROUPS[g][0]+'">'+it.map(function(p){return '<option value="'+esc(p.id)+'"'+(p.id===sel?' selected':'')+'>'+esc(p.n)+(p._u?' ✎':'')+'</option>';}).join('')+'</optgroup>';});return h;}
var CATN={metal:'金屬',ceramic:'陶瓷',fiber:'纖維／織物',poly:'聚合物',glass:'玻璃',conc:'混凝土與磚',soil:'土石',wood:'木材與板材',liquid:'液體',tissue:'人體組織',comp:'複合裝甲（等效）',era:'反應／柵欄裝甲'};
function matOpts(sel){var h='';Object.keys(CATN).forEach(function(c){var it=S.mats.filter(function(m){return m.cat===c;});if(!it.length)return;h+='<optgroup label="'+CATN[c]+'">'+it.map(function(m){return '<option value="'+esc(m.id)+'"'+(m.id===sel?' selected':'')+'>'+esc(m.n)+(m.mg?' ✦':'')+'</option>';}).join('')+'</optgroup>';});return h;}

/* ---------- layer editor ---------- */
function layerEditor(box,get,set,onChange){
  function draw(){var L=get();box.innerHTML='<div class="lt-sc"><table class="lt-dt lt-lay"><tr><th>#</th><th class="l">材料</th><th>厚度 mm</th><th>傾角 °</th><th>後方間隙 mm</th><th>面密度 kg/m²</th><th></th></tr>'+
    L.map(function(l,i){var m=M(l.mat);return '<tr data-i="'+i+'"><td>'+(i+1)+'</td><td class="l"><select data-f="mat">'+matOpts(l.mat)+'</select></td><td><input type="number" data-f="t" value="'+l.t+'" min="0" step="0.1"></td>'+
      '<td><input type="number" data-f="ang" value="'+(l.ang||0)+'" min="0" max="89" step="1"></td><td><input type="number" data-f="gap" value="'+(l.gap||0)+'" min="0" step="5"></td><td>'+fx((+l.t||0)*m.rho)+'</td>'+
      '<td><button type="button" data-up="'+i+'" title="上移">↑</button><button type="button" data-del="'+i+'" title="刪除">✕</button></td></tr>';}).join('')+'</table></div>'+
    '<div class="row"><button type="button" data-add="1">新增一層</button><label>全部傾角 <input type="number" data-allang="1" value="" placeholder="°" style="width:56px"></label><button type="button" data-setang="1">套用</button><span class="lt-note">傾角為北約定義：與裝甲板法線的夾角（0° 為垂直正射）。由外而內排列。</span></div>';}
  box.addEventListener('change',function(e){var tr=e.target.closest('tr[data-i]');if(!tr)return;var L=get(),l=L[+tr.getAttribute('data-i')],f=e.target.getAttribute('data-f');if(!l||!f)return;l[f]=f==='mat'?e.target.value:+e.target.value;set(L);draw();onChange();});
  box.addEventListener('click',function(e){var b=e.target,L=get();if(b.hasAttribute('data-add')){var last=L[L.length-1];L.push({mat:last?last.mat:'rha',t:last?last.t:10,ang:last?last.ang:0,gap:0});}
    else if(b.hasAttribute('data-del'))L.splice(+b.getAttribute('data-del'),1);else if(b.hasAttribute('data-up')){var i=+b.getAttribute('data-up');if(i>0){var t=L[i];L[i]=L[i-1];L[i-1]=t;}}
    else if(b.hasAttribute('data-setang')){var v=box.querySelector('[data-allang]').value;if(v==='')return;L.forEach(function(l){l.ang=clamp(+v,0,89);});}else return;set(L);draw();onChange();});
  draw();return draw;}

/* ---------- canvas charts ---------- */
function cvs(c,h){var w=Math.max(280,c.clientWidth||c.parentNode.clientWidth||600),r=window.devicePixelRatio||1;c.width=w*r;c.height=h*r;c.style.height=h+'px';var g=c.getContext('2d');g.setTransform(r,0,0,r,0,0);g.clearRect(0,0,w,h);return {g:g,w:w,h:h};}
function niceMax(v){if(!(v>0))return 1;var p=Math.pow(10,Math.floor(Math.log10(v))),n=v/p;return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p;}
function chart(c,o){/* o: {h, x:[label,max], y:[label,max], series:[{c,pts:[[x,y]],w,dash,fill,label}], hl:[{y,c,label}], vl:[{x,c,label}]} */
  var C=cvs(c,o.h||240),g=C.g,L=54,R=12,T=14,B=34,W=C.w-L-R,H=C.h-T-B,xm=niceMax(o.x[1]),ym=o.y[1]>0?niceMax(o.y[1]):1,ymin=o.y[2]<0?-niceMax(-o.y[2]):(o.y[2]||0);
  function X(x){return L+x/xm*W;}function Y(y){return T+H-(y-ymin)/(ym-ymin)*H;}
  g.font='11px system-ui,sans-serif';g.strokeStyle='#e3e3e3';g.fillStyle='#666';g.lineWidth=1;
  for(var i=0;i<=5;i++){var yv=ymin+(ym-ymin)*i/5,yy=Y(yv);g.beginPath();g.moveTo(L,yy);g.lineTo(L+W,yy);g.stroke();g.textAlign='right';g.fillText(fx(yv,yv<10&&ym<20?1:0),L-5,yy+4);}
  for(i=0;i<=5;i++){var xv=xm*i/5,xx=X(xv);g.beginPath();g.moveTo(xx,T);g.lineTo(xx,T+H);g.stroke();g.textAlign='center';g.fillText(fx(xv,xv<10&&xm<20?1:0),xx,T+H+14);}
  g.fillStyle='#444';g.textAlign='center';g.fillText(o.x[0],L+W/2,C.h-4);g.save();g.translate(12,T+H/2);g.rotate(-PI/2);g.fillText(o.y[0],0,0);g.restore();
  (o.fills||[]).forEach(function(f){g.fillStyle=f.c;g.beginPath();f.top.forEach(function(p,j){var px=X(p[0]),py=Y(p[1]);if(j)g.lineTo(px,py);else g.moveTo(px,py);});for(var j=f.bot.length-1;j>=0;j--)g.lineTo(X(f.bot[j][0]),Y(f.bot[j][1]));g.closePath();g.fill();});
  (o.hl||[]).forEach(function(l){g.strokeStyle=l.c;g.setLineDash([5,4]);g.lineWidth=1.5;g.beginPath();g.moveTo(L,Y(l.y));g.lineTo(L+W,Y(l.y));g.stroke();g.setLineDash([]);g.fillStyle=l.c;g.textAlign='right';g.fillText(l.label||'',L+W-4,Y(l.y)-4);});
  (o.vl||[]).forEach(function(l){g.strokeStyle=l.c;g.setLineDash([3,3]);g.lineWidth=1.2;g.beginPath();g.moveTo(X(l.x),T);g.lineTo(X(l.x),T+H);g.stroke();g.setLineDash([]);g.fillStyle=l.c;g.textAlign='left';g.fillText(l.label||'',X(l.x)+3,T+H-6);});
  (o.series||[]).forEach(function(s){g.strokeStyle=s.c;g.lineWidth=s.w||2;if(s.dash)g.setLineDash(s.dash);g.beginPath();s.pts.forEach(function(p,j){var px=X(p[0]),py=Y(clamp(p[1],ymin,ym));if(j)g.lineTo(px,py);else g.moveTo(px,py);});g.stroke();g.setLineDash([]);});
  var lx=L+8;(o.series||[]).concat(o.hl||[]).forEach(function(s){if(!s.label||s.y!==undefined)return;g.fillStyle=s.c;g.fillRect(lx,T+4,12,3);g.fillStyle='#333';g.textAlign='left';g.fillText(s.label,lx+16,T+9);lx+=g.measureText(s.label).width+34;});
  return {X:X,Y:Y};}
function bars(c,vals,labels,o){var C=cvs(c,o.h||180),g=C.g,L=40,B=26,T=10,W=C.w-L-10,H=C.h-T-B,n=vals.length,bw=W/n*0.7;g.font='11px system-ui,sans-serif';
  for(var i=0;i<=4;i++){var y=T+H-H*i/4;g.strokeStyle='#e6e6e6';g.beginPath();g.moveTo(L,y);g.lineTo(L+W,y);g.stroke();g.fillStyle='#666';g.textAlign='right';g.fillText(Math.round(i*25)+'%',L-4,y+4);}
  vals.forEach(function(v,i){var x=L+W/n*(i+0.15),h=H*v;g.fillStyle=v>0.5?'#C62828':v>0.1?'#EF6C00':'#2E7D32';g.fillRect(x,T+H-h,bw,h);g.fillStyle='#333';g.textAlign='center';g.fillText(labels[i],x+bw/2,T+H+14);g.fillText(Math.round(v*100)+'%',x+bw/2,T+H-h-3);});}

/* ---------- side-view penetration animation ----------
   The shot travels left to right. Plates are drawn in true line-of-sight thickness and sloped with the struck face leaning back
   from the incoming round ("/"), as a glacis would be. Each material answers with its own effect: sparks, crater, plug and spall
   (metal), powder, radial cracks and fracture cone (ceramic), back-face bulge and frayed fibres (textiles), spider-web cracks and
   shards (glass), dust and chunks (masonry and earth), splinters (wood), splash (liquid), detonating cassettes (reactive armour)
   and an element-coloured shield (魔能 materials). */
var MATCOL={metal:['#90A4AE','#546E7A'],ceramic:['#F5F5F5','#BDBDBD'],fiber:['#FFE082','#F9A825'],poly:['#E1F5FE','#81D4FA'],glass:['rgba(178,235,242,.55)','#4DD0E1'],conc:['#BDBDBD','#757575'],
  soil:['#D7CCC8','#8D6E63'],wood:['#BCAAA4','#6D4C41'],liquid:['rgba(129,212,250,.6)','#0288D1'],tissue:['#F8BBD0','#C2185B'],comp:['#A1887F','#5D4037'],era:['#FFAB91','#D84315']};
var ELC=['#B388FF','#FF5722','#4DD0E1','#FFEB3B','#FFF8E1','#7E57C2'];
var REDUCED=false;try{REDUCED=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}
function Anim(box){
  box.innerHTML='<div class="lt-anim"><canvas data-a="cv"></canvas><div class="lt-abar"><button type="button" data-a="play">▶ 重播</button><label>速度 <select data-a="spd"><option value="0.35">0.35×</option><option value="0.7" selected>0.7×</option><option value="1.4">1.4×</option></select></label>'+
    '<input type="range" data-a="t" min="0" max="1000" value="0" step="1"><span class="lt-note" data-a="hud"></span></div><div class="lt-aleg" data-a="leg"></div></div>';
  var c=box.querySelector('[data-a="cv"]'),self=this,raf=0,last=0;this.c=c;this.t=0;this.T=1;this.spd=0.7;
  box.querySelector('[data-a="play"]').onclick=function(){self.restart();};
  box.querySelector('[data-a="spd"]').onchange=function(){self.spd=+this.value;};
  box.querySelector('[data-a="t"]').oninput=function(){self.stop();self.seek(+this.value/1000*self.T);};
  this.hud=box.querySelector('[data-a="hud"]');this.leg=box.querySelector('[data-a="leg"]');this.slider=box.querySelector('[data-a="t"]');
  this.loop=function(ts){var dt=last?Math.min(0.05,(ts-last)/1000):0;last=ts;self.step(dt*self.spd);self.draw();self.slider.value=Math.round(self.t/self.T*1000);
    if(self.t<self.T+1.2&&self.playing)raf=requestAnimationFrame(self.loop);else self.playing=false;};
  this.stop=function(){this.playing=false;cancelAnimationFrame(raf);};
  this.restart=function(){this.stop();this.reset();if(REDUCED||!document.body.contains(c)){this.seek(this.T+1.2);return;}this.playing=true;last=0;raf=requestAnimationFrame(this.loop);};
}
Anim.prototype.set=function(L,res,p){this.L=L;this.res=res;this.p=p;this.build();this.restart();};
Anim.prototype.build=function(){var c=this.c,w=Math.max(280,c.clientWidth||c.parentNode.clientWidth||600),h=w<480?210:250,r=window.devicePixelRatio||1;
  c.width=w*r;c.height=h*r;c.style.height=h+'px';this.W=w;this.H=h;this.r=r;var mid=h*0.52,hh=h-62,L=this.L,res=this.res,p=this.p,sc=p.k==='sc';
  /* geometry: line-of-sight widths with a minimum visible thickness, gaps and a stand-off space for shaped charges */
  var tot=0,i;L.forEach(function(l){tot+=(+l.t||0)/Math.max(0.17,Math.cos((l.ang||0)*D2R))+(+l.gap||0);});
  var dxMax=w*0.16,left=(sc?150:70)+dxMax*0.6,avail=w-left-dxMax*0.6-30,scale=Math.min(6,avail/Math.max(1,tot)),G=[],x=left,minW=3;
  L.forEach(function(l,k){var m=M(l.mat),a=clamp(l.ang||0,0,80)*D2R,wl=Math.max(minW,(+l.t||0)*scale/Math.cos(a)),hp=Math.min(hh,a>0.01?2*dxMax/Math.tan(a):hh),dx=Math.tan(a)*hp/2;G.push({x:x,w:wl,a:a,dx:dx,hp:hp,m:m,l:l,k:k});x+=wl+(+l.gap||0)*scale;});
  var over=x-(w-30-dxMax*0.6);if(over>0){var f=(avail-over)/avail;G.forEach(function(g2,k){g2.x=left+(g2.x-left)*f;});}
  this.G=G;this.mid=mid;this.hh=hh;this.scale=scale;
  this.leg.innerHTML=G.map(function(g2){return '<span><b>'+(g2.k+1)+'</b> '+esc(g2.m.n)+' '+fx(+g2.l.t||0,g2.l.t<10?1:0)+' mm'+(g2.l.ang?'、'+g2.l.ang+'°':'')+(g2.l.gap?'、後方間隙 '+g2.l.gap+' mm':'')+'</span>';}).join('');
  /* timeline of the head of the shot */
  var segs=[],ev=[],t=0,hx=12,hy=mid,v0=Math.max(1,(res.v||p.v0||300)),base=p.k==='lr'?330:sc?260:230,self=this;
  function vs(v){return Math.max(26,base*Math.pow(Math.max(0.02,v/v0),0.75));}
  function seg(x1,y1,va,vb,kind,extra){var d=Math.sqrt((x1-hx)*(x1-hx)+(y1-hy)*(y1-hy)),dt=Math.max(0.05,d/((vs(va)+vs(vb))/2));var s={t0:t,t1:t+dt,x0:hx,y0:hy,x1:x1,y1:y1,va:va,vb:vb,kind:kind};
    if(extra)for(var k in extra)s[k]=extra[k];segs.push(s);t+=dt;hx=x1;hy=y1;return s;}
  function at(type,o){o.type=type;o.t=t;ev.push(o);}
  var rows=(res.layers||[]).filter(function(r){return r.res!=='（併入上層計算）'&&r.res!=='略過';}),G0=G[rows.length?rows[0].i:0];
  var slatStop=rows.length&&rows[0].stop&&G0&&G0.m.era&&G0.m.era.slat;
  if(sc&&G0&&!slatStop){seg(G0.x-p.sc.so*Math.min(18,p.sc.cd*scale*0.5+8)-20,mid,v0,v0,'air');at('burst',{x:hx,y:hy});base=900;v0=1;}
  var stopped=false;
  for(var k=0;k<rows.length;k++){var row=rows[k],g=G[row.i];if(!g)continue;var vin=sc?1:(row.vIn||v0),vout=sc?1:(row.vOut!==undefined?row.vOut:vin);
    seg(g.x,mid,vin,vin,'air');at('enter',{g:g,row:row});
    if(p.k==='hesh'||p.k==='he'){t+=1.0;stopped=true;break;}
    if(row.res==='跳彈'||(res.ric&&row.stop&&/掠射|跳/.test(row.res||''))){var ang=-(PI/2-g.a)*0.55-0.25;seg(hx+Math.cos(ang)*180,hy+Math.sin(ang)*180,vin*0.7,vin*0.5,'ric');at('gone',{});stopped=true;break;}
    if(row.stop){var frac=row.dop!==undefined&&row.los?clamp(row.dop/row.los,0.04,0.97):(/護盾/.test(row.res)?0:(g.m.cat==='fiber'?0.55:0.5));
      if(/護盾/.test(row.res||'')){at('shieldstop',{g:g});stopped=true;break;}
      seg(g.x+g.w*frac,mid,vin,0,'in',{g:g});at('stop',{g:g,row:row,frac:frac});stopped=true;break;}
    seg(g.x+g.w,mid,vin,vout,'in',{g:g});at('exit',{g:g,row:row});}
  if(!stopped)seg(w+40,mid,hx>0&&rows.length?(sc?1:(rows[rows.length-1].vOut||v0)):v0,0.8*v0,'air');
  this.segs=segs;this.ev=ev;this.T=t;};
Anim.prototype.reset=function(){this.t=0;this.parts=[];this.dec=[];this.fired=0;this.def=1;this.strip=false;this.shat=false;this.gone=false;this.bulge={};this.jet=null;this.flash=[];this.rng=A.mb32(A.hstr(this.p.id+'|'+this.T.toFixed(3)));};
Anim.prototype.seek=function(t){this.reset();var n=Math.ceil(t/0.016);for(var i=0;i<n;i++)this.step(Math.min(0.016,t-this.t));this.draw();this.slider.value=Math.round(Math.min(1,this.t/this.T)*1000);};
Anim.prototype.head=function(){var s=this.segs,t=this.t;for(var i=0;i<s.length;i++){var g=s[i];if(t<=g.t1){var f=(t-g.t0)/Math.max(1e-6,g.t1-g.t0);f=clamp(f,0,1);return {x:lerp(g.x0,g.x1,f),y:lerp(g.y0,g.y1,f),v:lerp(g.va,g.vb,f),s:g,f:f};}}
  var e=s[s.length-1];return e?{x:e.x1,y:e.y1,v:e.vb,s:e,f:1,end:true}:{x:0,y:this.mid,v:0,f:1,end:true};};
function lerp(a,b,t){return a+(b-a)*t;}
Anim.prototype.puff=function(n,x,y,o){var R=this.rng;for(var i=0;i<n;i++){var a=(o.a0||0)+(R()-0.5)*(o.spread||PI),sp=(o.sp||80)*(0.4+R()*0.9);
  this.parts.push({x:x+(R()-0.5)*(o.jx||0),y:y+(R()-0.5)*(o.jy||0),vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:(o.life||0.8)*(0.6+R()*0.6),age:0,col:o.col[i%o.col.length],sz:(o.sz||2)*(0.6+R()*0.8),g:o.g===undefined?120:o.g,tp:o.tp||'dot',drag:o.drag||0.6});}};
Anim.prototype.fire=function(e){var m=e.g?e.g.m:null,cat=m?m.cat:'',mid=this.mid,x=e.g?e.g.x:0,R=this.rng,p=this.p,soft=p.k==='soft'||p.k==='shot',self=this;
  function crack(type,o){o.type=type;o.g=e.g;self.dec.push(o);}
  if(e.type==='burst'){this.flash.push({x:e.x,y:e.y,r:26,age:0,life:0.35,col:'#FFCA28'});this.puff(26,e.x,e.y,{col:['#9E9E9E','#757575','#FFB300'],sp:120,spread:2*PI,life:0.9,sz:3,g:-10,tp:'smoke'});this.jet={x0:e.x};return;}
  if(e.type==='gone'){this.gone=true;return;}
  if(e.type==='shieldstop'||(m&&m.mg&&e.type==='enter')){var col=ELC[(m.mg&&m.mg.el)||0];crack('shield',{x:x-10,col:col,t:this.t});this.flash.push({x:x-8,y:mid,r:18,age:0,life:0.5,col:col});
    this.puff(14,x-8,mid,{col:[col,'#fff'],sp:90,a0:PI,spread:2.6,life:0.6,sz:2,g:0,tp:'glow'});if(e.type==='shieldstop'){this.gone=true;this.puff(10,x-8,mid,{col:[col],sp:30,spread:2*PI,life:1,sz:3,g:-20,tp:'glow'});return;}}
  if(e.type==='enter'){var back=PI;
    if(e.row&&e.row.res==='跳彈'){this.puff(14,x,mid,{col:['#FFD54F','#FF8F00','#fff'],sp:160,a0:-PI/2-0.6,spread:1.2,life:0.4,sz:1.6,tp:'spark'});crack('scuff',{y:mid});return;}
    if(cat==='metal'||cat==='comp'){this.puff(soft?16:24,x,mid,{col:['#FFF59D','#FFB300','#FF6F00'],sp:soft?110:190,a0:back,spread:1.9,life:0.35,sz:1.4,tp:'spark'});crack('crater',{y:mid,r:soft?4:3});
      if(soft){this.def=Math.max(this.def,1.7);this.puff(8,x-2,mid,{col:['#C77B30','#9E9E9E'],sp:70,a0:back,spread:2.4,life:0.6,sz:1.6});}
      else if(p.k==='core'&&!this.strip){this.strip=true;this.puff(8,x-3,mid,{col:['#C77B30','#B0BEC5'],sp:80,a0:back,spread:2.2,life:0.7,sz:1.8});}}
    else if(cat==='ceramic'){this.puff(30,x,mid,{col:['#FFFFFF','#EEEEEE','#BDBDBD'],sp:130,a0:back,spread:2.2,life:0.9,sz:2.2,g:30,tp:'smoke'});crack('radial',{y:mid,n:7+Math.floor(R()*4),seed:R()});crack('cone',{y:mid});
      if(p.k==='core'&&!this.strip){this.strip=true;this.puff(8,x-3,mid,{col:['#C77B30'],sp:80,a0:back,spread:2.2,life:0.6,sz:1.8});}if(soft)this.def=2.2;if(e.row&&e.row.shat)this.shat=true;}
    else if(cat==='glass'){crack('web',{y:mid,seed:R()});this.puff(18,x,mid,{col:['#E0F7FA','#80DEEA','#fff'],sp:120,a0:back,spread:2.4,life:0.8,sz:2.4,tp:'shard'});if(soft)this.def=Math.max(this.def,1.4);}
    else if(cat==='fiber'||cat==='poly'){this.bulge[e.g.k]={amt:0,max:0};this.puff(6,x,mid,{col:['#F9A825'],sp:40,a0:back,spread:2,life:0.5,sz:1.2,tp:'fiber'});if(soft)this.def=Math.max(this.def,1.3);}
    else if(cat==='conc'||cat==='soil'){this.puff(36,x,mid,{col:cat==='soil'?['#A1887F','#8D6E63','#D7CCC8']:['#BDBDBD','#9E9E9E','#E0E0E0'],sp:110,a0:back,spread:2.3,life:1.3,sz:3,g:20,tp:'smoke',drag:1.4});
      this.puff(10,x,mid,{col:['#757575','#6D4C41'],sp:120,a0:back,spread:1.6,life:0.9,sz:2.6,tp:'chunk'});crack('crater',{y:mid,r:7});}
    else if(cat==='wood'){this.puff(14,x,mid,{col:['#8D6E63','#BCAAA4'],sp:110,a0:back,spread:2,life:0.8,sz:2,tp:'splinter'});}
    else if(cat==='liquid'){this.puff(24,x,mid,{col:['#4FC3F7','#B3E5FC'],sp:140,a0:back-0.4,spread:1.6,life:0.9,sz:2,g:260,tp:'dot'});crack('ripple',{y:mid,t:this.t});}
    else if(cat==='tissue'){this.puff(14,x,mid,{col:['#E57373','#F8BBD0'],sp:70,a0:back,spread:2,life:0.7,sz:1.8,g:200});}
    else if(cat==='era'){if(m.era&&m.era.slat){crack('slatbar',{});if(e.row&&e.row.stop){this.gone=true;this.puff(12,x,mid,{col:['#556B2F','#78909C','#9E9E9E'],sp:60,a0:PI,spread:2.4,life:1.2,sz:2.4,tp:'chunk'});this.dud={x:x-14};}}
      else{this.flash.push({x:x+e.g.w/2,y:mid,r:Math.max(26,e.g.w*1.2),age:0,life:0.45,col:'#FF7043'});this.puff(30,x+e.g.w/2,mid,{col:['#FF7043','#FFCA28','#616161'],sp:180,spread:2*PI,life:0.9,sz:2.6,g:40,tp:'smoke',jy:this.hh*0.4});
        this.puff(6,x+e.g.w/2,mid,{col:['#5D4037','#455A64'],sp:160,a0:-PI/2,spread:2.6,life:1.1,sz:4,tp:'chunk'});crack('blown',{});}}
    if(p.k==='hesh'){this.flash.push({x:x-4,y:mid,r:30,age:0,life:0.4,col:'#FFA000'});this.puff(26,x-4,mid,{col:['#FFB300','#757575'],sp:140,a0:back,spread:2.6,life:0.9,sz:3,tp:'smoke'});this.gone=true;
      if(this.res.perf){var bx=x+e.g.w;this.puff(16,bx,mid,{col:['#78909C','#546E7A','#FFF59D'],sp:240,a0:0,spread:1.0,life:0.9,sz:2.6,tp:'chunk'});crack('scab',{});}}
    if(p.k==='he'){this.flash.push({x:x-4,y:mid,r:40,age:0,life:0.45,col:'#FFA000'});this.puff(40,x-4,mid,{col:['#FFB300','#616161','#9E9E9E'],sp:200,spread:2*PI,life:1,sz:3,tp:'smoke'});this.puff(24,x-4,mid,{col:['#455A64'],sp:320,a0:PI,spread:3,life:0.6,sz:1.6,tp:'frag'});this.gone=true;
      if(this.res.perf)crack('hole',{});}
    return;}
  if(e.type==='exit'){var ex=x+e.g.w;
    if(cat==='metal'||cat==='comp'){this.puff(18+(e.row.dop!==undefined?6:0),ex,mid,{col:['#78909C','#B0BEC5','#FFE082'],sp:200,a0:0,spread:1.1,life:0.7,sz:1.8,tp:'frag'});if(e.g.w<this.scale*15&&(soft||p.k==='core'))this.puff(1,ex,mid,{col:['#607D8B'],sp:150,a0:0,spread:0.1,life:1.2,sz:4,tp:'chunk'});crack('exith',{});}
    else if(cat==='ceramic'){this.puff(16,ex,mid,{col:['#EEEEEE','#BDBDBD'],sp:150,a0:0,spread:1.4,life:0.8,sz:2,tp:'shard'});}
    else if(cat==='fiber'||cat==='poly'){if(this.bulge[e.g.k])this.bulge[e.g.k].torn=true;this.puff(10,ex,mid,{col:['#F9A825','#FFE082'],sp:90,a0:0,spread:1.2,life:0.8,sz:1.4,tp:'fiber'});}
    else if(cat==='glass'){this.puff(16,ex,mid,{col:['#B2EBF2','#fff'],sp:150,a0:0,spread:1.3,life:0.8,sz:2.2,tp:'shard'});}
    else if(cat==='conc'||cat==='soil'||cat==='wood'){this.puff(18,ex,mid,{col:cat==='wood'?['#8D6E63','#BCAAA4']:['#9E9E9E','#BDBDBD'],sp:130,a0:0,spread:1.6,life:1,sz:2.6,tp:cat==='wood'?'splinter':'chunk'});}
    else if(cat==='liquid'){this.puff(14,ex,mid,{col:['#4FC3F7'],sp:120,a0:0,spread:1.2,life:0.8,sz:2,g:260});}
    if(e.row&&e.row.shat)this.shat=true;return;}
  if(e.type==='stop'){var sx=x+e.g.w*e.frac;if(cat==='fiber'||cat==='poly'){var b=this.bulge[e.g.k]||(this.bulge[e.g.k]={});b.stop=true;}
    else if(cat==='metal'){this.puff(10,sx,mid,{col:['#FFE082','#FF8F00'],sp:60,a0:PI,spread:2,life:0.4,sz:1.2,tp:'spark'});if(e.frac>0.6)crack('bump',{});}
    else if(cat==='ceramic'){this.puff(14,sx,mid,{col:['#fff','#E0E0E0'],sp:60,spread:2*PI,life:0.8,sz:2,tp:'smoke'});}
    this.stopAt={x:sx,g:e.g};return;}};
Anim.prototype.step=function(dt){if(dt<=0)return;this.t+=dt;var ev=this.ev;while(this.fired<ev.length&&ev[this.fired].t<=this.t){this.fire(ev[this.fired]);this.fired++;}
  var hd=this.head(),self=this;
  /* textile bulge grows while the shot is inside it */
  if(hd.s&&hd.s.kind==='in'&&hd.s.g){var b=this.bulge[hd.s.g.k];if(b){var full=this.res.bfd!==undefined&&hd.s.vb===0?clamp(this.res.bfd*0.45,5,24):clamp(hd.s.g.w*0.4,3,12);b.amt=Math.max(b.amt,full*hd.f);}}
  this.parts.forEach(function(q){q.age+=dt;var k=Math.exp(-q.drag*dt);q.vx*=k;q.vy=q.vy*k+q.g*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;});
  this.parts=this.parts.filter(function(q){return q.age<q.life&&q.x>-20&&q.x<self.W+20&&q.y<self.H+20;});
  this.flash.forEach(function(f){f.age+=dt;});this.flash=this.flash.filter(function(f){return f.age<f.life;});
  /* small sparks trail behind fast metal-on-metal travel */
  if(hd.s&&hd.s.kind==='in'&&hd.s.g&&(hd.s.g.m.cat==='metal')&&this.rng()<0.4)this.puff(1,hd.x,hd.y,{col:['#FFCA28'],sp:50,a0:PI,spread:1.5,life:0.2,sz:1,tp:'spark'});};
Anim.prototype.plate=function(g2,G){var gg=g2,m=G.m,col=MATCOL[m.cat]||['#9E9E9E','#616161'],mid=this.mid,hh=G.hp,x=G.x,w=G.w,dx=G.dx;
  /* "/" slope: the lower edge is nearer the shooter, the face leans back away from the incoming round */
  function path(){gg.beginPath();gg.moveTo(x+dx,mid-hh/2);gg.lineTo(x+dx+w,mid-hh/2);gg.lineTo(x-dx+w,mid+hh/2);gg.lineTo(x-dx,mid+hh/2);gg.closePath();}
  var bl=this.bulge[G.k];
  if(bl&&bl.amt>0.5){/* bulged back face */gg.beginPath();gg.moveTo(x+dx,mid-hh/2);gg.lineTo(x+dx+w,mid-hh/2);var bx=x+w,sp=clamp(16+bl.amt*1.1,14,hh*0.32);
    gg.lineTo(bx+dx*(sp/(hh/2)),mid-sp);gg.quadraticCurveTo(bx+bl.amt*2,mid,bx-dx*(sp/(hh/2)),mid+sp);gg.lineTo(x-dx+w,mid+hh/2);gg.lineTo(x-dx,mid+hh/2);gg.closePath();}
  else path();
  var grd=gg.createLinearGradient(x,0,x+w,0);grd.addColorStop(0,col[0]);grd.addColorStop(1,m.cat==='glass'||m.cat==='liquid'?col[0]:shade(col[0],-14));gg.fillStyle=grd;gg.fill();
  gg.save();gg.clip();
  /* material texture */
  if(m.cat==='fiber'){gg.strokeStyle='rgba(158,110,0,.35)';gg.lineWidth=1;for(var s=3;s<w;s+=3){gg.beginPath();gg.moveTo(x+dx+s,mid-hh/2);gg.lineTo(x-dx+s,mid+hh/2);gg.stroke();}}
  else if(m.cat==='ceramic'){gg.strokeStyle='rgba(0,0,0,.18)';for(var yy=mid-hh/2+28;yy<mid+hh/2;yy+=36){var ox=dx*(1-2*(yy-(mid-hh/2))/hh);gg.beginPath();gg.moveTo(x+ox,yy);gg.lineTo(x+ox+w,yy);gg.stroke();}}
  else if(m.cat==='conc'||m.cat==='soil'){var R=A.mb32(G.k*977+13);gg.fillStyle=m.cat==='soil'?'rgba(93,64,55,.35)':'rgba(66,66,66,.3)';for(var n=0;n<w*hh/60;n++){var py=mid-hh/2+R()*hh,ox2=dx*(1-2*(py-(mid-hh/2))/hh);gg.fillRect(x+ox2+R()*w,py,1.6,1.6);}
    if(m.id==='brick'){gg.strokeStyle='rgba(255,255,255,.5)';for(var by=mid-hh/2;by<mid+hh/2;by+=12){gg.beginPath();gg.moveTo(x-40,by);gg.lineTo(x+w+40,by);gg.stroke();}}}
  else if(m.cat==='wood'){gg.strokeStyle='rgba(78,52,46,.35)';for(var wy=mid-hh/2+4;wy<mid+hh/2;wy+=7){gg.beginPath();gg.moveTo(x-40,wy);gg.bezierCurveTo(x,wy+3,x+w/2,wy-3,x+w+40,wy);gg.stroke();}}
  else if(m.cat==='era'){gg.strokeStyle='rgba(120,30,0,.55)';gg.lineWidth=1.2;for(var ey=mid-hh/2+20;ey<mid+hh/2;ey+=22){var o3=dx*(1-2*(ey-(mid-hh/2))/hh);gg.strokeRect(x+o3+2,ey-18,Math.max(2,w-4),16);}}
  else if(m.cat==='comp'){gg.fillStyle='rgba(255,255,255,.18)';for(var cx=4;cx<w;cx+=14)gg.fillRect(x+cx-dx-2,mid-hh/2,5,hh);}
  else if(m.cat==='metal'){gg.strokeStyle='rgba(255,255,255,.35)';gg.lineWidth=Math.min(3,w/3);gg.beginPath();gg.moveTo(x+dx+1.5,mid-hh/2);gg.lineTo(x-dx+1.5,mid+hh/2);gg.stroke();}
  if(m.mg){var ec=ELC[m.mg.el||0];gg.fillStyle=hexA(ec,0.18);gg.fill();}
  gg.restore();
  gg.strokeStyle=m.mg?ELC[m.mg.el||0]:col[1];gg.lineWidth=1;if(!(bl&&bl.amt>0.5))path();gg.stroke();
  if(m.era&&m.era.slat){gg.fillStyle='#78909C';for(var sy=mid-hh/2;sy<mid+hh/2;sy+=14)gg.fillRect(x,sy,Math.max(3,w),4);}};
function shade(c,p){if(c[0]!=='#')return c;var n=parseInt(c.slice(1),16),r=(n>>16)+p,g=(n>>8&255)+p,b=(n&255)+p;return 'rgb('+clamp(r,0,255)+','+clamp(g,0,255)+','+clamp(b,0,255)+')';}
function hexA(c,a){var n=parseInt(c.slice(1),16);return 'rgba('+(n>>16)+','+(n>>8&255)+','+(n&255)+','+a+')';}
Anim.prototype.decor=function(g,d){var G=d.g,mid=this.mid,x=G?G.x:0,R=A.mb32(Math.floor((d.seed||0.5)*1e6)+7),t=this.t;g.save();
  if(d.type==='crater'){g.fillStyle='rgba(38,50,56,.75)';g.beginPath();g.ellipse(x+1,mid,d.r*0.8,d.r*1.6,0,-PI/2,PI/2);g.fill();}
  else if(d.type==='scuff'){g.strokeStyle='#37474F';g.lineWidth=2;g.beginPath();g.moveTo(x,mid);g.lineTo(x+G.dx*0.15+2,mid-10);g.stroke();}
  else if(d.type==='radial'){g.strokeStyle='rgba(66,66,66,.65)';g.lineWidth=0.8;for(var i=0;i<d.n;i++){var a=-PI/2+PI*(i+0.5)/d.n+(R()-0.5)*0.3,len=G.w*0.4+R()*Math.min(60,G.hp*0.4);g.beginPath();g.moveTo(x,mid);g.lineTo(x+Math.cos(a)*Math.min(len*0.25,G.w),mid+Math.sin(a)*len);g.stroke();}}
  else if(d.type==='cone'){g.strokeStyle='rgba(97,97,97,.7)';g.setLineDash([3,2]);g.lineWidth=1;var sp2=G.w*Math.tan(63*D2R);g.beginPath();g.moveTo(x+1,mid);g.lineTo(x+G.w,mid-Math.min(sp2,G.hp/2));g.moveTo(x+1,mid);g.lineTo(x+G.w,mid+Math.min(sp2,G.hp/2));g.stroke();g.setLineDash([]);}
  else if(d.type==='web'){g.strokeStyle='rgba(0,96,100,.7)';g.lineWidth=0.8;for(var j=0;j<9;j++){var a2=j/9*2*PI+R()*0.3,l2=20+R()*40;g.beginPath();g.moveTo(x,mid);g.lineTo(x+Math.cos(a2)*Math.min(l2*0.3,6),mid+Math.sin(a2)*l2);g.stroke();}
    for(var rr=10;rr<46;rr+=12){g.beginPath();g.ellipse(x+2,mid,3,rr,0,0,2*PI);g.stroke();}}
  else if(d.type==='shield'){var age=t-d.t,al=clamp(1-age/1.6,0.25,1);g.strokeStyle=hexA(d.col,0.9*al);g.fillStyle=hexA(d.col,0.12*al);g.lineWidth=2;g.beginPath();g.ellipse(d.x,mid,8+Math.min(10,age*30),G.hp*0.42,0,0,2*PI);g.fill();g.stroke();
    g.lineWidth=0.7;for(var hy=mid-G.hp*0.38;hy<mid+G.hp*0.38;hy+=12){g.beginPath();g.moveTo(d.x-6,hy);g.lineTo(d.x,hy+6);g.lineTo(d.x+6,hy);g.stroke();}}
  else if(d.type==='ripple'){var ag=t-d.t;g.strokeStyle='rgba(2,136,209,'+clamp(0.8-ag*0.4,0,0.8)+')';for(var k=1;k<4;k++){g.beginPath();g.ellipse(x+G.w*0.1,mid,4+ag*20*k,10+ag*50*k,0,-PI/2,PI/2);g.stroke();}}
  else if(d.type==='blown'){g.fillStyle='rgba(33,33,33,.45)';g.beginPath();g.ellipse(x+G.w/2,mid,clamp(G.w*0.4,4,16),Math.min(30,G.hp*0.18),0,0,2*PI);g.fill();}
  else if(d.type==='exith'){g.fillStyle='rgba(38,50,56,.8)';g.beginPath();g.ellipse(x+G.w-1,mid,4,7,0,PI/2,3*PI/2);g.fill();g.strokeStyle='#90A4AE';g.beginPath();g.moveTo(x+G.w,mid-7);g.lineTo(x+G.w+5,mid-11);g.moveTo(x+G.w,mid+7);g.lineTo(x+G.w+5,mid+11);g.stroke();}
  else if(d.type==='bump'){g.fillStyle=MATCOL.metal[1];g.beginPath();g.ellipse(x+G.w,mid,4,9,0,-PI/2,PI/2);g.fill();}
  else if(d.type==='scab'){g.fillStyle='#FAFAFA';g.beginPath();g.ellipse(x+G.w,mid,5,22,0,-PI/2,PI/2);g.fill();}
  else if(d.type==='hole'){g.fillStyle='#FAFAFA';g.fillRect(x-1,mid-12,G.w+2,24);}
  g.restore();};
Anim.prototype.draw=function(){var c=this.c,g=c.getContext('2d'),W=this.W,H=this.H,mid=this.mid,self=this,p=this.p;g.setTransform(this.r,0,0,this.r,0,0);
  var bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#ECEFF1');bg.addColorStop(1,'#FAFAFA');g.fillStyle=bg;g.fillRect(0,0,W,H);
  g.strokeStyle='rgba(0,0,0,.08)';g.setLineDash([4,6]);g.beginPath();g.moveTo(0,mid);g.lineTo(W,mid);g.stroke();g.setLineDash([]);
  g.font='11px system-ui,sans-serif';
  this.G.forEach(function(G2){self.plate(g,G2);g.fillStyle='#37474F';g.textAlign='center';g.fillText((G2.k+1)+'',G2.x+G2.dx+G2.w/2,mid-G2.hp/2-6);
});
  this.dec.forEach(function(d){self.decor(g,d);});
  /* shaped-charge jet */
  var hd=this.head();
  if(this.jet&&!this.gone){g.strokeStyle='#FFF8E1';g.lineWidth=3;g.shadowColor='#FFB300';g.shadowBlur=8;g.beginPath();g.moveTo(this.jet.x0,mid);g.lineTo(hd.x,hd.y);g.stroke();g.shadowBlur=0;g.strokeStyle='#FF8F00';g.lineWidth=1;g.stroke();
    g.fillStyle='#8D6E63';g.fillRect(this.jet.x0+(hd.x-this.jet.x0)*0.15-6,mid-3,10,6);}
  else if(!this.gone&&!(hd.end&&hd.x>W))this.drawShot(g,hd);
  if(this.dud){g.save();g.fillStyle='#556B2F';g.translate(this.dud.x,mid+6);g.rotate(0.5);g.fillRect(-22,-5,22,10);g.restore();g.fillStyle='#455A64';g.font='12px system-ui,sans-serif';g.textAlign='center';g.fillText('引信被柵欄擠壓短路',this.dud.x-50,mid-34);}
  this.parts.forEach(function(q){var a=clamp(1-q.age/q.life,0,1);g.globalAlpha=q.tp==='smoke'?a*0.55:a;g.fillStyle=q.col;g.strokeStyle=q.col;
    if(q.tp==='spark'){g.lineWidth=1.2;g.beginPath();g.moveTo(q.x,q.y);g.lineTo(q.x-q.vx*0.02,q.y-q.vy*0.02);g.stroke();}
    else if(q.tp==='smoke'){g.beginPath();g.arc(q.x,q.y,q.sz*(1+q.age*3),0,2*PI);g.fill();}
    else if(q.tp==='shard'){g.beginPath();g.moveTo(q.x,q.y-q.sz);g.lineTo(q.x+q.sz,q.y+q.sz);g.lineTo(q.x-q.sz,q.y+q.sz*0.6);g.closePath();g.fill();}
    else if(q.tp==='splinter'||q.tp==='fiber'){g.lineWidth=q.tp==='fiber'?0.8:1.4;g.beginPath();g.moveTo(q.x,q.y);g.lineTo(q.x-q.vx*0.04,q.y-q.vy*0.04);g.stroke();}
    else if(q.tp==='glow'){g.shadowColor=q.col;g.shadowBlur=6;g.beginPath();g.arc(q.x,q.y,q.sz,0,2*PI);g.fill();g.shadowBlur=0;}
    else if(q.tp==='chunk'){g.fillRect(q.x-q.sz/2,q.y-q.sz/2,q.sz,q.sz*0.8);}
    else{g.beginPath();g.arc(q.x,q.y,q.sz/2+0.4,0,2*PI);g.fill();}});
  g.globalAlpha=1;
  this.flash.forEach(function(f){var a=1-f.age/f.life,rg=g.createRadialGradient(f.x,f.y,0,f.x,f.y,f.r*(0.6+f.age/f.life));rg.addColorStop(0,hexA(f.col[0]==='#'?f.col:'#FFCA28',0.9*a));rg.addColorStop(1,hexA(f.col[0]==='#'?f.col:'#FFCA28',0));g.fillStyle=rg;g.beginPath();g.arc(f.x,f.y,f.r*1.4,0,2*PI);g.fill();});
  /* verdict and HUD */
  var r=this.res,done=this.t>=this.T;g.font='bold 13px system-ui,sans-serif';g.textAlign='left';
  if(done){g.fillStyle=r.ric?'#455A64':r.perf?'#C62828':'#2E7D32';g.fillText(r.ric?'跳彈':r.perf?(p.k==='hesh'?'背面剝落':'貫穿'):'擋下',10,18);}
  this.hud.textContent=(p.k==='sc'?'射流':'彈速 '+fx(Math.max(0,hd.v),0)+' m/s')+(hd.s&&hd.s.g?'　・第 '+(hd.s.g.k+1)+' 層 '+hd.s.g.m.n.replace(/（.*$/,''):'')+'　t＝'+fx(Math.min(this.t,this.T)/Math.max(0.01,this.T)*100,0)+'%';};
Anim.prototype.drawShot=function(g,hd){var p=this.p,dir=Math.atan2(hd.s?hd.s.y1-hd.s.y0:0,hd.s?hd.s.x1-hd.s.x0:1),k=p.k;g.save();g.translate(hd.x,hd.y);g.rotate(dir);
  var cal=clamp((p.d||8)*0.5,4,10);
  if(k==='lr'){var rows=this.res.layers||[],m0=(rows[0]&&rows[0].mIn)||1,lenF=1,cur=hd.s&&hd.s.g?hd.s.g.k:-1;
    rows.forEach(function(rw){if(rw.mOut!==undefined&&rw.i<cur)lenF=rw.mOut/m0;});
    if(hd.s&&hd.s.kind==='in'&&hd.s.g){var rw2=rows.filter(function(z){return z.i===cur;})[0];if(rw2&&rw2.mIn){var mo=rw2.mOut!==undefined?rw2.mOut:rw2.mIn*0.15;lenF=lerp(rw2.mIn,mo,hd.f)/m0;}}
    if(hd.s&&hd.s.kind==='air'){var pass=rows.filter(function(z){return z.mOut!==undefined&&z.vOut!==undefined;});var gx=this.G;pass.forEach(function(z){var G2=gx[z.i];if(G2&&hd.x>=G2.x+G2.w)lenF=z.mOut/m0;});}
    var Lp=clamp(70*lenF,6,70);g.fillStyle='#424242';g.fillRect(-Lp,-2,Lp,4);g.beginPath();g.moveTo(0,-2);g.lineTo(5,0);g.lineTo(0,2);g.fill();
    if(lenF>0.5){g.fillStyle='#616161';g.beginPath();g.moveTo(-Lp,-2);g.lineTo(-Lp-8,-8);g.lineTo(-Lp+8,-2);g.moveTo(-Lp,2);g.lineTo(-Lp-8,8);g.lineTo(-Lp+8,2);g.fill();}
    if(hd.s&&hd.s.kind==='in'){g.fillStyle='rgba(255,193,7,.8)';g.beginPath();g.arc(2,0,3+this.rng()*2,0,2*PI);g.fill();}}
  else if(k==='shot'){g.fillStyle='#78909C';for(var i=0;i<5;i++){g.beginPath();g.arc(-i*7-(i%2)*3,(i%3-1)*5,2.6,0,2*PI);g.fill();}}
  else if(k==='sc'||k==='hesh'||k==='he'){var len=cal*5;g.fillStyle=k==='sc'?'#556B2F':'#5D4037';g.beginPath();g.moveTo(4,0);g.lineTo(-4,-cal);g.lineTo(-len,-cal);g.lineTo(-len,cal);g.lineTo(-4,cal);g.closePath();g.fill();if(p.rocket){g.fillStyle='rgba(255,152,0,.8)';g.beginPath();g.moveTo(-len,0);g.lineTo(-len-14,-3);g.lineTo(-len-10,0);g.lineTo(-len-14,3);g.fill();}}
  else{var def=this.def,len2=cal*3.4/def,wd=cal*0.55*def;
    if(this.shat){g.fillStyle='#424242';for(var j=0;j<4;j++){g.beginPath();g.arc(-j*4,(j%2?3:-3)*(1+j*0.3),1.8,0,2*PI);g.fill();}}
    else if(this.strip||k==='frag'){g.fillStyle='#37474F';g.beginPath();g.moveTo(3,0);g.lineTo(-3,-wd*0.7);g.lineTo(-len2,-wd*0.7);g.lineTo(-len2,wd*0.7);g.lineTo(-3,wd*0.7);g.closePath();g.fill();}
    else{g.fillStyle=def>1.2?'#A1662F':(k==='core'?'#B87333':'#C77B30');g.beginPath();if(def>1.2){g.ellipse(-len2/2,0,len2/2+1,wd,0,0,2*PI);}else{g.moveTo(cal*0.9,0);g.quadraticCurveTo(0,-wd,-cal*0.6,-wd);g.lineTo(-len2,-wd);g.lineTo(-len2,wd);g.lineTo(-cal*0.6,wd);g.quadraticCurveTo(0,wd,cal*0.9,0);}g.fill();}
    if(!(hd.s&&hd.s.kind==='in')){g.strokeStyle='rgba(120,144,156,.35)';g.lineWidth=1;g.beginPath();g.moveTo(-len2-2,0);g.lineTo(-len2-28,0);g.stroke();}}
  g.restore();};

/* ---------- page skeleton ---------- */
var TABS=[['pen','穿甲模擬'],['veh','載具設計（陸海空）'],['body','防彈衣與插板'],['gel','凝膠與創傷'],['multi','多發命中'],['blast','爆炸與破片'],['ammo','彈藥設計與計價'],['gm','飛彈、魚雷與炸彈'],['wmd','化生放核魔'],['mat','材料庫（含魔能素）'],['mx','對照表'],['io','匯出／匯入']].filter(function(t){return !(H.omit||[]).some(function(o){return o===t[0];});});
root.innerHTML='<div class="lato-tool lt-arm">'+
 '<div class="lt-info">裝甲、砲彈與子彈的穿透、防護與計價模擬。長桿穿甲彈採 Lanz–Odermatt 方程，硬芯彈、鉛心彈與破片採 Tate–Alekseevskii 侵蝕／剛體模型（含背面弱化），陶瓷複合板採 Florence 模型，軟甲採 Cunniff 纖維量綱分析，聚能裝藥依裝藥直徑、炸高與靶材密度強度換算；凝膠以速度平方阻力、偏航翻滾、擴張與碎裂推算創傷腔。傾角、材料、厚度、距離皆影響結果。'+
  '金額依材料、製程、批量與市場推估，可用東銀圓（預設 1 東銀圓＝2.5 美元）、美元或自訂的原創幣種（各自掛勾美元）顯示。架空材料（魔能素等）的參數可完全自訂。「載具設計」分頁可用模組組裝陸海空載具，裝甲與武器直接套用上述模型'+((H.omit||[]).length?'。':'；導引飛彈、魚雷與炸彈也是彈藥，可以設計並掛到載具上；「化生放核魔」分頁設計化學、生物、放射性與魔瘴毒劑、核彈頭與魔法武器。')+'</div>'+
 '<details class="lt-grp"><summary>全域設定（幣種與匯率、市場、批量、環境、魔能充能）</summary>'+
  '<div class="row"><label>1 東銀圓＝ <input type="number" data-k="sRate" step="0.01" min="0.01" style="width:64px"> 美元</label><label><input type="checkbox" data-k="sUsd"> 同時顯示美元</label>'+
  '<label>市場 <select data-k="sMk">'+opts(Object.keys(A.MARKET).map(function(k){return [k,A.MARKET[k][0]];}),'mil')+'</select></label>'+
  '<label title="以學習曲線估算：產量每加倍，單價約降 10%">生產批量 <select data-k="sLot">'+opts([[0.01,'試製（×0.01）'],[0.1,'小批（×0.1）'],[1,'標準'],[10,'大量（×10）'],[100,'戰時總動員（×100）']],1)+'</select></label></div>'+
  '<div class="row"><label>海拔 <input type="number" data-k="sAlt" step="100" style="width:70px"> m</label><label>氣溫 <input type="number" data-k="sT" step="1" style="width:56px"> °C</label><label>側風 <input type="number" data-k="sWind" step="1" style="width:56px"> m/s</label>'+
  '<label title="架空世界可改變重力">重力 <input type="number" data-k="sG" step="0.1" style="width:64px"> m/s²</label><label title="魔能素裝甲的護盾、硬化與偏斜隨充能縮放">魔能充能 <input type="range" data-k="sCh" min="0" max="150" step="5"> <span data-k="sChV"></span>%</label></div><div class="row lt-curs" data-k="sCurRow"></div></details>'+
 (H.title?'<h3 class="lt-ttl">'+esc(H.title)+'</h3>':'')+'<div class="lt-tabs" data-k="tabs">'+TABS.map(function(t,i){return '<button type="button" data-tab="'+t[0]+'"'+(i?'':' class="on"')+'>'+t[1]+'</button>';}).join('')+'</div>'+
 TABS.map(function(t,i){return '<div class="lt-pane'+(i?'':' on')+'" data-pane="'+t[0]+'"></div>';}).join('')+
 '<div class="lt-err" data-k="err"></div></div>';
function pane(k){return root.querySelector('[data-pane="'+k+'"]');}
function err(e){q('err').textContent=e?String(e.message||e):'';if(e&&e.stack)console.error(e);}
var RENDER={},DIRTY={};
root.querySelector('[data-k="tabs"]').addEventListener('click',function(e){var b=e.target.closest('button[data-tab]');if(!b)return;var t=b.getAttribute('data-tab');
  root.querySelectorAll('[data-k="tabs"] button').forEach(function(x){x.classList.toggle('on',x===b);});root.querySelectorAll('.lt-pane').forEach(function(p){p.classList.toggle('on',p.getAttribute('data-pane')===t);});show(t);});
function show(t){if(!pane(t))return;try{if(!pane(t).firstChild||DIRTY[t]){DIRTY[t]=false;RENDER[t].init();}RENDER[t].run();err();}catch(e){err(e);}}
function rerunVisible(){var on=root.querySelector('.lt-pane.on');Object.keys(RENDER).forEach(function(k){DIRTY[k]=DIRTY[k]||false;});if(on)show(on.getAttribute('data-pane'));}
function libChanged(){saveLib();Object.keys(RENDER).forEach(function(k){if(pane(k)&&pane(k).firstChild)DIRTY[k]=true;});rerunVisible();}

/* global settings */
(function(){var s=S.set;q('sRate').value=s.rate;q('sUsd').checked=!!s.usd;q('sMk').value=s.market;q('sLot').value=s.lot;q('sAlt').value=s.alt;q('sT').value=s.T;q('sWind').value=s.wind;q('sG').value=s.g;q('sCh').value=s.charge;q('sChV').textContent=s.charge;
  function rd(){s.rate=Math.max(0.01,+q('sRate').value||2.5);s.usd=q('sUsd').checked;s.market=q('sMk').value;s.lot=+q('sLot').value;s.alt=+q('sAlt').value||0;s.T=+q('sT').value;if(!isFinite(s.T))s.T=15;s.wind=+q('sWind').value||0;s.g=+q('sG').value;if(!(s.g>=0))s.g=9.80665;s.charge=+q('sCh').value;q('sChV').textContent=s.charge;saveLib();rerunVisible();}
  ['sRate','sUsd','sMk','sLot','sAlt','sT','sWind','sG','sCh'].forEach(function(k){q(k).addEventListener('change',rd);});q('sCh').addEventListener('input',function(){q('sChV').textContent=q('sCh').value;});})();
/* 幣種：顯示用幣種與自訂的原創幣種（名稱、符號、1 單位等於多少美元） */
function curUI(){var e=q('sCurRow');if(!e)return;if(H.cur){e.innerHTML='<span class="lt-note">金額依主程式選的幣種顯示（目前：'+esc(curN())+'）。</span>';return;}var L=curList();
  e.innerHTML='<label>顯示幣種 <select data-k="sCur">'+opts(L.map(function(c){return [c.k,c.n+(c.sym?'（'+c.sym+'）':'')+(c.k==='usd'?'':'，1＝'+fx(c.usd,c.usd<0.01?6:c.usd<1?4:2)+' 美元')];}),S.set.cur)+'</select></label>'+
   (S.set.curs||[]).map(function(c,i){return '<span class="lt-cur">名稱 <input type="text" data-ci="'+i+'" data-cf="n" value="'+esc(c.n)+'" style="width:6em"> 符號 <input type="text" data-ci="'+i+'" data-cf="sym" value="'+esc(c.sym||'')+'" style="width:3.5em"> 1 單位＝<input type="number" data-ci="'+i+'" data-cf="usd" value="'+c.usd+'" step="any" min="0.000001" style="width:84px"> 美元 <button type="button" data-cdel="'+i+'">刪除</button></span>';}).join('')+
   '<button type="button" data-k="sCurAdd">＋自訂幣種</button>';}
(function(){var e=q('sCurRow');if(!e)return;curUI();
  e.addEventListener('change',function(ev){var t=ev.target;if(t.getAttribute('data-k')==='sCur'){S.set.cur=t.value;}else if(t.hasAttribute('data-ci')){var c=(S.set.curs||[])[+t.getAttribute('data-ci')],f=t.getAttribute('data-cf');if(!c)return;if(f==='usd'){var v=+t.value;if(!(v>0))return;c.usd=v;}else c[f]=String(t.value).slice(0,f==='sym'?6:20);}else return;saveLib();curUI();rerunAll();});
  e.addEventListener('click',function(ev){var t=ev.target;if(t.getAttribute('data-k')==='sCurAdd'){S.set.curs=S.set.curs||[];var n=S.set.curs.length+1;S.set.curs.push({k:'c'+Date.now().toString(36),n:'自訂幣 '+n,sym:'',usd:1});S.set.cur=S.set.curs[S.set.curs.length-1].k;}
    else if(t.hasAttribute('data-cdel')){var i=+t.getAttribute('data-cdel'),c=S.set.curs[i];S.set.curs.splice(i,1);if(c&&S.set.cur===c.k)S.set.cur='dy';}else return;saveLib();curUI();rerunAll();});})();
function rerunAll(){Object.keys(RENDER).forEach(function(k){if(pane(k)&&pane(k).firstChild)DIRTY[k]=true;});rerunVisible();}

/* ---------- shared summaries ---------- */
function projSummary(p,v){var c=costP(p),rm=A.roundMass(p),E=0.5*(p.m||0)/1000*v*v,sm=small(p);
  var h='<div class="lt-kv"><b>彈種</b><span>'+esc(p.n)+'（'+esc(A.KINDN[p.k]||p.k)+'）</span><b>彈頭／彈丸質量</b><span>'+mass(p.m)+'</span>'+
   '<b>'+(sm?'每顆全彈重':'全彈重')+'</b><span>'+mass(rm)+(sm?'；<b>每 30 顆</b> '+mass(rm*30)+'；每 100 顆 '+mass(rm*100):'')+'</span>'+
   '<b>單價</b><span>'+money(c.usd)+(sm?'；每 30 顆 '+money(c.usd*30):'')+'</span>';
  if(p.k!=='sc'&&p.k!=='he'&&p.k!=='hesh')h+='<b>撞擊速度與能量</b><span>'+fx(v,0)+' m/s，'+fx(E/1000,E<10000?2:1)+' kJ，動量 '+fx((p.m||0)/1000*v,2)+' kg·m/s</span>';
  if(p.mg)h+='<b>魔能</b><span>'+mgTxt(p.mg)+'</span>';return h+'</div>';}
function mgTxt(g){var a=[];if(g.bo)a.push('動能增幅 +'+Math.round(g.bo*100)+'%');if(g.pi&&g.pi!==1)a.push('穿甲倍率 ×'+g.pi);if(g.dp)a.push('破魔 '+Math.round(g.dp*100)+'%');if(g.bu)a.push('魔爆當量 '+g.bu+' kg TNT');if(g.el)a.push(A.ELEM[g.el]+'屬性');if(g.mc)a.push('魔晶 '+g.mc+' g');if(g.st!==undefined&&g.st<1)a.push('穩定度 '+Math.round(g.st*100)+'%（啞火／反噬機率 '+Math.round((1-g.st)*100)+'%）');return a.join('、')||'無';}
function armSummary(L,cov,kind){var ad=A.stackAD(L,S.mats),fr=0;L.forEach(function(l){fr+=(+l.t||0)*M(l.mat).rho/Math.max(0.05,Math.cos((l.ang||0)*D2R));});
  var c=A.stackCostM2(L,S.mats,kind),th=A.stackThick(L);
  return '<div class="lt-kv"><b>總厚度</b><span>'+fx(th,1)+' mm（含間隙）</span><b>面密度</b><span>'+fx(ad,1)+' kg/m²（每平方公尺板材）</span>'+
   '<b>每平方公尺正面投影</b><span>'+fx(fr,1)+' kg/m²（傾斜板需覆蓋更大面積）</span><b>覆蓋 '+fx(cov,2)+' m² 重量</b><span>'+mass(fr*cov*1000)+'</span>'+
   '<b>造價</b><span>每 m² '+money(c.usd)+'；覆蓋 '+fx(cov,2)+' m² 共 '+money(c.usd*cov*(fr/Math.max(0.01,ad)))+'</span></div>';}
function layRows(r){if(!r||!r.layers)return '';var sc=r.kind==='sc';return '<div class="lt-sc"><table class="lt-dt"><tr><th>#</th><th class="l">材料</th><th>厚度</th><th>傾角</th><th>視線厚</th>'+(sc?'<th>射流餘量 RHA</th><th>RHA 效率</th>':'<th>入射速度</th><th>侵徹深</th><th>極限 V50</th><th>跳彈機率</th>')+'<th class="l">結果</th></tr>'+
  r.layers.map(function(l){return '<tr><td>'+(l.i+1)+'</td><td class="l">'+esc(l.mat.n)+'</td><td>'+fx(l.t,1)+'</td><td>'+fx(l.ang,0)+'°</td><td>'+fx(l.los,1)+'</td>'+
    (sc?'<td>'+fx(l.capIn,0)+' mm</td><td>'+fx(l.te,2)+'</td>':'<td>'+fx(l.vIn,0)+'</td><td>'+(l.dop!==undefined?fx(l.dop,1)+' mm':'—')+'</td><td>'+(l.v50?fx(l.v50,0)+' m/s':'—')+'</td><td>'+(l.rico!==undefined?Math.round(l.rico*100)+'%':'—')+'</td>')+
    '<td class="l">'+esc(l.res||'')+(l.shield?'（護盾吸收 '+(sc?Math.round(l.shield*100)+'%':fx(l.shield/1000,2)+' kJ')+'）':'')+(l.shat?'（彈芯碎裂）':'')+'</td></tr>';}).join('')+'</table></div>';}
