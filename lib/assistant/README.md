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

**Depende de:** `executor.ts`, `loop.ts`, `pending.ts`, `prompt.ts`, `tools.ts`, `@/lib/supabase`.

**Notas:** antes de chamar o modelo lê a ação de cancelar/remarcar **pendente e não vencida** (`assistant_pending_actions`) e a injeta no bloco dinâmico do prompt (`buildContextPrompt(now, pending)`): o histórico guarda só texto, então sem isso a IA não sabe que "Sim, confirmo" responde a uma ação já preparada e prepara de novo. Modelo vem de `AI_MODEL` (default `claude-sonnet-4-6`); `AI_DEBUG=1`
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

**O que faz:** define as 11 ferramentas (schemas zod → JSON Schema da API) e valida cada chamada.

**Exporta:**

- `ASSISTANT_TOOLS` — lista enviada ao modelo: `list_agenda`, `list_free_slots`,
  `create_appointment`, `create_personal_event`, `set_day_off`,
  `prepare_cancel_appointment`, `prepare_reschedule_appointment`,
  `confirm_pending_action`, `create_reminder`, `list_reminders`,
  `cancel_reminder`. Não existe ferramenta que cancele/remarque direto: é sempre
  **preparar** (não altera nada) e **confirmar** (executa) — ver `pending.ts`.
- `parseToolInput(name, input): { ok, name, input } | { ok: false, error }` —
  valida com zod (datas `YYYY-MM-DD`, horas `HH:MM`, uuid, telefone).
- `toolSchemas`, `TOOL_NAMES`, `MAX_AGENDA_DAYS = 31`, tipos `ToolName`/`ToolInput`.

## executor.ts

**O que faz:** executa cada ferramenta no banco, **sempre filtrando por `professional_id`**.

**Exporta:** `runTool(ctx, name, input): Promise<ToolOutcome>` (`{ ok, data, action? }` ou `{ ok: false, error }`). `ctx` = `{ professional, requestId, now? }`; o `requestId` identifica **uma mensagem do usuário** (`chat.ts` gera um por requisição) e é o que impede preparar e confirmar no mesmo turno.

**Depende de:** `@/lib/supabase`, `@/lib/availability/slots`, `@/lib/appointments/{conflicts,personal,reminders}`, `@/lib/google/calendar`, `datetime.ts`, `ilike.ts`, `pending.ts`, `reminders.ts`.

**Notas:**

