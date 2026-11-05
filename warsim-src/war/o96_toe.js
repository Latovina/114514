/* ===================== 物資與裝備（介面三）：編制裝備（單位與類型） =====================
   人員、武器（單兵與班組）、載具（依型號：泛用的車可以換成任何合適的型號，也可以加入額外的車與無人機）、支援裝備、馬匹、攜行物資與伙食；
   空中與海上部隊換機型、艦型。即時顯示與標準編制相比的火力、防護、機動、補給與造價。開戰前立即換裝，作戰中等撤到後方休整。 */
var TOE={mode:'u',uid:0,tk:'',D:null,key:''};
function toeTgt(){if(TOE.mode==='t')return typeOf(TOE.tk);return uById(TOE.uid);}
function toeOpen(u){if(!u)return;TOE.mode='u';TOE.uid=u.id;TOE.D=null;armoryDlg('toe');}
function toeOpenT(k){TOE.mode='t';TOE.tk=k;TOE.D=null;armoryDlg('toe');}
ACT.toeopen=function(b){toeOpen(uById(+b.getAttribute('data-v')));};ACT.toeopent=function(b){toeOpenT(b.getAttribute('data-v'));};
/* 編輯中的編制：{w,v:[{k,n,o}],e,h,rk,s} */
function toeDraft(){var key=TOE.mode+'|'+(TOE.mode==='u'?TOE.uid:TOE.tk);if(TOE.D&&TOE.key===key)return TOE.D;TOE.key=key;var T;
  if(TOE.mode==='u'){var u=uById(TOE.uid);if(!u||!isLeaf(u))return null;var V=toeView(u),N=!u.toe&&u.vmNext;T={w:clone(V.w||[]),v:V.v.map(function(x){var o=clone(x.o||{}),o0=clone(o);/* 待休整時換裝：編輯的是換裝後的型號 */if(N&&x.p){o={};if(N.m){o.m=N.m;['ad','am','L'].forEach(function(k){if(N[k])o[k]=clone(N[k]);});}}return {k:x.k,n:x.n,o:o,o0:o0,p:!!x.p};}),e:clone(V.e||[]),h:V.h||0,rk:u.toe&&u.toe.rk?clone(u.toe.rk):null,s:u.toe&&u.toe.s?clone(u.toe.s):{}};}
  else{var t=typeOf(TOE.tk);if(!t)return null;var X=clone(typeToe(t));T={w:X.w||[],v:(X.v||[]).map(function(x){return {k:x[0],n:x[1],o:x[2]||{}};}),e:X.e||[],h:X.h||0,rk:X.rk||null,s:X.s||{}};}
  TOE.D=T;return T;}
function toeOut(T){return {w:T.w,v:T.v.map(function(x){var o={};for(var k in x.o)if(x.o[k]!==undefined&&x.o[k]!==null&&x.o[k]!=='')o[k]=x.o[k];return Object.keys(o).length?[x.k,x.n,o]:[x.k,x.n];}),e:T.e,h:T.h,rk:T.rk||undefined,s:T.s&&Object.keys(T.s).length?T.s:undefined};}
/* 試算：用假想的單位算出編制改動後的數值 */
function toeTmp(T,useToe){var u=TOE.mode==='u'?uById(TOE.uid):null,t=TOE.mode==='t'?typeOf(TOE.tk):null,mix=u?clone(typesOfU(u)):[[t.k,1]],s=mixStats(mix);
  var o={id:-77,side:u?u.side:OB&&OB.side!==undefined?OB.side:0,mix:mix,men0:s.men,veh0:s.veh,men:s.men,veh:s.veh,ammo:100,p:-1,kids:[],ech:u&&u.ech!==undefined?u.ech:1,st:'ok',x:0,y:0};if(u&&u.ration)o.ration=u.ration;
  if(useToe&&T){o.toe=toeClean(toeOut(T));if(!o.toe)delete o.toe;}if(u&&u.vm&&!useToe)o.vm=clone(u.vm);try{logInit(o);}catch(e){}return o;}
function toePrevHtml(T){var a=toeTmp(T,true),b=toeTmp(null,false);if(!a.lg||!b.lg)return '';var fa=WF(a),fb=WF(b),sa=ST(a),sb=ST(b),ua=unitUsd(a),ub=unitUsd(b),pa=fpX(a).t,pb=fpX(b).t,L=a.lg,K=b.lg;
  var row=function(n,x,y,f){var d=y?x/y:1;return '<tr><td>'+n+'</td><td class="n">'+f(y)+'</td><td class="n">'+f(x)+'</td><td class="n" style="color:'+(Math.abs(d-1)<0.02?'inherit':d>1?'#2e7d32':'#b3261e')+'">'+(y?(d>=1?'+':'')+pct((d-1)*100):'—')+'</td></tr>';};
  var f2=function(v){return fx(v,2);},f1=function(v){return fx(v,1);},fm=function(v){return fmt(v);};
  return '<h4 style="margin:10px 0 4px;font-size:13px">與標準編制相比</h4><table class="lw-tbl"><tr><th></th><th class="n">標準</th><th class="n">這份編制</th><th class="n">差異</th></tr>'+
    row('對人火力（倍率）',fa.p+(fa.pAdd||0),fb.p+(fb.pAdd||0),f2)+row('對裝甲火力（倍率）',fa.a+(fa.aAdd||0),fb.a+(fb.aAdd||0),f2)+(sa.arm||sb.arm?row('裝甲等級',sa.arm,sb.arm,f1):'')+(sb.vx?row('越野速度（km/h）',sa.vx,sb.vx,f1):'')+
    row('一個彈藥基數（公斤）',L.uof*L.basic,K.uof*K.basic,fm)+row('油箱（公升）',L.fuelCap,K.fuelCap,fm)+row('每日口糧（公斤）',L.dayKg,K.dayKg,fm)+row('造價',ua.t,ub.t,function(v){return amoney(v);})+row('部隊點數倍率',pa,pb,f2)+'</table>';}

