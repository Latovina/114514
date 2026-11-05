
/* ===================== 穿甲模擬 ===================== */
var PEN={p:'r762m61',R:100,V:'',arm:'b3ar',L:armLayers('b3ar'),cov:1};
RENDER.pen={init:function(){var E=pane('pen');E.innerHTML=
  '<div class="row"><label>彈藥 <select data-k="pP">'+projOpts(PEN.p)+'</select></label><label>距離 <input type="number" data-k="pR" value="'+PEN.R+'" min="0" step="50"> m</label>'+
  '<label title="留白＝依外彈道計算">撞擊速度 <input type="number" data-k="pV" value="'+PEN.V+'" placeholder="自動" step="10"> m/s</label></div>'+
  '<div class="row"><label>裝甲 <select data-k="pA">'+armOpts(PEN.arm)+'</select></label><label>覆蓋面積 <input type="number" data-k="pCov" value="'+PEN.cov+'" min="0" step="0.05"> m²</label></div>'+
  '<div data-k="pL"></div><div data-k="pAn"></div><div data-k="pOut"></div><canvas class="lt-chart" data-k="pCv2"></canvas><div class="lt-note" data-k="pNote"></div>';
  PEN.an=new Anim(q('pAn'));layerEditor(q('pL'),function(){return PEN.L;},function(L){PEN.L=L;q('pA').value='';},function(){RENDER.pen.run();});
  q('pP').onchange=function(){PEN.p=this.value;RENDER.pen.run();};q('pR').onchange=function(){PEN.R=Math.max(0,+this.value||0);RENDER.pen.run();};q('pV').onchange=function(){PEN.V=this.value;RENDER.pen.run();};
  q('pCov').onchange=function(){PEN.cov=Math.max(0,+this.value||0);RENDER.pen.run();};
  q('pA').onchange=function(){PEN.arm=this.value;if(this.value){PEN.L=armLayers(this.value);RENDER.pen.init();}RENDER.pen.run();};},
 run:function(){var p=P(PEN.p),v=PEN.V!==''?+PEN.V:A.velAt(p,PEN.R,env()),L=PEN.L,o=eo({v:v}),r=A.evaluate(p,L,o),h='',kind=p.k;S.last={p:p,v:v,L:L,r:r};
  var ke=kind!=='sc'&&kind!=='he'&&kind!=='hesh',V50=ke?A.v50Stack(p,L,eo()):null,pp=ke?A.pPerf(v,V50):(r.perf?1:0);
  var verdict=r.ric?'跳彈':r.perf?(kind==='hesh'?'背面剝落（碎甲）':'貫穿'):'擋下';
  h+='<div class="lt-res '+(r.perf?'bad':'good')+'"><b>'+verdict+'</b>'+(ke&&isFinite(V50)?'　極限速度 V50 ≈ '+fx(V50,0)+' m/s；此速度貫穿機率 '+fx(pp*100,0)+'%':'')+
    (ke&&!isFinite(V50)?'　此彈在任何合理速度都無法貫穿':'')+(r.perf&&ke?'；殘餘速度 '+fx(r.vRes,0)+' m/s、殘餘質量 '+mass(r.mRes*1000):'')+(kind==='sc'?'　射流穿深 '+fx(r.cap0,0)+' mm RHA，剩餘 '+fx(r.capRes,0)+' mm':'')+'</div>';
  if(r.bfd!==undefined)h+='<div class="lt-note">背面變形（黏土）約 <b>'+fx(r.bfd,0)+' mm</b>：'+A.babt(r.bfd)+'</div>';
  if(r.burst)h+='<div class="lt-note">彈頭魔爆：'+r.burst+' kg TNT 當量，'+fx(A.blastRadius(r.burst,35,true),1)+' m 內耳膜破裂、'+fx(A.blastRadius(r.burst,200,true),1)+' m 內肺部損傷。</div>';
  if(r.perf&&ke&&r.vRes>0){var er=0.5*r.mRes*r.vRes*r.vRes;h+='<div class="lt-note">裝甲後方：殘餘動能 '+fx(er/1000,2)+' kJ'+(L.length&&M(L[L.length-1].mat).cat==='metal'?'；鋼板背面預計噴出約 '+fx(8+Math.pow(er,0.55)/4,0)+' 片剝落破片（加裝防剝落襯層可縮小噴射錐）':'')+'。</div>';}
  h+=layRows(r);
  /* RHA equivalence and immunity range */
  var eqTxt='',rhaEq=null;if(ke&&isFinite(V50)&&V50>30){rhaEq=A.perfLimit(p,V50,'rha',0,eo());eqTxt='對此彈約等效 <b>'+fx(rhaEq,1)+' mm RHA</b>（垂直）';}
  else if(kind==='sc'){var s=0;r.layers.forEach(function(l){if(l.te)s+=l.los*l.te;});eqTxt='對聚能射流約等效 '+fx(s,0)+' mm RHA（不含反應裝甲效應）';}
  h+='<h4>裝甲</h4>'+(eqTxt?'<div class="lt-note">'+eqTxt+'</div>':'')+armSummary(L,PEN.cov,PEN.arm&&ARM.filter(function(a){return a[0]===PEN.arm;})[0]?ARM.filter(function(a){return a[0]===PEN.arm;})[0][1]==='body'?'body':'veh':'veh');
  h+='<h4>彈藥</h4>'+projSummary(p,v);
  q('pOut').innerHTML=h;PEN.an.set(L,r,p);
  /* penetration vs range */
  var maxR=p.guided?Math.max(1000,PEN.R*1.5):kind==='lr'?4000:p.g==='pistol'?300:p.g==='shot'?150:p.g==='rifle'?1500:p.g==='hmg'?2500:3000,tab=A.flyTable(p,maxR,maxR/24,env()),th=L.length?(L[0].ang||0):0,pts=[],ptsA=[],last=null;
  if(kind!=='he'&&kind!=='hesh'){tab.forEach(function(row){var lim=A.perfLimit(p,row[1],'rha',0,eo());pts.push([row[0],lim]);ptsA.push([row[0],lim*Math.cos(th*D2R)/Math.max(0.05,Math.cos(th*D2R))]);
      var rr=A.evaluate(p,L,eo({v:row[1]}));if(rr.perf&&!rr.ric)last=row[0];});
    var ym=0;pts.forEach(function(x){ym=Math.max(ym,x[1]);});if(rhaEq)ym=Math.max(ym,rhaEq*1.1);
    chart(q('pCv2'),{x:['距離 (m)',maxR],y:['RHA 垂直穿深 (mm)',ym*1.05],series:[{c:'#C62828',pts:pts,label:'穿深（RHA，0°）'}],hl:rhaEq?[{y:rhaEq,c:'#1565C0',label:'此裝甲的 RHA 等效 '+fx(rhaEq,0)+' mm'}]:[],vl:[{x:Math.min(PEN.R,maxR),c:'#555',label:'目前距離'}]});
    q('pNote').innerHTML=last===null?'在 0–'+fx(maxR,0)+' m 內都無法貫穿此裝甲。':last>=maxR?'在 0–'+fx(maxR,0)+' m 全程皆可貫穿。':'最遠約 <b>'+fx(last,0)+' m</b> 內可貫穿（之外為此裝甲的免疫區）。';}
  else{cvs(q('pCv2'),10);q('pNote').textContent='';}}};
