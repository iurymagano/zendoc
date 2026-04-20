import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';

const bodySchema = z.object({
  cancellation_note: z.string().trim().max(500).optional(),
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

export async function POST(
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

  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  const { id } = await params;
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      cancelled_by: 'professional',
      cancellation_note: parsed.data.cancellation_note?.trim() || null,
    })
    .eq('id', id)
    .eq('professional_id', professionalId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Erro ao cancelar agendamento:', error);
    return NextResponse.json(
      { error: 'Erro ao cancelar agendamento.' },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, appointment: data });
}
