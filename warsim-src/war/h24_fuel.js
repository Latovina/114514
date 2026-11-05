/* ===================== 油料：車輛越野、交戰與待命時都會耗油；油料不足時移動變慢、停擺、戰力打折，被迫撤退時只能炸毀車輛徒步離開；
   缺油的部隊自動前往補給點加油、補給隊把油送到停擺的部隊；飛機依任務型態耗油（巡邏省油、纏鬥時開後燃器），油料只夠返航時立即脫離 ===================== */
Object.assign(ORDN,{refuel:'加油',fuelrun:'送油'});
var FUELX={off:0.9,idle:3,cbt:8};/* 越野每公里多耗 90%；待命（引擎運轉、無線電與砲塔用電）每小時約等於 3 公里；交戰中機動每小時約 8 公里 */
function fuArmor(s){return s.mobi===4&&s.hard>=0.5||s.arm>=3;}
/* 越野里程：每一步移動的起點不在道路上就算越野 */
(function(){var b=moveStep;moveStep=function(u,s,frac){var x0=u.x,y0=u.y,r=b(u,s,frac);if(r>0&&s.dom==='land'&&!G.map.rd[cellAt(x0,y0)])u.kmX=(u.kmX||0)+r/1000;return r;};})();
/* 每 10 分鐘（後勤步）：除了行駛里程，另計越野加耗、待命與交戰的耗油 */
function fuelBurn(u,L,dt){if(!L||!(L.fuelCap>0)||!(L.lPerKm>0)||u.foot)return;var s=ST(u);if(s.dom!=='land'||!(s.mobi===3||s.mobi===4))return;var h=dt/3600,per=L.lPerKm,E=G.env||{};
  var kx=Math.max(0,(u.kmX||0)-(L.kmX0||0));L.kmX0=u.kmX||0;var wet=(E.mud||0)*0.5+(E.snow||0)*0.4,hot=G.t-Math.max(u.fired||-1e9,u.uf||-1e9)<900,near=u._ed<4000,cold=E.T!==undefined&&E.T<-5,
    turb=uEra(u).y>=1980&&s.arm>=7?2:1,off=per*kx*(FUELX.off+wet),idle=(hot||near?1:cold?0.5:0)*per*FUELX.idle*h*turb,cbt=hot?per*FUELX.cbt*h:0,use=off+idle+cbt;
  var q0=fuelQ(u);if(use>0){L.fuel=Math.max(0,L.fuel-use);L.fBurn=(L.fBurn||0)+use;}var q1=fuelQ(u);
  if(q0>=0.25&&q1<0.25&&(!u.fLowLog||G.t-u.fLowLog>6*3600)){u.fLowLog=G.t;logE(u.side,'supply',uName(u)+'油料剩不到四分之一'+(u.insup?'':'，附近沒有補給點'),u.x,u.y,u.id);}
  if(q1<=0){if(!u.dryT)u.dryT=G.t;if(fuArmor(s)&&s.fl.indexOf('g')<0){u.mor=clamp(u.mor-1.5*h,0,100);mfAdd(u,'oos',-1.5*h);}}else u.dryT=0;}
(function(){var b=consume;consume=function(u,L,dt){b(u,L,dt);fuelBurn(u,L,dt);};})();
/* 交戰與待命的油料也算進每日需求（後勤調度用） */
(function(){var b=dayNeed;dayNeed=function(u,intens,km){var q=b(u,intens,km),L=u.lg;if(L&&L.lPerKm>0&&!u.foot){var s=ST(u);if(s.dom==='land'&&(s.mobi===3||s.mobi===4))q.fuel+=L.lPerKm*(FUELX.idle*8*(intens===undefined?0.5:intens)+FUELX.cbt*2*(intens===undefined?0.3:intens))*0.8/1000;}return q;};})();
/* 戰力：油料見底的戰車與裝甲車無法機動、只能靠人力轉動砲塔、無法進入射擊位置；自走砲已在陣地上，不受影響 */
(function(){var b=lgFire;lgFire=function(u){var f=b(u);if(!u.lg||u.foot||!fuelDep(u))return f;var s=ST(u);if(s.dom!=='land'||s.fl.indexOf('g')>=0)return f;var q=fuelQ(u);if(q>=0.1)return f;var ar=fuArmor(s);
  return q<=0?f*(ar?0.6:0.85):f*(ar?0.85:0.95);};})();
