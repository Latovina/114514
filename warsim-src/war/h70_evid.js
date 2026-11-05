/* ===================== 戰爭罪的決策與遺留證據；附近友軍與敵軍的反應 =====================
   一、決策：對平民的行動多了四種違法命令——焚燒村莊、在水源下毒、在存糧下毒、處決（成年男性、難民或被拘留者）。
       守法、軍紀好的部隊可能拒絕；執行後記為戰爭罪行。
   二、證據：屠殺、處決（平民、人質、難民、戰俘、督戰隊槍決的自己人）、焚燒與下毒都會在地圖上留下痕跡：
       遺體、亂葬坑、焦土、被下毒的水源與糧倉。遺體幾天後腐敗，居民會把死者草草掩埋成亂葬坑；
       犯行的一方可以下令掩埋、湮滅證據（亂葬坑變得難找，但湮滅本身也被記錄）；其他各方可以派部隊調查取證、開挖亂葬坑。
       被下毒的水源與存糧讓居民一天天中毒死亡、逃離，任何在那裡取水取糧、駐紮的部隊（包括下毒的一方自己）都會中毒；
       工兵可以清理水源。
   三、發現：部隊經過時依距離、隱蔽程度、晝夜與兵種發現證據；被下毒的水源與糧倉要等居民死傷傳開，或偵察、醫護、工兵與指揮部隊才查得出來。
       發現的一方記錄在戰報、讓罪行曝光（國際聲譽下降），記者會報導；看到現場的官兵依死者是誰而恐懼、憤怒或羞愧。
   四、反應：附近的友軍潰散、被殲滅，官兵士氣下降、恐懼上升；附近的敵軍潰逃、投降或被殲滅，士氣上升。 */
function evdOn(){return !!G&&G.set.evid!==false;}
var EVDK={bodies:['遺體','遭殺害者的遺體留在現場'],grave:['亂葬坑','死者被草草掩埋的坑'],burnt:['焦土','被燒毀的房屋、糧倉與田地'],well:['被下毒的水源','水井與水源被投下毒物'],food:['被下毒的存糧','糧倉與存糧被摻了毒']};
var EVDV={civ:'平民',ref:'難民',host:'人質',pow:'投降的官兵',own:'被自己人槍決的官兵',det:'被拘留的平民'};
/* 戰爭罪的種類 → 證據的種類與死者身分 */
var EVDC={mass:['bodies','civ'],host:['bodies','host'],exec:['bodies','pow'],powex:['bodies','pow'],refshot:['bodies','ref'],arson:['burnt','civ'],burn:['burnt','civ'],poisonw:['well','civ'],poisonf:['food','civ'],execc:['bodies','civ'],execr:['bodies','ref'],execd:['bodies','det']};
MFN.atro='目睹暴行';MFN.rage='復仇怒火';MFN.shame='本軍暴行';MFN.near='附近戰況';KINDN.poison='中毒';CIVK.poison='水源與存糧被下毒';
function evdL(){return G.evd||(G.evd=[]);}
function evdById(id){var L=evdL();for(var i=0;i<L.length;i++)if(L[i].id===id)return L[i];return null;}
function evdNearSet(x,y,R){if(!G.civ)return null;var b=null,bd=R;G.civ.S.forEach(function(g){var d=dist(g.x,g.y,x,y)-(g.r||300);if(d<bd){bd=d;b=g;}});return b;}
function evdAdd(k,x,y,o){if(!evdOn())return null;var e=Object.assign({id:(G.evdSeq=(G.evdSeq||0)+1),k:k,x:x,y:y,t:G.t,side:-1,by:0,byn:'',vs:-1,vk:'civ',n:0,hid:0,found:{},doc:{},dk:''},o||{});if(e.side>=0)e.found[e.side]=G.t;evdL().push(e);return e;}
/* 同一地點近期的遺體併在一起 */
function evdMerge(k,x,y,side,vk,n,o){var L=evdL();for(var i=L.length-1;i>=0;i--){var e=L[i];if(G.t-e.t>12*3600)break;if(e.k===k&&e.side===side&&e.vk===vk&&dist(e.x,e.y,x,y)<800){e.n+=n;e.t1=G.t;if(o&&o.txt)e.txt=o.txt;return e;}}
  return evdAdd(k,x,y,Object.assign({side:side,vk:vk,n:n},o||{}));}
