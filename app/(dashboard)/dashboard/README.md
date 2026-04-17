# app/(dashboard)/dashboard/

Página principal após o login.

## page.tsx

**O que faz:** Server Component — lê a sessão via `auth()`, busca o
`professional` correspondente no Supabase e renderiza cartões com status do plano,
trial e conexão WhatsApp. Redireciona para `/onboarding/step-1` se o perfil não
existir.

**Depende de:** `@/auth`, `@/lib/supabase`

**Notas:** versão mínima. Agenda, lista de pacientes e conexão WhatsApp serão
adicionadas nas Sprints 2-3.
