import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderTarotShareImage } from '../src/utils/tarot-share-image';
import { buildSpread } from '../src/engines/tarot-engine';
import { shareFooterTop } from '../src/utils/share-footer';

/*
 * 攔一下 drawShareFooter，記住它是在第幾個繪製動作時被呼叫的。
 *
 * 需要這個是因為「頁腳自己畫在線以下」是正常的，要檢查的是頁腳**之前**的內容。
 * 用文字當分界不準：drawShareFooter 會先畫 QR 面板、最後才畫品牌字，
 * 中間那些面板路徑會被誤判成內容越界。
 */
const hooks = vi.hoisted(() => ({
  footerAt: -1 as number,
  opCount: (() => 0) as () => number,
}));

vi.mock('../src/utils/share-footer', async () => {
  const actual = await vi.importActual<typeof import('../src/utils/share-footer')>('../src/utils/share-footer');
  return {
    ...actual,
    drawShareFooter: (context: CanvasRenderingContext2D, options: Parameters<typeof actual.drawShareFooter>[1]) => {
      hooks.footerAt = hooks.opCount();
      return actual.drawShareFooter(context, options);
    },
  };
});

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
  const placed: { text: string; y: number }[] = [];
  /*
   * 依序記下每一次繪製的最大 y。
   *
   * 只記文字是不夠的：把建議框壓進 QR 的其實是那個圓角方框本身，
   * 而框是用路徑畫的，不是 fillText。第一版測試就因此漏抓了這個 bug。
   */
  const ops: { kind: 'text' | 'shape'; y: number; label: string }[] = [];
  const shape = (label: string, ...ys: number[]) => {
    ops.push({ kind: 'shape', y: Math.max(...ys), label });
  };
  const context = {
    fillStyle: '', strokeStyle: '', lineWidth: 0, font: '',
    textAlign: '' as CanvasTextAlign,
    createLinearGradient: () => ({ addColorStop: () => undefined }),
    fillRect: (_x: number, y: number, _w: number, h: number) => shape('fillRect', y + h),
    beginPath: () => undefined, closePath: () => undefined,
    moveTo: (_x: number, y: number) => shape('moveTo', y),
    lineTo: (_x: number, y: number) => shape('lineTo', y),
    arcTo: (_x1: number, y1: number, _x2: number, y2: number) => shape('arcTo', y1, y2),
    arc: (_x: number, y: number, r: number) => shape('arc', y + r),
    clip: () => undefined,
    save: () => undefined, restore: () => undefined,
    translate: () => undefined, rotate: () => undefined,
    fill: () => undefined, stroke: () => undefined,
    drawImage: () => undefined,
    /*
     * 中文字在 32px 字級下大約就是 32px 寬。
     * 一開始這裡用固定的 20px／字，結果建議文字在測試裡只佔一行、
     * 實際畫面卻是兩行——版面越界的測試就永遠測不到真正的高度。
     */
    measureText: (text: string) => ({ width: [...text].length * 32 }),
    fillText: (text: string, _x: number, y: number) => { drawn.push(text); placed.push({ text, y }); ops.push({ kind: 'text', y, label: text }); },
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
  return { canvas, drawn, placed, ops };
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

  it('內容不會壓到頁腳的 QR', async () => {
    /*
     * 頁腳為了讓 QR 掃得到，從 148px 長到 222px。當時只改了宇宙印記的版面，
     * 塔羅這邊座標還是寫死的，建議框就伸進 QR 的留白區——
     * 畫面上只是靠得近，實際上解碼器已經掃不到了（用 jsqr 實測到的）。
     */
    stubFailingImages();
    const { ops } = stubCanvas();
    hooks.footerAt = -1;
    hooks.opCount = () => ops.length;
    await renderTarotShareImage(spread);

    const footerTop = shareFooterTop(1350);
    expect(hooks.footerAt, '沒有呼叫 drawShareFooter，測試前提壞了').toBeGreaterThan(-1);

    const spill = ops.slice(0, hooks.footerAt)
      // 整面背景本來就鋪滿畫布，不算越界。
      .filter((op) => !(op.label === 'fillRect' && op.y >= 1350))
      .filter((op) => op.y > footerTop);
    expect(
      spill.map((op) => `${op.label}@${Math.round(op.y)}`),
      `有內容畫到頁腳範圍（y > ${footerTop}）裡`,
    ).toEqual([]);
  });

  it('牌數不是三張就直接拒絕，不畫出半張圖', async () => {
    stubFailingImages();
    stubCanvas();
    await expect(renderTarotShareImage(spread.slice(0, 2))).rejects.toThrow('三張');
  });
});
