/* ===================== 部隊對話：兵牌旁冒出的簡短對話（只在畫面上，不影響模擬） =====================
   依部隊當下的處境挑一句話：閒置、行軍、防禦與構工、伏擊、發現敵人、對峙、遭射擊（輕兵器、砲擊、空襲、直升機、無人機、
   轟炸、戰車、白刃戰）、持續交火、毒氣、核爆與落塵、包圍、傷亡、士氣動搖、潰散與重整、恐懼（屍群、不可名狀之物、低語）、
   背水一戰、死人衝鋒、友軍投降遭處決、彈藥與燃料、飢餓與飢荒、收到命令、抵達、佔領、俘虜、誤擊、指揮部被毀、增援抵達、
   渡河、撤退、進攻、戰鬥結束、被點選；飛行員與艦艇另有說法。
   每種處境有多種說法，依年代、兵種、晝夜與天候、士氣挑選；同一句話短時間內不重複。
   只讀模擬狀態、用自己的計數器挑句子，開關不會改變戰局；聯機時用伺服器送來的狀態。
   句子前的標記：^年 起、_年 止、@兵種（inf 步兵、arm 裝甲、at 反裝甲、art 砲兵、ad 防空、cav 騎兵、eng 工兵、med 醫護、
   hq 指揮與通信、sup 後勤、air 飛行員、sea 艦艇；沒有標記的句子適用所有地面部隊）、! 只在動搖時、~ 只在鎮定時、
   n 夜間、d 白天、r 下雨、s 下雪、f 起霧、c 寒冷、h 炎熱。{dir} 方向、{km} 距離、{role} 依兵種與年代的職務。 */
