/* ===================== 指揮與部隊自動化（參考 Command Ops 的指揮邏輯）
   待命：玩家部隊執行完命令後原地待命，不自行反擊或出擊；砲兵只為指派的支援對象開火（火力支援命令指派，移動、砲擊之後仍然有效，「停止待命」解除）。
   同步攻擊：司令部規劃的攻擊，各部隊先到出發線，估計全部就位的時間定為 H 時，一起發起。
   自動輪替：防線上傷亡過大或士氣動搖的部隊，由同一司令部的預備隊接替，換下來的部隊到預備位置整補（雙方都適用）。
   自動撤退：沒有攻擊任務的部隊兵力過低、又受優勢敵軍壓迫時，有秩序地後撤再就地防禦（死守、伏擊、隱蔽的不撤）。
   毒氣：沒有攻擊任務的部隊沿側風撤出毒劑雲，雲散後回到原位置；依威脅自動調整防護等級；沾染的部隊自動除污。 ===================== */
var OFFK=/^(attack|storm|breakthrough|penetrate|pursue|siege|crossing|landing|airdrop|airlift|joint|persuade|eager)$/;
function isOffOrd(o){return !!o&&o.st!=='done'&&(OFFK.test(o.k)||OFFK.test(o.dk||''));}
function holdsFast(u){var op=optOf(u);return op.post==='holdfast'||op.post==='ambush'||op.post==='hide';}
/* 自行後撤的落點：從預定方向開始左右各試幾個角度，優先選直線走得到的（不必繞過河流或障礙） */
function reachPt(u,s,a,D){var c=null;for(var i=0;i<7;i++){var da=[0,0.35,-0.35,0.7,-0.7,1.05,-1.05][i],q=validPos(s,u.x+Math.cos(a+da)*D,u.y+Math.sin(a+da)*D);if(!c)c=q;if(lineOK(s,u.x,u.y,q[0],q[1]))return q;}return c;}
/* ---------- 砲兵的支援對象：指派的優先；電腦指揮（或設定開啟時）的直屬砲兵支援所屬上級 ---------- */
function artSupFor(u){var a=u.supA?uById(u.supA):null;if(a&&alive(a)&&a.side===u.side)return a.id;if(u.supA)u.supA=0;if(u.p<0||u.autoArt===false)return 0;return aiControls(u)||G.set.autoArt===true?u.p:0;}
/* ---------- 同步攻擊 ---------- */
/* 出發線離目標的距離（依時代的行軍安全距離） */
function syncD(u){return clamp(marchSafe(u)*0.3,600,3000);}
function syncSpeed(L){var v=1e9;L.forEach(function(q){var s=ST(q);if(s.dom==='land')v=Math.min(v,Math.max(2,s.vx||s.vr||4));});return (v<1e9?v:4)/3.6*0.6;}
/* 命令送達、準備（或下級參謀規劃）、行軍到出發線的時間 */
function syncEta(F,u,so){var L=isLeaf(u)?[u]:leavesOf(u).filter(onMap),C=L.length?centroid(L):[u.x,u.y],T=so.fup||[so.x,so.y],E=uEra(u),t=hopDelay(F,u,true).sec||0;
  t+=isLeaf(u)?E.react*60*(1.25-0.005*(u.trn||60)):PLANM[u.ech]*60*E.plan*0.8+E.react*60;return t+dist(C[0],C[1],T[0],T[1])/syncSpeed(L.length?L:[u]);}
(function(){var b=planOrder;planOrder=function(F,o){var out=b(F,o);if(o.k!=='attack'||!(o.opt&&o.opt.sync)||aiControls(F)||o.x===undefined)return out;var A=out.filter(function(p){return p[1].k==='attack';});if(!A.length)return out;
  A.forEach(function(p){var u=p[0],so=p[1];if(so.via&&so.via.length){so.fup=so.via[0].slice();return;}var L=isLeaf(u)?[u]:leavesOf(u).filter(onMap),C=L.length?centroid(L):[u.x,u.y],d=dist(C[0],C[1],so.x,so.y),D=syncD(L[0]||u);
    if(d>D+500){var q=validPos(ST(L[0]||u),so.x+(C[0]-so.x)/d*D,so.y+(C[1]-so.y)/d*D);so.fup=[q[0],q[1]];}});
  var given=o.hHour>G.t,h0=A[0][1].hHour||0,H=given?o.hHour:Math.max(h0,G.t+600);if(!given){A.forEach(function(p){H=Math.max(H,G.t+syncEta(F,p[0],p[1])*1.1+300);});H=Math.ceil(H/300)*300;}
  A.forEach(function(p){p[1].hHour=H;});/* 預先砲擊順延到 H 時結束 */if(h0&&H>h0)out.forEach(function(p){var so=p[1];if(so.k==='bombard'&&so.dur)so.tot=H-so.dur;});
  if(!given)logE(F.side,'plan',uName(F)+'規劃同步攻擊：各部隊先到出發線，H 時 '+clockTxt(dateOf(G.set.y,G.set.m,G.set.d,H+G.set.h*3600+(G.set.mi||0)*60))+'（約 '+durTxt(H-G.t)+' 後）一起發起',F.x,F.y,F.id);
  o.hHour=H;return out;};})();
