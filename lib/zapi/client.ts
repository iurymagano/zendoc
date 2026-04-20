const BASE = 'https://api.z-api.io';

function url(instanceId: string, token: string, path: string): string {
  return `${BASE}/instances/${instanceId}/token/${token}${path}`;
}

async function ensureOk(res: Response): Promise<unknown> {
  if (res.ok) return res.json().catch(() => ({}));
  const body = await res.text().catch(() => '');
  throw new Error(`Z-API ${res.status}: ${body.slice(0, 200) || 'sem corpo'}`);
}

export async function sendWhatsAppMessage(
  instanceId: string,
  token: string,
  phone: string,
  message: string,
): Promise<void> {
  const res = await fetch(url(instanceId, token, '/send-text'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, message }),
  });
  await ensureOk(res);
}

export async function getQRCode(
  instanceId: string,
  token: string,
): Promise<string | null> {
  const res = await fetch(url(instanceId, token, '/qr-code/image'));
  if (!res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as { value?: string };
  return data.value ?? null;
}

export async function getConnectionStatus(
  instanceId: string,
  token: string,
): Promise<{ connected: boolean }> {
  const res = await fetch(url(instanceId, token, '/status'));
  if (!res.ok) return { connected: false };
  const data = (await res.json().catch(() => ({}))) as { connected?: boolean };
  return { connected: !!data.connected };
}

export async function disconnectInstance(
  instanceId: string,
  token: string,
): Promise<void> {
  const res = await fetch(url(instanceId, token, '/disconnect'), {
    method: 'POST',
  });
  if (!res.ok && res.status !== 404) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `Z-API ${res.status}: ${body.slice(0, 200) || 'sem corpo'}`,
    );
  }
}
