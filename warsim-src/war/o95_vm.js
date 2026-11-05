/* ===================== 物資與裝備（介面二）：載具型號 =====================
   一份清單：內建型號（含無人機）、LatoVehicle 設計（陸、空、海）、自訂型號，以及各兵種的泛用型號。
   設計就是型號：陸上設計由各區裝甲、機動與主砲彈藥算出型號的數值，空中與海上設計算出載台（換機型、換艦型時用）；
   內建或自訂型號可以改用設計細部計算（以相近的設計為藍本，在 LatoArmory 工具裡修改），設計也可以凍結成自訂型號再手動調整數值。 */
var VMU={dom:'land',cls:'',era:'',q:'',src:'',cur:null,ed:null};
/* 用到的設計存進本局（伺服器與其他玩家沒有 LatoVehicle 運算庫，只用存下來的數值） */
function vmUse(k){if(typeof k!=='string'||k.indexOf('lv:')!==0)return;var m=vdModel(k.slice(3));if(!m)return;G.vms=G.vms||{};var c=clone(m);G.vms[k]=c;if(c.m&&VDW[c.m[0]]){G.wpns=G.wpns||{};G.wpns[c.m[0]]=clone(VDW[c.m[0]]);}if(typeof mpActive==='function'&&mpActive()&&typeof mpRpc==='function')try{mpRpc('vmPut',[c,c.m&&G.wpns&&G.wpns[c.m[0]]||null,vmDesPack(k.slice(3))]);}catch(e){}}
/* 聯機：把設計與它用到的自訂模組、彈藥、材料、導引彈藥一起送給伺服器，由伺服器重算型號 */
function vmDesPack(id){var d=vdesOf(id);if(!d)return null;var o={d:clone(d)},js=JSON.stringify(d),pick=function(src){var r={};if(src)Object.keys(src).forEach(function(k){if(js.indexOf('"'+k+'"')>=0)r[k]=clone(src[k]);});return r;};
  o.mods=pick(G.vmods);o.ammo=pick(G.ammo);o.muns=pick(G.muns);var ms=pick(G.mats);Object.keys(o.ammo).forEach(function(k){var P=o.ammo[k];(P.bom||[]).forEach(function(x){if(G.mats&&G.mats[x[0]])ms[x[0]]=clone(G.mats[x[0]]);});if(P.core&&G.mats&&G.mats[P.core.mat])ms[P.core.mat]=clone(G.mats[P.core.mat]);});o.mats=ms;return o;}
/* 設計改了：存進本局的設計型號重新換算，用到的單位重新換裝 */
(function(){var b=latChanged;latChanged=function(kind){b(kind);if(kind!=='veh'||!G||!G.vms)return;setTimeout(function(){try{VDMC={};var ch=[];Object.keys(G.vms).forEach(function(k){if(k.indexOf('lv:')!==0)return;var m=vdModel(k.slice(3));if(m){vmUse(k);ch.push(k);}});if(ch.length){G._tv=(G._tv||1)+1;vmResync(ch);}}catch(e){}},150);};})();
/* 用到某些型號的單位重新換裝（開戰前；作戰中等休整） */
function vmResync(keys){var n=0;G.units.forEach(function(u){if(!isLeaf(u)||!u.lg)return;var hit=toeRes(u).some(function(e){return keys.indexOf(e.m.k)>=0||e.slot&&keys.indexOf(e.slot.k)>=0;});if(!hit)return;if(G.started&&alive(u)&&!(u.refit&&u.st==='off')){u.vmPend=1;return;}eqSync(u);n++;});return n;}

/* ---------- 二、清單 ---------- */
function vmSrc(m){return m.gen?'gen':m.lv?'lv':m.cus||G.vms&&G.vms[m.k]&&!VM[m.k]?'cus':'in';}
var VMSRCN={in:'內建',lv:'設計',cus:'自訂',gen:'泛用'};
function vmUIAll(){var L=VMR.slice(),seen={};L.forEach(function(m){seen[m.k]=1;});if(G&&G.vms)for(var k in G.vms)if(!seen[k]){L.push(G.vms[k]);seen[k]=1;}
  if(LVL)vdesList().forEach(function(d){var k='lv:'+d.id;if(seen[k])return;var m=vdModel(d.id);if(m){L.push(m);seen[k]=1;}});
  if(VMU.src==='gen'){var ts={};G.units.forEach(function(u){typesOfU(u).forEach(function(q){ts[q[0]]=1;});});Object.keys(UT).forEach(function(k){ts[k]=ts[k]||0;});Object.keys(ts).forEach(function(tk){var t=typeOf(tk);if(!t)return;toeDef(t).v.forEach(function(x){if(seen[x[0]])return;var m=vmOf(x[0]);if(m&&(ts[tk]||!/^g:[a-z]+$/.test(x[0]))){L.push(m);seen[x[0]]=1;}});});}
  return L;}
