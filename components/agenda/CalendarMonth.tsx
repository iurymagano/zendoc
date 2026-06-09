'use client';

import { useMemo } from 'react';
import {
  addDays,
  endOfMonth,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {
  BusyEvent,
  STATUS_BLOCK,
  formatTime,
  groupBusyByDay,
  groupByDay,
} from '@/components/agenda/calendar-utils';
import type { Appointment } from '@/types/database';

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

type Props = {
  monthCursor: Date;
  appointments: Appointment[];
  busy: BusyEvent[];
  onSelectAppointment: (a: Appointment) => void;
  onSelectDay: (dateKey: string) => void;
};

export function CalendarMonth({
  monthCursor,
  appointments,
  busy,
  onSelectAppointment,
  onSelectDay,
}: Props) {
  const cells = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 1 });
    const gridEnd = startOfWeek(endOfMonth(monthCursor), { weekStartsOn: 1 });
    const total = Math.round((+gridEnd - +gridStart) / 86_400_000) + 7;
    return Array.from({ length: total }, (_, i) => addDays(gridStart, i));
  }, [monthCursor]);

  const byDay = useMemo(() => groupByDay(appointments), [appointments]);
  const busyByDay = useMemo(() => groupBusyByDay(busy), [busy]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="px-2 py-2 text-center text-xs font-mono uppercase tracking-[0.12em] text-muted-foreground"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const items = (byDay.get(key) ?? []).sort((a, b) =>
            a.starts_at.localeCompare(b.starts_at),
          );
          const busyItems = busyByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, monthCursor);
          const today = isToday(day);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(key)}
              className={`group flex min-h-[104px] flex-col gap-1 border-b border-r border-border/70 p-1.5 text-left transition-colors hover:bg-accent/40 ${
                inMonth ? '' : 'bg-muted/30 text-muted-foreground'
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  today ? 'bg-primary text-primary-foreground' : ''
                }`}
              >
                {format(day, 'd')}
              </span>
              <div className="flex flex-col gap-0.5">
                {busyItems.slice(0, 1).map((b) => (
                  <span
                    key={b.id}
                    className="truncate rounded px-1 py-0.5 text-[11px] bg-muted text-muted-foreground ring-1 ring-border"
                    title={b.summary ?? 'Compromisso (Google)'}
                  >
                    🔒 {b.summary ?? 'Ocupado'}
                  </span>
                ))}
                {items.slice(0, 3).map((a) => (
                  <span
                    key={a.id}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAppointment(a);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation();
                        onSelectAppointment(a);
                      }
                    }}
                    className={`block truncate rounded px-1 py-0.5 text-[11px] font-medium ${STATUS_BLOCK[a.status]}`}
                    title={`${formatTime(a.starts_at)} ${a.patient_name}`}
                  >
                    {a.recurrence_id ? '🔁 ' : ''}
                    {formatTime(a.starts_at)} {a.patient_name}
                  </span>
                ))}
                {items.length > 3 && (
                  <span className="px-1 text-[11px] text-muted-foreground">
                    +{items.length - 3} mais
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
