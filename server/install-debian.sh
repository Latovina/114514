#!/usr/bin/env bash
# LatoWarsim 聯機伺服器：Debian 一鍵安裝／更新（Debian 11、12、13；Ubuntu 也可以）
#
# 用法：在解壓縮後的 lato-warsim-server 資料夾裡，以 root 執行
#   bash install-debian.sh warsim.encyclato.org
#
# 會做的事：安裝 Node.js 22 與 Caddy、把程式放到 /opt/lato-warsim、建立系統帳號 latowar、
# 建立 systemd 服務 lato-warsim（開機自動啟動）、讓 Caddy 以 https://網域/ 對外提供（自動申請憑證）、
# 每天備份 data/。再執行一次就是「更新」：只換程式檔，不動 data/（帳號、房間、回放）。
set -euo pipefail

DOMAIN="${1:-warsim.encyclato.org}"
APP=/opt/lato-warsim
SVC=lato-warsim
USR=latowar
PORT="${PORT:-8080}"
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

say()  { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
note() { printf '\033[1;33m[注意] %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m[錯誤] %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "請用 root 執行：sudo bash install-debian.sh $DOMAIN"
[ -f /etc/debian_version ] || die "這個腳本只支援 Debian 系統（Debian、Ubuntu）。"
if [ ! -f "$SRC/server.js" ] || [ ! -f "$SRC/public/index.html" ]; then die "請在解壓縮後的 lato-warsim-server 資料夾裡執行這個腳本。"; fi
case "$DOMAIN" in *.*) ;; *) die "網域格式不對：$DOMAIN";; esac
export DEBIAN_FRONTEND=noninteractive

say "1/7 安裝基本工具"
apt-get update -y
apt-get install -y curl ca-certificates gnupg unzip cron debian-keyring debian-archive-keyring apt-transport-https

say "2/7 安裝 Node.js 22"
need_node=1
if command -v node >/dev/null 2>&1; then
  major="$(node -p 'process.versions.node.split(".")[0]')"
  if [ "$major" -ge 20 ]; then need_node=0; fi
