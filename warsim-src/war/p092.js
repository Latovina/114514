/* ===================== 第三方陣營（介面）：設定頁卡片（新增、種類、規模、範圍、與兩軍的關係、地圖上指定位置）、地圖上的第三方與範圍、滑鼠提示、圖層、戰況總覽與請求盟友協助、特效、說明 ===================== */
if(typeof GKEYS!=='undefined')GKEYS.push('tf');
if(typeof APK!=='undefined'&&APK[2]&&APK[2][1])APK[2][1].push(['tf','第三方陣營：警告、轉為敵對']);
var TFGL={pk:'UN',neu:'N',mil:'M',exp:'V'},TFP={on:0,i:-1,prev:null},TFQ=null;
/* 開始頁：戰場卡片加上「第三方陣營」，建立作戰時在地圖中央加入一支（之後在設定頁調整位置與關係） */
if(typeof ST0!=='undefined'&&ST0.tfk===undefined)ST0.tfk='none';
(function(){if(typeof bfCard!=='function')return;var b=bfCard;bfCard=function(){var h=b.apply(this,arguments),k=TFK[ST0.tfk]?ST0.tfk:'none';
  var x='<div class="lw-row"><label title="建立作戰時在地圖中央加入一支第三方（一個營）；之後可在設定頁調整位置、規模與關係">第三方陣營 <select data-c="stsel" data-f="tfk"><option value="none"'+(k==='none'?' selected':'')+'>無</option>'+Object.keys(TFK).map(function(q){return '<option value="'+q+'"'+(q===k?' selected':'')+'>'+esc(TFK[q].n)+'</option>';}).join('')+'</select></label></div>';
  var i=h.lastIndexOf('</div>');return i>=0?h.slice(0,i)+x+h.slice(i):h+x;};})();
(function(){if(typeof newScenario!=='function')return;var b=newScenario;newScenario=function(){var r=b.apply(this,arguments);try{var k=ST0.tfk;if(G&&G.set&&TFK[k]&&G.map){var p=validPos({dom:'land'},G.map.Wm/2,G.map.Hm/2);G.set.tf=[{id:1,k:k,n:'',sz:'bn',rel:TFK[k].rel.slice(),rv:0,x:Math.round(p[0]),y:Math.round(p[1]),r:TFK[k].r}];}}catch(e){}return r;};})();
function tfSetL(){if(!Array.isArray(G.set.tf))G.set.tf=[];return G.set.tf;}
function tfSetSync(){if(!G.mp||typeof mpSetSend!=='function'||!(typeof mpHost==='function'&&mpHost()))return;try{mpSetSend([['tf',JSON.parse(JSON.stringify(G.set.tf||[]))]],G.set);}catch(e){}}
function tfRedraw(){try{if(G&&G.map&&VW.cb&&VW.cw)vDraw(false);}catch(e){}}
function tfMine(){return mySide();}
/* ---------- 設定頁：第三方陣營卡片 ---------- */
function tfLiveTxt(c){var F=G.tf&&tfF(+c.id);if(!F||!G.started)return '';var L=(G.tf.U||[]).filter(function(g){return g.f===F.id&&g.st!=='dead';}),m=0;L.forEach(function(g){m+=g.men;});var me=tfMine(),sd=me===null?SIDES():[me];
  return '<tr><td colspan="5" class="lw-note">目前：'+L.length+' 個連、約 '+fmt(m)+' 人；'+sd.map(function(s){return '與'+esc(G.sides[s].name)+'<b style="color:'+(F.rel[s]==='host'?'#C62828':F.rel[s]==='ally'?'#2E7D32':'inherit')+'">'+TFREL[F.rel[s]]+'</b>'+(F.rel[s]!=='host'&&F.gr[s]>=40?'（不滿）':'');}).join('、')+(F.req?'；正在協助盟友'+(F.req.k==='attack'?'攻擊':'防守')+placeTxt(F.req.x,F.req.y):'')+'</td></tr>';}
