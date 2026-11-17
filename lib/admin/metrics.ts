// Camada de dados do painel /admin: lê o banco com a service key e devolve o
// contrato AdminOverview (lib/admin/types.ts). Só servidor. O cálculo vive em
// lib/admin/compute.ts (puro e testado); aqui ficam as consultas.
//
// Falha de uma consulta (ex.: tabela ainda não migrada) não derruba a página:
// aquele dado fica zerado e entra uma frase em `warnings`.

import { createServerClient } from '@/lib/supabase';
import { addDaysToDate, dayRangeIso } from '@/lib/assistant/datetime';
import type { PlanStatus } from '@/types/database';
import {
  activeUsersByDay,
  buildFunnel,
  buildUserRows,
  countByKey,
  distinctActiveUsers,
  fillSeries,
  lastNDays,
  latestSeenByUser,
  mrrCents,
  summarizePlans,
  tallyByDay,
  todaySp,
  visitsByDay,
  type ActivityRow,
  type AuthUserInput,
  type ProfessionalRowInput,
  type SiteVisitRow,
} from './compute';
import type { AdminOverview, AdminUsage } from './types';

const PAGE = 1000; // teto de linhas por consulta do PostgREST
const MAX_PAGES = 50;

type DbError = { message: string } | null;

/** Lê todas as linhas de uma consulta paginando de 1000 em 1000. */
async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: DbError }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await build(page * PAGE, page * PAGE + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

/** Contas do Supabase Auth, paginando (o listUsers devolve no máximo `perPage`). */
async function listAllAuthUsers(
  supabase: ReturnType<typeof createServerClient>,
): Promise<AuthUserInput[]> {
  const out: AuthUserInput[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PAGE });
    if (error) throw new Error(error.message);
    for (const u of data.users) {
      out.push({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        app_metadata: u.app_metadata,
      });
    }
    if (data.users.length < PAGE) break;
  }
  return out;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = createServerClient();
  const now = new Date();
  const today = todaySp(now);
  const days30 = lastNDays(today, 30);
  const from30 = days30[0];
  const from7 = addDaysToDate(today, -6);
  const start30 = dayRangeIso(from30, today).start;
  const start7 = dayRangeIso(from7, today).start;
  const warnings: string[] = [];

  // Roda uma consulta; se falhar (ou a tabela não existir), devolve o fallback
  // e registra um aviso em vez de derrubar a página.
  async function safe<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await run();
    } catch (err) {
      console.error(`Admin: erro ao ler ${label}:`, err);
      warnings.push(`Não foi possível ler ${label}; esse dado aparece zerado.`);
      return fallback;
    }
  }

  async function count(
    label: string,
    build: () => PromiseLike<{ count: number | null; error: DbError }>,
  ): Promise<number> {
    return safe(
      label,
      async () => {
        const { count: n, error } = await build();
        if (error) throw new Error(error.message);
        return n ?? 0;
      },
      0,
    );
  }

  const [
    users,
    professionals,
    activity,
    visits,
    apptRows30d,
    apptsByAi7d,
    apptsManual7d,
    appts30d,
    whatsappMessages7d,
    assistantMessages7d,
    remindersSent7d,
    remindersFailed7d,
  ] = await Promise.all([
    safe('as contas (Supabase Auth)', () => listAllAuthUsers(supabase), [] as AuthUserInput[]),
    safe(
      'os profissionais',
      () =>
        fetchAll<ProfessionalRowInput & { created_at: string }>((a, b) =>
          supabase
            .from('professionals')
            .select(
              'id, user_id, name, specialty, phone, plan_status, trial_ends_at, whatsapp_connected, ai_enabled, created_at',
            )
            .range(a, b),
        ),
      [] as Array<ProfessionalRowInput & { created_at: string }>,
    ),
    safe(
      'os dias de uso do painel (activity_days)',
      () =>
        fetchAll<ActivityRow & { last_seen_at: string }>((a, b) =>
          supabase.from('activity_days').select('user_id, day, last_seen_at').range(a, b),
        ),
      [] as Array<ActivityRow & { last_seen_at: string }>,
    ),
    safe(
      'as visitas às páginas públicas (site_visits)',
      () =>
        fetchAll<SiteVisitRow>((a, b) =>
          supabase.from('site_visits').select('day, path, visits').gte('day', from30).range(a, b),
        ),
      [] as SiteVisitRow[],
    ),
    safe(
      'os atendimentos por profissional',
      () =>
        fetchAll<{ professional_id: string }>((a, b) =>
          supabase.from('appointments').select('professional_id').gte('created_at', start30).range(a, b),
        ),
      [] as Array<{ professional_id: string }>,
    ),
    count('os atendimentos marcados pela IA', () =>
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('booked_via', 'whatsapp_ai')
        .gte('created_at', start7),
    ),
    count('os atendimentos manuais', () =>
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('booked_via', 'manual')
        .gte('created_at', start7),
    ),
    count('os atendimentos dos últimos 30 dias', () =>
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', start30),
    ),
    count('as mensagens de clientes no WhatsApp', () =>
      supabase
        .from('conversation_history')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'user')
        .gte('created_at', start7),
    ),
    count('as mensagens do Assistente pessoal', () =>
      supabase
        .from('assistant_messages')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'user')
        .gte('created_at', start7),
    ),
    count('os lembretes enviados', () =>
      supabase
        .from('reminders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'sent')
        .gte('sent_at', start7),
    ),
    count('os lembretes que falharam', () =>
      supabase
        .from('reminders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('scheduled_for', start7),
    ),
  ]);

  const plans = summarizePlans(
    professionals.map((p) => ({
      plan_status: p.plan_status as PlanStatus | null,
      trial_ends_at: p.trial_ends_at,
      whatsapp_connected: p.whatsapp_connected,
    })),
    now,
  );

  const activity30 = activity.filter((r) => r.day >= from30);
  const usage: AdminUsage = {
    appointmentsByAi7d: apptsByAi7d,
    appointmentsManual7d: apptsManual7d,
    appointments30d: appts30d,
    whatsappMessages7d,
    assistantMessages7d,
    remindersSent7d,
    remindersFailed7d,
  };

  return {
    generatedAt: now.toISOString(),
    kpis: {
      accounts: users.length,
      professionals: professionals.length,
      trialing: plans.trialing,
      trialExpired: plans.trialExpired,
      paying: plans.paying,
      pastDue: plans.pastDue,
      cancelled: plans.cancelled,
      mrrCents: mrrCents(plans.paying),
      whatsappConnected: plans.whatsappConnected,
      activeToday: distinctActiveUsers(activity, today, today),
      active7d: distinctActiveUsers(activity, from7, today),
      active30d: distinctActiveUsers(activity, from30, today),
    },
    funnel30d: buildFunnel({
      visits,
      signupTimestamps: users.map((u) => u.created_at),
      professionals: professionals.map((p) => ({
        created_at: p.created_at,
        plan_status: p.plan_status as PlanStatus | null,
        trial_ends_at: p.trial_ends_at,
        whatsapp_connected: p.whatsapp_connected,
      })),
      fromDay: from30,
      toDay: today,
    }),
    usage,
    series: {
      signups: fillSeries(days30, tallyByDay(users.map((u) => u.created_at))),
      activeUsers: fillSeries(days30, activeUsersByDay(activity30)),
      landingVisits: fillSeries(days30, visitsByDay(visits, '/')),
    },
    users: buildUserRows({
      users,
      professionals: professionals.map((p) => ({ ...p, plan_status: p.plan_status as PlanStatus | null })),
      lastSeen: latestSeenByUser(activity),
      appointments30d: countByKey(apptRows30d),
    }),
    warnings,
  };
}
