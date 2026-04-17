import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10).max(13),
  specialty: z.string().min(1),
  address: z.string().nullable().optional(),
  tone: z.enum(['amigável', 'formal']),
  custom_instructions: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos.' },
      { status: 400 },
    );
  }

  const supabase = createServerClient();
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('professionals')
    .upsert(
      {
        user_id: session.user.id,
        name: parsed.data.name,
        phone: parsed.data.phone,
        specialty: parsed.data.specialty,
        address: parsed.data.address ?? null,
        tone: parsed.data.tone,
        custom_instructions: parsed.data.custom_instructions ?? null,
        plan_status: 'trialing',
        trial_ends_at: trialEndsAt,
        ai_enabled: true,
      },
      { onConflict: 'user_id' },
    );

  if (error) {
    console.error('Erro ao criar perfil do profissional:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar perfil.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
