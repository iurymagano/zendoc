'use client';

import { useMemo } from 'react';
import { Lock, Repeat } from 'lucide-react';
import {
  addDays,
  endOfMonth,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { cn } from '@/lib/utils';
import {
  BusyEvent,
  formatTime,
  groupBusyByDay,
  groupByDay,
  tzDateKey,
} from '@/components/agenda/calendar-utils';
import { STATUS } from '@/components/appointments/status';
import { useMediaQuery } from '@/components/agenda/useMediaQuery';
import { useNow } from '@/components/agenda/useNow';
import type { Appointment } from '@/types/database';

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

type Props = {
  monthCursor: Date;
  appointments: Appointment[];
  busy: BusyEvent[];
  onSelectAppointment: (a: Appointment) => void;
  /** Clique no vazio da célula: criar atendimento nesse dia. */
  onSelectDay: (dateKey: string) => void;
  /** Número do dia ou "+N": abrir a visão Dia. */
  onOpenDay: (dateKey: string) => void;
};

type Chip =
  | { kind: 'busy'; id: string; busy: BusyEvent }
  | { kind: 'appt'; id: string; appt: Appointment };

/**
 * Grade do mês (segunda a domingo). Colunas `minmax(0,1fr)` e `min-w-0` em toda a
 * cadeia: o chip trunca dentro da célula e nunca vaza. Quando não cabe, vira "+N".
 * O clique no vazio cria; o número do dia e o "+N" abrem a visão Dia.
 */
export function CalendarMonth({
  monthCursor,
  appointments,
  busy,
  onSelectAppointment,
  onSelectDay,
  onOpenDay,
}: Props) {
  const wide = useMediaQuery('(min-width: 640px)', true);
  const maxChips = wide ? 3 : 2;
  const now = useNow();
  const todayKey = now ? tzDateKey(now.toISOString()) : null;

  const cells = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 1 });
    const gridEnd = startOfWeek(endOfMonth(monthCursor), { weekStartsOn: 1 });
    const total = Math.round((+gridEnd - +gridStart) / 86_400_000) + 7;
    return Array.from({ length: total }, (_, i) => addDays(gridStart, i));
  }, [monthCursor]);

  const byDay = useMemo(() => groupByDay(appointments), [appointments]);
  const busyByDay = useMemo(() => groupBusyByDay(busy), [busy]);

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] bg-card">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="px-1 py-2.5 text-center text-xs font-medium text-muted-foreground"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const items = [...(byDay.get(key) ?? [])].sort((a, b) =>
            a.starts_at.localeCompare(b.starts_at),
          );
          const busyItems = busyByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, monthCursor);
          const today = key === todayKey;

          const chips: Chip[] = [
            ...busyItems.slice(0, 1).map((b): Chip => ({ kind: 'busy', id: b.id, busy: b })),
            ...items.map((a): Chip => ({ kind: 'appt', id: a.id, appt: a })),
          ];
          const total = busyItems.length > 1 ? chips.length + busyItems.length - 1 : chips.length;
          // Se vai sobrar, o "+N" ocupa a última linha.
          const overflow = total > maxChips;
          const shown = overflow ? chips.slice(0, maxChips - 1) : chips;
          const hidden = total - shown.length;
          const dayLabel = format(day, 'dd/MM/yyyy');

          return (
            <div
              key={key}
              className={cn(
                'group relative flex min-h-[92px] min-w-0 flex-col gap-1 overflow-hidden border-b border-l border-border/60 p-1 sm:min-h-[120px] sm:p-1.5',
                !inMonth && 'bg-surface-2',
                '[&:nth-child(7n+1)]:border-l-0',
                today && 'bg-primary/[0.04]',
              )}
            >
              <button
                type="button"
                onClick={() => onSelectDay(key)}
                aria-label={`Criar atendimento em ${dayLabel}`}
                className="absolute inset-0 outline-none transition-colors duration-150 hover:bg-primary/[0.05] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={() => onOpenDay(key)}
                aria-label={`Ver o dia ${dayLabel}`}
                className={cn(
                  'relative inline-flex size-6 shrink-0 items-center justify-center self-start rounded-full text-xs font-semibold tabular-nums outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                  today && 'bg-primary text-primary-foreground hover:bg-primary',
                  !today && !inMonth && 'text-muted-foreground',
                )}
              >
                {format(day, 'd')}
              </button>
              <div className="pointer-events-none relative flex min-w-0 flex-col gap-0.5">
                {shown.map((c) => {
                  if (c.kind === 'busy') {
                    return (
                      <span
                        key={c.id}
                        className="flex min-w-0 items-center gap-1 rounded-md border border-dashed border-border bg-muted/80 px-1 py-0.5 text-[11px] leading-tight text-muted-foreground"
                        title={c.busy.summary ?? 'Compromisso (Google)'}
                      >
                        <Lock className="size-3 shrink-0" aria-hidden />
                        <span className="hidden truncate sm:inline">
                          {c.busy.summary ?? 'Ocupado'}
                        </span>
                        <span className="sr-only">{c.busy.summary ?? 'Ocupado'} (Google)</span>
                      </span>
                    );
                  }
                  const a = c.appt;
                  const s = STATUS[a.status];
                  const Icon = s.icon;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onSelectAppointment(a)}
                      className={cn(
                        'pointer-events-auto flex min-w-0 items-center justify-center gap-1 overflow-hidden rounded-md px-1 py-0.5 sm:justify-start text-left text-[11px] leading-tight outline-none transition-[filter] duration-150 focus-visible:ring-2 focus-visible:ring-ring',
                        s.block,
                      )}
                      title={`${formatTime(a.starts_at)} ${a.patient_name} · ${s.label}`}
                      aria-label={`${formatTime(a.starts_at)}, ${a.patient_name}, ${s.label}${a.recurrence_id ? ', série' : ''}`}
                    >
                      <Icon className="size-3 shrink-0" aria-hidden />
                      <span className="hidden shrink-0 font-mono font-medium tabular-nums sm:inline">
                        {formatTime(a.starts_at)}
                      </span>
                      <span className="hidden min-w-0 truncate font-semibold sm:inline">
                        {a.patient_name}
                      </span>
                      {a.recurrence_id && (
                        <Repeat className="hidden size-3 shrink-0 sm:inline" aria-hidden />
                      )}
                    </button>
                  );
                })}
                {hidden > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenDay(key)}
                    className="pointer-events-auto self-start rounded-md bg-secondary px-1.5 py-0.5 text-xs font-bold leading-tight text-foreground outline-none transition-colors duration-150 hover:bg-[var(--ia-violet-ink)] hover:text-white focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Mais ${hidden} neste dia: ver o dia ${dayLabel}`}
                  >
                    +{hidden}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
