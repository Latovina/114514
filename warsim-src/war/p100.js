/* ===================== 兵牌（介面）：樣式、分隊顏色、隊徽、自訂符號與機動方式 ===================== */
/* 分隊顏色：最高司令部直屬的每個編制一種顏色，底下的部隊都在兵牌左上角帶這個顏色（編制頁可自訂） */
var FCP=['#E53935','#1E88E5','#43A047','#FDD835','#8E24AA','#FB8C00','#00ACC1','#6D4C41','#D81B60','#7CB342','#3949AB','#00897B'];
var FCC={k:'',m:{},i:{},b:{}};
function fcKey(){return G?G.units.length+'|'+(G._pv||0)+'|'+(G._fcv||0)+'|'+(UIP.fcOn===0?0:1)+'|'+(UIP.insM||'auto'):'';}
function fcCache(){var k=fcKey();if(FCC.k!==k){FCC.k=k;FCC.m={};FCC.i={};FCC.b={};}return FCC;}
/* 由部隊往上找：自訂顏色優先，否則看它屬於最高司令部直屬的哪一個編制 */
function fcGroup(u){var x=u,ch=[];while(x){ch.push(x);x=x.p>=0?uById(x.p):null;}if(ch.length<2)return null;var R=ch[ch.length-1],A=ch[ch.length-2];if(isLeaf(A))return null;
  var ks=(R.kids||[]).filter(function(id){var q=uById(id);return q&&!isLeaf(q);});return {A:A,i:ks.indexOf(A.id)};}
function fcolOf(u){if(!u||!G||UIP.fcOn===0)return '';var C=fcCache();if(C.m[u.id]!==undefined)return C.m[u.id];var c='',x=u;while(x){if(x.fcol){c=x.fcol;break;}x=x.p>=0?uById(x.p):null;}
  if(!c){var g=fcGroup(u);if(g&&g.i>=0)c=FCP[g.i%FCP.length];}C.m[u.id]=c;return c;}
/* 隊徽：上傳的圖片（往上找），否則依最高司令部直屬的編制自動產生（圖形、顏色與番號） */
function insOf(u){var M=UIP.insM||'auto';if(!u||!G||M==='off')return null;var C=fcCache();if(C.i[u.id]!==undefined)return C.i[u.id];var r=null,x=u;while(x){if(x.ins){r=x.ins;break;}x=x.p>=0?uById(x.p):null;}
  if(!r&&M==='auto'){var g=fcGroup(u);if(g&&g.i>=0){var A=g.A,n=(String(A.name||'').match(/\d+/)||[])[0]||String(A.name||'?').replace(/^第/,'').charAt(0);r={s:hstr('ins|'+A.id)%5,c:A.fcol||FCP[g.i%FCP.length],t:n.length>2?n.slice(-2):n};}}C.i[u.id]=r;return r;}
/* 編制的兵種（德式司令部旗上與桿腳的記號）：範本的兵種，否則看底下部隊最多的兵種（戰車或裝甲運兵車的連占三成以上算裝甲或裝甲擲彈兵）；後綴 .m 表示大多數部隊有車輛 */
var FBRM={arm:'arm',mech:'mech',mot:'inf',inf:'inf',pike:'inf',mg:'inf',gue:'inf',sof:'inf',sec:'inf',cav:'cav',rec:'rec',art:'art',mor:'art',sge:'art',rkt:'rkt',eng:'eng',lab:'eng',sup:'sup',med:'med',ew:'ew',ad:'ad',at:'at',nav:'nav',sub:'nav',air:'air',heli:'air',uav:'air',ash:'ash'};
function fmBr(u,L){if(!G||(!u&&!(L&&L.length)))return '';var C=fcCache(),k=u&&!L?'f'+u.id:'g'+(u?u.id:'')+'|'+L[0].id+'|'+L.length;if(C.b[k]!==undefined)return C.b[k];L=L||leavesOf(u);
  var cn={},b='',bn=0,mv=0,n=L.length;L.forEach(function(q){var s=ST(q),m=FBRM[s.sym]||'inf';cn[m]=(cn[m]||0)+1;if(cn[m]>bn){bn=cn[m];b=m;}if(s.mob==='wheel'||s.mob==='track')mv++;});
  var P=u&&u.pk&&typeof FPI!=='undefined'?FPI[u.pk]:null;if(P&&P.br&&P.br!=='inf')b=P.br;else if(n&&(cn.arm||0)>=n*0.3)b='arm';else if(n&&(cn.mech||0)>=n*0.3)b='mech';
  var r=b?b+(b!=='arm'&&b!=='mech'&&n&&mv>=n*0.6?'.m':''):'';C.b[k]=r;return r;}
