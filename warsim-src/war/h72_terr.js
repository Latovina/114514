/* ===================== 動態戰場地形：彈坑、戰場墓地、規劃的戰壕系統 =====================
   一、彈坑：砲兵射擊、地毯式轟炸、飛彈與核爆在落點留下彈坑（每格 0～255 的密度，存成稀疏表）。
       彈坑讓地面凹凸不平，越野的車輛、馬匹走得很慢（徒步影響較小），下雨後翻爛的土變成爛泥更難走；落在道路上的算路面損壞，沿用修路系統；彈坑也給趴在裡面的步兵一點掩蔽。
   二、戰場墓地：各處陣亡的官兵依地點累計，戰事平息後被集體掩埋成墓坑，地圖上看得到（不是罪行；經過的官兵會有些不安）。
   三、戰壕：在地圖上畫出戰壕路線並指派部隊挖掘；每 100 公尺一段，依人數、工兵、年代的機具、天候、是否遭射擊計算進度。
       挖好的戰壕給在裡面的部隊（不分敵我，奪下的戰壕也能用）深厚的掩體；挖到一半也有部分效果。 ===================== */
function crtOn(){return !!G&&G.set.crt!==false;}
function crtGet(k){if(G._crtQ)crtFlush();return G.crt?G.crt[k]||0:0;}
/* 落彈先累計在佇列（同一格、同半徑合併），每 10 步一起寫進地面：持續砲擊時不用每一步、每一發都重算一大片格子 */
function crtAdd(x,y,r,inc){if(!crtOn()||!(inc>0))return;var cs=G.map.cs,key=Math.floor(x/cs)+','+Math.floor(y/cs)+','+Math.max(0,Math.round(r/cs)),Q=G._crtQ||(G._crtQ={}),q=Q[key];if(q)q[3]+=inc;else Q[key]=[x,y,r,inc];if(inc>=200)crtFlush();}
function crtFlush(){var Q=G&&G._crtQ;if(!Q)return;G._crtQ=null;Object.keys(Q).forEach(function(k){var q=Q[k];crtApply(q[0],q[1],q[2],Math.min(255,q[3]));});}
function crtApply(x,y,r,inc){if(!crtOn()||!(inc>0))return;var MP=G.map,cs=MP.cs,GW=MP.GW,GH=MP.GH,R=Math.max(0,Math.round(r/cs)),cx=Math.floor(x/cs),cy=Math.floor(y/cs),C=G.crt||(G.crt={}),N=GW*GH;if(!G.rdd||G.rdd.length!==N)G.rdd=new Uint8Array(N);var rc=0;
  for(var dy=-R;dy<=R;dy++)for(var dx=-R;dx<=R;dx++){var X=cx+dx,Y=cy+dy;if(X<0||Y<0||X>=GW||Y>=GH)continue;var d2=dx*dx+dy*dy;if(d2>R*R+R)continue;var k=Y*GW+X;if(isWater(MP.lc[k]))continue;var f=R?1-0.5*Math.sqrt(d2)/R:1,v=inc*f;
    C[k]=Math.min(255,Math.round((C[k]||0)+v));if(MP.rd[k]){var o=G.rdd[k];G.rdd[k]=Math.min(255,o+Math.round(v*0.6));if(G.rdd[k]>=120&&o<120)rc++;}}G.crtV=(G.crtV||0)+1;if(rc)G._crtRd=1;}
