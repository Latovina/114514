/* ===================== 列裝的介面：
   一、兵力編成的單位明細：「載具與彈藥」（型號、砲管倍徑、原廠配置與加掛、彈藥配比、與標準配備相比的效果）與「部隊點數」（裝備係數、同級標準、編制建議）
   二、列裝表（一方的制式裝備）：範例列裝、各角色的制式載具、制式武器、制式彈藥、支援裝備的配發比例
   三、點數視窗：各時代、各層級的標準部隊點數表；裝備庫：載具型號一覽
   四、作戰中的部隊面板：載具摘要與待換裝；換裝在後方休整時進行 ===================== */
(function(){var st=document.createElement('style');st.textContent='.lw-vm{border:1px solid rgba(0,0,0,.14);border-radius:8px;padding:8px 10px;margin:6px 0;background:rgba(0,0,0,.025)}.lw-vm h5{margin:0 0 4px;font-size:13px}'+
  '.lw-vmg{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:2px 10px;font-size:12px;margin:2px 0 4px}.lw-vmg>span:nth-child(odd){color:#667}'+
  '.lw-vmw{font-size:12px;line-height:1.6}.lw-vmad{display:flex;flex-wrap:wrap;gap:2px 12px;font-size:12px;margin-top:2px}.lw-vmad label.f{font-weight:600}'+
  '.lw-vmam{font-size:12px}.lw-vmam tr.lw-dim td{opacity:.55}.lw-vmam input{width:4.6em}'+
  '.lw-fpbar{position:relative;height:7px;border-radius:4px;background:rgba(0,0,0,.1);overflow:hidden;margin:3px 0 1px;max-width:280px}.lw-fpbar i{position:absolute;left:0;top:0;bottom:0;background:#3d5a80}.lw-fpbar b{position:absolute;left:50%;top:0;bottom:0;width:2px;background:#b3261e}'+
  '.lw-fph{margin:4px 0 0 1.1em;padding:0;font-size:12px;color:#8a5300}.lw-fph li{margin:1px 0}'+
  '.lw-fldt{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0 8px}.lw-fldp{border:1px solid rgba(0,0,0,.14);border-radius:8px;padding:6px 8px;margin:4px 0}.lw-fldp b{font-size:13px}'+
  '.lw-fldr{display:grid;grid-template-columns:minmax(8em,auto) 1fr;gap:4px 10px;align-items:center;font-size:12.5px}.lw-fldr select{max-width:100%}';document.head.appendChild(st);})();
var VMERA=[[0,1919,'第一次世界大戰'],[1920,1949,'第二次世界大戰'],[1950,1989,'冷戰'],[1990,9999,'當代']];
function vmYearNow(){return (G&&G.set&&G.set.y)||2000;}
function vmOptsHtml(role,cur){var y=vmYearNow(),o='';VMERA.forEach(function(E){var L=vmList(role).filter(function(m){return m.y>=E[0]&&m.y<=E[1];}).sort(function(a,b){return a.y-b.y;});if(!L.length)return;
  o+='<optgroup label="'+E[2]+'">'+L.map(function(m){return '<option value="'+m.k+'"'+(m.k===cur?' selected':'')+'>'+esc(m.n)+'（'+esc(m.nat)+'，'+m.y+(m.y>y?'，晚於作戰年代':'')+'）</option>';}).join('')+'</optgroup>';});return o;}
function vmWn(k){var w=wpnOf(k);return w?w.n:k;}
function vmCalTxt(w){return w&&w.cal?fx(w.cal,w.cal<20?2:w.cal%1?1:0)+' 公釐'+(w.L?'、L/'+w.L:''):'';}
/* 型號卡片：規格、主武器（口徑、倍徑、可換的砲管）、副武器、原廠裝備 */
function vmCardHtml(m,V,u){var A=vmAdTot(m,V),mw=m.m&&wpnOf(m.m[0]),Lb=V&&V.L||mw&&mw.L,o='<div class="lw-vmg">'+
  kv('國別／服役',esc(m.nat)+'・'+m.y+' 年')+kv('乘員'+(m.px?'／載員':''),m.cr+' 人'+(m.px?'／'+m.px+' 人':''))+kv('重量',fx(m.t,1)+' 噸')+kv('單價',amoney(m.usd+A.usd))+
  kv('裝甲（動能／化學能）',fx(m.arm+A.arm,1)+'／'+fx((m.armC!==undefined?m.armC:m.arm)+A.armC,1)+' 級')+kv('速度（公路／越野）',Math.round(m.vr*A.vrm)+'／'+Math.round(m.vx*A.vrm)+' 公里／時')+
  kv('油箱',fmt(m.fu)+' 公升')+kv('油耗',fmt(m.lk)+' 公升／百公里')+'</div>';
  o+='<div class="lw-vmw"><b>主武器</b> '+(mw?esc(mw.n)+(m.m[1]>1?' ×'+m.m[1]:'')+'（'+vmCalTxt(mw).replace(/、L\/[\d.]+$/,'')+(mw.ind?'，射程 '+kmTxt(mw.ind):'')+'）':'—');
  if(mw&&mw.Lo&&mw.Lo.length>1&&u)o+=' <label>砲管 <select data-c="vmL" data-u="'+u.id+'">'+mw.Lo.map(function(L){return '<option value="'+L+'"'+(L===Lb?' selected':'')+'>L/'+L+(L===mw.L?'（原廠）':'')+'</option>';}).join('')+'</select></label>';
  else if(mw&&mw.L)o+=' <span class="lw-note">砲管 L/'+mw.L+'</span>';
  o+='<br><b>副武器</b> '+(m.s.length?m.s.map(function(x){var w=wpnOf(x[0]);return esc(w?w.n:x[0])+(x[1]>1?' ×'+x[1]:'');}).join('、'):'—')+(m.s.some(function(x){return vmMg(x[0]);})?'<span class="lw-note">（機槍的火力沿用兵種的時代標準）</span>':'')+'</div>';
  var E=vmEq(m,V);if(E.length)o+='<div class="lw-note">裝備：'+E.map(function(x){var e=seqOf(x[0]);return esc(e?e.n:x[0]);}).join('、')+'</div>';if(m.d)o+='<div class="lw-note">'+esc(m.d)+'</div>';return o;}
