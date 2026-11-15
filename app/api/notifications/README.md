# app/api/notifications/

API das notificações do sino do painel. Todas as rotas começam com `auth()`; o `professional_id` vem sempre da sessão (via `lib/notifications/professional.ts`), nunca da entrada, e toda query filtra por ele (a service key ignora RLS).

Respostas comuns: `401 { error: 'Não autorizado' }` sem sessão; `404 { error: 'Perfil não encontrado' }` sem perfil de profissional; `500` em erro de banco.

---

## route.ts

**O que faz:** lista as notificações do profissional logado.

**Exporta:**

- `GET /api/notifications` — últimas 30 (mais novas primeiro) + total de não lidas.
  - Query opcional: `?since=<ISO 8601 com offset>` devolve só as criadas depois desse instante (o `unreadCount` continua sendo o total). `since` inválido → `400`.
  - Resposta `200`: `{ notifications: AppNotificationItem[], unreadCount: number }` (colunas `id, type, title, body, data, read_at, created_at`).

**Depende de:** `lib/notifications/professional.ts`, `lib/supabase.ts`, `types/database.ts`.

---

## [id]/read/route.ts

**O que faz:** marca uma notificação como lida.

**Exporta:**

- `POST /api/notifications/[id]/read` — sem corpo. Resposta `200 { ok: true }`. `400` se o id não é uuid; `404` se a notificação não existe ou não é do profissional.

**Notas:** idempotente: marcar uma notificação já lida também responde 200.

---

## read-all/route.ts

**O que faz:** marca todas as notificações não lidas do profissional como lidas.

**Exporta:**

- `POST /api/notifications/read-all` — sem corpo. Resposta `200 { ok: true, updated: number }` (quantas foram marcadas).
