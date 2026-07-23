import { describe, expect, it } from 'vitest';
import { PALM_FEATURES, buildPalmReading } from '../src/engines/palm-engine';

describe('手相特徵資料', () => {
  it('五組特徵各有至少四個可指認選項，且解讀齊全', () => {
    expect(PALM_FEATURES.map((feature) => feature.id)).toEqual(['handShape', 'lifeLine', 'headLine', 'heartLine', 'fateLine']);
    PALM_FEATURES.forEach((feature) => {
      expect(feature.options.length).toBeGreaterThanOrEqual(4);
      feature.options.forEach((option) => {
        expect(option.reading.length).toBeGreaterThan(15);
        expect(option.tip.length).toBeGreaterThan(8);
        expect(option.hint.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('手相解讀', () => {
  it('少於三項特徵時不產生解讀', () => {
    expect(buildPalmReading({})).toBeUndefined();
    expect(buildPalmReading({ handShape: 'earth', lifeLine: 'deep' })).toBeUndefined();
  });
  it('選滿特徵時產生逐項解讀與整體說明', () => {
    const reading = buildPalmReading({ handShape: 'fire', lifeLine: 'wide', headLine: 'curved', heartLine: 'long', fateLine: 'multiple' });
    expect(reading).toBeDefined();
    expect(reading!.sections).toHaveLength(5);
    expect(reading!.headline).toContain('長掌短指');
    expect(reading!.sections[0].reading).toContain('行動派');
    expect(reading!.synthesis).toContain('手型');
    expect(reading!.cautions.length).toBeGreaterThanOrEqual(3);
  });
  it('無效選項會被忽略', () => {
    const reading = buildPalmReading({ handShape: 'nope', lifeLine: 'deep', headLine: 'long', heartLine: 'short' });
    expect(reading).toBeDefined();
    expect(reading!.sections.map((section) => section.featureId)).toEqual(['lifeLine', 'headLine', 'heartLine']);
  });
  it('相同選擇產生相同結果', () => {
    const selections = { handShape: 'water', lifeLine: 'faint', headLine: 'forked' } as const;
    expect(buildPalmReading(selections)).toEqual(buildPalmReading(selections));
  });
});
