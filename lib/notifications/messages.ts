// Montagem PURA (sem banco, sem rede) do texto de cada notificação. Quem grava
// no banco é `create.ts`; aqui só se decide título, corpo, dados de navegação,
// chave de dedupe e se o aviso já nasce lido. Datas sempre em America/Sao_Paulo
// (via lib/assistant/datetime.ts), nunca no fuso do servidor.
import type { NotificationData, NotificationType } from '../../types/database';
import { formatBrDateTime, saoPauloParts } from '../assistant/datetime';

export type NotificationActor = NonNullable<NotificationData['actor']>;

/** O que `createNotification` grava. */
export interface NotificationDraft {
  type: NotificationType;
  title: string;
  body: string;
  data: NotificationData;
  /** Mesmo evento = mesma chave: reenvio de webhook/cron não duplica o aviso. */
  dedupeKey: string | null;
  /**
   * Já nasce lido: ação do próprio profissional (ele sabe o que fez). Fica no
   * histórico do sino, mas sem selo de não lido nem toast.
   */
  alreadyRead: boolean;
}

/** Atendimento citado pela notificação. */
export interface AppointmentRef {
  id: string;
  patientName: string | null | undefined;
  patientPhone?: string | null;
  /** Início (ISO). */
  startsAt: string;
  serviceName?: string | null;
}

const NAME_FALLBACK = 'Um cliente';

/** Corta o texto no limite, com reticências, sem quebrar o título. */
export function clip(text: string | null | undefined, max: number): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

/** Nome para o título: o que vier do cliente, sem exagero de tamanho. */
export function displayName(name: string | null | undefined): string {
  const clean = clip(name, 40);
  return clean === '' ? NAME_FALLBACK : clean;
}

/** "ter, 18/11 às 14:00" (com o ano só quando não é o ano corrente). */
function when(iso: string, ref?: Date): string {
  return formatBrDateTime(iso, ref);
}

function withService(text: string, serviceName?: string | null): string {
  const service = clip(serviceName, 40);
  return service === '' ? text : `${text} · ${service}`;
}

/** Hora cheia (aaaa-mm-dd-hh) no fuso de SP, para chaves de dedupe por janela. */
function hourBucket(instant: Date): string {
  const p = saoPauloParts(instant);
  return `${p.date}-${String(p.hour).padStart(2, '0')}`;
}

/** Janela de `minutes` minutos (UTC) em que o instante cai; para dedupe curto. */
function windowBucket(instant: Date, minutes: number): string {
  return String(Math.floor(instant.getTime() / (minutes * 60_000)));
}

function appointmentData(
  appointment: AppointmentRef,
  actor: NotificationActor,
  extra: NotificationData = {},
): NotificationData {
  return {
    appointment_id: appointment.id,
    starts_at: appointment.startsAt,
    ...(appointment.patientPhone ? { patient_phone: appointment.patientPhone } : {}),
    actor,
    ...extra,
  };
}

/** Chaves de dedupe: uma por evento real. */
export const dedupeKeys = {
  cancelled: (appointmentId: string) => `cancelled:${appointmentId}`,
  rescheduled: (appointmentId: string, newStartsAt: string) =>
    `rescheduled:${appointmentId}:${newStartsAt}`,
  booked: (appointmentId: string) => `booked:${appointmentId}`,
  pendingApproval: (appointmentId: string) => `pending:${appointmentId}`,
  confirmed: (appointmentId: string) => `confirmed:${appointmentId}`,
  recurrenceStopped: (recurrenceId: string) => `recurrence-stopped:${recurrenceId}`,
  conflict: (appointmentId: string, googleEventId: string) =>
    `conflict:${appointmentId}:${googleEventId}`,
  /** Conversa que pede atenção: no máximo um aviso por contato por hora. */
  attention: (phone: string, now: Date) => `attention:${phone}:${hourBucket(now)}`,
  whatsappDisconnected: (now: Date) => `wa-disconnected:${hourBucket(now)}`,
  reminderFailed: (reminderId: string) => `reminder-failed:${reminderId}`,
  /** Resposta da IA que não saiu: no máximo um aviso por contato a cada 30 min. */
  replyFailed: (phone: string, now: Date) => `reply-failed:${phone}:${windowBucket(now, 30)}`,
};

// ---------- atendimentos ----------

export interface CancelledInput {
  appointment: AppointmentRef;
  actor: NotificationActor;
  /** Motivo informado (cancellation_note). */
  reason?: string | null;
  /** Referência de "agora" para decidir se mostra o ano. */
  ref?: Date;
}

