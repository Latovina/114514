/* ===================== 疲憊值：長途奔襲與長期在戰場上累積的疲憊 =====================
   u.fat 是當下的體力：行軍、交火、夜戰時累加，停下來就回復。
   u.exh 是長期的疲憊（0～100）：缺乏睡眠、連日強行軍與連續作戰一天天累積，只有遠離敵人真正休息，或撤到後方整補才會慢慢消退。
   u.slp 缺的睡眠（小時）；u.mkm 最近一天內走了多少公里；u.cday 累計在火線上的天數；u.strg 行軍落伍的比例；u.exhN 戰鬥疲勞後送的人數。
   參考：美軍 FM 21-18 徒步行軍一天約 32 公里，強行軍走得更遠但會大量落伍；FM 6-22.5 連續作戰每人每天至少要睡 4 小時，
   不睡 24 小時表現約降四分之一，72 小時後嚴重失能；二戰的研究（Swank 與 Marchand，1946）指出步兵連續作戰約一個月後效能開始下降，
   兩個月後幾乎人人出現戰鬥疲勞。 */
function exhOn(){return !!G&&G.set.exh!==false;}
/* 一天走多少算強行軍：徒步 30 公里、騎乘與畜力 50 公里、車輛 200 公里 */
function exhCap(s){return s.mobi===0?30:s.mobi<=2?50:200;}
function exhLv(v){return v>=85?4:v>=65?3:v>=40?2:v>=20?1:0;}
var EXHN=['精神尚可','疲乏','疲憊','精疲力竭','瀕臨崩潰'];
function exhWhy(u){var L=[];if(u.slp>=12)L.push('缺乏睡眠約 '+fx(u.slp,0)+' 小時');var s=ST(u);if(u.mkm>exhCap(s)*0.8)L.push('一天內行軍 '+fx(u.mkm,0)+' 公里'+(u.mkm>exhCap(s)?'（強行軍）':''));
  if(u.cday>=0.5)L.push('累計在火線上 '+fx(u.cday,1)+' 天');if(u.strg>=0.02)L.push('落伍 '+pct(u.strg*100));return L.join('、');}
/* 效果：射擊、行進、偵察、士氣回復上限、恐懼 */
function exhFire(u){var e=u.exh||0;return (e>20?1-0.0035*(e-20):1)*(1-(u.strg||0));}
function exhMove(u){var e=u.exh||0;return e>30?1-0.003*(e-30):1;}
function exhSpot(u){var e=u.exh||0,m=e>30?1-0.004*(e-30):1;if(G.env.light<0.3&&(u.slp||0)>24)m*=0.85;return m;}
function exhMorCap(u){var e=u.exh||0;return e>40?0.25*(e-40):0;}
function exhFear(u){var e=u.exh||0;return e>40?1+(e-40)/120:1;}
/* 每 10 分鐘結算一次 */
function exhStep(){if(!exhOn())return;var h=1/6,t=G.t,night=G.env.light<0.3,T=G.env.T,wx=T!==undefined&&(T<-5||T>30);
  G.units.forEach(function(u){if(!isLeaf(u)||u.st==='dead')return;var s=ST(u);if(s.dom!=='land')return;if(u.exh===undefined){u.exh=0;u.slp=0;u.mkm=0;u.cday=0;u.strg=0;}
    if(!onMap(u)){u.mkm*=Math.exp(-h/24);u._exx=undefined;if(u.st==='off'){var rf=!!u.refit;u.exh=Math.max(0,u.exh-(rf?5:2)*h);u.slp=Math.max(0,u.slp-2*h);u.cday=Math.max(0,u.cday-(rf?2:0.5)*h/24);u.strg=0;}return;}
    var o=u.ord,k=o?(o.dk||o.k||''):'',fight=t-(u.fired||-1e9)<600||t-(u.uf||-1e9)<600,mv=t-(u.movedAt||-1e9)<600&&u.st!=='lift'&&!u.amph,work=!!(o&&o.ph==='work'),
      alert=(u._ed||1e9)<2500,restO=!!(o&&/^(rest|rot)$/.test(k)),d=0,ds=0;
    if(fight){d=1.0;ds=0.5;}else if(mv){d=0.6;ds=0.33;}else if(work){d=0.4;ds=0.33;}else if(alert){d=restO?-0.4:0.12;ds=restO?-0.4:0.15;}else{d=restO?-1.6*(night?1.3:1):-0.35;ds=restO?-(night?1.3:1):-0.5;}
    var act=fight||mv||work,g=1,r=1;if(night&&act)g*=1.15;if(wx&&act)g*=1.2;if(u.lg&&u.lg.hun>40){g*=1.25;r*=0.6;}if((u.fear||0)>=50)g*=1.15;g*=1.15-0.3*clamp((u.trn||60)/100,0,1);if(hqNear(u))r*=1.15;if(u.insup===false)r*=0.8;
    d=d>0?d*g:d*r;
    /* 行軍：最近一天走的距離（10 分鐘內移動太遠的是搭火車、空運或登陸艇，不算） */
    var cap=exhCap(s),dm=u._exx!==undefined?dist(u.x,u.y,u._exx,u._exy)/1000:0;u._exx=u.x;u._exy=u.y;if(!mv||dm>cap/16)dm=0;var m0=u.mkm*Math.exp(-h/24);u.mkm=m0+dm;var ov=u.mkm/cap-1,over=Math.max(0,u.mkm-cap)-Math.max(0,m0-cap);
    if(mv&&ov>0)u.fat=clamp(u.fat+2*ov,0,100);
    u.slp=clamp(u.slp+ds*h,0,96);if(u.slp>18)d+=0.035*(u.slp-18)*g;
    if(fight||alert)u.cday+=h/24*(fight?1:0.5);else if(restO)u.cday=Math.max(0,u.cday-0.5*h/24);if(fight&&u.cday>20)d+=0.02*(u.cday-20)*g;
    /* 超過一天的行軍量之後，每多走一公里都更累（徒步每公里約 1.2，車輛按比例少） */
    u.exh=clamp(u.exh+d*h+(over>0?36/cap*over*g:0),0,100);
    /* 落伍：徒步部隊強行軍又累時一路掉人；停下來後慢慢跟上 */
    if(mv&&ov>0.15&&s.mobi===0&&u.fat>60)u.strg=Math.min(0.35,(u.strg||0)+0.03*ov*(1+u.exh/100)*h);else if(!mv&&u.strg>0)u.strg=Math.max(0,u.strg-(alert?0.05:0.15)*h);
    /* 戰鬥疲勞：精疲力竭還在交火，開始有人撐不住、後送 */
    if(fight&&u.exh>=70&&u.men>5){u.exhA=(u.exhA||0)+u.men*0.0012*(u.exh-70)/30*(1+(u.fear||0)/100)*h;if(u.exhA>=0.5){var m=u.exhA;u.exhA=0;hit(u,null,m,0,0,'psy');u.psyN=(u.psyN||0)+m;u.exhN=(u.exhN||0)+m;}}
    var lv=exhLv(u.exh);if(lv>=3&&lv>(u.exhL||0)){u.exhL=lv;logE(u.side,'morale',uName(u)+(lv>=4?'連日苦戰、幾乎沒有闔眼，官兵瀕臨崩潰':'連日作戰、缺乏休息，官兵精疲力竭')+'（'+exhWhy(u)+'）',u.x,u.y,u.id);}else if(lv<=1&&(u.exhL||0)>1)u.exhL=lv;
    if(mv&&ov>0.3&&!u.fmT){u.fmT=t;logE(u.side,'morale',uName(u)+'強行軍，一天內已走 '+fx(u.mkm,0)+' 公里，開始有人落伍',u.x,u.y,u.id);}else if(u.fmT&&ov<0&&t-u.fmT>6*3600)u.fmT=0;
    /* AI：遠離敵人又很累的部隊就地休息 */
    if(u.exh>55&&!act&&!alert&&(u._ed||1e9)>6000&&u.ms==='ok'&&!restO&&typeof aiControls==='function'&&aiControls(u)&&(!o||o.st==='done'||/^(halt|reserve)$/.test(k))&&!u.v10rest){activate(u,newOrder('rest',{x:u.x,y:u.y}));logE(u.side,'rest',uName(u)+'就地休息（'+EXHN[lv]+'）',u.x,u.y,u.id);}});}
