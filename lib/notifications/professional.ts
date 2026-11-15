// Resolve o profissional da sessão para as rotas /api/notifications (SERVER-ONLY).
// O professional_id vem SEMPRE da sessão; nenhuma rota aceita o id na entrada.
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';

/** `null` se não houver sessão ou perfil; o chamador responde 401/404. */
export async function getSessionProfessionalId(): Promise<
  { status: 'ok'; professionalId: string } | { status: 'unauthorized' } | { status: 'no_profile' }
> {
  const session = await auth();
  if (!session?.user?.id) return { status: 'unauthorized' };

  const { data } = await createServerClient()
    .from('professionals')
    .select('id')
    .eq('user_id', session.user.id)
    .maybeSingle();
  if (!data?.id) return { status: 'no_profile' };
  return { status: 'ok', professionalId: data.id as string };
}
