import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { isBotUserAgent, isTrackedPath } from '@/lib/admin/visits';

// Rota PÚBLICA (exceção à regra do auth()): quem visita a landing, o login e o
// cadastro ainda não tem sessão. Só incrementa um contador anônimo por dia e
// caminho (increment_site_visit), de uma lista fixa; não grava IP nem cookie.
// Nunca devolve erro ao visitante: sempre 204.
export async function POST(req: Request) {
  try {
    if (isBotUserAgent(req.headers.get('user-agent'))) {
      return new NextResponse(null, { status: 204 });
    }
    // sendBeacon pode mandar text/plain; por isso lemos o texto e fazemos o parse.
    // O corpo esperado é minúsculo ({"path":"/register"}): acima de 1 KB, descarta.
    const raw = await req.text();
    if (raw.length > 1024) return new NextResponse(null, { status: 204 });
    const body = JSON.parse(raw) as { path?: unknown };
    if (!isTrackedPath(body?.path)) return new NextResponse(null, { status: 204 });

    const { error } = await createServerClient().rpc('increment_site_visit', {
      p_path: body.path,
    });
    if (error) console.error('Erro ao contar visita:', error.message);
  } catch (err) {
    console.error('Erro ao contar visita:', err);
  }
  return new NextResponse(null, { status: 204 });
}