var VOXD={
 idle:['還要等多久……','有人有水嗎？','[^1860]誰還有菸？','[^1860]菸只剩半根了','我的腳又起泡了','襪子濕了一整天','聽說後面有熱湯','別睡，等一下換你站哨','家裡的信還沒到','不知道家裡怎麼樣了',
  '這仗什麼時候打完？','槍擦了沒？','[_1860]火藥要保持乾燥','[_1840]燧石該換了','[^1900]又是罐頭牛肉','又是硬餅乾','鞋底快磨穿了','你睡得著嗎？','他們今晚會來嗎？','安靜得讓人發毛',
  '我想洗個澡','別亂晃，會被看到','數數看還剩幾發','我娘一定在擔心','昨天那個人……算了','別想了，睡一下','聽說要換防了','誰知道我們在等什麼','衣服三個禮拜沒換了','[^1880]給我看看你女兒的照片',
  '這裡以前是誰的田？','[n]天快亮了吧','[n]黑成這樣什麼都看不到','[n ~]星星真多','[n]月亮出來了，小心點','[n]誰在打呼？','[n]冷得睡不著','[d ~]總算出太陽了','[r]雨一直下','[r ^1914]壕溝裡都是水',
  '[r]連骨頭都濕了','[s]雪又下了','[s]腳趾頭沒感覺了','[c]手指凍得沒知覺','[c]把手塞進腋下暖一暖','[c]水壺結冰了','[h]熱死了，水省著喝','[h]汗流進眼睛了','[h]蒼蠅好多','[f]霧這麼大，什麼都看不見',
  '[f]霧裡好像有聲音','[~]總算能喘口氣','[~]能活到現在算運氣','[!]我不想再上去了','[!]手一直在抖','[!]剛才那些人……','[!]閉上眼就看到他們','[@arm]車裡悶得要命','[@arm]履帶要檢查一下','[@arm]引擎聲吵得睡不著',
  '[@arm ^1935]無線電又是雜訊','[@art]砲彈還夠幾輪？','[@art]砲架又鬆了','[@art]耳朵還在嗡嗡叫','[@cav]馬也累了','[@cav]讓馬喝點水','[@cav]馬蹄鐵掉了一個','[@eng]炸藥收好，別受潮','[@eng]鏟子又斷了一把','[@med]繃帶快用完了',
  '[@med]那個傷兵撐不過今晚','[@med]手上的血洗不掉','[@hq ^1880]電話線又斷了','[@hq]上面還沒有新命令','[@hq]地圖對不上','[@hq ^1925]電台沒有回音','[@hq]傳令兵還沒回來','[@sup]車又陷進泥裡了','[@sup]路被炸爛了','[@sup]這批彈藥不夠分',
  '[@ad]天上很安靜','[@ad ^1940]雷達上沒有東西'],
 march:['還有多遠？','跟上，別脫隊','保持間距','腳快走斷了','這條路怎麼沒完沒了','休息十分鐘吧','背包越來越重','別停，繼續走','水壺空了','前面是哪裡？',
  '鞋帶又斷了','又要換地方？','別走路中間','看好前面的人','[^1914]散開走，小心飛機','[n]跟著前面的人，別走丟','[n]不准點火','[n]腳下小心','[r]泥巴都到小腿了','[s]雪太深了',
  '[h]太陽曬得頭昏','[f]霧裡別走散','[!]我走不動了','[!]要是在這裡遇上他們……','[~]唱首歌吧','[@arm]油還夠嗎？','[@arm]前面的車停了','[@arm ^1940]注意路邊的地雷','[@arm]別開太快，步兵跟不上','[@cav]讓馬慢一點',
  '[@cav]下馬，牽著走','[@art]砲車卡住了，推！','[@sup]這座橋撐得住嗎？','[@sup]車子超載了'],
 def:['射界清出來了沒？','再挖深一點','沙包不夠','[^1890]機槍放這裡','[^1870]等他們進到三百公尺再打','[_1860]等看到他們的眼白再開火','[^1916]地雷埋好了沒？','[^1880]鐵絲網拉到那棵樹','標定一下距離','誰看著左翼？',
  '預備陣地在後面','掩體頂上再加一層土','把彈藥分下去','換班看守','別探頭','他們會從哪裡來？','偽裝再弄好一點','記住撤退的路線','水和彈藥先搬進來','[@arm]車身藏到坡後',
  '[@arm ^1916]只露砲塔','[@art]射擊諸元算好了','[@art]預先標定的區域記清楚','[@eng ^1916]雷區標好了','[@eng]路障再加一道','[@hq]預備隊在哪裡？','[@hq]各連回報位置','[!]撐得住嗎……','[!]我們人太少了','[n ^1900]照明彈準備好',
  '[n]聽到動靜先別開槍'],
 dig:['挖！別停','這土太硬了','又挖到石頭','手都磨破了','再深半公尺','先挖散兵坑','[^1900]交通壕連過去','木頭不夠','挖完這個就能休息','[r]挖了又積水',
  '[c]地凍得挖不動','[@eng]把那棵樹砍了','[@eng]掩體的樑架上去','[@eng]這裡要埋雷'],
 ambw:['噓——','別動','別出聲','[^1860]把菸熄了','等我的信號','誰都不准先開火','讓他們走進來','再等等','呼吸放慢','腿麻了……忍著',
  '[^1916]聽……有引擎聲','[n]看得到他們嗎？','前面那個先放過去','先打頭，再打尾','記住自己的射界','[!]心跳好大聲','[@arm]熄火，等'],
 ambh:['來了','還沒……還沒……','讓他們再靠近一點','等最後一個進來','準備……','手指先離開扳機','數到三','看到他們的軍官了','別動，他們沒發現'],
 ambgo:['打！','開火！','就是現在！','[^1916]打頭車！','打後面的，別讓他們跑','全部開火！','[^1890]機槍掃過去！','[^1916]引爆！'],
 spot:['發現敵人！','那邊有動靜','前方有人','[d]樹林邊上有人','[n]那邊有亮光','是我們的人嗎？','他們在{dir}','{dir}有敵人','人不少','[^1916]有車！',
  '別開槍，還太遠','[^1925]用無線電報上去','[_1924]派人回去報告','[@arm]目標，{dir}','[@art]觀測到目標','望遠鏡給我','[d]有煙，他們在做飯'],
 tense:['他們在看我們','別探頭','安靜……','他們為什麼不動？','可能是陷阱','等他們先動','我不喜歡這樣','槍口對準那邊','[n]別發出聲音'],
 fire:['趴下！','有人開槍！','隱蔽！','哪裡打來的？','在{dir}！','子彈從頭上飛過去','找掩護！','還擊！','別抬頭！','[d]他們在樹林裡！',
  '[n]看到槍口火光了','[^1890]機槍！趴下！','[^1870]狙擊手！別抬頭！','[!]我們被打中了！','[!]他們到處都是！','[@arm]關艙蓋！','[@arm]有東西打在車上','[@sup]車隊遇襲！','[@med ^1864]我們是醫護！別打！'],
 combat:['[^1890]換彈匣！','[_1870]裝填！','掩護我！','他們上來了！','壓住他們！','左邊！左邊！','右邊也有！','我沒子彈了！','[^1915]手榴彈！','醫護兵！',
  '他還活著嗎？','別停，繼續打！','換位置！','守住這裡！','[^1890]槍管太燙了！','[^1870]卡彈了！','[_1860]火藥受潮了！','[_1860]排槍——放！','[_1870]保持隊形！','[@arm ^1916]穿甲彈！',
  '[@arm]裝填完畢！','[@arm]打中了，再補一發','[@arm]砲塔轉過去！','[@art]放！','[@art]下一發，快！','[@art ^1900]修正，加一百','[@cav]跟上，別散開！','[@med]擔架！這裡！','[@med]壓住傷口！','[@eng]炸開那道牆！',
  '[!]我們撐不住了！','[!]他們太多了！'],
 art:['砲擊！','進掩體！','趴下！砲彈！','來了！','又來了……','這一發很近','別跑，趴著！','他們標定好了','換位置，他們抓到我們了','地在震',
  '炸得耳朵嗡嗡叫','聽聲音是重砲','[n]晚上也不放過我們','[!]停下來……拜託停下來','[!]受不了了','[@art]反砲兵！快轉移！','[@arm]關艙蓋！'],
 air:['飛機！','散開！','躲進樹林！','低空！趴下！','是我們的還是他們的？','他們又繞回來了','別看天上，趴好！','[^1936 _1950]俯衝轟炸機！','[@ad]開火！跟上它！','[@ad ^1960]鎖定！發射！',
  '[@arm]車子散開！','[@sup]車隊散開！','[!]躲不了……'],
 heli:['直升機！','樹梢後面有直升機','打它！打它！','別動，它在找我們'],
 uav:['無人機！','頭上有嗡嗡聲','別聚在一起，有無人機','它在看我們','打下來！','[^2015]自殺無人機！散開！'],
 bomb:['轟炸機！','天上全是飛機','炸彈落下來了！','地面在跳','一整排都炸了','[!]什麼都不剩了'],
 tank:['坦克！','有戰車！','[^1940]反坦克武器呢？','讓它過去，打後面的步兵','別跑，跑就死了','打它的履帶！','它轉過來了！','[@at]打側面！','[@at ^1970]飛彈準備！','[!]那東西打不穿！'],
 melee:['他們衝進來了！','[_1953 @inf]上刺刀！','肉搏！','別讓他們進壕溝！','用槍托！'],
 gas:['毒氣！毒氣！','[^1915]面具！快戴上！','[_1914]用濕布摀住口鼻！','[^1915]檢查面具！','別揉眼睛！','往上風處走！','眼睛好痛……','喉嚨像火燒','[^1915]有人沒戴好！幫他！','[^1915]敲警報！',
  '[^1950]防護服！快穿！','[!]我吸到了……'],
 gas2:['[^1915]面具裡全是汗','看不清楚……','[^1915]別脫面具','呼吸慢一點','這霧什麼時候散？','水不能喝了','不要碰地上的東西','[^1915]濾毒罐還能用多久？'],
 nkc:['閃光！別看！','臥倒！遮住頭！','天……那是什麼……','蕈狀雲……','什麼都看不見了！','我的眼睛！','衝擊波！趴下！','樹都倒了','[!]結束了嗎？','[^1945]那是原子彈……'],
 nkf:['{dir}那是什麼光？','{dir}的天怎麼亮了？','[^1945]那邊……被核彈打了','地在震','那團雲好高','風往哪邊吹？','大概 {km} 公里遠','那裡還有人嗎……','天殺的……'],
 fo:['[^1945]計數器在叫','[^1945]輻射值上升了','落塵！遮住口鼻！','別吃這裡的東西','把衣服拍乾淨','[!]我們是不是已經……'],
 enc:['我們被包圍了！','後路斷了','四面都是敵人','[^1925]跟上面聯絡不上','彈藥要省著用','守住，等援軍','援軍會來嗎？','[!]完了……'],
 cas:['醫護兵！','{role}中彈了！','有人倒下了','把他拖過來！','壓住傷口！','他還有呼吸嗎？','[^1860]止血帶！','擔架！','別看，繼續打','[!]又一個……'],
 cas2:['我們沒剩幾個人了','長官倒下了！','誰來指揮？','一半的人都沒了','撐不下去了','他們……都還在那裡','收攏剩下的人','[!]為什麼是我們……'],
 shk:['我們撐不住了','誰有命令？','要不要退？','別慌！別慌！','穩住！','他們太多了','我不想死在這裡','[@hq]把人收攏起來'],
 rout:['跑！','撤！撤！','別管了，快走！','丟下東西，快跑！','往後面跑！','不要丟下我！','救命……','各自逃命吧'],
 rly:['集合！在這裡集合！','清點人數','喘口氣，重新編隊','還有人在嗎？','把傷兵帶過來','槍還在的舉手','好……我們還在'],
 fear:['我腿軟了','手一直抖','我不要上去','心跳好快','冷靜……冷靜……','求求你停下來','我想回家','別看那邊'],
 zed:['那些東西又來了','打頭！打頭！','牠們不會停','別讓牠們靠近！','他剛才還是我們的人','被咬的人隔開！','子彈不夠','怎麼殺不完','別看牠們的臉'],
 dem:['那……那是什麼？','子彈打不進去！','別看它！','它沒有形狀……','我的槍沒用','有東西在霧裡','不可能……','退後！全部退後！'],
 psy:['你聽到了嗎？','有人在叫我的名字','誰在說話？','不要聽……不要聽……','那聲音在我腦子裡','是我娘在叫我……','塞住耳朵！'],
 lst:['沒有退路了','他們不收俘虜','把剩下的彈藥分一分','傷兵往後拖','[^1890]最後一個彈匣了','[_1889]最後的火藥了','守住這道牆','要死也死在這裡','誰還能動？'],
 dmc:['咳……跟上……','布……摀住嘴……','往前……','咳咳……他們在前面','眼睛看不見……跟著我','別停……咳……'],
 atro:['他們殺了投降的人','投降也是死','那就別投降','聽說他們全被槍斃了','記住這件事','他們不是人','[!]下一個就是我們'],
 ammo:['彈藥不多了','省著點打','誰還有子彈？','[^1890]只剩兩個彈匣','[_1889]火藥快用完了','要補給！','[@arm]砲彈只剩幾發','[@art]砲彈快打光了'],
 ammo0:['沒子彈了！','打光了！','撿他們的槍','[_1953 @inf]上刺刀吧','拿什麼打？'],
 fuel:['油快沒了','這點油跑不遠','要加油了','熄火，省油'],
 fuel0:['沒油了','車動不了了','棄車吧','[^1916]把機槍拆下來'],
 hun:['好餓','幾天沒吃東西了','有沒有吃的？','肚子在叫','皮帶又往裡扣了一格','草根能吃嗎？','[@cav]馬也沒有草料了'],
 hun2:['走不動了……','眼前發黑','他昨晚沒醒過來','[@cav]把馬殺了吧','有人在煮皮帶','我不想餓死在這裡','[!]好冷……'],
 civfam:['那些孩子好幾天沒吃了','村裡的人在吃樹皮','分一點口糧給他們？','別看那些人','路邊又多了幾個……'],
 ack_atk:['收到，前進','明白，準備進攻','又要上去了？','是，出發','準備好了','[_1953 @inf]上刺刀','[!]又是我們？','[@arm]車隊，前進'],
 ack_def:['收到，就地防守','明白，挖工事','守在這裡','是，固守','好，等他們來'],
 ack_mv:['收到，出發','是，移動','明白','走了，跟上','整隊，出發','又要換地方'],
 ack_wd:['收到，撤退','撤？好……','帶上傷兵','交替掩護後撤','終於……','別留東西給他們'],
 ack_amb:['收到，去設伏','明白，悄悄過去','安靜行動','找好位置'],
 ack_art:['收到，準備射擊','諸元？','裝填','明白，砲擊','是，火力支援'],
 ack_x:['收到，準備渡河','船呢？','水有多深？','橋還要多久？'],
 ack_rest:['收到，休息','總算……','可以睡一下了','先吃點東西'],
 ack:['收到','明白','是','了解','照辦','遵命'],
 arr:['到了','已經到位','就是這裡','停下，展開','各就各位','任務完成','喘口氣','下一步呢？'],
 obj:['拿下了','這裡是我們的了','檢查每一間房子','清點傷亡','別鬆懈，他們會反擊','結束了……這一段'],
 pow:['他們投降了','把手舉起來！','搜他們身上','別開槍，他們投降了','給他們水','押到後面去'],
 ff:['自己人！停火！','別打！是我們！','誰在打我們？','[^1900]發信號彈！','停火！停火！'],
 hqx:['指揮部沒了','長官陣亡了','現在誰負責？','聯絡不上上面'],
 reinf:['這裡就是前線？','好安靜','他們說這裡不會打很久','那些是……屍體？','我們去哪裡報到？'],
 xing:['水好冷','抓緊繩子！','船要翻了！','別讓槍泡水','對岸有人嗎？','快划！'],
 wd:['交替掩護！','別回頭，走！','帶上傷兵','別留東西給他們','後衛跟上','又放棄了一個地方'],
 atk:['散開！散開！','跟上！','前進！','衝過那片空地！','壓低身體','下一個掩體！','別停在空地上！','[@arm]全速前進！','[^1916 @inf]跟著坦克走'],
 end:['結束了嗎？','停火了……','清點人數','還活著','把他們埋了吧','我想回家'],
 sel:['在','請指示','等待命令','我們在這裡','準備好了','是，長官','[!]我們需要支援','[!]撐不了多久了','[!]人手不夠',
  '[@air]待命中','[@air]請指示目標','[@sea]艦上待命','[@sea]請指示航向'],
 air_atk:['[@air]目標確認','[@air]進入攻擊','[@air]投彈！','[@air]拉起來！','[@air]再一輪','[@air]打中了'],
 air_aa:['[@air]高射砲！','[@air]規避！','[@air ^1960]飛彈來襲！','[@air ^1965]熱焰彈！','[@air]被打中了！','[@air]引擎冒煙了'],
 air_idle:['[@air]空域淨空','[@air]油量還夠','[@air]沒看到目標','[@air]雲層太厚','[@air]準備返航'],
 sea_fire:['[@sea]敵艦！','[@sea]左滿舵！','[@sea]損管！','[@sea]進水了！','[@sea ^1900]魚雷！','[@sea]所有砲火，開火！'],
 sea_idle:['[@sea]海面平靜','[@sea ^1918]聲納沒有接觸','[@sea ^1940]雷達淨空','[@sea]又要值夜班']};
