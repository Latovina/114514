/* ===================== 命名：地名（中文規則、西方規則原文、西方規則中譯）、人名、部隊番號與稱號 =====================
   原則：除非詞彙用盡，否則名稱中不出現疊字（相鄰重複的字）或重複的字；西方名稱不重複同一個字根或音節。 */
/* ---------- 中文地名詞彙 ---------- */
var ZHP={
  /* 城市：雅字首 × 城市字尾 */
  ca:'安平永寧泰和嘉華興隆昌盛臨江清明德仁義武文成定靖撫鎮遠綏懷化開封順慶廣惠福壽豐潤澤汾渭涇洛汝潁淮沂泗濟漳衡湘沅澧贛饒婺歙宣池滁廬蘄鄂岳辰常靈雲溫處衢嚴秀蘇揚通海徐宿萊青登沂兗曹單濮滑衛輝彰磁邢趙冀深瀛滄景德博淄濰密膠莒鄒滕費郯邳睢亳潁陳蔡許鄭汴洛陝虢商金房均襄郢荊峽歸夔渝合閬巴達蓬遂潼綿漢彭眉嘉雅黎邛瀘敘戎宜賓',
  cb:'州陽城寧安平原川江山陵都京津昌興華德關門口港灣沙洲峽谷水源屏埠鄉台溪泉坪野',
  /* 市鎮 */
  tb:'鎮集堡口驛埠關店鋪墟場渡橋營',
  /* 方位與形容 */
  dir:'東西南北中上下前後',adj:'大小新舊老高長清白黃紅青黑石土沙泥',
  /* 村落：姓氏 × 家 × 村落字尾 */
  sur:'王李張劉陳楊黃趙吳周徐孫馬朱胡郭何林羅高梁鄭謝宋唐許韓馮鄧曹彭曾蕭田董袁潘于蔣蔡余杜葉程蘇魏呂丁任沈姚盧姜崔鍾譚陸汪范金石廖賈夏韋方白鄒孟熊秦邱尹薛閻段雷侯龍史陶黎賀顧毛郝龔邵萬錢嚴武戴莫孔向湯',
  vs:'莊村屯寨坪灣窪溝營堡店橋坡嶺峪塘',
  /* 村落：景物 × 地形 */
  vn:'柳槐榆楊松柏桑棗梨杏桃竹蘆荷蓮菱楓樟榕椿杉桐棠梅蒿艾麻粟稻麥葦藤',
  vt:'樹橋井溝河灣坡崗嶺台坪峪營堡寨屯莊店鋪窯磨閘渡口頭尾園圩垻',
  num:['二','三','五','七','八','十','十八','二十'],numt:'里鋪屯坡店河橋堡',
  /* 河流、山、林、湖 */
  rv:'江河溪水川渠澗',rn:'清白黃赤青碧綠金銀玉沙泥柳桃杏蘭芷桂楓烏黑丹藍紫淇洹渦沱湍淙潺灃滻灞瀍澗汭汶泗沁漳',
  hl:'山嶺峰崗坡台嶂岩頂尖梁塬',hn:['老虎','鳳凰','雞冠','馬鞍','筆架','獅子','臥牛','駱駝','蓮花','香爐','旗杆','鼓樓','天柱','白雲','紫金','翠屏','金雞','玉女','將軍','觀音','羅漢','仙人','黑風','鷹嘴','虎頭','龍脊','蛇盤','象鼻','狼牙','雁門','望夫','落鳳','卧龍','歇馬','飲馬','點將','烽火','磨盤','棋盤','五指'],
  fs:['林','樹林','林場','森林','松林','竹林','密林'],lk:['湖','潭','澤','泊','池','淀','塘','海子'],
  /* 城市分區 */
  dist:['舊城','老城','東關','西關','南關','北關','鼓樓','城隍廟','府前','碼頭','車站','工業區','新區','城南','城北','河東','河西','江北','江南','商埠','營房','學府','窯場','貨棧','市集','船塢','郊區','新村']};
