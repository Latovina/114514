/* ===================== 戰報：交火 → 衝突 → 戰役 → 戰區
   依參戰人數與後續投入規模自動升級；相鄰的戰鬥連在一起時合併（較小者成為子戰鬥）；可巢狀檢視、匯出 ===================== */
var TIERN=['交火','衝突','戰役','戰區'],TIERC=['#8A8F98','#C98A1E','#C0462B','#7B2CBF'],TIERD=['小部隊之間的接觸與射擊','數個營到旅級的戰鬥','師級以上的大規模作戰','多個戰役連成的整個戰區'];
function touch(a,b,kind){(G._touch||(G._touch=[])).push(a.id,b.id,kind);}
function btGet(id){return G.bt.list[id-1]||null;}
/* 上層戰役（最多 64 層，防止舊存檔裡的循環造成無限迴圈） */function btTop(R){var n=0;while(R&&R.parent&&n++<64)R=btGet(R.parent);return R;}
function btAct(uid){var r=G.bt.byUnit[uid];if(!r)return null;var R=btTop(btGet(r));return R&&R.active?R:null;}
function btTier(R){var m=R.men[0]+R.men[1],T=G.set.tiers||[2000,20000,200000];return m>=T[2]?3:m>=T[1]?2:m>=T[0]?1:0;}
function placeName(x,y){var MP=G.map,best=null,bd=1e18;(MP.set||[]).forEach(function(s){var d=dist(x,y,s.x*MP.cs,s.y*MP.cs)/(s.kind==='city'?3:s.kind==='town'?1.8:1);if(d<bd){bd=d;best=s;}});if(best&&bd<6000)return best.name;
  var bl=null,bd2=1e18;(MP.lbl||[]).forEach(function(l){if(!l.t)return;var d=dist(x,y,l.x*MP.cs,l.y*MP.cs);if(d<bd2){bd2=d;bl=l;}});if(bl&&bd2<8000)return bl.t;return best?best.name:'無名高地';}
function btName(R){var nm=R.place+TIERN[R.tier],same=G.bt.list.filter(function(Q){return Q!==R&&!Q.parent&&Q.place===R.place&&Q.tier===R.tier;}).length;return same?'第'+'二三四五六七八九十'.charAt(Math.min(8,same-1))+'次'+nm:nm;}
function btNew(x,y){var R={id:++G.bt.seq,tier:0,x:x,y:y,bb:[x,y,x,y],t0:G.t,t1:G.t,active:true,u:sAO(),men:sA0(),veh:sA0(),init:sA0(),later:sA0(),reinf:sA0(),n:{},ev:[],kids:[],parent:0,wx:G.env?G.env.wx:0,ph:G.env?G.env.phase:'day'};
  R.place=placeName(x,y);R.name=btName(R);G.bt.list.push(R);R.ev.push({t:G.t,txt:'在'+placeTxt(x,y)+'爆發'+TIERN[0]});return R;}
/* 戰鬥紀錄補齊到目前的陣營數（三方作戰） */
function btPadR(R){while(R.u.length<nSides()){R.u.push({});R.men.push(0);R.veh.push(0);R.init.push(0);R.later.push(0);R.reinf.push(0);}}
function btMen(R){var m=0;for(var i=0;i<R.men.length;i++)m+=R.men[i]||0;return m;}
/* 這場戰鬥有參戰的各方（兩方作戰時固定是 0、1） */
function btSides(R){if(nSides()<3)return [0,1];return SIDES().filter(function(s){var U=R.u[s];if(!U)return false;for(var k in U)return true;return false;});}
function btAdd(R,u,kind){if(!(u.side>=0))return;if(!R.u[u.side])btPadR(R);var S=R.u[u.side],e=S[u.id];if(!e){var s=ST(u);e=S[u.id]={m0:u.men,v0:u.veh,t:G.t,name:uName(u),ech:dispEch(u),br:s.br,dom:s.dom,reinf:!!u.isReinf,late:G.t-R.t0>600};R.men[u.side]+=u.men;R.veh[u.side]+=u.veh;
    if(e.late)R.later[u.side]+=u.men;else R.init[u.side]+=u.men;if(u.isReinf)R.reinf[u.side]+=u.men;if(e.late&&u.men+u.veh*8>=150)R.ev.push({t:G.t,txt:G.sides[u.side].name+'投入'+uName(u)+'（'+fmt(u.men)+' 人）'+(u.isReinf?'〔增援〕':'')});}
  G.bt.byUnit[u.id]=R.id;if(kind)R.n[kind]=(R.n[kind]||0)+1;}
