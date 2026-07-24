import { describe, expect, it } from 'vitest';
import {
  CAPSULE_PRESETS, capsuleStatus, computeOpenDate, daysSince, daysUntil, sortCapsules,
  type CapsuleRecord,
} from '../src/engines/time-capsule-engine';

const NOW = new Date('2026-07-24T00:00:00Z');

function capsule(overrides: Partial<CapsuleRecord>): CapsuleRecord {
  return {
    id: overrides.id ?? '1',
    title: '測試',
    message: '給未來的自己',
    createdAt: '2026-07-01T00:00:00Z',
    openAt: '2026-10-01T00:00:00Z',
    ...overrides,
  };
}

describe('時間膠囊狀態', () => {
  it('開啟日未到為封存中', () => {
    expect(capsuleStatus(capsule({ openAt: '2026-12-01T00:00:00Z' }), NOW)).toBe('sealed');
  });
  it('開啟日已到但尚未開啟為可開啟', () => {
    expect(capsuleStatus(capsule({ openAt: '2026-07-01T00:00:00Z' }), NOW)).toBe('ready');
  });
  it('已開啟為 opened，不論日期', () => {
    expect(capsuleStatus(capsule({ openAt: '2026-01-01T00:00:00Z', openedAt: '2026-07-20T00:00:00Z' }), NOW)).toBe('opened');
  });
});

describe('日期計算', () => {
  it('daysUntil 未來為正、已過為 0', () => {
    expect(daysUntil('2026-08-03T00:00:00Z', NOW)).toBe(10);
    expect(daysUntil('2026-07-01T00:00:00Z', NOW)).toBe(0);
  });
  it('daysSince 過去為正、未來為 0', () => {
    expect(daysSince('2026-07-14T00:00:00Z', NOW)).toBe(10);
    expect(daysSince('2026-08-01T00:00:00Z', NOW)).toBe(0);
  });
  it('computeOpenDate 依天數往後推', () => {
    expect(computeOpenDate(30, NOW)).toBe(new Date('2026-08-23T00:00:00Z').toISOString());
  });
  it('預設涵蓋一個月到一年', () => {
    expect(CAPSULE_PRESETS.map((preset) => preset.days)).toEqual([30, 90, 180, 365]);
  });
});

describe('膠囊排序', () => {
  it('可開啟優先、其次封存中（最快到期在前）、最後已開啟（最近在前）', () => {
    const list: CapsuleRecord[] = [
      capsule({ id: 'sealed-late', openAt: '2026-12-01T00:00:00Z' }),
      capsule({ id: 'opened-old', openAt: '2026-01-01T00:00:00Z', openedAt: '2026-05-01T00:00:00Z' }),
      capsule({ id: 'ready', openAt: '2026-07-10T00:00:00Z' }),
      capsule({ id: 'sealed-soon', openAt: '2026-08-01T00:00:00Z' }),
      capsule({ id: 'opened-new', openAt: '2026-01-01T00:00:00Z', openedAt: '2026-07-20T00:00:00Z' }),
    ];
    expect(sortCapsules(list, NOW).map((item) => item.id)).toEqual([
      'ready', 'sealed-soon', 'sealed-late', 'opened-new', 'opened-old',
    ]);
  });
});