/* {role}：依兵種與年代 */
var VOXR={inf:['[^1890]機槍手','[^1850]步槍兵','[_1849]火槍手','班長','[^1900]通信兵','彈藥兵','新兵','老兵'],arm:['駕駛','裝填手','砲手','車長'],at:['射手','裝填手','班長'],art:['裝填手','觀測員','砲手','班長'],ad:['砲手','觀測員'],
  cav:['號兵','班長','騎兵'],eng:['爆破手','班長'],med:['擔架兵'],hq:['參謀','傳令兵','[^1900]通信兵'],sup:['[^1910]駕駛','搬運兵','班長'],air:['僚機'],sea:['水兵']};
var VOX={L:[],s:{},r:{},H:{},rec:[],c:0,g:null,nk:0,lgT:0,end:0,last:0,lc:0,n:0,selId:0,P:null};
/* ---------- 句庫 ---------- */
function voxParse(){if(VOX.P)return VOX.P;var P={};for(var k in VOXD)P[k]=VOXD[k].map(function(s){var o={t:s,y0:-1e9,y1:1e9,g:null,m:'',e:''},m=/^\[([^\]]*)\]/.exec(s);
    if(m){o.t=s.slice(m[0].length);m[1].split(/\s+/).forEach(function(q){if(!q)return;var c=q.charAt(0);if(c==='^')o.y0=+q.slice(1);else if(c==='_')o.y1=+q.slice(1);else if(c==='@')o.g=q.slice(1).split(',');else if(q==='!'||q==='~')o.m=q;else o.e+=q;});}return o;});return VOX.P=P;}
