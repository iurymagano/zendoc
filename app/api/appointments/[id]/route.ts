import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { hasAppointmentConflict } from '@/lib/appointments/conflicts';
import {
  isPersonalCommitment,
  resolvePhonePatch,
} from '@/lib/appointments/personal';
import { rescheduleAppointmentReminders } from '@/lib/appointments/reminders';
import { syncAppointmentToGoogle } from '@/lib/google/appointment-sync';
import { notifyAppointmentRescheduled } from '@/lib/notifications/events';

const patchSchema = z
  .object({
    status: z
      .enum(['scheduled', 'confirmed', 'pending_approval', 'no_show'])
      .optional(),
    starts_at: z.string().datetime({ offset: true }).optional(),
    ends_at: z.string().datetime({ offset: true }).optional(),
    patient_name: z.string().trim().min(1).max(120).optional(),
    // Validado em resolvePhonePatch: depende de o appointment ser um compromisso
    // pessoal (sem telefone) ou um atendimento de cliente (telefone obrigatório).
    patient_phone: z.string().max(40).optional(),
    notes: z.string().max(2000).nullable().optional(),
    service_id: z.string().uuid().nullable().optional(),
  })
  .refine(
    (d) =>
      (d.starts_at === undefined) === (d.ends_at === undefined),
    {
      message: 'Envie starts_at e ends_at juntos ao alterar o horário.',
      path: ['ends_at'],
    },
  )
  .refine(
    (d) =>
      !d.starts_at || !d.ends_at || new Date(d.ends_at) > new Date(d.starts_at),
    {
      message: 'ends_at precisa ser maior que starts_at.',
      path: ['ends_at'],
    },
  );

async function getProfessionalId(userId: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const professionalId = await getProfessionalId(session.user.id);
  if (!professionalId) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  const { id } = await params;
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', id)
    .eq('professional_id', professionalId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar agendamento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar agendamento.' },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ appointment: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const professionalId = await getProfessionalId(session.user.id);
  if (!professionalId) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  const { id } = await params;
  const supabase = createServerClient();

  // Carrega o appointment (sempre filtrando pelo dono) para saber se é um
  // compromisso pessoal e se o horário mudou.
  const { data: existing, error: existingError } = await supabase
    .from('appointments')
    .select('id, patient_phone, starts_at')
    .eq('id', id)
    .eq('professional_id', professionalId)
    .maybeSingle();

  if (existingError) {
    console.error('Erro ao buscar agendamento:', existingError);
    return NextResponse.json(
      { error: 'Erro ao atualizar agendamento.' },
      { status: 500 },
    );
  }

  if (!existing) {
    return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
  }

  const phone = resolvePhonePatch(parsed.data.patient_phone, existing.patient_phone);
  if (!phone.ok) {
    return NextResponse.json({ error: phone.error }, { status: 400 });
  }

  if (parsed.data.starts_at && parsed.data.ends_at) {
    const conflict = await hasAppointmentConflict(
      professionalId,
      parsed.data.starts_at,
      parsed.data.ends_at,
      id,
    );
    if (conflict) {
      return NextResponse.json(
        { error: 'Já existe um agendamento ativo nesse horário.' },
        { status: 409 },
      );
    }
  }

  const patch: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) patch.status = parsed.data.status;
  if (parsed.data.starts_at !== undefined) patch.starts_at = parsed.data.starts_at;
  if (parsed.data.ends_at !== undefined) patch.ends_at = parsed.data.ends_at;
  if (parsed.data.patient_name !== undefined) patch.patient_name = parsed.data.patient_name;
  if (phone.value !== undefined) patch.patient_phone = phone.value;
  if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes?.trim() || null;
  if (parsed.data.service_id !== undefined) {
    // valida que o serviço pertence ao profissional (ou limpa com null)
    if (parsed.data.service_id) {
      const { data: svc } = await supabase
        .from('services')
        .select('id')
        .eq('id', parsed.data.service_id)
        .eq('professional_id', professionalId)
        .maybeSingle();
      if (!svc) {
        return NextResponse.json({ error: 'Serviço inválido.' }, { status: 400 });
      }
    }
    patch.service_id = parsed.data.service_id;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('appointments')
    .update(patch)
    .eq('id', id)
    .eq('professional_id', professionalId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Erro ao atualizar agendamento:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar agendamento.' },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
  }

  // O trigger do banco só cria lembretes no insert/mudança de status: ao mudar o
  // horário, os pendentes precisam ser reagendados, senão disparam no horário
  // antigo. Compromisso pessoal não tem lembrete de cliente.
  const startsAtChanged =
    parsed.data.starts_at !== undefined &&
    new Date(parsed.data.starts_at).getTime() !==
      new Date(existing.starts_at).getTime();
  if (startsAtChanged && !isPersonalCommitment(data.patient_phone)) {
    await rescheduleAppointmentReminders(id, data.starts_at);
  }

  // Reflete a alteração no Google (atualiza horário/cliente ou remove se no_show).
  await syncAppointmentToGoogle(data);

  // Aviso no sino (já nasce lido: foi o próprio profissional que remarcou).
  if (startsAtChanged) {
    await notifyAppointmentRescheduled(
      professionalId,
      data,
      existing.starts_at,
      'professional',
    );
  }

  return NextResponse.json({ ok: true, appointment: data });
}
