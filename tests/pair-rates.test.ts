import { describe, expect, it } from 'vitest';
import { buildReportFromProfile } from '../src/engines/build-report';
import { describePairRate, generateSynastry } from '../src/engines/synastry-engine';
import { PAIR_FEATURE_RATES } from '../src/data/pair-feature-rates';
import type { ProfileInput } from '../src/types/fate';

function profile(birthDate: string, birthTime = '10:30'): ProfileInput {
  return {
    name: '示範', birthDate, birthTime, gender: 'female',
    region: '未提供', timezone: 'Asia/Taipei', focus: ['all'],
  };
}

function readingFor(dateA: string, dateB: string) {
  return generateSynastry(
    buildReportFromProfile(profile(dateA)).reportInput,
    buildReportFromProfile(profile(dateB)).reportInput,
    '小明', '小華',
  );
}

const SAMPLES: [string, string][] = [
  ['1990-01-02', '1988-06-15'],
  ['1985-07-19', '1992-03-08'],
  ['2001-11-30', '1975-05-21'],
  ['1968-09-23', '1999-12-04'],
];

describe('合盤出現率', () => {
  it('每個區段算出來的 featureKey 都查得到實測出現率', () => {
    // 這是最容易壞的一條：改了 verdict 或 featureKey 而忘了重跑 npm run measure:pairs，
    // occurrence 就會整片消失，而且不會有任何錯誤訊息。
    SAMPLES.forEach(([a, b]) => {
      readingFor(a, b).sections.forEach((section) => {
        expect(
          PAIR_FEATURE_RATES[`${section.id}:${section.featureKey}`],
          `${section.id}:${section.featureKey} 查不到出現率，請跑 npm run measure:pairs`,
        ).toBeTypeOf('number');
        expect(section.occurrence).toBeTruthy();
      });
    });
  });

  it('featureKey 不含雙方姓名，換名字查到的出現率一樣', () => {
    const inputA = buildReportFromProfile(profile('1990-01-02')).reportInput;
    const inputB = buildReportFromProfile(profile('1988-06-15')).reportInput;
    const withNames = generateSynastry(inputA, inputB, '小明', '小華');
    const withOthers = generateSynastry(inputA, inputB, '阿華', '阿美');
    expect(withOthers.sections.map((s) => s.featureKey)).toEqual(withNames.sections.map((s) => s.featureKey));
    expect(withOthers.sections.map((s) => s.occurrence)).toEqual(withNames.sections.map((s) => s.occurrence));
  });

  it('常見的結論會直說是常態，不包裝成特色', () => {
    SAMPLES.forEach(([a, b]) => {
      readingFor(a, b).sections.forEach((section) => {
        const rate = PAIR_FEATURE_RATES[`${section.id}:${section.featureKey}`];
        if (rate >= 0.4) expect(section.occurrence, `${section.featureKey} 出現率 ${rate}`).toContain('不是你們的特色');
      });
    });
  });

  it('亮點只收實測少見的結論', () => {
    // 舊版把「五行有互補」當亮點，但實測有九成的配對都會觸發。
    SAMPLES.forEach(([a, b]) => {
      const reading = readingFor(a, b);
      reading.highlights.forEach((highlight) => {
        if (!highlight.occurrence) return;
        // 有出現率的亮點，一定是從 PAIR_FEATURE_RATES 裡篩出來的少見項，
        // 或是角度差 1 度以內的最緊相位。兩者都不該是「常態」。
        expect(highlight.occurrence).not.toContain('不是你們的特色');
      });
      expect(reading.highlights.length).toBeGreaterThan(0);
    });
  });

  it('五行互補不再被當成亮點', () => {
    SAMPLES.forEach(([a, b]) => {
      expect(readingFor(a, b).highlights.map((item) => item.title)).not.toContain('天生互補');
    });
  });

  it('出現率的說法用「對」當單位，不會講成「每 N 個人」', () => {
    expect(describePairRate(0.098)).toBe('隨機兩個人大約每 10 對出現 1 對');
    expect(describePairRate(0.52)).toBe('隨機兩個人裡大約 52% 的配對都這樣');
    expect(describePairRate(0)).toContain('沒有出現過');
  });

  it('出現率表本身合理：同一區段的各分支加起來接近 1', () => {
    const bySection = new Map<string, number>();
    Object.entries(PAIR_FEATURE_RATES).forEach(([key, rate]) => {
      const section = key.slice(0, key.indexOf(':'));
      // 相位是「有沒有出現這種型態」，同一對可以同時命中多種，加總本來就會超過 1。
      if (section === 'aspect') return;
      bySection.set(section, (bySection.get(section) ?? 0) + rate);
    });
    expect(bySection.size).toBeGreaterThanOrEqual(4);
    bySection.forEach((total, section) => {
      expect(total, `${section} 各分支加總為 ${total}`).toBeGreaterThan(0.98);
      expect(total, `${section} 各分支加總為 ${total}`).toBeLessThan(1.02);
    });
  });
});
