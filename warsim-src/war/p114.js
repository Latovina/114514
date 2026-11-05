/* ===================== 堤壩與決堤（介面）：地圖標記、點選後的說明與命令、警告、設定、說明、對話 ===================== */
setSec('combat','dam',{t:'堤壩與決堤',o:25,h:function(){return setOpt(setRow('堤壩',setChk('setb','dam',G.set.dam!==false,'大河邊的低地有防洪堤，河谷可能有水壩；工兵可以奉命爆破決堤，淹沒下游的低地（以水代兵）')))+
  '<div class="lw-note">關閉後地圖上仍畫出堤壩，但無法決堤。</div>';}});
var DAMST={ok:'完好',breach:'已決堤，洪水持續湧出',fixed:'決口已堵住，洪水正在退去',closed:'決口已堵住',drained:'水庫已放空'};
function damDraw(c){VW.dmm=[];if(!G||!G.started||!G.dams||!G.dams.length)return;var S=VW.s,z=clamp(5+S*1.2,6,13),sel=UI.selX&&UI.selX.k==='dam'?UI.selX.id:0;
  G.dams.forEach(function(d){var p=w2s(d.x,d.y);if(p[0]<-40||p[1]<-40||p[0]>VW.cw+40||p[1]>VW.ch+40)return;VW.dmm.push({id:d.id,sx:p[0],sy:p[1]});var x=p[0],y=p[1],br=d.st!=='ok'&&d.st!=='closed';c.save();
    if(d.k==='dam'){c.fillStyle='#78909C';c.strokeStyle='#ECEFF1';c.lineWidth=1;c.fillRect(x-z*1.2,y-z*0.35,z*2.4,z*0.7);c.strokeRect(x-z*1.2,y-z*0.35,z*2.4,z*0.7);c.fillStyle='#1E88E5';c.beginPath();c.moveTo(x-z*0.5,y-z*0.4);c.lineTo(x+z*0.5,y-z*0.4);c.lineTo(x,y-z*1.1);c.closePath();c.fill();}
    else{c.strokeStyle='#ECEFF1';c.lineWidth=z*0.7+2;c.lineCap='round';c.beginPath();c.moveTo(x-z*1.3,y+z*0.2);c.lineTo(x+z*1.3,y-z*0.2);c.stroke();c.strokeStyle='#8D6E63';c.lineWidth=z*0.7;c.beginPath();c.moveTo(x-z*1.3,y+z*0.2);c.lineTo(x+z*1.3,y-z*0.2);c.stroke();}
    if(br){c.strokeStyle='#D50000';c.lineWidth=2;c.beginPath();c.moveTo(x-z*0.3,y-z*0.7);c.lineTo(x+z*0.1,y-z*0.1);c.lineTo(x-z*0.2,y+z*0.2);c.lineTo(x+z*0.3,y+z*0.7);c.stroke();}
    if(d.id===sel){c.strokeStyle='#FFC107';c.lineWidth=2;c.beginPath();c.arc(x,y,z*1.7,0,2*PI);c.stroke();}
    if(S>=1.6){c.font='10px sans-serif';c.textAlign='center';c.textBaseline='top';c.lineWidth=3;c.strokeStyle='rgba(255,255,255,.85)';c.fillStyle=br?'#B71C1C':'#3E2723';var t=d.n+(br?'（決堤）':'');c.strokeText(t,x,y+z);c.fillText(t,x,y+z);}c.restore();});}
(function(){var b=drawUnder;drawUnder=function(c){b.apply(this,arguments);try{damDraw(c);}catch(e){}};})();
function damHit(sx,sy){var best=null,bd=14;(VW.dmm||[]).forEach(function(q){var d=dist(sx,sy,q.sx,q.sy);if(d<bd){bd=d;best=q;}});return best;}
(function(){var b=btClick;btClick=function(x,y,sx,sy,e){if((UI.tool==='sel'||!UI.tool)&&G&&G.started){var q=damHit(sx,sy);if(q&&!(typeof hitAt==='function'&&hitAt(sx,sy))){var me=mySide(),us=UI.sel.map(uById).filter(function(u){return u&&alive(u)&&(me===null||u.side===me);});if(us.length)UI.selPrev=us.map(function(u){return u.id;});
    UI.selX={k:'dam',id:q.id};UI.sel=[];UI.selC=0;UI.selB=0;btSel();btLeft(true);vDraw(false);return;}}return b.apply(this,arguments);};})();
