/* ===================== v8：油料與易爆設施、可見的後勤運輸、工兵設施、撤出休整、平民互動與第三方、核武當量與各機制年份、AI 吞吐量評估 =====================
   嚴肅模擬：數字都是推估，用來呈現後勤的限制與戰爭的代價，不作為「得分」。 */
APDEF.boom=true;APDEF.lgcut=false;APDEF.civact=true;
/* ---------- 各種特殊機制出現的年份（設定頁可修改）：鍵、名稱、預設年份、說明 ---------- */
var FEAT=[['press','戰地記者',1854,'隨軍記者與戰地報導'],['redcross','國際人道援助團體',1863,'紅十字會等中立團體救助平民與傷患、運送物資'],['gc1864','日內瓦公約（戰場傷患）',1864,'保護戰場傷患與醫護人員'],
 ['hague','海牙公約',1899,'規範戰俘與佔領區平民、保護醫院與宗教建築'],['gc1949','日內瓦四公約',1949,'全面保護平民，禁止任意拘禁與集體懲罰'],
 ['rail','鐵路運輸',1830,'鐵路車站與火車補給'],['tank','儲油槽',1880,'城市與港口的油庫'],['gas','加油站',1910,'城鎮加油站'],['truck','卡車運輸',1914,'補給車隊改用卡車（之前用馬車與挑夫）'],['airfield','機場',1914,'機場與航空運輸'],
 ['tracer','曳光彈',1915,'機槍曳光彈（步槍曳光彈晚 25 年普及）'],['airlift','運輸機空運補給',1936,'運輸機把物資運到機場'],['airdrop','空投補給',1940,'對被圍部隊空投物資'],['radar','雷達',1940,'雷達偵測飛機、艦艇與飛彈'],
 ['nuke','戰術核武',1945,'核打擊命令（核砲彈晚 8 年）'],['heli','直升機運補與後送',1950,'直升機運送物資與傷患'],['snuke','戰略核武',1945,'戰略核打擊（提前時從戰略轟炸機投擲的原子彈開始）'],['sam','防空飛彈',1955,'地對空飛彈'],
 ['arm','反輻射飛彈',1965,'反輻射飛彈與防空壓制'],['awacs','空中預警與資料鏈',1975,'預警機與資料鏈分享空情'],['stealth','匿蹤飛機',1983,'匿蹤戰機的低雷達截面積']];
var FEATD={};FEAT.forEach(function(q){FEATD[q[0]]=q[2];});
/* v8 自己的亂數：不動到戰鬥用的亂數序列，沒有後勤或平民事件介入的戰鬥結果與舊版相同 */
function rnd8(){if(!G._r8)G._r8=mb32(hstr((G.set.seed||'')+'|v8|'+Math.floor(G.t)));return G._r8();}
function featY(k){var o=G&&G.set&&G.set.featY,v=o?o[k]:undefined;return v!==undefined&&v!==null&&v!==''&&isFinite(+v)?+v:FEATD[k];}
function featOn(k,y){if(y===undefined)y=G&&G.set?G.set.y||1943:1943;return y>=featY(k);}

/* ===================== 一、新設施：加油站、儲油槽、彈藥庫、醫院、教堂、難民營 =====================
   開戰時中立；部隊佔領後，油料與彈藥設施成為只存放該類物資的補給節點，醫院收治傷患，教堂庇護平民。
   易爆設施（油料、彈藥）被砲火、轟炸或爆破摧毀時，依存量發生爆炸、殉爆與大火。 */
Object.assign(FACN,{gas:'加油站',tank:'儲油槽',ammo:'彈藥庫',hosp:'醫院',church:'教堂',camp:'難民營'});
/* 種類：存放的物資、是否成為補給節點、半徑（公尺）、脆弱度 */
var FAC8={gas:{only:'fuel',node:1,noUp:1,R:120,v:1.6},tank:{only:'fuel',node:1,R:350,v:1.4},ammo:{only:'ammo',node:1,R:300,v:0.7},hosp:{R:200,v:0.9},church:{R:120,v:0.8},camp:{R:500,v:1.2}};
var FACR={port:500,rail:300,air:900,depot:200};
var FACV={port:0.25,rail:0.4,air:0.35,depot:1};
function facR(F){return (FAC8[F.k]||{}).R||FACR[F.k]||250;}
function facStock8(k,s,y){var p=s?s.pop:3000;if(k==='gas')return {food:0,ammo:0,fuel:y<1930?8+p*0.002:clamp(18+p*0.003,18,45),fod:0};if(k==='tank')return {food:0,ammo:0,fuel:clamp(p*(y<1910?0.015:0.05),y<1910?60:200,y<1910?1500:6000),fod:0};
  if(k==='ammo')return {food:0,ammo:clamp(p*(y<1880?0.004:0.012),y<1880?15:80,y<1880?250:900),fuel:0,fod:0};return {food:0,ammo:0,fuel:0,fod:0};}
function facGen8(MP,y,out){var cs=MP.cs,GW=MP.GW,GH=MP.GH,lc=MP.lc,id=out.reduce(function(m,f){return Math.max(m,f.id);},0),r=mb32(hstr((MP.seed||'m')+'|fac8'));
  function near(x,yy,R,pred,r0){var cx=Math.floor(x/cs),cy=Math.floor(yy/cs),Rc=Math.max(1,Math.ceil(R/cs)),R0=Math.floor((r0||0)/cs),best=-1,bd=1e18;for(var b=-Rc;b<=Rc;b++)for(var a=-Rc;a<=Rc;a++){var X=cx+a,Y=cy+b;if(X<1||Y<1||X>=GW-1||Y>=GH-1)continue;var d=a*a+b*b;if(d>Rc*Rc||d<R0*R0)continue;var dd=d+r()*Rc;if(dd>=bd)continue;var k=Y*GW+X;if(pred(k)){bd=dd;best=k;}}return best;}
  function xy(k){return [(k%GW+0.5)*cs,(((k/GW)|0)+0.5)*cs];}
  function far(p,k,D){return !out.some(function(f){return f.k===k&&dist(f.x,f.y,p[0],p[1])<D;});}
  function add(k,p,name,s,ex){out.push(Object.assign({id:++id,k:k,x:p[0],y:p[1],name:name,set:s?s.name:'',own:-1,cand:-1,ct:0,kn:sAV(-1),st0:facStock8(k,s,y),hp:100},ex||{}));}
  var nCh=0,SS=(MP.set||[]).slice().sort(function(a,b){return b.pop-a.pop;}),land=function(k){return !isWater(lc[k]);},open=function(k){var c=lc[k];return !isWater(c)&&!isUrban(c)&&!MP.rv[k]&&MP.ft[k]!==6&&c!==LCI.marsh;};
  SS.forEach(function(s,si){var sx=s.x*cs,sy=s.y*cs,R=Math.max(400,s.r||300),city=s.kind==='city',town=s.kind==='town';
    /* 教堂：西方地區 400 人以上的聚落多有教區教堂，大城市另有大教堂；中文地區只有 1840 年以後城鎮裡的教會；全圖最多 24 座 */var wst=MP.nst==='west'||MP.nst==='westzh'||(MP.nst==='mix'||MP.nst==='mixzh')&&s.x<GW/2;if((wst?s.pop>=400||city||town:(city||town)&&y>=1840)&&nCh<24){nCh++;var nC=city?clamp(Math.round(s.pop/20000),1,3):1;for(var i=0;i<nC;i++){var ck=near(sx,sy,R*(i?0.9:0.5),function(k){return isUrban(lc[k])&&lc[k]!==LCI.ind&&lc[k]!==LCI.rly&&lc[k]!==LCI.port;});if(ck<0)ck=near(sx,sy,R,land);if(ck<0)continue;var cp=xy(ck);if(!far(cp,'church',350))continue;
        add('church',cp,s.name+(city&&i===0?'大教堂':y<1600?'修道院':'教堂'),s,{cap:clamp(Math.round(s.pop*(city?0.05:0.12)),60,city?3000:900)});}}
    /* 醫院：市鎮以上；1800 年前只有城市的慈善病院 */if((city||town&&s.pop>=2500)&&(y>=1800||city)){var nH=city?clamp(Math.round(s.pop/45000),1,3):1;for(var j=0;j<nH;j++){var hk=near(sx,sy,R*0.8,function(k){var c=lc[k];return isUrban(c)&&c!==LCI.ind&&c!==LCI.rly&&c!==LCI.port;});if(hk<0)continue;var hp=xy(hk);if(!far(hp,'hosp',600))continue;
        add('hosp',hp,s.name+(y<1850?'慈善病院':y<1900?'醫院':j===0&&city?'中央醫院':'醫院'),s,{beds:clamp(Math.round(s.pop/(y<1900?400:220)),15,city?2500:300)});}}
    /* 加油站：城鎮的幹道旁 */if(featOn('gas',y)&&(city||town||s.pop>=1500)){var nG=city?clamp(Math.round(s.pop/25000),1,4):1;for(var g=0;g<nG;g++){var gk=near(sx,sy,R*1.3,function(k){return MP.rd[k]>=2&&!isWater(lc[k])&&!(MP.rl[k]&1);},g?R*0.4:0);if(gk<0)continue;var gp=xy(gk);if(!far(gp,'gas',900))continue;add('gas',gp,s.name+(nG>1?['北','南','東','西'][g%4]:'')+'加油站',s);}}
    /* 儲油槽：城市的工業區、港區或車站旁 */if(featOn('tank',y)&&(city||town&&s.pop>=6000)){var tk=near(sx,sy,R*1.4,function(k){return lc[k]===LCI.ind||lc[k]===LCI.port;});if(tk<0)tk=near(sx,sy,R*1.4,function(k){return lc[k]===LCI.rly;});if(tk<0&&city)tk=near(sx,sy,R*1.6,open,R*0.6);if(tk>=0){var tp=xy(tk);if(far(tp,'tank',3000))add('tank',tp,s.name+'儲油槽',s);}}
    /* 彈藥庫：城市與有城牆的要塞外圍的空地（遠離民宅） */if(city||s.wall&&s.pop>=2000){var ak=near(sx,sy,R+1800,open,R+500);if(ak>=0){var ap=xy(ak);if(far(ap,'ammo',5000))add('ammo',ap,s.name+(y<1880?'火藥庫':'彈藥庫'),s);}}});
  return out;}
/* 舊存檔、舊地圖：補上新設施 */
function fac8Ensure(){if(!G.fac||G._fac8)return;G._fac8=1;if(!G.fac.some(function(F){return FAC8[F.k];}))facGen8(G.map,G.set.y||1943,G.fac);G.fac.forEach(function(F){if(F.hp===undefined)F.hp=100;});
  /* 沒有對應設施的補給站（工兵構築或想定設置）也可以被砲擊、爆破 */SIDES().forEach(function(side){(SD(side).nodes||[]).forEach(function(N){if(N.k!=='depot'||N.fac)return;var F={id:G.fac.reduce(function(m,f){return Math.max(m,f.id);},0)+1,k:'depot',x:N.x,y:N.y,name:N.name,set:'',own:side,cand:-1,ct:0,kn:facKn0(side),st0:{food:0,ammo:0,fuel:0,fod:0},hp:100,built:1};G.fac.push(F);N.fac=F.id;});});}
/* 佔領：油料、彈藥設施成為只存放該類物資的補給節點；醫院、教堂、難民營只改變控制方 */
(function(){var b=facTake;facTake=function(F,side,quiet){var D=FAC8[F.k];if(F.dead){F.own=side;F.cand=-1;F.tOwn=G.t;return;}if(!D)return b(F,side,quiet);var prev=F.own,N=facNode(F),st=N?N.st:F.st0||{},keep=prev>=0?0.5:1;if(N)SD(prev).nodes=SD(prev).nodes.filter(function(q){return q!==N;});
  if(D.node){var c=D.only,s0={food:0,ammo:0,fuel:0,fod:0};s0[c]=(st[c]||0)*keep;addNode(side,'depot',F.x,F.y,{name:F.name,fac:F.id,only:c,noUp:D.noUp?1:0,sub:F.k,cap:Math.max(40,(F.st0&&F.st0[c]||0)*1.2,F.k==='gas'?60:F.k==='tank'?2000:1500),st:s0});}
  F.own=side;F.cand=-1;F.tOwn=G.t;F.kn=F.kn||sAV(-1);F.kn[side]=side;F.knT=F.knT||sA0();F.knT[side]=G.t;
  if(!quiet){logE(side,'log',(prev<0?'控制':'奪取')+FACN[F.k]+'「'+F.name+'」'+(D.node?'，啟用為'+LCN[D.only]+'補給點':F.k==='hosp'?'，收治本方與平民傷患':F.k==='church'?'（受保護的宗教建築）':''),F.x,F.y);if(prev>=0){logE(prev,'log',FACN[F.k]+'「'+F.name+'」落入敵手',F.x,F.y);if(G.onPause&&apOn('fac'))G.onPause('設施易手');}}};})();
/* 補給節點只收、只發特定物資 */
(function(){var bs=split;split=function(N,amt,dem){if(N&&N.only){N.st[N.only]=(N.st[N.only]||0)+amt;return;}return bs(N,amt,dem);};
  var bp=pull;pull=function(U,D,amt,dem){var only=(D&&D.only)||(U&&U.only&&U.k!=='off'?U.only:null);if(only){var have=U.k==='off'?amt:Math.min(amt,U.st[only]||0);if(U.k!=='off'&&U.st)U.st[only]-=have;D.st[only]=(D.st[only]||0)+have;return have;}return bp(U,D,amt,dem);};})();

/* ---------- 設施受損：砲擊、轟炸、飛彈、核武；被摧毀時依存量爆炸 ---------- */
function facSt(F){var N=facNode(F);return N?N.st:F.st0||{food:0,ammo:0,fuel:0,fod:0};}
function facTNT(F){var st=facSt(F),y=G.set.y||1943;return (st.ammo||0)*1000*(y<1880?0.4:0.12)+(st.fuel||0)*1000*0.02;}
function facHit(x,y,R,pow,side,cause,src){if(!G.fac||pow<=0)return;G.fac.forEach(function(F){if(F.dead)return;var fr=facR(F),d=dist(F.x,F.y,x,y);if(d>R+fr)return;var f=d<R+fr*0.3?1:clamp(1-(d-R-fr*0.3)/(fr*0.7),0,1),v=(FAC8[F.k]||{}).v||FACV[F.k]||1,dmg=pow*f*v*(0.6+0.8*rnd8());if(dmg<0.05)return;
    var hp0=F.hp===undefined?100:F.hp;F.hp=Math.max(0,hp0-dmg);F.hitT=G.t;F.hitBy=side;if(src)F.hitU=src.id;
    /* 受保護的設施：醫院、教堂、難民營（戰爭法生效後） */if((F.k==='hosp'||F.k==='church'||F.k==='camp')&&src&&src.side>=0&&G.civ&&dmg>3&&featOn(F.k==='hosp'?'gc1864':'hague')&&(!F.wcT||G.t-F.wcT>3600)&&F.own!==src.side){F.wcT=G.t;var e=warCrime(src,F.k==='church'?'cult':'prot',0,uName(src)+'的火力擊中'+FACN[F.k]+'「'+F.name+'」',false);e.x=F.x;e.y=F.y;}
    /* 油料與彈藥：受損可能引燃 */var tnt=facTNT(F);if(F.hp>0&&tnt>200&&!F.burn&&rnd8()<dmg/120*((FAC8[F.k]||{}).only==='fuel'||F.k==='depot'?1.4:0.8)){F.burn=G.t+3600*(1+rnd8()*3);logE(F.own,'boom',FACN[F.k]+'「'+F.name+'」中彈起火',F.x,F.y);}
    if(F.hp<=0)facDestroy(F,side,cause,src);});}
function facDestroy(F,side,cause,src){if(F.dead)return;var N=facNode(F),st=facSt(F),tnt=facTNT(F),tot=(st.food||0)+(st.ammo||0)+(st.fuel||0)+(st.fod||0);F.dead=G.t;F.hp=0;F.burn=0;
  if(N){SD(N.side).nodes=SD(N.side).nodes.filter(function(q){return q!==N;});}F.lost={food:st.food||0,ammo:st.ammo||0,fuel:st.fuel||0,fod:st.fod||0};F.st0={food:0,ammo:0,fuel:0,fod:0};
  logE(F.own>=0?F.own:side,'boom',FACN[F.k]+'「'+F.name+'」被摧毀'+(tot>1?'，損失約 '+fmt(tot)+' 噸物資':''),F.x,F.y);if(F.own>=0&&F.own!==side&&side>=0)logE(side,'boom','摧毀'+(F.own>=0?G.sides[F.own].name+'的':'')+FACN[F.k]+'「'+F.name+'」',F.x,F.y);
  if(tnt>40)boomAt(F.x,F.y,tnt,(st.ammo||0)>(st.fuel||0)*0.2?'ammo':'fuel',side,F,src);else if(tot>5&&G.evt)for(var i=0;i<3;i++)fireChance(F.x+(rnd8()-0.5)*200,F.y+(rnd8()-0.5)*200);
  if(G.onPause&&apOn('boom')&&tnt>2000)G.onPause('設施爆炸');}
