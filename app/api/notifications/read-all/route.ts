import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getSessionProfessionalId } from '@/lib/notifications/professional';

/**
 * POST /api/notifications/read-all
 * Marca como lidas TODAS as notificações não lidas do profissional logado.
 * Resposta: `{ ok: true, updated }` (quantas foram marcadas).
 */
export async function POST() {
  const who = await getSessionProfessionalId();
  if (who.status === 'unauthorized') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  if (who.status === 'no_profile') {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  const { data, error } = await createServerClient()
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('professional_id', who.professionalId)
    .is('read_at', null)
    .select('id');

  if (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    return NextResponse.json({ error: 'Erro ao marcar como lidas.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, updated: (data ?? []).length });
}
