'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  endpoint: '/api/billing/checkout' | '/api/billing/portal';
  label: string;
  variant?: 'default' | 'outline';
  className?: string;
};

/**
 * Dispara o checkout ou o portal do Stripe: faz POST no endpoint e redireciona
 * o navegador para a URL hospedada que o Stripe devolve.
 */
export function BillingButton({ endpoint, label, variant = 'default', className }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      const body = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !body.url) {
        setError(body.error ?? 'Não foi possível abrir o pagamento.');
        setLoading(false);
        return;
      }
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button onClick={go} disabled={loading} variant={variant}>
        {loading ? 'Abrindo…' : label}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
