/* ===================== 部隊對話：台詞風格與自訂台詞
   每個情境都可以填自己的台詞（一行一句、可以填很多句）；留白就用預設。自訂的可以「取代預設」或「加在預設之外」。
   存在這台裝置（localStorage），可以匯出成台詞包分享、再匯入。只影響畫面，不會改變戰局。 ===================== */
var VOXU={v:1,k:{}},VOXK='lato-warsim-voxu';
function voxuLoad(){try{var s=localStorage.getItem(VOXK);if(s){var o=JSON.parse(s);if(o&&o.k&&typeof o.k==='object')VOXU={v:1,k:o.k};}}catch(e){}VOX.PC=null;}
function voxuSave(){try{localStorage.setItem(VOXK,JSON.stringify(VOXU));}catch(e){toast('無法儲存自訂台詞（瀏覽器不允許）');}VOX.PC=null;}
/* 一句台詞：去掉頭尾空白；太長的截短；最多 200 句 */
function voxuClean(txt){return String(txt||'').split(/\r?\n/).map(function(s){return s.trim().slice(0,60);}).filter(Boolean).slice(0,200);}
function voxP1(s){var o={t:s,y0:-1e9,y1:1e9,g:null,m:'',e:''},m=/^\[([^\]]*)\]/.exec(s);if(m){o.t=s.slice(m[0].length);m[1].split(/\s+/).forEach(function(q){if(!q)return;var c=q.charAt(0);if(c==='^')o.y0=+q.slice(1)||-1e9;else if(c==='_')o.y1=+q.slice(1)||1e9;else if(c==='@')o.g=q.slice(1).split(',');else if(q==='!'||q==='~')o.m=q;else o.e+=q.replace(/[^ndrsfch]/g,'');});}return o;}
function voxSets(){if(VOX.PS)return VOX.PS;var S={bal:voxParse()};['rough','pro'].forEach(function(n){var P={},D=VOXP[n];for(var k in D)P[k]=D[k].map(voxP1);S[n]=P;});return VOX.PS=S;}
function voxCust(k){if(!VOX.PC){var C={};for(var q in VOXU.k){var R=VOXU.k[q];if(R&&R.L&&R.L.length)C[q]={m:R.m==='add'?'add':'rep',L:R.L.map(voxP1)};}VOX.PC=C;}return VOX.PC[k]||null;}
/* 這個部隊用哪一種說法 */
function voxStyleOf(u){var m=UIP.voxS||'bal';if(m==='bal'||m==='rough'||m==='pro')return m;var h=hstr(u.id+'|s|'+VOX.c)%100;if(m==='mix')return h<34?'bal':h<67?'rough':'pro';
  var t=u.trn||60,g=voxG(u),w=t>=80?[30,10,60]:t>=55?[50,25,25]:[35,55,10];if(u.irr)w=[30,60,10];else if(g==='hq'||g==='air'||g==='sea')w=[w[0],Math.round(w[1]/2),w[2]+Math.round(w[1]/2)];return h<w[0]?'bal':h<w[0]+w[1]?'rough':'pro';}
function voxCand(A,C,x){var L=[];(A||[]).forEach(function(q){if(!voxOk(q,C,x))return;L.push(q);if(q.g||q.e||q.m)L.push(q,q);});return L;}
voxPick=function(u,k,x){var S=voxSets(),C=voxCtx(u),cu=voxCust(k),st=voxStyleOf(u),base=S[st]&&S[st][k]&&S[st][k].length?S[st][k]:S.bal[k],L;
  /* 取代預設：只說自訂的（沒有合適的才用預設）；加在預設之外：自訂的合計約占三分之一 */
  if(cu&&cu.m==='rep'){L=voxCand(cu.L,C,x);if(!L.length)L=voxCand(base,C,x);}else{L=voxCand(base,C,x);if(cu){var Lc=voxCand(cu.L,C,x),w=Lc.length?Math.max(1,Math.round(L.length/(2*Lc.length))):0;for(var i=0;i<w;i++)L=L.concat(Lc);}}
  if(!L.length&&base!==S.bal[k])L=voxCand(S.bal[k],C,x);if(!L.length)return null;
  var i0=hstr(u.id+'|'+k+'|'+(++VOX.c))%L.length,q=null;for(var j=0;j<L.length;j++){var c=L[(i0+j)%L.length];if(VOX.rec.indexOf(c.t)<0){q=c;break;}}q=q||L[i0];VOX.rec.push(q.t);if(VOX.rec.length>40)VOX.rec.shift();
  return q.t.replace('{dir}',x&&x.dir||'').replace('{km}',x&&x.km||'').replace('{role}',voxRole(u,C));};
