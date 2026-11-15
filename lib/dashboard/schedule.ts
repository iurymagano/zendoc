// Contas PURAS da agenda para o painel inicial (sem banco, sem rede): semana,
// capacidade de atendimento por dia, ocupação e a "régua do dia". Tudo no relógio
// de America/Sao_Paulo (lib/assistant/datetime.ts), independente do fuso do servidor.
import {
  addDaysToDate,
  saoPauloInstantMs,
  saoPauloParts,
  weekdayOfDate,
  weekdayShortOf,
} from '../assistant/datetime';
import {
  buildBlocks,
  type BusyRange,
  type ExceptionInput,
  type WeeklyBlockInput,
} from '../availability/compute';

/** Atendimento mínimo que as contas daqui precisam. */
export type TimedRange = { starts_at: string; ends_at: string };

type Interval = [number, number];

export type WeekInfo = {
  /** Segunda-feira (YYYY-MM-DD), a mesma semana que a /agenda mostra. */
  start: string;
  /** Domingo (YYYY-MM-DD). */
  end: string;
  /** As 7 datas, de segunda a domingo. */
  days: string[];
  /** Hoje (YYYY-MM-DD), em São Paulo. */
  today: string;
};

/** Semana de segunda a domingo que contém "agora", em São Paulo. */
export function weekOf(now: Date): WeekInfo {
  const today = saoPauloParts(now).date;
  const offset = (weekdayOfDate(today) + 6) % 7; // segunda = 0
  const start = addDaysToDate(today, -offset);
  const days = Array.from({ length: 7 }, (_, i) => addDaysToDate(start, i));
  return { start, end: days[6], days, today };
}