/* 自訂符號（部隊）＞類型的符號 */
function symOfU(u){return u&&u.sym||ST(u).sym;}
/* 機動方式：單一部隊依類型，合併的兵牌取多數 */
function mobOfIt(it){if(UIP.mobOn===0||!it||it.c)return '';if(it.L&&it.L.length){var n={},b='',bn=0;it.L.forEach(function(q){var m=ST(q).mob;n[m]=(n[m]||0)+1;if(n[m]>bn){bn=n[m];b=m;}});return b;}return it.s?it.s.mob:'';}
/* ---------- 設定 ---------- */
function symReset(){SPC.m={};SPC.n=0;ICOC={};FCC.k='';if(G&&G.map&&VW.ct)vDraw(false);if(UI.tab==='orbat'&&typeof obTree==='function'){obTree();obDet();}if(UI.tab==='battle'&&typeof btLeft==='function'){btLeft(true);btSel();}}
setSec('gfx','sym',{t:'兵牌',o:8,local:true,h:function(){return setOpt(setRow('樣式',setSel('symstd','',[['nato','北約（APP-6）'],['wp','華約（蘇式）'],['ming','明式（旗號）'],['de','二戰德軍（H.Dv. 272）']],symStd(),'北約：友軍長方形、敵軍菱形、中立方形、不明四葉形；華約：友軍紅、敵軍藍，車輛或武器圖形，司令部畫成旗幟；明式：寫著兵種的旗，令旗與大纛是司令部，旒表示規模；二戰德軍：己方藍、敵方紅，線條圖形，司令部是旗形依層級變化的旗，桿腳記號表示兵種'))+
  setRow('配色',setSel('symcol','',[['side','陣營顏色'],['std','北約標準（友藍、敵紅、中立綠、不明黃）']],UIP.symCol||'side'))+setRow('分隊顏色',setChk('symfc','',UIP.fcOn!==0,'兵牌左上角標出所屬編制的顏色'))+
  setRow('隊徽',setSel('symins','',[['auto','自動產生（可上傳）'],['up','只顯示上傳的'],['off','不顯示']],UIP.insM||'auto'))+setRow('機動方式',setChk('symmob','',UIP.mobOn!==0,'兵牌下方標出輪型、履帶或牽引'))+setRow('面向',setChk('symrot','',UIP.symRot!==0,'一般部隊的兵牌整個轉向部隊的面向（正面朝向敵方）；司令部、合併顯示的編制與明式的旗保持直立')))+
  '<div class="lw-note">只影響這個畫面。編制頁可以替每個編制指定分隊顏色、上傳隊徽，替部隊改用其他兵種符號、上傳圖片，或上傳一張小圖片整張取代兵牌。</div>';}});
CHG.symstd=function(t){UIP.symStd=t.value;uipSave();symReset();};CHG.symcol=function(t){UIP.symCol=t.value;uipSave();symReset();};CHG.symfc=function(t){UIP.fcOn=t.checked?1:0;uipSave();symReset();};
CHG.symins=function(t){UIP.insM=t.value;uipSave();symReset();};CHG.symrot=function(t){UIP.symRot=t.checked?1:0;uipSave();symReset();};CHG.symmob=function(t){UIP.mobOn=t.checked?1:0;uipSave();symReset();};
/* ---------- 編制頁：兵牌 ---------- */
var SYMN={inf:'步兵',mg:'機槍',cav:'騎兵',rec:'偵察',arm:'裝甲',mech:'機械化步兵',mot:'摩托化步兵',art:'砲兵',mor:'迫擊砲',rkt:'火箭砲',at:'反裝甲',ad:'防空',eng:'工兵',hq:'指揮部',sup:'後勤',heli:'直升機',uav:'無人機',ew:'電子戰',sof:'特種部隊',pike:'長槍兵',
  nav:'水面艦艇',sub:'潛艦',air:'航空器',ash:'飛艇',mon:'海怪',drg:'飛龍',mp:'憲兵',pow:'戰俘',ref:'難民',ca:'民事',sec:'警衛',psy:'心理戰',lab:'勞工',med:'醫療',ent:'勞軍',gue:'游擊隊',sge:'攻城'};
