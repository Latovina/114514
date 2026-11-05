/* ===================== AI 指揮官 v2：個性與打法變體、行為樹、指揮鏈指令、情報驗證與合理失誤、尋找突破口、玩家扮演單一梯隊、請求與回覆 =====================
   指揮鏈：陣營最高司令部的 AI（多為指揮型）評估全局，對下級編制下達指令；指令經指揮鏈延遲送達後，
   下級 AI 依自己的風格改寫並執行（魯莽者正面猛攻、謹慎者先偵察再砲擊、智謀者改打附近的弱點、游擊型改為襲擾……）。
   同一種 AI 有數種打法變體，參數再加上隨機偏差，因此同型 AI 也會有不同的作戰習慣。 */
/* 個性：名稱、說明、變體 [名稱, 說明, 參數覆寫]；參數：agg 侵略、tol 傷亡容忍、intel 情報要求、res 預備隊、prep 砲火準備、err 失誤、flank 迂迴、deep 縱深、logi 後勤、fire 火力、hold 固守、night 夜戰 */
var AIT={
 cmd:['指揮型','評估全局、分配主攻與助攻、協調砲兵與預備隊，讓下級依自己的風格執行',[['協同指揮','主攻、助攻與預備隊分工明確',{}],['集中指揮','把兵力與火力集中在單一主攻方向',{flank:0.2,fire:0.7}],['分散授權','只下達意圖，給下級較大的自主權',{res:0.15,agg:0.55}]]],
 bal:['均衡型','依準則按部就班，攻守平衡',[['教範派','照準則部署、保留三分之一預備隊',{}],['機會主義','發現敵軍弱點立即追擊擴張',{agg:0.65,deep:0.5}],['穩健派','重視側翼與補給，避免冒進',{agg:0.4,logi:0.6}]]],
 smart:['智謀型','反覆驗證情報、尋找接合部與側翼的突破口',[['情報驗證','情報確認後才行動，攻擊敵軍接合部',{intel:0.75,err:0.03}],['欺敵佯動','以佯攻吸引預備隊，主攻在另一方向',{flank:0.8}],['間接路線','避開正面，迂迴切斷補給線',{flank:0.9,deep:0.7}]]],
 reck:['魯莽型','不計代價進攻，以最小成本控制領土與後勤，常造成不必要的傷亡',[['人海衝鋒','不等砲兵，正面猛攻',{agg:0.95,tol:85,prep:0,intel:0,err:0.2,res:0}],['裝甲狂飆','機動部隊不等步兵，直插縱深',{agg:0.9,tol:70,deep:0.9,intel:0.05,logi:0.1}],['夜襲狂','偏好夜間突擊',{agg:0.85,tol:75,night:1,intel:0.1}]]],
 caut:['謹慎型','情報與火力準備充分才行動，傷亡較低但節奏慢',[['步步為營','每推進一段就先鞏固',{agg:0.35,tol:20,intel:0.6,res:0.4}],['火力先行','長時間砲火準備後才進攻',{agg:0.4,prep:60,fire:0.9}],['情報至上','情報不足時寧可不動',{agg:0.35,intel:0.85}]]],
 cons:['過度保守型','極少主動進攻、等待絕對優勢，常錯失良機',[['據壘死守','只防守與構工',{agg:0.05,hold:0.95,res:0.45}],['待援','等待三倍以上優勢才行動',{agg:0.15,intel:0.7}],['不敢冒險','遇到損失立即後撤',{agg:0.2,tol:10,hold:0.2}]]],
 gue:['游擊型','避免決戰，以小部隊襲擾補給線與後方、伏擊後即撤',[['襲擾補給','襲擊補給線、砲兵與指揮所',{agg:0.5,deep:0.8,tol:25}],['伏擊專家','在道路兩側設伏、打了就跑',{agg:0.4,tol:20}],['化整為零','分散隱蔽，伺機集中出擊',{agg:0.35,res:0.3}]]],
 logi:['後勤型','以補給線為核心推進，先奪取城鎮、道路與補給點',[['補給線優先','沿道路推進並保護補給站',{logi:0.95,agg:0.45}],['以戰養戰','優先奪取城鎮與補給設施',{logi:0.8,agg:0.6}],['基地推進','先建立前進補給站再推進',{logi:1,agg:0.4,prep:20}]]],
 fire:['火力型','以砲兵與空中火力消耗敵軍，再以步兵收拾',[['消耗戰','長時間砲擊，減少己方傷亡',{fire:1,prep:60,agg:0.45}],['定點拔除','集中火力逐一拔除據點',{fire:0.9,prep:45}],['反砲兵優先','先壓制敵砲兵再推進',{fire:0.9,prep:30}]]],
 man:['機動型','以速度與機動取勝：突破、迂迴與包圍',[['閃擊','高速突破、繞過據點直插縱深',{agg:0.8,deep:0.9,flank:0.5,tol:50}],['包圍殲滅','以鉗形攻勢包圍敵軍',{agg:0.7,flank:1}],['縱深打擊','以空降、機降與機動部隊打擊敵後',{deep:1,agg:0.65}]]],
 def:['防禦反擊型','以防禦消耗敵軍，再以預備隊反擊',[['彈性防禦','以空間換取時間，再反擊',{agg:0.3,res:0.45,hold:0.4}],['反斜面','隱蔽於反斜面，近距離殲敵',{agg:0.25,hold:0.8}],['逆襲','預備隊伺機猛烈反擊',{agg:0.45,res:0.5}]]]};
var AIP0={agg:0.5,tol:35,intel:0.4,res:0.3,prep:15,err:0.08,flank:0.5,deep:0.4,logi:0.5,fire:0.5,hold:0.5,night:0};
/* 依指揮官性格推定個性 */
function aiAuto(F){var o=F.off||{},q=function(k){return hasQ(o,k);};if(q('reckless'))return 'reck';if(q('careful'))return o.ini<=4?'cons':'caut';if(q('logist'))return 'logi';if(q('arty'))return 'fire';if(q('cavalier'))return 'man';if(q('stubborn'))return 'def';if(q('scout')||q('staff'))return 'smart';if((o.agg||5)>=8)return 'man';if((o.agg||5)<=3)return 'caut';return 'bal';}
/* 取得（並快取）編制的 AI 參數：個性、變體、偏差 */
function aiOf(F){var a=F.aip||(F.aip={t:'auto',v:-1});var t=a.t==='auto'||!AIT[a.t]?(F.p<0&&!isLeaf(F)?'cmd':aiAuto(F)):a.t;if(!a._P||a._t!==t||a._v!==a.v){var r=mb32(hstr((G.set.seed||'')+'|ai|'+F.id)),v=a.v>=0&&a.v<AIT[t][2].length?a.v:Math.floor(r()*AIT[t][2].length),P=Object.assign({},AIP0,AIT[t][2][v][2]);
    for(var k in P)if(typeof P[k]==='number'&&k!=='prep'&&k!=='tol')P[k]=clamp(P[k]+(r()-0.5)*0.16,0,1);P.tol=clamp(P.tol+(r()-0.5)*10,5,95);P.prep=Math.max(0,Math.round(P.prep+(r()-0.5)*10));P.t=t;P.v=v;a._P=P;a._t=t;a._v=a.v;}return a._P;}
