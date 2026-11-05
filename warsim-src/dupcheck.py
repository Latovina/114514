#!/usr/bin/env python3
"""檢查頂層重複宣告（只報新出現的；舊有的多半在各自的閉包裡，記在 dupcheck_known.json）：所有檔案在同一個函式範圍，頂層的 function／var 重名會互相覆蓋（包裝函式用的 (function(){var b=f;f=...})() 不算）"""
import re, build
seen = {}; dup = []
for online in (False, True):
    seen = {}
    for n in build.order(online):
        t = build.rd(n)
        for m in re.finditer(r'(?m)^(?:function\s+([A-Za-z_$][\w$]*)\s*\(|var\s+([A-Za-z_$][\w$]*)\s*[=;,])', t):
            k = m.group(1) or m.group(2)
            if k in seen and seen[k] != n:
                dup.append((k, seen[k], n))
            seen.setdefault(k, n)
dup = sorted(set(dup))
import os, json, sys
B = os.path.join(build.D, 'dupcheck_known.json')
if '--save' in sys.argv:
    json.dump([list(d) for d in dup], open(B, 'w'), ensure_ascii=False); print('saved', len(dup)); sys.exit(0)
known = set(tuple(d) for d in json.load(open(B))) if os.path.exists(B) else set()
new = [d for d in dup if d not in known]
print('new dups', len(new))
for d in new: print(' ', d)
sys.exit(1 if new else 0)
