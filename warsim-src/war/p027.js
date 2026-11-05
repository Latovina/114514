/* ===================== 道路承載介面：地圖上的壅塞路段、道路提示的容量與車流、單位面板的壅塞情形、說明 ===================== */
/* 道路提示：等級的容量；作戰中看得到的車流（本方的，或上帝視角） */
function rdCapTip(k,x,y){var rd=G.map.rd[k],o='（'+RDCAPN[rd]+'，每 500 公尺約容納 '+rdCapOf(rd)+' 輛車';
  if(G.started&&G._lgLoad){var q=G._lgLoad[trfKey(x,y,rd)],me=UI.side;if(q&&(me<0||seeAll()||q[1+me]>0)){var r=q[0]/rdCapOf(rd);o+='；目前車流約 '+fmt(q[0])+(r>1?'，壅塞（容量的 '+fx(r,1)+' 倍）':r>0.8?'，車多':'');}}return o+'）';}
/* 地圖：車流接近或超過容量的路段（黃＝車多、橘＝壅塞、紅＝嚴重壅塞） */
function drawTrf(c){var L=G._lgLoad;if(!L||VW.s<0.25)return;var me=UI.side,all=me<0||seeAll(),m=mpp(),S=VW.s;c.save();c.textAlign='center';c.textBaseline='alphabetic';
  for(var key in L){var q=L[key],p=key.split('|'),rd=+p[2];if(!all&&!(q[1+me]>0))continue;var r=q[0]/rdCapOf(rd);if(r<0.8)continue;var x=(+p[0]+0.5)*500,y=(+p[1]+0.5)*500,s=w2s(x,y);if(s[0]<-40||s[1]<-40||s[0]>VW.cw+40||s[1]>VW.ch+40)continue;
    var rad=Math.max(7,280/m),hv=r>1.5;c.fillStyle=hv?'rgba(198,40,40,.28)':r>1?'rgba(255,111,0,.25)':'rgba(255,193,7,.2)';c.beginPath();c.arc(s[0],s[1],rad,0,2*PI);c.fill();
    if(S>1.2&&r>1)txtHalo(c,'壅塞 ×'+fx(r,1)+(S>2.5?'（'+RD[rd][1]+'）':''),s[0],s[1]-rad-3,'9px sans-serif',hv?'#b71c1c':'#E65100');}
  c.restore();}
(function(){var b=drawProj;drawProj=function(c){b(c);if(!G||!G.started)return;try{drawTrf(c);}catch(e){if(window.console)console.warn('trf',e);}};})();
/* 單位面板：所在道路的等級、容量與車流 */
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);if(!leaf||G.set.roadDyn===false)return o;var T=trfOf(u);if(!T||T.r<0.8)return o;
  return o+'<span>道路</span><span>'+RD[T.rd][1]+'（每 500 公尺約容納 '+fmt(T.cap)+' 輛'+(T.cap>rdCapOf(T.rd)?'，有憲兵指揮交通':'')+'）：車流約為容量的 '+fx(T.r,1)+' 倍'+(T.f<0.98?'，<b style="color:#E65100">壅塞，道路上的速度約剩 '+pct(T.f*100)+'</b>':'')+'</span>';};})();
HELP14.push('<h4>道路承載：各級道路的容量不同</h4><ul>'+
  '<li>每 500 公尺路段在開始壅塞前容得下的交通量（車輛當量）：小路約 '+RDCAP[1]+'、鄉道約 '+RDCAP[2]+'、公路約 '+RDCAP[3]+'、高速公路約 '+RDCAP[4]+'。一輛卡車或馬車算 1，徒步行軍約 50 人算 1，難民約 20 人算 1（扶老攜幼、推車與牲口佔滿路面）。</li>'+
  '<li>行軍縱隊、補給車隊與難民潮沿道路往後延伸好幾個路段；同一路段的總量超過容量就一起減速（只影響道路上的速度，越野不受影響），嚴重時只剩一成多。一個摩托化連在小路上就幾乎佔滿，八個連擠在同一條小路上會明顯變慢；同樣的部隊走高速公路幾乎不受影響。</li>'+
  '<li>持續壅塞（超過容量 1.25 倍）的路段每 10 分鐘標記一次：尋路時成本提高，部隊與車隊會改走平行道路或野外繞行，紀錄裡會寫明「部隊壅塞」「車流超過道路容量」或「難民潮」。附近有憲兵連指揮交通時，容量約多五成。</li>'+
  '<li>地圖上黃色圓圈＝車多、橘色＝壅塞、紅色＝嚴重壅塞（只畫本方看得到的車流）；滑鼠移到道路上會顯示道路的容量與目前車流；單位面板會顯示所在道路的壅塞情形。設定中關閉「動態路況」時不計部隊與難民，只計補給車隊。</li></ul>');
