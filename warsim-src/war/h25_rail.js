/* ===================== 鐵路運輸：列車一次載運大量物資（一列抵得上上百輛卡車），但鐵道可以被砲擊、轟炸、工兵與游擊隊破壞；
   列車撞上沒有發現的斷軌會出軌，遭空襲、砲擊或伏擊時整列連同物資損失，損失慘重。工兵、營建部隊與鐵路搶修隊修復鐵道 ===================== */
Object.assign(ORDN,{railcut:'破壞鐵道',railfix:'修鐵道'});
var RLCUT=120;/* 損壞值 0～255；120 以上＝斷軌 */
function rlArr(){var N=G.map.GW*G.map.GH;if(!G.rld||G.rld.length!==N){G.rld=new Uint8Array(N);G.rlc=[];}return G.rld;}
/* 破壞鐵道：半徑 R 內的鐵道格累積損壞；新出現的斷軌記錄位置、時間與造成的一方 */
function railDmg(x,y,R,amt,side,why){var MP=G.map;if(!(amt>0))return 0;var D=rlArr(),cut=0,first=-1;brushCells(MP,x/MP.cs,y/MP.cs,Math.max(1,R/MP.cs),function(k){if(!(MP.rl[k]&1))return;var v=Math.min(255,D[k]+amt);if(D[k]<RLCUT&&v>=RLCUT){cut++;if(first<0)first=k;}D[k]=v;});
  if(cut){var c=cellXY(first);G.rlc.push({k:first,x:c[0],y:c[1],t:G.t,by:side===undefined?-1:side,why:why||'',n:cut});if(G.rlc.length>300)G.rlc=G.rlc.slice(-300);G._rlv=(G._rlv||0)+1;}return cut;}
/* 斷軌是否已為某一方所知：破壞者立即知道；其他方在 30 分鐘後經由鐵路電報得知，或 2 公里內有本方部隊時立即發現 */
function rlCutAt(k){var L=G.rlc||[],best=null,bd=1e18,c=cellXY(k);for(var i=L.length-1;i>=0;i--){var q=L[i],d=dist(q.x,q.y,c[0],c[1]);if(d<bd){bd=d;best=q;}}return bd<1500?best:null;}
function rlKnown(k,side){var q=rlCutAt(k);if(!q)return G.t>0;if(q.by===side||G.t-q.t>1800)return true;var c=cellXY(k),f=false;gridNear(c[0],c[1],2000,function(u){if(!f&&u.side===side&&onMap(u)&&dist(u.x,u.y,c[0],c[1])<2000)f=true;});return f;}
function rlCut(k){return !!(G.rld&&G.rld[k]>=RLCUT);}
/* 砲擊、轟炸落在鐵道上（直接命中才會炸斷鐵軌，比道路彈坑少一些） */
(function(){var b=roadDmg;roadDmg=function(x,y,R,amt){b(x,y,R,amt);if(G&&G.map&&G.started){railDmg(x,y,R,amt*0.6,-1,'fire');trainNear(x,y,R,amt);}};})();
/* ---------- 列車：前方斷軌、空襲、砲擊 ---------- */
function isTrain(V){var D=LGM[V.m];return !!(D&&D.rail);}
function trainLose(V,f,why,by){if(V.ph==='dead'||V.ph==='gone')return;var tot=0,S=lgStats(V.side);LCLS.forEach(function(c){var q=V.c[c]*f;V.c[c]-=q;tot+=q;});S.lostT+=tot;S.trT=(S.trT||0)+tot;
  if(f>=0.95||why==='wreck'){V.n=0;V.ph='dead';S.lostV+=1;S.trL=(S.trL||0)+1;}var H=V.home&&V.home.k==='node'?lgNode(V.side,V.home.id):null;void H;return tot;}
