import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/layout/SectionHeader';
import type { AdminUsage as Usage } from '@/lib/admin/types';
import { cn } from '@/lib/utils';
import { formatInt, passRate } from './format';

interface Segment {
  label: string;
  value: number;
  /** Classe de fundo da barra e do marcador da legenda. */
  color: string;
}

/**
 * Barra dividida em dois segmentos com folga de 2px, sempre acompanhada de legenda com
 * o número (a cor nunca é a única pista). Sem dado, mostra só a trilha.
 */
function SplitBar({ segments, emptyText }: { segments: Segment[]; emptyText: string }) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  return (
    <div className="flex flex-col gap-3">
      <div
        role="img"
        aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(', ')}
        className="flex h-3 gap-[2px] overflow-hidden rounded-full bg-muted"
      >
        {segments.map((s) =>
          s.value > 0 ? (
            <div
              key={s.label}
              className={cn('h-full first:rounded-l-full last:rounded-r-full', s.color)}
              style={{ flexGrow: s.value, flexBasis: 0 }}
            />
          ) : null,
        )}
      </div>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {segments.map((s) => (
            <li key={s.label} className="flex items-center gap-2 text-sm">
              <span aria-hidden="true" className={cn('size-2.5 shrink-0 rounded-[3px]', s.color)} />
              <span className="flex-1 text-foreground">{s.label}</span>
              <span className="font-semibold text-foreground tabular-nums">{formatInt(s.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UsageCard({
  title,
  total,
  totalLabel,
  children,
  footer,
}: {
  title: string;
  total?: number;
  totalLabel?: string;
  children: React.ReactNode;
  footer?: string;
}) {
  return (
    <Card className="gap-4 rounded-[var(--radius-card)] px-5 py-5 ring-0">
      <div className="flex flex-col gap-1">
        <h3 className="text-[0.9375rem] leading-snug font-semibold text-foreground">{title}</h3>
        {total !== undefined && (
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl leading-none font-bold tracking-[-0.04em] tabular-nums">
              {formatInt(total)}
            </span>
            <span className="text-sm text-muted-foreground">{totalLabel}</span>
          </div>
        )}
      </div>
      {children}
      {footer && <p className="mt-auto text-sm text-muted-foreground">{footer}</p>}
    </Card>
  );
}

export function AdminUsage({ usage }: { usage: Usage }) {
  const appointments7d = usage.appointmentsByAi7d + usage.appointmentsManual7d;
  const reminders7d = usage.remindersSent7d + usage.remindersFailed7d;
  const failRate = passRate(reminders7d, usage.remindersFailed7d);

  return (
    <section aria-label="Uso do produto" className="flex flex-col gap-3">
      <SectionHeader
        title="Uso do produto nos últimos 7 dias"
        description="O que as contas fizeram no IAzen, somando todos os usuários."
      />
      <div className="grid gap-3 md:grid-cols-3 md:gap-4">
        <UsageCard
          title="Atendimentos criados"
          total={appointments7d}
          totalLabel="em 7 dias"
          footer={`${formatInt(usage.appointments30d)} ${usage.appointments30d === 1 ? 'atendimento' : 'atendimentos'} em 30 dias.`}
        >
          <SplitBar
            emptyText="Nenhum atendimento criado nos últimos 7 dias."
            segments={[
              { label: 'Pela secretária IA', value: usage.appointmentsByAi7d, color: 'bg-[var(--ia-violet-action)]' },
              { label: 'Manuais', value: usage.appointmentsManual7d, color: 'bg-muted-foreground' },
            ]}
          />
        </UsageCard>

        <UsageCard
          title="Mensagens"
          total={usage.whatsappMessages7d + usage.assistantMessages7d}
          totalLabel="em 7 dias"
        >
          <ul className="flex flex-col gap-1.5">
            <li className="flex items-center gap-2 text-sm">
              <span className="flex-1 text-foreground">De clientes no WhatsApp</span>
              <span className="font-semibold text-foreground tabular-nums">{formatInt(usage.whatsappMessages7d)}</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <span className="flex-1 text-foreground">Dos donos no Assistente</span>
              <span className="font-semibold text-foreground tabular-nums">{formatInt(usage.assistantMessages7d)}</span>
            </li>
          </ul>
        </UsageCard>

        <UsageCard
          title="Lembretes para clientes"
          total={reminders7d}
          totalLabel="em 7 dias"
          footer={
            failRate === null
              ? undefined
              : failRate === 0
                ? 'Nenhuma falha de envio.'
                : `${failRate}% dos lembretes não saíram.`
          }
        >
          <SplitBar
            emptyText="Nenhum lembrete enviado nos últimos 7 dias."
            segments={[
              { label: 'Enviados', value: usage.remindersSent7d, color: 'bg-status-confirmed' },
              { label: 'Falharam', value: usage.remindersFailed7d, color: 'bg-destructive' },
            ]}
          />
        </UsageCard>
      </div>
    </section>
  );
}
