import json
from pathlib import Path
import sys
import unittest
import runpy

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from ziwei_rights_policy import digest, filter_summary, load_review


class ZiweiRightsPolicyTests(unittest.TestCase):
    def test_all_published_summaries_are_reviewed_and_idempotent(self):
        root = Path(__file__).resolve().parents[2]
        manifest = json.loads((root / 'public/data/ziwei-v4/manifest.json').read_text(encoding='utf8'))
        review = load_review()
        for text in manifest['dictionary']:
            self.assertEqual(filter_summary(text, review), text)

    def test_new_source_text_stops_import(self):
        with self.assertRaisesRegex(ValueError, 'Unreviewed summary'):
            filter_summary('This new text has never been screened.', load_review())

    def test_small_edit_cannot_bypass_content_review(self):
        root = Path(__file__).resolve().parents[2]
        manifest = json.loads((root / 'public/data/ziwei-v4/manifest.json').read_text(encoding='utf8'))
        with self.assertRaisesRegex(ValueError, 'Unreviewed summary'):
            filter_summary(manifest['dictionary'][1] + ' ', load_review())

    def test_excluded_whole_paragraph_is_omitted_without_rewriting(self):
        # Self-authored fixtures; never copy an actual excluded source passage.
        good = 'An original permitted fixture.'
        excluded = 'An original excluded fixture.'
        original = good + '\n\n' + excluded
        review = {'_accepted': {digest(original), digest(good)}, '_allowed': {digest(good)},
                  '_excluded': {digest(excluded)}, '_results': {digest(good)}}
        self.assertEqual(filter_summary(original, review), good)
        self.assertEqual(filter_summary(good, review), good)

    def test_unknown_paragraph_is_rejected_even_if_summary_hash_was_added(self):
        text = 'An original unreviewed paragraph fixture.'
        review = {'_accepted': {digest(text)}, '_allowed': set(), '_excluded': set(), '_results': {digest(text)}}
        with self.assertRaisesRegex(ValueError, 'Unreviewed paragraph'):
            filter_summary(text, review)

    def test_audit_report_cannot_be_written_to_public_or_tracked_docs(self):
        root = Path(__file__).resolve().parents[2]
        audit = runpy.run_path(str(root / 'scripts/audit-ziwei-rights.py'))
        corpus = root / '.cache/ziwei-rights-audit/tianji-entries.jsonl'
        for target in ['public/audit.json', 'docs/audit.json', 'scripts/audit.json']:
            with self.assertRaisesRegex(ValueError, 'never publish'):
                audit['validate_audit_paths'](corpus, root / target)
        audit['validate_audit_paths'](corpus, root / '.cache/ziwei-rights-audit/scan.json')


if __name__ == '__main__':
    unittest.main()
