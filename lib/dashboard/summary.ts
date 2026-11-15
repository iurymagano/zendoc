// Agregações PURAS do painel inicial (sem banco, sem rede): o dia, os próximos
// atendimentos, os números da semana, comparecimento, tempo economizado (estimativa)
// e as conversas recentes. Datas sempre em America/Sao_Paulo.
import { isPersonalCommitment } from '../appointments/personal';
import {
  addDaysToDate,
  formatBrDate,
  saoPauloParts,
} from '../assistant/datetime';
import type { AppointmentStatus, BookedVia } from '../../types/database';
import { weekOf } from './schedule';

export type DashAppointment = {
  id: string;
  patient_name: string;
  patient_phone: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  booked_via: BookedVia;
  service_id: string | null;
};

const ACTIVE: AppointmentStatus[] = ['scheduled', 'confirmed', 'pending_approval'];

export const isActiveStatus = (s: AppointmentStatus) => ACTIVE.includes(s);

const startMs = (a: { starts_at: string }) => Date.parse(a.starts_at);
const endMs = (a: { ends_at: string }) => Date.parse(a.ends_at);
const dateOf = (iso: string) => saoPauloParts(new Date(iso)).date;
const byStart = (a: DashAppointment, b: DashAppointment) => startMs(a) - startMs(b);

export type TodaySummary = {
  /** Atendimentos (de clientes) ativos hoje. */
  clientCount: number;
  /** Compromissos pessoais ativos hoje. */
  personalCount: number;
  /** Atendimentos de clientes de hoje que já terminaram. */
  doneCount: number;
  /** Tudo que está ativo hoje, por horário. */
  items: DashAppointment[];
  /** Em andamento agora (começou e ainda não terminou). */
  current: DashAppointment | null;
  /** O próximo a começar hoje. */
  next: DashAppointment | null;
};

export function todaySummary(appts: DashAppointment[], now: Date): TodaySummary {
  const today = saoPauloParts(now).date;
  const nowMs = now.getTime();
  const items = appts
    .filter((a) => isActiveStatus(a.status) && dateOf(a.starts_at) === today)
    .sort(byStart);
  const client = items.filter((a) => !isPersonalCommitment(a.patient_phone));
  return {
    clientCount: client.length,
    personalCount: items.length - client.length,
    doneCount: client.filter((a) => endMs(a) <= nowMs).length,
    items,
    current: items.find((a) => startMs(a) <= nowMs && endMs(a) > nowMs) ?? null,
    next: items.find((a) => startMs(a) > nowMs) ?? null,
  };
}

export type UpcomingGroup = { label: string; date: string; items: DashAppointment[] };

/** "Hoje", "Amanhã" ou "ter, 18/11". */
export function dayLabel(date: string, now: Date): string {
  const today = saoPauloParts(now).date;
  if (date === today) return 'Hoje';
  if (date === addDaysToDate(today, 1)) return 'Amanhã';
  return formatBrDate(date, now);
}

/** Próximos atendimentos ativos (inclui o que está em andamento), agrupados por dia. */
export function upcomingGroups(
  appts: DashAppointment[],
  now: Date,
  limit = 6,
): UpcomingGroup[] {
  const nowMs = now.getTime();
  const next = appts
    .filter((a) => isActiveStatus(a.status) && endMs(a) > nowMs)
    .sort(byStart)
    .slice(0, limit);
  const groups: UpcomingGroup[] = [];
  for (const a of next) {
    const date = dateOf(a.starts_at);
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.items.push(a);
    else groups.push({ date, label: dayLabel(date, now), items: [a] });
  }
  return groups;
}

export type WeekMetrics = {
  /** Atendimentos de clientes na semana, sem os cancelados. */
  total: number;
  /** Desses, quantos a IA agendou pelo WhatsApp. */
  byAi: number;
  /** Ainda por vir (começam depois de agora). */
  remaining: number;
  /** Cancelados na semana. */
  cancelled: number;
};

/** Números da semana (segunda a domingo). `appts` pode ter linhas de fora da semana. */
export function weekMetrics(appts: DashAppointment[], now: Date): WeekMetrics {
  const week = weekOf(now);
  const nowMs = now.getTime();
  const inWeek = appts.filter((a) => {
    const d = dateOf(a.starts_at);
    return d >= week.start && d <= week.end && !isPersonalCommitment(a.patient_phone);
  });
  const kept = inWeek.filter((a) => a.status !== 'cancelled');
  return {
    total: kept.length,
    byAi: kept.filter((a) => a.booked_via === 'whatsapp_ai').length,
    remaining: kept.filter((a) => startMs(a) > nowMs && a.status !== 'no_show').length,
    cancelled: inWeek.length - kept.length,
  };
}

