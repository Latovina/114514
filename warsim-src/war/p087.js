/* ===================== 喪屍與寄生蟲的介面：開戰時的選項、設定頁、地圖上的屍群與巢穴、滑鼠提示、部隊的感染狀況、特效與音效、圖層、戰報、說明 ===================== */
if(typeof GKEYS!=='undefined')GKEYS.push('zed');
if(typeof APK!=='undefined'&&APK[2]&&APK[2][1])APK[2][1].push(['zed','喪屍與寄生蟲：爆發、屍群逼近、部隊屍變']);
/* ---------- 開戰頁：戰場與社會 → 異變環境 ---------- */
if(typeof ST0!=='undefined'){if(ST0.zed===undefined)ST0.zed='off';if(ST0.zlv===undefined)ST0.zlv='2';if(ST0.zsrc===undefined)ST0.zsrc='town';}
(function(){if(typeof bfCard!=='function')return;var b=bfCard;bfCard=function(){var h=b.apply(this,arguments),S=ST0,sel=function(f,L,lbl,tip){return '<label title="'+esc(tip||'')+'">'+lbl+' <select data-c="stsel" data-f="'+f+'">'+L.map(function(q){return '<option value="'+q[0]+'"'+(String(S[f])===String(q[0])?' selected':'')+'>'+esc(q[1])+'</option>';}).join('')+'</select></label>';};
  var row='<div class="lw-row">'+sel('zed',[['off','無'],['zombie','喪屍'],['parasite','寄生蟲'],['mixed','喪屍與寄生蟲'],['eldritch','不可名狀之物'],['all','全部']],'異變環境','開戰後爆發，屍群或不可名狀之物攻擊雙方部隊與平民（之後可在「設定」調整）')+sel('zlv',[['1','零星'],['2','爆發'],['3','末日']],'嚴重程度')+sel('zsrc',Object.keys(ZSRC).map(function(k){return [k,ZSRC[k]];}),'爆發來源')+'</div>';
  return /<\/div>$/.test(h)?h.replace(/<\/div>$/,row+'</div>'):h+row;};})();
(function(){if(typeof stSet!=='function')return;var b=stSet;stSet=function(S){var o=b.apply(this,arguments);if(S&&S.zed&&S.zed!=='off'&&ZMODE[S.zed])o.zed={on:true,k:S.zed,lv:clamp(+S.zlv||2,1,3),src:ZSRC[S.zsrc]?S.zsrc:'town',rise:true,civ:true,t0:0};return o;};})();
/* ---------- 設定頁：異變環境卡片 ---------- */
function zedSetObj(){if(!G.set.zed||typeof G.set.zed!=='object')G.set.zed=Object.assign({},ZDEF);return G.set.zed;}
function zedStatHtml(){if(!G||!G.started||!G.zed||!G.zed.go||!zedOn())return '';var L=zedList(),n=0,me=UI.side,S=G.zed.st||{},NL=zedNestList().filter(function(N){return N.hp>0;});L.forEach(function(h){n+=h.n;});
  var sd=me>=0&&!seeAll()?[me]:SIDES(),k=0,lo=0,tu=0;sd.forEach(function(s){k+=(S.k||[])[s]||0;lo+=(S.lost||[])[s]||0;tu+=(S.turn||[])[s]||0;});
  return '<div class="lw-note lw-zedst">'+(me>=0&&!seeAll()?'看得到的':'目前')+'屍群 '+L.length+' 群、約 '+fmt(n)+' 隻'+(NL.length?'；已知巢穴與感染源 '+NL.length+' 處':'')+'。'+(sd.length===1?'本方':'雙方')+'已消滅約 '+fmt(k)+' 隻，官兵傷亡約 '+fmt(lo)+' 人'+(tu>=1?'、屍變約 '+fmt(tu)+' 人':'')+'。</div>';}
function zedCardHtml(){var C=zedCfg(),on=zedOn(),opt=function(f,L,v){return '<select data-c="zeds" data-f="'+f+'">'+L.map(function(q){return '<option value="'+q[0]+'"'+(String(v)===String(q[0])?' selected':'')+'>'+esc(q[1])+'</option>';}).join('')+'</select>';};
  return '<div class="lw-opt">'+
    '<span>啟用</span><label title="屍群與不可名狀之物是雙方以外的第三方，攻擊最近的部隊與平民"><input type="checkbox" data-c="zedb" data-f="on"'+(on?' checked':'')+'>喪屍、寄生蟲或不可名狀之物出現，攻擊雙方部隊與平民</label>'+
    '<span>種類</span><label>'+opt('k',[['zombie','喪屍（行屍、奔跑者、巨型變異體）'],['parasite','寄生蟲（寄生宿主、寄生蟲群、孢子體）'],['mixed','喪屍與寄生蟲'],['eldritch','不可名狀之物（無名之物、低語者、蠕影）'],['all','全部']],C.k)+'</label>'+
    '<span>嚴重程度</span><label title="影響最初的數量、巢穴數目與新屍群出現的頻率；爆發與末日會出現奔跑者，末日還有巨型變異體">'+opt('lv',[[1,'零星'],[2,'爆發'],[3,'末日']],C.lv)+'</label>'+
    '<span>爆發來源</span><label>'+opt('src',Object.keys(ZSRC).map(function(k){return [k,ZSRC[k]];}),C.src)+'</label>'+
    '<span>爆發地點</span><label class="lw-zedpts" title="在地圖上點選：爆發前點選的地點會在爆發時一起出現（再點一次取消）；爆發後點選的地點立即出現屍群">'+zedPtsTxt()+' <button type="button" class="lw-btn sm" data-a="zedpick">在地圖上點選</button> <button type="button" class="lw-btn sm" data-a="zedclr">清除</button><br>每處 <input type="number" data-c="zedv" data-f="pn" min="1" max="20000" step="50" value="'+(+((G.set.zed||{}).pn)||300)+'" style="width:6em"> 隻　'+opt('pk',ZPKL,(G.set.zed||{}).pk||'auto')+'</label>'+
    '<span>爆發時間</span><label title="0＝開戰就爆發">開戰後 <input type="number" data-c="zedv" data-f="t0" min="0" max="720" step="1" value="'+C.t0+'" style="width:5em"> 小時</label>'+
    '<span>死者復生</span><label><input type="checkbox" data-c="zedb" data-f="rise"'+(C.rise!==false?' checked':'')+'>戰死的官兵與死去的平民會復生</label>'+
    '<span>平民</span><label><input type="checkbox" data-c="zedb" data-f="civ"'+(C.civ!==false?' checked':'')+'>屍群襲擊平民與難民</label></div>'+zedStatHtml();}
