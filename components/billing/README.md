# components/billing/

Componentes relacionados ao ciclo de vida do plano e cobrança. Hoje contém só
o banner de status — quando a integração Stripe entrar (Sprint 4), esta pasta
vai receber os componentes de portal/checkout.

## PlanStatusBanner.tsx

**O que faz:** exibe um aviso contextual no topo do dashboard quando o plano
está em algum estado que exige atenção do profissional.

**Exporta:**

- `PlanStatusBanner({ professional: Professional })` — server-friendly, sem
  hooks nem `'use client'`.

**Variantes:**

| Condição                                      | Variante        | Tom      |
| --------------------------------------------- | --------------- | -------- |
| `plan_status = 'past_due'`                    | `past_due`      | vermelho |
| `plan_status = 'cancelled'`                   | `cancelled`     | cinza    |
| `plan_status = 'trialing'` e `trial_ends_at` ≤ 3 dias | `trial_ending`  | âmbar    |
| `plan_status = 'trialing'` e `trial_ends_at` já passou | `trial_expired` | vermelho |
| Qualquer outro estado (incl. `active`)        | —               | nenhum banner |

Retorna `null` quando não há nada a mostrar, então pode ser renderizado sem
condicional no chamador.

**Depende de:** `@/types/database`.

**Notas:**

- Cálculo de dias usa `Math.ceil` sobre a diferença em ms — qualquer resto
  conta como um dia. Ex.: faltando 2h conta como 1 dia.
- Texto e CTA futuros de "atualizar pagamento" entram junto com a integração
  Stripe.
