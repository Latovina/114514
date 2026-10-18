# LatoWarsim 作戰模擬：聯機伺服器架設說明

> **Debian 使用者請直接看 [`DEPLOY-DEBIAN.md`](DEPLOY-DEBIAN.md)**：一行指令 `bash install-debian.sh 你的網域` 就能完成安裝、HTTPS 與開機自動啟動。

這個資料夾就是完整的聯機版：一支 Node.js 伺服器加上玩家用瀏覽器開啟的網頁。
不需要安裝任何套件，也不需要資料庫。

| 檔案 | 用途 |
|---|---|
| `server.js` | 主程式：網頁、帳號、大廳、房間、聊天、回放 |
| `worker.js` | 每個房間一條模擬執行緒（伺服器權威、雙盲） |
| `simcore.js` | 模擬核心（由遊戲原始碼產生，請勿手動修改） |
| `public/index.html` | 玩家用的網頁（聯機版，也包含完整單機功能） |
| `public/editor.html` | 編制與裝備編輯器（網址 `/editor`）：設計單位類型、編制、武器、彈藥、裝甲與載具，匯出後到模擬器匯入 |
| `package.json` | 套件描述（沒有相依套件） |
| `data/` | 第一次啟動後自動建立：設定、帳號、房間存檔、回放、背景音樂（`bgm/`、`roombgm/`）、伺服器增援範本（`templates.json`）、玩家頭像（`avatars/`） |

單機版是另一個檔案 `lato-warsim.html`，直接用瀏覽器開啟即可，不需要伺服器。

---

## 一、需要什麼

- 一台 Linux VPS（以下以 Ubuntu 22.04／24.04 為例；Debian 也一樣）。
- 記憶體建議 2 GB 以上。每一場進行中的作戰大約佔 150–400 MB（地圖越大、部隊越多越多）。
- Node.js 18 以上，建議 20 或 22 LTS。
- 要讓別人連進來：VPS 的防火牆或雲端「安全群組」要開放對應的連接埠。

## 二、安裝 Node.js

```bash
# 用 NodeSource 安裝 Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v      # 應該顯示 v22.x.x
```

## 三、上傳檔案

收到的 `lato-warsim-server.zip` 解開後是 `lato-warsim-server` 資料夾。傳到 VPS 後放在 `/opt/lato-warsim`：

```bash
# 在你的電腦上執行；把 1.2.3.4 換成 VPS 的 IP
scp lato-warsim-server.zip root@1.2.3.4:/opt/

# 登入 VPS
ssh root@1.2.3.4
cd /opt
apt-get install -y unzip
unzip lato-warsim-server.zip
mv lato-warsim-server lato-warsim
```

用 WinSCP、FileZilla 之類的 SFTP 工具把解開的資料夾拖拉上傳也可以。

## 四、第一次啟動（測試）

```bash
cd /opt/lato-warsim
node server.js
```

看到 `已啟動：http://localhost:8080/` 就成功了。用瀏覽器開 `http://VPS的IP:8080/`：

1. 在「聯機」分頁 **註冊第一個帳號**。第一位註冊的人會自動成為管理員。
2. 建立房間，選一個「快速想定」，坐上席位，按「開始作戰」，確認畫面正常。

按 `Ctrl+C` 停止。停止時進行中的作戰會自動存檔，下次啟動會恢復。

> 連不上的話，先檢查防火牆：`sudo ufw allow 8080/tcp`，
> 雲端主機（AWS、GCP、Azure、Oracle 等）還要在控制台的「安全群組／防火牆規則」開放 8080。

## 五、設定檔 `data/config.json`

第一次啟動後自動產生，改完要重新啟動伺服器才會生效（管理員面板改的部分立即生效）：

