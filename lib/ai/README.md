# lib/ai/

Integração com a API da Anthropic (Claude). Orquestra o fluxo de mensagens:
histórico → prompt → resposta da IA → ação no banco → persistência do
histórico.

Modelo: configurável via env `AI_MODEL` (default `claude-sonnet-4-6` — confiável
no formato JSON). `claude-haiku-4-5` é mais barato porém às vezes responde em
prosa e erra o JSON; há fallback, mas a confiabilidade cai. Em `processor.ts`.

## prompt-builder.ts

**O que faz:** constrói o system prompt que guia a IA a se comportar como
secretária do consultório.

**Exporta:**

- `buildSystemPrompt(professional, availableSlots, patientContext?, services?): string`
  — cada horário é listado com o **ISO exato** (`starts_at`/`ends_at`, com ano e
  offset `-03:00`) para a IA **copiar verbatim** no agendamento, em vez de
  construir a data na mão. Inclui também a data de hoje como âncora. (Sem isso a
  IA chutava o ano errado, ex.: marcava em 2024.) Quando há `services`, monta o
  bloco **SERVIÇOS OFERECIDOS** (nome · duração · preço) para a IA responder
  dúvidas de valor/duração sem escalar.

**Depende de:** `@/types/database`, `@/lib/availability/slots` (`Slot`),
`date-fns`, `date-fns/locale` (pt-BR).

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
  `professional.requires_approval`, senão `scheduled`. O nome vem de
  `booking.patient_name` (a IA é instruída a sempre enviá-lo); se ausente,
  preserva o nome já cadastrado e só cai em `'Paciente'` se não houver nenhum —
  nunca reescreve um nome real com o placeholder.
- `confirm` — paciente confirmou presença (resposta ao lembrete): a próxima
  consulta `scheduled` do paciente vira `confirmed`. Não confirma
  `pending_approval` (isso depende do profissional aprovar).
- `cancel` — marca o appointment como `cancelled` com `cancelled_by = 'patient'`,
  filtrando por `professional_id` como defesa em profundidade.
- `reschedule` — faz `cancel` e depois chama recursivamente com `action = book`.
- `handoff` — a IA não soube/não deve responder (fora do escopo). Não mexe no
  banco; o `processor` marca a conversa como "precisa de resposta"
  (`setNeedsAttention`). O fallback genérico (parse falhou) também marca.
- Outras ações (`offer_slots`, `reply`, `approval_needed`) não mexem no banco.

`confirm`/`cancel`/`reschedule` **não dependem de id**: a IA não conhece o uuid
do appointment, então `findUpcomingAppointment` resolve a **próxima consulta ativa
do paciente pelo telefone** (ou pelo `cancel.appointment_id`, se informado). Isso
conserta o loop do lembrete "podemos confirmar?", que antes ficava sem efeito.

Após cada escrita, reflete o appointment no Google Calendar via
`syncAppointmentToGoogle` (best-effort) — `book` cria o evento, `cancel`/`no_show`
removem. Por isso `book`/`cancel` agora fazem `.select()` da linha afetada.

**Depende de:** `@/lib/supabase`, `@/lib/google/appointment-sync`, `@/types/database`.

## processor.ts

**O que faz:** ponto de entrada único do fluxo de IA — orquestra tudo.

**Exporta:**

- `processWhatsAppMessage(professional, patientPhone, patientMessage): Promise<AIResponse>` —
  retorna o `AIResponse` completo (ação + `message_to_patient` + booking/cancel/slots).
  O webhook envia `aiResponse.message_to_patient`; o `/api/ai/test` expõe a ação na UI.

**Fluxo:**

1. Busca as últimas 10 mensagens em `conversation_history` para
   `(professional_id, patient_phone)`.
2. Calcula slots disponíveis via `getAvailableSlots` (14 dias), monta o
   **contexto do paciente** (`buildPatientContext`) e busca os **serviços ativos**
   do profissional — todos injetados no system prompt (a IA personaliza, não
   marca duplicado e responde preço/duração dos serviços).
3. Monta system prompt via `buildSystemPrompt(professional, slots, patientContext)`.
4. Chama `anthropic.messages.create` — se falhar o parse do JSON, usa
   `FALLBACK_REPLY`.
5. Executa a ação via `executeAction` (erros apenas logados — não quebra o
   fluxo, a mensagem ao paciente já é enviada).
6. Persiste as duas mensagens (`user` + `assistant`) em `conversation_history`.

**Depende de:** `@anthropic-ai/sdk`, `./prompt-builder`, `./executor`,
`@/lib/availability/slots`, `@/lib/supabase`.

**Notas:**

- **Prompt caching:** o system prompt vai como bloco com
  `cache_control: { type: 'ephemeral' }`. O prefixo estável (perfil + regras +
  lista de slots) é cacheado e custa ~10% nas mensagens seguintes da mesma
  conversa (TTL 5 min). Verificável via `response.usage.cache_read_input_tokens`
  (ou setando `AI_DEBUG=1`, que loga os tokens no console). Mínimo cacheável
  depende do modelo (~1024 tokens no Sonnet 4, ~4096 no Haiku 4.5) — prompts
  menores simplesmente não cacheiam, sem erro.
- `AI_MODEL` permite usar um modelo barato (Haiku) no dev sem mexer no código.
- Histórico limitado a 10 mensagens para controlar custo (~R$2,70 por
  paciente/mês na estimativa inicial).
- A IA é instruída a devolver **só** o JSON. O `parseAIResponse` é tolerante:
  remove cercas ```` ```json ```` e, se preciso, extrai do primeiro `{` ao último
  `}`. Fallback em camadas quando não dá pra montar um AIResponse válido:
  1. Se o modelo respondeu em **prosa** (sem JSON), usa o próprio texto como
     `reply` — melhor que "não entendi" (mas não executa ação no banco).
  2. Só cai no `FALLBACK_REPLY` genérico se vier vazio ou um JSON quebrado
     (que não dá pra mostrar ao paciente).
  (Haiku às vezes responde em prosa/markdown; por isso o default é Sonnet 4.6.)
- O `prompt-builder` traz exemplos (few-shot) e regras de condução: ao perguntarem
  horários → oferecer 2–4 opções (`offer_slots`), pedir o nome antes de confirmar,
  etc.
- `executor` e `processor` usam `createServerClient` (service key) — chamar só
  do server.

## Testando sem WhatsApp

Use [`POST /api/ai/test`](../../app/api/ai/test/README.md) para simular uma
mensagem recebida e ver a resposta textual sem precisar da Evolution API
plugada.