function aiName(F){var P=aiOf(F);return AIT[P.t][0]+'・'+AIT[P.t][2][P.v][0];}
/* ---------- 玩家扮演的梯隊 ---------- */
function inTree(u,root){var c=u;while(c){if(c.id===root)return true;c=c.p>=0?uById(c.p):null;}return false;}
function playerOwns(side,u){var S=SD(side);if(!S.ai)return true;return S.pu>0&&inTree(u,S.pu);}
function aiControls(u){var S=SD(u.side);if(!S.ai)return false;if(S.pu>0&&inTree(u,S.pu))return false;return true;}
/* ---------- 行為樹 ---------- */
function BS(n){return {t:'sel',n:n,c:[].slice.call(arguments,1)};}function BQ(n){return {t:'seq',n:n,c:[].slice.call(arguments,1)};}function BC(n,f){return {t:'cond',n:n,f:f};}function BA(n,f){return {t:'act',n:n,f:f};}
function btRun(nd,X,tr){var r;if(nd.t==='cond')r=nd.f(X)?'S':'F';else if(nd.t==='act')r=nd.f(X)?'S':'F';else if(nd.t==='sel'){r='F';for(var i=0;i<nd.c.length;i++){if(btRun(nd.c[i],X,tr)==='S'){r='S';break;}}}else{r='S';for(var j=0;j<nd.c.length;j++){if(btRun(nd.c[j],X,tr)!=='S'){r='F';break;}}}if(tr&&nd.n)tr.push([nd.n,r]);return r;}
/* 各個性的指揮行為樹（同一棵骨架、不同的條件門檻與順序） */
function aiTree(t){var crisis=BQ('危急：全線後撤',BC('戰力崩潰或多數潰散',function(X){return X.me.f<(X.P.hold>0.8?0.2:0.35)&&X.ratio<0.7;}),BA('下令遲滯後撤',actWithdraw)),
  dir=BQ('執行上級指令',BC('收到上級指令',function(X){return !!X.dir;}),BA('依風格執行',actDirective)),
  help=BQ('支援危急友軍',BC('有部隊陷入危機',function(X){return X.threat.length>0&&X.res;}),BA('投入預備隊反擊',actCommitRes)),
  intel=BQ('驗證情報',BC('情報不足',function(X){return X.intelQ<X.P.intel&&X.P.intel>0.15;}),BA('派遣偵察',actRecon)),
  blind=BQ('無情報時的冒險',BC('完全沒有敵情',function(X){return X.en.length===0&&G.t>1800;}),BA('隨機選擇方向試探',actBlind)),
  brk=BQ('攻擊突破口',BC('進攻條件成立',function(X){return X.post==='attack';}),BA('選擇突破口與戰術',actAttack)),
  sup=BQ('補給優先',BC('補給不足',function(X){return X.oos>0.3||X.ammo<30;}),BA('建立補給站或奪取補給點',actLogi)),
  pers=BQ('勸降',BC('有被圍的敵軍',function(X){return X.encEn.length>0;}),BA('派部隊勸降',actPersuade)),
  raid=BQ('襲擾',BC('可襲擊的後方目標',function(X){return X.soft.length>0;}),BA('襲擊補給與後方',actRaid)),
  def=BA('防禦與構工',actDefend);
  var T={cmd:BS('指揮型',crisis,help,intel,brk,sup,pers,def),bal:BS('均衡型',crisis,dir,help,brk,sup,def),smart:BS('智謀型',crisis,dir,intel,help,brk,pers,def),reck:BS('魯莽型',dir,brk,blind,def),caut:BS('謹慎型',crisis,dir,intel,sup,help,brk,def),
    cons:BS('過度保守型',crisis,help,sup,def),gue:BS('游擊型',crisis,raid,dir,def),logi:BS('後勤型',crisis,sup,dir,brk,def),fire:BS('火力型',crisis,dir,intel,brk,help,def),man:BS('機動型',crisis,dir,brk,help,def),def:BS('防禦反擊型',crisis,dir,help,def)};
  return T[t]||T.bal;}
/* ---------- 態勢評估（黑板） ---------- */
function aiAssess(side,F,groups,aoi){var P=aiOf(F),S=SD(side),en=enemyPic(side,3600).filter(function(c){return c.dom!=='air';});if(aoi){var CF=cOf(F)||[F.x,F.y];en=en.filter(function(c){return dist(c.x,c.y,CF[0],CF[1])<aoi;});}var fresh=en.filter(function(c){return G.t-c.t<1200&&c.q>=1;}),me=sideStr(side),ens=sideStr(enemyOf(side));
  var r=mb32(hstr(G.set.seed+'|est|'+F.id+'|'+Math.floor(G.t/3600))),intelQ=en.length?fresh.length/en.length:0,noise=(1-intelQ)*0.6*gauss(r),enM=sum(en,function(c){return (c.men||0)+(c.veh||0)*8;})*Math.max(0.3,1+noise),myM=me.m;
  var L=leavesOf(F).filter(onMap),oos=L.length?L.filter(function(u){return (u.oos||0)>3*3600;}).length/L.length:0,ammo=L.length?sum(L,function(u){return u.ammo;})/L.length:100;
  var threat=groups.filter(function(g){var GL=leavesOf(g).filter(onMap);if(!GL.length)return false;var mor=sum(GL,function(x){return x.mor;})/GL.length,eng=GL.filter(function(x){return G.t-(x.uf||-1e9)<600;}).length;return eng>=Math.max(1,GL.length/3)&&mor<55;});
  var encEn=en.filter(function(c){var e=uById(c.id);return e&&onMap(e)&&isLeaf(e)&&(e.besieged&&G.t-e.besieged<1800||G.t-(e.encT||-1e9)<1800);}),soft=en.filter(function(c){return /sup|hq|art|rkt/.test(c.br||'')&&G.t-c.t<1800;});
  var X={side:side,F:F,P:P,groups:groups,en:en,fresh:fresh,intelQ:intelQ,enM:enM,myM:myM,ratio:enM>0?myM/enM:9,me:me,ens:ens,oos:oos,ammo:ammo,threat:threat,encEn:encEn,soft:soft,objs:G.obj||[],dir:F.aidir&&G.t-F.aidir.t<6*3600?F.aidir:null,trace:[],acts:[],night:G.env.light<0.3,lvl:G.set.aiLvl===undefined?1:G.set.aiLvl};
  X.notMine=X.objs.filter(function(o){return objTgt(side,o);});X.mine=X.objs.filter(function(o){return o.own===side||o.own<0;});
  var thr=1.8-P.agg*1.4;X.post=S.post&&S.post!=='auto'?S.post:X.lvl===0?'defend':(X.ratio>=thr||(X.notMine.length&&P.agg>=0.6&&X.ratio>=thr*0.7&&G.t>1800))?'attack':'defend';
  if(X.post==='defend'&&X.night&&P.night>0.5&&X.ratio>=thr*0.6)X.post='attack';if(atPeace(side)&&(!S.post||S.post==='auto'))X.post='defend';
  var man=groups.filter(function(g){var ro=roleOf(g);return (ro==='man'||ro==='rec')&&!busyF(g);});X.man=man;X.res=null;var rc=man.filter(function(g){return !(isLeaf(g)&&(isBridger(g)||isEng(g)));});/* 工兵、架橋部隊不當作戰鬥預備隊 */if(man.length>=3&&rc.length>=1&&P.res>0.15){X.res=rc.slice().sort(function(a,b){var ca=cOf(a),cb=cOf(b),h=homeDir(side);return (ca?-(ca[0]*Math.cos(h)+ca[1]*Math.sin(h)):0)-(cb?-(cb[0]*Math.cos(h)+cb[1]*Math.sin(h)):0);})[0];}
  return X;}
