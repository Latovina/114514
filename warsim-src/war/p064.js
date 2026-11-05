
/* ===================== 外觀模組：縮圖預覽、附件、標誌、匯出 ===================== */
var ARUN={sp:{n:'輻條負重輪＋側裙',d:'刑天式：大直徑輻條負重輪與分段側裙'},disc:{n:'碟形負重輪＋側裙',d:'實心碟形負重輪，側裙不變'},open:{n:'外露托帶輪',d:'不裝側裙，露出上方履帶與托帶輪'},rub:{n:'橡膠短裙',d:'擋泥板下掛短橡膠裙'},tyre:{n:'越野輪胎',d:'輪式車輛的越野輪胎'}};
var AACC=[['box','尾艙置物箱'],['ant','天線'],['smk','砲塔煙幕彈'],['hsmk','車體煙幕彈'],['coax','同軸機砲'],['drum','外掛油桶'],['atgm','反戰車飛彈箱']];
var VA={img:{},q:[],t:0};
function artOk(d){return d.br==='l'||(d.br==='a'&&typeof aAirVeh==='function')||(d.br==='s'&&typeof aSeaVeh==='function');}
function artOpt(cat,k){var o=cat[k];return {id:k,n:o.n,d:o.d||''};}
function artSlots(d,R){var ch=R.ch||{},wh=ch.kind==='wh',S=[];
  if(d.br==='l'){S.push({k:'hull',n:'車體',v:'full',opts:Object.keys(AHULL).filter(function(k){return (AHULL[k].kind==='wh')===wh;}).map(function(k){return artOpt(AHULL,k);})});
    S.push({k:'run',n:'行走機構',v:'run',opts:(wh?['tyre']:['sp','disc','open','rub']).map(function(k){return artOpt(ARUN,k);})});
    S.push({k:'tur',n:'砲塔',v:'tur',opts:Object.keys(ATUR).map(function(k){return artOpt(ATUR,k);})});
    if(R.gun)S.push({k:'gun',n:'砲管（長度與口徑依主砲模組）',v:'gun',opts:Object.keys(AGUN).map(function(k){return artOpt(AGUN,k);})});
    S.push({k:'sight',n:'觀瞄裝置',v:'tur',opts:Object.keys(ASIGHT).map(function(k){return artOpt(ASIGHT,k);})});}
  else if(typeof artSlotsX==='function')S=S.concat(artSlotsX(d,R));
  var pk=Object.keys(APAINT).filter(function(k){return d.br!=='l'||(k!=='navy'&&k!=='dark');});if(d.br!=='l')pk=['navy','dark','grey'].concat(pk.filter(function(k){return ['navy','dark','grey'].indexOf(k)<0;}));
  S.push({k:'paint',n:'塗裝',v:'full',opts:pk.map(function(k){return artOpt(APAINT,k);})});
  return S;}
/* views for thumbnails, from a dry run of the drawing (vehicle metres) */
function artViews(d,R,A){var D=new APen(null,{S:AS,ox:10,gy:AGY,tone:AOD,cols:{}}),B=JSON.parse(JSON.stringify(A));B.mark.title=0;B.mark.logo='';artVeh(D,d,R,B);
  var bb=D.bb,an=D.anch,mx=function(X){return (X-10)/AS;},my=function(Y){return (AGY-Y)/AS;},top=my(bb[1]),V={full:[mx(bb[0])-0.25,-0.25,mx(bb[2])+0.25,top+0.2]};
  var fit=function(cx,cy,h){return [cx-h,cy-h/2,cx+h,cy+h/2];};
  if(an.deck!==undefined){var r0=(an.rear||0)-0.3;V.run=[r0,-0.15,r0+4.6,2.15];var rx=an.ring?an.ring[0]:4,t1=top+0.15,b1=an.deck-0.5;V.tur=fit(rx+0.5,(t1+b1)/2,Math.max(1.6,t1-b1));}
  if(an.gun)V.gun=[an.gun[0]-1.2,an.gun[1]-0.8,an.muzzle[0]+0.3,an.gun[1]+0.8];
  Object.keys(an).forEach(function(k){if(/^v_/.test(k))V[k.slice(2)]=an[k];});return V;}
function artLogoImg(d,redraw){var src=d.art&&d.art.img;if(!src)return null;var im=VA.img[src];if(!im){im=VA.img[src]=new Image();im.onload=function(){redraw();};im.src=src;}return im.complete&&im.naturalWidth?im:null;}
function vArtDraw(d,R){var cv=q('vArtCv');if(!cv||R.err)return;try{var img=artRender(d,R,{img:artLogoImg(d,function(){vArtDraw(d,R);})});VA.cur=img;artShow(cv,img);}catch(e){err(e);}}
function artSet(d,f,ui){d.art=d.art||{};f(d.art);vtouch(d);vArtDraw(d,VR);if(ui!==false)vArtUI(d,VR);}
function vArtUI(d,R){var box=q('vArt');if(!box)return;VA.q=[];if(!artOk(d)||!R||R.err){box.innerHTML='<div class="lt-note">此軍種的美術圖尚未提供外觀模組。</div>';return;}
  var A0=artSel(d,R),slots=artSlots(d,R),h='<div class="lt-note">外觀模組只改變圖面，不影響重量與性能；'+(d.br==='l'?'車長、負重輪數、主砲口徑與倍徑、升級套件（反應裝甲、柵欄、主動防禦、遙控武器站）':d.br==='a'?'機長、旋翼直徑、發動機數、預警雷達與外掛彈藥':'艦長、型深、吃水、垂直發射單元、艦砲、近防與艦載機數')+'依設計模組自動繪出。點選縮圖即可替換。</div>';
  var sm=q('vArtSum');if(sm)sm.textContent=d.br==='l'?'外觀模組（車體、行走機構、砲塔、砲管、觀瞄、塗裝、附件與標誌）':d.br==='a'?'外觀模組（機鼻、座艙罩、進氣道、尾翼、起落架、塗裝與標誌）':'外觀模組（艦艏、上層結構、桅杆、煙囪、塗裝與標誌）';
  slots.forEach(function(sl){h+='<div class="lt-slot">'+esc(sl.n)+'</div><div class="lt-pick">'+sl.opts.map(function(o){return '<button type="button" class="lt-pk'+(A0[sl.k]===o.id?' on':'')+'" data-sl="'+sl.k+'" data-v="'+esc(o.id)+'" title="'+esc(o.d)+'"><canvas data-th="'+sl.k+'|'+esc(o.id)+'"></canvas><span>'+esc(o.n)+'</span></button>';}).join('')+'</div>';});
  if(d.br==='l')h+='<div class="lt-slot">附件</div><div class="lt-chips">'+AACC.map(function(a){return '<button type="button" class="lt-chip'+(A0.acc[a[0]]?' on':'')+'" data-acc="'+a[0]+'">'+a[1]+'</button>';}).join('')+
    '<button type="button" class="lt-chip'+(A0.kits?' on':'')+'" data-kits="1">顯示升級套件外觀</button></div>';
  var M=A0.mark;h+='<div class="lt-slot">標誌與標題</div><div class="lt-form">'+
    (d.br==='s'?'':'<label>車牌／機號 <input type="text" data-am="plate" value="'+esc(M.plate)+'" style="width:130px"></label><label>部隊 <input type="text" data-am="unit" value="'+esc(M.unit)+'" style="width:120px"></label>')+
    (d.br==='l'?'<label><input type="checkbox" data-amc="roundel"'+(M.roundel?' checked':'')+'> 國籍圓徽</label><label><input type="checkbox" data-amc="emblem"'+(M.emblem?' checked':'')+'> 部隊徽章</label>':'')+
    '<label><input type="checkbox" data-amc="title"'+(M.title?' checked':'')+'> 標題區</label>'+
    '<label>商標 <select data-k="vArtLogo">'+opts([['','無'],['cloud','祥雲徽'],['img','自訂圖片']],M.logo||'')+'</select></label><button type="button" data-k="vArtImgB">上傳商標圖片</button><input type="file" data-k="vArtImg" accept="image/*" style="display:none">'+
    '<label>背景 <select data-k="vArtBg">'+opts([['sky','天藍（同原圖）'],['white','白色'],['none','透明']],A0.bg)+'</select></label></div>'+
    '<label class="lt-note" style="display:block;margin-top:6px">標題</label><input type="text" data-k="vArtT" value="'+esc(A0.title)+'" style="width:100%;box-sizing:border-box">'+
    '<label class="lt-note">副標題（每行一列）</label><textarea data-k="vArtS" rows="4" style="width:100%;box-sizing:border-box;font-size:12.5px">'+esc((A0.sub||[]).join('\n'))+'</textarea>'+
    '<div class="row" style="margin-top:6px"><button type="button" data-k="vArtReset">恢復預設外觀</button></div>';
  box.innerHTML=h;
  box.onclick=function(e){var pk=e.target.closest('.lt-pk');if(pk){var sl=pk.getAttribute('data-sl'),v=pk.getAttribute('data-v');artSet(d,function(a){a[sl]=v;});return;}
    var ac=e.target.closest('[data-acc]');if(ac){var k=ac.getAttribute('data-acc'),cur=artSel(d,VR).acc[k];artSet(d,function(a){a.acc=a.acc||{};a.acc[k]=cur?0:1;});return;}
    if(e.target.closest('[data-kits]')){var kv=artSel(d,VR).kits;artSet(d,function(a){a.kits=kv?0:1;});}};
  Array.prototype.forEach.call(box.querySelectorAll('[data-am]'),function(el){el.onchange=function(){var k=el.getAttribute('data-am');artSet(d,function(a){a.mark=a.mark||{};a.mark[k]=el.value;},false);};});
  Array.prototype.forEach.call(box.querySelectorAll('[data-amc]'),function(el){el.onchange=function(){var k=el.getAttribute('data-amc');artSet(d,function(a){a.mark=a.mark||{};a.mark[k]=el.checked?1:0;},false);};});
  q('vArtLogo').onchange=function(){var v=this.value;if(v==='img'&&!(d.art&&d.art.img)){q('vArtImg').click();return;}artSet(d,function(a){a.mark=a.mark||{};a.mark.logo=v;},false);};
  q('vArtImgB').onclick=function(){q('vArtImg').click();};
  q('vArtImg').onchange=function(){var f=this.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(){var im=new Image();im.onload=function(){var s=Math.min(1,360/im.width,310/im.height),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*s));c.height=Math.max(1,Math.round(im.height*s));
      c.getContext('2d').drawImage(im,0,0,c.width,c.height);var url=c.toDataURL('image/png');artSet(d,function(a){a.img=url;a.mark=a.mark||{};a.mark.logo='img';});};im.src=rd.result;};rd.readAsDataURL(f);};
  q('vArtBg').onchange=function(){var v=this.value;artSet(d,function(a){a.bg=v;},false);};
  q('vArtT').onchange=function(){var v=this.value;artSet(d,function(a){a.title=v;},false);};
  q('vArtS').onchange=function(){var v=this.value.split('\n').map(function(s){return s.replace(/\s+$/,'');}).filter(function(s,i,ar){return s||i<ar.length-1;});artSet(d,function(a){a.sub=v;},false);};
  q('vArtReset').onclick=function(){delete d.art;vtouch(d);vArtDraw(d,VR);vArtUI(d,VR);};
  /* thumbnails are drawn a few per frame so the page stays responsive */
  slots.forEach(function(sl){sl.opts.forEach(function(o){VA.q.push([sl,o]);});});var tok=++VA.t;
  (function step(){if(tok!==VA.t)return;var t0=Date.now();while(VA.q.length&&Date.now()-t0<24){var it=VA.q.shift(),sl=it[0],o=it[1],cv=box.querySelector('canvas[data-th="'+sl.k+'|'+o.id+'"]');if(!cv)continue;
      try{var A1=JSON.parse(JSON.stringify(A0));A1[sl.k]=o.id;var V=artViews(d,R,A1);artThumb(cv,d,R,A1,V[sl.v]||V.full,164,82);}catch(e){console.error(e);}}
    if(VA.q.length)(window.requestAnimationFrame||setTimeout)(step);})();}
function artFile(d){return 'lato-art-'+String(d.code&&d.code!=='—'?d.code:d.id).replace(/[^A-Za-z0-9._-]+/g,'_');}
function artDownload(d,scale){if(!VA.cur)return;var src=VA.cur,c=src;if(scale>1){c=document.createElement('canvas');c.width=src.width*scale;c.height=src.height*scale;var g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(src,0,0,c.width,c.height);}
  c.toBlob(function(b){if(b)dl(artFile(d)+(scale>1?'@'+scale+'x':'')+'.png',b);},'image/png');}


var VKEY='latoArmory.veh.v1',VS={br:'l',id:'xt03',sub:{l:'spec',a:'spec',s:'spec'},zone:'tf',duelB:'mbt125',duelR:2000,cruise:18,adT:'sub',adN:8,adAew:false,prof:'hhh',thr:null,view:'art',artOpen:true};
var VD={des:[],mods:[],pkg:[]},VBASE={};
function vload(){var sv=store(VKEY)||{};VD.mods=VL.MODS.map(A.cloneObj);VD.pkg=VL.PKG.map(A.cloneObj);VD.des=VL.DES.map(A.cloneObj);VL.DES.forEach(function(d){VBASE[d.id]=1;});
  (sv.mods||[]).forEach(function(m){var i=idxOf(VD.mods,m.id);if(i>=0)VD.mods[i]=m;else VD.mods.push(m);});
  (sv.des||[]).forEach(function(d){var i=idxOf(VD.des,d.id);if(i>=0)VD.des[i]=d;else VD.des.push(d);});
  if(sv.vs)['br','id','duelB','duelR','cruise','prof','view','artOpen'].forEach(function(k){if(sv.vs[k]!==undefined)VS[k]=sv.vs[k];});
  var ref=A.cloneObj(VL.find(VL.DES,'xt03'));VL.balancePackages(ref,vctx());}
