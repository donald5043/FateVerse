"""Fail-closed publication policy for the specifically screened v4 excerpts.

Hashes record a content review, not ownership or a legal clearance. The protected
comparison corpus stays outside the repository and the website's assets.
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REVIEW_PATH = ROOT / 'scripts/ziwei-v4-rights-review.json'
VERSION = 'v4.0-13d-excerpts-2'
ATTRIBUTION = '本项目使用了 紫微斗数开源解读数据集 v4.0（674,976 张命盘 × 13 维）\n来源：https://github.com/Renhuai123/ziwei-doushu\n作者：王多鱼AI'
MODIFICATION = 'Prior opening-summary extraction and keyword exclusions retained. Additional whole paragraphs removed after corpus-overlap and reference review on 2026-10-27. No paraphrasing of excluded text. Unreviewed text is rejected.'
PRIOR_MODIFICATION = 'Opening summary paragraphs only; paragraphs mentioning Ni Haixia/Tianji excluded. Original simplified Chinese retained. Exact date/hour/gender keys; no approximate matching.'


def digest(text):
    return hashlib.sha256(text.encode('utf8')).hexdigest()


def load_review():
    review = json.loads(REVIEW_PATH.read_text(encoding='utf8'))
    if review['reviewVersion'] != 'ziwei-rights-2026-10-27':
        raise ValueError('Unknown content review version')
    review['_accepted'] = set(review['sourceSummarySha256']) | set(review['resultSummarySha256'])
    review['_allowed'] = set(review['allowedParagraphSha256'])
    review['_excluded'] = {item['sha256'] for item in review['decisions'] if item['action'] == 'exclude'}
    review['_results'] = set(review['resultSummarySha256'])
    return review


def filter_summary(text, review):
    if digest(text) not in review['_accepted']:
        raise ValueError(f'Unreviewed summary: {digest(text)}. Stop import and review the new source text.')
    retained = []
    for paragraph in text.split('\n\n'):
        if not paragraph:
            continue
        key = digest(paragraph)
        if key in review['_excluded']:
            continue
        if key not in review['_allowed']:
            raise ValueError(f'Unreviewed paragraph: {key}')
        retained.append(paragraph)
    result = '\n\n'.join(retained)
    if digest(result) not in review['_results']:
        raise ValueError('Filtered result differs from the content review')
    return result


def add_rights_metadata(manifest, review):
    manifest['version'] = VERSION
    manifest['licenseUrl'] = 'https://creativecommons.org/licenses/by/4.0/'
    manifest['upstreamLicenseUrl'] = 'https://github.com/Renhuai123/ziwei-doushu/blob/main/DATASET-LICENSE'
    manifest['attribution'] = ATTRIBUTION
    manifest['upstreamDisclaimer'] = '本数据集由排盘引擎批量生成，解读文本为基于传统命理体系的文本演绎，仅供学习、研究与文化交流使用，不构成任何形式的预测、诊断或建议。数据「按现状」提供，不附带任何明示或默示的担保。'
    manifest['modifications'] = MODIFICATION
    manifest['modificationHistory'] = [PRIOR_MODIFICATION, MODIFICATION]
    manifest['rightsReview'] = {
        'version': review['reviewVersion'], 'reviewedAt': review['reviewedAt'],
        'policySha256': hashlib.sha256(REVIEW_PATH.read_text(encoding='utf8').encode('utf8')).hexdigest(),
        'sourceParagraphsScreened': review['sourceParagraphs'],
        'comparisonEntries': review['corpus']['entries'],
        'excludedUniqueParagraphs': len(review['_excluded']),
        'method': 'All paragraphs screened against a pinned corpus; flagged paragraphs and quotation spans inspected. Hash allowlist blocks new text. No legal clearance or guarantee of completeness.',
    }
    return manifest