export function buildCancelledNotification(input: CancelledInput): NotificationDraft {
  const { appointment, actor, reason, ref } = input;
  const name = displayName(appointment.patientName);
  const detail = withService(when(appointment.startsAt, ref), appointment.serviceName);
  const note = clip(reason, 120);

  let title: string;
  let body: string;
  if (actor === 'patient') {
    title = `${name} desmarcou`;
    body = `${detail}. O horário voltou a ficar livre.`;
  } else if (actor === 'assistant') {
    title = `O Assistente cancelou o atendimento de ${name}`;
    body = `${detail}. O cliente não foi avisado.`;
  } else {
    title = `Você cancelou o atendimento de ${name}`;
    body = detail;
  }
  if (note !== '') body = `${body} Motivo: ${note}`;

  return {
    type: 'appointment_cancelled',
    title,
    body,
    data: appointmentData(appointment, actor),
    dedupeKey: dedupeKeys.cancelled(appointment.id),
    alreadyRead: actor !== 'patient',
  };
}

export interface RescheduledInput {
  /** Atendimento já com o NOVO horário em `startsAt`. */
  appointment: AppointmentRef;
  previousStartsAt: string;
  actor: NotificationActor;
  ref?: Date;
}

export function buildRescheduledNotification(input: RescheduledInput): NotificationDraft {
  const { appointment, previousStartsAt, actor, ref } = input;
  const name = displayName(appointment.patientName);
  const from = when(previousStartsAt, ref);
  const to = withService(when(appointment.startsAt, ref), appointment.serviceName);

  let title: string;
  if (actor === 'patient') title = `${name} remarcou`;
  else if (actor === 'assistant') title = `O Assistente remarcou o atendimento de ${name}`;
  else title = `Você remarcou o atendimento de ${name}`;

  return {
    type: 'appointment_rescheduled',
    title,
    body: actor === 'assistant' ? `De ${from} para ${to}. O cliente não foi avisado.` : `De ${from} para ${to}.`,
    data: appointmentData(appointment, actor, { previous_starts_at: previousStartsAt }),
    dedupeKey: dedupeKeys.rescheduled(appointment.id, appointment.startsAt),
    alreadyRead: actor !== 'patient',
  };
}

export interface RecurrenceStoppedInput {
  recurrenceId: string;
  patientName: string | null | undefined;
  patientPhone?: string | null;
  /** Quantos atendimentos futuros foram cancelados junto. */
  cancelledCount: number;
}

/** O profissional encerrou uma recorrência: os atendimentos futuros foram cancelados. */
export function buildRecurrenceStoppedNotification(
  input: RecurrenceStoppedInput,
): NotificationDraft {
  const name = displayName(input.patientName);
  const n = input.cancelledCount;
  return {
    type: 'appointment_cancelled',
    title: `Você encerrou a recorrência de ${name}`,
    body:
      n === 1
        ? '1 atendimento futuro foi cancelado. O cliente não foi avisado.'
        : `${n} atendimentos futuros foram cancelados. O cliente não foi avisado.`,
    data: {
      actor: 'professional',
      ...(input.patientPhone ? { patient_phone: input.patientPhone } : {}),
    },
    dedupeKey: dedupeKeys.recurrenceStopped(input.recurrenceId),
    alreadyRead: true,
  };
}

export interface BookedInput {
  appointment: AppointmentRef;
  ref?: Date;
}

/** A secretária agendou pelo WhatsApp (sem aprovação pendente). */
export function buildBookedNotification(input: BookedInput): NotificationDraft {
  const { appointment, ref } = input;
  const name = displayName(appointment.patientName);
  return {
    type: 'appointment_booked',
    title: `${name} agendou pelo WhatsApp`,
    body: withService(when(appointment.startsAt, ref), appointment.serviceName),
    data: appointmentData(appointment, 'patient'),
    dedupeKey: dedupeKeys.booked(appointment.id),
    alreadyRead: false,
  };
}

/** A secretária registrou um pedido que espera a aprovação do profissional. */
export function buildPendingApprovalNotification(input: BookedInput): NotificationDraft {
  const { appointment, ref } = input;
  const name = displayName(appointment.patientName);
  const detail = withService(when(appointment.startsAt, ref), appointment.serviceName);
  return {
    type: 'appointment_pending_approval',
    title: `${name} pediu um horário`,
    body: `${detail}. Aprove ou recuse na agenda.`,
    data: appointmentData(appointment, 'patient'),
    dedupeKey: dedupeKeys.pendingApproval(appointment.id),
    alreadyRead: false,
  };
}

/** O cliente confirmou presença pelo WhatsApp. */
export function buildConfirmedNotification(input: BookedInput): NotificationDraft {
  const { appointment, ref } = input;
  const name = displayName(appointment.patientName);
  return {
    type: 'appointment_confirmed',
    title: `${name} confirmou presença`,
    body: withService(when(appointment.startsAt, ref), appointment.serviceName),
    data: appointmentData(appointment, 'patient'),
    dedupeKey: dedupeKeys.confirmed(appointment.id),
    alreadyRead: false,
  };
}

