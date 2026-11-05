/* ===================== 排：連由各種排組成 =====================
   連是最小的可操控單位，由幾個排組成：步兵與機步連是三個步兵排加一個火力排（1900 年以前沒有火力排）、戰車與偵察等連三個排、砲兵與防空連兩個排。
   一個排是該類連的幾分之一（人員、車輛與火力），所以一個連可以用不同類型的排組合，例如三個機步排加一個戰車排。
   排不能直接下令，跟著連依陣型展開（橫隊並列、縱隊前後、楔形、梯隊、環形、疏開）；傷亡依敵人來的方向分配，面向敵人的排損失較多；
   排的兵力剩不到兩成就失去戰鬥力，殘部併入其他排；補充兵員時先補齊各排，再重建打散的排。
   混編的連失去某類排時，那一類的火力跟著減少：例如戰車排打光，連的反裝甲火力就大減。 */
var PLTK={inf:['步兵排','步'],mech:['機步排','機'],arm:['戰車排','戰'],cav:['騎兵排','騎'],at:['反戰車排','反'],ad:['防空排','防'],art:['砲排','砲'],rec:['偵察排','偵'],eng:['工兵排','工'],
  mp:['憲兵排','憲'],sec:['警衛排','衛'],med:['醫療排','醫'],sup:['運輸排','運'],hq:['指揮排','指'],rear:['勤務排','勤'],gue:['游擊排','游'],sof:['特戰排','特'],pike:['長槍排','槍'],wpn:['火力排','火']};
/* 一個連類型有幾個排（同時決定一個排佔該類連的幾分之一）；0 表示不分排（空中、海上與奇幻生物） */
/* 類型的排數與兵科（依類型版本快取） */
var PLTC={v:-1,o:{}};
function pltInfo(k){var v=G?G._tv||0:0;if(PLTC.v!==v){PLTC.v=v;PLTC.o={};}var o=PLTC.o[k];if(o)return o;var t=typeOf(k);if(!t)return PLTC.o[k]={n:0,c:'inf'};var s=mixStats([[k,1]]),c=clsOfS(s),n;
  if(s.dom!=='land'||c==='beast')n=0;else if((c==='inf'||c==='mech')&&(ERAI[s.era]||ERA[6]).y>=1900&&s.men>=60)n=4;else if(c==='art'||c==='ad'||c==='hq'||c==='rear'||c==='med')n=2;else n=s.men+s.veh<25?2:3;
  return PLTC.o[k]={n:n,c:PLTK[c]?c:'inf'};}
function pltN(k){return pltInfo(k).n;}
function pltKind(k,slot,N){var c=pltInfo(k).c;if(N===4&&slot===N-1&&(c==='inf'||c==='mech'))return 'wpn';return c;}
function pltKindName(k){var c=pltInfo(k).c,P=PLTK[c]||PLTK.inf,t=typeOf(k),nm=t&&t.n||'';if(c==='art'&&/迫/.test(nm))return '迫砲排';if(c==='art'&&/火箭|多管/.test(nm))return '火箭排';return P[0];}
/* 有排的連：陸上、最小的可操控單位（合併到營或團的單位不分排） */
function pltOK(u){if(!u||!isLeaf(u))return false;var n=0;for(var i=0;i<u.mix.length;i++){if(!pltN(u.mix[i][0]))return false;n+=u.mix[i][1]||1;}return n<2.5;}
/* 排的組成（類型清單）：自訂的 u.pltT，否則依 mix 的標準編組 */
function pltTypes(u){if(u.pltT&&u.pltT.length)return u.pltT.slice();var L=[];u.mix.forEach(function(m){var N=pltN(m[0]),c=Math.max(1,Math.round((m[1]||1)*N));for(var i=0;i<c;i++)L.push(m[0]);});return L;}
/* 由排的組成算出連的 mix：每類排是該類連的 1/N */
function pltMix(T){var o={},L=[];T.forEach(function(k){o[k]=(o[k]||0)+1;});Object.keys(o).forEach(function(k){L.push([k,+(o[k]/Math.max(1,pltN(k))).toFixed(4)]);});return L;}
function pltSig(u){return JSON.stringify(u.mix)+'|'+(u.pltT||[]).join(',');}
function pltBuild(u){var T=pltTypes(u),cnt={},seen={},L=[],nC=0;T.forEach(function(k){cnt[k]=(cnt[k]||0)+1;});var mixN={};u.mix.forEach(function(m){mixN[m[0]]=m[1]||1;});
  T.forEach(function(k){var t=typeOf(k),N=pltN(k),i=seen[k]||0;seen[k]=i+1;var share=(mixN[k]||cnt[k]/N)/cnt[k],kd=cnt[k]===N?pltKind(k,i,N):pltInfo(k).c;
    var p={t:k,k:kd,m0:t.men*share,v0:t.veh*share,m:0,v:0,x:0};if(kd!=='wpn')nC++;p.n=kd==='wpn'?'火力排':'第'+nC+'排';L.push(p);});
  var sm=sum(L,function(p){return p.m0;}),sv=sum(L,function(p){return p.v0;}),fm=u.men0>0&&sm>0?u.men/sm:1,fv=u.veh0>0&&sv>0?u.veh/sv:fm;L.forEach(function(p){p.m=p.m0*fm;p.v=p.v0*fv;});
  u.plt=L;u.pltK=pltSig(u);return L;}