function vsave(){store(VKEY,{mods:VD.mods.filter(function(m){return m._u;}),des:VD.des.filter(function(d){return d._u;}),vs:{br:VS.br,id:VS.id,duelB:VS.duelB,duelR:VS.duelR,cruise:VS.cruise,prof:VS.prof,view:VS.view,artOpen:VS.artOpen}});}
var VCACHE={};
function vctx(){return VL.ctxOf({mods:VD.mods,pkg:VD.pkg,des:VD.des,mun:munAll(),mats:S.mats,proj:S.proj,rate:S.set.rate,env:env(),cache:VCACHE});}
function vdes(id){return VL.find(VD.des,id)||VD.des[0];}
function vmod(id){return VL.find(VD.mods,id);}
function vmun(id){return munOf(id);}
function cn(d){if(!isFinite(d))return '—';var a=Math.abs(d);return a>=1e8?fx(d/1e8,a>=1e10?1:2)+' 億':a>=1e4?fx(d/1e4,a>=1e7?0:1)+' 萬':fx(d,a<10?2:0);}
function cnD(d){return cn(d*S.set.rate/curC().usd);}
function dyM(d){var c=curC();return (c.sym?esc(c.sym):'')+'<b>'+cnD(d)+'</b>'+(c.sym?'':' '+esc(c.n))+(showUsd()&&c.usd!==1?'<span class="lt-note">（US$ '+cn(d*S.set.rate)+'）</span>':'');}
function tons(kg){return fx(kg/1000,kg>=1e7?0:kg>=1e5?1:2)+' 噸';}
function vtouch(d){d._u=1;VCACHE={};vsave();}
vload();

function desOpts(br,sel){var T=VL.TYPES[br],h='';Object.keys(T).forEach(function(t){var it=VD.des.filter(function(d){return d.br===br&&d.ty===t;});if(!it.length)return;
  h+='<optgroup label="'+T[t]+'">'+it.map(function(d){return '<option value="'+esc(d.id)+'"'+(d.id===sel?' selected':'')+'>'+esc(d.n)+(d._u?' ✎':'')+'</option>';}).join('')+'</optgroup>';});return h;}
var VSUB={l:[['spec','諸元'],['perf','重量與機動'],['prot','防護與生存力'],['fire','火力'],['duel','對戰模擬'],['cost','造價']],
  a:[['spec','諸元'],['perf','重量與性能'],['load','掛載與任務'],['sens','感測與電戰'],['cost','造價']],
  s:[['spec','諸元'],['perf','重量與航行'],['wpn','武器與防空'],['air','艦載機'],['cost','艦隊與造價']]};
var VTHR=[['t120dm53',2000],['t125m60',2000],['a30fs',1000],['h145b32',500],['rpg7vl',200],['rpg7vr',200],['kornet',3000],['javelin',2000],['m_downfall',8000]];

RENDER.veh={init:function(){var E=pane('veh');E.innerHTML=
  '<div class="lt-info">模組化載具設計：每款載具由底盤／機體／艦體、動力、武器、感測、電戰、防護與升級套件等模組組成；換模組、加套件或改裝甲，重量、機動、防護、火力與造價會一起重算。內建設計以大商帝國的「刑天」零三式主戰戰車、「貓將軍」艦載戰鬥機、零型「時代」飛彈驅逐巡洋艦與九十型「東洋」核動力航空母艦為基礎，並附各軍種範本。裝甲沿用本工具的穿甲模型，武器沿用彈藥庫，金額依選擇的幣種顯示。載具圖依「刑天」「響箭」原圖的平塗像素畫風繪製，車體、砲塔、砲管等外觀模組可替換，並可下載 PNG。</div>'+
  '<div class="row"><label>軍種 <select data-k="vBr">'+opts(Object.keys(VL.BR).map(function(k){return [k,VL.BR[k]];}),VS.br)+'</select></label><label>設計 <select data-k="vId"></select></label>'+
  '<button type="button" data-k="vDup">複製為新設計</button><button type="button" data-k="vDel">刪除／還原</button><button type="button" data-k="vExp">匯出此設計（JSON）</button><button type="button" data-k="vImp">匯入設計</button><input type="file" data-k="vImpF" accept=".json,application/json" style="display:none"></div>'+
  '<details class="lt-grp" data-k="vHeadG"><summary>基本資料（名稱、型號、國籍、研發單位、年份、簡介）</summary><div data-k="vHead"></div></details>'+
  '<div data-k="vOpts"></div><div class="lt-art" data-k="vArtBox"><canvas data-k="vArtCv"></canvas></div><canvas class="lt-chart" data-k="vCv" style="height:230px"></canvas>'+
  '<div class="row lt-artbar"><span class="lt-seg"><button type="button" data-k="vViewA">美術圖</button><button type="button" data-k="vViewS">尺寸示意圖</button></span><button type="button" data-k="vPng1">下載 PNG</button><button type="button" data-k="vPng2">下載 PNG（2 倍）</button></div>'+
  '<div class="lt-note" data-k="vCvN"></div>'+
  '<details class="lt-grp" data-k="vArtG"'+(VS.artOpen===false?'':' open')+'><summary data-k="vArtSum">外觀模組（車體、行走機構、砲塔、砲管、觀瞄、塗裝、附件與標誌）</summary><div data-k="vArt"></div></details>'+
  '<details class="lt-grp" open><summary>模組（點選數量可修改；套件與選項帶入的模組以灰字標示）</summary><div data-k="vMods"></div></details>'+
  '<div data-k="vEdit"></div><div class="lt-res" data-k="vWarn" style="display:none"></div>'+
  '<div class="lt-tabs lt-sub" data-k="vSub"></div><div data-k="vOut"></div>';
  q('vBr').onchange=function(){VS.br=this.value;var first=VD.des.filter(function(d){return d.br===VS.br;})[0];VS.id=first?first.id:VS.id;vsave();RENDER.veh.init();RENDER.veh.run();};
  q('vId').onchange=function(){VS.id=this.value;vsave();RENDER.veh.run();};
  q('vDup').onclick=function(){var d=A.cloneObj(vdes(VS.id));d.id='uv'+Date.now().toString(36);d.n=d.n+'（自訂）';d._u=1;delete d.series;VD.des.push(d);VS.id=d.id;vtouch(d);RENDER.veh.run();};
  q('vDel').onclick=function(){var i=idxOf(VD.des,VS.id);if(i<0)return;if(VBASE[VS.id]){VD.des[i]=A.cloneObj(VL.find(VL.DES,VS.id));}else{VD.des.splice(i,1);VS.id=VD.des.filter(function(d){return d.br===VS.br;})[0].id;}VCACHE={};vsave();RENDER.veh.run();};
  q('vExp').onclick=function(){var d=vdes(VS.id),mods=[];vEff(d).list.forEach(function(e){if(e.m._u&&mods.indexOf(e.m)<0)mods.push(e.m);});dl('lato-vehicle-'+d.id+'.json',new Blob([JSON.stringify({format:'LatoVehicle',v:1,design:d,mods:mods},null,1)],{type:'application/json'}));};
  q('vImp').onclick=function(){q('vImpF').click();};
  q('vImpF').onchange=function(){var f=this.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(){try{var x=JSON.parse(rd.result),list=x.designs||(x.design?[x.design]:[]);(x.mods||[]).forEach(function(m){m._u=1;var i=idxOf(VD.mods,m.id);if(i>=0)VD.mods[i]=m;else VD.mods.push(m);});
      list.forEach(function(d){d._u=1;var i=idxOf(VD.des,d.id);if(i>=0)VD.des[i]=d;else VD.des.push(d);});if(list[0]){VS.br=list[0].br;VS.id=list[0].id;}VCACHE={};vsave();RENDER.veh.init();RENDER.veh.run();}catch(e){err(e);}};rd.readAsText(f);};
  q('vSub').onclick=function(e){var b=e.target.closest('button[data-sub]');if(!b)return;VS.sub[VS.br]=b.getAttribute('data-sub');vOut();};
  q('vViewA').onclick=function(){VS.view='art';vsave();vDraw(vdes(VS.id),VR);};q('vViewS').onclick=function(){VS.view='sch';vsave();vDraw(vdes(VS.id),VR);};
  q('vPng1').onclick=function(){artDownload(vdes(VS.id),1);};q('vPng2').onclick=function(){artDownload(vdes(VS.id),2);};
  q('vArtG').addEventListener('toggle',function(){VS.artOpen=this.open;vsave();if(this.open)vArtUI(vdes(VS.id),VR);});},
 run:function(){var d=vdes(VS.id);if(d.br!==VS.br){VS.br=d.br;q('vBr').value=VS.br;}q('vId').innerHTML=desOpts(VS.br,VS.id);
  vHead(d);vOptsUI(d);vModsUI(d);vEditUI(d);vRecalc();}};
function vEff(d){return VL.effMods(d,vctx());}
function firstIdx(a,id){for(var i=0;i<a.length;i++)if(a[i][0]===id)return i;return -1;}
var VR=null;
function vRecalc(){var d=vdes(VS.id);VR=VL.calc(d,vctx(),{profile:VS.prof,cruise:VS.cruise});var w=q('vWarn');
  if(VR.err||VR.warn.length){w.style.display='';w.className='lt-res warn';w.innerHTML=esc(VR.err||VR.warn.join('；'));}else w.style.display='none';
  vDraw(d,VR);if(!VR.err)vOut();if(q('vArtG').open)vArtUI(d,VR);}

/* ---------- header and options ---------- */
function vHead(d){var F=[['n','名稱','text'],['code','型號／編號','text'],['nat','國籍','text'],['mk','研發單位','text'],['yr','服役年份','num'],['ty','類型','sel',function(){var T=VL.TYPES[d.br];return Object.keys(T).map(function(k){return [k,T[k]];});}],['qty','預定產量（造價學習曲線）','num'],['lc','學習曲線（每倍產量的單價比率）','num']];
  q('vHead').innerHTML=fieldHtml(d,F)+'<label class="lt-note">簡介</label><textarea data-k="vDesc" rows="4" style="width:100%;box-sizing:border-box;font-size:12.5px">'+esc(d.desc||'')+'</textarea><div class="row"><button type="button" class="lt-pri" data-k="vHeadOk">套用</button></div>';
  q('vHeadOk').onclick=function(){readFields(q('vHead'),d,F);d.desc=q('vDesc').value;vtouch(d);RENDER.veh.run();};}
function vOptsUI(d){var h='';if(d.opts&&d.opts.length){h+='<div class="row lt-vopt">'+d.opts.map(function(g){var ch=VL.choice(d,g);return '<label>'+esc(g.n)+' <select data-og="'+g.k+'">'+g.ch.map(function(c){return '<option value="'+esc(c.v)+'"'+(c===ch?' selected':'')+'>'+esc(c.n)+'</option>';}).join('')+'</select></label>';}).join('')+'</div>';}
  if(d.canon&&d.canon.mass)h+='<div class="row"><span class="lt-note">官方配置快選：</span>'+d.canon.mass.map(function(cm,i){return '<button type="button" data-canon="'+i+'">'+esc(cm[0])+'</button>';}).join('')+'</div>';
  var box=q('vOpts');box.innerHTML=h;
  box.onchange=function(e){var k=e.target.getAttribute('data-og');if(!k)return;d.sel=d.sel||{};d.sel[k]=e.target.value;vtouch(d);vModsUI(d);vEditUI(d);vRecalc();};
  box.onclick=function(e){var b=e.target.closest('[data-canon]');if(!b)return;var cm=d.canon.mass[+b.getAttribute('data-canon')];d.sel=d.sel||{};d.sel.osu=cm[1].osu||'';d.sel.ea=cm[1].ea||'';vtouch(d);vOptsUI(d);vModsUI(d);vEditUI(d);vRecalc();};}

/* ---------- module list ---------- */
var VPF={eng:[['hp','馬力','num'],['eta','熱效率','num']],tr:[['eff','傳動效率','num'],['gov','限速 km/h','num']],fuel:[['L','容量 L','num']],gun:[['cal','口徑 mm','num'],['lc','倍徑','num'],['rof','射速 發/分','num'],['stow','儲彈量','num']],
  al:[['rof','射速 發/分','num'],['car','彈艙容量','num']],fcs:[['sig','散布 mil','num'],['rt','反應時間 s','num'],['th','熱像距離 km','num']],sen:[['th','熱像距離 km','num'],['rt','反應時間增減 s','num']],c4i:[['sa','戰場感知等級','num']],
  ew:[['jam','干擾強度 0–1','num'],['ied','反遙控炸彈 0–1','num'],['esm','電子支援距離 km','num']],aps:[['pR','攔截火箭彈機率','num'],['pM','攔截飛彈機率','num'],['pK','攔截動能彈機率','num'],['arc','防護弧 °','num'],['top','可防頂部攻擊','chk']],
  aeng:[['dry','軍用推力 kN','num'],['wet','後燃推力 kN','num'],['sfcD','耗油率 kg/daN·h','num'],['kw','軸功率 kW','num'],['sfc','耗油率 kg/kWh','num']],rad:[['rr','偵測距離 km（1 m²）','num'],['ch','射控通道','num'],['ill','照射器','num']],
  pw:[['mw','功率 MW','num'],['sfc','耗油率 kg/kWh','num']],vls:[['cells','發射單元','num']],lnch:[['cells','發射單元','num']],ciws:[['pk','單次攔截機率','num'],['r','射程 km','num'],['cyc','每目標秒數','num']],son:[['sr','偵測距離 km','num']]};
