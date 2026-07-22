import { describe, expect, it } from 'vitest';
import { generateFallbackReport } from '../src/ai/fallback-report';
import { parseAiReport, parseAiReportEnhancement } from '../src/ai/schemas';
import { calculateSunSign } from '../src/engines/astrology-engine';
import { calculateBazi } from '../src/engines/bazi-engine';
import { calculateFiveElements } from '../src/engines/five-elements-engine';
import { calculateNumerology } from '../src/engines/numerology-engine';
import { getZodiacResult } from '../src/engines/zodiac-engine';

const bazi = calculateBazi({ birthDate: '1990-01-02', birthTime: '10:30', timezone: 'Asia/Taipei' });
const input = { userFocus: ['career'], bazi, fiveElements: calculateFiveElements(bazi.pillars), zodiac: getZodiacResult(bazi.zodiac), astrology: calculateSunSign('1990-01-02'), numerology: calculateNumerology('1990-01-02') };

describe('報告', () => {
  it('解析正常 WebLLM JSON', () => {
    const raw = JSON.stringify({ summary: '摘要', sharedPatterns: ['共同'], differences: [], sections: { bazi: '八字', zodiac: '生肖', astrology: '星座', numerology: '靈數' }, focusAnalysis: [], cautions: [] });
    expect(parseAiReport(raw).mode).toBe('ai');
  });
  it('拒絕無效 WebLLM JSON', () => expect(() => parseAiReport('{bad')).toThrow('輕量模式'));
  it('驗證手機快速模式的短篇 AI 增強 JSON', () => {
    const result = parseAiReportEnhancement(JSON.stringify({ summary: '摘要', suggestions: ['行動一', '行動二'] }));
    expect(result.suggestions).toHaveLength(2);
  });
  it('缺少姓名與完整星盤仍可產生 fallback', () => {
    const report = generateFallbackReport(input);
    expect(report.mode).toBe('template');
    expect(report.sections.name).toBeUndefined();
    expect(report.sections.astrology).toContain('太陽');
  });
  it('選擇全部時展開多個可執行主題，而不是只回傳一張通用卡', () => {
    const report = generateFallbackReport({ ...input, userFocus: ['all'] });
    expect(report.focusAnalysis.map((item) => item.topic)).toEqual(['個性', '工作', '感情', '人生方向']);
    report.focusAnalysis.forEach((item) => expect(item.suggestions.length).toBeGreaterThanOrEqual(2));
  });
});
