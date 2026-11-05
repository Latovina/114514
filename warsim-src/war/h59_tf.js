/* ===================== 第三方陣營：維和部隊、中立國軍隊、武裝團體、外國志願軍 =====================
   設定頁「第三方陣營」卡片建立第三方（G.set.tf）：種類、名稱、規模、所在位置與範圍、與兩軍的關係（盟友、中立、敵對）。開戰後由模擬依性質行動（G.tf）：
   維和部隊守在檢查哨、保護附近的平民，只在遭到攻擊時還擊；中立國軍隊守住領土，外國部隊在領土內停留太久或開火就轉為敵對；
   武裝團體守護家鄉、首輪伏擊特別猛烈，平民被殺害就與加害的一方為敵；外國志願軍支援盟友，主動攻擊附近的敵人。
   關係可以隨時修改（聯機由房主）；受到攻擊、領土被侵入、平民被殺害時第三方也會自己改變關係。攻擊維和部隊或中立國軍隊記為戰爭罪行。
   盟友接受「請求協助」，派兵到指定地點防守或攻擊。第三方的部隊是簡化的連級單位（G.tf.U），以單位類型的火力、射程、裝甲與速度計算。 */
var TFK={pk:{n:'維和部隊',col:'#0288D1',rel:['neu','neu'],r:5000,mor:62,d:'守在檢查哨、保護附近的平民，只在遭到攻擊時還擊；攻擊維和部隊是戰爭罪行'},
  neu:{n:'中立國軍隊',col:'#6D4C41',rel:['neu','neu'],r:7000,mor:66,d:'守住自己的領土；外國部隊在領土內停留太久或開火就轉為敵對；攻擊中立國是戰爭罪行'},
  mil:{n:'武裝團體',col:'#558B2F',rel:['neu','neu'],r:3500,mor:55,d:'守護家鄉的民兵，善於伏擊；家鄉的平民被殺害就與加害的一方為敵'},
  exp:{n:'外國志願軍',col:'#8E24AA',rel:['ally','host'],r:6000,mor:68,d:'支援盟友的外國部隊，主動攻擊附近的敵人'}};
if(typeof KINDN!=='undefined')KINDN.tf='第三方部隊';
var TFREL={ally:'盟友',neu:'中立',host:'敵對'},TFSZ={co:[1,'一個連'],bn:[3,'一個營'],rgt:[7,'一個團']};
if(typeof APDEF!=='undefined')APDEF.tf=true;
function tfOn(){return !!(G&&G.set&&Array.isArray(G.set.tf)&&G.set.tf.some(tfOk));}
function tfOk(c){return !!c&&typeof c==='object'&&!!TFK[c.k]&&isFinite(+c.x)&&isFinite(+c.y)&&+c.id>0;}
function tfr(){var X=G.tf,s=X.rs|0||1;s^=s<<13;s^=s>>>17;s^=s<<5;X.rs=s|0;return ((s>>>0)%1000003)/1000003;}
function tfF(id){var L=G.tf?G.tf.F:[];for(var i=0;i<L.length;i++)if(L[i].id===id)return L[i];return null;}
function tfRel(F,s){return F&&F.rel&&TFREL[F.rel[s]]?F.rel[s]:'neu';}
function tfHost(g,s){return tfRel(tfF(g.f),s)==='host';}
function tfNm(F){if(!F)return '第三方';var K=TFK[F.k]||TFK.pk;return F.n===K.n?F.n:F.n+'（'+K.n+'）';}
/* 依年代挑選第三方的部隊類型 */
function tfTypes(k){var e=eraOfYear(G.set.y).k,L=Object.keys(UT).filter(function(q){var T=UT[q];return T.era===e&&(!T.dom||T.dom==='land')&&T.men>0;});if(!L.length)L=Object.keys(UT).filter(function(q){return UT[q].br==='inf';});
  var pick=function(brs){for(var i=0;i<brs.length;i++){var c=L.filter(function(q){return UT[q].br===brs[i];});if(c.length)return c[0];}return L[0];},inf=pick(['inf','mot','mech','sec','pike','cav']);
  if(k==='pk')return [pick(['mech','mot','inf']),inf,inf];if(k==='neu')return [inf,pick(['arm','mech','cav','inf']),inf];if(k==='mil')return [pick(['gue','inf','sec','mot'])];return [pick(['mech','mot','inf']),pick(['arm','mech','inf']),inf];}
