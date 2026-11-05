/* ===================== 雜項介面：單一單位的男女比例（作戰頁單位面板、編制頁） ===================== */
var FEMP=[0,1,2,5,10,15,20,30,40,50,60,80,100];
function femState(u){var L=isLeaf(u)?[u]:leavesOf(u).filter(alive);if(!L.length)L=[u];var own=L.filter(function(x){return typeof x.femR==='number';}),same=own.length===L.length&&own.every(function(x){return Math.abs(x.femR-own[0].femR)<1e-6;});
  return {set:same?own[0].femR:null,mixed:own.length>0&&!same,auto:sum(L,function(x){return femAuto(x)*Math.max(1,x.men||1);})/Math.max(1,sum(L,function(x){return Math.max(1,x.men||1);}))};}
function femSel(u,cls){var F=femState(u),v=F.set===null?'':String(Math.round(F.set*100));var o='<select data-c="'+cls+'" data-v="'+u.id+'"><option value=""'+(v===''?' selected':'')+'>自動（依陣營與兵種：約 '+pct(F.auto*100,1)+'）</option>';
  FEMP.forEach(function(p){o+='<option value="'+p+'"'+(v===String(p)?' selected':'')+'>'+p+'%</option>';});if(v!==''&&FEMP.indexOf(+v)<0)o+='<option value="'+v+'" selected>'+v+'%</option>';return o+'</select>'+(F.mixed?'<span class="lw-note">（下級單位各不相同）</span>':'');}
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);var me=mySide();if(!(me===null||u.side===me))return o;if(ST(u).dom==='air'&&leaf)return o;
  return o+'<span>女性比例</span><span>'+femSel(u,'femr')+(leaf?'':'<br><span class="lw-note">套用到轄下所有單位</span>')+'</span>';};})();
CHG.femr=function(t){var u=uById(+t.getAttribute('data-v'));if(!u)return;femSet(u,t.value===''?undefined:+t.value/100);toast(uName(u)+'：女性比例'+(t.value===''?'恢復自動':' '+t.value+'%'));btStatus();};
/* 編制頁的單位明細：在經驗、訓練、士氣那一列加上女性比例 */
(function(){var b=obDet;obDet=function(){b.apply(this,arguments);var el=UI.body&&UI.body.querySelector('[data-k="obdet"]'),u=OB.sel?uById(OB.sel):null;if(!el||!u)return;var inp=el.querySelector('input[data-f="trn"]'),row=inp&&inp.closest('.lw-row');if(!row)return;
  var lab=document.createElement('label');lab.innerHTML='女性 '+femSel(u,'obfem');row.appendChild(lab);};})();
CHG.obfem=function(t){var u=uById(+t.getAttribute('data-v'));if(!u)return;femSet(u,t.value===''?undefined:+t.value/100);obTree();};
HELP14.push('<h4>單一單位的男女比例</h4><ul><li>作戰頁的單位面板與編制頁的單位明細都可以設定「女性比例」：自動（依陣營設定、兵種與年代）或 0%～100%；對編制設定會套用到轄下所有單位。影響傷亡、醫療與戰報裡的男女統計，也會隨編制檔匯出與匯入、隨存檔保存。</li></ul>');
