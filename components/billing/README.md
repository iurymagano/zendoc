# components/billing/

Componentes relacionados ao ciclo de vida do plano e cobrança (integração
Stripe — Sprint 4).

## BillingButton.tsx

**O que faz:** botão client que dispara o checkout ou o portal do Stripe — faz
`POST` no endpoint e redireciona o navegador para a `url` hospedada devolvida.

**Exporta:**

- `BillingButton({ endpoint, label, variant?, className? })` — `endpoint` é
  `/api/billing/checkout` ou `/api/billing/portal`. Mostra estado "Abrindo…" e
  erro inline.

**Usado em:** `PlanStatusBanner` (CTA por variante) e `/configuracoes/assinatura`.

## PlanStatusBanner.tsx

**O que faz:** exibe um aviso contextual no topo do dashboard quando o plano
está em algum estado que exige atenção do profissional.

**Exporta:**

- `PlanStatusBanner({ professional: Professional })` — server component que
  renderiza o `BillingButton` (client) como CTA por variante.

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

**CTA por variante:** `past_due` → portal ("Atualizar pagamento"); `cancelled`
→ checkout ("Reativar plano"); `trial_ending`/`trial_expired` → checkout
("Assinar agora").

**Depende de:** `@/types/database`, `./BillingButton`.

**Notas:**

- Cálculo de dias usa `Math.ceil` sobre a diferença em ms — qualquer resto
  conta como um dia. Ex.: faltando 2h conta como 1 dia.
