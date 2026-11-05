/* ===================== 設計運算（引擎）：材料、彈藥、導引彈藥、載具設計與由設計換算的型號、主砲和載台 =====================
   這些都是純計算（LatoArmory／LatoVehicle 運算庫），單機、聯機伺服器與編輯器共用：伺服器收到的設計會自己重算，不採信用戶端送來的數值。
   原本分散在介面檔（o38 裝備庫、o47 載具設計、o48 導引彈藥、o95 載具型號），搬到這裡以便伺服器也能載入。 */
if(typeof GKEYS!=='undefined')['ammo','aseq','seq','eseq','armor','arseq','vdes','vseq','mats','vmods','muns','cba','cbaV','cbaSeq','nwh','nwhSeq'].forEach(function(k){if(GKEYS.indexOf(k)<0)GKEYS.push(k);});
var LAL=(typeof window!=='undefined'&&window.LatoArmoryLib)||null,LVL=(typeof window!=='undefined'&&window.LatoVehicleLib)||null;
var LALP={};if(LAL)LAL.PROJ.forEach(function(p){LALP[p.id]=p;try{LAL.calibrateCost(p);}catch(e){}});
/* 幣值：1 東銀圓預設等於 2.5 美元（伺服器沒有瀏覽器儲存，用預設值） */
var CURK='lato-warsim-cur',CUR=(function(){var o={sel:'dy',show:'both',rate:2.5,list:[]};try{var s=JSON.parse(localStorage.getItem(CURK)||'{}')||{};if(s.mode&&!s.sel){o.sel=s.mode==='usd'?'usd':'dy';o.show=s.mode==='both'?'both':'one';}Object.keys(s).forEach(function(k){if(k!=='mode')o[k]=s[k];});}catch(e){}
  if(!(o.rate>0))o.rate=2.5;if(!Array.isArray(o.list))o.list=[];o.list=o.list.filter(function(c){return c&&typeof c.k==='string'&&c.usd>0;});return o;})();
function curSave(){try{localStorage.setItem(CURK,JSON.stringify(CUR));}catch(e){}}
/* ---------- 材料與彈藥（內建＋自訂） ---------- */
function matList(){var L=LAL?LAL.MATS.slice():[];if(G&&G.mats)for(var k in G.mats)L.push(G.mats[k]);return L;}
function matOf(id){var L=matList();for(var i=0;i<L.length;i++)if(L[i].id===id)return L[i];return null;}
function projOf(id){return (G&&G.ammo&&G.ammo[id])||LALP[id]||null;}
function projList(){var o=LAL?LAL.PROJ.slice():[];if(G&&G.ammo)for(var k in G.ammo)o.push(G.ammo[k]);return o;}
var PCA={};
function lalO(){return {lib:matList()};}
function penAt(P,R,mat,ang){if(!LAL||!P)return null;var key=P.id+'|'+(P._v||0)+'|'+Math.round(R||0)+'|'+(mat||'rha')+'|'+(ang||0);if(PCA[key]!==undefined)return PCA[key];var v=null;
  try{var o=lalO();v=LAL.perfLimit(P,P.k==='sc'||P.k==='he'||P.k==='hesh'||P.guided?P.v0:LAL.velAt(P,R||0),mat||'rha',ang||0,o);if(!isFinite(v))v=null;}catch(e){v=null;}PCA[key]=v;return v;}
function pUsd(P){if(!P)return 0;if(!LAL)return P.ref||0;try{if(!P.cx)LAL.calibrateCost(P,matList());return LAL.costOf(P,lalO()).usd;}catch(e){return P.ref||0;}}
function pKg(P){if(!P)return 0;if(!LAL)return (P.rw||0)/1000;try{return LAL.roundMass(P)/1000;}catch(e){return 0;}}
function wPhys(w){var am=wAmmo(w),R=w.ind>0?0:(w.rE||1000),best=0,rows=[],sh=0,usd=0,kg=0;am.forEach(function(a){var P=projOf(a[0]);if(!P)return;var s=+a[1]||0,mm=penAt(P,R)||0;rows.push({P:P,s:s,mm:mm,ce:P.k==='sc',usd:pUsd(P),kg:pKg(P)});if(mm>best)best=mm;});
  var ce=0,cw=0;rows.forEach(function(r){sh+=r.s;usd+=r.s*r.usd;kg+=r.s*r.kg;if(r.mm>=best*0.5){cw+=r.s;if(r.ce)ce+=r.s;}});return {mm:best,lv:lvOfMm(best),ce:cw?ce/cw:0,usd:sh?usd/sh:0,kg:sh?kg/sh*1.15:0,R:R,rows:rows};}
