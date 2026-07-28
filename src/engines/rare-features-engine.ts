import { analyzeDayMaster } from './bazi-analysis-engine';
import { branchRelation, threeHarmonyGroups } from './bazi-relations-engine';
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
  | 'many-retrograde'
  | 'twin-major-stars'
  | 'mutagen-in-soul-palace'
  | 'body-equals-soul'
  | 'early-luck-start'
  | 'late-luck-start'
  | 'luck-clashes-day'
  | 'luck-completes-harmony'
  | 'grand-trine'
  | 't-square'
  | 'grand-cross'
  | 'unaspected-planet';

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


/**
 * 紫微命宮的結構。
 *
 * 命宮空著（無主星）已經另外處理；這裡看的是「有」的時候長什麼樣：
 * 幾顆主星、有沒有帶生年四化、身宮是不是也落在命宮。
 */
function ziweiPalaceFeatures(input: FateReportInput): DetectedFeature[] {
  const soulPalace = input.ziwei?.palaces.find((palace) => palace.name === '命宮');
  if (!soulPalace || soulPalace.majorStars.length === 0) return [];
  const found: DetectedFeature[] = [];

  if (soulPalace.majorStars.length >= 2) {
    found.push({
      id: 'twin-major-stars',
      label: '雙主星同宮',
      detail: `命宮坐${soulPalace.majorStars.map((star) => star.name).join('、')}`,
      meaning: '命宮同時坐了兩顆主星。傳統上會說這種人身上有兩套不同的行為模式，看情況換——別人覺得你前後不一致，你自己知道兩邊都是真的。',
    });
  }

  const mutagenStar = soulPalace.majorStars.find((star) => star.mutagen);
  if (mutagenStar) {
    found.push({
      id: 'mutagen-in-soul-palace',
      label: '生年四化入命',
      detail: `${mutagenStar.name}化${mutagenStar.mutagen}坐命宮`,
      meaning: `出生那年的四化剛好落在命宮。紫微把四化看成「把某顆星的力量放大或扭轉」，落在命宮就是直接作用在你身上，而不是繞過某個生活領域。`,
    });
  }

  if (soulPalace.isBodyPalace) {
    found.push({
      id: 'body-equals-soul',
      label: '身宮同命宮',
      detail: '身宮和命宮落在同一格',
      meaning: '紫微把命宮看成「你本來的樣子」、身宮看成「後天長成的樣子」，你這兩個重疊了。傳統上讀成「活得比較一致」——沒有那種前半生跟後半生像兩個人的落差。',
    });
  }

  return found;
}

/**
 * 大運：起運時間與大運跟本命的關係。
 *
 * 起運歲數由節氣距離決定，每個人不同；大運地支會不會沖到日支、
 * 會不會補齊一個三合局，也都是這張盤特有的。
 * 性別未指定時排不出大運，這一段就整個略過。
 */
