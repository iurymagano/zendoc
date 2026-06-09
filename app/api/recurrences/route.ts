import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { isValidCpf, normalizeCpf } from '@/lib/patients/cpf';
import { materializeRecurrence } from '@/lib/recurrences/service';
import type { Recurrence } from '@/types/database';

const phoneRegex = /^\d{11,13}$/;
// ISO no padrão do app: sempre com offset -03:00 (ver convenções).
const isoBrRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const createSchema = z
  .object({
    patient_name: z.string().trim().min(1).max(120),
    patient_phone: z.string().regex(phoneRegex),
    cpf: z.string().nullable().optional(),
    starts_at: z.string().regex(isoBrRegex),
    ends_at: z.string().regex(isoBrRegex),
    frequency: z.enum(['weekly', 'biweekly']),
    until: z.string().regex(dateRegex).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .refine((d) => d.ends_at > d.starts_at, {
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
  const d = parsed.data;

  let normalizedCpf: string | null = null;
  if (d.cpf != null && d.cpf.trim() !== '') {
    normalizedCpf = normalizeCpf(d.cpf);
    if (!isValidCpf(normalizedCpf)) {
      return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 });
    }
  }

  // Deriva a regra do 1º horário (ISO sempre em -03:00 → slice é exato).
  const startDate = d.starts_at.slice(0, 10);
  const startTime = d.starts_at.slice(11, 19);
  const endTime = d.ends_at.slice(11, 19);
  if (d.ends_at.slice(0, 10) !== startDate) {
    return NextResponse.json(
      { error: 'A consulta recorrente deve começar e terminar no mesmo dia.' },
      { status: 400 },
    );
  }
  const weekday = new Date(`${startDate}T12:00:00Z`).getUTCDay();
  const intervalWeeks = d.frequency === 'biweekly' ? 2 : 1;

  const supabase = createServerClient();

  // Reaproveita/cria o paciente por telefone (mesmo comportamento do booking).
  const { data: patient } = await supabase
    .from('patients')
    .upsert(
      {
        professional_id: professionalId,
        phone: d.patient_phone,
        name: d.patient_name,
        ...(normalizedCpf ? { cpf: normalizedCpf } : {}),
      },
      { onConflict: 'professional_id,phone' },
    )
    .select()
    .single();

  const { data: recurrence, error } = await supabase
    .from('recurrences')
    .insert({
      professional_id: professionalId,
      patient_id: patient?.id ?? null,
      patient_name: d.patient_name,
      patient_phone: d.patient_phone,
      start_date: startDate,
      weekday,
      start_time: startTime,
      end_time: endTime,
      interval_weeks: intervalWeeks,
      until: d.until ?? null,
      notes: d.notes?.trim() || null,
    })
    .select()
    .single();

  if (error || !recurrence) {
    console.error('Erro ao criar recorrência:', error);
    return NextResponse.json(
      { error: 'Erro ao criar a recorrência.' },
      { status: 500 },
    );
  }

  const result = await materializeRecurrence(recurrence as Recurrence);

  return NextResponse.json({ ok: true, recurrence, ...result });
}
