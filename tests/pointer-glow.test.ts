import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initPointerGlow } from '../src/utils/pointer-glow';

/**
 * 星光的行為：桌機跟著游標，手機在點的位置亮一下。
 *
 * 這個效果沒辦法用無頭瀏覽器截圖驗證：headless Chrome 沒有指標裝置，
 * `(hover: hover) and (pointer: fine)` 永遠是 false。所以改成在 jsdom 裡
 * 直接測邏輯——這反而比截圖可靠，因為它每次都會跑。
 *
 * 要守住兩類事情：
 * - **看得到**：手機也要有效果。第一版只做 hover，等於主要瀏覽情境全空。
 * - **不拖累**：一個監聽器、一幀只寫一次、觸控不逐幀追蹤、
 *   使用者要求減少動態時完全不啟用。
 */

/** 讓 matchMedia 回傳我們指定的結果。 */
function stubMedia({ finePointer, reduceMotion }: { finePointer: boolean; reduceMotion: boolean }) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reduceMotion : finePointer,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

function makeCard() {
  const card = document.createElement('div');
  card.setAttribute('data-glow', '');
  const child = document.createElement('p');
  card.appendChild(child);
  document.body.appendChild(card);
  // jsdom 沒有版面，getBoundingClientRect 一律是 0，這裡給一個固定的框。
  card.getBoundingClientRect = () => ({
    left: 100, top: 200, width: 300, height: 150, right: 400, bottom: 350, x: 100, y: 200, toJSON: () => ({}),
  }) as DOMRect;
  return { card, child };
}

function movePointer(target: Element, clientX: number, clientY: number, pointerType = 'mouse') {
  const event = new Event('pointermove', { bubbles: true }) as Event & Record<string, unknown>;
  Object.assign(event, { clientX, clientY, pointerType });
  target.dispatchEvent(event);
}

function pressPointer(target: Element, clientX: number, clientY: number, pointerType = 'touch') {
  const event = new Event('pointerdown', { bubbles: true }) as Event & Record<string, unknown>;
  Object.assign(event, { clientX, clientY, pointerType });
  target.dispatchEvent(event);
}

