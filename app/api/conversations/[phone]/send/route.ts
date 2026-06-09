import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { sendWhatsAppMessage } from '@/lib/zapi/client';
import type { Professional } from '@/types/database';

const bodySchema = z.object({ message: z.string().trim().min(1).max(2000) });

/**
 * POST /api/conversations/[phone]/send  { message }
 * Envia uma mensagem manual do profissional pelo WhatsApp (handoff) e grava no
 * histórico como `assistant`. Exige WhatsApp conectado.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle<Professional>();
  if (!professional) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  if (!professional.zapi_instance_id || !professional.whatsapp_connected) {
    return NextResponse.json(
      { error: 'WhatsApp não conectado.' },
      { status: 400 },
    );
  }

  const { phone } = await params;
  try {
    await sendWhatsAppMessage(
      professional.zapi_instance_id,
      professional.zapi_token ?? '',
      phone,
      parsed.data.message,
    );
  } catch (err) {
    console.error('Erro ao enviar mensagem manual:', err);
    return NextResponse.json({ error: 'Falha ao enviar pelo WhatsApp.' }, { status: 502 });
  }

  const { data: inserted } = await supabase
    .from('conversation_history')
    .insert({
      professional_id: professional.id,
      patient_phone: phone,
      role: 'assistant',
      content: parsed.data.message,
    })
    .select()
    .single();

  return NextResponse.json({ ok: true, message: inserted });
}