/* 戰爭罪紀錄 → 現場留下的證據 */
(function(){var b=warCrime;warCrime=function(u,kind,victims,txt,ordered){var w=b(u,kind,victims,txt,ordered);try{var M=EVDC[kind];if(!M||!evdOn())return w;var n=Math.round(victims||0);if(M[0]==='bodies'&&n<1)return w;
    var g=evdNearSet(u.x,u.y,2500),vs=M[1]==='pow'?enemyOf(u.side):g?g.loy:-1,x=g&&M[0]!=='bodies'?g.x:u.x+(rnd()-0.5)*300,y=g&&M[0]!=='bodies'?g.y:u.y+(rnd()-0.5)*300;
    var e=M[0]==='bodies'?evdMerge('bodies',x,y,u.side,M[1],n,{by:u.id,byn:uName(u),vs:vs,dk:kind,txt:txt}):evdAdd(M[0],x,y,{side:u.side,by:u.id,byn:uName(u),vs:vs,vk:M[1],n:n,dk:kind,txt:txt,g:g?g.i:-1});
    if(e)e.wi=G.civ.wc.length-1;}catch(err){}return w;};})();
/* 督戰隊就地槍決自己人：同樣留下遺體 */
(function(){var b=hit;hit=function(t,src,dm,dv,sup,kind){b(t,src,dm,dv,sup,kind);if(kind==='exec'&&dm>=0.5&&evdOn()&&t&&onMap(t)&&G.started)evdMerge('bodies',t.x+(rnd()-0.5)*200,t.y+(rnd()-0.5)*200,t.side,'own',Math.round(dm),{by:t.id,byn:uName(t),vs:t.side,dk:'iron',txt:uName(t)+'就地處決逃兵與「動搖分子」'});};})();
/* ---------- 一、新的違法命令 ---------- */
Object.assign(CIVA,{burn:['焚燒村莊',3600,1,'放火燒毀房屋、糧倉與田地：焦土作戰，居民流離失所、無處棲身，是戰爭罪行'],
  poisonw:['水源投毒',1800,2,'在水井與水源下毒：自古即被視為違反戰爭慣例，1899 年海牙公約明文禁止使用毒物；居民與任何在這裡取水的部隊都會中毒'],
  poisonf:['存糧投毒',1800,2,'在糧倉與存糧裡下毒：禁止使用毒物；吃下的人會中毒，包括來這裡徵糧的部隊'],
  exec:['處決',1800,2,'槍決成年男性、難民或被拘留者：嚴重的戰爭罪行，會留下遺體與亂葬坑，執行的官兵也會受創']});
