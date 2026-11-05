
/* ===================== 爆炸與破片 ===================== */
var BL={p:'art155m107',ground:true};
RENDER.blast={init:function(){var E=pane('blast');E.innerHTML='<div class="row"><label>彈藥 <select data-k="xP">'+projOpts(BL.p,function(p){return (p.he&&p.he.g>0)||(p.mg&&p.mg.bu);})+'</select></label>'+
  '<label><input type="checkbox" data-k="xG"'+(BL.ground?' checked':'')+'> 地面爆炸（反射加成）</label></div><canvas class="lt-chart" data-k="xCv1"></canvas><canvas class="lt-chart" data-k="xCv2"></canvas><div data-k="xOut"></div>';
  q('xP').onchange=function(){BL.p=this.value;RENDER.blast.run();};q('xG').onchange=function(){BL.ground=this.checked;RENDER.blast.run();};},
 run:function(){var p=P(BL.p),w=A.heEq(p),f=A.fragments(p,{env:env(),ground:BL.ground}),h='';
  var thr=[[5,'窗玻璃破碎'],[16,'輕微受傷、門窗損壞'],[35,'耳膜破裂門檻'],[100,'約半數耳膜破裂'],[200,'肺部損傷門檻'],[700,'約半數致死（肺）']];
  h+='<div class="lt-kv"><b>炸藥</b><span>'+(p.he&&p.he.g?esc((A.EXPL[p.he.x||'tnt']||A.EXPL.tnt)[0])+' '+mass(p.he.g):'—')+(p.mg&&p.mg.bu?'＋魔爆 '+p.mg.bu+' kg':'')+'；TNT 當量 <b>'+fx(w,2)+' kg</b></span>';
  if(f)h+='<b>破片初速（Gurney）</b><span>'+fx(f.v0,0)+' m/s（裝藥／殼體質量比 '+fx(f.CM,2)+'）</span><b>破片（Mott 分布）</b><span>約 '+fx(f.N0,0)+' 片，平均 '+fx(f.MA,2)+' g，殼體 '+fx(f.caseKg,1)+' kg</span>'+
    '<b>殺傷半徑</b><span>暴露站立人員：50% 受傷 <b>'+fx(f.r50,1)+' m</b>、10% 受傷 '+fx(f.r10,0)+' m；大破片危險距離約 '+fx(f.danger,0)+' m（判準：撞擊能量 ≥ 79 J）</span>';
  h+='</div><div class="lt-sc"><table class="lt-dt"><tr><th>超壓</th><th class="l">效應</th><th>距離</th></tr>'+thr.map(function(t){return '<tr><td>'+t[0]+' kPa</td><td class="l">'+t[1]+'</td><td>'+fx(A.blastRadius(w,t[0],BL.ground),1)+' m</td></tr>';}).join('')+'</table></div>';
  q('xOut').innerHTML=h;var Rm=Math.max(10,A.blastRadius(w,5,BL.ground)),pts=[];for(var i=1;i<=60;i++){var R=Rm*i/60;pts.push([R,A.kinneyGraham(R/Math.pow(w*(BL.ground?1.8:1),1/3))*101.325]);}
  chart(q('xCv1'),{x:['距離 (m)',Rm],y:['峰值超壓 (kPa)',Math.min(pts[2][1],1000)],series:[{c:'#C62828',pts:pts,label:'峰值超壓'}],hl:[{y:35,c:'#EF6C00',label:'耳膜 35 kPa'},{y:200,c:'#6A1B9A',label:'肺 200 kPa'}]});
  if(f){var Rx=Math.max(f.r10*1.5,20),hp=[];for(i=1;i<=60;i++){var R2=Rx*i/60;hp.push([R2,1-Math.exp(-f.hitsAt(R2))]);}chart(q('xCv2'),{x:['距離 (m)',Rx],y:['被危險破片命中機率',1],series:[{c:'#37474F',pts:hp,label:'站立人員（0.5 m²）'}],vl:[{x:f.r50,c:'#C62828',label:'50%'}]});}
  else cvs(q('xCv2'),10);}};
