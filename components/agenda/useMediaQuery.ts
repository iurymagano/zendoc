'use client';

import { useSyncExternalStore } from 'react';

/**
 * `true` quando a media query bate. No servidor (e na hidratação) devolve
 * `fallback`, para a primeira renderização ser igual nos dois lados.
 */
export function useMediaQuery(query: string, fallback = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}