function vmAdTot(m,V){return vmArmAdd(m,V||{});}
/* 可選的加掛：原廠的、常見的，以及合乎年代的通用加掛 */
function vmAdCand(m){var y=Math.max(vmYearNow(),m.y),L=[],seen={},armd=m.arm>=1.5;(m.ad||[]).concat(m.op||[]).forEach(function(k){if(VAD[k]&&!seen[k]){seen[k]=1;L.push(VAD[k]);}});
  VADR.forEach(function(r){var a=VAD[r[0]];if(seen[a.k]||a.y>y||!armd)return;if(m.y<1950!==a.y<1950)return;if(/roller|dozer/.test(a.k)&&!/tank|htank/.test(m.r))return;if((m.e||[]).some(function(x){return a.e.some(function(q){return q[0]===x[0];});}))return;seen[a.k]=1;L.push(a);});return L;}
function vmAdTip(a){var p=[];if(a.arm)p.push('動能裝甲 +'+fx(a.arm,2));if(a.armC)p.push('化學能裝甲 +'+fx(a.armC,2));if(a.vrm<1)p.push('速度 ×'+fx(a.vrm,2));a.e.forEach(function(x){var e=seqOf(x[0]);if(e)p.push(e.n);});if(a.usd)p.push('每輛 '+amoney(a.usd));return p.join('、')||a.n;}
function vmAdHtml(m,V,uid){var cur=V&&Array.isArray(V.ad)?V.ad:m.ad||[],y=vmYearNow();return '<div class="lw-vmad">'+vmAdCand(m).map(function(a){var on=cur.indexOf(a.k)>=0,fac=(m.ad||[]).indexOf(a.k)>=0,rec=(m.op||[]).indexOf(a.k)>=0;
    return '<label class="'+(fac?'f':'')+'" title="'+esc(vmAdTip(a))+'"><input type="checkbox" data-c="vmad" data-u="'+uid+'" data-v="'+a.k+'"'+(on?' checked':'')+'>'+esc(a.n)+(fac?'（原廠）':rec?'（常見）':'')+(a.y>y?'（'+a.y+' 年）':'')+'</label>';}).join('')+'</div>';}
/* 彈藥配比：適用這門砲的彈種（穿甲依這輛車的砲管倍徑換算）、預設組合 */
function vmAmPreset(m,kind,w){var g=m.m[0];w=w||wpnOf(g);var tot=Math.round(amEff(m.am||w.am0,w).n)||w.rpu||40,y=vmYearNow(),L=amFor(g).filter(function(a){return a.y<=y;});if(!L.length)L=amFor(g);
  var at=L.filter(function(a){return a.pen>0;}).sort(function(a,b){return b.pen-a.pen;})[0],he=L.filter(function(a){return !(a.pen>0)&&a.p>=0.8;}).sort(function(a,b){return b.p-a.p;})[0];
  var fa=kind==='at'?0.75:0.25,o=[];if(at&&he){o.push([at.k,Math.round(tot*fa)]);o.push([he.k,tot-Math.round(tot*fa)]);}else if(at)o.push([at.k,tot]);else if(he)o.push([he.k,tot]);return o.filter(function(x){return x[1]>0;});}
function vmAmHtml(u,m){var g=m.m&&m.m[0],w=g&&wpnOf(g);if(!w||!w.am0)return '';var A=vmAmmo(u,m)||[],M={},Lb=u.vm&&u.vm.L||w.L,y=vmYearNow(),uid=u.id,F=fldOf(u.side);A.forEach(function(x){M[x[0]]=x[1];});var E=amEff(A,w,Lb),B=amEff(w.am0,w);
  var o='<div style="margin-top:6px"><b style="font-size:12px">彈藥配比</b><span class="lw-note">（每輛車；穿甲依 L/'+(Lb||'—')+' 砲管換算，＊為成形裝藥）</span></div><table class="lw-tbl lw-vmam"><tr><th>彈種</th><th>種類</th><th class="n">年代</th><th class="n">穿甲</th><th class="n">破片半徑</th><th class="n">對人</th><th class="n">對裝甲</th><th class="n">每發</th><th class="n">發數</th></tr>'+
    amFor(g).map(function(a){var fr=amFrag(a,w);return '<tr'+(a.y>y?' class="lw-dim" title="晚於作戰年代"':'')+'><td>'+esc(a.n)+'</td><td>'+esc(GAMK[a.kind]||a.kind)+'</td><td class="n">'+a.y+'</td><td class="n">'+(a.pen?fx(amPen(a,Lb),1)+(a.ce?'＊':''):'—')+'</td><td class="n">'+(fr?fr+' 公尺':'—')+'</td><td class="n">'+fx(a.p,2)+'</td><td class="n">'+fx(a.a,2)+'</td><td class="n">'+amoney(a.usd)+'</td>'+
      '<td class="n"><input type="number" min="0" max="2000" step="1" value="'+(M[a.k]||0)+'" data-c="vmam" data-u="'+uid+'" data-v="'+a.k+'"></td></tr>';}).join('')+'</table>';
  o+='<div class="lw-note">共 '+fmt(E.n)+' 發；有效穿甲 '+fx(E.pen,1)+' 級'+(E.ce?'（成形裝藥 '+pct(E.ce*100)+'）':'')+'；與這門砲的原廠配比相比，對人 ×'+fx(B.P?E.P/B.P:1,2)+'、對裝甲 ×'+fx(B.A?E.A/B.A:1,2)+(Math.abs(E.rng/(B.rng||1)-1)>0.01?'、射程 ×'+fx(E.rng/(B.rng||1),2):'')+'；平均每發 '+amoney(E.usd)+'。</div>'+
    '<div class="lw-row"><button type="button" class="lw-btn sm" data-a="vmamp" data-u="'+uid+'" data-v="f">原廠配比</button><button type="button" class="lw-btn sm" data-a="vmamp" data-u="'+uid+'" data-v="at">反裝甲為主</button><button type="button" class="lw-btn sm" data-a="vmamp" data-u="'+uid+'" data-v="he">反人員為主</button>'+
    (F&&F.a&&F.a[g]?'<button type="button" class="lw-btn sm" data-a="vmamp" data-u="'+uid+'" data-v="fld">本方制式配比</button>':'')+'</div>';return o;}