voxuLoad();
/* ---------- 編輯台詞 ---------- */
(function(){var st=document.createElement('style');st.textContent='.lw-vxed{max-height:min(68vh,640px);overflow:auto;padding-right:4px}.lw-vxed details.lw-vxc{margin:4px 0;border:1px solid #d5dde5;border-radius:6px;padding:2px 8px}.lw-vxed details.lw-vxc>summary{cursor:pointer;font-weight:700;padding:4px 0}'+
  '.lw-vxk{border-top:1px solid #edf1f4;padding:6px 0}.lw-vxk:first-of-type{border-top:0}.lw-vxh{display:flex;flex-wrap:wrap;gap:2px 8px;align-items:baseline}.lw-vxh .lw-note{margin:0}.lw-vxn{margin-left:auto;font-size:11px;color:#1565C0}'+
  '.lw-vxk textarea{width:100%;box-sizing:border-box;min-height:44px;font-size:13px;margin-top:3px;resize:vertical}.lw-vxo{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:center;font-size:12px;margin-top:2px}.lw-vxo details{flex-basis:100%}.lw-vxo ul{margin:2px 0 4px 18px;padding:0;font-size:12px;color:#455a64}'+
  '.lw-vxtry{color:#2e7d32;font-size:12px}.lw-vxbar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:4px 0 8px}.lw-vxbar input[type=search]{flex:1;min-width:140px}';document.head.appendChild(st);})();
var VXE={q:''};
function voxDefs(k){var S=voxSets(),o={};['bal','rough','pro'].forEach(function(n){o[n]=(S[n][k]||[]).map(function(q){return q.t;});});return o;}
function voxKeyHtml(k){var N=VOXN[k]||[k,''],R=VOXU.k[k]||{},L=R.L||[],D=voxDefs(k),ph=D.bal.slice(0,2).join('\n');
  return '<div class="lw-vxk" data-k="'+k+'"><div class="lw-vxh"><b>'+esc(N[0])+'</b><span class="lw-note">'+esc(N[1])+'</span><span class="lw-vxn">'+(L.length?'自訂 '+L.length+' 句':'用預設')+'</span></div>'+
   '<textarea data-c="voxu" data-v="'+k+'" rows="'+Math.min(6,Math.max(2,L.length+1))+'" placeholder="'+esc('一行一句，留白就用預設。例如：\n'+ph)+'">'+esc(L.join('\n'))+'</textarea>'+
   '<div class="lw-vxo"><label><input type="radio" name="vxm-'+k+'" data-c="voxum" data-v="'+k+'" value="rep"'+(R.m!=='add'?' checked':'')+'>取代預設</label><label><input type="radio" name="vxm-'+k+'" data-c="voxum" data-v="'+k+'" value="add"'+(R.m==='add'?' checked':'')+'>加在預設之外</label>'+
   '<button type="button" class="lw-btn sm" data-a="voxtry" data-v="'+k+'">試說一句</button><span class="lw-vxtry" data-k="vxtry-'+k+'"></span>'+
   '<details><summary>預設台詞（'+Object.keys(D).map(function(n){return (VOXST[n]?VOXST[n][0]:n)+' '+D[n].length;}).join('、')+' 句）</summary>'+Object.keys(D).map(function(n){return '<div><b>'+VOXST[n][0]+'</b><ul>'+D[n].map(function(t){return '<li>'+esc(t)+'</li>';}).join('')+'</ul></div>';}).join('')+'</details></div></div>';}
function voxEdBody(){var q=VXE.q.trim();return VOXCAT.map(function(c,i){var ks=c[1].filter(function(k){if(!q)return true;var N=VOXN[k]||[k,''];return (N[0]+N[1]+k).indexOf(q)>=0||(VOXU.k[k]&&VOXU.k[k].L||[]).join('').indexOf(q)>=0;});if(!ks.length)return '';
  var n=ks.filter(function(k){return VOXU.k[k]&&VOXU.k[k].L&&VOXU.k[k].L.length;}).length;return '<details class="lw-vxc"'+(q||i===0?' open':'')+'><summary>'+esc(c[0])+'（'+ks.length+' 種情境'+(n?'，自訂 '+n+' 種':'')+'）</summary>'+ks.map(voxKeyHtml).join('')+'</details>';}).join('')||'<div class="lw-note">沒有符合的情境。</div>';}
