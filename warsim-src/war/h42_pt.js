/* ===================== 指揮官頭像：資料與檢查（畫圖在 o44_ptui.js） =====================
   頭像參數 pt = {sk 膚色, hc 髮色, ec 獸耳色, uc 服裝色, bg 背景色, hs 髮型, ea 耳朵, gl 眼鏡, sc 疤, ht 帽子}；
   軍官存在 u.off.pt，各方指揮官存在 G.sides[s].cm[i].pt；沒有設定時依姓名、性別、年代與軍階自動產生。 */
var PTHS=[['bald','光頭'],['buzz','平頭'],['short','短髮'],['side','側分'],['slick','背頭'],['mid','中分'],['undercut','削邊'],['spiky','刺蝟頭'],['curly','捲髮'],['afro','爆炸頭'],['mohawk','莫霍克'],['bob','鮑伯頭'],['hime','公主切'],['long','長直髮'],['wavy','波浪長髮'],['pony','馬尾'],['twin','雙馬尾'],['bun','包頭'],['braid','側辮']];
var PTEA=[['human','一般'],['elf','精靈耳'],['cat','貓耳'],['fox','狐耳'],['wolf','狼耳'],['rabbit','兔耳'],['lop','垂耳兔'],['dog','垂耳犬'],['bear','熊耳'],['mouse','鼠耳'],['horn','惡魔角']];
var PTGL=[['none','無'],['thin','細框眼鏡'],['gold','金絲眼鏡'],['square','粗框眼鏡'],['half','半框眼鏡'],['sun','墨鏡'],['mono','單眼鏡片'],['patch','眼罩']];
var PTSC=[['none','無'],['cheekL','左頰'],['cheekR','右頰'],['brow','眉骨'],['cross','十字'],['nose','鼻樑'],['chin','下巴'],['claw','爪痕']];
var PTHT=[['none','無'],['beret','貝雷帽'],['cap','大簷帽'],['garrison','船形帽'],['patrol','作戰帽'],['helmet','鋼盔'],['ushanka','毛帽'],['shako','筒帽'],['bicorne','二角帽'],['tricorne','三角帽']];
var PTKEYS={hs:PTHS,ea:PTEA,gl:PTGL,sc:PTSC,ht:PTHT},PTCOL=['sk','hc','ec','uc','bg'];
/* 只保留認得的鍵與值（顏色為 #rrggbb）；空物件代表「自動」 */
function ptClean(p){if(!p||typeof p!=='object')return null;var o={},n=0;PTCOL.forEach(function(k){if(typeof p[k]==='string'&&/^#[0-9a-fA-F]{6}$/.test(p[k])){o[k]=p[k].toLowerCase();n++;}});
  Object.keys(PTKEYS).forEach(function(k){if(typeof p[k]==='string'&&PTKEYS[k].some(function(q){return q[0]===p[k];})){o[k]=p[k];n++;}});return n?o:null;}
function ptSetU(u,p){if(!u||!u.off)return {err:'這個單位沒有自己的指揮官。'};var c=ptClean(p);if(c)u.off.pt=c;else delete u.off.pt;return {ok:1};}
if(typeof MPFN!=='undefined'){MPFN.ptSetU=[MPOWN(0),function(a){return ptSetU(a[0],a[1]);}];MPPRE.ptSetU=1;}
if(typeof MPWC!=='undefined')MPWC.pt='o';