/* 爆炸：W＝TNT 當量（公斤）。依比例距離：致命區 3.5W^⅓、重創區 7W^⅓、輕傷區 18W^⅓；彈藥另有破片與延續數十分鐘的殉爆，油料引發大火與濃煙 */
function boomR(W){var c=Math.cbrt(Math.max(1,W));return [3.5*c,7*c,18*c];}
function boomAt(x,y,W,kind,side,F,src,sec){var R=boomR(W*(sec?1:0.35)),inst=sec?W:W*0.35,frag=kind==='ammo'?Math.max(R[2],Math.min(1500,250+Math.cbrt(W)*12)):R[2];
  var cas=0;G.units.forEach(function(t){if(!alive(t)||!onMap(t)||t.st==='air'||t.st==='lift')return;var ts=ST(t),d=dist(t.x,t.y,x,y);if(d>frag)return;var ent=ts.dom==='land'?(t.ent||0):0,hard=ts.hard||0,mf,vf,rf=Math.sqrt(frontW(t)*120/PI),ex=function(R0){return clamp(R0*R0/(rf*rf),0.12,1);};
    if(d<R[0]){mf=0.55*(1-0.5*ent)*ex(R[0]);vf=0.5*(1-0.3*hard)*ex(R[0]);}else if(d<R[1]){var f=(d-R[0])/(R[1]-R[0]);mf=lerp(0.3,0.08,f)*(1-0.6*ent)*ex(R[1]);vf=lerp(0.25,0.04,f)*(1-0.5*hard)*ex(R[1]);}else if(d<R[2]){mf=0.02*(1-0.7*ent)*ex(R[2]);vf=0.005;}else{mf=0.006*(1-0.8*ent);vf=0;}
    var m=t.men*mf,v=t.veh*vf;cas+=m;hit(t,src&&src.side!==t.side?src:null,m,v,d<R[1]?90:40,'expl');t.mor=clamp(t.mor-(d<R[1]?25:d<R[2]?10:4),0,100);});
  if(G.civ)civHit(x,y,R[1],clamp(0.25*(sec?0.4:1),0,0.3),'expl',side,0.4);urbanDamage(x,y,R[1],kind==='ammo'?160:90,side,'set');roadDmg(x,y,Math.min(R[1],400),40);
  if(G.evt){var nf=kind==='fuel'?6:3;for(var i=0;i<nf;i++)fireChance(x+(rnd8()-0.5)*R[1]*1.4,y+(rnd8()-0.5)*R[1]*1.4);}
  /* 連鎖：重創區內的其他設施 */if(!sec)(G.fac||[]).forEach(function(Q){if(Q===F||Q.dead)return;var d=dist(Q.x,Q.y,x,y);if(d<R[1]+facR(Q))facHit(Q.x,Q.y,10,clamp(120*(1-d/(R[1]+facR(Q))),20,120),side,'expl',src);});
  (G.booms=G.booms||[]).push({t:G.t,x:x,y:y,W:W,k:kind,R:R,sec:!!sec,f:F?F.id:0});if(G.booms.length>200)G.booms.shift();
  if(!sec){var tnt=W/1000;logE(-1,'boom','💥 '+(F?FACN[F.k]+'「'+F.name+'」':'')+(kind==='ammo'?'彈藥殉爆':'油料爆炸起火')+'（約 '+(tnt>=1?fmt(tnt,tnt<10?1:0)+' 噸':fmt(W)+' 公斤')+' TNT 當量），重創半徑約 '+fmt(R[1])+' 公尺'+(cas>=1?'，波及約 '+fmt(cas)+' 名軍人':''),x,y);
    /* 彈藥：之後數十分鐘斷續殉爆；油料：大火延燒數小時 */if(kind==='ammo'&&W>2000){var n=clamp(Math.round(Math.cbrt(W/1000)*3),2,14);for(var j=0;j<n;j++)(G.boomQ=G.boomQ||[]).push({at:G.t+120+rnd8()*3600*Math.min(3,0.6+Math.cbrt(W/1e5)),x:x+(rnd8()-0.5)*R[1],y:y+(rnd8()-0.5)*R[1],W:W*0.65/n,k:'ammo',side:side,f:F?F.id:0});}
    if(F&&kind==='fuel')F.fire=G.t+3600*clamp(2+Math.cbrt(W/1000)*2,2,24);}
  return R;}
function boomStep(){var Q=G.boomQ;if(Q&&Q.length){var keep=[];Q.forEach(function(q){if(G.t<q.at){keep.push(q);return;}boomAt(q.x,q.y,q.W,q.k,q.side,null,null,true);});G.boomQ=keep;}
  /* 起火的設施：存量慢慢燒掉，燒到彈藥或油料時爆炸 */(G.fac||[]).forEach(function(F){if(F.dead||!F.burn)return;if(G.t>F.burn){F.burn=0;return;}var st=facSt(F);['fuel','ammo','food','fod'].forEach(function(c){if(st[c]>0)st[c]=Math.max(0,st[c]-st[c]*0.04-0.5);});F.hp=Math.max(0,F.hp-1.2);if(F.hp<=0||rnd8()<0.01)facDestroy(F,F.hitBy===undefined?-1:F.hitBy,'fire');});}
/* 戰鬥工兵與撤退的部隊可以爆破設施（拒止敵軍使用） */
function facNear(x,y,R,pred){var b=null,bd=1e18;(G.fac||[]).forEach(function(F){if(F.dead||pred&&!pred(F))return;var d=dist(F.x,F.y,x,y);if(d<R&&d<bd){bd=d;b=F;}});return b;}
/* 砲擊、轟炸、飛彈、核武的設施傷害 */
(function(){var b=artyFire;artyFire=function(u,s,M){b(u,s,M);if(G.fac&&u.lastArt===G.t){var SA=saOf(u,s),HA=haOf(u,s),fr=strFrac(u);facHit(M.x,M.y,M.r||300,clamp((SA*0.6+HA*0.4)*fr*(M.mul||1)*0.9,0.2,40),u.side,'art',u);}};})();
(function(){var b=carpetHit;carpetHit=function(side,src,cx,cy,ang,L,W,tons,o){var r=b.apply(null,arguments);if(G.fac){var fx=Math.cos(ang),fy=Math.sin(ang),rho=tons/Math.max(0.01,L*W/1e6);for(var s1=-L/2;s1<=L/2+1;s1+=Math.max(W*0.6,200))facHit(cx+fx*s1,cy+fy*s1,W/2,clamp(rho*3,10,150),side,'carpet',src);}return r;};})();
(function(){var b=mslImpact;mslImpact=function(S){var r=b(S);if(G.fac&&S&&S.x!==undefined)facHit(S.x,S.y,120,clamp((S.w||450)/12,10,90)*Math.max(1,(S.n||1)-(S.s||0)),S.side,'msl',uById(S.src));return r;};})();
(function(){var b=nukeAt;nukeAt=function(side,x,y,Y,src){var r=b.apply(null,arguments);if(G.fac){var R=nukeR(Y);facHit(x,y,R[1],400,side,'nuke',src);facHit(x,y,R[2],60,side,'nuke',src);}return r;};})();
(function(){var b=snukeAt;snukeAt=function(side,x,y,Y){var r=b.apply(null,arguments);if(G.fac){var R=nukeR(Y);facHit(x,y,R[2],500,side,'nuke',null);}return r;};})();
/* 空中打擊：攻擊機在目標上空盤旋時，目標附近的敵方或中立設施受損 */
function airFacStep(){(G._air||G.units).forEach(function(a){if(a.st!=='air'||a.task!=='loiter'||!alive(a)||!a.ord||!/strike|bomb/.test(a.ord.k)||a.ammo<5)return;var s=ST(a);var F=facNear(a.ord.x,a.ord.y,Math.max(600,(a.ord.r||1500)*0.6),function(Q){return Q.own!==a.side&&(Q.own>=0||a.ord.fac===Q.id||dist(Q.x,Q.y,a.ord.x,a.ord.y)<400);});if(!F)return;
  var pow=(saOf(a,s)*0.3+haOf(a,s)*0.7+(s.fl.indexOf('B')>=0?8:0))*Math.max(1,a.veh||1)*0.25*strFrac(a);facHit(F.x,F.y,150,clamp(pow,2,80),a.side,'air',a);a.ammo=Math.max(0,a.ammo-4);});}

/* ===================== 二、看得見的後勤運輸：補給車隊、馬車隊、補給列車、運輸船、運輸機、直升機 =====================
   取代原本抽象的「每日吞吐量」：港口、機場、車站的進貨由船隊、運輸機、列車從地圖邊緣運來；
   補給站派車隊到上游節點裝貨再回來；補給部隊派車往返最近的節點；被圍部隊由空投或直升機補給。
   運具沿道路、鐵路、航道或航線行進，會塞車（同一路段車輛太多、難民、彈坑、泥濘）、
   遇到敵軍會停下改道或折返，被伏擊、砲擊、空襲或擊沉時損失車輛與物資；路線被切斷時下游就會斷糧、缺彈、缺油。 */
var LGM={porter:{n:'挑夫隊',u:'人',dom:'land',mobi:0,vx:3},wagon:{n:'馬車隊',u:'輛',dom:'land',mobi:2,vx:2.5},truck:{n:'補給車隊',u:'輛',dom:'land',mobi:3,vx:12},
  rail:{n:'補給列車',u:'列',rail:1},ship:{n:'運輸船隊',u:'艘',dom:'sea',dr:2},air:{n:'運輸機',u:'架',air:1},heli:{n:'運輸直升機',u:'架',air:1},drop:{n:'空投運輸機',u:'架',air:1}};
var LGPH={out:'空車前往裝貨',load:'裝貨中',in:'滿載運送中',unl:'卸貨中',ret:'返航',hold:'遇敵停車',wait:'等待道路暢通',dead:'全毀'};
function lgY(){return G.set.y||1943;}
/* 各年代的速度（公里／小時，含車隊休息）與每輛（列、艘、架）載重（噸） */
function lgSpd(m){var y=lgY();return m==='porter'?3.5:m==='wagon'?4.2:m==='truck'?(y<1931?15:y<1951?24:y<1991?32:42):m==='rail'?(y<1880?24:y<1940?32:45):m==='ship'?(y<1850?9:y<1910?13:y<1945?17:22):m==='air'||m==='drop'?(y<1946?240:y<1970?340:480):m==='heli'?(y<1960?140:210):20;}
function lgPay(m){var y=lgY(),E=ERA[0];ERA.forEach(function(e){if(!e.fan&&y>=e.y0)E=e;});return m==='porter'?0.025:m==='wagon'?(y<1800?0.6:0.9):m==='truck'?(PAYLOAD[E.i]||3):m==='rail'?(y<1880?120:y<1914?300:y<1946?450:y<1990?800:1200):m==='ship'?(y<1850?150:y<1914?1500:y<1946?5000:9000):m==='air'||m==='drop'?(y<1946?2.5:y<1970?8:18):m==='heli'?(y<1960?0.8:y<1980?2.5:4):1;}
function lgRoadMode(){var y=lgY();return featOn('truck',y)?'truck':y<1650?'porter':'wagon';}
function lgSerial(m){return m==='truck'?24:m==='wagon'?40:m==='porter'?120:m==='ship'?3:m==='rail'?1:4;}
function lgStats(side){var S=SD(side);return S.lgs||(S.lgs={sent:0,arr:0,t:0,lostV:0,lostT:0,amb:0,blk:0,air:0});}
function lgType(m){var D=LGM[m];return {dom:D.dom||'land',mobi:D.mobi===undefined?3:D.mobi,vr:lgSpd(m),vx:D.vx||lgSpd(m),fl:'',dr:D.dr||2};}
/* 路線：快取同一對端點的路線（地圖改變時失效） */
/* 路線快取：沿線落在敵情避讓區（道路車輛另計嚴重阻塞的路段）的取樣點不比規劃時多，就沿用（最長 6 小時）；找不到路的結果 30 分鐘後再試 */
function lgRouteRisk(P,side,road){if(!P)return 0;var E=G.eav&&G.eav[side],R=road?G.rdi:null;if(!E&&!R)return 0;var MP=G.map,GW=MP.GW,CW=G.eavW,cs=MP.cs,n=0;
  for(var i=0;i+3<P.length;i+=2){var x0=P[i],y0=P[i+1],x1=P[i+2],y1=P[i+3],m=Math.max(1,Math.ceil(dist(x0,y0,x1,y1)/(cs*4)));for(var j=i?1:0;j<=m;j++){var t=j/m,k=cellAt(x0+(x1-x0)*t,y0+(y1-y0)*t),x=k%GW,y=(k/GW)|0;if(E&&E[(y>>3)*CW+(x>>3)]||R&&R[k]>=100)n++;}}return n;}
function lgCacheOK(c,side,road){if(!c||G._lgFresh)return false;if(!c.p)return G.t-c.t<1800;return G.t-c.t<6*3600&&lgRouteRisk(c.p,side,road)<=c.th;}
/* 每一步規劃新路線的工作量上限（依路線長度計，結果不受電腦快慢影響）：超過時其餘的派車延到下一步，免得一步卡住畫面 */
var LGQ={s:-1,w:0};function lgWork(x0,y0,x1,y1){if(LGQ.s!==G.step){LGQ.s=G.step;LGQ.w=0;}LGQ.w+=dist(x0,y0,x1,y1)/G.map.cs;}
function lgBusy(){var MP=G.map;return LGQ.s===G.step&&LGQ.w>(MP.GW+MP.GH)*0.6;}
function lgPath(m,x0,y0,x1,y1,side){var D=LGM[m];if(D.air)return [x0,y0,x1,y1];var MP=G.map,ka=cellAt(x0,y0),kb=cellAt(x1,y1),key=m+'|'+(ka>>1)+'|'+(kb>>1)+'|'+side,C=G._lgpc||(G._lgpc={n:0,v:-1});if(C.v!==(G._mapv||0)){G._lgpc=C={n:0,v:G._mapv||0};}var c=C[key];if(lgCacheOK(c,side,false))return c.p?c.p.slice():null;lgWork(x0,y0,x1,y1);
  var P=null;if(D.rail)P=railPath(x0,y0,x1,y1);else{var av=lgAvoid(side);P=findPath(lgType(m),x0,y0,x1,y1,{avoid:av,max:Math.min(MP.GW*MP.GH,60000)});P=P&&P.pts;if(P){var n=P.length;if(dist(P[n-2],P[n-1],x1,y1)>Math.max(1500,MP.cs*6))P=null;}}
  if(C.n>500){G._lgpc=C={n:0,v:G._mapv||0};}C[key]={p:P,t:G.t,th:lgRouteRisk(P,side,false)};C.n++;return P?P.slice():null;}
function lgAvoid(side){var E=G.eav&&G.eav[side];if(!E)return null;var GW=G.map.GW,CW=G.eavW;return function(k){var x=k%GW,y=(k/GW)|0;return E[(y>>3)*CW+(x>>3)]?8:1;};}
/* 鐵路路線：沿鐵路格搜尋（廣度優先） */
function railPath(x0,y0,x1,y1){var MP=G.map,GW=MP.GW,GH=MP.GH,cs=MP.cs;function snap(x,y){var k=cellAt(x,y),gx=k%GW,gy=(k/GW)|0,R=Math.ceil(600/cs),b=-1,bd=1e9;for(var dy=-R;dy<=R;dy++)for(var dx=-R;dx<=R;dx++){var X=gx+dx,Y=gy+dy;if(X<0||Y<0||X>=GW||Y>=GH)continue;var q=Y*GW+X;if((MP.rl[q]&1)&&dx*dx+dy*dy<bd){bd=dx*dx+dy*dy;b=q;}}return b;}
  var a=snap(x0,y0),b=snap(x1,y1);if(a<0||b<0)return null;var prev=new Int32Array(GW*GH).fill(-1),Q=[a],h=0;prev[a]=a;while(h<Q.length){var c=Q[h++];if(c===b)break;var x=c%GW,y=(c/GW)|0;for(var d=0;d<8;d++){var X=x+[1,1,0,-1,-1,-1,0,1][d],Y=y+[0,1,1,1,0,-1,-1,-1][d];if(X<0||Y<0||X>=GW||Y>=GH)continue;var q=Y*GW+X;if(prev[q]<0&&(MP.rl[q]&1)&&!(G.evt&&G.evt.fl&&G.evt.fl[q])&&!(typeof rlBlocked==='function'&&rlBlocked(q))){prev[q]=c;Q.push(q);}}}
  if(prev[b]<0)return null;var pts=[],k=b,n=0;while(k!==a&&n++<GW*GH){pts.push(k);k=prev[k];}pts.push(a);pts.reverse();var out=[];pts.forEach(function(q,i){if(i%3===0||i===pts.length-1)out.push((q%GW+0.5)*cs,(((q/GW)|0)+0.5)*cs);});return out;}
/* 地圖邊緣的進入點：本方邊緣上離目的地最近的點；船隊從連通的海面邊緣進入 */
function lgEdge(side,x,y){var MP=G.map,e=SD(side).edge||'W',m=MP.cs*2;return e==='W'?[m,clamp(y,m,MP.Hm-m)]:e==='E'?[MP.Wm-m,clamp(y,m,MP.Hm-m)]:e==='N'?[clamp(x,m,MP.Wm-m),m]:[clamp(x,m,MP.Wm-m),MP.Hm-m];}
function railEdge(side,x,y){var MP=G.map,GW=MP.GW,GH=MP.GH,e=SD(side).edge||'W',best=null,bd=1e18;for(var i=0;i<(e==='W'||e==='E'?GH:GW);i++){var X=e==='W'?0:e==='E'?GW-1:i,Y=e==='N'?0:e==='S'?GH-1:i;var k=Y*GW+X;if(!(MP.rl[k]&1))continue;var px=(X+0.5)*MP.cs,py=(Y+0.5)*MP.cs,d=dist(px,py,x,y);if(d<bd){bd=d;best=[px,py];}}return best;}
function seaEdge(side,x,y){var MP=G.map,GW=MP.GW,GH=MP.GH,cs=MP.cs,e=SD(side).edge||'W',best=null,bd=1e18;function t(X,Y){var k=Y*GW+X;if(MP.lc[k]!==LCI.sea)return;var px=(X+0.5)*cs,py=(Y+0.5)*cs,d=dist(px,py,x,y)*((e==='W'&&X===0||e==='E'&&X===GW-1||e==='N'&&Y===0||e==='S'&&Y===GH-1)?0.6:1);if(d<bd){bd=d;best=[px,py];}}
  for(var X=0;X<GW;X+=2){t(X,0);t(X,GH-1);}for(var Y=0;Y<GH;Y+=2){t(0,Y);t(GW-1,Y);}return best;}
function portWater(N){var MP=G.map,GW=MP.GW,GH=MP.GH,k=cellAt(N.x,N.y),gx=k%GW,gy=(k/GW)|0,R=Math.ceil(800/MP.cs),b=null,bd=1e9;for(var dy=-R;dy<=R;dy++)for(var dx=-R;dx<=R;dx++){var X=gx+dx,Y=gy+dy;if(X<0||Y<0||X>=GW||Y>=GH)continue;var q=Y*GW+X;if(navOK(2,q)&&dx*dx+dy*dy<bd){bd=dx*dx+dy*dy;b=[(X+0.5)*MP.cs,(Y+0.5)*MP.cs];}}return b;}
/* 端點：節點、部隊或地圖邊緣 */
function lgEnd(e){if(!e)return null;if(e.k==='node'){var N=lgNode(e.side,e.id);return N?[N.x,N.y]:null;}if(e.k==='unit'){var u=uById(e.id);return u&&alive(u)&&onMap(u)?[u.x,u.y]:null;}return [e.x,e.y];}
function lgNode(side,id){return (SD(side).nodes||[]).filter(function(N){return N.id===id;})[0]||null;}
/* 建立運具 */
function lgNew(side,m,n,o){var V=Object.assign({id:(G.lgvSeq=(G.lgvSeq||0)+1),side:side,m:m,n:n,n0:n,pay:lgPay(m),c:{food:0,ammo:0,fuel:0,fod:0},ph:'out',t0:G.t,pi:2,hd:0,v:lgSpd(m),hold:0},o||{});(G.lgv=G.lgv||[]).push(V);lgStats(side).sent++;return V;}
function lgCargo(V){return V.c.food+V.c.ammo+V.c.fuel+V.c.fod;}
function lgCap(V){return V.n*V.pay;}
/* 設定下一段路：成功回傳 true */
function lgLeg(V,tx,ty){var p=lgPath(V.m,V.x,V.y,tx,ty,V.side);if(!p||p.length<4){V.pts=null;return false;}p[0]=V.x;p[1]=V.y;V.pts=p;V.pi=2;V.tx=tx;V.ty=ty;return true;}
/* ---------- 每一步：移動、壅塞、遇敵 ---------- */
function lgSum(st,only){if(!st)return 0;if(only)return st[only]||0;return (st.food||0)+(st.ammo||0)+(st.fuel||0)+(st.fod||0);}
function lgById(id){return (G.lgv||[]).filter(function(V){return V.id===id;})[0]||null;}
/* 行軍縱隊的長度：卡車間隔約 50 公尺、馬車 30 公尺、挑夫 4 公尺；一個車隊沿道路往後延伸好幾個 500 公尺路段 */
function lgSpread(V,load){var sp=V.m==='wagon'?30:V.m==='porter'?4:50,ve=V.m==='porter'?V.n/25:V.n;trfAdd(load,V.x,V.y,V.hd,ve,Math.min(8000,Math.max(100,V.n*sp)),V.side,1);}
/* 每 500 公尺路段在減速前容得下的車輛：越野時車輛可以散開；小路單線、鄉道雙線、公路與高速公路多線 */
function lgRoadCap(rd){return rdCapOf(rd);}
function lgvStep(){var L=G.lgv,load=trfBase();G._lgLoad=load;if(!L||!L.length)return;
  L.forEach(function(V){if(V.ph!=='out'&&V.ph!=='in'&&V.ph!=='ret'&&V.ph!=='hold')return;var D=LGM[V.m];if(D.dom!=='land'||D.rail||D.air)return;lgSpread(V,load);});G._lgLoad=load;
  var keep=[];L.forEach(function(V){if(V.ph!=='dead'&&V.ph!=='gone'){try{lgvOne(V,load);}catch(e){V.ph='dead';if(!G._lgErr){G._lgErr=1;if(typeof console!=='undefined')console.warn('lgv',e);}}}if(V.ph!=='dead'&&V.ph!=='gone')keep.push(V);});G.lgv=keep;}
