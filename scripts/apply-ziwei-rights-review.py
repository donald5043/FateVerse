"""Apply the recorded exclusions to the shipped dictionary without reindexing.

No excluded text or protected corpus is written to a public audit report.
The 77 binary tables keep the same dictionary slots and SHA-256 values.
"""
import json
from pathlib import Path
from ziwei_rights_policy import add_rights_metadata, filter_summary, load_review

path = Path(__file__).resolve().parents[1] / 'public/data/ziwei-v4/manifest.json'
review = load_review()
manifest = json.loads(path.read_text(encoding='utf8'))
before = manifest['dictionary']
after = [filter_summary(text, review) for text in before]
manifest['dictionary'] = after
add_rights_metadata(manifest, review)
path.write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
print(f'Updated {sum(a != b for a, b in zip(before, after))} dictionary slots; year tables unchanged.')
