/* ===================== 戰場籌措（介面）：「籌措物資」命令與方式選單、單位面板的飲水與籌措狀態、地圖上的缺水標示、設定、後勤頁統計、聚落提示、說明 ===================== */
if(typeof GKEYS!=='undefined')GKEYS.push('fg');
ordReg('forage','籌措物資','log',{g:'🌾',col:'#7CB342'});

DCN.forage='籌措物資：點選地圖上的地點，部隊到附近就地籌措。方式：'+FGKL.map(function(k){return FGK[k][0];}).join('、')+'。作物屬於附近的居民，收割、徵用與劫掠會減少他們的存糧並讓他們敵視本方；劫掠是戰爭罪行。';
(function(){var b=canOrd;canOrd=function(u,k){if(k==='forage'){var L=isLeaf(u)?[u]:leavesOf(u).filter(alive);return L.some(function(q){return ST(q).dom==='land'&&!q.irr;});}return b(u,k);};})();
if(UI.ordOpt&&!UI.ordOpt.fk)UI.ordOpt.fk='auto';
(function(){var b=optsFor;optsFor=function(k){var o=b(k);if(k==='forage')o.fk=FGK[UI.ordOpt.fk]?UI.ordOpt.fk:'auto';return o;};})();
(function(){var b=CHG.oo;CHG.oo=function(t){if(t.getAttribute('data-f')==='fk'){UI.ordOpt.fk=FGK[t.value]?t.value:'auto';btOrd();return;}b(t);};})();
/* 單位目前的糧食、飲水與草料（天數） */
function fgStockTxt(u){var L=u.lg,a=[];if(!L)return '';var fr=u.men0>0?u.men/u.men0:1;a.push('糧食約 '+fx(L.food/Math.max(1,L.dayKg*fr),1)+' 天');
  if(fgThirstOn()&&fgWUnit(u)&&L.wat>=0)a.push('飲水約 '+fx(L.wat/Math.max(1,fgWNeed(u)*fgHeat()),1)+' 天'+(L.thi>=20?'（<b style="color:#b3261e">'+(L.thi>=60?'嚴重缺水':'口渴')+'</b>）':''));
  if(L.fodDay>0&&L.h>0)a.push('草料約 '+fx(L.fod/Math.max(1,L.fodDay),1)+' 天');return a.join('、');}
(function(){var b=v4Opts;v4Opts=function(k,O,us){var o=b(k,O,us);if(k!=='forage')return o;var fk=FGK[O.fk]?O.fk:'auto';
  o+='<span>方式</span><select data-c="oo" data-f="fk">'+FGKL.map(function(q){return '<option value="'+q+'"'+(q===fk?' selected':'')+' title="'+esc(FGK[q][1])+'">'+FGK[q][0]+'</option>';}).join('')+'</select><span></span><span class="lw-note lw-fgd">'+esc(FGK[fk][1])+'</span>';
  var u=us&&us[0];if(u&&isLeaf(u)&&u.lg)o+='<span>現況</span><span class="lw-note">'+fgStockTxt(u)+'</span>';return o;};})();
/* ---------- 單位面板：飲水、正在籌措、最近一次的結果 ---------- */
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);if(!leaf||!u.lg||ST(u).dom!=='land')return o;var Lg=u.lg;
  if(fgThirstOn()&&fgWUnit(u)&&Lg.wat>=0){var cap=fgWCap(u),q=Lg.wat/cap;o+='<span>飲水</span><span>'+fmt(Lg.wat)+' / '+fmt(cap)+' 公升（約 '+fx(Lg.wat/Math.max(1,fgWNeed(u)*fgHeat()),1)+' 天）'+
    (Lg.thi>=20?'；<b style="color:#b3261e">'+(Lg.thi>=60?'嚴重缺水：戰力與速度大幅下降，有人中暑或脫水':'口渴：士氣與戰力下降')+'</b>':q<0.3?'；<span style="color:#e65100">快喝完了</span>':'')+'</span>';}
  var od=u.ord;if(od&&od.k==='forage'&&od.st!=='done'){var t=od.ph==='work'?'正在'+fgVerb(od):od.ph==='go'?'前往籌措地點（'+(FGK[od.m]||FGK[od.fk]||FGK.auto)[0]+'）':'籌措物資',g=fgGotTxt(od);
    o+='<span>籌措</span><span>'+esc(t)+(od.hrs>0.05?'，已 '+fx(od.hrs,1)+' 小時':'')+(g?'：'+esc(g):'')+'</span>';}
  else if(u.fgN&&G.t-u.fgN.t<6*3600)o+='<span>籌措</span><span class="lw-note">'+durTxt(G.t-u.fgN.t)+'前結束（'+esc(u.fgN.why)+'）：'+esc(u.fgN.txt||'沒有收穫')+'</span>';return o;};})();
