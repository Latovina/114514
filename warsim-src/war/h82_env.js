/* ===================== 地面積雪與融雪泥濘（高緯度、高海拔）；高山症與水土不服 =====================
   一、積雪：地圖每 16×16 格一塊，各塊依自己的平均海拔算氣溫（每升高 1000 公尺降 6.5 度，以地圖陸地的平均海拔為天氣報告的基準）。
       下雪（或零度以下的雨）時積雪，氣溫在零度以上時融化（約每度每小時 0.16 公分，下雨時更快）；高山上當月均溫（或開戰時的氣溫，取較冷的）零下兩度以下的地方開戰時就有雪，
       年均溫零下六度以下的高處終年積雪。在基準高度上，積雪與原本全圖的「積雪」天氣完全一致；更高、更冷的地方雪更深、融得更晚。
       融雪的水讓地面變成爛泥（約每融 1 公分泥濘加 0.03），之後慢慢變乾；結凍（零下三度以下）的泥地是硬的。
       積雪深、泥濘重的地方，比全圖天氣多出來的部分讓越野更慢（輪型與畜力最慢、履帶較好、徒步居中）。地圖上直接畫成雪地與泥地。
   二、高山症：海拔 2500 公尺以上，非山地部隊待上幾小時後頭痛、氣喘、體力差（交火與行軍效率降低，最多約四分之一與三成），
       3500 公尺以上開始有人因高山肺水腫、腦水腫後送；在 2000 公尺以上待 5 天大致適應。山地部隊（類型名稱有「山地」「高山」等，或原駐地設為高原）不受影響。
   三、水土不服：各方可以設定部隊原駐地的氣候（熱帶、溫帶、寒帶、乾燥、高原；預設「同戰區」不受影響）。
       與戰區氣候不同的部隊，頭三週疾病較多（熱帶的瘧疾與痢疾、寒帶的凍傷、乾燥地區的中暑與痢疾），效率也較差，隨著在戰區的天數逐漸適應。 ===================== */
var SNB=16,SNLAPSE=0.0065;
/* 戰區的氣候帶 */
function zoneOf(MP){MP=MP||G.map;var C=MP.clim||{Tj:5,Tl:20,Pj:60,Pl:70},st=MP._snE0;if(st===undefined){var s=0,n=0;for(var k=0;k<MP.el.length;k+=7)if(!isWater(MP.lc[k])){s+=MP.el[k];n++;}st=MP._snE0=n?s/n:0;}
  if(st>2500)return 'high';if(Math.min(C.Tj,C.Tl)>=18)return 'trop';if(6*(C.Pj+C.Pl)<300&&Math.max(C.Tj,C.Tl)>=20)return 'arid';if(Math.min(C.Tj,C.Tl)<-10)return 'cold';return 'temp';}
function snE0(){if(G.map._snE0===undefined)zoneOf(G.map);return G.map._snE0;}
/* 積雪格：G.sn = {bw,bh,el:[各塊平均海拔],d:[積雪公分],m:[泥濘 0～1],v:版本} */
function snGrid(){var MP=G.map,S=G.sn,bw=Math.ceil(MP.GW/SNB),bh=Math.ceil(MP.GH/SNB);if(S&&S.bw===bw&&S.bh===bh)return S;
  var el=[],d=[],m=[],E=G.env||{},o=now(),c=climMonth(o.m),C=MP.clim||{Tj:5,Tl:20},Tann=(C.Tj+C.Tl)/2,e0=snE0();
  for(var by=0;by<bh;by++)for(var bx=0;bx<bw;bx++){var s=0,n=0;for(var y=by*SNB;y<Math.min(MP.GH,(by+1)*SNB);y+=2)for(var x=bx*SNB;x<Math.min(MP.GW,(bx+1)*SNB);x+=2){var k=y*MP.GW+x;if(isWater(MP.lc[k]))continue;s+=MP.el[k];n++;}
    var eb=n?s/n:e0,dT=-SNLAPSE*(eb-e0),T0=Math.min(E.T!==undefined?E.T:c.T,c.T),Tb=T0+dT,base=(E.snow||0)*40,fT=function(T){return clamp((-T-2)*6,0,150);},dd=Tb<1?base+Math.max(0,fT(Tb)-fT(T0)):0;if(Tann+dT<-6&&dT<-1)dd=Math.max(dd,120);
    el.push(Math.round(eb));d.push(Math.round(dd*10)/10);m.push(0);}
  G.sn={bw:bw,bh:bh,el:el,d:d,m:m,v:1};return G.sn;}
