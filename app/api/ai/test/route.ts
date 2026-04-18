import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { processWhatsAppMessage } from '@/lib/ai/processor';
import type { Professional } from '@/types/database';

const phoneRegex = /^\d{11,13}$/;

const bodySchema = z.object({
  phone: z.string().regex(phoneRegex),
  message: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle<Professional>();

  if (!professional) {
    return NextResponse.json(
      { error: 'Perfil não encontrado' },
      { status: 404 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  try {
    const reply = await processWhatsAppMessage(
      professional,
      parsed.data.phone,
      parsed.data.message,
    );
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Erro no teste da IA:', err);
    return NextResponse.json(
      { error: 'Erro ao processar mensagem' },
      { status: 500 },
    );
  }
}
