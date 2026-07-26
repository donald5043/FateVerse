/**
 * 今日回饋與個人準確率。
 *
 * 這裡刻意只做「記錄 + 統計」，不做任何調整：使用者說準或不準，
 * 都不會改變隔天算出來的內容。它的用途是讓人自己看見一件事——
 * 同一套規則，有些日子對得上，有些日子對不上。
 *
 * 資料只存在使用者自己的裝置，而且必須先明確同意才會寫入。
 */

export type FeedbackVerdict = 'accurate' | 'neutral' | 'off';

export interface FeedbackRecord {
  /** YYYY-MM-DD，當地日期。一天只留一筆，重複作答會覆蓋。 */
  date: string;
  verdict: FeedbackVerdict;
}

export const VERDICT_LABELS: Record<FeedbackVerdict, string> = {
  accurate: '準',
  neutral: '普通',
  off: '不準',
};

/** 低於這個筆數就不談比例——樣本太少的百分比只會誤導。 */
export const MIN_SAMPLES = 7;

export interface FeedbackStats {
  total: number;
  counts: Record<FeedbackVerdict, number>;
  /** 「準」佔全部的比例，0–100。樣本不足時為 null。 */
  accuracyRate: number | null;
  /** 連續有回饋的天數（從最近一次回饋往前數）。 */
  streak: number;
  /** 樣本是否足夠談比例。 */
  hasEnoughSamples: boolean;
}

/** 取當地日期字串。用當地時區，因為使用者感受的「今天」是當地的今天。 */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const moved = new Date(year, month - 1, day + days);
  return toDateKey(moved);
}

/** 寫入一筆回饋。同一天再次作答會覆蓋，不會累積成兩筆。 */
export function upsertFeedback(
  records: FeedbackRecord[],
  record: FeedbackRecord,
): FeedbackRecord[] {
  const rest = records.filter((existing) => existing.date !== record.date);
  return [record, ...rest].sort((a, b) => b.date.localeCompare(a.date));
}

export function findFeedback(records: FeedbackRecord[], dateKey: string): FeedbackRecord | undefined {
  return records.find((record) => record.date === dateKey);
}

/**
 * 連續天數：從最近一筆回饋的日期往前數，中間斷一天就停。
 * 若最近一筆早於昨天，代表已經斷了，回 0——不追溯久遠的紀錄。
 */
function computeStreak(records: FeedbackRecord[], todayKey: string): number {
  if (records.length === 0) return 0;
  const dates = new Set(records.map((record) => record.date));

  let cursor = todayKey;
  if (!dates.has(cursor)) {
    cursor = shiftDays(todayKey, -1);
    if (!dates.has(cursor)) return 0;
  }

  let streak = 0;
  while (dates.has(cursor)) {
    streak += 1;
    cursor = shiftDays(cursor, -1);
  }
  return streak;
}

export function computeFeedbackStats(records: FeedbackRecord[], today = new Date()): FeedbackStats {
  const counts: Record<FeedbackVerdict, number> = { accurate: 0, neutral: 0, off: 0 };
  records.forEach((record) => { counts[record.verdict] += 1; });

  const total = records.length;
  const hasEnoughSamples = total >= MIN_SAMPLES;

  return {
    total,
    counts,
    accuracyRate: hasEnoughSamples ? Math.round((counts.accurate / total) * 100) : null,
    streak: computeStreak(records, toDateKey(today)),
    hasEnoughSamples,
  };
}

/**
 * 統計卡上的說明句。樣本不足時說「資料還太少」，不給比例；
 * 樣本足夠時只陳述觀察到的分佈，不評價使用者，也不推論命理準不準。
 */
export function describeStats(stats: FeedbackStats): string {
  if (stats.total === 0) {
    return '還沒有紀錄。每天讀完之後標一下，累積幾天就能看出自己的落點。';
  }
  if (!stats.hasEnoughSamples) {
    const remaining = MIN_SAMPLES - stats.total;
    return `資料還太少（${stats.total} 天），再記 ${remaining} 天才適合看比例。`;
  }
  const { accuracyRate } = stats;
  if (accuracyRate === null) return '';
  if (accuracyRate >= 60) {
    return `${stats.total} 天裡有 ${accuracyRate}% 你覺得對得上。值得回頭看的是：對得上的那幾天，你當天實際在做什麼。`;
  }
  if (accuracyRate <= 25) {
    return `${stats.total} 天裡只有 ${accuracyRate}% 對得上。這個數字本身就是有用的資訊——這套描述不太貼合你現在的生活。`;
  }
  return `${stats.total} 天裡有 ${accuracyRate}% 對得上，其餘偏中性或不準。同一套規則會有這樣的落差，很正常。`;
}