function lgvOne(V,load){if(V.ph==='load'||V.ph==='unl'){if(G.t<V.until)return;if(V.ph==='load')lgLoaded(V);else lgUnloaded(V);return;}
  if(V.ph==='hold'||V.ph==='wait'){var thr0=lgThreat(V,true);if(thr0==='dead')return;if(G.t-V.tw>=600&&(G.step+V.id)%4===0&&!(V.rrT>G.t))lgReroute(V);return;}
  if(!V.pts){lgArrive(V);return;}var thr=lgThreat(V,false);if(thr==='dead')return;if(thr==='hold'){V.ph0=V.ph;V.ph='hold';V.tw=G.t;V.holdN=(V.holdN||0)+1;return;}
  var sp=lgSpeedAt(V,load);lgMove(V,sp/3.6*DT);if(!V.pts)lgArrive(V);}
function lgMove(V,st){var p=V.pts;while(st>0.01&&p&&V.pi<p.length){var tx=p[V.pi],ty=p[V.pi+1],d=dist(V.x,V.y,tx,ty);if(d<=st){V.x=tx;V.y=ty;st-=d;V.pi+=2;}else{V.hd=Math.atan2(ty-V.y,tx-V.x);V.x+=Math.cos(V.hd)*st;V.y+=Math.sin(V.hd)*st;st=0;}}if(p&&V.pi>=p.length)V.pts=null;}
/* 速度：道路等級與路況、同一路段的車流、夜間燈火管制、天候 */
function lgSpeedAt(V,load){var D=LGM[V.m],v=lgSpd(V.m),W=WX[G.env.wx]||WX[0];if(D.air)return v*(W[5]<0.3?0.7:1);if(D.dom==='sea')return v*(W[5]<0.2?0.6:1);var MP=G.map,k=cellAt(V.x,V.y),night=G.env.light<0.3;
  if(D.rail)return v*((MP.rl[k]&1)?1:0.25)*(night?0.85:1);var pf=pfFor(D.mobi),rf=pf.road[k],sp=rf?v*rf*(G.rdi&&G.rdi[k]?Math.max(0.08,1-G.rdi[k]*0.0036):1):pf.off[k]*(D.vx||2);
  var rdk=MP.rd[k]||0,lq=load?load[trfKey(V.x,V.y,rdk)]:null,n=lq?lq[0]:0,cap=lgRoadCap(rdk);V.jam=n>cap?n/cap:0;if(n>cap)sp*=clamp(Math.pow(cap/n,0.85),0.12,1);
  if(night)sp*=lgY()>=1990?0.85:0.6;return Math.max(0.4,sp);}
/* 前方 L 公尺內的路線點 */
function lgAhead(V,L){var p=V.pts,out=[];if(!p)return out;var x=V.x,y=V.y,acc=0;for(var i=V.pi;i<p.length&&acc<L;i+=2){acc+=dist(x,y,p[i],p[i+1]);x=p[i];y=p[i+1];out.push(x,y);}return out;}
/* 威脅：回傳 'dead'（全毀）、'hold'（停車）或 null */
function lgThreat(V,waiting){var D=LGM[V.m],side=V.side;if(D.air)return lgAirThreat(V);if(D.dom==='sea')return lgSeaThreat(V);
  var near=null,nd=1e9,pw=0,fr=0;gridNear(V.x,V.y,1800,function(u){if(!onMap(u)||u.ms==='rout'||u.st==='air'||u.st==='lift'||u.st==='ship'||!isLeaf(u))return;var s=ST(u);if(s.dom!=='land'||s.fl.indexOf('u')>=0)return;var d=dist(u.x,u.y,V.x,V.y);if(d>1800)return;if(u.side===side){if(d<1200&&roleOf(u)!=='sup')fr+=(saOf(u,s)+haOf(u,s))*strFrac(u);return;}if(d<nd){nd=d;near=u;}pw+=(saOf(u,s)+haOf(u,s))*strFrac(u);});
  if(near){var p=(nd<500?0.55:nd<1000?0.22:0.07)*clamp(pw/6,0.3,2)*(G.env.light<0.3?0.6:1)*(fr>pw?0.3:1)*(waiting?0.5:1);if(rnd8()<p){lgLoss(V,nd<500?0.3+rnd8()*0.5:0.05+rnd8()*0.2,nd<600&&fr<pw?near:null,'amb',near);if(V.ph==='dead')return 'dead';}return 'hold';}
  /* 游擊隊：敵視本方、民怨高的聚落附近 */if(G.civ&&G.step%10===V.id%10){var g=civAt(V.x,V.y,600);if(g&&g.att&&g.att[side]<-40&&g.unrest>50&&civPresent(g)>200&&rnd8()<0.02){lgLoss(V,0.05+rnd8()*0.15,null,'gue',null);if(V.ph==='dead')return 'dead';}}
  if(waiting)return 'hold';
  /* 前方 3 公里內有已知敵軍：停車改道 */if((G.step+V.id)%2===0&&V.pts){var C=G.ct[side],ah=lgAhead(V,3000);for(var id in C){var c=C[id];if(G.t-c.t>1800||c.dom==='air'||c.dom==='sea'||c.dom==='sub'||c.dead)continue;for(var i=0;i<ah.length;i+=4){if(dist(c.x,c.y,ah[i],ah[i+1])<1200)return 'hold';}}}
  return null;}
function lgAirThreat(V){var side=V.side,p=0,by=null;(G._air||[]).forEach(function(a){if(a.side===side||a.st!=='air'||!alive(a))return;var s=ST(a);if(!(s.aa>0||/fighter|patrol/.test(a.ord?a.ord.k:'')))return;var d=dist(a.x,a.y,V.x,V.y);if(d<8000){p+=0.04*(s.aa>0?1:0.5);by=a;}});
  if(G.step%2===V.id%2)gridNear(V.x,V.y,15000,function(g){if(g.side===side||!onMap(g)||!isLeaf(g)||g.st==='air')return;var s=ST(g),aa=aaOf(g,s);if(aa<=0)return;var sam=samOf(g),R=sam?sam.rng||20000:aaRange(aa),d=dist(g.x,g.y,V.x,V.y);if(d>R)return;if(sam&&!(radarOK(g)&&g.emcon===0))return;p+=(sam?0.08:0.015*aa/5)*(V.m==='heli'||V.m==='drop'?1.5:1);by=by||g;});
  if(p>0&&rnd8()<p){lgLoss(V,1/Math.max(1,V.n),null,'air',by);if(V.ph==='dead')return 'dead';}return null;}
function lgSeaThreat(V){var side=V.side,p=0,by=null;if((G.step+V.id)%2)return null;gridNear(V.x,V.y,15000,function(u){if(u.side===side||!onMap(u)||!isLeaf(u))return;var s=ST(u),d=dist(u.x,u.y,V.x,V.y);if((s.dom==='sea'&&(s.sa>0||s.ha>0)&&d<12000)||(s.dom==='sub'&&d<6000)){p+=s.dom==='sub'?0.06:0.04;by=u;}});
  (G._air||[]).forEach(function(a){if(a.side===side||a.st!=='air'||!a.ord||!/strike|bomb|patrol/.test(a.ord.k))return;if(dist(a.x,a.y,V.x,V.y)<5000){p+=0.05;by=by||a;}});
  if(p>0&&rnd8()<p){lgLoss(V,1/Math.max(1,V.n),null,'sea',by);if(V.ph==='dead')return 'dead';}return null;}
/* 損失：車輛（列、艘、架）與物資；伏擊者近距離時物資落入敵手 */
function lgLoss(V,frac,captor,why,by){if(V.ph==='dead')return;var lost=Math.min(V.n,Math.max(1,Math.round(V.n*frac)));if(frac>=0.95)lost=V.n;var f=lost/V.n,cg={},tot=0;LCLS.forEach(function(c){cg[c]=V.c[c]*f;V.c[c]-=cg[c];tot+=cg[c];});V.n-=lost;var S=lgStats(V.side);S.lostV+=lost;S.lostT+=tot;if(why==='amb'||why==='gue')S.amb++;if(why==='air')S.air++;
  if(captor&&captor.lg&&tot>0){var L=captor.lg;L.food=Math.min(L.foodCap*1.5,L.food+cg.food*1000);L.fuel=Math.min(L.fuelCap*1.2,L.fuel+cg.fuel*1000);var uofT=L.uof*L.basic;if(cg.ammo>0&&uofT>0)captor.ammo=Math.min(100,captor.ammo+cg.ammo*1000/uofT*100*0.5);}
  var H=V.home&&V.home.k==='node'?lgNode(V.side,V.home.id):null;if(H&&H.cv)H.cv.n=Math.max(0,H.cv.n-lost);if(V.m==='air'||V.m==='drop'||V.m==='heli'){var AP=lgAirPool(V.side);AP.base=Math.max(0,AP.base-lost*0.5);}
  var W=cg.ammo*120+cg.fuel*20;if(W>5)(G.booms=G.booms||[]).push({t:G.t,x:V.x,y:V.y,W:Math.min(20000,W),k:cg.ammo*6>cg.fuel?'ammo':'fuel',R:boomR(W),sec:true,lg:1});
  var nm=LGM[V.m].n,wt={amb:'遭伏擊',art:'遭砲擊',air:V.m==='air'||V.m==='drop'||V.m==='heli'?'被擊落':'遭空襲',sea:'遭攻擊，船隻沉沒',gue:'遭游擊隊襲擊'}[why]||'受損';
  logE(V.side,'lgcut',nm+wt+'（'+placeTxt(V.x,V.y)+'）：損失 '+lost+' '+LGM[V.m].u+(tot>0.5?'、約 '+fmt(tot)+' 噸物資':'')+(captor&&tot>0.5?'，物資落入敵手':''),V.x,V.y);
  if(by&&by.side!==V.side&&by.side>=0){logE(by.side,'lgcut',uName(by)+'截擊敵軍'+nm+'（'+placeTxt(V.x,V.y)+'），擊毀 '+lost+' '+LGM[V.m].u,V.x,V.y,by.id);if(ST(by).dom==='land'){by.fired=G.t;by.ammo=Math.max(0,by.ammo-0.5);}}
  if(V.n<=0)V.ph='dead';if(G.onPause&&apOn('lgcut')&&(why==='amb'||why==='gue')&&(!G._lgcutP||G.t-G._lgcutP>3600)){G._lgcutP=G.t;G.onPause('補給線遭截斷');}}
/* 砲擊落在運具附近 */
function lgAreaHit(x,y,R,pow,side,src){(G.lgv||[]).forEach(function(V){if(V.side===side||V.ph==='dead'||LGM[V.m].air)return;var d=dist(V.x,V.y,x,y);if(d>R+80)return;if(rnd8()<clamp(pow/30,0.05,0.6))lgLoss(V,clamp(pow/60,0.04,0.5),null,'art',src);});}
(function(){var b=facHit;facHit=function(x,y,R,pow,side,cause,src){b(x,y,R,pow,side,cause,src);if(G.lgv&&G.lgv.length&&(cause==='art'||cause==='carpet'||cause==='msl'||cause==='air'||cause==='nuke'))lgAreaHit(x,y,R,cause==='nuke'?999:pow,side,src);};})();
/* 停車後：改走避開已知敵軍的路線；等太久就折返 */
function lgReroute(V){var tgt=V.ph0==='ret'||V.ph0==='out'?(V.ph0==='ret'?lgEnd(V.home):lgEnd(V.src)):lgEnd(V.dst);if(!tgt){lgAbort(V,'目的地已失');return;}
  /* 只為這個車隊重新規劃（不清掉其他車隊的路徑快取）；失敗時 20 分鐘後再試 */G._lgFresh=1;var okL=lgLeg(V,tgt[0],tgt[1]);G._lgFresh=0;
  if(okL){var C2=G.ct[V.side],ah=lgAhead(V,4000),bad=false;for(var id in C2){var c=C2[id];if(G.t-c.t>1800||c.dom==='air'||c.dom==='sea'||c.dom==='sub'||c.dead)continue;for(var i=0;i<ah.length;i+=4)if(dist(c.x,c.y,ah[i],ah[i+1])<1200){bad=true;break;}if(bad)break;}
    if(!bad){V.ph=V.ph0||'in';V.ph0=null;if((V.holdN||0)===1||(V.holdN||0)%5===0)logE(V.side,'log',LGM[V.m].n+'遇敵改道（'+placeTxt(V.x,V.y)+'）',V.x,V.y);lgStats(V.side).blk+=0;return;}}
  V.rrT=G.t+1200;if(G.t-V.tw>2*3600){lgAbort(V,'道路被敵軍切斷');}}
function lgAbort(V,why){var S=lgStats(V.side);S.blk++;var D=V.dst&&V.dst.k==='node'?lgNode(V.side,V.dst.id):null;if(D)D._lgWhy=why;if(V.dst&&V.dst.k==='unit'){var u=uById(V.dst.id);if(u)u.lgWhy=why;}
  logE(V.side,'lgcut',LGM[V.m].n+'無法抵達'+(D?'「'+D.name+'」':'目的地')+'：'+why+'，折返'+(lgCargo(V)>0.5?'（載運 '+fmt(lgCargo(V))+' 噸）':''),V.x,V.y);
  /* 滿載時退回上游卸還物資，空車則回駐地 */var back=lgCargo(V)>0.5&&V.src&&V.src.k==='node'?V.src:V.home,h=lgEnd(back);V.ph0=null;V.abortTo=back;if(h&&lgLeg(V,h[0],h[1])){V.ph='ret';V.abort=1;}else V.ph='gone';}
/* 抵達 */
function lgLoadT(m){return m==='ship'?3*3600:m==='rail'?3600:m==='air'||m==='heli'?1200:m==='drop'?60:m==='porter'?1800:m==='wagon'?2400:1200;}
function lgArrive(V){if(V.ph==='out'){V.ph='load';V.until=G.t+lgLoadT(V.m);return;}if(V.ph==='in'){V.ph='unl';V.until=G.t+lgLoadT(V.m)*(V.m==='drop'?1:0.8);return;}if(V.ph==='ret'){if(V.abort&&lgCargo(V)>0.5){var B=V.abortTo||V.home,H=B&&B.k==='node'?lgNode(V.side,B.id):null;if(H&&H.k!=='off')LCLS.forEach(function(c){H.st[c]=(H.st[c]||0)+V.c[c];});}V.ph='gone';return;}}
/* 裝貨：依目的地需要的比例從上游節點取貨 */
function lgLoaded(V){var room=lgCap(V)-lgCargo(V),src=V.src,side=V.side;if(room>0.01&&src){var U=src.k==='node'?lgNode(side,src.id):null,off=src.k==='edge'||U&&U.k==='off';if(src.k==='node'&&(!U||U.status==='captured')){lgAbort(V,'上游節點已失');return;}
    var only=V.only||null,dem=V.dem||sideDemand(side),tot=0;if(only){var g=off?room:Math.min(room,U.st[only]||0);if(!off)U.st[only]-=g;V.c[only]+=g;tot=g;}else{var w=sum(LCLS,function(c){return (dem[c]||0)+0.001;});LCLS.forEach(function(c){var want=room*((dem[c]||0)+0.001)/w,g=off?want:Math.min(want,U.st[c]||0);if(!off)U.st[c]-=g;V.c[c]+=g;tot+=g;});}
    if(tot<0.05){var h=lgEnd(V.home);V.ph='ret';if(!h||!lgLeg(V,h[0],h[1]))V.ph='gone';var D=V.dst&&V.dst.k==='node'?lgNode(side,V.dst.id):null;if(D)D._lgWhy='上游節點沒有存貨';return;}}
  var t=lgEnd(V.dst);if(!t){lgAbort(V,'目的地已失');return;}if(V.dst.k==='node'){var DN=lgNode(side,V.dst.id);if(DN&&DN.k==='port'){var pw=portWater(DN);if(pw)t=pw;}}if(!lgLeg(V,t[0],t[1])){V.ph='wait';V.ph0='in';V.tw=G.t;return;}V.ph='in';}
/* 卸貨：補給節點入庫；補給部隊、被圍部隊直接收下 */
function lgUnloaded(V){var side=V.side,dst=V.dst,got=0;if(dst.k==='node'){var N=lgNode(side,dst.id);if(N&&N.status!=='captured'){var space=Math.max(0,N.cap-lgSum(N.st)),f=lgCargo(V)>0?Math.min(1,space/lgCargo(V)):0;LCLS.forEach(function(c){var g=V.c[c]*f;N.st[c]=(N.st[c]||0)+g;V.c[c]-=g;got+=g;});N._lgIn=(N._lgIn||0)+got;N._lgWhy='';N.lastIn=G.t;}}
  else if(dst.k==='unit'){var u=uById(dst.id);if(u&&alive(u)&&onMap(u)){var eff=V.m==='drop'?0.72:1,enemy=V.m==='drop'||V.m==='heli'?enemyNear(side,u.x,u.y,1000,'land'):0;if(V.m==='heli'&&enemy>0)eff=0.55;if(V.m==='drop'&&enemy>0)eff=0.5;got=lgGive(u,V,eff);if(V.m==='drop'||V.m==='heli'){lgStats(side).airT=(lgStats(side).airT||0)+got;logE(side,'log',(V.m==='heli'?'直升機':'運輸機')+'把約 '+fmt(got,got<10?1:0)+' 噸物資'+(V.m==='heli'&&eff>0.9?'運抵':'空投給')+uName(u)+(eff<0.7?'（部分落到敵方陣地或遺失）':''),u.x,u.y,u.id);}}}
  var S=lgStats(side);S.arr++;S.t+=got;var h=lgEnd(V.home),same=V.home&&dst&&V.home.k===dst.k&&V.home.id===dst.id;if(same||!h){V.ph='gone';return;}V.ph='ret';if(!lgLeg(V,h[0],h[1]))V.ph='gone';}