function tfInit(){if(G.tf&&G.tf.F)return G.tf;G.tf={F:[],U:[],seq:0,rs:(hstr((G.set.seed||'')+'|tf')|0)||1,st:{k:sA0(),lost:sA0()}};return G.tf;}
/* 設定與實際的第三方對齊：新增的部署上場、修改的關係與名稱生效、刪除的撤出戰場 */
function tfSync(){var X=tfInit(),S=(G.set.tf||[]).filter(tfOk);
  S.forEach(function(c){var F=tfF(+c.id),rel=SIDES().map(function(s){var r=c.rel&&c.rel[s];return TFREL[r]?r:(TFK[c.k].rel[s]||'neu');});
    if(!F){F={id:+c.id,k:c.k,n:String(c.n||TFK[c.k].n).slice(0,30),rel:rel.slice(),rv:+c.rv||0,gr:sA0(),wc:sA0(),vio:sA0(),warn:sA0(),x:+c.x,y:+c.y,cx:+c.x,cy:+c.y,r:clamp(+c.r||TFK[c.k].r,1000,30000),t0:G.t,req:null};X.F.push(F);tfSpawn(F,c);
      logE(-1,'tf','第三方「'+tfNm(F)+'」在'+placeTxt(F.x,F.y)+'：與'+G.sides[0].name+TFREL[F.rel[0]]+'、與'+G.sides[1].name+TFREL[F.rel[1]],F.x,F.y);return;}
    /* 玩家（或房主）改了關係：版本號不同就整組套用 */if((+c.rv||0)!==(F.rv||0)){F.rv=+c.rv||0;SIDES().forEach(function(s){tfSetRel(F,s,rel[s],'協議變更');});}
    if(+c.x!==F.cx||+c.y!==F.cy){var dx=+c.x-F.cx,dy=+c.y-F.cy;F.cx=+c.x;F.cy=+c.y;F.x+=dx;F.y+=dy;X.U.forEach(function(g){if(g.f!==F.id)return;var p=validPos({dom:'land'},g.hx+dx,g.hy+dy);g.hx=p[0];g.hy=p[1];});}
    F.n=String(c.n||F.n).slice(0,30);F.r=clamp(+c.r||F.r,1000,30000);});
  var gone=X.F.filter(function(F){return !S.some(function(c){return +c.id===F.id;});});gone.forEach(function(F){logE(-1,'tf','第三方「'+F.n+'」撤出戰場',F.x,F.y);});
  if(gone.length){X.F=X.F.filter(function(F){return gone.indexOf(F)<0;});X.U=X.U.filter(function(g){return !!tfF(g.f);});}}
function tfSpawn(F,c){var T=tfTypes(F.k),n=(TFSZ[c.sz]||TFSZ.bn)[0],X=G.tf;for(var i=0;i<n;i++){var ty=T[i%T.length],U=UT[ty],a=i/n*2*PI+0.4,d=n>1?Math.min(F.r*0.45,700+350*n):0,p=validPos({dom:'land'},F.x+Math.cos(a)*d,F.y+Math.sin(a)*d);
    var men=Math.round((U.men||100)*(F.k==='mil'?1.3:1)),veh=F.k==='mil'?0:Math.round(U.veh||0);
    X.U.push({id:++X.seq,f:F.id,ty:ty,n:F.n+'第'+(i+1)+'連',x:p[0],y:p[1],hx:p[0],hy:p[1],hd:0,men:men,veh:veh,men0:men,veh0:veh,mor:TFK[F.k].mor,st:'ok',sn:sAV(-1e9),ub:sAV(-1e9),task:null,fired:-1e9,f0:0,uf:-1e9,mv:G.t,ent:0.2,cas:0,vl:0});}}