function vmQ(n){n=String(n||'');return /^「/.test(n)?esc(n):'「'+esc(n)+'」';}
function vmClsN(c){return c==='uas'?'小型無人機':(VEHI[c]||[0,c])[1];}
function vmRoleN(m){return String(m.r||'').split('|').filter(Boolean).map(function(r){return VROLE[r]||r;}).join('、');}
function vmArmTxt(m,max){if(m.arm2&&m.arm2.length)return m.arm2.slice(0,max||4).map(function(x){return esc(x[0])+(x[1]>1?' ×'+fmt(x[1]):'');}).join('、');var A=vmArm(m,false);return A.length?A.slice(0,max||4).map(function(x){var w=wpnOf(x[0]);return esc(w?w.n:x[0])+(x[1]!==1?' ×'+fx(x[1],x[1]%1?1:0):'');}).join('、'):'—';}
function vmSpeedTxt(m){var d=vmDom(m);return m.vr?(d==='sea'||d==='sub'?fmt(m.vr/1.852)+' 節':fmt(m.vr)+(m.vx&&m.vx!==m.vr?'／'+fmt(m.vx):'')+' km/h'):'—';}
function vmListHtml(){var y=catYear(),L=vmUIAll().filter(function(m){var d=vmDom(m);if(VMU.dom&&d!==VMU.dom)return false;if(VMU.cls&&m.c!==VMU.cls)return false;var s=vmSrc(m);if(VMU.src?s!==VMU.src:s==='gen')return false;
    if(VMU.era){var E=VMERA[+VMU.era];if(E&&(m.y<E[0]||m.y>E[1]))return false;}if(VMU.q&&(m.n+' '+(m.nat||'')).indexOf(VMU.q)<0)return false;return true;}).sort(function(a,b){return (a.y||0)-(b.y||0)||(a.n<b.n?-1:1);});
  var cls={};vmUIAll().forEach(function(m){if(vmDom(m)===VMU.dom&&m.c)cls[m.c]=1;});
  var o='<div class="lw-note">載具型號：同一份清單裡有內建型號、LatoVehicle 設計、自訂型號與各兵種的泛用型號。單位的「編制裝備」可以把泛用的車換成任何合適的型號，也可以加入額外的車與無人機；空中與海上部隊換機型、艦型。型號的武裝、裝甲、速度、油耗與造價都會進入作戰計算。</div>'+
    '<div class="lw-row" style="flex-wrap:wrap">'+Object.keys(VMDOMN).map(function(d){return '<button type="button" class="lw-btn sm'+(VMU.dom===d?' pri':'')+'" data-a="vudom" data-v="'+d+'">'+VMDOMN[d]+'</button>';}).join('')+'</div>'+
    '<div class="lw-row" style="flex-wrap:wrap"><label>類別 <select data-c="vucls"><option value="">全部</option>'+Object.keys(cls).map(function(c){return '<option value="'+c+'"'+(VMU.cls===c?' selected':'')+'>'+esc(vmClsN(c))+'</option>';}).join('')+'</select></label>'+
    '<label>年代 <select data-c="vuera"><option value="">全部</option>'+VMERA.map(function(E,i){return '<option value="'+i+'"'+(String(VMU.era)===String(i)?' selected':'')+'>'+E[2]+'</option>';}).join('')+'</select></label>'+
    '<label>來源 <select data-c="vusrc"><option value="">內建、設計與自訂</option>'+['in','lv','cus','gen'].map(function(s){return '<option value="'+s+'"'+(VMU.src===s?' selected':'')+'>'+VMSRCN[s]+'</option>';}).join('')+'</select></label>'+
    '<label>搜尋 <input type="text" value="'+esc(VMU.q)+'" data-c="vuq" style="width:8em"></label><button type="button" class="lw-btn sm pri" data-a="vunew">＋新增自訂型號</button></div>';
  o+='<div class="lw-sc" style="max-height:52vh;overflow:auto"><table class="lw-tbl"><tr><th>型號</th><th class="n">年代</th><th>武裝</th><th class="n">裝甲</th><th class="n">速度</th><th class="n">單價</th><th></th></tr>';
  var use=vmUseCount();L.forEach(function(m){var s=vmSrc(m);o+='<tr'+(m.y>y?' class="lw-dim"':'')+' title="'+esc(m.d||'')+'"><td>'+esc(m.n)+(s!=='in'?catPill(VMSRCN[s]):'')+(m.exp?catPill('一次性'):'')+(use[m.k]?catPill(use[m.k]+' 個單位'):'')+'<br><span class="lw-note">'+[m.nat,vmClsN(m.c),vmRoleN(m)].filter(Boolean).map(esc).join('・')+'</span></td><td class="n">'+(m.y||'—')+'</td><td class="w">'+vmArmTxt(m,3)+'</td>'+
    '<td class="n">'+(vmDom(m)==='land'&&(m.arm||m.armC)?fx(m.arm,1)+(m.armC!==undefined&&m.armC!==m.arm?'／'+fx(m.armC,1):''):'—')+'</td><td class="n">'+vmSpeedTxt(m)+'</td><td class="n">'+(m.usd?usdTxt(m.usd):'—')+'</td><td><button type="button" class="lw-btn sm" data-a="vuopen" data-v="'+esc(m.k)+'">詳細</button></td></tr>';});
  return o+'</table></div>'+(L.length?'':'<div class="lw-note">沒有符合條件的型號。</div>');}
