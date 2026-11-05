/* ===================== 像素地圖渲染：地表紋理、季節、山體陰影、等高線、河流、道路、鐵路、工事 ===================== */
var SEAR=[[-2000,[22,58,102]],[-200,[30,70,116]],[-50,[44,90,136]],[-10,[66,118,166]],[0,[92,146,192]]];
var FIELDC={sp:['#A9C76A','#B5CF74','#9EBF63','#C2CF80','#ADC06C'],su:['#C7CF77','#B9C766','#D3C878','#A9BE60','#C9B86C'],au:['#C9B46A','#B89E62','#D2C07A','#A69C5E','#BFA66B'],wi:['#B9B49B','#C3BCA0','#ABA68F','#BDB59A','#A9A28A']};
function seasonOf(month,lat){var m=lat<0?((month+5)%12)+1:month;return m>=3&&m<=5?'sp':m>=6&&m<=8?'su':m>=9&&m<=11?'au':'wi';}
/* 等高距只依整張圖的高低差，算一次記在地圖上（局部重畫時不再掃整張圖；改高度的編輯會清掉） */
function contourStep(MP){if(MP._ci)return MP._ci;var st=mapStats(MP),r=st.emax-Math.max(0,st.emin);return MP._ci=r<120?10:r<400?20:r<1200?50:100;}
/* 產生或更新像素影像（每格 S×S 像素） */
function renderMap(MP,opt,img,rect){opt=opt||{};var GW=MP.GW,GH=MP.GH,S=opt.S||2,W=GW*S,H=GH*S,el=MP.el,lc=MP.lc,rv=MP.rv,rd=MP.rd,rl=MP.rl,ft=MP.ft,tn=MP.tn,cs=MP.cs,month=opt.month||6,ss=seasonOf(month,MP.lat0||35),cold=(MP.clim?Math.min(MP.clim.Tj,MP.clim.Tl):5);
  var snowCover=ss==='wi'&&cold<-2,fl0=!!opt.flat,ci=opt.contour&&!fl0?(opt.ci||contourStep(MP)):0,ex=clamp(cs/40,1.5,6),L=[-0.55,-0.6,0.58],Ln=Math.sqrt(L[0]*L[0]+L[1]*L[1]+L[2]*L[2]);L=[L[0]/Ln,L[1]/Ln,L[2]/Ln];var flat=L[2];
  if(!img){var cv=mkCanvas(W,H);img={cv:cv,ctx:cv.getContext('2d'),id:null,S:S};img.id=img.ctx.createImageData(W,H);}
  var D=img.id.data,x0=rect?Math.max(0,rect[0]):0,y0=rect?Math.max(0,rect[1]):0,x1=rect?Math.min(GW,rect[2]):GW,y1=rect?Math.min(GH,rect[3]):GH,FC=FIELDC[ss].map(rgbOf),pal=LC.map(function(c){return rgbOf(c[2]);});
  var WAT=rgbOf('#4C8BC8'),LK=rgbOf('#5A96CA'),RDc=RD.map(function(r){return rgbOf(r[3]||'#000');}),RAIL=[60,60,60],RAIL2=[200,200,196];
  function put(px,py,c){var q=(py*W+px)*4;D[q]=c[0];D[q+1]=c[1];D[q+2]=c[2];D[q+3]=255;}
  /* 戰場地面（彈坑、翻起的土）：直接改這一格的地表顏色，雨後變成爛泥（opt.gd 回傳 0～255 的損壞程度，opt.wet 0～1） */
  /* 地面積雪與融雪泥濘（opt.sw 回傳 [積雪覆蓋 0～1, 泥濘 0～1]） */var SWF=opt.sw||null;
  var GDF=opt.gd||null,wet=clamp(opt.wet||0,0,1),MUDC=[mixC([126,104,78],[74,60,46],wet),mixC([92,74,56],[52,42,34],wet),mixC([150,132,104],[96,84,70],wet)];
  for(var y=y0;y<y1;y++)for(var x=x0;x<x1;x++){var k=y*GW+x,c=lc[k],e=el[k],col,gdv=GDF&&!isWater(c)?GDF(k)||0:0,swq=SWF&&!isWater(c)?SWF(k):null;
      var eR=el[y*GW+Math.min(GW-1,x+1)],eL=el[y*GW+Math.max(0,x-1)],eD=el[Math.min(GH-1,y+1)*GW+x],eU=el[Math.max(0,y-1)*GW+x],nx=-(eR-eL)/(2*cs)*ex,ny=-(eD-eU)/(2*cs)*ex,nl=Math.sqrt(nx*nx+ny*ny+1),sh=(nx*L[0]+ny*L[1]+L[2])/nl,shf=fl0?1:1+(sh-flat)*1.25;
      var hsh=ih(x,y,msd(MP)),hv=(hsh&255)/255;
      if(c===LCI.sea||c===LCI.shal){col=ramp(SEAR,e);shf=1;}else if(c===LCI.lake){col=LK;shf=1;}else if(c===LCI.riv){col=WAT;shf=1;}
      else if(c===LCI.field||c===LCI.hedge){var pid=parcelOf(MP,x,y);col=FC[pid%FC.length];if(snowCover)col=mixC(col,[236,240,243],0.75);}
      else if(c===LCI.mead){col=pal[c];var dry=MP.clim&&6*(MP.clim.Pj+MP.clim.Pl)<500;if(dry)col=[189,184,120];if(ss==='au')col=mixC(col,[190,175,110],0.35);if(ss==='wi')col=snowCover?[234,238,240]:mixC(col,[170,165,130],0.5);col=mixC(col,[0,0,0],0.04*hv);}
      else if(c===LCI.dfor){col=ss==='au'?(hv<0.4?[150,110,50]:hv<0.7?[120,120,55]:[95,110,55]):ss==='wi'?(snowCover?[200,205,205]:[112,106,86]):pal[c];}
      else col=pal[c];
      if(c===LCI.snow||(snowCover&&(c===LCI.tund||c===LCI.rock||c===LCI.scrub||c===LCI.desert)))col=[236,240,243];
      if(!isWater(c)&&c!==LCI.snow&&e>700&&!isUrban(c))col=mixC(col,[185,165,126],0.3*sm(700,2600,e));
      /* 每個子像素：紋理（森林樹冠、聚落建築、沼澤水點） */
      if(gdv)col=mixC(col,MUDC[0],Math.min(0.85,0.25+gdv/255*0.6));
      if(swq){if(swq[1]>0)col=mixC(col,[108,88,64],Math.min(0.75,swq[1]*0.75));if(swq[0]>0)col=mixC(col,[238,242,245],Math.min(0.92,swq[0]));}
      /* 平面地圖（簡易圖形模式）：不加陰影與紋理 */if(fl0){for(var fy2=0;fy2<S;fy2++)for(var fx2=0;fx2<S;fx2++)put(x*S+fx2,y*S+fy2,col);}
      else for(var sy=0;sy<S;sy++)for(var sx=0;sx<S;sx++){var px=x*S+sx,py=y*S+sy,h2=ih(px,py,msd(MP)^0x5bd1)&1023,cc=col;
        if(c===LCI.dfor||c===LCI.cfor||c===LCI.jung)cc=mixC(col,h2<300?[20,40,20]:[255,255,230],h2<300?0.28:h2>880?0.12:0);
        else if(c===LCI.vill)cc=h2<330?[160,86,62]:h2<520?[140,118,104]:h2<620?[120,120,118]:mixC(FC[1],col,0.4);
        else if(c===LCI.town)cc=h2<420?[156,84,64]:h2<700?[130,118,110]:[176,168,158];
        else if(c===LCI.city)cc=MP.year>=1955?(h2<380?[118,126,140]:h2<700?[150,156,166]:[96,102,114]):(h2<380?[120,114,110]:h2<640?[150,92,72]:[170,164,158]);
        else if(c===LCI.ind)cc=(px>>1)%3===0||(py>>1)%3===0?[96,100,110]:h2<500?[126,132,142]:[150,152,158];
        else if(c===LCI.old)cc=h2<560?[126,78,60]:h2<800?[104,86,78]:[150,120,96];
        else if(c===LCI.sub)cc=h2<240?[190,118,96]:h2<640?[150,178,118]:[214,206,190];
        else if(c===LCI.park)cc=h2<380?mixC(col,[40,80,40],0.4):col;
        else if(c===LCI.port)cc=h2<300?[110,114,122]:h2<600?[150,120,90]:[170,172,178];
        else if(c===LCI.rly)cc=(sx+sy)%2===0?[96,92,88]:[150,142,132];
        else if(c===LCI.marsh)cc=h2<220?[90,140,175]:h2<400?[100,128,90]:col;
        else if(c===LCI.orch)cc=(px+py)%2===0?mixC(col,[40,70,30],0.35):col;
        else if(c===LCI.rock)cc=mixC(col,h2<300?[90,85,78]:[200,195,185],h2<300?0.35:0.15);
        else if(c===LCI.desert||c===LCI.sand)cc=mixC(col,[255,245,215],(h2&255)/255*0.18);
        else if(c===LCI.sea||c===LCI.shal)cc=mixC(col,[255,255,255],h2<20?0.12:0);
        if(c===LCI.hedge&&(sx===0||sy===0)){var pl=sx===0?parcelOf(MP,x-1,y):parcelOf(MP,x,y-1);if(pl!==parcelOf(MP,x,y))cc=[58,92,46];}
        if(gdv){var g3=(h2*13+px*7+py*3)&1023;if(g3<gdv*2.2)cc=MUDC[1];else if(g3>1023-gdv*1.2)cc=MUDC[2];else if(wet>0.35&&g3<gdv*2.2+wet*90)cc=mixC(cc,[86,110,124],0.5);}
        put(px,py,[cc[0]*shf,cc[1]*shf,cc[2]*shf]);}
      /* 線狀要素：河流、道路、鐵路、工事、等高線 */
      if(rv[k]&&!isWater(c)){var rc=rv[k];for(sy=0;sy<S;sy++)for(sx=0;sx<S;sx++){if(rc>=2||(sx+sy)%2===0)put(x*S+sx,y*S+sy,rc>=2?WAT:mixC(WAT,col,0.25));}}
      var tnk=tn?tn[k]:0,portal=function(bit,L){if(!(tnk&bit))return false;for(var dd=0;dd<4;dd++){var X3=x+(dd===0?1:dd===1?-1:0),Y3=y+(dd===2?1:dd===3?-1:0);if(X3<0||Y3<0||X3>=GW||Y3>=GH)continue;var q3=Y3*GW+X3;if(L[q3]&&!(tn[q3]&bit))return true;}return false;};
      if(rd[k]&&(tnk&1)){var pr=portal(1,rd);for(sy=0;sy<S;sy++)for(sx=0;sx<S;sx++){if(pr)put(x*S+sx,y*S+sy,[52,44,38]);else if((sx+sy+x+y)%3===0)put(x*S+sx,y*S+sy,mixC(RDc[rd[k]],col,0.55));}}
      else if(rd[k]){var rcol=RDc[rd[k]];for(sy=0;sy<S;sy++)for(sx=0;sx<S;sx++){put(x*S+sx,y*S+sy,rd[k]===1?((sx+sy+x+y)%3?mixC(rcol,col,0.25):mixC(rcol,col,0.6)):rd[k]===4&&S>=3&&sx===1&&sy===1?[250,230,120]:rcol);}}
      if((rl[k]&1)&&(tnk&2)){var pr2=portal(2,rl);for(sy=0;sy<S;sy++)for(sx=0;sx<S;sx++){if(pr2)put(x*S+sx,y*S+sy,[40,40,40]);else if((sx+sy+x+y)%3===0)put(x*S+sx,y*S+sy,mixC(RAIL,col,0.5));}}
      else if(rl[k]&2){for(sy=0;sy<S;sy++)for(sx=0;sx<S;sx++)put(x*S+sx,y*S+sy,(sx+sy+x+y)%2?[236,238,244]:[46,84,170]);}else if(rl[k]&&!(tnk&2)){for(sy=0;sy<S;sy++)for(sx=0;sx<S;sx++)put(x*S+sx,y*S+sy,(sx+sy+x+y)%2?RAIL:RAIL2);}
      if(ft[k]){var fc=ft[k]===1?[92,62,40]:ft[k]===2?[110,110,110]:ft[k]===3?[176,58,46]:ft[k]===5?[120,96,70]:ft[k]===6?[132,118,98]:[70,70,70];for(sy=0;sy<S;sy++)for(sx=0;sx<S;sx++){var on=ft[k]>=4||(ft[k]===1?(sx+sy)%2===0:(sx+sy+x)%2===0);if(on)put(x*S+sx,y*S+sy,ft[k]===5&&(sx+sy)%2?[150,124,92]:fc);}}
      if(ci&&!isWater(c)){var a=Math.floor(e/ci),bR=Math.floor(eR/ci),bD=Math.floor(eD/ci);if(a!==bR||a!==bD){var idx=(Math.max(a,bR,bD)*ci)%(ci*5)===0,f=idx?0.62:0.8;for(sy=0;sy<S;sy++)for(sx=0;sx<S;sx++){if((a!==bR&&sx===S-1)||(a!==bD&&sy===S-1)){var q=((y*S+sy)*W+x*S+sx)*4;D[q]*=f;D[q+1]*=f;D[q+2]*=f*0.95;}}}}}
  img.ctx.putImageData(img.id,0,0,x0*S,y0*S,(x1-x0)*S,(y1-y0)*S);return img;}
/* 世界地圖縮圖上的選取框（區域挑選） */
function drawPickBox(ctx,box,col){ctx.save();ctx.strokeStyle=col||'#E53935';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.strokeRect(box[0],box[1],box[2],box[3]);ctx.restore();}
