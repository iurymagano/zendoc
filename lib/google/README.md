# lib/google/

Integração com o **Google Calendar** — sincronização mão-dupla entre os
agendamentos do IAzen e o Google Agenda do profissional. Usa `fetch` direto na
API REST do Google (sem SDK), no mesmo estilo de `lib/zapi/`.

Anti-loop: todo evento criado pelo IAzen leva
`extendedProperties.private.iazenAppointmentId`. No pull, eventos com essa tag
são ignorados (já são appointments); o restante vira `google_busy_events` e
bloqueia disponibilidade.

---

## auth.ts

**O que faz:** OAuth2 dedicado do Google Calendar (separado do login NextAuth) —
monta a URL de consentimento, troca o `code` por tokens, renova o access token
via refresh token e persiste no banco.

**Exporta:**

- `GOOGLE_CALENDAR_SCOPES: string` — escopos pedidos (`openid email calendar.events`)
- `calendarRedirectUri(): string` — `${NEXT_PUBLIC_URL}/api/google/calendar/callback`
- `signState(professionalId): string` / `verifyState(state): string | null` —
  state assinado (HMAC com `NEXTAUTH_SECRET`), embute o professionalId, expira em 10 min
- `buildConsentUrl(state): string` — URL de consentimento (`access_type=offline`, `prompt=consent`)
- `exchangeCode(code): Promise<GoogleTokens>` — troca o code por tokens
- `emailFromIdToken(idToken?): string | null` — lê o email do id_token (sem verificar assinatura)
- `getAccessToken(professional): Promise<string>` — access token válido, renovando + persistindo quando expirado
- `revokeToken(token): Promise<void>` — revoga no endpoint do Google

**Depende de:** `lib/supabase` (persistir tokens), `types/database`.

**Notas:** sem `refresh_token` (faltou `prompt=consent` ou consentimento prévio)
a conexão não se sustenta — o callback trata isso com erro `no_refresh_token`.

---

## calendar.ts

**O que faz:** operações na API REST do Calendar — push/delete de eventos
espelhando appointments e pull incremental dos compromissos pessoais.

**Exporta:**

- `pushAppointment(professional, appointment): Promise<string | null>` — cria
  (ou atualiza, se houver `google_event_id`) o evento; grava o id de volta no
  appointment; recria se o evento sumiu (404)
- `deleteAppointmentEvent(professional, eventId): Promise<void>` — remove o evento (410/404 = ok)
- `syncBusyEvents(professional): Promise<{upserted, removed}>` — pull incremental
  via `syncToken` (sync inicial = janela de 45 dias); upsert/delete em
  `google_busy_events`; persiste o `nextSyncToken`; reseta em 410 Gone
- `setupWatch(professional): Promise<void>` — registra canal de push apontando
  pro webhook (só quando `NEXT_PUBLIC_URL` é https; em dev usa sync manual/cron)
- `stopWatch(professional): Promise<void>` — encerra o canal

**Depende de:** `lib/google/auth` (access token), `lib/supabase`, `types/database`.

**Notas:** fuso fixo `America/Sao_Paulo` nos eventos. `getAccessToken` recebe o
profissional com as colunas de token — passe sempre a linha fresca do banco.

---

## appointment-sync.ts

**O que faz:** ponte best-effort chamada pelos endpoints/IA após escrever um
appointment — reflete o estado no Google sem nunca quebrar a operação principal.

**Exporta:**

- `syncAppointmentToGoogle(appointment): Promise<void>` — ativo
  (scheduled/confirmed/pending_approval) → cria/atualiza; inativo
  (cancelled/no_show) → remove o evento. Carrega o profissional internamente;
  no-op se o Google não estiver conectado. Nunca lança (apenas loga).

**Depende de:** `lib/google/calendar`, `lib/supabase`, `types/database`.

**Usado por:** `app/api/appointments/route.ts` (POST),
`app/api/appointments/[id]/route.ts` (PATCH),
`app/api/appointments/[id]/cancel/route.ts` (POST) e `lib/ai/executor.ts`.
