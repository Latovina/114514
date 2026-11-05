/* ===================== 區域作戰地圖：由世界地圖（或程序產生的大尺度場）放大成寫實的作戰地圖 =====================
   取樣器 S 提供大尺度資料（座標為區域內公尺，原點在左上）：elev、relief、clim、hab、land、lake、nation、rivers、lat */
var ERAYEAR_POP=[[1600,0.25],[1700,0.33],[1800,0.42],[1860,0.55],[1900,0.68],[1916,0.74],[1943,0.85],[1980,1],[2005,1.1],[2030,1.15]];
var ERAYEAR_URB=[[1600,0.1],[1800,0.14],[1860,0.22],[1900,0.35],[1943,0.45],[1980,0.6],[2030,0.72]];
function byYear(T,y){if(y<=T[0][0])return T[0][1];for(var i=1;i<T.length;i++)if(y<T[i][0]){var a=T[i-1],b=T[i];return a[1]+(b[1]-a[1])*(y-a[0])/(b[0]-a[0]);}return T[T.length-1][1];}
function yld(){return new Promise(function(r){setTimeout(r,0);});}
/* 田地與林地的區塊（Voronoi）：同一區塊用同一種土地利用 */
function msd(MP){return MP.sd||(MP.sd=hstr(MP.seed)|0);}
function parcelOf(MP,cx,cy,sz){var s=sz||MP.pcs,gx=Math.floor(cx/s),gy=Math.floor(cy/s),best=1e9,id=0,sd=msd(MP)^0x9e37;for(var b=-1;b<=1;b++)for(var a=-1;a<=1;a++){var X=gx+a,Y=gy+b,h=ih(X,Y,sd),px=(X+((h&1023)/1023))*s,py=(Y+(((h>>10)&1023)/1023))*s,d=(px-cx)*(px-cx)+(py-cy)*(py-cy);if(d<best){best=d;id=h;}}return id;}
/* ---------- 主程序 ---------- */
async function genRegion(spec,S,prog){prog=prog||function(){return Promise.resolve();};var GW=spec.GW,GH=spec.GH,N=GW*GH,cs=spec.cs,seed=String(spec.seed||'w'),year=spec.year||1943,r=mb32(hstr(seed+'|gen')),NZ=new Noise(seed),NZ2=new Noise(seed+'b'),NZ3=new Noise(seed+'c');
  var MP={v:1,format:'LatoWarMap',name:spec.name||'作戰地圖',seed:seed,GW:GW,GH:GH,cs:cs,Wm:GW*cs,Hm:GH*cs,year:year,lat0:spec.lat0||35,lon0:spec.lon0||0,src:spec.src||'proc',world:spec.world||null,pcs:Math.max(3,Math.round(550/cs))};
  var el=new Float32Array(N),mE=new Float32Array(N),rel=new Float32Array(N),Tj=new Float32Array(N),Tl=new Float32Array(N),Pj=new Float32Array(N),Pl=new Float32Array(N),hab=new Float32Array(N),wl=new Uint8Array(N),wlake=new Uint8Array(N),nat=new Uint8Array(N);
  /* 1. 大尺度場：每 K 格取樣一次，雙線性內插 */
  await prog('取樣大尺度地勢與氣候',0.02);var K=8,MW=Math.ceil(GW/K)+1,MH=Math.ceil(GH/K)+1,mm=function(){return new Float32Array(MW*MH);},qE=mm(),qR=mm(),qTj=mm(),qTl=mm(),qPj=mm(),qPl=mm(),qH=mm(),qL=mm();
  for(var j=0;j<MH;j++)for(var i=0;i<MW;i++){var x=Math.min(GW,i*K)*cs,y=Math.min(GH,j*K)*cs,q=j*MW+i,c=S.clim(x,y);qE[q]=S.elevRaw?S.elevRaw(x,y):S.elev(x,y);qR[q]=S.relief(x,y);qTj[q]=c.Tj;qTl[q]=c.Tl;qPj[q]=c.Pj;qPl[q]=c.Pl;qH[q]=S.hab(x,y);qL[q]=S.landF?S.landF(x,y):S.land?S.land(x,y):1;}
  function bil(A,cx,cy){var fx=cx/K,fy=cy/K,i0=Math.min(MW-2,Math.floor(fx)),j0=Math.min(MH-2,Math.floor(fy)),tx=fx-i0,ty=fy-j0,a=A[j0*MW+i0],b=A[j0*MW+i0+1],c2=A[(j0+1)*MW+i0],d=A[(j0+1)*MW+i0+1];return (a*(1-tx)+b*tx)*(1-ty)+(c2*(1-tx)+d*tx)*ty;}
  for(var cy=0;cy<GH;cy++){for(var cx=0;cx<GW;cx++){var k=cy*GW+cx;mE[k]=bil(qE,cx,cy);rel[k]=bil(qR,cx,cy);Tj[k]=bil(qTj,cx,cy);Tl[k]=bil(qTl,cx,cy);Pj[k]=bil(qPj,cx,cy);Pl[k]=bil(qPl,cx,cy);hab[k]=bil(qH,cx,cy);}
    if((cy&63)===0)await prog('取樣大尺度地勢與氣候',0.02+0.06*cy/GH);}
  if(S.lake||S.nation){for(cy=0;cy<GH;cy+=2)for(cx=0;cx<GW;cx+=2){var x2=(cx+1)*cs,y2=(cy+1)*cs,lk=S.lake?S.lake(x2,y2):0,nt=S.nation?S.nation(x2,y2):0;for(var b=0;b<2;b++)for(var a=0;a<2;a++){var X=cx+a,Y=cy+b;if(X<GW&&Y<GH){wlake[Y*GW+X]=lk;nat[Y*GW+X]=nt;}}}}
  /* 2. 細部地勢：分形雜訊，幅度依世界地圖的局部起伏；山區用脊狀雜訊 */
  await prog('細化地勢',0.1);var L1=6000/cs,L2=9000/cs,L3=900/cs;
  for(cy=0;cy<GH;cy++){for(cx=0;cx<GW;cx++){k=cy*GW+cx;var R0=rel[k],A=clamp(10+0.9*R0,6,1600),mf=sm(220,850,R0+0.2*Math.max(0,mE[k]-600));
      var n1=NZ.fbm(cx/L1,cy/L1,6),rg=NZ2.ridge(cx/L2,cy/L2,5)*2-0.85,n3=NZ3.fbm(cx/L3,cy/L3,3);
      var e=mE[k]+A*((1-mf)*n1*0.9+mf*rg*1.25)+A*0.12*n3;
      if(mE[k]<-40&&e>0)e=-1-Math.abs(n3)*5;if(mE[k]>=8&&e<0&&!wlake[k])e=0.5+Math.abs(n3)*4+mE[k]*0.1;el[k]=e;}
    if((cy&63)===0)await prog('細化地勢',0.1+0.12*cy/GH);}
  /* 世界地圖：海岸線依逐格的陸地比例決定（含碎形扭曲），不受 8 格取樣網格限制；海岸附近的陸地從海面高度漸升，不會出現沿取樣格線的直線斷崖 */
  if(S.landF){await prog('海岸線',0.22);for(cy=0;cy<GH;cy++){for(cx=0;cx<GW;cx++){k=cy*GW+cx;if(wlake[k])continue;var i0=Math.min(MW-2,Math.floor(cx/K)),j0=Math.min(MH-2,Math.floor(cy/K)),c00=qL[j0*MW+i0],c10=qL[j0*MW+i0+1],c01=qL[(j0+1)*MW+i0],c11=qL[(j0+1)*MW+i0+1],mn=Math.min(c00,c10,c01,c11),mx=Math.max(c00,c10,c01,c11),lfv;
      if(mn>=0.8)lfv=1;else if(mx<=0.2)lfv=0;else lfv=S.landF((cx+0.5)*cs,(cy+0.5)*cs);var nz=Math.abs(NZ3.fbm(cx/L3+3.3,cy/L3-1.7,2));if(lfv===1&&el[k]>=0.6)continue;
      if(lfv<0.5)el[k]=Math.min(el[k],-1-nz*4-60*(0.5-lfv));else{var base=0.6+nz*3,tt2=sm(0.5,0.75,lfv);el[k]=Math.max(base,base+(el[k]-base)*tt2);}}
    if((cy&63)===0)await prog('海岸線',0.22+0.01*cy/GH);}}
  /* 3. 大河：世界地圖的河道 → 蜿蜒的河道折線，沿線下切河谷與沖積平原 */
  await prog('河道與河谷',0.23);var rv=new Uint8Array(N),wide=new Uint8Array(N),rivs=[];
  (S.rivers||[]).forEach(function(R1,ri){var P=R1.pts;if(!P||P.length<4)return;var cls=R1.cls||2;if(R1.proc&&S.elev(P[0],P[1])<S.elev(P[P.length-2],P[P.length-1])){var Q=[];for(var z=P.length-2;z>=0;z-=2)Q.push(P[z],P[z+1]);P=Q;}var P2=resample(P,Math.max(3*cs,300));if(P2.length<4)return;
    /* 蜿蜒：沿法線方向以雜訊位移，平地蜿蜒較大 */
    var amp=(cls>=4?1800:cls>=3?900:420),out=[];for(var t=0;t<P2.length;t+=2){var i2=Math.min(P2.length-2,t+2),i1=Math.max(0,t-2),dx=P2[i2]-P2[i1],dy=P2[i2+1]-P2[i1+1],L=Math.sqrt(dx*dx+dy*dy)||1,nx=-dy/L,ny=dx/L,cxx=clamp(Math.floor(P2[t]/cs),0,GW-1),cyy=clamp(Math.floor(P2[t+1]/cs),0,GH-1),flat=1-sm(150,700,rel[cyy*GW+cxx]);
      var m=NZ.n(t*0.05+ri*13.1,ri*7.3)*amp*(0.35+0.65*flat)+NZ2.n(t*0.21+ri*3.3,5.5)*amp*0.25;if(t===0||t===P2.length-2)m=0;out.push(P2[t]+nx*m,P2[t+1]+ny*m);}
    var P3=resample(out,Math.max(cs*0.7,60));rivs.push({pts:P3,cls:cls,name:R1.name||''});});
  /* 河道下切：從上游到下游，高程不得上升；河谷寬度依河流等級 */
  var dR=new Float32Array(N).fill(1e9),eR=new Float32Array(N),cR=new Uint8Array(N),cand=new Float32Array(N).fill(1e9);
  rivs.forEach(function(Rv){var P=Rv.pts,n=P.length/2,prof=new Float32Array(n),inc=new Float32Array(n),prev=1e9;for(var t=0;t<n;t++){var xx=clamp(Math.floor(P[t*2]/cs),0,GW-1),yy=clamp(Math.floor(P[t*2+1]/cs),0,GH-1),e=el[yy*GW+xx];
      var tgt=Math.min(e-1.5-Rv.cls,prev-0.0004*Math.max(cs*0.7,60));if(t===0)tgt=e-1.5-Rv.cls;if(mE[yy*GW+xx]>3)tgt=Math.max(tgt,0.6);prof[t]=tgt;prev=tgt;inc[t]=Math.max(0,mE[yy*GW+xx]-tgt);}
    /* 河床縱剖面平滑（移動平均仍保持單調），避免垂直河道方向的斷崖 */
    (function(){var w=Math.max(3,Math.round(2500/Math.max(cs*0.7,60))),pre=new Float64Array(n+1),pi=new Float64Array(n+1);for(var z=0;z<n;z++){pre[z+1]=pre[z]+prof[z];pi[z+1]=pi[z]+inc[z];}for(z=0;z<n;z++){var lo=Math.max(0,z-w),hi=Math.min(n,z+w+1);prof[z]=(pre[hi]-pre[lo])/(hi-lo);inc[z]=(pi[hi]-pi[lo])/(hi-lo);}})();
    /* 河谷半寬：基本寬度依河流等級，下切越深河谷越寬（平均坡度約 6～7%） */
    var WvM=Rv.cls>=4?3500:Rv.cls>=3?1600:600,hw=RVW[Rv.cls]/2/cs;
    for(t=0;t<n;t++){var Wt=clamp(Math.max(WvM,inc[t]*15),WvM,6000)/cs,px=P[t*2]/cs,py=P[t*2+1]/cs,R2=Math.ceil(Wt+1);for(var b2=-R2;b2<=R2;b2++)for(var a2=-R2;a2<=R2;a2++){var X2=Math.floor(px)+a2,Y2=Math.floor(py)+b2;if(X2<0||Y2<0||X2>=GW||Y2>=GH)continue;var k2=Y2*GW+X2,d=Math.sqrt((X2+0.5-px)*(X2+0.5-px)+(Y2+0.5-py)*(Y2+0.5-py));if(d>Wt)continue;
        if(d<dR[k2]){dR[k2]=d;eR[k2]=prof[t];cR[k2]=Rv.cls;}if(d<=Math.max(0.5,hw))wide[k2]=Math.max(wide[k2],hw>=0.5?2:1);
        /* 下切後的地面：對所有河道點取最小值（連續，不會在河道轉彎處出現斷崖） */
        var tt=sm(Wt*(Rv.cls>=3?0.22:0.08),Wt,d),cv=prof[t]+0.6+d*cs*0.0025+(el[k2]-prof[t])*tt;if(cv<cand[k2])cand[k2]=cv;}}
    Rv.hw=hw;Rv.Wv=WvM/cs;});
  for(k=0;k<N;k++){if(dR[k]>1e8)continue;var cl2=cR[k];if(cand[k]<el[k])el[k]=cand[k];
    if(wide[k]){el[k]=Math.min(el[k],eR[k]);if(wide[k]===2)wl[k]=1;rv[k]=Math.max(rv[k],cl2);}}
  /* 4. 水文：填窪（優先佇列）→ 窪地：少數保留為湖泊，其餘切穿出口（必要時部分填平）→ 再次填窪 → 流向與集水 */
  await prog('水文：填窪與集水',0.3);var D8X=[1,1,0,-1,-1,-1,0,1],D8Y=[0,1,1,1,0,-1,-1,-1],D8L=[1,1.4142,1,1.4142,1,1.4142,1,1.4142],eps=0.002,par=new Int32Array(N),order=new Int32Array(N),no=0;
  async function flood(){var fill=new Float32Array(N),done=new Uint8Array(N),H=new Heap();no=0;par.fill(-1);
    for(var k0=0;k0<N;k0++){var x3=k0%GW,y3=(k0/GW)|0;if(el[k0]<0||wlake[k0]||x3===0||y3===0||x3===GW-1||y3===GH-1){fill[k0]=el[k0];done[k0]=1;H.push(k0,el[k0]);}}
    while(H.size()){var c3=H.pop();order[no++]=c3;var xc=c3%GW,yc=(c3/GW)|0,fe=fill[c3];for(var d8=0;d8<8;d8++){var xn=xc+D8X[d8],yn=yc+D8Y[d8];if(xn<0||yn<0||xn>=GW||yn>=GH)continue;var nk=yn*GW+xn;if(done[nk])continue;done[nk]=1;par[nk]=c3;fill[nk]=Math.max(el[nk],fe+eps);H.push(nk,fill[nk]);}
      if((no&131071)===0)await prog('水文：填窪與集水',0.3+0.04*no/N);}return fill;}
  var fill=await flood(),comp=new Int32Array(N).fill(-1),comps=[],stk=[];
  for(k=0;k<N;k++){if(comp[k]>=0||el[k]<0||wlake[k]||fill[k]-el[k]<=0.5)continue;var C0={cells:[],pit:k,D:0,id:comps.length};comp[k]=C0.id;stk.length=0;stk.push(k);
    while(stk.length){var q0=stk.pop(),xq=q0%GW,yq=(q0/GW)|0;C0.cells.push(q0);if(el[q0]<el[C0.pit])C0.pit=q0;var dq=fill[q0]-el[q0];if(dq>C0.D)C0.D=dq;
      for(var d4=0;d4<8;d4+=2){var X4=xq+D8X[d4],Y4=yq+D8Y[d4];if(X4<0||Y4<0||X4>=GW||Y4>=GH)continue;var q1=Y4*GW+X4;if(comp[q1]<0&&el[q1]>=0&&!wlake[q1]&&fill[q1]-el[q1]>0.15){comp[q1]=C0.id;stk.push(q1);}}}
    C0.A=C0.cells.length*cs*cs/1e6;comps.push(C0);}
  /* 湖泊預算：依地勢起伏與降水（冰蝕山區、濕潤地區湖泊較多），最多占陸地約 1.5～5% */
  var landN=0,relM=0;for(k=0;k<N;k+=5)if(el[k]>=0){landN++;relM+=rel[k];}relM=landN?relM/landN:0;var PaM=6*(Pj[(GH>>1)*GW+(GW>>1)]+Pl[(GH>>1)*GW+(GW>>1)]),lakeBudget=landN*5*cs*cs/1e6*clamp(0.012+0.03*sm(300,1200,relM)*sm(400,1100,PaM)+0.012*sm(500,1200,PaM),0.008,0.05),lakeA=0,isLake=new Uint8Array(comps.length);
  comps.slice().sort(function(p,q){return q.D*Math.sqrt(q.A)-p.D*Math.sqrt(p.A);}).forEach(function(C1){if(C1.D>=5&&C1.A>=0.15&&lakeA+C1.A<=lakeBudget&&r()<0.6){isLake[C1.id]=1;lakeA+=C1.A;}});
  var Cmax=clamp(5+0.012*relM,5,14);comps.forEach(function(C2){if(isLake[C2.id])return;var lvl=el[C2.pit];if(C2.D>Cmax){var fl=fill[C2.pit]-Cmax;C2.cells.forEach(function(q2){if(el[q2]<fl)el[q2]=fl+0.001*(q2%7);});lvl=fl;}
    /* 沿淹水來源鏈切出排水道（含兩側緩坡） */
    var p2=par[C2.pit],tg=lvl,steps=0;while(p2>=0&&steps++<4000){tg-=0.01;if(el[p2]<=tg)break;el[p2]=tg;var xp=p2%GW,yp=(p2/GW)|0;for(var b5=-3;b5<=3;b5++)for(var a5=-3;a5<=3;a5++){var X5=xp+a5,Y5=yp+b5;if(X5<0||Y5<0||X5>=GW||Y5>=GH||(!a5&&!b5))continue;var q5=Y5*GW+X5,dq5=Math.sqrt(a5*a5+b5*b5);if(dq5>3.2||el[q5]<=tg||el[q5]<0)continue;var f5=sm(0,3.4,dq5);el[q5]=Math.min(el[q5],tg+0.3*dq5+(el[q5]-tg)*f5);}p2=par[p2];}});
  fill=await flood();var lakeC=new Uint8Array(N);
  for(k=0;k<N;k++){if(el[k]<0)continue;var dk=fill[k]-el[k];if(dk<=0)continue;if(comp[k]>=0&&isLake[comp[k]]&&dk>0.3){lakeC[k]=1;el[k]=fill[k];}else el[k]=fill[k];}
  for(k=0;k<N;k++){if(wlake[k]&&el[k]>=-1)lakeC[k]=1;}
  /* 流向（D8，依填窪後高程）與集水面積（以降水加權） */
  var rcv=new Int32Array(N).fill(-1),acc=new Float32Array(N);for(k=0;k<N;k++){var xk=k%GW,yk=(k/GW)|0,best=-1,bs=0;for(var d8=0;d8<8;d8++){var xn2=xk+D8X[d8],yn2=yk+D8Y[d8];if(xn2<0||yn2<0||xn2>=GW||yn2>=GH)continue;var nk2=yn2*GW+xn2,s=(fill[k]-fill[nk2])/D8L[d8];if(s>bs){bs=s;best=nk2;}}rcv[k]=best;var Pa=6*(Pj[k]+Pl[k]);acc[k]=cs*cs/1e6*clamp(Pa/800,0.05,3);}
  for(var t2=no-1;t2>=0;t2--){var c5=order[t2];if(rcv[c5]>=0&&el[c5]>=0)acc[rcv[c5]]+=acc[c5];}
  await prog('水文：溪流',0.4);var T1=6;for(k=0;k<N;k++){if(el[k]<0||lakeC[k])continue;var A2=acc[k],c6=A2>=T1*800?3:A2>=T1*70?2:A2>=T1?1:0;if(c6>rv[k])rv[k]=c6;}
  /* 坡度（%）與濕度指數 */
  var slope=new Float32Array(N),wet=new Float32Array(N);for(cy=0;cy<GH;cy++)for(cx=0;cx<GW;cx++){k=cy*GW+cx;var ex=el[Math.min(GW-1,cx+1)+cy*GW]-el[Math.max(0,cx-1)+cy*GW],ey=el[cx+Math.min(GH-1,cy+1)*GW]-el[cx+Math.max(0,cy-1)*GW];slope[k]=Math.sqrt(ex*ex+ey*ey)/(2*cs)*100;wet[k]=Math.log(1+acc[k]*1e6/cs/cs)/Math.max(0.3,slope[k]);}
  /* 5. 聚落：依宜居度、平坦、近水、農業條件放置；城市 → 市鎮 → 村落 */
  await prog('聚落',0.45);var lc=new Uint8Array(N),NM=nameGen(seed,spec.nst||'zh'),landA=0;MP.nst=spec.nst||'zh';for(k=0;k<N;k++)if(el[k]>=0&&!lakeC[k])landA+=cs*cs/1e6;
  var dens=0,nd=0;for(k=0;k<N;k+=7){if(el[k]>=0){dens+=hab[k];nd++;}}dens=nd?dens/nd:0;var popD=(6+260*dens*dens)*byYear(ERAYEAR_POP,year)*(spec.dens||1),Ptot=popD*landA,bD=(6+260*dens*dens)*(spec.dens||1);MP.dev=spec.dev&&spec.dev!=='auto'?({low:0.15,mid:0.5,high:0.9}[spec.dev]||0.5):clamp((Math.log(bD)/Math.LN10-0.9)/1.4,0,1);var urb=byYear(ERAYEAR_URB,year);
  var suit=new Float32Array(N),T2=Tj,T3=Tl;for(k=0;k<N;k++){if(el[k]<0||lakeC[k]||wl[k]){suit[k]=0;continue;}var Tm=(T2[k]+T3[k])/2,Pa2=6*(Pj[k]+Pl[k]),fT=sm(-2,9,Tm)*sm(8,16,Math.max(T2[k],T3[k])),fP=Math.max(sm(200,650,Pa2),0.8*(rv[k]>=2?1:0)),fS=1-sm(3,14,slope[k]),fE=sm(3800,1200,el[k]);
    suit[k]=fT*fP*fS*fE*(0.6+0.8*hab[k])*(1+0.3*NZ3.n(k%GW/37,((k/GW)|0)/37));}
  var nearW=new Float32Array(N);(function(){var Rn=Math.ceil(900/cs);for(var k3=0;k3<N;k3++){if(!(rv[k3]>=2||wl[k3]||lakeC[k3]))continue;var x5=k3%GW,y5=(k3/GW)|0;for(var b3=-Rn;b3<=Rn;b3+=2)for(var a3=-Rn;a3<=Rn;a3+=2){var X=x5+a3,Y=y5+b3;if(X<0||Y<0||X>=GW||Y>=GH)continue;nearW[Y*GW+X]=1;}}})();
  for(k=0;k<N;k++){if(suit[k]>0){var coast=0;suit[k]*=(1+0.9*nearW[k])*(1+0.25*sm(10,0,el[k]));void coast;}}
  /* 規模分布：城鎮依等級遞減，其餘人口分散在村落 */
  var sets=[],Purb=Ptot*urb,sizes=[];if(Purb>3000){var s1=Math.max(3000,Purb*0.38);for(var kk=1;kk<40;kk++){var s2=s1/Math.pow(kk,1.05);if(s2<2500)break;sizes.push(s2);if(sum(sizes)>Purb)break;}}
  var Prur=Ptot-sum(sizes),vsz=year<1850?250:year<1950?400:550,nv=clamp(Math.round(Prur/vsz),0,Math.round(landA/1.2)),nvMax=cs>=500?600:cs>=200?1500:4000;if(nv>nvMax){vsz=Prur/nvMax;nv=nvMax;}
  var occ=new Float32Array(Math.ceil(GW/4)*Math.ceil(GH/4)),OW=Math.ceil(GW/4);
  function canPlace(cx2,cy2,dmin){var R3=Math.ceil(dmin/cs/4)+1,gx=Math.floor(cx2/4),gy=Math.floor(cy2/4);for(var b4=-R3;b4<=R3;b4++)for(var a4=-R3;a4<=R3;a4++){var X=gx+a4,Y=gy+b4;if(X<0||Y<0||X>=OW||Y>=Math.ceil(GH/4))continue;var o=occ[Y*OW+X];if(o&&o>0){var ox=(X*4+2),oy=(Y*4+2);if(Math.sqrt((ox-cx2)*(ox-cx2)+(oy-cy2)*(oy-cy2))*cs<dmin+o)return false;}}return true;}
  function bestSite(dmin,tries){var bk=-1,bv=0;for(var i3=0;i3<tries;i3++){var k4=Math.floor(r()*N);if(suit[k4]<=0)continue;var v=suit[k4]*(0.6+0.4*r());if(v>bv&&canPlace(k4%GW,(k4/GW)|0,dmin)){bv=v;bk=k4;}}return bk;}
  function addSet(k5,pop,kind){var x6=k5%GW,y6=(k5/GW)|0,area=pop/(kind==='city'?(year<1900?14000:6500):kind==='town'?(year<1900?9000:4500):2500)*1e6,rad=Math.sqrt(area/PI);
    var S2={x:x6+0.5,y:y6+0.5,pop:Math.round(pop),kind:kind,r:rad,name:kind==='city'?NM.city(x6/GW):kind==='town'?NM.town(x6/GW):NM.village(x6/GW)};sets.push(S2);occ[Math.floor(y6/4)*OW+Math.floor(x6/4)]=Math.max(rad,1);return S2;}
  var bigP=spec.bf==='urban'||spec.bf==='fortress'?Math.round((spec.bf==='urban'?1:0.4)*byYear([[1600,60000],[1800,110000],[1900,320000],[1943,450000],[2000,800000]],year)*clamp(landA/700,0.25,1)*(spec.dens||1)/Math.max(1,spec.dens||1)):0;
  if(spec.fix&&spec.fix.sets){/* 戰役：固定放上大地圖的聚落（名稱、人口、範圍），再補零星小村 */var nfv=0;spec.fix.sets.forEach(function(s9){var k9=clamp(Math.floor(s9.y/cs),0,GH-1)*GW+clamp(Math.floor(s9.x/cs),0,GW-1),S9=addSet(k9,Math.max(1,s9.pop),s9.kind);S9.x=clamp(s9.x/cs,0.5,GW-0.5);S9.y=clamp(s9.y/cs,0.5,GH-0.5);S9.name=s9.name;if(s9.inh===0)S9.inh=0;S9.bi=s9.bi;if(s9.kind==='village')nfv++;});
    var nx9=Math.min(Math.max(0,Math.round(nv*0.5)-nfv),Math.max(2,nfv));for(var v9=0;v9<nx9;v9++){var k10=bestSite(1300+r()*600,60);if(k10>=0)addSet(k10,vsz*(0.3+r()*0.5),'village');}}
  else{if(bigP){var bk=-1,bvv=-1;for(var tb=0;tb<4000;tb++){var kb=Math.floor(GH*(0.35+0.3*r()))*GW+Math.floor(GW*(0.35+0.3*r()));if(suit[kb]<=0)continue;var vb=suit[kb]*(1+nearW[kb])+r()*0.1;if(vb>bvv){bvv=vb;bk=kb;}}if(bk>=0){addSet(bk,bigP,'city');}}
  sizes.forEach(function(p,i4){var kind=p>=30000?'city':'town',k6=bestSite(kind==='city'?9000:3800,2500);if(k6>=0)addSet(k6,p,kind);});
  for(var v=0;v<nv;v++){var k7=bestSite(1100+r()*600,60);if(k7>=0)addSet(k7,vsz*(0.4+r()*1.4),'village');if((v&63)===0)await prog('聚落',0.45+0.05*v/Math.max(1,nv));}}
  /* 6. 地表：自然植被與土地利用（依區塊）、海岸、沼澤、聚落 */
  await prog('地表與土地利用',0.52);var farmI=new Float32Array(N);(function(){var step=2,Wf=Math.ceil(GW/step),Hf=Math.ceil(GH/step),f=new Float32Array(Wf*Hf);sets.forEach(function(S3){var R4=(S3.kind==='city'?9000:S3.kind==='town'?5000:2400*clamp(Math.sqrt(S3.pop/400),0.7,1.5))/cs,cx3=S3.x,cy3=S3.y,w=S3.kind==='village'?1.0:1.4;
      for(var b5=-R4;b5<=R4;b5+=step)for(var a5=-R4;a5<=R4;a5+=step){var X=Math.floor((cx3+a5)/step),Y=Math.floor((cy3+b5)/step);if(X<0||Y<0||X>=Wf||Y>=Hf)continue;var d=Math.sqrt(a5*a5+b5*b5)/R4;if(d>1)continue;f[Y*Wf+X]=Math.max(f[Y*Wf+X],w*(1-d*d));}});
    for(var k8=0;k8<N;k8++){var x8=k8%GW,y8=(k8/GW)|0;farmI[k8]=f[Math.floor(y8/step)*Wf+Math.floor(x8/step)];}})();
  var bocZone=function(cx4,cy4){return NZ2.n(cx4*cs/45000+3.7,cy4*cs/45000-1.1)>0.15;};
  for(cy=0;cy<GH;cy++){for(cx=0;cx<GW;cx++){k=cy*GW+cx;var e2=el[k];if(e2<0){lc[k]=e2<-25?LCI.sea:LCI.shal;continue;}if(lakeC[k]){lc[k]=LCI.lake;continue;}if(wl[k]){lc[k]=LCI.riv;continue;}
      var Tj2=Tj[k]-0.0065*(e2-mE[k]),Tl2=Tl[k]-0.0065*(e2-mE[k]),Tw=Math.max(Tj2,Tl2),Tc=Math.min(Tj2,Tl2),Tm2=(Tj2+Tl2)/2,Pa3=6*(Pj[k]+Pl[k]),sl=slope[k],pid=parcelOf(MP,cx,cy),pr=(pid%1000)/1000,pr2=((pid>>10)%1000)/1000;
      var nf=NZ.fbm(cx*cs/2500,cy*cs/2500,3),nb=NZ3.n(cx*cs/700,cy*cs/700);
      if(Tw<1){lc[k]=LCI.snow;continue;}if(sl>70||(Tw<6&&sl>25)){lc[k]=LCI.rock;continue;}if(Tw<10){lc[k]=sl>30?LCI.rock:LCI.tund;continue;}
      var coastN=false;if(e2<4&&sl<6){for(var d9=0;d9<8&&!coastN;d9+=2){var X9=cx+D8X[d9]*2,Y9=cy+D8Y[d9]*2;if(X9>=0&&Y9>=0&&X9<GW&&Y9<GH&&el[Y9*GW+X9]<0)coastN=true;}}if(coastN&&Pa3<1800){lc[k]=LCI.sand;continue;}
      if(Pa3<180){lc[k]=sl>12?LCI.rock:LCI.desert;continue;}
      var wetI=wet[k],mar=sl<1.2&&Pa3>450&&wetI>6.5+nb*1.5&&e2<900;if(mar&&(nearW[k]||e2<15)){lc[k]=LCI.marsh;continue;}
      var forestP=sm(380,1100,Pa3)*sm(-4,7,Tm2)*(1-sm(3300,4300,e2)),farmP=sm(-1,9,Tm2)*sm(9,16,Tw)*sm(250,600,Pa3)*(1-sm(4,16,sl))*sm(4000,1200,e2);
      var use=farmI[k]*farmP*(year<1850?0.8:1)+(0.12+0.25*sm(15,120,popD))*farmP*(nf>-0.1?1:0.4)-0.25*sm(8,25,sl),fz=forestP*(0.55+0.6*(nf+0.3))+0.25*sm(10,35,sl);if(spec.bf==='forest'){fz+=0.35;use*=0.55;}if(S.lcB){/* 戰役的區域地圖：林地與農地順著大地圖的分布 */var bz9=S.lcB((cx+0.5)*cs,(cy+0.5)*cs);fz+=0.45*bz9;use-=0.35*bz9;}
      if(use>0.3+0.35*pr2&&use>fz*0.6){if(Pa3<380)lc[k]=LCI.mead;else if(Tm2>12&&Pa3<1000&&pr<0.08)lc[k]=LCI.orch;else if(Tc>-1&&Pa3>700&&Tw<23&&bocZone(cx,cy)&&year>=1700)lc[k]=pr<0.75?LCI.hedge:LCI.mead;else lc[k]=pr<0.72?LCI.field:LCI.mead;continue;}
      if(fz>0.45+0.1*nb){lc[k]=Tc>17&&Pa3>1500?LCI.jung:Tc<-6||Tw<15||(e2>1500&&Tc<0)?LCI.cfor:(nb>0.35&&Tc<0?LCI.cfor:LCI.dfor);continue;}
      lc[k]=Pa3<420?(nb>0?LCI.scrub:LCI.mead):fz>0.25?LCI.scrub:LCI.mead;}
    if((cy&63)===0)await prog('地表與土地利用',0.52+0.1*cy/GH);}
  /* 聚落範圍：城市中心、市鎮、村落；近代城市外圍有工業區 */
  sets.forEach(function(S4){if(S4.kind!=='village'&&year>=1000){var q0=Math.floor(S4.y)*GW+Math.floor(S4.x);if(!isWater(lc[q0]))lc[q0]=LCI.town;return;}var R5=Math.max(0.6,S4.r/cs),cx5=S4.x,cy5=S4.y,R6=Math.ceil(R5*1.4);for(var b6=-R6;b6<=R6;b6++)for(var a6=-R6;a6<=R6;a6++){var X=Math.floor(cx5+a6),Y=Math.floor(cy5+b6);if(X<0||Y<0||X>=GW||Y>=GH)continue;var q=Y*GW+X;if(isWater(lc[q]))continue;
      var d=Math.sqrt(a6*a6+b6*b6)/R5*(1+0.35*NZ3.n(X*0.31,Y*0.31));if(d>1)continue;lc[q]=S4.kind==='city'?(d<0.45?LCI.city:LCI.town):S4.kind==='town'?(d<0.5?LCI.town:LCI.vill):LCI.vill;}
    if(S4.kind!=='village'&&year>=1880&&S4.pop>8000){var ang=r()*2*PI,ix=Math.floor(cx5+Math.cos(ang)*R5*1.05),iy=Math.floor(cy5+Math.sin(ang)*R5*1.05),ir=Math.max(1,R5*0.35);for(var b7=-ir;b7<=ir;b7++)for(var a7=-ir;a7<=ir;a7++){var X2=Math.floor(ix+a7),Y2=Math.floor(iy+b7);if(X2<0||Y2<0||X2>=GW||Y2>=GH)continue;var q2=Y2*GW+X2;if(!isWater(lc[q2])&&a7*a7+b7*b7<=ir*ir)lc[q2]=LCI.ind;}}});
  /* 7. 道路與鐵路 */
  await prog('道路網',0.64);var rd=new Uint8Array(N),rl=new Uint8Array(N),brg=[];MP.el=el;MP.lc=lc;MP.rv=rv;MP.rd=rd;MP.rl=rl;MP.tn=new Uint8Array(N);MP.ft=new Uint8Array(N);
  if(spec.keep){MP._keep=1;MP._rdp=[];MP._rlp=[];}
  roadNet(MP,sets,slope,r,year,spec);await prog('道路網',0.8);
  if(spec.fix&&spec.fix.rails){cmpRailFix(MP,slope,spec.fix.rails);}else{
  if(spec.rail!==false&&year>=1840)railNet(MP,sets,slope,r,year);
  if(spec.rail!==false&&spec.hsr!==false&&year>=1964)hsrNet(MP,sets,r,year);}
  await prog('城市發展',0.82);var cityLbl=[];growCities(MP,sets,slope,r,year,spec,NM,cityLbl);
  for(k=0;k<N;k++){if((rd[k]||(rl[k]&1))&&!MP.tn[k]&&(rv[k]>=2||lc[k]===LCI.riv)){brg.push({x:k%GW,y:(k/GW)|0,c:Math.max(rv[k],lc[k]===LCI.riv?3:0),t:'p'});}}
  /* 8. 地名：聚落、河流、高地、森林、湖泊 */
  await prog('地名與標高',0.86);var lbl=cityLbl;
  rivs.forEach(function(Rv2){var P=Rv2.pts,best2=null;for(var t3=0.35;t3<=0.65;t3+=0.15){var q3=plAt(P,t3);if(q3.x>0&&q3.y>0&&q3.x<MP.Wm&&q3.y<MP.Hm){best2=q3;break;}}if(!best2)return;var nm=Rv2.name||NM.river(Rv2.cls>=3,best2.x/MP.Wm);Rv2.name=nm;lbl.push({k:'river',x:best2.x/cs,y:best2.y/cs,t:nm,a:best2.a,s:Rv2.cls});});
  hillLabels(MP,el,lbl,NM);patchLabels(MP,lc,lbl,NM);
  /* 9. 輸出 */
  var EL=new Int16Array(N);for(k=0;k<N;k++)EL[k]=clamp(Math.round(el[k]),-11000,9000);
  Object.assign(MP,{el:EL,lc:lc,rv:rv,rd:rd,rl:rl,tn:MP.tn,ft:MP.ft,nat:nat,set:sets.map(function(s){return {x:+s.x.toFixed(2),y:+s.y.toFixed(2),pop:s.pop,kind:s.kind,r:+s.r.toFixed(0),name:s.name,sty:s.sty,fd:s.founded,wall:s.walled?1:0,inh:s.inh,bi:s.bi};}),lbl:lbl,brg:brg,
    rivs:rivs.map(function(R7){return {name:R7.name,cls:R7.cls,pts:simplify(R7.pts,cs*0.3).map(function(v){return Math.round(v);})};}),
    clim:{Tj:avgOf(Tj),Tl:avgOf(Tl),Pj:avgOf(Pj),Pl:avgOf(Pl)},nations:S.nations||[],popD:popD,Ptot:Ptot});
  if(MP._keep){MP.rdp=cmpPaths(MP,MP._rdp);MP.rlp=cmpPaths(MP,MP._rlp);delete MP._keep;delete MP._rdp;delete MP._rlp;}
  function avgOf(A3){var s3=0,n3=0;for(var q4=0;q4<N;q4+=11){s3+=A3[q4];n3++;}return n3?s3/n3:0;}
  await prog('完成',1);return MP;}
