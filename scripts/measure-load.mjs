import { analyzeFirstLoad, BLOCKING_GZIP_BUDGET, formatKb } from './first-load.mjs';

/**
 * 量載入的成本：打開網頁到看見東西、到能按下去，各要多久。
 *
 * 為什麼要有這支腳本：這個站已經有四條預算軸在把關——版面複雜度、字數、
 * 手機版面、動畫成本——但沒有任何一條在管「打開到看到要多久」。
 * 而使用者不用一個網站，最常見的原因不是看不懂，是第一眼還沒出現就走了。
 *
 * 量的條件刻意做得比真實情境更差一點，這樣問題才會提前浮出來：
 *   - 慢速 4G（下行 1.6 Mbps、上行 750 Kbps、延遲 150ms）
 *   - CPU 4 倍節流（中階手機大約就是這個量級）
 *   - 390×844 手機直式
 *   - 每次都清快取，量的是「第一次來的人」
 *
 * 回報三個數字：
 *   - FCP：第一個像素出現。在這之前使用者面對的是白畫面。
 *   - LCP：最大的那塊內容出現。使用者主觀認定的「載好了」。
 *   - 可互動：主要按鈕出現在畫面上，真的能按。
 *
 * **要量建置後的產物，不能量 dev server。** dev server 不打包、不壓縮，
 * 每個模組各發一個請求，量到的數字跟使用者看到的完全是兩回事。
 *
 * 用法：
 *   npm run build
 *   npx vite preview --port 4173
 *   （另開一個帶 --remote-debugging-port=9222 的 Chrome）
 *   node scripts/measure-load.mjs [路徑...]
 */

const HOST = process.env.CDP_HOST ?? 'http://127.0.0.1:9222';
const ORIGIN = process.env.APP_ORIGIN ?? 'http://localhost:4173';
const ROUTES = process.argv.slice(2);
const PATHS = ROUTES.length ? ROUTES : ['#/', '#/tarot', '#/daily'];

/** 慢速 4G。數字取自 Chrome DevTools 的 "Slow 4G" 預設。 */
const SLOW_4G = {
  offline: false,
  latency: 150,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
};

