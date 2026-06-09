# app/api/google/calendar/connect/

## route.ts

**O que faz:** `GET` — inicia o OAuth do Google Calendar. Resolve o profissional
da sessão, assina o state (CSRF) e redireciona pra URL de consentimento do Google.

**Resposta:** 302 para o Google. 401 → `/login` sem sessão; 404 sem perfil; 500
se `GOOGLE_CLIENT_ID/SECRET` ausentes.

**Depende de:** `auth`, `lib/supabase`, `lib/google/auth` (`buildConsentUrl`, `signState`).

**Notas:** acessado por navegação direta (link/botão), não por fetch.
