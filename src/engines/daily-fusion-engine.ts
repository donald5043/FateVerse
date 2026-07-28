import { Solar } from 'lunar-javascript';
import { branchRelation } from './bazi-relations-engine';
import { computeDailyFortune } from './daily-fortune-engine';
import { computeDailyHoroscope } from './daily-horoscope-engine';
import { drawDailyCard } from './tarot-engine';
import { calculateZiwei } from './ziwei-engine';
import type { FateReportInput, ProfileInput } from '../types/fate';

/**
 * 今日綜合：把五套系統對「今天」的說法並排，然後看它們同不同意。
 *
 * 這是整站主張的濃縮版——不同文化各講各的，重點不在哪一套準，
 * 而在它們一致的時候你會特別想聽，分歧的時候你選了相信哪一個。
 *
 * 所以這裡不做加權平均，也不給總分。分歧就說分歧。
 */

/** 每套系統對今天只表態三種：順、卡、平。不是分數。 */
export type DayTone = 'smooth' | 'friction' | 'neutral';

export interface DailySignal {
  system: string;
  tone: DayTone;
  /** 這套系統今天算出來的東西，例如「壬寅日 · 食傷」。 */
  label: string;
  /** 一句話說它在講什麼。 */
  note: string;
}

export interface DailyFusion {
  /** YYYY-MM-DD */
  date: string;
  signals: DailySignal[];
  /** 綜合起來一句話。 */
  headline: string;
  /** 系統之間同不同意。 */
  agreement: 'aligned' | 'split' | 'quiet';
  /** 收尾：把選擇權交還給使用者。 */
  closing: string;
}

export const TONE_LABELS: Record<DayTone, string> = {
  smooth: '順',
  friction: '卡',
  neutral: '平',
};

function toDateKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** 今天的日支。用來對本命年支（生肖）。 */
function dayBranchOf(date: Date): string {
  return Solar.fromYmdHms(date.getFullYear(), date.getMonth() + 1, date.getDate(), 12, 0, 0)
    .getLunar().getEightChar().getDay()[1];
}

/** 八字：當日五行對本命喜忌。 */
function baziSignal(input: FateReportInput, today: Date): DailySignal {
  const fortune = computeDailyFortune(input.bazi, today);
  const tone: DayTone = fortune.elementRelation === 'support'
    ? 'smooth'
    : fortune.elementRelation === 'drain' ? 'friction' : 'neutral';
  return {
    system: '八字',
    tone,
    label: `${fortune.dayPillar}日 · ${fortune.tenGodCategory}`,
    note: fortune.behaviorAdvice,
  };
}

/** 生肖：今天的日支對你出生年的地支。 */
function zodiacSignal(input: FateReportInput, today: Date): DailySignal {
  const dayBranch = dayBranchOf(today);
  const relation = branchRelation(dayBranch, input.zodiac.branch);
  const friction = relation?.kind === 'branch-clash'
    || relation?.kind === 'branch-harm'
    || relation?.kind === 'branch-punishment'
    || relation?.kind === 'branch-break';

  if (!relation) {
    return {
      system: '生肖',
      tone: 'neutral',
      label: `${dayBranch}日 · 無沖合`,
      note: `今天的日支和你的${input.zodiac.animal}沒有特別的合或沖，這種日子最多。`,
    };
  }
  return {
    system: '生肖',
    tone: friction ? 'friction' : 'smooth',
    label: `${dayBranch}日 · ${relation.label}`,
    note: friction
      ? `今天的日支和你的${input.zodiac.animal}是${relation.label}。傳統說法是容易有小摩擦，把重要的約談挪開半天就好。`
      : `今天的日支和你的${input.zodiac.animal}是${relation.label}。傳統上算合得來的日子，要開口的事挑今天講。`,
  };
}

/** 西洋：今日行運對本命。 */
function astrologySignal(input: FateReportInput, today: Date): DailySignal | undefined {
  const horoscope = computeDailyHoroscope(input.astrology, today);
  const tightest = horoscope.transits[0];
  if (!tightest) return undefined;
  const friction = tightest.quality === 'tension' || tightest.quality === 'polarity';
  return {
    system: '西洋占星',
    tone: friction ? 'friction' : 'smooth',
    label: `${tightest.transitPlanet} ${tightest.type} 本命${tightest.natalPlanet}`,
    note: tightest.reading,
  };
}

/**
 * 宮位講成白話。直接把「命宮」去掉「宮」字會變成「命」，讀不通；
 * 而且宮名本身就是術語，對沒學過紫微的人等於沒說。
 */
