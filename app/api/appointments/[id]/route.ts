import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { hasAppointmentConflict } from '@/lib/appointments/conflicts';
import { syncAppointmentToGoogle } from '@/lib/google/appointment-sync';

const phoneRegex = /^\d{11,13}$/;

const patchSchema = z
  .object({
    status: z
      .enum(['scheduled', 'confirmed', 'pending_approval', 'no_show'])
      .optional(),
    starts_at: z.string().datetime({ offset: true }).optional(),
    ends_at: z.string().datetime({ offset: true }).optional(),
    patient_name: z.string().trim().min(1).max(120).optional(),
    patient_phone: z.string().regex(phoneRegex).optional(),
    notes: z.string().max(2000).nullable().optional(),
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
  if (parsed.data.patient_phone !== undefined) patch.patient_phone = parsed.data.patient_phone;
  if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes?.trim() || null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 });
  }

  const supabase = createServerClient();
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

  // Reflete a alteração no Google (atualiza horário/paciente ou remove se no_show).
  await syncAppointmentToGoogle(data);

  return NextResponse.json({ ok: true, appointment: data });
}
