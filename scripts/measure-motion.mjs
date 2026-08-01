/**
 * 量動畫的成本：捲動時掉不掉幀、有多少東西在動。
 *
 * 為什麼要有這支腳本：這個站的視覺一直往「更多動畫」加，但沒有任何一條軸
 * 在管動畫的代價。有測試的軸會贏——先前的教訓已經證明過一次（見
 * tests/reading-budget.test.tsx 的開頭）。所以在加特效之前先把成本變成數字。
 *
 * 量的是使用者真的會感覺到的東西：
 *   - 捲動過程中的幀間隔（掉幀＝卡頓）
 *   - 同時在跑的 CSS 動畫數量
 *   - 會觸發重繪的動畫屬性（box-shadow／background-position 這類每幀重畫）
 *
 * 用法：先跑 npm run dev 與一個開了 --remote-debugging-port=9222 的 Chrome，
 *      再 node scripts/measure-motion.mjs [路徑...]
 */

const HOST = process.env.CDP_HOST ?? 'http://127.0.0.1:9222';
const ORIGIN = process.env.APP_ORIGIN ?? 'http://localhost:5173';
const ROUTES = process.argv.slice(2);
const PATHS = ROUTES.length ? ROUTES : ['#/', '#/tarot', '#/lab'];

/** 超過這個毫秒數就算掉了一幀（60fps 的一幀是 16.7ms）。 */
const JANK_FRAME_MS = 24;

const targets = await (await fetch(`${HOST}/json/list`)).json();
const page = targets.find((item) => item.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let messageId = 0;
const pending = new Map();
await new Promise((resolve) => { ws.onopen = resolve; });
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
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
// 手機直式是主要瀏覽情境，而且是效能最吃緊的地方。
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
// 中階手機大約是桌機的 4 倍慢；不節流的話什麼問題都量不出來。
await send('Emulation.setCPUThrottlingRate', { rate: 4 });

const results = [];
for (const path of PATHS) {
  await send('Page.navigate', { url: `${ORIGIN}/${path}` });
  for (let i = 0; i < 30; i += 1) {
    await sleep(500);
    if (await evaluate('document.body.innerText.length > 200')) break;
  }
  await sleep(1500);

  const report = await evaluate(`(async () => {
    const frames = [];
    let last = performance.now();
    let running = true;
    const tick = (now) => {
      frames.push(now - last);
      last = now;
      if (running) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // 一邊捲動一邊量：靜止不動的頁面量不到真正的成本。
    const total = document.body.scrollHeight - window.innerHeight;
    const steps = 24;
    for (let i = 0; i <= steps; i += 1) {
      window.scrollTo(0, (total * i) / steps);
      await new Promise((r) => setTimeout(r, 120));
    }
    running = false;
    await new Promise((r) => setTimeout(r, 50));

    const animations = document.getAnimations().filter((a) => a.playState === 'running');
    const repaintProps = new Set();
    animations.forEach((animation) => {
      const frames = typeof animation.effect?.getKeyframes === 'function' ? animation.effect.getKeyframes() : [];
      frames.forEach((frame) => Object.keys(frame).forEach((key) => {
        if (['boxShadow', 'backgroundPosition', 'filter', 'width', 'height', 'top', 'left'].includes(key)) {
          repaintProps.add(key);
        }
      }));
    });

    // 前幾幀含捲動啟動成本，丟掉避免失真。
    const sample = frames.slice(3);
    sample.sort((a, b) => a - b);
    return {
      frames: sample.length,
      median: sample[Math.floor(sample.length / 2)] ?? 0,
      p95: sample[Math.floor(sample.length * 0.95)] ?? 0,
      worst: sample[sample.length - 1] ?? 0,
      janky: sample.filter((d) => d > ${JANK_FRAME_MS}).length,
      running: animations.length,
      repaintProps: [...repaintProps],
      height: document.body.scrollHeight,
    };
  })()`);

  results.push({ path, ...report });
}

console.log('\n─── 動態成本量測（390×844，CPU ×4 節流）───────────────');
console.log('  路徑        幀數  中位數  p95   最差   掉幀   同時動畫  會重繪的屬性');
results.forEach((r) => {
  const jankRate = r.frames ? ((r.janky / r.frames) * 100).toFixed(1) : '0.0';
  console.log(
    `  ${r.path.padEnd(10)} ${String(r.frames).padStart(4)}  `
    + `${r.median.toFixed(1).padStart(5)}  ${r.p95.toFixed(1).padStart(5)}  ${r.worst.toFixed(0).padStart(5)}  `
    + `${String(r.janky).padStart(3)}(${jankRate}%)  ${String(r.running).padStart(6)}    `
    + `${r.repaintProps.join('、') || '無'}`,
  );
});
console.log('────────────────────────────────────────────────────\n');

ws.close();
process.exit(0);
