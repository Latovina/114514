/* ===================== 城市自模擬生長：依建城年代、地形與交通，逐時代擴張 =====================
   城市（以及較大的市鎮）不再是一個圓：先有舊城核心（可能築有城牆與城門，或在丘陵上有城堡），沿著道路向外帶狀發展；
   鐵路時代出現車站、調車場與工業區，河港與海港有碼頭倉庫；城牆拆除後改為環城大道與綠地；戰後出現計畫街廓與郊區住宅。
   每座城市依地理條件選擇特色：河港、海港、城堡、十字路口、計畫城市、要塞、鐵路樞紐、工業城、帶狀谷城、雙子城。 */
var CSTY={auto:'自動（依地形）',river:'河港城市',coast:'海港城市',castle:'城堡城市',cross:'十字路口商業城',grid:'計畫城市（棋盤街廓）',fort:'要塞城市（稜堡）',rail:'鐵路樞紐',ind:'工業城市',linear:'帶狀谷城',twin:'雙子城（跨河）'};
function cityDens(y){return byYear([[1000,16000],[1600,14000],[1800,12000],[1900,9000],[1950,6500],[1980,4500],[2030,3800]],y);}
function cityGrowthF(y){return byYear(ERAYEAR_POP,y)*Math.pow(byYear(ERAYEAR_URB,y),1.4);}
function growCities(MP,sets,slope,r,year,spec,NM,lbl){var GW=MP.GW,GH=MP.GH,cs=MP.cs,lc=MP.lc,rd=MP.rd,rl=MP.rl,el=MP.el,rv=MP.rv,N=GW*GH,own=new Int16Array(N).fill(-1);
  for(var k=0;k<N;k++)if(isUrban(lc[k]))own[k]=-2;
  var cities=sets.filter(function(s){return s.kind!=='village';}).sort(function(a,b){return b.pop-a.pop;});
  cities.forEach(function(S,ci){var isC=S.kind==='city',cx=Math.floor(S.x),cy=Math.floor(S.y),c0=cy*GW+cx;
    /* 地理條件 */var Rw=Math.ceil(Math.max(6,Math.sqrt(S.pop/cityDens(year)*1e6/PI)/cs*3.2)),x0=Math.max(0,cx-Rw),x1=Math.min(GW-1,cx+Rw),y0=Math.max(0,cy-Rw),y1=Math.min(GH-1,cy+Rw);
    var near=function(f,R){var Rc=Math.ceil(R/cs);for(var b=-Rc;b<=Rc;b++)for(var a=-Rc;a<=Rc;a++){var X=cx+a,Y=cy+b;if(X<0||Y<0||X>=GW||Y>=GH)continue;if(a*a+b*b>Rc*Rc)continue;if(f(Y*GW+X))return true;}return false;};
    var river=near(function(q){return lc[q]===LCI.riv||rv[q]>=3;},1500),coast=near(function(q){return lc[q]===LCI.sea||lc[q]===LCI.shal;},2500),railJ=year>=1860&&near(function(q){return rl[q]&1;},900),hillE=-1e9,hillK=c0;
    (function(){var Rc=Math.ceil(1500/cs);for(var b=-Rc;b<=Rc;b++)for(var a=-Rc;a<=Rc;a++){var X=cx+a,Y=cy+b;if(X<0||Y<0||X>=GW||Y>=GH||a*a+b*b>Rc*Rc)continue;var q=Y*GW+X;if(!isWater(lc[q])&&el[q]>hillE){hillE=el[q];hillK=q;}}})();
    var steepN=0,tot=0;for(var b=y0;b<=y1;b+=2)for(var a=x0;a<=x1;a+=2){tot++;if(slope[b*GW+a]>12)steepN++;}var steep=steepN/Math.max(1,tot);
    var sty=ci===0&&spec.cstyle&&spec.cstyle!=='auto'?spec.cstyle:null;if(!sty){var W=[['cross',2],['grid',r()<0.3?1.5:0.4]];if(river)W.push(['river',4],['twin',isC&&rv[c0]>=3||lc[c0]===LCI.riv?2.5:0.4]);if(coast)W.push(['coast',5]);if(hillE-el[c0]>35)W.push(['castle',isC?3:1.2]);if(railJ&&year>=1880)W.push(['rail',2]);if(year>=1890&&isC)W.push(['ind',1.5]);if(steep>0.25)W.push(['linear',4]);if(isC&&year<1900)W.push(['fort',1.5]);sty=wpick(r,W,function(q){return q[1];})[0];}
    if(!isC&&/fort|twin|ind/.test(sty))sty='cross';
    /* 建城年代與城牆 */var founded=Math.round(sty==='grid'&&r()<0.6?1700+r()*(Math.max(1750,year)-1700):isC?900+r()*700:1200+r()*600),walled=(isC||S.pop>6000)&&founded<1650&&sty!=='grid'&&sty!=='linear'&&r()<(isC?0.85:0.4),demol=walled?(sty==='fort'?1860+r()*60:r()<0.12?9999:1800+r()*100):0,bast=walled&&(sty==='fort'||isC&&r()<0.35);
    S.sty=sty;S.founded=founded;S.walled=walled&&year<demol;
    /* 道路距離場（城市窗口內） */var WW=x1-x0+1,HH=y1-y0+1,dR=new Float32Array(WW*HH).fill(99),dL=new Float32Array(WW*HH).fill(99),Q=[],Q2=[];
    for(var yy=y0;yy<=y1;yy++)for(var xx=x0;xx<=x1;xx++){var q=yy*GW+xx,i=(yy-y0)*WW+(xx-x0);if(rd[q]){dR[i]=0;Q.push(i);}if(rl[q]&1){dL[i]=0;Q2.push(i);}}
    function bfs(D,Q){var h=0;while(h<Q.length){var i=Q[h++],x=i%WW,y=(i/WW)|0;for(var d=0;d<4;d++){var X=x+[1,-1,0,0][d],Y=y+[0,0,1,-1][d];if(X<0||Y<0||X>=WW||Y>=HH)continue;var j=Y*WW+X;if(D[j]>D[i]+1){D[j]=D[i]+1;if(D[j]<40)Q.push(j);}}}}bfs(dR,Q);bfs(dL,Q2);
    /* 時代：每一期依人口成長增加面積 */var EP=[founded,1500,1650,1800,1870,1914,1945,1975,2000,2030].filter(function(y){return y>=founded&&y<year;}).concat([year]),gNow=cityGrowthF(year),cells=[],idx=ci;
    function canB(q){var c=lc[q];if(isWater(c)||own[q]>=0&&own[q]!==idx||own[q]===-2&&!(c===LCI.vill||c===LCI.town))return false;return slope[q]<25;}
    function addCell(q,use,ep){own[q]=idx;lc[q]=use;cells.push(q);cellEp[q]=ep;}var cellEp={},wallR=0;
    var start=sty==='castle'?hillK:c0;if(!canB(start))start=c0;if(canB(start))addCell(start,founded<1800?LCI.old:LCI.city,0);else return;
    var area=0,prevP=0;EP.forEach(function(ey,ei){var P=S.pop*cityGrowthF(ey)/gNow,dA=Math.max(ei===0?2:0,(P-prevP)/cityDens(ey)*1e6/(cs*cs));prevP=Math.max(prevP,P);area+=dA;
      var walledNow=walled&&ey<demol,compact=ey<1850?2:ey<1945?1.2:0.7,lam=sty==='linear'?2:ey<1850?3:ey<1945?6:10,goal=Math.round(area);if(walledNow&&ey>=1300&&!wallR)wallR=Math.sqrt(Math.max(cells.length,goal*0.85)/PI)+0.5;
      var guard=0;while(cells.length<goal&&guard++<400){var fr={},list=[];cells.forEach(function(q){var x=q%GW,y=(q/GW)|0;for(var d=0;d<8;d++){var X=x+[1,1,0,-1,-1,-1,0,1][d],Y=y+[0,1,1,1,0,-1,-1,-1][d];if(X<x0||Y<y0||X>x1||Y>y1)continue;var j=Y*GW+X;if(own[j]===idx||fr[j]||!canB(j))continue;fr[j]=1;list.push(j);}});if(!list.length)break;
        var sc=list.map(function(j){var x=j%GW,y=(j/GW)|0,i=(y-y0)*WW+(x-x0),n=0;for(var d=0;d<8;d++){var X=x+[1,1,0,-1,-1,-1,0,1][d],Y=y+[0,1,1,1,0,-1,-1,-1][d];if(X>=0&&Y>=0&&X<GW&&Y<GH&&own[Y*GW+X]===idx)n++;}
          var dx=x-cx,dy=y-cy,rr=sty==='grid'?(Math.abs(dx)+Math.abs(dy))*0.8:Math.sqrt(dx*dx+dy*dy),v=Math.pow(n/8,compact)*Math.exp(-dR[i]/lam)*(1/(1+slope[j]*0.12))*(ey<1850?0.35+1.3*r():0.75+0.5*r());
          if(lc[j]===LCI.marsh)v*=ey<1900?0.15:0.5;if(walledNow&&wallR&&rr>wallR)v*=dR[i]<=1?0.5:0.08;if((sty==='river'||sty==='twin'||sty==='coast')&&nearWater(j,2))v*=ey<1900?1.6:1.2;if(sty==='twin'&&ey<1900&&isC){/* 對岸另一個核心 */}
          if(ey>=1860&&ey<1960&&dL[i]<3)v*=sty==='rail'||sty==='ind'?2:1.4;if(sty==='linear')v*=Math.exp(-dR[i]/2);if(sty==='castle'&&ey<1800)v*=Math.exp(-dist(x,y,hillK%GW,(hillK/GW)|0)/6);return [j,v];});
        sc.sort(function(a,b){return b[1]-a[1];});var take=Math.max(1,Math.min(sc.length,Math.ceil((goal-cells.length)*0.12)+1)),pool=sc.slice(0,Math.max(take,Math.ceil(sc.length*0.25)));
        for(var t=0;t<take&&cells.length<goal&&pool.length;t++){var pi=Math.floor(Math.pow(r(),1.8)*pool.length),j=pool.splice(pi,1)[0][0];if(own[j]===idx)continue;addCell(j,cityUse(j,ey,sty,dL[((j/GW|0)-y0)*WW+(j%GW-x0)],walledNow&&wallR?Math.sqrt(((j%GW)-cx)*((j%GW)-cx)+(((j/GW)|0)-cy)*(((j/GW)|0)-cy))<=wallR:false,r),ei);}}});
    /* 雙子城：對岸補一個核心區 */if(sty==='twin'){var opp=findOpposite(cx,cy);if(opp>=0){for(var t2=0;t2<Math.round(cells.length*0.3);t2++){var ox=opp%GW+Math.round((r()-0.5)*6),oy=((opp/GW)|0)+Math.round((r()-0.5)*6);if(ox<0||oy<0||ox>=GW||oy>=GH)continue;var q2=oy*GW+ox;if(canB(q2)&&own[q2]!==idx)addCell(q2,year<1850?LCI.old:LCI.town,1);}}}
    /* 戰後：市中心改建為高樓商業區；舊城保留一部分 */if(year>=1960&&isC){cells.slice().sort(function(a,b){return dist(a%GW,(a/GW)|0,cx,cy)-dist(b%GW,(b/GW)|0,cx,cy);}).slice(0,Math.ceil(cells.length*0.12)).forEach(function(q){if(lc[q]===LCI.old&&r()<0.55)return;lc[q]=LCI.city;});}
    /* 城牆、城門、稜堡；拆除後改為環城大道與綠地 */if(walled&&wallR){var ring=[];for(var wy=Math.max(0,Math.floor(cy-wallR-2));wy<=Math.min(GH-1,Math.ceil(cy+wallR+2));wy++)for(var wx=Math.max(0,Math.floor(cx-wallR-2));wx<=Math.min(GW-1,Math.ceil(cx+wallR+2));wx++){var dw=Math.sqrt((wx-cx)*(wx-cx)+(wy-cy)*(wy-cy)),qw=wy*GW+wx;if(Math.abs(dw-wallR)<0.6&&!isWater(lc[qw]))ring.push(qw);}
      if(year<demol){ring.forEach(function(q){if(!rd[q]&&!(rl[q]&1)&&!isWater(lc[q]))MP.ft[q]=6;});if(bast&&year>=1550){var nb=isC?7:5;for(var bi=0;bi<nb;bi++){var ang=bi/nb*2*PI+r()*0.3,bx=cx+Math.cos(ang)*(wallR+1.6),by=cy+Math.sin(ang)*(wallR+1.6);brushCells(MP,bx,by,Math.max(0.8,70/cs),function(q){if(!isWater(lc[q])&&!rd[q])MP.ft[q]=5;});}}
        if(sty==='castle'&&year<1950)brushCells(MP,hillK%GW,(hillK/GW)|0,Math.max(0.6,120/cs),function(q){if(!isWater(lc[q]))MP.ft[q]=4;});}
      else{ring.forEach(function(q,i){if(!isWater(lc[q])){rd[q]=Math.max(rd[q],3);if(i%3===0&&lc[q]!==LCI.old)lc[q]=LCI.park;}});}}
    else if(sty==='castle'&&year<1950)brushCells(MP,hillK%GW,(hillK/GW)|0,Math.max(0.6,120/cs),function(q){if(!isWater(lc[q]))MP.ft[q]=4;});
    /* 要塞戰場：近代城市外圍的碉堡帶、塹壕與鐵絲網 */if(spec.bf==='fortress'&&ci===0&&year>=1880){var Rb=Math.sqrt(cells.length/PI)+1500/cs,nb2=Math.max(8,Math.round(2*PI*Rb*cs/500));for(var i2=0;i2<nb2;i2++){var a2=i2/nb2*2*PI,bx2=cx+Math.cos(a2)*Rb,by2=cy+Math.sin(a2)*Rb;brushCells(MP,bx2,by2,Math.max(0.6,40/cs),function(q){if(!isWater(lc[q]))MP.ft[q]=4;});}
      for(var t3=0;t3<2*PI;t3+=0.6/(Rb+1)){[[Rb+0.6,1],[Rb+1.6,2]].forEach(function(z){var X=Math.round(cx+Math.cos(t3)*z[0]),Y=Math.round(cy+Math.sin(t3)*z[0]);if(X<0||Y<0||X>=GW||Y>=GH)return;var q=Y*GW+X;if(!isWater(lc[q])&&!MP.ft[q]&&!(z[1]===2&&rd[q]))MP.ft[q]=z[1];});}}
    /* 街道：計畫街廓（1850 年後的新區或計畫城市）以棋盤街道相連；其餘城市加一條外環道路 */var gs=Math.max(2,Math.round(380/cs));cells.forEach(function(q){var x=q%GW,y=(q/GW)|0,ep=EP[cellEp[q]]||year;if((sty==='grid'||ep>=1860&&ep<1975&&r()<0.85)&&(x%gs===0||y%gs===0)&&lc[q]!==LCI.old&&lc[q]!==LCI.park){if(!rd[q])rd[q]=sty==='grid'&&(x%(gs*3)===0||y%(gs*3)===0)?2:1;}});
    /* 公園：大城市有一兩處綠地 */if(isC&&year>=1850){var np=Math.max(1,Math.round(cells.length/400));for(var pk=0;pk<np;pk++){var q3=cells[Math.floor(r()*cells.length)];brushCells(MP,q3%GW,(q3/GW)|0,Math.max(1,250/cs),function(q){if(own[q]===idx&&lc[q]!==LCI.old&&!rd[q])lc[q]=LCI.park;});}}
    /* 實際範圍與分區名稱 */var A=cells.length*cs*cs;S.r=Math.sqrt(A/PI);S.cells=cells.length;
    if(isC){var grp={};cells.forEach(function(q){var c=lc[q],key=c===LCI.old?'old':c===LCI.port?'port':c===LCI.rly?'rly':c===LCI.ind?'ind':c===LCI.sub?'sub':c===LCI.city&&year>=1960?'cbd':null;if(!key)return;var g2=grp[key]||(grp[key]={n:0,x:0,y:0});g2.n++;g2.x+=q%GW;g2.y+=(q/GW)|0;});
      var DN=NM.style==='west'?{old:'Old Town',port:'Docks',rly:'Station Quarter',ind:'Ironworks',sub:'New Town',cbd:'City Centre'}:{old:'舊城',port:'港區',rly:'車站區',ind:'工業區',sub:'新市區',cbd:'市中心'};
      for(var gk in grp){var g3=grp[gk];if(g3.n<(isC?6:10))continue;lbl.push({k:'dist',x:g3.x/g3.n+0.5,y:g3.y/g3.n+0.5,t:(NM.style==='zh'||NM.style==='westzh'||NM.style==='mixzh'?S.name+DN[gk]:DN[gk]),c:S.name});}
      if(S.walled)lbl.push({k:'dist',x:cx+0.5,y:cy-wallR-0.8,t:NM.style==='west'?'City Walls':'城牆',c:S.name});}});
  function nearWater(j,R){var x=j%GW,y=(j/GW)|0;for(var b=-R;b<=R;b++)for(var a=-R;a<=R;a++){var X=x+a,Y=y+b;if(X<0||Y<0||X>=GW||Y>=GH)continue;var c=lc[Y*GW+X];if(c===LCI.riv||c===LCI.sea||c===LCI.shal||c===LCI.lake)return true;}return false;}
  function findOpposite(cx,cy){var best=-1;for(var R=2;R<30&&best<0;R++){for(var t=0;t<16;t++){var a=t/16*2*PI,X=Math.round(cx+Math.cos(a)*R),Y=Math.round(cy+Math.sin(a)*R);if(X<0||Y<0||X>=GW||Y>=GH)continue;var q=Y*GW+X;if(isWater(lc[q]))continue;/* 與市中心之間隔著河 */var cross=false;for(var s=1;s<R;s++){var q2=Math.round(cy+Math.sin(a)*s)*GW+Math.round(cx+Math.cos(a)*s);if(lc[q2]===LCI.riv){cross=true;break;}}if(cross){best=q;break;}}}return best;}
  /* 依時代與區位決定土地使用 */
  function cityUse(j,ey,sty,dRail,inWall,r){var c=lc[j];if((sty==='coast'||sty==='river'||sty==='twin')&&ey>=1650&&nearWater(j,1)&&r()<0.6)return LCI.port;
    if(ey<1850)return inWall||ey<1650?LCI.old:LCI.town;if(ey<1914){if(dRail<1.5&&r()<0.5)return LCI.rly;if((dRail<3||nearWater(j,2))&&r()<(sty==='ind'||sty==='rail'?0.6:0.3))return LCI.ind;return LCI.town;}
    if(ey<1960){if(dRail<2&&r()<0.35)return LCI.ind;return r()<0.75?LCI.town:LCI.sub;}if(r()<(sty==='ind'?0.25:0.1))return LCI.ind;void c;return LCI.sub;}}
