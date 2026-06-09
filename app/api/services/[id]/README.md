# app/api/services/[id]/

## route.ts

- **`PATCH /api/services/[id]`** — atualiza campos do serviço (`name`,
  `duration_min`, `price_cents`, `active`). 409 se o nome colidir; 404 se não
  for do profissional.
- **`DELETE /api/services/[id]`** — exclui o serviço. Os appointments que o
  referenciavam ficam com `service_id = null` (FK `on delete set null`).

**Depende de:** `auth`, `lib/supabase`.