/* ---------- 編制分頁 ---------- */
function toeTgtHtml(){var u=TOE.mode==='u'?uById(TOE.uid):null,me=typeof mySide==='function'?mySide():null,o='<div class="lw-row" style="flex-wrap:wrap"><button type="button" class="lw-btn sm'+(TOE.mode==='u'?' pri':'')+'" data-a="temode" data-v="u">單位</button><button type="button" class="lw-btn sm'+(TOE.mode==='t'?' pri':'')+'" data-a="temode" data-v="t">單位類型（整局）</button>';
  if(TOE.mode==='u'){var L=G.units.filter(function(q){return isLeaf(q)&&q.st!=='dead'&&(me===null||me===undefined||me<0||q.side===me);}).slice(0,600);o+='<select data-c="teu" style="max-width:24em"><option value="">（選擇單位）</option>'+L.map(function(q){return '<option value="'+q.id+'"'+(u&&q.id===u.id?' selected':'')+'>'+esc(uName(q))+'（'+esc((G.sides[q.side]||{}).name||'')+'）</option>';}).join('')+'</select>';
    if(u)o+='<button type="button" class="lw-btn sm" data-a="toeopent" data-v="'+esc(typesOfU(u)[0][0])+'">改這個類型的編制</button>';}
  else{var ks={};G.units.forEach(function(q){if(isLeaf(q))typesOfU(q).forEach(function(m){ks[m[0]]=1;});});Object.keys(G.types||{}).forEach(function(k){ks[k]=1;});if(TOE.tk)ks[TOE.tk]=1;
    o+='<select data-c="tet" style="max-width:24em"><option value="">（選擇類型）</option>'+Object.keys(ks).map(function(k){var t=typeOf(k);return t?'<option value="'+esc(k)+'"'+(k===TOE.tk?' selected':'')+'>'+esc(t.n)+'（'+esc((ERAI[t.era]||{}).n||'')+'）'+(toeCus(t)?'＊':'')+'</option>':'';}).join('')+'</select><span class="lw-note">列出本局用到的類型；＊ 表示已改過編制。</span>';}
  return o+'</div>';}
function toeWRows(T){var y=catYear(),o='<h4 style="margin:8px 0 2px;font-size:13px">武器（單兵與班組）</h4><table class="lw-tbl"><tr><th>武器</th><th>類別</th><th class="n">數量</th><th class="n">每基數</th><th></th></tr>';
  T.w.forEach(function(x,i){var w=wpnOf(x[0])||{n:x[0],cat:'',kg:0,rpu:0};o+='<tr'+(w.y>y?' class="lw-dim"':'')+'><td>'+esc(w.n)+(G.wpns&&G.wpns[x[0]]?catPill('自訂'):'')+'</td><td>'+esc(wCatN(w.cat))+'</td><td class="n"><input type="number" min="0" max="100000" value="'+x[1]+'" data-c="tewn" data-v="'+i+'" style="width:6em"></td><td class="n">'+fmt((w.kg||0)*(w.rpu||0)*x[1])+' 公斤</td><td><button type="button" class="lw-btn sm dng" data-a="tewdel" data-v="'+i+'">移除</button></td></tr>';});
  var cats={},dw='',dy=-1;wpnListP().forEach(function(w){(cats[wCatN(w.cat)]=cats[wCatN(w.cat)]||[]).push(w);if(w.cat==='反裝甲'&&w.y<=y&&w.y>dy&&!w.spec){dy=w.y;dw=w.k;}});
  return o+'</table><div class="lw-row"><select data-k="tewadd">'+Object.keys(cats).map(function(c){return '<optgroup label="'+esc(c)+'">'+cats[c].sort(function(a,b){return a.y-b.y;}).map(function(w){return '<option value="'+w.k+'"'+(w.k===dw?' selected':'')+(w.y>y?' style="color:#999"':'')+'>'+esc(w.n)+'（'+w.y+'）</option>';}).join('')+'</optgroup>';}).join('')+'</select><input type="number" min="1" max="100000" value="10" data-k="tewaddn" style="width:5em"><button type="button" class="lw-btn sm" data-a="tewadd">加入</button></div>';}
/* 欄位上全部車輛的武裝（合計；換了型號時機槍沿用標準） */
function toeArmTot(m,n,slot){if(m.arm2&&m.arm2.length)return vmArmTxt(m,4);var A=m.gen&&!slot?slotTot(m,n,'w'):vmArm(m,false).map(function(x){return [x[0],x[1]*n];});if(slot)A=A.filter(function(x){return !wIsMg(x[0]);}).concat(slotTot(slot,n,'w',1));
  return A.length?A.slice(0,5).map(function(x){var w=wpnOf(x[0]);return esc(w?w.n.replace(/（.*?）/g,''):x[0])+' ×'+fmt(x[1]);}).join('、'):'—';}
