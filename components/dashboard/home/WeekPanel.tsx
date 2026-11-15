import { formatDuration } from '@/lib/dashboard/summary';
import type { DashboardData } from '@/lib/dashboard/load';
import { EmptyState, Panel } from './Panel';

/** Número grande em Sora com legenda; é o que se lê primeiro em cada métrica. */
function Stat({ value, label, hint }: { value: string | number; label: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-display text-4xl font-bold leading-none tracking-[-0.04em] tabular-nums">
        {value}
      </span>
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

/**
 * A semana em números e um gráfico de ocupação (uma barra por dia: horas ocupadas sobre
 * as horas em que você atende). Só mostra o que tem base: taxa sem atendimentos suficientes
 * vira aviso, e o tempo economizado é sempre uma estimativa com a conta à mostra.
 */
export function WeekPanel({ data }: { data: DashboardData }) {
  const { metrics, occupancy, attendance, timeSaved, newClients } = data;
  const hasCapacity = occupancy.capacityMin > 0;
  // O gráfico é de horas ocupadas (atendimentos e compromissos pessoais), não de contagem.
  const occupiedLabel = (min: number) => (min > 0 ? formatDuration(min).replace(' min', 'm') : '–');
  const chartSummary = `Horas ocupadas por dia: ${occupancy.days
    .map((d) => `${d.weekday} ${d.bookedMin > 0 ? formatDuration(d.bookedMin) : 'nada'}`)
    .join(', ')}.`;

  if (metrics.total === 0 && !hasCapacity && newClients.week === 0) {
    return (
      <Panel label="Semana" title="Sua semana">
        <EmptyState title="Ainda sem números." href="/configuracoes/disponibilidade" cta="Definir horários">
          Depois que você definir seus horários e os primeiros atendimentos entrarem, aqui
            aparecem a ocupação, quantos a IA marcou e o tempo que ela poupou.
        </EmptyState>
      </Panel>
    );
  }

  return (
    <Panel label="Semana" title="Sua semana">
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        <Stat
          value={metrics.total}
          label={metrics.total === 1 ? 'atendimento' : 'atendimentos'}
          hint={metrics.remaining > 0 ? `${metrics.remaining} ainda por vir` : undefined}
        />
        <Stat
          value={metrics.byAi}
          label="marcados pela IA"
          hint={metrics.total > 0 ? `de ${metrics.total} na semana` : undefined}
        />
        <Stat
          value={newClients.week}
          label={newClients.week === 1 ? 'cliente novo' : 'clientes novos'}
          hint={`${newClients.total} no cadastro`}
        />
        {hasCapacity && (
          <Stat
            value={`${occupancy.occupancyPct ?? 0}%`}
            label="do horário ocupado"
            hint={`${formatDuration(occupancy.bookedMin)} de ${formatDuration(occupancy.capacityMin)}`}
          />
        )}
      </div>

      {hasCapacity && (
        <div role="img" aria-label={chartSummary} className="flex flex-col gap-2">
          <div className="grid h-24 grid-cols-7 items-end gap-2">
            {occupancy.days.map((d) => {
              const pct = d.capacityMin > 0 ? Math.min(100, (d.bookedMin / d.capacityMin) * 100) : 0;
              return (
                <div key={d.date} className="relative flex h-full flex-col justify-end rounded-xl bg-secondary">
                  {d.capacityMin === 0 ? (
                    <span className="absolute inset-x-0 bottom-1.5 text-center font-mono text-[10px] text-muted-foreground">
                      –
                    </span>
                  ) : (
                    <div
                      className={`rounded-xl ${d.isToday ? 'bg-primary' : d.isPast ? 'bg-[var(--ia-violet)]/35' : 'bg-[var(--ia-violet)]/70'}`}
                      style={{ height: `${Math.max(pct, d.count > 0 ? 8 : 0)}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 gap-2 text-center font-mono text-[10px] uppercase tracking-wider">
            {occupancy.days.map((d) => (
              <span
                key={d.date}
                className={d.isToday ? 'font-semibold text-[var(--ia-violet-ink)]' : 'text-muted-foreground'}
              >
                {d.weekday}
                <br />
                <span className="tabular-nums">{occupiedLabel(d.bookedMin)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <dl className="flex flex-col gap-3 border-t border-secondary pt-4 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="shrink-0 text-muted-foreground">Comparecimento</dt>
          <dd className="text-right font-medium">
            {attendance.enoughBase && attendance.attendancePct !== null ? (
              <>
                <span className="font-display text-lg font-bold tabular-nums">{attendance.attendancePct}%</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  {attendance.held} atendimentos nos últimos {attendance.days} dias
                  {attendance.cancelPct !== null && `, ${attendance.cancelPct}% cancelados`}
                </span>
              </>
            ) : (
              <span className="text-xs font-normal text-muted-foreground">
                Poucos atendimentos passados para calcular
              </span>
            )}
          </dd>
        </div>
        {timeSaved && (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Tempo poupado</dt>
            <dd className="text-right font-medium">
              <span className="font-display text-lg font-bold tabular-nums">~{timeSaved.label}</span>
              <span className="block text-xs font-normal text-muted-foreground">
                Estimativa: {timeSaved.formula}
              </span>
            </dd>
          </div>
        )}
      </dl>
    </Panel>
  );
}