/* 砲兵：每一步依砲數與射速，把砲彈平均落在目標圓內 */
(function(){var b=artyFire;artyFire=function(u,s,M){var r=b.apply(this,arguments);try{if(crtOn()&&M&&M.x!==undefined&&u.ammo>0){var R=Math.max(G.map.cs,M.r||300),cells=Math.max(1,PI*R*R/(G.map.cs*G.map.cs)),sh=Math.max(1,(u.veh||1)*strFrac(u))*(M.mul||1)*DT/60*2;crtAdd(M.x,M.y,R,sh*40/cells);}}catch(e){}return r;};})();
(function(){var b=carpetHit;carpetHit=function(side,src,cx,cy,ang,L,W,tons,o){var r=b.apply(this,arguments);try{if(crtOn()){var rho=tons/Math.max(0.01,L*W/1e6),n=Math.max(1,Math.round(L/Math.max(G.map.cs*4,W)));for(var i=0;i<n;i++){var f=(i+0.5)/n-0.5;crtAdd(cx+Math.cos(ang)*L*f,cy+Math.sin(ang)*L*f,Math.max(W/2,G.map.cs),Math.min(255,rho*0.9));}}}catch(e){}return r;};})();
(function(){var b=mslImpact;mslImpact=function(S){var r=b.apply(this,arguments);try{if(crtOn()&&S&&S.x!==undefined)crtAdd(S.tx!==undefined?S.tx:S.x,S.ty!==undefined?S.ty:S.y,G.map.cs,60);}catch(e){}return r;};})();
(function(){var b=nukeAt;nukeAt=function(side,x,y,Y,src){var r=b.apply(this,arguments);try{if(crtOn())crtAdd(x,y,Math.max(60,40*Math.pow(Y||1,1/3)),255);}catch(e){}return r;};})();
/* 彈坑：越野行進變慢；趴在彈坑裡的步兵多一點掩蔽 */
var CRTM=[0.15,0.3,0.5,0.6,0.3];
(function(){var b=speedAt;speedAt=function(u,s,pf){var v=b(u,s,pf);if(!G.crt||s.dom!=='land')return v;var k=cellAt(u.x,u.y),c=G.crt[k];if(!c||G.map.rd[k])return v;var m=G.env&&G.env.mud||0;return v*Math.max(0.15,1-c/255*(CRTM[s.mobi]||0.3)*(1+0.6*m));};})();
(function(){var b=hit;hit=function(t,src,dm,dv,sup,kind){if(G.crt&&t&&(kind==='fire'||kind==='art')&&dm>0){var c=G.crt[cellAt(t.x,t.y)];if(c&&ST(t).mobi===0)dm*=1-0.2*c/255;}return b(t,src,dm,dv,sup,kind);};})();
/* ---------- 二、戰場墓地 ---------- */
if(typeof EVDK!=='undefined'){EVDK.bgrave=['戰場墓地','陣亡的官兵被集體掩埋在這裡'];EVDV.kia='陣亡官兵';}
function bgStep(){if(!crtOn()||typeof evdAdd!=='function')return;var K=G.kg||(G.kg={});G.units.forEach(function(u){if(!isLeaf(u)||ST(u).dom!=='land')return;var k0=u._kia0===undefined?(u.kia||0):u._kia0,d=(u.kia||0)-k0;u._kia0=u.kia||0;if(!(d>0.2)||!onMap(u))return;
    var key=Math.floor(u.x/1000)+'_'+Math.floor(u.y/1000),q=K[key]||(K[key]={n:0,sx:0,sy:0});q.n+=d;q.sx+=u.x*d;q.sy+=u.y*d;});}
function bgBury(){if(!G.kg)return;Object.keys(G.kg).forEach(function(key){var q=G.kg[key];if(q.n<15)return;var x=q.sx/q.n,y=q.sy/q.n,quiet=true;gridNear(x,y,2000,function(u){if(G.t-(u.fired||-1e9)<3*3600||G.t-(u.uf||-1e9)<3*3600)quiet=false;});if(!quiet)return;
    var e=evdAdd('bgrave',x,y,{side:-1,vk:'kia',n:Math.round(q.n),dk:'bury'});if(e)gridNear(x,y,3000,function(u){if(u.side>=0)e.found[u.side]=e.found[u.side]||G.t;});delete G.kg[key];});}
