import { createServerClient } from '@/lib/supabase';

export async function hasAppointmentConflict(
  professionalId: string,
  startsAt: string,
  endsAt: string,
  excludeId?: string,
): Promise<boolean> {
  const supabase = createServerClient();
  let query = supabase
    .from('appointments')
    .select('id')
    .eq('professional_id', professionalId)
    .in('status', ['scheduled', 'confirmed', 'pending_approval'])
    .lt('starts_at', endsAt)
    .gt('ends_at', startsAt);

  if (excludeId) query = query.neq('id', excludeId);

  const { data } = await query.limit(1);
  return (data ?? []).length > 0;
}
