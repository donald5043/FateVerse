export function calculateStickyScrollTop(
  elementViewportTop: number,
  currentScrollY: number,
  appHeaderHeight: number,
  localNavigationHeight: number,
  gap = 12,
): number {
  return Math.max(0, elementViewportTop + currentScrollY - appHeaderHeight - localNavigationHeight - gap);
}

export function preferredScrollBehavior(): ScrollBehavior {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}