/* ---------- 關係：設定、受害累積、抗議、轉為敵對 ---------- */
function tfSetRel(F,s,r,why){if(!TFREL[r]||F.rel[s]===r)return;var o=F.rel[s]||'neu';F.rel[s]=r;F.gr[s]=r==='host'?Math.max(F.gr[s]||0,100):0;F.vio[s]=0;F.warn[s]=0;
  logE(-1,'tf','第三方「'+F.n+'」與'+G.sides[s].name+'的關係：'+TFREL[o]+' → '+TFREL[r]+(why?'（'+why+'）':''),F.x,F.y);if(r==='host'&&G.onPause&&apOn('tf'))G.onPause(F.n+'轉為敵對');}
function tfHarm(F,s,v,kind,src){if(!(v>0)||F.rel[s]==='host')return;var g0=F.gr[s]||0;F.gr[s]=g0+v;var why=kind==='zone'?'部隊侵入領土':kind==='civ'?'平民遭到殺害':kind==='ff'?'誤擊':'遭到攻擊';
  if(g0<40&&F.gr[s]>=40)logE(s,'tf','第三方「'+F.n+'」就'+why+'向'+G.sides[s].name+'提出嚴正抗議',F.x,F.y);
  if(F.rel[s]==='neu'&&F.gr[s]>=100)tfSetRel(F,s,'host',why);else if(F.rel[s]==='ally'&&F.gr[s]>=160)tfSetRel(F,s,'neu',why);
  if((F.k==='pk'||F.k==='neu')&&kind!=='zone'&&kind!=='civ'&&!F.wc[s]&&G.civ&&typeof warCrime==='function'){var top=src&&src.side===s?src:sideCmd(s);if(top){F.wc[s]=1;warCrime(top,'tf',0,G.sides[s].name+'的部隊攻擊'+TFK[F.k].n+'「'+F.n+'」',false);if(G.civ.rep)G.civ.rep[s]=clamp((G.civ.rep[s]===undefined?60:G.civ.rep[s])-(F.k==='pk'?12:6),0,100);}}}
/* ---------- 每兩步：觀測、決策、移動、射擊、士氣 ---------- */
function tfStep(){if(!tfOn()){if(G.tf&&G.tf.F.length){G.tf.F=[];G.tf.U=[];}return;}var X=tfInit();if(!X.syn||G.step%10===0){X.syn=1;tfSync();}if(!X.U.length)return;
  tfSee();if(G.step%4===0)tfThink();tfMove();tfFire();tfUFire();if(G.step%4===2)tfViol();tfMor();var n0=X.U.length;X.U=X.U.filter(function(g){return g.st!=='dead';});if(X.U.length!==n0)X.U.forEach(function(){});}
function tfSee(){var X=G.tf;SIDES().forEach(function(s){X.U.forEach(function(g){if(g.sn[s]===undefined){g.sn[s]=-1e9;g.ub[s]=-1e9;}var F=tfF(g.f);if(!F)return;if(tfRel(F,s)==='ally'){g.sn[s]=G.t;return;}var f=false,sig=g.veh>3?1:F.k==='mil'?0.7:0.85;
    gridNearS(g.x,g.y,7000,s,function(u){if(f||!onMap(u)||!isLeaf(u))return;if(dist(u.x,u.y,g.x,g.y)<=zedVR(u)*sig)f=true;});
    if(f){if(G.t-g.sn[s]>6*3600)logE(s,'tf','發現第三方部隊：'+g.n+'（'+TFK[F.k].n+'，與本方'+TFREL[tfRel(F,s)]+'）',g.x,g.y);g.sn[s]=G.t;}});});}