/* ---------- 道路網：城鎮之間最小生成樹＋捷徑；村落接到最近的路；通往地圖邊緣 ---------- */
function roadCost(MP,slope,k,kind){var lc=MP.lc[k],c=LC[lc];if(isWater(lc)&&lc!==LCI.riv)return 0;var s=slope[k],cost=1+Math.pow(s*(kind==='rail'?0.6:0.22),2);
  if(kind==='rail'&&s>3)cost*=4;if(lc===LCI.riv)cost+=kind==='rail'?30:18;else if(MP.rv[k])cost+=[0,2,6,14,28][MP.rv[k]]*(kind==='rail'?1.5:1);
  if(lc===LCI.marsh)cost+=4;else if(lc===LCI.dfor||lc===LCI.cfor||lc===LCI.jung)cost+=0.6;else if(lc===LCI.rock||lc===LCI.snow)cost+=2;
  if(kind!=='rail'&&MP.rd[k])cost*=MP.rd[k]>=3?0.3:0.45;if(kind==='rail'&&MP.rl[k])cost*=0.3;void c;return cost;}
function gridPath(MP,slope,a,b,kind,maxN){var GW=MP.GW,GH=MP.GH,N=GW*GH,g=new Float64Array(N).fill(Infinity)/* 64 位元：32 位元的捨入誤差會讓相鄰兩格互相「改善」而無限循環 */,from=new Int32Array(N).fill(-1),H=new Heap(),bx=b%GW,by=(b/GW)|0,cnt=0,cs=MP.cs;
  var D8X=[1,1,0,-1,-1,-1,0,1],D8Y=[0,1,1,1,0,-1,-1,-1],D8L=[1,1.4142,1,1.4142,1,1.4142,1,1.4142];g[a]=0;H.push(a,0);
  while(H.size()){var c=H.pop();if(c===b)break;if(++cnt>(maxN||400000))return null;var x=c%GW,y=(c/GW)|0;for(var d=0;d<8;d++){var X=x+D8X[d],Y=y+D8Y[d];if(X<0||Y<0||X>=GW||Y>=GH)continue;var k=Y*GW+X,cc=roadCost(MP,slope,k,kind);if(!cc)continue;
      var ng=g[c]+cc*D8L[d];if(ng<g[k]){g[k]=ng;from[k]=c;var h=Math.sqrt((X-bx)*(X-bx)+(Y-by)*(Y-by))*(kind==='rail'?0.6:0.8);H.push(k,ng+h);}}}
  if(from[b]<0&&a!==b)return null;var P=[],cur=b;while(cur>=0){P.push(cur);if(cur===a)break;cur=from[cur];}void cs;return P.reverse();}
