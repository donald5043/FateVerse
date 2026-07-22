import { describe, expect, it } from 'vitest';
import dailyCards from '../public/data/daily-guidance.json';
import guanyinSticks from '../public/data/fortune-sticks/guanyin-100.json';
import jiaziSticks from '../public/data/fortune-sticks/sixty-jiazi.json';

describe('靜態資料契約', () => {
  it('今日指引至少 30 張且 id 唯一', () => {
    expect(dailyCards.length).toBeGreaterThanOrEqual(30);
    expect(new Set(dailyCards.map((card) => card.id)).size).toBe(dailyCards.length);
    dailyCards.forEach((card) => {
      expect(card.title).toBeTruthy();
      expect(card.reflectionQuestion).toBeTruthy();
      expect(card.suggestedAction).toBeTruthy();
    });
  });

  it('示範籤詩具有來源、行動與風險', () => {
    [...guanyinSticks, ...jiaziSticks].forEach((stick) => {
      expect(stick.poem.length).toBeGreaterThanOrEqual(2);
      expect(stick.dataSource.sourceName).toContain('FateVerse');
      expect(stick.actions.length).toBeGreaterThan(0);
      expect(stick.risks.length).toBeGreaterThan(0);
    });
  });
});
