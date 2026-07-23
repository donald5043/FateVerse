import type { PalmSelections } from './palm-engine';

export interface PixelImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export type PalmConfidence = 'high' | 'medium' | 'low';

export interface PalmAutoAnalysis {
  ok: boolean;
  message: string;
  selections: PalmSelections;
  confidence: Partial<Record<keyof PalmSelections, PalmConfidence>>;
  metrics: {
    skinCoverage: number;
    palmAspect: number;
    fingerRatio: number;
    edgeDensity: number;
  };
}

const MAX_ANALYSIS_SIZE = 320;

// 膚色偵測採 YCbCr 色彩空間的常見範圍；對深淺膚色都放寬一些。
function isSkin(r: number, g: number, b: number): boolean {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.169 * r - 0.331 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.419 * g - 0.081 * b;
  return y > 40 && cb >= 75 && cb <= 130 && cr >= 130 && cr <= 178;
}

interface Region { left: number; right: number; top: number; bottom: number; }

function analyzeInternal(image: PixelImage): PalmAutoAnalysis {
  const { data, width, height } = image;
  const skin = new Uint8Array(width * height);
  let skinCount = 0;
  let left = width, right = -1, top = height, bottom = -1;
  for (let yIndex = 0; yIndex < height; yIndex += 1) {
    for (let xIndex = 0; xIndex < width; xIndex += 1) {
      const offset = (yIndex * width + xIndex) * 4;
      if (isSkin(data[offset], data[offset + 1], data[offset + 2])) {
        skin[yIndex * width + xIndex] = 1;
        skinCount += 1;
        if (xIndex < left) left = xIndex;
        if (xIndex > right) right = xIndex;
        if (yIndex < top) top = yIndex;
        if (yIndex > bottom) bottom = yIndex;
      }
    }
  }
  const skinCoverage = skinCount / (width * height);
  const fail = (message: string): PalmAutoAnalysis => ({
    ok: false, message, selections: {}, confidence: {}, metrics: { skinCoverage, palmAspect: 0, fingerRatio: 0, edgeDensity: 0 },
  });
  if (skinCoverage < 0.12 || right - left < width * 0.2 || bottom - top < height * 0.2) {
    return fail('照片中找不到明顯的手掌。請在光線充足處，讓手掌撐滿畫面再拍一次；也可以直接用下方選項手動指認。');
  }

  // 逐列統計膚色寬度，找出最寬處視為掌心；上方寬度明顯變窄的區段視為手指。
  const boxHeight = bottom - top + 1;
  const rowWidths = new Array<number>(boxHeight).fill(0);
  for (let yIndex = top; yIndex <= bottom; yIndex += 1) {
    let count = 0;
    for (let xIndex = left; xIndex <= right; xIndex += 1) count += skin[yIndex * width + xIndex];
    rowWidths[yIndex - top] = count;
  }
  const maxRowWidth = Math.max(...rowWidths);
  const widestRow = rowWidths.indexOf(maxRowWidth);
  let fingerEnd = 0;
  for (let index = 0; index < widestRow; index += 1) {
    if (rowWidths[index] < maxRowWidth * 0.62) fingerEnd = index;
  }
  const palmRegion: Region = { left, right, top: top + fingerEnd, bottom };
  const palmHeight = palmRegion.bottom - palmRegion.top + 1;
  const palmWidth = maxRowWidth;
  const fingerRatio = palmHeight > 0 ? fingerEnd / palmHeight : 0;
  const palmAspect = palmWidth > 0 ? palmHeight / palmWidth : 0;
  if (palmHeight < height * 0.15) {
    return fail('偵測到的手掌範圍太小，無法分析掌紋。請讓手掌佔滿畫面大部分區域再試一次。');
  }

  const longPalm = palmAspect > 1.18;
  const longFingers = fingerRatio > 0.55;
  const handShape = longPalm ? (longFingers ? 'water' : 'fire') : (longFingers ? 'air' : 'earth');

  // 掌心內做灰階 Sobel 邊緣偵測；門檻取平均值加一個標準差，適應不同亮度。
  const gray = new Float32Array(width * height);
  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 4;
    gray[index] = 0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
  }
  const magnitudes: number[] = [];
  const edgeAt = new Float32Array(width * height);
  for (let yIndex = palmRegion.top + 1; yIndex < palmRegion.bottom; yIndex += 1) {
    for (let xIndex = palmRegion.left + 1; xIndex < palmRegion.right; xIndex += 1) {
      if (!skin[yIndex * width + xIndex]) continue;
      const at = (dx: number, dy: number) => gray[(yIndex + dy) * width + (xIndex + dx)];
      const gx = at(1, -1) + 2 * at(1, 0) + at(1, 1) - at(-1, -1) - 2 * at(-1, 0) - at(-1, 1);
      const gy = at(-1, 1) + 2 * at(0, 1) + at(1, 1) - at(-1, -1) - 2 * at(0, -1) - at(1, -1);
      const magnitude = Math.hypot(gx, gy);
      edgeAt[yIndex * width + xIndex] = magnitude;
      magnitudes.push(magnitude);
    }
  }
  if (!magnitudes.length) return fail('無法在掌心範圍取得清楚的紋路，請靠近一點、對焦後再拍一次。');
  const mean = magnitudes.reduce((total, value) => total + value, 0) / magnitudes.length;
  const std = Math.sqrt(magnitudes.reduce((total, value) => total + (value - mean) ** 2, 0) / magnitudes.length);
  const threshold = mean + std;
  const isEdge = (xIndex: number, yIndex: number) => edgeAt[yIndex * width + xIndex] > threshold;
  const edgeDensity = magnitudes.filter((value) => value > threshold).length / magnitudes.length;

  const bandStats = (yFrom: number, yTo: number, xFrom = 0, xTo = 1) => {
    const y0 = Math.floor(palmRegion.top + (palmRegion.bottom - palmRegion.top) * yFrom);
    const y1 = Math.ceil(palmRegion.top + (palmRegion.bottom - palmRegion.top) * yTo);
    const x0 = Math.floor(palmRegion.left + (palmRegion.right - palmRegion.left) * xFrom);
    const x1 = Math.ceil(palmRegion.left + (palmRegion.right - palmRegion.left) * xTo);
    let edges = 0, area = 0, minX = x1, maxX = x0, minY = y1, maxY = y0, runs = 0;
    for (let yIndex = y0; yIndex <= y1 && yIndex < height; yIndex += 1) {
      let inRun = false;
      for (let xIndex = x0; xIndex <= x1 && xIndex < width; xIndex += 1) {
        if (!skin[yIndex * width + xIndex]) { inRun = false; continue; }
        area += 1;
        if (isEdge(xIndex, yIndex)) {
          edges += 1;
          if (!inRun) { runs += 1; inRun = true; }
          if (xIndex < minX) minX = xIndex;
          if (xIndex > maxX) maxX = xIndex;
          if (yIndex < minY) minY = yIndex;
          if (yIndex > maxY) maxY = yIndex;
        } else inRun = false;
      }
    }
    const spanX = maxX > minX ? (maxX - minX) / Math.max(1, x1 - x0) : 0;
    const spanY = maxY > minY ? (maxY - minY) / Math.max(1, y1 - y0) : 0;
    return { density: area ? edges / area : 0, spanX, spanY, runs, edges };
  };

  // 感情線：掌心上緣橫帶。
  const heart = bandStats(0.02, 0.28);
  const heartLine = heart.spanX >= 0.68 ? (heart.runs > heart.spanX * 26 ? 'chained' : 'long') : heart.spanX < 0.42 ? 'short' : 'upward';
  // 智慧線：掌心中段橫帶；下緣有明顯延伸視為下彎。
  const headUpper = bandStats(0.3, 0.5);
  const headLower = bandStats(0.5, 0.72);
  const headLine = headUpper.spanX >= 0.72 ? 'long' : headUpper.spanX < 0.45 ? 'short' : headLower.density > headUpper.density * 0.85 ? 'curved' : 'long';
  // 生命線：取左右兩側下方區塊中邊緣較密的一側視為拇指側。
  const leftSide = bandStats(0.25, 0.95, 0, 0.4);
  const rightSide = bandStats(0.25, 0.95, 0.6, 1);
  const thumbSide = leftSide.density >= rightSide.density ? leftSide : rightSide;
  const lifeLine = thumbSide.density > edgeDensity * 1.25 ? 'deep' : thumbSide.density < edgeDensity * 0.6 ? 'faint' : thumbSide.spanX > 0.55 ? 'wide' : 'close';
  // 事業線：掌心中央縱帶的縱向延伸。
  const fate = bandStats(0.1, 0.98, 0.4, 0.6);
  const fateLine = fate.spanY >= 0.66 && fate.density > edgeDensity * 0.7 ? 'clear' : fate.spanY >= 0.3 ? 'broken' : fate.density < edgeDensity * 0.25 ? 'none' : 'broken';

  const level = (value: number, high: number, medium: number): PalmConfidence => (value >= high ? 'high' : value >= medium ? 'medium' : 'low');
  const coverageConfidence = level(skinCoverage, 0.35, 0.2);
  const edgeConfidence = level(edgeDensity, 0.1, 0.05);
  const merge = (a: PalmConfidence, b: PalmConfidence): PalmConfidence => (a === 'low' || b === 'low' ? 'low' : a === 'medium' || b === 'medium' ? 'medium' : 'high');

  return {
    ok: true,
    message: '已自動分析手掌照片並帶入判讀結果；自動分析是概略估測，和你實際看到的不同時，請直接點選修正。',
    selections: { handShape, lifeLine, headLine, heartLine, fateLine },
    confidence: {
      handShape: coverageConfidence,
      lifeLine: merge(coverageConfidence, edgeConfidence),
      headLine: merge(coverageConfidence, edgeConfidence),
      heartLine: merge(coverageConfidence, edgeConfidence),
      fateLine: edgeConfidence,
    },
    metrics: { skinCoverage, palmAspect, fingerRatio, edgeDensity },
  };
}

export function analyzePalmPixels(image: PixelImage): PalmAutoAnalysis {
  return analyzeInternal(image);
}

export async function analyzePalmImageFile(file: Blob): Promise<PalmAutoAnalysis> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_ANALYSIS_SIZE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(width, height) : Object.assign(document.createElement('canvas'), { width, height });
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!context) throw new Error('目前瀏覽器不支援影像分析。');
    context.drawImage(bitmap, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    return analyzeInternal({ data: imageData.data, width, height });
  } finally {
    bitmap.close();
  }
}