/* 一個載具欄位可以換成哪些型號 */
function toeFits(slot){return vmUIAll().filter(function(m){return m!==slot&&!m.gen&&vmFitsSlot(m,slot);}).sort(function(a,b){return a.y-b.y;});}
function toeVRows(T,plat){var y=catYear(),o='<h4 style="margin:8px 0 2px;font-size:13px">載具與無人機</h4>';if(plat)return o+toePlatHtml();
  o+='<table class="lw-tbl"><tr><th>欄位</th><th class="n">數量</th><th>型號</th><th>武裝（合計）</th><th></th></tr>';
  T.v.forEach(function(x,i){var slot=vmOf(x.k);if(!slot)return;var gen=!!slot.gen,cur=x.o&&x.o.m&&x.o.m!=='-'?vmOf(x.o.m):null,m=cur||slot,sel='';
    if(gen){var F=toeFits(slot);sel='<select data-c="tevm" data-v="'+i+'"><option value="">標準（'+esc(slot.n.replace(/（.*?）$/,''))+'）'+(TOE.mode==='u'?'；或依制式裝備':'')+'</option><option value="-"'+(x.o&&x.o.m==='-'?' selected':'')+'>一律用標準（不跟制式裝備）</option>'+F.map(function(q){return '<option value="'+esc(q.k)+'"'+(cur&&cur.k===q.k?' selected':'')+(q.y>y?' style="color:#999"':'')+'>'+esc(q.n)+'（'+(q.y||'—')+(vmSrc(q)!=='in'?'・'+VMSRCN[vmSrc(q)]:'')+'）</option>';}).join('')+'</select>';}
    else sel='<b>'+esc(slot.n)+'</b>'+catPill(VMSRCN[vmSrc(slot)])+'<br><span class="lw-note">額外加入的車</span>';
    var eff='';if(gen&&TOE.mode==='u'&&!(x.o&&x.o.m)){var u=uById(TOE.uid),R=u?toeRes(u):[],e=R.filter(function(q){return q.k===x.k;})[0];if(e&&e.src==='f')eff='<br><span class="lw-note">目前依制式裝備：'+esc(e.m.n)+'</span>';}
    o+='<tr><td>'+esc(vmClsN(slot.c))+(slot.r?'<br><span class="lw-note">'+esc(vmRoleN(slot))+'</span>':'')+'</td><td class="n"><input type="number" min="0" max="5000" value="'+x.n+'" data-c="tevn" data-v="'+i+'" style="width:5em"></td><td>'+sel+eff+'</td><td class="w">'+toeArmTot(m,x.n,cur?slot:null)+'</td><td><button type="button" class="lw-btn sm" data-a="vuopen2" data-v="'+esc(m.k)+'">型號</button><button type="button" class="lw-btn sm dng" data-a="tevdel" data-v="'+i+'">移除</button></td></tr>';
    if(cur&&cur.m&&vmDom(cur)==='land')o+='<tr><td></td><td colspan="4">'+toeOptHtml(cur,x,i)+'</td></tr>';});
  var opts=vmUIAll().filter(function(m){var d=vmDom(m);return (d==='land'||d==='uas')&&!m.plat;}).sort(function(a,b){return vmDom(a)<vmDom(b)?-1:vmDom(a)>vmDom(b)?1:a.y-b.y;}),dv='',dd=1e9;opts.forEach(function(m){if(vmDom(m)==='land'&&m.y<=y&&y-m.y<dd&&/truck/.test(m.r||'')){dd=y-m.y;dv=m.k;}});
  return o+'</table><div class="lw-row"><select data-k="tevadd" style="max-width:22em">'+['land','uas'].map(function(d){return '<optgroup label="'+VMDOMN[d]+'">'+opts.filter(function(m){return vmDom(m)===d;}).map(function(m){return '<option value="'+esc(m.k)+'"'+(m.k===dv?' selected':'')+(m.y>y?' style="color:#999"':'')+'>'+esc(m.n)+'（'+(m.y||'—')+'）</option>';}).join('')+'</optgroup>';}).join('')+'</select><input type="number" min="1" max="5000" value="4" data-k="tevaddn" style="width:5em"><button type="button" class="lw-btn sm" data-a="tevadd">加入額外的車或無人機</button></div>';}