/* 與兵種的時代標準配備相比 */
function vmFxTxt(u){var b=fpBase(u),s=ST(u),f=WF(u),X=fpX(u),p=[];if(Math.abs(s.arm-b.arm)>0.05)p.push('裝甲 '+fx(b.arm,1)+' → '+fx(s.arm,1));var bc=b.armC!==undefined?b.armC:b.arm,sc=s.armC!==undefined?s.armC:s.arm;if(Math.abs(sc-bc)>0.05&&Math.abs(sc-s.arm)>0.05)p.push('化學能裝甲 '+fx(bc,1)+' → '+fx(sc,1));
  if(Math.abs(s.vx-b.vx)>0.05)p.push('越野速度 '+fx(b.vx,1)+' → '+fx(s.vx,1)+' 公里／時');if(Math.abs(f.penD||0)>0.05)p.push('穿甲 '+((f.penD||0)>0?'+':'')+fx(f.penD||0,1)+' 級');if(Math.abs((f.a||1)-1)>0.01)p.push('對裝甲火力 ×'+fx(f.a||1,2));if(Math.abs((f.p||1)-1)>0.01)p.push('對人火力 ×'+fx(f.p||1,2));
  return '與兵種的時代標準配備相比：'+(p.length?p.join('、'):'沒有差別')+'。部隊點數 '+fmt(fpShow(u))+'（裝備係數 ×'+fx(X.t,2)+'），造價 '+amoney(unitUsd(u).t)+'。';}
/* 作戰中（不在後方休整）的改動要等下次休整才換裝 */
function vmLater(u){return !!(G&&G.started&&!(u.refit&&u.st==='off'));}
function vmSecHtml(u,inDlg){var role=vmRoleU(u);if(!role)return '';var t=vmTypeU(u),P=vmPrinc(t),nv=P?vmNv(u,P[0]):0,F=fldOf(u.side),fk=F&&F.v&&F.v[role],V=u.vm,m=V&&vmOf(V.m),pend=u.vmNext,uid=u.id;
  var sel=!V?'':V.m==='-'?'-':V.src==='f'?'@f':V.m;
  var o='<h4 style="margin:10px 0 4px;font-size:13px">載具與彈藥 <span class="lw-note">（'+esc(VROLE[role])+' '+fmt(nv)+' 輛）</span></h4>'+
    '<div class="lw-row"><label>型號 <select data-c="vmset" data-u="'+uid+'"><option value="'+(fk?'-':'')+'"'+(sel===''||sel==='-'?' selected':'')+'>標準配備（依兵種與年代，不指定型號）</option>'+(fk?'<option value="@f"'+(sel==='@f'?' selected':'')+'>依本方列裝表：'+esc(vmOf(fk).n)+'</option>':'')+vmOptsHtml(role,sel.charAt(0)==='@'||sel==='-'?'':sel)+'</select></label>'+
    (inDlg?'':'<button type="button" class="lw-btn sm" data-a="flddlg" data-v="'+u.side+'">列裝表…</button>')+'</div>';
  if(pend){var pm=vmOf(pend.m);o+='<div class="lw-note" style="color:#8a5300">下次在後方休整時換裝為：'+esc(pm?pm.n:'標準配備')+'</div>';}else if(u.vmPend)o+='<div class="lw-note" style="color:#8a5300">本方的列裝表已更新，這個單位會在後方休整時換裝。</div>';
  if(!m)return o+'<div class="lw-note">沒有指定型號：武器、裝甲與速度採用兵種的時代標準。選擇型號後，主武器、裝甲、速度、油耗與造價都依型號計算。</div>';
  if(vmLater(u))o+='<div class="lw-note">作戰中更換型號、砲管或加掛，要等這個單位撤到後方休整時才進行；彈藥配比可以隨時調整，下一次補給起生效。</div>';
  o+='<div class="lw-vm"><h5>'+esc(m.n)+(V.src==='f'?' <span class="lw-pill">列裝</span>':'')+'</h5>'+vmCardHtml(m,V,u)+'<div style="margin-top:6px"><b style="font-size:12px">加掛</b> <button type="button" class="lw-btn sm" data-a="vmadf" data-u="'+uid+'">原廠配置</button></div>'+vmAdHtml(m,V,uid)+'</div>';
  return o+vmAmHtml(u,m)+'<div class="lw-note" style="margin-top:4px">'+vmFxTxt(u)+'</div>';}
