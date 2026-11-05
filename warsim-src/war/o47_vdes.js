/* ===================== 載具設計 → 單位類型：空軍（戰機、電子戰機、預警機、反潛機、轟炸機、直升機、無人機）與海軍（航艦、巡洋艦、驅逐艦、巡防艦、護衛艦、飛彈快艇、兩棲艦、潛艦） =====================
   以 LatoVehicle 的計算結果換成作戰參數：雷達、紅外與光電感測距離 → 觀測與雷達監視距離；雷達截面積 → 被偵測距離（匿蹤）；對空飛彈、機動性與速度 → 空戰值；
   炸彈、導引炸彈、集束炸彈、火箭、空對地飛彈、反輻射飛彈 → 對人與對裝甲攻擊、精確打擊與防空壓制；巡弋與反艦飛彈 → 區域外飛彈打擊；
   艦艇的防空（能擋下幾枚來襲飛彈）、艦砲、魚雷、排水量、航速與乘員。其餘沿用同兵種年代最接近的內建類型。 */
function vdMake(d,n,name){return d.br==='l'?vdToType(d,n,name):d.br==='a'?vdToTypeAir(d,n,name):vdToTypeSea(d,n,name);}
function vdMakeRow(d){var R=vcalc(d);if(!R||R.err)return '';if(d.br==='a'&&(d.ty==='trn'||d.ty==='cod'))return '<div class="lw-note">運輸機用於後勤空運，不建立作戰單位類型。</div>';
  var air=d.br==='a',sea=d.br==='s',n=air||sea?VDN[d.ty]||(air?12:1):(d.ty==='spg'||d.ty==='spaa'?6:14),unit=air?'架':sea?'艘':'輛',grp=air?'每中隊':sea?'每分隊':'每連',suf=air?'中隊':sea?'分隊':'連';
  return '<h4 style="margin:8px 0 4px">建立單位類型</h4><div class="lw-row"><label>'+grp+' <input type="number" min="1" max="60" value="'+n+'" data-k="avn" style="width:56px"> '+unit+'</label><label>名稱 <input type="text" value="'+esc(d.n.replace(/（.*?）/g,'').replace(/^[A-Za-z0-9.\/]+\s*/,'')+suf)+'" data-k="avnm" style="width:16em"></label><button type="button" class="lw-btn sm pri" data-a="arvmk">建立</button></div>';}
function vdMadeTxt(T){var s=T.dom==='air'?'空戰 '+fx(T.aa,1)+'、對人 '+fx(T.sa,1)+'、對裝甲 '+fx(T.ha,1)+'、速度 '+T.vr+' km/h、續航 '+fx(T.end,1)+' 小時':T.dom==='sea'||T.dom==='sub'?'防空 '+fx(T.aa,1)+'（可擋 '+((T.ux&&T.ux.adN&&T.ux.adN.sub)||0)+' 枚次音速反艦飛彈）、航速 '+T.vr+' km/h':'裝甲等級 '+fx(T.arm,1)+'（對聚能 '+fx(T.armC,1)+'）、速度 '+T.vr+'／'+T.vx+' km/h';
  return '已建立單位類型「'+T.n+'」：'+s+(T.msl?'、'+T.msl.nm+' '+T.msl.n+' 枚（射程 '+kmTxt(T.msl.r)+'）':'')+'、每'+(T.vn||'輛').charAt(0)+' '+amoney(T.vusd)+'。可在「兵力編成」使用。';}
