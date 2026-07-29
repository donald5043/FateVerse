import { describe, expect, it } from 'vitest';
import { calculateBazi } from '../src/engines/bazi-engine';
import {
  buildLifeTimeline, MIN_NOTES_FOR_SUMMARY, summarizeTimeline,
  type TimelineNote,
} from '../src/engines/life-timeline-engine';

const profile = { birthDate: '1990-01-02', birthTime: '10:30', gender: 'female' as const };
const bazi = calculateBazi({ ...profile, timezone: 'Asia/Taipei' });
const today = new Date(2026, 6, 27);

describe('回顧日誌年份', () => {
  const years = buildLifeTimeline(bazi, profile, today);

  it('只列已經過完的年份，不含今年與未來', () => {
    expect(years[0].year).toBe(2025);
    years.forEach((entry) => expect(entry.year).toBeLessThan(today.getFullYear()));
  });

  it('最新的排前面，年份連續不跳號', () => {
    const list = years.map((entry) => entry.year);
    expect(list).toEqual([...list].sort((left, right) => right - left));
    list.slice(1).forEach((year, index) => expect(list[index] - year).toBe(1));
  });

  it('不早於出生年', () => {
    years.forEach((entry) => expect(entry.year).toBeGreaterThanOrEqual(1990));
  });

  it('每一年都有流年干支、十神與虛歲', () => {
    years.forEach((entry) => {
      expect(entry.yearGanZhi).toHaveLength(2);
      expect(['比劫', '印星', '食傷', '財星', '官殺']).toContain(entry.tenGod);
      expect(entry.nominalAge).toBe(entry.year - 1990 + 1);
    });
  });

  it('流年干支對得上已知的年份', () => {
    // 2024 甲辰、2025 乙巳，是可查證的定值。
    expect(years.find((entry) => entry.year === 2024)?.yearGanZhi).toBe('甲辰');
    expect(years.find((entry) => entry.year === 2025)?.yearGanZhi).toBe('乙巳');
  });

  it('大運對應到涵蓋那一年的區間', () => {
    years.forEach((entry) => {
      if (!entry.luckCycle) return;
      expect(entry.year).toBeGreaterThanOrEqual(entry.luckCycle.startYear);
      expect(entry.year).toBeLessThanOrEqual(entry.luckCycle.endYear);
    });
  });

  it('排得出紫微流年命宮與四化', () => {
    const withPalace = years.filter((entry) => entry.yearlyPalace);
    expect(withPalace.length).toBeGreaterThan(0);
    expect(withPalace[0].yearlyMutagens.length).toBeGreaterThan(0);
  });

  it('性別未指定時仍列得出年份，只是沒有紫微那一段', () => {
    const noGender = buildLifeTimeline(bazi, { ...profile, gender: 'other' }, today);
    expect(noGender.length).toBeGreaterThan(0);
    noGender.forEach((entry) => {
      expect(entry.yearlyPalace).toBeUndefined();
      expect(entry.yearlyMutagens).toEqual([]);
    });
  });

  it('maxYears 限制回顧長度', () => {
    expect(buildLifeTimeline(bazi, profile, today, 5)).toHaveLength(5);
  });

  it('出生當年還沒過完時回空陣列，不會倒著列', () => {
    const newborn = buildLifeTimeline(bazi, { ...profile, birthDate: '2026-03-01' }, today);
    expect(newborn).toEqual([]);
  });

  it('框架句描述的是「那套說法」，不是斷言使用者的人生', () => {
    years.forEach((entry) => {
      expect(entry.framing).toContain('傳統上');
      ['你會', '一定', '必然', '注定', '將會'].forEach((banned) => {
        expect(entry.framing, `${entry.year} 不應出現「${banned}」`).not.toContain(banned);
      });
    });
  });
});