/* ---------- 載具設計（LatoVehicle） ---------- */
var ARCA={};
function vdesList(){var o=LVL?LVL.DES.slice():[];if(G&&G.vdes)for(var k in G.vdes)o.push(G.vdes[k]);return o;}
function vdesOf(id){if(G.vdes&&G.vdes[id])return G.vdes[id];if(!LVL)return null;for(var i=0;i<LVL.DES.length;i++)if(LVL.DES[i].id===id)return LVL.DES[i];return null;}
function vctx(){var mods=LVL.MODS.slice();if(G.vmods)for(var k in G.vmods){var i=-1;for(var j=0;j<mods.length;j++)if(mods[j].id===k){i=j;break;}if(i>=0)mods[i]=G.vmods[k];else mods.push(G.vmods[k]);}return LVL.ctxOf({mats:matList(),proj:projList(),mods:mods,mun:munAll(),cache:ARCA});}
var VCA={};function vcalc(d){var k=d.id+'|'+JSON.stringify(d.sel||{})+'|'+(d._v||0);if(VCA[k])return VCA[k];var R=null;try{R=LVL.calc(d,vctx());}catch(e){R={err:e.message};}VCA[k]=R;return R;}
var MUNT={aam:'空對空飛彈',sam:'防空飛彈',agm:'空對地飛彈',arm:'反輻射飛彈',ashm:'反艦飛彈',cm:'巡弋飛彈',rkt:'火箭',cbu:'集束炸彈',bomb:'炸彈',gbomb:'導引炸彈',torp:'魚雷'};
var MUNPL={a:'空射',s:'艦射',l:'陸射'};
/* 武器原本的彈藥（換算的基準）與可連結的種類 */
var WMUN={ssm:'ocaxe',torp:'hwt',sam:'lona2',manpad:'lsma6',bomb:'strigal250',atgm:'sli3',atgm1:'sli3',atgm2:'sli3',atgm3:'sli3',loit:'downfall',fpv:'downfall'};
var WMT={ssm:['ashm','cm'],torp:['torp'],sam:['sam','aam'],manpad:['sam','aam'],bomb:['bomb','gbomb','cbu','rkt'],atgm:['agm','arm'],atgm1:['agm','arm'],atgm2:['agm','arm'],atgm3:['agm','arm'],loit:['agm','arm'],fpv:['agm']};
var MUNREF={aam:'mida2',sam:'lona2',agm:'sli3',arm:'gui7',ashm:'ocaxe',cm:'lanxe',rkt:'metshow_he',cbu:'ghomot',bomb:'strigal250',gbomb:'falroc',torp:'lwt'};
var MUNPK={aam:0.5,sam:0.6,agm:0.8,arm:0.7,ashm:0.8,cm:0.85,rkt:0.3,cbu:0.6,bomb:0.3,gbomb:0.85,torp:0.7};
/* 全部（含副油箱、莢艙，載具計算用）；自訂或修改過的覆蓋內建 */
function munAll(){var o=LVL?LVL.MUN.map(function(m){return (G&&G.muns&&G.muns[m.id])||m;}):[];if(G&&G.muns)for(var k in G.muns)if(!o.some(function(m){return m.id===k;}))o.push(G.muns[k]);return o;}
function munList(){return munAll().filter(function(m){return !!MUNT[m.t];});}
function munOf(id){if(!id)return null;if(G&&G.muns&&G.muns[id])return G.muns[id];if(!LVL)return null;for(var i=0;i<LVL.MUN.length;i++)if(LVL.MUN[i].id===id)return LVL.MUN[i];return null;}
function munBuiltin(id){if(!LVL)return null;for(var i=0;i<LVL.MUN.length;i++)if(LVL.MUN[i].id===id)return LVL.MUN[i];return null;}
function munUsd(m){return Math.round((m&&m.dy||0)*(CUR.rate>0?CUR.rate:2.5));}
function munPk(m){return m.pk>0?m.pk:MUNPK[m.t]||0.6;}
function munPl(m){return String(m.pl||'').split('').map(function(c){return MUNPL[c]||'';}).filter(Boolean).join('、');}
/* 粗估價格（美元）：依種類、重量、射程與尋標方式 */
function munEstUsd(m){var b={aam:900000,sam:1200000,agm:150000,arm:700000,ashm:1200000,cm:1500000,rkt:2000,cbu:30000,bomb:4000,gbomb:30000,torp:1500000}[m.t]||100000,ref=munOf(MUNREF[m.t])||{kg:m.kg||100,rng:m.rng||10};
  return Math.round(b*Math.pow((m.kg||ref.kg)/Math.max(1,ref.kg),0.6)*Math.pow((1+(m.rng||0))/(1+(ref.rng||0)),0.3)*(m.act?1.3:1)*(m.nuke?20:1)/100)*100;}
