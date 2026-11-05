/* ===================== 恐懼值：官兵面對恐怖事物時的急性恐懼（與士氣分開：升得快，沒有刺激時也退得快） =====================
   來源：看見屍群與不可名狀之物（數量越多、越近越怕，夜裡更怕，短兵相接時加倍；低語者看不見也聽得到）、同袍屍變、死者復生，
   毒氣、火焰、核爆、轟炸、砲擊與白刃戰造成的傷亡、友軍潰散、令人畏懼的敵軍（戰象、飛龍等），以及敵軍的「死人衝鋒」。
   訓練與經驗、指揮官（頑強、鼓舞）、鐵的紀律、工事與司令部在旁會減輕恐懼。
   效果：拖累士氣、射擊失準；65 以上的部隊可能停止進攻、就地掩蔽；88 以上可能陷入恐慌而潰逃；
   長時間處在 70 以上，部分官兵精神崩潰（戰鬥壓力反應：後送，不計陣亡）。
   死人衝鋒（取材自 1915 年俄軍守衛奧索維茨要塞時遭氯氣攻擊後的反擊）：近一小時內一成以上官兵因毒氣傷亡、仍未潰散的守軍，
   在敵軍逼近時可能用布巾蒙住口鼻衝出陣地反擊；看見這群被毒氣灼傷、咳著血衝來的官兵，進攻的一方極度驚恐，即使兵力占優也可能潰逃。
   背水一戰：恐懼到了極限、退無可退（潰散或極度驚恐，敵軍逼近到 600 公尺內，被包圍或退路被切斷）的部隊，有機會反而激發死戰的勇氣：
   停止潰逃、不再投降，固守或向逼近的敵軍反衝，射擊更猛烈、也不再找掩蔽，雙方傷亡都會加重；約半小時後力竭。
   投降者遭處決的消息：敵軍拒絕受降或處決戰俘時，附近三公里內的友軍立刻知道，之後口耳相傳，兩小時後傳遍全軍；
   聽到消息的部隊短期內更恐懼，但投降的機率大降，面臨投降與否時寧可背水一戰或撤退。
   恐懼承受值與英勇（編制頁可調，設在編制上會套用到底下所有部隊）：承受值越高恐懼升得越慢；英勇越高，越容易背水一戰或發起死人衝鋒。
   設定在 G.set.fear（預設開啟）；用自己的亂數（存在 G.frs），不影響其他模擬的亂數。 */
