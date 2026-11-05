/* ===================== 化生放核魔武器的設計工具（裝備庫的「化生放核魔」分頁）與作戰中的彈頭選擇 =====================
   毒劑：內建毒劑一覽、自訂毒劑設計（類別、作用機制、毒性、持久、防護、疾病），附下風擴散預測圖；
   核彈頭：種類、當量、爆炸方式、重量與價格，附破壞範圍表、同心圓比較圖（以廣島原子彈為參考）與可搭載的投射工具；戰術核打擊的命令面板與戰略核打擊對話框可以選用；
   魔法武器：系別、範圍、威力、射程、魔力消耗與附帶效果，算出作戰數值，存成自訂武器（類別「奇幻」）配發給部隊。 */
ARTABS.push(['x','化生放核魔']);
AR.xt='c';AR.xe='';AR.xws=4;AR.xrain=0;AR.xhot=0;AR.xpr='none';AR.xq=1;
/* 施放量：[名稱, 質量, 初始半徑（公尺）] */
var CBQ=[['一輪齊射',1,300],['砲兵連砲擊 15 分鐘',10,500],['砲兵營砲擊 15 分鐘',30,800]];
(function(){var b=armWHtml;armWHtml=function(){return AR.tab==='x'?wmdHtml():b.apply(this,arguments);};})();
(function(){var b=armoryDlg;armoryDlg=function(tab){b.apply(this,arguments);if(AR.tab==='x')try{wmdFill();}catch(e){if(window.console)console.warn('wmd',e);}};})();
(function(){var b=drawCbrn;drawCbrn=function(c){cbaSync();return b(c);};})();
function wmdHtml(){cbaSync();return '<div class="lw-row">'+[['c','化學、生物、放射性與魔瘴毒劑'],['n','核彈頭'],['m','魔法武器']].map(function(t){return '<button type="button" class="lw-btn sm'+(AR.xt===t[0]?' pri':'')+'" data-a="wmdt" data-v="'+t[0]+'">'+t[1]+'</button>';}).join('')+'</div>'+
  (AR.xt==='n'?nwhHtml():AR.xt==='m'?magHtml():cbaHtml());}
ACT.wmdt=function(b){AR.xt=b.getAttribute('data-v');AR.xe='';armoryDlg('x');};
function wmdFill(){if(AR.xt==='c')cbaDraw();else if(AR.xt==='n')nwhDraw();}
function wmdIn(lbl,c,f,v,ty,ext){return '<label style="font-size:12px;display:block">'+lbl+'<br><input type="'+(ty||'number')+'" step="any" value="'+esc(v===undefined?'':v)+'" data-c="'+c+'" data-f="'+f+'" style="width:100%"'+(ext||'')+'></label>';}
function wmdSel(lbl,c,f,opts,v){return '<label style="font-size:12px;display:block">'+lbl+'<br><select data-c="'+c+'" data-f="'+f+'" style="width:100%">'+opts.map(function(q){return '<option value="'+esc(q[0])+'"'+(String(v)===String(q[0])?' selected':'')+'>'+esc(q[1])+'</option>';}).join('')+'</select></label>';}
function wmdGrid(s){return '<div class="lw-grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:4px 10px">'+s+'</div>';}
function wmdSet(k,html){var e=UI.wdlg&&UI.wdlg.querySelector('[data-k="'+k+'"]');if(e)e.innerHTML=html;}
function wmdBump(){G.cbaV=(G.cbaV||0)+1;cbaSync();}
/* ---------- 毒劑 ---------- */
var CBMDEF={chl:'choke',phos:'choke',must:'blis',sarin:'nerve',vx:'nerve',anth:'bact',plag:'bact',pox:'virus',corpse:'bact',dirty:'rad',mias:'mias'};
var CBPRE=[['塔崩（GA）','sarin',{n:'塔崩（GA）',y:1939,k:1.6,p:2}],['梭曼（GD）','sarin',{n:'梭曼（GD）',y:1944,k:2.8,p:6}],['諾維喬克（A-234）','vx',{n:'諾維喬克（A-234）',y:1975,k:3.2,p:72,mk:0.5}],
  ['氫氰酸（AC）','phos',{n:'氫氰酸（AC）',y:1916,mech:'blood',k:1.4,l:0.4,h:0,life:25,col:'#80deea'}],['畢茲（BZ，失能性）','sarin',{n:'畢茲（BZ）',y:1961,mech:'incap',k:1.5,l:0.01,p:24,col:'#f48fb1'}],['催淚瓦斯（CS）','chl',{n:'催淚瓦斯（CS）',y:1959,mech:'irr',k:0.8,l:0.002,h:0,life:30,mk:0.95,col:'#eeeeee'}],
  ['蓖麻毒素（生物毒素）','sarin',{n:'蓖麻毒素氣溶膠',y:1944,mech:'tox',k:1.8,l:0.5,p:12,mk:0.9,col:'#a1887f'}],
  ['兔熱病（土拉倫菌）','plag',{n:'土拉倫菌',y:1950,dz:{n:'兔熱病',m:0.3,mt:0.02,d:14,inc:4,ct:0,vx:'兔熱病疫苗',vy:1959,vd:14}}],['出血熱病毒（構想）','pox',{n:'出血熱病毒',y:1970,k:0.5,dz:{n:'出血熱',m:0.7,mt:0.4,d:10,inc:7,ct:1,vx:'',vy:0,vd:14}}],
  ['銫 137 髒彈','dirty',{n:'銫 137 髒彈',y:1960,k:0.3,p:6000}],['屍疫瘴氣（奇幻）','mias',{n:'屍疫瘴氣',k:0.9,dz:{n:'屍疫',m:0.4,mt:0.1,d:8,inc:1,ct:1}}]];
function cbaFromRow(k){var A=CBA[k];if(!A)return null;var d={n:A[0],c:A[1],y:A[2],k:A[3],l:A[4],p:A[5],life:A[6],h:A[7],mk:A[8],st:A[9],col:A[11],mech:CBMDEF[k]||(A[1]==='r'?'rad':A[1]==='m'?'mias':A[1]==='b'?'bact':'choke')};
  if(A[10]&&DZ[A[10]]){var z=DZ[A[10]],V=CBVX[A[10]];d.dz={n:z[0],m:z[2],mt:z[3],d:z[4],inc:CBINC[A[10]]||(A[10]==='anth'?2:A[10]==='mias'?1:A[10]==='plag'?3:10),ct:CBC[A[10]]?1:0,vx:V&&A[1]==='b'?V[0]:'',vy:V?V[1]:0,vd:V?V[2]:14};}
  if(CBAX.k.indexOf(k)>=0)d=clone(G.cba[k]);return d;}
