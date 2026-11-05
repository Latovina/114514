/* ===================== 視野介面：圖層「視野」（選取的本方部隊：虛線視野圈與斜線的地形死角）、單位面板的視野計算、滑鼠提示的觀測位置、設定與說明 ===================== */
UI.lay.vis=1;
(function(){var b=lyRender;lyRender=function(){b();if(!VW.ly)return;var sel=VW.ly.querySelector('select[data-ly="lvl"]'),l=document.createElement('label');l.title='選取本方部隊時顯示視野圈（開闊地上一般目標的發現距離）與地形死角（斜線＝看不到的地面）';
  l.innerHTML='<input type="checkbox" data-ly="vis"'+(UI.lay.vis!==0?' checked':'')+'>視野';VW.ly.insertBefore(l,sel||null);};})();
/* 視域快取：位置、視野距離或地圖改變時才重算 */
var VSC={};
function vsOf(u){var I=visInfo(u),R=Math.min(I.R,30000);if(!(R>50)||ST(u).dom!=='land')return null;var key=Math.round(u.x/25)+','+Math.round(u.y/25)+','+Math.round(R/50)+','+(G._mapv||0),c=VSC[u.id];if(c&&c.key===key&&c.mp===G.map)return c;
  c=viewshed(u.x,u.y,hgtOf(u),R,96);c.key=key;c.mp=G.map;VSC[u.id]=c;var ks=Object.keys(VSC);if(ks.length>8)delete VSC[ks[0]];return c;}
var VHP=null;
function vHatch(c){if(VHP)return VHP;try{var cv=document.createElement('canvas');cv.width=cv.height=8;var x=cv.getContext('2d');x.fillStyle='rgba(38,50,56,.16)';x.fillRect(0,0,8,8);x.strokeStyle='rgba(38,50,56,.55)';x.lineWidth=1.2;x.beginPath();x.moveTo(0,8);x.lineTo(8,0);x.moveTo(-2,2);x.lineTo(2,-2);x.moveTo(6,10);x.lineTo(10,6);x.stroke();VHP=c.createPattern(cv,'repeat')||'rgba(38,50,56,.28)';}catch(e){VHP='rgba(38,50,56,.28)';}return VHP;}
function visSel(){var me=UI.side,all=seeAll();return UI.sel.map(uById).filter(function(u){return u&&isLeaf(u)&&alive(u)&&onMap(u)&&(all||u.side===me);}).slice(0,3);}
function drawVis(c){if(UI.lay.vis===0||!G.started||G.replay)return;var L=visSel();if(!L.length)return;var m=mpp();c.save();
  L.forEach(function(u){var I=visInfo(u);if(!(I.R>50))return;var p=w2s(u.x,u.y),r=I.R/m;if(r<6)return;
    if(ST(u).dom==='land'&&r>=20){var V=vsOf(u);if(V){var da=2*PI/V.nr;c.fillStyle=vHatch(c);for(var i=0;i<V.nr;i++){var a0=i*da-da/2,a1=a0+da,j=0;
      while(j<V.ns){if(V.v[i*V.ns+j]!==0){j++;continue;}var j0=j;while(j<V.ns&&V.v[i*V.ns+j]===0)j++;var r0=(j0+0.5)*V.st/m,r1=Math.min(V.R,(j+0.5)*V.st)/m;if(r1-r0<0.6)continue;c.beginPath();c.arc(p[0],p[1],r1,a0,a1);c.arc(p[0],p[1],r0,a1,a0,true);c.closePath();c.fill();}}}}
    c.strokeStyle='rgba(13,71,161,.85)';c.lineWidth=1.4;c.setLineDash([6,5]);c.beginPath();c.arc(p[0],p[1],r,0,2*PI);c.stroke();c.setLineDash([]);
    if(r>40){c.textAlign='center';c.textBaseline='alphabetic';txtHalo(c,'視野 '+kmTxt(I.R),p[0],p[1]-r-4,'bold 10px sans-serif','#0D47A1');}});c.restore();}
(function(){var b=drawUnder;drawUnder=function(c){b(c);try{drawVis(c);}catch(e){if(window.console)console.warn('vis',e);}};})();
/* ---------- 單位面板：視野的計算 ---------- */
function vWxTxt(){var E=G.env||{},a=[E.phase==='night'?'夜間':E.phase==='day'?'白天':E.phase==='dawn'?'黎明':'黃昏'];if(WX[E.wx])a.push(WX[E.wx][1]);if(E.smoke)a.push('野火濃煙');if(E.T>=32&&E.light>=0.99)a.push('熱浪蒸騰');return a.join('、');}
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);if(!leaf||!onMap(u))return o;var me=mySide();if(me!==null&&u.side!==me&&!seeAll())return o;var I=visInfo(u);if(!(I.R>0))return o;
  var parts=['基本 '+kmTxt(I.base)];if(I.ter<0.99)parts.push((I.ter>vObsC(I.c)+0.001?'位在'+LC[I.c][1]+'邊緣':'位在'+LC[I.c][1]+'內')+' ×'+fx(I.ter,2));if(I.vt>1.01)parts.push('制高點 ×'+fx(I.vt,2)+'（高出四周約 '+Math.round(I.rel)+' 公尺）');parts.push(vWxTxt()+' ×'+fx(I.vm,2));
  var V=ST(u).dom==='land'?vsOf(u):null;
  o+='<span>視野</span><span>開闊地上的一般目標約 '+kmTxt(I.R)+'<br><span class="lw-note">'+parts.join('、')+(V?'；半徑內約 '+Math.round(V.frac*100)+'% 的地面看得到，其餘是地形死角':'')+'</span></span>';
  if(u.ord&&u.ord.vtgM)o+='<span>觀察哨</span><span>已移往附近視野較好的位置</span>';return o;};})();
