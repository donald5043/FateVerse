"""Compare shipped CC BY excerpts with the separately licensed Tianji corpus.

The corpus is only an ignored local audit input. Never redistribute it or put it
in public/. A text overlap is an engineering review flag, not a legal test.
"""
import argparse
import difflib
import hashlib
import json
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
CORPUS_BLOB = '9d3b67100983804ab96184615a079aec23c3687b'
AUDIT_CACHE = ROOT / '.cache/ziwei-rights-audit'
REFERENCE = re.compile(r'《|古书|古書|口诀|口訣|师说|師說|原话|原話|讲义|講義|讲过|講過|讲的|講的|常说|常說|曰|云|倪|天纪|天紀|\d{1,2}:\d{2}')


def normalize(text):
    return ''.join(c for c in unicodedata.normalize('NFKC', text).lower() if c.isalnum())


def digest(text):
    return hashlib.sha256(text.encode('utf8')).hexdigest()


def validate_audit_paths(corpus_path, report_path):
    # Resolve junctions/symlinks, but keep the allowed cache path literal: a
    # junction from .cache into public/ must not make public/ an allowed target.
    for path in [corpus_path, report_path]:
        if not path.resolve().is_relative_to(AUDIT_CACHE):
            raise ValueError('Audit inputs and reports must stay in .cache/ziwei-rights-audit; never publish them.')


def scan(corpus_path, report_path):
    validate_audit_paths(corpus_path, report_path)
    data = corpus_path.read_bytes()
    blob = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
    if blob != CORPUS_BLOB:
        raise ValueError('Audit corpus changed; pin and review its new version first')
    entries = [json.loads(line) for line in data.splitlines() if line]
    quotes = [normalize(entry['quote']) for entry in entries]
    index = {}
    for entry_id, quote in enumerate(quotes):
        for pos in range(len(quote) - 7):
            index.setdefault(quote[pos:pos + 8], set()).add(entry_id)
    manifest = json.loads((ROOT / 'public/data/ziwei-v4/manifest.json').read_text(encoding='utf8'))
    paragraphs = {}
    for summary_id, text in enumerate(manifest['dictionary']):
        for paragraph in text.split('\n\n'):
            if paragraph:
                paragraphs.setdefault(paragraph, []).append(summary_id)
    results = []
    for paragraph, summary_ids in paragraphs.items():
        norm = normalize(paragraph)
        candidates = set()
        for pos in range(len(norm) - 7):
            candidates.update(index.get(norm[pos:pos + 8], ()))
        matches = []
        for entry_id in candidates:
            match = difflib.SequenceMatcher(None, norm, quotes[entry_id], autojunk=False).find_longest_match()
            if match.size >= 8:
                entry = entries[entry_id]
                matches.append({'characters': match.size, 'entry': entry_id,
                                'book': entry['book'], 'part': entry['part'], 'time': entry['t_hms'],
                                'paragraphOffset': match.a})
        matches.sort(key=lambda item: (-item['characters'], item['entry']))
        results.append({'sha256': digest(paragraph), 'summaryIds': summary_ids,
                        'referenceFlag': bool(REFERENCE.search(paragraph)),
                        'matches': matches, 'text': paragraph})
    report = {'corpusGitBlob': blob, 'corpusSha256': hashlib.sha256(data).hexdigest(),
              'corpusEntries': len(entries), 'paragraphs': len(paragraphs),
              'sourceSummaryHashes': [digest(text) for text in manifest['dictionary']],
              'results': results}
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf8')
    print(json.dumps({'paragraphs': len(results), 'corpusEntries': len(entries),
                      'referenceFlags': sum(item['referenceFlag'] for item in results),
                      'overlap8': sum(bool(item['matches']) for item in results),
                      'overlap12': sum(bool(item['matches']) and item['matches'][0]['characters'] >= 12 for item in results)}, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--corpus', type=Path, required=True)
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    scan(args.corpus, args.report)
