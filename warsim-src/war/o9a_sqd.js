/* ===================== 排與組（介面）：地圖上平滑移動的排與組、狀態面板的戰術、說明 =====================
   放大到一定程度畫出各排；再放大畫出各組（排的小兵牌換成更小的組兵牌）。排與組從目前位置平滑移到戰術位置，看得到交替掩護、衝鋒、後撤。 */
var SQV={};
/* 平滑移動：每一幀往目標靠近一段（距離太遠就直接跳過去，例如剛開始或連被空運） */
function sqSmooth(u,T,W){var V=SQV[u.id],now=performance.now();if(!V||V.n!==T.length){SQV[u.id]={n:T.length,P:T.map(function(q){return [q.x,q.y];}),t:now};return SQV[u.id].P;}
  var dt=Math.min(0.1,(now-V.t)/1000);V.t=now;var k=1-Math.exp(-dt*(UI.run?2.2:6));for(var i=0;i<T.length;i++){var p=V.P[i],q=T[i],d=Math.hypot(q.x-p[0],q.y-p[1]);if(d>W*2.5){p[0]=q.x;p[1]=q.y;continue;}p[0]+=(q.x-p[0])*k;p[1]+=(q.y-p[1])*k;}return V.P;}
(function(){drawPlt=function(c){VW._plt=[];if(!PLTV.on||pltMode()==='off'||UI.lay.plt===0||!G||!G.units||typeof gfxSimple==='function'&&gfxSimple())return;var m=mpp();if(m>12)return;
  var seen={},selOnly=pltMode()==='sel',rotOn=typeof UIP!=='undefined'&&UIP.symRot!==0,live={};(VW.items||[]).forEach(function(it){if(it.u&&!it.agg&&!it.grp)seen[it.u.id]=1;});c.save();
  G.units.forEach(function(u){if(!seen[u.id]||!isLeaf(u)||!pltVisible(u)||u.st==='off'||u.st==='dead'||u.st==='air'||u.st==='base'||u.st==='lift'||!pltOK(u))return;var sel=UI.sel&&UI.sel.indexOf(u.id)>=0;if(selOnly&&!sel)return;
    var W=Math.max(120,frontW(u)*0.8);if(W/m<60)return;var p0=w2s(u.x,u.y);if(p0[0]<-300||p0[1]<-300||p0[0]>VW.cw+300||p0[1]>VW.ch+300)return;live[u.id]=1;
    var col=sideCol(u.side),cc=typeof cmColU==='function'?cmColU(u):undefined,mobOff=typeof UIP!=='undefined'&&UIP.mobOn===0,sq=W/m>=150&&sqOn();
    if(sq){var T=sqPos(u);if(T.length<2)return;var P=sqSmooth(u,T,W);T.forEach(function(q,i){var s=w2s(P[i][0],P[i][1]),S=pltSymOf(q.p),h=clamp(6+3*Math.sqrt(1/q.n),6,9);
        drawSym(c,{x:s[0],y:s[1],h:h,sym:S.sym,ech:0,dom:'land',side:u.side,col:cc,mob:mobOff?'':S.mob,str:q.f<0.99?q.f:undefined,ms:u.ms,sel:sel,cimg:u.cimg||'',rot:rotOn?(u.hd||0):undefined,alpha:0.45+0.55*q.f});
        VW._plt.push({sx:s[0],sy:s[1],r:h*0.8,u:u,p:q.p});});return;}
    var L=pltPos(u);if(L.length<2)return;var P2=sqSmooth(u,L.map(function(o){return {x:o[0],y:o[1]};}),W),tot=sum(L,function(o){return o[2].m0+o[2].v0*8;})||1;
    L.forEach(function(o,i){var p=o[2],q=w2s(P2[i][0],P2[i][1]),sh=(p.m0+p.v0*8)/tot,h=clamp(8+7*Math.sqrt(sh),8,13),f=clamp((p.m+p.v*8)/((p.m0+p.v0*8)||1),0,1),S=pltSymOf(p);
      c.globalAlpha=0.3;c.strokeStyle=cc||col;c.lineWidth=0.6;c.beginPath();c.moveTo(p0[0],p0[1]);c.lineTo(q[0],q[1]);c.stroke();c.globalAlpha=1;
      drawSym(c,{x:q[0],y:q[1],h:h,sym:S.sym,ech:0,dom:'land',side:u.side,col:cc,mob:mobOff?'':S.mob,str:f<0.99?f:undefined,ms:u.ms,sel:sel,cimg:u.cimg||'',rot:rotOn?(u.hd||0):undefined,alpha:0.45+0.55*f});
      VW._plt.push({sx:q[0],sy:q[1],r:h*0.75,u:u,p:p});});});
  c.restore();for(var id in SQV)if(!live[id])delete SQV[id];};})();
/* 狀態面板：排的區塊加上目前的戰術 */
(function(){var b=pltBlock;pltBlock=function(u){var h=b(u);if(!h||!sqOn())return h;var t=sqTac(u);return h+'<div class="lw-note">排與組目前的動作：'+esc(SQTN[t]||t)+'（依命令、訓練、經驗與指揮官的個性；活動範圍約 '+fmt(sqComm(u))+' 公尺內）</div>';};})();
setSec('combat','sqd',{t:'排與組的戰術部署',o:28,h:function(){return setOpt(setRow('排與組',setChk('setb','sqd',G.set.sqd!==false,'依命令、訓練、經驗與指揮官的個性在連的範圍內部署與移動（交替掩護、衝鋒、口袋防禦、伏擊、後撤）；關閉時排只依陣型排列')));}});
HELP14.push('<h4>排與組：在連的指揮下依戰術部署</h4><ul><li>連由排組成，排再分成組（步兵班、火力組、戰車分排）。排與組不能直接下令，也不能從連裡拆出來，但會在連長能聯絡得到的範圍內（1900 年前約 200 公尺、1900～1935 年約 400 公尺、之後約 800 公尺）依戰術移動。放大地圖時畫出各排，再放大畫出各組。</li>'+
  '<li>依兵種部署：戰鬥的排在前，火力、反戰車、防空、砲、指揮、醫療、運輸與工兵在後，偵察最前；空曠地形進攻時戰車在前，城鎮與森林裡步兵在前。</li>'+
  '<li>依命令與部隊素質選擇動作：進攻時，訓練好的部隊交替掩護前進，訓練差、1918 年前或指揮官魯莽時大規模衝鋒，其餘橫隊推進；防禦時訓練好的部隊擺口袋防禦，被包圍時環形防禦；伏擊時沿側翼一線埋伏；撤退時訓練好、士氣還在的交替掩護後撤，士氣崩潰時四散後撤；行軍時縱隊。部隊面板會寫出目前的動作。</li>'+
  '<li>排的位置也決定傷亡落在哪些排：衝在前面、面向敵人的排損失較多。可以在「設定 → 戰鬥」關閉，排就只依陣型排列。</li></ul>');
