/** Soma dias a uma data yyyy-MM-dd sem cair em armadilha de DST (passo via meio-dia UTC). */
export function addDaysKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type OccurrenceRule = {
  /** 1ª data da série (yyyy-MM-dd); ancora a cadência. */
  startDate: string;
  intervalWeeks: number;
  /** Último dia da série (yyyy-MM-dd), inclusivo; null = sem fim. */
  until: string | null;
};

export type OccurrenceOptions = {
  /** Hoje (yyyy-MM-dd) no fuso da agenda. */
  today: string;
  horizonWeeks: number;
  /**
   * Inclui a 1ª data mesmo se ela já passou. Só na criação da série: é o dia
   * que o profissional escolheu no formulário (o agendamento único também
   * aceita data passada). O cron diário não usa, para nunca recriar no passado.
   */
  includePastStart?: boolean;
  /** Backstop contra loop. */
  max?: number;
};

/**
 * Datas (yyyy-MM-dd) a materializar: a cada `intervalWeeks` a partir de
 * `startDate`, dentro de [hoje, hoje + horizonWeeks] e limitadas por `until`.
 */
export function occurrenceDates(rule: OccurrenceRule, opts: OccurrenceOptions): string[] {
  const horizon = addDaysKey(opts.today, opts.horizonWeeks * 7);
  const end = rule.until && rule.until < horizon ? rule.until : horizon;
  const step = rule.intervalWeeks * 7;
  const max = opts.max ?? 60;

  const dates: string[] = [];
  let date = rule.startDate;
  for (let i = 0; i < max && date <= end; i++, date = addDaysKey(date, step)) {
    const isStart = i === 0;
    if (date < opts.today && !(isStart && opts.includePastStart)) continue;
    dates.push(date);
  }
  return dates;
}