/* 部隊點數（不在地圖上的單位也照算） */
function fpShow(u){if(!u||u.st==='dead')return 0;if(!isLeaf(u)){var n=u.hq&&u.men0>0?fpType(u.hq)*clamp(u.men/u.men0,0,1):0;leavesOf(u).forEach(function(q){n+=fpShow(q);});return Math.round(n);}return Math.round(fpMix(u.mix)*fpX(u).t*clamp(strFrac(u),0,1.2));}
function fpSecHtml(u){var leaf=isLeaf(u),pts=fpShow(u),o='<h4 style="margin:10px 0 4px;font-size:13px">部隊點數</h4><div class="lw-kv">';
  if(leaf){var X=fpX(u);o+=kv('部隊點數',fmt(pts)+(Math.abs(X.t-1)>0.005?'（裝備係數 ×'+fx(X.t,2)+'）':''))+kv('裝備係數','武器 ×'+fx(X.wf,2)+'、防護 ×'+fx(X.pf,2)+'、機動 ×'+fx(X.mf,2)+'、支援裝備 ×'+fx(X.ef,2)+'、彈藥存量 ×'+fx(X.am,2));}
  else o+=kv('部隊點數',fmt(pts)+'（'+leavesOf(u).length+' 個單位）');
  var S=fpStdU(u);if(S&&S.v>0){var r=pts/S.v,E=ERAI[S.era]||{};o+=kv('同級標準',esc(E.n||'')+'的標準'+FPKIND[S.kind]+(ECH[S.ech]||ECH[1])[1]+'約 '+fmt(S.v)+' 點'+(S.est?'（估計）':'（依「'+esc(S.src[0])+'」）')+'；本部隊為 '+fx(r,2)+' 倍<div class="lw-fpbar" title="紅線為同級標準"><i style="width:'+Math.round(clamp(r/2,0,1)*100)+'%"></i><b></b></div>');}
  o+='</div>';var H=fmHints(u);if(H.length)o+='<ul class="lw-fph">'+H.map(function(h){return '<li>'+esc(h)+'</li>';}).join('')+'</ul>';return o;}
/* 編制建議：兵種搭配、年代與型號、與同級標準相比 */
function fmHints(u){var o=[],y=vmYearNow();if(isLeaf(u)){var mm=u.vm&&vmOf(u.vm.m);if(mm&&mm.y>y)o.push('這個型號 '+mm.y+' 年才服役，晚於作戰年代（'+y+' 年）。');return o;}
  var L=leavesOf(u).filter(function(q){return q.st!=='dead';}),w={},tot=0,eras={},late=[],sh=function(){var s=0;for(var i=0;i<arguments.length;i++)s+=w[arguments[i]]||0;return tot?s/tot:0;},ech=u.ech===undefined?2:u.ech;
  L.forEach(function(q){(q.mix||[]).forEach(function(m){var t=typeOf(m[0]);if(!t)return;var v=fpType(t)*(m[1]||1);tot+=v;w[t.br]=(w[t.br]||0)+v;var e=ERAI[t.era];if(e&&!e.fan)eras[e.k]=e;});var vm=q.vm&&vmOf(q.vm.m);if(vm&&vm.y>y)late.push(vm);});
  if(!tot)return o;
  if(ech>=2&&sh('arm')>0.7&&sh('inf','mech','mot','abn','sof')<0.15)o.push('戰車多、步兵少：缺少步兵掩護，在城鎮、森林與夜間容易被近戰反裝甲武器擊毀。');
  if(ech>=2&&y>=1940&&sh('inf','mot','abn','sof','gue')>0.85)o.push('幾乎全是步兵：缺少重武器，遇到戰車時很被動。');
  if(ech>=3&&!w.art&&!w.mor&&!w.rkt)o.push('沒有砲兵：團級以上通常有直屬或配屬的砲兵。');
  if(ech>=3&&!w.rec&&y>=1900)o.push('沒有偵察單位：看不到敵人，就難以分辨虛實。');
  if(ech>=4&&!w.sup)o.push('沒有後勤單位：旅級以上最好編入補給與維修，否則只能靠上級補給。');
  if(ech>=4&&!w.ad&&y>=1940)o.push('沒有防空單位：容易受到空襲。');
  if(ech>=2&&y>=1940&&!w.at&&!w.arm&&sh('mech')<0.2)o.push('反裝甲火力薄弱：沒有戰車、反戰車或機械化單位。');
  var ek=Object.keys(eras);if(ek.length>1){var ys=ek.map(function(k){return eras[k].y;}).sort(function(a,b){return a-b;});if(ys[ys.length-1]-ys[0]>=30)o.push('混用年代相差很大的單位：'+ek.map(function(k){return eras[k].n;}).join('、')+'。');}
  if(late.length)o.push('有 '+late.length+' 個單位的載具晚於作戰年代（例如 '+late[0].n+'，'+late[0].y+' 年服役）。');
  var S=fpStdU(u);if(S&&S.v>0){var r=fpShow(u)/S.v;if(r<0.6)o.push('戰力只有同級標準的'+pct(r*100)+'：可能是缺編或層級設得太高。');else if(r>1.8)o.push('戰力是同級標準的 '+fx(r,1)+' 倍：可能編得太大，或層級設得太低。');}
  return o;}
/* ---------- 兵力編成的單位明細 ---------- */
(function(){var b=obDet;obDet=function(){b.apply(this,arguments);try{var el=UI.body&&UI.body.querySelector('[data-k="obdet"]'),u=OB.sel?uById(OB.sel):null;if(!el||!u||el.querySelector('.lw-fpsec'))return;
  var d=document.createElement('div');d.className='lw-fpsec';d.innerHTML=fpSecHtml(u)+(isLeaf(u)?vmSecHtml(u):'');var k=el.querySelector('.lw-kv');if(k&&k.parentNode===el)el.insertBefore(d,k.nextSibling);else el.appendChild(d);}catch(e){if(window.console)console.warn('列裝明細',e);}};})();
