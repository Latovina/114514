/* ===================== 兵力編成：單位樹、範本展開、自訂單位類型、合成單位的數值、部署 ===================== */
var G=null;
function gid(){G.nid=(G.nid||0)+1;return G.nid;}
function typeOf(k){return (G&&G.types&&G.types[k])||UT[k]||null;}
function uById(id){return G._ix?G._ix[id]:G.units.filter(function(u){return u.id===id;})[0];}
function reix(){G._ix={};G.units.forEach(function(u){G._ix[u.id]=u;});}
function isLeaf(u){return !!u.mix;}
function kidsOf(u){return (u.kids||[]).map(uById).filter(Boolean);}
function leavesOf(u){var o=[];(function w(x){if(isLeaf(x)){if(x.st!=='dead')o.push(x);}else kidsOf(x).forEach(w);})(u);return o;}
/* 每一步快取的下屬末端單位（唯讀，呼叫端不可修改回傳的陣列；陣亡者仍可能留到下一步，使用前請再過濾） */
function leavesC(u){var C=G._lvC;if(!C||C.st!==G.step||C.t!==G.t||C.n!==G.units.length||C.v!==(G._pv||0))C=G._lvC={st:G.step,t:G.t,n:G.units.length,v:G._pv||0,m:{}};var L=C.m[u.id];if(L)return L;
  if(isLeaf(u))L=u.st!=='dead'?[u]:[];else{L=[];var K=kidsOf(u);for(var i=0;i<K.length;i++){var q=leavesC(K[i]);for(var j=0;j<q.length;j++)L.push(q[j]);}}C.m[u.id]=L;return L;}
function ancestors(u){var o=[],c=u;while(c&&c.p>=0){c=uById(c.p);if(c)o.push(c);}return o;}
/* 最上層單位：每一步快取一次（上萬個單位時逐次掃描整張清單太慢）；編制改變（G._pv）時重建 */
function tops(side){var C=G._tpC;if(!C||C.st!==G.step||C.t!==G.t||C.n!==G.units.length||C.v!==(G._pv||0))C=G._tpC={st:G.step,t:G.t,n:G.units.length,v:G._pv||0};var L=C[side];if(!L)L=C[side]=G.units.filter(function(u){return u.side===side&&u.p<0&&u.st!=='dead';});return L.filter(function(u){return u.side===side&&u.p<0&&u.st!=='dead';});}
function sideCmd(side){var T=tops(side).filter(function(u){return !u.irr;}),t=T.filter(function(u){return !isLeaf(u);}).sort(function(a,b){return b.ech-a.ech;});return t[0]||T[0]||null;}
/* 合成單位（mix＝[[類型,數量],…]）的總數值：火力加總、射程取火力加權、速度取最慢 */
function mixStats(mix){var o={men:0,veh:0,sa:0,ha:0,aa:0,shock:0,mdef:0,rE:0,rM:0,ind:0,hard:0,arm:0,ac:0,spot:0,sig:0,nv:9,mor:0,trn:0,dig:0,vr:1e9,vx:1e9,mobi:0,fl:'',end:1e9,dr:0,n:0,era:'',br:'',sym:'',vn:''},wE=0,wM=0,wsum=0;
  mix.forEach(function(m){var t=typeOf(m[0]);if(!t)return;var n=m[1]||1,w=t.men*n+t.veh*n*8+1;o.men+=t.men*n;o.veh+=t.veh*n;o.sa+=t.sa*n;o.ha+=t.ha*n;o.aa+=(t.aa||0)*n;o.shock+=t.shock*w;o.mdef+=t.mdef*w;o.ac+=t.ac*w;o.hard+=t.hard*w;o.arm+=t.arm*w;o.sig+=t.sig*w;o.mor+=t.mor*w;o.trn+=t.trn*w;o.dig+=t.dig*w;wsum+=w;
    var fp=t.sa+t.ha*3+0.01;o.rE+=t.rE*fp;o.rM+=t.rM*fp;wE+=fp;o.ind=Math.max(o.ind,t.ind);o.spot=Math.max(o.spot,t.spot);o.nv=Math.min(o.nv,t.nv);o.vr=Math.min(o.vr,t.vr);o.vx=Math.min(o.vx,t.vx);o.end=Math.min(o.end,t.end||1e9);o.dr=Math.max(o.dr,t.dr||0);o.n+=n;
    for(var i=0;i<t.fl.length;i++)if(o.fl.indexOf(t.fl[i])<0)o.fl+=t.fl[i];if(!o.era||t.men*n>wM){o.era=t.era;o.br=t.br;o.sym=t.sym;o.vn=t.vn;o.mobi=t.mobi;wM=t.men*n;}});
  ['shock','mdef','ac','hard','arm','sig','mor','trn','dig'].forEach(function(k){o[k]=wsum?o[k]/wsum:0;});o.rE=wE?o.rE/wE:0;o.rM=wE?o.rM/wE:0;if(o.nv===9)o.nv=0;if(o.end>=1e9)o.end=0;o.dom=domOf(o.mobi);
  /* 混編時：機動以最慢者為準；任何一個非空中單位就不能飛 */
  var doms={};mix.forEach(function(m){var t=typeOf(m[0]);if(t)doms[t.dom]=1;});if(Object.keys(doms).length>1){o.dom=doms.land?'land':doms.sea?'sea':o.dom;if(o.dom==='land'&&o.mobi>=5)o.mobi=0;}
  return o;}
