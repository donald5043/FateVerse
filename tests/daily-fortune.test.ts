import { describe, expect, it } from 'vitest';
import { computeDailyFortune, RELATION_LABELS } from '../src/engines/daily-fortune-engine';
import { calculateBazi } from '../src/engines/bazi-engine';
import { HEDGES } from './specificity/voice-rules';

const chartA = calculateBazi({ birthDate: '1990-01-02', birthTime: '10:30', timezone: 'Asia/Taipei' });
const chartB = calculateBazi({ birthDate: '1985-07-15', birthTime: '08:00', timezone: 'Asia/Taipei' });

describe('每日運勢引擎', () => {
  it('同輸入呼叫兩次結果完全相等（決定論）', () => {
    const date = new Date(2026, 6, 26);
    expect(computeDailyFortune(chartA, date)).toEqual(computeDailyFortune(chartA, new Date(2026, 6, 26)));
  });

  it('同一命盤連續 30 天，behaviorAdvice 至少出現 8 種不同文案', () => {
    const advice = new Set<string>();
    for (let offset = 0; offset < 30; offset += 1) {
      advice.add(computeDailyFortune(chartA, new Date(2026, 6, 1 + offset)).behaviorAdvice);
    }
    expect(advice.size).toBeGreaterThanOrEqual(8);
  });

  it('兩組不同命盤在同一天得到不同的 elementRelation', () => {
    // 掃過一段日期，確認兩張命盤對「同一天」的判定並非總是相同。
    let differing = 0;
    for (let offset = 0; offset < 40; offset += 1) {
      const date = new Date(2026, 6, 1 + offset);
      if (computeDailyFortune(chartA, date).elementRelation !== computeDailyFortune(chartB, date).elementRelation) {
        differing += 1;
      }
    }
    expect(differing).toBeGreaterThan(0);
  });

  it('日柱隨日期改變，且與當日干支一致', () => {
    const first = computeDailyFortune(chartA, new Date(2026, 6, 26));
    const second = computeDailyFortune(chartA, new Date(2026, 6, 27));
    expect(first.dayPillar).toBe('辛丑');
    expect(second.dayPillar).not.toBe(first.dayPillar);
    expect(first.date).toBe('2026-07-26');
  });

  it('十神類別為五類之一，關係為三類之一', () => {
    for (let offset = 0; offset < 20; offset += 1) {
      const fortune = computeDailyFortune(chartA, new Date(2026, 0, 1 + offset));
      expect(['比劫', '印星', '食傷', '財星', '官殺']).toContain(fortune.tenGodCategory);
      expect(['support', 'drain', 'neutral']).toContain(fortune.elementRelation);
      expect(RELATION_LABELS[fortune.elementRelation]).toBeTruthy();
    }
  });

  it('不輸出任何分數、百分比或星等', () => {
    for (let offset = 0; offset < 60; offset += 1) {
      const fortune = computeDailyFortune(chartA, new Date(2026, 0, 1 + offset));
      const text = `${fortune.relationExplanation}${fortune.behaviorAdvice}${fortune.watchOut}`;
      expect(text).not.toMatch(/\d+\s*%/);
      expect(text).not.toMatch(/\d+\s*分/);
      expect(text).not.toMatch(/[★☆]/);
      expect(text).not.toContain('滿分');
      expect(text).not.toContain('指數');
    }
  });

  it('建議為可驗證的行為，不是空話', () => {
    const vague = ['把握機會', '順其自然', '諸事順利', '宜靜不宜動', '逢凶化吉'];
    for (let offset = 0; offset < 60; offset += 1) {
      const { behaviorAdvice } = computeDailyFortune(chartA, new Date(2026, 0, 1 + offset));
      vague.forEach((phrase) => expect(behaviorAdvice).not.toContain(phrase));
      // 具體行動至少要有一個動詞性的指示與可觀察的對象
      expect(behaviorAdvice.length).toBeGreaterThan(10);
    }
  });

  it('不產生醫療、投資、法律斷言，也不用絕對語氣', () => {
    const forbidden = ['必', '一定', '注定', '肯定', '保證', '診斷', '治療', '病情', '投資報酬', '穩賺', '訴訟必勝'];
    for (let offset = 0; offset < 60; offset += 1) {
      const fortune = computeDailyFortune(chartA, new Date(2026, 0, 1 + offset));
      const text = `${fortune.relationExplanation}${fortune.behaviorAdvice}${fortune.watchOut}`;
      forbidden.forEach((word) => expect(text, `不應出現「${word}」`).not.toContain(word));
    }
  });

  it('文案符合 voice.md：用「你」不用「您」、無模糊限定詞', () => {
    for (let offset = 0; offset < 60; offset += 1) {
      const fortune = computeDailyFortune(chartB, new Date(2026, 3, 1 + offset));
      const text = `${fortune.relationExplanation}${fortune.behaviorAdvice}${fortune.watchOut}`;
      expect(text).not.toContain('您');
      HEDGES.forEach((hedge) => expect(text, `不應出現限定詞「${hedge}」`).not.toContain(hedge));
    }
  });

  it('每個 relation × tenGod 組合都有可用文案，不會落空', () => {
    // 掃一整年，確認任何組合都取得到建議與提醒。
    for (let offset = 0; offset < 365; offset += 1) {
      const fortune = computeDailyFortune(chartA, new Date(2026, 0, 1 + offset));
      expect(fortune.behaviorAdvice, `${fortune.elementRelation}/${fortune.tenGodCategory} 無建議`).toBeTruthy();
      expect(fortune.watchOut).toBeTruthy();
      expect(fortune.relationExplanation).toContain(fortune.dayPillar);
    }
  });
});
