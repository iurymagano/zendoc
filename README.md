# IAzen

SaaS de gestão de consultórios para profissionais de saúde autônomos (psicólogos,
nutricionistas, fisioterapeutas). Oferece uma secretária virtual no WhatsApp que
agenda, confirma e gerencia consultas automaticamente.

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase · NextAuth v5
- **Integrações:** Anthropic Claude (IA), Evolution API (WhatsApp), Stripe (pagamentos)
- **Preço:** R$297/mês · trial 7 dias sem cartão

## Como rodar

```bash
npm install
cp .env.example .env.local    # preencha suas credenciais
npm run dev                   # http://localhost:3000
```

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm start` — servidor de produção
- `npm run lint` — ESLint
- `npm test` — testes unitários dos helpers de `lib/*.test.ts` (`node:test` via
  `tsx`, sem framework instalado)
- `npm run tunnel` — expõe `localhost:3000` numa URL pública (via cloudflared,
  baixado on-demand pelo `untun`) para a Evolution alcançar o webhook em dev.
  Use a URL impressa como `NEXT_PUBLIC_URL` no `.env.local`.

## Estrutura

```
iazen/
├── app/                 Rotas do App Router (páginas e API)
├── components/          Componentes React
├── lib/                 Módulos de domínio (supabase, ai, zapi, availability)
├── types/               Tipos TypeScript compartilhados
├── supabase/            SQL: schema.sql + migrations/
├── infra/               Infra self-hosted (Evolution API via Docker)
├── auth.ts              Configuração NextAuth
├── proxy.ts             Proteção de rotas (Next 16: era middleware.ts)
└── vercel.json          Configuração de deploy
```

Cada pasta tem um `README.md` próprio descrevendo seus arquivos. Ver [CLAUDE.md](./CLAUDE.md)
para o contexto completo do projeto e [TASKS.md](./TASKS.md) para o backlog vivo
(o que está feito e o que falta em cada sprint).

## Deploy

### Vercel

1. Importe o repositório no [Vercel](https://vercel.com/new) e selecione o
   framework **Next.js** (detectado automaticamente).
2. Em *Settings → Environment Variables*, preencha todas as chaves de
   `.env.example` para os ambientes **Production**, **Preview** e **Development**.
3. Em *Settings → Domains*, configure o domínio (ex.: `app.iazen.com.br`).
4. Push na branch `main` → deploy automático de produção. Outras branches geram
   deploys de preview.

Arquivos relevantes:

- [vercel.json](./vercel.json) — região `gru1` (São Paulo) + cron diário de
  `/api/recurrences/materialize` (o único que cabe no plano grátis, que só
  aceita cron 1 vez por dia).
- [.env.example](./.env.example) — lista completa de variáveis.

### Produção atual (beta grátis)

| Peça | Onde | Custo |
| --- | --- | --- |
| App | Vercel Hobby, projeto `zendoc` → https://iazen.vercel.app | grátis |
| Banco | Supabase free, projeto `zendoc` (São Paulo) | grátis |
| WhatsApp | Evolution na VM e2-micro do Google Cloud → ver [infra/evolution/](./infra/evolution/) | grátis (Always Free) |
| Crons | cron-job.org (lembretes 1 min, sync Google 10 min) | grátis |
| Pagamento | Stripe em **modo de teste** | — |

Enquanto o projeto da Vercel não estiver ligado ao GitHub, publique pela CLI:
`vercel deploy --prod` (as variáveis ficam na Vercel; os valores não ficam no
repositório). No Google OAuth, os redirects de produção
(`/api/auth/callback/google` e `/api/google/calendar/callback`) já estão
cadastrados; o app está em modo "Testando", então só entra com Google quem for
usuário de teste.

### Crons (cron-job.org)

O plano grátis da Vercel (Hobby) só roda cron 1 vez por dia, então os crons
frequentes ficam no [cron-job.org](https://cron-job.org) (grátis, até de 1 em
1 minuto). Crie um job para cada linha, método `GET` ou `POST`, com o header
`Authorization: Bearer <CRON_SECRET>` (o mesmo valor da env na Vercel):

| Endpoint | Intervalo | Para quê |
| --- | --- | --- |
| `/api/reminders/dispatch` | 1 min | lembretes de 24h e 2h antes da consulta |
| `/api/google/calendar/sync` | 10 min | puxar compromissos do Google Agenda |

O `/api/recurrences/materialize` segue no `vercel.json` (diário). As respostas
do robô no WhatsApp **não** dependem de cron: chegam na hora, pelo webhook.

### Supabase

Rode [supabase/schema.sql](./supabase/schema.sql) no SQL Editor do Supabase
antes do primeiro deploy — cria todas as tabelas, triggers e políticas RLS. Em
bancos já provisionados, aplique as migrations em [supabase/migrations/](./supabase/migrations/).

### WhatsApp (Evolution API)

A Evolution API é self-hosted — suba o servidor com o Docker Compose em
[infra/evolution/](./infra/evolution/) e configure `EVOLUTION_API_URL`,
`EVOLUTION_API_KEY` e `WEBHOOK_SECRET` no `.env.local`/Vercel.
