import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { getProfessionalByUserId } from '@/lib/assistant/access';
import { createServerClient } from '@/lib/supabase';

// POST: cancela um lembrete pessoal PENDENTE do profissional da sessão.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Id inválido.' }, { status: 400 });
  }

  const professional = await getProfessionalByUserId(session.user.id);
  if (!professional) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('personal_reminders')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('professional_id', professional.id)
    .eq('status', 'pending')
    .select('id');

  if (error) {
    console.error('Erro ao cancelar lembrete pessoal:', error);
    return NextResponse.json(
      { error: 'Erro ao cancelar o lembrete.' },
      { status: 500 },
    );
  }
  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: 'Lembrete não encontrado ou já enviado/cancelado.' },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
