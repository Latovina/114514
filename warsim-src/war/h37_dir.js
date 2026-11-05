/* ===================== 戰略決策：在沙盒（看 AI 對戰）或上帝視角下，在地圖上放置進攻、防禦、死守、設防、建設、偵察、火力打擊、集結等決策。
   電腦指揮官依優先等級抽調部隊執行（優先等級越高投入越多），回報兵力是否足夠；執行中的部隊暫時不受其他 AI 計畫調動，
   完成（攻佔、構築完成、抵達偵察區）、期限到或失去戰鬥力時回報並交還指揮。玩家仍可以直接下令覆蓋 ===================== */
var DIRK={attack:['進攻','⚔'],defend:['防禦','⛨'],hold:['死守','⛊'],fortify:['設防','▦'],build:['建設','⚒'],recon:['偵察','◉'],fire:['火力打擊','✸'],rally:['集結','◎']};
var DIRSUB={depot:'補給站',bridge:'橋梁',road:'道路',fort:'堡壘工事'};
var DIRST={new:'待執行',active:'執行中',done:'完成',fail:'無法執行',cancel:'已取消'};
var DIRSIM=0,DIRX=0;
function dirList(){return G.dirs||(G.dirs=[]);}
function dirById(id){var L=G.dirs||[];for(var i=0;i<L.length;i++)if(L[i].id===id)return L[i];return null;}
function dirActive(D){return !!D&&(D.st==='new'||D.st==='active');}
/* 指揮官的回報 */
function dirSay(side,txt,x,y){var top=sideCmd(side),who=top&&top.off?top.off.rank+top.off.name:G.sides[side].name+'司令部';logE(side,'ai',who+'（戰略決策）：'+txt,x,y);if(typeof decLog==='function')decLog(side,who,txt,{});}
function dirAdd(side,o){var L=dirList(),k=DIRK[o.k]?o.k:'attack',D={id:(G.dirSeq=(G.dirSeq||0)+1),side:side,k:k,sub:k==='build'?(DIRSUB[o.sub]?o.sub:'depot'):'',x:o.x,y:o.y,r:clamp(+o.r||1500,300,8000),pri:clamp(Math.round(+o.pri||2),1,3),prep:o.prep?1:0,dur:Math.max(0,+o.dur||0),t0:G.t,st:'new',gs:[],eng:[],tk:-1e9,msg:'',by:o.by||'user'};
  L.push(D);if(L.length>100)L.splice(0,L.length-100);logE(side,'cmd','戰略決策：'+dirNm(D)+'——'+placeTxt(D.x,D.y)+'（優先等級 '+D.pri+(D.dur?'，期限 '+D.dur+' 小時':'')+'）',D.x,D.y);if(SD(side).ai)dirExec(D);return D;}
function dirNm(D){return DIRK[D.k][0]+(D.sub?'（'+DIRSUB[D.sub]+'）':'');}
function dirRelease(D){(D.gs||[]).concat(D.eng||[]).forEach(function(id){var u=uById(id);if(u&&u.dirId===D.id)u.dirId=0;});}
function dirCancel(D,why){if(!dirActive(D))return;D.st='cancel';D.t1=G.t;dirRelease(D);logE(D.side,'cmd','取消戰略決策：'+dirNm(D)+'（'+placeTxt(D.x,D.y)+'）'+(why?'：'+why:''),D.x,D.y);}
function dirEnd(D,st,why){if(!dirActive(D))return;D.st=st;D.t1=G.t;D.msg=why||'';
  if(st==='done'&&D.k==='attack'){DIRX++;try{D.gs.forEach(function(id){var g=uById(id);if(g&&alive(g))issue(g,'defend',{x:D.x,y:D.y,face:dirFace(D),opt:{post:'hasty'},dirId:D.id});});}finally{DIRX--;}}
  dirRelease(D);dirSay(D.side,'「'+dirNm(D)+'」（'+placeTxt(D.x,D.y)+'）'+(st==='done'?'完成':'無法繼續')+(why?'：'+why:''),D.x,D.y);}
