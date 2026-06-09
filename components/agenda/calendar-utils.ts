import type { Appointment, AppointmentStatus } from '@/types/database';

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

/** Chave de dia (yyyy-MM-dd) de um ISO, no fuso do consultório. */
export function tzDateKey(iso: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

/** Minutos desde a meia-noite (no fuso do consultório) de um ISO. */
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

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  pending_approval: 'Aguardando aprovação',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
};

/** Swatch (quadradinho) de cor por status — usado na legenda. */
export const STATUS_DOT: Record<AppointmentStatus, string> = {
  scheduled: 'bg-primary/30 ring-1 ring-primary/40',
  confirmed: 'bg-emerald-300 ring-1 ring-emerald-400',
  pending_approval: 'bg-amber-300 ring-1 ring-amber-400',
  cancelled: 'bg-muted ring-1 ring-border',
  no_show: 'bg-destructive/30 ring-1 ring-destructive/40',
};

/** Cor do bloco no calendário por status (preenchido, legível). */
export const STATUS_BLOCK: Record<AppointmentStatus, string> = {
  scheduled: 'bg-primary/15 text-primary ring-1 ring-primary/30 hover:bg-primary/25',
  confirmed:
    'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100 dark:ring-emerald-800',
  pending_approval:
    'bg-amber-100 text-amber-900 ring-1 ring-amber-300 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:ring-amber-800',
  cancelled:
    'bg-muted text-muted-foreground line-through ring-1 ring-border hover:bg-muted',
  no_show:
    'bg-destructive/10 text-destructive ring-1 ring-destructive/30 hover:bg-destructive/20',
};

/** Agrupa appointments por dia (chave yyyy-MM-dd no fuso do consultório). */
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