/* ---------- 尋找突破口：敵軍接合部、側翼、薄弱與潰散的部隊、後方高價值目標 ---------- */
function weakPoints(X,C){var en=X.en.filter(function(c){return c.dom==='land';}),out=[];if(!en.length)return out;var cells={},K=2000;en.forEach(function(c){var k=Math.floor(c.x/K)+'|'+Math.floor(c.y/K),g=cells[k]||(cells[k]={x:0,y:0,m:0,n:0,shk:0,soft:0});g.x+=c.x;g.y+=c.y;g.n++;g.m+=(c.men||0)+(c.veh||0)*8;if(c.ms&&c.ms!=='ok')g.shk++;if(/sup|hq|art|rkt/.test(c.br||''))g.soft++;});
  var G2=Object.keys(cells).map(function(k){var g=cells[k];return {x:g.x/g.n,y:g.y/g.n,m:g.m,n:g.n,shk:g.shk,soft:g.soft};});
  G2.forEach(function(g){var nb=sum(G2,function(q){return q!==g&&dist(q.x,q.y,g.x,g.y)<5000?q.m:0;}),v=(1+g.soft*0.6+g.shk*0.5)/(1+(g.m+nb*0.4)/1500)/(1+dist(C[0],C[1],g.x,g.y)/15000);out.push({x:g.x,y:g.y,v:v,why:g.shk?'敵軍動搖':g.soft?'敵後方目標':'敵軍薄弱'});});
  /* 接合部：兩個敵群之間 */for(var i=0;i<G2.length;i++)for(var j=i+1;j<G2.length;j++){var a=G2[i],b=G2[j],d=dist(a.x,a.y,b.x,b.y);if(d>3500&&d<9000){var mx=(a.x+b.x)/2,my=(a.y+b.y)/2,near=sum(G2,function(q){return dist(q.x,q.y,mx,my)<2000?q.m:0;});if(near<200)out.push({x:mx,y:my,v:1.2/(1+dist(C[0],C[1],mx,my)/15000),why:'敵軍接合部'});}}
  out.sort(function(a,b){return b.v-a.v;});return out.slice(0,6);}
/* ---------- 行動 ---------- */
function aiSay(X,txt,d){var F=X.F,who=(F.off?F.off.rank+F.off.name:uName(F))+'（'+aiName(F)+'）';logE(X.side,'ai',who+'：'+txt);decLog(X.side,who,txt,d||{});X.acts.push(txt);}
function actWithdraw(X){var h=homeDir(X.side),n=0;X.groups.forEach(function(g){var Cw=cOf(g);if(Cw&&inWalls(Cw[0],Cw[1])&&X.P.hold>0.2){/* 守城：城破之前不棄城 */return;}if(pDir(X,g)){var C1=cOf(g);if(C1){var w1=validPos({dom:'land'},C1[0]+Math.cos(h)*4000,C1[1]+Math.sin(h)*4000);aiOrder(X,g,'delay',{x:w1[0],y:w1[1],face:h+PI});}return;}if(busyF(g)||!aiControls(g))return;var C=cOf(g);if(!C)return;var wp=validPos({dom:'land'},C[0]+Math.cos(h)*4000,C[1]+Math.sin(h)*4000);if(!g.ord||g.ord.dk!=='delay'){issue(g,'delay',{x:wp[0],y:wp[1],face:h+PI});n++;}});if(n){var Cx=cOf(X.F);if(Cx)askPeer(X,{x:Cx[0],y:Cx[1]},'hold');}if(n)aiSay(X,'戰況惡化，全線改採遲滯後撤',{why:'己方戰力 '+pct(X.me.f*100)+'，估計兵力比 '+fx(X.ratio,2)});return n>0;}
function actCommitRes(X){var res=X.res;if(!res||busyF(res)||!aiControls(res))return false;var t=X.threat[0],tc=cOf(t),ec=tc&&enemyCentroid(X.side,tc[0],tc[1],4000);if(!ec)return false;var P=X.P;issue(res,P.agg>0.6?'attack':'defend',{x:ec[0],y:ec[1],opt:{tac:P.flank>0.7?'flank':'frontal',tol:P.tol}});aiSay(X,'投入預備隊'+uName(res)+(P.agg>0.6?'反擊':'增援')+'，支援'+uName(t));return true;}
function actRecon(X){var tg=X.notMine[0]||null,C=cOf(X.F)||[X.F.x,X.F.y],P=tg?[tg.x,tg.y]:enemyCentroid(X.side,C[0],C[1])||[G.map.Wm/2,G.map.Hm/2],n=0;
  G.units.forEach(function(u){if(n>=2||u.side!==X.side||!isLeaf(u)||!onMap(u)||busyF(u)||!aiControls(u))return;var c=clsOf(u);if(c==='rec'||(c==='air'&&ST(u).fl.indexOf('r')>=0)||c==='uav'){issue(u,'recon',{x:P[0]+(rnd()-0.5)*3000,y:P[1]+(rnd()-0.5)*3000});n++;}});
  var F=X.F;F.aiV=(F.aiV||0)+1;if(!n||F.aiV>3){F.aiV=0;return false;}aiSay(X,'情報不足（新鮮情報比例 '+pct(X.intelQ*100)+'），派遣偵察驗證敵情（第 '+F.aiV+' 次）',{intel:X.intelQ});return true;}
function actBlind(X){var r=mb32(hstr(G.set.seed+'|blind|'+Math.floor(G.t/7200))),MP=G.map,tg=X.notMine.length?X.notMine[Math.floor(r()*X.notMine.length)]:null,P=tg?[tg.x,tg.y]:[MP.Wm*(0.3+0.4*r()),MP.Hm*(0.2+0.6*r())],g=X.man[Math.floor(r()*Math.max(1,X.man.length))];if(!g||!aiControls(g))return false;
  issue(g,'attack',{x:P[0],y:P[1],opt:{tac:'probe',tol:X.P.tol,pace:'normal'}});aiSay(X,'沒有任何敵情，隨機派'+uName(g)+'往'+placeTxt(P[0],P[1])+'試探（可能撲空，也可能撞上敵主力）',{blind:1});return true;}
