/* ===================== 補員與車輛修復（長期作戰；設定「長期作戰」關閉時不發生）
   補充兵員池：每方開戰時約為總兵力的 15%，之後只要有通往後方的補給樞紐（地圖外基地、港口、鐵路車站或機場），依年代每天補進總兵力的 1～2%。
   補人：脫離接觸一小時以上、在補給線內的部隊每 10 分鐘補一次。預備隊、休整、輪替整補的部隊最快（每小時約編制的 4%），
     其他沒有接敵的部隊約 1.5%，行軍中約 0.8%；離最近的補給節點超過 10 公里打六折、超過 25 公里打三折。新兵拉低部隊的訓練水準。
   修車：戰損的車輛最多約四成可以修復；脫離接觸時每小時修好編制的 1%，五公里內有後勤或工兵單位時 3%。
   增援點數開啟時，補人與修車依部隊點數付費。設定頁「後勤」的「補員速度」調整整體速度。
   （輕傷歸隊見 medStep；地圖外休整見 refitStep） ===================== */
function replMul(){var v=G.set.replSpd;return v===undefined?1:clamp(+v||0,0,3);}
/* 部隊狀態決定的補人速度（每小時占編制的比例） */
function replRate(u){var o=u.ord,k=o?o.k:'halt';if(k==='reserve'||k==='rest'||o&&o.dk==='rot')return 0.04;if(u.task==='go'||u.form==='march')return 0.008;return 0.015;}
/* 離最近的補給節點越遠越慢（地圖外基地以本方地圖邊緣計） */
function replNear(u){var MP=G.map,d=1e9;nodesOf(u.side).forEach(function(N){var e=SD(u.side).edge||'W',dd=N.k==='off'?(e==='W'?u.x:e==='E'?MP.Wm-u.x:e==='N'?u.y:MP.Hm-u.y):dist(N.x,N.y,u.x,u.y);if(dd<d)d=dd;});return d<10000?1:d<25000?0.6:0.3;}
/* 補充兵要從後方送來：必須有地圖外基地，或控制港口、鐵路車站、機場；孤立的守軍只能靠劇本的增援 */
function replHub(side){return nodesOf(side).some(function(N){return N.k!=='depot';});}
/* 增援點數：付不起的部分不補（回傳實際補得到的比例） */
function replPay(u,dm,dv){if(typeof rpOn!=='function'||!rpOn())return 1;var w=(u.men0+u.veh0*8)||1,cost=fpMix(u.mix)*(dm+dv*8)/w*0.9;if(!(cost>0)||rpSpend(u.side,cost,'refit'))return 1;var have=Math.max(0,rpHave(u.side)),f=clamp(have/cost,0,1);if(have>0)rpSpend(u.side,have,'refit');return f;}
function sustainStep(){var y=G.set.y||1943,day=y<1800?0.006:y<1900?0.01:y<1945?0.015:0.02,h=600/3600,M=replMul();
  SIDES().forEach(function(side){var S=SD(side);if(S.repl===undefined){var m0=0;G.units.forEach(function(u){if(u.side===side&&isLeaf(u)&&!u.irr)m0+=u.men0||0;});S.repl=m0*0.15;S.replIn=m0*day/24;}
    var hub=replHub(side);if(hub)S.repl+=(S.replIn||0)*h*M;
    G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||!alive(u)||u.irr||u.st==='off'||!u.insup)return;var s=ST(u);if(s.dom==='sea'||s.dom==='sub'||s.fl.indexOf('G')>=0)return;if(s.dom==='air'?u.st!=='base':!onMap(u))return;
      if(G.t-(u.uf||-1e9)<3600||G.t-(u.fired||-1e9)<3600)return;var f=replNear(u)*M,dm=0,dv=0;
      if(hub&&u.men<u.men0&&S.repl>0)dm=Math.min(u.men0-u.men,u.men0*replRate(u)*h*f,S.repl);
      /* 修車：戰損的車輛最多約四成可修 */var lim=(u.veh0||0)*0.4-(u.vrep||0);if(u.veh<u.veh0&&lim>0){var mech=false;gridNearS(u.x,u.y,5000,side,function(q){if(!mech&&q!==u&&onMap(q)&&isLeaf(q)&&dist(q.x,q.y,u.x,u.y)<=5000&&(ST(q).fl.indexOf('l')>=0||isEng(q)))mech=true;});dv=Math.min(u.veh0-u.veh,(u.veh0||0)*(mech?0.03:0.01)*h*M,lim);}
      if(dm<1e-3&&dv<1e-4)return;var pf=replPay(u,dm,dv);dm*=pf;dv*=pf;
      if(dm>1e-3){var t0=u.trn===undefined?s.trn:u.trn;u.trn=(t0*u.men+Math.min(t0,45)*dm)/(u.men+dm);u.men+=dm;S.repl-=dm;u.repl=(u.repl||0)+dm;u._replD=(u._replD||0)+dm;S.replT=(S.replT||0)+dm;
        if(u._replD>=Math.max(5,u.men0*0.1)){logE(side,'repl',uName(u)+'補進 '+fmt(u._replD)+' 名補充兵（兵力 '+pct(strFrac(u)*100)+'）',u.x,u.y,u.id);u._replD=0;}}
      if(dv>1e-4){u.veh+=dv;u.vrep=(u.vrep||0)+dv;S.vrepT=(S.vrepT||0)+dv;}});});}
(function(){var b=v8Step;v8Step=function(){b.apply(this,arguments);if(G.started&&!G.over&&G.step%20===15&&G.set.sustain!==false)sustainStep();};})();
