'use client';

import { addDays, format, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { groupByDay, tzDateKey } from '@/components/agenda/calendar-utils';
import { useNow } from '@/components/agenda/useNow';
import type { Appointment } from '@/types/database';

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Faixa de 7 dias (segunda a domingo) para trocar o dia no celular. Um ponto
 * marca o dia com atendimentos; o número vem no rótulo para leitor de tela.
 */
export function DayStrip({
  cursor,
  appointments,
  onSelect,
}: {
  cursor: Date;
  appointments: Appointment[];
  onSelect: (day: Date) => void;
}) {
  const now = useNow();
  const todayKey = now ? tzDateKey(now.toISOString()) : null;
  const byDay = groupByDay(appointments.filter((a) => a.status !== 'cancelled'));
  const selectedKey = format(cursor, 'yyyy-MM-dd');
  const days = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(cursor, { weekStartsOn: 1 }), i),
  );

  return (
    <div className="grid grid-cols-7 gap-1" role="group" aria-label="Dias da semana">
      {days.map((day) => {
        const key = format(day, 'yyyy-MM-dd');
        const count = byDay.get(key)?.length ?? 0;
        const selected = key === selectedKey;
        const today = key === todayKey;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(day)}
            aria-pressed={selected}
            aria-label={`${format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}${today ? ' (hoje)' : ''}, ${
              count === 0 ? 'sem atendimentos' : count === 1 ? '1 atendimento' : `${count} atendimentos`
            }`}
            className={cn(
              'flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-2 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-foreground hover:bg-muted',
            )}
          >
            <span
              className={cn(
                'text-[11px] font-medium capitalize',
                !selected && 'text-muted-foreground',
              )}
            >
              {WEEKDAY_SHORT[day.getDay()]}
            </span>
            <span
              className={cn(
                'text-base font-semibold tabular-nums',
                today && !selected && 'text-primary',
              )}
            >
              {format(day, 'd')}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'size-1.5 rounded-full',
                count === 0
                  ? 'bg-transparent'
                  : selected
                    ? 'bg-primary-foreground'
                    : 'bg-primary',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