const PALACE_TOPIC: Record<string, string> = {
  命宮: '你自己的狀態',
  兄弟: '同輩與手足',
  夫妻: '伴侶關係',
  子女: '晚輩，或你正在生出來的東西',
  財帛: '錢和資源',
  疾厄: '身體與精神狀態',
  遷移: '外出、換環境',
  僕役: '人際往來',
  交友: '人際往來',
  官祿: '工作',
  田宅: '住的地方與家人',
  福德: '心情與怎麼享受',
  父母: '長輩',
};

/** 紫微：流日命宮。 */
function ziweiSignal(profile: Pick<ProfileInput, 'birthDate' | 'birthTime' | 'gender'>, today: Date): DailySignal | undefined {
  const chart = calculateZiwei(profile, today);
  const daily = chart?.currentHoroscope.daily;
  if (!daily) return undefined;
  const topic = PALACE_TOPIC[daily.palaceName] ?? daily.palaceName;
  return {
    system: '紫微斗數',
    tone: 'neutral',
    label: `流日在${daily.palaceName}`,
    note: `紫微今天把重心放在「${topic}」上。這是提問方向，不是吉凶。`,
  };
}

/** 塔羅：今日一張牌。逆位視為要留意，不等於壞。 */
function tarotSignal(personId: string, today: Date): DailySignal {
  const daily = drawDailyCard(today, personId);
  return {
    system: '塔羅',
    tone: daily.reversed ? 'friction' : 'smooth',
    label: `${daily.card.name}${daily.reversed ? '（逆位）' : ''}`,
    note: daily.advice,
  };
}

/**
 * 綜合句。刻意只陳述「幾套說順、幾套說卡」，不平均成一個分數——
 * 把五套不同前提的系統加總成一個數字，那個數字沒有意義。
 */
function buildHeadline(signals: DailySignal[]): { headline: string; agreement: DailyFusion['agreement']; closing: string } {
  const smooth = signals.filter((item) => item.tone === 'smooth').length;
  const friction = signals.filter((item) => item.tone === 'friction').length;
  const total = signals.length;

  // 只有一套系統（沒建命盤，只剩塔羅）時，「1 套系統裡有 1 套」是廢話。
  if (total <= 1) {
    return {
      headline: '今天先翻一張牌。建立命盤之後，這裡會有五套系統一起講今天。',
      agreement: 'quiet',
      closing: '五套說法不一定同意彼此——它們吵起來的時候最好看。',
    };
  }

  if (smooth === 0 && friction === 0) {
    return {
      headline: `${total} 套系統今天都沒特別的話要說。`,
      agreement: 'quiet',
      closing: '沒有訊號也是一種訊號——今天照自己的節奏走就好。',
    };
  }
  if (friction === 0) {
    return {
      headline: `${total} 套系統裡有 ${smooth} 套說今天順手，沒有一套喊卡。`,
      agreement: 'aligned',
      closing: '大家都說順的日子不常有。把你一直想做卻沒動的那件事，挑今天開始。',
    };
  }
  if (smooth === 0) {
    return {
      headline: `${total} 套系統裡有 ${friction} 套說今天有點卡。`,
      agreement: 'aligned',
      closing: '不順的日子不用硬推。今天適合收尾和整理，重要的決定留到明天。',
    };
  }
  return {
    headline: `今天 ${smooth} 套說順、${friction} 套說卡，它們沒有共識。`,
    agreement: 'split',
    closing: '分歧的日子最誠實——你比較想相信哪一邊？那個偏好通常才是你今天真正的狀態。',
  };
}

/**
 * 算出今天的綜合運勢。
 *
 * @param input   本命盤。沒有的話只有塔羅那一項，其餘系統需要出生資料。
 * @param profile 出生資料，紫微流日需要
 * @param today   以哪一天為今天
 */
export function computeDailyFusion(
  input: FateReportInput | undefined,
  profile: Pick<ProfileInput, 'birthDate' | 'birthTime' | 'gender'> | undefined,
  today = new Date(),
): DailyFusion {
  const personId = profile?.birthDate ?? '';
  const signals: DailySignal[] = [];

  if (input) {
    signals.push(baziSignal(input, today));
    signals.push(zodiacSignal(input, today));
    const astrology = astrologySignal(input, today);
    if (astrology) signals.push(astrology);
  }
  if (profile) {
    const ziwei = ziweiSignal(profile, today);
    if (ziwei) signals.push(ziwei);
  }
  signals.push(tarotSignal(personId, today));

  const { headline, agreement, closing } = buildHeadline(signals);
  return { date: toDateKey(today), signals, headline, agreement, closing };
}