/* 型號的選項：加掛、砲管、彈藥配比 */
function toeOptHtml(m,x,i){var o='',op=x.o||{},cand=typeof vmAdCand==='function'?vmAdCand(m):[],cur=Array.isArray(op.ad)?op.ad:m.ad||[];
  if(cand.length)o+='<span class="lw-note">加掛：</span>'+cand.map(function(a){return '<label class="lw-note"><input type="checkbox" data-c="tead" data-v="'+i+'" data-k="'+a.k+'"'+(cur.indexOf(a.k)>=0?' checked':'')+'>'+esc(a.n)+'</label>';}).join(' ');
  var w=wpnOf(m.m[0]);if(w&&w.Lo&&w.Lo.length>1)o+=' <label class="lw-note">砲管 <select data-c="teL" data-v="'+i+'">'+w.Lo.map(function(L){return '<option value="'+L+'"'+((op.L||w.L)===L?' selected':'')+'>L/'+L+'</option>';}).join('')+'</select></label>';
  if(w&&w.am0){var Lb=op.L||w.L,A=op.am||m.am||w.am0,E=amEff(A,w,Lb),B=amEff(w.am0,w),y=catYear(),M={};A.forEach(function(q){M[q[0]]=q[1];});
    o+='<details><summary class="lw-note" style="cursor:pointer">彈藥配比（每輛 '+fmt(E.n)+' 發，有效穿甲 '+fx(E.pen,1)+' 級；對人 ×'+fx(B.P?E.P/B.P:1,2)+'、對裝甲 ×'+fx(B.A?E.A/B.A:1,2)+'）</summary><table class="lw-tbl"><tr><th>彈種</th><th>種類</th><th class="n">年代</th><th class="n">穿甲</th><th class="n">破片半徑</th><th class="n">每發</th><th class="n">發數</th></tr>'+
      amFor(m.m[0]).map(function(a){var fr=amFrag(a,w);return '<tr'+(a.y>y?' class="lw-dim"':'')+'><td>'+esc(a.n)+'</td><td>'+esc(GAMK[a.kind]||a.kind)+'</td><td class="n">'+a.y+'</td><td class="n">'+(a.pen?fx(amPen(a,Lb),1)+(a.ce?'＊':''):'—')+'</td><td class="n">'+(fr?fr+' 公尺':'—')+'</td><td class="n">'+amoney(a.usd)+'</td><td class="n"><input type="number" min="0" max="2000" value="'+(M[a.k]||0)+'" data-c="team" data-v="'+i+'" data-k="'+a.k+'" style="width:5em"></td></tr>';}).join('')+'</table>'+
      '<div class="lw-row"><button type="button" class="lw-btn sm" data-a="teamp" data-v="'+i+'" data-k="f">原廠配比</button><button type="button" class="lw-btn sm" data-a="teamp" data-v="'+i+'" data-k="at">反裝甲為主</button><button type="button" class="lw-btn sm" data-a="teamp" data-v="'+i+'" data-k="he">反人員為主</button><span class="lw-note">穿甲依 L/'+(Lb||'—')+' 砲管換算，＊為成形裝藥；彈藥配比作戰中也能改（下一次補給起生效）。</span></div></details>';}
  return o;}
/* 空中與海上部隊：換機型、換艦型 */
function toePlatHtml(){var u=TOE.mode==='u'?uById(TOE.uid):null;if(!u)return '<div class="lw-note">空中與海上部隊的載台在單位的編制裡更換（選擇一個單位）。</div>';var t=typeOf(typesOfU(u)[0][0]),cur=vmOf(toeDef(t).v[0]&&toeDef(t).v[0][0]);if(!cur)return '';
  var L=vmUIAll().filter(function(m){return m!==cur&&(m.plat||m.gen&&m.tk)&&vmGrp(m)===vmGrp(cur);}),ks={};Object.keys(UT).forEach(function(k){var T2=UT[k];if(T2.dom!==t.dom)return;var g=toeDef(T2).v[0];if(g&&!ks[g[0]]&&g[0]!==cur.k){var gm=vmOf(g[0]);if(gm&&vmGrp(gm)===vmGrp(cur)){ks[g[0]]=1;L.push(gm);}}});
  L.sort(function(a,b){return (a.y||0)-(b.y||0);});var y=catYear();
  return '<div class="lw-note">目前的'+(t.dom==='air'?'機型':'艦型')+'：<b>'+esc(cur.gen?t.n:cur.n)+'</b>（'+fmt(u.veh0||t.veh)+' '+esc((t.vn||'架').charAt(0))+'）'+(u.platNext?'；休整時換裝為 '+esc((vmOf(u.platNext)||{}).n||''):'')+'。換裝後單位類型改為新的載台，數量與人員比例不變。</div>'+
    '<div class="lw-row"><select data-k="teplat" style="max-width:26em">'+L.map(function(m){var T2=m.gen?typeOf(m.tk):m.tt;return '<option value="'+esc(m.k)+'"'+((m.y||0)>y?' style="color:#999"':'')+'>'+esc(m.gen&&T2?T2.n:m.n)+'（'+(m.y||(T2&&ERAI[T2.era]?ERAI[T2.era].y:'—'))+(vmSrc(m)!=='gen'?'・'+VMSRCN[vmSrc(m)]:'')+'）</option>';}).join('')+'</select><button type="button" class="lw-btn sm pri" data-a="teplat">換裝</button></div>';}
function toeERows(T){var y=catYear(),o='<h4 style="margin:8px 0 2px;font-size:13px">支援裝備</h4><table class="lw-tbl"><tr><th>裝備</th><th>類別</th><th>配發</th><th class="n">數量</th><th></th></tr>';
  T.e.forEach(function(x,i){var e=seqOf(x[0])||{n:x[0],cat:'',cov:'u'};o+='<tr'+(e.y>y?' class="lw-dim"':'')+'><td>'+esc(e.n)+'</td><td>'+esc(e.cat)+'</td><td>'+({m:'每人',v:'每輛',u:'每單位'})[e.cov]+'</td><td class="n"><input type="number" min="0" max="100000" value="'+x[1]+'" data-c="teen" data-v="'+i+'" style="width:6em"></td><td><button type="button" class="lw-btn sm dng" data-a="tedel" data-v="'+i+'">移除</button></td></tr>';});
  return o+'</table><div class="lw-row"><select data-k="teeadd">'+vmEOpts()+'</select><input type="number" min="1" max="100000" value="1" data-k="teeaddn" style="width:5em"><button type="button" class="lw-btn sm" data-a="teeadd">加入</button></div>';}
