import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const blockSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    block_type: z.enum(['morning', 'lunch', 'afternoon']),
    start_time: z.string().regex(timeRegex),
    end_time: z.string().regex(timeRegex),
    slot_duration: z.number().int().min(15).max(240),
    is_active: z.boolean(),
  })
  .refine((b) => b.start_time < b.end_time, {
    message: 'end_time deve ser maior que start_time',
    path: ['end_time'],
  });

const bodySchema = z.object({
  blocks: z.array(blockSchema),
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
    .from('availability_weekly')
    .select('*')
    .eq('professional_id', professionalId)
    .order('weekday')
    .order('start_time');

  if (error) {
    console.error('Erro ao buscar disponibilidade semanal:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar disponibilidade.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ blocks: data ?? [] });
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

  const { error: deleteError } = await supabase
    .from('availability_weekly')
    .delete()
    .eq('professional_id', professionalId);

  if (deleteError) {
    console.error('Erro ao limpar disponibilidade antiga:', deleteError);
    return NextResponse.json(
      { error: 'Erro ao salvar disponibilidade.' },
      { status: 500 },
    );
  }

  if (parsed.data.blocks.length === 0) {
    return NextResponse.json({ ok: true, blocks: [] });
  }

  const rows = parsed.data.blocks.map((b) => ({
    ...b,
    professional_id: professionalId,
  }));

  const { data, error } = await supabase
    .from('availability_weekly')
    .insert(rows)
    .select();

  if (error) {
    console.error('Erro ao inserir disponibilidade:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar disponibilidade.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, blocks: data });
}