/* ---------- 武器連結彈藥 ---------- */
function wMunTypes(w){var base=w.base||w.k;return WMT[w.k]||WMT[base]||(WPNO[w.k]?null:Object.keys(MUNT));}
/* 換算：以連結前的數值（mub）為基準，避免重複套用 */
function munApply(w){var m=munOf(w.mu);if(!m)return false;var refId=(w.mub&&w.mub.ref)||WMUN[w.k]||WMUN[w.base]||MUNREF[m.t],r=munOf(refId)||m;
  if(!w.mub)w.mub={pP:w.pP||0,pA:w.pA||0,rE:w.rE||0,rM:w.rM||0,aa:w.aa||0,acc:w.acc||1,pen:w.pen||0,ref:refId};var B=w.mub;
  var whF=m.wh>0&&r.wh>0?Math.pow(m.wh/r.wh,2/3):1,rngF=m.rng>0&&r.rng>0?m.rng/r.rng:1,pkF=munPk(m)/munPk(r),guided=/aam|sam|agm|arm|ashm|cm|gbomb|torp/.test(m.t);
  w.pP=Math.round(B.pP*whF*10000)/10000;w.pA=Math.round(B.pA*Math.sqrt(whF)*(guided?Math.sqrt(pkF):1)*10000)/10000;if(B.rE>0)w.rE=Math.round(Math.min(B.rE*rngF,m.rng*1000||B.rE));if(B.rM>0)w.rM=Math.round(Math.min(B.rM*rngF,m.rng*1000||B.rM));
  if(B.aa>0)w.aa=Math.round(B.aa*pkF*Math.pow(rngF,0.3)*1000)/1000;w.acc=Math.round(B.acc*(guided?clamp(Math.sqrt(pkF),0.5,1.5):1)*1000)/1000;
  if(m.proj&&LAL&&typeof projOf==='function'){var P=projOf(m.proj),mm=P?penAt(P,0):0;if(mm>0){w.pen=Math.round(lvOfMm(mm)*10)/10;w.ce=1;}}
  w.rusd=munUsd(m);w.kg=Math.round(m.kg*1.1*10)/10;w.mud={id:m.id,t:m.t,n:m.n,rng:m.rng||0,mach:m.mach||0.8,wh:m.wh||0,pk:munPk(m),act:m.act?1:0,abm:m.abm?1:0,nuke:m.nuke?1:0,kg:m.kg};return true;}
function munUnlink(w){var B=w.mub;if(B){w.pP=B.pP;w.pA=B.pA;w.rE=B.rE;w.rM=B.rM;w.aa=B.aa;w.acc=B.acc;w.pen=B.pen;}delete w.mu;delete w.mud;delete w.mub;delete w.rusd;}
var VTYAIR={ftr:function(t){return t.br==='air'&&t.aa>=6&&t.fl.indexOf('B')>=0&&t.fl.indexOf('v')<0;},ew:function(t){return t.fl.indexOf('j')>=0;},aew:function(t){return t.fl.indexOf('a')>=0;},asw:function(t){return t.br==='air'&&t.fl.indexOf('r')>=0;},
  bmb:function(t){return t.br==='air'&&t.fl.indexOf('v')>=0;},helo:function(t){return t.br==='heli'&&t.fl.indexOf('H')>=0;},ah:function(t){return t.br==='heli'&&t.fl.indexOf('x')>=0;},uav:function(t){return t.br==='uav';}};
var VTYSEA={cvn:function(t){return t.fl.indexOf('C')>=0;},cg:function(t){return t.dom==='sea'&&t.br==='nav'&&t.aa>=8&&t.men>=250&&t.fl.indexOf('C')<0&&t.fl.indexOf('i')<0;},
  ff:function(t){return t.dom==='sea'&&/巡防|護衛/.test(t.n);},fac:function(t){return t.dom==='sea'&&/快艇|巡邏艇/.test(t.n);},lhd:function(t){return t.dom==='sea'&&t.fl.indexOf('i')>=0;},ssk:function(t){return t.dom==='sub';}};
VTYSEA.dd=VTYSEA.cg;VTYSEA.fs=VTYSEA.ff;
/* 每單位的預設數量 */
var VDN={ftr:12,ew:6,aew:2,asw:4,bmb:6,helo:8,ah:8,uav:4,cvn:1,cg:1,dd:2,ff:2,fs:2,fac:4,lhd:1,ssk:1};
function vdRef(pred,y,fb){var best=null,bd=1e9;Object.keys(UT).forEach(function(k){var t=UT[k];if((ERAI[t.era]||{}).fan||!pred(t))return;var d=Math.abs((ERAI[t.era]||ERA[6]).y-y);if(d<bd){bd=d;best=t;}});return best||UT[fb];}
function vdYear(d){return d.yr&&d.yr<2100?d.yr:2020;}
function vdNewType(ref,d,n,name,y){var T=clone(ref),rate=CUR.rate||2.5;G.tseq=(G.tseq||0)+1;T.k='c'+G.tseq;T.n=name||d.n;T.cus=1;T.era=eraOfYear(Math.min(y,2030)).k;T.veh=n;T.vdes=d.id;T.ux=clone(utx(ref.k));
  T.d=(d.code&&d.code!=='—'?d.code+'・':'')+'由 LatoVehicle 設計生成';return T;}
