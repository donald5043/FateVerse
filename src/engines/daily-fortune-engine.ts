import { Solar } from 'lunar-javascript';
import { analyzeDayMaster, tenGodCategory, type TenGodCategory } from './bazi-analysis-engine';
import { stemToElement } from './five-elements-engine';
import { ELEMENT_LABELS } from '../utils/constants';
import type { BaziResult, ElementName } from '../types/fate';

/**
 * 今日與你：本命盤 × 當日干支的每日解讀。
 *
 * 與既有的「今日指引」（66 張靜態卡、依日期抽取、與命盤無關）並存，不取代它。
 * 純函式、決定論：同一命盤 + 同一日期永遠得到完全相同的輸出，不使用亂數。
 * 全程本機計算，可離線運作。
 *
 * 刻意不輸出分數或星等——偽精確會傷害可信度，只用描述性分類。
 */

/** 當日五行與本命喜用的關係。 */
export type ElementRelation = 'support' | 'drain' | 'neutral';

export interface DailyFortune {
  /** 查詢的日期（YYYY-MM-DD）。 */
  date: string;
  /** 當日干支，例如「辛丑」。 */
  dayPillar: string;
  /** 當日天干的五行。 */
  dayElement: ElementName;
  /** 當日五行 vs 本命喜用的關係。 */
  elementRelation: ElementRelation;
  /** 上述關係的白話說明。 */
  relationExplanation: string;
  /** 當日天干對本命日主的十神類別。 */
  tenGodCategory: TenGodCategory;
  /** 一句可執行、可驗證的具體建議。 */
  behaviorAdvice: string;
  /** 一句提醒。 */
  watchOut: string;
}

/** 以日期做決定論選樣，取代亂數。 */
function dateSeed(date: Date): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

function pick<T>(variants: readonly T[], seed: number): T {
  return variants[seed % variants.length];
}

const RELATION_EXPLANATION: Record<ElementRelation, readonly string[]> = {
  support: [
    '今天的日干走的是你命裡缺的那一塊，做起事來比平常省力。',
    '當日五行正好補在你本命偏少的位置，狀態會比昨天順一點。',
  ],
  drain: [
    '今天的日干加重你本命已經偏多的那一面，容易用力過頭。',
    '當日五行和你命裡已經很滿的部分同一路，踩煞車比踩油門重要。',
  ],
  neutral: [
    '今天的日干和你的喜忌都沒有直接關係，是張白紙般的一天。',
    '當日五行對你的本命結構沒有明顯偏向，怎麼過取決於你自己安排。',
  ],
};

/**
 * 每個 elementRelation × tenGodCategory 組合各備兩種以上變體，依日期決定論選用，
 * 避免連續幾天讀起來一樣。建議一律寫成「可以驗證有沒有做到」的行為。
 */
