# app/(dashboard)/

Route group com as páginas protegidas por autenticação (dashboard,
configurações, agenda, pacientes). O `proxy.ts` (raiz) redireciona para
`/login` se não autenticado.

## layout.tsx

**O que faz:** shell compartilhado por todas as páginas deste grupo — renderiza
a [`<Sidebar>`](../../components/dashboard/README.md) (fixa à esquerda no desktop,
drawer no mobile) e o conteúdo num container `max-w-5xl` deslocado com `md:pl-64`.
Fundo `bg-muted/40` (contraste com a sidebar branca).

**Depende de:** `@/components/dashboard/Sidebar`.

**Notas:** cada `page.tsx` dentro de `(dashboard)/` renderiza só o conteúdo —
não precisa repetir wrapper de `min-h-screen` nem padding. A navegação ficou na
sidebar lateral (antes era uma navbar no topo).

## Subpastas

- [dashboard/](./dashboard/) — visão geral após login.
- [configuracoes/](./configuracoes/) — telas de configuração (disponibilidade,
  exceções, Google Agenda, WhatsApp, assinatura).
- [pacientes/](./pacientes/) — cadastro e gestão manual de pacientes.
- [agenda/](./agenda/) — calendário visual (vistas Mês e Semana) dos agendamentos.
- [conversas/](./conversas/) — caixa de conversas do WhatsApp + handoff (pausar a IA).

## dashboard/page.tsx

**O que faz:** Server Component que busca o `professional` vinculado ao usuário
logado, conta agendamentos futuros, pacientes e blocos semanais ativos. Exibe:

- [`<PageHeader>`](../../components/dashboard/README.md) com saudação, plano e
  badge de status (trial/ativo/atraso/cancelado)
- [`<PlanStatusBanner>`](../../components/billing/README.md) — alerta quando o
  plano exige atenção (past_due, cancelled, trial terminando)
- Três `StatCard` com métricas (próximas consultas, pacientes, blocos ativos)
- Card CTA "Configure sua agenda" (quando `availability_weekly` ainda está vazio)
- Grid 2×2 de `ActionCard` com atalhos para agenda, pacientes, disponibilidade
  e WhatsApp

Redireciona para `/onboarding/step-1` se o perfil ainda não foi criado.

**Depende de:** `@/auth`, `@/lib/supabase`, `@/components/ui/{card,button}`,
`@/components/billing/PlanStatusBanner`, `@/components/dashboard/PageHeader`.

**Notas:** helpers privados `StatCard` e `ActionCard` ficam no próprio arquivo —
são só estilização do dashboard, sem uso em outras páginas.