/* 每個型號有幾個單位在用 */
function vmUseCount(){var o={};G.units.forEach(function(u){if(!isLeaf(u)||u.st==='dead')return;try{toeRes(u).forEach(function(e){if(e.m!==e.slot||!e.slot)o[e.m.k]=(o[e.m.k]||0)+1;});}catch(e){}});return o;}
ACT.vudom=function(b){VMU.dom=b.getAttribute('data-v');VMU.cls='';VMU.cur=null;VMU.ed=null;catRe();};
CHG.vucls=function(t){VMU.cls=t.value;catRe();};CHG.vuera=function(t){VMU.era=t.value;catRe();};CHG.vusrc=function(t){VMU.src=t.value;catRe();};CHG.vuq=function(t){VMU.q=t.value.trim();catRe();};
ACT.vuopen=function(b){VMU.cur=b.getAttribute('data-v');VMU.ed=null;catRe();};
ACT.vuback=function(){VMU.cur=null;VMU.ed=null;catRe();};

/* ---------- 三、型號卡片 ---------- */
function vmCardHtml2(m){var s=vmSrc(m),d=vmDom(m),y=catYear(),o='<div class="lw-row"><button type="button" class="lw-btn sm" data-a="vuback">← 型號清單</button></div><h4 style="margin:6px 0 2px">'+esc(m.n)+catPill(VMSRCN[s])+(m.exp?catPill('一次性'):'')+'</h4><div class="lw-note">'+[m.nat,m.y?m.y+' 年':'',vmClsN(m.c),vmRoleN(m)].filter(Boolean).map(esc).join('・')+(m.y>y?'（晚於作戰年代 '+y+' 年）':'')+'</div>'+(m.d?'<div class="lw-note">'+esc(m.d)+'</div>':'');
  o+='<div class="lw-kv">'+(m.cr||m.px?'<span>乘員</span><span>'+fmt(m.cr||0)+' 人'+(m.px?'＋載員 '+fmt(m.px)+' 人':'')+'</span>':'')+(m.t?'<span>重量</span><span>'+fx(m.t,1)+' 噸</span>':'')+
    (d==='land'?'<span>裝甲</span><span>動能 '+fx(m.arm||0,1)+'、化學能 '+fx(m.armC!==undefined?m.armC:m.arm||0,1)+'（等級；正面、側面、後方加權）</span>':'')+(m.vr?'<span>速度</span><span>'+vmSpeedTxt(m)+'</span>':'')+
    (m.fu?'<span>油料</span><span>油箱 '+fmt(m.fu)+' 公升'+(m.lk?'、每百公里 '+fmt(m.lk)+' 公升':'')+'</span>':vmLc(m)===''&&d==='uas'?'<span>動力</span><span>電池（不耗油料）</span>':'')+
    (m.usd?'<span>單價</span><span>'+amoney(m.usd)+'</span>':'')+(m.nj?'<span>抗干擾</span><span>不受無線電干擾</span>':'')+'</div>';
  if(m.plat&&m.tt){var T=m.tt;o+='<h4 style="margin:8px 0 2px;font-size:13px">作戰數值（每'+(T.vn||'架').charAt(0)+'）</h4><div class="lw-kv"><span>空戰／防空</span><span>'+fx(T.aa,1)+'</span><span>對人／對裝甲</span><span>'+fx(T.sa,1)+'／'+fx(T.ha,1)+'</span>'+(T.end?'<span>續航</span><span>'+fx(T.end,1)+' 小時</span>':'')+'<span>觀測</span><span>'+kmTxt(T.spot)+'</span>'+(T.msl?'<span>飛彈</span><span>'+esc(T.msl.nm)+' '+T.msl.n+' 枚（射程 '+kmTxt(T.msl.r)+'）</span>':'')+'</div>';}
  if(m.gen&&m.plat){var bt=typeOf(m.tk);if(bt)o+='<div class="lw-note">這是「'+esc(bt.n)+'」的載台：空戰 '+fx(bt.aa,1)+'、對人 '+fx(bt.sa,1)+'、對裝甲 '+fx(bt.ha,1)+'、速度 '+fmt(bt.vr)+' km/h。</div>';}
  var A=vmArm(m,false);o+='<h4 style="margin:8px 0 2px;font-size:13px">武裝（每輛）</h4>';
  if(m.arm2&&m.arm2.length)o+='<div class="lw-note">'+m.arm2.map(function(x){return esc(x[0])+(x[1]>1?' ×'+fmt(x[1]):'');}).join('、')+'</div>';
  else o+=A.length?'<table class="lw-tbl"><tr><th>武器</th><th>類別</th><th class="n">數量</th><th class="n">對人</th><th class="n">對裝甲</th><th class="n">穿甲</th></tr>'+A.map(function(x,i){var w=wpnOf(x[0])||{n:x[0]};return '<tr><td>'+(i===0&&m.m?'<b>':'')+esc(w.n)+(i===0&&m.m?'</b>（主武器）':'')+(wIsMg(x[0])&&!m.gen?' <span class="lw-note">＊</span>':'')+'</td><td>'+esc(wCatN(w.cat||''))+'</td><td class="n">'+fx(x[1],x[1]%1?1:0)+'</td><td class="n">'+fx(w.pP,2)+'</td><td class="n">'+fx(w.pA,2)+'</td><td class="n">'+fx(w.pen,1)+'</td></tr>';}).join('')+'</table>'+(A.some(function(x){return wIsMg(x[0]);})&&!m.gen?'<div class="lw-note">＊ 換掉泛用的車時，車上機槍的火力沿用兵種標準（不重複計算）；另外加入的車整套都算。</div>':''):'<div class="lw-note">沒有武裝。</div>';
  var E=(m.e||[]).filter(function(x){return seqOf(x[0]);});if(E.length)o+='<h4 style="margin:8px 0 2px;font-size:13px">車載裝備</h4><div class="lw-note">'+E.map(function(x){return esc(seqOf(x[0]).n)+(x[1]!==1?' ×'+fx(x[1],x[1]%1?1:0):'');}).join('、')+'</div>';
  var ad=(m.ad||[]).map(function(k){return VAD[k];}).filter(Boolean),op=(m.op||[]).map(function(k){return VAD[k];}).filter(Boolean);if(ad.length||op.length)o+='<h4 style="margin:8px 0 2px;font-size:13px">加掛</h4><div class="lw-note">'+(ad.length?'原廠：'+ad.map(function(a){return esc(a.n);}).join('、'):'')+(op.length?(ad.length?'；':'')+'可選：'+op.map(function(a){return esc(a.n);}).join('、'):'')+'</div>';
  if(m.lv){var dd=vdesOf(m.lv);o+='<h4 style="margin:8px 0 2px;font-size:13px">設計</h4><div class="lw-note">這個型號由 LatoVehicle 設計'+vmQ(dd?dd.n:m.lv)+'算出：改設計（模組、裝甲、主砲、彈藥），型號與用它的單位跟著重算。</div>'+(dd&&LVL?vdDetHtml(dd):'');}
  var U=vmUsers(m.k);if(U.length)o+='<div class="lw-note">使用中：'+U.slice(0,6).map(esc).join('、')+(U.length>6?' 等 '+U.length+' 處':'')+'</div>';
  o+='<div class="lw-row" style="flex-wrap:wrap;margin-top:6px">';
  if(s==='cus')o+='<button type="button" class="lw-btn sm pri" data-a="vuedit">編輯</button><button type="button" class="lw-btn sm dng" data-a="vudel">刪除</button>';
  if(!m.plat||s!=='gen')o+='<button type="button" class="lw-btn sm" data-a="vucopy">複製為自訂型號</button>';
  if(m.lv&&LVL)o+='<button type="button" class="lw-btn sm" data-a="vulat">在 LatoArmory 修改設計</button>';
  else if(LVL&&s!=='gen'&&vdTplFor(m).length)o+='<label class="lw-note">以設計細部計算：<select data-k="vutpl">'+vdTplFor(m).map(function(d2){return '<option value="'+esc(d2.id)+'">'+esc(d2.n)+'</option>';}).join('')+'</select></label><button type="button" class="lw-btn sm" data-a="vudes">建立設計</button>';
  o+='</div>';if(s!=='gen')o+=vmMktHtml(m);return o;}
