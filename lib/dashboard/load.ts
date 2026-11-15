// Carrega do banco tudo que o painel inicial (/dashboard) mostra e devolve já
// agregado. SERVIDOR APENAS: usa a service key, que ignora RLS, então TODA
// consulta filtra por `professionalId`, que vem da sessão (nunca de parâmetro).
// As contas ficam em schedule.ts, summary.ts e setup.ts (puras e testadas).
import { dayRangeIso } from '@/lib/assistant/datetime';
import { getAvailableSlots } from '@/lib/availability/slots';
import { createServerClient } from '@/lib/supabase';
import type { Professional } from '@/types/database';
import { dayRuler, weekOccupancy, weekOf, type DayRuler, type WeekInfo, type WeekOccupancy } from './schedule';
import { buildSetup, trialInfo, type Setup, type TrialInfo } from './setup';
import {
  attendanceStats,
  isActiveStatus,
  latestByPhone,
  timeSavedEstimate,
  todaySummary,
  upcomingGroups,
  weekMetrics,
  type Attendance,
  type DashAppointment,
  type HistoryRow,
  type TimeSaved,
  type TodaySummary,
  type UpcomingGroup,
  type WeekMetrics,
} from './summary';

export type ConversationItem = {
  phone: string;
  name: string | null;
  last_message: string | null;
  last_role: 'user' | 'assistant' | null;
  last_at: string | null;
  ai_paused: boolean;
  needs_attention: boolean;
};

export type DashboardData = {
  now: Date;
  professional: Professional;
  week: WeekInfo;
  today: TodaySummary;
  ruler: DayRuler | null;
  upcoming: UpcomingGroup[];
  /** Total de atendimentos ativos por vir (não só os que a lista mostra). */
  upcomingCount: number;
  /** Total de atendimentos que a IA marcou pelo WhatsApp (desde o início, sem os cancelados). */
  aiTotal: number;
  /** Atendimentos esperando a aprovação do profissional (o mais próximo primeiro). */
  pending: DashAppointment[];
  pendingCount: number;
  /** id do serviço → nome. */
  serviceNames: Record<string, string>;
  metrics: WeekMetrics;
  occupancy: WeekOccupancy;
  attendance: Attendance;
  timeSaved: TimeSaved | null;
  newClients: { week: number; total: number };
  setup: Setup;
  availabilityConfigured: boolean;
  /** Conta sem horário cadastrado e sem nenhum atendimento: ainda não começou. */
  isNew: boolean;
  trial: TrialInfo | null;
  /** Conversas que a IA não soube responder. */
  needsReply: ConversationItem[];
  /** Conversas com a IA pausada (o profissional assumiu), sem as de cima. */
  paused: ConversationItem[];
  /** Último contato de cada cliente, do mais recente para o mais antigo. */
  recent: ConversationItem[];
  /** Próximos horários livres que a IA oferece (a partir de amanhã). */
  slots: { start: string; end: string }[];
};

const SELECT_APPT =
  'id, patient_name, patient_phone, starts_at, ends_at, status, booked_via, service_id';
const ACTIVE = ['scheduled', 'confirmed', 'pending_approval'];

function rows<T>(label: string, res: { data: T[] | null; error: { message: string } | null }): T[] {
  if (res.error) console.error(`[dashboard] ${label}:`, res.error.message);
  return res.data ?? [];
}

