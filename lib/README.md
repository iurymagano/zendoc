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

## phone.ts

**O que faz:** normaliza, valida e formata telefone brasileiro. Padrão do
projeto: só dígitos, `55` + DDD + número (`5511911112222`). Módulo puro (usável
no client e no server).

**Exporta:**

- `normalizePhoneBR(raw: string): string` — remove não-dígitos e zeros à
  esquerda; com 10 ou 11 dígitos (sem DDI) prefixa `55`; 12/13 dígitos mantém.
- `isValidPhoneBR(normalized: string): boolean` — `true` para 12 ou 13 dígitos.
- `formatPhoneBR(raw: string): string` — exibição: `+55 (11) 91111-2222`,
  `+55 (11) 3333-4444` ou `(11) 91111-2222`; devolve a entrada crua se não
  reconhecer.

**Usado por:** `POST/PATCH /api/patients`, `POST/PATCH /api/appointments`,
`POST /api/recurrences` (normalização no servidor) e pelos formulários de
`/clientes` e `/agenda` (normalização antes do envio + formatação na lista).

**Notas:** NÃO usar no webhook do WhatsApp — o número já chega com DDI e pode
ser internacional ou `@lid`; prefixar 55 corromperia o identificador. Testes em
`phone.test.ts` (rodar com `npm test`).

## name.ts

**O que faz:** extrai o primeiro nome "de verdade" para saudações.

**Exporta:**

- `firstNameSkippingTitle(fullName: string): string` — pula títulos (Dr., Dra.,
  Prof., Profa., Doutor(a), Professor(a); com ou sem ponto). `"Dra. Teste QA"`
  → `"Teste"`. Se só houver título, devolve a primeira palavra.

**Usado por:** `/dashboard` (`Olá, {nome}`). Testes em `name.test.ts`.

## stripe.ts

**O que faz:** cliente Stripe (server-side) com inicialização **lazy** e o
mapeamento de status.

**Exporta:**

- `getStripe(): Stripe` — constrói no primeiro uso (não estoura no import se a
  `STRIPE_SECRET_KEY` não estiver setada). Lança se a key faltar quando usado.
- `planStatusFromStripe(status): 'trialing'|'active'|'past_due'|'cancelled'` —
  mapeia `Stripe.Subscription.Status` para o `plan_status` do IAzen.

**Usado por:** `app/api/billing/*` e `app/api/webhooks/stripe`.

## Subpastas

- [ai/](./ai/) — integração com Claude API (prompt, processor, executor).
- [assistant/](./assistant/) — Assistente pessoal: chat do profissional com a IA
  (tool use) para agenda e lembretes pessoais.
- [availability/](./availability/) — cálculo de slots (`compute.ts` puro em
  America/Sao_Paulo + `slots.ts` com as consultas).
- [appointments/](./appointments/) — utilitários de domínio (conflito de
  horário, lembretes, regras de compromisso pessoal).
- [patients/](./patients/) — utilitários de cliente (validação/máscara de CPF).
- [zapi/](./zapi/) — cliente Evolution API (`sendWhatsAppMessage`; demais
  funções entram quando a conexão WhatsApp for implementada).
- [google/](./google/) — integração Google Calendar mão-dupla (OAuth + push/pull
  de eventos; `syncAppointmentToGoogle` é o gancho chamado pelos endpoints).
- [recurrences/](./recurrences/) — atendimentos recorrentes (materialização das
  ocorrências como appointments reais + encerrar série).
- [conversations/](./conversations/) — estado das conversas (handoff: pausar a
  IA por contato).
