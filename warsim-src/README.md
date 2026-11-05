# LatoWarsim 原始碼

`war/` 是作戰模擬的原始碼，`build.py` 依 `order.json` 的順序把它們串成：

- `../lato-warsim.html`（單機版）
- `../server/public/index.html`（聯機版用戶端）
- `../lato-warsim-editor.html` 與 `../server/public/editor.html`（編制與裝備編輯器）
- `../server/simcore.js`（聯機伺服器的模擬核心）

```
python3 build.py          # 建置全部輸出，並產生測試用的 test/bsim.js 與 test/*_hook.html
python3 build.py --check  # 只比對：重建結果是否和 repo 裡的輸出一樣
./run_tests.sh            # 建置後跑 test/ 裡的測試
```

## 檔案

- `order.json` 的 `order`：瀏覽器版的載入順序；標了 `"online": true` 的只放進聯機版。`server`：伺服器核心的檔案與順序；`server_tail`：伺服器核心最後附加的片段（存檔欄位登記、武器火力文字、匯出介面）。
- 引擎檔（伺服器也會載入）：`x_lal.js`（LatoArmory／LatoVehicle 運算庫）、`a_*`～`j_*`、`h*`、`u_scn.js`、`u2_scn5.js`。
- 介面檔：`e_world.js`、`t*.js`、`p*.js` 與有名稱的 `o*.js`、`n_orbat.js`、`w_wpn.js`、`x_laui.js` 等；`zz_demo.js` 是內建示範世界的地圖參數。
- `warsim.css`：附加在 LatoTools 共用樣式之後的樣式；共用樣式與地圖程式庫在建置時從 `../lato-terrain.html`、`../lato-globe.html` 取出。

所有檔案在同一個函式範圍內串接：後面的檔案可以包裝（重新指定）前面檔案的函式。

介面檔的 `t*.js`、`p*.js` 是 2026-11 從建置輸出還原時依段落標題切開的，名稱只是編號；內容與原始碼逐字相同（`python3 build.py --check` 可確認）。