/* 前方 L 公尺內的斷軌 */
function railAheadCut(V,L){var p=V.pts;if(!p||!G.rld)return -1;var x=V.x,y=V.y,acc=0,cs=G.map.cs;for(var i=V.pi;i<p.length&&acc<L;i+=2){var tx=p[i],ty=p[i+1],d=dist(x,y,tx,ty),n=Math.max(1,Math.ceil(d/cs));for(var j=1;j<=n;j++){var k=cellAt(x+(tx-x)*j/n,y+(ty-y)*j/n);if(rlCut(k))return k;}acc+=d;x=tx;y=ty;}return -1;}
(function(){var b=lgMove;lgMove=function(V,st){if(!isTrain(V)||!G.rld||V.ph==='dead')return b(V,st);var k=railAheadCut(V,st+400);if(k<0)return b(V,st);var c=cellXY(k);
  if(rlKnown(k,V.side)){V.ph0=V.ph;V.ph='hold';V.tw=G.t;if(!V.cutLog){V.cutLog=1;logE(V.side,'log','補給列車在'+placeTxt(c[0],c[1])+'前停車：前方鐵道被破壞，等待修復或改道',V.x,V.y);}return;}
  /* 沒發現的斷軌：出軌 */var tot=trainLose(V,1,'wreck',null),S=lgStats(V.side);S.wreck=(S.wreck||0)+1;V.x=c[0];V.y=c[1];railDmg(c[0],c[1],60,255,-1,'wreck');
  logE(V.side,'log','✖ 補給列車在'+placeTxt(c[0],c[1])+'撞上被破壞的鐵道出軌，約 '+fmt(tot)+' 噸物資連同列車全毀',c[0],c[1]);if(G.onPause&&apOn('fac'))G.onPause('列車出軌');};})();
/* 鐵道受損（未斷）路段慢行 */
(function(){var b=lgSpeedAt;lgSpeedAt=function(V,load){var sp=b(V,load);if(isTrain(V)&&G.rld){var d=G.rld[cellAt(V.x,V.y)];if(d>30)sp*=0.4;}return sp;};})();
/* 空襲：白天敵方攻擊機、戰鬥機與轟炸機在 5 公里內就可能掃射或轟炸列車；沿線有本方防空時機率減半 */
function trainAir(V){var side=V.side,p=0,by=null,day=G.env.light>=0.3;(G._air||[]).forEach(function(a){if(a.side===side||a.st!=='air'||!alive(a)||a.task==='rtb')return;var s=ST(a);if(!(s.sa>0||s.ha>0))return;var d=dist(a.x,a.y,V.x,V.y);if(d>5000)return;var r=airRole(a);p+=(r==='attack'||r==='fighter'||r==='heli'?0.06:r==='bomber'?0.03:0.02)*(day?1:0.25);by=a;});
  if(p<=0)return;var aa=false;gridNear(V.x,V.y,3000,function(g){if(!aa&&g.side===side&&onMap(g)&&aaOf(g,ST(g))>0)aa=true;});if(aa)p*=0.5;if(rnd8()>=p)return;
  var f=0.25+0.55*rnd8(),kill=f>0.6,tot=trainLose(V,kill?1:f,kill?'wreck':'air',by),S=lgStats(V.side);S.air++;if(!kill){V.ph0=V.ph;V.ph='hold';V.tw=G.t+3000;}
  logE(V.side,'log',(kill?'✖ 補給列車在'+placeTxt(V.x,V.y)+'被'+(by?uName(by):'敵機')+'炸毀，約 '+fmt(tot)+' 噸物資付之一炬':'補給列車在'+placeTxt(V.x,V.y)+'遭'+(by?uName(by):'敵機')+'掃射，火車頭受損，損失約 '+fmt(tot)+' 噸物資，停車搶修約一小時'),V.x,V.y);}
/* 砲擊或轟炸落在列車附近 */
function trainNear(x,y,R,amt){(G.lgv||[]).forEach(function(V){if(!isTrain(V)||V.ph==='dead'||V.ph==='gone'||V.ph==='load'||V.ph==='unl')return;if(dist(V.x,V.y,x,y)>R+200)return;var f=clamp(amt/180,0.1,1)*(0.6+0.8*rnd8()),kill=f>0.7,tot=trainLose(V,kill?1:Math.min(0.9,f),kill?'wreck':'fire',null);
  logE(V.side,'log',(kill?'✖ 補給列車在'+placeTxt(V.x,V.y)+'遭砲火或炸彈命中全毀，約 '+fmt(tot)+' 噸物資損失':'補給列車在'+placeTxt(V.x,V.y)+'附近落彈，損失約 '+fmt(tot)+' 噸物資'),V.x,V.y);});}