function cbaNewId(){G.cbaSeq=(G.cbaSeq||0)+1;var id='xa'+G.cbaSeq;while(CBA[id]||G.cba&&G.cba[id]){G.cbaSeq++;id='xa'+G.cbaSeq;}return id;}
function cbaAdd(d){var id=cbaNewId();G.cba=G.cba||{};if((d.c==='b')&&!d.dz)d.dz={n:d.n+'感染',m:0.3,mt:0.05,d:7,inc:3,ct:0,vx:'',vy:0,vd:14};G.cba[id]=d;wmdBump();AR.xe=id;armoryDlg('x');}
ACT.cbanew=function(){cbaAdd({n:'自訂毒劑 '+((G.cbaSeq||0)+1),c:'c',mech:'nerve',y:G.set.y||1960,k:2,l:0.5,p:6,life:40,h:0,mk:0.75,st:0.6,col:'#7e57c2'});};
ACT.cbacp=function(b){var d=cbaFromRow(b.getAttribute('data-v'));if(!d)return;d.n=d.n+'（改）';cbaAdd(d);};
CHG.cbapre=function(t){var P=CBPRE[+t.value];if(!P)return;var d=cbaFromRow(P[1]);Object.keys(P[2]).forEach(function(k){d[k]=clone(P[2][k]);});cbaAdd(d);};
ACT.cbaed=function(b){AR.xe=b.getAttribute('data-v');armoryDlg('x');};
ACT.cbadel=function(b){var id=b.getAttribute('data-v');if(cbaInUse(id)){toast('戰場上仍有這種毒劑（毒劑雲、污染、病患或命令），不能刪除。',4500);return;}if(!confirm('刪除「'+(G.cba[id]||{}).n+'」？'))return;delete G.cba[id];if(AR.xe===id)AR.xe='';wmdBump();armoryDlg('x');};
ACT.cbaok=function(){AR.xe='';armoryDlg('x');};
function cbaListHtml(){var o='<table class="lw-tbl"><tr><th>毒劑</th><th>類別</th><th>機制</th><th class="n">年代</th><th class="n">毒性</th><th class="n">平民致死</th><th class="n">地面持久</th><th class="n">雲存續</th><th class="n">面具／防護服</th><th>疾病</th><th></th></tr>';
  Object.keys(CBA).forEach(function(k){var A=CBA[k],cu=CBAX.k.indexOf(k)>=0,dz=A[10]&&DZ[A[10]],mech=cu?(CBMECH[(G.cba[k]||{}).mech]||[''])[0]:(CBMECH[CBMDEF[k]]||[''])[0];
    o+='<tr'+(AR.xe===k?' style="background:rgba(63,81,181,.08)"':'')+'><td><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:'+esc(A[11])+';border:1px solid rgba(0,0,0,.3);margin-right:4px"></span>'+esc(A[0])+(cu?' <span class="lw-pill">自訂</span>':'')+'</td><td>'+(CBT[A[1]]||'')+'</td><td>'+esc(mech)+'</td><td class="n">'+(A[2]||'—')+'</td><td class="n">'+fx(A[3],2)+'</td><td class="n">'+pct(A[4]*100)+'</td>'+
      '<td class="n">'+(A[5]>0?(A[5]>=48?fmt(A[5]/24)+' 天':fmt(A[5])+' 小時'):'—')+'</td><td class="n">'+fmt(A[6])+' 分</td><td class="n">'+pct(A[8]*100)+'／'+pct(A[9]*100)+'</td><td>'+(dz?esc(dz[0])+(CBC[A[10]]?'（人傳人）':''):'—')+'</td>'+
      '<td>'+(cu?'<button type="button" class="lw-btn sm" data-a="cbaed" data-v="'+esc(k)+'">編輯</button><button type="button" class="lw-btn sm dng" data-a="cbadel" data-v="'+esc(k)+'">刪除</button>':'<button type="button" class="lw-btn sm" data-a="cbacp" data-v="'+esc(k)+'">複製修改</button>')+'</td></tr>';});return o+'</table>';}
function cbaHtml(){var o='<div class="lw-note">毒劑隨風漂移、擴散並逐漸衰減，持久性毒劑會污染經過的地面；部隊依面具、防護服、防護等級與密閉載具減少吸入的劑量。自訂的毒劑與內建毒劑一樣可以用砲彈、空中噴灑或魔法施放（魔法類只給奇幻陣營），使用時同樣受陣營政策與國際法約束。毒性的參考：沙林 2.2、VX 2.6、芥子氣 0.5、氯氣 0.9。</div>'+
  '<div class="lw-row"><button type="button" class="lw-btn sm pri" data-a="cbanew">＋新增自訂毒劑</button><label>以範例新增 <select data-c="cbapre"><option value="">（選擇）</option>'+CBPRE.map(function(P,i){return '<option value="'+i+'">'+esc(P[0])+'</option>';}).join('')+'</select></label></div>'+
  '<div class="lw-sc" style="max-height:30vh;overflow:auto" data-k="cbalist">'+cbaListHtml()+'</div>';
  var d=AR.xe&&G.cba&&G.cba[AR.xe];if(d)o+=cbaEdHtml(AR.xe,d);
  var ref=d?AR.xe:(AR.xref&&CBA[AR.xref]?AR.xref:'sarin');o+='<h4 style="margin:10px 0 4px">下風擴散預測：'+(d?esc(d.n):'<select data-c="cbaref">'+Object.keys(CBA).map(function(k){return '<option value="'+esc(k)+'"'+(k===ref?' selected':'')+'>'+esc(CBA[k][0])+'</option>';}).join('')+'</select>')+'</h4>'+cbaPlHtml();return o;}
function cbaEdHtml(id,d){var z=d.dz||{},bio=d.c==='b'||d.c==='m',M=cbaMechOpts(d.c);
  var o='<h4 style="margin:10px 0 4px">設計：'+esc(d.n)+'</h4>'+wmdGrid(wmdIn('名稱','cbaf','n',d.n,'text')+wmdSel('類別','cbaf','c',Object.keys(CBT).map(function(k){return [k,CBT[k]];}),d.c)+wmdSel('作用機制','cbaf','mech',M,d.mech)+wmdIn('年代（可用的最早年份）','cbaf','y',d.y)+
    wmdIn(d.c==='b'?'感染力（每單位劑量）':'毒性（每單位劑量）','cbaf','k',d.k)+wmdIn('平民致死比例（0～1）','cbaf','l',d.l)+wmdIn('地面持久（小時，0＝不污染）','cbaf','p',d.p)+wmdIn('雲存續（分鐘）','cbaf','life',d.life)+
    wmdIn('面具防護（0～1）','cbaf','mk',d.mk)+wmdIn('防護服防護（0～1）','cbaf','st',d.st)+wmdIn('顏色','cbaf','col',d.col||'#7e57c2','color'))+
    '<div class="lw-row"><label><input type="checkbox" data-c="cbab" data-f="h"'+(d.h?' checked':'')+'> 重於空氣（沉入低地與壕溝、移動較慢）</label></div>';
  if(bio){o+='<h4 style="margin:6px 0 4px">疾病'+(d.c==='m'?'（可不填：只有直接傷害）':'')+'</h4>'+wmdGrid(wmdIn('疾病名稱','cbaz','n',z.n||'','text')+wmdIn('未治療死亡率（0～1）','cbaz','m',z.m)+wmdIn('治療後死亡率（0～1）','cbaz','mt',z.mt)+wmdIn('病程（天）','cbaz','d',z.d)+wmdIn('潛伏期（天）','cbaz','inc',z.inc)+
      (d.c==='b'?wmdIn('疫苗名稱（空白＝沒有）','cbaz','vx',z.vx||'','text')+wmdIn('疫苗年代','cbaz','vy',z.vy)+wmdIn('接種後產生免疫（天）','cbaz','vd',z.vd):''))+'<div class="lw-row"><label><input type="checkbox" data-c="cbazb" data-f="ct"'+(z.ct?' checked':'')+'> 人傳人（病患會傳染附近部隊與平民；隔離可大幅降低）</label></div>';}
  return o+'<div class="lw-row"><button type="button" class="lw-btn sm dng" data-a="cbadel" data-v="'+esc(id)+'">刪除</button><button type="button" class="lw-btn sm pri" data-a="cbaok">完成</button></div>';}
