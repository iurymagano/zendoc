// Cálculo PURO dos horários livres (sem banco, sem rede). Tudo em
// America/Sao_Paulo (-03:00 fixo) INDEPENDENTE do fuso do servidor: a Vercel
// roda em UTC, e o `date-fns` (startOfDay/setHours/getDay) usa o fuso local do
// processo — por isso aqui só se faz conta de calendário em UTC sobre datas
// YYYY-MM-DD e instantes absolutos (ms).
import {
  addDaysToDate,
  saoPauloInstantMs,
  saoPauloParts,
  weekdayOfDate,
} from '../assistant/datetime';

/** Um horário disponível: instantes reais (start/end), não "relógio local". */
export type Slot = { start: Date; end: Date };

export type WeeklyBlockInput = {
  weekday: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
};

export type ExceptionInput = {
  date: string;
  type: 'day_off' | 'custom_hours' | 'extra_day';
  start_time: string | null;
  end_time: string | null;
  slot_duration: number | null;
};

export type BusyRange = { starts_at: string; ends_at: string };

type Block = { start: string; end: string; duration: number };

function buildBlocks(
  date: string,
  weekly: WeeklyBlockInput[],
  exception: ExceptionInput | undefined,
): Block[] {
  if (exception?.type === 'custom_hours' || exception?.type === 'extra_day') {
    if (!exception.start_time || !exception.end_time) return [];
    return [
      {
        start: exception.start_time,
        end: exception.end_time,
        duration: exception.slot_duration ?? 50,
      },
    ];
  }

  const weekday = weekdayOfDate(date);
  return weekly
    .filter((w) => w.weekday === weekday)
    .map((w) => ({
      start: w.start_time,
      end: w.end_time,
      duration: w.slot_duration,
    }));
}

export type ComputeSlotsInput = {
  /** "Agora": só slots estritamente depois dele. */
  now: Date;
  /** Quantos dias a partir de amanhã (1..days). */
  days: number;
  weekly: WeeklyBlockInput[];
  exceptions: ExceptionInput[];
  /** Atendimentos ativos + eventos ocupados do Google. */
  busy: BusyRange[];
  /** Intervalo mínimo entre atendimentos (min), dos dois lados. */
  bufferMin?: number;
};

export function computeSlots(input: ComputeSlotsInput): Slot[] {
  const { now, days, weekly, exceptions, busy } = input;
  const bufferMs = (input.bufferMin ?? 0) * 60_000;
  const today = saoPauloParts(now).date;
  const nowMs = now.getTime();

  const busyMs = busy.map((b) => ({
    start: new Date(b.starts_at).getTime() - bufferMs,
    end: new Date(b.ends_at).getTime() + bufferMs,
  }));

  const slots: Slot[] = [];

  for (let i = 1; i <= days; i++) {
    const date = addDaysToDate(today, i);
    const exception = exceptions.find((e) => e.date === date);
    if (exception?.type === 'day_off') continue;

    for (const block of buildBlocks(date, weekly, exception)) {
      let slot = saoPauloInstantMs(date, block.start);
      const blockEnd = saoPauloInstantMs(date, block.end);
      if (Number.isNaN(slot) || Number.isNaN(blockEnd)) continue;
      const durationMs = block.duration * 60_000;
      if (!(durationMs > 0)) continue;

      while (slot + durationMs <= blockEnd) {
        const slotEnd = slot + durationMs;
        const hasConflict = busyMs.some((b) => slot < b.end && slotEnd > b.start);
        if (!hasConflict && slot > nowMs) {
          slots.push({ start: new Date(slot), end: new Date(slotEnd) });
        }
        slot = slotEnd;
      }
    }
  }

  return slots;
}
