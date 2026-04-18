import { createServerClient } from '@/lib/supabase';
import type { AIResponse, Professional } from '@/types/database';

export async function executeAction(
  professional: Professional,
  patientPhone: string,
  response: AIResponse,
): Promise<void> {
  const supabase = createServerClient();

  if (response.action === 'book' && response.booking) {
    const { data: patient } = await supabase
      .from('patients')
      .upsert(
        {
          professional_id: professional.id,
          phone: patientPhone,
          name: 'Paciente',
        },
        { onConflict: 'professional_id,phone' },
      )
      .select()
      .single();

    const status = professional.requires_approval
      ? 'pending_approval'
      : 'scheduled';

    await supabase.from('appointments').insert({
      professional_id: professional.id,
      patient_id: patient?.id ?? null,
      patient_name: patient?.name ?? 'Paciente',
      patient_phone: patientPhone,
      starts_at: response.booking.starts_at,
      ends_at: response.booking.ends_at,
      status,
      booked_via: 'whatsapp_ai',
    });
    return;
  }

  if (response.action === 'cancel' && response.cancel) {
    await supabase
      .from('appointments')
      .update({ status: 'cancelled', cancelled_by: 'patient' })
      .eq('id', response.cancel.appointment_id)
      .eq('professional_id', professional.id);
    return;
  }

  if (response.action === 'reschedule' && response.cancel && response.booking) {
    await supabase
      .from('appointments')
      .update({ status: 'cancelled', cancelled_by: 'patient' })
      .eq('id', response.cancel.appointment_id)
      .eq('professional_id', professional.id);

    await executeAction(professional, patientPhone, {
      ...response,
      action: 'book',
    });
  }
}