var FRK={gas:3,nerve:3.5,blister:3,mias:2,burn:2.5,flame:2.5,breath:3,nuke:4,snuke:4,fallout:1.5,rad:1.5,art:1.3,airstrike:1.6,air:1.2,msl:1.4,expl:1.5,drop:1.4,melee:1.6,zed:2.2,zturn:4,zamp:1.5,exec:1.5,ff:1.6,uxo:1.5,grapple:2.5,storm:0.8,quake:1.2,drown:1.2};
var FRKK={gas:'gas',nerve:'gas',blister:'gas',mias:'gas',burn:'fire',flame:'fire',breath:'fire',nuke:'nuke',snuke:'nuke',fallout:'nuke',rad:'nuke',art:'art',airstrike:'bomb',air:'bomb',msl:'bomb',expl:'bomb',melee:'melee',zed:'hor',zturn:'turn',zamp:'turn',ff:'ff',exec:'exec'};
var FRN={atro:'友軍投降遭處決',hor:'屍群',dem:'不可名狀之物',psyw:'聽見低語',turn:'同袍屍變',rise:'死者復生',gas:'毒氣',fire:'火焰',nuke:'核爆',bomb:'轟炸',art:'砲擊',cas:'傷亡',melee:'白刃戰',ff:'友軍誤擊',exec:'處決',rout:'友軍潰散',dmc:'死人衝鋒',aura:'令人畏懼的敵軍'};
var FRADV=/^(attack|storm|breakthrough|penetrate|pursue|siege|eager|joint|crossing)$/;
if(typeof KIAF!=='undefined')KIAF.psy=1e-4;
if(typeof KINDN!=='undefined')KINDN.psy='精神崩潰（戰鬥壓力反應）';
if(typeof MFN!=='undefined')MFN.terror='恐懼';
if(typeof RPC!=='undefined')RPC.fear='恐懼';
if(typeof ORDN!=='undefined'){ORDN.dmc='死人衝鋒';ORDN.lst='背水一戰';}
/* 線上：恐懼值變化 0.5 以上才送；逐步的明細與計時不送 */if(typeof MPTOL!=='undefined')MPTOL.fear=0.5;if(typeof MPUX!=='undefined'){MPUX.fk=1;MPUX.frT=1;MPUX.frH=1;MPUX.frB=1;MPUX.gasR=1;}if(typeof MPWU!=='undefined'){MPWU.frTol='n';MPWU.brave='n';}
function fearOn(){return !G||!G.set||G.set.fear!==false;}
/* 自己的亂數（xorshift32） */
function frr(){var x=G.frs|0;if(!x)x=(hstr((G.set.seed||'')+'|fear')|0)||1;x^=x<<13;x^=x>>>17;x^=x<<5;G.frs=x;return (x>>>0)/4294967296;}
function fearOk(u){return isLeaf(u)&&onMap(u)&&alive(u)&&u.men>=1&&ST(u).dom==='land'&&u.st!=='air';}
/* 恐懼承受值與英勇：百分比（預設 100），往上找最近設定的編制 */
function fearTolOf(u){var x=u;while(x){if(x.frTol!==undefined&&x.frTol!==null)return clamp(+x.frTol||100,25,300)/100;x=x.p>=0?uById(x.p):null;}return 1;}
function braveOf(u){var x=u;while(x){if(x.brave!==undefined&&x.brave!==null)return clamp(isFinite(+x.brave)?+x.brave:100,0,500)/100;x=x.p>=0?uById(x.p):null;}return 1;}
/* 抗性（乘在增加量上）：0.25～1.3，再除以恐懼承受值 */
function fearRes(u){var pi=typeof profIdxOf==='function'?profIdxOf(u):2,off=offOf(u),r=1.25-0.12*pi-Math.min(30,u.exp||0)/150;if(hasQ(off,'stubborn'))r-=0.15;if(hasQ(off,'inspire'))r-=0.1;
  if(typeof ironRt==='function'&&ironRt(u)<1)r-=0.1;if((u.ent||0)>0.5)r-=0.1;if(typeof hqNear==='function'&&hqNear(u))r-=0.08;if(clsOf(u)==='sof')r-=0.15;return clamp(r,0.25,1.3)/fearTolOf(u);}
function fearAdd(u,v,k){if(!(v>0)||!fearOn()||!fearOk(u)||(u.dmc&&G.t<u.dmc.t1)||(u.lst&&G.t<u.lst.t1))return 0;v*=fearRes(u);var f0=u.fear||0;u.fear=Math.min(100,f0+v);u.frT=G.t;var F=u.fk||(u.fk={});F[k]=Math.min(100,(F[k]||0)+v);return u.fear-f0;}
/* 一個範圍內的部隊都受到驚嚇（越近越強）；side 指定時只影響該方，ex 除外 */
function fearArea(x,y,R,v,k,side,ex){if(!fearOn()||!(v>0))return;var f=function(u){if(u===ex||(side!==undefined&&side!==null&&u.side!==side)||!fearOk(u))return;var d=dist(u.x,u.y,x,y);if(d>R)return;fearAdd(u,v*(1-0.7*d/R),k);};
  if(R<=GFR&&G._gf)gridNear(x,y,R,f);else G.units.forEach(f);}
