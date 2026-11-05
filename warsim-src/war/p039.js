/* ===================== 戰俘營介面：收容人數、「後送戰俘」、「編成戰俘部隊」（強制或招募志願者，附國際法警告）；戰俘部隊的狀態；說明 ===================== */
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);if(!leaf)return o;var me=mySide(),mine=me===null||u.side===me;if(!mine&&!seeAll())return o;
  if(isPowCamp(u)&&G.civ){var n=campCount(u);o+='<span>收容戰俘</span><span>'+fmt(n)+' 人'+(mine&&G.started&&n>=1?'<br><button type="button" class="lw-btn sm" data-a="powevac" data-v="'+u.id+'" title="把營裡的戰俘押往本方後方、送出戰區">後送戰俘</button> <button type="button" class="lw-btn sm dng" data-a="powraise" data-v="'+u.id+'" title="把戰俘編成作戰部隊（國際法禁止）">編成戰俘部隊…</button>':'')+'</span>';}
  if(u.powU)o+='<span>戰俘部隊</span><span><b>原屬'+esc(G.sides[u.powU.from].name)+'</b>（'+(u.powU.mode==='vol'?'招募的「志願者」':'強迫編成')+'）<br><span class="lw-note">沒有車輛、武器老舊、士氣低落；靠近原屬國部隊、士氣崩潰或看守薄弱時容易倒戈，倒戈時會先向附近的本方部隊開火</span></span>';return o;};})();
ACT.powevac=function(b){var c=uById(+b.getAttribute('data-v'));if(!c)return;var n=powEvac(c);toast(n>=1?'押送 '+fmt(n)+' 名戰俘前往後方，抵達地圖邊緣後送出戰區。':'營裡沒有戰俘。');btStatus();};
var PWR={id:0,mode:'force'};
ACT.powraise=function(b){var c=uById(+b.getAttribute('data-v'));if(!c)return;PWR.id=c.id;powRaiseDlg();};
function powRaiseDlg(){var c=uById(PWR.id);if(!c)return;var nf=Math.floor(powRaiseN(c,'force')),nv=Math.floor(powRaiseN(c,'vol')),law=powLawTxt();
  var o='<h3>編成戰俘部隊</h3><div class="lw-kv"><span>戰俘營</span><span>'+esc(uName(c))+'，收容 '+fmt(campCount(c))+' 人</span></div>'+
    '<div class="lw-opt"><span>方式</span><label><input type="radio" name="pwm" data-c="pwm" value="force"'+(PWR.mode==='force'?' checked':'')+'>強迫編成：約 '+fmt(nf)+' 人（健壯者約八成五）</label><span></span><label><input type="radio" name="pwm" data-c="pwm" value="vol"'+(PWR.mode==='vol'?' checked':'')+'>招募「志願者」：約 '+fmt(nv)+' 人（待遇越差，為了離開戰俘營而報名的人越多）</label></div>'+
    '<div class="lw-note">'+(law?'<b style="color:#b3261e">'+esc(law)+'。</b>這會記為戰爭罪行，被發現時本方聲望下降，戰後總結與戰地報導會記錄；招募「志願者」同樣違反公約。':'此時代尚無禁止強迫戰俘作戰的條約，但仍會影響聲望。')+
    '戰俘部隊沒有車輛、武器老舊、訓練與士氣低落，容易倒戈，倒戈時會向附近的本方部隊開火。</div>'+
    '<div class="lw-row"><button type="button" class="lw-btn dng" data-a="powgo">編成</button><button type="button" class="lw-btn" data-a="x">取消</button></div>';UI.pwd&&UI.pwd.remove();UI.pwd=dlg(o);}
CHG.pwm=function(t){PWR.mode=t.value;};
ACT.powgo=function(){var c=uById(PWR.id);if(UI.pwd){UI.pwd.remove();UI.pwd=null;}if(!c)return;var L=powRaise(c,PWR.mode);if(!L){toast('可以編成的戰俘不到 30 人。');return;}if(G.civ)decLog(c.side,'玩家',(PWR.mode==='vol'?'在戰俘中招募志願者':'強迫戰俘')+'編成 '+L.length+' 個連');
  toast('編成 '+L.length+' 個戰俘連（共約 '+fmt(L.reduce(function(a,u){return a+u.men;},0))+' 人）'+(powLawTxt()?'；已記為戰爭罪行':''),4500);UI.sel=L.map(function(u){return u.id;});btSel();};
HELP14.push('<h4>戰俘營：後送與戰俘部隊</h4><ul>'+
  '<li><b>後送戰俘</b>：選取戰俘營，單位面板按「後送戰俘」，營裡的戰俘由看守押往本方地圖邊緣，抵達後送出戰區（統計為後送人數）。途中靠近原屬國部隊時可能被解救或趁機逃回。AI 的戰俘營在敵軍逼近 5 公里內時會自動後送。</li>'+
  '<li><b>編成戰俘部隊</b>：可以強迫健壯的戰俘（約八成五）編成步兵連，或在戰俘中招募「志願者」（約一成，待遇越差人數越多）。自 1907 年海牙公約起，強迫敵國國民參加對其本國的作戰即被禁止，1929、1949 年日內瓦公約重申，1949 年起屬嚴重違反；招募「志願者」同樣違反。這會記為戰爭罪行，被發現時聲望下降，戰後總結與戰地報導會記錄。</li>'+
  '<li><b>戰俘部隊</b>沒有車輛、武器老舊、訓練與士氣低落，被當作消耗兵力使用。靠近原屬國部隊、士氣崩潰或看守薄弱時容易倒戈：先向附近的本方部隊開火，再投向原屬國；被包圍時不投降而是直接倒戈。AI 只有在兵力崩潰在即、又採嚴酷戰俘政策時才會這麼做。</li></ul>');
