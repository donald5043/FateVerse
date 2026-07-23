import type { BaziResult, ElementName, SeasonalStrengthState } from '../types/fate';
import { calculateHiddenStemWeights } from './bazi-strength-engine';
import { stemToElement } from './five-elements-engine';
import { ELEMENT_LABELS } from '../utils/constants';

export type DayMasterLevel = '強' | '偏強' | '中和' | '偏弱' | '弱';

export interface StrengthComponent {
  label: string;
  detail: string;
  score: number;
  side: 'support' | 'oppose';
}

export interface FavorableAdvice {
  element: ElementName;
  role: string;
  reason: string;
  color: string;
  direction: string;
  habit: string;
}

export interface DayMasterAnalysis {
  level: DayMasterLevel;
  ratio: number;
  supportScore: number;
  opposeScore: number;
  components: StrengthComponent[];
  favorable: FavorableAdvice[];
  unfavorable: ElementName[];
  plainSummary: string;
  seasonalNote?: string;
  caveat: string;
}

export interface YearFortune {
  year: number;
  ganZhi: string;
  stemElement: ElementName;
  category: TenGodCategory;
  match: 'favorable' | 'unfavorable' | 'neutral';
  reading: string;
}

export type TenGodCategory = '比劫' | '印星' | '食傷' | '財星' | '官殺';

const GENERATES: Record<ElementName, ElementName> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
const CONTROLS: Record<ElementName, ElementName> = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };

export function tenGodCategory(dayElement: ElementName, otherElement: ElementName): TenGodCategory {
  if (dayElement === otherElement) return '比劫';
  if (GENERATES[otherElement] === dayElement) return '印星';
  if (GENERATES[dayElement] === otherElement) return '食傷';
  if (CONTROLS[dayElement] === otherElement) return '財星';
  return '官殺';
}

const SEASON_BONUS: Record<SeasonalStrengthState, number> = { prosperous: 12, supportive: 8, resting: 4, imprisoned: 2, declining: 0 };
const SEASON_STATE_LABELS: Record<SeasonalStrengthState, string> = { prosperous: '旺', supportive: '相', resting: '休', imprisoned: '囚', declining: '死' };

const ELEMENT_PRACTICAL: Record<ElementName, { color: string; direction: string; habit: string }> = {
  wood: { color: '綠色、青色系', direction: '東方', habit: '接觸植物、晨間活動、安排學習與成長型計畫' },
  fire: { color: '紅色、紫色系', direction: '南方', habit: '曬太陽、規律運動、參與能被看見的活動' },
  earth: { color: '黃色、大地色系', direction: '本地與中部', habit: '固定作息、整理居家、腳踏實地的累積型工作' },
  metal: { color: '白色、金屬色系', direction: '西方', habit: '整理收納、精緻工藝、建立制度與紀律' },
  water: { color: '黑色、藍色系', direction: '北方', habit: '親近水域、閱讀思考、保持資訊流通與人脈交流' },
};

const FAVORABLE_ROLES: Record<TenGodCategory, { role: string; reason: string }> = {
  比劫: { role: '比劫（同伴）', reason: '日主偏弱時，同五行的能量像隊友，幫你分擔與壯膽' },
  印星: { role: '印星（滋養）', reason: '生助日主的五行像後勤補給，帶來學習、支持與安全感' },
  食傷: { role: '食傷（輸出）', reason: '日主偏強時，讓能量流出去——表達、創作、教學都是好出口' },
  財星: { role: '財星（成果）', reason: '把旺盛的能量拿去經營實際成果，忙得有方向' },
  官殺: { role: '官殺（磨練）', reason: '適度的規範與挑戰能把過剩的能量修成格局' },
};

function levelFromRatio(ratio: number): DayMasterLevel {
  if (ratio >= 0.62) return '強';
  if (ratio >= 0.54) return '偏強';
  if (ratio >= 0.46) return '中和';
  if (ratio >= 0.38) return '偏弱';
  return '弱';
}

const WINTER_BRANCHES = new Set(['亥', '子', '丑']);
const SUMMER_BRANCHES = new Set(['巳', '午', '未']);

