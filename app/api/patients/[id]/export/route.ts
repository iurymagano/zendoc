import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import type { Patient } from '@/types/database';

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
 * GET /api/patients/[id]/export
 * Exporta todos os dados de um paciente em JSON (LGPD — direito de acesso e
 * portabilidade): cadastro + agendamentos + histórico de conversa. Baixado como
 * arquivo. Só o profissional dono acessa.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const professionalId = await getProfessionalId(session.user.id);
  if (!professionalId) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  const { id } = await params;
  const supabase = createServerClient();

  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('professional_id', professionalId)
    .maybeSingle<Patient>();
  if (!patient) {
    return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 });
  }

  const [{ data: appointments }, { data: conversation }] = await Promise.all([
    supabase
      .from('appointments')
      .select('*')
      .eq('professional_id', professionalId)
      .eq('patient_phone', patient.phone)
      .order('starts_at'),
    supabase
      .from('conversation_history')
      .select('role, content, created_at')
      .eq('professional_id', professionalId)
      .eq('patient_phone', patient.phone)
      .order('created_at'),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    patient,
    appointments: appointments ?? [],
    conversation_history: conversation ?? [],
  };

  const safeName = patient.name.replace(/[^\p{L}\p{N}]+/gu, '_').slice(0, 40);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="paciente_${safeName || id}.json"`,
    },
  });
}
