import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const sha = (data) => createHash('sha256').update(data).digest('hex');

/** Reject unreviewed text or incomplete license notices before publication. */
export function verifyZiweiRights(directory) {
  const policyText = readFileSync(resolve(root, 'scripts/ziwei-v4-rights-review.json'), 'utf8').replace(/\r\n/g, '\n');
  const policy = JSON.parse(policyText);
  const manifest = JSON.parse(readFileSync(resolve(directory, 'manifest.json'), 'utf8'));
  if (manifest.version !== 'v4.0-13d-excerpts-2' || manifest.rightsReview?.policySha256 !== sha(policyText)) {
    throw new Error('Ziwei rights check failed: stale dataset or review policy.');
  }
  const allowed = new Set(policy.allowedParagraphSha256);
  const excluded = new Set(policy.decisions.filter((item) => item.action === 'exclude').map((item) => item.sha256));
  const summaries = new Set(policy.resultSummarySha256);
  for (const text of manifest.dictionary) {
    if (!summaries.has(sha(text))) throw new Error('Ziwei rights check failed: unreviewed summary.');
    for (const paragraph of text.split('\n\n').filter(Boolean)) {
      if (!allowed.has(sha(paragraph)) || excluded.has(sha(paragraph))) {
        throw new Error('Ziwei rights check failed: unreviewed or excluded paragraph.');
      }
    }
  }
  if (manifest.attribution !== policy.attribution || manifest.author !== '王多鱼AI'
      || manifest.source !== 'https://github.com/Renhuai123/ziwei-doushu'
      || manifest.license !== 'CC BY 4.0'
      || manifest.licenseUrl !== 'https://creativecommons.org/licenses/by/4.0/'
      || !manifest.upstreamDisclaimer || manifest.modificationHistory?.length !== 2) {
    throw new Error('Ziwei rights check failed: missing attribution, license, disclaimer or modification history.');
  }
  const license = readFileSync(resolve(directory, 'SOURCE-LICENSE.txt'), 'utf8').replace(/\r\n/g, '\n');
  if (sha(license) !== policy.sourceLicenseSha256) {
    throw new Error('Ziwei rights check failed: upstream license notice changed.');
  }
  const notice = readFileSync(resolve(directory, 'NOTICE.md'), 'utf8');
  if (!notice.includes(policy.attribution) || !notice.includes(manifest.licenseUrl) || !notice.includes('SOURCE-LICENSE.txt')) {
    throw new Error('Ziwei rights check failed: incomplete distributable notice.');
  }
  const expected = new Set(['manifest.json', 'NOTICE.md', 'SOURCE-LICENSE.txt',
    ...Array.from({ length: 77 }, (_, i) => `${1950 + i}.bin.gz`)]);
  for (const item of readdirSync(directory)) {
    if (!expected.has(item)) throw new Error('Ziwei rights check failed: unexpected audit or data asset.');
  }
  return { summaries: manifest.dictionary.length - 1, excludedParagraphs: excluded.size };
}
