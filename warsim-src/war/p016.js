/* ===================== 設定與說明 ===================== */
/* ---------- 設定登錄表：每個選項只在一個地方登錄，設定頁、聯機房間的模擬設定與作戰頁的快速設定都由這裡產生 ----------
   setSec(分組, 代號, {t:小標題, h:產生內容（傳回 HTML；空字串表示目前不顯示）, note:說明, cls:相容用的類別, local:只影響自己的畫面（預設依分組）, room:false 房間頁不列出（房間設定已有）, wide:佔滿整列, o:組內順序})
   分組依 SETG 的順序：[代號, 名稱, 說明, 只影響自己的畫面] */
var SETG=[['rules','規則與勝負','遊戲模式、作戰時限、目標與開戰時間'],['cmd','指揮與電腦','命令延遲、電腦指揮官、盟軍協同與部隊的自主行動'],['intel','情報與迷霧','戰場迷霧、友軍迷霧、觀察哨與居民情報'],
  ['combat','戰鬥','殺傷效率、交戰規則、士氣與兵種行為、砲兵與友軍誤擊'],['logi','後勤','運輸、道路、油料、飲水、自動構工與休整'],['env','天氣與環境','天氣、水文、化學生物放射性'],['civ','平民與事件','平民、新聞、事件與天災'],
  ['pts','點數與增援','增援點數、科技點數與增援名單'],['wmd','核武','戰術核武與戰略核武'],['tf','第三方陣營','中立國軍隊、維和部隊、武裝團體、外國志願軍'],['zed','異變環境','喪屍與寄生蟲'],['era','年代','各機制出現的年份'],
  ['ap','自動暫停','發生下列情況時暫停，方便你下決定'],['rep','戰報與回放','戰報分級、回放紀錄與戰爭花費單價'],['gfx','畫面','圖形模式、畫面效果與版面（只影響自己的畫面）',1],['snd','聲音與音樂','音效、環境音與勝敗音樂（只影響自己）',1],['data','資料','存檔與離開',1]];
var SETR;
function setSec(g,k,o){SETR=(SETR||[]).filter(function(q){return q.k!==k;});o.g=g;o.k=k;if(o.o===undefined)o.o=50;o.n=SETR.length;SETR.push(o);return o;}
function setGrp(g){return SETG.filter(function(q){return q[0]===g;})[0]||[g,g,''];}
function setSecs(g){return (SETR||[]).filter(function(q){return q.g===g;}).sort(function(a,b){return a.o-b.o||a.n-b.n;});}
function setSecQ(k){return (SETR||[]).filter(function(q){return q.k===k;})[0]||null;}
function setLocal(q){return q.local!==undefined?!!q.local:!!setGrp(q.g)[3];}
function setSecHtml(q){if(!q)return '';var h='';try{h=q.h()||'';}catch(e){if(window.console)console.warn('設定 '+q.k,e);h='<div class="lw-note">這一項目前無法顯示。</div>';}if(!h)return '';var n=q.note?(typeof q.note==='function'?q.note():q.note):'';
  return '<section class="lw-sec'+(q.wide?' wide':'')+(q.cls?' '+q.cls:'')+'" data-s="'+q.k+'"'+(setLocal(q)?' data-local="1"':'')+(q.room===false?' data-dup="1"':'')+'>'+(q.t?'<h4>'+q.t+'</h4>':'')+h+(n?'<div class="lw-note">'+n+'</div>':'')+'</section>';}