function roadNet(MP,sets,slope,r,year,spec){var GW=MP.GW,GH=MP.GH,rd=MP.rd,mF=Math.max(1,Math.pow(50/MP.cs,2)),dev=MP.dev===undefined?0.5:MP.dev,hwy=year>=1935&&(dev>=0.6||(year>=1960&&dev>=0.4)||(year>=1990&&dev>=0.28)),hwP=year>=1965?15000:30000,towns=sets.filter(function(s){return s.kind!=='village';}).sort(function(a,b){return b.pop-a.pop;});
  var K=function(s){return clamp(Math.floor(s.y),0,GH-1)*GW+clamp(Math.floor(s.x),0,GW-1);},lay=function(P,cls){if(!P)return;if(cls>=2)P=tunnelize(MP,P,'road',year,dev);P.forEach(function(k){if(rd[k]<cls)rd[k]=cls;});if(MP._keep&&P.length>1)MP._rdp.push([cls,P]);};
  if(spec&&spec.fix&&spec.fix.roads){cmpLayFix(MP,slope,spec.fix.roads,lay,mF);}else{
  /* 城鎮：最小生成樹（Prim）＋第二近的捷徑 */
  if(towns.length>1){var inT=[towns[0]],out=towns.slice(1),edges=[];while(out.length){var bd=1e18,bi=-1,bj=-1;for(var i=0;i<inT.length;i++)for(var j=0;j<out.length;j++){var d=dist(inT[i].x,inT[i].y,out[j].x,out[j].y);if(d<bd){bd=d;bi=i;bj=j;}}edges.push([inT[bi],out[bj]]);inT.push(out[bj]);out.splice(bj,1);}
    towns.forEach(function(t){var ns=towns.filter(function(u){return u!==t;}).sort(function(a,b){return dist(t.x,t.y,a.x,a.y)-dist(t.x,t.y,b.x,b.y);});if(ns[1]&&dist(t.x,t.y,ns[1].x,ns[1].y)*MP.cs<35000&&r()<0.3+0.5*dev)edges.push([t,ns[1]]);});
    edges.forEach(function(e){var big=hwy&&e[0].pop>=hwP&&e[1].pop>=hwP,P=gridPath(MP,slope,K(e[0]),K(e[1]),'road',GW*GH*4);lay(P,big?4:3);});}
  /* 通往地圖邊緣：主要城鎮各有 1～2 條出口 */
  towns.slice(0,Math.max(2,Math.ceil(towns.length/2))).forEach(function(t,ti){var n=ti===0?3:1+(r()<0.5?1:0);for(var q=0;q<n;q++){var ang=r()*2*PI,ex=t.x+Math.cos(ang)*1e5,ey=t.y+Math.sin(ang)*1e5,s=Math.min(Math.abs((Math.cos(ang)>0?GW-1-t.x:t.x)/(Math.cos(ang)||1e-9)),Math.abs((Math.sin(ang)>0?GH-1-t.y:t.y)/(Math.sin(ang)||1e-9)));
      ex=clamp(Math.round(t.x+Math.cos(ang)*s),0,GW-1);ey=clamp(Math.round(t.y+Math.sin(ang)*s),0,GH-1);var k2=ey*GW+ex,tries=0;while(isWater(MP.lc[k2])&&tries++<40){ex=clamp(ex+Math.round((r()-0.5)*20),0,GW-1);ey=clamp(ey+Math.round((r()-0.5)*20),0,GH-1);k2=ey*GW+ex;}
      if(!isWater(MP.lc[k2]))lay(gridPath(MP,slope,K(t),k2,'road',250000*mF),ti===0&&hwy&&t.pop>=hwP&&q===0?4:dev<0.2&&ti>0&&year<1950?2:3);}});
  if(!towns.length&&sets.length){var s0=sets[0];lay(gridPath(MP,slope,K(s0),Math.floor(GH/2)*GW,'road',250000*mF),2);}
  /* 過境高速公路：開發程度高的地區，跨區域的高速公路穿過地圖（經過最大城鎮附近） */
  if(hwy&&(dev>=0.6||year>=1990)){var nT=dev>=0.85&&year>=1990?2:1,c0=towns[0]||{x:GW/2,y:GH/2};for(var q2=0;q2<nT;q2++){var ang2=r()*PI+q2*PI/2,eA=edgeFrom(GW,GH,c0.x,c0.y,ang2),eB=edgeFrom(GW,GH,c0.x,c0.y,ang2+PI);
      [[eA,c0],[c0,eB]].forEach(function(sg){var a=K(sg[0]),b=K(sg[1]);if(isWater(MP.lc[a])||isWater(MP.lc[b]))return;lay(gridPath(MP,slope,a,b,'road',300000*mF),4);});}}
  }
  /* 村落：接到最近的道路或聚落 */
  var vil=sets.filter(function(s){return s.kind==='village';});vil.forEach(function(v){var bx=Math.floor(v.x),by=Math.floor(v.y),R=Math.ceil(6000/MP.cs),best=-1,bd2=1e18;
    for(var b=-R;b<=R;b+=1)for(var a=-R;a<=R;a+=1){var X=bx+a,Y=by+b;if(X<0||Y<0||X>=GW||Y>=GH)continue;var k=Y*GW+X;if(rd[k]&&a*a+b*b>1){var d=a*a+b*b;if(d<bd2){bd2=d;best=k;}}}
    if(best<0){var nn=sets.filter(function(u){return u!==v;}).sort(function(p,q){return dist(v.x,v.y,p.x,p.y)-dist(v.x,v.y,q.x,q.y);})[0];if(nn&&dist(v.x,v.y,nn.x,nn.y)*MP.cs<9000)best=K(nn);}
    if(best>=0)lay(gridPath(MP,slope,K(v),best,'road',60000*mF),(v.pop>500&&(dev>0.3||year>=1950))||(dev>0.6&&year>=1950)?2:1);});
  /* 小路：鄰近村落之間的田間小路與山徑 */
  vil.forEach(function(v){var nn=vil.filter(function(u){return u!==v;}).sort(function(p,q){return dist(v.x,v.y,p.x,p.y)-dist(v.x,v.y,q.x,q.y);});for(var i=0;i<2&&i<nn.length;i++){var o=nn[i];if(dist(v.x,v.y,o.x,o.y)*MP.cs>5500||r()>0.65-0.15*i)continue;lay(gridPath(MP,slope,K(v),K(o),'road',40000*mF),1);}});
  if(!(spec&&spec.fix&&spec.fix.roads))roadEdges(MP,slope,year,dev,lay,mF);}

