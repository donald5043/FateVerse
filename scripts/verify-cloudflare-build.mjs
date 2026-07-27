import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const indexPath = resolve(root, 'dist', 'index.html');

if (!existsSync(indexPath)) {
  throw new Error('Cloudflare build check failed: dist/index.html does not exist.');
}

const html = readFileSync(indexPath, 'utf8');

if (/\/FateVerse\/|github\.io/i.test(html)) {
  throw new Error('Cloudflare build check failed: dist/index.html still contains a GitHub Pages path.');
}

const moduleScripts = [...html.matchAll(/<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+)["']/gi)]
  .map((match) => match[1]);
const stylesheets = [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)]
  .map((match) => match[1])
  .filter((href) => href.startsWith('/assets/'));
const buildAssets = [...moduleScripts, ...stylesheets];

if (moduleScripts.length === 0) {
  throw new Error('Cloudflare build check failed: dist/index.html has no module script.');
}

for (const assetPath of buildAssets) {
  if (!assetPath.startsWith('/assets/')) {
    throw new Error(`Cloudflare build check failed: expected /assets/ path, received ${assetPath}.`);
  }

  const filePath = resolve(root, 'dist', assetPath.slice(1));
  if (!existsSync(filePath)) {
    throw new Error(`Cloudflare build check failed: referenced asset is missing: ${assetPath}.`);
  }
}

console.log(`Cloudflare build check passed: ${buildAssets.length} root-relative assets verified.`);
