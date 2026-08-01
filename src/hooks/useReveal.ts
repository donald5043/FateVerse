import { useEffect, useRef } from 'react';
import { observeReveal } from '../utils/reveal-on-scroll';

/**
 * 讓一個元素在捲進視窗時才播進場動畫。
 *
 * 用法：
 * ```tsx
 * const ref = useReveal<HTMLDivElement>();
 * return <div ref={ref} className="reveal-on-scroll">…</div>;
 * ```
 *
 * 動畫本體在 CSS（`.reveal-on-scroll` / `.is-revealed`），這裡只負責
 * 在對的時機掛上那個 class。尊重 prefers-reduced-motion 的判斷也在 CSS，
 * 因為那是視覺的事，不該散在兩個地方各判一次。
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    return observeReveal(element);
  }, []);

  return ref;
}
