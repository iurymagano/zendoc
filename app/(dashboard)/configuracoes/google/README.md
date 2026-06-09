# app/(dashboard)/configuracoes/google/

Tela de conexão com o **Google Agenda** (integração mão-dupla).

## page.tsx

**O que faz:** client component que mostra o estado da conexão e os controles de
conectar/desconectar/sincronizar.

**Fluxo:**

1. `GET /api/google/calendar/status` → `{ connected, email, calendarId, pushActive }`.
2. **Desconectado:** botão "Conectar Google Agenda" → navega para
   `/api/google/calendar/connect` (inicia o OAuth; o callback volta com
   `?connected=1` ou `?error=<código>`, ambos tratados aqui).
3. **Conectado:** mostra a conta Google, se o push automático está ativo, e os
   botões "Sincronizar agora" (`POST /api/google/calendar/sync`) e "Desconectar"
   (`POST /api/google/calendar/disconnect`).

**Depende de:** `@/components/ui/{button,card}`, `@/components/dashboard/PageHeader`,
`next/navigation` (`useSearchParams`), as rotas `/api/google/calendar/*`.

**Notas:** os códigos de erro do callback têm mensagens em `ERROR_LABELS`
(ex.: `no_refresh_token` orienta revogar o acesso e reconsentir).
