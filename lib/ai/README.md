# lib/ai/

Integração com a API da Anthropic (Claude). Orquestra o fluxo de mensagens:
histórico → prompt → resposta da IA → ação no banco → persistência do
histórico.

Modelo atual: `claude-sonnet-4-20250514` (configurado em `processor.ts`).

## prompt-builder.ts

**O que faz:** constrói o system prompt que guia a IA a se comportar como
secretária do consultório.

**Exporta:**

- `buildSystemPrompt(professional: Professional, availableSlots: Date[]): string`

**Depende de:** `@/types/database`, `date-fns`, `date-fns/locale` (pt-BR).

**Notas:**

- Formata a lista de slots em pt-BR (`"segunda-feira, 05 de maio às 10:00"`).
- Instrui a IA a responder **sempre** em JSON puro (sem markdown). Os erros de
  parse caem no fallback em `processor.ts`.
- Tom da resposta muda entre `amigável` e `formal` conforme `professional.tone`.

## executor.ts

**O que faz:** aplica a ação escolhida pela IA no banco.

**Exporta:**

- `executeAction(professional, patientPhone, response: AIResponse): Promise<void>`

**Ações suportadas:**

- `book` — upsert do paciente em `patients` (por `professional_id,phone`) e
  insert em `appointments`. Status vira `pending_approval` se
  `professional.requires_approval`, senão `scheduled`.
- `cancel` — marca o appointment como `cancelled` com `cancelled_by = 'patient'`,
  filtrando por `professional_id` como defesa em profundidade.
- `reschedule` — faz `cancel` e depois chama recursivamente com `action = book`.
- Outras ações (`offer_slots`, `reply`, `approval_needed`) não mexem no banco.

**Depende de:** `@/lib/supabase`, `@/types/database`.

## processor.ts

**O que faz:** ponto de entrada único do fluxo de IA — orquestra tudo.

**Exporta:**

- `processWhatsAppMessage(professional, patientPhone, patientMessage): Promise<string>` —
  retorna o texto a ser enviado ao paciente.

**Fluxo:**

1. Busca as últimas 10 mensagens em `conversation_history` para
   `(professional_id, patient_phone)`.
2. Calcula slots disponíveis via `getAvailableSlots` (14 dias).
3. Monta system prompt via `buildSystemPrompt`.
4. Chama `anthropic.messages.create` — se falhar o parse do JSON, usa
   `FALLBACK_REPLY`.
5. Executa a ação via `executeAction` (erros apenas logados — não quebra o
   fluxo, a mensagem ao paciente já é enviada).
6. Persiste as duas mensagens (`user` + `assistant`) em `conversation_history`.

**Depende de:** `@anthropic-ai/sdk`, `./prompt-builder`, `./executor`,
`@/lib/availability/slots`, `@/lib/supabase`.

**Notas:**

- Histórico limitado a 10 mensagens para controlar custo (~R$2,70 por
  paciente/mês na estimativa inicial).
- A IA é instruída a devolver JSON, mas se vier markdown ou prosa, o `JSON.parse`
  quebra e caímos no fallback — nenhuma ação no banco é tomada nesse caso.
- `executor` e `processor` usam `createServerClient` (service key) — chamar só
  do server.

## Testando sem WhatsApp

Use [`POST /api/ai/test`](../../app/api/ai/test/README.md) para simular uma
mensagem recebida e ver a resposta textual sem precisar da Evolution API
plugada.
