import { describe, expect, it } from 'vitest';
import { RITUAL_CARDS } from '../src/data/ritual-cards';
import {
  buildThrowSeed, chartSeedSignature, synthesizeReflection, throwFateDice,
} from '../src/engines/decision-ritual-engine';
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

describe('行動卡資料', () => {
  it('至少 30 張，id 唯一，內容完整', () => {
    expect(RITUAL_CARDS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(RITUAL_CARDS.map((card) => card.id)).size).toBe(RITUAL_CARDS.length);
    RITUAL_CARDS.forEach((card) => expect(card.text.length).toBeGreaterThan(8));
  });
});

describe('命運骰（確定性）', () => {
  it('同一顆種子永遠得到同一擲', () => {
    const a = throwFateDice('seed-abc');
    const b = throwFateDice('seed-abc');
    expect(a.side).toBe(b.side);
    expect(a.card.id).toBe(b.card.id);
    expect(a.flavor).toBe(b.flavor);
  });
  it('骰面只有 act/wait，且對應正確的陰陽與標籤', () => {
    for (let index = 0; index < 40; index += 1) {
      const result = throwFateDice(`seed-${index}`);
      expect(['act', 'wait']).toContain(result.side);
      expect(result.sideLabel).toBe(result.side === 'act' ? '動' : '靜');
      expect(result.yinYang).toBe(result.side === 'act' ? '陽' : '陰');
      expect(RITUAL_CARDS).toContainEqual(result.card);
    }
  });
  it('不同種子會擲出不同結果（分布約略均衡）', () => {
    const sides = Array.from({ length: 60 }, (_, index) => throwFateDice(`s-${index}`).side);
    const actCount = sides.filter((side) => side === 'act').length;
    expect(actCount).toBeGreaterThan(10);
    expect(actCount).toBeLessThan(50);
  });
});

describe('骰種簽名與種子組合', () => {
  it('命盤簽名穩定且反映命盤特徵', () => {
    const input = buildInput('1990-01-02');
    expect(chartSeedSignature(input)).toBe(chartSeedSignature(input));
    expect(chartSeedSignature(input)).toContain(input.bazi.dayMaster);
  });
  it('沒有命盤時仍可組出種子', () => {
    expect(buildThrowSeed(undefined, '要不要換工作', 42)).toContain('no-chart');
    expect(buildThrowSeed(undefined, '要不要換工作', 1)).not.toBe(buildThrowSeed(undefined, '要不要換工作', 2));
  });
});

describe('投射式綜合（反應才是答案）', () => {
  it('鬆一口氣 → 傾向骰面那一邊', () => {
    const result = synthesizeReflection('act', 'unknown', 'relief');
    expect(result.favored).toBe('act');
    expect(result.headline).toContain('往前');
  });
  it('失望 → 傾向相反的那一邊', () => {
    const result = synthesizeReflection('act', 'unknown', 'disappoint');
    expect(result.favored).toBe('wait');
    expect(result.headline).toContain('先等');
  });
  it('沒感覺且說得出希望 → 以希望為傾向', () => {
    const result = synthesizeReflection('wait', 'act', 'neutral');
    expect(result.favored).toBe('act');
  });
  it('沒感覺又不知道 → 不逼決定', () => {
    const result = synthesizeReflection('wait', 'unknown', 'neutral');
    expect(result.favored).toBeNull();
    expect(result.headline).toContain('還沒準備好');
  });
  it('每種組合都回傳完整文案', () => {
    (['act', 'wait'] as const).forEach((dice) => {
      (['act', 'wait', 'unknown'] as const).forEach((hoped) => {
        (['relief', 'disappoint', 'neutral'] as const).forEach((reaction) => {
          const result = synthesizeReflection(dice, hoped, reaction);
          expect(result.headline.length).toBeGreaterThan(5);
          expect(result.body.length).toBeGreaterThan(20);
          expect(result.closing.length).toBeGreaterThan(10);
        });
      });
    });
  });
});