setSec('zed','zed',{o:10,cls:'lw-zedcard',h:function(){return zedCardHtml();}});
function zedRedraw(){try{if(G&&G.map&&VW.cb&&VW.cw)vDraw(false);}catch(e){}}
CHG.zedb=function(t){var z=zedSetObj(),f=t.getAttribute('data-f');z[f]=!!t.checked;if(f==='on')toast(z.on?'已啟用喪屍與寄生蟲作戰環境'+(G.started?'（'+(G.zed&&G.zed.go?'屍群恢復行動':'稍後爆發')+'）。':'，開戰後爆發。'):'已關閉喪屍與寄生蟲作戰環境，地圖上的屍群暫停並隱藏。');zedRedraw();};
CHG.zeds=function(t){var z=zedSetObj(),f=t.getAttribute('data-f');z[f]=f==='lv'?clamp(+t.value||2,1,3):t.value;zedRedraw();};
CHG.zedv=function(t){var z=zedSetObj(),f=t.getAttribute('data-f');z[f]=f==='pn'?clamp(Math.round(+t.value||300),1,20000):clamp(Math.round(+t.value||0),0,720);t.value=z[f];};
/* ---------- 手動指定爆發地點：在地圖上點選（爆發前加入計畫、再點一次取消；爆發後立即出現） ---------- */
var ZPKL=[['auto','依模式混合'],['z','行屍'],['r','奔跑者'],['b','巨型變異體'],['h','寄生宿主'],['s','寄生蟲群'],['p','孢子體'],['w','無名之物'],['q','低語者'],['v','蠕影'],['nest','巢穴（持續放出屍群）'],['rift','裂隙（持續湧出不可名狀之物）']],ZPMAX=60,ZP={on:0,prev:null};
function zedPtsTxt(){var n=G&&G.set&&G.set.zed&&Array.isArray(G.set.zed.pts)?G.set.zed.pts.length:0,live=G&&G.started&&G.zed&&G.zed.go;return live?'已經爆發：點選地圖立即出現':(n?'已指定 '+n+' 處':'未指定');}
function zedPtsSync(){if(!G.mp||typeof mpSetSend!=='function'||!(typeof mpHost==='function'&&mpHost()))return;try{mpSetSend([['zed.on',!!G.set.zed.on],['zed.pts',JSON.parse(JSON.stringify(G.set.zed.pts||[]))]],G.set);}catch(e){}}
function zedPickBanner(){if(!VW.mode)return;VW.mode.hidden=false;var live=G.started&&G.zed&&G.zed.go;VW.mode.innerHTML='☣ '+(live?'點選地圖：該處立即出現屍群':'點選地圖加入爆發地點（再點一次取消）')+'（每處 '+fmt(+(G.set.zed.pn)||300)+' 隻、'+(ZPKL.filter(function(q){return q[0]===(G.set.zed.pk||'auto');})[0]||ZPKL[0])[1]+'）<button type="button" data-a="zedpickx">完成</button>';}
function zedPickEnd(){if(!ZP.on)return;ZP.on=0;if(UI.onClick===zedPickClick)UI.onClick=ZP.prev;ZP.prev=null;if(VW.mode){VW.mode.hidden=true;try{if(UI.tab==='battle')modeBt();else if(UI.tab==='deploy'&&typeof modeTip==='function')modeTip();}catch(e){}}zedRedraw();}
function zedPickClick(x,y){zedPickAt(x,y);}
ACT.zedpick=function(){if(!G||!G.map||!G.map.Wm||!G.map.lc){toast('先載入想定或產生地圖，才能在地圖上點選爆發地點。');return;}if(G.mp&&!(typeof mpHost==='function'&&mpHost())){toast('只有房主可以指定爆發地點。');return;}
  var z=zedSetObj();if(!z.on){z.on=true;toast('已啟用喪屍與寄生蟲作戰環境。');}var tb=G.started?'battle':'deploy';if(UI.tab!==tb&&PAGES[tb])show(tb);ZP.prev=UI.onClick;UI.onClick=zedPickClick;ZP.on=1;zedPickBanner();zedRedraw();};
