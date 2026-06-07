// Cliente da Evolution API (self-hosted, multi-instância baseada em Baileys/QR).
//
// Por que ainda se chama lib/zapi: a integração de WhatsApp vive isolada aqui
// (o resto do app não conhece o provider). As colunas do banco
// `zapi_instance_id` / `zapi_token` são reaproveitadas:
//   - zapi_instance_id  → instanceName da Evolution (ex.: "iazen_<professionalId>")
//   - zapi_token        → apikey (hash) daquela instância, devolvido no create
//
// Env necessárias:
//   EVOLUTION_API_URL   → base do servidor Evolution (ex.: https://evo.iazen.com.br)
//   EVOLUTION_API_KEY   → AUTHENTICATION_API_KEY global do servidor
//   WEBHOOK_SECRET      → segredo validado no ?secret= do webhook
//   NEXT_PUBLIC_URL     → base pública do app, usada para montar a URL do webhook

function base(): string {
  const url = process.env.EVOLUTION_API_URL;
  if (!url) throw new Error('EVOLUTION_API_URL não configurada.');
  return url.replace(/\/+$/, '');
}

function globalKey(): string {
  const key = process.env.EVOLUTION_API_KEY;
  if (!key) throw new Error('EVOLUTION_API_KEY não configurada.');
  return key;
}

/** Lê o corpo de erro do Evolution e lança com o conteúdo cru (facilita debug do QR). */
async function ensureOk(res: Response, ctx: string): Promise<unknown> {
  if (res.ok) return res.json().catch(() => ({}));
  const body = await res.text().catch(() => '');
  throw new Error(
    `Evolution ${ctx} ${res.status}: ${body.slice(0, 400) || 'sem corpo'}`,
  );
}

/** Extrai o base64 do QR de qualquer um dos formatos que a Evolution já usou. */
function extractQr(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const qr = (d.qrcode ?? d.qr) as Record<string, unknown> | undefined;
  const candidate =
    (qr?.base64 as string | undefined) ??
    (d.base64 as string | undefined) ??
    (qr?.code as string | undefined) ??
    (d.code as string | undefined);
  return typeof candidate === 'string' && candidate.length > 0
    ? candidate
    : null;
}

/** apikey usada nas chamadas por instância — prefere o hash da instância, cai para a global. */
function instanceKey(token: string | null | undefined): string {
  return token && token.length > 0 ? token : globalKey();
}

export type CreateInstanceResult = {
  instanceName: string;
  apiKey: string | null;
  qrcode: string | null;
};

/**
 * Cria uma instância na Evolution e devolve o nome, a apikey e o QR.
 * Já registra o webhook de mensagens apontando para o app.
 */
export async function createInstance(
  instanceName: string,
): Promise<CreateInstanceResult> {
  // A Evolution roda em container e precisa de uma URL que ela alcance (no dev,
  // host.docker.internal). EVOLUTION_WEBHOOK_URL desacopla isso do NEXT_PUBLIC_URL,
  // que é browser-facing (usado, por ex., nos redirects do Stripe = localhost).
  const publicUrl = (
    process.env.EVOLUTION_WEBHOOK_URL ?? process.env.NEXT_PUBLIC_URL
  )?.replace(/\/+$/, '');
  const webhookUrl = publicUrl
    ? `${publicUrl}/api/whatsapp/webhook?secret=${process.env.WEBHOOK_SECRET ?? ''}`
    : undefined;

  const res = await fetch(`${base()}/instance/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: globalKey(),
    },
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      ...(webhookUrl
        ? {
            webhook: {
              url: webhookUrl,
              byEvents: false,
              base64: true,
              events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
            },
          }
        : {}),
    }),
  });

  const data = (await ensureOk(res, 'create')) as Record<string, unknown>;
  const hash = data.hash;
  const apiKey =
    typeof hash === 'string'
      ? hash
      : ((hash as Record<string, unknown> | undefined)?.apikey as
          | string
          | undefined) ?? null;

  return { instanceName, apiKey, qrcode: extractQr(data) };
}

/** Busca o QR atual da instância via /instance/connect (mais confiável que o create). */
export async function getQRCode(
  instanceName: string,
  token: string,
): Promise<string | null> {
  const res = await fetch(`${base()}/instance/connect/${instanceName}`, {
    headers: { apikey: instanceKey(token) },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return extractQr(data);
}

export async function getConnectionStatus(
  instanceName: string,
  token: string,
): Promise<{ connected: boolean }> {
  const res = await fetch(
    `${base()}/instance/connectionState/${instanceName}`,
    { headers: { apikey: instanceKey(token) } },
  );
  if (!res.ok) return { connected: false };
  const data = (await res.json().catch(() => ({}))) as {
    instance?: { state?: string };
    state?: string;
  };
  const state = data.instance?.state ?? data.state;
  return { connected: state === 'open' };
}

export async function sendWhatsAppMessage(
  instanceName: string,
  token: string,
  phone: string,
  message: string,
): Promise<void> {
  const res = await fetch(`${base()}/message/sendText/${instanceName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: instanceKey(token),
    },
    body: JSON.stringify({ number: phone, text: message }),
  });
  await ensureOk(res, 'sendText');
}

/** Desloga e remove a instância (libera o slot no servidor). Tolerante a falhas. */
export async function disconnectInstance(
  instanceName: string,
  token: string,
): Promise<void> {
  const key = instanceKey(token);
  await fetch(`${base()}/instance/logout/${instanceName}`, {
    method: 'DELETE',
    headers: { apikey: key },
  }).catch(() => {});
  await fetch(`${base()}/instance/delete/${instanceName}`, {
    method: 'DELETE',
    headers: { apikey: key },
  }).catch(() => {});
}