/* 部隊直接收下物資：補給部隊存入庫存，一般部隊補足口糧、彈藥與燃料 */
function lgGive(u,V,eff){var L=u.lg||logInit(u),got=0;if(ST(u).fl.indexOf('l')>=0){L.stk=L.stk||{food:0,ammo:0,fuel:0,fod:0};LCLS.forEach(function(c){var g=V.c[c]*eff;L.stk[c]+=g;V.c[c]=0;got+=g;});return got;}
  var fd=Math.min(V.c.food*eff*1000,Math.max(0,L.foodCap*1.2-L.food));L.food+=fd;got+=fd/1000;var fl=Math.min(V.c.fuel*eff*1000,Math.max(0,L.fuelCap-L.fuel));L.fuel+=fl;got+=fl/1000;var fo=Math.min(V.c.fod*eff*1000,Math.max(0,L.fodCap-L.fod));L.fod+=fo;got+=fo/1000;
  var uofT=L.uof*L.basic;if(uofT>0){var am=Math.min(V.c.ammo*eff*1000,(100-u.ammo)/100*uofT);u.ammo=Math.min(100,u.ammo+am/uofT*100);got+=am/1000;}LCLS.forEach(function(c){V.c[c]=0;});return got;}

/* ---------- 每 10 分鐘派車：補給站的車隊、港口／機場／車站的進貨、補給部隊往返、空中補給 ---------- */
function lgOn(){return !!(G&&G.started&&G.set.lgv!==false);}
function lgEnRoute(side,N){var veh=0,cg=0;(G.lgv||[]).forEach(function(V){if(V.side!==side)return;if(V.home&&V.home.k==='node'&&V.home.id===N.id)veh+=V.n;if(V.dst&&V.dst.k==='node'&&V.dst.id===N.id&&(V.ph==='in'||V.ph==='load'||V.ph==='out'))cg+=V.ph==='in'?lgCargo(V):lgCap(V);});return {veh:veh,cg:cg};}
/* cont：上一步的工作量用完、接著派車（吞吐量只在每 10 分鐘的例行派車時累積） */
function lgDispatch(cont){if(!lgOn())return;G._lgMore=0;G._lgN=(G._lgN||0)+(cont?0:1);(nSides()<3?((G._lgN&1)?[0,1]:[1,0]):SIDES().map(function(s,i,A){return A[(i+G._lgN)%A.length];})).forEach(function(side){var L=nodesOf(side);if(!L.length)return;var dem=sideDemand(side);
    L.forEach(function(N){if(N.status==='captured'||N.k==='off')return;var F=N.fac?facById(N.fac):null,hpf=F&&F.hp!==undefined?clamp(F.hp/100,0,1):1;
      if(N.k==='depot'){if(N.noUp)return;var U=upOf(N);if(!U){N._lgWhy='沒有上游節點';return;}var R=lgEnRoute(side,N),free=Math.max(0,Math.round((N.cv&&N.cv.n||0)-R.veh)),m=lgRoadMode(),pay=lgPay(m);if(free<2)return;
        var space=(N.cap||3000)-lgSum(N.st)-R.cg;if(space<pay*Math.min(free,4))return;if(U.k!=='off'&&lgSum(U.st,N.only)<pay)return void(N._lgWhy='上游「'+U.name+'」沒有存貨');var n=Math.min(free,lgSerial(m),Math.ceil(space/pay));if(lgBusy()){G._lgMore=1;return;}
        var sp=U.k==='off'?lgEdge(side,N.x,N.y):[U.x,U.y],V=lgNew(side,m,n,{home:{k:'node',side:side,id:N.id},src:U.k==='off'?{k:'edge',x:sp[0],y:sp[1]}:{k:'node',side:side,id:U.id},dst:{k:'node',side:side,id:N.id},x:N.x,y:N.y,only:N.only||null,dem:dem});
        if(!lgLeg(V,sp[0],sp[1])){V.ph='gone';N._lgWhy='到上游「'+(U.k==='off'?'地圖外基地':U.name)+'」沒有可通行的道路';lgStats(side).blk++;}return;}
      /* 港口、機場、車站：依吞吐量累積，湊滿一批就從地圖邊緣派出船隊、運輸機或列車 */
      var m2=N.k==='port'?'ship':N.k==='rail'?'rail':(featOn('airlift')?'air':null);if(!m2){N._lgWhy='這個年代還沒有空運';return;}var f=nodeOK(N)?1:0;if(!f){N._lgWhy=N.k==='port'?'未臨可通航的水域':'鐵路未連通本方地圖邊緣';return;}
      if(N.k==='air'){var w=WX[G.env.wx][5];f*=w;if(w<0.3){N._lgWhy='天候不佳，運輸機停飛';}}if(!cont)N._cred=Math.min((N._cred||0)+N.thr*600/86400*f*hpf,N.thr*1.5+50);
      var pay2=lgPay(m2),lot=m2==='ship'?clamp(N.thr/6,Math.min(pay2,200),pay2*2):m2==='rail'?(typeof railLot==='function'?railLot(N,pay2):Math.min(pay2,Math.max(60,N.thr/3))):pay2*4;if(N._cred0===undefined){N._cred0=1;N._cred=Math.max(N._cred||0,lot);}if(N._cred<lot)return;var R2=lgEnRoute(side,N),space2=(N.cap||20000)-lgSum(N.st)-R2.cg;if(space2<lot*0.5)return;if(lgBusy()){G._lgMore=1;return;}var amt=Math.min(N._cred,space2,lot);N._cred-=amt;
      var e=m2==='ship'?seaEdge(side,N.x,N.y):m2==='rail'?railEdge(side,N.x,N.y):lgEdge(side,N.x,N.y);if(!e){N._lgWhy=m2==='ship'?'找不到通往外海的航道':'鐵路沒有連到本方地圖邊緣';return;}
      var tgt=m2==='ship'?portWater(N):[N.x,N.y];if(!tgt){N._lgWhy='碼頭附近沒有可泊靠的水域';return;}var n2=Math.max(1,Math.ceil(amt/pay2)),V2=lgNew(side,m2,n2,{home:{k:'edge',x:e[0],y:e[1]},src:{k:'edge',x:e[0],y:e[1]},dst:{k:'node',side:side,id:N.id},x:e[0],y:e[1],ph:'in',pay:amt/n2});
      var w2=sum(LCLS,function(c){return (dem[c]||0)+0.001;});LCLS.forEach(function(c){V2.c[c]=amt*((dem[c]||0)+0.001)/w2;});if(!lgLeg(V2,tgt[0],tgt[1])){V2.ph='gone';N._cred+=amt;N._lgWhy=m2==='ship'?'航道不通':m2==='rail'?'鐵路被切斷':'航線不通';}});
    lgShuttle(side,L,dem);if(G.step%60===1)lgAirSupply(side,L);});}
/* 補給部隊：自己的車輛往返範圍內存貨最合適的節點（或本方地圖邊緣） */
function lgShuttle(side,L,dem){G.units.forEach(function(u){if(u.side!==side||!onMap(u)||!isLeaf(u)||ST(u).fl.indexOf('l')<0||u.ms==='rout'||u.st==='ship')return;if(u.shut&&lgById(u.shut))return;u.shut=0;var lg=u.lg||logInit(u);lg.stk=lg.stk||{food:0,ammo:0,fuel:0,fod:0};var cap=Math.max(1,lg.pay||1);if(lgSum(lg.stk)>cap*0.6)return;
    var R=uEra(u).sup*3000,best=null,bs=0,w=sum(LCLS,function(c){return (dem[c]||0)+0.001;});L.forEach(function(N){if(N.k==='off'||N.status==='captured'||N.noUp&&N.only!=='fuel')return;var d=dist(N.x,N.y,u.x,u.y);if(d>R)return;var sc=0;LCLS.forEach(function(c){sc+=Math.min(N.st[c]||0,cap*((dem[c]||0)+0.001)/w);});sc/=1+d/5000;if(sc>bs){bs=sc;best=N;}});
    var src=null,sp=null;if(best&&bs>cap*0.05){src={k:'node',side:side,id:best.id};sp=[best.x,best.y];}else if(N0edge(side,u,R)&&nodesOf(side).some(function(N){return N.k==='off';})){sp=lgEdge(side,u.x,u.y);src={k:'edge',x:sp[0],y:sp[1]};}if(!src)return;if(lgBusy()){G._lgMore=1;return;}
    var m=lgRoadMode(),pay=lgPay(m),n=Math.max(1,Math.min(60,Math.round(cap/pay))),V=lgNew(side,m,n,{home:{k:'unit',id:u.id},src:src,dst:{k:'unit',id:u.id},x:u.x,y:u.y,pay:cap/n,su:u.id,dem:dem});if(!lgLeg(V,sp[0],sp[1])){V.ph='gone';u.lgWhy='到補給點沒有可通行的道路';return;}u.shut=V.id;});}
/* 空中補給：被圍或長時間斷補給的部隊；每天的架次有限，損失的飛機會減少架次 */
function lgAirPool(side){var S=SD(side),y=lgY();if(!S.alp){var base=y<featY('airdrop')?0:y<1950?6:y<1970?10:y<1990?14:18;S.alp={base:base,day:-1,left:base};}var d=Math.floor(G.t/86400);if(S.alp.day!==d){S.alp.day=d;S.alp.left=Math.round(S.alp.base);}return S.alp;}
function lgAirSupply(side,L){if(!featOn('airdrop')&&!featOn('heli'))return;var AP=lgAirPool(side);if(AP.left<=0)return;var heli=featOn('heli'),need=G.units.filter(function(u){if(u.side!==side||!onMap(u)||!isLeaf(u)||ST(u).dom!=='land'||u.st==='ship')return false;var lg=u.lg;if(!lg)return false;var cut=(u.oos||0)>3*3600||u.besieged&&G.t-u.besieged<1800;if(!cut)return false;
    if(G.lgv&&G.lgv.some(function(V){return V.dst&&V.dst.k==='unit'&&V.dst.id===u.id&&(V.m==='drop'||V.m==='heli');}))return false;return u.ammo<40||lg.food<lg.foodCap*0.35||lg.fuelCap>0&&lg.fuel<lg.fuelCap*0.25;}).sort(function(a,b){return a.ammo-b.ammo;});
  need.slice(0,Math.min(3,AP.left)).forEach(function(u){var A=null,bd=1e18;L.forEach(function(N){if(N.k!=='air'||N.status==='captured')return;var d=dist(N.x,N.y,u.x,u.y);if(d<bd){bd=d;A=N;}});var sp=A?[A.x,A.y]:lgEdge(side,u.x,u.y),d=dist(sp[0],sp[1],u.x,u.y),m=heli&&d<150000?'heli':'drop';if(!featOn('airdrop')&&m==='drop')return;
    var lg=u.lg,need={food:Math.max(0,lg.foodCap-lg.food)/1000,fuel:Math.max(0,lg.fuelCap-lg.fuel)/1000,ammo:(100-u.ammo)/100*lg.uof*lg.basic/1000,fod:0},tot=need.food+need.fuel+need.ammo;if(tot<0.3)return;var pay=lgPay(m),n=clamp(Math.ceil(tot/pay),1,m==='heli'?6:4),V=lgNew(side,m,n,{home:A?{k:'node',side:side,id:A.id}:{k:'edge',x:sp[0],y:sp[1]},src:A?{k:'node',side:side,id:A.id}:{k:'edge',x:sp[0],y:sp[1]},dst:{k:'unit',id:u.id},x:sp[0],y:sp[1],ph:'out'});
    V.dem={food:need.food,ammo:need.ammo,fuel:need.fuel,fod:0};V.pts=null;AP.left--;logE(side,'log','派'+(m==='heli'?'運輸直升機':'運輸機')+' '+n+' 架'+(m==='heli'?'運補':'空投補給')+'給被切斷補給的'+uName(u),sp[0],sp[1],u.id);});}

/* ===================== 三、油料：耗盡時無法移動、快耗盡時大打折扣；飛機與船艦在油料耗盡前改降友軍機場、進港或撤出地圖 ===================== */
Object.assign(ORDN,{refit:'撤出地圖休整',facdemo:'爆破設施',repair:'修復設施',civ:'對平民行動',refuel:'返航加油'});
KIAF.expl=0.45;CIVK.expl='設施爆炸';
function fuelQ(u){var L=u.lg;return L&&L.fuelCap>0?clamp(L.fuel/L.fuelCap,0,1):1;}
function fuelDep(u){var s=ST(u);return !!(u.lg&&u.lg.fuelCap>0&&(s.mobi===3||s.mobi===4||s.dom==='sea'||s.dom==='sub'));}
(function(){var b=lgSpeed;lgSpeed=function(u){var f=b(u);if(!fuelDep(u))return f;var q=fuelQ(u);if(q<=0)return 0;if(q<0.1)return f*0.35;if(q<0.2)return f*0.65;return f;};})();
(function(){var b=speedAt;speedAt=function(u,s,pf){var v=b(u,s,pf);if((s.dom==='sea'||s.dom==='sub')&&fuelDep(u)){var q=fuelQ(u);v*=q<=0?0:q<0.1?0.4:q<0.2?0.7:1;}return v;};})();
(function(){var b=moveStep;moveStep=function(u,s,frac){if(s.dom!=='air'&&fuelDep(u)&&fuelQ(u)<=0){if(!u.dryLog||G.t-u.dryLog>4*3600){u.dryLog=G.t;logE(u.side,'supply',uName(u)+'燃料耗盡，'+(s.dom==='land'?'車輛無法移動，等待補給':'停俥漂泊，等待加油'),u.x,u.y,u.id);}return 0;}return b(u,s,frac);};})();
/* 補給來源：一般部隊先找綜合補給點，油料、彈藥專用點另外補；船艦必須進港（或駛出地圖邊緣由後方補給） */
(function(){var b=supplierOf;supplierOf=function(u,L){if(!lgOn())return b(u,L);var s=ST(u);if(s.dom==='sea'||s.dom==='sub'){var best=null,bd=4000;L.forEach(function(N){if(N.k!=='port'||N.status==='captured')return;var p=portWater(N)||[N.x,N.y],d=dist(p[0],p[1],u.x,u.y);if(d<bd){bd=d;best=N;}});if(best)return best;var MP=G.map,e=Math.min(u.x,u.y,MP.Wm-u.x,MP.Hm-u.y);if(e<5000)return L.filter(function(N){return N.k==='off';})[0]||{k:'off',st:null};return null;}
  var r=b(u,L.filter(function(N){return !N.only;}));if(r)return r;var R=uEra(u).sup*1000,o=null,od=1e18;L.forEach(function(N){if(!N.only||N.status==='captured'||lgSum(N.st,N.only)<0.05)return;var d=dist(N.x,N.y,u.x,u.y);if(d<R&&d<od){od=d;o=N;}});return o;};})();
(function(){var b=resupply;resupply=function(u,L,src,dt){b(u,L,src,dt);if(!lgOn()||ST(u).dom!=='land')return;var R=uEra(u).sup*1000*(hasQ(offOf(u),'logist')?1.3:1),side=u.side;
  function only(c){var o=null,od=1e18;nodesOf(side).forEach(function(N){if(N.only!==c||N===src||N.status==='captured'||(N.st[c]||0)<0.05)return;var d=dist(N.x,N.y,u.x,u.y);if(d<R&&d<od){od=d;o=N;}});return o;}
  if(L.fuelCap>0&&L.fuel<L.fuelCap*0.9){var F=only('fuel');if(F)b(u,L,F,dt);}if(u.ammo<90){var A=only('ammo');if(A)b(u,L,A,dt);}};})();
/* ---------- 飛機：基地失守或油料不夠回原基地時，改降最近的友軍機場，否則飛出地圖回後方基地；油料用盡則墜毀 ---------- */
function airBaseLost(u){if(u.baseU){var c=uById(u.baseU);return !c||!alive(c);}var B=u.base;if(!B)return false;var en=enemyNear(u.side,B[0],B[1],2500,'land'),fr=friendNear(u.side,B[0],B[1],2500);if(en>0&&fr===0)return true;var F=facNear(B[0],B[1],3000,function(F){return F.k==='air';});return !!(F&&(F.dead||F.own>=0&&F.own!==u.side));}
function airAlt(u,s,reach){var side=u.side,best=null,bd=1e18;nodesOf(side).forEach(function(N){if(N.k!=='air'||N.status==='captured')return;var F=N.fac?facById(N.fac):null;if(F&&(F.dead||F.hp<15))return;var d=dist(N.x,N.y,u.x,u.y);if(d<reach&&d<bd){bd=d;best={x:N.x,y:N.y,n:N.name};}});
  var e=lgEdge(side,u.x,u.y),de=dist(e[0],e[1],u.x,u.y);if(de<reach&&de<bd*1.3){best={x:e[0],y:e[1],n:'地圖外的後方基地',edge:1};}return best;}
(function(){var b=airStep;airStep=function(u,s){if(!u.lift&&!isCarrier(u)){
    if(u.st==='air'){if(u.fuel<=0){var MP=G.map,wet=isWater(MP.lc[cellAt(u.x,u.y)]);destroy(u,'fuel',uName(u)+'燃料耗盡，'+(wet?'迫降海上':'墜毀')+'（'+placeTxt(u.x,u.y)+'）');return;}
      if((G.step+u.id)%4===0){var B=baseOf(u),v=s.vr/3.6,need=dist(u.x,u.y,B[0],B[1])/v;if(airBaseLost(u)||need>u.fuel*0.92){var alt=airAlt(u,s,u.fuel*v*0.9);if(alt&&(dist(alt.x,alt.y,B[0],B[1])>3000||u.baseU)){u.base=[alt.x,alt.y];u.baseU=0;u.task='rtb';logE(u.side,'air',uName(u)+(alt.edge?'油料不足以返回原基地，飛出地圖回後方基地整補':'改降「'+alt.n+'」'),u.x,u.y,u.id);}}}}
    else if(u.st==='base'&&!u.baseU&&(G.step+u.id)%8===0&&airBaseLost(u)){var alt2=airAlt(u,s,(u.fuel||endOf(s))*s.vr/3.6*0.9);if(alt2){u.st='air';u.task='rtb';u.base=[alt2.x,alt2.y];u.baseU=0;u.fuel=u.fuel||endOf(s)*0.5;logE(u.side,'air',uName(u)+'的基地失守，緊急轉場到'+(alt2.edge?'地圖外的後方基地':'「'+alt2.n+'」'),u.x,u.y,u.id);}else{destroy(u,'capt',uName(u)+'的基地失守，來不及起飛，飛機在地面被俘或摧毀');return;}}}
  b(u,s);};})();
