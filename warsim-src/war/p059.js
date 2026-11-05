
/* ===================== 彈藥設計與計價 ===================== */
var AM={p:'r556m855',R:600};
var PF=[['n','名稱','text'],['g','類別','sel',function(){return Object.keys(A.GROUPS).map(function(k){return [k,A.GROUPS[k][0]];});}],['k','彈種','sel',function(){return Object.keys(A.KINDN).map(function(k){return [k,A.KINDN[k]];});}],
 ['d','口徑 mm','num'],['L','彈長 mm','num'],['m','彈頭質量 g','num'],['v0','初速 m/s','num'],['bc','彈道係數 lb/in²','num'],['dm','阻力模型','sel',function(){return [['G1','G1（平底）'],['G7','G7（船尾）']];}],
 ['cap','被帽（AP cap）','chk'],['dfm','受撞變形度 0–1','num'],['core.mat','彈芯材料','mat'],['core.m','彈芯質量 g','num'],['core.d','彈芯直徑 mm','num'],['core.L','彈芯長 mm（長桿）','num'],['core.N','頭形係數 N（尖 0.1／圓 0.5／平 1）','num'],
 ['cs.mat','彈殼材料','mat'],['cs.g','彈殼重 g','num'],['prop','發射藥 g','num'],['rw','全彈重 g（覆寫）','num'],['cx','製造複雜度係數','num'],
 ['he.x','炸藥','sel',function(){return [['','—']].concat(Object.keys(A.EXPL).map(function(k){return [k,A.EXPL[k][0]];}));}],['he.g','炸藥量 g','num'],['he.tw','殼壁厚 mm','num'],
 ['sc.cd','聚能裝藥直徑 mm','num'],['sc.k','穿深（裝藥直徑倍數）','num'],['sc.pr','精度 1–5','num'],['sc.so','炸高（裝藥直徑倍數）','num'],['sc.ln','藥型罩','sel',function(){return [['cu','銅'],['ta','鉭'],['mo','鉬'],['fe','鋼'],['al','鋁'],['mana','魔晶']];}],['sc.tan','串聯前驅裝藥','chk'],
 ['gel.cd','凝膠阻力係數（彈頭向前）','num'],['gel.nk','頸長 cm','num'],['gel.vf','碎裂門檻 m/s','num'],['gel.ff','碎裂比例 0–1','num'],['gel.ex','擴張倍率','num'],['gel.vx','擴張門檻 m/s','num'],
 ['pel','彈丸數','num'],['pm','每粒重 g','num'],['pd','每粒直徑 mm','num'],
 ['mg.bo','【魔能】動能增幅（0.3＝+30%）','num'],['mg.pi','【魔能】穿甲倍率','num'],['mg.dp','【魔能】破魔 0–1','num'],['mg.bu','【魔能】魔爆當量 kg TNT','num'],['mg.el','【魔能】屬性','sel',function(){return A.ELEM.map(function(e,i){return [i,e];});}],
 ['mg.mc','【魔能】魔晶用量 g','num'],['mg.mcp','【魔能】魔晶單價 美元/kg','num'],['mg.st','【魔能】穩定度 0–1','num']];
function gp(o,path){var a=path.split('.'),x=o;for(var i=0;i<a.length;i++){if(x===undefined||x===null)return undefined;x=x[a[i]];}return x;}
function sp(o,path,v){var a=path.split('.'),x=o;for(var i=0;i<a.length-1;i++){if(typeof x[a[i]]!=='object'||x[a[i]]===null)x[a[i]]={};x=x[a[i]];}if(v===''||v===undefined||(typeof v==='number'&&!isFinite(v)))delete x[a[a.length-1]];else x[a[a.length-1]]=v;}
function fieldHtml(o,F){return '<div class="lt-form">'+F.map(function(f){var v=gp(o,f[0]),id=f[0],inp;
  if(f[2]==='sel')inp='<select data-pf="'+id+'">'+opts(f[3](),v===undefined?'':v)+'</select>';else if(f[2]==='mat')inp='<select data-pf="'+id+'"><option value="">—</option>'+matOpts(v)+'</select>';
  else if(f[2]==='chk')inp='<input type="checkbox" data-pf="'+id+'"'+(v?' checked':'')+'>';else if(f[2]==='text')inp='<input type="text" data-pf="'+id+'" value="'+esc(v)+'" style="width:15em">';
  else inp='<input type="number" data-pf="'+id+'" value="'+(v===undefined?'':v)+'" step="any">';return '<label>'+f[1]+' '+inp+'</label>';}).join('')+'</div>';}
