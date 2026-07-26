import type { ElementName } from '../types/fate';

/**
 * 命盤分享圖（1080×1350 直式，主要投放場景是 Threads / IG）。
 *
 * 只用 Canvas 2D API 與系統字體堆疊，不載入外部字體、不引入任何繪圖套件。
 *
 * 個資保護：預設不畫姓名、生日與出生時間。只有使用者自行填了暱稱，
 * 圖上才會出現那個暱稱——`ShareCardData` 刻意不接受出生資料欄位，
 * 讓「不小心把個資畫上去」在型別層面就不可能發生。
 */
export interface ShareCardData {
  /** 五行占比，0–100。 */
  percentages: Record<ElementName, number>;
  /** 速寫標語，最多顯示兩行，過長自動截斷。 */
  headline: string;
  /** 命盤標籤，例如「日主 丁火」「太陽 摩羯座」。最多顯示四個。 */
  labels: string[];
  /** 使用者自填的暱稱。預設空白，空白時圖上不出現任何稱謂。 */
  nickname?: string;
}

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1350;

/** 系統字體堆疊。MUST NOT 載入外部字體檔。 */
const SANS = '-apple-system, "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif';
const SERIF = '"Songti TC", "PingFang TC", "Microsoft JhengHei", serif';

const ELEMENT_ORDER: ElementName[] = ['wood', 'fire', 'earth', 'metal', 'water'];
const ELEMENT_TEXT: Record<ElementName, string> = {
  wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
};

/**
 * 以 measureText 實測寬度換行，不用字數硬切——中文、英數與標點寬度差異很大，
 * 按字數切會在混排時溢出。
 */
export function wrapByWidth(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const lines: string[] = [];
  let current = '';

  for (const char of [...text]) {
    const candidate = current + char;
    if (context.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    if (!current) continue; // 單一字元就超寬，避免無限迴圈
    lines.push(current);
    current = char;
    if (lines.length === maxLines) break;
  }

  if (lines.length < maxLines && current) lines.push(current);

  // 內容還沒畫完就用完行數 → 最後一行加省略號，並確保加了之後仍不溢出。
  const consumed = lines.join('').length;
  if (consumed < [...text].length && lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (last.length > 1 && context.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = `${last}…`;
  }

  return lines;
}

/** 五行雷達（正五角形）。 */
function drawRadar(
  context: CanvasRenderingContext2D,
  percentages: Record<ElementName, number>,
  centerX: number,
  centerY: number,
  radius: number,
): void {
  const step = (Math.PI * 2) / ELEMENT_ORDER.length;
  const angleAt = (index: number) => -Math.PI / 2 + index * step;
  const pointAt = (index: number, ratio: number) => ({
    x: centerX + Math.cos(angleAt(index)) * radius * ratio,
    y: centerY + Math.sin(angleAt(index)) * radius * ratio,
  });

  // 底層網格
  context.strokeStyle = 'rgba(212, 175, 110, 0.22)';
  context.lineWidth = 2;
  for (const ring of [0.25, 0.5, 0.75, 1]) {
    context.beginPath();
    ELEMENT_ORDER.forEach((_, index) => {
      const { x, y } = pointAt(index, ring);
      if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
    });
    context.closePath();
    context.stroke();
  }
  ELEMENT_ORDER.forEach((_, index) => {
    const { x, y } = pointAt(index, 1);
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.lineTo(x, y);
    context.stroke();
  });

  // 資料多邊形。以 40% 為視覺基準，讓單一元素過高時仍留在框內。
  const ratioOf = (element: ElementName) => Math.max(0.08, Math.min(1, (percentages[element] ?? 0) / 40));
  context.beginPath();
  ELEMENT_ORDER.forEach((element, index) => {
    const { x, y } = pointAt(index, ratioOf(element));
    if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
  });
  context.closePath();
  context.fillStyle = 'rgba(212, 175, 110, 0.28)';
  context.fill();
  context.strokeStyle = '#d4af6e';
  context.lineWidth = 4;
  context.stroke();

  // 五行標籤
  context.font = `600 34px ${SERIF}`;
  context.fillStyle = '#f2e6cf';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  ELEMENT_ORDER.forEach((element, index) => {
    const { x, y } = pointAt(index, 1.22);
    context.fillText(ELEMENT_TEXT[element], x, y);
  });
}

/**
 * 把命盤畫成分享卡。畫布會被設定為 1080×1350。
 *
 * @param data   要畫的內容（不含任何出生資料）
 * @param canvas 目標畫布
 */
export function renderShareCard(data: ShareCardData, canvas: HTMLCanvasElement): void {
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('這個瀏覽器不支援產生分享圖。');

  const width = SHARE_CARD_WIDTH;
  const height = SHARE_CARD_HEIGHT;

  // 深色底，高對比，縮圖在手機上仍看得清標語。
  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, '#0c1226');
  background.addColorStop(0.55, '#080d1b');
  background.addColorStop(1, '#0a0f20');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = 'rgba(212, 175, 110, 0.35)';
  context.lineWidth = 3;
  context.strokeRect(40, 40, width - 80, height - 80);

  const margin = 96;
  const contentWidth = width - margin * 2;

  // 頁眉
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.font = `600 30px ${SANS}`;
  context.fillStyle = '#d4af6e';
  context.fillText('萬象命書 FateVerse', margin, 150);

  context.font = `400 26px ${SANS}`;
  context.fillStyle = 'rgba(226, 232, 240, 0.65)';
  context.fillText('一面鏡子，不是一本預言書', margin, 194);

  // 暱稱：只有使用者自己填了才畫。
  const nickname = data.nickname?.trim();
  if (nickname) {
    context.font = `600 34px ${SERIF}`;
    context.fillStyle = '#f2e6cf';
    context.fillText(nickname, margin, 252);
  }

  // 雷達
  drawRadar(context, data.percentages, width / 2, 560, 210);

  // 標語，最多兩行
  context.textAlign = 'center';
  context.font = `700 52px ${SERIF}`;
  context.fillStyle = '#f2e6cf';
  const headlineLines = wrapByWidth(context, data.headline, contentWidth, 2);
  headlineLines.forEach((line, index) => {
    context.fillText(line, width / 2, 900 + index * 72);
  });

  // 命盤標籤（不含出生資料），最多四個
  context.font = `500 30px ${SANS}`;
  context.fillStyle = 'rgba(226, 232, 240, 0.8)';
  const labelLine = data.labels.slice(0, 4).join('　·　');
  const labelLines = wrapByWidth(context, labelLine, contentWidth, 2);
  labelLines.forEach((line, index) => {
    context.fillText(line, width / 2, 1080 + index * 46);
  });

  // 頁尾
  context.font = `400 28px ${SANS}`;
  context.fillStyle = '#d4af6e';
  context.fillText('donald5043.github.io/FateVerse', width / 2, height - 130);

  context.font = `400 24px ${SANS}`;
  context.fillStyle = 'rgba(226, 232, 240, 0.5)';
  context.fillText('全程在瀏覽器計算，資料不上傳', width / 2, height - 88);
}

/** 產生 PNG Blob。 */
export function shareCardToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('產生分享圖失敗，請再試一次。'))),
      'image/png',
    );
  });
}