/* ---------- 作戰中的部隊面板：載具摘要 ---------- */
(function(){var b=lgUnitHtml;lgUnitHtml=function(u){var o=b(u);try{if(!o||!u||UI.tab==='orbat'||!isLeaf(u)||!vmRoleU(u))return o;var m=u.vm&&vmOf(u.vm.m),pm=u.vmNext&&(vmOf(u.vmNext.m)||{n:'標準配備'});
  return '<div class="lw-row" style="margin:2px 0 6px"><span>載具：'+(m?esc(m.n)+'（'+fmt(u.lg&&u.lg.vmN||0)+' 輛）':'標準配備')+(pm?'<span class="lw-note">，休整時換裝為 '+esc(pm.n)+'</span>':u.vmPend?'<span class="lw-note">，待換裝</span>':'')+'</span><button type="button" class="lw-btn sm" data-a="vmdlg" data-v="'+u.id+'">載具與彈藥…</button></div>'+o;}catch(e){return o;}};})();
function vmDlg(u){if(!u)return;UI.vmdU=u.id;var o='<h3>'+esc(uName(u))+'<small>載具、彈藥與部隊點數</small></h3>'+vmSecHtml(u,true)+fpSecHtml(u)+'<div class="lw-row"><button type="button" class="lw-btn" data-a="x">關閉</button></div>';if(UI.vmd&&UI.vmd.isConnected)UI.vmd.remove();UI.vmd=dlg(o,true);}
ACT.vmdlg=function(b){vmDlg(uById(+b.getAttribute('data-v')));};
function vmRedraw(u){if(UI.tab==='orbat'&&OB.sel===u.id)obDet();if(UI.vmd&&UI.vmd.isConnected&&UI.vmdU===u.id)vmDlg(u);if(UI.panelTick)try{UI.panelTick(true);}catch(e){}}
function vmUnit(t){return uById(+t.getAttribute('data-u'));}
/* 改型號、砲管與加掛：開戰前與後方休整中立即換裝，作戰中等下次休整 */
function vmPut(u,V,msg){if(vmLater(u)){u.vmNext=V||{m:''};toast(msg||'這個單位會在下次撤到後方休整時換裝。',3500);}else{if(V)u.vm=V;else delete u.vm;delete u.vmNext;eqSync(u);}vmRedraw(u);}
function vmCur(u){var V=u.vmNext&&vmLater(u)?u.vmNext:u.vm;return V&&vmOf(V.m)?clone(V):null;}
CHG.vmset=function(t){var u=vmUnit(t);if(!u)return;var v=t.value,F=fldOf(u.side),r=vmRoleU(u),V=null;if(v==='@f'){var fk=F&&F.v&&F.v[r];V=fk?{m:fk,src:'f'}:null;}else if(v==='-')V={m:'-'};else if(v){var m=vmOf(v);V=m?{m:m.k,ad:clone(m.ad||[])}:null;}vmPut(u,V);};
CHG.vmL=function(t){var u=vmUnit(t),V=u&&vmCur(u);if(!V)return;var m=vmOf(V.m),w=wpnOf(m.m[0]),L=+t.value;if(w&&L===w.L)delete V.L;else V.L=L;vmPut(u,V,'換砲管要等這個單位撤到後方休整時進行。');};
CHG.vmad=function(t){var u=vmUnit(t),V=u&&vmCur(u);if(!V)return;var m=vmOf(V.m),k=t.getAttribute('data-v'),L=(Array.isArray(V.ad)?V.ad:clone(m.ad||[])).filter(function(x){return x!==k;});if(t.checked)L.push(k);V.ad=L;vmPut(u,V,'加掛要等這個單位撤到後方休整時改裝。');};
ACT.vmadf=function(b){var u=vmUnit(b),V=u&&vmCur(u);if(!V)return;V.ad=clone(vmOf(V.m).ad||[]);vmPut(u,V,'會在後方休整時恢復原廠配置。');};
/* 彈藥配比隨時可以改（下一次補給起生效） */
CHG.vmam=function(t){var u=vmUnit(t),m=u&&u.vm&&vmOf(u.vm.m);if(!m)return;var A=clone(vmAmmo(u,m)||[]),k=t.getAttribute('data-v'),n=clamp(Math.round(+t.value||0),0,2000);A=A.filter(function(x){return x[0]!==k;});if(n>0)A.push([k,n]);if(!A.length){toast('至少要帶一種彈藥。');vmRedraw(u);return;}u.vm.am=A;eqSync(u);vmRedraw(u);};
ACT.vmamp=function(b){var u=vmUnit(b),m=u&&u.vm&&vmOf(u.vm.m);if(!m)return;var v=b.getAttribute('data-v'),w=wpnOf(m.m[0]);if(v==='fld')delete u.vm.am;else if(v==='f')u.vm.am=clone(m.am||w.am0);else u.vm.am=vmAmPreset(m,v,w);eqSync(u);vmRedraw(u);};