function symEditHtml(u){var leaf=isLeaf(u),s=ST(u),o='<h4 style="margin:10px 0 4px;font-size:13px">兵牌</h4>';
  if(leaf)o+='<div class="lw-row"><label>符號 <select data-c="osym"><option value="">依類型（'+esc(SYMN[s.sym]||s.sym)+'）</option>'+Object.keys(SYMN).map(function(k){return '<option value="'+k+'"'+(u.sym===k?' selected':'')+'>'+SYMN[k]+'</option>';}).join('')+'</select></label></div>';
  o+='<div class="lw-row"><span class="lw-note" style="margin:0" title="上傳一張小圖片（自動縮到 72×52 以內）整張取代兵牌">整張兵牌</span>'+(u.cimg?'<img class="lw-img" src="'+u.cimg+'" alt="">':'<span class="lw-note">（使用符號）</span>')+'<input type="file" accept="image/*" data-c="ocimg">'+(u.cimg?'<button type="button" class="lw-btn sm" data-a="ocimgx">清除</button>'+(isLeaf(u)?'<button type="button" class="lw-btn sm" data-a="ocimgall" title="本方所有同類型的部隊都用這張兵牌">套用到同類型</button>':''):'')+'</div>';
  o+='<div class="lw-row"><span class="lw-note" style="margin:0">圖片</span>'+(u.img?'<img class="lw-img" src="'+u.img+'" alt="">':'<span class="lw-note">（使用兵種符號'+(unitImg(u)?'，或類型的圖片':'')+'）</span>')+'<input type="file" accept="image/*" data-c="oimg">'+(u.img?'<button type="button" class="lw-btn sm" data-a="oimgx">清除</button>':'')+'</div>';
  if(!leaf){var fc=fcolOf(u);o+='<div class="lw-row"><label title="這個編制與底下所有部隊兵牌左上角的顏色">分隊顏色 <input type="color" data-c="ofcol" value="'+(u.fcol||fc||'#888888')+'"></label>'+(u.fcol?'<button type="button" class="lw-btn sm" data-a="ofcolx">改回自動</button>':'<span class="lw-note">'+(fc?'（自動）':'（只有最高司令部直屬的編制自動分配顏色）')+'</span>')+'</div>';
    var ins=u.ins;o+='<div class="lw-row"><span class="lw-note" style="margin:0">隊徽</span>'+(ins?'<img class="lw-img" src="'+ins+'" alt="" style="border-radius:50%">':'<span class="lw-note">（'+(insOf(u)?'自動產生':'無')+'）</span>')+'<input type="file" accept="image/*" data-c="oins">'+(ins?'<button type="button" class="lw-btn sm" data-a="oinsx">清除</button>':'')+'</div>';}
  return o;}
