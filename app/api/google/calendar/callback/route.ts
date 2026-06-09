import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import {
  emailFromIdToken,
  exchangeCode,
  verifyState,
} from '@/lib/google/auth';
import { setupWatch, syncBusyEvents } from '@/lib/google/calendar';
import type { Professional } from '@/types/database';

const SETTINGS_PATH = '/configuracoes/google';

function redirectToSettings(params: string) {
  const base = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000';
  return NextResponse.redirect(new URL(`${SETTINGS_PATH}?${params}`, base));
}

/**
 * GET /api/google/calendar/callback
 * Recebe o code do Google, valida o state (CSRF + professionalId), troca por
 * tokens, persiste o refresh_token e dispara o sync inicial + watch.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const error = searchParams.get('error');
  if (error) return redirectToSettings(`error=${encodeURIComponent(error)}`);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  if (!code || !state) return redirectToSettings('error=missing_params');

  const professionalId = verifyState(state);
  if (!professionalId) return redirectToSettings('error=invalid_state');

  // Confere que a sessão atual é dona do profissional do state.
  const session = await auth();
  if (!session?.user?.id) return redirectToSettings('error=unauthorized');

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('*')
    .eq('id', professionalId)
    .eq('user_id', session.user.id)
    .maybeSingle();
  if (!professional) return redirectToSettings('error=forbidden');

  let tokens;
  try {
    tokens = await exchangeCode(code);
  } catch (e) {
    console.error('Google callback — falha no exchange:', e);
    return redirectToSettings('error=exchange_failed');
  }

  if (!tokens.refresh_token) {
    // Sem refresh_token não conseguimos manter a conexão (faltou prompt=consent
    // ou o usuário já havia consentido sem revogar). Orienta reconsentir.
    return redirectToSettings('error=no_refresh_token');
  }

  const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  await supabase
    .from('professionals')
    .update({
      google_calendar_connected: true,
      google_email: emailFromIdToken(tokens.id_token),
      google_refresh_token: tokens.refresh_token,
      google_access_token: tokens.access_token,
      google_token_expiry: expiry,
      google_calendar_id: 'primary',
      google_sync_token: null,
    })
    .eq('id', professionalId);

  // Sync inicial + watch (best-effort — não bloqueia o sucesso da conexão).
  const { data: fresh } = await supabase
    .from('professionals')
    .select('*')
    .eq('id', professionalId)
    .single();

  if (fresh) {
    try {
      await syncBusyEvents(fresh as Professional);
    } catch (e) {
      console.error('Google callback — sync inicial falhou:', e);
    }
    try {
      await setupWatch(fresh as Professional);
    } catch (e) {
      console.error('Google callback — watch falhou (segue por sync manual):', e);
    }
  }

  return redirectToSettings('connected=1');
}