function vModsUI(d){var em=vEff(d),c=vctx(),slots=VL.SLOTS[d.br],rows='';
  slots.forEach(function(sl){var it=em.list.filter(function(e){return e.m.sl===sl;});if(!it.length)return;rows+='<tr class="lt-grph"><td colspan="6" class="l">'+esc(VL.SLOT[sl]||sl)+'</td></tr>';
    it.forEach(function(e){var base=!e.src,bi=base?firstIdx(d.mods,e.m.id):-1,kg=(e.m.kg||0)*e.n+(e.m.sl==='fuel'?(e.m.L||0)*0.84*e.n:0);
      rows+='<tr'+(base?'':' class="lt-dim"')+'><td class="l">'+esc(e.m.n)+(e.m.by?'<span class="lt-pill">'+esc(e.m.by)+'</span>':'')+(e.m.st?'<span class="lt-pill lt-pw">'+esc(e.m.st)+'</span>':'')+(e.m._u?'<span class="lt-pill">自訂</span>':'')+'</td>'+
       '<td>'+(base&&bi>=0?'<input type="number" min="0" step="1" data-mi="'+bi+'" value="'+e.n+'" style="width:56px">':'×'+e.n)+'</td><td>'+(kg?fx(kg,0)+' kg':'—')+'</td><td>'+(e.m.dy?cnD((e.m.dy||0)*e.n):'—')+'</td><td class="l lt-note">'+esc(e.src||'')+'</td>'+
       '<td>'+(base&&bi>=0?'<button type="button" data-mdel="'+bi+'" title="移除">✕</button>':'')+'</td></tr>';});});
  var addSl=slots.map(function(s){return [s,VL.SLOT[s]||s];});
  q('vMods').innerHTML='<div class="lt-sc"><table class="lt-dt lt-vm"><tr><th class="l">模組</th><th>數量</th><th>重量</th><th>造價（'+esc(curN())+'）</th><th class="l">來源</th><th></th></tr>'+rows+'</table></div>'+
   '<div class="row"><label>新增 <select data-k="vAddSl">'+opts(addSl,VS.addSl||slots[0])+'</select></label><select data-k="vAddM"></select><input type="number" data-k="vAddN" value="1" min="1" style="width:56px"><button type="button" data-k="vAddB">加入</button>'+
   '<button type="button" data-k="vNewM">自訂新模組</button></div><div data-k="vNewF"></div>';
  function fillM(){var sl=q('vAddSl').value;VS.addSl=sl;q('vAddM').innerHTML=VD.mods.filter(function(m){return m.br===d.br&&m.sl===sl;}).map(function(m){return '<option value="'+esc(m.id)+'">'+esc(m.n)+(m.st?'（'+m.st+'）':'')+'</option>';}).join('');}
  fillM();q('vAddSl').onchange=fillM;
  q('vAddB').onclick=function(){var id=q('vAddM').value;if(!id)return;var n=Math.max(1,+q('vAddN').value||1),r=d.mods.filter(function(x){return x[0]===id;})[0];if(r)r[1]=(+r[1]||0)+n;else d.mods.push([id,n]);vtouch(d);vModsUI(d);vEditUI(d);vRecalc();};
  q('vMods').onchange=function(e){var i=e.target.getAttribute('data-mi');if(i===null)return;var n=Math.max(0,+e.target.value||0);if(n===0)d.mods.splice(+i,1);else d.mods[+i][1]=n;vtouch(d);vModsUI(d);vEditUI(d);vRecalc();};
  q('vMods').onclick=function(e){var b=e.target.closest('[data-mdel]');if(b){d.mods.splice(+b.getAttribute('data-mdel'),1);vtouch(d);vModsUI(d);vEditUI(d);vRecalc();return;}
    if(e.target.getAttribute('data-k')==='vNewM'){var sl=q('vAddSl').value,F=[['n','名稱','text'],['by','製造商','text'],['kg','重量 kg','num'],['dy','造價（東銀圓）','num'],['crew','乘員增減','num'],['pw','耗電 kW','num'],['note','說明','text']].concat(VPF[sl]||[]);
      var m={id:'um'+Date.now().toString(36),br:d.br,sl:sl,n:'新'+(VL.SLOT[sl]||'模組'),kg:100,dy:100000};
      q('vNewF').innerHTML='<div class="lt-card">'+fieldHtml(m,F)+'<div class="row"><button type="button" class="lt-pri" data-k="vNewOk">建立並加入</button><span class="lt-note">欄位：'+esc(VL.SLOT[sl]||sl)+'。建立後可在其他設計中重複使用。</span></div></div>';
      q('vNewOk').onclick=function(){readFields(q('vNewF'),m,F);m._u=1;if(m.sl==='aps'){m.arc=m.arc||60;}VD.mods.push(m);d.mods.push([m.id,1]);vtouch(d);vModsUI(d);vEditUI(d);vRecalc();};}};}

/* ---------- branch editors: armour zones and gun ammunition / stores / ship loads and air wing ---------- */
function vEditUI(d){var box=q('vEdit'),c=vctx();
  if(d.br==='l'){var em=vEff(d),za=em.za,src=za&&d.zalt&&d.zalt[za]?d.zalt[za]:(d.zones=d.zones||{}),Z=VL.effZones(d,em),gun=null;em.list.forEach(function(e){if(e.m.sl==='gun'&&!gun)gun=e.m;});
    var zs=VL.ZORD.filter(function(z){var ch=null;em.list.forEach(function(e){if(e.m.sl==='ch'&&!ch)ch=e.m;});return ch&&ch.area&&ch.area[z];});if(zs.indexOf(VS.zone)<0)VS.zone=zs[0];
    var kitL=(Z[VS.zone]||[]).filter(function(I){return I.k.length;}).map(function(I){return '<div class="lt-note">　'+fx(I.a*100,0)+'–'+fx(I.b*100,0)+'%：'+esc(I.k.join('、'))+'</div>';}).join('');
    box.innerHTML='<details class="lt-grp" open><summary>裝甲區域'+(za?'（目前編輯：'+esc(za)+' 輕量版主裝甲）':'')+'</summary><div class="row">'+zs.map(function(z){return '<button type="button" data-zone="'+z+'"'+(z===VS.zone?' class="on"':'')+'>'+VL.ZN[z]+'</button>';}).join('')+'</div>'+
      '<div data-k="vZone"></div>'+(kitL?'<div class="lt-note">套件在此區額外加裝（由外而內加在上表之前）：</div>'+kitL:'')+'</details>'+
      (gun?'<details class="lt-grp"><summary>主武器彈藥（'+esc(gun.n)+'，儲彈 '+gun.stow+' 發）</summary><div data-k="vAmmo"></div></details>':'');
    box.querySelectorAll('[data-zone]').forEach(function(b){b.onclick=function(){VS.zone=b.getAttribute('data-zone');vEditUI(d);};});
    if(!src[VS.zone])src[VS.zone]=[];
    layerEditor(q('vZone'),function(){return src[VS.zone].map(function(l){return {mat:l[0],t:l[1],ang:l[2]||0,gap:l[3]||0};});},function(L){src[VS.zone]=L.map(function(l){return [l.mat,+l.t||0,+l.ang||0,+l.gap||0];});},function(){vtouch(d);vRecalc();});
    if(gun){d.ammo=d.ammo||{};if(!d.ammo[gun.id])d.ammo[gun.id]=[];var am=d.ammo[gun.id],comp=S.proj.filter(function(P){return Math.abs((P.d||0)-gun.cal)<0.6&&!P.rifled&&(P.g==='tank'||P.g==='auto'||P.g==='art'||P.gl);});
      q('vAmmo').innerHTML='<div class="lt-sc"><table class="lt-dt"><tr><th class="l">彈種</th><th>數量</th><th></th></tr>'+am.map(function(a,i){return '<tr><td class="l"><select data-ai="'+i+'">'+comp.map(function(P){return '<option value="'+esc(P.id)+'"'+(P.id===a[0]?' selected':'')+'>'+esc(P.n)+'</option>';}).join('')+'</select></td><td><input type="number" min="0" data-an="'+i+'" value="'+a[1]+'" style="width:64px"></td><td><button type="button" data-ad="'+i+'">✕</button></td></tr>';}).join('')+'</table></div>'+
        '<div class="row"><button type="button" data-k="vAmAdd">新增彈種</button><span class="lt-note">裝上 OSU.i 等含「砲射導彈」的套件時，會自動以 4 枚砲射導彈替換部分反坦克高爆彈。</span></div>';
      q('vAmmo').onchange=function(e){var i=e.target.getAttribute('data-ai'),j=e.target.getAttribute('data-an');if(i!==null)am[+i][0]=e.target.value;if(j!==null)am[+j][1]=Math.max(0,+e.target.value||0);vtouch(d);vRecalc();};
      q('vAmmo').onclick=function(e){var b=e.target.closest('[data-ad]');if(b){am.splice(+b.getAttribute('data-ad'),1);vtouch(d);vEditUI(d);vRecalc();}if(e.target.getAttribute('data-k')==='vAmAdd'&&comp.length){am.push([comp[0].id,4]);vtouch(d);vEditUI(d);vRecalc();}};}
    return;}
  if(d.br==='a'){var em2=vEff(d),af=null;em2.list.forEach(function(e){if(e.m.sl==='af'&&!af)af=e.m;});var stn=af&&af.hp?af.hp.split(','):[];d.st=d.st||[];
    var munA=munAll().filter(function(m){return m.pl.indexOf('a')>=0;});
    box.innerHTML=stn.length?'<details class="lt-grp" open><summary>外掛（'+stn.length+' 個掛載點）</summary><div class="lt-sc"><table class="lt-dt"><tr><th>#</th><th class="l">掛點</th><th class="l">掛載</th><th>數量</th><th>重量</th></tr>'+
      stn.map(function(s,i){var e=d.st[i],ok=munA.filter(function(m){return VL.stationOK(m,s);});var mu=e&&e[0]?vmun(e[0]):null,rack=s==='hbay'?60:(mu&&mu.per?1:1);
        return '<tr><td>'+(i+1)+'</td><td class="l">'+esc(VL.STN[s]||s)+'</td><td class="l">'+(s==='esm'?'<span class="lt-note">（固定的電子支援莢艙）</span>':'<select data-si="'+i+'"><option value="">（空）</option>'+ok.map(function(m){return '<option value="'+m.id+'"'+(mu&&mu.id===m.id?' selected':'')+'>'+esc(m.n)+'</option>';}).join('')+'</select>')+'</td>'+
          '<td>'+(s==='hbay'||s==='bay'?'<input type="number" min="1" max="'+rack+'" data-sn="'+i+'" value="'+(e&&e[1]||1)+'" style="width:56px">':(mu&&mu.per?'×'+mu.per+'（掛架）':'1'))+'</td><td>'+(mu?fx(mu.kg*(e[1]||1),0)+' kg':'')+'</td></tr>';}).join('')+'</table></div>'+
      '<div class="row"><label>任務剖面 <select data-k="vProf">'+opts([['hhh','高－高－高'],['hlh','高－低－高（末段 150 km 低空）'],['lll','全程低空']],VS.prof)+'</select></label><button type="button" data-k="vStClr">清空外掛</button></div></details>':'';
    if(!stn.length)return;box.onchange=function(e){var i=e.target.getAttribute('data-si'),j=e.target.getAttribute('data-sn');if(i!==null){d.st[+i]=e.target.value?[e.target.value,1]:null;}if(j!==null&&d.st[+j])d.st[+j][1]=Math.max(1,+e.target.value||1);
      if(e.target.getAttribute('data-k')==='vProf'){VS.prof=e.target.value;vsave();vRecalc();return;}vtouch(d);vEditUI(d);vRecalc();};
    box.onclick=function(e){if(e.target.getAttribute('data-k')==='vStClr'){d.st=stn.map(function(){return null;});vtouch(d);vEditUI(d);vRecalc();}};return;}
  /* sea */
  var munS=munAll().filter(function(m){return m.pl.indexOf('s')>=0;});d.vls=d.vls||[];d.lnch=d.lnch||[];d.wing=d.wing||[];
  function loadT(key,title,list,filt){return '<div class="lt-note"><b>'+title+'</b></div><div class="lt-sc"><table class="lt-dt"><tr><th class="l">彈種</th><th>數量</th><th></th></tr>'+list.map(function(a,i){return '<tr><td class="l"><select data-lk="'+key+'" data-li="'+i+'">'+munS.filter(filt).map(function(m){return '<option value="'+m.id+'"'+(m.id===a[0]?' selected':'')+'>'+esc(m.n)+'</option>';}).join('')+'</select></td><td><input type="number" min="0" data-lk="'+key+'" data-ln="'+i+'" value="'+a[1]+'" style="width:64px"></td><td><button type="button" data-lk="'+key+'" data-ld="'+i+'">✕</button></td></tr>';}).join('')+
    '</table></div><div class="row"><button type="button" data-ladd="'+key+'">新增</button></div>';}
  var airD=VD.des.filter(function(x){return x.br==='a';});
  box.innerHTML='<details class="lt-grp" open><summary>燃料、補給與彈藥裝填</summary><div class="row"><label>燃油 <input type="number" data-sf="fuel" value="'+(d.fuel||0)+'" style="width:80px"> 噸</label><label>航空燃油 <input type="number" data-sf="jp5" value="'+(d.jp5||0)+'" style="width:80px"> 噸</label>'+
    '<label>液體壓艙 <input type="number" data-sf="ballast" value="'+(d.ballast||0)+'" style="width:80px"> 噸</label><label>補給 <input type="number" data-sf="endur" value="'+(d.endur||30)+'" style="width:56px"> 日</label><label>巡航 <input type="number" data-k="vCruise" value="'+VS.cruise+'" style="width:56px"> 節</label></div>'+
    loadT('vls','垂直發射單元裝填',d.vls,function(m){return m.t!=='aam'||m.id==='sota6';})+loadT('lnch','飛彈架／發射箱裝填',d.lnch,function(){return true;})+(d.tubes?loadT('tubes','魚雷管裝填',d.tubes,function(m){return m.t==='torp'||m.t==='ashm';}):'')+'</details>'+
    '<details class="lt-grp"><summary>艦載機</summary><div class="lt-sc"><table class="lt-dt"><tr><th class="l">機型</th><th>架數</th><th></th></tr>'+d.wing.map(function(w,i){return '<tr><td class="l"><select data-wi="'+i+'">'+airD.map(function(x){return '<option value="'+esc(x.id)+'"'+(x.id===w[0]?' selected':'')+'>'+esc(x.n)+'</option>';}).join('')+'</select></td><td><input type="number" min="0" data-wn="'+i+'" value="'+w[1]+'" style="width:56px"></td><td><button type="button" data-wd="'+i+'">✕</button></td></tr>';}).join('')+
    '</table></div><div class="row"><button type="button" data-k="vWAdd">新增機型</button></div></details>';
  box.onchange=function(e){var t=e.target,k=t.getAttribute('data-lk');if(t.getAttribute('data-sf')){d[t.getAttribute('data-sf')]=Math.max(0,+t.value||0);}
    else if(t.getAttribute('data-k')==='vCruise'){VS.cruise=Math.max(4,+t.value||18);vsave();vRecalc();return;}
    else if(k){var L=d[k];if(t.hasAttribute('data-li'))L[+t.getAttribute('data-li')][0]=t.value;if(t.hasAttribute('data-ln'))L[+t.getAttribute('data-ln')][1]=Math.max(0,+t.value||0);}
    else if(t.hasAttribute('data-wi'))d.wing[+t.getAttribute('data-wi')][0]=t.value;else if(t.hasAttribute('data-wn'))d.wing[+t.getAttribute('data-wn')][1]=Math.max(0,+t.value||0);else return;vtouch(d);vRecalc();};
  box.onclick=function(e){var t=e.target,k=t.getAttribute('data-lk');if(t.hasAttribute('data-ld')){d[k].splice(+t.getAttribute('data-ld'),1);}else if(t.hasAttribute('data-ladd')){var key=t.getAttribute('data-ladd');d[key]=d[key]||[];d[key].push([key==='tubes'?'hwt':'lona2',4]);}
    else if(t.hasAttribute('data-wd'))d.wing.splice(+t.getAttribute('data-wd'),1);else if(t.getAttribute('data-k')==='vWAdd')d.wing.push([airD[0].id,2]);else return;vtouch(d);vEditUI(d);vRecalc();};}

