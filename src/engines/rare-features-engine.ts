import { analyzeDayMaster } from './bazi-analysis-engine';
import { getBirthCards } from './tarot-engine';
import { RARE_FEATURE_RATES } from '../data/rare-feature-rates';
import { ELEMENT_LABELS } from '../utils/constants';
import type { ElementName, FateReportInput } from '../types/fate';

/**
 * 罕見特徵：這張盤上真正少見的地方。
 *
 * 前面幾輪都在「拿掉不該說的話」——把對沖語、自我說明、資料不支持的斷言清掉。
 * 這個引擎做相反的事：**把原本被平均講過去的東西挑出來**。
 *
 * 一份報告如果每一段都用同樣的力道講話，讀起來就沒有重點。三合局、天干五合、
 * 命宮無主星這些東西，多數人沒有；有的人如果只看到和別人一樣的敘述，
 * 那份報告就白算了。
 *
 * 關鍵原則：**稀有度是量出來的，不是宣稱的。** 每個特徵的出現率都由
 * `scripts/measure-rare-features.ts` 跑過 500 組合成命盤實測，寫進
 * `src/data/rare-feature-rates.ts`。說「大約 6% 的人有」必須真的是 6%，
 * 否則這個功能就變成它想避免的那種話術。
 */

export type RareFeatureId =
  | 'three-harmony'
  | 'three-meeting'
  | 'stem-combination'
  | 'missing-element'
  | 'all-five-elements'
  | 'day-master-extreme'
  | 'master-number'
  | 'same-birth-cards'
  | 'empty-soul-palace'
  | 'stellium'
  | 'sun-moon-same-sign'
  | 'all-yang'
  | 'all-yin'
  | 'many-retrograde';

/** 偵測結果本身不含稀有度——稀有度是事後由實測資料貼上去的。 */
export interface DetectedFeature {
  id: RareFeatureId;
  /** 特徵名稱，例如「三合局」。 */
  label: string;
  /** 這張盤上的實際內容，例如「寅午戌三合」。 */
  detail: string;
  /** 傳統上怎麼看這件事，用白話講。 */
  meaning: string;
}

export interface RareFeature extends DetectedFeature {
  /** 實測出現率（0–1）。 */
  rate: number;
}

/** 出現率高於這個值就不算罕見，不必特別點出來。 */
export const RARE_THRESHOLD = 0.25;

function elementLabelOf(element: ElementName): string {
  return ELEMENT_LABELS[element];
}

/** 四柱裡的干支關係。三合、三會、天干五合都需要特定組合，不是每張盤都有。 */
function baziRelationFeatures(input: FateReportInput): DetectedFeature[] {
  const found: DetectedFeature[] = [];
  const relations = input.bazi.relations ?? [];

  const threeHarmony = relations.find((relation) => relation.kind === 'branch-three-harmony');
  if (threeHarmony) {
    found.push({
      id: 'three-harmony',
      label: '三合局',
      detail: `${threeHarmony.members.join('')}三合`,
      meaning: '三個地支湊成一組，傳統上算是四柱裡最緊的結構之一。它的意思是這股力量在你身上不是零散的，而是有一整套在運作——好處是這一塊特別順，代價是不太容易改。',
    });
  }

  const threeMeeting = relations.find((relation) => relation.kind === 'branch-three-meeting');
  if (threeMeeting) {
    found.push({
      id: 'three-meeting',
      label: '三會局',
      detail: `${threeMeeting.members.join('')}三會`,
      meaning: '三個同一季節的地支聚在一起，力量比三合更集中。傳統上會說這種盤的個性很難被稀釋——別人講什麼，你大概還是照自己的方式來。',
    });
  }

  const stemCombination = relations.find((relation) => relation.kind === 'stem-combination');
  if (stemCombination) {
    found.push({
      id: 'stem-combination',
      label: '天干五合',
      detail: `${stemCombination.members.join('')}合`,
      meaning: '兩個天干互相牽住。傳統上把它讀成「有一股力量會拉著你往某個方向靠」——可能是某種關係，也可能是某種責任，重點是它不完全由你決定。',
    });
  }

  return found;
}

const YANG_STEMS = '甲丙戊庚壬';
const YANG_BRANCHES = '子寅辰午申戌';