| 設定 | 預設 | 說明 |
|---|---|---|
| `port` | 8080 | 伺服器的連接埠 |
| `host` | `0.0.0.0` | 聽取的位址；搭配反向代理時建議改成 `127.0.0.1` |
| `trustProxy` | false | 放在 Nginx／Caddy 後面時改成 `true`（才能正確辨識玩家 IP，用於登入次數限制） |
| `serverName` | — | 大廳顯示的伺服器名稱 |
| `motd` | — | 大廳公告 |
| `allowRegister` | true | 是否開放註冊 |
| `invite` | 空白 | 邀請碼；設定後註冊要輸入邀請碼 |
| `maxRooms` | 20 | 伺服器同時存在的房間數上限 |
| `maxRoomsPerUser` | 2 | 每位玩家最多可以開幾個房間（管理員不限） |
| `snapMs` | 500 | 戰場畫面更新間隔（毫秒）；網路差可以改成 800–1000 |
| `autosaveMin` | 5 | 進行中的作戰每幾分鐘自動存檔一次 |
| `replayKeep` | 200 | 最多保留幾份回放（超過時刪除最舊的） |
| `aiGraceSec` | 90 | 玩家斷線多少秒後由電腦暫代指揮 |
| `bgmMaxMB` | 20 | 每首背景音樂的大小上限（MB） |
| `bgmLibMax` | 300 | 伺服器曲庫最多幾首 |
| `bgmRoomMax` | 12 | 每個房間最多幾首房間曲目 |
| `tplMax` | 200 | 伺服器增援範本最多幾個 |
| `tplRoomMax` | 30 | 每個房間最多幾個房間增援範本 |
| `avatarKB` | 512 | 玩家頭像的大小上限（KB；網頁會先縮成 128×128 再上傳） |

也可以用環境變數或參數覆蓋：`PORT=9000 node server.js` 或 `node server.js --port 9000`。

## 六、讓伺服器一直執行（systemd）

建立服務檔 `/etc/systemd/system/lato-warsim.service`：

```ini
[Unit]
Description=LatoWarsim 聯機伺服器
After=network.target

[Service]
WorkingDirectory=/opt/lato-warsim
ExecStart=/usr/bin/node /opt/lato-warsim/server.js
Restart=always
RestartSec=5
User=www-data
Environment=NODE_ENV=production
# 停止時給伺服器時間存檔
TimeoutStopSec=20

[Install]
WantedBy=multi-user.target
```

```bash
sudo chown -R www-data:www-data /opt/lato-warsim       # 讓服務帳號可以寫入 data/
sudo systemctl daemon-reload
sudo systemctl enable --now lato-warsim                # 開機自動啟動並立即啟動
sudo systemctl status lato-warsim                      # 查看狀態
sudo journalctl -u lato-warsim -f                      # 即時查看紀錄（Ctrl+C 離開）
sudo systemctl restart lato-warsim                     # 重新啟動（作戰會先存檔）
```

## 七、網域與 HTTPS（建議）

有網域的話，建議放在反向代理後面，玩家用 `https://你的網域/` 連線。
先把網域的 A 紀錄指到 VPS 的 IP，然後二選一：

### 方法 A：Caddy（最簡單，自動申請 HTTPS 憑證）

```bash
sudo apt install -y caddy
```

`/etc/caddy/Caddyfile` 的內容：