export interface ConflictInput {
  appointment: AppointmentRef;
  googleEventId: string;
  /** Título do evento do Google Agenda que bate com o atendimento. */
  googleSummary?: string | null;
  ref?: Date;
}

/** Evento do Google Agenda caiu em cima de um atendimento já marcado. */
export function buildConflictNotification(input: ConflictInput): NotificationDraft {
  const { appointment, googleEventId, googleSummary, ref } = input;
  const name = displayName(appointment.patientName);
  const event = clip(googleSummary, 50);
  const eventLabel = event === '' ? 'Um evento do Google Agenda' : `"${event}" no Google Agenda`;
  return {
    type: 'appointment_conflict',
    title: 'Conflito na sua agenda',
    body: `${eventLabel} bate com o atendimento de ${name} (${when(appointment.startsAt, ref)}).`,
    data: appointmentData(appointment, 'system'),
    dedupeKey: dedupeKeys.conflict(appointment.id, googleEventId),
    alreadyRead: false,
  };
}

// ---------- conversas ----------

export type AttentionReason =
  | 'approval_needed'
  | 'handoff'
  | 'fallback'
  | 'paused';

export interface AttentionInput {
  reason: AttentionReason;
  patientName?: string | null;
  patientPhone: string;
  /** Última mensagem do cliente (citada no corpo, cortada). */
  lastMessage?: string | null;
  now?: Date;
}

export function buildConversationAttentionNotification(
  input: AttentionInput,
): NotificationDraft {
  const { reason, patientPhone, lastMessage } = input;
  const now = input.now ?? new Date();
  const name = displayName(input.patientName);
  const quote = clip(lastMessage, 100);

  let title: string;
  let body: string;
  if (reason === 'approval_needed') {
    title = `${name} espera a sua resposta`;
    body = 'A secretária precisa de uma decisão sua para continuar.';
  } else if (reason === 'handoff') {
    title = `${name} precisa de você`;
    body = 'A secretária não soube responder e passou a conversa para você.';
  } else if (reason === 'paused') {
    title = `${name} escreveu e a IA está pausada`;
    body = 'A secretária não responde essa conversa enquanto estiver pausada.';
  } else {
    title = `A secretária não entendeu ${name}`;
    body = 'Ela não conseguiu responder as últimas mensagens. Vale dar uma olhada.';
  }
  if (quote !== '') body = `${body} “${quote}”`;

  return {
    type: 'conversation_attention',
    title,
    body,
    data: { patient_phone: patientPhone, actor: 'patient' },
    dedupeKey: dedupeKeys.attention(patientPhone, now),
    alreadyRead: false,
  };
}

// ---------- WhatsApp ----------

export function buildWhatsappDisconnectedNotification(now: Date = new Date()): NotificationDraft {
  return {
    type: 'whatsapp_disconnected',
    title: 'WhatsApp desconectado',
    body: 'A secretária parou de responder seus clientes. Reconecte o número para voltar a atender.',
    data: { actor: 'system' },
    dedupeKey: dedupeKeys.whatsappDisconnected(now),
    alreadyRead: false,
  };
}

export interface ReminderFailedInput {
  reminderId: string;
  appointment: AppointmentRef;
  /** Tipo do lembrete que falhou. */
  reminderType: '24h' | '2h';
  /** Motivo curto (error_message do envio). */
  reason?: string | null;
  ref?: Date;
}

export function buildReminderFailedNotification(input: ReminderFailedInput): NotificationDraft {
  const { reminderId, appointment, reminderType, reason, ref } = input;
  const name = displayName(appointment.patientName);
  const why = clip(reason, 100);
  const body = `Lembrete de ${reminderType} do atendimento de ${when(appointment.startsAt, ref)}${
    why === '' ? '.' : `: ${why}.`
  }`;
  return {
    type: 'message_failed',
    title: `Lembrete não enviado para ${name}`,
    body,
    data: appointmentData(appointment, 'system'),
    dedupeKey: dedupeKeys.reminderFailed(reminderId),
    alreadyRead: false,
  };
}

export interface ReplyFailedInput {
  patientName?: string | null;
  patientPhone: string;
  reason?: string | null;
  now?: Date;
}

export function buildReplyFailedNotification(input: ReplyFailedInput): NotificationDraft {
  const now = input.now ?? new Date();
  const name = displayName(input.patientName);
  const why = clip(input.reason, 100);
  return {
    type: 'message_failed',
    title: `Resposta não enviada para ${name}`,
    body: `A mensagem da secretária não foi entregue${why === '' ? '.' : `: ${why}.`} Confira o WhatsApp.`,
    data: { patient_phone: input.patientPhone, actor: 'system' },
    dedupeKey: dedupeKeys.replyFailed(input.patientPhone, now),
    alreadyRead: false,
  };
}
