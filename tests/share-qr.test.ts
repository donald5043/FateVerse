import { describe, expect, it } from 'vitest';
import jsQR from 'jsqr';
import { SHARE_QR_ROWS, SHARE_QR_SIZE, SHARE_QR_URL } from '../src/data/share-qr';
import { drawQr, qrTotalSize } from '../src/utils/draw-qr';

/**
 * 分享圖上的 QR 必須真的掃得到，而且要導到正確的網址。
 *
 * 這件事不能只用眼睛看——QR 壞掉的樣子和好的長得一模一樣。所以這裡直接把
 * committed 的矩陣還原成像素，餵給獨立的解碼器（jsqr）解回文字。
 * 產生用的是 qrcode、驗證用的是 jsqr，兩個不同的實作，不會一起錯。
 *
 * 如果有人改了網址卻忘了跑 `npm run gen:qr`，這裡會抓到——
 * 矩陣還是舊網址，測試就會失敗。
 */

/** 把 '1'/'0' 的矩陣放大成 RGBA 像素，四周補上留白區。 */
function toPixels(scale: number, quietModules: number) {
  const side = (SHARE_QR_SIZE + quietModules * 2) * scale;
  const data = new Uint8ClampedArray(side * side * 4);
  // 先整片填白。
  data.fill(255);

  for (let row = 0; row < SHARE_QR_SIZE; row += 1) {
    for (let col = 0; col < SHARE_QR_SIZE; col += 1) {
      if (SHARE_QR_ROWS[row][col] !== '1') continue;
      for (let dy = 0; dy < scale; dy += 1) {
        for (let dx = 0; dx < scale; dx += 1) {
          const x = (col + quietModules) * scale + dx;
          const y = (row + quietModules) * scale + dy;
          const offset = (y * side + x) * 4;
          data[offset] = 0;
          data[offset + 1] = 0;
          data[offset + 2] = 0;
          data[offset + 3] = 255;
        }
      }
    }
  }
  return { data, side };
}

describe('分享圖的 QR code', () => {
  it('解回來就是設定的網址', () => {
    const { data, side } = toPixels(6, 4);
    const decoded = jsQR(data, side, side);
    expect(decoded, 'QR 矩陣解不開').not.toBeNull();
    expect(decoded!.data).toBe(SHARE_QR_URL);
  });

  it('網址是正式站台，不是 localhost 或預留位置', () => {
    expect(SHARE_QR_URL).toBe('https://fateverse.donald5043.workers.dev');
    expect(SHARE_QR_URL.startsWith('https://'), 'QR 一定要用 https').toBe(true);
  });

  it('矩陣本身是完整的正方形', () => {
    expect(SHARE_QR_ROWS).toHaveLength(SHARE_QR_SIZE);
    SHARE_QR_ROWS.forEach((row, index) => {
      expect(row, `第 ${index} 列長度不對`).toHaveLength(SHARE_QR_SIZE);
      expect(/^[01]+$/.test(row), `第 ${index} 列有非 0/1 的字元`).toBe(true);
    });
  });

  it('畫出來時：定位圖案保持實心、資料模組是圓點、格線對齊整數像素', () => {
    /*
     * 造型化之後不能只數方塊了。這裡驗三件事：
     * 1. 三個定位圖案畫成完整方框（辨識器靠它們找方向），不是拆成圓點
     * 2. 其餘資料模組畫成圓點，數量要和矩陣裡扣掉定位區的 '1' 一樣多
     * 3. 圓點中心落在整數像素上，避免反鋸齒把模組糊掉
     */
    const dots: { x: number; y: number; r: number }[] = [];
    let fills = 0;
    const context = {
      save: () => undefined,
      restore: () => undefined,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      beginPath: () => undefined,
      closePath: () => undefined,
      moveTo: () => undefined,
      lineTo: () => undefined,
      arcTo: () => undefined,
      arc: (x: number, y: number, r: number) => { dots.push({ x, y, r }); },
      fill: () => { fills += 1; },
      stroke: () => undefined,
    } as unknown as CanvasRenderingContext2D;

    const total = drawQr(context, 0, 0, { size: 174, border: 'gold' });
    expect(total).toBe(qrTotalSize(174));

    const moduleSize = 6;
    const finderSize = 7;
    const isFinder = (row: number, col: number) => (
      (row < finderSize && col < finderSize)
      || (row < finderSize && col >= SHARE_QR_SIZE - finderSize)
      || (row >= SHARE_QR_SIZE - finderSize && col < finderSize)
    );

    let expectedDots = 0;
    SHARE_QR_ROWS.forEach((line, row) => {
      [...line].forEach((bit, col) => {
        if (bit === '1' && !isFinder(row, col)) expectedDots += 1;
      });
    });
    expect(dots, '圓點數量要等於定位區以外的深色模組數').toHaveLength(expectedDots);

    // fill() 的來源：面板 1 次 + 三個定位圖案各 3 層 + 每顆圓點 1 次。
    // 扣掉圓點之後剩下的必須正好是 1 + 9，代表定位圖案是實心方框而不是圓點。
    expect(fills - dots.length, '定位圖案要畫成實心方框，不是拆成圓點').toBe(1 + 3 * 3);

    dots.forEach((dot) => {
      expect(Number.isInteger(dot.x), `圓點 x=${dot.x} 沒對齊整數像素`).toBe(true);
      expect(Number.isInteger(dot.y), `圓點 y=${dot.y} 沒對齊整數像素`).toBe(true);
      expect(dot.r).toBeGreaterThan(moduleSize * 0.3);
    });
  });
});