function pltOf(u){if(!pltOK(u)){if(u.plt)u.plt=null;return null;}if(!u.plt||u.pltK!==pltSig(u))pltBuild(u);return u.plt;}
function pltLive(u){var P=pltOf(u);return P?P.filter(function(p){return !p.x;}):[];}
/* ---------- 陣型中的位置（連的座標系：前方是行進或面對的方向；連的位置是連部，在各排後方） ---------- */
function pltSlots(u,n){var W=Math.max(120,frontW(u)*0.8),f=u.form==='march'?'march':(u.fmC||'line'),L=[],i;
  for(i=0;i<n;i++){var a=n>1?i/(n-1)-0.5:0,fw=0,lt=0;
    if(f==='march'||f==='column'){fw=(n-1)/2*W*0.35-i*W*0.35+(n%2?W*0.17:0);lt=0;}
    else if(f==='wedge'){fw=i===0?W*0.3:i<n-1||n<4?-W*0.05:-W*0.35;lt=i===0?0:(i%2?-1:1)*W*0.32*(i<n-1||n<4?1:0);if(n===2&&i===1){fw=-W*0.2;lt=0;}}
    else if(f==='echelon'){fw=-i*W*0.22;lt=a*W*0.85;}
    else if(f==='allround'){var an=2*PI*i/n;fw=Math.cos(an)*W*0.32;lt=Math.sin(an)*W*0.32;}
    else if(f==='dispersed'){fw=W*0.15+(i%2?-1:1)*W*0.12;lt=a*W*1.25;}
    else if(f==='skirmish'){fw=W*0.15;lt=a*W*1.1;}
    else{fw=W*0.15;lt=a*W*0.9;}
    L.push([fw,lt]);}
  /* 火力排在後方中央 */var P=pltLive(u);if(f!=='march'&&f!=='column'&&f!=='allround'&&n>=3&&P.length===n&&P[n-1].k==='wpn'){L[n-1]=[-W*0.28,0];if(f==='line'||f==='dispersed'||f==='skirmish'){var m=n-1;for(i=0;i<m;i++){var b=m>1?i/(m-1)-0.5:0;L[i]=[W*0.15,b*W*(f==='dispersed'?1.25:f==='skirmish'?1.1:0.9)];}}}
  return L;}
