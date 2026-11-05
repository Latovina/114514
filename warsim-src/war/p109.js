/* ===================== 兵牌狀態條：兵力條下面依序畫士氣、恐懼、補給、疲勞
   只畫本方部隊（上帝視角或關閉戰爭迷霧時全部）；合併顯示的編制取下屬的平均；到了危險程度的那條加紅框 ===================== */
var UBAR={mor:{n:'士氣',c:'#42A5F5'},fear:{n:'恐懼',c:'#AB47BC'},sup:{n:'補給',c:'#FFB300'},fat:{n:'疲勞',c:'#BCAAA4',c2:'#6D4C41'}},UBARK=['mor','fear','sup','fat'];
function ubarMode(){return UIP.barM||'own';}
function ubarOn(k){return !(UIP.bars&&UIP.bars[k]===0);}
/* 補給：彈藥、糧秣、燃料三樣裡最缺的一樣 */
function supFracU(u){var L=u.lg,a=clamp((u.ammo===undefined?100:u.ammo)/100,0,1),f=1,fu=1;if(L){if(L.foodCap>0)f=clamp(L.food/L.foodCap,0,1);if(L.fuelCap>0)fu=clamp(L.fuel/L.fuelCap,0,1);}return {a:a,f:f,fu:fu,v:Math.min(a,f,fu)};}
function ubarVals(L){var n=0,o={mor:0,fear:0,sup:0,fat:0,exh:0,cut:0,rout:0};L.forEach(function(x){if(!x||!alive(x))return;n++;o.mor+=(x.mor||0)/100;o.fear+=(x.fear||0)/100;o.sup+=supFracU(x).v;o.fat+=(x.fat||0)/100;o.exh+=(x.exh||0)/100;if(x.insup===false)o.cut++;if(x.ms==='rout')o.rout++;});
  if(!n)return null;UBARK.forEach(function(k){o[k]/=n;});o.exh/=n;o.n=n;return o;}
function ubarWarn(k,v,o){return k==='mor'?v<0.3||o.rout>0:k==='fear'?v>=0.65:k==='sup'?v<0.15||o.cut>0:v>=0.8||o.exh>=0.65;}
function uBars(it,u,sel){var m=ubarMode();if(m==='off'||!u||!G||!G.started||G.replay)return null;if(m==='sel'&&!sel)return null;if(!sel&&(VW.s||0)<1.5)return null;
  var me=UI.side;if(me>=0&&u.side!==me&&!seeAll())return null;if(it.s&&it.s.dom==='air')return null;
  var V=ubarVals(it.grp||(it.agg&&it.L)||[u]);if(!V)return null;var out=[];UBARK.forEach(function(k){if(ubarOn(k))out.push(k==='fat'?[Math.max(V.fat,V.exh),UBAR.fat.c,ubarWarn(k,V.fat,V)?1:0,V.exh,UBAR.fat.c2]:[V[k],UBAR[k].c,ubarWarn(k,V[k],V)?1:0]);});return out.length?out:null;}
(function(){var st=document.createElement('style');st.textContent='.lw-ubsw{display:inline-block;width:12px;height:6px;border-radius:2px;margin:0 3px 1px 1px;vertical-align:middle}.lw-ubleg{display:flex;flex-wrap:wrap;gap:2px 10px;font-size:11px;color:#5a6672;margin:2px 0 4px}.lw-bar2.ub-sup>i{background:#FFB300}';document.head.appendChild(st);})();
function ubarLeg(){return '<div class="lw-ubleg" title="兵牌下方狀態條的順序與顏色">'+UBARK.filter(ubarOn).map(function(k){return '<span><i class="lw-ubsw" style="background:'+(UBAR[k].c2?'linear-gradient(90deg,'+UBAR[k].c2+' 50%,'+UBAR[k].c+' 50%)':UBAR[k].c)+'"></i>'+UBAR[k].n+(UBAR[k].c2?'（深色是長期疲憊）':'')+'</span>';}).join('')+'</div>';}
/* ---------- 設定 ---------- */
setSec('gfx','ubar',{t:'兵牌狀態條',o:9,local:true,h:function(){return setOpt(setRow('顯示',setSel('ubarm','',[['own','本方部隊（地圖放大後）'],['sel','只有選取的部隊'],['off','不顯示']],ubarMode()))+
  setRow('項目',UBARK.map(function(k){return setChk('ubark',k,ubarOn(k),'<i class="lw-ubsw" style="background:'+(UBAR[k].c2?'linear-gradient(90deg,'+UBAR[k].c2+' 50%,'+UBAR[k].c+' 50%)':UBAR[k].c)+'"></i>'+UBAR[k].n);}).join(' ')))+
  '<div class="lw-note">兵力條下方依序是士氣、恐懼、補給、疲勞，條越長數值越高：士氣越高昂、恐懼越深、補給越充足、越疲勞；疲勞條淺色是當下的體力消耗，深色是連日累積、要好好休整才會消退的長期疲憊。補給取彈藥、糧秣與燃料中最缺的一樣。'+
  '加紅框表示到了危險程度：士氣低於 30 或有部隊潰散、極度驚恐（65 以上）、補給低於 15% 或補給線中斷、疲勞 80 以上或長期疲憊到精疲力竭（65 以上）。看不到敵軍的這些狀態。</div>';}});