function flSet(fl,c,on){fl=fl.split(c).join('');return on?fl+c:fl;}
function sigOfRcs(rcs){return Math.round(clamp(0.3+0.3*Math.log(Math.max(rcs,1e-4)/0.003)/Math.LN10,0.25,3)*100)/100;}
/* 飛彈規格（區域外打擊用）：巡弋飛彈優先，其次反艦飛彈 */
function vdMsl(list){var cm=null,sh=null;list.forEach(function(q){var m=q.mu;if(m.t==='cm'&&(!cm||m.rng>cm.mu.rng))cm={mu:m,n:0};if(m.t==='ashm'&&(!sh||m.rng>sh.mu.rng))sh={mu:m,n:0};});
  list.forEach(function(q){if(cm&&q.mu.t==='cm')cm.n+=q.n;if(sh&&q.mu.t==='ashm')sh.n+=q.n;});var z=cm||sh;if(!z)return null;var m=z.mu;
  return {n:z.n,v:Math.round(Math.max(200,(m.mach||0.8)*340)),r:Math.round(m.rng*1000),y0:0,kind:m.t==='cm'?'cruise':'asm',w:m.wh||200,pk:m.pk||0.85,nm:m.n.replace(/「(.+?)」.*/,'$1'),ship:m.t==='ashm'?1:0,mu:m.id};}
/* ---------- 空軍 ---------- */
function vdToTypeAir(d,n,name){var R=vcalc(d);if(!R||R.err||!R.af)return null;if(d.ty==='trn'||d.ty==='cod')return null;var y=vdYear(d),rot=R.af.kind==='rot',prop=R.af.kind==='prop';
  var ref=vdRef(VTYAIR[d.ty]||VTYAIR.ftr,y,'fi2000'),T=vdNewType(ref,d,n,name,y),rate=CUR.rate||2.5;
  var aam=0,sa=0,ha=0,list=[],bombKg=0,prec=false,sead=false,torp=false;
  (R.stores||[]).forEach(function(s){var m=s.mu,k=s.n*(m.per||1);if(!k)return;list.push({mu:m,n:k});
    switch(m.t){case 'aam':aam+=k*(m.pk||0.5)*(m.rng>=40?(m.act?2.4:2):1.2)*0.7;break;
      case 'bomb':sa+=k*m.kg/150;ha+=k*m.kg/1500;bombKg+=k*m.kg;break;case 'gbomb':sa+=k*m.kg/160;ha+=k*(0.6+m.kg/800);bombKg+=k*m.kg;prec=true;break;case 'cbu':sa+=k*m.kg/70;ha+=k*m.kg/1000;bombKg+=k*m.kg;break;
      case 'rkt':sa+=k*(m.wh||19)/4;ha+=k*0.5;break;case 'agm':sa+=k*(m.wh||50)/60;ha+=k*(1.2+(m.wh||50)/100);prec=true;break;case 'arm':ha+=k*0.6;sead=true;break;
      case 'cm':sa+=k*(m.wh||450)/150;ha+=k*(m.wh||450)/300;prec=true;break;case 'ashm':ha+=k;break;case 'torp':ha+=k*1.5;torp=true;break;}});
  (R.guns||[]).forEach(function(g){var cal=/(\d+)\s*公釐/.exec(g.n||'');cal=cal?+cal[1]:20;sa+=1;ha+=cal>=30?3:1;});
  var rr=Math.max(R.radar?R.radar.rr||0:0,R.irst?R.irst.rr||0:0,R.eo?R.eo.rr||0:0),turn=R.turn||0,mach=R.mMax||(R.vmax?R.vmax/1225:0.5),rcs=R.rcs||5,stealth=rcs<0.1;
  T.vr=Math.round(rot||prop?(R.vmax||ref.vr)*0.8:((R.superCruise||0)>=1?R.superCruise:0.85)*1062);T.vx=T.vr;T.men=Math.round(n*Math.max(2,(R.af.crew||0)+1));
  T.end=Math.round(clamp(rot||prop?(R.endur||ref.end||3)*0.8:2*(R.radius||300)/T.vr+0.5,0.5,30)*10)/10;
  T.aa=Math.round(clamp(aam>0?1.5+aam+rr/30+turn/8+mach+(stealth?2:0):0,0,24)*10)/10;T.sa=Math.round(sa*10)/10;T.ha=Math.round(ha*10)/10;T.sig=sigOfRcs(rcs);
  T.ux.rcs=Math.round(clamp(Math.pow(rcs/3,0.25),0.08,1)*100)/100;T.nv=rr>0?2:Math.max(1,ref.nv||0);T.vusd=Math.round((R.unit||0)*rate);T.vn='架'+((LVL.TYPES.a||{})[d.ty]||'');
  if(d.ty==='aew'){T.spot=15000;T.ux.rad=Math.round(Math.max(rr,200)*1000);}else T.spot=Math.round(Math.max(rr*1000*(d.ty==='ftr'||d.ty==='ew'?0.8:0.6),rot?6000:15000));
  var fl=T.fl;fl=flSet(fl,'p',prec);fl=flSet(fl,'j',sead||d.ty==='ew');fl=flSet(fl,'t',stealth);fl=flSet(fl,'v',bombKg>=8000);fl=flSet(fl,'E',(R.jam||0)>=0.6);fl=flSet(fl,'T',torp&&!rot);
  var M=vdMsl(list);fl=flSet(fl,'y',!!M);if(rot)fl=flSet(fl,'x',sa+ha>=3&&d.ty!=='helo');if(/艦載/.test(d.n)&&!rot)fl=flSet(fl,'o',true);if(d.ty==='uav'||d.ty==='asw')fl=flSet(fl,'r',sa+ha<2||d.ty==='asw');
  T.fl=fl;if(M){M.n=Math.max(1,Math.round(M.n));T.msl=M;}else delete T.msl;
  var aamR=0;list.forEach(function(q){if(q.mu.t==='aam')aamR=Math.max(aamR,q.mu.rng||0);});if(aamR>0){T.rE=Math.round(Math.max(8000,aamR*1000*0.45));T.rM=Math.max(T.rM||0,Math.round(aamR*1000));T.ux.aam=aamR;}
  var son=0;R.em.list.forEach(function(e){if(e.m.sl==='asw')son=Math.max(son,/吊放/.test(e.m.n)?10000:20000);});if(son)T.ux.son=son;
  G.types=G.types||{};G.types[T.k]=T;G._tv=(G._tv||1)+1;return T;}