```
war.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

```bash
sudo systemctl reload caddy
sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
```

### 方法 B：Nginx＋Certbot

`/etc/nginx/sites-available/lato-warsim`：

```nginx
server {
    listen 80;
    server_name war.example.com;
    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;     # WebSocket 必要
        proxy_set_header Connection "upgrade";      # WebSocket 必要
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 3600s;                   # 避免長時間作戰中被斷線
        proxy_send_timeout 3600s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/lato-warsim /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d war.example.com
```

兩種方法都要在 `data/config.json` 設定 `"host": "127.0.0.1"` 與 `"trustProxy": true`，
重新啟動伺服器；之後就不必再對外開放 8080（`sudo ufw delete allow 8080/tcp`）。

## 八、管理

- **管理員面板**：管理員登入後，大廳上方的「管理員面板」：開放／關閉註冊、邀請碼、公告、房間數上限、停用或恢復帳號、設為管理員、重設密碼（顯示新密碼給你轉交）、刪除帳號、關閉房間。
- **背景音樂**：管理員面板的「伺服器曲庫」可以上傳平靜、激戰、藍軍勝利、紅軍勝利、藍軍戰敗、紅軍戰敗六類曲目（mp3、ogg、wav、m4a、flac、webm），所有房間共用。房主也可以在房間頁上傳這一場的曲目，作戰結束十分鐘後或房間關閉時自動刪除。
- **回放清理**：管理員面板可以勾選刪除回放，或一次刪除幾天以前的回放、只保留最近幾份。
- **增援範本與名單**：管理員面板可以上傳伺服器增援範本（單機版增援對話框匯出的 `.latoreinf.json`，所有房間共用）、刪除範本、停用內建編制範本。房主可以在房間頁上傳房間範本，並設定每一方的增援白名單／黑名單；伺服器派遣增援前會檢查名單。
- **編制與裝備編輯器**：網址加上 `/editor`（例如 `https://warsim.encyclato.org/editor`）就是獨立的編輯器頁面，不需要登入。
- **忘記管理員密碼**：在 VPS 上先停止服務再執行（伺服器執行中會拒絕，以免改動被覆蓋）：
  ```bash
  systemctl stop lato-warsim
  runuser -u www-data -- node /opt/lato-warsim/server.js --reset-password 你的名稱   # 顯示新密碼
  runuser -u www-data -- node /opt/lato-warsim/server.js --make-admin 某位玩家       # 把某人設為管理員
  systemctl start lato-warsim
  ```
  （用 `install-debian.sh` 安裝的服務帳號是 `latowar`，把上面的 `www-data` 換成 `latowar`。）
- **備份**：只要備份 `data/` 資料夾（帳號、設定、進行中的作戰、回放）。
  ```bash
  tar czf lato-backup-$(date +%F).tgz -C /opt/lato-warsim data
  ```

## 九、更新版本

把新的 `server.js`、`worker.js`、`simcore.js`、`public/index.html`、`public/editor.html` 覆蓋上去（**不要覆蓋 `data/`**），然後：

```bash
sudo systemctl restart lato-warsim
```

進行中的作戰會在重新啟動前存檔、啟動後恢復（恢復後是暫停狀態，由房主按繼續）。

## 十、怎麼玩

1. 每位玩家用瀏覽器開伺服器網址，在「聯機」分頁註冊（密碼要輸入兩次）、登入，可以在大廳上傳自己的頭像。
2. 房主建立房間（可設密碼），選擇想定：
   - 上傳在單機版準備好的存檔（`.latowarsim.json`：在單機版建好地圖、雙方兵力與部署後，按「存檔 → 下載存檔檔案」）；
   - 或「使用單機版目前的作戰」（直接在聯機版的「開始」分頁建立好再上傳）；
   - 或選一個快速想定。
3. 房主設定時間速度、暫停權限、部署區縱深、每一方的指揮官人數（1–8 位；全房間最多 8 位玩家，例如 8 人合作對抗電腦或 4 對 4，其餘席位由電腦擔任）、點數規則、增援名單與房間範本、作戰時限、是否開放觀戰、友軍迷霧。
   - **作戰時限**：房主在開戰前（不論有沒有載入想定或存檔；先設好的時限會套用到之後載入的想定）或作戰中隨時可以調整：房間設定、部署分頁或頂列的「⏱」按鈕、作戰中的「設定」分頁，所有人一起套用。作戰因時限結束時，房主可以按「延長時限，繼續作戰」，戰場回到雙盲、時間先暫停。
   - **模擬設定**：房間頁的「模擬設定」可以展開單機版設定頁的所有模擬選項（開戰前不論有沒有載入想定或存檔都可以），作戰中也可以在「設定」分頁調整；房主的改動送到伺服器，所有人一起套用，先調整的設定會套用到之後載入的想定或存檔，「恢復想定的設定」可以撤銷。聯機作戰固定雙盲；自動暫停會暫停整個房間（預設全部關閉）；房主可以在作戰中觸發事件。畫面、效果、音效、音樂與戰爭花費單價是每位玩家各自的設定。
   - **喪屍與寄生蟲**：模擬設定裡的「異變環境」卡片可以啟用喪屍或寄生蟲爆發（種類、嚴重程度、爆發來源、開戰後幾小時爆發）。房主可以在部署中按「在地圖上點選」指定爆發地點；作戰中點選的地點會在伺服器上立即爆發，聊天框會通知所有人。屍群由伺服器模擬，每位玩家只看得到本方部隊觀測得到的屍群。
   - **遊戲模式與目標區**：模擬設定裡的「遊戲模式與勝負規則」卡片可以選擇高殺傷、高聲望、民心戰、搶點、殲滅、斬首、閃電、消耗、鐵血、核戰、喪屍末日、末日混戰等模式，或逐項調整勝負規則（兵力崩潰門檻、兵力票數、民心崩潰、斬首、戰功點數）。「模擬」卡片的「目標區範圍」倍率、佔領時間與守住時間也由房主調整。兵力票數與後方民心由伺服器計算，雙方都看得到。
   - **第三方陣營**：模擬設定裡的「第三方陣營」卡片可以加入維和部隊、中立國軍隊、武裝團體或外國志願軍，設定名稱、規模、範圍、位置（按「在地圖上指定」）與對兩軍的關係（盟友、中立、敵對）；作戰中修改關係（例如宣戰或停火）立即生效。第三方部隊由伺服器模擬，每位玩家只看得到本方觀測到的第三方部隊，盟友的部隊一律看得到；玩家可以在戰況總覽請盟友防守或攻擊某個地點。
4. 玩家坐上席位（空位可以設成電腦）。部署階段可以匯入自己的編制檔（單機版「兵力編成 → 匯出」的 `.latoorbat.json`），再到「部署」分頁調整；按「準備完成」。
5. 房主按「開始作戰」，再按 ▶ 讓時間流動。
6. 作戰中只看得到本方偵察到的戰場；左下角的聊天框可以和隊友（本方頻道）或所有人（全房間）聊天、分享位置、在地圖上放置標示。
   - **作戰計畫**：命令面板勾選「📋 計畫模式」後，下達的命令會排進選取部隊的計畫；每一步可以設定開始條件（前一步完成、指定時間、暗號、友軍某一步完成、兵力低於某個比例、敵軍接近或遭射擊）。按「下達計畫」整份送出，中途修改後按「傳送修正」，「發出暗號」讓等待暗號的部隊同時行動。計畫草稿經伺服器與隊友共享，下達與暗號都在伺服器上執行，對方看不到你的計畫。
7. 結束後戰場全面揭曉，回放自動保存，可以在房間或大廳下載，或直接在「回放」分頁開啟。

## 常見問題

- **網頁打得開但一直「未連線」**：反向代理沒有設定 WebSocket（Nginx 的 `Upgrade`／`Connection` 兩行），或防火牆擋住。
- **作戰中斷線**：瀏覽器會自動重新連線並回到房間；斷線超過 `aiGraceSec` 秒，部隊暫由電腦指揮，回來後自動交還。
- **伺服器很慢**：大地圖、大量部隊的作戰很吃 CPU。降低房主的時間速度、限制 `maxRooms`，或使用更多核心的 VPS（每個房間各用一個 CPU 核心）。
- **記憶體不足（程式被系統關掉）**：調低 `maxRooms`，或替 VPS 加 swap：
  ```bash
  sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
  ```
