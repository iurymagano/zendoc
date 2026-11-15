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

## masks.ts

**O que faz:** máscaras de campo (telefone, CPF, CEP, valor em R$) e conversões
de volta para o valor limpo. Funções puras, usáveis no client e no server.

**Exporta:**

- `onlyDigits(raw): string` — só os dígitos.
- `maskPhone(raw, prev?): string` — `(48) 98506-9930` (celular) / `(48) 3333-4444`
  (fixo), progressiva, sem DDI. Aceita o formato salvo (`5548985069930`); o `55` só
  é DDI quando sobram mais de 11 dígitos (DDD 55 do RS segue valendo). Número
  internacional vira `+<dígitos>` sem adulterar. `prev` evita um 12º dígito
  digitado virar DDI.
- `maskCpf(raw)` — `000.000.000-00` (delega a `maskCpfInput`).
- `maskCep(raw)` — `00000-000`.
- `maskCurrency(raw, prev?)` — reais digitando pelos centavos: `R$ 1.234,56`;
  vazio continua vazio (campo opcional); apagar até zerar limpa o campo.
- `formatCentsBRL(cents)` — `15000` → `R$ 150,00` (valor inicial vindo do banco).
- `parseCurrencyToCents(raw): number | null` — `R$ 1.234,56` (ou `150`, `150,5`)
  → centavos; vazio → `null`.
- `caretAfterDigits(masked, n): number` — posição do cursor depois do n-ésimo
  dígito (usado pelo `MaskedInput`).

**Depende de:** `lib/patients/cpf.ts`.

**Usado por:** `components/ui/masked-input.tsx` e as telas de onboarding,
`/clientes`, `/agenda`, `/configuracoes/servicos`.

**Notas:** o texto mascarado é só exibição. Para enviar, limpar com
`normalizePhoneBR` (aceita o texto mascarado), `normalizeCpf` ou
`parseCurrencyToCents`. Testes em `masks.test.ts`.

## address.ts

**O que faz:** endereço de atendimento — monta/lê o texto único de
`professionals.address` e consulta o CEP no ViaCEP.

**Exporta:**

- `AddressParts`, `EMPTY_ADDRESS` — partes do formulário (cep, rua, número,
  complemento, bairro, cidade, UF).
- `buildAddress(parts): string` — `Rua X, 123, complemento - Bairro, Cidade/UF, CEP 00000-000`,
  omitindo partes vazias.
- `parseAddress(text): AddressParts | null` — separa um endereço salvo só quando
  o formato é reconhecido com segurança (rua, número, bairro, cidade/UF e CEP, sem
  complemento); senão `null` (o chamador mostra texto livre).
- `lookupCep(cep, { signal?, fetchImpl? }): Promise<CepLookup>` — `GET
  https://viacep.com.br/ws/<cep>/json/`; nunca lança: `{ ok: false, reason:
  'invalid' | 'not_found' | 'network' }` ou `{ ok: true, street, neighborhood, city, state }`.

**Depende de:** `lib/masks.ts`.

**Usado por:** `components/onboarding/AddressFields.tsx`. Testes em `address.test.ts`.

## name.ts

**O que faz:** extrai o primeiro nome "de verdade" para saudações.

**Exporta:**

- `firstNameSkippingTitle(fullName: string): string` — pula títulos (Dr., Dra.,
  Prof., Profa., Doutor(a), Professor(a); com ou sem ponto). `"Dra. Teste QA"`
  → `"Teste"`. Se só houver título, devolve a primeira palavra.

**Usado por:** `/dashboard` (`Olá, {nome}`). Testes em `name.test.ts`.

## legal.ts

**O que faz:** dados legais da `/privacidade` (responsável, documento e e-mail de
contato), lidos do ambiente.

**Exporta:**

- `getPrivacyContact(env?): PrivacyContact` — lê `PRIVACY_CONTROLLER_NAME`,
  `PRIVACY_CONTROLLER_DOC` e `PRIVACY_CONTACT_EMAIL` (vazio → `null`).
- `formatOperatorLine(c): string | null` — linha "Operadora: ..." ou `null`.

**Notas:** sem as variáveis, a página omite as linhas em vez de mostrar texto
provisório. `legal.test.ts` também trava o repositório: falha se alguma página
de `app/` ou `components/` tiver campo entre colchetes (`[email do DPO]`,
`[razão social]`...), "entre colchetes", "Documento-base" ou lorem ipsum.

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
  (tool use) para agenda e lembretes pessoais (confirmação em duas etapas, limite
  de uso).
- [availability/](./availability/) — cálculo de slots (`compute.ts` puro em
  America/Sao_Paulo + `slots.ts` com as consultas).
- [appointments/](./appointments/) — utilitários de domínio (conflito de
  horário, lembretes, regras de compromisso pessoal, quando a declaração de
  comparecimento pode ser emitida).
- [patients/](./patients/) — utilitários de cliente (validação/máscara de CPF).
- [zapi/](./zapi/) — cliente Evolution API (`sendWhatsAppMessage`; demais
  funções entram quando a conexão WhatsApp for implementada).
- [google/](./google/) — integração Google Calendar mão-dupla (OAuth + push/pull
  de eventos; `syncAppointmentToGoogle` é o gancho chamado pelos endpoints).
- [recurrences/](./recurrences/) — atendimentos recorrentes (materialização das
  ocorrências como appointments reais + encerrar série).
- [conversations/](./conversations/) — estado das conversas (handoff: pausar a
  IA por contato).
