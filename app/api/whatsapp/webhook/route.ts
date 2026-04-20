import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { processWhatsAppMessage } from '@/lib/ai/processor';
import { sendWhatsAppMessage } from '@/lib/zapi/client';
import type { Professional } from '@/types/database';

function ok() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const clientToken = req.headers.get('client-token');
  if (!process.env.ZAPI_CLIENT_TOKEN || clientToken !== process.env.ZAPI_CLIENT_TOKEN) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return ok();

  if (body.fromMe === true || body.isGroup === true) return ok();

  const instanceId = req.nextUrl.searchParams.get('instance');
  const patientPhone: string | undefined = body.phone;
  const message: string | undefined = body.text?.message;

  if (!instanceId || !patientPhone || !message) return ok();

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('*')
    .eq('zapi_instance_id', instanceId)
    .maybeSingle<Professional>();

  if (!professional) return ok();
  if (!professional.ai_enabled) return ok();
  if (!['trialing', 'active'].includes(professional.plan_status)) return ok();
  if (!professional.zapi_instance_id || !professional.zapi_token) {
    console.error(
      `Webhook recebido para instância ${instanceId} sem zapi_token no banco`,
    );
    return ok();
  }

  try {
    const reply = await processWhatsAppMessage(
      professional,
      patientPhone,
      message,
    );
    await sendWhatsAppMessage(
      professional.zapi_instance_id,
      professional.zapi_token,
      patientPhone,
      reply,
    );
  } catch (err) {
    console.error('Erro ao processar mensagem WhatsApp:', err);
  }

  return ok();
}