/* ---------- 三、戰壕 ---------- */
Object.assign(ORDN,{trench:'挖戰壕'});
function trnL(){return G.trn||(G.trn=[]);}
function trnById(id){var L=trnL();for(var i=0;i<L.length;i++)if(L[i].id===id)return L[i];return null;}
/* 路線切成每段約 100 公尺：[x0,y0,x1,y1,長度,進度] */
function trnMake(id,side,P){var S=[],tot=0;for(var i=0;i+3<P.length;i+=2){var x0=P[i],y0=P[i+1],x1=P[i+2],y1=P[i+3],L=dist(x0,y0,x1,y1),n=Math.max(1,Math.ceil(L/100));for(var j=0;j<n;j++){var a=j/n,b2=(j+1)/n;S.push([x0+(x1-x0)*a,y0+(y1-y0)*a,x0+(x1-x0)*b2,y0+(y1-y0)*b2,L/n,0]);tot+=L/n;}}
  var T={id:id,side:side,pts:P.slice(),s:S,len:tot,t0:G.t};trnL().push(T);return T;}
function trnDone(T){var d=0;T.s.forEach(function(q){d+=q[4]*Math.min(1,q[5]);});return T.len>0?d/T.len:0;}
/* 挖掘速度（公尺／小時）：每人約 0.25 公尺，工兵快八成，1940 年後的工兵有機具；凍土、下雨、遭射擊、疲勞都變慢 */
function trnRate(u){var y=G.set.y||1943,T=G.env.T,W=WX[G.env.wx]||WX[0],r=u.men*0.25*(isEng(u)?1.8:1)*(isEng(u)&&y>=1940?1.5:1)*(T!==undefined&&T<-5?0.4:1)*(W[3]>0?0.75:1)*(G.t-(u.uf||-1e9)<600?0.25:1)*(1-(u.fat||0)/200);return Math.max(1,r);}
function trnSeg(T,u,o){var f0=o.opt.f0||0,f1=o.opt.f1===undefined?1:o.opt.f1,n=T.s.length,i0=Math.floor(f0*n),i1=Math.max(i0+1,Math.ceil(f1*n)),best=-1,bd=1e18;for(var i=i0;i<i1&&i<n;i++){var q=T.s[i];if(q[5]>=1)continue;var d=dist(u.x,u.y,(q[0]+q[2])/2,(q[1]+q[3])/2);if(d<bd){bd=d;best=i;}}return best;}
function trnAct(u,o){var p=o.opt||{};if(ST(u).dom!=='land'||!p.tid){u.ord=null;u.task='hold';return true;}var T=trnById(p.tid)||(p.pts&&p.pts.length>=4?trnMake(p.tid,u.side,p.pts):null);if(!T){u.ord=null;u.task='hold';return true;}
  o.ph='go';o.seg=trnSeg(T,u,o);if(o.seg<0){logE(u.side,'eng',uName(u)+'負責的戰壕已經挖好',u.x,u.y,u.id);u.ord=null;u.task='hold';return true;}var q=T.s[o.seg],mx=(q[0]+q[2])/2,my=(q[1]+q[3])/2,pp=validPos(ST(u),mx,my);if(dist(u.x,u.y,mx,my)<150){u.task='at';u.path=null;}else{u.task='go';wantPath(u,pp[0],pp[1]);}return true;}
function trnLeaf(u,s,o){var T=trnById(o.opt.tid);if(!T){u.ord=null;u.task='hold';return true;}if(o.seg===undefined||o.seg<0||T.s[o.seg][5]>=1){o.seg=trnSeg(T,u,o);if(o.seg<0){logE(u.side,'eng',uName(u)+'挖好了分配的戰壕（全線完成 '+pct(trnDone(T)*100)+'）',u.x,u.y,u.id);u.ord=null;u.task='hold';return true;}o.ph='go';}
  var q=T.s[o.seg],mx=(q[0]+q[2])/2,my=(q[1]+q[3])/2;if(o.ph==='go'){if(dist(u.x,u.y,mx,my)>150){if((G.step+u.id)%6===0&&!u.path){var pp=validPos(s,mx,my);u.task='go';wantPath(u,pp[0],pp[1]);}return false;}o.ph='dig';u.task='work2';u.path=null;if(!o.t1){o.t1=G.t;logE(u.side,'eng',uName(u)+'開始挖戰壕（'+placeTxt(mx,my)+'）',u.x,u.y,u.id);}return true;}
  if(o.ph==='dig'){q[5]=Math.min(1,q[5]+trnRate(u)*DT/3600/Math.max(1,q[4]));u.fat=clamp((u.fat||0)+0.04,0,100);u.ent=Math.max(u.ent||0,0.2+0.5*q[5]);if(q[5]>=1)o.seg=-1;return true;}return false;}