/* ---------- 列裝表 ---------- */
var FLD={side:0,tab:'pkg',draft:null};
var FLDTAB=[['pkg','範例列裝'],['v','載具'],['w','武器'],['a','彈藥'],['e','支援裝備']];
/* 單機開戰前兩方都能改（同兵力編成）；聯機或作戰中只能改自己這一方 */
function fldOwnOnly(){return typeof mpActive==='function'&&mpActive()||!!(G&&G.started&&mySide()!==null);}
function fldEditable(s){return !fldOwnOnly()||mySide()===s;}
function fldRoles(side){var o={};G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||u.st==='dead')return;var r=vmRoleU(u);if(r)o[r]=(o[r]||0)+1;});return o;}
/* 本方部隊用到的泛用武器（換裝前的數量），以及可以換成的具體型號 */
function fldGen(side){var o={};G.units.forEach(function(u){if(u.side!==side||!isLeaf(u)||!u.lg||u.st==='dead')return;eqCanonW(u).forEach(function(x){var w=WPNO[x[0]];if(w&&!w.spec&&!w.hid)o[x[0]]=(o[x[0]]||0)+x[1];});});return o;}
function fldSpecFor(g){var w=WPNO[g];if(!w)return [];return Object.keys(WPNO).map(function(k){return WPNO[k];}).filter(function(q){return q.spec&&q.cat===w.cat&&(q.base===g||!WPNO[q.base]||WPNO[q.base].cat===w.cat);}).sort(function(a,b){return (a.base===g?0:1)-(b.base===g?0:1)||a.y-b.y;});}
/* 需要彈藥配比的砲：草稿裡的制式載具與本方單位現有型號的主砲 */
function fldGuns(side,D){var o={};Object.keys(D.v||{}).forEach(function(r){var m=vmOf(D.v[r]);if(m&&m.m&&wpnOf(m.m[0])&&wpnOf(m.m[0]).am0)o[m.m[0]]=1;});G.units.forEach(function(u){var m=u.side===side&&u.vm&&vmOf(u.vm.m);if(m&&m.m&&wpnOf(m.m[0])&&wpnOf(m.m[0]).am0)o[m.m[0]]=1;});return Object.keys(o);}
/* 制式裝備的內容（放在「物資與裝備」對話框的分頁裡） */
function fldBody(){if(!FLD.draft)FLD.draft=clone(fldOf(FLD.side)||{v:{},w:{},a:{},e:{}});
  var S=FLD.side,D=FLD.draft,y=vmYearNow(),ok=fldEditable(S),o='<div class="lw-note"><b>'+esc(ptsSideTxt(S))+'的制式裝備</b></div>';
  if(!fldOwnOnly())o+='<div class="lw-row"><label>陣營 <select data-c="fldside">'+SIDES().map(function(s){return '<option value="'+s+'"'+(s===S?' selected':'')+'>'+esc(ptsSideTxt(s))+'</option>';}).join('')+'</select></label></div>';
  o+='<div class="lw-note">制式裝備（列裝表）決定這一方的單位用哪些具體的載具型號、武器、彈藥與支援裝備。開戰前套用時立即換裝；作戰中套用時，新的部隊與增援直接使用，前線部隊在撤到後方休整時換裝。單位上手動指定的型號不受影響。增援的費用依列裝的裝備計算。</div>';
  o+='<div class="lw-fldt">'+FLDTAB.map(function(t){return '<button type="button" class="lw-btn sm'+(FLD.tab===t[0]?' pri':'')+'" data-a="fldtab" data-v="'+t[0]+'">'+t[1]+'</button>';}).join('')+'</div><div data-k="fldbody">';
  if(FLD.tab==='pkg'){o+=FLDPR.slice().sort(function(a,b){return Math.abs(a.y-y)-Math.abs(b.y-y);}).map(function(p){return '<div class="lw-fldp"><b>'+esc(p.n)+'</b>'+(D.pk===p.k?' <span class="lw-pill">草稿</span>':'')+'<div class="lw-note">'+Object.keys(p.v).map(function(r){return esc(VROLE[r])+'：'+esc(vmOf(p.v[r]).n);}).join('；')+(Object.keys(p.w).length?'<br>武器：'+Object.keys(p.w).map(function(g){return esc(vmWn(p.w[g]));}).join('、'):'')+'</div><button type="button" class="lw-btn sm" data-a="fldpkg" data-v="'+p.k+'">載入這套</button></div>';}).join('');}
  else if(FLD.tab==='v'){var R=fldRoles(S);o+='<div class="lw-fldr">'+Object.keys(VROLE).filter(function(r){return R[r]||D.v[r];}).map(function(r){var m=vmOf(D.v[r]);return '<span>'+esc(VROLE[r])+'<br><span class="lw-note">'+fmt(R[r]||0)+' 個單位</span></span><span><select data-c="fldv" data-v="'+r+'"><option value="">標準配備（不指定）</option>'+vmOptsHtml(r,D.v[r]||'')+'</select>'+(m?'<br><span class="lw-note">'+(m.m?esc(vmWn(m.m[0]))+'；':'')+'裝甲 '+fx(m.arm,1)+'；'+m.vr+'／'+m.vx+' 公里／時；單價 '+amoney(m.usd)+'</span>':'')+'</span>';}).join('')+'</div>'+(Object.keys(R).length?'':'<div class="lw-note">這一方還沒有帶車輛的單位。</div>');}
  else if(FLD.tab==='w'){var Gn=fldGen(S),ks=Object.keys(Gn).filter(function(g){return fldSpecFor(g).length;}).concat(Object.keys(D.w||{}).filter(function(g){return !Gn[g];}));
    o+=ks.length?'<div class="lw-fldr">'+ks.map(function(g){var c=D.w[g];return '<span>'+esc(vmWn(g))+'<br><span class="lw-note">'+fmt(Gn[g]||0)+' 件</span></span><span><select data-c="fldw" data-v="'+g+'"><option value="">泛用（不指定）</option>'+fldSpecFor(g).map(function(w){return '<option value="'+w.k+'"'+(w.k===c?' selected':'')+'>'+esc(w.n)+'（'+w.y+(w.cal?'，'+vmCalTxt(w):'')+(w.y>y?'，晚於作戰年代':'')+'）</option>';}).join('')+'</select></span>';}).join('')+'</div>':'<div class="lw-note">沒有可以換成具體型號的武器。</div>';}
  else if(FLD.tab==='a'){var gs=fldGuns(S,D);o+=gs.length?gs.map(function(g){var w=wpnOf(g),A=(D.a||{})[g]||w.am0,M={};A.forEach(function(x){M[x[0]]=x[1];});var E=amEff(A,w);return '<div class="lw-fldp"><b>'+esc(w.n)+'</b> <span class="lw-note">'+vmCalTxt(w)+'；有效穿甲 '+fx(E.pen,1)+' 級，每輛 '+fmt(E.n)+' 發'+((D.a||{})[g]?'':'（武器預設）')+'</span><table class="lw-tbl lw-vmam">'+
      amFor(g).map(function(a){return '<tr'+(a.y>y?' class="lw-dim"':'')+'><td>'+esc(a.n)+'</td><td>'+esc(GAMK[a.kind]||a.kind)+'</td><td class="n">'+a.y+'</td><td class="n">'+(a.pen?fx(amPen(a,w.L),1)+(a.ce?'＊':''):'—')+'</td><td class="n"><input type="number" min="0" max="2000" value="'+(M[a.k]||0)+'" data-c="fldam" data-g="'+g+'" data-v="'+a.k+'"></td></tr>';}).join('')+'</table>'+((D.a||{})[g]?'<button type="button" class="lw-btn sm" data-a="fldamx" data-v="'+g+'">改回武器預設</button>':'')+'</div>';}).join(''):'<div class="lw-note">先在「載具」指定制式載具，或替單位選擇型號，這裡才會列出它們的主砲。</div>';}
  else{var cats={};seqList().forEach(function(e){(cats[e.cat]=cats[e.cat]||[]).push(e);});o+='<div class="lw-note">配發比例：人員裝備依人數、車輛裝備依裝甲車輛數、單位裝備每個單位一件（比例 50% 以上才發）。在兵種標準配備之外另行配發；同類裝備以較好的優先，覆蓋率最多到全員或全車。</div>'+Object.keys(cats).map(function(c){return '<h4 style="margin:8px 0 2px;font-size:13px">'+esc(c)+'</h4><div class="lw-fldr">'+cats[c].sort(function(a,b){return a.y-b.y;}).map(function(e){return '<span'+(e.y>y?' style="opacity:.6"':'')+'>'+esc(e.n)+'<br><span class="lw-note">'+e.y+' 年・'+({m:'人員',v:'車輛',u:'單位'})[e.cov]+'</span></span><span><input type="number" min="0" max="100" step="5" value="'+Math.round(((D.e||{})[e.k]||0)*100)+'" data-c="flde" data-v="'+e.k+'" style="width:5em"> %</span>';}).join('')+'</div>';}).join('');}
  o+='</div><div class="lw-row" style="margin-top:8px">'+(ok?'<button type="button" class="lw-btn pri" data-a="fldok">套用制式裝備</button><button type="button" class="lw-btn sm dng" data-a="fldclr">清除草稿</button>':'<span class="lw-note">只能檢視，不能修改對方的制式裝備。</span>')+'</div>';return o;}
