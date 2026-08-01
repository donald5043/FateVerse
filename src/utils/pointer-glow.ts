/**
 * 游標星光：卡片會在你的游標位置透出一圈微光。
 *
 * 為什麼做這個而不是再加一組環境動畫：站上已經有二十幾組無限循環的動畫，
 * 看久了會變成壁紙。真正讓人覺得「這頁是活的」的是**會回應你**的東西。
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
 * 只在有精準游標的裝置上啟用：手機沒有 hover，這個效果沒有意義，
 * 而且觸控時每次滑動都寫 CSS 變數只是白白付出成本。
 */

/** 只在滑鼠這類精準指標裝置上啟用。 */
const FINE_POINTER = '(hover: hover) and (pointer: fine)';

export function initPointerGlow(): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};

  const finePointer = window.matchMedia(FINE_POINTER);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!finePointer.matches || reducedMotion.matches) return () => {};

  let frame = 0;
  let pendingTarget: HTMLElement | undefined;
  let pendingX = 0;
  let pendingY = 0;
  let lastTarget: HTMLElement | undefined;

  const flush = () => {
    frame = 0;
    if (!pendingTarget) return;
    pendingTarget.style.setProperty('--gx', `${pendingX}px`);
    pendingTarget.style.setProperty('--gy', `${pendingY}px`);
  };

  const onPointerMove = (event: PointerEvent) => {
    // 觸控筆與手指不走這條路：它們沒有 hover，光暈只會在點到的瞬間閃一下。
    if (event.pointerType !== 'mouse') return;

    const target = (event.target as Element | null)?.closest<HTMLElement>('[data-glow]') ?? undefined;

    if (target !== lastTarget) {
      // 離開上一張卡片時把變數清掉，避免下次進來時光暈從舊位置跳過來。
      lastTarget?.style.removeProperty('--gx');
      lastTarget?.style.removeProperty('--gy');
      lastTarget = target;
    }
    if (!target) return;

    const rect = target.getBoundingClientRect();
    pendingTarget = target;
    pendingX = event.clientX - rect.left;
    pendingY = event.clientY - rect.top;
    // 一幀只寫一次；這一幀已經排過就直接丟掉這次事件。
    if (!frame) frame = window.requestAnimationFrame(flush);
  };

  document.addEventListener('pointermove', onPointerMove, { passive: true });

  return () => {
    document.removeEventListener('pointermove', onPointerMove);
    if (frame) window.cancelAnimationFrame(frame);
    lastTarget?.style.removeProperty('--gx');
    lastTarget?.style.removeProperty('--gy');
  };
}
