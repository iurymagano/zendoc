# app/api/assistant/reminders/[id]/cancel/

Cancela um lembrete pessoal pendente.

## route.ts

**Endpoint:** `POST /api/assistant/reminders/:id/cancel` (sem corpo)

**Resposta 200:** `{ "ok": true }`

**Erros:** 401, 400 (id não é UUID), 404 (perfil ausente **ou** lembrete que não é do
profissional / já foi enviado ou cancelado), 500.

**Notas:** o `update` filtra por `id` + `professional_id` + `status = 'pending'` — um lembrete de
outro profissional ou já enviado nunca é alterado. O cron também só envia `pending`, então
cancelar a tempo impede o envio.
