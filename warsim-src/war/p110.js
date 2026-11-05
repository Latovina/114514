/* ===================== 疲憊值（介面）：設定、部隊面板的疲憊條與原因、對話、說明 ===================== */
setSec('combat','exh',{t:'疲憊',o:23,h:function(){return setOpt(setRow('長期疲憊',setChk('setb','exh',G.set.exh!==false,'缺乏睡眠、連日強行軍與長期在火線上會累積疲憊：射擊、行進、警戒變差，士氣回復上限降低，更容易恐懼，強行軍會有人落伍，精疲力竭還在交火會出現戰鬥疲勞的傷患')))+
  '<div class="lw-note">當下的疲勞停下來就會回復；長期的疲憊要遠離敵人、下令休息，或撤到後方整補才會慢慢消退。</div>';}});
/* 部隊面板：疲勞下面加一條疲憊，列出原因與效果 */
(function(){var b=btStatus;btStatus=function(){b.apply(this,arguments);try{if(!G||!G.started||G.set.exh===false||UI.selX||UI.selC||UI.selB||!UI.sel||UI.sel.length!==1)return;var u=uById(UI.sel[0]),el=btEl('bst');if(!u||!el)return;if(UI.side>=0&&u.side!==UI.side&&!seeAll())return;
  var L=isLeaf(u)?[u]:leavesOf(u).filter(function(q){return alive(q)&&ST(q).dom==='land';});if(!L.length||(isLeaf(u)&&ST(u).dom!=='land'))return;var bars=el.querySelector('.lw-bars');if(!bars)return;
  var e=sum(L,function(q){return q.exh||0;})/L.length,lv=exhLv(e),tmp=document.createElement('div');tmp.innerHTML=bar('疲憊',e,lv>=3?'r':lv>=2?'y':'',fmt(e)+'・'+EXHN[lv]);
  var lbl=[].slice.call(bars.children).filter(function(c){return c.tagName==='SPAN'&&c.textContent==='疲勞';})[0],ref=lbl&&lbl.nextSibling&&lbl.nextSibling.nextSibling?lbl.nextSibling.nextSibling.nextSibling:null;while(tmp.firstChild)bars.insertBefore(tmp.firstChild,ref);
  var why=isLeaf(u)?exhWhy(u):'',eff=[],f=sum(L,function(x){return exhFire(x);})/L.length,m=sum(L,function(x){return exhMove(x);})/L.length,sp=sum(L,function(x){return exhSpot(x);})/L.length,mc=sum(L,function(x){return exhMorCap(x);})/L.length,ps=sum(L,function(x){return x.exhN||0;});
  if(f<0.99)eff.push('射擊 '+sg((f-1)*100,0)+'%');if(m<0.99)eff.push('行進 '+sg((m-1)*100,0)+'%');if(sp<0.99)eff.push('警戒與偵察 '+sg((sp-1)*100,0)+'%');if(mc>=1)eff.push('士氣回復上限 −'+fmt(mc));if(e>40)eff.push('更容易恐懼');
  var t='';if(why)t+='原因：'+esc(why);if(eff.length)t+=(t?'；':'')+'影響：'+eff.join('、');if(ps>=1)t+=(t?'；':'')+'已有約 '+fmt(ps)+' 人因戰鬥疲勞後送';if(lv>=2)t+=(t?'。':'')+'遠離敵人下令休息，或撤到後方整補才會消退';
  if(t)el.insertAdjacentHTML('beforeend','<div class="lw-note lw-exhu" style="border-left:3px solid #6D4C41;padding-left:6px;margin-top:4px">'+t+'</div>');}catch(err){}};})();
/* ---------- 對話 ---------- */
VOXD.exh1=['眼皮重得睜不開','腿已經不是自己的了','能不能停下來喘口氣','我站著都能睡著','背包越來越重了','他剛才走著走著就睡著了','不知道幾天沒好好睡了','腦袋嗡嗡的','手在抖，不是怕，是累',
  '別坐下，坐下就起不來了','誰還醒著？','講話都講不清楚了','剛才的口令是什麼來著？','[^1900]肩膀被槍帶磨出血了','[_1900]火繩都拿不穩了','[n]天又黑了，還是沒得睡','[n]哨兵又在打瞌睡','[h]熱得頭暈，眼前一陣黑',
  '[c]冷得睡不著，累得醒不來','[r]泥巴把靴子吸住，每一步都要用力拔','[@arm]駕駛剛才差點睡著','[@arm]盯著潛望鏡眼前都冒金星','[@art]手臂抬不起來，砲彈一顆比一顆重','[@cav]人跟馬都累垮了','[@eng]鏟子都舉不起來了',
  '[@med]擔架抬到手都麻了','[!]我撐不下去了','[!]再這樣下去我會倒在這裡','[~]撐著點，快換防了','[~]再忍一下，天亮就有人來換'];
VOXD.exh2=['弟兄們都撐到極限了','這樣下去要出事的','好幾天沒闔眼了','長官，大家都快倒了','有人站著就睡著了','再打下去，不用敵人動手我們就垮了','剛才有人連口令都忘了','槍口一直往下垂',
  '請求換防，弟兄們真的不行了','看東西都有疊影了','吃東西都沒力氣嚼','有人在發高燒，還是得撐著','[@arm]車組已經兩天沒下車了','[@art]砲班一個個坐著就睡著了','[@hq]參謀念著念著就趴在地圖上睡著',
  '[!]我的手不聽使喚了','[n]他醒著，可是在說夢話','[~]輪班睡，一次兩個人，誰都別硬撐'];
