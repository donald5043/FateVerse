import type { ChartFingerprint } from '../engines/chart-fingerprint-engine';
import type { SkyFact } from '../engines/birthday-sky-engine';
import { drawImprintTotem } from './draw-imprint-totem';
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

  const backgroundSource = new URL(
    `${import.meta.env.BASE_URL}art/imprint/${content.fingerprint.theme}.webp`,
    window.location.href,
  ).href;
  const motifSource = new URL(
    `${import.meta.env.BASE_URL}art/imprint/motif-${content.fingerprint.theme}.webp`,
    window.location.href,
  ).href;
  const [backgroundResult, motifResult] = await Promise.allSettled([
    loadImage(backgroundSource),
    loadImage(motifSource),
  ]);

  if (backgroundResult.status === 'fulfilled') {
    context.globalAlpha = 0.72;
    drawImageCover(context, backgroundResult.value, width, height);
    context.globalAlpha = 1;
    const veil = context.createLinearGradient(0, 0, 0, height);
    veil.addColorStop(0, 'rgba(4,8,18,.16)');
    veil.addColorStop(0.62, 'rgba(4,8,18,.48)');
    veil.addColorStop(1, 'rgba(4,8,18,.92)');
    context.fillStyle = veil;
    context.fillRect(0, 0, width, height);
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
  const artOffsetX = centerX - artSize / 2;
  const artOffsetY = withBirthday ? 240 : 300;
  const fp = content.fingerprint;
  drawImprintTotem(context, fp, {
    x: artOffsetX,
    y: artOffsetY,
    size: artSize,
    motif: motifResult.status === 'fulfilled' ? motifResult.value : undefined,
  });

  // 用人能讀懂的卦象標籤取代工程感較重的二進位字串；六爻已直接畫入圖騰。
  context.fillStyle = 'rgba(174,184,214,0.7)';
  context.font = '500 23px "Noto Serif TC", serif';
  context.fillText(`第 ${fp.hexagramIndex} 卦 · 六爻印記`, centerX, artOffsetY + artSize + 46);

  // 出生那天快照：只有使用者明確勾選才畫，因為它會洩漏出生日期。
  if (withBirthday) {
    let factY = artOffsetY + artSize + 110;
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