function fearTxt(u){var F=u.fk;if(!F)return u.frS||'';return Object.keys(F).filter(function(k){return F[k]>=1&&FRN[k];}).sort(function(a,b){return F[b]-F[a];}).slice(0,3).map(function(k){return FRN[k];}).join('、');}
function fearLv(f){return f>=88?'恐慌':f>=65?'極度驚恐':f>=40?'驚恐':f>=15?'緊張':'鎮定';}
function fearRep(u,txt,pri){if(G.set.txRep===false||!G.started||u.irr||u.side<0||u.side>=nSides()||(typeof aiControls==='function'&&aiControls(u))||typeof repSend!=='function')return;repSend(u,txt,pri,'fear');}
/* ---------- 每一步（在士氣之前） ---------- */
function fearStep(){if(!fearOn())return;var night=G.env&&G.env.light<0.3,Z=G.zed&&G.zed.go&&typeof zedOn==='function'&&zedOn()&&G.zed.H&&G.zed.H.length?G.zed:null,B=Z?zedBk():null,FS=null,DM=null;
  G.units.forEach(function(f){if(!onMap(f)||!alive(f))return;if(ST(f).fl.indexOf('F')>=0)(FS||(FS=[])).push(f);if(f.dmc){if(G.t<f.dmc.t1)(DM||(DM=[])).push(f);else dmcEnd(f);}if(f.lst&&G.t>=f.lst.t1)lstEnd(f);});
  if(G.step%2===0)atroSpread();
  G.units.forEach(function(u){if(!fearOk(u)){if(u.fear)u.fear=0;return;}
    if(B)fearHorror(u,B,night);
    if(FS)for(var i=0;i<FS.length;i++){var f=FS[i];if(f.side===u.side)continue;var R=ST(f).dom==='air'?1500:1000,d=dist(f.x,f.y,u.x,u.y);if(d<R)fearAdd(u,0.4+1.2*(1-d/R),'aura');}
    if(DM)for(var j=0;j<DM.length;j++){var m=DM[j];if(m.side===u.side)continue;var dd=dist(m.x,m.y,u.x,u.y);if(dd<900)fearAdd(u,3.5*clamp(m.men/150,0.5,2)*(1-0.6*dd/900),'dmc');}
    if(u.gasR)u.gasR=u.gasR>1e-4?u.gasR*0.993:0;
    if(G.step%2===0&&!u.dmcN&&(u.gasR||0)>=0.1)dmcCheck(u);
    if(G.step%2===1&&!u.lst&&(u.ms==='rout'||(u.fear||0)>=90))lstCheck(u,'fear');
    var fresh=G.t-(u.frT||-1e9)<=DT+1,dec=fresh?0.25:1.2+(typeof hqNear==='function'&&hqNear(u)?0.8:0)+(hasQ(offOf(u),'inspire')?0.5:0)+(u.ord&&u.ord.k==='rest'?0.5:0);if(night)dec*=0.75;
    if(u.fear)u.fear=Math.max(0,u.fear-dec);if(u.fk){for(var k in u.fk){u.fk[k]*=fresh?0.97:0.88;if(u.fk[k]<0.5)delete u.fk[k];}if(!Object.keys(u.fk).length)delete u.fk;}
    /* 給畫面看的恐懼來源（線上只送這一項，不送逐步變化的明細） */var ts=u.fear>=15?fearTxt(u):'';if(ts!==(u.frS||'')){if(ts)u.frS=ts;else delete u.frS;}
    fearAct(u);});}
/* 屍群與不可名狀之物：要看得到（低語者例外），數量越多、越近越怕，夜裡更怕，短兵相接加倍 */
function fearHorror(u,B,night){var v=0,vk='hor',vm=0,VR=null;zedBkNear(B,u.x,u.y,3400,function(h){if(h.n<1)return;var K=ZK[h.k];if(!K)return;var fr=K.fr||1500,d=Math.max(0,dist(u.x,u.y,h.x,h.y)-zedR(h));if(d>fr)return;
    if(!K.psy){if(VR===null)VR=zedVR(u);if(d>VR)return;}
    var sz=clamp(Math.sqrt(h.n/(K.dem?2:200)),0.3,3),px=1-d/fr,w=(K.fear||1)*sz*px*(night?1.3:1)*(d<=120?2:1);v+=w;if(w>vm){vm=w;vk=K.dem?(K.psy?'psyw':'dem'):'hor';}});
  if(v>0)fearAdd(u,Math.min(12,v),vk);}
