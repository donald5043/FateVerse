import type { DiceSide } from '../engines/decision-ritual-engine';

export interface RitualShareContent {
  question: string;
  diceLabel: string;
  diceSide: DiceSide;
  headline: string;
  cardText: string;
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const char of text) {
    const candidate = current + char;
    if (context.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** 用 Canvas 繪出可下載分享的儀式結果圖（1080×1350，直式）；全程在瀏覽器端，不上傳。 */
export function renderRitualShareImage(content: RitualShareContent): Promise<Blob> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return Promise.reject(new Error('這個瀏覽器不支援產生分享圖。'));

  // 背景漸層 + 光暈
  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, '#0c1226');
  background.addColorStop(0.55, '#080d1b');
  background.addColorStop(1, '#0a0f20');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  const glow = context.createRadialGradient(width / 2, 430, 40, width / 2, 430, 480);
  glow.addColorStop(0, content.diceSide === 'act' ? 'rgba(216,184,117,0.22)' : 'rgba(94,234,212,0.16)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  const centerX = width / 2;
  context.textAlign = 'center';

  // 標籤
  context.fillStyle = '#d8b875';
  context.font = '600 30px "Noto Sans TC", sans-serif';
  context.fillText('決 策 儀 式 · 擲', centerX, 150);

  // 問題
  context.fillStyle = '#aeb8d6';
  context.font = '400 34px "Noto Sans TC", sans-serif';
  const questionLines = wrapText(context, content.question, width - 200).slice(0, 3);
  questionLines.forEach((line, index) => context.fillText(line, centerX, 240 + index * 48));

  // 骰面大字
  const diceColor = content.diceSide === 'act' ? '#d8b875' : '#5eead4';
  context.beginPath();
  context.arc(centerX, 500, 150, 0, Math.PI * 2);
  context.strokeStyle = diceColor;
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = diceColor;
  context.font = '700 180px "Noto Serif TC", serif';
  context.fillText(content.diceLabel, centerX, 565);

  // headline
  context.fillStyle = '#f5f0e6';
  context.font = '600 40px "Noto Serif TC", serif';
  const headlineLines = wrapText(context, content.headline, width - 160).slice(0, 4);
  headlineLines.forEach((line, index) => context.fillText(line, centerX, 760 + index * 58));

  // 行動卡框
  const cardTop = 760 + headlineLines.length * 58 + 40;
  const cardHeight = 300;
  context.fillStyle = 'rgba(255,255,255,0.045)';
  context.strokeStyle = 'rgba(216,184,117,0.3)';
  context.lineWidth = 2;
  const cardX = 100;
  const cardWidth = width - 200;
  context.beginPath();
  if (typeof context.roundRect === 'function') context.roundRect(cardX, cardTop, cardWidth, cardHeight, 28);
  else context.rect(cardX, cardTop, cardWidth, cardHeight);
  context.fill();
  context.stroke();
  context.fillStyle = '#d8b875';
  context.font = '600 26px "Noto Sans TC", sans-serif';
  context.fillText('今日行動卡', centerX, cardTop + 56);
  context.fillStyle = '#e8ddc5';
  context.font = '400 32px "Noto Sans TC", sans-serif';
  const cardLines = wrapText(context, content.cardText, cardWidth - 80).slice(0, 5);
  cardLines.forEach((line, index) => context.fillText(line, centerX, cardTop + 116 + index * 46));

  // 頁尾
  context.fillStyle = '#778199';
  context.font = '400 26px "Noto Sans TC", sans-serif';
  context.fillText('骰子不決定你的人生，它只把你的答案照出來', centerX, height - 110);
  context.fillStyle = '#d8b875';
  context.font = '600 28px "Noto Serif TC", serif';
  context.fillText('萬象命書 FateVerse', centerX, height - 64);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('產生分享圖失敗，請再試一次。'))), 'image/png');
  });
}