function mergeIntervals(list: Interval[]): Interval[] {
  const sorted = list
    .filter(([a, b]) => b > a)
    .sort((x, y) => x[0] - y[0]);
  const out: Interval[] = [];
  for (const [a, b] of sorted) {
    const last = out[out.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

/** Soma (ms) da interseção entre duas listas de intervalos JÁ mesclados. */
function overlapMs(a: Interval[], b: Interval[]): number {
  let total = 0;
  for (const [a0, a1] of a) {
    for (const [b0, b1] of b) {
      const lo = Math.max(a0, b0);
      const hi = Math.min(a1, b1);
      if (hi > lo) total += hi - lo;
    }
  }
  return total;
}

const toIntervals = (list: TimedRange[]): Interval[] =>
  list.map((r) => [Date.parse(r.starts_at), Date.parse(r.ends_at)] as Interval);

/** Janelas em que o profissional atende naquele dia (ms), já mescladas. */
export function dayWindows(
  date: string,
  weekly: WeeklyBlockInput[],
  exceptions: ExceptionInput[],
): Interval[] {
  const exception = exceptions.find((e) => e.date === date);
  if (exception?.type === 'day_off') return [];
  const blocks = buildBlocks(date, weekly, exception);
  const list: Interval[] = [];
  for (const b of blocks) {
    const s = saoPauloInstantMs(date, b.start);
    const e = saoPauloInstantMs(date, b.end);
    if (!Number.isNaN(s) && !Number.isNaN(e) && e > s) list.push([s, e]);
  }
  return mergeIntervals(list);
}

export type DayOccupancy = {
  date: string;
  /** "seg", "ter"… */
  weekday: string;
  /** Minutos em que o profissional atende (rotina semanal + exceções, sem almoço). */
  capacityMin: number;
  /** Minutos ocupados por atendimentos e compromissos, dentro do horário de atender. */
  bookedMin: number;
  /** Minutos tomados por eventos do Google Agenda, sem repetir os já ocupados. */
  blockedMin: number;
  /** Capacidade que sobrou: o que ainda pode ser oferecido. */
  freeMin: number;
  /** Atendimentos e compromissos ativos que começam no dia. */
  count: number;
  isToday: boolean;
  isPast: boolean;
};

export type WeekOccupancy = {
  days: DayOccupancy[];
  capacityMin: number;
  bookedMin: number;
  blockedMin: number;
  /** 0–100, ou null se a semana não tem horário de atendimento. */
  occupancyPct: number | null;
};

const toMin = (ms: number) => Math.round(ms / 60_000);

export function weekOccupancy(input: {
  now: Date;
  weekly: WeeklyBlockInput[];
  exceptions: ExceptionInput[];
  /** Atendimentos ATIVOS (scheduled, confirmed, pending_approval). */
  appointments: TimedRange[];
  /** Eventos do Google Agenda que bloqueiam horário. */
  busy: BusyRange[];
}): WeekOccupancy {
  const week = weekOf(input.now);
  const appts = mergeIntervals(toIntervals(input.appointments));
  const google = toIntervals(input.busy);

  const days = week.days.map((date): DayOccupancy => {
    const windows = dayWindows(date, input.weekly, input.exceptions);
    const capacity = windows.reduce((s, [a, b]) => s + (b - a), 0);
    const booked = overlapMs(windows, appts);
    const used = overlapMs(windows, mergeIntervals([...appts, ...google]));
    const count = input.appointments.filter(
      (a) => saoPauloParts(new Date(a.starts_at)).date === date,
    ).length;
    return {
      date,
      weekday: weekdayShortOf(date),
      capacityMin: toMin(capacity),
      bookedMin: toMin(booked),
      blockedMin: toMin(used - booked),
      freeMin: toMin(capacity - used),
      count,
      isToday: date === week.today,
      isPast: date < week.today,
    };
  });

  const capacityMin = days.reduce((s, d) => s + d.capacityMin, 0);
  const bookedMin = days.reduce((s, d) => s + d.bookedMin, 0);
  const blockedMin = days.reduce((s, d) => s + d.blockedMin, 0);
  return {
    days,
    capacityMin,
    bookedMin,
    blockedMin,
    occupancyPct: capacityMin > 0 ? Math.round((bookedMin / capacityMin) * 100) : null,
  };
}

export type RulerSegment = {
  id: string;
  /** Posição e largura em % da régua. */
  left: number;
  width: number;
};

export type DayRuler = {
  /** Horas cheias da régua, com a posição em %. */
  ticks: { hour: number; left: number }[];
  /** Janelas em que o profissional atende. */
  windows: { left: number; width: number }[];
  /** Atendimentos e compromissos do dia. */
  segments: RulerSegment[];
  /** Posição de "agora" em %, ou null se fora da régua. */
  nowPct: number | null;
  /** Quanto da régua já passou (0 antes de começar, 100 depois de acabar). */
  elapsedPct: number;
};

const clampPct = (n: number) => Math.min(100, Math.max(0, n));

/**
 * Régua do dia: do primeiro ao último horário (arredondados para hora cheia) entre
 * o horário de atender e os atendimentos do dia. null se o dia não tem nem uma
 * coisa nem outra.
 */
export function dayRuler(input: {
  now: Date;
  date: string;
  weekly: WeeklyBlockInput[];
  exceptions: ExceptionInput[];
  appointments: (TimedRange & { id: string })[];
}): DayRuler | null {
  const { now, date } = input;
  const dayStart = saoPauloInstantMs(date, '00:00');
  const windows = dayWindows(date, input.weekly, input.exceptions);
  const appts = input.appointments
    .map((a) => ({ id: a.id, s: Date.parse(a.starts_at), e: Date.parse(a.ends_at) }))
    .filter((a) => a.e > dayStart && a.s < dayStart + 24 * 3_600_000);
  const all: Interval[] = [...windows, ...appts.map((a): Interval => [a.s, a.e])];
  if (all.length === 0) return null;

  const minStart = Math.min(...all.map((i) => i[0]));
  const maxEnd = Math.max(...all.map((i) => i[1]));
  const startHour = Math.max(0, Math.floor((minStart - dayStart) / 3_600_000));
  const endHour = Math.min(24, Math.ceil((maxEnd - dayStart) / 3_600_000));
  const from = dayStart + startHour * 3_600_000;
  const span = (endHour - startHour) * 3_600_000;
  if (span <= 0) return null;
  const pct = (ms: number) => clampPct(((ms - from) / span) * 100);

  const nowMs = now.getTime();
  return {
    ticks: Array.from({ length: endHour - startHour + 1 }, (_, i) => ({
      hour: startHour + i,
      left: (i / (endHour - startHour)) * 100,
    })),
    windows: windows.map(([a, b]) => ({ left: pct(a), width: pct(b) - pct(a) })),
    segments: appts.map((a) => ({
      id: a.id,
      left: pct(a.s),
      width: Math.max(pct(a.e) - pct(a.s), 1.2),
    })),
    nowPct: nowMs >= from && nowMs <= from + span ? pct(nowMs) : null,
    elapsedPct: pct(nowMs),
  };
}