CHG.ubarm=function(t){UIP.barM=t.value;uipSave();if(G&&G.map&&VW.ct)vDraw(false);};
CHG.ubark=function(t){var B=UIP.bars||(UIP.bars={});B[t.getAttribute('data-f')]=t.checked?1:0;uipSave();if(G&&G.map&&VW.ct)vDraw(false);};
/* ---------- 部隊面板：彈藥下面加一條補給（列出最缺的是哪一樣），再附上兵牌狀態條的圖例 ---------- */
(function(){var b=btStatus;btStatus=function(){b.apply(this,arguments);try{if(!G||!G.started||UI.selX||UI.selC||UI.selB||!UI.sel||UI.sel.length!==1)return;var u=uById(UI.sel[0]),el=btEl('bst');if(!u||!el)return;if(UI.side>=0&&u.side!==UI.side&&!seeAll())return;
  var bars=el.querySelector('.lw-bars');if(!bars)return;var L=isLeaf(u)?[u]:leavesOf(u).filter(alive);if(!L.length)return;var a=0,f=0,fu=0,nf=0,days=0,nd=0;
  L.forEach(function(x){var S=supFracU(x);a+=S.a;f+=S.f;if(x.lg&&x.lg.fuelCap>0){fu+=S.fu;nf++;}if(x.lg&&x.lg.dayKg>0){days+=x.lg.food/(x.lg.dayKg*(x.men0>0?Math.max(0.05,x.men/x.men0):1));nd++;}});a/=L.length;f/=L.length;fu=nf?fu/nf:1;
  var v=Math.min(a,f,fu),low=v===a?'彈藥':v===f?'糧秣':'燃料',txt='彈藥 '+fmt(a*100)+'%・糧秣 '+(nd?(days/nd).toFixed(1)+' 天':fmt(f*100)+'%')+(nf?'・燃料 '+fmt(fu*100)+'%':'');
  var tmp=document.createElement('div');tmp.innerHTML=bar('補給',v*100,'ub-sup',fmt(v*100)+'%');var lbl=[].slice.call(bars.children).filter(function(c){return c.tagName==='SPAN'&&c.textContent==='彈藥';})[0],ref=lbl&&lbl.nextSibling&&lbl.nextSibling.nextSibling?lbl.nextSibling.nextSibling.nextSibling:null;
  while(tmp.firstChild)bars.insertBefore(tmp.firstChild,ref);bars.insertAdjacentHTML('afterend','<div class="lw-note lw-ubsup">補給：'+txt+(v<0.5?'；最缺的是<b>'+low+'</b>':'')+'</div>'+(ubarMode()!=='off'?ubarLeg():''));}catch(e){}};})();
if(typeof HELP14!=='undefined')HELP14.push('<h4>兵牌狀態條</h4><ul>'+
  '<li>作戰開始後，本方部隊的兵牌在兵力條下方依序畫出<b>士氣</b>（藍）、<b>恐懼</b>（紫）、<b>補給</b>（琥珀）、<b>疲勞</b>（褐）四條；條越長數值越高。疲勞條的淺色是當下的體力消耗，深色是長期疲憊。合併顯示的編制取下屬部隊的平均。</li>'+
  '<li>補給取彈藥、糧秣與燃料中最缺的一樣；部隊面板的補給條下面列出三樣各剩多少。</li>'+
  '<li>加紅框表示到了危險程度：士氣低於 30 或有部隊潰散、極度驚恐、補給低於 15% 或補給線中斷、疲勞 80 以上或精疲力竭。</li>'+
  '<li>敵軍的士氣、恐懼、補給與疲勞看不到。設定的「兵牌狀態條」可以改成只顯示選取的部隊、關閉，或挑選要畫哪幾條。</li></ul>');
