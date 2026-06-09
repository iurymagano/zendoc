# app/api/google/calendar/webhook/

## route.ts

**O que faz:** `POST` — recebe o push do Google (watch). O Google não envia corpo
útil, só headers: `X-Goog-Resource-State` (`sync` no handshake | `exists` em
mudança), `X-Goog-Channel-ID` e `X-Goog-Channel-Token` (= professionalId que
passamos no `setupWatch`). Em `exists`, valida canal+token contra o banco e
dispara `syncBusyEvents` do profissional dono do canal.

**Resposta:** sempre `{ ok: true }` (200) — evita retries do Google em canais
desconhecidos/rotacionados.

**Depende de:** `lib/supabase`, `lib/google/calendar` (`syncBusyEvents`).

**Notas:** exige `NEXT_PUBLIC_URL` HTTPS público. Em dev (sem tunnel) o watch
não é registrado e a sincronização vem do botão manual / cron de `sync/`.
