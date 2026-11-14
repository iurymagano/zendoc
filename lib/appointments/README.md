# lib/appointments/

Utilitários de domínio para appointments reutilizados pelas API routes.

## conflicts.ts

**O que faz:** checa sobreposição entre um novo/editado appointment e os
existentes na agenda do profissional.

**Exporta:**

- `hasAppointmentConflict(professionalId, startsAt, endsAt, excludeId?): Promise<boolean>` —
  retorna `true` se houver pelo menos um appointment ativo (status
  `scheduled`, `confirmed` ou `pending_approval`) cuja janela se sobrepõe à
  informada. `excludeId` é usado ao editar um appointment (ignora a si
  mesmo).
- `findConflictingAppointments(professionalId, startsAt, endsAt, excludeId?, limit = 3): Promise<ConflictingAppointment[]>` —
  mesma regra, mas devolve os agendamentos que conflitam (`id`, `patient_name`,
  `starts_at`, `ends_at`); o Assistente usa para explicar o conflito.

**Regra de sobreposição:** `existing.starts_at < new_ends AND existing.ends_at > new_starts`.
Intervalos que apenas se tocam na borda (ex.: um termina 15:00 e outro começa
15:00) **não** são considerados conflito.

**Depende de:** `@/lib/supabase`.

---

## reminders.ts

**O que faz:** mantém os lembretes (tabela `reminders`, 24h/2h) coerentes com
mudanças num agendamento.

**Exporta:**

- `rescheduleAppointmentReminders(appointmentId, newStartsAt): Promise<void>` —
  recalcula `scheduled_for` dos lembretes `pending` (24h e 2h antes do novo
  horário). Não toca nos já enviados/cancelados. O trigger do banco só cria
  lembretes no insert/mudança de status, então remarcar sem isso deixava o
  lembrete no horário antigo.
- `cancelPendingAppointmentReminders(appointmentId): Promise<void>` — cancela
  os lembretes pendentes (compromissos pessoais do Assistente não têm cliente
  para receber mensagem).

**Depende de:** `@/lib/supabase`.

**Notas:** best-effort — erros são só logados.