describe('回顧摘要', () => {
  const years = buildLifeTimeline(bazi, profile, today);
  const yearsWith = (tenGod: string, count: number) => years.filter((entry) => entry.tenGod === tenGod).slice(0, count);

  it('樣本不足時不歸納', () => {
    const notes: TimelineNote[] = years.slice(0, MIN_NOTES_FOR_SUMMARY - 1)
      .map((entry) => ({ year: entry.year, text: '記一下', tone: 'hard' as const }));
    const summary = summarizeTimeline(years, notes);
    expect(summary.hasEnough).toBe(false);
    expect(summary.lines.join('')).toContain('累積到');
  });

  it('只有文字、沒有標記調性的年份不算樣本', () => {
    const notes: TimelineNote[] = years.slice(0, 10).map((entry) => ({ year: entry.year, text: '有寫字' }));
    expect(summarizeTimeline(years, notes).hasEnough).toBe(false);
    expect(summarizeTimeline(years, notes).noted).toBe(0);
  });

  it('集中到某一類十神時才講出來', () => {
    // 這張命盤 36 個回顧年裡有 8 個官殺年，取樣足夠。
    const target = yearsWith('官殺', 4);
    expect(target).toHaveLength(4);
    const notes: TimelineNote[] = [
      ...target.map((entry) => ({ year: entry.year, text: '', tone: 'hard' as const })),
      ...years.filter((entry) => entry.tenGod !== '官殺').slice(0, 1)
        .map((entry) => ({ year: entry.year, text: '', tone: 'hard' as const })),
    ];
    const summary = summarizeTimeline(years, notes);
    expect(summary.hasEnough).toBe(true);
    expect(summary.lines[0]).toContain('官殺');
  });

  it('分散時明說沒有集中，不硬編一個規律', () => {
    // 每年換一個十神類別，刻意不集中
    const spread: TimelineNote[] = [];
    (['比劫', '印星', '食傷', '財星', '官殺'] as const).forEach((category) => {
      const entry = years.find((item) => item.tenGod === category && !spread.some((note) => note.year === item.year));
      if (entry) spread.push({ year: entry.year, text: '', tone: 'hard' });
    });
    expect(spread).toHaveLength(MIN_NOTES_FOR_SUMMARY);
    const summary = summarizeTimeline(years, spread);
    expect(summary.lines.join('')).toContain('沒有偏向哪一類');
  });

  it('永遠附上「這不是因果」的提醒', () => {
    const notes: TimelineNote[] = years.slice(0, 8).map((entry) => ({ year: entry.year, text: '', tone: 'hard' as const }));
    const summary = summarizeTimeline(years, notes);
    expect(summary.lines.at(-1)).toContain('不是因果');
  });

  it('摘要不做醫學歸因、不預測未來', () => {
    const notes: TimelineNote[] = years.slice(0, 8).map((entry) => ({ year: entry.year, text: '生病住院', tone: 'hard' as const }));
    const text = summarizeTimeline(years, notes).lines.join('');
    ['生病', '健康', '疾病', '身體', '明年', '未來會', '接下來會'].forEach((banned) => {
      expect(text, `不應出現「${banned}」`).not.toContain(banned);
    });
  });

  it('對應不到年份的筆記不會讓摘要壞掉', () => {
    const notes: TimelineNote[] = [
      ...years.slice(0, 6).map((entry) => ({ year: entry.year, text: '', tone: 'good' as const })),
      { year: 1800, text: '不存在的年份', tone: 'hard' },
    ];
    expect(() => summarizeTimeline(years, notes)).not.toThrow();
    expect(summarizeTimeline(years, notes).hasEnough).toBe(true);
  });
});

describe('紫微流年命宮', () => {
  const years = buildLifeTimeline(bazi, profile, today);

  it('逐年落在不同的本命宮位，不是每年都寫「命宮」', () => {
    const palaces = years.map((entry) => entry.yearlyPalace).filter(Boolean);
    expect(palaces.length).toBeGreaterThan(10);
    expect(new Set(palaces).size).toBeGreaterThan(1);
  });

  it('相鄰年份的流年命宮會移動', () => {
    const a = years.find((entry) => entry.year === 2024)?.yearlyPalace;
    const b = years.find((entry) => entry.year === 2025)?.yearlyPalace;
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(a).not.toBe(b);
  });

  it('十二年繞一圈，宮位會用滿', () => {
    const window = years.slice(0, 12).map((entry) => entry.yearlyPalace);
    expect(new Set(window).size).toBe(12);
  });
});