(function(){var b=v8Step;v8Step=function(){b();if(G.step%20===7)exhStep();};})();
(function(){var b=firerMod;firerMod=function(u,s){var f=b(u,s);return exhOn()&&u.exh!==undefined?f*exhFire(u):f;};})();
(function(){var b=speedAt;speedAt=function(u,s,pf){var v=b(u,s,pf);return exhOn()&&u.exh>30&&s.dom==='land'?v*exhMove(u):v;};})();
(function(){var b=spotOf;spotOf=function(u,s){var r=b(u,s);return exhOn()&&u.exh!==undefined?r*exhSpot(u):r;};})();
(function(){var b=morBase;morBase=function(u,s,off,PF){var v=b(u,s,off,PF);return exhOn()&&u.exh>40&&G.set.dynMor!==false?clamp(v-exhMorCap(u),10,100):v;};})();
(function(){var b=fearAdd;fearAdd=function(u,v,k){return b(u,exhOn()&&u.exh>40&&v>0?v*exhFear(u):v,k);};})();
/* AI 輪換：精疲力竭的部隊也要換下來；接替的部隊不能也是累壞的 */
(function(){var b=rotNeed;rotNeed=function(u,P){var v=b(u,P);if(!exhOn()||!(u.exh>=(P.t==='reck'?90:75)))return v;if(v>0)return v+0.3;if(u.v10rot&&G.t-u.v10rot<5*3600)return 0;var o=u.ord;if(o&&(o.k==='rest'||o.k==='refit'||o.k==='withdraw'||o.dk==='refit'))return 0;
  if(u.ms==='rout'||clsOf(u)==='hq'||roleOf(u)==='sup')return 0;var w=0.4+(u.exh-75)/40;if(optOf(u).post==='holdfast'&&P.hold>0.6)w*=0.3;return w>0.5&&(G.t-(u.uf||-1e9)<3600||(u._ed||1e9)<6000)?w:0;};})();
(function(){var b=rotRep;rotRep=function(X,u){var r=b(X,u);return r&&exhOn()&&(r.exh||0)>60?null:r;};})();
/* 線上：變化夠大才送；位置記錄與記號不送 */
if(typeof MPTOL!=='undefined'){MPTOL.exh=0.5;MPTOL.slp=0.5;MPTOL.mkm=0.5;MPTOL.cday=0.02;MPTOL.strg=0.005;MPTOL.exhN=0.5;}if(typeof MPUX!=='undefined'){MPUX._exx=1;MPUX._exy=1;MPUX.exhL=1;MPUX.fmT=1;MPUX.exhA=1;}