/* ---------- 海軍 ---------- */
function vdToTypeSea(d,n,name){var R=vcalc(d);if(!R||R.err||!R.hull)return null;var y=vdYear(d),sub=!!R.sub;
  var ref=vdRef(VTYSEA[d.ty]||VTYSEA.dd,y,sub?'sn2000':'dg2000'),T=vdNewType(ref,d,n,name,y),rate=CUR.rate||2.5,C=vctx();
  var ad={sub:0,sup:0,bal:0};['sub','sup','bal'].forEach(function(k){try{ad[k]=LVL.seaADmax(R,{threat:k},C);}catch(e){}});
  var list=(R.munList||[]).map(function(x){return {mu:x.mu,n:x.n};}),ashm=0,torp=0,cm=0;list.forEach(function(q){if(q.mu.t==='ashm')ashm+=q.n;if(q.mu.t==='torp')torp+=q.n;if(q.mu.t==='cm')cm+=q.n;});
  var gun=0,rr=0,son=0;R.em.list.forEach(function(e){var m=e.m;if(m.sl==='gun'){var cal=/(\d+)\s*公釐/.exec(m.n||'');gun=Math.max(gun,cal?+cal[1]:76);}if(m.sl==='rad')rr=Math.max(rr,m.rr||0);if(m.sl==='son')son=Math.max(son,sonarKm(m));});
  var kn=R.vCalm||20;T.vr=Math.round(kn*1.852);T.vx=Math.round(kn*1.852*0.92);T.men=Math.round((R.crew||ref.men/Math.max(1,ref.veh))*n);T.end=0;
  T.aa=sub?0:Math.round(clamp(2+4*Math.log(1+ad.sub),0,20)*10)/10;T.sa=Math.round((1+(gun>=100?6:gun>0?3:0)+cm*0.3)*10)/10;T.ha=Math.round((ashm*0.5+torp*0.3+(gun>0?1:0))*10)/10;
  T.ind=gun>=100?24000:gun>0?15000:0;T.sig=sub?Math.round(0.15*(R.aip?0.8:1)*100)/100:Math.round(clamp(0.6+0.9*Math.log((R.full||1000)/300)/Math.LN10,0.4,4)*100)/100;
  T.spot=sub?Math.round(Math.max(30000,son*1000)):R.aewN>0?400000:Math.round(clamp(rr*1000*0.25,20000,120000));T.nv=2;T.vusd=Math.round((R.unit||0)*rate);T.vn='艘'+((LVL.TYPES.s||{})[d.ty]||'');
  T.ux.adN=ad;if(rr>0&&!sub)T.ux.rad=Math.round(rr*1000);if(son>0)T.ux.son=Math.round(son*1000);var fl=T.fl;fl=flSet(fl,'g',gun>=100);fl=flSet(fl,'T',torp>0);var M=vdMsl(list);fl=flSet(fl,'y',!!M);fl=flSet(fl,'p',cm>0);T.fl=fl;
  if(M){M.n=Math.max(1,Math.round(M.n));T.msl=M;}else delete T.msl;G.types=G.types||{};G.types[T.k]=T;G._tv=(G._tv||1)+1;return T;}
