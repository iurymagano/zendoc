# app/api/recurrences/materialize/

## route.ts

**O que faz:** `GET|POST` — cron que mantém as séries ativas materializadas ~8
semanas à frente. Itera todas as `recurrences` ativas e chama
`materializeRecurrence` (idempotente). Autenticado por
`Authorization: Bearer ${CRON_SECRET}`.

**Resposta:** `{ ok: true, recurrences, created }`. 401 sem o secret.

**Depende de:** `lib/supabase`, `lib/recurrences/service` (`materializeRecurrence`).

**Notas:** agendado em `vercel.json` (`0 6 * * *` — diário às 6h UTC).
