/* ===================== 授權命令與戰場裁量權（介面）：授權表（五種行動 × 四個層級）、預設組合、統計、入口、收件匣的駁回、說明、對話 ===================== */
(function(){var st=document.createElement('style');st.textContent='.lw-auth table{border-collapse:collapse;width:100%;font-size:12px}.lw-auth th,.lw-auth td{border:1px solid rgba(0,0,0,.14);padding:4px 5px;text-align:left;vertical-align:top}.lw-auth th small,.lw-auth td small{display:block;color:#666;font-weight:normal}'+
  '.lw-auth select{width:100%;font-size:12px}.lw-auth select.own{background:#E8F5E9}.lw-auth select.ask{background:#FFF8E1}.lw-auth select.no{background:#FFEBEE}.lw-auth .lw-row{flex-wrap:wrap;gap:4px}';document.head.appendChild(st);})();
var AUTHU={side:0};
function authHtml(side){var S=G.sides[side],god=mySide()===null,o='<h3 style="margin:0 0 6px">🎖 授權與裁量'+(S?'：'+esc(S.name):'')+'</h3>';
  if(god)o+='<div class="lw-row">'+SIDES().map(function(s){return '<button type="button" class="lw-btn sm'+(s===side?' pri':'')+'" data-a="authside" data-v="'+s+'">'+esc(G.sides[s].name)+'</button>';}).join('')+'</div>';
  o+='<div class="lw-note">下級遇到機會或危險時要不要先請示。<b>自行判斷</b>：當場行動、保持主動，但只看得到自己附近，可能追進圈套；<b>須請示</b>：請求沿指揮鏈送到能作主的上級，准許的回覆送回來才行動，機會可能已經過去；<b>不得自行</b>：只照命令行動。玩家指揮的上級會在收件匣收到請求。</div>';
  o+='<div class="lw-row">'+Object.keys(AUTHP).map(function(p){return '<button type="button" class="lw-btn sm" data-a="authp" data-v="'+p+'" title="'+esc(AUTHP[p][1])+'">'+esc(AUTHP[p][0])+'</button>';}).join('')+'</div>';
  o+='<table><tr><th>行動</th>'+AUTHL.map(function(l){return '<th>'+esc(l[0])+'<small>'+esc(l[1])+'</small></th>';}).join('')+'</tr>'+AUTHK.map(function(q){return '<tr><td><b>'+esc(q[1])+'</b><small>'+esc(q[2])+'</small></td>'+[0,1,2,3].map(function(l){var v=authGet(side,q[0],l,null),ex=!!authExp(side,q[0],l);
      return '<td><select class="'+v+'" data-c="authc" data-s="'+side+'" data-k="'+q[0]+'" data-l="'+l+'">'+AUTHV.map(function(a){return '<option value="'+a[0]+'"'+(a[0]===v?' selected':'')+'>'+a[1]+(ex||a[0]!==v?'':'（預設）')+'</option>';}).join('')+'</select></td>';}).join('')+'</tr>';}).join('')+'</table>';
  var T=(G.authS||{})[side];if(T&&G.started)o+='<div class="lw-note">本場：自行判斷 '+fmt(T.own||0)+' 次；請示 '+fmt(T.ask||0)+' 次（准許後行動 '+fmt(T.ok||0)+'、駁回 '+fmt(T.deny||0)+'、錯失先機 '+fmt(T.miss||0)+'）。</div>';
  return o+'<div class="lw-row" style="margin-top:8px"><button type="button" class="lw-btn sm" data-a="x">關閉</button></div>';}
function authDlg(side){document.querySelectorAll('.lw-dlg.lw-authdlg').forEach(function(d){d.remove();});if(!(side>=0))side=mySide()!==null?mySide():AUTHU.side||0;AUTHU.side=side;var d=dlg('<div class="lw-auth" data-k="authbody">'+authHtml(side)+'</div>',true);d.classList.add('lw-authdlg');return d;}
function authRefresh(){var b=document.querySelector('.lw-authdlg [data-k="authbody"]');if(b)b.innerHTML=authHtml(AUTHU.side);}
ACT.authdlg=function(b){var v=b&&b.getAttribute?b.getAttribute('data-v'):null;authDlg(v!==null&&v!==''?+v:undefined);};
ACT.authside=function(b){AUTHU.side=+b.getAttribute('data-v');authRefresh();};
var authLocal=function(side,k,l,v){var S=SD(side),A=S.auth||(S.auth={});(A[k]||(A[k]=[]))[l]=v;};
CHG.authc=function(t){var side=+t.getAttribute('data-s'),k=t.getAttribute('data-k'),l=+t.getAttribute('data-l');if(typeof mpActive==='function'&&mpActive())authLocal(side,k,l,t.value);var r=authSet(side,k,l,t.value,'玩家');if(r&&r.err)toast(r.err);authRefresh();};
ACT.authp=function(b){var side=AUTHU.side,p=b.getAttribute('data-v');if(typeof mpActive==='function'&&mpActive()){var S=SD(side);S.auth={};}var r=authPreset(side,p,'玩家');if(r&&r.err)toast(r.err);else toast('已改為「'+AUTHP[p][0]+'」');authRefresh();};
if(typeof mpWrapFn==='function'){authSet=mpWrapFn('authSet',authSet);authPreset=mpWrapFn('authPreset',authPreset);}
/* ---------- 入口 ---------- */
(function(){var b=PAGES.battle;PAGES.battle=function(host){b(host);if(!G)return;var ph=host.querySelector('.lw-left .lw-ph');if(!ph||ph.querySelector('[data-a="authdlg"]'))return;var bt=document.createElement('button');bt.type='button';bt.className='lw-btn sm';bt.setAttribute('data-a','authdlg');
  bt.title='授權與裁量：各層級的出擊、追擊、迂迴、後撤、填補防線要不要先請示';bt.textContent='🎖 授權';ph.appendChild(bt);};})();
