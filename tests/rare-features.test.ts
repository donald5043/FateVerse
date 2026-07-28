import { describe, expect, it } from 'vitest';
import { buildReportFromProfile } from '../src/engines/build-report';
import {
  describeRate, detectFeatures, detectRareFeatures, RARE_THRESHOLD,
} from '../src/engines/rare-features-engine';
import { RARE_FEATURE_RATES } from '../src/data/rare-feature-rates';
import type { ProfileInput } from '../src/types/fate';

function inputFor(birthDate: string, birthTime = '10:30') {
  const profile: ProfileInput = {
    name: '示範', birthDate, birthTime, gender: 'female',
    region: '未提供', timezone: 'Asia/Taipei', focus: ['all'],
  };
  return buildReportFromProfile(profile).reportInput;
}

const SAMPLES = [
  '1990-01-02', '1985-07-19', '2001-11-30', '1977-04-05',
  '1968-09-23', '1995-12-11', '1920-05-06', '1923-08-28', '2010-08-08',
];

describe('罕見特徵', () => {
  it('只列出出現率在門檻以內的項目', () => {
    SAMPLES.forEach((date) => {
      detectRareFeatures(inputFor(date)).forEach((feature) => {
        expect(feature.rate).toBeLessThanOrEqual(RARE_THRESHOLD);
        expect(feature.rate).toBeGreaterThan(0);
      });
    });
  });

  it('稀有的排前面', () => {
    SAMPLES.forEach((date) => {
      const rates = detectRareFeatures(inputFor(date)).map((feature) => feature.rate);
      expect([...rates].sort((left, right) => left - right)).toEqual(rates);
    });
  });

  it('常見的配置不會被當成罕見講出來', () => {
    // 這幾項實測都超過門檻，是「多數人都有」的東西，講出來就是話術。
    const common = ['missing-element', 'stellium', 'same-birth-cards', 'day-master-extreme', 'stem-combination'] as const;
    common.forEach((id) => expect(RARE_FEATURE_RATES[id]).toBeGreaterThan(RARE_THRESHOLD));

    SAMPLES.forEach((date) => {
      const ids = detectRareFeatures(inputFor(date)).map((feature) => feature.id);
      common.forEach((id) => expect(ids, `${date} 不該列出 ${id}`).not.toContain(id));
    });
  });

  it('偵測器抓得到，只是被門檻擋下——不是壞掉', () => {
    // 五行缺一實測 69.6%，所以樣本裡一定有人被偵測到，但都不會出現在罕見清單。
    const detectedIds = SAMPLES.flatMap((date) => detectFeatures(inputFor(date)).map((feature) => feature.id));
    expect(detectedIds).toContain('missing-element');
  });

  it('最多列 4 項，不變成另一種流水帳', () => {
    SAMPLES.forEach((date) => {
      expect(detectRareFeatures(inputFor(date)).length).toBeLessThanOrEqual(4);
      expect(detectRareFeatures(inputFor(date), 2).length).toBeLessThanOrEqual(2);
    });
  });

  it('同一項不會重複出現', () => {
    SAMPLES.forEach((date) => {
      const ids = detectRareFeatures(inputFor(date)).map((feature) => feature.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it('每一項都有實際內容，不是只有標籤', () => {
    SAMPLES.forEach((date) => {
      detectRareFeatures(inputFor(date)).forEach((feature) => {
        expect(feature.detail.length).toBeGreaterThan(2);
        expect(feature.meaning.length).toBeGreaterThan(20);
      });
    });
  });

  it('已知的盤抓得到已知的特徵', () => {
    // 時柱會改變地支組合，所以這些案例的出生時間必須一起指定，不能只給日期。
    const harmony = detectRareFeatures(inputFor('1920-05-06', '04:00'));
    expect(harmony.map((feature) => feature.id)).toContain('three-harmony');
    expect(harmony.find((feature) => feature.id === 'three-harmony')?.detail).toContain('三合');

    const meeting = detectRareFeatures(inputFor('1923-08-28', '19:00'));
    expect(meeting.map((feature) => feature.id)).toContain('three-meeting');

    expect(detectFeatures(inputFor('1920-04-18', '03:30')).map((feature) => feature.id)).toContain('all-yang');
    expect(detectFeatures(inputFor('1925-03-22', '02:59')).map((feature) => feature.id)).toContain('all-yin');
  });

  it('純陽與純陰互斥', () => {
    SAMPLES.forEach((date) => {
      const ids = detectFeatures(inputFor(date)).map((feature) => feature.id);
      expect(ids.includes('all-yang') && ids.includes('all-yin')).toBe(false);
    });
  });

  it('文案不宣稱吉凶，也不預測', () => {
    SAMPLES.forEach((date) => {
      const text = detectRareFeatures(inputFor(date)).map((feature) => feature.meaning).join('');
      ['大吉', '大凶', '注定', '必然', '一定會', '將會', '貴人相助'].forEach((banned) => {
        expect(text, `${date} 不應出現「${banned}」`).not.toContain(banned);
      });
    });
  });

  it('出現率講成人話，而且對得上數字', () => {
    expect(describeRate(0.032)).toBe('大約每 31 個人有 1 個');
    expect(describeRate(0.5)).toBe('大約 50% 的人有');
    expect(describeRate(0)).toContain('沒有出現過');
  });

  it('稀有度表涵蓋所有偵測得到的特徵，沒有漏鍵', () => {
    const detected = new Set(SAMPLES.flatMap((date) => detectFeatures(inputFor(date)).map((feature) => feature.id)));
    detected.forEach((id) => {
      expect(RARE_FEATURE_RATES[id], `${id} 缺少實測出現率`).toBeGreaterThan(0);
    });
  });
});
