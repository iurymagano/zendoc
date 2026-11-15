import Link from 'next/link';
import type { DashboardData } from '@/lib/dashboard/load';
import { formatTime } from '@/lib/assistant/datetime';
import { DayRulerView } from './DayRuler';
import { Panel } from './Panel';

/** "Seu dia": o que está acontecendo agora (ou o próximo) e a régua do expediente. */
export function TodayPanel({ data }: { data: DashboardData }) {
  const { today, ruler, now, serviceNames } = data;
  const focus = today.current ?? today.next;
  const rulerSummary = `Régua do dia: ${today.items.length} ${today.items.length === 1 ? 'compromisso' : 'compromissos'} hoje.`;

  return (
    <Panel title="Seu dia">
      {focus ? (
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
          <span className="text-muted-foreground">{today.current ? 'Agora' : 'Próximo'}</span>
          <span className="font-mono text-base font-medium tabular-nums">{formatTime(focus.starts_at)}</span>
          <span className="font-medium">{focus.patient_name}</span>
          {focus.service_id && serviceNames[focus.service_id] && (
            <span className="text-muted-foreground">{serviceNames[focus.service_id]}</span>
          )}
        </p>
      ) : (
        <p className="text-sm">
          {today.clientCount > 0
            ? 'Nada mais por hoje.'
            : ruler
              ? 'Agenda de hoje vazia.'
              : 'Hoje não é um dia de atendimento na sua rotina.'}
          {!ruler && (
            <>
              {' '}
              <Link
                href="/configuracoes/disponibilidade"
                className="font-medium text-[var(--ia-violet-ink)] underline underline-offset-4"
              >
                Ajustar horários
              </Link>
            </>
          )}
        </p>
      )}
      {ruler && <DayRulerView ruler={ruler} items={today.items} now={now} summary={rulerSummary} />}
    </Panel>
  );
}
