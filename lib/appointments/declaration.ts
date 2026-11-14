// Quando a declaração de comparecimento pode ser emitida. PURO (sem banco).
//
// A declaração afirma que o cliente "compareceu". Isso só é verdade para um
// atendimento que já começou e que não foi cancelado nem marcado como falta;
// emitir antes (ou para cancelado) cria um documento falso.

export type DeclarationBlockReason = 'future' | 'cancelled' | 'no_show';

export type DeclarationEligibility =
  | { ok: true }
  | { ok: false; reason: DeclarationBlockReason; message: string };

export const DECLARATION_MESSAGES: Record<DeclarationBlockReason, string> = {
  future: 'A declaração fica disponível depois do atendimento.',
  cancelled: 'Este atendimento foi cancelado, então não há comparecimento para declarar.',
  no_show: 'O cliente faltou a este atendimento, então não há comparecimento para declarar.',
};

export function declarationEligibility(
  appointment: { starts_at: string; status: string },
  now: Date = new Date(),
): DeclarationEligibility {
  if (appointment.status === 'cancelled') {
    return { ok: false, reason: 'cancelled', message: DECLARATION_MESSAGES.cancelled };
  }
  if (appointment.status === 'no_show') {
    return { ok: false, reason: 'no_show', message: DECLARATION_MESSAGES.no_show };
  }
  // "Já começou" basta: o profissional pode emitir ao final da sessão em curso.
  if (new Date(appointment.starts_at).getTime() > now.getTime()) {
    return { ok: false, reason: 'future', message: DECLARATION_MESSAGES.future };
  }
  return { ok: true };
}