/* 不含疊字或重複字（全形字逐字比對） */
function zhOK(s){for(var i=0;i<s.length;i++)for(var j=i+1;j<s.length;j++)if(s.charAt(i)===s.charAt(j))return false;return true;}
/* ---------- 西方地名詞彙（原文、中譯） ---------- */
var WSP={
  root:[['Ash','艾許'],['Oak','奧克'],['Elm','艾姆'],['Thorn','索恩'],['Bram','布蘭'],['Brook','布魯克'],['Stan','斯坦'],['Kings','金斯'],['Queens','昆斯'],['Mill','米爾'],['Hart','哈特'],['Wolf','沃夫'],['Fox','福克斯'],['Ox','奧克斯'],['Swan','斯旺'],['Rook','魯克'],['Ald','奧爾德'],['Black','布萊克'],['White','懷特'],['Red','雷德'],['Green','格林'],['Ever','艾佛'],['Har','哈'],['Bel','貝爾'],['Mar','馬爾'],['Dun','鄧'],['Lang','朗'],['Wal','沃爾'],['Win','溫'],['Chel','切爾'],['Brad','布拉德'],['Crom','克倫'],['Dal','多爾'],['Fair','費爾'],['Glen','格倫'],['Hal','霍爾'],['Kel','凱爾'],['Lin','林'],['Mor','莫'],['Nor','諾'],['Pen','彭'],['Ros','羅斯'],['Sal','索爾'],['Tam','塔姆'],['Wey','威'],['Ux','厄克斯'],['Ab','阿伯'],['Bourne','伯恩'],['Cold','科爾德'],['Deer','迪爾'],['Fern','弗恩'],['Gold','戈德'],['Hay','黑'],['Ivy','艾維'],['Lark','拉克'],['Moss','莫斯'],['Pike','派克'],['Rush','拉什'],['Stone','斯通'],['Wyn','溫恩'],['Cran','克蘭'],['Bar','巴'],['Clay','克雷'],['Wood','伍德']],
  suf:[['ford','福德'],['field','菲爾德'],['ton','頓'],['bury','伯里'],['ham','漢姆'],['wick','威克'],['by','比'],['thorpe','索普'],['stead','斯特德'],['worth','沃斯'],['ley','利'],['mouth','茅斯'],['bridge','布里奇'],['port','波特'],['gate','蓋特'],['dale','戴爾'],['mere','米爾'],['more','莫爾'],['hurst','赫斯特'],['combe','庫姆'],['chester','切斯特'],['caster','卡斯特'],['haven','黑文'],['holm','霍姆'],['ness','尼斯'],['well','威爾'],['wood','伍德'],['minster','明斯特'],['borough','巴勒'],['stow','斯托'],['den','登'],['cott','科特']],
  fr:[['ville','維爾'],['court','庫爾'],['mont','蒙'],['bourg','堡'],['val','瓦勒'],['fort','福爾'],['champ','尚'],['pré','普雷'],['château','沙托'],['lieu','略'],['mesnil','梅尼勒'],['ais','艾']],
  frr:[['Belle','貝勒'],['Beau','博'],['Clair','克萊爾'],['Riche','里什'],['Mar','馬爾'],['Ver','維爾'],['Mont','蒙'],['Bois','布瓦'],['Roche','羅什'],['Pont','蓬'],['Neuf','訥夫'],['Grand','格朗'],['Vieux','維厄'],['Haut','奧'],['Ar','阿爾'],['Mor','莫爾'],['Lou','盧'],['Char','沙爾']],
  frs:[['Saint-Jean','聖讓'],['Saint-Pierre','聖皮耶'],['Saint-Martin','聖馬丹'],['Saint-Denis','聖德尼'],['Sainte-Marie','聖瑪麗'],['Saint-Laurent','聖洛朗'],['Saint-Georges','聖喬治'],['Saint-Michel','聖米歇爾'],['Saint-Rémy','聖雷米'],['Saint-Omer','聖奧梅爾']],
  frx:[['-des-Bois','林中'],['-du-Mont','山上'],['-le-Vieux','舊'],['-la-Forêt','森林'],['-des-Champs','田野'],['-les-Vignes','葡萄園']],
  de:[['dorf','多夫'],['heim','海姆'],['hausen','豪森'],['stadt','施塔特'],['feld','費爾德'],['berg','貝格'],['bach','巴赫'],['burg','堡'],['au','奧'],['brück','布呂克'],['furt','富特'],['ingen','因根'],['rode','羅德'],['wald','瓦爾德']],
  der:[['Alt','阿爾特'],['Neu','諾伊'],['Ober','奧伯'],['Nieder','尼德'],['Schön','舍恩'],['Rot','羅特'],['Weiß','懷斯'],['Eichen','艾興'],['Linden','林登'],['Tann','坦'],['Wolfs','沃夫斯'],['Hirsch','希爾施'],['Adler','阿德勒'],['Stein','施泰因'],['Mühl','米爾'],['Kirch','基爾希'],['Gros','格羅斯'],['Klein','克萊因'],['Bergen','貝爾根'],['Falken','法爾肯']],
  pre:[['New','新'],['Old','老'],['Great','大'],['Little','小'],['Upper','上'],['Lower','下'],['North','北'],['South','南'],['East','東'],['West','西'],['Fort','堡'],['Port','港'],['St. Mary','聖瑪麗'],['St. John','聖約翰'],['St. Paul','聖保羅']],
  rvn:[['Avon','埃文'],['Trent','特倫特'],['Severn','塞文'],['Wye','懷'],['Ouse','烏斯'],['Tamar','塔馬'],['Exe','埃克斯'],['Lune','盧恩'],['Calder','考爾德'],['Derwent','德文特'],['Isis','艾西斯'],['Medway','梅德韋'],['Mersey','默西'],['Tweed','特威德'],['Wear','威爾'],['Aire','艾爾'],['Dove','達夫'],['Kennet','肯尼特'],['Loddon','洛頓'],['Arun','阿倫'],['Rother','羅瑟'],['Stour','斯陶爾'],['Colne','科恩'],['Itchen','伊琴'],['Meuse','默茲'],['Sambre','桑布爾'],['Aisne','埃納'],['Oise','瓦茲'],['Marne','馬恩'],['Somme','索姆'],['Vire','維爾'],['Orne','奧恩'],['Lahn','蘭'],['Main','美因'],['Nahe','納厄'],['Lippe','利珀'],['Ems','埃姆斯'],['Fulda','富爾達'],['Saale','薩勒'],['Iller','伊勒'],['Lech','萊希'],['Isar','伊薩爾'],['Inn','因'],['Drau','德勞']],
  rvn2:[['Alne','阿爾恩'],['Blyth','布萊斯'],['Cherwell','徹韋爾'],['Dee','迪'],['Eden','伊登'],['Frome','弗羅姆'],['Glaven','格拉文'],['Hodder','霍德'],['Irwell','厄韋爾'],['Kent','肯特'],['Leven','萊文'],['Mole','摩爾'],['Nidd','尼德'],['Otter','奧特'],['Parrett','帕雷特'],['Ribble','里布爾'],['Swale','斯韋爾'],['Teme','蒂姆'],['Ure','尤爾'],['Wharfe','沃夫'],['Yare','雅爾'],['Allier','阿列'],['Cher','謝爾'],['Dordogne','多爾多涅'],['Garonne','加隆'],['Indre','安德爾'],['Lot','洛特'],['Sarthe','薩爾特'],['Vienne','維埃納'],['Yonne','約訥'],['Altmühl','阿爾特米爾'],['Diemel','迪梅爾'],['Eder','埃德'],['Jagst','亞格斯特'],['Kocher','科赫'],['Neckar','內卡'],['Pegnitz','佩格尼茨'],['Regen','雷根'],['Werra','韋拉'],['Wupper','烏珀'],['Aller','阿勒'],['Hase','哈瑟'],['Ilm','伊爾姆'],['Mulde','穆爾德'],['Oker','奧克']],
  rvd:[['','',''],['Little','小',''],['Black','黑',''],['White','白',''],['Upper','上',''],['North','北',''],['Old','老',''],['Great','大',''],['South','南',''],['East','東',''],['West','西',''],['Lower','下',''],['Red','紅',''],['Green','綠','']],
  rve:[['bourne','伯恩'],['brook','布魯克'],['beck','貝克'],['burn','伯恩溪'],['water','沃特'],['wash','沃什'],['lade','萊德'],['rill','里爾']],
  mod:[['','',''],['Great','大'],['Little','小'],['North','北'],['South','南'],['East','東'],['West','西'],['Old','老'],['High','高'],['Long','長']],
  hlk:[['Hill','山',0],['Mount','山',1],['Ridge','嶺',0],['Tor','岩',0],['Fell','丘',0],['Pike','峰',0],['Heights','高地',0],['Crag','崖',0],['Beacon','烽火山',0],['Down','丘',0],['Knoll','崗',0],['Edge','稜',0]],
  fsk:[['Wood','林',0],['Forest','森林',0],['Chase','獵林',0],['Wald','瓦爾德林',0],['Holt','樹林',0],['Bois de','森林',1],['Thicket','灌木林',0]],
  lkk:[['Lake','湖',1],['Mere','湖',0],['Water','湖',0],['Pool','池',0],['Loch','湖',1],['Tarn','潭',0],['Étang de','池',1]],
  dist:[['Old Town','舊城'],['Castle Quarter','城堡區'],['Market','市集區'],['Cathedral Close','大教堂區'],['Docks','碼頭區'],['Station Quarter','車站區'],['Mill District','磨坊區'],['Ironworks','鐵工廠區'],['New Town','新城'],['Garden Suburb','花園郊區'],['Barracks','兵營區'],['Riverside','河濱'],['Harbour','港區'],['University','大學區'],['Faubourg','城外區'],['Canal Side','運河區']]};