- Atendimento de cliente = `appointments` com `booked_via='manual'` (cria/reaproveita o cliente por telefone, checa conflito).
- **Compromisso pessoal / bloqueio de agenda** = `appointment` manual **sem cliente** (`patient_phone` vazio, título em `patient_name`); ocupa o horário nos slots da IA do WhatsApp sem criar tabela nova. `set_day_off` grava uma exceção `day_off`.
- **Cancelar/remarcar em dois passos, impostos pelo servidor:** `prepare_*` valida (item ativo, horário futuro, sem conflito), grava a ação em `assistant_pending_actions` (uma por profissional; preparar outra **diferente** marca a anterior como `replaced`) e **não altera a agenda**. Preparar **de novo a mesma ação** (mesmo tipo, atendimento e novo horário) não grava nada e mantém o `request_id` original (`decidePendingSave`): se a IA repetir o `prepare_*` ao ouvir "sim", a confirmação continua valendo. `confirm_pending_action` só executa a ação preparada em **outra** requisição (outra mensagem do usuário) e dentro de 15 min; reserva a linha (`pending → done`) antes de executar, revalida item/conflito/horário passado e então aplica. **Se a execução falhar** (conflito, horário que passou, erro de banco ou exceção), a linha volta a `pending` (`releasePending`) e o usuário pode tentar de novo no prazo; só fica `done` quando executou, e continua de uso único (enquanto executa, o status `done` impede outra reserva). A IA não escolhe qual ação nem passa flag de confirmação: executa-se exatamente o que foi preparado e mostrado ao usuário.
- O nome de cliente digitado pela pessoa entra no `ilike` já escapado (`ilike.ts`): `%`, `_` e `\` casam literalmente, então "%" não vira "qualquer cliente".
- Remarcar remarca os lembretes pendentes do cliente (`rescheduleAppointmentReminders`); compromisso pessoal não tem lembrete de cliente. **O cliente não é avisado** (resultado traz `client_notified: false`; não existe aviso automático ao cliente em nenhum fluxo do app).
- **Sino:** cancelar/remarcar confirmados pelo Assistente chamam `notifyAppointmentCancelled` / `notifyAppointmentRescheduled` com `actor = 'assistant'`. Foi o próprio dono quem pediu, então o aviso nasce **lido** (fica no histórico do sino, sem selo nem toast). Compromisso pessoal não gera aviso. Ver [lib/notifications](../notifications/README.md).
- Lembrete exige data/hora futura; o resultado traz `warning` se o WhatsApp/telefone do profissional impedem a entrega.

## pending.ts

**O que faz:** regras puras da confirmação em duas etapas (sem banco), usadas por `executor.ts`.

**Exporta:**

- `PENDING_TTL_MS = 15 min`, `pendingExpiry(now): Date`.
- `checkPendingConfirmable(pending | null, { requestId, now }): { ok: true } | { ok: false, error }` — recusa, nessa ordem: sem ação pendente, preparada na **mesma requisição**, expirada.
- `NO_PENDING_ERROR`, `SAME_REQUEST_ERROR`, `EXPIRED_ERROR` — mensagens devolvidas ao modelo.
- `isSamePendingAction(a, b): boolean` — mesma ação = mesmo tipo, atendimento e novo horário (comparado por instante); o motivo do cancelamento não conta.
- `decidePendingSave(existing | null, candidate, { requestId, now }): { action: 'reuse', carriedOver } | { action: 'replace' }` — `reuse` quando já há uma ação idêntica, pendente e não vencida (`carriedOver` = veio de mensagem anterior; o `prepare_*` então diz à IA que o usuário já viu o resumo); `replace` nos demais casos.
- `formatPendingForPrompt(pending, formatExpiry): string` — texto injetado no prompt dinâmico: a ação aguardando, e a ordem de chamar `confirm_pending_action` (sem preparar de novo) se o usuário confirmar.

**Notas:** o histórico do chat guarda só texto (`assistant_messages`), então um token passado pelo modelo entre turnos seria impossível; por isso o estado fica no servidor (tabela `assistant_pending_actions`, migration `0009`).

## ilike.ts

**O que faz:** escapa `\`, `%` e `_` para uso em `.ilike()` do Supabase (PURO).

**Exporta:** `escapeIlike(value): string`.

**Usado por:** `executor.ts` (busca de cliente por nome em `create_appointment`).

## rate-limit.ts

**O que faz:** limite de uso do chat por profissional (PURO): cada `POST /api/assistant/chat` custa tokens da Anthropic.

**Exporta:**

- `RATE_LIMITS = { burst: 30 msgs / 10 min, daily: 200 msgs / 24h }`, `RATE_LIMIT_FETCH = 200`.
- `evaluateRateLimit(timestamps, now): { ok: true } | { ok: false, scope, retryAfterSec, message }` — recebe as datas das mensagens do usuário; a mensagem (pt-BR, amigável) vai para a UI e `retryAfterSec` para o header `Retry-After`. A espera é até a mensagem que "tranca" a janela sair (a 30ª/200ª mais recente).

**Notas:** a rota conta as linhas `role='user'` de `assistant_messages` (gravadas no fim de cada turno), então é um limite aproximado: turnos que falham antes de gravar não contam e requisições paralelas podem passar juntas. Falha ao ler as datas não bloqueia o usuário (só loga).

## prompt.ts

**O que faz:** system prompt em dois blocos: o **estável** (perfil, serviços, regras; cacheado com `cache_control`) e o **dinâmico** (agora + tabela de datas dos próximos 14 dias + ação de cancelar/remarcar aguardando confirmação, se houver).

**Exporta:** `buildStablePrompt(professional, services?)`, `buildContextPrompt(now, pending?)`, `DEFAULT_APPOINTMENT_MIN = 50`, `DEFAULT_PERSONAL_EVENT_MIN = 60`.

**Notas:** a IA nunca calcula dia da semana: usa a tabela de datas. Respostas curtas, sem markdown.

## datetime.ts

**O que faz:** helpers de data/hora **independentes do fuso do servidor** (Vercel roda em UTC), sempre `America/Sao_Paulo` com offset fixo `-03:00`.

**Exporta:** `saoPauloParts`, `toSaoPauloIso`, `buildIso(date, time)`, `addMinutesToIso`, `addDaysToDate`, `diffDays`, `dayRangeIso`, `weekdayShortOf`, `formatBrDate`, `formatBrDateTime`, `formatTime`, `formatLongBrDate`, `formatLongBrDateTime`, `weekdayOfDate`, `saoPauloInstantMs`, `calendarValueToIso`, `describeNow`, `buildCalendarHint`, `isValidDate`, `isValidTime`, `TZ`, `OFFSET`.

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

`datetime.test.ts`, `tools.test.ts`, `reminders.test.ts`, `pending.test.ts`,
`ilike.test.ts`, `rate-limit.test.ts`, `prompt.test.ts` e `loop.test.ts` (modelo falso) — `node:test`, rodam com `npm test`.
