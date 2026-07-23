import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import BarnumMirrorPage from '../src/pages/BarnumMirrorPage';
import { useFateStore } from '../src/store/useFateStore';

function renderPage() {
  return render(<MemoryRouter><BarnumMirrorPage /></MemoryRouter>);
}

describe('巴納姆效應鏡子頁面', () => {
  afterEach(() => useFateStore.getState().clearSession());

  it('沒有命盤時提示使用示範資料，並可完成一輪盲測與揭曉', () => {
    renderPage();
    expect(screen.getByText(/還沒有建立自己的命盤/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /開始盲測/ }));
    expect(screen.getAllByText(/^組 [AB]$/).length).toBe(2);

    const [firstGuessButton] = screen.getAllByRole('button', { name: '我覺得這組更像我' });
    fireEvent.click(firstGuessButton);

    expect(screen.getAllByText(/真實命盤/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/通用巴納姆句/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /再測一次/ })).toBeInTheDocument();
    expect(screen.getByText('冷讀術技巧圖鑑')).toBeInTheDocument();
  });
});
