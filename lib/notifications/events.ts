// Ganchos de notificação para os fluxos do app (SERVER-ONLY). Cada função monta
// o texto (messages.ts), grava (create.ts) e NUNCA lança: o chamador só faz
// `await notifyX(...)` no ponto onde o evento aconteceu. Atendimentos sem
// cliente (compromisso pessoal) não geram aviso.
import { createServerClient } from '@/lib/supabase';
import { isPersonalCommitment } from '@/lib/appointments/personal';
import { formatPhoneBR } from '@/lib/phone';
import type { Appointment } from '@/types/database';
import { createNotification } from './create';
import {
  buildBookedNotification,
  buildCancelledNotification,
  buildConfirmedNotification,
  buildConflictNotification,
  buildConversationAttentionNotification,
  buildPendingApprovalNotification,
  buildRecurrenceStoppedNotification,
  buildReminderFailedNotification,
  buildReplyFailedNotification,
  buildRescheduledNotification,
  buildWhatsappDisconnectedNotification,
  type AppointmentRef,
  type AttentionReason,
  type NotificationActor,
} from './messages';

/** O mínimo de um atendimento que os avisos precisam. */
export type AppointmentLike = Pick<
  Appointment,
  'id' | 'patient_name' | 'patient_phone' | 'starts_at'
> & { status: string; service_id?: string | null };

/** Nome do serviço (se houver), para o corpo do aviso. Falha → sem serviço. */
async function serviceNameOf(
  professionalId: string,
  serviceId: string | null | undefined,
): Promise<string | null> {
  if (!serviceId) return null;
  try {
    const { data } = await createServerClient()
      .from('services')
      .select('name')
      .eq('id', serviceId)
      .eq('professional_id', professionalId)
      .maybeSingle();
    return (data?.name as string | undefined) ?? null;
  } catch {
    return null;
  }
}

/** Nome do cliente pelo telefone (cadastro); sem cadastro, o telefone formatado. */
async function patientLabel(
  professionalId: string,
  phone: string,
  given?: string | null,
): Promise<string | null> {
  if (given && given.trim() !== '') return given;
  try {
    const { data } = await createServerClient()
      .from('patients')
      .select('name')
      .eq('professional_id', professionalId)
      .eq('phone', phone)
      .maybeSingle();
    const name = (data?.name as string | undefined)?.trim();
    if (name) return name;
  } catch {
    // sem nome: cai no telefone
  }
  // @lid (identificador oculto do WhatsApp) não é telefone: sem rótulo útil.
  return /^\d+$/.test(phone) ? formatPhoneBR(phone) : null;
}

async function refOf(professionalId: string, appt: AppointmentLike): Promise<AppointmentRef> {
  return {
    id: appt.id,
    patientName: appt.patient_name,
    patientPhone: appt.patient_phone,
    startsAt: appt.starts_at,
    serviceName: await serviceNameOf(professionalId, appt.service_id),
  };
}

/** Roda o corpo sem nunca propagar erro (o aviso é secundário ao fluxo). */
async function safely(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.error(`notificação (${label}) falhou:`, err);
  }
}

/** Atendimento cancelado (pelo cliente, pelo profissional ou pelo Assistente). */
export async function notifyAppointmentCancelled(
  professionalId: string,
  appt: AppointmentLike,
  actor: NotificationActor,
  reason?: string | null,
): Promise<void> {
  if (isPersonalCommitment(appt.patient_phone)) return;
  await safely('cancelado', async () => {
    const appointment = await refOf(professionalId, appt);
    await createNotification(
      professionalId,
      buildCancelledNotification({ appointment, actor, reason }),
    );
  });
}

/** Atendimento remarcado. `appt` já traz o NOVO horário. */
export async function notifyAppointmentRescheduled(
  professionalId: string,
  appt: AppointmentLike,
  previousStartsAt: string,
  actor: NotificationActor,
): Promise<void> {
  if (isPersonalCommitment(appt.patient_phone)) return;
  await safely('remarcado', async () => {
    const appointment = await refOf(professionalId, appt);
    await createNotification(
      professionalId,
      buildRescheduledNotification({ appointment, previousStartsAt, actor }),
    );
  });
}

/**
 * A secretária criou um atendimento pelo WhatsApp: "agendou" ou, quando o
 * profissional exige aprovação, "pediu um horário" (com link para a agenda).
 */
