/* ===================== 友軍誤擊：自從有了火器，誤擊一直是戰場傷亡的一部分。砲彈散布落點偏短、夜間與煙霧中的直射火力、
   空襲的炸彈與掃射都可能打到自己人；多寡取決於直射或曲射、距離、能見度、訓練、士氣、疲勞與年代（識別、通信與導引的進步） ===================== */
/* 設定：關閉／較少／一般／較多 */
function ffMul(){var v=G.set.ff;return v==='off'?0:v==='low'?0.5:v==='high'?1.8:1;}
/* 年代：黑色火藥的煙霧、沒有無線電的砲兵觀測，誤擊較多；熱影像、敵我識別、精準導引之後較少 */
function ffEra(y){return y<1880?1.5:y<1919?1.3:y<1946?1:y<1980?0.75:y<2000?0.55:0.4;}
/* 射手本身的狀況：訓練、疲勞、士氣 */
function ffCrew(u){var t=u.trn||60,f=u.fat||0;return (t<45?1.5:t<60?1.2:t>80?0.8:1)*(f>70?1.4:f>50?1.15:1)*(u.ms==='shaken'?1.35:1);}
/* 能見度：夜間、霧、雨、煙幕 */
function ffVis(x0,y0,x1,y1){var E=G.env||{},W=WX[E.wx]||WX[0],m=1;if(E.light<0.3)m*=2.5;else if(E.light<0.6)m*=1.4;if(W[5]<0.6)m*=1.5;if(typeof smokeBlock==='function'&&G.smk&&G.smk.length&&x1!==undefined&&smokeBlock(x0,y0,x1,y1)>0.3)m*=1.8;return m;}
function ffStat(side,m,kind){var S=G.stats[side];if(!S)return;S.ffm=(S.ffm||0)+m;var K=S.ffk||(S.ffk={});K[kind]=(K[kind]||0)+m;}
/* 記錄：同一對單位一小時內只寫一次 */
function ffLog(by,t,kind,txt){var key=(by?by.id:0)+'>'+t.id+'|'+kind,L=G._ffL||(G._ffL={});if(L[key]&&G.t-L[key]<3600)return;L[key]=G.t;logE(t.side,'ff',txt,t.x,t.y,t.id);if(t.side>=0&&t.side<nSides()&&G.onPause&&typeof apOn==='function'&&apOn('ff'))G.onPause('友軍誤擊');}
/* 誤擊傷害：hit 不計敵方戰果，另記入友軍誤擊統計 */
function ffHit(t,by,dm,dv,kind){if(!(dm>0||dv>0))return;hit(t,null,dm,dv,Math.min(30,dm*0.5+4),'ff');ffStat(t.side,dm+dv*8,kind);t.ffT=G.t;t.mor=clamp(t.mor-Math.min(4,1+dm*0.2),0,100);if(typeof mfAdd==='function')mfAdd(t,'panic',-Math.min(4,1+dm*0.2));}
/* ---------- 曲射：落點偏短的齊射 ---------- */
/* 每一步有一定機率有一批砲彈偏離瞄準點（大多偏短，也就是落向本方這一側），落在附近的友軍承受整批的殺傷 */
function ffArty(u,s,M){var m=ffMul();if(!m)return;var y=uEra(u).y||1943,prec=s.fl.indexOf('p')>=0,obs=M.kind!=='bombard'||M.obs;
  var p=(prec?0.004:0.035)*ffEra(y)*ffCrew(u)*(G.env.light<0.3?1.3:1)*(M.reg||y>=1960?1:1.25)*m;if(rnd()>=p)return;
  var d=prec?60+rnd()*80:(y<1919?250:y<1946?200:y<1980?150:100)*(1+rnd()*2.5),ang=Math.atan2(u.y-M.y,u.x-M.x)+(rnd()-0.5)*0.9,px=M.x+Math.cos(ang)*d,py=M.y+Math.sin(ang)*d,R=Math.max(120,(M.r||300)*0.6),n=0;
  gridNearS(px,py,R+200,u.side,function(t){if(!onMap(t)||!isLeaf(t)||ST(t).dom==='air')return;var dd=dist(t.x,t.y,px,py),fp=Math.sqrt(frontW(t)*120/PI);if(dd>R+fp)return;var ts=ST(t),cov=covInd(t),SA=saOf(u,s),HA=haOf(u,s),shr=clamp(frontW(t)*120/(PI*R*R),0.12,1)*(dd<R?1:0.5),
    F=SA*strFrac(u)*DT/60*FIRE_K*ART_K*shr*cov*(0.7+0.6*rnd())*0.6,Fv=HA*strFrac(u)*DT/60*FIRE_K*ART_K*shr*cov*0.4;
    ffHit(t,u,F*(1-0.9*ts.hard),Fv*ts.hard+F*(1-ts.hard)*(t.veh/Math.max(1,t.men))*0.25,'art');n++;
    ffLog(u,t,'art','誤擊！'+uName(u)+'的一批砲彈落點偏短，落在我軍'+uName(t)+'的陣地上（'+placeTxt(t.x,t.y)+'）');});
  if(n&&typeof FX!=='undefined'&&FX.cap)FX.ev.push({k:'art',a:u,x0:u.x,y0:u.y,x1:px,y1:py,r:R,m:1});}
