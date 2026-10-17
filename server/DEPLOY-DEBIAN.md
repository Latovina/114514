# 在 Debian 架設 LatoWarsim 聯機版：https://warsim.encyclato.org/

照著做完，玩家用瀏覽器打開 **https://warsim.encyclato.org/** 就能註冊、開房、對戰。
大部分步驟由安裝腳本 `install-debian.sh` 自動完成，你要做的只有：設定網域、上傳檔案、執行一行指令。

---

## 第 0 步：準備

- 一台 VPS，系統是 **Debian 12 或 13**（11 也可以），記憶體建議 2 GB 以上。
- 可以用 root 登入（或有 sudo 權限的帳號）。
- 記下 VPS 的 **公開 IPv4 位址**，以下用 `203.0.113.10` 代表，請換成你自己的。
- 如果主機商的控制台有「防火牆／安全群組」，開放 **TCP 22、80、443**。

## 第 1 步：讓網域指到 VPS

`warsim.encyclato.org` 目前解析到 `104.21.6.62`，這是 Cloudflare 的位址，表示 `encyclato.org` 的 DNS 由 Cloudflare 代管。請到 Cloudflare 後台設定：

1. 登入 Cloudflare → 選 `encyclato.org` → 左側「DNS」→「記錄」。
2. 找到名稱為 `warsim` 的記錄，按「編輯」；沒有的話就按「新增記錄」：
   - 類型：`A`
   - 名稱：`warsim`
   - IPv4 位址：`203.0.113.10`（你的 VPS IP）
   - **Proxy 狀態：點成灰色雲朵（僅 DNS）**
   - TTL：自動
3. 儲存。通常幾分鐘內就會生效。

> **為什麼要灰色雲朵？** 安裝時，Caddy 會向 Let's Encrypt 申請免費的 HTTPS 憑證，這需要直接連到你的主機。
> 遊戲也一直用 WebSocket 長連線，直連最穩定。之後想改用 Cloudflare 代理，見文末「附錄 A」。

如果 `encyclato.org` 的 DNS 其實在網域註冊商那裡（不是 Cloudflare），到註冊商的 DNS 管理頁新增一樣的 A 記錄即可。

## 第 2 步：上傳安裝包

在**你自己的電腦**上，把 `lato-warsim-server.zip` 傳到 VPS。

Windows（PowerShell）或 macOS／Linux（終端機）：

```bash
scp lato-warsim-server.zip root@203.0.113.10:/root/
```

> 不習慣指令的話，可以用 WinSCP 或 FileZilla（SFTP、連接埠 22）把檔案拖到 `/root/`。

## 第 3 步：登入 VPS，執行安裝腳本

```bash
ssh root@203.0.113.10

apt-get update && apt-get install -y unzip
cd /root
unzip -o lato-warsim-server.zip
cd lato-warsim-server
bash install-debian.sh warsim.encyclato.org
```

> 不是用 root 登入的話，在 `apt-get` 和 `bash install-debian.sh` 前面加 `sudo`。

腳本大約 1–3 分鐘，依序完成：

| 步驟 | 內容 |
|---|---|
| 1 | 安裝基本工具（curl、unzip、cron 等） |
| 2 | 安裝 Node.js 22 |
| 3 | 把程式放到 `/opt/lato-warsim`，建立專用的系統帳號 `latowar` |
| 4 | 寫入設定：遊戲伺服器只在本機 `127.0.0.1:8080` 聽取，網址設為 `https://warsim.encyclato.org/` |
| 5 | 建立 systemd 服務 `lato-warsim`（開機自動啟動、當掉自動重開） |
| 6 | 安裝 Caddy，讓 `https://warsim.encyclato.org/` 轉到遊戲伺服器，並自動申請、續期 HTTPS 憑證 |
| 7 | ufw 有啟用的話開放 80、443；建立每日備份；檢查網域是否已指到這台主機 |

最後看到綠色的 **「完成！」** 就好了。如果第 7 步提示網域還沒指到這台主機，回去檢查第 1 步（DNS 生效可能要再等幾分鐘），之後執行 `systemctl restart caddy`。

## 第 4 步：第一次登入（成為管理員）

1. 用瀏覽器打開 **https://warsim.encyclato.org/**（網址列應該有鎖頭）。
2. 在「🌐 聯機」分頁 **註冊第一個帳號**：第一位註冊的人會自動成為**管理員**。
3. 按大廳上方的「管理員面板」：
   - 只想給朋友玩：關掉「開放註冊」，或設定一個「邀請碼」（註冊時要輸入）。
   - 設定伺服器名稱與大廳公告。
4. 試玩一次：建立房間 → 選「快速想定」→ 坐上席位 → 開始作戰 → 按 ▶。
5. 邀請朋友：在房間頁按「🔗 複製邀請連結」，把連結傳給對方；對方打開、登入後就會直接進入你的房間（有設密碼的話會要求輸入）。

## 第 5 步：日常管理

| 想做的事 | 指令 |
|---|---|
| 看伺服器狀態 | `systemctl status lato-warsim` |
| 即時看紀錄（Ctrl+C 離開） | `journalctl -u lato-warsim -f` |
| 重新啟動（進行中的作戰會先存檔、重啟後恢復為暫停） | `systemctl restart lato-warsim` |
| 停止／啟動 | `systemctl stop lato-warsim`／`systemctl start lato-warsim` |
| 看 HTTPS 憑證或 Caddy 的狀況 | `journalctl -u caddy -n 50` |
| 忘記管理員密碼（先停止服務，會顯示新密碼） | `systemctl stop lato-warsim && runuser -u latowar -- node /opt/lato-warsim/server.js --reset-password 你的名稱; systemctl start lato-warsim` |
| 把某位玩家設為管理員 | `systemctl stop lato-warsim && runuser -u latowar -- node /opt/lato-warsim/server.js --make-admin 玩家名稱; systemctl start lato-warsim` |
| 修改設定（改完要重新啟動） | `nano /opt/lato-warsim/data/config.json` |