function tfCardHtml(){var L=tfSetL(),st=!!(G&&G.started),opt=function(dc,i,f,list,v,dis){return '<select data-c="'+dc+'" data-v="'+i+'"'+(f!==null?' data-f="'+f+'"':'')+(dis?' disabled':'')+'>'+list.map(function(q){return '<option value="'+q[0]+'"'+(String(v)===String(q[0])?' selected':'')+'>'+esc(q[1])+'</option>';}).join('')+'</select>';},
    o='';
  if(!L.length)o+='<div class="lw-note">沒有第三方。按「新增第三方」，在地圖上指定位置，再設定與兩軍的關係。</div>';
  else o+='<table class="lw-tbl lw-tft" style="font-size:12px">'+L.map(function(c,i){var F=G.tf&&tfF(+c.id),dep=st&&!!F,rel=function(s){return opt('tfrel',i,String(s),Object.keys(TFREL).map(function(k){return [k,TFREL[k]];}),F?F.rel[s]:(c.rel||TFK[c.k].rel)[s]);};
      return '<tr><td>'+opt('tfs',i,'k',Object.keys(TFK).map(function(k){return [k,TFK[k].n];}),c.k,dep)+'<br><input type="text" data-c="tfn" data-v="'+i+'" value="'+esc(c.n||'')+'" placeholder="'+esc(TFK[c.k].n)+'" style="width:9em"></td>'+
        '<td>'+opt('tfs',i,'sz',Object.keys(TFSZ).map(function(k){return [k,TFSZ[k][1]];}),c.sz||'bn',dep)+'<br>範圍 '+opt('tfs',i,'r',[2000,3000,4000,5000,7000,10000,15000,20000].map(function(v){return [v,kmTxt(v)];}),c.r||TFK[c.k].r,false)+'</td>'+
        '<td>'+esc(G.sides[0].name)+' '+rel(0)+'<br>'+esc(G.sides[1].name)+' '+rel(1)+'</td><td>'+esc(placeTxt(+c.x,+c.y))+'<br><button type="button" class="lw-btn sm" data-a="tfpick" data-v="'+i+'">在地圖上指定</button></td><td><button type="button" class="lw-btn sm dng" data-a="tfdel" data-v="'+i+'">刪除</button></td></tr>'+tfLiveTxt(c);}).join('')+'</table>';
  o+='<div class="lw-row"><button type="button" class="lw-btn sm" data-a="tfadd">新增第三方</button></div><div class="lw-note">'+Object.keys(TFK).map(function(k){return '<b>'+TFK[k].n+'</b>：'+TFK[k].d;}).join('。<br>')+'。關係可以隨時修改；受到攻擊、領土被侵入或平民被殺害時，第三方也會自己改變關係。'+(st?'種類與規模在開戰時決定。':'')+'</div>';return o;}
setSec('tf','tf',{o:10,cls:'lw-tfcard',wide:1,h:function(){return tfCardHtml();}});
function tfCardRefresh(){setSecRe('tf');tfRedraw();}
ACT.tfadd=function(){var L=tfSetL(),id=L.reduce(function(m,c){return Math.max(m,+c.id||0);},0)+1,MP=G.map,ob=(G.obj||[])[0],x=ob?ob.x:MP?MP.Wm/2:0,y=ob?ob.y:MP?MP.Hm/2:0;if(MP&&MP.lc){var p=validPos({dom:'land'},x+2500,y+2500);x=p[0];y=p[1];}
  L.push({id:id,k:'pk',n:'',sz:'bn',rel:TFK.pk.rel.slice(),rv:0,x:Math.round(x),y:Math.round(y),r:TFK.pk.r});toast('已新增第三方（維和部隊）。可以改種類、關係，並在地圖上指定位置。');tfCardRefresh();};
