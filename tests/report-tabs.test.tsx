import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReportPage from '../src/pages/ReportPage';
import { buildReportFromProfile } from '../src/engines/build-report';
import { useFateStore } from '../src/store/useFateStore';
import type { ProfileInput } from '../src/types/fate';

function seed(name: string) {
  const profile: ProfileInput = {
    name, birthDate: '1990-01-02', birthTime: '10:30', gender: 'female',
    region: '臺灣', timezone: 'Asia/Taipei', longitude: 121.5654, latitude: 25.033, focus: ['all'],
  };
  const { reportInput, report } = buildReportFromProfile(profile);
  useFateStore.getState().setProfile(profile, reportInput, report);
}

const renderReport = () => render(<MemoryRouter><ReportPage /></MemoryRouter>);

describe('報告分頁', () => {
  // jsdom 沒有實作 window.scrollTo，未攔截會在每次分頁切換時噴錯訊息。
  beforeEach(() => { vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined); });
  afterEach(() => { cleanup(); useFateStore.getState().clearSession(); vi.restoreAllMocks(); });

  it('有姓名時提供獨立的姓名學分頁', () => {
    seed('林安晨');
    renderReport();
    const tab = screen.getByRole('button', { name: '姓名學' });
    fireEvent.click(tab);
    expect(screen.getByRole('heading', { name: '姓名學' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '姓名分析' })).toBeTruthy();
  });

  it('沒有姓名時不顯示姓名學分頁', () => {
    seed('');
    renderReport();
    expect(screen.queryByRole('button', { name: '姓名學' })).toBeNull();
  });

  it('姓名分析已移出生命靈數分頁', () => {
    seed('林安晨');
    renderReport();
    fireEvent.click(screen.getByRole('button', { name: '生命靈數' }));
    expect(screen.queryByRole('heading', { name: '姓名分析' })).toBeNull();
  });

  it('切換分頁時捲回該分類的最上方', () => {
    seed('林安晨');
    const scrollTo = vi.mocked(window.scrollTo);
    // jsdom 不會自動執行 rAF 回呼，改為同步觸發以便觀察捲動行為。
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });

    renderReport();
    fireEvent.click(screen.getByRole('button', { name: '八字' }));

    expect(scrollTo).toHaveBeenCalledTimes(1);
    const call = scrollTo.mock.calls[0][0] as ScrollToOptions;
    expect(call.top).toBeGreaterThanOrEqual(0);
    expect(call.left).toBe(0);
  });
});
