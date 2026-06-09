import { createServerClient } from '@/lib/supabase';
import { hasAppointmentConflict } from '@/lib/appointments/conflicts';
import { syncAppointmentToGoogle } from '@/lib/google/appointment-sync';
import type { Appointment, Recurrence } from '@/types/database';

const TZ = 'America/Sao_Paulo';
const DEFAULT_HORIZON_WEEKS = 8;
const MAX_OCCURRENCES = 60; // backstop contra loop

/** Data de hoje (yyyy-MM-dd) no fuso do consultório. */
function todayKey(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(new Date());
}

/** Chave de dia (yyyy-MM-dd, fuso do consultório) de um ISO. */
function dayKey(iso: string): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(
    new Date(iso),
  );
}

/** Soma dias a uma data yyyy-MM-dd sem cair em armadilha de DST. */
function addDaysKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
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
 */
export async function materializeRecurrence(
  recurrence: Recurrence,
  horizonWeeks = DEFAULT_HORIZON_WEEKS,
): Promise<{ created: number; skipped: number }> {
  if (!recurrence.active) return { created: 0, skipped: 0 };

  const supabase = createServerClient();
  const today = todayKey();
  const horizon = addDaysKey(today, horizonWeeks * 7);
  const end =
    recurrence.until && recurrence.until < horizon ? recurrence.until : horizon;

  // Dias já materializados desta série (evita duplicar).
  const { data: existing } = await supabase
    .from('appointments')
    .select('starts_at')
    .eq('recurrence_id', recurrence.id);
  const existingDays = new Set((existing ?? []).map((a) => dayKey(a.starts_at)));

  const step = recurrence.interval_weeks * 7;
  const startTime = normTime(recurrence.start_time);
  const endTime = normTime(recurrence.end_time);

  let created = 0;
  let skipped = 0;

  let date = recurrence.start_date;
  for (let i = 0; i < MAX_OCCURRENCES && date <= end; i++, date = addDaysKey(date, step)) {
    if (date < today) continue; // ocorrência no passado
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

  for (const appt of (future ?? []) as Appointment[]) {
    await syncAppointmentToGoogle(appt);
  }

  return { cancelled: (future ?? []).length };
}
