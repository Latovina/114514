/* ===================== 戰爭罪證據（介面）：地圖標記、點選後的說明與處置、新的違法命令、設定、說明、對話 ===================== */
setSec('combat','evid',{t:'戰爭罪證據',o:24,h:function(){return setOpt(setRow('留下證據',setChk('setb','evid',G.set.evid!==false,'屠殺、處決、焚燒與下毒會在地圖上留下遺體、亂葬坑、焦土與被下毒的水源；被發現就會曝光，看到的官兵會恐懼、憤怒或羞愧；附近友軍潰散、被殲滅或敵軍投降也會影響士氣')))+
  '<div class="lw-note">關閉後不再產生新的證據，也不再有附近戰況的士氣反應。</div>';}});
/* ---------- 新的違法命令 ---------- */
(function(){var b=civActHtml;civActHtml=function(T,t,acts){var add=t==='S'?['exec','burn','poisonw','poisonf']:['exec'];return b(T,t,acts.concat(add.filter(function(a){return acts.indexOf(a)<0;})));};})();
(function(){var b=civWarn;civWarn=function(a,T,t,u){if(a!=='burn'&&a!=='poisonw'&&a!=='poisonf'&&a!=='exec')return b(a,T,t,u);var n=t==='S'?civPresent(T):T.n,who=t==='S'?T.n+'的成年男性居民':t==='R'?'這支難民隊伍':'這些被拘留的平民';
  var m=a==='burn'?'焚燒'+T.n+'會燒毀房屋、存糧與田地，約 '+fmt(n)+' 名居民失去棲身之所、被迫逃離，有人會葬身火海。':a==='poisonw'?'在'+T.n+'的水源下毒，居民會一天天中毒死亡；任何在這裡取水、駐紮的部隊，包括我軍自己，都可能中毒。使用毒物違反戰爭法。':
    a==='poisonf'?'在'+T.n+'的存糧下毒，吃下的人會中毒；來這裡徵糧、駐紮的部隊也一樣。使用毒物違反戰爭法。':'處決'+who+'（約 '+fmt(t==='S'?(T.men||0)*0.3:n*0.9)+' 人）是最嚴重的戰爭罪行之一。執行的官兵也會因此受創。';
  return m+'\n\n後果：現場會留下證據（遺體、亂葬坑、焦土、被下毒的水源與存糧），被敵軍、記者或援助團體發現就會曝光；居民與周邊地區轉為敵視、支持游擊隊；部隊士氣與軍紀下降；戰後總結列出下令者與執行部隊。守法的部隊可能拒絕執行。\n\n確定要命令「'+uName(u)+'」執行嗎？';};})();