ACT.zedpickx=function(){zedPickEnd();};
ACT.zedclr=function(){var z=zedSetObj();z.pts=[];zedPtsSync();var c=document.querySelector('.lw-zedpts');if(c&&c.firstChild&&c.firstChild.nodeType===3)c.firstChild.nodeValue=zedPtsTxt()+' ';toast('已清除指定的爆發地點。');zedRedraw();};
(function(){var b=show;show=function(tab){if(ZP.on){ZP.on=0;ZP.prev=null;}return b.apply(this,arguments);};})();
function zedPickAt(x,y){var z=zedSetObj(),MP=G.map;if(isWater(MP.lc[cellAt(x,y)])){toast('水面上不能放置爆發地點。');return;}
  var live=G.started&&G.zed&&G.zed.go,pk=z.pk||'auto',p={x:Math.round(x),y:Math.round(y),n:clamp(Math.round(+z.pn||300),1,20000)};if(pk==='nest'){p.nest=1;if(z.k!=='mixed')p.k=z.k;}else if(ZK[pk])p.k=pk;
  if(live){if(G.mp){if(typeof mpSend==='function')mpSend({t:'rzed',x:p.x,y:p.y,n:p.n,k:p.k||'',nest:!!p.nest});toast('已送出：'+placeTxt(x,y)+(p.nest?'出現巢穴':'爆發'));}else{var m=zedSpawnAt(p);toast(m>0?placeTxt(x,y)+(p.nest?'出現巢穴，':'爆發，')+'約 '+fmt(m)+' 隻':'這裡無法放置。');}zedRedraw();return;}
  var P=(Array.isArray(z.pts)?z.pts:[]).slice(),m2=mpp(),hit=-1;P.forEach(function(q,i){if(hit<0&&Math.hypot((q.x-x)/m2,(q.y-y)/m2)<12)hit=i;});
  if(hit>=0){P.splice(hit,1);toast('已取消這個爆發地點（共 '+P.length+' 處）。');}else{if(P.length>=ZPMAX){toast('最多 '+ZPMAX+' 個爆發地點。');return;}P.push(p);toast('已加入爆發地點：'+placeTxt(x,y)+'（共 '+P.length+' 處）。');}
  z.pts=P;zedPtsSync();zedRedraw();}
/* 計畫中的爆發地點（還沒爆發時才畫） */
function drawZedPts(c){if(!G||!G.set||!G.set.zed||G.replay||!zedOn()||(G.zed&&G.zed.go))return;var P=G.set.zed.pts;if(!Array.isArray(P)||!P.length)return;c.save();c.textAlign='center';
  P.forEach(function(q){if(!zedPtOk(q))return;var p=w2s(q.x,q.y);if(p[0]<-30||p[1]<-30||p[0]>VW.cw+30||p[1]>VW.ch+30)return;var r=q.nest?10:8;c.globalAlpha=0.9;c.setLineDash([3,2]);c.strokeStyle=q.nest?'#4A148C':'#B71C1C';c.lineWidth=2;c.beginPath();c.arc(p[0],p[1],r,0,2*PI);c.stroke();c.setLineDash([]);
    c.fillStyle=q.nest?'rgba(106,27,154,.35)':'rgba(183,28,28,.3)';c.fill();c.fillStyle=q.nest?'#4A148C':'#B71C1C';c.font='bold 11px sans-serif';c.textBaseline='middle';c.fillText('☣',p[0],p[1]+1);c.textBaseline='alphabetic';
    txtHalo(c,(q.nest?'巢穴 ':'')+zedNum(q.n||300)+(q.k&&ZK[q.k]?' '+ZK[q.k].n:''),p[0],p[1]-r-4,'bold 10px sans-serif',q.nest?'#4A148C':'#B71C1C');});c.restore();}

