# IAzen

SaaS de gestão de consultórios para profissionais de saúde autônomos (psicólogos,
nutricionistas, fisioterapeutas). Oferece uma secretária virtual no WhatsApp que
agenda, confirma e gerencia consultas automaticamente.

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase · NextAuth v5
- **Integrações:** Anthropic Claude (IA), Evolution API (WhatsApp), Stripe (pagamentos)
- **Preço:** R$197/mês · trial 7 dias sem cartão

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
4. Push na branch `master` → deploy automático de produção. Outras branches geram
   deploys de preview.

Arquivos relevantes:

- [vercel.json](./vercel.json) — região `gru1` (São Paulo) + cron de lembretes
  em `/api/reminders/dispatch` (endpoint será criado na Sprint 2).
- [.env.example](./.env.example) — lista completa de variáveis.

### Supabase

Rode [supabase/schema.sql](./supabase/schema.sql) no SQL Editor do Supabase
antes do primeiro deploy — cria todas as tabelas, triggers e políticas RLS. Em
bancos já provisionados, aplique as migrations em [supabase/migrations/](./supabase/migrations/).

### WhatsApp (Evolution API)

A Evolution API é self-hosted — suba o servidor com o Docker Compose em
[infra/evolution/](./infra/evolution/) e configure `EVOLUTION_API_URL`,
`EVOLUTION_API_KEY` e `WEBHOOK_SECRET` no `.env.local`/Vercel.