export async function loadDashboard(
  professional: Professional,
  now: Date = new Date(),
): Promise<DashboardData> {
  const supabase = createServerClient();
  const pid = professional.id;
  const week = weekOf(now);
  const weekRange = dayRangeIso(week.start, week.end);
  const nowIso = now.toISOString();
  const since30 = new Date(now.getTime() - 30 * 86_400_000).toISOString();

  const [
    weeklyRes,
    exceptionsRes,
    windowRes,
    upcomingRes,
    pendingRes,
    servicesRes,
    googleBusyRes,
    newClientsRes,
    totalClientsRes,
    totalApptsRes,
    aiTotalRes,
    stateRes,
    historyRes,
    slots,
  ] = await Promise.all([
    supabase
      .from('availability_weekly')
      .select('weekday, start_time, end_time, slot_duration')
      .eq('professional_id', pid)
      .eq('is_active', true)
      .neq('block_type', 'lunch'),
    supabase
      .from('availability_exceptions')
      .select('date, type, start_time, end_time, slot_duration')
      .eq('professional_id', pid)
      .gte('date', week.start)
      .lte('date', week.end),
    // últimos 30 dias + resto da semana: base da semana, da ocupação e do comparecimento
    supabase
      .from('appointments')
      .select(SELECT_APPT)
      .eq('professional_id', pid)
      .gte('starts_at', since30)
      .lt('starts_at', weekRange.endExclusive)
      .order('starts_at', { ascending: true })
      .limit(1500),
    supabase
      .from('appointments')
      .select(SELECT_APPT, { count: 'exact' })
      .eq('professional_id', pid)
      .in('status', ACTIVE)
      .gte('ends_at', nowIso)
      .order('starts_at', { ascending: true })
      .limit(8),
    supabase
      .from('appointments')
      .select(SELECT_APPT, { count: 'exact' })
      .eq('professional_id', pid)
      .eq('status', 'pending_approval')
      .gte('ends_at', nowIso)
      .order('starts_at', { ascending: true })
      .limit(4),
    supabase
      .from('services')
      .select('id, name, active')
      .eq('professional_id', pid),
    supabase
      .from('google_busy_events')
      .select('starts_at, ends_at')
      .eq('professional_id', pid)
      .lt('starts_at', weekRange.endExclusive)
      .gt('ends_at', weekRange.start),
    supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', pid)
      .gte('created_at', weekRange.start)
      .lt('created_at', weekRange.endExclusive),
    supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', pid),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', pid),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', pid)
      .eq('booked_via', 'whatsapp_ai')
      .neq('status', 'cancelled'),
    supabase
      .from('conversation_state')
      .select('patient_phone, ai_paused, needs_attention, updated_at')
      .eq('professional_id', pid)
      .or('needs_attention.eq.true,ai_paused.eq.true')
      .order('updated_at', { ascending: false })
      .limit(12),
    supabase
      .from('conversation_history')
      .select('patient_phone, role, content, created_at')
      .eq('professional_id', pid)
      .order('created_at', { ascending: false })
      .limit(60),
    getAvailableSlots(pid, 14).catch((err) => {
      console.error('[dashboard] slots:', err);
      return [];
    }),
  ]);

  const weekly = rows('weekly', weeklyRes);
  const exceptions = rows('exceptions', exceptionsRes);
  const window = rows('appointments', windowRes) as DashAppointment[];
  const upcomingRows = rows('upcoming', upcomingRes) as DashAppointment[];
  const pending = rows('pending', pendingRes) as DashAppointment[];
  const services = rows('services', servicesRes);
  const googleBusy = rows('google_busy', googleBusyRes);
  const state = rows('conversation_state', stateRes);
  const history = rows('conversation_history', historyRes) as HistoryRow[];

  // Atendimentos de hoje: a janela cobre a semana inteira (e hoje está nela).
  const today = todaySummary(window, now);
  const ruler = dayRuler({
    now,
    date: week.today,
    weekly,
    exceptions,
    appointments: today.items,
  });

  const occupancy = weekOccupancy({
    now,
    weekly,
    exceptions,
    appointments: window.filter((a) => isActiveStatus(a.status)),
    busy: googleBusy,
  });

  const metrics = weekMetrics(window, now);

  // Conversas: nomes dos clientes pelos telefones que vão aparecer.
  const recentRaw = latestByPhone(history, 5);
  const phones = [...new Set([...state.map((s) => s.patient_phone), ...recentRaw.map((r) => r.phone)])];
  const patientRows = phones.length
    ? rows(
        'patients',
        await supabase
          .from('patients')
          .select('phone, name')
          .eq('professional_id', pid)
          .in('phone', phones),
      )
    : [];
  const nameByPhone = new Map(patientRows.map((p) => [p.phone, p.name as string]));
  const lastByPhone = new Map(latestByPhone(history, 60).map((l) => [l.phone, l]));
  const stateByPhone = new Map(state.map((s) => [s.patient_phone, s]));

  const toItem = (phone: string): ConversationItem => {
    const last = lastByPhone.get(phone);
    const st = stateByPhone.get(phone);
    return {
      phone,
      name: nameByPhone.get(phone) ?? null,
      last_message: last?.last_message ?? null,
      last_role: last?.last_role ?? null,
      last_at: last?.last_at ?? null,
      ai_paused: st?.ai_paused ?? false,
      needs_attention: st?.needs_attention ?? false,
    };
  };

  const needsReply = state.filter((s) => s.needs_attention).map((s) => toItem(s.patient_phone));
  const paused = state
    .filter((s) => s.ai_paused && !s.needs_attention)
    .map((s) => toItem(s.patient_phone));
  const recent = recentRaw.map((r) => toItem(r.phone));

  const weeklyBlocks = weekly.length;
  const availabilityConfigured = weeklyBlocks > 0;
  const activeServices = services.filter((s) => s.active).length;
  const setup = buildSetup({
    whatsappConnected: professional.whatsapp_connected,
    weeklyBlocks,
    services: activeServices,
    googleConnected: professional.google_calendar_connected,
  });

  return {
    now,
    professional,
    week,
    today,
    ruler,
    upcoming: upcomingGroups(upcomingRows, now, 6),
    upcomingCount: upcomingRes.count ?? upcomingRows.length,
    aiTotal: aiTotalRes.count ?? 0,
    pending,
    pendingCount: pendingRes.count ?? pending.length,
    serviceNames: Object.fromEntries(services.map((s) => [s.id as string, s.name as string])),
    metrics,
    occupancy,
    attendance: attendanceStats(window, now),
    timeSaved: timeSavedEstimate(metrics.byAi),
    newClients: { week: newClientsRes.count ?? 0, total: totalClientsRes.count ?? 0 },
    setup,
    availabilityConfigured,
    isNew: !availabilityConfigured && (totalApptsRes.count ?? 0) === 0,
    trial: trialInfo(professional.plan_status, professional.trial_ends_at, now),
    needsReply,
    paused,
    recent,
    slots: slots.slice(0, 6).map((s) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
    })),
  };
}
