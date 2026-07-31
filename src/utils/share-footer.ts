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

/**
 * QR 本體的目標邊長，實際會被 drawQr 調成模組寬的整數倍。
 *
 * 174 會得到 6px 的模組。這個數字是量出來的，不是挑好看的：
 * 把 QR 畫成圓點造型之後，132（模組 4px）用 jsqr **完全掃不到**，
 * 150（5px）勉強可以，174（6px）穩定。造型化的模組比方塊需要更多像素，
 * 而分享圖還會被社群平台重新壓縮、被相機斜著拍，所以取有餘裕的那一檔。
 *
 * 改這個數字請重新產圖並用解碼器驗證，不要只用眼睛看。
 */
const QR_TARGET_SIZE = 174;

/** 頁腳與畫布底部的距離。 */
const BOTTOM_MARGIN = 56;

/**
 * 頁腳區塊的頂端 y。
 *
 * 內容要排在這條線以上。宇宙印記的「出生那天快照」曾經一路畫到 1194，
 * 而頁腳從 1146 開始——結果「距離今天 13,922 天」直接壓在品牌字和 QR 上。
 * 版面要靠這個函式問出邊界，不要各自寫死常數。
 */
export function shareFooterTop(height: number): number {
  return height - BOTTOM_MARGIN - qrTotalSize(QR_TARGET_SIZE);
}

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
  const qrY = shareFooterTop(height);

  drawQr(context, paddingX, qrY, {
    size: QR_TARGET_SIZE,
    // 深藍而不是純黑、暖米而不是死白，配站上的色調；外框用品牌金收邊。
    foreground: '#101a33',
    background: '#f3ece0',
    border: 'rgba(216,184,117,0.55)',
  });

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
