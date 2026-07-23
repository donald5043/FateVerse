import { describe, expect, it } from 'vitest';
import { buildUnifiedElementProfile } from '../src/engines/integration-engine';
import { calculateAstrology, calculateSunSign } from '../src/engines/astrology-engine';
import { calculateBazi } from '../src/engines/bazi-engine';
import { calculateFiveElements } from '../src/engines/five-elements-engine';
import { calculateNumerology } from '../src/engines/numerology-engine';
import { getZodiacResult } from '../src/engines/zodiac-engine';
import { calculateZiwei } from '../src/engines/ziwei-engine';
import { analyzeName } from '../src/engines/name-engine';
import type { ElementName, FateReportInput, ProfileInput } from '../src/types/fate';

function buildInput(birthDate: string, birthTime = '10:30'): FateReportInput {
  const bazi = calculateBazi({ birthDate, birthTime, timezone: 'Asia/Taipei' });
  return {
    userFocus: ['all'],
    bazi,
    fiveElements: calculateFiveElements(bazi.pillars),
    zodiac: getZodiacResult(bazi.zodiac),
    astrology: calculateSunSign(birthDate),
    numerology: calculateNumerology(birthDate),
  };
}

const profile: ProfileInput = {
  name: '林安晨', birthDate: '1990-01-02', birthTime: '10:30', gender: 'female',
  region: '臺灣', timezone: 'Asia/Taipei', focus: ['all'],
};

const ELEMENTS: ElementName[] = ['wood', 'fire', 'earth', 'metal', 'water'];

describe('全面整合元素剖面', () => {
  const input = buildInput('1990-01-02');
  const profileResult = buildUnifiedElementProfile(input);

  it('百分比加總約為 100，且每個元素非負', () => {
    const sum = ELEMENTS.reduce((total, element) => total + profileResult.percentages[element], 0);
    expect(sum).toBeGreaterThan(99);
    expect(sum).toBeLessThan(101);
    ELEMENTS.forEach((element) => expect(profileResult.percentages[element]).toBeGreaterThanOrEqual(0));
  });

  it('最基本輸入接上五套系統：八字、西洋星盤、生肖、生命靈數、生日塔羅', () => {
    expect(profileResult.connectedSystems).toEqual(['八字', '西洋星盤', '生肖', '生命靈數', '生日塔羅']);
    expect(profileResult.contributions.find((c) => c.system === '八字')?.weight).toBe(4);
  });

  it('未接上的系統列入待補清單且附前往連結', () => {
    const missing = profileResult.missingSystems.map((m) => m.system);
    expect(missing).toContain('紫微斗數');
    expect(missing).toContain('姓名');
    expect(missing).toContain('手相');
    expect(profileResult.missingSystems.find((m) => m.system === '手相')?.to).toBe('/palm');
  });

  it('完成度依接上的系統數計算（8 套為滿）', () => {
    expect(profileResult.completeness).toBe(Math.round((5 / 8) * 100));
  });

  it('ranked 由高到低排序，dominant 取最高群', () => {
    for (let index = 1; index < profileResult.ranked.length; index += 1) {
      expect(profileResult.percentages[profileResult.ranked[index - 1]]).toBeGreaterThanOrEqual(profileResult.percentages[profileResult.ranked[index]]);
    }
    expect(profileResult.dominant[0]).toBe(profileResult.ranked[0]);
    expect(profileResult.plainSummary).toContain('主軸');
  });

  it('相同輸入產生相同剖面', () => {
    expect(buildUnifiedElementProfile(input)).toEqual(profileResult);
  });
});

describe('全面整合：接上更多系統', () => {
  it('提供紫微、姓名與手相後完成度達 100% 且皆列為貢獻', () => {
    const base = buildInput('1990-01-02');
    const ziwei = calculateZiwei(profile, '2026-07-22');
    const astrology = calculateAstrology({ birthDate: '1990-01-02', birthTime: '10:30', timezone: 'Asia/Taipei', longitude: 121.5654, latitude: 25.033 });
    const fiveElements = base.fiveElements;
    const nameAnalysis = analyzeName('林安晨', fiveElements.weakest);
    const full = buildUnifiedElementProfile({ ...base, ziwei, astrology, nameAnalysis }, { palmElement: 'metal' });
    expect(full.completeness).toBe(100);
    expect(full.connectedSystems).toContain('紫微斗數');
    expect(full.connectedSystems).toContain('姓名');
    expect(full.connectedSystems).toContain('手相');
    expect(full.missingSystems).toHaveLength(0);
    // 手相手型為金，金的占比應高於沒有手相時
    const withoutPalm = buildUnifiedElementProfile({ ...base, ziwei, astrology, nameAnalysis });
    expect(full.percentages.metal).toBeGreaterThan(withoutPalm.percentages.metal);
  });

  it('有完整十星分布時西洋星盤貢獻多元素而非單一太陽', () => {
    const base = buildInput('1990-01-02');
    const astrology = calculateAstrology({ birthDate: '1990-01-02', birthTime: '10:30', timezone: 'Asia/Taipei', longitude: 121.5654, latitude: 25.033 });
    const profileResult = buildUnifiedElementProfile({ ...base, astrology });
    const western = profileResult.contributions.find((c) => c.system === '西洋星盤');
    const nonZero = ELEMENTS.filter((element) => western!.vector[element] > 0);
    expect(nonZero.length).toBeGreaterThan(1);
  });
});