function fuelFireTxt(u){var s=ST(u);if(s.fl.indexOf('g')>=0)return '';return fuArmor(s)?'戰力約剩六成（無法機動，砲塔靠人力轉動）':'戰力約剩八成五';}
/* 炸毀車輛徒步撤離：油料耗盡半小時以上，又潰散或奉命撤退，敵軍在 3 公里內 */
(function(){var b=fuelDep;fuelDep=function(u){if(u.foot)return false;return b(u);};})();
(function(){var b=lgSpeed;lgSpeed=function(u){if(u.foot){var s=ST(u);return clamp(4.5/Math.max(4.5,s.vr),0.02,1)*(u.lg&&u.lg.hun>60?0.8:1);}return b(u);};})();
function fuelScuttle(u){var L=u.lg,s=ST(u);if(u.foot||!L||!fuelDep(u)||fuelQ(u)>0||s.dom!=='land'||!(u.veh>0.5)||!u.dryT||G.t-u.dryT<1800)return false;var o=u.ord,ret=u.ms==='rout'||o&&(o.k==='withdraw'||o.dk==='refit'||o.dk==='twd'||o.dk==='delay');if(!ret||!(u._ed<3000))return false;
  var lost=u.veh*(0.75+0.2*rnd());u.veh-=lost;u.vlost=(u.vlost||0)+lost;var st=G.stats[u.side];st.scut=(st.scut||0)+lost;u.foot=G.t;u.path=null;if(u.goal&&!u.pq){u.pq=1;G.pq.push(u.id);}u.mor=clamp(u.mor-8,0,100);mfAdd(u,'oos',-8);
  logE(u.side,'supply',uName(u)+'油料耗盡又被迫撤退：炸毀約 '+fmt(lost)+' 輛車輛，乘員徒步撤離',u.x,u.y,u.id);return true;}
/* ---------- 加油：找最近有油的補給點、補給部隊或本方後方 ---------- */
function fuelSrc(u,need){var side=u.side,best=null,bd=30000;
  nodesOf(side).forEach(function(N){if(N.k==='off'||N.status==='captured'||(N.st&&N.st.fuel||0)<need*0.5)return;var d=dist(N.x,N.y,u.x,u.y);if(d<bd){bd=d;best={x:N.x,y:N.y,n:'「'+N.name+'」'};}});
  flUnits(side,'l').forEach(function(q){if(q===u||!isLeaf(q)||!q.lg||!q.lg.stk||(q.lg.stk.fuel||0)<need*0.5||q._ed<3000||q.ms==='rout')return;var d=dist(q.x,q.y,u.x,u.y);if(d<bd){bd=d;best={x:q.x,y:q.y,n:uName(q),u:q.id};}});
  if(nodesOf(side).some(function(N){return N.k==='off';})){var e=lgEdge(side,u.x,u.y),d2=dist(e[0],e[1],u.x,u.y);if(d2<bd*0.8||!best&&d2<45000){best={x:e[0],y:e[1],n:'本方後方（地圖邊緣）',edge:1};}}
  return best;}
function fuelIdle(u){var o=u.ord;return !o||o.st==='done'||/^(halt|rest|reserve|support)$/.test(o.k);}
function fuelGo(u,src){var R=uEra(u).sup*1000*(hasQ(offOf(u),'logist')?1.3:1),d=dist(u.x,u.y,src.x,src.y),k=d>R*0.5?(d-R*0.5)/d:0,p=validPos(ST(u),u.x+(src.x-u.x)*k,u.y+(src.y-u.y)*k),o=u.ord;
  u.ordPrev=o&&o.st!=='done'&&o.k!=='halt'&&o.dk!=='refuel'?{k:o.k,x:o.x,y:o.y,face:o.face,opt:o.opt,dk:o.dk,r:o.r,pts:o.pts,w:o.w}:null;u.fuelHome=[u.x,u.y];u.fuelTry=G.t;
  activate(u,newOrder('move',{x:p[0],y:p[1],dk:'refuel',opt:{road:true}}));logE(u.side,'supply',uName(u)+'油料剩 '+pct(fuelQ(u)*100)+'，前往'+src.n+'加油',u.x,u.y,u.id);}