function voxEdDlg(){document.querySelectorAll('.lw-dlg.lw-vxdlg').forEach(function(d){d.remove();});var tot=0;for(var k in VOXU.k)tot+=(VOXU.k[k].L||[]).length;
  var d=dlg('<h3 style="margin:0 0 6px">編輯部隊台詞</h3><div class="lw-note">每個情境都可以填自己的台詞，一行一句、可以填很多句；留白就用預設。選「取代預設」只說你的台詞，「加在預設之外」會跟預設混著說。'+
   '句子前可以加標記限定條件：<code>[^1940]</code> 1940 年起、<code>[_1918]</code> 1918 年以前、<code>[@arm]</code> 只有裝甲（inf 步兵、arm 裝甲、at 反裝甲、art 砲兵、ad 防空、cav 騎兵、eng 工兵、med 醫護、hq 指揮、sup 後勤、air 飛行員、sea 艦艇）、'+
   '<code>[n]</code> 夜間、<code>[d]</code> 白天、<code>[r]</code> 下雨、<code>[s]</code> 下雪、<code>[f]</code> 起霧、<code>[c]</code> 寒冷、<code>[h]</code> 炎熱、<code>[!]</code> 只在動搖時、<code>[~]</code> 只在鎮定時，可以合併如 <code>[n @inf]</code>；'+
   '句中可以用 <code>{dir}</code> 方向、<code>{km}</code> 距離（有提供時）、<code>{role}</code> 依兵種的職務。泡泡裡超過 20 個字會被截短。存在這台裝置，只影響畫面。</div>'+
   '<div class="lw-vxbar"><span>台詞風格</span>'+setSel('voxs','',Object.keys(VOXST).map(function(k){return [k,VOXST[k][0]];}),UIP.voxS||'bal',VOXST[UIP.voxS||'bal'][1])+'<input type="search" data-i="voxq" placeholder="搜尋情境或台詞" value="'+esc(VXE.q)+'">'+
   '<button type="button" class="lw-btn sm" data-a="voxexp">匯出台詞包</button><label class="lw-btn sm" style="cursor:pointer">匯入台詞包<input type="file" accept=".json,application/json" data-c="voximp" style="display:none"></label><button type="button" class="lw-btn sm" data-a="voxclr"'+(tot?'':' disabled')+'>全部清除</button><button type="button" class="lw-btn sm" data-a="x">關閉</button></div>'+
   '<div class="lw-note" data-k="vxsum">目前自訂 '+tot+' 句。</div><div class="lw-vxed" data-k="vxbody">'+voxEdBody()+'</div>',true);d.classList.add('lw-vxdlg');return d;}
function voxEdSum(){var tot=0,n=0;for(var k in VOXU.k){var L=VOXU.k[k].L||[];tot+=L.length;if(L.length)n++;}var el=document.querySelector('.lw-vxdlg [data-k="vxsum"]');if(el)el.textContent='目前自訂 '+n+' 種情境、'+tot+' 句。';var b=document.querySelector('.lw-vxdlg [data-a="voxclr"]');if(b)b.disabled=!tot;}
CHG.voxu=function(t){var k=t.getAttribute('data-v'),L=voxuClean(t.value),R=VOXU.k[k]||{m:'rep'};if(L.length){R.L=L;VOXU.k[k]=R;}else if(R.m==='add')VOXU.k[k]={m:'add',L:[]};else delete VOXU.k[k];voxuSave();
  var row=t.closest('.lw-vxk'),n=row&&row.querySelector('.lw-vxn');if(n)n.textContent=L.length?'自訂 '+L.length+' 句':'用預設';voxEdSum();};
CHG.voxum=function(t){var k=t.getAttribute('data-v'),R=VOXU.k[k]||(VOXU.k[k]={L:[]});R.m=t.value==='add'?'add':'rep';voxuSave();};
CHG.voxs=function(t){UIP.voxS=t.value;uipSave();VOX.rec=[];var s=t.closest('.lw-vxbar');if(s)t.title=VOXST[t.value][1];};
INP.voxq=function(t){VXE.q=t.value||'';var b=document.querySelector('.lw-vxdlg [data-k="vxbody"]');if(b)b.innerHTML=voxEdBody();};
CHG.voximp=function(t){var f=t.files&&t.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var o=JSON.parse(r.result),K=o&&(o.k||o.lines);if(!K||typeof K!=='object')throw new Error('不是台詞包');var n=0;
   for(var k in K){if(!VOXN[k])continue;var R=K[k],L=voxuClean(Array.isArray(R)?R.join('\n'):(R.L||[]).join('\n'));if(!L.length)continue;VOXU.k[k]={m:R.m==='add'?'add':'rep',L:L};n++;}
   if(o.style&&VOXST[o.style]){UIP.voxS=o.style;uipSave();}voxuSave();voxEdDlg();toast('已匯入 '+n+' 種情境的台詞');}catch(e){toast('無法匯入：'+e.message);}};r.readAsText(f);t.value='';};