const targets = await (await fetch(`${HOST}/json/list`)).json();
const page = targets.find((item) => item.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let messageId = 0;
const pending = new Map();
const transferred = new Map();
await new Promise((resolve) => { ws.onopen = resolve; });
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
    return;
  }
  // 累計這次導覽真的抓了多少位元組，依資源類型分開記。
  if (message.method === 'Network.loadingFinished') {
    const entry = transferred.get(message.params.requestId);
    if (entry) entry.bytes = message.params.encodedDataLength;
  }
  if (message.method === 'Network.responseReceived') {
    transferred.set(message.params.requestId, { type: message.params.type, bytes: 0 });
  }
};
const send = (method, params = {}) => new Promise((resolve) => {
  const id = ++messageId;
  pending.set(id, resolve);
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => (
  await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
).result?.result?.value;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await send('Runtime.enable');
await send('Page.enable');
await send('Network.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setCPUThrottlingRate', { rate: 4 });
await send('Network.emulateNetworkConditions', SLOW_4G);

/** 外部字型的來源。量測時要能單獨擋掉，才知道它值多少時間。 */
const FONT_HOSTS = ['*fonts.googleapis.com*', '*fonts.gstatic.com*'];

async function measure(path, { blockFonts }) {
  /*
   * 量的是第一次來的人。清快取不夠——這是 PWA，Service Worker 在第一次
   * 造訪就會把所有東西預快取起來，第二條路徑量到的其實是回訪。
   * clearDataForOrigin 才會連 Service Worker 與 Cache Storage 一起清掉。
   *
   * 這個 bug 一開始沒發現，量出來的結果是「後面兩條路徑下載了 0KB 的 JS」——
   * 數字漂亮得不合理，那通常就是量錯了東西的徵兆。
   */
  await send('Network.clearBrowserCache');
  await send('Storage.clearDataForOrigin', {
    origin: ORIGIN,
    storageTypes: 'service_workers,cache_storage,local_storage,indexeddb',
  });
  await send('Network.setBlockedURLs', { urls: blockFonts ? FONT_HOSTS : [] });
  transferred.clear();
  await send('Page.navigate', { url: 'about:blank' });
  await sleep(400);

  await send('Page.navigate', { url: `${ORIGIN}/${path}` });

  const report = await evaluate(`(async () => {
    const deadline = performance.now() + 30000;
    const paint = () => performance.getEntriesByType('paint')
      .find((e) => e.name === 'first-contentful-paint')?.startTime;
    let lcp = 0;
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) lcp = entry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch { /* 不支援就回報 0，不要讓量測整個失敗 */ }

    // 可互動＝畫面上出現了真的能按的東西，不是 DOM 裡有節點就算。
    const interactive = () => [...document.querySelectorAll('a[href], button')]
      .some((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 40 && rect.height > 20 && rect.top < innerHeight && rect.bottom > 0;
      });

    let ready = 0;
    while (performance.now() < deadline) {
      if (interactive()) { ready = performance.now(); break; }
      await new Promise((r) => setTimeout(r, 50));
    }
    // 讓 LCP 有機會落在最終那塊內容上。
    await new Promise((r) => setTimeout(r, 1200));

    return { fcp: paint() ?? 0, lcp, ready, text: document.body.innerText.length };
  })()`);

  const byType = {};
  transferred.forEach(({ type, bytes }) => { byType[type] = (byType[type] ?? 0) + bytes; });
  return { path, ...report, byType };
}

const results = [];
for (const path of PATHS) {
  // 兩次量測：正常一次，擋掉外部字型一次。差額就是字型的代價。
  // 分開量而不是只看總數，是因為「慢」要能歸因才修得動。
  results.push({ ...await measure(path, { blockFonts: false }), label: path });
  results.push({ ...await measure(path, { blockFonts: true }), label: `  ↳ 無外部字型` });
}

const blocking = analyzeFirstLoad(new URL('../dist', import.meta.url).pathname);

console.log('\n─── 載入成本量測（390×844，慢速 4G，CPU ×4，清空快取）───────');
console.log('  路徑            FCP     LCP     可互動   下載的 JS   總下載');
results.forEach((r) => {
  const js = r.byType.Script ?? 0;
  const total = Object.values(r.byType).reduce((sum, n) => sum + n, 0);
  console.log(
    `  ${r.label.padEnd(14)} ${`${(r.fcp / 1000).toFixed(2)}s`.padStart(6)}  `
    + `${`${(r.lcp / 1000).toFixed(2)}s`.padStart(6)}  `
    + `${`${(r.ready / 1000).toFixed(2)}s`.padStart(6)}   `
    + `${formatKb(js).padStart(8)}   ${formatKb(total).padStart(8)}`,
  );
});

if (blocking) {
  console.log('\n  阻擋第一個像素的靜態資源（與路徑無關，每次都要載）：');
  blocking.scripts.concat(blocking.css).forEach((item) => {
    console.log(`    ${item.file.padEnd(28)} gzip ${formatKb(item.gzip).padStart(8)}  原始 ${formatKb(item.raw).padStart(8)}`);
  });
  const over = blocking.blockingGzip > BLOCKING_GZIP_BUDGET;
  console.log(
    `    ${'合計'.padEnd(27)} gzip ${formatKb(blocking.blockingGzip).padStart(8)}`
    + `  預算 ${formatKb(BLOCKING_GZIP_BUDGET)} ${over ? '← 超標' : '✓'}`,
  );
} else {
  console.log('\n  （沒有 dist/，跳過靜態資源分析。先跑 npm run build）');
}
console.log('────────────────────────────────────────────────────────\n');

ws.close();
process.exit(0);
