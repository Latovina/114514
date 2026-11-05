
/* ===================== 材料庫 ===================== */
var MT={id:'mana'};
var MF=[['n','名稱','text'],['cat','類別','sel',function(){return Object.keys(CATN).map(function(k){return [k,CATN[k]];});}],['rho','密度 g/cm³','num'],['bhn','布氏硬度 HB','num'],['hv','維氏硬度 HV（陶瓷）','num'],
 ['ys','降伏強度 MPa','num'],['uts','抗拉強度 MPa','num'],['E','彈性模數 GPa','num'],['el','伸長率 %','num'],['rt','靶材阻抗 Rt GPa（非金屬）','num'],
 ['fs','纖維強度 GPa','num'],['fe','纖維破斷應變','num'],['fE','纖維模數 GPa','num'],['mx','織物效率 0–1','num'],['hard','熱壓硬板','chk'],
 ['yp','作彈芯時流動應力 GPa','num'],['brit','脆性（易碎裂）','chk'],['lo','長桿類別','sel',function(){return [['','—'],['W','重金屬（鎢、鈾）'],['S','鋼']];}],['ss','自銳係數','num'],['fh','表面硬化','chk'],
 ['tek','對動能 RHA 厚度效率（複合）','num'],['tec','對化學能 RHA 厚度效率（複合）','num'],['ce','對聚能射流額外係數','num'],['era.ke','反應裝甲：削弱長桿','num'],['era.ce','反應裝甲：削弱射流','num'],['era.st','反應裝甲：鋼板等效比例','num'],['era.min','反應裝甲：最小有效傾角 °','num'],['era.trig','爆炸式（串聯可破）','chk'],['era.slat','柵欄攔截機率','num'],
 ['bfd','背面變形係數','num'],['mh.0','多發損傷半徑（彈徑倍數）','num'],['mh.1','損傷區剩餘效能 0–1','num'],['usd','原料價 美元/kg','num'],['fab','裝甲加工倍率','num'],['proc','彈頭零件加工倍率','num'],
 ['mg.sh','【魔能】護盾 kJ／發','num'],['mg.hd','【魔能】硬化（阻抗 +倍）','num'],['mg.ke','【魔能】對動能厚度倍率','num'],['mg.ce','【魔能】對化學能厚度倍率','num'],['mg.df','【魔能】偏斜場 °','num'],
 ['mg.el','【魔能】屬性','sel',function(){return A.ELEM.map(function(e,i){return [i,e];});}],['mg.rg','【魔能】再生 %／秒','num'],['mg.cap','【魔能】護盾容量 kJ（多發）','num'],['note','備註','text']];