/* 設計的細節：各區裝甲（等效 RHA）與量產成本 */
function vdDetHtml(d){var R=vcalc(d),rate=CUR.rate||2.5,o='';if(!R||R.err)return '';
  if(d.br==='l'&&R.zones){o+='<h4 style="margin:8px 0 4px;font-size:13px">各區裝甲（等效 RHA）</h4><table class="lw-tbl"><tr><th>區域</th><th class="n">動能</th><th class="n">化學能</th></tr>';var C=vctx(),ref=LALP.t120m829a1;
    Object.keys(R.zones).forEach(function(z){var I=R.zones[z][0];if(!I)return;var q=null;try{q=LVL.zoneEq(I.L,C,ref);}catch(e){}o+='<tr><td>'+esc(LVL.ZN[z]||z)+'</td><td class="n">'+(q?(isFinite(q.ke)?fmt(q.ke):'>'+fmt(q.keMin))+' mm':'—')+'</td><td class="n">'+(q?(isFinite(q.ce)?fmt(q.ce)+' mm':'無法擊穿'):'—')+'</td></tr>';});o+='</table>';}
  if(R.ammoCost||R.costYear)o+='<div class="lw-note">'+(R.ammoCost?'彈藥基數 '+amoney(R.ammoCost*rate):'')+(R.costYear?'；年維持費 '+amoney(R.costYear*rate):'')+'</div>';
  if(d.qty){try{var S=LVL.seriesCost((R.unit||0)*rate,d.qty,d.lc||0.9);o+='<div class="lw-note">量產 '+fmt(d.qty)+' 輛（學習曲線 '+pct((d.lc||0.9)*100)+'）：首輛 '+amoney(S.first)+'、平均 '+amoney(S.avg)+'、總計 '+amoney(S.total)+'</div>';}catch(e){}}return o;}