(function(){var b=civApply;civApply=function(u,o,T,t){var a=o.opt.act;if(a!=='burn'&&a!=='poisonw'&&a!=='poisonf'&&a!=='exec')return b(u,o,T,t);evdApply(u,o,T,t,a);};})();
function evdApply(u,o,T,t,a){var side=u.side,C=G.civ,g=t==='S'?T:C.S[T.from],place=placeTxt(T.x,T.y),txt,dd=0,e;
  if(a==='burn'){if(t!=='S')return;var v=(T.val0||0)*(0.35+0.25*rnd()),pr=civPresent(T);T.loss=(T.loss||0)+v;T.burnt=(T.burnt||0)+v;C.prop.fire+=v;C.cs[side].prop+=v;T.food=0;T.shel=Math.max(0,(T.shel||0)-0.6);T.burnT=G.t;
    dd=pr*(0.005+0.02*rnd());if(dd>0.5)civCas(T,dd,0.6,'fireS',side);T.unrest=100;T.alarm=1;T.hostT=G.t;attAdd(T,side,-70);attNear(T.x,T.y,15000,side,-20);if(civPresent(T)>30)refSpawn(T,civPresent(T)*0.75);
    txt=uName(u)+'奉命焚燒'+T.n+'：房屋、糧倉與田地付之一炬，損失約 '+money(v)+(dd>=1?'，約 '+fmt(dd)+' 人葬身火海':'')+'，居民流離失所';}
  else if(a==='poisonw'||a==='poisonf'){if(t!=='S')return;var days=a==='poisonw'?7+7*rnd():20+10*rnd();if(a==='poisonw'){T.wpois=G.t+days*86400;T.wpby=side;}else{T.fpois=G.t+days*86400;T.fpby=side;}T.pdead=0;T.pknown=0;
    txt=uName(u)+'奉命在'+T.n+'的'+(a==='poisonw'?'水井與水源':'糧倉與存糧')+'裡下毒';dd=0;}
  else{var GR=civGroup(T,t),n;if(t==='S'){n=Math.min(T.men*(0.15+0.25*rnd()),u.men*2+20);if(n<1){logE(side,'civ',uName(u)+'在'+place+'找不到可以處決的成年男性',u.x,u.y,u.id);return;}civCas(T,n,1,'exec',side);T.unrest=100;T.alarm=1;attAdd(T,side,-80);}
    else if(t==='R'){n=Math.min(Math.max(T.m*0.8,GR.n*0.2),u.men*2+20);if(n<1)return;refCas(T,n,1,'refshot',side);}
    else{n=T.n*0.9;var f=n/Math.max(1,T.n);T.m-=T.m*f;T.w-=T.w*f;T.k-=T.k*f;T.e-=T.e*f;T.n-=n;T.dead=(T.dead||0)+n;civStatAdd(side,n,0,0,0,'exec');}
    dd=n;attNear(T.x,T.y,20000,side,-35);txt=uName(u)+'奉命在'+place+'處決約 '+fmt(n)+' 名'+(t==='S'?'成年男性居民':t==='R'?'難民':'被拘留的平民');
    /* 執行的官兵：士氣、軍紀下降，恐懼上升 */u.mor=clamp(u.mor-8,0,100);if(u.dis!==undefined)u.dis=clamp(u.dis-8,0,100);if(typeof fearAdd==='function')fearAdd(u,8,'atro');}
  logE(side,'civ','⚠ '+txt,u.x,u.y,u.id);e=civEv('crime',side,txt,T.x,T.y,u.id,{dk:a==='exec'?(t==='S'?'execc':t==='R'?'execr':'execd'):a,v:dd,ord:true,wc:1});
  warCrime(u,a==='exec'?(t==='S'?'execc':t==='R'?'execr':'execd'):a,dd,txt,true);if(a!=='exec'){u.mor=clamp(u.mor-3,0,100);if(u.dis!==undefined)u.dis=clamp(u.dis-4,0,100);}
  if(G.press)pressOn(e,u);civAftermath(u,T,a,dd);if(G.onPause&&apOn('crime'))G.onPause('對平民的違法行動');}
/* ---------- 二、被下毒的水源與存糧；遺體腐敗與掩埋 ---------- */
function evdPoisonStep(){if(!G.civ)return;var h=600/3600;G.civ.S.forEach(function(g){var w=g.wpois&&G.t<g.wpois,f=g.fpois&&G.t<g.fpois;if(!w&&!f)return;var pr=civPresent(g);
    /* 每天約 2%（水）與 1.2%（糧）的居民中毒死亡；居民發現之後大多不再取用 */if(pr>=1){var rate=(w?0.02:0)+(f?0.012:0);if(g.pknown)rate*=0.15;var c=Math.min(pr*rate*h/24,pr*0.05);if(c>0.02){civCas(g,c,0.7,'poison',w?g.wpby:g.fpby);g.pdead=(g.pdead||0)+c;}
      if(!g.pknown&&g.pdead>=8){g.pknown=1;g.alarm=1;g.unrest=clamp(g.unrest+30,0,100);if(pr>30)refSpawn(g,pr*0.5);evdL().forEach(function(e){if((e.k==='well'||e.k==='food')&&e.g===g.i)e.rev=1;});}}
    /* 駐紮在這裡的部隊（不分敵我）：不知道水有毒就會中毒 */gridNear(g.x,g.y,(g.r||300)+200,function(u){if(!onMap(u)||!isLeaf(u)||ST(u).dom!=='land'||dist(u.x,u.y,g.x,g.y)>(g.r||300)+200)return;var known=evdL().some(function(e){return (e.k==='well'&&w||e.k==='food'&&f)&&e.g===g.i&&e.found[u.side];});if(known)return;
      if(G.t-(u.movedAt||-1e9)<1800)return;var m=u.men*0.003*((w?1:0)+(f?0.6:0))*h;u.pnA=(u.pnA||0)+m;if(u.pnA>=0.5){var q=u.pnA;u.pnA=0;hit(u,null,q,0,0,'poison');u.sick=(u.sick||0)+q*2;u.pnN=(u.pnN||0)+q;if(!u.pnLog){u.pnLog=1;logE(u.side,'evid',uName(u)+'在'+g.n+'有官兵上吐下瀉、陸續倒下：水或食物可能被下了毒',u.x,u.y,u.id);}}});});}