/* 西方名稱：不重複同一字根、相鄰音節不重複 */
function wOK(s){var t=s.toLowerCase().replace(/[^a-zà-ÿ]/g,'');for(var L=2;L<=4;L++)for(var i=0;i+2*L<=t.length;i++)if(t.substr(i,L)===t.substr(i+L,L))return false;var w=s.toLowerCase().split(/[\s-]+/);for(var a=0;a<w.length;a++)for(var b=a+1;b<w.length;b++)if(w[a]&&w[a]===w[b])return false;return true;}
function zOK2(s){for(var i=1;i<s.length;i++)if(s.charAt(i)===s.charAt(i-1))return false;return true;}
/* 名稱產生器：style＝zh（中文）、west（西方原文）、westzh（西方規則中譯）、mix（兩種地名並存：依東西位置）、mixzh */
function nameGen(seed,style){var r=mb32(hstr('nm|'+seed)),used={};style=style||'zh';
  function pk(s){return s.charAt(Math.floor(r()*s.length));}function pa(a){return a[Math.floor(r()*a.length)];}
  function uniq(f,ok){for(var i=0;i<120;i++){var s=f();if(s&&!used[s]&&(ok?ok(s):true)){used[s]=1;return s;}}var s2=f();for(var j=2;j<99;j++){var q=s2+(/[a-z]$/i.test(s2)?' '+j:j);if(!used[q]){used[q]=1;return q;}}return s2;}
  /* 中文 */
  var Z={city:function(){return uniq(function(){return pk(ZHP.ca)+pk(ZHP.cb);},zhOK);},
    town:function(){return uniq(function(){var q=r();return q<0.45?pk(ZHP.ca)+pk(ZHP.cb)+(r()<0.6?pk(ZHP.tb):''):q<0.75?pk(ZHP.dir)+pk(ZHP.vn)+pk(ZHP.tb):pk(ZHP.adj)+pk(ZHP.vt)+pk(ZHP.tb);},zhOK);},
    village:function(){return uniq(function(){var q=r();return q<0.42?pk(ZHP.sur)+'家'+pk(ZHP.vs):q<0.8?(r()<0.4?pk(ZHP.adj):'')+pk(ZHP.vn)+pk(ZHP.vt)+(r()<0.25?'村':''):q<0.9?pa(ZHP.num)+'里'+pk(ZHP.numt):pk(ZHP.dir)+pk(ZHP.vt)+pk(ZHP.vs);},zhOK);},
    river:function(big){return uniq(function(){var a=r()<0.35?pk(ZHP.rn)+pk(ZHP.rn):pk(ZHP.rn);return a+(big?(r()<0.5?'江':'河'):pk(ZHP.rv));},zhOK);},
    hill:function(){return uniq(function(){return (r()<0.6?pa(ZHP.hn):pk(ZHP.adj)+pk(ZHP.vn))+pk(ZHP.hl);},zhOK);},
    forest:function(){return uniq(function(){return (r()<0.5?pk(ZHP.dir)+pk(ZHP.vn):pk(ZHP.adj)+pk(ZHP.vn))+pa(ZHP.fs);},zhOK);},
    lake:function(){return uniq(function(){return (r()<0.5?pk(ZHP.rn):pk(ZHP.adj)+pk(ZHP.rn))+pa(ZHP.lk);},zhOK);},
    district:function(){return uniq(function(){return pa(ZHP.dist);});}};
  /* 西方：k＝0 原文、1 中譯 */
  function W(k){var tr=function(a){return a[k];},jn=function(a,b){return k?a+b:a+b;};
    function eng(){var a=pa(WSP.root),b=pa(WSP.suf);if(a[0].toLowerCase()===b[0]||a[0].toLowerCase().indexOf(b[0])>=0)return '';return jn(tr(a),tr(b));}
    function fre(){var q=r(),a=pa(WSP.frr),b=pa(WSP.fr),rv=pa(WSP.rvn),st=pa(WSP.frs),x=pa(WSP.frx);if(q<0.45)return k?a[1]+b[1]:a[0]+b[0];if(q<0.65)return k?rv[1]+'河畔'+st[1]:st[0]+'-sur-'+rv[0];if(q<0.85)return k?rv[1]+'河畔'+a[1]+b[1]:a[0]+b[0]+'-sur-'+rv[0];return k?x[1]+st[1]:st[0]+x[0];}
    function ger(){var a=pa(WSP.der),b=pa(WSP.de);return tr(a)+tr(b);}
    function pref(s){if(!s)return s;if(r()<0.18){var p=pa(WSP.pre);return k?p[1]+s:p[0]+' '+s;}return s;}
    function base(){var q=r();return q<0.55?pref(eng()):q<0.78?fre():ger();}
    function md(s){var m=pa(WSP.mod);return m[0]?(k?m[1]+s:m[0]+' '+s):s;}
    function rvName(){var q=r();if(q<0.45)return pa(WSP.rvn);if(q<0.8)return pa(WSP.rvn2);var a=pa(WSP.root),e=pa(WSP.rve);return [a[0]+e[0],a[1]+e[1]];}
    var ok=k?zOK2:wOK;
    return {city:function(){return uniq(base,ok);},town:function(){return uniq(base,ok);},
      village:function(){return uniq(function(){var q=r();if(q<0.2){var a=pa(WSP.root),b=pa(WSP.suf);return k?a[1]+b[1]:a[0]+b[0];}if(q<0.35){var p=pa(WSP.pre),c=pa(WSP.root),d=pa(WSP.suf);return k?p[1]+c[1]+d[1]:p[0]+' '+c[0]+d[0];}return base();},ok);},
      river:function(big){return uniq(function(){var a=rvName(),d=big&&r()<0.6?['','','']:pa(WSP.rvd);return k?(d[1]||'')+a[1]+'河':(d[0]?d[0]+' ':'')+(r()<0.5?'River '+a[0]:a[0]+' River');},ok);},
      hill:function(){return uniq(function(){var a=pa(WSP.root),h=pa(WSP.hlk);return md(k?a[1]+h[1]:(h[2]?h[0]+' '+a[0]:a[0]+' '+h[0]));},ok);},
      forest:function(){return uniq(function(){var a=pa(WSP.root),f=pa(WSP.fsk);return md(k?a[1]+f[1]:(f[2]?f[0]+' '+a[0]:a[0]+(f[0]==='Wald'?'wald':' '+f[0])));},ok);},
      lake:function(){return uniq(function(){var a=pa(WSP.root),l=pa(WSP.lkk);return md(k?a[1]+l[1]:(l[2]?l[0]+' '+a[0]:a[0]+' '+l[0]));},ok);},
      district:function(){return uniq(function(){return tr(pa(WSP.dist));});}};}
  var WO=W(0),WZ=W(1);
  function by(fx){if(style==='west')return WO;if(style==='westzh')return WZ;if(style==='mix'||style==='mixzh'){var w=style==='mix'?WO:WZ;return (fx===undefined?r()<0.5:fx+0.08*(r()-0.5)>0.5)?w:Z;}return Z;}
  return {r:r,used:used,style:style,city:function(fx){return by(fx).city();},town:function(fx){return by(fx).town();},village:function(fx){return by(fx).village();},river:function(big,fx){return by(fx).river(big);},hill:function(fx){return by(fx).hill();},forest:function(fx){return by(fx).forest();},lake:function(fx){return by(fx).lake();},district:function(fx){return by(fx).district();}};}