function actAttack(X){var P=X.P,n=0,used={},C0=cOf(X.F)||[X.F.x,X.F.y],wp=weakPoints(X,C0),r=mb32(hstr(G.set.seed+'|atk|'+X.F.id+'|'+Math.floor(G.t/3600)));
  /* 合理失誤：情報差時有機會誤判主攻方向 */var err=P.err*(1-X.intelQ)*1.5,mistake=r()<err;
  var men=X.man.filter(function(g){return g!==X.res&&aiControls(g);}),pm=X.man.filter(function(g){return g!==X.res&&pDir(X,g);});if(!men.length&&!pm.length)return false;var main=wp[0];if(P.t==='logi'||!main){var tgO=X.notMine.slice().sort(function(a,b){return dist(C0[0],C0[1],a.x,a.y)-dist(C0[0],C0[1],b.x,b.y);})[0];if(tgO&&(P.logi>0.7||!main))main={x:tgO.x,y:tgO.y,why:'奪取目標（'+tgO.name+'）'};}
  if(!main)return false;if(mistake&&wp.length>1){main=wp[wp.length-1];}var feint=P.t==='smart'&&AIT.smart[2][P.v][0]==='欺敵佯動'&&men.length>=2;
  men.forEach(function(g,i){if(busyF(g))return;var C=cOf(g);if(!C)return;var tg=i===0||!wp[i%Math.max(1,wp.length)]?[main.x,main.y]:[wp[i%wp.length].x,wp[i%wp.length].y];if(feint&&i===0){issue(g,'attack',{x:tg[0],y:tg[1],opt:{tac:'feint',prep:P.prep,tol:20}});n++;return;}
    var ok=aiAttack(X.side,g,C,tg,X.en,X.groups.some(function(f){return roleOf(f)==='fire';}),X.lvl);if(ok&&g.ord){/* 依個性改寫最新的命令選項（於傳遞途中） */}n+=ok?1:0;used[g.id]=1;});
  pm.forEach(function(g,i){var t=wp[(i+men.length)%Math.max(1,wp.length)]||main;if(aiOrder(X,g,'attack',{x:t.x,y:t.y,opt:{tac:'firemove',tol:P.tol}}))n++;});
  X.groups.forEach(function(f){if(roleOf(f)==='fire'&&pDir(X,f)){aiOrder(X,f,'bombard',{x:main.x,y:main.y,r:600});return;}if(roleOf(f)==='fire'&&aiControls(f)&&(isLeaf(f)?[f]:leavesOf(f)).some(function(q){return sgDirect(ST(q));})){/* 攻城砲：推進到城牆射程內持續轟擊（目標固定為最近的敵方有城牆的目標，不隨主攻方向改變） */var Cf=cOf(f)||[f.x,f.y],wo=X.notMine.filter(function(q){return inWalls(q.x,q.y);}).sort(function(a,b){return dist(Cf[0],Cf[1],a.x,a.y)-dist(Cf[0],Cf[1],b.x,b.y);})[0]||main;
    if(!(f.ord&&f.ord.k==='bombard'&&f.ord.x!==undefined&&dist(f.ord.x,f.ord.y,wo.x,wo.y)<Math.max(2500,obR(wo)*2))&&!(f.pend&&f.pend.length)&&!G.msgs.some(function(q){return q.to===f.id;}))issue(f,'bombard',{x:wo.x,y:wo.y,r:300,dur:12*3600});return;}if(roleOf(f)==='fire'&&!busyF(f)&&aiControls(f)){var m=men[0];issue(f,P.fire>0.8?'bombard':'support',P.fire>0.8?{x:main.x,y:main.y,r:600,dur:Math.max(1800,P.prep*60)}:{sup:m?m.id:undefined});}});
  aiAir(X,main);aiNav(X,main);var mk=Math.round(main.x/1500)+'|'+Math.round(main.y/1500);if(n&&(X.F.aiMk!==mk||G.t-(X.F.aiMkT||-1e9)>2*3600)){X.F.aiMk=mk;X.F.aiMkT=G.t;}else n=0;if(n)askPeer(X,main,'attack');if(n)aiSay(X,'主攻方向：'+placeTxt(main.x,main.y)+'（'+main.why+'）'+(feint?'，以佯攻牽制':'')+(mistake?'——研判錯誤，主攻選在非要害方向':''),{why:main.why,intel:X.intelQ,est:Math.round(X.enM),mistake:mistake});if(!n&&X.groups.some(function(g){var o=g.ord;return o&&/attack|storm|breakthrough|crossing|siege|penetrate|joint/.test(o.k)&&o.st!=='done'&&G.t-(o.t1||o.ti)<6*3600;})){/* 進攻仍在進行：不必改採防禦 */return true;}return n>0;}
/* 向友鄰的玩家部隊請求協同（平行單位沒有指揮權，只能請求；經指揮鏈傳遞，有延遲） */
function askPeer(X,P,k){var S=SD(X.side);if(!S.ai||!(S.pu>0)||!P)return;var R=uById(S.pu);if(!R||!alive(R)||isLeaf(R)||inTree(R,X.F.id)||inTree(X.F,R.id))return;if(G.t-(X.F.peerT||-1e9)<3*3600)return;var C=cOf(R);if(!C||dist(C[0],C[1],P.x,P.y)>20000)return;X.F.peerT=G.t;reqSend(X.F,R,k,{x:P.x,y:P.y});aiSay(X,'請求友鄰'+uName(R)+'（玩家指揮）'+REQN[k]+'（'+placeTxt(P.x,P.y)+'）');}
/* 艦隊：有敵艦先打敵艦，否則以艦砲支援主攻方向（射程內） */
function aiNav(X,main){X.groups.forEach(function(g){if(roleOf(g)!=='nav'||busyF(g)||!aiControls(g))return;var C=cOf(g);if(!C)return;var sea=X.en.filter(function(c){return (c.dom==='sea'||c.dom==='sub')&&G.t-c.t<1800;}).sort(function(p,q){return dist(C[0],C[1],p.x,p.y)-dist(C[0],C[1],q.x,q.y);});if(sea.length){issue(g,'attack',{x:sea[0].x,y:sea[0].y});return;}
  var s=ST(isLeaf(g)?g:leavesOf(g).filter(alive)[0]||g),rg=(s.ind||s.rM||0)*0.9;if(!rg)return;var land=X.en.filter(function(c){return c.dom==='land'&&G.t-c.t<1800&&dist(C[0],C[1],c.x,c.y)<rg;}).sort(function(p,q){return (main?dist(p.x,p.y,main.x,main.y):0)-(main?dist(q.x,q.y,main.x,main.y):0);});if(land.length)issue(g,'bombard',{x:land[0].x,y:land[0].y,r:400,dur:1800});});}