/* 外部（徵糧、取水）可以查詢這個聚落有沒有被下毒 */
function evdPoisoned(g,what){if(!g)return false;return what==='water'?!!(g.wpois&&G.t<g.wpois):what==='food'?!!(g.fpois&&G.t<g.fpois):!!(g.wpois&&G.t<g.wpois||g.fpois&&G.t<g.fpois);}
function evdDecay(){evdL().forEach(function(e){if(e.k!=='bodies'||e.cov)return;var age=G.t-(e.t1||e.t);if(age<2*86400)return;
    /* 兩天後：附近有居民就會把死者埋了，變成亂葬坑（沒有人掩埋的就一直曝屍） */var g=evdNearSet(e.x,e.y,4000);if(g&&civPresent(g)>20&&!(e.side>=0&&friendNear(e.side,e.x,e.y,1500)>0)&&(hstr('bur|'+e.id+'|'+Math.floor(G.t/86400))%4===0)){e.k='grave';e.bur=G.t;e.burBy='civ';e.hid=Math.max(e.hid,0.2);}});}
/* ---------- 三、發現 ---------- */
function evdR(e,u,s){var R={bodies:450,grave:220,burnt:2600,well:120,food:120}[e.k]||300,b=s.br;
  /* 下毒看不出來：要等居民死傷傳開，或偵察、醫護、工兵與指揮部隊查驗 */if(e.k==='well'||e.k==='food'){if(e.rev)R=500;else if(!/^(med|eng|hq|rec|sof)$/.test(b))return 0;}if(b==='rec'||b==='sof')R*=1.5;
  if(G.env.light<0.3&&e.k!=='burnt')R*=0.6;return R*(1-0.7*(e.hid||0));}
function evdStep(){if(!evdOn())return;var L=evdL();if(!L.length)return;G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u))return;var s=ST(u);if(s.dom!=='land'||u.st==='lift')return;
    for(var i=0;i<L.length;i++){var e=L[i],d=Math.abs(e.x-u.x)+Math.abs(e.y-u.y);if(d>6000)continue;d=dist(e.x,e.y,u.x,u.y);var R=evdR(e,u,s);if(R<=0||d>R)continue;
      if(!e.found[u.side])evdFound(e,u);var S=u.evS||(u.evS={});if(!S[e.id]){S[e.id]=1;if(e.by!==u.id)evdReact(u,e);}}});}
function evdTxt(e){var n=e.n>=1?'約 '+fmt(e.n)+' 名'+(EVDV[e.vk]||'死者'):'';return e.k==='bodies'?n+'的遺體':e.k==='grave'?'一處亂葬坑'+(e.ex?'（'+n+'）':''):e.k==='burnt'?'被燒毀的村莊':e.k==='well'?'被下毒的水源':'被下毒的存糧';}
function evdFound(e,u){var side=u.side;e.found[side]=G.t;var place=placeTxt(e.x,e.y),own=side===e.side,txt=uName(u)+'在'+place+'發現'+evdTxt(e)+(e.vk==='pow'&&e.vs===side?'——是我軍投降的官兵':'');
  logE(side,'evid',(own?'':'⚠ ')+txt,e.x,e.y,u.id);
  if(!own&&e.side>=0){var W=G.civ&&G.civ.wc[e.wi];if(W&&!W.known){W.known=true;G.civ.rep[e.side]=clamp(G.civ.rep[e.side]-Math.min(25,3+(e.n||0)/40),0,100);}
    var ce={t:G.t,k:'crime',s:e.side,txt:place+'發現'+evdTxt(e)+(e.byn?'，疑為'+e.byn+'所為':''),x:e.x,y:e.y,u:u.id,dk:e.dk,v:e.n,wc:1};if(G.press)pressOn(ce,u);if(G.onPause&&apOn('crime')&&!(SD(side)&&SD(side).ai))G.onPause('發現戰爭罪行的證據');}}
