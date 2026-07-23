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

  it('示範籤詩具有來源、行動與風險', () => {
    [...guanyinSticks, ...jiaziSticks].forEach((stick) => {
      expect(stick.poem.length).toBeGreaterThanOrEqual(2);
      expect(stick.dataSource.sourceName).toContain('FateVerse');
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
    const springPlow = matchFortuneSticks('東風解凍雨初勻 隴上春泥待墾人', jiaziSticks as never);
    expect(springPlow[0].item.id).toBe('fj-demo-05');
    const withTypos = matchFortuneSticks('平地何曾有雲梯 一皆一願上天西', guanyinSticks as never);
    expect(withTypos[0].item.id).toBe('gy-demo-94');
    const byNumber = matchFortuneSticks('第五十八籤', jiaziSticks as never);
    expect(byNumber[0].item.id).toBe('fj-demo-58');
  });

  it('照片收錄樣本保留逐字籤文與來源說明', () => {
    expect(userSamples).toHaveLength(1);
    expect(userSamples[0].poem).toContain('舉頭三尺有神明');
    expect(userSamples[0].dataSource.notes).toContain('照片');
  });
});
