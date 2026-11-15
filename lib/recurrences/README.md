# lib/recurrences/

Atendimentos recorrentes. A recorrência guarda a **regra**; os appointments são
**materializados** (linhas reais), então reaproveitam lembretes, checagem de
conflito e o sync do Google sem tratamento especial.

---

## service.ts

**O que faz:** materialização e encerramento de séries recorrentes.

**Exporta:**

- `materializeRecurrence(recurrence, horizonWeeks = 8, { includePastStart = false }): Promise<{created, skipped}>`
  — cria as próximas ocorrências como appointments na janela
  `[hoje, hoje + horizonWeeks]` (limitada por `until`). **Idempotente**: pula
  dias já materializados e horários em conflito. Cada appointment criado é
  espelhado no Google (best-effort). Backstop de 60 ocorrências por execução.
  `includePastStart` (só o `POST /api/recurrences` passa `true`) cria também a
  1ª data quando ela já passou: é o dia escolhido no formulário, e sem isso ele
  sumia da agenda (bug de 14/11/2026). O cron diário nunca cria no passado.
- `stopRecurrence(recurrenceId, professionalId): Promise<{cancelled}>` — desativa
  a recorrência e cancela as ocorrências **futuras** ainda ativas (remove os
  eventos no Google). Passadas e editadas individualmente ficam intactas. Gera UM
  aviso no sino para a série inteira (`notifyRecurrenceStopped`, nasce lido) e não
  gera nada se não havia ocorrência futura.

**Depende de:** `./dates` (`occurrenceDates`), `@/lib/supabase`, `@/lib/appointments/conflicts`
(`hasAppointmentConflict`), `@/lib/google/appointment-sync`,
`@/lib/notifications/events`, `@/types/database`.

**Notas:** cadência ancorada em `recurrence.start_date` (paridade do quinzenal).
Datas calculadas em yyyy-MM-dd no fuso `America/Sao_Paulo`, sem armadilha de DST
(passo via meio-dia UTC). ISO sempre com offset `-03:00`.

---

## dates.ts

**O que faz:** cálculo puro das datas de uma série (sem banco), testado em `dates.test.ts`.

**Exporta:**

- `occurrenceDates(rule, opts): string[]` — datas yyyy-MM-dd a cada
  `intervalWeeks` desde `startDate`, dentro de `[today, today + horizonWeeks]` e
  até `until`. Com `includePastStart`, a 1ª data entra mesmo se já passou (só
  ela; as seguintes que já passaram nunca entram).
- `addDaysKey(dateKey, days): string` — soma dias a yyyy-MM-dd via meio-dia UTC.

**Depende de:** nada.

## dates.test.ts

**O que faz:** testes de `occurrenceDates` (caso real do bug: quinzenal criada em
14/11 começando na quinta 12/11) e de `addDaysKey`.
