/* ===================== 編制檔（.latoorbat.json）：匯出一方或某個編制（含所有下級），連同用到的自訂單位類型、自訂武器與圖片；
   匯入到任一方時重新編號，類型與武器若與現有的相同就共用，不同就另立新代號，不會覆蓋對方已有的設定 ===================== */
var ORBFMT='LatoWarOrbat';
/* 匯出的單位欄位（編制與設定；位置、命令、補給存量等戰場狀態不匯出） */
var ORBKEEP=['name','ech','mix','hq','img','off','note','tpl','ix','pk','exp','trn','prof','ttl','ttlAuto','elite','founded','nmLock','hpre','aip','pol','irr','ration','femR','artRole'];
/* 依鍵排序的 JSON，用來比較兩個定義是否相同 */
function stab(o){if(o===null||typeof o!=='object')return JSON.stringify(o);if(Array.isArray(o))return '['+o.map(stab).join(',')+']';return '{'+Object.keys(o).filter(function(k){return o[k]!==undefined;}).sort().map(function(k){return JSON.stringify(k)+':'+stab(o[k]);}).join(',')+'}';}
function orbSameDef(a,b){var x=clone(a),y=clone(b);delete x.k;delete y.k;return stab(x)===stab(y);}
/* 一方的最上層、或指定單位，連同全部下級（依指揮鏈先後排列：上級一定在下級之前） */
function orbCollect(side,ids){var roots=ids&&ids.length?ids.map(uById).filter(Boolean):G.units.filter(function(u){return u.side===side&&(u.p<0||!uById(u.p));}),L=[],seen={};
  roots.forEach(function w(u){if(seen[u.id])return;seen[u.id]=1;if(isLeaf(u)&&u.st==='dead')return;L.push(u);kidsOf(u).forEach(w);});return L;}
function orbExport(side,ids,opt){opt=opt||{};var L=orbCollect(side,ids),imgs={},imgN=0,types={},wpns={},idm={},n=0,keepMor=opt.state||!G.started;
  var imgKey=function(src){if(!src||typeof src!=='string')return '';if(src.indexOf('data:')!==0)return '';for(var k in imgs)if(imgs[k]===src)return '@'+k;var k2='i'+(++imgN);imgs[k2]=src;return '@'+k2;};
  var useW=function(k){if(G.wpns&&G.wpns[k]&&!wpns[k])wpns[k]=clone(G.wpns[k]);};
  var useT=function(k){if(G.types&&G.types[k]&&!types[k]){var t=clone(G.types[k]);if(t.img)t.img=imgKey(t.img);types[k]=t;((t.load&&t.load.w)||[]).forEach(function(x){useW(x[0]);});}};
  L.forEach(function(u){idm[u.id]=++n;});
  var out=L.map(function(u){var o={id:idm[u.id],p:u.p>=0&&idm[u.p]?idm[u.p]:0};ORBKEEP.forEach(function(k){var v=u[k];if(v===undefined||v===null||v==='')return;o[k]=clone(v);});
    if(o.aip)delete o.aip._P;if(u.img){o.img=imgKey(u.img);if(!o.img)delete o.img;}(u.mix||[]).forEach(function(m){useT(m[0]);});if(u.hq)useT(u.hq);
    if(keepMor&&u.mor!==undefined)o.mor=Math.round(u.mor);
    if(u.lg){var g=u.lg;o.lg={w:clone(g.w||[]),v:clone(g.v||[]),h:g.h,rk:clone(g.rk),basic:g.basic,daily:g.daily};o.lg.w.forEach(function(x){useW(x[0]);});}
    if(opt.state&&isLeaf(u)){o.str=u.men0>0?Math.round(u.men/u.men0*1000)/1000:1;o.vstr=u.veh0>0?Math.round(u.veh/u.veh0*1000)/1000:1;}
    return o;});
  var top=L[0],nm=ids&&ids.length===1&&top?top.name:G.sides[side].name;
  return {format:ORBFMT,v:1,saved:new Date().toISOString(),name:nm||'',year:(G.set&&G.set.y)||0,from:{map:G.map?G.map.name:'',side:G.sides[side].name,color:G.sides[side].color,whole:!(ids&&ids.length)},state:!!opt.state,units:out,types:types,wpns:wpns,imgs:imgs};}
