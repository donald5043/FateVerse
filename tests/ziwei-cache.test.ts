import { beforeEach, describe, expect, it } from 'vitest';
import { calculateZiwei, clearZiweiChartCache, DEFAULT_ZIWEI_SETTINGS } from '../src/engines/ziwei-engine';

const profile = { birthDate: '1985-07-19', birthTime: '03:20', gender: 'female' as const };
const other = { birthDate: '1990-01-02', birthTime: '10:30', gender: 'male' as const };

describe('紫微命盤快取', () => {
  beforeEach(() => clearZiweiChartCache());

  it('快取命中與否，算出來的結果一致', () => {
    const cold = calculateZiwei(profile, '2026-07-28');
    const warm = calculateZiwei(profile, '2026-07-28');
    expect(warm).toEqual(cold);
  });

  it('同一張盤換目標日期，運限跟著換', () => {
    const a = calculateZiwei(profile, '2026-07-28');
    const b = calculateZiwei(profile, '2030-07-28');
    expect(a?.currentHoroscope.yearly).not.toEqual(b?.currentHoroscope.yearly);
    // 本命部分不該因為換日期而變
    expect(a?.palaces).toEqual(b?.palaces);
    expect(a?.soul).toBe(b?.soul);
  });

  it('不同人不會拿到彼此的盤', () => {
    const a = calculateZiwei(profile, '2026-07-28');
    const b = calculateZiwei(other, '2026-07-28');
    expect(a?.soulPalaceBranch).not.toBe(b?.soulPalaceBranch);

    // 再取一次，確認第一個人的盤沒被第二個人覆蓋
    expect(calculateZiwei(profile, '2026-07-28')).toEqual(a);
  });

  it('切換流派設定不會沿用上一個流派的結果', () => {
    // 這是加快取時真的踩到的 bug：astro.config 是全域狀態，而 horoscopeDivide
    // 與 ageDivide 會影響運限。只在建盤時設定的話，快取命中就會沿用別人的流派。
    const zhongzhou = { ...DEFAULT_ZIWEI_SETTINGS, algorithm: 'zhongzhou' as const };

    const defaultFirst = calculateZiwei(profile, '2026-07-28', DEFAULT_ZIWEI_SETTINGS);
    calculateZiwei(other, '2026-07-28', zhongzhou);
    const defaultAgain = calculateZiwei(profile, '2026-07-28', DEFAULT_ZIWEI_SETTINGS);

    expect(defaultAgain).toEqual(defaultFirst);
    expect(defaultAgain?.settings.algorithm).toBe('default');
  });

  it('同一個人不同流派各自算，不會互相汙染', () => {
    const zhongzhou = { ...DEFAULT_ZIWEI_SETTINGS, algorithm: 'zhongzhou' as const };
    const a = calculateZiwei(profile, '2026-07-28', DEFAULT_ZIWEI_SETTINGS);
    const b = calculateZiwei(profile, '2026-07-28', zhongzhou);
    expect(a?.settings.algorithm).toBe('default');
    expect(b?.settings.algorithm).toBe('zhongzhou');
    expect(calculateZiwei(profile, '2026-07-28', DEFAULT_ZIWEI_SETTINGS)).toEqual(a);
  });

  it('快取有上限，不會無限長大', () => {
    // 連續排 20 個人的盤；快取上限是 8，最早的會被擠掉但結果仍然正確。
    const results = Array.from({ length: 20 }, (_, index) => {
      const day = String((index % 28) + 1).padStart(2, '0');
      return calculateZiwei({ birthDate: `1990-03-${day}`, birthTime: '10:30', gender: 'female' }, '2026-07-28');
    });
    results.forEach((result) => expect(result?.palaces).toHaveLength(12));

    // 被擠掉的那一個重算，結果要和第一次相同
    const first = calculateZiwei({ birthDate: '1990-03-01', birthTime: '10:30', gender: 'female' }, '2026-07-28');
    expect(first?.palaces).toEqual(results[0]?.palaces);
  });

  it('性別未指定仍然回 undefined，不會被快取繞過', () => {
    expect(calculateZiwei({ ...profile, gender: 'other' }, '2026-07-28')).toBeUndefined();
  });

  it('回傳的是新物件，呼叫端改動不會汙染下一次', () => {
    const first = calculateZiwei(profile, '2026-07-28');
    expect(first).toBeDefined();
    first!.palaces[0].name = '被改掉了';
    expect(calculateZiwei(profile, '2026-07-28')?.palaces[0].name).not.toBe('被改掉了');
  });
});
