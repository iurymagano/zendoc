'use client';

import { useMemo } from 'react';
import { addDays, format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BusyEvent,
  STATUS_BLOCK,
  formatTime,
  tzDateKey,
  tzMinutes,
} from '@/components/agenda/calendar-utils';
import type { Appointment } from '@/types/database';

const HOUR_PX = 48;

type Props = {
  weekStart: Date;
  appointments: Appointment[];
  busy: BusyEvent[];
  onSelectAppointment: (a: Appointment) => void;
  onSelectSlot: (dateKey: string, hour: number) => void;
};

export function CalendarWeek({
  weekStart,
  appointments,
  busy,
  onSelectAppointment,
  onSelectSlot,
}: Props) {
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  // Faixa de horas visível: 7h–20h por padrão, expandida para caber os eventos.
  const [startHour, endHour] = useMemo(() => {
    let min = 7;
    let max = 20;
    const timed = [...appointments, ...busy].filter(
      (e) => !('all_day' in e) || !e.all_day,
    );
    for (const e of timed) {
      min = Math.min(min, Math.floor(tzMinutes(e.starts_at) / 60));
      max = Math.max(max, Math.ceil(tzMinutes(e.ends_at) / 60));
    }
    return [Math.max(0, min), Math.min(24, Math.max(max, min + 1))];
  }, [appointments, busy]);

  const hours = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
    [startHour, endHour],
  );
  const gridHeight = (endHour - startHour) * HOUR_PX;

  function topFor(iso: string): number {
    return ((tzMinutes(iso) - startHour * 60) / 60) * HOUR_PX;
  }
  function heightFor(start: string, end: string): number {
    const h = ((tzMinutes(end) - tzMinutes(start)) / 60) * HOUR_PX;
    return Math.max(18, h);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Cabeçalho dos dias */}
      <div className="grid border-b border-border" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
        <div className="border-r border-border" />
        {days.map((day) => {
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={`border-r border-border px-2 py-2 text-center ${today ? 'bg-primary/5' : ''}`}
            >
              <div className="text-xs font-mono uppercase tracking-[0.1em] text-muted-foreground">
                {format(day, 'EEE', { locale: ptBR })}
              </div>
              <div
                className={`mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-sm font-medium ${
                  today ? 'bg-primary text-primary-foreground' : ''
                }`}
              >
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Corpo: gutter de horas + 7 colunas */}
      <div className="grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
        {/* gutter */}
        <div className="relative border-r border-border" style={{ height: gridHeight }}>
          {hours.map((h, i) => (
            <div
              key={h}
              className="absolute right-1 -translate-y-1/2 text-[11px] tabular-nums text-muted-foreground"
              style={{ top: i * HOUR_PX }}
            >
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayAppts = appointments.filter((a) => tzDateKey(a.starts_at) === key);
          const dayBusy = busy.filter((b) => tzDateKey(b.starts_at) === key);
          return (
            <div
              key={key}
              className="relative border-r border-border"
              style={{ height: gridHeight }}
            >
              {/* linhas de hora clicáveis (criar no slot) */}
              {hours.map((h, i) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => onSelectSlot(key, h)}
                  className="absolute left-0 right-0 border-b border-border/50 hover:bg-accent/30"
                  style={{ top: i * HOUR_PX, height: HOUR_PX }}
                  aria-label={`Criar às ${h}:00`}
                />
              ))}

              {/* compromissos pessoais do Google (read-only) */}
              {dayBusy
                .filter((b) => !b.all_day)
                .map((b) => (
                  <div
                    key={b.id}
                    className="absolute left-0.5 right-0.5 overflow-hidden rounded border border-dashed border-border bg-muted/70 px-1 py-0.5 text-[10px] text-muted-foreground"
                    style={{ top: topFor(b.starts_at), height: heightFor(b.starts_at, b.ends_at) }}
                    title={b.summary ?? 'Compromisso (Google)'}
                  >
                    🔒 {b.summary ?? 'Ocupado'}
                  </div>
                ))}

              {/* agendamentos do IAzen (clicáveis) */}
              {dayAppts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onSelectAppointment(a)}
                  className={`absolute left-0.5 right-0.5 overflow-hidden rounded px-1 py-0.5 text-left text-[11px] font-medium ${STATUS_BLOCK[a.status]}`}
                  style={{ top: topFor(a.starts_at), height: heightFor(a.starts_at, a.ends_at) }}
                  title={`${formatTime(a.starts_at)}–${formatTime(a.ends_at)} ${a.patient_name}`}
                >
                  <span className="block truncate tabular-nums">
                    {a.recurrence_id ? '🔁 ' : ''}
                    {formatTime(a.starts_at)} {a.patient_name}
                  </span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
