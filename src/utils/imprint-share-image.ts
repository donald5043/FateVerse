import type { ChartFingerprint } from '../engines/chart-fingerprint-engine';
import type { SkyFact } from '../engines/birthday-sky-engine';

export interface ImprintShareContent {
  name?: string;
  fingerprint: ChartFingerprint;
  intro: string;
  facts: SkyFact[];
}

/** 把命之圖騰與出生那天快照畫成可下載分享的 PNG（1080×1350）；純瀏覽器端，不上傳。 */
export function renderImprintShareImage(content: ImprintShareContent): Promise<Blob> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return Promise.reject(new Error('這個瀏覽器不支援產生分享圖。'));

  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, '#0c1226');
  background.addColorStop(0.55, '#080d1b');
  background.addColorStop(1, '#0a0f20');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  const centerX = width / 2;
  context.textAlign = 'center';

  context.fillStyle = '#d8b875';
  context.font = '600 30px "Noto Sans TC", sans-serif';
  context.fillText('宇 宙 印 記 · Cosmic Imprint', centerX, 130);

  if (content.name) {
    context.fillStyle = '#f5f0e6';
    context.font = '700 44px "Noto Serif TC", serif';
    context.fillText(`${content.name} 的命之圖騰`, centerX, 195);
  }

  // 圖騰：把 fingerprint 圖元縮放到分享圖上半部。
  const artScale = 560 / content.fingerprint.size;
  const artOffsetX = centerX - (content.fingerprint.size * artScale) / 2;
  const artOffsetY = 240;
  const fp = content.fingerprint;
  const cx = artOffsetX + (content.fingerprint.size / 2) * artScale;
  const cy = artOffsetY + (content.fingerprint.size / 2) * artScale;
  const sx = (x: number) => artOffsetX + x * artScale;
  const sy = (y: number) => artOffsetY + y * artScale;

  const glow = context.createRadialGradient(cx, cy, 20, cx, cy, 260);
  glow.addColorStop(0, `${fp.coreColor}44`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = glow;
  context.fillRect(artOffsetX, artOffsetY, fp.size * artScale, fp.size * artScale);

  fp.rings.forEach((ring) => {
    context.beginPath();
    context.arc(cx, cy, ring.radius * artScale, 0, Math.PI * 2);
    context.strokeStyle = ring.color;
    context.globalAlpha = 0.55;
    context.lineWidth = ring.width * artScale;
    if (ring.dash) context.setLineDash([3 * artScale, 5 * artScale]); else context.setLineDash([]);
    context.stroke();
  });
  context.setLineDash([]);
  context.globalAlpha = 0.28;
  fp.spokes.forEach((spoke) => {
    context.beginPath();
    context.moveTo(sx(spoke.x1), sy(spoke.y1));
    context.lineTo(sx(spoke.x2), sy(spoke.y2));
    context.strokeStyle = spoke.color;
    context.lineWidth = spoke.width * artScale;
    context.stroke();
  });
  context.globalAlpha = 1;
  context.beginPath();
  fp.corePolygon.forEach((point, index) => {
    const px = sx(point.x);
    const py = sy(point.y);
    if (index === 0) context.moveTo(px, py); else context.lineTo(px, py);
  });
  context.closePath();
  context.fillStyle = fp.coreColor;
  context.globalAlpha = 0.16;
  context.fill();
  context.globalAlpha = 0.8;
  context.lineWidth = 1.4 * artScale;
  context.strokeStyle = fp.coreColor;
  context.stroke();
  context.globalAlpha = 1;
  fp.nodes.forEach((node) => {
    context.beginPath();
    context.arc(sx(node.x), sy(node.y), node.size * artScale, 0, Math.PI * 2);
    context.fillStyle = node.color;
    context.globalAlpha = 0.85;
    context.fill();
  });
  context.globalAlpha = 1;

  // 卦碼
  context.fillStyle = 'rgba(174,184,214,0.7)';
  context.font = '400 24px ui-monospace, monospace';
  context.fillText(`${fp.binaryCode} · 卦 ${fp.hexagramIndex}`, centerX, artOffsetY + fp.size * artScale + 46);

  // 出生那天快照
  let factY = artOffsetY + fp.size * artScale + 110;
  context.fillStyle = '#aeb8d6';
  context.font = '400 28px "Noto Sans TC", sans-serif';
  context.fillText(content.intro.length > 30 ? content.intro.slice(0, 30) : content.intro, centerX, factY);
  factY += 54;

  context.font = '400 30px "Noto Sans TC", sans-serif';
  content.facts.slice(0, 6).forEach((fact) => {
    context.fillStyle = '#778199';
    context.textAlign = 'right';
    context.fillText(fact.label, centerX - 20, factY);
    context.fillStyle = '#f5f0e6';
    context.textAlign = 'left';
    context.fillText(fact.value.length > 18 ? `${fact.value.slice(0, 18)}…` : fact.value, centerX + 20, factY);
    factY += 46;
  });

  context.textAlign = 'center';
  context.fillStyle = '#d8b875';
  context.font = '600 28px "Noto Serif TC", serif';
  context.fillText('萬象命書 FateVerse', centerX, height - 56);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('產生分享圖失敗，請再試一次。'))), 'image/png');
  });
}
