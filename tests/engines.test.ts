import { describe, expect, it } from 'vitest';
import { calculateSunSign } from '../src/engines/astrology-engine';
import { calculateBazi, parseBirthDateTime } from '../src/engines/bazi-engine';
import { branchToElement, calculateFiveElements, stemToElement } from '../src/engines/five-elements-engine';
import { calculateNumerology } from '../src/engines/numerology-engine';

describe('八字與日期', () => {
  it('解析日期、午夜與時區欄位', () => expect(parseBirthDateTime('1990-01-02', '00:00', 'Asia/Taipei')).toEqual({ year: 1990, month: 1, day: 2, hour: 0, minute: 0 }));
  it('拒絕無效日期', () => expect(() => parseBirthDateTime('2024-02-31', '12:00', 'Asia/Taipei')).toThrow('不存在'));
  it('拒絕缺少時區', () => expect(() => parseBirthDateTime('2024-02-01', '12:00', '')).toThrow('時區'));
  it('可計算不同日期的四柱', () => {
    const first = calculateBazi({ birthDate: '1990-01-02', birthTime: '00:00', timezone: 'Asia/Taipei' });
    const second = calculateBazi({ birthDate: '2001-08-15', birthTime: '23:30', timezone: 'Asia/Taipei' });
    expect(first.pillars).toHaveLength(4);
    expect(second.pillars).toHaveLength(4);
    expect(first.solarDate).not.toBe(second.solarDate);
  });
});

describe('五行', () => {
  it('轉換天干與地支', () => { expect(stemToElement('甲')).toBe('wood'); expect(branchToElement('子')).toBe('water'); });
  it('百分比總和接近 100 並找出強弱', () => {
    const bazi = calculateBazi({ birthDate: '1990-01-02', birthTime: '00:00', timezone: 'Asia/Taipei' });
    const result = calculateFiveElements(bazi.pillars);
    expect(Object.values(result.percentages).reduce((sum, value) => sum + value, 0)).toBeCloseTo(100, 0);
    expect(result.strongest.length).toBeGreaterThan(0);
    expect(result.weakest.length).toBeGreaterThan(0);
  });
});

describe('太陽星座交界', () => {
  it.each([['2000-03-20', '雙魚座'], ['2000-03-21', '牡羊座'], ['2000-04-19', '牡羊座'], ['2000-04-20', '金牛座'], ['2000-12-21', '射手座'], ['2000-12-22', '摩羯座']])('%s 是 %s', (date, sign) => expect(calculateSunSign(date).sunSign).toBe(sign));
});

describe('生命靈數', () => {
  it('保留完整計算過程', () => expect(calculateNumerology('1990-01-01').calculationSteps).toEqual([21, 3]));
  it.each([['2000-01-08', 11], ['2000-09-29', 22], ['1999-01-04', 33]])('保留大師數 %s → %i', (date, expected) => expect(calculateNumerology(date).lifePathNumber).toBe(expected));
});