/* 看到現場的官兵：死者是自己人，恐懼加上憤怒或沮喪；平民、難民與人質，恐懼與沮喪（死者是自己同胞則憤怒）；本軍幹的，羞愧——極端政策的部隊則麻木 */
function evdReact(u,e){var own=u.side===e.side,mine=e.vs===u.side,big=e.n>=20?1.5:1,off=offOf(u),fear=function(v){if(typeof fearAdd==='function')fearAdd(u,v,'atro');},mor=function(k,v){u.mor=clamp(u.mor+v,0,100);mfAdd(u,k,v);};
  if(e.k==='burnt'&&!e.n){if(!own)mor('atro',-0.5);u.evT=G.t;u.evC=(u.evC||0)+1;u.evK='burn';return;}
  if(e.k==='well'||e.k==='food'){fear(4);if(!own)mor('atro',-1);u.evT=G.t;u.evC=(u.evC||0)+1;u.evK='poison';return;}
  if(own){if(polOf(u,'civ')>=4)u.dis=clamp((u.dis||50)-1,0,100);else{mor('shame',-2*big);u.dis=clamp((u.dis||50)-1,0,100);}fear(3);u.evK='own';}
  else if(e.vk==='pow'&&mine){fear(10*big);if(typeof atroHear==='function')atroHear(u);var hard=(u.dis||50)>55||hasQ(off,'stubborn')||u.irr;mor(hard?'rage':'atro',hard?3:-3);u.evK='pow';}
  else if(e.vk==='own'){fear(3);u.evK='own2';}
  else{fear(6*big);if(mine)mor('rage',2);else mor('atro',-1.5*big);u.evK=e.k==='grave'?'grave':'body';}
  u.evT=G.t;u.evC=(u.evC||0)+1;}
/* ---------- 四、命令：調查取證、開挖亂葬坑、掩埋湮滅證據、清理水源 ---------- */
Object.assign(ORDN,{evd:'處理證據'});var EVDA={inv:['調查取證',3*3600],dig:['開挖亂葬坑',6*3600],cov:['掩埋、湮滅證據',4*3600],fix:['清理水源',8*3600]};
function evdAct(u,o){var e=evdById(o.opt&&o.opt.id),a=o.opt&&o.opt.act;if(!e||!EVDA[a]){u.ord=null;u.task='hold';return true;}
  if(a==='fix'&&!isEng(u)){logE(u.side,'eng',uName(u)+'不是工兵，無法清理水源',u.x,u.y,u.id);u.ord=null;u.task='hold';return true;}
  if(a==='cov'&&u.side!==e.side){u.ord=null;u.task='hold';return true;}
  o.ph='go';var p=validPos(ST(u),e.x,e.y);if(dist(u.x,u.y,e.x,e.y)<250){u.task='at';u.path=null;}else{u.task='go';wantPath(u,p[0],p[1]);}return true;}
function evdLeaf(u,s,o){var e=evdById(o.opt.id),a=o.opt.act;if(!e){u.ord=null;u.task='hold';return true;}
  if(o.ph==='go'){if(dist(u.x,u.y,e.x,e.y)>300){if((G.step+u.id)%6===0&&!u.path){var p=validPos(s,e.x,e.y);u.task='go';wantPath(u,p[0],p[1]);}return false;}o.ph='work';o.t1=G.t;u.task='work2';u.path=null;logE(u.side,'evid',uName(u)+'開始'+EVDA[a][0]+'（'+placeTxt(e.x,e.y)+'）',u.x,u.y,u.id);return true;}
  if(o.ph==='work'){var need=EVDA[a][1]*(isEng(u)&&(a==='dig'||a==='cov'||a==='fix')?0.6:1);if(G.t-o.t1<need)return true;evdDo(u,e,a);u.ord=null;u.task='hold';return true;}return false;}
function evdDo(u,e,a){var side=u.side,place=placeTxt(e.x,e.y);if(!e.found[side])e.found[side]=G.t;
  if(a==='inv'||a==='dig'){e.doc[side]=G.t;if(a==='dig'&&e.k==='grave'){e.ex=1;e.hid=0;}var who=e.side>=0&&e.side!==side?G.sides[e.side].name+(e.byn?'（'+e.byn+'）':''):'';
    logE(side,'evid',uName(u)+(a==='dig'?'開挖':'調查')+place+'的'+(EVDK[e.k]||['現場'])[0]+'，記錄'+evdTxt(e)+(who?'；證據指向'+who:'')+(e.cov?'；現場有被刻意掩埋、湮滅的痕跡':''),e.x,e.y,u.id);
    if(e.side>=0&&e.side!==side){var W=G.civ&&G.civ.wc[e.wi];if(W){W.known=true;W.doc=1;}}if(a==='dig'){var g2=function(v){if(typeof fearAdd==='function')fearAdd(u,v,'atro');};g2(5);u.mor=clamp(u.mor-2,0,100);mfAdd(u,'atro',-2);}return;}
  if(a==='cov'){if(e.k==='bodies'){e.k='grave';e.bur=G.t;e.burBy='perp';}e.hid=Math.max(e.hid,0.75);e.cov=G.t;var W2=G.civ&&G.civ.wc[e.wi];if(W2)W2.cov=1;
    var txt=uName(u)+'在'+place+'掩埋遺體、湮滅'+(EVDK[e.k]||['證據'])[0]+'的痕跡';logE(side,'evid','⚠ '+txt,e.x,e.y,u.id);warCrime(u,'cover',0,txt,true);u.mor=clamp(u.mor-2,0,100);return;}
  if(a==='fix'){var g=G.civ&&G.civ.S[e.g];if(g){g.wpois=0;g.fpois=0;}e.fix=G.t;logE(side,'evid',uName(u)+'清理了'+place+'被下毒的水源與存糧',e.x,e.y,u.id);}}