/* 各排的世界座標 */
function pltPos(u){var P=pltLive(u);if(!P.length)return [];var S=pltSlots(u,P.length),h=u.hd||0,c=Math.cos(h),s=Math.sin(h);return P.map(function(p,i){var o=S[i];return [u.x+o[0]*c-o[1]*s,u.y+o[0]*s+o[1]*c,p];});}
/* ---------- 兵力：與連的總數同步；打散與重建 ---------- */
function pltSync(u){var P=pltOf(u);if(!P)return;var L=P.filter(function(p){return !p.x;});
  ['m','v'].forEach(function(f){var tot=f==='m'?u.men:u.veh,f0=f+'0',cur=sum(L,function(p){return p[f];}),d=tot-cur;if(Math.abs(d)<1e-6)return;
    if(d<0){var s=cur;L.forEach(function(p){var c=s>0?p[f]/s*(-d):0;p[f]=Math.max(0,p[f]-c);});}
    else{var def=sum(L,function(p){return Math.max(0,p[f0]-p[f]);}),use=Math.min(d,def);L.forEach(function(p){var g=def>0?Math.max(0,p[f0]-p[f])/def*use:0;p[f]+=g;});d-=use;
      if(d>1e-6){var R=P.filter(function(p){return p.x;});R.forEach(function(p){if(d<=1e-6)return;var g=Math.min(d,p[f0]*0.5);if(g<=0)return;p.x=0;p[f]=g;if(f==='m')p.v=Math.min(p.v,p.v0);d-=g;L.push(p);});
        if(d>1e-6&&L.length){var s0=sum(L,function(p){return p[f0];})||1;L.forEach(function(p){p[f]+=d*p[f0]/s0;});}}}});
  /* 打散：剩不到兩成而且還有其他排 */
  var live=P.filter(function(p){return !p.x;});live.forEach(function(p){var f0=p.m0+p.v0*8,f1=p.m+p.v*8;if(f0<=0||f1>=0.2*f0)return;var O=P.filter(function(q){return !q.x&&q!==p;});if(!O.length)return;
    var q=O.slice().sort(function(a,b){return (a.m+a.v*8)/(a.m0+a.v0*8||1)-(b.m+b.v*8)/(b.m0+b.v0*8||1);})[0];q.m+=p.m;q.v+=p.v;p.m=0;p.v=0;p.x=1;
    if(G.started&&u.side>=0)logE(u.side,'unit',uName(u)+'的'+p.n+'（'+(p.k==='wpn'?'火力排':pltKindName(p.t))+'）失去戰鬥力，殘部併入'+q.n,u.x,u.y,u.id);});}
/* 傷亡依敵人來的方向分配：面向敵人的排損失較多 */
(function(){var b=applyDamage;applyDamage=function(){var S=[];if(G._inc)for(var id in G._inc){var t=uById(+id);if(!t||!alive(t)||!t.plt&&!pltOK(t))continue;var I=G._inc[id],dx=0,dy=0;for(var k in I.by){var a=uById(+k);if(!a)continue;var d=dist(a.x,a.y,t.x,t.y)||1,w=I.by[k];dx+=(a.x-t.x)/d*w;dy+=(a.y-t.y)/d*w;}S.push([t,t.men,t.veh,dx,dy]);}
  b.apply(this,arguments);
  S.forEach(function(q){var t=q[0];if(!pltOf(t))return;var dm=Math.max(0,q[1]-t.men),dv=Math.max(0,q[2]-t.veh),L=pltPos(t),n=Math.sqrt(q[3]*q[3]+q[4]*q[4]);
    if((dm>0||dv>0)&&L.length>1){var W=Math.max(120,frontW(t)*0.8),wt=L.map(function(o){var e=n>0?((o[0]-t.x)*q[3]+(o[1]-t.y)*q[4])/n/W:0;return Math.exp(2.2*e);});
      [['m',dm],['v',dv]].forEach(function(z){var f=z[0],amt=z[1];if(amt<=0)return;for(var it=0;it<3&&amt>1e-6;it++){var tw=0;L.forEach(function(o,i){if(o[2][f]>0)tw+=wt[i]*o[2][f];});if(tw<=0)break;var used=0;L.forEach(function(o,i){var p=o[2];if(p[f]<=0)return;var c=Math.min(p[f],amt*wt[i]*p[f]/tw);p[f]-=c;used+=c;});amt-=used;}});}
    pltSync(t);});};})();