describe('游標星光', () => {
  let frames: FrameRequestCallback[] = [];

  beforeEach(() => {
    frames = [];
    // 手動控制 rAF，才能觀察「多次移動只寫一次」。
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => undefined);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  const runFrames = () => {
    const queued = frames;
    frames = [];
    queued.forEach((cb) => cb(0));
  };

  it('把游標位置寫成卡片上的 CSS 變數', () => {
    stubMedia({ finePointer: true, reduceMotion: false });
    const stop = initPointerGlow();
    const { child } = makeCard();

    movePointer(child, 250, 260);
    runFrames();

    const card = document.querySelector<HTMLElement>('[data-glow]')!;
    // 卡片左上角是 (100, 200)，所以 (250, 260) 換算成卡內座標是 (150, 60)。
    expect(card.style.getPropertyValue('--gx')).toBe('150px');
    expect(card.style.getPropertyValue('--gy')).toBe('60px');
    stop();
  });

  it('一幀之內移動很多次，只寫一次', () => {
    stubMedia({ finePointer: true, reduceMotion: false });
    const stop = initPointerGlow();
    const { child } = makeCard();

    for (let i = 0; i < 20; i += 1) movePointer(child, 150 + i, 260);
    // pointermove 一秒可以上百次，但只該排一個 rAF。
    expect(frames).toHaveLength(1);

    runFrames();
    const card = document.querySelector<HTMLElement>('[data-glow]')!;
    // 寫進去的是最後一次的位置，不是第一次。
    expect(card.style.getPropertyValue('--gx')).toBe('69px');
    stop();
  });

  it('移出卡片時把變數清掉，下次進來才不會從舊位置跳過來', () => {
    stubMedia({ finePointer: true, reduceMotion: false });
    const stop = initPointerGlow();
    const { child } = makeCard();

    movePointer(child, 250, 260);
    runFrames();
    const card = document.querySelector<HTMLElement>('[data-glow]')!;
    expect(card.style.getPropertyValue('--gx')).not.toBe('');

    // 移到卡片外面（body 上沒有 data-glow）。
    movePointer(document.body, 10, 10);
    expect(card.style.getPropertyValue('--gx')).toBe('');
    stop();
  });

  it('觸控不啟用：手機沒有 hover，寫變數只是白付成本', () => {
    stubMedia({ finePointer: true, reduceMotion: false });
    const stop = initPointerGlow();
    const { child } = makeCard();

    movePointer(child, 250, 260, 'touch');
    expect(frames, '觸控不該排任何一幀').toHaveLength(0);
    stop();
  });

  it('沒有精準指標時不追蹤移動', () => {
    // 觸控裝置仍然有按下的效果（見下面幾條），但不該逐幀追蹤手指。
    stubMedia({ finePointer: false, reduceMotion: false });
    const stop = initPointerGlow();
    const { child } = makeCard();

    movePointer(child, 250, 260, 'touch');
    expect(frames).toHaveLength(0);
    expect(document.querySelector<HTMLElement>('[data-glow]')!.style.getPropertyValue('--gx')).toBe('');
    stop();
  });

  it('手機也看得到：點下去的位置會亮起來', () => {
    /*
     * 第一版只做了 hover，等於手機使用者完全看不到新效果——
     * 而手機直式才是這個站的主要瀏覽情境。
     */
    vi.useFakeTimers();
    stubMedia({ finePointer: false, reduceMotion: false });
    const stop = initPointerGlow();
    const { child } = makeCard();

    pressPointer(child, 250, 260);
    const card = document.querySelector<HTMLElement>('[data-glow]')!;
    expect(card.classList.contains('is-touch-glow'), '按下時要亮起來').toBe(true);
    expect(card.style.getPropertyValue('--gx')).toBe('150px');
    expect(card.style.getPropertyValue('--gy')).toBe('60px');

    // 亮一下就好，不要一直掛在畫面上。
    vi.advanceTimersByTime(1000);
    expect(card.classList.contains('is-touch-glow'), '過一會兒要自己淡掉').toBe(false);

    stop();
    vi.useRealTimers();
  });

  it('觸控時不逐幀追蹤手指：只在按下那一刻標一次位置', () => {
    // 手指滑過去期間光暈被手指擋住，追蹤等於付出成本換不到東西。
    stubMedia({ finePointer: false, reduceMotion: false });
    const stop = initPointerGlow();
    const { child } = makeCard();

    pressPointer(child, 250, 260);
    for (let i = 0; i < 20; i += 1) movePointer(child, 250 + i, 260, 'touch');
    expect(frames, '觸控移動不該排任何一幀').toHaveLength(0);
    stop();
  });

  it('連續點不同卡片時，前一張會先熄掉', () => {
    vi.useFakeTimers();
    stubMedia({ finePointer: false, reduceMotion: false });
    const stop = initPointerGlow();
    const first = makeCard();
    const second = makeCard();

    pressPointer(first.child, 250, 260);
    pressPointer(second.child, 250, 260);

    expect(first.card.classList.contains('is-touch-glow'), '前一張沒熄掉會同時亮兩張').toBe(false);
    expect(second.card.classList.contains('is-touch-glow')).toBe(true);
    stop();
    vi.useRealTimers();
  });

  it('使用者要求減少動態時完全不啟用', () => {
    stubMedia({ finePointer: true, reduceMotion: true });
    const stop = initPointerGlow();
    const { child } = makeCard();

    movePointer(child, 250, 260);
    pressPointer(child, 250, 260);
    expect(frames).toHaveLength(0);
    expect(document.querySelector<HTMLElement>('[data-glow]')!.classList.contains('is-touch-glow')).toBe(false);
    stop();
  });

  it('停用之後不再回應移動', () => {
    stubMedia({ finePointer: true, reduceMotion: false });
    const stop = initPointerGlow();
    const { child } = makeCard();
    stop();

    movePointer(child, 250, 260);
    expect(frames).toHaveLength(0);
  });
});