/* ---------- schematic drawings ---------- */
function vDraw(d,R){var c=q('vCv'),ok=artOk(d),art=VS.view!=='sch'&&ok&&!R.err;q('vArtBox').style.display=art?'':'none';c.style.display=art?'none':'';
  q('vPng1').style.display=q('vPng2').style.display=art?'':'none';q('vViewA').className=art?'on':'';q('vViewS').className=art?'':'on';q('vViewA').disabled=!ok;q('vArtG').style.display=ok?'':'none';
  if(art){vArtDraw(d,R);q('vCvN').textContent='依原圖畫風（平塗、黑色描邊、像素邊緣）繪製：車長、負重輪數、主砲口徑與倍徑、升級套件與主動防禦依設計模組自動畫出；車體、砲塔、砲管等外觀可在下方「外觀模組」替換，並可下載 PNG。';return;}
  if(R.err){cvs(c,10);return;}if(d.br==='l')drawLand(c,d,R);else if(d.br==='a')drawAir(c,d,R);else drawSea(c,d,R);}
/* top captions: dimensions on the left, designation and weight on the right; on a narrow canvas the left one drops to a second line */
function capTwo(g,C,lt,rt,lx){g.font='bold 12px system-ui,sans-serif';var rw=g.measureText(rt).width;g.font='11px system-ui,sans-serif';return lx+g.measureText(lt).width+12>C.w-8-rw;}
function capDraw(g,C,lt,rt,lx){var two=capTwo(g,C,lt,rt,lx);g.font='11px system-ui,sans-serif';g.fillStyle='#37474F';g.textAlign='left';g.fillText(lt,lx,two?31:16);
  g.textAlign='right';g.font='bold 12px system-ui,sans-serif';g.fillStyle='#263238';g.fillText(rt,C.w-8,16);g.font='11px system-ui,sans-serif';}
function dimLine(g,x1,y1,x2,y2,t){g.strokeStyle='#90A4AE';g.fillStyle='#546E7A';g.lineWidth=1;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();g.textAlign='center';g.fillText(t,(x1+x2)/2,(y1+y2)/2-3);}
function drawLand(c,d,R){var C=cvs(c,230),g=C.g,ch=R.ch,gun=R.gun,L=ch.L,H=ch.H,gunL=gun?gun.cal*gun.lc/1000:0,over=Math.max(0,gunL-L*0.45),sc=Math.min((C.w-60)/(L+over),125/H),x0=30,base=200,hh=H*sc;
  g.fillStyle='#fafafa';g.fillRect(0,0,C.w,C.h);g.font='11px system-ui,sans-serif';
  var hullH=(ch.turret?0.6:0.85)*hh,hullL=L*sc,trk=ch.kind==='tr';
  /* running gear */
  if(trk){g.fillStyle='#455A64';g.beginPath();g.moveTo(x0+8,base);g.lineTo(x0+hullL-8,base);g.quadraticCurveTo(x0+hullL+6,base-14,x0+hullL-4,base-28);g.lineTo(x0+10,base-28);g.quadraticCurveTo(x0-6,base-16,x0+8,base);g.fill();
    var n=ch.nw,r=Math.min(13,hullL/(n*2.4));for(var i=0;i<n;i++){var wx=x0+hullL*0.14+i*(hullL*0.72)/(n-1);g.fillStyle='#263238';g.beginPath();g.arc(wx,base-r-2,r,0,2*PI);g.fill();g.fillStyle='#78909C';g.beginPath();g.arc(wx,base-r-2,r*0.45,0,2*PI);g.fill();}}
  else{var nw=ch.nw/2,r2=Math.min(18,hullL/(nw*3.2));for(var j=0;j<nw;j++){var wx2=x0+hullL*0.15+j*(hullL*0.7)/Math.max(1,nw-1);g.fillStyle='#263238';g.beginPath();g.arc(wx2,base-r2,r2,0,2*PI);g.fill();g.fillStyle='#90A4AE';g.beginPath();g.arc(wx2,base-r2,r2*0.5,0,2*PI);g.fill();}}
  /* hull with sloped glacis toward the front (right) */
  var hy=base-(trk?24:22),ty=hy-hullH;g.fillStyle='#6B7B5A';g.strokeStyle='#3E4A33';g.beginPath();g.moveTo(x0,hy);g.lineTo(x0,ty+4);g.lineTo(x0+hullL*0.78,ty);g.lineTo(x0+hullL,hy-hullH*0.35);g.lineTo(x0+hullL*0.98,hy);g.closePath();g.fill();g.stroke();
  var Z=R.zones,hasKit=function(z,name){return (Z[z]||[]).some(function(I){return I.k.some(function(k){return k.indexOf(name)>=0;});});};
  if(hasKit('hs','反應裝甲')){g.fillStyle='#8D6E63';for(var k=0;k<6;k++)g.fillRect(x0+hullL*(0.42+k*0.08),hy-hullH*0.55,hullL*0.07,hullH*0.42);}
  if(hasKit('hs','柵欄')||hasKit('rr','柵欄')){g.strokeStyle='#546E7A';g.lineWidth=1.5;for(var s=0;s<7;s++){var sx=x0-8+s*hullL*0.055;g.beginPath();g.moveTo(sx,hy-2);g.lineTo(sx,ty+2);g.stroke();}g.beginPath();g.moveTo(x0-8,ty+4);g.lineTo(x0+hullL*0.36,ty+4);g.moveTo(x0-8,hy-hullH*0.5);g.lineTo(x0+hullL*0.36,hy-hullH*0.5);g.stroke();g.lineWidth=1;}
  /* turret and gun */
  if(ch.turret){var tL=L*0.5*sc,tx=x0+hullL*0.3,tH=hh*0.33,tY=ty-tH;g.fillStyle='#7C8B68';g.strokeStyle='#3E4A33';g.beginPath();g.moveTo(tx,ty);g.lineTo(tx+tL*0.06,tY+4);g.lineTo(tx+tL*0.8,tY);g.lineTo(tx+tL,ty-tH*0.35);g.lineTo(tx+tL*0.95,ty);g.closePath();g.fill();g.stroke();
    if(hasKit('tf','反應裝甲')){g.fillStyle='#8D6E63';g.beginPath();g.moveTo(tx+tL*0.86,tY+2);g.lineTo(tx+tL*1.05,ty-tH*0.4);g.lineTo(tx+tL*0.98,ty-2);g.lineTo(tx+tL*0.9,ty-2);g.closePath();g.fill();}
    if(hasKit('tf','額外複合')){g.fillStyle='#5D6B4C';g.fillRect(tx+tL*0.92,tY+4,tL*0.06,tH*0.6);}
    if(gun){var gy=tY+tH*0.45,gx=tx+tL*0.9,gl=gunL*sc;g.fillStyle='#37474F';g.fillRect(gx,gy-Math.max(2,gun.cal/1000*sc*0.6),gl,Math.max(3,gun.cal/1000*sc*1.2));g.fillRect(gx+gl*0.55,gy-4,gl*0.12,8);
      if(R.al){g.fillStyle='#5D6B4C';g.fillRect(tx-tL*0.12,tY+tH*0.15,tL*0.14,tH*0.7);}}
    if(R.aps.length){g.fillStyle='#1565C0';g.fillRect(tx+tL*0.62,tY-7,10,7);g.fillRect(tx+tL*0.2,tY-7,10,7);}
    if(R.secs.some(function(s){return s.m.sl==='rws';})){g.fillStyle='#455A64';g.fillRect(tx+tL*0.35,tY-12,16,8);g.fillRect(tx+tL*0.35+14,tY-10,14,2);}
    if(R.ews.some(function(e){return e.esm;})){g.strokeStyle='#6A1B9A';g.beginPath();g.moveTo(tx+tL*0.1,tY);g.lineTo(tx+tL*0.06,tY-34);g.stroke();}
    if(R.rads.length){g.fillStyle='#6D4C41';g.fillRect(tx+tL*0.25,tY-22,tL*0.25,6);g.fillRect(tx+tL*0.36,tY-16,3,16);}
    R.msls.forEach(function(m,i){g.fillStyle='#455A64';g.fillRect(tx-tL*0.05+i*tL*0.5,tY+tH*0.1,tL*0.18,tH*0.5);});}
  else if(R.secs.length){g.fillStyle='#455A64';g.fillRect(x0+hullL*0.55,ty-10,16,8);}
  g.fillStyle='#37474F';dimLine(g,x0,base+12,x0+hullL,base+12,'車長 '+fx(L,1)+' m');if(gun&&ch.turret)dimLine(g,x0+hullL,base+12,x0+hullL+Math.max(0,(x0+L*0.3*sc+L*0.5*sc*0.9+gunL*sc)-(x0+hullL)),base+12,'砲管伸出');
  capDraw(g,C,'全高 '+fx(H,2)+' m・寬 '+fx(ch.W,2)+' m・'+(trk?ch.nw+' 對負重輪':ch.nw+' 輪'),VL.designation(d)+'　'+fx(R.mass/1000,1)+' 噸',x0);
  q('vCvN').textContent='側視示意圖（依車長、車高、主砲口徑與倍徑等比例繪製；反應裝甲、柵欄、主動防禦、遙控武器站等套件會顯示在圖上）。';}