function cbaMechOpts(c){return Object.keys(CBMECH).filter(function(k){return CBMECH[k][2]===c;}).map(function(k){return [k,CBMECH[k][0]];});}
function cbaCur(){return AR.xe&&G.cba&&G.cba[AR.xe];}
function cbaRefresh(){var d=cbaCur(),N=[];if(d){rlAgent(d,N);if(N.length)toast('已依現實限制調整：'+N.join('；'),5000);}wmdBump();wmdSet('cbalist',cbaListHtml());cbaDraw();}
CHG.cbaf=function(t){var d=cbaCur();if(!d)return;var f=t.getAttribute('data-f');if(f==='n'||f==='col'||f==='mech')d[f]=String(t.value).slice(0,40);else if(f==='c'){d.c=t.value;d.mech=(cbaMechOpts(d.c)[0]||[''])[0];if(d.c==='b'&&!d.dz)d.dz={n:d.n+'感染',m:0.3,mt:0.05,d:7,inc:3,ct:0,vx:'',vy:0,vd:14};wmdBump();armoryDlg('x');return;}
  else{var v=+t.value;if(!isFinite(v))return;d[f]=f==='y'?Math.round(v):Math.max(0,f==='l'||f==='mk'||f==='st'?Math.min(1,v):v);}cbaRefresh();};
CHG.cbab=function(t){var d=cbaCur();if(!d)return;d[t.getAttribute('data-f')]=t.checked?1:0;cbaRefresh();};
CHG.cbaz=function(t){var d=cbaCur();if(!d)return;var z=d.dz=d.dz||{},f=t.getAttribute('data-f');if(f==='n'||f==='vx')z[f]=String(t.value).slice(0,20);else{var v=+t.value;if(!isFinite(v))return;z[f]=Math.max(0,f==='m'||f==='mt'?Math.min(1,v):v);}cbaRefresh();};
CHG.cbazb=function(t){var d=cbaCur();if(!d)return;(d.dz=d.dz||{})[t.getAttribute('data-f')]=t.checked?1:0;cbaRefresh();};
CHG.cbaref=function(t){AR.xref=t.value;cbaDraw();};
/* 擴散預測圖 */
function cbaPlHtml(){return '<div class="lw-row" style="flex-wrap:wrap"><label>施放量 <select data-c="cbapl" data-f="xq">'+CBQ.map(function(q,i){return '<option value="'+i+'"'+(AR.xq===i?' selected':'')+'>'+q[0]+'</option>';}).join('')+'</select></label><label>風速 <select data-c="cbapl" data-f="xws">'+[1,2,4,6,10,15].map(function(v){return '<option value="'+v+'"'+(AR.xws===v?' selected':'')+'>'+v+' 公尺／秒</option>';}).join('')+'</select></label>'+
  '<label>防護 <select data-c="cbapl" data-f="xpr">'+[['none','沒有防護'],['mask','戴上面具'],['mopp','全身防護（MOPP 4）']].map(function(q){return '<option value="'+q[0]+'"'+(AR.xpr===q[0]?' selected':'')+'>'+q[1]+'</option>';}).join('')+'</select></label>'+
  '<label><input type="checkbox" data-c="cbapl" data-f="xrain"'+(AR.xrain?' checked':'')+'> 下雨</label><label><input type="checkbox" data-c="cbapl" data-f="xhot"'+(AR.xhot?' checked':'')+'> 炎熱（超過 25°C）</label></div>'+
  '<canvas data-k="cbapl" width="640" height="240" style="width:100%;max-width:640px;border:1px solid rgba(0,0,0,.15);border-radius:4px;background:#fafafa"></canvas><div class="lw-note" data-k="cbaplt"></div>';}
CHG.cbapl=function(t){var f=t.getAttribute('data-f');AR[f]=t.type==='checkbox'?(t.checked?1:0):f==='xws'||f==='xq'?+t.value:t.value;cbaDraw();};
var CBRAMP=[[254,229,217],[252,174,145],[251,106,74],[222,45,38],[165,15,21]];
function cbaRamp(e){var x=clamp(e,0,1)*(CBRAMP.length-1),i=Math.min(CBRAMP.length-2,Math.floor(x)),f=x-i,a=CBRAMP[i],b=CBRAMP[i+1];return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f];}
function cbaProtOf(A,pr){return pr==='mask'?A[8]:pr==='mopp'?1-(1-A[8])*(1-A[9]):0;}
/* 下風中線上效果超過門檻的最遠距離 */
function cbaReach(A,pl,P,th){var F=pl.F,X=F.length?F[F.length-1][0]+F[F.length-1][1]:0,best=0;for(var x=0;x<=X;x+=Math.max(25,X/400))if(cbaEffect(A,pl.dose(x,0),P)>=th)best=x;return best;}
function cbaDraw(){var d=UI.wdlg,cv=d&&d.querySelector('canvas[data-k="cbapl"]');if(!cv)return;var id=AR.xe&&CBA[AR.xe]?AR.xe:(AR.xref&&CBA[AR.xref]?AR.xref:'sarin'),A=CBA[id];if(!A)return;
  var Q=CBQ[AR.xq]||CBQ[0],pl=cbaPlume(A,AR.xws,{rain:AR.xrain,hot:AR.xhot,m0:Q[1],r0:Q[2]}),F=pl.F,c=cv.getContext('2d'),W=cv.width,H=cv.height,P=cbaProtOf(A,AR.xpr);c.clearRect(0,0,W,H);if(!F.length)return;
  var last=F[F.length-1],X0=-Math.max(800,F[0][1]*1.4),X1=Math.min(90000,Math.max(3000,last[0]+last[1]*1.3)),Rm=0;F.forEach(function(q){Rm=Math.max(Rm,q[1]);});var Y1=Math.min(14000,Math.max(1200,Rm*1.25)),pw=W-50,ph=H-50,ox=40,oy=8;
  /* 每格 4 像素；色階依圖中的最大值 */var img=c.createImageData(pw,ph),cell=4,EF=[],emx=0;for(var gy=0;gy<ph;gy+=cell)for(var gx=0;gx<pw;gx+=cell){var e0=cbaEffect(A,pl.dose(X0+(gx+cell/2)/pw*(X1-X0),Y1-(gy+cell/2)/ph*2*Y1),P);EF.push(e0);if(e0>emx)emx=e0;}
  var top=Math.max(0.05,Math.ceil(emx*20)/20),ei=0;for(gy=0;gy<ph;gy+=cell)for(gx=0;gx<pw;gx+=cell){var e=EF[ei++];if(e<0.005)continue;var col=cbaRamp(e/top),al=Math.round(255*(0.35+0.65*Math.min(1,e/top)));
      for(var yy=gy;yy<Math.min(ph,gy+cell);yy++)for(var xx=gx;xx<Math.min(pw,gx+cell);xx++){var p=(yy*pw+xx)*4;img.data[p]=col[0];img.data[p+1]=col[1];img.data[p+2]=col[2];img.data[p+3]=al;}}
  c.putImageData(img,ox,oy);var sx=function(x){return ox+(x-X0)/(X1-X0)*pw;},sy=function(y){return oy+(Y1-y)/(2*Y1)*ph;};
  c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=1;c.strokeRect(ox+0.5,oy+0.5,pw-1,ph-1);c.fillStyle='#424242';c.font='10.5px sans-serif';c.textAlign='center';
  var stp=[500,1000,2000,5000,10000,20000].filter(function(s){return (X1-X0)/s<=10;})[0]||20000;for(var x=0;x<=X1;x+=stp){var X=sx(x);c.strokeStyle='rgba(0,0,0,.12)';c.beginPath();c.moveTo(X,oy);c.lineTo(X,oy+ph);c.stroke();c.fillText(kmTxt(x),X,oy+ph+13);}
  c.textAlign='right';[Y1*0.8,0,-Y1*0.8].forEach(function(y){c.fillText((y>0?'+':y<0?'−':'')+kmTxt(Math.abs(y)).replace(' 公里','km').replace(' 公尺','m'),ox-3,sy(y)+4);});c.textAlign='left';
  c.fillStyle='#1a237e';c.beginPath();c.arc(sx(0),sy(0),4,0,2*PI);c.fill();txtHalo(c,'施放點',sx(0)+6,sy(0)-8,'bold 10.5px sans-serif','#1a237e');c.fillStyle='#424242';c.fillText('風向 →（下風距離）',ox,oy+ph+32);
  /* 色階 */var lx=W-150,ly=oy+ph+32;c.textAlign='right';c.fillText((A[1]==='b'?'感染比例':'傷亡比例')+' 0',lx-4,ly);for(var i=0;i<100;i++){var cc=cbaRamp(i/99);c.fillStyle='rgb('+cc.map(Math.round).join(',')+')';c.fillRect(lx+i,ly-9,1,10);}c.fillStyle='#424242';c.textAlign='left';c.fillText(pct(top*100),lx+104,ly);
  var r=[0,A[8],1-(1-A[8])*(1-A[9])].map(function(p){return cbaReach(A,pl,p,0.1);}),life=F.length*2;
  var t=(A[1]==='b'?'下風感染超過 10% 的距離':'下風傷亡超過 10% 的距離')+'：沒有防護 '+kmTxt(r[0])+'、戴面具 '+kmTxt(r[1])+'、全身防護 '+kmTxt(r[2])+'。毒劑雲約 '+durTxt(life*60)+' 後消散，最大半徑 '+kmTxt(Rm)+'。'+(A[5]>0?'地面污染持久約 '+(A[5]>=48?fmt(A[5]/24)+' 天':fmt(A[5])+' 小時')+'，經過或停留的部隊會持續暴露並沾染裝備。':'不會污染地面。')+(A[7]?'重於空氣：會沉入低地、河谷與壕溝。':'')+'（以一次施放估算：'+Q[0]+'；實際作戰中持續射擊會不斷補充毒劑雲，砲擊目標附近的劑量更高。）';
  var tx=d.querySelector('[data-k="cbaplt"]');if(tx)tx.textContent=t;}
