import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRouteScrollReset } from '../src/hooks/useRouteScrollReset';
import { calculateStickyScrollTop, preferredScrollBehavior } from '../src/utils/scroll';

describe('頁面與報告捲動', () => {
  afterEach(() => vi.restoreAllMocks());

  it('切換路由時自動回到頁面頂部', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const { rerender } = renderHook(({ pathname }) => useRouteScrollReset(pathname), { initialProps: { pathname: '/profile' } });
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'auto' });
    scrollTo.mockClear();
    rerender({ pathname: '/report' });
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });

  it('分類定位扣除固定頁首、分類列與間距', () => {
    expect(calculateStickyScrollTop(500, 900, 64, 56)).toBe(1268);
    expect(calculateStickyScrollTop(20, 0, 64, 56)).toBe(0);
  });

  it('減少動態效果時不使用平滑捲動', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    expect(preferredScrollBehavior()).toBe('auto');
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    expect(preferredScrollBehavior()).toBe('smooth');
    vi.unstubAllGlobals();
  });
});