/* 鎖定：執行決策的編組（本身或上級）暫時不受其他 AI 計畫調動 */
function dirLockOf(u){var x=u,n=0;while(x&&n++<12){if(x.dirId){var D=dirById(x.dirId);if(dirActive(D))return D;x.dirId=0;}x=x.p>=0?uById(x.p):null;}return null;}
function dirFace(D){var ec=enemyCentroid(D.side,D.x,D.y,30000);return ec?Math.atan2(ec[1]-D.y,ec[0]-D.x):homeDir(D.side)+PI;}
function dirPos(g){var c=cOf(g);return c||[g.x,g.y];}
function dirStr(g){var L=isLeaf(g)?[g]:leavesOf(g).filter(onMap);return L.reduce(function(a,u){return a+u.men+u.veh*8;},0);}
function dirKnownEnemy(side,x,y,R,age){var C=G.ct[side]||{},n=0;for(var id in C){var c=C[id];if(c.dead||G.t-c.t>(age||3600)||c.dom==='air'||c.dom==='sea'||c.dom==='sub')continue;if(dist(c.x,c.y,x,y)<=R)n+=(c.men||0)+(c.veh||0)*8;}return n;}
/* 可以抽調的機動部隊（電腦指揮、未被其他決策占用） */
function dirMan(side){return aiGroups(side).filter(function(g){if(!alive(g)||g.st==='off'||g.irr||!aiControls(g)||dirLockOf(g))return false;var r=roleOf(g);if(r!=='man'&&r!=='rec')return false;var L=isLeaf(g)?[g]:leavesOf(g).filter(onMap);if(!L.length||L.filter(isEng).length>L.length/2)return false;return L.some(function(u){return ST(u).dom==='land';});});}
function dirLeaves(side,f){var o=[];G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||!onMap(u)||!aiControls(u)||u.ms==='rout'||dirLockOf(u))return;if(f(u))o.push(u);});return o;}
function dirTake(D,arr,n,score){return arr.map(function(g){return [g,score(g)];}).sort(function(a,b){return a[1]-b[1];}).slice(0,n).map(function(q){return q[0];});}
function dirN(L,pri){return L.length?clamp(Math.round(L.length*[0.2,0.35,0.5][pri-1]),1,Math.max(1,L.length-(pri<3&&L.length>1?1:0))):0;}
function dirOrd(D,u,k,p){p=p||{};p.dirId=D.id;u.dirId=D.id;u.dirIss=G.t;DIRX++;try{issue(u,k,p);}finally{DIRX--;}}
/* 抽調部隊並下令 */
function dirExec(D){if(!dirActive(D)||!SD(D.side).ai)return;var side=D.side,x=D.x,y=D.y,face=dirFace(D),names=[],k=D.k;
  var man=function(n){var L=dirMan(side);return dirTake(D,L,dirN(L,D.pri)*(n||1),function(g){var p=dirPos(g);return dist(p[0],p[1],x,y)/1000-(k==='attack'?strFrac(isLeaf(g)?g:(leavesOf(g)[0]||g))*6:0)+(roleOf(g)==='rec'?60:0);});};
  var eng=function(n){return dirTake(D,dirLeaves(side,function(u){return isEng(u);}),n,function(u){return dist(u.x,u.y,x,y);});};
  if(k==='attack'||k==='defend'||k==='hold'||k==='rally'){var gs=man();if(!gs.length){dirEnd(D,'fail','沒有可以抽調的機動部隊');return;}
    gs.forEach(function(g){if(k==='attack')dirOrd(D,g,'attack',{x:x,y:y,opt:D.prep?{prep:20}:{}});else if(k==='defend')dirOrd(D,g,'defend',{x:x,y:y,face:face,opt:{post:'prepared'}});else if(k==='hold')dirOrd(D,g,'holdfast',{x:x,y:y,face:face});else dirOrd(D,g,'reserve',{x:x,y:y});names.push(uName(g));});D.gs=gs.map(function(g){return g.id;});
    var mine=gs.reduce(function(a,g){return a+dirStr(g);},0),en=dirKnownEnemy(side,x,y,D.r*2),warn=k==='attack'&&en>mine*0.9?'；已知敵軍約為我方的 '+fmt(en/Math.max(1,mine),1)+' 倍，攻擊恐怕難以奏效':k!=='attack'&&k!=='rally'&&en>mine*1.5?'；附近敵軍兵力占優，可能守不住':'';
    dirSay(side,'遵命，派'+names.slice(0,4).join('、')+(names.length>4?'等 '+names.length+' 個單位':'')+(k==='attack'?'進攻':k==='defend'?'防守':k==='hold'?'死守':'集結於')+placeTxt(x,y)+(D.prep&&k==='attack'?'，先實施火力準備':'')+warn,x,y);}
  else if(k==='fortify'||k==='build'){var E=eng(k==='fortify'?D.pri:Math.min(2,D.pri));if(!E.length){dirEnd(D,'fail','沒有可以派出的工兵');return;}
    var bk=k==='fortify'?(D.pri>=3?'fort':D.pri>=2?'semi':'pos'):D.sub==='fort'?'fort':'depot';
    E.forEach(function(u,i){var ox=x+(i%2?1:-1)*Math.ceil(i/2)*300,oy=y;if(k==='build'&&D.sub==='bridge')dirOrd(D,u,'bridge',{x:x,y:y});else if(k==='build'&&D.sub==='road')dirOrd(D,u,'roadbuild',{x:x,y:y});else dirOrd(D,u,'build',{x:ox,y:oy,bk:bk,face:face});names.push(uName(u));});D.eng=E.map(function(u){return u.id;});
    if(k==='fortify'){var g=man(1)[0];if(g){dirOrd(D,g,'defend',{x:x,y:y,face:face,opt:{post:'prepared'}});D.gs=[g.id];names.push(uName(g)+'（掩護）');}}
    dirSay(side,'遵命，派'+names.join('、')+(k==='fortify'?'在'+placeTxt(x,y)+'構築'+BLD[bk][0]:'在'+placeTxt(x,y)+'建設'+DIRSUB[D.sub]),x,y);}
  else if(k==='recon'){var R=dirTake(D,dirLeaves(side,function(u){var s=ST(u);return s.dom==='land'&&(s.fl.indexOf('r')>=0||roleOf(u)==='rec');}),D.pri,function(u){return dist(u.x,u.y,x,y);});
    if(!R.length)R=dirTake(D,dirLeaves(side,function(u){return ST(u).dom==='land'&&roleOf(u)==='man'&&u.men<=250;}),1,function(u){return dist(u.x,u.y,x,y);});if(!R.length){dirEnd(D,'fail','沒有可以派出的偵察部隊');return;}
    R.forEach(function(u){dirOrd(D,u,'recon',{x:x,y:y});names.push(uName(u));});D.gs=R.map(function(u){return u.id;});dirSay(side,'遵命，派'+names.join('、')+'偵察'+placeTxt(x,y),x,y);}
  else if(k==='fire'){var A=dirTake(D,dirLeaves(side,function(u){var s=ST(u);return s.dom==='land'&&(s.ind||0)>0&&dist(u.x,u.y,x,y)<=(s.ind||0)*0.95&&u.ammo>15;}),D.pri*2,function(u){return dist(u.x,u.y,x,y);});
    if(!A.length){dirEnd(D,'fail','射程內沒有可用的砲兵');return;}A.forEach(function(u){dirOrd(D,u,'bombard',{x:x,y:y});names.push(uName(u));});D.gs=A.map(function(u){return u.id;});D.tk=G.t;if(!D.dur)D.dur=3;dirSay(side,'遵命，'+names.slice(0,4).join('、')+(names.length>4?'等 '+names.length+' 個砲兵單位':'')+'對'+placeTxt(x,y)+'實施火力打擊',x,y);}
  D.st='active';D.ta=G.t;}