function tfEnemyNear(g,F,R){var best=null,bd=1e9;SIDES().forEach(function(s){if(tfRel(F,s)!=='host')return;gridNearS(g.x,g.y,R,s,function(u){if(!onMap(u)||!isLeaf(u)||ST(u).dom==='air')return;if(F.k==='neu'&&dist(u.x,u.y,F.x,F.y)>F.r+1500)return;var d=dist(u.x,u.y,g.x,g.y);if(d<bd){bd=d;best=u;}});});return best;}
function tfThink(){G.tf.U.forEach(function(g){var F=tfF(g.f);if(!F||g.st==='dead')return;
  if(g.st==='rout'){var a=Math.atan2(g.y-F.y,g.x-F.x),far=dist(g.x,g.y,F.x,F.y)>F.r*0.8;g.task={k:'move',x:far?F.x:g.x+Math.cos(a)*1500,y:far?F.y:g.y+Math.sin(a)*1500};if(g.mor>=45&&G.t-g.uf>1200){g.st='ok';logE(-1,'tf',g.n+'重新整頓',g.x,g.y);}return;}
  var R=F.k==='exp'?15000:F.k==='neu'?F.r+1500:F.k==='mil'?2500:0,en=R?tfEnemyNear(g,F,R):null;
  if(F.req&&G.t-F.req.t<8*3600&&(F.rel[0]==='ally'||F.rel[1]==='ally')){g.task={k:F.req.k==='attack'&&en?'attack':'move',x:F.req.x,y:F.req.y,u:en?en.id:0};if(!en||F.req.k!=='attack')return;}
  if(en&&F.k!=='pk'){g.task={k:'attack',x:en.x,y:en.y,u:en.id};return;}g.task={k:'move',x:g.hx,y:g.hy};});}
function tfMove(){var MP=G.map,night=G.env&&G.env.phase==='night';G.tf.U.forEach(function(g){var T=g.task;if(!T||g.st==='dead')return;var tx=T.x,ty=T.y,U=UT[g.ty]||{};
  if(T.k==='attack'){var e=uById(T.u);if(e&&alive(e)&&onMap(e)){tx=e.x;ty=e.y;}if(dist(g.x,g.y,tx,ty)<=Math.max(250,(U.rE||800)*0.8))return;}
  var d=dist(g.x,g.y,tx,ty);if(d<80){if(g.ent<0.6)g.ent=Math.min(0.6,g.ent+0.004);return;}g.ent=Math.max(0.1,g.ent-0.05);
  var v=Math.max(2,Math.min(U.vx||4,40))*(g.st==='rout'?1.3:1)*(night?0.7:1)*1000/3600*DT*2,st=Math.min(v,d),a=Math.atan2(ty-g.y,tx-g.x);
  for(var k=0;k<7;k++){var aa=a+(k%2?1:-1)*Math.ceil(k/2)*0.45,nx=g.x+Math.cos(aa)*st,ny=g.y+Math.sin(aa)*st;if(nx<0||ny<0||nx>=MP.Wm||ny>=MP.Hm||!zedPass(nx,ny))continue;g.x=nx;g.y=ny;g.hd=aa;g.mv=G.t;break;}});}
/* 第三方向敵對的部隊射擊（維和部隊只還擊；武裝團體的第一輪伏擊特別猛烈） */
function tfFire(){G.tf.U.forEach(function(g){if(g.st==='dead'||g.men<1)return;var F=tfF(g.f),U=UT[g.ty];if(!F||!U)return;var rM=(U.rM||1500)*(g.st==='rout'?0.5:1),vr=Math.min(rM,(U.spot||2500)*1.1),best=null,bd=1e9;
    SIDES().forEach(function(s){if(tfRel(F,s)!=='host')return;if(F.k==='pk'&&G.t-g.ub[s]>900)return;gridNearS(g.x,g.y,vr,s,function(u){if(!onMap(u)||!isLeaf(u)||ST(u).dom==='air')return;var d=dist(u.x,u.y,g.x,g.y);if(d<bd&&d<=vr){bd=d;best=u;}});});
    if(best)tfShootU(g,U,F,best,bd);});}
