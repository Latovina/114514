/* ===================== 居民情報：村鎮居民依對各方的態度（受聲望、軍紀與佔領經歷影響）向附近的本方部隊報告看到的敵軍。
   友善的居民大多據實以告（位置誤差數百公尺）；態度中立的誤差較大；敵視本方的居民可能隱瞞，或故意把兵力說多說少、把敵軍說在錯的地方。
   報告要靠居民走到部隊、或經由電話與信差送達，有 20～80 分鐘的延遲；本方部隊已經看到的更新情報優先 ===================== */
function civAttTo(g,s){return g.att?(g.att[s]||0):(g.loy===s?35:(nSides()<3?g.loy===1-s:g.loy>=0&&hostile(g.loy,s))?-25:0);}
function intelCred(a){return a>20?'高':a<-20?'低':'中';}
function intelStep(){if(!G.civ||G.set.civIntel===false)return;var I=G.civ.intel||(G.civ.intel={n:sA0(),lie:sA0()});
  SIDES().forEach(function(s){var rep=G.civ.rep[s]===undefined?50:G.civ.rep[s];G.civ.S.forEach(function(g){var pres=civPresent(g);if(pres<30)return;if(friendNear(s,g.x,g.y,3000)<=0)return;
    var a=civAttTo(g,s),p=0.12*clamp(1+a/60,0.15,2)*clamp(rep/60,0.3,1.4)*clamp(pres/400,0.3,1.5);if(rnd()>p)return;
    var cand=[];gridNear(g.x,g.y,5000,function(t){if(!hostile(s,t.side)||!onMap(t)||!isLeaf(t)||t.st==='lift'||ST(t).dom==='air'||ST(t).dom==='sub')return;if(dist(t.x,t.y,g.x,g.y)<=5000)cand.push(t);});
    var lie=a<-20&&rnd()<clamp(-a/120,0,0.7)*(rep<40?1.3:1),t=null,x,y;
    if(cand.length)t=cand[Math.floor(rnd()*cand.length)];else if(lie){/* 附近沒有敵軍，敵視的居民捏造：把遠處的敵軍說成就在附近 */var far=G.units.filter(function(q){return hostile(s,q.side)&&onMap(q)&&isLeaf(q)&&ST(q).dom==='land';});if(!far.length)return;t=far[Math.floor(rnd()*far.length)];}
    if(!t)return;var err=lie?(cand.length?1500+rnd()*2500:0):(a>20?150+rnd()*350:400+rnd()*900),ang=rnd()*2*PI;
    if(lie&&!cand.length){var r=1500+rnd()*2500;x=g.x+Math.cos(ang)*r;y=g.y+Math.sin(ang)*r;}else{x=t.x+Math.cos(ang)*err;y=t.y+Math.sin(ang)*err;}var v=validPos({dom:'land'},x,y);x=v[0];y=v[1];
    var men=t.men*(lie?(rnd()<0.5?0.25+0.3*rnd():1.8+1.5*rnd()):(0.7+0.6*rnd()));
    G.rq[s].push({at:G.t+1200+rnd()*3600,id:t.id,x:x,y:y,t:G.t,q:0.5,by:0,civ:{g:g.i,n:g.n,men:men,lie:lie?1:0,a:a}});I.n[s]++;if(lie)I.lie[s]++;});});}
/* 報告送達：標記來源、可信度與居民說的兵力；記錄 */
(function(){var b=reportStep;reportStep=function(){var due=sAL();for(var s=0;s<nSides();s++){var Q=G.rq[s];for(var i=0;i<Q.length;i++){var r=Q[i];if(r.civ&&r.at<=G.t)due[s].push(r);}}b();
  for(var s2=0;s2<nSides();s2++)due[s2].forEach(function(r){var c=G.ct[s2][r.id];if(!c||c.t!==r.t||Math.abs(c.x-r.x)>1||Math.abs(c.y-r.y)>1)return;var K=r.civ,cr=intelCred(K.a);c.civ={n:K.n,cred:cr,lie:K.lie};c.men=Math.max(10,Math.round(K.men/50)*50);c.name='';c.q=0.5;
    logE(s2,'contact','居民情報（'+K.n+'，可信度'+cr+'）：在'+placeTxt(r.x,r.y)+'看到約 '+fmt(c.men)+' 名敵軍'+(c.veh?'與車輛':''),r.x,r.y);});};})();
(function(){var b=v8Step;v8Step=function(){b();if(G.step%60===41)intelStep();};})();
