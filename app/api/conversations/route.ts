import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';

async function getProfessionalId(userId: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * GET /api/conversations
 * Lista as conversas do profissional (uma por telefone), com a última mensagem,
 * nome do paciente (se cadastrado) e se a IA está pausada naquele contato.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const professionalId = await getProfessionalId(session.user.id);
  if (!professionalId) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  const supabase = createServerClient();

  // Mensagens recentes → reduzidas a uma entrada por telefone (a mais recente).
  const { data: rows } = await supabase
    .from('conversation_history')
    .select('patient_phone, role, content, created_at')
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false })
    .limit(400);

  const byPhone = new Map<
    string,
    { phone: string; last_message: string; last_role: string; last_at: string }
  >();
  for (const r of rows ?? []) {
    if (!byPhone.has(r.patient_phone)) {
      byPhone.set(r.patient_phone, {
        phone: r.patient_phone,
        last_message: r.content,
        last_role: r.role,
        last_at: r.created_at,
      });
    }
  }

  const phones = [...byPhone.keys()];
  const [{ data: patients }, { data: states }] = await Promise.all([
    supabase
      .from('patients')
      .select('phone, name')
      .eq('professional_id', professionalId)
      .in('phone', phones.length ? phones : ['']),
    supabase
      .from('conversation_state')
      .select('patient_phone, ai_paused')
      .eq('professional_id', professionalId)
      .in('patient_phone', phones.length ? phones : ['']),
  ]);

  const nameByPhone = new Map((patients ?? []).map((p) => [p.phone, p.name]));
  const pausedByPhone = new Map(
    (states ?? []).map((s) => [s.patient_phone, s.ai_paused]),
  );

  const conversations = [...byPhone.values()]
    .map((c) => ({
      ...c,
      name: nameByPhone.get(c.phone) ?? null,
      ai_paused: pausedByPhone.get(c.phone) ?? false,
    }))
    .sort((a, b) => b.last_at.localeCompare(a.last_at));

  return NextResponse.json({ conversations });
}