/* ---------- 自動輪替：同一司令部的防禦計畫內，傷亡過大的前線部隊與預備隊對調 ---------- */
function rotStr(u){var L=isLeaf(u)?[u]:leavesOf(u).filter(onMap);if(!L.length)return null;var m=0,m0=0,sh=0;L.forEach(function(q){m+=q.men+q.veh*8;m0+=q.men0+q.veh0*8;if(q.ms==='shaken'||q.ms==='rout')sh++;});
  return {f:m0>0?m/m0:0,sh:sh/L.length,eng:L.some(function(q){return q._ed!==undefined&&q._ed<1500||G.t-(q.uf||-1e9)<300;})};}
function rotStep(){if(G.set.rot===false)return;var th=(G.set.rotTh||50)/100;G.units.forEach(function(F){if(isLeaf(F)||!alive(F)||F.hqLost)return;var o=F.ord;if(!o||o.k!=='defend'||o.st!=='exec'||G.t-(F._rotT||-1e9)<1800)return;
  var front=[],res=[];kidsOf(F).forEach(function(q){var qo=q.ord;if(!alive(q)||q.st==='off'||!qo||qo.parent!==o.oid||q.pend&&q.pend.length)return;var S=rotStr(q);if(!S)return;
    if((qo.k==='defend'||qo.k==='fortify')&&!(qo.opt&&qo.opt.post==='holdfast'))front.push([q,S]);else if(qo.k==='reserve'&&S.f>=0.75&&S.sh===0&&!S.eng&&roleOf(q)==='man')res.push([q,S]);});
  if(!res.length)return;var weak=front.filter(function(p){return p[1].f<th||p[1].sh>=0.5;}).sort(function(a,b){return a[1].f-b[1].f;})[0];if(!weak)return;
  var r=res.sort(function(a,b){return b[1].f-a[1].f;})[0][0],w=weak[0],wo=w.ord,ro=r.ord;F._rotT=G.t;
  var no=newOrder(wo.k,{x:wo.x,y:wo.y,face:wo.face,opt:wo.opt,pts:wo.pts,w:wo.w,sub:1}),nb=newOrder('reserve',{x:ro.x,y:ro.y,face:ro.face,sub:1,dk:'rot'});no.parent=nb.parent=o.oid;
  sendOrder(F,r,no,false);sendOrder(F,w,nb,false);w.rotT=G.t;
  logE(F.side,'rot',uName(w)+'傷亡過大（兵力 '+pct(weak[1].f*100)+'），'+uName(F)+'命令'+uName(r)+'接替防務，'+uName(w)+'撤到預備位置整補',w.x,w.y,F.id);});}