export function analyzeDayMaster(bazi: BaziResult): DayMasterAnalysis {
  const dayElement = bazi.dayMasterElement;
  const components: StrengthComponent[] = [];
  let supportScore = 0;
  let opposeScore = 0;
  const add = (label: string, detail: string, score: number, side: 'support' | 'oppose', keepZero = false) => {
    if (score <= 0 && !keepZero) return;
    components.push({ label, detail, score: Math.round(score * 10) / 10, side });
    if (side === 'support') supportScore += score;
    else opposeScore += score;
  };

  const dayState = bazi.seasonStrength.states[dayElement];
  add('月令', `月支${bazi.seasonStrength.monthBranch}屬${bazi.seasonStrength.season}令，日主${ELEMENT_LABELS[dayElement]}為「${SEASON_STATE_LABELS[dayState]}」`, SEASON_BONUS[dayState], 'support', true);

  bazi.pillars.forEach((pillar) => {
    if (pillar.label !== '日柱') {
      const element = stemToElement(pillar.stem);
      const category = tenGodCategory(dayElement, element);
      const supportive = category === '比劫' || category === '印星';
      add(`${pillar.label}天干`, `${pillar.stem}（${ELEMENT_LABELS[element]}·${category}）`, 10, supportive ? 'support' : 'oppose');
    }
    const weights = pillar.hiddenStemWeights?.length ? pillar.hiddenStemWeights : calculateHiddenStemWeights(pillar.branch, pillar.hiddenStems, pillar.hiddenTenGods);
    const multiplier = pillar.label === '月柱' ? 1.5 : 1;
    let pillarSupport = 0;
    let pillarOppose = 0;
    const supportStems: string[] = [];
    const opposeStems: string[] = [];
    weights.forEach((item) => {
      const category = tenGodCategory(dayElement, item.element);
      const points = (item.weight / 100) * 10 * multiplier;
      if (category === '比劫' || category === '印星') { pillarSupport += points; supportStems.push(`${item.stem}${category}`); }
      else { pillarOppose += points; opposeStems.push(`${item.stem}${category}`); }
    });
    add(`${pillar.label}藏干`, `${pillar.branch}中${supportStems.join('、') || '無幫身氣'}${multiplier > 1 ? '（月支加權）' : ''}`, pillarSupport, 'support');
    add(`${pillar.label}藏干`, `${pillar.branch}中${opposeStems.join('、') || '無耗剋氣'}${multiplier > 1 ? '（月支加權）' : ''}`, pillarOppose, 'oppose');
  });

  const total = supportScore + opposeScore;
  const ratio = total > 0 ? supportScore / total : 0.5;
  const level = levelFromRatio(ratio);

  const advise = (element: ElementName): FavorableAdvice => {
    const category = tenGodCategory(dayElement, element);
    const { role, reason } = FAVORABLE_ROLES[category];
    const practical = ELEMENT_PRACTICAL[element];
    return { element, role, reason, ...practical };
  };

  let favorable: FavorableAdvice[] = [];
  let unfavorable: ElementName[] = [];
  if (level === '強' || level === '偏強') {
    favorable = [GENERATES[dayElement], CONTROLS[dayElement], Object.entries(CONTROLS).find(([, target]) => target === dayElement)![0] as ElementName].map(advise);
    unfavorable = [dayElement, Object.entries(GENERATES).find(([, target]) => target === dayElement)![0] as ElementName];
  } else if (level === '弱' || level === '偏弱') {
    favorable = [Object.entries(GENERATES).find(([, target]) => target === dayElement)![0] as ElementName, dayElement].map(advise);
    unfavorable = [Object.entries(CONTROLS).find(([, target]) => target === dayElement)![0] as ElementName, GENERATES[dayElement]];
  }

  let seasonalNote: string | undefined;
  const monthBranch = bazi.seasonStrength.monthBranch;
  if (WINTER_BRANCHES.has(monthBranch)) {
    seasonalNote = `你出生在冬季（${monthBranch}月），傳統調候的講法是「寒木向陽」——不論強弱，適度的火（溫暖、活力、光照）對整體氣氛都有幫助。`;
    if (!favorable.some((item) => item.element === 'fire') && !unfavorable.includes('fire')) favorable = [...favorable, { ...advise('fire'), role: '調候（暖局）', reason: '冬季出生，傳統上以火調和寒氣' }];
  } else if (SUMMER_BRANCHES.has(monthBranch)) {
    seasonalNote = `你出生在夏季（${monthBranch}月），傳統調候的講法是「炎夏喜潤」——適度的水（沉澱、滋潤、冷靜）能讓整體不過燥。`;
    if (!favorable.some((item) => item.element === 'water') && !unfavorable.includes('water')) favorable = [...favorable, { ...advise('water'), role: '調候（潤局）', reason: '夏季出生，傳統上以水調和燥氣' }];
  }

  const percent = Math.round(ratio * 100);
  const levelPlain: Record<DayMasterLevel, string> = {
    強: `幫身的力量明顯多於耗剋（約 ${percent}%），白話說：你的能量供給充足，與其再補，不如把力氣往外用——輸出、承擔、經營成果都是好方向。`,
    偏強: `幫身的力量略多於耗剋（約 ${percent}%），白話說：底氣算足，可以放心接挑戰，同時留意別讓自我主張太滿。`,
    中和: `幫身與耗剋大致平衡（約 ${percent}%），白話說：這是傳統上最舒服的狀態，重點不是補什麼，而是維持現在的流通與平衡。`,
    偏弱: `耗剋的力量略多於幫身（約 ${percent}%），白話說：輸出管道多、補給相對少，記得把學習、休息和支持系統當正事。`,
    弱: `耗剋的力量明顯多於幫身（約 ${percent}%），白話說：你常常在「被需要」的位置消耗，優先幫自己補血——找後盾、練基本功、拒絕過載。`,
  };

  return {
    level,
    ratio,
    supportScore: Math.round(supportScore * 10) / 10,
    opposeScore: Math.round(opposeScore * 10) / 10,
    components,
    favorable,
    unfavorable,
    plainSummary: `綜合月令、天干與地支藏干來看，你的日主${bazi.dayMaster}（${ELEMENT_LABELS[dayElement]}）屬於「${level}」。${levelPlain[level]}`,
    seasonalNote,
    caveat: '強弱判定採 FateVerse 公開的計分規則（月令加成、天干各 10 分、藏干依比例計分、月支加權 1.5 倍），與各流派手工論命可能不同；喜用神為扶抑法加基本調候的簡化版本，格局、化氣與特殊格未納入，僅供文化參考。',
  };
}

