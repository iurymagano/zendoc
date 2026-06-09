import { createServerClient } from '@/lib/supabase';
import { syncAppointmentToGoogle } from '@/lib/google/appointment-sync';
import type { Appointment, AIResponse, Professional } from '@/types/database';

type Supabase = ReturnType<typeof createServerClient>;

/**
 * Localiza a próxima consulta ativa do paciente (pelo telefone). A IA não
 * conhece o uuid do appointment — então confirm/cancel/reschedule resolvem o
 * alvo por aqui. Se `appointmentId` vier preenchido, busca por ele.
 */
async function findUpcomingAppointment(
  supabase: Supabase,
  professionalId: string,
  patientPhone: string,
  appointmentId?: string,
): Promise<Appointment | null> {
  let query = supabase
    .from('appointments')
    .select('*')
    .eq('professional_id', professionalId)
    .in('status', ['scheduled', 'confirmed', 'pending_approval']);

  if (appointmentId) {
    query = query.eq('id', appointmentId);
  } else {
    query = query
      .eq('patient_phone', patientPhone)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(1);
  }

  const { data } = await query.maybeSingle();
  return (data as Appointment) ?? null;
}

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

  // Paciente confirmou presença (resposta ao lembrete): scheduled → confirmed.
  // Não confirma pending_approval (isso depende do profissional aprovar).
  if (response.action === 'confirm') {
    const target = await findUpcomingAppointment(
      supabase,
      professional.id,
      patientPhone,
      response.cancel?.appointment_id,
    );
    if (target && target.status === 'scheduled') {
      const { data: confirmed } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', target.id)
        .eq('professional_id', professional.id)
        .select()
        .maybeSingle();
      if (confirmed) await syncAppointmentToGoogle(confirmed);
    }
    return;
  }

  if (response.action === 'cancel') {
    const target = await findUpcomingAppointment(
      supabase,
      professional.id,
      patientPhone,
      response.cancel?.appointment_id,
    );
    if (target) {
      const { data: cancelled } = await supabase
        .from('appointments')
        .update({ status: 'cancelled', cancelled_by: 'patient' })
        .eq('id', target.id)
        .eq('professional_id', professional.id)
        .select()
        .maybeSingle();
      if (cancelled) await syncAppointmentToGoogle(cancelled);
    }
    return;
  }

  if (response.action === 'reschedule' && response.booking) {
    const target = await findUpcomingAppointment(
      supabase,
      professional.id,
      patientPhone,
      response.cancel?.appointment_id,
    );
    if (target) {
      const { data: cancelled } = await supabase
        .from('appointments')
        .update({ status: 'cancelled', cancelled_by: 'patient' })
        .eq('id', target.id)
        .eq('professional_id', professional.id)
        .select()
        .maybeSingle();
      if (cancelled) await syncAppointmentToGoogle(cancelled);
    }

    await executeAction(professional, patientPhone, {
      ...response,
      action: 'book',
    });
  }
}