/* ---------- 地圖：看得到的證據 ---------- */
function evdVis(e){var me=UI.side;return me<0||seeAll()||!!(e.found&&e.found[me]!==undefined);}
function evdIcon(c,e,x,y,z,sel){c.save();c.lineWidth=1;
  if(e.k==='burnt'){var g=G.civ&&G.civ.S[e.g],r=g?Math.max(z*1.6,(g.r||300)/mpp()):z*2,age=G.t-e.t;c.globalAlpha=0.35;c.fillStyle='#212121';c.beginPath();for(var i=0;i<10;i++){var a=i/10*2*PI,rr=r*(0.75+0.25*((hstr(e.id+'|'+i)%100)/100));c[i?'lineTo':'moveTo'](x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();c.fill();
    if(age<12*3600){c.globalAlpha=0.28*(1-age/(12*3600));c.fillStyle='#616161';for(var j=0;j<4;j++){var k=(performance.now()/1000*0.2+j*0.25)%1;c.beginPath();c.arc(x+(j-1.5)*z*0.5+k*z,y-k*r*1.2,z*(0.5+k),0,2*PI);c.fill();}}
    c.globalAlpha=1;c.fillStyle='#37474F';c.strokeStyle='#ECEFF1';c.beginPath();c.moveTo(x,y-z*0.8);c.lineTo(x+z*0.6,y+z*0.5);c.lineTo(x-z*0.6,y+z*0.5);c.closePath();c.fill();c.stroke();}
  else if(e.k==='bodies'){var s=z*(e.n>=20?1:0.8);c.fillStyle='#7F0000';c.strokeStyle='#FFEBEE';c.beginPath();c.moveTo(x,y-s);c.lineTo(x+s,y);c.lineTo(x,y+s);c.lineTo(x-s,y);c.closePath();c.fill();c.stroke();}
  else if(e.k==='grave'){c.fillStyle=e.cov?'#4E342E':'#6D4C41';c.strokeStyle='#D7CCC8';c.fillRect(x-z,y-z*0.55,z*2,z*1.1);c.strokeRect(x-z,y-z*0.55,z*2,z*1.1);c.strokeStyle='rgba(255,255,255,.5)';c.beginPath();for(var q=-0.6;q<=0.61;q+=0.4){c.moveTo(x+q*z-z*0.2,y+z*0.45);c.lineTo(x+q*z+z*0.2,y-z*0.45);}c.stroke();}
  else{c.fillStyle=e.k==='well'?'#1565C0':'#8D6E63';c.strokeStyle='#fff';c.beginPath();c.arc(x,y,z*0.75,0,2*PI);c.fill();c.stroke();c.strokeStyle=e.fix?'#A5D6A7':'#FF1744';c.lineWidth=1.6;c.beginPath();c.moveTo(x-z*0.4,y-z*0.4);c.lineTo(x+z*0.4,y+z*0.4);c.moveTo(x+z*0.4,y-z*0.4);c.lineTo(x-z*0.4,y+z*0.4);c.stroke();}
  if(sel){c.strokeStyle='#FFC107';c.lineWidth=2;c.beginPath();c.arc(x,y,z*1.5,0,2*PI);c.stroke();}c.restore();}
function evdDraw(c){VW.evm=[];if(!G||!G.started||!G.evd||!G.evd.length||UI.lay.evd===0)return;var S=VW.s,z=clamp(4.5+S*1.1,5,10),sel=UI.selX&&UI.selX.k==='evd'?UI.selX.id:0;
  G.evd.forEach(function(e){if(!evdVis(e))return;var p=w2s(e.x,e.y);if(p[0]<-60||p[1]<-60||p[0]>VW.cw+60||p[1]>VW.ch+60)return;VW.evm.push({id:e.id,sx:p[0],sy:p[1]});evdIcon(c,e,p[0],p[1],z,e.id===sel);
    if(S>=2.5){c.save();c.font='10px sans-serif';c.textAlign='center';c.textBaseline='top';c.lineWidth=3;c.strokeStyle='rgba(255,255,255,.85)';c.fillStyle='#4E0000';var t=EVDK[e.k][0]+(e.k==='bodies'&&e.n>=1?' 約 '+fmt(e.n):'');c.strokeText(t,p[0],p[1]+z+2);c.fillText(t,p[0],p[1]+z+2);c.restore();}});}
(function(){var b=drawUnder;drawUnder=function(c){b.apply(this,arguments);try{evdDraw(c);}catch(e){}};})();
function evdHit(sx,sy){var best=null,bd=10;(VW.evm||[]).forEach(function(q){var d=dist(sx,sy,q.sx,q.sy);if(d<bd){bd=d;best=q;}});return best;}
(function(){var b=btClick;btClick=function(x,y,sx,sy,e){if((UI.tool==='sel'||!UI.tool)&&G&&G.started){var q=evdHit(sx,sy);if(q){var me=mySide(),us=UI.sel.map(uById).filter(function(u){return u&&alive(u)&&(me===null||u.side===me);});if(us.length)UI.selPrev=us.map(function(u){return u.id;});
    UI.selX={k:'evd',id:q.id};UI.sel=[];UI.selC=0;UI.selB=0;btSel();btLeft(true);vDraw(false);return;}}return b.apply(this,arguments);};})();
(function(){var b=v8Get;v8Get=function(X){if(X&&X.k==='evd'){var e=G&&evdById(X.id);return e&&evdVis(e)?e:null;}return b(X);};})();
(function(){var b=v8Panel;v8Panel=function(X){if(X&&X.k==='evd'){var e=v8Get(X);return e?evdPanel(e):null;}return b(X);};})();
(function(){var b=cellTip;cellTip=function(x,y){if(G&&G.started&&VW.cw){var p=w2s(x,y),q=evdHit(p[0],p[1]);if(q){var e=evdById(q.id);if(e)return EVDK[e.k][0]+'：'+evdTxt(e)+'\n點選可查看詳情與處置';}}return b(x,y);};})();
/* ---------- 說明與處置 ---------- */
function evdWho(e){var me=mySide();if(e.side<0)return '不明';if(me!==null&&e.side===me)return '本軍（'+esc(e.byn||'')+'）';if(me===null||e.doc&&e.doc[me])return esc(G.sides[e.side].name)+(e.byn?'（'+esc(e.byn)+'）':'');return '不明（調查取證後才能確認）';}
function evdState(e){var d=G.t-(e.t1||e.t);if(e.k==='bodies')return '曝屍 '+durTxt(d);if(e.k==='grave')return (e.cov?'遭刻意掩埋、湮滅':e.burBy==='civ'?'居民草草掩埋':'掩埋')+(e.ex?'；已開挖':'');if(e.k==='burnt')return '焚毀於 '+durTxt(G.t-e.t)+'前';
  var g=G.civ&&G.civ.S[e.g],on=g&&(e.k==='well'?g.wpois&&G.t<g.wpois:g.fpois&&G.t<g.fpois);return e.fix?'已清理':on?'仍然有毒'+(g.pdead>=1?'；居民已有約 '+fmt(g.pdead)+' 人中毒死亡':''):'毒性已退';}
function evdActors(e){var me=mySide();var L=[];G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||ST(u).dom!=='land'||u.irr||(me!==null&&u.side!==me))return;var d=dist(u.x,u.y,e.x,e.y);if(d<20000)L.push([d,u]);});L.sort(function(a,b){return a[0]-b[0];});
  var P=(UI.selPrev||[]).map(uById).filter(function(u){return u&&isLeaf(u)&&onMap(u)&&(me===null||u.side===me);});return P.length?P.slice(0,12):L.slice(0,10).map(function(q){return q[1];});}