const ADVICE: Record<ElementRelation, Record<TenGodCategory, readonly string[]>> = {
  support: {
    比劫: [
      '把一件你獨力扛太久的事，今天開口找一個人分擔。',
      '約一個同輩聊三十分鐘，講你手上正在做的事。',
      '今天把某件事的分工寫下來，標清楚哪一段不是你的。',
    ],
    印星: [
      '今天讀完一份擱置很久的資料，讀完寫三行摘要。',
      '把想學的東西排進行事曆，訂在這週內的某個具體時段。',
      '找一位比你資深的人問一個你卡住的問題。',
    ],
    食傷: [
      '把手上的想法做出一個能給別人看的版本，哪怕很粗糙。',
      '今天寫或講出一段完整的東西，不要停在腦裡。',
      '挑一件做到一半的作品，今天推進到可以交出去。',
    ],
    財星: [
      '把一筆拖著的帳或報價今天結掉。',
      '盤點手上的資源，列出三件現在就能換成成果的。',
      '今天談一件跟錢有關的事，把數字講明確。',
    ],
    官殺: [
      '主動把一件責任接下來，並當場說清楚你負責到哪裡。',
      '今天回覆那封你一直沒回的正式信件。',
      '把一個模糊的承諾改寫成有日期的版本。',
    ],
  },
  drain: {
    比劫: [
      '今天先不比較。看到別人的進度就關掉頁面，做自己那一段。',
      '把想要爭的那件事延到明天再談，今天只收集事實。',
      '今天答應任何合作之前，先隔一晚再回覆。',
    ],
    印星: [
      '今天少收一點資訊。把待讀清單關掉，先做完手上那件。',
      '停止再查資料，用現在手上的版本做決定。',
      '今天不開新的學習計畫，把已經開的那個做完一段。',
    ],
    食傷: [
      '今天說出口之前先寫下來，寫完再決定要不要送出。',
      '重要訊息晚一小時再發，發之前重讀一次。',
      '今天克制想解釋的衝動，先聽完對方講完整句。',
    ],
    財星: [
      '今天不做非必要的大額支出，想買的東西放進清單隔天再看。',
      '把預算上限先寫下來再開始談，超過就停。',
      '今天檢查一筆自動扣款，確認還需不需要。',
    ],
    官殺: [
      '重要決策往後拖一小時再拍板，中間去走一走。',
      '今天不接新的責任，先把已經答應的收尾。',
      '面對壓力先寫下最壞情況，再決定要不要現在處理。',
    ],
  },
  neutral: {
    比劫: [
      '今天找一個人核對你手上的判斷，聽他哪裡不同意。',
      '把這週要跟人協作的事，今天先講清楚各自負責什麼。',
    ],
    印星: [
      '今天花二十分鐘整理筆記或檔案，整理完就停。',
      '挑一個你一直覺得懂但說不清楚的概念，今天寫給自己看。',
    ],
    食傷: [
      '今天做一件會留下成品的事，做完存檔。',
      '把一個念頭寫成三句話，明天再看還成不成立。',
    ],
    財星: [
      '今天記一次帳，把昨天的支出補齊。',
      '列出手上三個資源，標出哪一個最久沒用。',
    ],
    官殺: [
      '今天把一件待辦排進行事曆，寫上時間不寫「有空再做」。',
      '檢查這週的承諾清單，刪掉一個做不到的。',
    ],
  },
};

const WATCH_OUT: Record<ElementRelation, readonly string[]> = {
  support: [
    '順的時候最容易一口氣攬太多，記得留一段空白。',
    '狀態好不等於判斷準，重要的事還是要查核。',
  ],
  drain: [
    '硬撐的成本今天特別高，累了就停，不用證明什麼。',
    '情緒上來時先離開現場，話晚點再說。',
  ],
  neutral: [
    '沒有特別的順逆，所以今天的結果比較誠實反映你的安排。',
    '平淡的一天最適合處理那件你一直在躲的小事。',
  ],
};

/**
 * 計算某一天與本命盤的關係。
 *
 * @param chart 本命八字
 * @param date  要查詢的日期（本地時間）
 */
export function computeDailyFortune(chart: BaziResult, date: Date): DailyFortune {
  // 取正午避免晚子時歸日的邊界爭議。日柱改由已納入型別宣告的 EightChar 取得，
  // 與 Lunar.getDayInGanZhi() 在 120 天抽樣中完全一致。
  const eightChar = Solar.fromYmdHms(date.getFullYear(), date.getMonth() + 1, date.getDate(), 12, 0, 0)
    .getLunar()
    .getEightChar();
  const dayPillar = eightChar.getDay();
  const dayStem = eightChar.getDayGan();
  const dayElement = stemToElement(dayStem);

  // 喜用神需自行計算：DayMasterAnalysis 不在 FateReportInput 裡。
  const analysis = analyzeDayMaster(chart);
  const favorable = analysis.favorable.map((item) => item.element);
  const unfavorable = analysis.unfavorable;

  const elementRelation: ElementRelation = favorable.includes(dayElement)
    ? 'support'
    : unfavorable.includes(dayElement)
      ? 'drain'
      : 'neutral';

  const category = tenGodCategory(chart.dayMasterElement, dayElement);
  const seed = dateSeed(date);

  const relationLabel = ELEMENT_LABELS[dayElement];
  const relationExplanation = `今天是${dayPillar}日，日干${dayStem}屬${relationLabel}。`
    + pick(RELATION_EXPLANATION[elementRelation], seed);

  return {
    date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    dayPillar,
    dayElement,
    elementRelation,
    relationExplanation,
    tenGodCategory: category,
    behaviorAdvice: pick(ADVICE[elementRelation][category], seed),
    watchOut: pick(WATCH_OUT[elementRelation], seed),
  };
}

/** 關係的中文標籤，供 UI 顯示。刻意是描述性分類，不是分數。 */
export const RELATION_LABELS: Record<ElementRelation, string> = {
  support: '順手',
  drain: '耗力',
  neutral: '中性',
};
