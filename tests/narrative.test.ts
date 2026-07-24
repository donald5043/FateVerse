import { describe, expect, it } from 'vitest';
import { generateLifeNarrative } from '../src/engines/narrative-engine';
import { calculateBazi } from '../src/engines/bazi-engine';
import { calculateFiveElements } from '../src/engines/five-elements-engine';
import { calculateSunSign } from '../src/engines/astrology-engine';
import { calculateNumerology } from '../src/engines/numerology-engine';
import { getZodiacResult } from '../src/engines/zodiac-engine';
import type { FateReportInput } from '../src/types/fate';

function buildInput(birthDate: string): FateReportInput {
  const bazi = calculateBazi({ birthDate, birthTime: '10:30', timezone: 'Asia/Taipei' });
  return {
    userFocus: ['all'], bazi,
    fiveElements: calculateFiveElements(bazi.pillars),
    zodiac: getZodiacResult(bazi.zodiac),
    astrology: calculateSunSign(birthDate),
    numerology: calculateNumerology(birthDate),
  };
}

describe('人生劇本敘事引擎', () => {
  const input = buildInput('1990-01-02');
  const narrative = generateLifeNarrative(input);

  it('能動性與共融軸都落在 0–100 並歸類象限', () => {
    expect(narrative.axis.agency).toBeGreaterThanOrEqual(0);
    expect(narrative.axis.agency).toBeLessThanOrEqual(100);
    expect(narrative.axis.communion).toBeGreaterThanOrEqual(0);
    expect(narrative.axis.communion).toBeLessThanOrEqual(100);
    expect(['leader', 'pioneer', 'nurturer', 'seeker']).toContain(narrative.axis.quadrant);
    expect(narrative.axis.summary.length).toBeGreaterThan(15);
  });

  it('產生過去、現在、未來三章，皆為第一人稱', () => {
    expect(narrative.chapters.map((chapter) => chapter.id)).toEqual(['origin', 'present', 'becoming']);
    narrative.chapters.forEach((chapter) => {
      expect(chapter.paragraphs.length).toBeGreaterThanOrEqual(2);
      expect(chapter.paragraphs.join('')).toContain('我');
    });
  });

  it('第一章引用生肖與五行，不憑空捏造', () => {
    const origin = narrative.chapters[0].paragraphs.join('');
    expect(origin).toContain(input.zodiac.positiveTraits[0]);
  });

  it('救贖弧線把最弱元素框定為成長而非缺陷', () => {
    expect(narrative.redemption).toContain('成長');
    expect(narrative.redemption.length).toBeGreaterThan(40);
    expect(narrative.closing).toContain('握著筆');
  });

  it('保留界線提醒且非預言', () => {
    expect(narrative.caveat).toContain('不是預測');
  });

  it('相同輸入產生相同敘事', () => {
    expect(generateLifeNarrative(input)).toEqual(narrative);
  });

  it('不同命盤可能得到不同象限標題', () => {
    const others = ['1985-07-15', '1978-11-30', '2001-03-21'].map((date) => generateLifeNarrative(buildInput(date)).axis.quadrant);
    expect(new Set([narrative.axis.quadrant, ...others]).size).toBeGreaterThan(1);
  });
});