/* 建立單位類型：數量與名稱 */
function vmMktHtml(m){var d=m.lv&&vdesOf(m.lv),dm=vmDom(m);if(d&&d.br==='a'&&(d.ty==='trn'||d.ty==='cod'))return '<div class="lw-note">運輸機用於後勤空運，不建立作戰單位類型。</div>';
  var air=dm==='air'||m.plat&&dm==='uas',sea=dm==='sea'||dm==='sub',n=air||sea?(d&&VDN[d.ty])||(m.tt&&m.tt.veh)||(air?12:1):dm==='uas'?(m.exp?60:6):/spg|spaa/.test(m.r||'')?6:14,unit=air?'架':sea?'艘':'輛',suf=air?'中隊':sea?'分隊':'連';
  return '<h4 style="margin:8px 0 4px;font-size:13px">建立單位類型</h4><div class="lw-row"><label>'+(air?'每中隊':sea?'每分隊':'每連')+' <input type="number" min="1" max="200" value="'+n+'" data-k="vun" style="width:56px"> '+unit+'</label><label>名稱 <input type="text" value="'+esc(String(m.n).replace(/（.*?）/g,'').replace(/^[A-Za-z0-9.\/]+\s*/,'')+suf)+'" data-k="vunm" style="width:16em"></label><button type="button" class="lw-btn sm pri" data-a="vumkt">建立</button></div>';}
/* 哪些單位、類型與制式裝備用到這個型號 */
function vmUsers(k){var o=[];G.units.forEach(function(u){if(!isLeaf(u)||u.st==='dead')return;try{if(toeRes(u).some(function(e){return e.m.k===k&&(e.m!==e.slot||!e.slot);}))o.push(uName(u));}catch(e){}});
  G.sides.forEach(function(S){var F=S.fld;if(F&&F.v)for(var r in F.v)if(F.v[r]===k)o.push(S.name+'制式（'+(VROLE[r]||r)+'）');});
  if(G.toe)Object.keys(G.toe).forEach(function(tk){if(JSON.stringify(G.toe[tk].v).indexOf('"'+k+'"')>=0)o.push('類型「'+(typeOf(tk)||{n:tk}).n+'」');});return o;}
/* 可以拿來當藍本的設計（同一類） */
function vdTplFor(m){if(!LVL)return [];var d=vmDom(m);if(d==='uas'&&!m.plat)return [];var br=d==='land'?'l':d==='sea'||d==='sub'?'s':'a';return vdesList().filter(function(x){if(x.br!==br)return false;if(br==='l')return (VDCLS[x.ty]||'')===m.c||String(m.r||'').split('|').some(function(r){return String(VDROLE[x.ty]||'').split('|').indexOf(r)>=0;});return d!=='uas'||x.ty==='uav';});}
ACT.vucopy=function(){var m=vmOf(VMU.cur);if(!m)return;var c=clone(m);G.vmseq=(G.vmseq||0)+1;var k='cv'+G.vmseq;while(VM[k]||G.vms&&G.vms[k]){G.vmseq++;k='cv'+G.vmseq;}c.k=k;c.n=m.n.replace(/（泛用）|（.*?・標準）/,'')+'（自訂）';c.cus=1;c.from=/^cv/.test(m.k)?(m.from||''):m.k;delete c.gen;delete c.lv;delete c.aT;delete c.eT;delete c.nT;delete c.tk;
  if(m.gen&&m.tk){c.dom=vmDom(m);}if(c.m&&VDW[c.m[0]]){G.wpns=G.wpns||{};G.wpns[c.m[0]]=clone(VDW[c.m[0]]);}VMU.ed=c;VMU.cur=k;catRe();};
ACT.vuedit=function(){var m=G.vms&&G.vms[VMU.cur];if(m){VMU.ed=clone(m);catRe();}};
ACT.vudel=function(){var k=VMU.cur,m=G.vms&&G.vms[k];if(!m)return;var U=vmUsers(k);if(!confirm('刪除「'+m.n+'」？'+(U.length?'使用中的 '+U.length+' 處會改回泛用型號。':'')))return;delete G.vms[k];G.sides.forEach(function(S){var F=S.fld;if(F&&F.v)for(var r in F.v)if(F.v[r]===k)delete F.v[r];});
  G._tv=(G._tv||1)+1;G.units.forEach(function(u){if(u.vm&&u.vm.m===k)delete u.vm;if(u.toe){var o=toeClean(u.toe);if(o)u.toe=o;else delete u.toe;}if(u.lg&&isLeaf(u))eqSync(u);});VMU.cur=null;catRe();};