/* 自訂的魔法類毒劑：有魔法武器的單位可以施放 */
(function(){var b=cbCan;cbCan=function(u){var o=b(u);if(!isLeaf(u)||!uEra(u).fan)return o;var av=cbAvail(u.side),mag=(u.lg&&u.lg.w||[]).some(function(x){var w=wpnOf(x[0]);return x[1]>0&&w&&w.cat==='奇幻'&&(x[0]==='magic'||w.mag);});
  if(mag)av.forEach(function(k){if(CBAX.k.indexOf(k)>=0&&CBA[k][1]==='m'&&!o.some(function(q){return q[0]===k&&q[1]==='mag';}))o.push([k,'mag']);});return o;};})();
/* ---------- 核彈頭 ---------- */
var NWPRE=[['小男孩（廣島，1945）','fis',15,'air',4400,1945],['胖子（長崎，1945）','fis',21,'air',4670,1945],['W54 大衛·克羅克特（無後座力砲）','fis',0.02,'surface',23,1961],['W48 155 公釐核砲彈','fis',0.072,'air',58,1963],
  ['W70-3 強化輻射彈（中子彈）','er',1,'air',211,1981],['B61 戰術核彈','th',340,'air',320,1968],['W88 潛射彈頭','th',475,'air',360,1988],['B83 戰略核彈','th',1200,'air',1100,1983],['沙皇炸彈（1961）','th',50000,'air',27000,1961],['鈷彈（構想）','salt',1000,'surface',3000,1960],['乾淨氫彈（1956 年試爆）','clean',4500,'air',3400,1956]];
function nwhNewId(){G.nwhSeq=(G.nwhSeq||0)+1;var id='nw'+G.nwhSeq;while(G.nwh&&G.nwh[id]){G.nwhSeq++;id='nw'+G.nwhSeq;}return id;}
function nwhAdd(W){var id=nwhNewId();G.nwh=G.nwh||{};G.nwh[id]=W;AR.xe=id;armoryDlg('x');}
ACT.nwhnew=function(){var y=Math.max(1945,G.set.y||1960),k=y>=1955?'th':'fis',Y=k==='th'?300:20;nwhAdd({n:'自訂核彈頭 '+((G.nwhSeq||0)+1),k:k,Y:Y,b:'air',kg:nwhKgEst(Y,y,k),usd:nwhUsdEst(Y,k),y:Math.max(NWKIND[k][5],Math.min(y,2030))});};
CHG.nwhpre=function(t){var P=NWPRE[+t.value];if(!P)return;nwhAdd({n:P[0].replace(/（.*$/,''),k:P[1],Y:P[2],b:P[3],kg:P[4],usd:nwhUsdEst(P[2],P[1]),y:P[5]});};
ACT.nwhed=function(b){AR.xe=b.getAttribute('data-v');armoryDlg('x');};
ACT.nwhcp=function(b){var W=nwhOf(b.getAttribute('data-v'));if(!W)return;var q=clone(W);q.n=W.n+'（複製）';nwhAdd(q);};
ACT.nwhdel=function(b){var id=b.getAttribute('data-v'),W=nwhOf(id);if(!W)return;var busy=(G.nq||[]).concat(G.snq||[]).some(function(q){return q.wk===id;})||(G.units||[]).some(function(u){return u.ord&&u.ord.wk===id;});if(busy){toast('這個彈頭正在使用中（已下令的核打擊），不能刪除。',4500);return;}if(!confirm('刪除「'+W.n+'」？'))return;delete G.nwh[id];if(AR.xe===id)AR.xe='';armoryDlg('x');};
ACT.nwhok=function(){AR.xe='';armoryDlg('x');};
function nwhZ(W){var o=NWK;NWK=W;try{return {Z:snkZones(W.Y,W.b||'air'),R:nukeR(W.Y),rr:nwhRadR(W.Y,nwK(W))};}finally{NWK=o;}}
function nwhListHtml(){var L=Object.keys(G.nwh||{});if(!L.length)return '<div class="lw-note">還沒有自訂核彈頭。</div>';
  return '<table class="lw-tbl"><tr><th>彈頭</th><th>種類</th><th class="n">當量</th><th>爆炸方式</th><th class="n">重量</th><th class="n">單價</th><th class="n">年代</th><th class="n">重度破壞半徑</th><th></th></tr>'+L.map(function(id){var W=G.nwh[id],z=nwhZ(W);
    return '<tr'+(AR.xe===id?' style="background:rgba(63,81,181,.08)"':'')+'><td>'+esc(W.n)+'</td><td>'+esc(nwK(W)[0])+'</td><td class="n">'+yTxt(W.Y)+'</td><td>'+(W.b==='surface'?'地面':'空中')+'</td><td class="n">'+fmt(W.kg)+' kg</td><td class="n">'+amoney(W.usd||0)+'</td><td class="n">'+(W.y||'')+'</td><td class="n">'+kmTxt(z.Z.r5)+'</td>'+
      '<td><button type="button" class="lw-btn sm" data-a="nwhed" data-v="'+esc(id)+'">編輯</button><button type="button" class="lw-btn sm" data-a="nwhcp" data-v="'+esc(id)+'">複製</button><button type="button" class="lw-btn sm dng" data-a="nwhdel" data-v="'+esc(id)+'">刪除</button></td></tr>';}).join('')+'</table>';}
