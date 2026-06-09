import { createServerClient } from '@/lib/supabase';
import { syncAppointmentToGoogle } from '@/lib/google/appointment-sync';
import type { AIResponse, Professional } from '@/types/database';

export async function executeAction(
  professional: Professional,
  patientPhone: string,
  response: AIResponse,
): Promise<void> {
  const supabase = createServerClient();

  if (response.action === 'book' && response.booking) {
    // Nome: usa o que a IA capturou; se não veio, preserva o nome já cadastrado
    // (não reescreve com o placeholder); só cai em "Paciente" se não houver nada.
    const providedName = response.booking.patient_name?.trim();
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('name')
      .eq('professional_id', professional.id)
      .eq('phone', patientPhone)
      .maybeSingle();
    const patientName = providedName || existingPatient?.name || 'Paciente';

    const { data: patient } = await supabase
      .from('patients')
      .upsert(
        {
          professional_id: professional.id,
          phone: patientPhone,
          name: patientName,
        },
        { onConflict: 'professional_id,phone' },
      )
      .select()
      .single();

    const status = professional.requires_approval
      ? 'pending_approval'
      : 'scheduled';

    const { data: created } = await supabase
      .from('appointments')
      .insert({
        professional_id: professional.id,
        patient_id: patient?.id ?? null,
        patient_name: patient?.name ?? 'Paciente',
        patient_phone: patientPhone,
        starts_at: response.booking.starts_at,
        ends_at: response.booking.ends_at,
        status,
        booked_via: 'whatsapp_ai',
      })
      .select()
      .single();

    if (created) await syncAppointmentToGoogle(created);
    return;
  }

  if (response.action === 'cancel' && response.cancel) {
    const { data: cancelled } = await supabase
      .from('appointments')
      .update({ status: 'cancelled', cancelled_by: 'patient' })
      .eq('id', response.cancel.appointment_id)
      .eq('professional_id', professional.id)
      .select()
      .maybeSingle();

    if (cancelled) await syncAppointmentToGoogle(cancelled);
    return;
  }

  if (response.action === 'reschedule' && response.cancel && response.booking) {
    const { data: cancelled } = await supabase
      .from('appointments')
      .update({ status: 'cancelled', cancelled_by: 'patient' })
      .eq('id', response.cancel.appointment_id)
      .eq('professional_id', professional.id)
      .select()
      .maybeSingle();

    if (cancelled) await syncAppointmentToGoogle(cancelled);

    await executeAction(professional, patientPhone, {
      ...response,
      action: 'book',
    });
  }
}