/* 每 10 分鐘檢查：完成條件、補充命令、失去戰鬥力 */
/* 攻佔：派出的部隊進入核心區（半徑六成）並站穩 15 分鐘，而且兩小時內沒有在區內看到敵軍 */
function dirCleared(D){var inside=D.gs.some(function(id){var g=uById(id);if(!g)return false;return (isLeaf(g)?[g]:leavesOf(g).filter(onMap)).some(function(u){return roleOf(u)!=='rec'&&dist(u.x,u.y,D.x,D.y)<=D.r*0.6;});});
  if(!inside||dirKnownEnemy(D.side,D.x,D.y,D.r,7200)>0){D.occ=0;return false;}if(!D.occ)D.occ=G.t;return G.t-D.occ>=900;}
function dirTick(){var L=G.dirs;if(!L||!L.length)return;L.forEach(function(D){if(!dirActive(D)||!SD(D.side).ai)return;if(D.st==='new'){dirExec(D);return;}
  if(D.dur>0&&G.t-D.t0>D.dur*3600){dirEnd(D,'done','期限已到');return;}
  D.gs=D.gs.filter(function(id){var g=uById(id);return g&&alive(g)&&g.dirId===D.id&&dirStr(g)>0;});D.eng=D.eng.filter(function(id){var u=uById(id);return u&&alive(u)&&u.dirId===D.id;});var k=D.k;
  if(k==='attack'){if(dirCleared(D)){dirEnd(D,'done','已攻佔，轉入防禦');return;}if(!D.gs.length){dirEnd(D,'fail','攻擊部隊已失去戰鬥力');return;}}
  else if(k==='fortify'||k==='build'){var busy=D.eng.some(function(id){var u=uById(id);return u&&u.ord&&u.ord.dirId===D.id;});if(busy)D.seen=1;
    if(!D.eng.length){dirEnd(D,'fail','工兵已失去戰鬥力');return;}if(!busy&&D.seen){dirEnd(D,'done',k==='fortify'?'工事構築完成':DIRSUB[D.sub]+'建設完成');return;}if(!busy&&!D.seen&&G.t-D.ta>2*3600){dirEnd(D,'fail','工兵沒有接到命令');return;}}
  else if(k==='recon'){var seen=D.gs.some(function(id){var u=uById(id);return u&&dist(u.x,u.y,D.x,D.y)<=D.r;});if(seen&&G.t-D.ta>600){var en=dirKnownEnemy(D.side,D.x,D.y,D.r*1.5);dirEnd(D,'done',en>0?'發現約 '+fmt(en)+' 名敵軍（含裝備折算）':'未發現敵軍');return;}if(!D.gs.length){dirEnd(D,'fail','偵察部隊已失去戰鬥力');return;}}
  else if(k==='fire'){if(!D.gs.length){dirEnd(D,'fail','砲兵已無法射擊');return;}if(G.t-D.tk>=3600){D.tk=G.t;D.gs.forEach(function(id){var u=uById(id);if(u&&u.ammo>10)dirOrd(D,u,'bombard',{x:D.x,y:D.y});});}return;}
  else if(!D.gs.length){dirEnd(D,'fail','部隊已失去戰鬥力');return;}
  /* 補充命令：被打斷或偏離目標時重新下令 */
  var want=k==='attack'?'attack':k==='defend'?'defend':k==='hold'?'defend':k==='rally'?'reserve':k==='fortify'?'defend':null;if(!want)return;
  /* 只有在命令被別的命令取代、或部隊閒置超過一小時時才重下（每次重下都要重新參謀規劃） */
  D.gs.forEach(function(id){var g=uById(id);if(!g||G.t-(g.dirIss||0)<2*3600)return;var o=g.ord;if(o&&o.dirId===D.id)return;var busy=(isLeaf(g)?[g]:leavesOf(g).filter(onMap)).some(function(u){return u.ord&&u.ord.dirId===D.id;});if(busy)return;
    if(!o){if(!g.dirIdle)g.dirIdle=G.t;if(G.t-g.dirIdle<3600)return;}g.dirIdle=0;
    if(k==='attack')dirOrd(D,g,'attack',{x:D.x,y:D.y,opt:{}});else if(k==='hold')dirOrd(D,g,'holdfast',{x:D.x,y:D.y,face:dirFace(D)});else if(k==='rally')dirOrd(D,g,'reserve',{x:D.x,y:D.y});else dirOrd(D,g,'defend',{x:D.x,y:D.y,face:dirFace(D),opt:{post:'prepared'}});});});}
