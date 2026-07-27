import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

console.log(`Build check passed (base ${base}): ${buildAssets.length} assets verified.`);