var NSTY=[['zh','中文'],['west','西方（原文）'],['westzh','西方（中譯）'],['mix','中文與西方原文（依東西位置）'],['mixzh','中文與西方中譯（依東西位置）']];
/* ---------- 人名 ---------- */
var SURN='王李張劉陳楊黃趙吳周徐孫馬朱胡郭何林羅高梁鄭謝宋唐許韓馮鄧曹彭曾蕭田董袁潘于蔣蔡余杜葉程蘇魏呂丁任沈姚盧姜崔鍾譚陸汪范金石廖賈夏韋付方白鄒孟熊秦邱江尹薛閻段雷侯龍史陶黎賀顧毛郝龔邵萬錢嚴覃武戴莫孔向湯',GIVN='安邦國華明德志文武仁義禮智信忠孝勇毅宏偉建軍平和光輝振興永昌世傑子豪俊思遠博學睿誠嘉寧靜鋒岳威烈剛強雄鎮山海天定',GIVF='秀英淑芬美玲婉君雅琴玉蘭麗華慧敏靜怡佳穎思涵雨萱月梅素珍彩雲碧霞惠貞若蘭';
var WFN=[['John','約翰'],['William','威廉'],['James','詹姆斯'],['Charles','查爾斯'],['Henry','亨利'],['Thomas','湯瑪斯'],['George','喬治'],['Edward','愛德華'],['Robert','羅伯特'],['Richard','理查'],['Arthur','亞瑟'],['Frederick','腓特烈'],['Louis','路易'],['Pierre','皮耶'],['Jean','尚'],['Henri','昂利'],['Jacques','雅克'],['Karl','卡爾'],['Hans','漢斯'],['Otto','奧托'],['Erich','埃里希'],['Walter','瓦爾特'],['Ernst','恩斯特'],['Hugo','雨果'],['Albert','亞伯特'],['Victor','維克多'],['Paul','保羅'],['Léon','萊昂'],['Anton','安東'],['Michael','麥可'],['David','大衛'],['Daniel','丹尼爾'],['Samuel','撒母耳'],['Andrew','安德魯'],['Patrick','派翠克'],['Francis','法蘭西斯'],['Gustav','古斯塔夫'],['Emil','埃米爾'],['Felix','菲利克斯'],['Oscar','奧斯卡']],
  WFF=[['Mary','瑪麗'],['Elizabeth','伊莉莎白'],['Anne','安妮'],['Margaret','瑪格麗特'],['Catherine','凱瑟琳'],['Helen','海倫'],['Alice','愛麗絲'],['Claire','克萊兒'],['Marie','瑪莉'],['Louise','露易絲'],['Sophie','蘇菲'],['Greta','葛麗塔'],['Ingrid','英格麗'],['Johanna','約翰娜'],['Emma','艾瑪'],['Rose','蘿絲'],['Jane','珍'],['Edith','伊迪絲'],['Clara','克拉拉'],['Lucy','露西']],
  WSN=[['Harrington','哈靈頓'],['Whitfield','惠特菲爾德'],['Ashby','艾許比'],['Lambert','蘭伯特'],['Moreau','莫羅'],['Dubois','杜博瓦'],['Lefèvre','勒費弗爾'],['Fontaine','方丹'],['Girard','吉拉爾'],['Schneider','施奈德'],['Becker','貝克爾'],['Hoffmann','霍夫曼'],['Krüger','克魯格'],['Weber','韋伯'],['Wagner','華格納'],['Fischer','費雪'],['Brandt','布蘭特'],['Vogel','福格爾'],['Hartmann','哈特曼'],['Keller','凱勒'],['Morgan','摩根'],['Hughes','休斯'],['Fletcher','弗萊徹'],['Carter','卡特'],['Mercer','默瑟'],['Sinclair','辛克萊'],['Douglas','道格拉斯'],['Gordon','戈登'],['Campbell','坎貝爾'],['Stewart','史都華'],['Russell','羅素'],['Barrett','巴雷特'],['Collins','柯林斯'],['Bennett','班奈特'],['Holloway','霍洛威'],['Prescott','普雷斯科特'],['Rousseau','盧梭'],['Mercier','梅西耶'],['Lemaire','勒梅爾'],['Chevalier','謝瓦利埃'],['Laurent','洛朗'],['Bertrand','貝特朗'],['Schröder','施羅德'],['Neumann','諾伊曼'],['Lindqvist','林奎斯特'],['Halvorsen','哈爾沃森'],['Van Dijk','范戴克'],['De Vries','德弗里斯'],['Kowalski','科瓦爾斯基'],['Novak','諾瓦克']];
