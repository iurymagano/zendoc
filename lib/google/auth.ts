import crypto from 'node:crypto';
import { createServerClient } from '@/lib/supabase';
import type { Professional } from '@/types/database';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

// calendar.events: ler/criar/editar/apagar eventos (suficiente p/ mão-dupla).
// openid+email: descobrir qual conta Google conectou (rótulo na UI).
export const GOOGLE_CALENDAR_SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ');

/** URL de callback registrada no Google Cloud Console (OAuth client). */
export function calendarRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/api/google/calendar/callback`;
}

function clientCreds() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não configurados.');
  }
  return { clientId, clientSecret };
}

// ---- state assinado (CSRF) — embute o professionalId, expira em 10 min ----
function stateSecret(): string {
  return process.env.NEXTAUTH_SECRET ?? 'iazen-dev-secret';
}

export function signState(professionalId: string): string {
  const payload = `${professionalId}.${Date.now()}`;
  const sig = crypto
    .createHmac('sha256', stateSecret())
    .update(payload)
    .digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

export function verifyState(state: string): string | null {
  try {
    const [professionalId, ts, sig] = Buffer.from(state, 'base64url')
      .toString('utf8')
      .split('.');
    if (!professionalId || !ts || !sig) return null;
    const expected = crypto
      .createHmac('sha256', stateSecret())
      .update(`${professionalId}.${ts}`)
      .digest('hex');
    const ok =
      sig.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    if (!ok) return null;
    if (Date.now() - Number(ts) > 10 * 60 * 1000) return null;
    return professionalId;
  } catch {
    return null;
  }
}

export function buildConsentUrl(state: string): string {
  const { clientId } = clientCreds();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: calendarRedirectUri(),
    response_type: 'code',
    scope: GOOGLE_CALENDAR_SCOPES,
    access_type: 'offline',
    prompt: 'consent', // força refresh_token mesmo em reconsentimento
    include_granted_scopes: 'true',
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  id_token?: string;
}

export async function exchangeCode(code: string): Promise<GoogleTokens> {
  const { clientId, clientSecret } = clientCreds();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: calendarRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Falha ao trocar code por token: ${res.status} ${await res.text()}`,
    );
  }
  return res.json();
}

/** Lê o email do id_token (sem verificar assinatura — chega via TLS do Google). */
export function emailFromIdToken(idToken?: string): string | null {
  if (!idToken) return null;
  try {
    const payload = idToken.split('.')[1];
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return json.email ?? null;
  } catch {
    return null;
  }
}

async function refreshAccessToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number }> {
  const { clientId, clientSecret } = clientCreds();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Falha ao renovar access token: ${res.status} ${await res.text()}`,
    );
  }
  return res.json();
}

/**
 * Devolve um access token válido para o profissional, renovando via
 * refresh_token quando expirado e persistindo o novo token no banco.
 * Lança se o Google não estiver conectado.
 */
export async function getAccessToken(
  professional: Pick<
    Professional,
    | 'id'
    | 'google_refresh_token'
    | 'google_access_token'
    | 'google_token_expiry'
  >,
): Promise<string> {
  if (!professional.google_refresh_token) {
    throw new Error('Profissional não conectou o Google Calendar.');
  }
  const now = Date.now();
  const expiry = professional.google_token_expiry
    ? new Date(professional.google_token_expiry).getTime()
    : 0;
  if (professional.google_access_token && expiry - now > 60_000) {
    return professional.google_access_token;
  }
  const refreshed = await refreshAccessToken(professional.google_refresh_token);
  const newExpiry = new Date(now + refreshed.expires_in * 1000).toISOString();
  const supabase = createServerClient();
  await supabase
    .from('professionals')
    .update({
      google_access_token: refreshed.access_token,
      google_token_expiry: newExpiry,
    })
    .eq('id', professional.id);
  return refreshed.access_token;
}

export async function revokeToken(token: string): Promise<void> {
  await fetch(`${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).catch(() => {});
}
