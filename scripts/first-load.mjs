import { gzipSync } from 'node:zlib';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';

/**
 * 算出「打開網頁時，在畫面出現之前一定要下載完的東西有多大」。
 *
 * 為什麼要分靜態與動態 import：Vite 會把每個 lazy 路由切成獨立 chunk，
 * 那些是使用者走到那一頁才下載的，不算在首屏成本裡。但被入口**靜態**
 * import 的東西不一樣——瀏覽器要先把它們全部抓下來、剖析完、執行完，
 * 才輪得到第一個像素。這兩者混在一起看，總量會嚇死人卻找不到重點。
 *
 * 在壓縮過的 chunk 裡分辨兩者：
 * - 靜態：`import{a}from"./x.js"` 或 `import"./x.js"`
 * - 動態：`import("./x.js")`，以及 Vite 預載表裡的 `"assets/x.js"` 字串
 *
 * 只認前者。後者交給瀏覽器量測（scripts/measure-load.mjs）。
 *
 * 用 gzip 而不是原始大小：使用者付的是傳輸量，而所有正經的靜態主機
 * 都會壓縮。原始大小只在「剖析與執行要多久」上有意義，所以兩個都回報。
 */

/** 只抓靜態 import 的目標。 */
const STATIC_IMPORT = /(?:^|[;}\s])import\s*(?:[\w*{}\s,$]+from\s*)?["'](\.\/[^"']+\.js)["']/g;

function sizesOf(filePath) {
  const bytes = readFileSync(filePath);
  return { raw: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length };
}

/**
 * @param {string} distDir dist 目錄
 * @param {string} base 這次建置的 base（`/` 或 `/FateVerse/`）
 */
export function analyzeFirstLoad(distDir, base = '/') {
  const indexPath = resolve(distDir, 'index.html');
  if (!existsSync(indexPath)) return undefined;

  const html = readFileSync(indexPath, 'utf8');
  const assetPrefix = `${base.replace(/\/$/, '')}/assets/`;
  const toDistPath = (href) => resolve(distDir, `assets/${href.slice(assetPrefix.length)}`);

  const entries = [...html.matchAll(/<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+)["']/gi)]
    .map((match) => match[1])
    .filter((href) => href.startsWith(assetPrefix));
  const styles = [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)]
    .map((match) => match[1])
    .filter((href) => href.startsWith(assetPrefix));

  // 從入口出發，沿著靜態 import 一路走完。
  const scripts = [];
  const seen = new Set();
  const queue = entries.map(toDistPath);
  while (queue.length) {
    const filePath = queue.shift();
    if (seen.has(filePath) || !existsSync(filePath)) continue;
    seen.add(filePath);
    const source = readFileSync(filePath, 'utf8');
    scripts.push({ file: basename(filePath), ...sizesOf(filePath) });
    for (const match of source.matchAll(STATIC_IMPORT)) {
      queue.push(resolve(dirname(filePath), match[1]));
    }
  }

  const css = styles.map((href) => {
    const filePath = toDistPath(href);
    return { file: basename(filePath), ...sizesOf(filePath) };
  });

  const sum = (list, key) => list.reduce((total, item) => total + item[key], 0);
  return {
    scripts,
    css,
    /* 阻擋第一個像素的總量：入口腳本的靜態相依 + 樣式表。 */
    blockingGzip: sum(scripts, 'gzip') + sum(css, 'gzip'),
    blockingRaw: sum(scripts, 'raw') + sum(css, 'raw'),
  };
}

/**
 * 首屏預算：gzip 後的位元組。
 *
 * 這個數字不是憑感覺挑的，是從 scripts/measure-load.mjs 在慢速 4G
 * （下行 1.6 Mbps）加 CPU 4 倍節流下量到的結果回推——那條線路上，
 * 每 100KB 大約要多花 0.5 秒才輪得到瀏覽器開始剖析。
 *
 * 現值約 100KB（React + Router + Zustand + 版面外殼）。留到 130KB 是
 * 給正常成長的空間；再往上就代表有東西不該進入口，例如某個共用模組
 * 順手 import 了命理引擎。那種事一次就會多出好幾十 KB，這條線攔得住。
 */
export const BLOCKING_GZIP_BUDGET = 130 * 1024;

export function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`;
}
