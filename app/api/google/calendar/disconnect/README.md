# app/api/google/calendar/disconnect/

## route.ts

**O que faz:** `POST` — desconecta o Google Agenda do profissional logado: para
o watch (`stopWatch`), revoga o refresh token no Google e zera todas as colunas
`google_*`. Apaga também os `google_busy_events` importados.

**Resposta:** `{ ok: true }`. 401 sem sessão; 404 sem perfil.

**Depende de:** `auth`, `lib/supabase`, `lib/google/auth` (`revokeToken`),
`lib/google/calendar` (`stopWatch`).

**Notas:** mantém os `google_event_id` já gravados nos appointments (inertes —
não serão mais atualizados).
