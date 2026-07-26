import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import BarnumChallengeEntry from '../src/components/common/BarnumChallengeEntry';
import BarnumMirrorPage from '../src/pages/BarnumMirrorPage';
import { useFateStore } from '../src/store/useFateStore';

describe('巴納姆鏡子首頁入口', () => {
  afterEach(() => { cleanup(); useFateStore.getState().clearSession(); });

  it('以挑戰式提問開場，並標示不用輸入資料', () => {
    render(<MemoryRouter><BarnumChallengeEntry /></MemoryRouter>);
    expect(screen.getByText(/你分得出來/)).toBeTruthy();
    expect(screen.getByText('不用輸入任何資料也能玩')).toBeTruthy();
  });

  it('直接連往鏡子頁，不經過建檔頁', () => {
    render(<MemoryRouter><BarnumChallengeEntry /></MemoryRouter>);
    const link = screen.getByTestId('barnum-entry');
    expect(link.getAttribute('href')).toContain('/mirror');
    expect(link.getAttribute('href')).not.toContain('/profile');
  });

  it('未建立命盤時進入鏡子頁會落在示範模式，不被導向建檔頁', () => {
    // store 為空 = 沒有命盤
    expect(useFateStore.getState().reportInput).toBeUndefined();

    render(
      <MemoryRouter initialEntries={['/mirror']}>
        <Routes>
          <Route path="/mirror" element={<BarnumMirrorPage />} />
          <Route path="/profile" element={<div>建檔頁</div>} />
        </Routes>
      </MemoryRouter>,
    );

    // 沒有被導走：仍停在鏡子頁，且出現示範資料說明
    expect(screen.queryByText('建檔頁')).toBeNull();
    expect(screen.getByText(/示範資料/)).toBeTruthy();
  });
});
