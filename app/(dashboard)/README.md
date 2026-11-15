# app/(dashboard)/

Route group com as páginas protegidas por autenticação (dashboard,
configurações, agenda, clientes, assistente). O `proxy.ts` (raiz) redireciona para
`/login` se não autenticado.

## layout.tsx

**O que faz:** shell compartilhado por todas as páginas deste grupo — renderiza
a [`<Sidebar>`](../../components/dashboard/README.md) (fixa à esquerda de `lg` para cima,
drawer abaixo disso) e o conteúdo com `lg:pl-64`. O `main` só dá o teto (`max-w-7xl`) e o
respiro; quem decide a largura de cada tela é o `PageContainer` (padrão 1024, `wide` 1280).
Fundo `bg-muted/40`.

**Depende de:** `@/components/dashboard/Sidebar`,
`@/components/notifications/NotificationsProvider`, `@/components/ui/sonner`.

**Notificações:** o layout envolve tudo em `<NotificationsProvider>` (polling único
das notificações do sino) e renderiza o `<Toaster>` (toasts de notificações novas,
canto inferior direito, para não cobrir o "Novo agendamento" do cabeçalho). O sino em si fica na `Sidebar`.

**Notas:** cada `page.tsx` dentro de `(dashboard)/` renderiza só o conteúdo —
não precisa repetir wrapper de `min-h-screen` nem padding. A navegação ficou na
sidebar lateral (antes era uma navbar no topo).

## Subpastas

- [dashboard/](./dashboard/) — visão geral após login.
- [assistente/](./assistente/) — chat com a IA para gerenciar a agenda e criar lembretes pessoais.
- [configuracoes/](./configuracoes/) — telas de configuração (disponibilidade,
  exceções, Google Agenda, WhatsApp, assinatura).
- [clientes/](./clientes/) — cadastro e gestão manual de clientes.
- [agenda/](./agenda/) — calendário visual (vistas Mês e Semana) dos agendamentos.
- [conversas/](./conversas/) — caixa de conversas do WhatsApp + handoff (pausar a IA).

## loading.tsx

`dashboard/`, `clientes/`, `conversas/`, `assistente/` e `configuracoes/` têm `loading.tsx`
com `PageContainer` + `LoadingSkeleton` (layout de página ou de lista), para o painel não
piscar em branco na navegação. A agenda tem o seu (`AgendaSkeleton`).

## dashboard/page.tsx

Detalhes em [dashboard/README.md](./dashboard/README.md).