/* ---------- 船艦：油料低於四分之一時，駛往最近有油料的友軍港口，或駛出地圖邊緣由後方補給，加滿後回到原任務 ---------- */
function navStep8(){if(!lgOn())return;G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||u.amph||u.cvy||u.st==='ship')return;var s=ST(u);if((s.dom!=='sea'&&s.dom!=='sub')||!fuelDep(u))return;var q=fuelQ(u),o=u.ord;
    if(o&&o.dk==='refuel'){if(q>0.92){var P=u.ordPrev;u.ordPrev=null;logE(u.side,'log',uName(u)+'加油完畢，返回任務',u.x,u.y,u.id);if(P&&P.k){P.st='exec';activate(u,P);}else activate(u,newOrder('halt',{}));}return;}
    if(q>=0.25)return;var need=u.lg.fuelCap*0.75/1000,best=null,bd=1e18;nodesOf(u.side).forEach(function(N){if(N.k!=='port'||N.status==='captured'||(N.st.fuel||0)<need*0.5)return;var p=portWater(N);if(!p)return;var d=dist(p[0],p[1],u.x,u.y);if(d<bd){bd=d;best={x:p[0],y:p[1],n:N.name};}});
    var e=seaEdge(u.side,u.x,u.y);if(e&&(!best||dist(e[0],e[1],u.x,u.y)<bd*0.7))best={x:e[0],y:e[1],n:'地圖外海域（由後方補給）',edge:1};if(!best)return;u.ordPrev=o&&o.k!=='halt'?{k:o.k,x:o.x,y:o.y,face:o.face,opt:o.opt,dk:o.dk,r:o.r}:null;
    activate(u,newOrder('move',{x:best.x,y:best.y,dk:'refuel'}));logE(u.side,'log',uName(u)+'油料剩 '+Math.round(q*100)+'%，'+(best.edge?'駛出地圖由後方補給':'駛往「'+best.n+'」加油'),u.x,u.y,u.id);});}
/* ---------- 撤出地圖休整：潰散或物資耗盡、無法補給的部隊撤到本方地圖邊緣，離開地圖整補；途中被敵軍近距離接觸則投降或被殲滅 ---------- */
function refitPt(u){var p=lgEdge(u.side,u.x,u.y);return validPos(ST(u),p[0],p[1]);}
function edgeD(u){var MP=G.map,e=SD(u.side).edge||'W';return e==='W'?u.x:e==='E'?MP.Wm-u.x:e==='N'?u.y:MP.Hm-u.y;}
function refitLeave(u,why){var s=ST(u);u.st='off';u.path=null;u.pq=0;u.goal=null;u.task='hold';u.ord=null;u.pend=[];u.refit={t0:G.t,from:[u.x,u.y],why:why||'',ms0:u.ms};if(u.ms==='rout')u.ms='shaken';u.arr=null;
  logE(u.side,'refit',uName(u)+'撤出地圖外休整'+(why?'（'+why+'）':''),u.x,u.y,u.id);(function up(p){if(p<0)return;var F=uById(p);if(!F||isLeaf(F))return;if(leavesOf(F).every(function(x){return !onMap(x);})&&F.st!=='off'){F.st='off';F.refit={t0:G.t,from:[F.x,F.y]};}up(F.p);})(u.p);}
/* 地圖外：每 10 分鐘恢復士氣、體力、組織，補齊物資，從補充兵員池補人 */
function refitStep(){var h=600/3600;SIDES().forEach(function(side){var S=SD(side);G.units.forEach(function(u){if(u.side!==side||!u.refit||u.st!=='off'||!isLeaf(u))return;var s=ST(u);u.mor=clamp(u.mor+4*h*(u.mor<s.mor?1:0.2),0,100);u.fat=Math.max(0,u.fat-12*h);u.org=Math.min(100,(u.org||0)+6*h);u.ammo=Math.min(100,u.ammo+20*h);u.sup=0;
    if(u.ms==='shaken'&&u.mor>60)u.ms='ok';var L=u.lg;if(L){L.food=Math.min(L.foodCap,L.food+L.foodCap*0.3*h);L.fuel=Math.min(L.fuelCap,L.fuel+L.fuelCap*0.4*h);L.fod=Math.min(L.fodCap,L.fod+L.fodCap*0.3*h);L.hun=Math.max(0,(L.hun||0)-10*h);}
    if(S.repl>0&&u.men<u.men0){var dm=Math.min(u.men0-u.men,u.men0*0.04*h*(typeof replMul==='function'?replMul():1),S.repl);var t0=u.trn===undefined?s.trn:u.trn;u.trn=(t0*u.men+Math.min(t0,45)*dm)/(u.men+dm);u.men+=dm;S.repl-=dm;u.repl=(u.repl||0)+dm;}
    if(u.veh<u.veh0)u.veh=Math.min(u.veh0,u.veh+(u.veh0||0)*0.02*h);if(u.wia>0)u.wia=Math.max(0,u.wia-u.wia*0.05*h);
    var ready=u.mor>=Math.min(70,s.mor*0.85)&&u.fat<20&&u.ammo>=95;if(ready&&!u.refit.ready){u.refit.ready=G.t;logE(side,'refit',uName(u)+'休整完畢（'+durTxt(G.t-u.refit.t0)+'），可以重新投入',u.refit.from[0],u.refit.from[1],u.id);}
    /* AI 控制的部隊休整完畢後自動返回 */if(u.refit.ready&&SD(side).ai&&aiControls(u)&&G.t-u.refit.ready>1800)refitReturn(u);});});}
function refitReturn(u){if(!u.refit||u.st!=='off')return false;var from=u.refit.from,p=lgEdge(u.side,from[0],from[1]),s=ST(u),q=validPos(s,p[0],p[1]);u.x=q[0];u.y=q[1];u.st=s.dom==='air'?'base':'ok';if(s.dom==='air'){u.base=[q[0],q[1]];}u.form='march';u.task='hold';u.ord=null;u.refit=null;u.home=[q[0],q[1]];
  logE(u.side,'refit',uName(u)+'重新投入戰場（'+placeTxt(q[0],q[1])+'）',q[0],q[1],u.id);(function up(p){if(p<0)return;var F=uById(p);if(!F)return;if(F.st==='off'&&F.refit){F.st='ok';F.refit=null;F.x=q[0];F.y=q[1];}up(F.p);})(u.p);return true;}
/* 撤退中、潰散或彈盡糧絕的部隊被敵軍追上（400 公尺內）：多數投降，抵抗者被殲滅 */
function cornerStep(){G.units.forEach(function(u){if(!isLeaf(u)||!alive(u)||!onMap(u)||u.st==='lift'||u.amph)return;var s=ST(u);if(s.dom!=='land'||s.fl.indexOf('G')>=0)return;var o=u.ord,wd=o&&o.dk==='refit',L=u.lg,dry=(u.oos||0)>6*3600&&(u.ammo<10||L&&L.hun>70||fuelDep(u)&&fuelQ(u)<=0);if(!(wd||u.ms==='rout'||dry))return;if(!(u._ed<400))return;var e=u._eid?uById(u._eid):null;if(!e||!alive(e)||e.ms==='rout'||ST(e).dom!=='land')return;
    var p=(u.ms==='rout'?0.06:wd?0.04:0.03)*(u.ammo<10?1.5:1)*(strFrac(u)<0.5?1.5:1)*(surrounded(u)?2:1);if(rnd8()>=p)return;var harsh=polOf(e,'pow')>=4,resist=u.mor>45&&u.ammo>15&&!harsh?0.15:harsh?0.6:0.3;u._capBy=e.id;
    if(rnd8()<resist){destroy(u,'kill',uName(u)+(wd?'在撤離途中':'')+'被'+uName(e)+'追上，抵抗後被殲滅（'+placeTxt(u.x,u.y)+'）');}else{u.surr=1;destroy(u,'capt',uName(u)+(wd?'在撤離途中':u.ms==='rout'?'潰散中':'彈盡糧絕')+'被'+uName(e)+'追上，向對方投降（'+placeTxt(u.x,u.y)+'）');}});}
/* 自動撤出：潰散部隊退到本方地圖邊緣附近就離開地圖；AI 部隊長時間斷補給、物資耗盡時下令撤出休整 */
function autoRefit(){G.units.forEach(function(u){if(!isLeaf(u)||!alive(u)||!onMap(u)||u.st==='lift'||u.amph)return;var s=ST(u);if(s.dom!=='land'||s.fl.indexOf('G')>=0)return;
    if(u.ms==='rout'&&G.set.autoRefit!==false&&edgeD(u)<2500&&!(u._ed<1500)){refitLeave(u,'潰散');return;}
    if(u.ord&&u.ord.dk==='refit'){if(edgeD(u)<1500)refitLeave(u,u.ord.why||'');return;}
    if(!SD(u.side).ai||!aiControls(u))return;var L=u.lg,dry=(u.oos||0)>12*3600&&(u.ammo<12||L&&L.hun>65||fuelDep(u)&&fuelQ(u)<0.05);if(dry&&!(u.besieged&&G.t-u.besieged<1800)&&!(u._ed<2000)){var p=refitPt(u);activate(u,newOrder('move',{x:p[0],y:p[1],dk:'refit',why:'物資耗盡、無法補給'}));logE(u.side,'refit',uName(u)+'物資耗盡又無法補給，奉命撤出地圖休整',u.x,u.y,u.id);}});}

/* ===================== 四、平民：看得見、可以互動的民眾；國際援助團體、教會團體、戰地記者 =====================
   每個聚落的居民對雙方有各自的態度（−100 敵視～100 支持）：傷亡、佔領、徵用與部隊的作為都會改變它。
   支持某一方的居民會向它通報敵情；敵視的居民掩護游擊隊、襲擊補給車隊。
   部隊可以對平民：拘留審查、引導疏散、救護支援、贈與物資；也可能被下令強制拘禁、無差別開火——
   這些是戰爭罪行：守法的部隊可能拒絕執行，執行後會被記錄、被報導，民心崩潰、游擊活動升高，戰後總結列出責任者。 */
CIVK.detain='拘禁中死亡';
var CIVA={detain:['拘留審查',3600,0,'把可疑的成年男性帶走審查，可降低游擊與破壞，但居民會不滿'],guide:['引導疏散',0,0,'護送居民或難民隊伍到收容所或本方後方'],aid:['救護支援',7200,0,'救治傷患、協助避難與防疫'],give:['贈與物資',1800,0,'把部隊的糧食分給居民或難民（部隊自己的存糧會減少）'],
  intern:['強制拘禁',7200,1,'把居民集體關押：違反戰爭法（日內瓦公約以後明文禁止任意拘禁）'],fire:['無差別開火',600,2,'向平民開火：屠殺，嚴重的戰爭罪行'],release:['釋放被拘留者',1200,0,'釋放本方拘留的平民']};
/* 本方設施的情報（各方知道的控制方）：兩方時沿用原本的寫法 */
function facKn0(side){if(nSides()<3)return [side,-1];var a=sAV(-1);a[side]=side;return a;}
/* 居民對各方的初始態度：傾向的一方友善、與它交戰的一方敵視、其他中立 */
function civAttInit(loy){if(nSides()<3)return loy===0?[35,-25]:loy===1?[-25,35]:[0,0];var a=sA0();if(loy>=0)SIDES().forEach(function(s){a[s]=s===loy?35:hostile(loy,s)?-25:0;});return a;}
function civAtt0(){if(!G.civ)return;G.civ.S.forEach(function(g){if(!g.att)g.att=civAttInit(g.loy);});G.civ.D=G.civ.D||[];}
function attAdd(g,side,v){if(!g||!(side>=0&&side<nSides()))return;if(!g.att)g.att=sA0();g.att[side]=clamp((g.att[side]||0)+v,-100,100);}
function attNear(x,y,R,side,v){if(!G.civ)return;G.civ.S.forEach(function(g){var d=dist(g.x,g.y,x,y);if(d<R)attAdd(g,side,v*(1-d/R));});}
(function(){var b=civCas;civCas=function(g,c,kf,cause,bySide){b(g,c,kf,cause,bySide);if(bySide>=0&&c>0.5)attAdd(g,bySide,-Math.min(25,1+c*0.3));};})();
/* 民心決定誰會得到居民的通報 */
humintStep=function(){if(!G.civ)return;G.civ.S.forEach(function(g){if(civPresent(g)<50)return;var a=g.att||civAttInit(g.loy),side=-1;if(a.length<3)side=a[0]>=25&&a[0]>a[1]?0:a[1]>=25&&a[1]>a[0]?1:-1;else{for(var ai=0;ai<a.length;ai++){if(!(a[ai]>=25))continue;var top=true;for(var aj=0;aj<a.length;aj++)if(aj!==ai&&!(a[ai]>(a[aj]||0)))top=false;if(top)side=ai;}}if(side<0)return;var Q=G.rq[side],R=g.r+2500,pr=clamp(0.12+(a[side]-25)*0.013,0.1,0.45);
  gridNear(g.x,g.y,R,function(t){if(t.side===side||!onMap(t)||!isLeaf(t))return;var ts=ST(t);if(ts.dom!=='land'||ts.fl.indexOf('G')>=0||dist(t.x,t.y,g.x,g.y)>R||rnd8()>pr)return;Q.push({at:G.t+1800+rnd8()*3600,id:t.id,x:t.x+(rnd8()-0.5)*1200,y:t.y+(rnd8()-0.5)*1200,t:G.t,q:0.5,by:0});});});};
/* ---------- 目標 ---------- */
function civTgt(o){var C=G.civ,p=o&&o.opt;if(!C||!p)return null;if(p.tg==='S')return C.S[p.id]||null;if(p.tg==='R')return C.R.filter(function(Q){return Q.id===p.id;})[0]||null;if(p.tg==='D')return (C.D||[]).filter(function(D){return D.id===p.id;})[0]||null;return null;}
function civLive(T,t){if(!T)return false;if(t==='S')return civPresent(T)>=1;if(t==='R')return T.n>=1&&(T.st==='go'||T.st==='stop'||T.st==='trap');if(t==='D')return T.n>=1&&(T.st==='held'||T.st==='move');return false;}
function civReach(T,t){return t==='S'?(T.r||300)+300:t==='R'?500:400;}
/* 違法命令：守法、軍紀好的部隊可能拒絕 */
function civRefuse(u,a){var L=clamp(polOf(u,'civ'),0,5),base=(a==='fire'?[0.85,0.65,0.4,0.15,0.05,0]:[0.7,0.5,0.3,0.1,0.03,0])[L],law=lawEra(),p=base*(law.y0>=featY('hague')?1:0.5)*(u.dis===undefined?1:u.dis>60?1.15:u.dis<35?0.7:1)*(hasQ(offOf(u),'inspire')?1.1:1);
  if(rnd8()<p){logE(u.side,'civ',uName(u)+'拒絕執行「'+CIVA[a][0]+'」的命令（官兵認為這是違法命令）',u.x,u.y,u.id);decLog(u.side,uName(u),'拒絕執行對平民的違法命令：'+CIVA[a][0]);civEv('civ',u.side,uName(u)+'拒絕執行對平民的違法命令（'+CIVA[a][0]+'）',u.x,u.y,u.id);if(G.onPause&&apOn('civact'))G.onPause('部隊拒絕執行違法命令');return true;}decLog(u.side,uName(u),'執行對平民的命令：'+CIVA[a][0],{crime:1});return false;}
function civAct(u,o){var T=civTgt(o),t=o.opt&&o.opt.tg,a=o.opt&&o.opt.act;if(!G.civ||!T||!civLive(T,t)||!CIVA[a]){logE(u.side,'civ',uName(u)+'：找不到命令指定的平民',u.x,u.y,u.id);u.task='hold';u.ord=null;return true;}
  if(ST(u).dom!=='land'){logE(u.side,'civ',uName(u)+'不是地面部隊，無法'+CIVA[a][0],u.x,u.y,u.id);u.task='hold';u.ord=null;return true;}if(CIVA[a][2]&&civRefuse(u,a)){u.task='hold';u.ord=null;return true;}
  o.ph='go';o.x=T.x;o.y=T.y;var p=validPos(ST(u),T.x,T.y);if(dist(u.x,u.y,T.x,T.y)<civReach(T,t)){u.task='at';u.path=null;}else{u.task='go';wantPath(u,p[0],p[1]);}return true;}
function civLeaf(u,s,o){var T=civTgt(o),t=o.opt.tg,a=o.opt.act;if(!T||!civLive(T,t)){if(o.ph!=='esc')logE(u.side,'civ',uName(u)+'：「'+CIVA[a][0]+'」的對象已經不在',u.x,u.y,u.id);u.ord=null;u.task='hold';return true;}
  if(o.ph==='go'){var d=dist(u.x,u.y,T.x,T.y);if(d>civReach(T,t)){if((G.step+u.id)%6===0&&(!u.goal||dist(u.goal[0],u.goal[1],T.x,T.y)>600)){var p=validPos(s,T.x,T.y);u.task='go';wantPath(u,p[0],p[1]);}return false;}
    o.ph='act';o.t1=G.t;u.task='work2';u.path=null;u.goal=null;if(a==='guide')civGuideStart(u,o,T,t);logE(u.side,'civ',uName(u)+'開始'+CIVA[a][0]+'（'+(t==='S'?T.n:t==='R'?'難民隊伍':'被拘留者')+'，'+placeTxt(T.x,T.y)+'）',u.x,u.y,u.id);return true;}
  if(o.ph==='esc')return civGuideStep(u,s,o);
  if(o.ph==='act'){if(G.t-o.t1<CIVA[a][1])return true;civApply(u,o,T,t);u.ord=null;u.task='hold';return true;}return false;}
