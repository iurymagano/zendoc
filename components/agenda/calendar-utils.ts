import type { Appointment, AppointmentStatus } from '@/types/database';
import { STATUS, STATUS_ORDER } from '@/components/appointments/status';

export const TZ = 'America/Sao_Paulo';

/** Evento pessoal do Google (read-only) tal como vem de GET /api/appointments. */
export type BusyEvent = {
  id: string;
  google_event_id: string;
  summary: string | null;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
};

/** Chave de dia (yyyy-MM-dd) de um ISO, no fuso da agenda. */
export function tzDateKey(iso: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

/** Minutos desde a meia-noite (no fuso da agenda) de um ISO. */
export function tzMinutes(iso: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return h * 60 + m;
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** Rótulo, swatch da legenda e bloco do calendário por status: vêm de components/appointments/status.ts. */
export const STATUS_LABEL = Object.fromEntries(
  STATUS_ORDER.map((s) => [s, STATUS[s].label]),
) as Record<AppointmentStatus, string>;

export const STATUS_DOT = Object.fromEntries(
  STATUS_ORDER.map((s) => [s, STATUS[s].swatch]),
) as Record<AppointmentStatus, string>;

export const STATUS_BLOCK = Object.fromEntries(
  STATUS_ORDER.map((s) => [s, STATUS[s].block]),
) as Record<AppointmentStatus, string>;

/** Agrupa appointments por dia (chave yyyy-MM-dd no fuso da agenda). */
export function groupByDay(appointments: Appointment[]): Map<string, Appointment[]> {
  const map = new Map<string, Appointment[]>();
  for (const a of appointments) {
    const key = tzDateKey(a.starts_at);
    const list = map.get(key) ?? [];
    list.push(a);
    map.set(key, list);
  }
  return map;
}

export function groupBusyByDay(busy: BusyEvent[]): Map<string, BusyEvent[]> {
  const map = new Map<string, BusyEvent[]>();
  for (const b of busy) {
    const key = tzDateKey(b.starts_at);
    const list = map.get(key) ?? [];
    list.push(b);
    map.set(key, list);
  }
  return map;
}
