import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { getStripe } from '@/lib/stripe';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  if (!process.env.STRIPE_PRICE_ID) {
    return NextResponse.json(
      { error: 'STRIPE_PRICE_ID não configurado.' },
      { status: 500 },
    );
  }

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('id, name, stripe_customer_id, plan_status')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!professional) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  }

  try {
    const stripe = getStripe();
    // Garante um customer Stripe para o profissional.
    let customerId = professional.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email ?? undefined,
        name: professional.name,
        metadata: { professional_id: professional.id },
      });
      customerId = customer.id;
      await supabase
        .from('professionals')
        .update({ stripe_customer_id: customerId })
        .eq('id', professional.id);
    }

    const base = process.env.NEXT_PUBLIC_URL ?? '';
    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      // Sem trial no checkout: o teste grátis de 7 dias é o do onboarding
      // (sem cartão). Ao assinar, cobra na hora e a assinatura nasce `active`.
      subscription_data: {
        metadata: { professional_id: professional.id },
      },
      success_url: `${base}/configuracoes/assinatura?success=1`,
      cancel_url: `${base}/configuracoes/assinatura`,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error('Erro ao criar checkout Stripe:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
