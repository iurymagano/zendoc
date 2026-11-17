import { createServerClient } from '@/lib/supabase';

/**
 * Registra que o usuário abriu o painel hoje (RPC touch_activity, service key).
 * Nunca lança: erro vira console.error para não derrubar a página.
 */
export async function touchActivity(userId: string): Promise<void> {
  try {
    const { error } = await createServerClient().rpc('touch_activity', {
      p_user: userId,
    });
    if (error) console.error('Erro ao registrar atividade do painel:', error.message);
  } catch (err) {
    console.error('Erro ao registrar atividade do painel:', err);
  }
}