(function(){var b=v4Act;v4Act=function(u,o){if(o.k==='evd')return evdAct(u,o);return b(u,o);};})();
(function(){var b=v4Leaf;v4Leaf=function(u,s){var o=u.ord;if(o&&o.k==='evd'&&o.opt)return evdLeaf(u,s,o);return b(u,s);};})();
/* ---------- 五、附近友軍與敵軍的反應 ---------- */
function rxStep(){var ev=[];G.units.forEach(function(u){if(!isLeaf(u))return;var a=alive(u),m=u.ms;if(u._rxA===undefined){u._rxA=a;u._rxM=m;return;}
    if(u._rxA&&!a&&u.st==='dead')ev.push([u,'fall']);else if(a&&m==='rout'&&u._rxM!=='rout')ev.push([u,'rout']);else if(a&&u.surr&&!u._rxS){u._rxS=1;ev.push([u,'surr']);}u._rxA=a;u._rxM=m;});
  ev.forEach(function(q){var v=q[0],k=q[1],big=(v.men0||100)>=300?1.4:1;gridNear(v.x,v.y,1800,function(u){if(u===v||!isLeaf(u)||!onMap(u)||ST(u).dom!=='land'||dist(u.x,u.y,v.x,v.y)>1800)return;
      if(u.side===v.side){if(k==='fall'){u.mor=clamp(u.mor-2*big,0,100);mfAdd(u,'near',-2*big);if(typeof fearAdd==='function')fearAdd(u,4*big,'cas');u.rxT=G.t;u.rxC=(u.rxC||0)+1;u.rxK='fall';}
        else if(k==='rout'||k==='surr'){u.mor=clamp(u.mor-1.5*big,0,100);mfAdd(u,'near',-1.5*big);if(typeof fearAdd==='function')fearAdd(u,3*big,'cas');u.rxT=G.t;u.rxC=(u.rxC||0)+1;u.rxK=k==='rout'?'rout':'fsurr';}}
      else if(v.side>=0&&u.side>=0&&v.side<nSides()&&u.side<nSides()){u.mor=clamp(u.mor+(k==='fall'?1.5:1)*big,0,100);mfAdd(u,'near',(k==='fall'?1.5:1)*big);u.rxT=G.t;u.rxC=(u.rxC||0)+1;u.rxK=k==='surr'?'esurr':'ewin';}});});}
(function(){var b=v8Step;v8Step=function(){b();if(!G.started)return;if(G.step%4===2)rxStep();if(G.step%20===13){evdStep();evdPoisonStep();}if(G.step%120===17)evdDecay();};})();
/* 線上：證據清單整份同步；部隊的記號不送 */
if(typeof MPCOL!=='undefined'){MPCOL.push(['evd','id',function(s){return (G.evd||[]).filter(function(e){return s<0||e.found&&e.found[s];}).map(function(e){if(s<0)return e;var c=Object.assign({},e),f={},d={};f[s]=e.found[s];if(e.doc&&e.doc[s])d[s]=e.doc[s];c.found=f;c.doc=d;return c;});}]);MPCC.evd=function(){return G.evd||(G.evd=[]);};MPKEY.evd='id';}if(typeof MPUX!=='undefined'){MPUX.evS=1;MPUX._rxA=1;MPUX._rxM=1;MPUX._rxS=1;MPUX.pnA=1;MPUX.pnLog=1;}
/* 存檔：證據清單一起帶走 */
if(typeof GKEYS!=='undefined')GKEYS.push('evd','evdSeq');