function toeSRows(T){var u=TOE.mode==='u'?uById(TOE.uid):null,L=u&&u.lg,s=T.s||{},o='<h4 style="margin:8px 0 2px;font-size:13px">人員、馬匹與攜行物資</h4><div class="lw-row" style="flex-wrap:wrap">';
  if(u&&L){var rk=T.rk||L.rk||[0,0,0];o+='<label>士兵 <input type="number" min="0" value="'+Math.round(rk[0])+'" data-c="terk" data-v="0" style="width:5em"></label><label>士官 <input type="number" min="0" value="'+Math.round(rk[1])+'" data-c="terk" data-v="1" style="width:4em"></label><label>軍官 <input type="number" min="0" value="'+Math.round(rk[2])+'" data-c="terk" data-v="2" style="width:4em"></label>';}
  o+='<label>馬匹 <input type="number" min="0" max="100000" value="'+(T.h||0)+'" data-c="teh" style="width:5em"></label></div><div class="lw-row" style="flex-wrap:wrap">'+
    '<label>口糧 <input type="number" min="0.5" max="30" step="0.5" value="'+(s.fd||3)+'" data-c="tes" data-f="fd" style="width:4em"> 天份</label><label>草料 <input type="number" min="0.5" max="30" step="0.5" value="'+(s.od||2)+'" data-c="tes" data-f="od" style="width:4em"> 天份</label>'+
    '<label>彈藥 <input type="number" min="0.25" max="10" step="0.25" value="'+(s.bl||(L?L.basic:''))+'" data-c="tes" data-f="bl" style="width:4em"> 個基數</label><label>每日配給 <input type="number" min="0" max="10" step="0.25" value="'+(s.dl!==undefined?s.dl:(L?L.daily:''))+'" data-c="tes" data-f="dl" style="width:4em"> 基數</label></div>';
  if(u)o+='<div class="lw-row"><span>伙食：'+(u.ration?'自訂':'本方標準')+'</span><button type="button" class="lw-btn sm" data-a="lgration" data-v="'+u.id+'">'+(u.ration?'編輯自訂伙食':'改用自訂伙食')+'</button>'+(u.ration?'<button type="button" class="lw-btn sm" data-a="lgrationx" data-v="'+u.id+'">改回標準</button>':'')+'<span class="lw-note">（各方的標準伙食在「糧水與物資」）</span></div>';
  return o;}
function toeTabHtml(){if(TOE.mode==='u'&&!uById(TOE.uid)){var s0=UI.tab==='orbat'&&OB&&OB.sel||UI.sel&&UI.sel[0],u0=s0&&uById(s0);if(u0&&isLeaf(u0)){TOE.uid=u0.id;TOE.D=null;}}var o=toeTgtHtml(),X=toeTgt();if(!X)return o+'<div class="lw-note">選擇一個單位或單位類型。單位的編制只影響這個單位；類型的編制影響整局所有這個類型的單位（自訂的類型在「兵力編成 → 自訂類型」）。</div>';
  var T=toeDraft();if(!T)return o+'<div class="lw-note">這個單位沒有自己的編制（只有葉單位有）。</div>';var u=TOE.mode==='u'?X:null,t=TOE.mode==='t'?X:typeOf(typesOfU(X)[0][0]),plat=!!(t&&t.dom!=='land'),later=u&&toeLater(u);
  o+='<div class="lw-note">'+(TOE.mode==='u'?esc(uName(u))+'：'+(u.toe?'這個單位有自己的編制。':toeCustom(u)?'使用類型的自訂編制。':'使用標準編制。')+(u.toeNext||u.vmNext?' <b>已有改動等休整時換裝。</b>':''):'類型「'+esc(t.n)+'」：'+(toeCus(t)?'已改過編制。':'標準編制。'))+
    ' 武器只列單兵與班組武器；車上的主砲、機砲與飛彈跟著載具型號。'+(later?'<br><b>作戰中：改動要等這個單位撤到後方休整時才換裝。</b>':'')+'</div>';
  if(!plat)o+=toeWRows(T);o+=toeVRows(T,plat);if(!plat)o+=toeERows(T)+toeSRows(T);
  o+='<div class="lw-row" style="margin-top:8px"><button type="button" class="lw-btn pri" data-a="teok">'+(later?'休整時換裝':'套用編制')+'</button><button type="button" class="lw-btn sm" data-a="tereset">恢復標準編制</button><button type="button" class="lw-btn sm" data-a="tecancel">放棄修改</button></div>';
  if(!plat)o+='<div data-k="teprev"><span class="lw-note">試算中…</span></div>';return o;}
