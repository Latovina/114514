/* ===================== 地形視野：每個單位有自己的基本觀測距離；觀測者所在的地形（林內、巷弄、灌叢遮住視線，林緣與空曠處較好）、
   制高點（比四周高越多看得越遠，最多約 +60%）、天候與環境（雲幕壓低空中觀測、野火濃煙、正午熱浪蒸騰；乾燥地面的揚塵、雪地上的足跡讓移動中的部隊更顯眼）。
   偵察與警戒部隊抵達後會移往附近的制高點設觀察哨；視域（看得到與看不到的地方）可在地圖上顯示 ===================== */
/* 觀測者所在地表的視線係數：林內、巷弄只能從縫隙、窗口往外看 */
var VOBS={marsh:0.85,scrub:0.85,dfor:0.55,cfor:0.55,jung:0.4,orch:0.8,hedge:0.65,vill:0.8,town:0.7,city:0.6,ind:0.7,rubble:0.75,old:0.55,sub:0.8,park:0.9,port:0.8,rly:0.9};
var VOA=null;
function vObsC(c){if(!VOA)VOA=LC.map(function(r){return VOBS[r[0]]||1;});return VOA[c]||1;}
/* 觀測位置的地形係數：在林緣、村落邊緣（緊鄰空曠地）時取平方根 */
function vObsAt(k){var MP=G.map,m=vObsC(MP.lc[k]);if(m>=1)return 1;var W=MP.GW,H=MP.GH,x=k%W,y=(k-x)/W,edge=false;
  if(x>0&&vObsC(MP.lc[k-1])>=0.95||x<W-1&&vObsC(MP.lc[k+1])>=0.95||y>0&&vObsC(MP.lc[k-W])>=0.95||y<H-1&&vObsC(MP.lc[k+W])>=0.95)edge=true;return edge?Math.sqrt(m):m;}
/* 相對高度：這一格比四周（1.5 與 3 公里外各八個方向）的平均高出多少公尺 */
var VTG={mp:null,c:new Map()};
function vRel(k){var MP=G.map;if(VTG.mp!==MP){VTG.mp=MP;VTG.c=new Map();}var r=VTG.c.get(k);if(r!==undefined)return r;
  var W=MP.GW,H=MP.GH,cs=MP.cs,x=k%W,y=(k-x)/W,e0=Math.max(0,MP.el[k]),s=0,n=0;
  for(var q=0;q<2;q++){var rc=Math.max(2,Math.round((q?3000:1500)/cs));for(var i=0;i<8;i++){var a=i*PI/4,nx=Math.round(x+Math.cos(a)*rc),ny=Math.round(y+Math.sin(a)*rc);if(nx<0||ny<0||nx>=W||ny>=H)continue;s+=Math.max(0,MP.el[ny*W+nx]);n++;}}
  r=n?e0-s/n:0;if(VTG.c.size>200000)VTG.c.clear();VTG.c.set(k,r);return r;}
/* 制高點加成：高出四周 50 公尺約 +18%、100 公尺約 +31%、200 公尺約 +48%，最多 +60% */
function vtgOf(rel){return rel>8?1+0.6*(1-Math.exp(-(rel-8)/120)):1;}
function vPosMul(k){return vObsAt(k)*vtgOf(vRel(k));}
(function(){var b=spotOf;spotOf=function(u,s){var r=b(u,s);if(!(r>0)||s.dom!=='land'||!onMap(u))return r;return r*vPosMul(cellAt(u.x,u.y));};})();
/* 天候與環境：低雲幕、薄霧讓空中看不清地面；野火的濃煙；正午 32 °C 以上的熱浪蒸騰讓地面遠距離觀測模糊 */
function vWxAir(){var E=G.env||{};return E.wx===WXI.over?0.85:E.wx===WXI.mist?0.75:1;}
function vEnvMul(air){var E=G.env||{},m=1;if(E.smoke)m*=0.8;if(!air&&E.T>=32&&E.light>=0.99)m*=0.9;return m;}
(function(){var b=visMul;visMul=function(nv,air){return b(nv,air)*(air?vWxAir():1)*vEnvMul(air);};})();
/* 目標：乾燥地面上行駛的車輛揚起塵土（沙漠最明顯），積雪上留下足跡 */
function vDust(t,ts){var E=G.env||{};if(ts.dom!=='land'||t.foot||G.t-(t.movedAt||-1e9)>=70)return 1;if(!(typeof fuelDep==='function'?fuelDep(t):t.veh>=3))return 1;if(E.mud>=0.15||E.snow>0.2)return 1;var W=WX[E.wx]||WX[0];if(W[3]||W[4])return 1;
  var id=LC[G.map.lc[cellAt(t.x,t.y)]][0];return id==='desert'||id==='sand'?1.45:id==='rock'||id==='tund'||id==='burnt'?1.25:(id==='field'||id==='mead'||id==='scrub')&&E.T>18?1.15:1;}
