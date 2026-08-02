import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 載入成本的預算軸。
 *
 * 這個站已經有四條軸在把關——版面複雜度（surface-budget）、字數
 * （reading-budget）、手機版面（mobile-layout）、動畫成本（motion-budget）——
 * 但沒有任何一條在管「打開網頁到看到東西要多久」。而使用者不用一個網站，
 * 最常見的原因不是看不懂，是第一眼還沒出現就走了。
 *
 * 真正的位元組數要拿建置產物才算得準，那條檢查在 scripts/verify-build.mjs，
 * 每次 npm run build 都會跑。這裡守的是**原始碼層級的結構**——因為首屏
 * 變胖幾乎永遠是同一種原因：某個一開始就會載入的模組，靜態 import 了
 * 只有某一頁才需要的重東西。
 *
 * 這種退步在功能上完全正常，所有測試都會是綠的，只有慢速網路上的使用者
 * 感覺得到。所以要在結構上擋，不能等到有人想起來去量。
 */

const SRC = resolve(__dirname, '../src');

/**
 * 這些套件很大，而且只有特定頁面需要。
 * 一旦它們變成「打開網站就要載」，首屏會多好幾十 KB。
 */
const HEAVY_PACKAGES = [
  'iztro',            // 紫微斗數，未壓縮數百 KB，只有報告頁要
  'lunar-javascript', // 農曆與八字，gzip 後約 98KB
  'astronomy-engine', // 星曆計算
  'tesseract.js',     // 手相 OCR，最大的一個
  'fuse.js',          // 模糊搜尋，只有查詢介面要
  'qrcode',           // 只有產生分享圖時要
];

/** 把 import 路徑解析成真正的檔案。 */
function resolveModule(fromFile: string, specifier: string): string | undefined {
  const base = resolve(dirname(fromFile), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    resolve(base, 'index.ts'),
    resolve(base, 'index.tsx'),
  ];
  return candidates.find((path) => existsSync(path) && !path.endsWith('/'));
}

interface Edge { from: string; specifier: string }

/**
 * 從進入點沿著**靜態** import 走完整張圖。
 *
 * 動態 import（`import('./x')`）不算：那正是我們希望重東西待的地方。
 * 型別 import 也不算：`import type` 在編譯後會整個消失。
 */
function staticGraph(entry: string) {
  const visited = new Set<string>();
  const externals: Edge[] = [];
  const queue = [entry];

  while (queue.length) {
    const file = queue.shift()!;
    if (visited.has(file)) continue;
    visited.add(file);
    const source = readFileSync(file, 'utf8');

    // 先把動態 import 的內容挖掉，免得誤判成靜態。
    const staticOnly = source.replace(/\bimport\s*\([^)]*\)/g, '');
    const pattern = /^\s*import\s+(?!type\b)(?:[\w*{}\s,$]+from\s*)?['"]([^'"]+)['"]/gm;

    for (const match of staticOnly.matchAll(pattern)) {
      const specifier = match[1];
      if (specifier.startsWith('.')) {
        const resolved = resolveModule(file, specifier);
        if (resolved) queue.push(resolved);
      } else {
        externals.push({ from: file.slice(SRC.length + 1), specifier });
      }
    }
  }

  return { files: visited, externals };
}

const entryGraph = staticGraph(resolve(SRC, 'main.tsx'));

describe('載入成本', () => {
  it('打開網站就會載入的模組，不會靜態 import 那些很重的套件', () => {
    const offenders = entryGraph.externals
      .filter((edge) => HEAVY_PACKAGES.some(
        (pkg) => edge.specifier === pkg || edge.specifier.startsWith(`${pkg}/`),
      ))
      .map((edge) => `${edge.from} → ${edge.specifier}`);

    expect(
      offenders,
      '這些重套件被靜態 import 進了首屏會載入的模組，等於每個打開網站的人'
      + '都要先下載它們才看得到第一個像素。改成在需要的頁面裡用動態 import。',
    ).toEqual([]);
  });

  it('每一個路由都是 lazy 載入的', () => {
    /*
     * 只要有一頁忘了 lazy，它整個相依樹都會被拉進入口——包含它用到的
     * 命理引擎。這是首屏變胖最常見的單一原因。
     */
    const app = readFileSync(resolve(SRC, 'App.tsx'), 'utf8');
    const lazyNames = new Set(
      [...app.matchAll(/const\s+(\w+)\s*=\s*lazy\(/g)].map((match) => match[1]),
    );
    const routed = [...app.matchAll(/<Route[^>]*element=\{<(\w+)\s*\/>\}/g)].map((match) => match[1]);
    expect(routed.length, '解析不到任何路由，大概是寫法變了').toBeGreaterThan(10);

    // AppLayout 是外殼，本來就要立刻載；Navigate 是 react-router 的元件。
    const shell = new Set(['AppLayout', 'Navigate']);
    const eager = routed.filter((name) => !lazyNames.has(name) && !shell.has(name));
    expect(eager, '這些頁面沒有用 lazy()，會被打包進首屏').toEqual([]);
  });

  it('外部字型不擋住第一個像素', () => {
    /*
     * 這是這條軸抓到的第一個問題，而且是站上最大的一個。
     *
     * 字型的 <link rel="stylesheet"> 原本是會擋畫面的：瀏覽器要先跟
     * fonts.googleapis.com 完成 DNS、TLS 與下載，才會畫出任何東西。
     * 在慢速 4G 的量測裡，擋掉外部字型後第一個像素從十幾秒變成 0.54 秒。
     *
     * 這種問題不會出現在任何功能測試裡——畫面最後長得一模一樣，
     * 只是使用者要對著白畫面等，而大部分人不會等。
     */
    const html = readFileSync(resolve(SRC, '../index.html'), 'utf8');
    const links = [...html.matchAll(/<link\b[^>]*>/gis)]
      .map((match) => match[0])
      .filter((tag) => /fonts\.googleapis\.com/.test(tag) && /rel=["']stylesheet["']/.test(tag));
    expect(links.length, '找不到字型的 stylesheet，寫法大概變了').toBeGreaterThan(0);

    // noscript 裡的那份是刻意保留的退路，不算在內。
    const blocking = links.filter((tag) => {
      const index = html.indexOf(tag);
      const before = html.slice(0, index);
      const inNoscript = before.lastIndexOf('<noscript') > before.lastIndexOf('</noscript>');
      return !inNoscript && !/media=["']print["']/.test(tag);
    });
    expect(
      blocking,
      '字型的 stylesheet 會擋住第一個像素。用 media="print" onload="this.media=\'all\'"：'
      + '照樣下載，但不擋畫面。',
    ).toEqual([]);
  });

  it('入口那張圖沒有大到失控', () => {
    /*
     * 這條是粗略的護欄，不是精確的位元組數（那個在 verify-build.mjs）。
     * 它擋的是「外殼慢慢長胖」——每次多塞一個元件進 AppLayout 都很合理，
     * 但累積起來就是每個人都要等的東西。
     *
     * 現值 20 個檔案（App、AppLayout、幾個外殼元件與 store）。留到 28 是
     * 給正常成長的空間，不是給「反正還沒到上限」用的。
     */
    expect(
      entryGraph.files.size,
      '首屏靜態相依的檔案數量成長了。確認新加的東西是不是真的每一頁都要用，'
      + '不是的話應該待在它自己的頁面裡。',
    ).toBeLessThanOrEqual(28);
  });
});
