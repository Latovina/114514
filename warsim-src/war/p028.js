/* ===================== 油料介面：「加油」命令、單位面板的耗油與里程、飛機的剩餘滯空時間、地圖上的缺油標示、自動加油設定、說明 ===================== */
ordReg('refuel','加油','log',{nt:1,g:'⛽',col:'#00897B'});

DCN.refuel='加油：不需要點地圖。選取的車輛部隊（或編制裡用油的部隊）開往最近有油的補給站、補給部隊或本方後方，加滿後回到原來的任務或位置。已在補給範圍內的部隊就地加油；油料已經耗盡的部隊無法自行開動，要等補給隊送油。';
function fuelLeaves(u){return (isLeaf(u)?[u]:leavesOf(u)).filter(function(l){return alive(l)&&onMap(l)&&!l.foot&&fuelDep(l)&&ST(l).dom==='land';});}
(function(){var b=canOrd;canOrd=function(u,k){if(k==='refuel')return !!G.started&&fuelLeaves(u).length>0;return b(u,k);};})();
/* ---------- 單位面板 ---------- */
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);if(!leaf)return o;var s=ST(u);
  if(s.dom==='air'&&u.st==='air'&&!u.lift){var A=airLeft(u);o+='<span>滯空</span><span>油料約剩 '+durTxt(A.fuel)+(A.m!==1?'（目前耗油 '+fx(A.m,1)+' 倍'+(A.m>2?'，纏鬥中':'')+'）':'')+'；扣除返航，在任務區約可再停留 '+durTxt(A.station)+'</span>';return o;}
  if(s.dom!=='land'||!u.lg||!(u.lg.lPerKm>0))return o;if(u.foot)return o+'<span>車輛</span><span class="lw-note">缺油時炸毀車輛，乘員改為徒步</span>';if(!fuelDep(u))return o;
  var Lg=u.lg,q=fuelQ(u),km=Lg.lPerKm>0?Lg.fuel/Lg.lPerKm:0;o+='<span>耗油</span><span>每公里約 '+fmt(Lg.lPerKm,Lg.lPerKm<10?1:0)+' 公升（越野約 1.9 倍，泥濘雪地更多）；交戰中每小時約 '+fmt(Lg.lPerKm*(FUELX.idle+FUELX.cbt))+' 公升。現有油料約可行駛 '+fmt(km)+' 公里（越野約 '+fmt(km/1.9)+' 公里）</span>';
  if(q<0.1&&fuelFireTxt(u))o+='<span>缺油</span><span><b style="color:#b3261e">'+(q<=0?'油料耗盡：'+fuelFireTxt(u):'油料不到一成，省油作戰：戰力約剩八成五')+'</b></span>';
  if(u.ord&&u.ord.dk==='refuel')o+='<span>加油</span><span>前往補給點加油，加滿後'+(u.ordPrev?'返回原任務':'回到原位置')+'</span>';
  if(u.frBy){var fb=uById(u.frBy);if(fb&&fb.frun&&fb.frun.tgt===u.id)o+='<span>送油</span><span>'+esc(uName(fb))+'正在送油過來</span>';}
  if(u.frun){var tg=uById(u.frun.tgt);if(tg)o+='<span>送油</span><span>送油給'+esc(uName(tg))+'</span>';}return o;};})();
