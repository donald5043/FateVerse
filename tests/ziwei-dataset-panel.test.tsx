import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ZiweiDatasetPanel from '../src/components/report/ZiweiDatasetPanel';
import { lookupZiweiDataset, type ZiweiDatasetReading } from '../src/engines/ziwei-dataset';

vi.mock('../src/engines/ziwei-dataset', async (importOriginal) => ({
  ...await importOriginal<typeof import('../src/engines/ziwei-dataset')>(),
  lookupZiweiDataset: vi.fn(),
}));

const profile = { birthDate: '1990-01-01', birthTime: '00:30', gender: 'male' as const };
const reading: ZiweiDatasetReading = {
  lookup: { year: 1990, row: 0, date: '1990-01-01', hourIndex: 0, gender: 'male', key: '1990-01-01-0-male', rolledForward: false },
  summaries: [{ topic: 'overview', label: '命格總覽', text: '來源的命格摘要。' }],
};

afterEach(() => { cleanup(); vi.mocked(lookupZiweiDataset).mockReset(); });

describe('開源摘要入口', () => {
  it('使用者選擇查閱才讀資料，顯示來源與可展開的解讀', async () => {
    vi.mocked(lookupZiweiDataset).mockResolvedValue(reading);
    render(<ZiweiDatasetPanel profile={profile} />);
    expect(lookupZiweiDataset).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '查閱我的 13 類摘要' }));
    await screen.findByText('來源的命格摘要。');
    expect(screen.getByText('命格總覽').closest('details')).not.toHaveAttribute('open');
    expect(screen.getByRole('link', { name: '紫微斗數開源解讀資料集 v4.0' })).toHaveAttribute('href', 'https://github.com/Renhuai123/ziwei-doushu');
    expect(screen.getByRole('status')).toHaveTextContent('1990-01-01');
  });

  it('讀取失敗保留重試入口，成功後清除錯誤', async () => {
    vi.mocked(lookupZiweiDataset).mockRejectedValueOnce(new Error('年份資料暫時無法讀取')).mockResolvedValueOnce(reading);
    render(<ZiweiDatasetPanel profile={profile} />);
    fireEvent.click(screen.getByRole('button', { name: '查閱我的 13 類摘要' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('年份資料暫時無法讀取');
    fireEvent.click(screen.getByRole('button', { name: '查閱我的 13 類摘要' }));
    await screen.findByText('來源的命格摘要。');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('切換出生資料時取消舊查詢，不顯示上一個人的結果', async () => {
    let resolveOld!: (value: ZiweiDatasetReading) => void;
    vi.mocked(lookupZiweiDataset).mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }));
    const { rerender } = render(<ZiweiDatasetPanel profile={profile} />);
    fireEvent.click(screen.getByRole('button', { name: '查閱我的 13 類摘要' }));
    const signal = vi.mocked(lookupZiweiDataset).mock.calls[0][1]!;
    rerender(<ZiweiDatasetPanel profile={{ ...profile, birthDate: '1991-01-01' }} />);
    expect(signal.aborted).toBe(true);
    resolveOld(reading);
    await waitFor(() => expect(screen.queryByText('來源的命格摘要。')).toBeNull());
    expect(screen.getByRole('button', { name: '查閱我的 13 類摘要' })).toBeEnabled();
  });
});