/* ---------- 滑鼠提示：這裡當觀測位置好不好 ---------- */
(function(){var b=cellTip;cellTip=function(x,y){var t=b(x,y);try{if(!G||!G.map||!G.map.lc)return t;var k=cellAt(x,y),c=G.map.lc[k];if(isWater(c))return t;var ob=vObsAt(k),rel=vRel(k),vt=vtgOf(rel),a=[];
  if(ob<0.99)a.push((ob>vObsC(c)+0.001?'在'+LC[c][1]+'邊緣':'在'+LC[c][1]+'內')+'視線受阻 ×'+fx(ob,2));if(vt>1.02)a.push('制高點 +'+Math.round((vt-1)*100)+'%（高出四周約 '+Math.round(rel)+' 公尺）');if(a.length)t+='\n觀測位置：'+a.join('；');}catch(e){}return t;};})();
/* ---------- 設定 ---------- */
setSec('intel','op',{t:'視野與觀察哨',o:30,note:'觀測距離＝單位的基本距離 × 所在地形（林內、巷弄視線受阻）× 制高點（最多 +60%）× 天候與光線，再依目標的隱蔽、移動、開火與揚塵決定能否發現；通視依實際地形、林木與建築高度計算。地圖圖層「視野」可顯示選取部隊的視野圈與地形死角。',
  h:function(){return setOpt(setRow('觀察哨',setChk('setb','opSeek',G.set.opSeek!==false,'偵察與警戒部隊抵達後，自動移往 700 公尺內視野最好的位置（制高點、林緣）設立觀察哨，每道命令只調整一次')));}});
HELP14.push('<h4>視野：基本距離、地形與天候</h4><ul>'+
  '<li><b>基本觀測距離</b>依單位而定（步兵約 1.5～5 公里，偵察部隊 4～7 公里再加三成五，觀測機、預警機與雷達更遠），自訂單位可以改「觀測距離」；軍官有偵察專長時較遠，行軍、睡眠、遭壓制時打折。</li>'+
  '<li><b>觀測者所在地形</b>：林內約 ×0.55、熱帶雨林 ×0.4、舊城區窄巷 ×0.55、城市中心 ×0.6、樹籬農田 ×0.65、市鎮與工業區 ×0.7、村落與郊區 ×0.8；位在林緣、村落邊緣（緊鄰空曠地）時影響較小（取平方根，林緣約 ×0.74）。目標所在地形的隱蔽另外計算。</li>'+
  '<li><b>制高點</b>：比四周（1.5 與 3 公里外的平均）高出越多看得越遠：高出 50 公尺約 +18%、100 公尺約 +31%、200 公尺約 +48%，最多 +60%；通視依實際地形、林木與建築高度計算，站得高才能越過中間的丘陵、樹林與房屋。偵察與警戒部隊抵達後會自動移往 700 公尺內視野最好的位置設觀察哨（設定可關閉）。</li>'+
  '<li><b>天候與光線</b>：薄霧約剩四成五、濃霧一成五、小雨七成、大雨四成五、雷雨三成五、小雪六成、大雪三成；夜間依夜視裝備（沒有夜視時月光下約一到兩成）。空中觀測地面時，陰天的低雲幕再 ×0.85、薄霧 ×0.75，霧、雨、雪 ×0.6；野火的濃煙 ×0.8；正午 32 °C 以上熱浪蒸騰，地面遠距離觀測 ×0.9。</li>'+
  '<li><b>目標更顯眼</b>：乾燥地面上行駛的車輛揚起塵土（沙漠、沙灘 ×1.45，岩地、苔原、焦土 ×1.25，夏季乾燥的農田、草地、灌叢 ×1.15，下雨、泥濘、積雪時沒有）；積雪上 10 分鐘內移動過的部隊留下足跡 ×1.12。開火、移動、行軍隊形也更容易被發現，挖掘工事、偽裝、埋伏則較難。</li>'+
  '<li><b>地圖</b>：圖層「視野」打開時，選取本方部隊會顯示虛線的視野圈（開闊地上一般目標的發現距離）與斜線的地形死角（從這個位置看不到的地面，敵軍可能藏在那裡接近）；單位面板列出視野的計算與看得到的比例，滑鼠停在地圖上會顯示該處當觀測位置的優劣。</li></ul>');
