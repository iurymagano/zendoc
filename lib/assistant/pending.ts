// Confirmação em duas etapas do Assistente (cancelar/remarcar). PURO (sem banco):
// só as regras de "esta ação preparada já pode ser confirmada?". A persistência
// (tabela assistant_pending_actions) fica em executor.ts.
//
// Por que servidor e não só a flag `confirmed` na ferramenta: o histórico do chat
// guarda só texto, então a IA não leva um token de uma mensagem para a outra, e
// uma flag que ela mesma preenche não prova que o usuário disse "sim". Aqui a
// ação só existe depois de `prepare_*` e só executa numa requisição POSTERIOR.

/** Quanto tempo o usuário tem para confirmar uma ação preparada. */
export const PENDING_TTL_MS = 15 * 60_000;

export type PendingForCheck = {
  request_id: string;
  status: string;
  expires_at: string;
};

export type PendingCheck = { ok: true } | { ok: false; error: string };

export const NO_PENDING_ERROR =
  'Não há nenhuma ação preparada esperando confirmação. Use prepare_cancel_appointment ou prepare_reschedule_appointment, mostre ao usuário o que será feito e espere o "sim" dele.';

export const SAME_REQUEST_ERROR =
  'Esta ação foi preparada agora, na mesma mensagem do usuário. Mostre a ele o que será feito e peça confirmação; só chame confirm_pending_action depois que ele responder, na mensagem seguinte.';

export const EXPIRED_ERROR =
  'A ação preparada expirou (mais de 15 minutos). Prepare de novo e peça a confirmação outra vez.';

export function pendingExpiry(now: Date): Date {
  return new Date(now.getTime() + PENDING_TTL_MS);
}

/**
 * Decide se a ação preparada pode ser executada: tem que existir e estar
 * pendente, não pode ter vencido e NÃO pode ter sido preparada na requisição
 * atual (o usuário precisa ter respondido depois de ver o que seria feito).
 */
export function checkPendingConfirmable(
  pending: PendingForCheck | null,
  ctx: { requestId: string; now: Date },
): PendingCheck {
  if (!pending || pending.status !== 'pending') {
    return { ok: false, error: NO_PENDING_ERROR };
  }
  if (pending.request_id === ctx.requestId) {
    return { ok: false, error: SAME_REQUEST_ERROR };
  }
  if (new Date(pending.expires_at).getTime() < ctx.now.getTime()) {
    return { ok: false, error: EXPIRED_ERROR };
  }
  return { ok: true };
}
