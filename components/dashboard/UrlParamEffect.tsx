'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Reage a um parâmetro da URL (ex.: `?date=2026-11-18`) chamando `onChange`
 * quando ele aparece ou muda. Serve aos links das notificações, que abrem a
 * agenda num dia ou a caixa de conversas num contato mesmo com a página já
 * aberta. O parâmetro `n` (id da notificação) conta como mudança: clicar na
 * mesma notificação de novo dispara de novo.
 *
 * Não renderiza nada. Precisa estar dentro de um `<Suspense>` (useSearchParams).
 */
export function UrlParamEffect({
  name,
  onChange,
}: {
  name: string;
  onChange: (value: string) => void;
}) {
  const params = useSearchParams();
  const value = params.get(name);
  const nonce = params.get('n');

  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (value) latest.current(value);
  }, [value, nonce]);

  return null;
}
