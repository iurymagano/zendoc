import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';

const phoneRegex = /^\d{11,13}$/;

const bodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().regex(phoneRegex),
  notes: z.string().max(2000).nullable().optional(),
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
  const search = searchParams.get('q')?.trim() ?? '';

  const supabase = createServerClient();
  let query = supabase
    .from('patients')
    .select('*')
    .eq('professional_id', professionalId)
    .order('name');

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao listar pacientes:', error);
    return NextResponse.json(
      { error: 'Erro ao listar pacientes.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ patients: data ?? [] });
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

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('patients')
    .insert({
      professional_id: professionalId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      notes: parsed.data.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Já existe um paciente com este telefone.' },
        { status: 409 },
      );
    }
    console.error('Erro ao criar paciente:', error);
    return NextResponse.json(
      { error: 'Erro ao criar paciente.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, patient: data });
}