function aiAir(X,main){var air=X.groups.filter(function(g){return roleOf(g)==='air'&&!busyF(g)&&aiControls(g)&&!(isLeaf(g)&&isCarrier(g));});air.forEach(function(a){var land=X.en.filter(function(c){return c.dom==='land'&&G.t-c.t<900;}),best=null,bv=-1;land.forEach(function(c){var v=(c.men||0)+(c.veh||0)*20;if(/art|rkt|mor|hq|sup/.test(c.br||''))v*=1.6;if(main&&dist(c.x,c.y,main.x,main.y)<4000)v*=1.8;if(v>bv){bv=v;best=c;}});if(best)issue(a,'strike',{x:best.x,y:best.y,r:3000});});}
function actDefend(X){var n=0;X.groups.forEach(function(g){if(g!==X.res&&pDir(X,g)&&/man|fire/.test(roleOf(g))){var C1=cOf(g);if(C1){var d1=aiDefPos(X.side,C1,X.mine,X.en);aiOrder(X,g,roleOf(g)==='fire'?'support':'defend',{x:d1[0],y:d1[1],face:d1[2]});}return;}if(g===X.res||busyF(g)||!aiControls(g))return;var ro=roleOf(g);if(ro==='fire'){if(g.ord&&g.ord.k==='bombard'&&(isLeaf(g)?[g]:leavesOf(g)).some(function(q){return sgDirect(ST(q));}))return;/* 攻城砲持續轟擊城牆 */issue(g,'support',{});n++;return;}if(ro==='air'||ro==='nav'||ro==='sup')return;var C=cOf(g);if(!C)return;aiDefend(X.side,g,C,aiDefPos(X.side,C,X.mine,X.en),X.en,X.lvl);n++;});
  if(X.res&&!busyF(X.res)&&!X.res.ord&&aiControls(X.res)){var all=X.man.filter(function(g){return g!==X.res;}).map(cOf).filter(Boolean);if(all.length){var c=centroid(all.map(function(p){return {x:p[0],y:p[1]};})),h=homeDir(X.side),p=validPos({dom:'land'},c[0]+Math.cos(h)*2500,c[1]+Math.sin(h)*2500);issue(X.res,'reserve',{x:p[0],y:p[1]});}}
  aiNav(X,null);if(n&&(!X.F.aiDefT||G.t-X.F.aiDefT>4*3600)){X.F.aiDefT=G.t;aiSay(X,'轉入防禦，'+(X.P.hold>0.7?'據守陣地、構築工事':'保持機動預備隊'),{ratio:X.ratio});}return n>0;}
function actLogi(X){var top=X.F,eng=G.units.filter(function(u){return u.side===X.side&&isLeaf(u)&&onMap(u)&&isEng(u)&&!busyF(u)&&aiControls(u);})[0];if(!eng||(top.aiDepT&&G.t-top.aiDepT<8*3600))return false;var L=leavesOf(top).filter(onMap),C=L.length?centroid(L):null;if(!C)return false;var h=homeDir(X.side),p=validPos({dom:'land'},C[0]+Math.cos(h)*3000,C[1]+Math.sin(h)*3000);
  top.aiDepT=G.t;issue(eng,'build',{x:p[0],y:p[1],bk:'depot'});aiSay(X,'補給吃緊（脫離補給 '+pct(X.oos*100)+'、彈藥 '+fmt(X.ammo)+'%），命令'+uName(eng)+'在'+placeTxt(p[0],p[1])+'建立前進補給站');return true;}
function actPersuade(X){var F=X.F,top=F.p<0,t=X.encEn.filter(function(c){return !G.units.some(function(u){return u.side===X.side&&u.ord&&u.ord.k==='persuade'&&u.ord.x!==undefined&&dist(u.ord.x,u.ord.y,c.x,c.y)<2000;});})[0];if(!t||G.t-(F.persT||-1e9)<2*3600)return false;var e=uById(t.id),mine=function(u){return u.side===X.side&&isLeaf(u)&&onMap(u)&&aiControls(u)&&(top||inTree(u,F.id));};
  var psy=G.units.filter(function(u){return mine(u)&&ST(u).fl.indexOf('k')>=0&&!busyF(u);})[0];if(!psy){psy=G.units.filter(function(u){return mine(u)&&ST(u).dom==='land'&&dist(u.x,u.y,t.x,t.y)<3000&&roleOf(u)==='man';})[0];}
  var SP=SD(X.side).persT||(SD(X.side).persT={});if(SP[t.id]&&G.t-SP[t.id]<2*3600)return false;if(!psy||psy.ord&&psy.ord.k==='persuade')return false;F.persT=G.t;SP[t.id]=G.t;issue(psy,'persuade',{x:t.x,y:t.y});aiSay(X,'派'+uName(psy)+'對被圍的'+(e?uName(e):'敵軍')+'勸降');return true;}
function actRaid(X){var n=0;X.man.forEach(function(g){if(busyF(g)||!aiControls(g)||n>=2)return;var C=cOf(g);if(!C)return;var s=X.soft.slice().sort(function(a,b){return dist(C[0],C[1],a.x,a.y)-dist(C[0],C[1],b.x,b.y);})[0];if(!s)return;issue(g,'attack',{x:s.x,y:s.y,opt:{tac:'raid',tol:25,pace:'careful'}});n++;});if(n)aiSay(X,'以小部隊襲擊敵軍後方的砲兵、指揮所與補給');return n>0;}
/* 執行上級指令：依自己的風格改寫 */
function actDirective(X){var d=X.dir,F=X.F,P=X.P;X.F.aidir=null;if(!d)return false;var txt='接獲上級指令：'+(ORDN[d.k]||d.k)+'（'+placeTxt(d.x,d.y)+'）';
  if(d.k==='attack'&&P.agg<0.2){aiSay(X,txt+'，但認為兵力不足而只做有限度的試探',{refuse:1});issue(F,'attack',{x:d.x,y:d.y,opt:{tac:'probe',tol:P.tol}});return true;}
  issue(F,d.k,Object.assign({x:d.x,y:d.y,face:d.face},aiOpts(F,d.k,{})));aiSay(X,txt+'，依'+AIT[P.t][0]+'的方式執行');return true;}
/* 個性對命令選項的改寫（命令送達、開始規劃時呼叫） */
function aiOpts(F,k,opt){var P=aiOf(F),o=Object.assign({},opt||{}),t=P.t,v=AIT[t][2][P.v][0];
  if(k==='attack'||k==='storm'||k==='breakthrough'){o.tol=P.tol;o.prep=Math.max(o.prep||0,P.prep);if(t==='reck'){o.tac=v==='裝甲狂飆'?'break':'frontal';o.pace='rush';o.prep=0;}else if(t==='caut'||t==='cons'){o.pace='careful';o.tac=o.tac==='frontal'?'firemove':o.tac||'firemove';}else if(t==='man'){o.tac=v==='包圍殲滅'?'pincer':v==='閃擊'?'break':'flank';o.pace='rush';}else if(t==='smart'){o.tac=P.flank>0.7?'flank':o.tac||'firemove';}else if(t==='gue'){o.tac='raid';o.pace='careful';}else if(t==='fire'){o.tac='firemove';o.prep=Math.max(o.prep,45);}}
  if(k==='defend'){o.post=o.post||(t==='def'&&v==='反斜面'?'reverse':t==='def'&&v==='彈性防禦'?'mobile':t==='cons'?'prepared':t==='gue'?'ambush':P.res>0.4?'depth':'hasty');}
  return o;}