fi
if [ "$need_node" = 1 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
NODE="$(command -v node)"
echo "Node.js $("$NODE" -v)（$NODE）"

say "3/7 安裝程式到 $APP"
id "$USR" >/dev/null 2>&1 || useradd --system --home-dir "$APP" --no-create-home --shell /usr/sbin/nologin "$USR"
mkdir -p "$APP/public" "$APP/data"
if [ "$SRC" != "$APP" ]; then
  cp -f "$SRC/server.js" "$SRC/worker.js" "$SRC/simcore.js" "$SRC/package.json" "$APP/"
  cp -f "$SRC/public/index.html" "$APP/public/index.html"
  for f in "$SRC"/*.md "$SRC/install-debian.sh"; do [ -f "$f" ] && cp -f "$f" "$APP/"; done
fi

say "4/7 寫入設定 $APP/data/config.json"
"$NODE" - "$APP/data/config.json" "$DOMAIN" "$PORT" <<'EOF'
const fs=require('fs');const [f,dom,port]=process.argv.slice(2);let c={};
try{c=JSON.parse(fs.readFileSync(f,'utf8'));}catch(e){}
c.host='127.0.0.1';c.port=+port;c.trustProxy=true;c.publicUrl='https://'+dom+'/';
if(!c.serverName||c.serverName==='LatoWarsim 聯機伺服器')c.serverName='LatoWarsim 作戰模擬（'+dom+'）';
fs.writeFileSync(f,JSON.stringify(c,null,1));console.log('網址 '+c.publicUrl+'，伺服器只在本機 127.0.0.1:'+c.port+' 聽取，由 Caddy 對外提供 HTTPS');
EOF
chown -R "$USR:$USR" "$APP"

say "5/7 建立 systemd 服務 $SVC"
cat > "/etc/systemd/system/$SVC.service" <<EOF
[Unit]
Description=LatoWarsim 聯機伺服器 ($DOMAIN)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$USR
Group=$USR
WorkingDirectory=$APP
ExecStart=$NODE $APP/server.js
Restart=always
RestartSec=5
# 停止時讓伺服器有時間把進行中的作戰存檔
TimeoutStopSec=25
Environment=NODE_ENV=production
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable "$SVC" >/dev/null
systemctl restart "$SVC"
ok=0
for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:$PORT/api/info" >/dev/null 2>&1; then ok=1; break; fi
  sleep 1
done
[ "$ok" = 1 ] || die "伺服器沒有啟動，請看紀錄：journalctl -u $SVC -n 50"
echo "伺服器已在 127.0.0.1:$PORT 執行。"

say "6/7 安裝 Caddy，設定 https://$DOMAIN/"
busy="$(ss -ltnpH '( sport = :80 or sport = :443 )' 2>/dev/null | grep -v caddy || true)"
if [ -n "$busy" ]; then
  note "80 或 443 連接埠已被其他程式使用（例如 Nginx 或 Apache）："
  echo "$busy"
  note "略過 Caddy；請依 DEPLOY-DEBIAN.md 的「已經有 Nginx」一節設定反向代理到 127.0.0.1:$PORT。"
else
  if ! command -v caddy >/dev/null 2>&1; then
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
    chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -y
    apt-get install -y caddy
  fi
  CF=/etc/caddy/Caddyfile
  BLOCK="$DOMAIN {
	encode gzip
	reverse_proxy 127.0.0.1:$PORT
}"
  if [ -f "$CF" ] && grep -qE "^[[:space:]]*$DOMAIN([[:space:],]|\{|$)" "$CF"; then
    echo "Caddyfile 已經有 $DOMAIN，保留原本的設定。"
  elif [ ! -s "$CF" ] || grep -qE '^:80[[:space:]]*\{' "$CF"; then
    [ -f "$CF" ] && cp "$CF" "$CF.bak.$(date +%Y%m%d%H%M%S)"
    printf '%s\n' "$BLOCK" > "$CF"
    echo "已寫入 $CF（原本的預設內容已備份）。"
  else
    cp "$CF" "$CF.bak.$(date +%Y%m%d%H%M%S)"
    printf '\n%s\n' "$BLOCK" >> "$CF"
    echo "已把 $DOMAIN 加到 $CF 的最後（原檔已備份）。"
  fi
  caddy validate --config "$CF" --adapter caddyfile >/dev/null
  systemctl enable caddy >/dev/null
  systemctl reload caddy 2>/dev/null || systemctl restart caddy
fi

say "7/7 防火牆、每日備份、檢查網域"
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow 80/tcp >/dev/null && ufw allow 443/tcp >/dev/null && echo "ufw：已開放 80、443。"
fi
cat > /etc/cron.daily/lato-warsim-backup <<'EOF'
#!/bin/sh
# 每天備份 LatoWarsim 的 data/（帳號、房間、回放），保留最近 14 份
D=/var/backups/lato-warsim
mkdir -p "$D"
tar czf "$D/data-$(date +%F).tgz" -C /opt/lato-warsim data 2>/dev/null
ls -1t "$D"/data-*.tgz 2>/dev/null | tail -n +15 | xargs -r rm -f
EOF
chmod 755 /etc/cron.daily/lato-warsim-backup
echo "每日備份：/var/backups/lato-warsim/"
myip="$(curl -4 -fsS --max-time 5 https://api.ipify.org 2>/dev/null || true)"
dnsip="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk 'NR==1{print $1}' || true)"
if [ -z "$dnsip" ]; then
  note "$DOMAIN 目前查不到 IP。請到網域的 DNS 設定新增 A 紀錄：warsim → ${myip:-這台主機的 IP}（生效後 Caddy 會自動申請 HTTPS 憑證）。"
elif [ -n "$myip" ] && [ "$dnsip" != "$myip" ]; then
  note "$DOMAIN 指向 $dnsip，但這台主機的 IP 是 $myip。若有使用 Cloudflare 代理（橘色雲朵）這是正常的；否則請修正 DNS 的 A 紀錄。"
else
  echo "$DOMAIN → $dnsip，DNS 正確。"
fi

printf '\n\033[1;32m完成！\033[0m\n'
cat <<EOF
  網址：      https://$DOMAIN/
  第一步：    打開網址，在「聯機」分頁註冊第一個帳號（會成為管理員），
              再到「管理員面板」決定是否開放註冊或設定邀請碼。
  服務狀態：  systemctl status $SVC
  即時紀錄：  journalctl -u $SVC -f
  重新啟動：  systemctl restart $SVC
  憑證問題：  journalctl -u caddy -n 50
  更新程式：  把新的 lato-warsim-server 解壓縮後，在裡面再執行一次本腳本
EOF