/* ---------- 自動撤退 ---------- */
function aretStep(){if(G.set.aret===false)return;var th=(G.set.aretTh||35)/100;G.units.forEach(function(u){if((G.step+u.id)%4||!isLeaf(u)||!onMap(u)||u.ms==='rout'||u.amph||u.st==='lift'||aiControls(u))return;var s=ST(u);if(s.dom!=='land')return;
  var o=u.ord;if(isOffOrd(o)||o&&o.k==='withdraw'||holdsFast(u)||u.pend&&u.pend.length||G.t-(u.aretT||-1e9)<1800||G.t-(u.twdT||-1e9)<900)return;
  var f=strFrac(u);if(f>=th&&!(u.ms==='shaken'&&f<th+0.15))return;if(!(G.t-(u.uf||-1e9)<300||u._ed!==undefined&&u._ed<rangeOf(s)))return;
  var own=u.men+u.veh*8,C=G.ct[u.side],enS=0,sx=0,sy=0;for(var id in C){var c=C[id];if(G.t-c.t>600||c.dead||c.dom==='air')continue;var dd=dist(u.x,u.y,c.x,c.y);if(dd>2000)continue;var w=(c.men||0)+(c.veh||0)*8+1;enS+=w;sx+=c.x*w;sy+=c.y*w;}
  if(enS<own*1.5)return;var ex=sx/enS,ey=sy/enS,a=Math.atan2(u.y-ey,u.x-ex),h=homeDir(u.side),P=u.p>=0?uById(u.p):null,ax=Math.cos(a)*0.6+Math.cos(h)*0.4,ay=Math.sin(a)*0.6+Math.sin(h)*0.4;
  /* 往上級司令部的方向靠 */if(P&&alive(P)&&dist(P.x,P.y,u.x,u.y)<8000){var b2=Math.atan2(P.y-u.y,P.x-u.x);ax+=Math.cos(b2)*0.3;ay+=Math.sin(b2)*0.3;}
  var D=clamp(1500+rangeOf(s)*0.5,1500,4000),q=reachPt(u,s,Math.atan2(ay,ax),D);u.aretT=u.twdT=G.t;
  activate(u,newOrder('withdraw',{x:q[0],y:q[1],dk:'twd',face:Math.atan2(-ay,-ax)}));
  logE(u.side,'twd',uName(u)+'兵力只剩 '+pct(f*100)+'，遭優勢敵軍壓迫，自行後撤至'+placeTxt(q[0],q[1])+'重新佈防',u.x,u.y,u.id);});}
/* ---------- 毒氣：撤出毒劑雲，雲散後回到原位置 ---------- */
/* 致命程度（濃度 × 殺傷係數；生物毒劑以較低的權重計） */
function gasAt(x,y){var o=cbConc(x,y),m=0;if(!o)return 0;Object.keys(o).forEach(function(k){if(k.indexOf('g_')===0)return;var A=CBA[k];if(A)m+=o[k]*(A[1]==='b'?0.3:A[3]);});return m;}
function gasCloud(x,y){var best=null,bv=0;(G.cbx||[]).forEach(function(C){var d=dist(x,y,C.x,C.y);if(d>C.r*1.6)return;var v=C.m*Math.exp(-2*(d/C.r)*(d/C.r));if(v>bv){bv=v;best=C;}});return best;}
function gasStep(){if(G.set.gasRet===false)return;var any=G.cbx&&G.cbx.length;G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||u.ms==='rout'||ST(u).dom!=='land'||u.men<1)return;var o=u.ord;
  if(o&&o.dk==='gas'){if(u.task!=='hold'||u.path||u.pq)return;var pv=o.gasPrev;if(!pv||gasAt(pv.x,pv.y)>0.01)return;
    activate(u,newOrder(pv.k,{x:pv.x,y:pv.y,face:pv.face,opt:pv.opt,dk:pv.dk,pts:pv.pts,sup:pv.sup}));logE(u.side,'cbrn',uName(u)+'：毒劑已經散去，回到原位置恢復任務',u.x,u.y,u.id);return;}
  if(!any||isOffOrd(o)||holdsFast(u)||u.pend&&u.pend.length||u.task==='work'||u.cbDec||o&&o.k==='withdraw')return;if(gasAt(u.x,u.y)<0.03)return;var C=gasCloud(u.x,u.y);if(!C)return;
  /* 沿側風（與風向垂直）往雲外走，選離雲軸較近的一側 */var s=ST(u),wd=G.env.wd||0,px=-Math.sin(wd),py=Math.cos(wd),off=(u.x-C.x)*px+(u.y-C.y)*py;if(Math.abs(off)<50){var h=homeDir(u.side);off=Math.cos(h)*px+Math.sin(h)*py;}
  /* 兩側都試：先試離雲軸較近的一側，直線走不到就換另一側 */var sg=off>=0?1:-1,D=Math.max(400,C.r*1.6+500-Math.abs((u.x-C.x)*px+(u.y-C.y)*py)),q=null;
  for(var t=0;t<2&&!q;t++){var g=sg*(t?-1:1),D2=t?C.r*1.6+500+Math.abs((u.x-C.x)*px+(u.y-C.y)*py):D,c=validPos(s,u.x+px*g*D2,u.y+py*g*D2);if(lineOK(s,u.x,u.y,c[0],c[1]))q=c;}if(!q)q=reachPt(u,s,Math.atan2(py*sg,px*sg),D);
  /* 散去後要恢復的命令：原本的命令（火力支援等沒有地點的命令回到原位置）；待命的部隊移回原位置（砲兵的支援指派不受影響） */
  var pv=o&&o.st!=='done'&&o.k!=='halt'?{k:o.k,x:o.x!==undefined?o.x:u.x,y:o.y!==undefined?o.y:u.y,face:o.face,opt:o.opt,dk:o.dk,pts:o.pts,sup:o.sup}:{k:'move',x:u.x,y:u.y,face:u.hd},no=newOrder('withdraw',{x:q[0],y:q[1],dk:'gas',face:u.hd});no.gasPrev=pv;activate(u,no);
  logE(u.side,'cbrn',uName(u)+'撤出'+(CBA[C.ag]?CBA[C.ag][0]:'毒劑')+'雲，沿側風移到'+placeTxt(q[0],q[1]),u.x,u.y,u.id);});}