/* 整張兵牌：縮到 72×52 以內、保留比例；檔案太大就不收（聯機時要傳給其他玩家） */
function cimgFile(f,cb){var rd=new FileReader();rd.onload=function(){var im=new Image();im.onload=function(){var r=Math.min(72/im.width,52/im.height,1),w=Math.max(1,Math.round(im.width*r)),h=Math.max(1,Math.round(im.height*r)),c=mkCanvas(w,h);c.getContext('2d').drawImage(im,0,0,w,h);var url=c.toDataURL('image/png');if(url.length>24000)url=c.toDataURL('image/webp',0.85);if(url.length>24000){toast('這張圖片太複雜，請換一張較簡單的小圖。',4500);return;}cb(url);};im.onerror=function(){toast('無法讀取這張圖片');};im.src=rd.result;};rd.readAsDataURL(f);}
CHG.ocimg=function(t){var f=t.files[0];if(!f)return;cimgFile(f,function(url){var u=uById(OB.sel);if(!u)return;u.cimg=url;symReset();});};
ACT.ocimgx=function(){var u=uById(OB.sel);if(!u)return;delete u.cimg;symReset();};
ACT.ocimgall=function(){var u=uById(OB.sel);if(!u||!u.cimg||!isLeaf(u))return;var k=u.mix[0][0],n=0;G.units.forEach(function(q){if(q.side===u.side&&isLeaf(q)&&q.mix[0][0]===k){q.cimg=u.cimg;n++;}});symReset();toast('已套用到 '+n+' 個同類型的部隊。');};
CHG.osym=function(t){var u=uById(OB.sel);if(!u)return;if(t.value)u.sym=t.value;else delete u.sym;symReset();};
CHG.ofcol=function(t){var u=uById(OB.sel);if(!u)return;u.fcol=t.value;G._fcv=(G._fcv||0)+1;symReset();};ACT.ofcolx=function(){var u=uById(OB.sel);if(!u)return;delete u.fcol;G._fcv=(G._fcv||0)+1;symReset();};
CHG.oins=function(t){var f=t.files[0];if(!f)return;imgFile(f,64,function(url){var u=uById(OB.sel);if(!u)return;u.ins=url;G._fcv=(G._fcv||0)+1;symReset();});};ACT.oinsx=function(){var u=uById(OB.sel);if(!u)return;delete u.ins;G._fcv=(G._fcv||0)+1;symReset();};
if(typeof HELP14!=='undefined')HELP14.push('<h4>兵牌：北約與華約樣式、分隊顏色、隊徽</h4><ul>'+
  '<li>北約樣式（APP-6）依你的立場畫外框：友軍長方形、敵軍菱形、中立（第三方）方形、看不清的敵情四葉形；空中單位只有外框上半、潛艦只有下半。框內是兵種圖形，上方是梯隊記號，下方是機動方式（輪型兩個小圓、履帶長橢圓、牽引一條線）與兵力條。</li>'+
  '<li>華約樣式（蘇式）：友軍紅色、敵軍藍色，不畫外框；兵種以車輛或武器圖形表示（戰車菱形、步兵戰車與裝甲運兵車五邊形、徒步部隊圓形、火砲的砲管與架尾），連、營以桿上的橫線數表示，司令部畫成旗幟（營三角旗、團長方旗、旅斜邊旗、師燕尾旗）。</li>'+
  '<li>明式（旗號）：每個部隊是一面寫著兵種的旗（步、騎、砲、車、輜……），營與團的司令部是三角令旗，師以上是帶火焰牙邊的大纛；旗下的旒（飄帶）越多規模越大，友軍的旗向右飄、敵軍向左飄。也可以上傳一張小圖片整張取代兵牌。</li>'+
  '<li>二戰德軍式（依 1943 年版 H.Dv. 272《陸軍戰術符號範式》）：己方藍色、敵方紅色、盟軍綠色。部隊是線條圖形：步兵長方形、機槍框內十字、迫擊砲框內角形、裝甲平行四邊形、騎兵斜線、偵察是圓車頭的裝甲車形加小旗、工兵框上的鎬、衛生框上十字、通信階梯形，火砲是直桿加Ｈ、反裝甲Ｔ形、高射砲是立在小圓上的箭頭、火箭倒Ｙ形；排用細線，連的左邊加粗，營四邊加粗；框下兩輪是摩托化、履帶是自走，砲上方的 o—o 是車輛牽引，畜力牽引不加記號。團以上的部隊與司令部畫成旗：營實心三角旗、團實心方旗、旅空心三角旗、師深淺深三道的三角旗、軍上下兩個三角的方旗、集團軍四格、方面軍九格的棋盤旗；旗桿腳的菱形是裝甲、小車是裝甲擲彈兵、小圓是摩托化、斜線方塊是騎兵，桿上一段粗線是砲兵，桿頂的鎬是工兵、兩道是補給、十字是衛生、箭頭是通信。</li>'+
  '<li>兵牌隨面向旋轉：一般部隊的兵牌整個轉向部隊的面向——北約式、德式與上傳的兵牌以上緣（梯隊記號那一邊）為正面，華約式以圖形的右端為正面；司令部、合併顯示的編制與明式的旗保持直立。兵牌前方的小箭頭也指出面向。可在設定的「畫面 → 兵牌」關閉。</li>'+
  '<li>兵牌左上角的分隊顏色表示所屬的編制（最高司令部直屬的每個編制一種顏色），右上角是隊徽。編制頁可以指定顏色、上傳隊徽，替部隊改用其他兵種符號或上傳圖片。設定的「畫面」可以切換樣式與配色、關閉分隊顏色、隊徽或機動方式。</li></ul>');
