/* ===================== v9 介面：部隊番號與防區圖層開關、防區（戰區體系）圖層與面板、自動構工設定、對第三方的行動；全螢幕橫版介面（整個畫面都是地圖）與鍵盤操作 ===================== */
var UIP={unm:1,thz:1,land:'auto',lp:null,rp:1,ly:null};
(function(){try{var o=JSON.parse(localStorage.getItem('lato-warsim-ui')||'null');if(o)Object.assign(UIP,o);}catch(e){}})();
function uipSave(){try{localStorage.setItem('lato-warsim-ui',JSON.stringify(UIP));}catch(e){}}
UI.lay.unm=UIP.unm;UI.lay.thz=UIP.thz;
/* ---------- 圖層列：番號、防區 ---------- */
(function(){var b=lyRender;lyRender=function(){b();if(!VW.ly)return;var L=UI.lay,sel=VW.ly.querySelector('select[data-ly="lvl"]');[['unm','番號','部隊番號（選取的部隊一律顯示；鍵盤 N）'],['thz','防區','防區與戰區體系（鍵盤 T）']].forEach(function(q){var l=document.createElement('label');l.title=q[2];l.innerHTML='<input type="checkbox" data-ly="'+q[0]+'"'+(L[q[0]]!==0?' checked':'')+'>'+q[1];VW.ly.insertBefore(l,sel);});
  var tg=document.createElement('button');tg.type='button';tg.className='lw-lyt';tg.setAttribute('data-a','lytg');tg.title='顯示或收起圖層開關';tg.textContent='圖層';VW.ly.insertBefore(tg,VW.ly.firstChild);
  var oc=VW.ly.onchange;VW.ly.onchange=function(e){oc(e);var k=e.target.getAttribute('data-ly');if(k==='unm'||k==='thz'){UIP[k]=UI.lay[k];uipSave();}};};})();
ACT.lytg=function(){UIP.ly=lyOpen()?0:1;uipSave();landCls();};
function layToggle(k){UI.lay[k]=UI.lay[k]===0?1:0;UIP[k]=UI.lay[k];uipSave();lyRender();vDraw(true);toast((k==='unm'?'部隊番號':'防區圖層')+(UI.lay[k]?'：顯示':'：隱藏'));}

/* ---------- 地圖：防區（前沿防區的格子與外框、支援地帶），畫在所有圖示底下 ---------- */
function drawUnder(c){if(UI.lay.thz===0||!G||!G.started||!G.aw||G.replay)return;var me=UI.side,sides=me>=0&&!seeAll()?[me]:SIDES(),m=mpp(),cs=AWS/m;if(cs<5)return;c.save();
  sides.forEach(function(side){var T=SD(side).thz,A=G.aw.s[side];if(!T||!A)return;var col=sideCol(side);
    function tile(k,a){var S=A[k];if(!S)return null;var p=w2s(S.x-AWS/2,S.y-AWS/2);if(p[0]>VW.cw||p[1]>VW.ch||p[0]+cs<0||p[1]+cs<0)return p;c.globalAlpha=a;c.fillStyle=col;c.fillRect(p[0]+1,p[1]+1,cs-2,cs-2);return p;}
    (T.supK||[]).forEach(function(k){tile(k,0.045);});
    T.zones.forEach(function(z){var set={};z.keys.forEach(function(k){set[k]=1;});c.globalAlpha=1;
      z.keys.forEach(function(k){var S=A[k];var p=tile(k,0.05+0.035*(S?S.lv:0));if(!p)return;var q=k.split('|'),gx=+q[0],gy=+q[1];c.globalAlpha=0.75;c.strokeStyle=col;c.lineWidth=z.lv>=3?2:1.4;c.setLineDash(z.lv>=2?[]:[5,4]);c.beginPath();
        if(!set[gx+'|'+(gy-1)]){c.moveTo(p[0],p[1]);c.lineTo(p[0]+cs,p[1]);}if(!set[gx+'|'+(gy+1)]){c.moveTo(p[0],p[1]+cs);c.lineTo(p[0]+cs,p[1]+cs);}if(!set[(gx-1)+'|'+gy]){c.moveTo(p[0],p[1]);c.lineTo(p[0],p[1]+cs);}if(!set[(gx+1)+'|'+gy]){c.moveTo(p[0]+cs,p[1]);c.lineTo(p[0]+cs,p[1]+cs);}c.stroke();c.setLineDash([]);});
      c.globalAlpha=1;var p2=w2s(z.x,z.y);if(p2[0]<-80||p2[1]<-20||p2[0]>VW.cw+80||p2[1]>VW.ch+20)return;var t='第'+z.i+'防區'+(cs>=34?'・'+AWN[z.lv]+(z.held>=3600?'・相持 '+durTxt(z.held):''):'');c.textAlign='center';txtHalo(c,t,p2[0],p2[1]-cs*0.5-4,'bold 11px sans-serif',col);});});
  c.restore();}