/* ---------- 各種行動的後果 ---------- */
function civGroup(T,t){var n=t==='S'?civPresent(T):T.n,m=t==='S'?T.men:T.m;return {n:n,m:m};}
function civApply(u,o,T,t){var a=o.opt.act,side=u.side,C=G.civ,g=t==='S'?T:t==='R'?C.S[T.from]:C.S[T.from],L=polOf(u,'civ'),law=lawEra(),GR=civGroup(T,t),place=placeTxt(T.x,T.y),s=ST(u),med=s.fl.indexOf('D')>=0;
  if(a==='detain'){var n=Math.min(GR.m*0.08,u.men*1.5);if(n<1){logE(side,'civ',uName(u)+'在'+place+'沒有找到需要審查的人',u.x,u.y,u.id);return;}civTake(T,t,{m:n,w:0,k:0,e:0});var D=civDet(side,T,t,{m:n,w:0,k:0,e:0},'detain',u);var harsh=L>=3;D.rel=harsh?0:G.t+(24+24*rnd8())*3600;
    if(g){g.secT=G.t;g.unrest=clamp(g.unrest+(harsh?12:5),0,100);attAdd(g,side,harsh?-18:-8);}var cut=0;gridNear(T.x,T.y,5000,function(e){if(e.side===side||!onMap(e)||!isLeaf(e)||rnd8()>0.35)return;G.rq[side].push({at:G.t+600,id:e.id,x:e.x,y:e.y,t:G.t,q:0.5,by:u.id});cut++;});
    var txt=uName(u)+'在'+place+'拘留約 '+fmt(n)+' 名成年男性審查'+(harsh?'（不經審理長期關押，部分遭虐待）':'（依規定審查後釋放）')+(cut?'，問出 '+cut+' 處敵軍位置':'');logE(side,'civ',txt,u.x,u.y,u.id);var e=civEv('civ',side,txt,T.x,T.y,u.id,{dk:'detain',v:n});
    if(harsh&&law.y0>=featY('hague')){var w=warCrime(u,'detain',0,uName(u)+'在'+place+'任意拘禁約 '+fmt(n)+' 名平民並施以虐待',true);e.wc=1;}if(G.press)pressOn(e,u);return;}
  if(a==='aid'){var cap=(med?3:1)*Math.max(20,u.men*0.3),hung=0;if(t==='S'){T.hung=Math.max(0,T.hung-(med?30:15));T.unrest=Math.max(0,T.unrest-8);T.alarm=Math.max(0,T.alarm-0.15);T.aidT=G.t;T.wndT=(T.wndT||0)+Math.min(cap,T.wnd*0.3);hung=1;}else if(t==='R'){T.food=Math.max(T.food,1);T.aidT=G.t;}else{T.aidT=G.t;}
    attAdd(g,side,med?14:9);attNear(T.x,T.y,8000,side,3);u.fat=clamp(u.fat+6,0,100);var txt2=uName(u)+'在'+place+'救治傷患、協助避難'+(med?'（醫療部隊）':'');logE(side,'civ',txt2,u.x,u.y,u.id);civEv('civ',side,txt2,T.x,T.y,u.id,{dk:'aid'});void hung;return;}
  if(a==='give'){var Lg=u.lg||logInit(u),pop=Math.max(1,GR.n),kg=Math.min(Lg.food*0.5,pop*0.6*4);if(kg<1){logE(side,'civ',uName(u)+'自己的存糧不足，無法分給平民',u.x,u.y,u.id);return;}Lg.food-=kg;var days=kg/(pop*0.6);if(t==='S'){T.food=Math.min(40,(T.food||0)+days);T.hung=Math.max(0,T.hung-days*10);}else if(t==='R'){T.food=(T.food||0)+days;}else{T.food=(T.food||0)+days;}
    attAdd(g,side,clamp(4+days*3,4,18));var txt3=uName(u)+'把約 '+fmt(kg/1000,1)+' 噸糧食分給'+place+'的'+(t==='S'?'居民':t==='R'?'難民':'被拘留者')+'（約 '+fmt(days,1)+' 天口糧）';logE(side,'civ',txt3,u.x,u.y,u.id);civEv('civ',side,txt3,T.x,T.y,u.id,{dk:'give'});return;}
  if(a==='release'){if(t!=='D'||T.side!==side)return;civFree(T,uName(u)+'釋放');return;}
  if(a==='intern'){var n2=t==='S'?civPresent(T)*(L>=4?0.85:0.5):T.n*0.9;if(n2<1)return;var f=t==='S'?{m:T.men/civPresent(T),w:T.wom/civPresent(T),k:T.kid/civPresent(T),e:T.eld/civPresent(T)}:{m:T.m/T.n,w:T.w/T.n,k:T.k/T.n,e:T.e/T.n},q={m:n2*f.m,w:n2*f.w,k:n2*f.k,e:n2*f.e};civTake(T,t,q);var D2=civDet(side,T,t,q,'intern',u);D2.rel=0;
    if(g){g.unrest=clamp(g.unrest+40,0,100);g.hostT=G.t;attAdd(g,side,-55);}attNear(T.x,T.y,15000,side,-15);var txt4=uName(u)+'把'+place+'約 '+fmt(n2)+' 名平民（含婦女、兒童與老人）強制拘禁';logE(side,'civ','⚠ '+txt4,u.x,u.y,u.id);var e4=civEv('crime',side,txt4,T.x,T.y,u.id,{dk:'intern',v:n2,ord:true,wc:1});
    if(law.y0>=featY('hague')||featOn('gc1949')){warCrime(u,'intern',0,txt4,true);}u.mor=clamp(u.mor-4,0,100);if(G.press)pressOn(e4,u);civAftermath(u,T,'intern',n2);if(G.onPause&&apOn('crime'))G.onPause('對平民的違法行動');return;}
  if(a==='fire'){var fr2=strFrac(u),v;if(t==='S'){var zone=clamp(frontW(u)*350/(PI*Math.pow(T.r||400,2)),0.05,1),expo=clamp(0.3-0.22*(T.shel||0),0.06,0.3);v=Math.min(GR.n*0.6,GR.n*zone*expo*(0.2+0.15*rnd8())*fr2+2);}else v=Math.min(GR.n*0.5,(15+GR.n*0.1*(1+rnd8()))*fr2);if(t==='S')civCas(T,v,0.5,'mass',side);else refCas(T,v,0.55,'refshot',side);var dd=v*0.5;
    if(g){g.unrest=100;g.hostT=G.t;g.alarm=1;attAdd(g,side,-100);}attNear(T.x,T.y,20000,side,-35);var txt5=uName(u)+'奉命向'+place+'的'+(t==='S'?'居民':t==='R'?'難民隊伍':'被拘留者')+'開火，造成約 '+fmt(Math.max(1,dd))+' 人死亡、'+fmt(v-dd)+' 人受傷';logE(side,'civ','⚠ '+txt5,u.x,u.y,u.id);
    var e5=civEv('crime',side,txt5,T.x,T.y,u.id,{dk:t==='R'?'refshot':'mass',v:dd,ord:true,wc:1});warCrime(u,t==='R'?'refshot':'mass',dd,txt5,true);u.mor=clamp(u.mor-10,0,100);if(u.dis!==undefined)u.dis=clamp(u.dis-10,0,100);if(G.press)pressOn(e5,u);civAftermath(u,T,'fire',dd);
    /* 倖存者逃散 */if(t==='S'&&civPresent(T)>50){refSpawn(T,civPresent(T)*0.6);}if(G.onPause&&apOn('crime'))G.onPause('對平民的違法行動');return;}}
/* 從聚落或難民隊伍帶走一群人 */
function civTake(T,t,q){if(t==='S'){T.men=Math.max(0,T.men-q.m);T.wom=Math.max(0,T.wom-q.w);T.kid=Math.max(0,T.kid-q.k);T.eld=Math.max(0,T.eld-q.e);}else if(t==='R'){T.m=Math.max(0,T.m-q.m);T.w=Math.max(0,T.w-q.w);T.k=Math.max(0,T.k-q.k);T.e=Math.max(0,T.e-q.e);T.n=T.m+T.w+T.k+T.e;}}
/* 被拘留的民眾：留在原地或押往收容所；守法的一方審查後釋放，嚴酷的一方長期關押，死亡率依政策與補給 */
function civDet(side,T,t,q,kind,u){var C=G.civ;C.D=C.D||[];var D={id:(C.seq=(C.seq||0)+1),side:side,kind:kind,m:q.m,w:q.w,k:q.k,e:q.e,n:q.m+q.w+q.k+q.e,dead:0,from:t==='S'?T.i:T.from,fn:t==='S'?T.n:T.fn,x:T.x+(rnd8()-0.5)*300,y:T.y+(rnd8()-0.5)*300,st:'held',t0:G.t,by:u?u.id:0,pol:u?polOf(u,'civ'):polSide(side).civ,food:2};C.D.push(D);
  var camp=null,bd=40000;G.units.forEach(function(c){if(c.side!==side||!onMap(c)||!isLeaf(c))return;var fl=ST(c).fl;if(fl.indexOf('Q')<0&&fl.indexOf('R')<0)return;var d=dist(c.x,c.y,D.x,D.y);if(d<bd){bd=d;camp=c;}});if(camp&&kind==='intern'){D.camp=camp.id;D.st='move';var P=findPath({dom:'land',mobi:0,vr:3.5,vx:2,fl:''},D.x,D.y,camp.x,camp.y,{max:60000});D.path=P?P.pts:[D.x,D.y,camp.x,camp.y];D.pi=2;}return D;}
function civFree(D,why){var C=G.civ,g=C.S[D.from];D.st='free';if(g){g.men+=D.m;g.wom+=D.w;g.kid+=D.k;g.eld+=D.e;}logE(D.side,'civ',(why||'')+'被拘留的 '+fmt(D.n)+' 名平民獲釋（'+(D.fn||'')+'）',D.x,D.y);if(g&&D.side>=0)attAdd(g,D.side,D.kind==='detain'?3:5);}
function civDetStep(){var C=G.civ;if(!C||!C.D||!C.D.length)return;var h=600/3600;C.D.forEach(function(D){if(D.st!=='held'&&D.st!=='move')return;if(D.n<1){D.st='dead';return;}
    if(D.st==='move'&&D.path){if(walk(D,0.9*600)){D.st='held';var cp=uById(D.camp);if(cp&&alive(cp)){cp.ref=(cp.ref||0)+D.n;}}}
    /* 看守撤走、敵方部隊到達：獲得解放 */var gu=0,en=0,es=-1;gridNear(D.x,D.y,3000,function(u){if(!onMap(u)||ST(u).dom!=='land')return;if(u.side===D.side)gu++;else if(dist(u.x,u.y,D.x,D.y)<2000){en++;es=u.side;}});if(!gu&&en){civFree(D,G.sides[nSides()<3||!(es>=0)?enemyOf(D.side):es].name+'部隊抵達，');return;}if(!gu&&!en&&G.t-D.t0>6*3600&&rnd8()<0.02){civFree(D,'看守撤離，');return;}
    if(D.kind==='detain'&&D.rel&&G.t>=D.rel){civFree(D,'審查結束，');return;}
    var L=clamp(D.pol||0,0,5),aid=D.aidT&&G.t-D.aidT<48*3600,rate=[0.0003,0.0008,0.002,0.006,0.015,0.04][L]*(D.food>0?1:2.5)*(aid?0.5:1)*h/24*24/24,die=D.n*rate*h*24/24;D.food=Math.max(0,D.food-h/24);
    if(die>0){var f=die/D.n;D.m-=D.m*f;D.w-=D.w*f;D.k-=D.k*f;D.e-=D.e*f;D.n-=die;D.dead+=die;civStatAdd(D.side,die,0,0,0,'detain');if(D.dead>=10&&!D.dlog){D.dlog=1;logE(D.side,'civ','被拘禁的平民開始因虐待、疾病與飢餓死亡（'+(D.fn||'')+'）',D.x,D.y);}}});
  C.D=C.D.filter(function(D){return D.st==='held'||D.st==='move'||G.t-D.t0<24*3600;});}
/* 暴行之後：游擊活動、敵軍的憤怒、國際社會與援助團體的反應 */
function civAftermath(u,T,kind,v){var side=u.side,en=enemyOf(side);gridNear(T.x,T.y,10000,function(e){if((nSides()<3?e.side!==en:!hostile(side,e.side))||!onMap(e))return;e.mor=clamp(e.mor+4,0,100);if(typeof mfAdd==='function')mfAdd(e,'rage',4);});
  var S=SD(side);S.atroc=(S.atroc||0)+1;S.atrocT=G.t;(G.tp||[]).forEach(function(A){if((A.k==='aid'||A.k==='church')&&A.st!=='out'&&A.st!=='dead'){A.protest=(A.protest||0)+1;}});if(featOn('redcross')){var org=aidOrg();logE(-1,'civ',org+'譴責'+G.sides[side].name+'部隊對平民的暴行，要求停止並允許人道救援進入',T.x,T.y);G.tpSusp=G.tpSusp||sA0();G.tpSusp[side]=G.t+48*3600;}}
/* ---------- 引導疏散：部隊護送隊伍前往收容所或本方後方 ---------- */
function civGuideStart(u,o,T,t){var C=G.civ,Q=null;if(t==='S'){var n=Math.min(civPresent(T)*0.4,3000);if(n<20){o.ph='done';return;}var k0=C.R.length;refSpawn(T,n);Q=C.R[C.R.length-1];if(C.R.length===k0)Q=null;}else if(t==='R')Q=T;
  if(!Q){logE(u.side,'civ',uName(u)+'：沒有可以引導的民眾',u.x,u.y,u.id);u.ord=null;u.task='hold';return;}Q.esc=u.id;Q.side=u.side;Q.spd=Math.max(Q.spd,1.25*(2.6/3.6));refDest(Q);o.ph='esc';o.qid=Q.id;o.t1=G.t;var g=C.S[Q.from];attAdd(g,u.side,10);logE(u.side,'civ',uName(u)+'護送約 '+fmt(Q.n)+' 名民眾'+(Q.campF||Q.camp?'前往收容所':'往後方疏散'),u.x,u.y,u.id);civEv('civ',u.side,uName(u)+'護送約 '+fmt(Q.n)+' 名民眾離開'+placeTxt(Q.x,Q.y),Q.x,Q.y,u.id,{dk:'guide'});}
function civGuideStep(u,s,o){var Q=(G.civ.R||[]).filter(function(q){return q.id===o.qid;})[0];if(!Q||Q.st==='camp'||Q.st==='out'||Q.n<1||G.t-o.t1>8*3600){if(Q&&(Q.st==='camp'||Q.st==='out')){var g=G.civ.S[Q.from];attAdd(g,u.side,8);logE(u.side,'civ',uName(u)+'把民眾安全送到'+(Q.st==='camp'?'收容所':'後方'),u.x,u.y,u.id);}if(Q)Q.esc=0;u.ord=null;u.task='hold';return true;}
  if(dist(u.x,u.y,Q.x,Q.y)>500){if((G.step+u.id)%4===0||!u.path){var p=validPos(s,Q.x,Q.y);wantPath(u,p[0],p[1]);u.task='go';}if(u.path)moveStep(u,s,1);}return true;}
/* 收容所：援助團體或工兵設立的難民營優先 */
(function(){var b=refDest;refDest=function(Q){var F=null;if(G.fac&&Q.side!==undefined){var bd=45000;G.fac.forEach(function(f){if(f.k!=='camp'||f.dead||(f.pop||0)>=(f.cap||5000)*1.3)return;if(f.own>=0&&Q.side>=0&&f.own!==Q.side)return;var d=dist(f.x,f.y,Q.x,Q.y);if(d<bd&&enemyNear(Q.side>=0?Q.side:0,f.x,f.y,4000,'land')===0){bd=d;F=f;}});}
  if(F){Q.campF=F.id;Q.camp=0;Q.dest=[F.x,F.y];Q.rdT=G.t;var P=findPath({dom:'land',mobi:0,vr:3.5,vx:2,fl:''},Q.x,Q.y,F.x,F.y,{max:60000});if(P){Q.path=P.pts;Q.pi=2;Q.reach=true;return;}}Q.campF=0;return b(Q);};})();
(function(){var b=walk;walk=function(o,d){var r=b(o,d);if(r&&o.campF&&o.from!==undefined&&o.n!==undefined){var F=facById(o.campF);if(F&&!F.dead&&dist(o.x,o.y,F.x,F.y)<900){campIn(F,o);return false;}}return r;};})();
function campIn(F,Q){F.pop=(F.pop||0)+Q.n;var dm=F.dm||(F.dm={m:0,w:0,k:0,e:0});dm.m+=Q.m||0;dm.w+=Q.w||0;dm.k+=Q.k||0;dm.e+=Q.e||0;Q.st='camp';var C=G.civ;if(C.S[Q.from])C.S[Q.from].camp+=Q.n;if(Q.side>=0)C.cs[Q.side].shel+=Q.n;if(!F.inLog||G.t-F.inLog>3*3600){F.inLog=G.t;logE(Q.side,'ref','約 '+fmt(Q.n)+' 名難民進入「'+F.name+'」（現收容約 '+fmt(F.pop)+' 人）',F.x,F.y);}}
/* 難民營：擁擠、糧食、衛生；援助團體送來糧食與醫療 */
function campScale(F,f){F.pop*=f;if(F.dm)['m','w','k','e'].forEach(function(k){F.dm[k]*=f;});}
function campFacStep(){(G.fac||[]).forEach(function(F){if(F.k!=='camp'||F.dead||!(F.pop>0))return;var h=600/3600,cap=F.cap||5000,crowd=F.pop/cap;F.food=Math.max(0,(F.food===undefined?5:F.food)-h/24);var aid=F.aidT&&G.t-F.aidT<48*3600,d=(0.0003+(crowd>1?(crowd-1)*0.003:0)+(F.food<=0?0.004:0))*h/24*(aid?0.5:1);
  var dr=F.pop*d;if(dr>0){campScale(F,1-dr/F.pop);F.died=(F.died||0)+dr;campDead(dr);G.civ.byC=G.civ.byC||{};G.civ.byC.exposure=(G.civ.byC.exposure||0)+dr;}
  /* 每天約有 1% 的人離開（投靠親友、繼續往外地逃難） */var lv=F.pop*0.01*h/24;campScale(F,1-0.01*h/24);G.civ.out=(G.civ.out||0)+lv;if(crowd>1.2&&(!F.crLog||G.t-F.crLog>6*3600)){F.crLog=G.t;logE(-1,'ref','「'+F.name+'」嚴重超收（'+fmt(F.pop)+'／'+fmt(cap)+' 人），衛生與配給惡化',F.x,F.y);}});}
/* ---------- 第三方：國際援助團體（中立，救助所有人）、教會團體（在地庇護與救濟）；戰地記者見介面 ---------- */
var AIDORG=[[1863,1918,'國際紅十字委員會'],[1919,9999,'紅十字會與紅新月會'],[1943,1948,'聯合國善後救濟總署'],[1950,9999,'聯合國難民署'],[1961,9999,'世界糧食計畫署'],[1971,9999,'無國界醫生']];
var CHURCHN=[[0,'修道院救濟隊'],[1800,'教區慈善會'],[1878,'救世軍救濟隊'],[1897,'明愛救援隊'],[1940,'教會救援團']];
function aidOrg(r){var y=lgY(),L=AIDORG.filter(function(q){return y>=Math.max(q[0],q[0]===1863?featY('redcross'):0)&&y<=q[1];});return L.length?L[Math.floor((r||rnd8)()*L.length)][2]:'人道救援團體';}
function churchOrg(){var y=lgY(),n=CHURCHN[0][1];CHURCHN.forEach(function(q){if(y>=q[0])n=q[1];});return n;}
function tpNew(k,o){G.tp=G.tp||[];var A=Object.assign({id:(G.tpSeq=(G.tpSeq||0)+1),k:k,st:'go',t0:G.t,n:k==='aid'?10:6,hurt:0,food:0,med:0,pi:2},o||{});G.tp.push(A);return A;}
function tpHot(x,y,R){var hot=false;gridNear(x,y,R,function(u){if(hot||!onMap(u))return;if((G.t-(u.fired||-1e9)<1200||G.t-(u.uf||-1e9)<1200)&&dist(u.x,u.y,x,y)<R)hot=true;});return hot;}
function tpPath(A,x,y){var P=findPath({dom:'land',mobi:lgY()>=1914?3:2,vr:lgY()>=1914?30:5,vx:lgY()>=1914?10:3,fl:''},A.x,A.y,x,y,{max:60000});if(!P)return false;A.path=P.pts;A.pi=2;A.tx=x;A.ty=y;return true;}
/* 最需要援助的地方：飢餓、受傷、受困的難民、超收的收容所、被拘留的平民 */
function aidNeeds(){var C=G.civ,out=[],su=G.tpSusp||sA0();if(!C)return out;function ok(x,y,occ){return !(occ>=0&&su[occ]>G.t);}
  C.S.forEach(function(g){var p=civPresent(g);if(p<80)return;var sc=p*(g.hung/100+(G.t-g.hitT<6*3600?0.4:0))+Math.min(g.wnd||0,p)*2;if(sc>200&&ok(g.x,g.y,g.occ))out.push({k:'S',id:g.i,x:g.x,y:g.y,sc:sc,nm:g.n});});
  C.R.forEach(function(Q){if(!(Q.st==='trap'||Q.st==='stop')||Q.n<100)return;out.push({k:'R',id:Q.id,x:Q.x,y:Q.y,sc:Q.n*(Q.food<=0?1.5:0.6),nm:'受困的難民'});});
  (G.fac||[]).forEach(function(F){if(F.k!=='camp'||F.dead||!(F.pop>50))return;out.push({k:'F',id:F.id,x:F.x,y:F.y,sc:F.pop*((F.food||0)<2?1:0.3),nm:F.name});});
  (C.D||[]).forEach(function(D){if((D.st!=='held'&&D.st!=='move')||D.n<30||(D.pol||0)>=4)return;out.push({k:'D',id:D.id,x:D.x,y:D.y,sc:D.n*0.8,nm:'被拘留的平民'});});
  return out.filter(function(q){return !(G.tp||[]).some(function(A){return A.k==='aid'&&A.tg&&A.tg.k===q.k&&A.tg.id===q.id&&A.st!=='out'&&A.st!=='dead';});}).sort(function(a,b){return b.sc-a.sc;});}
