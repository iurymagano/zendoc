import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';

const patchSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    duration_min: z.number().int().min(5).max(600).optional(),
    price_cents: z.number().int().min(0).nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'Nenhum campo para atualizar.',
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
  const { data, error } = await supabase
    .from('services')
    .update(parsed.data)
    .eq('id', id)
    .eq('professional_id', professionalId)
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Já existe um serviço com esse nome.' },
        { status: 409 },
      );
    }
    console.error('Erro ao atualizar serviço:', error);
    return NextResponse.json({ error: 'Erro ao atualizar serviço.' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, service: data });
}

export async function DELETE(
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
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)
    .eq('professional_id', professionalId);

  if (error) {
    console.error('Erro ao excluir serviço:', error);
    return NextResponse.json({ error: 'Erro ao excluir serviço.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
