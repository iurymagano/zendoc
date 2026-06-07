# types/

Tipos TypeScript compartilhados entre frontend e backend.

## database.ts

**O que faz:** espelha o schema do Supabase em TypeScript — interfaces e unions
usados em toda a aplicação.

**Exporta:**

- Unions: `PlanStatus`, `AppointmentStatus`, `BookedVia`, `BlockType`,
  `ExceptionType`, `ReminderType`, `ReminderStatus`, `ConversationRole`, `AIAction`
- Interfaces: `Professional`, `Appointment`, `AvailabilityWeekly`,
  `AvailabilityException`, `Patient`, `Reminder`, `ConversationMessage`, `AIResponse`

**Notas:** mantém paridade com o SQL em `CLAUDE.md`. Atualizar os dois lados em
conjunto quando o schema mudar. `Patient.cpf` é `string | null` (dígitos puros,
sem máscara).

## next-auth.d.ts

**O que faz:** aumenta o tipo `Session` do NextAuth para incluir `user.id`.

**Notas:** módulo de declaração — nunca importar diretamente.
