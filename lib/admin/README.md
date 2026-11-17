# lib/admin/

Dados, rastreio e acesso do painel `/admin` (só o dono do produto). A tela vive em `app/admin/` e `components/admin/`; esta pasta só entrega o contrato `AdminOverview` e as regras de acesso.

---

## types.ts

**O que faz:** contrato entre a camada de dados e a tela (`AdminOverview`, `AdminKpis`, `AdminFunnel`, `AdminUsage`, `AdminUserRow`, `DailyPoint`).

**Notas:** é o acordo fixo com a tela; só crescer, nunca renomear campos sem avisar quem desenha a tela.

## access.ts

**O que faz:** controla quem entra no painel admin.

**Exporta:**

- `isAdminEmail(email?, adminEmails = process.env.ADMIN_EMAILS): boolean` — true se o e-mail está em `ADMIN_EMAILS` (lista separada por vírgula, sem diferenciar maiúsculas, ignora espaços). Lista vazia ou ausente = ninguém é admin.
- `requireAdmin(): Promise<Session>` — guarda de servidor: chama `auth()` e, se não houver sessão ou o e-mail não for admin, chama `notFound()` (404, não revela que a página existe). Devolve a sessão.

**Depende de:** `@/auth` e `next/navigation` (imports dinâmicos, para o módulo continuar testável).

**Notas:** `proxy.ts` também exige login em `/admin`; o 404 para quem está logado mas não é admin vem daqui. Testes em `access.test.ts`.

## pricing.ts

**Exporta:** `PLAN_PRICE_CENTS` (29700 = R$297/mês), base do MRR.

## activity.ts

**O que faz:** rastreio de uso do painel.

**Exporta:**

- `touchActivity(userId): Promise<void>` — chama a RPC `touch_activity` (service key), que marca o dia de hoje (America/Sao_Paulo) em `activity_days` e soma `hits`. Nunca lança (erro vira `console.error`).

**Depende de:** `lib/supabase.ts`, migration `0011_admin_metrics.sql`.

**Notas:** chamado por `app/(dashboard)/layout.tsx` dentro de `after()` (depois da resposta, sem atrasar a página). O layout persiste na navegação do cliente, então conta no carregamento da página, não em cada clique: `hits` é aproximado, o que vale é o dia.

## visits.ts

**O que faz:** regras puras do contador de visitas públicas.

**Exporta:**

- `TRACKED_PATHS` — `'/'`, `'/register'`, `'/login'`, `'/privacidade'`.
- `isTrackedPath(path): boolean` — só a lista fixa.
- `isBotUserAgent(ua): boolean` — robôs, prévias de link, ferramentas de linha de comando e user-agent vazio.

**Usado por:** `app/api/track/visit/route.ts`. Testes em `visits.test.ts`.

## compute.ts

**O que faz:** cálculo PURO do painel (sem banco, sem rede), todo em America/Sao_Paulo via `lib/assistant/datetime.ts`.

**Exporta:** `todaySp`, `lastNDays`, `tallyByDay`, `fillSeries` (séries de 30 dias com 0 nos dias sem dado), `planBucket`/`summarizePlans` (inclui `trialExpired`: `trialing` com `trial_ends_at` no passado), `mrrCents`, `distinctActiveUsers`, `activeUsersByDay`, `sumVisits`, `visitsByDay`, `buildFunnel`, `providerFromMetadata`, `buildUserRows`, `latestSeenByUser`, `countByKey`.

**Notas:** testado em `compute.test.ts` (rode com `TZ=UTC`, como os outros testes de data).

## metrics.ts

**O que faz:** monta o `AdminOverview` consultando o banco com a service key.

**Exporta:**

- `getAdminOverview(): Promise<AdminOverview>` — contas via `auth.admin.listUsers` (paginado), `professionals`, `appointments`, `conversation_history`, `assistant_messages`, `reminders`, `activity_days` e `site_visits`.

**Depende de:** `compute.ts`, `lib/supabase.ts`, `lib/assistant/datetime.ts`, `types.ts`.

**Notas:** contagens usam `count: 'exact', head: true`; o que precisa de linhas traz só as colunas necessárias, paginando de 1000 em 1000 (teto do PostgREST). Se uma consulta falhar (ex.: tabela não migrada), aquele dado vira 0 e entra uma frase em `warnings`; a página não cai. Só chamar em código de servidor depois de `requireAdmin()`.
