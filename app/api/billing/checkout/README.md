# app/api/billing/checkout/

## route.ts

**Endpoint:** `POST /api/billing/checkout`

**Autenticação:** sessão NextAuth obrigatória.

**Comportamento:**

1. Carrega o profissional logado.
2. Se não tem `stripe_customer_id`, cria um customer no Stripe (email + nome +
   `metadata.professional_id`) e salva no banco.
3. Cria uma **Checkout Session** de assinatura: `mode: subscription`,
   `line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }]`. **Sem trial no
   Stripe** — cobra na hora e a assinatura nasce `active`. O teste grátis de 7
   dias é o do onboarding (sem cartão), não o do checkout.
4. `success_url`/`cancel_url` → `/configuracoes/assinatura`.

**Resposta 200:** `{ url }` (URL hospedada do Stripe; o cliente redireciona).

**Erros:** `401` (sem sessão), `404` (sem perfil), `500` (sem `STRIPE_PRICE_ID`
ou erro no Stripe — mensagem propagada).

**Depende de:** `@/auth`, `@/lib/supabase`, `@/lib/stripe` (`getStripe`).
