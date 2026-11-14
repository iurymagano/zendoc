import { createServerClient } from '@/lib/supabase';

export type ConflictingAppointment = {
  id: string;
  patient_name: string;
  starts_at: string;
  ends_at: string;
};

/** Agendamentos ativos que se sobrepõem à janela [startsAt, endsAt). */
export async function findConflictingAppointments(
  professionalId: string,
  startsAt: string,
  endsAt: string,
  excludeId?: string,
  limit = 3,
): Promise<ConflictingAppointment[]> {
  const supabase = createServerClient();
  let query = supabase
    .from('appointments')
    .select('id, patient_name, starts_at, ends_at')
    .eq('professional_id', professionalId)
    .in('status', ['scheduled', 'confirmed', 'pending_approval'])
    .lt('starts_at', endsAt)
    .gt('ends_at', startsAt);

  if (excludeId) query = query.neq('id', excludeId);

  const { data } = await query.order('starts_at').limit(limit);
  return (data ?? []) as ConflictingAppointment[];
}

export async function hasAppointmentConflict(
  professionalId: string,
  startsAt: string,
  endsAt: string,
  excludeId?: string,
): Promise<boolean> {
  return (
    (await findConflictingAppointments(
      professionalId,
      startsAt,
      endsAt,
      excludeId,
      1,
    )).length > 0
  );
}
