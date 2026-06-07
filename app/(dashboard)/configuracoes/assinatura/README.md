# app/(dashboard)/configuracoes/assinatura/

Tela de gerenciamento da assinatura (plano IAzen, R$297/mês). O teste grátis de
7 dias é o do onboarding (sem cartão); o checkout cobra na hora.

## page.tsx

**O que faz:** server component que carrega o profissional logado e mostra o
status do plano, **detalhes ao vivo do Stripe** e os botões adequados.

**Detalhes do plano (quando há assinatura):** busca a subscription no Stripe
(`getStripe().subscriptions.retrieve`, expandindo `default_payment_method`) e
exibe valor (R$297/mês), próxima/primeira cobrança (`current_period_end` — fica
no **item** da subscription na API recente), cartão (`•••• last4`) e aviso de
cancelamento agendado. **Atenção:** o Billing Portal agenda o cancelamento via
`cancel_at` (data explícita), não via `cancel_at_period_end` — a tela considera
os dois (`cancelAt = sub.cancel_at ?? (cancel_at_period_end ? current_period_end : null)`).
Tolerante a falha — se o Stripe não responder, renderiza só o básico.

**Cancelar / trocar cartão / faturas:** tudo pelo botão "Gerenciar assinatura"
→ Billing Portal hospedado do Stripe (não há cancelamento custom no app).

**Lógica de botões:**

- `subscribed` (tem `stripe_subscription_id` e não está `cancelled`) →
  **Gerenciar assinatura** (`/api/billing/portal`).
- caso contrário → **Assinar agora** / **Reativar plano** (`/api/billing/checkout`).
- `past_due` sem assinatura ativa → também oferece **Atualizar pagamento** (portal).

Mostra dias restantes de trial (de `trial_ends_at`) e um aviso de sucesso quando
volta do checkout (`?success=1`). O status real chega via webhook do Stripe.

**Depende de:** `@/auth`, `@/lib/supabase`, `@/components/billing/BillingButton`,
`@/components/dashboard/PageHeader`, `@/components/ui/card`.