/* ---------- 戰區體系面板：後勤頁與戰況總覽 ---------- */
var THZP=[['第一道塹壕',function(T){return T.lv>=2;}],['鐵絲網與碉堡',function(T){return T.lv>=3;}],['雷區與交通壕',function(T){return T.lv>=4;}],['補給站',function(T){return T.dep>0;}],['醫院',function(T){return T.hosp>0;}],['油彈庫',function(T){return T.dump>0;}],['機場',function(T){return T.air>0;}],['補給道路',function(T){return (T.cnt.road||0)>0;}]];
function thzHtml(side){var T=SD(side).thz;if(!T||!G.aw)return '<div class="lw-note">部隊在同一地區停留一段時間後，這裡會顯示自然形成的防區與後方體系。</div>';var C=G.aw.cnt[side]||{},km=G.map.cs/1000,mv=G.aw.lg[side]||{};
  var o='<div class="lw-kv">'+kv('完整度','<b>'+T.score+'%</b>　'+THZP.map(function(q){return (q[1](T)?'✔':'—')+' '+q[0];}).join('　'))+kv('前線','前沿防區格 '+T.front+'、支援地帶 '+T.sup+'、後方 '+T.rear+'（每格 2.5 公里）');
  o+=kv('工事','塹壕約 '+fx((C.t1||0)*km,1)+' 公里、鐵絲網約 '+fx((C.t2||0)*km,1)+' 公里、碉堡 '+(C.t4||0)+' 座'+(C.t3?'、雷區 '+C.t3+' 處':''));
  o+=kv('後方','補給站 '+T.dep+'、醫院 '+T.hosp+'、油彈庫 '+T.dump+'、機場 '+T.air+((C.road||0)>0?'、補給道路約 '+fx(C.road,1)+' 公里':''));
  if(C.brg||C.rdfix||mv.mv||mv.hmv)o+=kv('維護',(C.brg?'重建橋梁 '+C.brg+' 座、':'')+(C.rdfix?'整修路面 '+fmt(C.rdfix)+' 格次、':'')+'補給站遷移 '+(mv.mv||0)+' 次、野戰醫院遷移 '+(mv.hmv||0)+' 次');o+='</div>';
  if(T.zones.length)o+='<table class="lw-tbl" style="margin-top:6px"><tr><th>防區</th><th class="n">格數</th><th>工事</th><th class="n">相持</th></tr>'+T.zones.map(function(z){return '<tr class="cl" data-a="thzgo" data-v="'+side+'|'+z.i+'"><td>第'+z.i+'防區</td><td class="n">'+z.n+'</td><td>'+AWN[z.lv]+'</td><td class="n">'+durTxt(z.held)+'</td></tr>';}).join('')+'</table>';
  return o+'<div class="lw-note">停在原地的部隊會自己構工；同一地區相持越久，工事越完整：倉促陣地（1 小時）→ 塹壕（6 小時）→ 鐵絲網與碉堡（1 天）→ 雷區與交通壕（3 天）→ 縱深防禦（7 天），工兵在場時更快。後勤與衛生部隊自行開設補給站與野戰醫院，工兵修復設施與橋梁、設油彈庫、闢機場與補給道路；前線推進或受威脅時，後勤設施會遷移。</div>';}
