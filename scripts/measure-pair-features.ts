import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildSyntheticCharts } from '../tests/specificity/synthetic-charts';
import { partnerIndex } from '../tests/specificity/pairing';
import { buildReportFromProfile } from '../src/engines/build-report';
import { generateSynastry } from '../src/engines/synastry-engine';

/**
 * 量出合盤各種結論在「隨機兩個人」之間的實際出現率，
 * 寫進 src/data/pair-feature-rates.ts。
 *
 * 為什麼要跑這一步：具體性量測顯示「生肖沒有特別的合或沖」出現在 87% 的配對上。
 * 也就是說，把「無特殊刑合」寫得像個結論，其實等於什麼都沒說；反過來，
 * 六合、三合這些真的少見的結果，值得明講它有多少見。要講就得先量。
 *
 * 這裡刻意直接呼叫產品用的 `generateSynastry`，用它自己吐出來的 verdict 當作
 * 分類依據——不另寫一份偵測邏輯，兩邊就不可能對不上。
 *
 * 用法：npm run measure:pairs
 */

const charts = buildSyntheticCharts();
const counts = new Map<string, number>();
let measured = 0;
let skipped = 0;

const bump = (id: string) => counts.set(id, (counts.get(id) ?? 0) + 1);

for (const chart of charts) {
  const partner = charts[partnerIndex(chart.index, charts.length)];
  let reading;
  try {
    reading = generateSynastry(
      buildReportFromProfile(chart.profile).reportInput,
      buildReportFromProfile(partner.profile).reportInput,
    );
  } catch {
    // 個別命盤在曆法邊界可能算不出來，跳過但分母也扣掉。
    skipped += 1;
    continue;
  }
  measured += 1;

  const seen = new Set<string>();
  // 用 featureKey 而不是 verdict：日主那一段的 verdict 含雙方姓名，
  // 拿它當鍵的話產品端換個名字就查不到自己的出現率。
  reading.sections.forEach((section) => seen.add(`${section.id}:${section.featureKey}`));
  // 相位以「有沒有出現這種型態」計，同一組配對重複出現只算一次。
  reading.aspects.forEach((aspect) => seen.add(`aspect:${aspect.quality}`));
  if (reading.aspects.length === 0) seen.add('aspect:none');
  if (reading.aspects.some((aspect) => aspect.closeness === 'tight')) seen.add('aspect:tight');
  seen.forEach(bump);
}

const ids = [...counts.keys()].sort();
const body = ids
  .map((id) => `  '${id}': ${((counts.get(id) ?? 0) / measured).toFixed(4)}, // ${counts.get(id)}/${measured}`)
  .join('\n');

const file = `/**
 * 合盤各種結論在隨機配對裡的實測出現率（0–1）。
 *
 * 由 \`npm run measure:pairs\` 產生，請勿手改。
 * 樣本為 tests/specificity/synthetic-charts.ts 的 ${charts.length} 組合成命盤兩兩配對
 * （另有 ${skipped} 組在曆法邊界算不出來，已從分母扣除，實際分母 ${measured}）。
 *
 * 鍵的格式是 \`區段代號:結論\`，直接取自 generateSynastry 回傳的 verdict，
 * 所以量測與產品用的是同一套分類，不會各自漂移。
 *
 * 這不是真實人口分布：合成樣本的出生年份是均勻取樣的，沒有考慮各年代出生率。
 * 所以文案只說「在隨機配對裡」，不說「全世界的情侶有 x% 如此」。
 */
export const PAIR_FEATURE_RATES: Record<string, number> = {
${body}
};
`;

const target = resolve(__dirname, '../src/data/pair-feature-rates.ts');
writeFileSync(target, file, 'utf8');

console.log(`量測 ${measured} 組配對（跳過 ${skipped}），寫入 ${target}`);
ids.forEach((id) => {
  const rate = (counts.get(id) ?? 0) / measured;
  console.log(`  ${(rate * 100).toFixed(1).padStart(5)}%  ${id}`);
});
