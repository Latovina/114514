#!/bin/bash
# 先建置，再跑 test/ 裡的引擎測試（t_*.js）與瀏覽器測試（ui_*.js，需要 Playwright 與 Chromium）
cd "$(dirname "$0")" && python3 build.py >/dev/null || exit 1
cd test; fail=0
for t in t_*.js ui_*.js; do r=$(timeout 900 node $t 2>&1); p=$(echo "$r" | grep -c '^PASS'); f=$(echo "$r" | grep -c '^FAIL'); echo "$t pass=$p fail=$f"; [ "$f" != 0 ] && { echo "$r" | grep '^FAIL'; fail=1; }; done
exit $fail
