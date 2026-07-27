/**
 * 舊 service worker 快取的自我復原。
 *
 * 部署後檔名帶 hash 的 chunk 會換一批，舊的被刪掉。如果使用者的分頁還被
 * 上一版的 SW 掌權，它手上的 index.html 仍指向已經不存在的 chunk，
 * 動態 import 就會 404——畫面整片空白。
 *
 * Vite 遇到這種 import 失敗會在 window 上發出 `vite:preloadError`。
 * 這裡攔下它，清掉 service worker 與 Cache Storage，重新載入一次。
 *
 * 刻意不碰的東西：IndexedDB 與 localStorage。使用者存下來的命盤、偏好、
 * 今日回饋都在 IndexedDB，那是他自己的資料，不該因為快取壞掉被連坐。
 */

const RECOVERY_FLAG = 'fateverse:sw-recovered';

/** sessionStorage 在某些隱私模式會直接丟例外，記憶體旗標是最後一道防線。 */
let recoveredInThisPage = false;

function readFlag(): boolean {
  if (recoveredInThisPage) return true;
  try {
    return window.sessionStorage.getItem(RECOVERY_FLAG) === '1';
  } catch {
    return false;
  }
}

function writeFlag(): void {
  recoveredInThisPage = true;
  try {
    window.sessionStorage.setItem(RECOVERY_FLAG, '1');
  } catch {
    // 寫不進去也沒關係，記憶體旗標已經擋住同一個 page 內的重複觸發。
  }
}

/** 解除這個 origin 底下所有 registration，包含舊部署留下的非根路徑 scope。 */
async function unregisterServiceWorkers(): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.serviceWorker) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch {
    // 解除失敗就往下走，清掉快取仍可能救回這次載入。
  }
}

/** 清空 Cache Storage。只動快取，不動任何使用者資料。 */
async function deleteAllCaches(): Promise<void> {
  if (typeof caches === 'undefined') return;
  try {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
  } catch {
    // 同上：盡力而為。
  }
}

/**
 * 執行一次復原。已經復原過就直接回 false，不做任何清除、不 reload——
 * 這是硬性的迴圈防護，避免壞掉的部署把使用者困在無限重載裡。
 */
export async function recoverFromStaleCache(): Promise<boolean> {
  if (readFlag()) return false;
  // 旗標必須在任何 await 之前寫入，否則同一輪的第二個事件會擠進來。
  writeFlag();

  await unregisterServiceWorkers();
  await deleteAllCaches();
  window.location.reload();
  return true;
}

/**
 * 掛上監聽。回傳解除監聽的函式，方便測試收尾。
 */
export function installPreloadErrorRecovery(): () => void {
  const onPreloadError = (event: Event) => {
    if (readFlag()) return; // 已經復原過，讓錯誤照常拋出，不要再重載
    // 我們接手處理，攔掉 Vite 預設的往外丟。
    event.preventDefault();
    void recoverFromStaleCache();
  };

  window.addEventListener('vite:preloadError', onPreloadError);
  return () => window.removeEventListener('vite:preloadError', onPreloadError);
}

/** 僅供測試：重設記憶體旗標。 */
export function resetRecoveryFlagForTests(): void {
  recoveredInThisPage = false;
}
