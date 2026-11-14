// Acesso ao Assistente pessoal: carrega o profissional da sessão e aplica o
// bloqueio por plano. Compartilhado pelas rotas /api/assistant/*.
import { createServerClient } from '@/lib/supabase';
import type { Professional } from '@/types/database';

/** Planos em que o Assistente (e a IA em geral) funciona. */
export const ASSISTANT_PLANS = ['trialing', 'active'] as const;

export function planAllowsAssistant(planStatus: string): boolean {
  return (ASSISTANT_PLANS as readonly string[]).includes(planStatus);
}

export const PLAN_BLOCKED_MESSAGE =
  'O Assistente pessoal está disponível nos planos em teste ou ativos. Regularize sua assinatura em Configurações > Assinatura para voltar a usar.';

export async function getProfessionalByUserId(
  userId: string,
): Promise<Professional | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('professionals')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle<Professional>();
  return data ?? null;
}
