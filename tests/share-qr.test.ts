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

  it('畫出來時模組對齊整數像素，而且留了白邊', () => {
    // 模組寬度若不是整數，相鄰模組之間會出現反鋸齒灰縫，掃描率會掉。
    const rects: { x: number; y: number; w: number; h: number }[] = [];
    let filled = '';
    const context = {
      save: () => undefined,
      restore: () => undefined,
      set fillStyle(value: string) { filled = value; },
      get fillStyle() { return filled; },
      fillRect: (x: number, y: number, w: number, h: number) => { rects.push({ x, y, w, h }); },
    } as unknown as CanvasRenderingContext2D;

    const total = drawQr(context, 0, 0, { size: 132 });
    expect(total).toBe(qrTotalSize(132));

    // 第一個是留白底，其餘是模組。
    const [backdrop, ...modules] = rects;
    expect(backdrop.w, '底色要蓋滿含留白的整塊').toBe(total);
    modules.forEach((rect) => {
      expect(Number.isInteger(rect.x), '模組 x 不是整數像素').toBe(true);
      expect(Number.isInteger(rect.w), '模組寬不是整數像素').toBe(true);
    });
    // 深色模組數要和矩陣裡的 '1' 一樣多。
    const expected = SHARE_QR_ROWS.join('').split('').filter((bit) => bit === '1').length;
    expect(modules).toHaveLength(expected);
  });
});
