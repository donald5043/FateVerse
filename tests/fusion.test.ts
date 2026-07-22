import { describe, expect, it } from 'vitest';
import { generateFusionReading, numerologyElement, parseZiweiClassElement } from '../src/engines/fusion-engine';
import { calculateAstrology, calculateSunSign } from '../src/engines/astrology-engine';
import { calculateBazi } from '../src/engines/bazi-engine';
import { calculateFiveElements } from '../src/engines/five-elements-engine';
import { calculateNumerology } from '../src/engines/numerology-engine';
import { getZodiacResult } from '../src/engines/zodiac-engine';
import { calculateZiwei } from '../src/engines/ziwei-engine';
import type { FateReportInput, ProfileInput } from '../src/types/fate';

function buildInput(birthDate: string, birthTime = '10:30'): FateReportInput {
  const bazi = calculateBazi({ birthDate, birthTime, timezone: 'Asia/Taipei' });
  return {
    userFocus: ['career'],
    bazi,
    fiveElements: calculateFiveElements(bazi.pillars),
    zodiac: getZodiacResult(bazi.zodiac),
    astrology: calculateSunSign(birthDate),
    numerology: calculateNumerology(birthDate),
  };
}

const profile: ProfileInput = {
  name: '測試',
  birthDate: '1990-01-02',
  birthTime: '10:30',
  gender: 'female',
  region: 'TW',
  timezone: 'Asia/Taipei',
  focus: ['career'],
};

describe('融合引擎對照表', () => {
  it('生命靈數依洛書對照五行，大師數先歸位再對照', () => {
    expect(numerologyElement(1)).toBe('water');
    expect(numerologyElement(9)).toBe('fire');
    expect(numerologyElement(11)).toBe('earth');
    expect(numerologyElement(22)).toBe('wood');
    expect(numerologyElement(33)).toBe('metal');
  });
  it('解析紫微五行局字串', () => {
    expect(parseZiweiClassElement('水二局')).toBe('water');
    expect(parseZiweiClassElement('火六局')).toBe('fire');
    expect(parseZiweiClassElement('未知局')).toBeUndefined();
  });
});

describe('融合解讀', () => {
  const input = buildInput('1990-01-02');
  const reading = generateFusionReading(input);

  it('沒有紫微與姓名時仍納入五套基本系統', () => {
    expect(reading.systemsUsed).toEqual(['八字日主', '四柱五行分布', '生肖年支', '西洋太陽星座', '生命靈數']);
  });

  it('五行投票總數等於系統數且有領先元素', () => {
    const totalVotes = reading.consensus.votes.reduce((sum, vote) => sum + vote.votes, 0);
    expect(totalVotes).toBe(reading.systemsUsed.length);
    expect(reading.consensus.leading.length).toBeGreaterThan(0);
    expect(['high', 'medium', 'low']).toContain(reading.consensus.agreementLevel);
    expect(reading.consensus.plainSummary).toContain('講白話');
  });

  it('四條性格光譜分數落在範圍內且附證據', () => {
    expect(reading.axes.map((axis) => axis.id)).toEqual(['pace', 'express', 'decide', 'energy']);
    reading.axes.forEach((axis) => {
      expect(axis.score).toBeGreaterThanOrEqual(-100);
      expect(axis.score).toBeLessThanOrEqual(100);
      expect(axis.evidence.length).toBeGreaterThan(0);
      expect(axis.verdict.length).toBeGreaterThan(10);
    });
  });

  it('四個生活領域都以白話解說並引用實際盤面資料', () => {
    expect(reading.domains.map((domain) => domain.id)).toEqual(['personality', 'career', 'love', 'wellbeing']);
    const personality = reading.domains[0];
    expect(personality.plainReading).toContain('講白話');
    expect(personality.plainReading).toContain(input.bazi.dayMaster);
    expect(personality.plainReading).toContain(input.zodiac.animal);
    expect(personality.plainReading).toContain(input.astrology.sunSign);
    expect(personality.plainReading).toContain(String(input.numerology.lifePathNumber));
    reading.domains.forEach((domain) => expect(domain.reminder.length).toBeGreaterThan(0));
  });

  it('至少產生一則共識或矛盾亮點', () => {
    expect(reading.highlights.length).toBeGreaterThan(0);
    reading.highlights.forEach((highlight) => {
      expect(['agreement', 'tension']).toContain(highlight.kind);
      expect(highlight.plainExplanation.length).toBeGreaterThan(20);
    });
  });

  it('沒有紫微資料時不產生時運交叉、仍保留界線提醒', () => {
    expect(reading.timing).toBeUndefined();
    expect(reading.cautions.length).toBeGreaterThanOrEqual(3);
  });

  it('相同輸入產生完全相同的結果', () => {
    expect(generateFusionReading(input)).toEqual(reading);
  });

  it('不同生日產生不同標題', () => {
    const other = generateFusionReading(buildInput('1985-07-15'));
    expect(other.headline).not.toBe(reading.headline);
  });
});

describe('融合解讀（含紫微與完整星盤）', () => {
  it('納入紫微五行局並交叉比對大限與大運', () => {
    const base = buildInput('1990-01-02');
    const ziwei = calculateZiwei(profile, '2026-07-22');
    expect(ziwei).toBeDefined();
    const astrology = calculateAstrology({ birthDate: '1990-01-02', birthTime: '10:30', timezone: 'Asia/Taipei', longitude: 121.5654, latitude: 25.033 });
    const reading = generateFusionReading({ ...base, astrology, ziwei });
    expect(reading.systemsUsed).toContain('紫微五行局');
    expect(reading.timing).toBeDefined();
    expect(reading.timing?.plainReading).toContain('大限命宮');
    expect(reading.timing?.evidence.some((item) => item.system === '紫微斗數')).toBe(true);
    if (base.bazi.luckCycles?.some((cycle) => 2026 >= cycle.startYear && 2026 <= cycle.endYear)) {
      expect(reading.timing?.plainReading).toContain('大運');
    }
  });
});
