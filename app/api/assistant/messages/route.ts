import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getProfessionalByUserId } from '@/lib/assistant/access';
import { createServerClient } from '@/lib/supabase';

const LIMIT = 50;

// GET: últimas mensagens do chat do Assistente (ordem cronológica).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const professional = await getProfessionalByUserId(session.user.id);
  if (!professional) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('assistant_messages')
    .select('id, role, content, actions, created_at')
    .eq('professional_id', professional.id)
    .order('created_at', { ascending: false })
    .limit(LIMIT);

  if (error) {
    console.error('Erro ao listar mensagens do assistente:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar o histórico.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ messages: (data ?? []).reverse() });
}