/* ---------- 地圖：屍群（放大時畫出個體）與巢穴 ---------- */
function zedList(){var Z=G&&G.zed;if(!Z||!Z.H||!zedOn())return [];if(G.mp||seeAll())return Z.H.filter(function(h){return h.n>=1;});var me=UI.side;return Z.H.filter(function(h){return h.n>=1&&zedSeen(h,me);});}
function zedNestList(){var Z=G&&G.zed;if(!Z||!Z.N||!zedOn())return [];if(G.mp||seeAll())return Z.N;var me=UI.side;return Z.N.filter(function(N){return N.sn&&N.sn[me];});}
function zedNum(n){return n>=10000?fx(n/1000,0)+'k':n>=1000?fx(n/1000,1)+'k':String(Math.round(n));}
var ZSTN={wan:'四處遊蕩',hunt:'追逐部隊',fight:'與部隊交戰中',feed:'襲擊平民'};
function drawZed(c){if(!G||!G.zed||G.replay||UI.lay.zed===0||!zedOn())return;var L=zedList(),NL=zedNestList();if(!L.length&&!NL.length)return;var m=mpp(),t=(typeof performance!=='undefined'?performance.now():Date.now())/1000;c.save();
  NL.forEach(function(N){var p=w2s(N.x,N.y);if(p[0]<-40||p[1]<-40||p[0]>VW.cw+40||p[1]>VW.ch+40)return;var dead=N.hp<=0,r=Math.max(7,Math.min(16,220/m));
    if(N.dem){zedRift(c,N,p,r,dead,t);return;}
    c.globalAlpha=dead?0.45:0.95;c.fillStyle=dead?'#5D4037':(N.par?'#6A1B9A':'#33691E');c.strokeStyle='#000';c.lineWidth=1.2;c.beginPath();
    for(var i=0;i<16;i++){var a=i/16*2*PI+(dead?0:Math.sin(t*0.8)*0.05),rr=i%2?r*0.62:r;if(i)c.lineTo(p[0]+Math.cos(a)*rr,p[1]+Math.sin(a)*rr);else c.moveTo(p[0]+Math.cos(a)*rr,p[1]+Math.sin(a)*rr);}c.closePath();c.fill();c.stroke();
    c.fillStyle=dead?'#9E9E9E':'#FFEB3B';c.beginPath();c.arc(p[0],p[1],r*0.28,0,2*PI);c.fill();
    if(dead){c.strokeStyle='#212121';c.lineWidth=2;c.beginPath();c.moveTo(p[0]-r*0.8,p[1]-r*0.8);c.lineTo(p[0]+r*0.8,p[1]+r*0.8);c.moveTo(p[0]+r*0.8,p[1]-r*0.8);c.lineTo(p[0]-r*0.8,p[1]+r*0.8);c.stroke();}
    else if(N.hp0){var f=clamp(N.hp/N.hp0,0,1);c.globalAlpha=0.9;c.fillStyle='rgba(0,0,0,.55)';c.fillRect(p[0]-r,p[1]+r+3,2*r,3);c.fillStyle=f>0.5?'#7CB342':f>0.25?'#FFB300':'#E53935';c.fillRect(p[0]-r,p[1]+r+3,2*r*f,3);}
    c.globalAlpha=1;if(VW.s>1)txtHalo(c,zedNestN(N)+(dead?'（已摧毀）':''),p[0],p[1]-r-5,'bold 10px sans-serif',dead?'#616161':(N.par?'#4A148C':'#1B5E20'));});
  c.textAlign='center';
  L.forEach(function(h){var p=w2s(h.x,h.y),R=zedR(h)/m,rr=Math.max(4,R);if(p[0]<-rr-40||p[1]<-rr-40||p[0]>VW.cw+rr+40||p[1]>VW.ch+rr+40)return;var K=ZK[h.k]||ZK.z,fight=h.st==='fight';if(K.dem){zedDemDraw(c,h,p,R,rr,K,t,fight);return;}
    c.globalAlpha=0.28;c.fillStyle=K.c;c.beginPath();c.arc(p[0],p[1],rr,0,2*PI);c.fill();c.globalAlpha=0.85;c.strokeStyle=fight?'#B71C1C':'rgba(40,30,20,.75)';c.lineWidth=fight?2:1;if(h.st==='wan')c.setLineDash([3,3]);c.stroke();c.setLineDash([]);
    if(R>=6){/* 放大時畫出個體：散布位置固定（依編號），緩慢晃動 */var n=Math.min(Math.round(h.n),h.k==='s'?90:60),sd=(h.id*9301+49297)%2147483647||1,sz=h.k==='b'?3.5:h.k==='s'?1.4:2;c.fillStyle=K.c;c.globalAlpha=0.95;
      for(var i=0;i<n;i++){sd=sd*16807%2147483647;var a=sd/2147483647*2*PI;sd=sd*16807%2147483647;var d=Math.sqrt(sd/2147483647)*R*0.92,wob=Math.sin(t*1.7+i)*Math.min(2,R*0.04),x=p[0]+Math.cos(a)*d+wob,y=p[1]+Math.sin(a)*d;c.fillRect(x-sz/2,y-sz/2,sz,sz);}
      c.fillStyle='rgba(30,20,10,.85)';for(var j=0;j<Math.min(n,12);j++){sd=sd*16807%2147483647;var a2=sd/2147483647*2*PI;sd=sd*16807%2147483647;var d2=Math.sqrt(sd/2147483647)*R*0.9;c.fillRect(p[0]+Math.cos(a2)*d2-0.5,p[1]+Math.sin(a2)*d2-0.5,1,1);}}
    else{c.fillStyle='#3E2723';c.globalAlpha=0.9;c.beginPath();c.arc(p[0],p[1],2,0,2*PI);c.fill();}
    if((h.st==='hunt'||fight||h.st==='feed')&&h.hd!==undefined){var L2=Math.min(14,rr*0.5+8);c.globalAlpha=0.85;c.strokeStyle='#B71C1C';c.lineWidth=1.6;c.beginPath();c.moveTo(p[0]+Math.cos(h.hd)*rr,p[1]+Math.sin(h.hd)*rr);c.lineTo(p[0]+Math.cos(h.hd)*(rr+L2),p[1]+Math.sin(h.hd)*(rr+L2));c.stroke();}
    if(VW.s>0.5||h.n>=500){c.globalAlpha=1;txtHalo(c,(VW.s>2.5?K.n+' ':'')+zedNum(h.n),p[0],p[1]-Math.max(rr,6)-4,'bold 10px sans-serif','#3E2723');}});
  c.restore();}