function drawAir(c,d,R){var C=cvs(c,230),g=C.g,af=R.af,ctr=C.w/2,rot=af.kind==='rot',lt=rot?'旋翼直徑 '+fx(af.D,1)+' m・機長 '+fx(af.l,1)+' m':'翼展 '+fx(af.b,1)+' m・機長 '+fx(af.l,1)+' m・翼面積 '+fx(af.S,1)+' m²',
    rt=d.code+'　起飛 '+fx(R.W0/1000,1)+' 噸',two=capTwo(g,C,lt,rt,10),top=two?38:18;g.fillStyle='#fafafa';g.fillRect(0,0,C.w,C.h);g.font='11px system-ui,sans-serif';
  if(rot){var cy=two?128:118,rr=Math.min(95,(C.w-60)/2,cy-top),sc=rr/(af.D/2);g.strokeStyle='rgba(84,110,122,.5)';g.beginPath();g.arc(ctr,cy,rr,0,2*PI);g.stroke();g.fillStyle='#607D8B';var len=af.l*sc;
    g.beginPath();g.ellipse(ctr,cy,len*0.17,len*0.07,0,0,2*PI);g.fill();g.fillRect(ctr+len*0.1,cy-2,len*0.45,4);g.beginPath();g.arc(ctr+len*0.55,cy,10,0,2*PI);g.stroke();
    g.strokeStyle='#37474F';g.lineWidth=3;for(var b=0;b<4;b++){var a=b*PI/2+0.3;g.beginPath();g.moveTo(ctr,cy);g.lineTo(ctr+Math.cos(a)*rr,cy+Math.sin(a)*rr);g.stroke();}g.lineWidth=1;
}
  else{var sc2=Math.min((C.h-top-22)/af.l,(C.w-40)/af.b),L2=af.l*sc2,B2=af.b*sc2,nose=top,tail=top+L2,wingY=top+L2*0.52,root=L2*0.32,tip=L2*0.12,sweep=L2*0.18;
    g.fillStyle='#78909C';g.strokeStyle='#455A64';g.beginPath();g.moveTo(ctr,nose);g.quadraticCurveTo(ctr+L2*0.05,nose+L2*0.15,ctr+L2*0.05,nose+L2*0.35);g.lineTo(ctr+L2*0.05,tail-6);g.lineTo(ctr-L2*0.05,tail-6);g.lineTo(ctr-L2*0.05,nose+L2*0.35);g.quadraticCurveTo(ctr-L2*0.05,nose+L2*0.15,ctr,nose);g.fill();g.stroke();
    [1,-1].forEach(function(sd){g.fillStyle='#90A4AE';g.beginPath();g.moveTo(ctr+sd*L2*0.05,wingY-root*0.5);g.lineTo(ctr+sd*B2/2,wingY+sweep-tip*0.5);g.lineTo(ctr+sd*B2/2,wingY+sweep+tip*0.5);g.lineTo(ctr+sd*L2*0.05,wingY+root*0.5);g.closePath();g.fill();g.stroke();
      g.beginPath();g.moveTo(ctr+sd*L2*0.05,tail-L2*0.16);g.lineTo(ctr+sd*B2*0.22,tail-L2*0.04);g.lineTo(ctr+sd*B2*0.22,tail);g.lineTo(ctr+sd*L2*0.05,tail-L2*0.02);g.closePath();g.fill();g.stroke();});
    R.engs.forEach(function(e,i){var n=R.engs.length,ex=af.kind==='prop'?ctr+(i-(n-1)/2)*B2*0.32:ctr+(i-(n-1)/2)*L2*0.045;g.fillStyle='#37474F';if(af.kind==='prop'){g.fillRect(ex-5,wingY-root*0.6,10,root*0.7);g.fillRect(ex-14,wingY-root*0.62,28,3);}else{g.beginPath();g.arc(ex,tail-4,Math.max(3,L2*0.022),0,2*PI);g.fill();}});
    if(R.radar&&R.radar.aew){g.fillStyle='rgba(55,71,79,.75)';g.beginPath();g.ellipse(ctr,wingY+L2*0.12,B2*0.15,B2*0.15,0,0,2*PI);g.fill();}
    var stn=R.stn,nS=stn.length;R.stores.forEach(function(s){var pos=nS>1?s.i/(nS-1):0.5,sx=ctr+(pos-0.5)*B2*0.96,sy=wingY+sweep*Math.abs(pos-0.5)*2+(s.s==='fus'||s.s==='ctr'?-root*0.1:root*0.25);
      g.fillStyle={aam:'#C62828',sam:'#C62828',tank:'#8D6E63',pod:'#6A1B9A',agm:'#EF6C00',arm:'#EF6C00',ashm:'#1565C0',cm:'#1565C0',bomb:'#424242',gbomb:'#424242',cbu:'#424242',rkt:'#2E7D32',torp:'#0277BD'}[s.mu.t]||'#555';
      var w=s.mu.t==='tank'?6:4,h=Math.max(10,Math.min(30,Math.sqrt(s.mu.kg)*0.9));if(s.s==='bay'||s.s==='hbay'){g.globalAlpha=0.5;}g.fillRect(sx-w/2,sy-h/2,w,h);g.globalAlpha=1;});
}
  capDraw(g,C,lt,rt,10);
  q('vCvN').textContent='俯視示意圖（依翼展、機長與發動機數繪製；外掛依類型著色：紅＝空對空、橘＝對地、藍＝反艦／巡弋、灰＝炸彈、棕＝副油箱、紫＝莢艙；半透明為內彈艙）。';}
function drawSea(c,d,R){var C=cvs(c,230),g=C.g,h=R.hull,sc=(C.w-40)/h.Loa,x0=20,wl=150,dep=h.D*sc,dr=R.Tfull*sc,deck=wl-(dep-dr);g.fillStyle='#E3F2FD';g.fillRect(0,wl,C.w,C.h-wl);g.fillStyle='#fafafa';g.fillRect(0,0,C.w,wl);
  g.font='11px system-ui,sans-serif';var L=h.Loa*sc;
  if(h.sub){var cy=wl+12,rad=h.B*sc/2;g.fillStyle='#37474F';g.beginPath();g.ellipse(x0+L/2,cy,L/2,Math.max(5,rad),0,0,2*PI);g.fill();g.fillRect(x0+L*0.3,cy-rad-14,L*0.1,14);}
  else{g.fillStyle='#78909C';g.strokeStyle='#455A64';g.beginPath();g.moveTo(x0,deck);g.lineTo(x0+L,deck-6);g.lineTo(x0+L*0.97,wl+dr);g.lineTo(x0+L*0.05,wl+dr);g.lineTo(x0,wl);g.closePath();g.fill();g.stroke();
    g.fillStyle='rgba(13,71,161,.25)';g.fillRect(x0,wl,L,dr);g.strokeStyle='#0D47A1';g.beginPath();g.moveTo(0,wl);g.lineTo(C.w,wl);g.stroke();
    var em=R.em.list,has=function(sl){return em.filter(function(e){return e.m.sl===sl;});};
    if(h.deck){g.fillStyle='#546E7A';g.fillRect(x0+L*0.02,deck-6,L*0.98,6);var isl=x0+L*0.62;g.fillStyle='#607D8B';g.fillRect(isl,deck-46,L*0.07,40);g.fillRect(isl+L*0.025,deck-64,4,18);
      var cats=0;em.forEach(function(e){if(e.m.cat)cats+=e.n;});g.strokeStyle='#FFCA28';for(var k=0;k<cats;k++){g.beginPath();g.moveTo(x0+L*(0.62+k*0.07),deck-7);g.lineTo(x0+L*(0.93+k*0.015),deck-7);g.stroke();}
      var n=Math.min(R.wingN,60);g.fillStyle='#37474F';for(var a=0;a<n;a++){g.fillRect(x0+L*0.05+(a%30)*L*0.019,deck-10-Math.floor(a/30)*3,L*0.012,2);}}
    else{var sup=x0+L*0.38;g.fillStyle='#90A4AE';g.fillRect(sup,deck-28,L*0.26,28);g.fillRect(sup+L*0.06,deck-48,L*0.12,20);g.fillStyle='#546E7A';g.fillRect(sup+L*0.11,deck-72,4,26);
      if(has('rad').length){g.fillStyle='#37474F';g.fillRect(sup+L*0.065,deck-44,L*0.025,14);g.fillRect(sup+L*0.17,deck-24,L*0.025,14);}
      var vls=0;em.forEach(function(e){if(e.m.sl==='vls')vls+=e.n;});if(vls){var fw=Math.round(vls*0.42),aw=vls-fw;g.fillStyle='#455A64';g.fillRect(x0+L*0.70,deck-3,L*0.1*Math.min(1,fw/16),3);g.fillRect(x0+L*0.2,deck-3,L*0.12*Math.min(1,aw/22),3);}
      if(has('gun').length){g.fillStyle='#37474F';g.fillRect(x0+L*0.85,deck-9,12,7);g.fillRect(x0+L*0.85+10,deck-7,16,2);}
      has('ciws').forEach(function(e,i){g.fillStyle='#455A64';g.fillRect(sup+(i?L*0.24:-6),deck-36,7,8);});
      if(has('av').length){g.fillStyle='#B0BEC5';g.fillRect(x0+L*0.04,deck-14,L*0.16,14);}}
}
  capDraw(g,C,h.sub?'潛航排水量約 '+fx(R.sub,0)+' 噸':'全長 '+fx(h.Loa,0)+' m・寬 '+fx(h.B,1)+' m・吃水 '+fx(R.Tfull,1)+' m','滿載 '+fx(R.full,0)+' 噸',10);
  q('vCvN').textContent='側視示意圖（依全長、型深與滿載吃水繪製；垂直發射、艦砲、近防、雷達、彈射器與艦載機數依模組顯示）。';}

/* ---------- output panels ---------- */
function vOut(){var d=vdes(VS.id),R=VR,subs=VSUB[d.br],cur=VS.sub[d.br];if(!subs.some(function(s){return s[0]===cur;}))cur=VS.sub[d.br]=subs[0][0];
  q('vSub').innerHTML=subs.map(function(s){return '<button type="button" data-sub="'+s[0]+'"'+(s[0]===cur?' class="on"':'')+'>'+s[1]+'</button>';}).join('');
  var box=q('vOut');try{box.innerHTML=(VPANEL[d.br][cur]||function(){return '';})(d,R,box);var after=VAFTER[d.br+cur];if(after)after(d,R,box);}catch(e){err(e);}}
function kv(rows){return '<div class="lt-kv lt-spec">'+rows.filter(function(r){return r;}).map(function(r){return '<b>'+r[0]+'</b><span>'+r[1]+'</span>';}).join('')+'</div>';}
function cmp(val,canon,unit,dig){if(canon===undefined||canon===null)return fx(val,dig)+unit;var dv=(val-canon)/canon;return fx(val,dig)+unit+'<span class="lt-pill '+(Math.abs(dv)<0.03?'lt-ok':'lt-pw')+'">官方 '+fx(canon,dig)+unit+'</span>';}
function modNames(R,sl){var out=[];R.em.list.forEach(function(e){if(e.m.sl===sl)out.push((e.n>1?e.n+' × ':'')+e.m.n);});return out;}
var VPANEL={l:{},a:{},s:{}},VAFTER={};
VPANEL.l.spec=function(d,R){var em=R.em,gun=R.gun,secs=R.secs,cn0=d.canon||{},crewTxt=R.crew+' 人組（'+R.roles.join('、')+'）'+(R.pax?'＋載員 '+R.pax+' 人':''),pk=em.pk.map(function(p){return VL.find(VD.pkg,p);}).filter(function(x){return x;});
  var h='<h4>'+esc(d.n)+'</h4>'+kv([['國　　籍',esc(d.nat||'—')],['研發單位',esc(d.mk||'—')],['服役年份',d.yr?d.yr+' 年':'—'],['型　　號',esc(VL.designation(d))],
    ['戰鬥全重',fx(R.mass/1000,1)+' 噸'],['路面極速',cmp(R.vRoad,cn0.speed,' km/h',0)+(R.vRoadP<R.gov?'（受功率限制）':'（傳動限速）')],['越野速度',fx(R.vOff,0)+' km/h'],['續航距離',cmp(R.range,cn0.range,' km',0)+'（越野約 '+fx(R.rangeOff,0)+' km）'],
    ['動力系統',esc(modNames(R,'eng').join('、')||'—')+'，功重比 '+fx(R.ptw,1)+' 匹／噸'],gun?['主　　砲',esc(gun.n)]:null,gun?['主砲口徑',gun.cal+' 公釐'+(gun.lc?'，'+gun.lc+' 倍徑':'')]:null,
    secs.length?['副武器',secs.map(function(s){return (s.n>1?s.n+' 挺 ':'')+esc(s.m.n);}).join('；')]:null,R.msls.length?['飛　　彈',R.msls.map(function(s){return esc(s.m.n);}).join('；')]:null,
    ['防　　護',esc((em.za?'輕量版主裝甲':'複合裝甲'))+(pk.length?'＋'+pk.map(function(p){return esc(p.n);}).join('、'):'')],['射控系統',esc(modNames(R,'fcs').join('＋')||'—')],
    ['自動裝填',R.al?esc(R.al.n):'無（裝填手）'],['車組員量',crewTxt],R.aps.length?['主動防禦',R.aps.map(function(a){return esc(a.n)+'（攔截火箭彈 '+Math.round(a.pR*100)+'%、飛彈 '+Math.round(a.pM*100)+'%，'+(a.arc>=360?'全周':a.arc+'° 前方')+(a.coll?'；附帶傷害大':'')+'）';}).join('；')]:null,
    R.ews.length?['電子戰',R.ews.map(function(e){return esc(e.n);}).join('；')]:null,['單　　價',dyM(R.unit)+'（不含彈藥）']]);
  if(d.protos)h+='<div class="lt-note">原型車：'+d.protos.map(esc).join('、')+'</div>';
  if(cn0.mass){var rows=cn0.mass.map(function(cm){var dd=A.cloneObj(d);dd.sel=A.cloneObj(d.sel||{});dd.sel.osu=cm[1].osu||'';dd.sel.ea=cm[1].ea||'';var r=VL.landCalc(dd,vctx());return '<tr><td class="l">'+esc(cm[0])+'</td><td>'+fx(cm[2]/1000,1)+'</td><td>'+fx(r.mass/1000,1)+'</td><td>'+fx(r.vRoad,0)+'</td><td>'+fx(r.range,0)+'</td><td>'+cnD(r.unit)+'</td></tr>';}).join('');
    h+='<h4>官方各型戰鬥全重與模擬值（目前主砲、裝填與裝甲設定）</h4><div class="lt-sc"><table class="lt-dt"><tr><th class="l">配置</th><th>官方（噸）</th><th>模擬（噸）</th><th>路面極速</th><th>續航 km</th><th>單價（'+esc(curN())+'）</th></tr>'+rows+'</table></div>';}
  if(pk.length)h+='<h4>已裝升級包</h4>'+pk.map(function(p){return '<div class="lt-note"><b>'+esc(p.n)+'</b>'+(p.st?'<span class="lt-pill lt-pw">'+esc(p.st)+'</span>':'')+(p.tgt?'（官方增重 '+fx(p.tgt/1000,1)+' 噸）':'')+'：'+esc(p.note||'')+'</div>';}).join('');
  if(d.desc)h+='<h4>簡介</h4><div class="lt-info">'+esc(d.desc)+'</div>';return h;};
