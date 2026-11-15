/**
 * Replicar um dia da disponibilidade semanal para outros dias. Módulo puro
 * (sem React nem rede) — usado pela tela /configuracoes/disponibilidade.
 */

export type BlockState = {
  enabled: boolean;
  start: string;
  end: string;
};

export type DayState = {
  weekday: number;
  active: boolean;
  morning: BlockState;
  lunch: BlockState;
  afternoon: BlockState;
};

/** Nomes completos, indexados por `weekday` (0 = domingo). */
export const WEEKDAY_NAMES = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
] as const;

const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'] as const;

export const WEEKDAY_PRESETS = {
  /** Segunda a sexta. */
  weekdays: [1, 2, 3, 4, 5],
  /** Domingo e sábado. */
  weekend: [0, 6],
  /** Todos os dias. */
  all: [0, 1, 2, 3, 4, 5, 6],
} as const;

/** Atalho de seleção sem o dia de origem (que não pode ser copiado nele mesmo). */
export function presetTargets(
  preset: keyof typeof WEEKDAY_PRESETS,
  sourceWeekday: number,
): number[] {
  return WEEKDAY_PRESETS[preset].filter((w) => w !== sourceWeekday);
}

/**
 * Copia o dia `sourceWeekday` (ligado/desligado + manhã, almoço e tarde com
 * horários e liga/desliga de cada bloco) para os dias de `targets`. Não altera
 * `days`; devolve uma lista nova, com cópias independentes dos blocos. Alvos
 * repetidos, iguais à origem ou inexistentes são ignorados. A duração do
 * atendimento é única para a semana toda (não é por dia), então não entra aqui.
 */
export function replicateDay(
  days: DayState[],
  sourceWeekday: number,
  targets: number[],
): DayState[] {
  const source = days.find((d) => d.weekday === sourceWeekday);
  if (!source) return days;
  const wanted = new Set(targets.filter((w) => w !== sourceWeekday));
  return days.map((d) =>
    wanted.has(d.weekday)
      ? {
          weekday: d.weekday,
          active: source.active,
          morning: { ...source.morning },
          lunch: { ...source.lunch },
          afternoon: { ...source.afternoon },
        }
      : d,
  );
}

/** `[1, 2, 3]` → `seg, ter, qua` (ordem da tela: segunda a domingo). */
export function describeWeekdays(weekdays: number[]): string {
  return [...new Set(weekdays)]
    .filter((w) => w >= 0 && w <= 6)
    // Ordem da tela: segunda a domingo (domingo, 0, vai por último).
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    .map((w) => WEEKDAY_SHORT[w])
    .join(', ');
}
