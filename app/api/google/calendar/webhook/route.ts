import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { syncBusyEvents } from '@/lib/google/calendar';
import type { Professional } from '@/types/database';

/**
 * POST /api/google/calendar/webhook
 * Recebe o push do Google (watch). O Google não manda corpo útil — só headers:
 *  - X-Goog-Channel-ID    → nosso channelId
 *  - X-Goog-Channel-Token → o professionalId que passamos no setupWatch
 *  - X-Goog-Resource-State→ 'sync' (handshake inicial) | 'exists' (mudou algo)
 * Em 'exists', dispara o pull incremental do profissional dono do canal.
 */
export async function POST(req: NextRequest) {
  const state = req.headers.get('x-goog-resource-state');
  const channelId = req.headers.get('x-goog-channel-id');
  const token = req.headers.get('x-goog-channel-token');

  // Handshake inicial: só confirma o recebimento.
  if (state === 'sync') {
    return NextResponse.json({ ok: true });
  }

  if (!channelId || !token) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('*')
    .eq('id', token)
    .eq('google_channel_id', channelId)
    .maybeSingle();

  // Canal desconhecido/rotacionado — ignora silenciosamente (200 evita retries).
  if (!professional || !professional.google_calendar_connected) {
    return NextResponse.json({ ok: true });
  }

  try {
    await syncBusyEvents(professional as Professional);
  } catch (e) {
    console.error('Webhook Google — sync falhou:', e);
  }

  return NextResponse.json({ ok: true });
}
