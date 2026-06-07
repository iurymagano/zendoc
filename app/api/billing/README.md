# app/api/billing/

Endpoints de assinatura (Stripe) do profissional logado. Usam o cliente lazy de
[lib/stripe.ts](../../../lib/stripe.ts) e exigem sessão NextAuth.

## Subpastas

- [checkout/](./checkout/) — `POST` cria a Checkout Session de assinatura
  (trial 7 dias) e devolve `{ url }`.
- [portal/](./portal/) — `POST` cria a sessão do Billing Portal (gerenciar /
  trocar cartão / cancelar) e devolve `{ url }`.

O webhook que reage aos eventos (`plan_status`, `ai_enabled`) fica em
[../webhooks/stripe/](../webhooks/stripe/).