function voxG(u,s){s=s||ST(u);var b=s.br;if(s.dom==='air'||u.st==='air')return 'air';if(s.dom==='sea'||s.dom==='sub')return 'sea';if(b==='arm'||b==='at'&&s.hard>=0.5)return 'arm';if(b==='at')return 'at';
  if(b==='art'||b==='mor'||b==='rkt'||b==='sge')return 'art';if(b==='ad')return 'ad';if(b==='cav')return 'cav';if(b==='eng')return 'eng';if(b==='med')return 'med';if(b==='hq'||b==='com'||b==='ew'||b==='ca'||b==='psy')return 'hq';
  if(b==='sup'||b==='lab'||b==='ent'||b==='pow'||b==='ref')return 'sup';return 'inf';}
/* 挑句子的情境：年代、兵種、士氣、晝夜與天候 */
function voxCtx(u){var s=ST(u),E=uEra(u)||{},W=WX[G.env&&G.env.wx]||WX[0],T=G.env?G.env.T:undefined,f=u.fear||0,L=G.env?G.env.light:1;
  return {y:E.fan?1600:(E.y||1943),g:voxG(u,s),st:u.ms!=='ok'||f>=40||strFrac(u)<0.5,calm:u.ms==='ok'&&f<25,n:L<0.3,d:L>=0.6,r:W[3]>0,s:W[4]>0,f:W[2]<0.5&&!W[3]&&!W[4],c:T!==undefined&&T<0,h:T!==undefined&&T>30};}
function voxOk(q,C,x){if(C.y<q.y0||C.y>q.y1)return false;if(q.g){if(q.g.indexOf(C.g)<0)return false;}else if(C.g==='air'||C.g==='sea')return false;if(q.m==='!'&&!C.st||q.m==='~'&&!C.calm)return false;
  for(var i=0;i<q.e.length;i++)if(!C[q.e.charAt(i)])return false;if(q.t.indexOf('{dir}')>=0&&!(x&&x.dir)||q.t.indexOf('{km}')>=0&&!(x&&x.km))return false;return true;}
/* 合適的句子裡挑一句：有兵種或天候標記的比較常出現；最近說過的句子先跳過 */
function voxPick(u,k,x){var A=voxParse()[k];if(!A)return null;var C=voxCtx(u),L=[];A.forEach(function(q){if(!voxOk(q,C,x))return;L.push(q);if(q.g||q.e||q.m)L.push(q,q);});if(!L.length)return null;
  var i0=hstr(u.id+'|'+k+'|'+(++VOX.c))%L.length,q=null;for(var j=0;j<L.length;j++){var c=L[(i0+j)%L.length];if(VOX.rec.indexOf(c.t)<0){q=c;break;}}q=q||L[i0];VOX.rec.push(q.t);if(VOX.rec.length>40)VOX.rec.shift();
  return q.t.replace('{dir}',x&&x.dir||'').replace('{km}',x&&x.km||'').replace('{role}',voxRole(u,C));}
