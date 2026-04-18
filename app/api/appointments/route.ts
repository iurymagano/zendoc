import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const querySchema = z.object({
  from: z.string().regex(dateRegex),
  to: z.string().regex(dateRegex),
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
      'id, patient_id, patient_name, patient_phone, starts_at, ends_at, status, booked_via, cancelled_by, cancellation_note, notes, created_at, updated_at, professional_id',
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

  return NextResponse.json({ appointments: data ?? [] });
}