function tfPen(U){return U.pen!==undefined?U.pen:(U.ha||1)*1.6+((U.hard||0)>=0.5?2:0);}
function tfShootU(g,U,F,t,d){var ts=ST(t),rf=rangeF(d,U.rE||600,U.rM||1500);if(!(rf>0))return;var fr=clamp((g.men+g.veh*8)/Math.max(1,g.men0+g.veh0*8),0,1),mor=clamp(g.mor/70,0.3,1.2),amb=F.k==='mil'&&!g.f0?2.5:1;
  var k=fr*mor*rf*tgtModDirect(t,ts)*(DT*2/60)*FIRE_K*(0.7+0.6*tfr())*amb,Fm=(U.sa||5)*k,Fv=(U.ha||1)*k*VK*penF(tfPen(U),armVs(t,ts,null));
  var dmn=Fm*(1-0.9*ts.hard)+Fv*ts.hard*(t.men/Math.max(1,t.veh))*0.35,dv=Fv*ts.hard+Fm*(1-ts.hard)*(t.veh/Math.max(1,t.men))*0.15;if(!(dmn>0)&&!(dv>0))return;
  hit(t,null,dmn,dv,Math.min(30,4+600*(dmn+dv*4)/Math.max(10,t.men+t.veh*4)),'tf');t.uf=G.t;t.tfT=G.t;t.tfB=g.id;g.fired=G.t;g.f0=1;G.tf.st.lost[t.side]+=dmn;
  if(!t.tfL||G.t-t.tfL>1800){t.tfL=G.t;logE(t.side,'tf',uName(t)+'遭到第三方「'+tfNm(F)+'」射擊',t.x,t.y,t.id);}
  if(typeof FX!=='undefined'&&FX.cap&&FX.ev.length<5000)FX.ev.push({k:'tfire',x0:g.x,y0:g.y,x1:t.x,y1:t.y,m:dmn,b:t,c:TFK[F.k].col});}
/* 部隊向敵對的第三方射擊（依交戰規則；正在打敵軍的部隊分一半火力） */
function tfUFire(){var X=G.tf;if(!X.U.some(function(g){return g.st!=='dead'&&(tfHost(g,0)||tfHost(g,1));}))return;
  G.units.forEach(function(u){if(!(u.side>=0&&u.side<nSides())||!onMap(u)||!isLeaf(u)||u.ms==='rout'||u.ammo<=0)return;var s=ST(u),heli=s.dom==='air'&&s.br==='heli'&&u.st==='air';if(s.dom!=='land'&&!heli)return;var SA=saOf(u,s),HA=haOf(u,s);if(SA<=0&&HA<=0)return;
    var op=optOf(u),roe=roeOf(u,op);if(roe==='hold')return;var rE=s.rE*rngF(u),rM=s.rM*rngF(u);if(heli){rE=Math.max(rE,800);rM=Math.max(rM,2500);}if(!(rM>0))return;if(u.mis&&G.t>=u.mis.start&&indOf(u,s)>0)return;
    var vr=Math.min(zedVR(u)*1.2,rM+600),best=null,bd=1e9;X.U.forEach(function(g){if(g.st==='dead'||g.men<1||!tfHost(g,u.side))return;var d=dist(u.x,u.y,g.x,g.y);if(d>rM||d>vr)return;if(roe==='return'&&!(G.t-(u.tfT||-1e9)<=120))return;if(roe==='close'&&d>Math.max(150,rE*0.5))return;if(d<bd){bd=d;best=g;}});
    if(best)tfShootG(u,s,best,bd,SA,HA,rE,rM);});}
function tfShootG(u,s,g,d,SA,HA,rE,rM){var U=UT[g.ty]||{},rf=rangeF(d,rE,rM);if(!(rf>0))return;var c=LC[G.map.lc[cellAt(g.x,g.y)]],cov=c?c[4]:1,half=u.fired===G.t?0.5:1;
  var k=strFrac(u)*rf*firerMod(u,s)*cov*(1-0.6*(g.ent||0))*(DT*2/60)*FIRE_K*half*(0.7+0.6*tfr())*lgFire(u),hd=U.hard||0,Fm=SA*k,Fv=HA*k*VK*penF(penE(u,s),U.arm||0);
  var dmn=Fm*(1-0.9*hd)+Fv*hd*(g.men/Math.max(1,g.veh))*0.35,dv=Fv*hd+Fm*(1-hd)*(g.veh/Math.max(1,g.men))*0.15;tfHitG(g,dmn,dv,u.side,'fire',u);u.ammo=Math.max(0,u.ammo-0.25);u.fired=G.t;
  if(typeof FX!=='undefined'&&FX.cap&&FX.ev.length<5000)FX.ev.push({k:'fire',a:u,b:null,x0:u.x,y0:u.y,x1:g.x,y1:g.y,m:dmn});}