/* ---------- 效果：精神崩潰、恐慌潰逃、停止進攻、回報 ---------- */
function fearAct(u){var f=u.fear||0,s=ST(u);
  if(f>=70){u.frH=(u.frH||0)+DT;if(u.frH>=1200){var m=Math.min(u.men*0.05,u.men*0.0008*(f-60)/40);if(m>0.02){hit(u,null,m,0,0,'psy');u.psyN=(u.psyN||0)+m;}}}else if(u.frH)u.frH=Math.max(0,u.frH-DT*2);
  var band=f>=88?3:f>=65?2:f>=40?1:0,pb=u.frB||0;u.frB=band;
  if(u.ms==='rout'||(u.dmc&&G.t<u.dmc.t1)||(u.lst&&G.t<u.lst.t1))return;
  if(f>=88&&frr()<(f-85)/40){logE(u.side,'morale',uName(u)+'陷入恐慌而潰逃'+(fearTxt(u)?'（'+fearTxt(u)+'）':''),u.x,u.y,u.id);fearRep(u,'官兵陷入恐慌，部隊潰逃！',1);goRout(u,s);return;}
  var o=u.ord;if(f>=65&&o&&o.st==='exec'&&FRADV.test(o.dk||o.k)&&!o.frR&&frr()<0.3){o.frR=1;logE(u.side,'refuse',uName(u)+'官兵驚恐，停止進攻、就地掩蔽'+(fearTxt(u)?'（'+fearTxt(u)+'）':''),u.x,u.y,u.id);fearRep(u,'官兵驚恐，無法繼續進攻',1);activate(u,newOrder('defend',{x:u.x,y:u.y,face:u.hd,opt:{post:'hasty'},dk:'refuse'}));return;}
  if(band>=2&&pb<2)fearRep(u,'官兵極度驚恐'+(fearTxt(u)?'（'+fearTxt(u)+'）':''),2);}
/* ---------- 死人衝鋒 ---------- */
function dmcCheck(u){if((u.gasR||0)<0.1||u.ms==='rout'||u.men<30||!/^(inf|pike|mech|eng|sec|gue|mp)$/.test(clsOf(u)))return;var o=u.ord;if(o&&o.st==='exec'&&!/^(defend|halt|holdfast|fortify|reserve|refuse|delay|ambush)$/.test(o.dk||o.k))return;
  var e=u._eid?uById(u._eid):null;if(!e||!alive(e)||!onMap(e)||e.side===u.side||(u._ed||1e9)>1200)return;
  var off=offOf(u),p=0.12*braveOf(u)*(hasQ(off,'stubborn')?1.6:1)*(hasQ(off,'inspire')?1.4:1)*(typeof ironRt==='function'&&ironRt(u)<1?1.4:1)*(u.gasR>=0.25?1.5:1);if(frr()>=p)return;
  u.dmcN=1;u.dmc={t0:G.t,t1:G.t+1200,e:e.id};u.fear=0;delete u.fk;delete u.frS;u.mor=Math.max(u.mor,55);if(u.ms==='shaken')u.ms='ok';
  activate(u,newOrder('attack',{x:e.x,y:e.y,x0:u.x,y0:u.y,dk:'dmc',opt:{tac:'frontal',pace:'rush',tol:80}}));
  logE(u.side,'morale','〔死人衝鋒〕'+uName(u)+'遭毒氣重創，倖存的官兵用布巾蒙住口鼻、咳著血衝出陣地反擊',u.x,u.y,u.id);fearRep(u,'遭毒氣重創，全員衝出陣地反擊！',1);
  var seen={};gridNear(u.x,u.y,1300,function(q){if(q.side===u.side||!fearOk(q)||dist(q.x,q.y,u.x,u.y)>1300)return;fearAdd(q,22*(1-0.5*dist(q.x,q.y,u.x,u.y)/1300),'dmc');seen[q.side]=1;});
  Object.keys(seen).forEach(function(s){logE(+s,'morale','敵軍陣地衝出一群被毒氣灼傷、咳著血的官兵，我軍官兵驚恐',u.x,u.y);});}
