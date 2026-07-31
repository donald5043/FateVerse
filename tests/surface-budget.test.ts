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
    /*
     * 這條守的是「首頁不要變回一份目錄」，不是「站上任何地方都不准連過去」。
     *
     * 情境入口是另一回事：使用者在首頁翻開今日一張牌之後，卡片裡出現
     * 「抽三張牌」——那是他剛做完的事的下一步，不是目錄的第 14 項。
     * 那個連結寫在 DailyTarotCard 裡，本來就不在這個檔案的檢查範圍，
     * 這是刻意的區分，不是繞過檢查。同理，報告讀完之後連到宇宙印記。
     */
    const source = read('src/pages/HomePage.tsx');
    ['/mirror', '/ritual', '/narrative', '/imprint', '/capsule', '/palm', '/fortune', '/tarot', '/daily']
      .forEach((route) => {
        expect(source, `首頁本體不該直接連到 ${route}；要曝光請放在情境入口或 /lab`).not.toContain(`"${route}"`);
      });
    expect(source, '首頁要留一個通往實驗室的入口').toContain('/lab');
  });

  it('會產出分享圖的功能，都有情境入口不是只躺在實驗室裡', () => {
    // 塔羅三張牌與宇宙印記是這個站唯一「拿得走、貼得出去」的產出。
    // 只放在 /lab 目錄第 N 項等於沒有人會看到。
    expect(
      read('src/components/common/DailyTarotCard.tsx'),
      '翻開今日一張牌之後，要有連到三張牌的下一步',
    ).toContain('to="/tarot"');
    expect(
      read('src/pages/ReportPage.tsx'),
      '報告讀完結論之後，要有連到宇宙印記的入口',
    ).toContain('to="/imprint"');
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
