import { describe, expect, it } from 'vitest';
import { buildChartFingerprint, FINGERPRINT_SIZE } from '../src/engines/chart-fingerprint-engine';
import { buildBirthdaySky } from '../src/engines/birthday-sky-engine';
import { seededRandom } from '../src/utils/seeded-random';
import { calculateAstrology, calculateSunSign } from '../src/engines/astrology-engine';
import { calculateBazi } from '../src/engines/bazi-engine';
import { calculateFiveElements } from '../src/engines/five-elements-engine';
import { calculateNumerology } from '../src/engines/numerology-engine';
import { getZodiacResult } from '../src/engines/zodiac-engine';
import type { FateReportInput } from '../src/types/fate';

function buildInput(birthDate: string, withFullSky = false): FateReportInput {
  const bazi = calculateBazi({ birthDate, birthTime: '10:30', timezone: 'Asia/Taipei' });
  const astrology = withFullSky
    ? calculateAstrology({ birthDate, birthTime: '10:30', timezone: 'Asia/Taipei', longitude: 121.5654, latitude: 25.033 })
    : calculateSunSign(birthDate);
  return {
    userFocus: ['all'], bazi,
    fiveElements: calculateFiveElements(bazi.pillars),
    zodiac: getZodiacResult(bazi.zodiac),
    astrology,
    numerology: calculateNumerology(birthDate),
  };
}

describe('共用種子亂數', () => {
  it('同種子確定性、不同種子有差異', () => {
    const a = seededRandom('x'); const b = seededRandom('x');
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(seededRandom('x')()).not.toBe(seededRandom('y')());
  });
});

describe('命之圖騰指紋', () => {
  const input = buildInput('1990-01-02');
  const fingerprint = buildChartFingerprint(input);

  it('同命盤永遠生成同一張圖', () => {
    expect(buildChartFingerprint(input)).toEqual(fingerprint);
  });

  it('二進位卦碼為 6 位元，卦號在 0–63', () => {
    expect(fingerprint.binaryCode).toMatch(/^[01]{6}$/);
    expect(fingerprint.hexagramIndex).toBeGreaterThanOrEqual(0);
    expect(fingerprint.hexagramIndex).toBeLessThanOrEqual(63);
    expect(fingerprint.hexagramIndex).toBe(parseInt(fingerprint.binaryCode, 2));
  });

  it('五角星核心有五個頂點且落在畫布內', () => {
    expect(fingerprint.corePolygon).toHaveLength(5);
    fingerprint.corePolygon.forEach((point) => {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(FINGERPRINT_SIZE);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(FINGERPRINT_SIZE);
    });
  });

  it('十二輻條、環與節點都有生成', () => {
    expect(fingerprint.spokes).toHaveLength(12);
    expect(fingerprint.rings.length).toBeGreaterThanOrEqual(3);
    expect(fingerprint.nodes.length).toBeGreaterThan(0);
    expect(fingerprint.palette.length).toBe(3);
  });

  it('不同命盤生成不同圖騰', () => {
    expect(buildChartFingerprint(buildInput('1985-07-15')).seed).not.toBe(fingerprint.seed);
  });
});

describe('你出生那天的世界', () => {
  it('回傳真實星期與曆法事實，且距今天數非負', () => {
    const input = buildInput('1990-01-02');
    const sky = buildBirthdaySky(input, '1990-01-02', new Date('2026-07-24'));
    expect(sky.weekday).toBe('星期二'); // 1990-01-02 是星期二
    expect(sky.daysSince).toBeGreaterThan(13000);
    expect(sky.dayOfYear).toBe(2);
    expect(sky.facts.some((fact) => fact.label === '農曆')).toBe(true);
    expect(sky.intro).toContain('1990');
  });

  it('沒有完整星盤時提示補經緯度，不編造月相', () => {
    const sky = buildBirthdaySky(buildInput('1990-01-02'), '1990-01-02');
    expect(sky.facts.some((fact) => fact.value.includes('經緯度'))).toBe(true);
  });

  it('有完整星盤時計算月相與明亮度', () => {
    const input = buildInput('1990-01-02', true);
    const sky = buildBirthdaySky(input, '1990-01-02');
    expect(sky.moonIllumination).toBeGreaterThanOrEqual(0);
    expect(sky.moonIllumination).toBeLessThanOrEqual(100);
    expect(sky.facts.some((fact) => fact.label === '當天月相')).toBe(true);
    expect(sky.facts.some((fact) => fact.label === '太陽・月亮')).toBe(true);
  });
});
