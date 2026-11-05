/* ===================== 鐵的紀律與政委介面：陣營政策「軍紀制度」、編制詳情與作戰面板的「派駐政委」、戰報的處決人數、說明 ===================== */
var REGP=[['normal','一般軍紀','依軍法處理違紀，部隊受壓時可以自行有序後撤'],['iron','鐵的紀律','不准後退、嚴懲逃兵與違紀：犯罪與逃亡大幅減少、部隊很少潰散或投降，但傷亡率飆升，督戰與處決也造成自己人的死亡']];
(function(){var b=sideV4Html;sideV4Html=function(side){var o=b(side),P=polSide(side),h='<span>軍紀制度</span>'+selH('spol','reg',REGP,P.reg||'normal');var i=o.indexOf('<span>投降</span>');return i>=0?o.slice(0,i)+h+o.slice(i):o;};})();
function commTxt(u){var c=commOf(u);return c?(c===u?'已派駐':'由'+uName(c)+'派駐'):'';}
(function(){var b=formV4Html;formV4Html=function(u){var o=b(u),c=commOf(u),inh=c&&c!==u;
  return o+'<h4 style="margin:10px 0 4px;font-size:13px">政委</h4><div class="lw-row"><label title="政委負責政治工作與督戰：部隊較不容易潰散、撤退或投降，軍紀較好，但傷亡較重；派駐在編制上會涵蓋全部下級"><input type="checkbox" data-c="ucomm" data-v="'+u.id+'"'+(u.comm?' checked':'')+(inh?' disabled':'')+'>派駐政委</label>'+(inh?'<span class="lw-note">已由上級'+esc(uName(c))+'派駐</span>':'')+'</div>';};})();
CHG.ucomm=function(t){var u=uById(+t.getAttribute('data-v'));if(!u)return;u.comm=t.checked?1:0;if(G.started)decLog(u.side,'玩家',(u.comm?'向':'撤回')+uName(u)+(u.comm?'派駐政委':'的政委'));toast(uName(u)+(u.comm?'：派駐政委（涵蓋全部下級）':'：撤回政委'));
  if(UI.tab==='orbat'&&typeof obDet==='function')obDet();else if(typeof btStatus==='function')btStatus();};
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);var me=mySide();if(me!==null&&u.side!==me&&!seeAll())return o;if(ST(u).dom!=='land')return o;var lv=ironLv(u),c=commOf(u),mine=me===null||u.side===me;
  var t=[];if(ironSide(u.side))t.push('鐵的紀律');if(c)t.push('政委'+(c===u?'':'（'+uName(c)+'）'));
  o+='<span>督戰</span><span>'+(t.length?'<b>'+esc(t.join('、'))+'</b><br><span class="lw-note">潰散門檻 ×'+fx(ironRt(u),2)+'、承受殺傷 ×'+fx(ironCas(u),2)+'、軍紀 +'+ironDisB(u)+'；不自行後撤、很少投降</span>':'<span class="lw-note">一般軍紀</span>')+
    (mine&&(!c||c===u)?'<br><label><input type="checkbox" data-c="ucomm" data-v="'+u.id+'"'+(u.comm?' checked':'')+'>派駐政委</label>':'')+'</span>';return o;};})();
/* 戰報：各方因督戰與處決而死亡的人數 */
(function(){var b=theaterText;theaterText=function(){var t=b();var a=SIDES().filter(function(s){return G.stats[s]&&G.stats[s].exe;}).map(function(s){return G.sides[s].name+'因督戰與軍紀處決死亡約 '+fmt(G.stats[s].exe)+' 人';});if(!a.length)return t;var i=t.indexOf('\n\n');return i>=0?t.slice(0,i)+'\n'+a.join('；')+t.slice(i):t+'\n'+a.join('；');};})();
HELP14.push('<h4>鐵的紀律與政委</h4><ul>'+
  '<li><b>鐵的紀律</b>（兵力編成頁「政策、福利與命名」的軍紀制度）：不准後退、嚴懲逃兵與違紀。部隊的軍紀基準 +15，搶劫、逃亡、抗命等案件大幅減少；潰散門檻降為 0.55 倍，受壓時不會自行有序後撤，進攻中不會拒絕前進，投降機率只剩三成；AI 指揮官不敢下令撤退或遲滯，一律改為就地死守（玩家的命令照常執行）。</li>'+
  '<li><b>政委</b>：在編制詳情或單位面板勾選「派駐政委」，涵蓋該編制的全部下級。軍紀 +10、潰散門檻 0.7 倍、大多數情況下不自行後撤、投降機率減半；動搖的部隊在政治工作下士氣慢慢回升，潰散的部隊有機會被政委收攏重整。與鐵的紀律併用時效果疊加（潰散門檻 0.4 倍）。</li>'+
  '<li><b>代價</b>：死守與反覆衝鋒讓部隊承受的殺傷提高（鐵的紀律 1.2 倍、政委 1.15 倍、兩者 1.35 倍）；督戰隊會向潰退的部隊開槍，動搖或傷亡慘重的部隊會有人以臨陣脫逃為由被就地處決。這些死亡記為「軍紀處決與督戰」，列在戰報裡，紀錄會逐一寫出。</li></ul>');