(function(){var b=lgvStep;lgvStep=function(){b();(G.lgv||[]).forEach(function(V){if(isTrain(V)&&(V.ph==='out'||V.ph==='in'||V.ph==='ret')&&(G.step+V.id)%2===0)trainAir(V);});};})();
/* 鐵路尋路避開已知的斷軌 */
var RLSIDE=-1;
(function(){var b=lgPath;lgPath=function(m,x0,y0,x1,y1,side){RLSIDE=side;var C=G._lgpc;if(LGM[m]&&LGM[m].rail&&C&&(C.rlv||0)!==(G._rlv||0)){G._lgpc={n:0,v:G._mapv||0,rlv:G._rlv||0};}try{return b(m,x0,y0,x1,y1,side);}finally{RLSIDE=-1;}};})();
function rlBlocked(q){return rlCut(q)&&(RLSIDE<0||rlKnown(q,RLSIDE));}
/* 運量：車站的列車盡量滿載，吞吐量大時一次發兩列 */
function railLot(N,pay2){return Math.min(pay2*2,Math.max(pay2*0.6,N.thr/2));}
/* ---------- 鐵路搶修隊：本方後方、附近沒有敵軍的斷軌慢慢修復（約半天）；工兵「修鐵道」快得多 ---------- */
function railStep(){var D=G.rld;if(!D)return;var L=G.rlc||[],keep=[];L.forEach(function(q){var k=q.k,x=q.x,y=q.y,MP=G.map;var en=sAV(false),own=sAV(false);gridNear(x,y,10000,function(u){if(!onMap(u)||!isLeaf(u)||u.side<0||u.side>=nSides()||ST(u).dom!=='land')return;var d=dist(u.x,u.y,x,y);if(d<4000)en[u.side]=true;if(d<10000)own[u.side]=true;});
    var safe=nSides()<3?(own[0]&&!en[1])||(own[1]&&!en[0]):SIDES().some(function(s){return own[s]&&hostSides(s).every(function(h){return !en[h];});});if(safe&&G.t-q.t>3600){var any=false;brushCells(MP,x/MP.cs,y/MP.cs,Math.max(1,300/MP.cs),function(c){if(D[c]>0){D[c]=Math.max(0,D[c]-6);if(D[c]>0)any=true;}});if(!any){q.fixed=G.t;G._rlv=(G._rlv||0)+1;return;}}
    var still=false;brushCells(MP,x/MP.cs,y/MP.cs,Math.max(1,300/MP.cs),function(c){if(D[c]>0)still=true;});if(still)keep.push(q);else G._rlv=(G._rlv||0)+1;});G.rlc=keep;}
(function(){var b=v8Step;v8Step=function(){b();if(G.step%20===17)railStep();if(G.step%20===9)railGue();};})();
/* 游擊隊破壞鐵路：敵方控制區內、附近沒有敵軍警衛時 */
function railGue(){var MP=G.map;G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||u.ms==='rout')return;var s=ST(u);if(s.fl.indexOf('G')<0||u._ed<1500)return;if(rnd()>0.08)return;var best=-1,bd=4000;brushCells(MP,u.x/MP.cs,u.y/MP.cs,Math.ceil(4000/MP.cs),function(k){if(!(MP.rl[k]&1)||rlCut(k))return;var c=cellXY(k),d=dist(c[0],c[1],u.x,u.y);if(d<bd){bd=d;best=k;}});if(best<0)return;
  var c=cellXY(best),guard=false;gridNear(c[0],c[1],2000,function(q){if(!guard&&hostile(u.side,q.side)&&onMap(q)&&ST(q).dom==='land'&&dist(q.x,q.y,c[0],c[1])<2000)guard=true;});if(guard)return;
  if(railDmg(c[0],c[1],80,255,u.side,'gue'))logE(u.side,'gue',uName(u)+'炸毀了'+placeTxt(c[0],c[1])+'的鐵路',c[0],c[1],u.id);});}