(function(){var b=v8Get;v8Get=function(X){if(X&&X.k==='dam')return G&&damById(X.id)||null;return b(X);};})();
(function(){var b=v8Panel;v8Panel=function(X){if(X&&X.k==='dam'){var d=v8Get(X);return d?damPanel(d):null;}return b(X);};})();
(function(){var b=cellTip;cellTip=function(x,y){if(G&&G.started&&VW.cw){var p=w2s(x,y),q=damHit(p[0],p[1]);if(q){var d=damById(q.id);if(d)return d.n+'（'+DAMK[d.k][0]+'）：'+DAMST[d.st]+'\n點選可查看詳情與命令';}}return b(x,y);};})();
function damPanel(d){var r=d.st==='ok'?damRisk(d):null,o=v8H((d.k==='dam'?'🌊 ':'〰 ')+esc(d.n))+'<div class="lw-note">'+esc(DAMK[d.k][1])+'</div><div class="lw-kv">'+kv('種類',DAMK[d.k][0])+kv('狀態',esc(DAMST[d.st]||d.st))+kv('地點',esc(placeTxt(d.x,d.y)));
  if(r)o+=kv('決堤會淹到','約 '+fx(r.km2,1)+' 平方公里低地'+(r.vil?'，'+r.vil+' 個村鎮、約 '+fmt(r.pop)+' 名居民':''));
  if(d.st!=='ok'){o+=kv('決堤',(d.byn?esc(d.byn)+'，':'')+tTxt(d.bt).slice(-11))+(d.area?kv('淹水','約 '+fx(d.area,1)+' 平方公里'+(d.amax>d.area+0.05?'（最多 '+fx(d.amax,1)+'）':'')):'')+(d.dead>=1?kv('死難','約 '+fmt(d.dead)+' 名平民溺斃，約 '+fmt(d.ref)+' 人流離失所'):'');}o+='</div>';
  if(!G.started||!damOn())return o;var acts=d.st==='ok'?['blow']:d.st==='breach'&&d.k==='levee'?['fix']:[];if(!acts.length)return o;var me=mySide(),A=[];G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||ST(u).dom!=='land'||u.irr||(me!==null&&u.side!==me))return;if(d.k==='dam'&&!isEng(u))return;var dd=dist(u.x,u.y,d.x,d.y);if(dd<25000)A.push([isEng(u)?0:1,dd,u]);});
  A.sort(function(a,b){return a[0]-b[0]||a[1]-b[1];});A=A.slice(0,10).map(function(q){return q[2];});if(!A.length)return o+'<div class="lw-note" style="margin-top:8px">附近沒有可以派去的'+(d.k==='dam'?'工兵':'')+'部隊。</div>';var cur=A.filter(function(u){return u.id===UI.v8u;})[0]||A[0];UI.v8u=cur.id;
  return o+'<h4 style="margin:10px 0 4px;font-size:13px">命令</h4><div class="lw-opt"><span>執行單位</span><select data-c="v8u">'+A.map(function(u){return '<option value="'+u.id+'"'+(u===cur?' selected':'')+'>'+esc(uName(u))+(isEng(u)?'（工兵）':'')+'（'+kmTxt(dist(u.x,u.y,d.x,d.y))+'）</option>';}).join('')+'</select></div><div class="lw-ob">'+
   acts.map(function(a){return '<button type="button" data-a="damdo" data-v="'+a+'"'+(a==='blow'?' class="dng"':'')+'>'+(a==='blow'?'⚠ ':'')+DAMA[a][0]+'</button>';}).join('')+'</div><div class="lw-note">'+(acts[0]==='blow'?'<b>爆破決堤</b>：工兵約 '+durTxt(damNeed(d,cur,'blow'))+(isEng(cur)?'':'（不是工兵，靠人力掘開要更久）')+'。洪水會淹沒下游的低地，不分敵我。':'<b>堵口</b>：約 '+durTxt(damNeed(d,cur,'fix'))+'，堵住後洪水在一天內退去。')+'</div>';}
