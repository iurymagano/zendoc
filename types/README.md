# types/

Tipos TypeScript compartilhados entre frontend e backend.

## database.ts

**O que faz:** espelha o schema do Supabase em TypeScript — interfaces e unions
usados em toda a aplicação.

**Exporta:**

- Unions: `PlanStatus`, `AppointmentStatus`, `BookedVia`, `BlockType`,
  `ExceptionType`, `ReminderType`, `ReminderStatus`, `ConversationRole`,
  `AIAction` (inclui `confirm`), `RecurrenceFrequency`, `PersonalReminderStatus`,
  `NotificationType`
- Interfaces: `Professional` (com `buffer_min`), `Appointment` (com
  `recurrence_id` e `service_id`), `AvailabilityWeekly`, `AvailabilityException`,
  `Patient`, `Reminder`, `ConversationMessage`, `AIResponse`, `GoogleBusyEvent`,
  `Recurrence`, `Service`, `PersonalReminder` (lembrete pessoal do
  Assistente), `AssistantMessage` (histórico do chat do Assistente),
  `AssistantPendingAction` (cancelar/remarcar preparado, aguardando confirmação;
  com `AssistantPendingKind`/`AssistantPendingStatus`), `AppNotification`
  (aviso do sino do painel) e `NotificationData` (ids/datas usados para navegar
  a partir do aviso)

**Notas:** mantém paridade com o SQL em `CLAUDE.md`. Atualizar os dois lados em
conjunto quando o schema mudar. `Patient.cpf` é `string | null` (dígitos puros,
sem máscara). `Professional` ganhou as colunas `google_*` (tokens + estado da
conexão Google Calendar) e `Appointment.google_event_id` (espelho no Google) —
ver migration `supabase/migrations/0002_google_calendar.sql`.
`Patient.messaging_opted_out` (LGPD — opor-se a mensagens ativas, migration `0007`).
`PersonalReminder` e `AssistantMessage` vêm da migration `0008` (Assistente pessoal);
`AssistantPendingAction`, da `0009` (confirmação em duas etapas do cancelar/remarcar);
`AppNotification`, da `0010` (notificações dentro do app).

## next-auth.d.ts

**O que faz:** aumenta o tipo `Session` do NextAuth para incluir `user.id`.

**Notas:** módulo de declaração — nunca importar diretamente.
