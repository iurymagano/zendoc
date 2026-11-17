import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/layout/SectionHeader';
import type { AdminFunnel as Funnel } from '@/lib/admin/types';
import { formatInt, passRate } from './format';

interface Stage {
  label: string;
  value: number;
  /** Texto da taxa de passagem (já calculada) ou nota quando não há base. */
  note: string | null;
  top?: boolean;
}

function buildStages(f: Funnel): Stage[] {
  return [
    { label: 'Visitas à landing', value: f.landingVisits, note: 'Topo do funil', top: true },
    {
      label: 'Visitas ao cadastro',
      value: f.registerVisits,
      note: describe(passRate(f.landingVisits, f.registerVisits), 'quem viu a landing'),
    },
    {
      label: 'Contas criadas',
      value: f.signups,
      note: describe(passRate(f.registerVisits, f.signups), 'quem viu o cadastro'),
    },
    {
      label: 'Onboarding concluído',
      value: f.onboarded,
      note: describe(passRate(f.signups, f.onboarded), 'quem criou conta'),
    },
    {
      label: 'WhatsApp conectado',
      value: f.whatsappConnected,
      note: describe(passRate(f.onboarded, f.whatsappConnected), 'quem concluiu o onboarding'),
    },
    {
      label: 'Pagantes',
      value: f.paying,
      note: describe(passRate(f.onboarded, f.paying), 'quem concluiu o onboarding'),
    },
  ];
}

function describe(rate: number | null, of: string): string | null {
  return rate === null ? null : `${rate}% de ${of}`;
}

export function AdminFunnel({ funnel }: { funnel: Funnel }) {
  const stages = buildStages(funnel);
  const max = Math.max(...stages.map((s) => s.value), 0);
  const visitToAccount = passRate(funnel.landingVisits, funnel.signups);

  return (
    <Card className="gap-5 rounded-[var(--radius-card)] px-5 py-5 ring-0 sm:px-6">
      <SectionHeader
        title="Funil dos últimos 30 dias"
        description={
          visitToAccount === null
            ? 'Ainda não há visitas registradas para calcular a conversão.'
            : `${visitToAccount}% de quem visitou a landing criou uma conta.`
        }
      />
      <ol className="flex flex-col gap-5 sm:gap-4">
        {stages.map((stage) => {
          const width = max > 0 ? (stage.value / max) * 100 : 0;
          return (
            <li
              key={stage.label}
              className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 sm:grid-cols-[17rem_1fr_4.5rem] sm:items-center sm:gap-x-5"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{stage.label}</span>
                {stage.note && <span className="text-xs text-muted-foreground">{stage.note}</span>}
              </div>
              <span className="font-display text-xl leading-none font-bold tracking-[-0.03em] tabular-nums sm:order-3 sm:text-right">
                {formatInt(stage.value)}
              </span>
              <div
                role="img"
                aria-label={`${stage.label}: ${formatInt(stage.value)}`}
                className="col-span-2 h-3 rounded-full bg-muted sm:order-2 sm:col-span-1"
              >
                <div
                  className="h-full rounded-full bg-[var(--ia-violet-action)]"
                  style={{ width: `${width}%` }}
                />
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted-foreground">
        WhatsApp conectado e pagantes contam só quem concluiu o onboarding nos últimos 30 dias.
      </p>
    </Card>
  );
}