/* 檔案檢查：格式、單位數、上級參照（不可指向自己或形成循環） */
function orbCheck(D){if(!D||typeof D!=='object')return '不是編制檔。';if(D.format!==ORBFMT)return D.format==='LatoWarSave'||D.format==='LatoWarReplay'?'這是存檔或回放檔，不是編制檔。':'不是編制檔（格式標記不符）。';
  if(!Array.isArray(D.units)||!D.units.length)return '檔案裡沒有任何單位。';if(D.units.length>30000)return '單位太多（'+D.units.length+' 個），超過 30000 個。';
  var ids={};for(var i=0;i<D.units.length;i++){var o=D.units[i];if(!o||typeof o!=='object'||!(o.id>0))return '第 '+(i+1)+' 個單位缺少編號。';if(ids[o.id])return '單位編號重複：'+o.id;ids[o.id]=o;}
  for(var j=0;j<D.units.length;j++){var q=D.units[j],seen={},c=q;while(c&&c.p){if(seen[c.id])return '編制有循環（單位 '+q.id+'）。';seen[c.id]=1;var P=ids[c.p];if(!P)break;if(P.mix)return '單位 '+c.id+' 的上級是末端單位。';c=P;}}
  return null;}
function orbSafeImg(s){return typeof s==='string'&&/^data:image\/(png|jpeg|gif|webp|svg\+xml);base64,[A-Za-z0-9+\/=]+$/.test(s)&&s.length<3e6?s:'';}
/* 匯入：side＝要加入的一方；parent＝放在哪個編制之下（-1＝最上層）；opt.replace＝先刪除這一方原有的全部部隊（只限開戰前） */
/* 武器與自訂單位類型合併到本局：定義相同就共用，代號衝突或改過內建武器就另立新代號（編制檔與武器裝備檔共用） */
function armsMerge(D,warn){var imgs=D.imgs||{};
  var img=function(s){if(typeof s!=='string'||!s)return '';if(s.charAt(0)==='@')return orbSafeImg(imgs[s.slice(1)]);return orbSafeImg(s);};
  G.types=G.types||{};G.wpns=G.wpns||{};var wm={},tm={},nW=0,nT=0;
  /* 武器：與現有定義相同就共用；自訂代號衝突、或檔案改過內建武器時，另立新的自訂武器（不覆蓋內建武器） */
  Object.keys(D.wpns||{}).forEach(function(k){var w=clone(D.wpns[k]);if(!w||typeof w!=='object'||typeof w.n!=='string'){warn.push('武器「'+k+'」格式不符，略過');return;}var same=null;
    if(G.wpns[k]&&orbSameDef(G.wpns[k],w))same=k;else if(!G.wpns[k]&&typeof WPNO!=='undefined'&&WPNO[k]&&orbSameDef(WPNO[k],w))same=k;else for(var q in G.wpns)if(orbSameDef(G.wpns[q],w)){same=q;break;}
    if(!same&&typeof WPNO!=='undefined'&&WPNO[k]){var w2=clone(w);w2.n=w2.n+'（匯入）';w2.hid=0;for(var q2 in G.wpns)if(orbSameDef(G.wpns[q2],w2)){same=q2;break;}}
    if(same){wm[k]=same;return;}var nk=k,builtin=typeof WPNO!=='undefined'&&WPNO[k];if(builtin||G.wpns[k]||!/^cw\d+$/.test(k)){do{G.wseq=(G.wseq||0)+1;nk='cw'+G.wseq;}while(G.wpns[nk]||(typeof WPNO!=='undefined'&&WPNO[nk]));if(builtin)w.n=w.n+'（匯入）';}
    else{var nn=+k.slice(2);if(nn>(G.wseq||0))G.wseq=nn;}w.k=nk;w.hid=0;G.wpns[nk]=w;wm[k]=nk;nW++;});
  /* 自訂單位類型：同上；類型裡的武器代號一併換成新的 */
  Object.keys(D.types||{}).forEach(function(k){var t=clone(D.types[k]);if(!t||typeof t!=='object'||typeof t.n!=='string'||!(t.men>=0)){warn.push('單位類型「'+k+'」格式不符，略過');return;}if(t.img)t.img=img(t.img);
    if(t.load&&Array.isArray(t.load.w))t.load.w=t.load.w.map(function(x){return [wm[x[0]]||x[0],x[1]];}).filter(function(x){return wpnOf(x[0]);});
    if(typeof MOBI!=='undefined'&&t.mob&&MOBI[t.mob]!==undefined){t.mobi=MOBI[t.mob];t.dom=domOf(t.mobi);}
    var same=null;for(var q in G.types)if(orbSameDef(G.types[q],t)){same=q;break;}if(!same&&UT[k]&&orbSameDef(UT[k],t))same=k;if(same){tm[k]=same;return;}
    var nk=k;if(G.types[k]||UT[k]||!/^c\d+$/.test(k)){do{G.tseq=(G.tseq||0)+1;nk='c'+G.tseq;}while(G.types[nk]||UT[nk]);}else{var nn=+k.slice(1);if(nn>(G.tseq||0))G.tseq=nn;}
    t.k=nk;t.cus=1;G.types[nk]=t;tm[k]=nk;nT++;});
  if(nT)G._tv=(G._tv||1)+1;
  return {wm:wm,tm:tm,nW:nW,nT:nT,img:img};}