/* 其他原因（疾病、逃兵、補充、合併）造成的兵力變化：每一步對齊 */
(function(){var b=simStep;simStep=function(){var r=b.apply(this,arguments);if(G&&G.started)G.units.forEach(function(u){if(!u.plt||!alive(u))return;var L=u.plt,m=0,v=0;for(var i=0;i<L.length;i++)if(!L[i].x){m+=L[i].m;v+=L[i].v;}if(Math.abs(m-u.men)>0.3||Math.abs(v-u.veh)>0.05)pltSync(u);});return r;};})();
/* ---------- 混編的連：失去某類排時，那一類的火力跟著減少 ---------- */
function pltMul(u,f){var P=u.plt;if(!P||P.length<2||!u.pltK)return 1;var t0=P[0].t,mixd=false;for(var i=1;i<P.length;i++)if(P[i].t!==t0){mixd=true;break;}if(!mixd)return 1;
  var s=ST(u),tot=s[f]||0;if(tot<=0)return 1;var by={};P.forEach(function(p){var o=by[p.t]||(by[p.t]={a:0,b:0});o.a+=p.m+p.v*8;o.b+=p.m0+p.v0*8;});var eff=0;
  u.mix.forEach(function(m){var t=typeOf(m[0]),o=by[m[0]];if(!t||!o)return;eff+=(t[f]||0)*(m[1]||1)*(o.b>0?o.a/o.b:0);});var sf=strFrac(u);if(sf<=0.01)return 1;return clamp(eff/(tot*sf),0.2,3);}
(function(){var b=saOf;saOf=function(u,s){var r=b(u,s);return u&&u.plt?r*pltMul(u,'sa'):r;};})();
(function(){var b=haOf;haOf=function(u,s){var r=b(u,s);return u&&u.plt?r*pltMul(u,'ha'):r;};})();
/* 編組改了（編制編輯器）：重建 */
(function(){if(typeof reinitLeaf!=='function')return;var b=reinitLeaf;reinitLeaf=function(u){b.apply(this,arguments);if(u)u.plt=null;};})();
/* ---------- 匯出匯入與存檔：自訂的排組成跟著編制檔走；匯入時數量會被取整，依排的組成還原 mix ---------- */
if(typeof ORBKEEP!=='undefined'&&ORBKEEP.indexOf('pltT')<0)ORBKEEP.push('pltT');
function pltFix(u){if(!u||!u.pltT)return;if(!Array.isArray(u.pltT)||!u.pltT.length||!u.mix){delete u.pltT;return;}var D=u.pltT.filter(function(k,i,a){return a.indexOf(k)===i;});
  /* 自訂類型匯入時換了代號：依出現順序對應到 mix 的類型 */if(D.some(function(k){return !typeOf(k);})&&D.length===u.mix.length){var mp={};D.forEach(function(k,i){mp[k]=u.mix[i][0];});u.pltT=u.pltT.map(function(k){return mp[k];});}
  if(u.pltT.some(function(k){return !typeOf(k)||!pltN(k);})){delete u.pltT;return;}u.pltT=u.pltT.slice(0,8);var mx=pltMix(u.pltT);if(JSON.stringify(mx)===JSON.stringify(u.mix))return;
  var fr=u.men0>0?u.men/u.men0:1,fv=u.veh0>0?u.veh/u.veh0:fr;u.mix=mx;u._s=null;var s=ST(u);u.men0=s.men;u.veh0=s.veh;u.men=s.men*fr;u.veh=s.veh*fv;u.plt=null;}
(function(){if(typeof orbImport!=='function')return;var b=orbImport;orbImport=function(){var r=b.apply(this,arguments);try{if(G&&G.units)G.units.forEach(pltFix);}catch(e){}return r;};})();
(function(){var b=prepareBattle;prepareBattle=function(){if(G&&G.units)G.units.forEach(pltFix);return b.apply(this,arguments);};})();
