import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DailyFortuneCard from '../src/components/common/DailyFortuneCard';
import { buildReportFromProfile } from '../src/engines/build-report';
import { useFateStore } from '../src/store/useFateStore';
import type { ProfileInput } from '../src/types/fate';

function seedChart() {
  const profile: ProfileInput = {
    name: '林安晨', birthDate: '1990-01-02', birthTime: '10:30', gender: 'female',
    region: '臺灣', timezone: 'Asia/Taipei', focus: ['all'],
  };
  const { reportInput, report } = buildReportFromProfile(profile);
  useFateStore.getState().setProfile(profile, reportInput, report);
}

const renderCard = (today?: Date) => render(
  <MemoryRouter><DailyFortuneCard today={today} /></MemoryRouter>,
);

describe('今日與你卡片', () => {
  afterEach(() => { cleanup(); useFateStore.getState().clearSession(); vi.restoreAllMocks(); });

  it('沒有命盤時顯示前往建檔的引導', () => {
    renderCard();
    expect(screen.getByRole('link', { name: /先建立命盤/ })).toBeTruthy();
    expect(screen.queryByText(/今天可以做的一件事/)).toBeNull();
  });

  it('有命盤時顯示當日干支與一件具體行動', () => {
    seedChart();
    renderCard(new Date(2026, 6, 26));
    // 干支同時出現在徽章與說明句，兩處都應是當日日柱。
    expect(screen.getAllByText(/辛丑日/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('今天可以做的一件事')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /先建立命盤/ })).toBeNull();
  });

  it('不顯示分數或星等，只顯示描述性分類', () => {
    seedChart();
    const { container } = renderCard(new Date(2026, 6, 26));
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/\d+\s*%/);
    expect(text).not.toMatch(/[★☆]/);
    expect(text).toMatch(/順手|耗力|中性/);
  });

  it('渲染過程完全不發出網路請求（可離線）', () => {
    seedChart();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('離線'));
    renderCard(new Date(2026, 6, 26));
    expect(screen.getByText('今天可以做的一件事')).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('不同日期顯示不同的行動建議', () => {
    seedChart();
    const { container } = renderCard(new Date(2026, 6, 26));
    const first = container.textContent ?? '';
    cleanup();
    const { container: next } = renderCard(new Date(2026, 6, 29));
    expect(next.textContent).not.toBe(first);
  });
});
