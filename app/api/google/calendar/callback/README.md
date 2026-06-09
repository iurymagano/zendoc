# app/api/google/calendar/callback/

## route.ts

**O que faz:** `GET` — callback do OAuth. Valida `state` (CSRF + professionalId),
confere que a sessão é dona do profissional, troca o `code` por tokens, persiste
`google_refresh_token`/`google_access_token`/`google_email` e marca
`google_calendar_connected=true`. Em seguida dispara `syncBusyEvents` + `setupWatch`
(best-effort). Sempre redireciona para `/configuracoes/google?...`.

**Query de retorno:** `connected=1` no sucesso; `error=<código>` em falha
(`invalid_state`, `exchange_failed`, `no_refresh_token`, `forbidden`, …).

**Depende de:** `auth`, `lib/supabase`, `lib/google/auth`, `lib/google/calendar`.

**Notas:** sem `refresh_token` → `error=no_refresh_token` (orienta revogar o
acesso e reconsentir).