function nwhHtml(){var o='<div class="lw-note">核彈頭可以在戰術核打擊（命令面板的「彈頭」）與戰略核打擊（☢ 戰略核武）中選用。種類決定能量如何分配：強化輻射彈（中子彈）的爆風與熱輻射較小，但中子輻射穿透裝甲；鹽彈刻意製造大量長效落塵；乾淨彈的落塵很少。彈頭的重量決定能裝進哪種砲彈、飛彈或飛機。</div>'+
  '<div class="lw-row"><button type="button" class="lw-btn sm pri" data-a="nwhnew">＋新增核彈頭</button><label>以歷史彈頭新增 <select data-c="nwhpre"><option value="">（選擇）</option>'+NWPRE.map(function(P,i){return '<option value="'+i+'">'+esc(P[0])+'</option>';}).join('')+'</select></label></div>'+
  '<div class="lw-sc" style="max-height:26vh;overflow:auto" data-k="nwhlist">'+nwhListHtml()+'</div>';var W=AR.xe&&nwhOf(AR.xe);if(!W)return o;
  o+='<h4 style="margin:10px 0 4px">設計：'+esc(W.n)+'</h4>'+wmdGrid(wmdIn('名稱','nwhf','n',W.n,'text')+wmdSel('種類','nwhf','k',Object.keys(NWKIND).map(function(k){var K=NWKIND[k];return [k,K[0]+'（'+K[5]+' 年起，'+yTxt(K[6])+'～'+yTxt(K[7])+'）'];}),W.k)+wmdIn('當量（千噸）','nwhf','Y',W.Y)+
    wmdSel('預設爆炸方式','nwhf','b',[['air','空中爆炸'],['surface','地面爆炸']],W.b||'air')+wmdIn('重量（公斤）','nwhf','kg',W.kg)+wmdIn('單價（美元）','nwhf','usd',W.usd)+wmdIn('年代','nwhf','y',W.y))+
    '<div class="lw-row"><button type="button" class="lw-btn sm" data-a="nwhest">依年代與當量估算重量與價格</button><button type="button" class="lw-btn sm dng" data-a="nwhdel" data-v="'+esc(AR.xe)+'">刪除</button><button type="button" class="lw-btn sm pri" data-a="nwhok">完成</button></div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start"><div data-k="nwhout" style="flex:1 1 360px">'+nwhOutHtml(W)+'</div><canvas data-k="nwhcv" width="340" height="340" style="width:340px;max-width:100%;border:1px solid rgba(0,0,0,.15);border-radius:4px;background:#fafafa"></canvas></div>';return o;}
function nwhOutHtml(W){var z=nwhZ(W),Z=z.Z,R=z.R,K=nwK(W),y=G.set.y||1960,warn=[];if(W.Y<K[6]||W.Y>K[7])warn.push(K[0]+'的當量通常在 '+yTxt(K[6])+'～'+yTxt(K[7])+' 之間');if((W.y||0)<K[5])warn.push(K[0]+'要到 '+K[5]+' 年才出現');if(W.kg<W.Y/5.2)warn.push('比威力超過 5.2 千噸／公斤（史上最高的 B41），不太可能做到');
  var kv=function(a,b){return '<span>'+a+'</span><span>'+b+'</span>';};
  var o='<div class="lw-kv">'+kv('火球',kmTxt(Z.fb))+kv('12 psi（鋼筋混凝土建築倒塌）',kmTxt(Z.r12))+kv('5 psi（多數建築倒塌、重度破壞）',kmTxt(Z.r5))+kv('2 psi（中度破壞）',kmTxt(Z.r2))+kv('1 psi（窗戶破裂、輕度破壞）',kmTxt(Z.r1))+kv('三度灼傷',kmTxt(Z.th))+kv('瞬發輻射 500 侖目',kmTxt(Z.rad))+(Z.cr?kv('彈坑',kmTxt(Z.cr)):'')+
    kv('戰術計算',' 全毀 '+kmTxt(R[0])+'、重創 '+kmTxt(R[1])+'、輕傷 '+kmTxt(R[2])+'、震撼 '+kmTxt(R[3])+(K[3]>1?'；中子輻射 '+kmTxt(z.rr):''))+kv('放射性落塵',(K[4]===1?'一般':'一般的 '+fx(K[4],1)+' 倍')+(W.b==='surface'?'（地面爆炸：沿風向污染數十公里）':'（空中爆炸：局部落塵很少）'))+kv('與廣島比較','重度破壞面積約為廣島的 '+nwhRatio(Math.pow(Z.r5/1702,2)))+'</div>';
  if(warn.length)o+='<div class="lw-note" style="color:#b3261e">⚠ '+esc(warn.join('；'))+'</div>';
  var ny=typeof featY==='function'?featY('nuke'):1945,T=[['砲彈',120,1,ny+8],['火箭與戰術飛彈',1000,y<1970?20:10,ny+8],['轟炸機與攻擊機',30000,y<ny+5?25:y<ny+10?500:10000,ny]].map(function(q){var ok=W.kg<=q[1]&&W.Y<=q[2]&&y>=q[3];return '<li>'+(ok?'✓ ':'✗ ')+q[0]+'（'+fmt(q[1])+' 公斤、'+yTxt(q[2])+'以下'+(y<q[3]?'；'+q[3]+' 年起':'')+'）</li>';});
  Object.keys(SNKD).forEach(function(k){var why=nwhDelWhy(k,W);T.push('<li>'+(why?'✗ ':'✓ ')+SNKD[k].n+'（'+fmt(NWDEL[k]||0)+' 公斤以下，'+SNKD[k].y0+' 年起）'+(why&&!/重 /.test(why)?'：'+esc(why):'')+'</li>');});
  return o+'<div class="lw-note" style="margin-top:4px"><b>可搭載</b><ul style="margin:2px 0 0 18px;padding:0">'+T.join('')+'</ul></div>';}
function nwhRatio(a){return a>=1?fx(a,a>=10?0:1)+' 倍':pct(a*100,a<0.01?2:a<0.1?1:0);}
function nwhDraw(){var d=UI.wdlg,cv=d&&d.querySelector('canvas[data-k="nwhcv"]'),W=AR.xe&&nwhOf(AR.xe);if(!cv||!W)return;var z=nwhZ(W),Z=z.Z,c=cv.getContext('2d'),S=cv.width,cx=S/2,cy=S/2-8,ref=1702;
  var L=[[Z.r1,'#fdd835','1 psi'],[Z.th,'#fb8c00','三度灼傷',1],[Z.r2,'#ff9800','2 psi'],[Z.r5,'#e53935','5 psi'],[Z.r12,'#7f0000','12 psi'],[Z.rad,'#2e7d32','輻射',1],[Z.fb,'#212121','火球']],mx=Math.max(ref,Z.r1,Z.th,Z.rad)*1.06,k=(S/2-14)/mx;c.clearRect(0,0,S,S);
  L.slice().sort(function(a,b){return b[0]-a[0];}).forEach(function(q){if(q[3])return;c.fillStyle=q[1];c.globalAlpha=0.18;c.beginPath();c.arc(cx,cy,Math.max(1.5,q[0]*k),0,2*PI);c.fill();});c.globalAlpha=1;
  L.forEach(function(q){c.strokeStyle=q[1];c.lineWidth=1.6;c.setLineDash(q[3]?[5,4]:[]);c.beginPath();c.arc(cx,cy,Math.max(1.5,q[0]*k),0,2*PI);c.stroke();});c.setLineDash([3,3]);c.strokeStyle='#546e7a';c.lineWidth=1.4;c.beginPath();c.arc(cx,cy,ref*k,0,2*PI);c.stroke();c.setLineDash([]);
  c.font='10.5px sans-serif';c.textAlign='center';var used=[];L.concat([[ref,'#546e7a','廣島 5 psi']]).sort(function(a,b){return b[0]-a[0];}).forEach(function(q){var r=q[0]*k;if(r<9)return;var y=cy-r-3;if(used.some(function(u){return Math.abs(u-y)<11;}))return;used.push(y);txtHalo(c,q[2]+' '+kmTxt(q[0]),cx,y,'10.5px sans-serif',q[1]==='#fdd835'?'#8d6e00':q[1]);});
  var bar=[100,200,500,1000,2000,5000,10000,20000,50000].filter(function(v){return v*k>=40;})[0]||100000;c.strokeStyle='#424242';c.lineWidth=2;c.beginPath();c.moveTo(12,S-12);c.lineTo(12+bar*k,S-12);c.stroke();c.fillStyle='#424242';c.textAlign='left';c.fillText(kmTxt(bar),14,S-16);c.textAlign='right';c.fillText(yTxt(W.Y)+'・'+(W.b==='surface'?'地面':'空中')+'爆炸',S-8,S-8);}
