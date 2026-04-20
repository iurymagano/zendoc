# app/(dashboard)/

Route group com as páginas protegidas por autenticação (dashboard,
configurações, agenda, pacientes). O `proxy.ts` (raiz) redireciona para
`/login` se não autenticado.

## layout.tsx

**O que faz:** shell compartilhado por todas as páginas deste grupo — renderiza
o [`<Navbar>`](../../components/dashboard/README.md) sticky no topo e um
container `max-w-6xl` com padding para o conteúdo. Fundo `bg-muted/30`.

**Depende de:** `@/components/dashboard/Navbar`.

**Notas:** cada `page.tsx` dentro de `(dashboard)/` renderiza só o conteúdo —
não precisa repetir wrapper de `min-h-screen` nem padding.

## Subpastas

- [dashboard/](./dashboard/) — visão geral após login.
- [configuracoes/](./configuracoes/) — telas de configuração (disponibilidade,
  exceções, WhatsApp).
- [pacientes/](./pacientes/) — cadastro e gestão manual de pacientes.
- [agenda/](./agenda/) — visão semanal dos agendamentos.

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