ACT.vulat=function(){var m=vmOf(VMU.cur),d=m&&m.lv&&vdesOf(m.lv);if(!d)return;G.laVs=Object.assign({},G.laVs||{},{br:d.br,id:d.id});AR.latT='veh';armoryDlg('lat');};
/* 以相近的設計為藍本建立這個型號的設計（複製到本局，之後在 LatoArmory 工具裡修改） */
ACT.vudes=function(){var m=vmOf(VMU.cur),sel=UI.wdlg&&UI.wdlg.querySelector('[data-k="vutpl"]'),src=sel&&vdesOf(sel.value);if(!m||!src)return;var d=clone(src),id='u'+Date.now().toString(36);d.id=id;d.n=m.n.replace(/（自訂）$/,'')+'（設計）';d.code=d.code||'';if(m.y)d.yr=m.y;if(m.nat)d.nat=m.nat;delete d._u;delete d._v;
  G.vdes=G.vdes||{};G.vdes[id]=d;VDMC={};VMU.cur='lv:'+id;VMU.ed=null;toast('已建立設計「'+d.n+'」（以「'+src.n+'」為藍本）。到「LatoArmory 工具」的載具設計修改模組、裝甲與主砲，型號會跟著重算。',6000);catRe();};
/* 建立使用這個型號的單位類型：地面型號找同角色、年代相近的兵種為範本；空中與海上建立載台類型 */
ACT.vumkt=function(){var m=vmOf(VMU.cur);if(!m)return;vmUse(m.k);var T=null,dlg2=UI.wdlg,ni=dlg2&&dlg2.querySelector('[data-k="vun"]'),nm=dlg2&&dlg2.querySelector('[data-k="vunm"]'),cnt=ni?clamp(Math.round(+ni.value||1),1,200):0,name=nm?String(nm.value||'').slice(0,40):'';
  if(m.plat||vmDom(m)==='air'||vmDom(m)==='sea'||vmDom(m)==='sub'){if(!m.tt){toast('這個型號沒有載台數值，無法建立類型。');return;}T=platType(m.k,cnt||m.tt.veh||VDN[m.c]||12);if(T&&name)T.n=name;}
  else{var roles=String(m.r||'').split('|'),y=m.y||catYear(),best=null,bd=1e9;Object.keys(UT).forEach(function(k){var t=UT[k];if((ERAI[t.era]||{}).fan)return;var A=tAttr(t);if(!A.P)return;var slot=vmOf('g:'+k+':'+A.P);if(!slot||!vmFitsSlot(m,slot))return;var dd=Math.abs((ERAI[t.era]||ERA[6]).y-y);if(dd<bd){bd=dd;best=t;}});
    if(!best&&vmDom(m)==='uas'){best=UT.fp2020;}if(!best){toast('找不到可以使用這個型號的兵種。');return;}
    var t=clone(best);G.types=G.types||{};var k='c'+((G.tseq=(G.tseq||0)+1));t.k=k;t.cus=1;t.n=name||best.n+'（'+m.n.replace(/（.*?）/g,'')+'）';delete t.load;if(cnt&&cnt!==best.veh){var mr=(best.men||0)/Math.max(1,best.veh||1);t.men=Math.max(1,Math.round(t.men+(cnt-best.veh)*Math.min(mr,best.br==='arm'?4:mr)));t.veh=cnt;}G.types[k]=t;G._tv=(G._tv||1)+1;
    var D=toeClean(toeDef(t));D.v.forEach(function(x){var s=vmOf(x[0]);if(s&&s.gen&&vmFitsSlot(m,s))x[2]={m:m.k};});t.toe=D;T=t;}
  if(!T){toast('無法建立類型。');return;}G._tv=(G._tv||1)+1;toast('已建立單位類型「'+T.n+'」：可以在「兵力編成」的「＋單位」使用（在清單最上方）。',6000);catRe();};

