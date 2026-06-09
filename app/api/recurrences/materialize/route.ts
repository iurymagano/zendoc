import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { materializeRecurrence } from '@/lib/recurrences/service';
import type { Recurrence } from '@/types/database';

/**
 * GET|POST /api/recurrences/materialize
 * Cron (Authorization: Bearer CRON_SECRET): mantém ~8 semanas de cada série
 * ativa materializadas à frente. Agendado em vercel.json (diário).
 */
async function handle(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data: recurrences } = await supabase
    .from('recurrences')
    .select('*')
    .eq('active', true);

  let created = 0;
  for (const r of (recurrences ?? []) as Recurrence[]) {
    try {
      const result = await materializeRecurrence(r);
      created += result.created;
    } catch (e) {
      console.error(`Materialize falhou p/ recorrência ${r.id}:`, e);
    }
  }

  return NextResponse.json({ ok: true, recurrences: (recurrences ?? []).length, created });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
