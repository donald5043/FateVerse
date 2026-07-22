import { useEffect } from 'react';

export function useRouteScrollReset(pathname: string): void {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);
}
