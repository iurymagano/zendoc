# app/api/assistant/reminders/

Lembretes pessoais (`personal_reminders`) do profissional logado. Eles são **criados pelo chat**
(ferramenta `create_reminder`) e **enviados pelo cron** `/api/reminders/dispatch`; aqui só se
lista e cancela.

## route.ts

**Endpoint:** `GET /api/assistant/reminders`

**Resposta 200:**

```json
{
  "pending": [{ "id", "text", "remind_at", "status", "sent_at", "error_message" }],
  "recent":  [{ "id", "text", "remind_at", "status", "sent_at", "error_message" }]
}
```

`pending` = até 50 pendentes (o mais próximo primeiro); `recent` = os 5 últimos `sent`/`failed`
(a UI mostra o motivo da falha, ex.: "WhatsApp não conectado").

**Erros:** 401, 404, 500.

## [id]/cancel/

`POST /api/assistant/reminders/:id/cancel` — ver [[id]/cancel/README.md](./[id]/cancel/README.md).