function aiAdjust(F,o){if(!F||isLeaf(F)||!aiControls(F)||!o||o.sub)return;if(o.k==='attack'||o.k==='defend'||o.k==='storm'||o.k==='breakthrough'){var n=aiOpts(F,o.k,o.opt||{});o.opt=Object.assign(o.opt||{},n);}}
/* ---------- 主程序：每 20 分鐘（依個性節奏）執行一次 ---------- */
function cmdrStep(side){var S=SD(side),top=sideCmd(side);if(!top||!S.ai)return;var groups=aiGroups(side);if(!groups.length)return;
  if(!aiControls(top)){/* 最高編制由玩家指揮：由其餘最大的 AI 編制統籌它自己的部隊與其他 AI 編制；平行的 AI 編制無權指揮玩家的部隊 */var T=tops(side).filter(function(t){return !isLeaf(t)&&!t.irr&&alive(t)&&aiControls(t);}).sort(function(a,b){return (b.ech||0)-(a.ech||0);})[0];if(!T)return;top=T;
    groups=kidsOf(T).filter(function(k){return alive(k)&&k.st!=='off';}).concat(tops(side).filter(function(t){return t!==T&&alive(t)&&t.st!=='off'&&!t.irr&&aiControls(t);}));if(!groups.length)return;}var X=aiAssess(side,top,groups),tr=[];btRun(aiTree(X.P.t),X,tr);top.aiTr=tr.slice(-24);top.aiT=G.t;
  /* 下級編制自己的 AI：在自己的轄區內主動處置 */groups.forEach(function(g){if(isLeaf(g)||!aiControls(g)||(g.ech||0)<3)return;if(G.t-(g.aiT||-1e9)<1800)return;g.aiT=G.t;var sub=kidsOf(g).filter(function(k){return alive(k)&&k.st!=='off';});if(sub.length<2)return;var Y=aiAssess(side,g,sub,[0,3000,5000,8000,12000,20000,40000,80000,200000][clamp(g.ech,0,8)]);Y.dir=null;var t2=[];btRun(aiLocalTree(Y.P.t),Y,t2);g.aiTr=t2.slice(-16);});
  aiNuke(side);}
/* 下級的局部行為樹：危機處置、請求支援、勸降、攻城與渡河準備 */
function aiLocalTree(t){return BS('局部處置',BQ('請求支援',BC('下級傷亡慘重或缺彈',function(X){return X.threat.length>0||X.ammo<25;}),BA('向上級請求',actReqUp)),BQ('勸降被圍敵軍',BC('有被圍的敵軍',function(X){return X.encEn.length>0&&X.P.agg>0.2;}),BA('派部隊勸降',actPersuade)),BQ('攻城準備',BC('前方有城牆',function(X){return wallAhead(X);}),BA('收集木材並打造雲梯',actSiegePrep)),BQ('渡河準備',BC('前方有河且沒有架橋器材',function(X){return riverPrep(X);}),BA('伐木打造浮橋或木筏',actRiverPrep)));}
function actReqUp(X){var F=X.F,P=F.p>=0?uById(F.p):null;if(!P||G.t-(F.reqT||-1e9)<3600)return false;F.reqT=G.t;var k=X.ammo<25?'ammo':X.threat.length?'fires':'reinf',L=leavesOf(F).filter(onMap),c=L.length?centroid(L):[F.x,F.y];reqSend(F,P,k,{x:c[0],y:c[1]});return true;}
function wallAhead(X){var o=X.F.ord;if(!o||o.x===undefined||!/attack|storm/.test(o.k))return false;var MP=G.map,R=Math.ceil(1500/MP.cs),w=0;brushCells(MP,o.x/MP.cs,o.y/MP.cs,R,function(k){if(MP.ft[k]===6||MP.ft[k]===5)w++;});if(!w)return false;var L=leavesOf(X.F).filter(onMap),lad=sum(L,function(u){return kitN(u,'ladder');}),men=sum(L,function(u){return u.men;});return lad<men/40&&!L.some(kitBusy);}
/* 已在收集或打造器材（含傳遞中與規劃中的命令） */
function kitBusy(u){var f=function(o){return o&&(o.k==='gather'||o.k==='craft');};return f(u.ord)||(u.pend||[]).some(f)||G.msgs.some(function(m){return m.to===u.id&&f(m.o);});}
function actSiegePrep(X){var L=leavesOf(X.F).filter(function(u){return onMap(u)&&ST(u).dom==='land'&&!busyF(u);}),w=L.filter(function(u){return isEng(u)||ST(u).fl.indexOf('f')>=0;})[0]||L.filter(function(u){return clsOf(u)==='inf';})[0];if(!w)return false;var need=Math.ceil(sum(leavesOf(X.F),function(u){return u.men;})/20);
  if(resTot(w)<KIT.ladder[1]*Math.min(need,30)){issue(w,'gather',{x:w.x,y:w.y,opt:{rk:'wood'}});aiSay(X,'前方有城牆，命令'+uName(w)+'伐木準備打造雲梯');}else{issue(w,'craft',{x:w.x,y:w.y,opt:{ck:'ladder',n:Math.min(need,40)}});aiSay(X,'命令'+uName(w)+'打造雲梯');}return true;}
function riverPrep(X){var o=X.F.ord;if(!o||o.x===undefined||!/attack|crossing/.test(o.k))return false;var C=cOf(X.F);if(!C)return false;var rv=riverOnAxis(C,[o.x,o.y]);if(!rv||bridgeNearPt(rv[0],rv[1],3000))return false;var L=leavesOf(X.F).filter(onMap);if(L.some(isBridger))return false;return !L.some(function(u){return kitN(u,'pont')>0||kitN(u,'raft')>=3||kitBusy(u);});}
function actRiverPrep(X){var L=leavesOf(X.F).filter(function(u){return onMap(u)&&ST(u).dom==='land'&&!busyF(u);}),w=L.filter(isEng)[0]||L.filter(function(u){return ST(u).fl.indexOf('f')>=0;})[0]||L.filter(function(u){return clsOf(u)==='inf';})[0];if(!w)return false;var ck=uEra(w).y<1700?'raft':'pont';
  if(resTot(w)<KIT[ck][1]*(ck==='pont'?1:3)){issue(w,'gather',{x:w.x,y:w.y,opt:{rk:'wood'}});aiSay(X,'前方河川沒有橋梁，命令'+uName(w)+'伐木');}else{issue(w,'craft',{x:w.x,y:w.y,opt:{ck:ck,n:ck==='pont'?1:4}});aiSay(X,'命令'+uName(w)+'打造'+KIT[ck][0]);}return true;}
/* ---------- 請求與回覆（受指揮鏈延遲影響） ---------- */
var REQN={fires:'火力支援',air:'空中支援',reinf:'增援',supply:'補給',ammo:'彈藥補給',attack:'協同進攻',hold:'掩護側翼',withdraw:'准許撤退',recon:'偵察',medevac:'傷患後送'};
function reqSend(from,to,k,d){if(!from||!to||!alive(to))return null;var h=hopDelay(from,to),m={id:(G.mid=(G.mid||0)+1),k:'req',rk:k,side:from.side,from:from.id,to:to.id,t0:G.t,ta:G.t+h.sec+60,via:[h.via],x:d&&d.x,y:d&&d.y,auto:d&&d.auto,txt:d&&d.txt||''};crLeg1(m,from,to,h);G.msgs.push(m);
  if(!(d&&d.auto)||!aiControls(from))logE(from.side,'req',uName(from)+'向'+uName(to)+'請求'+REQN[k]+'（約 '+durTxt(m.ta-G.t)+' 後送達）',from.x,from.y,from.id);return m;}
