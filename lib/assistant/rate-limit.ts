// Limite de uso do chat do Assistente por profissional. PURO (sem banco): a rota
// busca as datas das últimas mensagens do usuário e esta função decide.
//
// Por que existir: cada POST /api/assistant/chat chama a Anthropic (custo por
// token). Sem teto, uma sessão presa em loop ou abusada gera conta sem limite.
// Conta só mensagens `role='user'` já gravadas em assistant_messages (a linha é
// inserida no fim do turno), então é um limite aproximado e simples de propósito.

export const RATE_LIMITS = {
  /** Rajada: no máximo N mensagens por janela curta. */
  burst: { max: 30, windowMs: 10 * 60_000 },
  /** Teto diário (janela móvel de 24h). */
  daily: { max: 200, windowMs: 24 * 60 * 60_000 },
} as const;

/** Quantas datas a rota precisa buscar (as mais recentes do teto diário). */
export const RATE_LIMIT_FETCH = RATE_LIMITS.daily.max;

export type RateLimitDecision =
  | { ok: true }
  | {
      ok: false;
      scope: 'burst' | 'daily';
      /** Segundos até a janela liberar mais uma mensagem (>= 1). */
      retryAfterSec: number;
      /** Texto amigável para o usuário (aparece no chat). */
      message: string;
    };

type Window = { max: number; windowMs: number };

/** Segundos até a mensagem que "tranca" a janela sair dela. */
function retryAfterFor(sortedDesc: number[], w: Window, nowMs: number): number {
  // Com `max` mensagens dentro da janela, a próxima só passa quando a `max`-ésima
  // mais recente (índice max-1) sair: ela expira em ts + windowMs.
  const blocker = sortedDesc[w.max - 1];
  return Math.max(1, Math.ceil((blocker + w.windowMs - nowMs) / 1000));
}

/**
 * `timestamps`: datas (ISO) das mensagens do usuário, mais recentes primeiro (ou
 * em qualquer ordem — ordenamos). Só as das últimas 24h importam.
 */
export function evaluateRateLimit(
  timestamps: string[],
  now: Date,
): RateLimitDecision {
  const nowMs = now.getTime();
  const sorted = timestamps
    .map((t) => Date.parse(t))
    .filter((t) => Number.isFinite(t) && t <= nowMs)
    .sort((a, b) => b - a);

  const { burst, daily } = RATE_LIMITS;

  const inDay = sorted.filter((t) => t > nowMs - daily.windowMs);
  if (inDay.length >= daily.max) {
    const retryAfterSec = retryAfterFor(inDay, daily, nowMs);
    return {
      ok: false,
      scope: 'daily',
      retryAfterSec,
      message: `Você chegou ao limite de ${daily.max} mensagens por dia no Assistente. Tente de novo ${waitText(retryAfterSec)}.`,
    };
  }

  const inBurst = sorted.filter((t) => t > nowMs - burst.windowMs);
  if (inBurst.length >= burst.max) {
    const retryAfterSec = retryAfterFor(inBurst, burst, nowMs);
    return {
      ok: false,
      scope: 'burst',
      retryAfterSec,
      message: `Você enviou muitas mensagens em pouco tempo. Aguarde um pouco e tente de novo ${waitText(retryAfterSec)}.`,
    };
  }

  return { ok: true };
}

function waitText(seconds: number): string {
  if (seconds < 60) return 'em instantes';
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 90) return `em cerca de ${minutes} min`;
  return `em cerca de ${Math.ceil(minutes / 60)} h`;
}