/* 聲納距離（公里）：拖曳低頻陣列最遠，其次可變深度、潛艦艦艏與舷側陣列、艦殼聲納，掃雷聲納很近 */
function sonarKm(m){var n=m.n||'';return m.rr>0?m.rr:/拖曳|LF/.test(n)?40:/潛艦/.test(n)?35:/可變深度|VDS/.test(n)?25:/掃雷|MINE/.test(n)?2:15;}
/* ---------- 一、設計 → 型號 ---------- */
var VDW={},VDMC={};
(function(){var b=wpnOf;wpnOf=function(k){return b(k)||VDW[k]||null;};})();
(function(){var b=vmOf;vmOf=function(k){var m=b(k);if(m)return m;if(typeof k==='string'&&k.indexOf('lv:')===0)return vdModel(k.slice(3));return null;};})();
var VDCLS={mbt:'mbt',lt:'tkm',ifv:'ifv',wh:'apc',mrap:'apc',spg:'spg',spaa:'spg'},VDROLE={mbt:'tank',lt:'tank|recon',ifv:'ifv',wh:'ifv|apc|recon',mrap:'apc',spg:'spg',spaa:'spaa'};
function vdKey(d){return d.id+'|'+JSON.stringify(d.sel||{})+'|'+(d._v||0)+'|'+(CUR.rate||2.5);}
function vdModel(id){if(!LVL)return null;var d=vdesOf(id);if(!d)return null;var key=vdKey(d),c=VDMC[id];if(c&&c.key===key)return c.m;var m=null;try{m=vdSpec(d);}catch(e){if(window.console)console.warn('設計換算',id,e);m=null;}VDMC[id]={key:key,m:m};return m;}
function vdCal(n){var c=/(\d+(?:\.\d+)?)\s*公釐/.exec(n||'');return c?+c[1]:0;}
/* 設計的主砲：依口徑與彈藥算穿甲、聚能比例與每發價格（裝在型號上，造價算在車上） */
function vdGunW(d,R,y){var g=R.gun,cal=g.cal||vdCal(g.n),am=(R.ammo||[]).filter(function(a){return projOf(a[0]);}),tot=am.reduce(function(s,a){return s+(+a[1]||0);},0);
  var bk=g.arty?(y>=2005?'h155p':'h155'):g.aa?'aaam':cal<=57?'acan':cal>=115?'mbt2':cal>=100?'mbt1':cal>=70?'tgunh':'acan',key='lvw'+String(d.id).replace(/[^A-Za-z0-9]/g,'').slice(0,20),w=clone(WPNO[bk]);
  w.k=key;w.n=g.n;w.hid=0;w.y=y;w.mt=1;w.cal=cal||undefined;if(g.lc)w.L=g.lc;delete w.spec;delete w.am0;delete w.Lo;w.lvd=d.id;
  if(am.length&&!g.arty&&!g.aa){w.am=am.map(function(a){return [a[0],tot?Math.round((+a[1]||0)/tot*100)/100:1/am.length];});var ph=wPhys(w);if(ph.mm>0)w.pen=Math.round(ph.lv*10)/10;w.ce=Math.round(ph.ce*100)/100;w.rusd=Math.round(ph.usd*100)/100;if(ph.kg>0)w.kg=Math.round(ph.kg*1000)/1000;w.rpu=Math.max(1,Math.round(tot||w.rpu));}
  w.usd=0;VDW[key]=w;if(G.wpns&&G.wpns[key])G.wpns[key]=clone(w);return key;}
/* 空中與海上設計的載台（單位類型的範本；換機型、換艦型時建立實際的類型） */
function vdTT(d){var n=VDN[d.ty]||(d.br==='a'?12:1),sv=G.types,ts=G.tseq,tv=G._tv,ws=G.wseq,wp=clone(G.wpns||null),T=null;G.types={};try{T=d.br==='a'?vdToTypeAir(d,n,d.n):vdToTypeSea(d,n,d.n);}catch(e){T=null;}G.types=sv;G.tseq=ts;G._tv=tv;G.wseq=ws;if(wp)G.wpns=wp;else delete G.wpns;
  if(!T)return null;delete T.k;delete T.cus;T.veh=n;return T;}
