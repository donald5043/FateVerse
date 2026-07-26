import { describe, expect, it } from 'vitest';
import { computeFateSnapshot, type FateSnapshot } from '../src/engines/fate-snapshot-engine';
import { buildReportFromProfile } from '../src/engines/build-report';
import { buildSystemMatrix, generateFusionReading } from '../src/engines/fusion-engine';
import type { FusionMatrix, FusionReading, ProfileInput } from '../src/types/fate';
import { HEDGES } from './specificity/voice-rules';

function snapshotFor(birthDate: string, birthTime = '10:30'): FateSnapshot {
  const profile: ProfileInput = {
    name: '林安晨', birthDate, birthTime, gender: 'female',
    region: '臺灣', timezone: 'Asia/Taipei', longitude: 121.5654, latitude: 25.033, focus: ['all'],
  };
  const { reportInput } = buildReportFromProfile(profile);
  return computeFateSnapshot(generateFusionReading(reportInput), buildSystemMatrix(reportInput));
}

/** 最小可用的融合結果，用來構造「完全沒有矛盾」與各種矛盾樣態。 */
function fakeReading(overrides: Partial<FusionReading> = {}): FusionReading {
  return {
    headline: '標題',
    plainIntro: '前言',
    systemsUsed: ['八字', '生肖', '西洋星座', '生命靈數'],
    consensus: {
      votes: [{ element: 'wood', votes: 3, systems: ['八字', '生肖', '生命靈數'] }],
      leading: ['wood'],
      agreementLevel: 'high',
      plainSummary: '代表「喜歡成長、往前展開」是你的主旋律。',
      mappingNotes: [],
    },
    axes: [],
    domains: [],
    highlights: [],
    cautions: [],
    ...overrides,
  };
}

/** 只有一條軸、且系統分成 3 對 1 的矩陣。value 正值代表 leftLabel。 */
const splitMatrix: FusionMatrix = {
  systems: ['八字', '生肖', '生命靈數', '西洋星座'],
  rows: [{
    axisId: 'pace', label: '行動節奏', leftLabel: '先衝再說', rightLabel: '想好再動',
    cells: [
      { system: '八字', value: 60 },
      { system: '生肖', value: 40 },
      { system: '生命靈數', value: 30 },
      { system: '西洋星座', value: -80 },
    ],
  }],
};

describe('命運速寫', () => {
  it('三組不同出生資料產生三組明顯不同的速寫', () => {
    const a = snapshotFor('1990-01-02');
    const b = snapshotFor('1985-07-15', '08:00');
    const c = snapshotFor('2001-11-23', '22:10');

    const texts = [a, b, c].map((s) => `${s.consensusLine}|${s.tensionLine ?? ''}|${s.closingLine}`);
    expect(new Set(texts).size).toBe(3);
    // 不只是換幾個字：共識句本身就要不同
    expect(new Set([a.consensusLine, b.consensusLine, c.consensusLine]).size).toBeGreaterThan(1);
  });

  it('相同輸入必得相同輸出（決定論）', () => {
    expect(snapshotFor('1990-01-02')).toEqual(snapshotFor('1990-01-02'));
  });

  it('沒有矛盾可報時 tensionLine 為 null，且不硬掰', () => {
    const snapshot = computeFateSnapshot(fakeReading());
    expect(snapshot.tensionLine).toBeNull();
    expect(snapshot.consensusLine.length).toBeGreaterThan(10);
    // 高度一致且無矛盾 → 收尾句講「同一個人」
    expect(snapshot.closingLine).toContain('同一個人');

    // 一致度不高且無矛盾 → 換另一種收尾句
    const base = fakeReading();
    const scattered = computeFateSnapshot({ ...base, consensus: { ...base.consensus, agreementLevel: 'low' } });
    expect(scattered.tensionLine).toBeNull();
    expect(scattered.closingLine).toContain('沒有互相打架');
    expect(scattered.closingLine).not.toBe(snapshot.closingLine);
  });

  it('軸線分裂時，矛盾句具體指名站在少數方的系統', () => {
    const snapshot = computeFateSnapshot(fakeReading(), splitMatrix);
    expect(snapshot.tensionLine).toBeTruthy();
    expect(snapshot.tensionLine).toContain('行動節奏');
    expect(snapshot.tensionLine).toContain('西洋星座');
    expect(snapshot.tensionLine).toContain('想好再動');
    // 多數方系統不應被誤植為少數方
    expect(snapshot.tensionLine).toContain('3 套系統');
  });

  it('沒有矩陣時改用矛盾亮點，仍指名系統', () => {
    const snapshot = computeFateSnapshot(fakeReading({
      highlights: [{
        kind: 'tension', title: '星座強調的能量，恰好是八字裡最少的五行',
        plainExplanation: '說明', systems: ['西洋星座', '四柱五行'],
      }],
    }));
    expect(snapshot.tensionLine).toContain('西洋星座');
    expect(snapshot.tensionLine).toContain('四柱五行');
  });

  it('票數分散樣態使用不同句型', () => {
    const scattered = computeFateSnapshot(fakeReading({
      highlights: [{
        kind: 'tension', title: '各系統看到的你相當不同',
        plainExplanation: '說明', systems: ['八字', '生肖', '生命靈數', '生日塔羅'],
      }],
    }));
    const elementGap = computeFateSnapshot(fakeReading({
      highlights: [{
        kind: 'tension', title: '星座強調的能量，恰好是八字裡最少的五行',
        plainExplanation: '說明', systems: ['西洋星座', '四柱五行'],
      }],
    }));
    expect(scattered.tensionLine).not.toBe(elementGap.tensionLine);
    expect(scattered.tensionLine).toContain('沒有一個元素過半');
  });

  it('三種一致程度給出三種共識句', () => {
    const lines = (['high', 'medium', 'low'] as const).map((agreementLevel) => {
      const base = fakeReading();
      return computeFateSnapshot({
        ...base,
        consensus: { ...base.consensus, agreementLevel },
      }).consensusLine;
    });
    expect(new Set(lines).size).toBe(3);
  });

  it('agreement 為 agreement 類型的亮點不會被當成矛盾', () => {
    const snapshot = computeFateSnapshot(fakeReading({
      highlights: [{ kind: 'agreement', title: '一致', plainExplanation: '說明', systems: ['八字', '生肖'] }],
    }));
    expect(snapshot.tensionLine).toBeNull();
  });

  it('回傳貢獻共識的系統名稱', () => {
    expect(computeFateSnapshot(fakeReading()).supportingSystems).toEqual(['八字', '生肖', '生命靈數']);
  });

  it('文案符合 voice.md：用「你」不用「您」、無模糊限定詞、無未來斷言', () => {
    const samples = [
      snapshotFor('1990-01-02'), snapshotFor('1985-07-15', '08:00'),
      snapshotFor('2001-11-23', '22:10'), snapshotFor('1978-03-30', '15:45'),
      computeFateSnapshot(fakeReading(), splitMatrix),
    ];
    for (const snapshot of samples) {
      const text = `${snapshot.consensusLine}${snapshot.tensionLine ?? ''}${snapshot.closingLine}`;
      expect(text).not.toContain('您');
      HEDGES.forEach((hedge) => expect(text, `不應出現限定詞「${hedge}」`).not.toContain(hedge));
      ['將會', '必定', '注定', '終將', '一定會', '勢必'].forEach((word) => {
        expect(text, `不應出現未來斷言「${word}」`).not.toContain(word);
      });
    }
  });
});
