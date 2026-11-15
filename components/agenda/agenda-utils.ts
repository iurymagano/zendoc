import { addDays, endOfMonth, format, startOfMonth, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TZ } from '@/components/agenda/calendar-utils';
import type { AvailabilityException, AvailabilityWeekly } from '@/types/database';

export const DEFAULT_DURATION_MIN = 50;

export type View = 'day' | 'week' | 'month';
export type Repeat = 'none' | 'weekly' | 'biweekly';

// base-ui Select usa `items` p/ mapear value → rótulo exibido no gatilho.
export const REPEAT_ITEMS: Record<Repeat, string> = {
  none: 'Não repete',
  weekly: 'Toda semana',
  biweekly: 'A cada 2 semanas',
};

export type FormState = {
  patient_name: string;
  patient_phone: string;
  patient_cpf: string;
  starts_local: string;
  ends_local: string;
  notes: string;
  repeat: Repeat;
  until: string;
  service_id: string; // '' = nenhum
};

export const EMPTY_FORM: FormState = {
  patient_name: '',
  patient_phone: '',
  patient_cpf: '',
  starts_local: '',
  ends_local: '',
  notes: '',
  repeat: 'none',
  until: '',
  service_id: '',
};

export function localToISO(local: string): string {
  return `${local}:00-03:00`;
}

export function isoToLocal(iso: string): string {
  const formatted = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
  return formatted.replace(' ', 'T');
}

export function addMinutesToLocal(local: string, minutes: number): string {
  if (!local) return '';
  const d = new Date(localToISO(local));
  d.setMinutes(d.getMinutes() + minutes);
  return isoToLocal(d.toISOString());
}

/**
 * Janela buscada em GET /api/appointments. Dia e semana usam a mesma janela
 * (a semana do cursor), então trocar de dia dentro da semana não refaz a busca.
 */
export function rangeFor(view: View, cursor: Date): { from: Date; to: Date } {
  if (view === 'month') {
    const from = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const gridEnd = startOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return { from, to: addDays(gridEnd, 7) };
  }
  const from = startOfWeek(cursor, { weekStartsOn: 1 });
  return { from, to: addDays(from, 7) };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Rótulo do período mostrado na barra (ex.: "09 – 15 de novembro de 2026"). */
export function periodLabel(view: View, cursor: Date): string {
  if (view === 'day') {
    return capitalize(format(cursor, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }));
  }
  if (view === 'week') {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    const end = addDays(start, 6);
    return start.getMonth() === end.getMonth()
      ? `${format(start, 'dd')} – ${format(end, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
      : `${format(start, "dd 'de' MMM", { locale: ptBR })} – ${format(end, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}`;
  }
  return capitalize(format(cursor, "MMMM 'de' yyyy", { locale: ptBR }));
}

// ---------------------------------------------------------------------------
// Disponibilidade (só leitura): usada para hachurar o que está fora da rotina.
// ---------------------------------------------------------------------------

/** Faixa [início, fim] em minutos desde a meia-noite. */
export type MinuteRange = [number, number];

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * Monta a função que diz, para um dia (yyyy-MM-dd), quais faixas estão dentro da
 * rotina. Mesma regra de lib/availability: exceção manda sobre a rotina semanal
 * e `lunch` nunca é oferecido. Devolve `null` quando não há rotina cadastrada
 * (nada a hachurar: não dá para saber o que está "fora").
 */
export function buildAvailability(
  weekly: AvailabilityWeekly[],
  exceptions: AvailabilityException[],
): (dateKey: string) => MinuteRange[] | null {
  const active = weekly.filter((b) => b.is_active && b.block_type !== 'lunch');
  const byDate = new Map(exceptions.map((e) => [e.date, e]));
  return (dateKey) => {
    const ex = byDate.get(dateKey);
    if (ex) {
      if (ex.type === 'day_off') return [];
      if (ex.start_time && ex.end_time) {
        return [[toMinutes(ex.start_time), toMinutes(ex.end_time)]];
      }
    }
    if (weekly.length === 0) return null;
    const [y, m, d] = dateKey.split('-').map(Number);
    const weekday = new Date(y, m - 1, d).getDay();
    return active
      .filter((b) => b.weekday === weekday)
      .map((b): MinuteRange => [toMinutes(b.start_time), toMinutes(b.end_time)])
      .sort((a, b) => a[0] - b[0]);
  };
}

/**
 * Menor início e maior fim (em minutos) da rotina semanal INTEIRA (todos os dias
 * ativos, sem o almoço). A grade usa isso para a faixa de horas não mudar de uma
 * semana para outra; `null` quando a rotina não está cadastrada.
 */
export function routineBounds(weekly: AvailabilityWeekly[]): MinuteRange | null {
  const active = weekly.filter((b) => b.is_active && b.block_type !== 'lunch');
  if (active.length === 0) return null;
  return [
    Math.min(...active.map((b) => toMinutes(b.start_time))),
    Math.max(...active.map((b) => toMinutes(b.end_time))),
  ];
}

/** Faixas de [from, to] que NÃO estão cobertas por `ranges` (o fora da rotina). */
export function complementRanges(
  ranges: MinuteRange[],
  from: number,
  to: number,
): MinuteRange[] {
  const out: MinuteRange[] = [];
  let cursor = from;
  for (const [s, e] of ranges) {
    if (e <= cursor) continue;
    if (s >= to) break;
    if (s > cursor) out.push([cursor, Math.min(s, to)]);
    cursor = Math.max(cursor, e);
  }
  if (cursor < to) out.push([cursor, to]);
  return out;
}
