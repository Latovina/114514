#!/usr/bin/env python3
"""打包聯機伺服器：server/ 底下的程式、網頁與說明（不含 data/、node_modules/），輸出 lato-warsim-server.zip（預設放在暫存目錄 out/）"""
import os, sys, zipfile
D = os.path.dirname(os.path.abspath(__file__)); SV = os.path.join(os.path.dirname(D), 'server')
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(D, 'out', 'lato-warsim-server.zip')
os.makedirs(os.path.dirname(out), exist_ok=True)
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(SV):
        dirs[:] = [d for d in dirs if d not in ('data', 'node_modules')]
        for f in sorted(files):
            if f.endswith('.log'): continue
            p = os.path.join(root, f); z.write(p, os.path.join('lato-warsim-server', os.path.relpath(p, SV)))
print(out, os.path.getsize(out))
