#!/usr/bin/env python3
"""LatoWarsim 建置：把 war/*.js 依 order.json 的順序串成
   lato-warsim.html（單機）、server/public/index.html（聯機）、lato-warsim-editor.html（編輯器，也複製到 server/public/editor.html）、
   server/simcore.js（伺服器模擬核心），以及測試用的 test/bsim.js（與伺服器核心相同）和掛鉤頁 test/*_hook.html。
   用法：python3 build.py [--check]   --check 只比對、不寫檔（確認重建結果和 repo 裡的檔案一樣）"""
import sys, os, json, hashlib, re

D = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(D)
W = os.path.join(D, 'war')
CFG = json.load(open(os.path.join(D, 'order.json'), encoding='utf-8'))


def rd(n):
    return open(os.path.join(W, n), encoding='utf-8').read().rstrip('\n') + '\n'


def raw(n):
    return open(os.path.join(W, n), encoding='utf-8').read()


def order(online):
    L = []
    for o in CFG['order']:
        if isinstance(o, dict):
            if o.get('online') and not online:
                continue
            L.append(o['f'])
        else:
            L.append(o)
    return L


def code(online=False, editor=False, hook=False):
    c = ('var MPON=1;\n' if online else '') + ('var EDONLY=1;\n' if editor else '')
    for n in order(online):
        c += rd(n)
    c = 'var LWBUILD=' + json.dumps(hashlib.sha1(c.encode('utf-8')).hexdigest()[:8] + ('-online' if online else '-editor' if editor else '')) + ';\n' + c
    if hook:
        c = c.replace('\nboot();\n', '\nboot();\nwindow.__W={get G(){return G;},UI:UI,VW:VW,E:function(s){return eval(s);}};\n')
    return c


def html(online=False, editor=False, hook=False):
    g = open(os.path.join(REPO, 'lato-globe.html'), encoding='utf-8').read()
    t = open(os.path.join(REPO, 'lato-terrain.html'), encoding='utf-8').read()
    css_common = t[t.index('/* ===== LatoTools 共用樣式'):t.index('/* ===== LatoTerrain 新增')]
    libs = g[g.index('<script>'):g.index('</script>') + 9]
    wcss = open(os.path.join(D, 'warsim.css'), encoding='utf-8').read()
    return ('<!DOCTYPE html>\n<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
            '<title>' + ('編制與裝備編輯器（LatoWarsim）' if editor else '作戰模擬（LatoWarsim 聯機版）' if online else '作戰模擬（LatoWarsim）') + '</title>\n<style>\n' + css_common +
            '/* ===== LatoWarsim 新增：以下附加到 MediaWiki:Gadget-LatoTools.css 末尾 ===== */\n' + wcss +
            'body{margin:0;padding:0;background:#f3f2ee;}\n'
            '</style></head><body>\n<div id="lato-warsim"></div>\n' + libs + '\n<script>\n/* ===== MediaWiki:Gadget-LatoWarsim.js：貼上這段 ===== */\n(function(){\n"use strict";\n'
            "var root=document.getElementById('lato-warsim');\nif(!root)return;\n" + code(online, editor, hook) + '})();\n</script>\n</body></html>\n')


def simcore():
    """伺服器模擬核心：引擎檔＋各介面檔裡登記存檔欄位的那幾行＋武器火力文字，最後匯出 E／setG／getG"""
    src = '/* LatoWarsim 聯機伺服器模擬核心（由 war/*.js 產生，請勿手動修改） */\n"use strict";\n'
    src += '/* ==== x_lal.js（LatoArmory／LatoVehicle 運算庫；window 只當命名空間） ==== */\nvar window={};\n' + raw('x_lal.js') + '\n'
    src += '\n'.join('/* ==== ' + f + ' ==== */\n' + raw(f) for f in CFG['server'] if f != 'x_lal.js')
    return src + CFG['server_tail']


OUT = [('lato-warsim.html', lambda: html()), ('server/public/index.html', lambda: html(online=True)),
       ('lato-warsim-editor.html', lambda: html(editor=True)), ('server/public/editor.html', lambda: html(editor=True)),
       ('server/simcore.js', simcore)]


def main():
    check = '--check' in sys.argv
    bad = 0
    for p, f in OUT:
        s = f()
        fp = os.path.join(REPO, p)
        old = open(fp, encoding='utf-8').read() if os.path.exists(fp) else None
        if check:
            same = old == s
            print(('same   ' if same else 'DIFFERS') + ' ' + p)
            bad += 0 if same else 1
        else:
            open(fp, 'w', encoding='utf-8').write(s)
            print('wrote', p, len(s))
    if not check:
        T = os.path.join(D, 'test')
        os.makedirs(T, exist_ok=True)
        open(os.path.join(T, 'bsim.js'), 'w', encoding='utf-8').write(simcore())
        open(os.path.join(T, 'warsim_hook.html'), 'w', encoding='utf-8').write(html(hook=True))
        open(os.path.join(T, 'warsim_mp_hook.html'), 'w', encoding='utf-8').write(html(online=True, hook=True))
        open(os.path.join(T, 'warsim_ed_hook.html'), 'w', encoding='utf-8').write(html(editor=True, hook=True))
        print('wrote test/bsim.js and hook pages')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
