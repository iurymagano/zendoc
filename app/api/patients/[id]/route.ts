import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';

const phoneRegex = /^\d{11,13}$/;

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().regex(phoneRegex).optional(),
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
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('professional_id', professionalId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar paciente:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar paciente.' },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ patient: data });
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
  const patch: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.phone !== undefined) patch.phone = parsed.data.phone;
  if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes?.trim() || null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('patients')
    .update(patch)
    .eq('id', id)
    .eq('professional_id', professionalId)
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Já existe um paciente com este telefone.' },
        { status: 409 },
      );
    }
    console.error('Erro ao atualizar paciente:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar paciente.' },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, patient: data });
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
    .from('patients')
    .delete()
    .eq('id', id)
    .eq('professional_id', professionalId);

  if (error) {
    console.error('Erro ao excluir paciente:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir paciente.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
