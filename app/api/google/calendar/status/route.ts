import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';

/**
 * GET /api/google/calendar/status
 * Estado da conexão Google para a UI de /configuracoes/google.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select(
      'google_calendar_connected, google_email, google_calendar_id, google_channel_expiry',
    )
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!professional) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  return NextResponse.json({
    connected: professional.google_calendar_connected,
    email: professional.google_email,
    calendarId: professional.google_calendar_id,
    // se há watch ativo o push é automático; senão a UI mostra "sincronizar agora"
    pushActive: !!professional.google_channel_expiry,
  });
}