/* ---------- 地圖：本方缺油的部隊（橘＝不到兩成、紅＝耗盡） ---------- */
function drawFuelBadges(c){if(!G.started||VW.s<0.3)return;var me=UI.side,all=me<0||seeAll();c.save();G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||u.foot)return;if(!all&&u.side!==me)return;if(!u.lg||!fuelDep(u)||ST(u).dom!=='land')return;var q=fuelQ(u);if(q>=0.2)return;
    var p=w2s(u.x,u.y);if(p[0]<-20||p[1]<-20||p[0]>VW.cw+20||p[1]>VW.ch+20)return;var x=p[0]+11,y=p[1]-15,col=q<=0?'#C62828':'#EF6C00';
    c.fillStyle=col;c.strokeStyle='#fff';c.lineWidth=1;c.beginPath();c.moveTo(x-3.5,y-5);c.lineTo(x+2,y-5);c.lineTo(x+3.5,y-3.5);c.lineTo(x+3.5,y+5);c.lineTo(x-3.5,y+5);c.closePath();c.fill();c.stroke();
    c.fillStyle='#fff';c.fillRect(x-2,y-1.5,4,1.2);if(q<=0){c.strokeStyle='#fff';c.lineWidth=1.2;c.beginPath();c.moveTo(x-2.5,y+3.5);c.lineTo(x+2.5,y-3.5);c.stroke();}});c.restore();}
(function(){var b=drawProj;drawProj=function(c){b(c);try{drawFuelBadges(c);}catch(e){if(window.console)console.warn('fuel',e);}};})();
/* ---------- 設定 ---------- */
setSec('logi','fuel',{t:'油料',o:40,note:'車輛：行駛、越野（約多耗九成）、泥濘與積雪、待命時引擎運轉、交戰中機動都會耗油；油料不足兩成時移動變慢，不足一成時戰力約剩八成五，耗盡時無法移動、戰車戰力約剩六成；耗盡又被迫撤退時只能炸毀車輛徒步撤離。飛機：巡邏省油、低空攻擊多耗三成、纏鬥時開後燃器耗油二到三倍半，油料只夠返航時立即脫離。',
  h:function(){return setOpt(setRow('自動加油',setChk('setb','autoFuel',G.set.autoFuel!==false,'油料低於四分之一、又不在補給範圍內的閒置部隊自動開往補給點加油，加滿後回原位；閒置的補給隊自動送油給停擺的部隊（AI 部隊一律自動）')));}});
HELP14.push('<h4>油料：車輛與飛機都要加油</h4><ul>'+
  '<li><b>車輛耗油</b>：除了行駛里程，越野每公里約多耗九成（泥濘、積雪更多）；附近有已知敵軍時引擎與砲塔、無線電持續運轉（每小時約等於 3 公里），交戰中機動每小時約等於 8 公里；嚴寒時待命也要定時發動引擎。1980 年後的燃氣渦輪戰車待命耗油加倍。</li>'+
  '<li><b>缺油的後果</b>：不足兩成時移動速度約剩三分之二，不足一成時約剩三分之一，戰車省油作戰、戰力約剩八成五；耗盡時無法移動，戰車與裝甲車戰力約剩六成（不能機動、砲塔靠人力轉動），乘員士氣持續下降。耗盡半小時以上又潰散或奉命撤退、敵軍在 3 公里內時，乘員炸毀大部分車輛徒步撤離（戰報記為自毀車輛）。已在陣地上的自走砲與牽引砲照常射擊。</li>'+
  '<li><b>加油</b>：在補給站、補給部隊或本方後方的補給範圍內會自動加油。命令列的「⛽ 加油」讓部隊開往最近有油的地方，加滿後回到原任務；設定中的「自動加油」讓沒有任務、油料低於四分之一的部隊自己去加油，閒置的補給隊也會把油送到停擺的部隊（AI 部隊一律自動）。</li>'+
  '<li><b>飛機</b>：巡邏時以省油速度飛行（0.8 倍），低空攻擊多耗三成，直升機懸停多耗兩成，5 公里內有敵機時纏鬥：螺旋槳機約 2.5 倍、噴射機開後燃器約 3.5 倍。剩餘油料只夠飛回基地（加兩成與 10 分鐘保留）時立即脫離返航；油料耗盡就墜毀或迫降。單位面板顯示剩餘油料與還能在任務區停留多久。</li>'+
  '<li>地圖上部隊旁的小油桶：橘色＝油料不到兩成，紅色＝耗盡。</li></ul>');
