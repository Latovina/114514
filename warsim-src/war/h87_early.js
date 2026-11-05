/* ===================== 火槍與冷兵器時代：八百里加急、優先展開隊形 =====================
   一、八百里加急（可選用，有冷卻時間）：電報普及以前（1870 年前），命令可以交給驛馬快遞——不經各級司令部轉手，直接送到受令部隊，
       沿途換馬疾馳，速度約一般傳令的兩倍，找人的時間也短。每一方同時只有兩組快馬，用過後要等驛馬回復（預設 90 分鐘）。
       AI 在撤退與反擊等緊急命令上會使用。
   二、優先展開隊形：火槍與冷兵器時代的部隊在行軍縱隊下幾乎無法作戰，展開成橫隊要花很久（十七世紀約半小時）。
       部隊依敵軍的速度（騎兵來得快）與自己展開所需的時間，提早在安全距離停下展開；進攻時已展開的部隊等同一編制的友軍也展開完畢，
       再一齊推進（最多等 30 分鐘），不會一個一個零星撞上敵陣。 ===================== */
var EXPN=2;
function expEra(side){var y=G.set.y||1943;return y<1870;}
function expOn(side){return !!G&&G.set.exp!==false&&expEra(side);}
function expCd(){var v=+G.set.expCd;return v>0?v*60:5400;}
function expS(side){var S=SD(side);if(!S.expR||S.expR.length!==EXPN)S.expR=[];while(S.expR.length<EXPN)S.expR.push(0);return S.expR;}
function expReady(side){if(!expOn(side))return -1;var R=expS(side);for(var i=0;i<R.length;i++)if(G.t>=R[i])return i;return -1;}
function expNext(side){var R=expS(side);return Math.min.apply(null,R);}
function expLeft(side){if(!expOn(side))return 0;return expS(side).filter(function(t){return G.t>=t;}).length;}
VIA.express='八百里加急';CRK.express=['八百里加急（驛馬快遞）','急'];
/* 命令以八百里加急送出：直送受令部隊，不經各級轉手 */
(function(){var b=sendOrder;sendOrder=function(from,to,o,viaChain){if(!o||!o.exp)return b.apply(this,arguments);var side=to.side,i=expReady(side);
  if(i<0){delete o.exp;logE(side,'cmd','八百里加急的驛馬尚未備妥（約 '+durTxt(Math.max(0,expNext(side)-G.t))+' 後），改以一般傳令送出');return b.apply(this,arguments);}
  var m=b(from,to,o,false);if(!m||m.k!=='order')return m;var src=uById(m.from)||from||to;if(src.id===to.id)return m;var E=commEra(src,to),M=G.set.delayMul===undefined?1:G.set.delayMul,km=dist(src.x,src.y,to.x,to.y)/1000,sec=(120+km/((E.cour||12)*1.9)*3600)*M;
  m.ta=G.t+sec;m.via=['express'];m.exp=1;o.eta=m.ta;if(m.lg)m.lg.forEach(function(l){l.t1=l.t0+sec;l.f=Math.min(l.f,60);l.k='express';l.r=1;});else m.lg=[crLeg(src,to,G.t,sec,E,{rider:1},'express')];
  expS(side)[i]=G.t+expCd();logE(side,'cmd','以八百里加急將「'+ordN(o)+'」直送'+uName(to)+'，約 '+durTxt(sec)+'送達（驛馬 '+durTxt(expCd())+'後再備妥）',src.x,src.y,to.id);return m;};})();
/* AI：撤退與反擊用八百里加急 */
(function(){var b=issue;issue=function(u,k,p){p=p||{};if(u&&SD(u.side).ai&&expReady(u.side)>=0&&!p.exp&&(k==='withdraw'||p.dk==='counter'||k==='counter'))p.exp=1;return b(u,k,p);};})();
/* ---------- 優先展開隊形 ---------- */
function dfOn(u){if(!G||G.set.deployFirst===false)return false;var s=ST(u);if(s.dom!=='land'||u.irr)return false;var E=uEra(u);if(!(E.fan||E.y<1870))return false;var r=roleOf(u);return r==='man'||r==='fire'||r==='rec';}
/* 展開所需時間（秒） */
function dfTime(u){var E=uEra(u);return E.deploy*60*(1.3-0.006*(u.trn||60))*(ST(u).fl.indexOf('g')>=0?1.5:1);}
/* 敵軍逼近的速度（公尺／秒）：看得到騎兵就以騎兵計 */
function dfEnemyV(u){var C=G.ct[u.side]||{},v=4/3.6;for(var id in C){var c=C[id];if(c.dead||G.t-c.t>1800||c.dom!=='land')continue;if(dist(c.x,c.y,u.x,u.y)>8000)continue;if(c.br==='cav'||c.br==='drg'||c.br==='mon')v=Math.max(v,11/3.6);}return v;}
/* 應該開始展開的距離 */
function dfDist(u){var s=ST(u);return clamp(rangeOf(s)*1.5+dfEnemyV(u)*dfTime(u)*0.6+300,900,4500);}
(function(){var b=marchSafe;marchSafe=function(u){var d=b(u);if(!dfOn(u))return d;return Math.max(d,dfDist(u));};})();
/* 進攻：已展開的部隊等友軍展開完畢，一齊推進 */
function dfWait(u){var o=u.ord;if(!o||o.k!=='attack'||o.dfGo||u.form!=='deployed'||u.formTo||!u.p||u.p<0)return false;var ed=u._ed===undefined?1e9:u._ed;if(ed>dfDist(u)*1.2||ed<rangeOf(ST(u))*1.6){return false;}
  if(!o.dfT0)o.dfT0=G.t;if(G.t-o.dfT0>1800){o.dfGo=1;return false;}var P=uById(u.p);if(!P)return false;var L=kidsOf(P).filter(function(q){return q!==u&&alive(q)&&isLeaf(q)&&dfOn(q)&&q.ord&&q.ord.k==='attack'&&dist(q.x,q.y,u.x,u.y)<5000;});
  var late=L.filter(function(q){return q.form!=='deployed'||q.formTo;});if(!late.length){o.dfGo=1;if(!P.dfLog||G.t-P.dfLog>1800){P.dfLog=G.t;logE(u.side,'tac',uName(P)+'全線展開完畢，一齊向敵陣推進',u.x,u.y,P.id);}return false;}
  if(!o.dfLog&&(!P.dfWLog||G.t-P.dfWLog>1800)){o.dfLog=1;P.dfWLog=G.t;logE(u.side,'tac',uName(P)+'的'+uName(u)+'已展開成戰鬥隊形，等待友軍（還有 '+late.length+' 個單位）展開後一齊推進',u.x,u.y,u.id);}return true;}
(function(){var b=leafStep;leafStep=function(u){if(dfOn(u)&&dfWait(u)){formStep(u);return;}
  /* 行軍縱隊遇到逼近的敵軍：先停下展開，不再前進 */
  if(dfOn(u)&&u.form==='march'&&!u.formTo&&u.task==='go'&&(u._ed===undefined?1e9:u._ed)<dfDist(u)&&!(u.ord&&u.ord.k==='withdraw')){setForm(u,'deployed');if(!u.dfLogT||G.t-u.dfLogT>3600){u.dfLogT=G.t;logE(u.side,'tac',uName(u)+'發現敵軍逼近，停止前進、優先展開隊形（約 '+durTxt(dfTime(u))+'）',u.x,u.y,u.id);}}
  return b(u);};})();
