/* ===================== 部隊點數（花費）：單位明細、點數視窗、設定 ===================== */
/* 部隊點數（不在地圖上的單位也照算） */
function fpShow(u){if(!u||u.st==='dead')return 0;if(!fpcOn())return fpPowShow(u);var o=fpcZero();if(isLeaf(u))fpcAdd(o,fpcLeaf(u));else{var h=fpcHq(u);if(h)fpcAdd(o,h);leavesOf(u).forEach(function(q){if(q.st!=='dead')fpcAdd(o,fpcLeaf(q));});}return fpcPts(o.t);}
function fpcShowOf(u){var o=fpcZero(),B={eq:0,veh:0,men:0},D={pay:0,food:0,fuel:0,mnt:0},S={ammo:0,fuel:0,food:0},add=function(r){fpcAdd(o,r);for(var k in B)B[k]+=r.buy[k]||0;for(var k2 in D)D[k2]+=r.day[k2]||0;for(var k3 in S)S[k3]+=r.stock[k3]||0;};
  if(isLeaf(u))add(fpcLeaf(u));else{var h=fpcHq(u);if(h)add(h);leavesOf(u).forEach(function(q){if(q.st!=='dead')add(fpcLeaf(q));});}o.B=B;o.D=D;o.S=S;return o;}
function fpcUsdTxt(v){return typeof amoney==='function'?amoney(v):usdTxt(v);}
function fpcSecHtml(u){if(!fpcOn()||!u||u.st==='dead')return '';var o=fpcShowOf(u),P=function(v){return fmt(fpcPts(v));},m=fpcUsdTxt;
  return '<h4 style="margin:10px 0 4px;font-size:13px">部隊點數（花費）</h4><div class="lw-kv lw-fpc">'+
    kv('部隊點數','<b>'+fmt(fpcPts(o.t))+'</b> 點（'+m(o.t)+'；每點 '+m(fpcUsd())+'）')+
    kv('購置',P(o.buy)+' 點：武器與裝具 '+m(o.B.eq)+'、載具 '+m(o.B.veh)+'、人員徵募與訓練 '+m(o.B.men))+
    kv('維持費',P(o.keep)+' 點（'+o.days+' 天）：每日 '+m(o.D.pay+o.D.food+o.D.fuel+o.D.mnt)+'＝薪餉 '+m(o.D.pay)+'、糧秣草料 '+m(o.D.food)+'、平時用油 '+m(o.D.fuel)+'、維修保養 '+m(o.D.mnt))+
    kv('後勤累積',P(o.stock)+' 點：彈藥 '+m(o.S.ammo)+'、燃料 '+m(o.S.fuel)+'、糧秣草料 '+m(o.S.food))+'</div>';}
/* 點數視窗：各方的部隊點數、明細與戰力 */
function fpcDlgHtml(me){var see=function(s){return me===null||s===me||seeAll();},m=fpcUsdTxt,P=function(v){return fmt(fpcPts(v));};
  var o='<div class="lw-kv">'+SIDES().map(function(s){return kv(esc(ptsSideTxt(s))+'部隊點數',see(s)?fmt(fpSide(s))+' 點':'約 '+fmt(fpEst(me))+' 點（依目前的情報估計）')+kv(esc(ptsSideTxt(s))+'戰力',see(s)?fmt(fpPowSide(s))+' 點':'約 '+fmt(fpPowEst(me))+' 點（估計）');}).join('')+'</div>';
  var vis=SIDES().filter(see);if(!vis.length)return o;
  o+='<table class="lw-tbl" style="margin-top:6px"><tr><th>花費</th>'+vis.map(function(s){return '<th class="n">'+esc(ptsSideTxt(s))+'</th>';}).join('')+'</tr>';var C=vis.map(fpcSide);
  [['buy','購置（裝備、載具、人員訓練）'],['keep','維持費（'+fpcDays()+' 天）'],['stock','後勤累積（含補給站 '+C.map(function(c){return m(c.dep);}).join('／')+'）'],['t','合計']].forEach(function(r){o+='<tr><td>'+(r[0]==='t'?'<b>'+r[1]+'</b>':r[1])+'</td>'+C.map(function(c){return '<td class="n">'+P(c[r[0]])+' 點<br><span class="lw-note">'+m(c[r[0]])+'</span></td>';}).join('')+'</tr>';});
  return o+'</table><div class="lw-note">部隊點數＝購置＋維持費＋後勤累積，以 2020 年美元計，每點 '+m(fpcUsd())+'；可在「設定 → 點數」調整。戰力依火力、防護、訓練與兵力，用來比較雙方戰力。</div>';}
/* 設定 */
function fpcSetRows(S){return setRow('部隊點數',setSel('setfpc','fpm',[['cost','依花費（購置、維持費、後勤累積）'],['pow','依戰力（火力、防護、訓練、兵力）']],S.fpm==='pow'?'pow':'cost'))+
  setRow('每點','<span><input type="number" min="1000" max="100000000" step="10000" value="'+fpcUsd()+'" data-c="setfpc" data-f="fpUsd" style="width:110px"> 美元（2020 年幣值）</span>')+
  setRow('維持天數','<span><input type="number" min="0" max="3650" value="'+fpcDays()+'" data-c="setfpc" data-f="fpDays" style="width:80px"> 天的維持費計入部隊點數</span>');}
CHG.setfpc=function(t){var f=t.getAttribute('data-f');if(f==='fpm')G.set.fpm=t.value==='pow'?'pow':'cost';else{var v=+t.value;if(f==='fpUsd')G.set.fpUsd=v>0?v:100000;else G.set.fpDays=isFinite(v)?clamp(v,0,3650):30;}FPCT={};if(typeof hudTick==='function')hudTick(true);};
