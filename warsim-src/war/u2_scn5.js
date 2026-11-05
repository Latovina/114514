/* ===================== v5 想定：太平洋戰爭（瓜達康納爾島、塞班島） ===================== */
function coastY(x){var MP=G.map;for(var y=MP.cs;y<MP.Hm;y+=MP.cs){if(!isWater(MP.lc[cellAt(x,y)]))return y;}return null;}
function westCoastX(y){var MP=G.map;for(var x=MP.cs;x<MP.Wm;x+=MP.cs){if(!isWater(MP.lc[cellAt(x,y)]))return x;}return null;}
function seaNear(x,y){var MP=G.map,best=null,bd=1e18,st=MP.cs*2;for(var b=-40;b<=40;b++)for(var a=-40;a<=40;a++){var px=x+a*st,py=y+b*st;if(px<MP.cs*2||py<MP.cs*2||px>MP.Wm-MP.cs*2||py>MP.Hm-MP.cs*2)continue;if(MP.lc[cellAt(px,py)]!==LCI.sea)continue;var d=dist(px,py,x,y);if(d<bd){bd=d;best=[px,py];}}return best||[x,y];}
function topBy(side,pk){return G.units.filter(function(u){return u.side===side&&u.p<0&&u.pk===pk;})[0]||null;}
function scnPlace(F,x,y,hd){if(!F)return;deployTree(F,x,y,hd,0);(function w(z){if(isLeaf(z)){var s=ST(z),p=validPos(s,z.x,z.y);z.x=p[0];z.y=p[1];z.home=[z.x,z.y];if(s.dom==='air'){z.st='base';z.base=[z.x,z.y];}}kidsOf(z).forEach(w);})(F);if(!isLeaf(F)){var L=leavesOf(F);if(L.length){var c=centroid(L);F.x=c[0];F.y=c[1];}}}
function airBaseAt(F,x,y){(function w(z){if(isLeaf(z)&&ST(z).dom==='air'){z.st='base';z.base=[x,y];z.x=x;z.y=y;}kidsOf(z).forEach(w);})(F);}
function offTree(F){(function w(z){z.st='off';kidsOf(z).forEach(w);})(F);}
function highPt(x0,y0,R){var MP=G.map,best=null,be=-1e9;for(var k=0;k<MP.GW*MP.GH;k+=3){var p=cellXY(k);if(dist(p[0],p[1],x0,y0)>R||isWater(MP.lc[k]))continue;if(MP.el[k]>be){be=MP.el[k];best=p;}}return best?{x:best[0],y:best[1],el:be}:null;}
/* 瓜達康納爾島 1942 年 10 月：韓德森機場爭奪 */
function scnGuadal(){var MP=G.map,r=mb32(hstr(MP.seed+'|gc')),ax=MP.Wm*0.58,cy=coastY(ax)||MP.Hm*0.3,ap=validPos({dom:'land'},ax,cy+3200);ax=ap[0];var ay=ap[1];
  var US=topBy(0,'mdv1942'),CA=topBy(0,'iaw1942'),TF=topBy(0,'cbg1940'),JD=topBy(1,'ijd1942'),SU=topBy(1,'r1940'),KB=topBy(1,'cbg1940'),BA=topBy(1,'mbw1940');
  /* 陸戰師：機場周圍的環形防線，已經構工兩個月 */
  if(US){deployTree(US,ax,ay,PI/2,0);garrison(US,ax,ay+600,4200);leavesOf(US).forEach(function(u){u.ent=Math.max(u.ent||0,0.55);u.hd=Math.atan2(u.y-ay,u.x-ax);});}
  if(CA)airBaseAt(CA,ax,ay);G.sides[0].nodes=[];addNode(0,'off',MP.Wm-MP.cs*4,(cy||MP.Hm*0.3)-3000,{name:'海上補給線'});facClaim(0,'air',ax,ay,'韓德森機場');
  if(TF){var tp=seaNear(MP.Wm*0.9,(coastY(MP.Wm*0.9)||cy)-7000);scnPlace(TF,tp[0],tp[1],PI);}
  /* 日軍：第二師團在機場西南方叢林、住吉支隊沿西部海岸；航艦在西北外海，陸基轟炸機自地圖外的基地出擊 */
  var j=validPos({dom:'land'},MP.Wm*0.34,ay+9000);if(JD)scnPlace(JD,j[0],j[1],Math.atan2(ay-j[1],ax-j[0]));
  if(SU){var sx=MP.Wm*0.2,s=validPos({dom:'land'},sx,(coastY(sx)||cy)+2500);scnPlace(SU,s[0],s[1],0);}
  if(KB){var kp=seaNear(MP.Wm*0.1,(coastY(MP.Wm*0.1)||cy)-9000);scnPlace(KB,kp[0],kp[1],0);}
  if(BA)airBaseAt(BA,MP.cs*3,MP.Hm*0.85);
  /* 日軍補給：沒有地圖外基地，只有西岸的補給站，靠夜間的高速運輸驅逐艦補充 */
  var kx=MP.Wm*0.1,ky=(coastY(kx)||cy)+1200;G.sides[1].nodes=[];addNode(1,'depot',kx,ky,{name:'科孔博納補給站',st:{food:45,ammo:70,fuel:10,fod:0}});
  [[2.5,'第三十八師團先遣隊',0.15],[26.5,'第二梯隊',0.22]].forEach(function(q){var F=buildPreset(1,'r1940',q[1],-1,r,'co');offTree(F);var bx=MP.Wm*q[2],b=validPos({dom:'land'},bx,(coastY(bx)||cy)+500);F.arr={k:'time',t:q[0]*3600,x:b[0],y:b[1],mode:'ship',ship:'dxt1940',night:1,ord:{k:'move',x:j[0],y:j[1]}};});
  /* 戰鬥艦趁夜砲擊機場 */
  var BB=buildPreset(1,'bbg1942','挺身攻擊隊',-1,r,'co');offTree(BB);var bp=seaNear(ax-3000,cy-6000);BB.arr={k:'time',t:9*3600,x:bp[0],y:bp[1],mode:'edge',ord:{k:'bombard',x:ax,y:ay}};reix();
  var hp=highPt(ax-2500,ay+6000,4500)||{x:ax,y:ay+5000};G.obj=[{id:1,name:'韓德森機場',x:ax,y:ay,pts:40,own:0,r:1500},{id:2,name:'奧斯汀山',x:hp.x,y:hp.y,pts:15,own:-1,r:900}];
  G.sides[1].post='attack';G.sides[0].pol=Object.assign(G.sides[0].pol||{},{});dupNames();}
