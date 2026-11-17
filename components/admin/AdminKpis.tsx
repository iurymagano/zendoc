import { Card } from '@/components/ui/card';
import { MetricCard } from '@/components/layout/MetricCard';
import { SectionHeader } from '@/components/layout/SectionHeader';
import type { AdminKpis as Kpis } from '@/lib/admin/types';
import { PRICE_BRL, formatBRL, formatInt } from './format';

/** Número grande dos dois cards de destaque (pagantes e receita). */
function HeroCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="gap-3 rounded-[var(--radius-card)] px-5 py-5 ring-0 sm:px-6 sm:py-6">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="font-display text-5xl leading-none font-bold tracking-[-0.045em] tabular-nums sm:text-6xl">
        {value}
      </span>
      <span className="text-sm text-muted-foreground">{hint}</span>
    </Card>
  );
}

export function AdminKpis({ kpis }: { kpis: Kpis }) {
  const payingHint =
    kpis.paying === 0
      ? kpis.trialing > 0
        ? `Ainda sem pagantes. ${formatInt(kpis.trialing)} ${kpis.trialing === 1 ? 'conta está' : 'contas estão'} em teste agora.`
        : 'Ainda sem pagantes e sem contas em teste.'
      : `${formatInt(kpis.paying)} de ${formatInt(kpis.professionals)} ${kpis.professionals === 1 ? 'conta com onboarding' : 'contas com onboarding'}`;

  return (
    <section aria-label="Números principais" className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <HeroCard label="Pagantes" value={formatInt(kpis.paying)} hint={payingHint} />
        <HeroCard
          label="Receita mensal estimada"
          value={formatBRL(kpis.mrrCents / 100)}
          hint={`Estimativa: ${formatInt(kpis.paying)} ${kpis.paying === 1 ? 'pagante' : 'pagantes'} × ${formatBRL(PRICE_BRL)} por mês. Não vem do Stripe.`}
        />
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeader title="Contas" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <MetricCard label="Contas criadas" value={formatInt(kpis.accounts)} />
          <MetricCard label="Em teste" value={formatInt(kpis.trialing)} />
          <MetricCard label="Teste vencido" value={formatInt(kpis.trialExpired)} />
          <MetricCard label="Inadimplentes" value={formatInt(kpis.pastDue)} />
          <MetricCard label="Cancelados" value={formatInt(kpis.cancelled)} />
          <MetricCard
            label="WhatsApp conectado"
            value={formatInt(kpis.whatsappConnected)}
            hint={`de ${formatInt(kpis.professionals)} com onboarding`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeader
          title="Usuários ativos"
          description="Quem abriu o painel, contado uma vez por pessoa."
        />
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Hoje" value={formatInt(kpis.activeToday)} />
          <MetricCard label="Em 7 dias" value={formatInt(kpis.active7d)} />
          <MetricCard label="Em 30 dias" value={formatInt(kpis.active30d)} />
        </div>
      </div>
    </section>
  );
}
