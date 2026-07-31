import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import QRCode from 'qrcode';

/**
 * 把分享圖上的 QR code 預先算好，寫成 src/data/share-qr.ts。
 *
 * 為什麼是「事先算好」而不是執行期產生：網址是固定的常數，每個使用者掃到的
 * 都是同一個 QR。既然結果永遠一樣，就沒有理由為它多背一個執行期相依套件——
 * qrcode 只留在 devDependencies，不會進到使用者下載的 bundle。
 *
 * 產出的是一個布林矩陣（true＝深色模組），畫圖時直接照著填方塊即可。
 *
 * 用法：npm run gen:qr
 */

/** 分享圖上要導向的網址。改網址請改這裡並重跑一次。 */
const TARGET_URL = 'https://fateverse.donald5043.workers.dev';

/*
 * 容錯等級選 M（約可修復 15%）。
 * 分享圖會被社群平台重新壓縮、也可能被截圖，L 太脆弱；
 * H 會讓模組數變多、每個模組更小，印在 1080px 寬的圖上反而更難掃。
 */
const qr = QRCode.create(TARGET_URL, { errorCorrectionLevel: 'M' });
const size = qr.modules.size;
const data = qr.modules.data;

const rows: string[] = [];
for (let y = 0; y < size; y += 1) {
  const row: string[] = [];
  for (let x = 0; x < size; x += 1) row.push(data[y * size + x] ? '1' : '0');
  rows.push(`  '${row.join('')}',`);
}

const file = `/**
 * 分享圖用的 QR code 矩陣（'1'＝深色模組）。
 *
 * 由 \`npm run gen:qr\` 產生，請勿手改。
 * 內容：${TARGET_URL}
 * 版本 ${qr.version}、容錯等級 M、${size}×${size} 模組。
 *
 * 事先算好是因為網址是固定的：每個人掃到的都是同一個 QR，
 * 沒必要為它在使用者的 bundle 裡多放一個產生器。
 */
export const SHARE_QR_URL = '${TARGET_URL}';

export const SHARE_QR_SIZE = ${size};

export const SHARE_QR_ROWS: readonly string[] = [
${rows.join('\n')}
];
`;

const target = resolve(__dirname, '../src/data/share-qr.ts');
writeFileSync(target, file, 'utf8');
console.log(`QR 版本 ${qr.version}、${size}×${size} 模組，已寫入 ${target}`);
