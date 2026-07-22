import { describe, expect, it } from 'vitest';
import { dailyIndex } from '../src/utils/daily-guidance';

describe('今日指引抽卡', () => {
  it('同一天與相同卡數會得到固定結果', () => {
    const date = new Date(2026, 6, 22, 9, 30);
    expect(dailyIndex(30, date)).toBe(dailyIndex(30, date));
  });

  it('結果一定落在卡片範圍內', () => {
    for (let day = 1; day <= 31; day += 1) {
      expect(dailyIndex(30, new Date(2026, 6, day))).toBeGreaterThanOrEqual(0);
      expect(dailyIndex(30, new Date(2026, 6, day))).toBeLessThan(30);
    }
  });

  it('拒絕空資料集', () => expect(() => dailyIndex(0)).toThrow('大於零'));
});