/* ---------- 鎖定：其他 AI 計畫不得調動執行決策的部隊（玩家直接下令不受限） ---------- */
var DIRMOV={move:1,attack:1,defend:1,withdraw:1,reserve:1,storm:1,breakthrough:1,penetrate:1,pursue:1,screen:1,patrol:1,recon:1,siege:1,holdfast:1,delay:1,ambush:1,halt:1,rest:1,joint:1,bombard:1,support:1};
(function(){var b=simStep;simStep=function(){DIRSIM++;try{return b.apply(this,arguments);}finally{DIRSIM--;}};})();
(function(){var b=issue;issue=function(u,k,p){if(DIRSIM>0&&!DIRX&&u&&G.dirs&&G.dirs.length&&!(p&&p.dirId)){var D=dirLockOf(u);if(D&&(DIRMOV[k]||D.k==='fortify'||D.k==='build')&&SD(u.side).ai&&aiControls(u))return {sec:0,dirBlocked:D.id};}return b(u,k,p);};})();
(function(){var b=receiveOrder;receiveOrder=function(u,o){if(DIRSIM>0&&!DIRX&&u&&o&&!o.dirId&&G.dirs&&G.dirs.length){var D=dirLockOf(u);if(D&&(DIRMOV[o.k]||D.k==='fortify'||D.k==='build')&&SD(u.side).ai&&aiControls(u))return;}return b(u,o);};})();
(function(){var b=planOrder;planOrder=function(F,o){var r=b(F,o);if(!G.dirs||!G.dirs.length||!Array.isArray(r))return r;var DF=dirLockOf(F);r=r.filter(function(q){var u=q&&q[0];if(!u)return true;var D=dirLockOf(u);return !D||D===DF;});
  /* 決策命令往下傳時保留標記 */if(o&&o.dirId)r.forEach(function(q){if(q&&q[1]&&!q[1].dirId)q[1].dirId=o.dirId;});return r;};})();
(function(){var b=aiGroups;aiGroups=function(side){var L=b(side);if(!G.dirs||!G.dirs.length)return L;return L.filter(function(g){return !dirLockOf(g);});};})();
(function(){var b=v8Step;v8Step=function(){b();if(G.step%20===7)dirTick();};})();