ACT.voxed=function(){voxEdDlg();};
ACT.voxexp=function(){var o={type:'lato-warsim-vox',v:1,style:UIP.voxS||'bal',k:VOXU.k};download('部隊台詞包.json',JSON.stringify(o,null,1),'application/json');};
ACT.voxclr=function(){if(!confirm('清除全部自訂台詞？所有情境都會改回預設。'))return;VOXU.k={};voxuSave();voxEdDlg();};
/* 試說一句：作戰中由選取的（或畫面上第一個）本方部隊說；還沒開打時直接顯示一句 */
ACT.voxtry=function(t){var k=t.getAttribute('data-v'),me=typeof mySide==='function'?mySide():UI.side,u=null,x={dir:'東北',km:'38'};
  if(G&&G.started&&G.units){u=(UI.sel||[]).map(uById).filter(function(q){return q&&isLeaf(q)&&onMap(q)&&voxMine(q,me);})[0]||G.units.filter(function(q){return isLeaf(q)&&onMap(q)&&voxMine(q,me)&&ST(q).dom==='land';})[0]||null;}
  var txt=null;if(u){txt=voxSay(u,k,1,x,true)||voxPick(u,k,x);}else{var cu=voxCust(k),S=voxSets(),st=UIP.voxS==='rough'||UIP.voxS==='pro'?UIP.voxS:'bal',A=cu&&cu.m==='rep'?cu.L:(cu?cu.L:[]).concat(S[st][k]||S.bal[k]||[]);
    if(A.length){var q=A[Math.floor(Math.random()*A.length)];txt=q.t.replace('{dir}',x.dir).replace('{km}',x.km).replace('{role}','老兵');}}
  var el=document.querySelector('.lw-vxdlg [data-k="vxtry-'+k+'"]');if(el)el.textContent=txt?'「'+txt+'」':'（這個情境在目前的年代或兵種沒有合適的台詞）';};
/* 設定：部隊對話一節加上台詞風格與編輯按鈕 */
(function(){var q=setSecQ('vox');if(!q)return;var h0=q.h;q.h=function(){var n=0;for(var k in VOXU.k)if((VOXU.k[k].L||[]).length)n++;return h0()+setOpt(setRow('台詞風格',setSel('voxs','',Object.keys(VOXST).map(function(k){return [k,VOXST[k][0]];}),UIP.voxS||'bal',Object.keys(VOXST).map(function(k){return VOXST[k][0]+'：'+VOXST[k][1];}).join('；')))+
  setRow('自訂台詞','<button type="button" class="lw-btn sm" data-a="voxed">編輯台詞…</button><span class="lw-note" style="margin-left:6px">'+(n?'已自訂 '+n+' 種情境':'全部用預設')+'</span>'));};})();
if(typeof HELP14!=='undefined')HELP14.push('<h4>台詞風格與自訂台詞</h4><ul>'+
  '<li>設定的「部隊對話」可以選台詞風格：<b>平衡</b>（預設）、<b>接地氣</b>（粗話、抱怨與閒聊，髒字用＊或諧音淡化，例如「尼*的，天氣真糟」）、<b>軍事專業</b>（術語、口令與簡報式回報）、<b>依部隊素質</b>（訓練好的說話專業，新兵與民兵說話粗）或<b>三種混合</b>。</li>'+
  '<li>按「編輯台詞…」依類別列出全部情境，每種都可以填自己的台詞，一行一句、可以填很多句；留白就用預設。可以選「取代預設」或「加在預設之外」，按「試說一句」馬上看效果。</li>'+
  '<li>台詞可以加標記限定年代、兵種、晝夜、天候與士氣，例如 <code>[^1940 @arm]</code>；也可以用 {dir}、{km}、{role}。自訂台詞存在這台裝置，可以匯出成台詞包分享給別人匯入。</li></ul>');