VPANEL.l.perf=function(d,R){var tot=R.mass,h='<h4>重量分配</h4><div class="lt-sc"><table class="lt-dt"><tr><th class="l">項目</th><th>重量</th><th>比例</th><th class="l">來源</th></tr>'+R.rows.map(function(r){return '<tr><td class="l">'+esc(r.n)+'</td><td>'+fx(r.kg,0)+' kg</td><td>'+fx(r.kg/tot*100,1)+'%</td><td class="l lt-note">'+esc(r.src||'')+'</td></tr>';}).join('')+
  '<tr class="sum"><td class="l">戰鬥全重</td><td>'+fx(tot,0)+' kg</td><td>100%</td><td></td></tr></table></div>';
  h+='<h4>機動性</h4>'+kv([['功重比',fx(R.ptw,1)+' 匹／噸（'+fx(R.hp,0)+' 匹）'],['路面極速',fx(R.vRoad,1)+' km/h；功率可達 '+fx(R.vRoadP,0)+' km/h，傳動限速 '+R.gov+' km/h'],['越野速度',fx(R.vOff,0)+' km/h'],['0–32 km/h 加速',fx(R.acc,1)+' 秒'],
    R.ngp?['接地壓力','名目 '+fx(R.ngp,1)+' kPa；平均最大接地壓力（MMP）'+fx(R.mmp,0)+' kPa'+(R.mmp>250?'（軟土地形受限）':R.mmp>180?'（一般）':'（良好）')]:['每輪負重',fx(R.wheelT,2)+' 噸'],
    ['油耗','公路 '+fx(R.Lkm,2)+' L/km、越野 '+fx(R.Lko,2)+' L/km（油箱 '+fx(R.fuelL,0)+' L）'],['續航','公路 '+fx(R.range,0)+' km、越野 '+fx(R.rangeOff,0)+' km']]);
  if(R.ch.kind==='tr')h+='<div class="lt-note">負重輪由五對增至六對時，平均最大接地壓力約下降 '+fx((1-5/6)*100,0)+'%（MMP 與每側輪數成反比），這正是「刑天」加長車體、增加負重輪以承受複合裝甲重量的理由。</div>';return h;};
VPANEL.l.prot=function(d,R){var keInf=0,c=vctx(),ref=VL.scaledProj(VL.find(S.proj,'t120dm53'),null),h='<h4>各區域防護（RHA 等效，垂直）</h4><div class="lt-note">動能等效以 120 mm DM53 長桿彈為基準；化學能分別列出單一裝藥與串聯裝藥（後者先引爆反應裝甲）。區域內若只有部分面積裝上套件，分段列出。</div>'+
   '<div class="lt-sc"><table class="lt-dt"><tr><th class="l">區域</th><th>面積範圍</th><th>動能</th><th>化學能</th><th>串聯化學能</th><th>柵欄</th><th>重量</th><th class="l">套件</th></tr>';
  VL.ZORD.forEach(function(z){(R.zones[z]||[]).forEach(function(I,i){var e=VL.zoneEq(I.L,c,ref);h+='<tr><td class="l">'+(i?'':VL.ZN[z])+'</td><td>'+fx(I.a*100,0)+'–'+fx(I.b*100,0)+'%</td><td>'+(isFinite(e.ke)?fx(e.ke,0)+' mm':(keInf=1,'&gt; '+fx(e.keMin,0)+' mm＊'))+'</td><td>'+(isFinite(e.ce)?fx(e.ce,0)+' mm':'—')+'</td><td>'+(isFinite(e.ceT)?fx(e.ceT,0)+' mm':'—')+'</td><td>'+(e.slat?Math.round(e.slat*100)+'%':'')+'</td><td>'+(i?'':fx((R.zmass[z]||0)/1000,2)+' 噸')+'</td><td class="l lt-note">'+esc(I.k.join('、'))+'</td></tr>';});});
  h+='</table></div>'+(keInf?'<div class="lt-note">＊參考彈在任何速度下都無法擊穿：反應裝甲先削短彈芯，剩餘的長度即使在流體動力極限也不足以貫穿後方裝甲；數值為參考彈的極限穿深。</div>':'')+'<h4>生存力（被命中後遭擊穿的機率）</h4><div class="row"><span class="lt-note">威脅清單（彈藥＠距離 m）：</span><input type="text" data-k="vThr" style="width:min(100%,520px)" value="'+esc((VS.thr||VTHR).map(function(t){return t[0]+'@'+t[1];}).join(', '))+'"><button type="button" data-k="vThrOk">更新</button></div><div data-k="vSurv"></div>';return h;};
VAFTER.lprot=function(d,R){var c=vctx(),list=(VS.thr||VTHR),rows=VL.landSurv(R,list,c),pc=function(x){return '<td class="'+(x>0.5?'bad':x>0.1?'warn':'good')+'">'+fx(x*100,0)+'%</td>';};
  q('vSurv').innerHTML='<div class="lt-sc"><table class="lt-dt lt-mx"><tr><th class="l">威脅</th><th>距離</th><th>正面擊穿</th><th>主動防禦</th><th>正面最終</th><th>側面擊穿</th><th>側面最終</th></tr>'+rows.map(function(r){var f=r.arcs.f||r.arcs.t,s=r.arcs.s;
      return '<tr><td class="l">'+esc(r.P.n)+(r.P.ta?'<span class="lt-pill">頂部攻擊</span>':'')+'</td><td>'+fx(r.range,0)+' m</td>'+pc(f.pPerf)+'<td>'+(f.pAps?'攔截 '+fx(f.pAps*100,0)+'%':'—')+(f.pJam?'；干擾 '+fx(f.pJam*100,0)+'%':'')+'</td>'+pc(f.pFinal)+(s?pc(s.pPerf)+pc(s.pFinal):'<td colspan="2" class="l lt-note">由頂部命中</td>')+'</tr>';}).join('')+'</table></div>'+
   '<div class="lt-note">正面依砲塔正面 44%、車體正面 40%、兩側斜向 16% 的命中分布加權（側面威脅以 60° 斜角打在正面裝甲上）。綠＝多半擋下、紅＝多半擊穿。'+(R.aps.some(function(a){return a.coll;})?'「黑盾」攔截時會對周圍步兵造成附帶傷害。':'')+'</div>';
  q('vThrOk').onclick=function(){var t=q('vThr').value.split(/[,，\s]+/).map(function(s){var a=s.split('@');return a[0]&&VL.find(S.proj,a[0])?[a[0],+a[1]||1000]:null;}).filter(function(x){return x;});if(t.length){VS.thr=t;vOut();}};};
VPANEL.l.fire=function(d,R){var gun=R.gun,c=vctx(),h='';if(!gun)return '<div class="lt-note">此設計沒有主武器。</div>';
  h+='<h4>主武器</h4>'+kv([['砲',esc(gun.n)],['射速',R.rof+' 發／分'+(R.al?'（自動裝填）':'（人工裝填）')],['反應時間','約 '+fx(R.react,1)+' 秒（發現到首發）'],['夜戰','熱像約 '+fx(R.thermal,1)+' km'],['射控散布',fx(R.sig,2)+' 密位'],
    ['彈藥基數',R.ammo.map(function(a){var P=VL.find(S.proj,a[0]);return P?esc(P.n)+' × '+a[1]:'';}).join('、')],['基數造價與重量',dyM(R.ammoCost)+'；'+tons(R.ammoKg*1000)]]);
  var rows=R.ammo.map(function(a){var P0=VL.find(S.proj,a[0]);if(!P0||a[1]<=0)return '';var P=VL.scaledProj(P0,gun),pen=[0,1000,2000,3000].map(function(r){if(P.k==='sc')return P.guided&&r>6000?'—':fx(A.scCapacity(P,0),0);if(P.k==='he')return '—';return fx(A.perfLimit(P,A.velAt(P,r,env()),'rha',0,{lib:S.mats}),0);});
    return '<tr><td class="l">'+esc(P0.n)+'</td><td>'+fx(P.v0,0)+'</td>'+pen.map(function(x){return '<td>'+x+'</td>';}).join('')+'<td>'+moneyT(costP(P0).usd)+'</td></tr>';}).join('');
  h+='<div class="lt-sc"><table class="lt-dt"><tr><th class="l">彈種</th><th>初速（此砲）</th><th>0 m</th><th>1 km</th><th>2 km</th><th>3 km</th><th>單價</th></tr>'+rows+'</table></div><div class="lt-note">穿深為垂直 RHA（mm）；初速依此砲倍徑與彈藥原設計倍徑換算。</div>';
  h+='<h4>首發命中率（2.3 × 2.3 m 標準靶）</h4><div class="lt-sc"><table class="lt-dt"><tr><th class="l">狀況</th>'+[500,1000,2000,3000,4000].map(function(r){return '<th>'+r+' m</th>';}).join('')+'</tr>'+
    [['靜止目標',false],['移動中射擊',true]].map(function(x){return '<tr><td class="l">'+x[0]+'</td>'+[500,1000,2000,3000,4000].map(function(r){return '<td>'+fx(VL.hitP(R.sig,r,2.3,2.3,x[1])*100,0)+'%</td>';}).join('')+'</tr>';}).join('')+'</table></div>';
  if(R.secs.length||R.msls.length)h+='<h4>副武器</h4>'+kv(R.secs.map(function(s){var P=VL.find(S.proj,s.m.am[0]);return [esc(s.m.n),(s.n>1?s.n+' 挺，':'')+'備彈 '+s.m.rd*s.n+' 發'+(P?'；'+esc(P.n)+' 於 500 m 穿深 '+fx(A.perfLimit(P,A.velAt(P,500,env()),'rha',0,{lib:S.mats}),0)+' mm':'')];}).concat(R.msls.map(function(s){var mu=s.m.mu?vmun(s.m.mu):null;return [esc(s.m.n),(mu?esc(mu.n)+'，射程 '+mu.rng+' km':'')+'，'+s.m.rd*s.n+' 枚'];})));
  return h;};
VPANEL.l.duel=function(d,R){var land=VD.des.filter(function(x){return x.br==='l'&&x.id!==d.id;});if(!VL.find(VD.des,VS.duelB)||VS.duelB===d.id)VS.duelB=(land[0]||d).id;
  return '<div class="row"><label>對手 <select data-k="vDB">'+land.map(function(x){return '<option value="'+esc(x.id)+'"'+(x.id===VS.duelB?' selected':'')+'>'+esc(x.n)+'</option>';}).join('')+'</select></label><label>距離 <input type="number" data-k="vDR" value="'+VS.duelR+'" step="250" style="width:72px"> m</label>'+
   '<label><input type="checkbox" data-k="vDHA"> 我方車體掩蔽</label><label><input type="checkbox" data-k="vDHB"> 對手車體掩蔽</label><label><input type="checkbox" data-k="vDMA"> 我方行進間射擊</label><label><input type="checkbox" data-k="vDN"> 夜間</label><button type="button" class="lt-pri" data-k="vDGo">模擬 4,000 次</button></div><div data-k="vDOut"></div>';};
