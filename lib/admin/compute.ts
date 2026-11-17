// Cálculo PURO do painel admin (sem banco, sem rede). Todos os dias são
// "yyyy-MM-dd" em America/Sao_Paulo, via lib/assistant/datetime.ts; nada aqui
// usa getHours()/startOfDay() locais (a Vercel roda em UTC).

import { addDaysToDate, saoPauloParts } from '@/lib/assistant/datetime';
import type { PlanStatus } from '@/types/database';
import { PLAN_PRICE_CENTS } from './pricing';
import type { AdminFunnel, AdminUserRow, DailyPoint } from './types';

/** Hoje (yyyy-MM-dd) em São Paulo. */
export function todaySp(now: Date): string {
  return saoPauloParts(now).date;
}

/** Os `n` dias terminando em `today` (inclusive), do mais antigo ao mais novo. */
export function lastNDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDaysToDate(today, i - (n - 1)));
}

/** Conta ocorrências por dia (São Paulo) a partir de timestamps ISO. */
export function tallyByDay(timestamps: Array<string | null | undefined>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const ts of timestamps) {
    if (!ts) continue;
    const ms = Date.parse(ts);
    if (Number.isNaN(ms)) continue;
    const day = saoPauloParts(new Date(ms)).date;
    out[day] = (out[day] ?? 0) + 1;
  }
  return out;
}

/** Série com todos os dias preenchidos (0 quando não houver dado). */
export function fillSeries(days: string[], counts: Record<string, number>): DailyPoint[] {
  return days.map((day) => ({ day, value: counts[day] ?? 0 }));
}

export type PlanBucket = 'trialing' | 'trialExpired' | 'active' | 'pastDue' | 'cancelled' | 'none';

/** Em que faixa do plano o profissional está; 'trialExpired' = teste vencido sem assinar. */
export function planBucket(
  planStatus: PlanStatus | null | undefined,
  trialEndsAt: string | null | undefined,
  now: Date,
): PlanBucket {
  switch (planStatus) {
    case 'trialing': {
      const ends = trialEndsAt ? Date.parse(trialEndsAt) : NaN;
      return !Number.isNaN(ends) && ends < now.getTime() ? 'trialExpired' : 'trialing';
    }
    case 'active':
      return 'active';
    case 'past_due':
      return 'pastDue';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'none';
  }
}

export interface ProfessionalPlanInput {
  plan_status: PlanStatus | null;
  trial_ends_at: string | null;
  whatsapp_connected: boolean;
}

export interface PlanSummary {
  trialing: number;
  trialExpired: number;
  paying: number;
  pastDue: number;
  cancelled: number;
  whatsappConnected: number;
}

export function summarizePlans(rows: ProfessionalPlanInput[], now: Date): PlanSummary {
  const s: PlanSummary = {
    trialing: 0,
    trialExpired: 0,
    paying: 0,
    pastDue: 0,
    cancelled: 0,
    whatsappConnected: 0,
  };
  for (const r of rows) {
    const b = planBucket(r.plan_status, r.trial_ends_at, now);
    if (b === 'trialing') s.trialing++;
    else if (b === 'trialExpired') s.trialExpired++;
    else if (b === 'active') s.paying++;
    else if (b === 'pastDue') s.pastDue++;
    else if (b === 'cancelled') s.cancelled++;
    if (r.whatsapp_connected) s.whatsappConnected++;
  }
  return s;
}

/** MRR estimado em centavos: pagantes × preço do plano. */
export function mrrCents(paying: number, priceCents: number = PLAN_PRICE_CENTS): number {
  return paying * priceCents;
}

export interface ActivityRow {
  user_id: string;
  day: string;
}

/** Usuários distintos com atividade entre `fromDay` e `toDay` (inclusive). */
export function distinctActiveUsers(rows: ActivityRow[], fromDay: string, toDay: string): number {
  const seen = new Set<string>();
  for (const r of rows) {
    if (r.day >= fromDay && r.day <= toDay) seen.add(r.user_id);
  }
  return seen.size;
}

/** Usuários ativos por dia (uma linha de activity_days = um usuário no dia). */
export function activeUsersByDay(rows: ActivityRow[]): Record<string, number> {
  const perDay: Record<string, Set<string>> = {};
  for (const r of rows) (perDay[r.day] ??= new Set()).add(r.user_id);
  return Object.fromEntries(Object.entries(perDay).map(([d, s]) => [d, s.size]));
}

export interface SiteVisitRow {
  day: string;
  path: string;
  visits: number;
}

