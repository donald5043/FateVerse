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