function setGrpHtml(g){var g0=setGrp(g),b=setSecs(g).map(setSecHtml).join('');return b?'<div class="lw-card lw-setgrp" data-g="'+g+'"><h3>'+g0[1]+'<small>'+g0[2]+'</small></h3><div class="lw-secs">'+b+'</div></div>':'';}
/* 重畫一個區塊：設定頁與快速設定裡的每一份 */
function setSecRe(k){var q=setSecQ(k);if(!q)return;document.querySelectorAll('.lw-sec[data-s="'+k+'"]').forEach(function(el){var t=document.createElement('div');t.innerHTML=setSecHtml(q);if(t.firstChild)el.replaceWith(t.firstChild);else el.innerHTML='';});}
/* 常用的欄位：一列是「標籤＋控制項」 */
function setRow(lbl,ctl,tip){return '<span'+(tip?' title="'+esc(tip)+'"':'')+'>'+lbl+'</span>'+ctl;}
function setChk(c,f,on,txt,tip){return '<label'+(tip?' title="'+esc(tip)+'"':'')+'><input type="checkbox" data-c="'+c+'"'+(f?' data-f="'+f+'"':'')+(on?' checked':'')+'>'+txt+'</label>';}
function setSel(c,f,L,v,tip){return '<select data-c="'+c+'"'+(f?' data-f="'+f+'"':'')+(tip?' title="'+esc(tip)+'"':'')+'>'+L.map(function(q){return '<option value="'+q[0]+'"'+(String(q[0])===String(v)?' selected':'')+'>'+q[1]+'</option>';}).join('')+'</select>';}
function setOpt(s){return s?'<div class="lw-opt">'+s+'</div>':'';}
/* 設定頁：分組導覽、搜尋（標題、說明與選項文字都算），每組一張卡片 */
PAGES.set=function(host){var q=UI.setQ||'',gs=SETG.map(function(g){return [g,setGrpHtml(g[0])];}).filter(function(x){return x[1];});
  host.innerHTML='<div class="lw-main lw-setpg"><div class="lw-setbar"><input type="search" data-i="setq" placeholder="搜尋設定，例如：油料、核武、暫停" value="'+esc(q)+'" aria-label="搜尋設定"><nav class="lw-setnav">'+
    gs.map(function(x){return '<button type="button" class="lw-btn sm" data-a="setgo" data-v="'+x[0][0]+'">'+x[0][1]+'</button>';}).join('')+'</nav></div>'+
    '<div class="lw-grid lw-setgrid">'+gs.map(function(x){return x[1];}).join('')+'</div><div class="lw-note lw-setnone" hidden>沒有符合的設定。</div></div>';
  if(q)setFilter(host,q);};
function setFilter(host,q){q=(q||'').trim().toLowerCase();var any=false;if(!host)return;
  host.querySelectorAll('.lw-setgrp').forEach(function(c){var g=c.getAttribute('data-g'),L=c.querySelectorAll('.lw-sec'),M=Array.prototype.map.call(L,function(s){return !q||s.textContent.toLowerCase().indexOf(q)>=0;}),n=M.filter(Boolean).length;
    /* 選項本身沒有符合、但分組名稱或說明符合時，整組顯示 */if(!n&&c.querySelector('h3').textContent.toLowerCase().indexOf(q)>=0){M=M.map(function(){return true;});n=M.length;}
    Array.prototype.forEach.call(L,function(s,i){s.hidden=!M[i];});c.hidden=!n;var b=host.querySelector('[data-a="setgo"][data-v="'+g+'"]');if(b)b.hidden=!n;if(n)any=true;});
  var e=host.querySelector('.lw-setnone');if(e)e.hidden=any;}
INP.setq=function(t){UI.setQ=t.value;setFilter(t.closest('.lw-setpg'),t.value);};
ACT.setgo=function(b){var c=UI.body&&UI.body.querySelector('.lw-setgrp[data-g="'+b.getAttribute('data-v')+'"]');if(c)c.scrollIntoView({block:'start'});};
/* ---------- 基本的模擬設定 ---------- */
setSec('rules','time',{t:'作戰時限與結束',o:20,h:function(){var S=G.set;return setOpt(setRow('作戰時限','<span><input type="number" min="1" max="2200" value="'+S.dur+'" data-c="setv" data-f="dur" style="width:70px"> 小時 '+(typeof durpHtml==='function'?durpHtml():'')+'</span>')+
  setRow('長期作戰',setChk('setsus','',S.sustain!==false,' 補充兵、輕傷歸隊與車輛修復（脫離接觸一小時以上、在補給線內；速度見「後勤」的「補員」）'))+
  setRow('結束條件',setSel('sets','end',[['time','時限或一方崩潰'],['obj','另加：一方控制全部目標 '+durTxt(objHoldT())]],S.end==='obj'?'obj':'time')));}});