function readFields(box,o,F){F.forEach(function(f){var el=box.querySelector('[data-pf="'+f[0]+'"]');if(!el)return;var v;if(f[2]==='chk')v=el.checked?1:'';else if(f[2]==='num')v=el.value===''?'':+el.value;else if(f[2]==='sel'&&f[0]==='mg.el')v=+el.value||'';else v=el.value;sp(o,f[0],v);});}
RENDER.ammo={init:function(){var E=pane('ammo');E.innerHTML='<div class="row"><label>彈藥 <select data-k="aP">'+projOpts(AM.p)+'</select></label><button type="button" data-k="aDup">複製為新彈藥</button><button type="button" data-k="aNew">新增空白彈藥</button><button type="button" data-k="aDel">刪除／還原</button>'+
  '<label>彈道表最遠 <input type="number" data-k="aR" value="'+AM.R+'" step="100" style="width:70px"> m</label></div><div data-k="aOut"></div><details class="lt-grp" open><summary>參數（修改後按「套用」）</summary><div data-k="aF"></div><div class="row"><button type="button" class="lt-pri" data-k="aApply">套用</button><span class="lt-note">修改內建彈藥會另存為你的版本（✎），可用「刪除／還原」回到原值。</span></div></details>';
  q('aP').onchange=function(){AM.p=this.value;RENDER.ammo.run();};q('aR').onchange=function(){AM.R=Math.max(10,+this.value||600);RENDER.ammo.run();};
  q('aDup').onclick=function(){var p=A.cloneObj(P(AM.p));p.id='u'+Date.now().toString(36);p.n=p.n+'（自訂）';p._u=1;S.proj.push(p);AM.p=p.id;libChanged();};
  q('aNew').onclick=function(){var p={id:'u'+Date.now().toString(36),n:'新彈藥',g:'rifle',k:'core',d:7.62,L:30,m:9,v0:850,bc:0.2,dm:'G7',dfm:0.1,core:{mat:'hsteel',m:4,d:6,N:0.12},cs:{mat:'brass',g:12},prop:3,bom:[['hsteel',4],['lead',3],['gm',2]],cx:1.3,gel:{cd:0.24,nk:18},_u:1};S.proj.push(p);AM.p=p.id;libChanged();};
  q('aDel').onclick=function(){var i=idxOf(S.proj,AM.p);if(i<0)return;if(BASEP[AM.p]){var b=A.cloneObj(A.PROJ.filter(function(x){return x.id===AM.p;})[0]);A.calibrateCost(b,S.mats);S.proj[i]=b;}else{S.proj.splice(i,1);AM.p=S.proj[0].id;}libChanged();};
  q('aApply').onclick=function(){var p=P(AM.p);readFields(q('aF'),p,PF);p._u=1;var cm=p.core&&p.core.mat;if(p.bom&&cm&&p.bom.length&&p.core.m){p.bom[0]=[cm,p.core.m];}libChanged();};},
 run:function(){var p=P(AM.p),c=costP(p),rm=A.roundMass(p),sm=small(p),tab=A.flyTable(p,AM.R,AM.R/10,env()),h='';
  h+='<div class="lt-kv"><b>單價</b><span>'+money(c.usd)+'（市場 ×'+c.mk+'、批量學習曲線 ×'+fx(c.learn,2)+'、製造複雜度 ×'+fx(c.cx,2)+'）</span>'+
   (sm?'<b>每 30 顆</b><span>'+money(c.usd*30)+'；<b>重 '+mass(rm*30)+'</b></span><b>每 1,000 顆</b><span>'+money(c.usd*1000)+'；'+mass(rm*1000)+'</span>':'')+
   '<b>'+(sm?'每顆全彈重':'全彈重')+'</b><span>'+mass(rm)+'（彈頭 '+mass(p.m)+(p.cs&&p.cs.g?'、彈殼 '+mass(p.cs.g):'')+(p.prop?'、發射藥 '+mass(p.prop):'')+'）</span>'+
   '<b>截面密度</b><span>'+fx((p.m||0)/1000/Math.pow((p.d||1)/1000,2),0)+' kg/m²</span><b>初速／砲口動能</b><span>'+fx(p.v0,0)+' m/s，'+fx(0.5*(p.m||0)/1000*p.v0*p.v0/1000,2)+' kJ</span></div>';
  h+='<h4>造價分解（原料與製程，未乘係數）</h4><div class="lt-sc"><table class="lt-dt"><tr><th class="l">項目</th><th>成本</th></tr>'+c.raw.parts.map(function(x){return '<tr><td class="l">'+esc(x[0])+'</td><td>'+moneyT(x[1])+'</td></tr>';}).join('')+'<tr class="sum"><td class="l">合計（未乘係數）</td><td>'+moneyT(c.raw.sum)+'</td></tr></table></div>';
  if(p.k!=='sc'&&p.k!=='he'&&p.k!=='hesh'||p.bc){h+='<h4>外彈道</h4><div class="lt-sc"><table class="lt-dt"><tr><th>距離 m</th><th>速度 m/s</th><th>能量 J</th><th>飛行 s</th><th>下墜 cm</th><th>風偏 cm</th>'+(p.k==='sc'?'':'<th>RHA 穿深 mm</th>')+'</tr>'+
    tab.map(function(r){return '<tr><td>'+fx(r[0],0)+'</td><td>'+fx(r[1],0)+'</td><td>'+fx(0.5*(p.m||0)/1000*r[1]*r[1],0)+'</td><td>'+fx(r[2],3)+'</td><td>'+fx(r[3]*100,1)+'</td><td>'+fx(r[4]*100,1)+'</td>'+(p.k==='sc'||p.k==='he'||p.k==='hesh'?'':'<td>'+fx(A.perfLimit(p,r[1],'rha',0,eo()),1)+'</td>')+'</tr>';}).join('')+'</table></div>';}
  q('aOut').innerHTML=h;q('aF').innerHTML=fieldHtml(p,PF);}};
