import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 介面表面積預算。
 *
 * 為什麼要有這個檔案：這個站原本有三條量測軸（巴納姆句出現率、口語度、
 * 靜態文案違規），全部在管「有沒有說謊、有沒有說廢話」，**沒有一條在管
 * 「東西是不是太多、太長」**。有測試的軸會贏，所以每一輪迭代都往更嚴謹推，
 * 沒有任何力量往更短、更好懂推——導覽長到十四個連結，首頁有十三個入口。
 *
 * 這裡把「少」也變成可以測的東西。要加新入口不是不行，但要先改這個數字，
 * 也就是要先承認自己在增加使用者的選擇成本。
 */

const root = resolve(__dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

/** 主導覽的連結數。三件事 + 實驗室 + 關於。 */
const NAV_LINK_BUDGET = 5;

/**
 * 首頁可以連到幾個「不同的頁面」。
 *
 * 刻意數目的地而不是數 `<Link>` 標籤：標籤數會被 `.map()` 藏起來——
 * 前一版首頁只有十一個 `<Link>` 字樣，卻渲染出十三個入口。
 * 目的地是字串常數，躲不掉。
 *
 * 目前是 4 個（/report、/profile、/synastry、/lab），預算給 5 留一格。
 */
const HOME_DESTINATION_BUDGET = 5;

describe('介面表面積', () => {
  it('主導覽最多五個連結', () => {
    const source = read('src/layouts/AppLayout.tsx');
    const block = /const links = \[([\s\S]*?)\] as const;/.exec(source);
    expect(block, '找不到 links 陣列，AppLayout 結構變了').not.toBeNull();
    const count = (block![1].match(/\['\//g) ?? []).length;
    expect(
      count,
      `主導覽有 ${count} 個連結，超過預算 ${NAV_LINK_BUDGET}。`
      + '十四個連結等於沒有導覽——每一項都同等重要，就是沒有一項重要。'
      + '要加新項目請先改這個預算，並想清楚是不是該收進 /lab。',
    ).toBeLessThanOrEqual(NAV_LINK_BUDGET);
  });

  it('首頁連到的不同頁面不超過預算', () => {
    const source = read('src/pages/HomePage.tsx');
    // 同一頁的不同分頁（/report?tab=bazi）算同一個目的地——它們是同一件事的入口。
    const destinations = new Set(
      [...source.matchAll(/'(\/[a-z]*)(?:\?[^']*)?'/g)].map((match) => match[1]),
    );
    expect(
      destinations.size,
      `首頁連到 ${destinations.size} 個不同頁面（${[...destinations].sort().join('、')}），`
      + `超過預算 ${HOME_DESTINATION_BUDGET}。`
      + '首頁只該有三件事：今天、完整命盤、兩人合盤。其餘收進 /lab。',
    ).toBeLessThanOrEqual(HOME_DESTINATION_BUDGET);
  });

  it('首頁不再直接列出實驗性功能', () => {
    const source = read('src/pages/HomePage.tsx');
    // 這些頁面仍然存在、網址也沒動，只是不該從首頁直接曝光。
    ['/mirror', '/ritual', '/narrative', '/imprint', '/capsule', '/palm', '/fortune', '/tarot', '/daily']
      .forEach((route) => {
        expect(source, `首頁不該直接連到 ${route}，請放進 /lab`).not.toContain(`"${route}"`);
      });
    expect(source, '首頁要留一個通往實驗室的入口').toContain('/lab');
  });

  it('收進實驗室的功能，路由全部還活著', () => {
    // 「狠砍」是砍動線，不是砍網址。之前分享出去的連結不能變成死連結。
    const app = read('src/App.tsx');
    const lab = read('src/pages/LabPage.tsx');
    const routes = [...app.matchAll(/path="([a-z]+)"/g)].map((match) => match[1]);
    [...lab.matchAll(/to: '\/([a-z]+)'/g)].map((match) => match[1]).forEach((target) => {
      expect(routes, `實驗室連到 /${target}，但 App.tsx 沒有這個路由`).toContain(target);
    });
    expect(routes).toContain('lab');
  });
});
