import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  duration_min: z.number().int().min(5).max(600),
  price_cents: z.number().int().min(0).nullable().optional(),
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

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const professionalId = await getProfessionalId(session.user.id);
  if (!professionalId) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('professional_id', professionalId)
    .order('active', { ascending: false })
    .order('name');

  if (error) {
    console.error('Erro ao listar serviços:', error);
    return NextResponse.json({ error: 'Erro ao listar serviços.' }, { status: 500 });
  }
  return NextResponse.json({ services: data ?? [] });
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

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('services')
    .insert({
      professional_id: professionalId,
      name: parsed.data.name,
      duration_min: parsed.data.duration_min,
      price_cents: parsed.data.price_cents ?? null,
    })
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation (nome repetido)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Já existe um serviço com esse nome.' },
        { status: 409 },
      );
    }
    console.error('Erro ao criar serviço:', error);
    return NextResponse.json({ error: 'Erro ao criar serviço.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, service: data });
}