setSec('rules','start',{t:'開戰時間',o:40,h:function(){var S=G.set;if(G.started)return '';return setOpt(setRow('開戰時間','<span><input type="number" value="'+S.y+'" data-c="setv" data-f="y" style="width:70px"> 年 <input type="number" min="1" max="12" value="'+S.m+'" data-c="setv" data-f="m" style="width:48px"> 月 <input type="number" min="1" max="31" value="'+S.d+'" data-c="setv" data-f="d" style="width:48px"> 日 <input type="number" min="0" max="23" value="'+S.h+'" data-c="setv" data-f="h" style="width:48px"> 時</span>'));}});
setSec('cmd','cmd',{t:'命令與電腦指揮',o:10,h:function(){var S=G.set;return setOpt(setRow('命令延遲倍率',setSel('setv','delayMul',[[0,'無延遲（即時）'],[0.5,'0.5 倍'],[1,'1 倍（依時代）'],[1.5,'1.5 倍'],[2,'2 倍']],S.delayMul))+
  setRow('下級主動性（電腦）',setChk('setb','ini',S.ini,'電腦指揮的各級指揮官會自行反擊、派砲兵支援'))+setRow('下級主動性（玩家）',setChk('setb','iniP',S.iniP===true,'玩家部隊的指揮官也會自行反擊、士氣高昂時自行出擊（預設關閉：待命的部隊不會自己出手）'))+setRow('電腦指揮',setSel('setv','aiLvl',[[0,'被動（只防守）'],[1,'一般'],[2,'積極']],S.aiLvl)));}});
setSec('intel','fog',{t:'戰場迷霧',o:10,h:function(){return setOpt(setRow('戰場迷霧',setChk('setb','fog',G.set.fog,'只顯示偵察到的敵軍')));}});
setSec('combat','mor',{t:'士氣與兵種行為',o:20,h:function(){var S=G.set;return setOpt(setRow('動態士氣',setChk('setb','dynMor',S.dynMor!==false,'自行出擊、拒絕進攻、戰術後撤、恐慌傳染、投降、重新集結與歸建'))+
  setRow('兵種行為',setChk('setb','beh',S.beh!==false,'後勤、指揮、砲兵、防空、工兵避開前線；偵察避免決戰'))+setRow('兵種相克',setChk('setb','ctr',S.ctr!==false,'依兵種類別與地形調整火力與突擊效果（見「說明」的相克表）')));}});
setSec('combat','art',{t:'砲兵',o:40,h:function(){return setOpt(setRow('待命的砲兵',setChk('setb','autoArt',G.set.autoArt===true,'沒有指派支援對象時也自動支援上級（電腦指揮的砲兵一律自動支援）')));}});
setSec('env','wx',{t:'天氣',o:10,h:function(){var S=G.set;return setOpt(setRow('天氣',setSel('sets','wxMode',[['auto','依氣候自動變化'],['fixed','固定']],S.wxMode==='fixed'?'fixed':'auto'))+(S.wxMode==='fixed'?setRow('固定天氣',setSel('setwx','',WX,S.wx)):''));}});
setSec('wmd','nuke',{t:'戰術核武',o:10,h:function(){var S=G.set,NK=S.nuke||(S.nuke={on:false,n:2,y:10,ai:false});return setOpt(setRow('戰術核武',setChk('setnk','on',NK.on,'允許使用（'+(typeof featY==='function'?featY('nuke'):1945)+' 年後的轟炸機，之後是重砲與飛彈）'))+
  (NK.on?setRow('每方彈頭','<span><input type="number" min="0" max="50" value="'+NK.n+'" data-c="setnk" data-f="n" style="width:60px"> 枚'+(G.started?'（剩餘：'+G.sides.map(function(Sd,i){return esc(Sd.name)+' '+nukeLeft(i);}).join('、')+'）':'')+'</span>')+
    setRow('預設當量','<span><input type="number" min="0.01" max="500" step="any" value="'+NK.y+'" data-c="setnk" data-f="y" style="width:70px"> 千噸</span>')+setRow('電腦使用',setChk('setnk','ai',NK.ai,'戰況惡化時電腦可能動用')):''));}});
