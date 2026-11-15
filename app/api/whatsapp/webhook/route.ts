import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { processWhatsAppMessage } from '@/lib/ai/processor';
import { isConversationPaused } from '@/lib/conversations/state';
import { sendWhatsAppMessage } from '@/lib/zapi/client';
import { isConnectionUpdateEvent } from '@/lib/zapi/connection-event';
import { handleConnectionUpdate } from '@/lib/zapi/connection-update';
import {
  notifyConversationAttention,
  notifyReplyFailed,
} from '@/lib/notifications/events';
import type { Professional } from '@/types/database';

function ok() {
  return NextResponse.json({ ok: true });
}

type EvolutionMessage = {
  key?: { remoteJid?: string; fromMe?: boolean };
  message?: {
    conversation?: string;
    extendedTextMessage?: { text?: string };
  };
};

/**
 * Identificador do remetente, usado tanto para gravar histórico/cliente quanto
 * para responder.
 * - `@s.whatsapp.net` → telefone em dígitos (`5511999999999`), mantém a
 *   convenção do app e compatibilidade com lembretes.
 * - `@lid` → o JID completo (`123...@lid`). O WhatsApp novo esconde o número
 *   real por privacidade; o LID não é um telefone roteável em dígitos, então
 *   preservamos o JID inteiro — a Evolution sabe entregar mensagens a ele.
 */
function senderIdentifier(jid?: string): string | undefined {
  if (!jid) return undefined;
  if (jid.endsWith('@lid')) return jid;
  return jid.split('@')[0]?.replace(/\D/g, '') || undefined;
}

function textFromMessage(msg?: EvolutionMessage['message']): string | undefined {
  return msg?.conversation ?? msg?.extendedTextMessage?.text ?? undefined;
}

export async function POST(req: NextRequest) {
  // A Evolution não manda header de auth — validamos o segredo na query.
  const secret = req.nextUrl.searchParams.get('secret');
  if (!process.env.WEBHOOK_SECRET || secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return ok();

  // Tratamos mensagens recebidas ("messages.upsert") e a queda/volta da
  // conexão ("connection.update"); qualquer outro evento é ignorado.
  const event: string | undefined = body.event;
  if (isConnectionUpdateEvent(event)) {
    try {
      await handleConnectionUpdate(body);
    } catch (err) {
      console.error('Erro ao tratar connection.update:', err);
    }
    return ok();
  }
  if (event && event !== 'messages.upsert') return ok();

  // `data` pode vir como objeto único ou array.
  const raw = body.data;
  const data: EvolutionMessage | undefined = Array.isArray(raw) ? raw[0] : raw;
  if (!data) return ok();

  const remoteJid = data.key?.remoteJid;
  if (data.key?.fromMe === true) return ok();
  if (remoteJid?.endsWith('@g.us')) return ok(); // grupo

  const instanceName: string | undefined = body.instance;
  const patientPhone = senderIdentifier(remoteJid);
  const message = textFromMessage(data.message);

  if (!instanceName || !patientPhone || !message) return ok();

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('*')
    .eq('zapi_instance_id', instanceName)
    .maybeSingle<Professional>();

  if (!professional) return ok();
  if (!professional.ai_enabled) return ok();
  if (!['trialing', 'active'].includes(professional.plan_status)) return ok();
  if (!professional.zapi_instance_id) return ok();

  // Handoff: se a IA está pausada neste contato, guarda a mensagem recebida
  // (para o profissional ver na caixa de conversas) e NÃO responde.
  if (await isConversationPaused(supabase, professional.id, patientPhone)) {
    await supabase.from('conversation_history').insert({
      professional_id: professional.id,
      patient_phone: patientPhone,
      role: 'user',
      content: message,
    });
    // O cliente falou numa conversa em que a secretária está pausada: o dono
    // precisa responder (no máximo um aviso por hora e por cliente).
    await notifyConversationAttention(professional.id, {
      reason: 'paused',
      patientPhone,
      lastMessage: message,
    });
    return ok();
  }

  try {
    const aiResponse = await processWhatsAppMessage(
      professional,
      patientPhone,
      message,
    );
    try {
      await sendWhatsAppMessage(
        professional.zapi_instance_id,
        professional.zapi_token ?? '',
        patientPhone,
        aiResponse.message_to_patient,
      );
    } catch (sendErr) {
      console.error('Erro ao enviar resposta no WhatsApp:', sendErr);
      // A resposta ficou no histórico mas não chegou ao cliente: avisa o dono.
      await notifyReplyFailed(professional.id, {
        patientPhone,
        reason: professional.whatsapp_connected
          ? 'o envio pelo WhatsApp falhou'
          : 'o WhatsApp está desconectado',
      });
      throw sendErr;
    }
  } catch (err) {
    console.error('Erro ao processar mensagem WhatsApp:', err);
  }

  return ok();
}