function dmcEnd(u){var D=u.dmc;u.dmc=null;if(!alive(u))return;u.org=Math.max(0,(u.org||0)-30);u.fat=Math.min(100,(u.fat||0)+25);logE(u.side,'morale',uName(u)+'的反擊衝鋒結束，中毒的官兵已筋疲力竭',u.x,u.y,u.id);}
/* ---------- 背水一戰 ---------- */
function lstCut(u){var enc=G.t-(u.encT||-1e9)<600||(u.besieged&&G.t-u.besieged<1200);return enc||friendNear(u.side,u.x,u.y,2500)-(u.men+u.veh*8)<=0;}
function lstCheck(u,why){if(!fearOn()||u.lst||(u.lstN||0)>=2||u.men<15||!fearOk(u)||clsOf(u)==='beast')return false;var e=u._eid?uById(u._eid):null;if(!e||!alive(e)||!onMap(e)||e.side===u.side||(u._ed||1e9)>600)return false;
  if(why!=='atro'&&!lstCut(u))return false;var off=offOf(u),r=nsrOf(u),p=(why==='atro'?0.25:0.05)*braveOf(u)*(hasQ(off,'stubborn')?1.5:1)*(hasQ(off,'inspire')?1.3:1)*(1+2*r)*((u.fear||0)>=95?1.5:1);if(frr()>=p)return false;lstStart(u,e,why);return true;}
function lstStart(u,e,why){u.lst={t0:G.t,t1:G.t+1800,e:e.id};u.lstN=(u.lstN||0)+1;u.fear=0;delete u.fk;delete u.frS;u.mor=Math.max(u.mor,65);u.ms='ok';u.routT=0;
  var d=dist(u.x,u.y,e.x,e.y);activate(u,d<500?newOrder('attack',{x:e.x,y:e.y,x0:u.x,y0:u.y,dk:'lst',opt:{tac:'frontal',pace:'rush',tol:90}}):newOrder('defend',{x:u.x,y:u.y,face:Math.atan2(e.y-u.y,e.x-u.x),opt:{post:'holdfast'},dk:'lst'}));
  logE(u.side,'morale','〔背水一戰〕'+uName(u)+(why==='atro'?'知道投降只有死路一條，':'退無可退，')+'官兵決心死戰',u.x,u.y,u.id);fearRep(u,why==='atro'?'投降只有死路一條，全員死戰！':'退無可退，全員死戰！',1);
  if(e.side>=0&&e.side<nSides())logE(e.side,'morale','已經潰散的敵軍突然回頭死戰（'+placeTxt(u.x,u.y)+'）',u.x,u.y);}
function lstEnd(u){u.lst=null;if(!alive(u))return;u.org=Math.max(0,(u.org||0)-25);u.fat=Math.min(100,(u.fat||0)+20);u.fear=Math.max(u.fear||0,35);logE(u.side,'morale',uName(u)+'的死戰告一段落，倖存的官兵筋疲力竭',u.x,u.y,u.id);}
/* 退不了也不投降：向敵軍反方向撤退 */
function lstFall(u){var e=u._eid?uById(u._eid):null;if(!e||!onMap(e))return;var ax=u.x-e.x,ay=u.y-e.y,d=Math.hypot(ax,ay)||1,q=validPos({dom:'land'},u.x+ax/d*1500,u.y+ay/d*1500);if(!q)return;
  activate(u,newOrder('withdraw',{x:q[0],y:q[1],dk:'twd',face:Math.atan2(-ay,-ax)}));logE(u.side,'twd',uName(u)+'不願投降，向後撤退',u.x,u.y,u.id);}
/* ---------- 投降者遭處決的消息 ---------- */
function nsrOf(u){var A=G.sides&&G.sides[u.side]&&G.sides[u.side].atro;if(!A||!A.n)return 0;var r=u.atH?0.8:0;if(A.all)r=Math.max(r,Math.min(0.8,0.3*A.n));return r;}
function atroHear(u){if(u.atH)return false;u.atH=Math.max(1,G.t);fearAdd(u,12,'atro');return true;}
function atroNews(side,x,y){if(!fearOn()||!(side>=0&&side<nSides()))return;var S=G.sides[side],A=S.atro||(S.atro={n:0});A.n++;A.t=G.t;if(!A.t0)A.t0=Math.max(1,G.t);var n=0;
  gridNear(x,y,3000,function(u){if(u.side===side&&fearOk(u)&&dist(u.x,u.y,x,y)<=3000&&atroHear(u))n++;});
  logE(side,'morale','投降的官兵遭敵軍處決的消息在附近部隊間傳開'+(n?'（'+n+' 個部隊得知）':'')+'：官兵更加恐懼，但不再願意投降',x,y);}
