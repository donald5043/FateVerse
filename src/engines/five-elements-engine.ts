import type { BaziPillar, ElementName, FiveElementResult } from '../types/fate';

export const STEM_ELEMENTS: Record<string, ElementName> = {
  甲: 'wood', 乙: 'wood', 丙: 'fire', 丁: 'fire', 戊: 'earth', 己: 'earth', 庚: 'metal', 辛: 'metal', 壬: 'water', 癸: 'water',
};

export const BRANCH_ELEMENTS: Record<string, ElementName> = {
  寅: 'wood', 卯: 'wood', 巳: 'fire', 午: 'fire', 辰: 'earth', 戌: 'earth', 丑: 'earth', 未: 'earth', 申: 'metal', 酉: 'metal', 亥: 'water', 子: 'water',
};

export function stemToElement(stem: string): ElementName {
  const element = STEM_ELEMENTS[stem];
  if (!element) throw new Error(`無法辨識天干「${stem}」的五行。`);
  return element;
}

export function branchToElement(branch: string): ElementName {
  const element = BRANCH_ELEMENTS[branch];
  if (!element) throw new Error(`無法辨識地支「${branch}」的五行。`);
  return element;
}

export function calculateFiveElements(pillars: BaziPillar[]): FiveElementResult {
  const counts: Record<ElementName, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  pillars.forEach((pillar) => {
    counts[pillar.stemElement] += 1;
    counts[pillar.branchElement] += 1;
  });
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  if (!total) throw new Error('五行計算需要至少一組天干地支。');
  const percentages = Object.fromEntries(
    (Object.entries(counts) as [ElementName, number][]).map(([key, value]) => [key, Number(((value / total) * 100).toFixed(1))]),
  ) as Record<ElementName, number>;
  const max = Math.max(...Object.values(counts));
  const min = Math.min(...Object.values(counts));
  const entries = Object.entries(counts) as [ElementName, number][];
  return {
    ...counts,
    total,
    percentages,
    strongest: entries.filter(([, value]) => value === max).map(([key]) => key),
    weakest: entries.filter(([, value]) => value === min).map(([key]) => key),
  };
}

/**
 * 兩個元素相差幾個百分點以內，算「並列」而不是「一個比另一個多」。
 *
 * 這個數字是量出來的，不是拍的，而且兩種資料來源的行為不一樣：
 *
 * - **四柱百分比**（八個字，所以是 12.5 的倍數）：差距不是 0 就是至少 12.5，
 *   所以門檻設 0 到 6 之間結果完全相同，實際等同於「完全並列」。
 *   300 組樣本裡有 31% 最高並列、49% 最低並列——將近一半的人，
 *   「四柱裡某某最少」這句話其實挑的是好幾個一樣少的其中一個。
 * - **整合剖面百分比**（連續值）：最強與次強差距的第一四分位數是 3.1 分，
 *   所以 3 分這個門檻會把大約四分之一的人判為並列。
 *
 * 兩邊都指向同一件事：硬挑一個說「你自然會用某某的方式做事」，
 * 是在主張資料不支持的區別。
 */
export const NEAR_TIE_POINTS = 3;

export interface ElementSpread {
  /** 最高的那一群（含所有在 NEAR_TIE_POINTS 之內的並列者）。 */
  top: ElementName[];
  /** 最低的那一群。 */
  bottom: ElementName[];
  /** 最高與最低的差距。 */
  range: number;
  /** 最高有沒有並列。有的話就不該只講一個。 */
  topTied: boolean;
  bottomTied: boolean;
  /** 整體是不是平的——連最高最低都拉不開，這種盤不該用「主導元素」的語言描述。 */
  flat: boolean;
}

/** 五行分布的形狀。用來決定「能不能只講一個元素」。 */
export function describeElementSpread(percentages: Record<ElementName, number>): ElementSpread {
  const entries = Object.entries(percentages) as [ElementName, number][];
  const values = entries.map(([, value]) => value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const top = entries.filter(([, value]) => max - value <= NEAR_TIE_POINTS).map(([element]) => element);
  const bottom = entries.filter(([, value]) => value - min <= NEAR_TIE_POINTS).map(([element]) => element);
  const range = max - min;
  return {
    top,
    bottom,
    range,
    topTied: top.length > 1,
    bottomTied: bottom.length > 1,
    // 全距 10 分以內：整合剖面約 1.5% 的人會落在這裡。四柱百分比因為量化在
    // 12.5 的倍數上，全距最小就是 12.5，所以這個旗標對四柱資料永遠是 false。
    flat: range < 10,
  };
}