**更新版本**：把新的 `lato-warsim-server.zip` 傳上來，解壓縮後在資料夾裡**再執行一次** `bash install-debian.sh warsim.encyclato.org`。
腳本只替換程式檔，帳號、房間、回放（`data/`）都會保留。

**備份**：每天自動備份到 `/var/backups/lato-warsim/`（保留 14 天）。手動備份：

```bash
tar czf /root/lato-backup-$(date +%F).tgz -C /opt/lato-warsim data
```

還原：

```bash
systemctl stop lato-warsim
tar xzf /var/backups/lato-warsim/data-某日期.tgz -C /opt/lato-warsim
chown -R latowar:latowar /opt/lato-warsim/data
systemctl start lato-warsim
```

建議偶爾把備份下載回自己的電腦：`scp root@203.0.113.10:/var/backups/lato-warsim/*.tgz .`

## 疑難排解

| 狀況 | 檢查與處理 |
|---|---|
| 網址打不開 | `getent hosts warsim.encyclato.org` 要顯示你的 VPS IP；主機商防火牆要開放 80、443；`systemctl status caddy` 要是 active。 |
| 瀏覽器說憑證有問題 | `journalctl -u caddy -n 50`。常見原因：DNS 還沒指到這台主機、80 埠被擋、Cloudflare 是橘色雲朵。修正後 `systemctl restart caddy`。 |
| 顯示 502 Bad Gateway | 遊戲伺服器沒在執行：`systemctl status lato-warsim`、`journalctl -u lato-warsim -n 50`。 |
| 網頁開得了，但一直「未連線」 | WebSocket 被擋：使用 Cloudflare 代理時要確認「網路 → WebSockets」是開啟的；用 Nginx 的話要有 `Upgrade` 設定（見附錄 B）。 |
| 很慢、延遲大 | 大地圖、大量部隊很吃 CPU。房主可以調低時間速度；在 `config.json` 調低 `maxRooms`，或換更多核心的 VPS（每個進行中的房間各用一個核心）。 |
| 記憶體不足（服務自己重開） | 加 2 GB swap：`fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && echo '/swapfile none swap sw 0 0' >> /etc/fstab` |
| 安裝腳本說 80／443 已被占用 | 這台主機已經有 Nginx 或 Apache；腳本會略過 Caddy，請照附錄 B 設定。 |

## 附錄 A：之後想改用 Cloudflare 代理（橘色雲朵）

灰色雲朵（直連）最簡單也最穩定。若想讓 Cloudflare 代理流量、隱藏主機 IP，建議改用 **Cloudflare 來源憑證**，就不必再管憑證續期：

1. Cloudflare →「SSL/TLS」→「來源伺服器（Origin Server）」→「建立憑證」，保持預設（RSA、15 年、`*.encyclato.org` 與 `encyclato.org`），按「建立」。
2. 在 VPS 上把兩段內容分別存成檔案：
   ```bash
   nano /etc/caddy/cf-origin.pem    # 貼上「來源憑證」
   nano /etc/caddy/cf-origin.key    # 貼上「私密金鑰」
   chown caddy:caddy /etc/caddy/cf-origin.*
   chmod 600 /etc/caddy/cf-origin.key
   ```
3. 編輯 `/etc/caddy/Caddyfile` 的 `warsim.encyclato.org` 區塊，加一行 `tls`：
   ```
   warsim.encyclato.org {
   	tls /etc/caddy/cf-origin.pem /etc/caddy/cf-origin.key
   	encode gzip
   	reverse_proxy 127.0.0.1:8080
   }
   ```
   然後執行 `systemctl reload caddy`。
4. Cloudflare →「SSL/TLS」→「概觀」：選 **完全（嚴格）／Full (strict)**。
5. Cloudflare →「網路」：確認 **WebSockets** 已開啟。
6. 回到 DNS，把 `warsim` 記錄點成**橘色雲朵**。

> 透過 Cloudflare 代理時，遊戲伺服器看到的是 Cloudflare 的位址，所以「登入嘗試次數限制」是以 Cloudflare 的節點計算。小型私人伺服器沒有影響。

## 附錄 B：這台主機已經有 Nginx

安裝腳本偵測到 80／443 被占用時會略過 Caddy，遊戲伺服器照樣在 `127.0.0.1:8080` 執行。在 Nginx 加一個網站：

```bash
nano /etc/nginx/sites-available/warsim.encyclato.org
```

```nginx
server {
    listen 80;
    server_name warsim.encyclato.org;
    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/warsim.encyclato.org /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d warsim.encyclato.org
```

## 附錄 C：完全移除

```bash
systemctl disable --now lato-warsim
rm -f /etc/systemd/system/lato-warsim.service /etc/cron.daily/lato-warsim-backup
systemctl daemon-reload
# 先備份 data/ 再刪除程式
tar czf /root/lato-final-backup.tgz -C /opt/lato-warsim data && rm -rf /opt/lato-warsim
# 再從 /etc/caddy/Caddyfile 刪掉 warsim.encyclato.org 區塊，然後 systemctl reload caddy
```
