// Para onde o clique numa notificação leva. PURO (usável no client): só monta a
// URL a partir do tipo e dos dados guardados. O `n=<id>` no fim torna a URL
// única por notificação, então clicar de novo na mesma tela ainda dispara a
// navegação (as páginas reagem à mudança do query string).
import type { AppNotification } from '../../types/database';
import { saoPauloParts } from '../assistant/datetime';

type LinkInput = Pick<AppNotification, 'id' | 'type' | 'data'>;

/** YYYY-MM-DD (São Paulo) de um ISO; null se o ISO for inválido. */
function dayOf(iso: string | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return null;
  return saoPauloParts(t).date;
}

export function notificationHref(n: LinkInput): string {
  const tag = `n=${encodeURIComponent(n.id)}`;
  const data = n.data ?? {};

  if (n.type === 'whatsapp_disconnected') return '/configuracoes/whatsapp';

  if (n.type === 'conversation_attention') {
    return data.patient_phone
      ? `/conversas?phone=${encodeURIComponent(data.patient_phone)}&${tag}`
      : '/conversas';
  }

  // Atendimento (cancelou, remarcou, agendou, conflito, lembrete que falhou):
  // abre a agenda no dia do atendimento citado.
  const day = dayOf(data.starts_at);
  if (day) return `/agenda?date=${day}&${tag}`;

  // Falha de resposta da IA: só se sabe o contato.
  if (n.type === 'message_failed' && data.patient_phone) {
    return `/conversas?phone=${encodeURIComponent(data.patient_phone)}&${tag}`;
  }
  return '/agenda';
}