ACT.tfdel=function(b){var i=+b.getAttribute('data-v'),L=tfSetL(),c=L[i];if(!c)return;if(G.started&&!confirm('讓「'+(c.n||TFK[c.k].n)+'」撤出戰場？'))return;L.splice(i,1);tfCardRefresh();};
CHG.tfs=function(t){var i=+t.getAttribute('data-v'),f=t.getAttribute('data-f'),c=tfSetL()[i];if(!c)return;if(f==='k'){c.k=TFK[t.value]?t.value:'pk';c.rel=TFK[c.k].rel.slice();c.rv=(+c.rv||0)+1;c.r=TFK[c.k].r;}else if(f==='r')c.r=clamp(+t.value||5000,1000,30000);else c[f]=t.value;tfCardRefresh();};
CHG.tfn=function(t){var c=tfSetL()[+t.getAttribute('data-v')];if(c)c.n=String(t.value||'').slice(0,30);};
CHG.tfrel=function(t){var i=+t.getAttribute('data-v'),s=+t.getAttribute('data-f'),c=tfSetL()[i];if(!c||!TFREL[t.value])return;var F=G.tf&&tfF(+c.id);c.rel=(c.rel||TFK[c.k].rel).slice();if(F)c.rel=F.rel.slice();c.rel[s]=t.value;c.rv=(+c.rv||0)+1;
  if(F&&!G.mp){F.rv=c.rv;tfSetRel(F,s,t.value,'協議變更');}toast((c.n||TFK[c.k].n)+'與'+G.sides[s].name+'的關係改為「'+TFREL[t.value]+'」'+(G.started?'。':'（開戰後生效）。'));tfCardRefresh();};
/* 在地圖上指定第三方的位置 */
function tfPickEnd(){if(!TFP.on)return;TFP.on=0;if(UI.onClick===tfPickClick)UI.onClick=TFP.prev;TFP.prev=null;if(VW.mode){VW.mode.hidden=true;try{if(UI.tab==='battle')modeBt();else if(UI.tab==='deploy'&&typeof modeTip==='function')modeTip();}catch(e){}}tfRedraw();}
function tfPickClick(x,y){var c=tfSetL()[TFP.i];if(!c){tfPickEnd();return;}if(isWater(G.map.lc[cellAt(x,y)])){toast('水面上不能部署第三方。');return;}c.x=Math.round(x);c.y=Math.round(y);tfSetSync();toast('「'+(c.n||TFK[c.k].n)+'」的位置：'+placeTxt(x,y));tfPickEnd();}
ACT.tfpick=function(b){if(!G||!G.map||!G.map.lc){toast('先載入想定或產生地圖。');return;}if(G.mp&&!(typeof mpHost==='function'&&mpHost())){toast('只有房主可以設定第三方。');return;}var i=+b.getAttribute('data-v');if(!tfSetL()[i])return;
  var tb=G.started?'battle':'deploy';if(UI.tab!==tb&&PAGES[tb])show(tb);TFP.prev=UI.onClick;TFP.i=i;UI.onClick=tfPickClick;TFP.on=1;if(VW.mode){VW.mode.hidden=false;VW.mode.innerHTML='點選地圖指定第三方的位置<button type="button" data-a="tfpickx">取消</button>';}};
ACT.tfpickx=function(){tfPickEnd();};
(function(){var b=show;show=function(){if(TFP.on){TFP.on=0;TFP.prev=null;}if(TFQ)TFQ=null;return b.apply(this,arguments);};})();
/* ---------- 地圖：範圍與部隊（只畫看得到的；盟友一律看得到） ---------- */
function tfVis(g){var me=tfMine();if(me===null||seeAll()||G.mp)return true;var F=tfF(g.f);return tfRel(F,me)==='ally'||G.t-((g.sn||[])[me]||-1e9)<=150;}
function drawTF(c){if(!G||!G.tf||UI.lay.tf===0)return;var me=tfMine(),m=mpp();c.save();
  (G.tf.F||[]).forEach(function(F){var K=TFK[F.k]||TFK.pk,p=w2s(F.x,F.y);c.globalAlpha=0.4;c.strokeStyle=K.col;c.lineWidth=1.4;c.setLineDash([2,6]);c.beginPath();c.arc(p[0],p[1],F.r/m,0,2*PI);c.stroke();c.setLineDash([]);c.globalAlpha=0.85;
    txtHalo(c,F.n+(me!==null?'（'+TFREL[tfRel(F,me)]+'）':''),p[0],p[1]-F.r/m-6,'11px sans-serif',K.col);});c.globalAlpha=1;
  (G.tf.U||[]).forEach(function(g){if(g.st==='dead'||!tfVis(g))return;var F=tfF(g.f),K=TFK[F?F.k:'pk'],p=w2s(g.x,g.y),rel=me!==null?tfRel(F,me):'neu',w=24,h=15,fr=clamp((g.men+g.veh*8)/Math.max(1,g.men0+g.veh0*8),0,1);
    /* 北約外框依立場：盟友長方形、中立方形、敵對菱形 */var aff=rel==='ally'?'f':rel==='host'?'h':'n',B=frameBox(w,h,'land',aff);framePath(c,p[0],p[1],w,h,'land',aff);c.fillStyle=aff==='n'&&UIP.symCol==='std'?AFFC.n:'rgba(255,255,255,0.92)';c.fill();c.strokeStyle=rel==='host'?'#C62828':K.col;c.lineWidth=rel==='host'?2.2:1.6;framePath(c,p[0],p[1],w,h,'land',aff);c.stroke();
    c.fillStyle=K.col;c.font='bold 9px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(TFGL[F?F.k:'pk']||'?',p[0],p[1]+0.5);c.fillStyle=fr>0.6?'#43A047':fr>0.3?'#FB8C00':'#E53935';c.fillRect(p[0]-w/2,p[1]+B.b+1,w*fr,2.5);
    if(g.st==='rout'){c.fillStyle='#C62828';c.fillText('↘',p[0]+w/2+5,p[1]-h/2);}g._sx=p[0];g._sy=p[1];});c.restore();}