/* 裂隙：一道鋸齒狀的暗色裂口，邊緣微光；封閉（摧毀）後只剩一道灰線 */
function zedRift(c,N,p,r,dead,t){c.save();c.globalAlpha=dead?0.5:0.95;var hgt=r*1.6,wid=r*0.55,P=[];for(var i=0;i<=8;i++){var q=i/8,yy=p[1]-hgt/2+hgt*q,ww=Math.sin(q*PI)*wid*(dead?0.15:1);P.push([p[0]+ww*(i%2?1:0.6)+(dead?0:Math.sin(t*1.1+i)*0.6),yy]);}
  for(var j=8;j>=0;j--){var q2=j/8,yy2=p[1]-hgt/2+hgt*q2,ww2=Math.sin(q2*PI)*wid*(dead?0.15:1);P.push([p[0]-ww2*(j%2?0.6:1),yy2]);}
  if(!dead){c.shadowColor='rgba(156,39,176,.8)';c.shadowBlur=8;}c.fillStyle=dead?'#616161':'#12001C';c.strokeStyle=dead?'#9E9E9E':'#7B1FA2';c.lineWidth=1;c.beginPath();P.forEach(function(q,k){if(k)c.lineTo(q[0],q[1]);else c.moveTo(q[0],q[1]);});c.closePath();c.fill();c.shadowBlur=0;c.stroke();
  if(!dead&&N.hp0){var f=clamp(N.hp/N.hp0,0,1);c.globalAlpha=0.9;c.fillStyle='rgba(0,0,0,.55)';c.fillRect(p[0]-r,p[1]+hgt/2+3,2*r,3);c.fillStyle=f>0.5?'#7CB342':f>0.25?'#FFB300':'#E53935';c.fillRect(p[0]-r,p[1]+hgt/2+3,2*r*f,3);}
  c.globalAlpha=1;if(VW.s>1)txtHalo(c,zedNestN(N)+(dead?'（已封閉）':''),p[0],p[1]-hgt/2-5,'bold 10px sans-serif',dead?'#616161':'#4A148C');c.restore();}
/* 不可名狀之物：放大時畫出個體；固定的散布位置（依編號），緩慢蠕動或閃爍 */
function zedDemDraw(c,h,p,R,rr,K,t,fight){var sd=(h.id*9301+49297)%2147483647||1,nx=function(){sd=sd*16807%2147483647;return sd/2147483647;};c.save();
  c.globalAlpha=h.k==='q'?0.12:0.22;c.fillStyle=K.c;c.beginPath();c.arc(p[0],p[1],rr,0,2*PI);c.fill();c.globalAlpha=0.7;c.strokeStyle=fight?'#B71C1C':'rgba(60,20,80,.7)';c.lineWidth=fight?1.6:0.8;if(h.st==='wan')c.setLineDash([2,4]);c.stroke();c.setLineDash([]);
  if(h.k==='w'){var n=Math.min(4,Math.max(1,Math.round(h.n)));for(var i=0;i<n;i++){var a=nx()*2*PI,d=n>1?Math.sqrt(nx())*R*0.5:0,cx=p[0]+Math.cos(a)*d,cy=p[1]+Math.sin(a)*d,r0=Math.max(4,Math.min(22,R*0.35));
      c.globalAlpha=0.92;c.fillStyle='#14051C';c.beginPath();for(var k=0;k<=18;k++){var b=k/18*2*PI,rr2=r0*(1+0.22*Math.sin(t*1.3+k*1.7+i)+0.12*Math.sin(t*2.1+k*3.1));if(k)c.lineTo(cx+Math.cos(b)*rr2,cy+Math.sin(b)*rr2);else c.moveTo(cx+Math.cos(b)*rr2,cy+Math.sin(b)*rr2);}c.closePath();c.fill();
      c.strokeStyle='rgba(20,5,28,.85)';c.lineWidth=Math.max(0.8,r0*0.12);for(var m=0;m<7;m++){var b2=m/7*2*PI+Math.sin(t*0.7+m)*0.3,L=r0*(1.5+0.4*Math.sin(t*1.7+m*2));c.beginPath();c.moveTo(cx+Math.cos(b2)*r0*0.8,cy+Math.sin(b2)*r0*0.8);c.quadraticCurveTo(cx+Math.cos(b2+0.5)*L*0.8,cy+Math.sin(b2+0.5)*L*0.8,cx+Math.cos(b2+0.15*Math.sin(t+m))*L,cy+Math.sin(b2+0.15*Math.sin(t+m))*L);c.stroke();}
      c.globalAlpha=0.35+0.2*Math.sin(t*2+i);c.fillStyle='#6A1B9A';c.beginPath();c.arc(cx,cy,r0*0.35,0,2*PI);c.fill();}}
  else if(h.k==='q'){var nq=Math.min(24,Math.max(2,Math.round(h.n)));c.strokeStyle='#E1D5F5';c.lineCap='round';for(var j=0;j<nq;j++){var a2=nx()*2*PI,d2=Math.sqrt(nx())*Math.max(R,6)*0.9,fx=p[0]+Math.cos(a2)*d2,fy=p[1]+Math.sin(a2)*d2,ph=nx()*6.3;c.globalAlpha=0.15+0.45*Math.max(0,Math.sin(t*1.9+ph));c.lineWidth=1.4;c.beginPath();c.moveTo(fx,fy+3.5);c.lineTo(fx,fy-3.5);c.stroke();c.beginPath();c.arc(fx,fy-4.5,1.3,0,2*PI);c.stroke();}}
  else{var nv=Math.min(70,Math.max(3,Math.round(h.n)));c.strokeStyle='#0D1036';c.lineCap='round';c.lineWidth=1.4;var hd=h.hd||0;for(var v=0;v<nv;v++){var a3=nx()*2*PI,d3=Math.sqrt(nx())*Math.max(R,5)*0.92,vx=p[0]+Math.cos(a3)*d3+Math.sin(t*2.3+v)*1.2,vy=p[1]+Math.sin(a3)*d3,l=3+2*nx();c.globalAlpha=0.55+0.35*nx();c.beginPath();c.moveTo(vx-Math.cos(hd)*l,vy-Math.sin(hd)*l);c.lineTo(vx+Math.cos(hd)*l*0.3,vy+Math.sin(hd)*l*0.3);c.stroke();}}
  if((h.st==='hunt'||fight||h.st==='feed')&&h.hd!==undefined){var L2=Math.min(14,rr*0.5+8);c.globalAlpha=0.85;c.strokeStyle='#4A148C';c.lineWidth=1.2;c.beginPath();c.moveTo(p[0]+Math.cos(h.hd)*rr,p[1]+Math.sin(h.hd)*rr);c.lineTo(p[0]+Math.cos(h.hd)*(rr+L2),p[1]+Math.sin(h.hd)*(rr+L2));c.stroke();}
  if(VW.s>0.5||h.k==='w'){c.globalAlpha=1;c.textAlign='center';txtHalo(c,(VW.s>2.5||h.k==='w'?K.n+' ':'')+zedNum(h.n),p[0],p[1]-Math.max(rr,8)-4,'bold 10px sans-serif','#311B92');}c.restore();}
