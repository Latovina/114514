/* ===================== 鐵的紀律與政委：陣營可以採用「鐵的紀律」（不准後退、嚴懲逃兵與違紀），也可以為部隊或編制派駐政委。
   犯罪與逃亡大幅減少，部隊更不容易潰散、不會自行後撤或拒絕進攻、很少投降；代價是傷亡率飆升：在不利的態勢下也死守、反覆衝鋒，
   督戰隊向潰退的部隊開槍、就地處決逃兵也造成自己人的死亡。AI 指揮官在鐵的紀律下不敢下令撤退，改為就地死守 ===================== */
function ironSide(side){var S=SD(side);return !!(S&&S.pol&&S.pol.reg==='iron');}
function commOf(u){var c=u,n=0;while(c&&n++<24){if(c.comm)return c;c=c.p>=0?uById(c.p):null;}return null;}
function ironLv(u){return (ironSide(u.side)?1:0)+(commOf(u)?1:0);}
/* 潰散門檻：鐵的紀律 ×0.55、政委 ×0.7、兩者 ×0.4 */
function ironRt(u){var a=ironSide(u.side),c=!!commOf(u);return a&&c?0.4:a?0.55:c?0.7:1;}
/* 承受殺傷的倍數：鐵的紀律 ×1.2、政委 ×1.15、兩者 ×1.35 */
function ironCas(u){var a=ironSide(u.side),c=!!commOf(u);return a&&c?1.35:a?1.2:c?1.15:1;}
/* 軍紀基準：鐵的紀律 +15、政委 +10（犯罪、逃亡、抗命大幅減少） */
function ironDisB(u){return (ironSide(u.side)?15:0)+(commOf(u)?10:0);}
function ironDisSync(u){if(u.dis0===undefined)return;var w=ironDisB(u),o=u.disB||0;if(w!==o){u.dis0=clamp(u.dis0-o+w,5,99);u.dis=clamp((u.dis===undefined?u.dis0:u.dis)-o+w,0,100);u.disB=w;}}
KINDN.exec='軍紀處決與督戰';
(function(){var b=hit;hit=function(t,src,dm,dv,sup,kind){if(t&&dm>0&&kind!=='exec'&&kind!=='ff'&&kind!=='storm'&&isLeaf(t)){var m=ironCas(t);if(m!==1)dm*=m;}return b(t,src,dm,dv,sup,kind);};})();
/* 不拒絕進攻、不自行後撤、很少投降 */
(function(){var b=morDecide;morDecide=function(u,s,off,PF,uf,rt,shT){var o=u.ord;if(o&&o.k==='attack'&&!o.refused&&ironLv(u))o.refused=1;return b(u,s,off,PF,uf,rt,shT);};})();
(function(){var b=twdCheck;twdCheck=function(u,s,off,PF,uf,shT){if(ironSide(u.side))return false;if(commOf(u)&&rnd()<0.7)return false;return b(u,s,off,PF,uf,shT);};})();
(function(){var b=surrCheck;surrCheck=function(u,s,off,PF,rt,routing){var lv=ironLv(u);if(lv&&rnd()>(lv>=2?0.15:ironSide(u.side)?0.3:0.5))return false;return b(u,s,off,PF,rt,routing);};})();
/* AI 指揮官在鐵的紀律下不敢下令撤退或遲滯，改為就地死守（玩家的命令照常執行） */
(function(){var b=issue;issue=function(u,k,p){if(u&&ironSide(u.side)&&/^(withdraw|delay|twd)$/.test(k)&&typeof aiControls==='function'&&aiControls(u)){if(G.t-(u._ironL||-1e9)>3600){u._ironL=G.t;logE(u.side,'disc','鐵的紀律：'+uName(u)+'不准後退，改為就地死守',u.x,u.y,u.id);}return b(u,'holdfast',{x:u.x,y:u.y});}return b(u,k,p);};})();
/* 每 10 分鐘：同步軍紀基準；督戰隊向潰退的部隊開槍、強迫回到陣地；就地處決逃兵；政委重整潰兵、做思想工作 */
function ironStep(){G.units.forEach(function(u){if(!isLeaf(u)||!onMap(u)||ST(u).dom!=='land'||u.st==='lift')return;ironDisSync(u);var lv=ironLv(u);if(!lv)return;var s=ST(u),iron=ironSide(u.side),co=commOf(u),St=G.stats[u.side];
  if(u.ms==='rout'){if(iron&&rnd()<0.5){var n=Math.max(1,Math.round(u.men*(0.01+0.02*rnd())));hit(u,null,n,0,0,'exec');St.exe=(St.exe||0)+n;u.mor=clamp(u.mor+12,0,100);var ok=rnd()<0.6;if(ok)rallyDone(u,s);
      logE(u.side,'disc','督戰隊向潰退的'+uName(u)+'開槍，約 '+fmt(n)+' 人被擊斃'+(ok?'，部隊被迫回頭重新佈防':''),u.x,u.y,u.id);return;}
    if(co&&(u._ed||1e9)>1000&&rnd()<0.25){u.mor=clamp(u.mor+8,0,100);rallyDone(u,s);logE(u.side,'rally','政委收攏潰兵，'+uName(u)+'重新整隊',u.x,u.y,u.id);}return;}
  /* 動搖、傷亡慘重或軍紀鬆弛時，就地處決逃兵與「動搖分子」 */
  var p=0.03*lv*(u.ms==='shaken'?2:1)*((u.rcas||0)>0.1?1.5:1)*(u.dis<45?1.5:1)*(iron?1:0.5);if(rnd()<p){var n2=Math.max(1,Math.round(u.men*0.005*(1+rnd()*2)));hit(u,null,n2,0,0,'exec');St.exe=(St.exe||0)+n2;u.mor=clamp(u.mor+2,0,100);u.dis=clamp((u.dis||50)+3,0,100);
    logE(u.side,'disc',uName(u)+(co&&!iron?'的政委':'')+'以臨陣脫逃、動搖軍心為由就地處決 '+fmt(n2)+' 人',u.x,u.y,u.id);}
  /* 政委的思想工作：動搖的部隊士氣慢慢回升 */
  if(co&&u.ms==='shaken')u.mor=clamp(u.mor+1,0,100);});}
(function(){var b=v8Step;v8Step=function(){b();if(G.step%20===11)ironStep();};})();
