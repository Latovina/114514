/* ===================== 雜項：單一單位的男女比例（覆寫陣營與兵種的預設） ===================== */
/* u.femR：0～1；未設定時依陣營設定、兵種與年代 */
(function(){var b=femOf;femOf=function(u){if(u&&typeof u.femR==='number')return clamp(u.femR,0,1);return b(u);};})();
function femAuto(u){var r=u.femR;delete u.femR;var v=femOf(u);if(r!==undefined)u.femR=r;return v;}
/* 編制：轄下所有單位一起設定；undefined＝恢復自動 */
function femSet(u,v){(isLeaf(u)?[u]:leavesOf(u).concat([u])).forEach(function(x){if(v===undefined||v===null||v==='')delete x.femR;else x.femR=clamp(+v,0,1);});}
