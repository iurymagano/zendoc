import Link from 'next/link';
import { PlugZap } from 'lucide-react';
import { BillingButton } from '@/components/billing/BillingButton';
import { buttonVariants } from '@/components/ui/button';
import type { TrialInfo } from '@/lib/dashboard/setup';

/**
 * Alerta forte: sem WhatsApp conectado a secretária não recebe nem responde ninguém.
 * Fica em Void, a superfície mais escura da tela, para ser a primeira coisa que se lê.
 */
export function WhatsAppAlert() {
  return (
    <section
      aria-labelledby="alerta-whatsapp"
      className="flex flex-col gap-4 rounded-[28px] bg-[var(--ia-void)] p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-[var(--ia-violet)]">
          <PlugZap className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 id="alerta-whatsapp" className="font-display text-xl font-bold tracking-[-0.03em]">
            Sua secretária está desligada
          </h2>
          <p className="text-sm leading-relaxed text-white/80">
            O WhatsApp ainda não está conectado, então ninguém recebe resposta nem consegue
            marcar horário sozinho. Leva um minuto: é só ler o QR Code.
          </p>
        </div>
      </div>
      <Link
        href="/configuracoes/whatsapp"
        className={buttonVariants({ size: 'lg', className: 'min-h-11 shrink-0 rounded-full' })}
      >
        Conectar WhatsApp
      </Link>
    </section>
  );
}

/** Teste grátis em andamento: dias que faltam e o caminho para assinar. */
export function TrialStrip({ trial }: { trial: TrialInfo }) {
  const days = trial.daysLeft;
  const urgent = days <= 2;
  return (
    <section
      aria-label="Seu teste grátis"
      className={`flex flex-col gap-3 rounded-[28px] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
        urgent ? 'bg-[var(--warning-soft)]' : 'bg-accent'
      }`}
    >
      <p className={`text-sm font-medium ${urgent ? 'text-[var(--warning)]' : 'text-accent-foreground'}`}>
        <span className="font-display text-2xl font-bold tracking-[-0.03em] tabular-nums">
          {days}
        </span>{' '}
        {days === 1 ? 'dia' : 'dias'} de teste grátis{' '}
        {days === 1 ? 'restante' : 'restantes'}. Assine para a secretária não parar.
      </p>
      <BillingButton
        endpoint="/api/billing/checkout"
        label="Assinar por R$297/mês"
        className="min-h-11 shrink-0 rounded-full"
      />
    </section>
  );
}
