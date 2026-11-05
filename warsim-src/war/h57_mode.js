/* ===================== 遊戲模式：把現有的機制組合成不同玩法，並加上新的勝負規則 =====================
   模式是一組設定（殺傷效率、增援點數、時限、命令延遲、迷霧、核武、喪屍、突發事件、目標區……）加上勝負規則；選定後仍可在設定頁逐項調整。
   換模式時先把上一個模式改過的設定恢復原狀（G.set.gmB），再套用新模式。
   勝負規則（設定欄位）：collapse 兵力崩潰門檻、objW 目標在計分中的權重、rpGain 戰功點數倍率、rpRep 每日配給隨後方民心增減、
   opin 後方民心隨戰況變化、supLose 民心崩潰門檻、tix 兵力票數、decap 最高司令部被摧毀即戰敗。執行狀態在 G.gm。 */
var GMODE={
  std:{n:'標準',d:'依想定與設定頁的內容，不另外調整。',s:{}},
  leth:{n:'高殺傷',d:'所有武器的殺傷效率 2.5 倍，傷亡與士氣崩潰都更快，戰鬥很快分出勝負。',s:{leth:{all:2.5}}},
  prest:{n:'高聲望（戰功點數）',d:'開啟增援點數；殺傷敵軍、後送戰俘與傷患、佔領與守住目標得到 3 倍點數，每日配給隨後方民心增減。仗打得好、軍紀好，增援就多。',s:{rp:true,rpGain:3,rpRep:true}},
  opin:{n:'民心戰',d:'後方民心決定勝負：本方傷亡、殺害平民、戰爭罪行被揭露、丟失目標與長期作戰都會降低民心，殺傷敵軍與佔領目標會提振；一方民心跌破 25，政府接受停火、判定戰敗。開啟平民與戰地記者。',s:{civ:true,press:true,opin:true,supLose:25}},
  conq:{n:'搶點戰',d:'雙方各有 600 張兵力票：敵方控制的每個目標都讓本方持續扣票（目標分數越高扣得越快），傷亡也會扣票；票數歸零即戰敗，時間到則比剩餘票數與分數。目標範圍 1.5 倍、3 分鐘就能易手。',s:{tix:600,objCap:3,objRm:1.5}},
  annih:{n:'殲滅戰',d:'不計目標分數，只看殲滅多少敵軍；一方兵力降到三成以下即戰敗；作戰時限至少 72 小時。',s:function(S){return {collapse:0.3,objW:0,dur:Math.max(+S.dur||24,72)};}},
  decap:{n:'斬首戰',d:'雙方開戰時的最高司令部一旦被摧毀即戰敗。保護好自己的總部，找出並打掉對方的總部。',s:{decap:true}},
  blitz:{n:'閃電戰',d:'12 小時內決勝：命令延遲減半、殺傷 1.5 倍、目標 5 分鐘易手，一方控制全部目標 1 小時即獲勝。',s:{dur:12,delayMul:0.5,leth:{all:1.5},objCap:5,end:'obj',objHold:1}},
  attr:{n:'消耗戰',d:'至少一週的長期作戰：殺傷降為 0.6 倍，開啟補充兵、裝備修復與增援點數，補給、輪替與民心決定勝負。',s:function(S){return {dur:Math.max(+S.dur||24,168),sustain:true,leth:{all:0.6},rp:true};}},
  iron:{n:'鐵血指揮',d:'硬派玩法：戰場迷霧與友軍迷霧全開、命令延遲 1.5 倍、電腦積極進攻，部隊不會自動恢復被打斷的命令。',s:{fog:true,ffog:true,delayMul:1.5,aiLvl:2,resume:false}},
  nuke:{n:'核子戰爭',d:'雙方各有 4 枚 20 千噸的戰術核武，電腦也會使用。',s:{nuke:{on:true,n:4,y:20,ai:true}}},
  zed:{n:'喪屍末日',d:'開戰一小時後，市鎮、巢穴與地圖邊緣同時爆發末日等級的屍潮，戰死者會起屍；兩軍要同時對付敵人與屍群。',s:{zed:{on:true,k:'zombie',lv:3,src:'all',rise:true,civ:true,t0:1}}},
  chaos:{n:'末日混戰',d:'所有危機疊在一起：殺傷 2 倍、雙方都有戰術核武、兩小時後爆發喪屍與寄生蟲、突發事件加倍。',s:{leth:{all:2},nuke:{on:true,n:3,y:10,ai:true},zed:{on:true,k:'mixed',lv:2,src:'town',rise:true,civ:true,t0:2},evt:{on:true,freq:2}}}};