/* 第三方部隊受損：傷亡、士氣、殲滅或潰散；非敵對的一方造成的損害累積成不滿 */
function tfHitG(g,dm,dv,side,kind,src){if(g.st==='dead'||!(dm>0)&&!(dv>0))return;dm=Math.min(dm||0,g.men);dv=Math.min(dv||0,g.veh);g.men-=dm;g.veh-=dv;g.cas+=dm;g.vl+=dv;var F=tfF(g.f),X=G.tf;
  g.mor=clamp(g.mor-(dm+dv*6)/Math.max(10,g.men0+g.veh0*6)*140,0,100);g.uf=G.t;if(side>=0&&side<nSides()){g.ub[side]=G.t;X.st.k[side]=(X.st.k[side]||0)+dm;if(F)tfHarm(F,side,(dm+dv*8)*(kind==='fire'?4:2),kind,src);}
  if(g.men+g.veh*4<g.men0*0.08){g.st='dead';logE(-1,'tf','第三方「'+(F?F.n:'')+'」的'+g.n+'被殲滅',g.x,g.y);}else if(g.mor<25&&g.st==='ok'){g.st='rout';logE(-1,'tf','第三方「'+(F?F.n:'')+'」的'+g.n+'士氣崩潰、撤退',g.x,g.y);}}
/* 中立國的領土：外國部隊停留二十分鐘提出警告，一小時後不滿逐漸累積 */
function tfViol(){G.tf.F.forEach(function(F){if(F.k!=='neu')return;SIDES().forEach(function(s){if(tfRel(F,s)!=='neu')return;var n=0;gridNearS(F.x,F.y,F.r,s,function(u){if(onMap(u)&&isLeaf(u)&&ST(u).dom==='land'&&dist(u.x,u.y,F.x,F.y)<=F.r)n++;});
  if(!n){F.vio[s]=0;F.warn[s]=0;return;}if(!F.vio[s])F.vio[s]=G.t;var dt=G.t-F.vio[s];if(dt>=1200&&!F.warn[s]){F.warn[s]=1;logE(s,'tf','第三方「'+F.n+'」警告：'+G.sides[s].name+'的 '+n+' 個單位進入其領土，要求立即撤出',F.x,F.y);if(G.onPause&&apOn('tf'))G.onPause('中立國警告');}if(dt>=3600)tfHarm(F,s,4*n,'zone');});});}
function tfMor(){G.tf.U.forEach(function(g){if(g.st==='dead')return;if(G.t-g.uf>1800&&g.mor<TFK[(tfF(g.f)||{}).k||'pk'].mor)g.mor=Math.min(100,g.mor+0.15);});}
(function(){var b=v8Step;v8Step=function(){b.apply(this,arguments);if(G&&G.started&&!G.over&&G.step%2===0&&(tfOn()||G.tf&&G.tf.F.length))tfStep();};})();
/* ---------- 砲擊、轟炸、核武波及第三方；維和部隊附近的平民傷亡較少，武裝團體記下殺害平民的一方 ---------- */
(function(){var b=artyFire;artyFire=function(u,s,M){b(u,s,M);if(!G.tf||!G.tf.U.length||u.lastArt!==G.t)return;var L=typeof ARTL!=='undefined'&&ARTL&&ARTL.id===u.id&&ARTL.t===G.t?ARTL:null,x=L?L.x:M.x,y=L?L.y:M.y,Re=L?clamp(1.2*Math.sqrt(L.sr*L.sr+L.sd*L.sd+L.sw*L.sw/3),60,500):(M.r||300);
  var base=saOf(u,s)*strFrac(u)*firerMod(u,s)*DT/60*(M.mul||1)*ART_K*0.1;if(!(base>0))return;G.tf.U.forEach(function(g){var d=dist(g.x,g.y,x,y);if(d>Re+300)return;var f=clamp(1-d/(Re+300),0,1),hd=(UT[g.ty]||{}).hard||0;tfHitG(g,base*f*(1-0.85*hd)*(1-0.6*g.ent)*(0.7+0.6*tfr()),base*f*hd*0.04,u.side,'arty',u);});};})();
