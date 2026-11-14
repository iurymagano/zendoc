import { createServerClient } from '@/lib/supabase';

const OFFSET_MS: Record<'24h' | '2h', number> = {
  '24h': 24 * 60 * 60_000,
  '2h': 2 * 60 * 60_000,
};

/**
 * Recalcula `scheduled_for` dos lembretes AINDA PENDENTES de um agendamento
 * depois que o horário mudou. O trigger do banco só cria lembretes no
 * insert/mudança de status, então sem isso o lembrete dispararia no horário
 * antigo. Lembretes já enviados/cancelados não são tocados.
 */
export async function rescheduleAppointmentReminders(
  appointmentId: string,
  newStartsAt: string,
): Promise<void> {
  const supabase = createServerClient();
  const start = new Date(newStartsAt).getTime();
  for (const type of ['24h', '2h'] as const) {
    const { error } = await supabase
      .from('reminders')
      .update({ scheduled_for: new Date(start - OFFSET_MS[type]).toISOString() })
      .eq('appointment_id', appointmentId)
      .eq('type', type)
      .eq('status', 'pending');
    if (error) {
      console.error(`Erro ao reagendar lembrete ${type}:`, error);
    }
  }
}

/**
 * Cancela os lembretes pendentes de um agendamento (usado em compromissos
 * pessoais: não há cliente para receber mensagem).
 */
export async function cancelPendingAppointmentReminders(
  appointmentId: string,
): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('reminders')
    .update({ status: 'cancelled', error_message: 'Compromisso sem cliente' })
    .eq('appointment_id', appointmentId)
    .eq('status', 'pending');
  if (error) {
    console.error('Erro ao cancelar lembretes do compromisso:', error);
  }
}
