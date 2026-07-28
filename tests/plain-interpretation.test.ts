import { describe, expect, it } from 'vitest';
import { buildReportFromProfile } from '../src/engines/build-report';
import { generateFallbackReport } from '../src/engines/fallback-report';
import {
  PLANET_TOPIC_PLAIN, SIGN_BEHAVIOUR_PLAIN, ZIWEI_PALACE_PLAIN, ZIWEI_STAR_PLAIN,
} from '../src/data/interpretation-library';
import type { ProfileInput } from '../src/types/fate';

function reportFor(birthDate: string, birthTime = '10:30', gender: ProfileInput['gender'] = 'female') {
  const profile: ProfileInput = {
    name: '示範', birthDate, birthTime, gender,
    region: '未提供', timezone: 'Asia/Taipei', focus: ['all'],
  };
  return generateFallbackReport(buildReportFromProfile(profile).reportInput);
}

const SAMPLES: [string, string][] = [
  ['1990-01-02', '10:30'], ['1985-07-19', '03:20'], ['2001-11-30', '21:10'],
  ['1977-04-05', '14:00'], ['1968-09-23', '08:15'],
];

describe('白話對照表', () => {
  it('十二星座與十顆行星都有白話說法，沒有漏', () => {
    const SIGNS = ['牡羊座', '金牛座', '雙子座', '巨蟹座', '獅子座', '處女座', '天秤座', '天蠍座', '射手座', '摩羯座', '水瓶座', '雙魚座'];
    const PLANETS = ['太陽', '月亮', '水星', '金星', '火星', '木星', '土星', '天王星', '海王星', '冥王星'];
    SIGNS.forEach((sign) => expect(SIGN_BEHAVIOUR_PLAIN[sign], `${sign} 缺白話`).toBeTruthy());
    PLANETS.forEach((planet) => expect(PLANET_TOPIC_PLAIN[planet], `${planet} 缺白話`).toBeTruthy());
  });

  it('十四主星與十二宮都有白話說法', () => {
    ['紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍']
      .forEach((star) => expect(ZIWEI_STAR_PLAIN[star], `${star} 缺白話`).toBeTruthy());
    ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '僕役', '官祿', '田宅', '福德', '父母']
      .forEach((palace) => expect(ZIWEI_PALACE_PLAIN[palace], `${palace} 缺白話`).toBeTruthy());
  });

  it('白話說法是句子，不是名詞片語堆疊', () => {
    // 舊版是「組織、承擔與整合資源」這種——三個名詞用頓號串起來，讀完沒有畫面。
    Object.entries(ZIWEI_STAR_PLAIN).forEach(([star, text]) => {
      expect(text.length, `${star} 太短`).toBeGreaterThan(10);
      expect(text, `${star} 仍是名詞堆疊`).not.toMatch(/^[^，。]{2,6}、[^，。]{2,6}與[^，。]{2,6}$/);
    });
    Object.entries(SIGN_BEHAVIOUR_PLAIN).forEach(([sign, text]) => {
      expect(text.length, `${sign} 太短`).toBeGreaterThan(6);
    });
  });

  it('宮位白話不會把「命宮」截成讀不通的「命」', () => {
    expect(ZIWEI_PALACE_PLAIN['命宮']).not.toBe('命');
    Object.values(ZIWEI_PALACE_PLAIN).forEach((text) => expect(text.length).toBeGreaterThan(1));
  });
});

describe('西洋與紫微的摘要', () => {
  it('西洋摘要說明每個位置在講什麼，不只報座標', () => {
    SAMPLES.forEach(([date, time]) => {
      const text = reportFor(date, time).sections.astrology;
      expect(text).toContain('講的是');
      expect(text, `${date} 不該只列元素模式術語`).not.toMatch(/太陽星座屬.元素、..模式/);
    });
  });

  it('紫微摘要用白話解釋命宮與身宮的差別', () => {
    SAMPLES.forEach(([date, time]) => {
      const text = reportFor(date, time).sections.ziwei;
      if (!text) return;
      expect(text).toContain('命宮是你本來的樣子');
      expect(text).toContain('身宮是後天長成的樣子');
    });
  });

  it('命宮空宮時換句型，不會寫成「命宮裡坐的是命宮無十四主星」', () => {
    SAMPLES.forEach(([date, time]) => {
      const text = reportFor(date, time).sections.ziwei;
      if (!text) return;
      expect(text).not.toContain('坐的是命宮無');
      if (text.includes('沒有主星')) {
        expect(text).toContain('借對面那一宮來看');
        expect(text).not.toContain('命宮裡坐的是');
      }
    });
  });

  it('兩段摘要都不用書面語', () => {
    SAMPLES.forEach(([date, time]) => {
      const report = reportFor(date, time);
      const text = `${report.sections.astrology}${report.sections.ziwei ?? ''}`;
      ['不以猜測補齊', '本次沒有', '需連同', '之處', '較為'].forEach((banned) => {
        expect(text, `${date} 不應出現「${banned}」`).not.toContain(banned);
      });
    });
  });

  it('沒有座標時直說留空，不用術語帶過', () => {
    const text = reportFor('1990-01-02').sections.astrology;
    expect(text).toContain('上升和十二宮這裡不猜');
  });
});
