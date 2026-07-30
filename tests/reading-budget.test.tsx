import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReportPage from '../src/pages/ReportPage';
import { buildReportFromProfile } from '../src/engines/build-report';
import {
  buildReportOpener, OPENER_EVIDENCE_MAX, OPENER_LINE_MAX, OPENER_TOTAL_MAX,
} from '../src/engines/report-opener-engine';
import { useFateStore } from '../src/store/useFateStore';
import type { ProfileInput } from '../src/types/fate';

/**
 * 閱讀量預算。
 *
 * 這個站原本有三條量測軸（巴納姆句出現率、口語度、靜態文案違規），全部在管
 * 「有沒有說謊、有沒有說廢話」，**沒有一條在管「一次要讀多少」**。
 * 有測試的軸會贏，所以每一輪都往更嚴謹推：報告 overview 長到 4,257 字，
 * 使用者的回饋是看不懂、不想用。
 *
 * 這裡把「短」也變成可以測的東西。深度沒有被刪掉，是收進摺疊區——
 * 所以量的是「預設看得到的字數」，不是總字數。
 */

const SAMPLES: [string, string][] = [
  ['1985-07-19', '03:20'],
  ['1990-01-02', '10:30'],
  ['2001-11-30', '21:10'],
  ['1977-04-05', '14:00'],
  ['1968-09-23', '08:15'],
];

function inputFor(birthDate: string, birthTime: string) {
  const profile: ProfileInput = {
    name: '示範', birthDate, birthTime, gender: 'female',
    region: '臺灣', timezone: 'Asia/Taipei', longitude: 121.5654, latitude: 25.033, focus: ['all'],
  };
  return buildReportFromProfile(profile);
}

/** 報告 overview 預設看得到的字數上限。 */
const OVERVIEW_VISIBLE_MAX = 800;

describe('首屏兩句話', () => {
  it('總長不超過上限，而且兩句都不是空的', () => {
    SAMPLES.forEach(([date, time]) => {
      const opener = buildReportOpener(inputFor(date, time).reportInput);
      const total = opener.line.length + opener.evidence.length;
      expect(opener.line.length, `${date} 結論是空的`).toBeGreaterThan(10);
      expect(opener.evidence.length, `${date} 依據是空的`).toBeGreaterThan(8);
      expect(opener.line.length, `${date} 結論 ${opener.line.length} 字`).toBeLessThanOrEqual(OPENER_LINE_MAX);
      expect(opener.evidence.length, `${date} 依據 ${opener.evidence.length} 字`).toBeLessThanOrEqual(OPENER_EVIDENCE_MAX);
      expect(
        total,
        `${date} 首屏共 ${total} 字，超過上限 ${OPENER_TOTAL_MAX}：\n  ${opener.line}\n  ${opener.evidence}`,
      ).toBeLessThanOrEqual(OPENER_TOTAL_MAX);
    });
  });

  it('第一句直接講人，不是講方法', () => {
    // fusion.headline 開頭是「把 8 套系統疊起來看」——那是方法說明。
    // 使用者讀到的第一句要回答「我是什麼樣的人」，不是「你用了幾套系統」。
    SAMPLES.forEach(([date, time]) => {
      const { line } = buildReportOpener(inputFor(date, time).reportInput);
      ['套系統', '換算', '並排', '本版', '判準'].forEach((meta) => {
        expect(line, `${date} 第一句不該出現方法說明「${meta}」：${line}`).not.toContain(meta);
      });
      expect(line.startsWith('你'), `${date} 第一句要從「你」開始：${line}`).toBe(true);
    });
  });

  it('依據是具體的盤面事實，不是形容詞', () => {
    SAMPLES.forEach(([date, time]) => {
      const opener = buildReportOpener(inputFor(date, time).reportInput);
      // 罕見特徵要附實測出現率；退回共識時要說幾套系統。
      const grounded = /每 \d+ 個人|\d+ 套系統|\d+%/.test(opener.evidence);
      expect(grounded, `${date} 依據沒有可查的數字：${opener.evidence}`).toBe(true);
    });
  });
});

describe('報告 overview 的閱讀量', () => {
  beforeEach(() => { vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined); });
  afterEach(() => { cleanup(); useFateStore.getState().clearSession(); vi.restoreAllMocks(); });

  /**
   * 收起的 `<details>` 內容在 DOM 裡仍然存在，所以不能直接數 textContent。
   * 這裡把每個未展開的 details 的內容區扣掉，量的才是「使用者實際看得到的字」。
   */
  function visibleText(root: HTMLElement): string {
    const clone = root.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('details:not([open])').forEach((details) => {
      details.querySelectorAll(':scope > *:not(summary)').forEach((child) => child.remove());
    });
    return (clone.textContent ?? '').replace(/\s+/g, '');
  }

  it('預設看得到的字數在預算內', () => {
    SAMPLES.forEach(([birthDate, birthTime]) => {
      cleanup();
      useFateStore.getState().clearSession();
      const profile: ProfileInput = {
        name: '示範', birthDate, birthTime, gender: 'female',
        region: '臺灣', timezone: 'Asia/Taipei', longitude: 121.5654, latitude: 25.033, focus: ['all'],
      };
      const { reportInput, report } = buildReportFromProfile(profile);
      useFateStore.getState().setProfile(profile, reportInput, report);

      const { container } = render(<MemoryRouter><ReportPage /></MemoryRouter>);
      const length = visibleText(container).length;
      expect(
        length,
        `${birthDate} 的 overview 預設顯示 ${length} 字，超過預算 ${OVERVIEW_VISIBLE_MAX}。`
        + '要加內容請放進 <Collapsible>，或先改這個預算並想清楚為什麼值得多要讀者幾百字。',
      ).toBeLessThanOrEqual(OVERVIEW_VISIBLE_MAX);
    });
  });

  it('深度沒有被刪掉，只是收起來', () => {
    const profile: ProfileInput = {
      name: '示範', birthDate: '1990-01-02', birthTime: '10:30', gender: 'female',
      region: '臺灣', timezone: 'Asia/Taipei', longitude: 121.5654, latitude: 25.033, focus: ['all'],
    };
    const { reportInput, report } = buildReportFromProfile(profile);
    useFateStore.getState().setProfile(profile, reportInput, report);
    const { container } = render(<MemoryRouter><ReportPage /></MemoryRouter>);

    // 摺疊區要存在，而且原本攤開的長內容要還在 DOM 裡。
    expect(container.querySelectorAll('details').length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText(report.summary)).toBeTruthy();
    ['過去、現在、未來', '共同點與不同視角', '關注主題與行動建議', '五行分布']
      .forEach((title) => expect(screen.getByText(title), `${title} 不見了`).toBeTruthy());
  });

  it('同一份資料不會在同一頁出現兩次', () => {
    const profile: ProfileInput = {
      name: '示範', birthDate: '1990-01-02', birthTime: '10:30', gender: 'female',
      region: '臺灣', timezone: 'Asia/Taipei', longitude: 121.5654, latitude: 25.033, focus: ['all'],
    };
    const { reportInput, report } = buildReportFromProfile(profile);
    useFateStore.getState().setProfile(profile, reportInput, report);
    render(<MemoryRouter><ReportPage /></MemoryRouter>);

    // sharedPatterns 原本同時出現在「綜合解讀摘要」（前三條）和「多系統共同點」（全部）。
    report.sharedPatterns.forEach((pattern) => {
      expect(screen.getAllByText(pattern), `「${pattern.slice(0, 16)}…」重複出現`).toHaveLength(1);
    });
  });
});
