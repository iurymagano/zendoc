// Regras PURAS de "compromisso pessoal" (appointment sem cliente). Sem banco e
// sem rede: usado pela API (PATCH), pelo cron de lembretes e pelo Assistente.
import { isValidPhoneBR, normalizePhoneBR } from '../phone';

/**
 * Compromisso pessoal = appointment sem cliente: `patient_phone` vazio (ou só
 * com espaços/símbolos). Nunca recebe mensagem de WhatsApp.
 */
export function isPersonalCommitment(phone: string | null | undefined): boolean {
  return !phone || phone.replace(/\D/g, '') === '';
}

export type PhonePatchResult =
  | { ok: true; value: string | undefined }
  | { ok: false; error: string };

/**
 * Decide o que fazer com o `patient_phone` de um PATCH, olhando o telefone que o
 * appointment já tem:
 * - campo ausente → sem mudança (`value: undefined`);
 * - atendimento de cliente: o telefone é obrigatório e precisa ser válido
 *   (devolve normalizado, 55 + DDD + número);
 * - compromisso pessoal: aceita vazio (o form de edição reenvia o campo vazio) e
 *   mantém vazio; telefone preenchido é recusado — transformar em atendimento de
 *   cliente exigiria recriar os lembretes, então peça para criar um novo.
 */
export function resolvePhonePatch(
  input: string | undefined,
  currentPhone: string | null | undefined,
): PhonePatchResult {
  if (input === undefined) return { ok: true, value: undefined };

  const normalized = normalizePhoneBR(input);
  const personal = isPersonalCommitment(currentPhone);

  if (normalized === '') {
    if (personal) return { ok: true, value: undefined };
    return { ok: false, error: 'Informe o telefone do cliente.' };
  }

  if (!isValidPhoneBR(normalized)) {
    return { ok: false, error: 'Telefone inválido.' };
  }

  if (personal) {
    return {
      ok: false,
      error:
        'Compromisso pessoal não tem cliente. Para atender alguém, crie um novo agendamento.',
    };
  }

  return { ok: true, value: normalized };
}
