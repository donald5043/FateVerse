import { describe, expect, it } from 'vitest';
import { generateFallbackReport } from '../src/engines/fallback-report';
import { calculateAstrology, calculateSunSign } from '../src/engines/astrology-engine';
import { calculateBazi } from '../src/engines/bazi-engine';
import { calculateFiveElements } from '../src/engines/five-elements-engine';
import { calculateNumerology } from '../src/engines/numerology-engine';
import { getZodiacResult } from '../src/engines/zodiac-engine';

const bazi = calculateBazi({ birthDate: '1990-01-02', birthTime: '10:30', timezone: 'Asia/Taipei' });
const input = { userFocus: ['career'], bazi, fiveElements: calculateFiveElements(bazi.pillars), zodiac: getZodiacResult(bazi.zodiac), astrology: calculateSunSign('1990-01-02'), numerology: calculateNumerology('1990-01-02') };

describe('報告', () => {
  it('缺少姓名與完整星盤仍可產生 fallback', () => {
    const report = generateFallbackReport(input);
    expect(report.sections.name).toBeUndefined();
    expect(report.sections.astrology).toContain('太陽');
    expect(report.sections.bazi).toContain('月支');
    expect(report.sections.bazi).toContain('日主強弱');
  });
  it('完整星盤時將元素模式與宮位集中寫入 fallback', () => {
    const astrology = calculateAstrology({ birthDate: '1990-01-02', birthTime: '10:30', timezone: 'Asia/Taipei', longitude: 121.5654, latitude: 25.033 });
    const report = generateFallbackReport({ ...input, astrology });
    // 原本斷言術語「十星分布」，那個詞已刻意換成白話；改成驗資訊還在。
    expect(report.sections.astrology).toContain('十顆星裡');
    expect(report.sections.astrology).toMatch(/[木火土金水風]元素/);
    expect(report.sections.astrology).toContain('等宮制中第');
    expect(report.sections.astrology).toContain('整宮制');
  });
  it('選擇全部時展開多個可執行主題，而不是只回傳一張通用卡', () => {
    const report = generateFallbackReport({ ...input, userFocus: ['all'] });
    expect(report.focusAnalysis.map((item) => item.topic)).toEqual(['個性', '工作', '感情', '人生方向']);
    report.focusAnalysis.forEach((item) => expect(item.suggestions.length).toBeGreaterThanOrEqual(2));
  });
});
