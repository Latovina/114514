/* ===================== 世界地圖：以地形工具的程式庫重建地圖參數檔，挑選區域並提供大尺度取樣器 ===================== */
async function decodePNG(bytes,W,H){var bl=new Blob([bytes],{type:'image/png'}),url=URL.createObjectURL(bl),im=new Image();await new Promise(function(res,rej){im.onload=res;im.onerror=function(){rej(new Error('無法解碼地圖參數檔中的底圖'));};im.src=url;});
  var px=new Uint8ClampedArray(W*H*4),SH=Math.max(1,Math.min(H,Math.floor(4194304/W))),c=mkCanvas(W,SH),cx=c.getContext('2d',{willReadFrequently:true});
  for(var y0=0;y0<H;y0+=SH){var hs=Math.min(SH,H-y0);cx.clearRect(0,0,W,SH);cx.drawImage(im,0,y0,W,hs,0,0,W,hs);px.set(cx.getImageData(0,0,W,hs).data,y0*W*4);}c.width=c.height=1;URL.revokeObjectURL(url);return px;}
function libOK(){return !!(window.LatoTerrainLib&&window.LatoTerrainLib.LTPipeline);}
async function rebuildMap(P0,prog){var LIB=window.LatoTerrainLib;if(!LIB)throw new Error('找不到地形工具的程式庫（LatoTerrainLib）：請確認頁面同時載入了 LatoTerrain 小工具。');
  if(!P0||P0.format!=='LatoMapParams'||!P0.input)throw new Error('這不是地形工具輸出的地圖參數檔（.latomap.json）。');
  var C=LIB.LTCore(),CL=LIB.LTClimate(C),RV=LIB.LTRivers(C,CL),LY=LIB.LTLayers(C,CL),RS=LIB.LTResources(C,CL),WDL=LIB.LTWorld?LIB.LTWorld(C,CL):null,PH=LIB.LTPhen?LIB.LTPhen(C,CL):null,PL=LIB.LTPipeline(C,CL,RV,LY,RS,WDL,PH);
  await prog('解碼底圖',0.01);var px=await decodePNG(b64dec(P0.input.data),P0.W0,P0.H0),kd=null;
  if(P0.known){var kb=new Blob([b64dec(P0.known.data)],{type:P0.known.type||'image/png'});kd=P0.known.h16?await PL.readH16(kb,prog):await PL.readBands(kb,P0.legend,[C.hex(P0.ui.csea),[255,255,255],C.hex(P0.ui.cice),[119,119,119]],prog);}
  var M=await PL.build(px,P0.W0,P0.H0,{ui:P0.ui,cfg:P0.cfg,legend:P0.legend,names:P0.names,knownData:kd,nations:P0.nations,places:P0.places,seasons:P0.seasons},function(l,f){return prog('重建地形：'+l,0.02+0.9*f);});
  return {M:M,C:C,CL:CL,LY:LY,RS:RS,PL:PL,P0:P0};}
/* 像素風格的世界底圖（區域挑選用） */
function worldBase(R,DW){var M=R.M,d=R.PL.display(M,DW),W=d.W,H=d.H,c=mkCanvas(W,H),x=c.getContext('2d'),o={iceKeep:false,iceColor:[224,224,224],shadeStr:0.8,season:'ann',withSea:true,src:false,main:true,trib:true,mouth:false,lake:true};
  x.fillStyle='#D5D5D5';x.fillRect(0,0,W,H);['sea','land','shade','river'].forEach(function(k){try{x.drawImage(R.LY.layerCanvas(k,d.T,d.D,o,document),0,0);}catch(e){console.warn('底圖圖層 '+k+' 失敗',e);}});
  return {canvas:c,W:W,H:H};}