VAFTER.lduel=function(d,R){function go(){VS.duelB=q('vDB').value;VS.duelR=Math.max(100,+q('vDR').value||2000);vsave();var B=VL.landCalc(vdes(VS.duelB),vctx());if(B.err){q('vDOut').textContent=B.err;return;}
    var r=VL.duel(R,B,{range:VS.duelR,aHD:q('vDHA').checked,bHD:q('vDHB').checked,aMov:q('vDMA').checked,night:q('vDN').checked},vctx());if(r.err){q('vDOut').textContent=r.err;return;}
    var side=function(x,nm){return '<tr><td class="l">'+esc(nm)+'</td><td class="l">'+esc(x.P.n)+'</td><td>'+fx(x.ph*100,0)+'%</td><td>'+fx(x.pp*100,0)+'%</td><td>'+(x.pa?fx(x.pa*100,0)+'%':'—')+'</td><td>'+fx(x.pk*100,0)+'%</td><td>'+fx(x.react,1)+' s</td><td>'+fx(x.cyc,1)+' s</td></tr>';};
    q('vDOut').innerHTML='<div class="lt-res '+(r.pA>r.pB?'good':'bad')+'">'+esc(d.n)+' 勝 <b>'+fx(r.pA*100,0)+'%</b>；'+esc(vdes(VS.duelB).n)+' 勝 <b>'+fx(r.pB*100,0)+'%</b>；60 秒內未分勝負 '+fx(r.pNone*100,0)+'%'+(r.tMean?'；平均 '+fx(r.tMean,1)+' 秒分出勝負':'')+'</div>'+
      '<div class="lt-sc"><table class="lt-dt"><tr><th class="l">射手</th><th class="l">彈種</th><th>命中</th><th>擊穿正面</th><th>被主動防禦攔截</th><th>每發擊毀</th><th>首發時間</th><th>射擊間隔</th></tr>'+side(r.a,d.n)+side(r.b,vdes(VS.duelB).n)+'</table></div>'+
      '<div class="lt-note">雙方正面對射、砲塔朝向對方；擊穿後以 75% 機率造成擊毀或喪失戰力。彈種自動選擇對對方正面最有效者。</div>';}
  q('vDGo').onclick=go;q('vDB').onchange=go;go();};
VPANEL.l.cost=function(d,R){var qty=d.qty||100,s=VL.seriesCost(R.unit,qty,d.lc||0.9),rows=R.em.list.filter(function(e){return e.m.dy;}).map(function(e){return [e.m.n+(e.n>1?' ×'+e.n:''),e.m.dy*e.n];});rows.push(['裝甲材料與加工（各區合計）',R.costArm]);
  return '<h4>造價</h4>'+kv([['單價（首批）',dyM(R.unit)],['產量 '+qty+' 輛平均',dyM(s.avg)+'（學習曲線 '+fx((d.lc||0.9)*100,0)+'%）'],['計畫總額',dyM(s.total)],['第 '+qty+' 輛',dyM(s.last)],['彈藥基數',dyM(R.ammoCost)],['每公里運行',dyM(R.costKm)+'（燃油＋磨耗）'],['年度維持',dyM(R.costYear)+'（約為單價 6%）']])+
   '<div class="lt-sc"><table class="lt-dt"><tr><th class="l">項目</th><th>造價（'+esc(curN())+'）</th></tr>'+rows.map(function(r){return '<tr><td class="l">'+esc(r[0])+'</td><td>'+cnD(r[1])+'</td></tr>';}).join('')+'<tr class="sum"><td class="l">小計 × 1.25（整合、測試與廠商利潤）</td><td>'+cnD(R.unit)+'</td></tr></table></div>';};

VPANEL.a.spec=function(d,R){var af=R.af,cn0=d.canon||{},eng=modNames(R,'aeng').join('、'),h='<h4>'+esc(d.n)+'</h4>';
  h+=kv([['國　　籍',esc(d.nat||'—')],['研發單位',esc(d.mk||'—')],['服役年份',d.yr?d.yr+' 年':'—'],['用途定位',esc(VL.TYPES.a[d.ty]||'')],['乘　　員',(af.crew||0)+' 人'+(af.pax?'（可載 '+af.pax+' 人）':'')],
    af.kind==='rot'?['旋翼直徑',fx(af.D,2)+' 公尺']:['翼　　展',cmp(af.b,cn0.span,' 公尺',1)+(af.car?'（未折疊）':'')],['機　　長',cmp(af.l,cn0.len,' 公尺',1)],['發動機',esc(eng)],
    af.kind==='jet'?['最大速度',cmp(R.mClean,cn0.mach,' 馬赫',2)+'（'+esc(R.mLimClean||'')+'；目前外掛下 '+fx(R.mMax,2)+' 馬赫）']:['最大速度',fx(R.vmax,0)+' km/h'],
    af.kind==='jet'?['作戰半徑',cmp(R.radius,cn0.radius,' 公里',0)+'（目前外掛、'+({hhh:'高－高－高',hlh:'高－低－高',lll:'全程低空'}[VS.prof])+'）']:['航程',fx(R.ferry||R.range,0)+' 公里'+(R.endur?'；滯空 '+fx(R.endur,1)+' 小時':'')],
    ['最大起飛重量',cmp(af.mtow,cn0.mtow,' 公斤',0)+'（目前 '+fx(R.W0,0)+' 公斤）'],R.stn.length?['武器掛載','共 '+R.stn.filter(function(s){return s!=='esm';}).length+' 個掛載點']:null,
    R.guns.length?['內置武裝',R.guns.map(function(g){return esc(g.n);}).join('、')]:null,['航電系統',esc(modNames(R,'rad').concat(modNames(R,'irst'),modNames(R,'eo'),modNames(R,'ew')).join('、'))],['單　　價',dyM(R.unit)]]);
  if(d.miss&&VL.MISS[d.miss])h+='<h4>任務</h4><div class="lt-note">'+VL.MISS[d.miss].map(esc).join('、')+'</div>';
  if(d.desc)h+='<h4>簡介</h4><div class="lt-info">'+esc(d.desc)+'</div>';return h;};
VPANEL.a.perf=function(d,R){var af=R.af,h='<h4>重量</h4><div class="lt-sc"><table class="lt-dt"><tr><th class="l">項目</th><th>重量</th></tr>'+R.rows.map(function(r){return '<tr><td class="l">'+esc(r.n)+'</td><td>'+fx(r.kg,0)+' kg</td></tr>';}).join('')+'<tr class="sum"><td class="l">起飛重量</td><td>'+fx(R.W0,0)+' kg</td></tr></table></div>';
  if(af.kind==='jet')h+='<h4>飛行性能</h4>'+kv([['推重比','起飛 '+fx(R.twTO,2)+'；戰鬥重量 '+fx(R.twC,2)],['翼負荷','起飛 '+fx(R.wl,0)+' kg/m²；戰鬥 '+fx(R.wlC,0)+' kg/m²'],['最大速度（11 km）','乾淨外形 '+fx(R.mClean,2)+' 馬赫；目前外掛 '+fx(R.mMax,2)+' 馬赫（'+esc(R.mLim)+'）'],
    ['超音速巡航',R.superCruise>1?'可，約 '+fx(R.superCruise,2)+' 馬赫':'否（軍用推力最高約 '+fx(R.superCruise,2)+' 馬赫）'],['海平面爬升率','約 '+fx(R.climb,0)+' m/s'],['實用升限','約 '+fx(R.ceil/1000,1)+' km'],['持續轉彎（4,500 m、0.9 馬赫）',fx(R.nSus,1)+' G、'+fx(R.turn,1)+' °/s'],
    ['作戰半徑',fx(R.radius,0)+' km（燃油：起飛爬升 '+fx(R.alloc.to,0)+'、空戰 '+fx(R.alloc.cb,0)+'、備份 '+fx(R.alloc.res,0)+' kg）'],['轉場航程',fx(R.ferry,0)+' km'],
    af.car?['航艦作業','進場速度約 '+fx(R.vApp,0)+' 節；彈射需末速 '+fx(R.vCat*1.944,0)+' 節、能量 '+fx(R.eCat,0)+' MJ（「水弦」可提供 95 MJ）'+(R.eCat>95?'：<b>超出彈射能力</b>':'')]:null]);
  else if(af.kind==='prop')h+='<h4>飛行性能</h4>'+kv([['最大速度',fx(R.vmax,0)+' km/h'],['爬升率','約 '+fx(R.climb,0)+' m/s'],['實用升限','約 '+fx(R.ceil/1000,1)+' km'],['航程',fx(R.ferry,0)+' km'],['滯空',fx(R.endur,1)+' 小時'+(R.radar&&R.radar.aew?'；距母艦 300 km 處可留空 '+fx(R.onStation,1)+' 小時':'')],
    af.car?['航艦作業','進場速度約 '+fx(R.vApp,0)+' 節；彈射能量 '+fx(R.eCat,0)+' MJ']:null]);
  else h+='<h4>飛行性能</h4>'+kv([['最大速度',fx(R.vmax,0)+' km/h'],['巡航速度',fx(R.vCruise,0)+' km/h'],['懸停升限（無地效）','約 '+fx(R.hoverCeil,0)+' m'],['懸停功率',fx(R.pHover,0)+' kW'],['航程',fx(R.range,0)+' km；滯空 '+fx(R.endur,1)+' 小時'],['旋翼盤面負荷',fx(R.discLoad,0)+' kg/m²']]);
  return h;};
VPANEL.a.load=function(d,R){if(!R.stores.length)return '<div class="lt-note">目前沒有外掛。</div>';var rows=R.stores.map(function(s){var mu=s.mu;return '<tr><td>'+(s.i+1)+'</td><td class="l">'+esc(mu.n)+(mu.nuke?'<span class="lt-pill lt-pw">戰術核武</span>':'')+'</td><td class="l lt-note">'+esc(mu.code||'')+'</td><td>'+s.n*(mu.per||1)+'</td><td>'+fx(s.kg,0)+'</td><td>'+(mu.rng?mu.rng+' km':'—')+'</td><td>'+cnD(mu.dy*s.n)+'</td></tr>';}).join('');
  var prof=['hhh','hlh','lll'].map(function(p){var r=VL.airCalc(d,vctx(),{profile:p});return [{hhh:'高－高－高',hlh:'高－低－高',lll:'全程低空'}[p],r.radius];});
  return '<h4>掛載清單</h4><div class="lt-sc"><table class="lt-dt"><tr><th>掛點</th><th class="l">彈藥／莢艙</th><th class="l">編號</th><th>數量</th><th>重量 kg</th><th>射程</th><th>造價（'+esc(curN())+'）</th></tr>'+rows+'</table></div>'+
   kv([['外掛總重',fx(R.stKg,0)+' kg'],['一次出擊消耗彈藥',dyM(R.sortieCost)],['雷達截面積','約 '+fx(R.rcs,2)+' m²（機體 '+fx(R.af.rcs,2)+' m² ＋外掛）']].concat(prof.map(function(p){return ['作戰半徑（'+p[0]+'）',fx(p[1],0)+' km'];})));};
VPANEL.a.sens=function(d,R){var h='',rr=R.radar?R.radar.rr:0,tg=[['戰鬥機（5 m²）',5],['4.5 代戰機（1 m²）',1],['巡弋飛彈（0.1 m²）',0.1],['匿蹤戰機（0.01 m²）',0.01]];
  if(R.radar)h+='<h4>雷達：'+esc(R.radar.n)+'</h4><div class="lt-sc"><table class="lt-dt"><tr><th class="l">目標</th><th>偵測距離</th></tr>'+tg.map(function(t){return '<tr><td class="l">'+t[0]+'</td><td>'+fx(rr*Math.pow(t[1],0.25),0)+' km</td></tr>';}).join('')+'</table></div>'+
    kv([['追蹤／同時攻擊',(R.radar.tr||0)+' 個／'+(R.radar.en||0)+' 個'],R.radar.lpi?['低截獲','主動電子掃描，敵方雷達告警較晚察覺']:null]);
  var other=VD.des.filter(function(x){return x.br==='a'&&x.id!==d.id&&(x.ty==='ftr'||x.ty==='ew');});
  h+='<h4>被偵測</h4>'+kv([['本機雷達截面積','約 '+fx(R.rcs,2)+' m²（含外掛）'],['自衛干擾','使來襲飛彈命中率約降 '+fx(R.jam*100,0)+'%'],R.esm?['電子支援','被動截收與定位敵方雷達約 '+fx(R.esm,0)+' km']:null]);
  h+='<div class="lt-sc"><table class="lt-dt"><tr><th class="l">敵機（以其雷達偵測本機）</th><th>被發現距離</th><th>本機發現對方</th><th>先發現者</th></tr>'+other.map(function(x){var o=VL.airCalc(x,vctx());if(o.err||!o.radar)return '';var them=o.radar.rr*Math.pow(R.rcs,0.25),us=rr*Math.pow(o.rcs,0.25);
    return '<tr><td class="l">'+esc(x.n)+'</td><td>'+fx(them,0)+' km</td><td>'+fx(us,0)+' km</td><td>'+(us>them*1.05?'本機':them>us*1.05?'對方':'相近')+'</td></tr>';}).join('')+'</table></div>';
  if(R.irst)h+=kv([['紅外搜索追蹤','對後燃器開啟的戰機約 '+fx(R.irst.rr,0)+' km，被動不發射']]);return h;};
