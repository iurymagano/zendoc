import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getProfessionalByUserId } from '@/lib/assistant/access';
import { createServerClient } from '@/lib/supabase';

// GET: lembretes pessoais pendentes (próximos primeiro) + os 5 mais recentes
// que falharam ou foram enviados, para o usuário ver o que aconteceu.
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
  const columns = 'id, text, remind_at, status, sent_at, error_message';

  const [pending, recent] = await Promise.all([
    supabase
      .from('personal_reminders')
      .select(columns)
      .eq('professional_id', professional.id)
      .eq('status', 'pending')
      .order('remind_at', { ascending: true })
      .limit(50),
    supabase
      .from('personal_reminders')
      .select(columns)
      .eq('professional_id', professional.id)
      .in('status', ['sent', 'failed'])
      .order('remind_at', { ascending: false })
      .limit(5),
  ]);

  if (pending.error || recent.error) {
    console.error(
      'Erro ao listar lembretes pessoais:',
      pending.error ?? recent.error,
    );
    return NextResponse.json(
      { error: 'Erro ao carregar os lembretes.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    pending: pending.data ?? [],
    recent: recent.data ?? [],
  });
}