function nwhCur(){return AR.xe&&nwhOf(AR.xe);}
function nwhRefresh(){var W=nwhCur();if(!W)return;var N=[];rlNuke(W,N);if(N.length)toast('已依現實限制調整：'+N.join('；'),5000);wmdSet('nwhlist',nwhListHtml());wmdSet('nwhout',nwhOutHtml(W));nwhDraw();}
CHG.nwhf=function(t){var W=nwhCur();if(!W)return;var f=t.getAttribute('data-f');if(f==='n')W.n=String(t.value).slice(0,40)||'核彈頭';else if(f==='k'||f==='b')W[f]=t.value;else{var v=+t.value;if(!isFinite(v)||v<0)return;W[f]=f==='Y'?clamp(v,0.001,200000):f==='y'?Math.round(v):v;}nwhRefresh();};
ACT.nwhest=function(){var W=nwhCur();if(!W)return;W.kg=nwhKgEst(W.Y,W.y||G.set.y||1960,W.k);W.usd=nwhUsdEst(W.Y,W.k);armoryDlg('x');};
/* 作戰中可選的彈頭（依年代） */
function nwhAvail(){var y=G.set.y||1943;return Object.keys(G.nwh||{}).filter(function(id){var W=G.nwh[id];return nwK(W)[5]<=y&&(W.y||0)<=y;});}
/* 戰術核打擊：命令面板的彈頭選擇 */
function nwhFitAny(us,W){var L=[];(us||[]).forEach(function(x){if(x)(isLeaf(x)?[x]:leavesOf(x)).forEach(function(l){if(nukeCap(l)>0)L.push(l);});});if(!L.length)return '沒有可實施核打擊的單位';var why='';for(var i=0;i<L.length;i++){why=nwhFit(L[i],W);if(!why)return '';}return why;}
(function(){var b=nkYHtml;nkYHtml=function(us){var L=nwhAvail();if(!L.length)return b(us);var W=nwhOf(UI.ordOpt.wk);if(W&&L.indexOf(UI.ordOpt.wk)<0){UI.ordOpt.wk='';W=null;}
  var o='<span>彈頭</span><select data-c="oo" data-f="wk"><option value="">一般彈頭（自訂當量）</option>'+L.map(function(id){var X=G.nwh[id],why=nwhFitAny(us,X);return '<option value="'+esc(id)+'"'+(UI.ordOpt.wk===id?' selected':'')+(why?' disabled':'')+'>'+esc(X.n)+'（'+esc(nwK(X)[0])+'，'+yTxt(X.Y)+'）'+(why?'——'+esc(why):'')+'</option>';}).join('')+'</select>';
  if(!W)return o+b(us);var why=nwhFitAny(us,W);return o+'<span>當量</span><span>'+yTxt(W.Y)+'（'+esc(nwK(W)[0])+'，'+fmt(W.kg)+' 公斤）'+(why?'<br><span style="color:#b3261e">'+esc(why)+'</span>':'')+'</span>';};})();
(function(){var b=nkYEff;nkYEff=function(us){var W=nwhOf(UI.ordOpt.wk);return W?W.Y:b(us);};})();
(function(){var b=CHG.oo;CHG.oo=function(t){if(t.getAttribute('data-f')==='wk'){UI.ordOpt.wk=t.value||'';btOrd();vDraw(false);return;}b(t);};})();
(function(){var b=issueSel;issueSel=function(k,x,y,extra){if(k==='nuke'){var W=nwhOf(UI.ordOpt.wk);if(W){extra=Object.assign({},extra||{},{wk:UI.ordOpt.wk});}}return b(k,x,y,extra);};})();
function nwhPrevR(Y){var W=UI.ord&&UI.ord.k==='nuke'&&nwhOf(UI.ordOpt.wk);if(!W)return nukeR(Y);var o=NWK;NWK=W;try{return nukeR(Y);}finally{NWK=o;}}
/* 戰略核打擊：對話框的彈頭選擇；選了彈頭，當量與預設爆炸方式依彈頭 */
SNK.wk='';
function snkW(){return nwhOf(SNK.wk);}
(function(){var b=snkDlg;snkDlg=function(){var W=snkW(),sy=snkYields;if(W){SNK.Y=W.Y;snkYields=function(d){var r=sy(d);return r.indexOf(W.Y)<0?r.concat([W.Y]):r;};}var o=NWK;NWK=W||o;
  try{b.apply(this,arguments);}finally{snkYields=sy;NWK=o;}var d=UI.snkd,L=nwhAvail();if(!d||!d.isConnected||!L.length)return;var op=d.querySelector('.lw-opt');if(!op)return;
  var h='<span>彈頭</span><span><select data-c="snk" data-f="wk"><option value="">一般彈頭（自訂當量）</option>'+L.map(function(id){var X=G.nwh[id],why=nwhDelWhy(SNK.del,X);return '<option value="'+esc(id)+'"'+(SNK.wk===id?' selected':'')+(why?' disabled':'')+'>'+esc(X.n)+'（'+esc(nwK(X)[0])+'，'+yTxt(X.Y)+'，'+fmt(X.kg)+' 公斤）'+(why?'——'+esc(why):'')+'</option>';}).join('')+'</select>'+
    (W?'<br><span class="lw-note">'+esc(nwK(W)[0])+nwhNote(W,W.Y)+'</span>':'')+'</span>';op.insertAdjacentHTML('afterbegin',h);if(W)d.querySelectorAll('[data-c="snk"][data-f="Y"]').forEach(function(e){e.disabled=true;});};})();
