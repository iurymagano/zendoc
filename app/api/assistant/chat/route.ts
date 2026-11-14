import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import {
  PLAN_BLOCKED_MESSAGE,
  getProfessionalByUserId,
  planAllowsAssistant,
} from '@/lib/assistant/access';
import { runAssistantChat } from '@/lib/assistant/chat';

// O loop de tool use faz várias chamadas ao modelo em sequência.
export const maxDuration = 60;

const bodySchema = z.object({
  message: z.string().trim().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const professional = await getProfessionalByUserId(session.user.id);
  if (!professional) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  if (!planAllowsAssistant(professional.plan_status)) {
    return NextResponse.json({ error: PLAN_BLOCKED_MESSAGE }, { status: 402 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Envie uma mensagem de até 2000 caracteres.' },
      { status: 400 },
    );
  }

  try {
    const { reply, actions } = await runAssistantChat(
      professional,
      parsed.data.message,
    );
    return NextResponse.json({ reply, actions });
  } catch (err) {
    console.error('Erro no chat do assistente:', err);
    return NextResponse.json(
      { error: 'Não consegui responder agora. Tente de novo em instantes.' },
      { status: 500 },
    );
  }
}
