import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** 以記憶體版取代 IndexedDB，讓「有沒有真的寫入」變成可斷言的事實。 */
const store = new Map<string, unknown>();
const writes: string[] = [];

vi.mock('idb-keyval', () => ({
  get: async (key: string) => store.get(key),
  set: async (key: string, value: unknown) => { writes.push(key); store.set(key, value); },
  del: async (key: string) => { store.delete(key); },
  clear: async () => { store.clear(); },
}));

// storage 會先確認環境有 IndexedDB 才呼叫 idb-keyval；jsdom 沒有，補一個佔位。
vi.stubGlobal('indexedDB', {});

const { default: DailyFeedback } = await import('../src/components/common/DailyFeedback');

const today = new Date(2026, 6, 26);

/** 點一下並等非同步寫入落地。專案沒有 user-event，用 fireEvent 就夠。 */
async function click(element: HTMLElement | Promise<HTMLElement>): Promise<void> {
  const target = await element;
  await act(async () => { fireEvent.click(target); });
}

describe('今日回饋', () => {
  beforeEach(() => { store.clear(); writes.length = 0; });
  afterEach(cleanup);

  it('未同意前不寫入任何資料，也不顯示評分按鈕', async () => {
    render(<DailyFeedback today={today} />);
    await screen.findByText('好，開始記錄');

    expect(writes).toEqual([]);
    expect(store.size).toBe(0);
    expect(screen.queryByRole('button', { name: '準' })).toBeNull();
  });

  it('同意後才出現按鈕，標記會寫入紀錄', async () => {
    render(<DailyFeedback today={today} />);
    await click(await screen.findByText('好，開始記錄'));

    await click(await screen.findByRole('button', { name: '準' }));
    await waitFor(() => {
      expect(store.get('fateverse:daily-feedback')).toMatchObject({
        consented: true,
        records: [{ date: '2026-07-26', verdict: 'accurate' }],
      });
    });
  });

  it('同一天改選會覆蓋，不會累積兩筆', async () => {
    render(<DailyFeedback today={today} />);
    await click(await screen.findByText('好，開始記錄'));
    await click(await screen.findByRole('button', { name: '準' }));
    await click(await screen.findByRole('button', { name: '不準' }));

    await waitFor(() => {
      const saved = store.get('fateverse:daily-feedback') as { records: unknown[] };
      expect(saved.records).toHaveLength(1);
      expect(saved.records[0]).toMatchObject({ verdict: 'off' });
    });
    expect(screen.getByRole('button', { name: '不準' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('樣本不足時說「資料還太少」而不是給百分比', async () => {
    store.set('fateverse:daily-feedback', {
      consented: true,
      records: [{ date: '2026-07-26', verdict: 'accurate' }, { date: '2026-07-25', verdict: 'off' }],
    });
    render(<DailyFeedback today={today} />);
    expect(await screen.findByText(/資料還太少/)).toBeTruthy();
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it('刪除紀錄會清掉 key 並退回未同意狀態', async () => {
    store.set('fateverse:daily-feedback', {
      consented: true,
      records: [{ date: '2026-07-26', verdict: 'accurate' }],
    });
    render(<DailyFeedback today={today} />);
    await click(await screen.findByText('刪除全部回饋紀錄'));

    await waitFor(() => expect(store.has('fateverse:daily-feedback')).toBe(false));
    expect(await screen.findByText('好，開始記錄')).toBeTruthy();
  });
});

describe('儲存層的同意閘門', () => {
  beforeEach(() => { store.clear(); writes.length = 0; });

  it('未同意時呼叫 saveFeedback 不會寫入任何東西', async () => {
    const { saveFeedback, loadFeedback } = await import('../src/utils/storage');
    const result = await saveFeedback({ date: '2026-07-26', verdict: 'accurate' });

    expect(writes).toEqual([]);
    expect(result.records).toEqual([]);
    expect((await loadFeedback()).consented).toBe(false);
  });

  it('同意之後才寫得進去', async () => {
    const { grantFeedbackConsent, saveFeedback } = await import('../src/utils/storage');
    await grantFeedbackConsent();
    const result = await saveFeedback({ date: '2026-07-26', verdict: 'neutral' });
    expect(result.records).toHaveLength(1);
  });

  it('沒有 IndexedDB 的環境（隱私模式）讀取不會爆，寫入則明確報錯', async () => {
    const { loadFeedback, saveFeedback, grantFeedbackConsent } = await import('../src/utils/storage');
    vi.stubGlobal('indexedDB', undefined);
    try {
      await expect(loadFeedback()).resolves.toEqual({ consented: false, records: [] });
      await expect(grantFeedbackConsent()).rejects.toThrow('無法保存');
      await expect(saveFeedback({ date: '2026-07-26', verdict: 'accurate' })).rejects.toThrow('無法保存');
      expect(writes).toEqual([]);
    } finally {
      vi.stubGlobal('indexedDB', {});
    }
  });
});
