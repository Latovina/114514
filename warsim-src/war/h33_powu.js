/* ===================== 戰俘營：後送與戰俘部隊。戰俘營可以把收容的戰俘押往本方後方送出戰區（後送）；也可以把戰俘編成消耗型的作戰部隊——
   強迫戰俘對本國作戰自 1907 年海牙公約起即被禁止（1929、1949 年日內瓦公約重申，1949 年起屬嚴重違反），記為戰爭罪行；招募「志願者」也算違反。
   戰俘部隊沒有車輛、武器老舊、訓練與士氣低落，靠近原屬國部隊或士氣崩潰時容易倒戈，倒戈時會向看守他們的部隊開火 ===================== */
function isPowCamp(u){return ST(u).fl.indexOf('Q')>=0;}
function campPows(c){return G.civ?G.civ.P.filter(function(Pg){return Pg.st==='camp'&&Pg.camp===c.id&&Pg.n>=0.5;}):[];}
function campCount(c){return campPows(c).reduce(function(a,Pg){return a+Pg.n;},0);}
function powLawTxt(){var y=G.set.y||1943;return y>=1949?'違反 1949 年日內瓦第三公約（強迫戰俘在敵國軍隊服役屬嚴重違反）':y>=1929?'違反 1929 年日內瓦公約與 1907 年海牙公約':y>=1907?'違反 1907 年海牙公約（不得強迫敵國國民參加對其本國的作戰）':'';}
/* 從營裡取出 n 人（依各批比例），回傳原屬方 */
function campTake(c,n){var L=campPows(c),tot=campCount(c),from=enemyOf(c.side);if(tot<0.5)return from;var f=Math.min(1,n/tot);L.forEach(function(Pg){var k=Pg.n*f;Pg.n-=k;Pg.wnd=Math.max(0,Math.min(Pg.wnd,Pg.n));from=Pg.from;if(Pg.n<0.5)Pg.st='gone';});c.pw=Math.max(0,(c.pw||0)-n);return from;}
/* ---------- 後送：押往本方地圖邊緣，送出戰區 ---------- */
function powEvac(c){var L=campPows(c),n=0;L.forEach(function(Pg){Pg.st='col';Pg.camp=0;Pg.evac=1;var d=edgeNear(c.side,c.x,c.y),P=findPath({dom:'land',mobi:0,vr:4,vx:2.5,fl:''},Pg.x,Pg.y,d[0],d[1],{max:80000});Pg.dest=d;Pg.path=P?P.pts:[Pg.x,Pg.y,d[0],d[1]];Pg.pi=2;n+=Pg.n;});
  c.pw=Math.max(0,(c.pw||0)-n);if(n>=0.5)logE(c.side,'pow',uName(c)+'把 '+fmt(n)+' 名戰俘押往後方，準備送出戰區',c.x,c.y,c.id);return n;}
(function(){var b=powStep;powStep=function(dt){b(dt);if(!G.civ)return;G.civ.P.forEach(function(Pg){if(!Pg.evac||Pg.st!=='rear')return;Pg.st='gone';var S=G.stats[Pg.side];S.powEvac=(S.powEvac||0)+Pg.n;G.civ.cs[Pg.side].powHeld=Math.max(0,G.civ.cs[Pg.side].powHeld-Pg.n);
  logE(Pg.side,'pow',fmt(Pg.n)+' 名'+G.sides[Pg.from].name+'戰俘已後送出戰區（'+placeTxt(Pg.x,Pg.y)+'）',Pg.x,Pg.y);Pg.n=0;});};})();
