/* ===================== 化生放介面：頂列的風向風速；地圖上的毒劑雲與地面污染；單位面板的防護狀態與「除污」「接種」「隔離」「化生放攻擊」；
   陣營政策（使用政策、防護等級、開戰前疫苗接種）；設定；說明 ===================== */
if(typeof GKEYS!=='undefined')GKEYS.push('cbx','cbgr','cbUse','cbSeq');
(function(){var b=hudTick;hudTick=function(force){b(force);if(!G||!G.started||!cbOn()||!UI.bar)return;var wx=UI.bar.querySelector('[data-k="wx"]');if(wx&&G.env&&G.env.wd!==undefined&&wx.textContent.indexOf('風 ')<0)wx.textContent+='・'+windTxt();};})();
/* ---------- 地圖 ---------- */
function cbRGBA(h,a){var n=parseInt(String(h).slice(1),16);return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';}
function cbVis(x,y,R,side){if(seeAll())return true;var me=mySide();if(side===me)return true;var v=false;cbNear(x,y,R+3000,function(u){if(!v&&u.side===me&&onMap(u)&&dist(u.x,u.y,x,y)<=R+3000)v=true;});return v;}
function drawCbrn(c){if(!G.started||!cbOn())return;var cs=G.map.cs,me=mySide();c.save();
  var GR=G.cbgr;if(GR){var B=cs*8;Object.keys(GR).forEach(function(key){var p=key.split('|'),A=CBA[p[2]],v=GR[key];if(!A||v<0.02)return;var x=(+p[0])*B,y=(+p[1])*B;if(!cbVis(x+B/2,y+B/2,B,-9))return;var a=w2s(x,y),s=B/cs*VW.s;if(a[0]>VW.cw||a[1]>VW.ch||a[0]+s<0||a[1]+s<0)return;
    c.globalAlpha=clamp(0.25+v*0.2,0.25,0.5);c.fillStyle=A[11];c.fillRect(a[0],a[1],s,s);c.globalAlpha=0.55;c.strokeStyle='rgba(60,30,80,.7)';c.lineWidth=1;c.strokeRect(a[0]+0.5,a[1]+0.5,s-1,s-1);if(s>18){c.globalAlpha=0.6;c.strokeStyle='rgba(60,30,80,.7)';c.lineWidth=1;c.beginPath();for(var i=-s;i<s;i+=8){c.moveTo(a[0]+Math.max(0,i),a[1]+Math.max(0,-i));c.lineTo(a[0]+Math.min(s,s+i),a[1]+Math.min(s,s-i));}c.stroke();}});}
  (G.cbx||[]).forEach(function(C){var A=CBA[C.ag];if(!A||!cbVis(C.x,C.y,C.r,C.side))return;var p=w2s(C.x,C.y),R=C.r/cs*VW.s;if(p[0]<-R||p[1]<-R||p[0]>VW.cw+R||p[1]>VW.ch+R)return;var conc=C.m/Math.max(0.05,(C.r/400)*(C.r/400)),al=clamp(0.15+conc*0.12,0.15,0.55);
    /* 毒劑的顏色常與地表相近：較濃的填色，再加深色外框與彩色虛線 */var gr=c.createRadialGradient(p[0],p[1],0,p[0],p[1],Math.max(4,R));gr.addColorStop(0,cbRGBA(A[11],0.78));gr.addColorStop(0.6,cbRGBA(A[11],0.5));gr.addColorStop(1,cbRGBA(A[11],0.08));
    c.globalAlpha=clamp(0.5+al*0.6,0.5,0.85);c.fillStyle=gr;c.beginPath();c.arc(p[0],p[1],Math.max(4,R),0,2*PI);c.fill();
    c.globalAlpha=0.9;c.setLineDash([]);c.strokeStyle='rgba(40,20,60,.6)';c.lineWidth=3;c.beginPath();c.arc(p[0],p[1],Math.max(4,R),0,2*PI);c.stroke();c.strokeStyle=A[11];c.lineWidth=1.8;c.setLineDash([6,4]);c.beginPath();c.arc(p[0],p[1],Math.max(4,R),0,2*PI);c.stroke();c.setLineDash([]);
    if(VW.s>0.25){c.globalAlpha=0.9;var lab=(A[1]==='r'?'☢ ':A[1]==='b'?'☣ ':'☠ ')+A[0];c.font='bold 11px sans-serif';c.textAlign='center';c.textBaseline='middle';var w=c.measureText(lab).width+8;c.fillStyle='rgba(255,255,255,.85)';c.fillRect(p[0]-w/2,p[1]-8,w,16);c.fillStyle='#4a148c';c.fillText(lab,p[0],p[1]);}});c.globalAlpha=1;c.restore();}
(function(){var b=drawProj;drawProj=function(c){b(c);try{drawCbrn(c);}catch(e){if(window.console)console.warn('cbrn',e);}};})();
(function(){var b=tipAt;tipAt=function(sx,sy,w){var r=b(sx,sy,w);try{if(VW.tip&&!VW.tip.hidden&&G&&G.started&&cbOn()&&w){var o=cbConc(w[0],w[1]);if(o&&cbVis(w[0],w[1],500,-9)){var L=Object.keys(o).filter(function(k){return CBA[k];}).map(function(k){return CBA[k][0]+(o['g_'+k]?'（地面污染）':'');});if(L.length)VW.tip.textContent+='\n化生放：'+L.join('、');}}}catch(x){}return r;};})();
/* ---------- 單位面板 ---------- */
function cbCan(u){var s=ST(u),y=uEra(u).y,fan=!!uEra(u).fan,o=[];if(!isLeaf(u))return o;var av=cbAvail(u.side);
  if(s.dom==='land'&&(s.ind||0)>0)av.forEach(function(k){if(k!=='corpse'&&k!=='mias')o.push([k,'shell']);});
  if(s.dom==='air'&&/bomber|attack/.test(typeof airRole==='function'?airRole(u):''))av.forEach(function(k){if(CBA[k][1]!=='m'&&k!=='corpse')o.push([k,'air']);});
  if(s.dom==='land'&&isEng(u)&&y>=1915&&y<1950)['chl','phos'].forEach(function(k){if(av.indexOf(k)>=0)o.push([k,'cyl']);});
  if(s.dom==='land'&&av.indexOf('corpse')>=0&&(s.br==='sge'||s.br==='art'))o.push(['corpse','cat']);
  if(fan&&av.indexOf('mias')>=0&&(u.lg&&u.lg.w||[]).some(function(x){return x[0]==='magic';}))o.push(['mias','mag']);return o;}
var CBDN={shell:'砲彈',air:'空中噴灑',cyl:'鋼瓶施放（順風）',cat:'投石機拋射',mag:'魔法施放'};
(function(){var b=v4Status;v4Status=function(u,leaf,L){var o=b(u,leaf,L);if(!leaf||!cbOn()||!G.started||G.replay)return o;var me=mySide();if(me!==null&&u.side!==me)return o;var g=u.cbg,s=ST(u),y=uEra(u).y,lines=[],btn=[];
  if(g||y>=1915||uEra(u).fan){g=cbGear(u);var M=cbMopp(u),ef=typeof cbEff==='function'?cbEff(u):g;lines.push((ef.mask>0?'面具'+(ef.mask<0.95?' '+pct(ef.mask*100):'')+(g.on||M>=4?'（已戴上）':'（攜帶）'):'沒有防毒面具')+(ef.suit>0?'、防護服 '+pct(ef.suit*100):'')+'、防護等級 MOPP '+M+(g.filt<100?'、濾罐 '+fmt(g.filt)+'%':''));
    if(g.dose>0.05)lines.push('累計暴露劑量 '+fx(g.dose,1));if(g.cont>0.02)lines.push('<span style="color:#b3261e">裝備沾染（'+fx(g.cont,2)+'），需要除污</span>');var inc=(g.inf||[]).reduce(function(a,q){return a+q.n;},0);if(inc>=0.5)lines.push('<span style="color:#b3261e">潛伏感染約 '+fmt(inc)+' 人</span>');
    var vx=Object.keys(g.vax||{});if(vx.length)lines.push('疫苗：'+vx.map(function(k){var ok=G.t-g.vax[k]>=CBVX[k][2]*86400;return CBVX[k][0]+(ok?'（有效）':'（產生免疫中）');}).join('、'));}
  if(u.sick>0.5&&CBC[u.dzk])btn.push('<button type="button" class="lw-btn sm'+(u.quar?' pri':'')+'" data-a="cbquar" data-v="'+u.id+'" title="隔離傳染病患：幾乎不再傳染，但部隊原地不動">'+(u.quar?'解除隔離':'隔離')+'</button>');
  if((isEng(u)||s.fl.indexOf('D')>=0||eqHas(u,'dk'))&&s.dom==='land')btn.push('<button type="button" class="lw-btn sm" data-a="cbdec" data-v="'+u.id+'" title="就地清除附近地面與部隊的沾染">'+(u.cbDec?'除污中…':'除污')+'</button>');
  if(s.fl.indexOf('D')>=0)btn.push('<button type="button" class="lw-btn sm" data-a="cbvaxd" data-v="'+u.id+'" title="為 4 公里內的本方部隊接種疫苗">接種疫苗…</button>');
  if(cbCan(u).length)btn.push('<button type="button" class="lw-btn sm dng" data-a="cbatk" data-v="'+u.id+'">化生放攻擊…</button>');
  if(!lines.length&&!btn.length)return o;return o+'<span>化生放防護</span><span>'+lines.join('<br>')+(btn.length?'<br>'+btn.join(' '):'')+'</span>';};})();
ACT.cbquar=function(b){var u=uById(+b.getAttribute('data-v'));if(!u)return;u.quar=u.quar?0:1;if(u.quar){u.ord=null;u.task='hold';}logE(u.side,'cbrn',uName(u)+(u.quar?'實施隔離':'解除隔離'),u.x,u.y,u.id);if(UI.panelTick)UI.panelTick(true);};
ACT.cbdec=function(b){var u=uById(+b.getAttribute('data-v'));if(!u)return;if(u.cbDec){toast('正在除污。');return;}cbDeconStart(u);u.ord=null;u.task='hold';toast(uName(u)+'開始就地除污（約兩小時）。');if(UI.panelTick)UI.panelTick(true);};
ACT.cbvaxd=function(b){var u=uById(+b.getAttribute('data-v'));if(!u)return;var y=uEra(u).y,fan=!!uEra(u).fan,L=Object.keys(CBVX).filter(function(k){return k==='mias'?fan:!fan&&y>=CBVX[k][1];});
  var o='<h3>接種疫苗</h3><div class="lw-note">'+esc(uName(u))+'為 4 公里內的本方部隊接種，經過一段時間後產生免疫。</div><div class="lw-row" style="flex-wrap:wrap">'+(L.length?L.map(function(k){return '<button type="button" class="lw-btn" data-a="cbvaxgo" data-v="'+u.id+'|'+k+'">'+CBVX[k][0]+'（'+CBVX[k][2]+' 天後有效）</button>';}).join(''):'這個年代沒有可用的疫苗。')+'</div><div class="lw-row"><button type="button" class="lw-btn" data-a="x">關閉</button></div>';dlg(o);};
ACT.cbvaxgo=function(b){var v=b.getAttribute('data-v').split('|'),u=uById(+v[0]),r=cbVax(u,v[1],4000);document.querySelectorAll('.lw-dlg').forEach(function(d){if(/接種疫苗/.test(d.textContent))d.remove();});toast(r.err?r.err:'已為 '+r.n+' 個單位接種'+CBVX[v[1]][0]+'。',4000);};
/* ---------- 化生放攻擊 ---------- */
var CBU={id:0,ag:'',how:''};
ACT.cbatk=function(b){var u=uById(+b.getAttribute('data-v'));if(!u)return;CBU.id=u.id;var L=cbCan(u),pol=cbPolicy(u.side),used=G.cbUse&&(nSides()<3?G.cbUse[1-u.side]:Math.max.apply(null,[0].concat(hostSides(u.side).map(function(h){return G.cbUse[h]||0;}))));if(!L.some(function(q){return q[0]===CBU.ag&&q[1]===CBU.how;})){CBU.ag=L[0][0];CBU.how=L[0][1];}
  var blocked=pol==='no'||pol==='retal'&&!used,law=cbLaw(CBU.ag);
  var o='<h3>化生放攻擊</h3><div class="lw-kv">'+kv('單位',esc(uName(u)))+kv('本方政策',({no:'禁止使用',retal:'僅在敵方先使用後報復',yes:'允許使用'})[pol]+(blocked?'（可在「交戰守則」中更改）':''))+kv('風',esc(windTxt()))+'</div>'+
    '<div class="lw-opt"><span>毒劑</span><span>'+L.map(function(q){var A=CBA[q[0]];return '<label style="display:block"><input type="radio" name="cbag" data-c="cbag" value="'+q[0]+'|'+q[1]+'"'+(q[0]===CBU.ag&&q[1]===CBU.how?' checked':'')+'> '+esc(A[0])+'（'+CBT[A[1]]+'，'+CBDN[q[1]]+(A[5]>0?'，持久 '+(A[5]>=48?fmt(A[5]/24)+' 天':A[5]+' 小時'):'')+'）</label>';}).join('')+'</span></div>'+
    (law?'<div class="lw-note"><b style="color:#b3261e">'+esc(law)+'。</b>使用會記為戰爭罪行，被發現時本方聲望下降，戰地報導與戰後總結都會記錄；毒劑隨風漂移，可能波及平民與本方部隊。</div>':'<div class="lw-note">毒劑隨風漂移，可能波及平民與本方部隊。</div>')+
    '<div class="lw-row"><button type="button" class="lw-btn dng" data-a="cbpt"'+(blocked?' disabled':'')+'>在地圖上指定目標</button><button type="button" class="lw-btn" data-a="x">取消</button></div>';if(UI.cbd&&UI.cbd.isConnected)UI.cbd.remove();UI.cbd=dlg(o);};
CHG.cbag=function(t){var v=t.value.split('|');CBU.ag=v[0];CBU.how=v[1];ACT.cbatk({getAttribute:function(){return String(CBU.id);}});};
ACT.cbpt=function(){var d=UI.cbd;UI.cbd=null;if(d&&d.isConnected)d.remove();UI.tool='cbpt';modeBt();};
(function(){var b=modeBt;modeBt=function(){b();if(VW.mode&&UI.tool==='cbpt'){VW.mode.hidden=false;VW.mode.innerHTML='點選地圖指定「'+esc(CBA[CBU.ag]?CBA[CBU.ag][0]:'')+'」的目標<button type="button" data-a="ordx">取消</button>';}};})();
(function(){var b=btClick;btClick=function(x,y,sx,sy,e){if(UI.tool!=='cbpt')return b(x,y,sx,sy,e);UI.tool='sel';modeBt();var u=uById(CBU.id);if(!u)return;var r={ok:1};
  if(CBU.how==='shell'){if(dist(u.x,u.y,x,y)>(ST(u).ind||0)*0.98){toast('超出射程（'+kmTxt(ST(u).ind||0)+'）。');return;}issue(u,'bombard',{x:x,y:y,agent:CBU.ag,dur:900});}
  else if(CBU.how==='air')issue(u,'strike',{x:x,y:y,agent:CBU.ag});else if(CBU.how==='cyl')r=cbCylinder(u,CBU.ag,x,y);else if(CBU.how==='cat')r=cbCatapult(u,x,y);
  else if(CBU.how==='mag'){if(dist(u.x,u.y,x,y)>2500){toast('魔法施放距離約 2.5 公里。');return;}cbRelease(u.side,CBU.ag,x,y,1.2,400,u,'施放');}
  if(r.err){toast(r.err,4500);return;}if(G.civ)decLog(u.side,'玩家','命令'+uName(u)+'以'+CBA[CBU.ag][0]+'攻擊'+placeTxt(x,y));toast('已下令以'+CBA[CBU.ag][0]+'攻擊'+placeTxt(x,y)+'。',4000);vDraw(false);};})();
/* ---------- 陣營政策 ---------- */
var CBPOL=[['no','禁止使用化生放武器'],['retal','僅在敵方先使用後報復'],['yes','允許使用']],CBMP=[[0,'MOPP 0：不穿防護服'],[1,'MOPP 1：攜帶防護服'],[2,'MOPP 2：穿著防護服'],[3,'MOPP 3：防護服與防護靴'],[4,'MOPP 4：全身防護並戴面具']];
(function(){var b=sideV4Html;sideV4Html=function(side){var o=b(side);if(!cbOn())return o;var P=polSide(side),S=SD(side),y=cbY(side),fan=cbFan(side),V=S.vax0||{},vl=Object.keys(CBVX).filter(function(k){return k==='mias'?fan:!fan&&y>=CBVX[k][1];});
  var h='<span>化生放武器</span>'+selH('spol','cbrn',CBPOL,P.cbrn||'no')+'<span>防護等級</span>'+selH('scbm','mopp',CBMP,S.mopp||0)+(vl.length?'<span>開戰前接種</span><span>'+vl.map(function(k){return '<label><input type="checkbox" data-c="scbv" data-f="'+k+'"'+(V[k]?' checked':'')+'>'+CBVX[k][0]+'</label>';}).join(' ')+'</span>':'');
  var i=o.indexOf('<span>投降</span>');return i>=0?o.slice(0,i)+h+o.slice(i):o+h;};})();
CHG.scbm=function(t){var S=SD(OB.side);S.mopp=clamp(+t.value||0,0,4);S.moppSet=1;OB.v4open=1;};
CHG.scbv=function(t){var S=SD(OB.side);S.vax0=S.vax0||{};S.vax0[t.getAttribute('data-f')]=t.checked?1:0;G.units.forEach(function(u){if(u.side===OB.side&&u.cbg){if(t.checked)u.cbg.vax[t.getAttribute('data-f')]=-1e9;else delete u.cbg.vax[t.getAttribute('data-f')];}});OB.v4open=1;};
/* ---------- 設定與說明 ---------- */
setSec('env','cbrn',{t:'化學、生物、放射性（CBRN）',o:30,h:function(){return setOpt(setRow('化生放作戰',setChk('setb','cbrn',G.set.cbrn!==false,'啟用毒劑雲、地面污染、疾病擴散、風向與防護（各方是否使用由陣營政策決定，預設禁止）')));}});
HELP14.push('<h4>化學、生物、放射性（CBRN）作戰</h4><ul>'+
  '<li><b>毒劑</b>依年代出現：氯氣（1915）、光氣（1916）、芥子氣（1917，持久數天）、炭疽孢子、鼠疫菌、天花病毒（1940 起的生物武器）、沙林（1950）、VX（1960，持久性神經毒劑）、放射性髒彈（1950）；古代可以用投石機拋射疫屍，異世界有魔瘴。砲兵以毒劑彈、轟炸機與攻擊機空中噴灑、第一次世界大戰的工兵以鋼瓶順風施放。</li>'+
  '<li>毒劑雲<b>隨風漂移</b>（頂列顯示風向風速）並擴散、被雨沖淡；氯氣、光氣、芥子氣與魔瘴重於空氣，會流入低地與壕溝。持久性毒劑與放射性落塵污染地面，經過或停留的部隊持續暴露，裝備沾染後要除污。毒劑雲飄過聚落會傷害平民。</li>'+
  '<li><b>防護</b>：防毒面具在聽到「毒氣！」警報後戴上（第一次世界大戰約一分鐘、現代數十秒，之前沒有保護）；防護服依防護等級 MOPP 0～4 生效，等級越高越安全，但越容易疲勞（炎熱時加倍），MOPP 4 時戰鬥力降為四分之三；有密閉防護的現代裝甲車輛大幅降低暴露。面具對芥子氣與 VX 的保護有限，需要防護服。</li>'+
  '<li><b>生物武器與傳染病</b>：感染者經過潛伏期（炭疽約 2 天、鼠疫約 3 天、天花約 10 天）才發病，進入疾病與醫療系統；鼠疫、天花與魔瘴熱會傳染附近的部隊與平民。醫療單位可以為 4 公里內的部隊<b>接種疫苗</b>（天花 1798 年起、鼠疫 1897 年起、炭疽 1954 年起；異世界為淨化祝福），經過一段時間後產生免疫；也可以在陣營政策中設定開戰前已接種。<b>隔離</b>傳染病患幾乎能阻止傳播，附近有醫療單位時傳播也會減少。</li>'+
  '<li><b>除污</b>：工兵與醫療單位就地除污，清除附近地面與部隊的沾染並補充濾罐。<b>政策</b>：在「兵力編成」的陣營政策中設定化生放武器的使用（禁止、僅報復、允許）、防護等級與開戰前接種；AI 遭到化學攻擊後會提高防護等級。使用化學與生物武器依年代記為戰爭罪行（1899 年海牙宣言、1925 年日內瓦議定書，1972 年生物武器公約、1993 年化學武器公約）。</li></ul>');