function btNear(x,y){var best=null,bd=1e18;G.bt.list.forEach(function(R){if(!R.active||R.parent||G.t-R.t1>900)return;var L=1200+600*R.tier,dx=Math.max(R.bb[0]-x,0,x-R.bb[2]),dy=Math.max(R.bb[1]-y,0,y-R.bb[3]),d=Math.sqrt(dx*dx+dy*dy);if(d<=L&&d<bd){bd=d;best=R;}});return best;}
function btMerge(A,B){A=btTop(A);B=btTop(B);if(!A||!B||A===B)return A||B;var big=btMen(A)>=btMen(B)?A:B,sm=big===A?B:A;btFreeze(sm);btPadR(big);
  for(var s=0;s<sm.u.length;s++)for(var id in sm.u[s]){var e=sm.u[s][id];if(!big.u[s][id]){big.u[s][id]=Object.assign({},e,{m1:undefined,v1:undefined,fate:undefined});big.men[s]+=e.m0;big.veh[s]+=e.v0;if(e.late||sm.t0>big.t0+600)big.later[s]+=e.m0;else big.init[s]+=e.m0;if(e.reinf)big.reinf[s]+=e.m0;}G.bt.byUnit[id]=big.id;}
  big.t0=Math.min(big.t0,sm.t0);big.t1=Math.max(big.t1,sm.t1);big.bb=[Math.min(big.bb[0],sm.bb[0]),Math.min(big.bb[1],sm.bb[1]),Math.max(big.bb[2],sm.bb[2]),Math.max(big.bb[3],sm.bb[3])];for(var k in sm.n)big.n[k]=(big.n[k]||0)+sm.n[k];
  big.kids.push(sm.id);sm.parent=big.id;sm.active=false;sm.end=G.t;sm.res=btOutcome(sm);big.ev.push({t:G.t,txt:sm.name+'與本戰鬥連成一片，併入'});return big;}
/* 凍結：記錄結束時的兵力與單位下場 */
function btFreeze(R){for(var s=0;s<R.u.length;s++)for(var id in R.u[s]){var e=R.u[s][id],u=uById(+id);if(e.m1!==undefined)continue;e.m1=u&&alive(u)?u.men:0;e.v1=u&&alive(u)?u.veh:0;e.fate=!u?'?':u.st==='dead'?(u.why==='capt'?(u.surr?'surr':'capt'):'dead'):u.ms==='rout'?'rout':u.ms==='shaken'?'shaken':'ok';e.capt=u&&u.why==='capt'?(u.captMen||0):0;}}
function btLoss(R,s){var m=0,v=0,capt=0,dead=0,rout=0,m0=0,v0=0,n=0;for(var id in R.u[s]){var e=R.u[s][id],u=uById(+id),cm=e.m1!==undefined?e.m1:(u&&alive(u)?u.men:0),cv=e.v1!==undefined?e.v1:(u&&alive(u)?u.veh:0),fate=e.fate||(!u?'?':u.st==='dead'?(u.why==='capt'?(u.surr?'surr':'capt'):'dead'):u.ms);
    m+=Math.max(0,e.m0-cm);v+=Math.max(0,e.v0-cv);m0+=e.m0;v0+=e.v0;n++;if(fate==='capt'||fate==='surr'){capt+=e.capt||(u&&u.captMen)||0;}if(fate==='dead'||fate==='capt'||fate==='surr')dead++;if(fate==='rout')rout++;}
  return {m:m,v:v,capt:capt,dead:dead,rout:rout,m0:m0,v0:v0,n:n,f:m0+v0*8?(m+v*8)/(m0+v0*8):0};}
function btPresence(R,s){var p=0,M=1500;for(var id in R.u[s]){var u=uById(+id);if(!u||!alive(u)||u.ms==='rout'||u.st==='air'||u.st==='base')continue;if(u.x>=R.bb[0]-M&&u.x<=R.bb[2]+M&&u.y>=R.bb[1]-M&&u.y<=R.bb[3]+M)p+=u.men+u.veh*8;}return p;}
function btOutcome(R){var SS=SIDES(),L=SS.map(function(s){return btLoss(R,s);}),P=SS.map(function(s){return btPresence(R,s);}),ctl=-1,res;
  if(SS.length<3)ctl=P[0]>0&&P[1]===0?0:P[1]>0&&P[0]===0?1:P[0]>P[1]*3?0:P[1]>P[0]*3?1:-1;else{var o=SS.slice().sort(function(a,b){return P[b]-P[a];});ctl=P[o[0]]>0&&P[o[0]]>P[o[1]]*3?o[0]:-1;}
  if(ctl<0)res={ctl:-1,k:'stale',txt:SS.length<3?'雙方僵持，戰場未分勝負':'各方僵持，戰場未分勝負'};else{var me=L[ctl].f,en=SS.length<3?L[enemyOf(ctl)].f:Math.max.apply(null,SS.filter(function(s){return s!==ctl&&L[s].n>0;}).map(function(s){return L[s].f;}).concat([0])),nm=G.sides[ctl].name;
    if(en>=0.3&&en>=me*2)res={ctl:ctl,k:'decisive',txt:nm+'決定性勝利，控制戰場'};else if(me>en*1.5&&me>0.1)res={ctl:ctl,k:'pyrrhic',txt:nm+'付出慘重代價後控制戰場（慘勝）'};else res={ctl:ctl,k:'win',txt:nm+'勝利，控制戰場'};}
  res.L=L;res.P=P;return res;}
