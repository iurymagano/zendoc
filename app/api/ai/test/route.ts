import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { processWhatsAppMessage } from '@/lib/ai/processor';
import type { Professional } from '@/types/database';

const phoneRegex = /^\d{11,13}$/;

const bodySchema = z.object({
  phone: z.string().regex(phoneRegex),
  message: z.string().min(1).max(2000),
});

async function getProfessional(userId: string): Promise<Professional | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('professionals')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle<Professional>();
  return data ?? null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const professional = await getProfessional(session.user.id);
  if (!professional) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  try {
    const aiResponse = await processWhatsAppMessage(
      professional,
      parsed.data.phone,
      parsed.data.message,
    );
    // Devolve a resposta completa para a UI de teste mostrar a ação tomada.
    return NextResponse.json({
      reply: aiResponse.message_to_patient,
      action: aiResponse.action,
      booking: aiResponse.booking ?? null,
      cancel: aiResponse.cancel ?? null,
      slots: aiResponse.slots ?? null,
    });
  } catch (err) {
    console.error('Erro no teste da IA:', err);
    return NextResponse.json(
      { error: 'Erro ao processar mensagem' },
      { status: 500 },
    );
  }
}

// Limpa o histórico de conversa de um telefone (contexto que a IA enxerga).
// Não mexe em appointments — agendamentos feitos no teste continuam na agenda.
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const professional = await getProfessional(session.user.id);
  if (!professional) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  const phone = req.nextUrl.searchParams.get('phone') ?? '';
  if (!phoneRegex.test(phone)) {
    return NextResponse.json({ error: 'Telefone inválido.' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from('conversation_history')
    .delete()
    .eq('professional_id', professional.id)
    .eq('patient_phone', phone);

  if (error) {
    console.error('Erro ao limpar histórico de teste:', error);
    return NextResponse.json(
      { error: 'Erro ao limpar histórico.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