function snAt(x,y){var S=G.sn;if(!S)return null;var cs=G.map.cs,bx=clamp(Math.floor(x/cs/SNB),0,S.bw-1),by=clamp(Math.floor(y/cs/SNB),0,S.bh-1),i=by*S.bw+bx;return {i:i,d:S.d[i],m:S.m[i],T:(G.env.T||0)-SNLAPSE*(S.el[i]-snE0())};}
/* 每小時結算一次 */
function snStep(){if(!G.started||!G.env)return;var S=snGrid(),E=G.env,w=WX[E.wx]||[],sn=w[4]||0,rn=w[3]||0,e0=snE0(),ch=false;
  for(var i=0;i<S.d.length;i++){var Tb=E.T-SNLAPSE*(S.el[i]-e0),d=S.d[i],m=S.m[i],d0=d,m0=m;
    /* 與全圖天氣相同的累積與融化速度：在基準高度上兩者一致；比基準高的地方，零度以下的雨也成了雪 */
    if(sn&&Tb<0.5)d+=[0,2,6][sn]||2;else if(rn&&Tb<0.5&&S.el[i]>e0+150)d+=[0,1,3,4][rn]||1;
    if(Tb>1&&d>0){var melt=Math.min(d,0.8*(Tb/5));d-=melt;m=Math.min(1,m+melt*0.03);}
    if(Tb>0&&m>0)m=Math.max(0,m-0.012*(Tb>10?1.5:1)*(rn?0.3:1));
    d=Math.round(clamp(d,0,300)*10)/10;m=Math.round(m*1000)/1000;if(d!==d0||m!==m0){S.d[i]=d;S.m[i]=m;ch=true;}}
  if(ch)S.v++;}
/* 越野速度：比全圖天氣多出來的積雪與泥濘 */
var SNM=[0.35,0.5,0.55,0.65,0.3],MDM=[0.25,0.4,0.45,0.55,0.3];
function snSlow(u,s){if(!G.sn||s.dom!=='land')return 1;var q=snAt(u.x,u.y);if(!q)return 1;var E=G.env,es=Math.max(0,clamp(q.d/40,0,1)-(E.snow||0)),em=q.T<-3?0:Math.max(0,q.m-(E.mud||0)),mo=s.mobi||0;
  if(!(es>0||em>0))return 1;return Math.max(0.2,1-es*(SNM[mo]||0.4)-em*(MDM[mo]||0.35));}
(function(){var b=speedAt;speedAt=function(u,s,pf){var v=b(u,s,pf);if(!G.sn||s.dom!=='land'||G.map.rd[cellAt(u.x,u.y)])return v;return v*snSlow(u,s);};})();

