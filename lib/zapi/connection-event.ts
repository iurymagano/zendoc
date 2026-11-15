// Interpretação PURA do evento `connection.update` da Evolution (sem I/O, testável).
// Fica separada de `connection-update.ts` (que fala com banco/Evolution).

export type ConnectionUpdate = {
  instance: string;
  /** 'open' | 'close' | 'connecting' (qualquer outro valor vira undefined). */
  state: 'open' | 'close' | 'connecting' | undefined;
  /** Código de desconexão do Baileys (401 deslogado, 440 substituída...). */
  statusReason: number | undefined;
};

/** O nome do evento chega como `connection.update` ou `CONNECTION_UPDATE`. */
export function isConnectionUpdateEvent(event: unknown): boolean {
  return (
    typeof event === 'string' &&
    event.toLowerCase().replace(/_/g, '.') === 'connection.update'
  );
}

/** Extrai instância, estado e motivo do corpo do webhook. Sem instância → null. */
export function parseConnectionUpdate(body: unknown): ConnectionUpdate | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as {
    instance?: unknown;
    data?: unknown;
  };
  const raw = Array.isArray(b.data) ? b.data[0] : b.data;
  const data = (raw && typeof raw === 'object' ? raw : {}) as {
    state?: unknown;
    statusReason?: unknown;
    instance?: unknown;
  };

  const instance =
    typeof b.instance === 'string' && b.instance
      ? b.instance
      : typeof data.instance === 'string' && data.instance
        ? data.instance
        : null;
  if (!instance) return null;

  const state =
    data.state === 'open' || data.state === 'close' || data.state === 'connecting'
      ? data.state
      : undefined;
  const reason = Number(data.statusReason);
  return {
    instance,
    state,
    statusReason: Number.isFinite(reason) && data.statusReason != null ? reason : undefined,
  };
}

/** Motivos em que o WhatsApp não volta sozinho: deslogado, proibido, sessão substituída. */
const DEFINITIVE_REASONS = new Set([401, 403, 440]);

export type ConnectionDecision =
  /** Voltou a conectar: restaura `whatsapp_connected=true` sem avisar. */
  | 'reconnected'
  /** Caiu de vez (deslogou/sessão substituída): marca e avisa já. */
  | 'disconnected'
  /** Caiu por motivo incerto: confirmar com a Evolution antes de marcar. */
  | 'confirm'
  /** Nada a fazer (connecting, desconhecido). */
  | 'ignore';

/** O que fazer com o evento, dado o estado atual da conexão no banco. */
export function decideConnectionAction(
  update: Pick<ConnectionUpdate, 'state' | 'statusReason'>,
  currentlyConnected: boolean,
): ConnectionDecision {
  if (update.state === 'open') return currentlyConnected ? 'ignore' : 'reconnected';
  if (update.state !== 'close') return 'ignore';
  // Já está desconectado no banco (ex.: QR ainda não escaneado): nada a avisar.
  if (!currentlyConnected) return 'ignore';
  return update.statusReason !== undefined && DEFINITIVE_REASONS.has(update.statusReason)
    ? 'disconnected'
    : 'confirm';
}