/** Soma de visitas de um caminho entre `fromDay` e `toDay` (inclusive). */
export function sumVisits(rows: SiteVisitRow[], path: string, fromDay: string, toDay: string): number {
  let total = 0;
  for (const r of rows) {
    if (r.path === path && r.day >= fromDay && r.day <= toDay) total += r.visits;
  }
  return total;
}

/** Visitas por dia de um caminho. */
export function visitsByDay(rows: SiteVisitRow[], path: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) if (r.path === path) out[r.day] = (out[r.day] ?? 0) + r.visits;
  return out;
}

export interface FunnelProfessional extends ProfessionalPlanInput {
  created_at: string;
}

/**
 * Funil do período [fromDay, toDay]: visitas, contas criadas e, entre quem
 * concluiu o onboarding no período, quantos conectaram o WhatsApp e pagam.
 */
export function buildFunnel(input: {
  visits: SiteVisitRow[];
  signupTimestamps: string[];
  professionals: FunnelProfessional[];
  fromDay: string;
  toDay: string;
}): AdminFunnel {
  const { visits, signupTimestamps, professionals, fromDay, toDay } = input;
  const inRange = (ts: string) => {
    const d = saoPauloParts(new Date(ts)).date;
    return d >= fromDay && d <= toDay;
  };
  const onboarded = professionals.filter((p) => inRange(p.created_at));
  return {
    landingVisits: sumVisits(visits, '/', fromDay, toDay),
    registerVisits: sumVisits(visits, '/register', fromDay, toDay),
    signups: signupTimestamps.filter(inRange).length,
    onboarded: onboarded.length,
    whatsappConnected: onboarded.filter((p) => p.whatsapp_connected).length,
    paying: onboarded.filter((p) => p.plan_status === 'active').length,
  };
}

/** Provider de login a partir do app_metadata do Supabase Auth. */
export function providerFromMetadata(
  meta: { provider?: unknown; providers?: unknown } | null | undefined,
): 'google' | 'email' | null {
  if (!meta) return null;
  const list = [
    ...(Array.isArray(meta.providers) ? meta.providers : []),
    ...(typeof meta.provider === 'string' ? [meta.provider] : []),
  ];
  if (list.includes('google')) return 'google';
  if (list.includes('email')) return 'email';
  return null;
}

export interface AuthUserInput {
  id: string;
  email: string | null | undefined;
  created_at: string;
  app_metadata?: { provider?: unknown; providers?: unknown } | null;
}

export interface ProfessionalRowInput extends ProfessionalPlanInput {
  id: string;
  user_id: string;
  name: string | null;
  specialty: string | null;
  phone: string | null;
  ai_enabled: boolean;
}

/** Junta contas, profissionais, última atividade e atendimentos; mais recentes primeiro. */
export function buildUserRows(input: {
  users: AuthUserInput[];
  professionals: ProfessionalRowInput[];
  /** user_id → último last_seen_at (ISO). */
  lastSeen: Record<string, string>;
  /** professional_id → atendimentos criados nos últimos 30 dias. */
  appointments30d: Record<string, number>;
}): AdminUserRow[] {
  const byUser = new Map(input.professionals.map((p) => [p.user_id, p]));
  return input.users
    .map((u): AdminUserRow => {
      const p = byUser.get(u.id);
      return {
        userId: u.id,
        email: u.email ?? '',
        professionalId: p?.id ?? null,
        name: p?.name ?? null,
        specialty: p?.specialty ?? null,
        phone: p?.phone ?? null,
        planStatus: p?.plan_status ?? null,
        trialEndsAt: p?.trial_ends_at ?? null,
        whatsappConnected: p?.whatsapp_connected ?? false,
        aiEnabled: p?.ai_enabled ?? false,
        createdAt: u.created_at,
        lastSeenAt: input.lastSeen[u.id] ?? null,
        appointments30d: p ? (input.appointments30d[p.id] ?? 0) : 0,
        provider: providerFromMetadata(u.app_metadata),
      };
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** user_id → last_seen_at mais recente, a partir das linhas de activity_days. */
export function latestSeenByUser(
  rows: Array<{ user_id: string; last_seen_at: string }>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of rows) {
    const cur = out[r.user_id];
    if (!cur || Date.parse(r.last_seen_at) > Date.parse(cur)) out[r.user_id] = r.last_seen_at;
  }
  return out;
}

/** professional_id → quantidade (a partir de linhas só com professional_id). */
export function countByKey(rows: Array<{ professional_id: string }>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) out[r.professional_id] = (out[r.professional_id] ?? 0) + 1;
  return out;
}
