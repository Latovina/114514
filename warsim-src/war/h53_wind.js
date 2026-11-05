/* ===================== 風：各年代的戰場都有隨時間變化的風向風速（不只化學戰時）；煙幕順風漂移、逐漸散開 =====================
   風用自己的亂數（與化學戰共用 windStep），不影響其他系統的亂數序列。
   煙幕：每 5 分鐘順風漂移約風速的四分之一，半徑隨時間略增；風越大散得越快（持續時間縮短）。 */
(function(){var b=v8Step;v8Step=function(){b.apply(this,arguments);if(!G||!G.started||!G.env)return;if(!(typeof cbOn==='function'&&cbOn())&&G.step%60===5)windStep();if(G.step%10===4)smkDrift();};})();
function smkDrift(){var L=G.smk,E=G.env;if(!L||!L.length||E.wd===undefined)return;var dt=DT*10,v=(E.ws||0)*0.25*dt,dx=Math.cos(E.wd)*v,dy=Math.sin(E.wd)*v,MP=G.map;
  L.forEach(function(q){if(q.t1<=G.t)return;q.x=clamp(q.x+dx,0,MP.Wm);q.y=clamp(q.y+dy,0,MP.Hm);q.r=Math.min(q.r*1.04+10,2500);if((E.ws||0)>6)q.t1-=dt*0.25*Math.min(2,((E.ws||0)-6)/4);});}
/* 給畫面用：目前的風（未初始化時給出由種子決定的預設，不改動模擬狀態） */
function windNow(){var E=G&&G.env;if(E&&E.wd!==undefined)return {wd:E.wd,ws:E.ws||0};var r=mb32(hstr(((G&&G.set&&G.set.seed)||'')+'|wind'));return {wd:r()*2*PI,ws:2+r()*3};}
function beaufort(ws){var B=[[0.3,'無風'],[1.6,'軟風'],[3.4,'輕風'],[5.5,'微風'],[8,'和風'],[10.8,'清風'],[13.9,'強風'],[17.2,'疾風'],[20.8,'大風'],[24.5,'烈風'],[28.5,'狂風'],[32.7,'暴風'],[1e9,'颶風']];for(var i=0;i<B.length;i++)if(ws<B[i][0])return [i,B[i][1]];return [12,'颶風'];}