setSec('wmd','snuke',{t:'戰略核武',o:20,h:function(){return setOpt(snkSetHtml());}});
setSec('rep','tiers',{t:'戰報分級門檻',o:10,note:'依雙方累計投入人數分級；低於「衝突」門檻者為交火。',h:function(){var T=G.set.tiers;return setOpt([['衝突',0],['戰役',1],['戰區',2]].map(function(q){return setRow(q[0],'<span>≥ <input type="number" min="10" value="'+T[q[1]]+'" data-c="settier" data-v="'+q[1]+'" style="width:90px"> 人</span>');}).join(''));}});
setSec('rep','rec',{t:'回放',o:20,h:function(){return setOpt(setRow('回放紀錄',setChk('setb','rec',G.set.rec!==false,'每兩分鐘記錄一次（可在「回放」頁觀看與匯出）')));}});
setSec('ap','ap',{o:10,wide:1,h:function(){return apHtml();}});
setSec('data','data',{o:10,h:function(){return '<div class="lw-row"><button type="button" class="lw-btn" data-a="save">存檔／匯出</button><button type="button" class="lw-btn dng" data-a="newgame">放棄並回到開始</button></div>';}});
CHG.setv=function(t){var f=t.getAttribute('data-f');G.set[f]=+t.value;if(f==='dur'&&G.over&&G.t<G.set.dur*3600){G.over=null;toast('已延長作戰時限，可繼續作戰。');}barRender();};
CHG.sets=function(t){G.set[t.getAttribute('data-f')]=t.value;show('set');};
CHG.setb=function(t){G.set[t.getAttribute('data-f')]=t.checked;};
CHG.setwx=function(t){if(WXI[t.value]===undefined){t.value=G.set.wx;return;}G.set.wx=t.value;if(G.env){G.env.wx=WXI[t.value];envStep(0);}};
CHG.settier=function(t){G.set.tiers[+t.getAttribute('data-v')]=Math.max(10,+t.value||10);G.set.tiers.sort(function(a,b){return a-b;});};
CHG.setnk=function(t){var f=t.getAttribute('data-f'),N=G.set.nuke;if(f==='on'||f==='ai')N[f]=t.checked;else N[f]=Math.max(0,+t.value||0);if(f==='n'&&G.started)G.sides.forEach(function(S){S.nk=N.n;});if(f==='on')show('set');};
CHG.setap=function(t){G.set.autoPause[t.getAttribute('data-f')]=t.checked;document.querySelectorAll('input[data-c="setap"][data-f="'+t.getAttribute('data-f')+'"]').forEach(function(q){q.checked=t.checked;});};
/* 自動暫停：分組清單（設定頁與作戰頁工具列共用） */
var APK=[['戰況',[['contact','首次接觸'],['meet','遭遇戰'],['rout','部隊潰散'],['hq','司令部被摧毀'],['obj','目標易手'],['reinf','增援抵達'],['fac','民用補給設施易手'],['end','作戰結束']]],
  ['火力與打擊',[['nuke','戰術核打擊'],['snuke','戰略核武：偵測到發射、核爆'],['strike','飽和打擊、地毯式轟炸、飛彈打擊'],['convoy','運輸船遭擊沉'],['sead','反輻射飛彈發射、防空雷達被擊毀']]],
  ['事件與罪行',[['evt','重大天災'],['crime','戰爭罪行'],['att','部隊對戰俘或平民的態度惡化']]],['指揮',[['req','收到請求或指令']]]];