/* ---------- 編成戰俘部隊 ---------- */
function powType(c){var ek=uEra(c).k,best=null;Object.keys(UT).forEach(function(k){var t=UT[k];if(t.era!==ek||t.br!=='inf'||!(t.sa>0)||t.veh>2||/[GQRDNk]/.test(t.fl))return;if(!best||Math.abs(t.men-150)<Math.abs(best.men-150))best=t;});return best?best.k:'ri1940';}
/* 可編成的人數：強制＝健壯者約八成五；志願＝一成左右（待遇越差，為了離開戰俘營而「志願」的人越多） */
function powRaiseN(c,mode){var L=campPows(c),able=L.reduce(function(a,Pg){return a+Math.max(0,Pg.n-Pg.wnd);},0);return mode==='vol'?able*(0.06+0.03*polOf(c,'pow')):able*0.85;}
function powRaise(c,mode,maxN){if(!isPowCamp(c)||!alive(c))return null;var n=Math.floor(Math.min(powRaiseN(c,mode),maxN||1e9));if(n<30)return null;var from=campTake(c,n),tk=powType(c),nCo=clamp(Math.ceil(n/180),1,10),per=n/nCo,made=[],vol=mode==='vol',P=c.p>=0?c.p:-1;
  for(var i=0;i<nCo;i++){var u=addLeaf(c.side,tk,1,'戰俘'+(vol?'志願':'')+'第'+(i+1)+'連',P,mb32(hstr('pow'+c.id+'|'+G.t+'|'+i)));u.men0=u.men=Math.round(per);u.veh0=u.veh=0;u.mor=vol?38:22;u.trn=30;u.exp=0;u.powU={from:from,mode:mode,t:G.t,camp:c.id};
    var a=validPos({dom:'land'},c.x+(i-(nCo-1)/2)*250,c.y+180);placeUnit(u,a[0],a[1],c.hd||0);u.st='ok';u.form='deployed';u.task='hold';if(typeof logInit==='function')logInit(u);if(u.lg){u.lg.fuel=0;}u.ammo=55;if(typeof disInit==='function'){disInit(u);u.dis0=u.dis=vol?40:20;}made.push(u);}
  reix();var S=G.civ.cs[c.side];S.powForced=(S.powForced||0)+n;S.powHeld=Math.max(0,S.powHeld-n);var law=powLawTxt(),txt=uName(c)+(vol?'在戰俘中招募「志願者」':'強迫')+' '+fmt(n)+' 名'+G.sides[from].name+'戰俘編成 '+nCo+' 個連，投入作戰'+(law?'——'+law:'');
  if(law){var e=warCrime(c,'powforce',n,txt,true);civEv('crime',c.side,e.txt,c.x,c.y,c.id,{wc:1});}else logE(c.side,'pow',txt,c.x,c.y,c.id);return made;}
/* ---------- 倒戈：靠近原屬國部隊、士氣崩潰或看守薄弱時 ---------- */
function powDefect(u,why){var from=u.powU.from,men=Math.round(u.men),hurt=0;gridNear(u.x,u.y,1000,function(q){if(hurt||q.side!==u.side||q===u||!onMap(q)||!isLeaf(q)||ST(q).dom!=='land'||q.powU)return;hit(q,null,Math.min(q.men*0.06,men*0.05),0,25,'fire');hurt=q.id;});
  G.stats[from].lib=(G.stats[from].lib||0)+men*0.8;var S=G.stats[u.side];S.powDef=(S.powDef||0)+men;destroy(u,'defect','⚠ '+uName(u)+'倒戈'+(why?'（'+why+'）':'')+'：約 '+fmt(men)+' 名戰俘'+(hurt?'向'+uName(uById(hurt))+'開火後':'')+'投向'+G.sides[from].name);}
function powUStep(){G.units.forEach(function(u){if(!u.powU||!alive(u)||!onMap(u))return;var forced=u.powU.mode!=='vol',en=enemyNear(u.side,u.x,u.y,2000,'land'),gd=friendNear(u.side,u.x,u.y,1500)-u.men;
  var p=(en>0?(forced?0.12:0.04):(forced?0.008:0.002))*(u.mor<30?2:1)*(u.ms==='shaken'?2:u.ms==='rout'?4:1)*(gd>u.men*0.5?0.5:1);if(rnd()<p)powDefect(u,en>0?'接近原屬國部隊':u.ms==='rout'?'潰散':'看守薄弱');});}
/* 戰俘部隊不投降（直接倒戈）；士氣不會因政策回升 */
(function(){var b=surrCheck;surrCheck=function(u,s,off,PF,rt,routing){if(u.powU){if((u._ed||1e9)<800&&rnd()<0.3){powDefect(u,'被原屬國部隊包圍');return true;}return false;}return b(u,s,off,PF,rt,routing);};})();
/* AI：戰俘營附近 5 公里內有敵軍時後送戰俘；兵力崩潰在即、又採嚴酷戰俘政策的一方會強迫戰俘作戰 */
function powAI(){SIDES().forEach(function(side){if(!SD(side).ai)return;var st=sideStr(side);G.units.forEach(function(c){if(c.side!==side||!alive(c)||!onMap(c)||!isPowCamp(c)||!aiControls(c))return;var n=campCount(c);if(n<30)return;
  if(polOf(c,'pow')>=3&&st.f<0.45&&!c._powR){c._powR=1;powRaise(c,'force');return;}if(enemyNear(side,c.x,c.y,5000,'land')>0&&G.t-(c._powE||-1e9)>3600){c._powE=G.t;powEvac(c);}});});}
(function(){var b=v8Step;v8Step=function(){b();if(G.step%20===13){powUStep();if(G.step%120===13)powAI();}};})();