VOXD.exh3=['他一直盯著地上，叫他也沒反應','有人開始哭，停不下來','他說他聽見家裡的狗在叫……','我們撐不住了，真的撐不住了','他把槍放下，就坐在那裡不動','醫護兵說這不是受傷，是人撐到頭了',
  '剛才他對著空的地方開槍','他抖個不停，連水壺都拿不住','[^1914 _1919]又一個彈震症','[^1939 _1953]醫官說是戰鬥疲勞症','[^1960]醫官說是急性壓力反應','[_1913]有人整夜喃喃自語，眼神都散了','[!]讓我離開這裡'];
VOXD.fmarch=['今天已經走了{km}公里','這是強行軍，咬牙跟上','隊伍拉得好長','別停，停了就跟不上了','鞋底磨穿了也得走','一天{km}公里，誰受得了','前面的人在跑，後面的人在爬','水壺早就空了',
  '[^1900]腳底的水泡破了又起','[_1900]長矛都快扛不動了','[@cav]馬口吐白沫，再跑就要倒','[@cav]下馬牽著走吧，馬撐不住了','[@arm]引擎過熱，履帶也該檢查了','[@arm]駕駛換了三輪還是累','[@art]拖著砲走，馬都在喘',
  '[h]這種天氣強行軍會熱死人','[c]腳趾凍得沒感覺還得走','[r]泥濘裡強行軍，一步陷一步','[n]摸黑趕路，前面的人都看不見'];
VOXD.strag=['後面有人跟不上了','又有人倒在路邊','隊伍後面一直在掉人','他說歇一下就追上來……','收容隊在後面撿人','掉隊的人要是碰上敵人就完了','點名少了好幾個','有人坐在路邊怎麼叫都不起來',
  '[@cav]有幾匹馬跛了，只好用走的','[@arm]有車拋錨了，只能留在路邊','[h]有人中暑倒下了','[c]有人凍得走不動了'];
VOXD.nosleep=['不記得上次睡覺是什麼時候了','閉上眼就聽見砲聲','就讓我睡五分鐘','剛剛那是幻覺吧？','眼睛乾得像砂紙','有人在發提神的藥','站哨睡著要軍法處置，撐著','腦子像塞滿了棉花','說話說到一半就忘了要說什麼',
  '[^1900]咖啡早就沒了','[_1900]再這樣熬下去，人都要瘋了','[n]這一夜又沒得睡','[n]黑暗裡一直覺得有東西在動'];
VOXD.rested=['總算睡了一整晚','熱的東西下肚，活過來了','洗了把臉，像換了個人','能睡覺真好','腳上的水泡總算消了一點','換了乾襪子，舒服多了','睡醒才發現自己有多累','[~]現在可以再上去了','[!]休息完還是得回去……','[^1900]總算寫了封信回家'];
/* 疲憊等級升高、開始強行軍、有人落伍、休整回來時說一句；很累的時候閒聊也多半在講累 */
(function(){var b=voxDetect;voxDetect=function(u,P,N,s){var r=b(u,P,N,s);if(G.set.exh===false||u.exh===undefined)return r;N.xl=exhLv(u.exh);N.fm=u.mkm>exhCap(s||ST(u))*1.3&&!!N.mv;N.sg=u.strg>=0.08?1:0;if(r||P.xl===undefined)return r;
  if(N.xl>=4&&P.xl<4)return ['exh3',1];if(N.xl>=3&&P.xl<3)return ['exh2',2];if(N.sg&&!P.sg)return ['strag',2];if(N.fm&&!P.fm)return ['fmarch',2,{km:fx(u.mkm,0)}];if(N.xl<=1&&P.xl>=3)return ['rested',3];return null;};})();
(function(){var b=voxAmb;voxAmb=function(u,N){var r=b(u,N);if(G.set.exh===false||!(u.exh>=20)||N.uf||N.fd||!r||r[1]<3)return r;var h=hstr(u.id+'|x|'+VOX.c)%100,lv=exhLv(u.exh);
  if(N.mv&&N.fm&&h<45)return ['fmarch',3,{km:fx(u.mkm,0)}];if(u.slp>24&&h<35+lv*8)return ['nosleep',3];if(h<20+lv*15)return [lv>=4?'exh3':lv>=3?'exh2':'exh1',3];return r;};})();
if(typeof HELP14!=='undefined')HELP14.push('<h4>疲憊值</h4><ul>'+
  '<li><b>疲勞</b>是當下的體力：行軍、交火、夜戰時累加，停下來就回復。<b>疲憊</b>是連日累積的：缺乏睡眠、強行軍與長期在火線上一天天加重，只有遠離敵人、下令休息，或撤到後方整補才會慢慢消退。</li>'+
  '<li>強行軍：一天內徒步超過約 30 公里、騎乘或畜力超過 50 公里、車輛超過 200 公里，疲憊加得快，徒步部隊還會有人落伍（停下來休息後陸續歸隊）。</li>'+
  '<li>缺乏睡眠：交火、行軍、構工時沒得睡；敵人就在附近時只能輪班淺眠。缺的睡眠超過一天半，疲憊會加速累積；夜裡缺乏睡眠的哨兵容易打瞌睡。</li>'+
  '<li>影響：疲憊越高，射擊、行進、警戒與偵察越差，士氣回復的上限越低、越容易恐懼；精疲力竭（65 以上）還在交火，會開始有人因戰鬥疲勞後送。部隊面板列出原因與影響。</li>'+
  '<li>AI 會讓遠離敵人又累壞的部隊就地休息，精疲力竭的前線部隊也會換下來輪休；接替的部隊不能也是累壞的。設定的「疲憊」可以關閉這套機制。</li></ul>');
