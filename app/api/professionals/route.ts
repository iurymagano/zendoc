import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';

// Atualização parcial do perfil do profissional logado. Whitelist de campos —
// hoje só o `buffer_min` (intervalo entre atendimentos); extensível.
const patchSchema = z
  .object({
    buffer_min: z.number().int().min(0).max(240).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'Nenhum campo para atualizar.',
  });

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('professionals')
    .update(parsed.data)
    .eq('user_id', session.user.id)
    .select('id, buffer_min')
    .maybeSingle();

  if (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json({ error: 'Erro ao atualizar perfil.' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, professional: data });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const supabase = createServerClient();
  const { data } = await supabase
    .from('professionals')
    .select('id, name, specialty, buffer_min')
    .eq('user_id', session.user.id)
    .maybeSingle();
  if (!data) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }
  return NextResponse.json({ professional: data });
}