function voxRole(u,C){var L=(VOXR[C.g]||VOXR.inf).filter(function(s){var m=/^\[([\^_])(\d+)\]/.exec(s);return !m||(m[1]==='^'?C.y>=+m[2]:C.y<=+m[2]);});return (L[hstr(u.id+'|r|'+VOX.c)%L.length]||'有人').replace(/^\[[^\]]*\]/,'');}
function voxDir(u,x,y){var a=Math.atan2(y-u.y,x-u.x),i=Math.round(((a+PI*2.5)%(PI*2))/(PI/4))%8;return ['北','東北','東','東南','南','西南','西','西北'][i];}
/* ---------- 說話 ---------- */
function voxMine(u,me){return me===null||me===undefined?u.side>=0:u.side===me;}
function voxPlayer(u){return !(typeof aiControls==='function'&&aiControls(u));}
function voxSay(u,k,pri,x,force){var mode=UIP.vox||'all';if(mode==='off'||mode==='key'&&pri>1)return null;var now=performance.now(),R=VOX.r[u.id]||(VOX.r[u.id]={}),gap=pri===1?3500:pri===2?9000:22000;
  if(!force&&now-(R.lr||-1e9)<gap)return null;var a=typeof bubAt==='function'?bubAt(u.id):null;if(!a)return null;var ax=Math.round(a[0]),ay=Math.round(a[1]);
  /* 同一個兵牌（上級兵牌合併顯示時）一次只冒一句：比較緊急的留著，否則換成新的 */var same=function(b){return Math.abs(b.ax-ax)<4&&Math.abs(b.ay-ay)<4;};if(VOX.L.some(function(b){return b.u!==u.id&&same(b)&&b.pri<pri;}))return null;
  var txt=voxPick(u,k,x);if(!txt)return null;R.lr=now;R.lk=k;VOX.L=VOX.L.filter(function(b){return b.u!==u.id&&!same(b);});VOX.L.push({u:u.id,txt:txt,pri:pri,t0:now,k:k,ax:ax,ay:ay,col:sideCol(u.side)});
  var N=+UIP.voxN||3;if(VOX.L.length>N){VOX.L.sort(function(a,b){return a.pri-b.pri||b.t0-a.t0;});VOX.L=VOX.L.slice(0,N);}
  var H=VOX.H[u.id]||(VOX.H[u.id]=[]);H.unshift({t:G.t,txt:txt,k:k});if(H.length>5)H.length=5;VOX.n++;voxRedraw();return txt;}
/* 暫停時地圖不會一直重畫：冒出新的一句與它消失時各重畫一次 */
function voxRedraw(){if(UI.run||typeof vDraw!=='function')return;if(!VOX.rf){VOX.rf=1;requestAnimationFrame(function(){VOX.rf=0;try{vDraw(false);}catch(e){}});}
  clearTimeout(VOX.rt);VOX.rt=setTimeout(function(){if(!UI.run&&VOX.L.length)try{vDraw(false);}catch(e){}},(+UIP.voxT||4.5)*1000+80);}
/* 遭到誰的攻擊 */
function voxAtk(u,a){if(!a)return 'fire';var s=ST(a),b=s.br;if(s.dom==='air'||a.st==='air'){if(b==='heli')return 'heli';if(b==='uav')return 'uav';if(typeof airRole==='function'&&airRole(a)==='bomber')return 'bomb';return 'air';}
  if(b==='art'||b==='mor'||b==='rkt'||b==='sge'||s.dom==='sea'||s.dom==='sub')return 'art';if(b==='uav')return 'uav';if(b==='arm'||s.hard>=0.6&&b!=='inf'&&b!=='mech')return 'tank';return dist(u.x,u.y,a.x,a.y)<150?'melee':'fire';}
function voxFearK(u){var s=u.frS||'';return /低語/.test(s)?'psy':/不可名狀/.test(s)?'dem':/屍/.test(s)?'zed':'fear';}
function voxZed(u){var best=null,bd=1e9;zedList().forEach(function(h){var d=dist(u.x,u.y,h.x,h.y);if(d<bd){bd=d;best=h;}});if(!best)return '';var K=(typeof ZK!=='undefined'&&ZK[best.k])||{};if(K.psy&&bd<900)return 'psy';if(bd>600)return '';return K.dem?'dem':'zed';}
function voxFamNear(u){if(typeof famStage!=='function'||!G.civ||!G.civ.S)return false;return G.civ.S.some(function(g){return famStage(g)>0&&dist(u.x,u.y,g.x,g.y)<g.r+800;});}
function voxAckK(k,g){if(g==='air'||g==='sea')return null;if(/^(attack|storm|breakthrough|penetrate|pursue|eager|joint|landing|airdrop|airlift)$/.test(k))return 'ack_atk';if(/^(defend|holdfast|fortify|siege|screen)$/.test(k))return 'ack_def';
  if(/^(withdraw|delay)$/.test(k))return 'ack_wd';if(k==='ambush')return 'ack_amb';if(/^(bombard|support)$/.test(k))return 'ack_art';if(/^(crossing|waitx|xsite|bridge|breach)$/.test(k))return 'ack_x';if(/^(rest|rot|halt|reserve)$/.test(k))return 'ack_rest';
  if(/^(move|rejoin|patrol|recon)$/.test(k))return 'ack_mv';if(/^(twd|gas|refuse|lst|dmc)$/.test(k))return null;return 'ack';}