(function(){var b=CHG.snk;CHG.snk=function(t){var f=t.getAttribute('data-f');if(f==='wk'){SNK.wk=t.value||'';var W=snkW();if(W){SNK.Y=W.Y;SNK.burst=W.b||SNK.burst;}SNK.ek='';snkDlg();return;}if(f==='del'&&snkW()&&nwhDelWhy(t.value,snkW()))SNK.wk='';b(t);};})();
(function(){var b=snkEstAt;snkEstAt=function(x,y){var W=snkW();if(SNK._wk!==SNK.wk){SNK._wk=SNK.wk;SNK.ek='';}if(!W)return b(x,y);var o=NWK;NWK=W;try{return b(x,y);}finally{NWK=o;}};})();
(function(){var b=snkPrev;snkPrev=function(c,hv){var W=snkW();if(!W)return b(c,hv);var o=NWK;NWK=W;try{return b(c,hv);}finally{NWK=o;}};})();
(function(){var b=snkConfirm;snkConfirm=function(x,y){var W=snkW();if(!W)return b(x,y);var o=NWK;NWK=W;try{b(x,y);}finally{NWK=o;}var d=UI.snkd;if(!d)return;var sp=d.querySelectorAll('.lw-kv > span');for(var i=0;i<sp.length-1;i++)if(sp[i].textContent==='武器'){sp[i+1].textContent='「'+W.n+'」（'+nwK(W)[0]+'）・'+sp[i+1].textContent;break;}};})();
(function(){var b=ACT.snkgo;ACT.snkgo=function(){var W=snkW();if(!W)return b.apply(this,arguments);if(nwhDelWhy(SNK.del,W)){toast(nwhDelWhy(SNK.del,W),4500);return;}var sl=snkLaunch,o=NWK;snkLaunch=function(s,d,Y,bu,x,y){return sl(s,d,Y,bu,x,y,false,SNK.wk);};NWK=W;
  try{return b.apply(this,arguments);}finally{snkLaunch=sl;NWK=o;}};})();
/* ---------- 魔法武器 ---------- */
var MAGPRE=[['火球術','fire','burst',4,300,3],['冰槍','ice','one',3,250,2],['連鎖閃電','ltn','wide',5,400,5],['恐懼術','dark','wide',3,200,3],['聖光審判','holy','burst',4,300,4],['衝擊波','wind','burst',3,150,2],['地裂術','earth','wide',6,300,6],['隕石術（儀式）','fire','rit',8,3000,9],['奧術飛彈','arc','one',3,600,2]];
function magList(){var o=[];for(var k in (G.wpns||{}))if(G.wpns[k].mag)o.push(G.wpns[k]);return o;}
function magAdd(n,sch,area,pow,rng,mana){G.wseq=(G.wseq||0)+1;var k='cw'+G.wseq;while(WPNO[k]||G.wpns&&G.wpns[k]){G.wseq++;k='cw'+G.wseq;}var w={k:k,n:n,hid:0,mag:{sch:sch,area:area,pow:pow,rng:rng,mana:mana}};magApply(w);G.wpns=G.wpns||{};G.wpns[k]=w;wpnChanged();AR.xe=k;armoryDlg('x');}
ACT.magnew=function(){magAdd('自訂法術 '+((G.wseq||0)+1),'arc','burst',3,400,3);};
CHG.magpre=function(t){var P=MAGPRE[+t.value];if(P)magAdd(P[0],P[1],P[2],P[3],P[4],P[5]);};
ACT.maged=function(b){AR.xe=b.getAttribute('data-v');armoryDlg('x');};
ACT.magdel=function(b){var k=b.getAttribute('data-v'),w=G.wpns&&G.wpns[k];if(!w)return;var used=G.units.some(function(u){return u.lg&&u.lg.w.some(function(x){return x[0]===k&&x[1]>0;});});if(!confirm((used?'仍有單位配備「'+w.n+'」，刪除後這些武器會失效。':'')+'確定刪除「'+w.n+'」？'))return;delete G.wpns[k];if(AR.xe===k)AR.xe='';wpnChanged();armoryDlg('x');};
ACT.magok=function(){AR.xe='';armoryDlg('x');};
function magUsers(k){return G.units.filter(function(u){return isLeaf(u)&&u.lg&&u.lg.w.some(function(x){return x[0]===k&&x[1]>0;});}).length;}
function magListHtml(){var L=magList();if(!L.length)return '<div class="lw-note">還沒有自訂魔法武器。</div>';return '<table class="lw-tbl"><tr><th>法術</th><th>系別</th><th>範圍</th><th class="n">威力</th><th class="n">射程</th><th>附帶效果</th><th class="n">對人</th><th class="n">對裝甲</th><th class="n">配備單位</th><th></th></tr>'+
  L.map(function(w){var m=w.mag;return '<tr'+(AR.xe===w.k?' style="background:rgba(63,81,181,.08)"':'')+'><td>'+esc(w.n)+'</td><td>'+(MAGS[m.sch]||MAGS.arc)[0]+'</td><td>'+(MAGA[m.area]||MAGA.burst)[0]+'</td><td class="n">'+m.pow+'</td><td class="n">'+kmTxt(m.rng)+'</td><td>'+(MAGFX[m.fx]||'—')+'</td><td class="n">'+fx(w.pP,2)+'</td><td class="n">'+fx(w.pA,2)+'</td><td class="n">'+magUsers(w.k)+'</td>'+
    '<td><button type="button" class="lw-btn sm" data-a="maged" data-v="'+esc(w.k)+'">編輯</button><button type="button" class="lw-btn sm dng" data-a="magdel" data-v="'+esc(w.k)+'">刪除</button></td></tr>';}).join('')+'</table>';}
function magHtml(){var o='<div class="lw-note">魔法武器設計完成後就是一件自訂武器（類別「奇幻」），可以在單位或自訂類型的武器清單中配發（「兵力編成」或「自訂類型」）。系別決定附帶效果：火系燃燒（多造成傷亡）、冰系減速（被擊中的部隊移動變慢 4 分鐘內）、雷系麻痺（加重壓制）、暗系恐懼（打擊士氣）、光系對魔物與飛龍加倍、風系打亂隊形、土系破壞工事；奧術沒有附帶效果但穿甲最高。效果依該武器占單位火力的比例發揮。</div>'+
  '<div class="lw-row"><button type="button" class="lw-btn sm pri" data-a="magnew">＋新增魔法武器</button><label>以範例新增 <select data-c="magpre"><option value="">（選擇）</option>'+MAGPRE.map(function(P,i){return '<option value="'+i+'">'+esc(P[0])+'</option>';}).join('')+'</select></label></div>'+
  '<div class="lw-sc" style="max-height:26vh;overflow:auto" data-k="maglist">'+magListHtml()+'</div>';var w=AR.xe&&G.wpns&&G.wpns[AR.xe];if(!w||!w.mag)return o;var m=w.mag;
  o+='<h4 style="margin:10px 0 4px">設計：'+esc(w.n)+'</h4>'+wmdGrid(wmdIn('名稱','magf','n',w.n,'text')+wmdSel('系別','magf','sch',Object.keys(MAGS).map(function(k){return [k,MAGS[k][0]];}),m.sch)+wmdSel('範圍','magf','area',Object.keys(MAGA).map(function(k){return [k,MAGA[k][0]];}),m.area)+
    wmdIn('威力（1～10）','magf','pow',m.pow)+wmdIn(m.area==='rit'?'間接射程（公尺）':'射程（公尺）','magf','rng',m.rng)+wmdIn('每次施法的魔力（1～10）','magf','mana',m.mana)+wmdSel('附帶效果','magf','fx',[['','（沒有）']].concat(Object.keys(MAGFX).map(function(k){return [k,MAGFX[k]];})),m.fx))+
    '<div data-k="magout">'+magOutHtml(w)+'</div><div class="lw-row"><button type="button" class="lw-btn sm dng" data-a="magdel" data-v="'+esc(w.k)+'">刪除</button><button type="button" class="lw-btn sm pri" data-a="magok">完成</button></div>';return o;}