(function(){var b=drawMissions;drawMissions=function(c){try{drawTF(c);}catch(e){if(window.console)console.warn('tf',e);}b(c);};})();
function tfHit(sx,sy){var best=null,bd=14;(G.tf&&G.tf.U||[]).forEach(function(g){if(g.st==='dead'||g._sx===undefined||!tfVis(g))return;var d=Math.hypot(g._sx-sx,g._sy-sy);if(d<bd){bd=d;best=g;}});return best;}
function tfTip(g){var F=tfF(g.f),me=tfMine(),K=TFK[F?F.k:'pk'];return g.n+'\n'+tfNm(F)+'\n'+(me!==null?'與本方：'+TFREL[tfRel(F,me)]+'\n':'與'+G.sides[0].name+TFREL[tfRel(F,0)]+'、與'+G.sides[1].name+TFREL[tfRel(F,1)]+'\n')+'兵力 '+fmt(g.men)+' 人'+(g.veh>=1?'、'+fmt(g.veh)+' 輛':'')+'，士氣 '+fmt(g.mor)+(g.st==='rout'?'（潰散撤退）':'');}
(function(){var b=tipAt;tipAt=function(sx,sy,w){var r=b.apply(this,arguments);try{if(!VW.tip||!G||!G.tf||UI.lay.tf===0)return r;if(!VW.tip.hidden&&hitAt(sx,sy))return r;var g=tfHit(sx,sy);if(!g)return r;
    VW.tip.textContent=tfTip(g);VW.tip.hidden=false;var x=sx+14,y=sy+14;if(x>VW.cw-220)x=sx-230;if(y>VW.ch-100)y=sy-110;VW.tip.style.left=x+'px';VW.tip.style.top=y+'px';}catch(e){}return r;};})();
(function(){var b=lyRender;lyRender=function(){b.apply(this,arguments);try{if(!VW.ly||!G||!G.tf||!(G.tf.F||[]).length||VW.ly.querySelector('[data-ly="tf"]'))return;var s=VW.ly.querySelector('select[data-ly="lvl"]'),l=document.createElement('label');l.innerHTML='<input type="checkbox" data-ly="tf"'+(UI.lay.tf!==0?' checked':'')+'>第三方';if(s)VW.ly.insertBefore(l,s);else VW.ly.appendChild(l);}catch(e){}};})();
/* ---------- 戰況總覽：第三方與請求盟友協助 ---------- */
function tfOverview(){if(!G||!G.started||!G.tf||!(G.tf.F||[]).length)return '';var me=tfMine(),o='';
  G.tf.F.forEach(function(F){var L=(G.tf.U||[]).filter(function(g){return g.f===F.id&&g.st!=='dead';}),n=0;L.forEach(function(g){n+=g.men;});var r=me!==null?tfRel(F,me):null;
    o+='<span>第三方</span><span>'+esc(tfNm(F))+(r?'：與本方<b style="color:'+(r==='host'?'#C62828':r==='ally'?'#2E7D32':'inherit')+'">'+TFREL[r]+'</b>':'：與'+esc(G.sides[0].name)+TFREL[tfRel(F,0)]+'、與'+esc(G.sides[1].name)+TFREL[tfRel(F,1)])+(r==='ally'||me===null&&(F.rel[0]==='ally'||F.rel[1]==='ally')?'，'+L.length+' 個連、約 '+fmt(n)+' 人':'')+
      (r==='ally'?' <button type="button" class="lw-btn sm" data-a="tfreq" data-v="'+F.id+'" data-k="defend">請求防守</button><button type="button" class="lw-btn sm" data-a="tfreq" data-v="'+F.id+'" data-k="attack">請求攻擊</button>':'')+'</span>';});return o?'<div class="lw-kv lw-tfov" style="margin-bottom:6px">'+o+'</div>':'';}
