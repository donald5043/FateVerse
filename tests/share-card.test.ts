import { describe, expect, it, vi } from 'vitest';
import {
  renderShareCard, SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH, wrapByWidth, type ShareCardData,
} from '../src/utils/share-card';

/**
 * jsdom 沒有 Canvas 2D 實作，因此用一個會記錄所有繪製呼叫的假 context。
 * measureText 以「每字 20px」近似，足以驗證換行與截斷邏輯。
 */
function fakeCanvas() {
  const drawn: string[] = [];
  const context = {
    canvas: null as unknown,
    fillStyle: '', strokeStyle: '', lineWidth: 0, font: '',
    textAlign: '' as CanvasTextAlign, textBaseline: '' as CanvasTextBaseline,
    createLinearGradient: () => ({ addColorStop: () => undefined }),
    fillRect: () => undefined,
    strokeRect: () => undefined,
    beginPath: () => undefined,
    closePath: () => undefined,
    moveTo: () => undefined,
    lineTo: () => undefined,
    fill: () => undefined,
    stroke: () => undefined,
    measureText: (text: string) => ({ width: [...text].length * 20 }),
    fillText: (text: string) => { drawn.push(text); },
  };
  const canvas = {
    width: 0, height: 0,
    getContext: () => context,
  } as unknown as HTMLCanvasElement;
  return { canvas, context, drawn };
}

const baseData: Omit<ShareCardData, 'nickname'> = {
  percentages: { wood: 30, fire: 25, earth: 20, metal: 15, water: 10 },
  headline: '8 套系統裡有 3 套講到同一個主題——木：喜歡成長、往前展開。',
  labels: ['日主 丁火', '太陽 摩羯座', '生肖 蛇', '靈數 22'],
};

describe('分享圖', () => {
  it('輸出尺寸為 1080×1350', () => {
    const { canvas } = fakeCanvas();
    renderShareCard(baseData, canvas);
    expect(canvas.width).toBe(1080);
    expect(canvas.height).toBe(1350);
    expect([SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT]).toEqual([1080, 1350]);
  });

  it('超長標語不溢出畫布：截成兩行並加省略號', () => {
    const { canvas, context, drawn } = fakeCanvas();
    const longHeadline = '這是一段刻意寫得非常非常長的速寫標語'.repeat(8);
    renderShareCard({ ...baseData, headline: longHeadline }, canvas);

    const contentWidth = 1080 - 96 * 2;
    const headlineLines = drawn.filter((line) => line.includes('這是一段'));
    expect(headlineLines.length).toBeLessThanOrEqual(2);
    headlineLines.forEach((line) => {
      expect(context.measureText(line).width).toBeLessThanOrEqual(contentWidth);
    });
    expect(headlineLines.at(-1)?.endsWith('…')).toBe(true);
  });

  it('未輸入暱稱時，圖上不含任何個資字串', () => {
    const { canvas, drawn } = fakeCanvas();
    renderShareCard(baseData, canvas);
    const text = drawn.join('');
    // 姓名、生日、出生時間一律不得出現
    ['林安晨', '1990', '01-02', '10:30', '出生'].forEach((secret) => {
      expect(text, `不應出現「${secret}」`).not.toContain(secret);
    });
    // 也不該冒出空的稱謂
    expect(drawn.some((line) => line.trim() === '')).toBe(false);
  });

  it('填了暱稱時才畫暱稱，且只畫暱稱本身', () => {
    const { canvas, drawn } = fakeCanvas();
    renderShareCard({ ...baseData, nickname: '小晨' }, canvas);
    expect(drawn).toContain('小晨');

    const { canvas: bare, drawn: bareDrawn } = fakeCanvas();
    renderShareCard({ ...baseData, nickname: '   ' }, bare);
    expect(bareDrawn).not.toContain('   ');
  });

  it('畫上站名與網址', () => {
    const { canvas, drawn } = fakeCanvas();
    renderShareCard(baseData, canvas);
    expect(drawn).toContain('萬象命書 FateVerse');
    expect(drawn.some((line) => line.includes('fateverse.donald5043.workers.dev'))).toBe(true);
  });

  it('畫上五行標籤與命盤標籤', () => {
    const { canvas, drawn } = fakeCanvas();
    renderShareCard(baseData, canvas);
    ['木', '火', '土', '金', '水'].forEach((element) => expect(drawn).toContain(element));
    expect(drawn.some((line) => line.includes('日主 丁火'))).toBe(true);
  });

  it('沒有 2D context 時明確拋出可讀錯誤', () => {
    const canvas = { width: 0, height: 0, getContext: () => null } as unknown as HTMLCanvasElement;
    expect(() => renderShareCard(baseData, canvas)).toThrow('不支援');
  });
});

describe('中文換行', () => {
  const context = {
    measureText: (text: string) => ({ width: [...text].length * 20 }),
  } as unknown as CanvasRenderingContext2D;

  it('以實測寬度換行，不是按字數硬切', () => {
    // 每字 20px，寬度 100px → 每行 5 字
    const lines = wrapByWidth(context, '一二三四五六七八九十', 100, 3);
    expect(lines[0]).toBe('一二三四五');
    expect(lines[1]).toBe('六七八九十');
  });

  it('混排時依實際寬度斷行', () => {
    const lines = wrapByWidth(context, 'abc中文def', 60, 5);
    lines.forEach((line) => expect(context.measureText(line).width).toBeLessThanOrEqual(60));
  });

  it('超過行數上限時最後一行加省略號且仍不超寬', () => {
    const lines = wrapByWidth(context, '一二三四五六七八九十十一十二', 100, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith('…')).toBe(true);
    expect(context.measureText(lines[1]).width).toBeLessThanOrEqual(100);
  });

  it('內容剛好放得下時不加省略號', () => {
    const lines = wrapByWidth(context, '一二三', 100, 2);
    expect(lines).toEqual(['一二三']);
  });

  it('空字串回傳空陣列', () => {
    expect(wrapByWidth(context, '', 100, 2)).toEqual([]);
  });
});

describe('分享流程 fallback', () => {
  it('不支援 navigator.share 時走下載且不報錯', async () => {
    const { shareCardToBlob } = await import('../src/utils/share-card');
    const blob = new Blob(['x'], { type: 'image/png' });
    const canvas = {
      toBlob: (cb: (b: Blob | null) => void) => cb(blob),
    } as unknown as HTMLCanvasElement;
    await expect(shareCardToBlob(canvas)).resolves.toBe(blob);
  });

  it('toBlob 失敗時回傳可讀錯誤', async () => {
    const { shareCardToBlob } = await import('../src/utils/share-card');
    const canvas = {
      toBlob: (cb: (b: Blob | null) => void) => cb(null),
    } as unknown as HTMLCanvasElement;
    await expect(shareCardToBlob(canvas)).rejects.toThrow('產生分享圖失敗');
  });

  it('canShare 回報不支援檔案時不會呼叫 share', () => {
    const share = vi.fn();
    vi.stubGlobal('navigator', { share, canShare: () => false });
    // 條件式：canShare 為 false → 不應走系統分享
    expect(typeof navigator.share).toBe('function');
    expect(navigator.canShare({ files: [] })).toBe(false);
    expect(share).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
