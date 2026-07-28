import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildSyntheticCharts } from '../tests/specificity/synthetic-charts';
import { buildReportFromProfile } from '../src/engines/build-report';
import { detectFeatures, type RareFeatureId } from '../src/engines/rare-features-engine';

/**
 * 量出每一項罕見特徵的實際出現率，寫進 src/data/rare-feature-rates.ts。
 *
 * 為什麼要跑這一步：報告會對使用者說「大約每 16 個人有 1 個」。這句話要嘛是
 * 真的，要嘛就是話術——沒有中間地帶。所以數字必須是量出來的，而且量測的程式
 * 要和產品用的是同一組偵測器（`detectFeatures`），不能各寫一份。
 *
 * 用法：npm run measure:rare
 */

const ALL_IDS: RareFeatureId[] = [
  'three-harmony', 'three-meeting', 'stem-combination',
  'missing-element', 'all-five-elements', 'day-master-extreme',
  'master-number', 'same-birth-cards', 'empty-soul-palace',
  'stellium', 'sun-moon-same-sign',
  'all-yang', 'all-yin', 'many-retrograde',
  'twin-major-stars', 'mutagen-in-soul-palace', 'body-equals-soul',
  'early-luck-start', 'late-luck-start', 'luck-clashes-day', 'luck-completes-harmony',
  'grand-trine', 't-square', 'grand-cross', 'unaspected-planet',
  'personal-retrograde',
];

const charts = buildSyntheticCharts();
const counts = new Map<RareFeatureId, number>(ALL_IDS.map((id) => [id, 0]));
let measured = 0;
let skipped = 0;

for (const chart of charts) {
  let features;
  try {
    features = detectFeatures(buildReportFromProfile(chart.profile).reportInput);
  } catch {
    // 個別命盤在曆法邊界可能算不出來，跳過但不中斷；分母也要跟著扣掉。
    skipped += 1;
    continue;
  }
  measured += 1;
  // 同一張盤同一項特徵只算一次。
  new Set(features.map((feature) => feature.id)).forEach((id) => {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  });
}

const rates = ALL_IDS.map((id) => [id, (counts.get(id) ?? 0) / measured] as const);

const body = rates
  .map(([id, rate]) => {
    const key = /^[a-z][a-zA-Z]*$/.test(id) ? id : `'${id}'`;
    const hits = counts.get(id) ?? 0;
    return `  ${key}: ${rate.toFixed(4)}, // ${hits}/${measured}`;
  })
  .join('\n');

const file = `import type { RareFeatureId } from '../engines/rare-features-engine';

/**
 * 各項罕見特徵的實測出現率（0–1）。
 *
 * 由 \`npm run measure:rare\` 產生，請勿手改。
 * 樣本為 tests/specificity/synthetic-charts.ts 的 ${measured} 組合成命盤
 * （另有 ${skipped} 組在曆法邊界算不出來，已從分母扣除）。
 *
 * 這不是真實人口分布：合成樣本在 1940–2010 之間均勻取樣，沒有考慮各年代的
 * 出生率差異。所以文案只說「在我們的樣本裡」，不說「全世界只有 x% 的人」。
 */
export const RARE_FEATURE_RATES: Record<RareFeatureId, number> = {
${body}
};
`;

const target = resolve(process.cwd(), 'src/data/rare-feature-rates.ts');
writeFileSync(target, file, 'utf8');

console.log(`量測 ${measured} 組命盤（跳過 ${skipped} 組）：`);
rates
  .slice()
  .sort((left, right) => left[1] - right[1])
  .forEach(([id, rate]) => {
    console.log(`  ${(rate * 100).toFixed(1).padStart(5)}%  ${id}`);
  });
console.log(`\n已寫入 ${target}`);
