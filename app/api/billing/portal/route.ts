import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { getStripe } from '@/lib/stripe';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('stripe_customer_id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!professional?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'Nenhuma assinatura encontrada. Assine primeiro.' },
      { status: 400 },
    );
  }

  try {
    const portal = await getStripe().billingPortal.sessions.create({
      customer: professional.stripe_customer_id as string,
      return_url: `${process.env.NEXT_PUBLIC_URL ?? ''}/configuracoes/assinatura`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error('Erro ao criar portal Stripe:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
