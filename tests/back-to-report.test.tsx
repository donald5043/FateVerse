import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import BackToReportLink from '../src/components/common/BackToReportLink';
import { useFateStore } from '../src/store/useFateStore';
import { calculateSunSign } from '../src/engines/astrology-engine';
import { calculateBazi } from '../src/engines/bazi-engine';
import { calculateFiveElements } from '../src/engines/five-elements-engine';
import { calculateNumerology } from '../src/engines/numerology-engine';
import { getZodiacResult } from '../src/engines/zodiac-engine';
import { generateFallbackReport } from '../src/ai/fallback-report';
import type { ProfileInput } from '../src/types/fate';

function seedReport(name: string) {
  const bazi = calculateBazi({ birthDate: '1990-01-02', birthTime: '10:30', timezone: 'Asia/Taipei' });
  const reportInput = {
    userFocus: ['all'],
    bazi,
    fiveElements: calculateFiveElements(bazi.pillars),
    zodiac: getZodiacResult(bazi.zodiac),
    astrology: calculateSunSign('1990-01-02'),
    numerology: calculateNumerology('1990-01-02'),
  };
  const profile: ProfileInput = { name, birthDate: '1990-01-02', birthTime: '10:30', gender: 'female', region: '臺灣', timezone: 'Asia/Taipei', focus: ['all'] };
  useFateStore.getState().setProfile(profile, reportInput, generateFallbackReport(reportInput));
}

describe('回到報告返回條', () => {
  afterEach(() => { cleanup(); useFateStore.getState().clearSession(); });

  it('沒有報告時不顯示', () => {
    render(<MemoryRouter><BackToReportLink /></MemoryRouter>);
    expect(screen.queryByRole('link', { name: /回到完整報告/ })).toBeNull();
  });

  it('有報告時顯示連往 /report 的返回連結，並帶入姓名', () => {
    seedReport('小明');
    render(<MemoryRouter><BackToReportLink /></MemoryRouter>);
    const link = screen.getByRole('link', { name: /回到完整報告/ });
    expect(link).toHaveAttribute('href', '/report');
    expect(screen.getByText(/小明的萬象報告已經建立好/)).toBeInTheDocument();
  });

  it('可覆寫提示文字', () => {
    seedReport('小華');
    render(<MemoryRouter><BackToReportLink note="自訂提示" /></MemoryRouter>);
    expect(screen.getByText('自訂提示')).toBeInTheDocument();
  });
});
