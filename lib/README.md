# lib/

Módulos de domínio reutilizáveis — não expõem rotas.

## supabase.ts

**O que faz:** fábricas de clientes Supabase.

**Exporta:**

- `createServerClient()` — client com `SUPABASE_SERVICE_KEY`, usado em API Routes.
  **Bypassa RLS** — sempre validar `user_id` a partir da sessão.
- `createBrowserClient()` — client com `NEXT_PUBLIC_SUPABASE_ANON_KEY`, usado em
  componentes client. Respeita RLS.

**Notas:** nunca importar `createServerClient` em componentes `'use client'`
nem expor `SUPABASE_SERVICE_KEY` ao browser.

## utils.ts

**O que faz:** utilitário `cn()` gerado pelo shadcn CLI — combina `clsx` +
`tailwind-merge` para resolver classes conflitantes do Tailwind.

**Exporta:**

- `cn(...inputs: ClassValue[]): string`

**Notas:** usado internamente por todos os componentes em `components/ui/`.
Não remover.

## Subpastas

- [ai/](./ai/) — integração com Claude API (prompt, processor, executor).
- [availability/](./availability/) — cálculo de slots (`slots.ts`).
- [appointments/](./appointments/) — utilitários de domínio (checagem de
  conflito de horário).
- [zapi/](./zapi/) — cliente Evolution API (`sendWhatsAppMessage`; demais
  funções entram quando a conexão WhatsApp for implementada).
