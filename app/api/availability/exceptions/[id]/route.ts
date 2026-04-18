import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';

async function getProfessionalId(userId: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function DELETE(
  _req: Request,
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
    .from('availability_exceptions')
    .delete()
    .eq('id', id)
    .eq('professional_id', professionalId);

  if (error) {
    console.error('Erro ao excluir exceção:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir exceção.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