function damWarn(d,u){var r=damRisk(d);return '決堤會讓'+(d.k==='dam'?'水庫的水':'河水')+'沖進下游的低地，約 '+fx(r.km2,1)+' 平方公里一片汪洋'+(r.vil?'，'+r.vil+' 個村鎮、約 '+fmt(r.pop)+' 名居民來不及逃的會溺斃':'')+'；洪水不分敵我，道路、橋梁與田地都會被沖毀。\n\n'+
  '1938 年花園口決堤遲滯了日軍，卻造成數十萬平民死亡、數百萬人流離失所。1977 年起，攻擊堤壩這類含有危險力量的設施為國際法所禁止。\n\n守法的部隊可能拒絕執行；這個決定會被記錄、報導，並列入戰後總結。\n\n確定要命令「'+uName(u)+'」爆破'+d.n+'嗎？';}
ACT.damdo=function(b){var a=b.getAttribute('data-v'),X=UI.selX,d=X&&X.k==='dam'?v8Get(X):null;if(!d||!G.started){toast('找不到這處堤壩。');return;}var me=mySide(),u=uById(UI.v8u);if(!u||!onMap(u)||(me!==null&&u.side!==me)){toast('請選擇執行的部隊。');return;}
  if(a==='blow'&&typeof confirm==='function'&&!confirm(damWarn(d,u)))return;var r=issue(u,'dam',{x:d.x,y:d.y,opt:{id:d.id,act:a}});toast('已命令'+uName(u)+'：'+DAMA[a][0]+(r&&r.sec>0?'（約 '+durTxt(r.sec)+' 後送達）':''));vDraw(false);btLeft(true);};
if(typeof HELP14!=='undefined')HELP14.push('<h4>堤壩與決堤</h4><ul>'+
  '<li>大河邊低窪地最大的地方有<b>防洪堤</b>（褐色粗線），1900 年以後河谷收窄處可能有<b>水壩</b>（灰色壩體與藍色三角）。點選可以看到決堤會淹到多大的範圍、多少村鎮與居民。</li>'+
  '<li>派部隊<b>爆破決堤</b>：工兵約 2 小時（水壩約 6 小時），1850 年以前靠人力掘開要更久，不是工兵也更慢；水壩只有工兵能炸。決堤前會跳出警告，守法的部隊可能拒絕。</li>'+
  '<li>決堤後河水沖進比決口低的地方，幾小時內越淹越廣；水壩的水一兩小時內沖到最高、之後隨水庫放空慢慢退去，堤防的決口則會一直進水，直到派工兵<b>堵口</b>。</li>'+
  '<li>淹到的地方：道路與鐵路不通，浮橋、便橋被沖走（水壩潰決時連永久橋梁也可能沖毀）；部隊第一次被洪水捲到會有人被沖走、車輛泡水，之後依水深撤往高處；村莊被淹，居民大量溺斃（事先有警報的少死很多）、倖存者逃難。水退後道路泡水受損、低地成為沼澤。</li>'+
  '<li>形勢危急、敵軍就在堤防保護的低地上時，政策極端的 AI 可能下令決堤。設定的「堤壩與決堤」可以關閉。</li></ul>');
/* ---------- 對話：洪水捲到部隊 ---------- */
VOXN.flood=['洪水','被決堤或氾濫的洪水捲到'];VOXCAT.forEach(function(c){if(c[0]==='毒氣與核武'){c[0]='毒氣、核武與洪水';c[1].push('flood');}});
VOXD.flood=['水！水沖過來了！','往高處跑！','抓住樹！','車子被沖走了！','水已經到腰了','他被水捲走了……','把槍舉高！','[n]黑暗裡全是水聲','[!]我不會游泳！','[~]手拉手，別散開'];
VOXP.rough.flood=['靠杯，水怎麼這麼大！','快爬上去，*的！','誰炸的堤？王*蛋！','車沒救了，人先走！'];VOXP.pro.flood=['洪水接近，向高地轉移！','清點人員，回報損失','車輛棄置，人員優先','標示安全路線'];
VOX.P=null;VOX.PS=null;
(function(){var b=voxDetect;voxDetect=function(u,P,N,s){var r=b(u,P,N,s);N.flC=u.flC||0;if(r||P.flC===undefined)return r;if(N.flC>P.flC)return ['flood',1];return null;};})();
