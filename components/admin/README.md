# components/admin/

Blocos da página `/admin` (só o dono): números do negócio, funil, gráficos, uso e lista de usuários. Todos recebem dados do contrato `AdminOverview` (`lib/admin/types.ts`); nenhum busca dado nem guarda número de exemplo.

---

## AdminDashboard.tsx

**O que faz:** monta a página (server component): cabeçalho "Visão do negócio", aviso discreto de dados incompletos (`warnings`), blocos na ordem KPIs, funil, gráficos, uso e usuários, e o rodapé "Atualizado às HH:mm" (America/Sao_Paulo).

**Exporta:** `<AdminDashboard overview />`

**Depende de:** todos os blocos desta pasta, `components/layout/*`, `lib/admin/types.ts`.

## AdminKpis.tsx

**O que faz:** números de topo. Dois cartões grandes (Pagantes e Receita mensal estimada = pagantes × R$ 297, com a nota "Não vem do Stripe"), grupo **Contas** (criadas, em teste, teste vencido, inadimplentes, cancelados, WhatsApp conectado) e grupo **Usuários ativos** (hoje, 7 e 30 dias).

**Exporta:** `<AdminKpis kpis />`

## AdminFunnel.tsx

**O que faz:** funil dos últimos 30 dias (visitas à landing, visitas ao cadastro, contas, onboarding, WhatsApp, pagantes) com barra, contagem e taxa de passagem. Sem base (divisor zero) não mostra taxa.

**Exporta:** `<AdminFunnel funnel />`

**Notas:** WhatsApp e pagantes são comparados com "onboarding concluído" (o contrato os define como subconjunto dele), e a nota de rodapé diz isso.

## BarChart.tsx

**O que faz:** gráfico de barras de uma série (sem biblioteca), 30 dias, datas dd/mm. Leitura ao passar o mouse ou tocar ("dd/mm: N unidade" + máximo), tabela `sr-only` para leitor de tela, estado vazio com texto.

**Exporta:** `<BarChart title data summaryLabel summaryValue unit emptyText />` (client component)

## AdminCharts.tsx

**O que faz:** os três gráficos de 30 dias lado a lado (cadastros, usuários ativos, visitas à landing).

**Exporta:** `<AdminCharts series />`

## AdminUsage.tsx

**O que faz:** uso do produto em 7 dias em três cartões de barra dividida com legenda e valores: atendimentos (pela IA x manuais, com o total de 30 dias), mensagens (clientes no WhatsApp x donos no Assistente) e lembretes (enviados x falharam).

**Exporta:** `<AdminUsage usage />`

## AdminUsersTable.tsx

**O que faz:** lista de usuários com busca (nome ou e-mail, sem acento) e filtro por plano com contagem. Celular: um cartão por conta, sem rolagem lateral. Tablet e desktop: tabela com primeira coluna fixa e rolagem lateral só dentro do cartão.

**Exporta:** `<AdminUsersTable users generatedAt />` (client component)

**Notas:** estados vazios distintos ("nenhuma conta ainda" x "nenhuma combina com a busca" + Limpar filtros).

## PlanBadge.tsx

**O que faz:** selo do plano (Em teste, Teste vencido, Pagante, Inadimplente, Cancelado, Sem onboarding) com os tokens de status do painel.

**Exporta:** `<PlanBadge plan />`

## format.ts

**O que faz:** formatação e regras puras da tela.

**Exporta:**

- `PRICE_BRL`, `formatBRL(n)`, `formatInt(n)` — valores em pt-BR
- `formatDayShort(day)`, `formatDate(iso)`, `formatTime(iso)` — dd/mm, dd/mm/aaaa e HH:mm em America/Sao_Paulo
- `relativeDays(iso | null, nowIso)` — "nunca", "hoje", "ontem", "há N dias/meses"
- `passRate(from, to)` — taxa inteira em %, `null` quando a base é zero
- `PlanKey`, `PLAN_LABEL`, `PLAN_ORDER`, `planOf(user, nowIso)` — plano exibido (teste vencido = `trialing` com `trialEndsAt` antes de `generatedAt`)

**Notas:** o "agora" vem de `generatedAt`, não de `Date.now()`, para servidor e navegador mostrarem o mesmo texto.
