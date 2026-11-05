/* ===================== LatoArmory 與 LatoVehicle 運算庫（材料、外彈道、終端彈道、裝甲、載具設計與計價、化生放核魔），原樣嵌入 ===================== */

/* ===== 彈道與裝甲運算庫：在 wiki 上由 MediaWiki:Gadget-LatoArmoryLib.js 提供，與介面分開貼上 ===== */
/* ===== LatoArmory engine: materials, projectiles, exterior & terminal ballistics, wound ballistics, blast, cost ===== */
(function(){
"use strict";
if(window.LatoArmoryLib)return;
var PI=Math.PI,D2R=PI/180;
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function lerp(a,b,t){return a+(b-a)*t;}
function cloneObj(o){return JSON.parse(JSON.stringify(o));}
function mb32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function hstr(s){s=String(s);var h=1779033703^s.length;for(var i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19;}return h>>>0;}
function gauss(r){var u=r()||1e-9,v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*PI*v);}
function ncdf(x){var t=1/(1+0.2316419*Math.abs(x)),d=0.3989423*Math.exp(-x*x/2),p=d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return x>0?1-p:p;}

/* ---------- elements of the magic system (架空): armour magic is multiplied by EL[warhead][armour] ---------- */
var ELEM=['無','火','冰','雷','光','暗'];
var ELM=[ /* rows: warhead element, cols: armour element */
 [1,1,1,1,1,1],
 [1,1.5,0.6,1.25,1,1],
 [1,1.25,1.5,0.6,1,1],
 [1,0.6,1.25,1.5,1,1],
 [1,1,1,1,1.5,0.6],
 [1,1,1,1,0.6,1.5]];

/* ---------- materials ----------
   cat: metal | ceramic | fiber (flexible / pressed textile) | poly (glassy polymer) | glass | conc | soil | wood | liquid | tissue | comp (composite block given as RHA efficiency) | era (reactive / non-energetic / slat) | magic tag via mg
   rho g/cm3, bhn Brinell, ys / uts MPa, E GPa, el elongation %, hv Vickers (ceramics), rt target resistance GPa (if not derived), fs/fe/fE fibre strength GPa, failure strain, modulus GPa, mx textile efficiency in the ply,
   yp dynamic flow stress of the material when used as a penetrator (GPa), brit brittle core, ss self-sharpening factor, lo Lanz-Odermatt class W or S,
   usd price USD/kg (raw), fab fabrication multiplier for armour products, proc processing multiplier as projectile part, ce / ke extra efficiency vs shaped charges / kinetic, bfd backface coefficient, mh multi-hit damage radius (calibres) and residual fraction */
var MATS=[
 /* steels */
 {id:'rha',n:'均質軋延裝甲鋼 RHA',cat:'metal',rho:7.85,bhn:270,ys:900,uts:1000,E:207,el:15,usd:4.5,fab:1.6,bfd:0.010,mh:[1.2,0.85],note:'MIL-A-12560；以此為裝甲等效基準'},
 {id:'hha',n:'高硬度裝甲鋼 HHA（500 HB）',cat:'metal',rho:7.85,bhn:500,ys:1300,uts:1650,E:207,el:9,usd:5.5,fab:1.8,bfd:0.009,mh:[1.4,0.8],note:'MIL-A-46100；較脆，背面剝落較多'},
 {id:'uhha',n:'超高硬度鋼 UHHA（600 HB）',cat:'metal',rho:7.85,bhn:600,ys:1650,uts:2050,E:207,el:7,usd:7,fab:2.2,bfd:0.009,mh:[1.6,0.75],note:'MIL-DTL-32332'},
 {id:'ar500',n:'AR500 耐磨鋼（防彈插板）',cat:'metal',rho:7.85,bhn:500,ys:1250,uts:1600,E:207,el:10,usd:5,fab:3,bfd:0.008,mh:[1.2,0.85],note:'常見鋼製 III 級插板材料；需防碎噴塗'},
 {id:'ar600',n:'AR600／AR650 鋼',cat:'metal',rho:7.85,bhn:600,ys:1600,uts:2000,E:207,el:7,usd:6.5,fab:3.2,bfd:0.008,mh:[1.3,0.8]},
 {id:'mild',n:'低碳結構鋼 A36',cat:'metal',rho:7.85,bhn:130,ys:250,uts:420,E:200,el:23,usd:1.0,fab:1.3,bfd:0.012,mh:[1,0.9],note:'一般鋼板、車身、門'},
 {id:'cast',n:'鑄造裝甲鋼',cat:'metal',rho:7.85,bhn:250,ys:760,uts:900,E:205,el:10,usd:3.5,fab:1.5,bfd:0.010,mh:[1.2,0.85],note:'約 RHA 的 0.9–0.95 倍'},
 {id:'fhs',n:'表面硬化裝甲（克虜伯滲碳）',cat:'metal',rho:7.85,bhn:420,ys:1150,uts:1350,E:207,el:8,usd:6,fab:2.5,fh:1,bfd:0.010,mh:[1.4,0.75],note:'硬面使無被帽穿甲彈碎裂'},
 {id:'hadf',n:'哈德菲錳鋼（鋼盔）',cat:'metal',rho:7.85,bhn:220,ys:450,uts:950,E:200,el:40,usd:3,fab:3,bfd:0.012,mh:[1,0.9],note:'M1 鋼盔 1.0 mm'},
 /* light metals */
 {id:'al5083',n:'鋁合金 5083-H131',cat:'metal',rho:2.66,bhn:85,ys:250,uts:315,E:70,el:12,usd:7,fab:1.6,bfd:0.012,mh:[1.2,0.85],note:'M113 等裝甲運兵車'},
 {id:'al7039',n:'鋁合金 7039-T64',cat:'metal',rho:2.78,bhn:135,ys:380,uts:435,E:70,el:12,usd:9,fab:1.7,bfd:0.012,mh:[1.2,0.85],note:'M2 布萊德雷'},
 {id:'ti64',n:'鈦合金 Ti-6Al-4V',cat:'metal',rho:4.43,bhn:330,ys:900,uts:1000,E:114,el:12,usd:45,fab:2,bfd:0.011,mh:[1.2,0.85]},
 {id:'mg',n:'鎂合金 AZ31',cat:'metal',rho:1.77,bhn:55,ys:200,uts:260,E:45,el:12,usd:5,fab:1.6,bfd:0.012,mh:[1,0.9]},
 {id:'cu',n:'銅',cat:'metal',rho:8.96,bhn:50,ys:250,uts:300,E:120,el:30,usd:10,fab:1.4,yp:0.45,proc:4,mh:[1,0.9]},
 /* penetrator materials (also usable as armour) */
 {id:'lead',n:'鉛（鉛銻合金彈芯）',cat:'metal',rho:11.2,bhn:8,ys:25,uts:30,E:16,el:40,usd:2.3,fab:1.3,yp:0.06,proc:2.5,mh:[1,0.9]},
 {id:'jlead',n:'被甲鉛彈（含被甲）',cat:'metal',rho:10.6,bhn:30,ys:120,uts:200,E:40,el:30,usd:5,fab:1.3,yp:0.13,proc:3.2,mh:[1,0.9],note:'披覆銅被甲的鉛心，視為整體'},
 {id:'gm',n:'被甲銅（95/5 銅鋅）',cat:'metal',rho:8.86,bhn:70,ys:280,uts:330,E:115,el:30,usd:10,fab:1.4,yp:0.45,proc:4.5},
 {id:'brass',n:'黃銅（彈殼）',cat:'metal',rho:8.5,bhn:90,ys:350,uts:450,E:110,el:30,usd:8.5,fab:1.4,yp:0.5,proc:3},
 {id:'msteel',n:'軟鋼彈芯',cat:'metal',rho:7.8,bhn:180,ys:450,uts:600,E:200,el:20,usd:1.2,fab:1.3,yp:0.75,proc:5},
 {id:'mtip',n:'中碳鋼穿透尖（SS109 類）',cat:'metal',rho:7.8,bhn:560,ys:1500,uts:1800,E:205,el:8,usd:1.8,fab:1.4,yp:1.9,proc:9},
 {id:'hsteel',n:'淬火工具鋼穿甲彈芯（HRC 60）',cat:'metal',rho:7.85,bhn:620,ys:1900,uts:2200,E:207,el:2,usd:3,fab:1.5,yp:2.3,brit:1,proc:20,lo:'S'},
 {id:'maraging',n:'麻時效鋼長桿',cat:'metal',rho:8.0,bhn:500,ys:1800,uts:1900,E:190,el:8,usd:25,fab:2,yp:2.0,proc:6,lo:'S'},
 {id:'wc',n:'碳化鎢（WC-Co）',cat:'ceramic',rho:14.9,hv:1600,rt:9,yp:4.8,brit:1,usd:70,fab:2,proc:8,ce:1,note:'M993／M995 彈芯'},
 {id:'wha',n:'鎢重合金（93W）',cat:'metal',rho:17.6,bhn:330,ys:1100,uts:1200,E:350,el:10,usd:90,fab:2,yp:1.6,proc:6,lo:'W',ss:1},
 {id:'du',n:'貧鈾合金（U-0.75Ti）',cat:'metal',rho:18.6,bhn:330,ys:900,uts:1500,E:170,el:15,usd:30,fab:3,yp:1.5,proc:10,lo:'W',ss:1.1,note:'絕熱剪切帶來自銳效應'},
 /* ceramics */
 {id:'al2o3',n:'氧化鋁陶瓷（99.5%）',cat:'ceramic',rho:3.9,hv:1500,rt:6.0,usd:25,fab:2.2,ce:1.25,bfd:0.010,mh:[2.6,0.35]},
 {id:'sic',n:'碳化矽陶瓷',cat:'ceramic',rho:3.15,hv:2500,rt:8.0,usd:100,fab:2.2,ce:1.25,bfd:0.010,mh:[2.4,0.35]},
 {id:'b4c',n:'碳化硼陶瓷',cat:'ceramic',rho:2.5,hv:3000,rt:8.6,usd:300,fab:2.2,ce:1.2,bfd:0.010,mh:[2.4,0.3],note:'超過約 1000 m/s 的硬芯撞擊會非晶化而效能下滑'},
 {id:'tib2',n:'二硼化鈦陶瓷',cat:'ceramic',rho:4.5,hv:2700,rt:10,usd:400,fab:2.2,ce:1.3,bfd:0.010,mh:[2.4,0.35]},
 /* textiles and polymers */
 {id:'k29',n:'芳綸織物 Kevlar 29',cat:'fiber',rho:1.44,fs:2.92,fe:0.036,fE:70.5,mx:1,rt:0.6,usd:40,fab:2.5,bfd:0.06,mh:[1,0.9],note:'舊式軟甲；受潮效能約降 20%'},
 {id:'km2',n:'芳綸 KM2／Kevlar 129',cat:'fiber',rho:1.44,fs:3.4,fe:0.04,fE:82.6,mx:1,rt:0.6,usd:55,fab:2.5,bfd:0.06,mh:[1,0.9]},
 {id:'peud',n:'超高分子量聚乙烯 UD 軟片',cat:'fiber',rho:0.97,fs:3.6,fe:0.037,fE:116,mx:0.92,rt:0.35,usd:90,fab:2.2,bfd:0.06,mh:[1,0.9],note:'Dyneema SB／Spectra Shield；80°C 以上開始軟化'},
 {id:'pehb',n:'超高分子量聚乙烯熱壓板',cat:'fiber',rho:0.98,fs:3.6,fe:0.037,fE:116,mx:0.92,rt:0.35,usd:85,fab:2.6,bfd:0.022,hard:1,mh:[1.4,0.8],note:'獨立式 PE 插板、頭盔'},
 {id:'aramc',n:'芳綸／酚醛複合（頭盔）',cat:'fiber',rho:1.35,fs:2.92,fe:0.036,fE:70.5,mx:0.82,rt:0.7,usd:45,fab:3,bfd:0.03,hard:1,mh:[1.2,0.85],note:'PASGT 頭盔'},
 {id:'pbo',n:'PBO（Zylon）',cat:'fiber',rho:1.56,fs:5.8,fe:0.035,fE:180,mx:1,rt:0.6,usd:150,fab:2.5,bfd:0.06,mh:[1,0.9],note:'高溫高濕下嚴重劣化'},
 {id:'nylon',n:'彈道尼龍',cat:'fiber',rho:1.14,fs:0.9,fe:0.18,fE:5.5,mx:1,rt:0.3,usd:12,fab:2,bfd:0.08,mh:[1,0.9],note:'韓戰 M1952 防破片背心'},
 {id:'silk',n:'多層絲綢（歷史）',cat:'fiber',rho:1.34,fs:0.6,fe:0.18,fE:10,mx:1,rt:0.25,usd:60,fab:2,bfd:0.08,mh:[1,0.9],note:'19 世紀末的絲質防彈衣'},
 {id:'s2g',n:'S2 玻璃纖維複材',cat:'fiber',rho:1.95,fs:2.2,fe:0.026,fE:72,mx:0.75,rt:1.0,usd:18,fab:2,bfd:0.03,hard:1,mh:[1.4,0.8]},
 {id:'pc',n:'聚碳酸酯',cat:'poly',rho:1.2,ys:65,uts:70,E:2.4,el:100,rt:0.3,usd:6,fab:1.8,mh:[1.2,0.85]},
 {id:'glass',n:'防彈玻璃（夾層）',cat:'glass',rho:2.5,rt:1.6,usd:6,fab:4,ce:1.35,mh:[3,0.4]},
 {id:'aglass',n:'汽車擋風玻璃',cat:'glass',rho:2.5,rt:1.2,usd:4,fab:3,ce:1.2,mh:[3,0.4]},
 /* civil & natural */
 {id:'conc',n:'混凝土（30 MPa）',cat:'conc',rho:2.4,rt:0.32,usd:0.12,fab:2,ce:1.0,mh:[3,0.6]},
 {id:'rconc',n:'鋼筋混凝土（40 MPa）',cat:'conc',rho:2.5,rt:0.45,usd:0.25,fab:2.5,ce:1.0,mh:[3,0.65]},
 {id:'brick',n:'紅磚牆',cat:'conc',rho:1.9,rt:0.18,usd:0.2,fab:2,ce:1.0,mh:[3,0.5]},
 {id:'sand',n:'沙包（乾沙）',cat:'soil',rho:1.6,rt:0.07,usd:0.03,fab:3,ce:1.1,mh:[2,0.9]},
 {id:'soil',n:'夯實泥土',cat:'soil',rho:1.8,rt:0.05,usd:0.01,fab:2,ce:1.0,mh:[2,0.9]},
 {id:'pine',n:'松木',cat:'wood',rho:0.5,rt:0.035,usd:0.8,fab:1.5,ce:1.0,mh:[1,0.9]},
 {id:'oak',n:'橡木',cat:'wood',rho:0.75,rt:0.06,usd:2,fab:1.5,ce:1.0,mh:[1,0.9]},
 {id:'gyp',n:'石膏板',cat:'wood',rho:0.7,rt:0.012,usd:0.4,fab:1.2,ce:1.0,mh:[1,0.9]},
 {id:'water',n:'水',cat:'liquid',rho:1.0,rt:0.0,usd:0.001,fab:1,ce:1.0},
 {id:'bone',n:'骨骼（皮質骨）',cat:'tissue',rho:1.9,rt:0.25,usd:0,fab:1,ce:1},
 {id:'flesh',n:'肌肉組織／10% 明膠',cat:'tissue',rho:1.04,rt:0.004,usd:0,fab:1,ce:1},
 /* composite blocks and reactive armour */
 {id:'chob',n:'喬巴姆型複合裝甲（等效塊）',cat:'comp',rho:3.9,tek:0.62,tec:1.25,usd:60,fab:2.5,mh:[4,0.6],note:'以「對動能／對化學能 RHA 厚度效率」描述的黑盒子'},
 {id:'dumesh',n:'貧鈾網複合裝甲（等效塊）',cat:'comp',rho:5.6,tek:0.88,tec:1.4,usd:120,fab:3,mh:[4,0.6]},
 {id:'xtc2',n:'「刑天」第二代衰變鈾複合裝甲（等效塊）',cat:'comp',rho:5.2,tek:0.84,tec:1.35,usd:62,fab:2.6,mh:[4,0.6],note:'白雪貂綜工；OmAR.03 基本型主裝甲'},
 {id:'xtc3',n:'「刑天」第三代衰變鈾複合裝甲（等效塊）',cat:'comp',rho:5.5,tek:0.96,tec:1.45,usd:78,fab:2.8,mh:[4,0.62],note:'OSU.i「第二代至第三代衰變鈾裝甲組」'},
 {id:'xtadd',n:'白雪貂附加複合裝甲模組（等效塊）',cat:'comp',rho:3.6,tek:0.62,tec:1.2,usd:45,fab:2.4,mh:[4,0.6],note:'OSU.ii／OSU.iii 額外複合裝甲'},
 {id:'graph',n:'石墨塗層',cat:'poly',rho:2.0,ys:40,uts:50,E:10,el:2,rt:0.3,usd:40,fab:3,mh:[1,0.95],note:'OSU.ii：塗覆在衰變鈾基礎裝甲上'},
 {id:'redblue',n:'「紅色藍」爆炸反應裝甲',cat:'era',rho:2.2,era:{ke:0.12,ce:0.62,st:0.18,min:35,trig:1},usd:30,fab:4,mh:[6,0],note:'EA.iv 第四代額外套件'},
 {id:'greenblue',n:'「綠色藍」爆炸反應裝甲',cat:'era',rho:2.8,era:{ke:0.33,ce:0.72,st:0.35,min:30,trig:1},usd:45,fab:4,mh:[6,0],note:'EA.v 第五代額外套件；厚面板同時削弱長桿彈'},
 {id:'slatadj',n:'可調節防爆柵欄',cat:'era',rho:2.0,era:{ke:0,ce:0,st:0.02,min:0,trig:0,slat:0.6},usd:8,fab:2.5,mh:[0,1],note:'EA.iv／EA.v；可依威脅方向調整角度'},
 {id:'nera',n:'非爆炸反應裝甲 NERA',cat:'era',rho:3.2,era:{ke:0.08,ce:0.35,st:0.30,min:30,trig:0},usd:20,fab:3,mh:[3,0.75],note:'鋼—橡膠夾層，可多次承受'},
 {id:'k1',n:'接觸-1 爆炸反應裝甲',cat:'era',rho:1.5,era:{ke:0.05,ce:0.60,st:0.10,min:40,trig:1},usd:25,fab:4,mh:[6,0],note:'只對聚能射流有效'},
 {id:'k5',n:'接觸-5 重型爆炸反應裝甲',cat:'era',rho:2.6,era:{ke:0.28,ce:0.65,st:0.35,min:40,trig:1},usd:35,fab:4,mh:[6,0],note:'15 mm 鋼面板同時削弱長桿彈'},
 {id:'relikt',n:'仙人掌／遺物 新型反應裝甲',cat:'era',rho:2.8,era:{ke:0.38,ce:0.75,st:0.35,min:35,trig:1},usd:50,fab:4,mh:[6,0]},
 {id:'slat',n:'柵欄裝甲（籠式）',cat:'era',rho:0.25,era:{ke:0,ce:0,st:0.02,min:0,trig:0,slat:0.55},usd:6,fab:2,mh:[0,1],note:'約五到六成機率使火箭彈引信短路'},
 /* 架空材料 (fictional) */
 {id:'mana',n:'魔能素合金',cat:'metal',rho:5.2,bhn:460,ys:1400,uts:1700,E:150,el:12,usd:600,fab:2.5,bfd:0.009,mh:[1.2,0.85],yp:2.2,lo:'S',
   mg:{sh:4,hd:0.8,ke:1,ce:1.1,df:5,el:0,rg:3,cap:60},note:'魔能護盾吸收衝擊能量，充能越高越硬'},
 {id:'manacer',n:'魔晶陶瓷',cat:'ceramic',rho:2.9,hv:2800,rt:9.5,usd:900,fab:2.5,ce:1.4,bfd:0.010,mh:[2,0.45],mg:{sh:2,hd:0.5,ke:1,ce:1.2,df:0,el:4,rg:1,cap:30}},
 {id:'mithril',n:'秘銀',cat:'metal',rho:4.6,bhn:520,ys:1800,uts:2100,E:160,el:18,usd:2500,fab:2.5,bfd:0.008,mh:[1,0.92],yp:2.4,lo:'S',mg:{sh:0,hd:0.25,ke:1,ce:1.15,df:0,el:4,rg:0,cap:0},note:'輕而韌；對暗屬性有抗性'},
 {id:'adam',n:'精金',cat:'metal',rho:12.5,bhn:900,ys:3500,uts:4000,E:400,el:6,usd:9000,fab:3,bfd:0.007,mh:[1,0.95],yp:4.6,lo:'W',ss:1.15,note:'極硬的架空金屬，可做裝甲也可做穿甲彈芯'},
 {id:'dragon',n:'龍鱗',cat:'ceramic',rho:2.2,hv:2300,rt:7.5,usd:5000,fab:2,ce:1.5,bfd:0.012,mh:[1.5,0.7],mg:{sh:1,hd:0.3,ke:1,ce:1.3,df:8,el:1,rg:5,cap:20},note:'鱗片重疊、帶火屬性，會再生'},
 {id:'rune',n:'符文織物',cat:'fiber',rho:1.2,fs:6.0,fe:0.04,fE:200,mx:1,rt:0.6,usd:1500,fab:3,bfd:0.05,mh:[1,0.9],mg:{sh:0.6,hd:0.2,ke:1,ce:1,df:0,el:0,rg:10,cap:8}},
 {id:'manacore',n:'魔能素彈芯合金',cat:'metal',rho:21,bhn:700,ys:2600,uts:3000,E:420,el:8,usd:4000,fab:3,yp:3.0,proc:6,lo:'W',ss:1.2,mh:[1,0.9],note:'架空：比鎢更重更硬的穿甲材料'}
];
var MI={};MATS.forEach(function(m,i){MI[m.id]=i;});
function mat(id,lib){lib=lib||MATS;for(var i=0;i<lib.length;i++)if(lib[i].id===id)return lib[i];return MATS[MI[id]]||MATS[0];}

/* target resistance (Pa) of a material for eroding / rigid penetration (Tate–Alekseevskii R_t) */
function rtOf(m){if(m.rt!==undefined&&m.cat!=='metal')return m.rt*1e9;if(m.rt!==undefined&&m.rtFix)return m.rt*1e9;
  if(m.cat==='metal'||m.cat==='poly'){var Y=((m.ys||300)+120)*1e6,E=(m.E||200)*1e9;return 1.2*(2/3)*Y*(1+Math.log(Math.max(2,2*E/(3*Y))));}
  return (m.rt||0.5)*1e9;}
function hardOf(m){return m.bhn||(m.hv?m.hv*0.95:(m.cat==='glass'?550:60));}
/* dynamic flow stress (Pa) of a material used as penetrator */
function ypOf(m){if(m.yp!==undefined)return m.yp*1e9;if(m.cat==='metal')return ((m.ys||300)*1.3)*1e6;if(m.cat==='ceramic')return 3e9;return 0.1e9;}
/* Cunniff fibre velocity U*^(1/3) (m/s) */
function cunniffU(m){var s=(m.fs||1)*1e9,e=m.fe||0.03,E=(m.fE||50)*1e9,r=(m.rho||1)*1000;return Math.pow(s*e/(2*r)*Math.sqrt(E/r),1/3);}

/* ---------- explosives: relative effectiveness (TNT=1), Gurney sqrt(2E) km/s, USD/kg ---------- */
var EXPL={tnt:['TNT',1.0,2.44,10],compb:['B 炸藥（RDX/TNT）',1.33,2.70,15],rdx:['黑索今 RDX',1.6,2.83,20],hmx:['奧克托今 HMX',1.7,2.97,90],petn:['太安 PETN',1.66,2.93,25],
  octol:['奧克托爾',1.54,2.80,60],pbx:['PBX 塑膠黏結炸藥',1.65,2.90,45],anfo:['硝銨油 ANFO',0.74,1.80,1.2],a3:['A-3 鈍化黑索今',1.5,2.75,22],bp:['黑火藥',0.55,0.9,8],
  inc:['燃燒劑（鋯／鋁熱）',0.3,0.8,30],mana:['魔晶爆藥（架空）',4,3.6,0]};

/* ---------- standard drag functions (Mach, Cd) ---------- */
var G1=[[0,.2629],[.05,.2558],[.1,.2487],[.15,.2413],[.2,.2344],[.25,.2278],[.3,.2214],[.35,.2155],[.4,.2104],[.45,.2061],[.5,.2032],[.55,.2020],[.6,.2034],[.7,.2165],[.725,.2230],[.75,.2313],[.775,.2417],[.8,.2546],[.825,.2706],[.85,.2901],[.875,.3136],[.9,.3415],[.925,.3734],[.95,.4084],[.975,.4448],[1,.4805],[1.025,.5136],[1.05,.5427],[1.075,.5677],[1.1,.5883],[1.125,.6053],[1.15,.6191],[1.2,.6393],[1.25,.6518],[1.3,.6589],[1.35,.6621],[1.4,.6625],[1.45,.6607],[1.5,.6573],[1.6,.6474],[1.7,.6347],[1.8,.6210],[1.9,.6072],[2,.5934],[2.2,.5685],[2.4,.5481],[2.6,.5325],[2.8,.5211],[3,.5133],[3.5,.5040],[4,.5006],[5,.4988],[10,.4980]];
var G7=[[0,.1198],[.3,.1194],[.5,.1194],[.6,.1194],[.65,.1197],[.7,.1202],[.75,.1215],[.8,.1242],[.825,.1266],[.85,.1306],[.875,.1368],[.9,.1464],[.925,.1660],[.95,.2054],[.975,.2993],[1,.3803],[1.025,.4015],[1.05,.4043],[1.075,.4034],[1.1,.4014],[1.15,.3955],[1.2,.3884],[1.3,.3732],[1.4,.3580],[1.5,.3440],[1.6,.3315],[1.7,.3209],[1.8,.3117],[1.9,.3042],[2,.2980],[2.2,.2864],[2.4,.2752],[2.6,.2643],[2.8,.2533],[3,.2424],[3.5,.2154],[4,.1935],[4.5,.1765],[5,.1618],[6,.1400],[10,.1200]];
function cdStd(tab,M){if(M<=tab[0][0])return tab[0][1];for(var i=1;i<tab.length;i++)if(M<=tab[i][0]){var a=tab[i-1],b=tab[i];return lerp(a[1],b[1],(M-a[0])/(b[0]-a[0]));}return tab[tab.length-1][1];}

/* ---------- environment ---------- */
function envOf(e){e=e||{};var alt=e.alt||0,T=e.T===undefined?15:e.T,p=101325*Math.pow(Math.max(0.05,1-2.25577e-5*alt),5.25588)*(e.pMul||1);
  return {rho:p/(287.05*(T+273.15)),a:20.0468*Math.sqrt(T+273.15),g:e.g===undefined?9.80665:e.g,wind:e.wind||0,T:T,alt:alt};}

/* ---------- exterior ballistics: flat-fire point mass with a G1 / G7 ballistic coefficient ----------
   returns rows every `step` metres to maxR: [range m, velocity m/s, time s, drop m (below bore line), wind drift m] */
function flyTable(P,maxR,step,env){var E=envOf(env),rows=[],v0=P.v0*(P.vMul||1),bc=P.bc||0;
  if(!(bc>0)||P.guided){for(var r=0;r<=maxR+1e-9;r+=step){var vv=P.cruise||v0;rows.push([r,v0,r/Math.max(1,vv),0,0]);}return rows;}
  var tab=P.dm==='G7'?G7:G1,BC=bc*703.0696,x=0,y=0,vx=v0,vy=0,t=0,next=0;
  while(next<=maxR+1e-9){var v=Math.sqrt(vx*vx+vy*vy);
    if(x>=next){rows.push([next,v,t,-y,E.wind*(t-next/v0)]);next+=step;continue;}
    if(v<20||t>200){while(next<=maxR+1e-9){rows.push([next,0,t,-y,0]);next+=step;}break;}
    var dt=Math.min(0.002,0.5*step/Math.max(v,1)),cd=cdStd(tab,v/E.a),k=E.rho*cd*PI/(8*BC);
    var ax=-k*v*vx,ay=-k*v*vy-E.g;var hx=vx+ax*dt/2,hy=vy+ay*dt/2,hv=Math.sqrt(hx*hx+hy*hy),cd2=cdStd(tab,hv/E.a),k2=E.rho*cd2*PI/(8*BC);
    ax=-k2*hv*hx;ay=-k2*hv*hy-E.g;
    var nx=x+hx*dt;if(nx>next&&x<next){var f=(next-x)/(nx-x);dt*=f;nx=next;}
    x=nx;y+=hy*dt;vx+=ax*dt;vy+=ay*dt;t+=dt;}
  return rows;}
function velAt(P,R,env){if(R<=0)return P.v0*(P.vMul||1);var rows=flyTable(P,R,R,env);return rows[rows.length-1][1];}

/* ---------- projectile helpers ---------- */
function coreOf(P,lib){/* the working penetrator: mass kg, diameter m, length m, density kg/m3, flow stress Pa, nose factor, brittle */
  var c=P.core||{},M=mat(c.mat||P.mat||'jlead',lib),d=(c.d||P.d)/1000,m=(c.m||P.m)/1000,rho=M.rho*1000,A=PI*d*d/4;
  var L=c.L?c.L/1000:m/(rho*A);
  return {mat:M,m:m,d:d,L:L,rho:rho,Yp:ypOf(M),N:c.N!==undefined?c.N:(P.N!==undefined?P.N:0.25),brit:!!M.brit,ss:M.ss||1,lo:M.lo};}
function noseN(crh){if(!(crh>0))return 1;return (8*crh-1)/(24*crh*crh);}

/* ---------- Lanz–Odermatt perforation limit (LOS mm) for long rods ---------- */
function loPerf(rod,v,thDeg,tgtRho,tgtBhn){/* rod: L,d in m, rho kg/m3, lo class, ss, bhnP */
  var LD=rod.L/rod.d,th=Math.min(80,Math.max(0,thDeg))*D2R,B=Math.min(tgtBhn||270,600),a,c;
  if(rod.lo==='S'){a=1.104;c=9874*Math.pow(B,0.3598)*Math.pow(rod.bhn||500,-0.2342);}else{a=0.994;c=(134.5-0.148*B)*B;}
  a*=rod.ss||1;var x=0.283+0.0656*LD,coth=1/Math.tanh(x);
  return rod.L*1000*a*coth*Math.pow(Math.cos(th),-0.224)*Math.sqrt(rod.rho/(tgtRho*1000))*Math.exp(-c*1e6/(rod.rho*v*v));}

/* ---------- Tate–Alekseevskii integrator with rigid-body regime and back-face weakening ----------
   s: {m,d,L,rho,Yp,N,brit,v}  t: {h (m, effective path), Rt Pa, rho kg/m3, lam m}
   returns {perf, P (m), v, m, L, d, N, shat, eroded} */
function taRun(s0,t){var s={hb:s0.hb,m:s0.m,d:s0.d,L:s0.L,rho:s0.rho,Yp:s0.Yp,N:s0.N,brit:s0.brit,v:s0.v,shat:!!s0.shat,ero:!!s0.ero};
  var A=PI*s.d*s.d/4,P=0,h=t.h,lam=Math.max(1e-5,t.lam),rt=t.rho,steps=0,ds=Math.max(2e-6,Math.min(h/240,s.d/30));
  if(h<=0)return {perf:true,P:0,v:s.v,m:s.m,L:s.L,d:s.d,N:s.N,shat:s.shat,ero:s.ero};
  while(steps++<60000){var rem=h-P;if(rem<=0)break;
    var R=t.Rt*Math.min(1,rem/lam);if(t.front)R*=Math.min(1,0.55+0.45*P/(0.5*s.d));
    var v=s.v;if(v<=0.5||s.L<=s.d*0.02)break;
    var pr=R+s.N*rt*v*v,yEff=s.ero?s.Yp:s.Yp*(1+Math.max(0,0.5-s.N)*K.noseY),hr=(s.hb||0)/Math.max(1,t.hb||1);
    if(s.brit&&!s.shat&&hr<K.shatH&&pr>yEff){s.shat=true;s.m*=0.55;s.L*=0.55;s.N=Math.max(s.N,0.9);s.Yp*=0.5;yEff=s.Yp;}
    if(!s.ero&&!s.shat&&hr>=K.rigH&&v<K.rigV)yEff=Infinity;
    if(pr<=yEff){/* rigid */var dt=ds/v,a=pr*A/s.m;s.v=v-a*dt;if(s.v<0){P+=v*v/(2*a);s.v=0;break;}P+=ds;}
    else{/* eroding: hydrodynamic interface with blunted nose */if(!s.ero){s.ero=true;s.N=Math.max(s.N,0.5);}
      var rp=s.rho,A2=0.5*(rp-rt),B=-rp*v,C=0.5*rp*v*v+s.Yp-R,u;
      if(C<=0)u=0;else if(Math.abs(A2)<1e-6)u=C/(rp*v);else{var disc=B*B-4*A2*C;u=disc<0?v:(-B-Math.sqrt(disc))/(2*A2);}
      u=clamp(u,0,v);var dt2=ds/Math.max(u,0.25*v,1);
      s.v=v-s.Yp/(rp*s.L)*dt2;s.L-=(v-u)*dt2;P+=u*dt2;if(s.L<0)s.L=0;s.m=rp*A*s.L;}
  }
  var perf=P>=h-1e-9&&s.v>0.5&&s.L>s.d*0.02;
  return {perf:perf,P:Math.min(P,h),v:perf?s.v:0,m:s.m,L:s.L,d:s.d,N:s.N,shat:s.shat,ero:s.ero};}

/* ---------- model constants (calibrated against public reference data, see lato-armory notes) ---------- */
var K={coreAdd:0.25,shatH:1.05,rigH:1.1,rigV:1100,sizeD:20,sizeE:0.2,softLam:1.0,noseY:4,shatK:1.3,rtC:1.25,lamM:1.0,lamMh:0.7,lamCer:2.6,lamCerS:0.6,soft:1.0,cunF:1.62,cunB:0.3333,florE:1.0,bfdSig:327e3,
  ricoLR:76,ricoAP:66,ricoBul:62,ricoSC:78,gelR:1.6e6,gelBase:0.95,gelRho:1040,gelPc:2.0e6,gelD0:800};

/* projectile kinds: soft (deforming bullet), core (hard-core / full-calibre AP / steel core ball), lr (long rod / APDS core, Lanz–Odermatt), frag (fragment / FSP), shot (pellets),
   sc (shaped charge), hesh, he (high explosive / HEI, blast & fragments) */
var KINDN={soft:'鉛心彈／擴張彈',core:'硬芯穿甲彈',lr:'長桿穿甲彈（尾翼穩定脫殼／脫殼）',frag:'破片／破片模擬彈',shot:'霰彈丸',sc:'聚能裝藥（反坦克高爆）',hesh:'碎甲彈（高爆塑性）',he:'高爆彈／高爆燃燒彈'};

/* ---------- ricochet: critical obliquity and probability ---------- */
function ricochet(kind,st,lay,th,M){if(th<=0)return {p:0,tc:90};
  var d=st.d*1000,t=lay.t,om=Math.max(0.05,t/Math.max(0.5,d)),base;
  if(kind==='lr')base=K.ricoLR+6*clamp((st.v-1500)/500,-1,1)-4*Math.log(om/2.5);
  else if(kind==='sc')base=K.ricoSC;
  else if(kind==='core'||kind==='frag')base=K.ricoAP+5*clamp((st.v-800)/400,-1,1)-6*Math.log(om)-(st.cap?-6:0);
  else if(kind==='hesh'||kind==='he')base=72;
  else base=K.ricoBul+4*clamp((st.v-700)/400,-1,1)-6*Math.log(om);
  var hard=(M.bhn||(M.hv?M.hv*0.95:100));base-=clamp((hard-300)/100,-3,4);
  if(M.cat==='fiber'||M.cat==='soil'||M.cat==='wood'||M.cat==='liquid'||M.cat==='tissue')base+=12;
  base=clamp(base,45,88);var p=1/(1+Math.exp(-(th-base)/2.2));return {p:p,tc:base};}

/* ---------- magic state for a layer ---------- */
function magicOf(M,P,opt,lay){var g=M.mg;if(!g)return null;var ch=clamp(opt.charge===undefined?1:opt.charge,0,1.5),pm=P.mg||{},el=ELM[pm.el||0][g.el||0];
  var disp=clamp(pm.dp||0,0,1),k=ch*(1-disp)*el*(lay&&lay.mgk!==undefined?lay.mgk:1);
  return {k:k,sh:(g.sh||0)*1000*k,hd:1+(g.hd||0)*k,ke:1+((g.ke||1)-1)*k,ce:1+((g.ce||1)-1)*k,df:(g.df||0)*k,el:el};}

/* ---------- armour stack evaluation for kinetic projectiles ----------
   P projectile, v impact velocity, layers [{mat, t mm, ang deg (NATO obliquity), gap mm after}], opt {lib, charge, range}
   returns {perf, ric, layers:[...], vRes, mRes, dop, note} */
function kinState(P,v,lib){var c=coreOf(P,lib),bm=(P.m||0)/1000,st={hb:hardOf(c.mat),v:v,m:c.m,d:c.d,L:c.L,rho:c.rho,Yp:c.Yp,N:c.N,brit:c.brit,ss:c.ss,lo:c.lo,bhnP:c.mat.bhn,
    mTot:bm||c.m,dTot:(P.d||c.d*1000)/1000,dfm:P.dfm||0,def:1,yaw:0,cap:!!P.cap,shat:false,ero:false,kind:P.k};
  if(P.k==='core'&&bm>c.m){st.m=c.m+K.coreAdd*(bm-c.m);}
  return st;}
function soft2(st){return st.kind==='soft'||st.kind==='shot';}
/* Cunniff ballistic limit (m/s) for a textile system of areal density ad (kg/m2) */
function cunV50(U,ad,Ap,m){var phi=ad*Ap/m;return U*K.cunF*Math.pow(phi,K.cunB)/(1+0.15*Math.pow(phi,0.8));}
function defDia(st,hardFace){var f=1+st.dfm*Math.min(1,st.v/650)*(hardFace?1.25:1);return st.dTot*f*Math.max(1,st.def);}

var LOC={},LOCN=0;
function stackKE(P,v,layers,opt){opt=opt||{};var lib=opt.lib,st=kinState(P,v,lib),out=[],kind=P.k,i,res={perf:true,ric:false,layers:out,note:[]};
  var pm=P.mg||{};if(pm.bo)st.v*=Math.sqrt(1+pm.bo);
  var pierce=pm.pi||1,lrCal=null,cone=null,E0=0.5*st.mTot*v*v;
  for(i=0;i<layers.length;i++){var Ly=layers[i],M=mat(Ly.mat,lib),th=clamp(+Ly.ang||0,0,89),t=Math.max(0,+Ly.t||0),row={i:i,mat:M,t:t,ang:th,vIn:st.v,mIn:st.m};
    out.push(row);if(t<=0){row.res='略過';continue;}
    var mg=magicOf(M,P,opt,Ly);
    if(mg){row.mg=mg;th=clamp(th+mg.df,0,89);if(mg.sh>0){var mm=st.kind==='core'||st.kind==='lr'?st.m:st.mTot,ek=0.5*mm*st.v*st.v,ab=Math.min(ek,mg.sh);row.shield=ab;st.v=Math.sqrt(Math.max(0,(ek-ab)*2/mm));
      if(st.v<=1){row.res='被魔能護盾吸收';row.stop=true;res.perf=false;break;}}}
    var norm=(kind==='core'||kind==='frag')?(st.cap?6:3):0;var thE=Math.max(0,th-(th>norm?norm:th));row.angE=thE;
    var rc=ricochet(kind,st,{t:t},thE,M);row.rico=rc.p;row.tc=rc.tc;
    if(rc.p>=0.5&&M.cat!=='era'){row.res='跳彈';row.stop=true;res.perf=false;res.ric=true;break;}
    var cos=Math.cos(thE*D2R),hLos=t/1000/cos,Rt=rtOf(M)*K.rtC*(mg?mg.hd:1)/pierce*(kind==='lr'?1:clamp(Math.pow(K.sizeD/(st.d*1000),K.sizeE),0.7,1.6)),rhoT=M.rho*1000;
    row.los=hLos*1000;
    /* reactive / slat */
    if(M.cat==='era'){var e=M.era,big=kind==='lr'||(kind==='core'&&st.m>0.02);
      var eff=thE<e.min?Math.max(0,(thE-10)/(e.min-10)):1;eff=clamp(eff*Math.sin(Math.max(thE,10)*D2R)/Math.sin(60*D2R),0,1.1);
      if(kind==='lr'&&e.ke>0){var red=e.ke*eff;st.L*=(1-red);st.yaw+=red*0.5;row.res='反應裝甲削弱長桿 '+Math.round(red*100)+'%';}
      else row.res=e.slat?'柵欄（對動能彈無效）':'未觸發';
      var stEq=e.st*t/1000;if(stEq>0){var r0=taRun(st,{h:stEq/cos,Rt:rtOf(mat('rha'))*K.rtC,rho:7850,lam:st.d*K.lamM});
        if(!r0.perf){row.res+='；彈體被反應裝甲鋼板擋下';row.stop=true;res.perf=false;row.dop=r0.P*1000;break;}upd(st,r0);}
      row.vOut=st.v;row.mOut=st.m;continue;}
    /* composite block: equivalent RHA */
    if(M.cat==='comp'){var hE=hLos*(M.tek||0.6)*(mg?mg.ke:1);
      if(kind==='lr'){var rr=rodLayer(st,hE*1000,0,mat('rha'),lrCal,thE,true);lrCal=rr.cal;if(!rr.perf){row.res='擋下';row.stop=true;res.perf=false;row.dop=rr.dop/(M.tek||0.6);break;}row.res='貫穿';row.vOut=st.v;row.mOut=st.m;continue;}
      var r1=taRun(st,{h:hE,Rt:rtOf(mat('rha'))*K.rtC,rho:7850,lam:st.d*K.lamM});row.dop=r1.P*1000/(M.tek||0.6);
      if(!r1.perf){row.res='擋下';row.stop=true;res.perf=false;break;}upd(st,r1);row.res='貫穿';row.vOut=st.v;row.mOut=st.m;continue;}
    /* textiles: Cunniff, group consecutive fibre plies of the same flexibility */
    if(M.cat==='fiber'&&kind!=='lr'){var ad=t/1000*rhoT*(mg?mg.ke:1),Ap,mEff,vIn=st.v,U=cunniffU(M)*(M.mx||1),j=i;
      while(j+1<layers.length&&mat(layers[j+1].mat,lib).cat==='fiber'&&!(layers[j+1].gap>0)&&!(layers[j].gap>0)){j++;var M2=mat(layers[j].mat,lib),t2=+layers[j].t||0;ad+=t2/1000*M2.rho*1000;U=Math.max(U,cunniffU(M2)*(M2.mx||1));
        out.push({i:j,mat:M2,t:t2,ang:th,vIn:st.v,mIn:st.m,res:'（併入上層計算）',los:t2/cos});}
      ad/=cos;
      if(cone){Ap=PI*cone.a*cone.a;mEff=st.mTot+cone.m;vIn=st.v*st.mTot/mEff;}else{var dd=defDia(st,M.hard);Ap=PI*dd*dd/4*(1+st.yaw*2);mEff=st.mTot;}
      var V50=cunV50(U,ad,Ap,mEff);if(cone&&cone.flor)V50=Math.max(V50,cone.flor);
      row.v50=V50;row.vEff=vIn;row.ad=ad;
      if(vIn<=V50){row.res='擋下';row.stop=true;res.perf=false;row.catchE=0.5*st.mTot*st.v*st.v;res.catcher=M;res.catchAD=ad;break;}
      var vr=Math.sqrt(vIn*vIn-V50*V50);st.v=cone?vr*mEff/st.mTot*0.6:vr;st.def=Math.max(st.def,1.2);cone=null;row.res='貫穿';row.vOut=st.v;row.mOut=st.m;
      if(Ly.gap>0)st.yaw+=0.1;i=j;continue;}
    /* long rods: Lanz–Odermatt calibrated Tate model */
    if(kind==='lr'){var rl=rodLayer(st,hLos*1000*(mg?1/mg.ke:1),Ly.gap||0,M,lrCal,thE,false,Rt/K.rtC*pierce/(rtOf(M)*(mg?mg.hd:1)));lrCal=rl.cal;row.dop=rl.dop;
      if(!rl.perf){row.res='擋下';row.stop=true;res.perf=false;break;}
      row.res='貫穿';if(thE>45&&t/1000<2.5*st.d){var yw=0.05*(thE-45)/45;st.yaw+=yw;}row.vOut=st.v;row.mOut=st.m;continue;}
    /* compact projectiles: ceramics, metals and everything else through the eroding / rigid integrator */
    var nextBack=i+1<layers.length&&!(Ly.gap>0)&&['fiber','metal','poly'].indexOf(mat(layers[i+1].mat,lib).cat)>=0;
    var lam=M.cat==='ceramic'?(nextBack?K.lamCerS:K.lamCer)*st.d:(M.cat==='metal'?((M.bhn||200)>420?K.lamMh:K.lamM)*st.d:1.2*st.d);
    if(soft2(st))lam*=K.softLam;
    var hEff=hLos*(mg?1/mg.ke:1);
    var sIn={hb:st.hb,m:st.m,d:st.d*(soft2(st)?Math.max(1,st.def):1),L:st.L,rho:st.rho,Yp:st.Yp,N:st.N,brit:st.brit,v:st.v,shat:st.shat,ero:st.ero};
    if(st.yaw>0){sIn.d*=1+st.yaw;sIn.L/=(1+st.yaw)*(1+st.yaw);}
    if(M.fh&&!st.cap&&st.brit)sIn.Yp*=0.8;
    if(M.id==='b4c'&&st.v>950&&(st.Yp>2e9))Rt*=0.85;
    var r2=taRun(sIn,{h:hEff,Rt:Rt,rho:rhoT,lam:lam,front:true,hb:hardOf(M)});row.dop=r2.P*1000;
    if(r2.shat&&!st.shat)row.shat=true;
    if(M.cat==='ceramic'&&nextBack){var hc=hEff*Math.pow((M.hv||1500)/1500,0.35),a=st.dTot/2+2*hc,Lb=layers[i+1],Mb=mat(Lb.mat,lib),hb=(+Lb.t||0)/1000/cos;
      var mr=r2.perf?r2.m:Math.max(r2.m,0)+0.0*st.m,ring=(hc*rhoT+hb*Mb.rho*1000)*PI*a*a;
      var mp=soft2(st)?0.5*st.mTot:(r2.perf?Math.max(r2.m,0.5*st.m):st.m*(r2.shat?0.85:1))+0.1*(st.mTot-st.m),fa=mp/((mp+ring)*PI*a*a);
      var eb=Mb.cat==='fiber'?(Mb.fe||0.03):(Math.max(0.03,(Mb.el||10)/100*0.5)),sb=Mb.cat==='fiber'?(Mb.fs||2)*1e9*0.35*(Mb.mx||1):(Mb.uts||400)*1e6;
      var flor=Math.sqrt(eb*sb*hb*K.florE/(0.91*mp*fa));
      cone={a:a,m:0.5*hc*rhoT*PI*a*a,flor:flor,vC:r2.perf?r2.v:0};
      row.res=r2.perf?'彈芯穿過陶瓷，由背板承接':'陶瓷碎裂成錐，彈芯侵蝕';row.cone=a*1000;
      var vCer=st.v;st.m=Math.max(r2.m,mp*0.5);st.L=Math.max(r2.L,st.d*0.5);st.N=Math.max(r2.N,0.5);st.shat=r2.shat;st.ero=true;st.v=r2.perf?Math.max(r2.v,vCer*0.8):vCer*0.8;
      /* the backing decides: Florence limit on the remaining projectile */
      var vb=vCer,Mb2=Mb;i++;var row2={i:i,mat:Mb2,t:+Lb.t||0,ang:th,vIn:vb,mIn:st.m,los:hb*1000};out.push(row2);row2.v50=flor;
      if(vb<=flor){row2.res='背板承接（Florence 判據）';row2.stop=true;res.perf=false;res.catcher=Mb2;res.catchAD=ring/(PI*a*a);row2.catchE=E0;break;}
      var vr2=Math.sqrt(vb*vb-flor*flor)*mp/(mp+0.3*ring);st.v=vr2;st.m=mp;st.mTot=mp;st.def=1.5;row2.res='貫穿背板';row2.vOut=st.v;row2.mOut=st.m;cone=null;continue;}
    if(!r2.perf){row.res=r2.ero&&r2.L<=st.d*0.05?'彈體侵蝕殆盡':'擋下';row.stop=true;res.perf=false;res.catcher=M;res.catchAD=hEff*rhoT;row.catchE=0.5*st.mTot*st.v*st.v;break;}
    /* plug momentum for blunt / deformed projectiles on thin plates */
    var hb2=hEff;if((r2.ero||st.N>=0.5)&&hb2<1.5*st.d&&M.cat==='metal'){var plug=rhoT*PI*st.d*st.d/4*hb2,mm2=r2.m+(soft2(st)?0:0.2*(st.mTot-st.m));r2.v*=mm2/(mm2+plug);}
    upd(st,r2);if(soft2(st))st.def=Math.max(st.def,M.cat==='metal'||M.cat==='ceramic'||M.cat==='glass'?1.6:1.15);
    if(M.cat==='ceramic'&&!nextBack){row.res='貫穿（無背板，陶瓷碎裂）';}else row.res='貫穿';
    if(Ly.gap>0&&kind!=='lr'){st.yaw+=clamp(0.15+0.4*thE/60,0,0.8)*(soft2(st)?1.3:0.7);}
    row.vOut=st.v;row.mOut=st.m;}
  res.vRes=res.perf?st.v:0;res.mRes=res.perf?st.m:0;res.st=st;res.E0=E0;return res;
  function upd(s,r){s.v=r.v;s.m=r.m;s.L=r.L;s.N=r.N;s.shat=r.shat;s.ero=r.ero;if(s.kind!=='core'&&s.kind!=='lr'&&s.kind!=='frag')s.mTot=Math.max(r.m,s.mTot*0.6);else if(r.m<s.m)s.mTot=Math.max(r.m,s.mTot-(s.m-r.m));}
  function rodLayer(s,hmm,gap,M,cal,thE,isComp,rtScale){
    /* calibration: Tate resistance scale so that the Tate perforation of RHA equals Lanz–Odermatt at this state (normal incidence) */
    if(!cal){var ck=[s.L,s.d,s.rho,s.lo,s.ss,s.bhnP,Math.round(s.v*2),pierce,s.m].join('|');cal=LOC[ck];
      if(!cal){var rod={L:s.L,d:s.d,rho:s.rho,lo:s.lo,ss:s.ss,bhn:s.bhnP},want=loPerf(rod,s.v,0,7.85,270)/1000*(pierce),lo=0.05,hi=8,rRHA=rtOf(mat('rha'));
        for(var it=0;it<32;it++){var mid=Math.sqrt(lo*hi),rr=taRun(s,{h:want,Rt:rRHA*mid,rho:7850,lam:s.d});if(rr.perf)lo=mid;else hi=mid;}
        cal={k:Math.sqrt(lo*hi)};if(++LOCN>5000){LOC={};LOCN=0;}LOC[ck]=cal;}}
    var Rt2=rtOf(M)*cal.k*(rtScale||1),obl=Math.pow(Math.cos(thE*D2R),0.224),h=hmm/1000*obl;
    if(M.cat==='ceramic'||M.cat==='glass')Rt2*=1.0;
    if(s.yaw>0){h*=1+s.yaw*1.5;}
    var r=taRun(s,{h:h,Rt:Rt2,rho:M.rho*1000,lam:s.d});
    if(!r.perf)return {perf:false,dop:r.P*1000/obl,cal:cal};
    s.v=r.v;s.m=r.m;s.L=r.L;s.mTot=r.m;
    if(gap>0&&s.yaw>0)s.L*=Math.max(0.5,1-s.yaw*0.5);
    return {perf:true,dop:r.P*1000/obl,cal:cal};}
}

/* ---------- shaped charges ---------- */
function scStandoff(sd,prec){/* penetration fraction vs standoff in charge diameters; prec 1 (crude) .. 5 (precision) */
  var opt=1.5+1.1*prec,w=4+5*prec;var rise=Math.pow((sd+0.6)/(opt+0.6),0.45);if(sd<=opt)return Math.min(1,rise);var x=(sd-opt)/w;return Math.exp(-x*x*0.7)*0.85+0.15/(1+x);}
function scCapacity(P,sdExtra){var s=P.sc,cd=s.cd,k=s.k||5,prec=s.pr||3,liner=s.ln||'cu',lf={cu:1,ta:1.12,mo:1.08,fe:0.82,al:0.55,mana:1.3}[liner]||1;
  var so=(s.so===undefined?2.5:s.so)+(sdExtra||0)/cd,f=scStandoff(so,prec)/scStandoff(s.so===undefined?2.5:s.so,prec);
  var spin=P.spin?0.65:1;return cd*k*lf*f*spin*((P.mg&&P.mg.pi)||1);}
function teCE(M,mg){if(M.cat==='comp')return (M.tec||1)*(mg?mg.ce:1);if(M.cat==='era')return 0.3;
  var rr=Math.max(0.005,rtOf(M)/1e9),rh=4.4;return Math.sqrt(M.rho/7.85)*Math.pow(rr/rh,0.15)*(M.ce||1)*(mg?mg.ce:1);}
function stackSC(P,layers,opt){opt=opt||{};var lib=opt.lib,cap=scCapacity(P,0),out=[],res={perf:true,layers:out,note:[]},prec=0,i,gapSum=0,tandem=P.sc.tan||0;
  if(P.mg&&P.mg.bo)cap*=1+0.5*P.mg.bo;res.cap0=cap;
  for(i=0;i<layers.length;i++){var Ly=layers[i],M=mat(Ly.mat,lib),th=clamp(+Ly.ang||0,0,89),t=+Ly.t||0,row={i:i,mat:M,t:t,ang:th,capIn:cap};out.push(row);if(t<=0){row.res='略過';continue;}
    var mg=magicOf(M,P,opt,Ly);if(mg){row.mg=mg;th=clamp(th+mg.df,0,89);if(mg.sh>0){var red=mg.sh/(mg.sh+40000);cap*=1-red;row.shield=red;}}
    if(i===0&&th>=K.ricoSC){var pg=1/(1+Math.exp(-(th-K.ricoSC-2)/2));if(pg>0.5){row.res='掠射：引信未作用或跳飛';row.stop=true;res.perf=false;res.ric=true;break;}}
    var los=t/Math.cos(th*D2R);row.los=los;
    if(M.cat==='era'){var e=M.era;
      if(e.slat){var rng=mb32(hstr((opt.seed||'s')+'|'+i))(),pd=P.rocket?e.slat:0;row.res=pd>0?'柵欄：短路機率 '+Math.round(pd*100)+'%':'柵欄：無效';if(pd>=0.5&&!opt.noSlatStop){row.res+='（判定為攔截）';row.stop=true;res.perf=false;break;}continue;}
      var eff=th<e.min?Math.max(0,(th-10)/(e.min-10)):1;eff=clamp(eff*Math.sin(Math.max(th,10)*D2R)/Math.sin(60*D2R),0,1.1);
      if(e.trig&&tandem){row.res='串聯前驅裝藥引爆反應裝甲';tandem=0;cap-=e.st*los;continue;}
      var r=e.ce*eff;cap=cap*(1-r)-e.st*los;row.res='反應裝甲削弱射流 '+Math.round(r*100)+'%';row.capOut=cap;if(cap<=0){row.stop=true;res.perf=false;row.res+='，射流耗盡';break;}continue;}
    var te=teCE(M,mg),need=los*te;row.te=te;
    if(gapSum>0){cap*=scStandoff((P.sc.so||2.5)+gapSum/P.sc.cd,P.sc.pr||3)/scStandoff(P.sc.so||2.5,P.sc.pr||3);}
    if(need>=cap){row.dop=cap/te;row.res='擋下';row.stop=true;res.perf=false;cap=0;break;}
    cap-=need;row.res='貫穿';row.capOut=cap;gapSum+=(+Ly.gap||0);}
  res.capRes=Math.max(0,cap);return res;}

/* ---------- HESH and HE against plates ---------- */
function heEq(P){var h=P.he||{};var x=EXPL[h.x||'tnt']||EXPL.tnt;var w=(h.g||0)/1000*x[1];if(P.mg&&P.mg.bu)w+=P.mg.bu;return w;}
function stackHE(P,layers,opt){opt=opt||{};var lib=opt.lib,w=heEq(P),out=[],res={perf:false,layers:out,note:[]};
  if(!layers.length)return res;var L0=layers[0],M=mat(L0.mat,lib),t=+L0.t||0,th=clamp(+L0.ang||0,0,89);
  var spaced=layers.length>1&&(L0.gap>0);
  if(P.k==='hesh'){var lim=1.15*P.d*Math.pow(w/Math.max(0.05,Math.pow(P.d/100,3)*2.4),1/3)*Math.sqrt(7.85/M.rho)*Math.pow(4.4e9/Math.max(1e8,rtOf(M)),0.35);
    if(M.cat!=='metal')lim*=0.35;if(spaced)lim*=0.25;var tN=t;out.push({i:0,mat:M,t:t,ang:th,res:'',lim:lim});
    if(tN<=lim){out[0].res='背面剝落（碎甲）：崩落片約 '+Math.round(Math.max(0.2,(lim-tN)/lim)*100+30)+'% 面積的鋼片高速飛出';res.perf=true;res.spall=true;}
    else out[0].res='未能產生背面剝落';
    res.lim=lim;return res;}
  var br=15*Math.pow(w,1/3)*Math.sqrt(7.85/M.rho)*Math.pow(4.4e9/Math.max(1e8,rtOf(M)),0.4),los=t/Math.cos(th*D2R);
  out.push({i:0,mat:M,t:t,ang:th,los:los,lim:br,res:los<=br?'炸開破口':'未擊穿（僅爆壓與破片）'});res.perf=los<=br;res.lim=br;return res;}

/* ---------- top-level: evaluate a projectile against a stack at a range ---------- */
function evaluate(P,layers,o){o=o||{};var env=o.env,v=o.v!==undefined?o.v:velAt(P,o.range||0,env),r;
  if(P.k==='sc')r=stackSC(P,layers,o);else if(P.k==='hesh'||P.k==='he')r=stackHE(P,layers,o);else r=stackKE(P,v,layers,o);
  r.v=v;r.kind=P.k;
  if(P.mg&&P.mg.bu&&P.k!=='he'&&P.k!=='hesh'){r.burst=P.mg.bu;}
  if(!r.perf&&r.catcher&&r.catchAD){var M=r.catcher,E=r.E0||0,coef=M.bfd||0.012,ad=r.catchAD;
    if(M.cat==='fiber'&&!M.hard)coef*=Math.sqrt(5.2/Math.max(0.5,ad));else if(M.cat==='fiber')coef*=Math.sqrt(20/Math.max(2,ad));
    var R=M.cat==='fiber'&&!M.hard?0.045:0.06,Ec=E*coef;r.bfd=Math.sqrt(Ec/(K.bfdSig*PI*R))*1000;r.bfdE=Ec;}
  return r;}

/* perforation limit thickness (mm, plate thickness at obliquity th) of material id for a projectile at velocity v */
function perfLimit(P,v,matId,th,o){o=o||{};var lo=0,hi=8,lay=function(t){return [{mat:matId,t:t,ang:th||0}];};
  var probe=function(t){var r=P.k==='sc'?stackSC(P,lay(t),o):stackKE(P,v,lay(t),o);return r.perf&&!r.ric;};
  if(P.k==='sc'){var c=scCapacity(P,0);var M=mat(matId,o.lib);return c/teCE(M)*Math.cos((th||0)*D2R);}
  if(P.k==='hesh'||P.k==='he'){return stackHE(P,lay(1),o).lim*Math.cos((th||0)*D2R);}
  while(probe(hi)&&hi<4000)hi*=2;if(!probe(lo+0.01)&&!probe(0.3))return 0;
  for(var i=0;i<30;i++){var m=(lo+hi)/2;if(probe(m))lo=m;else hi=m;if(hi-lo<0.05)break;}return (lo+hi)/2;}
/* ballistic limit velocity V50 of a stack (m/s) */
function v50Stack(P,layers,o){o=o||{};if(P.k==='sc'||P.k==='hesh'||P.k==='he')return null;var lo=30,hi=Math.max(400,(P.v0||800)*1.5);
  var ok=function(v){var r=stackKE(P,v,layers,o);return r.perf&&!r.ric;};var n=0;while(!ok(hi)&&n++<8)hi*=1.6;if(!ok(hi))return Infinity;if(ok(lo))return lo;
  var tol=o.tol||0.5;for(var i=0;i<34;i++){var m=(lo+hi)/2;if(ok(m))hi=m;else lo=m;if(hi-lo<tol)break;}return (lo+hi)/2;}
function pPerf(v,v50,spread){if(v50===null)return null;if(!isFinite(v50))return 0;var s=(spread||0.035)*v50;return ncdf((v-v50)/s);}

/* ---------- armour bookkeeping: areal density, cost per m2 ---------- */
function stackAD(layers,lib){var ad=0;layers.forEach(function(L){var M=mat(L.mat,lib);ad+=(+L.t||0)/1000*M.rho*1000;});return ad;}
function stackThick(layers){var t=0;layers.forEach(function(L){t+=(+L.t||0)+(+L.gap||0);});return t;}
function stackCostM2(layers,lib,kindAssy){var c=0,parts=[];layers.forEach(function(L){var M=mat(L.mat,lib),ad=(+L.t||0)/1000*M.rho*1000,x=ad*(M.usd||1)*(M.fab||1);c+=x;parts.push([M.n,ad,x]);});
  var assy=kindAssy==='body'?380:kindAssy==='veh'?260:120;return {usd:(c+assy)*1.3,parts:parts,assy:assy};}

/* ---------- ammunition cost & weight ---------- */
var GROUPS={pistol:['手槍彈',1e7,0.02],rifle:['步槍彈',1e7,0.03],hmg:['重機槍彈',1e6,0.3],auto:['機砲彈',2e5,3],tank:['戰車砲彈',2e4,250],art:['火砲／迫擊砲彈',5e4,120],
  rkt:['火箭與飛彈',2e3,400],shot:['霰彈',5e6,0.05],gren:['榴彈／手榴彈',2e5,4],frag:['破片模擬彈',1e5,0.1],magic:['架空彈藥',1e4,5]};
var MARKET={mil:['軍方合約',1],own:['自產成本價',0.72],civ:['民間零售',1.65],war:['戰時黑市',4]};
function caseOf(P){return P.cs||{};}
function roundMass(P){var c=caseOf(P);if(P.rw)return P.rw;return (P.m||0)+(c.g||0)+(P.prop||0)+(P.pr||0.3);}
function rawCost(P,lib){var parts=[],add=function(n,u){if(u>0)parts.push([n,u]);};
  (P.bom||[]).forEach(function(b){var M=mat(b[0],lib);add(M.n+' '+b[1]+' g',b[1]/1000*(M.usd||1)*(M.proc||3));});
  var c=caseOf(P);if(c.g){var CM=mat(c.mat||'brass',lib);add('彈殼（'+CM.n+'）',c.g/1000*(CM.usd||1)*(c.mat==='steel'||c.mat==='msteel'?3.5:(CM.proc||3)));}
  if(P.prop)add('發射藥 '+P.prop+' g',P.prop/1000*22);
  if(P.he&&P.he.g){var X=EXPL[P.he.x||'tnt']||EXPL.tnt;add(X[0]+' '+P.he.g+' g',P.he.g/1000*X[3]*1.6);}
  if(P.sc)add('聚能藥型罩與裝藥',Math.pow(P.sc.cd/10,2.2)*0.9);
  if(P.x)Object.keys(P.x).forEach(function(k){add(k,P.x[k]);});
  if(P.mg&&P.mg.mc)add('魔晶 '+P.mg.mc+' g',P.mg.mc/1000*(P.mg.mcp===undefined?100:P.mg.mcp));
  var G=GROUPS[P.g]||GROUPS.rifle;add('裝配與檢驗',G[2]);
  var s=0;parts.forEach(function(p){s+=p[1];});return {sum:s,parts:parts};}
function costOf(P,o){o=o||{};var raw=rawCost(P,o.lib),G=GROUPS[P.g]||GROUPS.rifle,lot=o.lot||G[1],learn=Math.pow(lot/G[1],-0.152),mk=(MARKET[o.market||'mil']||MARKET.mil)[1];
  var cx=P.cx||1.3;return {usd:raw.sum*cx*learn*mk,raw:raw,cx:cx,learn:learn,mk:mk};}
/* complexity factor so that a preset reproduces its reference contract price */
function calibrateCost(P,lib){if(P.ref){var raw=rawCost(P,lib);P.cx=Math.round(Math.max(0.3,P.ref/raw.sum)*1000)/1000;}else if(!P.cx)P.cx=1.3;return P.cx;}

/* ---------- wound ballistics in 10% ordnance gelatin ----------
   returns profile rows [depth cm, presented diameter mm, temporary cavity diameter mm, velocity m/s, yaw deg, mass g] and summary */
function gelRun(P,v,o){o=o||{};var depth=(o.depth||80)/100,dx=0.002,rho=K.gelRho*(o.rhoMul||1),R=K.gelR*(o.rMul||1),g=P.gel||{},m=(P.m||8)/1000,d0=(P.d||9)/1000,L=(P.L||P.d*2)/1000;
  var pel=P.k==='shot'?(P.pel||1):1;if(P.k==='shot'){m=(P.pm||3.5)/1000;d0=(P.pd||8.4)/1000;L=d0;}
  var cdN=g.cd||0.3,neck=(g.nk===undefined?20:g.nk)/100,ex=g.ex||1,vx=g.vx||300,vf=g.vf||0,ff=g.ff||0,a0=(g.a0||3)*D2R,plugged=!!o.plug;
  if(plugged){ex=1+(ex-1)*0.15;}
  if(o.preDef)ex=Math.max(ex,o.preDef);
  var rows=[],x=0,vv=v,mm=m,yaw=a0,dE=[],frag=0,fragM=0,crush=0,stretch=0,E0=0.5*m*v*v*pel,expD=d0,expanded=false,tumbled=false,maxTC=0,maxTCx=0,xYaw=null,fragDone=false,fragList=[];
  var exMax=ex>1?Math.min(ex,1+(ex-1)*clamp((v-vx*0.8)/(vx*0.9),0,1.25)):1;if(ex>1&&v>2.2*vx)exMax=Math.max(1.15,exMax*0.92);
  var eLen=0.025;
  while(x<depth&&vv>8){
    /* expansion over the first ~2.5 cm */
    var dcur=d0;if(exMax>1){var f=Math.min(1,x/eLen);dcur=d0*(1+(exMax-1)*f);expanded=f>=1;}
    /* yaw growth: stable nose-forward until neck, then exponential growth to 90 deg; expanded bullets stay nose-forward */
    if(exMax<=1.08&&P.k!=='shot'){if(x>neck*0.7){var gr=Math.log(90/(a0/D2R))/(neck*0.3+1e-3);yaw=Math.min(PI-0.05,a0*Math.exp(gr*(x-neck*0.7)));if(yaw>PI/2-0.05&&xYaw===null)xYaw=x;}}
    var sy=Math.abs(Math.sin(Math.min(yaw,PI/2))),cy=Math.abs(Math.cos(Math.min(yaw,PI/2)));
    var baseF=false;if(yaw>PI/2){var y2=PI-yaw;sy=Math.sin(y2)*0.85;cy=Math.cos(y2);baseF=true;}
    var Ln=Math.max(dcur,L*(mm/m)),A=PI*dcur*dcur/4*cy+Ln*dcur*sy*0.92,cd=(baseF?K.gelBase:cdN)*cy+1.15*sy;if(exMax>1.08)cd=Math.max(cdN,0.25+0.42*(dcur/d0-1)/Math.max(0.01,exMax-1));
    if(P.k==='shot'){cd=0.5;A=PI*dcur*dcur/4*1.1;}
    /* fragmentation of the yawing jacketed bullet */
    if(!fragDone&&vf>0&&v>=vf&&yaw>50*D2R){fragDone=true;var fm=mm*ff*clamp((v-vf)/350+0.75,0.5,1.2);if(fm>mm*0.8)fm=mm*0.8;fragM=fm;mm-=fm;frag=Math.round(6+fm*1000*5);
      for(var k=0;k<frag;k++){var r=mb32(hstr(P.id+'|'+k)),fd=Math.min(0.12,0.02+r()*0.10*(vv/900));fragList.push(x+fd);}A*=1.35;}
    else if(!fragDone&&vf>0&&v<vf&&yaw>50*D2R){fragDone=true;}
    var F=0.5*rho*cd*A*vv*vv+R*A,ek=0.5*mm*vv*vv,dEk=F*dx;if(dEk>ek){dEk=ek;}
    var vn=Math.sqrt(Math.max(0,2*(ek-dEk)/mm));
    var Edx=dEk*pel;var fragE=0;
    if(fragM>0){fragList.forEach(function(fx){if(fx>x&&fx<=x+dx)fragE+=0.5*(fragM/frag)*Math.pow(vv*0.7,2);});}
    var dep=(Edx+fragE)/dx,tc=Math.sqrt(4/PI*dep/(K.gelPc*(o.pcMul||1)))*dep/(dep+K.gelD0);if(pel>1)tc*=0.85;
    if(tc*1000>maxTC){maxTC=tc*1000;maxTCx=x;}
    crush+=A*dx*pel*(tumbled?1:1);stretch+=Math.max(0,PI*tc*tc/4-A)*dx;
    rows.push([x*100,dcur*1000*(1+sy*(Ln/dcur-1)),tc*1000,vv,yaw/D2R,mm*1000]);
    dE.push(Edx+fragE);vv=vn;x+=dx;}
  var fragCrush=0;fragList.forEach(function(fx){fragCrush+=PI*Math.pow(0.0012,2)*(fx*0.6);});
  var depthCm=x*100,eIn=function(cm){var s=0;for(var i=0;i<dE.length&&i*dx*100<cm;i++)s+=dE[i];return s;};
  var torso=o.torso||30,e30=eIn(torso),exitV=depthCm>torso?(function(){var i=Math.min(rows.length-1,Math.round(torso/(dx*100)));return rows[i]?rows[i][3]:0;})():0;
  var pcm3=(crush+fragCrush)*1e6,stcm3=stretch*1e6,pcEff=0;(function(){var c=0,s=0;for(var i=0;i<rows.length&&rows[i][0]<=torso;i++){var dd=rows[i][1]/1000,tc=rows[i][2]/1000;c+=PI*dd*dd/4*dx*pel;s+=Math.max(0,PI*tc*tc/4-PI*dd*dd/4)*dx;}pcEff=c*1e6+0.1*s*1e6*(o.tissueK||1)+fragCrush*1e6*0.8;})();
  var pInc=1-Math.exp(-Math.pow(pcEff/55,0.85));
  return {rows:rows,pen:depthCm,neck:xYaw===null?null:xYaw*100,maxTC:maxTC,maxTCx:maxTCx*100,exp:exMax,expanded:exMax>1.08,frag:frag,fragM:fragM*1000,retained:mm*1000,E0:E0,eTorso:e30,exitV:exitV,crush:pcm3,stretch:stcm3,pcEff:pcEff,pInc:pInc,pel:pel,torso:torso};}

/* ---------- body armour behind-armour blunt trauma from backface deformation ---------- */
function babt(bfd){if(bfd===undefined||bfd===null)return '';if(bfd<25)return '瘀傷';if(bfd<44)return '挫傷，符合 NIJ 44 mm 上限';if(bfd<55)return '超過 NIJ 上限：可能肋骨骨折';if(bfd<70)return '肋骨骨折、肺挫傷風險高';return '嚴重鈍傷：可能致命的胸腔損傷';}

/* ---------- NIJ test threats (0101.06 / 0101.07): [label, projectile id, velocity m/s] ---------- */
var NIJ=[
 ['IIA（0101.06）',[['p9fmj',373],['p40',352]]],
 ['II（0101.06）',[['p9fmj',398],['p357',436]]],
 ['IIIA（0101.06）',[['p357sig',448],['p44',436]]],
 ['III（0101.06）',[['r762m80',847]]],
 ['IV（0101.06）',[['r3006ap',878]]],
 ['HG1（0101.07）',[['p9fmj',398],['p357',436]]],
 ['HG2（0101.07）',[['p9fmj',448],['p44',436]]],
 ['RF1（0101.07）',[['r762m80',847],['r762msc',732],['r556m193',990]]],
 ['RF2（0101.07）',[['r762m80',847],['r762msc',732],['r556m193',990],['r556m855',950]]],
 ['RF3（0101.07）',[['r3006ap',878]]]];

/* ---------- blast and fragmentation ---------- */
function kinneyGraham(Z){/* peak overpressure ratio dP/P0 for a free-air TNT burst at scaled distance Z m/kg^(1/3) */
  var a=808*(1+Math.pow(Z/4.5,2)),b=Math.sqrt((1+Math.pow(Z/0.048,2))*(1+Math.pow(Z/0.32,2))*(1+Math.pow(Z/1.35,2)));return a/b;}
function blastRadius(w,kPa,ground){var W=w*(ground?1.8:1),lo=0.05,hi=5000;if(W<=0)return 0;for(var i=0;i<60;i++){var m=Math.sqrt(lo*hi),p=kinneyGraham(m/Math.pow(W,1/3))*101.325;if(p>kPa)lo=m;else hi=m;}return Math.sqrt(lo*hi);}
function fragments(P,o){o=o||{};var h=P.he||{};if(!h.g)return null;var X=EXPL[h.x||'tnt']||EXPL.tnt,C=h.g/1000,Mc=Math.max(0.001,(P.m||0)/1000-C-(h.fz||0)/1000)*(h.cf===undefined?0.85:h.cf);
  var gur=X[2]*1000,CM=C/Mc,v0=gur*Math.sqrt(CM/(1+0.5*CM));if(P.mg&&P.mg.bu){v0*=1.15;}
  var tw=(h.tw||Math.max(1.5,P.d*0.12))/25.4,di=Math.max(5,P.d-2*(h.tw||P.d*0.12))/25.4,B=h.B||(X[1]>1.5?0.0451:X[1]>1.2?0.0443:0.0554);
  var MA=B*B*Math.pow(tw,5/3)*Math.pow(di,2/3)*Math.pow(1+tw/di,2)*0.4536;/* Mott average mass kg */
  if(h.pre){MA=h.pre/1000;}
  var N0=Mc/(2*MA);if(h.pre)N0=Mc/MA;
  var E=envOf(o.env),k=0.0038,rows=[];
  function fragV(m,R){return v0*Math.exp(-E.rho*1.2*k*Math.pow(m,2/3)/(2*m)*R);}
  /* lethal: fragments over 79 J; expected hits on a 0.5 m2 standing person */
  function hitsAt(R){var sum=0,steps=60;for(var i=0;i<steps;i++){var q1=i/steps,q2=(i+1)/steps;var m=MA*Math.pow(Math.log(1/(1-(q1+q2)/2+1e-9)),2)*(h.pre?0.25:1);if(h.pre)m=MA;var v=fragV(m,R);if(0.5*m*v*v>=79)sum+=1/steps;}
    var n=N0*sum,area=(o.ground===false?4:2)*PI*R*R;return n/area*0.5*0.75;}
  var r50=0.5,lo=0.3,hi=2000;for(var i=0;i<60;i++){var mid=Math.sqrt(lo*hi);if(hitsAt(mid)>0.69)lo=mid;else hi=mid;}r50=Math.sqrt(lo*hi);
  var r10=0.5;lo=0.3;hi=3000;for(i=0;i<60;i++){mid=Math.sqrt(lo*hi);if(hitsAt(mid)>0.105)lo=mid;else hi=mid;}r10=Math.sqrt(lo*hi);
  var mx=0;lo=1;hi=5000;for(i=0;i<60;i++){mid=Math.sqrt(lo*hi);if(fragV(MA*9,mid)>60)lo=mid;else hi=mid;}mx=Math.sqrt(lo*hi);
  return {v0:v0,CM:CM,MA:MA*1000,N0:N0,r50:r50,r10:r10,danger:mx,caseKg:Mc,hitsAt:hitsAt,fragV:fragV};}

/* ---------- multi-hit Monte Carlo on a plate ---------- */
function multiHit(P,layers,o){o=o||{};var n=o.n||6,W=(o.w||25)/100,H=(o.h||30)/100,sp=(o.spread||6)/100,trials=o.trials||300,rnd=mb32(hstr(o.seed||'mh')),v=o.v,lib=o.lib;
  var perShot=[],totals=0,i,j,k;for(i=0;i<n;i++)perShot.push(0);
  var shotDt=o.dt||0.15;
  for(var tr=0;tr<trials;tr++){var hits=[],shield=null;
    for(i=0;i<n;i++){var x=clamp(W/2+gauss(rnd)*sp,0.01,W-0.01),y=clamp(H/2+gauss(rnd)*sp,0.01,H-0.01);
      var lay=layers.map(function(L){var M=mat(L.mat,lib),f=1,mh=M.mh||[1.2,0.85],R=(mh[0]*((P.d||8)/1000)+(M.cat==='ceramic'?2*(+L.t||0)/1000:0));
        hits.forEach(function(h){var dd=Math.sqrt((h[0]-x)*(h[0]-x)+(h[1]-y)*(h[1]-y));if(dd<R)f*=lerp(mh[1],1,dd/R);else if(dd<R*2&&M.cat==='ceramic')f*=0.92;});
        var o2={mat:L.mat,t:(+L.t||0)*Math.max(0.05,f),ang:L.ang,gap:L.gap};if(M.mg)o2.mgk=Math.max(0,1-(hits.length*(M.mg.sh||0))/Math.max(0.1,M.mg.cap||1)+(M.mg.rg||0)/100*shotDt*hits.length);return o2;});
      var r=P.k==='sc'?stackSC(P,lay,{lib:lib,charge:o.charge}):stackKE(P,v,lay,{lib:lib,charge:o.charge});if(r.perf&&!r.ric){perShot[i]++;totals++;}hits.push([x,y]);}}
  return {perShot:perShot.map(function(c){return c/trials;}),mean:totals/trials,trials:trials};}

/* ---------- projectile library ----------
   d, L mm; m projectile g; v0 m/s; bc ballistic coefficient (lb/in2) for drag model dm; core working penetrator {mat, m g, d mm, L mm, N nose factor};
   dfm deformability on textiles; cs case {mat, g}; prop propellant g; rw complete round g (overrides the sum); ref reference contract price USD; bom projectile parts [[mat, g]];
   x other cost items {label: USD}; gel {cd nose-forward drag, nk neck cm, vf fragmentation threshold m/s, ff fragmenting share, ex expansion ratio, vx expansion velocity};
   sc shaped charge {cd mm, k RHA calibres at the built-in standoff, pr precision 1-5, so standoff in calibres, ln liner, tan tandem}; he {x explosive, g, tw wall mm, pre preformed fragment g}; mg 架空 magic */
var PROJ=[
 /* pistol */
 {id:'p9fmj',n:'9×19 mm 124 gr 全被甲',g:'pistol',k:'soft',d:9.02,L:15.5,m:8.0,v0:360,bc:0.15,dm:'G1',dfm:0.55,N:0.35,cs:{mat:'brass',g:4.0},prop:0.36,ref:0.22,bom:[['lead',6.6],['gm',1.4]],gel:{cd:0.27,nk:50}},
 {id:'p9jhp',n:'9×19 mm 124 gr 空尖彈（被甲擴張）',g:'pistol',k:'soft',d:9.02,L:15.5,m:8.0,v0:360,bc:0.14,dm:'G1',dfm:0.8,N:0.6,cs:{mat:'brass',g:4.0},prop:0.36,ref:0.45,bom:[['lead',6.6],['gm',1.4]],gel:{cd:0.3,ex:1.65,vx:270}},
 {id:'p45',n:'.45 ACP 230 gr 全被甲',g:'pistol',k:'soft',d:11.48,L:17,m:14.9,v0:255,bc:0.195,dm:'G1',dfm:0.55,N:0.35,cs:{mat:'brass',g:6.2},prop:0.35,ref:0.35,bom:[['lead',12.9],['gm',2.0]],gel:{cd:0.3,nk:62}},
 {id:'p357',n:'.357 Magnum 158 gr 半被甲軟尖',g:'pistol',k:'soft',d:9.07,L:17,m:10.2,v0:436,bc:0.16,dm:'G1',dfm:0.7,N:0.5,cs:{mat:'brass',g:5.5},prop:0.9,ref:0.6,bom:[['lead',9.0],['gm',1.2]],gel:{cd:0.32,ex:1.5,vx:300}},
 {id:'p44',n:'.44 Magnum 240 gr 半被甲空尖',g:'pistol',k:'soft',d:10.9,L:18,m:15.55,v0:436,bc:0.17,dm:'G1',dfm:0.75,N:0.55,cs:{mat:'brass',g:7.5},prop:1.2,ref:0.9,bom:[['lead',13.8],['gm',1.75]],gel:{cd:0.32,ex:1.7,vx:300}},
 {id:'p357sig',n:'.357 SIG 125 gr 全被甲平頭',g:'pistol',k:'soft',d:9.02,L:15,m:8.1,v0:448,bc:0.14,dm:'G1',dfm:0.5,N:0.6,cs:{mat:'brass',g:5.4},prop:0.6,ref:0.48,bom:[['lead',6.7],['gm',1.4]],gel:{cd:0.42,nk:45}},
 {id:'p40',n:'.40 S&W 180 gr 全被甲',g:'pistol',k:'soft',d:10.16,L:15.8,m:11.66,v0:352,bc:0.16,dm:'G1',dfm:0.55,N:0.45,cs:{mat:'brass',g:5.6},prop:0.4,ref:0.3,bom:[['lead',9.9],['gm',1.76]],gel:{cd:0.33,nk:48}},
 {id:'p762tok',n:'7.62×25 mm 托卡列夫 鋼被甲',g:'pistol',k:'soft',d:7.85,L:14,m:5.5,v0:470,bc:0.15,dm:'G1',dfm:0.3,N:0.35,cs:{mat:'brass',g:3.8},prop:0.5,ref:0.22,bom:[['lead',4.3],['msteel',1.2]],gel:{cd:0.26,nk:30}},
 {id:'p57',n:'5.7×28 mm SS190 穿甲彈',g:'pistol',k:'core',d:5.7,L:21.6,m:2.0,v0:716,bc:0.162,dm:'G1',dfm:0.05,core:{mat:'mtip',m:0.75,d:4.0,N:0.12},cs:{mat:'brass',g:2.1},prop:0.42,ref:1.1,bom:[['mtip',0.75],['al5083',0.65],['gm',0.6]],gel:{cd:0.24,nk:10}},
 /* rifle */
 {id:'r556m193',n:'5.56×45 mm M193 球形彈',g:'rifle',k:'soft',d:5.70,L:18.9,m:3.56,v0:990,bc:0.125,dm:'G7',dfm:0.85,N:0.15,cs:{mat:'brass',g:6.2},prop:1.68,ref:0.38,bom:[['lead',2.5],['gm',1.06]],gel:{cd:0.24,nk:12,vf:820,ff:0.5}},
 {id:'r556m855',n:'5.56×45 mm M855（SS109 鋼尖）',g:'rifle',k:'core',d:5.70,L:23,m:4.02,v0:950,bc:0.151,dm:'G7',dfm:0.3,core:{mat:'mtip',m:0.66,d:4.0,N:0.12},cs:{mat:'brass',g:6.2},prop:1.62,ref:0.42,bom:[['lead',2.3],['mtip',0.66],['gm',1.06]],gel:{cd:0.23,nk:13,vf:820,ff:0.33}},
 {id:'r556a1',n:'5.56×45 mm M855A1 增強彈',g:'rifle',k:'core',d:5.70,L:24,m:4.0,v0:961,bc:0.152,dm:'G7',dfm:0.25,core:{mat:'hsteel',m:1.25,d:4.9,N:0.1},cs:{mat:'brass',g:6.2},prop:1.7,ref:0.55,bom:[['hsteel',1.25],['cu',1.95],['gm',0.8]],gel:{cd:0.23,nk:9,vf:700,ff:0.3}},
 {id:'r556m995',n:'5.56×45 mm M995 碳化鎢穿甲彈',g:'rifle',k:'core',d:5.70,L:24,m:3.4,v0:1013,bc:0.15,dm:'G7',dfm:0.02,core:{mat:'wc',m:1.9,d:4.0,N:0.12},cs:{mat:'brass',g:6.2},prop:1.7,ref:2.6,bom:[['wc',1.9],['al5083',0.5],['gm',1.0]],gel:{cd:0.23,nk:15}},
 {id:'r762msc',n:'7.62×39 mm 軟鋼芯（PS／57-N-231）',g:'rifle',k:'core',d:7.92,L:26.8,m:7.9,v0:718,bc:0.275,dm:'G1',dfm:0.35,core:{mat:'msteel',m:3.6,d:5.9,N:0.18},cs:{mat:'msteel',g:6.6},prop:1.6,ref:0.28,bom:[['msteel',3.6],['lead',2.4],['msteel',1.9]],gel:{cd:0.24,nk:26}},
 {id:'r762bz',n:'7.62×39 mm BZ 穿甲燃燒彈',g:'rifle',k:'core',d:7.92,L:28,m:7.7,v0:740,bc:0.27,dm:'G1',dfm:0.05,core:{mat:'hsteel',m:3.6,d:6.0,N:0.12},cs:{mat:'msteel',g:6.6},prop:1.6,ref:0.7,bom:[['hsteel',3.6],['lead',1.6],['msteel',2.0]],he:{x:'inc',g:0.4},gel:{cd:0.24,nk:25}},
 {id:'r545',n:'5.45×39 mm 7N6',g:'rifle',k:'core',d:5.6,L:25.5,m:3.42,v0:880,bc:0.168,dm:'G7',dfm:0.25,core:{mat:'msteel',m:1.45,d:4.0,N:0.15},cs:{mat:'msteel',g:5.0},prop:1.45,ref:0.23,bom:[['msteel',1.45],['lead',0.6],['msteel',1.37]],gel:{cd:0.23,nk:7}},
 {id:'r545ap',n:'5.45×39 mm 7N22 穿甲彈',g:'rifle',k:'core',d:5.6,L:25.5,m:3.7,v0:890,bc:0.17,dm:'G7',dfm:0.05,core:{mat:'hsteel',m:1.6,d:4.0,N:0.12},cs:{mat:'msteel',g:5.0},prop:1.45,ref:0.55,bom:[['hsteel',1.6],['lead',0.7],['msteel',1.4]],gel:{cd:0.23,nk:8}},
 {id:'r762m80',n:'7.62×51 mm M80 球形彈',g:'rifle',k:'soft',d:7.82,L:28.9,m:9.53,v0:847,bc:0.200,dm:'G7',dfm:0.85,N:0.15,cs:{mat:'brass',g:12.0},prop:2.85,ref:0.75,bom:[['lead',7.8],['gm',1.73]],gel:{cd:0.24,nk:16,vf:790,ff:0.3}},
 {id:'r762m61',n:'7.62×51 mm M61 穿甲彈',g:'rifle',k:'core',d:7.82,L:31,m:9.75,v0:838,bc:0.205,dm:'G7',dfm:0.05,core:{mat:'hsteel',m:3.7,d:6.2,N:0.12},cs:{mat:'brass',g:12.0},prop:2.9,ref:1.6,bom:[['hsteel',3.7],['lead',4.2],['gm',1.85]],gel:{cd:0.24,nk:18}},
 {id:'r762m993',n:'7.62×51 mm M993 碳化鎢穿甲彈',g:'rifle',k:'core',d:7.82,L:31,m:8.2,v0:910,bc:0.19,dm:'G7',dfm:0.02,core:{mat:'wc',m:4.2,d:5.6,N:0.08},cs:{mat:'brass',g:12.0},prop:3.1,ref:5.0,bom:[['wc',4.0],['al5083',1.6],['gm',2.6]],gel:{cd:0.24,nk:20}},
 {id:'r54lps',n:'7.62×54R LPS 軟鋼芯',g:'rifle',k:'core',d:7.92,L:32.5,m:9.6,v0:828,bc:0.21,dm:'G7',dfm:0.3,core:{mat:'msteel',m:4.0,d:6.0,N:0.15},cs:{mat:'msteel',g:9.5},prop:3.1,ref:0.38,bom:[['msteel',4.0],['lead',3.2],['msteel',2.4]],gel:{cd:0.24,nk:20}},
 {id:'r54b32',n:'7.62×54R B-32 穿甲燃燒彈',g:'rifle',k:'core',d:7.92,L:35,m:10.0,v0:854,bc:0.2,dm:'G7',dfm:0.04,core:{mat:'hsteel',m:4.6,d:6.2,N:0.12},cs:{mat:'msteel',g:9.5},prop:3.1,ref:0.9,bom:[['hsteel',4.6],['lead',2.8],['msteel',2.6]],he:{x:'inc',g:0.6},gel:{cd:0.24,nk:22}},
 {id:'r3006ap',n:'.30-06 M2 穿甲彈',g:'rifle',k:'core',d:7.82,L:34,m:10.8,v0:878,bc:0.36,dm:'G1',dfm:0.04,core:{mat:'hsteel',m:5.25,d:6.2,N:0.1},cs:{mat:'brass',g:12.8},prop:3.4,ref:1.6,bom:[['hsteel',5.25],['lead',3.4],['gm',2.15]],gel:{cd:0.24,nk:22}},
 {id:'r338',n:'.338 Lapua Magnum 250 gr 競賽空尖',g:'rifle',k:'soft',d:8.61,L:38,m:16.2,v0:905,bc:0.322,dm:'G7',dfm:0.75,N:0.12,cs:{mat:'brass',g:20.5},prop:5.8,ref:4.5,bom:[['lead',13.5],['gm',2.7]],gel:{cd:0.23,nk:9,vf:650,ff:0.25}},
 {id:'r308sp',n:'.308 Win 165 gr 軟尖獵彈',g:'rifle',k:'soft',d:7.82,L:28,m:10.7,v0:820,bc:0.21,dm:'G7',dfm:0.95,N:0.5,cs:{mat:'brass',g:11.5},prop:2.9,ref:1.4,bom:[['lead',8.6],['gm',2.1]],gel:{cd:0.3,ex:1.9,vx:450}},
 /* heavy machine gun */
 {id:'h50m33',n:'.50 BMG M33 球形彈（軟鋼芯）',g:'hmg',k:'core',d:12.95,L:58,m:42.9,v0:887,bc:0.67,dm:'G1',dfm:0.25,core:{mat:'msteel',m:27,d:10.4,N:0.15},cs:{mat:'brass',g:57},prop:15,ref:2.8,bom:[['msteel',27],['lead',3],['gm',12.9]],gel:{cd:0.24,nk:30}},
 {id:'h50ap',n:'.50 BMG M2 穿甲彈',g:'hmg',k:'core',d:12.95,L:58,m:45.9,v0:887,bc:0.67,dm:'G1',dfm:0.04,core:{mat:'hsteel',m:27.5,d:10.9,N:0.1},cs:{mat:'brass',g:57},prop:15,ref:3.4,bom:[['hsteel',27.5],['lead',4],['gm',14.4]],gel:{cd:0.24,nk:32}},
 {id:'h50api',n:'.50 BMG M8 穿甲燃燒彈',g:'hmg',k:'core',d:12.95,L:58,m:40.4,v0:910,bc:0.62,dm:'G1',dfm:0.04,core:{mat:'hsteel',m:26,d:10.9,N:0.1},cs:{mat:'brass',g:57},prop:15,ref:4.0,bom:[['hsteel',26],['gm',13.4]],he:{x:'inc',g:1.0},gel:{cd:0.24,nk:32}},
 {id:'h50slap',n:'.50 BMG M903 脫殼輕型穿甲彈（鎢）',g:'hmg',k:'lr',d:7.62,L:28,m:23.7,v0:1220,bc:0.45,dm:'G1',dfm:0,core:{mat:'wha',d:7.62,L:28},cs:{mat:'brass',g:57},prop:16,ref:25,bom:[['wha',21.5],['pc',2.2]],gel:{cd:0.24,nk:20}},
 {id:'h50raufoss',n:'.50 BMG Mk 211 Raufoss 多用途彈',g:'hmg',k:'core',d:12.95,L:58,m:42.0,v0:915,bc:0.62,dm:'G1',dfm:0.04,core:{mat:'wc',m:9.5,d:8.0,N:0.15},cs:{mat:'brass',g:57},prop:15,ref:42,bom:[['wc',9.5],['msteel',20],['gm',11]],he:{x:'rdx',g:1.0},x:{'鋯燃燒劑與引信機構':4},gel:{cd:0.24,nk:15}},
 {id:'h127b32',n:'12.7×108 mm B-32 穿甲燃燒彈',g:'hmg',k:'core',d:12.98,L:64,m:48.2,v0:830,bc:0.68,dm:'G1',dfm:0.04,core:{mat:'hsteel',m:30,d:10.9,N:0.1},cs:{mat:'msteel',g:63},prop:17,ref:3.0,bom:[['hsteel',30],['lead',2],['msteel',16.2]],he:{x:'inc',g:1.0},gel:{cd:0.24,nk:32}},
 {id:'h145b32',n:'14.5×114 mm B-32 穿甲燃燒彈',g:'hmg',k:'core',d:14.88,L:66,m:64,v0:1000,bc:0.75,dm:'G1',dfm:0.04,core:{mat:'hsteel',m:41,d:12.4,N:0.08},cs:{mat:'msteel',g:94},prop:30,ref:6.0,bom:[['hsteel',39],['lead',4],['msteel',21]],he:{x:'inc',g:2.0},gel:{cd:0.24,nk:35}},
 {id:'h145bs41',n:'14.5×114 mm BS-41 碳化鎢穿甲燃燒彈',g:'hmg',k:'core',d:14.88,L:66,m:64.4,v0:1000,bc:0.74,dm:'G1',dfm:0.02,core:{mat:'wc',m:40,d:10.8,N:0.12},cs:{mat:'msteel',g:94},prop:30,ref:9.0,bom:[['wc',40],['msteel',24.4]],he:{x:'inc',g:1.5},gel:{cd:0.24,nk:35}},
 /* autocannon */
 {id:'a20hei',n:'20×102 mm M56A3 高爆燃燒彈',g:'auto',k:'he',d:20,L:80,m:102,v0:1030,bc:0.32,dm:'G1',cs:{mat:'brass',g:118},prop:38,ref:16,bom:[['msteel',85]],he:{x:'rdx',g:10.6,tw:4},x:{'M505 引信':4},gel:{cd:0.3,nk:20}},
 {id:'a20sap',n:'20×102 mm PGU-28 半穿甲高爆燃燒彈',g:'auto',k:'core',d:20,L:84,m:102,v0:1050,bc:0.34,dm:'G1',dfm:0,core:{mat:'hsteel',m:70,d:17,N:0.2},cs:{mat:'brass',g:118},prop:38,ref:45,bom:[['hsteel',85]],he:{x:'pbx',g:8},x:{'延時引信':8},gel:{cd:0.3,nk:20}},
 {id:'a25apds',n:'25×137 mm M791 脫殼穿甲彈',g:'auto',k:'lr',d:25,L:60,m:134,v0:1345,bc:0.9,dm:'G7',core:{mat:'wha',d:14,L:57},cs:{mat:'msteel',g:180},prop:98,rw:458,ref:110,bom:[['wha',115],['al7039',90]],gel:{cd:0.3,nk:15}},
 {id:'a25apfs',n:'25×137 mm M919 尾翼穩定脫殼穿甲彈（貧鈾）',g:'auto',k:'lr',d:25,L:110,m:96,v0:1385,bc:1.5,dm:'G7',core:{mat:'du',d:8.8,L:88},cs:{mat:'msteel',g:180},prop:100,rw:458,ref:140,bom:[['du',99],['al7039',70]],gel:{cd:0.3,nk:10}},
 {id:'a30api',n:'30×173 mm PGU-14/B 穿甲燃燒彈（貧鈾芯）',g:'auto',k:'core',d:30,L:110,m:425,v0:1013,bc:0.9,dm:'G1',dfm:0,core:{mat:'du',m:298,d:19,N:0.15},cs:{mat:'al5083',g:160},prop:142,rw:727,ref:95,bom:[['du',298],['al5083',127]],he:{x:'inc',g:4},gel:{cd:0.3,nk:25}},
 {id:'a30fs',n:'30×173 mm Mk 258 尾翼穩定脫殼穿甲彈（鎢）',g:'auto',k:'lr',d:30,L:140,m:235,v0:1405,bc:1.8,dm:'G7',core:{mat:'wha',d:10.5,L:125},cs:{mat:'msteel',g:270},prop:150,rw:650,ref:230,bom:[['wha',190],['al7039',120]],gel:{cd:0.3,nk:10}},
 {id:'a30br6',n:'30×165 mm 3UBR6 被帽穿甲彈（鋼）',g:'auto',k:'core',d:30,L:110,m:400,v0:970,bc:0.42,dm:'G1',dfm:0,cap:1,core:{mat:'hsteel',m:330,d:26,N:0.25},cs:{mat:'msteel',g:330},prop:117,rw:850,ref:45,bom:[['hsteel',380]],he:{x:'inc',g:3},gel:{cd:0.3,nk:25}},
 {id:'a47he',n:'47 mm OSa 可程式空爆彈',g:'auto',k:'he',d:47,L:200,m:1550,v0:1100,bc:0.55,dm:'G1',cs:{mat:'msteel',g:900},prop:420,rw:2900,ref:900,bom:[['msteel',1300]],he:{x:'pbx',g:150,tw:4,pre:3.3},x:{'可程式近炸引信':300},gel:{cd:0.4,nk:10},note:'東標組織 47 mm 口徑；「響箭」防空車與 Ocan/C.95 近防砲'},
 {id:'a47fs',n:'47 mm OSa 尾翼穩定脫殼穿甲彈',g:'auto',k:'lr',d:47,L:220,m:620,v0:1520,bc:1.4,dm:'G7',core:{mat:'wha',d:13,L:125},cs:{mat:'msteel',g:900},prop:480,rw:2700,ref:1200,bom:[['wha',290],['al7039',300]],gel:{cd:0.3,nk:10}},
 {id:'g40hedp',n:'40×46 mm M433 高爆兩用榴彈',g:'gren',k:'sc',d:40,L:80,m:177,v0:76,bc:0.08,dm:'G1',rocket:0,cs:{mat:'al5083',g:40},prop:0.3,rw:230,ref:45,bom:[['al5083',70],['cu',20]],sc:{cd:38,k:2.0,pr:2,so:1.5},he:{x:'compb',g:45,tw:2,pre:0.12},x:{'M550 引信':12},gel:{cd:0.6,nk:5}},
 /* tank guns */
 {id:'t105m833',n:'105 mm M833 尾翼穩定脫殼穿甲彈（貧鈾）',g:'tank',k:'lr',Lref:52,d:105,L:540,m:3900,v0:1490,bc:2.6,dm:'G7',core:{mat:'du',d:27,L:450},rw:17500,ref:2500,bom:[['du',3890],['al7039',2300]],x:{'可燃藥筒與發射藥':600},gel:{cd:0.3,nk:10}},
 {id:'t120m829a1',Lref:44,n:'120 mm M829A1 尾翼穩定脫殼穿甲彈（貧鈾）',g:'tank',k:'lr',d:120,L:780,m:5000,v0:1575,bc:3.0,dm:'G7',core:{mat:'du',d:22,L:684},rw:20900,ref:3500,bom:[['du',4840],['al7039',3200]],x:{'可燃藥筒與發射藥':900},gel:{cd:0.3,nk:10}},
 {id:'t120m829a3',Lref:44,n:'120 mm M829A3 尾翼穩定脫殼穿甲彈（貧鈾）',g:'tank',k:'lr',d:120,L:924,m:6500,v0:1555,bc:3.4,dm:'G7',core:{mat:'du',d:25,L:790},rw:22300,ref:9000,bom:[['du',6940],['maraging',500],['al7039',3500]],x:{'可燃藥筒與發射藥':1100},gel:{cd:0.3,nk:10}},
 {id:'t120dm53',Lref:44,n:'120 mm DM53 尾翼穩定脫殼穿甲彈（鎢）',g:'tank',k:'lr',d:120,L:840,m:5000,v0:1670,bc:3.2,dm:'G7',core:{mat:'wha',d:22,L:745},rw:21400,ref:6500,bom:[['wha',4980],['al7039',3300]],x:{'可燃藥筒與發射藥':1000},gel:{cd:0.3,nk:10}},
 {id:'t125m42',Lref:48,n:'125 mm 3BM42 芒果 尾翼穩定脫殼穿甲彈',g:'tank',k:'lr',d:125,L:574,m:4850,v0:1715,bc:2.8,dm:'G7',core:{mat:'wha',d:24,L:570},rw:20400,ref:2500,bom:[['wha',4520],['al7039',2500]],x:{'半可燃藥筒與發射藥':600},gel:{cd:0.3,nk:10}},
 {id:'t125m60',Lref:48,n:'125 mm 3BM60 鉛-2 尾翼穩定脫殼穿甲彈',g:'tank',k:'lr',d:125,L:740,m:4900,v0:1660,bc:3.1,dm:'G7',core:{mat:'wha',d:22,L:740},rw:22000,ref:4500,bom:[['wha',4950],['al7039',2600]],x:{'可燃藥筒與發射藥':800},gel:{cd:0.3,nk:10}},
 {id:'t120heat',Lref:44,n:'120 mm M830 反坦克高爆彈',g:'tank',k:'sc',d:120,L:700,m:13500,v0:1140,bc:1.1,dm:'G7',sc:{cd:100,k:6.0,pr:4,so:2.5},he:{x:'compb',g:1700,tw:6},rw:24200,ref:5000,bom:[['msteel',9000],['cu',900]],x:{'引信':300,'可燃藥筒與發射藥':900},gel:{cd:0.3,nk:10}},
 {id:'t120hesh',rifled:1,n:'120 mm L31 碎甲彈（線膛砲）',g:'tank',k:'hesh',d:120,L:480,m:17100,v0:670,bc:0.6,dm:'G1',he:{x:'a3',g:4000,tw:8},rw:27000,ref:1800,bom:[['msteel',12500]],x:{'底部引信':120,'藥包':300},gel:{cd:0.6,nk:5}},
 {id:'t88pzgr39',n:'88 mm KwK 36 PzGr.39 被帽穿甲彈（二戰）',g:'tank',k:'core',d:88,L:360,m:10200,v0:773,bc:1.15,dm:'G1',dfm:0,cap:1,core:{mat:'hsteel',m:10000,d:88,N:0.3},rw:15300,ref:700,bom:[['hsteel',10100]],he:{x:'tnt',g:59},x:{'黃銅藥筒與發射藥':140},gel:{cd:0.4,nk:20}},
 {id:'t75m61',n:'75 mm M3 M61 被帽穿甲彈（二戰）',g:'tank',k:'core',d:75,L:300,m:6790,v0:619,bc:1.0,dm:'G1',dfm:0,cap:1,core:{mat:'hsteel',m:6700,d:75,N:0.3},rw:8900,ref:450,bom:[['hsteel',6700]],he:{x:'tnt',g:64},x:{'黃銅藥筒與發射藥':90},gel:{cd:0.4,nk:20}},
 {id:'t76hvap',n:'76 mm M93 超高速穿甲彈（鎢芯，二戰）',g:'tank',k:'core',d:76,L:260,m:4300,v0:1036,bc:0.75,dm:'G1',dfm:0,core:{mat:'wc',m:1100,d:38,N:0.3},rw:8400,ref:900,bom:[['wc',1100],['al5083',3200]],x:{'黃銅藥筒與發射藥':90},gel:{cd:0.4,nk:20}},
 {id:'t105heat',Lref:52,n:'105 mm 反坦克高爆彈',g:'tank',k:'sc',d:105,L:620,m:10200,v0:1173,bc:0.9,dm:'G7',sc:{cd:88,k:5.0,pr:4,so:2.5},he:{x:'compb',g:1000,tw:5},rw:21000,ref:3000,bom:[['msteel',7000],['cu',600]],x:{'引信':200,'藥筒與發射藥':500},gel:{cd:0.3,nk:10}},
 {id:'gl120',n:'120 mm 砲射反坦克導彈（OSU.i）',g:'tank',k:'sc',cls:'atgm',gl:1,d:120,L:1000,m:19000,v0:300,cruise:300,guided:1,rocket:1,sc:{cd:105,k:6.6,pr:5,so:3,tan:1},he:{x:'octol',g:2200,tw:3},rw:28000,ref:90000,bom:[['msteel',9000],['cu',500]],x:{'雷射駕束導引':40000},gel:{cd:0.6,nk:5},note:'由主砲發射；射程約 6 km'},
 {id:'gl105',n:'105 mm 砲射反坦克導彈（OSU.i）',g:'tank',k:'sc',cls:'atgm',gl:1,d:105,L:950,m:16000,v0:300,cruise:300,guided:1,rocket:1,sc:{cd:92,k:6.4,pr:5,so:3,tan:1},he:{x:'octol',g:1800,tw:3},rw:24000,ref:80000,bom:[['msteel',7500],['cu',420]],x:{'雷射駕束導引':36000},gel:{cd:0.6,nk:5},note:'由主砲發射；射程約 5 km'},
 /* artillery, mortar, grenades */
 {id:'art155m107',n:'155 mm M107 高爆榴彈',g:'art',k:'he',d:155,L:700,m:43100,v0:684,bc:2.0,dm:'G1',he:{x:'tnt',g:6620,tw:22},rw:52000,ref:1600,bom:[['msteel',36000]],x:{'M739 引信':60,'發射藥包':500},gel:{cd:0.6,nk:5}},
 {id:'art155m795',n:'155 mm M795 高爆榴彈（高破片鋼）',g:'art',k:'he',d:155,L:800,m:46700,v0:827,bc:2.4,dm:'G1',he:{x:'tnt',g:10800,tw:18},rw:58000,ref:2000,bom:[['hsteel',35500]],x:{'M739 引信':60,'模組化發射藥':800},gel:{cd:0.6,nk:5}},
 {id:'n127he',n:'127 mm「長喙」艦砲高爆彈',g:'art',k:'he',d:127,L:660,m:31750,v0:808,bc:1.6,dm:'G1',he:{x:'compb',g:3600,tw:16},rw:47000,ref:3000,bom:[['msteel',27000]],x:{'多功能引信':400,'藥筒與發射藥':600},gel:{cd:0.6,nk:5}},
 {id:'mor120',n:'120 mm M933 迫擊砲彈',g:'art',k:'he',d:120,L:700,m:13600,v0:318,bc:0.9,dm:'G1',he:{x:'compb',g:2990,tw:10},rw:13900,ref:900,bom:[['msteel',10300]],x:{'M734 多選引信':180,'藥包':40},gel:{cd:0.6,nk:5}},
 {id:'gm67',n:'M67 破片手榴彈',g:'gren',k:'he',d:64,L:90,m:400,v0:15,bc:0.02,dm:'G1',guided:1,he:{x:'compb',g:180,tw:2.5},ref:45,bom:[['msteel',190]],x:{'M213 延時引信':8},gel:{cd:0.6,nk:5}},
 /* rockets and missiles */
 {id:'rpg7v',n:'RPG-7 PG-7V 85 mm 反坦克火箭',g:'rkt',k:'sc',d:85,L:930,m:2200,v0:300,cruise:240,guided:1,rocket:1,sc:{cd:80,k:3.6,pr:2,so:2.2},he:{x:'a3',g:340,tw:3},ref:250,bom:[['msteel',1300],['cu',120]],x:{'壓電引信':20,'火箭發動機':60},gel:{cd:0.6,nk:5}},
 {id:'rpg7vl',n:'RPG-7 PG-7VL 93 mm 反坦克火箭',g:'rkt',k:'sc',d:93,L:990,m:2600,v0:290,cruise:240,guided:1,rocket:1,sc:{cd:90,k:5.5,pr:4,so:2.6},he:{x:'octol',g:730,tw:3},ref:700,bom:[['msteel',1500],['cu',160]],x:{'壓電引信':20,'火箭發動機':80},gel:{cd:0.6,nk:5}},
 {id:'rpg7vr',n:'RPG-7 PG-7VR 105 mm 串聯反坦克火箭',g:'rkt',k:'sc',d:105,L:1130,m:4500,v0:200,cruise:200,guided:1,rocket:1,sc:{cd:102,k:6.4,pr:4,so:2.5,tan:1},he:{x:'octol',g:1400,tw:3},ref:2500,bom:[['msteel',2600],['cu',260]],x:{'雙引信':60,'火箭發動機':120},gel:{cd:0.6,nk:5}},
 {id:'at4',n:'AT4 84 mm 反坦克火箭（含發射管）',g:'rkt',k:'sc',d:84,L:1000,m:1800,v0:290,cruise:285,guided:1,rocket:1,sc:{cd:80,k:5.25,pr:4,so:2.5},he:{x:'octol',g:440,tw:3},rw:6700,ref:1800,bom:[['al5083',900],['cu',140]],x:{'發射管':600,'引信':40},gel:{cd:0.6,nk:5}},
 {id:'m72',n:'M72A2 LAW 66 mm 反坦克火箭',g:'rkt',k:'sc',d:66,L:510,m:1000,v0:145,cruise:145,guided:1,rocket:1,sc:{cd:62,k:4.5,pr:3,so:2.2},he:{x:'octol',g:300,tw:2},rw:2500,ref:1300,bom:[['al5083',500],['cu',90]],x:{'發射管':300,'引信':25},gel:{cd:0.6,nk:5}},
 {id:'cg551',n:'卡爾古斯塔夫 FFV551 84 mm 反坦克彈',g:'rkt',k:'sc',d:84,L:520,m:2200,v0:255,cruise:255,guided:1,rocket:1,sc:{cd:80,k:5.0,pr:4,so:2.5},he:{x:'octol',g:400,tw:3},rw:3200,ref:900,bom:[['msteel',1300],['cu',130]],x:{'引信':30,'續航火箭':60},gel:{cd:0.6,nk:5}},
 {id:'javelin',cls:'atgm',ta:1,n:'FGM-148 標槍飛彈（串聯）',g:'rkt',k:'sc',d:127,L:1080,m:11800,v0:140,cruise:140,guided:1,rocket:1,sc:{cd:120,k:6.4,pr:5,so:3,tan:1},he:{x:'pbx',g:8400,tw:3},rw:22300,ref:200000,bom:[['al7039',4000],['cu',500]],x:{'紅外線尋標器與導引':120000,'推進':8000},gel:{cd:0.6,nk:5}},
 {id:'tow2a',cls:'atgm',n:'BGM-71 TOW-2A 飛彈（串聯）',g:'rkt',k:'sc',d:152,L:1510,m:22600,v0:280,cruise:280,guided:1,rocket:1,sc:{cd:150,k:6.0,pr:5,so:3,tan:1},he:{x:'pbx',g:5900,tw:3},ref:93000,bom:[['al7039',8000],['cu',800]],x:{'線導與導引':45000,'推進':6000},gel:{cd:0.6,nk:5}},
 {id:'kornet',cls:'atgm',n:'9M133 短號飛彈（串聯）',g:'rkt',k:'sc',d:152,L:1200,m:27000,v0:300,cruise:300,guided:1,rocket:1,sc:{cd:150,k:7.6,pr:5,so:3,tan:1},he:{x:'octol',g:4600,tw:3},ref:30000,bom:[['msteel',9000],['cu',800]],x:{'雷射駕束導引':12000,'推進':3000},gel:{cd:0.6,nk:5}},
 {id:'m_sli3',n:'「天雷三型」空對地飛彈（成形裝藥）',g:'rkt',k:'sc',cls:'atgm',d:305,L:2490,m:300000,v0:330,cruise:330,guided:1,rocket:1,sc:{cd:280,k:4.0,pr:4,so:2.5},he:{x:'compb',g:57000,tw:5},ref:175000,bom:[['al7039',90000],['cu',8000]],x:{'紅外線／雷射／電視復合尋標器':60000},gel:{cd:0.6,nk:5},note:'萬邦航太 Omisal.sli.III'},
 {id:'m_downfall',n:'「墮星」小型對地飛彈（串聯）',g:'rkt',k:'sc',cls:'atgm',d:178,L:1800,m:50000,v0:400,cruise:400,guided:1,rocket:1,sc:{cd:110,k:7.6,pr:5,so:3,tan:1},he:{x:'pbx',g:6300,tw:3},ref:200000,bom:[['al7039',20000],['cu',1200]],x:{'毫米波雷達尋標器':70000},gel:{cd:0.6,nk:5},note:'騰日系統 Omisal.downfall'},
 /* shotgun */
 {id:'s12buck',n:'12 號 00 鹿彈（9 粒）',g:'shot',k:'shot',d:8.38,L:8.38,m:31.5,pel:9,pm:3.5,pd:8.38,v0:400,bc:0.07,dm:'G1',dfm:0.4,core:{mat:'lead',m:3.5,d:8.38,N:0.5},cs:{mat:'pc',g:6},prop:2.3,rw:40,ref:0.85,bom:[['lead',31.5]],gel:{cd:0.5}},
 {id:'s12slug',n:'12 號 1 oz 獨頭彈',g:'shot',k:'soft',d:18.5,L:18,m:28.3,v0:480,bc:0.07,dm:'G1',dfm:0.6,N:0.6,mat:'lead',cs:{mat:'pc',g:8},prop:2.4,rw:41,ref:1.1,bom:[['lead',28.3]],gel:{cd:0.45,ex:1.35,vx:300}},
 /* fragment simulating projectiles */
 {id:'fsp17',n:'17 gr 破片模擬彈（.22 FSP）',g:'frag',k:'frag',d:5.59,L:6.4,m:1.1,v0:600,bc:0.03,dm:'G1',dfm:0.1,core:{mat:'msteel',m:1.1,d:5.59,N:0.9},ref:1.0,bom:[['msteel',1.1]],gel:{cd:0.9,nk:2}},
 {id:'fsp64',n:'64 gr 破片模擬彈（.30 FSP）',g:'frag',k:'frag',d:7.62,L:8.6,m:4.15,v0:600,bc:0.05,dm:'G1',dfm:0.1,core:{mat:'msteel',m:4.15,d:7.62,N:0.9},ref:1.5,bom:[['msteel',4.15]],gel:{cd:0.9,nk:2}},
 /* 架空 (fictional) */
 {id:'xmana762',n:'【架空】7.62 mm 魔晶穿甲彈（光屬性）',g:'magic',k:'core',d:7.82,L:31,m:9.0,v0:900,bc:0.21,dm:'G7',dfm:0.02,core:{mat:'manacore',m:4.6,d:5.4,N:0.1},cs:{mat:'brass',g:12},prop:3.0,bom:[['manacore',4.6],['gm',2.4]],
   mg:{bo:0.3,pi:1.2,dp:0.5,el:4,mc:2,mcp:100,st:0.98},gel:{cd:0.24,nk:15},note:'魔晶加速 +30% 動能、穿甲 ×1.2、破除目標魔能 50%'},
 {id:'xmanarod',n:'【架空】120 mm 魔能素長桿彈',g:'magic',k:'lr',d:120,L:900,m:5600,v0:1700,bc:3.4,dm:'G7',core:{mat:'manacore',d:22,L:800},rw:22000,bom:[['manacore',6400],['al7039',3200]],
   mg:{bo:0.2,pi:1.15,dp:0.3,el:3,mc:300,mcp:100,st:0.97},x:{'可燃藥筒與發射藥':1000},gel:{cd:0.3,nk:10}},
 {id:'xmanaheat',n:'【架空】110 mm 魔導射流彈（雷屬性）',g:'magic',k:'sc',d:110,L:900,m:3200,v0:280,cruise:280,guided:1,rocket:1,sc:{cd:105,k:7.0,pr:5,so:3,ln:'mana',tan:1},he:{x:'octol',g:900,tw:3},bom:[['msteel',1600]],
   mg:{bo:0,pi:1.1,dp:0.8,el:3,mc:120,mcp:100,st:0.95},x:{'引信':60,'火箭發動機':150},gel:{cd:0.6,nk:5}},
 {id:'xburst40',n:'【架空】40 mm 魔爆榴彈（火屬性）',g:'magic',k:'he',d:40,L:90,m:230,v0:76,bc:0.08,dm:'G1',he:{x:'compb',g:32,tw:3},cs:{mat:'al5083',g:45},prop:0.3,rw:290,bom:[['msteel',170]],
   mg:{bu:0.6,el:1,mc:40,mcp:100,st:0.93},x:{'引信':12},gel:{cd:0.6,nk:5}}
];

window.LatoArmoryLib={PROJ:PROJ,MATS:MATS,mat:mat,rtOf:rtOf,ypOf:ypOf,cunniffU:cunniffU,EXPL:EXPL,ELEM:ELEM,ELM:ELM,envOf:envOf,flyTable:flyTable,velAt:velAt,loPerf:loPerf,taRun:taRun,K:K,KINDN:KINDN,
  stackKE:stackKE,stackSC:stackSC,stackHE:stackHE,evaluate:evaluate,perfLimit:perfLimit,v50Stack:v50Stack,pPerf:pPerf,stackAD:stackAD,stackThick:stackThick,stackCostM2:stackCostM2,
  GROUPS:GROUPS,MARKET:MARKET,roundMass:roundMass,rawCost:rawCost,costOf:costOf,calibrateCost:calibrateCost,gelRun:gelRun,babt:babt,NIJ:NIJ,kinneyGraham:kinneyGraham,blastRadius:blastRadius,
  fragments:fragments,multiHit:multiHit,heEq:heEq,scCapacity:scCapacity,teCE:teCE,noseN:noseN,coreOf:coreOf,clamp:clamp,mb32:mb32,hstr:hstr,ncdf:ncdf,cloneObj:cloneObj};
})();

