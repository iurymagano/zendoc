'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Lock, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  BusyEvent,
  formatTime,
  tzDateKey,
  tzMinutes,
} from '@/components/agenda/calendar-utils';
import { STATUS } from '@/components/appointments/status';
import {
  complementRanges,
  type MinuteRange,
} from '@/components/agenda/agenda-utils';
import { layoutLanes } from '@/components/agenda/time-grid-layout';
import { useNow } from '@/components/agenda/useNow';
import type { Appointment } from '@/types/database';

const HOUR_PX = 56;
const GUTTER_PX = 56;
const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** Largura mínima de uma coluna de dia: abaixo disso a grade rola na horizontal. */
const MIN_COL_PX = 92;
/** Altura (px) a partir da qual o bloco ganha a segunda linha (status e serviço). */
const TWO_LINES_PX = 44;

const HATCH =
  'repeating-linear-gradient(135deg, transparent 0 5px, var(--border) 5px 6px)';

type Props = {
  /** Uma coluna por dia: 7 na semana, 1 no dia. */
  days: Date[];
  appointments: Appointment[];
  busy: BusyEvent[];
  /** Faixas dentro da rotina para o dia; `null` = rotina não cadastrada. */
  availability: (dateKey: string) => MinuteRange[] | null;
  serviceNames: Record<string, string>;
  onSelectAppointment: (a: Appointment) => void;
  onSelectSlot: (dateKey: string, hour: number) => void;
};

function hourLabel(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}

/**
 * Grade de horas compartilhada pelas visões Dia e Semana. Cabeçalho e corpo usam
 * a MESMA definição de colunas (gutter + N dias), então nunca desalinham. O
 * cabeçalho e o gutter ficam fixos na rolagem; abaixo de ~700px a semana rola na
 * horizontal dentro do cartão, sem estourar a página.
 */