/* ---------- 每步：處理接觸 → 建立／併入戰鬥；後續投入；規模升級；結束 ---------- */
function btStep(){var T=G._touch||[];G._touch=[];for(var i=0;i<T.length;i+=3){var a=uById(T[i]),b=uById(T[i+1]);if(!a||!b)continue;var x=(a.x+b.x)/2,y=(a.y+b.y)/2,ra=btAct(a.id),rb=btAct(b.id),R=ra||rb;if(ra&&rb&&ra!==rb)R=btMerge(ra,rb);if(!R)R=btNear(x,y);if(!R)R=btNew(x,y);
    btAdd(R,a,T[i+2]);btAdd(R,b,null);R.t1=G.t;R.bb=[Math.min(R.bb[0],x),Math.min(R.bb[1],y),Math.max(R.bb[2],x),Math.max(R.bb[3],y)];}
  if(G.step%10!==0)return;G.bt.list.forEach(function(R){if(!R.active)return;
    /* 後續投入：進入戰場範圍、帶著作戰命令（攻擊、防禦、支援、砲擊、預備）的部隊 */
    var M=Math.max(1500,0.5*Math.max(R.bb[2]-R.bb[0],R.bb[3]-R.bb[1])+800);G.units.forEach(function(u){/* 本戰鬥已併入別的戰鬥：不再加入部隊 */if(!R.active||R.parent)return;if(!onMap(u)||G.bt.byUnit[u.id]===R.id)return;if(u.x<R.bb[0]-M||u.x>R.bb[2]+M||u.y<R.bb[1]-M||u.y>R.bb[3]+M)return;var o=u.ord;
      var cm=(o&&/attack|defend|support|bombard|reserve|strike|screen/.test(o.k))||(u._ed<1500);if(!cm)return;var ra=btAct(u.id);if(ra&&ra!==R){btMerge(ra,R);return;}btAdd(R,u,null);});
    var nt=btTier(R);if(nt>R.tier){var old=R.name;R.tier=nt;R.name=btName(R);R.ev.push({t:G.t,txt:'雙方累計投入 '+fmt(btMen(R))+' 人，規模升級為「'+TIERN[nt]+'」'});logE(-1,'bt',old+'規模擴大，升級為'+R.name+'（雙方投入 '+fmt(btMen(R))+' 人）',(R.bb[0]+R.bb[2])/2,(R.bb[1]+R.bb[3])/2);}
    if(G.t-R.t1>1800)btClose(R);});}
function btClose(R){if(!R.active)return;R.active=false;R.end=R.t1;btFreeze(R);R.res=btOutcome(R);logE(-1,'bt',R.name+'結束：'+R.res.txt+'（'+btSides(R).map(function(s){return G.sides[s].name+'損失 '+fmt(R.res.L[s].m)+' 人';}).join('，')+'）',(R.bb[0]+R.bb[2])/2,(R.bb[1]+R.bb[3])/2);}
function btCloseAll(){G.bt.list.forEach(function(R){if(R.active)btClose(R);});}
/* 戰報事件：記錄到單位所屬的進行中戰鬥 */
function btLog(e){if(!G.bt||!e.u)return;var R=btAct(e.u);if(R&&R.ev.length<400&&/dead|rout|assault|hq|reinf|rally|ff|air|arty|obj|eng|surr|twd|eager|refuse|panic|rejoin|siege|nuke|abn|amph/.test(e.k))R.ev.push({t:e.t,txt:e.txt});}
/* ---------- 戰報內容（供介面與匯出） ---------- */
function btView(R){var res=R.active||!R.res?btOutcome(R):R.res,L=res.L,men=btMen(R),sides=btSides(R).map(function(s){var list=[];for(var id in R.u[s]){var e=R.u[s][id],u=uById(+id);list.push({id:+id,name:e.name,ech:e.ech,br:e.br,m0:e.m0,v0:e.v0,m:e.m1!==undefined?e.m1:(u&&alive(u)?u.men:0),v:e.v1!==undefined?e.v1:(u&&alive(u)?u.veh:0),fate:e.fate||(!u?'?':u.st==='dead'?(u.why==='capt'?(u.surr?'surr':'capt'):'dead'):u.ms),late:e.late,reinf:e.reinf,t:e.t});}
    list.sort(function(a,b){return b.m0+b.v0*8-a.m0-a.v0*8;});return {side:s,name:G.sides[s].name,color:G.sides[s].color,men:R.men[s]||0,veh:R.veh[s]||0,init:R.init[s]||0,later:R.later[s]||0,reinf:R.reinf[s]||0,L:L[s]||btLoss(R,s),list:list};});
  return {id:R.id,name:R.name,tier:R.tier,tierN:TIERN[R.tier],active:R.active,t0:R.t0,t1:R.active?G.t:R.end,place:R.place,where:placeTxt((R.bb[0]+R.bb[2])/2,(R.bb[1]+R.bb[3])/2),men:men,res:res,sides:sides,n:R.n,ev:R.ev.slice().sort(function(a,b){return a.t-b.t;}),kids:R.kids.map(btGet).filter(Boolean),parent:R.parent,wx:WX[R.wx]?WX[R.wx][1]:'',ph:R.ph};}
