/**
 * 把產生好的圖片交給使用者：優先走系統分享，不支援才退回下載。
 *
 * 為什麼順序是這樣：在手機上「下載」幾乎是死路——存進相簿之後還要自己開
 * IG／限動、找到那張圖、再貼上。系統分享是一次點擊就把圖片送進分享選單。
 * 這個站最可能被分享出去的東西（塔羅三張牌、宇宙印記）都在手機上看，
 * 所以預設要走分享。
 *
 * 這段邏輯原本散在 ShareCardButton 與 CosmicImprintPage 各寫一份，
 * 而印記那份根本沒接系統分享。抽成一份之後三個地方行為一致。
 */

/** 是否能用系統分享送出檔案。桌機瀏覽器多半不支援，退回下載即可，不算錯誤。 */
export function canShareFile(file: File): boolean {
  return typeof navigator !== 'undefined'
    && typeof navigator.share === 'function'
    && typeof navigator.canShare === 'function'
    && navigator.canShare({ files: [file] });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export type ShareOutcome = 'shared' | 'downloaded';

/**
 * 分享或下載一張圖。
 *
 * 使用者在系統分享面板按取消也會讓 `navigator.share` 拋錯，那不是失敗，
 * 也不該偷偷改成下載一張他不想要的圖——所以取消時直接結束，回報 'shared'。
 */
export async function shareOrDownload(blob: Blob, filename: string, title: string): Promise<ShareOutcome> {
  const file = new File([blob], filename, { type: blob.type || 'image/png' });

  if (canShareFile(file)) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (reason) {
      // AbortError＝使用者自己按了取消，這時什麼都不要做。
      if (reason instanceof DOMException && reason.name === 'AbortError') return 'shared';
      // 其他錯誤（例如系統分享不可用）才退回下載。
    }
  }

  downloadBlob(blob, filename);
  return 'downloaded';
}
