import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';

/**
 * GET /api/conversations/attention-count
 * Quantas conversas precisam de resposta humana — usado pelo badge do Navbar.
 * Leve: só conta em conversation_state. Rota estática (precede /[phone]).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ count: 0 });
  }

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', session.user.id)
    .maybeSingle();
  if (!professional) return NextResponse.json({ count: 0 });

  const { count } = await supabase
    .from('conversation_state')
    .select('id', { count: 'exact', head: true })
    .eq('professional_id', professional.id)
    .eq('needs_attention', true);

  return NextResponse.json({ count: count ?? 0 });
}
