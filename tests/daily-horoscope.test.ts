import { describe, expect, it } from 'vitest';
import { calculateAstrology, calculateSunSign } from '../src/engines/astrology-engine';
import { computeDailyHoroscope } from '../src/engines/daily-horoscope-engine';
import { drawDailyCard } from '../src/engines/tarot-engine';

const natal = calculateAstrology({ birthDate: '1990-01-02', birthTime: '10:30', timezone: 'Asia/Taipei' });
const today = new Date(2026, 6, 27);

describe('今日星座運勢', () => {
  it('對的是本命行星，不是太陽星座查表——同天不同盤結果不同', () => {
    const other = calculateAstrology({ birthDate: '1985-07-19', birthTime: '03:20', timezone: 'Asia/Taipei' });
    const a = computeDailyHoroscope(natal, today);
    const b = computeDailyHoroscope(other, today);
    expect(a.transits).not.toEqual(b.transits);
  });

  it('同一張盤同一天結果固定，重算不會變', () => {
    expect(computeDailyHoroscope(natal, today)).toEqual(computeDailyHoroscope(natal, today));
  });

  it('換一天，行運會跟著換', () => {
    const a = computeDailyHoroscope(natal, today);
    const b = computeDailyHoroscope(natal, new Date(2026, 6, 27 + 9));
    expect(a.transits).not.toEqual(b.transits);
  });

  it('容許度收在 3 度內——更寬的角度天天都在，講不出今天', () => {
    for (let day = 0; day < 40; day += 1) {
      computeDailyHoroscope(natal, new Date(2026, 0, 1 + day)).transits.forEach((transit) => {
        expect(transit.orb).toBeLessThanOrEqual(3);
      });
    }
  });

  it('同一種相位形狀只留一組，不會印出重複的句子', () => {
    for (let day = 0; day < 40; day += 1) {
      const readings = computeDailyHoroscope(natal, new Date(2026, 0, 1 + day)).transits.map((item) => item.reading);
      expect(new Set(readings).size).toBe(readings.length);
    }
  });

  it('多數日子有內容，沒有的時候也講得誠實', () => {
    let empty = 0;
    for (let day = 0; day < 60; day += 1) {
      const horoscope = computeDailyHoroscope(natal, new Date(2026, 0, 1 + day));
      if (horoscope.transits.length === 0) {
        empty += 1;
        expect(horoscope.quietNote).toContain('平常的一天');
      } else {
        expect(horoscope.quietNote).toBe('');
      }
    }
    // 大半日子要有東西可讀，否則這張卡等於長期空著。
    expect(empty).toBeLessThan(20);
  });

  it('只有太陽星座資料時說明原因，不硬掰', () => {
    const sunOnly = calculateSunSign('1990-01-02');
    const horoscope = computeDailyHoroscope(sunOnly, today);
    expect(horoscope.transits).toEqual([]);
    expect(horoscope.quietNote).toContain('完整的出生時間');
  });

  it('講今天可以做什麼，不宣稱今天會發生什麼', () => {
    for (let day = 0; day < 40; day += 1) {
      const horoscope = computeDailyHoroscope(natal, new Date(2026, 0, 1 + day));
      [...horoscope.transits.map((item) => item.reading), horoscope.headline].forEach((text) => {
        ['你會遇到', '將會', '必然', '注定', '一定會', '小心會'].forEach((banned) => {
          expect(text, `不應出現「${banned}」`).not.toContain(banned);
        });
      });
    }
  });

  it('不給分數或星等', () => {
    const text = JSON.stringify(computeDailyHoroscope(natal, today));
    expect(text).not.toMatch(/\d+\s*分(?!鐘)/);
    ['運勢指數', '幸運指數', '滿分', '星等', '評分'].forEach((banned) => {
      expect(text).not.toContain(banned);
    });
  });

  it('帶出今天的月亮星座', () => {
    expect(computeDailyHoroscope(natal, today).moonSign).not.toBe('未知');
  });
});

describe('今日一張牌', () => {
  it('同一人同一天永遠同一張——重新整理不會換', () => {
    const first = drawDailyCard(today, 'person-a');
    const again = drawDailyCard(new Date(2026, 6, 27), 'person-a');
    expect(again).toEqual(first);
  });

  it('換一天會換牌', () => {
    const days = Array.from({ length: 10 }, (_, index) => drawDailyCard(new Date(2026, 6, 1 + index), 'person-a').card.id);
    expect(new Set(days).size).toBeGreaterThan(1);
  });

  it('不同人同一天抽到的牌不全相同', () => {
    const people = ['1990-01-02', '1985-07-19', '2001-11-30', '1977-04-05'];
    const cards = people.map((id) => drawDailyCard(today, id).card.id);
    expect(new Set(cards).size).toBeGreaterThan(1);
  });

  it('沒有命盤時也抽得出牌', () => {
    expect(drawDailyCard(today).card.name.length).toBeGreaterThan(0);
  });

  it('牌義與建議都跟著正逆位', () => {
    for (let day = 0; day < 60; day += 1) {
      const daily = drawDailyCard(new Date(2026, 0, 1 + day), 'person-a');
      expect(daily.reading).toBe(daily.reversed ? daily.card.reversed : daily.card.upright);
      expect(daily.advice).toBe(daily.card.advice);
    }
  });

  it('逆位是少數，不會半數以上都逆', () => {
    let reversed = 0;
    for (let day = 0; day < 200; day += 1) {
      if (drawDailyCard(new Date(2026, 0, 1 + day), 'person-a').reversed) reversed += 1;
    }
    expect(reversed).toBeGreaterThan(0);
    expect(reversed).toBeLessThan(100);
  });

  it('整副牌都抽得到，不會卡在少數幾張', () => {
    const seen = new Set<number>();
    for (let day = 0; day < 400; day += 1) {
      seen.add(drawDailyCard(new Date(2025, 0, 1 + day), 'person-a').card.id);
    }
    expect(seen.size).toBeGreaterThan(15);
  });
});

describe('行運句子的事實正確性', () => {
  it('合相只有在對到同一顆行星時，才說「走回出生時的位置」', () => {
    for (let day = 0; day < 120; day += 1) {
      computeDailyHoroscope(natal, new Date(2026, 0, 1 + day)).transits.forEach((transit) => {
        if (transit.transitPlanet === transit.natalPlanet) return;
        expect(transit.reading, `${transit.transitPlanet}對${transit.natalPlanet}`).not.toContain('走回你出生時的位置');
      });
    }
  });

  it('句子裡同時點名今日行星與本命行星，讀者對得起來', () => {
    for (let day = 0; day < 60; day += 1) {
      computeDailyHoroscope(natal, new Date(2026, 0, 1 + day)).transits.forEach((transit) => {
        expect(transit.reading).toContain(transit.transitPlanet);
        expect(transit.reading).toContain(transit.natalPlanet);
      });
    }
  });
});