(function(){var b=drawMissions;drawMissions=function(c){try{drawZedPts(c);drawZed(c);}catch(e){if(window.console)console.warn('zed',e);}b(c);};})();
/* 暫停時放大看，屍群的個體仍緩慢晃動（每 0.4 秒重畫上層） */
setInterval(function(){try{if(!UI.run&&G&&G.started&&G.zed&&zedOn()&&UI.lay.zed!==0&&VW.cb&&VW.cw&&!document.hidden&&VW.s>1.5&&zedList().length)drawTop();}catch(e){}},400);
/* ---------- 滑鼠提示 ---------- */
function zedHit(sx,sy){var m=mpp(),best=null,bd=1e9;zedNestList().forEach(function(N){var p=w2s(N.x,N.y),d=Math.hypot(p[0]-sx,p[1]-sy);if(d<14&&d<bd){bd=d;best={N:N};}});
  zedList().forEach(function(h){var p=w2s(h.x,h.y),R=Math.max(6,zedR(h)/m),d=Math.hypot(p[0]-sx,p[1]-sy);if(d<=R+4&&d<bd){bd=d;best={h:h};}});return best;}
var ZKT={w:'極少、極耐打，輕兵器幾乎無效，需要反裝甲武器或長時間的砲擊；會破壞車輛。三公里外看見它的官兵就會驚恐',q:'只有在三百公尺內才看得到；看不見也聽得到它們的低語，附近的官兵驚恐、精神崩潰',v:'成群、移動快，夜裡活躍；白天潛伏、行動遲緩',z:'動作緩慢、數量多；剛開過火的部隊，兩倍距離外的屍群也聽得到',r:'跑得快、近戰兇猛，夜裡更活躍',b:'數量少但非常耐打，輕兵器效果差，需要反裝甲武器或砲兵；會破壞車輛',h:'被寄生蟲控制的宿主，比行屍快、耐打',s:'成群的小型寄生蟲，輕兵器不容易打中，非常怕火；感染力強',p:'被打死時爆開散播孢子，感染附近的部隊與居民；最好在遠處用砲兵消滅，或提高防護等級'};
function zedTip(h){var K=ZK[h.k]||ZK.z;return zedNm(h)+'：約 '+fmt(h.n)+zedQ(h)+'\n'+(ZSTN[h.st]||'')+'・移動約每小時 '+fx(K.sp*3.6,1)+' 公里\n'+(ZKT[h.k]||'');}
function zedNestTip(N){return zedNestN(N)+'：'+N.nm+(N.hp<=0?'（已摧毀）':'\n完整度 '+fmt(Math.max(0,N.hp))+'／'+fmt(N.hp0)+(N.dem?'\n每隔一段時間湧出不可名狀之物，直到被封閉（摧毀）':'\n每隔一段時間放出新的屍群，直到被摧毀')+'\n部隊進入 400 公尺內會攻擊它，砲兵也可以轟擊');}
(function(){var b=tipAt;tipAt=function(sx,sy,w){var r=b.apply(this,arguments);try{if(!VW.tip||!G||!G.zed||!zedOn()||UI.lay.zed===0)return r;if(!VW.tip.hidden&&hitAt(sx,sy))return r;var q=zedHit(sx,sy);if(!q)return r;
    VW.tip.textContent=q.N?zedNestTip(q.N):zedTip(q.h);VW.tip.hidden=false;var x=sx+14,y=sy+14;if(x>VW.cw-220)x=sx-230;if(y>VW.ch-90)y=sy-100;VW.tip.style.left=x+'px';VW.tip.style.top=y+'px';}catch(e){}return r;};})();
