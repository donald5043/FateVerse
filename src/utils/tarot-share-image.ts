import type { TarotSpreadCard } from '../engines/tarot-engine';
import { loadImage } from './load-image';
import { drawShareFooter } from './share-footer';

/**
 * 把抽到的三張牌畫成可分享的 PNG（1080×1350，IG 直式比例）。
 *
 * 隱私：這張圖上只有抽到的三張牌。三張牌是用 crypto.getRandomValues 當場抽的，
 * 和出生資料完全無關，所以圖上不含任何個資。生日塔羅（人格牌／靈魂牌）是從
 * 生日推出來的，**刻意不畫進去**——那等於把生日的一部分公開出去。
 */

const WIDTH = 1080;
const HEIGHT = 1350;

function cardArtUrl(id: number): string {
  const file = `${import.meta.env.BASE_URL}art/tarot/${String(id).padStart(2, '0')}.webp`;
  return new URL(file, window.location.href).href;
}

/** 圓角矩形路徑。roundRect 不是每個瀏覽器都有，自己畫比較穩。 */
function roundedPath(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

/** 依寬度斷行。中文沒有空白可切，只能一個字一個字量。 */
function wrapByWidth(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const char of text) {
    const next = line + char;
    if (context.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderTarotShareImage(spread: TarotSpreadCard[]): Promise<Blob> {
  if (spread.length !== 3) throw new Error('需要三張牌才能產生分享圖。');

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('這個瀏覽器不支援產生分享圖。');

  // 背景：偏紫的深色，和塔羅頁的主色一致。
  const background = context.createLinearGradient(0, 0, 0, HEIGHT);
  background.addColorStop(0, '#150f2b');
  background.addColorStop(0.55, '#0b0a1c');
  background.addColorStop(1, '#0a0f20');
  context.fillStyle = background;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  const centerX = WIDTH / 2;
  context.textAlign = 'center';

  context.fillStyle = '#c9a0f0';
  context.font = '600 30px "Noto Sans TC", sans-serif';
  context.fillText('過 去 · 現 在 · 未 來', centerX, 118);

  context.fillStyle = '#f5f0e6';
  context.font = '700 52px "Noto Serif TC", serif';
  context.fillText('我抽到的三張牌', centerX, 190);

  // 三張牌：塔羅牌面是 2:3 直式。
  const cardWidth = 300;
  const cardHeight = 450;
  const gap = 28;
  const totalWidth = cardWidth * 3 + gap * 2;
  const startX = (WIDTH - totalWidth) / 2;
  const cardY = 250;

  for (let index = 0; index < 3; index += 1) {
    const { card, reversed, position } = spread[index];
    const x = startX + index * (cardWidth + gap);

    context.save();
    roundedPath(context, x, cardY, cardWidth, cardHeight, 18);
    context.clip();
    try {
      const image = await loadImage(cardArtUrl(card.id));
      // 逆位：把牌面轉 180°，和畫面上看到的一致。
      if (reversed) {
        context.translate(x + cardWidth / 2, cardY + cardHeight / 2);
        context.rotate(Math.PI);
        context.drawImage(image, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
      } else {
        context.drawImage(image, x, cardY, cardWidth, cardHeight);
      }
    } catch {
      // 牌面載入失敗就留深色底，其餘資訊仍然完整，不讓整張圖失敗。
      context.fillStyle = '#1b1733';
      context.fillRect(x, cardY, cardWidth, cardHeight);
    }
    context.restore();

    context.save();
    roundedPath(context, x, cardY, cardWidth, cardHeight, 18);
    context.strokeStyle = 'rgba(201,160,240,0.45)';
    context.lineWidth = 2;
    context.stroke();
    context.restore();

    context.textAlign = 'center';
    const labelX = x + cardWidth / 2;
    context.fillStyle = '#c9a0f0';
    context.font = '600 26px "Noto Sans TC", sans-serif';
    context.fillText(position, labelX, cardY + cardHeight + 46);

    context.fillStyle = '#f5f0e6';
    context.font = '700 32px "Noto Serif TC", serif';
    context.fillText(card.name, labelX, cardY + cardHeight + 88);

    if (reversed) {
      context.fillStyle = '#e8927f';
      context.font = '400 22px "Noto Sans TC", sans-serif';
      context.fillText('逆位', labelX, cardY + cardHeight + 124);
    }
  }

  /*
   * 底部給「現在」那張牌的建議。
   *
   * 第一版只是把一行字放在牌下面，結果整張圖下半部空掉近 400px，看起來像沒做完。
   * 改成一個有邊框的區塊，把版面收滿——分享圖是要被貼出去的，留白不能是意外。
   */
  const present = spread.find((item) => item.position === '現在') ?? spread[1];
  const boxTop = cardY + cardHeight + 190;
  const boxLeft = 90;
  const boxWidth = WIDTH - boxLeft * 2;

  context.textAlign = 'center';
  context.font = '400 32px "Noto Sans TC", sans-serif';
  const adviceLines = wrapByWidth(context, present.card.advice, boxWidth - 100).slice(0, 4);
  const boxHeight = 120 + adviceLines.length * 50;

  roundedPath(context, boxLeft, boxTop, boxWidth, boxHeight, 28);
  context.fillStyle = 'rgba(201,160,240,0.06)';
  context.fill();
  context.strokeStyle = 'rgba(201,160,240,0.28)';
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = '#c9a0f0';
  context.font = '600 26px "Noto Sans TC", sans-serif';
  context.fillText(`「現在」這張${present.card.name}${present.reversed ? '（逆位）' : ''}說`, centerX, boxTop + 58);

  context.fillStyle = '#f5f0e6';
  context.font = '400 32px "Noto Sans TC", sans-serif';
  let adviceY = boxTop + 118;
  adviceLines.forEach((line) => {
    context.fillText(line, centerX, adviceY);
    adviceY += 50;
  });

  drawShareFooter(context, { height: HEIGHT, callToAction: '掃碼抽你自己的三張牌' });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('產生分享圖失敗，請再試一次。'))),
      'image/png',
    );
  });
}
