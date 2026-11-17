'use client';

import { useEffect } from 'react';

// Conta a visita à página pública (POST /api/track/visit), uma vez por sessão do
// navegador por caminho. Não renderiza nada e nunca quebra a página: sessionStorage
// e rede ficam em try/catch.
export function VisitBeacon({ path }: { path: string }) {
  useEffect(() => {
    const key = `iazen:visit:${path}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // sessionStorage indisponível (modo privado, bloqueio): conta mesmo assim.
    }
    try {
      const body = JSON.stringify({ path });
      const sent =
        typeof navigator !== 'undefined' &&
        typeof navigator.sendBeacon === 'function' &&
        navigator.sendBeacon('/api/track/visit', new Blob([body], { type: 'application/json' }));
      if (!sent) {
        void fetch('/api/track/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // contagem é só estatística: ignorar qualquer falha.
    }
  }, [path]);

  return null;
}
