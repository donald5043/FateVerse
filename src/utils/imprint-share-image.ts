import type { ChartFingerprint } from '../engines/chart-fingerprint-engine';
import type { SkyFact } from '../engines/birthday-sky-engine';
import { loadImage } from './load-image';
import { drawShareFooter } from './share-footer';

export interface ImprintShareContent {
  name?: string;
  fingerprint: ChartFingerprint;
  intro: string;
  facts: SkyFact[];
  /**
   * 要不要把「出生那天的快照」畫進圖裡。預設 false。
   *
   * 那一段會洩漏出生日期——不只是 intro 裡的「1985 年 7 月 19 日」，
   * 農曆、一年中的第幾天、距離今天幾天，每一項單獨都足以反推出確切日期。
   * 這張圖是設計來貼到社群上的，所以預設只畫圖騰，要帶生日得自己勾。
   *
   * 命盤分享卡（share-card.ts）本來就守著「不含生日與出生時間」，
   * 這裡沿用同一條線。
   */
  includeBirthday?: boolean;
}

function drawImageCover(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

/** 把命之圖騰與出生那天快照畫成可下載分享的 PNG（1080×1350）；純瀏覽器端，不上傳。 */
export async function renderImprintShareImage(content: ImprintShareContent): Promise<Blob> {
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

  try {
    const source = new URL(`${import.meta.env.BASE_URL}art/imprint/${content.fingerprint.theme}.webp`, window.location.href).href;
    const image = await loadImage(source);
    context.globalAlpha = 0.72;
    drawImageCover(context, image, width, height);
    context.globalAlpha = 1;
    const veil = context.createLinearGradient(0, 0, 0, height);
    veil.addColorStop(0, 'rgba(4,8,18,.16)');
    veil.addColorStop(0.62, 'rgba(4,8,18,.48)');
    veil.addColorStop(1, 'rgba(4,8,18,.92)');
    context.fillStyle = veil;
    context.fillRect(0, 0, width, height);
  } catch {
    // 底圖載入失敗時仍保留原本的程序生成分享圖。
  }

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

  // 圖騰：不畫生日快照時就沒有下半部要留，圖騰可以放大並置中，版面才不會空掉。
  const withBirthday = content.includeBirthday === true;
  const artSize = withBirthday ? 560 : 720;
  const artScale = artSize / content.fingerprint.size;
  const artOffsetX = centerX - (content.fingerprint.size * artScale) / 2;
  const artOffsetY = withBirthday ? 240 : 300;
  const fp = content.fingerprint;
  const cx = artOffsetX + (content.fingerprint.size / 2) * artScale;
  const cy = artOffsetY + (content.fingerprint.size / 2) * artScale;
  const sx = (x: number) => artOffsetX + x * artScale;
  const sy = (y: number) => artOffsetY + y * artScale;

  /*
   * 圖騰的畫法。
   *
   * 第一版是「線框圖」：三到五條細環、十二根等寬輻條、幾個實心小圓點。
   * 資料本身沒問題，問題是畫法——貼在一張精細的手繪底圖上，它看起來像
   * 工程示意圖而不是圖騰。使用者的說法是「不符合底圖那種程度的精細」。
   *
   * 這裡不動 chart-fingerprint-engine 產生的幾何（畫面上的 SVG 也在用同一份），
   * 只改繪製方式，讓它像「發光的刻紋」而不是「線稿」：
   *   1. 每一筆都畫兩層：先用 shadowBlur 畫一層光暈，再疊一筆清晰的細線。
   *   2. 光暈那層用 lighter 疊加，重疊處的亮度會自然累積，像真的光。
   *   3. 輻條做成向外淡出的漸層，讀起來是「光線」不是「車輪的輪輻」。
   *   4. 節點畫成有光暈的星點，不是實心圓。
   *   5. 最外圈加一圈刻度，增加「星盤儀器」的密度感。
   */

  /** 畫一筆帶光暈的線：先發光、再壓一筆清晰的。 */
  const glowStroke = (path: () => void, color: string, lineWidth: number, alpha: number, blur: number) => {
    context.save();
    context.globalCompositeOperation = 'lighter';
    context.shadowColor = color;
    context.shadowBlur = blur;
    context.strokeStyle = color;
    context.globalAlpha = alpha * 0.55;
    context.lineWidth = lineWidth * 1.6;
    path();
    context.stroke();
    context.restore();

    context.save();
    context.shadowBlur = 0;
    context.strokeStyle = color;
    context.globalAlpha = alpha;
    context.lineWidth = lineWidth;
    path();
    context.stroke();
    context.restore();
  };

  // 中央的暈光。半徑跟著圖騰大小走，放大時才不會顯得中心空掉。
  const halo = context.createRadialGradient(cx, cy, 10, cx, cy, artSize * 0.52);
  halo.addColorStop(0, `${fp.coreColor}55`);
  halo.addColorStop(0.45, `${fp.coreColor}1c`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  context.save();
  context.globalCompositeOperation = 'lighter';
  context.fillStyle = halo;
  context.fillRect(cx - artSize * 0.6, cy - artSize * 0.6, artSize * 1.2, artSize * 1.2);
  context.restore();

  // 同心環
  fp.rings.forEach((ring) => {
    const radius = ring.radius * artScale;
    glowStroke(() => {
      context.beginPath();
      context.setLineDash(ring.dash ? [3 * artScale, 5 * artScale] : []);
      context.arc(cx, cy, radius, 0, Math.PI * 2);
    }, ring.color, Math.max(1, ring.width * artScale), 0.62, 18);
  });
  context.setLineDash([]);

  // 最外圈刻度：把星盤儀器的密度感補上來。
  // rings 目前一定有 3~5 條，但空陣列會讓 Math.max 回傳 -Infinity，
  // 刻度就會畫在 NaN 座標上。加個底線比之後追這種畫面錯誤便宜。
  const outerRadius = (fp.rings.length ? Math.max(...fp.rings.map((ring) => ring.radius)) : 130) * artScale;
  context.save();
  context.globalCompositeOperation = 'lighter';
  context.strokeStyle = fp.palette[0];
  for (let index = 0; index < 72; index += 1) {
    const angle = (Math.PI * 2 * index) / 72;
    const long = index % 6 === 0;
    const inner = outerRadius + 6 * artScale;
    const outer = inner + (long ? 16 : 8) * artScale;
    context.globalAlpha = long ? 0.5 : 0.24;
    context.lineWidth = (long ? 1.4 : 0.8) * artScale;
    context.beginPath();
    context.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    context.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    context.stroke();
  }
  context.restore();

  // 輻條：向外淡出，讀起來是光線不是輪輻。
  fp.spokes.forEach((spoke) => {
    const x1 = sx(spoke.x1);
    const y1 = sy(spoke.y1);
    const x2 = sx(spoke.x2);
    const y2 = sy(spoke.y2);
    const fade = context.createLinearGradient(x1, y1, x2, y2);
    fade.addColorStop(0, spoke.color);
    fade.addColorStop(1, 'rgba(0,0,0,0)');
    context.save();
    context.globalCompositeOperation = 'lighter';
    context.globalAlpha = 0.45;
    context.strokeStyle = fade;
    context.lineWidth = Math.max(1, spoke.width * artScale * 1.4);
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.restore();
  });

  // 核心多邊形：漸層填色 + 發光描邊。
  const corePath = () => {
    context.beginPath();
    fp.corePolygon.forEach((point, index) => {
      const px = sx(point.x);
      const py = sy(point.y);
      if (index === 0) context.moveTo(px, py); else context.lineTo(px, py);
    });
    context.closePath();
  };
  const coreFill = context.createRadialGradient(cx, cy, 2, cx, cy, 50 * artScale);
  coreFill.addColorStop(0, `${fp.coreColor}88`);
  coreFill.addColorStop(1, `${fp.coreColor}14`);
  context.save();
  corePath();
  context.fillStyle = coreFill;
  context.fill();
  context.restore();
  glowStroke(corePath, fp.coreColor, Math.max(1.2, 1.6 * artScale), 0.92, 26);

  // 節點：有光暈的星點。
  fp.nodes.forEach((node) => {
    const nx = sx(node.x);
    const ny = sy(node.y);
    const radius = Math.max(2, node.size * artScale);
    context.save();
    context.globalCompositeOperation = 'lighter';
    const spark = context.createRadialGradient(nx, ny, 0, nx, ny, radius * 4);
    spark.addColorStop(0, node.color);
    spark.addColorStop(0.28, `${node.color}66`);
    spark.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = spark;
    context.beginPath();
    context.arc(nx, ny, radius * 4, 0, Math.PI * 2);
    context.fill();
    context.restore();

    context.save();
    context.fillStyle = '#fdf9ef';
    context.globalAlpha = 0.95;
    context.beginPath();
    context.arc(nx, ny, radius * 0.55, 0, Math.PI * 2);
    context.fill();
    context.restore();
  });

  // 卦碼
  context.fillStyle = 'rgba(174,184,214,0.7)';
  context.font = '400 24px ui-monospace, monospace';
  context.fillText(`${fp.binaryCode} · 卦 ${fp.hexagramIndex}`, centerX, artOffsetY + fp.size * artScale + 46);

  // 出生那天快照：只有使用者明確勾選才畫，因為它會洩漏出生日期。
  if (withBirthday) {
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
  }

  drawShareFooter(context, { height, callToAction: '掃碼生成你自己的命之圖騰' });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('產生分享圖失敗，請再試一次。'))), 'image/png');
  });
}
