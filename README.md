# Zendoc

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

## Estrutura

```
zendoc/
├── app/                 Rotas do App Router (páginas e API)
├── components/          Componentes React
├── lib/                 Módulos de domínio (supabase, ai, zapi, availability)
├── types/               Tipos TypeScript compartilhados
├── auth.ts              Configuração NextAuth
├── middleware.ts        Proteção de rotas
└── vercel.json          Configuração de deploy
```

Cada pasta tem um `README.md` próprio descrevendo seus arquivos. Ver [CLAUDE.md](./CLAUDE.md)
para o contexto completo do projeto.

## Deploy

### Vercel

1. Importe o repositório no [Vercel](https://vercel.com/new) e selecione o
   framework **Next.js** (detectado automaticamente).
2. Em *Settings → Environment Variables*, preencha todas as chaves de
   `.env.example` para os ambientes **Production**, **Preview** e **Development**.
3. Em *Settings → Domains*, configure o domínio (ex.: `app.zendoc.com.br`).
4. Push na branch `master` → deploy automático de produção. Outras branches geram
   deploys de preview.

Arquivos relevantes:

- [vercel.json](./vercel.json) — região `gru1` (São Paulo) + cron de lembretes
  em `/api/reminders/dispatch` (endpoint será criado na Sprint 2).
- [.env.example](./.env.example) — lista completa de variáveis.

### Supabase

Rode o SQL completo descrito em [CLAUDE.md](./CLAUDE.md#banco-de-dados--schema-sql-completo)
no SQL Editor do Supabase antes do primeiro deploy — isso cria todas as tabelas,
triggers e políticas RLS.