function gmPreset(k,S){var M=GMODE[k];if(!M)return {};var p=typeof M.s==='function'?M.s(S||{}):M.s;return JSON.parse(JSON.stringify(p||{}));}
/* 套用模式到一份設定：先恢復上一個模式改過的欄位，再寫入新模式（物件欄位合併，例如殺傷效率只改整體倍率） */
function gmApplySet(S,k){if(!S)return S;var B=S.gmB||{};Object.keys(B).forEach(function(f){if(B[f]===null)delete S[f];else S[f]=JSON.parse(JSON.stringify(B[f]));});
  var P=gmPreset(k,S),nb={};Object.keys(P).forEach(function(f){nb[f]=S[f]===undefined?null:JSON.parse(JSON.stringify(S[f]));var v=P[f];S[f]=v&&typeof v==='object'&&!Array.isArray(v)&&S[f]&&typeof S[f]==='object'?Object.assign({},S[f],v):v;});
  S.gmB=nb;S.gm=GMODE[k]?k:'std';return S;}
function gmKey(){var k=G&&G.set&&G.set.gm;return GMODE[k]?k:'std';}
function gmCollapse(){var v=G&&G.set?+G.set.collapse:0;return v>0&&v<1?v:0.15;}
function gmObjW(){var v=G&&G.set?G.set.objW:undefined;return v===undefined||v===null||v===''||!isFinite(+v)?1:Math.max(0,+v);}
function gmRpGain(){var v=G&&G.set?+G.set.rpGain:0;return v>0?v:1;}
/* ---------- 執行狀態：開戰時的最高司令部、傷亡基準、兵力票數、民心 ---------- */
function gmM0(side){var m=0,v=0;G.units.forEach(function(u){if(u.side===side&&isLeaf(u)&&!u.irr){m+=u.men0||0;v+=u.veh0||0;}});return [Math.max(1,m),Math.max(1,v)];}
function gmCk(side){return G.civ&&G.civ.cs&&G.civ.cs[side]?G.civ.cs[side].civK||0:0;}
function gmInit(){var X=G.gm;if(X)return X;X=G.gm={hq:SIDES().map(function(s){var T=sideCmd(s);return T&&!isLeaf(T)?T.id:-1;}),pc:SIDES().map(function(s){var S=G.stats[s]||{};return {cas:S.cas||0,vl:S.vl||0,ck:gmCk(s)};}),
  m0:SIDES().map(function(s){return gmM0(s);}),own:{},tix:null,home:null,lw:sA0(),t0:G.t};(G.obj||[]).forEach(function(o){X.own[o.id]=o.own;});return X;}
