import { describe, expect, it } from 'vitest';
import { BARNUM_STATEMENTS, TECHNIQUES } from '../src/data/barnum-statements';
import {
  buildComparison, buildDemoReportInput, drawComparison, drawGenericStatements,
  extractRealInsights, pickStatementsByIndex, techniqueInfo,
} from '../src/engines/barnum-engine';
import { calculateBazi } from '../src/engines/bazi-engine';
import { calculateFiveElements } from '../src/engines/five-elements-engine';
import { calculateSunSign } from '../src/engines/astrology-engine';
import { calculateNumerology } from '../src/engines/numerology-engine';
import { getZodiacResult } from '../src/engines/zodiac-engine';
import type { FateReportInput } from '../src/types/fate';

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

describe('巴納姆語句資料', () => {
  it('至少收錄 30 句，且每句都對應到已定義的技巧', () => {
    expect(BARNUM_STATEMENTS.length).toBeGreaterThanOrEqual(30);
    const techniqueIds = new Set(TECHNIQUES.map((technique) => technique.id));
    BARNUM_STATEMENTS.forEach((statement) => {
      expect(techniqueIds.has(statement.technique)).toBe(true);
      expect(statement.text.length).toBeGreaterThan(10);
    });
  });
  it('id 唯一', () => {
    expect(new Set(BARNUM_STATEMENTS.map((statement) => statement.id)).size).toBe(BARNUM_STATEMENTS.length);
  });
  it('技巧圖鑑每項都有說明文字', () => {
    TECHNIQUES.forEach((technique) => {
      expect(technique.label.length).toBeGreaterThan(0);
      expect(technique.description.length).toBeGreaterThan(10);
    });
  });
  it('可依技巧 id 查回說明', () => {
    expect(techniqueInfo('rainbow-ruse')?.label).toBe('彩虹式話術');
    expect(techniqueInfo('not-a-technique')).toBeUndefined();
  });
});

describe('真實洞察萃取', () => {
  const input = buildInput('1990-01-02');

  it('沒有紫微時萃取四句，皆引用實際盤面資料', () => {
    const insights = extractRealInsights(input);
    expect(insights).toHaveLength(4);
    expect(insights[0]).toContain(input.bazi.dayMaster);
    expect(insights[1]).toContain(input.zodiac.animal);
    expect(insights[2]).toContain(input.astrology.sunSign);
    expect(insights[3]).toContain(String(input.numerology.lifePathNumber));
  });

  it('相同輸入產生相同萃取結果', () => {
    expect(extractRealInsights(input)).toEqual(extractRealInsights(input));
  });
});

describe('示範資料', () => {
  it('可在沒有真實命盤時建立完整的示範 FateReportInput', () => {
    const demo = buildDemoReportInput();
    expect(demo.bazi.dayMaster).toBeTruthy();
    expect(demo.zodiac.animal).toBeTruthy();
    expect(demo.astrology.sunSign).toBeTruthy();
    expect(extractRealInsights(demo)).toHaveLength(4);
  });
});

describe('固定索引抽句與盲測組合', () => {
  it('依索引挑選巴納姆句且索引可超出範圍循環', () => {
    const picked = pickStatementsByIndex([0, 1, BARNUM_STATEMENTS.length]);
    expect(picked[0]).toBe(BARNUM_STATEMENTS[0]);
    expect(picked[1]).toBe(BARNUM_STATEMENTS[1]);
    expect(picked[2]).toBe(BARNUM_STATEMENTS[0]);
  });

  it('組合比較時 swapSides 決定真實資料落在哪一側', () => {
    const real = ['真實一', '真實二'];
    const generic = pickStatementsByIndex([0, 1]);
    const notSwapped = buildComparison(real, generic, false);
    expect(notSwapped.sets[0]).toEqual({ label: 'A', isReal: true, items: real });
    expect(notSwapped.sets[1].isReal).toBe(false);
    expect(notSwapped.sets[1].items).toEqual(generic.map((s) => s.text));

    const swapped = buildComparison(real, generic, true);
    expect(swapped.sets[0].isReal).toBe(false);
    expect(swapped.sets[0].label).toBe('A');
    expect(swapped.sets[1]).toEqual({ label: 'B', isReal: true, items: real });
  });

  it('genericStatements 保留原始技巧標記供事後揭曉', () => {
    const generic = pickStatementsByIndex([0, 1, 2]);
    const comparison = buildComparison(['真實'], generic, false);
    expect(comparison.genericStatements).toEqual(generic);
  });
});

describe('隨機抽句與完整盲測流程', () => {
  it('隨機抽出的巴納姆句不重複', () => {
    const drawn = drawGenericStatements(6);
    expect(drawn).toHaveLength(6);
    expect(new Set(drawn.map((s) => s.id)).size).toBe(6);
  });

  it('要求數量超過語句庫時，最多回傳全部語句且不重複', () => {
    const drawn = drawGenericStatements(BARNUM_STATEMENTS.length + 10);
    expect(drawn.length).toBe(BARNUM_STATEMENTS.length);
    expect(new Set(drawn.map((s) => s.id)).size).toBe(BARNUM_STATEMENTS.length);
  });

  it('完整盲測會產生兩組、各自標籤正確，且恰好一組為真實', () => {
    const input = buildInput('1985-07-15');
    const comparison = drawComparison(extractRealInsights(input));
    const labels = comparison.sets.map((set) => set.label).sort();
    expect(labels).toEqual(['A', 'B']);
    expect(comparison.sets.filter((set) => set.isReal)).toHaveLength(1);
    expect(comparison.genericStatements).toHaveLength(4);
  });
});
