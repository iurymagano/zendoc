# app/api/appointments/[id]/

Operações em um appointment específico.

## route.ts

**Endpoints:**

- `GET /api/appointments/:id` — retorna `{ appointment }` ou 404.
- `PATCH /api/appointments/:id` — atualiza campos parciais.

**Payload do PATCH (todos opcionais):**

```json
{
  "status": "scheduled" | "confirmed" | "pending_approval" | "no_show",
  "starts_at": "2026-05-10T10:00:00-03:00",
  "ends_at":   "2026-05-10T10:50:00-03:00",
  "patient_name": "Maria Silva",
  "patient_phone": "5511999998888",
  "notes": "texto livre"
}
```

Regras:

- `starts_at` e `ends_at` precisam vir juntos. Quando presentes, é feita a
  checagem de sobreposição via `hasAppointmentConflict` (ignorando o próprio
  registro).
- **Telefone** (`patient_phone`): em agendamento de cliente é obrigatório e
  validado/normalizado (`5511...`; vazio ou inválido → 400). Em **compromisso
  pessoal** (sem cliente, `patient_phone` vazio) o campo pode vir vazio e nada
  muda; preenchê-lo é recusado (400) — para atender alguém, crie um novo
  agendamento. Regra em `lib/appointments/personal.ts` (`resolvePhonePatch`).
- **Lembretes:** quando `starts_at` muda, os lembretes `pending` (24h/2h) são
  recalculados para o novo horário (`rescheduleAppointmentReminders`); o trigger
  do banco só cria lembretes no insert/mudança de status. Compromisso pessoal
  não tem lembrete de cliente. Lembrete já enviado não é reenviado.
- Depois do update o evento é sincronizado com o Google Agenda (best-effort).
- Para **cancelar** um appointment use
  [POST /api/appointments/:id/cancel](./cancel/README.md) — cancelamento
  passa por lá porque grava `cancelled_by = 'professional'` e aceita
  `cancellation_note`.

**Erros:** `400` (validação, telefone), `401`, `404`, `409` (conflito), `500`.

## Subpastas

- [cancel/](./cancel/) — `POST /api/appointments/:id/cancel` para cancelar com
  motivo.
