# app/api/billing/portal/

## route.ts

**Endpoint:** `POST /api/billing/portal`

**Autenticação:** sessão NextAuth obrigatória.

**Comportamento:** cria uma sessão do **Billing Portal** do Stripe para o
`stripe_customer_id` do profissional e devolve `{ url }`. O portal permite
trocar cartão, ver faturas e cancelar a assinatura. `return_url` →
`/configuracoes/assinatura`.

**Erros:** `401` (sem sessão), `404` (sem perfil), `400` (sem
`stripe_customer_id` — precisa assinar primeiro), `500` (erro no Stripe).

**Depende de:** `@/auth`, `@/lib/supabase`, `@/lib/stripe` (`getStripe`).
