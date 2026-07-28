import { describe, expect, it } from 'vitest';
import { buildReportFromProfile } from '../src/engines/build-report';
import { computeDailyFusion } from '../src/engines/daily-fusion-engine';
import type { ProfileInput } from '../src/types/fate';

const profile: ProfileInput = {
  name: '示範', birthDate: '1990-01-02', birthTime: '10:30', gender: 'female',
  region: '未提供', timezone: 'Asia/Taipei', focus: ['all'],
};
const input = buildReportFromProfile(profile).reportInput;
const today = new Date(2026, 6, 27);

describe('今日綜合', () => {
  it('五套系統都出面', () => {
    const systems = computeDailyFusion(input, profile, today).signals.map((item) => item.system);
    expect(systems).toEqual(expect.arrayContaining(['八字', '生肖', '紫微斗數', '塔羅']));
    expect(systems.length).toBeGreaterThanOrEqual(4);
  });

  it('每套系統各出現一次，不會重複佔位', () => {
    const systems = computeDailyFusion(input, profile, today).signals.map((item) => item.system);
    expect(new Set(systems).size).toBe(systems.length);
  });

  it('不做加權平均，也不給總分', () => {
    const text = JSON.stringify(computeDailyFusion(input, profile, today));
    expect(text).not.toMatch(/\d+\s*分(?!鐘)/);
    ['總分', '平均', '加權', '運勢指數', '滿分', '星等'].forEach((banned) => {
      expect(text, `不應出現「${banned}」`).not.toContain(banned);
    });
  });

  it('分歧時如實說沒有共識，不硬湊一個結論', () => {
    let split = 0;
    for (let day = 0; day < 60; day += 1) {
      const fusion = computeDailyFusion(input, profile, new Date(2026, 0, 1 + day));
      if (fusion.agreement === 'split') {
        split += 1;
        expect(fusion.headline).toContain('沒有共識');
        expect(fusion.closing).toContain('你比較想相信哪一邊');
      }
    }
    // 五套不同前提的系統，分歧本來就該是常態。完全不分歧代表判定寫壞了。
    expect(split).toBeGreaterThan(0);
  });

  it('一致時的數字對得上各系統的表態', () => {
    for (let day = 0; day < 60; day += 1) {
      const fusion = computeDailyFusion(input, profile, new Date(2026, 0, 1 + day));
      const smooth = fusion.signals.filter((item) => item.tone === 'smooth').length;
      const friction = fusion.signals.filter((item) => item.tone === 'friction').length;
      if (fusion.agreement !== 'split') continue;
      expect(fusion.headline).toContain(`${smooth} 套說順`);
      expect(fusion.headline).toContain(`${friction} 套說卡`);
    }
  });

  it('沒有命盤時只剩塔羅，而且不講「1 套系統裡有 1 套」這種廢話', () => {
    const fusion = computeDailyFusion(undefined, undefined, today);
    expect(fusion.signals.map((item) => item.system)).toEqual(['塔羅']);
    expect(fusion.headline).not.toMatch(/1 套系統裡有 1 套/);
    expect(fusion.headline).toContain('建立命盤');
  });

  it('紫微宮位講成白話，不會冒出「「命」這類題目」', () => {
    for (let day = 0; day < 40; day += 1) {
      const ziwei = computeDailyFusion(input, profile, new Date(2026, 0, 1 + day))
        .signals.find((item) => item.system === '紫微斗數');
      if (!ziwei) continue;
      expect(ziwei.note).not.toContain('「命」');
      expect(ziwei.note).not.toMatch(/「.」這類題目/);
    }
  });

  it('同一天重算結果一致', () => {
    expect(computeDailyFusion(input, profile, today)).toEqual(computeDailyFusion(input, profile, today));
  });

  it('不同天會換內容', () => {
    const a = computeDailyFusion(input, profile, today);
    const b = computeDailyFusion(input, profile, new Date(2026, 6, 28));
    expect(a.signals).not.toEqual(b.signals);
  });

  it('不預測、不斷言吉凶', () => {
    for (let day = 0; day < 40; day += 1) {
      const fusion = computeDailyFusion(input, profile, new Date(2026, 0, 1 + day));
      const text = [fusion.headline, fusion.closing, ...fusion.signals.map((item) => item.note)].join('');
      ['你會遇到', '將會', '必然', '注定', '一定會', '大吉', '大凶'].forEach((banned) => {
        expect(text, `不應出現「${banned}」`).not.toContain(banned);
      });
    }
  });

  it('生肖沖合用的是共用的地支規則', () => {
    // 1990-01-02 生肖為蛇（巳）。巳亥相沖，所以亥日必須判為「卡」。
    expect(input.zodiac.branch).toBe('巳');
    let sawClash = false;
    // 亥日每 12 天一輪，14 天必定涵蓋到，不需要跑上百天（每次都要重排紫微盤）。
    for (let day = 0; day < 14; day += 1) {
      const zodiac = computeDailyFusion(input, profile, new Date(2026, 0, 1 + day))
        .signals.find((item) => item.system === '生肖');
      if (zodiac?.label.includes('地支六沖')) {
        sawClash = true;
        expect(zodiac.tone).toBe('friction');
      }
    }
    expect(sawClash).toBe(true);
  });
});