function magOutHtml(w){var B=WPNO.magic||{},row=function(n,a,b,f){return '<tr><td>'+n+'</td><td class="n">'+f(a)+'</td><td class="n">'+(b===undefined?'—':f(b))+'</td></tr>';},f2=function(v){return fx(v,2);},f1=function(v){return fx(v,1);},km=function(v){return v?kmTxt(v):'—';},n0=function(v){return fmt(v);};
  return '<table class="lw-tbl" style="max-width:520px"><tr><th>作戰數值</th><th class="n">這個設計</th><th class="n">內建魔導砲</th></tr>'+row('對人殺傷',w.pP,B.pP,f2)+row('對裝甲殺傷',w.pA,B.pA,f2)+row('穿甲',w.pen,B.pen,f1)+row('壓制',w.sup,B.sup,f2)+row('有效射程',w.rE,B.rE,km)+row('間接射程',w.ind,B.ind,km)+row('精度',w.acc,B.acc,f2)+row('施法者（人）',w.crew,B.crew,n0)+row('防空',w.aa,B.aa,f2)+row('每基數施法次數',w.rpu,B.rpu,n0)+row('每次的魔晶（公斤）',w.kg,B.kg,f2)+
    '<tr><td>單價／每次施法</td><td class="n">'+amoney(w.usd)+'／'+amoney(w.rusd)+'</td><td class="n">'+amoney(wUsd(B))+'／'+amoney(wRUsd(B))+'</td></tr></table><div class="lw-note">附帶效果：'+(MAGFX[w.mag.fx]||'沒有')+'；配備的單位：'+magUsers(w.k)+' 個。</div>';}
CHG.magf=function(t){var w=AR.xe&&G.wpns&&G.wpns[AR.xe];if(!w||!w.mag)return;var f=t.getAttribute('data-f'),m=w.mag;if(f==='n')w.n=String(t.value).slice(0,40)||'法術';else if(f==='sch'){m.sch=t.value;m.fx=MAGS[m.sch][1];}else if(f==='area'||f==='fx')m[f]=t.value;else{var v=+t.value;if(!isFinite(v))return;m[f]=v;}
  magApply(w);wpnChanged();if(f==='sch'||f==='area'){armoryDlg('x');return;}wmdSet('maglist',magListHtml());wmdSet('magout',magOutHtml(w));};
/* ---------- 匯出與匯入：武器裝備檔帶上自訂毒劑與核彈頭 ---------- */
(function(){var b=armsExport;armsExport=function(opt){var D=b(opt);if(G.cba&&Object.keys(G.cba).length)D.cba=clone(G.cba);if(G.nwh&&Object.keys(G.nwh).length)D.nwh=clone(G.nwh);return D;};})();
(function(){var b=armsCheck;armsCheck=function(D){var e=b(D);if(e&&D&&(D.format===ARMFMT||D.format===ORBFMT)&&(D.cba&&Object.keys(D.cba).length||D.nwh&&Object.keys(D.nwh).length))return null;return e;};})();
(function(){var b=armsImport;armsImport=function(D){var r=b(D),n=0;
  if(D&&D.cba&&typeof D.cba==='object'){G.cba=G.cba||{};Object.keys(D.cba).forEach(function(id){var d=D.cba[id];if(!d||typeof d!=='object')return;var s=JSON.stringify(d);if(Object.keys(G.cba).some(function(k){return JSON.stringify(G.cba[k])===s;}))return;var nid=G.cba[id]||CBA[id]||!/^xa\d+$/.test(id)?cbaNewId():id;if(nid===id){var q=+id.slice(2);if(q>(G.cbaSeq||0))G.cbaSeq=q;}G.cba[nid]=clone(d);n++;});wmdBump();}
  if(D&&D.nwh&&typeof D.nwh==='object'){G.nwh=G.nwh||{};Object.keys(D.nwh).forEach(function(id){var W=D.nwh[id];if(!W||typeof W!=='object'||!(W.Y>0))return;var s=JSON.stringify(W);if(Object.keys(G.nwh).some(function(k){return JSON.stringify(G.nwh[k])===s;}))return;var nid=G.nwh[id]||!/^nw\d+$/.test(id)?nwhNewId():id;if(nid===id){var q=+id.slice(2);if(q>(G.nwhSeq||0))G.nwhSeq=q;}G.nwh[nid]=clone(W);n++;});}
  if(r)r.x=n;if(n)setTimeout(function(){toast('另匯入 '+n+' 項自訂毒劑與核彈頭。',4000);},60);return r;};})();
(function(){var b=ACT.armexp;ACT.armexp=function(){if(G&&!Object.keys(G.wpns||{}).length&&!Object.keys(G.types||{}).length&&(Object.keys(G.cba||{}).length||Object.keys(G.nwh||{}).length)){var D=armsExport({w:[],t:[],name:'化生放核魔'});
    download('化生放核魔.latoarms.json',JSON.stringify(D),'application/json');toast('已匯出 '+Object.keys(D.cba||{}).length+' 種自訂毒劑、'+Object.keys(D.nwh||{}).length+' 個核彈頭。');return;}return b.apply(this,arguments);};})();
HELP14.push('<h4>化生放核魔武器設計（裝備庫 →「化生放核魔」）</h4><ul><li><b>毒劑</b>：可複製內建毒劑修改，或從範例（塔崩、梭曼、諾維喬克、氫氰酸、畢茲、催淚瓦斯、蓖麻毒素、兔熱病、出血熱、銫 137 髒彈、屍疫瘴氣）新增。可設定類別、作用機制（神經性、糜爛性、窒息性、血液性、失能性、催淚、生物毒素……；機制決定傷亡中死亡的比例）、年代、毒性、平民致死比例、地面持久、雲存續、是否重於空氣、面具與防護服的防護，以及生物與魔法類的疾病（死亡率、病程、潛伏期、人傳人、疫苗）。下方的擴散預測圖以作戰中相同的漂移、擴散與衰減計算一次施放在下風處造成的傷亡（或感染）比例，可切換風速、下雨、炎熱與防護。</li>'+
  '<li><b>核彈頭</b>：分裂彈、增強分裂彈、熱核彈（氫彈）、強化輻射彈（中子彈）、鹽彈與乾淨彈，各有出現年代與常見當量。破壞範圍依 OTA《核戰爭的影響》換算並依種類調整；同心圓圖以虛線標出廣島原子彈的 5 psi 範圍作比較。重量決定能裝進哪種投射工具：砲彈約 120 公斤、火箭與戰術飛彈 1 公噸、潛射飛彈 2.8 公噸、洲際飛彈 9 公噸、核巡弋飛彈 500 公斤、轟炸機 30 公噸。下達戰術核打擊時在命令面板選「彈頭」，戰略核打擊在對話框選；中子彈的中子輻射會穿透裝甲殺傷乘員，鹽彈的落塵是一般的 3 倍，乾淨彈幾乎沒有落塵。</li>'+
  '<li><b>魔法武器</b>：選系別、範圍（單體、小範圍、大範圍、儀式＝間接火力）、威力、射程與每次施法的魔力，程式依此算出對人與對裝甲殺傷、穿甲、壓制、射程、施法者人數、每基數施法次數、魔晶重量與價格，存成自訂武器配發給部隊。附帶效果依該武器占單位火力的比例發揮：燃燒、冰凍減速、雷擊麻痺、恐懼、神聖（對魔物與飛龍加倍）、衝擊、地裂。奇幻陣營的魔法單位也能施放自訂的魔法類毒劑（瘴氣、詛咒）。</li>'+
  '<li>自訂毒劑與核彈頭跟著存檔、聯機與「⇩ 匯出武器裝備」一起保存。</li></ul>');