var FATE={ok:'完好',shaken:'動搖',rout:'潰散',dead:'被殲滅',capt:'被俘',surr:'投降','?':'不明'};
function tTxt(t){return clockTxt(dateOf(G.set.y,G.set.m,G.set.d,t+G.set.h*3600+(G.set.mi||0)*60));}
function btText(R,depth){var V=btView(R),o=[],ind=new Array((depth||0)+1).join('  ');o.push(ind+'【'+V.tierN+'】'+V.name+(V.active?'（進行中）':''));o.push(ind+'時間：'+tTxt(V.t0)+' － '+tTxt(V.t1)+'（'+durTxt(V.t1-V.t0)+'）；地點：'+V.where+'；開戰時天氣：'+V.wx);
  V.sides.forEach(function(S){o.push(ind+S.name+'：投入 '+fmt(S.men)+' 人'+(S.veh?'、'+fmt(S.veh)+' 件裝備':'')+'（初始 '+fmt(S.init)+'，後續投入 '+fmt(S.later)+(S.reinf?'，其中增援 '+fmt(S.reinf):'')+'）；損失 '+fmt(S.L.m)+' 人'+(S.L.v?'、'+fmt(S.L.v,1)+' 件裝備':'')+(S.L.capt?'、被俘 '+fmt(S.L.capt):'')+'（'+pct(S.L.f*100)+'）');
    o.push(ind+'  參戰單位：'+S.list.slice(0,24).map(function(e){return e.name+'〔'+FATE[e.fate]+'〕';}).join('、')+(S.list.length>24?'⋯等 '+S.list.length+' 個單位':''));});
  o.push(ind+'結果：'+V.res.txt);if(V.ev.length){o.push(ind+'經過：');V.ev.slice(0,60).forEach(function(e){o.push(ind+'  '+tTxt(e.t).slice(-5)+'　'+e.txt);});}
  V.kids.forEach(function(K){o.push('');o.push(btText(K,(depth||0)+1));});return o.join('\n');}
/* 戰區總覽（整個想定） */
function theaterView(){var top=G.bt.list.filter(function(R){return !R.parent;}),men=sA0(),cnt=[0,0,0,0];top.forEach(function(R){for(var i=0;i<men.length;i++)men[i]+=R.men[i]||0;});G.bt.list.forEach(function(R){cnt[R.tier]++;});
  var st=SIDES().map(function(s){var S=sideStr(s);return {side:s,name:G.sides[s].name,color:G.sides[s].color,cas:G.stats[s].cas,vl:G.stats[s].vl,capt:G.stats[s].capt,surr:G.stats[s].surr||0,f:S.f};});
  var tot=men.reduce(function(a,b){return a+b;},0),T=G.set.tiers||[2000,20000,200000],tier=tot>=T[2]?3:tot>=T[1]?2:tot>=T[0]?1:0;return {name:(G.map.name||'作戰地區')+(tier>=3?'戰區':'作戰地區'),tier:tier,top:top,men:men,cnt:cnt,sides:st};}
function theaterText(){var V=theaterView(),o=['# '+V.name+' 戰報','作戰時間：'+tTxt(0)+' 起，已進行 '+durTxt(G.t),''];V.sides.forEach(function(s){o.push(s.name+'：傷亡 '+fmt(s.cas)+' 人、裝備損失 '+fmt(s.vl,1)+'、被俘 '+fmt(s.capt)+'；剩餘戰力 '+pct(s.f*100));});
  o.push('戰鬥統計：'+V.cnt.map(function(n,i){return TIERN[i]+' '+n;}).join('、'));if(G.over)o.push('結果：'+G.over.why+'，'+(G.over.win>=0?G.sides[G.over.win].name+'獲勝':'不分勝負'));o.push('');
  V.top.slice().sort(function(a,b){return b.tier-a.tier||a.t0-b.t0;}).forEach(function(R){o.push(btText(R,0));o.push('');});return o.join('\n');}