function ST(u){if(!u._s||u._sv!==G._tv){u._s=u.mix?mixStats(u.mix):mixStats([[u.hq,1]]);u._sv=G._tv;}return u._s;}
function uEra(u){var s=ST(u);return ERAI[s.era]||ERA[6];}
function uDom(u){return ST(u).dom;}
function echOfLeaf(mix){var n=sum(mix,function(m){return m[1]||1;});return n>=12?3:n>=3?2:1;}
/* ---------- 建立單位 ---------- */
function newUnit(side,o){var u={id:gid(),side:side,name:o.name||'',p:o.p===undefined?-1:o.p,ech:o.ech||1,x:0,y:0,hd:0,st:'ok',mor:0,sup:0,fat:0,org:100,exp:o.exp||0,ammo:100,ent:0,form:'deployed',ord:null,pend:[],path:null,img:o.img||'',off:o.off||null,note:''};
  if(o.mix){u.mix=o.mix;}else{u.kids=[];u.hq=o.hq;}G.units.push(u);if(G._ix)G._ix[u.id]=u;return u;}
function initStrength(u){var s=ST(u);u.men0=u.men=s.men;u.veh0=u.veh=s.veh;u.mor=clamp(s.mor+(hasQ(offOf(u),'inspire')?10:0),10,100);u.trn=s.trn;u.ammo=100;u.fuel=s.end||0;u.sup=0;u.fat=0;u.org=100;}
function offOf(u){var c=u;while(c){if(c.off)return c.off;c=c.p>=0?uById(c.p):null;}return null;}
function hqTypeFor(era){var t=null;for(var k in UT)if(UT[k].br==='hq'&&UT[k].era===era){t=k;break;}if(!t){var E=ERAI[era]||ERA[6],best=null;for(var k2 in UT)if(UT[k2].br==='hq'&&!(ERAI[UT[k2].era]||{}).fan){if(!best||Math.abs(ERAI[UT[k2].era].y-E.y)<Math.abs(ERAI[best].y-E.y))best=UT[k2].era;}for(var k3 in UT)if(UT[k3].br==='hq'&&UT[k3].era===best){t=k3;break;}}return t||'hq1940';}
function fmtName(tpl,i){return String(tpl||'').replace('{i}',i);}
/* 範本展開：gran＝'co' 以連為最小單位、'bn' 合併到營、'rgt' 合併到團 */
function buildPreset(side,pk,name,parent,r,gran,eraOv,tpl,ix){var P=FPI[pk];if(!P)return null;var era=eraOv||P.era,ech=P.ech;NMS.side=side;NMS.fem=offFem(side,era);
  var collapse=(gran==='bn'&&ech<=2)||(gran==='rgt'&&ech<=3);
  if(collapse){var mix=flatMix(pk,{});var u=newUnit(side,{name:name||P.n,p:parent,ech:ech,mix:mix,off:newOfficer(r,ech)});u.tpl=tpl;u.ix=ix;u.pk=pk;initStrength(u);if(parent>=0)uById(parent).kids.push(u.id);return u;}
  var F=newUnit(side,{name:name||P.n,p:parent,ech:ech,hq:hqTypeFor(era),off:newOfficer(r,ech)});F.tpl=tpl;F.ix=ix;F.pk=pk;initStrength(F);if(parent>=0)uById(parent).kids.push(F.id);
  P.kids.forEach(function(kd){for(var i=1;i<=kd[1];i++){var nm=fmtName(kd[2],i);if(kd[0].charAt(0)==='@')buildPreset(side,kd[0].slice(1),nm,F.id,r,gran,eraOv,kd[2],i);else{var L=newUnit(side,{name:nm,p:F.id,ech:1,mix:[[kd[0],1]],off:null});L.tpl=kd[2];L.ix=i;initStrength(L);F.kids.push(L.id);}}});
  return F;}
