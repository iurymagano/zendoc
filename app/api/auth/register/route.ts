import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Email ou senha inválidos.' },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;
  const supabase = createServerClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    const msg = error.message?.toLowerCase().includes('already')
      ? 'Já existe uma conta com este email.'
      : 'Não foi possível criar sua conta.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ user_id: data.user?.id });
}
