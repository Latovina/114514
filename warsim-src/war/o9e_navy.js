/* ===================== 海軍（介面）：布雷與掃雷命令、地圖上的雷區、海軍指揮官的設定與狀態、說明 ===================== */
ordReg('minelay','布雷','eng',{g:'✱',col:'#37474F'});ordReg('sweep','掃雷','eng',{g:'⊘',col:'#546E7A'});
DCN.minelay='布雷：布雷艦隊開到指定的水域布設水雷區（半徑約 1.5 公里）。敵艦經過時依水雷密度與航行距離觸雷；本方艦艇知道雷區位置，風險很低。水雷布完為止。';
DCN.sweep='掃雷：掃雷艇或獵雷艇到指定水域清除敵方水雷，同時發現附近的雷區。掃雷艇本身也有觸雷的風險。';
(function(){var b=canOrd;canOrd=function(u,k){if(k==='minelay'||k==='sweep'){var L=isLeaf(u)?[u]:leavesOf(u).filter(alive);return L.some(function(q){var t=q.mix&&q.mix[0]?q.mix[0][0]:'';return k==='minelay'?/^ml\d/.test(t):/^(msw|mcm)\d/.test(t);});}return b(u,k);};})();
/* 地圖：本方知道的雷區 */
function drawMines(c){var me=mySide(),M=mnList();if(!M.length)return;var m=mpp();c.save();c.setLineDash([5,4]);c.lineWidth=1.4;c.font='11px sans-serif';c.textAlign='center';
  M.forEach(function(f){if(f.n<1)return;if(me!==null&&!seeAll()&&f.side!==me&&f.kn.indexOf(me)<0)return;var p=w2s(f.x,f.y),r=f.r/m;if(p[0]<-r||p[1]<-r||p[0]>VW.cw+r||p[1]>VW.ch+r)return;var own=me===null?f.side===0:f.side===me;
    c.strokeStyle=own?'rgba(40,90,160,0.85)':'rgba(190,40,30,0.9)';c.fillStyle=own?'rgba(40,90,160,0.08)':'rgba(190,40,30,0.1)';c.beginPath();c.arc(p[0],p[1],Math.max(6,r),0,2*PI);c.fill();c.stroke();
    if(r>14){c.fillStyle=c.strokeStyle;c.fillText((own?'本方雷區':'敵方雷區')+' 約 '+fmt(Math.round(f.n))+' 枚',p[0],p[1]+4);}});c.restore();}
(function(){var b=drawMissions;drawMissions=function(c){try{drawMines(c);}catch(e){if(window.console)console.warn('雷區',e);}b(c);};})();
/* 部隊面板：海軍單位寫出海軍指揮官與目前方針 */
var NCPOST={retire:'撤出戰場',search:'搜索敵艦隊',engage:'接敵',shadow:'保持接觸',avoid:'避戰'};
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);try{if(!leaf||!ncCtlLeaf(u))return o;var me=mySide();if(me!==null&&u.side!==me&&!seeAll())return o;var C=SD(u.side).ncmd;if(!C)return o;
  return o+'<span>海軍指揮官</span><span>'+esc(C.n)+'（'+esc(NCT[C.t][0])+(C.post?'；'+esc(NCPOST[C.post]||C.post):'')+(ncOn(u.side)?'':'；未代管')+'）</span>'+(u.mineN>0?'<span>水雷</span><span>'+fmt(Math.round(u.mineN))+' 枚</span>':'');}catch(e){return o;}};})();
/* 設定 */
setSec('cmd','navy',{t:'海軍指揮官',o:30,h:function(){var S=G.set,A=S.navAuto||{};return setOpt(setRow('海軍指揮官',setChk('setb','navCmd',S.navCmd!==false,'艦艇、海軍航空隊與陸戰隊由海軍指揮官指揮（陸軍指揮官不再指揮它們）'))+
  SIDES().map(function(s){var Sd=SD(s);return setRow(esc(G.sides[s].name),'<span>'+setSel('setnavt',String(s),[['','依時代與艦隊組成']].concat(Object.keys(NCT).map(function(k){return [k,NCT[k][0]+'：'+NCT[k][1]];})),Sd.ncmdT||'')+
    (Sd.ai?'':' <label><input type="checkbox" data-c="setnava" data-f="'+s+'"'+(A[s]?' checked':'')+'>由海軍指揮官代管本方海軍（你下的命令優先）</label>')+'</span>');}).join(''));}});
CHG.setnavt=function(t){var s=+t.getAttribute('data-f'),Sd=SD(s);Sd.ncmdT=t.value||'';Sd.ncmd=null;};
CHG.setnava=function(t){var s=+t.getAttribute('data-f');G.set.navAuto=G.set.navAuto||{};G.set.navAuto[s]=t.checked;};
HELP14.push('<h4>海軍：單艦、海軍指揮官、命令傳遞與水雷</h4><ul><li>戰列艦、巡洋艦、驅逐艦、巡防艦、潛艦等主力艦艇以一艘為一個單位，由單艦組成「驅逐隊」「巡洋艦戰隊」等編制；魚雷艇、巡邏艇、內河砲艇、槳帆船、布雷艦與掃雷艇仍以小隊為單位，運輸船團以船隊計。舊的分隊類型保留給舊存檔使用。</li>'+
  '<li>新的單位：各時代的海軍陸戰隊、水上偵察機、海上巡邏機、反潛巡邏機、艦載預警機、輕巡洋艦、輕型航空母艦、槳帆船隊、布雷艦隊、掃雷艇隊與獵雷艇隊。</li>'+
  '<li>海軍指揮官與陸軍指揮官分開：艦艇、海軍航空隊與陸戰隊由海軍指揮官指揮。個性有決戰型、存在艦隊型、夜襲型、護航型、航空打擊型與飛彈齊射型，依敵我兵力（以目前的識別判斷）決定接敵、保持接觸、避戰或撤出。各時代戰術不同：帆船搶上風再以戰列線接戰、槳帆船衝撞接舷；鐵甲艦與無畏艦在遠距離砲戰，驅逐艦晝間護衛、夜間魚雷突擊；航艦遠離敵艦砲射程，以艦載機先發制人；飛彈時代在敵方射程外齊射。潛艦伏擊高價值目標，護航型優先保護運輸船團，取得局部制海權後陸戰隊登陸。</li>'+
  '<li>命令由旗艦發出：白天在視距內用旗號、夜間用燈號；視距外在無線電以前要派通報艦（或沿線艦艇轉發旗號），之後用無線電報；1942 年起近距離用艦隊無線電話，1975 年起用數據鏈。</li>'+
  '<li>水雷：布雷艦隊以「布雷」命令布設雷區，敵艦經過時依密度與航行距離觸雷；觸雷或掃雷時才會發現敵方雷區，地圖上以虛線圓圈標出。掃雷艇以「掃雷」命令清除。</li>'+
  '<li>「設定 → 指揮」可以關閉海軍指揮官、指定各方的個性，玩家方也可以交給海軍指揮官代管（你下的命令優先）。</li></ul>');
