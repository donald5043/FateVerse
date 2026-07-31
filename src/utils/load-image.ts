/**
 * 載入一張圖，並且一定會有結果。
 *
 * 為什麼需要逾時：`new Image()` 只保證在成功時觸發 onload、失敗時觸發 onerror，
 * 但「兩個都不觸發」是有可能的——網路卡住、請求被擋掉、或在沒有實作圖片載入的
 * 環境裡（例如測試用的 jsdom）。那時候 Promise 會永遠停在 pending，
 * 呼叫端的按鈕就會一直卡在「產生中…」，沒有錯誤訊息也沒辦法重試。
 *
 * 這個 bug 是寫塔羅分享圖的測試時才浮出來的：測試整個逾時，而不是失敗。
 * 分享圖的呼叫端本來就會 catch 起來改畫純色底，所以逾時之後照樣產得出圖，
 * 只是少了牌面——比永遠轉圈好得多。
 */

/** 單張圖的載入逾時。分享圖是使用者按下按鈕後才跑的，等太久不如先給結果。 */
export const IMAGE_LOAD_TIMEOUT_MS = 6000;

export function loadImage(source: string, timeoutMs = IMAGE_LOAD_TIMEOUT_MS): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      // 放掉還在跑的請求，免得它稍後才回來又動到已經結束的流程。
      image.src = '';
      reject(new Error('圖片載入逾時。'));
    }, timeoutMs);

    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      action();
    };

    image.onload = () => finish(() => resolve(image));
    image.onerror = () => finish(() => reject(new Error('圖片載入失敗。')));
    image.src = source;
  });
}