/* 塞班島 1944 年 6 月：島嶼登陸與平民 */
function scnSaipan(){var MP=G.map,r=mb32(hstr(MP.seed+'|sp')),cells=[],sx=0,sy=0;for(var k=0;k<MP.GW*MP.GH;k+=5){if(isWater(MP.lc[k]))continue;var p=cellXY(k);cells.push(p);sx+=p[0];sy+=p[1];}if(!cells.length)return;var cx=sx/cells.length,cy2=sy/cells.length;
  var ys=cells.map(function(p){return p[1];}).sort(function(a,b){return a-b;}),y0=ys[Math.floor(ys.length*0.05)],y1=ys[Math.floor(ys.length*0.95)];
  /* 守軍：分散在全島，海岸與內陸都有 */
  var rr=mb32(hstr(MP.seed+'|spdef'));tops(1).forEach(function(T){deployTree(T,cx,cy2,PI,0);leavesOf(T).forEach(function(u){var p=cells[Math.floor(rr()*cells.length)],q=validPos(ST(u),p[0],p[1]);u.x=q[0];u.y=q[1];u.home=[u.x,u.y];u.hd=PI;u.ent=Math.max(u.ent||0,0.45);});var L=leavesOf(T);if(L.length){var c=centroid(L);T.x=c[0];T.y=c[1];}});
  /* 美軍：兩個陸戰師由運輸船團在西岸南段登陸，陸軍步兵師隨後增援 */
  var by=lerp(y0,y1,0.66),bxw=westCoastX(by)||cx,beach=validPos({dom:'land'},bxw+500,by),south=cells.filter(function(p){return p[1]>lerp(y0,y1,0.8);}),sc=south.length?centroid(south.map(function(p){return {x:p[0],y:p[1]};})):[cx,y1],peak=highPt(cx,cy2,9000)||{x:cx,y:cy2};
  var set=MP.set.slice().sort(function(a,b){return b.pop-a.pop;}),town=set[0]?{x:set[0].x*MP.cs,y:set[0].y*MP.cs,n:set[0].name}:{x:cx,y:cy2,n:'加拉班'};
  [['第二陸戰師',-1700,1800,{k:'attack',x:town.x,y:town.y}],['第四陸戰師',1700,2700,{k:'attack',x:sc[0],y:sc[1]}],['陸軍第二十七步兵師',0,30*3600,{k:'attack',x:sc[0],y:sc[1]}]].forEach(function(q,i){var F=buildPreset(0,i<2?'mdv1942':'d1940',q[0],-1,r,'co');offTree(F);var b=validPos({dom:'land'},(westCoastX(by+q[1])||bxw)+500,by+q[1]);F.arr={k:'time',t:q[2],x:b[0],y:b[1],mode:'ship',ord:q[3]};});
  var NG=topBy(0,'bbg1942');if(NG){var np=seaNear(bxw-6000,by);scnPlace(NG,np[0],np[1],0);}var TF=topBy(0,'cbg1940');if(TF){var tp=seaNear(MP.cs*8,by-6000);scnPlace(TF,tp[0],tp[1],0);}
  /* 守軍與平民沒有退路：沒有地圖外補給，只有島上的倉庫 */
  G.sides[1].nodes=[];addNode(1,'depot',town.x,town.y,{name:town.n+'守備隊補給庫',st:{food:260,ammo:380,fuel:40,fod:0}});facClaim(1,'air',sc[0],sc[1],'阿斯里多機場');reix();
  G.obj=[{id:1,name:'阿斯里多機場',x:sc[0],y:sc[1],pts:30,own:1,r:1300},{id:2,name:town.n,x:town.x,y:town.y,pts:20,own:1,r:1200},{id:3,name:'塔波喬山',x:peak.x,y:peak.y,pts:20,own:1,r:900}];
  G.sides[1].nosur=true;G.sides[1].post='defend';dupNames();}
