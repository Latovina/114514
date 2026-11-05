/* ===================== 飛機的出擊掛載（介面）：下令時選這一趟的掛載、單位面板顯示目前與下一趟的掛載、說明 ===================== */
var LDOK=/^(strike|bomb|attack|bombard|bombzone|carpet|patrol|recon|escort)$/;
function ldAirLeaves(us){var L=[];(us||[]).forEach(function(u){(isLeaf(u)?[u]:leavesOf(u)).forEach(function(l){if(alive(l)&&ST(l).dom==='air'&&L.indexOf(l)<0)L.push(l);});});return L;}
(function(){var b=v4Opts;v4Opts=function(k,O,us){var o=b(k,O,us);if(!LDOK.test(k))return o;var A=ldAirLeaves(us);if(!A.length)return o;var ks=[];A.forEach(function(l){ldList(l).forEach(function(q){if(ks.indexOf(q)<0)ks.push(q);});});
  var v=O.ld&&(O.ld==='auto'||ks.indexOf(O.ld)>=0)?O.ld:'auto';return o+'<span>掛載</span><select data-c="oo" data-f="ld" title="這一趟出擊的掛載；回基地整補後下一趟可以換">'+[['auto','依任務自動']].concat(Object.keys(LDK).filter(function(q){return ks.indexOf(q)>=0;}).map(function(q){return [q,ldName(q)+'：'+LDK[q].d];})).map(function(q){return '<option value="'+q[0]+'"'+(v===q[0]?' selected':'')+'>'+esc(q[1])+'</option>';}).join('')+'</select>';};})();
(function(){var b=optsFor;optsFor=function(k){var o=b(k);if(LDOK.test(k)&&UI.ordOpt.ld&&UI.ordOpt.ld!=='auto')o.ld=UI.ordOpt.ld;return o;};})();
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);if(!leaf||ST(u).dom!=='air')return o;var q=u.ord,nx=q&&q.opt&&q.opt.ld&&q.opt.ld!=='auto'&&ldOk(u,q.opt.ld)?ldName(q.opt.ld):'依任務自動';
  return o+'<span>掛載</span><span>'+(u.st==='air'&&u.ld?esc(ldName(u.ld))+'（第 '+(u.ldN||u.sorties||1)+' 架次）':'下一趟：'+esc(nx))+'</span>';};})();
if(typeof HELP14!=='undefined')HELP14.push('<h4>飛機的出擊掛載</h4><ul>'+
  '<li>每一架次（從基地起飛、飛到戰場上空算一次）起飛前選定掛載，下令時在命令選項的「掛載」選；回基地整補後下一趟可以換。沒有選就依任務自動：巡邏掛空戰武器、偵察掛相機、目標附近有船艦掛反艦武器、有防空陣地掛反輻射飛彈，其他用標準掛載。</li>'+
  '<li>標準掛載是原廠配置。空戰（機槍或空對空飛彈）空戰較強但幾乎不能對地；炸彈對地較強、掛彈後空戰較差、平民傷亡較多；機砲與火箭做近接支援；空對地飛彈或精準導引武器（1965 年起）打戰車與點目標、誤傷平民較少；魚雷或反艦飛彈專打船艦；反輻射飛彈壓制防空陣地；偵察相機或莢艙看得更遠，幾乎不能攻擊。能選什麼依機種（戰鬥機、攻擊機、轟炸機、直升機、無人機、偵察機）與年代。</li>'+
  '<li>單位面板顯示這一趟的掛載與架次；在基地時顯示下一趟會掛什麼。</li></ul>');
