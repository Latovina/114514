/* ===================== 火槍與冷兵器時代（介面）：八百里加急按鈕、設定、說明 ===================== */
UI.expArm=false;
function expBtnTxt(side){var n=expLeft(side);return '⚡ 八百里加急'+(UI.expArm?'（下一道命令）':n?'（'+n+'）':'（'+durTxt(Math.max(0,expNext(side)-G.t))+'）');}
(function(){var b=barRender;barRender=function(){b();try{var me=mySide();if(!G||!G.started||G.replay||!UI.bar||me===null||!expOn(me))return;var sp=UI.bar.querySelector('.lw-sp');if(!sp||UI.bar.querySelector('[data-k="exp"]'))return;
  var e=document.createElement('button');e.type='button';e.className='lw-btn sm'+(UI.expArm?' pri':'');e.setAttribute('data-k','exp');e.setAttribute('data-a','exparm');e.style.cssText='min-height:24px;font-size:12px;white-space:nowrap';
  e.title='把下一道命令交給驛馬快遞：不經各級司令部轉手，直送受令部隊，約為一般傳令的兩倍速度。每方兩組快馬，用過後約 '+durTxt(expCd())+'才再備妥。';e.textContent=expBtnTxt(me);sp.parentNode.insertBefore(e,sp);}catch(x){}};})();
var EXPT=0;(function(){var b=hudTick;hudTick=function(force){b(force);var n=Date.now();if(!force&&n-EXPT<2000)return;EXPT=n;var e=UI.bar&&UI.bar.querySelector('[data-k="exp"]'),me=mySide();if(e&&G&&me!==null){e.textContent=expBtnTxt(me);e.classList.toggle('pri',!!UI.expArm);}};})();
ACT.exparm=function(){var me=mySide();if(me===null)return;if(!UI.expArm&&expReady(me)<0){toast('驛馬還沒備妥，約 '+durTxt(Math.max(0,expNext(me)-G.t))+'後才能再用。');return;}UI.expArm=!UI.expArm;toast(UI.expArm?'下一道命令將以八百里加急送出。':'已取消八百里加急。');var e=UI.bar&&UI.bar.querySelector('[data-k="exp"]');if(e){e.textContent=expBtnTxt(me);e.classList.toggle('pri',UI.expArm);}};
/* 玩家下命令：八百里加急只用在下一道命令 */
(function(){var b=issue;issue=function(u,k,p){if(UI.expArm&&u&&!SD(u.side).ai&&expOn(u.side)){p=p||{};p.exp=1;UI.expArm=false;}return b(u,k,p);};})();
setSec('cmd','exp',{t:'八百里加急',o:32,h:function(){var S=G.set;return setOpt(setRow('八百里加急',setChk('setb','exp',S.exp!==false,'1870 年以前可以把命令交給驛馬快遞，直送受令部隊'))+setRow('驛馬備妥','<span><input type="number" min="10" max="1440" value="'+Math.round(expCd()/60)+'" data-c="setexpcd" style="width:80px"> 分鐘</span>'));}});
CHG.setexpcd=function(t){var v=+t.value;G.set.expCd=v>0?clamp(v,10,1440):90;};
setSec('combat','dfirst',{t:'優先展開隊形',o:29,h:function(){return setOpt(setRow('優先展開隊形',setChk('setb','deployFirst',G.set.deployFirst!==false,'1870 年以前的部隊依敵軍速度提早停下展開，進攻時等友軍展開完畢再一齊推進')));}});
HELP14.push('<h4>火槍與冷兵器時代：八百里加急與優先展開隊形</h4><ul><li><b>八百里加急</b>：電報普及以前（1870 年前），作戰頁頂列的「⚡ 八百里加急」可以把下一道命令交給驛馬快遞——不經各級司令部轉手、直送受令部隊，沿途換馬疾馳，約為一般傳令的兩倍速度，地圖上的傳令兵標成「急」。每一方兩組快馬，用過後約 90 分鐘才再備妥（可在「設定 → 指揮」調整或關閉）；快馬沒備妥時改以一般傳令送出。AI 在撤退與反擊時會使用。</li>'+
  '<li><b>優先展開隊形</b>：這些時代的部隊在行軍縱隊下幾乎無法作戰，展開成橫隊又很花時間（十七世紀約半小時）。部隊會依敵軍的速度（看到騎兵就提早）與自己展開所需的時間，在安全距離停下展開，展開時不前進；進攻時已展開的部隊等同一編制的友軍也展開完畢，再一齊推進（最多等 30 分鐘），不會零星撞上敵陣。可在「設定 → 戰鬥」關閉。</li></ul>');
