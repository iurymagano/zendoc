import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import {
  PLAN_BLOCKED_MESSAGE,
  getProfessionalByUserId,
  planAllowsAssistant,
} from '@/lib/assistant/access';
import { runAssistantChat } from '@/lib/assistant/chat';
import {
  RATE_LIMIT_FETCH,
  RATE_LIMITS,
  evaluateRateLimit,
} from '@/lib/assistant/rate-limit';
import { createServerClient } from '@/lib/supabase';

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

  // Cada chamada custa tokens da Anthropic: limite por profissional ANTES do modelo.
  const limited = await checkRateLimit(professional.id);
  if (limited) return limited;

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

/**
 * Conta as mensagens do usuário nas últimas 24h (as mais recentes, até o teto
 * diário) e aplica os limites de rajada e diário. Devolve a resposta 429 ou
 * `null` se pode seguir. Falha de leitura não bloqueia o usuário (só loga).
 */
async function checkRateLimit(professionalId: string): Promise<NextResponse | null> {
  const supabase = createServerClient();
  const since = new Date(Date.now() - RATE_LIMITS.daily.windowMs).toISOString();
  const { data, error } = await supabase
    .from('assistant_messages')
    .select('created_at')
    .eq('professional_id', professionalId)
    .eq('role', 'user')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(RATE_LIMIT_FETCH);
  if (error) {
    console.error('assistente: erro ao checar limite de uso:', error);
    return null;
  }

  const decision = evaluateRateLimit(
    (data ?? []).map((r) => r.created_at as string),
    new Date(),
  );
  if (decision.ok) return null;

  return NextResponse.json(
    { error: decision.message },
    { status: 429, headers: { 'Retry-After': String(decision.retryAfterSec) } },
  );
}