CATF.toe={h:toeTabHtml,f:function(el){var p=el.querySelector('[data-k="teprev"]');if(!p)return;setTimeout(function(){try{var T=toeDraft();if(T&&p.isConnected)p.innerHTML=toePrevHtml(T);}catch(e){p.innerHTML='';}},0);}};
function teRe(){catRe();}
ACT.temode=function(b){TOE.mode=b.getAttribute('data-v');TOE.D=null;if(TOE.mode==='u'&&!uById(TOE.uid)){var s=UI.sel&&UI.sel[0]||OB&&OB.sel;if(s)TOE.uid=s;}teRe();};
CHG.teu=function(t){TOE.uid=+t.value||0;TOE.D=null;teRe();};CHG.tet=function(t){TOE.tk=t.value;TOE.D=null;teRe();};
CHG.tewn=function(t){toeDraft().w[+t.getAttribute('data-v')][1]=Math.max(0,Math.round(+t.value||0));teRe();};
ACT.tewdel=function(b){toeDraft().w.splice(+b.getAttribute('data-v'),1);teRe();};
ACT.tewadd=function(){var d=UI.wdlg,k=d.querySelector('[data-k="tewadd"]').value,n=Math.max(1,Math.round(+d.querySelector('[data-k="tewaddn"]').value||1)),T=toeDraft(),hit=T.w.filter(function(x){return x[0]===k;})[0];if(hit)hit[1]+=n;else T.w.push([k,n]);teRe();};
CHG.tevn=function(t){toeDraft().v[+t.getAttribute('data-v')].n=Math.max(0,Math.round(+t.value||0));teRe();};
CHG.tevm=function(t){var x=toeDraft().v[+t.getAttribute('data-v')];x.o=x.o||{};
  /* 選回目前使用中的型號：保留它現有的加掛、砲管與彈藥配比；換別的型號則從該型號的預設開始 */if(x.o0&&(x.o0.m||'')===t.value){x.o=clone(x.o0);teRe();return;}if(t.value)x.o.m=t.value;else delete x.o.m;delete x.o.ad;delete x.o.am;delete x.o.L;teRe();};
ACT.tevdel=function(b){toeDraft().v.splice(+b.getAttribute('data-v'),1);teRe();};
ACT.tevadd=function(){var d=UI.wdlg,k=d.querySelector('[data-k="tevadd"]').value,n=Math.max(1,Math.round(+d.querySelector('[data-k="tevaddn"]').value||1)),T=toeDraft(),hit=T.v.filter(function(x){return x.k===k&&!(x.o&&x.o.m);})[0];if(hit)hit.n+=n;else T.v.push({k:k,n:n,o:{}});teRe();};
CHG.tead=function(t){var x=toeDraft().v[+t.getAttribute('data-v')],m=vmOf(x.o.m),k=t.getAttribute('data-k'),L=(Array.isArray(x.o.ad)?x.o.ad:clone(m&&m.ad||[])).filter(function(q){return q!==k;});if(t.checked)L.push(k);x.o.ad=L;teRe();};
CHG.teL=function(t){var x=toeDraft().v[+t.getAttribute('data-v')],m=vmOf(x.o.m),w=m&&wpnOf(m.m[0]);if(w&&+t.value!==w.L)x.o.L=+t.value;else delete x.o.L;teRe();};
CHG.team=function(t){var x=toeDraft().v[+t.getAttribute('data-v')],m=vmOf(x.o.m),w=m&&wpnOf(m.m[0]),k=t.getAttribute('data-k'),n=clamp(Math.round(+t.value||0),0,2000);if(!w)return;var A=clone(x.o.am||m.am||w.am0).filter(function(q){return q[0]!==k;});if(n>0)A.push([k,n]);x.o.am=A.length?A:undefined;teRe();};
ACT.teamp=function(b){var x=toeDraft().v[+b.getAttribute('data-v')],m=vmOf(x.o.m),w=m&&wpnOf(m.m[0]),k=b.getAttribute('data-k');if(!w)return;if(k==='f')delete x.o.am;else x.o.am=vmAmPreset(m,k,w);teRe();};
CHG.teen=function(t){toeDraft().e[+t.getAttribute('data-v')][1]=Math.max(0,Math.round(+t.value||0));teRe();};
ACT.tedel=function(b){toeDraft().e.splice(+b.getAttribute('data-v'),1);teRe();};
ACT.teeadd=function(){var d=UI.wdlg,k=d.querySelector('[data-k="teeadd"]').value,n=Math.max(1,Math.round(+d.querySelector('[data-k="teeaddn"]').value||1)),T=toeDraft(),hit=T.e.filter(function(x){return x[0]===k;})[0];if(hit)hit[1]+=n;else T.e.push([k,n]);teRe();};
CHG.terk=function(t){var T=toeDraft(),u=uById(TOE.uid);T.rk=T.rk||clone(u&&u.lg&&u.lg.rk||[0,0,0]);T.rk[+t.getAttribute('data-v')]=Math.max(0,Math.round(+t.value||0));teRe();};
CHG.teh=function(t){toeDraft().h=Math.max(0,Math.round(+t.value||0));teRe();};
CHG.tes=function(t){var T=toeDraft(),f=t.getAttribute('data-f');T.s=T.s||{};if(t.value==='')delete T.s[f];else T.s[f]=+t.value;teRe();};
ACT.tecancel=function(){TOE.D=null;teRe();};
ACT.vuopen2=function(b){VMU.cur=b.getAttribute('data-v');VMU.ed=null;var m=vmOf(VMU.cur);if(m)VMU.dom=vmDom(m);armoryDlg('vm');};
/* 套用：用到的設計型號先存進本局 */
function toeUseModels(T){T.v.forEach(function(x){vmUse(x.k);if(x.o&&x.o.m)vmUse(x.o.m);});}
ACT.teok=function(){var T=toeDraft();if(!T)return;if(TOE.mode==='t'&&typeof mpActive==='function'&&mpActive()){toast('聯機時只能改單位的編制；整局的類型編制請在開房前的單機或編輯器裡設定。',5000);return;}toeUseModels(T);var out=toeOut(T);
  if(TOE.mode==='t'){var n=typeToeSet(TOE.tk,out);TOE.D=null;toast('類型的編制已更新'+(n?'：'+n+' 個單位已換裝':'')+(G.started?'；作戰中的單位在後方休整時換裝':'')+'。',4000);}
  else{var u=uById(TOE.uid);if(!u)return;var r=toeStore(u,out);TOE.D=null;toast(r==='later'?'這個單位會在撤到後方休整時依新的編制換裝。':'編制已套用。',3500);}
  teAfter();teRe();};