function flatMix(pk,acc){var P=FPI[pk];P.kids.forEach(function(kd){if(kd[0].charAt(0)==='@'){for(var i=0;i<kd[1];i++)flatMix(kd[0].slice(1),acc);}else acc[kd[0]]=(acc[kd[0]]||0)+kd[1];});if(acc===undefined)return [];return Object.keys(acc).map(function(k){return [k,acc[k]];});}
function offFem(side,era){var S=SD(side)||{},m=(FEMM[S.fem||'hist']||FEMM.hist)[1],y=(ERAI[era]||ERA[6]).y;return m<0?0.5:clamp(femBase('hq',y)*0.5*m,0,0.5);}
function addLeaf(side,tk,n,name,parent,r){var t=typeOf(tk);NMS.side=side;var u=newUnit(side,{name:name||t.n,p:parent,ech:echOfLeaf([[tk,n||1]]),mix:[[tk,n||1]],off:n>=3?newOfficer(r,echOfLeaf([[tk,n]])):null});initStrength(u);if(parent>=0)uById(parent).kids.push(u.id);return u;}
function addFormation(side,ech,era,name,parent,r){NMS.side=side;NMS.fem=offFem(side,era);var F=newUnit(side,{name:name,p:parent,ech:ech,hq:hqTypeFor(era),off:newOfficer(r,ech)});initStrength(F);if(parent>=0)uById(parent).kids.push(F.id);return F;}
function delUnit(u){var all=[];(function w(x){all.push(x);kidsOf(x).forEach(w);})(u);var ids={};all.forEach(function(x){ids[x.id]=1;});G.units=G.units.filter(function(x){return !ids[x.id];});
  G.units.forEach(function(x){if(x.kids)x.kids=x.kids.filter(function(k){return !ids[k];});});reix();}
function reparent(u,np){G._pv=(G._pv||0)+1;if(np===u.id)return false;var a=np>=0?uById(np):null;if(a&&ancestors(a).some(function(x){return x.id===u.id;}))return false;if(u.p>=0){var op=uById(u.p);if(op)op.kids=op.kids.filter(function(k){return k!==u.id;});}u.p=np;if(a){a.kids.push(u.id);u.side=a.side;}
  (function w(x){x.side=u.side;kidsOf(x).forEach(w);})(u);return true;}