(function(){var b=carpetHit;carpetHit=function(side,src,cx,cy,ang,L,W,tons,o){var r=b.apply(this,arguments);if(G.tf&&G.tf.U.length){var fx=Math.cos(ang),fy=Math.sin(ang),rho=tons/Math.max(0.01,L*W/1e6);G.tf.U.forEach(function(g){var dx=g.x-cx,dy=g.y-cy,a=Math.abs(dx*fx+dy*fy),bb=Math.abs(-dx*fy+dy*fx);if(a>L/2+300||bb>W/2+300)return;var f=1-Math.exp(-rho*30000e-6*(a<=L/2&&bb<=W/2?1:0.4));tfHitG(g,g.men*f*0.35,g.veh*f*0.3,side,'air',src);});}return r;};})();
(function(){var b=nukeAt;nukeAt=function(side,x,y,Y,src){var r=b.apply(this,arguments);if(G.tf&&G.tf.U.length){var R=nukeR(Y);G.tf.U.forEach(function(g){var d=dist(g.x,g.y,x,y);if(d<=R[0])tfHitG(g,g.men,g.veh,side,'nuke',src);else if(d<=R[2])tfHitG(g,g.men*(d<=R[1]?0.6:0.2),g.veh*(d<=R[1]?0.5:0.1),side,'nuke',src);});}return r;};})();
(function(){var b=civCas;civCas=function(g,c,kf,cause,bySide){if(G.tf&&G.tf.U.length&&g&&c>0){if(G.tf.U.some(function(q){var F=tfF(q.f);return F&&F.k==='pk'&&q.st==='ok'&&dist(q.x,q.y,g.x,g.y)<2500;}))c*=0.6;
    if(bySide===0||bySide===1)G.tf.F.forEach(function(F){if(F.k==='mil'&&dist(F.x,F.y,g.x,g.y)<F.r+(g.r||0))tfHarm(F,bySide,c*0.4,'civ');});}return b.call(this,g,c,kf,cause,bySide);};})();
/* ---------- 盟友協助：派兵到指定地點防守或攻擊（玩家，聯機時在伺服器執行） ---------- */
function tfRequest(side,fid,k,x,y){var F=tfF(+fid);if(!F)return {err:'找不到這個第三方。'};if(tfRel(F,side)!=='ally')return {err:'「'+F.n+'」不是本方的盟友。'};if(!isFinite(+x)||!isFinite(+y))return {err:'位置錯誤。'};
  F.req={k:k==='attack'?'attack':'defend',x:+x,y:+y,t:G.t,side:side};logE(side,'tf','請求盟友「'+F.n+'」'+(F.req.k==='attack'?'攻擊':'防守')+placeTxt(+x,+y),+x,+y);if(G.tf.U.length)tfThink();return {ok:1};}
/* ---------- 聯機：看得到的第三方部隊、所有第三方的關係 ---------- */
if(typeof MPCOL!=='undefined'){MPCOL.push(['tfU','id',function(s){var X=G.tf;if(!X||!X.U)return [];return X.U.filter(function(g){return g.st!=='dead'&&(s<0||G.t-g.sn[s]<=150);}).map(function(g){return {id:g.id,f:g.f,ty:g.ty,n:g.n,x:Math.round(g.x),y:Math.round(g.y),hd:Math.round((g.hd||0)*10)/10,men:Math.round(g.men),veh:Math.round(g.veh),men0:g.men0,veh0:g.veh0,mor:Math.round(g.mor),st:g.st};});}]);
  MPKEY.tfU='id';MPCC.tfU=function(){if(!G.tf)G.tf={F:[],U:[],seq:0,st:{k:sA0(),lost:sA0()}};return G.tf.U||(G.tf.U=[]);};}
if(typeof mpValList==='function'){(function(){var b=mpValList;mpValList=function(s){var V=b.apply(this,arguments);if(G.tf&&G.tf.F)V.push(['tf.F',G.tf.F.map(function(F){return {id:F.id,k:F.k,n:F.n,rel:F.rel,x:F.x,y:F.y,r:F.r,gr:F.gr,req:F.req&&(s<0||F.req.side===s)?F.req:null};})]);return V;};})();}
if(typeof MPFN!=='undefined')MPFN.tfRequest=[MPSIDE(0),function(a){return tfRequest(a[0],a[1],String(a[2]||''),+a[3],+a[4]);}];
