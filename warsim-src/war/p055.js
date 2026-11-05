
/* ===================== 防彈衣與插板 ===================== */
var PLATES=[['sapis','SAPI 小號 22×30 cm',0.0663],['sapim','SAPI 中號 24×32 cm',0.0766],['sapil','SAPI 大號 26×34 cm',0.0876],['sapixl','SAPI 特大號 28×36 cm',0.0994],['s1012','10×12 吋',0.0774],['s2530','25×30 cm',0.075],['side','側板 15×20 cm',0.03],['helm','頭盔（約 0.13 m²）',0.13]];
var BODY={arm:'b4a',L:armLayers('b4a'),plate:'sapim',np:2,side:0,softA:0.45,soft:'b3a',p:'r762m61',R:50,icw:false};
RENDER.body={init:function(){var E=pane('body');E.innerHTML=
  '<div class="row"><label>插板／防護 <select data-k="bA">'+armOpts(BODY.arm,function(a){return a[1]==='body'||a[1]==='magic';})+'</select></label><label>尺寸 <select data-k="bPl">'+opts(PLATES.map(function(x){return [x[0],x[1]];}),BODY.plate)+'</select></label>'+
  '<label>插板數 <input type="number" data-k="bNp" value="'+BODY.np+'" min="0" max="6" style="width:48px"></label><label>側板 <input type="number" data-k="bSide" value="'+BODY.side+'" min="0" max="4" style="width:48px"></label></div>'+
  '<div class="row"><label>軟甲 <select data-k="bSoft">'+armOpts(BODY.soft,function(a){return a[1]==='body'&&a[3].every(function(l){return M(l[0]).cat==='fiber'&&!M(l[0]).hard;});})+'</select></label><label>軟甲覆蓋 <input type="number" data-k="bSA" value="'+BODY.softA+'" min="0" step="0.05" style="width:64px"> m²</label>'+
  '<label><input type="checkbox" data-k="bIcw"'+(BODY.icw?' checked':'')+'> 插板後方疊加軟甲（ICW 併用）</label></div>'+
  '<div data-k="bL"></div><h4>NIJ 標準測試（0°、新品）</h4><div data-k="bNij"></div>'+
  '<h4>自訂威脅</h4><div class="row"><label>彈藥 <select data-k="bP">'+projOpts(BODY.p,function(p){return p.k!=='he'&&p.k!=='hesh'&&p.g!=='tank'&&p.g!=='art'&&p.g!=='rkt';})+'</select></label><label>距離 <input type="number" data-k="bR" value="'+BODY.R+'" min="0" step="10"> m</label><label>入射角 <input type="number" data-k="bAng" value="0" min="0" max="80" style="width:56px"> °</label></div><div data-k="bAn"></div><div data-k="bOut"></div><h4>重量與造價</h4><div data-k="bW"></div>';
  BODY.an=new Anim(q('bAn'));layerEditor(q('bL'),function(){return BODY.L;},function(L){BODY.L=L;q('bA').value='';},function(){RENDER.body.run();});
  q('bA').onchange=function(){BODY.arm=this.value;if(this.value){BODY.L=armLayers(this.value);RENDER.body.init();}RENDER.body.run();};
  ['bPl','bNp','bSide','bSoft','bSA','bIcw','bP','bR','bAng'].forEach(function(k){q(k).onchange=function(){BODY.plate=q('bPl').value;BODY.np=+q('bNp').value||0;BODY.side=+q('bSide').value||0;BODY.soft=q('bSoft').value;BODY.softA=+q('bSA').value||0;BODY.icw=q('bIcw').checked;BODY.p=q('bP').value;BODY.R=+q('bR').value||0;RENDER.body.run();};});},
 run:function(){var L=BODY.L.map(function(l){return {mat:l.mat,t:l.t,ang:l.ang,gap:l.gap};}),soft=armLayers(BODY.soft||'b3a');if(BODY.icw)L=L.concat(soft);
  var rows=A.NIJ.map(function(lv){var ok=true,cells=lv[1].map(function(t){var p=P(t[0]),r=A.evaluate(p,L,eo({v:t[1]})),V50=A.v50Stack(p,L,eo()),pass=!(r.perf&&!r.ric)&&(r.bfd===undefined||r.bfd<=44);if(!pass)ok=false;
      return '<span class="'+(pass?'ok':'ng')+'">'+esc(p.n.replace(/\s.*$/,''))+' @'+t[1]+'：'+(r.perf?'貫穿':'擋下')+(r.bfd!==undefined&&!r.perf?'，BFD '+fx(r.bfd,0)+' mm':'')+'，V50 '+(isFinite(V50)?(V50>2000?'> 2,000':fx(V50,0)):'∞')+'</span>';});
    return [lv[0],ok,cells];});
  var best06='',best07='';rows.forEach(function(x){if(x[1]){if(x[0].indexOf('06')>=0)best06=x[0];else best07=x[0];}});
  q('bNij').innerHTML='<div class="lt-res '+(best06||best07?'good':'bad')+'">此組合達到：<b>'+(best06||'未達 IIA')+'</b>；<b>'+(best07||'未達 HG1')+'</b></div><div class="lt-sc"><table class="lt-dt"><tr><th class="l">等級</th><th>判定</th><th class="l">測試彈（全部通過才算達標；BFD ≤ 44 mm）</th></tr>'+
    rows.map(function(x){return '<tr><td class="l">'+x[0]+'</td><td>'+(x[1]?'✔ 通過':'✘')+'</td><td class="l lt-cells">'+x[2].join('　')+'</td></tr>';}).join('')+'</table></div><div class="lt-note">註：NIJ 0101.07 RF 等級另含多發與高溫等條件，此處只模擬單發常溫新品。</div>';
  var p=P(BODY.p),v=A.velAt(p,BODY.R,env()),ang=+q('bAng').value||0,La=L.map(function(l){return {mat:l.mat,t:l.t,ang:Math.max(l.ang||0,ang),gap:l.gap};}),r=A.evaluate(p,La,eo({v:v})),V50=A.v50Stack(p,La,eo());
  var h='<div class="lt-res '+(r.perf?'bad':'good')+'"><b>'+(r.ric?'跳彈':r.perf?'貫穿':'擋下')+'</b>　撞擊 '+fx(v,0)+' m/s，V50 '+(isFinite(V50)?fx(V50,0)+' m/s，貫穿機率 '+fx(A.pPerf(v,V50)*100,0)+'%':'∞')+(r.perf?'；殘餘 '+fx(r.vRes,0)+' m/s':'')+'</div>';
  if(r.bfd!==undefined)h+='<div class="lt-note">背面變形約 <b>'+fx(r.bfd,0)+' mm</b>：'+A.babt(r.bfd)+'</div>';
  if(r.perf&&r.vRes>0){var pp=A.cloneObj(p);pp.m=Math.max(0.1,(r.st&&r.st.mTot||p.m/1000)*1000);var g=A.gelRun(pp,r.vRes,{preDef:r.st&&r.st.def>1.2&&p.gel&&p.gel.ex?1.3:0});h+='<div class="lt-note">穿過後進入人體：凝膠穿深約 '+fx(g.pen,0)+' cm、軀幹（30 cm）內釋放 '+fx(g.eTorso,0)+' J、估計 30 秒內失能機率 '+fx(g.pInc*100,0)+'%。</div>';}
  q('bOut').innerHTML=h+layRows(r);r.v=v;BODY.an.set(La,r,p);
  var pa=PLATES.filter(function(x){return x[0]===BODY.plate;})[0][2],adP=A.stackAD(BODY.L,S.mats),adS=A.stackAD(soft,S.mats),plateKg=adP*pa,sideKg=adP*0.03,softKg=adS*BODY.softA;
  var cP=A.stackCostM2(BODY.L,S.mats,'body').usd,cS=A.stackCostM2(soft,S.mats,'body').usd,tot=plateKg*BODY.np+sideKg*BODY.side+softKg+(BODY.np+BODY.side>0?1.4:0.6);
  q('bW').innerHTML='<div class="lt-kv"><b>插板面密度</b><span>'+fx(adP,1)+' kg/m²</span><b>每片插板</b><span>'+fx(plateKg,2)+' kg（'+fx(pa*1e4,0)+' cm²），'+money(cP*pa)+'</span>'+
   '<b>側板（每片）</b><span>'+fx(sideKg,2)+' kg，'+money(cP*0.03)+'</span><b>軟甲</b><span>'+fx(adS,1)+' kg/m² × '+fx(BODY.softA,2)+' m² ＝ '+fx(softKg,2)+' kg，'+money(cS*BODY.softA)+'</span>'+
   '<b>整套（含載具背心約 1.4 kg）</b><span><b>'+fx(tot,1)+' kg</b>，'+money(cP*(pa*BODY.np+0.03*BODY.side)+cS*BODY.softA+(BODY.np+BODY.side>0?120:60))+'</span>'+
   '<b>每平方公尺</b><span>插板 '+money(cP)+'；軟甲 '+money(cS)+'</span></div>';}};
