/* ===================== 目標區：每個目標點的範圍（半徑）可以調整；設定頁的「目標區範圍」倍率套用到所有目標 =====================
   範圍影響佔領（範圍內只有一方的地面部隊）、守住目標的增援點數、資源收集的安全距離與地圖上的目標圈。
   另可設定佔領所需時間（預設 10 分鐘）與「控制全部目標」結束條件需要守住的時間（預設 2 小時）。 */
function objRm(){var m=G&&G.set?+G.set.objRm:1;return m>0?m:1;}
/* 目標的實際範圍（公尺） */
function obR(o){return Math.max(50,(o&&+o.r>0?+o.r:800)*objRm());}
/* 設定單一目標的基本範圍（不含倍率），以 50 公尺為單位 */
function obSetR(o,r){if(!o)return;o.r=clamp(Math.round((+r||800)/50)*50,100,30000);}
function objCapT(){var m=G&&G.set?+G.set.objCap:0;return (m>0?m:10)*60;}
function objHoldT(){var h=G&&G.set?+G.set.objHold:0;return (h>0?h:2)*3600;}
