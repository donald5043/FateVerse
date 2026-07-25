import { describe, expect, it } from 'vitest';
import dailyCards from '../public/data/daily-guidance.json';
import guanyinSticks from '../public/data/fortune-sticks/guanyin-100.json';
import jiaziSticks from '../public/data/fortune-sticks/sixty-jiazi.json';
import userSamples from '../public/data/fortune-sticks/user-samples.json';

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

  it('籤詩具有來源標註、行動與風險', () => {
    [...guanyinSticks, ...jiaziSticks].forEach((stick) => {
      expect(stick.poem.length).toBeGreaterThanOrEqual(2);
      expect(stick.dataSource.sourceName.length).toBeGreaterThan(0);
      expect(stick.dataSource.license).toBeTruthy();
      expect(stick.actions.length).toBeGreaterThan(0);
      expect(stick.risks.length).toBeGreaterThan(0);
    });
  });

  it('籤詩擴充後兩集各至少 10 首且籤號、id 唯一', () => {
    expect(jiaziSticks.length).toBeGreaterThanOrEqual(10);
    expect(guanyinSticks.length).toBeGreaterThanOrEqual(10);
    [jiaziSticks, guanyinSticks].forEach((set) => {
      expect(new Set(set.map((stick) => stick.id)).size).toBe(set.length);
      expect(new Set(set.map((stick) => stick.number)).size).toBe(set.length);
      set.forEach((stick) => {
        expect(stick.poem).toHaveLength(4);
        expect(stick.summary.length).toBeGreaterThan(8);
        expect(Object.keys(stick.interpretations).length).toBeGreaterThanOrEqual(9);
        expect(stick.keywords.length).toBeGreaterThan(0);
      });
    });
  });

  it('新增籤詩可被模糊比對（完整句、錯字與籤號）', async () => {
    const { matchFortuneSticks } = await import('../src/engines/fortune-stick-matcher');
    const fullLine = matchFortuneSticks('日出便見風雲散 光明清淨照世間', jiaziSticks as never);
    expect(fullLine[0].item.id).toBe('fj-001');
    const withTypos = matchFortuneSticks('四郊田畝皆枯竭 久旱俄然三日淋', guanyinSticks as never);
    expect(withTypos[0].item.id).toBe('gy-022');
    const jiaziTypos = matchFortuneSticks('蛇身意欲變成竜 只恐命內運未通', jiaziSticks as never);
    expect(jiaziTypos[0].item.id).toBe('fj-058');
    const byNumber = matchFortuneSticks('第五十八籤', jiaziSticks as never);
    expect(byNumber[0].item.id).toBe('fj-058');
  });

  it('照片收錄樣本保留逐字籤文與來源說明', () => {
    expect(userSamples).toHaveLength(1);
    expect(userSamples[0].poem).toContain('舉頭三尺有神明');
    expect(userSamples[0].dataSource.notes).toContain('照片');
  });
});
