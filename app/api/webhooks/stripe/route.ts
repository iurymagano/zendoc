import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase';
import { getStripe, planStatusFromStripe } from '@/lib/stripe';

// Sincroniza o profissional (por stripe_customer_id) a partir da assinatura.
async function syncSubscription(sub: Stripe.Subscription) {
  const supabase = createServerClient();
  const planStatus = planStatusFromStripe(sub.status);
  const aiEnabled = planStatus === 'trialing' || planStatus === 'active';

  await supabase
    .from('professionals')
    .update({
      plan_status: planStatus,
      ai_enabled: aiEnabled,
      stripe_subscription_id: sub.id,
      trial_ends_at: sub.trial_end
        ? new Date(sub.trial_end * 1000).toISOString()
        : null,
    })
    .eq('stripe_customer_id', sub.customer as string);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook não configurado.' }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error('Assinatura do webhook Stripe inválida:', err);
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            s.subscription as string,
          );
          await syncSubscription(sub);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case 'invoice.payment_failed': {
        // Pausa rápida — o customer.subscription.updated também cobre isso.
        const inv = event.data.object as Stripe.Invoice;
        const supabase = createServerClient();
        await supabase
          .from('professionals')
          .update({ plan_status: 'past_due', ai_enabled: false })
          .eq('stripe_customer_id', inv.customer as string);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(`Erro ao processar webhook Stripe (${event.type}):`, err);
    // 500 → Stripe re-tenta a entrega.
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
