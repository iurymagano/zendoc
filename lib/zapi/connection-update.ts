// Trata o evento `connection.update` da Evolution (SERVER-ONLY): mantém
// `professionals.whatsapp_connected` em dia e avisa o dono quando o WhatsApp
// cai. A decisão pura vive em `connection-event.ts`.
import { createServerClient } from '@/lib/supabase';
import { notifyWhatsappDisconnected } from '@/lib/notifications/events';
import { getConnectionStatus } from './client';
import {
  decideConnectionAction,
  parseConnectionUpdate,
  type ConnectionUpdate,
} from './connection-event';

/** Quanto esperar antes de confirmar uma queda "incerta" (reconexão automática do Baileys). */
const CONFIRM_DELAY_MS = 5000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ProfessionalConn = {
  id: string;
  zapi_instance_id: string | null;
  zapi_token: string | null;
  whatsapp_connected: boolean;
};

/**
 * Marca como desconectado e avisa UMA vez. O `update ... where
 * whatsapp_connected = true` é o dedupe: só quem de fato virou a chave avisa
 * (eventos repetidos da Evolution não geram avisos duplicados).
 */
async function markDisconnected(professionalId: string): Promise<void> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('professionals')
    .update({ whatsapp_connected: false })
    .eq('id', professionalId)
    .eq('whatsapp_connected', true)
    .select('id');
  if (error) {
    console.error('connection.update: erro ao marcar desconectado:', error);
    return;
  }
  if ((data ?? []).length > 0) await notifyWhatsappDisconnected(professionalId);
}

export async function handleConnectionUpdate(body: unknown): Promise<void> {
  const update: ConnectionUpdate | null = parseConnectionUpdate(body);
  if (!update) return;

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('id, zapi_instance_id, zapi_token, whatsapp_connected')
    .eq('zapi_instance_id', update.instance)
    .maybeSingle<ProfessionalConn>();
  if (!professional) return;

  const action = decideConnectionAction(update, professional.whatsapp_connected);

  if (action === 'reconnected') {
    await supabase
      .from('professionals')
      .update({ whatsapp_connected: true })
      .eq('id', professional.id);
    return;
  }

  if (action === 'disconnected') {
    await markDisconnected(professional.id);
    return;
  }

  if (action === 'confirm') {
    // Queda com motivo incerto: o Baileys costuma reconectar sozinho. Só marca
    // (e avisa) se, passados alguns segundos, a Evolution ainda diz que caiu.
    await sleep(CONFIRM_DELAY_MS);
    try {
      const { connected } = await getConnectionStatus(
        update.instance,
        professional.zapi_token ?? '',
      );
      if (!connected) await markDisconnected(professional.id);
    } catch (err) {
      console.error('connection.update: erro ao confirmar estado:', err);
    }
  }
}
