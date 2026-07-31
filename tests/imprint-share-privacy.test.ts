import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderImprintShareImage } from '../src/utils/imprint-share-image';
import type { ChartFingerprint } from '../src/engines/chart-fingerprint-engine';
import type { SkyFact } from '../src/engines/birthday-sky-engine';

/**
 * 宇宙印記分享圖的個資防線。
 *
 * 這是實際產圖看出來的問題：圖上原本直接印著「1985 年 7 月 19 日」、農曆
 * 「一九八五年六月初二」與干支——而這張圖的用途就是貼到社群上。
 * 更麻煩的是「一年中的第 200 天」「距離今天 14,987 天」這種欄位，
 * 單獨一項就足以反推出確切生日。
 *
 * 命盤分享卡（share-card.ts）本來就守著「不含生日與出生時間」，
 * 這裡把同一條線也守住：預設不畫，要畫得由使用者明確勾選。
 */

function stubCanvas() {
  const drawn: string[] = [];
  const context = {
    fillStyle: '', strokeStyle: '', lineWidth: 0, font: '', globalAlpha: 1,
    textAlign: '' as CanvasTextAlign,
    createLinearGradient: () => ({ addColorStop: () => undefined }),
    createRadialGradient: () => ({ addColorStop: () => undefined }),
    fillRect: () => undefined,
    beginPath: () => undefined, closePath: () => undefined,
    moveTo: () => undefined, lineTo: () => undefined, arc: () => undefined,
    setLineDash: () => undefined,
    save: () => undefined, restore: () => undefined,
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
  vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => (
    tag === 'canvas' ? canvas : ({ style: {} } as unknown as HTMLElement)
  )) as typeof document.createElement);

  // 底圖載入在 jsdom 不會有結果，固定成立刻失敗，避免測試變成逾時。
  class FailingImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_value: string) { queueMicrotask(() => this.onerror?.()); }
  }
  vi.stubGlobal('Image', FailingImage);
  return drawn;
}

const fingerprint = {
  size: 320, theme: 'wood', coreColor: '#8fd6a0', binaryCode: '101000', hexagramIndex: 40,
  rings: [], spokes: [], nodes: [], corePolygon: [{ x: 10, y: 10 }, { x: 20, y: 20 }],
} as unknown as ChartFingerprint;

const facts: SkyFact[] = [
  { label: '那天是', value: '星期五' },
  { label: '農曆', value: '一九八五年六月初二' },
  { label: '干支・生肖', value: '乙丑年・屬牛' },
  { label: '一年中的第', value: '200 天' },
  { label: '距離今天', value: '14,987 天' },
];

const intro = '1985 年 7 月 19 日，你來到這個世界。那一刻，天空⋯';

describe('宇宙印記分享圖的個資', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('預設不畫出生那天的快照', async () => {
    const drawn = stubCanvas();
    await renderImprintShareImage({ name: '示範', fingerprint, intro, facts });
    const all = drawn.join('');

    expect(all, '圖上出現了出生日期').not.toMatch(/\d{4}\s*年/);
    ['農曆', '一九八五', '乙丑年', '一年中的第', '距離今天', '星期五']
      .forEach((banned) => expect(all, `圖上不該出現「${banned}」`).not.toContain(banned));
  });

  it('預設仍然畫得出圖騰與卦碼，不是整張空的', async () => {
    const drawn = stubCanvas();
    await renderImprintShareImage({ name: '示範', fingerprint, intro, facts });
    const all = drawn.join('');
    expect(all).toContain('宇 宙 印 記');
    expect(all).toContain('萬象命書');
    expect(all, '卦碼是從五行推的，粒度粗，不足以反推生日').toContain('101000');
  });

  it('使用者明確勾選時才畫上去', async () => {
    const drawn = stubCanvas();
    await renderImprintShareImage({ name: '示範', fingerprint, intro, facts, includeBirthday: true });
    const all = drawn.join('');
    expect(all).toContain('農曆');
    expect(all).toContain('一九八五年六月初二');
  });

  it('沒有名字時圖上不出現任何稱謂', async () => {
    const drawn = stubCanvas();
    await renderImprintShareImage({ fingerprint, intro, facts });
    expect(drawn.join('')).not.toContain('的命之圖騰');
  });
});