/**
 * 純陽／純陰：八個字的陰陽完全一致。傳統上是會被特別點出來的格局。
 */
function polarityFeature(input: FateReportInput): DetectedFeature[] {
  const pillars = input.bazi.pillars;
  if (pillars.length < 4) return [];
  const polarities = pillars.flatMap((pillar) => [
    YANG_STEMS.includes(pillar.stem),
    YANG_BRANCHES.includes(pillar.branch),
  ]);
  if (polarities.every((isYang) => isYang)) {
    return [{
      id: 'all-yang',
      label: '純陽',
      detail: '四柱八個字全是陽',
      meaning: '八個字沒有一個陰。傳統上把純陽的盤讀成「往外、主動、直來直往」——優點是不拖，代價是比較少停下來感覺別人怎麼想。',
    }];
  }
  if (polarities.every((isYang) => !isYang)) {
    return [{
      id: 'all-yin',
      label: '純陰',
      detail: '四柱八個字全是陰',
      meaning: '八個字沒有一個陽。傳統上把純陰的盤讀成「往內、細膩、先想過再動」——想得周到，但常常想完就錯過了動手的時機。',
    }];
  }
  return [];
}

/** 五行有沒有缺、或者剛好齊全。 */
function elementCoverageFeatures(input: FateReportInput): DetectedFeature[] {
  const entries = Object.entries(input.fiveElements.percentages) as [ElementName, number][];
  const missing = entries.filter(([, value]) => value === 0).map(([element]) => element);

  if (missing.length > 0) {
    return [{
      id: 'missing-element',
      label: '五行缺一',
      detail: `四柱裡完全沒有${missing.map(elementLabelOf).join('、')}`,
      meaning: `不是缺陷，是這類做事方式從來不是你的預設值。傳統做法是刻意去補；比較實際的做法是：知道自己不擅長${missing.map(elementLabelOf).join('、')}那一路，就別把那種任務攬在身上硬撐。`,
    }];
  }

  return [{
    id: 'all-five-elements',
    label: '五行俱全',
    detail: '四柱裡五行都有',
    meaning: '五個都湊齊，傳統上算是配置完整。實際的感覺通常是：你什麼場合都接得住，但也比較難說自己「就是哪一種人」。',
  }];
}

/** 日主強弱走到兩端。多數人落在中間。 */
function dayMasterFeature(input: FateReportInput): DetectedFeature[] {
  const analysis = analyzeDayMaster(input.bazi);
  if (analysis.level !== '強' && analysis.level !== '弱') return [];
  return [{
    id: 'day-master-extreme',
    label: `日主${analysis.level}`,
    detail: `日主${input.bazi.dayMaster}${elementLabelOf(input.bazi.dayMasterElement)}判為「${analysis.level}」`,
    meaning: analysis.level === '強'
      ? '多數人的日主落在中間，你在偏強那一端。傳統上會說這種人自己就撐得住，不太需要別人推——反過來說，也不太聽得進去別人推。'
      : '多數人的日主落在中間，你在偏弱那一端。傳統上會說這種人需要環境和人的支撐，這不是體質差，是你本來就適合團隊而不是單打。',
  }];
}

function numerologyFeature(input: FateReportInput): DetectedFeature[] {
  if (!input.numerology.isMasterNumber) return [];
  return [{
    id: 'master-number',
    label: '大師數',
    detail: `生命靈數 ${input.numerology.lifePathNumber}`,
    meaning: '生命靈數落在 11、22、33 這三個不化約的數字上。這套系統把它讀成「標準訂得比較高的一組」——好聽是願景大，難聽是很難對自己滿意。',
  }];
}

function tarotFeature(input: FateReportInput): DetectedFeature[] {
  const cards = getBirthCards(input.numerology.birthDateDigits);
  if (!cards.samePersonalityAndSoul) return [];
  return [{
    id: 'same-birth-cards',
    label: '人格牌＝靈魂牌',
    detail: `兩張都是${cards.personality.name}`,
    meaning: '生日塔羅算出來的兩張牌重疊了。這套系統把它讀成「你給人的樣子和你自己認定的樣子是同一個」——不用演，但也沒什麼地方可以躲。',
  }];
}

