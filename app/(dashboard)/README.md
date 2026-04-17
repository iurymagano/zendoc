# app/(dashboard)/

Route group com as páginas protegidas por autenticação (dashboard, agenda,
configurações). O `middleware.ts` redireciona para `/login` se não autenticado.

## dashboard/page.tsx

**O que faz:** Server Component que busca o `professional` vinculado ao usuário
logado e exibe um resumo (nome, plano, trial, status do WhatsApp). Redireciona
para `/onboarding/step-1` se o perfil ainda não foi criado.

**Depende de:** `@/auth`, `@/lib/supabase`

**Notas:** a UI final do dashboard será desenvolvida nas Sprints 2-3. Esta versão
é um placeholder mínimo para validar o fluxo de login → onboarding → dashboard.