/* ---------- 圖層 ---------- */
(function(){var b=lyRender;lyRender=function(){b.apply(this,arguments);try{if(!VW.ly||!G||!zedOn()||VW.ly.querySelector('[data-ly="zed"]'))return;var s=VW.ly.querySelector('select[data-ly="lvl"]'),l=document.createElement('label');l.innerHTML='<input type="checkbox" data-ly="zed"'+(UI.lay.zed!==0?' checked':'')+'>屍群';if(s)VW.ly.insertBefore(l,s);else VW.ly.appendChild(l);}catch(e){}};})();
/* ---------- 部隊狀態：被咬傷、等待屍變的人數，擊倒屍群的數量 ---------- */
(function(){var b=btStatus;btStatus=function(){b.apply(this,arguments);try{if(!G||!zedOn()||UI.selX||UI.selC||UI.selB||!UI.sel||UI.sel.length!==1)return;var u=uById(UI.sel[0]),el=btEl('bst');if(!u||!el||!isLeaf(u))return;if(UI.side>=0&&u.side!==UI.side&&!seeAll())return;
  var t='';if(u.zi>=0.5){var par=u.zik==='p',inc=par?3600:7200,left=Math.max(0,(u.ziT||G.t)+inc*0.5-G.t);t+='被'+(par?'寄生':'咬傷')+'約 '+fmt(u.zi)+' 人'+(left>0?'，約 '+durTxt(left)+'後開始屍變':'，正在陸續屍變')+'；醫療補給可以救治'+(par?'大部分':'一部分（截肢）');}
  if(u.zk>=1)t+=(t?'<br>':'')+'已擊倒屍群約 '+fmt(u.zk)+' 隻';if(t)el.insertAdjacentHTML('beforeend','<div class="lw-note lw-zedu" style="border-left:3px solid #6D4C41;padding-left:6px;margin-top:4px">'+t+'</div>');}catch(e){}};})();
/* ---------- 特效：被咬的血花、孢子雲 ---------- */
if(typeof FXS!=='undefined'){FXS.zbite=function(e){var T=FX.clk,n=fxLv(2,4);for(var j=0;j<n;j++){var a=wxRnd()*2*PI,r=30+wxRnd()*70;fxP({k:'fl',x:e.x1+Math.cos(a)*r,y:e.y1+Math.sin(a)*r,t0:T+wxRnd()*0.7,d:0.2,r:2.2,c:j%2?'#B71C1C':'#7F0000'});}};
  FXS.zspore=function(e){var T=FX.clk,R=Math.max(80,e.r||200);for(var j=0;j<fxLv(1,3);j++)fxP({k:'sm',x:e.x1+(wxRnd()-0.5)*R*0.6,y:e.y1+(wxRnd()-0.5)*R*0.6,t0:T+j*0.15,d:6+wxRnd()*3,r0:R*0.2,r1:R,p0:3,p1:10,a:0.42,c:'205,190,70'});};}
/* ---------- 音效：低沉的呻吟與零星的嘶吼、孢子爆開 ---------- */
if(typeof SNDR!=='undefined'){SNDR.zbite=[1.5,2];SNDR.zspore=[2,2];}
function sndZedMoan(t,f0,g0,pan){var ac=SND.ac,src=ac.createBufferSource();src.buffer=SND.noise;var f=ac.createBiquadFilter();f.type='bandpass';f.Q.value=6;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f0*0.6,t+1.4);var g=ac.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(Math.max(0.0002,g0),t+0.35);g.gain.exponentialRampToValueAtTime(0.0001,t+1.6);src.connect(f);f.connect(g);sndPan(g,pan);src.start(t,wxRnd()*1.5);src.stop(t+1.7);sndVoice(src);}
function sndZed(e){var ac=SND.ac;if(!ac||ac.state!=='running'||!SND.noise)return;var P=sndAt(e.x1,e.y1,false);if(P.g<0.03)return;var t=ac.currentTime+0.02;
  if(e.k==='zspore'){if(!sndTok('zspore'))return;sndNoise(t,'lowpass',380,1.2,P.g*0.6,0.005,0.35,P.pan);sndNoise(t+0.04,'bandpass',1400,3,P.g*0.25,0.01,0.5,P.pan);return;}
  if(!sndTok('zbite'))return;sndZedMoan(t,260+wxRnd()*140,P.g*0.45,P.pan);if(wxRnd()<0.35)sndTone(t+0.2+wxRnd()*0.4,'sawtooth',520+wxRnd()*200,260,0.5,P.g*0.06,0.05,0.5,P.pan);}
