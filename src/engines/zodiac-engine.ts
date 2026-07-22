import type { ZodiacResult } from '../types/fate';

const ZODIAC: Record<string, ZodiacResult> = {
  鼠: { animal: '鼠', branch: '子', symbol: '機敏與適應', positiveTraits: ['觀察敏銳', '資源整合', '應變快速'], blindSpots: ['容易過度思量', '安全感需求較高'] },
  牛: { animal: '牛', branch: '丑', symbol: '穩定與耕耘', positiveTraits: ['踏實可靠', '耐力持久', '重視承諾'], blindSpots: ['可能較固執', '不易及時求助'] },
  虎: { animal: '虎', branch: '寅', symbol: '勇氣與開創', positiveTraits: ['主動果決', '富正義感', '願意承擔'], blindSpots: ['節奏可能太快', '容易高估體力'] },
  兔: { animal: '兔', branch: '卯', symbol: '敏感與協調', positiveTraits: ['善於體察', '重視美感', '溝通圓融'], blindSpots: ['可能迴避衝突', '容易受環境影響'] },
  龍: { animal: '龍', branch: '辰', symbol: '格局與轉化', positiveTraits: ['視野宏觀', '自我驅動', '能鼓舞他人'], blindSpots: ['期待可能過高', '不易接受慢速進展'] },
  蛇: { animal: '蛇', branch: '巳', symbol: '洞察與策略', positiveTraits: ['思考深入', '判斷細膩', '做事有策略'], blindSpots: ['可能過度保留', '容易反覆推演'] },
  馬: { animal: '馬', branch: '午', symbol: '行動與自由', positiveTraits: ['熱情坦率', '行動迅速', '喜歡探索'], blindSpots: ['耐心容易波動', '可能同時開太多事'] },
  羊: { animal: '羊', branch: '未', symbol: '溫和與共感', positiveTraits: ['富同理心', '重視和諧', '創意柔軟'], blindSpots: ['可能過度顧慮', '界線需要練習'] },
  猴: { animal: '猴', branch: '申', symbol: '靈活與創新', positiveTraits: ['學習快速', '點子豐富', '擅長解題'], blindSpots: ['容易分心', '可能低估細節成本'] },
  雞: { animal: '雞', branch: '酉', symbol: '精準與秩序', positiveTraits: ['重視品質', '表達清楚', '善於規劃'], blindSpots: ['可能過度挑剔', '對失序較敏感'] },
  狗: { animal: '狗', branch: '戌', symbol: '忠誠與守護', positiveTraits: ['值得信賴', '重視公平', '責任感強'], blindSpots: ['容易過度承擔', '對風險較警覺'] },
  豬: { animal: '豬', branch: '亥', symbol: '包容與豐足', positiveTraits: ['真誠寬厚', '樂於分享', '享受生活'], blindSpots: ['可能不易拒絕', '需要留意資源界線'] },
};

const ZODIAC_ALIASES: Record<string, string> = {
  龙: '龍',
  马: '馬',
  鸡: '雞',
  猪: '豬',
};

export function normalizeZodiacAnimal(animal: string): string {
  const clean = animal.trim();
  return ZODIAC_ALIASES[clean] ?? clean;
}

export function getZodiacResult(animal: string): ZodiacResult {
  const canonicalAnimal = normalizeZodiacAnimal(animal);
  const result = ZODIAC[canonicalAnimal];
  if (!result) throw new Error(`無法辨識生肖「${animal || '空值'}」，請重新確認出生日期。`);
  return result;
}
