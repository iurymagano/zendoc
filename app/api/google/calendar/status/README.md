# app/api/google/calendar/status/

## route.ts

**O que faz:** `GET` — estado da conexão Google do profissional logado, para a UI.

**Resposta:** `{ connected, email, calendarId, pushActive }`. `pushActive` indica
se há watch ativo (push automático) ou se a UI deve oferecer "sincronizar agora".
401 sem sessão; 404 sem perfil.

**Depende de:** `auth`, `lib/supabase`.
