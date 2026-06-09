import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { setConversationPaused } from '@/lib/conversations/state';

const bodySchema = z.object({ paused: z.boolean() });

async function getProfessionalId(userId: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * POST /api/conversations/[phone]/pause  { paused: boolean }
 * Pausa ou retoma a IA naquele contato (handoff manual).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const professionalId = await getProfessionalId(session.user.id);
  if (!professionalId) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  const { phone } = await params;
  const supabase = createServerClient();
  try {
    await setConversationPaused(supabase, professionalId, phone, parsed.data.paused);
  } catch (err) {
    console.error('Erro ao pausar conversa:', err);
    return NextResponse.json(
      { error: 'Não foi possível salvar o estado da conversa. A tabela conversation_state existe? (migration 0005)' },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, ai_paused: parsed.data.paused });
}