function gmStep(){if(!G.started||G.over)return;var S=G.set,X=gmInit();
  /* 兵力票數：每兩分鐘結算（敵方控制的目標扣票、傷亡扣票） */
  if(+S.tix>0){if(!X.tix)X.tix=sAV(+S.tix);if(G.step%4===0)SIDES().forEach(function(s){var e=enemyOf(s),dr=0;if(X.tix[s]===undefined)X.tix[s]=+S.tix;(G.obj||[]).forEach(function(o){if(nSides()<3?o.own===e:hostile(s,o.own))dr+=(o.pts||10)/10;});
      var St=G.stats[s]||{},P=X.pc[s],dc=(St.cas||0)-(P.tc===undefined?P.cas:P.tc),dv=(St.vl||0)-(P.tv===undefined?P.vl:P.tv);P.tc=St.cas||0;P.tv=St.vl||0;X.tix[s]=Math.max(0,Math.round((X.tix[s]-dr*2-Math.max(0,dc)/20-Math.max(0,dv))*10)/10);});}
  /* 後方民心：每十分鐘依戰況調整 */
  if(S.opin&&G.press&&G.press.home&&G.step%20===0){var H=G.press.home;SIDES().forEach(function(s){var e=enemyOf(s),me=G.stats[s]||{},en=G.stats[e]||{},P=X.pc[s],Q=X.pc[e],M=X.m0[s],ME=X.m0[e];
      var dc=(me.cas||0)-(P.hc===undefined?P.cas:P.hc),dv=(me.vl||0)-(P.hv===undefined?P.vl:P.hv),de=(en.cas||0)-(Q.he===undefined?Q.cas:Q.he),ck=gmCk(s)-(P.hk===undefined?P.ck:P.hk);
      var d=-Math.max(0,dc)/M[0]*80-Math.max(0,dv)/M[1]*20+Math.max(0,de)/ME[0]*25-Math.max(0,ck)/150-0.04;
      (G.obj||[]).forEach(function(o){var was=X.own[o.id];if(was===undefined)return;if(o.own===s&&was!==s)d+=2+(o.pts||10)/10;else if(was===s&&o.own!==s)d-=2+(o.pts||10)/10;});
      var h0=H[s];H[s]=clamp(Math.round((H[s]+d)*10)/10,0,100);[60,40,30].forEach(function(th){if(h0>=th&&H[s]<th){logE(s,'press','後方民心降到 '+fmt(H[s])+'：'+(th>=60?'國內出現反戰聲音':th>=40?'國會要求檢討作戰':'政府考慮停火')+(+S.supLose>0?'（低於 '+S.supLose+' 即戰敗）':''));}});});
    SIDES().forEach(function(s){var me=G.stats[s]||{},P=X.pc[s];P.hc=me.cas||0;P.hv=me.vl||0;P.hk=gmCk(s);});SIDES().forEach(function(s){X.pc[s].he=(G.stats[s]||{}).cas||0;});
    (G.obj||[]).forEach(function(o){X.own[o.id]=o.own;});}
  if(G.press&&G.press.home&&(G.step%20===0||!X.home))X.home=G.press.home.slice();}
/* 新的勝負規則：斬首、票數歸零、民心崩潰（由 checkEnd 呼叫） */
function gmEnd(){if(!G.started)return null;var X=G.gm,S=G.set;if(!X)return null;
  if(S.decap)for(var s=0;s<2;s++){var id=X.hq[s];if(id>=0){var T=uById(id);if(!T||!alive(T)||T.hqLost)return {why:G.sides[s].name+'的最高司令部被摧毀',win:1-s};}}
  if(+S.tix>0&&X.tix){var a=X.tix[0]<=0,b=X.tix[1]<=0;if(a||b)return {why:(a&&b?'雙方的':G.sides[a?0:1].name+'的')+'兵力票數耗盡',win:a&&b?-1:a?1:0};}
  if(+S.supLose>0&&G.press&&G.press.home){var L=+S.supLose,h=G.press.home,a2=h[0]<L,b2=h[1]<L;if(a2||b2)return {why:(a2&&b2?'雙方的':G.sides[a2?0:1].name+'的')+'後方民心崩潰（低於 '+L+'），政府接受停火',win:a2&&b2?-1:a2?1:0};}
  return null;}
(function(){var b=v8Step;v8Step=function(){b.apply(this,arguments);if(G&&G.started&&!G.over)gmStep();};})();
/* 戰功點數倍率；每日配給隨後方民心增減（民心 50 為原本的配給） */
(function(){var b=rpAdd;rpAdd=function(side,amt,why,txt){if(/^(fight|cap|hold|pow|evac)$/.test(why))amt*=gmRpGain();return b.call(this,side,amt,why,txt);};})();
(function(){var b=rpDayAmt;rpDayAmt=function(side){var v=b.apply(this,arguments);if(G.set.rpRep&&G.press&&G.press.home)v=Math.round(v*clamp(0.5+G.press.home[side]/100,0.5,1.5)/10)*10;return v;};})();
if(typeof mpValList==='function'){(function(){var b=mpValList;mpValList=function(s){var V=b.apply(this,arguments);if(G.gm)V.push(['gm',{tix:G.gm.tix,home:G.gm.home,hq:G.gm.hq}]);return V;};})();}