/* ---------- 地圖：本方飲水不足的部隊（橘＝不到四分之一、紅＝口渴、加斜線＝嚴重缺水） ---------- */
function drawWaterBadges(c){if(!G.started||VW.s<0.3||!fgThirstOn())return;var me=UI.side,all=me<0||seeAll();c.save();G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||!u.lg||!(u.lg.wat>=0))return;if(!all&&u.side!==me)return;if(ST(u).dom!=='land')return;
    var L=u.lg,q=L.wat/fgWCap(u),th=L.thi||0;if(q>=0.25&&th<20)return;var p=w2s(u.x,u.y);if(p[0]<-20||p[1]<-20||p[0]>VW.cw+20||p[1]>VW.ch+20)return;var x=p[0]-11,y=p[1]-15;
    c.fillStyle=th>=20?'#C62828':'#EF6C00';c.strokeStyle='#fff';c.lineWidth=1;c.beginPath();c.moveTo(x,y-6);c.bezierCurveTo(x+4.5,y-0.5,x+4.5,y+5,x,y+5);c.bezierCurveTo(x-4.5,y+5,x-4.5,y-0.5,x,y-6);c.closePath();c.fill();c.stroke();
    if(th>=60){c.lineWidth=1.2;c.beginPath();c.moveTo(x-2.5,y+3.5);c.lineTo(x+2.5,y-2.5);c.stroke();}});c.restore();}
(function(){var b=drawProj;drawProj=function(c){b(c);try{drawWaterBadges(c);}catch(e){if(window.console)console.warn('water',e);}};})();
/* ---------- 聚落提示：存糧與最近的籌措、劫掠 ---------- */
(function(){var b=v8Tip;v8Tip=function(k,o){var t=b(k,o);if(k!=='S'||!o)return t;if(isFinite(o.food))t+='\n存糧：約 '+fmt(Math.max(0,o.food))+' 天'+(o.food<5?'（快要斷糧）':'');
  if(o.fgT&&G.t-o.fgT<24*3600)t+='\n'+(o.fgL?'近日遭到劫掠':'近日有部隊在此籌措物資')+(G.sides[o.fgS]?'（'+G.sides[o.fgS].name+'）':'');return t;};})();
/* ---------- 設定 ---------- */
setSec('logi','water',{t:'飲水與就地籌措',o:50,cls:'lw-fgset',note:'命令列的「籌措物資」可以指定方式：採集作物與草料、取水、打獵捕魚、向居民購買、徵用（開收據）、劫掠、搜刮廢墟與戰場。作物屬於附近的居民，收割、徵用與劫掠會減少他們的存糧並讓他們敵視本方；劫掠是戰爭罪行。',
  h:function(){return setOpt(setRow('飲水',setChk('setb','thirst',G.set.thirst!==false,'部隊需要飲水：每人每天約 4 公升（炎熱、行軍與交戰時更多），攜帶約兩天份；在補給範圍內或水源附近自動補水，脫離補給又遠離水源時會口渴'))+
    setRow('自動籌措',setChk('setb','autoForage',G.set.autoForage!==false,'脫離補給、存糧或飲水不足、附近沒有敵軍的閒置部隊自動就地籌措，完成後回到原位置（依平民政策購買或徵用，不會劫掠；AI 部隊一律自動）')));}});
