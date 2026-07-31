import { afterEach, describe, expect, it, vi } from 'vitest';
import { IMAGE_LOAD_TIMEOUT_MS, loadImage } from '../src/utils/load-image';

/**
 * 這個檔案守的是一個真的踩到的 bug。
 *
 * 分享圖要先載入牌面／底圖再畫。原本的 loadImage 只掛 onload 與 onerror，
 * 但這兩個事件都可能不觸發（網路卡住、請求被擋、或在沒有圖片載入實作的環境裡），
 * Promise 就永遠停在 pending——使用者看到的是按鈕一直卡在「產生中…」，
 * 既沒有錯誤訊息也沒辦法重試。
 *
 * 是寫塔羅分享圖的測試時發現的：測試整個逾時，而不是失敗。
 */

class SilentImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';
}

class OkImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_value: string) { queueMicrotask(() => this.onload?.()); }
}

class BadImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_value: string) { queueMicrotask(() => this.onerror?.()); }
}

describe('loadImage', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

  it('兩個事件都不觸發時會逾時，不會永遠等下去', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('Image', SilentImage);

    const pending = loadImage('/art/tarot/01.webp');
    // 掛上 catch 才不會在計時器推進時變成未處理的拒絕。
    const settled = expect(pending).rejects.toThrow('逾時');
    await vi.advanceTimersByTimeAsync(IMAGE_LOAD_TIMEOUT_MS + 10);
    await settled;
  });

  it('載入成功就回傳圖片', async () => {
    vi.stubGlobal('Image', OkImage);
    await expect(loadImage('/art/tarot/01.webp')).resolves.toBeInstanceOf(OkImage);
  });

  it('載入失敗照樣是拒絕，不用等到逾時', async () => {
    vi.stubGlobal('Image', BadImage);
    await expect(loadImage('/art/tarot/01.webp')).rejects.toThrow('失敗');
  });

  it('已經成功之後，逾時計時器不會再改變結果', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('Image', OkImage);
    const image = await loadImage('/art/tarot/01.webp');
    expect(image).toBeInstanceOf(OkImage);
    // 推進超過逾時；若計時器沒被清掉，這裡會冒出未處理的拒絕。
    await vi.advanceTimersByTimeAsync(IMAGE_LOAD_TIMEOUT_MS + 10);
  });
});