const YEAR_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const YEAR_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export function yearGanZhi(year: number): string {
  const stemIndex = ((year - 4) % 10 + 10) % 10;
  const branchIndex = ((year - 4) % 12 + 12) % 12;
  return `${YEAR_STEMS[stemIndex]}${YEAR_BRANCHES[branchIndex]}`;
}

const CATEGORY_READINGS: Record<TenGodCategory, string> = {
  比劫: '同輩與自我主張的一年：容易遇到競爭也容易找到戰友，適合經營人脈與合作，同時看緊自己的資源和立場。',
  印星: '學習與貴人的一年：適合進修、考試、打基礎，長輩或資深者的幫助會特別明顯，步調可以放穩。',
  食傷: '表現與輸出的一年：想法多、表達慾強，適合發表作品、展現才華，開口前多想一秒可以省很多麻煩。',
  財星: '財務與成果的一年：機會偏向實質報酬，適合把努力變現，也要注意別為了貪多而過勞。',
  官殺: '責任與壓力的一年：容易被賦予重任或面對新規範，扛得起來就是升級年，記得照顧身心、留緩衝。',
};

export function calculateYearFortunes(bazi: BaziResult, analysis: DayMasterAnalysis, startYear: number, count = 3): YearFortune[] {
  return Array.from({ length: count }, (_, offset) => {
    const year = startYear + offset;
    const ganZhi = yearGanZhi(year);
    const stemElement = stemToElement(ganZhi[0]);
    const category = tenGodCategory(bazi.dayMasterElement, stemElement);
    const match: YearFortune['match'] = analysis.favorable.some((item) => item.element === stemElement)
      ? 'favorable'
      : analysis.unfavorable.includes(stemElement) ? 'unfavorable' : 'neutral';
    const matchText = match === 'favorable'
      ? `這年天干屬${ELEMENT_LABELS[stemElement]}，剛好是你的喜用五行，順風成分較高。`
      : match === 'unfavorable'
        ? `這年天干屬${ELEMENT_LABELS[stemElement]}，是你相對辛苦的五行，行程多留餘裕。`
        : '';
    return {
      year,
      ganZhi,
      stemElement,
      category,
      match,
      reading: `${year} 年（${ganZhi}）天干對你的日主來說是「${category}」。${CATEGORY_READINGS[category]}${matchText}`,
    };
  });
}