function evdPanel(e){var me=mySide(),own=me!==null&&e.side===me,o=v8H((e.k==='bodies'?'🕯 ':e.k==='grave'?'⚱ ':e.k==='burnt'?'🔥 ':'☣ ')+EVDK[e.k][0])+'<div class="lw-note">'+esc(EVDK[e.k][1])+'</div><div class="lw-kv">'+
   kv('地點',esc(placeTxt(e.x,e.y)))+(e.n>=1&&(e.k!=='grave'||e.ex||own||me===null)?kv('死者','約 '+fmt(e.n)+' 名'+(EVDV[e.vk]||'')):e.k==='grave'?kv('死者','不明（開挖之後才知道）'):'')+kv('犯行者',evdWho(e))+kv('狀態',esc(evdState(e)))+
   kv('發現',me===null?Object.keys(e.found||{}).map(function(s){return esc(G.sides[s]?G.sides[s].name:'')+' '+tTxt(e.found[s]).slice(-11);}).join('、'):e.found&&e.found[me]!==undefined?tTxt(e.found[me]).slice(-11):'—')+kv('記錄',e.doc&&(me===null?Object.keys(e.doc).length:e.doc[me])?'已調查取證':'尚未調查')+'</div>';
  if(e.txt&&(own||me===null||e.doc&&e.doc[me]))o+='<div class="lw-note" style="border-left:3px solid #7F0000;padding-left:6px;margin-top:4px">'+esc(e.txt)+'</div>';
  var acts=[];if(own)acts.push('cov');else{acts.push('inv');if(e.k==='grave'&&!e.ex)acts.push('dig');if((e.k==='well'||e.k==='food')&&!e.fix)acts.push('fix');}if(own&&(e.k==='well'||e.k==='food')&&!e.fix)acts.push('fix');
  if(!G.started||!acts.length)return o;var A=evdActors(e);if(!A.length)return o+'<div class="lw-note" style="margin-top:8px">附近 20 公里內沒有可以派去的本方地面部隊。</div>';var cur=A.filter(function(u){return u.id===UI.v8u;})[0]||A[0];UI.v8u=cur.id;
  o+='<h4 style="margin:10px 0 4px;font-size:13px">處置</h4><div class="lw-opt"><span>執行單位</span><select data-c="v8u">'+A.map(function(u){return '<option value="'+u.id+'"'+(u===cur?' selected':'')+'>'+esc(uName(u))+'（'+kmTxt(dist(u.x,u.y,e.x,e.y))+'）</option>';}).join('')+'</select></div><div class="lw-ob">'+
   acts.map(function(a){return '<button type="button" data-a="evdo" data-v="'+a+'"'+(a==='cov'?' class="dng"':'')+'>'+(a==='cov'?'⚠ ':'')+EVDA[a][0]+'</button>';}).join('')+'</div><div class="lw-note">'+
   acts.map(function(a){return '<b>'+EVDA[a][0]+'</b>：'+({inv:'派部隊到現場拍照、清點、蒐集證詞與彈殼，確認是誰做的（約 3 小時，記入戰後總結）',dig:'開挖亂葬坑、清點死者（約 6 小時，工兵較快）；挖掘的官兵會受到衝擊',cov:'掩埋遺體、清理現場，讓證據難以被發現；湮滅證據本身也是罪行，會被記錄',fix:'工兵清理被下毒的水源與存糧（約 8 小時）'})[a];}).join('<br>')+'</div>';return o;}