/* 每個陸地邊緣至少一條出入道路（真實的地區道路網一定通往地圖外）；完全沒有道路時鋪一條過境道路 */
function roadEdges(MP,slope,year,dev,lay,mF){var GW=MP.GW,GH=MP.GH,rd=MP.rd,lc=MP.lc,cls=year<1650?1:year>=1930&&dev>=0.4?3:2,any=false;for(var k=0;k<GW*GH;k++)if(rd[k]){any=true;break;}
  var land=function(x,y){return !isWater(lc[clamp(y,0,GH-1)*GW+clamp(x,0,GW-1)]);};
  if(!any){var y0=Math.floor(GH/2),a=-1,b=-1;for(var d=0;d<GH/2&&(a<0||b<0);d++){[y0+d,y0-d].forEach(function(y){if(y<0||y>=GH)return;if(a<0&&land(0,y))a=y*GW;if(b<0&&land(GW-1,y))b=y*GW+GW-1;});}if(a>=0&&b>=0){var P0=gridPath(MP,slope,a,b,'road',600000*mF);if(P0)lay(P0,cls);else{/* 中間被大河或湖泊隔開：兩側各自鋪到地圖中段 */[[a,0.4],[b,0.6]].forEach(function(q){var tx=Math.floor(GW*q[1]),t=-1;for(var d2=0;d2<GW*0.3&&t<0;d2++){[tx+d2,tx-d2].forEach(function(x){if(t<0&&x>=0&&x<GW&&land(x,y0))t=y0*GW+x;});}if(t>=0)lay(gridPath(MP,slope,q[0],t,'road',400000*mF),cls);});}}}
  ['W','E','N','S'].forEach(function(e){var n=e==='W'||e==='E'?GH:GW,has=false;for(var i=0;i<n&&!has;i++)for(var dd=0;dd<2;dd++){var X=e==='W'?dd:e==='E'?GW-1-dd:i,Y=e==='N'?dd:e==='S'?GH-1-dd:i;if(rd[Y*GW+X]){has=true;break;}}if(has)return;
    var best=-1,bd=1e18;for(var q=0;q<GW*GH;q++){if(!rd[q])continue;var x=q%GW,y=(q-x)/GW,dE=e==='W'?x:e==='E'?GW-1-x:e==='N'?y:GH-1-y,off=e==='W'||e==='E'?Math.abs(y-GH/2):Math.abs(x-GW/2),sc=dE+off*0.25;if(sc<bd){bd=sc;best=q;}}if(best<0)return;
    var bx=best%GW,by=(best-bx)/GW,t=-1;for(var s2=0;s2<n&&t<0;s2++){[s2,-s2].forEach(function(o){if(t>=0)return;var X=e==='W'?0:e==='E'?GW-1:bx+o,Y=e==='N'?0:e==='S'?GH-1:by+o;if(X<0||Y<0||X>=GW||Y>=GH)return;if(land(X,Y))t=Y*GW+X;});}if(t<0)return;
    lay(gridPath(MP,slope,best,t,'road',400000*mF),cls);});}