/* 世界的國家（地形工具生成的國家或底圖色塊） */
function worldNations(R){var M=R.M,nat=M.wd&&M.wd.nat?M.wd.nat.list:null,o=[];if(nat)o=nat.map(function(c){return {id:c.id,name:c.name,color:c.color};});
  else{var nms=R.PL.namesFrom?R.PL.namesFrom(R.P0.names):null;(M.src.regions||[]).forEach(function(r){o.push({id:r.id,name:R.PL.regName?R.PL.regName(r,nms):'區域 '+r.id,color:hexOf(r.c)});});}
  o.forEach(function(n){if(/^#[0-9A-F]{6}$/i.test(n.name))n.name='';});return o;}
/* 經緯度 ⇄ 世界像素（連續座標，像素 i 的中心在 i+0.5） */
function wProj(R,lon,lat){var g=R.M.g;return R.LY.proj({W:g.W,H:g.H,ee:g.ee},lon,lat);}
function wLL(R,px,py){var g=R.M.g;return R.C.pixLL(px-0.5,py-0.5,g.W,g.H,g.ee);}
/* 區域的局部平面座標：x 向東、y 向南（公尺），中心在 (lon0,lat0) */
function regionLL(Rk,lon0,lat0,Wm,Hm,x,y){var lat=lat0+((Hm/2-y)/1000)/Rk*R2D,lon=lon0+((x-Wm/2)/1000)/(Rk*Math.cos(lat0*D2R))*R2D;return [lon,lat];}
function regionXY(Rk,lon0,lat0,Wm,Hm,lon,lat){var dl=lon-lon0;if(dl>180)dl-=360;if(dl<-180)dl+=360;return [Wm/2+dl*D2R*Rk*Math.cos(lat0*D2R)*1000,Hm/2-(lat-lat0)*D2R*Rk*1000];}
/* 取樣器：世界地圖 → 區域大尺度場 */
/* 世界地圖的一格常有十幾、二十公里：直接放大會出現方塊狀的海岸與筆直的地形界線。
   取樣座標先做多層雜訊扭曲（約半格），高程與海陸、湖泊比例用三次內插，海岸線依陸地比例平滑過渡；河道折線做相同的扭曲，河口仍接到海 */
function cubW(t){t=Math.abs(t);return t<1?(1.5*t-2.5)*t*t+1:t<2?((-0.5*t+2.5)*t-4)*t+2:0;}
function worldSampler(R,lon0,lat0,Wm,Hm){var M=R.M,g=M.g,GW=g.W,GH=g.H,h=M.res.h,cls=g.cls,cl=M.clim,CL=R.CL,riv=M.riv||{},rid=g.rid,Rk=g.R||6371,lakeM=riv.lake;
  if(!R._landF){R._landF=new Float32Array(GW*GH);for(var q0=0;q0<GW*GH;q0++)R._landF[q0]=cls[q0]>=2?1:0;if(lakeM){R._lakeF=new Float32Array(GW*GH);for(q0=0;q0<GW*GH;q0++)R._lakeF[q0]=lakeM[q0]?1:0;}}
  var LF=R._landF,KF=R._lakeF;
  function P0(x,y){var q=regionLL(Rk,lon0,lat0,Wm,Hm,x,y);return wProj(R,q[0],q[1]);}
  var pa=P0(Wm/2,Hm/2),pb=P0(Wm/2+10000,Hm/2),pxm=Math.max(1e-7,Math.sqrt((pb[0]-pa[0])*(pb[0]-pa[0])+(pb[1]-pa[1])*(pb[1]-pa[1]))/10000),NW=new Noise('wwarp|'+lon0.toFixed(2)+'|'+lat0.toFixed(2)),Aw=0.55/pxm,Lw=1.7/pxm;
  function D(x,y){return [Aw*NW.fbm(x/Lw,y/Lw,5),Aw*NW.fbm(x/Lw+41.3,y/Lw-17.9,5)];}
  /* 海岸與湖岸再加兩層較細的碎形擾動（數公里與一、兩公里），海岸線不會是一條平滑的直線 */
  var NC=new Noise('wcoast|'+lon0.toFixed(2)+'|'+lat0.toFixed(2)),Ac=0.5/pxm,Lc=0.9/pxm,Lc2=Lw/14;
  /* 海岸專用的碎形扭曲：每縮小一半尺度振幅只減為 0.65 倍（比一般地形更曲折，接近真實海岸的碎形維度） */
  function PL(x,y){var d=D(x,y),ex=Ac*NC.fbm(x/Lc,y/Lc,7,2,0.7),ey=Ac*NC.fbm(x/Lc-23.9,y/Lc+31.1,7,2,0.7);return P0(x+d[0]+ex,y+d[1]+ey);}
  function lfAt(x,y){return cub(LF,PL(x,y))+0.08*NC.fbm(x/Lc2+7.7,y/Lc2-3.1,3);}
  function P(x,y){var d=D(x,y);return P0(x+d[0],y+d[1]);}
  /* 反向扭曲（定點迭代）：世界上的河道點在區域裡的位置 */
  function unwarp(px,py){var x=px,y=py;for(var it=0;it<4;it++){var d=D(x,y);x=px-d[0];y=py-d[1];}return [x,y];}
  function bil(A,p){var fx=clamp(p[0]-0.5,0,GW-1.001),fy=clamp(p[1]-0.5,0,GH-1.001),i=Math.floor(fx),j=Math.floor(fy),tx=fx-i,ty=fy-j,k=j*GW+i;return (A[k]*(1-tx)+A[k+1]*tx)*(1-ty)+(A[k+GW]*(1-tx)+A[k+GW+1]*tx)*ty;}
  function cub(A,p){var fx=clamp(p[0]-0.5,0,GW-1.001),fy=clamp(p[1]-0.5,0,GH-1.001),i=Math.floor(fx),j=Math.floor(fy),tx=fx-i,ty=fy-j,r=0;for(var m=-1;m<=2;m++){var jj=clamp(j+m,0,GH-1),row=0;for(var n=-1;n<=2;n++)row+=A[jj*GW+clamp(i+n,0,GW-1)]*cubW(n-tx);r+=row*cubW(m-ty);}return r;}
  function near(A,p){var i=clamp(Math.floor(p[0]),0,GW-1),j=clamp(Math.floor(p[1]),0,GH-1);return A[j*GW+i];}
  function SG(f,lo,la){return CL.sampleGrid(f,cl.NX,cl.NY,cl.DG,lo,la);}
  var S={R:Rk,lon0:lon0,lat0:lat0,
    /* 海陸：陸地比例低於一半是海（離岸越遠越深），高於一半是陸地（海岸附近略高於海面），中間平滑過渡 */
    /* 陸地在海岸附近從海面高度漸升到原本的高程（約幾公里），細部雜訊才能塑造出曲折的海岸 */
    elev:function(x,y){var p=P(x,y),e=cub(h,p),lf=lfAt(x,y);if(lf<0.5)return Math.min(e,-2-70*(0.5-lf));var t=sm(0.5,0.8,lf);return Math.max(0.8+24*(lf-0.5),0.8+(e-0.8)*t);},
    /* 未經海岸處理的連續高程（產生地圖時先取這個，海岸再逐格決定，避免沿取樣格線出現斷崖） */
    elevRaw:function(x,y){return cub(h,P(x,y));},
    relief:function(x,y){var p=P(x,y),m=0,s2=0,n=0;for(var b=-1;b<=1;b++)for(var a=-1;a<=1;a++){var v=bil(h,[p[0]+a,p[1]+b]);m+=v;s2+=v*v;n++;}m/=n;return Math.sqrt(Math.max(0,s2/n-m*m));},
    clim:function(x,y){var q=regionLL(Rk,lon0,lat0,Wm,Hm,x,y),lo=q[0],la=q[1],z=Math.max(0,cub(h,P(x,y))),dz=cl.zL?-0.0065*(z-SG(cl.zL,lo,la)):0;return {Tj:SG(cl.Tj,lo,la)+dz,Tl:SG(cl.Tl,lo,la)+dz,Pj:SG(cl.Pj,lo,la),Pl:SG(cl.Pl,lo,la)};},
    hab:function(x,y){var c=S.clim(x,y),Tm=(c.Tj+c.Tl)/2,Tw=Math.max(c.Tj,c.Tl),Pa=6*(c.Pj+c.Pl),p=P(x,y),z=cub(h,p),sl=M.rs&&M.rs.slope?bil(M.rs.slope,p):0,q=riv.Q?near(riv.Q,p):0;
      var fT=sm(-1,9,Tm)*sm(9,16,Tw)*(1-0.25*sm(27,32,Tm)),fP=Math.max(sm(250,750,Pa)*(1-0.35*sm(2600,4500,Pa)),0.8*sm(1,4,q/(riv.Qmin||90))),fS=1-sm(0.6,6,sl)*0.8,fE=sm(4200,1500,z);return clamp(fT*fP*fS*fE,0,1);},
    land:function(x,y){return lfAt(x,y)>=0.5?1:0;},landF:function(x,y){return clamp(lfAt(x,y),0,1);},
    lake:function(x,y){return KF&&cub(KF,PL(x,y))+0.06*NC.fbm(x/Lc2+19.1,y/Lc2+5.3,3)>0.5?1:0;},nation:function(x,y){return rid?near(rid,P(x,y)):0;},
    lat:function(y){return lat0+((Hm/2-y)/1000)/Rk*R2D;},nations:worldNations(R),rivers:[],warp:{A:Aw,L:Lw}};
  /* 河流：世界河道折線轉成區域座標（只保留穿過區域者），流量決定等級；套用與地形相同的扭曲 */
  var Qmin=riv.Qmin||90,mg=0.25;(riv.lines||[]).forEach(function(L,li){var pts=[],qs=[],inside=false;for(var t=0;t<L.pts.length;t+=2){var ll=wLL(R,L.pts[t],L.pts[t+1]),xy=regionXY(Rk,lon0,lat0,Wm,Hm,ll[0],ll[1]);if(xy[0]>-Wm*(mg+0.5)&&xy[1]>-Hm*(mg+0.5)&&xy[0]<Wm*(1.5+mg)&&xy[1]<Hm*(1.5+mg))xy=unwarp(xy[0],xy[1]);pts.push(xy[0],xy[1]);qs.push(L.q[t/2]||0);
      if(xy[0]>-Wm*mg&&xy[1]>-Hm*mg&&xy[0]<Wm*(1+mg)&&xy[1]<Hm*(1+mg))inside=true;}
    if(!inside||pts.length<4)return;var qx=0;for(t=0;t<qs.length;t++){var x=pts[t*2],y=pts[t*2+1];if(x>=0&&y>=0&&x<=Wm&&y<=Hm&&qs[t]>qx)qx=qs[t];}if(!qx)qx=qs[qs.length-1];
    var cls2=qx>=Qmin*64?4:qx>=Qmin*12?3:2;S.rivers.push({pts:pts,cls:cls2,main:L.main,id:li});});
  return S;}
/* 示範：區域中心點附近是否為陸地（挑選區域時的提示） */
function regionInfo(R,lon0,lat0,Wkm){var S=worldSampler(R,lon0,lat0,Wkm*1000,Wkm*1000),n=0,land=0,e=0,nat={};for(var j=0;j<8;j++)for(var i=0;i<8;i++){var x=(i+0.5)/8*Wkm*1000,y=(j+0.5)/8*Wkm*1000;n++;if(S.land(x,y)){land++;e+=S.elev(x,y);var id=S.nation(x,y);if(id)nat[id]=(nat[id]||0)+1;}}
  var c=S.clim(Wkm*500,Wkm*500);return {land:land/n,elev:land?e/land:0,clim:c,nations:Object.keys(nat).map(function(id){var o=S.nations.filter(function(q){return q.id===+id;})[0];return o?o.name:'';}).filter(Boolean),rivers:S.rivers.length};}
