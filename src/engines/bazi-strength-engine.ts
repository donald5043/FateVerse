import type {
  BaziHiddenStemWeight, BaziSeasonStrength, ElementName, SeasonalStrengthState,
} from '../types/fate';
import { stemToElement } from './five-elements-engine';

const HIDDEN_STEM_WEIGHTS: Record<string, Record<string, number>> = {
  子: { 癸: 100 },
  丑: { 己: 60, 癸: 30, 辛: 10 },
  寅: { 甲: 60, 丙: 30, 戊: 10 },
  卯: { 乙: 100 },
  辰: { 戊: 60, 乙: 30, 癸: 10 },
  巳: { 丙: 60, 戊: 30, 庚: 10 },
  午: { 丁: 70, 己: 30 },
  未: { 己: 60, 丁: 30, 乙: 10 },
  申: { 庚: 60, 壬: 30, 戊: 10 },
  酉: { 辛: 100 },
  戌: { 戊: 60, 辛: 30, 丁: 10 },
  亥: { 壬: 70, 甲: 30 },
};

const SEASON_BY_BRANCH: Record<string, { season: string; order: ElementName[] }> = {
  寅: { season: '春', order: ['wood', 'fire', 'water', 'metal', 'earth'] },
  卯: { season: '春', order: ['wood', 'fire', 'water', 'metal', 'earth'] },
  巳: { season: '夏', order: ['fire', 'earth', 'wood', 'water', 'metal'] },
  午: { season: '夏', order: ['fire', 'earth', 'wood', 'water', 'metal'] },
  申: { season: '秋', order: ['metal', 'water', 'earth', 'fire', 'wood'] },
  酉: { season: '秋', order: ['metal', 'water', 'earth', 'fire', 'wood'] },
  亥: { season: '冬', order: ['water', 'wood', 'metal', 'earth', 'fire'] },
  子: { season: '冬', order: ['water', 'wood', 'metal', 'earth', 'fire'] },
  辰: { season: '四季土', order: ['earth', 'metal', 'fire', 'wood', 'water'] },
  戌: { season: '四季土', order: ['earth', 'metal', 'fire', 'wood', 'water'] },
  丑: { season: '四季土', order: ['earth', 'metal', 'fire', 'wood', 'water'] },
  未: { season: '四季土', order: ['earth', 'metal', 'fire', 'wood', 'water'] },
};

const STATES: SeasonalStrengthState[] = ['prosperous', 'supportive', 'resting', 'imprisoned', 'declining'];

export function calculateHiddenStemWeights(branch: string, hiddenStems: string[], hiddenTenGods: string[]): BaziHiddenStemWeight[] {
  const table = HIDDEN_STEM_WEIGHTS[branch] ?? {};
  const fallbackWeight = hiddenStems.length ? Math.round(100 / hiddenStems.length) : 0;
  return hiddenStems.map((stem, index) => ({
    stem,
    element: stemToElement(stem),
    tenGod: hiddenTenGods[index] ?? '未標示',
    weight: table[stem] ?? fallbackWeight,
    role: index === 0 ? 'main' : index === 1 ? 'middle' : 'residual',
  }));
}

export function calculateSeasonStrength(monthBranch: string): BaziSeasonStrength {
  const config = SEASON_BY_BRANCH[monthBranch];
  if (!config) throw new Error('月支無法對應季節旺衰資料。');
  const states = Object.fromEntries(config.order.map((element, index) => [element, STATES[index]])) as Record<ElementName, SeasonalStrengthState>;
  return {
    monthBranch,
    season: config.season,
    states,
    note: '旺相休囚死為依月支建立的季節參考；不等同日主強弱、格局、喜用神或事件吉凶。',
  };
}