function aidEntry(x,y){var MP=G.map,e0=SD(0).edge||'W',e1=SD(1).edge||'E',m=MP.cs*3,C=[];['N','S','W','E'].forEach(function(e){if(e===e0||e===e1)return;C.push(e==='W'?[m,clamp(y,m,MP.Hm-m)]:e==='E'?[MP.Wm-m,clamp(y,m,MP.Hm-m)]:e==='N'?[clamp(x,m,MP.Wm-m),m]:[clamp(x,m,MP.Wm-m),MP.Hm-m]);});if(!C.length)C=[[clamp(x,m,MP.Wm-m),m],[clamp(x,m,MP.Wm-m),MP.Hm-m]];return C.sort(function(a,b){return dist(a[0],a[1],x,y)-dist(b[0],b[1],x,y);})[0];}
function tpStep(){if(!G.civ||!G.started)return;G.tp=G.tp||[];var y=lgY();
  /* 每 30 分鐘：派出援助隊；教會團體在需要的聚落出動 */if(G.step%60===37){if(featOn('redcross')){var act=G.tp.filter(function(A){return A.k==='aid'&&A.st!=='out'&&A.st!=='dead';}).length,cap=clamp(Math.round(civPresent()/60000)+1,1,5);if(act<cap){var N=aidNeeds()[0];if(N&&N.sc>300){var e=aidEntry(N.x,N.y),A=tpNew('aid',{org:aidOrg(),x:e[0],y:e[1],home:e,tg:{k:N.k,id:N.id},food:y<1914?8:25,med:y<1914?1:3,n:y<1914?6:10});if(!tpPath(A,N.x,N.y)){A.st='dead';}else logE(-1,'aid',A.org+'的救援隊進入戰區，前往'+N.nm+'（'+placeTxt(N.x,N.y)+'）',A.x,A.y);}}}
    (G.fac||[]).forEach(function(F){if(F.k!=='church'||F.dead)return;var g=G.civ.S.filter(function(q){return q.n===F.set;})[0];if(!g||civPresent(g)<80)return;var busy=G.tp.some(function(A){return A.k==='church'&&A.fac===F.id&&A.st!=='out'&&A.st!=='dead';});if(busy)return;var refN=0;G.civ.R.forEach(function(Q){if((Q.st==='go'||Q.st==='stop'||Q.st==='trap')&&dist(Q.x,Q.y,F.x,F.y)<5000)refN+=Q.n;});
      if(g.hung>35||g.alarm>0.5||refN>200||G.t-g.hitT<6*3600){tpNew('church',{org:churchOrg(),x:F.x,y:F.y,home:[F.x,F.y],fac:F.id,g:g.i,st:'work',n:6,food:1});logE(-1,'aid',F.name+'的'+churchOrg()+'開放教堂庇護居民、為難民供應飲食',F.x,F.y);}});}
  G.tp.forEach(function(A){if(A.st==='dead'||A.st==='gone')return;if(A.k==='aid')aidOne(A);else if(A.k==='church')churchOne(A);});G.tp=G.tp.filter(function(A){return A.st!=='gone'&&!(A.st==='dead'&&G.t-(A.tD||A.t0)>6*3600);});}
function tpMove(A,kmh){if(!A.path)return true;var d=kmh/3.6*DT,P=A.path;while(d>0&&A.pi<P.length){var tx=P[A.pi],ty=P[A.pi+1],dd=dist(A.x,A.y,tx,ty);if(dd<=d){A.x=tx;A.y=ty;d-=dd;A.pi+=2;}else{A.hd=Math.atan2(ty-A.y,tx-A.x);A.x+=(tx-A.x)/dd*d;A.y+=(ty-A.y)/dd*d;d=0;}}if(A.pi>=P.length){A.path=null;return true;}return false;}
function aidTgt(A){var C=G.civ,t=A.tg;if(!t)return null;if(t.k==='S')return C.S[t.id]||null;if(t.k==='R')return C.R.filter(function(Q){return Q.id===t.id;})[0]||null;if(t.k==='F')return facById(t.id);if(t.k==='D')return (C.D||[]).filter(function(D){return D.id===t.id;})[0]||null;return null;}
function aidOne(A){var spd=lgY()>=1914?25:5,T=aidTgt(A);
  if(A.st==='out'){if(!A.path)tpPath(A,A.home[0],A.home[1]);if(tpMove(A,spd))A.st='gone';return;}
  /* 交戰區：停在 3 公里外等待 */if((G.step+A.id)%4===0){var hot=!(A.esc>G.t)&&tpHot(A.x,A.y,2500);if(hot&&A.st!=='wait'){A.st0=A.st;A.st='wait';A.wT=G.t;var ec=null;gridNear(A.x,A.y,2500,function(u){if(!ec&&onMap(u)&&G.t-(u.fired||-1e9)<1200)ec=u;});if(ec){var a=Math.atan2(A.y-ec.y,A.x-ec.x),p=validPos({dom:'land'},A.x+Math.cos(a)*3000,A.y+Math.sin(a)*3000);tpPath(A,p[0],p[1]);}if(!A.wLog||G.t-A.wLog>3*3600){A.wLog=G.t;logE(-1,'aid',A.org+'的救援隊因附近交戰暫停行動',A.x,A.y);}}
    else if(!hot&&A.st==='wait'&&G.t-A.wT>1800){A.st=A.st0||'go';if(T)tpPath(A,T.x,T.y);}}
  if(A.st==='wait'){tpMove(A,spd);if(G.t-A.wT>12*3600){A.st='out';A.path=null;}return;}
  if(!T||(A.tg.k==='S'&&civPresent(T)<20)||(A.tg.k==='R'&&(T.n<20||T.st==='camp'||T.st==='out'))||(A.tg.k==='F'&&T.dead)||(A.tg.k==='D'&&T.st!=='held'&&T.st!=='move')){var N=aidNeeds().filter(function(q){return dist(q.x,q.y,A.x,A.y)<25000;})[0];if(N&&(A.food>1||A.med>0.3)){A.tg={k:N.k,id:N.id};tpPath(A,N.x,N.y);A.st='go';}else{A.st='out';A.path=null;}return;}
  if(A.st==='go'){if(A.tg.k==='R'&&(G.step+A.id)%8===0)tpPath(A,T.x,T.y);if(tpMove(A,spd)||dist(A.x,A.y,T.x,T.y)<600){A.st='work';A.wk=G.t;}return;}
  if(A.st==='work'){if(G.t-A.wk<3*3600)return;aidGive(A,T);var refN=0;G.civ.R.forEach(function(Q){if((Q.st==='go'||Q.st==='stop'||Q.st==='trap')&&dist(Q.x,Q.y,A.x,A.y)<20000)refN+=Q.n;});
    if(refN>600&&!(G.fac||[]).some(function(F){return F.k==='camp'&&!F.dead&&dist(F.x,F.y,A.x,A.y)<15000;}))campNew(A);var N2=aidNeeds().filter(function(q){return dist(q.x,q.y,A.x,A.y)<25000;})[0];if(N2&&(A.food>1||A.med>0.3)){A.tg={k:N2.k,id:N2.id};tpPath(A,N2.x,N2.y);A.st='go';}else{A.st='out';A.path=null;}}}
function aidGive(A,T){var k=A.tg.k,f=Math.min(A.food,k==='D'?4:k==='F'?12:8),m=Math.min(A.med,1.5),txt='';A.food-=f;A.med-=m;
  if(k==='S'){var p=Math.max(1,civPresent(T));T.food=Math.min(40,(T.food||0)+f*1000/(p*0.6));T.hung=Math.max(0,T.hung-20);T.aidT=G.t;T.unrest=Math.max(0,T.unrest-5);txt='送糧 '+fmt(f,1)+' 噸、醫療物資 '+fmt(m,1)+' 噸到'+T.n;}
  else if(k==='R'){T.food=(T.food||0)+f*1000/(Math.max(1,T.n)*0.6);T.aidT=G.t;txt='救助受困的難民（約 '+fmt(T.n)+' 人）';}else if(k==='F'){T.food=(T.food||0)+f*1000/(Math.max(1,T.pop)*0.6);T.aidT=G.t;txt='補給'+T.name;}else if(k==='D'){T.food=(T.food||0)+f*1000/(Math.max(1,T.n)*0.6);T.aidT=G.t;txt='探視被拘留的平民（約 '+fmt(T.n)+' 人），記錄拘禁狀況';}
  logE(-1,'aid',A.org+'：'+txt,A.x,A.y);civEv('aid',-1,A.org+txt,A.x,A.y,0,{dk:'aid'});G.civ.aidT=(G.civ.aidT||0)+f+m;}
function campNew(A){var p=validPos({dom:'land'},A.x+(rnd8()-0.5)*2000,A.y+(rnd8()-0.5)*2000),id=(G.fac||[]).reduce(function(m,f){return Math.max(m,f.id);},0)+1,F={id:id,k:'camp',x:p[0],y:p[1],name:A.org+'難民營',set:'',own:-1,cand:-1,ct:0,kn:sAV(-1),st0:{food:0,ammo:0,fuel:0,fod:0},hp:100,cap:6000,pop:0,food:6,org:A.org,built:1,t0:G.t};G.fac.push(F);logE(-1,'aid',A.org+'在'+placeTxt(p[0],p[1])+'設立難民營（可收容約 6000 人）',p[0],p[1]);
  G.civ.R.forEach(function(Q){if((Q.st==='go'||Q.st==='stop'||Q.st==='trap')&&dist(Q.x,Q.y,p[0],p[1])<30000){if(Q.st==='trap'||Q.st==='stop')Q.st='go';refDest(Q);}});}
function churchOne(A){var F=facById(A.fac),C=G.civ,g=C.S[A.g];if(!F||F.dead||!g){if(A.st!=='dead'){A.st='gone';}return;}
  if((G.step+A.id)%20!==0)return;var h=600/3600;g.shel=clamp((g.shel||0)+0.03,0,1);if(g.hung>20)g.hung=Math.max(0,g.hung-0.6);g.food=Math.min(40,(g.food||0)+0.03);
  C.R.forEach(function(Q){if((Q.st==='go'||Q.st==='stop'||Q.st==='trap')&&dist(Q.x,Q.y,F.x,F.y)<3000){Q.food=Math.max(Q.food||0,0.5);}});
  /* 在教堂附近走動，照顧避難者與過路的難民 */var a=rnd8()*2*PI,r=200+rnd8()*600;A.x=F.x+Math.cos(a)*r;A.y=F.y+Math.sin(a)*r;void h;
  if(civPresent(g)<40||g.hung<10&&g.alarm<0.3&&G.t-g.hitT>12*3600)A.st='gone';}
/* 砲火波及第三方人員 */
function tpAreaHit(x,y,R,side,src){(G.tp||[]).forEach(function(A){if(A.st==='dead'||A.st==='gone')return;var d=dist(A.x,A.y,x,y);if(d>R+100)return;if(rnd8()>0.35)return;var k=Math.min(A.n,1+Math.floor(rnd8()*3));A.n-=k;A.hurt+=k;G.civ.aidK=(G.civ.aidK||0)+k;var nm=A.org+(A.k==='aid'?'的救援隊':'');
    logE(-1,'aid',nm+'在'+placeTxt(A.x,A.y)+'遭'+(src?G.sides[src.side].name+'的':'')+'砲火波及，'+k+' 人傷亡',A.x,A.y);civEv('aid',src?src.side:-1,nm+'在'+placeTxt(A.x,A.y)+'遭砲火波及，'+k+' 人傷亡',A.x,A.y,src?src.id:0,{dk:'aidhit',v:k});
    if(A.n<=2){A.st=A.k==='aid'?'out':'gone';A.path=null;}});}
(function(){var b=facHit;facHit=function(x,y,R,pow,side,cause,src){b(x,y,R,pow,side,cause,src);if(G.tp&&G.tp.length&&pow>=3)tpAreaHit(x,y,R,side,src);};})();

/* ===================== 五、工兵設施：簡易港口、簡易機場、補給站、野戰醫院、野戰油庫、野戰彈庫、難民收容營 ===================== */
Object.assign(BLD,{sport:['簡易港口',8],sair:['簡易機場',14],fhosp:['野戰醫院',4],fuel:['野戰油庫',4],ammoD:['野戰彈庫',4],camp:['難民收容營',5]});
function eraI(){var y=lgY(),E=ERA[0];ERA.forEach(function(e){if(!e.fan&&y>=e.y0)E=e;});return E.i;}
function stripOK(cx,cy,t,L){var MP=G.map,cs=MP.cs,OPEN={},stp=Math.max(cs*0.7,60);['field','mead','scrub','desert','tund','hedge','sand','burnt'].forEach(function(n){if(LCI[n]!==undefined)OPEN[LCI[n]]=1;});var e0=MP.el[cellAt(cx,cy)],dx=Math.cos(t),dy=Math.sin(t);
  for(var s=-L/2;s<=L/2;s+=stp)for(var w=-40;w<=40;w+=40){var px=cx+dx*s-dy*w,py=cy+dy*s+dx*w,X=Math.floor(px/cs),Y=Math.floor(py/cs);if(X<1||Y<1||X>=MP.GW-1||Y>=MP.GH-1)return false;var k=Y*MP.GW+X;if(!OPEN[MP.lc[k]]||MP.rv[k]||MP.ft[k]>=4||(MP.rl[k]&1))return false;if(Math.abs(MP.el[k]-e0)>15)return false;}return true;}
function sairSite(x,y){var L=lgY()<1930?400:lgY()<1950?900:1200,best=null,bd=1e18;for(var r=0;r<=2500;r+=250)for(var a=0;a<(r?16:1);a++){var ang=a/16*2*PI,cx=x+Math.cos(ang)*r,cy=y+Math.sin(ang)*r;for(var o=0;o<8;o++){var t=o/8*PI;if(stripOK(cx,cy,t,L)){var d=r;if(d<bd){bd=d;best=[cx,cy,t,L];}}}if(best&&r>=500)break;}return best;}
function sportSite(x,y){var MP=G.map,GW=MP.GW,GH=MP.GH,cs=MP.cs,k0=cellAt(x,y),gx=k0%GW,gy=(k0/GW)|0,R=Math.ceil(1500/cs),best=null,bd=1e9;for(var dy=-R;dy<=R;dy++)for(var dx=-R;dx<=R;dx++){var X=gx+dx,Y=gy+dy;if(X<1||Y<1||X>=GW-1||Y>=GH-1)continue;var k=Y*GW+X;if(isWater(MP.lc[k]))continue;var wet=false;for(var d=0;d<8&&!wet;d++){var q=(Y+[0,1,1,1,0,-1,-1,-1][d])*GW+X+[1,1,0,-1,-1,-1,0,1][d];if(navOK(2,q))wet=true;}if(wet&&dx*dx+dy*dy<bd){bd=dx*dx+dy*dy;best=[(X+0.5)*cs,(Y+0.5)*cs];}}return best;}
var BLD8={sport:1,sair:1,fhosp:1,fuel:1,ammoD:1,camp:1};
/* 開工前檢查地點 */
(function(){var b=engAct;engAct=function(u,o){if(o.k==='build'&&BLD8[o.bk]&&isEng(u)){var x=o.x!==undefined?o.x:u.x,y=o.y!==undefined?o.y:u.y;
    if(o.bk==='sport'){var p=sportSite(x,y);if(!p){logE(u.side,'eng',uName(u)+'：目標 1.5 公里內沒有可以泊靠船隻的岸邊，無法構築簡易港口',u.x,u.y,u.id);u.task='hold';return true;}o.x=p[0];o.y=p[1];}
    else if(o.bk==='sair'){if(!featOn('airfield')){logE(u.side,'eng',uName(u)+'：這個年代還沒有飛機',u.x,u.y,u.id);u.task='hold';return true;}var q=sairSite(x,y);if(!q){logE(u.side,'eng',uName(u)+'：目標附近沒有夠長、夠平坦的開闊地可以闢建跑道',u.x,u.y,u.id);u.task='hold';return true;}o.x=q[0];o.y=q[1];o.ang=q[2];o.len=q[3];}}
  return b(u,o);};})();
(function(){var b=buildApply;buildApply=function(u,o){var kind=o.bk;if(!BLD8[kind])return b(u,o);var side=u.side,x=o.x,y=o.y,i=eraI(),nm={sport:'簡易港口',sair:'野戰機場',fhosp:'野戰醫院',fuel:'野戰油庫',ammoD:'野戰彈庫',camp:'難民收容營'}[kind],seq=(G.lgSeq||0)+1,name=nm+' '+seq;
  var fid=(G.fac||[]).reduce(function(m,f){return Math.max(m,f.id);},0)+1,F={id:fid,k:kind==='sport'?'port':kind==='sair'?'air':kind==='fhosp'?'hosp':kind==='fuel'?'tank':kind==='ammoD'?'ammo':'camp',x:x,y:y,name:name,set:'',own:side,cand:-1,ct:0,kn:[side,-1],st0:{food:0,ammo:0,fuel:0,fod:0},hp:100,built:1,field:1,t0:G.t};
  if(kind==='sair'){F.ang=o.ang||0;F.len=o.len||900;}if(kind==='fhosp')F.beds=lgY()<1900?60:lgY()<1950?150:250;if(kind==='camp'){F.cap=4000;F.pop=0;F.food=3;F.own=side;}G.fac=G.fac||[];G.fac.push(F);
  if(kind==='sport')addNode(side,'port',x,y,{name:name,fac:fid,thr:Math.round((THR.port[i]||800)*0.25),cap:4000});else if(kind==='sair')addNode(side,'air',x,y,{name:name,fac:fid,thr:Math.round((THR.air[i]||100)*0.3),cap:2500});
  else if(kind==='fuel')addNode(side,'depot',x,y,{name:name,fac:fid,only:'fuel',sub:'tank',cap:2000,st:{food:0,ammo:0,fuel:0,fod:0}});else if(kind==='ammoD')addNode(side,'depot',x,y,{name:name,fac:fid,only:'ammo',sub:'ammo',cap:2000,st:{food:0,ammo:0,fuel:0,fod:0}});
  if(kind==='sair'&&o.ang!==undefined){var MP=G.map,ks=[],dx=Math.cos(o.ang),dy=Math.sin(o.ang);for(var s=-F.len/2;s<=F.len/2;s+=MP.cs*0.6){var k=cellAt(x+dx*s,y+dy*s);if(MP.lc[k]!==LCI.burnt&&!isUrban(MP.lc[k])){MP.ft[k]=0;ks.push(k);}}if(ks.length)mapChanged(ks);}
  G.lgSeq=seq;u.ent=Math.max(u.ent,0.5);logE(side,'eng',uName(u)+'完成構築'+nm+'「'+name+'」（'+placeTxt(x,y)+'）',x,y,u.id);};})();
