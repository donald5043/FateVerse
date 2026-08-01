/**
 * 捲動揭示：內容進入視窗時才浮現。
 *
 * 站上原本的 `.reveal` 是掛載時就播，所以第一屏以外的東西全都在使用者
 * 還沒捲到的時候animate完了——等他捲下去，只看得到已經停在終點的畫面。
 * 動畫等於白做，還先付了成本。
 *
 * 效能上兩件事：
 * 1. **共用一個 IntersectionObserver。** 每個元素各建一個 observer 也能動，
 *    但那是每個元素一份跨執行緒的觀察成本。共用一個，元素數量幾乎不影響。
 * 2. **播完就取消觀察。** 這是一次性的進場動畫，播過就不需要再追蹤了。
 */

/** 元素露出這個比例就算「看到了」。太高的話捲很快時會來不及播。 */
const VISIBLE_RATIO = 0.12;

let observer: IntersectionObserver | undefined;

function ensureObserver(): IntersectionObserver | undefined {
  if (typeof IntersectionObserver === 'undefined') return undefined;
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        // 一次性動畫，播完就不用再看著它。
        observer?.unobserve(entry.target);
      });
    },
    { threshold: VISIBLE_RATIO, rootMargin: '0px 0px -40px 0px' },
  );
  return observer;
}

/**
 * 開始觀察一個元素，回傳取消觀察的函式。
 *
 * 沒有 IntersectionObserver 的環境（例如測試用的 jsdom）直接標成已揭示——
 * 寧可少一段動畫，也不要讓內容永遠停在透明狀態看不到。
 */
export function observeReveal(element: HTMLElement): () => void {
  const shared = ensureObserver();
  if (!shared) {
    element.classList.add('is-revealed');
    return () => {};
  }
  shared.observe(element);
  return () => shared.unobserve(element);
}
