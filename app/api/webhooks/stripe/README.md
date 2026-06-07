# app/api/webhooks/stripe/

Webhook **público** do Stripe — sincroniza o estado da assinatura no banco.

## route.ts

**Endpoint:** `POST /api/webhooks/stripe`

**Autenticação:** valida a assinatura (`stripe-signature`) sobre o **corpo cru**
(`await req.text()`) com `STRIPE_WEBHOOK_SECRET`. Sem secret/assinatura → `400`.

**Eventos tratados:**

- `customer.subscription.created | updated | deleted` → `syncSubscription()`:
  mapeia `subscription.status` via `planStatusFromStripe` e atualiza o
  profissional (por `stripe_customer_id`): `plan_status`, `ai_enabled`
  (true só em `trialing`/`active`), `stripe_subscription_id`, `trial_ends_at`.
- `checkout.session.completed` → recupera a subscription e chama `syncSubscription`.
- `invoice.payment_failed` → pausa rápida (`past_due` + `ai_enabled=false`).

**Respostas:** `200 { received: true }` no sucesso; `400` assinatura inválida;
`500` em erro de processamento (o Stripe re-tenta a entrega).

**Notas:**

- Fonte da verdade são os eventos de subscription — os demais são reforço.
- Configurar no dev com `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
  (o `stripe listen` imprime o `whsec_` para o `STRIPE_WEBHOOK_SECRET`).

**Depende de:** `@/lib/supabase`, `@/lib/stripe` (`getStripe`, `planStatusFromStripe`).
