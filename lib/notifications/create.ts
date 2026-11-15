// Gravação de notificações (SERVER-ONLY: usa a service key). Nunca derruba o
// fluxo principal: qualquer falha vira console.error e o chamador segue.
import { createServerClient } from '@/lib/supabase';
import type { NotificationDraft } from './messages';

/**
 * Cria uma notificação para o profissional. Se o rascunho tem `dedupeKey` e já
 * existe uma com a mesma chave, não grava de novo. Já lida (`alreadyRead`) =
 * ação do próprio profissional: fica no histórico, sem selo nem toast.
 *
 * NUNCA lança: o evento que originou o aviso (agendar, cancelar, responder o
 * cliente) é mais importante que o aviso.
 */
export async function createNotification(
  professionalId: string,
  draft: NotificationDraft,
): Promise<void> {
  try {
    const supabase = createServerClient();
    const row = {
      professional_id: professionalId,
      type: draft.type,
      title: draft.title,
      body: draft.body,
      data: draft.data,
      dedupe_key: draft.dedupeKey,
      read_at: draft.alreadyRead ? new Date().toISOString() : null,
    };

    const { error } = draft.dedupeKey
      ? await supabase.from('notifications').upsert(row, {
          onConflict: 'professional_id,dedupe_key',
          ignoreDuplicates: true,
        })
      : await supabase.from('notifications').insert(row);

    if (error) console.error('createNotification falhou:', error.message);
  } catch (err) {
    console.error('createNotification falhou:', err);
  }
}
