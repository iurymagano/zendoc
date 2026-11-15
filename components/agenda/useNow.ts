'use client';

import { useEffect, useState } from 'react';

/**
 * Relógio da agenda: `null` até montar (a primeira renderização é igual no
 * servidor e no cliente) e atualizado a cada 30s para a linha de "agora" andar.
 */
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}
