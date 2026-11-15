import { createServerClient } from '@/lib/supabase';
import { hasAppointmentConflict } from '@/lib/appointments/conflicts';
import { syncAppointmentToGoogle } from '@/lib/google/appointment-sync';
import { notifyRecurrenceStopped } from '@/lib/notifications/events';
import { occurrenceDates } from '@/lib/recurrences/dates';
import type { Appointment, Recurrence } from '@/types/database';

const TZ = 'America/Sao_Paulo';
const DEFAULT_HORIZON_WEEKS = 8;
const MAX_OCCURRENCES = 60; // backstop contra loop

/** Data de hoje (yyyy-MM-dd) no fuso da agenda. */
function todayKey(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(new Date());
}

/** Chave de dia (yyyy-MM-dd, fuso da agenda) de um ISO. */
function dayKey(iso: string): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(
    new Date(iso),
  );
}

/** 'HH:mm' → 'HH:mm:00'; mantém 'HH:mm:ss'. */
function normTime(t: string): string {
  return t.length === 5 ? `${t}:00` : t;
}

/**
 * Materializa as próximas ocorrências da recorrência como appointments reais,
 * dentro da janela [hoje, hoje + horizonWeeks] (limitada por `until`). É
 * idempotente: pula dias já materializados e horários em conflito. Cada
 * appointment criado é espelhado no Google (best-effort).
 *
 * `includePastStart` (só na criação da série) cria também a 1ª data quando ela
 * já passou: é o dia escolhido no formulário e não pode sumir da agenda.
 */
export async function materializeRecurrence(
  recurrence: Recurrence,
  horizonWeeks = DEFAULT_HORIZON_WEEKS,
  { includePastStart = false }: { includePastStart?: boolean } = {},
): Promise<{ created: number; skipped: number }> {
  if (!recurrence.active) return { created: 0, skipped: 0 };

  const supabase = createServerClient();
  const dates = occurrenceDates(
    {
      startDate: recurrence.start_date,
      intervalWeeks: recurrence.interval_weeks,
      until: recurrence.until,
    },
    { today: todayKey(), horizonWeeks, includePastStart, max: MAX_OCCURRENCES },
  );

  // Dias já materializados desta série (evita duplicar).
  const { data: existing } = await supabase
    .from('appointments')
    .select('starts_at')
    .eq('recurrence_id', recurrence.id);
  const existingDays = new Set((existing ?? []).map((a) => dayKey(a.starts_at)));

  const startTime = normTime(recurrence.start_time);
  const endTime = normTime(recurrence.end_time);

  let created = 0;
  let skipped = 0;

  for (const date of dates) {
    if (existingDays.has(date)) continue; // já materializada

    const startsAt = `${date}T${startTime}-03:00`;
    const endsAt = `${date}T${endTime}-03:00`;

    if (await hasAppointmentConflict(recurrence.professional_id, startsAt, endsAt)) {
      skipped++;
      continue;
    }

    const { data: appt } = await supabase
      .from('appointments')
      .insert({
        professional_id: recurrence.professional_id,
        patient_id: recurrence.patient_id,
        patient_name: recurrence.patient_name,
        patient_phone: recurrence.patient_phone,
        starts_at: startsAt,
        ends_at: endsAt,
        status: 'scheduled',
        booked_via: 'manual',
        notes: recurrence.notes,
        recurrence_id: recurrence.id,
      })
      .select()
      .single();

    if (appt) {
      created++;
      await syncAppointmentToGoogle(appt as Appointment);
    }
  }

  return { created, skipped };
}

/**
 * Encerra a série: desativa a recorrência e cancela as ocorrências FUTURAS
 * ainda ativas (as passadas e as já editadas individualmente ficam intactas).
 * Remove os eventos correspondentes no Google.
 */
export async function stopRecurrence(
  recurrenceId: string,
  professionalId: string,
): Promise<{ cancelled: number }> {
  const supabase = createServerClient();

  await supabase
    .from('recurrences')
    .update({ active: false })
    .eq('id', recurrenceId)
    .eq('professional_id', professionalId);

  const { data: future } = await supabase
    .from('appointments')
    .update({ status: 'cancelled', cancelled_by: 'professional' })
    .eq('recurrence_id', recurrenceId)
    .eq('professional_id', professionalId)
    .gte('starts_at', new Date().toISOString())
    .in('status', ['scheduled', 'confirmed', 'pending_approval'])
    .select();

  const cancelledList = (future ?? []) as Appointment[];
  for (const appt of cancelledList) {
    await syncAppointmentToGoogle(appt);
  }

  // Um aviso só para a série (não um por ocorrência); nasce lido (foi o dono).
  if (cancelledList.length > 0) {
    await notifyRecurrenceStopped(professionalId, {
      recurrenceId,
      patientName: cancelledList[0].patient_name,
      patientPhone: cancelledList[0].patient_phone,
      cancelledCount: cancelledList.length,
    });
  }

  return { cancelled: cancelledList.length };
}