/* ===== LatoVehicle：模組化載具設計（陸軍、空軍、海軍），沿用 LatoArmory 的裝甲、彈藥與計價 ===== */
(function(){
"use strict";
if(window.LatoVehicleLib||!window.LatoArmoryLib)return;
var A=window.LatoArmoryLib,PI=Math.PI,D2R=PI/180,G0=9.80665;
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function cl(o){return JSON.parse(JSON.stringify(o));}
function erf(x){var t=1/(1+0.3275911*Math.abs(x)),y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x);return x>=0?y:-y;}
/* ---------- vehicle module catalogue ----------
   br l 陸 / a 空 / s 海; sl slot; kg mass; dy cost in 東銀圓; by maker; st status; crew crew change; pw electric power draw kW.
   Land chassis: kind tr (tracked) / wh (wheeled), L W H overall (m), tw track width, cl track contact length, nw road wheels per side (or wheels), wd wheel diameter, pitch track pitch,
     cr / co rolling resistance on road / off road, vs suspension-limited off-road speed (km/h), cda drag area, area presented area of each armour zone (m²), sh hit shares by arc, roles crew, pax passengers.
   Armour kits: zs [[zone, from, to]] material swaps, za [[zone, start, end, [[mat, mm, angle, gap], ...]]] layers added outside the zone between fractions start..end of its area. */
var MODS=[
 /* ===== 陸軍 ===== */
 {id:'ch.xt03',br:'l',sl:'ch',n:'「刑天」零三式車體與懸吊（六對負重輪）',by:'白雪貂綜工',kg:5469,dy:600000,kind:'tr',L:7.7,W:3.66,H:2.4,tw:0.64,cl:4.65,nw:6,wd:0.7,pitch:0.16,cr:0.045,co:0.08,vs:52,cda:8.0,turret:1,
   area:{tf:2.0,hf:2.3,ts:4.0,hs:13.5,rr:3.0,tp:23,bt:21},sh:{f:{tf:0.44,hf:0.40,ts:0.08,hs:0.08},s:{hs:0.62,ts:0.25,rr:0.08,tf:0.025,hf:0.025}},roles:['車長','駕駛','炮手','裝填手'],
   note:'車體與負重輪較舊式零六二式、七六式加長，負重輪由五對增至六對以承受複合裝甲的重量'},
 {id:'ch.saa06',br:'l',sl:'ch',n:'OSaAA.06 履帶底盤（六對負重輪）',by:'騰日系統',kg:7200,dy:520000,kind:'tr',L:7.6,W:3.5,H:3.9,tw:0.6,cl:4.5,nw:6,wd:0.7,pitch:0.16,cr:0.045,co:0.08,vs:50,cda:9.5,turret:1,
   area:{tf:2.6,hf:2.2,ts:5.4,hs:12.5,rr:3.0,tp:24,bt:20},sh:{f:{tf:0.45,hf:0.39,ts:0.08,hs:0.08},s:{hs:0.6,ts:0.27,rr:0.08,tf:0.025,hf:0.025}},roles:['車長','駕駛','砲手兼飛彈操作手']},
 {id:'ch.ifv',br:'l',sl:'ch',n:'履帶步兵戰車車體（範本）',kg:9500,dy:450000,kind:'tr',L:6.6,W:3.3,H:2.9,tw:0.53,cl:3.9,nw:6,wd:0.6,pitch:0.15,cr:0.045,co:0.08,vs:50,cda:8.5,turret:1,pax:7,
   area:{tf:1.2,hf:2.6,ts:2.6,hs:12,rr:4.0,tp:18,bt:17},sh:{f:{tf:0.3,hf:0.55,ts:0.06,hs:0.09},s:{hs:0.7,ts:0.18,rr:0.08,tf:0.02,hf:0.02}},roles:['車長','駕駛','砲手']},
 {id:'ch.lt',br:'l',sl:'ch',n:'輕型戰車車體（範本）',kg:6800,dy:450000,kind:'tr',L:6.9,W:3.3,H:2.5,tw:0.53,cl:4.0,nw:6,wd:0.6,pitch:0.15,cr:0.045,co:0.08,vs:55,cda:7.6,turret:1,
   area:{tf:1.8,hf:2.0,ts:3.6,hs:11.5,rr:2.8,tp:19,bt:17},sh:{f:{tf:0.44,hf:0.4,ts:0.08,hs:0.08},s:{hs:0.62,ts:0.25,rr:0.08,tf:0.025,hf:0.025}},roles:['車長','駕駛','炮手']},
 {id:'ch.spg',br:'l',sl:'ch',n:'履帶自走砲車體（範本）',kg:12000,dy:600000,kind:'tr',L:7.9,W:3.6,H:3.4,tw:0.55,cl:4.8,nw:7,wd:0.66,pitch:0.15,cr:0.045,co:0.08,vs:45,cda:10,turret:1,
   area:{tf:2.8,hf:2.4,ts:9,hs:13,rr:3.6,tp:28,bt:22},sh:{f:{tf:0.5,hf:0.34,ts:0.08,hs:0.08},s:{hs:0.55,ts:0.35,rr:0.08,tf:0.01,hf:0.01}},roles:['車長','駕駛','砲手','裝填手','裝填手']},
 {id:'ch.w8',br:'l',sl:'ch',n:'8×8 輪式裝甲車體（範本）',kg:9000,dy:500000,kind:'wh',L:7.8,W:2.99,H:2.4,nw:8,wd:1.25,cr:0.02,co:0.09,vs:70,cda:7.2,turret:0,pax:9,
   area:{hf:4.5,hs:16,rr:5.0,tp:20,bt:19},sh:{f:{hf:0.9,hs:0.1},s:{hs:0.9,rr:0.1}},roles:['車長','駕駛','砲手']},
 {id:'ch.w4',br:'l',sl:'ch',n:'4×4 防地雷反伏擊車體（V 型底盤，範本）',kg:7500,dy:280000,kind:'wh',L:6.4,W:2.5,H:2.7,nw:4,wd:1.2,cr:0.02,co:0.09,vs:65,cda:7.0,turret:0,pax:6,vhull:1,
   area:{hf:3.8,hs:13,rr:4.2,tp:15,bt:14},sh:{f:{hf:0.9,hs:0.1},s:{hs:0.9,rr:0.1}},roles:['車長','駕駛']},
 {id:'eng.d1105',br:'l',sl:'eng',n:'1105 匹馬力水冷式柴油發動機',hp:1105,ty:'d',eta:0.38,kg:2050,dy:160000},
 {id:'eng.d1500',br:'l',sl:'eng',n:'1500 匹馬力柴油發動機',hp:1500,ty:'d',eta:0.39,kg:2300,dy:230000},
 {id:'eng.gt1500',br:'l',sl:'eng',n:'1500 匹馬力燃氣渦輪發動機',hp:1500,ty:'gt',eta:0.24,kg:1150,dy:300000,note:'輕而有力，但油耗約為柴油機的 1.6 倍'},
 {id:'eng.d1000',br:'l',sl:'eng',n:'1000 匹馬力柴油發動機',hp:1000,ty:'d',eta:0.38,kg:1900,dy:140000},
 {id:'eng.d700',br:'l',sl:'eng',n:'700 匹馬力柴油發動機',hp:700,ty:'d',eta:0.37,kg:1450,dy:100000},
 {id:'eng.d450',br:'l',sl:'eng',n:'450 匹馬力柴油發動機',hp:450,ty:'d',eta:0.36,kg:950,dy:65000},
 {id:'eng.hyb1300',br:'l',sl:'eng',n:'1300 匹馬力柴電混合動力',hp:1300,ty:'h',eta:0.43,kg:2900,dy:340000,note:'可靜默監視、低紅外特徵'},
 {id:'tr.hm72',br:'l',sl:'tr',n:'液壓機械式自動傳動（限速 72 km/h）',eff:0.68,gov:72,kg:1800,dy:130000},
 {id:'tr.hm65',br:'l',sl:'tr',n:'液壓機械式自動傳動（限速 65 km/h）',eff:0.68,gov:65,kg:1500,dy:110000},
 {id:'tr.wh',br:'l',sl:'tr',n:'輪式自動傳動與差速器（限速 100 km/h）',eff:0.8,gov:100,kg:950,dy:70000},
 {id:'tr.el',br:'l',sl:'tr',n:'電傳動（限速 80 km/h）',eff:0.84,gov:80,kg:1500,dy:200000},
 {id:'fuel.xt03',br:'l',sl:'fuel',n:'車內油箱 1,640 公升',L:1640,kg:110,dy:12000},
 {id:'fuel.saa',br:'l',sl:'fuel',n:'車內油箱 1,300 公升',L:1300,kg:100,dy:11000},
 {id:'fuel.700',br:'l',sl:'fuel',n:'車內油箱 700 公升',L:700,kg:60,dy:7000},
 {id:'fuel.400',br:'l',sl:'fuel',n:'車內油箱 400 公升',L:400,kg:40,dy:4000},
 {id:'gun.c120',br:'l',sl:'gun',n:'OmbtC.120.52 120 公釐滑膛砲（52 倍徑）',by:'白雪貂重工廠',cal:120,lc:52,rof:7,stow:40,kg:3900,dy:280000,osa:1},
 {id:'gun.c105',br:'l',sl:'gun',n:'OmbtC.105.52 105 公釐滑膛砲（52 倍徑）',by:'白雪貂重工廠',cal:105,lc:52,rof:8,stow:48,kg:2900,dy:210000,osa:1},
 {id:'gun.c125',br:'l',sl:'gun',n:'125 公釐滑膛砲（48 倍徑）',cal:125,lc:48,rof:7,stow:40,kg:2600,dy:200000},
 {id:'gun.c30',br:'l',sl:'gun',n:'30 公釐機砲（雙向供彈）',cal:30,lc:80,rof:200,stow:500,kg:750,dy:90000,auto:1},
 {id:'gun.c47',br:'l',sl:'gun',n:'OSa 47 公釐防空機砲（雙管）',by:'東標組織',cal:47,lc:70,rof:300,stow:440,kg:2400,dy:260000,auto:1,aa:1,rng:4.5},
 {id:'gun.h155',br:'l',sl:'gun',n:'155 公釐 52 倍徑榴彈砲',cal:155,lc:52,rof:6,stow:40,kg:3600,dy:420000,arty:1,rng:40},
 {id:'al.OStal03',br:'l',sl:'al',n:'OStal.03 自動裝填機',by:'三零三軍工研製廠',rof:10,car:22,kg:950,dy:160000,crew:-1,rm:'裝填手'},
 {id:'al.gen',br:'l',sl:'al',n:'自動裝填機（範本）',rof:9,car:24,kg:1000,dy:150000,crew:-1,rm:'裝填手'},
 {id:'sec.OScan20',br:'l',sl:'sec',n:'OScan.20 20 公釐機砲',by:'白雪貂重工廠',am:['a20hei','a20sap'],rd:300,kg:380,dy:50000},
 {id:'sec.OShM95',br:'l',sl:'sec',n:'OShM.95 12.7 公釐機槍',am:['h50m33','h50ap','h50api','h127b32'],rd:600,kg:70,dy:8000},
 {id:'sec.mg762',br:'l',sl:'sec',n:'7.62 公釐同軸機槍',am:['r762m80','r762m61'],rd:2000,kg:40,dy:4000},
 {id:'sec.atgm',br:'l',sl:'msl',n:'雙聯反坦克飛彈發射器',am:['tow2a','kornet'],rd:2,kg:380,dy:90000},
 {id:'msl.sota6',br:'l',sl:'msl',n:'「短箭六型」紅外制導飛彈發射架（八聯）',mu:'sota6',rd:8,kg:1100,dy:120000},
 {id:'msl.noi',br:'l',sl:'msl',n:'「響箭」主動雷達制導飛彈發射架（四聯）',mu:'noi',rd:4,kg:2400,dy:180000},
 {id:'tu.xt03',br:'l',sl:'misc',n:'砲塔結構、座圈與砲塔驅動',kg:1600,dy:200000},
 {id:'tu.saa',br:'l',sl:'misc',n:'防空砲塔結構與驅動',kg:2400,dy:260000},
 {id:'tu.small',br:'l',sl:'misc',n:'雙人砲塔結構與驅動（範本）',kg:1100,dy:150000},
 {id:'misc.xt03',br:'l',sl:'misc',n:'電力、三防、自動滅火與車內電子',kg:700,dy:150000},
 {id:'misc.pax',br:'l',sl:'misc',n:'載員艙座椅、三防與電子（範本）',kg:600,dy:80000},
 {id:'fcs.OStvQ00',br:'l',sl:'fcs',n:'OStvQ.00 射控系統',by:'白雪貂光電',sig:0.24,rt:6,th:4.0,kg:250,dy:320000},
 {id:'fcs.osu1',br:'l',sl:'fcs',n:'OSU.i 射控與觀測系統升級',sig:0.17,rt:4.5,th:6.5,kg:150,dy:260000},
 {id:'fcs.basic',br:'l',sl:'fcs',n:'光學與雷射測距射控（早期）',sig:0.45,rt:9,th:0,kg:150,dy:60000},
 {id:'fcs.ifv',br:'l',sl:'fcs',n:'步兵戰車熱像射控（範本）',sig:0.3,rt:6,th:3.5,kg:200,dy:180000},
 {id:'rad.saa_s',br:'l',sl:'rad',n:'S 波段對空搜索雷達（防空車）',rr:45,role:'air',kg:900,dy:900000,pw:12},
 {id:'rad.saa_t',br:'l',sl:'rad',n:'Ku 波段追蹤與火控雷達（防空車）',rr:28,role:'fc',ch:2,kg:600,dy:700000,pw:8},
 {id:'sen.citv',br:'l',sl:'sen',n:'車長獨立熱成像儀',th:7,rt:-1.5,kg:120,dy:90000},
 {id:'sen.eo',br:'l',sl:'sen',n:'光電追蹤儀',th:12,rt:-0.5,kg:150,dy:200000},
 {id:'rws.osu1',br:'l',sl:'rws',n:'遙控武器站（OShM.95）',am:['h50m33','h50ap'],rd:400,kg:300,dy:150000},
 {id:'c4i.kai1',br:'l',sl:'c4i',n:'「鎧甲」第一代綜合作戰系統（敵我識別、全球定位）',sa:1,kg:150,dy:150000},
 {id:'c4i.kai2',br:'l',sl:'c4i',n:'「鎧甲」第二代綜合作戰系統（敵我識別、全球定位）',sa:2,kg:120,dy:220000},
 {id:'c4i.jbcp',br:'l',sl:'c4i',n:'聯合戰場指揮平台',sa:1,add:1,kg:80,dy:110000},
 {id:'ew.crew',br:'l',sl:'ew',n:'電子反遙控炸彈起爆裝置',ied:0.8,kg:120,dy:90000},
 {id:'ew.otvous',br:'l',sl:'ew',n:'Otvous「回聲」綜合電子作戰系統',esm:60,jam:0.5,ied:0.9,net:1,kg:850,dy:1020000,st:'尚未推出',
   note:'被動偵測截獲無線電、雷達與數據鏈並分析回傳；模仿敵方信號進行欺騙式干擾；與「鎧甲」聯網，集群可在撤離點建立電子防護網'},
 {id:'aps.oaps1',br:'l',sl:'aps',n:'Oaps.I「黑盾」第一代主動防禦系統',pR:0.8,pM:0.3,pK:0,arc:60,top:0,coll:1,kg:800,dy:100000,note:'保護砲塔前方周圍 60 度；抵禦火箭彈成功率約八成，但對周圍部隊造成過多附帶傷害'},
 {id:'aps.oaps2',br:'l',sl:'aps',n:'Oaps.II「神盾」第二代主動防禦系統',pR:0.9,pM:0.85,pK:0,arc:360,top:1,coll:0,kg:600,dy:180000,st:'尚未推出',note:'防禦火箭推進榴彈與反坦克飛彈（含長程型），以及單兵火箭與直升機發射的飛彈'},
 {id:'gl.osu1',br:'l',sl:'misc',n:'砲射導彈射控介面',gl:1,kg:50,dy:60000},
 {id:'kit.du3',br:'l',sl:'kit',n:'第二代至第三代衰變鈾裝甲組',zs:[['tf','xtc2','xtc3'],['hf','xtc2','xtc3']],kg:0,dy:120000},
 {id:'kit.osu2',br:'l',sl:'kit',n:'額外複合裝甲組件（OSU.ii）',za:[['tf',0,1,[['xtadd',90,0]]],['ts',0,1,[['xtadd',60,0]]],['hf',0,1,[['xtadd',50,65]]],['hs',0,0.55,[['xtadd',30,0]]]],kg:0,dy:180000},
 {id:'kit.graph',br:'l',sl:'kit',n:'基礎裝甲石墨塗層',za:[['tf',0,1,[['graph',2,0]]],['hf',0,1,[['graph',2,65]]],['ts',0,1,[['graph',2,0]]],['hs',0,1,[['graph',2,0]]]],kg:0,dy:40000},
 {id:'kit.osu3',br:'l',sl:'kit',n:'新額外複合裝甲套件（OSU.iii）',za:[['tf',0,1,[['xtadd',60,0]]],['hf',0,1,[['xtadd',40,65]]],['hs',0,0.55,[['xtadd',25,0]]]],kg:0,dy:200000},
 {id:'kit.ea4',br:'l',sl:'kit',n:'「紅色藍」爆炸反應裝甲',za:[['tf',0,0.9,[['redblue',70,55]]],['hf',0,0.9,[['redblue',70,65]]],['ts',0,0.8,[['redblue',70,30]]],['hs',0,0.6,[['redblue',70,10]]]],kg:0,dy:90000},
 {id:'kit.ea5',br:'l',sl:'kit',n:'「綠色藍」爆炸反應裝甲',za:[['tf',0,0.9,[['greenblue',80,55]]],['hf',0,0.9,[['greenblue',80,65]]],['ts',0,0.8,[['greenblue',80,30]]],['hs',0,0.6,[['greenblue',80,10]]]],kg:0,dy:150000},
 {id:'kit.slat',br:'l',sl:'kit',n:'可調節防爆柵欄',za:[['rr',0,1,[['slatadj',40,0,350]]],['hs',0.6,1,[['slatadj',40,0,350]]]],kg:0,dy:30000},
 /* ===== 空軍 ===== */
 {id:'af.uf10',br:'a',sl:'af',n:'OuUF.10「貓將軍」機體（艦載型，含折疊翼與尾鉤）',by:'騰日航太',kind:'jet',b:14.2,l:18.5,S:50,cd0:0.0218,e:0.8,clmax:2.0,mlim:1.82,gmax:7.5,
   hp:'tip,wing,wet,wet,fus,ctr,fus,wet,wet,wing,tip',car:1,rcs:1.2,fuel:6900,mtow:29500,crew:1,kg:11650,dy:11500000},
 {id:'af.uf10e',br:'a',sl:'af',n:'OcUFe.10「金華貓」機體（電子戰型，翼尖改為接收器）',by:'騰日航太',kind:'jet',b:14.2,l:18.5,S:50,cd0:0.0228,e:0.8,clmax:2.0,mlim:1.8,gmax:7.5,
   hp:'esm,wing,wet,wet,fus,ctr,fus,wet,wet,wing,esm',car:1,rcs:1.4,fuel:6900,mtow:29500,crew:1,kg:11850,dy:12000000},
 {id:'af.uf82',br:'a',sl:'af',n:'OcUF.82「飛貓」機體',by:'騰日航太',kind:'jet',b:12.3,l:17.1,S:37.2,cd0:0.0215,e:0.8,clmax:1.9,mlim:1.8,gmax:7.5,
   hp:'tip,wing,wet,fus,ctr,fus,wet,wing,tip',car:1,rcs:3,fuel:4900,mtow:23400,crew:1,kg:8550,dy:6500000},
 {id:'af.sr00',br:'a',sl:'af',n:'OuSR.00「蔓金苔」預警機機體',by:'騰日航太',kind:'prop',b:24.6,l:17.6,S:65,cd0:0.034,e:0.85,clmax:2.3,mlim:0.6,gmax:3,hp:'',car:1,rcs:25,fuel:5600,mtow:26000,crew:5,kg:13300,dy:28000000},
 {id:'af.asw11',br:'a',sl:'af',n:'OuASW.11「海東青」反潛巡邏機機體',by:'騰日航太',kind:'jet',b:20.9,l:16.3,S:55.6,cd0:0.024,e:0.85,clmax:2.2,mlim:0.82,gmax:3.5,hp:'wing,wing,bay,bay,bay,bay',car:1,rcs:15,fuel:5800,mtow:23800,crew:4,kg:9900,dy:16000000},
 {id:'af.cr00',br:'a',sl:'af',n:'OuCR.00「海鯤」艦載運輸機機體',by:'騰日航太',kind:'prop',b:24.6,l:17.3,S:65,cd0:0.031,e:0.85,clmax:2.3,mlim:0.55,gmax:3,hp:'',car:1,rcs:25,fuel:5500,mtow:24700,crew:4,cargo:4500,pax:26,kg:14500,dy:20000000},
 {id:'af.h10s',br:'a',sl:'af',n:'Ot.10s「海燕」十式通用直升機機體',kind:'rot',D:16.36,l:19.8,f:3.4,vne:333,gmax:3,hp:'pyl,pyl,pyl,pyl',car:1,rcs:10,fuel:1360,mtow:10660,crew:4,pax:11,kg:5900,dy:9000000,tip:221,sol:0.082},
 {id:'af.h08',br:'a',sl:'af',n:'Oe.08oah「海雕」零八式重型反潛直升機機體',kind:'rot',D:18.6,l:22.8,f:4.2,vne:309,gmax:3,hp:'pyl,pyl,pyl,pyl',car:1,rcs:15,fuel:3100,mtow:15600,crew:4,kg:8900,dy:16000000,tip:213,sol:0.09},
 {id:'af.h14',br:'a',sl:'af',n:'Ot.14Nsou「海木客鳥」特種行動／救援行動直升機機體',kind:'rot',D:16.36,l:19.8,f:3.6,vne:333,gmax:3,hp:'pyl,pyl',car:1,rcs:10,fuel:1800,mtow:10900,crew:4,pax:10,kg:6300,dy:11000000,tip:221,sol:0.082},
 {id:'af.uav06',br:'a',sl:'af',n:'Oecu/N.06「水鬼」零六式無人偵察機機體（垂直起降）',kind:'rot',D:10.7,l:12.6,f:0.9,vne:260,gmax:2.5,hp:'',car:1,rcs:3,fuel:900,mtow:2720,crew:0,kg:1350,dy:6000000,tip:210,sol:0.07},
 {id:'af.lf',br:'a',sl:'af',n:'單發輕型戰鬥機機體（範本）',kind:'jet',b:9.96,l:15.0,S:27.9,cd0:0.0195,e:0.8,clmax:1.6,mlim:2.05,gmax:9,hp:'tip,wing,wing,wet,ctr,wet,wing,wing,tip',car:0,rcs:1.5,fuel:3200,mtow:19200,crew:1,kg:6400,dy:8000000},
 {id:'af.st5',br:'a',sl:'af',n:'第五代匿蹤艦載戰鬥機機體（範本，內彈艙）',kind:'jet',b:13.1,l:15.7,S:62,cd0:0.021,e:0.8,clmax:1.9,mlim:1.6,gmax:7.5,hp:'bay,bay,bay,bay,wing,wet,wet,wing',car:1,rcs:0.005,fuel:9100,mtow:31800,crew:1,kg:12600,dy:28000000},
 {id:'af.bomb',br:'a',sl:'af',n:'戰略轟炸機機體（範本，可變後掠翼）',kind:'jet',b:41.7,l:44.8,S:181,cd0:0.0165,e:0.8,clmax:1.9,mlim:1.25,gmax:3,hp:'hbay,hbay,hbay',car:0,rcs:10,fuel:88000,mtow:216000,crew:4,kg:76000,dy:80000000},
 {id:'af.trn',br:'a',sl:'af',n:'戰術運輸機機體（範本）',kind:'prop',b:40.4,l:29.8,S:162,cd0:0.028,e:0.85,clmax:2.4,mlim:0.6,gmax:2.5,hp:'',car:0,rcs:60,fuel:20000,mtow:70300,crew:3,cargo:19000,pax:92,kg:32000,dy:26000000},
 {id:'af.ah',br:'a',sl:'af',n:'攻擊直升機機體（範本）',kind:'rot',D:14.6,l:17.7,f:3.4,vne:365,gmax:3.5,hp:'pyl,pyl,pyl,pyl',car:0,rcs:5,fuel:1150,mtow:10430,crew:2,kg:4800,dy:12000000,tip:221,sol:0.092},
 {id:'ae.oj1160',br:'a',sl:'aeng',n:'OJFoT-1160 型渦輪扇發動機',by:'騰日航太',ty:'tf',dry:72,wet:116,sfcD:0.8,sfcW:1.85,kg:1150,dy:2000000},
 {id:'ae.oj900',br:'a',sl:'aeng',n:'OJFoT-900 型渦輪扇發動機（飛貓）',by:'騰日航太',ty:'tf',dry:49,wet:79,sfcD:0.82,sfcW:1.9,kg:1040,dy:1500000},
 {id:'ae.tf41',br:'a',sl:'aeng',n:'41 kN 高旁通比渦輪扇（無後燃器）',ty:'tf',dry:41,wet:41,sfcD:0.4,sfcW:0.4,kg:670,dy:900000},
 {id:'ae.f130',br:'a',sl:'aeng',n:'130 kN 後燃渦輪扇（範本）',ty:'tf',dry:79,wet:129,sfcD:0.76,sfcW:1.95,kg:1700,dy:3000000},
 {id:'ae.f191',br:'a',sl:'aeng',n:'191 kN 後燃渦輪扇（範本）',ty:'tf',dry:125,wet:191,sfcD:0.78,sfcW:1.9,kg:1700,dy:5500000},
 {id:'ae.f137',br:'a',sl:'aeng',n:'137 kN 後燃渦輪扇（轟炸機範本）',ty:'tf',dry:77,wet:137,sfcD:0.72,sfcW:2.0,kg:2000,dy:4000000},
 {id:'ae.tp3800',br:'a',sl:'aeng',n:'3,800 kW 渦輪螺旋槳發動機',ty:'tp',kw:3800,sfc:0.3,kg:880,dy:1500000},
 {id:'ae.tp3460',br:'a',sl:'aeng',n:'3,460 kW 渦輪螺旋槳發動機（範本）',ty:'tp',kw:3460,sfc:0.29,kg:860,dy:1300000},
 {id:'ae.ts1410',br:'a',sl:'aeng',n:'1,410 kW 渦輪軸發動機',ty:'ts',kw:1410,sfc:0.3,kg:210,dy:400000},
 {id:'ae.ts1600',br:'a',sl:'aeng',n:'1,600 kW 渦輪軸發動機',ty:'ts',kw:1600,sfc:0.29,kg:240,dy:450000},
 {id:'ae.ts485',br:'a',sl:'aeng',n:'485 kW 渦輪軸發動機',ty:'ts',kw:485,sfc:0.36,kg:110,dy:150000},
 {id:'ar.cateye',br:'a',sl:'rad',n:'「貓眼」X 波段被動相位陣列雷達（PESA）',ty:'PESA',rr:72,tr:20,en:4,kg:260,pw:6,dy:2000000},
 {id:'ar.scateye',br:'a',sl:'rad',n:'「超級貓眼」X 波段主動電子掃描陣列雷達（AESA）',ty:'AESA',rr:100,tr:28,en:8,lpi:1,kg:230,pw:8,dy:3000000},
 {id:'ar.mech',br:'a',sl:'rad',n:'機械掃描脈衝都卜勒雷達',ty:'MSA',rr:55,tr:10,en:2,kg:200,pw:5,dy:1000000},
 {id:'ar.aew',br:'a',sl:'rad',n:'UHF 波段旋罩主動電子掃描陣列預警雷達',ty:'AESA',rr:360,tr:2000,en:0,aew:1,kg:2600,pw:120,dy:25000000},
 {id:'ar.sea',br:'a',sl:'rad',n:'海面搜索與逆合成孔徑雷達',ty:'AESA',rr:90,tr:50,en:0,kg:300,pw:6,dy:2000000},
 {id:'ar.irst',br:'a',sl:'irst',n:'紅外搜索追蹤裝置',rr:45,kg:60,dy:800000},
 {id:'ar.eo',br:'a',sl:'eo',n:'整合式光電瞄準系統',rr:30,kg:200,dy:900000},
 {id:'ar.uaveo',br:'a',sl:'eo',n:'無人機光電／合成孔徑雷達酬載',rr:40,kg:120,dy:1500000},
 {id:'ar.self',br:'a',sl:'ew',n:'機體自防系統（雷達告警、干擾、熱焰彈與箔條）',jam:0.25,kg:180,dy:1200000},
 {id:'ar.prr',br:'a',sl:'ew',n:'高靈敏度被動雷達接收器（機首與機尾）',esm:450,kg:120,dy:2500000},
 {id:'ar.ew10',br:'a',sl:'ew',n:'「金華貓」機內電子戰系統',jam:0.45,kg:380,dy:3500000},
 {id:'ar.gun',br:'a',sl:'gun',n:'OScan.20 20 公釐機砲（機內）',by:'白雪貂重工廠',am:['a20hei'],rd:412,kg:220,dy:300000},
 {id:'ar.l16',br:'a',sl:'c4i',n:'戰術資料鏈與敵我識別',kg:50,dy:400000},
 {id:'ar.aewc4',br:'a',sl:'c4i',n:'空中攔截管制與指揮控制系統',kg:1500,dy:10000000},
 {id:'ar.asw',br:'a',sl:'asw',n:'反潛任務系統（磁異探測、聲納浮標處理、電子支援）',kg:1600,dy:9000000},
 {id:'ar.dip',br:'a',sl:'asw',n:'吊放聲納與聲納浮標處理',kg:650,dy:6000000},
 {id:'ar.hoist',br:'a',sl:'misc',n:'救援絞車、夜視與艙門機槍',kg:350,dy:800000},
 {id:'ar.cargo',br:'a',sl:'misc',n:'貨艙與艙門滾裝系統',kg:600,dy:1000000},
 /* ===== 海軍 ===== */
 {id:'sh.cm0',br:'s',sl:'hull',n:'零型「時代」艦體（含艙裝與艦體系統）',Loa:185,Lwl:176,B:23,Bwl:22.5,T:7.0,D:15.5,Cb:0.493,k:0.1344,fx:0.704,mast:34,crew:163,dy:608500000},
 {id:'sh.cvn90',br:'s',sl:'hull',n:'九十型「東洋」艦體（含飛行甲板、機庫與艙裝）',Loa:362,Lwl:333,B:79,Bwl:41,T:12.7,D:31,Cb:0.563,k:0.0861,fx:0.9,mast:62,crew:1650,deck:19000,dy:2477500000},
 {id:'sh.dd',br:'s',sl:'hull',n:'驅逐艦艦體（範本）',Loa:155,Lwl:143,B:20,Bwl:19,T:6.4,D:12.8,Cb:0.49,k:0.1416,fx:0.8,mast:30,crew:200,dy:250000000},
 {id:'sh.ff',br:'s',sl:'hull',n:'巡防艦艦體（範本）',Loa:142,Lwl:132,B:20,Bwl:18.6,T:5.5,D:11,Cb:0.49,k:0.1607,fx:0.85,mast:28,crew:100,dy:150000000},
 {id:'sh.fs',br:'s',sl:'hull',n:'輕型護衛艦艦體（範本）',Loa:95,Lwl:88,B:12.6,Bwl:12,T:3.9,D:7.5,Cb:0.5,k:0.1801,fx:0.9,mast:20,crew:60,dy:60000000},
 {id:'sh.fac',br:'s',sl:'hull',n:'飛彈快艇艦體（範本）',Loa:60,Lwl:55,B:9,Bwl:8.4,T:2.6,D:5,Cb:0.42,k:0.121,fx:0.7,mast:14,crew:30,dy:15000000},
 {id:'sh.lhd',br:'s',sl:'hull',n:'兩棲攻擊艦艦體（範本，含塢艙）',Loa:257,Lwl:237,B:42,Bwl:32,T:8.1,D:28,Cb:0.6,k:0.0911,fx:1,mast:45,crew:1000,deck:10000,well:1,dy:900000000},
 {id:'sh.ssk',br:'s',sl:'hull',n:'柴電潛艦艦體（範本，耐壓殼）',sub:1,Loa:72,Lwl:72,B:8.5,Bwl:8.5,T:8.5,D:8.5,Cb:0.62,k:0.105,fx:1,mast:0,crew:40,dy:250000000},
 {id:'sp.ozkau',br:'s',sl:'pw',n:'OZKAU 燃氣輪機',ty:'gt',mw:28.25,sfc:0.215,kg:32000,dy:12000000},
 {id:'sp.cogag',br:'s',sl:'pw',n:'全燃聯合（COGAG）齒輪箱、軸系與推進器',ty:'gear',kg:520000,dy:60000000},
 {id:'sp.dg3',br:'s',sl:'pw',n:'3 MW 柴油發電機組',ty:'dg',mw:3,sfc:0.21,kg:38000,dy:3000000},
 {id:'sp.pwr91',br:'s',sl:'pw',n:'OPWR/N2/REACT.91「海炬」壓水式核反應爐（含蒸汽渦輪與軸系）',ty:'nuc',mw:162,kg:2900000,dy:600000000},
 {id:'sp.tg8',br:'s',sl:'pw',n:'8 MW 蒸汽渦輪發電機',ty:'tg',mw:8,kg:90000,dy:8000000},
 {id:'sp.diesel8',br:'s',sl:'pw',n:'8 MW 主柴油機（範本）',ty:'d',mw:8,sfc:0.2,kg:42000,dy:5000000},
 {id:'sp.gear2',br:'s',sl:'pw',n:'雙軸齒輪箱、軸系與推進器（範本）',ty:'gear',kg:180000,dy:20000000},
 {id:'sp.aip',br:'s',sl:'pw',n:'絕氣推進系統（範本）',ty:'aip',mw:0.3,kg:60000,dy:20000000},
 {id:'sp.batt',br:'s',sl:'pw',n:'潛艦鋰電池組與推進電機（範本）',ty:'batt',mw:3.5,mwh:12,kg:280000,dy:30000000},
 {id:'ss.hul00',br:'s',sl:'son',n:'ORAS/AHS/MF/HUL.00「江豚」中頻主動艦殼聲納',sr:30,kg:45000,pw:200,dy:10000000},
 {id:'ss.asw00',br:'s',sl:'son',n:'ORAS/PAS/LF/ASW.00「漁網」低頻主被動拖曳聲納',sr:60,kg:25000,pw:60,dy:6000000},
 {id:'ss.vds01',br:'s',sl:'son',n:'ORAS/VDS/MF/VDS.01「深潛耳」中頻可變深度聲納',sr:40,kg:30000,pw:150,dy:10000000},
 {id:'ss.mine01',br:'s',sl:'son',n:'ORAS/HF/MINE.01「獵礁」高頻主動掃雷聲納',sr:2,kg:3000,pw:20,dy:2000000},
 {id:'ss.flank',br:'s',sl:'son',n:'潛艦艦艏與舷側陣列聲納（範本）',sr:50,kg:30000,pw:40,dy:15000000},
 {id:'sr.ews15',br:'s',sl:'rad',n:'ORAR/AESA/L/EWS.15「海劍盾」L 波段海基戰略預警主動電子掃描陣列',rr:900,role:'ew',kg:60000,pw:900,dy:60000000},
 {id:'sr.als05',br:'s',sl:'rad',n:'ORAR/PESA/S/ALS.05「天眼」S 波段對空搜索被動電子掃描陣列',rr:320,role:'air',kg:40000,pw:600,dy:40000000},
 {id:'sr.kus02',br:'s',sl:'rad',n:'ORAR/AESA/Ku/KUS.02「雷影」Ku 波段高解析搜索主動電子掃描陣列',rr:60,role:'img',kg:3000,pw:50,dy:8000000},
 {id:'sr.kas03',br:'s',sl:'rad',n:'ORAR/AESA/Ka/KAS.03「海鷹眼」Ka 波段精密成像主動電子掃描陣列',rr:40,role:'img',kg:2000,pw:40,dy:8000000},
 {id:'sr.fcr05',br:'s',sl:'rad',n:'ORAR/PESA/C/FCR.05「火球瞳」C 波段相位陣列射控雷達',rr:150,role:'fc',ch:8,ill:4,kg:8000,pw:150,dy:12000000},
 {id:'sr.fcr09',br:'s',sl:'rad',n:'ORAR/AESA/X/FCR.09「銀瞳」X 波段主動火控雷達',rr:180,role:'fc',ch:16,ill:6,kg:6000,pw:200,dy:20000000},
 {id:'sr.ax15',br:'s',sl:'rad',n:'ORAR/AESA/X/AX.15「超級海貓眼」X 波段高精度主動電子掃描陣列',rr:220,role:'air',ch:12,ill:4,kg:10000,pw:300,dy:30000000},
 {id:'sr.gpf06',br:'s',sl:'rad',n:'ORAR/MESA/S/GPF.06「深眼」S 波段低空補盲電子掃描陣列',rr:120,role:'low',kg:4000,pw:80,dy:8000000},
 {id:'sr.ews12',br:'s',sl:'rad',n:'ORAR/AESA/LX/EWS.12「水貓將軍」L/X 雙頻段主動電子掃描陣列',rr:400,role:'air',kg:20000,pw:500,dy:50000000},
 {id:'sr.full12',br:'s',sl:'rad',n:'ORAR/MESA/L/Full.12「百眼怪」L 波段多用途電子掃描陣列',rr:450,role:'air',kg:30000,pw:500,dy:35000000},
 {id:'sr.sur07',br:'s',sl:'rad',n:'ORAR/PESA/X/SUR.07「海角獸」X 波段海面搜索被動電子掃描陣列',rr:100,role:'low',kg:5000,pw:80,dy:10000000},
 {id:'sr.nav01',br:'s',sl:'rad',n:'ORAR/I-Band/NAV.01「海燕」I 波段導航雷達',rr:40,role:'nav',kg:500,pw:5,dy:500000},
 {id:'sr.ciws01',br:'s',sl:'rad',n:'ORAR/K-Band/CIWS.01「短牙」K 波段近防武器火控雷達',rr:15,role:'ciws',kg:1000,pw:20,dy:3000000},
 {id:'so.ciws01',br:'s',sl:'eo',n:'OPT/EO/CIWS.01「長鬚」光電／紅外近防追蹤系統',rr:12,kg:500,pw:5,dy:2000000},
 {id:'so.ir02',br:'s',sl:'eo',n:'OPT/EO/IR.02「夜鳶」長波紅外搜索追蹤系統',rr:25,kg:1000,pw:10,dy:8000000},
 {id:'so.ocean01',br:'s',sl:'misc',n:'OMET/OCEAN/OBS.01「潮心」海洋觀測系統',kg:500,pw:5,dy:1000000},
 {id:'sc.cec05',br:'s',sl:'c4i',n:'OCON/WB/CEC.05「海神大將」艦載作戰指揮系統',cec:1,kg:20000,pw:300,dy:120000000},
 {id:'sc.ldl15',br:'s',sl:'c4i',n:'OCON/WB/LDL.15「天網將軍」戰術資料鏈系統',kg:2000,pw:20,dy:15000000},
 {id:'sc.sat12',br:'s',sl:'c4i',n:'OCON/WB/SATCOM.12「送信鴿」衛星通信系統',kg:3000,pw:30,dy:10000000},
 {id:'sc.ucom03',br:'s',sl:'c4i',n:'OCON/HF-VHF/UCOM.03「海語」多頻通聯系統',kg:3000,pw:30,dy:5000000},
 {id:'sn.ins02',br:'s',sl:'nav',n:'ONAV/INS/GPS.02「海衡」多重慣導／衛星導航',kg:500,pw:3,dy:2000000},
 {id:'sa.rov01',br:'s',sl:'asw',n:'OASW/ROV/TORP.01「海鬼」反潛無人潛航器系統',kg:15000,pw:50,dy:30000000},
 {id:'sa.roc01',br:'s',sl:'asw',n:'OASW/ROC/MTR.01「三叉戟」反潛火箭系統',kg:10000,pw:10,dy:15000000},
 {id:'sa.mrov',br:'s',sl:'asw',n:'Onuav/K.15 遙控獵雷載具（特殊型號搭載）',kg:4000,pw:20,dy:12000000},
 {id:'sa.tt',br:'s',sl:'asw',n:'533 公釐魚雷管（範本）',kg:15000,pw:10,dy:8000000},
 {id:'se.esm01',br:'s',sl:'ew',n:'OELR/WB/ESM.01「霧中將軍」寬頻電子支援系統',esm:500,kg:5000,pw:50,dy:25000000},
 {id:'se.ecm02',br:'s',sl:'ew',n:'OELR/WB/ECM.02「雷電將軍」寬頻電子干擾系統',jam:0.3,kg:8000,pw:300,dy:40000000},
 {id:'se.rjz04',br:'s',sl:'dec',n:'EW/DEC/H-RJZ.04 八聯裝干擾發射器（干擾彈／箔條／熱焰誘餌）',dec:0.06,kg:1200,pw:2,dy:1000000},
 {id:'se.inf01',br:'s',sl:'dec',n:'EW/DEC/INF.01 充氣式水面誘餌發射器',dec:0.05,kg:1500,pw:2,dy:1500000},
 {id:'se.act',br:'s',sl:'dec',n:'EW/DEC/M 主動式誘餌發射器（主動雷達誘餌）',dec:0.08,kg:2000,pw:5,dy:2000000},
 {id:'se.dec83',br:'s',sl:'dec',n:'EW/DEC/DEC.83 主動式誘餌發射器',dec:0.08,kg:2000,pw:5,dy:2000000},
 {id:'se.el01',br:'s',sl:'ew',n:'EW/ILL/EL.01「浪人」電子照射器（電磁壓制／照射）',jam:0.08,ill:1,kg:2000,pw:200,dy:6000000},
 {id:'se.bb01',br:'s',sl:'ew',n:'EW/NOISE/BB.01 氣泡幕噪音抑制系統（水下噪音干擾／減噪）',quiet:1,kg:10000,pw:200,dy:8000000},
 {id:'se.foxd',br:'s',sl:'dec',n:'OTD/ASW/DECOY.01「水狐」拖曳式魚雷誘餌',tdec:0.4,kg:2500,pw:5,dy:2000000},
 {id:'se.hk01',br:'s',sl:'dec',n:'OTD/ASW/HK.01「盾矛」反魚雷硬殺系統（選配）',thk:0.5,kg:6000,pw:20,dy:12000000},
 {id:'sw.ovl99',br:'s',sl:'vls',n:'四單元 OVL.99 型艦載通用垂直發射系統',cells:4,kg:8500,pw:5,dy:2500000},
 {id:'sw.osl00',br:'s',sl:'lnch',n:'九聯裝 OSL.00 型中小型飛彈架',cells:9,kg:6000,pw:10,dy:4000000},
 {id:'sw.box4',br:'s',sl:'lnch',n:'四聯裝反艦飛彈發射箱（範本）',cells:4,kg:7000,pw:2,dy:2000000},
 {id:'sw.ocan99',br:'s',sl:'gun',n:'Ocan.99「長喙」單管 127 公釐艦砲',am:'n127he',cal:127,rof:20,rd:600,rng:24,kg:25000,pw:50,dy:10000000},
 {id:'sw.ciws95',br:'s',sl:'ciws',n:'Ocan/C.95 八管 47 公釐近防艦砲',am:'a47he',pk:0.7,r:4,cyc:3.5,rd:1600,kg:13000,pw:60,dy:10000000},
 {id:'sv.hang2',br:'s',sl:'av',n:'雙機庫與直升機甲板',hang:2,kg:150000,dy:25000000},
 {id:'sv.cat',br:'s',sl:'av',n:'OCAT/SCAC/4L.01「水弦」蒸汽彈射系統',cat:1,mj:95,kg:450000,dy:50000000},
 {id:'sv.aag',br:'s',sl:'av',n:'OCAT/AAG/4W.01 攔阻裝置',arr:1,kg:90000,dy:15000000},
 {id:'sv.jbd',br:'s',sl:'av',n:'OCAT/JBD/6P.01 噴流擋板（甲板防熱）',kg:12000,dy:1000000},
 {id:'sv.elev',br:'s',sl:'av',n:'OFLT/ELEV/AC.01 航空器升降機',kg:120000,dy:12000000},
 {id:'sv.welev',br:'s',sl:'av',n:'OFLT/ELEV/ARM.02 武器升降機（彈藥庫至甲板）',kg:40000,dy:5000000},
 {id:'sv.tract',br:'s',sl:'av',n:'OFLT/HND/TRACT.01 航空器牽引／定位系統',kg:50000,dy:8000000},
 {id:'sv.jp5',br:'s',sl:'av',n:'OFLT/FUEL/JP5.01 航空燃油供應系統（JP-5 艙、泵與濾水）',kg:400000,dy:50000000},
 {id:'sv.foam',br:'s',sl:'av',n:'OFLT/FF/FOAM.01 甲板泡沫滅火（AFFF／水霧聯合）',kg:80000,dy:10000000},
 {id:'sv.mag',br:'s',sl:'av',n:'OMAG/HS/DL.01 彈藥庫處理與安全聯鎖（搬運、溫控、防爆）',kg:300000,dy:40000000},
 {id:'sv.well',br:'s',sl:'av',n:'塢艙與登陸艇（範本）',kg:3000000,dy:120000000},
 {id:'st.app01',br:'s',sl:'atc',n:'OATC/S/APP.01「塔鷹」S 波段進場監視雷達',rr:110,kg:3000,pw:30,dy:6000000},
 {id:'st.par02',br:'s',sl:'atc',n:'OATC/X/PAR.02 X 波段精密進場雷達',kg:2000,pw:20,dy:5000000},
 {id:'st.jpals03',br:'s',sl:'atc',n:'OATC/L/JPALS.03「燈塔」L 波段精準著艦定位系統',kg:1000,pw:10,dy:8000000},
 {id:'st.tacan01',br:'s',sl:'atc',n:'OATC/UHF/TACAN.01「艦標一號」UHF 戰術空域導航信標',kg:800,pw:5,dy:2000000},
 {id:'st.ols01',br:'s',sl:'atc',n:'OATC/OLS/FRES.01「海光」光學著艦引導系統（菲涅耳透鏡）',kg:5000,pw:10,dy:3000000},
 {id:'st.iff01',br:'s',sl:'atc',n:'ORID/SIF/IFF.01「舊友」敵我識別詢答器',kg:500,pw:5,dy:3000000},
 {id:'st.met01',br:'s',sl:'atc',n:'OMET/ATIS/MET.01「空穹」航空氣象系統',kg:500,pw:5,dy:1000000}
];

/* ---------- munitions for aircraft, ships and launchers ----------
   t: aam / sam / agm / arm / ashm / cm (cruise missile) / bomb / gbomb (guided) / cbu / rkt (rocket pod) / torp / pod / tank / buddy
   kg, rng km, mach, wh warhead kg, dy 東銀圓, pk (air: vs fighter; ship SAM: vs sea-skimmer), f drag area m² when carried, rcs m² when carried, act active seeker,
   abm ballistic-missile capable, fuel kg (tanks), rack max per station, pl platforms (a air, s ship, l land), proj armour-simulator projectile, nuke tactical nuclear (no effects simulated) */
var MUN=[
 {id:'mida1',n:'「稜簇一型」半主動雷達制導中程對空飛彈',code:'Omisaa.mida.I',by:'萬邦航太',t:'aam',kg:230,rng:45,mach:4,wh:39,dy:150000,pk:0.4,f:0.04,rcs:0.1,pl:'a'},
 {id:'mida2',n:'「稜簇二型」全方位半主動雷達制導中程對空飛彈',code:'Omisaa.mida.II',by:'萬邦航太',t:'aam',kg:230,rng:70,mach:4,wh:39,dy:220000,pk:0.5,f:0.04,rcs:0.1,pl:'a'},
 {id:'mida3',n:'「稜簇三型」先進全方位主動雷達制導中長程對空飛彈',code:'Omisaa.mida.III',by:'萬邦航太',t:'aam',kg:161,rng:160,mach:4,wh:18,dy:440000,pk:0.6,act:1,f:0.03,rcs:0.08,pl:'a'},
 {id:'sota5',n:'「短箭五型」紅外制導短程對空飛彈',code:'Omisaa.sota.V',by:'騰日系統',t:'aam',kg:86,rng:18,mach:2.5,wh:9.4,dy:120000,pk:0.65,f:0.02,rcs:0.05,pl:'as'},
 {id:'sota6',n:'「短箭六型」先進全方位紅外制導短程對空飛彈',code:'Omisaa.sota.VI',by:'騰日系統',t:'aam',kg:85,rng:35,mach:3,wh:9.4,dy:190000,pk:0.8,f:0.02,rcs:0.05,pl:'asl'},
 {id:'lsma6',n:'「仰箭六型」陸用紅外制導對空飛彈',code:'Omisoa.lsma.VI',by:'騰日系統',t:'sam',kg:90,rng:15,mach:2.5,wh:9.4,dy:200000,pk:0.75,pl:'l'},
 {id:'noi',n:'「響箭」先進主動雷達制導長程對空飛彈',code:'Omisoa.noi',by:'重江系統',t:'aam',kg:460,rng:300,mach:5,wh:60,dy:1100000,pk:0.55,act:1,f:0.07,rcs:0.15,pl:'al'},
 {id:'sli3',n:'「天雷三型」紅外線／雷射／電視復合式制導空對地飛彈',code:'Omisal.sli.III',by:'萬邦航太',t:'agm',kg:300,rng:27,mach:1.1,wh:57,dy:70000,f:0.06,rcs:0.15,pl:'a',proj:'m_sli3'},
 {id:'gui7',n:'「引雷七型」先進高速反輻射制導對地飛彈',code:'Omisal.gui.VII',by:'騰日系統',t:'arm',kg:361,rng:150,mach:2.5,wh:66,dy:360000,f:0.06,rcs:0.12,pl:'a'},
 {id:'downfall',n:'「墮星」毫米波雷達制導小型對地飛彈（三聯掛架）',code:'Omisal.downfall',by:'騰日系統',t:'agm',kg:190,rng:20,mach:1.3,wh:6.3,dy:240000,f:0.07,rcs:0.15,pl:'a',proj:'m_downfall',per:3},
 {id:'bshid',n:'「藍盾戟」慣性制導末段射頻／雙頻紅外線復合尋標器線制導長程反艦飛彈',code:'Omisal.bshid',by:'重江系統',t:'ashm',kg:1100,rng:370,mach:0.9,wh:450,dy:1400000,pk:0.85,f:0.14,rcs:0.1,pl:'as'},
 {id:'ocaxe',n:'「水飛斧」慣性制導末段射頻尋標器線制導小型反艦飛彈',code:'Omisas.ocaxe',by:'重江系統',t:'ashm',kg:410,rng:185,mach:0.95,wh:125,dy:500000,pk:0.8,f:0.08,rcs:0.08,pl:'as'},
 {id:'lanxe',n:'「飛斧」慣性制導末段射頻尋標器線制導小型巡弋飛彈',code:'Omisas.lanxe',by:'重江系統',t:'cm',kg:480,rng:300,mach:0.9,wh:120,dy:450000,f:0.08,rcs:0.08,pl:'as'},
 {id:'ghoshan',n:'「鬼手」距外攻擊型慣性制導與定位系統制導末段紅外線尋標器制導巡弋飛彈',code:'Omisal.ghoshan',by:'重江系統',t:'cm',kg:1020,rng:370,mach:0.8,wh:450,dy:600000,f:0.13,rcs:0.05,pl:'a'},
 {id:'Nghoshan',n:'「海鬼手」距外攻擊型慣性制導與定位系統制導末段紅外線尋標器制導巡弋飛彈',code:'Omisal.Nghoshan',by:'重江系統',t:'cm',kg:1500,rng:1600,mach:0.75,wh:450,dy:800000,pl:'s'},
 {id:'debell',n:'「黃鳶」距外攻擊型慣性制導與定位系統制導末段紅外線尋標器制導戰術當量核巡弋飛彈',code:'Omisal.debell',by:'重江系統',t:'cm',kg:1450,rng:2500,mach:0.8,wh:120,dy:8000000,nuke:1,f:0.14,rcs:0.05,pl:'a',note:'造價為推估值'},
 {id:'metshow_he',n:'「流星雨」空射火箭發射筒（19 管，高爆彈）',code:'Oatr.metshow.HE',by:'白雪貂綜工',t:'rkt',kg:290,rng:8,mach:2,wh:19*1.0,dy:30000,f:0.12,rcs:0.4,pl:'a'},
 {id:'metshow_sm',n:'「流星雨」空射火箭發射筒（19 管，煙幕彈）',code:'Oatr.metshow.SM',by:'白雪貂綜工',t:'rkt',kg:280,rng:8,mach:2,dy:22000,f:0.12,rcs:0.4,pl:'a'},
 {id:'metshow_wp',n:'「流星雨」空射火箭發射筒（19 管，白磷彈）',code:'Oatr.metshow.WP',by:'白雪貂綜工',t:'rkt',kg:285,rng:8,mach:2,dy:26000,f:0.12,rcs:0.4,pl:'a'},
 {id:'metshow_tr',n:'「流星雨」空射火箭發射筒（19 管，訓練彈）',code:'Oatr.metshow.TR',by:'白雪貂綜工',t:'rkt',kg:270,rng:8,mach:2,dy:9000,f:0.12,rcs:0.4,pl:'a'},
 {id:'ghomot',n:'「鬼母」系列風偏修正制導集束炸彈',code:'ObCB.ghomot',by:'重江系統',t:'cbu',kg:420,rng:15,wh:380,dy:150000,f:0.09,rcs:0.3,pl:'a'},
 {id:'strigal250',n:'「猛鷹」低阻力通用炸彈（250 公斤級）',code:'ObOB.strigal.250',by:'白雪貂綜工',t:'bomb',kg:241,rng:8,wh:87,dy:1600,f:0.06,rcs:0.2,pl:'a'},
 {id:'strigal500',n:'「猛鷹」低阻力通用炸彈（500 公斤級）',code:'ObOB.strigal.500',by:'白雪貂綜工',t:'bomb',kg:454,rng:9,wh:202,dy:3000,f:0.08,rcs:0.25,pl:'a'},
 {id:'strigal1000',n:'「猛鷹」低阻力通用炸彈（1,000 公斤級）',code:'ObOB.strigal.1000',by:'白雪貂綜工',t:'bomb',kg:925,rng:10,wh:429,dy:6000,f:0.11,rcs:0.3,pl:'a'},
 {id:'yan',n:'「燕爪」慣性制導與定位系統制導末段紅外線尋標器制導滑翔炸彈',code:'ObGB.yan',by:'重江系統',t:'gbomb',kg:483,rng:110,wh:220,dy:200000,f:0.09,rcs:0.15,pl:'a'},
 {id:'falroc',n:'「落石」慣性制導／雷射制導炸彈（250 公斤級）',code:'ObGB.falroc',by:'重江系統',t:'gbomb',kg:254,rng:24,wh:87,dy:14000,f:0.06,rcs:0.2,pl:'a'},
 {id:'rolroc',n:'「滾石」慣性制導／雷射制導滑翔炸彈',code:'ObGB.rolroc',by:'重江系統',t:'gbomb',kg:130,rng:110,wh:17,dy:16000,f:0.04,rcs:0.08,pl:'a',per:4},
 {id:'giant',n:'「巨石」慣性制導／雷射制導炸彈（1,000 公斤級）',code:'ObGB.giant',by:'重江系統',t:'gbomb',kg:925,rng:28,wh:429,dy:18000,f:0.11,rcs:0.3,pl:'a'},
 {id:'cspe',n:'「牛能言」慣性制導／雷射制導戰術核彈',code:'ObGBn.cspe',by:'重江系統',t:'gbomb',kg:320,rng:15,dy:4000000,nuke:1,f:0.06,rcs:0.2,pl:'a',note:'造價為推估值'},
 {id:'tank1800',n:'1,800 公升副油箱',t:'tank',kg:1680,fuel:1480,dy:8000,f:0.12,rcs:0.5,pl:'a'},
 {id:'tank1250',n:'1,250 公升副油箱',t:'tank',kg:1180,fuel:1030,dy:6000,f:0.1,rcs:0.4,pl:'a'},
 {id:'ofew10',n:'OFew.10 型干擾莢艙',t:'pod',kg:480,jam:0.35,dy:4000000,f:0.12,rcs:0.3,pl:'a'},
 {id:'tgp',n:'雷射目標指示莢艙',t:'pod',kg:210,dy:1200000,f:0.06,rcs:0.15,pl:'a'},
 {id:'buddy',n:'空中加油莢艙（含 1,250 公升燃油）',t:'buddy',kg:1600,fuel:1030,give:1030,dy:900000,f:0.13,rcs:0.4,pl:'a'},
 {id:'lwt',n:'輕型反潛魚雷',t:'torp',kg:276,rng:9,wh:45,dy:400000,f:0.05,rcs:0.1,pl:'as'},
 {id:'sonob',n:'聲納浮標組（16 枚）',t:'pod',kg:250,dy:60000,f:0.05,rcs:0.1,pl:'a'},
 {id:'zijin12',n:'「紫荊十二型」慣性制導末段主動雷達制導長程對空飛彈',code:'Omisoa.zijin',t:'sam',kg:1500,rng:240,mach:3.5,wh:64,dy:1700000,pk:0.7,act:1,abm:1,pl:'s'},
 {id:'lona2',n:'「霄箭二型」慣性制導末段半主動雷達制導對空飛彈',code:'Omisoa.lona.II',t:'sam',kg:708,rng:167,mach:3.5,wh:62,dy:840000,pk:0.62,pl:'s'},
 {id:'lona3',n:'「霄箭三型」先進慣性導引末段半主動雷達導引對空飛彈',code:'Omisoa.lona.III',t:'sam',kg:1000,rng:200,mach:3.5,wh:62,dy:1000000,pk:0.68,abm:1,pl:'s'},
 {id:'okwB',n:'「刺叉」乙型慣性制導末段聲波自導火箭助飛魚雷',code:'Omiasm.okw.B',t:'torp',kg:750,rng:22,mach:1,wh:45,dy:600000,pl:'s'},
 {id:'ram12',n:'「新銳」近程防空飛彈',code:'Omiscw.ram.12',t:'sam',kg:74,rng:9,mach:2,wh:11,dy:360000,pk:0.8,act:1,pl:'s'}
];

/* ---------- upgrade packages: tgt = official weight added (kg); bal = mounting, wiring and structural reinforcement that closes the gap ---------- */
var PKG=[
 {id:'osu1',n:'OSU.i 系統升級包',yr:4005,tgt:2000,mods:[['fcs.osu1',1],['rws.osu1',1],['kit.du3',1],['gl.osu1',1]],note:'射控與觀測系統升級、遙控武器站、第二代至第三代衰變鈾裝甲組、砲射導彈'},
 {id:'osu2',n:'OSU.ii 系統升級包',yr:4010,tgt:5600,mods:[['c4i.kai1',1],['kit.osu2',1],['kit.graph',1],['sen.citv',1]],note:'「鎧甲」第一代綜合作戰系統、額外複合裝甲組件、基礎裝甲石墨塗層、車長獨立熱成像儀'},
 {id:'osu3',n:'OSU.iii 系統升級包',yr:4015,tgt:2600,mods:[['c4i.kai2',1],['c4i.jbcp',1],['ew.crew',1],['kit.osu3',1]],note:'「鎧甲」第二代綜合作戰系統、聯合戰場指揮平台、電子反遙控炸彈起爆裝置、新額外複合裝甲套件'},
 {id:'ea4',n:'EA.iv 第四代額外套件',tgt:6000,mods:[['kit.ea4',1],['kit.slat',1]],note:'「紅色藍」爆炸反應裝甲、可調節防爆柵欄'},
 {id:'ea5',n:'EA.v 第五代額外套件',tgt:8300,mods:[['kit.ea5',1],['kit.slat',1],['aps.oaps1',1]],note:'「綠色藍」爆炸反應裝甲、可調節防爆柵欄、Oaps.I「黑盾」'},
 {id:'ea6',n:'EA.vi 第六代額外套件',tgt:600,st:'尚未推出',mods:[['aps.oaps2',1]],note:'Oaps.II「神盾」'},
 {id:'otv',n:'Otvous「回聲」系統',st:'尚未推出',mods:[['ew.otvous',1]]}
];

/* ---------- carrier air-wing missions (from the 東洋 specification) ---------- */
var MISS={
 uf10:['轟炸任務（BOMB）','空中密接支援（CAS）','戰鬥空中巡邏（CAP）','自衛打擊任務（SES）','守勢制空作戰（DCA）','攻勢制空作戰（OCA）','水面監視及制海（SSC）','海上空中支援（MAS）','海上目標空中阻絕（AIMT）','攻擊協調及偵查（SCAR）','戰術情報蒐集（TACINT）','距外陸攻飛彈任務（SLAM）','距外陸攻飛彈中繼資料鏈任務（AWW13）','空中加油任務（P/MTNK）','15 分鐘警戒（ALT15）','30 分鐘警戒（ALT30）'],
 uf82:['轟炸任務（BOMB）','空中密接支援（CAS）','戰鬥空中巡邏（CAP）','自衛打擊任務（SES）','守勢制空作戰（DCA）','攻勢制空作戰（OCA）','水面監視及制海（SSC）','海上空中支援（MAS）','海上目標空中阻絕（AIMT）','攻擊協調及偵查（SCAR）','戰術情報蒐集（TACINT）','距外陸攻飛彈任務（SLAM）','距外陸攻飛彈中繼資料鏈任務（AWW13）','15 分鐘警戒（ALT15）','30 分鐘警戒（ALT30）'],
 uf10e:['敵防空網壓制（SEAD）','敵防空網摧毀（DEAD）','高速反輻射飛彈任務（HARM）','電戰空中密接支援（EWCAS）','水面監視及制海（SSC）'],
 sr00:['空中預警（AEW）','空中攔截管制（AIC）','空中預警警戒待命（ALT AEW）'],
 asw11:['水面監視及制海（SSC）','反潛作戰（ASW）','水面監視與反潛警戒待命（ALT SSC/ASW）'],
 cr00:['後勤運輸（LOG）','參訪人員運輸（DV）'],
 h14:['海域警戒（PG）','搜索救難（SAR）','海域警戒與搜索救難警戒待命（ALT PG/SAR）','垂直海上補給（VERTREP）','登船檢查支援（VBSS）','特種作戰支援（SOU）'],
 h10s:['海域警戒（PG）','搜索救難（SAR）','海域警戒與搜索救難警戒待命（ALT PG/SAR）','垂直海上補給（VERTREP）','登船檢查支援（VBSS）','特種作戰支援（SOU）'],
 h08:['水面監視及制海（SSC）','反潛作戰（ASW）','水面監視與反潛警戒待命（ALT SSC/ASW）','登船檢查支援（VBSS）','特種作戰支援（SOU）'],
 uav06:['海域警戒（PG）']};

/* generic modules used by templates */
MODS.push(
 {id:'ar.aesa',br:'a',sl:'rad',n:'X 波段主動電子掃描陣列雷達（範本）',ty:'AESA',rr:90,tr:24,en:6,lpi:1,kg:230,pw:7,dy:2800000},
 {id:'sp.dg15',br:'s',sl:'pw',n:'1.5 MW 柴油發電機（潛艦呼吸管充電，範本）',ty:'dg',mw:1.5,sfc:0.22,kg:22000,dy:2500000}
);
MUN.push({id:'hwt',n:'重型魚雷（533 公釐）',t:'torp',kg:1600,rng:50,wh:290,dy:1600000,pl:'s'});

/* ---------- designs ----------
   mods [[module, count]]; zones (land) {zone: [[mat, mm, angle, gap], ...]} outer to inner; zalt alternative base armour; opts option groups whose choices add modules (mods),
   packages (pk) or switch the base armour (za); sel current choices; ammo per main-gun module; st aircraft stations [store, count] (null = empty) in the order of the airframe hardpoints;
   vls / lnch ship missile loads; wing carrier air wing [[design, count]]; fuel / jp5 tonnes; endur provisions (days); series [[name, hull number, year]]; lc learning-curve rate; canon official figures */
var DES=[
 {id:'xt03',br:'l',ty:'mbt',n:'「刑天」零三式主戰戰車',code:'OmAR.03',nat:'大商帝國',mk:'白雪貂綜工',yr:4003,
  desc:'四千零三年，白雪貂重工廠為改進舊式零六二式及七六式之諸般缺點，傾力研發「刑天」零三式主戰戰車，並於當年問世。該車著重提升防護力，故採用複合裝甲，車身重量隨之增至四十四噸。其車體與負重輪較舊式加長，負重輪數由五對增至六對，以承其重。然其搭載之柴油引擎功率極高，可輸出達一千一百零五匹馬力，雖車重遞增，機動性能反得提升，道路極速可達每小時七十二公里。主砲為白雪貂重工廠自行研發之「OmbtC.120.52」滑膛砲，口徑一百二十公釐，倍徑五十二，可發射東標通用之彈藥；車身另備二十公釐機砲，以應制敵輕甲與步兵單位之用。射控系統亦經改良，其精準度與射擊效率均有長足進步。',
  mods:[['ch.xt03',1],['eng.d1105',1],['tr.hm72',1],['fuel.xt03',1],['tu.xt03',1],['misc.xt03',1],['fcs.OStvQ00',1],['sec.OScan20',1],['sec.OShM95',2]],
  zones:{tf:[['rha',40,0],['xtc2',480,0],['rha',30,0]],hf:[['rha',25,66],['xtc2',150,66],['rha',25,66]],ts:[['rha',35,0],['xtc2',50,0]],hs:[['hha',6,0,450],['rha',30,0]],rr:[['rha',20,0]],tp:[['rha',19,0]],bt:[['rha',13,0]]},
  zalt:{lip:{tf:[['hha',40,0],['al2o3',50,0],['al7039',140,0]],hf:[['hha',30,65],['al2o3',20,65],['al7039',60,65]],ts:[['hha',30,0]],hs:[['hha',6,0,450],['rha',25,0]],rr:[['rha',20,0]],tp:[['rha',22,0]],bt:[['rha',16,0]]}},
  opts:[
   {k:'gun',n:'主砲',ch:[{v:'c120',n:'OmbtC.120.52（120 公釐）',mods:[['gun.c120',1]]},{v:'c105',n:'105 公釐 52 倍徑滑膛砲',mods:[['gun.c105',1]]}]},
   {k:'ld',n:'裝填',ch:[{v:'man',n:'裝填手（4 人組）'},{v:'al',n:'OStal.03 自動裝填機（3 人組）',mods:[['al.OStal03',1]]}]},
   {k:'osu',n:'OSU 系統升級包',ch:[{v:'',n:'無'},{v:'osu1',n:'OSU.i（4005 年）',pk:['osu1']},{v:'osu2',n:'OSU.ii（4010 年）',pk:['osu1','osu2']},{v:'osu3',n:'OSU.iii（4015 年）',pk:['osu1','osu2','osu3']}]},
   {k:'ea',n:'EA 額外套件',ch:[{v:'',n:'無'},{v:'ea4',n:'EA.iv 第四代',pk:['ea4']},{v:'ea5',n:'EA.v 第五代',pk:['ea5']},{v:'ea6',n:'EA.vi 第六代（尚未推出）',pk:['ea6']}]},
   {k:'lip',n:'主裝甲',ch:[{v:'',n:'標準複合裝甲'},{v:'lip',n:'OmAR.03Lip 輕量版裝甲',za:'lip'}]},
   {k:'otv',n:'電子戰',ch:[{v:'',n:'無'},{v:'otv',n:'Otvous「回聲」（尚未推出）',pk:['otv']}]}],
  sel:{gun:'c120',ld:'man',osu:'',ea:'',lip:'',otv:''},
  ammo:{'gun.c120':[['t120dm53',16],['t120m829a3',8],['t120heat',16]],'gun.c105':[['t105m833',32],['t105heat',16]]},
  qty:1200,lc:0.9,
  canon:{mass:[['基本型',{},44000],['OSU.i',{osu:'osu1'},46000],['OSU.ii',{osu:'osu2'},51600],['OSU.iii',{osu:'osu3'},54200],['EA.iv',{ea:'ea4'},50000],['EA.v',{ea:'ea5'},52300],['EA.vi',{ea:'ea6'},44600],
    ['OSU.iii＋EA.iv',{osu:'osu3',ea:'ea4'},60200],['OSU.iii＋EA.v',{osu:'osu3',ea:'ea5'},62500],['OSU.iii＋EA.vi',{osu:'osu3',ea:'ea6'},54800]],speed:72,range:600},
  protos:['OmARx.03.105AL（105 公釐滑膛砲，自動裝填機）','OmARx.03.120AL（120 公釐滑膛砲，自動裝填機）','OmARx.03.105（105 公釐滑膛砲）','OmARx.03.120（120 公釐滑膛砲）'],
  fcsName:'OStvQ.00（白雪貂光電）',alName:'OStal.03（三零三軍工研製廠）'},
 {id:'mbt125',br:'l',ty:'mbt',n:'125 公釐自動裝填主戰戰車（假想敵範本）',code:'—',nat:'',mk:'',yr:4000,desc:'三人車組、125 公釐自動裝填砲、重型爆炸反應裝甲；作為對戰模擬的假想敵。',
  mods:[['ch.lt',1],['eng.d1000',1],['tr.hm65',1],['fuel.xt03',1],['tu.xt03',1],['misc.xt03',1],['gun.c125',1],['al.gen',1],['fcs.ifv',1],['sec.OShM95',1],['kit.ea5',1]],
  zones:{tf:[['rha',60,0],['chob',420,0],['rha',40,0]],hf:[['rha',60,68],['chob',100,68],['rha',50,68]],ts:[['rha',70,0]],hs:[['hha',6,0,450],['rha',70,0]],rr:[['rha',40,0]],tp:[['rha',30,0]],bt:[['rha',20,0]]},
  ammo:{'gun.c125':[['t125m60',22],['t125m42',8],['kornet',4]]},qty:1000,lc:0.9},
 {id:'saa06',br:'l',ty:'spaa',n:'OSaAA.06「響箭」零六式履帶式裝甲野戰防空車',code:'OSaAA.06',nat:'大商帝國',mk:'騰日系統',yr:4006,
  desc:'騰日系統研製的履帶式裝甲野戰防空車，配備紅外制導「短箭六型」、主動雷達制導「響箭」與 OSa 47 公釐口徑機砲。底盤、重量與裝甲為依用途推估的預設值，可自行修改。',
  mods:[['ch.saa06',1],['eng.d1105',1],['tr.hm72',1],['fuel.saa',1],['tu.saa',1],['misc.xt03',1],['gun.c47',1],['msl.sota6',1],['msl.noi',1],['rad.saa_s',1],['rad.saa_t',1],['sen.eo',1],['fcs.OStvQ00',1],['c4i.kai1',1],['sec.OShM95',1]],
  zones:{tf:[['hha',25,0],['al7039',40,0]],hf:[['rha',45,60]],ts:[['hha',20,0]],hs:[['hha',6,0,400],['rha',25,0]],rr:[['rha',15,0]],tp:[['rha',15,0]],bt:[['rha',12,0]]},
  ammo:{'gun.c47':[['a47he',360],['a47fs',80]]},qty:300,lc:0.9},
 {id:'ifv',br:'l',ty:'ifv',n:'履帶步兵戰車（範本）',code:'—',nat:'',mk:'',yr:4005,desc:'30 公釐機砲、反坦克飛彈、載員 7 人。',
  mods:[['ch.ifv',1],['eng.d700',1],['tr.hm65',1],['fuel.700',1],['tu.small',1],['misc.pax',1],['gun.c30',1],['sec.mg762',1],['sec.atgm',1],['fcs.ifv',1]],
  zones:{tf:[['hha',20,0],['al7039',40,0]],hf:[['hha',12,0,300],['al7039',35,60]],ts:[['hha',15,0]],hs:[['hha',8,0,250],['al7039',30,0]],rr:[['al7039',25,0]],tp:[['al7039',20,0]],bt:[['al7039',15,0]]},
  ammo:{'gun.c30':[['a30api',300],['a30fs',200]]},qty:800,lc:0.9},
 {id:'lt',br:'l',ty:'lt',n:'輕型戰車（範本）',code:'—',nat:'',mk:'',yr:4005,desc:'105 公釐砲、自動裝填，可空運。',
  mods:[['ch.lt',1],['eng.d700',1],['tr.hm72',1],['fuel.700',1],['tu.small',1],['misc.xt03',1],['gun.c105',1],['al.gen',1],['fcs.OStvQ00',1],['sec.mg762',1]],
  zones:{tf:[['hha',30,0],['al2o3',30,0],['al7039',60,0]],hf:[['hha',30,60]],ts:[['hha',20,0]],hs:[['hha',6,0,400],['hha',15,0]],rr:[['rha',15,0]],tp:[['rha',12,0]],bt:[['rha',10,0]]},
  ammo:{'gun.c105':[['t105m833',24],['t105heat',12]]},qty:400,lc:0.9},
 {id:'spg',br:'l',ty:'spg',n:'155 公釐履帶自走砲（範本）',code:'—',nat:'',mk:'',yr:4005,desc:'52 倍徑榴彈砲、自動裝填，射程約 40 公里。',
  mods:[['ch.spg',1],['eng.d1000',1],['tr.hm65',1],['fuel.700',1],['tu.saa',1],['misc.xt03',1],['gun.h155',1],['al.gen',1],['fcs.basic',1],['sec.OShM95',1]],
  zones:{tf:[['rha',25,0]],hf:[['rha',30,55]],ts:[['rha',15,0]],hs:[['rha',15,0]],rr:[['rha',12,0]],tp:[['rha',12,0]],bt:[['rha',10,0]]},
  ammo:{'gun.h155':[['art155m795',40]]},qty:300,lc:0.9},
 {id:'w8',br:'l',ty:'wh',n:'8×8 輪式步兵戰車（範本）',code:'—',nat:'',mk:'',yr:4008,desc:'遙控武器站、載員 9 人，可公路長途機動。',
  mods:[['ch.w8',1],['eng.d700',1],['tr.wh',1],['fuel.400',1],['misc.pax',1],['rws.osu1',1],['fcs.ifv',1]],
  zones:{hf:[['hha',15,55],['al2o3',12,55]],hs:[['hha',12,0],['peud',6,0]],rr:[['hha',10,0]],tp:[['hha',8,0]],bt:[['hha',12,30]]},ammo:{},qty:600,lc:0.9},
 {id:'mrap',br:'l',ty:'mrap',n:'4×4 防地雷反伏擊車（範本）',code:'—',nat:'',mk:'',yr:4008,desc:'V 型底盤、遙控武器站、反遙控炸彈干擾。',
  mods:[['ch.w4',1],['eng.d450',1],['tr.wh',1],['fuel.400',1],['misc.pax',1],['rws.osu1',1],['ew.crew',1]],
  zones:{hf:[['hha',12,40]],hs:[['hha',10,0]],rr:[['hha',8,0]],tp:[['hha',6,0]],bt:[['hha',15,45]]},ammo:{},qty:1500,lc:0.9},

 {id:'uf10',br:'a',ty:'ftr',n:'OuUF.10「貓將軍」艦載多用途戰鬥機',code:'OuUF.10',nat:'大商帝國',mk:'騰日航太',yr:4010,
  desc:'騰日航太為大商帝國海軍設計的單座、雙發動機第四代艦載多用途戰鬥機，主要為推廣國產技術與外銷而開發，提供卓越的機動性、多用途作戰能力以及強大的電子戰支援；大量採用騰日集團轄下最新的內部系統與航電技術，是「澄波專案」現代化航母戰鬥群的核心。服役於大商帝國海軍新一代核動力航空母艦（艦載編號 OuUF.10M/N），並推廣至東標組織（OSa）成員國。',
  mods:[['af.uf10',1],['ae.oj1160',2],['ar.cateye',1],['ar.irst',1],['ar.eo',1],['ar.self',1],['ar.gun',1],['ar.l16',1]],
  st:[['sota6',1],['mida3',1],['tank1800',1],['mida3',1],['mida3',1],['tank1800',1],['mida3',1],['mida3',1],['tank1800',1],['mida3',1],['sota6',1]],
  miss:'uf10',qty:300,lc:0.85,canon:{mach:1.82,radius:1048,mtow:29500,span:14.2,len:18.5}},
 {id:'uf10s',br:'a',ty:'ftr',n:'OuUFx.10super「超級貓將軍」艦載多用途戰鬥機',code:'OuUFx.10super',nat:'大商帝國',mk:'騰日航太',yr:4014,
  desc:'「貓將軍」換裝「超級貓眼」X 波段主動電子掃描陣列雷達（AESA）的改良型。',
  mods:[['af.uf10',1],['ae.oj1160',2],['ar.scateye',1],['ar.irst',1],['ar.eo',1],['ar.self',1],['ar.gun',1],['ar.l16',1]],
  st:[['sota6',1],['mida3',1],['tank1800',1],['mida3',1],['mida3',1],['tank1800',1],['mida3',1],['mida3',1],['tank1800',1],['mida3',1],['sota6',1]],miss:'uf10',qty:200,lc:0.85},
 {id:'uf10e',br:'a',ty:'ew',n:'OcUFe.10「金華貓」艦載電子戰機',code:'OcUFe.10',nat:'大商帝國',mk:'騰日航太',yr:4012,
  desc:'單座電子戰專用型號。移除部分武器掛載（含機砲），以換取額外的電子戰設備空間；機身與機翼下方可掛載 OFew.10 型干擾莢艙，機首與機尾整合高靈敏度被動雷達接收器，主要任務是壓制敵方防空系統（SEAD）。',
  mods:[['af.uf10e',1],['ae.oj1160',2],['ar.cateye',1],['ar.prr',1],['ar.ew10',1],['ar.self',1],['ar.l16',1]],
  st:[null,['gui7',1],['tank1800',1],['ofew10',1],['mida3',1],['ofew10',1],['mida3',1],['ofew10',1],['tank1800',1],['gui7',1],null],miss:'uf10e',qty:60,lc:0.85},
 {id:'uf82',br:'a',ty:'ftr',n:'OcUF.82「飛貓」艦載多用途戰鬥機',code:'OcUF.82',nat:'大商帝國',mk:'騰日航太',yr:3982,
  desc:'「貓將軍」之前的艦載多用途戰鬥機。性能數據為依用途推估的預設值，可自行修改。',
  mods:[['af.uf82',1],['ae.oj900',2],['ar.mech',1],['ar.self',1],['ar.gun',1],['ar.l16',1]],
  st:[['sota5',1],['mida2',1],['tank1250',1],['mida2',1],['tank1250',1],['mida2',1],['tank1250',1],['mida2',1],['sota5',1]],miss:'uf82',qty:250,lc:0.85},
 {id:'sr00',br:'a',ty:'aew',n:'OuSR.00「蔓金苔」艦載預警機',code:'OuSR.00',nat:'大商帝國',mk:'騰日航太',yr:3998,desc:'艦載空中預警與空中攔截管制。性能數據為推估值。',
  mods:[['af.sr00',1],['ae.tp3800',2],['ar.aew',1],['ar.aewc4',1],['ar.self',1],['ar.l16',1]],st:[],miss:'sr00',qty:40,lc:0.85},
 {id:'asw11',br:'a',ty:'asw',n:'OuASW.11「海東青」反潛巡邏機',code:'OuASW.11',nat:'大商帝國',mk:'騰日航太',yr:4011,desc:'艦載反潛與水面監視。性能數據為推估值。',
  mods:[['af.asw11',1],['ae.tf41',2],['ar.sea',1],['ar.asw',1],['ar.eo',1],['ar.self',1],['ar.l16',1]],st:[['ocaxe',1],['ocaxe',1],['lwt',1],['lwt',1],['lwt',1],['lwt',1]],miss:'asw11',qty:40,lc:0.85},
 {id:'cr00',br:'a',ty:'cod',n:'OuCR.00「海鯤」艦載運輸機',code:'OuCR.00',nat:'大商帝國',mk:'騰日航太',yr:3996,desc:'艦載後勤與人員運輸，貨物 4.5 噸或 26 名乘客。性能數據為推估值。',
  mods:[['af.cr00',1],['ae.tp3800',2],['ar.cargo',1],['ar.l16',1]],st:[],miss:'cr00',qty:30,lc:0.85},
 {id:'h14',br:'a',ty:'helo',n:'Ot.14Nsou「海木客鳥」特種行動／救援行動直升機',code:'Ot.14Nsou',nat:'大商帝國',mk:'',yr:4014,desc:'性能數據為推估值。',
  mods:[['af.h14',1],['ae.ts1410',2],['ar.hoist',1],['ar.eo',1],['ar.self',1]],st:[['metshow_he',1],['metshow_he',1]],miss:'h14',qty:120,lc:0.88},
 {id:'h10s',br:'a',ty:'helo',n:'Ot.10s「海燕」十式通用直升機',code:'Ot.10s',nat:'大商帝國',mk:'',yr:4010,desc:'性能數據為推估值。',
  mods:[['af.h10s',1],['ae.ts1410',2],['ar.hoist',1],['ar.self',1]],st:[null,null,null,null],miss:'h10s',qty:200,lc:0.88},
 {id:'h08',br:'a',ty:'helo',n:'Oe.08oah「海雕」零八式重型反潛直升機',code:'Oe.08oah',nat:'大商帝國',mk:'',yr:4008,desc:'性能數據為推估值。',
  mods:[['af.h08',1],['ae.ts1600',3],['ar.dip',1],['ar.sea',1],['ar.self',1]],st:[['lwt',1],['lwt',1],['lwt',1],['lwt',1]],miss:'h08',qty:120,lc:0.88},
 {id:'uav06',br:'a',ty:'uav',n:'Oecu/N.06「水鬼」零六式無人偵察機',code:'Oecu/N.06',nat:'大商帝國',mk:'',yr:4006,desc:'艦載垂直起降無人偵察機。性能數據為推估值。',
  mods:[['af.uav06',1],['ae.ts485',1],['ar.uaveo',1]],st:[],miss:'uav06',qty:150,lc:0.88},
 {id:'lf',br:'a',ty:'ftr',n:'單發輕型戰鬥機（範本）',code:'—',nat:'',mk:'',yr:4005,desc:'',
  mods:[['af.lf',1],['ae.f130',1],['ar.aesa',1],['ar.self',1],['ar.gun',1],['ar.l16',1]],st:[['sota6',1],['mida3',1],['falroc',1],['tank1250',1],['tank1250',1],['tank1250',1],['falroc',1],['mida3',1],['sota6',1]],qty:400,lc:0.85},
 {id:'st5',br:'a',ty:'ftr',n:'第五代匿蹤艦載戰鬥機（範本）',code:'—',nat:'',mk:'',yr:4018,desc:'彈艙內掛時雷達截面積極小；外掛會大幅增加。',
  mods:[['af.st5',1],['ae.f191',1],['ar.aesa',1],['ar.eo',1],['ar.self',1],['ar.l16',1]],st:[['mida3',1],['rolroc',4],['rolroc',4],['mida3',1],null,null,null,null],qty:200,lc:0.85},
 {id:'bmb',br:'a',ty:'bmb',n:'戰略轟炸機（範本）',code:'—',nat:'',mk:'',yr:4000,desc:'三個大型彈艙，可變後掠翼。',
  mods:[['af.bomb',1],['ae.f137',4],['ar.aesa',1],['ar.self',1],['ar.l16',1]],st:[['strigal500',24],['ghoshan',8],['strigal500',24]],qty:60,lc:0.85},
 {id:'trn',br:'a',ty:'trn',n:'戰術運輸機（範本）',code:'—',nat:'',mk:'',yr:4000,desc:'四發渦輪螺旋槳、19 噸貨物或 92 名人員。',
  mods:[['af.trn',1],['ae.tp3460',4],['ar.cargo',1],['ar.self',1]],st:[],qty:120,lc:0.85},
 {id:'ah',br:'a',ty:'ah',n:'攻擊直升機（範本）',code:'—',nat:'',mk:'',yr:4005,desc:'',
  mods:[['af.ah',1],['ae.ts1410',2],['ar.eo',1],['ar.self',1],['ar.gun',1]],st:[['downfall',1],['metshow_he',1],['metshow_he',1],['downfall',1]],qty:200,lc:0.88},

 {id:'cm0',br:'s',ty:'cg',n:'零型「時代」飛彈驅逐巡洋艦',code:'ISN (CM) 彈巡',nat:'大商帝國',mk:'',yr:4000,
  desc:'標準排水量 11,000 公噸、滿載 14,000 公噸；四台 OZKAU 燃氣輪機，全燃聯合（COGAG）113 百萬瓦。前後共 152 具 OVL.99 垂直發射單元（不一定滿載），六座九聯裝 OSL.00 飛彈架、「長喙」127 公釐艦砲與兩座八管 47 公釐近防艦砲。',
  mods:[['sh.cm0',1],['sp.ozkau',4],['sp.cogag',1],['sp.dg3',4],
   ['ss.hul00',1],['ss.asw00',1],['ss.vds01',1],['ss.mine01',1],
   ['sr.ews15',1],['sr.als05',1],['sr.kus02',1],['sr.kas03',1],['sr.fcr05',1],['sr.fcr09',1],['sr.ax15',1],['sr.gpf06',1],['sr.ews12',1],
   ['sc.cec05',1],['sc.ldl15',1],['sc.sat12',1],['sa.rov01',1],['sa.roc01',1],['sr.nav01',1],['sr.ciws01',1],['so.ciws01',1],['so.ocean01',1],['so.ir02',1],
   ['sw.ovl99',38],['sw.osl00',6],['sw.ocan99',1],['sw.ciws95',2],
   ['se.esm01',1],['se.ecm02',1],['se.rjz04',4],['se.inf01',4],['se.act',4],['se.el01',3],['se.bb01',1],['sv.hang2',1]],
  vls:[['Nghoshan',16],['bshid',16],['zijin12',32],['lona3',32],['lona2',40],['okwB',16]],lnch:[['ram12',36],['sota6',18]],
  wing:[['h10s',1],['h08',1]],fuel:1500,jp5:60,ballast:1440,endur:45,lc:0.924,
  series:[['時代',700,4000],['時間',701,4000],['時前',702,4000],['時進',703,4000],['時睦',705,4001],['時樂',706,4001],['時安',707,4001],['時平',708,4002],['時榮',709,4002],['時裕',710,4002],['時康',711,4003],['時江',712,4003],['時辰',713,4003],
   ['時定',715,4004],['時日',716,4004],['時祚',717,4004],['時順',718,4005],['時寧',719,4005],['時永',720,4005],['時繁',721,4006],['時泰',722,4006],['時元',723,4006],['時光',725,4007],['時陰',726,4007],['時息',727,4007],['時迅',728,4008],['時遇',729,4008],['時命',730,4008],['時先',731,4009],['時笛',732,4009],['時航',733,4009]],
  canon:{std:11000,full:14000,Loa:185,B:23,T:7,mw:113,kn:[30,37],range:9300,crew:385,cost:[1.0e9,1.48e9]}},
 {id:'cvn90',br:'s',ty:'cvn',n:'九十型「東洋」核動力航空母艦',code:'ISN (CVN) 核航',nat:'大商帝國',mk:'',yr:3995,
  desc:'滿載 100,000 公噸，兩座 OPWR/N2/REACT.91「海炬」壓水式核反應爐；四套「水弦」彈射系統、四套攔阻裝置、三座航空器升降機；完全滿載可搭載 80 架艦載戰鬥機。',
  mods:[['sh.cvn90',1],['sp.pwr91',2],['sp.tg8',8],
   ['sr.full12',1],['sr.ews15',1],['sr.als05',1],['sr.sur07',1],['sr.kus02',1],['sr.fcr05',1],['sr.fcr09',1],['sr.gpf06',1],['sr.ciws01',1],['sr.ews12',1],
   ['st.app01',1],['st.par02',1],['st.jpals03',1],['st.tacan01',1],['st.ols01',1],['st.iff01',1],['st.met01',1],
   ['sc.cec05',1],['sc.ldl15',1],['sc.sat12',1],['sc.ucom03',1],['sn.ins02',1],['sr.nav01',1],['so.ir02',1],['so.ciws01',1],['so.ocean01',1],['ss.hul00',1],['se.foxd',1],
   ['sv.cat',4],['sv.aag',4],['sv.jbd',6],['sv.elev',3],['sv.welev',4],['sv.tract',1],['sv.jp5',1],['sv.foam',1],['sv.mag',1],
   ['sw.osl00',4],['sw.ciws95',3],['sw.ovl99',4],
   ['se.esm01',1],['se.ecm02',1],['se.rjz04',6],['se.dec83',4],['se.inf01',4],['se.el01',3],['se.bb01',1],['se.hk01',1]],
  vls:[['lona3',8],['okwB',8]],lnch:[['ram12',27],['sota6',9]],
  wing:[['uf10',32],['uf82',16],['uf10e',6],['sr00',5],['asw11',4],['cr00',2],['h14',4],['h10s',6],['h08',6],['uav06',4]],fuel:300,jp5:8500,endur:90,lc:0.821,
  series:[['東洋',81,3995],['北洋',83,4000],['南洋',85,4006],['華霞',88,4011],['華旅',89,4015]],
  canon:{full:100000,Loa:362,B:79,T:12.7,kn:[30,37],crew:4000,cost:[3.04e9,4.8e9],wing:80}},
 {id:'dd',br:'s',ty:'dd',n:'飛彈驅逐艦（範本）',code:'—',nat:'',mk:'',yr:4005,desc:'96 單元垂直發射、區域防空與反潛。',
  mods:[['sh.dd',1],['sp.ozkau',3],['sp.cogag',1],['sp.dg3',3],['sr.ax15',1],['sr.fcr09',1],['sr.gpf06',1],['sr.nav01',1],['sr.ciws01',1],['ss.hul00',1],['ss.asw00',1],['sc.ldl15',1],['sc.sat12',1],
   ['sw.ovl99',24],['sw.ocan99',1],['sw.ciws95',1],['sw.osl00',1],['se.esm01',1],['se.ecm02',1],['se.rjz04',2],['sv.hang2',1]],
  vls:[['zijin12',16],['lona3',32],['lona2',24],['okwB',8],['bshid',8],['Nghoshan',8]],lnch:[['ram12',9]],wing:[['h08',1]],fuel:1500,jp5:40,endur:40,lc:0.92},
 {id:'ff',br:'s',ty:'ff',n:'巡防艦（範本）',code:'—',nat:'',mk:'',yr:4005,desc:'柴燃聯合動力、反潛為主。',
  mods:[['sh.ff',1],['sp.diesel8',2],['sp.ozkau',1],['sp.gear2',1],['sp.dg3',3],['sr.ax15',1],['sr.nav01',1],['sr.ciws01',1],['ss.hul00',1],['ss.asw00',1],['sc.ldl15',1],
   ['sw.ovl99',8],['sw.ocan99',1],['sw.ciws95',1],['sw.box4',2],['se.esm01',1],['se.rjz04',2],['sv.hang2',1]],
  vls:[['lona2',24],['okwB',8]],lnch:[['ocaxe',8]],wing:[['h08',1]],fuel:800,jp5:30,endur:35,lc:0.92},
 {id:'fs',br:'s',ty:'fs',n:'輕型護衛艦（範本）',code:'—',nat:'',mk:'',yr:4005,desc:'近岸巡邏與反艦。',
  mods:[['sh.fs',1],['sp.diesel8',2],['sp.dg3',2],['sr.gpf06',1],['sr.nav01',1],['sr.ciws01',1],['sw.box4',2],['sw.osl00',1],['sw.ciws95',1],['se.rjz04',2]],
  vls:[],lnch:[['ocaxe',8],['ram12',9]],wing:[],fuel:250,jp5:0,endur:20,lc:0.9},
 {id:'fac',br:'s',ty:'fac',n:'飛彈快艇（範本）',code:'—',nat:'',mk:'',yr:4005,desc:'',
  mods:[['sh.fac',1],['sp.diesel8',2],['sr.nav01',1],['sr.gpf06',1],['sw.box4',2]],vls:[],lnch:[['ocaxe',8]],wing:[],fuel:70,jp5:0,endur:7,lc:0.9},
 {id:'lhd',br:'s',ty:'lhd',n:'兩棲攻擊艦（範本）',code:'—',nat:'',mk:'',yr:4005,desc:'直升機與登陸艇運載陸戰部隊。',
  mods:[['sh.lhd',1],['sp.ozkau',2],['sp.gear2',1],['sp.dg3',4],['sr.ax15',1],['sr.full12',1],['sr.nav01',1],['st.app01',1],['st.tacan01',1],['sw.osl00',2],['sw.ciws95',2],['sv.elev',2],['sv.well',1],['sv.jp5',1],['sv.mag',1],['se.rjz04',4]],
  vls:[],lnch:[['ram12',18]],wing:[['h10s',12],['h08',6],['h14',6]],fuel:2500,jp5:1200,endur:45,lc:0.9,pax:1600},
 {id:'ssk',br:'s',ty:'ssk',n:'柴電潛艦（範本，絕氣推進）',code:'—',nat:'',mk:'',yr:4005,desc:'',
  mods:[['sh.ssk',1],['sp.dg15',2],['sp.batt',1],['sp.aip',1],['ss.flank',1],['ss.asw00',1],['sa.tt',1]],vls:[],lnch:[],tubes:[['hwt',12],['ocaxe',4]],wing:[],fuel:110,jp5:0,endur:50,lc:0.9}
];

var BR={l:'陸軍',a:'空軍',s:'海軍'};
var TYPES={l:{mbt:'主戰戰車',lt:'輕型戰車',ifv:'步兵戰車',wh:'輪式裝甲車',mrap:'防地雷反伏擊車',spg:'自走砲',spaa:'自走防空車'},
 a:{ftr:'戰鬥機',ew:'電子戰機',aew:'預警機',asw:'反潛巡邏機',cod:'艦載運輸機',trn:'運輸機',bmb:'轟炸機',helo:'直升機',ah:'攻擊直升機',uav:'無人機'},
 s:{cvn:'航空母艦',cg:'飛彈巡洋艦',dd:'驅逐艦',ff:'巡防艦',fs:'護衛艦',fac:'飛彈快艇',lhd:'兩棲攻擊艦',ssk:'潛艦'}};
var SLOT={ch:'底盤與車體',eng:'發動機',tr:'傳動',fuel:'燃料',gun:'主武器',al:'自動裝填',sec:'副武器',rws:'遙控武器站',msl:'飛彈發射器',fcs:'射控',sen:'觀測與感測',rad:'雷達',c4i:'指管通情',ew:'電子戰',aps:'主動防禦',kit:'裝甲套件',misc:'其他',
 af:'機體',aeng:'航空發動機',irst:'紅外搜索追蹤',eo:'光電',asw:'反潛',hull:'艦體',pw:'動力與電力',son:'聲納',vls:'垂直發射',lnch:'飛彈架',ciws:'近防武器',dec:'誘餌',av:'航空設施',atc:'航管與著艦',nav:'導航'};
var SLOTS={l:['ch','eng','tr','fuel','gun','al','sec','rws','msl','fcs','sen','rad','c4i','ew','aps','kit','misc'],a:['af','aeng','rad','irst','eo','ew','gun','c4i','asw','misc'],
 s:['hull','pw','son','rad','eo','c4i','nav','asw','ew','dec','vls','lnch','gun','ciws','av','atc','misc']};
var ZN={tf:'砲塔正面',hf:'車體正面',ts:'砲塔側面',hs:'車體側面',rr:'車尾',tp:'頂部',bt:'車底'};
var ZORD=['tf','hf','ts','hs','rr','tp','bt'];
var K={radEff:1.334,turnAlt:4500};
var STN={tip:'翼尖',wing:'翼下',wet:'翼下（可掛副油箱）',fus:'機身',ctr:'機腹中線',bay:'內彈艙',hbay:'大型彈艙',pyl:'掛架',esm:'電子支援莢艙（固定）'};

function ctxOf(c){c=c||{};return {mods:c.mods||MODS,mun:c.mun||MUN,pkg:c.pkg||PKG,des:c.des||DES,mats:c.mats||A.MATS,proj:c.proj||A.PROJ,rate:c.rate||2.5,env:c.env,cache:c.cache||{}};}
function find(list,id){for(var i=0;i<list.length;i++)if(list[i].id===id)return list[i];return null;}
function choice(d,g){var v=(d.sel||{})[g.k];if(v===undefined)v=g.ch[0].v;for(var i=0;i<g.ch.length;i++)if(g.ch[i].v===v)return g.ch[i];return g.ch[0];}

/* modules actually fitted: base list, option choices, upgrade packages and their balancing mass */
function effMods(d,c){var out=[],pk=[],za=null;
  (d.mods||[]).forEach(function(r){var m=find(c.mods,r[0]);if(m)out.push({m:m,n:r[1]===undefined?1:+r[1],src:''});});
  (d.opts||[]).forEach(function(g){var ch=choice(d,g);(ch.mods||[]).forEach(function(r){var m=find(c.mods,r[0]);if(m)out.push({m:m,n:r[1]||1,src:g.n});});
    (ch.pk||[]).forEach(function(p){if(pk.indexOf(p)<0)pk.push(p);});if(ch.za)za=ch.za;});
  pk.forEach(function(id){var P=find(c.pkg,id);if(!P)return;(P.mods||[]).forEach(function(r){var m=find(c.mods,r[0]);if(m)out.push({m:m,n:r[1]||1,src:P.n,pkg:id});});
    if(P.bal>0)out.push({m:{id:'bal.'+id,n:'安裝支架、線束與結構補強',sl:'misc',kg:P.bal,dy:Math.round(P.bal*25)},n:1,src:P.n,pkg:id,bal:1});});
  return {list:out,pk:pk,za:za};}

/* ---------- armour zones: intervals along each zone, each with its own layer stack ---------- */
function layObj(a){return {mat:a[0],t:+a[1]||0,ang:+a[2]||0,gap:+a[3]||0};}
function split(iv,x){var out=[];iv.forEach(function(I){if(x>I.a+1e-9&&x<I.b-1e-9){out.push({a:I.a,b:x,L:cl(I.L),k:I.k.slice()});out.push({a:x,b:I.b,L:cl(I.L),k:I.k.slice()});}else out.push(I);});return out;}
function effZones(d,em){var src=(em.za&&d.zalt&&d.zalt[em.za])?d.zalt[em.za]:(d.zones||{}),Z={};
  ZORD.forEach(function(z){if(src[z]&&src[z].length)Z[z]=[{a:0,b:1,L:src[z].map(layObj),k:[]}];});
  em.list.forEach(function(e){var m=e.m;if(m.sl!=='kit')return;
    (m.zs||[]).forEach(function(s){(Z[s[0]]||[]).forEach(function(I){I.L.forEach(function(l){if(l.mat===s[1])l.mat=s[2];});if(I.k.indexOf(m.n)<0)I.k.push(m.n);});});
    (m.za||[]).forEach(function(s){var z=s[0],a=s[1],b=s[2],add=s[3].map(layObj);if(!Z[z])return;var iv=split(split(Z[z],a),b);
      iv.forEach(function(I){if(I.a>=a-1e-9&&I.b<=b+1e-9){I.L=cl(add).concat(I.L);I.k.push(m.n);}});Z[z]=iv;});});
  return Z;}
function adOf(L,mats){var s=0;L.forEach(function(l){var M=A.mat(l.mat,mats);s+=M.rho*l.t/Math.max(0.1,Math.cos(Math.min(84,l.ang)*D2R));});return s;}
function usdOf(L,mats){var s=0;L.forEach(function(l){var M=A.mat(l.mat,mats);s+=M.rho*l.t/Math.max(0.1,Math.cos(Math.min(84,l.ang)*D2R))*(M.usd||1)*(M.fab||1);});return s;}

/* ---------- projectiles, threat classes and probabilities ---------- */
function scaledProj(P,gun){if(!gun||!P.Lref||P.guided)return P;var q=cl(P);q.v0=P.v0*Math.pow(gun.lc/P.Lref,0.2);q.id=P.id+'@'+gun.lc;return q;}
function thrCls(P){if(P.cls)return P.cls;if(P.k==='sc'&&P.g==='rkt')return 'rkt';return 'ke';}
function ceNeed(L,tan,c){var key='ce|'+(tan?1:0)+'|'+JSON.stringify(L);if(c.cache[key]!==undefined)return c.cache[key];
  var probe=function(x){var P={id:'_ce',k:'sc',g:'rkt',sc:{cd:100,k:x/100,pr:4,so:3,tan:tan?1:0}};return A.stackSC(P,L,{lib:c.mats,noSlatStop:true}).perf;};
  var lo=1,hi=8000,r;if(probe(lo))r=0;else if(!probe(hi))r=Infinity;else{for(var i=0;i<40;i++){var m=(lo+hi)/2;if(probe(m))hi=m;else lo=m;if(hi-lo<1)break;}r=hi;}
  c.cache[key]=r;return r;}
function v50Of(P,L,c){var key='v50|'+P.id+'|'+P.v0+'|'+JSON.stringify(L);if(c.cache[key]!==undefined)return c.cache[key];var v=A.v50Stack(P,L,{lib:c.mats,tol:2});c.cache[key]=v;return v;}
function slatOf(L,c){var p=0;L.forEach(function(l){var M=A.mat(l.mat,c.mats);if(M.era&&M.era.slat)p=Math.max(p,M.era.slat);});return p;}
function pPerfL(P,v,L,c){if(P.k==='sc'){var need=ceNeed(L,P.sc.tan,c),cap=A.scCapacity(P,0)*(P.mg&&P.mg.bo?1+0.5*P.mg.bo:1);if(!isFinite(need))return 0;
    var p=need<=0?1:A.ncdf((cap-need)/(0.07*need));if(P.rocket)p*=1-slatOf(L,c);return p;}
  if(P.k==='he'||P.k==='hesh'){var r=A.stackHE(P,L,{lib:c.mats});return r.perf?1:0;}
  var V50=v50Of(P,L,c);return A.pPerf(v,V50);}
/* RHA equivalent against the reference rod at the zone's V50; when no velocity perforates the zone, keMin is the rod's hydrodynamic limit */
function zoneEq(L,c,refKE){var V50=v50Of(refKE,L,c),ke=isFinite(V50)?A.perfLimit(refKE,V50,'rha',0,{lib:c.mats}):Infinity,keMin=ke;
  if(!isFinite(ke)){var key='plim|'+refKE.id+'|'+refKE.v0;keMin=c.cache[key]!==undefined?c.cache[key]:(c.cache[key]=A.perfLimit(refKE,40000,'rha',0,{lib:c.mats}));}
  return {ke:ke,keMin:keMin,ce:ceNeed(L,0,c),ceT:ceNeed(L,1,c),slat:slatOf(L,c)};}

/* ---------- land ---------- */
function vPow(m,Pw,cr,cda){var lo=0,hi=60;for(var i=0;i<50;i++){var v=(lo+hi)/2,F=m*G0*cr+0.5*1.225*cda*v*v;if(F*v<Pw)lo=v;else hi=v;}return lo;}
function hitP(sig,R,W,H,moving){var s=Math.max(1e-4,sig*R/1000*(moving?1.6:1));return erf(W/2/(s*Math.SQRT2))*erf(H/2/(s*Math.SQRT2));}
function mainAmmo(d,gun,glOK,c){if(!gun)return [];var list=((d.ammo||{})[gun.id]||[]).map(function(a){return [a[0],+a[1]||0];});
  if(!list.length)c.proj.forEach(function(P){if(Math.abs((P.d||0)-gun.cal)<0.6&&!P.rifled&&!P.gl&&(P.g==='tank'||P.g==='auto'||P.g==='art'))list.push([P.id,0]);});
  if(glOK){var gl=null;c.proj.forEach(function(P){if(P.gl&&Math.abs(P.d-gun.cal)<0.6)gl=P;});
    if(gl&&!list.some(function(a){return a[0]===gl.id;})){var k=-1;list.forEach(function(a,i){var P=find(c.proj,a[0]);if(P&&P.k==='sc'&&k<0)k=i;});if(k<0)k=list.length-1;var take=Math.min(4,k>=0?list[k][1]:0);if(k>=0)list[k][1]-=take;list.push([gl.id,take||4]);}}
  return list;}
function landCalc(d,c){c=ctxOf(c);var em=effMods(d,c),L=em.list,R={d:d,em:em,rows:[],warn:[],c:c};
  var ch=null,engs=[],tr=null,fuelL=0,gun=null,al=null,fcs=[],sens=[],c4i=[],ews=[],aps=[],secs=[],msls=[],rads=[],glOK=false,crewX=0,dy=0;
  L.forEach(function(e){var m=e.m,n=e.n,i;switch(m.sl){case 'ch':if(!ch)ch=m;break;case 'eng':for(i=0;i<n;i++)engs.push(m);break;case 'tr':if(!tr)tr=m;break;case 'fuel':fuelL+=(m.L||0)*n;break;
    case 'gun':if(!gun)gun=m;break;case 'al':if(!al)al=m;break;case 'fcs':fcs.push(m);break;case 'sen':sens.push(m);break;case 'c4i':c4i.push(m);break;case 'ew':ews.push(m);break;case 'aps':aps.push(m);break;
    case 'sec':case 'rws':secs.push({m:m,n:n});break;case 'msl':msls.push({m:m,n:n});break;case 'rad':rads.push(m);break;}
    if(m.gl)glOK=true;if(m.sl!=='al')crewX+=(m.crew||0)*n;dy+=(m.dy||0)*n;});
  if(!ch){R.err='缺少底盤／車體模組';return R;}
  R.ch=ch;R.gun=gun;R.al=al;R.aps=aps;R.ews=ews;R.rads=rads;R.msls=msls;R.secs=secs;
  var Z=effZones(d,em);R.zones=Z;
  /* mass budget */
  var rows=R.rows;L.forEach(function(e){var m=e.m;if(m.sl==='kit')return;var kg=(m.kg||0)*e.n+(m.sl==='fuel'?(m.L||0)*0.84*e.n:0);rows.push({n:m.n+(e.n>1?' ×'+e.n:''),kg:kg,cat:m.sl,src:e.src,st:m.st});});
  /* armour: base zones plus each kit's added layers */
  var area=ch.area||{},armKg=0,armUsd=0;R.zmass={};
  ZORD.forEach(function(z){if(!Z[z])return;var kg=0,usd=0;Z[z].forEach(function(I){kg+=(I.b-I.a)*(area[z]||0)*adOf(I.L,c.mats);usd+=(I.b-I.a)*(area[z]||0)*usdOf(I.L,c.mats);});R.zmass[z]=kg;armKg+=kg;armUsd+=usd;});
  var em0={list:L.filter(function(e){return e.m.sl!=='kit';}),za:em.za},Z0=effZones(d,em0),baseKg=0;ZORD.forEach(function(z){(Z0[z]||[]).forEach(function(I){baseKg+=(I.b-I.a)*(area[z]||0)*adOf(I.L,c.mats);});});
  rows.push({n:em.za?'主裝甲（'+em.za+' 輕量版）':'主裝甲（各區合計）',kg:baseKg,cat:'arm'});
  var prev=baseKg,acc=[];L.forEach(function(e){if(e.m.sl!=='kit')return;acc.push(e);var Zk=effZones(d,{list:em0.list.concat(acc),za:em.za}),kg=0;ZORD.forEach(function(z){(Zk[z]||[]).forEach(function(I){kg+=(I.b-I.a)*(area[z]||0)*adOf(I.L,c.mats);});});
    rows.push({n:e.m.n,kg:kg-prev,cat:'kit',src:e.src});prev=kg;});
  /* ammunition */
  var ammo=mainAmmo(d,gun,glOK,c),amKg=0,amDy=0,nRounds=0;R.ammo=ammo;
  ammo.forEach(function(a){var P=find(c.proj,a[0]);if(!P)return;amKg+=a[1]*A.roundMass(P)/1000;amDy+=a[1]*A.costOf(P,{lib:c.mats}).usd/c.rate;nRounds+=a[1];});
  if(gun&&nRounds>gun.stow+(al?0:0))R.warn.push('主砲彈藥 '+nRounds+' 發，超過 '+gun.stow+' 發的儲彈量');
  secs.forEach(function(s){var P=find(c.proj,s.m.am[0]);if(!P)return;var k=s.m.rd*s.n;amKg+=k*A.roundMass(P)/1000;amDy+=k*A.costOf(P,{lib:c.mats}).usd/c.rate;});
  msls.forEach(function(s){var n=s.m.rd*s.n;if(s.m.mu){var mu=find(c.mun,s.m.mu);if(mu){amKg+=n*mu.kg;amDy+=n*mu.dy;}}else if(s.m.am){var P=find(c.proj,s.m.am[0]);if(P){amKg+=n*A.roundMass(P)/1000;amDy+=n*A.costOf(P,{lib:c.mats}).usd/c.rate;}}});
  rows.push({n:'彈藥（主砲 '+nRounds+' 發與副武器）',kg:amKg,cat:'ammo'});
  var roles=(ch.roles||[]).slice();if(al&&al.rm){var ri=roles.indexOf(al.rm);if(ri>=0)roles.splice(ri,1);}var crew=Math.max(1,roles.length+crewX);R.roles=roles;R.crew=crew;R.pax=ch.pax||0;
  rows.push({n:'乘員 '+crew+' 人'+(R.pax?'＋載員 '+R.pax+' 人':'')+'（含個人裝備）',kg:(crew+R.pax)*95,cat:'crew'});
  var m=0;rows.forEach(function(r){m+=r.kg;});R.mass=m;R.armKg=armKg;
  /* mobility */
  var hp=0,eta=0;engs.forEach(function(e){hp+=e.hp;eta+=e.eta*e.hp;});eta=hp?eta/hp:0.35;var P=hp*745.7,eff=tr?tr.eff:0.65,gov=tr?tr.gov:60;
  R.hp=hp;R.ptw=hp/(m/1000);R.vRoadP=vPow(m,P*eff,ch.cr,ch.cda)*3.6;R.vRoad=Math.min(gov,R.vRoadP);R.vOff=Math.min(ch.vs,vPow(m,P*eff*0.85,ch.co,ch.cda)*3.6);
  R.gov=gov;R.acc=P>0?0.5*m*Math.pow(32/3.6,2)/(0.38*P)+1:Infinity;
  if(ch.kind==='tr'){R.ngp=m*G0/(2*ch.cl*ch.tw)/1000;R.mmp=1.26*m*G0/1000/(2*ch.nw*ch.tw*Math.sqrt(ch.pitch*ch.wd));}else{R.wheelT=m/ch.nw/1000;}
  var Lkm=P>0?((m*G0*ch.cr+0.5*1.225*ch.cda*11.1*11.1)*1000)/(eff*eta*35.8e6)*1.25:0,Lko=P>0?((m*G0*ch.co+0.5*1.225*ch.cda*6.9*6.9)*1000)/(eff*eta*35.8e6)*1.35:0;
  R.fuelL=fuelL;R.Lkm=Lkm;R.Lko=Lko;R.range=Lkm>0?fuelL/Lkm:0;R.rangeOff=Lko>0?fuelL/Lko:0;
  /* fire control */
  var sig=1,rt=12,th=0;fcs.forEach(function(f){sig=Math.min(sig,f.sig);rt=Math.min(rt,f.rt);th=Math.max(th,f.th||0);});if(!fcs.length){sig=0.6;rt=10;}
  var sa=0,saAdd=0;c4i.forEach(function(x){if(x.add)saAdd+=x.sa||0;else sa=Math.max(sa,x.sa||0);});sa+=saAdd;sens.forEach(function(s){rt+=s.rt||0;th=Math.max(th,s.th||0);});rt=Math.max(2.5,rt-0.3*sa);
  R.sig=sig;R.react=rt;R.thermal=th;R.sa=sa;R.rof=gun?(al?al.rof:gun.rof):0;
  var jam=0,ied=0;ews.forEach(function(x){jam=Math.max(jam,x.jam||0);ied=Math.max(ied,x.ied||0);});R.jam=jam;R.ied=ied;
  /* cost */
  R.costMod=dy;R.costArm=armUsd/c.rate;R.unit=(dy+R.costArm)*1.25;R.ammoCost=amDy;R.ammoKg=amKg;
  R.costKm=Lkm*0.4+R.unit*1.2e-5;R.costYear=R.unit*0.06;
  return R;}
function zoneArcOffset(z,arc){if(arc==='f')return (z==='ts'||z==='hs')?60:0;if(arc==='s')return (z==='tf'||z==='hf')?60:0;return 0;}
function apsP(aps,cls,arc){var best=0;aps.forEach(function(a){var cov=arc==='t'?!!a.top:arc==='s'?a.arc>=180:a.arc>=60;if(!cov)return;var p=cls==='rkt'?a.pR:cls==='atgm'?a.pM:a.pK;best=Math.max(best,p||0);});return best;}
function arcPerf(R,P,v,arc,c,shares){var Z=R.zones,sh=shares||(arc==='t'?{tp:1}:(R.ch.sh&&R.ch.sh[arc])||{}),pp=0,parts=[],wsum=0;
  Object.keys(sh).forEach(function(z){if(!Z[z])return;wsum+=sh[z];});
  Object.keys(sh).forEach(function(z){if(!Z[z])return;var off=zoneArcOffset(z,arc),pz=0;Z[z].forEach(function(I){var lay=I.L.map(function(l){return {mat:l.mat,t:l.t,ang:Math.min(80,l.ang+off),gap:l.gap};});pz+=(I.b-I.a)*pPerfL(P,v,lay,c);});
    var w=sh[z]/(wsum||1);pp+=w*pz;parts.push([z,w,pz]);});
  return {p:pp,parts:parts};}
function landSurv(R,threats,c){c=ctxOf(c);var out=[];
  threats.forEach(function(t){var P=find(c.proj,t[0]);if(!P)return;var v=A.velAt(P,t[1],c.env),cls=thrCls(P),arcs=P.ta?['t']:['f','s'],res={P:P,range:t[1],v:v,cls:cls,arcs:{}};
    arcs.forEach(function(arc){var ap=arcPerf(R,P,v,arc,c),pa=apsP(R.aps,cls,arc),jam=cls==='atgm'&&!P.ta?R.jam*0.5:0;res.arcs[arc]={pPerf:ap.p,pAps:pa,pJam:jam,pFinal:ap.p*(1-pa)*(1-jam),parts:ap.parts};});
    out.push(res);});
  return out;}
/* one-on-one gunnery duel between two land designs (frontal, both stationary unless flagged) */
function bestAmmo(R,targ,range,c){var best=null,bp=-1;(R.ammo||[]).forEach(function(a){var P0=find(c.proj,a[0]);if(!P0||a[1]<=0)return;var P=scaledProj(P0,R.gun),v=A.velAt(P,range,c.env);
    if(P.guided&&range>6500)return;var p=arcPerf(targ,P,v,'f',c).p;if(p>bp+1e-6){bp=p;best=P;}});return best;}
function duel(RA,RB,o,c){c=ctxOf(c);o=o||{};var R=o.range||2000,sides=[[RA,RB,o.aHD,o.aMov,o.ammoA],[RB,RA,o.bHD,o.bMov,o.ammoB]],info=[];
  sides.forEach(function(s,i){var X=s[0],Y=s[1],P=s[4]?scaledProj(find(c.proj,s[4]),X.gun):bestAmmo(X,Y,R,c);if(!P){info.push(null);return;}
    var v=A.velAt(P,R,c.env),tgtHD=sides[1-i][2],W=Y.ch.W||3.5,H=tgtHD?0.9:(Y.ch.H||2.4)*0.8,shares=tgtHD?{tf:0.85,ts:0.15}:null;
    var night=o.night&&X.thermal*1000<R,sig=X.sig*(night?1.6:1),react=X.react+(night?4:0)+(X.thermal*1000<R*0.9&&!o.day?2:0);
    var ph=P.guided?0.9:hitP(sig,R,W,H,s[3]),pp=arcPerf(Y,P,v,'f',c,shares).p,cls=thrCls(P),pa=apsP(Y.aps,cls,'f'),pk=ph*pp*(1-pa)*0.75;
    var rof=Math.max(1,X.rof),tFly=R/Math.max(150,v);info.push({P:P,v:v,ph:ph,pp:pp,pa:pa,pk:pk,react:react,cyc:60/rof+(P.guided?R/300:0),tFly:tFly});});
  if(!info[0]||!info[1])return {err:'有一方沒有可用的主砲彈藥'};
  var rnd=A.mb32(A.hstr('duel|'+R+'|'+(o.seed||''))),n=o.trials||4000,wA=0,wB=0,tw=0;
  for(var k=0;k<n;k++){var tA=info[0].react+rnd()*2,tB=info[1].react+rnd()*2,deadA=Infinity,deadB=Infinity;
    for(var s=0;s<40;s++){var next=Math.min(tA,tB);if(next>60||next>=Math.min(deadA,deadB))break;
      if(tA<=tB){if(tA<deadA&&rnd()<info[0].pk)deadB=Math.min(deadB,tA+info[0].tFly);tA+=info[0].cyc;}else{if(tB<deadB&&rnd()<info[1].pk)deadA=Math.min(deadA,tB+info[1].tFly);tB+=info[1].cyc;}}
    if(deadB<deadA){wA++;tw+=deadB;}else if(deadA<deadB){wB++;tw+=deadA;}}
  return {a:info[0],b:info[1],pA:wA/n,pB:wB/n,pNone:1-(wA+wB)/n,tMean:(wA+wB)?tw/(wA+wB):null};}

/* ---------- air ---------- */
function isa(h){var T,p;if(h<11000){T=288.15-0.0065*h;p=101325*Math.pow(T/288.15,5.25588);}else{T=216.65;p=22632*Math.exp(-(h-11000)/6341.6);}return {T:T,p:p,rho:p/(287.05*T),a:Math.sqrt(1.4*287.05*T)};}
function wave(M){if(M<0.8)return 1;if(M<1.05){var x=(M-0.8)/0.25;return 1+1.6*x*x;}if(M<1.2)return 2.6;return 2.6*Math.pow(1.2/M,0.7);}
function thr(e,M,h,wet){var r=isa(h).rho/1.225,s=h>11000?Math.pow(r/0.2971,0.9):1;if(wet&&e.wet>e.dry)return e.wet*1000*Math.pow(r,0.75)*s*(1+0.3*M-0.04*M*M);var f=Math.pow(r,0.8)*s*(1-0.1*Math.min(M,1));if(M>1)f*=Math.max(0.05,1-0.45*(M-1));return e.dry*1000*f;}
function stationOK(mu,stn){if(!mu)return true;var t=mu.t,kg=mu.kg;switch(stn){case 'tip':return t==='aam'&&kg<=120;case 'fus':return (t==='aam'||t==='pod')&&kg<=500;case 'wing':return t!=='tank'&&t!=='buddy'&&kg<=1150;
  case 'wet':return kg<=1700;case 'ctr':return kg<=1700;case 'bay':return t!=='tank'&&t!=='pod'&&t!=='buddy'&&kg<=1100;case 'hbay':return t!=='tank'&&t!=='pod'&&t!=='buddy';case 'pyl':return kg<=700&&t!=='tank';default:return false;}}
function airCalc(d,c,o){c=ctxOf(c);o=o||{};var em=effMods(d,c),L=em.list,R={d:d,em:em,rows:[],warn:[],c:c},af=null,engs=[],rads=[],irst=[],eos=[],ews=[],guns=[],dy=0;
  L.forEach(function(e){var m=e.m,i;if(m.sl==='af'&&!af)af=m;if(m.sl==='aeng')for(i=0;i<e.n;i++)engs.push(m);if(m.sl==='rad')rads.push(m);if(m.sl==='irst')irst.push(m);if(m.sl==='eo')eos.push(m);if(m.sl==='ew')ews.push(m);if(m.sl==='gun')guns.push(m);
    dy+=(m.dy||0)*e.n;R.rows.push({n:m.n+(e.n>1?' ×'+e.n:''),kg:(m.kg||0)*e.n,cat:m.sl});});
  if(!af){R.err='缺少機體模組';return R;}R.af=af;R.engs=engs;
  var stn=af.hp?af.hp.split(','):[],st=d.st||[],stores=[],stKg=0,tankFuel=0,storeF=0,storeRcs=0,storeDy=0,jamPod=0,expend=0,aamKg=0;
  stn.forEach(function(s,i){var e=st[i];if(!e||!e[0])return;var mu=find(c.mun,e[0]);if(!mu)return;var n=Math.max(1,+e[1]||1),okS=stationOK(mu,s);
    if(!okS)R.warn.push((i+1)+' 號掛點（'+(STN[s]||s)+'）不適合掛載'+mu.n);
    var pyl=(s==='bay'||s==='hbay'||s==='tip'||s==='esm')?0:45,kg=mu.kg*n+pyl;stKg+=kg;if(mu.fuel)tankFuel+=mu.fuel*n;
    if(s!=='bay'&&s!=='hbay'){storeF+=(mu.f||0.05)*Math.sqrt(n);storeRcs+=(mu.rcs||0.1)*n;}
    if(mu.t!=='tank'&&mu.t!=='pod'&&mu.t!=='buddy')storeDy+=mu.dy*n;if(mu.jam)jamPod=1-(1-jamPod)*(1-mu.jam);
    if(mu.t!=='aam'&&mu.t!=='tank'&&mu.t!=='pod'&&mu.t!=='buddy')expend+=mu.kg*n;if(mu.t==='aam')aamKg+=mu.kg*n;
    stores.push({i:i,s:s,mu:mu,n:n,kg:kg});});
  var empty=0;R.rows.forEach(function(r){empty+=r.kg;});var gunAmmo=0;guns.forEach(function(g){var P=find(c.proj,g.am[0]);if(P)gunAmmo+=g.rd*A.roundMass(P)/1000;});
  var fuelInt=af.fuel*(o.fuelFrac===undefined?1:o.fuelFrac),crewKg=(af.crew||0)*100,W0=empty+crewKg+gunAmmo+fuelInt+stKg;
  R.empty=empty;R.W0=W0;R.fuelInt=fuelInt;R.fuelTot=fuelInt+tankFuel;R.stKg=stKg;R.stores=stores;R.stn=stn;R.gunAmmo=gunAmmo;
  if(W0>af.mtow*1.001)R.warn.push('起飛重量 '+Math.round(W0)+' kg 超過最大起飛重量 '+af.mtow+' kg');
  R.rows.push({n:'燃油（機內）',kg:fuelInt,cat:'fuel'},{n:'外掛（含副油箱與掛架）',kg:stKg,cat:'st'},{n:'機砲彈藥',kg:gunAmmo,cat:'ammo'},{n:'乘員 '+(af.crew||0)+' 人',kg:crewKg,cat:'crew'});
  var jam=jamPod;ews.forEach(function(e){if(e.jam)jam=1-(1-jam)*(1-e.jam);});R.jam=jam;R.esm=0;ews.forEach(function(e){R.esm=Math.max(R.esm,e.esm||0);});
  R.rcs=(af.rcs||1)+storeRcs;R.radar=rads[0]||null;R.irst=irst[0]||null;R.eo=eos[0]||null;R.guns=guns;
  R.unit=dy*1.12;R.sortieCost=storeDy;
  if(af.kind==='rot')return rotor(R,af,engs,c);if(af.kind==='prop')return prop(R,af,engs,c,o);
  /* jet */
  var S=af.S,AR=af.b*af.b/S,Kd=1/(PI*af.e*AR),cd0=af.cd0+storeF/S,Tdry=0,Twet=0,sfcD=0,sfcW=0;engs.forEach(function(e){Tdry+=e.dry;Twet+=e.wet;sfcD+=e.sfcD*e.dry;sfcW+=e.sfcW*e.wet;});sfcD/=Math.max(1,Tdry);sfcW/=Math.max(1,Twet);
  var E={dry:Tdry,wet:Twet};R.Tdry=Tdry;R.Twet=Twet;R.sfcD=sfcD;R.sfcW=sfcW;R.AR=AR;
  function drag(W,M,h,cd){var at=isa(h),V=M*at.a,q=0.5*at.rho*V*V,CL=W*G0/(q*S),Kx=Kd*(M>1?1+0.6*(M-1):1);return q*S*(cd0M(cd,M)+Kx*CL*CL);}
  function cd0M(cd,M){return (af.cd0)*wave(M)+(cd-af.cd0)*Math.max(1,wave(M)*1.2);}
  var Wc=W0-0.5*fuelInt-tankFuel-expend;R.Wc=Wc;R.twTO=Twet*1000/(W0*G0);R.twC=Twet*1000/(Wc*G0);R.wl=W0/S;R.wlC=Wc/S;
  function mmax(W,h,wet){var best=0;for(var M=0.3;M<=3.2;M+=0.01){if(thr(E,M,h,wet)>=drag(W,M,h,cd0))best=M;}return best;}
  var cdSave=cd0,Wclean=empty+crewKg+gunAmmo+0.5*af.fuel+aamKg*0;cd0=af.cd0;R.mThrustClean=mmax(Wclean,11000,true);R.mClean=Math.min(R.mThrustClean,af.mlim);R.mLimClean=R.mThrustClean>af.mlim?'進氣道與結構限制':'推力';cd0=cdSave;
  R.mThrust=mmax(Wc,11000,true);R.mMax=Math.min(R.mThrust,af.mlim);R.mLim=R.mThrust>af.mlim?'進氣道與結構限制':'推力不足（外掛阻力）';
  R.mSL=Math.min(mmax(Wc,0,true),1.2);R.superCruise=mmax(Wc,11000,false);
  var climb=0;for(var M2=0.3;M2<=1.2;M2+=0.02){var at=isa(0),V=M2*at.a,ps=(thr(E,M2,0,true)-drag(Wc,M2,0,cd0))*V/(Wc*G0);climb=Math.max(climb,ps);}R.climb=climb;
  var ceil=0;for(var h=0;h<=22000;h+=250){var best=-1;for(var M3=0.5;M3<=2.2;M3+=0.05){var a3=isa(h),V3=M3*a3.a,ps3=(thr(E,M3,h,true)-drag(Wc,M3,h,cd0))*V3/(Wc*G0);if(ps3>best)best=ps3;}if(best>=0.5)ceil=h;}R.ceil=ceil;
  var at4=isa(K.turnAlt),V4=0.9*at4.a,q4=0.5*at4.rho*V4*V4,T4=thr(E,0.9,K.turnAlt,true),cdx=T4/(q4*S)-cd0M(cd0,0.9);R.nSus=cdx>0?Math.min(af.gmax,q4*S/(Wc*G0)*Math.sqrt(cdx/Kd)):1;
  R.turn=R.nSus>1?G0*Math.sqrt(R.nSus*R.nSus-1)/V4/D2R:0;
  /* mission: Breguet integration with weight-dependent L/D */
  var effC=K.radEff;function burn(dist,W,h,M,cd){var w=W,n=24,ds=dist/n;for(var i=0;i<n;i++){var at=isa(h),V=M*at.a,D=drag(w,M,h,cd),flow=sfcD*(1+0.12*M)*effC*D/10/3600;w-=flow*ds/V;}return W-w;}
  var Fto=0.03*W0,Fcb=sfcW*thr(E,0.9,5000,true)/10*120/3600,Dl=drag(Wc,0.45,3000,cd0),Fres=0.05*R.fuelTot+sfcD*Dl/10*1200/3600,Fc=R.fuelTot-Fto-Fcb-Fres;R.alloc={to:Fto,cb:Fcb,res:Fres,cr:Fc};
  var prof=o.profile||'hhh';function legs(dist,W,out){var lo=prof==='lll'?dist:prof==='hlh'?Math.min(dist,150000):0,hi=dist-lo;return out?burn(hi,W,11000,0.85,cd0)+burn(lo,W-burn(hi,W,11000,0.85,cd0),300,0.7,cd0):(function(){var f1=burn(lo,W,300,0.7,cd0);return f1+burn(hi,W-f1,11000,0.85,cd0);})();}
  var cdBack=af.cd0+Math.max(0,storeF-0)/S*0.7;
  function need(dist){var W1=W0-Fto,fo=legs(dist,W1,true),W2=W1-fo-expend-Fcb,fb=(function(){var lo=prof==='lll'?dist:prof==='hlh'?Math.min(dist,150000):0,hi=dist-lo,f1=burn(lo,W2,300,0.7,cdBack);return f1+burn(hi,W2-f1,11000,0.85,cdBack);})();return fo+fb;}
  var lo=0,hi=2e7;if(Fc<=0)R.radius=0;else{for(var it=0;it<50;it++){var mid=(lo+hi)/2;if(need(mid)<=Fc)lo=mid;else hi=mid;}R.radius=lo/1000;}
  var lo2=0,hi2=4e7,Ff=R.fuelTot-Fto-Fres;for(var it2=0;it2<50;it2++){var m2=(lo2+hi2)/2;if(burn(m2,W0-Fto,11000,0.8,cd0)<=Ff)lo2=m2;else hi2=m2;}R.ferry=lo2/1000;
  var Wl=empty+crewKg+0.35*af.fuel+aamKg;R.vApp=1.15*Math.sqrt(2*Wl*G0/(1.225*S*af.clmax))*1.944;R.Wland=Wl;
  R.vCat=Math.max(0,1.1*Math.sqrt(2*W0*G0/(1.225*S*af.clmax*0.85))-15);R.eCat=0.5*W0*R.vCat*R.vCat/1e6;
  var Dc=drag((W0+Wc)/2,0.8,11000,cd0);R.flowCruise=sfcD*1.1*Dc/10;R.cpfh=R.flowCruise*0.35+R.unit*3.3e-4;
  return R;}
function prop(R,af,engs,c,o){var P=0,sfc=0;engs.forEach(function(e){P+=e.kw;sfc+=e.sfc*e.kw;});sfc/=Math.max(1,P);P*=1000;var S=af.S,AR=af.b*af.b/S,Kd=1/(PI*af.e*AR),cd0=af.cd0,eta=0.8,W0=R.W0;
  function D(W,V,h){var at=isa(h),q=0.5*at.rho*V*V,CL=W*G0/(q*S);return q*S*(cd0+Kd*CL*CL);}
  var vmax=0;for(var V=40;V<260;V+=1){var r=isa(6000).rho/1.225;if(eta*P*Math.pow(r,0.75)>=D(W0,V,6000)*V)vmax=V;}R.vmax=vmax*3.6;R.mMax=vmax/isa(6000).a;
  var cp=sfc/3.6e6,h=7500,at=isa(h),CLmd=Math.sqrt(cd0/Kd),LD=CLmd/(cd0+Kd*CLmd*CLmd);R.LD=LD;
  var Ff=R.fuelTot*0.9;R.ferry=eta/(G0*cp)*LD*0.866*Math.log(W0/(W0-Ff))/1000;R.radius=R.ferry*0.42;
  var CLe=Math.sqrt(3*cd0/Kd),Ve=Math.sqrt(2*W0*G0/(at.rho*S*CLe)),LDe=CLe/(cd0+Kd*CLe*CLe),tr2=2*300000,ftr=W0*(1-Math.exp(-tr2*G0*cp/(eta*LDe*0.95))),Fs=Math.max(0,Ff-ftr);
  R.onStation=Fs>0?eta/(G0*cp*Ve)*LDe*Math.log((W0-ftr)/(W0-ftr-Fs))/3600:0;R.endur=eta/(G0*cp*Ve)*LDe*Math.log(W0/(W0-Ff))/3600;
  R.climb=(eta*P-D(W0,90,0)*90)/(W0*G0);R.ceil=0;for(var hh=0;hh<=12000;hh+=250){var rr=isa(hh).rho/1.225,best=-1;for(var V2=60;V2<220;V2+=5){var ps=(eta*P*Math.pow(rr,0.75)-D(W0,V2,hh)*V2)/(W0*G0);if(ps>best)best=ps;}if(best>=0.5)R.ceil=hh;}
  R.vApp=1.15*Math.sqrt(2*W0*0.85*G0/(1.225*S*af.clmax))*1.944;R.vCat=Math.max(0,1.1*Math.sqrt(2*W0*G0/(1.225*S*af.clmax*0.85))-15);R.eCat=0.5*W0*R.vCat*R.vCat/1e6;
  R.flowCruise=sfc*0.6*P/1000;R.cpfh=R.flowCruise*0.35+R.unit*2.2e-4;R.wl=W0/S;R.twTO=0;return R;}
function rotor(R,af,engs,c){var P=0,sfc=0;engs.forEach(function(e){P+=e.kw;sfc+=e.sfc*e.kw;});sfc/=Math.max(1,P);var Pin=P*1000*0.95,W=R.W0,Ar=PI*af.D*af.D/4,tip=af.tip||215,sol=af.sol||0.08,f=af.f||2;
  function pw(V,h){var rho=isa(h).rho,vh=Math.sqrt(W*G0/(2*rho*Ar)),vi=Math.sqrt(Math.max(0,-V*V/2+Math.sqrt(V*V*V*V/4+Math.pow(vh,4)))),mu=V/tip;
    return (1.15*W*G0*vi+sol*0.011/8*rho*Ar*Math.pow(tip,3)*(1+4.65*mu*mu)+0.5*rho*f*V*V*V)*1.1;}
  R.pHover=pw(0,0)/1000;var ceil=0;for(var h=0;h<=7000;h+=100){if(pw(0,h)<=Pin*Math.pow(isa(h).rho/1.225,0.85))ceil=h;}R.hoverCeil=ceil;
  var vmax=0;for(var V=10;V<=120;V+=0.5){if(pw(V,0)<=Pin*0.9)vmax=V;}R.vmax=Math.min(vmax*3.6,af.vne||330);
  var bestR=0,vR=0,minP=Infinity,vE=0;for(var V2=10;V2<=vmax;V2+=1){var p=pw(V2,1000);if(V2/p>bestR){bestR=V2/p;vR=V2;}if(p<minP){minP=p;vE=V2;}}
  var fuel=R.fuelTot*0.9;R.range=vR>0?fuel/(sfc*pw(vR,1000)/1000)*vR*3.6:0;R.endur=fuel/(sfc*minP/1000);R.vCruise=vR*3.6;R.radius=R.range*0.42;R.ferry=R.range;
  R.flowCruise=sfc*pw(vR||30,1000)/1000;R.cpfh=R.flowCruise*0.35+R.unit*4.5e-4;R.discLoad=W/Ar;R.twTO=0;return R;}

/* ---------- sea ---------- */
var CRT=[[0,0],[0.15,0.00025],[0.2,0.0004],[0.25,0.00065],[0.3,0.0012],[0.35,0.002],[0.4,0.0032],[0.45,0.004],[0.5,0.0042],[0.6,0.0036],[0.8,0.0028],[1.2,0.0018]];
function crOf(Fn){if(Fn<=0)return 0;for(var i=1;i<CRT.length;i++)if(Fn<=CRT[i][0]){var a=CRT[i-1],b=CRT[i];return a[1]+(b[1]-a[1])*(Fn-a[0])/(b[0]-a[0]);}return CRT[CRT.length-1][1];}
var MCREW={rad:4,son:3,c4i:6,eo:1,vls:0.5,lnch:2,gun:6,ciws:3,ew:3,dec:0.5,asw:4,av:8,atc:3,nav:1,misc:1};
function seaCalc(d,c,o){c=ctxOf(c);o=o||{};var em=effMods(d,c),L=em.list,R={d:d,em:em,rows:[],warn:[],c:c},hull=null,shaft=0,elec=0,gts=[],dgs=[],nuc=0,hotel=600,crew=0,dy=0;
  L.forEach(function(e){var m=e.m,n=e.n;if(m.sl==='hull'&&!hull)hull=m;dy+=(m.dy||0)*n;hotel+=(m.pw||0)*n;
    if(m.sl==='pw'){if(m.ty==='gt'||m.ty==='d'){shaft+=m.mw*n;for(var i=0;i<n;i++)gts.push(m);}if(m.ty==='nuc'){shaft+=m.mw*n;nuc+=n;}if(m.ty==='dg'||m.ty==='tg'){elec+=m.mw*n;for(var j=0;j<n;j++)dgs.push(m);}
      crew+=({gt:4,d:4,nuc:70,dg:2,tg:3,gear:10,aip:6,batt:2}[m.ty]||2)*n;}
    else if(m.sl!=='hull')crew+=(MCREW[m.sl]||1)*n*(m.cat?3:1);});
  if(!hull){R.err='缺少艦體模組';return R;}R.hull=hull;
  var Lwl=hull.Lwl,B=hull.Bwl,T=hull.T,Cb=hull.Cb,dDesign=1.025*Cb*Lwl*B*T;R.dDesign=dDesign;
  var struct=hull.k*hull.Loa*hull.B*hull.D;R.rows.push({n:hull.n+'（結構）',kg:struct*1000,cat:'hull'});
  L.forEach(function(e){if(e.m.sl==='hull')return;R.rows.push({n:e.m.n+(e.n>1?' ×'+e.n:''),kg:(e.m.kg||0)*e.n,cat:e.m.sl});});
  /* munitions */
  var cells=0,lcells=0,munKg=0,munDy=0,munList=[];L.forEach(function(e){if(e.m.sl==='vls')cells+=e.m.cells*e.n;if(e.m.sl==='lnch')lcells+=e.m.cells*e.n;});
  var vc=0;(d.vls||[]).forEach(function(v){var mu=find(c.mun,v[0]);if(!mu)return;vc+=v[1];munKg+=mu.kg*v[1];munDy+=mu.dy*v[1];munList.push({mu:mu,n:v[1],w:'vls'});});
  var lc=0;(d.lnch||[]).forEach(function(v){var mu=find(c.mun,v[0]);if(!mu)return;lc+=v[1];munKg+=mu.kg*v[1];munDy+=mu.dy*v[1];munList.push({mu:mu,n:v[1],w:'lnch'});});
  (d.tubes||[]).forEach(function(v){var mu=find(c.mun,v[0]);if(!mu)return;munKg+=mu.kg*v[1];munDy+=mu.dy*v[1];munList.push({mu:mu,n:v[1],w:'tube'});});
  if(vc>cells)R.warn.push('垂直發射單元裝填 '+vc+' 枚，超過 '+cells+' 具');if(lc>lcells)R.warn.push('飛彈架裝填 '+lc+' 枚，超過 '+lcells+' 具');
  L.forEach(function(e){if((e.m.sl==='gun'||e.m.sl==='ciws')&&e.m.am){var P=find(c.proj,e.m.am);if(P){munKg+=e.m.rd*e.n*A.roundMass(P)/1000;munDy+=e.m.rd*e.n*A.costOf(P,{lib:c.mats}).usd/c.rate;}}});
  R.cells=cells;R.vlsUsed=vc;R.lcells=lcells;R.lnchUsed=lc;R.munList=munList;R.munDy=munDy;
  /* air wing */
  var wingKg=0,wingDy=0,wingN=0,wingCrew=0,fixed=0,ftr=0,aewN=0,wingRows=[];(d.wing||[]).forEach(function(w){var ad=find(c.des,w[0]);if(!ad)return;var ac=airCalc(ad,c);if(ac.err)return;var n=+w[1]||0;
    wingKg+=n*(ac.empty+0.3*ac.af.fuel);wingDy+=n*ac.unit;wingN+=n;var rot=ac.af.kind==='rot';wingCrew+=n*(rot?(ac.af.crew?14:6):22);if(!rot){fixed+=n;if(ad.ty==='ftr'||ad.ty==='ew')ftr+=n;}if(ad.ty==='aew')aewN+=n;
    wingRows.push({d:ad,n:n,ac:ac});});
  R.wing=wingRows;R.wingN=wingN;R.wingDy=wingDy;R.ftr=ftr;R.aewN=aewN;
  crew+=hull.crew+wingCrew;R.crew=Math.round(crew);R.pax=d.pax||0;
  var prov=(R.crew+R.pax)*(d.endur||30)*0.006+(R.crew+R.pax)*0.05;
  var lt=0;R.rows.forEach(function(r){lt+=r.kg/1000;});R.light=lt;
  R.rows.push({n:'飛彈與彈藥',kg:munKg,cat:'mun'},{n:'艦載機（空重＋三成燃油）',kg:wingKg,cat:'wing'},{n:'乘員 '+R.crew+' 人'+(R.pax?'＋搭載部隊 '+R.pax+' 人':'')+'與個人物品',kg:(R.crew*0.2+R.pax*0.4)*1000,cat:'crew'},
    {n:'糧食與淡水（'+(d.endur||30)+' 日）',kg:prov*1000,cat:'prov'},{n:'燃油',kg:(d.fuel||0)*1000,cat:'fuel'},{n:'航空燃油（JP-5）',kg:(d.jp5||0)*1000,cat:'jp5'});
  if(d.ballast)R.rows.push({n:'液體壓艙與備用液體',kg:d.ballast*1000,cat:'bal'});
  var full=0;R.rows.forEach(function(r){full+=r.kg/1000;});
  if(hull.sub){var need=dDesign*0.88;if(full<need){R.rows.push({n:'固定壓艙（鉛）',kg:(need-full)*1000,cat:'bal'});full=need;}else R.warn.push('潛艦重量 '+Math.round(full)+' 噸超過水面排水量 '+Math.round(need)+' 噸，無法保持浮力');R.sub=dDesign;}
  R.full=full;R.std=full-(d.fuel||0)-(d.jp5||0)-(d.ballast||0);
  R.Tfull=hull.sub?T:T+(full-dDesign)/(1.025*0.78*Lwl*B);if(!hull.sub&&R.Tfull>T*1.12)R.warn.push('滿載吃水 '+R.Tfull.toFixed(1)+' m，比設計吃水深 '+((R.Tfull/T-1)*100).toFixed(0)+'%，艦體過載');
  /* resistance and speed */
  var dRatio=Math.pow(full/dDesign,2/3),S=Lwl*(1.7*R.Tfull+Cb*B)*1.0,etaD=hull.sub?0.72:0.68,nu=1.19e-6;R.Swet=S;
  function Rt(V,sea){var Rn=V*Lwl/nu,CF=0.075/Math.pow(Math.log(Rn)/Math.LN10-2,2);
    if(hull.sub){var Ss=0.8*PI*B*Lwl;return 0.5*1025*V*V*Ss*(CF*1.3+0.0007);}
    var Fn=V/Math.sqrt(G0*Lwl),CR=crOf(Fn)*(hull.fx||1)*Math.pow(Cb/0.48,1.5)*dRatio;return 0.5*1025*V*V*S*(CF*1.2+CR+0.0004)*1.08*(1+(sea||0));}
  function Ps(V,sea){return Rt(V,sea)*V/etaD/1e6;}
  function vmax(MW,sea){var lo=0,hi=30;for(var i=0;i<50;i++){var m=(lo+hi)/2;if(Ps(m,sea)<=MW)lo=m;else hi=m;}return lo/0.5144;}
  var sub=!!hull.sub,battMW=0;L.forEach(function(e){if(e.m.ty==='batt')battMW+=e.m.mw*e.n;});
  var MW=sub?battMW:shaft;R.shaft=shaft;R.elec=elec;R.hotel=hotel+1400+R.crew*1.5;
  R.vCalm=vmax(MW,0);R.vSS4=vmax(MW,0.15)*0.97;R.vSS6=Math.min(vmax(MW,0.45),Math.sqrt(G0*Lwl)*0.42/0.5144)*0.93;R.Ps=Ps;R.Fn=R.vCalm*0.5144/Math.sqrt(G0*Lwl);
  /* range at cruise */
  var vc2=o.cruise||18;R.vCruise=vc2;var Pp=Ps(vc2*0.5144,0.15)*1000,Ph=R.hotel,flow;
  if(nuc){R.range=Infinity;flow=dgs.length?Ph*0.21*0.1:0;}
  else if(sub){R.range=null;flow=0;}
  else{var best=Infinity;for(var nOn=1;nOn<=gts.length;nOn++){var cap=0,sf=0;for(var k=0;k<nOn;k++){cap+=gts[k].mw*1000;sf+=gts[k].sfc;}sf/=nOn;if(cap<Pp)continue;var load=Pp/cap,f=Pp*sf*(1+1.6*Math.pow(1-load,2));if(f<best)best=f;}
    if(!isFinite(best))best=Pp*0.3;var fh=dgs.length?Ph*0.23:Ph*0.33;flow=best+fh;R.range=(d.fuel||0)*1000*0.9/flow*vc2*1.852;}
  R.flow=flow;R.endur=d.endur||30;R.rangeAt=function(kn){var r=seaCalc(d,c,{cruise:kn});return r.range;};
  if(sub){var mwh=0;L.forEach(function(e){if(e.m.ty==='batt')mwh+=(e.m.mwh||0)*e.n;});var p4=Ps(4*0.5144,0)+0.12;R.battHrs=mwh/p4;R.aip=L.some(function(e){return e.m.ty==='aip';});R.aipDays=R.aip?14:0;R.snorkel=(d.fuel||0)*1000*0.9/(((Ps(8*0.5144,0)+0.3)*1000)*0.23)*8*1.852;}
  /* cost */
  R.unit=dy;R.ammoCost=munDy;
  var lcR=d.lc||0.92,b=Math.log(lcR)/Math.LN2;R.lc=lcR;R.series=(d.series||[]).map(function(s,i){return {n:s[0],no:s[1],yr:s[2],cost:R.unit*Math.pow(i+1,b)};});
  R.costDay=(flow*24/1000)*300+R.crew*60+R.unit*4e-5;
  return R;}
/* ship air-defence against a salvo of anti-ship missiles (layered engagements, magazine and fire-channel limits, soft kill) */
var THREAT={sub:['亞音速掠海反艦飛彈',300,5,0.1,1],sup:['超音速掠海反艦飛彈',900,10,0.1,0.75],bal:['反艦彈道飛彈',2000,40000,0.5,0.45]};
function seaAD(R,o,c){c=ctxOf(c);o=o||{};var tk=THREAT[o.threat||'sub'],Vt=tk[1],ht=tk[2],rcs=tk[3],pkMul=tk[4],N=o.n||8,L=R.em.list,mast=R.hull.mast||25;
  var rSearch=0,ch=0,ill=0,cec=false,ciws=[],dec=0,jam=0;L.forEach(function(e){var m=e.m;if(m.sl==='rad'&&(m.role==='air'||m.role==='low'||m.role==='fc'||m.role==='ew'))rSearch=Math.max(rSearch,m.rr*Math.pow(rcs,0.25));
    if(m.ch)ch+=m.ch*e.n;if(m.ill)ill+=m.ill*e.n;if(m.cec)cec=true;if(m.sl==='ciws')for(var i=0;i<e.n;i++)ciws.push(m);if(m.dec)dec=1-(1-dec)*Math.pow(1-m.dec,e.n);if(m.jam)jam=1-(1-jam)*Math.pow(1-m.jam,e.n);});
  var hor=4.12*(Math.sqrt(mast)+Math.sqrt(ht)),aew=o.aew||R.aewN>0,det=o.threat==='bal'?Math.min(rSearch,2000):aew?Math.max(Math.min(rSearch,hor),300):Math.min(rSearch,hor);
  var inv={};R.munList.forEach(function(x){if(x.mu.t==='sam')inv[x.mu.id]=(inv[x.mu.id]||0)+x.n;});
  var left=N,log=[],used={};
  function layer(name,ids,rMin,channels,salvo,cycleAdd){var mis=ids.map(function(id){return find(c.mun,id);}).filter(function(m){return m&&inv[m.id]>0&&(o.threat!=='bal'||m.abm);});if(!mis.length||left<=1e-6)return;
    var m=mis[0],rS=Math.min(m.rng,det);if(!m.act&&o.threat!=='bal')rS=Math.min(rS,hor+(cec?5:0));if(rS<=rMin)return;
    var Vm=m.mach*340,tw=(rS-rMin)*1000/Vt,cyc=((rS+rMin)/2*1000)/(Vm+Vt)+(cycleAdd||2),eng=Math.max(1,Math.floor(channels*tw/cyc)),stock=0;mis.forEach(function(x){stock+=inv[x.id];});
    var shots=Math.min(eng,left,Math.floor(stock/salvo)),pk=Math.min(0.95,m.pk*pkMul*(1-0.0)),pkill=1-Math.pow(1-pk,salvo),kills=shots*pkill;
    var need=shots*salvo;mis.forEach(function(x){var t=Math.min(inv[x.id],need);inv[x.id]-=t;need-=t;used[x.id]=(used[x.id]||0)+t;});
    log.push({n:name,mis:m,rS:rS,win:tw,eng:eng,shots:shots,pk:pkill,kills:kills,left:left-kills});left-=kills;}
  var chans=Math.max(2,ch),sarh=Math.max(1,ill);
  layer('長程防空飛彈',['zijin12','lona3'],25,chans,2,3);layer('中程防空飛彈',['lona2','lona3','zijin12'],10,Math.min(chans,sarh*3),2,2);layer('近程防空飛彈',['ram12','sota6','sota5'],1.5,4,2,1);
  if(left>1e-6&&ciws.length){var cw=ciws[0],tw2=(cw.r-0.4)*1000/Vt,per=Math.max(1,Math.floor(tw2/cw.cyc))*ciws.length,shots=Math.min(per,left),pk=cw.pk*(o.threat==='sup'?0.6:o.threat==='bal'?0.15:1),kills=shots*pk;
    log.push({n:'近防艦砲',mis:null,rS:cw.r,win:tw2,eng:per,shots:shots,pk:pk,kills:kills,left:left-kills});left-=kills;}
  var soft=o.threat==='bal'?0.5*dec:1-(1-dec)*(1-jam*0.6);var hits=left*(1-soft)*0.9,hk=Math.max(1,0.6*Math.sqrt(R.full/1000));
  var samLeft=0;Object.keys(inv).forEach(function(k){samLeft+=inv[k];});
  return {threat:tk[0],N:N,det:det,hor:hor,aew:aew,log:log,leak:left,soft:soft,hits:hits,hitsToKill:hk,pDisable:1-A.ncdf((hk-hits)/Math.max(0.5,Math.sqrt(hits+0.25))),used:used,samLeft:samLeft};}
function seaADmax(R,o,c){var lo=1,hi=200,ok=function(n){var r=seaAD(R,{threat:o.threat,n:n,aew:o.aew},c);return r.hits<0.5;};if(!ok(1))return 0;while(ok(hi)&&hi<2000)hi*=2;for(var i=0;i<20;i++){var m=Math.floor((lo+hi)/2);if(ok(m))lo=m;else hi=m;if(hi-lo<=1)break;}return lo;}
function carrierOps(R){var cats=0,mj=0;R.em.list.forEach(function(e){if(e.m.cat){cats+=e.n;mj=Math.max(mj,e.m.mj||0);}});if(!cats)return null;
  var daily=Math.min(R.wingN*1.25,cats*32),surge=Math.min(R.wingN*2.2,cats*55);return {cats:cats,mj:mj,daily:daily,surge:surge};}

/* ---------- common ---------- */
function calc(d,c,o){return d.br==='l'?landCalc(d,c):d.br==='a'?airCalc(d,c,o):seaCalc(d,c,o);}
function seriesCost(unit,qty,lc){var b=Math.log(lc||0.9)/Math.LN2,s=0;for(var i=1;i<=qty;i++)s+=unit*Math.pow(i,b);return {first:unit,last:unit*Math.pow(qty,b),avg:qty?s/qty:0,total:s};}
function designation(d){if(d.id!=='xt03')return d.code;var s=d.sel||{};return 'OmAR.03'+(s.lip?'Lip':'')+'.'+(s.gun==='c105'?'105':'120')+(s.ld==='al'?'AL':'');}
/* weight each upgrade package must add to reach the official figure (computed once from the reference design) */
function balancePackages(d,c){c=ctxOf(c);c.pkg.forEach(function(p){p.bal=0;});var seq=[['osu',['osu1','osu2','osu3']],['ea',['ea4','ea5','ea6']]];
  seq.forEach(function(s){var key=s[0];s[1].forEach(function(id){var P=find(c.pkg,id);if(!P||!P.tgt)return;var dd=cl(d);dd.sel=cl(d.sel||{});
    var prev=dd.sel;var idx=s[1].indexOf(id),base=cl(prev);base[key]=key==='osu'?(idx>0?s[1][idx-1]:''):'';dd.sel=base;var m0=landCalc(dd,c).mass;dd.sel=cl(base);dd.sel[key]=id;var m1=landCalc(dd,c).mass;
    P.bal=Math.max(0,P.tgt-(m1-m0));});});}
window.LatoVehicleLib={MODS:MODS,MUN:MUN,PKG:PKG,DES:DES,MISS:MISS,BR:BR,TYPES:TYPES,SLOT:SLOT,SLOTS:SLOTS,ZN:ZN,ZORD:ZORD,STN:STN,THREAT:THREAT,K:K,
  ctxOf:ctxOf,find:find,choice:choice,effMods:effMods,effZones:effZones,adOf:adOf,landCalc:landCalc,landSurv:landSurv,zoneEq:zoneEq,arcPerf:arcPerf,duel:duel,bestAmmo:bestAmmo,scaledProj:scaledProj,thrCls:thrCls,hitP:hitP,
  airCalc:airCalc,stationOK:stationOK,isa:isa,seaCalc:seaCalc,seaAD:seaAD,seaADmax:seaADmax,carrierOps:carrierOps,calc:calc,seriesCost:seriesCost,designation:designation,balancePackages:balancePackages,erf:erf};
})();
/* ===== 化生放核魔運算：毒劑擴散與傷亡、核爆範圍、核彈頭重量與價格、魔法武器數值（與 LatoWarsim 作戰中的計算相同） ===== */
(function(){
"use strict";
var A=window.LatoArmoryLib;if(!A||A.WMD)return;
function clamp(v,a,b){return v<a?a:v>b?b:v;}
/* 毒劑：[名稱, 類別 c化學 b生物 r放射 m魔法, 年代, 毒性（每單位劑量）, 平民致死比例, 地面持久（小時）, 雲存續（分鐘）, 重於空氣, 面具防護, 防護服防護, 疾病, 顏色] */
var AGENTS={chl:['氯氣','c',1915,0.9,0.1,0,50,1,0.85,0.2,'','#c8d24a'],phos:['光氣','c',1916,1.2,0.22,0,50,1,0.9,0.2,'','#d9e8b0'],must:['芥子氣','c',1917,0.5,0.03,72,90,1,0.45,0.9,'','#b0893a'],
  sarin:['沙林（神經毒劑）','c',1950,2.2,0.55,3,35,0,0.75,0.6,'','#9b7fd1'],vx:['VX（持久性神經毒劑）','c',1960,2.6,0.6,240,45,0,0.4,0.92,'','#7a4fb5'],
  anth:['炭疽孢子','b',1940,0.6,0,700,90,0,0.95,0.6,'anth','#8a6e4b'],plag:['鼠疫菌','b',1940,0.5,0,0,60,0,0.85,0.4,'plag','#6e5a3a'],pox:['天花病毒','b',1940,0.4,0,0,60,0,0.75,0.3,'pox','#a0522d'],
  corpse:['疫屍（拋射）','b',0,0.3,0,24,25,0,0.3,0.1,'plag','#5b4636'],dirty:['放射性髒彈','r',1950,0.25,0.3,4000,120,0,0.5,0.3,'','#d81b60'],mias:['魔瘴','m',0,0.7,0.2,48,150,1,0.5,0.4,'mias','#6a1b9a']};
var CLASS={c:'化學',b:'生物',r:'放射性',m:'魔法'};
/* 疾病：[名稱, 未治療死亡率, 治療後死亡率, 病程（天）, 潛伏期（天）, 人傳人] */
var DISEASE={anth:['炭疽',0.45,0.12,7,2,0],plag:['鼠疫',0.6,0.1,7,3,1],pox:['天花',0.25,0.25,14,10,1],mias:['魔瘴熱',0.3,0.06,6,1,1]};
var VACCINE={pox:['天花疫苗',1798,7],plag:['鼠疫疫苗',1897,10],anth:['炭疽疫苗',1954,14],mias:['淨化祝福',0,1]};
/* 作用機制：[名稱, 傷亡中的死亡比例, 適用類別] */
var MECH={nerve:['神經性',0.6,'c'],blis:['糜爛性',0.08,'c'],choke:['窒息性',0.08,'c'],blood:['血液性（氰化物）',0.5,'c'],incap:['失能性',0.02,'c'],irr:['刺激性（催淚）',0.02,'c'],tox:['生物毒素',0.45,'c'],
  bact:['細菌',0,'b'],virus:['病毒',0,'b'],fung:['真菌',0,'b'],rad:['放射性粉塵',0.3,'r'],mias:['魔瘴',0.3,'m'],curse:['詛咒',0.3,'m']};
var MECHDEF={chl:'choke',phos:'choke',must:'blis',sarin:'nerve',vx:'nerve',anth:'bact',plag:'bact',pox:'virus',corpse:'bact',dirty:'rad',mias:'mias'};
/* 設計（物件）→ 毒劑列 */
function agentRow(d){if(Array.isArray(d))return d;var c=CLASS[d.c]?d.c:'c';return [String(d.n||'自訂毒劑'),c,+d.y||0,clamp(+d.k||0,0,8),clamp(+d.l||0,0,1),clamp(+d.p||0,0,9000),clamp(+d.life||60,5,600),d.h?1:0,clamp(+d.mk||0,0,1),clamp(+d.st||0,0,1),c==='b'||c==='m'&&d.dz&&d.dz.n?'x':'',d.col||'#8d6e63'];}
/* 擴散：每 2 分鐘的雲（下風距離、半徑、質量）；dose(x,y) 為該點的累積劑量（x 下風、y 側風，公尺） */
function plume(ag,ws,o){var a=agentRow(ag);o=o||{};var dt=120,x=0,r=o.r0||300,m=o.m0||1,F=[],life=a[6]*(o.rain&&a[1]!=='r'?0.5:1)*(o.hot&&a[5]>0?0.7:1)*(ws>8?0.6:1),v=ws*(a[7]?0.7:1);
  for(var i=0;i<400&&m>0.02;i++){x+=v*dt;var r0=r;r=Math.min(6000,r+(0.25+ws*0.05)*dt);m*=Math.exp(-dt/60/Math.max(5,life))*Math.pow(r0/r,0.5);F.push([x,r,m]);}
  return {F:F,dose:function(px,py){var s=0;for(var j=0;j<F.length;j++){var q=F[j],dx=px-q[0],d=Math.sqrt(dx*dx+py*py);if(d>q[1]*1.6)continue;s+=q[2]/Math.max(0.05,(q[1]/400)*(q[1]/400))*Math.exp(-2*(d/q[1])*(d/q[1]))*dt/60;}return s;}};}
/* 劑量 → 傷亡（化學、放射、魔法）或感染（生物）比例；P 為防護係數 */
function effect(ag,dose,P){var a=agentRow(ag),e=dose*(1-(P||0));return a[1]==='b'?1-Math.exp(-e*a[3]*0.15):1-Math.exp(-e*a[3]*0.06);}
function protect(ag,lv){var a=agentRow(ag);return lv==='mask'?a[8]:lv==='mopp'?1-(1-a[8])*(1-a[9]):0;}
/* 下風中線上效果超過門檻的最遠距離 */
function reach(ag,pl,P,th){var F=pl.F,X=F.length?F[F.length-1][0]+F[F.length-1][1]:0,best=0;for(var x=0;x<=X;x+=Math.max(25,X/400))if(effect(ag,pl.dose(x,0),P)>=th)best=x;return best;}
/* 核彈頭種類：[名稱, 爆風能量比例, 熱輻射比例, 瞬發輻射範圍倍數, 落塵倍數, 最早年代, 當量下限, 當量上限（千噸）] */
var NUKE={fis:['分裂彈',1,1,1,1,1945,0.01,700],boost:['增強分裂彈',1,1,1,0.7,1951,0.1,1000],th:['熱核彈（氫彈）',1,1,0.9,0.5,1952,50,100000],
  er:['強化輻射彈（中子彈）',0.5,0.5,1.5,0.3,1963,0.1,10],salt:['鹽彈（加強落塵）',1,1,1,3,1957,100,100000],clean:['乾淨彈（低落塵）',1,1,0.9,0.1,1956,50,50000]};
/* 依 OTA《核戰爭的影響》（1979）一百萬噸空爆換算的破壞範圍（公尺），依種類調整 */
function nukeZones(Y,burst,k){var c=Math.cbrt(Y/1000),b=burst==='surface'?0.8:1,K=NUKE[k]||NUKE.fis,f=Math.cbrt(K[1]);
  return {fb:900*c*f,r12:4300*c*b*f,r5:6900*c*b*f,r2:11900*c*b*f,r1:16000*c*b*f,th:750*Math.pow(Y,0.41)*b*Math.sqrt(K[2]),rad:1200*Math.pow(Y/15,0.19)*K[3],cr:burst==='surface'?250*c*f:0};}
/* 戰術計算：全毀、重創、輕傷、震撼半徑；中子輻射的致命範圍 */
function nukeTac(Y,k){var c=Math.cbrt(Math.max(0.01,Y))*Math.cbrt((NUKE[k]||NUKE.fis)[1]);return [400*c,1100*c,2200*c,3500*c];}
function nukeRadR(Y,k){return 1200*Math.pow(Math.max(0.01,Y)/15,0.19)*(NUKE[k]||NUKE.fis)[3];}
/* 重量（公斤）與單價（美元）估計：依年代的比威力；最高約 5.2 千噸／公斤（B41） */
function nukeKg(Y,y,k){var a=y<1948?1500:y<1953?600:y<1957?150:y<1962?63:y<1975?40:30;return Math.round(Math.max(k==='er'?40:23,a*Math.pow(Math.max(0.01,Y),0.4),Y/5.2));}
function nukeUsd(Y,k){return Math.round(2e6*Math.pow(Math.max(0.01,Y)/100,0.2)*(k==='er'?1.6:k==='salt'?1.3:k==='clean'?1.4:k==='th'?1.2:1));}
/* 投射工具：[名稱, 酬載上限（公斤）, 當量上限（千噸，0＝不限）, 最早年代] */
var CARRY=[['砲彈',120,1,1953],['火箭與戰術飛彈',1000,20,1953],['轟炸機與攻擊機',30000,0,1945],['洲際彈道飛彈',9000,0,1959],['潛射彈道飛彈',2800,0,1960],['核巡弋飛彈',500,0,1982]];
function carry(W,y){var K=NUKE[W.k]||NUKE.fis;return CARRY.map(function(c){var why=W.kg>c[1]?'太重':c[2]&&W.Y>c[2]?'當量超過':y&&y<c[3]?c[3]+' 年起':y&&y<K[5]?K[0]+' '+K[5]+' 年起':'';return {n:c[0],kg:c[1],Y:c[2],y:c[3],ok:!why,why:why};});}
/* 魔法：系別 [名稱, 附帶效果, 對人, 對裝甲, 穿甲, 壓制, 防空（每級威力）]；範圍 [名稱, 對人倍數, 對裝甲倍數, 壓制倍數, 精度, 施法者] */
var MAGS={fire:['火系','burn',1.3,0.35,4,2.2,0],ice:['冰系','slow',0.9,0.25,3,2,0],ltn:['雷系','stun',1,0.5,6,2.6,0.1],dark:['暗系（精神）','terror',0.7,0.1,2,3.2,0],
  holy:['光系（神聖）','smite',0.9,0.4,5,1.8,0.05],wind:['風系（衝擊）','knock',0.8,0.3,3,2.4,0.05],earth:['土系','quake',1,0.6,6,2,0],arc:['奧術','',1.1,0.8,8,1.6,0.05]};
var MAGA={one:['單體',0.7,1.5,1,1.1,1],burst:['小範圍',1,1,1.15,1,1],wide:['大範圍',1.5,0.6,1.3,0.9,3],rit:['儀式（間接）',1.8,0.8,1.4,0.8,6]};
var MAGFX={burn:'燃燒',slow:'冰凍減速',stun:'雷擊麻痺',terror:'恐懼',smite:'神聖（對魔物加倍）',knock:'衝擊（打亂隊形）',quake:'地裂（破壞工事）'};
/* 法術 → 武器數值（威力 1～10、射程公尺、每次施法的魔力 1～10）；與 LatoWarsim 的 magApply 相同 */
function spell(m){var S=MAGS[m.sch]||MAGS.arc,Ar=MAGA[m.area]||MAGA.burst,P=clamp(+m.pow||3,1,10),R=clamp(+m.rng||400,50,20000),M=clamp(+m.mana||3,1,10),q=P/3,rit=m.area==='rit';
  return {cat:'奇幻',pP:+(S[2]*q*Ar[1]).toFixed(3),pA:+(S[3]*q*Ar[2]).toFixed(3),pen:+Math.min(20,S[4]+P*0.8).toFixed(1),sup:+(S[5]*Ar[3]).toFixed(2),rE:rit?0:R,rM:rit?0:Math.round(R*2.5),ind:rit?R:0,acc:Ar[4],crew:Ar[5]*(P>=8?2:1),
    aa:+Math.min(1.5,S[6]*P).toFixed(2),nv:m.sch==='holy'?2:1,rpu:clamp(Math.round(300/(M*Math.sqrt(P))),3,200),kg:+(0.2*M).toFixed(2),usd:Math.round(60000*Math.pow(P,1.5)*(Ar[5]>1?1.5:1)),rusd:Math.round(400*M),fx:m.fx===undefined?S[1]:m.fx};}
A.WMD={AGENTS:AGENTS,CLASS:CLASS,DISEASE:DISEASE,VACCINE:VACCINE,MECH:MECH,MECHDEF:MECHDEF,agentRow:agentRow,plume:plume,effect:effect,protect:protect,reach:reach,
  NUKE:NUKE,nukeZones:nukeZones,nukeTac:nukeTac,nukeRadR:nukeRadR,nukeKg:nukeKg,nukeUsd:nukeUsd,CARRY:CARRY,carry:carry,MAGS:MAGS,MAGA:MAGA,MAGFX:MAGFX,spell:spell};
})();
