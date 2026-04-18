const BASE = process.env.EVOLUTION_API_URL;
const KEY = process.env.EVOLUTION_API_KEY;

function headers() {
  if (!KEY) throw new Error('EVOLUTION_API_KEY não configurada');
  return { 'Content-Type': 'application/json', apikey: KEY };
}

function assertBase(): string {
  if (!BASE) throw new Error('EVOLUTION_API_URL não configurada');
  return BASE;
}

export async function sendWhatsAppMessage(
  instanceId: string,
  to: string,
  text: string,
): Promise<void> {
  const base = assertBase();
  const res = await fetch(`${base}/message/sendText/${instanceId}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ number: to, text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `Evolution API ${res.status}: ${body.slice(0, 200) || 'sem corpo'}`,
    );
  }
}
