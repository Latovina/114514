
/* ===================== 多發命中 ===================== */
var MH={p:'r762m80',R:25,src:'body',n:6,sp:6,w:25,h:30,tr:300};
RENDER.multi={init:function(){var E=pane('multi');E.innerHTML='<div class="lt-info">在同一塊板上連續射擊，每發依先前彈著點附近的損傷（陶瓷裂錐、鋼板硬化區、纖維鬆脫、魔能護盾耗損與再生）降低該處防護，以蒙地卡羅法重複數百次，求每一發的貫穿機率。</div>'+
  '<div class="row"><label>彈藥 <select data-k="mP">'+projOpts(MH.p,function(p){return p.k!=='he'&&p.k!=='hesh';})+'</select></label><label>距離 <input type="number" data-k="mR" value="'+MH.R+'" min="0" step="10"> m</label>'+
  '<label>裝甲來源 <select data-k="mS">'+opts([['body','防彈衣分頁的插板'],['pen','穿甲模擬分頁的裝甲']],MH.src)+'</select></label></div>'+
  '<div class="row"><label>發數 <input type="number" data-k="mN" value="'+MH.n+'" min="1" max="20" style="width:52px"></label><label>散布（標準差）<input type="number" data-k="mSp" value="'+MH.sp+'" min="0.5" step="0.5" style="width:56px"> cm</label>'+
  '<label>板寬 <input type="number" data-k="mW" value="'+MH.w+'" style="width:52px"> cm</label><label>板高 <input type="number" data-k="mH" value="'+MH.h+'" style="width:52px"> cm</label><label>重複 <input type="number" data-k="mT" value="'+MH.tr+'" min="50" max="2000" step="50" style="width:64px"> 次</label><button type="button" data-k="mGo" class="lt-pri">模擬</button></div>'+
  '<canvas class="lt-chart" data-k="mCv" style="height:200px"></canvas><div data-k="mOut"></div>';
  q('mGo').onclick=function(){MH.p=q('mP').value;MH.R=+q('mR').value||0;MH.src=q('mS').value;MH.n=clamp(+q('mN').value||6,1,20);MH.sp=+q('mSp').value||6;MH.w=+q('mW').value||25;MH.h=+q('mH').value||30;MH.tr=clamp(+q('mT').value||300,50,2000);RENDER.multi.run();};},
 run:function(){var p=P(MH.p),v=A.velAt(p,MH.R,env()),L=MH.src==='body'?BODY.L:PEN.L,r=A.multiHit(p,L,{n:MH.n,w:MH.w,h:MH.h,spread:MH.sp,trials:MH.tr,v:v,lib:S.mats,charge:S.set.charge/100,seed:p.id+MH.n});
  bars(q('mCv'),r.perShot,r.perShot.map(function(x,i){return '第'+(i+1)+'發';}),{h:200});
  var first=-1;r.perShot.forEach(function(x,i){if(first<0&&x>0.5)first=i;});
  q('mOut').innerHTML='<div class="lt-kv"><b>撞擊速度</b><span>'+fx(v,0)+' m/s</span><b>平均貫穿發數</b><span>'+fx(r.mean,2)+' / '+MH.n+'</span><b>防護失效</b><span>'+(first<0?'全部 '+MH.n+' 發的貫穿機率都低於 50%':'從第 '+(first+1)+' 發起貫穿機率超過 50%')+'</span><b>裝甲</b><span>'+esc(L.map(function(l){return M(l.mat).n+' '+l.t+' mm';}).join('＋'))+'</span></div>';}};