/* ---------- 防護等級：依威脅自動調整（本方設定的等級是下限；威脅解除 30 分鐘後逐級降低） ---------- */
function moppThreat(u){var x=u.x,y=u.y,lv=0;if(cbConc(x,y))return 4;var GR=G.cbgr;if(GR&&GR[cbGK(x,y)]>0.05)return 4;var wd=G.env.wd||0,dx=Math.cos(wd),dy=Math.sin(wd);
  (G.cbx||[]).forEach(function(C){var d=dist(x,y,C.x,C.y),R=C.r*1.6;if(d>R+4000)return;/* 單位在雲的下風處：較遠就要準備 */var down=(x-C.x)*dx+(y-C.y)*dy>0;if(d<R+1500||down)lv=3;});
  var used=G.cbUse&&(nSides()<3?G.cbUse[1-u.side]:Math.max.apply(null,[0].concat(hostSides(u.side).map(function(h){return G.cbUse[h]||0;}))));if(used&&G.t-used<86400)lv=Math.max(lv,2);return lv;}
function moppStep(){var hot=G.cbx&&G.cbx.length||G.cbgr&&Object.keys(G.cbgr).length||G.cbUse;G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||ST(u).dom!=='land')return;var S=SD(u.side);
  if(G.set.moppAuto===false){if(u.mopp!==undefined)delete u.mopp;return;}if(!hot&&u.mopp===undefined)return;var g=cbGear(u);if(!(g.mask>0)&&!(g.suit>0))return;
  var base=S.mopp||0,t=Math.max(base,hot?moppThreat(u):0),cur=u.mopp!==undefined?u.mopp:base;
  if(t>cur){u.mopp=t;u._moppT=G.t;if(t>=3)logE(u.side,'cbrn',uName(u)+'提高防護等級至 MOPP '+t,u.x,u.y,u.id);}
  else if(t<cur){if(G.t-(u._moppT||0)>1800){u.mopp=cur-1;u._moppT=G.t;if(u.mopp<=base)delete u.mopp;}}
  else if(t>base)u._moppT=G.t;});}
/* ---------- 自動除污：附近有工兵、醫療或除污裝備的本方部隊就協助，否則部隊靜止時自行簡易除污 ---------- */
function deconCap(u){var s=ST(u);return s.dom==='land'&&isLeaf(u)&&onMap(u)&&(isEng(u)||s.fl.indexOf('D')>=0||typeof eqHas==='function'&&eqHas(u,'dk'));}
function deconStep(){if(G.set.decon===false)return;G.units.forEach(function(u){var g=u.cbg;if(!g||!(g.cont>0.1)||!isLeaf(u)||!onMap(u)||ST(u).dom!=='land')return;if(cbConc(u.x,u.y)||G.t-(u.uf||-1e9)<600||u._ed!==undefined&&u._ed<2000)return;
  var h=null;gridNearS(u.x,u.y,3000,u.side,function(q){if(!h&&q!==u&&deconCap(q)&&!(q._ed<2000)&&!isOffOrd(q.ord))h=q;});
  if(h){g.cont*=0.3;g.filt=Math.min(100,g.filt+40);if(!u._dcLog||G.t-u._dcLog>3600){u._dcLog=G.t;logE(u.side,'cbrn',uName(h)+'為'+uName(u)+'實施除污',u.x,u.y,u.id);}}
  else if(stillFor(u)>=600){g.cont*=0.75;if(!u._dcLog||G.t-u._dcLog>7200){u._dcLog=G.t;logE(u.side,'cbrn',uName(u)+'自行實施簡易除污',u.x,u.y,u.id);}}});}
(function(){var b=v8Step;v8Step=function(){b.apply(this,arguments);if(!G.started||G.over)return;aretStep();if(G.step%20===7)rotStep();if(typeof cbOn==='function'&&cbOn()){if(G.step%4===1){gasStep();moppStep();}if(G.step%20===17)deconStep();}};})();