function railNet(MP,sets,slope,r,year){var GW=MP.GW,GH=MP.GH,dev=MP.dev===undefined?0.5:MP.dev,big=sets.filter(function(s){return s.kind!=='village'&&s.pop>=2000;}).sort(function(a,b){return b.pop-a.pop;}).slice(0,(year||1943)<1870?4:Math.round(3+7*dev));if(big.length<1){var v0=sets.slice().sort(function(a,b){return b.pop-a.pop;})[0];if(v0&&v0.pop>=700&&r()<0.6)big=[v0];else return;}var K=function(s){return clamp(Math.floor(s.y),0,GH-1)*GW+clamp(Math.floor(s.x),0,GW-1);};
  var lay=function(P){if(P){P=tunnelize(MP,P,'rail',year||1943,dev);P.forEach(function(k){MP.rl[k]|=1;});if(MP._keep&&P.length>1)MP._rlp.push([0,P]);}};for(var i=1;i<big.length;i++){var prev=big.slice(0,i).sort(function(a,b){return dist(big[i].x,big[i].y,a.x,a.y)-dist(big[i].x,big[i].y,b.x,b.y);})[0];lay(gridPath(MP,slope,K(big[i]),K(prev),'rail',GW*GH*4));}
  var t=big[0],ang=r()*2*PI;for(var q=0;q<2;q++){var a2=ang+q*PI,ex=clamp(Math.round(t.x+Math.cos(a2)*GW),0,GW-1),ey=clamp(Math.round(t.y+Math.sin(a2)*GH),0,GH-1),k=ey*GW+ex;if(!isWater(MP.lc[k]))lay(gridPath(MP,slope,K(t),k,'rail',250000));}}