ACT.thzgo=function(b){var q=b.getAttribute('data-v').split('|'),T=SD(+q[0]).thz,z=T&&T.zones.filter(function(z){return z.i===+q[1];})[0];if(!z)return;show('battle');vCenter(z.x,z.y,Math.max(VW.s,1));};
(function(){var b=PAGES.logi;PAGES.logi=function(host){b(host);if(!G||!G.started)return;var M=host.querySelector('.lw-main');if(!M)return;var d=document.createElement('div');d.className='lw-card';d.innerHTML='<h3>戰區體系<small>'+esc(G.sides[LG.side].name)+'自然形成的防區與後方</small></h3>'+thzHtml(LG.side);M.insertBefore(d,M.children[3]||null);};})();
(function(){var b=overview;overview=function(){var o=b();if(!G||!G.started||!G.aw)return o;var me=UI.side>=0?UI.side:0,T=SD(me).thz;if(!T||!T.zones.length&&!T.dep)return o;
  return o+'<h4 style="margin:10px 0 4px;font-size:13px">戰區體系</h4><div class="lw-kv">'+kv('完整度',T.score+'%')+kv('防區',T.zones.length?T.zones.map(function(z){return '第'+z.i+'防區（'+AWN[z.lv]+'）';}).join('、'):'尚未形成')+kv('後方','補給站 '+T.dep+'、醫院 '+T.hosp+'、油彈庫 '+T.dump+'、機場 '+T.air)+'</div>';};})();

/* ---------- 設定：自動構工與後勤、畫面配置 ---------- */
setSec('logi','aw',{o:11,h:function(){return setOpt(setRow('自動構工與後勤',setSel('setaw','',[['all','雙方部隊都自動（預設）'],['ai','只有電腦指揮的部隊'],['off','關閉（全部由玩家下令）']],awMode())));}});
setSec('gfx','land',{t:'版面',o:30,h:function(){return setOpt(setRow('畫面配置',setSel('setland','',[['auto','自動（橫向畫面時全螢幕地圖）'],['on','全螢幕地圖'],['off','分頁版面']],UIP.land)));}});
CHG.setaw=function(t){G.set.autoWorks=t.value;toast(t.value==='off'?'部隊不再自動構工；工事、補給站與醫院需要手動下令。':t.value==='ai'?'只有電腦指揮的部隊會自動構工與開設後勤設施。':'雙方部隊都會自動構工、開設與遷移後勤設施。');};
CHG.setland=function(t){UIP.land=t.value;uipSave();landApply(true);};

/* ---------- 對第三方團體與記者的行動 ---------- */
var TPA={guide:['護送','由部隊護送，沿途不必因附近交戰停下'],aid:['救護支援','治療他們的傷患、提供掩護'],give:['贈與物資','把糧食交給援助團體轉發平民；對記者是提供交通與補給'],detain:['拘留盤查','扣留盤查：援助團體會暫停在我方地區的工作；長期扣押違反國際法'],intern:['扣押為人質','戰爭罪行：援助團體停止在我方地區工作三天'],fire:['開火','攻擊受保護的人員：嚴重的戰爭罪行，援助團體停止工作一週'],release:['釋放','釋放被拘留的人員']};
function tpActHtml(T,t,acts){if(!G.started)return '';var A=civActors(T,t);if(!A.length)return '<div class="lw-note" style="margin-top:8px">附近 20 公里內沒有可以執行的'+(mySide()===null?'':'本方')+'地面部隊。</div>';var cur=A.filter(function(u){return u.id===UI.v8u;})[0]||A[0];UI.v8u=cur.id;
  return '<h4 style="margin:10px 0 4px;font-size:13px">對'+(t==='P'?'記者':'第三方團體')+'的行動</h4><div class="lw-opt"><span>執行單位</span><select data-c="v8u">'+A.map(function(u){return '<option value="'+u.id+'"'+(u===cur?' selected':'')+'>'+esc(uName(u))+'（'+kmTxt(dist(u.x,u.y,T.x,T.y))+'）</option>';}).join('')+'</select></div><div class="lw-ob">'+
    acts.map(function(a){var dg=CIVA[a][2];return '<button type="button" data-a="v8civ" data-v="'+a+'"'+(dg?' class="dng"':'')+' title="'+esc(TPA[a][1])+'">'+(dg?'⚠ ':'')+TPA[a][0]+'</button>';}).join('')+'</div><div class="lw-note">'+acts.map(function(a){return '<b>'+TPA[a][0]+'</b>：'+esc(TPA[a][1]);}).join('<br>')+'</div>';}
