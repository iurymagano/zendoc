import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { revokeToken } from '@/lib/google/auth';
import { stopWatch } from '@/lib/google/calendar';
import type { Professional } from '@/types/database';

/**
 * POST /api/google/calendar/disconnect
 * Para o watch, revoga o refresh_token no Google e zera as colunas google_*.
 * Mantém os google_event_id já gravados nos appointments (inertes).
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!professional) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  await stopWatch(professional as Professional).catch(() => {});
  if (professional.google_refresh_token) {
    await revokeToken(professional.google_refresh_token);
  }

  await supabase
    .from('professionals')
    .update({
      google_calendar_connected: false,
      google_email: null,
      google_refresh_token: null,
      google_access_token: null,
      google_token_expiry: null,
      google_sync_token: null,
      google_channel_id: null,
      google_resource_id: null,
      google_channel_expiry: null,
    })
    .eq('id', professional.id);

  // Limpa os bloqueios pessoais importados (não fazem mais sentido sem conexão).
  await supabase
    .from('google_busy_events')
    .delete()
    .eq('professional_id', professional.id);

  return NextResponse.json({ ok: true });
}