function dupUnit(u,r){var map={};var cp=function(x,par){var o=clone(x);delete o._s;o.id=gid();map[x.id]=o.id;o.p=par;o.name=x.name+(par===x.p?'（複製）':'');if(o.kids)o.kids=[];G.units.push(o);G._ix[o.id]=o;if(par>=0)uById(par).kids.push(o.id);kidsOf(x).forEach(function(k){cp(k,o.id);});return o;};void r;return cp(u,u.p);}
/* 單位的顯示梯隊：葉單位依包含的連數；編制單位依設定 */
function dispEch(u){return isLeaf(u)?Math.max(u.ech||1,echOfLeaf(u.mix)):u.ech;}
/* 兵力摘要 */
function strengthOf(u){var L=isLeaf(u)?[u]:leavesOf(u),m=0,m0=0,v=0,v0=0;L.forEach(function(x){m+=x.men;m0+=x.men0;v+=x.veh;v0+=x.veh0;});return {men:m,men0:m0,veh:v,veh0:v0,f:m0+v0*8?((m+v*8)/(m0+v0*8)):0,n:L.length};}
/* ---------- 部署：把編制單位依標準隊形排開 ---------- */
function frontW(u){var E=uEra(u),L=isLeaf(u)?[u]:leavesOf(u);return Math.max(E.front*0.9,sum(L,function(x){var s=ST(x);return (s.dom==='land'?E.front*Math.sqrt(Math.max(0.5,s.men/150)):E.front*0.6);}));}
function placeUnit(u,x,y,hd){var s=ST(u);var p=validPos(s,x,y);u.x=p[0];u.y=p[1];u.hd=hd;u.home=[u.x,u.y];u.placed=1;if(s.dom==='air'){u.st='base';u.base=[u.x,u.y];}}
function deployTree(F,x,y,hd,depth){var kids=kidsOf(F);placeUnit(F,x-Math.cos(hd)*frontW(F)*0.18,y-Math.sin(hd)*frontW(F)*0.18,hd);if(!kids.length)return;
  var fx=Math.cos(hd),fy=Math.sin(hd),lx=-fy,ly=fx,man=kids.filter(function(k){var r=roleOf(k),L=isLeaf(k)?[k]:leavesOf(k);return (r==='man'||r==='rec')&&L.length&&L.filter(function(x){return ST(x).dom==='land';}).length>=L.length/2;}),sup=kids.filter(function(k){return man.indexOf(k)<0;});
  var mF=man.filter(function(k){return !isLeaf(k);}),mL=man.filter(isLeaf),front,res;if(mF.length>=2){var nf=Math.ceil(mF.length*2/3);front=mF.slice(0,nf).concat(mL.filter(function(k){return roleOf(k)==='rec';}));res=mF.slice(nf).concat(mL.filter(function(k){return roleOf(k)!=='rec';}));}
  else{front=man.length>=3?man.slice(0,Math.ceil(man.length*2/3)):man;res=man.filter(function(k){return front.indexOf(k)<0;});}var W=sum(front,frontW),pos=-W/2;
  front.forEach(function(k){var w=frontW(k);var c=pos+w/2;pos+=w;deployTree(k,x+lx*c,y+ly*c,hd,depth+1);});
  var D=Math.min(Math.max(300,W*0.35),1200+600*(F.ech||1));var WR=sum(res,frontW),pr=-WR/2;res.forEach(function(k){var w=frontW(k),c=pr+w/2;pr+=w;deployTree(k,x-fx*D+lx*c,y-fy*D+ly*c,hd,depth+1);});
  sup.forEach(function(k,i){var s=ST(k),back=s.dom==='air'?D*3:s.dom!=='land'?0:(s.ind?Math.min(s.ind*0.25,D*2.5):Math.min(D*1.3,3000)),c=(i-(sup.length-1)/2)*Math.max(250,uEra(k).front*0.7);deployTree(k,x-fx*back+lx*c,y-fy*back+ly*c,hd,depth+1);});}
/* 位置合法化：陸上單位找最近的陸地格、艦艇找水域、空中單位不限 */
function validPos(s,x,y){var MP=G.map,cs=MP.cs;x=clamp(x,cs,MP.Wm-cs);y=clamp(y,cs,MP.Hm-cs);if(s.dom==='air')return [x,y];var cx=Math.floor(x/cs),cy=Math.floor(y/cs);
  var GW=MP.GW,out=null;for(var r=0;r<220&&!out;r++)ringRow(cx,cy,r,GW,MP.GH,function(X,Y){if(!cellOK(s,Y*GW+X))return false;out=[(X+0.5)*cs,(Y+0.5)*cs];return true;});return out||[x,y];}
function cellOK(s,k){var MP=G.map,c=MP.lc[k];if(s.dom==='air')return true;if(s.dom==='land')return !isWater(c);return navOK(s.dr||2,k);}
/* 艦艇可航行的格子：依吃水 */
function navOK(dr,k){var MP=G.map,c=MP.lc[k];if(c===LCI.sea)return true;if(c===LCI.shal)return dr<=2||MP.el[k]<-6;if(c===LCI.lake)return dr<=2;if(c===LCI.riv)return dr<=1;return false;}
