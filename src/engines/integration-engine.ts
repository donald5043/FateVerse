import type { ElementName, FateReportInput } from '../types/fate';
import { elementVibe, numerologyElement, parseZiweiClassElement } from './fusion-engine';
import { branchToElement } from './five-elements-engine';
import { birthCardElements } from './tarot-engine';
import { ELEMENT_LABELS } from '../utils/constants';

const ELEMENT_ORDER: ElementName[] = ['wood', 'fire', 'earth', 'metal', 'water'];

// 西洋四元素 → 五行（風≈木，四元素不含金）。
const WESTERN_TO_FIVE: Record<string, ElementName> = { 火: 'fire', 土: 'earth', 風: 'wood', 水: 'water' };

export interface SystemElementContribution {
  system: string;
  weight: number;
  vector: Record<ElementName, number>;
  dominant: ElementName;
  detail: string;
}

export interface MissingSystem {
  system: string;
  reason: string;
  to?: string;
}

export interface UnifiedElementProfile {
  percentages: Record<ElementName, number>;
  ranked: ElementName[];
  dominant: ElementName[];
  lacking: ElementName[];
  contributions: SystemElementContribution[];
  connectedSystems: string[];
  missingSystems: MissingSystem[];
  completeness: number;
  plainSummary: string;
  caveat: string;
}