function orbImport(D,side,parent,opt){opt=opt||{};var err=orbCheck(D);if(err)throw new Error(err);var warn=[],imgs=D.imgs||{};
  var AM=armsMerge(D,warn),img=AM.img,wm=AM.wm,tm=AM.tm,nW=AM.nW,nT=AM.nT,nR=0;
  if(opt.replace){if(G.started)throw new Error('作戰進行中不能取代整方的部隊。');G.units.filter(function(u){return u.side===side&&(u.p<0||!uById(u.p));}).forEach(function(u){delUnit(u);});parent=-1;nR=1;}
  var P0=parent>=0?uById(parent):null;if(P0&&(isLeaf(P0)||P0.side!==side))P0=null;var parId=P0?P0.id:-1;
  /* 依上級先後建立：上級不在檔案裡的單位成為匯入的最上層 */
  var byId={},kids={},rootsD=[];D.units.forEach(function(o){byId[o.id]=o;});D.units.forEach(function(o){if(o.p&&byId[o.p])(kids[o.p]=kids[o.p]||[]).push(o);else rootsD.push(o);});
  var idm={},made=[],roots=[],era=(ERA.filter(function(e){return !e.fan&&e.y0<=((G.set&&G.set.y)||1943);}).pop()||ERA[6]).k,skipped=0;
  var num=function(v,a,b,d){v=+v;return isFinite(v)?clamp(v,a,b):d;};
  var mk=function(o,pid){var mix=null;if(o.mix){if(!Array.isArray(o.mix)){skipped++;return;}mix=o.mix.map(function(m){return Array.isArray(m)?[tm[m[0]]||m[0],Math.round(num(m[1],1,200,1))]:null;}).filter(function(m){if(!m)return false;if(!typeOf(m[0])){warn.push('找不到單位類型「'+m[0]+'」');return false;}return true;});if(!mix.length){skipped++;return;}}
    var hq=null;if(!mix){hq=o.hq?(tm[o.hq]||o.hq):null;if(!hq||!typeOf(hq))hq=hqTypeFor(era);}
    var off=null;if(o.off&&typeof o.off==='object'){off=clone(o.off);['cmd','tac','ini','agg'].forEach(function(f){off[f]=Math.round(num(off[f],1,10,5));});off.exp=Math.round(num(off.exp,0,30,0));off.q=Array.isArray(off.q)?off.q.filter(function(x){return typeof x==='string';}):[];off.name=typeof off.name==='string'?off.name.slice(0,60):'';}
    var u=newUnit(side,{name:typeof o.name==='string'?o.name.slice(0,80):'',p:pid,ech:Math.round(num(o.ech,0,7,1)),mix:mix||undefined,hq:hq||undefined,img:img(o.img),off:off,exp:Math.round(num(o.exp,0,30,0))});
    ORBKEEP.forEach(function(k){if(k==='name'||k==='ech'||k==='mix'||k==='hq'||k==='img'||k==='off'||k==='exp'||o[k]===undefined)return;u[k]=clone(o[k]);});
    if(typeof u.note!=='string')u.note='';if(u.prof!==undefined&&!(u.prof>=0&&u.prof<PROF.length&&u.prof===Math.round(u.prof)))delete u.prof;
    if(u.aip&&!(u.aip.t==='auto'||AIT[u.aip.t]))delete u.aip;if(u.aip){u.aip.v=Math.round(num(u.aip.v,-1,(AIT[u.aip.t]?AIT[u.aip.t][2].length:1)-1,-1));u.aip._P=null;}
    if(u.pol&&typeof u.pol==='object'){['pow','civ'].forEach(function(f){var T=f==='pow'?POWP:CIVP;if(u.pol[f]!==undefined&&!(u.pol[f]>=0&&u.pol[f]<T.length))delete u.pol[f];});}else delete u.pol;
    if(u.ration&&typeof u.ration!=='object')delete u.ration;if(u.femR!==undefined&&!(typeof u.femR==='number'&&u.femR>=0&&u.femR<=1))delete u.femR;if(u.artRole!==undefined&&u.artRole!=='DS'&&u.artRole!=='GS')delete u.artRole;['ttl','tpl','hpre','pk'].forEach(function(f){if(u[f]!==undefined&&typeof u[f]!=='string')delete u[f];});
    if(pid>=0){var PP=uById(pid);if(PP&&PP.kids)PP.kids.push(u.id);}
    initStrength(u);if(o.trn!==undefined)u.trn=num(o.trn,10,100,u.trn);if(o.mor!==undefined)u.mor=num(o.mor,0,100,u.mor);
    if(o.str!==undefined&&isLeaf(u)){u.men=u.men0*num(o.str,0.01,1,1);u.veh=u.veh0*num(o.vstr!==undefined?o.vstr:o.str,0,1,1);}
    if(o.lg&&typeof o.lg==='object'){var g={};if(Array.isArray(o.lg.w))g.w=o.lg.w.filter(Array.isArray).map(function(x){return [wm[x[0]]||x[0],Math.max(0,Math.round(+x[1]||0))];}).filter(function(x){return wpnOf(x[0]);});
      if(g.w&&!g.w.length&&o.lg.w.length)delete g.w;if(Array.isArray(o.lg.v))g.v=o.lg.v.filter(function(x){return Array.isArray(x)&&VEHI[x[0]];}).map(function(x){return [x[0],Math.max(0,Math.round(+x[1]||0))];});if(o.lg.h!==undefined)g.h=Math.max(0,+o.lg.h||0);if(Array.isArray(o.lg.rk)&&o.lg.rk.length===3)g.rk=o.lg.rk.map(function(x){return Math.max(0,+x||0);});if(o.lg.basic>0)g.basic=num(o.lg.basic,0.25,10,2);if(o.lg.daily>0)g.daily=num(o.lg.daily,0,10,1);u.lg=g;}
    made.push(u);idm[o.id]=u;if(pid===parId)roots.push(u);(kids[o.id]||[]).forEach(function(k){mk(k,u.id);});};
  rootsD.forEach(function(o){mk(o,parId);});reix();made.forEach(function(u){logInit(u);});
  if(G.started){made.forEach(function(z){z.ms='ok';z.form='deployed';z.task='hold';z.sup=0;z.fat=0;z.st='off';});roots.forEach(function(r){r.arr={k:'time',t:G.t+600};});}
  G._pv=(G._pv||0)+1;dupNames();if(skipped)warn.push('有 '+skipped+' 個單位因為找不到類型而略過');
  return {roots:roots,made:made,types:nT,wpns:nW,replaced:nR,warn:warn.filter(function(w,i,a){return a.indexOf(w)===i;})};}