ACT.evdo=function(b){var a=b.getAttribute('data-v'),X=UI.selX,e=X&&X.k==='evd'?v8Get(X):null;if(!e||!G.started){toast('現場已經看不到了。');return;}var A=evdActors(e),u=A.filter(function(q){return q.id===UI.v8u;})[0]||A[0];if(!u){toast('附近沒有可以派去的部隊。');return;}
  if(a==='fix'&&!isEng(u)){toast('清理水源要派工兵部隊。');return;}if(a==='cov'&&typeof confirm==='function'&&!confirm('掩埋遺體、湮滅證據是罪行，會被記錄；之後仍可能被開挖查出。\n\n確定要命令「'+uName(u)+'」執行嗎？'))return;
  var r=issue(u,'evd',{x:e.x,y:e.y,opt:{id:e.id,act:a}});toast('已命令'+uName(u)+'：'+EVDA[a][0]+(r&&r.sec>0?'（約 '+durTxt(r.sec)+' 後送達）':''));vDraw(false);btLeft(true);};
if(typeof HELP14!=='undefined')HELP14.push('<h4>戰爭罪的決策與證據</h4><ul>'+
  '<li>點選聚落、難民或被拘留的平民，除了原本的行動，還可以下達<b>處決</b>、<b>焚燒村莊</b>、<b>水源投毒</b>、<b>存糧投毒</b>等違法命令（會先跳出警告）。守法、軍紀好的部隊可能拒絕執行；執行後記為戰爭罪行，執行的官兵士氣與軍紀下降。</li>'+
  '<li>屠殺、處決（平民、人質、難民、投降的官兵，或督戰隊槍決的自己人）、焚燒與下毒會在地圖上留下證據：<b>遺體</b>（暗紅菱形）、<b>亂葬坑</b>（褐色長方形）、<b>焦土</b>（燒黑的區域，起初還冒煙）、<b>被下毒的水源與存糧</b>（打叉的圓點）。遺體兩天後多半被居民草草掩埋成亂葬坑。</li>'+
  '<li>被下毒的水源與存糧讓居民一天天中毒死亡、逃離；在那裡駐紮、取水取糧的部隊不分敵我都會中毒，直到發現或工兵清理。</li>'+
  '<li>部隊經過時才會發現證據：遺體與焦土容易看到，亂葬坑要靠近，下毒要等居民死傷傳開，或偵察、醫護、工兵與指揮部隊才查得出來。發現後在地圖上標出，戰報記錄，罪行曝光、聲譽下降，記者會報導。</li>'+
  '<li>看到現場的官兵：死者是投降的自己人，恐懼並憤怒（或沮喪），而且之後更不願投降；死者是平民，恐懼與沮喪（若是自己的同胞則憤怒）；是本軍幹的，羞愧——極端政策下則麻木、軍紀更壞。</li>'+
  '<li>點選證據可以派部隊<b>調查取證</b>（確認犯行者）、<b>開挖亂葬坑</b>、<b>清理水源</b>；犯行的一方可以<b>掩埋、湮滅證據</b>，讓它更難被發現，但湮滅本身也會被記錄。</li>'+
  '<li>附近的友軍潰散、投降或被殲滅，官兵士氣下降、恐懼上升；附近的敵軍潰逃、投降或被殲滅，士氣上升。部隊會對這些場面說話。</li></ul>');