/* 人名風格：zh、west（原文）、westzh（中譯）；女性比例依參數 */
var NMS={side:-1};
function personName(r,style,fem){style=style||(typeof G!=='undefined'&&G&&G.sides&&NMS.side>=0&&G.sides[NMS.side]?G.sides[NMS.side].pst:'')||'zh';var f=fem===undefined?false:fem;
  if(style==='west'||style==='westzh'){var k=style==='west'?0:1,fn=(f?WFF:WFN)[Math.floor(r()*(f?WFF:WFN).length)],sn;if(r()<0.4){var a=WSP.root[Math.floor(r()*WSP.root.length)],b=WSP.suf[Math.floor(r()*WSP.suf.length)];sn=[a[0]+b[0],a[1]+b[1]];}else sn=WSN[Math.floor(r()*WSN.length)];return k?fn[1]+'・'+sn[1]:fn[0]+' '+sn[0];}
  for(var t=0;t<30;t++){var s=SURN.charAt(Math.floor(r()*SURN.length)),pool=f?GIVF:GIVN,n='',kk=r()<0.65?2:1;for(var i=0;i<kk;i++)n+=pool.charAt(Math.floor(r()*pool.length));var nm=s+n;if(zhOK(nm))return nm;}return nm;}
/* ---------- 數字格式 ---------- */
function zhNum(n){var d='零一二三四五六七八九';n=Math.floor(n);if(n<=0)return '零';if(n<10)return d.charAt(n);if(n<20)return '十'+(n%10?d.charAt(n%10):'');if(n<100)return d.charAt(Math.floor(n/10))+'十'+(n%10?d.charAt(n%10):'');if(n<1000){var h=Math.floor(n/100),rest=n%100;return d.charAt(h)+'百'+(rest===0?'':rest<10?'零'+d.charAt(rest):rest<20?'一'+zhNum(rest):zhNum(rest));}
  var th=Math.floor(n/1000),r2=n%1000;return d.charAt(th)+'千'+(r2===0?'':r2<100?'零'+zhNum(r2):zhNum(r2));}