export type Attendance = {
  /** Atendimentos de clientes que já passaram (últimos `days` dias), sem cancelados. */
  held: number;
  noShow: number;
  cancelled: number;
  /** held + cancelled: tudo o que chegou a ser marcado e já passou. */
  scheduled: number;
  /** 0–100: dos que passaram, quantos NÃO foram marcados como falta. null sem base. */
  attendancePct: number | null;
  /** 0–100: cancelados sobre tudo o que foi marcado. null sem base. */
  cancelPct: number | null;
  /** Menos de `minBase` atendimentos passados: a taxa não diz muito. */
  enoughBase: boolean;
  days: number;
};

/**
 * Comparecimento e cancelamento dos atendimentos de clientes que já passaram nos
 * últimos `days` dias. "Compareceu" é tudo que passou sem ser marcado como falta
 * (`no_show`): o sistema não registra presença, só a falta que o profissional marca.
 */
export function attendanceStats(
  appts: DashAppointment[],
  now: Date,
  days = 30,
  minBase = 5,
): Attendance {
  const nowMs = now.getTime();
  const from = nowMs - days * 86_400_000;
  const past = appts.filter(
    (a) =>
      !isPersonalCommitment(a.patient_phone) &&
      startMs(a) < nowMs &&
      startMs(a) >= from,
  );
  const cancelled = past.filter((a) => a.status === 'cancelled').length;
  const heldRows = past.filter((a) => a.status !== 'cancelled');
  const noShow = heldRows.filter((a) => a.status === 'no_show').length;
  const held = heldRows.length;
  const scheduled = held + cancelled;
  return {
    held,
    noShow,
    cancelled,
    scheduled,
    attendancePct: held > 0 ? Math.round(((held - noShow) / held) * 100) : null,
    cancelPct: scheduled > 0 ? Math.round((cancelled / scheduled) * 100) : null,
    enoughBase: held >= minBase,
    days,
  };
}

/** "45 min", "1h", "1h20". */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h}h` : `${h}h${String(rest).padStart(2, '0')}`;
}

export type TimeSaved = {
  minutes: number;
  /** "1h20" */
  label: string;
  /** A conta à mostra: "16 agendamentos pela IA × 5 min". */
  formula: string;
};

/**
 * ESTIMATIVA, não medição: cada agendamento feito pela IA vale `minutesEach` minutos
 * de conversa que o profissional não precisou ter. Devolve null sem agendamento da IA.
 */
export function timeSavedEstimate(byAi: number, minutesEach = 5): TimeSaved | null {
  if (byAi <= 0) return null;
  const minutes = byAi * minutesEach;
  return {
    minutes,
    label: formatDuration(minutes),
    formula: `${byAi} ${byAi === 1 ? 'agendamento' : 'agendamentos'} pela IA × ${minutesEach} min`,
  };
}

export type HistoryRow = {
  patient_phone: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export type LastContact = {
  phone: string;
  last_message: string;
  last_role: 'user' | 'assistant';
  last_at: string;
};

/** Último contato de cada telefone. `rows` vem da mais recente para a mais antiga. */
export function latestByPhone(rows: HistoryRow[], limit = 5): LastContact[] {
  const seen = new Map<string, LastContact>();
  for (const r of rows) {
    if (seen.has(r.patient_phone)) continue;
    seen.set(r.patient_phone, {
      phone: r.patient_phone,
      last_message: r.content,
      last_role: r.role,
      last_at: r.created_at,
    });
    if (seen.size >= limit) break;
  }
  return [...seen.values()];
}

/** Texto numa linha só, cortado com reticência. */
export function snippet(text: string, max = 80): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}

/** "agora", "há 12 min", "hoje 14:20", "ontem 09:05" ou "ter, 12/11". */
export function relativeTime(iso: string, now: Date): string {
  const diffMin = Math.floor((now.getTime() - Date.parse(iso)) / 60_000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  const p = saoPauloParts(new Date(iso));
  const today = saoPauloParts(now).date;
  if (p.date === today) return `hoje ${p.time}`;
  if (p.date === addDaysToDate(today, -1)) return `ontem ${p.time}`;
  return formatBrDate(p.date, now);
}