(function(){if(typeof sndEv!=='function')return;var b=sndEv;sndEv=function(e){if(e&&(e.k==='zbite'||e.k==='zspore')){try{sndZed(e);}catch(x){}return;}return b.apply(this,arguments);};})();
/* ---------- 戰報：異變環境 ---------- */
function zedRepHtml(){var S=G.zed.st,C=zedCfg(),sides=SIDES().filter(function(s){return UI.side<0||s===UI.side||G.over||!G.set.fog;});if(!sides.length)return '';
  var o='<div class="lw-card lw-zedrep"><h3>異變環境<small>'+esc(ZMODE[C.k])+'・'+ZLV[C.lv].n+'</small></h3><table class="lw-tbl"><tr><th></th><th class="n">消滅屍群</th><th class="n">官兵傷亡</th><th class="n">屍變</th><th class="n">摧毀巢穴</th></tr>';
  sides.forEach(function(s){o+='<tr><td style="color:'+G.sides[s].color+'">'+esc(G.sides[s].name)+'</td><td class="n">'+fmt((S.k||[])[s]||0)+'</td><td class="n">'+fmt((S.lost||[])[s]||0)+'</td><td class="n">'+fmt((S.turn||[])[s]||0)+'</td><td class="n">'+fmt((S.nk||[])[s]||0)+'</td></tr>';});
  return o+'</table><div class="lw-note">累計出現約 '+fmt(S.born||0)+' 隻（其中由死者復生約 '+fmt(S.rise||0)+' 隻），全部被消滅約 '+fmt(S.kz||0)+' 隻；平民受害約 '+fmt(S.civ||0)+' 人；醫療救治被咬傷或寄生的官兵約 '+fmt(S.cure||0)+' 人。</div></div>';}
(function(){var b=PAGES.rep;PAGES.rep=function(host){b.apply(this,arguments);try{var main=host.querySelector('.lw-main');if(!main||!G||!G.started||!G.zed||!G.zed.st||!G.zed.go)return;var d=document.createElement('div');d.innerHTML=zedRepHtml();if(d.firstChild)main.appendChild(d.firstChild);}catch(e){if(window.console)console.warn('zed',e);}};})();
/* ---------- 說明 ---------- */
HELP14.push('<h4>異變環境：喪屍與寄生蟲</h4><ul>'+
  '<li>在開戰頁「戰場與社會」或「設定」頁的<b>異變環境</b>卡片啟用。可選喪屍、寄生蟲或兩者都有；嚴重程度分零星、爆發、末日；爆發來源可以是市鎮（居民先被感染）、巢穴與感染源（遠離部隊的林地、廢墟或工業區）、從地圖邊緣一波波湧入，或以上全部；也可以設定開戰後幾小時才爆發。</li>'+
  '<li><b>手動指定爆發地點</b>：在卡片上設定每處的數量與種類（或設為巢穴），按「在地圖上點選」後點選地圖。爆發前點選的地點會在爆發時一起出現，再點一次可以取消；爆發來源選「只在手動指定的地點」時只在這些地點爆發。已經爆發後點選的地點會立即出現屍群或巢穴。線上對戰由房主在房間或作戰中的「設定」調整，作戰中的點選也只有房主能用。</li>'+
  '<li>屍群是雙方以外的<b>第三方</b>：追逐偵測距離內最近的部隊（剛開過火的部隊，兩倍距離外的屍群也聽得到），沒有部隊時襲擊平民與難民，再沒有就往市鎮或四處遊蕩。屍群不會游泳，只能走橋過河。</li>'+
  '<li>種類：<b>行屍</b>慢而多；<b>奔跑者</b>快而兇猛（爆發與末日）；<b>巨型變異體</b>少量但耐打，輕兵器效果差、會破壞車輛（末日）；<b>寄生宿主</b>比行屍快；<b>寄生蟲群</b>不容易打中、非常怕火；<b>孢子體</b>被打死時爆開，感染附近的部隊與居民。</li>'+
  '<li>部隊會<b>自動向射程內看得到的屍群開火</b>（依交戰規則：「不開火」不打、「還擊」只打靠近或正在攻擊的屍群）；正在打敵軍的部隊只分一半火力。砲兵的火力支援（含直屬砲兵的自動支援）在沒有敵軍目標時會轟擊看得到、靠近友軍的屍群與已發現的巢穴；地毯式轟炸、核武與野火也會殺傷屍群。</li>'+
  '<li>與屍群<b>短兵相接</b>的部隊會傷亡、士氣下降，掩蔽、工事與裝甲可以減輕；部分官兵被咬傷或寄生，經過潛伏期（喪屍病毒約兩小時、寄生蟲約一小時）過半後陸續<b>屍變</b>，在部隊中出現新的屍群。部隊的<b>醫療補給</b>可以救治：寄生蟲大多能治好，喪屍病毒只能截肢，救回的人成為傷員。選取部隊時狀態面板會顯示被咬傷的人數與屍變時間。</li>'+
  '<li>開啟「死者復生」時，戰死的官兵（核爆與野火除外）與死去的平民在二、三十分鐘後復生；被屍群咬死的居民更快。<b>巢穴與感染源</b>會不斷放出新的屍群，直到被摧毀：部隊進入 400 公尺內會攻擊它，砲兵也可以轟擊。</li>'+
  '<li>地圖上的屍群以半透明的色塊與數量表示（虛線＝遊蕩，紅框＝交戰中，紅色短線＝前進方向），放大時畫出個體；圖層選單可以隱藏。開啟戰爭迷霧時只看得到本方部隊觀測得到的屍群（大群看得更遠）。自動暫停可以設定在爆發、屍群逼近與部隊屍變時暫停。戰報的「異變環境」卡片統計雙方消滅的數量、傷亡與屍變。</li></ul>');