function fldDlg(side){if(!G)return;var me=mySide();if(fldOwnOnly()&&me!==null)side=me;if(side!==undefined&&side!==null&&+side!==FLD.side){FLD.side=+side;FLD.draft=null;}armoryDlg('fld');}
ACT.flddlg=function(b){var v=b&&b.getAttribute?b.getAttribute('data-v'):null;fldDlg(v!==null&&v!==''?+v:(OB&&OB.side!==undefined?OB.side:0));};
ACT.fldtab=function(b){FLD.tab=b.getAttribute('data-v');fldDlg();};
CHG.fldside=function(t){FLD.side=+t.value;FLD.draft=null;fldDlg();};
ACT.fldpkg=function(b){var p=FLDP[b.getAttribute('data-v')];if(!p)return;FLD.draft={v:clone(p.v),w:clone(p.w),a:{},e:clone((FLD.draft||{}).e||{}),pk:p.k};FLD.tab='v';fldDlg();toast('已載入「'+p.n+'」到草稿，按「套用列裝表」才會生效。',3500);};
CHG.fldv=function(t){var D=FLD.draft,r=t.getAttribute('data-v');if(t.value)D.v[r]=t.value;else delete D.v[r];delete D.pk;fldDlg();};
CHG.fldw=function(t){var D=FLD.draft,g=t.getAttribute('data-v');D.w=D.w||{};if(t.value)D.w[g]=t.value;else delete D.w[g];delete D.pk;fldDlg();};
CHG.fldam=function(t){var D=FLD.draft,g=t.getAttribute('data-g'),k=t.getAttribute('data-v'),n=clamp(Math.round(+t.value||0),0,2000);D.a=D.a||{};var A=clone(D.a[g]||wpnOf(g).am0).filter(function(x){return x[0]!==k;});if(n>0)A.push([k,n]);if(A.length)D.a[g]=A;fldDlg();};
ACT.fldamx=function(b){var D=FLD.draft;if(D.a)delete D.a[b.getAttribute('data-v')];fldDlg();};
CHG.flde=function(t){var D=FLD.draft,k=t.getAttribute('data-v'),f=clamp((+t.value||0)/100,0,1);D.e=D.e||{};if(f>0)D.e[k]=f;else delete D.e[k];};
ACT.fldclr=function(){FLD.draft={v:{},w:{},a:{},e:{}};fldDlg();};
ACT.fldok=function(){var S=FLD.side;if(!fldEditable(S))return;var n=fldSet(S,FLD.draft);FLD.draft=null;toast(G.started?'列裝表已更新：新的部隊與增援直接使用，前線部隊在後方休整時換裝。':(n?n+' 個單位已換裝，其餘':'列裝表已套用：')+'各單位開戰時依列裝表換裝。',4000);fldDlg();if(UI.tab==='orbat'){try{obTree();obDet();}catch(e){}}};
/* 兵力編成的頁首：列裝表按鈕 */
(function(){var b=PAGES.orbat;PAGES.orbat=function(host){b(host);try{var d=host.querySelector('.lw-obv');if(d)d.insertAdjacentHTML('beforeend','<button type="button" class="lw-btn sm" data-a="flddlg" title="一方的制式載具、武器、彈藥與支援裝備">列裝表…</button>');}catch(e){}};})();
/* ---------- 點數視窗：標準部隊點數表 ---------- */
function fpStdTblHtml(){var E=ERA.filter(function(e){return !e.fan;}),ech=[0,1,2,3,4,5,6],o='<div class="lw-note">有內建編制範本的層級取範本的點數，其餘以標準連的點數依層級估計（標「≈」）。部隊點數只用來比較戰力：兵種、兵力與訓練的基本點數，乘上武器、防護、機動、支援裝備與彈藥存量的裝備係數。</div>';
  ['inf','mech','arm'].forEach(function(k){var rows=E.map(function(e){var cells=ech.map(function(h){var r=fpStd(e.k,k,h);return r?'<td class="n">'+(r.est?'≈':'')+fmt(r.v)+'</td>':'<td class="n">—</td>';});return cells.join('').replace(/<td class="n">—<\/td>/g,'').length?'<tr><td>'+esc(e.n)+'</td>'+cells.join('')+'</tr>':'';}).filter(Boolean);if(!rows.length)return;
    o+='<h4 style="margin:8px 0 4px">'+FPKIND[k]+'</h4><table class="lw-tbl"><tr><th>時代</th>'+ech.map(function(h){return '<th class="n">'+ECH[h][1]+'</th>';}).join('')+'</tr>'+rows.join('')+'</table>';});return o;}
