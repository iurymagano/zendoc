# lib/assistant/

Assistente pessoal: chat do próprio profissional com a IA (Claude com tool use)
para consultar e alterar a agenda e criar lembretes pessoais. Diferente de
`lib/ai/` (que conversa com o **cliente** no WhatsApp), aqui a conversa é com o
**dono da agenda**, dentro do app.

Fluxo: `chat.ts` monta o histórico + prompt → `loop.ts` chama o modelo e executa
as ferramentas pedidas (`executor.ts`, cada entrada validada por `tools.ts`) até
vir a resposta em texto → `chat.ts` grava o turno em `assistant_messages`.

---

## chat.ts

**O que faz:** orquestra um turno completo do chat (histórico, serviços, loop de IA, persistência).

**Exporta:**

- `runAssistantChat(professional, userMessage): Promise<{ reply, actions }>` —
  `actions` são frases das ações que alteraram dados (viram chips na UI).
- `HISTORY_LIMIT = 20` — mensagens do histórico enviadas ao modelo.

**Depende de:** `executor.ts`, `loop.ts`, `prompt.ts`, `tools.ts`, `@/lib/supabase`.

**Notas:** modelo vem de `AI_MODEL` (default `claude-sonnet-4-6`); `AI_DEBUG=1`
loga tokens/cache. O `professional` vem **sempre da sessão** (nunca do corpo da
requisição). Se a API falhar **depois** de uma ação já gravada, a resposta lista
o que foi feito (para o usuário não repetir o pedido e duplicar); se nada foi
gravado, o erro sobe e a rota responde 500. `created_at` das duas linhas do
turno é explícito para preservar a ordem.

## loop.ts

**O que faz:** loop de tool use — chama o modelo, executa os `tool_use`, devolve
todos os `tool_result` num único turno de usuário e repete.

**Exporta:**

- `runToolLoop(params): Promise<{ reply, actions, iterations, exhausted }>` — o
  client entra por parâmetro (`create`), então é testável com um modelo falso.
- `extractText(content): string`, `MAX_ITERATIONS = 8`, `FALLBACK_REPLY`.

**Notas:** entrada inválida de ferramenta volta ao modelo como `is_error`
(ele corrige); estourar o limite devolve uma resposta de fallback.

## tools.ts

**O que faz:** define as 10 ferramentas (schemas zod → JSON Schema da API) e valida cada chamada.

**Exporta:**

- `ASSISTANT_TOOLS` — lista enviada ao modelo: `list_agenda`, `list_free_slots`,
  `create_appointment`, `create_personal_event`, `set_day_off`,
  `cancel_appointment`, `reschedule_appointment`, `create_reminder`,
  `list_reminders`, `cancel_reminder`.
- `parseToolInput(name, input): { ok, name, input } | { ok: false, error }` —
  valida com zod (datas `YYYY-MM-DD`, horas `HH:MM`, uuid, telefone).
- `toolSchemas`, `TOOL_NAMES`, `MAX_AGENDA_DAYS = 31`, tipos `ToolName`/`ToolInput`.

## executor.ts

**O que faz:** executa cada ferramenta no banco, **sempre filtrando por `professional_id`**.

**Exporta:** `runTool(ctx, name, input): Promise<ToolOutcome>` (`{ ok, data, action? }` ou `{ ok: false, error }`).

**Depende de:** `@/lib/supabase`, `@/lib/availability/slots`, `@/lib/appointments/{conflicts,reminders}`, `@/lib/google/calendar`, `datetime.ts`, `reminders.ts`.

**Notas:**

- Atendimento de cliente = `appointments` com `booked_via='manual'` (cria/reaproveita o cliente por telefone, checa conflito).
- **Compromisso pessoal / bloqueio de agenda** = `appointment` manual **sem cliente** (`patient_phone` vazio, título em `patient_name`); ocupa o horário nos slots da IA do WhatsApp sem criar tabela nova. `set_day_off` grava uma exceção `day_off`.
- Cancelar/remarcar exigem `confirmed=true` (a IA só passa depois de o usuário confirmar no chat — guarda leve: prompt + flag). **O cliente não é avisado** (resultado traz `client_notified: false`).
- Lembrete exige data/hora futura; o resultado traz `warning` se o WhatsApp/telefone do profissional impedem a entrega.

## prompt.ts

**O que faz:** system prompt em dois blocos: o **estável** (perfil, serviços, regras; cacheado com `cache_control`) e o **dinâmico** (agora + tabela de datas dos próximos 14 dias).

**Exporta:** `buildStablePrompt(professional, services?)`, `buildContextPrompt(now)`, `DEFAULT_APPOINTMENT_MIN = 50`, `DEFAULT_PERSONAL_EVENT_MIN = 60`.

**Notas:** a IA nunca calcula dia da semana: usa a tabela de datas. Respostas curtas, sem markdown.

## datetime.ts

**O que faz:** helpers de data/hora **independentes do fuso do servidor** (Vercel roda em UTC), sempre `America/Sao_Paulo` com offset fixo `-03:00`.

**Exporta:** `saoPauloParts`, `toSaoPauloIso`, `buildIso(date, time)`, `addMinutesToIso`, `addDaysToDate`, `diffDays`, `dayRangeIso`, `weekdayShortOf`, `formatBrDate`, `formatBrDateTime`, `formatTime`, `describeNow`, `buildCalendarHint`, `isValidDate`, `isValidTime`, `TZ`, `OFFSET`.

## reminders.ts

**O que faz:** regras puras dos lembretes pessoais.

**Exporta:**

- `buildPersonalReminderMessage(text): string` — `"Lembrete do seu assistente IAzen:\n{texto}"`.
- `checkPersonalReminderDelivery(profile): { ok: true, phone } | { ok: false, reason }` — plano `trialing`/`active`, WhatsApp conectado e telefone válido, nessa ordem; o `reason` vira `error_message` do lembrete.

**Usado por:** `executor.ts` (aviso ao criar) e `app/api/reminders/dispatch` (cron de 1 min).

## access.ts

**O que faz:** controle de acesso do chat.

**Exporta:** `planAllowsAssistant(planStatus)` (só `trialing`/`active`), `PLAN_BLOCKED_MESSAGE`, `ASSISTANT_PLANS`, `getProfessionalByUserId(userId)`.

## Testes

`datetime.test.ts`, `tools.test.ts`, `reminders.test.ts`, `prompt.test.ts` e
`loop.test.ts` (modelo falso) — `node:test`, rodam com `npm test`.
