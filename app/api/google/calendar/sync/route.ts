import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { setupWatch, syncBusyEvents } from '@/lib/google/calendar';
import type { Professional } from '@/types/database';

/**
 * POST /api/google/calendar/sync
 * Dois modos:
 *  - Usuário logado (sessão): sincroniza só o próprio profissional. Usado pelo
 *    botão "Sincronizar agora" e como fallback em dev (sem webhook público).
 *  - Cron (Authorization: Bearer CRON_SECRET): sincroniza todos os conectados
 *    e renova watches prestes a expirar (canais do Google duram ~7 dias).
 */
async function handle(req: NextRequest) {
  const supabase = createServerClient();
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  const isCron = !!cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (isCron) {
    const { data: pros } = await supabase
      .from('professionals')
      .select('*')
      .eq('google_calendar_connected', true);

    let synced = 0;
    for (const p of (pros ?? []) as Professional[]) {
      try {
        await syncBusyEvents(p);
        // renova watch se expira em < 24h
        const expiry = p.google_channel_expiry
          ? new Date(p.google_channel_expiry).getTime()
          : 0;
        if (expiry - Date.now() < 24 * 60 * 60 * 1000) {
          await setupWatch(p).catch(() => {});
        }
        synced += 1;
      } catch (e) {
        console.error(`Sync cron falhou p/ ${p.id}:`, e);
      }
    }
    return NextResponse.json({ ok: true, synced });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { data: professional } = await supabase
    .from('professionals')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!professional) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }
  // Não conectado → 200 silencioso (o auto-sync da agenda chama sem saber o estado).
  if (!professional.google_calendar_connected) {
    return NextResponse.json({ ok: true, connected: false });
  }

  try {
    const result = await syncBusyEvents(professional as Professional);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('Sync manual falhou:', e);
    return NextResponse.json({ error: 'Falha ao sincronizar.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
