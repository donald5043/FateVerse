# 產生 src/data/unihan-char-data.ts
# 用法：
#   1. 下載 https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip
#   2. 解壓出 Unihan_IRGSources.txt
#   3. python3 scripts/generate-unihan-data.py path/to/Unihan_IRGSources.txt
# 資料授權：Unicode License v3（見 THIRD_PARTY_NOTICES.md）。
import os
import re
import sys

path = sys.argv[1] if len(sys.argv) > 1 else 'Unihan_IRGSources.txt'
START, END = 0x4E00, 0x9FFF
N = END - START + 1
strokes = [0] * N
radicals = [0] * N

for line in open(path, encoding='utf-8'):
    if line.startswith('#') or '\t' not in line:
        continue
    cp, key, val = line.rstrip('\n').split('\t', 2)
    code = int(cp[2:], 16)
    if not (START <= code <= END):
        continue
    i = code - START
    if key == 'kTotalStrokes':
        try:
            strokes[i] = min(63, int(val.split()[0]))
        except ValueError:
            pass
    elif key == 'kRSUnicode':
        m = re.match(r'(\d+)', val.split()[0])
        if m:
            radicals[i] = int(m.group(1))

ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-'
stroke_str = ''.join(ALPHA[s] for s in strokes)
runs = []
for r in radicals:
    if runs and runs[-1][0] == r:
        runs[-1][1] += 1
    else:
        runs.append([r, 1])

chunks = [stroke_str[i:i + 100] for i in range(0, len(stroke_str), 100)]
joined = "' +\n  '".join(chunks)
runs_str = ','.join('[%d,%d]' % (r, c) for r, c in runs)

parts = [
    '// 由 Unicode Unihan 資料庫（Unihan_IRGSources.txt）自動產生，勿手動編輯。',
    '// 來源：https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip（Unicode License v3）',
    '// 涵蓋 CJK 統一表意文字 U+4E00–U+9FFF 的 kTotalStrokes 與 kRSUnicode 部首編號。',
    'export const UNIHAN_START = 0x4e00;',
    'export const UNIHAN_END = 0x9fff;',
    '',
    '// 每字一碼：以 64 字元表編碼 kTotalStrokes（A=0 表示無資料，B=1 畫，上限 63）。',
    "export const UNIHAN_STROKE_ALPHABET = '%s';" % ALPHA,
    "export const UNIHAN_STROKES =\n  '%s';" % joined,
    '',
    '// kRSUnicode 康熙部首編號的連續段編碼：[部首編號, 連續字數]。',
    'export const UNIHAN_RADICAL_RUNS: Array<[number, number]> = [%s];' % runs_str,
    '',
]
out = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'unihan-char-data.ts')
open(out, 'w', encoding='utf-8').write('\n'.join(parts))
print('written', out, 'coverage', sum(1 for s in strokes if s > 0), '/', N)
