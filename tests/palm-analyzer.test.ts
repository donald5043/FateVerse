import { describe, expect, it } from 'vitest';
import { analyzePalmPixels, type PixelImage } from '../src/engines/palm-analyzer';

const SKIN = [205, 150, 128] as const;
const LINE = [110, 60, 55] as const;

function blankImage(width: number, height: number, fill: readonly [number, number, number] = [20, 20, 30]): PixelImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    data[index * 4] = fill[0];
    data[index * 4 + 1] = fill[1];
    data[index * 4 + 2] = fill[2];
    data[index * 4 + 3] = 255;
  }
  return { data, width, height };
}

function paint(image: PixelImage, x0: number, x1: number, y0: number, y1: number, color: readonly [number, number, number]) {
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const offset = (y * image.width + x) * 4;
      image.data[offset] = color[0];
      image.data[offset + 1] = color[1];
      image.data[offset + 2] = color[2];
    }
  }
}

function syntheticHand(): PixelImage {
  const image = blankImage(100, 130);
  paint(image, 30, 69, 10, 49, SKIN); // 手指區：較窄
  paint(image, 10, 89, 50, 119, SKIN); // 掌心區：較寬
  paint(image, 15, 85, 56, 58, LINE); // 感情線：上緣橫線
  paint(image, 20, 80, 70, 72, LINE); // 智慧線：中段橫線
  paint(image, 16, 20, 60, 112, LINE); // 生命線：拇指側縱向
  paint(image, 48, 52, 55, 115, LINE); // 事業線：中央縱線
  return image;
}

describe('手相影像分析', () => {
  it('沒有手掌的照片回報失敗並給出指引', () => {
    const result = analyzePalmPixels(blankImage(80, 80));
    expect(result.ok).toBe(false);
    expect(result.message).toContain('手掌');
    expect(result.selections).toEqual({});
  });

  it('合成手掌影像可自動判讀五項特徵', () => {
    const result = analyzePalmPixels(syntheticHand());
    expect(result.ok).toBe(true);
    expect(result.metrics.skinCoverage).toBeGreaterThan(0.3);
    expect(result.selections.handShape).toBe('earth');
    expect(['long', 'chained', 'upward']).toContain(result.selections.heartLine);
    expect(['long', 'short', 'curved']).toContain(result.selections.headLine);
    expect(['deep', 'faint', 'wide', 'close']).toContain(result.selections.lifeLine);
    expect(['clear', 'broken', 'none']).toContain(result.selections.fateLine);
    expect(Object.keys(result.confidence)).toHaveLength(5);
  });

  it('相同影像產生相同判讀', () => {
    expect(analyzePalmPixels(syntheticHand())).toEqual(analyzePalmPixels(syntheticHand()));
  });

  it('長掌長指的輪廓判為水型手', () => {
    const image = blankImage(100, 160);
    paint(image, 35, 64, 5, 74, SKIN); // 修長手指
    paint(image, 25, 74, 75, 155, SKIN); // 窄長掌心
    paint(image, 30, 70, 82, 84, LINE);
    paint(image, 32, 68, 100, 102, LINE);
    paint(image, 28, 31, 90, 145, LINE);
    const result = analyzePalmPixels(image);
    expect(result.ok).toBe(true);
    expect(result.selections.handShape).toBe('water');
  });
});
