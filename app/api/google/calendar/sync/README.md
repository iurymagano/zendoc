# app/api/google/calendar/sync/

## route.ts

**O que faz:** `GET|POST` — pull incremental do Google. Dois modos:

- **Sessão** (usuário logado): sincroniza só o próprio profissional. Usado pelo
  botão "Sincronizar agora" e como fallback em dev (sem webhook público).
- **Cron** (`Authorization: Bearer CRON_SECRET`): sincroniza todos os conectados
  e renova watches que expiram em < 24h.

**Resposta:** sessão → `{ ok, upserted, removed }`; cron → `{ ok, synced }`.
401 sessão inválida. Se o Google não estiver conectado, responde 200 silencioso
`{ ok: true, connected: false }` (a agenda chama em auto-sync sem saber o estado).

**Depende de:** `auth`, `lib/supabase`, `lib/google/calendar` (`syncBusyEvents`, `setupWatch`).

**Notas:** agendado em `vercel.json` a cada 30 min.
