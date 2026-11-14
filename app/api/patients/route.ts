import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { isValidCpf, normalizeCpf } from '@/lib/patients/cpf';
import { isValidPhoneBR, normalizePhoneBR } from '@/lib/phone';

// Aceita qualquer formato digitado; grava sempre 55 + DDD + número (só dígitos).
const phoneSchema = z.string().transform(normalizePhoneBR).refine(isValidPhoneBR);

const bodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: phoneSchema,
  cpf: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

/**
 * Normaliza/valida o CPF recebido. Vazio → null (campo opcional).
 * Retorna `{ ok: true, cpf }` ou `{ ok: false }` se inválido.
 */
function parseCpf(
  raw: string | null | undefined,
): { ok: true; cpf: string | null } | { ok: false } {
  if (raw == null || raw.trim() === '') return { ok: true, cpf: null };
  const norm = normalizeCpf(raw);
  if (!isValidCpf(norm)) return { ok: false };
  return { ok: true, cpf: norm };
}

/** Mensagem de conflito conforme o índice violado (cpf x telefone). */
function uniqueConflictMessage(message?: string): string {
  return message?.includes('cpf')
    ? 'Já existe um cliente com este CPF.'
    : 'Já existe um cliente com este telefone.';
}

async function getProfessionalId(userId: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const professionalId = await getProfessionalId(session.user.id);
  if (!professionalId) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q')?.trim() ?? '';

  const supabase = createServerClient();
  let query = supabase
    .from('patients')
    .select('*')
    .eq('professional_id', professionalId)
    .order('name');

  if (search) {
    const digits = search.replace(/\D/g, '');
    // telefone e CPF são gravados só com dígitos → busca pelos dígitos digitados
    // (ex.: "(11) 91111-2222" acha 5511911112222).
    const clauses = [`name.ilike.%${search}%`];
    if (digits) {
      clauses.push(`phone.ilike.%${digits}%`, `cpf.ilike.%${digits}%`);
    }
    query = query.or(clauses.join(','));
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao listar clientes:', error);
    return NextResponse.json(
      { error: 'Erro ao listar clientes.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ patients: data ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const professionalId = await getProfessionalId(session.user.id);
  if (!professionalId) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  const cpfResult = parseCpf(parsed.data.cpf);
  if (!cpfResult.ok) {
    return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('patients')
    .insert({
      professional_id: professionalId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      cpf: cpfResult.cpf,
      notes: parsed.data.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: uniqueConflictMessage(error.message) },
        { status: 409 },
      );
    }
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao criar cliente.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, patient: data });
}