/* ---------- 四、編輯自訂型號 ---------- */
var VMCLS={land:['tk1','tkm','tkh','mbt','ht','apc','ifv','car','recv','spg','mrlv','ewv','truck','wagon','cart'],uas:['uas'],air:['plane','jet','helo','airship'],sea:['ship','sail'],sub:['subm']};
function vmEdHtml(){var m=VMU.ed,d=vmDom(m),y=catYear(),N=function(f,lab,step,w){return '<label>'+lab+' <input type="number" step="'+(step||'any')+'" value="'+esc(m[f]===undefined?'':m[f])+'" data-c="vuf" data-f="'+f+'" style="width:'+(w||5)+'em"></label>';};
  var o='<div class="lw-row"><button type="button" class="lw-btn sm" data-a="vuback">← 型號清單</button></div><h4 style="margin:6px 0">編輯自訂型號</h4>';
  if(m.plat)o+='<div class="lw-note">這是空中或海上的載台：作戰數值來自原本的設計或兵種（可以改名稱、年代、國別、造價與說明）。要改性能請改用設計細部計算。</div>';
  var B=rlVmBase(m),RO=function(l,v){return '<span class="lw-note" style="margin-right:10px">'+l+' <b>'+v+'</b></span>';};
  o+='<div class="lw-note">自訂型號以「'+esc(B?B.n:'—')+'」為藍本：可以改名稱、國別、說明，在同類武器之間換裝、加裝副武器（最多多兩件）與車載裝備，造價隨換裝的差價計算。裝甲、速度、重量、乘員與油耗沿用藍本；要改這些，請用下面的「設計細部計算」做一份載具設計。</div>';
  o+='<div class="lw-row" style="flex-wrap:wrap"><label>名稱 <input type="text" value="'+esc(m.n)+'" data-c="vuf" data-f="n" style="width:14em"></label><label>國別 <input type="text" value="'+esc(m.nat||'')+'" data-c="vuf" data-f="nat" style="width:6em"></label>'+N('y','年代（不早於藍本）',1,5)+RO('單價',typeof amoney==='function'?amoney(m.usd||0):fmt(m.usd||0))+'</div>';
  if(!m.plat){o+='<div class="lw-row" style="flex-wrap:wrap">'+RO('領域',VMDOMN[d]||d)+RO('類別',esc(vmClsN(m.c)))+RO('乘員',m.cr||0)+RO('載員',m.px||0)+RO('重量',fx(m.t||0,1)+' 噸')+'</div>';
    o+='<div class="lw-row" style="flex-wrap:wrap"><span class="lw-note">角色（可以取代哪些泛用的車）：</span>'+Object.keys(VROLE).filter(function(r){return d==='uas'?/fpv|loit|suas/.test(r):!/fpv|loit|suas/.test(r);}).map(function(r){var on=('|'+(m.r||'')+'|').indexOf('|'+r+'|')>=0;return '<label><input type="checkbox" data-c="vurole" data-v="'+r+'"'+(on?' checked':'')+'>'+esc(VROLE[r])+'</label>';}).join('')+'</div>';
    if(d==='land')o+='<div class="lw-row" style="flex-wrap:wrap">'+RO('動能裝甲',fx(m.arm||0,1))+RO('化學能裝甲',fx(m.armC||0,1))+RO('公路',(m.vr||0)+' km/h')+RO('越野',(m.vx||0)+' km/h')+RO('油箱',fmt(m.fu||0)+' 公升')+RO('油耗',(m.lk||0)+'／百公里')+'</div>';
    else o+='<div class="lw-row" style="flex-wrap:wrap">'+RO('速度',(m.vr||0)+' km/h')+(m.exp?RO('一次性','是'):'')+(m.nj?RO('光纖導控','是'):'')+'</div>';
    var A=[];if(m.m)A.push(m.m);(m.s||[]).forEach(function(x){A.push(x);});var wo=vmWOpts();
    o+='<h4 style="margin:8px 0 2px;font-size:13px">武裝（每輛；第一列是主武器）</h4><table class="lw-tbl">'+A.map(function(x,i){return '<tr><td><select data-c="vuw" data-v="'+i+'">'+wo.replace('value="'+x[0]+'"','value="'+x[0]+'" selected')+'</select></td><td><input type="number" min="0" max="500" step="any" value="'+x[1]+'" data-c="vuwn" data-v="'+i+'" style="width:5em"></td><td><button type="button" class="lw-btn sm dng" data-a="vuwdel" data-v="'+i+'">移除</button></td></tr>';}).join('')+'</table><div class="lw-row"><button type="button" class="lw-btn sm" data-a="vuwadd">＋武裝</button></div>';
    var eo=vmEOpts();o+='<h4 style="margin:8px 0 2px;font-size:13px">車載裝備（每輛）</h4><table class="lw-tbl">'+(m.e||[]).map(function(x,i){return '<tr><td><select data-c="vue" data-v="'+i+'">'+eo.replace('value="'+x[0]+'"','value="'+x[0]+'" selected')+'</select></td><td><input type="number" min="0" max="50" step="any" value="'+x[1]+'" data-c="vuen" data-v="'+i+'" style="width:4em"></td><td><button type="button" class="lw-btn sm dng" data-a="vuedel" data-v="'+i+'">移除</button></td></tr>';}).join('')+'</table><div class="lw-row"><button type="button" class="lw-btn sm" data-a="vueadd">＋裝備</button></div>';
    if(d==='land'){var y2=Math.max(y,m.y||0);o+='<h4 style="margin:8px 0 2px;font-size:13px">加掛</h4><div class="lw-row" style="flex-wrap:wrap">'+VADR.map(function(r){return VAD[r[0]];}).filter(function(a){return a&&a.y<=y2+20;}).map(function(a){var v=(m.ad||[]).indexOf(a.k)>=0?'ad':(m.op||[]).indexOf(a.k)>=0?'op':'';return '<label>'+esc(a.n)+' <select data-c="vuad" data-v="'+a.k+'"><option value="">—</option><option value="ad"'+(v==='ad'?' selected':'')+'>原廠</option><option value="op"'+(v==='op'?' selected':'')+'>可選</option></select></label>';}).join('')+'</div>';}}
  o+='<label style="display:block">說明<br><textarea data-c="vuf" data-f="d" rows="2" style="width:100%">'+esc(m.d||'')+'</textarea></label>';
  return o+'<div class="lw-row"><button type="button" class="lw-btn pri" data-a="vusave">儲存型號</button><button type="button" class="lw-btn" data-a="vuback">取消</button></div>';}
