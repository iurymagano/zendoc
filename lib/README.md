# lib/

Módulos de domínio reutilizáveis — não expõem rotas.

## supabase.ts

**O que faz:** fábricas de clientes Supabase.

**Exporta:**

- `createServerClient()` — client com `SUPABASE_SERVICE_KEY`, usado em API Routes.
  **Bypassa RLS** — sempre validar `user_id` a partir da sessão.
- `createBrowserClient()` — client com `NEXT_PUBLIC_SUPABASE_ANON_KEY`, usado em
  componentes client. Respeita RLS.

**Notas:** nunca importar `createServerClient` em componentes com `'use client'`
nem expor `SUPABASE_SERVICE_KEY` ao browser.

## Subpastas

- [ai/](./ai/) — integração com Claude API (Sprint 2)
- [zapi/](./zapi/) — cliente Evolution API (Sprint 2)
- [availability/](./availability/) — cálculo de slots (Sprint 2)
