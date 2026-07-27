import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, unknown>();
const writes: string[] = [];

vi.mock('idb-keyval', () => ({
  get: async (key: string) => store.get(key),
  set: async (key: string, value: unknown) => { writes.push(key); store.set(key, value); },
  del: async (key: string) => { store.delete(key); },
  clear: async () => { store.clear(); },
}));

vi.stubGlobal('indexedDB', {});

const KEY = 'fateverse:life-timeline';

describe('回顧日誌的同意閘門', () => {
  beforeEach(() => { store.clear(); writes.length = 0; });

  it('未同意時寫不進去，也不留下任何 key', async () => {
    const { saveTimelineNote, loadTimelineNotes } = await import('../src/utils/storage');
    const result = await saveTimelineNote({ year: 2024, text: '換了工作' });

    expect(writes).toEqual([]);
    expect(store.has(KEY)).toBe(false);
    expect(result.notes).toEqual([]);
    expect((await loadTimelineNotes()).consented).toBe(false);
  });

  it('同意之後寫得進去，並依年份新到舊排序', async () => {
    const { grantTimelineConsent, saveTimelineNote } = await import('../src/utils/storage');
    await grantTimelineConsent();
    await saveTimelineNote({ year: 2020, text: '搬家' });
    await saveTimelineNote({ year: 2024, text: '換了工作', tone: 'good' });
    const result = await saveTimelineNote({ year: 2022, text: '休息了一年' });

    expect(result.notes.map((note) => note.year)).toEqual([2024, 2022, 2020]);
  });

  it('同一年再寫會覆蓋，不會累積兩筆', async () => {
    const { grantTimelineConsent, saveTimelineNote } = await import('../src/utils/storage');
    await grantTimelineConsent();
    await saveTimelineNote({ year: 2024, text: '第一版' });
    const result = await saveTimelineNote({ year: 2024, text: '改過的版本', tone: 'hard' });

    expect(result.notes).toHaveLength(1);
    expect(result.notes[0]).toMatchObject({ text: '改過的版本', tone: 'hard' });
  });

  it('內容清空且沒有標記時等同刪除那一年', async () => {
    const { grantTimelineConsent, saveTimelineNote } = await import('../src/utils/storage');
    await grantTimelineConsent();
    await saveTimelineNote({ year: 2024, text: '寫過的東西' });
    const result = await saveTimelineNote({ year: 2024, text: '   ' });

    expect(result.notes).toEqual([]);
  });

  it('只標記調性、沒寫字的年份要留著', async () => {
    const { grantTimelineConsent, saveTimelineNote } = await import('../src/utils/storage');
    await grantTimelineConsent();
    const result = await saveTimelineNote({ year: 2024, text: '', tone: 'mixed' });

    expect(result.notes).toHaveLength(1);
    expect(result.notes[0].tone).toBe('mixed');
  });

  it('清除會刪掉整個 key，連同意一起收回', async () => {
    const { grantTimelineConsent, saveTimelineNote, clearTimelineNotes, loadTimelineNotes } = await import('../src/utils/storage');
    await grantTimelineConsent();
    await saveTimelineNote({ year: 2024, text: '記錄' });
    await clearTimelineNotes();

    expect(store.has(KEY)).toBe(false);
    expect(await loadTimelineNotes()).toEqual({ consented: false, notes: [] });
  });

  it('沒有 IndexedDB 時讀取不會爆，寫入明確報錯', async () => {
    const { loadTimelineNotes, saveTimelineNote, grantTimelineConsent } = await import('../src/utils/storage');
    vi.stubGlobal('indexedDB', undefined);
    try {
      await expect(loadTimelineNotes()).resolves.toEqual({ consented: false, notes: [] });
      await expect(grantTimelineConsent()).rejects.toThrow('無法保存');
      await expect(saveTimelineNote({ year: 2024, text: 'x' })).rejects.toThrow('無法保存');
      expect(writes).toEqual([]);
    } finally {
      vi.stubGlobal('indexedDB', {});
    }
  });

  it('回顧日誌與今日回饋各存各的，互不影響', async () => {
    const { grantTimelineConsent, saveTimelineNote, loadFeedback } = await import('../src/utils/storage');
    await grantTimelineConsent();
    await saveTimelineNote({ year: 2024, text: '記錄' });

    expect(store.has('fateverse:daily-feedback')).toBe(false);
    expect((await loadFeedback()).consented).toBe(false);
  });
});