(function(){var b=overview;overview=function(){var o=b();try{var x=tfOverview();if(x){var i=o.indexOf('</h3>');if(i>=0)o=o.slice(0,i+5)+x+o.slice(i+5);}}catch(e){}return o;};})();
ACT.tfreq=function(b){var me=tfMine();if(me===null){toast('請先選擇陣營。');return;}TFQ={f:+b.getAttribute('data-v'),k:b.getAttribute('data-k')};if(VW.mode){VW.mode.hidden=false;VW.mode.innerHTML='點選地圖：請盟友'+(TFQ.k==='attack'?'攻擊':'防守')+'該處<button type="button" data-a="tfreqx">取消</button>';}};
ACT.tfreqx=function(){TFQ=null;modeBt();};
(function(){var b=btClick;btClick=function(x,y,sx,sy,e){if(!TFQ)return b.apply(this,arguments);var Q=TFQ;TFQ=null;var r=tfRequest(tfMine(),Q.f,Q.k,x,y);toast(r&&r.err?r.err:'已請求盟友'+(Q.k==='attack'?'攻擊':'防守')+placeTxt(x,y)+'。');modeBt();btStatus();vDraw(false);};})();
/* ---------- 特效：第三方的射擊 ---------- */
if(typeof FXS!=='undefined'){FXS.tfire=function(e){var T=FX.clk,n=fxLv(1,3);for(var j=0;j<n;j++){var a=wxRnd()*2*PI,r=wxRnd()*60;fxP({k:'tr',x0:e.x0,y0:e.y0,x1:e.x1+Math.cos(a)*r,y1:e.y1+Math.sin(a)*r,t0:T+j*0.2+wxRnd()*0.3,d:0.35,c:e.c||'#E0E0E0',w:1.2,len:0.3,g:0});}};}
/* ---------- 聯機：請求協助由伺服器執行 ---------- */
if(typeof mpWrapFn==='function')tfRequest=mpWrapFn('tfRequest',tfRequest,function(){return {ok:1,pending:1};});
HELP14.push('<h4>第三方陣營</h4><ul><li>設定頁的「第三方陣營」卡片可以加入維和部隊、中立國軍隊、武裝團體或外國志願軍：設定名稱、規模（一個連、營或團）、範圍、位置（在地圖上指定），以及與兩軍的關係（盟友、中立、敵對）。聯機時由房主設定。</li>'+
  Object.keys(TFK).map(function(k){return '<li><b>'+TFK[k].n+'</b>：'+TFK[k].d+'。</li>';}).join('')+
  '<li>中立與盟友的第三方不會被本方部隊射擊；敵對的第三方會與本方部隊互相交火。砲擊、轟炸與核武會波及範圍內的第三方，受害累積到一定程度（或領土被侵入太久、平民被殺害）就先提出抗議，再轉為敵對。攻擊維和部隊或中立國軍隊記為戰爭罪行，國際聲望下降。</li>'+
  '<li>關係可以隨時修改（例如宣戰或停火），修改立即生效。盟友的部隊本方一律看得到；在戰況總覽可以「請求防守」或「請求攻擊」某個地點，盟友會派兵前往。地圖上的第三方以虛線框表示中立、紅框表示敵對，圖層列可以隱藏。</li></ul>');