function ordEn(n){var s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);}
function roman(n){var V=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']],o='';V.forEach(function(q){while(n>=q[0]){o+=q[1];n-=q[0];}});return o;}
/* ---------- 部隊番號：依序、隨機（團級以上不重複；連、營在上級內依序） ---------- */
var NUMR=[[1,1],[1,16],[1,6],[1,600],[1,300],[1,400],[1,70],[1,30],[1,8]];
/* 英文兵種名稱（西式番號用） */
var BREN={inf:'Infantry',pike:'Pike',mg:'Machine Gun',cav:'Cavalry',rec:'Reconnaissance',arm:'Armoured',mech:'Mechanized',mot:'Motorized',art:'Artillery',mor:'Mortar',rkt:'Rocket',at:'Anti-Tank',ad:'Air Defence',eng:'Engineer',hq:'Headquarters',sup:'Supply',heli:'Aviation',uav:'Drone',ew:'Electronic Warfare',sof:'Special Forces',abn:'Airborne',nav:'Naval',sub:'Submarine',air:'Air',ash:'Airship',mon:'Leviathan',drg:'Dragon',mp:'Military Police',med:'Medical',pow:'POW Guard',ref:'Refugee Relief',ca:'Civil Affairs',ent:'Entertainment',sec:'Security',gue:'Partisan',vg:'Militia',lab:'Labour',sge:'Siege',psy:'Psychological Operations',cus:'Special'};
var ECHEN=['Platoon','Company','Battalion','Regiment','Brigade','Division','Corps','Army','Army Group'];
var LEAFEN={art:'Battery',rkt:'Battery',mor:'Battery',ad:'Battery',cav:'Troop',rec:'Troop',arm:'Squadron',air:'Squadron',heli:'Squadron',nav:'Squadron',ash:'Flight',drg:'Flight',uav:'Flight'};
/* 稱號：中文（形容 × 名詞）、西方（The Adj Noun）；另有榮譽前綴（近衛、擲彈兵、皇家……） */
var TTLZ={a:['鐵血','常勝','無敵','忠勇','剛烈','雷霆','旋風','鋼鐵','神威','驍勇','赤膽','英武','長城','磐石','破曉','天狼','猛虎','飛鷹','蒼龍','雪豹','黑鷹','白狼','烈焰','鐵壁','不屈','百戰','鋒鏑','鐵流','雄關','朔風','驚雷','長纓','霹靂','玄甲','金戈','紅星','曙光','寒鋒','銳意','鎮遠','定邊','安瀾','破陣','斬棘','凌雲','擎天','穿雲','逐日','踏雪','鎮岳'],
  b:['雄師','勁旅','鐵軍','先鋒','虎賁','鐵騎','衛隊','銳士','戰狼','狼群','尖刀','鐵拳','神兵','雄鷹','鐵衛','勇士','精兵','鐵旅','鋼刀','利劍','飛虎','猛士','鐵甲','鷹隼','蛟龍','鐵錘','盾牌','長矛','烈馬','雷鳴','鋒刃','鐵翼','怒濤','鐵砧','突擊隊','守備隊','鐵漢','遊騎'],
  pre:['近衛','御林','禁衛','擲彈兵','突擊','皇家','鐵衛','先鋒']};
var TTLW={a:['Iron','Black','Red','White','Grey','Golden','Silver','Steel','Royal','Loyal','Bold','Fighting','Lucky','Old','Thunder','Storm','Northern','Highland','Desert','Mountain','Fearless','Unbroken','Valiant','Crimson','Scarlet','Stalwart','Midnight','Ironclad','Copper','Emerald','Ever-Ready','Hard-Charging','Rough','Swift','Stone','Wild','Gallant','Steadfast','Blue','Green'],
  b:['Wolves','Lions','Eagles','Hawks','Falcons','Bears','Tigers','Panthers','Ravens','Dragoons','Lancers','Grenadiers','Rifles','Rangers','Guards','Fusiliers','Hussars','Devils','Diehards','Bulldogs','Stags','Foxes','Vipers','Arrows','Spears','Swords','Shields','Hammers','Anvils','Thunderbolts','Ironsides','Greyhounds','Mastiffs','Wildcats','Sentinels','Vanguard'],
  pre:['Guards','Royal','Grenadier','Assault','Life Guard','King\'s Own','Queen\'s Own','Highland']};
function ttlGen(r,style,used){used=used||{};for(var i=0;i<60;i++){var s;if(style==='west'){var a=TTLW.a[Math.floor(r()*TTLW.a.length)],b=TTLW.b[Math.floor(r()*TTLW.b.length)];s='The '+a+' '+b;if(!wOK(s))continue;}else{var a2=TTLZ.a[Math.floor(r()*TTLZ.a.length)],b2=TTLZ.b[Math.floor(r()*TTLZ.b.length)];s=a2+b2;if(!zhOK(s))continue;}if(!used[s]){used[s]=1;return s;}}return s;}
/* 部隊命名規則（陣營設定）：num seq／rand、fmt arabic／zh／west、ttl none／elite／all、pre 是否加榮譽前綴（精英） */
function nmOf(side){var S=SD(side)||{};return Object.assign({num:'seq',fmt:'arabic',ttl:'none',pre:true},S.nm||{});}
function numTxt(n,fmt){return fmt==='zh'?zhNum(n):String(n);}
/* 由範本與序號組成名稱（中文規則）；西式規則改用兵種與梯隊組成 */
function unitNameOf(u,n,cfg){var s=ST(u),ech=clamp(u.ech||1,0,8);if(cfg.fmt==='west'){var br=BREN[s.br]||'',leaf=isLeaf(u);if(leaf&&ech<=1){var L=String.fromCharCode(64+clamp(n,1,26));return L+' '+(LEAFEN[clsOf(u)]||LEAFEN[s.br]||'Company');}
    if(ech===6)return roman(n)+' Corps';if(ech===2)return ordEn(n)+' Battalion';if(ech===8)return ordEn(n)+' Army Group';if(ech===7)return ordEn(n)+' Army';return ordEn(n)+' '+(br&&ech>=3?br+' ':'')+ECHEN[ech];}
  if(u.tpl&&u.tpl.indexOf('{i}')>=0)return fmtName(u.tpl,numTxt(n,cfg.fmt));return u.name;}
/* 套用命名規則到整個陣營（保留手動改名者 u.nmLock） */
function renameSide(side,cfg,r){cfg=cfg||nmOf(side);r=r||mb32(hstr('nm|'+side+'|'+Date.now()));var used={},tu={};
  G.units.filter(function(u){return u.side===side&&(u.p<0||!uById(u.p));}).forEach(function walk(u){var kids=kidsOf(u);
    if(!u.nmLock&&(u.tpl||cfg.fmt==='west')){var n=u.ix||1;if(cfg.num==='rand'&&(u.ech||1)>=3){var R=NUMR[clamp(u.ech,0,8)],key=u.ech+'|'+(u.tpl||'')+'|'+ST(u).br;for(var t=0;t<200;t++){n=R[0]+Math.floor(r()*(R[1]-R[0]+1));if(!used[key+'|'+n])break;}used[key+'|'+n]=1;}
      u.num=n;var nm=unitNameOf(u,n,cfg);if(nm){var hp=u.hpre&&cfg.pre?(cfg.fmt==='west'?u.hpre+' ':u.hpre):'';u.name=hp+nm;}}
    var elite=u.elite||(isLeaf(u)?profIdxOf(u)>=4:false)||(u.founded&&uEra(u).y-u.founded>=100);if(cfg.ttl==='all'&&(u.ech||1)>=3||cfg.ttl==='elite'&&elite&&(u.ech||1)>=2){if(!u.ttl||u.ttlAuto){u.ttl=ttlGen(r,cfg.fmt==='west'?'west':'zh',tu);u.ttlAuto=1;}}else if(u.ttlAuto){u.ttl='';u.ttlAuto=0;}
    kids.forEach(walk);});dupNames();}
/* 顯示用全名（含稱號） */
function fullName(u){return u?(u.name||'')+(u.ttl?(/[a-z]/i.test(u.ttl)?' "'+u.ttl+'"':'「'+u.ttl+'」'):''):'';}
