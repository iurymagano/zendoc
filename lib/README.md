# lib/

Módulos de domínio reutilizáveis — não expõem rotas.

## supabase.ts

**O que faz:** fábricas de clientes Supabase.

**Exporta:**

- `createServerClient()` — client com `SUPABASE_SERVICE_KEY`, usado em API Routes.
  **Bypassa RLS** — sempre validar `user_id` a partir da sessão.
- `createBrowserClient()` — client com `NEXT_PUBLIC_SUPABASE_ANON_KEY`, usado em
  componentes client. Respeita RLS.

**Notas:** nunca importar `createServerClient` em componentes `'use client'`
nem expor `SUPABASE_SERVICE_KEY` ao browser.

## utils.ts

**O que faz:** utilitário `cn()` gerado pelo shadcn CLI — combina `clsx` +
`tailwind-merge` para resolver classes conflitantes do Tailwind.

**Exporta:**

- `cn(...inputs: ClassValue[]): string`

**Notas:** usado internamente por todos os componentes em `components/ui/`.
Não remover.

## stripe.ts

**O que faz:** cliente Stripe (server-side) com inicialização **lazy** e o
mapeamento de status.

**Exporta:**

- `getStripe(): Stripe` — constrói no primeiro uso (não estoura no import se a
  `STRIPE_SECRET_KEY` não estiver setada). Lança se a key faltar quando usado.
- `planStatusFromStripe(status): 'trialing'|'active'|'past_due'|'cancelled'` —
  mapeia `Stripe.Subscription.Status` para o `plan_status` do IAzen.

**Usado por:** `app/api/billing/*` e `app/api/webhooks/stripe`.

## Subpastas

- [ai/](./ai/) — integração com Claude API (prompt, processor, executor).
- [availability/](./availability/) — cálculo de slots (`slots.ts`).
- [appointments/](./appointments/) — utilitários de domínio (checagem de
  conflito de horário).
- [patients/](./patients/) — utilitários de paciente (validação/máscara de CPF).
- [zapi/](./zapi/) — cliente Evolution API (`sendWhatsAppMessage`; demais
  funções entram quando a conexão WhatsApp for implementada).
