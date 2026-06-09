import { NextRequest, NextResponse } from 'next/server';
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

/**
 * GET /api/conversations/[phone]
 * Mensagens da conversa com um contato (ordem cronológica), nome do paciente e
 * estado de pausa da IA.
 */
export async function GET(
  _req: NextRequest,
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

  const { phone } = await params;

  const supabase = createServerClient();
  const [{ data: messages }, { data: patient }, { data: state }] =
    await Promise.all([
      supabase
        .from('conversation_history')
        .select('id, role, content, created_at')
        .eq('professional_id', professionalId)
        .eq('patient_phone', phone)
        .order('created_at', { ascending: true })
        .limit(200),
      supabase
        .from('patients')
        .select('name')
        .eq('professional_id', professionalId)
        .eq('phone', phone)
        .maybeSingle(),
      supabase
        .from('conversation_state')
        .select('ai_paused, needs_attention')
        .eq('professional_id', professionalId)
        .eq('patient_phone', phone)
        .maybeSingle(),
    ]);

  return NextResponse.json({
    phone,
    name: patient?.name ?? null,
    ai_paused: state?.ai_paused ?? false,
    needs_attention: state?.needs_attention ?? false,
    messages: messages ?? [],
  });
}