function atroSpread(){SIDES().forEach(function(s){var A=G.sides[s]&&G.sides[s].atro;if(!A||!A.n)return;
  G.units.forEach(function(u){if(u.side!==s||!u.atH||G.t-u.atH>6*3600||!fearOk(u))return;gridNear(u.x,u.y,2000,function(q){if(q.side!==s||q.atH||!fearOk(q)||dist(q.x,q.y,u.x,u.y)>2000)return;if(frr()<0.15)atroHear(q);});});
  if(!A.all&&G.t-A.t0>=7200){A.all=1;logE(s,'morale','投降者遭處決的消息已傳遍全軍：官兵寧可死戰或撤退，也不願投降');}});}
/* ---------- 掛勾：士氣、射擊、傷亡、潰散、投降、戰爭罪行、核爆、轟炸 ---------- */
(function(){var b=moraleStep;moraleStep=function(){try{fearStep();}catch(e){if(typeof console!=='undefined')console.warn('fear',e);}return b.apply(this,arguments);};})();
(function(){var b=morDelta;morDelta=function(u){var d=b.apply(this,arguments),f=u.fear||0;if(f>3&&u.ms!=='rout'&&fearOn()){var v=-f*0.006;d+=v;mfAdd(u,'terror',v);}return d;};})();
(function(){var b=firerMod;firerMod=function(u,s){var f=b.apply(this,arguments),q=u.fear||0;if(u.lst&&G.t<u.lst.t1)return f*1.35;return q>0?f*(1-q/250):f;};})();
(function(){var b=applyDamage;applyDamage=function(){if(fearOn()&&G._inc){for(var id in G._inc){var I=G._inc[id],t=uById(+id);if(!t||!(I.m>0.05)||!fearOk(t))continue;var men=Math.max(10,t.men),kk=I.k||{},tot=0,q;for(q in kk)tot+=kk[q];if(!(tot>0))continue;
      for(q in kk){if(q==='psy'||q==='hunger')continue;var v=Math.min(30,220*(I.m/men)*(FRK[q]||1)*kk[q]/tot);if(v>0.05)fearAdd(t,v,FRKK[q]||'cas');}
      var gk=(kk.gas||0)+(kk.nerve||0)+(kk.blister||0);if(gk>0)t.gasR=(t.gasR||0)+gk/men;}
    /* 背水一戰的部隊不找掩蔽，傷亡加重 */for(var id2 in G._inc){var t2=uById(+id2);if(t2&&t2.lst&&G.t<t2.lst.t1){G._inc[id2].m*=1.3;G._inc[id2].v*=1.3;}}}
  return b.apply(this,arguments);};})();
(function(){var b=goRout;goRout=function(u,s){if((u.dmc&&G.t<u.dmc.t1)||(u.lst&&G.t<u.lst.t1))return;b.apply(this,arguments);if(fearOn()&&onMap(u)&&ST(u).dom==='land')fearArea(u.x,u.y,1500,5,'rout',u.side,u);};})();
(function(){var b=surrCheck;surrCheck=function(u,s,off,PF,rt,routing){if(u.lst&&G.t<u.lst.t1)return false;var r=fearOn()?nsrOf(u):0;
  if(r>0&&(u._ed||1e9)<1500&&frr()<r){/* 寧死不降：背水一戰，否則撤退 */if(!lstCheck(u,'atro')&&!routing&&!(u.ord&&u.ord.dk==='twd'))lstFall(u);return false;}return b.apply(this,arguments);};})();
(function(){var b=warCrime;warCrime=function(u,kind,v){var e=b.apply(this,arguments);try{if(fearOn()&&u&&(kind==='exec'||kind==='powex')&&v>=1&&u.side>=0&&u.side<nSides())(nSides()<3?[1-u.side]:hostSides(u.side)).forEach(function(es){atroNews(es,u.x,u.y);});}catch(x){}return e;};})();
(function(){var b=nukeAt;nukeAt=function(side,x,y,Y){var r=b.apply(this,arguments);if(fearOn())fearArea(x,y,Math.min(20000,nukeR(Y)[3]*4),45,'nuke');return r;};})();
(function(){var b=carpetHit;carpetHit=function(side,src,cx,cy,ang,L,W){var r=b.apply(this,arguments);if(fearOn())fearArea(cx,cy,Math.min(6000,Math.max(L,W)/2+1500),14,'bomb');return r;};})();