ACT.tereset=function(){if(TOE.mode==='t'){if(typeof mpActive==='function'&&mpActive())return;typeToeSet(TOE.tk,null);}else{var u=uById(TOE.uid);if(u)toeStore(u,null);}TOE.D=null;teAfter();teRe();};
ACT.teplat=function(){var u=uById(TOE.uid),k=UI.wdlg.querySelector('[data-k="teplat"]').value;if(!u||!k)return;vmUse(k);var r=platSet(u,k);if(!r){toast('無法換成這個載台。');return;}TOE.D=null;toast(r==='later'?'會在回到基地休整時換裝。':'已換裝。',3500);teAfter();teRe();};
function teAfter(){try{if(UI.tab==='orbat'){obTree();obDet();}if(UI.panelTick)UI.panelTick(true);}catch(e){}}

/* ---------- 單位明細與作戰面板：編制摘要（取代原本的武器清單與載具選單） ---------- */
function toeSumHtml(u){var V=toeView(u),W=(V.w||[]).slice().sort(function(a,b){return b[1]-a[1];}),o='<div class="lw-kv">';
  o+='<span>武器</span><span>'+(W.length?W.slice(0,5).map(function(x){var w=wpnOf(x[0]);return esc(w?w.n.replace(/（.*?）/g,''):x[0])+' '+fmt(x[1]);}).join('、')+(W.length>5?' 等 '+W.length+' 種':''):'—')+'</span>';
  var vs=V.v.filter(function(x){return x.n>0;});o+='<span>載具</span><span>'+(vs.length?vs.map(function(x){var m=vmOf(x.m)||vmOf(x.k);return esc(m?m.n.replace(/（.*?・標準）|（泛用）/,''):x.k)+' ×'+fmt(x.n)+(x.src==='f'?'<span class="lw-note">（制式）</span>':'');}).join('、'):'—')+'</span>';
  o+='<span>支援裝備</span><span>'+((V.e||[]).length?(V.e.length+' 種'):'—')+'</span></div>';return o;}
function toeSecHtml(u){if(!u||!isLeaf(u))return '';var pend=u.toeNext||u.vmNext||u.platNext;return '<h4 style="margin:10px 0 4px;font-size:13px">編制裝備'+(u.toe?catPill('自訂'):'')+(pend?catPill('休整時換裝'):'')+'</h4>'+toeSumHtml(u)+'<div class="lw-row"><button type="button" class="lw-btn sm" data-a="toeopen" data-v="'+u.id+'">編制與裝備…</button></div>';}
vmSecHtml=function(u){return toeSecHtml(u);};
vmDlg=function(u){toeOpen(u);};
(function(){var b=lgUnitHtml;lgUnitHtml=function(u){var o=b(u);if(!o||!u)return o;try{['武器（','支援裝備（'].forEach(function(lab){var i=o.indexOf('<details><summary class="lw-note" style="cursor:pointer">'+lab);if(i>=0){var j=o.indexOf('</details>',i);if(j>i)o=o.slice(0,i)+o.slice(j+10);}});
  if(o.indexOf('data-a="vmdlg"')<0&&o.indexOf('data-a="toeopen"')<0)o+='<div class="lw-row"><button type="button" class="lw-btn sm" data-a="toeopen" data-v="'+u.id+'">編制與裝備…</button></div>';}catch(e){}return o;};})();
/* 自訂類型：武器清單改成編制裝備 */
(function(){var b=tyEdit;tyEdit=function(k){b(k);try{var d=UI.tdlg;if(!d)return;var h=Array.prototype.filter.call(d.querySelectorAll('h4'),function(x){return /^武器/.test(x.textContent);})[0];if(!h)return;var tb=h.nextElementSibling,row=tb&&tb.nextElementSibling;if(tb&&tb.tagName==='TABLE')tb.remove();if(row&&row.classList.contains('lw-row'))row.remove();
  h.textContent='編制裝備（每個此類型單位）';var t=G.types[k],T=typeToe(t),x=document.createElement('div');x.innerHTML='<div class="lw-note">武器 '+T.w.length+' 種、載具 '+T.v.reduce(function(s,q){return s+q[1];},0)+' 輛／架／艘、支援裝備 '+T.e.length+' 種。車上的主砲與機砲跟著載具型號。</div><div class="lw-row"><button type="button" class="lw-btn sm" data-a="toeopent" data-v="'+esc(k)+'">編輯編制裝備…</button></div>';h.insertAdjacentElement('afterend',x);}catch(e){}};})();