function edgeFrom(GW,GH,x,y,ang){var ca=Math.cos(ang),sa=Math.sin(ang),s=1e9;if(ca>0.01)s=Math.min(s,(GW-1-x)/ca);if(ca<-0.01)s=Math.min(s,-x/ca);if(sa>0.01)s=Math.min(s,(GH-1-y)/sa);if(sa<-0.01)s=Math.min(s,-y/sa);return {x:clamp(x+ca*s,0,GW-1),y:clamp(y+sa*s,0,GH-1)};}
/* ---------- 隧道：道路或鐵路為繞過山體而大幅迂迴時，改以直線隧道穿越（鐵路 1860 年後、公路 1930 年後） ---------- */
function tunnelize(MP,P,kind,year,dev){if(!P||P.length<16)return P;if(kind==='rail'?year<1860:(year<1930||(dev!==undefined&&dev<0.25)))return P;var GW=MP.GW,cs=MP.cs,el=MP.el,n=P.length,out=[],i=0,bit=kind==='rail'?2:1,tn=MP.tn||(MP.tn=new Uint8Array(GW*MP.GH)),maxS=kind==='rail'?6000:3500;
  var L=new Float32Array(n);for(var q=1;q<n;q++){var a=P[q-1],b=P[q];L[q]=L[q-1]+Math.sqrt(Math.pow(a%GW-b%GW,2)+Math.pow(((a/GW)|0)-((b/GW)|0),2))*cs;}
  while(i<n){var best=-1,bg=0;for(var j=i+6;j<n&&L[j]-L[i]<14000;j+=2){var ax=P[i]%GW,ay=(P[i]/GW)|0,bx=P[j]%GW,by=(P[j]/GW)|0,sd=Math.sqrt((ax-bx)*(ax-bx)+(ay-by)*(ay-by))*cs;if(sd<250||sd>maxS)continue;var pl=L[j]-L[i];if(pl<sd*1.6)continue;
      var st=Math.max(2,Math.ceil(sd/cs)),hi=0,e0=el[P[i]],e1=el[P[j]],wet=false;for(var s2=1;s2<st;s2++){var t=s2/st,k=Math.round(ay+(by-ay)*t)*GW+Math.round(ax+(bx-ax)*t);if(isWater(MP.lc[k])){wet=true;break;}var h=el[k]-(e0+(e1-e0)*t);if(h>hi)hi=h;}
      if(wet||hi<40)continue;if(pl-sd>bg){bg=pl-sd;best=j;}}
    if(best<0){out.push(P[i]);i++;continue;}
    var ax2=P[i]%GW,ay2=(P[i]/GW)|0,bx2=P[best]%GW,by2=(P[best]/GW)|0,st2=Math.max(Math.abs(bx2-ax2),Math.abs(by2-ay2)),e0b=el[P[i]],e1b=el[P[best]];
    for(var s3=0;s3<=st2;s3++){var t2=s3/st2,k2=Math.round(ay2+(by2-ay2)*t2)*GW+Math.round(ax2+(bx2-ax2)*t2);if(out[out.length-1]!==k2)out.push(k2);if(s3>0&&s3<st2&&el[k2]-(e0b+(e1b-e0b)*t2)>12)tn[k2]|=bit;}
    i=best+1;}
  return out;}
