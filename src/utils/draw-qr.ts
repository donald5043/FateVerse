import { SHARE_QR_ROWS, SHARE_QR_SIZE } from '../data/share-qr';

/**
 * 把預先算好的 QR 矩陣畫到 canvas 上。
 *
 * 矩陣是固定的（網址是常數），所以這裡只負責畫，不負責編碼——
 * 編碼在 `npm run gen:qr` 做過一次了，使用者的 bundle 裡沒有 QR 產生器。
 *
 * 掃得到的關鍵有三個，都在這裡處理：
 * 1. **留白區**：QR 四周要留至少 4 個模組寬的淺色邊，否則辨識器找不到定位圖案。
 *    分享圖的底是深色的，所以要自己鋪一塊淺底，不能直接畫在背景上。
 * 2. **模組對齊整數像素**：模組寬度取整數，避免相鄰模組之間出現半透明的接縫。
 * 3. **定位圖案要保持實心**：三個角落的 7×7 是辨識器用來找方向的。
 *    如果跟其他模組一樣被拆成一顆顆圓點，辨識率會明顯下降，
 *    所以它們畫成完整的圓角方框，只有資料模組才是圓點。
 *
 * 造型上圓點＋圓角面板是為了配合站上的視覺——原本一塊死白配純黑方塊，
 * 貼在手繪深色底圖上像是後製硬蓋上去的。改造型之後仍以 jsqr 實測掃得到
 * （見 tests/share-qr.test.ts 與產圖後的解碼驗證）。
 */

/** 留白區寬度，以模組為單位。QR 規格建議 4。 */
const QUIET_ZONE_MODULES = 4;

/** 定位圖案的邊長（模組數）。三個角落各一個。 */
const FINDER_SIZE = 7;

export interface DrawQrOptions {
  /** QR 本體（不含留白）的目標邊長，實際會被調整成模組寬度的整數倍。 */
  size: number;
  /** 深色模組的顏色。 */
  foreground?: string;
  /** 留白區與淺色模組的顏色。 */
  background?: string;
  /** 面板外框顏色。給 undefined 就不畫外框。 */
  border?: string;
}

/** 圓角矩形路徑。roundRect 不是每個瀏覽器都有，自己畫比較穩。 */
function roundedPath(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + w, y, x + w, y + h, radius);
  context.arcTo(x + w, y + h, x, y + h, radius);
  context.arcTo(x, y + h, x, y, radius);
  context.arcTo(x, y, x + w, y, radius);
  context.closePath();
}

/** 這個模組是不是落在三個定位圖案之一裡面。 */
function isFinderModule(row: number, col: number): boolean {
  const inTopLeft = row < FINDER_SIZE && col < FINDER_SIZE;
  const inTopRight = row < FINDER_SIZE && col >= SHARE_QR_SIZE - FINDER_SIZE;
  const inBottomLeft = row >= SHARE_QR_SIZE - FINDER_SIZE && col < FINDER_SIZE;
  return inTopLeft || inTopRight || inBottomLeft;
}

/** 畫一個定位圖案：外框實心、中間留白、正中央再一塊實心。 */
function drawFinder(
  context: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  moduleSize: number,
  foreground: string,
  background: string,
) {
  const outer = moduleSize * FINDER_SIZE;
  context.fillStyle = foreground;
  roundedPath(context, originX, originY, outer, outer, moduleSize * 1.8);
  context.fill();

  context.fillStyle = background;
  roundedPath(context, originX + moduleSize, originY + moduleSize, moduleSize * 5, moduleSize * 5, moduleSize * 1.3);
  context.fill();

  context.fillStyle = foreground;
  roundedPath(context, originX + moduleSize * 2, originY + moduleSize * 2, moduleSize * 3, moduleSize * 3, moduleSize * 0.9);
  context.fill();
}

/**
 * 以 (x, y) 為左上角畫出 QR（含留白區）。
 * @returns 實際佔用的邊長，含留白區——呼叫端要靠它排版。
 */
export function drawQr(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  { size, foreground = '#101a33', background = '#f3ece0', border }: DrawQrOptions,
): number {
  // 模組寬度取整數，模組之間才不會出現反鋸齒造成的灰縫。
  const moduleSize = Math.max(1, Math.floor(size / SHARE_QR_SIZE));
  const quiet = moduleSize * QUIET_ZONE_MODULES;
  const total = moduleSize * SHARE_QR_SIZE + quiet * 2;

  context.save();

  // 面板：圓角 + 細外框，讓它看起來是版面的一部分，不是貼上去的貼紙。
  context.fillStyle = background;
  roundedPath(context, x, y, total, total, moduleSize * 3);
  context.fill();
  if (border) {
    context.strokeStyle = border;
    context.lineWidth = Math.max(1, moduleSize * 0.4);
    roundedPath(context, x, y, total, total, moduleSize * 3);
    context.stroke();
  }

  // 三個定位圖案畫成完整方框，辨識器才抓得到方向。
  const finderOrigins: [number, number][] = [
    [0, 0],
    [SHARE_QR_SIZE - FINDER_SIZE, 0],
    [0, SHARE_QR_SIZE - FINDER_SIZE],
  ];
  finderOrigins.forEach(([col, row]) => {
    drawFinder(context, x + quiet + col * moduleSize, y + quiet + row * moduleSize, moduleSize, foreground, background);
  });

  // 其餘資料模組畫成圓點。
  context.fillStyle = foreground;
  const dotRadius = moduleSize * 0.42;
  for (let row = 0; row < SHARE_QR_SIZE; row += 1) {
    const line = SHARE_QR_ROWS[row];
    for (let col = 0; col < SHARE_QR_SIZE; col += 1) {
      if (line[col] !== '1' || isFinderModule(row, col)) continue;
      const cx = x + quiet + col * moduleSize + moduleSize / 2;
      const cy = y + quiet + row * moduleSize + moduleSize / 2;
      context.beginPath();
      context.arc(cx, cy, dotRadius, 0, Math.PI * 2);
      context.fill();
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