VPANEL.a.cost=function(d,R){var qty=d.qty||100,s=VL.seriesCost(R.unit,qty,d.lc||0.85),rows=R.em.list.filter(function(e){return e.m.dy;}).map(function(e){return [e.m.n+(e.n>1?' ×'+e.n:''),e.m.dy*e.n];});
  return '<h4>造價</h4>'+kv([['單價（首批）',dyM(R.unit)],['產量 '+qty+' 架平均',dyM(s.avg)],['計畫總額',dyM(s.total)],['每飛行小時',dyM(R.cpfh)+'（燃油約 '+fx(R.flowCruise,0)+' kg/h＋維修）'],['一次出擊彈藥',dyM(R.sortieCost)]])+
   '<div class="lt-sc"><table class="lt-dt"><tr><th class="l">項目</th><th>造價（'+esc(curN())+'）</th></tr>'+rows.map(function(r){return '<tr><td class="l">'+esc(r[0])+'</td><td>'+cnD(r[1])+'</td></tr>';}).join('')+'<tr class="sum"><td class="l">小計 × 1.12（整合與測試）</td><td>'+cnD(R.unit)+'</td></tr></table></div>';};

VPANEL.s.spec=function(d,R){var h=R.hull,cn0=d.canon||{},pw=modNames(R,'pw'),ser=R.series,h2='<h4>'+esc(d.n)+'</h4>';
  h2+=kv([['定　　位',esc(VL.TYPES.s[d.ty]||'')],['造　　價',ser.length>1?cnD(ser[ser.length-1].cost)+'～'+cnD(ser[0].cost)+'（'+esc(curN())+'，首艦最貴）':dyM(R.unit)],h.sub?['潛航排水量',fx(R.sub,0)+' 公噸']:['標　　準',cmp(R.std,cn0.std,' 公噸',0)],['滿　　載',cmp(R.full,cn0.full,' 公噸',0)],
    ['艦　　長',cmp(h.Loa,cn0.Loa,' 公尺',0)],['艦　　寬',cmp(h.B,cn0.B,' 公尺',0)],['吃　　水',cmp(R.Tfull,cn0.T,' 公尺',1)],['動力輸出',esc(pw.join('、'))],h.sub?null:['功　　率',cmp(R.shaft,cn0.mw,' 百萬瓦',0)],
    h.sub?['水下速度','約 '+fx(R.vCalm,1)+' 節（電池）']:['最高速度','依照海況 '+fx(R.vSS6,0)+'～'+fx(R.vCalm,0)+' 節'+(cn0.kn?'<span class="lt-pill">官方 '+cn0.kn[0]+'～'+cn0.kn[1]+' 節</span>':'')],
    ['續　　航',R.range===Infinity?'不計入糧水必需品的話，近乎無限（糧水約 '+R.endur+' 日）':h.sub?'電池 4 節約 '+fx(R.battHrs,0)+' 小時'+(R.aip?'；絕氣推進約 '+R.aipDays+' 日':'')+'；呼吸管航程約 '+fx(R.snorkel,0)+' km':cmp(R.range,cn0.range,' 公里',0)+'（'+R.vCruise+' 節巡航）'],
    ['乘　　員',cmp(R.crew,cn0.crew,' 人',0)+(R.pax?'＋搭載部隊 '+R.pax+' 人':'')]]);
  var grp=function(t,sls){var L=[];R.em.list.forEach(function(e){if(sls.indexOf(e.m.sl)>=0)L.push(esc(e.m.n)+(e.n>1?' ×'+e.n:''));});return L.length?'<h4>'+t+'</h4><div class="lt-list">'+L.map(function(x){return '<div>'+x+'</div>';}).join('')+'</div>':'';};
  h2+=grp('搜索系統',['rad','son','eo','c4i','nav','asw','atc'])+grp('武器系統',['vls','lnch','gun','ciws'])+(R.munList.length?'<div class="lt-list">'+R.munList.map(function(x){return '<div class="lt-note">　'+esc(x.mu.n)+(x.mu.code?'（'+esc(x.mu.code)+'）':'')+' × '+x.n+'</div>';}).join('')+'</div>':'')+grp('電戰系統',['ew','dec'])+grp('航空設施',['av']);
  if(R.wing.length)h2+='<h4>艦載機</h4><div class="lt-list">'+R.wing.map(function(w){return '<div>'+esc(w.d.n)+' × '+w.n+'</div>';}).join('')+'</div>';
  if(d.desc)h2+='<h4>簡介</h4><div class="lt-info">'+esc(d.desc)+'</div>';return h2;};
VPANEL.s.perf=function(d,R){var h='<h4>重量（公噸）</h4><div class="lt-sc"><table class="lt-dt"><tr><th class="l">項目</th><th>重量</th></tr>'+R.rows.map(function(r){return '<tr><td class="l">'+esc(r.n)+'</td><td>'+fx(r.kg/1000,r.kg<1e5?1:0)+'</td></tr>';}).join('')+
   '<tr class="sum"><td class="l">滿載排水量</td><td>'+fx(R.full,0)+'</td></tr><tr><td class="l">標準排水量（不含燃油、航空燃油與液體壓艙）</td><td>'+fx(R.std,0)+'</td></tr><tr><td class="l">艦體幾何的設計排水量（方形係數 '+R.hull.Cb+'）</td><td>'+fx(R.dDesign,0)+'</td></tr></table></div>';
  h+='<h4>航行</h4>'+kv([['推進功率',fx(R.shaft,0)+' MW；發電 '+fx(R.elec,0)+' MW（艦用電力需求約 '+fx(R.hotel/1000,1)+' MW）'],['最高速度','平靜海況 '+fx(R.vCalm,1)+' 節；中浪 '+fx(R.vSS4,1)+' 節；大浪 '+fx(R.vSS6,1)+' 節（福祿數 '+fx(R.Fn,2)+'）'],
    ['續航',R.range===Infinity?'核動力，近乎無限':R.range===null?'—':fx(R.range,0)+' km（'+R.vCruise+' 節；可在上方改巡航速度）'],['每日運行',dyM(R.costDay)]]);
  h+='<canvas class="lt-chart" data-k="vSP"></canvas>';return h;};
VAFTER.sperf=function(d,R){var pts=[],mx=Math.ceil(R.vCalm/5)*5+5;for(var v=4;v<=mx;v+=0.5)pts.push([v,R.Ps(v*0.5144,0)]);var ym=0;pts.forEach(function(p){ym=Math.max(ym,Math.min(p[1],R.shaft*1.6||50));});
  if(!R.hull.sub)chart(q('vSP'),{x:['航速（節）',mx],y:['軸功率（MW）',Math.max(ym,R.shaft*1.1)],series:[{c:'#1565C0',pts:pts,label:'所需軸功率（平靜海況）'}],hl:[{y:R.shaft,c:'#C62828',label:'裝置功率 '+fx(R.shaft,0)+' MW'}],vl:[{x:R.vCalm,c:'#555',label:fx(R.vCalm,1)+' 節'}]});else cvs(q('vSP'),10);};
VPANEL.s.wpn=function(d,R){var h='<h4>垂直發射與飛彈架</h4>'+kv([['垂直發射單元',R.vlsUsed+' / '+R.cells+' 具'],['飛彈架',R.lnchUsed+' / '+R.lcells+' 具'],['裝填價值',dyM(R.ammoCost)]])+
   '<div class="lt-sc"><table class="lt-dt"><tr><th class="l">彈種</th><th>數量</th><th>射程</th><th>單價</th></tr>'+R.munList.map(function(x){return '<tr><td class="l">'+esc(x.mu.n)+'</td><td>'+x.n+'</td><td>'+(x.mu.rng?x.mu.rng+' km':'—')+'</td><td>'+cnD(x.mu.dy)+'</td></tr>';}).join('')+'</table></div>';
  if(R.hull.sub)return h;
  h+='<h4>防空飽和攻擊模擬</h4><div class="row"><label>來襲 <select data-k="vAT">'+opts(Object.keys(VL.THREAT).map(function(k){return [k,VL.THREAT[k][0]];}),VS.adT)+'</select></label><label>數量 <input type="number" data-k="vAN" value="'+VS.adN+'" min="1" max="300" style="width:60px"> 枚</label>'+
   '<label><input type="checkbox" data-k="vAA"'+(VS.adAew||R.aewN>0?' checked':'')+(R.aewN>0?' disabled':'')+'> 有預警機與協同交戰（可超視距攔截掠海飛彈）'+(R.aewN>0?'：艦載預警機 '+R.aewN+' 架':'')+'</label></div><div data-k="vADo"></div>';return h;};
VAFTER.swpn=function(d,R){if(R.hull.sub)return;function go(){VS.adT=q('vAT').value;VS.adN=Math.max(1,+q('vAN').value||8);if(!q('vAA').disabled)VS.adAew=q('vAA').checked;var o={threat:VS.adT,n:VS.adN,aew:VS.adAew},a=VL.seaAD(R,o,vctx()),mx=VL.seaADmax(R,o,vctx());
    q('vADo').innerHTML='<div class="lt-res '+(a.hits<0.5?'good':a.pDisable>0.5?'bad':'warn')+'">預計命中 <b>'+fx(a.hits,1)+'</b> 枚（約需 '+fx(a.hitsToKill,1)+' 枚命中才會失去戰力，失能機率 '+fx(a.pDisable*100,0)+'%）；單艦可完全擋下的齊射約 <b>'+mx+'</b> 枚</div>'+
      kv([['偵測','約 '+fx(a.det,0)+' km（雷達水平線 '+fx(a.hor,0)+' km'+(a.aew?'，有預警機':'')+'）'],['軟殺傷','誘餌與干擾使剩餘飛彈約 '+fx(a.soft*100,0)+'% 偏離'],['剩餘防空飛彈',fx(a.samLeft,0)+' 枚']])+
      '<div class="lt-sc"><table class="lt-dt"><tr><th class="l">攔截層</th><th class="l">武器</th><th>接戰距離</th><th>可交戰次數</th><th>實際交戰</th><th>單次擊落</th><th>擊落</th><th>剩餘來襲</th></tr>'+a.log.map(function(l){return '<tr><td class="l">'+l.n+'</td><td class="l">'+(l.mis?esc(l.mis.n):'近防艦砲')+'</td><td>'+fx(l.rS,0)+' km</td><td>'+l.eng+'</td><td>'+fx(l.shots,1)+'</td><td>'+fx(l.pk*100,0)+'%</td><td>'+fx(l.kills,1)+'</td><td>'+fx(l.left,1)+'</td></tr>';}).join('')+'</table></div>'+
      '<div class="lt-note">每次交戰對同一目標發射兩枚；可交戰次數受射控通道、照射器、交戰時間窗與庫存限制；掠海飛彈在雷達水平線內才可被半主動導引飛彈攔截。</div>';}
  ['vAT','vAN','vAA'].forEach(function(k){q(k).onchange=go;});go();};
VPANEL.s.air=function(d,R){if(!R.wing.length)return '<div class="lt-note">未搭載艦載機。</div>';var ops=VL.carrierOps(R),h='<div class="lt-sc"><table class="lt-dt"><tr><th class="l">機型</th><th>架數</th><th>單價</th><th>作戰半徑／航程</th><th class="l">任務</th></tr>'+
  R.wing.map(function(w){var ac=w.ac;return '<tr><td class="l">'+esc(w.d.n)+'</td><td>'+w.n+'</td><td>'+cnD(ac.unit)+'</td><td>'+fx(ac.radius||ac.range||0,0)+' km</td><td class="l lt-note lt-wrap">'+esc((VL.MISS[w.d.miss]||[]).join('、'))+'</td></tr>';}).join('')+'</table></div>';
  h+=kv([['艦載機總數',R.wingN+' 架'+(d.canon&&d.canon.wing?'（完全滿載可搭載 '+d.canon.wing+' 架艦載戰鬥機；目前戰鬥／電戰機 '+R.ftr+' 架）':'')],['機隊造價',dyM(R.wingDy)],ops?['出擊能力','每日持續約 '+fx(ops.daily,0)+' 架次、全力出擊約 '+fx(ops.surge,0)+' 架次（彈射器 '+ops.cats+' 套）']:null]);return h;};
VPANEL.s.cost=function(d,R){var rows=R.em.list.filter(function(e){return e.m.dy;}).map(function(e){return [e.m.n+(e.n>1?' ×'+e.n:''),e.m.dy*e.n];}),h='<h4>造價</h4>'+kv([['首艦',dyM(R.unit)+'（不含彈藥與艦載機）'],['彈藥裝填',dyM(R.ammoCost)],R.wingDy?['艦載機',dyM(R.wingDy)]:null,['學習曲線','每多一倍艘數，單價變為 '+fx(R.lc*100,1)+'%']]);
  if(R.series.length){var tot=0;R.series.forEach(function(s){tot+=s.cost;});h+='<h4>同級艦（'+R.series.length+' 艘，總額 '+cnD(tot)+' '+esc(curN())+'）</h4><div class="lt-sc"><table class="lt-dt"><tr><th>#</th><th class="l">艦名</th><th>舷號</th><th>年份</th><th>造價（'+esc(curN())+'）</th></tr>'+
    R.series.map(function(s,i){return '<tr><td>'+(i+1)+'</td><td class="l">'+esc(s.n)+'號</td><td>'+esc(d.code||'')+' '+s.no+'</td><td>'+s.yr+'</td><td>'+cnD(s.cost)+'</td></tr>';}).join('')+'</table></div>';}
  h+='<div class="lt-sc"><table class="lt-dt"><tr><th class="l">項目</th><th>造價（'+esc(curN())+'）</th></tr>'+rows.map(function(r){return '<tr><td class="l">'+esc(r[0])+'</td><td>'+cnD(r[1])+'</td></tr>';}).join('')+'<tr class="sum"><td class="l">首艦合計</td><td>'+cnD(R.unit)+'</td></tr></table></div>';return h;};
