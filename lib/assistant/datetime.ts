// Helpers de data/hora do Assistente pessoal. PUROS (sem banco, sem rede) e
// independentes do fuso do servidor: o Brasil não tem horário de verão desde
// 2019, então America/Sao_Paulo é um offset fixo de -03:00 (o mesmo que o resto
// do app grava nos ISO). A Vercel roda em UTC — por isso nada aqui usa
// getHours()/getDate() locais.

export const TZ = 'America/Sao_Paulo';
export const OFFSET = '-03:00';
const OFFSET_MS = 3 * 60 * 60_000;

const WEEKDAYS_FULL = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];
const WEEKDAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTHS_FULL = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type SaoPauloParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = domingo
  /** YYYY-MM-DD no fuso de São Paulo. */
  date: string;
  /** HH:mm no fuso de São Paulo. */
  time: string;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Decompõe um instante nos campos de relógio de São Paulo. */
export function saoPauloParts(instant: Date): SaoPauloParts {
  const s = new Date(instant.getTime() - OFFSET_MS);
  const year = s.getUTCFullYear();
  const month = s.getUTCMonth() + 1;
  const day = s.getUTCDate();
  const hour = s.getUTCHours();
  const minute = s.getUTCMinutes();
  return {
    year,
    month,
    day,
    hour,
    minute,
    weekday: s.getUTCDay(),
    date: `${year}-${pad(month)}-${pad(day)}`,
    time: `${pad(hour)}:${pad(minute)}`,
  };
}

/** Instante → ISO 8601 com offset -03:00 (ex.: 2026-11-18T14:00:00-03:00). */
export function toSaoPauloIso(instant: Date): string {
  const p = saoPauloParts(instant);
  return `${p.date}T${p.time}:00${OFFSET}`;
}

/** true se for uma data de calendário real (rejeita 2026-02-30). */
export function isValidDate(date: string): boolean {
  const m = DATE_RE.exec(date);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return (
    t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d
  );
}

export function isValidTime(time: string): boolean {
  return TIME_RE.test(time);
}

/** Monta o ISO -03:00 a partir de data + hora; null se qualquer uma for inválida. */
export function buildIso(date: string, time: string): string | null {
  if (!isValidDate(date) || !isValidTime(time)) return null;
  return `${date}T${time}:00${OFFSET}`;
}

/** Soma minutos a um ISO e devolve outro ISO -03:00. */
export function addMinutesToIso(iso: string, minutes: number): string {
  return toSaoPauloIso(new Date(Date.parse(iso) + minutes * 60_000));
}

/** Soma dias (calendário) a uma data YYYY-MM-DD. */
export function addDaysToDate(date: string, days: number): string {
  const m = DATE_RE.exec(date);
  if (!m) return date;
  const t = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Diferença em dias entre duas datas YYYY-MM-DD (b - a). */
export function diffDays(a: string, b: string): number {
  const pa = DATE_RE.exec(a);
  const pb = DATE_RE.exec(b);
  if (!pa || !pb) return NaN;
  const ta = Date.UTC(Number(pa[1]), Number(pa[2]) - 1, Number(pa[3]));
  const tb = Date.UTC(Number(pb[1]), Number(pb[2]) - 1, Number(pb[3]));
  return Math.round((tb - ta) / 86_400_000);
}

/** Janela [início, fim) em ISO cobrindo os dias de `from` a `to` (inclusive). */
export function dayRangeIso(
  from: string,
  to: string,
): { start: string; endExclusive: string } {
  return {
    start: `${from}T00:00:00${OFFSET}`,
    endExclusive: `${addDaysToDate(to, 1)}T00:00:00${OFFSET}`,
  };
}

/** "ter" para uma data YYYY-MM-DD. */
export function weekdayShortOf(date: string): string {
  const m = DATE_RE.exec(date);
  if (!m) return '';
  const day = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return WEEKDAYS_SHORT[day.getUTCDay()];
}

/** "ter, 18/11" (com o ano quando não for o ano de `ref`). */
export function formatBrDate(date: string, ref: Date = new Date()): string {
  const m = DATE_RE.exec(date);
  if (!m) return date;
  const base = `${weekdayShortOf(date)}, ${m[3]}/${m[2]}`;
  return Number(m[1]) === saoPauloParts(ref).year ? base : `${base}/${m[1]}`;
}

/** "ter, 18/11 às 14:00" a partir de um ISO/instante. */
export function formatBrDateTime(iso: string, ref: Date = new Date()): string {
  const p = saoPauloParts(new Date(iso));
  return `${formatBrDate(p.date, ref)} às ${p.time}`;
}

/** "14:00" a partir de um ISO. */
export function formatTime(iso: string): string {
  return saoPauloParts(new Date(iso)).time;
}

/** "sábado, 14 de novembro de 2026" no fuso de São Paulo (o que o servidor vê não importa). */
export function formatLongBrDate(instant: Date): string {
  const p = saoPauloParts(instant);
  return `${WEEKDAYS_FULL[p.weekday]}, ${pad(p.day)} de ${MONTHS_FULL[p.month - 1]} de ${p.year}`;
}

/** "sábado, 14 de novembro de 2026 às 16:57" no fuso de São Paulo. */
export function formatLongBrDateTime(instant: Date): string {
  return `${formatLongBrDate(instant)} às ${saoPauloParts(instant).time}`;
}

/** Dia da semana (0 = domingo) de uma data YYYY-MM-DD de calendário; NaN se inválida. */
export function weekdayOfDate(date: string): number {
  const m = DATE_RE.exec(date);
  if (!m) return NaN;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay();
}

/** Instante (ms) de "data + HH:mm[:ss]" no relógio de São Paulo; NaN se inválido. */
export function saoPauloInstantMs(date: string, time: string): number {
  const hm = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(time);
  if (!hm || !isValidDate(date)) return NaN;
  return Date.parse(`${date}T${hm[1]}:${hm[2]}:00${OFFSET}`);
}

/**
 * Valor de data do Google Agenda → ISO UTC. Evento de dia inteiro vem só com
 * "YYYY-MM-DD" (sem hora/fuso): `new Date("2026-11-18")` seria meia-noite UTC
 * (21h do dia anterior em São Paulo), então ancora à meia-noite de São Paulo.
 */
export function calendarValueToIso(value: string): string {
  return new Date(DATE_RE.test(value) ? `${value}T00:00:00${OFFSET}` : value).toISOString();
}

/** "sábado, 14/11/2026, 16:57" — âncora de "agora" para o system prompt. */
export function describeNow(now: Date): string {
  const p = saoPauloParts(now);
  return `${WEEKDAYS_FULL[p.weekday]}, ${pad(p.day)}/${pad(p.month)}/${p.year}, ${p.time}`;
}

/**
 * Tabela "dia da semana → data" dos próximos dias. Os modelos erram conta de
 * calendário ("terça que vem"); dar a tabela pronta elimina o cálculo.
 */
export function buildCalendarHint(now: Date, days = 14): string {
  const today = saoPauloParts(now).date;
  const lines: string[] = [];
  for (let i = 0; i <= days; i++) {
    const date = addDaysToDate(today, i);
    const m = DATE_RE.exec(date)!;
    const wd = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    const label = i === 0 ? 'hoje' : i === 1 ? 'amanhã' : null;
    lines.push(
      `- ${WEEKDAYS_FULL[wd.getUTCDay()]}${label ? ` (${label})` : ''}: ${date}`,
    );
  }
  return lines.join('\n');
}