function fuelBack(u,why){var P=u.ordPrev,H=u.fuelHome;u.ordPrev=null;u.fuelHome=null;logE(u.side,'supply',uName(u)+why,u.x,u.y,u.id);
  if(P&&P.k){P.st='exec';activate(u,newOrder(P.k,P));}else if(H&&!aiControls(u)&&dist(H[0],H[1],u.x,u.y)>600)activate(u,newOrder('move',{x:H[0],y:H[1]}));else activate(u,newOrder('halt',{}));}
/* 玩家的「加油」命令 */
function fuelCmd(u,o){var s=ST(u);if(!fuelDep(u)||s.dom!=='land'){u.task='hold';o.st='done';return;}var q=fuelQ(u);
  if(u.insup){o.st='done';u.task='hold';logE(u.side,'supply',uName(u)+'已在補給範圍內，就地加油（油料 '+pct(q*100)+'）',u.x,u.y,u.id);return;}
  if(q<=0){o.st='done';u.task='hold';logE(u.side,'supply',uName(u)+'油料已經耗盡，無法自行開往補給點，需要補給隊送油',u.x,u.y,u.id);return;}
  var src=fuelSrc(u,u.lg.fuelCap*(1-q)/1000);if(!src){o.st='done';u.task='hold';logE(u.side,'supply',uName(u)+'附近 30 公里內沒有可以加油的補給點或補給部隊',u.x,u.y,u.id);return;}u.ord=null;fuelGo(u,src);}
(function(){var b=v4Act;v4Act=function(u,o){if(o.k==='refuel'){fuelCmd(u,o);return true;}return b(u,o);};})();
/* ---------- 每 10 分鐘：自動加油、加完返回、補給隊送油給停擺的部隊 ---------- */
function fuelStep(){if(!G.started)return;var auto=G.set.autoFuel!==false;
  G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||u.st==='lift'||u.st==='ship'||u.amph||!u.lg||u.foot)return;var s=ST(u);if(s.dom!=='land'||!fuelDep(u))return;var q=fuelQ(u),o=u.ord;
    if(fuelScuttle(u))return;
    if(o&&o.dk==='refuel'){if(q>0.9)fuelBack(u,'加油完畢（'+pct(q*100)+'），'+(u.ordPrev?'返回任務':'回到原位置'));else if(G.t-(u.fuelTry||0)>5*3600)fuelBack(u,'加油失敗（找不到補給或路線受阻），放棄');return;}
    if(q>=0.25||q<=0||u.insup||u.ms==='rout'||u._ed<2500||G.t-(u.fired||-1e9)<900||G.t-(u.fuelTry||-1e9)<1800)return;
    if(!(aiControls(u)||auto&&fuelIdle(u)))return;var src=fuelSrc(u,u.lg.fuelCap*(1-q)/1000);if(src)fuelGo(u,src);else u.fuelTry=G.t;});
  SIDES().forEach(function(side){if(!SD(side))return;
    G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||!onMap(u)||!u.lg||u.foot||!fuelDep(u)||ST(u).dom!=='land'||fuelQ(u)>=0.05||u.insup)return;var by=u.frBy?uById(u.frBy):null;if(by&&by.frun&&by.frun.tgt===u.id)return;
      var need=u.lg.fuelCap/1000*0.8,best=null,bd=30000;flUnits(side,'l').forEach(function(q){if(!isLeaf(q)||q.ms==='rout'||q.frun||!q.lg||!q.lg.stk||(q.lg.stk.fuel||0)<need*0.4||q._ed<3000||q.st==='ship')return;if(!(aiControls(q)||auto&&fuelIdle(q)))return;var d=dist(q.x,q.y,u.x,u.y);if(d<bd){bd=d;best=q;}});
      if(!best)return;var R=uEra(best).sup*1000,d=dist(best.x,best.y,u.x,u.y),k=d>R*0.4?(d-R*0.4)/d:0,p=validPos(ST(best),best.x+(u.x-best.x)*k,best.y+(u.y-best.y)*k),o=best.ord;
      best.frun={t:G.t,tgt:u.id,home:[best.x,best.y],prev:o&&o.st!=='done'&&o.k!=='halt'?{k:o.k,x:o.x,y:o.y,face:o.face,opt:o.opt,dk:o.dk,r:o.r}:null};u.frBy=best.id;
      activate(best,newOrder('move',{x:p[0],y:p[1],dk:'fuelrun'}));logE(side,'supply',uName(best)+'送油給停擺的'+uName(u)+'（約 '+fmt(need,1)+' 噸）',best.x,best.y,best.id);});
    flUnits(side,'l').forEach(function(q){var F=q.frun;if(!F)return;var t=uById(F.tgt),done=!t||!alive(t)||fuelQ(t)>0.6||G.t-F.t>5*3600||q.ms==='rout';if(!done)return;q.frun=null;if(t)t.frBy=0;
      if(t&&alive(t)&&fuelQ(t)>0.6)logE(side,'supply',uName(q)+'送油完成，'+uName(t)+'恢復機動',t.x,t.y,t.id);if(F.prev){F.prev.st='exec';activate(q,newOrder(F.prev.k,F.prev));}else activate(q,newOrder('move',{x:F.home[0],y:F.home[1]}));});});}