function emptyVector(): Record<ElementName, number> {
  return { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
}

/** 把一組原始權重正規化成總和等於 target 的向量。 */
function normalizeTo(raw: Record<ElementName, number>, target: number): Record<ElementName, number> {
  const sum = ELEMENT_ORDER.reduce((total, element) => total + raw[element], 0);
  const vector = emptyVector();
  if (sum <= 0) return vector;
  ELEMENT_ORDER.forEach((element) => { vector[element] = (raw[element] / sum) * target; });
  return vector;
}

function singleElementVector(element: ElementName, target: number): Record<ElementName, number> {
  const vector = emptyVector();
  vector[element] = target;
  return vector;
}

function dominantOf(vector: Record<ElementName, number>): ElementName {
  return ELEMENT_ORDER.reduce((best, element) => (vector[element] > vector[best] ? element : best), ELEMENT_ORDER[0]);
}

const TOTAL_SYSTEMS = 8;

export interface UnifiedProfileOptions {
  palmElement?: ElementName;
}

/**
 * 把所有可用的算命系統換算到同一套五行座標，做權重化聚合。
 * 這是比「一系統一票」更完整的整合：每套系統貢獻的是加權後的完整分布，而非單一元素。
 */
export function buildUnifiedElementProfile(input: FateReportInput, options: UnifiedProfileOptions = {}): UnifiedElementProfile {
  const contributions: SystemElementContribution[] = [];
  const missingSystems: MissingSystem[] = [];
  const addContribution = (system: string, weight: number, vector: Record<ElementName, number>, detail: string) => {
    contributions.push({ system, weight, vector, dominant: dominantOf(vector), detail });
  };

  // 1. 八字（四柱分布 + 日主加成），權重最高。
  const baziRaw = emptyVector();
  ELEMENT_ORDER.forEach((element) => { baziRaw[element] = input.fiveElements.percentages[element] ?? 0; });
  baziRaw[input.bazi.dayMasterElement] += 40; // 日主再加成，凸顯本命核心
  addContribution('八字', 4, normalizeTo(baziRaw, 4), `四柱五行分布，日主${input.bazi.dayMaster}（${ELEMENT_LABELS[input.bazi.dayMasterElement]}）加權`);

  // 2. 西洋星盤（十星元素分布，否則太陽星座）。
  if (input.astrology.distribution) {
    const westRaw = emptyVector();
    (Object.entries(input.astrology.distribution.elements) as Array<[string, number]>).forEach(([label, count]) => {
      const element = WESTERN_TO_FIVE[label];
      if (element) westRaw[element] += count;
    });
    addContribution('西洋星盤', 2, normalizeTo(westRaw, 2), '十星元素分布（風近似木）');
  } else {
    const sunElement = WESTERN_TO_FIVE[input.astrology.element];
    if (sunElement) addContribution('西洋星盤', 2, singleElementVector(sunElement, 2), `太陽${input.astrology.sunSign}（${input.astrology.element}元素）`);
  }

  // 3. 生肖年支。
  const zodiacElement = branchToElement(input.zodiac.branch);
  addContribution('生肖', 1, singleElementVector(zodiacElement, 1), `${input.zodiac.animal}（${input.zodiac.branch}支）`);

  // 4. 生命靈數（洛書對照）。
  const numElement = numerologyElement(input.numerology.lifePathNumber);
  addContribution('生命靈數', 1.5, singleElementVector(numElement, 1.5), `生命靈數 ${input.numerology.lifePathNumber} 洛書對照`);

  // 5. 生日塔羅（人格牌＋靈魂牌），永遠可由生日推得。
  const tarotElements = birthCardElements(input.numerology.birthDateDigits);
  const tarotRaw = emptyVector();
  tarotElements.forEach((element) => { tarotRaw[element] += 1; });
  addContribution('生日塔羅', 1, normalizeTo(tarotRaw, 1), '人格牌與靈魂牌的元素歸屬');

  // 6. 紫微五行局（有排盤時）。
  const ziweiElement = input.ziwei ? parseZiweiClassElement(input.ziwei.fiveElementsClass) : undefined;
  if (ziweiElement) addContribution('紫微斗數', 1.5, singleElementVector(ziweiElement, 1.5), `${input.ziwei!.fiveElementsClass}`);
  else missingSystems.push({ system: '紫微斗數', reason: '需要完整出生時間排盤', to: '/profile' });

  // 7. 姓名用字（所有可判五行的字平均）。
  const nameElements = input.nameAnalysis?.characters.flatMap((item) => (item.element ? [item.element] : [])) ?? [];
  if (nameElements.length) {
    const nameRaw = emptyVector();
    nameElements.forEach((element) => { nameRaw[element] += 1; });
    addContribution('姓名', 1, normalizeTo(nameRaw, 1), `姓名 ${nameElements.length} 個可判五行的用字`);
  } else {
    missingSystems.push({ system: '姓名', reason: input.nameAnalysis ? '姓名用字尚無明確五行對照' : '尚未提供姓名', to: '/profile' });
  }

  // 8. 手相手型（使用者做過拍手相時）。
  if (options.palmElement) {
    addContribution('手相', 1, singleElementVector(options.palmElement, 1), '手型五行');
  } else {
    missingSystems.push({ system: '手相', reason: '尚未指認手型', to: '/palm' });
  }

  // 聚合並正規化成百分比。
  const aggregate = emptyVector();
  contributions.forEach((contribution) => {
    ELEMENT_ORDER.forEach((element) => { aggregate[element] += contribution.vector[element]; });
  });
  const totalWeight = ELEMENT_ORDER.reduce((total, element) => total + aggregate[element], 0) || 1;
  const percentages = emptyVector();
  ELEMENT_ORDER.forEach((element) => { percentages[element] = Math.round((aggregate[element] / totalWeight) * 1000) / 10; });

  const ranked = [...ELEMENT_ORDER].sort((a, b) => percentages[b] - percentages[a]);
  const topValue = percentages[ranked[0]];
  const dominant = ranked.filter((element) => topValue - percentages[element] < 3 && percentages[element] > 0);
  const lacking = ranked.filter((element) => percentages[element] < 8);

  const connectedSystems = contributions.map((contribution) => contribution.system);
  const completeness = Math.round((connectedSystems.length / TOTAL_SYSTEMS) * 100);

  const dominantLabels = dominant.map((element) => ELEMENT_LABELS[element]).join('、');
  const lackingLabels = lacking.map((element) => ELEMENT_LABELS[element]).join('、');
  const plainSummary = `把目前接上的 ${connectedSystems.length} 套系統全部換算成五行後加權平均，你的整體主軸落在「${dominantLabels}」——${elementVibe(dominant[0])}。${lacking.length ? `相對較淡的是${lackingLabels}，不是缺陷，只是這些能量比較不是你的預設值。` : '五行分布相當均衡，各種模式都拿得出來。'}${completeness < 100 ? `目前整合完成度 ${completeness}%，補上尚未加入的系統會讓這張剖面更貼近你。` : '所有系統都已接上，這是目前最完整的一張整合剖面。'}`;

  return {
    percentages,
    ranked,
    dominant,
    lacking,
    contributions,
    connectedSystems,
    missingSystems,
    completeness,
    plainSummary,
    caveat: '這張剖面是把不同文化的系統「翻譯到同一把尺」後加權平均的結果，權重由 FateVerse 設定（八字最高、其餘依資訊量遞減），不代表哪套系統較準，也不是命定。',
  };
}