(function(){var b=artyFire;artyFire=function(u,s,M){b(u,s,M);var o=u.ord;if(o&&o.smoke)return;if(u.lastArt===G.t)ffArty(u,s,M);};})();
/* ---------- 直射：目標附近或射線上的友軍 ---------- */
/* 目標 150 公尺內有友軍、或友軍就在射線旁時，夜間、霧、煙幕、城鎮近戰中可能打錯對象 */
function ffDirect(u,s,t,F){var m=ffMul();if(!m||!(F>0.02))return;if((G.step+u.id)%3)return;var cand=null,bd=1e9;
  gridNearS(t.x,t.y,160,u.side,function(q){if(q===u||!onMap(q)||!isLeaf(q)||ST(q).dom==='air')return;var d=dist(q.x,q.y,t.x,t.y);if(d<150&&d<bd){bd=d;cand=q;}});
  if(!cand){var L=dist(u.x,u.y,t.x,t.y);if(L<400)return;var mx=(u.x+t.x)/2,my=(u.y+t.y)/2;gridNearS(mx,my,L/2,u.side,function(q){if(cand||q===u||!onMap(q)||!isLeaf(q)||ST(q).dom==='air')return;var dx=t.x-u.x,dy=t.y-u.y,l2=dx*dx+dy*dy,tt=clamp(((q.x-u.x)*dx+(q.y-u.y)*dy)/l2,0,1);if(tt<0.25||tt>0.95)return;if(dist(q.x,q.y,u.x+dx*tt,u.y+dy*tt)<60)cand=q;});}
  if(!cand)return;var urb=isUrban(G.map.lc[cellAt(t.x,t.y)])?1.5:1,p=0.02*ffEra(uEra(u).y||1943)*ffCrew(u)*ffVis(u.x,u.y,t.x,t.y)*urb*m*(bd<60?1.5:1);if(rnd()>=p)return;
  var ts=ST(cand),f=F*(0.2+0.3*rnd());ffHit(cand,u,f*(1-0.9*ts.hard),f*ts.hard*0.1,'fire');ffLog(u,cand,'fire','誤擊！'+uName(u)+(G.env.light<0.3?'在夜暗中':'')+'把'+uName(cand)+'誤認為敵軍開火（'+placeTxt(cand.x,cand.y)+'）');}
(function(){var b=directFire;directFire=function(u,s,t,d,ch,SA,HA,rE,rM){var I0=G._inc&&G._inc[t.id]?G._inc[t.id].m:0;b(u,s,t,d,ch,SA,HA,rE,rM);if(t.side===u.side||ST(t).dom==='air')return;var I1=G._inc&&G._inc[t.id]?G._inc[t.id].m:0;if(I1>I0)ffDirect(u,s,t,I1-I0);};})();
/* ---------- 空襲：炸彈波及目標附近的友軍、在混戰中誤認目標 ---------- */
(function(){var b=hit;hit=function(t,src,dm,dv,sup,kind){b(t,src,dm,dv,sup,kind);if(kind!=='airstrike'||!src||src.st!=='air'||t.side===src.side||!(dm+dv>0.05))return;var m=ffMul();if(!m)return;
  var y=uEra(src).y||1943,bomb=airRole(src)==='bomber'||airRole(src)==='attack',p=(bomb?0.3:0.12)*ffEra(y)*ffCrew(src)*m*(G.env.light<0.3?1.6:1);if(rnd()>=p)return;var R=bomb?(y<1960?300:150):120;
  gridNearS(t.x,t.y,R+100,src.side,function(q){if(!onMap(q)||!isLeaf(q)||ST(q).dom==='air')return;var d=dist(q.x,q.y,t.x,t.y);if(d>R)return;var w=(1-d/R)*0.5;ffHit(q,src,dm*w,dv*w,'air');ffLog(src,q,'air','誤炸！'+uName(src)+'攻擊'+placeTxt(t.x,t.y)+'的敵軍時，炸彈波及我軍'+uName(q));});};})();
KINDN.ff='友軍誤擊';
