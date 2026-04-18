# app/(dashboard)/

Route group com as páginas protegidas por autenticação (dashboard,
configurações). O `middleware.ts` redireciona para `/login` se não autenticado.

## Subpastas

- [dashboard/](./dashboard/) — visão geral após login.
- [configuracoes/](./configuracoes/) — telas de configuração (disponibilidade,
  WhatsApp, etc.).
- [pacientes/](./pacientes/) — cadastro e gestão manual de pacientes.
- [agenda/](./agenda/) — visão semanal dos agendamentos.

## dashboard/page.tsx

**O que faz:** Server Component que busca o `professional` vinculado ao usuário
logado, conta quantos blocos semanais ativos existem e exibe:

- Saudação com nome/especialidade/plano
- Card CTA "Configure sua agenda" (quando `availability_weekly` ainda está vazio)
- Card "Agenda" com atalhos para disponibilidade semanal e exceções
- Card "Agenda da semana" com atalho para `/agenda`
- Card "Pacientes" com atalho para o cadastro
- Cards de WhatsApp e Trial

Redireciona para `/onboarding/step-1` se o perfil ainda não foi criado.

**Depende de:** `@/auth`, `@/lib/supabase`, `@/components/ui/{card,button}`
