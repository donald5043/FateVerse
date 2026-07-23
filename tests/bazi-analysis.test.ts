import { describe, expect, it } from 'vitest';
import { analyzeDayMaster, calculateYearFortunes, tenGodCategory, yearGanZhi } from '../src/engines/bazi-analysis-engine';
import { calculateBazi } from '../src/engines/bazi-engine';

const bazi = calculateBazi({ birthDate: '1990-01-02', birthTime: '10:30', timezone: 'Asia/Taipei' });

describe('十神分類與流年干支', () => {
  it('五行關係對應正確的十神類別', () => {
    expect(tenGodCategory('wood', 'wood')).toBe('比劫');
    expect(tenGodCategory('wood', 'water')).toBe('印星');
    expect(tenGodCategory('wood', 'fire')).toBe('食傷');
    expect(tenGodCategory('wood', 'earth')).toBe('財星');
    expect(tenGodCategory('wood', 'metal')).toBe('官殺');
  });
  it('流年干支以 1984 甲子起算', () => {
    expect(yearGanZhi(1984)).toBe('甲子');
    expect(yearGanZhi(2026)).toBe('丙午');
    expect(yearGanZhi(1900)).toBe('庚子');
  });
});

describe('日主強弱綜合判讀', () => {
  const analysis = analyzeDayMaster(bazi);

  it('產生五級判定與合理的比例', () => {
    expect(['強', '偏強', '中和', '偏弱', '弱']).toContain(analysis.level);
    expect(analysis.ratio).toBeGreaterThan(0);
    expect(analysis.ratio).toBeLessThan(1);
    expect(analysis.supportScore).toBeGreaterThan(0);
    expect(analysis.opposeScore).toBeGreaterThan(0);
  });

  it('計分明細包含月令、天干與四柱藏干', () => {
    const labels = analysis.components.map((component) => component.label);
    expect(labels).toContain('月令');
    expect(labels.some((label) => label.includes('天干'))).toBe(true);
    expect(labels.some((label) => label.includes('藏干'))).toBe(true);
  });

  it('白話摘要引用日主與判定等級', () => {
    expect(analysis.plainSummary).toContain(bazi.dayMaster);
    expect(analysis.plainSummary).toContain(analysis.level);
    expect(analysis.plainSummary).toContain('白話');
  });

  it('冬季出生附上調候提醒；火不與強弱喜忌衝突時列入喜用', () => {
    expect(analysis.seasonalNote).toContain('冬');
    if (!analysis.unfavorable.includes('fire')) {
      expect(analysis.favorable.some((item) => item.element === 'fire')).toBe(true);
    }
  });

  it('非中和時給出喜用建議並附生活對應', () => {
    if (analysis.level !== '中和') {
      expect(analysis.favorable.length).toBeGreaterThan(0);
      analysis.favorable.forEach((item) => {
        expect(item.color.length).toBeGreaterThan(0);
        expect(item.direction.length).toBeGreaterThan(0);
        expect(item.habit.length).toBeGreaterThan(0);
      });
    }
  });

  it('相同輸入產生相同結果', () => {
    expect(analyzeDayMaster(bazi)).toEqual(analysis);
  });
});

describe('流年速覽', () => {
  const analysis = analyzeDayMaster(bazi);

  it('依起始年產生連續年份與白話解讀', () => {
    const fortunes = calculateYearFortunes(bazi, analysis, 2026);
    expect(fortunes.map((item) => item.year)).toEqual([2026, 2027, 2028]);
    expect(fortunes[0].ganZhi).toBe('丙午');
    fortunes.forEach((fortune) => {
      expect(['比劫', '印星', '食傷', '財星', '官殺']).toContain(fortune.category);
      expect(['favorable', 'unfavorable', 'neutral']).toContain(fortune.match);
      expect(fortune.reading).toContain(String(fortune.year));
      expect(fortune.reading.length).toBeGreaterThan(30);
    });
  });

  it('喜用五行的年份標示為順風', () => {
    const fortunes = calculateYearFortunes(bazi, analysis, 2020, 10);
    const favoredElements = new Set(analysis.favorable.map((item) => item.element));
    fortunes.forEach((fortune) => {
      if (favoredElements.has(fortune.stemElement)) expect(fortune.match).toBe('favorable');
    });
  });
});
