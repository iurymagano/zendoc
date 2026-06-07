# scripts/

Scripts utilitários rodados manualmente (não fazem parte do runtime do app).

---

## stripe-setup.ts

**O que faz:** cria (ou reaproveita) o produto + preço de assinatura do IAzen no
Stripe e imprime o `STRIPE_PRICE_ID` para colar no `.env.local`.

**Uso:** `npm run stripe:setup` (com `STRIPE_SECRET_KEY` no `.env.local` ou no
ambiente). Carrega o `.env.local` via `process.loadEnvFile` (Node 22+).

**Config:** produto "IAzen — Assinatura", preço **R$297/mês** (`297_00` centavos,
`brl`, recorrência mensal). Idempotente — procura produto/preço iguais antes de
criar.

**Depende de:** `stripe` (cria seu próprio client; não usa `lib/stripe.ts`).