function vmWOpts(){var cats={};wpnListM(false).concat(wpnListP().filter(function(w){return /機槍|反裝甲|步兵支援|防空/.test(w.cat);})).forEach(function(w){(cats[wCatN(w.cat)]=cats[wCatN(w.cat)]||[]).push(w);});
  return Object.keys(cats).map(function(c){return '<optgroup label="'+esc(c)+'">'+cats[c].sort(function(a,b){return a.y-b.y;}).map(function(w){return '<option value="'+w.k+'">'+esc(w.n)+'（'+(w.y||'—')+'）</option>';}).join('')+'</optgroup>';}).join('');}
function vmEOpts(){var cats={};seqList().forEach(function(e){(cats[e.cat]=cats[e.cat]||[]).push(e);});return Object.keys(cats).map(function(c){return '<optgroup label="'+esc(c)+'">'+cats[c].map(function(e){return '<option value="'+e.k+'">'+esc(e.n)+'（'+e.y+'・'+({m:'人員',v:'車輛',u:'單位'})[e.cov]+'）</option>';}).join('')+'</optgroup>';}).join('');}
CHG.vuf=function(t){var m=VMU.ed,f=t.getAttribute('data-f');if(!m)return;if(f==='n'||f==='nat'||f==='d')m[f]=String(t.value||'').slice(0,f==='d'?400:40);else if(f==='exp'||f==='nj'){if(t.checked)m[f]=1;else delete m[f];}else if(f==='dom'){m.dom=t.value;m.c=(VMCLS[m.dom]||VMCLS.land)[0];if(m.dom==='uas'){m.lc='';m.r='fpv';}else{delete m.lc;m.r='tank';}catRe();}else if(f==='c'){m.c=t.value;}else m[f]=+t.value||0;};
CHG.vurole=function(t){var m=VMU.ed,r=t.getAttribute('data-v'),L=String(m.r||'').split('|').filter(function(x){return x&&x!==r;});if(t.checked)L.push(r);m.r=L.join('|');};
function vuArr(m){var A=[];if(m.m)A.push(m.m);(m.s||[]).forEach(function(x){A.push(x);});return A;}
function vuSetArr(m,A){m.m=A.length?A[0]:null;m.s=A.slice(1);}
CHG.vuw=function(t){var m=VMU.ed,A=vuArr(m);A[+t.getAttribute('data-v')][0]=t.value;vuSetArr(m,A);};CHG.vuwn=function(t){var m=VMU.ed,A=vuArr(m);A[+t.getAttribute('data-v')][1]=clamp(+t.value||0,0,500);vuSetArr(m,A);};
ACT.vuwdel=function(b){var m=VMU.ed,A=vuArr(m);A.splice(+b.getAttribute('data-v'),1);vuSetArr(m,A);catRe();};ACT.vuwadd=function(){var m=VMU.ed,A=vuArr(m);A.push([vmDom(m)==='uas'?'fpv':'gpmg',1]);vuSetArr(m,A);catRe();};
CHG.vue=function(t){VMU.ed.e[+t.getAttribute('data-v')][0]=t.value;};CHG.vuen=function(t){VMU.ed.e[+t.getAttribute('data-v')][1]=clamp(+t.value||0,0,50);};
ACT.vuedel=function(b){VMU.ed.e.splice(+b.getAttribute('data-v'),1);catRe();};ACT.vueadd=function(){(VMU.ed.e=VMU.ed.e||[]).push(['smk',1]);catRe();};
CHG.vuad=function(t){var m=VMU.ed,k=t.getAttribute('data-v');m.ad=(m.ad||[]).filter(function(x){return x!==k;});m.op=(m.op||[]).filter(function(x){return x!==k;});if(t.value==='ad')m.ad.push(k);else if(t.value==='op')m.op.push(k);};
ACT.vusave=function(){var m=vmCleanM(VMU.ed),RN=[];if(!m||!rlVm(m,RN)){toast('型號資料不完整。');return;}if(RN.length)toast(RN.join('；'),6000);G.vms=G.vms||{};G.vms[m.k]=m;G._tv=(G._tv||1)+1;if(typeof mpActive==='function'&&mpActive()&&typeof mpRpc==='function')try{mpRpc('vmPut',[m,null]);}catch(e){}
  var n=vmResync([m.k]);VMU.ed=null;VMU.cur=m.k;toast('已儲存「'+m.n+'」'+(n?'，'+n+' 個單位已換裝':'')+'。',3500);catRe();};

CATF.vm={h:function(){if(VMU.ed)return vmEdHtml();var m=VMU.cur&&vmOf(VMU.cur);return m?vmCardHtml2(m):vmListHtml();}};