function apHtml(){var A=G.set.autoPause||(G.set.autoPause={});return '<div class="lw-apg">'+APK.map(function(g){return '<div><b>'+g[0]+'</b>'+g[1].map(function(q){var on=A[q[0]]!==undefined?A[q[0]]:APDEF[q[0]];return '<label><input type="checkbox" data-c="setap" data-f="'+q[0]+'"'+(on?' checked':'')+'>'+q[1]+'</label>';}).join('')+'</div>';}).join('')+'</div><div class="lw-row"><button type="button" class="lw-btn sm" data-a="apall" data-v="1">全部開啟</button><button type="button" class="lw-btn sm" data-a="apall" data-v="0">全部關閉</button><button type="button" class="lw-btn sm" data-a="apall" data-v="d">恢復預設</button></div>';}
ACT.apall=function(b){var v=b.getAttribute('data-v'),A=G.set.autoPause||(G.set.autoPause={});Object.keys(APDEF).forEach(function(k){A[k]=v==='d'?APDEF[k]:v==='1';});document.querySelectorAll('input[data-c="setap"]').forEach(function(q){var k=q.getAttribute('data-f');q.checked=!!A[k];});toast(v==='d'?'已恢復自動暫停的預設值。':v==='1'?'已開啟所有自動暫停。':'已關閉所有自動暫停。');};
/* 作戰頁工具列：自動暫停快速設定 */
ACT.appop=function(b){var P=document.querySelector('.lw-appop');if(P){P.remove();return;}P=document.createElement('div');P.className='lw-appop lw-card';P.innerHTML='<h3 style="margin:0 0 6px">自動暫停</h3>'+apHtml();var r=b.getBoundingClientRect(),rr=root.getBoundingClientRect();P.style.top=(r.bottom-rr.top+4)+'px';P.style.right=Math.max(4,rr.right-r.right)+'px';root.appendChild(P);
  /* 點選視窗以外的地方即關閉 */setTimeout(function(){function off(e){if(!P.isConnected){document.removeEventListener('pointerdown',off,true);return;}if(P.contains(e.target)||e.target.closest('[data-a="appop"]'))return;P.remove();document.removeEventListener('pointerdown',off,true);}document.addEventListener('pointerdown',off,true);},0);};