function luckCycleFeatures(input: FateReportInput): DetectedFeature[] {
  const cycles = input.bazi.luckCycles ?? [];
  const start = input.bazi.luckStart;
  if (cycles.length === 0) return [];
  const found: DetectedFeature[] = [];

  if (start) {
    if (start.years <= 1) {
      found.push({
        id: 'early-luck-start',
        label: '起運極早',
        detail: `${start.years} 歲${start.months} 個月就起運`,
        meaning: '起運的歲數由出生到節氣的距離決定，你落在最早的一端。傳統上會說這種人很早就開始「照自己的運走」——講白一點，就是比同齡人早幾年遇到那些要自己扛的事。',
      });
    } else if (start.years >= 9) {
      found.push({
        id: 'late-luck-start',
        label: '起運極晚',
        detail: `${start.years} 歲${start.months} 個月才起運`,
        meaning: '起運的歲數由出生到節氣的距離決定，你落在最晚的一端。傳統上會說童年那段特別長——好處是慢熟，代價是同輩已經在跑了，你還在暖身。',
      });
    }
  }

  // 以下兩項掃的是「一輩子八步大運」，所以命中率天生就高：
  // 實測沖日支 44.2%、補齊三合 41.2%，都被門檻擋在外面，不會顯示。
  // 留著是因為這個數字本身值得記住——「你這步大運沖日支」聽起來很像在講你，
  // 其實接近丟銅板。真要講得準，得限定在「現在或下一步」那一步，不是整輩子。
  const dayBranch = input.bazi.pillars[2]?.branch;
  if (dayBranch) {
    const clashing = cycles.find((cycle) => branchRelation(cycle.ganZhi[1], dayBranch)?.kind === 'branch-clash');
    if (clashing) {
      found.push({
        id: 'luck-clashes-day',
        label: '大運沖日支',
        detail: `${clashing.ganZhi}大運（${clashing.startYear}–${clashing.endYear}）沖日支${dayBranch}`,
        meaning: `八字把日支看成「你自己和最親近的關係」，這十年的大運正好沖到它。傳統上讀成「這段時間變動大」——搬家、換工作、關係重組都算。當成一個提醒：那幾年做的決定，值得多留一份紀錄給以後的自己看。`,
      });
    }

    const natalBranches = input.bazi.pillars.map((pillar) => pillar.branch);
    const completing = cycles.find((cycle) => threeHarmonyGroups().some((group) => {
      if (!group.includes(cycle.ganZhi[1])) return false;
      const others = group.filter((branch) => branch !== cycle.ganZhi[1]);
      return others.every((branch) => natalBranches.includes(branch));
    }));
    if (completing) {
      found.push({
        id: 'luck-completes-harmony',
        label: '大運補齊三合',
        detail: `${completing.ganZhi}大運（${completing.startYear}–${completing.endYear}）補齊三合局`,
        meaning: '本命四柱裡有三合的兩個字，剛好被某一步大運補上第三個。傳統上會把那十年講成「本來散著的東西湊起來了」——比較實際的用法是：回頭看那段時間，你是不是真的在某件事上比較成形。',
      });
    }
  }

  return found;
}


/**
 * 星盤的相位圖形：三顆以上行星互相成相，構成一個幾何形狀。
 *
 * 占星把這些形狀看得比單一相位重，因為它們是「一整組」在運作。
 * 這裡只用本命盤已經算好的 aspects，不重算角度。
 */
