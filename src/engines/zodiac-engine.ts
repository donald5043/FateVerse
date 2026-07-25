import type { ZodiacResult } from '../types/fate';

const ZODIAC: Record<string, ZodiacResult> = {
  鼠: { animal: '鼠', branch: '子', symbol: '機敏與適應', positiveTraits: ['觀察敏銳', '資源整合', '應變快速'], blindSpots: ['同一個決定會反覆推演到錯過時機', '沒有備案就不太願意起步'] },
  牛: { animal: '牛', branch: '丑', symbol: '穩定與耕耘', positiveTraits: ['踏實可靠', '耐力持久', '重視承諾'], blindSpots: ['決定之後很難改，即使拿到新資訊也一樣', '寧可自己多做，也不願開口找人幫忙'] },
  虎: { animal: '虎', branch: '寅', symbol: '勇氣與開創', positiveTraits: ['主動果決', '富正義感', '願意承擔'], blindSpots: ['別人還在確認細節時，你已經開始動手了', '把行程排到沒有空檔，事後才發現撐不住'] },
  兔: { animal: '兔', branch: '卯', symbol: '敏感與協調', positiveTraits: ['善於體察', '重視美感', '溝通圓融'], blindSpots: ['寧可自己吞下不滿，也不想把場面弄僵', '身邊的人心情不好，你一整天都會受影響'] },
  龍: { animal: '龍', branch: '辰', symbol: '格局與轉化', positiveTraits: ['視野宏觀', '自我驅動', '能鼓舞他人'], blindSpots: ['把標準訂在別人做不到的高度，然後自己補上', '事情推進得慢就開始懷疑整件事的價值'] },
  蛇: { animal: '蛇', branch: '巳', symbol: '洞察與策略', positiveTraits: ['思考深入', '判斷細膩', '做事有策略'], blindSpots: ['話只說三分，等對方先攤牌', '在心裡把同一段對話演練很多遍'] },
  馬: { animal: '馬', branch: '午', symbol: '行動與自由', positiveTraits: ['熱情坦率', '行動迅速', '喜歡探索'], blindSpots: ['熱度過了就把事情放著，開頭比收尾多', '同時進行的事情多到互相排擠'] },
  羊: { animal: '羊', branch: '未', symbol: '溫和與共感', positiveTraits: ['富同理心', '重視和諧', '創意柔軟'], blindSpots: ['話到嘴邊會先想「這樣說會不會傷到人」', '答應之後才發現自己並不想做'] },
  猴: { animal: '猴', branch: '申', symbol: '靈活與創新', positiveTraits: ['學習快速', '點子豐富', '擅長解題'], blindSpots: ['手邊的事還沒收尾，注意力已經跑到下一件', '估時間時只算順利的情況'] },
  雞: { animal: '雞', branch: '酉', symbol: '精準與秩序', positiveTraits: ['重視品質', '表達清楚', '善於規劃'], blindSpots: ['已經夠好的東西還會再改一輪', '桌面或流程一亂，做事效率就掉下來'] },
  狗: { animal: '狗', branch: '戌', symbol: '忠誠與守護', positiveTraits: ['值得信賴', '重視公平', '責任感強'], blindSpots: ['別人的事你會扛成自己的責任', '先想到最壞的情況再決定要不要投入'] },
  豬: { animal: '豬', branch: '亥', symbol: '包容與豐足', positiveTraits: ['真誠寬厚', '樂於分享', '享受生活'], blindSpots: ['開口拒絕之前會先找理由說服自己答應', '把時間和錢分給別人時很少先算自己的額度'] },
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
