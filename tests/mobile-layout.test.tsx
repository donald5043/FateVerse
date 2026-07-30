import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import DailyFeedback from '../src/components/common/DailyFeedback';

/**
 * 手機直式的版面約束。
 *
 * 為什麼需要：手機直式是主要瀏覽情境，但所有版面決定都是在寬螢幕上做的。
 * 實測（CDP 裝置模擬，390×844）改版前：
 *   首頁 4,552px＝5.4 個手機螢幕
 *   報告 3,616px，而首屏那兩句話要捲到 y≈650 才看得到
 *
 * jsdom 沒有版面計算，量不到 px，所以這裡守的是「當初為手機做的決定」本身。
 * 每一條都對應一個量過的數字，改動前請先在 390px 實機或模擬器上量一次。
 */

const root = resolve(__dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('手機直式：首頁', () => {
  const source = read('src/pages/HomePage.tsx');

  it('裝飾性星盤在手機隱藏', () => {
    // 實測在 390px 寬佔約 390px 高，純裝飾。手機第一屏要留給「今天」。
    expect(
      /className="hidden lg:block"><StarChartWheel/.test(source),
      'StarChartWheel 必須包在 hidden lg:block 裡，否則手機第一屏會被一張裝飾圖吃掉',
    ).toBe(true);
  });

  it('三張今日卡在手機是水平滑動，桌機才並排', () => {
    // 直向堆疊在手機上超過 1,600px，要滑兩個螢幕才知道下面還有「完整命盤」。
    ['snap-x', 'snap-mandatory', 'overflow-x-auto', 'lg:grid', 'lg:grid-cols-3']
      .forEach((cls) => {
        expect(source, `今日卡容器缺少 ${cls}，手機滑動版面會壞掉`).toContain(cls);
      });
    // 卡片等高，滑動時才不會忽高忽低。
    expect(source, '滑動卡片需要 [&>*]:h-full 讓高度一致').toContain('[&>*]:h-full');
    // 手機要有提示，否則使用者不知道可以滑。
    expect(source, '缺少滑動提示').toContain('左右滑動');
  });

  it('容器用負邊界貼齊頁面留白，捲動不外溢到整頁', () => {
    // -mx-4 px-4 讓卡片邊緣對齊留白；捲動發生在容器內，整頁不會橫向捲。
    expect(source).toContain('-mx-4');
    expect(source).toContain('lg:mx-0');
  });
});

describe('手機直式：報告', () => {
  const source = read('src/pages/ReportPage.tsx');

  it('首屏那兩句話前面沒有主視覺擋路', () => {
    // 主視覺約 180px，在 390px 寬剛好把 opener 推到螢幕外。
    expect(
      source,
      'SystemArtwork 必須是 hidden sm:block，否則手機首屏看不到結論',
    ).toContain('hidden print:hidden sm:block');
  });

  it('工具按鈕只有一份，不用「渲染兩次再各自隱藏」', () => {
    // 一度改成桌機／手機各渲染一份再用 hidden 藏掉，但那會讓同一組按鈕
    // 在 DOM 裡出現兩次——閱讀量量測（jsdom 沒有 CSS）會重複計算，
    // 螢幕閱讀器也會念到兩遍。改成單一實例、手機只縮成圖示。
    expect(
      (source.match(/<ReportActions/g) ?? []).length,
      'ReportActions 只該渲染一次；手機版請用縮成圖示解決，不要複製一份再隱藏',
    ).toBe(1);
  });
});

describe('手機直式：報告的工具按鈕縮成圖示', () => {
  const actions = read('src/components/report/ReportActions.tsx');
  const share = read('src/components/common/ShareLinkButton.tsx');

  it('文字在手機隱藏，但無障礙名稱要留著', () => {
    // 三顆帶文字的按鈕在 390px 會擠成兩排（約 110px），把首屏結論推出螢幕。
    [['ReportActions', actions], ['ShareLinkButton', share]].forEach(([name, code]) => {
      expect(code, `${name} 的按鈕文字要包在 hidden sm:inline 裡`).toContain('hidden sm:inline');
      expect(code, `${name} 圖示按鈕必須有 aria-label，否則手機上讀不出來是什麼`).toContain('aria-label');
    });
  });
});

describe('手機直式：今日回饋的邀請只佔一行', () => {
  afterEach(cleanup);

  it('還沒同意時是收起的 details，不是攤開的說明區塊', async () => {
    // 原本是四行說明加一顆按鈕，在手機上約 250px——而它講的是「要不要開啟功能」，
    // 不是今天的運勢，不該佔掉每日內容的位置。
    const { container } = render(<DailyFeedback />);
    // 元件要先讀完 storage 才會渲染內容。
    await screen.findByText('想知道這些描述對你到底準不準嗎？');

    const details = container.querySelector('details');
    expect(details, '未同意狀態應該用 <details> 收起來').not.toBeNull();
    expect(details!.hasAttribute('open'), '預設不能是展開的').toBe(false);

    // 細節與按鈕要還在 DOM 裡，只是收起來——不是被刪掉。
    expect(screen.getByText(/資料只存在這台裝置/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '好，開始記錄' })).toBeTruthy();
  });
});