(function(){var b=v4Act;v4Act=function(u,o){if(o.k==='trench')return trnAct(u,o);return b(u,o);};})();
(function(){var b=v4Leaf;v4Leaf=function(u,s){var o=u.ord;if(o&&o.k==='trench'&&o.opt)return trnLeaf(u,s,o);return b(u,s);};})();
/* 在戰壕裡的部隊（不分敵我）：沒在移動就有深厚的掩體 */
function trnStep(){var L=trnL();if(!L.length)return;G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||ST(u).dom!=='land'||G.t-(u.movedAt||-1e9)<300)return;var best=0;
    L.forEach(function(T){for(var i=0;i<T.s.length;i++){var q=T.s[i];if(q[5]<0.05)continue;var d=trnSegD(u.x,u.y,q[0],q[1],q[2],q[3]);if(d<70)best=Math.max(best,q[5]>=1?0.9:0.2+0.5*q[5]);}});if(best>0){u.ent=Math.max(u.ent||0,best);u.inTr=G.t;}});}
function trnSegD(px,py,x0,y0,x1,y1){var dx=x1-x0,dy=y1-y0,L2=dx*dx+dy*dy,t=L2?clamp(((px-x0)*dx+(py-y0)*dy)/L2,0,1):0;return dist(px,py,x0+dx*t,y0+dy*t);}
(function(){var b=v8Step;v8Step=function(){b();if(!G.started)return;if(G.step%10===5)crtFlush();/* 路面被炸壞：路線快取每小時才整批重算一次（避免持續砲擊時一直重新尋路造成卡頓） */if(G._crtRd&&G.step%120===60){G._crtRd=0;mapChangedSoft();}if(G.step%20===15){bgStep();trnStep();}if(G.step%720===300)bgBury();};})();
/* 存檔與聯機 */
if(typeof GKEYS!=='undefined')GKEYS.push('crt','crtV','kg','trn');
if(typeof MPCOL!=='undefined'){MPCOL.push(['crt','id',function(){var o=[],C=G.crt||{};for(var k in C)o.push({id:+k,v:C[k]>>4<<4});return o;}],['trn','id',function(){return G.trn||[];}]);
  MPCC.crt=function(){if(!G._crtA)G._crtA=[];return G._crtA;};MPCC.trn=function(){return G.trn||(G.trn=[]);};MPKEY.crt='id';MPKEY.trn='id';}
if(typeof MPUX!=='undefined'){MPUX._kia0=1;MPUX.inTr=1;}
/* 戰場墓地不是罪行：經過時只記錄、有些不安 */
(function(){var b=evdReact;evdReact=function(u,e){if(e.k!=='bgrave')return b(u,e);if(typeof fearAdd==='function')fearAdd(u,2,'atro');u.evT=G.t;u.evC=(u.evC||0)+1;u.evK='bgrave';};})();
(function(){var b=evdFound;evdFound=function(e,u){if(e.k!=='bgrave')return b(e,u);e.found[u.side]=G.t;logE(u.side,'evid',uName(u)+'經過'+placeTxt(e.x,e.y)+'的戰場墓地（約 '+fmt(e.n)+' 名陣亡官兵）',e.x,e.y,u.id);};})();
(function(){var b=evdR;evdR=function(e,u,s){return e.k==='bgrave'?300*(G.env.light<0.3?0.6:1):b(e,u,s);};})();
