import { describe, expect, it } from 'vitest';
import { drawHexagramSeal } from '../src/utils/draw-imprint-totem';

describe('命之圖騰六爻', () => {
  it('把 0 畫成斷爻、1 畫成完整陽爻，並由下往上排列六層', () => {
    const ys: number[] = [];
    let strokes = 0;
    const context = {
      strokeStyle: '',
      lineCap: 'butt' as CanvasLineCap,
      globalAlpha: 1,
      lineWidth: 1,
      save: () => undefined,
      restore: () => undefined,
      beginPath: () => undefined,
      moveTo: (_x: number, y: number) => { ys.push(y); },
      lineTo: () => undefined,
      stroke: () => { strokes += 1; },
    } as unknown as CanvasRenderingContext2D;

    drawHexagramSeal(context, '101000', 100, 200, 80);

    expect(strokes, '卦象必須有六層').toBe(6);
    expect(ys, '四個陰爻各有兩段、兩個陽爻各有一段').toHaveLength(10);
    expect(new Set(ys).size, '六爻的高度不可重疊').toBe(6);
    expect(Math.max(...ys), '第一個位元應從最下方開始').toBe(200);
  });
});