/* ---------- 對話：暴行現場與附近戰況 ---------- */
Object.assign(VOXN,{ev_body:['發現遺體','經過屠殺或處決的現場'],ev_grave:['發現亂葬坑','發現草草掩埋死者的坑'],ev_burn:['焦土','看到被燒毀的村莊'],ev_poison:['發現下毒','水源或存糧被下毒'],ev_pow:['被處決的自己人','發現投降後遭處決的我軍官兵'],ev_own:['本軍暴行','看到本軍造成的暴行現場'],
 rx_rout:['友軍潰散','附近的友軍潰散'],rx_fall:['友軍被殲滅','附近的友軍被殲滅'],rx_fsurr:['友軍投降','附近的友軍投降'],rx_ewin:['敵軍潰敗','附近的敵軍潰逃或被殲滅'],rx_esurr:['敵軍投降','附近的敵軍投降']});
VOXCAT.push(['暴行現場',['ev_body','ev_grave','ev_burn','ev_poison','ev_pow','ev_own']],['附近戰況',['rx_rout','rx_fall','rx_fsurr','rx_ewin','rx_esurr']]);
Object.assign(VOXD,{ev_body:['那邊……是屍體','都是平民……','有孩子……','他們是被槍斃的','手被綁著……','別看，走吧','誰會幹這種事……','[!]我想吐','[~]記下位置，回報上去','[r]雨水把血沖開了','[n]黑暗裡踩到了什麼……'],
 ev_grave:['這裡的土是新翻的','下面埋著人','一個坑，好多人','聞到了嗎？','有人在找自己的家人','[~]記下來，以後要開挖'],
 ev_burn:['整個村子都燒光了','房子只剩焦黑的牆','糧倉也燒了','人呢？都跑了嗎？','煙還沒散','[!]這是要逼死人'],
 ev_poison:['水井被下毒了！','別喝這裡的水','村民說喝了水就倒下','糧食裡有毒','這裡的東西一口都別碰','[@med]得驗一驗這些水'],
 ev_pow:['是我們的人……','他們投降了還被槍斃','手還舉著……','這筆帳一定要算','認得他，是三連的','[!]投降也是死','[~]把名牌收好，帶回去'],
 ev_own:['這是我們的人幹的？','上面下的命令……','別說出去','我沒辦法再看了','督戰隊槍斃的，全是自己人','[!]我們跟他們有什麼不同？'],
 rx_rout:['旁邊的部隊在跑！','他們撐不住了！','左翼垮了！','別跟著跑！','穩住，別亂！','[!]我們也撤吧……'],
 rx_fall:['他們全沒了……','那個連被打光了','旁邊沒人了','剛才還在通話……','[~]把位置補起來'],
 rx_fsurr:['他們投降了……','友軍舉白旗了','我們不能投降','[!]要不要也……'],
 rx_ewin:['他們在逃！','打垮了！','敵人跑了','追上去！','[~]別追太遠'],
 rx_esurr:['他們投降了！','白旗！','總算有人投降','收容俘虜','[~]別開槍了']});
