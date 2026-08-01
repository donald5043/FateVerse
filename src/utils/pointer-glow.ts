/**
 * 星光：卡片會透出一圈微光，桌機跟著游標走，手機在你點的位置亮一下。
 *
 * 為什麼做這個而不是再加一組環境動畫：站上已經有二十幾組無限循環的動畫，
 * 看久了會變成壁紙。真正讓人覺得「這頁是活的」的是**會回應你**的東西。
 *
 * 為什麼手機也要有：手機直式是這個站的主要瀏覽情境。第一版只做了 hover，
 * 等於大部分使用者完全看不到新效果——那不是「桌機加強」，是「手機沒有」。
 *
 * 效能上的三個約束，缺一個就會拖垮捲動：
 *
 * 1. **只動 transform。** 光暈是一個固定大小、固定漸層的圓，靠 translate3d
 *    移動——合成器就能處理，不觸發重繪。如果改成
 *    `radial-gradient(... at var(--x) var(--y))`，每次移動都要重畫整張卡片。
 * 2. **一個監聽器。** 用事件委派掛在 document 上，靠 closest() 找到卡片，
 *    而不是每張卡片各掛一個。卡片數量不影響成本。
 * 3. **用 rAF 收斂。** pointermove 一秒可以觸發上百次，但畫面一秒只有 60 幀。
 *    多的那些全部丟掉，每幀只寫一次 CSS 變數。
 *
 * 手機不追蹤移動：觸控時手指一路滑過去會連續觸發，而那期間光暈被手指擋住，
 * 付出的成本沒有換到任何東西。所以只在按下的那一刻標一次位置。
 */

/** 有精準指標（滑鼠）才追蹤移動。 */
const FINE_POINTER = '(hover: hover) and (pointer: fine)';

/** 觸控亮起後維持多久。太短看不到，太長會拖在畫面上。 */
const TOUCH_GLOW_MS = 900;

export function initPointerGlow(): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  const finePointer = window.matchMedia(FINE_POINTER).matches;

  let frame = 0;
  let pendingTarget: HTMLElement | undefined;
  let pendingX = 0;
  let pendingY = 0;
  let lastTarget: HTMLElement | undefined;
  let touchTimer = 0;
  let touchTarget: HTMLElement | undefined;

  const clearVars = (element: HTMLElement | undefined) => {
    element?.style.removeProperty('--gx');
    element?.style.removeProperty('--gy');
  };

  const positionOn = (target: HTMLElement, clientX: number, clientY: number) => {
    const rect = target.getBoundingClientRect();
    target.style.setProperty('--gx', `${clientX - rect.left}px`);
    target.style.setProperty('--gy', `${clientY - rect.top}px`);
  };

  const flush = () => {
    frame = 0;
    if (!pendingTarget) return;
    positionOn(pendingTarget, pendingX, pendingY);
  };

  const onPointerMove = (event: PointerEvent) => {
    // 只有滑鼠走這條路：觸控與觸控筆沒有 hover，追蹤移動是白付成本。
    if (event.pointerType !== 'mouse') return;

    const target = (event.target as Element | null)?.closest<HTMLElement>('[data-glow]') ?? undefined;
    if (target !== lastTarget) {
      // 離開上一張卡片時把變數清掉，避免下次進來時光暈從舊位置跳過來。
      clearVars(lastTarget);
      lastTarget = target;
    }
    if (!target) return;

    pendingTarget = target;
    pendingX = event.clientX;
    pendingY = event.clientY;
    // 一幀只寫一次；這一幀已經排過就直接丟掉這次事件。
    if (!frame) frame = window.requestAnimationFrame(flush);
  };

  const onPointerDown = (event: PointerEvent) => {
    // 滑鼠已經有 hover 版本了，這裡只服務觸控。
    if (event.pointerType === 'mouse') return;

    const target = (event.target as Element | null)?.closest<HTMLElement>('[data-glow]') ?? undefined;
    if (!target) return;

    if (touchTimer) window.clearTimeout(touchTimer);
    if (touchTarget && touchTarget !== target) {
      touchTarget.classList.remove('is-touch-glow');
      clearVars(touchTarget);
    }

    positionOn(target, event.clientX, event.clientY);
    target.classList.add('is-touch-glow');
    touchTarget = target;
    touchTimer = window.setTimeout(() => {
      touchTimer = 0;
      target.classList.remove('is-touch-glow');
    }, TOUCH_GLOW_MS);
  };

  if (finePointer) document.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('pointerdown', onPointerDown, { passive: true });

  return () => {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerdown', onPointerDown);
    if (frame) window.cancelAnimationFrame(frame);
    if (touchTimer) window.clearTimeout(touchTimer);
    touchTarget?.classList.remove('is-touch-glow');
    clearVars(lastTarget);
    clearVars(touchTarget);
  };
}