ACT.newgame=function(){if(!confirm('放棄目前的作戰並回到開始頁？未存檔的進度會遺失。'))return;G=null;UI.run=false;barRender();show('start');};
PAGES.help=function(host){host.innerHTML='<div class="lw-main lw-help"><div class="lw-card"><h3>作戰模擬工具說明</h3>'+
 '<p>本工具的靈感來自即將推出的戰略遊戲《Battleplan》：在寫實的作戰地圖上，以真實的指揮鏈指揮部隊，命令要經過傳遞與各級參謀規劃才會被執行，時間以即時方式流動並可隨時暫停或加速。</p>'+
 '<h4>地圖</h4><ul><li>可由內建示範世界或地形工具的地圖參數檔「局部放大」，依當地的地勢、氣候、河流與國界產生寫實的作戰地圖；也可程序產生平原、丘陵、山地、海岸、大河河谷等地形。</li><li>地圖以像素風格呈現地表、森林、農田、聚落、道路、鐵路、河流、等高線與工事，地名與說明則以向量文字繪製。依年代決定人口、聚落規模、道路與鐵路。</li><li>「地圖編修」可塗刷地表、抬升地勢、鋪設道路鐵路、畫河流、構築工事、增刪聚落與文字，並匯出作戰地圖檔。</li></ul>'+
 '<h4>部隊與時代</h4><ul><li>單位涵蓋 1600 年代的長槍與火繩槍、燧發槍線列、拿破崙時代、線膛槍、兩次世界大戰、冷戰、資訊化與無人機時代，以及船艦、潛艦、飛機、直升機、飛艇、無人機，還有飛龍、海怪、利維坦與魔導飛艇等奇幻單位。</li><li>以連為基本單位，可用範本組成營、團、旅、師、軍，也可把整營或整團合併為單一單位。不同時代的軍隊可以混編或互相交戰。</li><li>「自訂單位類型」可修改所有數值、特性旗標、武器與軍官比例，並上傳單位圖片；個別單位也能使用自己的圖片。</li></ul>'+
 '<h4>指揮鏈與命令延遲</h4><ul><li>玩家位於本方最高司令部。命令沿編制樹逐級傳遞：傳令兵（可能被截）、有線電話（雙方都靜止才可用）、無線電（有距離限制，受電子戰干擾）、數位網路，每一級還有中繼時間。</li><li>命令送達編制單位後，由參謀依梯隊、時代與指揮官能力規劃，再分配給下級（例如攻擊時分配突擊、預備與火力支援）；末端單位還需要準備時間。</li><li>各級指揮官有統御、戰術、主動、積極與特質，主動性高的指揮官會自行派預備隊反擊或命令砲兵支援。</li></ul>'+
 '<h4>交戰細節：戰術與姿態</h4><ul><li>攻擊戰術：正面突擊、側翼迂迴、鉗形包圍、中央突破、火力與運動、滲透、試探攻擊、佯攻、襲擊；可設定砲火準備與傷亡容忍度。</li><li>防禦姿態：急造防禦、陣地防禦、縱深防禦、遲滯防禦、反斜面陣地、伏擊、隱蔽、環形據點、機動防禦。</li><li>交戰規則（自由射擊、僅還擊、近距離開火、禁止射擊）、行進節奏（急行、標準、謹慎），早期時代還有橫隊、衝擊縱隊與散兵線。</li><li>戰鬥計算觀測與通視、直射、突擊與白刃、方陣對騎兵、間接火力與反砲兵、防空、空戰、對地攻擊、魚雷、海怪纏鬥與飛龍的恐懼光環；士氣、壓制、疲勞、工事與組織度都會影響結果。</li></ul>'+
 '<h4>天氣與日夜</h4><p>依地點的緯度、日期計算日出日落與月相；天氣依氣候變化，影響能見度、空中作業、泥濘與積雪。夜間觀測距離大減，夜視裝備（微光、熱像）可以彌補。黑火藥武器在雨中幾乎無法射擊。</p>'+
 '<h4>後勤</h4><ul><li>補給鏈：地圖外友方基地 → 港口、機場、鐵路站 → 補給站（前進基地）→ 補給部隊 → 前線單位。每個節點有每日吞吐量與儲量；補給站由車隊運補，運量＝車輛數 × 載重 × 每日往返趟次。敵軍威脅運補路線或節點時運量大減，節點被佔領則存量全失。</li><li>每個單位有士兵、士官、軍官的編成、各類武器數量、彈藥基數與每日配給。一日三餐可為士兵、士官、軍官分別設計，熱量不足會飢餓，熱食與嗜好品能提振士氣；馬匹需要草料，車輛需要燃料。</li></ul>'+
 '<h4>戰報</h4><p>每次接觸都會記錄為「交火」；後續投入更多兵力（預備隊、援軍）時，依雙方累計人數升級為「衝突」「戰役」「戰區」，相連的戰鬥會合併，較小者成為子戰鬥。戰報列出兵力（初始、後續、增援）、損失與傷亡原因、單位下場、結果與經過，可匯出文字或 JSON。</p>'+
 '<h4>增援</h4><p>在「兵力編成」可把任何部隊設為增援，指定抵達時間或觸發條件（首次接觸後、目標失守、兵力低於某比例）、進場位置與抵達後的命令；作戰中也可隨時按「＋增援」加派範本、任何單位類型或自訂類型的援軍。</p>'+
 '<h4>兵力投射</h4><ul><li>增援可選擇進場方式：陸路、空降（運輸機傘降，散布與集結時間依年代、夜間與天候）、機降（直升機）、兩棲登陸（由外海直線駛向灘頭，水上非常脆弱）、空中進場（航空器直接飛抵任務地點）。</li><li>「機降」命令：步兵申請直升機，由最近的運輸直升機單位接運，運力不足時分批往返；直升機被擊落時機上人員也會傷亡。「空降」命令：空降部隊登機後由運輸機投送。「登陸」命令：部隊到岸邊後以舟艇或兩棲車輛橫渡水域。</li><li>戰術核武需在「設定」啟用；由重砲、飛彈或轟炸機投射，命令一樣要經指揮鏈下達。爆炸分為全毀、重創、輕傷與震撼範圍（隨當量的立方根擴大），城鎮變成廢墟、植被變焦土、橋梁損毀，並留下輻射污染區。</li></ul>'+
 '<h4>直接指令與戰線</h4><ul><li>圍攻：沿包圍圈部署並轟擊圈內，包圍圈完成後圈內敵軍補給斷絕、士氣下降、容易被俘。伏擊：隱蔽待敵進入近距離。遲滯：接敵即逐次後撤。固守：死守不退。追擊：持續鎖定最近（優先潰退中）的敵軍。</li><li>戰線：依雙方地面部隊的兵力與射程計算影響力，形成控制區；兩方控制區的交界就是戰線（紫色粗線），三小時前的戰線以虛線顯示，可看出推進。戰報頁有控制面積隨時間的變化。</li><li>各營、團、師的直屬砲兵沒有任務時，會自動對上級單位附近的敵軍提供火力支援（可在設定關閉）。</li></ul>'+
 '<h4>武器與熟練度</h4><ul><li>「武器庫」可修改每種武器的殺傷、穿甲、壓制、射程、精度、防空與夜視，或新增自訂武器。單位火力＝兵種數值 × 實際配備與時代標準配備的比值，所以換裝較新世代的武器（例如第三代突擊步槍、反戰車飛彈）會提高火力。</li><li>熟練度分為民兵、新兵、正規軍、老練、精銳：影響命中、反應時間、承受壓制、士氣回復、潰散門檻、伏擊紀律與空降散布。步兵的防彈護具降低傷亡，負重影響行軍速度與疲勞。</li></ul>'+
 '<h4>道路與城鎮</h4><ul><li>道路分為小路、鄉道、公路、高速公路，另有鐵道與高鐵（高架，地面部隊不能使用）；依年代與地區開發程度（人口密度）產生，開發程度低的地區多為小路與鄉道。</li><li>城鎮作戰：建物提供掩護，巷戰的突擊較慢、傷亡較高，車輛在城鎮中容易遭步兵反裝甲伏擊；砲擊會讓城鎮逐漸變成廢墟（掩護更好但難以通行）。</li></ul>'+
 '<h4>動態士氣</h4><ul><li>士氣會受近期傷亡、側翼或後方受敵、被包圍、猛烈壓制、恐懼光環、戰車恐慌（沒有反裝甲武器的部隊在開闊地遭裝甲逼近）、夜戰、飢餓、疲勞、超出指揮範圍與司令部失聯影響；部隊潰散會讓附近友軍恐慌，敵軍潰散、投降或被殲滅則鼓舞附近部隊。單位面板會列出目前影響最大的士氣因素。</li><li>士氣高昂、指揮官積極的部隊，可能對附近動搖、潰散或較弱的敵軍<b>自行出擊</b>，得手後返回原陣地恢復原任務；騎兵會趁勢追擊潰逃之敵，特種部隊會襲擊敵後方。</li><li>士氣低落、傷亡慘重的攻擊部隊可能<b>拒絕繼續進攻</b>並就地掩蔽；受壓而未崩潰的部隊會<b>有序後撤</b>一至兩公里重新佈防。</li><li>士氣崩潰即<b>潰散</b>（火砲部隊會丟棄部分火砲），朝上級司令部逃離；脫離接觸後在司令部附近<b>重新集結</b>，整頓後<b>歸建</b>擔任預備隊。被切斷、被包圍或長期被圍斷糧的部隊可能<b>投降</b>。熟練度、指揮官特質（鼓舞、頑強、謹慎、魯莽）與工事都會影響這些反應。</li></ul>'+
 '<h4>兵種行為與相克</h4><ul><li>非主戰單位會迴避前線：後勤（3 公里）、指揮所（2 公里）、防空（1.5 公里）、閒置的工兵（1.2 公里）與砲兵（依射程）在敵軍逼近時自動轉移；各級司令部也會後撤。偵察部隊避免與優勢敵軍決戰；反裝甲部隊遭步兵逼近又無步兵掩護時後撤，並優先射擊車輛。</li><li>兵種相克依攻擊方與目標的類別調整火力與突擊效果，並考慮地形：裝甲在開闊地壓制步兵，但在城鎮與森林中優勢下降；步兵與反裝甲在森林、城鎮近距離伏擊裝甲；騎兵衝擊砲兵與後勤，卻怕長槍與裝甲；防空克制直升機、飛機與無人機。</li></ul>'+ctrTable()+
 '<h4>工兵、橋梁與隧道</h4><ul><li>地圖上的道路與鐵路遇到山體大幅繞路時，會以隧道直線貫通（鐵路 1860 年後、公路 1930 年後）；放大地圖可看到橋梁符號。工兵可炸毀橋梁或隧道，地圖編修也有橋梁、隧道工具。</li><li>架橋可選突擊橋（渡橋，1940 年後或架橋部隊，十分鐘內完成，只適用小河）、浮橋（大河）或工兵便橋（較慢但可通行重型車輛）；架橋連的作業時間減半。設置渡口：小艇渡口讓步兵更快、更安全地渡河，渡輪（門橋）也能運送車輛；沒有渡輪的車輛只能走橋梁。</li><li>構築：野戰陣地（塹壕與鐵絲網）、半永久工事（碉堡）、堡壘（環形碉堡群）、稜堡（星形要塞）與補給站（新增前進補給節點）；受攻擊時進度變慢。開闢通路可清除鐵絲網與雷區、削弱碉堡。</li></ul>'+
 '<h4>作戰命令</h4><ul><li>渡河作戰：工兵設置小艇渡口與浮橋，砲兵壓制對岸，步兵搶渡，車輛待橋梁或渡輪完成後跟進。強攻：砲火準備後以高傷亡容忍度猛攻，工兵同時開闢通路。突破：第一梯隊在狹窄正面撕開防線並固守兩肩，第二梯隊穿過突破口向縱深發展。穿插：避開已知敵軍規劃路線，滲透到敵後奪取要點、切斷補給線。</li><li>電腦指揮官會依局部兵力比選擇戰術：優勢明顯時鉗形包圍或側翼迂迴，勢均力敵時集中突破，遇到工事時強攻，攻擊軸線上有大河又沒有橋時實施渡河作戰；敵軍崩潰時以機動部隊追擊；守勢時依敵情選擇陣地、縱深或遲滯防禦，並讓工兵構築陣地；兵力崩潰時全線遲滯後撤。</li></ul>'+
 '<h4>回放</h4><p>開戰後每兩分鐘記錄一次所有單位的位置、兵力與狀態，以及天氣、日夜、目標點與戰線。「回放」頁可用時間軸拖曳、播放與變速觀看，點選事件跳到當時；可匯出成回放檔（.latowarreplay.json）分享，或匯入別人的回放檔。</p>'+
 '<h4>操作</h4><ul><li>頂列可開始／暫停（空白鍵）與切換速度（1 倍至每秒 30 分鐘），「+30秒」單步前進。</li><li>點選選取、Shift 或 Ctrl 多選、Shift 拖曳框選；選好命令後點地圖下令，防禦可拖曳畫防線；右鍵可快速下達移動命令。滾輪或雙指縮放，拖曳平移。</li><li>可切換以任一方或上帝視角觀看；作戰中隨時存檔，也會自動存到瀏覽器。</li></ul></div></div>';};