function reqDeliver(m){var to=uById(m.to),from=uById(m.from);if(!to||!from)return;
  if(m.k==='rep'){/* 回覆：AI 部隊回覆玩家部隊時才進收件匣（玩家自己送出的回覆不必再顯示） */if(!aiControls(to)&&aiControls(from)){(G.inbox=G.inbox||[]).push({id:m.id,t:G.t,side:to.side,k:'rep',from:m.from,to:m.to,txt:m.txt,ok:m.ok});if(G.onPause&&apOn('req'))G.onPause('收到回覆');}logE(to.side,'req',uName(from)+'回覆'+uName(to)+'：'+m.txt,from.x,from.y,from.id);return;}
  if(m.k==='dir'){/* 上級指令 */if(aiControls(to)){to.aidir={k:m.dk,x:m.x,y:m.y,face:m.face,t:G.t,from:m.from};}else{(G.inbox=G.inbox||[]).push({id:m.id,t:G.t,side:to.side,k:'dir',from:m.from,to:m.to,dk:m.dk,x:m.x,y:m.y,txt:'上級指令：'+(ORDN[m.dk]||m.dk)+'（'+placeTxt(m.x,m.y)+'）'});if(G.onPause&&apOn('req'))G.onPause('收到上級指令');}return;}
  if(!aiControls(to)){(G.inbox=G.inbox||[]).push({id:m.id,t:G.t,side:to.side,k:'req',rk:m.rk,from:m.from,to:m.to,x:m.x,y:m.y,txt:uName(from)+'請求'+REQN[m.rk]+(m.x!==undefined?'（'+placeTxt(m.x,m.y)+'）':'')});if(G.onPause&&apOn('req')&&!m.auto)G.onPause('收到請求');return;}
  var r=reqDecide(to,from,m);reqReply(to,from,r[0],r[1]);}
function reqReply(from,to,ok,txt){var h=hopDelay(from,to),m={id:(G.mid=(G.mid||0)+1),k:'rep',side:from.side,from:from.id,to:to.id,t0:G.t,ta:G.t+h.sec,via:[h.via],ok:ok,txt:(ok?'同意：':'拒絕：')+txt};crLeg1(m,from,to,h);G.msgs.push(m);decLog(from.side,uName(from),(ok?'同意':'拒絕')+uName(to)+'的請求：'+txt);}
/* AI 依個性與資源決定是否答應 */
function reqDecide(F,R,m){var P=aiOf(F),L=leavesOf(F).filter(onMap),k=m.rk,x=m.x!==undefined?m.x:R.x,y=m.y!==undefined?m.y:R.y;
  if(k==='fires'||k==='air'){var art=L.filter(function(u){var s=ST(u);return (k==='air'?s.dom==='air'&&!isCarrier(u):indOf(u,s)>0&&dist(u.x,u.y,x,y)<indOf(u,s)*0.95)&&!(u.mis&&G.t<u.mis.end)&&!(u.pend&&u.pend.length);});if(!art.length)return [false,'沒有可用的'+(k==='air'?'航空':'砲兵')+'部隊'];var a=art[0];sendOrder(F,a,newOrder(k==='air'?'strike':'bombard',{x:x,y:y,r:k==='air'?2500:500,dur:1800,then:'support',sub:1}),false);return [true,'派'+uName(a)+(k==='air'?'實施空中打擊':'射擊')];}
  if(k==='reinf'){if(P.res<0.15&&P.t!=='def')return [false,'預備隊已全部投入'];var res=kidsOf(F).filter(function(u){return alive(u)&&u.ord&&u.ord.k==='reserve'&&!(u.pend&&u.pend.length);})[0];if(!res)return [false,'沒有可用的預備隊'];sendOrder(F,res,newOrder('attack',{x:x,y:y,sub:1,opt:{tac:'frontal',tol:P.tol}}),false);return [true,'派'+uName(res)+'增援'];}
  if(k==='supply'||k==='ammo'){var sp=L.filter(function(u){return ST(u).fl.indexOf('l')>=0&&!(u.pend&&u.pend.length);})[0];if(!sp)return [false,'沒有可派的後勤部隊'];sendOrder(F,sp,newOrder('move',{x:x,y:y,sub:1}),false);return [true,'派'+uName(sp)+'前往補給'];}
  if(k==='withdraw'){if(P.hold>0.75)return [false,'必須死守，不准後撤'];var h=homeDir(R.side),wp=validPos({dom:'land'},R.x+Math.cos(h)*2500,R.y+Math.sin(h)*2500);sendOrder(F,R,newOrder('delay',{x:wp[0],y:wp[1],face:h+PI,sub:1,dk:'delay',opt:{post:'delay',maxb:3}}),false);return [true,'准許遲滯後撤'];}
  if(k==='attack'){if(P.agg<0.35)return [false,'目前兵力不足，無法配合進攻'];var g=kidsOf(F).filter(function(u){return alive(u)&&roleOf(u)==='man'&&!(u.pend&&u.pend.length)&&(!u.ord||/reserve|halt|defend/.test(u.ord.k));})[0];if(!g)return [false,'沒有可用的部隊'];sendOrder(F,g,newOrder('attack',{x:x,y:y,sub:1,opt:aiOpts(F,'attack',{})}),false);return [true,'派'+uName(g)+'協同進攻'];}
  if(k==='hold'){var g2=kidsOf(F).filter(function(u){return alive(u)&&roleOf(u)==='man'&&!(u.pend&&u.pend.length);})[0];if(!g2)return [false,'沒有可用的部隊'];sendOrder(F,g2,newOrder('defend',{x:x,y:y,sub:1}),false);return [true,'派'+uName(g2)+'掩護側翼'];}
  if(k==='recon'){var rc=L.filter(function(u){return clsOf(u)==='rec'&&!(u.pend&&u.pend.length);})[0];if(!rc)return [false,'沒有偵察部隊'];sendOrder(F,rc,newOrder('recon',{x:x,y:y,sub:1}),false);return [true,'派'+uName(rc)+'偵察'];}
  return [false,'無法處理'];}
/* 上級對下級（含玩家）下達指令 */
function dirSend(from,to,k,x,y,face,opt){var h=hopDelay(from,to),m={id:(G.mid=(G.mid||0)+1),k:'dir',dk:k,side:from.side,from:from.id,to:to.id,t0:G.t,ta:G.t+h.sec+(uEra(from).relay||5)*60,via:[h.via],x:x,y:y,face:face,opt:opt};crLeg1(m,from,to,h);G.msgs.push(m);return m;}
/* 由 AI 編制的命令規劃轉成給玩家的指令；同一目標兩小時內不重複發送 */
function dirFromOrder(src,to,o,agg){var k=o.dk||o.k,L=to.dirLast;if(L&&L.k===k&&(agg&&G.t-L.t<3600||G.t-L.t<2*3600&&(o.x===undefined||L.x===undefined||dist(o.x,o.y,L.x,L.y)<1500)))return null;to.dirLast={k:k,x:o.x,y:o.y,t:G.t};to.dirT=G.t;
  var opt=o.opt?Object.assign({},o.opt):undefined;if(opt)delete opt.post;logE(to.side,'req',uName(src)+'向'+uName(to)+'（玩家指揮）下達指令：'+(ORDN[k]||k)+(o.x!==undefined?'（'+placeTxt(o.x,o.y)+'）':''),src.x,src.y,to.id);return dirSend(src,to,k,o.x,o.y,o.face,opt);}
