# lib/notifications/

Notificações dentro do app para o dono da conta (sino do painel): o que aconteceu na agenda, nas conversas e no WhatsApp enquanto ele não estava olhando. Só lê/escreve a tabela `notifications` (migration `0010`); nunca manda mensagem de WhatsApp.

Fluxo: o ponto do código onde o fato acontece (cancelar, remarcar, IA agendar, webhook...) chama um `notify*` de `events.ts`; ele monta o texto com um builder puro de `messages.ts` e grava via `createNotification` (`create.ts`). A UI lê pelas rotas `/api/notifications` (ver `app/api/notifications/README.md`) e o sino está em `components/notifications/`.

---

## create.ts

**O que faz:** grava uma notificação para o profissional, sem nunca derrubar o fluxo que a originou.

**Exporta:**

- `createNotification(professionalId, draft): Promise<void>` — `insert`, ou `upsert ... ignoreDuplicates` em `(professional_id, dedupe_key)` quando o rascunho tem `dedupeKey`. Nunca lança: erro vira `console.error`.

**Depende de:** `lib/supabase.ts` (service key), `messages.ts` (tipo `NotificationDraft`).

**Notas:** `alreadyRead` grava `read_at` já preenchido (ação do próprio profissional: fica no histórico, sem selo e sem toast). Se a tabela `notifications` ainda não existe no banco (migration não aplicada), só loga erro e o fluxo segue.

---

## events.ts

**O que faz:** um `notify*` por evento real. Recebe o que o ponto de chamada já tem em mãos, escolhe o builder e chama `createNotification`. SERVER-ONLY.

**Exporta:**

- `notifyAppointmentCancelled(professionalId, appointment, actor, reason?)` — atendimento cancelado; `actor` = `'patient' | 'professional' | 'assistant' | 'system'`. Cancelado pelo próprio dono (professional/assistant) nasce lido.
- `notifyAppointmentRescheduled(professionalId, appointment, previousStartsAt, actor)` — atendimento remarcado (`appointment` já traz o novo horário; o texto mostra "de ... para ...").
- `notifyAppointmentBookedByAi(professionalId, appointment)` — a IA agendou pelo WhatsApp (`appointment_booked`); se o status é `pending_approval`, vira "pediu um horário".
- `notifyAppointmentPendingApproval(professionalId, appointment)` — pedido de horário esperando aprovação (também em remarcação que exige aprovação).
- `notifyAppointmentConfirmed(professionalId, appointment)` — cliente confirmou presença.
- `notifyRecurrenceStopped(professionalId, {recurrenceId, patientName, patientPhone?, cancelledCount})` — série recorrente encerrada (um aviso só, não um por ocorrência; não faz nada com 0 cancelados).
- `notifyConversationAttention(professionalId, {reason, patientPhone, patientName?, lastMessage?})` — conversa que precisa do dono: `handoff` (IA passou para humano), `approval_needed`, `paused` (IA pausada para o contato recebeu mensagem) ou `fallback` (a IA não entendeu duas vezes seguidas).
- `notifyWhatsappDisconnected(professionalId)` — o número desconectou.
- `notifyReminderFailed(professionalId, {reminderId, reminderType, appointment, reason?})` — lembrete a cliente que não saiu.
- `notifyReplyFailed(professionalId, {patientPhone, patientName?, reason?})` — resposta da IA que não saiu.
- `notifyScheduleConflict(professionalId, {appointment, googleEventId, googleSummary?})` — evento do Google Agenda que bate com um atendimento.
- tipo `AppointmentLike` — o mínimo de um atendimento que os `notify*` precisam (`id`, `patient_name`, `patient_phone`, `starts_at`, `status`, `service_id?`).

**Depende de:** `messages.ts`, `create.ts`, `lib/supabase.ts` (para resolver o nome do cliente quando só há o telefone).

**Notas:** compromisso pessoal (`patient_phone` vazio) não gera notificação. Os `notify*` nunca lançam (envolvem tudo em try/catch com `console.error`); o nome do cliente é buscado em `patients` pelo telefone quando o ponto de chamada só tem o número (sem cadastro, usa o telefone formatado) e o serviço, em `services`.

---

## messages.ts

**O que faz:** builders PUROS (sem rede, sem banco, testados com `node:test`) que transformam um fato em `NotificationDraft` (`type`, `title`, `body`, `data`, `dedupeKey`, `alreadyRead`). Datas sempre em America/Sao_Paulo via `lib/assistant/datetime.ts`.

**Exporta:**

- `buildCancelledNotification`, `buildRescheduledNotification`, `buildRecurrenceStoppedNotification`, `buildBookedNotification`, `buildPendingApprovalNotification`, `buildConfirmedNotification`, `buildConflictNotification`, `buildConversationAttentionNotification`, `buildWhatsappDisconnectedNotification`, `buildReminderFailedNotification`, `buildReplyFailedNotification`.
- `dedupeKeys` — as chaves de dedupe, uma por evento real (ex.: `cancelled:<id>`, `rescheduled:<id>:<novo horário>`, `attention:<telefone>:<hora cheia>`).
- `clip(text, max)`, `displayName(name)` — corte com reticências e nome de exibição (cai em "Um cliente" quando vazio).
- tipos `NotificationDraft`, `NotificationActor`, `AppointmentRef`.

**Depende de:** `types/database.ts`, `lib/assistant/datetime.ts` (imports relativos, para rodar sob `tsx --test`).

**Notas:** a última mensagem do cliente entra cortada em 100 caracteres. Chaves de dedupe por janela (conversa que pede atenção = 1 por contato por hora; falha de resposta = 1 por contato a cada 30 min) evitam enxurrada quando o cliente manda várias mensagens.

---

## links.ts

**O que faz:** para onde o clique numa notificação leva. Puro, usado no client.

**Exporta:**

- `notificationHref({id, type, data}): string` — `/agenda?date=YYYY-MM-DD&n=<id>` (atendimento), `/conversas?phone=<telefone>&n=<id>` (conversa), `/configuracoes/whatsapp` (desconexão).

**Notas:** o `n=<id>` torna a URL única por notificação, então clicar de novo na mesma tela ainda dispara a navegação (as páginas reagem via `components/dashboard/UrlParamEffect.tsx`).

---

## relative-time.ts

**O que faz:** "agora", "há 5 min", "há 2 h", "ontem", "há 3 dias" e, a partir de 7 dias, "12/11" (com o ano se for outro ano); dia calculado em America/Sao_Paulo.

**Exporta:**

- `formatRelativeTime(iso, now?): string`

---

## professional.ts

**O que faz:** resolve o `professional_id` da sessão para as rotas de notificações. SERVER-ONLY.

**Exporta:**

- `getSessionProfessionalId(): Promise<{status:'ok', professionalId} | {status:'unauthorized'} | {status:'no_profile'}>`

**Notas:** o id nunca vem da entrada da requisição.

---

## Testes

`messages.test.ts`, `links.test.ts`, `relative-time.test.ts` — rodam em `npm test`.