/* 醫院與野戰醫院：收治本方傷兵（降低傷重不治、加快歸隊）；醫院被砲擊時病患一起受害 */
function hospStep(){var y=lgY(),base=(y<1850?0.006:y<1914?0.004:y<1940?0.0025:y<1970?0.0012:0.0006)/6;(G.fac||[]).forEach(function(F){if(F.k!=='hosp'||F.dead)return;var side=F.own;if(!(side>=0&&side<nSides()))return;var S=medStat(side),beds=F.beds||200,cap=beds/144*(F.hp/100),used=0;F.pat=F.pat||[];
    G.units.forEach(function(u){if(u.side!==side||!(u.wia>0.05)||used>=cap)return;if(dist(u.x,u.y,F.x,F.y)>(F.field?15000:25000))return;var take=Math.min(u.wia,cap-used);used+=take;u.wia-=take;F.pat.push({u:u.id,n:take,t:G.t});if(typeof medHosp==='function')medHosp(side,take);});
    var keep=[],occ=0;F.pat.forEach(function(p){var d=p.n*base*(F.hp<50?2:1);p.n-=d;S.dow+=d;if(G.t-p.t>(y<1914?96:60)*3600){var u=uById(p.u),rt=p.n*0.45;if(u&&alive(u)&&u.st!=='off'){u.men=Math.min(u.men0,u.men+rt);S.rtd+=rt;}p.n=0;}if(p.n>0.05){keep.push(p);occ+=p.n;}});F.pat=keep.slice(-400);F.occ=occ;});}
/* 醫院中彈：病患與醫護人員傷亡 */
(function(){var b=facDestroy;facDestroy=function(F,side,cause,src){if(F.k==='hosp'&&F.pat&&F.pat.length&&F.own>=0){var S=medStat(F.own),n=0;F.pat.forEach(function(p){n+=p.n;});S.dow+=n*0.4;logE(F.own,'boom','「'+F.name+'」被摧毀，約 '+fmt(n*0.4)+' 名傷患喪生',F.x,F.y);F.pat=[];}if(F.k==='camp'&&F.pop>0){var v=F.pop*0.08;civStatAdd(side,v*0.5,v*0.5,v*0.2,v*0.2,'art');G.civ.kill=(G.civ.kill||0);logE(-1,'ref','「'+F.name+'」遭砲火摧毀，約 '+fmt(v)+' 名難民死傷，倖存者四散逃離',F.x,F.y);G.civ.out=(G.civ.out||0)+Math.max(0,F.pop-v);campScale(F,0);}return b(F,side,cause,src);};})();
/* 爆破設施（拒止敵軍使用）與修復設施 */
function facWork(u,o){var F=o.fac?facById(o.fac):null;if(!F||F.dead&&o.k==='facdemo'){logE(u.side,'eng',uName(u)+'：目標設施已不存在',u.x,u.y,u.id);u.ord=null;u.task='hold';return true;}var s=ST(u);
  if(o.ph==='go'){if(dist(u.x,u.y,F.x,F.y)>facR(F)+250)return false;o.ph='work';o.t1=G.t;o.need=(o.k==='facdemo'?(isEng(u)?1800:3600):(F.dead?6:2)*3600*(1-(F.hp||0)/150))*(hasQ(offOf(u),'sapper')?0.67:1);u.task='work2';u.path=null;logE(u.side,'eng',uName(u)+'開始'+(o.k==='facdemo'?'爆破':'修復')+FACN[F.k]+'「'+F.name+'」，預計 '+durTxt(o.need),u.x,u.y,u.id);return true;}
  if(o.ph==='work'){var uf=G.t-(u.uf||-1e9)<120;o.prog=(o.prog||0)+DT*(uf?0.3:1)*Math.max(0.35,strFrac(u));if(o.prog<o.need)return true;
    if(o.k==='facdemo'){if(F.own>=0&&F.own!==u.side&&enemyNear(u.side,F.x,F.y,1000,'land')>0){logE(u.side,'eng',uName(u)+'：設施仍在敵軍控制下，爆破失敗',u.x,u.y,u.id);}else{logE(u.side,'eng',uName(u)+'爆破'+FACN[F.k]+'「'+F.name+'」',F.x,F.y,u.id);facDestroy(F,u.side,'demo',u);}}
    else{F.hp=100;if(F.dead){F.dead=0;F.burn=0;if(F.own===u.side||F.own<0){var D=FAC8[F.k];if(D&&D.node||F.k==='port'||F.k==='air'||F.k==='rail'||F.k==='depot'){F.own=-1;facTake(F,u.side,true);}}}logE(u.side,'eng',uName(u)+'修復'+FACN[F.k]+'「'+F.name+'」',F.x,F.y,u.id);}
    u.ord=null;u.task='hold';return true;}return false;}

/* ===================== 六、AI：評估部隊的需求與地區的吞吐量，優先奪取與目標相連的交通與補給設施 =====================
   需求：本方每日需要的糧秣、彈藥、燃料、草料（噸）；吞吐量：港口、車站、機場的進貨量加上車隊從後方運補的能力。
   設施的價值＝吞吐量或存量 ×（是否連得回本方後方）×（離尚未取得的目標多近）×（本方是否正缺這類物資）。 */
function thrNeed(side){var d=sideDemand(side);d.tot=d.food+d.ammo+d.fuel+d.fod;return d;}
function thrCap(side){var c=0,m=lgRoadMode();nodesOf(side).forEach(function(N){if(N.status==='captured'||N.k==='off')return;if(N.k==='port'||N.k==='rail'||N.k==='air'){if(nodeOK(N)&&(N.k!=='air'||featOn('airlift')))c+=N.thr;return;}
    if(N.k==='depot'&&!N.noUp&&N.cv){var U=upOf(N);if(!U)return;var d=dist(U.x,U.y,N.x,N.y)/1000,trip=2*d/lgSpd(m)+1;c+=N.cv.n*lgPay(m)*24/Math.max(2,trip)*0.5;}});
  /* 補給部隊自己的車輛（約每天往返四趟） */G.units.forEach(function(u){if(u.side===side&&onMap(u)&&isLeaf(u)&&ST(u).fl.indexOf('l')>=0&&u.lg)c+=(u.lg.pay||0)*4;});return c;}
function thrPic(side){var S=SD(side);if(S.thr&&G.t-S.thr.t<3600)return S.thr;var need=thrNeed(side),cap=thrCap(side),fu=0,fn=0;G.units.forEach(function(u){if(u.side!==side||!onMap(u)||!isLeaf(u)||!fuelDep(u)||ST(u).dom!=='land')return;fu+=fuelQ(u);fn++;});
  S.thr={t:G.t,need:need,cap:cap,r:need.tot>0?cap/need.tot:9,fuel:fn?fu/fn:1};return S.thr;}
function facVal(F,side){if(F.dead||F.own===side)return 0;var k=F.k,i=eraI(),v=0;if(k==='port'){v=(THR.port[i]||800)/500;var pw=portWater({x:F.x,y:F.y});if(!pw)v*=0.2;}
  else if(k==='rail'){v=(THR.rail[i]||0)/500;if(!railToEdge(cellAt(F.x,F.y),SD(side).edge||'W'))v*=0.15;}else if(k==='air'){v=featOn('airlift')?(THR.air[i]||0)/400:0.3;}
  else if(k==='depot'||k==='tank'||k==='gas'||k==='ammo'){v=lgSum(facSt(F))/150;}else return 0;var T=thrPic(side);if(k==='tank'||k==='gas')v*=T.fuel<0.4?2.2:T.need.fuel>0.5?1.3:0.5;if(k==='ammo')v*=1.3;if(T.r<1)v*=1.5;
  var obs=(G.obj||[]).filter(function(o){return objTgt(side,o);}),dmin=obs.length?Math.min.apply(null,obs.map(function(o){return dist(o.x,o.y,F.x,F.y);})):30000;v*=1+1.5*clamp(1-dmin/25000,0,1);if(nSides()<3?F.own===enemyOf(side):hostile(side,F.own))v*=1.2;return v;}
function actThr(X){var side=X.side,F0=X.F;if(G.t-(F0.thrT||-1e9)<2*3600||!G.fac)return false;var C=cOf(F0)||[F0.x,F0.y],T=thrPic(side),thr=Math.max(0.5,1.6-(X.P.logi||0.5)-(T.r<1?0.4:0)-(T.fuel<0.4?0.4:0)),best=null,bs=0;
  G.fac.forEach(function(F){var v=facVal(F,side);if(v<=0.3)return;var d=dist(F.x,F.y,C[0],C[1]);if(d>30000)return;if(G.units.some(function(u){return u.side===side&&alive(u)&&u.ord&&u.ord.fac8===F.id;}))return;var en=enemyNear(side,F.x,F.y,3000,'land'),sc=v/(1+d/8000)/(1+en/500);if(sc>bs){bs=sc;best=F;}});
  if(!best||bs<thr)return false;var g=X.man.filter(function(q){return !busyF(q)&&q!==X.res&&aiControls(q);}).sort(function(a,b){var ca=cOf(a)||[a.x,a.y],cb=cOf(b)||[b.x,b.y];return dist(ca[0],ca[1],best.x,best.y)-dist(cb[0],cb[1],best.x,best.y);})[0];if(!g)return false;
  var en2=enemyNear(side,best.x,best.y,3000,'land'),k=en2>0?'attack':'move';if(!aiOrder(X,g,k,{x:best.x,y:best.y,opt:k==='attack'?aiOpts(g,'attack',{}):{}}))return false;if(g.ord)g.ord.fac8=best.id;F0.thrT=G.t;
  aiSay(X,'吞吐量評估：需求每日約 '+fmt(T.need.tot)+' 噸、運能約 '+fmt(T.cap)+' 噸'+(T.fuel<0.5?'、機械化部隊平均油料 '+Math.round(T.fuel*100)+'%':'')+'。'+FACN[best.k]+'「'+best.name+'」與目標相連、價值高，派'+uName(g)+(k==='attack'?'奪取':'進佔'));return true;}
/* 截斷敵軍補給：游擊型與智謀型襲擊被發現的敵方運輸車隊 */
function actInterdict(X){var side=X.side,seen=(G.lgv||[]).filter(function(V){if(V.side===side||LGM[V.m].air||LGM[V.m].dom==='sea')return false;var s=false;gridNear(V.x,V.y,3500,function(u){if(!s&&u.side===side&&onMap(u))s=true;});return s;});if(!seen.length)return false;var n=0;
  X.man.forEach(function(g){if(n>=1||busyF(g)||!aiControls(g))return;var C=cOf(g);if(!C)return;var V=seen.slice().sort(function(a,b){return dist(C[0],C[1],a.x,a.y)-dist(C[0],C[1],b.x,b.y);})[0];if(dist(C[0],C[1],V.x,V.y)>12000)return;issue(g,'ambush',{x:V.x,y:V.y});n++;aiSay(X,'發現敵軍'+LGM[V.m].n+'，派'+uName(g)+'在'+placeTxt(V.x,V.y)+'附近伏擊補給線');});return n>0;}
(function(){var b=aiTree;aiTree=function(t){var T=b(t),thr=BQ('奪取交通與補給設施',BC('有與目標相連的高價值設施',function(X){return !!G.fac&&X.lvl>0;}),BA('評估吞吐量並派兵奪取',actThr)),itd=BQ('截斷敵軍補給',BC('發現敵軍運輸車隊',function(X){return (X.P.t==='gue'||X.P.t==='smart'||X.P.flank>0.7)&&(G.lgv||[]).length>0;}),BA('伏擊補給線',actInterdict));
  var i=T.c.map(function(c){return c.n;}).indexOf('攻擊突破口');if(t==='logi'){var j=T.c.map(function(c){return c.n;}).indexOf('補給優先');T.c.splice(j>=0?j+1:1,0,thr);}else if(t!=='cons'&&t!=='reck'){T.c.splice(i>=0?i:T.c.length-1,0,thr);}
  if(t==='gue'||t==='smart'){var r=T.c.map(function(c){return c.n;}).indexOf(t==='gue'?'襲擾':'攻擊突破口');T.c.splice(r>=0?r:T.c.length-1,0,itd);}return T;};})();
/* 油料吃緊時，AI 暫緩深遠的機動、先建立補給站 */
(function(){var b=aiAssess;aiAssess=function(side,F,groups,aoi){var X=b(side,F,groups,aoi);var T=thrPic(side);X.thr=T;if(T.fuel<0.25&&X.post==='attack'&&X.P.agg<0.85&&X.ratio<2.5){X.post='defend';X.trace.push(['油料不足，暫緩進攻','S']);}if(T.r<0.6&&X.oos<0.3)X.oos=Math.max(X.oos,0.31);return X;};})();

/* ===================== 七、接線：命令、每步流程、開戰初始化 ===================== */
function v8Act(u,o){var k=o.k,s=ST(u);
  if(k==='refit'){if(s.dom==='air'){u.base=lgEdge(u.side,u.x,u.y);u.baseU=0;if(u.st!=='air'){u.st='air';u.fuel=u.fuel||endOf(s);}u.task='rtb';u.path={pts:[u.x,u.y,u.base[0],u.base[1]],i:2};logE(u.side,'refit',uName(u)+'轉場到地圖外的後方基地整補',u.x,u.y,u.id);return true;}
    var p=s.dom==='sea'||s.dom==='sub'?(seaEdge(u.side,u.x,u.y)||refitPt(u)):refitPt(u);activate(u,newOrder('move',{x:p[0],y:p[1],dk:'refit',why:o.why||'',opt:{pace:'rush',road:1}}));return true;}
  if(k==='civ')return civAct(u,o);
  if(k==='facdemo'||k==='repair'){var F=o.fac?facById(o.fac):facNear(o.x!==undefined?o.x:u.x,o.y!==undefined?o.y:u.y,1500,function(Q){return k==='repair'||!Q.dead;});if(!F){logE(u.side,'eng',uName(u)+'：目標附近找不到設施',u.x,u.y,u.id);u.task='hold';u.ord=null;return true;}
    if(k==='repair'&&!isEng(u)){logE(u.side,'eng',uName(u)+'不是工兵，無法修復設施',u.x,u.y,u.id);u.task='hold';u.ord=null;return true;}o.fac=F.id;o.ph='go';var p2=validPos(s,F.x,F.y);if(dist(u.x,u.y,p2[0],p2[1])<facR(F)+200){u.task='at';u.path=null;}else{u.task='go';wantPath(u,p2[0],p2[1]);}return true;}
  return false;}
function v8Leaf(u,s){var o=u.ord;if(!o)return false;if(o.k==='civ'&&o.opt)return civLeaf(u,s,o);if((o.k==='facdemo'||o.k==='repair')&&o.ph)return facWork(u,o);return false;}
(function(){var b=v4Act;v4Act=function(u,o){if(v8Act(u,o))return true;return b(u,o);};})();
(function(){var b=v4Leaf;v4Leaf=function(u,s){if(v8Leaf(u,s))return true;return b(u,s);};})();
/* 編制層級的命令：撤出休整交給所有下屬；對平民、爆破、修復交給最合適的一個單位 */
(function(){var b=planOrder;planOrder=function(F,o){var k=o.k;if(k==='refit')return leavesOf(F).filter(function(u){return alive(u)&&onMap(u);}).map(function(u){return [u,newOrder('refit',{why:o.why,sub:1})];});
  if(k==='civ'||k==='facdemo'||k==='repair'){var L=leavesOf(F).filter(onMap),pick=k!=='civ'?L.filter(isEng)[0]:null,bd=1e18;if(!pick)L.forEach(function(u){if(ST(u).dom!=='land')return;var r=roleOf(u),fl=ST(u).fl;if(k==='civ'&&r!=='man'&&r!=='rec'&&fl.indexOf('D')<0&&fl.indexOf('M')<0&&fl.indexOf('I')<0)return;var d=dist(u.x,u.y,o.x!==undefined?o.x:u.x,o.y!==undefined?o.y:u.y);if(d<bd){bd=d;pick=u;}});
    if(!pick)return [];return [[pick,newOrder(k,{x:o.x,y:o.y,opt:o.opt,fac:o.fac,sub:1})]];}return b(F,o);};})();
function v8Init(){if(!G||!G.map)return;if(!G.fac)G.fac=facGen(G.map,G.set.y);if(!G.fac8v){G.fac8v=1;if(!G.fac.some(function(F){return FAC8[F.k];}))facGen8(G.map,G.set.y||1943,G.fac);}G.fac.forEach(function(F){if(F.hp===undefined)F.hp=100;});
  SIDES().forEach(function(side){(SD(side).nodes||[]).forEach(function(N){if(N.k!=='depot'||N.fac)return;var F={id:G.fac.reduce(function(m,f){return Math.max(m,f.id);},0)+1,k:'depot',x:N.x,y:N.y,name:N.name,set:'',own:side,cand:-1,ct:0,kn:facKn0(side),st0:{food:0,ammo:0,fuel:0,fod:0},hp:100,built:1};G.fac.push(F);N.fac=F.id;});});
  G.lgv=G.lgv||[];G.tp=G.tp||[];if(G.set.lgv===undefined)G.set.lgv=true;if(G.set.autoRefit===undefined)G.set.autoRefit=true;civAtt0();}
(function(){var b=prepareBattle;prepareBattle=function(){b.apply(null,arguments);v8Init();};})();
function v8Step(){if(!G.fac8v)v8Init();lgvStep();if(G.step%20===1)lgDispatch();else if(G._lgMore)lgDispatch(1);if(G.step%2===0)airFacStep();if(G.step%4===3)boomStep();if(G.step%10===4)navStep8();if(G.step%20===11){refitStep();civDetStep();campFacStep();hospStep();}if(G.step%2===1)cornerStep();if(G.step%10===2)autoRefit();tpStep();}
(function(){var b=v6Step;v6Step=function(){b();v8Step();};})();