(function(){var b=ptsDlg;ptsDlg=function(){b.apply(this,arguments);try{var box=UI.ptd&&UI.ptd.firstElementChild,rows=box&&box.querySelectorAll(':scope>.lw-row'),last=rows&&rows[rows.length-1];if(!last)return;
  last.insertAdjacentHTML('beforebegin','<details style="margin-top:8px"><summary style="cursor:pointer"><b>各時代、各層級的標準部隊點數</b></summary>'+fpStdTblHtml()+'</details>');last.insertAdjacentHTML('afterbegin','<button type="button" class="lw-btn sm" data-a="flddlg">列裝表…</button>');}catch(e){}};})();
/* ---------- 裝備庫：載具型號一覽 ---------- */
if(typeof ARTABS!=='undefined')ARTABS.push(['vmc','載具型號']);
function vmCatHtml(){var o='<div class="lw-note">範例載具型號：在兵力編成選取單位後，可以在「載具與彈藥」換上這些型號，或在列裝表裡指定為一方的制式裝備。裝甲是正面、側面、後方的加權等級；穿甲依原廠彈藥與砲管換算。</div><div class="lw-sc" style="max-height:60vh;overflow:auto"><table class="lw-tbl"><tr><th>型號</th><th>國別</th><th class="n">年代</th><th>角色</th><th>主武器</th><th class="n">穿甲</th><th class="n">裝甲</th><th class="n">公路／越野</th><th class="n">單價</th></tr>';
  VMR.slice().sort(function(a,b){return a.y-b.y;}).forEach(function(m){var w=m.m&&wpnOf(m.m[0]);o+='<tr title="'+esc(m.d||'')+'"><td>'+esc(m.n)+'</td><td>'+esc(m.nat)+'</td><td class="n">'+m.y+'</td><td>'+m.r.split('|').map(function(r){return VROLE[r];}).join('、')+'</td><td>'+esc(w?w.n:'—')+'</td><td class="n">'+(w&&w.pen?fx(w.pen,1):'—')+'</td><td class="n">'+fx(m.arm,1)+'</td><td class="n">'+m.vr+'／'+m.vx+'</td><td class="n">'+amoney(m.usd)+'</td></tr>';});return o+'</table></div>';}
(function(){if(typeof armoryDlg!=='function')return;var b=armoryDlg;armoryDlg=function(tab){b.apply(this,arguments);try{if(AR.tab!=='vmc'||!UI.wdlg)return;var el=UI.wdlg.querySelector('[data-k="armbody"]');if(el)el.innerHTML=vmCatHtml();}catch(e){}};})();
/* ---------- 說明 ---------- */
if(typeof HELP14!=='undefined')HELP14.push('<h4>列裝、載具與部隊點數</h4><ul>'+
  '<li>單位可以換上具體的載具型號（兵力編成的單位明細，或作戰中部隊面板的「載具與彈藥」）：主武器、裝甲、速度、油耗與造價都依型號計算；機槍的火力沿用兵種的時代標準。可以選擇加掛（原廠的、常見的與合乎年代的）、更換砲管的倍徑，並調整每輛車的彈藥配比。</li>'+
  '<li>彈藥依口徑與砲管適用：同一種動能彈從較長的砲管射出，穿甲較高、直射距離較遠；成形裝藥不受砲管影響；榴彈的破片半徑隨口徑變大。彈藥配比改變對人與對裝甲的效果、穿甲、精度與價格。</li>'+
  '<li>列裝表（兵力編成頁首或點數視窗）決定一方的制式載具、武器、彈藥與支援裝備，也有依陣營與年代的範例列裝。開戰前套用時立即換裝；作戰中只有新的部隊、增援，以及撤到後方休整的單位會換裝。手動指定的型號不受列裝表影響；增援的費用依列裝的裝備計算。</li>'+
  '<li>部隊點數＝兵種、兵力與訓練的基本點數 × 裝備係數（武器、防護、機動、支援裝備、彈藥存量，相對於兵種的時代標準配備）。單位明細會與同時代、同層級的標準步兵、機械化或裝甲部隊比較，並列出編制上的建議；點數視窗有完整的標準點數表。</li></ul>');
