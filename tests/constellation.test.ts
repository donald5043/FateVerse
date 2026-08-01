import { describe, expect, it } from 'vitest';
import { CONSTELLATION_LINES, STARS } from '../src/components/common/Starfield';

/**
 * 星座連線的長度預算。
 *
 * 為什麼需要這一條軸：連線的座標是百分比，但畫出來的長度不是。
 * `preserveAspectRatio="none"` 把 0–100 的方形 viewBox 拉成螢幕的形狀，
 * 手機直式（390×844）縱向會被拉長 2.16 倍。於是在程式碼裡看起來
 * 「差 25% 而已」的一段垂直位移，畫到手機上是兩百多像素——
 * 從標題頂端一路劃到副標下方。
 *
 * 第一版就踩到了：挑星星的時候用百分比距離判斷「距離適中」，
 * 截圖出來像是有人在畫面上刮了幾刀，橫穿主標與卡片內文。
 *
 * 這條測試把判斷搬到使用者真正看到的座標系裡。手機直式是這個站的
 * 主要瀏覽情境，所以就用它當基準。
 */

/** 主要瀏覽情境：手機直式。 */
const VIEWPORT_WIDTH = 390;
const VIEWPORT_HEIGHT = 844;

/** 再長就會橫跨內容區、變成劃過文字的一刀。 */
const MAX_LINE_PX = 180;
/** 再短就看不出是線，只是兩顆星黏在一起。 */
const MIN_LINE_PX = 40;

function projectedLength([from, to]: readonly [number, number]): number {
  const dx = (STARS[from].left - STARS[to].left) / 100 * VIEWPORT_WIDTH;
  const dy = (STARS[from].top - STARS[to].top) / 100 * VIEWPORT_HEIGHT;
  return Math.hypot(dx, dy);
}

describe('星座連線', () => {
  it('每一條線在手機直式都在可視長度範圍內', () => {
    const tooLong = CONSTELLATION_LINES
      .filter((pair) => projectedLength(pair) > MAX_LINE_PX)
      .map((pair) => `${pair[0]}-${pair[1]}（${Math.round(projectedLength(pair))}px）`);
    expect(
      tooLong,
      `這些線在 ${VIEWPORT_WIDTH}×${VIEWPORT_HEIGHT} 上會橫跨內容區，看起來像刮痕而不是星座。`
      + '注意縱向會被拉長 2.16 倍，光看百分比會低估。',
    ).toEqual([]);

    const tooShort = CONSTELLATION_LINES
      .filter((pair) => projectedLength(pair) < MIN_LINE_PX)
      .map((pair) => `${pair[0]}-${pair[1]}`);
    expect(tooShort, '這些線短到看不出是線').toEqual([]);
  });

  it('連線指向真的存在的星，而且不會自己連自己', () => {
    CONSTELLATION_LINES.forEach(([from, to]) => {
      expect(STARS[from], `第 ${from} 顆星不存在`).toBeDefined();
      expect(STARS[to], `第 ${to} 顆星不存在`).toBeDefined();
      expect(from).not.toBe(to);
    });
  });

  it('沒有重複的線：同一條畫兩次會比別條亮一倍', () => {
    const seen = CONSTELLATION_LINES.map(([a, b]) => [a, b].sort((x, y) => x - y).join('-'));
    expect(new Set(seen).size).toBe(seen.length);
  });
});