/* 地圖編修：直線鋪設橋梁或隧道（使用目前選擇的道路等級） */
function editStraight(MP,a,b,cls,kind){var GW=MP.GW,ax=a%GW,ay=(a/GW)|0,bx=b%GW,by=(b/GW)|0,st=Math.max(1,Math.max(Math.abs(bx-ax),Math.abs(by-ay))),e0=MP.el[a],e1=MP.el[b],ks=[],tn=MP.tn||(MP.tn=new Uint8Array(GW*MP.GH));
  for(var s=0;s<=st;s++){var t=s/st,k=Math.round(ay+(by-ay)*t)*GW+Math.round(ax+(bx-ax)*t);if(ks[ks.length-1]===k)continue;ks.push(k);MP.rd[k]=Math.max(MP.rd[k],cls||2);
    if(kind==='tunnel'){if(s>0&&s<st)tn[k]|=1;}else if((isWater(MP.lc[k])||MP.rv[k])&&!MP.brg.some(function(q){return q.y*GW+q.x===k;}))MP.brg.push({x:k%GW,y:(k/GW)|0,c:Math.max(MP.rv[k],isWater(MP.lc[k])?3:0),t:'p'});}
  return ks;}
/* ---------- 高鐵：開發程度高的地區（1964 年後）連接大城市並延伸到地圖邊緣；高架與隧道，幾乎筆直 ---------- */
function hsrNet(MP,sets,r,year){var dev=MP.dev===undefined?0.5:MP.dev,minP=year>=2005?40000:year>=1985?60000:90000;if(dev<(year>=2000?0.45:0.65))return;var Q=sets.filter(function(s){return s.kind==='city'&&s.pop>=minP;}).sort(function(a,b){return b.pop-a.pop;}).slice(0,4);if(!Q.length){/* 過境高鐵：路線穿過本區，不一定設站 */if(dev>=0.75&&year>=1990&&r()<0.7){var T=sets.filter(function(s){return s.kind!=='village';}).sort(function(a,b){return b.pop-a.pop;})[0];Q=[T||{x:MP.GW/2,y:MP.GH/2}];}else return;}
  var GW=MP.GW,GH=MP.GH,ang=Q.length>=2?Math.atan2(Q[1].y-Q[0].y,Q[1].x-Q[0].x):r()*2*PI,ax=Math.cos(ang),ay=Math.sin(ang);Q.sort(function(a,b){return (a.x*ax+a.y*ay)-(b.x*ax+b.y*ay);});
  var toEdge=function(p,sg){var s=1e9;if(ax*sg>0.01)s=Math.min(s,(GW-1-p.x)/(ax*sg));if(ax*sg<-0.01)s=Math.min(s,-p.x/(ax*sg));if(ay*sg>0.01)s=Math.min(s,(GH-1-p.y)/(ay*sg));if(ay*sg<-0.01)s=Math.min(s,-p.y/(ay*sg));return {x:p.x+ax*sg*s,y:p.y+ay*sg*s};};
  var W=[toEdge(Q[0],-1)].concat(Q,[toEdge(Q[Q.length-1],1)]);for(var i=1;i<W.length;i++){var ks9=hsrLine(MP,W[i-1].x,W[i-1].y,W[i].x,W[i].y);if(ks9&&MP._keep&&ks9.length>1)MP._rlp.push([1,ks9]);}}
function hsrLine(MP,x0,y0,x1,y1){var GW=MP.GW,GH=MP.GH,n=Math.ceil(Math.max(Math.abs(x1-x0),Math.abs(y1-y0))*1.5)+1,ks=[],sea=0;for(var i=0;i<=n;i++){var t=i/n,X=clamp(Math.floor(x0+(x1-x0)*t),0,GW-1),Y=clamp(Math.floor(y0+(y1-y0)*t),0,GH-1),k=Y*GW+X;if(MP.lc[k]===LCI.sea)sea++;if(ks[ks.length-1]!==k)ks.push(k);}
  if(sea>ks.length*0.15)return false;ks.forEach(function(k){if(MP.lc[k]!==LCI.sea)MP.rl[k]|=2;});return ks;}
/* ---------- 標高：局部最高點（突起度足夠者）標為「高地」或「山」 ---------- */
function hillLabels(MP,el,lbl,NM){var GW=MP.GW,GH=MP.GH,cs=MP.cs,R=Math.max(4,Math.round(1800/cs)),cand=[];
  for(var y=R;y<GH-R;y+=Math.max(2,R>>1))for(var x=R;x<GW-R;x+=Math.max(2,R>>1)){var bk=-1,be=-1e9;for(var b=-(R>>1);b<=(R>>1);b++)for(var a=-(R>>1);a<=(R>>1);a++){var k=(y+b)*GW+x+a;if(el[k]>be){be=el[k];bk=k;}}
    if(bk<0||be<=5)continue;var bx=bk%GW,by=(bk/GW)|0,mx=true,mn=1e9;for(var b2=-R;b2<=R&&mx;b2+=2)for(var a2=-R;a2<=R;a2+=2){var X=bx+a2,Y=by+b2;if(X<0||Y<0||X>=GW||Y>=GH)continue;var e=el[Y*GW+X];if(e>be+0.01){mx=false;break;}if(e<mn)mn=e;}
    if(mx&&be-mn>Math.max(25,cs*0.15))cand.push({k:bk,e:be,p:be-mn});}
  var seen={};cand.sort(function(p,q){return q.p-p.p;});var n=0,maxN=Math.round(GW*GH/9000)+6;cand.forEach(function(c){if(seen[c.k]||n>=maxN)return;seen[c.k]=1;var x=c.k%GW,y=(c.k/GW)|0;if(lbl.some(function(l){return (l.k==='hill'||l.k==='mtn')&&Math.abs(l.x-x)<R&&Math.abs(l.y-y)<R;}))return;
    var big=c.e>=900&&c.p>=200;lbl.push({k:big?'mtn':'hill',x:x+0.5,y:y+0.5,t:big?NM.hill((x+0.5)/MP.GW):'',e:Math.round(c.e)});n++;});}
/* 森林、湖泊的名稱（面積夠大的連通區） */
function patchLabels(MP,lc,lbl,NM){var GW=MP.GW,GH=MP.GH,N=GW*GH,cs=MP.cs,lab=new Uint8Array(N),st=[];
  for(var s0=0;s0<N;s0+=3){var c=lc[s0],kind=c===LCI.dfor||c===LCI.cfor||c===LCI.jung?'forest':c===LCI.lake?'lake':null;if(!kind||lab[s0])continue;var n=0,sx=0,sy=0;lab[s0]=1;st.length=0;st.push(s0);
    while(st.length){var q=st.pop(),x=q%GW,y=(q/GW)|0;n++;sx+=x;sy+=y;for(var d=0;d<4;d++){var X=x+(d===0?1:d===1?-1:0),Y=y+(d===2?1:d===3?-1:0);if(X<0||Y<0||X>=GW||Y>=GH)continue;var k=Y*GW+X;if(lab[k])continue;var c2=lc[k];if(kind==='forest'?(c2===LCI.dfor||c2===LCI.cfor||c2===LCI.jung):c2===LCI.lake){lab[k]=1;st.push(k);}}}
    var area=n*cs*cs/1e6;if((kind==='forest'&&area>=12)||(kind==='lake'&&area>=0.8))lbl.push({k:kind,x:sx/n+0.5,y:sy/n+0.5,t:kind==='forest'?NM.forest((sx/n+0.5)/MP.GW):NM.lake((sx/n+0.5)/MP.GW),a:area});}}
