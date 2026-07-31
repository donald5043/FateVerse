import { SHARE_QR_ROWS, SHARE_QR_SIZE } from '../data/share-qr';

/**
 * 把預先算好的 QR 矩陣畫到 canvas 上。
 *
 * 矩陣是固定的（網址是常數），所以這裡只負責畫，不負責編碼——
 * 編碼在 `npm run gen:qr` 做過一次了，使用者的 bundle 裡沒有 QR 產生器。
 *
 * 掃得到的關鍵有兩個，都在這裡處理：
 * 1. **留白區**：QR 四周要留至少 4 個模組寬的淺色邊，否則辨識器找不到定位圖案。
 *    分享圖的底是深色的，所以要自己鋪一塊白底，不能直接畫在背景上。
 * 2. **模組對齊整數像素**：模組寬度取整數，避免相鄰模組之間出現半透明的接縫。
 */

/** 留白區寬度，以模組為單位。QR 規格建議 4。 */
const QUIET_ZONE_MODULES = 4;

export interface DrawQrOptions {
  /** QR 本體（不含留白）的目標邊長，實際會被調整成模組寬度的整數倍。 */
  size: number;
  /** 深色模組的顏色。 */
  foreground?: string;
  /** 留白區與淺色模組的顏色。 */
  background?: string;
}

/**
 * 以 (x, y) 為左上角畫出 QR（含留白區）。
 * @returns 實際佔用的邊長，含留白區——呼叫端要靠它排版。
 */
export function drawQr(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  { size, foreground = '#0a0f20', background = '#f5f0e6' }: DrawQrOptions,
): number {
  // 模組寬度取整數，模組之間才不會出現反鋸齒造成的灰縫。
  const moduleSize = Math.max(1, Math.floor(size / SHARE_QR_SIZE));
  const quiet = moduleSize * QUIET_ZONE_MODULES;
  const total = moduleSize * SHARE_QR_SIZE + quiet * 2;

  context.save();
  context.fillStyle = background;
  context.fillRect(x, y, total, total);

  context.fillStyle = foreground;
  for (let row = 0; row < SHARE_QR_SIZE; row += 1) {
    const line = SHARE_QR_ROWS[row];
    for (let col = 0; col < SHARE_QR_SIZE; col += 1) {
      if (line[col] !== '1') continue;
      context.fillRect(x + quiet + col * moduleSize, y + quiet + row * moduleSize, moduleSize, moduleSize);
    }
  }
  context.restore();
  return total;
}

/** QR 含留白區的實際邊長。排版時要先知道它多大。 */
export function qrTotalSize(size: number): number {
  const moduleSize = Math.max(1, Math.floor(size / SHARE_QR_SIZE));
  return moduleSize * SHARE_QR_SIZE + moduleSize * QUIET_ZONE_MODULES * 2;
}
