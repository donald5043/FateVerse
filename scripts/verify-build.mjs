import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { analyzeFirstLoad, BLOCKING_GZIP_BUDGET, formatKb } from './first-load.mjs';

/**
 * 驗證建置產物的資源路徑對得上這次建置的 base。
 *
 * 這個站要出兩種產物：Cloudflare Workers 掛在網域根目錄（base `/`），
 * GitHub Pages 掛在子路徑（base `/FateVerse/`）。base 設錯不會讓建置失敗，
 * 只會在瀏覽器上 404 成一片白畫面——所以在 CI 就擋下來。
 *
 * 用法：node scripts/verify-build.mjs [base]，預設 `/`。
 */
const base = process.argv[2] || '/';
const assetPrefix = `${base.replace(/\/$/, '')}/assets/`;

const root = process.cwd();
const indexPath = resolve(root, 'dist', 'index.html');

if (!existsSync(indexPath)) {
  throw new Error('Build check failed: dist/index.html does not exist.');
}

const html = readFileSync(indexPath, 'utf8');

if (/github\.io/i.test(html)) {
  throw new Error('Build check failed: dist/index.html contains a hard-coded github.io URL.');
}
// 根目錄產物裡出現子路徑，代表 base 沒吃到設定。
if (base === '/' && /\/FateVerse\//.test(html)) {
  throw new Error('Build check failed: root build still contains a /FateVerse/ path.');
}

const moduleScripts = [...html.matchAll(/<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+)["']/gi)]
  .map((match) => match[1]);
const stylesheets = [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)]
  .map((match) => match[1])
  .filter((href) => href.startsWith(assetPrefix));
const buildAssets = [...moduleScripts, ...stylesheets];

if (moduleScripts.length === 0) {
  throw new Error('Build check failed: dist/index.html has no module script.');
}

for (const assetPath of buildAssets) {
  if (!assetPath.startsWith(assetPrefix)) {
    throw new Error(`Build check failed: expected ${assetPrefix} path, received ${assetPath}.`);
  }

  // dist 裡的檔案佈局不含 base 前綴，比對前先剝掉。
  const filePath = resolve(root, 'dist', `assets/${assetPath.slice(assetPrefix.length)}`);
  if (!existsSync(filePath)) {
    throw new Error(`Build check failed: referenced asset is missing: ${assetPath}.`);
  }
}

/*
 * 首屏預算。放在這裡而不是單元測試裡，是因為它只有拿到真正的建置產物
 * 才算得出來——而每一次建置都會經過這支腳本。
 *
 * 擋的是這種事：某個共用模組順手 import 了命理引擎，於是原本走到那一頁
 * 才下載的幾十 KB 變成每個人打開首頁就要等。這種退步在功能上完全正常，
 * 測試全綠，只有使用者在慢速網路上感覺得到。
 */
const firstLoad = analyzeFirstLoad(resolve(root, 'dist'), base);
if (firstLoad && firstLoad.blockingGzip > BLOCKING_GZIP_BUDGET) {
  const breakdown = firstLoad.scripts.concat(firstLoad.css)
    .sort((a, b) => b.gzip - a.gzip)
    .map((item) => `  ${item.file} ${formatKb(item.gzip)}`)
    .join('\n');
  throw new Error(
    `Build check failed: 首屏阻擋資源 ${formatKb(firstLoad.blockingGzip)} 超過預算 `
    + `${formatKb(BLOCKING_GZIP_BUDGET)}。\n`
    + '這些是使用者在看到任何東西之前都要下載完的：\n'
    + `${breakdown}\n`
    + '通常是有東西被靜態 import 進了入口。改成 lazy import，或確認它真的每一頁都要用。',
  );
}

console.log(
  `Build check passed (base ${base}): ${buildAssets.length} assets verified`
  + `${firstLoad ? `, 首屏 ${formatKb(firstLoad.blockingGzip)} / ${formatKb(BLOCKING_GZIP_BUDGET)}` : ''}.`,
);
