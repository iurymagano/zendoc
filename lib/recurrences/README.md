# lib/recurrences/

Consultas recorrentes. A recorrência guarda a **regra**; os appointments são
**materializados** (linhas reais), então reaproveitam lembretes, checagem de
conflito e o sync do Google sem tratamento especial.

---

## service.ts

**O que faz:** materialização e encerramento de séries recorrentes.

**Exporta:**

- `materializeRecurrence(recurrence, horizonWeeks = 8): Promise<{created, skipped}>`
  — cria as próximas ocorrências como appointments na janela
  `[hoje, hoje + horizonWeeks]` (limitada por `until`). **Idempotente**: pula
  dias já materializados e horários em conflito. Cada appointment criado é
  espelhado no Google (best-effort). Backstop de 60 ocorrências por execução.
- `stopRecurrence(recurrenceId, professionalId): Promise<{cancelled}>` — desativa
  a recorrência e cancela as ocorrências **futuras** ainda ativas (remove os
  eventos no Google). Passadas e editadas individualmente ficam intactas.

**Depende de:** `@/lib/supabase`, `@/lib/appointments/conflicts`
(`hasAppointmentConflict`), `@/lib/google/appointment-sync`, `@/types/database`.

**Notas:** cadência ancorada em `recurrence.start_date` (paridade do quinzenal).
Datas calculadas em yyyy-MM-dd no fuso `America/Sao_Paulo`, sem armadilha de DST
(passo via meio-dia UTC). ISO sempre com offset `-03:00`.
