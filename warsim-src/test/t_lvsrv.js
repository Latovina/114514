/* 伺服器核心可以由設計重算型號：陸、空、海設計各取幾個 */
const S=require(process.env.BSRV||'./bsim.js');const E=S.E;
function ok(c,m){console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;}
(async()=>{await E('mpQuick')('s1985','lv-a');const G=S.getG();const LVL=E('LVL');
 ok(!!LVL&&!!E('LAL'),'the server core carries the LatoArmory/LatoVehicle library');
 const D=LVL.DES;const by={};D.forEach(d=>{(by[d.br]=by[d.br]||[]).push(d);});
 for(const br of ['l','a','s']){const L=by[br]||[];let n=0,bad=[];L.forEach(d=>{const m=E('vdModel')(d.id);if(m&&m.k)n++;else bad.push(d.id);});
  ok(n>0&&n>=L.length-1,br+': '+n+'/'+L.length+' designs turn into models on the server'+(bad.length?' (not: '+bad.join(',')+')':''));}
 const d=by.l[0],m=E('vdModel')(d.id);ok(m&&m.arm>0&&m.m&&E('wpnOf')(m.m[0])&&E('wpnOf')(m.m[0]).pen>0,'a land design has armour '+(m&&m.arm)+' and a main gun with penetration '+(m&&E('wpnOf')(m.m[0]).pen));
})();