/* 狀態一改變就說一句（依緊急程度排序） */
function voxDetect(u,P,N,s){var g=voxG(u,s);
  if(N.gas&&!P.gas)return ['gas',1];if(N.ms==='rout'&&P.ms!=='rout')return ['rout',1];if(N.lst&&!P.lst)return ['lst',1];if(N.dmc&&!P.dmc)return ['dmc',1];if(N.en&&!P.en)return ['enc',1];
  if(N.zk&&N.zk!==P.zk)return [N.zk,1];
  if(N.uf&&!P.uf){if(g==='air')return ['air_aa',1];if(g==='sea')return ['sea_fire',1];if(N.fd&&N.ok==='ambush')return ['ambgo',1];var a=u.ufBy?uById(u.ufBy):null;return [voxAtk(u,a),1,a?{dir:voxDir(u,a.x,a.y)}:null];}
  if(N.fd&&!P.fd&&N.ok==='ambush')return ['ambgo',1];if(N.fd&&!P.fd&&g==='air')return ['air_atk',2];if(N.rad&&!P.rad)return ['fo',1];
  if(N.sb<P.sb)return [N.sb<=1?'cas2':'cas',N.sb<=1?1:2];if(N.ms==='shaken'&&P.ms==='ok')return ['shk',2];if(N.ms!=='rout'&&P.ms==='rout')return ['rly',2];
  if(N.cp>P.cp)return ['pow',2];if(N.at&&!P.at)return ['atro',2];if(N.fr>=65&&P.fr<65)return [voxFearK(u),2];
  if(N.ab<P.ab)return [N.ab===0?'ammo0':'ammo',2];if(N.fb<P.fb)return [N.fb===0?'fuel0':'fuel',2];if(N.hn>=90&&P.hn<90)return ['hun2',2];if(N.hn>=60&&P.hn<60)return ['hun',3];
  if(N.ed&&!P.ed&&!N.uf&&!N.fd){var e=u._eid?uById(u._eid):null,x=e?{dir:voxDir(u,e.x,e.y)}:null;return [N.ok==='ambush'?'ambh':g==='air'?'air_atk':g==='sea'?'sea_fire':'spot',2,x];}
  if(N.oid&&N.oid!==P.oid&&N.ox&&voxPlayer(u)){var k=voxAckK(N.ok,g);if(k)return [k,3];}
  if(N.dn&&!P.dn&&N.oid===P.oid&&voxPlayer(u)&&g!=='air'&&g!=='sea')return ['arr',3];return null;}
/* 沒有新狀況時的閒聊與持續交火中的喊叫 */
function voxAmb(u,N){var s=ST(u),g=voxG(u,s),t=G.t,ok=N.ok;if(g==='air')return [N.fd?'air_atk':'air_idle',3];if(g==='sea')return [N.uf||N.fd?'sea_fire':'sea_idle',3];
  if(N.uf){var a=u.ufBy?uById(u.ufBy):null,k=voxAtk(u,a);return [k==='fire'||k==='melee'?'combat':k,2];}if(N.fd)return ['combat',2];if(N.gas)return ['gas2',2];if(N.rad)return ['fo',3];
  if(N.hn>=60)return [N.hn>=90?'hun2':'hun',3];if(N.fr>=50)return [voxFearK(u),3];if(N.ed)return [ok==='ambush'?'ambh':'tense',3];
  if(t-(u.uf||-1e9)<900||t-(u.fired||-1e9)<900)return null;if(ok==='ambush')return ['ambw',3];
  if(N.ox&&/^(withdraw|twd|delay)$/.test(ok))return ['wd',3];if(N.ox&&/^(attack|storm|breakthrough|penetrate|pursue|eager|joint)$/.test(ok))return ['atk',3];
  if(N.ox&&/^(crossing|waitx|xsite|bridge)$/.test(ok))return ['xing',3];if(N.ox&&/^(fortify|build)$/.test(ok))return ['dig',3];
  if(N.mv&&(u.form==='march'||/^(move|rejoin|patrol|recon|screen)$/.test(ok)))return ['march',3];
  if(/^(defend|holdfast|siege)$/.test(ok)&&!N.dn)return [(u.ent||0)<0.5&&hstr(u.id+'|d|'+VOX.c)%3===0?'dig':'def',3];if(voxFamNear(u))return ['civfam',3];return ['idle',3];}
function voxChat(C,now){var F=+UIP.voxF||1;if(now-VOX.lc<Math.max(1200,3800/F))return;C=C.filter(function(q){var R=VOX.r[q[0].id];return !R||now-(R.lr||-1e9)>(q[1].uf||q[1].fd?15000:60000)/F;});if(!C.length)return;
  var n=++VOX.c;if((hstr('p|'+n)%1000)/1000>Math.min(1,0.18*F*Math.sqrt(C.length)))return;var q=C[hstr('c|'+n)%C.length],k=voxAmb(q[0],q[1]);if(k&&voxSay(q[0],k[0],k[1]))VOX.lc=now;}
/* 核爆：畫面上離爆心最近的幾個部隊 */
function voxNukes(me){var L=G.nukes||[];if(VOX.nk>L.length)VOX.nk=L.length;for(;VOX.nk<L.length;VOX.nk++){var z=L[VOX.nk];if(G.t-z.t>120)continue;var U=[],R=Array.isArray(z.R)?z.R[2]:+z.R||2000;
  G.units.forEach(function(u){if(!voxMine(u,me)||!isLeaf(u)||!onMap(u))return;var d=dist(u.x,u.y,z.x,z.y);if(d<40000)U.push([d,u]);});U.sort(function(a,b){return a[0]-b[0];});
  var n=0;U.forEach(function(q){if(n<3&&voxSay(q[1],q[0]<Math.max(1500,R)?'nkc':'nkf',1,{dir:voxDir(q[1],z.x,z.y),km:fx(Math.max(1,q[0]/1000),0)},true))n++;});}}
