import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase';
import { getSessionProfessionalId } from '@/lib/notifications/professional';

const idSchema = z.string().uuid();

/**
 * POST /api/notifications/[id]/read
 * Marca UMA notificação do profissional logado como lida. Idempotente: marcar
 * uma já lida também responde 200. 404 se a notificação não for dele.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const who = await getSessionProfessionalId();
  if (who.status === 'unauthorized') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  if (who.status === 'no_profile') {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  const { id } = await params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Id inválido.' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('professional_id', who.professionalId)
    .is('read_at', null)
    .select('id');

  if (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return NextResponse.json({ error: 'Erro ao marcar como lida.' }, { status: 500 });
  }

  if ((data ?? []).length === 0) {
    // Ou já estava lida (ok) ou não existe / não é dele (404).
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('id', id)
      .eq('professional_id', who.professionalId)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 });
    }
  }

  return NextResponse.json({ ok: true });
}
