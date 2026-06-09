import { createServerClient } from '@/lib/supabase';
import { deleteAppointmentEvent, pushAppointment } from '@/lib/google/calendar';
import type { Appointment, Professional } from '@/types/database';

async function loadProfessional(
  professionalId: string,
): Promise<Professional | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('professionals')
    .select('*')
    .eq('id', professionalId)
    .maybeSingle();
  return (data as Professional) ?? null;
}

/**
 * Reflete um appointment no Google Calendar conforme o status:
 *  - ativo (scheduled/confirmed/pending_approval) → cria ou atualiza o evento
 *  - inativo (cancelled/no_show)                  → remove o evento, se existir
 *
 * Best-effort: nunca lança (apenas loga) — a operação principal no IAzen não
 * pode quebrar porque o Google falhou. Recebe a linha já persistida no banco.
 */
export async function syncAppointmentToGoogle(
  appointment: Appointment,
): Promise<void> {
  try {
    const professional = await loadProfessional(appointment.professional_id);
    if (!professional?.google_calendar_connected) return;

    const inactive =
      appointment.status === 'cancelled' || appointment.status === 'no_show';

    if (inactive) {
      if (appointment.google_event_id) {
        await deleteAppointmentEvent(professional, appointment.google_event_id);
      }
      return;
    }

    await pushAppointment(professional, appointment);
  } catch (e) {
    console.error('Google sync (appointment) falhou:', e);
  }
}