/* 戰報紀錄裡的事件：誤擊、指揮部被毀、佔領目標、增援抵達 */
function voxNear(me,x,y,R){var best=null,bd=R;G.units.forEach(function(u){if(!voxMine(u,me)||!isLeaf(u)||!onMap(u))return;var d=dist(u.x,u.y,x,y);if(d<bd){bd=d;best=u;}});return best;}
function voxLog(me){var L=G.log||[],out=[];for(var i=L.length-1;i>=0&&out.length<300;i--){var e=L[i];if(!(e.t>VOX.lgT))break;out.push(e);}VOX.lgT=Math.max(VOX.lgT,G.t);
  out.reverse().forEach(function(e){var u=e.u?uById(e.u):null;if(e.k==='ff'&&u&&voxMine(u,me))voxSay(u,'ff',1,null,true);else if(e.k==='reinf'&&u&&voxMine(u,me)&&isLeaf(u))voxSay(u,'reinf',3);
    else if(e.k==='hq'&&(me===null||e.s===me)&&e.x!==undefined){var h=voxNear(me,e.x,e.y,4000);if(h)voxSay(h,'hqx',2);}else if(e.k==='obj'&&(me===null||e.s===me)&&e.x!==undefined){var o=voxNear(me,e.x,e.y,2000);if(o)voxSay(o,'obj',2);}});}
function voxReset(){VOX.g=G;VOX.L=[];VOX.s={};VOX.r={};VOX.H={};VOX.rec=[];VOX.nk=(G.nukes||[]).length;VOX.lgT=G.t;VOX.end=G.over?1:0;VOX.selId=0;VOX.lc=0;}
function voxScan(){if(!G||!G.started||G.replay)return;if(VOX.g!==G){voxReset();return;}var mode=UIP.vox||'all';if(mode==='off'){VOX.L.length=0;return;}var now=performance.now();if(now-VOX.last<600)return;VOX.last=now;
  if(UI.tab!=='battle'||!VW.cw)return;var me=mySide(),t=G.t,run=!!UI.run||typeof mpActive==='function'&&mpActive(),cb=!!((G.cbx&&G.cbx.length)||G.cbgr),rad=!!(G.rad&&G.rad.length)||cb,zon=!!G.zed&&typeof zedList==='function'&&zedList().length>0;
  voxNukes(me);voxLog(me);if(G.over&&!VOX.end){VOX.end=1;var k=0;G.units.forEach(function(u){if(k<3&&voxMine(u,me)&&isLeaf(u)&&onMap(u)&&voxSay(u,'end',2,null,true))k++;});}
  var chat=run&&!G.over&&VW.s>=1.1&&mode==='all'&&UIP.voxC!==0,C=[];
  G.units.forEach(function(u){if(!voxMine(u,me)||!isLeaf(u)||!onMap(u)||u.st==='lift'||u.side>=nSides()&&me!==null)return;var p=w2s(u.x,u.y),vis=p[0]>-30&&p[1]>-30&&p[0]<VW.cw+30&&p[1]<VW.ch+30,s=ST(u),o=u.ord,
      fq=typeof fuelDep==='function'&&fuelDep(u)?fuelQ(u):1,sf=strFrac(u),P=VOX.s[u.id],
      N={x:u.x,y:u.y,uf:t-(u.uf||-1e9)<90,fd:t-(u.fired||-1e9)<90,ms:u.ms,sb:sf>=0.75?3:sf>=0.5?2:sf>=0.25?1:0,ab:u.ammo<10?0:u.ammo<30?1:2,fb:fq<0.05?0:fq<0.25?1:2,en:!!(u.encT&&t-u.encT<600),
        lst:!!(u.lst&&t<u.lst.t1),dmc:!!(u.dmc&&t<u.dmc.t1),at:!!u.atH,fr:u.fear||0,hn:u.lg?u.lg.hun||0:0,oid:o?o.oid:0,ox:!!(o&&o.st==='exec'),dn:!!(o&&o.st==='done'),ok:o?(o.dk||o.k||''):'',cp:u.capts||0,ed:!!(u._eid&&u._ed<2500)};
    N.mv=!!P&&Math.abs(u.x-P.x)+Math.abs(u.y-P.y)>2;if(vis&&cb)N.gas=gasAt(u.x,u.y)>0.02?1:0;else if(P)N.gas=P.gas;if(vis&&rad&&typeof geigLvl==='function')N.rad=geigLvl(u.x,u.y)>0.08?1:0;else if(P)N.rad=P.rad;
    if(vis&&zon)N.zk=voxZed(u);else if(P)N.zk=P.zk;VOX.s[u.id]=N;if(!P||!vis)return;var c=voxDetect(u,P,N,s);if(c&&voxSay(u,c[0],c[1],c[2]))return;if(chat)C.push([u,N]);});
  if(C.length)voxChat(C,now);if(++VOX.gc>500){VOX.gc=0;for(var id in VOX.s){var q=uById(+id);if(!q||!alive(q)){delete VOX.s[id];delete VOX.r[id];delete VOX.H[id];}}}}
