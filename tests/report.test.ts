import { describe, expect, it } from 'vitest';
import { generateFallbackReport } from '../src/ai/fallback-report';
import { parseAiReport, parseAiReportEnhancement } from '../src/ai/schemas';
import { calculateAstrology, calculateSunSign } from '../src/engines/astrology-engine';
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
    const result = parseAiReportEnhancement(JSON.stringify({ summary: '這是一段完整且清楚的跨系統摘要內容', suggestions: ['記錄本週三次專注工作的時段', '安排週末半小時回顧完成事項'] }));
    expect(result.suggestions).toHaveLength(2);
  });
  it('沒有文法約束時，仍能從夾帶前後雜訊或圍欄的輸出擷取 JSON', () => {
    const body = JSON.stringify({ summary: '這是一段完整且清楚的跨系統摘要內容', suggestions: ['記錄本週三次專注工作的時段', '安排週末半小時回顧完成事項'] });
    const fenced = parseAiReportEnhancement('```json\n' + body + '\n```');
    expect(fenced.suggestions).toHaveLength(2);
    const noisy = parseAiReportEnhancement('好的，以下是結果：' + body + ' 希望對你有幫助。');
    expect(noisy.summary).toContain('跨系統摘要');
  });
  it('拒絕模型照抄提示指令的假內容', () => {
    const leaked = JSON.stringify({ summary: '摘要第一句寫共同傾向，摘要第二句寫差異', suggestions: ['12至25字的行動一', '12至25字的行動二'] });
    expect(() => parseAiReportEnhancement(leaked)).toThrow('格式無法驗證');
  });
  it('缺少姓名與完整星盤仍可產生 fallback', () => {
    const report = generateFallbackReport(input);
    expect(report.mode).toBe('template');
    expect(report.sections.name).toBeUndefined();
    expect(report.sections.astrology).toContain('太陽');
    expect(report.sections.bazi).toContain('月支');
    expect(report.sections.bazi).toContain('日主強弱');
  });
  it('完整星盤時將元素模式與宮位集中寫入 fallback', () => {
    const astrology = calculateAstrology({ birthDate: '1990-01-02', birthTime: '10:30', timezone: 'Asia/Taipei', longitude: 121.5654, latitude: 25.033 });
    const report = generateFallbackReport({ ...input, astrology });
    expect(report.sections.astrology).toContain('十星分布');
    expect(report.sections.astrology).toContain('等宮制中第');
    expect(report.sections.astrology).toContain('整宮制');
  });
  it('選擇全部時展開多個可執行主題，而不是只回傳一張通用卡', () => {
    const report = generateFallbackReport({ ...input, userFocus: ['all'] });
    expect(report.focusAnalysis.map((item) => item.topic)).toEqual(['個性', '工作', '感情', '人生方向']);
    report.focusAnalysis.forEach((item) => expect(item.suggestions.length).toBeGreaterThanOrEqual(2));
  });
});