SCN.push(
 {k:'gc1942',n:'1942 年：瓜達康納爾島（機場爭奪）',ds:'以瓜島韓德森機場爭奪戰為藍本：陸戰師在機場周圍據守環形防線，島嶼航空隊從機場起降；日軍步兵師團穿越叢林攻擊，夜間以高速運輸驅逐艦運來援兵與補給，戰鬥艦趁夜砲擊機場，雙方航艦在外海交鋒。補給斷絕的一方會陷入飢餓，瘧疾與痢疾造成的減員不亞於戰鬥。地圖 48×36 公里。',
  y:1942,m:10,d:23,h:16,ter:'coast',sea:-PI/2,coff:-0.2,isl:[[0.8,0.06,0.13,0.05,1,0.2,80],[0.45,1.0,0.75,0.62,1,0,420]],clim:'tropical',size:[48,36],cs:100,lat:9.4,dens:0.15,edges:['E','W'],
  A:[['mdv1942',1,'第一陸戰師',null,'co'],['iaw1942',1,'仙人掌航空隊',null,'co'],['cbg1940',1,'第十六特遣艦隊',null,'co']],B:[['ijd1942',1,'第二師團',null,'co'],['r1940',1,'住吉支隊',null,'co'],['cbg1940',1,'機動部隊',null,'co'],['mbw1940',1,'基地航空隊',null,'co']],
  names:['美軍','日軍'],dur:720,post:function(){scnGuadal();},set:{evac:'none',wealth:'poor',evt:{on:true,freq:1.5,clim:true,quake:'auto',disc:true,dis:true,gue:false,short:true,pers:true,wel:true}},
  pol:[{pow:2,civ:1,doct:'mixed',press:'control'},{pow:3,civ:2,doct:'harsh',press:'control'}]},
 {k:'sp1944',n:'1944 年：塞班島（島嶼登陸與平民）',ds:'以塞班島戰役為藍本：兩個陸戰師由運輸船團載運，在艦砲與艦載機掩護下於西岸登陸，陸軍步兵師隨後增援；守軍步兵師團、混成旅團與戰車聯隊散布全島，奉行不投降教條。島上兩萬多名平民無處可逃，困在洞穴與戰火之間，守軍的宣傳與脅迫讓許多人在最後選擇自殺。地圖 30×24 公里。',
  y:1944,m:6,d:15,h:5,ter:'island',isl:[[0.55,0.5,0.16,0.44,1,0.25,420]],clim:'tropical',size:[30,24],cs:50,lat:15.2,dens:3,edges:['W','E'],
  A:[['bbg1942',1,'艦砲支援群',null,'co'],['cbg1940',1,'第五十八特遣艦隊',null,'co']],B:[['ijd1942',1,'第四十三師團',null,'co'],['r1940',1,'獨立混成第四十七旅團',null,'co'],['tb1940',1,'戰車第九聯隊',null,'co']],
  names:['美軍','日軍'],dur:600,post:function(){scnSaipan();},set:{evac:'none',wealth:'mid',loy:'s1',evt:{on:true,freq:1,clim:true,quake:'auto',disc:true,dis:true,gue:false,short:true,pers:true,wel:true}},
  pol:[{pow:2,civ:1,doct:'mixed',press:'control'},{pow:3,civ:3,doct:'harsh',press:'control'}]});
