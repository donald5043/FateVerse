import { SHARE_QR_URL } from '../data/share-qr';
import { drawQr, qrTotalSize } from './draw-qr';

/**
 * 分享圖底部：品牌 + QR code。
 *
 * 兩張分享圖（塔羅三張牌、宇宙印記）共用同一個頁腳，看起來才像同一個產品出的。
 *
 * QR 的用途是把看到圖的人帶回站上——原本圖上只有「萬象命書 FateVerse」幾個字，
 * 貼到社群之後沒有任何路徑可以走回來。
 */

/** QR 本體的目標邊長，實際會被 drawQr 調成模組寬的整數倍。 */
const QR_TARGET_SIZE = 132;

export interface ShareFooterOptions {
  /** 畫布高度。頁腳靠底部對齊。 */
  height: number;
  /** QR 旁邊那句話，例如「掃碼算你自己的」。 */
  callToAction: string;
}

/** 畫出頁腳。回傳頁腳區塊的頂端 y，讓呼叫端知道內容最多能畫到哪裡。 */
export function drawShareFooter(
  context: CanvasRenderingContext2D,
  { height, callToAction }: ShareFooterOptions,
): number {
  const total = qrTotalSize(QR_TARGET_SIZE);
  const paddingX = 90;
  const bottom = height - 56;
  const qrY = bottom - total;

  drawQr(context, paddingX, qrY, { size: QR_TARGET_SIZE, foreground: '#0a0f20', background: '#f5f0e6' });

  const textX = paddingX + total + 28;
  context.save();
  context.textAlign = 'left';

  context.fillStyle = '#d8b875';
  context.font = '600 34px "Noto Serif TC", serif';
  context.fillText('萬象命書 FateVerse', textX, qrY + total / 2 - 16);

  context.fillStyle = '#aeb8d6';
  context.font = '400 24px "Noto Sans TC", sans-serif';
  context.fillText(callToAction, textX, qrY + total / 2 + 22);

  // 網址寫出來：有些人不掃碼，直接看網址打進瀏覽器。
  context.fillStyle = '#778199';
  context.font = '400 20px ui-monospace, monospace';
  context.fillText(SHARE_QR_URL.replace('https://', ''), textX, qrY + total / 2 + 56);
  context.restore();

  return qrY;
}