function ziweiFeature(input: FateReportInput): DetectedFeature[] {
  const soulPalace = input.ziwei?.palaces.find((palace) => palace.name === '命宮');
  if (!soulPalace || soulPalace.majorStars.length > 0) return [];
  return [{
    id: 'empty-soul-palace',
    label: '命宮無主星',
    detail: '命宮裡沒有十四主星',
    meaning: '紫微的命宮空著，要借對宮來看。傳統上這種盤被說成「可塑性高」——講白一點就是你比較容易被環境和身邊的人塑形，換個圈子就換一種樣子。',
  }];
}

/** 西洋星盤：三顆以上行星擠在同一個星座，或日月同座。 */
function astrologyFeatures(input: FateReportInput): DetectedFeature[] {
  const planets = input.astrology.planets ?? [];
  if (planets.length === 0) return [];
  const found: DetectedFeature[] = [];

  const bySign = new Map<string, string[]>();
  planets.forEach((planet) => {
    bySign.set(planet.sign, [...(bySign.get(planet.sign) ?? []), planet.name]);
  });
  const crowded = [...bySign.entries()].filter(([, list]) => list.length >= 3)
    .sort((left, right) => right[1].length - left[1].length)[0];
  if (crowded) {
    found.push({
      id: 'stellium',
      label: '星群集中',
      detail: `${crowded[1].join('、')}都在${crowded[0]}`,
      meaning: `${crowded[1].length} 顆行星擠在同一個星座。占星上會說這個星座的特質在你身上被放到很大——別人可能只有一點，你是整片。`,
    });
  }

  const retrograde = planets.filter((planet) => planet.retrograde);
  if (retrograde.length >= 4) {
    found.push({
      id: 'many-retrograde',
      label: '多顆逆行',
      detail: `${retrograde.map((planet) => planet.name).join('、')}都逆行`,
      meaning: `出生時有 ${retrograde.length} 顆行星在逆行。占星上讀成「這些領域你得自己繞一圈才學得會」——別人照著做就行的事，你偏偏要先弄懂為什麼。`,
    });
  }

  const sun = planets.find((planet) => planet.name === '太陽');
  const moon = planets.find((planet) => planet.name === '月亮');
  if (sun && moon && sun.sign === moon.sign) {
    found.push({
      id: 'sun-moon-same-sign',
      label: '日月同座',
      detail: `太陽和月亮都在${sun.sign}`,
      meaning: '太陽和月亮落在同一個星座，代表你出生在新月前後。占星上讀成「想要的和需要的是同一件事」——不太會內耗，但也少了一個能拉住自己的反面。',
    });
  }

  return found;
}

/** 跑過所有偵測器。量測腳本用這個，它不需要（產生它的時候也還沒有）稀有度。 */
export function detectFeatures(input: FateReportInput): DetectedFeature[] {
  return [
    ...baziRelationFeatures(input),
    ...polarityFeature(input),
    ...elementCoverageFeatures(input),
    ...dayMasterFeature(input),
    ...numerologyFeature(input),
    ...tarotFeature(input),
    ...ziweiFeature(input),
    ...astrologyFeatures(input),
  ];
}

/**
 * 找出這張盤上真正少見的地方，稀有的排前面。
 *
 * @param input 命盤
 * @param limit 最多回傳幾項。全部列出來會變成另一種流水帳。
 */
export function detectRareFeatures(input: FateReportInput, limit = 4): RareFeature[] {
  return detectFeatures(input)
    .map((feature) => ({ ...feature, rate: RARE_FEATURE_RATES[feature.id] ?? 1 }))
    .filter((feature) => feature.rate > 0 && feature.rate <= RARE_THRESHOLD)
    .sort((left, right) => left.rate - right.rate)
    .slice(0, limit);
}

/** 出現率講成人話。「6%」對多數人沒有體感，「大約每 16 個人有 1 個」有。 */
export function describeRate(rate: number): string {
  const percent = Math.round(rate * 100);
  if (percent <= 0) return '在我們的樣本裡沒有出現過';
  const oneIn = Math.round(1 / rate);
  if (oneIn >= 3) return `大約每 ${oneIn} 個人有 1 個`;
  return `大約 ${percent}% 的人有`;
}