VOX.gc=0;
/* ---------- 畫面：兵牌右上方的對話泡泡（緊急的用紅框） ---------- */
function voxDraw(c){if(!VOX.L.length)return;var now=performance.now(),life=(+UIP.voxT||4.5)*1000;VOX.L=VOX.L.filter(function(b){return now-b.t0<life;});if(!VOX.L.length)return;c.save();c.font='11px sans-serif';c.textBaseline='middle';var boxes=[];
  VOX.L.forEach(function(b){var a=bubAt(b.u);if(!a)return;var t='「'+(b.txt.length>20?b.txt.slice(0,19)+'…':b.txt)+'」',w=c.measureText(t).width+10,h=17,x=clamp(a[0]+a[2]*0.55,2,VW.cw-w-2),y=Math.max(2,a[1]-a[2]*0.8-h);
    for(var k=0;k<5&&boxes.some(function(q){return x<q[2]&&x+w>q[0]&&y<q[3]&&y+h>q[1];});k++)y-=h+2;boxes.push([x,y,x+w,y+h]);var tx=clamp(a[0]+a[2]*0.3,x+4,x+w-10),r=5;
    c.globalAlpha=clamp((life-(now-b.t0))/600,0,1);c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    c.lineTo(tx+7,y+h);c.lineTo(tx,y+h+5);c.lineTo(tx+2,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();
    c.fillStyle=b.pri===1?'rgba(255,243,241,.96)':'rgba(255,255,255,.93)';c.fill();c.lineWidth=b.pri===1?1.3:0.9;c.strokeStyle=b.pri===1?'#C62828':b.col||'#546E7A';c.stroke();
    c.fillStyle=b.pri===1?'#8E1B1B':'#263238';c.fillText(t,x+5,y+h/2+0.5);});c.restore();}
(function(){var b=drawTop;drawTop=function(){b.apply(this,arguments);try{if(!G||!G.map||!VW.ct)return;voxScan();if(UI.tab==='battle'&&VOX.L.length){var c=VW.ct.getContext('2d'),d=VW.dpr;c.setTransform(d,0,0,d,0,0);voxDraw(c);}}catch(e){if(!VOX.err){VOX.err=1;if(window.console)console.warn('vox',e);}}};})();
(function(){var b=PAGES.battle;PAGES.battle=function(){var r=b.apply(this,arguments);VOX.L=[];return r;};})();
/* 點選本方部隊：回一句話 */
(function(){var b=btSel;btSel=function(){var r=b.apply(this,arguments);try{if(G&&G.started&&!G.replay&&UI.sel&&UI.sel.length===1){if(UI.sel[0]!==VOX.selId){VOX.selId=UI.sel[0];var u=uById(VOX.selId);if(u&&UIP.voxSel!==0&&voxMine(u,mySide())&&isLeaf(u)&&onMap(u))voxSay(u,'sel',3);}}else VOX.selId=0;}catch(e){}return r;};})();
/* 部隊面板：最近聽到的幾句 */
(function(){var b=btStatus;btStatus=function(){b.apply(this,arguments);try{if(!G||!G.started||(UIP.vox||'all')==='off'||UI.selX||UI.selC||UI.selB||!UI.sel||UI.sel.length!==1)return;var u=uById(UI.sel[0]),H=u&&VOX.H[u.id],el=btEl('bst');if(!H||!H.length||!el)return;
  el.insertAdjacentHTML('beforeend','<div class="lw-note lw-voxh" style="margin-top:4px"><b>最近聽到</b>'+H.slice(0,3).map(function(q){var d=G.t-q.t;return '<div>「'+esc(q.txt)+'」<span style="color:#78909C">（'+(d<60?'剛才':durTxt(d)+'前')+'）</span></div>';}).join('')+'</div>');}catch(e){}};})();
/* ---------- 設定 ---------- */
setSec('gfx','vox',{t:'部隊對話',o:14.5,local:true,h:function(){var f=UIP.voxC===0?0:(+UIP.voxF||1);return setOpt(setRow('部隊對話',setSel('voxm','',[['all','全部（預設）'],['key','只有緊急的'],['off','關閉']],UIP.vox||'all','部隊依處境在兵牌旁冒出簡短的對話：遭射擊、砲擊、空襲、毒氣、核爆、包圍、伏擊、防禦、閒置等'))+
  setRow('閒聊',setSel('voxf','',[[0,'不閒聊'],[0.5,'少'],[1,'一般（預設）'],[2,'多']],f,'沒有新狀況時，畫面上的部隊偶爾閒聊幾句；持續交火時的喊叫也算在內'))+setRow('點選時回應',setChk('voxsel','',UIP.voxSel!==0,'點選一個本方部隊時，它回一句話'))+
  setRow('同時最多',setSel('voxn','',[[2,'2 句'],[3,'3 句（預設）'],[5,'5 句'],[8,'8 句']],+UIP.voxN||3))+setRow('停留',setSel('voxt','',[[3,'3 秒'],[4.5,'4.5 秒（預設）'],[7,'7 秒']],+UIP.voxT||4.5)))+
  '<div class="lw-note">只影響這個畫面，不會改變戰局。對話依年代、兵種、晝夜與天候、士氣挑選，同一句話短時間內不會重複；部隊面板列出最近聽到的幾句。無線電回報仍照常冒出方框。</div>';}});
CHG.voxm=function(t){UIP.vox=t.value;uipSave();if(t.value==='off')VOX.L=[];};CHG.voxf=function(t){var v=+t.value;if(!v)UIP.voxC=0;else{UIP.voxC=1;UIP.voxF=v;}uipSave();};
CHG.voxsel=function(t){UIP.voxSel=t.checked?1:0;uipSave();};CHG.voxn=function(t){UIP.voxN=+t.value;uipSave();};CHG.voxt=function(t){UIP.voxT=+t.value;uipSave();};
if(typeof HELP14!=='undefined')HELP14.push('<h4>部隊對話</h4><ul>'+
  '<li>本方部隊依當下的處境在兵牌右上方冒出簡短的對話：遭射擊、砲擊、空襲、直升機、無人機、轟炸、戰車、白刃戰、毒氣、核爆與落塵、被包圍、傷亡、士氣動搖、潰散與重整、恐懼、背水一戰、彈藥燃料不足、飢餓、收到命令與抵達、佔領、俘虜、誤擊、指揮部被毀、增援抵達、伏擊、防禦、行軍、渡河、撤退、進攻、閒置等。緊急的用紅框。</li>'+
  '<li>每種處境有多種說法，依年代（火繩槍、燧發槍、一戰、二戰、冷戰、現代）、兵種（步兵、裝甲、砲兵、騎兵、工兵、醫護、指揮部、後勤、飛行員、艦艇）、晝夜與天候、士氣挑選，同一句話短時間內不重複。沒有新狀況時，畫面上的部隊偶爾閒聊；點選本方部隊時它會回一句。</li>'+
  '<li>對話只在畫面上，不會改變戰局；部隊面板列出最近聽到的幾句。可以在設定的「畫面 → 部隊對話」關閉、只留緊急的、調整閒聊的多寡、同時顯示的句數與停留時間。正式的狀況回報仍經由無線電或傳令送到司令部（收件匣的「報告」）。</li></ul>');