Object.assign(VOXP.rough,{ev_body:['老天……這是人幹的？','狗*的，連小孩都殺','畜生……','手還被綁著，王*蛋','別看了，看了睡不著','[!]我要吐了'],ev_grave:['土是新的，下面有人','*的，一整坑','這味道……','誰幹的，總有一天要算帳'],
 ev_burn:['燒得一乾二淨，畜生','整個村子沒了','連牛都燒死了','這些人以後住哪？'],ev_poison:['水裡有毒！他*的','別喝！誰都別喝！','連吃的都下毒，夠狠','這招真不是人幹的'],
 ev_pow:['那是我們的弟兄！','舉手投降還被殺，狗*的','這筆血債要他們還','老子跟他們沒完','[!]投降也是死，那就拚了'],ev_own:['這是我們幹的？靠……','上面的人瘋了','別說出去，誰都別說','*的，我們跟他們一樣爛'],
 rx_rout:['旁邊的跑了！靠杯','他們嚇破膽了！','別學他們！','守住，*的！'],rx_fall:['旁邊那連整個沒了','*的，全掛了','現在只剩我們了','又少了一批兄弟'],
 rx_fsurr:['他們舉手了……','友軍投降了，靠','老子才不投降','[!]我們也……'],rx_ewin:['他們跑了！哈！','打爆了！','追！別讓他們跑！','爽，打垮了'],rx_esurr:['他們投降了！','白旗！總算','叫他們把槍丟了','乖乖舉手']});
Object.assign(VOXP.pro,{ev_body:['發現平民遺體，記錄位置','疑似處決現場','拍照存證，回報上級','標示現場，勿破壞證據','清點遺體數量'],ev_grave:['發現疑似亂葬坑','標示位置，待調查開挖','封鎖現場','回報：可能的集體墓穴'],
 ev_burn:['村莊遭焚毀','回報：焦土作戰跡象','記錄損害範圍','協助居民疏散'],ev_poison:['水源疑遭下毒，禁止取用','糧食疑遭下毒，封存','通報醫療單位檢驗','警告各單位：勿取用'],
 ev_pow:['發現我軍被俘人員遺體','疑遭處決，記錄事證','收回識別牌','回報上級，請求調查'],ev_own:['回報：本軍違紀事件','依規定通報憲兵','記錄並移送調查','停止違法行為'],
 rx_rout:['友鄰部隊潰退！','注意側翼暴露','穩住陣線！','填補缺口！'],rx_fall:['友鄰部隊遭殲滅','側翼失去掩護','回報：友軍損失','調整防線'],rx_fsurr:['友鄰部隊投降','側翼暴露，提高警戒','回報上級','堅守陣地'],
 rx_ewin:['敵軍潰退','請求指示：是否追擊','鞏固戰果','回報戰果'],rx_esurr:['敵軍投降','解除武裝，收容俘虜','依規定處置俘虜','回報俘虜人數']});
VOX.P=null;VOX.PS=null;
(function(){var b=voxDetect;voxDetect=function(u,P,N,s){var r=b(u,P,N,s);N.evC=u.evC||0;N.rxC=u.rxC||0;if(r||P.evC===undefined)return r;
  if(N.evC>P.evC){var k=u.evK;return [k==='pow'?'ev_pow':k==='own'||k==='own2'?'ev_own':k==='grave'?'ev_grave':k==='burn'?'ev_burn':k==='poison'?'ev_poison':'ev_body',k==='pow'?1:2];}
  if(N.rxC>P.rxC&&u.rxK)return ['rx_'+u.rxK,u.rxK==='rout'||u.rxK==='fall'?2:3];return null;};})();
