import type { AdminUserRow } from '@/lib/admin/types';

const TZ = 'America/Sao_Paulo';

export const PRICE_BRL = 297;

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const int = new Intl.NumberFormat('pt-BR');

/** Dia (yyyy-MM-dd) no fuso de São Paulo. */
const dayFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeFmt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export const formatBRL = (value: number) => brl.format(value);
export const formatInt = (value: number) => int.format(value);

/** "2026-11-17" -> "17/11". */
export function formatDayShort(day: string): string {
  const [, m, d] = day.split('-');
  return `${d}/${m}`;
}

/** ISO -> "17/11/2026" (America/Sao_Paulo). */
export const formatDate = (iso: string) => dateFmt.format(new Date(iso));

/** ISO -> "14:32" (America/Sao_Paulo). */
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));

const dayKey = (iso: string) => dayFmt.format(new Date(iso));

function daysBetween(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = dayKey(fromIso).split('-').map(Number);
  const [ty, tm, td] = dayKey(toIso).split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/** Último acesso em linguagem corrida, contado em dias de calendário. */
export function relativeDays(iso: string | null, nowIso: string): string {
  if (!iso) return 'nunca';
  const days = daysBetween(iso, nowIso);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  return months === 1 ? 'há 1 mês' : `há ${months} meses`;
}

/** Taxa de passagem entre duas etapas, sem dividir por zero. */
export function passRate(from: number, to: number): number | null {
  if (from <= 0) return null;
  return Math.round((to / from) * 100);
}

export type PlanKey =
  | 'trial'
  | 'trial_expired'
  | 'paying'
  | 'past_due'
  | 'cancelled'
  | 'no_onboarding';

export const PLAN_LABEL: Record<PlanKey, string> = {
  trial: 'Em teste',
  trial_expired: 'Teste vencido',
  paying: 'Pagante',
  past_due: 'Inadimplente',
  cancelled: 'Cancelado',
  no_onboarding: 'Sem onboarding',
};

export const PLAN_ORDER: PlanKey[] = [
  'paying',
  'trial',
  'trial_expired',
  'past_due',
  'cancelled',
  'no_onboarding',
];

/** Classifica a conta pelo plano; teste vencido usa o momento do cálculo. */
export function planOf(user: AdminUserRow, nowIso: string): PlanKey {
  switch (user.planStatus) {
    case null:
      return 'no_onboarding';
    case 'active':
      return 'paying';
    case 'past_due':
      return 'past_due';
    case 'cancelled':
      return 'cancelled';
    default:
      return user.trialEndsAt && Date.parse(user.trialEndsAt) < Date.parse(nowIso)
        ? 'trial_expired'
        : 'trial';
  }
}