/* ---------- 程序產生的大尺度場（不使用世界地圖時） ---------- */
var PCLIM={temperate:['溫帶濕潤',1,21,60,85],maritime:['溫帶海洋',5,17,85,60],continental:['大陸性',-11,22,22,80],medit:['地中海型',10,26,95,8],arid:['乾燥',12,33,8,4],tropical:['熱帶雨林',26,27,230,260],monsoon:['季風',4,28,15,280],subarctic:['亞寒帶',-20,15,20,65]};
var PTER={plain:['平原',120,25],hills:['丘陵',350,120],mount:['山地',1500,650],coast:['海岸',60,60],valley:['大河河谷',150,140],mixed:['混合地形',300,180],island:['島嶼',40,120]};
function procSampler(o){var seed=String(o.seed||'p'),NZ=new Noise(seed+'|macro'),T=PTER[o.ter]||PTER.mixed,C=PCLIM[o.clim]||PCLIM.temperate,Wm=o.Wm,Hm=o.Hm,r=mb32(hstr(seed+'|riv')),sideA=r()*2*PI;if(o.sea!==undefined&&o.sea!==null)sideA=o.sea;
  /* 島嶼：每座島為一個可旋轉的橢圓［中心 u、v，半徑 u、v，高度倍率，方位角，主峰高度（公尺）］，海岸線加上雜訊 */
  var ISL=o.isl||(o.ter==='island'?[[0.5,0.5,0.3,0.24,1,0,250]]:null);
  function islH(u,v){var e=-1e9;ISL.forEach(function(q){var ca=Math.cos(q[5]||0),sa=Math.sin(q[5]||0),du=u-q[0],dv=v-q[1],X=(du*ca+dv*sa)/q[2],Y=(-du*sa+dv*ca)/q[3],rr=Math.sqrt(X*X+Y*Y)+0.17*NZ.fbm(u*5+q[0]*9,v*5+q[1]*9,5)+0.045*NZ.fbm(u*23+q[0]*3,v*23+q[1]*7,4),h=1-rr,z=h>0?(T[1]*q[4]*(0.3+1.2*h)+T[2]*q[4]*NZ.fbm(u*3+5,v*3+5,3)*h*1.4+(q[6]||0)*Math.pow(h,1.6)):-5-160*Math.min(1,-h/0.3);if(z>e)e=z;});return e;}
  var S={nations:[],elev:function(x,y){var u=x/Wm,v=y/Hm;if(o.ter==='island')return islH(u,v);var base=T[1]+T[2]*1.4*NZ.fbm(u*2.2,v*2.2,4);
      if(o.ter==='coast'){var cx=Math.cos(sideA),cy=Math.sin(sideA),wu=u+0.05*NZ.fbm(u*6+11,v*6+3,4),wv=v+0.05*NZ.fbm(u*6-7,v*6+19,4),t=(wu-0.5)*cx+(wv-0.5)*cy+0.12*NZ.fbm(wu*3,wv*3,5)+0.025*NZ.fbm(u*18+5,v*18+2,4)+(o.coff||0);base=base*sm(-0.05,0.25,-t)+(-180*sm(-0.05,0.3,t));}
      if(o.ter==='mount')base+=600*NZ.n(u*1.3+5,v*1.3);var e=o.ter==='coast'?base:Math.max(base,15);if(ISL&&o.ter==='coast'){var ih=islH(u,v);if(ih>0&&ih>e)e=ih;}return e;},
    relief:function(x,y){var u=x/Wm,v=y/Hm;return T[2]*(0.7+0.6*(NZ.n(u*3+9,v*3)+0.5));},
    clim:function(x,y){var v=y/Hm;return {Tj:C[1]-1.5*(v-0.5),Tl:C[2]-1.5*(v-0.5),Pj:C[3],Pl:C[4]};},
    hab:function(x,y){var u=x/Wm,v=y/Hm;return clamp(0.45+0.35*NZ.n(u*2+3,v*2+7)+(o.ter==='mount'?-0.25:0),0.05,1);},isl:ISL,
    land:function(){return 1;},rivers:[]};
  if(o.ter==='valley'||o.ter==='plain'||o.ter==='coast'||o.ter==='mixed'||o.riv!==undefined){var a=o.riv!==undefined?o.riv+(r()-0.5)*0.5:r()*2*PI,cls=o.riv!==undefined?4:o.ter==='valley'?4:o.ter==='plain'?3:2,P=[],x0=Wm/2-Math.cos(a)*Wm,y0=Hm/2-Math.sin(a)*Hm;for(var i=0;i<=40;i++){var t2=i/40;P.push(x0+Math.cos(a)*2*Wm*t2+NZ.n(t2*4,1.7)*Wm*0.12,y0+Math.sin(a)*2*Hm*t2+NZ.n(t2*4,4.1)*Hm*0.12);}
    if(o.ter==='coast'){P=[];var ex=Wm/2+Math.cos(sideA)*Wm*0.7,ey=Hm/2+Math.sin(sideA)*Hm*0.7,sx=Wm/2-Math.cos(sideA)*Wm*0.8+Math.cos(sideA+1.6)*Wm*0.2,sy=Hm/2-Math.sin(sideA)*Hm*0.8+Math.sin(sideA+1.6)*Hm*0.2;for(i=0;i<=30;i++){var t3=i/30;P.push(sx+(ex-sx)*t3+NZ.n(t3*3,8)*Wm*0.08,sy+(ey-sy)*t3+NZ.n(t3*3,2)*Hm*0.08);}}
    S.rivers.push({pts:P,cls:cls,proc:1});
    var ev=S.elev;S.elev=function(x,y){var e=ev(x,y),q=plNear(P,x,y),w=(cls>=4?9000:cls>=3?5000:2500);var v=e-(o.ter==='valley'?220:60)*(1-sm(0,w,q.d))+(o.ter==='valley'?120*sm(w,w*2.5,q.d):0);return o.ter==='coast'?v:Math.max(v,12+8*sm(0,w*3,q.d));};}
  S.lat=function(){return o.lat||35;};return S;}
/* ---------- 地圖編修 ---------- */
function mapSlope(MP){var GW=MP.GW,GH=MP.GH,N=GW*GH,s=new Float32Array(N),el=MP.el,cs=MP.cs;for(var y=0;y<GH;y++)for(var x=0;x<GW;x++){var k=y*GW+x,ex=el[Math.min(GW-1,x+1)+y*GW]-el[Math.max(0,x-1)+y*GW],ey=el[x+Math.min(GH-1,y+1)*GW]-el[x+Math.max(0,y-1)*GW];s[k]=Math.sqrt(ex*ex+ey*ey)/(2*cs)*100;}return s;}
function brushCells(MP,cx,cy,rad,fn){var R=Math.ceil(rad);for(var b=-R;b<=R;b++)for(var a=-R;a<=R;a++){var X=Math.floor(cx)+a,Y=Math.floor(cy)+b;if(X<0||Y<0||X>=MP.GW||Y>=MP.GH)continue;var d=Math.sqrt(a*a+b*b);if(d>rad)continue;fn(Y*MP.GW+X,d/Math.max(0.5,rad));}}
function editLC(MP,cx,cy,rad,c){brushCells(MP,cx,cy,rad,function(k){MP.lc[k]=c;if(isWater(c)&&c!==LCI.riv){MP.rd[k]=0;MP.rl[k]=0;}if(c===LCI.sea||c===LCI.shal){if(MP.el[k]>=0)MP.el[k]=c===LCI.sea?-30:-5;}else if(!isWater(c)&&MP.el[k]<0)MP.el[k]=1;});}
function editElev(MP,cx,cy,rad,dz){brushCells(MP,cx,cy,rad,function(k,t){MP.el[k]=clamp(Math.round(MP.el[k]+dz*(1-t*t)),-11000,9000);});}
function editRoad(MP,a,b,cls,kind){if(kind==='hsr'){var GW=MP.GW;return !!hsrLine(MP,a%GW+0.5,((a/GW)|0)+0.5,b%GW+0.5,((b/GW)|0)+0.5);}var sl=mapSlope(MP),P=gridPath(MP,sl,a,b,kind==='rail'?'rail':'road',600000);if(!P)return false;P.forEach(function(k){if(kind==='rail'){if(cls)MP.rl[k]|=1;else MP.rl[k]&=2;}else MP.rd[k]=cls;if((MP.rv[k]||MP.lc[k]===LCI.riv)&&cls&&!MP.brg.some(function(q){return q.y*MP.GW+q.x===k;}))MP.brg.push({x:k%MP.GW,y:(k/MP.GW)|0,c:Math.max(MP.rv[k],MP.lc[k]===LCI.riv?3:0)});});return true;}
function eraseLine(MP,cx,cy,rad,layer){if(!MP[layer])MP[layer]=new Uint8Array(MP.GW*MP.GH);brushCells(MP,cx,cy,rad,function(k){MP[layer][k]=0;if(layer==='rd'&&MP.tn)MP.tn[k]&=2;if(layer==='rl'&&MP.tn)MP.tn[k]&=1;});if(layer==='rd'||layer==='rl')MP.brg=MP.brg.filter(function(q){var k=q.y*MP.GW+q.x;return MP.rd[k]||MP.rl[k];});}
function editFort(MP,cx,cy,rad,v){brushCells(MP,cx,cy,rad,function(k){if(!isWater(MP.lc[k]))MP.ft[k]=v;});}
function editRiver(MP,cx,cy,rad,cls){brushCells(MP,cx,cy,rad,function(k){MP.rv[k]=cls;if(!cls&&MP.lc[k]===LCI.riv)MP.lc[k]=LCI.mead;});}
/* 地圖統計（顯示用） */
function mapStats(MP){var n={},N=MP.GW*MP.GH;for(var k=0;k<N;k++)n[MP.lc[k]]=(n[MP.lc[k]]||0)+1;var rd=0,rl=0,hs=0;for(k=0;k<N;k++){if(MP.rd[k])rd++;if(MP.rl[k]&1)rl++;if(MP.rl[k]&2)hs++;}
  var mn=1e9,mx=-1e9;for(k=0;k<N;k++){if(MP.el[k]<mn)mn=MP.el[k];if(MP.el[k]>mx)mx=MP.el[k];}return {lc:n,N:N,rdKm:rd*MP.cs/1000,rlKm:rl*MP.cs/1000,hsKm:hs*MP.cs/1000,emin:mn,emax:mx};}
