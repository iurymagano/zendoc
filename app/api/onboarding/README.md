# app/api/onboarding/

Endpoints usados durante o onboarding.

## profile/route.ts

**O que faz:** cria ou atualiza o registro em `professionals` vinculado ao
`user_id` da sessão NextAuth. Inicia o trial de 7 dias (`plan_status = 'trialing'`).

**Exporta:** `POST(req): NextResponse`

**Depende de:** `@/auth`, `@/lib/supabase`, `zod`

**Notas:**

- Requer sessão ativa (401 caso contrário).
- Idempotente por `user_id` (upsert com `onConflict: 'user_id'`).
- Cliente usa service key → bypassa RLS, mas sempre referencia o `user_id` da sessão.
