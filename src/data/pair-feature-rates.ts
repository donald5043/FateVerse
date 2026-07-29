/**
 * 合盤各種結論在隨機配對裡的實測出現率（0–1）。
 *
 * 由 `npm run measure:pairs` 產生，請勿手改。
 * 樣本為 tests/specificity/synthetic-charts.ts 的 500 組合成命盤兩兩配對
 * （另有 0 組在曆法邊界算不出來，已從分母扣除，實際分母 500）。
 *
 * 鍵的格式是 `區段代號:結論`，直接取自 generateSynastry 回傳的 verdict，
 * 所以量測與產品用的是同一套分類，不會各自漂移。
 *
 * 這不是真實人口分布：合成樣本的出生年份是均勻取樣的，沒有考慮各年代出生率。
 * 所以文案只說「在隨機配對裡」，不說「全世界的情侶有 x% 如此」。
 */
export const PAIR_FEATURE_RATES: Record<string, number> = {
  'aspect:flow': 0.9300, // 465/500
  'aspect:fusion': 0.5080, // 254/500
  'aspect:none': 0.0020, // 1/500
  'aspect:polarity': 0.4880, // 244/500
  'aspect:tension': 0.7620, // 381/500
  'aspect:tight': 0.8880, // 444/500
  'day-master:a-controls-b': 0.1620, // 81/500
  'day-master:a-generates-b': 0.2180, // 109/500
  'day-master:b-controls-a': 0.2060, // 103/500
  'day-master:b-generates-a': 0.2300, // 115/500
  'day-master:same': 0.1840, // 92/500
  'element:偏同類': 0.0980, // 49/500
  'element:有互補': 0.9020, // 451/500
  'numerology:different': 0.8860, // 443/500
  'numerology:same': 0.1140, // 57/500
  'sun-sign:中性': 0.3020, // 151/500
  'sun-sign:互相加分': 0.1980, // 99/500
  'sun-sign:同元素': 0.1980, // 99/500
  'sun-sign:需要磨合': 0.3020, // 151/500
  'zodiac:none': 0.5220, // 261/500
  'zodiac:生肖三合': 0.2320, // 116/500
  'zodiac:生肖六合': 0.0980, // 49/500
  'zodiac:生肖六沖': 0.0680, // 34/500
  'zodiac:生肖相害': 0.0800, // 40/500
};
