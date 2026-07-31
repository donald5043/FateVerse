import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderTarotShareImage } from '../src/utils/tarot-share-image';
import { buildSpread } from '../src/engines/tarot-engine';

/**
 * jsdom 沒有 Canvas 2D，也沒有真的圖片載入，所以這裡用假的 context 記錄
 * 所有畫上去的文字，驗證「畫了什麼」與「沒畫什麼」——後者才是重點：
 * 這張圖會被貼到社群上，上面不能有任何從生日推出來的東西。
 */
/**
 * 讓圖片載入立刻失敗。
 *
 * jsdom 不會真的載入圖片，onload／onerror 都不會觸發，Promise 會一直 pending，
 * 測試就變成逾時而不是失敗——那正是這次寫測試時發現的產品 bug（見 load-image.ts）。
 * 這裡把它固定成「立刻 onerror」，測的才是「載不到時仍要產得出圖」這件事。
 */
function stubFailingImages() {
  class FailingImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_value: string) {
      queueMicrotask(() => this.onerror?.());
    }
  }
  vi.stubGlobal('Image', FailingImage);
}

function stubCanvas() {
  const drawn: string[] = [];
  const context = {
    fillStyle: '', strokeStyle: '', lineWidth: 0, font: '',
    textAlign: '' as CanvasTextAlign,
    createLinearGradient: () => ({ addColorStop: () => undefined }),
    fillRect: () => undefined,
    beginPath: () => undefined, closePath: () => undefined,
    moveTo: () => undefined, lineTo: () => undefined, arcTo: () => undefined,
    arc: () => undefined, clip: () => undefined,
    save: () => undefined, restore: () => undefined,
    translate: () => undefined, rotate: () => undefined,
    fill: () => undefined, stroke: () => undefined,
    drawImage: () => undefined,
    measureText: (text: string) => ({ width: [...text].length * 20 }),
    fillText: (text: string) => { drawn.push(text); },
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => context,
    toBlob: (cb: (blob: Blob | null) => void) => cb(new Blob(['x'], { type: 'image/png' })),
  } as unknown as HTMLCanvasElement;
  vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
    if (tag === 'canvas') return canvas;
    return { style: {}, setAttribute: () => undefined } as unknown as HTMLElement;
  }) as typeof document.createElement);
  return { canvas, drawn };
}

/** 固定一組牌，結果才可重現。魔術師（1）、戀人（6）逆位、星星（17）。 */
const spread = buildSpread([1, 6, 17], [false, true, false]);

describe('塔羅三張牌分享圖', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('三張牌的位置與牌名都畫上去了', async () => {
    stubFailingImages();
    const { drawn } = stubCanvas();
    await renderTarotShareImage(spread);
    ['過去', '現在', '未來'].forEach((position) => {
      expect(drawn, `${position} 沒畫上去`).toContain(position);
    });
    spread.forEach(({ card }) => {
      expect(drawn, `${card.name} 沒畫上去`).toContain(card.name);
    });
  });

  it('逆位有標示出來', async () => {
    stubFailingImages();
    const { drawn } = stubCanvas();
    await renderTarotShareImage(spread);
    // 第二張是逆位，圖上要看得出來，否則讀圖的人會解錯。
    expect(drawn.filter((text) => text === '逆位')).toHaveLength(1);
  });

  it('圖上不含任何生日推出來的資料', async () => {
    stubFailingImages();
    const { drawn } = stubCanvas();
    await renderTarotShareImage(spread);
    const all = drawn.join('');
    // 生日塔羅（人格牌／靈魂牌）是從生日算出來的，等於把生日的一部分公開。
    ['人格牌', '靈魂牌', '生日', '日主', '出生'].forEach((banned) => {
      expect(all, `分享圖不該出現「${banned}」`).not.toContain(banned);
    });
    // 也不該出現任何看起來像日期的數字。
    expect(all).not.toMatch(/\d{4}[-/]\d{1,2}/);
  });

  it('牌面圖載不到時仍然產得出圖，不整張失敗', async () => {
    stubFailingImages();
    const { drawn } = stubCanvas();
    await expect(renderTarotShareImage(spread)).resolves.toBeInstanceOf(Blob);
    expect(drawn, '牌名等文字資訊仍要完整').toContain('魔術師');
  });

  it('牌數不是三張就直接拒絕，不畫出半張圖', async () => {
    stubFailingImages();
    stubCanvas();
    await expect(renderTarotShareImage(spread.slice(0, 2))).rejects.toThrow('三張');
  });
});
