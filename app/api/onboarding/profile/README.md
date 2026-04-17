# app/api/onboarding/profile/

Endpoint que persiste o perfil do profissional ao final do onboarding.

## route.ts

**O que faz:** `POST` que lê a sessão NextAuth e faz upsert em `professionals`
com os dados do passo 1 (nome, phone) e passo 2 (specialty, address, tone,
custom_instructions). Define `plan_status = 'trialing'` e
`trial_ends_at = now() + 7 dias`.

**Exporta:** `POST(req): NextResponse`

**Depende de:** `@/auth`, `@/lib/supabase`, `zod`

**Notas:**

- Chave única: `professionals.user_id`. Chamadas subsequentes atualizam em vez
  de duplicar.
- Phone já vem normalizado (`55DDDNNNNNNNNN`) do passo 1.