function tpDetTxt(T,t){if(T.st!=='det')return '';var rel=t==='P'?T.relT:T.detT;return '<div class="lw-note" style="color:#b3261e"><b>被'+esc(G.sides[T.detBy]?G.sides[T.detBy].name:'')+'拘留中</b>'+(rel&&rel<1e14?'，預計 '+durTxt(Math.max(0,rel-G.t))+'後釋放':'，沒有釋放期限')+'</div>';}
function tpActs(T,t){var me=mySide();if(T.st==='det')return me===null||T.detBy===me?['release','give','aid']:[];if(t==='P'&&T.st!=='ok'&&T.st!=='wia')return [];return ['guide','aid','give','detain','intern','fire'];}
(function(){var b=tpPanel;tpPanel=function(A){var o=b(A);if(!G.started||A.st==='dead'||A.st==='gone')return o;var acts=tpActs(A,'A');return o+tpDetTxt(A,'A')+(acts.length?tpActHtml(A,'A',acts):'');};})();
(function(){var b=repPanel;repPanel=function(R){var o=b(R);if(!G.started)return o;var acts=tpActs(R,'P');return o+tpDetTxt(R,'P')+(acts.length?tpActHtml(R,'P',acts):'');};})();
function tpWarn(a,T,t,u){var nm=tpName(T,t);return (a==='fire'?'向'+nm+'開火是攻擊受國際法保護的人員，是嚴重的戰爭罪行。':'把'+nm+'扣押為人質是戰爭罪行。')+'\n\n後果：人員死傷或被扣押；國際援助團體會暫停在我方地區的所有工作'+(a==='fire'?'一週':'三天')+'，平民得不到救援；消息會被記者與援助團體揭露，國際聲望下降，戰後總結會列出下令者與執行部隊。守法的部隊可能拒絕執行。\n\n確定要命令「'+uName(u)+'」執行嗎？';}
(function(){var b=ACT.v8civ;ACT.v8civ=function(btn){var X=UI.selX;if(!X||X.k!=='tp'&&X.k!=='rep')return b(btn);var a=btn.getAttribute('data-v'),T=v8Get(X),tg=X.k==='tp'?'A':'P';if(!T||!G.started||!CIVA[a]){toast('對象已經不在。');return;}
  var L=civActors(T,tg),u=L.filter(function(q){return q.id===UI.v8u;})[0]||L[0];if(!u){toast('附近沒有可以執行的部隊。');return;}if(CIVA[a][2]&&typeof confirm==='function'&&!confirm(tpWarn(a,T,tg,u)))return;
  var r=issue(u,'civ',{x:T.x,y:T.y,opt:{tg:tg,id:T.id,act:a}});toast('已命令'+uName(u)+'：'+TPA[a][0]+(r&&r.sec>0?'（約 '+durTxt(r.sec)+' 後送達）':''));vDraw(false);btLeft(true);};})();
/* 地圖：被拘留的第三方人員加上標記；被拘留的記者也畫出來（可以點選、釋放） */
(function(){var b=drawCiv;drawCiv=function(c){b(c);if(!G||!G.started)return;try{var me=UI.side;c.save();c.textAlign='center';c.textBaseline='middle';
  (G.tp||[]).forEach(function(A){if(A.st!=='det'||A._sx===undefined)return;c.fillStyle='#424242';c.strokeStyle='#fff';c.lineWidth=1;c.beginPath();c.arc(A._sx+8,A._sy-8,5.5,0,2*PI);c.fill();c.stroke();c.fillStyle='#fff';c.font='bold 8px sans-serif';c.fillText('拘',A._sx+8,A._sy-7.5);});
  if(G.press&&VW.s>=0.5)G.press.R.forEach(function(R){if(R.st!=='det')return;if(me>=0&&!seeAll()&&R.host!==me&&R.detBy!==me)return;var p=w2s(R.x,R.y),x=p[0]+17,y=p[1]-17;if(x<-20||y<-20||x>VW.cw+20||y>VW.ch+20)return;c.fillStyle='#9E9E9E';c.strokeStyle='#424242';c.lineWidth=1;c.fillRect(x-5,y-3.5,10,7);c.strokeRect(x-5,y-3.5,10,7);c.fillStyle='#424242';c.font='bold 8px sans-serif';c.fillText('拘',x+9,y-6);R._sx=x;R._sy=y;});c.restore();}catch(e){}};})();
(function(){var b=v8Tip;v8Tip=function(k,o){var t=b(k,o);return (k==='tp'||k==='rep')&&o.st==='det'?t+'（被拘留）':t;};})();
