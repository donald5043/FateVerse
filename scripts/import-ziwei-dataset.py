"""Build small, exact-key excerpt tables from ziwei-doushu v4.0-13d.

Requires Python 3.11+ and zstandard. Run from the repository root:
    python scripts/import-ziwei-dataset.py
Downloads are cached; SHA-256 must match the pinned release asset manifest.
Only opening summary paragraphs are redistributed, never the embedded Tianji
quotation corpus. Original simplified Chinese is preserved.
"""
import concurrent.futures
import datetime as dt
import gzip
import hashlib
import io
import json
from pathlib import Path
import re
import struct
import urllib.request

import zstandard
from ziwei_rights_policy import add_rights_metadata, filter_summary, load_review

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.cache/ziwei-upstream'
OUTPUT = ROOT / 'public/data/ziwei-v4'
TOPICS = ['overview', 'personality', 'love', 'career', 'wealth', 'health',
          'family', 'children', 'move', 'friends', 'home', 'spirit', 'parents']


def opening_summary(text):
    paragraphs = []
    # Only scan the opening section, not the many KB of unused full text.
    position = text.find('\n\n')
    if position == -1:
        return ''
    position += 2
    while position < len(text):
        end = text.find('\n\n', position)
        if end == -1:
            end = len(text)
        part = text[position:end].strip()
        if part.startswith(('**【', '## ', '---')):
            break
        # The dataset's CC BY grant explicitly excludes Tianji quotations.
        if not re.search(r'倪|天纪|天紀', part):
            paragraphs.append(part)
        position = end + 2
    return '\n\n'.join(paragraphs)


def read_year(asset):
    review = load_review()
    year = int(asset['name'][5:9])
    path = CACHE / asset['name']
    expected_hash = asset['digest'].removeprefix('sha256:')
    if not path.exists():
        with urllib.request.urlopen(asset['url'], timeout=120) as response:
            path.write_bytes(response.read())
    if hashlib.sha256(path.read_bytes()).hexdigest() != expected_hash:
        raise ValueError(f'SHA-256 mismatch: {path}')
    rows = []
    # 128 MB zstd window; never materialize the ~740 MB uncompressed year.
    with path.open('rb') as compressed:
        with zstandard.ZstdDecompressor(max_window_size=2147483648).stream_reader(compressed) as stream:
            for line in io.TextIOWrapper(stream, encoding='utf-8'):
                record = json.loads(line)
                day_offset, slot = divmod(len(rows), 24)
                date = dt.date(year, 1, 1) + dt.timedelta(days=day_offset)
                hour, gender_index = divmod(slot, 2)
                gender = ['male', 'female'][gender_index]
                expected_key = f'{date.isoformat()}-{hour}-{gender}'
                if record['k'] != expected_key:
                    raise ValueError(f'Unexpected record order: {record["k"]} != {expected_key}')
                rows.append([filter_summary(opening_summary(record['c'][topic]), review) for topic in TOPICS])
    expected_count = (dt.date(year + 1, 1, 1) - dt.date(year, 1, 1)).days * 24
    if len(rows) != expected_count:
        raise ValueError(f'Incomplete year {year}: {len(rows)}')
    print(f'Validated {year}: {len(rows)} records', flush=True)
    return year, rows


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    assets = json.loads((ROOT / 'scripts/ziwei-v4-assets.json').read_text(encoding='utf-8'))
    assets = [asset for asset in assets if re.fullmatch(r'year-\d{4}\.jsonl\.zst', asset['name'])]
    if len(assets) != 77:
        raise ValueError('Expected all 77 pinned release years')
    dictionary = ['']
    ids = {'': 0}
    total = 0
    files = {}
    # executor.map preserves year order, giving stable dictionary IDs/artifacts.
    with concurrent.futures.ProcessPoolExecutor(max_workers=3) as executor:
        for year, rows in executor.map(read_year, assets):
            flattened = []
            for row in rows:
                for paragraph in row:
                    if paragraph not in ids:
                        ids[paragraph] = len(dictionary)
                        dictionary.append(paragraph)
                    flattened.append(ids[paragraph])
            if len(dictionary) > 65536:
                raise ValueError('Dictionary exceeds uint16 capacity')
            binary = struct.pack(f'<{len(flattened)}H', *flattened)
            compressed = gzip.compress(binary, mtime=0)
            filename = f'{year}.bin.gz'
            (OUTPUT / filename).write_bytes(compressed)
            files[str(year)] = {'records': len(rows), 'bytes': len(compressed),
                                'sha256': hashlib.sha256(compressed).hexdigest()}
            total += len(rows)
    manifest = {
        'version': 'v4.0-13d-excerpts-1', 'contentVersion': 'ca268829f7a9',
        'source': 'https://github.com/Renhuai123/ziwei-doushu',
        'author': '王多鱼AI', 'license': 'CC BY 4.0',
        'firstYear': 1950, 'lastYear': 2026, 'recordCount': total,
        'topics': TOPICS, 'dictionary': dictionary, 'years': files,
        'modifications': 'Opening summary paragraphs only; paragraphs mentioning Ni Haixia/Tianji excluded. Original simplified Chinese retained. Exact date/hour/gender keys; no approximate matching.',
    }
    if total != 674976:
        raise ValueError(f'Wrong total: {total}')
    add_rights_metadata(manifest, load_review())
    (OUTPUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'Complete: {total} charts, {len(dictionary)} unique summaries', flush=True)


if __name__ == '__main__':
    main()
