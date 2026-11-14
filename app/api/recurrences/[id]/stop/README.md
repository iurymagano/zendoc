# app/api/recurrences/[id]/stop/

## route.ts

**O que faz:** `POST` — encerra a série: desativa a recorrência (`active=false`)
e cancela as ocorrências **futuras** ainda ativas (remove os eventos no Google).
Os atendimentos passados e os já editados individualmente permanecem.

**Resposta:** `{ ok: true, cancelled }`. 401 sem sessão; 404 sem perfil.

**Depende de:** `auth`, `lib/recurrences/service` (`stopRecurrence`).