/* 對下級編制下令：AI 控制者直接下令；玩家控制者送出指令（收件匣） */
function aiOrder(X,g,k,p){p=p||{};if(aiControls(g)){issue(g,k,p);return true;}if(playerOwns(X.side,g)&&SD(X.side).ai&&(!g.dirT||G.t-g.dirT>3*3600)){if(!dirFromOrder(X.F,g,{k:k,x:p.x,y:p.y,face:p.face,opt:p.opt}))return false;aiSay(X,'向'+uName(g)+'（玩家指揮）下達指令：'+(ORDN[k]||k)+(p.x!==undefined?'（'+placeTxt(p.x,p.y)+'）':''));return true;}return false;}
/* 玩家指揮的下級是否需要上級指令（AI 上級的行動會把玩家部隊納入計畫，但只以指令傳達） */
function pDir(X,g){var S=SD(X.side);return S.ai&&S.pu>0&&g.id===S.pu&&!aiControls(g)&&alive(g)&&!busyF(g);}
/* ---------- v4 命令的規劃：勸降、收集、打造、聯合作戰 ---------- */
function planV4(F,o,kids,man,fire,air,nav,oth,P,C,dir,add,fw,spreadLine){var k=o.k;
  if(k==='persuade'){var L=leavesOf(F).filter(alive),psy=L.filter(function(u){return ST(u).fl.indexOf('k')>=0;});if(!psy.length){var m=L.filter(function(u){return roleOf(u)==='man';}).sort(function(a,b){return dist(a.x,a.y,P[0],P[1])-dist(b.x,b.y,P[0],P[1]);})[0];if(m)psy=[m];}
    kids.forEach(function(u){var mine=psy.some(function(q){return q===u||inTree(q,u.id);});add(u,newOrder(mine?'persuade':'halt',mine?{x:P[0],y:P[1]}:{}));});return true;}
  if(k==='gather'||k==='craft'){var W=kids.filter(function(u){var L2=isLeaf(u)?[u]:leavesOf(u);return L2.some(function(q){return isEng(q)||ST(q).fl.indexOf('f')>=0;});});if(!W.length)W=man.slice(0,1);kids.forEach(function(u){add(u,W.indexOf(u)>=0?newOrder(k,{x:P[0],y:P[1],opt:o.opt}):newOrder('halt',{}));});return true;}
  if(k==='joint')return planJoint(F,o,kids,man,fire,air,nav,oth,P,C,dir,add,fw,spreadLine);
  return false;}
/* 聯合作戰：同步的發起時刻（H 時）——地面主攻、空降或機降垂直包圍、兩棲登陸、艦砲與空中打擊、砲火準備、後方跟進 */
function planJoint(F,o,kids,man,fire,air,nav,oth,P,C,dir,add,fw,spreadLine){var opt=o.opt||{},prep=Math.max(30,opt.prep||60),H=G.t+prep*60+1800,fx=Math.cos(dir),fy=Math.sin(dir),lx=-fy,ly=fx;
  function maj(u,f){var L=isLeaf(u)?[u]:leavesOf(u).filter(alive);return L.length&&L.filter(f).length>=L.length*0.5;}
  /* 兩棲：與目標之間隔著海面的地面部隊才走海路登陸；其餘循陸路進攻 */function seaBetween(u){var c=cOf(u)||[u.x,u.y],MP=G.map,d=dist(c[0],c[1],P[0],P[1]),n=Math.max(2,Math.ceil(d/(MP.cs*2))),w=0;for(var i=1;i<n;i++){if(seaWater(MP.lc[cellAt(c[0]+(P[0]-c[0])*i/n,c[1]+(P[1]-c[1])*i/n)]))w++;}return w>=2;}
  var abn=man.filter(function(u){return maj(u,function(q){return canPara(q)||canHeli(q);});}),amph=man.filter(function(u){return abn.indexOf(u)<0&&maj(u,canAmph)&&seaBetween(u);}),land=man.filter(function(u){return abn.indexOf(u)<0&&amph.indexOf(u)<0;});
  var W=Math.max(sum(land,fw)*1.1,600);spreadLine(land,P[0],P[1],lx,ly,W,function(u,x,y){return newOrder(roleOf(u)==='rec'?'recon':'attack',{x:x,y:y,hHour:H,opt:Object.assign({tac:'firemove',tol:opt.tol||40},aiControls(u)?aiOpts(u,'attack',{}):{})});});
  abn.forEach(function(u,i){var dx=P[0]+fx*(2500+1200*i)+lx*(i%2?1:-1)*1500,dy=P[1]+fy*(2500+1200*i)+ly*(i%2?1:-1)*1500,L=isLeaf(u)?[u]:leavesOf(u),heli=L.some(canHeli)&&G.units.some(function(c){return c.side===F.side&&alive(c)&&isCarrier(c);});add(u,newOrder(heli?'airlift':'airdrop',{x:dx,y:dy,then:newOrder('defend',{x:dx,y:dy,face:Math.atan2(P[1]-dy,P[0]-dx),opt:{post:'hasty'}})}));});
  amph.forEach(function(u){add(u,newOrder('landing',{x:P[0],y:P[1],then:newOrder('attack',{x:P[0],y:P[1],opt:{tac:'firemove',tol:opt.tol||40}})}));});
  fire.forEach(function(u){add(u,newOrder('bombard',{x:P[0],y:P[1],r:Math.max(500,W/3),dur:prep*60,then:'support',sup:F.id}));});
  nav.forEach(function(u){var s=ST(isLeaf(u)?u:leavesOf(u)[0]||u);add(u,newOrder(s.ind>0?'bombard':'move',{x:P[0],y:P[1],r:800,dur:prep*60}));});
  air.forEach(function(u,i){if(isLeaf(u)&&isCarrier(u))return;add(u,newOrder(i===0&&air.length>1?'patrol':'strike',{x:P[0]+fx*1500,y:P[1]+fy*1500,r:3500}));});
  oth.forEach(function(u){add(u,newOrder('move',{x:C[0]+(P[0]-C[0])*0.4-fx*1500,y:C[1]+(P[1]-C[1])*0.4-fy*1500}));});
  logE(F.side,'plan',uName(F)+'規劃聯合作戰：H 時為 '+tTxt(H).slice(-5)+'，地面 '+land.length+'、空降 '+abn.length+'、兩棲 '+amph.length+'、砲兵 '+fire.length+'、艦艇 '+nav.length+'、航空 '+air.length+' 個單位同步行動',F.x,F.y,F.id);decLog(F.side,uName(F),'發起聯合作戰（'+placeTxt(P[0],P[1])+'）');return true;}