function vdSpec(d){var R=vcalc(d);if(!R||R.err)return null;var rate=CUR.rate||2.5,y=Math.min(d.yr&&d.yr<2100?d.yr:2020,2030),o={k:'lv:'+d.id,n:d.n,nat:d.nat||'',y:y,lv:d.id,usd:Math.round((R.unit||0)*rate),d:String(d.desc||'').slice(0,300),m:null,s:[],e:[],ad:[],op:[],px:0};
  if(d.br==='l'){var C=vctx(),refP=LALP.t120m829a1,Z=R.zones||{},eqz=function(zs){var a=0,b=0,k=0;zs.forEach(function(z){if(!Z[z]||!Z[z][0])return;var q=null;try{q=LVL.zoneEq(Z[z][0].L,C,refP);}catch(e){}if(!q)return;a+=isFinite(q.ke)?q.ke:q.keMin||3000;b+=isFinite(q.ce)?q.ce:3000;k++;});return k?[a/k,b/k]:[0,0];};
    var f=eqz(['tf','hf']),s=eqz(['ts','hs']),rt=eqz(['rr','tp']);o.c=VDCLS[d.ty]||'mbt';o.r=VDROLE[d.ty]||'tank';o.dom='land';o.cr=R.crew||0;o.px=R.pax||0;o.t=Math.round((R.mass||0)/100)/10;
    o.arm=Math.round(armLvOfZones(f[0],s[0],rt[0])*10)/10;o.armC=Math.round(armLvOfZones(f[1],s[1],rt[1])*10)/10;o.vr=Math.round(R.vRoad||0);o.vx=Math.round(R.vOff||0);o.fu=Math.round(R.fuelL||0);o.lk=Math.round((R.Lkm||0)*100);
    if(R.gun)o.m=[vdGunW(d,R,y),1];(R.secs||[]).forEach(function(q){var cal=vdCal(q.m&&q.m.n);o.s.push([cal>=20?'acan':cal>=12?'hmg':'gpmg',q.n||1]);});
    (R.msls||[]).forEach(function(q){var mu=q.m&&q.m.mu&&munOf(q.m.mu),k=mu&&(mu.t==='sam'||mu.t==='aam')?'sam':y<1975?'atgm1':y<1996?'atgm2':'atgm3';if(!o.m)o.m=[k,1];else o.s.push([k,1]);});
    if(R.thermal)o.e.push(['therm',1]);if(R.aps&&R.aps.length)o.e.push([R.aps.some(function(a){return /軟殺/.test(a.n||'');})&&!R.aps.some(function(a){return /硬殺|攔截/.test(a.n||'');})?'aps0':'aps1',1]);}
  else if(d.br==='a'&&(d.ty==='trn'||d.ty==='cod')){/* 運輸機：列為型號（後勤空運用），不放進作戰單位的編制 */o.lgx=1;o.dom='air';o.c=R.af&&R.af.kind==='rot'?'helo':'plane';o.r='trn';o.cr=R.crew||0;o.vr=Math.round(R.vmax||0);o.arm=0;o.armC=0;}
  else{var T=vdTT(d);if(!T)return null;o.plat=1;o.tt=T;o.dom=d.br==='a'?(d.ty==='uav'?'uas':'air'):(d.ty==='ssk'?'sub':'sea');o.c=d.br==='a'?(d.ty==='helo'||d.ty==='ah'?'helo':d.ty==='uav'?'drone':'jet'):(d.ty==='ssk'?'subm':'ship');
    o.cr=Math.round((T.men||0)/Math.max(1,T.veh||1));o.vr=T.vr;o.arm=T.arm||0;o.armC=T.armC!==undefined?T.armC:o.arm;var A=[];(R.stores||[]).forEach(function(q){if(q.mu&&q.n)A.push([q.mu.n.replace(/（.*?）/g,''),q.n*(q.mu.per||1)]);});(R.munList||[]).forEach(function(q){if(q.mu&&q.n)A.push([q.mu.n.replace(/（.*?）/g,''),q.n]);});(R.guns||[]).forEach(function(g){A.push([g.n,1]);});o.arm2=A.slice(0,12);}
  return o;}