export function CalendarTimeGrid({
  days,
  appointments,
  busy,
  availability,
  serviceNames,
  onSelectAppointment,
  onSelectSlot,
}: Props) {
  const now = useNow();
  const todayKey = now ? tzDateKey(now.toISOString()) : null;
  const nowMinutes = now ? tzMinutes(now.toISOString()) : null;

  const keys = useMemo(() => days.map((d) => format(d, 'yyyy-MM-dd')), [days]);

  // Faixa de horas visível: 7h–20h por padrão, ampliada para caber eventos e rotina.
  const [startHour, endHour] = useMemo(() => {
    let min = 7;
    let max = 20;
    const inView = new Set(keys);
    for (const e of appointments) {
      if (!inView.has(tzDateKey(e.starts_at))) continue;
      min = Math.min(min, Math.floor(tzMinutes(e.starts_at) / 60));
      max = Math.max(max, Math.ceil(tzMinutes(e.ends_at) / 60));
    }
    for (const e of busy) {
      if (e.all_day || !inView.has(tzDateKey(e.starts_at))) continue;
      min = Math.min(min, Math.floor(tzMinutes(e.starts_at) / 60));
      max = Math.max(max, Math.ceil(tzMinutes(e.ends_at) / 60));
    }
    for (const key of keys) {
      for (const [s, e] of availability(key) ?? []) {
        min = Math.min(min, Math.floor(s / 60));
        max = Math.max(max, Math.ceil(e / 60));
      }
    }
    return [Math.max(0, min), Math.min(24, Math.max(max, min + 1))];
  }, [appointments, busy, availability, keys]);

  const hours = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
    [startHour, endHour],
  );
  const gridHeight = hours.length * HOUR_PX;
  const fromMin = startHour * 60;
  const toMin = endHour * 60;

  const px = (minutes: number) => ((minutes - fromMin) / 60) * HOUR_PX;

  // Ao abrir (ou trocar de período), rola para o agora ou para o primeiro atendimento.
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollKey = keys.join(',');
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let target = fromMin;
    if (todayKey && nowMinutes !== null && keys.includes(todayKey)) {
      target = nowMinutes - 90;
    } else {
      const first = appointments
        .filter((a) => keys.includes(tzDateKey(a.starts_at)))
        .map((a) => tzMinutes(a.starts_at))
        .sort((a, b) => a - b)[0];
      if (first !== undefined) target = first - 60;
    }
    // Alinha numa hora cheia, com folga para o rótulo não ficar sob o cabeçalho fixo.
    el.scrollTop = Math.max(0, px(Math.floor(target / 60) * 60) - 14);
    // Só quando o período muda: não puxar a rolagem do usuário a cada refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollKey]);

  const columns = `${GUTTER_PX}px repeat(${days.length}, minmax(${
    days.length > 1 ? MIN_COL_PX : 0
  }px, 1fr))`;
  const minWidth = days.length > 1 ? GUTTER_PX + days.length * MIN_COL_PX : undefined;

  return (
    <div
      ref={scrollRef}
      className="relative max-h-[min(46rem,calc(100dvh-15rem))] min-h-[22rem] overflow-auto overscroll-contain rounded-[var(--radius-card)] bg-card"
    >
      <div style={{ minWidth }}>
        {/* Cabeçalho dos dias (fixo no topo) */}
        <div
          className="sticky top-0 z-30 grid border-b border-border bg-card"
          style={{ gridTemplateColumns: columns }}
        >
          <div className="sticky left-0 z-10 bg-card" />
          {days.map((day, i) => {
            const key = keys[i];
            const today = key === todayKey;
            const ranges = availability(key);
            const off = ranges !== null && ranges.length === 0;
            return (
              <div
                key={key}
                className={cn(
                  'flex items-center justify-center gap-2 border-l border-border/60 px-1 py-2',
                  today && 'bg-primary/[0.04]',
                )}
              >
                <span
                  className={cn(
                    'text-xs font-medium capitalize',
                    today ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {/* Semana: abreviado até lg (cabe em 768px); Dia: sempre por extenso. */}
                  <span className={days.length > 1 ? 'lg:hidden' : 'hidden'}>
                    {WEEKDAY_SHORT[days[i].getDay()]}
                  </span>
                  <span className={days.length > 1 ? 'hidden lg:inline' : undefined}>
                    {format(days[i], 'EEEE', { locale: ptBR })}
                  </span>
                </span>
                <span
                  className={cn(
                    'inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-sm font-semibold tabular-nums',
                    today ? 'bg-primary text-primary-foreground' : 'text-foreground',
                    off && !today && 'text-muted-foreground',
                  )}
                  aria-label={
                    format(days[i], "EEEE, dd 'de' MMMM", { locale: ptBR }) +
                    (today ? ' (hoje)' : '') +
                    (off ? ' (sem atendimento)' : '')
                  }
                >
                  {format(days[i], 'd')}
                </span>
              </div>
            );
          })}
        </div>

        {/* Corpo: gutter de horas + colunas dos dias */}
        <div className="grid" style={{ gridTemplateColumns: columns }}>
          <div
            className="sticky left-0 z-20 bg-card"
            style={{ height: gridHeight }}
            aria-hidden="true"
          >
            {hours.map((h, i) => (
              <div
                key={h}
                className={cn(
                  'absolute right-2 font-mono text-[11px] leading-none tabular-nums text-muted-foreground',
                  i > 0 && '-translate-y-1/2',
                )}
                style={{ top: i === 0 ? 4 : i * HOUR_PX }}
              >
                {hourLabel(h)}
              </div>
            ))}
          </div>

          {days.map((day, di) => {
            const key = keys[di];
            const today = key === todayKey;
            const ranges = availability(key);
            const unavailable = ranges ? complementRanges(ranges, fromMin, toMin) : [];
            const dayBusy = busy.filter((b) => !b.all_day && tzDateKey(b.starts_at) === key);
            const dayAppts = layoutLanes(
              appointments
                .filter((a) => tzDateKey(a.starts_at) === key)
                .map((a) => ({
                  a,
                  start: tzMinutes(a.starts_at),
                  end: tzMinutes(a.ends_at),
                })),
            );
            const dayLabel = format(day, "EEE dd/MM", { locale: ptBR });
            return (
              <div
                key={key}
                className={cn(
                  'relative border-l border-border/60',
                  today && 'bg-primary/[0.03]',
                )}
                style={{ height: gridHeight }}
              >
                {/* linhas de hora clicáveis (criar no horário) */}
                {hours.map((h, i) => {
                  const outside = unavailable.some(
                    ([s, e]) => s <= h * 60 && e >= (h + 1) * 60,
                  );
                  return (
                    <button
                      key={h}
                      type="button"
                      tabIndex={-1}
                      onClick={() => onSelectSlot(key, h)}
                      className="absolute inset-x-0 border-t border-border/60 outline-none transition-colors duration-150 hover:bg-primary/[0.06] focus-visible:bg-primary/[0.06]"
                      style={{ top: i * HOUR_PX, height: HOUR_PX }}
                      aria-label={`Criar atendimento ${dayLabel} às ${hourLabel(h)}${outside ? ' (fora da rotina)' : ''}`}
                      title={outside ? 'Fora da rotina de atendimento' : undefined}
                    />
                  );
                })}

                {/* fora da rotina: hachurado, não bloqueia o clique */}
                {unavailable.map(([s, e]) => (
                  <div
                    key={`${s}-${e}`}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bg-muted/30"
                    style={{
                      top: px(s),
                      height: px(e) - px(s),
                      backgroundImage: HATCH,
                    }}
                  />
                ))}

                {/* compromissos pessoais do Google (somente leitura) */}
                {dayBusy.map((b) => {
                  const top = px(tzMinutes(b.starts_at));
                  const h = Math.max(
                    22,
                    px(tzMinutes(b.ends_at)) - top,
                  );
                  return (
                    <div
                      key={b.id}
                      className="pointer-events-none absolute inset-x-0.5 overflow-hidden rounded-md border border-dashed border-border bg-muted/80 px-1.5 py-0.5 text-[11px] leading-tight text-muted-foreground"
                      style={{ top, height: h }}
                      title={b.summary ?? 'Compromisso (Google)'}
                    >
                      <Lock className="mr-1 inline size-3 align-[-2px]" aria-hidden />
                      {b.summary ?? 'Ocupado'}
                    </div>
                  );
                })}

                {/* atendimentos do IAzen */}
                {dayAppts.map(({ a, start, end, lane, lanes }) => {
                  const s = STATUS[a.status];
                  const Icon = s.icon;
                  const top = px(start);
                  const h = Math.max(22, px(end) - top);
                  const roomy = h >= TWO_LINES_PX;
                  const service = a.service_id ? serviceNames[a.service_id] : undefined;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => onSelectAppointment(a)}
                      className={cn(
                        'absolute z-10 overflow-hidden rounded-md py-1 pr-1.5 pl-2.5 text-left text-[11px] leading-tight outline-none transition-[filter] duration-150 focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-ring',
                        s.block,
                      )}
                      style={{
                        top,
                        height: h - 1,
                        left: `calc(${(lane / lanes) * 100}% + 2px)`,
                        width: `calc(${100 / lanes}% - 4px)`,
                      }}
                      title={`${formatTime(a.starts_at)}–${formatTime(a.ends_at)} ${a.patient_name} · ${s.label}`}
                      aria-label={`${formatTime(a.starts_at)}, ${a.patient_name}, ${s.label}${service ? `, ${service}` : ''}${a.recurrence_id ? ', série' : ''}`}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 w-[3px] bg-current"
                      />
                      <span className="flex min-w-0 items-center gap-1">
                        {!roomy && <Icon aria-hidden="true" className="size-3 shrink-0" />}
                        <span className="shrink-0 font-mono font-medium tabular-nums">
                          {formatTime(a.starts_at)}
                        </span>
                        <span className="truncate font-semibold">{a.patient_name}</span>
                        {a.recurrence_id && (
                          <Repeat className="size-3 shrink-0" aria-hidden="true" />
                        )}
                      </span>
                      {roomy && (
                        <span className="mt-0.5 flex min-w-0 items-center gap-1">
                          <Icon aria-hidden="true" className="size-3 shrink-0" />
                          <span className="truncate">
                            {s.label}
                            {service ? ` · ${service}` : ''}
                          </span>
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* agora: linha violeta; só o ponto leva a cor Faísca */}
                {today && nowMinutes !== null && nowMinutes >= fromMin && nowMinutes <= toMin && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-20 h-0.5 -translate-y-1/2 bg-primary"
                    style={{ top: px(nowMinutes) }}
                    role="presentation"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute top-1/2 -left-1 size-2.5 -translate-y-1/2 rounded-full bg-spark ring-2 ring-card"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
