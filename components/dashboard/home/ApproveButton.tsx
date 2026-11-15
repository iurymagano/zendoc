'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const COPY = {
  approve: { label: 'Aprovar', busy: 'Aprovando…', status: 'scheduled', variant: 'default' },
  confirm: { label: 'Confirmar', busy: 'Confirmando…', status: 'confirmed', variant: 'outline' },
} as const;

/**
 * Ação rápida de um atendimento, usando a mesma API da agenda
 * (`PATCH /api/appointments/[id]`): aprovar um pedido da IA ou confirmar um agendado.
 */
export function ApproveButton({ id, mode }: { id: string; mode: 'approve' | 'confirm' }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[mode];

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: copy.status }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? 'Não foi possível salvar. Tente de novo.');
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError('Sem conexão. Tente de novo.');
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        size="sm"
        variant={copy.variant}
        onClick={run}
        disabled={busy}
        className="min-h-11 sm:min-h-8"
      >
        {busy ? copy.busy : copy.label}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