/* 制式裝備：列出本方所有載具欄位的角色（不只主要載具） */
fldRoles=function(side){var o={};G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||u.st==='dead')return;var seen={};try{toeRes(u).forEach(function(e){var r=e.slot&&e.slot.r;if(r&&VROLE[r]&&!seen[r]){seen[r]=1;o[r]=(o[r]||0)+1;}});}catch(e){}});return o;};
/* 聯機：換載台由伺服器執行 */
if(typeof mpWrapFn==='function'){platSet=mpWrapFn('platSet',platSet,function(a){return 'later';});}
/* 制式裝備的「武器」只列單兵與班組武器（車上的砲跟著型號） */
(function(){var b=fldGen;fldGen=function(side){var o=b(side);Object.keys(o).forEach(function(k){if(wMt(k))delete o[k];});return o;};})();
/* 作戰面板的按鈕改名 */
(function(){var b=lgUnitHtml;lgUnitHtml=function(u){var o=b(u);return typeof o==='string'?o.replace('>載具與彈藥…</button>','>編制與裝備…</button>'):o;};})();
if(typeof HELP14!=='undefined')HELP14.push('<h4>物資與裝備（編制、載具型號、武器、糧水）</h4><ul>'+
  '<li>「兵力編成 → 物資與裝備」是一個對話框，整合所有物資、裝備與武器：編制裝備、載具型號、武器、載具武裝、彈藥、支援裝備、糧水與物資、制式裝備（列裝表）、裝甲材料、化生放核魔、LatoArmory 工具與幣值。</li>'+
  '<li>武器分兩類：單位武器清單只放單兵與班組武器（步槍、機槍、反裝甲、迫擊砲、牽引火砲、防空）；戰車砲、機砲、自走砲、多管火箭、艦砲、航空武裝與無人機戰鬥部是「載具武裝」，只寫在載具型號上，換了型號武裝跟著換。</li>'+
  '<li>載具型號是一份清單：內建型號、LatoVehicle 設計、自訂型號，以及每個兵種的泛用型號（沒有指定型號時的標準車輛）。設計就是型號：陸上設計由各區裝甲、機動與主砲彈藥算出型號，空中與海上設計算出載台。內建或自訂型號可以用相近的設計當藍本改成細部設計，在 LatoArmory 工具裡修改；設計也可以複製成自訂型號，直接改數值、武裝、車載裝備與加掛。</li>'+
  '<li>無人機也是載具：FPV 無人機、巡飛彈與偵察無人機各有型號（戰鬥部就是它的武裝）；光纖導控的 FPV 不受干擾。空軍的無人機中隊與飛機一樣換載台。</li>'+
  '<li>編制裝備：選一個單位（或一個類型，影響整局）編輯人員、武器、載具與無人機（泛用的車可以換成合適的型號，也可以加入額外的車）、支援裝備、馬匹、攜行的口糧與草料天數、彈藥基數與伙食；畫面下方即時比較火力、防護、機動、補給與造價。只換主要車輛型號時與過去的「載具與彈藥」相同；開戰前立即換裝，作戰中等撤到後方休整。空中與海上部隊在這裡換機型、艦型（數量不變）。</li>'+
  '<li>換掉泛用的車時，車上機槍的火力沿用兵種的標準（避免與兵種本來的火力重複）；另外加入的車整套武裝都算。沒有指定型號、沒有制式裝備時，所有單位與過去完全相同。</li>'+
  '<li>糧水與物資：內建與自訂的糧食品項、各方的標準伙食與飲水；醫療與 CBRN 物資依年代配發，由補給鏈運送。</li></ul>');
HELP14.push('<h4>裝備只能用詳細設計，不能超模</h4><ul><li>內建的武器、彈藥、材料、模組與型號是真實裝備的數據，不能直接改數值；要改請「複製為設計」。</li>'+
  '<li>武器設計：選一種內建武器當藍本，換彈藥（只能用同類、口徑相近的）、改身管長（0.7～1.3 倍）、射速（0.5～1.5 倍）、夜視（微光 1965 年起、熱像 1978 年起）與年份。殺傷依彈藥的砲口動能與炸藥量、穿甲依終端彈道、射程依初速換算；更長的身管、更快的射速、更好的夜視都更貴，彈藥更重則每基數發數變少、操作人數可能增加。</li>'+
  '<li>彈藥設計只填口徑、彈頭質量、初速與彈芯、裝藥：初速受口徑與膛壓限制，發射藥至少要提供砲口動能；長桿彈的長細比與質量、藥型罩直徑、裝藥量都要裝得進彈體；彈道係數、全彈重量與價格由設計算出。</li>'+
  '<li>材料、載具模組、導引飛彈、核彈頭與毒劑：每一項性能、每公斤與每塊錢的效能都不能超過同類最好的真實裝備（多 5%～10% 的餘裕）；性能越好越貴、越重。核彈頭的重量受當年技術限制，熱核彈頭 1952 年起。超出時會自動調整並告訴你調整了什麼。</li>'+
  '<li>自訂單位類型的戰鬥數值沿用範本（或載具設計換算的結果），可以改名稱、符號、說明、圖片、軍官比例、規模（範本的 0.5～2 倍）與移除旗標；要更強的部隊，請換更好的武器或載具設計。自訂載具型號以內建型號為藍本，可以改名稱與在同類武器間換裝；裝甲、速度要改請用「設計細部計算」。</li>'+
  '<li>編制裡的武器多於人員能操作的部分當作備用，不會增加火力。</li><li>聯機時伺服器用同一套規則重算：讀檔、匯入與玩家送來的設計都先檢查，不採信用戶端送來的數值。</li></ul>');
