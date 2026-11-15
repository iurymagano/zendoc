import Link from 'next/link';
import { PlugZap } from 'lucide-react';
import { BillingButton } from '@/components/billing/BillingButton';
import { buttonVariants } from '@/components/ui/button';
import type { TrialInfo } from '@/lib/dashboard/setup';

/**
 * Alerta forte: sem WhatsApp conectado a secretária não recebe nem responde ninguém.
 * Uma faixa em Void, a superfície mais escura da tela, para ser a primeira coisa que se lê.
 */
export function WhatsAppAlert() {
  return (
    <section
      aria-labelledby="alerta-whatsapp"
      className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-[var(--ia-void)] p-4 text-white sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-field)] bg-white/10 text-[var(--ia-violet)]">
          <PlugZap className="size-[18px]" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-0.5">
          <h2 id="alerta-whatsapp" className="text-[0.9375rem] font-semibold">
            Sua secretária está desligada
          </h2>
          <p className="text-sm leading-relaxed text-white/80">
            Sem o WhatsApp conectado ninguém recebe resposta nem marca horário sozinho. Leva um
            minuto: é só ler o QR Code.
          </p>
        </div>
      </div>
      <Link
        href="/configuracoes/whatsapp"
        className={buttonVariants({ className: 'min-h-11 shrink-0 sm:min-h-10' })}
      >
        Conectar WhatsApp
      </Link>
    </section>
  );
}

/** Teste grátis em andamento: faixa fina com os dias que faltam e o caminho para assinar. */
export function TrialStrip({ trial }: { trial: TrialInfo }) {
  const days = trial.daysLeft;
  const urgent = days <= 2;
  return (
    <section
      aria-label="Seu teste grátis"
      className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[var(--radius-field)] px-4 py-2 ${
        urgent ? 'bg-[var(--warning-soft)]' : 'bg-accent'
      }`}
    >
      <p className={`text-sm font-medium ${urgent ? 'text-[var(--warning)]' : 'text-accent-foreground'}`}>
        <span className="font-display text-base font-bold tabular-nums">{days}</span>{' '}
        {days === 1 ? 'dia' : 'dias'} de teste grátis {days === 1 ? 'restante' : 'restantes'}.
        Assine para a secretária não parar.
      </p>
      <BillingButton
        endpoint="/api/billing/checkout"
        label="Assinar por R$297/mês"
        className="min-h-11 shrink-0 sm:min-h-8"
      />
    </section>
  );
}