RENDER.mat={init:function(){var E=pane('mat');E.innerHTML='<div class="lt-info">「魔能素」等架空材料可自由設定物理性質與魔能性質：護盾吸收每發的能量、硬化提高靶材阻抗、偏斜場加大有效傾角、屬性相剋（同屬性強化、受剋屬性削弱）、多發時的容量與再生；破魔彈頭會削減這些效果。全域「魔能充能」整體縮放。</div>'+
  '<div class="row"><label>材料 <select data-k="tM">'+matOpts(MT.id)+'</select></label><button type="button" data-k="tDup">複製為新材料</button><button type="button" data-k="tNew">新增魔能素材料</button><button type="button" data-k="tDel">刪除／還原</button></div>'+
  '<div data-k="tOut"></div><details class="lt-grp" open><summary>參數</summary><div data-k="tF"></div><div class="row"><button type="button" class="lt-pri" data-k="tApply">套用</button></div></details><h4>全部材料</h4><div data-k="tAll"></div>';
  q('tM').onchange=function(){MT.id=this.value;RENDER.mat.run();};
  q('tDup').onclick=function(){var m=A.cloneObj(M(MT.id));m.id='um'+Date.now().toString(36);m.n=m.n+'（自訂）';m._u=1;S.mats.push(m);MT.id=m.id;libChanged();};
  q('tNew').onclick=function(){var m={id:'um'+Date.now().toString(36),n:'新魔能素材料',cat:'metal',rho:4.5,bhn:450,ys:1300,uts:1600,E:140,el:12,usd:500,fab:2.5,bfd:0.009,mh:[1.2,0.85],mg:{sh:3,hd:0.5,ke:1,ce:1,df:3,el:0,rg:2,cap:40},_u:1};S.mats.push(m);MT.id=m.id;libChanged();};
  q('tDel').onclick=function(){var i=idxOf(S.mats,MT.id);if(i<0)return;if(BASEM[MT.id])S.mats[i]=A.cloneObj(A.MATS.filter(function(x){return x.id===MT.id;})[0]);else{S.mats.splice(i,1);MT.id='rha';}libChanged();};
  q('tApply').onclick=function(){var m=M(MT.id);readFields(q('tF'),m,MF);if(m.mg&&!Object.keys(m.mg).length)delete m.mg;if(m.era&&!Object.keys(m.era).length)delete m.era;m._u=1;libChanged();};},
 run:function(){var m=M(MT.id),rt=A.rtOf(m)/1e9,h='<div class="lt-kv"><b>靶材阻抗 Rt</b><span>'+fx(rt,2)+' GPa</span>';
  if(m.cat==='fiber')h+='<b>Cunniff 速度 U*^(1/3)</b><span>'+fx(A.cunniffU(m),0)+' m/s（越高越好；芳綸約 700、超高分子量聚乙烯約 900）</span>';
  var ref=P('r762m61'),lr=P('t120dm53'),sc=P('rpg7vl');
  try{var tk=A.perfLimit(lr,1600,m.id,0,eo()),tr=A.perfLimit(lr,1600,'rha',0,eo()),tc=A.perfLimit(sc,0,m.id,0,eo()),tcr=A.perfLimit(sc,0,'rha',0,eo());
    h+='<b>對長桿彈（DM53 1600 m/s）</b><span>需 '+fx(tk,0)+' mm 才擋得住；厚度效率 '+fx(tr/tk,2)+'、質量效率 '+fx(tr/tk*7.85/m.rho,2)+'</span><b>對聚能射流（PG-7VL）</b><span>需 '+fx(tc,0)+' mm；厚度效率 '+fx(tcr/tc,2)+'、質量效率 '+fx(tcr/tc*7.85/m.rho,2)+'</span>';
    h+='<b>對 7.62 M61 穿甲彈（100 m）</b><span>需 '+fx(A.perfLimit(ref,A.velAt(ref,100,env()),m.id,0,eo()),1)+' mm</span>';}catch(e){}
  h+='<b>價格</b><span>原料 '+money(m.usd||0)+'／kg；做成裝甲每 10 mm 每 m² 約 '+money(10*m.rho*(m.usd||0)*(m.fab||1))+'</span>';if(m.note)h+='<b>備註</b><span>'+esc(m.note)+'</span>';
  q('tOut').innerHTML=h+'</div>';q('tF').innerHTML=fieldHtml(m,MF);
  q('tAll').innerHTML='<div class="lt-sc"><table class="lt-dt"><tr><th class="l">材料</th><th class="l">類別</th><th>密度</th><th>硬度</th><th>Rt GPa</th><th>價格（'+esc(curN())+'/kg）</th><th class="l">魔能</th></tr>'+S.mats.map(function(x){return '<tr class="ck" data-m="'+esc(x.id)+'"><td class="l">'+esc(x.n)+'</td><td class="l">'+CATN[x.cat]+'</td><td>'+fx(x.rho,2)+'</td><td>'+(x.bhn?x.bhn+' HB':x.hv?x.hv+' HV':'—')+'</td><td>'+fx(A.rtOf(x)/1e9,2)+'</td><td>'+fx((x.usd||0)/curC().usd,1)+'</td><td class="l">'+(x.mg?'✦ 護盾 '+(x.mg.sh||0)+' kJ、'+A.ELEM[x.mg.el||0]:'')+'</td></tr>';}).join('')+'</table></div>';
  q('tAll').onclick=function(e){var tr=e.target.closest('tr[data-m]');if(!tr)return;MT.id=tr.getAttribute('data-m');q('tM').value=MT.id;RENDER.mat.run();window.scrollTo(0,root.offsetTop);};}};