(function(){var b=sideV4Html;sideV4Html=function(side){var o=b(side),n=0;AUTHK.forEach(function(q){[0,1,2,3].forEach(function(l){if(authExp(side,q[0],l))n++;});});var h='<span>授權與裁量</span><span>'+(n?'已設定 '+n+' 格':'沿用預設')+' <button type="button" class="lw-btn sm" data-a="authdlg" data-v="'+side+'">設定…</button></span>';
  var i=o.indexOf('<span>投降</span>');return i>=0?o.slice(0,i)+h+o.slice(i):o+h;};})();
/* ---------- 收件匣：駁回請示時回「不准」 ---------- */
(function(){var b=ACT.ibno;ACT.ibno=function(bt){var m=ibGet(bt);if(m&&!m.done&&m.k==='req'&&AUTHR[m.rk]&&m.rk!=='withdraw'){var to=uById(m.to),from=uById(m.from);if(to&&from)reqReply(to,from,false,'不准');m.done='已駁回';decLog(to?to.side:0,'玩家','駁回'+m.txt);btLeft(true);return;}return b.apply(this,arguments);};})();
if(typeof HELP14!=='undefined')HELP14.push('<h4>授權命令與戰場裁量權</h4><ul>'+
  '<li>作戰畫面左側「🎖 授權」（開戰前在兵力編成的陣營政策）設定下級遇到機會或危險時要不要先請示：五種行動（主動出擊、追擊、迂迴合圍、後撤、填補防線）× 四個層級（連以下、營、團旅、師以上），每格「自行判斷」「須請示」或「不得自行」。也可以一鍵套用任務式指揮、分層授權、集權指揮或寸土不讓。</li>'+
  '<li><b>自行判斷</b>：當場行動，保持主動；但部隊只看得到自己附近，可能追進敵人的圈套。<b>須請示</b>：請求沿指揮鏈送到第一個能作主的上級，上級依更完整的敵情決定（目標後面敵軍太多會駁回），准許的回覆送回來才行動——等太久機會就過去了（錯失先機）。<b>不得自行</b>：只照命令行動，例如不得自行後撤就是死守。</li>'+
  '<li>玩家指揮的上級會在收件匣收到請示，按「同意」或「拒絕」。沒有設定的格子沿用過去的規則：電腦部隊與勾選「下級主動性（玩家）」時自行判斷，後撤一律自行判斷，迂迴合圍不做。面板下方有本場的統計。</li></ul>');
/* ---------- 對話：等上面回覆、錯失先機 ---------- */
VOXN.authw=['等待批准','向上級請示，等回覆'];VOXN.authmiss=['錯失先機','等到批准時機會已經過去'];VOXCAT.push(['授權與裁量',['authw','authmiss']]);
VOXD.authw=['等上面回覆','還沒批下來','再不打就晚了','電話打了沒有？','上面怎麼說？','[!]到底准不准？'];VOXD.authmiss=['等批下來，人都跑了','又慢了一步','早說了要打','機會沒了','下次別等了','[~]算了，守好這裡'];
VOXP.rough.authw=['上面在睡覺喔？','批個東西要等多久啦','再等下去都天黑了','*的，快點啦','又在等','長官到底說好沒'];VOXP.rough.authmiss=['看吧，跑光了','等你批完，人家早溜了','白等一場','這下好了','氣死人','*的，又錯過了'];
VOXP.pro.authw=['已請示，等待批覆','請求已送出','待命，等候授權','保持接觸，等待命令','未獲授權前不得行動','回報敵情，等待指示'];VOXP.pro.authmiss=['授權到達時目標已脫離','錯失攻擊時機','目標已撤離','恢復原任務','回報：機會已失','重新評估態勢'];
VOXP.tw.authw=['頂面猶未應','閣咧等批','閣等落去就慢矣','電話敲矣未？','頂面按怎講？','[!]到底准抑毋准？'];VOXP.tw.authmiss=['等批落來，人攏走矣','閣慢一步','早就講欲拍','機會無去矣','後擺莫閣等','[~]準拄煞，顧遮'];
VOXP.cn.authw=['等上頭回話','還沒批下來','再不打就晚了','電話打了沒？','上頭咋說？','[!]到底批不批啊？'];VOXP.cn.authmiss=['等批下來，人早顛兒了','又慢了一步','早說了要打','機會沒了','下回甭等了','[~]得，守好這兒'];VOX.P=null;VOX.PS=null;
(function(){var b=voxDetect;voxDetect=function(u,P,N,s){var r=b(u,P,N,s);N.authC=u.authC||0;N.authM=u.authM||0;if(r||P.authC===undefined)return r;if(N.authM>P.authM)return ['authmiss',2];if(N.authC>P.authC)return ['authw',1];return null;};})();