/* 兵種相克表（說明頁）：列為攻擊方、欄為目標，倍率大於 1 為優勢 */
function ctrTable(){var R=['inf','mech','arm','at','art','ad','cav','pike','rec','sof','heli','air','uav','beast'],C=['inf','mech','arm','at','art','ad','cav','pike','sup','hq','heli','air','uav'];
  var o='<div class="lw-sc" style="overflow:auto"><table class="lw-tbl lw-ctr"><caption class="lw-note" style="text-align:left">兵種相克倍率（列：攻擊方；欄：目標）。綠色為優勢、紅色為劣勢，未標示者為 1。</caption><tr><th></th>'+C.map(function(c){return '<th>'+UCLS[c]+'</th>';}).join('')+'</tr>';
  R.forEach(function(a){o+='<tr><th>'+UCLS[a]+'</th>'+C.map(function(t){var m=ctrBase(a,t);if(Math.abs(m-1)<0.01)return '<td class="n" style="color:var(--lw-mute,#999)">·</td>';var k=Math.min(1,Math.abs(m-1)/0.8),bg=m>1?'rgba(46,125,50,'+(0.12+0.4*k).toFixed(2)+')':'rgba(198,40,40,'+(0.12+0.4*k).toFixed(2)+')';return '<td class="n" style="background:'+bg+'">'+m.toFixed(2).replace(/0$/,'')+'</td>';}).join('')+'</tr>';});
  return o+'</table></div>';}