function aspectPatternFeatures(input: FateReportInput): DetectedFeature[] {
  const aspects = input.astrology.aspects ?? [];
  const planets = input.astrology.planets ?? [];
  if (aspects.length === 0 || planets.length === 0) return [];
  const found: DetectedFeature[] = [];

  /** 兩顆行星之間是不是某一種相位。相位表沒有方向性，兩邊都要查。 */
  const hasAspect = (first: string, second: string, type: string): boolean =>
    aspects.some((aspect) => aspect.type === type
      && ((aspect.first === first && aspect.second === second)
        || (aspect.first === second && aspect.second === first)));

  const names = planets.map((planet) => planet.name);

  /**
   * 慢速行星走一圈要幾十年，所以由它們構成的圖形是「整代人共有」的。
   * 出現率算出來很低沒錯，但那是因為樣本橫跨七十年——同一個月出生的人多半都有。
   * 不講清楚的話，「每 167 個人有 1 個」會被讀成「你很特別」，那就是話術。
   */
  const SLOW_PLANETS = ['木星', '土星', '天王星', '海王星', '冥王星'];
  const generationalNote = (members: string[]): string => (
    members.every((name) => SLOW_PLANETS.includes(name))
      ? '這個圖形由走得慢的外行星構成，和你同一個月出生的人多半也有——它描述的是一整代，不是只有你。'
      : ''
  );

  // 大三角：三顆行星兩兩三分相。
  const trine = findTriple(names, (a, b, c) =>
    hasAspect(a, b, '三分相') && hasAspect(b, c, '三分相') && hasAspect(a, c, '三分相'));
  if (trine) {
    found.push({
      id: 'grand-trine',
      label: '大三角',
      detail: `${trine.join('、')}互成三分相`,
      meaning: `三顆行星兩兩成 120 度，圍成一個正三角形。占星上讀成「這三塊天生協調」——順到你不太會去鍛鍊它，因為它從來沒讓你吃過苦頭。${generationalNote(trine)}`,
    });
  }

  // T 三角：兩顆對分，第三顆同時四分這兩顆。
  const tSquare = findTriple(names, (a, b, c) =>
    hasAspect(a, b, '對分相') && hasAspect(a, c, '四分相') && hasAspect(b, c, '四分相'));
  if (tSquare) {
    found.push({
      id: 't-square',
      label: 'T 三角',
      detail: `${tSquare[0]}與${tSquare[1]}對分，${tSquare[2]}同時四分兩邊`,
      meaning: `兩顆行星正面對立，第三顆卡在中間跟兩邊都不對盤。占星上把它讀成「持續的推力」——這組張力不會自己消失，但也正因為它一直在推，這一塊通常是你最練得出來的地方。${generationalNote(tSquare)}`,
    });
  }

  // 大十字：四顆行星構成兩組對分，彼此又互成四分。
  const cross = findQuad(names, (a, b, c, d) =>
    hasAspect(a, c, '對分相') && hasAspect(b, d, '對分相')
    && hasAspect(a, b, '四分相') && hasAspect(b, c, '四分相')
    && hasAspect(c, d, '四分相') && hasAspect(a, d, '四分相'));
  if (cross) {
    found.push({
      id: 'grand-cross',
      label: '大十字',
      detail: `${cross.join('、')}構成兩組對分與四組四分`,
      meaning: `四顆行星圍成一個正方形，兩兩對立。占星上算是張力最滿的圖形——四個方向同時在拉，好處是動力足，代價是很難同時讓四邊都滿意。${generationalNote(cross)}`,
    });
  }

  // 無相位的個人行星：那顆星自己運作，不受其他行星調節。
  const personal = ['太陽', '月亮', '水星', '金星', '火星'];
  const unaspected = personal.find((name) => names.includes(name)
    && !aspects.some((aspect) => aspect.first === name || aspect.second === name));
  if (unaspected) {
    found.push({
      id: 'unaspected-planet',
      label: '無相位行星',
      detail: `${unaspected}沒有和任何行星成相`,
      meaning: `這顆星在你的盤上自己運作，沒有別的行星拉住它或幫它。占星上讀成「這一塊很純粹」——要嘛全開要嘛沒開，中間的調節檔位比較少。`,
    });
  }

  return found;
}

/** 找出第一組滿足條件的三顆行星。順序固定，同一張盤每次結果一樣。 */
function findTriple(names: string[], matches: (a: string, b: string, c: string) => boolean): string[] | undefined {
  for (let i = 0; i < names.length; i += 1) {
    for (let j = i + 1; j < names.length; j += 1) {
      for (let k = j + 1; k < names.length; k += 1) {
        if (matches(names[i], names[j], names[k])) return [names[i], names[j], names[k]];
        // T 三角的第三顆角色不同，三種排法都要試。
        if (matches(names[i], names[k], names[j])) return [names[i], names[k], names[j]];
        if (matches(names[j], names[k], names[i])) return [names[j], names[k], names[i]];
      }
    }
  }
  return undefined;
}

/** 找出第一組滿足條件的四顆行星。 */
function findQuad(names: string[], matches: (a: string, b: string, c: string, d: string) => boolean): string[] | undefined {
  for (let i = 0; i < names.length; i += 1) {
    for (let j = i + 1; j < names.length; j += 1) {
      for (let k = j + 1; k < names.length; k += 1) {
        for (let l = k + 1; l < names.length; l += 1) {
          const quad = [names[i], names[j], names[k], names[l]];
          if (matches(quad[0], quad[1], quad[2], quad[3])) return quad;
        }
      }
    }
  }
  return undefined;
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
    ...ziweiPalaceFeatures(input),
    ...luckCycleFeatures(input),
    ...astrologyFeatures(input),
    ...aspectPatternFeatures(input),
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
