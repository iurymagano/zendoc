import Stripe from 'stripe';

// Inicialização lazy: o `new Stripe('')` estoura se a key não existir, então só
// construímos no primeiro uso (evita quebrar o import do módulo quando a env
// ainda não está configurada). Os callers checam auth/validação antes de usar.
let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY não configurada.');
    client = new Stripe(key, { typescript: true });
  }
  return client;
}

// Mapeia o status da assinatura Stripe para o plan_status do IAzen.
export function planStatusFromStripe(
  status: Stripe.Subscription.Status,
): 'trialing' | 'active' | 'past_due' | 'cancelled' {
  switch (status) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
      return 'past_due';
    case 'canceled':
    case 'incomplete_expired':
    case 'paused':
      return 'cancelled';
    default:
      return 'cancelled';
  }
}
