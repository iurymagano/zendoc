import Link from 'next/link';
import { CalendarPlus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import type { DashboardData } from '@/lib/dashboard/load';
import { greeting } from '@/lib/dashboard/setup';
import { formatLongBrDate, formatTime } from '@/lib/assistant/datetime';
import { DayRulerView } from './DayRuler';
import { SectionLabel } from './Panel';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function summaryLine(d: DashboardData): string {
  const { today } = d;
  if (today.clientCount === 0 && today.personalCount === 0) {
    return 'Nenhum atendimento marcado para hoje. Dia livre para respirar, ou para a IA encher a agenda.';
  }
  const parts: string[] = [];
  if (today.clientCount > 0) {
    parts.push(plural(today.clientCount, 'atendimento', 'atendimentos'));
  }
  if (today.personalCount > 0) {
    parts.push(plural(today.personalCount, 'compromisso pessoal', 'compromissos pessoais'));
  }
  const left = today.clientCount - today.doneCount;
  const tail =
    today.clientCount > 0
      ? today.doneCount === today.clientCount
        ? 'Todos já foram feitos.'
        : today.doneCount > 0
          ? `${today.doneCount} já ${today.doneCount === 1 ? 'foi feito' : 'foram feitos'}, ${left} ${left === 1 ? 'falta' : 'faltam'}.`
          : ''
      : '';
  return `Hoje: ${parts.join(' e ')}. ${tail}`.trim();
}

/** Saudação, o resumo do dia, a régua do dia e o que vem agora. */
export function Hero({ data, firstName }: { data: DashboardData; firstName: string }) {
  const { today, ruler, now, serviceNames } = data;
  const focus = today.current ?? today.next;
  const focusIsNow = !!today.current;
  const rulerSummary = `Régua do dia: ${today.items.length} ${today.items.length === 1 ? 'compromisso' : 'compromissos'} hoje.`;

  return (
    <section
      aria-labelledby="titulo-hoje"
      className="flex flex-col gap-6 rounded-[32px] bg-card p-5 sm:p-8"
    >
      <div className="flex flex-col gap-2">
        <SectionLabel>Hoje · {formatLongBrDate(now).split(',')[0]}</SectionLabel>
        <h1
          id="titulo-hoje"
          className="font-display text-3xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-5xl"
        >
          {greeting(now)}, {firstName}
        </h1>
        <p className="max-w-xl text-base leading-relaxed">{summaryLine(data)}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[auto_1fr] lg:items-end lg:gap-8">
        <div className="flex items-end gap-3">
          <span className="font-display text-7xl font-bold leading-[0.85] tracking-[-0.05em] tabular-nums sm:text-8xl">
            {today.clientCount}
          </span>
          <span className="pb-1 text-sm font-medium leading-tight text-muted-foreground">
            {today.clientCount === 1 ? 'atendimento' : 'atendimentos'}
            <br />
            hoje
          </span>
        </div>

        {focus ? (
          <div className="flex flex-col gap-1 rounded-2xl bg-background px-4 py-3">
            <SectionLabel>{focusIsNow ? 'Agora' : 'Próximo'}</SectionLabel>
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="font-mono text-lg font-medium tabular-nums">
                {formatTime(focus.starts_at)}
              </span>
              <span className="font-medium">
                {focus.patient_name}
              </span>
              {focus.service_id && serviceNames[focus.service_id] && (
                <span className="text-sm text-muted-foreground">{serviceNames[focus.service_id]}</span>
              )}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              {today.clientCount > 0 ? 'Nada mais por hoje.' : 'Agenda de hoje vazia.'}
            </p>
            <Link
              href="/agenda"
              className={buttonVariants({ variant: 'outline', size: 'sm', className: 'min-h-11 sm:min-h-8' })}
            >
              <CalendarPlus className="size-4" aria-hidden="true" />
              Marcar um atendimento
            </Link>
          </div>
        )}
      </div>

      {ruler ? (
        <DayRulerView ruler={ruler} items={today.items} now={now} summary={rulerSummary} />
      ) : (
        <p className="rounded-2xl bg-background px-4 py-3 text-sm text-muted-foreground">
          Hoje não é um dia de atendimento na sua rotina.{' '}
          <Link href="/configuracoes/disponibilidade" className="font-medium text-[var(--ia-violet-ink)] underline underline-offset-4">
            Ajustar horários
          </Link>
        </p>
      )}
    </section>
  );
}
