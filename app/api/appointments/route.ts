import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { hasAppointmentConflict } from '@/lib/appointments/conflicts';
import { isValidCpf, normalizeCpf } from '@/lib/patients/cpf';
import { syncAppointmentToGoogle } from '@/lib/google/appointment-sync';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const phoneRegex = /^\d{11,13}$/;

const querySchema = z.object({
  from: z.string().regex(dateRegex),
  to: z.string().regex(dateRegex),
});

const createSchema = z
  .object({
    patient_name: z.string().trim().min(1).max(120),
    patient_phone: z.string().regex(phoneRegex),
    cpf: z.string().nullable().optional(),
    starts_at: z.string().datetime({ offset: true }),
    ends_at: z.string().datetime({ offset: true }),
    notes: z.string().max(2000).nullable().optional(),
  })
  .refine((d) => new Date(d.ends_at) > new Date(d.starts_at), {
    message: 'ends_at precisa ser maior que starts_at.',
    path: ['ends_at'],
  });

async function getProfessionalId(userId: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const professionalId = await getProfessionalId(session.user.id);
  if (!professionalId) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    from: searchParams.get('from'),
    to: searchParams.get('to'),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parâmetros `from` e `to` (YYYY-MM-DD) são obrigatórios.' },
      { status: 400 },
    );
  }

  const fromTs = `${parsed.data.from}T00:00:00-03:00`;
  const toTs = `${parsed.data.to}T00:00:00-03:00`;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('appointments')
    .select(
      'id, patient_id, patient_name, patient_phone, starts_at, ends_at, status, booked_via, cancelled_by, cancellation_note, notes, recurrence_id, created_at, updated_at, professional_id',
    )
    .eq('professional_id', professionalId)
    .gte('starts_at', fromTs)
    .lt('starts_at', toTs)
    .order('starts_at');

  if (error) {
    console.error('Erro ao listar agendamentos:', error);
    return NextResponse.json(
      { error: 'Erro ao listar agendamentos.' },
      { status: 500 },
    );
  }

  // Compromissos pessoais do Google que tocam a janela (read-only no calendário).
  const { data: googleBusy } = await supabase
    .from('google_busy_events')
    .select('id, google_event_id, summary, starts_at, ends_at, all_day')
    .eq('professional_id', professionalId)
    .lt('starts_at', toTs)
    .gt('ends_at', fromTs)
    .order('starts_at');

  return NextResponse.json({
    appointments: data ?? [],
    googleBusy: googleBusy ?? [],
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const professionalId = await getProfessionalId(session.user.id);
  if (!professionalId) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  const { patient_name, patient_phone, cpf, starts_at, ends_at, notes } =
    parsed.data;

  let normalizedCpf: string | null = null;
  if (cpf != null && cpf.trim() !== '') {
    normalizedCpf = normalizeCpf(cpf);
    if (!isValidCpf(normalizedCpf)) {
      return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 });
    }
  }

  if (await hasAppointmentConflict(professionalId, starts_at, ends_at)) {
    return NextResponse.json(
      { error: 'Já existe um agendamento ativo nesse horário.' },
      { status: 409 },
    );
  }

  const supabase = createServerClient();
  const { data: patient } = await supabase
    .from('patients')
    .upsert(
      {
        professional_id: professionalId,
        phone: patient_phone,
        name: patient_name,
        // só grava CPF quando informado — não apaga um já existente no upsert
        ...(normalizedCpf ? { cpf: normalizedCpf } : {}),
      },
      { onConflict: 'professional_id,phone' },
    )
    .select()
    .single();

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      professional_id: professionalId,
      patient_id: patient?.id ?? null,
      patient_name,
      patient_phone,
      starts_at,
      ends_at,
      status: 'scheduled',
      booked_via: 'manual',
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar agendamento:', error);
    return NextResponse.json(
      { error: 'Erro ao criar agendamento.' },
      { status: 500 },
    );
  }

  // Espelha no Google Calendar (best-effort — grava google_event_id na linha).
  await syncAppointmentToGoogle(data);

  return NextResponse.json({ ok: true, appointment: data });
}
