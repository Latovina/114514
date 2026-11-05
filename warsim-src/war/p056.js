
/* ===================== 凝膠與創傷 ===================== */
var BARR=[['none','無（裸凝膠）',[]],['cloth','厚衣物（四層牛仔布）',[['nylon',1.2]]],['steel','汽車鋼板（2 × 20 號）',[['mild',0.9,0,75],['mild',0.9]]],['wall','石膏板牆（2 × 12.7 mm）',[['gyp',12.7,0,90],['gyp',12.7]]],
  ['ply','夾板 19 mm',[['pine',19]]],['glass','汽車擋風玻璃（45°）',[['aglass',6,45]]],['vest','穿過「防彈衣」分頁的插板／軟甲',null]];
var TIS=[['gel','10% 明膠／肌肉',{}],['lung','肺（低密度、富彈性）',{rhoMul:0.45,rMul:0.4,pcMul:0.6,tissueK:0.4}],['liver','肝、腎（缺乏彈性，伸展即撕裂）',{rhoMul:1.02,rMul:1.1,tissueK:3}],['brain','腦（顱內，伸展傷害極大）',{rhoMul:1.0,rMul:0.8,tissueK:4}]];
var GEL={p:'r556m193',R:10,V:'',b:'none',tis:'gel',torso:30};
RENDER.gel={init:function(){var E=pane('gel');E.innerHTML=
  '<div class="row"><label>彈藥 <select data-k="gP">'+projOpts(GEL.p,function(p){return p.k!=='sc'&&p.k!=='he'&&p.k!=='hesh'&&p.g!=='tank'&&p.g!=='art'&&p.g!=='rkt';})+'</select></label><label>距離 <input type="number" data-k="gR" value="'+GEL.R+'" min="0" step="10"> m</label>'+
  '<label>撞擊速度 <input type="number" data-k="gV" value="'+GEL.V+'" placeholder="自動" step="10"> m/s</label></div>'+
  '<div class="row"><label>障礙物 <select data-k="gB">'+opts(BARR.map(function(b){return [b[0],b[1]];}),GEL.b)+'</select></label><label>組織 <select data-k="gT">'+opts(TIS.map(function(t){return [t[0],t[1]];}),GEL.tis)+'</select></label>'+
  '<label>軀幹厚度 <input type="number" data-k="gTo" value="'+GEL.torso+'" min="5" max="80" style="width:56px"> cm</label></div>'+
  '<canvas class="lt-chart" data-k="gCv" style="height:260px"></canvas><div data-k="gOut"></div><h4>FBI 式障礙物測試（同一彈藥、同一速度）</h4><div data-k="gFbi"></div>';
  ['gP','gR','gV','gB','gT','gTo'].forEach(function(k){q(k).onchange=function(){GEL.p=q('gP').value;GEL.R=+q('gR').value||0;GEL.V=q('gV').value;GEL.b=q('gB').value;GEL.tis=q('gT').value;GEL.torso=clamp(+q('gTo').value||30,5,80);RENDER.gel.run();};});},
 run:function(){var p=P(GEL.p),v=GEL.V!==''?+GEL.V:A.velAt(p,GEL.R,env()),tis=TIS.filter(function(t){return t[0]===GEL.tis;})[0][2];
  function through(bid){var b=BARR.filter(function(x){return x[0]===bid;})[0],L=b[2]===null?BODY.L.concat(BODY.icw?armLayers(BODY.soft):[]):b[2].map(function(l){return {mat:l[0],t:l[1],ang:l[2]||0,gap:l[3]||0};});
    if(!L.length)return {p:p,v:v,o:{},note:''};var r=A.stackKE(p,v,L,eo());if(!r.perf||r.ric)return {stop:true,r:r};
    var pp=A.cloneObj(p),mT=r.st.mTot*1000;pp.m=Math.max(0.05,Math.min(p.m,mT));var o={};if(bid==='cloth'&&p.gel&&p.gel.ex>1)o.plug=true;if(r.st.def>1.2&&p.gel&&p.gel.ex>1&&bid!=='cloth')o.preDef=Math.min(p.gel.ex,1+(r.st.def-1)*0.6);
    if(bid==='glass'||bid==='steel'){pp.gel=A.cloneObj(p.gel||{});pp.gel.nk=Math.max(2,(pp.gel.nk||20)*0.4);}
    return {p:pp,v:r.vRes,o:o,note:'穿過障礙物後 '+fx(r.vRes,0)+' m/s、剩 '+mass(pp.m)};}
  var t=through(GEL.b),h='';
  if(t.stop){q('gOut').innerHTML='<div class="lt-res good"><b>彈頭未能穿過障礙物</b></div>'+layRows(t.r);cvs(q('gCv'),10);}
  else{var o=t.o;Object.keys(tis).forEach(function(k){o[k]=tis[k];});o.torso=GEL.torso;var g=A.gelRun(t.p,t.v,o),rows=g.rows,mx=0;rows.forEach(function(r){mx=Math.max(mx,r[2]);});
    var sm2=rows.map(function(r,i){var s=0,n=0;for(var j=Math.max(0,i-3);j<=Math.min(rows.length-1,i+3);j++){s+=rows[j][2];n++;}return s/n;});var top=rows.map(function(r,i){return [r[0],sm2[i]/2];}),bot=rows.map(function(r,i){return [r[0],-sm2[i]/2];}),pt=rows.map(function(r){return [r[0],r[1]/2];}),pb=rows.map(function(r){return [r[0],-r[1]/2];});
    var ext=Math.max(20,mx/2*1.15);chart(q('gCv'),{h:260,x:['深度 (cm)',Math.max(g.pen*1.08,GEL.torso+5)],y:['半徑 (mm)',ext,-ext],fills:[{c:'rgba(239,108,0,.28)',top:top,bot:bot},{c:'rgba(183,28,28,.85)',top:pt,bot:pb}],
      series:[{c:'#EF6C00',pts:top,w:1,label:'暫時腔'},{c:'#B71C1C',pts:pt,w:1,label:'永久腔（彈體掃過）'},{c:'#EF6C00',pts:bot,w:1}],vl:[{x:GEL.torso,c:'#1565C0',label:'軀幹背側'}].concat(g.neck?[{x:g.neck,c:'#555',label:'翻滾'}]:[])});
    h='<div class="lt-res '+(g.pen>=30&&g.pen<=45?'good':'warn')+'">穿深 <b>'+fx(g.pen,0)+' cm</b>（FBI 建議 30–45 cm）；最大暫時腔 '+fx(g.maxTC/10,1)+' cm（深 '+fx(g.maxTCx,0)+' cm）</div>'+
     '<div class="lt-kv"><b>撞擊</b><span>'+fx(t.v,0)+' m/s，'+fx(g.E0,0)+' J'+(t.note?'；'+t.note:'')+'</span><b>頸長（翻滾起點）</b><span>'+(g.neck?fx(g.neck,0)+' cm':(g.expanded?'擴張後保持彈頭向前':'—'))+'</span>'+
     '<b>擴張</b><span>'+(g.expanded?fx(g.exp,2)+' 倍（'+fx(t.p.d*g.exp,1)+' mm）':'無')+(o.plug?'（被衣物堵塞，擴張失效）':'')+'</span><b>碎裂</b><span>'+(g.frag?g.frag+' 片、共 '+mass(g.fragM)+'（保留 '+mass(g.retained)+'）':'無')+'</span>'+
     '<b>軀幹內釋放能量</b><span>'+fx(g.eTorso,0)+' J（前 '+GEL.torso+' cm）'+(g.exitV>0?'；<b>貫穿身體</b>，出口速度約 '+fx(g.exitV,0)+' m/s，有誤傷後方風險':'')+'</span>'+
     '<b>永久腔體積</b><span>'+fx(g.crush,0)+' cm³（彈體壓碎）＋伸展撕裂 '+fx(g.stretch,0)+' cm³（暫時腔）</span>'+
     '<b>30 秒內失能機率（軀幹中央命中）</b><span><b>'+fx(g.pInc*100,0)+'%</b>（以有效永久腔 '+fx(g.pcEff,0)+' cm³ 估算，非致死率）</span></div>';
    q('gOut').innerHTML=h;}
  var fb=BARR.filter(function(b){return b[2]!==null;}).map(function(b){var tt=through(b[0]);if(tt.stop)return '<tr><td class="l">'+b[1]+'</td><td colspan="5" class="l">未穿過</td></tr>';var g2=A.gelRun(tt.p,tt.v,tt.o);
    return '<tr><td class="l">'+b[1]+'</td><td>'+fx(tt.v,0)+'</td><td>'+fx(g2.pen,0)+'</td><td>'+(g2.expanded?fx(g2.exp,2)+'×':'—')+'</td><td>'+mass(g2.retained)+'</td><td>'+fx(g2.maxTC/10,1)+'</td></tr>';}).join('');
  q('gFbi').innerHTML='<div class="lt-sc"><table class="lt-dt"><tr><th class="l">障礙物</th><th>入射速度</th><th>穿深 cm</th><th>擴張</th><th>保留重</th><th>最大暫時腔 cm</th></tr>'+fb+'</table></div>';}};
