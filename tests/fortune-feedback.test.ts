import { describe, expect, it } from 'vitest';
import {
  computeFeedbackStats, describeStats, findFeedback, MIN_SAMPLES, toDateKey, upsertFeedback,
  type FeedbackRecord, type FeedbackVerdict,
} from '../src/engines/fortune-feedback-engine';

function seriesEndingAt(end: Date, verdicts: FeedbackVerdict[]): FeedbackRecord[] {
  return verdicts.map((verdict, index) => {
    const day = new Date(end);
    day.setDate(day.getDate() - index);
    return { date: toDateKey(day), verdict };
  });
}

describe('今日回饋紀錄', () => {
  it('同一天再次作答會覆蓋，不會變成兩筆', () => {
    const first = upsertFeedback([], { date: '2026-07-26', verdict: 'accurate' });
    const second = upsertFeedback(first, { date: '2026-07-26', verdict: 'off' });
    expect(second).toHaveLength(1);
    expect(second[0].verdict).toBe('off');
  });

  it('不同日期各自成筆，且依日期新到舊排序', () => {
    let records: FeedbackRecord[] = [];
    records = upsertFeedback(records, { date: '2026-07-24', verdict: 'accurate' });
    records = upsertFeedback(records, { date: '2026-07-26', verdict: 'off' });
    records = upsertFeedback(records, { date: '2026-07-25', verdict: 'neutral' });
    expect(records.map((record) => record.date)).toEqual(['2026-07-26', '2026-07-25', '2026-07-24']);
  });

  it('findFeedback 只回傳當天那筆', () => {
    const records = seriesEndingAt(new Date(2026, 6, 26), ['accurate', 'off']);
    expect(findFeedback(records, '2026-07-26')?.verdict).toBe('accurate');
    expect(findFeedback(records, '2026-07-20')).toBeUndefined();
  });

  it('toDateKey 用當地日期並補零', () => {
    expect(toDateKey(new Date(2026, 0, 2, 23, 30))).toBe('2026-01-02');
  });
});

describe('個人準確率統計', () => {
  const today = new Date(2026, 6, 26);

  it('樣本不足時不給百分比', () => {
    const records = seriesEndingAt(today, Array(MIN_SAMPLES - 1).fill('accurate'));
    const stats = computeFeedbackStats(records, today);
    expect(stats.hasEnoughSamples).toBe(false);
    expect(stats.accuracyRate).toBeNull();
    expect(describeStats(stats)).toContain('資料還太少');
    expect(describeStats(stats)).not.toContain('%');
  });

  it('樣本足夠時才算比例', () => {
    const verdicts: FeedbackVerdict[] = ['accurate', 'accurate', 'accurate', 'accurate', 'off', 'off', 'neutral', 'neutral'];
    const stats = computeFeedbackStats(seriesEndingAt(today, verdicts), today);
    expect(stats.total).toBe(8);
    expect(stats.counts).toEqual({ accurate: 4, off: 2, neutral: 2 });
    expect(stats.accuracyRate).toBe(50);
  });

  it('完全沒紀錄時不談比例也不談天數', () => {
    const stats = computeFeedbackStats([], today);
    expect(stats.total).toBe(0);
    expect(stats.streak).toBe(0);
    expect(describeStats(stats)).toContain('還沒有紀錄');
  });

  it('連續天數只數到中斷為止', () => {
    const records = [
      { date: '2026-07-26', verdict: 'accurate' as const },
      { date: '2026-07-25', verdict: 'off' as const },
      // 07-24 缺席 → 斷點
      { date: '2026-07-23', verdict: 'accurate' as const },
    ];
    expect(computeFeedbackStats(records, today).streak).toBe(2);
  });

  it('今天還沒標時，昨天起算的連續天數仍算數', () => {
    const records = [
      { date: '2026-07-25', verdict: 'accurate' as const },
      { date: '2026-07-24', verdict: 'accurate' as const },
    ];
    expect(computeFeedbackStats(records, today).streak).toBe(2);
  });

  it('最近一筆早於昨天就視為已中斷', () => {
    const records = [{ date: '2026-07-01', verdict: 'accurate' as const }];
    expect(computeFeedbackStats(records, today).streak).toBe(0);
  });

  it('低準確率的說明不指責使用者，也不改口說命理有效', () => {
    const verdicts: FeedbackVerdict[] = ['accurate', 'off', 'off', 'off', 'off', 'off', 'off', 'off'];
    const text = describeStats(computeFeedbackStats(seriesEndingAt(today, verdicts), today));
    expect(text).toContain('13%');
    expect(text).toContain('不太貼合');
  });

  it('說明句不出現預測性或遊戲化字眼', () => {
    const samples = [
      computeFeedbackStats([], today),
      computeFeedbackStats(seriesEndingAt(today, Array(3).fill('accurate')), today),
      computeFeedbackStats(seriesEndingAt(today, Array(10).fill('accurate')), today),
      computeFeedbackStats(seriesEndingAt(today, Array(10).fill('off')), today),
    ];
    samples.forEach((stats) => {
      const text = describeStats(stats);
      ['一定會', '必然', '預測', '加油', '達成', '獎勵', '別中斷'].forEach((banned) => {
        expect(text, `不應出現「${banned}」`).not.toContain(banned);
      });
    });
  });
});
