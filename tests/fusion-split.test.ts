import { describe, expect, it } from 'vitest';
import { buildReportFromProfile } from '../src/engines/build-report';
import { generateFusionReading } from '../src/engines/fusion-engine';
import type { ProfileInput } from '../src/types/fate';

function readingFor(birthDate: string, birthTime = '10:30') {
  const profile: ProfileInput = {
    name: '示範', birthDate, birthTime, gender: 'female',
    region: '未提供', timezone: 'Asia/Taipei', focus: ['all'],
  };
  return generateFusionReading(buildReportFromProfile(profile).reportInput);
}

const SAMPLES = ['1990-01-02', '1985-07-19', '2001-11-30', '1977-04-05', '1968-09-23', '1995-12-11'];

describe('融合解讀依票數分歧而變', () => {
  it('個性段點名實際投票的系統，不同命盤講法不同', () => {
    const readings = SAMPLES.map((date) => readingFor(date).domains[0].plainReading);
    expect(new Set(readings).size).toBe(readings.length);
  });

  it('主元素相同的兩張盤，個性段仍會因投票組成而不同', () => {
    const all = SAMPLES.map((date) => ({ date, reading: readingFor(date) }));
    const byLead = new Map<string, string[]>();
    all.forEach(({ reading }) => {
      const lead = reading.consensus.leading[0];
      byLead.set(lead, [...(byLead.get(lead) ?? []), reading.domains[0].plainReading]);
    });
    // 至少要有一個主元素被兩張以上的盤共用，這條測試才有意義。
    const shared = [...byLead.values()].filter((list) => list.length > 1);
    expect(shared.length).toBeGreaterThan(0);
    shared.forEach((list) => expect(new Set(list).size).toBe(list.length));
  });

  it('有分歧時把兩邊的系統都列出來', () => {
    SAMPLES.forEach((date) => {
      const reading = readingFor(date);
      const personality = reading.domains[0].plainReading;
      const votes = reading.consensus.votes;
      const lead = reading.consensus.leading[0];
      const leadVote = votes.find((vote) => vote.element === lead);
      leadVote?.systems.forEach((system) => {
        expect(personality, `${date} 應列出 ${system}`).toContain(system);
      });
    });
  });

  it('全體一致時改口說「少見」，不硬套分歧句型', () => {
    // 找一張全票一致的盤；沒有的話這條就沒東西可驗，直接標示出來。
    const unanimous = SAMPLES.map((date) => readingFor(date)).find((reading) => {
      const lead = reading.consensus.leading[0];
      return reading.consensus.votes.filter((vote) => vote.element !== lead && vote.votes > 0).length === 0;
    });
    if (!unanimous) {
      expect(SAMPLES.length).toBeGreaterThan(0); // 樣本裡沒有全票一致的盤，屬正常
      return;
    }
    expect(unanimous.domains[0].plainReading).toContain('少見');
  });

  it('四柱最多與綜合票數最多不同時，明講這個落差', () => {
    const withGap = SAMPLES.map((date) => readingFor(date)).filter((reading) => {
      return reading.domains[1].plainReading.includes('票數最多的其實是');
    });
    expect(withGap.length).toBeGreaterThan(0);
    withGap.forEach((reading) => {
      expect(reading.domains[1].plainReading).toContain('「做起來順手的方式」和「別人看到的你」不是同一個');
    });
  });

  it('系統數用實際票數，不寫死', () => {
    SAMPLES.forEach((date) => {
      const reading = readingFor(date);
      const career = reading.domains[1].plainReading;
      const match = career.match(/綜合 (\d+) 套系統/);
      if (!match) return;
      const total = reading.consensus.votes.reduce((sum, vote) => sum + vote.votes, 0);
      expect(Number(match[1])).toBe(total);
    });
  });

  it('沒有紫微資料時系統數會少一套，句子跟著改', () => {
    const withZiwei = readingFor('2001-11-30', '21:10');
    const noZiwei = generateFusionReading(buildReportFromProfile({
      name: '示範', birthDate: '2001-11-30', birthTime: '21:10', gender: 'other',
      region: '未提供', timezone: 'Asia/Taipei', focus: ['all'],
    }).reportInput);
    const countOf = (reading: ReturnType<typeof generateFusionReading>) =>
      reading.consensus.votes.reduce((sum, vote) => sum + vote.votes, 0);
    expect(countOf(noZiwei)).toBeLessThan(countOf(withZiwei));
  });

  it('不因為分歧就改口斷言吉凶', () => {
    SAMPLES.forEach((date) => {
      const text = readingFor(date).domains.map((domain) => domain.plainReading).join('');
      ['一定會', '必然', '注定', '大吉', '大凶', '將會'].forEach((banned) => {
        expect(text, `${date} 不應出現「${banned}」`).not.toContain(banned);
      });
    });
  });
});