/* ---------- 二、高山症 ---------- */
if(typeof DZ!=='undefined'){DZ.alt=['高山症（肺水腫、腦水腫）',0,0.06,0.01,3];DZ.clm=['水土不服（腸胃病、熱衰竭、凍傷）',0,0.01,0.002,6];}
function altOf(u){return G.map.el[cellAt(u.x,u.y)]||0;}
function sideHome(s){var S=G.sides[s];return S&&S.home&&S.home!=='auto'?S.home:'';}
function mtnTroop(u){var t=typeOf((u.mix||[[u.hq]])[0][0]);return /山地|高山|雪地|阿爾卑斯|雪豹|高原/.test(t&&t.n||'')||sideHome(u.side)==='high';}
function amsOf(u){return u.ams||0;}
/* ---------- 三、水土不服 ---------- */
var CLMN={auto:'同戰區（不受影響）',trop:'熱帶',temp:'溫帶',cold:'寒帶',arid:'乾燥地區',high:'高原'};
/* 原駐地 → 戰區：不適應的程度（0～1） */
var CLMX={trop:{temp:0.3,cold:1,arid:0.4,high:0.8},temp:{trop:0.6,cold:0.5,arid:0.5,high:0.6},cold:{trop:1,temp:0.3,arid:0.8,high:0.5},arid:{trop:0.6,temp:0.3,cold:0.8,high:0.6},high:{trop:0.7,temp:0.2,cold:0.4,arid:0.4}};
function clmSev(u){var h=sideHome(u.side);if(!h)return 0;var z=zoneOf(G.map);if(h===z)return 0;var s=(CLMX[h]||{})[z]||0;return s*Math.max(0,1-(u.clmD||0)/21);}
var CLMDZ={trop:'mal',cold:'frost',arid:'heat',temp:'dys',high:'dys'};
/* 每 10 分鐘：高山症與水土不服 */
function envBodyStep(){var h=1/6;G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||u.st==='dead')return;var s=ST(u);if(s.dom!=='land'||u.men<1)return;
  var a=altOf(u),mt=mtnTroop(u);
  if(a>2000)u.altA=Math.min(1,(u.altA||0)+h/120);else if(a<1500&&u.altA)u.altA=Math.max(0,u.altA-h/240);
  if(a>2500&&!mt){u.altH=(u.altH||0)+h;var sv=clamp((a-2500)/2500,0,1)*(1-(u.altA||0))*Math.min(1,u.altH/6);u.ams=Math.round(sv*100)/100;
    if(sv>0.15&&(!u.amsLog||G.t-u.amsLog>24*3600)){u.amsLog=G.t;logE(u.side,'dis',uName(u)+'在海拔 '+fmt(Math.round(a/100)*100)+' 公尺出現高山症：頭痛、氣喘、走不快',u.x,u.y,u.id);}
    if(a>3500&&sv>0.1&&typeof sickAdd==='function'){u.amsA=(u.amsA||0)+u.men*0.0008*sv*h;if(u.amsA>=0.5){var n=u.amsA;u.amsA=0;sickAdd(u,n,'alt');}}}
  else{if(u.altH)u.altH=Math.max(0,u.altH-2*h);if(u.ams)u.ams=Math.max(0,Math.round((u.ams-0.05)*100)/100);}
  if(sideHome(u.side)){u.clmD=(u.clmD||0)+h/24;var cs=clmSev(u);u.clm=Math.round(cs*100)/100;
    if(cs>0.05&&typeof sickAdd==='function'){var z=zoneOf(G.map);u.clmA=(u.clmA||0)+u.men*0.002*cs*h/24*(z==='trop'?2:1);if(u.clmA>=0.5){var n2=u.clmA;u.clmA=0;sickAdd(u,n2,'clm');u.dzk2=CLMDZ[z];}}
    if(cs>0.3&&(!u.clmLog||G.t-u.clmLog>3*24*3600)){u.clmLog=G.t;logE(u.side,'dis',uName(u)+'水土不服：來自'+CLMN[sideHome(u.side)]+'的官兵不習慣'+CLMN[zoneOf(G.map)]+'的氣候與飲食，病號增加',u.x,u.y,u.id);}}});}
/* 效率：高山症與水土不服讓交火與行軍變差 */
(function(){var b=exhFire;exhFire=function(u){var f=b(u);if(u.ams)f*=1-0.25*u.ams;if(u.clm)f*=1-0.12*u.clm;return f;};})();
(function(){var b=exhMove;exhMove=function(u){var f=b(u);if(u.ams)f*=1-0.3*u.ams;if(u.clm)f*=1-0.1*u.clm;return f;};})();
(function(){var b=v8Step;v8Step=function(){b();if(!G.started)return;if(G.step%120===40)snStep();if(G.step%20===11)envBodyStep();};})();
(function(){var b=prepareBattle;prepareBattle=function(){var r=b.apply(this,arguments);try{G.sn=null;snGrid();}catch(e){}return r;};})();
if(typeof GKEYS!=='undefined')['sn'].forEach(function(k){if(GKEYS.indexOf(k)<0)GKEYS.push(k);});
/* 聯機：積雪格（各方都一樣）跟著天氣一起送 */
if(typeof mpValList==='function'){(function(){var b=mpValList;mpValList=function(s){var V=b.apply(this,arguments);if(G.sn)V.push(['sn',G.sn]);return V;};})();}
