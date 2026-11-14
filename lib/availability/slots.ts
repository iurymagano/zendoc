import { addDaysToDate, saoPauloParts } from '@/lib/assistant/datetime';
import { createServerClient } from '@/lib/supabase';
import type {
  AvailabilityException,
  AvailabilityWeekly,
} from '@/types/database';
import { computeSlots, type Slot } from './compute';

export type { Slot } from './compute';

/**
 * Horários livres dos próximos `days` dias (a partir de amanhã), em
 * America/Sao_Paulo. Busca os dados e delega a conta a `computeSlots`.
 */
export async function getAvailableSlots(
  professionalId: string,
  days = 14,
): Promise<Slot[]> {
  const supabase = createServerClient();
  const now = new Date();

  const { data: prof } = await supabase
    .from('professionals')
    .select('buffer_min')
    .eq('id', professionalId)
    .maybeSingle();

  const { data: weekly } = await supabase
    .from('availability_weekly')
    .select('*')
    .eq('professional_id', professionalId)
    .eq('is_active', true)
    .neq('block_type', 'lunch');

  // Datas de calendário no fuso de São Paulo (e não do servidor).
  const today = saoPauloParts(now).date;
  const from = today;
  const to = addDaysToDate(today, days);

  const { data: exceptions } = await supabase
    .from('availability_exceptions')
    .select('*')
    .eq('professional_id', professionalId)
    .gte('date', from)
    .lte('date', to);

  const { data: existing } = await supabase
    .from('appointments')
    .select('starts_at, ends_at')
    .eq('professional_id', professionalId)
    .gte('starts_at', now.toISOString())
    .in('status', ['scheduled', 'confirmed', 'pending_approval']);

  // Eventos pessoais sincronizados do Google Calendar também bloqueiam slots.
  const { data: googleBusy } = await supabase
    .from('google_busy_events')
    .select('starts_at, ends_at')
    .eq('professional_id', professionalId)
    .gte('ends_at', now.toISOString());

  return computeSlots({
    now,
    days,
    weekly: (weekly ?? []) as AvailabilityWeekly[],
    exceptions: (exceptions ?? []) as AvailabilityException[],
    busy: [...(existing ?? []), ...(googleBusy ?? [])],
    bufferMin: prof?.buffer_min ?? 0,
  });
}
