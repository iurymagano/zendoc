/**
 * Cria (ou reaproveita) o produto + preço de assinatura do IAzen no Stripe e
 * imprime o STRIPE_PRICE_ID para colar no .env.local.
 *
 * Uso:
 *   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-setup.ts
 *   (ou `npm run stripe:setup` com a STRIPE_SECRET_KEY já no ambiente/.env.local)
 *
 * Idempotente: procura um produto com o mesmo nome antes de criar.
 */
import Stripe from 'stripe';

// Carrega .env.local (Node 22+) se a key ainda não estiver no ambiente.
if (!process.env.STRIPE_SECRET_KEY) {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // sem .env.local — segue com o que estiver no ambiente
  }
}

const PRODUCT_NAME = 'IAzen — Assinatura';
const AMOUNT_BRL = 297_00; // centavos
const CURRENCY = 'brl';
const INTERVAL = 'month';

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error('✗ Defina STRIPE_SECRET_KEY no ambiente antes de rodar.');
    process.exit(1);
  }
  const stripe = new Stripe(key, { typescript: true });

  // Reaproveita o produto se já existir (pelo nome).
  const existing = await stripe.products.list({ active: true, limit: 100 });
  let product = existing.data.find((p) => p.name === PRODUCT_NAME);
  if (product) {
    console.log(`• Produto já existe: ${product.id}`);
  } else {
    product = await stripe.products.create({
      name: PRODUCT_NAME,
      description: 'Secretária virtual no WhatsApp — agenda, lembra e gerencia consultas.',
    });
    console.log(`✓ Produto criado: ${product.id}`);
  }

  // Reaproveita um preço recorrente com o mesmo valor/moeda/intervalo.
  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  let price = prices.data.find(
    (p) =>
      p.unit_amount === AMOUNT_BRL &&
      p.currency === CURRENCY &&
      p.recurring?.interval === INTERVAL,
  );
  if (price) {
    console.log(`• Preço já existe: ${price.id}`);
  } else {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: AMOUNT_BRL,
      currency: CURRENCY,
      recurring: { interval: INTERVAL },
    });
    console.log(`✓ Preço criado: ${price.id}`);
  }

  console.log('\n──────────────────────────────────────────────');
  console.log('Cole no seu .env.local:');
  console.log(`STRIPE_PRICE_ID=${price.id}`);
  console.log('──────────────────────────────────────────────');
}

main().catch((err) => {
  console.error('✗ Falha no setup do Stripe:', err);
  process.exit(1);
});