export async function notifyAppointmentBookedByAi(
  professionalId: string,
  appt: AppointmentLike,
): Promise<void> {
  if (isPersonalCommitment(appt.patient_phone)) return;
  await safely('agendado pela IA', async () => {
    const appointment = await refOf(professionalId, appt);
    const draft =
      appt.status === 'pending_approval'
        ? buildPendingApprovalNotification({ appointment })
        : buildBookedNotification({ appointment });
    await createNotification(professionalId, draft);
  });
}

/** Pedido de horário aguardando aprovação (usado também quando é uma remarcação). */
export async function notifyAppointmentPendingApproval(
  professionalId: string,
  appt: AppointmentLike,
): Promise<void> {
  if (isPersonalCommitment(appt.patient_phone)) return;
  await safely('aguardando aprovação', async () => {
    const appointment = await refOf(professionalId, appt);
    await createNotification(professionalId, buildPendingApprovalNotification({ appointment }));
  });
}

/** O cliente confirmou presença pelo WhatsApp. */
export async function notifyAppointmentConfirmed(
  professionalId: string,
  appt: AppointmentLike,
): Promise<void> {
  if (isPersonalCommitment(appt.patient_phone)) return;
  await safely('confirmado', async () => {
    const appointment = await refOf(professionalId, appt);
    await createNotification(professionalId, buildConfirmedNotification({ appointment }));
  });
}

/** O profissional encerrou uma recorrência (cancelou os atendimentos futuros da série). */
export async function notifyRecurrenceStopped(
  professionalId: string,
  input: {
    recurrenceId: string;
    patientName: string | null | undefined;
    patientPhone?: string | null;
    cancelledCount: number;
  },
): Promise<void> {
  if (input.cancelledCount <= 0) return;
  await safely('recorrência encerrada', async () => {
    await createNotification(professionalId, buildRecurrenceStoppedNotification(input));
  });
}

/** Conversa que precisa do profissional (decisão, pedido de humano, IA perdida, IA pausada). */
export async function notifyConversationAttention(
  professionalId: string,
  input: {
    reason: AttentionReason;
    patientPhone: string;
    patientName?: string | null;
    lastMessage?: string | null;
  },
): Promise<void> {
  await safely('conversa precisa de atenção', async () => {
    const patientName = await patientLabel(professionalId, input.patientPhone, input.patientName);
    await createNotification(
      professionalId,
      buildConversationAttentionNotification({ ...input, patientName }),
    );
  });
}

/** O número do WhatsApp caiu (connection.update close/logout). */
export async function notifyWhatsappDisconnected(professionalId: string): Promise<void> {
  await safely('WhatsApp desconectado', async () => {
    await createNotification(professionalId, buildWhatsappDisconnectedNotification());
  });
}

/** Lembrete que não pôde ser enviado ao cliente. */
export async function notifyReminderFailed(
  professionalId: string,
  input: {
    reminderId: string;
    reminderType: '24h' | '2h';
    appointment: AppointmentLike;
    reason?: string | null;
  },
): Promise<void> {
  if (isPersonalCommitment(input.appointment.patient_phone)) return;
  await safely('lembrete não enviado', async () => {
    const appointment = await refOf(professionalId, input.appointment);
    await createNotification(
      professionalId,
      buildReminderFailedNotification({
        reminderId: input.reminderId,
        reminderType: input.reminderType,
        reason: input.reason,
        appointment,
      }),
    );
  });
}

/** Resposta da secretária que não chegou ao cliente. */
export async function notifyReplyFailed(
  professionalId: string,
  input: { patientPhone: string; patientName?: string | null; reason?: string | null },
): Promise<void> {
  await safely('resposta não enviada', async () => {
    const patientName = await patientLabel(professionalId, input.patientPhone, input.patientName);
    await createNotification(
      professionalId,
      buildReplyFailedNotification({ ...input, patientName }),
    );
  });
}

/** Evento do Google Agenda bate com um atendimento já marcado. */
export async function notifyScheduleConflict(
  professionalId: string,
  input: { appointment: AppointmentLike; googleEventId: string; googleSummary?: string | null },
): Promise<void> {
  if (isPersonalCommitment(input.appointment.patient_phone)) return;
  await safely('conflito', async () => {
    const appointment = await refOf(professionalId, input.appointment);
    await createNotification(
      professionalId,
      buildConflictNotification({
        appointment,
        googleEventId: input.googleEventId,
        googleSummary: input.googleSummary,
      }),
    );
  });
}
