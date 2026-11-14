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

// ---------------------------------------------------------------------------
// Ação preparada que atravessa mensagens
//
// O histórico do chat guarda só texto: na mensagem "Sim, confirmo" a IA não sabe
// que existe uma ação preparada e tende a chamar prepare_* de novo (o que
// substituía a anterior e zerava a confirmação — bug do PR #2). Dois reforços:
//  1. chat.ts injeta a ação pendente no bloco dinâmico do prompt (formatPendingForPrompt);
//  2. preparar de novo a MESMA ação não substitui a pendente (decidePendingSave),
//     preservando o request_id original para que a confirmação funcione.
// ---------------------------------------------------------------------------

export type PendingKind = 'cancel' | 'reschedule';

/** Campos que identificam "a mesma ação" (o motivo do cancelamento não conta). */
export type PendingIdentity = {
  kind: PendingKind;
  appointment_id: string;
  new_starts_at: string | null;
  new_ends_at: string | null;
};

export type PendingForSave = PendingIdentity & PendingForCheck;

const sameInstant = (a: string | null, b: string | null): boolean => {
  if (a === null || b === null) return a === b;
  return Date.parse(a) === Date.parse(b);
};

/** Mesma ação = mesmo tipo, mesmo atendimento e (remarcar) mesmo novo horário. */
export function isSamePendingAction(a: PendingIdentity, b: PendingIdentity): boolean {
  return (
    a.kind === b.kind &&
    a.appointment_id === b.appointment_id &&
    sameInstant(a.new_starts_at, b.new_starts_at) &&
    sameInstant(a.new_ends_at, b.new_ends_at)
  );
}

export type PendingSaveDecision =
  /**
   * Já existe uma ação idêntica e válida: não grava nada e mantém o request_id.
   * `carriedOver` = ela veio de uma mensagem anterior (o usuário já viu o resumo).
   */
  | { action: 'reuse'; carriedOver: boolean }
  /** Grava uma nova (substituindo a pendente atual, se houver). */
  | { action: 'replace' };

/**
 * Decide se `prepare_*` deve reaproveitar a ação pendente ou gravar uma nova.
 * Só reaproveita se estiver pendente, não vencida e idêntica à pedida.
 */
export function decidePendingSave(
  existing: PendingForSave | null,
  candidate: PendingIdentity,
  ctx: { requestId: string; now: Date },
): PendingSaveDecision {
  if (!existing || existing.status !== 'pending') return { action: 'replace' };
  if (new Date(existing.expires_at).getTime() < ctx.now.getTime()) {
    return { action: 'replace' };
  }
  if (!isSamePendingAction(existing, candidate)) return { action: 'replace' };
  return { action: 'reuse', carriedOver: existing.request_id !== ctx.requestId };
}

export type PendingForPrompt = {
  kind: PendingKind;
  summary: string;
  expires_at: string;
};

/**
 * Bloco do prompt dinâmico que avisa a IA da ação já mostrada ao usuário e diz o
 * que fazer com a próxima resposta dele. `formatExpiry` recebe o ISO de validade.
 */
export function formatPendingForPrompt(
  pending: PendingForPrompt,
  formatExpiry: (iso: string) => string,
): string {
  const verb = pending.kind === 'cancel' ? 'CANCELAR' : 'REMARCAR';
  return `AÇÃO PREPARADA AGUARDANDO CONFIRMAÇÃO (${verb}) — o usuário já viu este resumo na mensagem anterior:
- ${pending.summary} (vale até ${formatExpiry(pending.expires_at)})
Se a mensagem do usuário agora for a confirmação ("sim", "confirmo", "pode", "isso", "ok"), chame confirm_pending_action — NÃO chame prepare_cancel_appointment nem prepare_reschedule_appointment de novo, pois isso reinicia a confirmação e nada é executado. Se ele recusar, mudar de ideia ou pedir outra coisa, NÃO chame confirm_pending_action (prepare de novo só se ele pedir uma ação nova).`;
}
