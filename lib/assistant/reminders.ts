// Regras PURAS dos lembretes pessoais: texto enviado no WhatsApp e checagem de
// "dá para entregar?". Usado pelo executor do Assistente (aviso ao criar) e pelo
// cron /api/reminders/dispatch (marca failed com o motivo).
import { isValidPhoneBR, normalizePhoneBR } from '../phone';

export type DeliveryProfile = {
  phone: string | null;
  plan_status: string;
  zapi_instance_id: string | null;
  whatsapp_connected: boolean;
};

export type DeliveryCheck =
  | { ok: true; phone: string }
  | { ok: false; reason: string };

/** Mensagem que o profissional recebe no WhatsApp quando o lembrete dispara. */
export function buildPersonalReminderMessage(text: string): string {
  return `Lembrete do seu assistente IAzen:\n${text.trim()}`;
}

/**
 * Verifica se um lembrete pessoal pode ser entregue agora. A ordem importa: o
 * motivo devolvido vira `error_message` do lembrete e é mostrado ao usuário.
 */
export function checkPersonalReminderDelivery(
  prof: DeliveryProfile,
): DeliveryCheck {
  if (!['trialing', 'active'].includes(prof.plan_status)) {
    return { ok: false, reason: `Plano inativo: ${prof.plan_status}` };
  }
  if (!prof.zapi_instance_id || !prof.whatsapp_connected) {
    return { ok: false, reason: 'WhatsApp não conectado' };
  }
  const phone = normalizePhoneBR(prof.phone ?? '');
  if (!isValidPhoneBR(phone)) {
    return {
      ok: false,
      reason: 'Telefone do profissional ausente ou inválido (Configurações)',
    };
  }
  return { ok: true, phone };
}