/* ---------- 陸軍設計 → 單位類型 ---------- */
var VTYBR={mbt:'arm',lt:'arm',ifv:'mech',wh:'mech',mrap:'mot',spg:'art',spaa:'ad'};
/* 由陸軍載具設計生成單位類型：參考同兵種的內建類型，主武器依彈藥算穿甲，裝甲依各區等效厚度 */
function vdToType(d,n,name){var R=vcalc(d);if(!R||R.err)return null;var rate=CUR.rate||2.5,br=VTYBR[d.ty]||'arm',y=d.yr&&d.yr<2100?d.yr:2020,era=eraOfYear(Math.min(y,2030)),ek=era.k,cands=Object.keys(UT).filter(function(k){return UT[k].br===br&&UT[k].veh>0&&!(ERAI[UT[k].era]||{}).fan;});
  var ref=null,bd=1e9;cands.forEach(function(k){var dd=Math.abs((ERAI[UT[k].era]||ERA[6]).y-era.y);if(dd<bd){bd=dd;ref=UT[k];}});if(!ref)ref=UT.tk2000;var sc=n/Math.max(1,ref.veh);
  var C=vctx(),refP=LALP.t120m829a1,Z=R.zones||{},eqz=function(zs){var a=0,b=0,k=0;zs.forEach(function(z){if(!Z[z]||!Z[z][0])return;var q=null;try{q=LVL.zoneEq(Z[z][0].L,C,refP);}catch(e){}if(!q)return;a+=isFinite(q.ke)?q.ke:q.keMin||3000;b+=isFinite(q.ce)?q.ce:3000;k++;});return k?[a/k,b/k]:[0,0];};
  var f=eqz(['tf','hf']),s=eqz(['ts','hs']),rt=eqz(['rr','tp']),T=clone(ref);G.tseq=(G.tseq||0)+1;var k='c'+G.tseq;
  T.k=k;T.n=name||d.n;T.cus=1;T.era=ek;T.men=Math.round((R.crew+(R.pax||0))*n);T.veh=n;T.vn='輛'+((LVL.TYPES.l||{})[d.ty]||'');T.mob=d.ch&&/wh/.test(d.ty)?'wheel':(R.ch&&R.ch.kind==='tr'?'track':'wheel');T.vr=Math.round(R.vRoad||ref.vr);T.vx=Math.round(R.vOff||ref.vx);
  T.sa=Math.round(ref.sa*sc*10)/10;T.ha=Math.round(ref.ha*sc*10)/10;T.arm=Math.round(armLvOfZones(f[0],s[0],rt[0])*10)/10;T.armC=Math.round(armLvOfZones(f[1],s[1],rt[1])*10)/10;T.nv=R.thermal?2:Math.max(1,ref.nv||0);T.vusd=Math.round((R.unit||0)*rate);T.d=(d.code&&d.code!=='—'?d.code+'・':'')+'由 LatoVehicle 設計生成';T.vdes=d.id;
  if(R.aps&&R.aps.length&&T.fl.indexOf('P')<0)T.fl+='P';
  /* 主武器：依彈藥建立自訂武器 */var W=[],am=(R.ammo||[]).filter(function(a){return projOf(a[0]);}),tot=am.reduce(function(s2,a){return s2+(+a[1]||0);},0);
  if(R.gun&&am.length){var base=wpnOf(R.gun.cal>=115?'mbt2':R.gun.cal>=100?'mbt1':R.gun.cal>=70?'tgunh':'acan'),w=clone(base);G.wseq=(G.wseq||0)+1;w.k='cw'+G.wseq;w.n=R.gun.n;w.hid=0;w.dz={b:base.k};w.y=Math.min(y,2030);w.am=am.map(function(a){return [a[0],tot?Math.round((+a[1]||0)/tot*100)/100:1/am.length];});var ph=wPhys(w);if(ph.mm>0)w.pen=Math.round(ph.lv*10)/10;w.ce=Math.round(ph.ce*100)/100;w.rusd=Math.round(ph.usd*100)/100;if(ph.kg>0)w.kg=Math.round(ph.kg*1000)/1000;w.rpu=Math.max(1,Math.round(tot||w.rpu));w.usd=0;
    G.wpns=G.wpns||{};G.wpns[w.k]=w;W.push([w.k,n]);}
  var D=defLoad(Object.assign({},T,{load:null}));D.w.forEach(function(x){if(W.length&&/^(mbt|tgun|acan)/.test(x[0]))return;W.push(x);});T.load={w:W,v:D.v,h:D.h||0};
  /* 防空車：飛彈射程與雷達（主動尋標的飛彈可到雷達距離的 1.5 倍） */T.ux=clone(utx(ref.k));var rr=0,mr=0,act=false;(R.rads||[]).forEach(function(q){rr=Math.max(rr,q.rr||0);});(R.msls||[]).forEach(function(q){var mu=q.m&&q.m.mu&&munOf(q.m.mu);if(mu&&(mu.t==='sam'||mu.t==='aam')){mr=Math.max(mr,mu.rng||0);if(mu.act)act=true;}});
  if(mr>0){T.ux.sam=1;T.ux.rad=Math.round(Math.max(rr,8)*1000);T.ux.rng=Math.round(Math.min(mr,Math.max(rr,8)*(act?1.5:1))*1000);}
  G.types=G.types||{};G.types[k]=T;G._tv=(G._tv||1)+1;return T;}
