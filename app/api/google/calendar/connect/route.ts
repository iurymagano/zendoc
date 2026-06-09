import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { buildConsentUrl, signState } from '@/lib/google/auth';

/**
 * GET /api/google/calendar/connect
 * Inicia o OAuth dedicado do Google Calendar: redireciona pro consentimento
 * do Google com escopo de calendário + offline access. O profissional chega
 * aqui por um link/botão em /configuracoes.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL('/login', process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'),
    );
  }

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!professional) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Google OAuth não configurado no servidor.' },
      { status: 500 },
    );
  }

  return NextResponse.redirect(buildConsentUrl(signState(professional.id)));
}
