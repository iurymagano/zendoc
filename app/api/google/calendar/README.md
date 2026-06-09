# app/api/google/calendar/

Integração **mão-dupla** com o Google Calendar. OAuth dedicado (separado do
login NextAuth) com `access_type=offline` + escopo `calendar.events`; o
refresh token fica em `professionals.google_refresh_token`. A lógica vive em
[lib/google/](../../../../lib/google/); estas rotas são a casca HTTP.

**Push (IAzen → Google):** disparado em `lib/google/appointment-sync.ts`, não aqui.
**Pull (Google → IAzen):** `webhook` (push em tempo real, exige HTTPS público) ou
`sync` (manual/cron, fallback p/ dev). Eventos pessoais viram `google_busy_events`
e bloqueiam disponibilidade; eventos criados pelo IAzen são ignorados no pull.

**Env:** reutiliza `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (do login). Exige
o redirect URI `${NEXT_PUBLIC_URL}/api/google/calendar/callback` cadastrado no
Google Cloud Console. Cron usa `CRON_SECRET`.

## Subpastas

- [connect/](./connect/) — `GET` redireciona pro consentimento do Google
- [callback/](./callback/) — `GET` troca o code, persiste tokens, sync inicial + watch
- [status/](./status/) — `GET` estado da conexão (connected, email, pushActive)
- [sync/](./sync/) — `GET|POST` pull incremental (sessão = próprio; cron = todos)
- [disconnect/](./disconnect/) — `POST` para watch, revoga token, zera colunas
- [webhook/](./webhook/) — `POST` recebe o push do Google e dispara o pull