/* ---------- 後勤頁：本方就地籌措的統計 ---------- */
(function(){var b=PAGES.logi;PAGES.logi=function(host){b(host);if(!G||!G.started)return;var M=host.querySelector('.lw-main');if(!M)return;var side=typeof LG!=='undefined'&&LG.side>=0?LG.side:(UI.side>=0?UI.side:0),S=(G.fg&&G.fg.st&&G.fg.st[side])||{},t=function(k){return S[k]||0;};
  var thirsty=G.units.filter(function(u){return u.side===side&&isLeaf(u)&&onMap(u)&&u.lg&&u.lg.thi>=20;}).length,food=t('crop_food')+t('hunt_food')+t('buy_food')+t('req_food')+t('loot_food')+t('scav_food');
  if(!food&&!t('water_wat')&&!thirsty&&!t('lootN')&&!t('scav_ammo')&&!t('scav_fuel')&&!t('uxo'))return;
  var d=document.createElement('div');d.className='lw-grid';d.innerHTML='<div class="lw-card lw-fgcard"><h3>就地籌措<small>採集、取水、打獵、購買、徵用、劫掠、搜刮</small></h3><div class="lw-kv">'+
    kv('採集作物',fmt(t('crop_food'))+' 公斤糧食'+(t('crop_fod')?'、'+fmt(t('crop_fod'))+' 公斤草料':''))+kv('取水',fmt(t('water_wat'))+' 公升')+kv('打獵捕魚',fmt(t('hunt_food'))+' 公斤')+
    kv('向居民購買',fmt(t('buy_food'))+' 公斤糧食'+(t('buy_fuel')?'、'+fmt(t('buy_fuel'))+' 公升燃料':''))+kv('徵用',fmt(t('req_food'))+' 公斤糧食'+(t('req_fuel')?'、'+fmt(t('req_fuel'))+' 公升燃料':''))+
    kv('劫掠',t('lootN')?'<b style="color:#b3261e">'+fmt(t('lootN'))+' 次</b>：糧食 '+fmt(t('loot_food'))+' 公斤、財物約 '+esc(money(t('lootV')))+(t('lootCas')>0.5?'、平民死傷約 '+fmt(t('lootCas'))+' 人':''):'沒有')+
    kv('搜刮廢墟與戰場','糧食 '+fmt(t('scav_food'))+' 公斤、燃料 '+fmt(t('scav_fuel'))+' 公升、彈藥（各單位基數合計）'+fx(t('scav_ammo'),1)+'%'+(t('uxo')>0.5?'；誤觸未爆彈傷亡約 '+fmt(t('uxo'))+' 人':''))+
    kv('缺水的部隊',thirsty?'<b style="color:#b3261e">'+thirsty+' 個單位</b>':'沒有')+'</div></div>';M.insertBefore(d,M.children[3]||null);};})();
HELP14.push('<h4>飲水與就地籌措</h4><ul>'+
  '<li><b>飲水</b>：每人每天約 4 公升，炎熱、行軍與交戰時更多，每匹馬約 30 公升；部隊攜帶約兩天份（水壺、水袋與水車）。在補給範圍內、或停在河川、湖泊、溪流與村落水井附近時自動補水，下雨時也能接水。水喝完就開始口渴：士氣、戰力與速度下降，嚴重缺水時有人中暑或脫水倒下。就地取用未經處理的水可能帶來痢疾，年代越早越常見，淨水設備可以減少。單位面板顯示飲水存量，地圖上部隊旁的水滴：橘色＝不到四分之一、紅色＝口渴。</li>'+
  '<li><b>「🌾 籌措物資」命令</b>：點選地圖上的地點，部隊到附近就地籌措，裝滿、附近採完或工作 12 小時後結束（劫掠最多 4 小時）。方式：'+FGKL.map(function(k){return '<b>'+FGK[k][0]+'</b>（'+FGK[k][1]+'）';}).join('；')+'。</li>'+
  '<li><b>作物與居民</b>：農田、果園與菜園的作物屬於附近的居民：收割、徵用與劫掠都會減少他們的存糧（聚落提示顯示存糧天數），存糧耗盡時居民開始挨餓。購買要付錢、居民大致願意；徵用開立收據，保護平民的部隊日後照價賠償；劫掠時居民強烈敵視本方、民怨與游擊活動增加，可能發生暴力，記為戰爭罪行並影響國際聲望與新聞報導。平民政策為「保護平民」且軍紀良好、或「大致保護」且軍紀極佳的部隊會拒絕劫掠的命令；附近有憲兵、平民政策不是高壓以上時，憲兵會制止。</li>'+
  '<li><b>季節與地形</b>：秋收時作物最多，夏季次之，冬季幾乎只能靠存糧、打獵與搜刮；森林與灌叢有野果與獵物，草地可以替馬匹割草。獵物與漁獲有限，打完就要換地方；打獵的槍聲讓部隊更容易被敵軍發現。</li>'+
  '<li><b>搜刮</b>：陣亡或被殲滅部隊的位置留有口糧、燃料與彈藥（敵軍的彈藥大多不合用，只能用上三成左右）；被摧毀的補給站殘骸還剩一小部分物資；廢墟裡可以找到少量罐頭與燃料。搜刮可能誤觸未爆彈與詭雷，屍體附近衛生惡劣、有人染病。</li>'+
  '<li><b>自動籌措</b>（設定）：脫離補給、存糧或飲水不足、附近沒有敵軍的閒置部隊自動就地籌措，完成後回到原任務或原位置；自動籌措依平民政策購買或徵用，不會劫掠。AI 部隊一律自動。戰爭花費的軍糧不含就地籌措的糧食，另列就地採購與徵用補償。</li></ul>');
