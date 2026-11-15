import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase';
import { getSessionProfessionalId } from '@/lib/notifications/professional';

const LIST_LIMIT = 30;
const COLUMNS = 'id, type, title, body, data, read_at, created_at';

const sinceSchema = z.string().datetime({ offset: true });

/**
 * GET /api/notifications
 * Últimas 30 notificações do profissional logado + total de não lidas.
 * `?since=<ISO>` devolve só as criadas depois desse instante (o contador de
 * não lidas continua sendo o total).
 */
export async function GET(req: NextRequest) {
  const who = await getSessionProfessionalId();
  if (who.status === 'unauthorized') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  if (who.status === 'no_profile') {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  const sinceParam = req.nextUrl.searchParams.get('since');
  let since: string | null = null;
  if (sinceParam) {
    const parsed = sinceSchema.safeParse(sinceParam);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Parâmetro since inválido.' }, { status: 400 });
    }
    since = parsed.data;
  }

  const supabase = createServerClient();
  let list = supabase
    .from('notifications')
    .select(COLUMNS)
    .eq('professional_id', who.professionalId)
    .order('created_at', { ascending: false })
    .limit(LIST_LIMIT);
  if (since) list = list.gt('created_at', since);

  const [listResult, unreadResult] = await Promise.all([
    list,
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', who.professionalId)
      .is('read_at', null),
  ]);

  if (listResult.error || unreadResult.error) {
    console.error('Erro ao listar notificações:', listResult.error ?? unreadResult.error);
    return NextResponse.json({ error: 'Erro ao listar notificações.' }, { status: 500 });
  }

  return NextResponse.json({
    notifications: listResult.data ?? [],
    unreadCount: unreadResult.count ?? 0,
  });
}
