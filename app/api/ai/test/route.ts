import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { processWhatsAppMessage } from '@/lib/ai/processor';
import { isConversationPaused } from '@/lib/conversations/state';
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

// GET: lista conversas (sem ?phone) ou as mensagens de uma conversa (com ?phone).
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const professional = await getProfessional(session.user.id);
  if (!professional) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  const supabase = createServerClient();
  const phone = req.nextUrl.searchParams.get('phone');

  if (phone) {
    const { data } = await supabase
      .from('conversation_history')
      .select('role, content, created_at')
      .eq('professional_id', professional.id)
      .eq('patient_phone', phone)
      .order('created_at', { ascending: true });
    return NextResponse.json({ messages: data ?? [] });
  }

  // Lista de conversas: agrupa as mensagens recentes por telefone (mais recente
  // primeiro), com a última mensagem e a contagem.
  const { data } = await supabase
    .from('conversation_history')
    .select('patient_phone, role, content, created_at')
    .eq('professional_id', professional.id)
    .order('created_at', { ascending: false })
    .limit(1000);

  const byPhone = new Map<
    string,
    { phone: string; last: string; lastRole: string; lastAt: string; count: number }
  >();
  for (const row of data ?? []) {
    const existing = byPhone.get(row.patient_phone);
    if (existing) {
      existing.count += 1;
    } else {
      byPhone.set(row.patient_phone, {
        phone: row.patient_phone,
        last: row.content,
        lastRole: row.role,
        lastAt: row.created_at,
        count: 1,
      });
    }
  }

  return NextResponse.json({ conversations: Array.from(byPhone.values()) });
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

  // Handoff: respeita a pausa também no simulador (igual ao webhook real) —
  // guarda a mensagem e não aciona a IA.
  const supabase = createServerClient();
  if (await isConversationPaused(supabase, professional.id, parsed.data.phone)) {
    await supabase.from('conversation_history').insert({
      professional_id: professional.id,
      patient_phone: parsed.data.phone,
      role: 'user',
      content: parsed.data.message,
    });
    return NextResponse.json({
      reply:
        '⏸️ IA pausada nesta conversa (você assumiu em "Conversas"). A mensagem foi registrada; responda manualmente.',
      paused: true,
    });
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