(function(){var b=v8Step;v8Step=function(){b();if(G.step%20===13)fuelStep();};})();
/* ---------- 飛機：依任務型態耗油，油料只夠返航時立即脫離 ---------- */
/* 巡航 1 倍；巡邏（省油速度）0.8 倍；在目標上空低空攻擊 1.3 倍；直升機懸停 1.2 倍；5 公里內有敵機時纏鬥：螺旋槳機 2.5 倍、噴射機開後燃器 3.5 倍 */
function airDog(u){var A=G._air||[];for(var i=0;i<A.length;i++){var e=A[i];if(e.side===u.side||e.st!=='air'||!alive(e))continue;if(Math.abs(e.x-u.x)<5000&&Math.abs(e.y-u.y)<5000&&dist(e.x,e.y,u.x,u.y)<5000)return true;}return false;}
function airBurn(u,s){var role=airRole(u),o=u.ord,m=1;if(u.task==='loiter'){m=o&&o.k==='patrol'?0.8:1.3;if(role==='heli')m=1.2;if(role==='uav'||role==='airship'||role==='beast'||role==='support')m=1;}
  if((s.aa>0||role==='fighter')&&airDog(u))m=s.vr>=700?3.5:2.5;return m;}
(function(){var b=airStep;airStep=function(u,s){if(u.st==='air'&&!u.lift&&u.task!=='lift'){var m=airBurn(u,s);u.fbm=m;if(m!==1)u.fuel-=(m-1)*DT;
    if(u.task!=='rtb'&&u.task!=='egress'&&u.fuel>0){var B=baseOf(u),tH=dist(u.x,u.y,B[0],B[1])/(s.vr/3.6);if(u.fuel<tH*1.2+600){u.task='rtb';u.path={pts:[u.x,u.y,B[0],B[1]],i:2};
      if(!u.bingoT||G.t-u.bingoT>3600){u.bingoT=G.t;logE(u.side,'air',uName(u)+'油料只夠返航（剩約 '+durTxt(Math.max(60,u.fuel))+'），'+(m>2?'脫離空戰':'結束任務')+'返回基地',u.x,u.y,u.id);}}}}
  b(u,s);};})();
/* 剩餘滯空時間（秒）：以目前的耗油率估算，扣除返航所需 */
function airLeft(u){var s=ST(u),B=baseOf(u),m=u.fbm||1,tH=dist(u.x,u.y,B[0],B[1])/(s.vr/3.6);return {fuel:Math.max(0,u.fuel||0),m:m,station:Math.max(0,((u.fuel||0)-tH*1.2-600)/m),home:tH};}
/* 編制層級的「加油」：轄下用油的部隊各自去加油，其他部隊照原任務 */
(function(){var b=planOrder;planOrder=function(F,o){if(o.k!=='refuel')return b(F,o);var out=[];kidsOf(F).filter(alive).forEach(function(u){var L=isLeaf(u)?[u]:leavesOf(u).filter(alive);if(L.some(function(l){return !l.foot&&fuelDep(l)&&ST(l).dom==='land';}))out.push([u,newOrder('refuel',{})]);});return out;};})();