/* ---------- 命令：破壞鐵道、修鐵道 ---------- */
function canRailCut(u){var s=ST(u);return s.dom==='land'&&(isEng(u)||s.fl.indexOf('G')>=0||s.fl.indexOf('J')>=0||s.fl.indexOf('r')>=0||clsOf(u)==='rec');}
function railNearCell(x,y,R,pred){var MP=G.map,best=-1,bd=R;brushCells(MP,x/MP.cs,y/MP.cs,Math.ceil(R/MP.cs),function(k){if(!(MP.rl[k]&1)||pred&&!pred(k))return;var c=cellXY(k),d=dist(c[0],c[1],x,y);if(d<bd){bd=d;best=k;}});return best;}
(function(){var b=engAct;engAct=function(u,o){var k=o.k;if(k!=='railcut'&&k!=='railfix')return b(u,o);var s=ST(u);
  var rk=k==='railcut'?railNearCell(o.x,o.y,800,function(q){return !rlCut(q);}):railNearCell(o.x,o.y,o.rr||1500,function(q){return G.rld&&G.rld[q]>0;});
  if(rk<0){logE(u.side,'eng',uName(u)+(k==='railcut'?'：指定地點附近 800 公尺內沒有鐵道':'：指定地點附近沒有受損的鐵道'),u.x,u.y,u.id);u.task='hold';o.st='done';return true;}
  var c=cellXY(rk),p=validPos(s,c[0],c[1]);o.wx=c[0];o.wy=c[1];o.rk=rk;o.ph='go';if(dist(u.x,u.y,p[0],p[1])<300)u.task='at';else{u.task='go';wantPath(u,p[0],p[1]);}return true;};})();
(function(){var b=engLeaf;engLeaf=function(u,s){var o=u.ord;if(o&&o.ph&&(o.k==='railcut'||o.k==='railfix'))return railWork(u,o);return b(u,s);};})();
function railWork(u,o){if(o.ph==='go'){if(u.task==='go'&&(u.path||u.pq))return false;if(dist(u.x,u.y,o.wx,o.wy)>700){o.tries=(o.tries||0)+1;if(o.tries>3){logE(u.side,'eng',uName(u)+'：無法抵達鐵道',u.x,u.y,u.id);o.st='done';u.task='hold';return true;}var p=validPos(ST(u),o.wx,o.wy);u.task='go';wantPath(u,p[0],p[1]);return false;}
    o.ph='work';o.t0=G.t;u.task='work2';u.path=null;logE(u.side,'eng',uName(u)+(o.k==='railcut'?'開始在'+placeTxt(o.wx,o.wy)+'安放炸藥破壞鐵道':'開始搶修'+placeTxt(o.wx,o.wy)+'的鐵道'),u.x,u.y,u.id);return true;}
  if(o.ph!=='work')return false;var uf=G.t-(u.uf||-1e9)<120;
  if(o.k==='railcut'){if(G.t-o.t0<(isEng(u)?1200:1800)*(uf?2:1))return true;var n=railDmg(o.wx,o.wy,isEng(u)?150:90,255,u.side,'eng');logE(u.side,'eng',uName(u)+'炸毀了'+placeTxt(o.wx,o.wy)+'的鐵道'+(n>1?'（約 '+fmt(n*G.map.cs)+' 公尺）':''),o.wx,o.wy,u.id);o.st='done';o.ph='done';u.task='hold';return true;}
  var D=rlArr(),bud=rfRate(u)*0.3*DT/3600*Math.max(0.35,strFrac(u))*(uf?0.3:1),R=o.rr||1500,left=0;brushCells(G.map,o.wx/G.map.cs,o.wy/G.map.cs,Math.ceil(R/G.map.cs),function(k){if(D[k]>0&&bud>0){var a=Math.min(D[k],bud);D[k]-=a;bud-=a;}left+=D[k];});u.fat=clamp(u.fat+0.02,0,100);
  if(left<=0){G._rlv=(G._rlv||0)+1;logE(u.side,'eng',uName(u)+'修復了'+placeTxt(o.wx,o.wy)+'一帶的鐵道，列車恢復通行（費時 '+durTxt(G.t-o.t0)+'）',o.wx,o.wy,u.id);o.st='done';o.ph='done';u.task='hold';}return true;}
/* 編制層級：交給轄下第一個能執行的單位 */
(function(){var b=planOrder;planOrder=function(F,o){if(o.k!=='railcut'&&o.k!=='railfix')return b(F,o);var L=leavesOf(F).filter(function(l){return alive(l)&&onMap(l)&&(o.k==='railcut'?canRailCut(l):isEng(l)||ST(l).fl.indexOf('f')>=0);}).sort(function(a,c){return dist(a.x,a.y,o.x,o.y)-dist(c.x,c.y,o.x,o.y);});
  if(!L.length){logE(F.side,'eng',uName(F)+'沒有可以'+ORDN[o.k]+'的單位',o.x,o.y,F.id);return [];}return [[L[0],newOrder(o.k,{x:o.x,y:o.y,rr:o.rr})]];};})();