(function(){var b=sigOf;sigOf=function(t,ts,air){var f=b(t,ts,air);if(ts.dom!=='land')return f;f*=vDust(t,ts);var E=G.env||{};if(E.snow>0.3&&G.t-(t.movedAt||-1e9)<600)f*=1.12;return f;};})();
/* ---------- 視域：從觀測者向外放射 nr 條射線，逐段比較仰角（含地球曲率；與通視判定 los 相同：觀測者附近 losR 以內的地物不算遮蔽，看不到的地方再從前出 losF 的位置看一次），算出半徑內哪些地方看得到 ---------- */
/* 回傳 v：0 看不到（地形死角）、1 看得到、2 地圖外；frac 為看得到的面積比例（地圖內，依距離加權） */
function viewshed(x0,y0,h0,R,nr,th){var MP=G.map,cs=MP.cs,rl=losR(),f=losF(),rf=cs*1.5,k0=cellAt(x0,y0),e0=Math.max(0,MP.el[k0])+h0,st=Math.max(cs*0.9,R/48),ns=Math.max(2,Math.ceil(R/st)),Rm=(MP.R||6371)*1000*1.33,out=new Uint8Array(nr*ns).fill(2),seen=0,tot=0;th=th===undefined?3:th;
  for(var i=0;i<nr;i++){var a=i*2*PI/nr,ca=Math.cos(a),sa=Math.sin(a),mx=-1e9,j,d,x,y,k,cv,ta;
    /* 從部隊位置看 */
    for(j=0;j<ns;j++){d=(j+1)*st;x=x0+ca*d;y=y0+sa*d;if(x<0||y<0||x>=MP.Wm||y>=MP.Hm)break;k=cellAt(x,y);cv=d*d/(2*Rm);ta=(Math.max(0,MP.el[k])+th-e0-cv)/d;out[i*ns+j]=d<rl||k===k0||ta>=mx?1:0;if(k!==k0&&d>=rl){var oa=(hAt(k)-e0-cv)/d;if(oa>mx)mx=oa;}}
    /* 觀察員朝這個方向前出 f 公尺再看（只算 1.6f 以外，與 los 相同） */
    var fx0=x0+ca*f,fy0=y0+sa*f;if(R>=f*1.6&&fx0>=0&&fy0>=0&&fx0<MP.Wm&&fy0<MP.Hm){var kf=cellAt(fx0,fy0),ef=Math.max(0,MP.el[kf])+h0,m2=-1e9;
      for(j=0;j<ns;j++){d=(j+1)*st;if(d<=f)continue;x=x0+ca*d;y=y0+sa*d;if(x<0||y<0||x>=MP.Wm||y>=MP.Hm)break;var dd=d-f;k=cellAt(x,y);cv=dd*dd/(2*Rm);ta=(Math.max(0,MP.el[k])+th-ef-cv)/dd;if(d>=f*1.6&&out[i*ns+j]===0&&(dd<rf||k===kf||ta>=m2))out[i*ns+j]=1;if(k!==kf&&dd>=rf){var ob=(hAt(k)-ef-cv)/dd;if(ob>m2)m2=ob;}}}
    for(j=0;j<ns;j++){var q=out[i*ns+j];if(q===2)continue;d=(j+1)*st;tot+=d;if(q===1)seen+=d;}}
  return {nr:nr,ns:ns,st:st,R:R,v:out,frac:tot?seen/tot:1};}
/* 單位目前的視野：基本距離（含編制、軍官、行軍、壓制）× 地形 × 制高點 × 天候與光線；R 為開闊地上一般目標的發現距離 */
function visInfo(u){var s=ST(u),air=s.dom==='air'&&u.st==='air',k=onMap(u)?cellAt(u.x,u.y):-1,R=spotOf(u,s),ter=1,rel=0,vt=1;
  if(k>=0&&s.dom==='land'){ter=vObsAt(k);rel=vRel(k);vt=vtgOf(rel);}var vm=R>0?visMul(s.nv,air):0;return {base:ter*vt>0?R/(ter*vt):R,ter:ter,rel:rel,vt:vt,vm:vm,R:R*vm,c:k>=0?G.map.lc[k]:-1,air:air};}
/* ---------- 觀察哨：偵察、警戒部隊抵達後在附近 700 公尺內找視野最好的位置（制高點、林緣），一道命令只調整一次 ---------- */
function vOpSeek(u,s){var o=u.ord;if(!o||o.vtgD||!(o.k==='recon'||o.k==='screen')||u.task!=='hold'||s.dom!=='land'||u.ms!=='ok'||!onMap(u))return;if(G.set.opSeek===false)return;
  if(G.t-(u.uf||-1e9)<300||(u._ed||1e9)<1500)return;o.vtgD=1;var cur=vPosMul(cellAt(u.x,u.y)),best=null,bs=cur*1.12;
  for(var i=0;i<32;i++){var a=(i>>1)*PI/8,R=i&1?700:350,p=validPos(s,u.x+Math.cos(a)*R,u.y+Math.sin(a)*R);if(dist(p[0],p[1],u.x,u.y)>900||dist(p[0],p[1],o.x,o.y)>1000)continue;var sc=vPosMul(cellAt(p[0],p[1]));if(sc>bs){bs=sc;best=p;}}
  if(!best)return;var rel=vRel(cellAt(best[0],best[1]));o.x=best[0];o.y=best[1];o.vtgM=1;u.task='go';wantPath(u,best[0],best[1]);
  logE(u.side,'arr',uName(u)+'移往附近'+(rel>15?'的制高點（高出四周約 '+Math.round(rel)+' 公尺）':'視野較好的位置')+'設立觀察哨',best[0],best[1],u.id);}
(function(){var b=leafStep;leafStep=function(u){b(u);if((G.step+u.id)%4===0){try{vOpSeek(u,ST(u));}catch(e){}}};})();
