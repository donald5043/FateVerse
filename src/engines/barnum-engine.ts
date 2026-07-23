import { BARNUM_STATEMENTS, TECHNIQUES, type BarnumStatement, type TechniqueInfo } from '../data/barnum-statements';
import { calculateSunSign } from './astrology-engine';
import { calculateBazi } from './bazi-engine';
import { calculateFiveElements } from './five-elements-engine';
import { elementVibe } from './fusion-engine';
import { calculateNumerology } from './numerology-engine';
import { getZodiacResult } from './zodiac-engine';
import { ELEMENT_LABELS } from '../utils/constants';
import type { FateReportInput } from '../types/fate';

const DEMO_BIRTH = { birthDate: '1996-05-14', birthTime: '09:15', timezone: 'Asia/Taipei' };

/** 沒有真實命盤時，用固定示範生日產生一份可比較的資料；全部由本地引擎計算，不代表任何真實人物。 */
export function buildDemoReportInput(): FateReportInput {
  const bazi = calculateBazi(DEMO_BIRTH);
  return {
    userFocus: ['all'],
    bazi,
    fiveElements: calculateFiveElements(bazi.pillars),
    zodiac: getZodiacResult(bazi.zodiac),
    astrology: calculateSunSign(DEMO_BIRTH.birthDate),
    numerology: calculateNumerology(DEMO_BIRTH.birthDate),
  };
}

export type { BarnumStatement, ColdReadingTechnique, TechniqueInfo } from '../data/barnum-statements';
export { TECHNIQUES };

export interface BarnumComparisonSet {
  label: 'A' | 'B';
  isReal: boolean;
  items: string[];
}

export interface BarnumComparison {
  sets: [BarnumComparisonSet, BarnumComparisonSet];
  genericStatements: BarnumStatement[];
}

/** 從一份真實命盤結果萃取幾句簡短的洞察，句型與長度盡量貼近巴納姆句，方便公平比較。 */
export function extractRealInsights(input: FateReportInput): string[] {
  const insights = [
    `日主${input.bazi.dayMaster}（${ELEMENT_LABELS[input.bazi.dayMasterElement]}）：${elementVibe(input.bazi.dayMasterElement)}。`,
    `${input.zodiac.animal}生肖：「${input.zodiac.positiveTraits[0]}」是你的招牌，也要留意「${input.zodiac.blindSpots[0]}」。`,
    `太陽${input.astrology.sunSign}：「${input.astrology.strengths[0]}」是你常被看見的一面。`,
    `生命靈數 ${input.numerology.lifePathNumber}（${input.numerology.title}）：目前的課題是「${input.numerology.challenges[0]}」。`,
  ];
  if (input.ziwei) {
    const soulPalace = input.ziwei.palaces.find((palace) => palace.name === '命宮');
    const stars = soulPalace?.majorStars.map((star) => star.name).join('、');
    insights.push(`紫微命主${input.ziwei.soul}${stars ? `，命宮坐${stars}` : '，命宮無主星，需借對宮'}。`);
  }
  return insights;
}

/** 從指定索引挑出巴納姆句（純函式，供測試使用固定索引）。 */
export function pickStatementsByIndex(indices: number[]): BarnumStatement[] {
  return indices.map((index) => BARNUM_STATEMENTS[((index % BARNUM_STATEMENTS.length) + BARNUM_STATEMENTS.length) % BARNUM_STATEMENTS.length]);
}

/** 隨機抽出指定數量、不重複的巴納姆句。 */
export function drawGenericStatements(count = 4): BarnumStatement[] {
  const values = new Uint32Array(count);
  crypto.getRandomValues(values);
  const pool = [...BARNUM_STATEMENTS];
  const picked: BarnumStatement[] = [];
  for (let index = 0; index < count && pool.length > 0; index += 1) {
    const pickIndex = values[index] % pool.length;
    picked.push(pool.splice(pickIndex, 1)[0]);
  }
  return picked;
}

/** 組出 A/B 兩組盲測資料；swap 決定真實資料落在哪一邊（外部傳入以利測試，實際使用時以亂數決定）。 */
export function buildComparison(realInsights: string[], genericStatements: BarnumStatement[], swapSides: boolean): BarnumComparison {
  const real: BarnumComparisonSet = { label: swapSides ? 'B' : 'A', isReal: true, items: realInsights };
  const generic: BarnumComparisonSet = { label: swapSides ? 'A' : 'B', isReal: false, items: genericStatements.map((statement) => statement.text) };
  const sets: [BarnumComparisonSet, BarnumComparisonSet] = swapSides ? [generic, real] : [real, generic];
  return { sets, genericStatements };
}

/** 建立一次完整的隨機盲測（實際頁面使用的進入點）。 */
export function drawComparison(realInsights: string[], count = 4): BarnumComparison {
  const swapBit = new Uint8Array(1);
  crypto.getRandomValues(swapBit);
  return buildComparison(realInsights, drawGenericStatements(count), (swapBit[0] & 1) === 1);
}

export function techniqueInfo(id: string): TechniqueInfo | undefined {
  return TECHNIQUES.find((technique) => technique.id === id);
}
