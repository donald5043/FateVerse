import type { RareFeatureId } from '../engines/rare-features-engine';

/**
 * 各項罕見特徵的實測出現率（0–1）。
 *
 * 由 `npm run measure:rare` 產生，請勿手改。
 * 樣本為 tests/specificity/synthetic-charts.ts 的 500 組合成命盤
 * （另有 0 組在曆法邊界算不出來，已從分母扣除）。
 *
 * 這不是真實人口分布：合成樣本在 1940–2010 之間均勻取樣，沒有考慮各年代的
 * 出生率差異。所以文案只說「在我們的樣本裡」，不說「全世界只有 x% 的人」。
 */
export const RARE_FEATURE_RATES: Record<RareFeatureId, number> = {
  'three-harmony': 0.0320, // 16/500
  'three-meeting': 0.0460, // 23/500
  'stem-combination': 0.4800, // 240/500
  'missing-element': 0.6960, // 348/500
  'all-five-elements': 0.3040, // 152/500
  'day-master-extreme': 0.4980, // 249/500
  'master-number': 0.1980, // 99/500
  'same-birth-cards': 0.6000, // 300/500
  'empty-soul-palace': 0.0820, // 41/500
  stellium: 0.6620, // 331/500
  'sun-moon-same-sign': 0.0720, // 36/500
  'all-yang': 0.0500, // 25/500
  'all-yin': 0.0460, // 23/500
  'many-retrograde': 0.1860, // 93/500
  'twin-major-stars': 0.2160, // 108/500
  'mutagen-in-soul-palace': 0.2000, // 100/500
  'body-equals-soul': 0.0680, // 34/500
  'early-luck-start': 0.1540, // 77/500
  'late-luck-start': 0.0300, // 15/500
  'luck-clashes-day': 0.4420, // 221/500
  'luck-completes-harmony': 0.4120, // 206/500
  'grand-trine': 0.0880, // 44/500
  't-square': 0.3120, // 156/500
  'grand-cross': 0.0060, // 3/500
  'unaspected-planet': 0.3760, // 188/500
  'personal-retrograde': 0.0340, // 17/500
};
