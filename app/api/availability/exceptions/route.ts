import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const bodySchema = z
  .object({
    date: z.string().regex(dateRegex),
    type: z.enum(['day_off', 'custom_hours', 'extra_day']),
    start_time: z.string().regex(timeRegex).nullable().optional(),
    end_time: z.string().regex(timeRegex).nullable().optional(),
    slot_duration: z.number().int().min(15).max(240).nullable().optional(),
    note: z.string().max(500).nullable().optional(),
  })
  .refine(
    (e) =>
      e.type === 'day_off' ||
      (!!e.start_time && !!e.end_time && e.start_time < e.end_time),
    {
      message:
        'Exceções do tipo custom_hours ou extra_day precisam de start_time < end_time.',
      path: ['end_time'],
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
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const supabase = createServerClient();
  let query = supabase
    .from('availability_exceptions')
    .select('*')
    .eq('professional_id', professionalId)
    .order('date');

  if (from && dateRegex.test(from)) query = query.gte('date', from);
  if (to && dateRegex.test(to)) query = query.lte('date', to);

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar exceções:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar exceções.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ exceptions: data ?? [] });
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
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  const isDayOff = parsed.data.type === 'day_off';
  const row = {
    professional_id: professionalId,
    date: parsed.data.date,
    type: parsed.data.type,
    start_time: isDayOff ? null : parsed.data.start_time ?? null,
    end_time: isDayOff ? null : parsed.data.end_time ?? null,
    slot_duration: isDayOff ? null : parsed.data.slot_duration ?? null,
    note: parsed.data.note?.trim() || null,
  };

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('availability_exceptions')
    .upsert(row, { onConflict: 'professional_id,date' })
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar exceção:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar exceção.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, exception: data });
}
